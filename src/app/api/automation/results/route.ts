import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const workflowId = searchParams.get("workflowId");

  let query = supabase
    .from("automation_results")
    .select("*")
    .eq("user_id", user.id)
    .not("storage_key", "like", "__workflow_registration__%");

  if (key) query = query.eq("storage_key", key);
  if (workflowId) query = query.eq("workflow_id", workflowId);

  const { data, error } = await query.order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ results: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // ── Register workflow for webhook ──────────────────────────
  if (body.action === "register_workflow") {
    const { workflow } = body;
    if (!workflow?.id) {
      return NextResponse.json({ error: "workflow.id is required" }, { status: 400 });
    }

    const workflowWithUser = { ...workflow, userId: user.id };

    const { error } = await supabase.from("automation_results").upsert(
      {
        user_id: user.id,
        workflow_id: workflow.id,
        storage_key: `__workflow_registration__${workflow.id}`,
        value: JSON.stringify(workflowWithUser),
        format: "json",
      },
      { onConflict: "user_id,workflow_id,storage_key" }
    );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/automation/webhook?workflowId=${workflow.id}`;
    return NextResponse.json({ registered: true, webhookUrl });
  }

  // ── Save arbitrary result ───────────────────────────────────
  const { workflowId, key, value, format = "string" } = body;
  if (!workflowId || !key || value === undefined) {
    return NextResponse.json({ error: "workflowId, key and value are required" }, { status: 400 });
  }

  const stringValue = format === "json" ? JSON.stringify(value) : String(value);

  const { data, error } = await supabase
    .from("automation_results")
    .upsert(
      {
        user_id: user.id,
        workflow_id: workflowId,
        storage_key: key,
        value: stringValue,
        format,
      },
      { onConflict: "user_id,workflow_id,storage_key" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ result: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const workflowId = searchParams.get("workflowId");

  if (!key || !workflowId) {
    return NextResponse.json({ error: "key and workflowId required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("automation_results")
    .delete()
    .eq("user_id", user.id)
    .eq("workflow_id", workflowId)
    .eq("storage_key", key);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}


