// =============================================
// AI Automation Types
// =============================================

export type NodeCategory = "trigger" | "ai" | "transform" | "integration" | "output";

export type AutomationNodeType =
  // Triggers
  | "trigger_upload"
  | "trigger_webhook"
  | "trigger_schedule"
  // AI
  | "ai_nvidia_nim"
  | "ai_openai"
  | "ai_text_extract"
  | "ai_image_analyze"
  // Transform
  | "transform_json_parse"
  | "transform_text_summarize"
  | "transform_filter"
  | "transform_formatter"
  | "transform_code"
  // Integrations
  | "integration_github"
  | "integration_google_drive"
  | "integration_gmail"
  // Output
  | "output_display"
  | "output_save"
  | "output_webhook";

export interface NodeField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "toggle" | "code" | "file";
  placeholder?: string;
  options?: { label: string; value: string }[];
  defaultValue?: string | number | boolean;
  required?: boolean;
  description?: string;
}

export interface AutomationNodeDef {
  type: AutomationNodeType;
  category: NodeCategory;
  label: string;
  description: string;
  icon: string; // emoji or icon name
  color: string; // tailwind color class
  fields: NodeField[];
  inputs: number; // 0 = trigger
  outputs: number;
}

export interface AutomationNodeData extends Record<string, unknown> {
  nodeType: AutomationNodeType;
  label: string;
  config: Record<string, string | number | boolean>;
  status?: "idle" | "running" | "success" | "error";
  output?: unknown;
  error?: string;
}

export interface AutomationProject {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  workflowCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationWorkflow {
  id: string;
  projectId: string;
  name: string;
  description: string;
  isActive: boolean;
  nodes: SerializedNode[];
  edges: SerializedEdge[];
  createdAt: string;
  updatedAt: string;
  lastRun?: string;
  runCount: number;
}

export interface SerializedNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: AutomationNodeData;
}

export interface SerializedEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  animated?: boolean;
}
