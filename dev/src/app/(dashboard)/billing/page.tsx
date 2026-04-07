import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PLAN_LIMITS, PLAN_NAMES } from "@/lib/constants";
import { Plan } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Zap, CreditCard } from "lucide-react";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const plan = (profile?.plan ?? "free") as Plan;
  const limits = PLAN_LIMITS[plan];

  // Get usage
  const today = new Date().toISOString().split("T")[0];
  const { data: todayUsage } = await supabase
    .from("usage_tracking")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  // Get transcript count
  const { count: transcriptCount } = await supabase
    .from("transcripts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Get weekly visualization count
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { data: weekData } = await supabase
    .from("usage_tracking")
    .select("visualizations_count")
    .eq("user_id", user.id)
    .gte("date", weekAgo.toISOString().split("T")[0]);
  const weekVisualizations = (weekData ?? []).reduce(
    (sum, row) => sum + (row.visualizations_count ?? 0),
    0
  );

  const stats = [
    {
      label: "8B Summaries Today",
      used: todayUsage?.summaries_8b_count ?? 0,
      limit: limits.summaries8bPerDay,
    },
    {
      label: "GPT-OSS 20B Chat Today",
      used: todayUsage?.summaries_20b_count ?? 0,
      limit: limits.summaries20bPerDay,
    },
    {
      label: "GPT-OSS 120B Viz Today",
      used: todayUsage?.summaries_120b_count ?? 0,
      limit: limits.summaries120bPerDay,
    },
    {
      label: "Visualizations This Week",
      used: weekVisualizations,
      limit: limits.visualizationsPerWeek,
    },
    {
      label: "Saved Transcripts",
      used: transcriptCount ?? 0,
      limit: limits.maxSavedTranscripts,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing & Plan</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your subscription and usage.
        </p>
      </div>

      {/* Current plan card */}
      <div className="rounded-2xl border border-white/10 bg-white/3 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 border border-accent/20">
              <CreditCard className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Current Plan</p>
              <div className="flex items-center gap-2 mt-0.5">
                <h2 className="text-lg font-bold text-white">{PLAN_NAMES[plan]}</h2>
                <Badge variant={plan === "free" ? "secondary" : "default"}>
                  {plan === "free" ? "Free" : "Active"}
                </Badge>
              </div>
            </div>
          </div>
          {plan !== "free" && (
            <p className="text-2xl font-black text-white">
              ₹{plan === "pro" ? "399" : "999"}
              <span className="text-sm font-normal text-text-muted">/mo</span>
            </p>
          )}
        </div>

        {/* Upgrade section */}
        {plan === "free" && (
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-5">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white mb-1">
                  Upgrade to Pro — ₹399/month
                </h3>
                <ul className="space-y-1.5 mb-4">
                  {[
                    "Unlimited visualizations",
                    "30 summaries/day with 8B · 20 with GPT-OSS",
                    "Up to 100 saved transcripts",
                    "Longer, more detailed summaries",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-text-secondary">
                      <Check className="h-3 w-3 text-accent flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button size="sm" className="gap-2" disabled>
                  <Zap className="h-3.5 w-3.5" />
                  Upgrade — Coming Soon
                </Button>
                <p className="text-xs text-text-muted mt-2">
                  Payment integration isn&apos;t available yet. Check back soon!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Usage stats */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
          Usage
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stats.map((stat) => {
            const isUnlimited = stat.limit === "unlimited";
            const pct = isUnlimited ? 0 : Math.min(100, (stat.used / (stat.limit as number)) * 100);
            const isNearLimit = !isUnlimited && pct >= 80;

            return (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-white/3 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-text-muted">{stat.label}</p>
                  <span className={`text-xs font-medium ${isNearLimit ? "text-yellow-400" : "text-text-secondary"}`}>
                    {stat.used} / {isUnlimited ? "∞" : stat.limit}
                  </span>
                </div>
                {!isUnlimited && (
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct >= 100 ? "bg-red-500" : isNearLimit ? "bg-yellow-500" : "bg-accent"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
