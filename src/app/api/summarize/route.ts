import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { summarizeTranscript } from "@/lib/nvidia-nim";
import { checkAndIncrementUsage, checkTranscriptLimit, getModelUsageType } from "@/lib/usage";
import { PLAN_LIMITS } from "@/lib/constants";
import { ModelType, Plan } from "@/types";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { transcript, model, title, storagePath, segments, fileType } = body as {
      transcript: string;
      model: ModelType;
      title?: string;
      storagePath?: string;
      segments?: any[];
      fileType?: string;
    };

    if (!transcript || !model) {
      return NextResponse.json({ error: "Missing transcript or model" }, { status: 400 });
    }

    // Get user plan
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    const plan = (profile?.plan ?? "free") as Plan;
    const limits = PLAN_LIMITS[plan];

    // Check transcript save limit
    const transcriptCheck = await checkTranscriptLimit(user.id, plan);
    if (!transcriptCheck.allowed) {
      return NextResponse.json({ error: transcriptCheck.reason }, { status: 429 });
    }

    // Check model usage limit
    const usageType = getModelUsageType(model);
    const usageCheck = await checkAndIncrementUsage(user.id, plan, usageType);
    if (!usageCheck.allowed) {
      return NextResponse.json({ error: usageCheck.reason }, { status: 429 });
    }

    // Summarize
    const rawSummary = await summarizeTranscript(transcript, model, limits.summaryLength);
    
    const summary = {
      ...rawSummary,
      media_path: storagePath,
      segments
    };

    // Save transcript to database
    const transcriptTitle = title ?? `Meeting — ${new Date().toLocaleDateString("en-IN")}`;
    const { data: saved, error: saveError } = await supabase
      .from("transcripts")
      .insert({
        user_id: user.id,
        title: transcriptTitle,
        transcript_text: transcript,
        summary,
        model_used: model,
        file_type: fileType ?? "audio",
      })
      .select("id")
      .single();

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    return NextResponse.json({ summary, transcriptId: saved.id });
  } catch (err) {
    console.error("[summarize] error:", err);
    const message = err instanceof Error ? err.message : "Summarization failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
