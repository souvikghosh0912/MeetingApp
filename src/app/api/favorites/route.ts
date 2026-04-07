import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FavoriteItemType } from "@/types";

// GET /api/favorites
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("user_favorites")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ favorites: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/favorites — add a favorite
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

    const { data, error } = await supabase
      .from("user_favorites")
      .upsert(
        { user_id: user.id, item_type, item_id, title: title ?? "", icon: icon ?? "📄" },
        { onConflict: "user_id,item_id" }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ favorite: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
