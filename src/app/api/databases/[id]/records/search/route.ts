import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/databases/[id]/records/search?q=foo
// Returns the primary field value + id for records in a given database.
// Used by the RelationPicker to search for records to link.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const q = request.nextUrl.searchParams.get("q")?.toLowerCase() ?? "";

    // Verify user owns this database
    const { data: database } = await supabase
      .from("user_databases")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (!database) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Get primary property
    const { data: primary } = await supabase
      .from("db_properties")
      .select("id")
      .eq("database_id", params.id)
      .eq("is_primary", true)
      .single();

    // Get records
    const { data: records } = await supabase
      .from("db_records")
      .select("id, data")
      .eq("database_id", params.id)
      .order("position", { ascending: true })
      .limit(200);

    const results = (records ?? [])
      .map((r) => ({
        id: r.id,
        title: primary ? String(r.data[primary.id] ?? "") : "",
      }))
      .filter((r) => !q || r.title.toLowerCase().includes(q));

    return NextResponse.json({ records: results.slice(0, 50) });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
