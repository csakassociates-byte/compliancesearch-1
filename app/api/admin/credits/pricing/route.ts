import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(session: any) {
  return !!session;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const pricing = await prisma.csi_tool_pricing.findMany({ orderBy: { toolSlug: "asc" } });
  return NextResponse.json(pricing);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { toolSlug, creditCost } = await req.json();
  if (!toolSlug || creditCost == null || creditCost < 0) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const updated = await prisma.csi_tool_pricing.update({
    where: { toolSlug },
    data: { creditCost: Number(creditCost), updatedAt: new Date() },
  });
  return NextResponse.json({ success: true, pricing: updated });
}
