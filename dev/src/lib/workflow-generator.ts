import OpenAI from "openai";
import { NIM_BASE_URL, NIM_MODELS } from "./constants";
import { WorkflowNode, WorkflowEdge } from "@/types";

function getNimClient() {
  if (!process.env.NVIDIA_NIM_API_KEY) {
    throw new Error("NVIDIA_NIM_API_KEY is not configured");
  }
  return new OpenAI({
    apiKey: process.env.NVIDIA_NIM_API_KEY,
    baseURL: NIM_BASE_URL,
  });
}

export async function generateWorkflowFromTranscript(transcriptText: string) {
  const client = getNimClient();
  const systemPrompt = `You are an expert meeting analyst. Create a chronological workflow graph (nodes and edges) representing the sequence of events, discussion topics, decisions, and action items in the meeting transcript. 
Return ONLY valid JSON with this schema:
{
  "nodes": [
    {
      "id": "string (unique string)",
      "data": {
        "label": "string (short title)",
        "description": "string (brief details)",
        "type": "start" | "event" | "topic" | "decision" | "action" | "end"
      }
    }
  ],
  "edges": [
    {
      "id": "string (unique string)",
      "source": "string (node id)",
      "target": "string (node id)"
    }
  ]
}

Ensure:
- The graph flows logically from start to end (must include a 'start' and 'end' node).
- Build the edges chronologically based on what happened first, next, and last.
- Use branching if topics are discussed in parallel or if multiple items span off one topic.
- A nodes array and an edges array must be provided.
- Do NOT include any markdown strings or backticks outside the JSON object. Just return RAW JSON.`;

  const completion = await client.chat.completions.create({
    model: NIM_MODELS["gpt-oss-120b"], // GPT-OSS 120b handles complex workflows better
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Transcript:\n\n${transcriptText}` }
    ],
    temperature: 0.1,
    max_tokens: 4096,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("No response from NIM model");
  
  const cleaned = content.trim().replace(/^```(?:json)?\n?|```$/g, "").trim();
  const parsed = JSON.parse(cleaned);
  
  // Inject default position since React Flow requires it, dagre will override it during render
  const nodes = (parsed.nodes || []).map((n: any) => ({
    ...n,
    position: { x: 0, y: 0 }
  })) as WorkflowNode[];
  
  // Clean up edges and add styling
  const edges = (parsed.edges || []).map((e: any, i: number) => ({
    ...e,
    id: e.id || `edge-${i}`,
    type: "smoothstep",
    animated: true,
  })) as WorkflowEdge[];

  return { nodes, edges };
}
