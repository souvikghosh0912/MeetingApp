import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/databases/[id]/properties
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: properties, error } = await supabase
      .from("db_properties")
      .select("*")
      .eq("database_id", params.id)
      .order("position", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ properties: properties ?? [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/databases/[id]/properties — add a new property
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

    const body = await request.json();
    const { name, type = "text", config = {} } = body;

    // Get max position
    const { data: last } = await supabase
      .from("db_properties")
      .select("position")
      .eq("database_id", params.id)
      .order("position", { ascending: false })
      .limit(1)
      .single();

    const position = (last?.position ?? -1) + 1;

    const { data: property, error } = await supabase
      .from("db_properties")
      .insert({
        database_id: params.id,
        name: name ?? "Untitled",
        type,
        config,
        position,
        is_primary: false,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ property }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/databases/[id]/properties — update a property (pass id in body)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { propertyId, name, type, config, position } = body;
    if (!propertyId) return NextResponse.json({ error: "propertyId required" }, { status: 400 });

    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (type !== undefined) update.type = type;
    if (config !== undefined) update.config = config;
    if (position !== undefined) update.position = position;

    const { data: property, error } = await supabase
      .from("db_properties")
      .update(update)
      .eq("id", propertyId)
      .eq("database_id", params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ property });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/databases/[id]/properties — delete property (pass id in body)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { propertyId } = body;
    if (!propertyId) return NextResponse.json({ error: "propertyId required" }, { status: 400 });

    // Cannot delete primary property
    const { data: prop } = await supabase
      .from("db_properties")
      .select("is_primary")
      .eq("id", propertyId)
      .single();

    if (prop?.is_primary)
      return NextResponse.json({ error: "Cannot delete primary property" }, { status: 400 });

    const { error } = await supabase
      .from("db_properties")
      .delete()
      .eq("id", propertyId)
      .eq("database_id", params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
