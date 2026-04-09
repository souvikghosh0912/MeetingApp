"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Layers, Mic, FileSearch, GitBranch, CheckSquare, CreditCard,
  LogOut, ChevronRight, Home, Clock, Database, FileText,
  Star, History, Plus, ChevronDown, MoreHorizontal, Trash2, Copy, Zap, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";
import { PLAN_NAMES } from "@/lib/constants";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";

interface UserFavorite { id: string; item_type: string; item_id: string; title: string; icon: string; }
interface RecentItem { id: string; item_type: string; item_id: string; title: string; icon: string; visited_at: string; }
interface PageNode { id: string; title: string; icon: string; parent_id: string | null; children?: PageNode[]; }

function itemHref(type: string, id: string) {
  if (type === "page") return `/pages/${id}`;
  if (type === "database") return `/databases/${id}`;
  return `/transcripts/${id}`;
}

// ── Recursive page tree node ────────────────────────────────────
function PageTreeNode({
  page,
  depth = 0,
  onDelete,
  onDuplicate,
}: {
  page: PageNode;
  depth?: number;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = pathname === `/pages/${page.id}`;
  const hasChildren = (page.children?.length ?? 0) > 0;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md transition-all relative",
          isActive ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
        )}
        style={{ paddingLeft: `${8 + depth * 12}px`, paddingRight: "4px" }}
      >
        {/* Expand toggle */}
        <button
          onClick={(e) => { e.preventDefault(); setExpanded((o) => !o); }}
          className={cn(
            "h-4 w-4 flex items-center justify-center flex-shrink-0 transition-all",
            hasChildren ? "text-white/30 hover:text-white/70" : "text-transparent pointer-events-none"
          )}
        >
          <ChevronDown className={cn("h-3 w-3 transition-transform", expanded ? "" : "-rotate-90")} />
        </button>

        {/* Page link */}
        <Link
          href={`/pages/${page.id}`}
          className="flex items-center gap-1.5 flex-1 py-1 min-w-0"
        >
          <span className="text-sm leading-none flex-shrink-0">{page.icon}</span>
          <span className={cn("text-[12px] truncate transition-colors", isActive ? "text-white font-medium" : "text-white/50 group-hover:text-white/80")}>
            {page.title || "Untitled"}
          </span>
        </Link>

        {/* Actions — only on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={async (e) => {
              e.preventDefault();
              const res = await fetch("/api/pages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: "Untitled", icon: "📄", parent_id: page.id }),
              });
              const data = await res.json();
              if (data.page) {
                setExpanded(true);
                router.push(`/pages/${data.page.id}`);
                router.refresh();
              }
            }}
            className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.08] transition-all"
            title="Add sub-page"
          >
            <Plus className="h-2.5 w-2.5" />
          </button>

          <div className="relative">
            <button
              onClick={(e) => { e.preventDefault(); setMenuOpen((o) => !o); }}
              className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <MoreHorizontal className="h-2.5 w-2.5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute left-0 top-6 z-50 min-w-[140px] rounded-lg border border-white/[0.08] bg-[#111] shadow-xl py-1">
                  <button
                    onClick={() => { setMenuOpen(false); onDuplicate(page.id); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-white/70 hover:bg-white/[0.05] hover:text-white"
                  >
                    <Copy className="h-3 w-3" /> Duplicate
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(page.id); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-red-400 hover:bg-white/[0.05]"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {page.children!.map((child) => (
            <PageTreeNode
              key={child.id}
              page={child}
              depth={depth + 1}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Build tree from flat list ───────────────────────────────────
function buildTree(pages: PageNode[]): PageNode[] {
  const map = new Map<string, PageNode>();
  pages.forEach((p) => map.set(p.id, { ...p, children: [] }));
  const roots: PageNode[] = [];
  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

interface SidebarProps {
  profile: Profile;
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  // Data
  const [pages, setPages] = useState<PageNode[]>([]);
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [recents, setRecents] = useState<RecentItem[]>([]);

  // Section collapse state
  const [favOpen, setFavOpen] = useState(true);
  const [recentOpen, setRecentOpen] = useState(true);
  const [pagesOpen, setPagesOpen] = useState(true);

  const loadData = useCallback(async () => {
    const [pRes, fRes, rRes] = await Promise.all([
      fetch("/api/pages"),
      fetch("/api/favorites"),
      fetch("/api/recently-visited"),
    ]);
    const [pData, fData, rData] = await Promise.all([pRes.json(), fRes.json(), rRes.json()]);
    setPages(pData.pages ?? []);
    setFavorites(fData.favorites ?? []);
    setRecents(rData.items ?? []);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleDeletePage = async (id: string) => {
    if (!confirm("Delete this page?")) return;
    await fetch(`/api/pages/${id}`, { method: "DELETE" });
    await loadData();
    if (pathname === `/pages/${id}`) router.push("/pages");
  };

  const handleDuplicatePage = async (id: string) => {
    const res = await fetch(`/api/pages/${id}/duplicate`, { method: "POST" });
    const data = await res.json();
    await loadData();
    if (data.page) router.push(`/pages/${data.page.id}`);
  };

  const pageTree = buildTree(pages);
  const plan = profile.plan;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  function NavItem({
    href,
    icon: Icon,
    label,
    badge,
    badgeColor,
    disabled,
  }: {
    href: string;
    icon: React.ElementType;
    label: string;
    badge?: string;
    badgeColor?: string;
    disabled?: boolean;
  }) {
    const active = isActive(href);
    return (
      <Link
        href={disabled ? "#" : href}
        onClick={(e) => disabled && e.preventDefault()}
        className={cn(
          "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all",
          active
            ? "bg-white/[0.08] text-white"
            : disabled
            ? "text-white/20 cursor-default"
            : "text-white/45 hover:text-white/80 hover:bg-white/[0.04]"
        )}
      >
        <Icon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.8} />
        <span className="flex-1 truncate">{label}</span>
        {badge && (
          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", badgeColor)}>
            {badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] flex flex-col border-r border-white/[0.05] bg-[#0d0d0d] overflow-hidden">
      {/* ── App logo ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/[0.05]">
        <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <Layers className="h-4 w-4 text-white" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-white truncate">Mnemis</p>
          <p className="text-[10px] text-white/30 truncate">{PLAN_NAMES[plan]} plan</p>
        </div>
      </div>

      {/* ── Scrollable nav ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">

        {/* Home */}
        <NavItem href="/home" icon={Home} label="Home" />

        {/* ── Favourites ── */}
        {favorites.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setFavOpen((o) => !o)}
              className="flex items-center gap-1 w-full px-3 py-1 text-[10px] font-semibold text-white/25 uppercase tracking-widest hover:text-white/50 transition-colors"
            >
              <Star className="h-2.5 w-2.5 mr-0.5 fill-amber-400/60 text-amber-400/60" />
              Favourites
              <ChevronDown className={cn("h-2.5 w-2.5 ml-auto transition-transform", favOpen ? "" : "-rotate-90")} />
            </button>
            {favOpen && (
              <div className="mt-0.5 space-y-0.5">
                {favorites.map((f) => {
                  const href = itemHref(f.item_type, f.item_id);
                  const active = isActive(href);
                  return (
                    <Link
                      key={f.id}
                      href={href}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] transition-all",
                        active
                          ? "bg-white/[0.08] text-white font-medium"
                          : "text-white/45 hover:text-white/80 hover:bg-white/[0.04]"
                      )}
                    >
                      <span className="text-sm leading-none flex-shrink-0">{f.icon}</span>
                      <span className="truncate">{f.title || "Untitled"}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Recents ── */}
        {recents.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setRecentOpen((o) => !o)}
              className="flex items-center gap-1 w-full px-3 py-1 text-[10px] font-semibold text-white/25 uppercase tracking-widest hover:text-white/50 transition-colors"
            >
              <History className="h-2.5 w-2.5 mr-0.5" />
              Recently visited
              <ChevronDown className={cn("h-2.5 w-2.5 ml-auto transition-transform", recentOpen ? "" : "-rotate-90")} />
            </button>
            {recentOpen && (
              <div className="mt-0.5 space-y-0.5">
                {recents.slice(0, 5).map((r) => {
                  const href = itemHref(r.item_type, r.item_id);
                  const active = isActive(href);
                  return (
                    <Link
                      key={r.id}
                      href={href}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] transition-all",
                        active
                          ? "bg-white/[0.08] text-white font-medium"
                          : "text-white/35 hover:text-white/70 hover:bg-white/[0.04]"
                      )}
                    >
                      <span className="text-sm leading-none flex-shrink-0">{r.icon}</span>
                      <span className="truncate">{r.title || "Untitled"}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Workspace ── */}
        <div className="pt-2">
          <p className="px-3 py-1 text-[10px] font-semibold text-white/25 uppercase tracking-widest">
            Workspace
          </p>
          <div className="mt-0.5 space-y-0.5">
            <NavItem
              href="/databases"
              icon={Database}
              label="Databases"
              badge="New"
              badgeColor="bg-emerald-400/15 text-emerald-400"
            />

            {/* Pages with expandable tree */}
            <div>
              <div className={cn(
                "flex items-center gap-0.5 rounded-lg transition-all",
                isActive("/pages") ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
              )}>
                <Link
                  href="/pages"
                  className="flex items-center gap-2.5 px-3 py-1.5 text-[12px] font-medium flex-1 min-w-0 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 flex-shrink-0 text-white/50" strokeWidth={1.8} />
                  <span className={cn("truncate flex-1", isActive("/pages") ? "text-white" : "text-white/45")}>
                    Pages
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-400 flex-shrink-0">
                    New
                  </span>
                </Link>
                <button
                  onClick={() => setPagesOpen((o) => !o)}
                  className="h-6 w-6 flex items-center justify-center text-white/20 hover:text-white/60 flex-shrink-0 mr-1 transition-colors"
                >
                  <ChevronDown className={cn("h-3 w-3 transition-transform", pagesOpen ? "" : "-rotate-90")} />
                </button>
              </div>

              {pagesOpen && pageTree.length > 0 && (
                <div className="mt-0.5">
                  {pageTree.map((page) => (
                    <PageTreeNode
                      key={page.id}
                      page={page}
                      depth={0}
                      onDelete={handleDeletePage}
                      onDuplicate={handleDuplicatePage}
                    />
                  ))}
                </div>
              )}

              {pagesOpen && (
                <button
                  onClick={async () => {
                    const res = await fetch("/api/pages", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ title: "Untitled", icon: "📄" }),
                    });
                    const data = await res.json();
                    await loadData();
                    if (data.page) router.push(`/pages/${data.page.id}`);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-[11px] text-white/25 hover:text-white/60 hover:bg-white/[0.04] rounded-lg transition-all mt-0.5"
                  style={{ paddingLeft: "20px" }}
                >
                  <Plus className="h-3 w-3" />
                  New page
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── AI Tools ── */}
        <div className="pt-2">
          <p className="px-3 py-1 text-[10px] font-semibold text-white/25 uppercase tracking-widest">
            AI Tools
          </p>
          <div className="mt-0.5 space-y-0.5">
            <NavItem href="/meeting" icon={Mic} label="Meeting Intelligence" badge="Live" badgeColor="bg-blue-400/15 text-blue-400" />
            <NavItem href="/study" icon={BookOpen} label="Document Analysis" badge="New" badgeColor="bg-violet-400/15 text-violet-400" />
            <NavItem href="/resume" icon={FileSearch} label="Resume Screener" badge="Live" badgeColor="bg-indigo-400/15 text-indigo-400" />
            <NavItem href="/automation" icon={Zap} label="AI Automation" badge="New" badgeColor="bg-emerald-400/15 text-emerald-400" />
            <NavItem href="/tasks" icon={CheckSquare} label="Smart Tasks" badge="Soon" badgeColor="bg-white/10 text-white/40" disabled />
          </div>
        </div>

        {/* ── Account ── */}
        <div className="pt-2">
          <p className="px-3 py-1 text-[10px] font-semibold text-white/25 uppercase tracking-widest">
            Account
          </p>
          <div className="mt-0.5 space-y-0.5">
            <NavItem href="/billing" icon={CreditCard} label="Billing & Plan" />
          </div>
        </div>
      </div>

      {/* ── User footer ───────────────────────────────────────── */}
      <div className="border-t border-white/[0.05] p-3">
        <div className="flex items-center gap-2.5">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.display_name ?? ""}
              width={28}
              height={28}
              className="rounded-full flex-shrink-0"
            />
          ) : (
            <div className="h-7 w-7 rounded-full bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold text-indigo-400">
                {(profile.display_name ?? "U").charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-white/80 truncate">
              {profile.display_name ?? "User"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sign out"
            className="h-7 w-7 rounded-md flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition-all disabled:opacity-40"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
