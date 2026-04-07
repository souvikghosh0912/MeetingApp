"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FileText, Search } from "lucide-react";

interface PageOption {
  id: string;
  title: string;
  icon: string;
}

interface MentionPickerProps {
  anchorRect: DOMRect | null;
  onSelect: (page: PageOption) => void;
  onClose: () => void;
}

export function MentionPicker({ anchorRect, onSelect, onClose }: MentionPickerProps) {
  const [query, setQuery] = useState("");
  const [pages, setPages] = useState<PageOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const fetchPages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/pages${query ? `?q=${encodeURIComponent(query)}` : ""}`);
        const data = await res.json();
        setPages(
          (data.pages ?? []).slice(0, 8).map((p: PageOption) => ({
            id: p.id,
            title: p.title || "Untitled",
            icon: p.icon,
          }))
        );
        setSelected(0);
      } finally {
        setLoading(false);
      }
    };

    const id = setTimeout(fetchPages, 150);
    return () => clearTimeout(id);
  }, [query]);

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, pages.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (pages[selected]) onSelect(pages[selected]);
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [pages, selected, onSelect, onClose]
  );

  const style: React.CSSProperties = anchorRect
    ? {
        position: "fixed",
        top: anchorRect.bottom + 6,
        left: Math.min(anchorRect.left, window.innerWidth - 260),
        zIndex: 9999,
      }
    : { position: "fixed", top: "40%", left: "50%", transform: "translateX(-50%)", zIndex: 9999 };

  return (
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        ref={listRef}
        style={style}
        className="w-[240px] rounded-xl border border-white/[0.1] bg-[#111] shadow-2xl overflow-hidden"
        onKeyDown={handleKey}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.07]">
          <Search className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages…"
            className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/25 outline-none"
          />
        </div>

        {/* Results */}
        <div className="max-h-[240px] overflow-y-auto py-1">
          {loading && (
            <p className="px-3 py-2 text-[12px] text-white/30">Loading…</p>
          )}
          {!loading && pages.length === 0 && (
            <p className="px-3 py-2 text-[12px] text-white/30">No pages found</p>
          )}
          {!loading &&
            pages.map((page, i) => (
              <button
                key={page.id}
                onClick={() => onSelect(page)}
                onMouseEnter={() => setSelected(i)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                  i === selected ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"
                }`}
              >
                <span className="text-base leading-none">{page.icon}</span>
                <span className="text-[13px] text-white/80 truncate">
                  {page.title || "Untitled"}
                </span>
              </button>
            ))}
        </div>
      </div>
    </>
  );
}
