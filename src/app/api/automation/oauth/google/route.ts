import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleOAuthUrl } from "@/lib/google-oauth";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      {
        error:
          "Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment.",
      },
      { status: 500 }
    );
  }

  // Encode user ID in state so we can retrieve it after redirect
  const state = Buffer.from(JSON.stringify({ userId: user.id })).toString("base64url");
  const url = getGoogleOAuthUrl(state);

  return NextResponse.redirect(url);
}
