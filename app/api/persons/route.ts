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
  const companyId = searchParams.get("companyId"); // csi_companies.id
  const type = searchParams.get("type"); // "director" | "shareholder" | null
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  // ── Get company's CIN from csi_companies ──────────────────────────
  const csiRows = await prisma.$queryRawUnsafe<Array<{ cin: string | null; companyName: string }>>(
    `SELECT cin, "companyName" FROM csi_companies WHERE id = $1 AND "userId" = $2 LIMIT 1`,
    companyId, userId
  );
  if (!csiRows.length) return NextResponse.json({ persons: [] });

  const { cin, companyName } = csiRows[0];

  // ── Get directors from CompanyDirector (via CompanyProfile by CIN) ──
  let companyProfileId: string | null = null;
  let profileDirectors: Array<{
    id: string; din: string | null; name: string;
    designation: string | null; category: string | null;
    appointedAt: string | null; isActive: boolean;
  }> = [];

  if (cin) {
    const profileRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM "CompanyProfile" WHERE cin = $1 LIMIT 1`, cin
    );
    if (profileRows.length) {
      companyProfileId = profileRows[0].id;
      profileDirectors = await prisma.$queryRawUnsafe<typeof profileDirectors>(
        `SELECT id, din, name, designation, category, "appointedAt", "isActive"
         FROM "CompanyDirector"
         WHERE "companyId" = $1
         ORDER BY "isActive" DESC, "createdAt" ASC`,
        companyProfileId
      );
    }
  }

  // ── Get existing csi_persons KYC for this company ─────────────────
  const kycRows = await prisma.$queryRawUnsafe<Array<{
    id: string; name: string; din: string | null;
    fatherName: string | null; dateOfBirth: string | null;
    mobile: string | null; email: string | null;
    presentAddress: string | null; permanentAddress: string | null;
    aadhaarNo: string | null; panNo: string | null;
    accountNo: string | null; ifscCode: string | null; bankName: string | null;
    nationality: string | null; occupation: string | null; occupationCategory: string | null;
    dateOfJoining: string | null; designation: string | null; directorCategory: string | null;
    nomineeName: string | null; nomineeRelation: string | null; nomineeAddress: string | null;
    dematDpId: string | null; dematClientId: string | null;
    isDirector: boolean; isShareholder: boolean;
  }>>(
    `SELECT * FROM csi_persons WHERE "userId" = $1 AND "companyId" = $2 ORDER BY "createdAt" ASC`,
    userId, companyId
  );

  // Build KYC lookup by DIN (preferred) or normalized name
  const kycByDin  = new Map<string, typeof kycRows[0]>();
  const kycByName = new Map<string, typeof kycRows[0]>();
  for (const k of kycRows) {
    if (k.din)  kycByDin.set(k.din.trim(), k);
    kycByName.set(k.name.trim().toUpperCase(), k);
  }

  // ── Merge: CompanyDirector + csi_persons KYC ─────────────────────
  if (type !== "shareholder") {
    // Return directors merged with KYC
    const merged = profileDirectors.map(dir => {
      const kyc = (dir.din && kycByDin.get(dir.din.trim()))
        || kycByName.get(dir.name.trim().toUpperCase())
        || null;
      return {
        // Source: CompanyDirector
        _directorId: dir.id,
        _source: "company_director",
        name: dir.name,
        din: dir.din,
        designation: dir.designation,
        category: dir.category,
        appointedAt: dir.appointedAt,
        isActive: dir.isActive,
        isDirector: true,
        isShareholder: kyc?.isShareholder ?? false,
        // KYC from csi_persons (null if not filled yet)
        id: kyc?.id ?? null,          // csi_persons.id — null means KYC not saved yet
        companyId,
        companyName,
        fatherName: kyc?.fatherName ?? null,
        dateOfBirth: kyc?.dateOfBirth ?? null,
        mobile: kyc?.mobile ?? null,
        email: kyc?.email ?? null,
        presentAddress: kyc?.presentAddress ?? null,
        permanentAddress: kyc?.permanentAddress ?? null,
        aadhaarNo: kyc?.aadhaarNo ?? null,
        panNo: kyc?.panNo ?? null,
        accountNo: kyc?.accountNo ?? null,
        ifscCode: kyc?.ifscCode ?? null,
        bankName: kyc?.bankName ?? null,
        nationality: kyc?.nationality ?? 'Indian',
        occupation: kyc?.occupation ?? null,
        occupationCategory: kyc?.occupationCategory ?? null,
        dateOfJoining: kyc?.dateOfJoining ?? dir.appointedAt ?? null,
        directorCategory: kyc?.directorCategory ?? dir.category ?? null,
        nomineeName: kyc?.nomineeName ?? null,
        nomineeRelation: kyc?.nomineeRelation ?? null,
        nomineeAddress: kyc?.nomineeAddress ?? null,
        dematDpId: kyc?.dematDpId ?? null,
        dematClientId: kyc?.dematClientId ?? null,
        kycComplete: !!(kyc?.panNo && kyc?.mobile),
      };
    });

    if (type === "director") return NextResponse.json({ persons: merged });
  }

  // ── Shareholders from csi_persons ────────────────────────────────
  if (type === "shareholder" || !type) {
    const shareholders = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT p.*,
        COALESCE(json_agg(s.*) FILTER (WHERE s.id IS NOT NULL), '[]') as shareholders
       FROM csi_persons p
       LEFT JOIN csi_shareholders s ON s."personId" = p.id
       WHERE p."userId" = $1 AND p."companyId" = $2 AND p."isShareholder" = true
       GROUP BY p.id ORDER BY p."createdAt" ASC`,
      userId, companyId
    );
    if (type === "shareholder") return NextResponse.json({ persons: shareholders });

    // Combined: directors + shareholders (no type filter)
    const allDirectors = profileDirectors.map(dir => {
      const kyc = (dir.din && kycByDin.get(dir.din.trim()))
        || kycByName.get(dir.name.trim().toUpperCase()) || null;
      return {
        _directorId: dir.id, _source: "company_director",
        id: kyc?.id ?? null, companyId, name: dir.name, din: dir.din,
        designation: dir.designation, isActive: dir.isActive,
        isDirector: true, isShareholder: kyc?.isShareholder ?? false,
        kycComplete: !!(kyc?.panNo && kyc?.mobile),
        ...kyc,
      };
    });
    return NextResponse.json({ persons: allDirectors, shareholders });
  }

  return NextResponse.json({ persons: [] });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json() as {
    companyId: string; name: string;
    fatherName?: string; dateOfBirth?: string; mobile?: string; email?: string;
    presentAddress?: string; permanentAddress?: string;
    aadhaarNo?: string; panNo?: string; accountNo?: string; ifscCode?: string; bankName?: string;
    nationality?: string; occupation?: string; occupationCategory?: string;
    din?: string; dateOfJoining?: string; designation?: string; directorCategory?: string;
    nomineeName?: string; nomineeRelation?: string; nomineeAddress?: string;
    dematDpId?: string; dematClientId?: string;
    isDirector?: boolean; isShareholder?: boolean;
  };

  if (!body.companyId || !body.name?.trim())
    return NextResponse.json({ error: "companyId and name are required" }, { status: 400 });

  // Upsert by (userId + companyId + LOWER(name)) OR (userId + companyId + din)
  const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM csi_persons WHERE "userId" = $1 AND "companyId" = $2
     AND (LOWER(name) = LOWER($3) OR (din IS NOT NULL AND din = $4)) LIMIT 1`,
    userId, body.companyId, body.name.trim(), body.din?.trim() || '__NONE__'
  );

  if (existing.length > 0) {
    await prisma.$executeRawUnsafe(
      `UPDATE csi_persons SET
        "fatherName" = COALESCE($3, "fatherName"), "dateOfBirth" = COALESCE($4, "dateOfBirth"),
        mobile = COALESCE($5, mobile), email = COALESCE($6, email),
        "presentAddress" = COALESCE($7, "presentAddress"), "permanentAddress" = COALESCE($8, "permanentAddress"),
        "aadhaarNo" = COALESCE($9, "aadhaarNo"), "panNo" = COALESCE($10, "panNo"),
        "accountNo" = COALESCE($11, "accountNo"), "ifscCode" = COALESCE($12, "ifscCode"),
        "bankName" = COALESCE($13, "bankName"), nationality = COALESCE($14, nationality),
        occupation = COALESCE($15, occupation), "occupationCategory" = COALESCE($16, "occupationCategory"),
        din = COALESCE($17, din), "dateOfJoining" = COALESCE($18, "dateOfJoining"),
        designation = COALESCE($19, designation), "directorCategory" = COALESCE($20, "directorCategory"),
        "nomineeName" = COALESCE($21, "nomineeName"), "nomineeRelation" = COALESCE($22, "nomineeRelation"),
        "nomineeAddress" = COALESCE($23, "nomineeAddress"),
        "dematDpId" = COALESCE($24, "dematDpId"), "dematClientId" = COALESCE($25, "dematClientId"),
        "isDirector" = CASE WHEN $26::boolean IS NOT NULL THEN $26::boolean ELSE "isDirector" END,
        "isShareholder" = CASE WHEN $27::boolean IS NOT NULL THEN $27::boolean ELSE "isShareholder" END,
        "updatedAt" = NOW()
       WHERE id = $1 AND "userId" = $2`,
      existing[0].id, userId,
      body.fatherName||null, body.dateOfBirth||null, body.mobile||null, body.email||null,
      body.presentAddress||null, body.permanentAddress||null,
      body.aadhaarNo||null, body.panNo||null, body.accountNo||null, body.ifscCode||null, body.bankName||null,
      body.nationality||null, body.occupation||null, body.occupationCategory||null,
      body.din||null, body.dateOfJoining||null, body.designation||null, body.directorCategory||null,
      body.nomineeName||null, body.nomineeRelation||null, body.nomineeAddress||null,
      body.dematDpId||null, body.dematClientId||null,
      body.isDirector ?? null, body.isShareholder ?? null
    );
    return NextResponse.json({ id: existing[0].id });
  }

  const id = crypto.randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO csi_persons (
      id,"userId","companyId",name,"fatherName","dateOfBirth",mobile,email,
      "presentAddress","permanentAddress","aadhaarNo","panNo","accountNo","ifscCode","bankName",
      nationality,occupation,"occupationCategory",din,"dateOfJoining",designation,"directorCategory",
      "nomineeName","nomineeRelation","nomineeAddress","dematDpId","dematClientId","isDirector","isShareholder"
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29)`,
    id, userId, body.companyId, body.name.trim(),
    body.fatherName||null, body.dateOfBirth||null, body.mobile||null, body.email||null,
    body.presentAddress||null, body.permanentAddress||null,
    body.aadhaarNo||null, body.panNo||null, body.accountNo||null, body.ifscCode||null, body.bankName||null,
    body.nationality||'Indian', body.occupation||null, body.occupationCategory||null,
    body.din||null, body.dateOfJoining||null, body.designation||null, body.directorCategory||null,
    body.nomineeName||null, body.nomineeRelation||null, body.nomineeAddress||null,
    body.dematDpId||null, body.dematClientId||null,
    body.isDirector ?? false, body.isShareholder ?? false
  );
  return NextResponse.json({ id });
}
