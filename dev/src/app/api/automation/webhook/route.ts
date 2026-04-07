import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runWorkflow } from "@/lib/workflow-runner";

// Use service-role client so this endpoint can run unauthenticated
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/automation/webhook?workflowId=xxx[&token=yyy]
 *
 * Receives an external webhook, validates the optional auth token,
 * then executes the workflow with the incoming JSON body as the
 * initial trigger input.
 */
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workflowId = searchParams.get("workflowId");

  if (!workflowId) {
    return NextResponse.json({ error: "Missing workflowId query param" }, { status: 400 });
  }

  // Load workflow from localStorage is client-only — for webhooks we need a
  // server-side lookup. Workflows are stored in localStorage on the client,
  // so we look them up via the supabase webhook_runs table which contains
  // the workflow snapshot, OR we accept the workflow payload embedded in the
  // request (for server-triggered calls).
  //
  // For this implementation: the client registers the workflow by POSTing its
  // definition once to /api/automation/results (see that route), and the
  // webhook receiver looks it up there.

  const supabase = getServiceClient();

  // Look up the registered workflow snapshot
  const { data: registration, error: lookupErr } = await supabase
    .from("automation_results")
    .select("value")
    .eq("storage_key", `__workflow_registration__${workflowId}`)
    .maybeSingle();

  if (lookupErr || !registration) {
    return NextResponse.json(
      { error: "Workflow not found or not registered for webhook. Use the Register button in the workflow builder." },
      { status: 404 }
    );
  }

  const workflow = JSON.parse(registration.value);

  // Check optional auth token
  const triggerNode = workflow.nodes?.find(
    (n: { data: { nodeType: string; config: Record<string, string> } }) =>
      n.data?.nodeType === "trigger_webhook"
  );
  const expectedToken = triggerNode?.data?.config?.authToken;
  if (expectedToken) {
    const authHeader = req.headers.get("authorization") ?? "";
    const provided = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    if (provided !== expectedToken) {
      return NextResponse.json({ error: "Invalid auth token" }, { status: 401 });
    }
  }

  // Parse incoming payload
  let payload: unknown = null;
  try {
    const text = await req.text();
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  // Log the run
  const { data: run } = await supabase
    .from("webhook_runs")
    .insert({
      user_id: workflow.userId,
      workflow_id: workflowId,
      payload,
      status: "running",
    })
    .select("id")
    .single();

  const runId = run?.id;

  // Execute the workflow
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const result = await runWorkflow(workflow, payload, baseUrl);

  // Update run record
  if (runId) {
    await supabase
      .from("webhook_runs")
      .update({
        status: result.status,
        error: result.error ?? null,
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);
  }

  return NextResponse.json({
    runId,
    status: result.status,
    log: result.log,
    output: result.finalOutput,
    ...(result.error && { error: result.error }),
  });
}
