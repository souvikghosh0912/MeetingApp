import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateHighlights } from "@/lib/nvidia-nim";
import { Transcript } from "@/types";

export const maxDuration = 120; // 2 minute timeout for NIM GPT-OSS 120b

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transcriptId } = await request.json();

    if (!transcriptId) {
      return NextResponse.json({ error: "Transcript ID is required" }, { status: 400 });
    }

    // Fetch the transcript
    const { data: transcript, error: fetchError } = await supabase
      .from("transcripts")
      .select("*")
      .eq("id", transcriptId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !transcript) {
      return NextResponse.json({ error: "Transcript not found" }, { status: 404 });
    }

    const t = transcript as Transcript;

    // Check if highlights already exist
    if (t.summary?.highlights && t.summary.highlights.length > 0) {
      return NextResponse.json({ highlights: t.summary.highlights });
    }

    if (!t.transcript_text || !t.summary?.segments || t.summary.segments.length === 0) {
      return NextResponse.json({ error: "Transcript text or segments are missing" }, { status: 400 });
    }

    // Generate the highlights mapping using the AI engine
    const highlights = await generateHighlights(t.transcript_text, t.summary.segments);

    // Prepare updated summary object
    const updatedSummary = {
      ...t.summary,
      highlights
    };

    // Save back to database
    const { error: updateError } = await supabase
      .from("transcripts")
      .update({ summary: updatedSummary })
      .eq("id", transcriptId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[highlights] DB Update Error:", updateError);
      return NextResponse.json({ error: "Failed to save highlights" }, { status: 500 });
    }

    return NextResponse.json({ highlights });

  } catch (error: any) {
    console.error("[highlights] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate highlights" }, { status: 500 });
  }
}
