"use client";

import { useState, useEffect } from "react";
import { X, Info } from "lucide-react";
import { AutomationNodeData } from "@/types/automation";
import { getNodeDef, COLOR_MAP } from "@/lib/automation-nodes";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface NodeConfigPanelProps {
  nodeId: string;
  data: AutomationNodeData;
  onClose: () => void;
  onUpdate: (nodeId: string, data: Partial<AutomationNodeData>) => void;
}

export function NodeConfigPanel({ nodeId, data, onClose, onUpdate }: NodeConfigPanelProps) {
  const def = getNodeDef(data.nodeType);
  const [localLabel, setLocalLabel] = useState(data.label || def?.label || "");
  const [localConfig, setLocalConfig] = useState<Record<string, string | number | boolean>>(
    data.config ?? {}
  );

  useEffect(() => {
    setLocalLabel(data.label || def?.label || "");
    setLocalConfig(data.config ?? {});
  }, [nodeId, data, def]);

  if (!def) return null;

  const colorClass = COLOR_MAP[def.color] ?? COLOR_MAP["slate"];

  function handleSave() {
    onUpdate(nodeId, { label: localLabel, config: localConfig });
  }

  function setField(key: string, value: string | number | boolean) {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.07] flex-shrink-0">
        <div className={cn("w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0", colorClass)}>
          <span className="text-sm">{def.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-white">{def.label}</p>
          <p className="text-[10px] text-white/35 capitalize">{def.category} node</p>
        </div>
        <button
          onClick={onClose}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.06] transition-all flex-shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Description */}
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
          <p className="text-[10px] text-white/45 leading-relaxed">{def.description}</p>
        </div>

        {/* Node Label */}
        <div>
          <label className="block text-[11px] font-medium text-white/60 mb-1.5">
            Node Label
          </label>
          <Input
            value={localLabel}
            onChange={(e) => setLocalLabel(e.target.value)}
            className="bg-white/[0.04] border-white/[0.08] text-white text-[12px] h-8 focus:border-indigo-500/50 focus:ring-0"
            placeholder="Node label..."
          />
        </div>

        {/* Dynamic fields */}
        {def.fields.map((field) => {
          const value = localConfig[field.key] ?? field.defaultValue ?? "";

          return (
            <div key={field.key}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <label className="text-[11px] font-medium text-white/60">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-0.5">*</span>}
                </label>
              </div>

              {field.description && (
                <p className="text-[10px] text-white/30 mb-1.5 flex items-start gap-1">
                  <Info className="h-2.5 w-2.5 flex-shrink-0 mt-0.5" />
                  {field.description}
                </p>
              )}

              {field.type === "text" && (
                <Input
                  value={String(value)}
                  onChange={(e) => setField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="bg-white/[0.04] border-white/[0.08] text-white text-[12px] h-8 focus:border-indigo-500/50 focus:ring-0"
                />
              )}

              {field.type === "number" && (
                <Input
                  type="number"
                  value={String(value)}
                  onChange={(e) => setField(field.key, Number(e.target.value))}
                  placeholder={field.placeholder}
                  className="bg-white/[0.04] border-white/[0.08] text-white text-[12px] h-8 focus:border-indigo-500/50 focus:ring-0"
                />
              )}

              {(field.type === "textarea" || field.type === "code") && (
                <Textarea
                  value={String(value)}
                  onChange={(e) => setField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={field.type === "code" ? 6 : 3}
                  className={cn(
                    "bg-white/[0.04] border-white/[0.08] text-white text-[11px] focus:border-indigo-500/50 focus:ring-0 resize-none",
                    field.type === "code" && "font-mono"
                  )}
                />
              )}

              {field.type === "select" && (
                <select
                  value={String(value)}
                  onChange={(e) => setField(field.key, e.target.value)}
                  className="w-full bg-[#161616] border border-white/[0.08] text-white text-[12px] h-8 rounded-md px-2.5 focus:outline-none focus:border-indigo-500/50 transition-colors"
                >
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#161616]">
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {field.type === "toggle" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setField(field.key, !value)}
                    className={cn(
                      "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                      value ? "bg-indigo-600" : "bg-white/10"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
                        value ? "translate-x-4" : "translate-x-0.5"
                      )}
                    />
                  </button>
                  <span className="text-[11px] text-white/50">{value ? "Enabled" : "Disabled"}</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Variable reference help */}
        <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-2.5">
          <p className="text-[10px] font-semibold text-indigo-400 mb-1.5">💡 Variable Reference</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <code className="text-[9px] bg-white/[0.06] px-1.5 py-0.5 rounded text-indigo-300">{"{{input}}"}</code>
              <span className="text-[9px] text-white/35">Full output from previous node</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-[9px] bg-white/[0.06] px-1.5 py-0.5 rounded text-indigo-300">{"{{input.field}}"}</code>
              <span className="text-[9px] text-white/35">Specific field from JSON output</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="px-4 py-3 border-t border-white/[0.07] flex-shrink-0">
        <button
          onClick={handleSave}
          className="w-full h-8 bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-semibold rounded-lg transition-colors"
        >
          Apply Changes
        </button>
      </div>
    </div>
  );
}
