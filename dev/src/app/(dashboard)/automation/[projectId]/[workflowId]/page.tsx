"use client";

import { useEffect, useState } from "react";
import { getWorkflow, seedDemoDataIfEmpty } from "@/lib/automation-storage";
import { AutomationWorkflow } from "@/types/automation";
import { WorkflowBuilder } from "@/components/automation/WorkflowBuilder";
import { Loader2 } from "lucide-react";

interface Props {
  params: { projectId: string; workflowId: string };
}

export default function WorkflowEditorPage({ params }: Props) {
  const [workflow, setWorkflow] = useState<AutomationWorkflow | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    seedDemoDataIfEmpty();
    const wf = getWorkflow(params.workflowId);
    if (wf) {
      setWorkflow(wf);
    } else {
      setNotFound(true);
    }
  }, [params.workflowId]);

  if (notFound) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[15px] font-semibold text-white mb-2">Workflow not found</p>
          <p className="text-[12px] text-white/40">The workflow may have been deleted.</p>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-white/30 animate-spin" />
      </div>
    );
  }

  return <WorkflowBuilder workflow={workflow} />;
}
