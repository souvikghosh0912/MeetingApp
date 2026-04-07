"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Trash2, Copy, Star, MessageSquare,
  ChevronRight, Plus, MoreHorizontal, Image as ImageIcon
} from "lucide-react";
import { PageCover, CoverImagePicker } from "./CoverImagePicker";
import { PageComments } from "./PageComments";
import { MentionPicker } from "./MentionPicker";

// Dynamically import BlockNote so webpack never includes these ESM-only
// packages in the SSR bundle. The CJS builds of @blocknote/* try to
// require('@handlewithcare/prosemirror-inputrules') which has no CJS export.
import dynamic from "next/dynamic";

const BlockNoteEditorClient = dynamic(
  () => import("./BlockNoteEditorClient"),
  { ssr: false, loading: () => <div className="p-8 text-center text-white/50">Loading editor…</div> }
);

interface Page {
  id: string;
  title: string;
  icon: string;
  cover: string | null;
  content: object[];
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

interface BreadcrumbItem {
  id: string;
  title: string;
  icon: string;
}

interface PageEditorProps {
  initialPage: Page;
  breadcrumbs?: BreadcrumbItem[];
}

const ICON_OPTIONS = [
  "📄","📝","📒","📔","📕","📗","📘","📙","🗒️","📋",
  "🗃️","💡","🎯","🚀","⭐","🔥","💎","🌟","🧠","📊",
  "🏠","🌍","🎨","🎵","💻","🔬","📐","✅","📌","🔖",
];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function PageEditor({ initialPage, breadcrumbs = [] }: PageEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialPage.title);
  const [icon, setIcon] = useState(initialPage.icon);
  const [cover, setCover] = useState<string | null>(initialPage.cover ?? null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [mentionPickerOpen, setMentionPickerOpen] = useState(false);
  const [mentionAnchor, setMentionAnchor] = useState<DOMRect | null>(null);
  const lastSavedContent = useRef<string>(JSON.stringify(initialPage.content));
  const lastSavedTitle = useRef(initialPage.title);
  const lastSavedIcon = useRef(initialPage.icon);
  const lastSavedCover = useRef<string | null>(initialPage.cover ?? null);
  // Tracks the latest editor content so title/icon/cover saves don't wipe it.
  const lastContent = useRef<object[]>((initialPage.content as object[]) ?? []);

  // editor is now managed inside BlockNoteEditorClient — removed from here

  const debouncedTitle = useDebounce(title, 600);
  const debouncedIcon = useDebounce(icon, 600);
  const debouncedCover = useDebounce(cover, 800);

  // Track recent visit
  useEffect(() => {
    fetch("/api/recently-visited", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_type: "page",
        item_id: initialPage.id,
        title: initialPage.title || "Untitled",
        icon: initialPage.icon,
      }),
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPage.id]);

  // Check if favorited
  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((d) => {
        const favs = d.favorites ?? [];
        setIsFavorite(favs.some((f: { item_id: string }) => f.item_id === initialPage.id));
      })
      .catch(() => {});
  }, [initialPage.id]);

  const saveContent = useCallback(
    async (contentJson: object[], t: string, ic: string, cv: string | null) => {
      const contentStr = JSON.stringify(contentJson);
      if (
        contentStr === lastSavedContent.current &&
        t === lastSavedTitle.current &&
        ic === lastSavedIcon.current &&
        cv === lastSavedCover.current
      ) return;

      setSaving(true);
      lastSavedContent.current = contentStr;
      lastSavedTitle.current = t;
      lastSavedIcon.current = ic;
      lastSavedCover.current = cv;

      await fetch(`/api/pages/${initialPage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, icon: ic, content: contentJson, cover: cv }),
      });
      setSaving(false);
    },
    [initialPage.id]
  );

  // Save when debounced title/icon/cover change (content saves are handled
  // inside BlockNoteEditorClient via the onContentChange callback).
  useEffect(() => {
    saveContent(lastContent.current, debouncedTitle, debouncedIcon, debouncedCover);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle, debouncedIcon, debouncedCover]);

  const handleEditorChange = useCallback((content: object[]) => {
    lastContent.current = content;
    saveContent(content, lastSavedTitle.current, lastSavedIcon.current, lastSavedCover.current);
  }, [saveContent]);

  const handleDelete = async () => {
    if (!confirm("Delete this page? This cannot be undone.")) return;
    setDeleting(true);
    setShowMenu(false);
    await fetch(`/api/pages/${initialPage.id}`, { method: "DELETE" });
    router.push("/pages");
    router.refresh();
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    setShowMenu(false);
    const res = await fetch(`/api/pages/${initialPage.id}/duplicate`, { method: "POST" });
    const data = await res.json();
    setDuplicating(false);
    if (data.page) router.push(`/pages/${data.page.id}`);
  };

  const handleAddSubPage = async () => {
    setShowMenu(false);
    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled", icon: "📄", parent_id: initialPage.id }),
    });
    const data = await res.json();
    if (data.page) router.push(`/pages/${data.page.id}`);
  };

  const toggleFavorite = async () => {
    if (isFavorite) {
      setIsFavorite(false);
      await fetch(`/api/favorites/${initialPage.id}`, { method: "DELETE" });
    } else {
      setIsFavorite(true);
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_type: "page",
          item_id: initialPage.id,
          title: title || "Untitled",
          icon,
        }),
      });
    }
  };

  return (
    <div className="flex min-h-full">
      {/* ── Main editor ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-full">

        {/* ── Topbar ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4 sticky top-0 z-20 bg-[#0a0a0a]/90 backdrop-blur-sm py-2">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
            <button
              onClick={() => router.push("/pages")}
              className="text-[12px] text-white/30 hover:text-white/70 transition-colors flex-shrink-0"
            >
              Pages
            </button>
            {breadcrumbs.map((b) => (
              <span key={b.id} className="flex items-center gap-1 flex-shrink-0 min-w-0">
                <ChevronRight className="h-3 w-3 text-white/15 flex-shrink-0" />
                <button
                  onClick={() => router.push(`/pages/${b.id}`)}
                  className="text-[12px] text-white/30 hover:text-white/70 transition-colors truncate max-w-[120px]"
                >
                  {b.icon} {b.title || "Untitled"}
                </button>
              </span>
            ))}
            <ChevronRight className="h-3 w-3 text-white/15 flex-shrink-0" />
            <span className="text-[12px] text-white/60 truncate max-w-[180px] flex-shrink-0">
              {icon} {title || "Untitled"}
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-4">
            {saving && (
              <span className="flex items-center gap-1.5 text-[11px] text-white/25 mr-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving…
              </span>
            )}
            {!saving && (
              <span className="text-[11px] text-white/15 mr-2">Auto-saved</span>
            )}

            <button
              onClick={toggleFavorite}
              title={isFavorite ? "Remove from favourites" : "Add to favourites"}
              className={`h-7 w-7 rounded-md flex items-center justify-center transition-all ${
                isFavorite
                  ? "text-amber-400 hover:bg-amber-400/10"
                  : "text-white/20 hover:text-amber-400 hover:bg-white/[0.04]"
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${isFavorite ? "fill-amber-400" : ""}`} />
            </button>

            <button
              onClick={() => setShowComments((s) => !s)}
              title="Toggle comments"
              className={`h-7 w-7 rounded-md flex items-center justify-center transition-all ${
                showComments
                  ? "text-indigo-400 bg-indigo-400/10"
                  : "text-white/20 hover:text-white/60 hover:bg-white/[0.04]"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMenu((o) => !o)}
                className="h-7 w-7 rounded-md flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/[0.04] transition-all"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                  <div className="absolute top-8 right-0 z-40 min-w-[180px] rounded-xl border border-white/[0.08] bg-[#111] shadow-2xl py-1">
                    <button
                      onClick={handleAddSubPage}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-white/70 hover:bg-white/[0.05] hover:text-white transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add sub-page
                    </button>
                    <button
                      onClick={handleDuplicate}
                      disabled={duplicating}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-white/70 hover:bg-white/[0.05] hover:text-white transition-colors disabled:opacity-50"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {duplicating ? "Duplicating…" : "Duplicate page"}
                    </button>
                    <div className="my-1 border-t border-white/[0.06]" />
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-400 hover:bg-white/[0.05] transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deleting ? "Deleting…" : "Delete page"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Page content ───────────────────────────────────── */}
        <div className="max-w-[720px] w-full mx-auto flex-1">

          {/* Cover */}
          <PageCover cover={cover} onChangeCover={setCover} editable />

          {/* Add cover button (when no cover) */}
          {!cover && (
            <div className="relative mb-2">
              <button
                onClick={() => setShowCoverPicker((o) => !o)}
                className="flex items-center gap-1.5 text-[12px] text-white/20 hover:text-white/50 transition-colors"
              >
                <ImageIcon className="h-3 w-3" />
                Add cover
              </button>
              {showCoverPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowCoverPicker(false)} />
                  <div className="absolute top-6 left-0 z-50">
                    <CoverImagePicker
                      currentCover={null}
                      onSelect={(val) => { setCover(val); setShowCoverPicker(false); }}
                      onClose={() => setShowCoverPicker(false)}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Icon picker */}
          <div className="relative mb-3">
            <button
              onClick={() => setShowIconPicker((o) => !o)}
              className="text-5xl hover:scale-110 transition-transform duration-150 leading-none"
            >
              {icon}
            </button>
            {showIconPicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowIconPicker(false)} />
                <div className="absolute top-14 left-0 z-20 bg-[#1a1a1a] border border-white/[0.08] rounded-xl p-3 shadow-2xl grid grid-cols-10 gap-1 w-[320px]">
                  {ICON_OPTIONS.map((em) => (
                    <button
                      key={em}
                      onClick={() => { setIcon(em); setShowIconPicker(false); }}
                      className="text-xl p-1 rounded-md hover:bg-white/[0.08] transition-colors"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            className="w-full text-[36px] font-bold text-white bg-transparent outline-none placeholder:text-white/15 mb-6 leading-tight"
          />

          {/* Mention button */}
          <div className="mb-4">
            <button
              onClick={(e) => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setMentionAnchor(rect);
                setMentionPickerOpen(true);
              }}
              className="flex items-center gap-1.5 text-[11px] text-white/20 hover:text-white/50 transition-colors"
            >
              <span className="font-mono bg-white/[0.05] border border-white/[0.08] rounded px-1.5 py-0.5 text-[10px]">@</span>
              Link to another page
            </button>
          </div>

          {/* BlockNote Editor — loaded client-side only to avoid SSR CJS issues */}
          <div className="page-editor-wrapper">
            <BlockNoteEditorClient
              initialContent={initialPage.content}
              onContentChange={handleEditorChange}
            />
          </div>
        </div>
      </div>

      {/* ── Comments panel ───────────────────────────────────── */}
      {showComments && (
        <div className="w-[300px] flex-shrink-0 border-l border-white/[0.07] ml-8 -mr-8 min-h-full flex flex-col">
          <PageComments pageId={initialPage.id} onClose={() => setShowComments(false)} />
        </div>
      )}

      {/* Mention picker — editor.insertBlocks moved into BlockNoteEditorClient */}
      {mentionPickerOpen && (
        <MentionPicker
          anchorRect={mentionAnchor}
          onSelect={() => setMentionPickerOpen(false)}
          onClose={() => setMentionPickerOpen(false)}
        />
      )}
    </div>
  );
}
