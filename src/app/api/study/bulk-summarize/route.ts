import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { summarizeStudyPage } from "@/lib/nvidia-nim";
import { PLAN_LIMITS } from "@/lib/constants";
import { ModelType, Plan } from "@/types";

export const maxDuration = 180;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      pages: Array<{ extractedText: string; storagePath: string }>;
      model: ModelType;
      title?: string;
      customInstructions?: string;
    };

    const { pages, model, title, customInstructions } = body;

    if (!pages || pages.length === 0 || !model) {
      return NextResponse.json(
        { error: "Missing pages or model" },
        { status: 400 }
      );
    }

    // Filter out any pages with empty text (should not happen normally)
    const validPages = pages.filter((p) => p.extractedText?.trim());
    if (validPages.length === 0) {
      return NextResponse.json(
        { error: "No valid pages with extracted text" },
        { status: 400 }
      );
    }

    // Fetch user plan for summary length
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    const plan = (profile?.plan ?? "free") as Plan;
    const limits = PLAN_LIMITS[plan];

    // Merge all extracted text with clear page separators so the model
    // understands it is synthesizing across multiple pages
    const mergedText = validPages
      .map((p, i) => `--- Page ${i + 1} ---\n\n${p.extractedText}`)
      .join("\n\n");

    const summary = await summarizeStudyPage(
      mergedText,
      model,
      limits.summaryLength,
      customInstructions
    );

    const pageTitle =
      title?.trim() ||
      `Study Set — ${validPages.length} pages — ${new Date().toLocaleDateString("en-IN")}`;

    // Store primary image path (first page). The full list could be a future
    // DB column; for now the workspace shows the first image only.
    const primaryImagePath = validPages[0]?.storagePath ?? null;

    const { data: saved, error: saveError } = await supabase
      .from("study_pages")
      .insert({
        user_id: user.id,
        title: pageTitle,
        source_image_path: primaryImagePath,
        extracted_text: mergedText,
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
    console.error("[study/bulk-summarize] error:", err);
    const message =
      err instanceof Error ? err.message : "Bulk summarization failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
