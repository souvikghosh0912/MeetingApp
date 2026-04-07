import { createClient } from "@/lib/supabase/server";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/gmail.send",
  "openid",
  "email",
].join(" ");

export function getGoogleOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/automation/oauth/google/callback`,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/automation/oauth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }
  return res.json();
}

export async function refreshGoogleToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token refresh failed: ${err}`);
  }
  return res.json();
}

export async function saveGoogleTokens(
  userId: string,
  tokens: {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
  }
) {
  const supabase = await createClient();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await supabase.from("oauth_tokens").upsert(
    {
      user_id: userId,
      provider: "google",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      expires_at: expiresAt,
      scope: tokens.scope,
    },
    { onConflict: "user_id,provider" }
  );
}

/** Returns a valid (auto-refreshed) Google access token for the given user, or throws if not connected. */
export async function getValidGoogleToken(userId: string): Promise<string> {
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("oauth_tokens")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "google")
    .single();

  if (error || !row) {
    throw new Error(
      "Google account not connected. Please connect at /api/automation/oauth/google"
    );
  }

  // Still valid with a 60s buffer?
  if (row.expires_at && new Date(row.expires_at).getTime() > Date.now() + 60_000) {
    return row.access_token;
  }

  // Refresh
  if (!row.refresh_token) {
    throw new Error("Google refresh token missing. Please reconnect your Google account.");
  }

  const fresh = await refreshGoogleToken(row.refresh_token);

  const expiresAt = new Date(Date.now() + fresh.expires_in * 1000).toISOString();
  await supabase
    .from("oauth_tokens")
    .update({ access_token: fresh.access_token, expires_at: expiresAt })
    .eq("user_id", userId)
    .eq("provider", "google");

  return fresh.access_token;
}
