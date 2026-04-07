import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SummaryPanel } from "@/components/visualization/SummaryPanel";
import { TopicsChart } from "@/components/visualization/TopicsChart";
import { WorkflowSection } from "@/components/visualization/WorkflowSection";
import { InteractiveTranscriptViewer } from "@/components/transcripts/InteractiveTranscriptViewer";
import { ExportShareButton } from "@/components/transcripts/ExportShareButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MODEL_NAMES } from "@/lib/constants";
import { formatDate, formatDuration } from "@/lib/utils";
import { FileAudio, FileVideo, Calendar, Clock, Bot, Film } from "lucide-react";
import { Transcript } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("transcripts")
    .select("title")
    .eq("id", id)
    .single();
  return { title: data?.title ?? "Transcript" };
}

export default async function TranscriptDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: transcript } = await supabase
    .from("transcripts")
    .select("*, share_token")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!transcript) notFound();

  const t = transcript as Transcript;

  let mediaUrl: string | undefined;
  if (t.summary?.media_path) {
    const { data: signedData } = await supabase.storage
      .from("temp-uploads")
      .createSignedUrl(t.summary.media_path, 3600);
    if (signedData?.signedUrl) {
      mediaUrl = signedData.signedUrl;
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">{t.title}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <Calendar className="h-3 w-3" />
              {formatDate(t.created_at)}
            </span>
            {t.duration_seconds && (
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                <Clock className="h-3 w-3" />
                {formatDuration(t.duration_seconds)}
              </span>
            )}
            {t.file_type && (
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                {t.file_type === "video" ? (
                  <FileVideo className="h-3 w-3" />
                ) : (
                  <FileAudio className="h-3 w-3" />
                )}
                {t.file_type}
              </span>
            )}
            <Badge variant="secondary">{MODEL_NAMES[t.model_used]}</Badge>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <ExportShareButton transcript={t} />
          <Button
            asChild
            variant="outline"
            className="text-white border-white/20 hover:bg-white/10 bg-black/20 backdrop-blur-sm"
          >
            <Link href={`/transcripts/${t.id}/highlights`}>
              <Film className="w-4 h-4 mr-2 text-accent" />
              See Highlights
            </Link>
          </Button>
          <Button
            asChild
            className="bg-accent hover:bg-accent/80 text-white shadow-glow"
          >
            <Link href={`/transcripts/${t.id}/chat`}>
              <Bot className="w-4 h-4 mr-2" />
              Ask Questions
            </Link>
          </Button>
        </div>
      </div>

      {/* Main content: Transcript + Summary side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transcript — now with edit + speaker naming support */}
        <div className="flex flex-col">
          <InteractiveTranscriptViewer
            transcriptId={t.id}
            mediaUrl={mediaUrl}
            fileType={t.file_type || "audio"}
            segments={t.summary?.segments}
            fallbackText={t.transcript_text}
            initialSpeakerNames={t.summary?.speaker_names ?? {}}
          />
        </div>

        {/* Summary */}
        <div>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            AI Summary
          </h2>
          {t.summary ? (
            <SummaryPanel summary={t.summary} />
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/3 p-6">
              <p className="text-sm text-text-muted italic">No summary available.</p>
            </div>
          )}
        </div>
      </div>

      {/* Visualizations */}
      {t.summary && (
        <div className="space-y-8">
          <div>
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
              AI Topics Visualization
            </h2>
            <TopicsChart summary={t.summary} />
          </div>
          <WorkflowSection transcriptId={t.id} summary={t.summary} />
        </div>
      )}
    </div>
  );
}
