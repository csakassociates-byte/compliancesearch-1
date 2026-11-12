import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const links = await prisma.$queryRawUnsafe<Array<{
    companyId: string; companyName: string; teamId: string;
    expiresAt: Date | null; label: string | null;
    fileIds: string[] | null; shareMode: string;
  }>>(
    `SELECT "companyId","companyName","teamId","expiresAt",label,"fileIds","shareMode"
     FROM csi_share_links WHERE token = $1`,
    token
  );

  if (!links.length) return NextResponse.json({ error: "Link not found" }, { status: 404 });
  const link = links[0];

  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return NextResponse.json({ error: "This link has expired" }, { status: 410 });
  }

  let files;
  if (link.shareMode === "selected" && link.fileIds?.length) {
    // Only return the specifically selected files
    const placeholders = link.fileIds.map((_, i) => `$${i + 3}`).join(",");
    files = await prisma.$queryRawUnsafe<Array<{
      id: string; category: string; docType: string; customLabel: string | null;
      fileName: string; fileSize: number | null; mimeType: string | null;
      financialYear: string | null; expiryDate: string | null;
      notes: string | null; createdAt: string;
    }>>(
      `SELECT id, category, "docType", "customLabel", "fileName", "fileSize", "mimeType",
              "financialYear", "expiryDate", notes, "createdAt"
       FROM csi_company_files
       WHERE "teamId" = $1 AND "companyId" = $2 AND id IN (${placeholders})
       ORDER BY category, "docType", "createdAt" DESC`,
      link.teamId, link.companyId, ...link.fileIds
    );
  } else {
    files = await prisma.$queryRawUnsafe<Array<{
      id: string; category: string; docType: string; customLabel: string | null;
      fileName: string; fileSize: number | null; mimeType: string | null;
      financialYear: string | null; expiryDate: string | null;
      notes: string | null; createdAt: string;
    }>>(
      `SELECT id, category, "docType", "customLabel", "fileName", "fileSize", "mimeType",
              "financialYear", "expiryDate", notes, "createdAt"
       FROM csi_company_files
       WHERE "companyId" = $1 AND "teamId" = $2
       ORDER BY category, "docType", "createdAt" DESC`,
      link.companyId, link.teamId
    );
  }

  return NextResponse.json({
    companyName: link.companyName,
    label: link.label,
    shareMode: link.shareMode,
    expiresAt: link.expiresAt,
    files,
  });
}
