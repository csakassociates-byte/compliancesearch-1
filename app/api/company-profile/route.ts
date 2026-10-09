import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamMemberIds } from "@/lib/team";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id: string }).id;

    const companyId = req.nextUrl.searchParams.get("companyId");
    if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

    const memberIds = await getTeamMemberIds(userId);

    // ── Company info ────────────────────────────────────────────────────
    const companies = await prisma.$queryRawUnsafe<Array<{
      id: string; companyName: string; cin: string | null;
      entityType: string | null; regAddress: string | null;
      incorporationDate: string | null;
    }>>(
      `SELECT id, "companyName", cin, "entityType", "regAddress", "incorporationDate"
       FROM csi_companies
       WHERE id = $1 AND "userId" = ANY($2::text[]) LIMIT 1`,
      companyId, memberIds
    );
    if (!companies.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const company = companies[0];

    // ── Directors from CompanyProfile (global MCA data) ─────────────────
    let directors: Array<{
      name: string; din: string | null; designation: string | null;
      category: string | null; appointedAt: string | null;
      cessationAt: string | null; isActive: boolean;
      pan: string | null; mobile: string | null; email: string | null;
    }> = [];

    if (company.cin) {
      const profileRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM "CompanyProfile" WHERE cin = $1 LIMIT 1`, company.cin
      );
      if (profileRows.length) {
        directors = await prisma.$queryRawUnsafe<typeof directors>(
          `SELECT cd.name, cd.din, cd.designation, cd.category,
                  cd."appointedAt", cd."cessationAt", cd."isActive",
                  cp.pan, cp.mobile, cp.email
           FROM "CompanyDirector" cd
           LEFT JOIN csi_persons cp
             ON cp."companyId" = $2 AND (cp.din = cd.din OR LOWER(cp.name) = LOWER(cd.name))
           WHERE cd."companyId" = $1
           ORDER BY cd."isActive" DESC, cd."appointedAt" ASC`,
          profileRows[0].id, companyId
        );
      }
    }

    // Fallback: directors from csi_persons if no MCA data
    if (!directors.length) {
      const kycDirs = await prisma.$queryRawUnsafe<Array<{
        name: string; din: string | null; designation: string | null;
        mobile: string | null; email: string | null; panNo: string | null;
        dateOfJoining: string | null; directorCategory: string | null; isActive: boolean;
      }>>(
        `SELECT name, din, designation, mobile, email, "panNo",
                "dateOfJoining", "directorCategory", true as "isActive"
         FROM csi_persons
         WHERE "userId" = ANY($1::text[]) AND "companyId" = $2 AND "isDirector" = true
         ORDER BY "createdAt" ASC`,
        memberIds, companyId
      );
      directors = kycDirs.map(d => ({
        name: d.name,
        din: d.din,
        designation: d.designation,
        category: d.directorCategory,
        appointedAt: d.dateOfJoining,
        cessationAt: null,
        isActive: d.isActive,
        pan: d.panNo,
        mobile: d.mobile,
        email: d.email,
      }));
    }

    // ── Shareholders ─────────────────────────────────────────────────────
    const shareholders = await prisma.$queryRawUnsafe<Array<{
      personName: string | null; din: string | null; panNo: string | null;
      folioNumber: string | null; certificateNumber: string | null;
      distinctiveFrom: number | null; distinctiveTo: number | null;
      numberOfShares: number | null; shareType: string | null;
      dateOfAcquisition: string | null; certStatus: string | null;
      nominalValue: string | null; paidUpValue: string | null;
    }>>(
      `SELECT p.name as "personName", p.din, p."panNo",
              s."folioNumber", s."certificateNumber",
              s."distinctiveFrom", s."distinctiveTo", s."numberOfShares",
              s."shareType", s."dateOfAcquisition", s."certStatus",
              s."nominalValue", s."paidUpValue"
       FROM csi_shareholders s
       LEFT JOIN csi_persons p ON p.id = s."personId"
       WHERE s."userId" = ANY($1::text[]) AND s."companyId" = $2
       ORDER BY s."createdAt" ASC`,
      memberIds, companyId
    );

    const activeShares = shareholders.filter(s => s.certStatus !== "cancelled" && s.certStatus !== "split");
    const totalShares = activeShares.reduce((sum, s) => sum + (s.numberOfShares || 0), 0);
    const shareholdersWithPct = shareholders.map(s => {
      const isActive = s.certStatus !== "cancelled" && s.certStatus !== "split";
      return {
        ...s,
        holdingPercent: (isActive && totalShares > 0)
          ? (((s.numberOfShares || 0) / totalShares) * 100).toFixed(2)
          : "0.00",
      };
    });

    // Aggregate by person
    const holderMap = new Map<string, { name: string; din: string | null; pan: string | null; shares: number; percent: string }>();
    for (const s of shareholdersWithPct) {
      const key = s.personName || "Unknown";
      const existing = holderMap.get(key);
      const shares = s.certStatus !== "cancelled" && s.certStatus !== "split" ? (s.numberOfShares || 0) : 0;
      if (existing) {
        existing.shares += shares;
        existing.percent = totalShares > 0 ? ((existing.shares / totalShares) * 100).toFixed(2) : "0.00";
      } else {
        holderMap.set(key, {
          name: key, din: s.din, pan: s.panNo,
          shares,
          percent: totalShares > 0 ? ((shares / totalShares) * 100).toFixed(2) : "0.00",
        });
      }
    }
    const shareholderSummary = Array.from(holderMap.values())
      .sort((a, b) => b.shares - a.shares);

    // ── Auditor ──────────────────────────────────────────────────────────
    let auditor: {
      firmName: string; frn: string; partnerName: string; membershipNo: string;
      auditorAddress: string | null; auditorCity: string | null;
      auditorEmail: string | null; auditorMobile: string | null;
      agmFrom: string | null; agmTo: string | null; fyRange: string | null;
      isActive: boolean;
    } | null = null;

    if (company.cin) {
      const auditorRows = await prisma.$queryRawUnsafe<Array<typeof auditor & { isActive: boolean }>>(
        `SELECT "firmName", frn, "partnerName", "membershipNo",
                "auditorAddress", "auditorCity", "auditorEmail", "auditorMobile",
                "agmFrom", "agmTo", "fyRange", "isActive"
         FROM csi_auditors
         WHERE "userId" = ANY($1::text[]) AND cin = $2
         ORDER BY "isActive" DESC, "updatedAt" DESC LIMIT 1`,
        memberIds, company.cin
      );
      auditor = auditorRows[0] ?? null;
    }

    // ── Recent documents ─────────────────────────────────────────────────
    const recentDocs = await prisma.$queryRawUnsafe<Array<{
      id: string; type: string; title: string; financialYear: string | null; updatedAt: Date;
    }>>(
      `SELECT id, type, title, "financialYear", "updatedAt"
       FROM csi_documents
       WHERE "userId" = ANY($1::text[])
         AND ("companyId" = $2 OR (LOWER("companyName") = LOWER($3) AND "companyId" IS NULL))
       ORDER BY "updatedAt" DESC LIMIT 10`,
      memberIds, companyId, company.companyName
    );

    return NextResponse.json({
      company,
      directors,
      shareholderSummary,
      totalShares,
      auditor,
      recentDocs,
    });
  } catch (err) {
    console.error("[company-profile GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
