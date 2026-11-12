import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrCreateTeam } from "@/lib/team";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken, downloadFileFromDrive } from "@/lib/google-drive";

// GET /api/company-files/view/[id]
// Proxies the file from Drive so the Drive URL is never exposed to the client
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id: string }).id;
  const teamId = await getOrCreateTeam(userId);

  const rows = await prisma.$queryRawUnsafe<Array<{
    driveFileId: string | null;
    fileName: string;
    mimeType: string | null;
    teamId: string;
  }>>(
    `SELECT "driveFileId", "fileName", "mimeType", "teamId" FROM csi_company_files WHERE id = $1`,
    id
  );

  if (!rows.length || rows[0].teamId !== teamId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const file = rows[0];
  if (!file.driveFileId) {
    return NextResponse.json({ error: "No Drive file" }, { status: 404 });
  }

  const accessToken = await getValidAccessToken(teamId);
  if (!accessToken) {
    return NextResponse.json({ error: "Drive not connected" }, { status: 400 });
  }

  const driveRes = await downloadFileFromDrive(accessToken, file.driveFileId);
  if (!driveRes.ok) {
    return NextResponse.json({ error: "Failed to fetch file from Drive" }, { status: 502 });
  }

  const contentType = file.mimeType || "application/octet-stream";
  const headers = new Headers({
    "Content-Type": contentType,
    "Content-Disposition": `inline; filename="${encodeURIComponent(file.fileName)}"`,
    "Cache-Control": "private, max-age=300",
  });

  return new NextResponse(driveRes.body, { status: 200, headers });
}
