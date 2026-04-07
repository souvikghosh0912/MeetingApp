import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudyChatInterface } from "@/components/chat/StudyChatInterface";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("study_pages")
    .select("title")
    .eq("id", id)
    .single();
  return { title: data?.title ? `Chat: ${data.title}` : "Study Chat" };
}

export default async function StudyChatPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) notFound();

  const { data: studyPage } = await supabase
    .from("study_pages")
    .select("id, title")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!studyPage) {
    notFound();
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] md:h-[calc(100vh-4rem)]">
      <StudyChatInterface studyPageId={studyPage.id} studyPageTitle={studyPage.title} />
    </div>
  );
}
