import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 2) return NextResponse.json([]);

  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id: string }).id : null;

  try {
    const keyword = q.toUpperCase();
    const include = {
      directors: { where: { isActive: true }, orderBy: { createdAt: "asc" as const } },
      charges:   { orderBy: { createdAt: "asc" as const } },
    };

    // ── Section 1: User's private companies (if logged in) ──
    let myCompanies: Array<Record<string, unknown>> = [];
    if (userId) {
      const rows = await prisma.$queryRawUnsafe<Array<{
        id: string; companyName: string; cin: string | null;
        entityType: string | null; regAddress: string | null;
        incorporationDate: string | null;
      }>>(
        `SELECT id, "companyName", cin, "entityType", "regAddress", "incorporationDate"
         FROM csi_companies
         WHERE "userId" = $1 AND (
           LOWER("companyName") LIKE LOWER($2)
           OR LOWER(COALESCE(cin,'')) LIKE LOWER($2)
         )
         ORDER BY "updatedAt" DESC
         LIMIT 5`,
        userId, `%${q}%`
      );
      myCompanies = rows.map(r => ({
        ...r,
        _source: "my_companies",
        directors: [],
        charges: [],
      }));
    }

    // ── Section 2: MCA public database ──
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
                { din:  { contains: q, mode: "insensitive" } },
              ],
            },
          },
        },
        take: 5, include,
      }),
    ]);

    const seen = new Set<string>();
    const mcaResults: Array<Record<string, unknown>> = [];
    for (const c of [...byName, ...byCin, ...byDirector]) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        mcaResults.push({ ...c, _source: "mca" });
      }
    }

    // Combine: my companies first, then MCA (deduplicated by CIN)
    const cinSeen = new Set<string>(myCompanies.map(c => String(c.cin || "")).filter(Boolean));
    const filteredMca = mcaResults.filter(c => !cinSeen.has(String(c.cin || "")));

    const combined = [
      ...myCompanies,
      ...filteredMca.slice(0, 8),
    ];

    return NextResponse.json(combined.slice(0, 10));
  } catch (err) {
    console.error("Company search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
