import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamMemberIds } from "@/lib/team";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cin = req.nextUrl.searchParams.get("cin")?.trim();
  if (!cin) return NextResponse.json({ error: "cin required" }, { status: 400 });

  // 1. Full master data from CompanyProfile (Excel import)
  const company = await prisma.companyProfile.findUnique({
    where: { cin },
    include: {
      directors: { orderBy: { createdAt: "asc" } },
      charges:   { orderBy: { createdAt: "asc" } },
    },
  });

  if (company) return NextResponse.json({ company });

  // 2. Fallback: basic info from csi_companies (manually added or compliance-monitor entry)
  const memberIds = await getTeamMemberIds(userId);
  const rows = await prisma.$queryRawUnsafe<Array<{
    id: string; companyName: string; cin: string | null;
    entityType: string | null; incorporationDate: string | null;
    regAddress: string | null;
  }>>(
    `SELECT id, "companyName", cin, "entityType", "incorporationDate", "regAddress"
     FROM csi_companies
     WHERE "userId" = ANY($1::text[]) AND (cin = $2 OR LOWER(TRIM("companyName")) = LOWER(TRIM($2)))
     LIMIT 1`,
    memberIds, cin
  );

  if (rows.length === 0) return NextResponse.json({ error: "Master data not found" }, { status: 404 });

  const r = rows[0];
  return NextResponse.json({
    company: {
      id: r.id, cin: r.cin ?? cin,
      companyName: r.companyName,
      entityType: r.entityType,
      incorporationDate: r.incorporationDate,
      regAddress: r.regAddress,
      directors: [], charges: [],
      // marker so UI knows this is partial data
      _partial: true,
    },
  });
}
