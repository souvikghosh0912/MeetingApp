import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { flashcardId, rating } = await request.json() as { flashcardId: string; rating: number };
    
    if (!flashcardId || rating === undefined) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Ensure rating is between 0 and 5
    const quality = Math.max(0, Math.min(5, Math.floor(rating)));

    // Fetch the current flashcard data
    const { data: card, error: fetchError } = await supabase
      .from("study_flashcards")
      .select("*")
      .eq("id", flashcardId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !card) {
      return NextResponse.json({ error: "Flashcard not found" }, { status: 404 });
    }

    // SuperMemo-2 Algorithm
    let repetitions = card.repetitions;
    let interval = card.interval;
    let ease_factor = card.ease_factor;

    if (quality < 3) {
      // Incorrect / Hard failure
      repetitions = 0;
      interval = 1;
    } else {
      // Correct
      repetitions += 1;
      if (repetitions === 1) {
        interval = 1;
      } else if (repetitions === 2) {
        interval = 6;
      } else {
        interval = Math.round(interval * ease_factor);
      }
    }

    // Update ease factor
    ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (ease_factor < 1.3) ease_factor = 1.3;

    // Calculate next review date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    // Update in Database
    const { data: updatedCard, error: updateError } = await supabase
      .from("study_flashcards")
      .update({
        repetitions,
        interval,
        ease_factor,
        next_review: nextReview.toISOString()
      })
      .eq("id", flashcardId)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ flashcard: updatedCard });
  } catch (err) {
    console.error("[flashcards/review] error:", err);
    return NextResponse.json({ error: "Review update failed" }, { status: 500 });
  }
}
