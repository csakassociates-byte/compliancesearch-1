import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const authority = searchParams.get("authority") || "";
  const type      = searchParams.get("type") || "";

  const where: Record<string, unknown> = { isActive: true };
  if (authority) where.authority  = authority;
  if (type)      where.noticeType = type;

  const notices = await prisma.notice.findMany({
    where,
    orderBy: { issuedDate: "desc" },
    take: 50,
  });

  return NextResponse.json(notices);
}
