"use client";

import {
  CheckCircle2,
  AlertCircle,
  Minus,
  TrendingUp,
  MessageSquare,
  Lightbulb,
  CheckSquare,
} from "lucide-react";
import { Summary, Sentiment } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SENTIMENT_CONFIG: Record<Sentiment, { label: string; variant: "success" | "secondary" | "destructive" | "warning"; icon: typeof CheckCircle2 }> = {
  positive: { label: "Positive", variant: "success", icon: TrendingUp },
  neutral: { label: "Neutral", variant: "secondary", icon: Minus },
  negative: { label: "Negative", variant: "destructive", icon: AlertCircle },
  mixed: { label: "Mixed", variant: "warning", icon: Minus },
};

const PRIORITY_COLORS = {
  high: "text-red-400 bg-red-500/10 border-red-500/20",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  low: "text-green-400 bg-green-500/10 border-green-500/20",
};

interface SummaryPanelProps {
  summary: Summary;
}

export function SummaryPanel({ summary }: SummaryPanelProps) {
  const sentiment = SENTIMENT_CONFIG[summary.sentiment] ?? SENTIMENT_CONFIG.neutral;
  const SentimentIcon = sentiment.icon;

  return (
    <div className="space-y-5">
      {/* TL;DR */}
      <div className="rounded-xl border border-white/10 bg-white/3 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-4 w-4 text-yellow-400" />
          <h3 className="text-sm font-semibold text-white">TL;DR</h3>
        </div>
        <ul className="space-y-2.5">
          {summary.tldr.map((point, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
              <span className="text-sm text-text-secondary leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Sentiment */}
      <div className="rounded-xl border border-white/10 bg-white/3 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <SentimentIcon className="h-4 w-4 text-text-secondary" />
            <h3 className="text-sm font-semibold text-white">Meeting Tone</h3>
          </div>
          <Badge variant={sentiment.variant}>{sentiment.label}</Badge>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          {summary.sentiment_explanation}
        </p>
      </div>

      {/* Key Topics */}
      {summary.topics.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/3 p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Key Topics</h3>
          </div>
          <div className="space-y-3">
            {summary.topics.map((topic, i) => (
              <div key={i} className="border-l-2 border-accent/40 pl-3">
                <p className="text-sm font-medium text-white mb-0.5">{topic.name}</p>
                <p className="text-xs text-text-secondary leading-relaxed">{topic.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Items */}
      {summary.action_items.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/3 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare className="h-4 w-4 text-green-400" />
            <h3 className="text-sm font-semibold text-white">Action Items</h3>
            <span className="ml-auto text-xs text-text-muted">{summary.action_items.length} tasks</span>
          </div>
          <div className="space-y-2.5">
            {summary.action_items.map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/3 px-3 py-2.5">
                <CheckCircle2 className="h-4 w-4 text-text-muted mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white leading-snug">{item.task}</p>
                  {item.owner && (
                    <p className="text-xs text-text-muted mt-0.5">→ {item.owner}</p>
                  )}
                </div>
                <span className={cn(
                  "flex-shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
                  PRIORITY_COLORS[item.priority]
                )}>
                  {item.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decisions */}
      {summary.decisions.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/3 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Decisions Made</h3>
          </div>
          <ul className="space-y-2.5">
            {summary.decisions.map((decision, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                <span className="text-sm text-text-secondary leading-relaxed">{decision}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
