import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { summarizeStudyPage } from "@/lib/nvidia-nim";
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

    const body = await request.json() as {
      extractedText: string;
      model: ModelType;
      title?: string;
      sourceImagePath?: string;
    };

    const { extractedText, model, title, sourceImagePath } = body;

    if (!extractedText || !model) {
      return NextResponse.json(
        { error: "Missing extractedText or model" },
        { status: 400 }
      );
    }

    // Fetch plan for summary length
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    const plan = (profile?.plan ?? "free") as Plan;
    const limits = PLAN_LIMITS[plan];

    const summary = await summarizeStudyPage(extractedText, model, limits.summaryLength);

    const pageTitle = title?.trim() || `Study Page — ${new Date().toLocaleDateString("en-IN")}`;

    const { data: saved, error: saveError } = await supabase
      .from("study_pages")
      .insert({
        user_id: user.id,
        title: pageTitle,
        source_image_path: sourceImagePath ?? null,
        extracted_text: extractedText,
        summary,
        model_used: model,
      })
      .select("id")
      .single();

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    return NextResponse.json({ summary, studyPageId: saved.id });
  } catch (err) {
    console.error("[study/summarize] error:", err);
    const message = err instanceof Error ? err.message : "Summarization failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
