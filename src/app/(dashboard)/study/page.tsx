import { Suspense } from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { StudyUploader } from "@/components/study/StudyUploader";
import { StudyPageCard } from "@/components/study/StudyPageCard";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Upload, BookMarked, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PLAN_LIMITS } from "@/lib/constants";
import type { Plan, StudyPage } from "@/types";

export const metadata: Metadata = { title: "Document Analysis" };

async function RecentStudyPages({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: studyPages } = await supabase
    .from("study_pages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(4);

  if (!studyPages?.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[13px] font-semibold text-white/50 uppercase tracking-widest">
          Recent Pages
        </h2>
        {/* We can link to a dedicated list page later if needed, but keeping it structurally similar to meetings */}
        <Link
          href="/study" /* keeping href pointing here for now, or could just remove */
          className="flex items-center gap-1 text-[12px] text-white/30 hover:text-white/60 transition-colors group"
        >
          View all <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(studyPages as StudyPage[]).map((page) => (
          <StudyPageCard key={page.id} studyPage={page} />
        ))}
      </div>
    </div>
  );
}

export default async function StudyDashboardPage() {
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

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-[8px] bg-violet-400/10 flex items-center justify-center">
              <BookOpen className="h-3.5 w-3.5 text-violet-400" strokeWidth={1.8} />
            </div>
            <span className="text-[11px] font-bold text-violet-400 uppercase tracking-widest">Document Analysis</span>
          </div>
          <h1 className="text-[26px] font-bold text-white tracking-tight">
            Analyze your documents with AI
          </h1>
          <p className="text-[14px] text-white/40 mt-1">
            Upload page images. Get AI summaries, action items, and concepts extracted instantly.
          </p>
        </div>
        <Link
          href="/study" /* This link matches the meeting dashboard All Transcripts button structure */
          className="hidden md:flex items-center gap-2 rounded-[9px] border border-white/[0.07] bg-white/[0.02] px-4 py-2 text-[13px] text-white/50 hover:text-white/80 hover:border-white/15 transition-all"
        >
          <BookMarked className="h-3.5 w-3.5" />
          All Documents
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
            New Document
          </h2>
        </div>
        <StudyUploader
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

      {/* ── Recent pages ── */}
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
        <RecentStudyPages userId={user.id} />
      </Suspense>
    </div>
  );
}
