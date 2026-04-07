import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InteractiveWorkflowEditor } from "@/components/visualization/InteractiveWorkflowEditor";
import { Transcript } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkflowEditorPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) notFound();

  const { data: transcript } = await supabase
    .from("transcripts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!transcript || !transcript.summary?.workflow) {
    return (
      <div className="flex h-[calc(100vh-80px)] w-full items-center justify-center">
        <div className="text-center rounded-2xl border border-white/10 bg-white/5 p-8 max-w-md">
          <h2 className="text-xl font-bold text-white mb-2">No Workflow Found</h2>
          <p className="text-sm text-text-secondary mb-6">
            Please generate the timeline workflow from the main transcript page before attempting to edit it.
          </p>
          <Button asChild>
            <Link href={`/transcripts/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const t = transcript as Transcript;

  return (
    <div className="w-full h-full">
      <InteractiveWorkflowEditor transcriptId={t.id} initialData={t.summary!.workflow!} />
    </div>
  );
}
