import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FlashcardViewer } from "@/components/study/FlashcardViewer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Layers } from "lucide-react";
import Link from "next/link";
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
  return {
    title: `Flashcards: ${data?.title ?? "Study Page"} — Mnemis`,
  };
}

export default async function FlashcardsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: studyPage, error } = await supabase
    .from("study_pages")
    .select("id, title")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !studyPage) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 flex flex-col h-full min-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full shrink-0 text-white/50 hover:text-white">
            <Link href={`/study/${studyPage.id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Layers className="h-6 w-6 text-violet-400" />
              Spaced Repetition
            </h1>
            <p className="text-sm text-text-muted mt-1">{studyPage.title}</p>
          </div>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 flex flex-col items-center justify-center pt-8">
        <FlashcardViewer studyPageId={studyPage.id} />
      </div>
    </div>
  );
}
