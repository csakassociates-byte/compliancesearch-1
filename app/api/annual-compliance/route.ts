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

    // All companies for this user/team (include incorporationDate for INC-20A auto-detect)
    const companies = await prisma.$queryRawUnsafe<Array<{
      id: string; companyName: string; cin: string | null; incorporationDate: string | null;
    }>>(
      `SELECT id, "companyName", cin, "incorporationDate" FROM csi_companies
       WHERE "userId" = ANY($1::text[])
       ORDER BY LOWER("companyName") ASC`,
      memberIds
    );

    // Compliance records for this FY
    // Ensure new columns exist (for existing DBs)
    await prisma.$executeRawUnsafe(`ALTER TABLE csi_annual_compliance ADD COLUMN IF NOT EXISTS "docStatus" TEXT NOT NULL DEFAULT 'awaited'`);
    await prisma.$executeRawUnsafe(`ALTER TABLE csi_annual_compliance ADD COLUMN IF NOT EXISTS "docStatusRemarks" TEXT`);

    const records = await prisma.$queryRawUnsafe<Array<{
      id: string; companyId: string | null; cin: string | null;
      docStatus: string; docStatusRemarks: string | null;
      workStatus: string; workStatusRemarks: string | null;
      inc20aStatus: string; balanceSheetReady: boolean;
      udinStatutory: string | null; udinTaxAudit: string | null;
      aoc4Srn: string | null; mgt7Srn: string | null;
      adt1Srn: string | null; adt1FromFy: string | null; adt1ToFy: string | null;
      dpt3Applicable: boolean; dpt3Srn: string | null;
      remarks: string | null;
    }>>(
      `SELECT id, "companyId", cin, "docStatus", "docStatusRemarks",
              "workStatus", "workStatusRemarks",
              "inc20aStatus", "balanceSheetReady", "udinStatutory", "udinTaxAudit",
              "aoc4Srn", "mgt7Srn", "adt1Srn", "adt1FromFy", "adt1ToFy",
              "dpt3Applicable", "dpt3Srn", remarks
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

      // Auto-detect INC-20A: if company was incorporated before the INC-20A requirement
      // and status is still default "pending", auto-set to "na"
      let inc20aStatus = rec?.inc20aStatus ?? "pending";
      if (inc20aStatus === "pending" && c.incorporationDate) {
        const incDate = new Date(c.incorporationDate);
        if (!isNaN(incDate.getTime()) && incDate < INC20A_CUTOFF) {
          inc20aStatus = "na";
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
  "adt1Srn", "adt1FromFy", "adt1ToFy", "dpt3Applicable", "dpt3Srn", "remarks",
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

    if (body.recordId) {
      // UPDATE existing record
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

    // INSERT new record
    const rows = await prisma.$queryRawUnsafe<[{ id: string }]>(
      `INSERT INTO csi_annual_compliance
        (id, "userId", "companyId", cin, "companyName", "financialYear",
         "docStatus", "docStatusRemarks",
         "workStatus", "workStatusRemarks", "inc20aStatus", "balanceSheetReady",
         "udinStatutory", "udinTaxAudit", "aoc4Srn", "mgt7Srn",
         "adt1Srn", "adt1FromFy", "adt1ToFy", "dpt3Applicable", "dpt3Srn", remarks)
       VALUES (gen_random_uuid()::TEXT,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
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
      body.inc20aStatus ?? "pending",
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
      body.remarks || null,
    );

    return NextResponse.json({ success: true, id: rows[0]?.id });
  } catch (err) {
    console.error("[annual-compliance PUT]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
