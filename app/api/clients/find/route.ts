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
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const result = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM csi_companies WHERE "userId" = $1 AND LOWER("companyName") = LOWER($2) LIMIT 1`,
    userId, name.trim()
  );

  if (!result.length) return NextResponse.json({ companyId: null });
  return NextResponse.json({ companyId: result[0].id });
}
