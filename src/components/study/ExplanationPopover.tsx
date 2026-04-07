"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectionTooltipPosition } from "./SelectionTooltip";

interface ExplanationPopoverProps {
  position: SelectionTooltipPosition;
  documentContext: string | null;
  onDismiss: () => void;
}

/**
 * Floating popover that streams an AI explanation for the selected text.
 * Appears anchored to the same position as the SelectionTooltip.
 * Manages its own fetch/streaming lifecycle internally.
 */
export function ExplanationPopover({
  position,
  documentContext,
  onDismiss,
}: ExplanationPopoverProps) {
  const [explanation, setExplanation] = useState("");
  const [isStreaming, setIsStreaming] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    const stream = async () => {
      try {
        const res = await fetch("/api/study/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selectedText: position.selectedText,
            documentContext,
          }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error("No response body");

        let result = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          result += decoder.decode(value, { stream: true });
          setExplanation(result);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Could not get an explanation. Please try again.");
      } finally {
        setIsStreaming(false);
      }
    };

    stream();
    return () => controller.abort();
  }, [position.selectedText, documentContext]);

  const handleCopy = async () => {
    if (!explanation) return;
    await navigator.clipboard.writeText(explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-label="AI Explanation"
      className="absolute z-50 pointer-events-auto"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%)",
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div
        className={cn(
          "flex w-80 flex-col gap-3 rounded-xl p-4 shadow-2xl",
          "border border-amber-500/25 bg-[#111]"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/20">
              <Sparkles className="h-3 w-3 text-amber-400" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400/80">
              AI Explanation
            </span>
          </div>
          <button
            id="explain-dismiss-btn"
            onClick={onDismiss}
            className="rounded p-1 text-white/30 transition-colors hover:text-white/70"
            aria-label="Dismiss explanation"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Quote */}
        <p className="truncate rounded-md bg-white/5 px-2 py-1.5 text-[10px] text-white/40 italic">
          &ldquo;
          {position.selectedText.length > 60
            ? `${position.selectedText.slice(0, 60)}…`
            : position.selectedText}
          &rdquo;
        </p>

        {/* Content */}
        <div className="max-h-48 overflow-y-auto custom-scrollbar text-[13px] leading-relaxed text-white/85">
          {error ? (
            <p className="text-red-400 text-[12px]">{error}</p>
          ) : explanation ? (
            <p className="whitespace-pre-wrap">{explanation}</p>
          ) : (
            <div className="flex items-center gap-2 text-white/40">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-400" />
              <span className="text-[12px]">Thinking…</span>
            </div>
          )}
        </div>

        {/* Footer actions — only after streaming finishes */}
        {!isStreaming && explanation && (
          <div className="flex items-center justify-end border-t border-white/5 pt-2">
            <button
              id="explain-copy-btn"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
            >
              {copied ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
