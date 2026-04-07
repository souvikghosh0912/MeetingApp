"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2, Link2 } from "lucide-react";

interface RecordRef {
  id: string;
  title: string;
}

interface RelationPickerProps {
  targetDatabaseId: string;
  targetDatabaseName: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
}

export function RelationPicker({
  targetDatabaseId,
  targetDatabaseName,
  selectedIds,
  onChange,
  onClose,
}: RelationPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RecordRef[]>([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchRecords = useCallback(async (q: string) => {
    setLoading(true);
    const url = `/api/databases/${targetDatabaseId}/records/search?q=${encodeURIComponent(q)}`;
    const res = await fetch(url);
    const data = await res.json();
    setResults(data.records ?? []);
    setLoading(false);
  }, [targetDatabaseId]);

  useEffect(() => {
    fetchRecords("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [fetchRecords]);

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => fetchRecords(query), 300);
    return () => clearTimeout(id);
  }, [query, fetchRecords]);

  const toggle = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((s) => s !== id)
      : [...selectedIds, id];
    onChange(next);
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute z-50 top-full left-0 mt-1 w-[280px] rounded-xl border border-white/[0.08] bg-[#1a1a1a] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06]">
          <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider flex-1 truncate">
            {targetDatabaseName}
          </span>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative px-3 py-2 border-b border-white/[0.06]">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/25" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${targetDatabaseName}…`}
            className="w-full pl-6 text-[13px] text-white bg-transparent outline-none placeholder:text-white/20"
          />
        </div>

        {/* Results */}
        <div className="max-h-[220px] overflow-y-auto py-1">
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 text-white/25 animate-spin" />
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="py-6 text-center text-[12px] text-white/25">No records found</div>
          )}
          {!loading && results.map((record) => {
            const isSelected = selectedIds.includes(record.id);
            return (
              <button
                key={record.id}
                onClick={() => toggle(record.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.04] transition-colors text-left"
              >
                <div className={`h-3.5 w-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected ? "bg-indigo-500 border-indigo-500" : "border-white/20"
                }`}>
                  {isSelected && (
                    <svg className="h-2 w-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-[13px] text-white/70 hover:text-white truncate flex-1">
                  {record.title || "Untitled"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected count */}
        {selectedIds.length > 0 && (
          <div className="px-3 py-2 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-[11px] text-white/35">
              {selectedIds.length} linked
            </span>
            <button
              onClick={() => onChange([])}
              className="text-[11px] text-white/30 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Compact chip display for linked records ─────────────────────

interface RelationChipsProps {
  recordIds: string[];
  targetDatabaseId: string;
}

export function RelationChips({ recordIds, targetDatabaseId }: RelationChipsProps) {
  const [records, setRecords] = useState<RecordRef[]>([]);

  useEffect(() => {
    if (!recordIds.length) { setRecords([]); return; }
    fetch(`/api/databases/${targetDatabaseId}/records/search?q=`)
      .then((r) => r.json())
      .then((d) => {
        const all: RecordRef[] = d.records ?? [];
        setRecords(all.filter((r) => recordIds.includes(r.id)));
      })
      .catch(() => {});
  }, [recordIds, targetDatabaseId]);

  if (!recordIds.length) return <span className="text-white/15 text-[12px]">—</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {records.map((r) => (
        <span
          key={r.id}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
        >
          <Link2 className="h-2.5 w-2.5" />
          {r.title || "Untitled"}
        </span>
      ))}
      {recordIds.length > records.length && (
        <span className="text-[11px] text-white/25">+{recordIds.length - records.length}</span>
      )}
    </div>
  );
}
