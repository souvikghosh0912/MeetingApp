import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, saveGoogleTokens } from "@/lib/google-oauth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/automation?oauth_error=${encodeURIComponent(errorParam)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/automation?oauth_error=missing_params`
    );
  }

  try {
    const { userId } = JSON.parse(Buffer.from(state, "base64url").toString());
    const tokens = await exchangeCodeForTokens(code);
    await saveGoogleTokens(userId, tokens);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/automation?oauth_success=google`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "OAuth failed";
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/automation?oauth_error=${encodeURIComponent(msg)}`
    );
  }
}
