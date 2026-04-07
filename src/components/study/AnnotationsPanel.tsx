"use client";

import { StickyNote, X, Highlighter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Annotation } from "@/hooks/useAnnotations";

interface AnnotationsPanelProps {
  annotations: Annotation[];
  onDelete: (id: string) => void;
  onClose: () => void;
}

/**
 * Collapsible panel that lists all saved annotations for the current study page.
 * Each item shows the quoted text, the user note, the date, and a delete button.
 */
export function AnnotationsPanel({ annotations, onDelete, onClose }: AnnotationsPanelProps) {
  if (annotations.length === 0) return null;

  return (
    <div
      id="annotations-panel"
      className={cn(
        "shrink-0 max-h-56 overflow-y-auto custom-scrollbar",
        "rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-3"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-violet-400/80">
          <StickyNote className="h-3 w-3" />
          Notes ({annotations.length})
        </h3>
        <button
          id="annotations-panel-close"
          onClick={onClose}
          aria-label="Close annotations panel"
          className="rounded p-0.5 text-white/30 transition-colors hover:text-white/70"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* List */}
      <ul className="space-y-2">
        {annotations.map((ann) => (
          <li
            key={ann.id}
            className="group rounded-lg border border-white/5 bg-white/[0.03] p-3 space-y-1.5"
          >
            {/* Quoted selection */}
            <p className="line-clamp-2 text-[11px] italic text-violet-300/80">
              &ldquo;{ann.selectedText}&rdquo;
            </p>

            {/* Note body */}
            <p className="text-[12px] leading-snug text-white/75">{ann.note}</p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-0.5">
              <time
                dateTime={ann.createdAt}
                className="text-[10px] text-white/25"
              >
                {new Date(ann.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </time>
              <button
                id={`annotation-delete-${ann.id}`}
                onClick={() => onDelete(ann.id)}
                aria-label="Delete note"
                className="opacity-0 transition-opacity group-hover:opacity-100 rounded p-0.5 text-white/30 hover:text-red-400 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Badge shown in panel header when there are notes ──────────────────────────

interface AnnotationsBadgeProps {
  count: number;
  onClick: () => void;
}

export function AnnotationsBadge({ count, onClick }: AnnotationsBadgeProps) {
  if (count === 0) return null;
  return (
    <button
      id="annotations-badge-btn"
      onClick={onClick}
      title={`${count} annotation${count !== 1 ? "s" : ""}`}
      className="relative p-1.5 rounded-md text-white/40 border border-transparent hover:bg-white/10 hover:text-white/80 hover:border-white/10 transition-all duration-150 focus:outline-none"
    >
      <Highlighter className="h-3.5 w-3.5" />
      <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-violet-500 text-[8px] font-bold leading-none text-white">
        {count > 9 ? "9+" : count}
      </span>
    </button>
  );
}
