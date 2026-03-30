"use client";

import { useState } from "react";
import { WorkflowViewer } from "./WorkflowViewer";
import { Button } from "@/components/ui/button";
import { Network, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Summary } from "@/types";
import Link from "next/link";

interface WorkflowSectionProps {
  transcriptId: string;
  summary: Summary;
}

export function WorkflowSection({ transcriptId, summary }: WorkflowSectionProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  // If we already have a workflow, just render it!
  if (summary.workflow) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
            Timeline Workflow
          </h2>
          <Button asChild variant="outline" size="sm" className="h-8 text-xs bg-white/5 border-white/10 hover:bg-white/10 hover:text-white">
            <Link href={`/transcripts/${transcriptId}/workflow`}>
              Open Interactive Editor
            </Link>
          </Button>
        </div>
        <WorkflowViewer data={summary.workflow} />
      </div>
    );
  }

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const res = await fetch("/api/visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcriptId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate workflow");
      }

      toast.success("Workflow generated successfully!");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
        Timeline Workflow
      </h2>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col items-center justify-center text-center">
        {isGenerating && (
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/5 to-transparent bg-[length:200%_100%] animate-shimmer" />
        )}
        <div className="h-16 w-16 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center mb-5">
          <Network className="h-8 w-8 text-accent" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Generate AI Workflow</h3>
        <p className="text-sm text-text-secondary max-w-md mx-auto mb-6">
          See exactly how this meeting unfolded chronologically. We&apos;ll use LLaMA 3.3 70B to extract a connected node-graph of all topics, actions, and decisions.
        </p>
        <Button onClick={handleGenerate} disabled={isGenerating} size="lg" className="px-8">
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Building Workflow...
            </>
          ) : (
            "Generate Visualization"
          )}
        </Button>
      </div>
    </div>
  );
}
