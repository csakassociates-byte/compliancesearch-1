import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamMemberIds } from "@/lib/team";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  // One-time migration: add signatureBase64 column if missing
  await prisma.$executeRawUnsafe(
    `ALTER TABLE csi_persons ADD COLUMN IF NOT EXISTS "signatureBase64" TEXT`
  );

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId"); // csi_companies.id
  const type = searchParams.get("type"); // "director" | "shareholder" | null
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  const memberIds = await getTeamMemberIds(userId);

  // ── Get company's CIN from csi_companies ──────────────────────────
  // No userId filter: companyId is already a unique UUID; team members must also be able to load
  const csiRows = await prisma.$queryRawUnsafe<Array<{ cin: string | null; companyName: string }>>(
    `SELECT cin, "companyName" FROM csi_companies WHERE id = $1 LIMIT 1`,
    companyId
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
  type KycRow = {
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
    signatureBase64: string | null;
    isDirector: boolean; isShareholder: boolean;
  };

  // Company-specific KYC rows (highest priority)
  const kycRows = await prisma.$queryRawUnsafe<KycRow[]>(
    `SELECT * FROM csi_persons WHERE "userId" = ANY($1::text[]) AND "companyId" = $2 ORDER BY "createdAt" ASC`,
    memberIds, companyId
  );

  // Build KYC lookup by DIN (preferred) or normalized name
  const kycByDin  = new Map<string, KycRow>();
  const kycByName = new Map<string, KycRow>();
  for (const k of kycRows) {
    if (k.din)  kycByDin.set(k.din.trim(), k);
    kycByName.set(k.name.trim().toUpperCase(), k);
  }

  // ── Auto-sync: pull KYC from latest annual filing document if csi_persons is stale ──
  // Runs server-side on every GET so Dashboard always shows up-to-date data.
  try {
    const docRows = await prisma.$queryRawUnsafe<Array<{ formDataJson: string }>>(
      `SELECT "formDataJson" FROM csi_documents
       WHERE "companyId" = $1 AND type = 'annual_filing'
       ORDER BY "updatedAt" DESC LIMIT 1`,
      companyId
    );
    if (docRows.length && docRows[0].formDataJson) {
      const docData = JSON.parse(docRows[0].formDataJson) as {
        data?: {
          directors?: Array<{
            name?: string; din?: string; pan?: string; fatherName?: string;
            dateOfBirth?: string; email?: string; address?: string;
            occupation?: string; nationality?: string; designation?: string;
            category?: string; dateOfAppointment?: string;
          }>;
          shareholders?: Array<{
            name?: string; pan?: string; address?: string;
          }>;
        };
      };
      const docDirs = docData?.data?.directors || [];
      const docShs = docData?.data?.shareholders || [];
      // Upsert each director from the document
      for (const d of docDirs) {
        if (!d.name?.trim()) continue;
        const existing2 = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT id FROM csi_persons WHERE "userId" = ANY($1::text[]) AND "companyId" = $2
           AND (LOWER(name) = LOWER($3) OR (din IS NOT NULL AND din = $4)) LIMIT 1`,
          memberIds, companyId, d.name.trim(), d.din?.trim() || '__NONE__'
        );
        const pan   = d.pan?.trim()        || null;
        const dob   = d.dateOfBirth?.trim() || null;
        const fname = d.fatherName?.trim()  || null;
        const email = d.email?.trim()       || null;
        const addr  = d.address?.trim()     || null;
        const occ   = d.occupation?.trim()  || null;
        const nat   = d.nationality?.trim() || null;
        const desig = d.designation?.trim() || null;
        const cat   = d.category?.trim()    || null;
        const doj   = d.dateOfAppointment?.trim() || null;
        const din   = d.din?.trim()         || null;
        if (existing2.length) {
          await prisma.$executeRawUnsafe(
            `UPDATE csi_persons SET
              "panNo"          = COALESCE(NULLIF($3,''),  "panNo"),
              "fatherName"     = COALESCE(NULLIF($4,''),  "fatherName"),
              "dateOfBirth"    = COALESCE(NULLIF($5,''),  "dateOfBirth"),
              email            = COALESCE(NULLIF($6,''),  email),
              "presentAddress" = COALESCE(NULLIF($7,''),  "presentAddress"),
              occupation       = COALESCE(NULLIF($8,''),  occupation),
              nationality      = COALESCE(NULLIF($9,''),  nationality),
              designation      = COALESCE(NULLIF($10,''), designation),
              "directorCategory" = COALESCE(NULLIF($11,''), "directorCategory"),
              "dateOfJoining"  = COALESCE(NULLIF($12,''), "dateOfJoining"),
              din              = COALESCE(NULLIF($13,''), din),
              "isDirector"     = TRUE,
              "updatedAt"      = NOW()
             WHERE id = $1 AND "userId" = ANY($2::text[])`,
            existing2[0].id, memberIds,
            pan, fname, dob, email, addr, occ, nat, desig, cat, doj, din
          );
        } else {
          const crypto = (await import("crypto")).default;
          await prisma.$executeRawUnsafe(
            `INSERT INTO csi_persons (id,"userId","companyId",name,din,"panNo","fatherName","dateOfBirth",email,"presentAddress",occupation,nationality,designation,"directorCategory","dateOfJoining","isDirector","isShareholder")
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,TRUE,FALSE)
             ON CONFLICT DO NOTHING`,
            crypto.randomUUID(), userId, companyId,
            d.name.trim(), din, pan, fname, dob, email, addr, occ, nat, desig, cat, doj
          );
        }
      }
      // Upsert each shareholder from the document
      for (const s of docShs) {
        if (!s.name?.trim()) continue;
        const existing3 = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT id FROM csi_persons WHERE "userId" = ANY($1::text[]) AND "companyId" = $2
           AND LOWER(name) = LOWER($3) LIMIT 1`,
          memberIds, companyId, s.name.trim()
        );
        const span = s.pan?.trim()     || null;
        const saddr = s.address?.trim() || null;
        if (existing3.length) {
          await prisma.$executeRawUnsafe(
            `UPDATE csi_persons SET
              "panNo"          = COALESCE(NULLIF($3,''), "panNo"),
              "presentAddress" = COALESCE(NULLIF($4,''), "presentAddress"),
              "isShareholder"  = TRUE,
              "updatedAt"      = NOW()
             WHERE id = $1 AND "userId" = ANY($2::text[])`,
            existing3[0].id, memberIds, span, saddr
          );
        } else {
          const crypto = (await import("crypto")).default;
          await prisma.$executeRawUnsafe(
            `INSERT INTO csi_persons (id,"userId","companyId",name,"panNo","presentAddress","isDirector","isShareholder")
             VALUES ($1,$2,$3,$4,$5,$6,FALSE,TRUE)
             ON CONFLICT DO NOTHING`,
            crypto.randomUUID(), userId, companyId,
            s.name.trim(), span, saddr
          );
        }
      }
      // Re-fetch kycRows after sync so this request returns fresh data
      const fresh = await prisma.$queryRawUnsafe<KycRow[]>(
        `SELECT * FROM csi_persons WHERE "userId" = ANY($1::text[]) AND "companyId" = $2 ORDER BY "createdAt" ASC`,
        memberIds, companyId
      );
      kycRows.length = 0;
      kycRows.push(...fresh);
      kycByDin.clear(); kycByName.clear();
      for (const k of kycRows) {
        if (k.din) kycByDin.set(k.din.trim(), k);
        kycByName.set(k.name.trim().toUpperCase(), k);
      }
    }
  } catch { /* non-fatal: sync failure doesn't break the response */ }

  // ── Cross-company KYC fallback: if a director has no KYC in this company,
  //    look up the same DIN in any other company to pre-fill personal details ──
  const missingDins = profileDirectors
    .filter(d => d.din && !kycByDin.has(d.din.trim()))
    .map(d => d.din!.trim());

  if (missingDins.length > 0) {
    const crossRows = await prisma.$queryRawUnsafe<KycRow[]>(
      `SELECT DISTINCT ON (din) * FROM csi_persons
       WHERE "userId" = ANY($1::text[]) AND din = ANY($2::text[])
         AND "companyId" != $3
       ORDER BY din, "updatedAt" DESC`,
      memberIds, missingDins, companyId
    );
    for (const k of crossRows) {
      if (k.din && !kycByDin.has(k.din.trim())) {
        // Mark as cross-company source so id is null (no record in this company yet)
        kycByDin.set(k.din.trim(), { ...k, id: `xc:${k.id}` });
      }
    }
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
        // KYC from csi_persons (null if not filled yet or cross-company pre-fill)
        id: (kyc?.id && !kyc.id.startsWith('xc:')) ? kyc.id : null,
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
        signatureBase64: kyc?.signatureBase64 ?? null,
        kycComplete: !!(kyc?.panNo && kyc?.mobile),
      };
    });

    // If no CompanyProfile directors exist, fall back to csi_persons rows marked isDirector
    const directorPersons = kycRows.filter(k => k.isDirector);
    const fallback = directorPersons
      .filter(k => !merged.some(m => (k.din && m.din === k.din) || m.name.trim().toUpperCase() === k.name.trim().toUpperCase()))
      .map(k => ({
        _directorId: null, _source: "csi_persons",
        id: k.id, companyId, companyName,
        name: k.name, din: k.din, designation: k.designation,
        category: k.directorCategory, appointedAt: k.dateOfJoining,
        isActive: true, isDirector: true, isShareholder: k.isShareholder,
        fatherName: k.fatherName, dateOfBirth: k.dateOfBirth,
        mobile: k.mobile, email: k.email,
        presentAddress: k.presentAddress, permanentAddress: k.permanentAddress,
        aadhaarNo: k.aadhaarNo, panNo: k.panNo,
        accountNo: k.accountNo, ifscCode: k.ifscCode, bankName: k.bankName,
        nationality: k.nationality ?? 'Indian', occupation: k.occupation,
        occupationCategory: k.occupationCategory, dateOfJoining: k.dateOfJoining,
        directorCategory: k.directorCategory, nomineeName: k.nomineeName,
        nomineeRelation: k.nomineeRelation, nomineeAddress: k.nomineeAddress,
        dematDpId: k.dematDpId, dematClientId: k.dematClientId,
        signatureBase64: k.signatureBase64,
        kycComplete: !!(k.panNo && k.mobile),
      }));

    const allMerged = [...merged, ...fallback];
    if (type === "director") return NextResponse.json({ persons: allMerged });
  }

  // ── type=all: return every csi_persons row for this company ─────
  // Used by AddShareholderModal quick-select and openKYC (C-3, C-4, M-9 fix)
  if (type === "all") {
    return NextResponse.json({ persons: kycRows });
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
    signatureBase64?: string;
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
        "signatureBase64" = COALESCE($28, "signatureBase64"),
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
      body.isDirector ?? null, body.isShareholder ?? null,
      body.signatureBase64||null
    );
    return NextResponse.json({ id: existing[0].id });
  }

  const id = crypto.randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO csi_persons (
      id,"userId","companyId",name,"fatherName","dateOfBirth",mobile,email,
      "presentAddress","permanentAddress","aadhaarNo","panNo","accountNo","ifscCode","bankName",
      nationality,occupation,"occupationCategory",din,"dateOfJoining",designation,"directorCategory",
      "nomineeName","nomineeRelation","nomineeAddress","dematDpId","dematClientId","isDirector","isShareholder","signatureBase64"
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30)`,
    id, userId, body.companyId, body.name.trim(),
    body.fatherName||null, body.dateOfBirth||null, body.mobile||null, body.email||null,
    body.presentAddress||null, body.permanentAddress||null,
    body.aadhaarNo||null, body.panNo||null, body.accountNo||null, body.ifscCode||null, body.bankName||null,
    body.nationality||'Indian', body.occupation||null, body.occupationCategory||null,
    body.din||null, body.dateOfJoining||null, body.designation||null, body.directorCategory||null,
    body.nomineeName||null, body.nomineeRelation||null, body.nomineeAddress||null,
    body.dematDpId||null, body.dematClientId||null,
    body.isDirector ?? false, body.isShareholder ?? false, body.signatureBase64||null
  );
  return NextResponse.json({ id });
}
