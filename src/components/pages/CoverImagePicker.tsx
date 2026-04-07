"use client";

import { useState } from "react";
import { X, Image, Link2 } from "lucide-react";

const GRADIENT_PRESETS = [
  { label: "Ocean", value: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)" },
  { label: "Sunset", value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { label: "Forest", value: "linear-gradient(135deg, #134e5e 0%, #71b280 100%)" },
  { label: "Dusk",   value: "linear-gradient(135deg, #2d3561 0%, #c05c7e 100%)" },
  { label: "Fire",   value: "linear-gradient(135deg, #f46b45 0%, #eea849 100%)" },
  { label: "Storm",  value: "linear-gradient(135deg, #373b44 0%, #4286f4 100%)" },
  { label: "Rose",   value: "linear-gradient(135deg, #f9d4e2 0%, #f4acba 50%, #e06b85 100%)" },
  { label: "Mint",   value: "linear-gradient(135deg, #d4f1db 0%, #7ec8a4 50%, #2d9e6b 100%)" },
  { label: "Slate",  value: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" },
  { label: "Amber",  value: "linear-gradient(135deg, #3d1c1c 0%, #8b4513 50%, #d2691e 100%)" },
];

interface CoverImagePickerProps {
  currentCover: string | null;
  onSelect: (cover: string | null) => void;
  onClose: () => void;
}

export function CoverImagePicker({ currentCover, onSelect, onClose }: CoverImagePickerProps) {
  const [urlInput, setUrlInput] = useState("");
  const [tab, setTab] = useState<"gradient" | "url">("gradient");

  const handleUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onSelect(trimmed);
    onClose();
  };

  return (
    <div className="absolute top-full left-0 z-50 mt-1 w-[340px] rounded-xl border border-white/[0.1] bg-[#111] shadow-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-semibold text-white/80">Cover image</p>
        <button
          onClick={onClose}
          className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.08] transition-all"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 border-b border-white/[0.07] -mx-4 px-4">
        {[
          { key: "gradient" as const, label: "Gradients" },
          { key: "url" as const, label: "Image URL" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-[12px] font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? "border-white text-white"
                : "border-transparent text-white/40 hover:text-white/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "gradient" && (
        <div className="grid grid-cols-5 gap-2">
          {GRADIENT_PRESETS.map((g) => (
            <button
              key={g.value}
              onClick={() => { onSelect(g.value); onClose(); }}
              className={`h-12 rounded-lg transition-all hover:scale-105 ${
                currentCover === g.value ? "ring-2 ring-white ring-offset-1 ring-offset-[#111]" : ""
              }`}
              style={{ background: g.value }}
              title={g.label}
            />
          ))}
        </div>
      )}

      {tab === "url" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
              <input
                autoFocus
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleUrl(); }}
                placeholder="https://example.com/image.jpg"
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-white/[0.05] border border-white/[0.08] text-[12px] text-white placeholder:text-white/25 outline-none focus:border-white/20 transition-colors"
              />
            </div>
            <button
              onClick={handleUrl}
              disabled={!urlInput.trim()}
              className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-medium disabled:opacity-40 transition-all"
            >
              Set
            </button>
          </div>
          <p className="text-[11px] text-white/25">Paste a direct image URL.</p>
        </div>
      )}

      {/* Remove cover */}
      {currentCover && (
        <button
          onClick={() => { onSelect(null); onClose(); }}
          className="mt-3 w-full flex items-center gap-2 justify-center py-1.5 rounded-lg text-[12px] text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all border border-white/[0.07]"
        >
          <X className="h-3.5 w-3.5" />
          Remove cover
        </button>
      )}
    </div>
  );
}

// ── Inline cover display ─────────────────────────────────────
interface PageCoverProps {
  cover: string | null;
  onChangeCover?: (cover: string | null) => void;
  editable?: boolean;
}

export function PageCover({ cover, onChangeCover, editable = false }: PageCoverProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!cover && !editable) return null;

  if (!cover && editable) {
    return (
      <button
        onClick={() => setPickerOpen(true)}
        className="group flex items-center gap-2 text-[12px] text-white/25 hover:text-white/50 transition-colors mb-2"
      >
        <Image className="h-3.5 w-3.5" />
        Add cover
        {pickerOpen && (
          <div className="relative">
            <CoverImagePicker
              currentCover={null}
              onSelect={(val) => onChangeCover?.(val)}
              onClose={() => setPickerOpen(false)}
            />
          </div>
        )}
      </button>
    );
  }

  const isGradient = cover?.includes("gradient");
  const isUrl = cover && !isGradient;

  return (
    <div className="relative h-[180px] -mx-8 -mt-8 mb-6 overflow-hidden group">
      {isGradient && (
        <div
          className="w-full h-full"
          style={{ background: cover! }}
        />
      )}
      {isUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover!}
          alt="Page cover"
          className="w-full h-full object-cover"
        />
      )}

      {editable && (
        <div className="absolute inset-0 flex items-end justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <button
              onClick={() => setPickerOpen((o) => !o)}
              className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-black/60 backdrop-blur-sm text-white/80 hover:text-white text-[12px] font-medium border border-white/10 transition-all"
            >
              <Image className="h-3 w-3" />
              Change cover
            </button>
            {pickerOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
                <div className="absolute z-50 bottom-full right-0 mb-2">
                  <CoverImagePicker
                    currentCover={cover}
                    onSelect={(val) => { onChangeCover?.(val); setPickerOpen(false); }}
                    onClose={() => setPickerOpen(false)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
