import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FavoriteItemType } from "@/types";

// GET /api/recently-visited
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("user_recently_visited")
      .select("*")
      .eq("user_id", user.id)
      .order("visited_at", { ascending: false })
      .limit(10);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ items: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/recently-visited — upsert a visit
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { item_type, item_id, title, icon } = body as {
      item_type: FavoriteItemType;
      item_id: string;
      title: string;
      icon: string;
    };

    if (!item_type || !item_id) {
      return NextResponse.json({ error: "item_type and item_id required" }, { status: 400 });
    }

    // Upsert: update visited_at if already exists, insert if not
    const { error } = await supabase
      .from("user_recently_visited")
      .upsert(
        {
          user_id: user.id,
          item_type,
          item_id,
          title: title ?? "",
          icon: icon ?? "📄",
          visited_at: new Date().toISOString(),
        },
        { onConflict: "user_id,item_id" }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Prune to last 20 items for this user
    const { data: allItems } = await supabase
      .from("user_recently_visited")
      .select("id, visited_at")
      .eq("user_id", user.id)
      .order("visited_at", { ascending: false });

    if (allItems && allItems.length > 20) {
      const idsToDelete = allItems.slice(20).map((i) => i.id);
      await supabase
        .from("user_recently_visited")
        .delete()
        .in("id", idsToDelete);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
