import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
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

    // ── Upsert company profile ──────────────────────────────────
    const company = await prisma.companyProfile.upsert({
      where: { cin },
      update: {
        companyName,
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

    // ── Smart Director sync ─────────────────────────────────────
    if (Array.isArray(directors)) {
      // Fetch existing active directors from DB
      const existing = await prisma.companyDirector.findMany({
        where: { companyId: company.id },
      });

      const incomingMap = new Map<string, typeof directors[0]>();
      for (const d of directors) {
        const key = (d.din || "").trim() || d.name.trim().toUpperCase();
        if (key) incomingMap.set(key, d);
      }

      const existingMap = new Map<string, typeof existing[0]>();
      for (const e of existing) {
        const key = (e.din || "").trim() || e.name.trim().toUpperCase();
        if (key) existingMap.set(key, e);
      }

      // Directors in DB but NOT in new upload → mark ceased
      for (const [key, dbDir] of existingMap) {
        if (!incomingMap.has(key) && dbDir.isActive) {
          await prisma.companyDirector.update({
            where: { id: dbDir.id },
            data: {
              isActive:  false,
              ceasedAt:  new Date().toISOString().split("T")[0],
              updatedAt: new Date(),
            },
          });
        }
      }

      // Directors in new upload but NOT in DB → create; in both → update
      for (const [key, inc] of incomingMap) {
        const dbDir = existingMap.get(key);
        if (dbDir) {
          // Update: re-activate if was inactive, update designation
          await prisma.companyDirector.update({
            where: { id: dbDir.id },
            data: {
              name:        inc.name || dbDir.name,
              designation: inc.designation || dbDir.designation,
              category:    inc.category    || dbDir.category,
              appointedAt: inc.appointedAt || dbDir.appointedAt,
              isActive:    true,
              ceasedAt:    null,
              updatedAt:   new Date(),
            },
          });
        } else {
          // New director
          await prisma.companyDirector.create({
            data: {
              companyId:   company.id,
              din:         inc.din         || null,
              name:        inc.name,
              designation: inc.designation || null,
              category:    inc.category    || null,
              appointedAt: inc.appointedAt || null,
              isActive:    true,
            },
          });
        }
      }
    }

    // ── Charges: upsert by (companyId + chargeId) or (companyId + holderName) ──
    if (Array.isArray(charges)) {
      for (const ch of charges) {
        if (!ch.holderName) continue;

        // Find existing charge — prefer chargeId match, fallback to holderName
        const existing = await prisma.companyCharge.findFirst({
          where: {
            companyId: company.id,
            ...(ch.chargeId
              ? { chargeId: ch.chargeId }
              : { holderName: ch.holderName }),
          },
        });

        if (existing) {
          // Update only — no duplicate
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

    // Return updated company with directors
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
