"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Layers,
  Mic,
  FileSearch,
  GitBranch,
  CheckSquare,
  CreditCard,
  LogOut,
  ChevronRight,
  Sparkles,
  Home,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";
import { PLAN_NAMES } from "@/lib/constants";
import Image from "next/image";
import { useState } from "react";

/* ── Navigation structure ─────────────────────────────────────── */
const navSections = [
  {
    label: null,
    items: [
      { href: "/home", label: "Home", icon: Home },
    ],
  },
  {
    label: "AI Tools",
    items: [
      {
        href: "/meeting",
        label: "Meeting Intelligence",
        icon: Mic,
        badge: "Live",
        badgeColor: "bg-blue-400/15 text-blue-400",
        matchPrefix: "/meeting",
      },
      {
        href: "/resume",
        label: "Resume Screener",
        icon: FileSearch,
        badge: "Live",
        badgeColor: "bg-violet-400/15 text-violet-400",
        matchPrefix: "/resume",
      },
      {
        href: "/workflows",
        label: "Workflow Generator",
        icon: GitBranch,
        badge: "Soon",
        badgeColor: "bg-white/10 text-white/40",
        disabled: true,
      },
      {
        href: "/tasks",
        label: "Smart Tasks",
        icon: CheckSquare,
        badge: "Soon",
        badgeColor: "bg-white/10 text-white/40",
        disabled: true,
      },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/billing", label: "Billing & Plan", icon: CreditCard },
    ],
  },
];

interface SidebarProps {
  profile: Profile;
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const isActive = (href: string, prefix?: string) => {
    if (prefix) return pathname === href || pathname.startsWith(prefix);
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col border-r border-white/[0.05] bg-[#0d0d0d]">
      {/* Logo */}
      <div className="flex h-[52px] items-center gap-2.5 px-4 border-b border-white/[0.05]">
        <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-white flex-shrink-0">
          <Layers className="h-3.5 w-3.5 text-black" strokeWidth={2.5} />
        </div>
        <span className="text-[14px] font-semibold text-white tracking-tight">Nexus</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0 px-2 py-3 overflow-y-auto">
        {navSections.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-4" : ""}>
            {section.label && (
              <p className="px-2 mb-1 text-[10px] font-semibold text-white/25 uppercase tracking-widest">
                {section.label}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, (item as any).matchPrefix);
                const disabled = (item as any).disabled;

                return (
                  <Link
                    key={item.href}
                    href={disabled ? "#" : item.href}
                    onClick={(e) => disabled && e.preventDefault()}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-[7px] px-2.5 py-2 text-[13px] font-medium transition-all duration-150 select-none",
                      active
                        ? "bg-white/[0.08] text-white"
                        : disabled
                        ? "text-white/20 cursor-default"
                        : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-[15px] w-[15px] flex-shrink-0 transition-colors",
                        active ? "text-white" : disabled ? "text-white/20" : "text-white/40 group-hover:text-white/60"
                      )}
                      strokeWidth={1.8}
                    />
                    <span className="flex-1 min-w-0 truncate">{item.label}</span>
                    {(item as any).badge && (
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", (item as any).badgeColor)}>
                        {(item as any).badge}
                      </span>
                    )}
                    {active && !disabled && (
                      <ChevronRight className="h-3 w-3 text-white/30 flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Upgrade banner for free users */}
        {profile.plan === "free" && (
          <div className="mx-0 mb-3">
            <Link
              href="/billing"
              className="flex items-start gap-2 rounded-[9px] border border-white/[0.07] bg-white/[0.03] px-3 py-3 hover:bg-white/[0.05] hover:border-white/15 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-white leading-tight">Upgrade to Pro</p>
                <p className="text-[11px] text-white/35 mt-0.5">Unlock all AI tools</p>
              </div>
            </Link>
          </div>
        )}
      </nav>

      {/* User info */}
      <div className="border-t border-white/[0.05] px-3 py-3">
        <div className="flex items-center gap-2.5">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.display_name ?? "User"}
              width={28}
              height={28}
              className="h-7 w-7 rounded-full flex-shrink-0 ring-1 ring-white/10"
            />
          ) : (
            <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold text-white">
                {(profile.display_name ?? "U")[0].toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-white/80 truncate leading-tight">
              {profile.display_name ?? "User"}
            </p>
            <p className="text-[10px] text-white/30 leading-tight">
              {PLAN_NAMES[profile.plan]} plan
            </p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
