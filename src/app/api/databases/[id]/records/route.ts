import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/databases/[id]/records
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify ownership
    const { data: db } = await supabase
      .from("user_databases")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (!db) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: records, error } = await supabase
      .from("db_records")
      .select("*")
      .eq("database_id", params.id)
      .order("position", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ records: records ?? [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/databases/[id]/records — create a new record
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify ownership
    const { data: db } = await supabase
      .from("user_databases")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (!db) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Get max position
    const { data: last } = await supabase
      .from("db_records")
      .select("position")
      .eq("database_id", params.id)
      .order("position", { ascending: false })
      .limit(1)
      .single();

    const position = (last?.position ?? -1) + 1;

    const body = await request.json().catch(() => ({}));
    const { data: record, error } = await supabase
      .from("db_records")
      .insert({
        database_id: params.id,
        user_id: user.id,
        data: body.data ?? {},
        position,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ record }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
