import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamMemberIds } from "@/lib/team";

async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS csi_annual_compliance (
      id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      "userId"            TEXT NOT NULL,
      "companyId"         TEXT,
      cin                 TEXT,
      "companyName"       TEXT,
      "financialYear"     TEXT NOT NULL,
      "docStatus"         TEXT NOT NULL DEFAULT 'awaited',
      "docStatusRemarks"  TEXT,
      "workStatus"        TEXT NOT NULL DEFAULT 'confirming',
      "workStatusRemarks" TEXT,
      "inc20aStatus"      TEXT NOT NULL DEFAULT 'pending',
      "balanceSheetReady" BOOLEAN NOT NULL DEFAULT false,
      "udinStatutory"     TEXT,
      "udinTaxAudit"      TEXT,
      "aoc4Srn"           TEXT,
      "mgt7Srn"           TEXT,
      "adt1Srn"           TEXT,
      "adt1FromFy"        TEXT,
      "adt1ToFy"          TEXT,
      "dpt3Applicable"    BOOLEAN NOT NULL DEFAULT false,
      "dpt3Srn"           TEXT,
      remarks             TEXT,
      "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS idx_csi_ac_userId ON csi_annual_compliance("userId")`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS idx_csi_ac_fy ON csi_annual_compliance("financialYear")`
  );
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const url = new URL(req.url);
    const fy = url.searchParams.get("fy") || "2024-25";

    await ensureTable();
    const memberIds = await getTeamMemberIds(userId);

    // Derive FY end date: FY "2025-26" → 31 Mar 2026; "2024-25" → 31 Mar 2025
    const fyEndYear = parseInt(fy.split("-")[0]) + 1;
    const fyEndDate = new Date(`${fyEndYear}-03-31`);

    // All companies for this user/team (filter by FY in JS to handle any date format)
    const allCompanies = await prisma.$queryRawUnsafe<Array<{
      id: string; companyName: string; cin: string | null;
      incorporationDate: string | null; entityType: string | null; regAddress: string | null;
    }>>(
      `SELECT id, "companyName", cin, "incorporationDate", "entityType", "regAddress"
       FROM csi_companies
       WHERE "userId" = ANY($1::text[])
       ORDER BY LOWER("companyName") ASC`,
      memberIds
    );

    // Parse incorporation date safely — handles YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY
    function parseIncDate(raw: string | null): Date | null {
      if (!raw || !raw.trim()) return null;
      const s = raw.trim();
      // ISO format YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s.slice(0, 10));
      // Indian format DD/MM/YYYY or DD-MM-YYYY
      const m = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
      if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`);
      return null;
    }

    // Only include companies incorporated on or before the FY end date
    // Companies with no/unparseable date are always included
    const companies = allCompanies.filter(c => {
      const incDate = parseIncDate(c.incorporationDate);
      if (!incDate || isNaN(incDate.getTime())) return true; // unknown → include
      return incDate <= fyEndDate;
    });

    // Compliance records for this FY
    // Ensure new columns exist (for existing DBs)
    await prisma.$executeRawUnsafe(`ALTER TABLE csi_annual_compliance ADD COLUMN IF NOT EXISTS "docStatus" TEXT NOT NULL DEFAULT 'awaited'`);
    await prisma.$executeRawUnsafe(`ALTER TABLE csi_annual_compliance ADD COLUMN IF NOT EXISTS "docStatusRemarks" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE csi_annual_compliance ADD COLUMN IF NOT EXISTS "itrStatus" TEXT NOT NULL DEFAULT 'pending'`);
    await prisma.$executeRawUnsafe(`ALTER TABLE csi_annual_compliance ADD COLUMN IF NOT EXISTS "itrAckNo" TEXT`);

    // Auto-fix: update any existing compliance records where inc20aStatus is still 'pending'
    // but the company was incorporated before 2 Nov 2018 (INC-20A not applicable for them)
    // Auto-fix INC-20A for pre-2018 companies — only cast ISO-format dates (YYYY-MM-DD)
    await prisma.$executeRawUnsafe(`
      UPDATE csi_annual_compliance ac
      SET "inc20aStatus" = 'na', "updatedAt" = NOW()
      WHERE ac."inc20aStatus" = 'pending'
        AND EXISTS (
          SELECT 1 FROM csi_companies c
          WHERE (c.id = ac."companyId" OR (ac.cin IS NOT NULL AND c.cin = ac.cin))
            AND c."incorporationDate" IS NOT NULL
            AND c."incorporationDate" ~ '^\\d{4}-\\d{2}-\\d{2}'
            AND c."incorporationDate"::date < '2018-11-02'
        )
    `);

    const records = await prisma.$queryRawUnsafe<Array<{
      id: string; companyId: string | null; cin: string | null;
      docStatus: string; docStatusRemarks: string | null;
      workStatus: string; workStatusRemarks: string | null;
      inc20aStatus: string; balanceSheetReady: boolean;
      udinStatutory: string | null; udinTaxAudit: string | null;
      aoc4Srn: string | null; mgt7Srn: string | null;
      adt1Srn: string | null; adt1FromFy: string | null; adt1ToFy: string | null;
      dpt3Applicable: boolean; dpt3Srn: string | null;
      itrStatus: string; itrAckNo: string | null;
      remarks: string | null;
    }>>(
      `SELECT id, "companyId", cin, "docStatus", "docStatusRemarks",
              "workStatus", "workStatusRemarks",
              "inc20aStatus", "balanceSheetReady", "udinStatutory", "udinTaxAudit",
              "aoc4Srn", "mgt7Srn", "adt1Srn", "adt1FromFy", "adt1ToFy",
              "dpt3Applicable", "dpt3Srn",
              COALESCE("itrStatus", 'pending') as "itrStatus", "itrAckNo",
              remarks
       FROM csi_annual_compliance
       WHERE "userId" = ANY($1::text[]) AND "financialYear" = $2`,
      memberIds, fy
    );

    // Prev FY records for ADT-1 carry-forward
    const [prevFyStart] = fy.split("-");
    const prevFyStartNum = parseInt(prevFyStart) - 1;
    const prevFy = `${prevFyStartNum}-${String(prevFyStartNum + 1).slice(-2)}`;
    const prevRecords = await prisma.$queryRawUnsafe<Array<{
      companyId: string | null; cin: string | null;
      adt1Srn: string | null; adt1FromFy: string | null; adt1ToFy: string | null;
    }>>(
      `SELECT "companyId", cin, "adt1Srn", "adt1FromFy", "adt1ToFy"
       FROM csi_annual_compliance
       WHERE "userId" = ANY($1::text[]) AND "financialYear" = $2
         AND "adt1Srn" IS NOT NULL AND "adt1Srn" != ''`,
      memberIds, prevFy
    );
    const prevAdt1ById  = new Map<string, (typeof prevRecords)[0]>();
    const prevAdt1ByCin = new Map<string, (typeof prevRecords)[0]>();
    for (const p of prevRecords) {
      if (p.companyId) prevAdt1ById.set(p.companyId, p);
      if (p.cin)       prevAdt1ByCin.set(p.cin, p);
    }

    // INC-20A carry-forward: it is a one-time filing — once filed, it stays filed forever
    // Fetch any past FY record where inc20aStatus = 'filed' for each company
    const inc20aFiledRecords = await prisma.$queryRawUnsafe<Array<{
      companyId: string | null; cin: string | null;
    }>>(
      `SELECT DISTINCT "companyId", cin
       FROM csi_annual_compliance
       WHERE "userId" = ANY($1::text[]) AND "inc20aStatus" = 'filed'`,
      memberIds
    );
    const inc20aFiledByCompanyId = new Set<string>();
    const inc20aFiledByCin       = new Set<string>();
    for (const r of inc20aFiledRecords) {
      if (r.companyId) inc20aFiledByCompanyId.add(r.companyId);
      if (r.cin)       inc20aFiledByCin.add(r.cin);
    }

    // Auto-detect attachment generation from csi_documents
    const attachments = await prisma.$queryRawUnsafe<Array<{ cin: string }>>(
      `SELECT DISTINCT "formDataJson"::jsonb #>> '{data,cin}' AS cin
       FROM csi_documents
       WHERE "userId" = ANY($1::text[]) AND type = 'annual_filing'
         AND "financialYear" = $2 AND "isFinalized" = true`,
      memberIds, fy
    );
    const attachedCins = new Set(attachments.map(a => a.cin).filter(Boolean));

    // Build lookup maps
    const recByCompanyId = new Map<string, (typeof records)[0]>();
    const recByCin = new Map<string, (typeof records)[0]>();
    for (const r of records) {
      if (r.companyId) recByCompanyId.set(r.companyId, r);
      if (r.cin) recByCin.set(r.cin, r);
    }

    const INC20A_CUTOFF = new Date("2018-11-02");
    const rows = companies.map(c => {
      const rec = recByCompanyId.get(c.id) ?? (c.cin ? recByCin.get(c.cin) : undefined);

      // INC-20A status resolution (priority order):
      // 1. Current FY record value (if explicitly set to anything other than pending)
      // 2. Carry-forward: if filed in ANY past FY → still "filed" (one-time filing)
      // 3. Auto-NA: if incorporated before 2 Nov 2018 → "na"
      // 4. Default: "pending"
      let inc20aStatus = rec?.inc20aStatus ?? "pending";
      if (inc20aStatus === "pending") {
        // Check carry-forward from any past FY
        if (inc20aFiledByCompanyId.has(c.id) || (c.cin && inc20aFiledByCin.has(c.cin))) {
          inc20aStatus = "filed";
        } else {
          const incDate = parseIncDate(c.incorporationDate);
          if (incDate && !isNaN(incDate.getTime()) && incDate < INC20A_CUTOFF) {
            inc20aStatus = "na";
          }
        }
      }

      // ADT-1 carry-forward from previous FY (if current FY has no ADT-1 but prev does
      // and the appointment period still covers the current FY)
      let adt1Srn       = rec?.adt1Srn ?? "";
      let adt1FromFy    = rec?.adt1FromFy ?? "";
      let adt1ToFy      = rec?.adt1ToFy ?? "";
      let adt1CarriedForward = false;
      if (!adt1Srn) {
        const prev = prevAdt1ById.get(c.id) ?? (c.cin ? prevAdt1ByCin.get(c.cin) : undefined);
        if (prev?.adt1Srn && prev.adt1ToFy && prev.adt1ToFy >= fy) {
          adt1Srn           = prev.adt1Srn;
          adt1FromFy        = prev.adt1FromFy ?? "";
          adt1ToFy          = prev.adt1ToFy;
          adt1CarriedForward = true;
        }
      }

      return {
        companyId:            c.id,
        companyName:          c.companyName,
        cin:                  c.cin ?? "",
        incorporationDate:    c.incorporationDate ?? "",
        entityType:           c.entityType ?? "",
        regAddress:           c.regAddress ?? "",
        recordId:             rec?.id ?? null,
        docStatus:            rec?.docStatus ?? "awaited",
        docStatusRemarks:     rec?.docStatusRemarks ?? "",
        workStatus:           rec?.workStatus ?? "confirming",
        workStatusRemarks:    rec?.workStatusRemarks ?? "",
        inc20aStatus,
        balanceSheetReady:    rec?.balanceSheetReady ?? false,
        udinStatutory:        rec?.udinStatutory ?? "",
        udinTaxAudit:         rec?.udinTaxAudit ?? "",
        attachmentsGenerated: !!(c.cin && attachedCins.has(c.cin)),
        aoc4Srn:              rec?.aoc4Srn ?? "",
        mgt7Srn:              rec?.mgt7Srn ?? "",
        adt1Srn,
        adt1FromFy,
        adt1ToFy,
        adt1CarriedForward,
        dpt3Applicable:       rec?.dpt3Applicable ?? false,
        dpt3Srn:              rec?.dpt3Srn ?? "",
        itrStatus:            rec?.itrStatus ?? "pending",
        itrAckNo:             rec?.itrAckNo ?? "",
        remarks:              rec?.remarks ?? "",
      };
    });

    return NextResponse.json({ rows });
  } catch (err) {
    console.error("[annual-compliance GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

const ALLOWED_FIELDS = [
  "docStatus", "docStatusRemarks",
  "workStatus", "workStatusRemarks", "inc20aStatus", "balanceSheetReady",
  "udinStatutory", "udinTaxAudit", "aoc4Srn", "mgt7Srn",
  "adt1Srn", "adt1FromFy", "adt1ToFy", "dpt3Applicable", "dpt3Srn",
  "itrStatus", "itrAckNo", "remarks",
] as const;

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id: string }).id;

    const body = await req.json() as Record<string, unknown> & {
      recordId?: string;
      companyId?: string;
      cin?: string;
      companyName?: string;
      financialYear: string;
    };

    await ensureTable();

    // Resolve INC-20A applicability from company's incorporation date
    const INC20A_CUTOFF = new Date("2018-11-02");
    async function resolveInc20aStatus(requestedStatus: string | undefined): Promise<string> {
      if (requestedStatus && requestedStatus !== "pending") return requestedStatus;
      // Look up incorporationDate from csi_companies
      const companyRows = body.companyId
        ? await prisma.$queryRawUnsafe<Array<{ incorporationDate: string | null }>>(
            `SELECT "incorporationDate" FROM csi_companies WHERE id = $1 LIMIT 1`,
            body.companyId
          )
        : body.cin
          ? await prisma.$queryRawUnsafe<Array<{ incorporationDate: string | null }>>(
              `SELECT "incorporationDate" FROM csi_companies WHERE cin = $1 LIMIT 1`,
              body.cin
            )
          : [];
      const incDateStr = companyRows[0]?.incorporationDate;
      if (incDateStr) {
        const incDate = new Date(incDateStr);
        if (!isNaN(incDate.getTime()) && incDate < INC20A_CUTOFF) return "na";
      }
      return requestedStatus ?? "pending";
    }

    if (body.recordId) {
      // UPDATE existing record
      // If inc20aStatus is being set to "pending", check if it should actually be "na"
      if ("inc20aStatus" in body && body.inc20aStatus === "pending") {
        body.inc20aStatus = await resolveInc20aStatus("pending");
      }
      const sets: string[] = [];
      const vals: unknown[] = [body.recordId, userId];
      let i = 3;
      for (const key of ALLOWED_FIELDS) {
        if (key in body) {
          sets.push(`"${key}" = $${i++}`);
          const v = body[key];
          vals.push(v === "" ? null : v);
        }
      }
      if (sets.length) {
        sets.push(`"updatedAt" = NOW()`);
        await prisma.$executeRawUnsafe(
          `UPDATE csi_annual_compliance SET ${sets.join(", ")} WHERE id = $1 AND "userId" = $2`,
          ...vals
        );
      }
      return NextResponse.json({ success: true, id: body.recordId });
    }

    // INSERT new record — resolve INC-20A from incorporation date
    const inc20aResolved = await resolveInc20aStatus(body.inc20aStatus as string | undefined);

    const rows = await prisma.$queryRawUnsafe<[{ id: string }]>(
      `INSERT INTO csi_annual_compliance
        (id, "userId", "companyId", cin, "companyName", "financialYear",
         "docStatus", "docStatusRemarks",
         "workStatus", "workStatusRemarks", "inc20aStatus", "balanceSheetReady",
         "udinStatutory", "udinTaxAudit", "aoc4Srn", "mgt7Srn",
         "adt1Srn", "adt1FromFy", "adt1ToFy", "dpt3Applicable", "dpt3Srn",
         "itrStatus", "itrAckNo", remarks)
       VALUES (gen_random_uuid()::TEXT,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
       RETURNING id`,
      userId,
      body.companyId ?? null,
      body.cin ?? null,
      body.companyName ?? null,
      body.financialYear,
      body.docStatus ?? "awaited",
      body.docStatusRemarks ?? null,
      body.workStatus ?? "confirming",
      body.workStatusRemarks ?? null,
      inc20aResolved,
      body.balanceSheetReady ?? false,
      body.udinStatutory || null,
      body.udinTaxAudit || null,
      body.aoc4Srn || null,
      body.mgt7Srn || null,
      body.adt1Srn || null,
      body.adt1FromFy || null,
      body.adt1ToFy || null,
      body.dpt3Applicable ?? false,
      body.dpt3Srn || null,
      body.itrStatus || "pending",
      body.itrAckNo || null,
      body.remarks || null,
    );

    return NextResponse.json({ success: true, id: rows[0]?.id });
  } catch (err) {
    console.error("[annual-compliance PUT]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
