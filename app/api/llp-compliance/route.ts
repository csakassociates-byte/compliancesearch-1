import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamMemberIds } from "@/lib/team";

const FY_END_MONTHS: Record<string, { form8: string; form11: string }> = {
  // Form 8 due: 30 Oct (end of FY + 6 months), Form 11 due: 30 May (end of FY + 2 months)
  "2025-26": { form8: "30 Oct 2026", form11: "30 May 2026" },
  "2024-25": { form8: "30 Oct 2025", form11: "30 May 2025" },
  "2023-24": { form8: "30 Oct 2024", form11: "30 May 2024" },
  "2022-23": { form8: "30 Oct 2023", form11: "30 May 2023" },
};

// Ensure table exists
async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS csi_llp_compliance (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "userId" TEXT NOT NULL,
      "companyId" TEXT,
      cin TEXT,
      "financialYear" TEXT NOT NULL,
      "docStatus" TEXT NOT NULL DEFAULT 'awaited',
      "docStatusRemarks" TEXT,
      "workStatus" TEXT NOT NULL DEFAULT 'pending',
      "workStatusRemarks" TEXT,
      "form8Srn" TEXT,
      "form11Srn" TEXT,
      "itrStatus" TEXT NOT NULL DEFAULT 'pending',
      "itrAckNo" TEXT,
      "udinStatutory" TEXT,
      remarks TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_csi_llp_userId ON csi_llp_compliance("userId")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_csi_llp_fy ON csi_llp_compliance("financialYear")`);
}

// GET — fetch all LLP compliance rows for the given FY
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fy = req.nextUrl.searchParams.get("fy") || "2025-26";

  await ensureTable();

  const memberIds = await getTeamMemberIds(userId);

  // Fetch all LLP companies for this team
  const llps = await prisma.$queryRawUnsafe<Array<{
    id: string; companyName: string; cin: string | null;
    incorporationDate: string | null; regAddress: string | null;
  }>>(
    `SELECT id, "companyName", cin, "incorporationDate", "regAddress"
     FROM csi_companies
     WHERE "userId" = ANY($1::text[])
       AND "entityType" = 'llp'
     ORDER BY LOWER("companyName") ASC`,
    memberIds
  );

  // Fetch existing compliance records
  const records = await prisma.$queryRawUnsafe<Array<{
    id: string; companyId: string | null; cin: string | null;
    docStatus: string; docStatusRemarks: string | null;
    workStatus: string; workStatusRemarks: string | null;
    form8Srn: string | null; form11Srn: string | null;
    itrStatus: string; itrAckNo: string | null;
    udinStatutory: string | null; remarks: string | null;
  }>>(
    `SELECT id, "companyId", cin, "docStatus", "docStatusRemarks",
            "workStatus", "workStatusRemarks",
            "form8Srn", "form11Srn",
            "itrStatus", "itrAckNo", "udinStatutory", remarks
     FROM csi_llp_compliance
     WHERE "userId" = ANY($1::text[]) AND "financialYear" = $2`,
    memberIds, fy
  );

  const recByCompany = new Map<string, typeof records[0]>();
  const recByCin = new Map<string, typeof records[0]>();
  for (const r of records) {
    if (r.companyId) recByCompany.set(r.companyId, r);
    if (r.cin) recByCin.set(r.cin, r);
  }

  const rows = llps.map(llp => {
    const rec = recByCompany.get(llp.id) ?? (llp.cin ? recByCin.get(llp.cin) : undefined);
    return {
      companyId: llp.id,
      companyName: llp.companyName,
      cin: llp.cin ?? "",
      incorporationDate: llp.incorporationDate ?? "",
      regAddress: llp.regAddress ?? "",
      recordId: rec?.id ?? null,
      docStatus: rec?.docStatus ?? "awaited",
      docStatusRemarks: rec?.docStatusRemarks ?? "",
      workStatus: rec?.workStatus ?? "pending",
      workStatusRemarks: rec?.workStatusRemarks ?? "",
      form8Srn: rec?.form8Srn ?? "",
      form11Srn: rec?.form11Srn ?? "",
      itrStatus: rec?.itrStatus ?? "pending",
      itrAckNo: rec?.itrAckNo ?? "",
      udinStatutory: rec?.udinStatutory ?? "",
      remarks: rec?.remarks ?? "",
    };
  });

  return NextResponse.json({ rows, dueDates: FY_END_MONTHS[fy] ?? null });
}

// POST — upsert a compliance record field
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { companyId, cin, financialYear, ...fields } = body;
  if (!companyId || !financialYear) return NextResponse.json({ error: "companyId and financialYear required" }, { status: 400 });

  await ensureTable();

  // Check if record exists
  const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM csi_llp_compliance WHERE "companyId" = $1 AND "financialYear" = $2 LIMIT 1`,
    companyId, financialYear
  );

  const allowed = ["docStatus","docStatusRemarks","workStatus","workStatusRemarks",
    "form8Srn","form11Srn","itrStatus","itrAckNo","udinStatutory","remarks"];
  const safeFields = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.includes(k)));

  if (existing.length > 0) {
    const sets = Object.keys(safeFields).map((k, i) => `"${k}" = $${i + 3}`).join(", ");
    if (sets) {
      await prisma.$executeRawUnsafe(
        `UPDATE csi_llp_compliance SET ${sets}, "updatedAt" = NOW() WHERE id = $1 AND $2 = $2`,
        existing[0].id, 1, ...Object.values(safeFields)
      );
    }
    return NextResponse.json({ success: true, recordId: existing[0].id });
  } else {
    const cols = ["userId","companyId","cin","financialYear", ...Object.keys(safeFields)];
    const vals = [userId, companyId, cin ?? null, financialYear, ...Object.values(safeFields)];
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(", ");
    const result = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `INSERT INTO csi_llp_compliance (${cols.map(c => `"${c}"`).join(", ")}) VALUES (${placeholders}) RETURNING id`,
      ...vals
    );
    return NextResponse.json({ success: true, recordId: result[0]?.id });
  }
}
