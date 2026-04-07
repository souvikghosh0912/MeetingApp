import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/databases/[id]/records/[recordId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; recordId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    // Update only the provided data keys (merge)
    const { data: existing } = await supabase
      .from("db_records")
      .select("data")
      .eq("id", params.recordId)
      .eq("user_id", user.id)
      .single();

    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const mergedData = { ...(existing.data as Record<string, unknown>), ...(body.data ?? {}) };

    const { data: record, error } = await supabase
      .from("db_records")
      .update({ data: mergedData })
      .eq("id", params.recordId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ record });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/databases/[id]/records/[recordId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; recordId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
      .from("db_records")
      .delete()
      .eq("id", params.recordId)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
