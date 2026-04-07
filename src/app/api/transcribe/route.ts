import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transcribeAudio } from "@/lib/nvidia-nim";

export const maxDuration = 120; // 2 min timeout

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { storagePath, signedUrl, fileName, transcriptModel } = body as {
      storagePath: string;
      signedUrl: string;
      fileName: string;
      transcriptModel?: import("@/types").TranscriptModelType;
    };

    if (!storagePath || !signedUrl || !fileName) {
      return NextResponse.json(
        { error: "Missing storagePath, signedUrl, or fileName" },
        { status: 400 }
      );
    }

    // Download file via the signed URL — no service role needed
    const fileRes = await fetch(signedUrl);
    if (!fileRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch file: ${fileRes.statusText}` },
        { status: 500 }
      );
    }

    const arrayBuffer = await fileRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Transcribe with the selected model (Whisper or Deepgram)
    const { text: transcript, segments } = await transcribeAudio(buffer, fileName, transcriptModel);

    // DYNAMICALLY PERSISTING MEDIA
    // We intentionally SKIP deleting the original file from storage 
    // because the user requested the Synced Media Player feature.
    // The media file remains safely in bucket for streaming playback later.

    return NextResponse.json({ transcript, segments });
  } catch (err) {
    console.error("[transcribe] error:", err);
    const message =
      err instanceof Error ? err.message : "Transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
