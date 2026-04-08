import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { getValidGoogleToken } from "@/lib/google-oauth";
import { driveCreateDocument, driveUploadFile, driveListFiles } from "@/lib/google-drive";
import { gmailSendEmail } from "@/lib/gmail";
import { NIM_BASE_URL } from "@/lib/constants";
import { AutomationNodeType } from "@/types/automation";

export const maxDuration = 60;

function getNimClient() {
  return new OpenAI({ apiKey: process.env.NVIDIA_NIM_API_KEY || "", baseURL: NIM_BASE_URL });
}
function getGroqClient() {
  return new OpenAI({ apiKey: process.env.GROQ_API_KEY || "", baseURL: "https://api.groq.com/openai/v1" });
}
function interpolate(template: string, input: unknown): string {
  const s = typeof input === "string" ? input : JSON.stringify(input, null, 2);
  return template.replace(/\{\{input\}\}/g, s);
}
function extractJsonPath(obj: unknown, path: string): unknown {
  if (!path) return obj;
  const parts = path.split(".").flatMap((p) => {
    const m = p.match(/^(.+?)\[(\d+)\]$/);
    return m ? [m[1], parseInt(m[2])] : [p];
  });
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur == null) return undefined;
    cur = (cur as Record<string | number, unknown>)[part];
  }
  return cur;
}

export interface ExecuteNodeRequest {
  nodeType: AutomationNodeType;
  config: Record<string, string | number | boolean>;
  input: unknown;
  workflowId?: string;
}

export async function POST(req: Request) {
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;
  let userId: string | null = null;
  try {
    supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch { /* webhook/cron runs without a session */ }

  try {
    const body: ExecuteNodeRequest = await req.json();
    const output = await executeNode(
      body.nodeType, body.config, body.input, body.workflowId, userId, supabase
    );
    return NextResponse.json({ output });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Node execution failed";
    console.error("[automation/execute]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function executeNode(
  nodeType: AutomationNodeType,
  config: Record<string, string | number | boolean>,
  input: unknown,
  workflowId: string | undefined,
  userId: string | null,
  supabase: Awaited<ReturnType<typeof createClient>> | null
): Promise<unknown> {
  switch (nodeType) {

    // ── TRIGGERS ────────────────────────────────────────────────────────────

    case "trigger_upload": {
      if (input !== null && input !== undefined) return input;
      const uploadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/automation/upload?workflowId=${workflowId ?? ""}`;
      return {
        status: "awaiting_file",
        uploadUrl,
        acceptedTypes: (config.fileTypes as string) || "any",
        maxSizeMb: config.maxSizeMb || 10,
        message: `POST a multipart/form-data request with field 'file' to: ${uploadUrl}`,
      };
    }

    case "trigger_webhook": {
      if (input !== null && input !== undefined) return input;
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/automation/webhook?workflowId=${workflowId ?? ""}`;
      return {
        status: "registered",
        webhookUrl,
        method: (config.method as string) || "POST",
        message: "Workflow registered. Send a POST to webhookUrl to trigger execution.",
        ...(config.authToken && { auth: "Include Authorization: Bearer <token> header" }),
      };
    }

    // ── AI NODES ────────────────────────────────────────────────────────────

    case "ai_nvidia_nim": {
      const nim = getNimClient();
      const model = (config.model as string) || "meta/llama-3.1-8b-instruct";
      const systemPrompt = (config.systemPrompt as string) || "";
      const userMessage = interpolate((config.userMessage as string) || "{{input}}", input);
      const temperature = Number(config.temperature ?? 0.7);
      const maxTokens = Number(config.maxTokens ?? 1024);
      const responseFormat = (config.responseFormat as string) || "text";

      const messages: OpenAI.ChatCompletionMessageParam[] = [];
      if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
      messages.push({ role: "user", content: userMessage });

      const completion = await nim.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(responseFormat === "json" && { response_format: { type: "json_object" } }),
      });

      const text = completion.choices[0]?.message?.content ?? "";
      if (responseFormat === "json") { try { return JSON.parse(text); } catch { return text; } }
      return text;
    }

    case "ai_openai": {
      const groq = getGroqClient();
      const model = (config.model as string) || "gpt-4o-mini";
      const groqModelMap: Record<string, string> = {
        "gpt-4o": "llama-3.3-70b-versatile",
        "gpt-4o-mini": "llama-3.1-8b-instant",
        "gpt-4-turbo": "llama-3.3-70b-versatile",
        "gpt-3.5-turbo": "llama-3.1-8b-instant",
      };
      const systemPrompt = (config.systemPrompt as string) || "";
      const userMessage = interpolate((config.userMessage as string) || "{{input}}", input);
      const temperature = Number(config.temperature ?? 0.7);
      const maxTokens = Number(config.maxTokens ?? 1024);
      const responseFormat = (config.responseFormat as string) || "text";

      const messages: OpenAI.ChatCompletionMessageParam[] = [];
      if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
      messages.push({ role: "user", content: userMessage });

      const completion = await groq.chat.completions.create({
        model: groqModelMap[model] || "llama-3.1-8b-instant",
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(responseFormat === "json" && { response_format: { type: "json_object" } }),
      });

      const text = completion.choices[0]?.message?.content ?? "";
      if (responseFormat === "json") { try { return JSON.parse(text); } catch { return text; } }
      return text;
    }

    case "ai_text_extract": {
      const nim = getNimClient();
      const model = (config.model as string) || "nvidia/llama-3.2-11b-vision-instruct";
      const prompt = (config.prompt as string) ||
        "Extract all text from this image. Return only the raw text, preserving formatting.";
      const outputFormat = (config.outputFormat as string) || "text";
      const inputStr = typeof input === "string" ? input : JSON.stringify(input);
      const isVision = inputStr.startsWith("http") || inputStr.startsWith("data:image");
      const useVisionModel = isVision && (model.includes("vision") || model.includes("gpt-4o"));

      const messages: OpenAI.ChatCompletionMessageParam[] = isVision
        ? [{ role: "user", content: [{ type: "image_url", image_url: { url: inputStr } }, { type: "text", text: prompt }] }]
        : [
            { role: "system", content: "You are an expert text extraction assistant." },
            { role: "user", content: `${prompt}\n\nDocument:\n${inputStr}` },
          ];

      const completion = await nim.chat.completions.create({
        model: useVisionModel ? model : "meta/llama-3.1-8b-instruct",
        messages,
        max_tokens: 2048,
        temperature: 0.1,
      });

      const result = completion.choices[0]?.message?.content ?? "";
      if (outputFormat === "json") { try { return JSON.parse(result); } catch { return { text: result }; } }
      if (outputFormat === "markdown") return "```\n" + result + "\n```";
      return result;
    }

    case "ai_image_analyze": {
      const nim = getNimClient();
      const model = (config.model as string) || "nvidia/llama-3.2-11b-vision-instruct";
      const analysisType = (config.analysisType as string) || "describe";
      const promptMap: Record<string, string> = {
        describe: "Describe this image in comprehensive detail — objects, colours, composition, context, and any visible text.",
        objects:  "List every distinct object in this image with its approximate location and relative size.",
        text:     "Transcribe every piece of text visible in this image exactly as it appears, preserving layout.",
        emotion:  "Analyse the emotional tone, mood, and any human expressions or body language visible.",
        custom:   (config.customPrompt as string) || "What do you see in this image?",
      };

      const inputStr = typeof input === "string" ? input : JSON.stringify(input);
      if (!inputStr.startsWith("http") && !inputStr.startsWith("data:image")) {
        throw new Error(
          "ai_image_analyze requires an image URL or base64 data URL as input. " +
          "Connect it after a trigger_upload node or provide an image URL."
        );
      }

      const completion = await nim.chat.completions.create({
        model,
        messages: [{ role: "user", content: [
          { type: "image_url", image_url: { url: inputStr } },
          { type: "text", text: promptMap[analysisType] || promptMap.describe },
        ]}],
        max_tokens: 1024,
        temperature: 0.3,
      });
      return completion.choices[0]?.message?.content ?? "";
    }

    // ── TRANSFORM NODES ─────────────────────────────────────────────────────

    case "transform_json_parse": {
      const onError = (config.onError as string) || "throw";
      const extractPath = (config.extractPath as string) || "";
      const inputStr = typeof input === "string" ? input : JSON.stringify(input);
      try {
        const parsed = JSON.parse(inputStr);
        if (extractPath) {
          const val = extractJsonPath(parsed, extractPath);
          if (val === undefined) throw new Error(`Path '${extractPath}' not found in JSON`);
          return val;
        }
        return parsed;
      } catch (err) {
        if (onError === "raw") return inputStr;
        if (onError === "empty") return {};
        throw err;
      }
    }

    case "transform_text_summarize": {
      const summaryLength = (config.summaryLength as string) || "medium";
      const format = (config.format as string) || "text";
      const focus = (config.focus as string) || "";
      const lengthMap: Record<string, string> = {
        brief: "1-2 sentences", short: "one short paragraph",
        medium: "3-5 concise bullet points", detailed: "a comprehensive multi-section summary",
      };
      const formatInstr: Record<string, string> = {
        text: "Use plain prose.",
        bullets: "Use bullet points (•).",
        json: 'Return ONLY valid JSON: {"summary":"...","key_points":[...],"word_count":N}',
      };
      const nim = getNimClient();
      const completion = await nim.chat.completions.create({
        model: "meta/llama-3.1-8b-instruct",
        messages: [
          { role: "system", content: `You are an expert summarizer.${focus ? ` Focus on: ${focus}.` : ""}` },
          { role: "user", content: `Summarize in ${lengthMap[summaryLength]}.\n${formatInstr[format] || ""}\n\nText:\n${typeof input === "string" ? input : JSON.stringify(input)}` },
        ],
        max_tokens: 1024,
        temperature: 0.4,
        ...(format === "json" && { response_format: { type: "json_object" } }),
      });
      const result = completion.choices[0]?.message?.content ?? "";
      if (format === "json") { try { return JSON.parse(result); } catch { return result; } }
      return result;
    }

    case "transform_filter": {
      const condition = (config.condition as string) || "not_empty";
      const compareValue = (config.value as string) || "";
      const inputStr = typeof input === "string" ? input : JSON.stringify(input);
      let passed = false;
      switch (condition) {
        case "contains":     passed = inputStr.includes(compareValue); break;
        case "not_contains": passed = !inputStr.includes(compareValue); break;
        case "equals":       passed = inputStr === compareValue; break;
        case "not_empty":    passed = inputStr.trim().length > 0; break;
        case "custom": {
          const fn = new Function("input", (config.customExpression as string) || "return true;");
          passed = Boolean(fn(input));
          break;
        }
        default: passed = true;
      }
      return { passed, condition, data: input, message: passed ? `PASSED — '${condition}' met` : `BLOCKED — '${condition}' not met` };
    }

    case "transform_formatter": {
      return interpolate((config.template as string) || "{{input}}", input);
    }

    case "transform_code": {
      const fn = new Function("input", (config.code as string) || "return input;");
      return fn(input);
    }

    // ── INTEGRATIONS ────────────────────────────────────────────────────────

    case "integration_github": {
      const token = (config.githubToken as string) || process.env.GITHUB_TOKEN || "";
      if (!token) throw new Error("GitHub token required. Add 'githubToken' to the node config or set GITHUB_TOKEN env var.");
      const repo = (config.repo as string) || "";
      if (!repo) throw new Error("GitHub: 'repo' (owner/repo) is required.");
      const action = (config.action as string) || "create_issue";
      const body = interpolate((config.body as string) || "{{input}}", input);
      const title = interpolate((config.title as string) || "Automation Output", input);
      const labels = (config.labels as string)
        ? (config.labels as string).split(",").map((l) => l.trim()).filter(Boolean) : [];
      const apiBase = `https://api.github.com/repos/${repo}`;
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      };

      if (action === "create_issue") {
        const res = await fetch(`${apiBase}/issues`, { method: "POST", headers, body: JSON.stringify({ title, body, labels }) });
        if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
        const d = await res.json();
        return { issue_number: d.number, url: d.html_url, title: d.title, state: d.state };
      }
      if (action === "create_comment") {
        const issueNum = (config.issueNumber as string) ||
          (typeof input === "object" && input !== null ? (input as Record<string, unknown>).issue_number : null);
        if (!issueNum) throw new Error("GitHub create_comment: provide issueNumber in config or pass issue object as input.");
        const res = await fetch(`${apiBase}/issues/${issueNum}/comments`, { method: "POST", headers, body: JSON.stringify({ body }) });
        if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
        const d = await res.json();
        return { comment_id: d.id, url: d.html_url, issue_number: issueNum };
      }
      if (action === "create_pr") {
        const head = (config.head as string) || "";
        const base = (config.base as string) || "main";
        if (!head) throw new Error("GitHub create_pr: 'head' branch is required in node config.");
        const res = await fetch(`${apiBase}/pulls`, { method: "POST", headers, body: JSON.stringify({ title, body, head, base }) });
        if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
        const d = await res.json();
        return { pr_number: d.number, url: d.html_url, title: d.title, state: d.state };
      }
      if (action === "get_repo") {
        const res = await fetch(apiBase, { headers });
        if (!res.ok) throw new Error(`GitHub ${res.status}`);
        const d = await res.json();
        return { name: d.full_name, description: d.description, stars: d.stargazers_count, forks: d.forks_count, open_issues: d.open_issues_count, url: d.html_url };
      }
      throw new Error(`Unknown GitHub action: '${action}'`);
    }

    case "integration_google_drive": {
      if (!userId) throw new Error("Google Drive: authentication required. Make sure you are logged in.");
      const accessToken = await getValidGoogleToken(userId);
      const action = (config.action as string) || "create_doc";
      const folderId = (config.folderId as string) || undefined;
      const fileName = interpolate((config.fileName as string) || "Automation Output", input);
      const content = interpolate((config.content as string) || "{{input}}", input);

      if (action === "create_doc") return driveCreateDocument(accessToken, fileName, content, folderId);
      if (action === "upload")     return driveUploadFile(accessToken, fileName, content, "text/plain", folderId);
      if (action === "list")       { const files = await driveListFiles(accessToken, folderId); return { files, count: files.length }; }
      throw new Error(`Unknown Google Drive action: '${action}'`);
    }

    case "integration_gmail": {
      if (!userId) throw new Error("Gmail: authentication required. Make sure you are logged in.");
      const accessToken = await getValidGoogleToken(userId);
      const to = (config.to as string) || "";
      if (!to) throw new Error("Gmail: 'to' email address is required.");
      const subject = interpolate((config.subject as string) || "Automation Output", input);
      const body = interpolate((config.body as string) || "{{input}}", input);
      return gmailSendEmail(accessToken, { to, subject, body, isHtml: Boolean(config.isHtml ?? false) });
    }

    // ── OUTPUT NODES ────────────────────────────────────────────────────────

    case "output_display": {
      return input;
    }

    case "output_save": {
      if (!workflowId) throw new Error("output_save: workflowId is missing.");
      if (!supabase || !userId) throw new Error("output_save: authentication required.");
      const key = (config.key as string) || "automation-result";
      const format = (config.format as string) || "string";
      const stringValue = format === "json"
        ? JSON.stringify(input, null, 2)
        : typeof input === "string" ? input : JSON.stringify(input);

      const { data, error } = await supabase
        .from("automation_results")
        .upsert(
          { user_id: userId, workflow_id: workflowId, storage_key: key, value: stringValue, format },
          { onConflict: "user_id,workflow_id,storage_key" }
        )
        .select()
        .single();

      if (error) throw new Error(`output_save DB error: ${error.message}`);
      return {
        key,
        workflowId,
        savedAt: data.updated_at,
        size: `${stringValue.length} chars`,
        preview: stringValue.slice(0, 200) + (stringValue.length > 200 ? "…" : ""),
      };
    }

    case "output_webhook": {
      const url = (config.url as string) || "";
      if (!url) throw new Error("output_webhook: URL is required.");
      const method = (config.method as string) || "POST";
      let extraHeaders: Record<string, string> = {};
      if (config.headers) { try { extraHeaders = JSON.parse(config.headers as string); } catch { /* ignore */ } }
      const payload = typeof input === "string" ? input : JSON.stringify(input);
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...extraHeaders },
        body: method !== "GET" ? payload : undefined,
      });
      const responseText = await res.text();
      let responseBody: unknown = responseText;
      try { responseBody = JSON.parse(responseText); } catch { /* leave as text */ }
      return { status: res.status, statusText: res.statusText, url, method, body: responseBody };
    }

    default: {
      throw new Error(`Unknown node type: ${nodeType}`);
    }
  }
}
