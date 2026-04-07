import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/comments/[id] — edit content or toggle resolved
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (body.content !== undefined) update.content = body.content;
    if (body.resolved !== undefined) update.resolved = body.resolved;

    const { data: comment, error } = await supabase
      .from("page_comments")
      .update(update)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !comment) {
      return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 404 });
    }

    return NextResponse.json({ comment });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/comments/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
      .from("page_comments")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
