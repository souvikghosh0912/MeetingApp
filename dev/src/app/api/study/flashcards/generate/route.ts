import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFlashcards } from "@/lib/nvidia-nim";
import { ModelType } from "@/types";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studyPageId } = await request.json() as { studyPageId: string };
    
    if (!studyPageId) {
      return NextResponse.json({ error: "Missing studyPageId" }, { status: 400 });
    }

    // Fetch the extracted text and model for the study page
    const { data: studyPage, error: fetchError } = await supabase
      .from("study_pages")
      .select("extracted_text, model_used")
      .eq("id", studyPageId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !studyPage?.extracted_text) {
      return NextResponse.json({ error: "Study page not found or missing text" }, { status: 404 });
    }

    const flashcardsData = await generateFlashcards(
      studyPage.extracted_text, 
      studyPage.model_used as ModelType
    );

    if (flashcardsData.length === 0) {
      return NextResponse.json({ error: "No flashcards generated" }, { status: 500 });
    }

    // Insert flashcards into database
    const insertData = flashcardsData.map((card) => ({
      user_id: user.id,
      study_page_id: studyPageId,
      front: card.front,
      back: card.back,
    }));

    const { data: insertedCards, error: insertError } = await supabase
      .from("study_flashcards")
      .insert(insertData)
      .select("*");

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ flashcards: insertedCards });
  } catch (err) {
    console.error("[flashcards/generate] error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
