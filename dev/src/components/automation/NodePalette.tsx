"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { NODE_DEFINITIONS, NODE_CATEGORIES, COLOR_MAP } from "@/lib/automation-nodes";
import { AutomationNodeType } from "@/types/automation";
import { cn } from "@/lib/utils";

interface NodePaletteProps {
  onAddNode: (type: AutomationNodeType) => void;
  onClose: () => void;
}

export function NodePalette({ onAddNode, onClose }: NodePaletteProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = NODE_DEFINITIONS.filter((n) => {
    const matchSearch =
      !search ||
      n.label.toLowerCase().includes(search.toLowerCase()) ||
      n.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || n.category === activeCategory;
    return matchSearch && matchCat;
  });

  const categoryColorMap: Record<string, string> = {
    trigger: "text-emerald-400 bg-emerald-400/10",
    ai: "text-violet-400 bg-violet-400/10",
    transform: "text-orange-400 bg-orange-400/10",
    integration: "text-blue-400 bg-blue-400/10",
    output: "text-purple-400 bg-purple-400/10",
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.07] flex-shrink-0">
        <div>
          <p className="text-[13px] font-semibold text-white">Add Node</p>
          <p className="text-[10px] text-white/30">Drag or click to add</p>
        </div>
        <button
          onClick={onClose}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-white/[0.05] flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes..."
            className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-[11px] rounded-lg pl-7 pr-3 h-7 focus:outline-none focus:border-indigo-500/40 placeholder:text-white/25 transition-colors"
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-1.5 px-4 py-2.5 overflow-x-auto flex-shrink-0 border-b border-white/[0.05]">
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            "flex-shrink-0 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all",
            !activeCategory
              ? "bg-white/10 text-white"
              : "text-white/35 hover:text-white/60"
          )}
        >
          All
        </button>
        {NODE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
            className={cn(
              "flex-shrink-0 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all capitalize",
              activeCategory === cat.id
                ? categoryColorMap[cat.id]
                : "text-white/35 hover:text-white/60"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {NODE_CATEGORIES.filter((cat) => !activeCategory || cat.id === activeCategory).map((cat) => {
          const catNodes = filtered.filter((n) => n.category === cat.id);
          if (catNodes.length === 0) return null;

          return (
            <div key={cat.id} className="mb-3">
              <p className="px-2 py-1.5 text-[9px] font-bold text-white/25 uppercase tracking-widest">
                {cat.label}
              </p>
              <div className="space-y-1">
                {catNodes.map((node) => (
                  <button
                    key={node.type}
                    onClick={() => onAddNode(node.type as AutomationNodeType)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.05] transition-all group text-left"
                  >
                    <div className={cn(
                      "flex-shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center text-[12px]",
                      COLOR_MAP[node.color] ?? COLOR_MAP["slate"]
                    )}>
                      {node.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-white/80 group-hover:text-white transition-colors">
                        {node.label}
                      </p>
                      <p className="text-[9px] text-white/30 truncate">{node.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-[12px] text-white/30">No nodes match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
