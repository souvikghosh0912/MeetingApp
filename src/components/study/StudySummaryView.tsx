"use client";

import { StudyPageSummary, StudyActionItem, StudyDefinition } from "@/types";
import { Brain, Clock, Lightbulb, ListChecks, Tag, ArrowUp, ArrowRight, ArrowDown, BookOpen, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudySummaryViewProps {
  summary: StudyPageSummary;
}

const DIFFICULTY_CONFIG = {
  beginner: {
    label: "Beginner",
    className: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    dot: "bg-emerald-400",
  },
  intermediate: {
    label: "Intermediate",
    className: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    dot: "bg-amber-400",
  },
  advanced: {
    label: "Advanced",
    className: "bg-red-400/10 text-red-400 border-red-400/20",
    dot: "bg-red-400",
  },
} as const;

const PRIORITY_CONFIG: Record<string, { icon: React.ElementType; label: string; className: string }> = {
  high: { icon: ArrowUp, label: "High", className: "text-red-400" },
  medium: { icon: ArrowRight, label: "Medium", className: "text-amber-400" },
  low: { icon: ArrowDown, label: "Low", className: "text-emerald-400" },
};

function PriorityBadge({ priority }: { priority: string }) {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.medium;
  const Icon = config.icon;
  return (
    <span className={cn("flex items-center gap-1 text-[10px] font-semibold flex-shrink-0", config.className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function Section({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[12px] border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4 text-white/40" strokeWidth={1.8} />
        <h2 className="text-[12px] font-bold text-white/50 uppercase tracking-widest">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function StudySummaryView({ summary }: StudySummaryViewProps) {
  const difficultyConfig = DIFFICULTY_CONFIG[summary.difficulty] ?? DIFFICULTY_CONFIG.intermediate;

  return (
    <div className="space-y-4">
      {/* Meta badges row */}
      <div className="flex flex-wrap items-center gap-3">
        <span className={cn(
          "inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border",
          difficultyConfig.className
        )}>
          <span className={cn("h-1.5 w-1.5 rounded-full", difficultyConfig.dot)} />
          <Brain className="h-3 w-3" />
          {difficultyConfig.label}
        </span>

        {summary.estimated_read_minutes != null && (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-white/50 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02]">
            <Clock className="h-3 w-3 text-white/35" />
            {summary.estimated_read_minutes} min to study
          </span>
        )}

        {summary.topics?.map((topic) => (
          <span key={topic} className="inline-flex items-center gap-1 text-[10px] text-blue-400 px-2.5 py-1 rounded-full border border-blue-400/20 bg-blue-400/[0.06]">
            <Tag className="h-2.5 w-2.5" />
            {topic}
          </span>
        ))}
      </div>

      {/* Summary prose */}
      <Section title="Summary" icon={Lightbulb}>
        <p className="text-[13px] text-white/65 leading-relaxed whitespace-pre-line">
          {summary.summary}
        </p>
      </Section>

      {/* Key concepts */}
      {summary.key_concepts?.length > 0 && (
        <Section title={`Key Concepts (${summary.key_concepts.length})`} icon={Brain}>
          <div className="flex flex-wrap gap-2">
            {summary.key_concepts.map((concept, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-lg border border-violet-500/25 bg-violet-500/[0.08] text-[12px] font-medium text-violet-300"
              >
                {concept}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Action items / study tasks */}
      {summary.action_items?.length > 0 && (
        <Section title={`Study Tasks (${summary.action_items.length})`} icon={ListChecks}>
          <div className="space-y-2">
            {summary.action_items
              .slice()
              .sort((a: StudyActionItem, b: StudyActionItem) => {
                const order = { high: 0, medium: 1, low: 2 };
                return (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
              })
              .map((item: StudyActionItem, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-[10px] bg-white/[0.025] border border-white/[0.05] hover:border-white/[0.09] transition-colors"
                >
                  <div className="h-5 w-5 rounded-md border border-white/[0.12] bg-white/[0.04] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-white/30" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white/75 leading-snug">{item.task}</p>
                    {item.page_reference && (
                      <p className="text-[11px] text-white/30 mt-0.5">📄 {item.page_reference}</p>
                    )}
                  </div>
                  <PriorityBadge priority={item.priority} />
                </div>
              ))}
          </div>
        </Section>
      )}

      {/* Definitions */}
      {summary.definitions && summary.definitions.length > 0 && (
        <Section title={`Definitions (${summary.definitions.length})`} icon={BookOpen}>
          <div className="space-y-2">
            {summary.definitions.map((def: StudyDefinition, i: number) => (
              <div
                key={i}
                className="flex gap-3 p-3 rounded-[10px] bg-white/[0.025] border border-white/[0.05] hover:border-white/[0.09] transition-colors"
              >
                <span className="mt-0.5 flex-shrink-0 text-[10px] font-bold text-emerald-400 uppercase tracking-wider w-2 leading-none">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-emerald-300 leading-snug">{def.term}</p>
                  <p className="text-[12px] text-white/55 leading-relaxed mt-0.5">{def.meaning}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Facts */}
      {summary.facts && summary.facts.length > 0 && (
        <Section title={`Facts (${summary.facts.length})`} icon={Zap}>
          <ol className="space-y-2">
            {summary.facts.map((fact: string, i: number) => (
              <li
                key={i}
                className="flex items-start gap-3 p-3 rounded-[10px] bg-white/[0.025] border border-white/[0.05] hover:border-white/[0.09] transition-colors"
              >
                <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/10 border border-amber-400/20 text-[9px] font-bold text-amber-400 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-[13px] text-white/65 leading-relaxed">{fact}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}
    </div>
  );
}
