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
    // Key: (companyId + DIN) — same DIN can exist in multiple companies (normal)
    // Dedup rule: within THIS company, same DIN = same person → update, not duplicate
    if (Array.isArray(directors)) {
      const existing = await prisma.companyDirector.findMany({
        where: { companyId: company.id },
      });

      // Map by DIN (preferred) or normalized name
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
            data: { isActive: false, ceasedAt: new Date().toISOString().split("T")[0], updatedAt: new Date() },
          });
        }
      }

      // Directors in upload → create or update
      for (const [key, inc] of incomingMap) {
        const dbDir = existingMap.get(key);
        if (dbDir) {
          // Update existing — re-activate if was ceased
          await prisma.companyDirector.update({
            where: { id: dbDir.id },
            data: {
              name:        inc.name        || dbDir.name,
              designation: inc.designation || dbDir.designation,
              category:    inc.category    || dbDir.category,
              appointedAt: inc.appointedAt || dbDir.appointedAt,
              din:         inc.din         || dbDir.din,
              isActive:    true,
              ceasedAt:    null,
              updatedAt:   new Date(),
            },
          });
        } else {
          // New director for this company (may have same DIN in other companies — that's OK)
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
