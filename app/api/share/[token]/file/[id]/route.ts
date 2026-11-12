import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken, downloadFileFromDrive } from "@/lib/google-drive";

// GET /api/share/[token]/file/[id] — public file proxy, no auth required
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string; id: string }> }
) {
  const { token, id } = await params;

  // Validate share link
  const links = await prisma.$queryRawUnsafe<Array<{
    companyId: string; teamId: string; expiresAt: Date | null;
  }>>(
    `SELECT "companyId", "teamId", "expiresAt" FROM csi_share_links WHERE token = $1`,
    token
  );

  if (!links.length) return NextResponse.json({ error: "Link not found" }, { status: 404 });
  const link = links[0];

  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return NextResponse.json({ error: "This link has expired" }, { status: 410 });
  }

  // Get file — must belong to same team + company
  const rows = await prisma.$queryRawUnsafe<Array<{
    driveFileId: string | null; fileName: string; mimeType: string | null;
    companyId: string; teamId: string;
  }>>(
    `SELECT "driveFileId", "fileName", "mimeType", "companyId", "teamId"
     FROM csi_company_files WHERE id = $1`,
    id
  );

  if (!rows.length || rows[0].teamId !== link.teamId || rows[0].companyId !== link.companyId) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const file = rows[0];
  if (!file.driveFileId) return NextResponse.json({ error: "No Drive file" }, { status: 404 });

  const accessToken = await getValidAccessToken(link.teamId);
  if (!accessToken) return NextResponse.json({ error: "Drive not available" }, { status: 503 });

  const driveRes = await downloadFileFromDrive(accessToken, file.driveFileId);
  if (!driveRes.ok) return NextResponse.json({ error: "Failed to fetch file" }, { status: 502 });

  const contentType = file.mimeType || "application/octet-stream";
  return new NextResponse(driveRes.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.fileName)}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
