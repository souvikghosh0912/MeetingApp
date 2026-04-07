"use client";

import { useState } from "react";
import { FileImage, Files } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelType, Plan } from "@/types";
import { SinglePageUploader } from "@/components/study/SinglePageUploader";
import { BulkUploader } from "@/components/study/BulkUploader";

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadMode = "single" | "bulk";

interface StudyUploaderProps {
  userId: string;
  plan?: Plan;
  defaultModel?: ModelType;
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS: { mode: UploadMode; icon: React.ElementType; label: string; badge?: string }[] = [
  { mode: "single", icon: FileImage, label: "Single Page" },
  { mode: "bulk",   icon: Files,     label: "Bulk Upload", badge: "2–10 pages" },
];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Top-level study upload entry point.
 * Switches between single-page and bulk-upload modes via a tab bar,
 * delegating all logic to the focused sub-components.
 */
export function StudyUploader({
  userId,
  plan = "free",
  defaultModel = "gpt-oss-20b",
}: StudyUploaderProps) {
  const [mode, setMode] = useState<UploadMode>("single");

  return (
    <div className="w-full space-y-4">
      {/* Mode tab bar */}
      <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.02] p-1">
        {TABS.map(({ mode: m, icon: Icon, label, badge }) => {
          const isActive = mode === m;
          return (
            <button
              key={m}
              id={`study-mode-tab-${m}`}
              onClick={() => setMode(m)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-[9px] py-2 text-[13px] font-medium transition-all duration-200",
                isActive
                  ? "bg-white/[0.07] text-white shadow-sm"
                  : "text-white/35 hover:text-white/60"
              )}
            >
              <Icon className="h-3.5 w-3.5 flex-shrink-0" />
              {label}
              {badge && (
                <span
                  className={cn(
                    "text-[10px] font-semibold transition-colors",
                    isActive ? "text-violet-400" : "text-white/25"
                  )}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mode content */}
      {mode === "single" ? (
        <SinglePageUploader userId={userId} plan={plan} defaultModel={defaultModel} />
      ) : (
        <BulkUploader userId={userId} plan={plan} defaultModel={defaultModel} />
      )}
    </div>
  );
}
