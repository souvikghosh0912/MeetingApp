import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PagesHome } from "@/components/pages/PagesHome";

export const metadata: Metadata = { title: "Pages" };

export default async function PagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pages } = await supabase
    .from("pages")
    .select("id, title, icon, cover, parent_id, position, created_at, updated_at")
    .eq("user_id", user.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  return <PagesHome initialPages={pages ?? []} />;
}
