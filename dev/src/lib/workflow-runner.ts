/**
 * Shared server-side workflow runner.
 * Calls /api/automation/execute for each node in topological order,
 * threading output → input through the chain.
 * Used by both the webhook trigger and the cron trigger.
 */

import { AutomationWorkflow, AutomationNodeData } from "@/types/automation";
import { getNodeDef } from "@/lib/automation-nodes";

export interface WorkflowRunResult {
  status: "success" | "error";
  log: { nodeLabel: string; status: "success" | "error"; output?: unknown; error?: string }[];
  finalOutput: unknown;
  error?: string;
}

export async function runWorkflow(
  workflow: AutomationWorkflow,
  initialInput: unknown = null,
  baseUrl: string
): Promise<WorkflowRunResult> {
  const { nodes, edges } = workflow;

  // ── Topological sort ────────────────────────────────────────
  const edgeMap = new Map<string, string[]>();
  edges.forEach((e) => {
    if (!edgeMap.has(e.source)) edgeMap.set(e.source, []);
    edgeMap.get(e.source)!.push(e.target);
  });

  const hasIncoming = new Set(edges.map((e) => e.target));
  const startNodes = nodes.filter((n) => !hasIncoming.has(n.id));

  const ordered: typeof nodes = [];
  const visited = new Set<string>();

  function traverse(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const node = nodes.find((n) => n.id === id);
    if (node) ordered.push(node);
    (edgeMap.get(id) ?? []).forEach(traverse);
  }
  startNodes.forEach((n) => traverse(n.id));

  // ── Execute each node ────────────────────────────────────────
  const log: WorkflowRunResult["log"] = [];
  let currentInput: unknown = initialInput;

  for (const node of ordered) {
    const data = node.data as AutomationNodeData;
    const def = getNodeDef(data.nodeType);
    const nodeLabel = data.label || def?.label || data.nodeType;

    try {
      const res = await fetch(`${baseUrl}/api/automation/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeType: data.nodeType,
          config: data.config ?? {},
          input: currentInput,
          workflowId: workflow.id,
        }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        const errMsg = json.error || `HTTP ${res.status}`;
        log.push({ nodeLabel, status: "error", error: errMsg });
        return { status: "error", log, finalOutput: null, error: errMsg };
      }

      currentInput = json.output;
      log.push({ nodeLabel, status: "success", output: json.output });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Network error";
      log.push({ nodeLabel, status: "error", error: errMsg });
      return { status: "error", log, finalOutput: null, error: errMsg };
    }
  }

  return { status: "success", log, finalOutput: currentInput };
}
