import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/pages — list user's pages (optionally filter by ?q= or ?parent_id=)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const q = request.nextUrl.searchParams.get("q")?.trim();
    const parentId = request.nextUrl.searchParams.get("parent_id");

    let query = supabase
      .from("pages")
      .select("id, title, icon, cover, parent_id, position, created_at, updated_at")
      .eq("user_id", user.id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: false });

    if (q) {
      query = query.ilike("title", `%${q}%`);
    }

    if (parentId === "root") {
      query = query.is("parent_id", null);
    } else if (parentId) {
      query = query.eq("parent_id", parentId);
    }

    const { data: pages, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ pages: pages ?? [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/pages — create a new page
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { title = "Untitled", icon = "📄", content = [], parent_id = null, cover = null } = body;

    const { data: page, error } = await supabase
      .from("pages")
      .insert({
        user_id: user.id,
        title,
        icon,
        content,
        cover: cover ?? null,
        parent_id: parent_id ?? null,
        position: 0,
      })
      .select()
      .single();

    if (error || !page)
      return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });

    return NextResponse.json({ page }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
