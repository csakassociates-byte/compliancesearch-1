import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ruleKey: string }> }
) {
  const { ruleKey } = await params;
  const rule = await prisma.complianceRule.findUnique({ where: { ruleKey } });
  if (!rule || !rule.isActive) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rule);
}
