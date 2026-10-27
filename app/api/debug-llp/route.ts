import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.$queryRawUnsafe<Array<{ entityType: string | null; cnt: bigint }>>(
    `SELECT "entityType", COUNT(*) as cnt FROM csi_companies WHERE "userId" = $1 GROUP BY "entityType" ORDER BY cnt DESC`,
    userId
  );

  return NextResponse.json(rows.map(r => ({ entityType: r.entityType, count: Number(r.cnt) })));
}
