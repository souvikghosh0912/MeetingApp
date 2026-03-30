import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatInterface } from "@/components/chat/ChatInterface";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TranscriptChatPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) notFound();

  const { data: transcript } = await supabase
    .from("transcripts")
    .select("id, title")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!transcript) {
    notFound();
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] md:h-[calc(100vh-4rem)]">
      <ChatInterface transcriptId={transcript.id} transcriptTitle={transcript.title} />
    </div>
  );
}
