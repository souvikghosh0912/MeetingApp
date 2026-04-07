import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SpeakerNames, TranscriptSegment } from "@/types";

interface Params {
  params: Promise<{ id: string }>;
}

// PATCH /api/transcripts/[id]
// Handles three distinct update shapes:
//   { title }                          — rename
//   { segments, transcript_text }      — transcript text edits
//   { speaker_names }                  — speaker rename map
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // ── Rename ────────────────────────────────────────────────────────────────
    if ("title" in body) {
      const { title } = body as { title: string };
      if (!title?.trim()) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
      }
      const { error } = await supabase
        .from("transcripts")
        .update({ title: title.trim(), updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // ── Fetch current transcript for summary-merge operations ─────────────────
    const { data: transcript, error: fetchError } = await supabase
      .from("transcripts")
      .select("summary")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !transcript) {
      return NextResponse.json({ error: "Transcript not found" }, { status: 404 });
    }

    const currentSummary = (transcript.summary ?? {}) as Record<string, unknown>;

    // ── Segment / text edits ──────────────────────────────────────────────────
    if ("segments" in body) {
      const { segments, transcript_text } = body as {
        segments: TranscriptSegment[];
        transcript_text: string;
      };
      if (!Array.isArray(segments)) {
        return NextResponse.json({ error: "segments must be an array" }, { status: 400 });
      }
      const updatedSummary = { ...currentSummary, segments };
      const { error } = await supabase
        .from("transcripts")
        .update({
          summary: updatedSummary,
          transcript_text: transcript_text ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // ── Speaker names ─────────────────────────────────────────────────────────
    if ("speaker_names" in body) {
      const { speaker_names } = body as { speaker_names: SpeakerNames };
      if (typeof speaker_names !== "object" || Array.isArray(speaker_names)) {
        return NextResponse.json({ error: "speaker_names must be an object" }, { status: 400 });
      }
      const updatedSummary = { ...currentSummary, speaker_names };
      const { error } = await supabase
        .from("transcripts")
        .update({
          summary: updatedSummary,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  } catch (err) {
    console.error("[PATCH /api/transcripts/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/transcripts/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { error } = await supabase
      .from("transcripts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
