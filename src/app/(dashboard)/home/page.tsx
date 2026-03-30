import { Suspense } from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Plan, Transcript } from "@/types";
import { PLAN_LIMITS, PLAN_NAMES } from "@/lib/constants";
import { TranscriptCard } from "@/components/transcripts/TranscriptCard";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ToolGrid } from "@/components/dashboard/ToolGrid";
import { Mic, TrendingUp, Clock, Zap, ChevronRight } from "lucide-react";

export const metadata: Metadata = { title: "Home" };

async function RecentActivity({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: transcripts } = await supabase
    .from("transcripts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(3);

  if (!transcripts?.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-white/30" />
          <h2 className="text-[13px] font-semibold text-white/60 uppercase tracking-widest">
            Recent Activity
          </h2>
        </div>
        <Link
          href="/transcripts"
          className="flex items-center gap-1 text-[12px] text-white/30 hover:text-white/60 transition-colors"
        >
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(transcripts as Transcript[]).map((t) => (
          <TranscriptCard key={t.id} transcript={t} />
        ))}
      </div>
    </div>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const plan = (profile?.plan ?? "free") as Plan;
  const limits = PLAN_LIMITS[plan];
  const firstName = profile?.display_name?.split(" ")[0] ?? "there";

  const today = new Date().toISOString().split("T")[0];
  const { data: usage } = await supabase
    .from("usage_tracking")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  const totalUsageToday =
    (usage?.summaries_8b_count ?? 0) +
    (usage?.summaries_20b_count ?? 0) +
    (usage?.summaries_120b_count ?? 0);

  const { count: transcriptCount } = await supabase
    .from("transcripts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const h = new Date().getHours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";

  const stats = [
    { label: "Meetings processed", value: String(transcriptCount ?? 0), icon: Mic, color: "text-blue-400" },
    { label: "AI calls today", value: String(totalUsageToday), icon: TrendingUp, color: "text-emerald-400" },
    {
      label: "Transcripts saved",
      value: `${transcriptCount ?? 0} / ${limits.maxSavedTranscripts === "unlimited" ? "∞" : limits.maxSavedTranscripts}`,
      icon: Clock,
      color: "text-violet-400",
    },
    { label: "Current plan", value: PLAN_NAMES[plan], icon: Zap, color: "text-amber-400" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10">

      {/* ── Welcome header ── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold text-white/25 uppercase tracking-widest mb-2">
            {PLAN_NAMES[plan]} Plan
          </p>
          <h1 className="text-[28px] font-bold text-white tracking-tight">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-[14px] text-white/40 mt-1">
            Your AI workspace is ready. What do you want to automate today?
          </p>
        </div>
        {plan === "free" && (
          <Link
            href="/billing"
            className="hidden md:flex items-center gap-2 rounded-[9px] bg-white/[0.05] border border-white/10 px-4 py-2 text-[13px] font-medium text-white/60 hover:bg-white/[0.08] hover:text-white transition-all"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            Upgrade to Pro
          </Link>
        )}
      </div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-[12px] border border-white/[0.06] bg-white/[0.02] px-4 py-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-3.5 w-3.5 ${stat.color}`} strokeWidth={1.8} />
                <p className="text-[11px] text-white/30">{stat.label}</p>
              </div>
              <p className="text-[22px] font-bold text-white tracking-tight">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Tool launcher ── */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <h2 className="text-[13px] font-semibold text-white/60 uppercase tracking-widest">
            Your Tools
          </h2>
        </div>
        <ToolGrid />
      </div>

      {/* ── Recent activity ── */}
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-4 w-36" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-36 rounded-xl" />
              <Skeleton className="h-36 rounded-xl" />
              <Skeleton className="h-36 rounded-xl" />
            </div>
          </div>
        }
      >
        <RecentActivity userId={user.id} />
      </Suspense>
    </div>
  );
}
