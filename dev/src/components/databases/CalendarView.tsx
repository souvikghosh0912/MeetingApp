"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, parseISO, isToday,
  addMonths, subMonths,
} from "date-fns";
import { cn } from "@/lib/utils";
import { DbProperty, DbRecord, CellValue } from "@/types/database";
import { RecordModal } from "./RecordModal";

interface CalendarViewProps {
  databaseId: string;
  databaseName: string;
  properties: DbProperty[];
  records: DbRecord[];
  datePropId: string | null;
  onRecordsChange: (records: DbRecord[]) => void;
}

export function CalendarView({
  databaseId,
  databaseName,
  properties,
  records,
  datePropId,
  onRecordsChange,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [openRecord, setOpenRecord] = useState<DbRecord | null>(null);
  const [activeDatePropId, setActiveDatePropId] = useState<string | null>(datePropId);

  const dateProps = properties.filter((p) => p.type === "date");
  const primaryProp = properties.find((p) => p.is_primary);

  // The property driving the calendar
  const activeDateProp = dateProps.find((p) => p.id === activeDatePropId) ?? dateProps[0] ?? null;

  // Build calendar grid days
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Map records to days
  const recordsByDay = useMemo(() => {
    const map: Record<string, DbRecord[]> = {};
    if (!activeDateProp) return map;
    for (const record of records) {
      const val = record.data[activeDateProp.id];
      if (!val || typeof val !== "string") continue;
      try {
        const day = parseISO(val);
        const key = format(day, "yyyy-MM-dd");
        map[key] = [...(map[key] ?? []), record];
      } catch {
        // invalid date value — skip
      }
    }
    return map;
  }, [records, activeDateProp]);

  const updateRecordData = async (recordId: string, data: Record<string, CellValue>) => {
    onRecordsChange(records.map((r) => (r.id === recordId ? { ...r, data } : r)));
    await fetch(`/api/databases/${databaseId}/records/${recordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });
  };

  const addRecordOnDay = async (day: Date) => {
    if (!activeDateProp) return;
    const data: Record<string, CellValue> = {
      [activeDateProp.id]: format(day, "yyyy-MM-dd"),
    };
    const res = await fetch(`/api/databases/${databaseId}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });
    const { record } = await res.json();
    if (record) {
      onRecordsChange([...records, record]);
      setOpenRecord(record);
    }
  };

  if (!activeDateProp) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-5xl">🗓️</div>
        <p className="text-[14px] text-white/40 font-medium">No Date property found</p>
        <p className="text-[12px] text-white/25">
          Add a <strong className="text-white/40">Date</strong> property to this database to use Calendar view.
        </p>
      </div>
    );
  }

  const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <>
      {/* ── Controls ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="h-7 w-7 rounded-md flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-[15px] font-semibold text-white min-w-[140px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="h-7 w-7 rounded-md flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="text-[11px] text-white/30 hover:text-white/60 border border-white/[0.08] rounded-md px-2.5 py-1 transition-colors ml-1"
          >
            Today
          </button>
        </div>

        {/* Date property picker */}
        {dateProps.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/30">Date field:</span>
            <select
              value={activeDatePropId ?? ""}
              onChange={(e) => setActiveDatePropId(e.target.value)}
              className="text-[12px] bg-white/[0.04] border border-white/[0.08] text-white/70 rounded-md px-2 py-1 outline-none"
            >
              {dateProps.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Calendar Grid ─────────────────────────────────────── */}
      <div className="flex-1 overflow-auto rounded-xl border border-white/[0.06] bg-white/[0.01]">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-white/[0.06]">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-2.5 text-center text-[11px] font-semibold text-white/30 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const key = format(day, "yyyy-MM-dd");
            const dayRecords = recordsByDay[key] ?? [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const todayDay = isToday(day);
            const isLast = idx === days.length - 1;

            return (
              <div
                key={key}
                className={cn(
                  "group min-h-[120px] border-b border-r border-white/[0.04] p-2 flex flex-col gap-1.5 transition-colors",
                  !isCurrentMonth && "opacity-40",
                  todayDay && "bg-indigo-500/[0.04]",
                  isLast && "border-r-0",
                  idx >= days.length - 7 && "border-b-0",
                  "hover:bg-white/[0.02]"
                )}
              >
                {/* Day number */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-[12px] font-semibold w-6 h-6 flex items-center justify-center rounded-full transition-all",
                      todayDay
                        ? "bg-indigo-500 text-white"
                        : "text-white/40 group-hover:text-white/60"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {isCurrentMonth && (
                    <button
                      onClick={() => addRecordOnDay(day)}
                      className="h-5 w-5 rounded flex items-center justify-center text-white/10 hover:text-white/60 hover:bg-white/[0.08] opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Records */}
                <div className="flex flex-col gap-1 overflow-hidden">
                  {dayRecords.slice(0, 3).map((record) => {
                    const title = primaryProp
                      ? String(record.data[primaryProp.id] ?? "")
                      : "";
                    return (
                      <button
                        key={record.id}
                        onClick={() => setOpenRecord(record)}
                        className="w-full text-left px-1.5 py-0.5 rounded-md text-[11px] text-white/80 font-medium bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/20 transition-colors truncate"
                      >
                        {title || "Untitled"}
                      </button>
                    );
                  })}
                  {dayRecords.length > 3 && (
                    <span className="text-[10px] text-white/25 pl-1">
                      +{dayRecords.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
