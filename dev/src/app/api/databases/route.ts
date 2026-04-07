import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/databases — list all user databases
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: databases, error } = await supabase
      .from("user_databases")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Attach record counts
    const counts = await Promise.all(
      (databases ?? []).map(async (db) => {
        const { count } = await supabase
          .from("db_records")
          .select("id", { count: "exact", head: true })
          .eq("database_id", db.id);
        return { id: db.id, count: count ?? 0 };
      })
    );

    const withCounts = (databases ?? []).map((db) => ({
      ...db,
      record_count: counts.find((c) => c.id === db.id)?.count ?? 0,
    }));

    return NextResponse.json({ databases: withCounts });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/databases — create a new database
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name = "Untitled Database", icon = "🗂️", color = "#6366f1", description } = body;

    // Create database
    const { data: db, error: dbError } = await supabase
      .from("user_databases")
      .insert({ user_id: user.id, name, icon, color, description: description ?? null })
      .select()
      .single();

    if (dbError || !db) return NextResponse.json({ error: dbError?.message ?? "Failed" }, { status: 500 });

    // Seed: primary "Name" property
    const { data: nameProp } = await supabase
      .from("db_properties")
      .insert({
        database_id: db.id,
        name: "Name",
        type: "text",
        config: {},
        position: 0,
        is_primary: true,
      })
      .select()
      .single();

    // Seed: default "Status" select property
    const { data: statusProp } = await supabase
      .from("db_properties")
      .insert({
        database_id: db.id,
        name: "Status",
        type: "select",
        config: {
          options: [
            { id: crypto.randomUUID(), name: "Not started", color: "slate" },
            { id: crypto.randomUUID(), name: "In progress", color: "blue" },
            { id: crypto.randomUUID(), name: "Done", color: "green" },
          ],
        },
        position: 1,
        is_primary: false,
      })
      .select()
      .single();

    // Seed: default Table view
    await supabase.from("db_views").insert({
      database_id: db.id,
      name: "Default view",
      type: "table",
      config: {},
      is_default: true,
    });

    // Seed: Kanban view (grouped by Status)
    if (statusProp) {
      await supabase.from("db_views").insert({
        database_id: db.id,
        name: "Board",
        type: "kanban",
        config: { groupBy: statusProp.id },
        is_default: false,
      });
    }

    return NextResponse.json(
      { database: db, nameProp, statusProp },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
