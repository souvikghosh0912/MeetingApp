"use client";

import { useState } from "react";
import { Search, X, Loader2, Database } from "lucide-react";

interface DatabaseOption {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface RelationConfigModalProps {
  currentDatabaseId: string;
  allDatabases: DatabaseOption[];
  onConfirm: (targetId: string, targetName: string) => void;
  onCancel: () => void;
}

export function RelationConfigModal({
  currentDatabaseId,
  allDatabases,
  onConfirm,
  onCancel,
}: RelationConfigModalProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<DatabaseOption | null>(null);

  const otherDbs = allDatabases.filter(
    (db) => db.id !== currentDatabaseId
  );
  const filtered = otherDbs.filter((db) =>
    !query || db.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={onCancel} />
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] rounded-2xl border border-white/[0.08] bg-[#131313] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <h3 className="text-[14px] font-semibold text-white">Link to database</h3>
            <p className="text-[11px] text-white/35 mt-0.5">Choose which database to relate to</p>
          </div>
          <button onClick={onCancel} className="h-6 w-6 rounded-md flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.06] transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative px-5 py-3 border-b border-white/[0.06]">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search databases…"
            className="w-full pl-7 text-[13px] text-white bg-transparent outline-none placeholder:text-white/20"
          />
        </div>

        {/* Database list */}
        <div className="max-h-[260px] overflow-y-auto py-1">
          {otherDbs.length === 0 && (
            <div className="py-8 text-center text-[12px] text-white/25">
              No other databases yet. Create one first.
            </div>
          )}
          {otherDbs.length > 0 && filtered.length === 0 && (
            <div className="py-8 text-center text-[12px] text-white/25">No match</div>
          )}
          {filtered.map((db) => (
            <button
              key={db.id}
              onClick={() => setSelected(db)}
              className={`w-full flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.04] transition-colors text-left ${
                selected?.id === db.id ? "bg-indigo-500/10" : ""
              }`}
            >
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                style={{ backgroundColor: db.color + "18", border: `1px solid ${db.color}30` }}
              >
                {db.icon}
              </div>
              <span className={`text-[13px] font-medium truncate ${selected?.id === db.id ? "text-white" : "text-white/70"}`}>
                {db.name}
              </span>
              {selected?.id === db.id && (
                <div className="ml-auto h-4 w-4 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                  <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="h-8 px-4 rounded-lg text-[12px] text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => selected && onConfirm(selected.id, selected.name)}
            disabled={!selected}
            className="h-8 px-4 rounded-lg text-[12px] font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add relation
          </button>
        </div>
      </div>
    </>
  );
}
