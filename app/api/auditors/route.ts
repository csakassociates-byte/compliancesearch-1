import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_csi_auditors_userId ON csi_auditors("userId")
  `);
}

// GET — list all saved CAs for logged-in user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  await ensureTable();

  const rows = await prisma.$queryRawUnsafe<Array<{
    id: string; firmName: string; frn: string;
    partnerName: string; membershipNo: string; place: string | null;
  }>>(
    `SELECT id, "firmName", frn, "partnerName", "membershipNo", place
     FROM csi_auditors WHERE "userId" = $1 ORDER BY "createdAt" DESC`,
    userId
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
  };

  if (!body.firmName || !body.frn || !body.partnerName || !body.membershipNo)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  await ensureTable();

  const id = crypto.randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO csi_auditors (id, "userId", "firmName", frn, "partnerName", "membershipNo", place)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    id, userId, body.firmName, body.frn, body.partnerName, body.membershipNo, body.place ?? null
  );

  return NextResponse.json({ success: true, id });
}
