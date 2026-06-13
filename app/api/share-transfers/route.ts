import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/* ── Auto-migrate tables ───────────────────────────────────────── */
async function ensureTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS csi_share_transfers (
      id                       TEXT PRIMARY KEY,
      "userId"                 TEXT NOT NULL,
      "companyId"              TEXT NOT NULL,

      "transferorPersonId"     TEXT,
      "transferorName"         TEXT NOT NULL DEFAULT '',
      "transferorFolio"        TEXT,
      "transferorCertNo"       TEXT,
      "transferorShareholderId" TEXT,

      "transfereePersonId"     TEXT,
      "transfereeName"         TEXT NOT NULL DEFAULT '',
      "transfereeFather"       TEXT,
      "transfereeAddress"      TEXT,
      "transfereePan"          TEXT,
      "transfereeFolio"        TEXT,
      "transfereeCertNo"       TEXT,
      "transfereeShareholderId" TEXT,

      "numberOfShares"         INT,
      "shareType"              TEXT DEFAULT 'Equity',
      "distinctiveFrom"        INT,
      "distinctiveTo"          INT,
      "transferDate"           TEXT,
      "considerationPerShare"  TEXT,
      "totalConsideration"     TEXT,
      "stampDuty"              TEXT,
      "issuePlace"             TEXT,

      "witness1Name"           TEXT,
      "witness1Address"        TEXT,
      "witness2Name"           TEXT,
      "witness2Address"        TEXT,

      "nominalValue"           TEXT,
      "paidUpValue"            TEXT,
      "signingDirectorsJson"   TEXT,

      "status"                 TEXT DEFAULT 'approved',
      "remarks"                TEXT,

      "createdAt"              TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt"              TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {});

  // Add witness + cert lifecycle columns if missing
  await prisma.$executeRawUnsafe(`
    ALTER TABLE csi_share_transfers
      ADD COLUMN IF NOT EXISTS "witness1Name"    TEXT,
      ADD COLUMN IF NOT EXISTS "witness1Address" TEXT,
      ADD COLUMN IF NOT EXISTS "witness2Name"    TEXT,
      ADD COLUMN IF NOT EXISTS "witness2Address" TEXT,
      ADD COLUMN IF NOT EXISTS "transfereeFather"  TEXT,
      ADD COLUMN IF NOT EXISTS "transfereeAddress" TEXT,
      ADD COLUMN IF NOT EXISTS "transfereePan"     TEXT
  `).catch(() => {});

  await prisma.$executeRawUnsafe(`
    ALTER TABLE csi_shareholders
      ADD COLUMN IF NOT EXISTS "transferStatus"    TEXT,
      ADD COLUMN IF NOT EXISTS "transferredShares" INT,
      ADD COLUMN IF NOT EXISTS "sourceTransferId"  TEXT,
      ADD COLUMN IF NOT EXISTS "certStatus"        TEXT DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS "cancelledReason"   TEXT,
      ADD COLUMN IF NOT EXISTS "cancelledAt"       TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "splitFromId"       TEXT,
      ADD COLUMN IF NOT EXISTS "splitEventId"      TEXT
  `).catch(() => {});
}

/* ═══════════════════════════════════════════════════════════════
   GET /api/share-transfers?companyId=xxx
══════════════════════════════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  await ensureTables();

  const transfers = await prisma.$queryRawUnsafe<unknown[]>(
    `SELECT t.*
     FROM csi_share_transfers t
     WHERE t."userId" = $1 AND t."companyId" = $2
     ORDER BY t."createdAt" DESC`,
    userId, companyId
  );

  return NextResponse.json({ transfers });
}

/* ═══════════════════════════════════════════════════════════════
   POST /api/share-transfers
   Execute a share transfer

   IMPORTANT: For PARTIAL transfers, the original certificate must
   be split FIRST via /api/share-splits. This API only accepts
   FULL transfer of the given certificate record.
   (Partial = you split first, then transfer one of the split certs)
══════════════════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  await ensureTables();

  const body = await req.json() as {
    companyId: string;

    // Transferor
    transferorPersonId?: string;
    transferorName: string;
    transferorFolio?: string;
    transferorCertNo?: string;
    transferorShareholderId: string;

    // Transferee
    transfereePersonId?: string;
    transfereeName: string;
    transfereeFatherName?: string;
    transfereeAddress?: string;
    transfereePan?: string;
    transfereeOccupation?: string;

    // Transfer details
    numberOfShares: number;
    shareType?: string;
    transferDate?: string;
    considerationPerShare?: string;
    totalConsideration?: string;
    stampDuty?: string;
    issuePlace?: string;

    // Witnesses
    witness1Name?: string;
    witness1Address?: string;
    witness2Name?: string;
    witness2Address?: string;

    // Certificate metadata
    nominalValue?: string;
    paidUpValue?: string;
    signingDirectorsJson?: string;

    remarks?: string;
  };

  if (!body.companyId)              return NextResponse.json({ error: "companyId required" }, { status: 400 });
  if (!body.transferorShareholderId) return NextResponse.json({ error: "transferorShareholderId required" }, { status: 400 });
  if (!body.numberOfShares || body.numberOfShares <= 0) return NextResponse.json({ error: "numberOfShares must be > 0" }, { status: 400 });

  /* ── 1. Fetch transferor certificate ── */
  const [transferorSh] = await prisma.$queryRawUnsafe<Array<{
    id: string; personId: string; folioNumber: string; certificateNumber: string;
    numberOfShares: number; distinctiveFrom: number; distinctiveTo: number;
    shareType: string; nominalValue: string; paidUpValue: string;
    signingDirectorsJson: string; dateOfAcquisition: string; certStatus: string;
  }>>(
    `SELECT * FROM csi_shareholders WHERE id = $1 AND "userId" = $2`,
    body.transferorShareholderId, userId
  );

  if (!transferorSh)
    return NextResponse.json({ error: "Transferor shareholder record not found" }, { status: 404 });
  if (transferorSh.certStatus === 'cancelled' || transferorSh.certStatus === 'split')
    return NextResponse.json({ error: `Certificate is already ${transferorSh.certStatus} and cannot be transferred` }, { status: 400 });
  if (transferorSh.numberOfShares !== body.numberOfShares) {
    return NextResponse.json({
      error: `This certificate has ${transferorSh.numberOfShares} shares. You are trying to transfer ${body.numberOfShares}. For partial transfer, please split the certificate first.`,
      needsSplit: transferorSh.numberOfShares !== body.numberOfShares,
    }, { status: 400 });
  }

  /* ── 2. Distinctive numbers (full cert transfer — same DN range) ── */
  const transferFrom = transferorSh.distinctiveFrom;
  const transferTo   = transferorSh.distinctiveTo;

  /* ── 3. Get next folio & cert numbers ── */
  const [folioResult] = await prisma.$queryRawUnsafe<Array<{ maxFolio: string }>>(
    `SELECT MAX(CAST(NULLIF(REGEXP_REPLACE("folioNumber", '[^0-9]', '', 'g'), '') AS INT)) as "maxFolio"
     FROM csi_shareholders WHERE "companyId" = $1 AND "userId" = $2`,
    body.companyId, userId
  );
  const [certResult] = await prisma.$queryRawUnsafe<Array<{ maxCert: string }>>(
    `SELECT MAX(CAST(NULLIF(REGEXP_REPLACE("certificateNumber", '[^0-9]', '', 'g'), '') AS INT)) as "maxCert"
     FROM csi_shareholders WHERE "companyId" = $1 AND "userId" = $2`,
    body.companyId, userId
  );
  const newFolioNo = String((parseInt(folioResult?.maxFolio || '0') || 0) + 1).padStart(2, '0');
  const newCertNo  = String((parseInt(certResult?.maxCert  || '0') || 0) + 1).padStart(2, '0');

  /* ── 4. Ensure transferee person exists ── */
  let transfereePersonId = body.transfereePersonId;
  if (!transfereePersonId && body.transfereeName) {
    const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM csi_persons WHERE "userId" = $1 AND "companyId" = $2 AND LOWER(name) = LOWER($3) LIMIT 1`,
      userId, body.companyId, body.transfereeName
    );
    if (existing.length > 0) {
      transfereePersonId = existing[0].id;
    } else {
      transfereePersonId = crypto.randomUUID();
      await prisma.$executeRawUnsafe(
        `INSERT INTO csi_persons (id, "userId", "companyId", name, "fatherName", "presentAddress", "panNo", occupation, "isShareholder")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)`,
        transfereePersonId, userId, body.companyId,
        body.transfereeName, body.transfereeFatherName || null,
        body.transfereeAddress || null, body.transfereePan || null,
        body.transfereeOccupation || null
      );
    }
  }

  const signingJson = body.signingDirectorsJson || transferorSh.signingDirectorsJson || '[]';
  const nominalVal  = body.nominalValue || transferorSh.nominalValue || '10';
  const paidUpVal   = body.paidUpValue  || transferorSh.paidUpValue  || '10';

  /* ── 5. CANCEL transferor's certificate ── */
  await prisma.$executeRawUnsafe(
    `UPDATE csi_shareholders SET
       "certStatus"      = 'cancelled',
       "cancelledReason" = 'transferred',
       "cancelledAt"     = NOW(),
       "transferStatus"  = 'transferred',
       "transferredShares" = $3,
       "updatedAt"       = NOW()
     WHERE id = $1 AND "userId" = $2`,
    transferorSh.id, userId, body.numberOfShares
  );

  /* ── 6. Create new certificate for transferee ── */
  const newShId = crypto.randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO csi_shareholders (
       id, "personId", "userId", "companyId",
       "folioNumber", "certificateNumber",
       "distinctiveFrom", "distinctiveTo",
       "numberOfShares", "shareType",
       "dateOfAcquisition",
       "nominalValue", "paidUpValue",
       "signingDirectorsJson",
       "certStatus", "transferStatus"
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'active','received')`,
    newShId, transfereePersonId, userId, body.companyId,
    newFolioNo, newCertNo,
    transferFrom, transferTo,
    body.numberOfShares, body.shareType || transferorSh.shareType || 'Equity',
    body.transferDate || null,
    nominalVal, paidUpVal, signingJson
  );

  /* ── 7. Create transfer record ── */
  const transferId = crypto.randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO csi_share_transfers (
       id, "userId", "companyId",
       "transferorPersonId", "transferorName", "transferorFolio", "transferorCertNo", "transferorShareholderId",
       "transfereePersonId", "transfereeName", "transfereeFather", "transfereeAddress", "transfereePan",
       "transfereeFolio", "transfereeCertNo", "transfereeShareholderId",
       "numberOfShares", "shareType", "distinctiveFrom", "distinctiveTo",
       "transferDate", "considerationPerShare", "totalConsideration", "stampDuty", "issuePlace",
       "witness1Name", "witness1Address", "witness2Name", "witness2Address",
       "nominalValue", "paidUpValue", "signingDirectorsJson",
       "status", "remarks"
     ) VALUES (
       $1,$2,$3,
       $4,$5,$6,$7,$8,
       $9,$10,$11,$12,$13,
       $14,$15,$16,
       $17,$18,$19,$20,
       $21,$22,$23,$24,$25,
       $26,$27,$28,$29,
       $30,$31,$32,
       'approved',$33
     )`,
    transferId, userId, body.companyId,
    body.transferorPersonId || transferorSh.personId, body.transferorName,
    body.transferorFolio || transferorSh.folioNumber,
    body.transferorCertNo || transferorSh.certificateNumber,
    transferorSh.id,
    transfereePersonId || null, body.transfereeName,
    body.transfereeFatherName || null, body.transfereeAddress || null, body.transfereePan || null,
    newFolioNo, newCertNo, newShId,
    body.numberOfShares, body.shareType || 'Equity', transferFrom, transferTo,
    body.transferDate || null,
    body.considerationPerShare || null, body.totalConsideration || null,
    body.stampDuty || null, body.issuePlace || null,
    body.witness1Name || null, body.witness1Address || null,
    body.witness2Name || null, body.witness2Address || null,
    nominalVal, paidUpVal, signingJson,
    body.remarks || null
  );

  // Link new shareholder to this transfer
  await prisma.$executeRawUnsafe(
    `UPDATE csi_shareholders SET "sourceTransferId" = $1 WHERE id = $2`,
    transferId, newShId
  );

  return NextResponse.json({
    transferId,
    newFolioNo,
    newCertNo,
    newShareholderId: newShId,
    transfereePersonId,
    distinctiveFrom: transferFrom,
    distinctiveTo: transferTo,
  });
}
