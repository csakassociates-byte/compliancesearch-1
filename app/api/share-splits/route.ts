import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/* ── Auto-migrate ─────────────────────────────────────────────── */
async function ensureTables() {
  // Add cert lifecycle columns to csi_shareholders
  await prisma.$executeRawUnsafe(`
    ALTER TABLE csi_shareholders
      ADD COLUMN IF NOT EXISTS "certStatus"      TEXT DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS "cancelledReason" TEXT,
      ADD COLUMN IF NOT EXISTS "cancelledAt"     TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "splitFromId"     TEXT,
      ADD COLUMN IF NOT EXISTS "splitEventId"    TEXT
  `).catch(() => {});

  // csi_share_splits — log of all splitting events
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS csi_share_splits (
      id               TEXT PRIMARY KEY,
      "userId"         TEXT NOT NULL,
      "companyId"      TEXT NOT NULL,
      "originalShId"   TEXT NOT NULL,
      "originalCertNo" TEXT,
      "originalFolio"  TEXT,
      "originalDNFrom" INT,
      "originalDNTo"   INT,
      "originalShares" INT,
      "splitDate"      TEXT,
      "splitParts"     JSONB,
      "remarks"        TEXT,
      "createdAt"      TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {});
}

/* ═══════════════════════════════════════════════════════════════
   GET /api/share-splits?companyId=xxx
   Returns all split events for a company
══════════════════════════════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  await ensureTables();

  const splits = await prisma.$queryRawUnsafe<unknown[]>(
    `SELECT sp.*, p.name as "personName"
     FROM csi_share_splits sp
     LEFT JOIN csi_shareholders sh ON sh.id = sp."originalShId"
     LEFT JOIN csi_persons p ON p.id = sh."personId"
     WHERE sp."userId" = $1 AND sp."companyId" = $2
     ORDER BY sp."createdAt" DESC`,
    userId, companyId
  );

  return NextResponse.json({ splits });
}

/* ═══════════════════════════════════════════════════════════════
   POST /api/share-splits
   Execute a certificate split

   Body:
   {
     companyId: string,
     originalShId: string,          // csi_shareholders.id to split
     splitDate: string,             // date of split
     parts: Array<{
       shares: number,              // how many shares in this part
       // distFrom and distTo are auto-calculated
     }>,
     remarks?: string
   }
══════════════════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  await ensureTables();

  const body = await req.json() as {
    companyId: string;
    originalShId: string;
    splitDate?: string;
    parts: Array<{ shares: number }>;
    remarks?: string;
  };

  if (!body.companyId)     return NextResponse.json({ error: "companyId required" }, { status: 400 });
  if (!body.originalShId)  return NextResponse.json({ error: "originalShId required" }, { status: 400 });
  if (!body.parts || body.parts.length < 2)
    return NextResponse.json({ error: "At least 2 parts required for a split" }, { status: 400 });

  /* ── 1. Fetch original shareholder record ── */
  const [orig] = await prisma.$queryRawUnsafe<Array<{
    id: string; personId: string; folioNumber: string; certificateNumber: string;
    numberOfShares: number; distinctiveFrom: number; distinctiveTo: number;
    shareType: string; nominalValue: string; paidUpValue: string;
    signingDirectorsJson: string; dateOfAcquisition: string; certStatus: string;
  }>>(
    `SELECT * FROM csi_shareholders WHERE id = $1 AND "userId" = $2`,
    body.originalShId, userId
  );

  if (!orig) return NextResponse.json({ error: "Shareholder record not found" }, { status: 404 });
  if (orig.certStatus === 'cancelled')
    return NextResponse.json({ error: "This certificate is already cancelled" }, { status: 400 });
  if (orig.certStatus === 'split')
    return NextResponse.json({ error: "This certificate has already been split" }, { status: 400 });

  /* ── 2. Validate parts sum === original shares ── */
  const partsTotal = body.parts.reduce((s, p) => s + p.shares, 0);
  if (partsTotal !== orig.numberOfShares) {
    return NextResponse.json({
      error: `Parts total (${partsTotal}) must equal original shares (${orig.numberOfShares})`
    }, { status: 400 });
  }

  /* ── 3. Get next certificate number ── */
  const [certResult] = await prisma.$queryRawUnsafe<Array<{ maxCert: string }>>(
    `SELECT MAX(CAST(NULLIF(REGEXP_REPLACE("certificateNumber", '[^0-9]', '', 'g'), '') AS INT)) as "maxCert"
     FROM csi_shareholders WHERE "companyId" = $1 AND "userId" = $2`,
    body.companyId, userId
  );
  let nextCertNo = (parseInt(certResult?.maxCert || '0') || 0) + 1;

  /* ── 4. Cancel original certificate ── */
  await prisma.$executeRawUnsafe(
    `UPDATE csi_shareholders SET
       "certStatus"      = 'split',
       "cancelledReason" = 'split',
       "cancelledAt"     = NOW(),
       "transferStatus"  = 'split',
       "updatedAt"       = NOW()
     WHERE id = $1 AND "userId" = $2`,
    orig.id, userId
  );

  /* ── 5. Create split event record ── */
  const splitEventId = crypto.randomUUID();
  const splitPartsInfo: Array<{
    certNo: string; shares: number; distFrom: number; distTo: number; shId: string;
  }> = [];

  /* ── 6. Issue new split certificates ── */
  let cursor = orig.distinctiveFrom;

  for (const part of body.parts) {
    const newShId  = crypto.randomUUID();
    const certNo   = String(nextCertNo).padStart(2, '0');
    const distFrom = cursor;
    const distTo   = cursor + part.shares - 1;
    cursor = distTo + 1;

    await prisma.$executeRawUnsafe(
      `INSERT INTO csi_shareholders (
         id, "personId", "userId", "companyId",
         "folioNumber", "certificateNumber",
         "distinctiveFrom", "distinctiveTo",
         "numberOfShares", "shareType",
         "dateOfAcquisition",
         "nominalValue", "paidUpValue",
         "signingDirectorsJson",
         "certStatus", "splitFromId", "splitEventId",
         "transferStatus"
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'active',$15,$16,NULL)`,
      newShId, orig.personId, userId, body.companyId,
      orig.folioNumber,        // same folio — same shareholder
      certNo,
      distFrom, distTo,
      part.shares, orig.shareType || 'Equity',
      orig.dateOfAcquisition || body.splitDate || null,
      orig.nominalValue || '10', orig.paidUpValue || '10',
      orig.signingDirectorsJson || '[]',
      orig.id, splitEventId
    );

    splitPartsInfo.push({ certNo, shares: part.shares, distFrom, distTo, shId: newShId });
    nextCertNo++;
  }

  /* ── 7. Save split event ── */
  await prisma.$executeRawUnsafe(
    `INSERT INTO csi_share_splits (
       id, "userId", "companyId",
       "originalShId", "originalCertNo", "originalFolio",
       "originalDNFrom", "originalDNTo", "originalShares",
       "splitDate", "splitParts", "remarks"
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12)`,
    splitEventId, userId, body.companyId,
    orig.id, orig.certificateNumber, orig.folioNumber,
    orig.distinctiveFrom, orig.distinctiveTo, orig.numberOfShares,
    body.splitDate || new Date().toISOString().slice(0, 10),
    JSON.stringify(splitPartsInfo),
    body.remarks || null
  );

  return NextResponse.json({
    splitEventId,
    originalCertNo: orig.certificateNumber,
    newCertificates: splitPartsInfo,
  });
}
