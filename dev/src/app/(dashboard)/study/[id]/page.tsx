import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudyPage } from "@/types";
import { StudyWorkspace } from "@/components/study/StudyWorkspace";
import { BookOpen, Calendar, Bot, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MODEL_NAMES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
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
    title: data?.title ?? "Study Page — Nexus",
  };
}

export default async function StudyDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: studyPage, error } = await supabase
    .from("study_pages")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !studyPage) {
    notFound();
  }

  const page = studyPage as StudyPage;

  let imageUrl: string | undefined;
  if (page.source_image_path) {
    const { data: signedData } = await supabase.storage
      .from("study-images")
      .createSignedUrl(page.source_image_path, 3600);
    if (signedData?.signedUrl) {
      imageUrl = signedData.signedUrl;
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">{page.title}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <Calendar className="h-3 w-3" />
              {formatDate(page.created_at)}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <BookOpen className="h-3 w-3" />
              OCR Text
            </span>
            <Badge variant="secondary">{MODEL_NAMES[page.model_used as keyof typeof MODEL_NAMES] ?? page.model_used}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            asChild
            variant="outline"
            className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
          >
            <Link href={`/study/${page.id}/flashcards`}>
              <Layers className="w-4 h-4 mr-2" />
              Flashcards
            </Link>
          </Button>
          <Button
            asChild
            className="bg-violet-600 hover:bg-violet-500 text-white shadow-glow"
          >
            <Link href={`/study/${page.id}/chat`}>
              <Bot className="w-4 h-4 mr-2" />
              Ask Questions
            </Link>
          </Button>
        </div>
      </div>

      <StudyWorkspace 
        studyPageId={page.id}
        summary={page.summary}
        extractedText={page.extracted_text}
        imageUrl={imageUrl}
      />
    </div>
  );
}
