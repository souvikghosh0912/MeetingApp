import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runWorkflow } from "@/lib/workflow-runner";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/automation/cron
 *
 * Called by Vercel Cron (configured in vercel.json) every minute.
 * Finds all active scheduled workflows whose next_run_at <= NOW()
 * and executes them, then updates next_run_at.
 *
 * Security: validated via CRON_SECRET header set by Vercel.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const now = new Date().toISOString();

  // Find all due schedules
  const { data: dueSchedules, error } = await supabase
    .from("scheduled_workflows")
    .select("*")
    .eq("is_active", true)
    .lte("next_run_at", now);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!dueSchedules || dueSchedules.length === 0) {
    return NextResponse.json({ ran: 0 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const results: { workflowId: string; status: string }[] = [];

  for (const schedule of dueSchedules) {
    // Load the registered workflow snapshot
    const { data: registration } = await supabase
      .from("automation_results")
      .select("value")
      .eq("storage_key", `__workflow_registration__${schedule.workflow_id}`)
      .maybeSingle();

    if (!registration) {
      results.push({ workflowId: schedule.workflow_id, status: "skipped:not_registered" });
      continue;
    }

    const workflow = JSON.parse(registration.value);

    const result = await runWorkflow(workflow, null, baseUrl);

    // Update schedule: last_run_at, run_count, and compute next_run_at
    const nextRun = computeNextRun(schedule.cron_expression, schedule.timezone);
    await supabase
      .from("scheduled_workflows")
      .update({
        last_run_at: now,
        run_count: (schedule.run_count ?? 0) + 1,
        next_run_at: nextRun,
      })
      .eq("id", schedule.id);

    results.push({ workflowId: schedule.workflow_id, status: result.status });
  }

  return NextResponse.json({ ran: results.length, results });
}

/**
 * Compute the next run time for a cron expression.
 * Uses a minimal implementation for standard 5-part cron expressions.
 * For production, consider using the `croner` or `cron-parser` npm package.
 */
function computeNextRun(cronExpression: string, timezone: string): string {
  // Simple: add the minimum interval based on the cron pattern.
  // Common patterns: "0 9 * * *" = daily, "0 */6 * * *" = every 6h, "*/30 * * * *" = every 30m
  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length !== 5) {
    // Fallback: 1 hour from now
    return new Date(Date.now() + 3_600_000).toISOString();
  }

  const [minute, hour] = parts;

  let intervalMs: number;

  if (minute.startsWith("*/")) {
    const mins = parseInt(minute.slice(2));
    intervalMs = mins * 60_000;
  } else if (hour.startsWith("*/")) {
    const hrs = parseInt(hour.slice(2));
    intervalMs = hrs * 3_600_000;
  } else if (minute !== "*" && hour !== "*") {
    // Daily at specific time — next occurrence is 24h from now (simplified)
    intervalMs = 24 * 3_600_000;
  } else {
    intervalMs = 3_600_000; // default 1h
  }

  return new Date(Date.now() + intervalMs).toISOString();
}
