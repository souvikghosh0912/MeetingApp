"use client";

import { useState } from "react";
import { X, Plus, SlidersHorizontal, ArrowUpDown, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { DbProperty, FilterConfig, SortConfig, CellValue, OPTION_COLORS } from "@/types/database";

interface FilterSortPanelProps {
  properties: DbProperty[];
  filters: FilterConfig[];
  sortBy: SortConfig[];
  onFiltersChange: (filters: FilterConfig[]) => void;
  onSortChange: (sort: SortConfig[]) => void;
  onClose: () => void;
}

type FilterOperator = "is" | "is_not" | "contains" | "not_contains" | "is_empty" | "is_not_empty" | "gt" | "lt";

const OPERATORS_BY_TYPE: Record<string, { value: FilterOperator; label: string }[]> = {
  text:         [{ value: "contains", label: "contains" }, { value: "not_contains", label: "doesn't contain" }, { value: "is", label: "is" }, { value: "is_not", label: "is not" }, { value: "is_empty", label: "is empty" }, { value: "is_not_empty", label: "is not empty" }],
  url:          [{ value: "contains", label: "contains" }, { value: "not_contains", label: "doesn't contain" }, { value: "is_empty", label: "is empty" }, { value: "is_not_empty", label: "is not empty" }],
  email:        [{ value: "contains", label: "contains" }, { value: "not_contains", label: "doesn't contain" }, { value: "is_empty", label: "is empty" }, { value: "is_not_empty", label: "is not empty" }],
  phone:        [{ value: "contains", label: "contains" }, { value: "is_empty", label: "is empty" }],
  number:       [{ value: "is", label: "=" }, { value: "is_not", label: "≠" }, { value: "gt", label: ">" }, { value: "lt", label: "<" }, { value: "is_empty", label: "is empty" }],
  select:       [{ value: "is", label: "is" }, { value: "is_not", label: "is not" }, { value: "is_empty", label: "is empty" }, { value: "is_not_empty", label: "is not empty" }],
  multi_select: [{ value: "contains", label: "contains" }, { value: "not_contains", label: "doesn't contain" }, { value: "is_empty", label: "is empty" }],
  date:         [{ value: "is", label: "is" }, { value: "is_not", label: "is not" }, { value: "gt", label: "is after" }, { value: "lt", label: "is before" }, { value: "is_empty", label: "is empty" }],
  checkbox:     [{ value: "is", label: "is" }],
  relation:     [{ value: "is_empty", label: "is empty" }, { value: "is_not_empty", label: "is not empty" }],
};

function getOperators(prop: DbProperty) {
  return OPERATORS_BY_TYPE[prop.type] ?? OPERATORS_BY_TYPE["text"];
}

function FilterValueInput({
  property,
  operator,
  value,
  onChange,
}: {
  property: DbProperty;
  operator: FilterOperator;
  value: CellValue;
  onChange: (v: CellValue) => void;
}) {
  if (operator === "is_empty" || operator === "is_not_empty") return null;

  const inputClass =
    "h-7 px-2 rounded-md bg-white/[0.05] border border-white/[0.08] text-[12px] text-white placeholder:text-white/25 outline-none focus:border-white/20 transition-colors";

  if (property.type === "select") {
    const options = property.config.options ?? [];
    return (
      <select
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, "[color-scheme:dark] cursor-pointer")}
      >
        <option value="">Select option…</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    );
  }

  if (property.type === "multi_select") {
    const options = property.config.options ?? [];
    return (
      <select
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, "[color-scheme:dark] cursor-pointer")}
      >
        <option value="">Select option…</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    );
  }

  if (property.type === "checkbox") {
    return (
      <select
        value={String(value ?? "true")}
        onChange={(e) => onChange(e.target.value === "true")}
        className={cn(inputClass, "[color-scheme:dark] cursor-pointer")}
      >
        <option value="true">Checked</option>
        <option value="false">Unchecked</option>
      </select>
    );
  }

  if (property.type === "date") {
    return (
      <input
        type="date"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, "[color-scheme:dark]")}
      />
    );
  }

  if (property.type === "number") {
    return (
      <input
        type="number"
        value={value !== null && value !== undefined ? String(value) : ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        placeholder="Enter value…"
        className={inputClass}
      />
    );
  }

  return (
    <input
      type="text"
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter value…"
      className={inputClass}
    />
  );
}

export function FilterSortPanel({
  properties,
  filters,
  sortBy,
  onFiltersChange,
  onSortChange,
  onClose,
}: FilterSortPanelProps) {
  const [activeTab, setActiveTab] = useState<"filter" | "sort">("filter");

  // ── Filter helpers ────────────────────────────────────────────
  const addFilter = () => {
    const firstProp = properties[0];
    if (!firstProp) return;
    const ops = getOperators(firstProp);
    onFiltersChange([
      ...filters,
      { propertyId: firstProp.id, operator: ops[0].value as FilterConfig["operator"], value: null },
    ]);
  };

  const updateFilter = (index: number, patch: Partial<FilterConfig>) => {
    const updated = filters.map((f, i) => {
      if (i !== index) return f;
      const next = { ...f, ...patch };
      // Reset value when property changes
      if (patch.propertyId && patch.propertyId !== f.propertyId) {
        next.value = null;
        const prop = properties.find((p) => p.id === patch.propertyId);
        if (prop) {
          const ops = getOperators(prop);
          next.operator = ops[0].value as FilterConfig["operator"];
        }
      }
      return next;
    });
    onFiltersChange(updated);
  };

  const removeFilter = (index: number) => {
    onFiltersChange(filters.filter((_, i) => i !== index));
  };

  // ── Sort helpers ──────────────────────────────────────────────
  const addSort = () => {
    const usedIds = sortBy.map((s) => s.propertyId);
    const firstUnused = properties.find((p) => !usedIds.includes(p.id));
    if (!firstUnused) return;
    onSortChange([...sortBy, { propertyId: firstUnused.id, direction: "asc" }]);
  };

  const updateSort = (index: number, patch: Partial<SortConfig>) => {
    onSortChange(sortBy.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const removeSort = (index: number) => {
    onSortChange(sortBy.filter((_, i) => i !== index));
  };

  const selectClass =
    "h-7 px-2 rounded-md bg-white/[0.05] border border-white/[0.08] text-[12px] text-white outline-none focus:border-white/20 [color-scheme:dark] cursor-pointer transition-colors";

  return (
    <div className="w-[360px] rounded-xl border border-white/[0.1] bg-[#111] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("filter")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all",
              activeTab === "filter"
                ? "bg-white/[0.08] text-white"
                : "text-white/40 hover:text-white/70"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
            {filters.length > 0 && (
              <span className="ml-1 bg-indigo-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {filters.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("sort")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all",
              activeTab === "sort"
                ? "bg-white/[0.08] text-white"
                : "text-white/40 hover:text-white/70"
            )}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort
            {sortBy.length > 0 && (
              <span className="ml-1 bg-indigo-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {sortBy.length}
              </span>
            )}
          </button>
        </div>
        <button
          onClick={onClose}
          className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.08] transition-all"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
        {/* ── Filters ── */}
        {activeTab === "filter" && (
          <>
            {filters.length === 0 && (
              <p className="text-[12px] text-white/30 text-center py-3">
                No filters applied. Add one to narrow down rows.
              </p>
            )}

            {filters.map((filter, index) => {
              const prop = properties.find((p) => p.id === filter.propertyId);
              const ops = prop ? getOperators(prop) : [];
              return (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                >
                  <div className="flex-1 space-y-2">
                    {/* Row 1: property selector + operator */}
                    <div className="flex items-center gap-2">
                      <select
                        value={filter.propertyId}
                        onChange={(e) => updateFilter(index, { propertyId: e.target.value })}
                        className={selectClass}
                      >
                        {properties.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <select
                        value={filter.operator}
                        onChange={(e) => updateFilter(index, { operator: e.target.value as FilterConfig["operator"] })}
                        className={selectClass}
                      >
                        {ops.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Row 2: value input */}
                    {prop && (
                      <FilterValueInput
                        property={prop}
                        operator={filter.operator as FilterOperator}
                        value={filter.value}
                        onChange={(v) => updateFilter(index, { value: v })}
                      />
                    )}
                  </div>

                  <button
                    onClick={() => removeFilter(index)}
                    className="h-6 w-6 rounded flex items-center justify-center text-white/20 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })}

            <button
              onClick={addFilter}
              className="w-full flex items-center gap-2 justify-center py-2 rounded-lg border border-dashed border-white/[0.1] text-[12px] text-white/40 hover:text-white/70 hover:border-white/[0.2] transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              Add filter
            </button>
          </>
        )}

        {/* ── Sort ── */}
        {activeTab === "sort" && (
          <>
            {sortBy.length === 0 && (
              <p className="text-[12px] text-white/30 text-center py-3">
                No sort applied. Add rules to order rows.
              </p>
            )}

            {sortBy.map((sort, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]"
              >
                {/* Drag handle visual indicator */}
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-3 h-px bg-white/20 rounded" />
                  ))}
                </div>

                <select
                  value={sort.propertyId}
                  onChange={(e) => updateSort(index, { propertyId: e.target.value })}
                  className={cn(selectClass, "flex-1")}
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <button
                  onClick={() =>
                    updateSort(index, { direction: sort.direction === "asc" ? "desc" : "asc" })
                  }
                  className="flex items-center gap-1 h-7 px-2 rounded-md bg-white/[0.05] border border-white/[0.08] text-[12px] text-white/70 hover:text-white hover:border-white/20 transition-all flex-shrink-0"
                >
                  {sort.direction === "asc" ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  {sort.direction === "asc" ? "Asc" : "Desc"}
                </button>

                <button
                  onClick={() => removeSort(index)}
                  className="h-6 w-6 rounded flex items-center justify-center text-white/20 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}

            <button
              onClick={addSort}
              disabled={sortBy.length >= properties.length}
              className="w-full flex items-center gap-2 justify-center py-2 rounded-lg border border-dashed border-white/[0.1] text-[12px] text-white/40 hover:text-white/70 hover:border-white/[0.2] transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <Plus className="h-3.5 w-3.5" />
              Add sort rule
            </button>
          </>
        )}
      </div>

      {/* Footer — clear all */}
      {((activeTab === "filter" && filters.length > 0) ||
        (activeTab === "sort" && sortBy.length > 0)) && (
        <div className="px-4 py-2 border-t border-white/[0.07]">
          <button
            onClick={() => {
              if (activeTab === "filter") onFiltersChange([]);
              else onSortChange([]);
            }}
            className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
          >
            Clear all {activeTab === "filter" ? "filters" : "sort rules"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Filter/sort logic — apply to records ──────────────────────
export function applyFiltersAndSort(
  records: import("@/types/database").DbRecord[],
  filters: FilterConfig[],
  sortBy: SortConfig[],
  properties: DbProperty[]
): import("@/types/database").DbRecord[] {
  let result = [...records];

  // Apply filters
  for (const filter of filters) {
    result = result.filter((record) => {
      const val = record.data[filter.propertyId];
      const filterVal = filter.value;
      const op = filter.operator as FilterOperator;

      switch (op) {
        case "is_empty":
          return val === null || val === undefined || val === "" || (Array.isArray(val) && val.length === 0);
        case "is_not_empty":
          return val !== null && val !== undefined && val !== "" && !(Array.isArray(val) && val.length === 0);
        case "is":
          if (typeof val === "boolean") return val === (filterVal === "true" || filterVal === true);
          return String(val ?? "") === String(filterVal ?? "");
        case "is_not":
          return String(val ?? "") !== String(filterVal ?? "");
        case "contains":
          if (Array.isArray(val)) return val.includes(String(filterVal));
          return String(val ?? "").toLowerCase().includes(String(filterVal ?? "").toLowerCase());
        case "not_contains":
          if (Array.isArray(val)) return !val.includes(String(filterVal));
          return !String(val ?? "").toLowerCase().includes(String(filterVal ?? "").toLowerCase());
        case "gt":
          return Number(val ?? 0) > Number(filterVal ?? 0);
        case "lt":
          return Number(val ?? 0) < Number(filterVal ?? 0);
        default:
          return true;
      }
    });
  }

  // Apply sort (stable multi-column)
  if (sortBy.length > 0) {
    result.sort((a, b) => {
      for (const sort of sortBy) {
        const prop = properties.find((p) => p.id === sort.propertyId);
        const aVal = a.data[sort.propertyId];
        const bVal = b.data[sort.propertyId];
        let cmp = 0;

        if (prop?.type === "number") {
          cmp = (Number(aVal ?? 0)) - (Number(bVal ?? 0));
        } else if (prop?.type === "checkbox") {
          cmp = (aVal ? 1 : 0) - (bVal ? 1 : 0);
        } else if (prop?.type === "date") {
          cmp = new Date(String(aVal ?? "")).getTime() - new Date(String(bVal ?? "")).getTime();
        } else {
          cmp = String(aVal ?? "").localeCompare(String(bVal ?? ""));
        }

        if (cmp !== 0) return sort.direction === "asc" ? cmp : -cmp;
      }
      return 0;
    });
  }

  return result;
}
