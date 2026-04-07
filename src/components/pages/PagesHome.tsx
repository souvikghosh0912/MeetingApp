"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, FileText, Trash2, MoreHorizontal, Copy,
  ChevronDown, ChevronRight, Star,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PageMeta {
  id: string;
  title: string;
  icon: string;
  cover: string | null;
  parent_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  children?: PageMeta[];
}

interface PagesHomeProps {
  initialPages: PageMeta[];
}

function buildTree(pages: PageMeta[]): PageMeta[] {
  const map = new Map<string, PageMeta>();
  pages.forEach((p) => map.set(p.id, { ...p, children: [] }));
  const roots: PageMeta[] = [];
  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function PageCard({
  page,
  depth = 0,
  onDelete,
  onDuplicate,
  onCreate,
}: {
  page: PageMeta;
  depth?: number;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onCreate: (parentId?: string) => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const hasChildren = (page.children?.length ?? 0) > 0;

  const isGradient = page.cover?.includes("gradient");

  return (
    <div>
      <div
        className="group relative rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all cursor-pointer overflow-hidden"
        onClick={() => router.push(`/pages/${page.id}`)}
      >
        {/* Cover thumbnail */}
        {page.cover && (
          <div className="h-16 w-full overflow-hidden">
            {isGradient ? (
              <div className="w-full h-full" style={{ background: page.cover }} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={page.cover} alt="" className="w-full h-full object-cover" />
            )}
          </div>
        )}

        <div className="p-4">
          {/* Icon */}
          <div className="text-2xl mb-2 leading-none">{page.icon}</div>

          {/* Title */}
          <p className="text-[14px] font-semibold text-white/80 group-hover:text-white transition-colors truncate">
            {page.title || "Untitled"}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-2 mt-2">
            <p className="text-[11px] text-white/25">
              {format(new Date(page.updated_at), "MMM d, yyyy")}
            </p>
            {hasChildren && (
              <span className="text-[10px] text-white/20 bg-white/[0.05] rounded px-1.5 py-0.5">
                {page.children!.length} sub-page{page.children!.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Menu */}
        <div
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="h-6 w-6 rounded-md flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute top-7 right-0 z-20 min-w-[160px] rounded-lg border border-white/[0.08] bg-[#1a1a1a] shadow-xl py-1">
                <button
                  onClick={() => { setMenuOpen(false); onCreate(page.id); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-white/70 hover:bg-white/[0.05] hover:text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add sub-page
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDuplicate(page.id); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-white/70 hover:bg-white/[0.05] hover:text-white"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Duplicate
                </button>
                <div className="my-1 border-t border-white/[0.06]" />
                <button
                  onClick={() => { setMenuOpen(false); onDelete(page.id); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-400 hover:bg-white/[0.05]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sub-pages toggle */}
      {hasChildren && (
        <div className="mt-1 ml-4">
          <button
            onClick={() => setExpanded((o) => !o)}
            className="flex items-center gap-1 text-[11px] text-white/25 hover:text-white/50 transition-colors mb-1"
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {expanded ? "Hide" : "Show"} {page.children!.length} sub-page{page.children!.length > 1 ? "s" : ""}
          </button>
          {expanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2 border-l border-white/[0.06]">
              {page.children!.map((child) => (
                <PageCard
                  key={child.id}
                  page={child}
                  depth={depth + 1}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  onCreate={onCreate}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PagesHome({ initialPages }: PagesHomeProps) {
  const router = useRouter();
  const [pages, setPages] = useState<PageMeta[]>(initialPages);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadPages = useCallback(async () => {
    const res = await fetch("/api/pages");
    const data = await res.json();
    setPages(data.pages ?? []);
  }, []);

  const createPage = useCallback(async (parentId?: string) => {
    if (creating) return;
    setCreating(true);
    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled", icon: "📄", parent_id: parentId ?? null }),
    });
    const { page } = await res.json();
    setCreating(false);
    if (page) router.push(`/pages/${page.id}`);
  }, [creating, router]);

  const deletePage = useCallback(async (id: string) => {
    if (!confirm("Delete this page and all its sub-pages? This cannot be undone.")) return;
    setDeleting(id);
    setPages((prev) => prev.filter((p) => p.id !== id && p.parent_id !== id));
    await fetch(`/api/pages/${id}`, { method: "DELETE" });
    await loadPages();
    setDeleting(null);
  }, [loadPages]);

  const duplicatePage = useCallback(async (id: string) => {
    const res = await fetch(`/api/pages/${id}/duplicate`, { method: "POST" });
    const data = await res.json();
    await loadPages();
    if (data.page) router.push(`/pages/${data.page.id}`);
  }, [loadPages, router]);

  const tree = buildTree(pages);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-bold text-white tracking-tight">Pages</h1>
          <p className="text-[13px] text-white/35 mt-0.5">
            Your notes, docs, and ideas — all in one place.
          </p>
        </div>
        <button
          onClick={() => createPage()}
          disabled={creating}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-medium transition-all disabled:opacity-60 shadow-lg shadow-indigo-500/20"
        >
          <Plus className="h-4 w-4" />
          {creating ? "Creating…" : "New page"}
        </button>
      </div>

      {/* Empty state */}
      {tree.length === 0 && (
        <div className="flex flex-col items-center justify-center py-28 gap-4">
          <div className="h-16 w-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
            <FileText className="h-7 w-7 text-white/20" />
          </div>
          <p className="text-[14px] text-white/40 font-medium">No pages yet</p>
          <p className="text-[12px] text-white/25">Create your first page to start writing</p>
          <button
            onClick={() => createPage()}
            disabled={creating}
            className="mt-2 flex items-center gap-2 h-9 px-5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white text-[13px] font-medium border border-white/[0.08] transition-all"
          >
            <Plus className="h-4 w-4" />
            Create page
          </button>
        </div>
      )}

      {/* Page grid */}
      {tree.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* New page card */}
            <button
              onClick={() => createPage()}
              disabled={creating}
              className="h-[140px] rounded-xl border border-dashed border-white/[0.1] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.2] flex flex-col items-center justify-center gap-2 transition-all group"
            >
              <div className="h-8 w-8 rounded-lg bg-white/[0.04] group-hover:bg-white/[0.08] flex items-center justify-center transition-all">
                <Plus className="h-4 w-4 text-white/30 group-hover:text-white/70" />
              </div>
              <span className="text-[12px] text-white/25 group-hover:text-white/50 transition-colors font-medium">
                {creating ? "Creating…" : "New page"}
              </span>
            </button>

            {tree.map((page) => (
              <PageCard
                key={page.id}
                page={page}
                onDelete={deletePage}
                onDuplicate={duplicatePage}
                onCreate={createPage}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
