"use client";

import { useState, useMemo } from "react";
import { Plus, MoreHorizontal, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DbProperty, DbRecord, CellValue, SelectOption,
  OPTION_COLORS, COLOR_CYCLE,
} from "@/types/database";
import { RecordModal } from "./RecordModal";

interface KanbanViewProps {
  databaseId: string;
  databaseName: string;
  properties: DbProperty[];
  records: DbRecord[];
  groupByPropId: string | null;
  onRecordsChange: (records: DbRecord[]) => void;
}

export function KanbanView({
  databaseId,
  databaseName,
  properties,
  records,
  groupByPropId,
  onRecordsChange,
}: KanbanViewProps) {
  const [openRecord, setOpenRecord] = useState<DbRecord | null>(null);
  const [addingToGroup, setAddingToGroup] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");

  const groupProp = properties.find((p) => p.id === groupByPropId && p.type === "select");
  const primaryProp = properties.find((p) => p.is_primary);

  // Build columns from select options + "No status" column
  const columns = useMemo(() => {
    if (!groupProp) return [];
    const options = groupProp.config.options ?? [];
    const noGroup = { id: "__none", name: "No status", color: "slate" as const };
    return [noGroup, ...options];
  }, [groupProp]);

  // Group records
  const grouped = useMemo(() => {
    const map: Record<string, DbRecord[]> = {};
    for (const col of columns) map[col.id] = [];
    for (const record of records) {
      const val = groupProp ? (record.data[groupProp.id] as string | null) : null;
      const key = val && map[val] !== undefined ? val : "__none";
      map[key]?.push(record);
    }
    return map;
  }, [records, groupProp, columns]);

  const moveRecord = async (record: DbRecord, toGroupId: string) => {
    if (!groupProp) return;
    const newValue = toGroupId === "__none" ? null : toGroupId;
    const updated = records.map((r) =>
      r.id === record.id ? { ...r, data: { ...r.data, [groupProp.id]: newValue } } : r
    );
    onRecordsChange(updated);
    await fetch(`/api/databases/${databaseId}/records/${record.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: { [groupProp.id]: newValue } }),
    });
  };

  const updateRecordData = async (recordId: string, data: Record<string, CellValue>) => {
    onRecordsChange(records.map((r) => (r.id === recordId ? { ...r, data } : r)));
    await fetch(`/api/databases/${databaseId}/records/${recordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });
  };

  const addCard = async (groupId: string) => {
    if (!newCardTitle.trim() || !primaryProp) return;
    const initialData: Record<string, CellValue> = {
      [primaryProp.id]: newCardTitle.trim(),
    };
    if (groupProp && groupId !== "__none") initialData[groupProp.id] = groupId;

    const res = await fetch(`/api/databases/${databaseId}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: initialData }),
    });
    const { record } = await res.json();
    if (record) onRecordsChange([...records, record]);
    setNewCardTitle("");
    setAddingToGroup(null);
  };

  const deleteRecord = async (id: string) => {
    onRecordsChange(records.filter((r) => r.id !== id));
    await fetch(`/api/databases/${databaseId}/records/${id}`, { method: "DELETE" });
  };

  if (!groupProp) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-[14px] text-white/40">No select property to group by.</p>
        <p className="text-[12px] text-white/25">Add a &quot;Select&quot; property to use Board view.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 items-start">
        {columns.map((col) => {
          const colRecords = grouped[col.id] ?? [];
          const colors = col.id === "__none" ? { bg: "bg-slate-500/10", text: "text-slate-400" } : OPTION_COLORS[col.color];

          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-[280px] flex flex-col gap-2"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const recordId = e.dataTransfer.getData("recordId");
                const record = records.find((r) => r.id === recordId);
                if (record) moveRecord(record, col.id);
              }}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[12px] font-semibold", colors.text)}>
                    {col.name}
                  </span>
                  <span className="text-[11px] text-white/20 font-medium">
                    {colRecords.length}
                  </span>
                </div>
                <button
                  onClick={() => { setAddingToGroup(col.id); setNewCardTitle(""); }}
                  className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2">
                {colRecords.map((record) => (
                  <KanbanCard
                    key={record.id}
                    record={record}
                    primaryProp={primaryProp ?? null}
                    secondaryProps={properties.filter((p) => !p.is_primary && p.id !== groupProp.id).slice(0, 3)}
                    onClick={() => setOpenRecord(record)}
                    onDelete={() => deleteRecord(record.id)}
                    onDragStart={(e) => e.dataTransfer.setData("recordId", record.id)}
                  />
                ))}

                {/* Add card form */}
                {addingToGroup === col.id && (
                  <div className="rounded-lg border border-white/[0.1] bg-white/[0.04] p-2.5">
                    <input
                      autoFocus
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      placeholder="Card title…"
                      className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-white/25 mb-2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addCard(col.id);
                        if (e.key === "Escape") { setAddingToGroup(null); setNewCardTitle(""); }
                      }}
                    />
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => addCard(col.id)}
                        disabled={!newCardTitle.trim()}
                        className="text-[11px] bg-white text-black rounded-md px-2.5 py-1 font-medium hover:bg-white/90 disabled:opacity-40"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => { setAddingToGroup(null); setNewCardTitle(""); }}
                        className="text-[11px] text-white/40 hover:text-white/60 px-2 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Empty column */}
                {colRecords.length === 0 && addingToGroup !== col.id && (
                  <div className="h-14 rounded-lg border border-dashed border-white/[0.05] flex items-center justify-center">
                    <span className="text-[11px] text-white/15">No items</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
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
    </>
  );
}

function KanbanCard({
  record,
  primaryProp,
  secondaryProps,
  onClick,
  onDelete,
  onDragStart,
}: {
  record: DbRecord;
  primaryProp: DbProperty | null;
  secondaryProps: DbProperty[];
  onClick: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const title = primaryProp ? String(record.data[primaryProp.id] ?? "") : "";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="group rounded-lg border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.12] p-3 cursor-pointer transition-all"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-white leading-snug flex-1 min-w-0">
          {title || <span className="text-white/25 font-normal">Untitled</span>}
        </p>

        {/* Menu */}
        <div
          className="relative flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute top-6 right-0 z-20 min-w-[130px] rounded-lg border border-white/[0.08] bg-[#1a1a1a] shadow-xl py-1">
                <button
                  onClick={() => { setMenuOpen(false); onDelete(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-400 hover:bg-white/[0.05]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Secondary properties */}
      {secondaryProps.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {secondaryProps.map((prop) => {
            const val = record.data[prop.id];
            if (!val) return null;

            if (prop.type === "select") {
              const opt = prop.config.options?.find((o) => o.id === val);
              if (!opt) return null;
              const colors = OPTION_COLORS[opt.color];
              return (
                <span key={prop.id} className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", colors.bg, colors.text)}>
                  {opt.name}
                </span>
              );
            }
            if (prop.type === "checkbox") {
              return (
                <span key={prop.id} className="text-[10px] text-white/30">
                  {prop.name}: {val ? "✓" : "✗"}
                </span>
              );
            }
            if (prop.type === "date") {
              return (
                <span key={prop.id} className="text-[10px] text-white/30">
                  {new Date(String(val)).toLocaleDateString()}
                </span>
              );
            }
            return (
              <span key={prop.id} className="text-[10px] text-white/30 truncate max-w-[100px]">
                {String(val)}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
