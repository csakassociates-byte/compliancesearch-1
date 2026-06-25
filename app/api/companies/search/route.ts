import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamMemberIds } from "@/lib/team";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 2) return NextResponse.json([]);

  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id: string }).id : null;

  try {
    const include = {
      directors: { where: { isActive: true }, orderBy: { createdAt: "asc" as const } },
      charges:   { orderBy: { createdAt: "asc" as const } },
    };

    // ── Logged-in: search companies visible to the whole team ──
    if (userId) {
      const memberIds = await getTeamMemberIds(userId);
      const [byName, byCin] = await Promise.all([
        prisma.companyProfile.findMany({
          where: {
            uploadedBy: { in: memberIds },
            companyName: { contains: q, mode: "insensitive" },
          },
          take: 8, include,
        }),
        prisma.companyProfile.findMany({
          where: {
            uploadedBy: { in: memberIds },
            cin: { contains: q, mode: "insensitive" },
          },
          take: 5, include,
        }),
      ]);

      // Deduplicate
      const seen = new Set<string>();
      const results = [];
      for (const c of [...byName, ...byCin]) {
        if (!seen.has(c.id)) {
          seen.add(c.id);
          results.push({ ...c, _source: "my_companies" });
        }
      }

      return NextResponse.json(results.slice(0, 10));
    }

    // ── Not logged in: return empty (search is login-gated) ──
    return NextResponse.json([]);

  } catch (err) {
    console.error("Company search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
