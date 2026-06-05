import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 2) return NextResponse.json([]);

  try {
    const keyword = q.toUpperCase();

    // Search by CIN (exact prefix), company name (contains), or director DIN/name
    const include = {
      directors: { where: { isActive: true }, orderBy: { createdAt: "asc" as const } },
      charges:   { orderBy: { createdAt: "asc" as const } },
    };

    const [byName, byCin, byDirector] = await Promise.all([
      prisma.companyProfile.findMany({
        where: { companyName: { contains: q, mode: "insensitive" } },
        take: 5, include,
      }),
      prisma.companyProfile.findMany({
        where: {
          OR: [
            { cin: { startsWith: keyword } },
            { cin: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5, include,
      }),
      prisma.companyProfile.findMany({
        where: {
          directors: {
            some: {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { din:  { contains: q,  mode: "insensitive" } },
              ],
            },
          },
        },
        take: 5, include,
      }),
    ]);

    // Merge and deduplicate by id
    const seen = new Set<string>();
    const results = [];
    for (const c of [...byName, ...byCin, ...byDirector]) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        results.push(c);
      }
    }

    return NextResponse.json(results.slice(0, 8));
  } catch (err) {
    console.error("Company search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
