"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  MarkerType,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Plus, Save, Play, ArrowLeft, Zap, Settings2, LayoutGrid,
  ChevronRight, Loader2, CheckCircle2, XCircle, Trash2, Copy, Link,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { AutomationNodeData, AutomationNodeType, AutomationWorkflow, SerializedEdge, SerializedNode } from "@/types/automation";
import { getNodeDef } from "@/lib/automation-nodes";
import { saveWorkflow, generateId } from "@/lib/automation-storage";
import { AutomationNode } from "./AutomationNode";
import { NodeConfigPanel } from "./NodeConfigPanel";
import { NodePalette } from "./NodePalette";
import { cn } from "@/lib/utils";

const nodeTypes = { automationNode: AutomationNode };

interface WorkflowBuilderProps {
  workflow: AutomationWorkflow;
}

type RunStatus = "idle" | "running" | "success" | "error";

function toFlowNodes(serialized: SerializedNode[]): Node[] {
  return serialized.map((n) => ({
    id: n.id,
    type: "automationNode",
    position: n.position,
    data: n.data,
  }));
}

function toFlowEdges(serialized: SerializedEdge[]): Edge[] {
  return serialized.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    animated: e.animated,
    style: { stroke: "rgba(99,102,241,0.5)", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(99,102,241,0.5)" },
  }));
}

export function WorkflowBuilder({ workflow }: WorkflowBuilderProps) {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState(toFlowNodes(workflow.nodes));
  const [edges, setEdges, onEdgesChange] = useEdgesState(toFlowEdges(workflow.edges));

  const [workflowName, setWorkflowName] = useState(workflow.name);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Panels
  const [showPalette, setShowPalette] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Run state
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [runLog, setRunLog] = useState<string[]>([]);
  const [showRunPanel, setShowRunPanel] = useState(false);
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [registering, setRegistering] = useState(false);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "rgba(99,102,241,0.5)", strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(99,102,241,0.5)" },
          },
          eds
        )
      );
      setIsDirty(true);
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setShowPalette(false);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleAddNode = useCallback(
    (type: AutomationNodeType) => {
      const def = getNodeDef(type);
      if (!def) return;

      const defaultConfig: Record<string, string | number | boolean> = {};
      def.fields.forEach((f) => {
        if (f.defaultValue !== undefined) defaultConfig[f.key] = f.defaultValue;
      });

      const newNode: Node = {
        id: generateId(),
        type: "automationNode",
        position: { x: 200 + nodes.length * 40, y: 200 + nodes.length * 30 },
        data: {
          nodeType: type,
          label: def.label,
          config: defaultConfig,
          status: "idle",
        } as AutomationNodeData,
      };

      setNodes((nds) => [...nds, newNode]);
      setIsDirty(true);
      setShowPalette(false);
      setSelectedNodeId(newNode.id);
      toast.success(`Added ${def.label} node`);
    },
    [nodes.length, setNodes]
  );

  const handleUpdateNode = useCallback(
    (nodeId: string, data: Partial<AutomationNodeData>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
        )
      );
      setIsDirty(true);
      toast.success("Node updated");
    },
    [setNodes]
  );

  const handleDeleteNode = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) =>
      eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId)
    );
    setSelectedNodeId(null);
    setIsDirty(true);
    toast.success("Node deleted");
  }, [selectedNodeId, setEdges, setNodes]);

  const handleDuplicateNode = useCallback(() => {
    if (!selectedNodeId) return;
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (!node) return;
    const newNode: Node = {
      ...node,
      id: generateId(),
      position: { x: node.position.x + 30, y: node.position.y + 30 },
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(newNode.id);
    setIsDirty(true);
    toast.success("Node duplicated");
  }, [selectedNodeId, nodes, setNodes]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const serializedNodes: SerializedNode[] = nodes.map((n) => ({
        id: n.id,
        type: n.type ?? "automationNode",
        position: n.position,
        data: n.data as AutomationNodeData,
      }));
      const serializedEdges: SerializedEdge[] = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? undefined,
        targetHandle: e.targetHandle ?? undefined,
        animated: e.animated,
      }));

      saveWorkflow({
        ...workflow,
        name: workflowName,
        nodes: serializedNodes,
        edges: serializedEdges,
        updatedAt: new Date().toISOString(),
      });

      setIsDirty(false);
      toast.success("Workflow saved");
    } catch {
      toast.error("Failed to save workflow");
    } finally {
      setSaving(false);
    }
  }, [nodes, edges, workflow, workflowName]);

  // Register workflow for webhook/schedule triggers
  const handleRegister = useCallback(async () => {
    setRegistering(true);
    try {
      const serializedNodes: SerializedNode[] = nodes.map((n) => ({
        id: n.id,
        type: n.type ?? "automationNode",
        position: n.position,
        data: n.data as AutomationNodeData,
      }));
      const serializedEdges: SerializedEdge[] = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? undefined,
        targetHandle: e.targetHandle ?? undefined,
        animated: e.animated,
      }));
      const currentWorkflow = { ...workflow, name: workflowName, nodes: serializedNodes, edges: serializedEdges };

      const res = await fetch("/api/automation/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register_workflow", workflow: currentWorkflow }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Registration failed");

      toast.success("Workflow registered!", {
        description: json.webhookUrl ? `Webhook URL copied to clipboard` : "Workflow registered successfully",
      });
      if (json.webhookUrl) navigator.clipboard.writeText(json.webhookUrl).catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setRegistering(false);
    }
  }, [nodes, edges, workflow, workflowName]);

  // Real workflow execution via API
  const handleRun = useCallback(async () => {
    setRunStatus("running");
    setShowRunPanel(true);
    setRunLog([]);

    // Build ordered node list following edges (topological sort)
    const orderedNodes: Node[] = [];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const edgeMap = new Map<string, string[]>();

    edges.forEach((e) => {
      if (!edgeMap.has(e.source)) edgeMap.set(e.source, []);
      edgeMap.get(e.source)!.push(e.target);
    });

    const hasIncoming = new Set(edges.map((e) => e.target));
    const startNodes = nodes.filter((n) => !hasIncoming.has(n.id));

    function traverse(nodeId: string, visited = new Set<string>()) {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      const n = nodeMap.get(nodeId);
      if (n) orderedNodes.push(n);
      const next = edgeMap.get(nodeId) ?? [];
      next.forEach((id) => traverse(id, visited));
    }

    startNodes.forEach((n) => traverse(n.id));

    if (orderedNodes.length === 0) {
      setRunLog(["⚠️ No nodes to execute. Add nodes and connect them."]);
      setRunStatus("error");
      return;
    }

    // Reset all node statuses
    setNodes((nds) =>
      nds.map((n) => ({ ...n, data: { ...n.data, status: "idle", output: undefined, error: undefined } }))
    );

    // Track output chain: each node receives the previous node's output as input
    let currentInput: unknown = null;

    for (const node of orderedNodes) {
      const data = node.data as AutomationNodeData;
      const def = getNodeDef(data.nodeType);
      if (!def) continue;

      // Mark node as running
      setNodes((nds) =>
        nds.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, status: "running" } } : n))
      );
      setRunLog((prev) => [...prev, `▶ Running: ${data.label || def.label}...`]);

      try {
        const res = await fetch("/api/automation/execute", {
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
          setNodes((nds) =>
            nds.map((n) =>
              n.id === node.id
                ? { ...n, data: { ...n.data, status: "error", error: errMsg } }
                : n
            )
          );
          setRunLog((prev) => [
            ...prev,
            `❌ ${data.label || def.label} — failed: ${errMsg}`,
          ]);
          setRunStatus("error");
          return;
        }

        const output = json.output;
        currentInput = output;

        const outputPreview =
          typeof output === "string"
            ? output.slice(0, 120) + (output.length > 120 ? "…" : "")
            : JSON.stringify(output).slice(0, 120) + (JSON.stringify(output).length > 120 ? "…" : "");

        setNodes((nds) =>
          nds.map((n) =>
            n.id === node.id
              ? { ...n, data: { ...n.data, status: "success", output: outputPreview } }
              : n
          )
        );
        setRunLog((prev) => [
          ...prev,
          `✅ ${data.label || def.label} — completed`,
          `   ↳ ${outputPreview}`,
        ]);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Network error";
        setNodes((nds) =>
          nds.map((n) =>
            n.id === node.id
              ? { ...n, data: { ...n.data, status: "error", error: errMsg } }
              : n
          )
        );
        setRunLog((prev) => [
          ...prev,
          `❌ ${data.label || def.label} — failed: ${errMsg}`,
        ]);
        setRunStatus("error");
        return;
      }
    }

    setRunStatus("success");
    setRunLog((prev) => [...prev, "🎉 Workflow completed successfully!"]);

    saveWorkflow({
      ...workflow,
      runCount: (workflow.runCount ?? 0) + 1,
      lastRun: new Date().toISOString(),
    });
  }, [nodes, edges, setNodes, workflow]);

  const rightPanelOpen = selectedNodeId || showPalette;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a] overflow-hidden">
      {/* Top toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.06] bg-[#0d0d0d] flex-shrink-0 z-10">
        <button
          onClick={() => router.back()}
          className="h-7 w-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-all flex-shrink-0"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>

        <div className="h-4 w-px bg-white/[0.08]" />

        <input
          value={workflowName}
          onChange={(e) => {
            setWorkflowName(e.target.value);
            setIsDirty(true);
          }}
          className="bg-transparent text-[13px] font-semibold text-white focus:outline-none min-w-0 w-48 border-b border-transparent focus:border-white/20 transition-colors"
        />

        {isDirty && (
          <span className="text-[10px] text-white/30 flex-shrink-0">unsaved changes</span>
        )}

        <div className="flex-1" />

        {/* Node count */}
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-white/30">
          <LayoutGrid className="h-3 w-3" />
          <span>{nodes.length} nodes</span>
          <ChevronRight className="h-2.5 w-2.5" />
          <span>{edges.length} connections</span>
        </div>

        {/* Selected node actions */}
        {selectedNodeId && (
          <>
            <button
              onClick={handleDuplicateNode}
              className="h-7 px-2.5 flex items-center gap-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-all text-[11px]"
            >
              <Copy className="h-3 w-3" /> Duplicate
            </button>
            <button
              onClick={handleDeleteNode}
              className="h-7 px-2.5 flex items-center gap-1.5 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all text-[11px]"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
            <div className="h-4 w-px bg-white/[0.08]" />
          </>
        )}

        <button
          onClick={() => {
            setShowPalette((v) => !v);
            setSelectedNodeId(null);
          }}
          className={cn(
            "h-7 px-3 flex items-center gap-1.5 rounded-lg text-[11px] font-medium transition-all",
            showPalette
              ? "bg-indigo-600 text-white"
              : "bg-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.1]"
          )}
        >
          <Plus className="h-3 w-3" /> Add Node
        </button>

        <button
          onClick={handleRegister}
          disabled={registering || nodes.length === 0}
          title="Register workflow for webhook triggers"
          className={cn(
            "h-7 px-3 flex items-center gap-1.5 rounded-lg text-[11px] font-medium transition-all",
            registering
              ? "bg-white/[0.05] text-white/30 cursor-not-allowed"
              : "bg-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.1]"
          )}
        >
          {registering ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link className="h-3 w-3" />}
          Register
        </button>

        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className={cn(
            "h-7 px-3 flex items-center gap-1.5 rounded-lg text-[11px] font-medium transition-all",
            isDirty
              ? "bg-white/[0.08] text-white hover:bg-white/[0.12]"
              : "bg-transparent text-white/20 cursor-default"
          )}
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Save
        </button>

        <button
          onClick={handleRun}
          disabled={runStatus === "running" || nodes.length === 0}
          className={cn(
            "h-7 px-3 flex items-center gap-1.5 rounded-lg text-[11px] font-semibold transition-all",
            runStatus === "running"
              ? "bg-blue-500/20 text-blue-400 cursor-not-allowed"
              : runStatus === "success"
              ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
              : runStatus === "error"
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              : "bg-indigo-600 text-white hover:bg-indigo-500"
          )}
        >
          {runStatus === "running" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : runStatus === "success" ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : runStatus === "error" ? (
            <XCircle className="h-3 w-3" />
          ) : (
            <Zap className="h-3 w-3" />
          )}
          {runStatus === "running" ? "Running..." : runStatus === "success" ? "Run Again" : runStatus === "error" ? "Retry" : "Run"}
        </button>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* ReactFlow canvas */}
        <div ref={reactFlowWrapper} className="flex-1 relative overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={(changes) => {
              onNodesChange(changes);
              const positionChange = changes.some((c) => c.type === "position");
              if (positionChange) setIsDirty(true);
            }}
            onEdgesChange={(changes) => {
              onEdgesChange(changes);
              const removals = changes.some((c) => c.type === "remove");
              if (removals) setIsDirty(true);
            }}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.3}
            maxZoom={2}
            className="bg-[#0a0a0a]"
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: "rgba(99,102,241,0.5)", strokeWidth: 1.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(99,102,241,0.5)" },
            }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1}
              color="rgba(255,255,255,0.05)"
            />
            <Controls
              className="!bg-[#111] !border-white/10 !rounded-xl overflow-hidden !shadow-xl"
              showInteractive={false}
            />
            <MiniMap
              className="!bg-[#111] !border-white/[0.08] !rounded-xl overflow-hidden"
              nodeColor="rgba(99,102,241,0.4)"
              maskColor="rgba(0,0,0,0.6)"
            />

            {/* Empty state */}
            {nodes.length === 0 && (
              <Panel position="top-center">
                <div className="mt-16 flex flex-col items-center gap-3 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center">
                    <Zap className="h-7 w-7 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-white/70">Empty workflow</p>
                    <p className="text-[12px] text-white/30 mt-1">Click &quot;Add Node&quot; to start building</p>
                  </div>
                  <button
                    onClick={() => setShowPalette(true)}
                    className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add First Node
                  </button>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Right panel */}
        {rightPanelOpen && (
          <div className="w-[280px] flex-shrink-0 border-l border-white/[0.07] bg-[#0d0d0d] overflow-hidden flex flex-col">
            {showPalette && !selectedNodeId && (
              <NodePalette
                onAddNode={handleAddNode}
                onClose={() => setShowPalette(false)}
              />
            )}
            {selectedNodeId && selectedNode && (
              <NodeConfigPanel
                nodeId={selectedNodeId}
                data={selectedNode.data as AutomationNodeData}
                onClose={() => setSelectedNodeId(null)}
                onUpdate={handleUpdateNode}
              />
            )}
          </div>
        )}

        {/* Run log panel */}
        {showRunPanel && (
          <div className="w-[260px] flex-shrink-0 border-l border-white/[0.07] bg-[#0d0d0d] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] flex-shrink-0">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    runStatus === "running" ? "bg-blue-400 animate-pulse" :
                    runStatus === "success" ? "bg-emerald-400" :
                    runStatus === "error" ? "bg-red-400" : "bg-white/20"
                  )}
                />
                <p className="text-[12px] font-semibold text-white">Run Log</p>
              </div>
              <button
                onClick={() => setShowRunPanel(false)}
                className="text-white/30 hover:text-white transition-colors text-[10px]"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 font-mono">
              {runLog.map((line, i) => (
                <p
                  key={i}
                  className={cn(
                    "text-[10px] leading-relaxed",
                    line.startsWith("✅") ? "text-emerald-400" :
                    line.startsWith("❌") ? "text-red-400" :
                    line.startsWith("🎉") ? "text-indigo-400" :
                    line.startsWith("▶") ? "text-blue-400" : "text-white/50"
                  )}
                >
                  {line}
                </p>
              ))}
              {runStatus === "running" && (
                <div className="flex items-center gap-1.5 text-blue-400/60">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  <span className="text-[10px]">Executing...</span>
                </div>
              )}
              {runLog.length === 0 && runStatus === "idle" && (
                <p className="text-[10px] text-white/25">Run the workflow to see logs here</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
