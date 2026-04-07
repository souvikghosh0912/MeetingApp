import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PageEditor } from "@/components/pages/PageEditor";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  const supabase = await createClient();
  const { data: page } = await supabase
    .from("pages")
    .select("title, icon")
    .eq("id", params.id)
    .single();
  return { title: page ? `${page.icon} ${page.title} — Nexus` : "Page — Nexus" };
}

// Recursively build breadcrumb trail
async function getBreadcrumbs(
  supabase: Awaited<ReturnType<typeof createClient>>,
  pageId: string,
  userId: string
): Promise<Array<{ id: string; title: string; icon: string }>> {
  const { data: page } = await supabase
    .from("pages")
    .select("id, title, icon, parent_id")
    .eq("id", pageId)
    .eq("user_id", userId)
    .single();

  if (!page || !page.parent_id) return [];

  const parentCrumbs = await getBreadcrumbs(supabase, page.parent_id, userId);
  const { data: parent } = await supabase
    .from("pages")
    .select("id, title, icon")
    .eq("id", page.parent_id)
    .single();

  if (!parent) return parentCrumbs;
  return [...parentCrumbs, { id: parent.id, title: parent.title, icon: parent.icon }];
}

export default async function PageDetailPage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!page) notFound();

  // Build breadcrumbs (max 3 deep to keep perf reasonable)
  const breadcrumbs = await getBreadcrumbs(supabase, params.id, user.id);

  return (
    <PageEditor
      initialPage={{
        ...page,
        cover: page.cover ?? null,
        parent_id: page.parent_id ?? null,
      }}
      breadcrumbs={breadcrumbs}
    />
  );
}
