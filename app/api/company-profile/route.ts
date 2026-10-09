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

    // ── Company info ─────────────────────────────────────────────────────────
    // csi_companies only has: id, companyName, cin, entityType, regAddress, incorporationDate
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

    // ── MCA profile data (global CompanyProfile table) ────────────────────────
    let mcaProfile: {
      rocName: string | null; status: string | null;
      isListed: boolean; smallCompany: boolean;
      authorisedCapital: string | null; paidUpCapital: string | null;
      registrationNumber: string | null; dateOfLastAGM: string | null;
      dateOfBalanceSheet: string | null; categoryOfCompany: string | null;
      subcategory: string | null; classOfCompany: string | null;
      email: string | null;
    } | null = null;

    if (company.cin) {
      const profileRows = await prisma.$queryRawUnsafe<Array<{
        rocName: string | null; status: string | null;
        isListed: boolean; smallCompany: boolean;
        authorisedCapital: string | null; paidUpCapital: string | null;
        registrationNumber: string | null; dateOfLastAGM: string | null;
        dateOfBalanceSheet: string | null; categoryOfCompany: string | null;
        subcategory: string | null; classOfCompany: string | null;
        email: string | null;
      }>>(
        `SELECT "rocName", status, "isListed", "smallCompany",
                "authorisedCapital", "paidUpCapital", "registrationNumber",
                "dateOfLastAGM", "dateOfBalanceSheet", "categoryOfCompany",
                subcategory, "classOfCompany", email
         FROM "CompanyProfile" WHERE cin = $1 LIMIT 1`,
        company.cin
      );
      if (profileRows.length) mcaProfile = profileRows[0];
    }

    // ── Directors from CompanyProfile (global MCA data) ─────────────────────
    let directors: Array<{
      name: string; din: string | null; designation: string | null;
      category: string | null; appointedAt: string | null;
      cessationAt: string | null; isActive: boolean;
      pan: string | null; mobile: string | null; email: string | null;
      source: "mca" | "annual_filing" | "kyc";
    }> = [];

    if (company.cin) {
      const profileRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM "CompanyProfile" WHERE cin = $1 LIMIT 1`, company.cin
      );
      if (profileRows.length) {
        const mcaDirs = await prisma.$queryRawUnsafe<Array<{
          name: string; din: string | null; designation: string | null;
          category: string | null; appointedAt: string | null;
          cessationAt: string | null; isActive: boolean;
          pan: string | null; mobile: string | null; email: string | null;
        }>>(
          `SELECT cd.name, cd.din, cd.designation, cd.category,
                  cd."appointedAt", cd."ceasedAt" as "cessationAt", cd."isActive",
                  cp."panNo" as pan, cp.mobile, cp.email
           FROM "CompanyDirector" cd
           LEFT JOIN csi_persons cp
             ON cp."companyId" = $2 AND (cp.din = cd.din OR LOWER(cp.name) = LOWER(cd.name))
           WHERE cd."companyId" = $1
           ORDER BY cd."isActive" DESC, cd."appointedAt" ASC`,
          profileRows[0].id, companyId
        );
        directors = mcaDirs.map(d => ({ ...d, source: "mca" as const }));
      }
    }

    // ── Annual filing document — directors & shareholders ────────────────────
    // Fetch the most recent annual filing for this company
    const afDocs = await prisma.$queryRawUnsafe<Array<{
      id: string; formDataJson: string; financialYear: string | null;
    }>>(
      `SELECT id, "formDataJson", "financialYear"
       FROM csi_documents
       WHERE "userId" = ANY($1::text[])
         AND type = 'annual_filing'
         AND ("companyId" = $2 OR (LOWER("companyName") = LOWER($3) AND "companyId" IS NULL))
       ORDER BY "updatedAt" DESC LIMIT 1`,
      memberIds, companyId, company.companyName
    );

    let afDirectors: typeof directors = [];
    let afShareholders: Array<{
      name: string; folioNo: string; type: string;
      sharesHeld: number; percentHolding: string;
      pan: string | null; isPromoter: boolean; address: string | null;
    }> = [];
    let afTotalShares = 0;
    let afFinancialYear: string | null = null;

    if (afDocs.length) {
      try {
        const parsed = JSON.parse(afDocs[0].formDataJson) as {
          data?: {
            directors?: Array<{
              din: string; name: string; designation: string; category: string;
              dateOfAppointment: string; dateOfCessation?: string;
              isActive: boolean; pan?: string;
            }>;
            shareholders?: Array<{
              folioNo: string; name: string; type: string;
              sharesHeld: number; percentHolding: string;
              pan?: string; isPromoter?: boolean; address?: string;
            }>;
            totalShares?: number;
          };
        };
        afFinancialYear = afDocs[0].financialYear;

        if (parsed?.data?.directors?.length) {
          afDirectors = parsed.data.directors.map(d => ({
            name:        d.name,
            din:         d.din || null,
            designation: d.designation || null,
            category:    d.category || null,
            appointedAt: d.dateOfAppointment || null,
            cessationAt: d.dateOfCessation || null,
            isActive:    d.isActive,
            pan:         d.pan || null,
            mobile:      null,
            email:       null,
            source:      "annual_filing" as const,
          }));
        }

        if (parsed?.data?.shareholders?.length) {
          afShareholders = parsed.data.shareholders.map(s => ({
            name:           s.name,
            folioNo:        s.folioNo,
            type:           s.type,
            sharesHeld:     s.sharesHeld ?? 0,
            percentHolding: s.percentHolding ?? "0",
            pan:            s.pan || null,
            isPromoter:     s.isPromoter ?? false,
            address:        s.address || null,
          }));
          afTotalShares = parsed.data.totalShares ?? 0;
        }
      } catch {
        // malformed JSON — skip
      }
    }

    // Merge directors: MCA data has priority; supplement from annual filing
    if (!directors.length && afDirectors.length) {
      directors = afDirectors;
    } else if (directors.length && afDirectors.length) {
      // Fill missing pan/dates from annual filing for existing MCA entries
      for (const afDir of afDirectors) {
        const existing = directors.find(d =>
          (afDir.din && d.din && afDir.din === d.din) ||
          d.name.trim().toLowerCase() === afDir.name.trim().toLowerCase()
        );
        if (!existing) {
          directors.push({ ...afDir, source: "annual_filing" });
        } else {
          if (!existing.pan && afDir.pan) existing.pan = afDir.pan;
          if (!existing.appointedAt && afDir.appointedAt) existing.appointedAt = afDir.appointedAt;
          if (!existing.cessationAt && afDir.cessationAt) existing.cessationAt = afDir.cessationAt;
        }
      }
    }

    // Fallback: directors from csi_persons (KYC) if still empty
    if (!directors.length) {
      const kycDirs = await prisma.$queryRawUnsafe<Array<{
        name: string; din: string | null; designation: string | null;
        mobile: string | null; email: string | null; panNo: string | null;
        dateOfJoining: string | null; directorCategory: string | null;
      }>>(
        `SELECT name, din, designation, mobile, email, "panNo",
                "dateOfJoining", "directorCategory"
         FROM csi_persons
         WHERE "userId" = ANY($1::text[]) AND "companyId" = $2 AND "isDirector" = true
         ORDER BY "createdAt" ASC`,
        memberIds, companyId
      );
      directors = kycDirs.map(d => ({
        name:        d.name,
        din:         d.din,
        designation: d.designation,
        category:    d.directorCategory,
        appointedAt: d.dateOfJoining,
        cessationAt: null,
        isActive:    true,
        pan:         d.panNo,
        mobile:      d.mobile,
        email:       d.email,
        source:      "kyc" as const,
      }));
    }

    // ── Shareholders ─────────────────────────────────────────────────────────
    // Use annual filing shareholders if available; otherwise fall back to share certificates
    let shareholderSummary: Array<{
      name: string; folioNo?: string; type?: string;
      shares: number; percent: string;
      pan: string | null; isPromoter?: boolean;
      din?: string | null;
    }> = [];
    let totalShares = 0;

    if (afShareholders.length) {
      shareholderSummary = afShareholders.map(s => ({
        name:      s.name,
        folioNo:   s.folioNo,
        type:      s.type,
        shares:    s.sharesHeld,
        percent:   s.percentHolding,
        pan:       s.pan,
        isPromoter: s.isPromoter,
      }));
      totalShares = afTotalShares || afShareholders.reduce((sum, s) => sum + s.sharesHeld, 0);
    } else {
      // Fallback: share certificate records
      const certRows = await prisma.$queryRawUnsafe<Array<{
        personName: string | null; din: string | null; panNo: string | null;
        folioNumber: string | null; numberOfShares: number | null;
        shareType: string | null; certStatus: string | null;
      }>>(
        `SELECT p.name as "personName", p.din, p."panNo",
                s."folioNumber", s."numberOfShares", s."shareType", s."certStatus"
         FROM csi_shareholders s
         LEFT JOIN csi_persons p ON p.id = s."personId"
         WHERE s."userId" = ANY($1::text[]) AND s."companyId" = $2
         ORDER BY s."createdAt" ASC`,
        memberIds, companyId
      );
      const activeRows = certRows.filter(s => s.certStatus !== "cancelled" && s.certStatus !== "split");
      totalShares = activeRows.reduce((sum, s) => sum + (s.numberOfShares || 0), 0);

      const holderMap = new Map<string, { name: string; din: string | null; pan: string | null; shares: number }>();
      for (const s of activeRows) {
        const key = s.personName || "Unknown";
        const existing = holderMap.get(key);
        const shares = s.numberOfShares || 0;
        if (existing) {
          existing.shares += shares;
        } else {
          holderMap.set(key, { name: key, din: s.din, pan: s.panNo, shares });
        }
      }
      shareholderSummary = Array.from(holderMap.values())
        .sort((a, b) => b.shares - a.shares)
        .map(h => ({
          ...h,
          percent: totalShares > 0 ? ((h.shares / totalShares) * 100).toFixed(2) : "0.00",
        }));
    }

    // ── Auditor ──────────────────────────────────────────────────────────────
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

    // ── Recent documents ─────────────────────────────────────────────────────
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
      mcaProfile,
      directors,
      shareholderSummary,
      totalShares,
      afFinancialYear,
      auditor,
      recentDocs,
    });
  } catch (err) {
    console.error("[company-profile GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
