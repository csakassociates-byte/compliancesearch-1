import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const din = req.nextUrl.searchParams.get("din")?.trim();
  if (!din) return NextResponse.json({ error: "din required" }, { status: 400 });

  const records = await prisma.companyDirector.findMany({
    where: { din },
    include: {
      company: {
        select: { cin: true, companyName: true, entityType: true, status: true },
      },
    },
    orderBy: [{ isActive: "desc" }, { appointedAt: "desc" }],
  });

  return NextResponse.json({ records });
}
