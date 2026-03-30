import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Profile } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const safeProfile: Profile = profile ?? {
    id: user.id,
    display_name: user.user_metadata?.full_name ?? user.email ?? "User",
    avatar_url: user.user_metadata?.avatar_url ?? null,
    plan: "free",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar profile={safeProfile} />
      <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
        <Topbar profile={safeProfile} />
        <main className="flex-1 px-8 py-8 max-w-[1400px] w-full">{children}</main>
      </div>
    </div>
  );
}
