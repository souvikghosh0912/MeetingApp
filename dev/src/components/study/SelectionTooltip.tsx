"use client";

import { useState, useRef } from "react";
import { MessageSquarePlus, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectionTooltipPosition {
  x: number;
  y: number;
  selectedText: string;
}

interface SelectionTooltipProps {
  position: SelectionTooltipPosition;
  onSave: (text: string, note: string) => void;
  onExplain: () => void;
  onDismiss: () => void;
}

/**
 * Floating tooltip that appears above a text selection.
 * Renders an "Add Note" action, then an inline textarea for the note body.
 * Pressing Ctrl+Enter or clicking Save persists the annotation.
 */
export function SelectionTooltip({ position, onSave, onExplain, onDismiss }: SelectionTooltipProps) {
  const [showInput, setShowInput] = useState(false);
  const [noteText, setNoteText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAddClick = () => {
    setShowInput(true);
    // Let the DOM update, then focus
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleSave = () => {
    if (!noteText.trim()) return;
    onSave(position.selectedText, noteText.trim());
    setNoteText("");
    setShowInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      onDismiss();
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Add annotation"
      className="absolute z-50 pointer-events-auto"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%)",
      }}
      // Prevent mousedown from clearing text selection
      onMouseDown={(e) => e.preventDefault()}
    >
      {!showInput ? (
        /* ── Action pill ── */
        <div className="flex items-center gap-1 rounded-lg border border-white/20 bg-[#1a1a1a] px-2 py-1.5 shadow-xl">
          <button
            id="annotation-add-note-btn"
            onClick={handleAddClick}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold text-violet-300 transition-colors hover:bg-violet-500/10 hover:text-violet-200"
          >
            <MessageSquarePlus className="h-3 w-3" />
            Add Note
          </button>
          <div className="h-4 w-px bg-white/10" />
          <button
            id="explain-this-btn"
            onClick={onExplain}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold text-amber-300 transition-colors hover:bg-amber-500/10 hover:text-amber-200"
          >
            <Sparkles className="h-3 w-3" />
            Explain
          </button>
          <div className="h-4 w-px bg-white/10" />
          <button
            id="annotation-dismiss-btn"
            onClick={onDismiss}
            className="rounded p-1 text-white/30 transition-colors hover:text-white/70"
            aria-label="Dismiss"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        /* ── Input card ── */
        <div
          className={cn(
            "flex w-72 flex-col gap-2.5 rounded-xl border border-violet-500/30 bg-[#1a1a1a]",
            "p-3.5 shadow-2xl"
          )}
        >
          {/* Quote preview */}
          <p className="truncate text-[10px] font-medium text-white/40">
            <span className="text-violet-400">&ldquo;</span>
            {position.selectedText.length > 55
              ? `${position.selectedText.slice(0, 55)}…`
              : position.selectedText}
            <span className="text-violet-400">&rdquo;</span>
          </p>

          <textarea
            ref={textareaRef}
            id="annotation-note-textarea"
            rows={3}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write your note…"
            className={cn(
              "w-full resize-none rounded-lg border border-white/10 bg-white/5 p-2",
              "text-[12px] text-white/80 placeholder-white/25",
              "focus:border-violet-500/50 focus:outline-none transition-colors"
            )}
          />

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/25">Ctrl+Enter to save</span>
            <div className="flex items-center gap-2">
              <button
                id="annotation-cancel-btn"
                onClick={onDismiss}
                className="rounded px-2 py-1 text-[11px] text-white/30 transition-colors hover:text-white/70"
              >
                Cancel
              </button>
              <button
                id="annotation-save-btn"
                onClick={handleSave}
                disabled={!noteText.trim()}
                className={cn(
                  "rounded-md px-3 py-1 text-[11px] font-semibold text-white transition-colors",
                  "bg-violet-600 hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
                )}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
