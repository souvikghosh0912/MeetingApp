import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [], pages: [] });

  const [byTitle, byTranscript, pageResults] = await Promise.all([
    supabase
      .from("transcripts")
      .select("id, title, created_at, duration_seconds, file_type, summary, model_used")
      .eq("user_id", user.id)
      .ilike("title", `%${q}%`)
      .order("created_at", { ascending: false })
      .limit(6),

    supabase
      .from("transcripts")
      .select("id, title, created_at, duration_seconds, file_type, summary, model_used")
      .eq("user_id", user.id)
      .ilike("transcript_text", `%${q}%`)
      .order("created_at", { ascending: false })
      .limit(4),

    supabase
      .from("pages")
      .select("id, title, icon, cover, parent_id, updated_at")
      .eq("user_id", user.id)
      .ilike("title", `%${q}%`)
      .order("updated_at", { ascending: false })
      .limit(6),
  ]);

  // Deduplicate transcripts by id, title matches first
  const seen = new Set<string>();
  const merged = [
    ...(byTitle.data ?? []),
    ...(byTranscript.data ?? []),
  ].filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

  return NextResponse.json({
    results: merged.slice(0, 10),
    pages: pageResults.data ?? [],
  });
}
