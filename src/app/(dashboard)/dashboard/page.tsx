import { Suspense } from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { UploadDropzone } from "@/components/dashboard/UploadDropzone";
import { TranscriptCard } from "@/components/transcripts/TranscriptCard";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Upload } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PLAN_LIMITS } from "@/lib/constants";
import { Plan, Transcript } from "@/types";

export const metadata: Metadata = { title: "Dashboard" };

async function RecentTranscripts({ userId }: { userId: string }) {
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
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Recent Transcripts
        </h2>
        <Link href="/transcripts">
          <Button variant="ghost" size="sm" className="text-xs">
            View all →
          </Button>
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

export default async function DashboardPage() {
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

  // Get today's usage
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
  const limit8b = limits.summaries8bPerDay;
  const limit20b = limits.summaries20bPerDay;
  const limit120b = limits.summaries120bPerDay;

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Good {getGreeting()},{" "}
          <span className="text-accent">
            {profile?.display_name?.split(" ")[0] ?? "there"}
          </span>
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Upload a meeting to get started.
        </p>
      </div>

      {/* Usage stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          {
            label: "8B AI Summaries",
            value: used8b,
            limit: limit8b,
          },
          {
            label: "GPT-OSS 20B (Chat)",
            value: used20b,
            limit: limit20b,
          },
          {
            label: "GPT-OSS 120B (Viz)",
            value: used120b,
            limit: limit120b,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/10 bg-white/3 px-4 py-3"
          >
            <p className="text-xs text-text-muted mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-white">
              {stat.value}
              <span className="text-sm font-normal text-text-muted ml-1">
                / {stat.limit === "unlimited" ? "∞" : stat.limit}
              </span>
            </p>
          </div>
        ))}
      </div>

      {/* Upload area */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Upload className="h-4 w-4 text-accent" />
          <h2 className="text-base font-semibold text-white">New Meeting</h2>
        </div>
        <UploadDropzone
          userId={user.id}
          plan={plan}
          defaultModel={plan === "free" ? "llama-8b" : plan === "pro" ? "gpt-oss-20b" : "gpt-oss-120b"}
        />
      </div>

      {/* Recent transcripts */}
      <Suspense
        fallback={
          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-36" />
              <Skeleton className="h-36" />
            </div>
          </div>
        }
      >
        <RecentTranscripts userId={user.id} />
      </Suspense>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
