"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  MarkerType,
  Connection,
  Edge,
  Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { WorkflowNode, WorkflowEdge } from "@/types";
import { Play, Square, MessageSquare, CheckSquare, Zap, Circle, Plus, Save, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// --- Custom Node Implementation ---
const iconMap = {
  start: <Play className="h-4 w-4 text-green-400" />,
  end: <Square className="h-4 w-4 text-red-400" />,
  topic: <MessageSquare className="h-4 w-4 text-blue-400" />,
  action: <CheckSquare className="h-4 w-4 text-orange-400" />,
  decision: <Zap className="h-4 w-4 text-yellow-400" />,
  event: <Circle className="h-4 w-4 text-indigo-400" />
};

function CustomWorkflowNode({ data, selected }: { data: WorkflowNode["data"], selected?: boolean }) {
  const t = data.type || "topic";
  return (
    <div className={`flex flex-col rounded-xl border ${selected ? 'border-accent ring-2 ring-accent/20' : 'border-white/10'} bg-[#141414] p-4 shadow-xl min-w-[220px] max-w-[300px] transition-all`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-accent !border-black" />
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center justify-center bg-white/5 rounded-lg p-2 border border-white/5">
          {iconMap[t as keyof typeof iconMap] || iconMap.topic}
        </div>
        <span className="text-xs font-bold text-white uppercase tracking-wider leading-tight">{data.label}</span>
      </div>
      <p className="text-xs text-text-secondary leading-tight mt-1">{data.description}</p>
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-accent !border-black" />
    </div>
  );
}

const nodeTypes = {
  custom: CustomWorkflowNode,
};

// --- Dagre Layout ---
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = "LR") => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction, ranksep: 80, nodesep: 50 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 280, height: 120 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    // Only update position if it's the very first time (x=0, y=0) to allow free dragging later
    if (node.position.x === 0 && node.position.y === 0) {
      return {
        ...node,
        targetPosition: isHorizontal ? Position.Left : Position.Top,
        sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
        position: {
          x: nodeWithPosition.x - 280 / 2,
          y: nodeWithPosition.y - 120 / 2,
        },
      };
    }
    return node;
  });
};

// --- Main component ---
interface EditorProps {
  transcriptId: string;
  initialData: { nodes: WorkflowNode[]; edges: WorkflowEdge[] };
}

export function InteractiveWorkflowEditor({ transcriptId, initialData }: EditorProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Parse initial data
  const parsedNodes: Node[] = useMemo(() => initialData.nodes.map(n => ({
    ...n,
    type: "custom",
  })), [initialData]);

  const parsedEdges: Edge[] = useMemo(() => initialData.edges.map(e => ({
    ...e,
    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: '#6366f1' },
    style: { strokeWidth: 2, stroke: '#6366f1' }
  })), [initialData]);

  // We only run auto-layout once on mount
  const layoutedNodes = useMemo(() => getLayoutedElements(parsedNodes, parsedEdges), [parsedNodes, parsedEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(parsedEdges);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({
    ...params,
    type: "smoothstep",
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: '#6366f1' },
    style: { strokeWidth: 2, stroke: '#6366f1' }
  }, eds)), [setEdges]);

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  };
  
  const onPaneClick = () => {
    setSelectedNodeId(null);
  };

  const handleAddNode = () => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: "custom",
      position: { x: 100, y: 100 }, // Creates it near the top left
      data: {
        label: "New Node",
        description: "Edit this description",
        type: "topic"
      }
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const updateSelectedNode = (field: string, value: string) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNodeId) {
          return { ...n, data: { ...n.data, [field]: value } };
        }
        return n;
      })
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // Strip out ReactFlow specific internal properties to save space, keep only what we need
      const cleanNodes = nodes.map(n => ({
        id: n.id,
        position: n.position,
        data: n.data
      }));
      const cleanEdges = edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target
      }));

      const res = await fetch("/api/visualize/save", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcriptId,
          workflow: { nodes: cleanNodes, edges: cleanEdges }
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save workflow");
      }
      toast.success("Workflow saved successfully!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="flex h-[calc(100vh-65px)] w-full overflow-hidden bg-black/40 relative">
      
      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          className="bg-black/20"
        >
          <Background gap={20} color="#ffffff10" />
          <Controls className="!bg-[#0a0a0a] !border-white/10 !fill-white" />
        </ReactFlow>

        {/* Floating action for adding nodes safely over canvas if we wanted, but we keep it in sidebar */}
      </div>

      {/* Right Sidebar / Controls */}
      <div className="w-80 border-l border-white/10 bg-[#0a0a0a]/95 backdrop-blur shadow-2xl p-6 flex flex-col z-10 h-full overflow-y-auto">
        <div className="flex items-center gap-3 mb-8 cursor-pointer text-text-secondary hover:text-white transition-colors" onClick={() => router.push(`/transcripts/${transcriptId}`)}>
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back to Transcript</span>
        </div>

        <h2 className="text-xl font-bold text-white mb-6">Workflow Editor</h2>
        
        <div className="space-y-3 mb-8">
          <Button onClick={handleAddNode} variant="secondary" className="w-full justify-start">
            <Plus className="h-4 w-4 mr-2" />
            Add New Node
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="w-full justify-start border border-accent/50 hover:bg-accent/20">
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        <div className="flex-1">
          {selectedNode ? (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-sm font-semibold text-accent uppercase tracking-wider">Edit Properties</h3>
              
              <div className="space-y-2">
                <label className="text-xs text-text-secondary">Type</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm text-white"
                  value={selectedNode.data.type as string}
                  onChange={(e) => updateSelectedNode("type", e.target.value)}
                >
                  <option value="start" className="bg-black text-white">Start / Trigger</option>
                  <option value="topic" className="bg-black text-white">General Topic</option>
                  <option value="action" className="bg-black text-white">Action Item</option>
                  <option value="decision" className="bg-black text-white">Key Decision</option>
                  <option value="event" className="bg-black text-white">Event / Note</option>
                  <option value="end" className="bg-black text-white">Conclusion</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-text-secondary">Title Label</label>
                <Input 
                  value={selectedNode.data.label as string} 
                  onChange={(e) => updateSelectedNode("label", e.target.value)} 
                  className="bg-white/5 focus-visible:ring-accent"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-text-secondary">Description Context</label>
                <textarea 
                  value={selectedNode.data.description as string} 
                  onChange={(e) => updateSelectedNode("description", e.target.value)} 
                  className="flex w-full rounded-md border border-white/10 px-3 py-2 text-sm placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 min-h-[140px] resize-none bg-white/5 text-white"
                />
              </div>
              
              <Button 
                variant="destructive" 
                className="w-full mt-6 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20" 
                onClick={() => {
                  setNodes(nds => nds.filter(n => n.id !== selectedNodeId));
                  setSelectedNodeId(null);
                }}
              >
                Delete Selected Node
              </Button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 mt-12">
              <div className="h-16 w-16 rounded-xl border border-dashed border-white/20 flex items-center justify-center mb-4 bg-white/5">
                 <MessageSquare className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-white mb-2">No Node Selected</p>
              <p className="text-xs text-text-muted px-4">Click any node on the canvas to edit its properties, or drag to connect them.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
