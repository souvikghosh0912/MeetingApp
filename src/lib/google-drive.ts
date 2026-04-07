/**
 * Real Google Drive API helpers.
 * All functions require a valid OAuth access token via getValidGoogleToken().
 */

export async function driveCreateDocument(
  accessToken: string,
  name: string,
  content: string,
  folderId?: string
): Promise<{ fileId: string; name: string; webViewLink: string }> {
  // 1. Create the Google Doc file via Drive API
  const metadata: Record<string, unknown> = {
    name,
    mimeType: "application/vnd.google-apps.document",
  };
  if (folderId) metadata.parents = [folderId];

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  form.append("media", new Blob([content], { type: "text/plain" }));

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Drive create doc failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return { fileId: data.id, name: data.name, webViewLink: data.webViewLink };
}

export async function driveUploadFile(
  accessToken: string,
  name: string,
  content: string,
  mimeType: string = "text/plain",
  folderId?: string
): Promise<{ fileId: string; name: string; webViewLink: string }> {
  const metadata: Record<string, unknown> = { name, mimeType };
  if (folderId) metadata.parents = [folderId];

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  form.append("media", new Blob([content], { type: mimeType }));

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Drive upload failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return { fileId: data.id, name: data.name, webViewLink: data.webViewLink };
}

export async function driveListFiles(
  accessToken: string,
  folderId?: string
): Promise<{ id: string; name: string; mimeType: string; modifiedTime: string }[]> {
  const query = folderId
    ? `'${folderId}' in parents and trashed = false`
    : "trashed = false";

  const params = new URLSearchParams({
    q: query,
    fields: "files(id,name,mimeType,modifiedTime)",
    orderBy: "modifiedTime desc",
    pageSize: "20",
  });

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Drive list failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.files ?? [];
}
