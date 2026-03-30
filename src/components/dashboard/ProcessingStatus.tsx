"use client";

import { CheckCircle2, Loader2, Upload, FileText, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { UploadState } from "@/types";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    key: "uploading",
    label: "Uploading file",
    description: "Securely uploading your meeting file",
    icon: Upload,
    doneAt: 35,
  },
  {
    key: "transcribing",
    label: "Transcribing",
    description: "Whisper v3 is converting speech to text",
    icon: FileText,
    doneAt: 65,
  },
  {
    key: "summarizing",
    label: "Summarizing",
    description: "LLaMA 3.3 is generating your insights",
    icon: Sparkles,
    doneAt: 100,
  },
];

function getStepStatus(stepKey: string, currentStatus: string, progress: number) {
  const currentIdx = STEPS.findIndex((s) => s.key === currentStatus);
  const stepIdx = STEPS.findIndex((s) => s.key === stepKey);

  if (progress === 100 || currentStatus === "done") return "done";
  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "active";
  return "pending";
}

interface ProcessingStatusProps {
  state: UploadState;
  fileName: string;
}

export function ProcessingStatus({ state, fileName }: ProcessingStatusProps) {
  const isDone = state.status === "done" || state.progress === 100;

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-8 w-full">
      {/* Animated icon */}
      <div className="relative">
        <div className={cn(
          "h-20 w-20 rounded-full flex items-center justify-center transition-all duration-500",
          isDone ? "bg-green-500/20 border border-green-500/30" : "bg-accent/15 border border-accent/30"
        )}>
          {isDone ? (
            <CheckCircle2 className="h-10 w-10 text-green-400" />
          ) : (
            <Loader2 className="h-10 w-10 text-accent animate-spin" />
          )}
        </div>
        {!isDone && (
          <div className="absolute inset-0 rounded-full border border-accent/20 animate-ping" />
        )}
      </div>

      {/* Title */}
      <div className="text-center">
        <p className="text-lg font-semibold text-white mb-1">
          {isDone ? "Processing complete!" : "Analyzing your meeting..."}
        </p>
        <p className="text-sm text-text-secondary truncate max-w-xs">{fileName}</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm space-y-2">
        <Progress value={state.progress} className="h-1.5" />
        <p className="text-center text-xs text-text-muted">{state.progress}%</p>
      </div>

      {/* Steps */}
      <div className="w-full max-w-sm space-y-3">
        {STEPS.map((step) => {
          const status = isDone ? "done" : getStepStatus(step.key, state.status, state.progress);
          const Icon = step.icon;

          return (
            <div
              key={step.key}
              className={cn(
                "relative overflow-hidden flex items-center gap-3 rounded-xl px-4 py-3 border transition-all duration-300",
                status === "active" && "border-accent/30 bg-accent/5",
                status === "done" && "border-green-500/20 bg-green-500/5",
                status === "pending" && "border-white/5 bg-white/3 opacity-50"
              )}
            >
              {status === "active" && (
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:200%_100%] animate-shimmer" />
              )}
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0",
                status === "active" && "bg-accent/20",
                status === "done" && "bg-green-500/20",
                status === "pending" && "bg-white/5"
              )}>
                {status === "done" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                ) : status === "active" ? (
                  <Loader2 className="h-4 w-4 text-accent animate-spin" />
                ) : (
                  <Icon className="h-4 w-4 text-text-muted" />
                )}
              </div>
              <div>
                <p className={cn(
                  "text-sm font-medium",
                  status === "pending" ? "text-text-muted" : "text-white"
                )}>
                  {step.label}
                </p>
                {status === "active" && (
                  <p className="text-xs text-text-secondary">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isDone && (
        <p className="text-sm text-text-secondary animate-fade-in">
          Redirecting to your transcript...
        </p>
      )}
    </div>
  );
}
