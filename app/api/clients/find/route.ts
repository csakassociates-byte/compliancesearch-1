import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  const cin  = searchParams.get("cin");
  if (!name && !cin) return NextResponse.json({ error: "name or cin required" }, { status: 400 });

  // Try CIN first (exact, case-insensitive) — more reliable than name matching
  if (cin) {
    const bycin = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM csi_companies WHERE "userId" = $1 AND LOWER("cin") = LOWER($2) LIMIT 1`,
      userId, cin.trim()
    );
    if (bycin.length) return NextResponse.json({ companyId: bycin[0].id, source: "cin" });
  }

  // Fall back to exact name match
  if (name) {
    const byname = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM csi_companies WHERE "userId" = $1 AND LOWER("companyName") = LOWER($2) LIMIT 1`,
      userId, name.trim()
    );
    if (byname.length) return NextResponse.json({ companyId: byname[0].id, source: "name" });
  }

  return NextResponse.json({ companyId: null });
}
