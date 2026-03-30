"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Clock, Loader2, Command, X, Mic } from "lucide-react";
import { Transcript } from "@/types";
import { formatDate, formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  const handleSelect = useCallback((transcript: Transcript) => {
    router.push(`/transcripts/${transcript.id}`);
    onClose();
  }, [router, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, results, selectedIndex, handleSelect, onClose]);

  if (!open) return null;

  const getSentimentColor = (sentiment?: string) => {
    if (sentiment === "positive") return "text-emerald-400";
    if (sentiment === "negative") return "text-red-400";
    if (sentiment === "mixed") return "text-amber-400";
    return "text-white/30";
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-[15%] z-50 w-full max-w-[580px] -translate-x-1/2">
        <div className="mx-4 rounded-[16px] border border-white/[0.1] bg-[#141414] shadow-[0_32px_80px_rgba(0,0,0,0.7)] overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
            {loading ? (
              <Loader2 className="h-4 w-4 text-white/30 flex-shrink-0 animate-spin" />
            ) : (
              <Search className="h-4 w-4 text-white/30 flex-shrink-0" />
            )}
            <input
              ref={inputRef}
              type="text"
              placeholder="Search meetings, topics, decisions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-[14px] text-white placeholder-white/25 outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-white/20 hover:text-white/50 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-white/20 border border-white/10 rounded px-1.5 py-0.5">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {!query.trim() ? (
              <div className="px-4 py-8 text-center">
                <Command className="h-8 w-8 text-white/10 mx-auto mb-3" />
                <p className="text-[13px] text-white/25">
                  Type to search across all your meetings
                </p>
                <p className="text-[11px] text-white/15 mt-1">
                  Searches titles, transcripts, topics & decisions
                </p>
              </div>
            ) : results.length === 0 && !loading ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[13px] text-white/30">
                  No meetings found for &quot;{query}&quot;
                </p>
              </div>
            ) : (
              <div className="py-1.5">
                {results.length > 0 && (
                  <p className="px-4 py-2 text-[10px] text-white/25 uppercase tracking-widest font-semibold">
                    Meetings · {results.length} result{results.length !== 1 ? "s" : ""}
                  </p>
                )}
                {results.map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelect(t)}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors",
                      i === selectedIndex ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                    )}
                  >
                    {/* Icon */}
                    <div className="h-8 w-8 rounded-lg bg-blue-400/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Mic className="h-3.5 w-3.5 text-blue-400" strokeWidth={1.8} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-white truncate">{t.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-[11px] text-white/30">
                          <Clock className="h-3 w-3" />
                          {formatDate(t.created_at)}
                        </span>
                        {t.duration_seconds && (
                          <span className="text-[11px] text-white/25">
                            {formatDuration(t.duration_seconds)}
                          </span>
                        )}
                        {t.summary?.sentiment && (
                          <span className={cn("text-[11px] capitalize", getSentimentColor(t.summary.sentiment))}>
                            {t.summary.sentiment}
                          </span>
                        )}
                      </div>
                      {/* Snippet from TL;DR */}
                      {t.summary?.tldr?.[0] && (
                        <p className="text-[11px] text-white/25 mt-1 truncate">
                          {t.summary.tldr[0]}
                        </p>
                      )}
                    </div>

                    {/* Arrow */}
                    <span className="text-white/15 text-[13px] flex-shrink-0 mt-1">→</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.05]">
            <div className="flex items-center gap-4 text-[10px] text-white/20">
              <span className="flex items-center gap-1">
                <kbd className="border border-white/10 rounded px-1">↑</kbd>
                <kbd className="border border-white/10 rounded px-1">↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="border border-white/10 rounded px-1">↵</kbd>
                open
              </span>
            </div>
            <span className="text-[10px] text-white/15">
              <FileText className="h-3 w-3 inline mr-1" />
              Meeting Intelligence
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
