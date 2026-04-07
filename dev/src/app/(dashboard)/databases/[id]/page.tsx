import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { DatabaseView } from "@/components/databases/DatabaseView";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  const supabase = await createClient();
  const { data: db } = await supabase
    .from("user_databases")
    .select("name, icon")
    .eq("id", params.id)
    .single();
  return { title: db ? `${db.icon} ${db.name} — Nexus` : "Database — Nexus" };
}

export default async function DatabasePage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: database },
    { data: properties },
    { data: records },
    { data: views },
  ] = await Promise.all([
    supabase.from("user_databases").select("*").eq("id", params.id).eq("user_id", user.id).single(),
    supabase.from("db_properties").select("*").eq("database_id", params.id).order("position"),
    supabase.from("db_records").select("*").eq("database_id", params.id).order("position"),
    supabase.from("db_views").select("*").eq("database_id", params.id).order("created_at"),
  ]);

  if (!database) notFound();

  return (
    <DatabaseView
      initialDatabase={database}
      initialProperties={properties ?? []}
      initialRecords={records ?? []}
      initialViews={views ?? []}
    />
  );
}
