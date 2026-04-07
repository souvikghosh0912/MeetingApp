import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/databases/[id] — full database detail
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: database, error: dbError } = await supabase
      .from("user_databases")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (dbError || !database)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [{ data: properties }, { data: records }, { data: views }] = await Promise.all([
      supabase
        .from("db_properties")
        .select("*")
        .eq("database_id", params.id)
        .order("position", { ascending: true }),
      supabase
        .from("db_records")
        .select("*")
        .eq("database_id", params.id)
        .order("position", { ascending: true }),
      supabase
        .from("db_views")
        .select("*")
        .eq("database_id", params.id)
        .order("created_at", { ascending: true }),
    ]);

    return NextResponse.json({
      database,
      properties: properties ?? [],
      records: records ?? [],
      views: views ?? [],
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/databases/[id] — update database metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, icon, color, description } = body;

    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (icon !== undefined) update.icon = icon;
    if (color !== undefined) update.color = color;
    if (description !== undefined) update.description = description;

    const { data, error } = await supabase
      .from("user_databases")
      .update(update)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ database: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/databases/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
      .from("user_databases")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
