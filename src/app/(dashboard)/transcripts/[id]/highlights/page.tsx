import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Transcript } from "@/types";
import { HighlightsPlayer } from "@/components/transcripts/HighlightsPlayer";
import { GenerateHighlights } from "@/components/transcripts/GenerateHighlights";
import Link from "next/link";
import { ArrowLeft, Film } from "lucide-react";

export default async function HighlightsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: transcript } = await supabase
    .from("transcripts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!transcript) notFound();

  const t = transcript as Transcript;

  let mediaUrl: string | undefined;
  if (t.summary?.media_path) {
    const { data: signedData } = await supabase.storage
      .from("temp-uploads")
      .createSignedUrl(t.summary.media_path, 3600); // 1 hour secure streaming token
    
    if (signedData?.signedUrl) {
      mediaUrl = signedData.signedUrl;
    }
  }

  const highlightsData = t.summary?.highlights;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/transcripts/${t.id}`} className="inline-flex items-center text-sm font-medium text-text-muted hover:text-white transition-colors mb-4 border border-white/10 bg-white/5 hover:bg-white/10 rounded-full px-4 py-1">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Transcript
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
              <Film className="w-5 h-5 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-white">Highlight Reel</h1>
          </div>
          <p className="text-text-secondary mt-1 max-w-2xl">
            Short clips of key decisions and action items from <strong>{t.title}</strong>
          </p>
        </div>
      </div>

      {/* Content */}
      {!mediaUrl ? (
        <div className="p-8 rounded-2xl border border-white/10 bg-white/5 flex flex-col items-center justify-center text-center">
          <Film className="w-12 h-12 text-white/20 mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">No Media Available</h2>
          <p className="text-sm text-text-muted">
            Highlights require the original audio or video file to be securely persisted.
          </p>
        </div>
      ) : highlightsData === undefined ? (
        <GenerateHighlights transcriptId={t.id} />
      ) : (
        <HighlightsPlayer 
          highlights={highlightsData} 
          mediaUrl={mediaUrl} 
          fileType={t.file_type || "audio"} 
        />
      )}
    </div>
  );
}
