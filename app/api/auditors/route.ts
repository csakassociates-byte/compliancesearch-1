import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamMemberIds } from "@/lib/team";
import crypto from "crypto";

async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS csi_auditors (
      id           TEXT PRIMARY KEY,
      "userId"     TEXT NOT NULL,
      "firmName"   TEXT NOT NULL,
      frn          TEXT NOT NULL,
      "partnerName"  TEXT NOT NULL,
      "membershipNo" TEXT NOT NULL,
      place        TEXT,
      "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_csi_auditors_userId ON csi_auditors("userId")`);
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_auditors ADD COLUMN IF NOT EXISTS "signatureBase64" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_auditors ADD COLUMN IF NOT EXISTS "sealBase64" TEXT`);
}

// GET — list all saved CAs for logged-in user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  await ensureTable();

  const memberIds = await getTeamMemberIds(userId);

  const rows = await prisma.$queryRawUnsafe<Array<{
    id: string; firmName: string; frn: string;
    partnerName: string; membershipNo: string; place: string | null;
    signatureBase64: string | null; sealBase64: string | null;
  }>>(
    `SELECT id, "firmName", frn, "partnerName", "membershipNo", place, "signatureBase64", "sealBase64"
     FROM csi_auditors WHERE "userId" = ANY($1::text[]) ORDER BY "createdAt" DESC`,
    memberIds
  );

  return NextResponse.json({ auditors: rows });
}

// POST — save a new CA
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json() as {
    firmName: string; frn: string; partnerName: string; membershipNo: string; place?: string;
    signatureBase64?: string; sealBase64?: string;
  };

  if (!body.firmName || !body.frn || !body.partnerName || !body.membershipNo)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  await ensureTable();

  // Upsert: update existing record if same FRN + membershipNo + userId
  const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM csi_auditors WHERE "userId" = $1 AND frn = $2 AND "membershipNo" = $3 LIMIT 1`,
    userId, body.frn, body.membershipNo
  );

  if (existing.length > 0) {
    await prisma.$executeRawUnsafe(
      `UPDATE csi_auditors SET "firmName"=$3, "partnerName"=$4, place=$5,
        "signatureBase64"=COALESCE($6,"signatureBase64"), "sealBase64"=COALESCE($7,"sealBase64"),
        "updatedAt"=NOW() WHERE id=$1 AND "userId"=$2`,
      existing[0].id, userId, body.firmName, body.partnerName, body.place ?? null,
      body.signatureBase64 ?? null, body.sealBase64 ?? null
    );
    return NextResponse.json({ success: true, id: existing[0].id });
  }

  const id = crypto.randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO csi_auditors (id,"userId","firmName",frn,"partnerName","membershipNo",place,"signatureBase64","sealBase64")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    id, userId, body.firmName, body.frn, body.partnerName, body.membershipNo,
    body.place ?? null, body.signatureBase64 ?? null, body.sealBase64 ?? null
  );

  return NextResponse.json({ success: true, id });
}
