"use client";

import { useState, useRef, useEffect } from "react";
import { X, Calendar, Link2, Mail, Phone, Hash, Type, ToggleLeft, AlignLeft, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DbRecord, DbProperty, CellValue, PropertyType,
  SelectOption, OPTION_COLORS,
} from "@/types/database";
import { RelationPicker, RelationChips } from "./RelationPicker";

interface RecordModalProps {
  record: DbRecord;
  properties: DbProperty[];
  databaseName: string;
  onClose: () => void;
  onUpdate: (recordId: string, data: Record<string, CellValue>) => void;
}

const PROP_ICONS: Record<PropertyType, React.ElementType> = {
  text: Type,
  number: Hash,
  select: Tag,
  multi_select: Tag,
  date: Calendar,
  checkbox: ToggleLeft,
  url: Link2,
  email: Mail,
  phone: Phone,
  relation: Link2,
};

export function RecordModal({ record, properties, databaseName, onClose, onUpdate }: RecordModalProps) {
  const [data, setData] = useState<Record<string, CellValue>>({ ...record.data });
  const [editingProp, setEditingProp] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Save on close
  const handleClose = () => {
    onUpdate(record.id, data);
    onClose();
  };

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) handleClose();
  };

  const setValue = (propId: string, value: CellValue) => {
    setData((prev) => ({ ...prev, [propId]: value }));
  };

  // Auto-save on blur for each field (via onUpdate optimistically)
  const saveField = (propId: string, value: CellValue) => {
    setValue(propId, value);
    onUpdate(record.id, { ...data, [propId]: value });
  };

  const primaryProp = properties.find((p) => p.is_primary);
  const otherProps = properties.filter((p) => !p.is_primary);
  const title = primaryProp ? String(data[primaryProp.id] ?? "") : "Untitled";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="relative h-full w-full max-w-[520px] bg-[#0f0f0f] border-l border-white/[0.06] flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] text-white/30 font-medium uppercase tracking-wider flex-shrink-0">
              {databaseName}
            </span>
            <span className="text-white/15">/</span>
            <span className="text-[13px] text-white/60 truncate">{title || "Untitled"}</span>
          </div>
          <button
            onClick={handleClose}
            className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.06] transition-all flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Title */}
          {primaryProp && (
            <div className="px-6 pt-6 pb-4">
              <textarea
                className="w-full text-[24px] font-semibold text-white bg-transparent border-none outline-none resize-none placeholder:text-white/20 leading-tight"
                placeholder="Untitled"
                rows={1}
                value={String(data[primaryProp.id] ?? "")}
                onChange={(e) => setValue(primaryProp.id, e.target.value)}
                onBlur={(e) => saveField(primaryProp.id, e.target.value)}
                style={{ height: "auto", minHeight: "36px" }}
                onInput={(e) => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = t.scrollHeight + "px";
                }}
              />
            </div>
          )}

          {/* Properties */}
          <div className="px-6 pb-6 space-y-1">
            {otherProps.map((prop) => (
              <PropertyRow
                key={prop.id}
                property={prop}
                value={data[prop.id] ?? null}
                isEditing={editingProp === prop.id}
                onEdit={() => setEditingProp(prop.id)}
                onBlur={() => setEditingProp(null)}
                onChange={(v) => setValue(prop.id, v)}
                onSave={(v) => saveField(prop.id, v)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-[11px] text-white/25">
            Created {new Date(record.created_at).toLocaleDateString()}
          </span>
          <span className="text-[11px] text-white/25">
            Updated {new Date(record.updated_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}

function PropertyRow({
  property, value, isEditing, onEdit, onBlur, onChange, onSave,
}: {
  property: DbProperty;
  value: CellValue;
  isEditing: boolean;
  onEdit: () => void;
  onBlur: () => void;
  onChange: (v: CellValue) => void;
  onSave: (v: CellValue) => void;
}) {
  const Icon = PROP_ICONS[property.type] ?? AlignLeft;

  return (
    <div className="flex items-start gap-3 py-2 rounded-lg hover:bg-white/[0.02] px-2 -mx-2 group">
      {/* Label */}
      <div className="flex items-center gap-1.5 w-[140px] flex-shrink-0 pt-0.5">
        <Icon className="h-3.5 w-3.5 text-white/25 flex-shrink-0" />
        <span className="text-[12px] text-white/40 truncate">{property.name}</span>
      </div>

      {/* Value editor */}
      <div className="flex-1 min-w-0" onClick={onEdit}>
        <PropertyEditor
          property={property}
          value={value}
          isEditing={isEditing}
          onChange={onChange}
          onSave={(v) => { onSave(v); onBlur(); }}
          onBlur={onBlur}
        />
      </div>
    </div>
  );
}

function PropertyEditor({
  property, value, isEditing, onChange, onSave, onBlur,
}: {
  property: DbProperty;
  value: CellValue;
  isEditing: boolean;
  onChange: (v: CellValue) => void;
  onSave: (v: CellValue) => void;
  onBlur: () => void;
}) {
  const inputClass =
    "w-full bg-transparent text-[13px] text-white outline-none border-b border-white/[0.12] pb-0.5 placeholder:text-white/20";

  if (property.type === "checkbox") {
    return (
      <button
        onClick={() => onSave(!value)}
        className="flex items-center gap-1.5 text-[13px] text-white/70"
      >
        <div
          className={cn(
            "h-4 w-4 rounded border flex items-center justify-center transition-all",
            value ? "bg-indigo-500 border-indigo-500" : "border-white/20 bg-transparent"
          )}
        >
          {value && (
            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        {value ? "Checked" : "Unchecked"}
      </button>
    );
  }

  if (property.type === "select") {
    const options = property.config.options ?? [];
    const selected = options.find((o) => o.id === value);
    if (!isEditing && selected) {
      const colors = OPTION_COLORS[selected.color];
      return (
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium", colors.bg, colors.text)}>
          {selected.name}
        </span>
      );
    }
    return (
      <div className="space-y-1">
        {!isEditing && (
          <span className="text-[13px] text-white/30 cursor-pointer hover:text-white/50">
            {selected ? selected.name : "Select…"}
          </span>
        )}
        {isEditing && (
          <div className="space-y-0.5">
            {options.map((opt) => (
              <OptionButton key={opt.id} option={opt} onSelect={() => onSave(opt.id)} isSelected={opt.id === value} />
            ))}
            {value && (
              <button onClick={() => onSave(null)} className="text-[11px] text-white/30 hover:text-white/50 mt-1">
                Clear
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (property.type === "relation") {
    const selectedIds = (Array.isArray(value) ? value : []) as string[];
    const targetDbId = property.config.targetDatabaseId ?? "";
    const targetDbName = property.config.targetDatabaseName ?? "Database";

    if (!isEditing) {
      return (
        <div className="flex flex-wrap gap-1.5 min-h-[24px]">
          <RelationChips recordIds={selectedIds} targetDatabaseId={targetDbId} />
        </div>
      );
    }

    return (
      <div className="relative">
        <div className="flex flex-wrap gap-1.5 mb-2">
          <RelationChips recordIds={selectedIds} targetDatabaseId={targetDbId} />
          <button
            onClick={() => {/* Click handled by div wrapper */}}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Edit selection…
          </button>
        </div>
        <RelationPicker
          targetDatabaseId={targetDbId}
          targetDatabaseName={targetDbName}
          selectedIds={selectedIds}
          onChange={onSave}
          onClose={onBlur}
        />
      </div>
    );
  }

  if (property.type === "multi_select") {
    const options = property.config.options ?? [];
    const selected = (Array.isArray(value) ? value : []) as string[];
    const toggle = (id: string) => {
      const next = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
      onSave(next);
    };
    return (
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const colors = OPTION_COLORS[opt.color];
          const active = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => toggle(opt.id)}
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium transition-opacity",
                colors.bg, colors.text,
                !active && "opacity-30"
              )}
            >
              {opt.name}
            </button>
          );
        })}
      </div>
    );
  }

  if (property.type === "date") {
    return (
      <input
        type="date"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onSave(e.target.value)}
        className="bg-transparent text-[13px] text-white/70 border-b border-white/[0.12] outline-none pb-0.5 [color-scheme:dark]"
      />
    );
  }

  if (property.type === "number") {
    return (
      <input
        type="number"
        value={value !== null && value !== undefined ? String(value) : ""}
        placeholder="—"
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        onBlur={(e) => onSave(e.target.value === "" ? null : Number(e.target.value))}
        className={inputClass}
      />
    );
  }

  return (
    <input
      type={property.type === "email" ? "email" : property.type === "url" ? "url" : "text"}
      value={String(value ?? "")}
      placeholder="—"
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onSave(e.target.value)}
      className={inputClass}
    />
  );
}

function OptionButton({ option, onSelect, isSelected }: { option: SelectOption; onSelect: () => void; isSelected: boolean }) {
  const colors = OPTION_COLORS[option.color];
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex items-center gap-2 w-full px-2 py-1 rounded-md text-[12px] transition-all",
        isSelected ? cn(colors.bg, colors.text) : "text-white/50 hover:bg-white/[0.05]"
      )}
    >
      <div className={cn("h-2 w-2 rounded-full flex-shrink-0", colors.bg.replace("/20", ""))} />
      {option.name}
    </button>
  );
}
