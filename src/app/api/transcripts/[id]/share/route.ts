import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

interface Params { params: Promise<{ id: string }> }

// POST /api/transcripts/[id]/share → generate share token
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership
  const { data: transcript } = await supabase
    .from("transcripts")
    .select("id, share_token")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!transcript) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Reuse existing token or generate new one
  const token = transcript.share_token ?? randomBytes(20).toString("hex");

  await supabase
    .from("transcripts")
    .update({ share_token: token })
    .eq("id", id)
    .eq("user_id", user.id);

  return NextResponse.json({ token, url: `/share/${token}` });
}

// DELETE /api/transcripts/[id]/share → revoke share token
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase
    .from("transcripts")
    .update({ share_token: null })
    .eq("id", id)
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}

// GET /api/transcripts/[id]/share → get current share status
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: transcript } = await supabase
    .from("transcripts")
    .select("share_token")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ token: transcript?.share_token ?? null });
}
