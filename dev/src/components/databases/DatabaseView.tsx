"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Table2, Kanban, CalendarDays, Search, SlidersHorizontal,
  ArrowLeft, MoreHorizontal, Pencil, Trash2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DbProperty, DbRecord, DbView, UserDatabase, ViewType,
  FilterConfig, SortConfig,
} from "@/types/database";
import { TableView } from "./TableView";
import { KanbanView } from "./KanbanView";
import { CalendarView } from "./CalendarView";
import { FilterSortPanel, applyFiltersAndSort } from "./FilterSortPanel";

interface DatabaseViewProps {
  initialDatabase: UserDatabase;
  initialProperties: DbProperty[];
  initialRecords: DbRecord[];
  initialViews: DbView[];
}

const VIEW_ICONS = {
  table: Table2,
  kanban: Kanban,
  calendar: CalendarDays,
};

export function DatabaseView({
  initialDatabase,
  initialProperties,
  initialRecords,
  initialViews,
}: DatabaseViewProps) {
  const router = useRouter();
  const [database, setDatabase] = useState(initialDatabase);
  const [properties, setProperties] = useState<DbProperty[]>(initialProperties);
  const [records, setRecords] = useState<DbRecord[]>(initialRecords);
  const [views] = useState<DbView[]>(initialViews);
  const [activeViewId, setActiveViewId] = useState<string>(
    initialViews.find((v) => v.is_default)?.id ?? initialViews[0]?.id ?? ""
  );
  const [search, setSearch] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(database.name);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [filterSortOpen, setFilterSortOpen] = useState(false);

  // Per-view filter/sort state (stored locally; could persist to DbView.config)
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [sortBy, setSortBy] = useState<SortConfig[]>([]);

  const activeView = views.find((v) => v.id === activeViewId) ?? views[0];

  // 1. Search by primary property
  const searchedRecords = search.trim()
    ? records.filter((r) => {
        const primary = properties.find((p) => p.is_primary);
        if (!primary) return true;
        return String(r.data[primary.id] ?? "").toLowerCase().includes(search.toLowerCase());
      })
    : records;

  // 2. Apply filters + sort
  const filteredRecords = applyFiltersAndSort(searchedRecords, filters, sortBy, properties);

  const activeFilterCount = filters.length + sortBy.length;

  const handleRename = async () => {
    if (!nameDraft.trim()) return;
    setDatabase((d) => ({ ...d, name: nameDraft.trim() }));
    setRenaming(false);
    await fetch(`/api/databases/${database.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameDraft.trim() }),
    });
  };

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/databases/${database.id}`, { method: "DELETE" });
    router.push("/databases");
    router.refresh();
  };

  const handleRecordsChange = useCallback((updated: DbRecord[]) => {
    setRecords(updated);
  }, []);

  const handlePropertiesChange = useCallback((updated: DbProperty[]) => {
    setProperties(updated);
  }, []);

  const kanbanGroupProp =
    activeView?.type === "kanban"
      ? (activeView.config?.groupBy ?? properties.find((p) => p.type === "select")?.id ?? null)
      : null;

  return (
    <div className="flex flex-col h-full gap-0">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push("/databases")}
            className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.06] transition-all flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
            style={{ backgroundColor: database.color + "18", border: `1px solid ${database.color}30` }}
          >
            {database.icon}
          </div>

          {renaming ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") { setNameDraft(database.name); setRenaming(false); }
              }}
              className="text-[18px] font-semibold text-white bg-transparent outline-none border-b border-white/20 leading-tight min-w-0"
            />
          ) : (
            <h1 className="text-[18px] font-semibold text-white tracking-tight truncate leading-tight">
              {database.name}
            </h1>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rows…"
              className="h-8 w-44 pl-8 pr-3 rounded-lg bg-white/[0.04] border border-white/[0.07] text-[12px] text-white placeholder:text-white/25 outline-none focus:border-white/15 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Filter/Sort */}
          <div className="relative">
            <button
              onClick={() => setFilterSortOpen((o) => !o)}
              className={cn(
                "flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[12px] font-medium transition-all",
                filterSortOpen || activeFilterCount > 0
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                  : "bg-white/[0.04] border-white/[0.07] text-white/40 hover:text-white/70 hover:border-white/15"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {activeFilterCount > 0 ? `${activeFilterCount} active` : "Filter & Sort"}
            </button>

            {filterSortOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setFilterSortOpen(false)} />
                <div className="absolute top-10 right-0 z-40">
                  <FilterSortPanel
                    properties={properties}
                    filters={filters}
                    sortBy={sortBy}
                    onFiltersChange={setFilters}
                    onSortChange={setSortBy}
                    onClose={() => setFilterSortOpen(false)}
                  />
                </div>
              </>
            )}
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.06] border border-white/[0.07] transition-all"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute top-10 right-0 z-20 min-w-[160px] rounded-lg border border-white/[0.08] bg-[#1a1a1a] shadow-xl py-1">
                  <button
                    onClick={() => { setMenuOpen(false); setRenaming(true); setNameDraft(database.name); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-white/70 hover:bg-white/[0.05] hover:text-white transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Rename
                  </button>
                  <div className="my-1 border-t border-white/[0.06]" />
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-400 hover:bg-white/[0.05] disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deleting ? "Deleting…" : "Delete database"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── View tabs ─────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 border-b border-white/[0.06] mb-0 -mx-1 px-1">
        {views.map((view) => {
          const Icon = VIEW_ICONS[view.type] ?? Table2;
          const isActive = view.id === activeViewId;
          return (
            <button
              key={view.id}
              onClick={() => setActiveViewId(view.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium transition-all border-b-2 -mb-px",
                isActive
                  ? "text-white border-white"
                  : "text-white/40 border-transparent hover:text-white/70 hover:border-white/20"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {view.name}
            </button>
          );
        })}
      </div>

      {/* ── Stats bar ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4 py-2 mb-2">
        <span className="text-[11px] text-white/25">
          {filteredRecords.length}{" "}
          {filteredRecords.length === 1 ? "row" : "rows"}
          {search && ` matching "${search}"`}
          {filters.length > 0 && ` · ${filters.length} filter${filters.length > 1 ? "s" : ""}`}
          {sortBy.length > 0 && ` · sorted by ${sortBy.length} column${sortBy.length > 1 ? "s" : ""}`}
        </span>
        {(filters.length > 0 || sortBy.length > 0) && (
          <button
            onClick={() => { setFilters([]); setSortBy([]); }}
            className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── View content ──────────────────────────────────────── */}
      {activeView?.type === "table" && (
        <TableView
          databaseId={database.id}
          databaseName={database.name}
          properties={properties}
          records={filteredRecords}
          onPropertiesChange={handlePropertiesChange}
          onRecordsChange={handleRecordsChange}
        />
      )}

      {activeView?.type === "kanban" && (
        <KanbanView
          databaseId={database.id}
          databaseName={database.name}
          properties={properties}
          records={filteredRecords}
          groupByPropId={kanbanGroupProp}
          onRecordsChange={handleRecordsChange}
        />
      )}

      {activeView?.type === "calendar" && (
        <CalendarView
          databaseId={database.id}
          databaseName={database.name}
          properties={properties}
          records={filteredRecords}
          datePropId={
            activeView.config?.datePropId ??
            properties.find((p) => p.type === "date")?.id ??
            null
          }
          onRecordsChange={handleRecordsChange}
        />
      )}
    </div>
  );
}
