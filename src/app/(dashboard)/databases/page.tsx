import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DatabasesHome } from "@/components/databases/DatabasesHome";
import { UserDatabase } from "@/types/database";

export const metadata = { title: "Databases — Mnemis" };

export default async function DatabasesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: dbs } = await supabase
    .from("user_databases")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Attach record counts server-side
  const databases: UserDatabase[] = await Promise.all(
    (dbs ?? []).map(async (db) => {
      const { count } = await supabase
        .from("db_records")
        .select("id", { count: "exact", head: true })
        .eq("database_id", db.id);
      return { ...db, record_count: count ?? 0 };
    })
  );

  return <DatabasesHome initialDatabases={databases} />;
}
