import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rules = await prisma.complianceRule.findMany({
      where: { isActive: true },
      orderBy: { category: "asc" },
    });
    return NextResponse.json(rules);
  } catch (error) {
    console.error("Failed to fetch rules:", error);
    return NextResponse.json({ error: "Failed to fetch rules" }, { status: 500 });
  }
}
