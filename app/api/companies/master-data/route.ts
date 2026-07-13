import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cin = req.nextUrl.searchParams.get("cin")?.trim();
  if (!cin) return NextResponse.json({ error: "cin required" }, { status: 400 });

  const company = await prisma.companyProfile.findUnique({
    where: { cin },
    include: {
      directors: { orderBy: { createdAt: "asc" } },
      charges:   { orderBy: { createdAt: "asc" } },
    },
  });

  if (!company) return NextResponse.json({ error: "Master data not found" }, { status: 404 });
  return NextResponse.json({ company });
}
