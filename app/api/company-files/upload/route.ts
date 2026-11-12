import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrCreateTeam } from "@/lib/team";
import { prisma } from "@/lib/prisma";
import { ensureCompanyFilesTables } from "@/lib/company-files-setup";
import {
  getValidAccessToken,
  getOrCreateDriveFolder,
  uploadFileToDrive,
  setFilePublic,
} from "@/lib/google-drive";
import crypto from "crypto";

// POST /api/company-files/upload
// FormData: file, companyId, companyName, category, docType, customLabel?, financialYear?, expiryDate?, notes?
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const teamId = await getOrCreateTeam(userId);
  await ensureCompanyFilesTables();

  const formData    = await req.formData();
  const file        = formData.get("file") as File | null;
  const companyId   = formData.get("companyId") as string;
  const companyName = formData.get("companyName") as string;
  const category    = formData.get("category") as string;
  const docType     = formData.get("docType") as string;
  const customLabel = formData.get("customLabel") as string | null;
  const financialYear = formData.get("financialYear") as string | null;
  const expiryDate  = formData.get("expiryDate") as string | null;
  const notes       = formData.get("notes") as string | null;

  if (!file || !companyId || !category || !docType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Max 25 MB
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 25 MB)" }, { status: 400 });
  }

  const accessToken = await getValidAccessToken(teamId);
  if (!accessToken) {
    return NextResponse.json({ error: "Google Drive not connected" }, { status: 400 });
  }

  // Get or create folder hierarchy: CSI Documents / CompanyName / Category
  const driveRootRows = await prisma.$queryRawUnsafe<Array<{ driveFolderId: string | null }>>(
    `SELECT "driveFolderId" FROM csi_teams WHERE id = $1`, teamId
  );
  const rootFolderId = driveRootRows[0]?.driveFolderId ?? undefined;

  const companyFolderId = await getOrCreateDriveFolder(accessToken, companyName, rootFolderId);
  const catFolderId     = await getOrCreateDriveFolder(accessToken, category, companyFolderId);

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const driveFile = await uploadFileToDrive(
    accessToken,
    fileBuffer,
    file.name,
    file.type || "application/octet-stream",
    catFolderId
  );

  // Make file viewable by anyone with the link (no Drive login required)
  await setFilePublic(accessToken, driveFile.id);

  const id = crypto.randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO csi_company_files
     (id, "teamId", "companyId", category, "docType", "customLabel", "fileName", "fileSize",
      "mimeType", "driveFileId", "driveWebViewLink", "driveDownloadLink", "uploadedBy",
      "expiryDate", "financialYear", notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    id, teamId, companyId, category, docType, customLabel ?? null,
    file.name, file.size, file.type || null,
    driveFile.id, driveFile.webViewLink, driveFile.webContentLink,
    userId, expiryDate ?? null, financialYear ?? null, notes ?? null
  );

  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `SELECT * FROM csi_company_files WHERE id = $1`, id
  );
  return NextResponse.json({ file: rows[0] });
}
