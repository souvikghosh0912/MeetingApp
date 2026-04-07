import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/pages/[id]/duplicate
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch the source page
    const { data: source, error: fetchError } = await supabase
      .from("pages")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !source) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Create duplicate
    const { data: newPage, error: insertError } = await supabase
      .from("pages")
      .insert({
        user_id: user.id,
        title: `Copy of ${source.title}`,
        icon: source.icon,
        cover: source.cover,
        content: source.content,
        parent_id: source.parent_id,
        position: (source.position ?? 0) + 1,
      })
      .select()
      .single();

    if (insertError || !newPage) {
      return NextResponse.json(
        { error: insertError?.message ?? "Failed to duplicate" },
        { status: 500 }
      );
    }

    return NextResponse.json({ page: newPage }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
