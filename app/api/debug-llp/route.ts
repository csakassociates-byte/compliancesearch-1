import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — show entityType distribution + companies that look like LLPs
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const distribution = await prisma.$queryRawUnsafe<Array<{ entityType: string | null; cnt: bigint }>>(
    `SELECT "entityType", COUNT(*) as cnt FROM csi_companies WHERE "userId" = $1 GROUP BY "entityType" ORDER BY cnt DESC`,
    userId
  );

  // Companies with LLPIN pattern (AAA-1234) or 'LLP' in name
  const llpLike = await prisma.$queryRawUnsafe<Array<{ id: string; companyName: string; cin: string | null; entityType: string | null }>>(
    `SELECT id, "companyName", cin, "entityType"
     FROM csi_companies
     WHERE "userId" = $1
       AND (
         cin ~ '^[A-Z]{3}-[0-9]+$'
         OR UPPER("companyName") LIKE '%LLP%'
         OR UPPER("companyName") LIKE '%LIMITED LIABILITY%'
       )
     ORDER BY "companyName"`,
    userId
  );

  return NextResponse.json({
    distribution: distribution.map(r => ({ entityType: r.entityType, count: Number(r.cnt) })),
    llpLikeCompanies: llpLike,
  });
}

// POST — fix entityType for given company ids
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { ids } = body as { ids: string[] };
  if (!ids?.length) return NextResponse.json({ error: "ids required" }, { status: 400 });

  const result = await prisma.$executeRawUnsafe(
    `UPDATE csi_companies SET "entityType" = 'llp', "updatedAt" = NOW()
     WHERE id = ANY($1::text[]) AND "userId" = $2`,
    ids, userId
  );

  return NextResponse.json({ updated: result });
}
