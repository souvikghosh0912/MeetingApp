import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWorkflowFromTranscript } from "@/lib/workflow-generator";
import { checkAndIncrementUsage } from "@/lib/usage";
import { Plan, Transcript } from "@/types";

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
      return NextResponse.json({ error: "Missing transcriptId" }, { status: 400 });
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

    // Get user plan and enforce visualization limit
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    const plan = (profile?.plan ?? "free") as Plan;
    const usageCheck = await checkAndIncrementUsage(user.id, plan, "visualization");
    if (!usageCheck.allowed) {
      return NextResponse.json({ error: usageCheck.reason }, { status: 429 });
    }

    // Check if it already has workflow generated
    if (t.summary && t.summary.workflow) {
      return NextResponse.json({ workflow: t.summary.workflow });
    }

    if (!t.transcript_text) {
      return NextResponse.json({ error: "Cannot visualize an empty transcript." }, { status: 400 });
    }

    // Call NIM for workflow extraction
    const workflow = await generateWorkflowFromTranscript(t.transcript_text);

    // Update the summary in the database
    const updatedSummary = {
      ...(t.summary || { tldr: [], action_items: [], decisions: [], sentiment: "neutral", sentiment_explanation: "", topics: [] }),
      workflow,
    };

    const { error: updateError } = await supabase
      .from("transcripts")
      .update({ summary: updatedSummary })
      .eq("id", transcriptId);

    if (updateError) {
      throw new Error("Failed to save workflow visualization");
    }

    return NextResponse.json({ workflow });
  } catch (error: any) {
    console.error("[visualize] error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate visualization" }, { status: 500 });
  }
}
