import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  // Full-text search across title and transcript_text
  const { data: byTitle } = await supabase
    .from("transcripts")
    .select("id, title, created_at, duration_seconds, file_type, summary, model_used")
    .eq("user_id", user.id)
    .ilike("title", `%${q}%`)
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: byTranscript } = await supabase
    .from("transcripts")
    .select("id, title, created_at, duration_seconds, file_type, summary, model_used")
    .eq("user_id", user.id)
    .ilike("transcript_text", `%${q}%`)
    .order("created_at", { ascending: false })
    .limit(6);

  // Merge + deduplicate by id, title matches first
  const seen = new Set<string>();
  const merged = [...(byTitle ?? []), ...(byTranscript ?? [])].filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

  return NextResponse.json({ results: merged.slice(0, 10) });
}
