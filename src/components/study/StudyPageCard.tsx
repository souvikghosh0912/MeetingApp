"use client";

import Link from "next/link";
import { StudyPage } from "@/types";
import { BookOpen, Brain, Clock, ListChecks, Trash2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";

const DIFFICULTY_STYLES = {
  beginner: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  intermediate: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  advanced: "bg-red-400/10 text-red-400 border-red-400/20",
} as const;

const MODEL_LABELS: Record<string, string> = {
  "llama-8b": "LLaMA 8B",
  "gpt-oss-20b": "GPT-OSS 20B",
  "gpt-oss-120b": "GPT-OSS 120B",
};

interface StudyPageCardProps {
  studyPage: StudyPage;
  onDeleted?: () => void;
}

export function StudyPageCard({ studyPage, onDeleted }: StudyPageCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const summary = studyPage.summary;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${studyPage.title}"?`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/study/${studyPage.id}`, { method: "DELETE" });
      onDeleted?.();
      router.refresh();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <Link
      href={`/study/${studyPage.id}`}
      className={cn(
        "group relative flex flex-col rounded-[14px] border border-white/[0.06] bg-white/[0.02]",
        "hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-200 overflow-hidden"
      )}
    >
      {/* Top accent bar */}
      <div className="h-[2px] w-full bg-gradient-to-r from-violet-500/60 via-blue-500/60 to-transparent" />

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-[10px] bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <BookOpen className="h-4 w-4 text-violet-400" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-semibold text-white/90 truncate leading-snug">
              {studyPage.title}
            </h3>
            <p className="text-[11px] text-white/35 mt-0.5">
              {new Date(studyPage.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              {" · "}
              {MODEL_LABELS[studyPage.model_used] ?? studyPage.model_used}
            </p>
          </div>

          {/* Delete button */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="opacity-0 group-hover:opacity-100 h-6 w-6 rounded-md flex items-center justify-center text-white/25 hover:text-red-400 hover:bg-red-400/[0.08] transition-all flex-shrink-0"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Summary excerpt */}
        {summary?.summary && (
          <p className="text-[12px] text-white/45 line-clamp-2 leading-relaxed">
            {summary.summary}
          </p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-auto pt-2 border-t border-white/[0.05]">
          {summary?.difficulty && (
            <span className={cn(
              "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize",
              DIFFICULTY_STYLES[summary.difficulty]
            )}>
              <Brain className="h-2.5 w-2.5" />
              {summary.difficulty}
            </span>
          )}

          {summary?.estimated_read_minutes != null && (
            <span className="flex items-center gap-1 text-[11px] text-white/35">
              <Clock className="h-3 w-3 text-white/25" />
              {summary.estimated_read_minutes} min
            </span>
          )}

          {summary?.key_concepts?.length != null && (
            <span className="flex items-center gap-1 text-[11px] text-white/35">
              <BookOpen className="h-3 w-3 text-white/25" />
              {summary.key_concepts.length} concepts
            </span>
          )}

          {summary?.action_items?.length != null && (
            <span className="flex items-center gap-1 text-[11px] text-white/35">
              <ListChecks className="h-3 w-3 text-white/25" />
              {summary.action_items.length} tasks
            </span>
          )}

          <ChevronRight className="h-3.5 w-3.5 text-white/20 ml-auto transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
