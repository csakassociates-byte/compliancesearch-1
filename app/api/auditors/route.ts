import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamMemberIds } from "@/lib/team";
import crypto from "crypto";

async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS csi_auditors (
      id             TEXT PRIMARY KEY,
      "userId"       TEXT NOT NULL,
      "firmName"     TEXT NOT NULL,
      frn            TEXT NOT NULL DEFAULT '',
      "partnerName"  TEXT NOT NULL DEFAULT '',
      "membershipNo" TEXT NOT NULL DEFAULT '',
      place          TEXT,
      "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_csi_auditors_userId ON csi_auditors("userId")`);
  // Signature / seal (original)
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_auditors ADD COLUMN IF NOT EXISTS "signatureBase64" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_auditors ADD COLUMN IF NOT EXISTS "sealBase64" TEXT`);
  // Company linkage
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_auditors ADD COLUMN IF NOT EXISTS cin TEXT`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_csi_auditors_cin ON csi_auditors(cin)`);
  // Auditor detail fields
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_auditors ADD COLUMN IF NOT EXISTS "auditorType" TEXT DEFAULT 'firm'`);
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_auditors ADD COLUMN IF NOT EXISTS "auditorAddress" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_auditors ADD COLUMN IF NOT EXISTS "auditorCity" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_auditors ADD COLUMN IF NOT EXISTS "auditorEmail" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_auditors ADD COLUMN IF NOT EXISTS "auditorMobile" TEXT`);
  // Appointment detail fields
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_auditors ADD COLUMN IF NOT EXISTS "appointmentType" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_auditors ADD COLUMN IF NOT EXISTS "agmFrom" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_auditors ADD COLUMN IF NOT EXISTS "agmTo" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_auditors ADD COLUMN IF NOT EXISTS "fyRange" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_auditors ADD COLUMN IF NOT EXISTS remuneration TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_auditors ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true`);
  // Individual CA fields
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_auditors ADD COLUMN IF NOT EXISTS "partnerDesignation" TEXT`);
}

// GET — list saved auditors; ?cin=xxx filters to one company
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  await ensureTable();

  const { searchParams } = new URL(req.url);
  const cin = searchParams.get("cin");

  const memberIds = await getTeamMemberIds(userId);

  let rows: Array<Record<string, unknown>>;

  if (cin) {
    rows = await prisma.$queryRawUnsafe(
      `SELECT id, "firmName", frn, "partnerName", "membershipNo", place,
              "signatureBase64", "sealBase64",
              cin, "auditorType", "auditorAddress", "auditorCity", "auditorEmail", "auditorMobile",
              "appointmentType", "agmFrom", "agmTo", "fyRange", remuneration, "isActive", "partnerDesignation"
       FROM csi_auditors
       WHERE "userId" = ANY($1::text[]) AND cin = $2
       ORDER BY "updatedAt" DESC`,
      memberIds, cin
    );
  } else {
    rows = await prisma.$queryRawUnsafe(
      `SELECT id, "firmName", frn, "partnerName", "membershipNo", place,
              "signatureBase64", "sealBase64",
              cin, "auditorType", "auditorAddress", "auditorCity", "auditorEmail", "auditorMobile",
              "appointmentType", "agmFrom", "agmTo", "fyRange", remuneration, "isActive", "partnerDesignation"
       FROM csi_auditors
       WHERE "userId" = ANY($1::text[])
       ORDER BY "updatedAt" DESC`,
      memberIds
    );
  }

  return NextResponse.json({ auditors: rows });
}

// POST — save / update an auditor record
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json() as {
    firmName: string;
    frn?: string;
    partnerName?: string;
    membershipNo?: string;
    place?: string;
    cin?: string;
    auditorType?: string;
    auditorAddress?: string;
    auditorCity?: string;
    auditorEmail?: string;
    auditorMobile?: string;
    appointmentType?: string;
    agmFrom?: string;
    agmTo?: string;
    fyRange?: string;
    remuneration?: string;
    isActive?: boolean;
    partnerDesignation?: string;
    signatureBase64?: string;
    sealBase64?: string;
  };

  if (!body.firmName?.trim()) {
    return NextResponse.json({ error: "firmName is required" }, { status: 400 });
  }

  await ensureTable();

  const frn = body.frn?.trim() || "";
  const membershipNo = body.membershipNo?.trim() || "";
  const cin = body.cin?.trim() || null;

  // Upsert key: userId + cin (if provided) + frn + membershipNo
  // This allows same auditor to be tracked per company separately
  let existing: Array<{ id: string }>;
  if (cin) {
    existing = await prisma.$queryRawUnsafe(
      `SELECT id FROM csi_auditors
       WHERE "userId" = $1 AND cin = $2
         AND (frn = $3 OR "membershipNo" = $4)
       LIMIT 1`,
      userId, cin, frn, membershipNo
    );
  } else {
    existing = await prisma.$queryRawUnsafe(
      `SELECT id FROM csi_auditors
       WHERE "userId" = $1 AND frn = $2 AND "membershipNo" = $3
       LIMIT 1`,
      userId, frn, membershipNo
    );
  }

  if (existing.length > 0) {
    await prisma.$executeRawUnsafe(
      `UPDATE csi_auditors SET
        "firmName"         = $3,
        frn                = COALESCE(NULLIF($4,''), frn),
        "partnerName"      = COALESCE(NULLIF($5,''), "partnerName"),
        "membershipNo"     = COALESCE(NULLIF($6,''), "membershipNo"),
        place              = COALESCE($7, place),
        cin                = COALESCE($8, cin),
        "auditorType"      = COALESCE($9, "auditorType"),
        "auditorAddress"   = COALESCE($10, "auditorAddress"),
        "auditorCity"      = COALESCE($11, "auditorCity"),
        "auditorEmail"     = COALESCE($12, "auditorEmail"),
        "auditorMobile"    = COALESCE($13, "auditorMobile"),
        "appointmentType"  = COALESCE($14, "appointmentType"),
        "agmFrom"          = COALESCE($15, "agmFrom"),
        "agmTo"            = COALESCE($16, "agmTo"),
        "fyRange"          = COALESCE($17, "fyRange"),
        remuneration       = COALESCE($18, remuneration),
        "isActive"         = COALESCE($19, "isActive"),
        "partnerDesignation" = COALESCE($20, "partnerDesignation"),
        "signatureBase64"  = COALESCE($21, "signatureBase64"),
        "sealBase64"       = COALESCE($22, "sealBase64"),
        "updatedAt"        = NOW()
       WHERE id = $1 AND "userId" = $2`,
      existing[0].id, userId,
      body.firmName.trim(),
      frn || null, body.partnerName?.trim() || null, membershipNo || null,
      body.place || body.auditorCity || null,
      cin,
      body.auditorType || null,
      body.auditorAddress || null, body.auditorCity || null,
      body.auditorEmail || null, body.auditorMobile || null,
      body.appointmentType || null,
      body.agmFrom || null, body.agmTo || null, body.fyRange || null,
      body.remuneration || null,
      body.isActive ?? true,
      body.partnerDesignation || null,
      body.signatureBase64 || null, body.sealBase64 || null
    );
    return NextResponse.json({ success: true, id: existing[0].id });
  }

  const id = crypto.randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO csi_auditors (
      id, "userId", "firmName", frn, "partnerName", "membershipNo", place,
      cin, "auditorType", "auditorAddress", "auditorCity", "auditorEmail", "auditorMobile",
      "appointmentType", "agmFrom", "agmTo", "fyRange", remuneration, "isActive", "partnerDesignation",
      "signatureBase64", "sealBase64"
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22
    )`,
    id, userId,
    body.firmName.trim(), frn, body.partnerName?.trim() || "", membershipNo,
    body.place || body.auditorCity || null,
    cin, body.auditorType || "firm",
    body.auditorAddress || null, body.auditorCity || null,
    body.auditorEmail || null, body.auditorMobile || null,
    body.appointmentType || null,
    body.agmFrom || null, body.agmTo || null, body.fyRange || null,
    body.remuneration || null,
    body.isActive ?? true,
    body.partnerDesignation || null,
    body.signatureBase64 || null, body.sealBase64 || null
  );

  return NextResponse.json({ success: true, id });
}
