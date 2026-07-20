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

      // Search CompanyProfile (Excel-uploaded / MCA data) — has directors too
      const [byName, byCin] = await Promise.all([
        prisma.companyProfile.findMany({
          where: { uploadedBy: { in: memberIds }, companyName: { contains: q, mode: "insensitive" } },
          take: 8, include,
        }),
        prisma.companyProfile.findMany({
          where: { uploadedBy: { in: memberIds }, cin: { contains: q, mode: "insensitive" } },
          take: 5, include,
        }),
      ]);

      // Also search csi_companies (user's own client list — even if not in CompanyProfile)
      const [csiByName, csiByCin] = await Promise.all([
        prisma.company.findMany({
          where: { userId: { in: memberIds }, companyName: { contains: q, mode: "insensitive" } },
          take: 8,
        }),
        prisma.company.findMany({
          where: { userId: { in: memberIds }, cin: { contains: q, mode: "insensitive" } },
          take: 5,
        }),
      ]);

      // Deduplicate: CompanyProfile takes priority (has directors); csi_companies fills gaps
      const seen = new Set<string>();
      const results: Record<string, unknown>[] = [];

      // Add CompanyProfile results first
      for (const c of [...byName, ...byCin]) {
        const key = c.cin || c.id;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ ...c, _source: "my_companies" });
        }
      }

      // Add csi_companies results that aren't already present
      for (const c of [...csiByName, ...csiByCin]) {
        const key = c.cin || c.id;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            id: c.id,
            cin: c.cin || "",
            companyName: c.companyName,
            regAddress: c.regAddress || null,
            entityType: c.entityType || null,
            incorporationDate: c.incorporationDate || null,
            directors: [],
            charges: [],
            _source: "my_companies",
          });
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
