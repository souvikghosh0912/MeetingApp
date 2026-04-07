"use client";

import { useState, useRef, useCallback } from "react";
import {
  Plus, ChevronDown, Type, Hash, Calendar, ToggleLeft,
  Tag, Link2, Mail, Phone, AlignLeft, Trash2, GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DbProperty, DbRecord, CellValue, PropertyType, SelectOption, UserDatabase,
  OPTION_COLORS, PROPERTY_TYPE_LABELS, COLOR_CYCLE,
} from "@/types/database";
import { RecordModal } from "./RecordModal";
import { RelationPicker, RelationChips } from "./RelationPicker";
import { RelationConfigModal } from "./RelationConfigModal";

interface TableViewProps {
  databaseId: string;
  databaseName: string;
  properties: DbProperty[];
  records: DbRecord[];
  onPropertiesChange: (props: DbProperty[]) => void;
  onRecordsChange: (records: DbRecord[]) => void;
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

export function TableView({
  databaseId,
  databaseName,
  properties,
  records,
  onPropertiesChange,
  onRecordsChange,
}: TableViewProps) {
  const [editingCell, setEditingCell] = useState<{ rowId: string; propId: string } | null>(null);
  const [openRecord, setOpenRecord] = useState<DbRecord | null>(null);
  const [openPropMenu, setOpenPropMenu] = useState<string | null>(null);
  const [addingProp, setAddingProp] = useState(false);
  const [newPropName, setNewPropName] = useState("");
  const [newPropType, setNewPropType] = useState<PropertyType>("text");
  const [addingPropLoading, setAddingPropLoading] = useState(false);
  const [addingRow, setAddingRow] = useState(false);
  const [showRelationConfig, setShowRelationConfig] = useState(false);
  const [allDatabases, setAllDatabases] = useState<UserDatabase[]>([]);
  const newPropRef = useRef<HTMLInputElement>(null);

  // ── Mutations ────────────────────────────────────────────────

  const updateCell = useCallback(
    async (record: DbRecord, propId: string, value: CellValue) => {
      const optimistic = records.map((r) =>
        r.id === record.id ? { ...r, data: { ...r.data, [propId]: value } } : r
      );
      onRecordsChange(optimistic);
      await fetch(`/api/databases/${databaseId}/records/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { [propId]: value } }),
      });
    },
    [databaseId, records, onRecordsChange]
  );

  const updateRecordData = useCallback(
    async (recordId: string, data: Record<string, CellValue>) => {
      onRecordsChange(records.map((r) => (r.id === recordId ? { ...r, data } : r)));
      await fetch(`/api/databases/${databaseId}/records/${recordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
    },
    [databaseId, records, onRecordsChange]
  );

  const addRecord = async () => {
    if (addingRow) return;
    setAddingRow(true);
    const res = await fetch(`/api/databases/${databaseId}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: {} }),
    });
    const { record } = await res.json();
    if (record) onRecordsChange([...records, record]);
    setAddingRow(false);
  };

  const deleteRecord = async (id: string) => {
    onRecordsChange(records.filter((r) => r.id !== id));
    await fetch(`/api/databases/${databaseId}/records/${id}`, { method: "DELETE" });
  };

  const addProperty = async (relationConfig?: { targetId: string; targetName: string }) => {
    if (!newPropName.trim()) return;

    if (newPropType === "relation" && !relationConfig) {
      // First, fetch databases if we haven't
      if (allDatabases.length === 0) {
        const res = await fetch("/api/databases");
        const data = await res.json();
        setAllDatabases(data.databases ?? []);
      }
      setShowRelationConfig(true);
      return;
    }

    setAddingPropLoading(true);
    const config =
      newPropType === "select" || newPropType === "multi_select"
        ? {
            options: [
              { id: crypto.randomUUID(), name: "Option 1", color: COLOR_CYCLE[0] },
              { id: crypto.randomUUID(), name: "Option 2", color: COLOR_CYCLE[1] },
            ],
          }
        : newPropType === "relation" && relationConfig
        ? {
            targetDatabaseId: relationConfig.targetId,
            targetDatabaseName: relationConfig.targetName,
          }
        : {};
    const res = await fetch(`/api/databases/${databaseId}/properties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newPropName.trim(), type: newPropType, config }),
    });
    const { property } = await res.json();
    if (property) onPropertiesChange([...properties, property]);
    setNewPropName("");
    setNewPropType("text");
    setAddingProp(false);
    setAddingPropLoading(false);
    setShowRelationConfig(false);
  };

  const deleteProperty = async (propId: string) => {
    onPropertiesChange(properties.filter((p) => p.id !== propId));
    setOpenPropMenu(null);
    await fetch(`/api/databases/${databaseId}/properties`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: propId }),
    });
  };

  const renameProperty = async (propId: string, name: string) => {
    onPropertiesChange(properties.map((p) => (p.id === propId ? { ...p, name } : p)));
    await fetch(`/api/databases/${databaseId}/properties`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: propId, name }),
    });
  };

  // ── Render ───────────────────────────────────────────────────

  const primaryProp = properties.find((p) => p.is_primary);
  const otherProps = properties.filter((p) => !p.is_primary);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[600px]">
          {/* ── Header ─────────────────────────────────────── */}
          <thead>
            <tr className="border-b border-white/[0.06]">
              {/* Row handle column */}
              <th className="w-8" />

              {/* Primary (Name) column */}
              {primaryProp && (
                <th className="text-left py-2 px-3 w-[240px]">
                  <div className="flex items-center gap-1.5">
                    <Type className="h-3 w-3 text-white/30 flex-shrink-0" />
                    <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                      {primaryProp.name}
                    </span>
                  </div>
                </th>
              )}

              {/* Other columns */}
              {otherProps.map((prop) => (
                <PropertyHeader
                  key={prop.id}
                  property={prop}
                  isMenuOpen={openPropMenu === prop.id}
                  onMenuToggle={() => setOpenPropMenu((o) => (o === prop.id ? null : prop.id))}
                  onMenuClose={() => setOpenPropMenu(null)}
                  onDelete={() => deleteProperty(prop.id)}
                  onRename={(name) => renameProperty(prop.id, name)}
                />
              ))}

              {/* Add property */}
              <th className="w-10 text-left py-2 px-2">
                <button
                  onClick={() => { setAddingProp(true); setTimeout(() => newPropRef.current?.focus(), 50); }}
                  className="h-6 w-6 rounded-md flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </th>

              {/* Delete action spacer */}
              <th className="w-8" />
            </tr>

            {/* Add property form inline */}
            {addingProp && (
              <tr className="border-b border-white/[0.04]">
                <td />
                <td colSpan={otherProps.length + 1} className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={newPropType}
                      onChange={(e) => setNewPropType(e.target.value as PropertyType)}
                      className="bg-white/[0.04] border border-white/[0.08] text-white/70 text-[12px] rounded-md px-2 py-1 outline-none"
                    >
                      {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((t) => (
                        <option key={t} value={t}>{PROPERTY_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                    <input
                      ref={newPropRef}
                      value={newPropName}
                      onChange={(e) => setNewPropName(e.target.value)}
                      placeholder="Property name…"
                      className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/20 border-b border-white/[0.12] pb-0.5"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addProperty();
                        if (e.key === "Escape") { setAddingProp(false); setNewPropName(""); }
                      }}
                    />
                    <button
                      onClick={() => { addProperty(); }}
                      disabled={addingPropLoading || !newPropName.trim()}
                      className="text-[12px] text-indigo-400 hover:text-indigo-300 disabled:opacity-40 font-medium"
                    >
                      {addingPropLoading ? "Adding…" : "Add"}
                    </button>
                    <button onClick={() => { setAddingProp(false); setNewPropName(""); }} className="text-[12px] text-white/30 hover:text-white/60">
                      Cancel
                    </button>
                  </div>
                </td>
                <td />
              </tr>
            )}
          </thead>

          {/* ── Body ───────────────────────────────────────── */}
          <tbody>
            {records.map((record, idx) => (
              <tr
                key={record.id}
                className="group border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
              >
                {/* Row index */}
                <td className="w-8 text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    <GripVertical className="h-3 w-3 text-white/[0.12] opacity-0 group-hover:opacity-100" />
                    <span className="text-[11px] text-white/20 group-hover:hidden w-5 text-center">{idx + 1}</span>
                  </div>
                </td>

                {/* Primary cell — always text + opens modal */}
                {primaryProp && (
                  <td className="py-0 px-3 w-[240px]">
                    <div className="flex items-center gap-1.5 min-h-[36px]">
                      <button
                        onClick={() => setOpenRecord(record)}
                        className="text-left text-[13px] text-white font-medium hover:underline truncate max-w-[180px]"
                      >
                        {String(record.data[primaryProp.id] ?? "") || (
                          <span className="text-white/20 font-normal">Untitled</span>
                        )}
                      </button>
                    </div>
                  </td>
                )}

                {/* Other cells */}
                {otherProps.map((prop) => (
                  <td key={prop.id} className="py-0 px-3" style={{ minWidth: 140, maxWidth: 220 }}>
                    <CellEditor
                      property={prop}
                      value={record.data[prop.id] ?? null}
                      isEditing={editingCell?.rowId === record.id && editingCell?.propId === prop.id}
                      onStartEdit={() => setEditingCell({ rowId: record.id, propId: prop.id })}
                      onEndEdit={() => setEditingCell(null)}
                      onChange={(v) => updateCell(record, prop.id, v)}
                    />
                  </td>
                ))}

                {/* Add prop spacer */}
                <td />

                {/* Delete row */}
                <td className="w-8 text-center">
                  <button
                    onClick={() => deleteRecord(record.id)}
                    className="h-5 w-5 rounded flex items-center justify-center text-white/[0.12] hover:text-red-400 hover:bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-all mx-auto"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}

            {/* Add row */}
            <tr>
              <td />
              <td colSpan={otherProps.length + 2} className="py-1">
                <button
                  onClick={addRecord}
                  disabled={addingRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-white/30 hover:text-white/60 hover:bg-white/[0.04] rounded-md transition-all w-full"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {addingRow ? "Adding…" : "New row"}
                </button>
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      {openRecord && (
        <RecordModal
          record={openRecord}
          properties={properties}
          databaseName={databaseName}
          onClose={() => setOpenRecord(null)}
          onUpdate={updateRecordData}
        />
      )}

      {showRelationConfig && (
        <RelationConfigModal
          currentDatabaseId={databaseId}
          allDatabases={allDatabases}
          onConfirm={(targetId, targetName) => addProperty({ targetId, targetName })}
          onCancel={() => setShowRelationConfig(false)}
        />
      )}
    </>
  );
}

// ── PropertyHeader ───────────────────────────────────────────

function PropertyHeader({
  property,
  isMenuOpen,
  onMenuToggle,
  onMenuClose,
  onDelete,
  onRename,
}: {
  property: DbProperty;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onMenuClose: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(property.name);
  const Icon = PROP_ICONS[property.type] ?? AlignLeft;

  return (
    <th className="text-left py-2 px-3" style={{ minWidth: 140, maxWidth: 220 }}>
      <div className="relative flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-white/30 flex-shrink-0" />
        {renaming ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => { onRename(draft); setRenaming(false); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") { onRename(draft); setRenaming(false); }
              if (e.key === "Escape") { setDraft(property.name); setRenaming(false); }
            }}
            className="bg-transparent text-[11px] font-semibold text-white/80 uppercase tracking-wider outline-none border-b border-white/20 w-24"
          />
        ) : (
          <button
            onClick={onMenuToggle}
            className="flex items-center gap-1 text-[11px] font-semibold text-white/50 uppercase tracking-wider hover:text-white/80 transition-colors"
          >
            <span className="truncate max-w-[120px]">{property.name}</span>
            <ChevronDown className="h-3 w-3 flex-shrink-0 opacity-50" />
          </button>
        )}

        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={onMenuClose} />
            <div className="absolute top-6 left-0 z-20 min-w-[160px] rounded-lg border border-white/[0.08] bg-[#1a1a1a] shadow-xl py-1">
              <p className="px-3 py-1.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                {PROPERTY_TYPE_LABELS[property.type]}
              </p>
              <button
                onClick={() => { setRenaming(true); setDraft(property.name); onMenuClose(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-white/70 hover:bg-white/[0.05] hover:text-white transition-colors"
              >
                <Type className="h-3.5 w-3.5" /> Rename
              </button>
              <div className="my-1 border-t border-white/[0.06]" />
              <button
                onClick={onDelete}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-400 hover:bg-white/[0.05] transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete property
              </button>
            </div>
          </>
        )}
      </div>
    </th>
  );
}

// ── CellEditor ────────────────────────────────────────────────

function CellEditor({
  property, value, isEditing, onStartEdit, onEndEdit, onChange,
}: {
  property: DbProperty;
  value: CellValue;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
  onChange: (v: CellValue) => void;
}) {
  const inputClass =
    "w-full bg-transparent text-[13px] text-white outline-none placeholder:text-white/15";

  const handleClick = () => {
    if (property.type !== "checkbox") onStartEdit();
  };

  if (property.type === "checkbox") {
    return (
      <div className="flex items-center min-h-[36px]">
        <button
          onClick={() => onChange(!value)}
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
        </button>
      </div>
    );
  }

  if (property.type === "select") {
    const options = property.config.options ?? [];
    const selected = options.find((o) => o.id === value);
    return (
      <div className="relative min-h-[36px] flex items-center" onClick={handleClick}>
        {selected ? (
          <SelectBadge option={selected} />
        ) : (
          <span className="text-white/15 text-[12px]">—</span>
        )}
        {isEditing && (
          <>
            <div className="fixed inset-0 z-10" onClick={onEndEdit} />
            <div className="absolute top-8 left-0 z-20 min-w-[160px] rounded-lg border border-white/[0.08] bg-[#1a1a1a] shadow-xl py-1">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { onChange(opt.id); onEndEdit(); }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-white/[0.05] transition-colors",
                    OPTION_COLORS[opt.color].text
                  )}
                >
                  <div className={cn("h-2 w-2 rounded-full", OPTION_COLORS[opt.color].bg)} />
                  {opt.name}
                </button>
              ))}
              {value && (
                <button onClick={() => { onChange(null); onEndEdit(); }} className="w-full text-left px-3 py-1.5 text-[11px] text-white/30 hover:bg-white/[0.05]">
                  Clear
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  if (property.type === "multi_select") {
    const options = property.config.options ?? [];
    const selected = (Array.isArray(value) ? value : []) as string[];
    const toggle = (id: string) => {
      const next = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
      onChange(next);
    };
    return (
      <div className="relative min-h-[36px] flex items-center flex-wrap gap-1 py-1" onClick={handleClick}>
        {selected.length > 0
          ? options.filter((o) => selected.includes(o.id)).map((opt) => <SelectBadge key={opt.id} option={opt} />)
          : <span className="text-white/15 text-[12px]">—</span>}
        {isEditing && (
          <>
            <div className="fixed inset-0 z-10" onClick={onEndEdit} />
            <div className="absolute top-8 left-0 z-20 min-w-[160px] rounded-lg border border-white/[0.08] bg-[#1a1a1a] shadow-xl py-1">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => toggle(opt.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-white/[0.05] transition-colors",
                    OPTION_COLORS[opt.color].text
                  )}
                >
                  <div className={cn(
                    "h-3.5 w-3.5 rounded border flex items-center justify-center flex-shrink-0",
                    selected.includes(opt.id) ? "bg-indigo-500 border-indigo-500" : "border-white/20"
                  )}>
                    {selected.includes(opt.id) && (
                      <svg className="h-2 w-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  {opt.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (property.type === "relation") {
    const selectedIds = (Array.isArray(value) ? value : []) as string[];
    const targetDbId = property.config.targetDatabaseId ?? "";
    const targetDbName = property.config.targetDatabaseName ?? "Database";

    return (
      <div className="relative min-h-[36px] flex items-center" onClick={onStartEdit}>
        <RelationChips recordIds={selectedIds} targetDatabaseId={targetDbId} />
        {isEditing && (
          <RelationPicker
            targetDatabaseId={targetDbId}
            targetDatabaseName={targetDbName}
            selectedIds={selectedIds}
            onChange={(ids) => {
              onChange(ids);
            }}
            onClose={onEndEdit}
          />
        )}
      </div>
    );
  }

  if (property.type === "date") {
    return (
      <div className="min-h-[36px] flex items-center" onClick={handleClick}>
        {isEditing ? (
          <input
            autoFocus
            type="date"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onEndEdit}
            className={cn(inputClass, "[color-scheme:dark]")}
          />
        ) : (
          <span className="text-[13px] text-white/60">
            {value ? new Date(String(value)).toLocaleDateString() : <span className="text-white/15">—</span>}
          </span>
        )}
      </div>
    );
  }

  if (property.type === "number") {
    return (
      <div className="min-h-[36px] flex items-center" onClick={handleClick}>
        {isEditing ? (
          <input
            autoFocus
            type="number"
            value={value !== null && value !== undefined ? String(value) : ""}
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
            onBlur={onEndEdit}
            onKeyDown={(e) => e.key === "Enter" && onEndEdit()}
            className={inputClass}
          />
        ) : (
          <span className="text-[13px] text-white/70">
            {value !== null && value !== undefined ? String(value) : <span className="text-white/15">—</span>}
          </span>
        )}
      </div>
    );
  }

  // text / url / email / phone
  return (
    <div className="min-h-[36px] flex items-center" onClick={handleClick}>
      {isEditing ? (
        <input
          autoFocus
          type="text"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onEndEdit}
          onKeyDown={(e) => e.key === "Enter" && onEndEdit()}
          className={inputClass}
          placeholder="Type something…"
        />
      ) : (
        <span className="text-[13px] text-white/70 truncate max-w-[200px]">
          {value ? String(value) : <span className="text-white/15">—</span>}
        </span>
      )}
    </div>
  );
}

function SelectBadge({ option }: { option: SelectOption }) {
  const colors = OPTION_COLORS[option.color];
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium", colors.bg, colors.text)}>
      {option.name}
    </span>
  );
}
