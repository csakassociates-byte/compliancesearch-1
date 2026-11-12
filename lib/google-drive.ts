import { prisma } from "./prisma";
import { getOrCreateTeam } from "./team";

const CLIENT_ID     = process.env.GOOGLE_DRIVE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET!;
const REDIRECT_URI  = `${process.env.NEXTAUTH_URL}/api/drive/callback`;

export function getDriveAuthUrl(teamId: string): string {
  const params = new URLSearchParams({
    client_id:     CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    response_type: "code",
    scope:         "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email",
    access_type:   "offline",
    prompt:        "consent",
    state:         teamId,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri:  REDIRECT_URI,
      grant_type:    "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type:    "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  return res.json();
}

export async function getDriveEmail(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    return data.email ?? null;
  } catch { return null; }
}

export async function getValidAccessToken(teamId: string): Promise<string | null> {
  const rows = await prisma.$queryRawUnsafe<Array<{
    driveAccessToken: string | null;
    driveRefreshToken: string | null;
    driveTokenExpiry: Date | null;
  }>>(
    `SELECT "driveAccessToken", "driveRefreshToken", "driveTokenExpiry" FROM csi_teams WHERE id = $1`,
    teamId
  );
  if (!rows.length) return null;
  const row = rows[0];
  if (!row.driveAccessToken) return null;

  // Token still valid (with 5 min buffer)
  if (row.driveTokenExpiry && row.driveTokenExpiry.getTime() > Date.now() + 5 * 60 * 1000) {
    return row.driveAccessToken;
  }

  // Refresh
  if (!row.driveRefreshToken) return null;
  try {
    const refreshed = await refreshAccessToken(row.driveRefreshToken);
    const expiry = new Date(Date.now() + refreshed.expires_in * 1000);
    await prisma.$executeRawUnsafe(
      `UPDATE csi_teams SET "driveAccessToken" = $1, "driveTokenExpiry" = $2 WHERE id = $3`,
      refreshed.access_token, expiry, teamId
    );
    return refreshed.access_token;
  } catch { return null; }
}

export async function getOrCreateDriveFolder(accessToken: string, folderName: string, parentId?: string): Promise<string> {
  // Check if folder exists
  const q = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false${parentId ? ` and '${parentId}' in parents` : ""}`;
  const listRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const listData = await listRes.json();
  if (listData.files?.length) return listData.files[0].id;

  // Create folder
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      ...(parentId ? { parents: [parentId] } : {}),
    }),
  });
  const folder = await createRes.json();
  return folder.id;
}

export async function uploadFileToDrive(
  accessToken: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId: string
): Promise<{ id: string; webViewLink: string; webContentLink: string }> {
  const metadata = JSON.stringify({ name: fileName, parents: [folderId] });
  const boundary = "foo_bar_baz";
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
    fileBuffer,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const uploadRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  if (!uploadRes.ok) throw new Error(`Drive upload failed: ${await uploadRes.text()}`);
  return uploadRes.json();
}

// Make file viewable by anyone with the link (no Drive login needed)
export async function setFilePublic(accessToken: string, fileId: string): Promise<void> {
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  });
}

// Download file bytes from Drive (for proxy serving)
export async function downloadFileFromDrive(accessToken: string, fileId: string): Promise<Response> {
  return fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function deleteFileFromDrive(accessToken: string, fileId: string): Promise<void> {
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function getDriveStatus(userId: string): Promise<{
  connected: boolean;
  email: string | null;
  folderId: string | null;
}> {
  const teamId = await getOrCreateTeam(userId);
  const rows = await prisma.$queryRawUnsafe<Array<{
    driveAccessToken: string | null;
    driveEmail: string | null;
    driveFolderId: string | null;
  }>>(
    `SELECT "driveAccessToken", "driveEmail", "driveFolderId" FROM csi_teams WHERE id = $1`,
    teamId
  );
  const row = rows[0];
  return {
    connected: !!row?.driveAccessToken,
    email: row?.driveEmail ?? null,
    folderId: row?.driveFolderId ?? null,
  };
}
