import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/* ── Auto-migrate tables ───────────────────────────────────────── */
async function ensureTables() {
  // csi_share_transfers — main transfer log
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS csi_share_transfers (
      id                     TEXT PRIMARY KEY,
      "userId"               TEXT NOT NULL,
      "companyId"            TEXT NOT NULL,

      "transferorPersonId"   TEXT,
      "transferorName"       TEXT NOT NULL DEFAULT '',
      "transferorFolio"      TEXT,
      "transferorCertNo"     TEXT,
      "transferorShareholderId" TEXT,

      "transfereePersonId"   TEXT,
      "transfereeName"       TEXT NOT NULL DEFAULT '',
      "transfereeFolio"      TEXT,
      "transfereeCertNo"     TEXT,
      "transfereeShareholderId" TEXT,

      "numberOfShares"       INT,
      "shareType"            TEXT DEFAULT 'Equity',
      "distinctiveFrom"      INT,
      "distinctiveTo"        INT,
      "transferDate"         TEXT,
      "considerationPerShare" TEXT,
      "totalConsideration"   TEXT,
      "stampDuty"            TEXT,
      "issuePlace"           TEXT,

      "nominalValue"         TEXT,
      "paidUpValue"          TEXT,
      "signingDirectorsJson" TEXT,

      "status"               TEXT DEFAULT 'approved',
      "remarks"              TEXT,

      "createdAt"            TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt"            TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {});

  // Extra columns on csi_shareholders for transfer tracking
  await prisma.$executeRawUnsafe(`
    ALTER TABLE csi_shareholders
      ADD COLUMN IF NOT EXISTS "transferStatus"    TEXT,
      ADD COLUMN IF NOT EXISTS "transferredShares" INT,
      ADD COLUMN IF NOT EXISTS "sourceTransferId"  TEXT
  `).catch(() => {});
}

/* ═══════════════════════════════════════════════════════════════
   GET /api/share-transfers?companyId=xxx
   Returns all transfers for a company
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
    `SELECT t.*,
            tp.name as "transferorPersonName", tp.din as "transferorDin",
            te.name as "transfereePersonName", te.din as "transfereeDin"
     FROM csi_share_transfers t
     LEFT JOIN csi_persons tp ON tp.id = t."transferorPersonId"
     LEFT JOIN csi_persons te ON te.id = t."transfereePersonId"
     WHERE t."userId" = $1 AND t."companyId" = $2
     ORDER BY t."createdAt" DESC`,
    userId, companyId
  );

  return NextResponse.json({ transfers });
}

/* ═══════════════════════════════════════════════════════════════
   POST /api/share-transfers
   Execute a share transfer
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
    transferorShareholderId: string;  // existing shareholder record

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

    // Certificate metadata (for new cert)
    nominalValue?: string;
    paidUpValue?: string;
    signingDirectorsJson?: string;

    remarks?: string;
  };

  if (!body.companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });
  if (!body.transferorShareholderId) return NextResponse.json({ error: "transferorShareholderId required" }, { status: 400 });
  if (!body.numberOfShares || body.numberOfShares <= 0) return NextResponse.json({ error: "numberOfShares must be > 0" }, { status: 400 });

  /* ── 1. Fetch transferor's current shareholder record ── */
  const [transferorSh] = await prisma.$queryRawUnsafe<Array<{
    id: string;
    personId: string;
    folioNumber: string;
    certificateNumber: string;
    numberOfShares: number;
    distinctiveFrom: number;
    distinctiveTo: number;
    shareType: string;
    nominalValue: string;
    paidUpValue: string;
    signingDirectorsJson: string;
    dateOfAcquisition: string;
  }>>(
    `SELECT * FROM csi_shareholders WHERE id = $1 AND "userId" = $2`,
    body.transferorShareholderId, userId
  );

  if (!transferorSh) return NextResponse.json({ error: "Transferor shareholder record not found" }, { status: 404 });
  if (transferorSh.numberOfShares < body.numberOfShares) {
    return NextResponse.json({
      error: `Transferor only has ${transferorSh.numberOfShares} shares. Cannot transfer ${body.numberOfShares}.`
    }, { status: 400 });
  }

  /* ── 2. Calculate distinctive numbers for transfer ── */
  const transferFrom = transferorSh.distinctiveFrom;
  const transferTo   = transferFrom + body.numberOfShares - 1;
  const remainFrom   = transferTo + 1;
  const remainTo     = transferorSh.distinctiveTo;

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

  /* ── 4. Ensure transferee person exists in csi_persons ── */
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
        body.transfereeName,
        body.transfereeFatherName || null,
        body.transfereeAddress || null,
        body.transfereePan || null,
        body.transfereeOccupation || null
      );
    }
  }

  const signingJson = body.signingDirectorsJson || transferorSh.signingDirectorsJson || '[]';
  const nominalVal  = body.nominalValue || transferorSh.nominalValue || '10';
  const paidUpVal   = body.paidUpValue  || transferorSh.paidUpValue  || '10';

  /* ── 5. Update transferor's shares ── */
  const remainingShares = transferorSh.numberOfShares - body.numberOfShares;
  if (remainingShares === 0) {
    // Full transfer — mark as transferred
    await prisma.$executeRawUnsafe(
      `UPDATE csi_shareholders SET
         "numberOfShares"    = 0,
         "transferStatus"    = 'transferred',
         "transferredShares" = $3,
         "updatedAt"         = NOW()
       WHERE id = $1 AND "userId" = $2`,
      transferorSh.id, userId, body.numberOfShares
    );
  } else {
    // Partial transfer — reduce shares and update distinctive nos
    await prisma.$executeRawUnsafe(
      `UPDATE csi_shareholders SET
         "numberOfShares"    = $3,
         "distinctiveFrom"   = $4,
         "distinctiveTo"     = $5,
         "transferStatus"    = 'partial',
         "transferredShares" = COALESCE("transferredShares", 0) + $6,
         "updatedAt"         = NOW()
       WHERE id = $1 AND "userId" = $2`,
      transferorSh.id, userId,
      remainingShares, remainFrom, remainTo,
      body.numberOfShares
    );
  }

  /* ── 6. Create new shareholder record for transferee ── */
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
       "transferStatus", "sourceTransferId"
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'received',$15)`,
    newShId, transfereePersonId, userId, body.companyId,
    newFolioNo, newCertNo,
    transferFrom, transferTo,
    body.numberOfShares, body.shareType || transferorSh.shareType || 'Equity',
    body.transferDate || null,
    nominalVal, paidUpVal,
    signingJson,
    'pending' // will be set to transfer id after insert
  );

  /* ── 7. Create transfer record ── */
  const transferId = crypto.randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO csi_share_transfers (
       id, "userId", "companyId",
       "transferorPersonId", "transferorName", "transferorFolio", "transferorCertNo", "transferorShareholderId",
       "transfereePersonId", "transfereeName", "transfereeFolio", "transfereeCertNo", "transfereeShareholderId",
       "numberOfShares", "shareType",
       "distinctiveFrom", "distinctiveTo",
       "transferDate", "considerationPerShare", "totalConsideration", "stampDuty",
       "issuePlace", "nominalValue", "paidUpValue", "signingDirectorsJson",
       "status", "remarks"
     ) VALUES (
       $1,$2,$3,
       $4,$5,$6,$7,$8,
       $9,$10,$11,$12,$13,
       $14,$15,
       $16,$17,
       $18,$19,$20,$21,
       $22,$23,$24,$25,
       'approved',$26
     )`,
    transferId, userId, body.companyId,
    body.transferorPersonId || transferorSh.personId, body.transferorName,
    body.transferorFolio || transferorSh.folioNumber,
    body.transferorCertNo || transferorSh.certificateNumber,
    transferorSh.id,
    transfereePersonId || null, body.transfereeName,
    newFolioNo, newCertNo, newShId,
    body.numberOfShares, body.shareType || 'Equity',
    transferFrom, transferTo,
    body.transferDate || null,
    body.considerationPerShare || null,
    body.totalConsideration || null,
    body.stampDuty || null,
    body.issuePlace || null,
    nominalVal, paidUpVal, signingJson,
    body.remarks || null
  );

  // Update the new shareholder record with the actual transferId
  await prisma.$executeRawUnsafe(
    `UPDATE csi_shareholders SET "sourceTransferId" = $1, "transferStatus" = 'received' WHERE id = $2`,
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
    remainingShares,
  });
}
