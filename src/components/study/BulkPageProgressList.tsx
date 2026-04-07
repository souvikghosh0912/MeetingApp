"use client";

import { BulkPageState } from "@/types";
import { Check, X, Loader2, Clock, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: BulkPageState["status"] }) {
  switch (status) {
    case "pending":
      return <Clock className="h-3.5 w-3.5 text-white/30" />;
    case "uploading":
    case "extracting":
      return <Loader2 className="h-3.5 w-3.5 text-violet-400 animate-spin" />;
    case "done":
      return <Check className="h-3.5 w-3.5 text-emerald-400" />;
    case "error":
      return <X className="h-3.5 w-3.5 text-red-400" />;
  }
}

function statusLabel(status: BulkPageState["status"]): string {
  switch (status) {
    case "pending":   return "Waiting…";
    case "uploading": return "Uploading…";
    case "extracting": return "Extracting text…";
    case "done":      return "Done";
    case "error":     return "Failed";
  }
}

/** Approximated progress percentage per status phase */
function statusPercent(status: BulkPageState["status"]): number {
  switch (status) {
    case "pending":   return 0;
    case "uploading": return 35;
    case "extracting": return 70;
    case "done":      return 100;
    case "error":     return 0;
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

interface BulkPageProgressListProps {
  pages: BulkPageState[];
  /** Index of the page currently being processed. -1 = not started. */
  currentIndex: number;
  isSummarizing: boolean;
  isDone: boolean;
}

export function BulkPageProgressList({
  pages,
  currentIndex,
  isSummarizing,
  isDone,
}: BulkPageProgressListProps) {
  const doneCount = pages.filter((p) => p.status === "done").length;
  const errorCount = pages.filter((p) => p.status === "error").length;
  const totalCount = pages.length;
  const overallPct = isSummarizing || isDone
    ? 100
    : Math.round((doneCount / totalCount) * 100);

  return (
    <div className="space-y-5">
      {/* Overall progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-white/50 font-medium">
            {isDone
              ? "All done!"
              : isSummarizing
              ? "Generating combined summary…"
              : `Processing pages…`}
          </span>
          <span className="text-white/35 tabular-nums">
            {doneCount} / {totalCount} extracted
            {errorCount > 0 && (
              <span className="ml-2 text-red-400">({errorCount} failed)</span>
            )}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/[0.07] overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              isDone ? "bg-emerald-400" : "bg-violet-500"
            )}
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>

      {/* Per-page rows */}
      <div className="space-y-2">
        {pages.map((page, i) => {
          const isActive = i === currentIndex;
          const pct = isActive ? statusPercent(page.status) : page.status === "done" ? 100 : 0;

          return (
            <div
              key={i}
              className={cn(
                "rounded-xl border px-4 py-3 transition-all duration-300",
                page.status === "done"
                  ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                  : page.status === "error"
                  ? "border-red-500/20 bg-red-500/[0.04]"
                  : isActive
                  ? "border-violet-500/30 bg-violet-500/[0.05]"
                  : "border-white/[0.05] bg-white/[0.015]"
              )}
            >
              <div className="flex items-center gap-3">
                {/* Status icon bubble */}
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-lg flex-shrink-0",
                    page.status === "done"
                      ? "bg-emerald-500/10"
                      : page.status === "error"
                      ? "bg-red-500/10"
                      : isActive
                      ? "bg-violet-500/10"
                      : "bg-white/[0.04]"
                  )}
                >
                  <StatusIcon status={page.status} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "text-[12px] font-medium truncate",
                        page.status === "done"
                          ? "text-white/70"
                          : page.status === "error"
                          ? "text-red-400"
                          : isActive
                          ? "text-white"
                          : "text-white/35"
                      )}
                    >
                      Page {i + 1} — {page.file.name}
                    </p>
                    <span
                      className={cn(
                        "text-[10px] font-semibold flex-shrink-0",
                        page.status === "done"
                          ? "text-emerald-400"
                          : page.status === "error"
                          ? "text-red-400"
                          : isActive
                          ? "text-violet-400"
                          : "text-white/20"
                      )}
                    >
                      {statusLabel(page.status)}
                    </span>
                  </div>

                  {/* Per-file progress bar (only for active or done) */}
                  {(isActive || page.status === "done") && (
                    <div className="mt-1.5 h-0.5 w-full rounded-full bg-white/[0.07] overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          page.status === "done" ? "bg-emerald-400" : "bg-violet-400"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}

                  {/* Inline error message */}
                  {page.status === "error" && page.error && (
                    <p className="text-[10px] text-red-400/70 mt-0.5 truncate">
                      {page.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Combined summary step — shown after OCR loop completes */}
        {(isSummarizing || isDone) && (
          <div
            className={cn(
              "rounded-xl border px-4 py-3 transition-all duration-500",
              isDone
                ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                : "border-violet-500/30 bg-violet-500/[0.05]"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-lg flex-shrink-0",
                  isDone ? "bg-emerald-500/10" : "bg-violet-500/10"
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-violet-400 animate-pulse" />
                )}
              </div>
              <p
                className={cn(
                  "text-[12px] font-medium",
                  isDone ? "text-emerald-400" : "text-violet-300"
                )}
              >
                {isDone
                  ? "Combined summary ready — redirecting…"
                  : "Generating combined AI summary across all pages…"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
