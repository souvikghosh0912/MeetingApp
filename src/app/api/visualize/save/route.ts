import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transcriptId, workflow } = await request.json();

    if (!transcriptId || !workflow) {
      return NextResponse.json({ error: "Missing transcriptId or workflow data" }, { status: 400 });
    }

    // Verify ownership and get current summary
    const { data: transcript, error: fetchError } = await supabase
      .from("transcripts")
      .select("summary")
      .eq("id", transcriptId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !transcript) {
      return NextResponse.json({ error: "Transcript not found" }, { status: 404 });
    }

    const updatedSummary = {
      ...(transcript.summary || {}),
      workflow
    };

    const { error: updateError } = await supabase
      .from("transcripts")
      .update({ summary: updatedSummary })
      .eq("id", transcriptId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[visualize-save] error:", error);
    return NextResponse.json({ error: error.message || "Failed to save workflow" }, { status: 500 });
  }
}
