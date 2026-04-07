import { AutomationProject, AutomationWorkflow } from "@/types/automation";

const PROJECTS_KEY = "nexus_automation_projects";
const WORKFLOWS_KEY = "nexus_automation_workflows";

// ── Projects ──────────────────────────────────────────────────

export function getProjects(): AutomationProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProject(project: AutomationProject): void {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    projects[idx] = project;
  } else {
    projects.push(project);
  }
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function deleteProject(id: string): void {
  const projects = getProjects().filter((p) => p.id !== id);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  // Also delete all workflows in this project
  const workflows = getAllWorkflows().filter((w) => w.projectId !== id);
  localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(workflows));
}

// ── Workflows ─────────────────────────────────────────────────

export function getAllWorkflows(): AutomationWorkflow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WORKFLOWS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getWorkflows(projectId: string): AutomationWorkflow[] {
  return getAllWorkflows().filter((w) => w.projectId === projectId);
}

export function getWorkflow(id: string): AutomationWorkflow | undefined {
  return getAllWorkflows().find((w) => w.id === id);
}

export function saveWorkflow(workflow: AutomationWorkflow): void {
  const workflows = getAllWorkflows();
  const idx = workflows.findIndex((w) => w.id === workflow.id);
  if (idx >= 0) {
    workflows[idx] = workflow;
  } else {
    workflows.push(workflow);
  }
  localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(workflows));
  // Update project workflow count
  updateProjectWorkflowCount(workflow.projectId);
}

export function deleteWorkflow(id: string): void {
  const workflow = getWorkflow(id);
  const workflows = getAllWorkflows().filter((w) => w.id !== id);
  localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(workflows));
  if (workflow) updateProjectWorkflowCount(workflow.projectId);
}

function updateProjectWorkflowCount(projectId: string): void {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx >= 0) {
    projects[idx].workflowCount = getAllWorkflows().filter(
      (w) => w.projectId === projectId
    ).length;
    projects[idx].updatedAt = new Date().toISOString();
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Seed demo data ────────────────────────────────────────────

export function seedDemoDataIfEmpty(): void {
  if (typeof window === "undefined") return;
  const existing = getProjects();
  if (existing.length > 0) return;

  const projectId = generateId();
  const wf1Id = generateId();
  const wf2Id = generateId();

  const demoProject: AutomationProject = {
    id: projectId,
    name: "Document Processing",
    description: "AI-powered document and image analysis pipelines",
    icon: "📄",
    color: "violet",
    workflowCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const demoWorkflow1: AutomationWorkflow = {
    id: wf1Id,
    projectId,
    name: "Image to JSON Summary",
    description: "Upload photo → NVIDIA NIM OCR → Summarize → Parse JSON",
    isActive: true,
    runCount: 47,
    lastRun: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [
      {
        id: "n1",
        type: "automationNode",
        position: { x: 80, y: 200 },
        data: {
          nodeType: "trigger_upload",
          label: "Upload Photo",
          config: { fileTypes: "image/*", maxSizeMb: 10 },
          status: "idle",
        },
      },
      {
        id: "n2",
        type: "automationNode",
        position: { x: 360, y: 200 },
        data: {
          nodeType: "ai_nvidia_nim",
          label: "NVIDIA NIM",
          config: {
            model: "nvidia/llama-3.2-11b-vision-instruct",
            systemPrompt: "You are an OCR expert.",
            userMessage: "Extract all text from this image.",
            temperature: 0.1,
            maxTokens: 2048,
            responseFormat: "text",
          },
          status: "idle",
        },
      },
      {
        id: "n3",
        type: "automationNode",
        position: { x: 640, y: 200 },
        data: {
          nodeType: "ai_text_extract",
          label: "OCR Text Extraction",
          config: {
            model: "nvidia/llama-3.2-11b-vision-instruct",
            prompt: "Extract all text from this image. Return only the raw text.",
            outputFormat: "text",
          },
          status: "idle",
        },
      },
      {
        id: "n4",
        type: "automationNode",
        position: { x: 920, y: 200 },
        data: {
          nodeType: "ai_openai",
          label: "Summarize & JSON",
          config: {
            model: "gpt-4o-mini",
            systemPrompt: "Only respond with valid JSON. No markdown, no text outside JSON.",
            userMessage: "Summarize this text and return a JSON with fields: summary, key_points, word_count.\n\nText: {{input}}",
            temperature: 0.3,
            maxTokens: 1024,
            responseFormat: "json",
          },
          status: "idle",
        },
      },
      {
        id: "n5",
        type: "automationNode",
        position: { x: 1200, y: 200 },
        data: {
          nodeType: "transform_json_parse",
          label: "Parse JSON",
          config: { extractPath: "summary", onError: "throw" },
          status: "idle",
        },
      },
      {
        id: "n6",
        type: "automationNode",
        position: { x: 1480, y: 200 },
        data: {
          nodeType: "output_display",
          label: "Display Summary",
          config: { label: "Final Summary", format: "auto" },
          status: "idle",
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "n1", target: "n2", animated: true },
      { id: "e2-3", source: "n2", target: "n3", animated: true },
      { id: "e3-4", source: "n3", target: "n4", animated: true },
      { id: "e4-5", source: "n4", target: "n5", animated: true },
      { id: "e5-6", source: "n5", target: "n6", animated: true },
    ],
  };

  const demoWorkflow2: AutomationWorkflow = {
    id: wf2Id,
    projectId,
    name: "GitHub Issue Creator",
    description: "Webhook → Analyze → Create GitHub issue",
    isActive: false,
    runCount: 12,
    lastRun: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    nodes: [
      {
        id: "w2n1",
        type: "automationNode",
        position: { x: 80, y: 200 },
        data: {
          nodeType: "trigger_webhook",
          label: "Webhook Trigger",
          config: { method: "POST", authToken: "" },
          status: "idle",
        },
      },
      {
        id: "w2n2",
        type: "automationNode",
        position: { x: 360, y: 200 },
        data: {
          nodeType: "ai_nvidia_nim",
          label: "Analyze & Format",
          config: {
            model: "meta/llama-3.1-8b-instruct",
            systemPrompt: "You are a developer tool that creates GitHub issue descriptions.",
            userMessage: "Based on this input, create a detailed GitHub issue description: {{input}}",
            temperature: 0.5,
            maxTokens: 512,
            responseFormat: "text",
          },
          status: "idle",
        },
      },
      {
        id: "w2n3",
        type: "automationNode",
        position: { x: 640, y: 200 },
        data: {
          nodeType: "integration_github",
          label: "Create GitHub Issue",
          config: {
            action: "create_issue",
            repo: "myorg/myrepo",
            title: "Automated Issue",
            body: "{{input}}",
            labels: "automated, ai-generated",
          },
          status: "idle",
        },
      },
      {
        id: "w2n4",
        type: "automationNode",
        position: { x: 920, y: 200 },
        data: {
          nodeType: "output_display",
          label: "Show Result",
          config: { label: "Issue Created", format: "json" },
          status: "idle",
        },
      },
    ],
    edges: [
      { id: "e1", source: "w2n1", target: "w2n2", animated: true },
      { id: "e2", source: "w2n2", target: "w2n3", animated: true },
      { id: "e3", source: "w2n3", target: "w2n4", animated: true },
    ],
  };

  saveProject(demoProject);
  const workflows = [demoWorkflow1, demoWorkflow2];
  localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(workflows));
}
