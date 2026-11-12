import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrCreateTeam } from "@/lib/team";
import { prisma } from "@/lib/prisma";
import { ensureCompanyFilesTables } from "@/lib/company-files-setup";
import { deleteFileFromDrive, getValidAccessToken } from "@/lib/google-drive";

// GET /api/company-files?companyId=xxx
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId    = (session.user as { id: string }).id;
  const teamId    = await getOrCreateTeam(userId);
  await ensureCompanyFilesTables();

  const companyId = req.nextUrl.searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  const files = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `SELECT * FROM csi_company_files
     WHERE "teamId" = $1 AND "companyId" = $2
     ORDER BY category, "docType", "createdAt" DESC`,
    teamId, companyId
  );
  return NextResponse.json({ files });
}

// DELETE /api/company-files?id=xxx
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const teamId = await getOrCreateTeam(userId);
  const id     = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Get file record to find Drive file ID
  const rows = await prisma.$queryRawUnsafe<Array<{ driveFileId: string | null }>>(
    `SELECT "driveFileId" FROM csi_company_files WHERE id = $1 AND "teamId" = $2`,
    id, teamId
  );
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete from Drive
  const driveFileId = rows[0].driveFileId;
  if (driveFileId) {
    const accessToken = await getValidAccessToken(teamId);
    if (accessToken) {
      await deleteFileFromDrive(accessToken, driveFileId).catch(() => {});
    }
  }

  await prisma.$executeRawUnsafe(
    `DELETE FROM csi_company_files WHERE id = $1 AND "teamId" = $2`,
    id, teamId
  );
  return NextResponse.json({ ok: true });
}
