"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { CheckCircle2, XCircle, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import { AutomationNodeData } from "@/types/automation";
import { getNodeDef, COLOR_MAP, GLOW_MAP } from "@/lib/automation-nodes";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  idle: "border-white/10",
  running: "border-blue-400/60 shadow-blue-400/20",
  success: "border-emerald-400/60 shadow-emerald-400/20",
  error: "border-red-400/60 shadow-red-400/20",
};

const statusIcons: Record<string, React.ReactNode> = {
  running: <Loader2 className="h-3 w-3 animate-spin text-blue-400" />,
  success: <CheckCircle2 className="h-3 w-3 text-emerald-400" />,
  error: <XCircle className="h-3 w-3 text-red-400" />,
};

export function AutomationNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as AutomationNodeData;
  const def = getNodeDef(nodeData.nodeType);
  if (!def) return null;

  const colorClass = COLOR_MAP[def.color] ?? COLOR_MAP["slate"];
  const glowClass = GLOW_MAP[def.color] ?? "";
  const status = nodeData.status ?? "idle";

  const isSelected = selected;

  return (
    <div
      className={cn(
        "relative min-w-[200px] max-w-[260px] rounded-xl border bg-[#111111] transition-all duration-200",
        "shadow-lg",
        isSelected
          ? "border-indigo-400/60 shadow-indigo-400/20 ring-2 ring-indigo-400/20"
          : statusColors[status],
        status !== "idle" && "shadow-lg"
      )}
    >
      {/* Input handle */}
      {def.inputs > 0 && (
        <Handle
          type="target"
          position={Position.Left}
          className={cn(
            "!w-3 !h-3 !rounded-full !border-2 !border-[#111] transition-colors",
            `!bg-${def.color}-500`
          )}
          style={{ backgroundColor: getHandleColor(def.color) }}
        />
      )}

      {/* Header */}
      <div className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded-t-xl border-b border-white/[0.06]", `bg-${def.color}-500/5`)}>
        <div className={cn("flex-shrink-0 text-base w-7 h-7 flex items-center justify-center rounded-lg border", colorClass)}>
          <span className="text-[13px] leading-none">{def.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-white/90 truncate">{nodeData.label || def.label}</p>
          <p className={cn("text-[9px] font-medium uppercase tracking-wider", getTextColor(def.color))}>
            {def.category}
          </p>
        </div>
        {statusIcons[status] && (
          <div className="flex-shrink-0">{statusIcons[status]}</div>
        )}
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <p className="text-[10px] text-white/35 leading-relaxed line-clamp-2">{def.description}</p>

        {/* Config preview */}
        {nodeData.config && Object.keys(nodeData.config).length > 0 && (
          <div className="mt-2 space-y-0.5">
            {Object.entries(nodeData.config)
              .slice(0, 2)
              .map(([key, value]) => {
                if (!value && value !== 0) return null;
                const field = def.fields.find((f) => f.key === key);
                const label = field?.label ?? key;
                const displayValue =
                  typeof value === "string" && value.length > 20
                    ? value.slice(0, 20) + "…"
                    : String(value);
                return (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className="text-[9px] text-white/25 flex-shrink-0 w-14 truncate">{label}:</span>
                    <span className="text-[9px] text-white/60 truncate font-mono">{displayValue}</span>
                  </div>
                );
              })}
          </div>
        )}

        {/* Error message */}
        {status === "error" && nodeData.error && (
          <div className="mt-2 flex items-start gap-1 text-red-400/80">
            <AlertCircle className="h-2.5 w-2.5 flex-shrink-0 mt-0.5" />
            <span className="text-[9px] line-clamp-2">{nodeData.error}</span>
          </div>
        )}
      </div>

      {/* Output handle */}
      {def.outputs > 0 && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !rounded-full !border-2 !border-[#111] transition-colors"
          style={{ backgroundColor: getHandleColor(def.color) }}
        />
      )}

      {/* Multiple outputs label */}
      {def.outputs > 1 && (
        <div className="absolute -right-16 top-1/2 -translate-y-1/2 flex flex-col gap-4">
          <span className="text-[8px] text-emerald-400/60">true</span>
          <span className="text-[8px] text-red-400/60">false</span>
        </div>
      )}
    </div>
  );
}

function getHandleColor(color: string): string {
  const map: Record<string, string> = {
    emerald: "#10b981",
    green: "#22c55e",
    violet: "#8b5cf6",
    blue: "#3b82f6",
    orange: "#f97316",
    slate: "#64748b",
    red: "#ef4444",
    purple: "#a855f7",
  };
  return map[color] ?? "#6366f1";
}

function getTextColor(color: string): string {
  const map: Record<string, string> = {
    emerald: "text-emerald-400/70",
    green: "text-green-400/70",
    violet: "text-violet-400/70",
    blue: "text-blue-400/70",
    orange: "text-orange-400/70",
    slate: "text-slate-400/70",
    red: "text-red-400/70",
    purple: "text-purple-400/70",
  };
  return map[color] ?? "text-indigo-400/70";
}
