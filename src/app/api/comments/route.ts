import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/comments?page_id=xxx
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pageId = request.nextUrl.searchParams.get("page_id");
    if (!pageId) return NextResponse.json({ error: "page_id required" }, { status: 400 });

    // Verify user owns this page
    const { data: page } = await supabase
      .from("pages")
      .select("id")
      .eq("id", pageId)
      .eq("user_id", user.id)
      .single();

    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: comments, error } = await supabase
      .from("page_comments")
      .select(`
        *,
        profiles (
          display_name,
          avatar_url
        )
      `)
      .eq("page_id", pageId)
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Flatten profile join
    const result = (comments ?? []).map((c) => ({
      ...c,
      author_name: (c.profiles as { display_name: string | null; avatar_url: string | null } | null)?.display_name ?? "User",
      author_avatar: (c.profiles as { display_name: string | null; avatar_url: string | null } | null)?.avatar_url ?? null,
      profiles: undefined,
    }));

    return NextResponse.json({ comments: result });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/comments
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { page_id, content, parent_id = null } = body as {
      page_id: string;
      content: string;
      parent_id?: string | null;
    };

    if (!page_id || !content?.trim()) {
      return NextResponse.json({ error: "page_id and content required" }, { status: 400 });
    }

    // Verify user owns this page
    const { data: page } = await supabase
      .from("pages")
      .select("id")
      .eq("id", page_id)
      .eq("user_id", user.id)
      .single();

    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: comment, error } = await supabase
      .from("page_comments")
      .insert({
        page_id,
        user_id: user.id,
        content: content.trim(),
        parent_id: parent_id ?? null,
      })
      .select()
      .single();

    if (error || !comment) {
      return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
    }

    // Get author profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .single();

    return NextResponse.json(
      {
        comment: {
          ...comment,
          author_name: profile?.display_name ?? "User",
          author_avatar: profile?.avatar_url ?? null,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
