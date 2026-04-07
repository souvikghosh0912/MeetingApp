/**
 * Real Gmail API helper.
 * Sends email via Gmail REST API using the user's OAuth access token.
 */

function encodeBase64Url(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildRawEmail({
  to,
  subject,
  body,
  isHtml,
}: {
  to: string;
  subject: string;
  body: string;
  isHtml: boolean;
}): string {
  const contentType = isHtml ? "text/html" : "text/plain";
  const raw = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: ${contentType}; charset=UTF-8`,
    "",
    body,
  ].join("\r\n");

  return encodeBase64Url(raw);
}

export async function gmailSendEmail(
  accessToken: string,
  {
    to,
    subject,
    body,
    isHtml = false,
  }: {
    to: string;
    subject: string;
    body: string;
    isHtml?: boolean;
  }
): Promise<{ messageId: string; threadId: string; labelIds: string[] }> {
  const raw = buildRawEmail({ to, subject, body, isHtml });

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail send failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return {
    messageId: data.id,
    threadId: data.threadId,
    labelIds: data.labelIds ?? [],
  };
}
