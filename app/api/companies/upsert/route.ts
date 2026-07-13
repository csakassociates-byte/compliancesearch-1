import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  // Require login — any authenticated user can upsert their own companies
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; email?: string } | undefined;
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;

  try {
    const body = await req.json();
    const {
      cin, companyName, regAddress, entityType, email, rocName, status,
      isListed, sourceFile, directors, charges,
      incorporationDate, paidUpCapital, authorisedCapital,
      registrationNumber, dateOfLastAGM, dateOfBalanceSheet,
      categoryOfCompany, subcategory, classOfCompany, jurisdiction,
      smallCompany, mobile, gstNumber,
    } = body;

    if (!cin || !companyName) {
      return NextResponse.json({ error: "cin and companyName are required" }, { status: 400 });
    }

    // ── Upsert CompanyProfile by CIN ──────────────────────────────
    // If CIN already exists (MCA data or another user), update & claim ownership
    const company = await prisma.companyProfile.upsert({
      where: { cin },
      update: {
        companyName,
        uploadedBy:          userId,           // claim / update ownership
        regAddress:          regAddress          || undefined,
        entityType:          entityType          || undefined,
        email:               email               || undefined,
        rocName:             rocName             || undefined,
        status:              status              || undefined,
        isListed:            isListed            ?? false,
        sourceFile:          sourceFile          || undefined,
        incorporationDate:   incorporationDate   || undefined,
        paidUpCapital:       paidUpCapital       || undefined,
        authorisedCapital:   authorisedCapital   || undefined,
        registrationNumber:  registrationNumber  || undefined,
        dateOfLastAGM:       dateOfLastAGM       || undefined,
        dateOfBalanceSheet:  dateOfBalanceSheet  || undefined,
        categoryOfCompany:   categoryOfCompany   || undefined,
        subcategory:         subcategory         || undefined,
        classOfCompany:      classOfCompany      || undefined,
        jurisdiction:        jurisdiction        || undefined,
        smallCompany:        smallCompany        ?? false,
        mobile:              mobile              || undefined,
        gstNumber:           gstNumber           || undefined,
        updatedAt:           new Date(),
      },
      create: {
        cin, companyName,
        uploadedBy:          userId,
        regAddress:          regAddress          || null,
        entityType:          entityType          || null,
        email:               email               || null,
        rocName:             rocName             || null,
        status:              status              || null,
        isListed:            isListed            ?? false,
        sourceFile:          sourceFile          || null,
        incorporationDate:   incorporationDate   || null,
        paidUpCapital:       paidUpCapital       || null,
        authorisedCapital:   authorisedCapital   || null,
        registrationNumber:  registrationNumber  || null,
        dateOfLastAGM:       dateOfLastAGM       || null,
        dateOfBalanceSheet:  dateOfBalanceSheet  || null,
        categoryOfCompany:   categoryOfCompany   || null,
        subcategory:         subcategory         || null,
        classOfCompany:      classOfCompany      || null,
        jurisdiction:        jurisdiction        || null,
        smallCompany:        smallCompany        ?? false,
        mobile:              mobile              || null,
        gstNumber:           gstNumber           || null,
      },
    });

    // ── Smart Director Sync ───────────────────────────────────────
    if (Array.isArray(directors)) {
      let existing = await prisma.companyDirector.findMany({
        where: { companyId: company.id },
        orderBy: { createdAt: "asc" },
      });

      // ── Step 0: Remove existing DB duplicates (same DIN or same name) ──
      // Keep the first (oldest) record per DIN / per normalised name; delete the rest.
      const seenDin  = new Map<string, string>(); // din  → id to keep
      const seenName = new Map<string, string>(); // name → id to keep
      for (const e of existing) {
        const normDin  = e.din?.trim() || null;
        const normName = e.name.trim().toUpperCase();
        let keepId: string | null = null;

        if (normDin) {
          if (!seenDin.has(normDin)) { seenDin.set(normDin, e.id); }
          else keepId = seenDin.get(normDin)!;
        } else {
          if (!seenName.has(normName)) { seenName.set(normName, e.id); }
          else keepId = seenName.get(normName)!;
        }

        if (keepId && keepId !== e.id) {
          // This row is a duplicate — delete it
          await prisma.companyDirector.delete({ where: { id: e.id } });
        }
      }

      // Re-fetch after cleanup
      existing = await prisma.companyDirector.findMany({
        where: { companyId: company.id },
      });

      // ── Helper: find best existing match for an incoming director ──
      function findMatch(inc: { din?: string | null; name: string }) {
        const incDin  = inc.din?.trim();
        const incName = inc.name.trim().toUpperCase();
        // Priority 1: DIN match (most reliable)
        if (incDin) {
          const byDin = existing.find(e => e.din?.trim() === incDin);
          if (byDin) return byDin;
        }
        // Priority 2: normalised name match
        return existing.find(e => e.name.trim().toUpperCase() === incName) || null;
      }

      // ── Step 1: Mark ceased — DB directors not in upload ──
      for (const e of existing) {
        const stillIncoming = directors.some(
          d => (d.din?.trim() && d.din.trim() === e.din?.trim())
            || d.name.trim().toUpperCase() === e.name.trim().toUpperCase()
        );
        if (!stillIncoming && e.isActive) {
          await prisma.companyDirector.update({
            where: { id: e.id },
            data: { isActive: false, ceasedAt: new Date().toISOString().split("T")[0], updatedAt: new Date() },
          });
        }
      }

      // ── Step 2: Upsert incoming directors ──
      for (const inc of directors) {
        const dbDir = findMatch(inc);
        if (dbDir) {
          await prisma.companyDirector.update({
            where: { id: dbDir.id },
            data: {
              name:        inc.name        || dbDir.name,
              designation: inc.designation || dbDir.designation,
              category:    inc.category    || dbDir.category,
              appointedAt: inc.appointedAt || dbDir.appointedAt,
              din:         inc.din         || dbDir.din, // fill in DIN if it was missing
              isActive:    true,
              ceasedAt:    null,
              updatedAt:   new Date(),
            },
          });
        } else {
          await prisma.companyDirector.create({
            data: {
              companyId:   company.id,
              din:         inc.din         || null,
              name:        inc.name,
              designation: inc.designation || null,
              category:    inc.category    || null,
              appointedAt: inc.appointedAt || null,
              isActive:    inc.isActive    ?? true,
            },
          });
        }
      }
    }

    // ── Charge Sync ───────────────────────────────────────────────
    // Dedup by (companyId + chargeId) if chargeId exists, else (companyId + holderName)
    if (Array.isArray(charges)) {
      for (const ch of charges) {
        if (!ch.holderName) continue;

        const existing = await prisma.companyCharge.findFirst({
          where: {
            companyId: company.id,
            ...(ch.chargeId
              ? { chargeId: ch.chargeId }
              : { holderName: ch.holderName }),
          },
        });

        if (existing) {
          await prisma.companyCharge.update({
            where: { id: existing.id },
            data: {
              holderName:     ch.holderName,
              chargeId:       ch.chargeId       || existing.chargeId,
              dateOfCreation: ch.dateOfCreation || existing.dateOfCreation,
              amount:         ch.amount         || existing.amount,
              address:        ch.address        || existing.address,
              isSatisfied:    ch.isSatisfied    ?? existing.isSatisfied,
              updatedAt:      new Date(),
            },
          });
        } else {
          await prisma.companyCharge.create({
            data: {
              companyId:      company.id,
              chargeId:       ch.chargeId       || null,
              holderName:     ch.holderName,
              dateOfCreation: ch.dateOfCreation || null,
              amount:         ch.amount         || null,
              address:        ch.address        || null,
              isSatisfied:    ch.isSatisfied    ?? false,
            },
          });
        }
      }
    }

    // ── Also sync to csi_companies (user's client list + document linking) ──
    const existingClient = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM csi_companies WHERE "userId" = $1 AND (
         LOWER("companyName") = LOWER($2) OR (cin IS NOT NULL AND cin = $3)
       ) LIMIT 1`,
      userId, companyName, cin
    );
    if (existingClient.length) {
      await prisma.$executeRawUnsafe(
        `UPDATE csi_companies SET
          cin = COALESCE($3, cin),
          "entityType" = COALESCE($4, "entityType"),
          "regAddress" = COALESCE($5, "regAddress"),
          "incorporationDate" = COALESCE($6, "incorporationDate"),
          "updatedAt" = NOW()
         WHERE id = $1 AND "userId" = $2`,
        existingClient[0].id, userId,
        cin || null, entityType || null, regAddress || null, incorporationDate || null
      );
    } else {
      const { default: crypto } = await import("crypto");
      const csiId = crypto.randomUUID();
      await prisma.$executeRawUnsafe(
        `INSERT INTO csi_companies (id, "userId", "companyName", cin, "entityType", "regAddress", "incorporationDate", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
        csiId, userId, companyName, cin || null, entityType || null, regAddress || null, incorporationDate || null
      );
    }

    const result = await prisma.companyProfile.findUnique({
      where: { id: company.id },
      include: {
        directors: { orderBy: { createdAt: "asc" } },
        charges:   { orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json({ success: true, company: result });
  } catch (err) {
    console.error("Company upsert error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
