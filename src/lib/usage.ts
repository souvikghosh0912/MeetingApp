import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "@/lib/constants";
import { Plan, ModelType } from "@/types";

interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number | "unlimited";
}

export async function checkAndIncrementUsage(
  userId: string,
  plan: Plan,
  type: "visualization" | "summary_8b" | "summary_20b" | "summary_120b"
): Promise<UsageCheckResult> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const limits = PLAN_LIMITS[plan];

  // Get or create today's usage record
  const { data: existing } = await supabase
    .from("usage_tracking")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  const current = existing ?? {
    user_id: userId,
    date: today,
    visualizations_count: 0,
    summaries_8b_count: 0,
    summaries_20b_count: 0,
    summaries_120b_count: 0,
  };

  // Check limits
  if (type === "visualization") {
    if (limits.visualizationsPerWeek !== "unlimited") {
      // Check weekly limit
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: weekUsage } = await supabase
        .from("usage_tracking")
        .select("visualizations_count")
        .eq("user_id", userId)
        .gte("date", weekAgo.toISOString().split("T")[0]);

      const weekTotal = (weekUsage ?? []).reduce(
        (sum, row) => sum + (row.visualizations_count ?? 0),
        0
      );

      if (weekTotal >= limits.visualizationsPerWeek) {
        return {
          allowed: false,
          reason: `Weekly visualization limit reached (${limits.visualizationsPerWeek}/week)`,
          current: weekTotal,
          limit: limits.visualizationsPerWeek,
        };
      }
    }
    // Increment visualization count
    await upsertUsage(supabase, userId, today, existing, {
      visualizations_count: (current.visualizations_count ?? 0) + 1,
    });
  } else if (type === "summary_8b") {
    if (limits.summaries8bPerDay !== "unlimited") {
      const count = current.summaries_8b_count ?? 0;
      if (count >= limits.summaries8bPerDay) {
        return {
          allowed: false,
          reason: `Daily 8B model limit reached (${limits.summaries8bPerDay}/day)`,
          current: count,
          limit: limits.summaries8bPerDay,
        };
      }
      await upsertUsage(supabase, userId, today, existing, {
        summaries_8b_count: count + 1,
      });
    }
  } else if (type === "summary_20b") {
    if (limits.summaries20bPerDay !== "unlimited") {
      const count = current.summaries_20b_count ?? 0;
      if (count >= limits.summaries20bPerDay) {
        return {
          allowed: false,
          reason: `Daily GPT-OSS 20B model limit reached (${limits.summaries20bPerDay}/day)`,
          current: count,
          limit: limits.summaries20bPerDay,
        };
      }
      await upsertUsage(supabase, userId, today, existing, {
        summaries_20b_count: count + 1,
      });
    }
  } else if (type === "summary_120b") {
    if (limits.summaries120bPerDay !== "unlimited") {
      const count = current.summaries_120b_count ?? 0;
      if (count >= limits.summaries120bPerDay) {
        return {
          allowed: false,
          reason: `Daily GPT-OSS 120B model limit reached (${limits.summaries120bPerDay}/day)`,
          current: count,
          limit: limits.summaries120bPerDay,
        };
      }
      await upsertUsage(supabase, userId, today, existing, {
        summaries_120b_count: count + 1,
      });
    }
  }

  return { allowed: true };
}

export async function checkTranscriptLimit(
  userId: string,
  plan: Plan
): Promise<UsageCheckResult> {
  const supabase = await createClient();
  const limits = PLAN_LIMITS[plan];

  if (limits.maxSavedTranscripts === "unlimited") return { allowed: true };

  const { count } = await supabase
    .from("transcripts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const current = count ?? 0;
  if (current >= limits.maxSavedTranscripts) {
    return {
      allowed: false,
      reason: `Saved transcript limit reached (${limits.maxSavedTranscripts} max)`,
      current,
      limit: limits.maxSavedTranscripts,
    };
  }

  return { allowed: true, current, limit: limits.maxSavedTranscripts };
}

async function upsertUsage(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  userId: string,
  date: string,
  existing: Record<string, number> | null,
  updates: Record<string, number>
) {
  if (existing) {
    await supabase
      .from("usage_tracking")
      .update(updates)
      .eq("user_id", userId)
      .eq("date", date);
  } else {
    await supabase.from("usage_tracking").insert({
      user_id: userId,
      date,
      visualizations_count: 0,
      summaries_8b_count: 0,
      summaries_20b_count: 0,
      summaries_120b_count: 0,
      ...updates,
    });
  }
}

export function getModelUsageType(model: ModelType): "summary_8b" | "summary_20b" | "summary_120b" {
  if (model === "llama-8b") return "summary_8b";
  if (model === "gpt-oss-20b") return "summary_20b";
  return "summary_120b";
}
