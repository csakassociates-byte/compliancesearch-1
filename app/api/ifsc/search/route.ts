import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const bank  = req.nextUrl.searchParams.get("bank")?.trim()  || "";
  const q     = req.nextUrl.searchParams.get("q")?.trim()     || "";
  const state = req.nextUrl.searchParams.get("state")?.trim() || "";

  if (!bank || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const results = await prisma.iFSCBranch.findMany({
      where: {
        bank: { equals: bank, mode: "insensitive" },
        ...(state && { state: { contains: state, mode: "insensitive" } }),
        OR: [
          { branch:   { contains: q, mode: "insensitive" } },
          { city:     { contains: q, mode: "insensitive" } },
          { district: { contains: q, mode: "insensitive" } },
          { address:  { contains: q, mode: "insensitive" } },
          { ifsc:     { contains: q.toUpperCase() } },
        ],
      },
      select: {
        ifsc: true, branch: true, city: true,
        district: true, state: true, address: true,
      },
      take:    20,
      orderBy: { branch: "asc" },
    });

    return NextResponse.json(results);
  } catch (err) {
    console.error("IFSC search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
