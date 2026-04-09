import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/home";
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Use the service role client to upsert the profile so this always
      // succeeds regardless of RLS policies. The DB trigger handles the
      // INSERT on first signup, but this is a guaranteed fallback — critical
      // for new users where the trigger may not have fired yet.
      const serviceClient = await createServiceClient();
      await serviceClient.from("profiles").upsert(
        {
          id: data.user.id,
          display_name:
            data.user.user_metadata?.full_name ??
            data.user.email ??
            "User",
          avatar_url: data.user.user_metadata?.avatar_url ?? null,
          plan: "free",
        },
        { onConflict: "id", ignoreDuplicates: true }
      );

      return NextResponse.redirect(`${origin}${next}`);
    }

    const reason = error?.message ?? "auth_callback_failed";
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(reason)}`
    );
  }

  return NextResponse.redirect(`${origin}/login?error=missing_code`);
}
