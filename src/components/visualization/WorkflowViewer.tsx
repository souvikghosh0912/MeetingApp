"use client";

import { useMemo, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { WorkflowNode, WorkflowEdge } from "@/types";
import { Play, Square, MessageSquare, CheckSquare, Zap, Circle } from "lucide-react";

// --- Custom Node Implementation ---
const iconMap = {
  start: <Play className="h-4 w-4 text-green-400" />,
  end: <Square className="h-4 w-4 text-red-400" />,
  topic: <MessageSquare className="h-4 w-4 text-blue-400" />,
  action: <CheckSquare className="h-4 w-4 text-orange-400" />,
  decision: <Zap className="h-4 w-4 text-yellow-400" />,
  event: <Circle className="h-4 w-4 text-indigo-400" />
};

function CustomWorkflowNode({ data }: { data: WorkflowNode["data"] }) {
  const t = data.type || "topic";
  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-[#141414] p-4 shadow-xl min-w-[220px] max-w-[300px] transition-all hover:border-accent/50">
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
const getLayoutedElements = (nodes: any[], edges: any[], direction = "LR") => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction, ranksep: 80, nodesep: 50 });

  // Roughly estimate node dimensions
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 280, height: 120 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? "left" : "top",
      sourcePosition: isHorizontal ? "right" : "bottom",
      position: {
        x: nodeWithPosition.x - 280 / 2,
        y: nodeWithPosition.y - 120 / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
};

// --- Main component ---
interface WorkflowViewerProps {
  data: { nodes: WorkflowNode[]; edges: WorkflowEdge[] };
}

export function WorkflowViewer({ data }: WorkflowViewerProps) {
  // Map our data to react-flow specific nodes, using our 'custom' type.
  const initialNodes = useMemo(() => {
    return data.nodes.map(n => ({
      ...n,
      type: "custom",
    }));
  }, [data]);
  
  const initialEdges = useMemo(() => {
    return data.edges.map(e => ({
      ...e,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
        color: '#6366f1', // accent color
      },
      style: {
        strokeWidth: 2,
        stroke: '#6366f1',
      }
    }));
  }, [data]);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(initialNodes, initialEdges),
    [initialNodes, initialEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = getLayoutedElements(initialNodes, initialEdges);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="w-full h-[600px] border border-white/10 rounded-2xl overflow-hidden bg-black/40 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
      >
        <Background gap={20} color="#ffffff10" />
        <Controls className="!bg-[#0a0a0a] !border-white/10 !fill-white" />
      </ReactFlow>
    </div>
  );
}
