import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Returns distinct bank names (cached — rarely changes)
export const revalidate = 86400; // 24 hours

export async function GET() {
  try {
    const rows = await prisma.iFSCBranch.findMany({
      distinct: ["bank"],
      select:   { bank: true },
      orderBy:  { bank: "asc" },
    });
    const banks = rows.map(r => r.bank).filter(Boolean);
    return NextResponse.json(banks);
  } catch (err) {
    console.error("IFSC banks error:", err);
    return NextResponse.json([], { status: 500 });
  }
}
