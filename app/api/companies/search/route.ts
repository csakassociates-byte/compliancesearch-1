import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamMemberIds } from "@/lib/team";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("q") ?? "";
  const q = raw.trim();
  // Require at least 1 character (space = "show all" trigger from onFocus)
  if (raw.length < 1) return NextResponse.json([]);

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
      const [byName, byCin] = q ? await Promise.all([
        prisma.companyProfile.findMany({
          where: { uploadedBy: { in: memberIds }, companyName: { contains: q, mode: "insensitive" } },
          take: 8, include,
        }),
        prisma.companyProfile.findMany({
          where: { uploadedBy: { in: memberIds }, cin: { contains: q, mode: "insensitive" } },
          take: 5, include,
        }),
      ]) : await Promise.all([
        prisma.companyProfile.findMany({
          where: { uploadedBy: { in: memberIds } },
          take: 8, include, orderBy: { updatedAt: "desc" },
        }),
        Promise.resolve([]),
      ]);

      // Also search csi_companies (user's own client list — even if not in CompanyProfile)
      const csiRows = q
        ? await prisma.$queryRawUnsafe<Array<{
            id: string; cin: string | null; companyName: string;
            entityType: string | null; regAddress: string | null; incorporationDate: string | null;
          }>>(
            `SELECT id, cin, "companyName", "entityType", "regAddress", "incorporationDate"
             FROM csi_companies
             WHERE "userId" = ANY($1::text[])
               AND (LOWER("companyName") LIKE '%' || LOWER($2) || '%'
                    OR (cin IS NOT NULL AND LOWER(cin) LIKE '%' || LOWER($2) || '%'))
             ORDER BY "updatedAt" DESC LIMIT 10`,
            memberIds, q
          )
        : await prisma.$queryRawUnsafe<Array<{
            id: string; cin: string | null; companyName: string;
            entityType: string | null; regAddress: string | null; incorporationDate: string | null;
          }>>(
            `SELECT id, cin, "companyName", "entityType", "regAddress", "incorporationDate"
             FROM csi_companies
             WHERE "userId" = ANY($1::text[])
             ORDER BY "updatedAt" DESC LIMIT 10`,
            memberIds
          );
      const [csiByName, csiByCin] = [csiRows, []] as [typeof csiRows, typeof csiRows];

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

      // Also search csi_documents (Annual Filing / Board Minutes) for distinct company names
      const docsMatches = q
        ? await prisma.$queryRawUnsafe<Array<{ companyName: string; cin: string | null }>>(
            `SELECT DISTINCT "companyName", NULL::text AS cin
             FROM csi_documents
             WHERE "userId" = ANY($1::text[])
               AND "companyName" IS NOT NULL
               AND LOWER("companyName") LIKE '%' || LOWER($2) || '%'
             LIMIT 5`,
            memberIds, q
          )
        : await prisma.$queryRawUnsafe<Array<{ companyName: string; cin: string | null }>>(
            `SELECT DISTINCT "companyName", NULL::text AS cin
             FROM csi_documents
             WHERE "userId" = ANY($1::text[])
               AND "companyName" IS NOT NULL
             ORDER BY "companyName" LIMIT 10`,
            memberIds
          );

      for (const d of docsMatches) {
        if (!d.companyName) continue;
        const key = d.cin || d.companyName.trim().toUpperCase();
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            id: `doc-${key}`,
            cin: d.cin || "",
            companyName: d.companyName,
            regAddress: null,
            entityType: null,
            incorporationDate: null,
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
