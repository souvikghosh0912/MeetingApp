"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Summary } from "@/types";
import { BarChart3 } from "lucide-react";

interface TopicsChartProps {
  summary: Summary;
}

const COLORS = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];

export function TopicsChart({ summary }: TopicsChartProps) {
  // Priority distribution for bar chart
  const priorityCounts = {
    high: summary.action_items.filter((a) => a.priority === "high").length,
    medium: summary.action_items.filter((a) => a.priority === "medium").length,
    low: summary.action_items.filter((a) => a.priority === "low").length,
  };

  const priorityData = [
    { name: "High", value: priorityCounts.high, color: "#ef4444" },
    { name: "Medium", value: priorityCounts.medium, color: "#eab308" },
    { name: "Low", value: priorityCounts.low, color: "#22c55e" },
  ].filter((d) => d.value > 0);

  // Topics for radar (word length as proxy for complexity)
  const radarData = summary.topics.slice(0, 6).map((t) => ({
    topic: t.name.length > 12 ? t.name.slice(0, 12) + "…" : t.name,
    depth: Math.min(100, t.summary.split(" ").length * 3),
  }));

  const hasActionItems = summary.action_items.length > 0;
  const hasTopics = summary.topics.length > 2;

  if (!hasActionItems && !hasTopics) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-white">Visual Insights</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Action Items Priority Chart */}
        {hasActionItems && (
          <div className="rounded-xl border border-white/10 bg-white/3 p-5">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-4">
              Action Item Priority
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={priorityData} barCategoryGap="35%">
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "#111111",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "12px",
                  }}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Topic Coverage Radar */}
        {hasTopics && (
          <div className="rounded-xl border border-white/10 bg-white/3 p-5">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-4">
              Topic Coverage
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis
                  dataKey="topic"
                  tick={{ fill: "#71717a", fontSize: 10 }}
                />
                <Radar
                  name="Depth"
                  dataKey="depth"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.2}
                  strokeWidth={1.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Topics Pie */}
        {summary.topics.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/3 p-5 md:col-span-2">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-4">
              Discussion Breakdown
            </p>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={summary.topics.slice(0, 5).map((t, i) => ({
                      name: t.name,
                      value: t.summary.split(" ").length,
                    }))}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    strokeWidth={0}
                  >
                    {summary.topics.slice(0, 5).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {summary.topics.slice(0, 5).map((t, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-xs text-text-secondary truncate">{t.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
