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
  const type = searchParams.get("type"); // "director" | "shareholder" | null
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  let sql = `SELECT p.*, COALESCE(json_agg(s.*) FILTER (WHERE s.id IS NOT NULL), '[]') as shareholders
    FROM csi_persons p
    LEFT JOIN csi_shareholders s ON s."personId" = p.id
    WHERE p."userId" = $1 AND p."companyId" = $2`;
  const params: unknown[] = [userId, companyId];

  if (type === "director") {
    sql += ` AND p."isDirector" = true`;
  } else if (type === "shareholder") {
    sql += ` AND p."isShareholder" = true`;
  }
  sql += ` GROUP BY p.id ORDER BY p."createdAt" ASC`;

  const persons = await prisma.$queryRawUnsafe<unknown[]>(sql, ...params);
  return NextResponse.json({ persons });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json() as {
    companyId: string;
    name: string;
    fatherName?: string;
    dateOfBirth?: string;
    mobile?: string;
    email?: string;
    presentAddress?: string;
    permanentAddress?: string;
    aadhaarNo?: string;
    panNo?: string;
    accountNo?: string;
    ifscCode?: string;
    bankName?: string;
    nationality?: string;
    occupation?: string;
    occupationCategory?: string;
    din?: string;
    dateOfJoining?: string;
    designation?: string;
    directorCategory?: string;
    nomineeName?: string;
    nomineeRelation?: string;
    nomineeAddress?: string;
    dematDpId?: string;
    dematClientId?: string;
    isDirector?: boolean;
    isShareholder?: boolean;
  };

  if (!body.companyId || !body.name?.trim())
    return NextResponse.json({ error: "companyId and name are required" }, { status: 400 });

  // Check for existing person by (userId + companyId + LOWER(name))
  const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM csi_persons WHERE "userId" = $1 AND "companyId" = $2 AND LOWER(name) = LOWER($3) LIMIT 1`,
    userId, body.companyId, body.name.trim()
  );

  if (existing.length > 0) {
    // Update
    await prisma.$executeRawUnsafe(
      `UPDATE csi_persons SET
        "fatherName" = COALESCE($3, "fatherName"),
        "dateOfBirth" = COALESCE($4, "dateOfBirth"),
        mobile = COALESCE($5, mobile),
        email = COALESCE($6, email),
        "presentAddress" = COALESCE($7, "presentAddress"),
        "permanentAddress" = COALESCE($8, "permanentAddress"),
        "aadhaarNo" = COALESCE($9, "aadhaarNo"),
        "panNo" = COALESCE($10, "panNo"),
        "accountNo" = COALESCE($11, "accountNo"),
        "ifscCode" = COALESCE($12, "ifscCode"),
        "bankName" = COALESCE($13, "bankName"),
        nationality = COALESCE($14, nationality),
        occupation = COALESCE($15, occupation),
        "occupationCategory" = COALESCE($16, "occupationCategory"),
        din = COALESCE($17, din),
        "dateOfJoining" = COALESCE($18, "dateOfJoining"),
        designation = COALESCE($19, designation),
        "directorCategory" = COALESCE($20, "directorCategory"),
        "nomineeName" = COALESCE($21, "nomineeName"),
        "nomineeRelation" = COALESCE($22, "nomineeRelation"),
        "nomineeAddress" = COALESCE($23, "nomineeAddress"),
        "dematDpId" = COALESCE($24, "dematDpId"),
        "dematClientId" = COALESCE($25, "dematClientId"),
        "isDirector" = CASE WHEN $26::boolean IS NOT NULL THEN $26::boolean ELSE "isDirector" END,
        "isShareholder" = CASE WHEN $27::boolean IS NOT NULL THEN $27::boolean ELSE "isShareholder" END,
        "updatedAt" = NOW()
       WHERE id = $1 AND "userId" = $2`,
      existing[0].id, userId,
      body.fatherName || null, body.dateOfBirth || null,
      body.mobile || null, body.email || null,
      body.presentAddress || null, body.permanentAddress || null,
      body.aadhaarNo || null, body.panNo || null,
      body.accountNo || null, body.ifscCode || null, body.bankName || null,
      body.nationality || null, body.occupation || null, body.occupationCategory || null,
      body.din || null, body.dateOfJoining || null,
      body.designation || null, body.directorCategory || null,
      body.nomineeName || null, body.nomineeRelation || null, body.nomineeAddress || null,
      body.dematDpId || null, body.dematClientId || null,
      body.isDirector ?? null, body.isShareholder ?? null
    );
    return NextResponse.json({ id: existing[0].id });
  }

  // Insert new
  const id = crypto.randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO csi_persons (
      id, "userId", "companyId", name, "fatherName", "dateOfBirth",
      mobile, email, "presentAddress", "permanentAddress",
      "aadhaarNo", "panNo", "accountNo", "ifscCode", "bankName",
      nationality, occupation, "occupationCategory",
      din, "dateOfJoining", designation, "directorCategory",
      "nomineeName", "nomineeRelation", "nomineeAddress",
      "dematDpId", "dematClientId", "isDirector", "isShareholder"
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29)`,
    id, userId, body.companyId, body.name.trim(),
    body.fatherName || null, body.dateOfBirth || null,
    body.mobile || null, body.email || null,
    body.presentAddress || null, body.permanentAddress || null,
    body.aadhaarNo || null, body.panNo || null,
    body.accountNo || null, body.ifscCode || null, body.bankName || null,
    body.nationality || 'Indian', body.occupation || null, body.occupationCategory || null,
    body.din || null, body.dateOfJoining || null,
    body.designation || null, body.directorCategory || null,
    body.nomineeName || null, body.nomineeRelation || null, body.nomineeAddress || null,
    body.dematDpId || null, body.dematClientId || null,
    body.isDirector ?? false, body.isShareholder ?? false
  );
  return NextResponse.json({ id });
}
