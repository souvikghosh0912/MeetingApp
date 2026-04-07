import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runWorkflow } from "@/lib/workflow-runner";

export const maxDuration = 60;

/**
 * POST /api/automation/upload?workflowId=xxx
 *
 * Accepts a multipart/form-data request with a `file` field.
 * Runs the linked workflow with the file content as the initial input.
 *
 * - Text files: passes file content as a string
 * - Images: passes a base64 data URL (usable by vision AI nodes)
 * - Binary files: passes base64
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const workflowId = searchParams.get("workflowId");

  if (!workflowId) {
    return NextResponse.json({ error: "Missing workflowId" }, { status: 400 });
  }

  // Load registered workflow
  const { data: registration } = await supabase
    .from("automation_results")
    .select("value")
    .eq("user_id", user.id)
    .eq("storage_key", `__workflow_registration__${workflowId}`)
    .maybeSingle();

  if (!registration) {
    return NextResponse.json(
      { error: "Workflow not registered. Save & Register the workflow first." },
      { status: 404 }
    );
  }

  const workflow = JSON.parse(registration.value);

  // Find trigger_upload node to validate file constraints
  const triggerNode = workflow.nodes?.find(
    (n: { data: { nodeType: string } }) => n.data?.nodeType === "trigger_upload"
  );
  const allowedMimes = (triggerNode?.data?.config?.fileTypes as string) || "*/*";
  const maxSizeMb = Number(triggerNode?.data?.config?.maxSizeMb ?? 10);

  // Parse form data
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided (field name: 'file')" }, { status: 400 });
  }

  // Validate size
  const sizeMb = file.size / (1024 * 1024);
  if (sizeMb > maxSizeMb) {
    return NextResponse.json(
      { error: `File too large: ${sizeMb.toFixed(1)}MB exceeds limit of ${maxSizeMb}MB` },
      { status: 400 }
    );
  }

  // Validate MIME type
  if (allowedMimes !== "*/*" && allowedMimes !== "any") {
    const allowed = allowedMimes.split(",").map((m) => m.trim());
    const match = allowed.some((m) => {
      if (m.endsWith("/*")) return file.type.startsWith(m.slice(0, -2));
      return file.type === m;
    });
    if (!match) {
      return NextResponse.json(
        { error: `File type '${file.type}' not allowed. Allowed: ${allowedMimes}` },
        { status: 400 }
      );
    }
  }

  // Convert file to usable input
  const arrayBuffer = await file.arrayBuffer();
  const isText = file.type.startsWith("text/") || file.name.match(/\.(txt|md|csv|json|xml|html|js|ts|py)$/i);
  const isImage = file.type.startsWith("image/");

  let fileInput: unknown;

  if (isText) {
    fileInput = new TextDecoder().decode(arrayBuffer);
  } else if (isImage) {
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    fileInput = `data:${file.type};base64,${base64}`;
  } else {
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    fileInput = {
      name: file.name,
      type: file.type,
      size: file.size,
      base64,
    };
  }

  // Run the workflow with the file as initial input
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const result = await runWorkflow(workflow, fileInput, baseUrl);

  return NextResponse.json({
    status: result.status,
    file: { name: file.name, type: file.type, sizeMb: sizeMb.toFixed(2) },
    log: result.log,
    output: result.finalOutput,
    ...(result.error && { error: result.error }),
  });
}
