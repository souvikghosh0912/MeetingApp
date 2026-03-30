import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SummaryPanel } from "@/components/visualization/SummaryPanel";
import { Transcript } from "@/types";
import { Layers, Calendar, Clock, FileAudio, FileVideo, Lock } from "lucide-react";
import { formatDate, formatDuration } from "@/lib/utils";
import Link from "next/link";

interface Props { params: Promise<{ token: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("transcripts")
    .select("title")
    .eq("share_token", token)
    .single();
  return {
    title: data?.title ? `${data.title} — Nexus` : "Shared Meeting — Nexus",
    description: "A shared meeting summary, powered by Nexus AI.",
  };
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: transcript } = await supabase
    .from("transcripts")
    .select("*")
    .eq("share_token", token)
    .single();

  if (!transcript) notFound();
  const t = transcript as Transcript;

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <nav className="flex items-center justify-between h-[52px] px-6 border-b border-white/[0.06] bg-background/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-white">
            <Layers className="h-3.5 w-3.5 text-black" strokeWidth={2.5} />
          </div>
          <span className="text-[13px] font-semibold text-white">Nexus</span>
        </Link>
        <div className="flex items-center gap-2 text-[11px] text-white/30">
          <Lock className="h-3 w-3" />
          Read-only · Shared meeting
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-[11px] text-white/40 mb-4">
            <Lock className="h-3 w-3" />
            Shared via Nexus · Public link
          </div>
          <h1 className="text-[26px] font-bold text-white tracking-tight mb-3">{t.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-[12px] text-white/40">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(t.created_at)}
            </span>
            {t.duration_seconds && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(t.duration_seconds)}
              </span>
            )}
            {t.file_type && (
              <span className="flex items-center gap-1.5">
                {t.file_type === "video"
                  ? <FileVideo className="h-3.5 w-3.5" />
                  : <FileAudio className="h-3.5 w-3.5" />}
                {t.file_type}
              </span>
            )}
          </div>
        </div>

        {/* Summary */}
        {t.summary ? (
          <div>
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-4">
              AI Summary
            </p>
            <SummaryPanel summary={t.summary} />
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <p className="text-[14px] text-white/40">No summary available for this meeting.</p>
          </div>
        )}

        {/* Transcript */}
        {t.transcript_text && (
          <div className="rounded-[14px] border border-white/[0.07] bg-white/[0.02] p-6">
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-4">
              Full Transcript
            </p>
            <p className="text-[13.5px] text-white/60 leading-relaxed whitespace-pre-wrap">
              {t.transcript_text}
            </p>
          </div>
        )}

        {/* Footer CTA */}
        <div className="rounded-[14px] border border-white/[0.07] bg-white/[0.02] p-6 text-center">
          <p className="text-[14px] text-white/50 mb-3">
            Powered by Nexus — The AI Automation Workspace
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-[9px] bg-white text-black text-[13px] font-semibold px-5 py-2.5 hover:bg-white/90 transition-colors"
          >
            Try Nexus for free →
          </Link>
        </div>
      </div>
    </div>
  );
}
