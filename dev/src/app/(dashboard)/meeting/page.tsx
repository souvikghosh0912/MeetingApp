import { Suspense } from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { UploadDropzone } from "@/components/dashboard/UploadDropzone";
import { TranscriptCard } from "@/components/transcripts/TranscriptCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Mic, Upload, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PLAN_LIMITS } from "@/lib/constants";
import { Plan, Transcript } from "@/types";

export const metadata: Metadata = { title: "Meeting Intelligence" };

async function RecentMeetings({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: transcripts } = await supabase
    .from("transcripts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(4);

  if (!transcripts?.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[13px] font-semibold text-white/50 uppercase tracking-widest">
          Recent Meetings
        </h2>
        <Link
          href="/transcripts"
          className="flex items-center gap-1 text-[12px] text-white/30 hover:text-white/60 transition-colors group"
        >
          View all <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(transcripts as Transcript[]).map((t) => (
          <TranscriptCard key={t.id} transcript={t} />
        ))}
      </div>
    </div>
  );
}

export default async function MeetingDashboardPage() {
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

  const today = new Date().toISOString().split("T")[0];
  const { data: usage } = await supabase
    .from("usage_tracking")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  const used8b = usage?.summaries_8b_count ?? 0;
  const used20b = usage?.summaries_20b_count ?? 0;
  const used120b = usage?.summaries_120b_count ?? 0;

  const { count: totalMeetings } = await supabase
    .from("transcripts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (
    <div className="max-w-5xl mx-auto space-y-10">

      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-[8px] bg-blue-400/10 flex items-center justify-center">
              <Mic className="h-3.5 w-3.5 text-blue-400" strokeWidth={1.8} />
            </div>
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">Meeting Intelligence</span>
          </div>
          <h1 className="text-[26px] font-bold text-white tracking-tight">
            Process your meetings
          </h1>
          <p className="text-[14px] text-white/40 mt-1">
            Upload audio or video. Get AI summaries, action items & insights in seconds.
          </p>
        </div>
        <Link
          href="/transcripts"
          className="hidden md:flex items-center gap-2 rounded-[9px] border border-white/[0.07] bg-white/[0.02] px-4 py-2 text-[13px] text-white/50 hover:text-white/80 hover:border-white/15 transition-all"
        >
          <FileText className="h-3.5 w-3.5" />
          All Transcripts
        </Link>
      </div>

      {/* ── Usage stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "LLaMA 8B",
            used: used8b,
            limit: limits.summaries8bPerDay,
            color: "bg-blue-400",
          },
          {
            label: "GPT-OSS 20B",
            used: used20b,
            limit: limits.summaries20bPerDay,
            color: "bg-violet-400",
          },
          {
            label: "GPT-OSS 120B",
            used: used120b,
            limit: limits.summaries120bPerDay,
            color: "bg-emerald-400",
          },
        ].map((stat) => {
          const isUnlimited = stat.limit === "unlimited";
          const pct = isUnlimited
            ? 0
            : Math.min(100, (stat.used / (stat.limit as number)) * 100);
          return (
            <div
              key={stat.label}
              className="rounded-[12px] border border-white/[0.06] bg-white/[0.02] px-4 py-4"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-white/30">{stat.label}</p>
                <span className="text-[11px] text-white/40">
                  {stat.used} / {isUnlimited ? "∞" : stat.limit}
                </span>
              </div>
              <p className="text-[20px] font-bold text-white mb-2">{stat.used}</p>
              {!isUnlimited && (
                <div className="h-1 w-full rounded-full bg-white/[0.07] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${stat.color} ${pct >= 90 ? "opacity-100" : "opacity-70"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Upload area ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Upload className="h-3.5 w-3.5 text-white/30" />
          <h2 className="text-[13px] font-semibold text-white/50 uppercase tracking-widest">
            New Meeting
          </h2>
        </div>
        <UploadDropzone
          userId={user.id}
          plan={plan}
          defaultModel={
            plan === "free"
              ? "llama-8b"
              : plan === "pro"
              ? "gpt-oss-20b"
              : "gpt-oss-120b"
          }
        />
      </div>

      {/* ── Recent meetings ── */}
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-4 w-40" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-36 rounded-xl" />
              <Skeleton className="h-36 rounded-xl" />
            </div>
          </div>
        }
      >
        <RecentMeetings userId={user.id} />
      </Suspense>
    </div>
  );
}
