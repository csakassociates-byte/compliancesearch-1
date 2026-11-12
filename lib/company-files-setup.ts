import { prisma } from "./prisma";

export async function ensureCompanyFilesTables() {
  // Drive tokens on teams table
  await prisma.$executeRawUnsafe(`
    ALTER TABLE csi_teams
    ADD COLUMN IF NOT EXISTS "driveAccessToken"  TEXT,
    ADD COLUMN IF NOT EXISTS "driveRefreshToken" TEXT,
    ADD COLUMN IF NOT EXISTS "driveTokenExpiry"  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS "driveFolderId"     TEXT,
    ADD COLUMN IF NOT EXISTS "driveEmail"        TEXT
  `);

  // Company files metadata table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS csi_company_files (
      id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      "teamId"          TEXT NOT NULL,
      "companyId"       TEXT NOT NULL,
      category          TEXT NOT NULL,
      "docType"         TEXT NOT NULL,
      "customLabel"     TEXT,
      "fileName"        TEXT NOT NULL,
      "fileSize"        INTEGER,
      "mimeType"        TEXT,
      "driveFileId"     TEXT,
      "driveWebViewLink" TEXT,
      "driveDownloadLink" TEXT,
      "uploadedBy"      TEXT NOT NULL,
      "expiryDate"      TEXT,
      "financialYear"   TEXT,
      notes             TEXT,
      "createdAt"       TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt"       TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS idx_csi_company_files_team ON csi_company_files("teamId")`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS idx_csi_company_files_company ON csi_company_files("companyId")`
  );
}
