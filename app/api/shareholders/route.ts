import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  const shareholders = await prisma.$queryRawUnsafe<unknown[]>(
    `SELECT s.*, p.name as "personName", p.din, p.mobile, p.email,
            p."panNo", p."aadhaarNo", p."isDirector", p."designation"
     FROM csi_shareholders s
     LEFT JOIN csi_persons p ON p.id = s."personId"
     WHERE s."userId" = $1 AND s."companyId" = $2
     ORDER BY s."createdAt" ASC`,
    userId, companyId
  );

  // Calculate total shares for % holding
  const totalShares = (shareholders as Array<{ numberOfShares?: number }>)
    .reduce((sum, s) => sum + (s.numberOfShares || 0), 0);

  const result = (shareholders as Array<Record<string, unknown>>).map(s => ({
    ...s,
    holdingPercent: totalShares > 0
      ? (((s.numberOfShares as number) || 0) / totalShares * 100).toFixed(2)
      : "0.00",
  }));

  return NextResponse.json({ shareholders: result, totalShares });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json() as {
    personId?: string;
    personName?: string;
    companyId: string;
    folioNumber?: string;
    certificateNumber?: string;
    distinctiveFrom?: number;
    distinctiveTo?: number;
    numberOfShares?: number;
    shareType?: string;
    dateOfAcquisition?: string;
    dateOfTransfer?: string;
    transferFrom?: string;
    nomineeName?: string;
    nomineeRelation?: string;
    nomineeAddress?: string;
  };

  if (!body.companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  let personId = body.personId;

  // If personId not provided but personName given, look up or create person
  if (!personId && body.personName) {
    const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM csi_persons WHERE "userId" = $1 AND "companyId" = $2 AND LOWER(name) = LOWER($3) LIMIT 1`,
      userId, body.companyId, body.personName
    );
    if (existing.length > 0) {
      personId = existing[0].id;
    } else {
      personId = crypto.randomUUID();
      await prisma.$executeRawUnsafe(
        `INSERT INTO csi_persons (id, "userId", "companyId", name, "isShareholder") VALUES ($1,$2,$3,$4,true)`,
        personId, userId, body.companyId, body.personName
      );
    }
  }

  if (!personId) return NextResponse.json({ error: "personId or personName required" }, { status: 400 });

  // Upsert shareholder by (userId + companyId + personId + certificateNumber)
  const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM csi_shareholders
     WHERE "userId" = $1 AND "companyId" = $2 AND "personId" = $3
     ${body.certificateNumber ? `AND "certificateNumber" = $4` : ``}
     LIMIT 1`,
    userId, body.companyId, personId,
    ...(body.certificateNumber ? [body.certificateNumber] : [])
  );

  if (existing.length > 0) {
    await prisma.$executeRawUnsafe(
      `UPDATE csi_shareholders SET
        "folioNumber" = COALESCE($3, "folioNumber"),
        "certificateNumber" = COALESCE($4, "certificateNumber"),
        "distinctiveFrom" = COALESCE($5, "distinctiveFrom"),
        "distinctiveTo" = COALESCE($6, "distinctiveTo"),
        "numberOfShares" = COALESCE($7, "numberOfShares"),
        "shareType" = COALESCE($8, "shareType"),
        "dateOfAcquisition" = COALESCE($9, "dateOfAcquisition"),
        "dateOfTransfer" = COALESCE($10, "dateOfTransfer"),
        "transferFrom" = COALESCE($11, "transferFrom"),
        "nomineeName" = COALESCE($12, "nomineeName"),
        "nomineeRelation" = COALESCE($13, "nomineeRelation"),
        "nomineeAddress" = COALESCE($14, "nomineeAddress"),
        "updatedAt" = NOW()
       WHERE id = $1 AND "userId" = $2`,
      existing[0].id, userId,
      body.folioNumber || null, body.certificateNumber || null,
      body.distinctiveFrom ?? null, body.distinctiveTo ?? null,
      body.numberOfShares ?? null, body.shareType || null,
      body.dateOfAcquisition || null, body.dateOfTransfer || null,
      body.transferFrom || null, body.nomineeName || null,
      body.nomineeRelation || null, body.nomineeAddress || null
    );
    return NextResponse.json({ id: existing[0].id });
  }

  const id = crypto.randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO csi_shareholders (
      id, "personId", "userId", "companyId",
      "folioNumber", "certificateNumber", "distinctiveFrom", "distinctiveTo",
      "numberOfShares", "shareType", "dateOfAcquisition", "dateOfTransfer",
      "transferFrom", "nomineeName", "nomineeRelation", "nomineeAddress"
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    id, personId, userId, body.companyId,
    body.folioNumber || null, body.certificateNumber || null,
    body.distinctiveFrom ?? null, body.distinctiveTo ?? null,
    body.numberOfShares ?? null, body.shareType || 'Equity',
    body.dateOfAcquisition || null, body.dateOfTransfer || null,
    body.transferFrom || null, body.nomineeName || null,
    body.nomineeRelation || null, body.nomineeAddress || null
  );

  // Mark person as shareholder
  await prisma.$executeRawUnsafe(
    `UPDATE csi_persons SET "isShareholder" = true, "updatedAt" = NOW() WHERE id = $1`,
    personId
  );

  return NextResponse.json({ id });
}
