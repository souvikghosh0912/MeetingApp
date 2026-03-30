"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, Command } from "lucide-react";
import { Profile } from "@/types";
import { useState, useEffect } from "react";
import { GlobalSearch } from "./GlobalSearch";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/home": { title: "Home", subtitle: "Your Nexus workspace" },
  "/meeting": { title: "Meeting Intelligence", subtitle: "Transcribe, summarize, and analyze your meetings" },
  "/resume": { title: "Resume Screener", subtitle: "Screen candidates with AI" },
  "/workflows": { title: "Workflow Generator", subtitle: "Build automations in plain English" },
  "/tasks": { title: "Smart Tasks", subtitle: "AI-powered task management" },
  "/billing": { title: "Billing & Plan", subtitle: "Manage your subscription and usage" },
  "/transcripts": { title: "Meeting Intelligence", subtitle: "All your meeting transcripts" },
  "/dashboard": { title: "Meeting Intelligence", subtitle: "Upload and process your meetings" },
};

function getPageMeta(pathname: string) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  for (const [prefix, meta] of Object.entries(pageTitles)) {
    if (pathname.startsWith(prefix + "/")) return meta;
  }
  return { title: "Nexus", subtitle: "" };
}

interface TopbarProps {
  profile: Profile;
}

export function Topbar({ profile }: TopbarProps) {
  const pathname = usePathname();
  const meta = getPageMeta(pathname);
  const [searchOpen, setSearchOpen] = useState(false);

  // ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      <header className="sticky top-0 z-30 flex h-[52px] items-center justify-between px-8 border-b border-white/[0.05] bg-background/80 backdrop-blur-md">
        {/* Page title */}
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-[14px] font-semibold text-white truncate">{meta.title}</h1>
          {meta.subtitle && (
            <>
              <span className="text-white/15 text-[13px]">/</span>
              <span className="text-[13px] text-white/35 truncate hidden sm:block">{meta.subtitle}</span>
            </>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Search button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 h-8 rounded-md border border-white/[0.07] bg-white/[0.02] pl-2.5 pr-2 text-white/30 hover:text-white/60 hover:border-white/15 transition-all"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="text-[12px]">Search...</span>
            <div className="flex items-center gap-0.5 ml-2 text-[10px] border border-white/10 rounded px-1 py-0.5">
              <Command className="h-2.5 w-2.5" />K
            </div>
          </button>

          {/* Mobile search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex sm:hidden h-8 w-8 items-center justify-center rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all"
          >
            <Search className="h-4 w-4" />
          </button>

          <button className="flex h-8 w-8 items-center justify-center rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all">
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </header>
    </>
  );
}
