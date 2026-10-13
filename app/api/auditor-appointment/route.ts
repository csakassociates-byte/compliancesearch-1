import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncCompany } from "@/lib/syncCompany";
import { getTeamMemberIds } from "@/lib/team";

async function ensureColumns() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS csi_documents (
      id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      "userId"      TEXT NOT NULL,
      "companyId"   TEXT,
      type          TEXT NOT NULL,
      title         TEXT NOT NULL,
      "companyName" TEXT,
      "financialYear" TEXT,
      "meetingDate" TEXT,
      "formDataJson" TEXT NOT NULL DEFAULT '{}',
      "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_csi_docs_userId ON csi_documents("userId")`);
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_documents ADD COLUMN IF NOT EXISTS "financialYear" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_documents ADD COLUMN IF NOT EXISTS "meetingDate" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_documents ADD COLUMN IF NOT EXISTS "formDataJson" TEXT NOT NULL DEFAULT '{}'`);
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_documents ADD COLUMN IF NOT EXISTS "companyName" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_documents ADD COLUMN IF NOT EXISTS "isFinalized" BOOLEAN NOT NULL DEFAULT false`);
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_documents ADD COLUMN IF NOT EXISTS "finalizedBy" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_documents ADD COLUMN IF NOT EXISTS "finalizedAt" TIMESTAMPTZ`);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id: string }).id;

    const body = await req.json() as {
      id?: string;
      companyName: string;
      cin?: string;
      financialYear?: string;
      meetingDate?: string;
      title: string;
      formDataJson: string;
    };

    // Block auto-saves without enough data (unless updating existing)
    if (!body.id && !body.cin) {
      return NextResponse.json({ skipped: true }, { status: 200 });
    }
    if (!body.id && body.companyName.trim().length < 5) {
      return NextResponse.json({ skipped: true }, { status: 200 });
    }
    if (body.cin) {
      const cinPattern = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{2,4}[0-9]{6}$/;
      if (!cinPattern.test(body.cin.trim().toUpperCase())) {
        return NextResponse.json({ error: "Invalid CIN format" }, { status: 400 });
      }
    }

    await ensureColumns();

    const companyId = await syncCompany(userId, body.companyName, body.cin);

    if (body.id) {
      // Don't allow updates to finalized records
      const check = await prisma.$queryRawUnsafe<Array<{ isFinalized: boolean }>>(
        `SELECT "isFinalized" FROM csi_documents WHERE id = $1 AND "userId" = $2`,
        body.id, userId
      );
      if (check[0]?.isFinalized) {
        return NextResponse.json({ error: "Record is finalized and cannot be modified" }, { status: 403 });
      }

      await prisma.$executeRawUnsafe(
        `UPDATE csi_documents SET
          title = $3,
          "companyName" = $4,
          "financialYear" = $5,
          "meetingDate" = $6,
          "formDataJson" = $7,
          "companyId" = COALESCE("companyId", $8),
          "updatedAt" = NOW()
         WHERE id = $1 AND "userId" = $2`,
        body.id, userId,
        body.title, body.companyName,
        body.financialYear || null, body.meetingDate || null,
        body.formDataJson, companyId
      );
      return NextResponse.json({ success: true, id: body.id });
    }

    // Before inserting, check for duplicate draft (same team + CIN or company name + FY)
    {
      const memberIds = await getTeamMemberIds(userId);
      const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM csi_documents
         WHERE "userId" = ANY($1::text[]) AND type = 'auditor_appointment'
           AND "financialYear" = $2
           AND (
             ($3 <> '' AND "formDataJson"::jsonb #>> '{cin}' = $3)
             OR ($3 <> '' AND "formDataJson"::jsonb #>> '{data,cin}' = $3)
             OR UPPER(TRIM("companyName")) = UPPER(TRIM($4))
           )
         ORDER BY "updatedAt" DESC LIMIT 1`,
        memberIds, body.financialYear || "", body.cin ?? "", body.companyName
      );
      if (existing.length) {
        const existingId = existing[0].id;
        await prisma.$executeRawUnsafe(
          `UPDATE csi_documents SET
            title = $2,
            "companyName" = $3,
            "financialYear" = $4,
            "meetingDate" = $5,
            "formDataJson" = $6,
            "companyId" = COALESCE("companyId", $7),
            "updatedAt" = NOW()
           WHERE id = $1`,
          existingId,
          body.title, body.companyName,
          body.financialYear || null, body.meetingDate || null,
          body.formDataJson, companyId
        );
        return NextResponse.json({ success: true, id: existingId });
      }
    }

    const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `INSERT INTO csi_documents
        (id, "userId", "companyId", type, title, "companyName", "financialYear", "meetingDate", "formDataJson", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::TEXT, $1, $2, 'auditor_appointment', $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id`,
      userId, companyId,
      body.title, body.companyName,
      body.financialYear || null, body.meetingDate || null,
      body.formDataJson
    );

    return NextResponse.json({ success: true, id: rows[0]?.id });
  } catch (err) {
    console.error("[auditor-appointment POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId    = (session.user as { id: string }).id;
    const userEmail = (session.user as { email?: string }).email ?? "unknown";

    const body = await req.json() as { id: string; action: "finalize" | "unfinalize" };
    await ensureColumns();

    if (body.action === "finalize") {
      await prisma.$executeRawUnsafe(
        `UPDATE csi_documents SET "isFinalized" = true, "finalizedBy" = $3, "finalizedAt" = NOW(), "updatedAt" = NOW()
         WHERE id = $1 AND "userId" = $2`,
        body.id, userId, userEmail
      );
    } else {
      await prisma.$executeRawUnsafe(
        `UPDATE csi_documents SET "isFinalized" = false, "finalizedBy" = NULL, "finalizedAt" = NULL, "updatedAt" = NOW()
         WHERE id = $1 AND "userId" = $2`,
        body.id, userId
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[auditor-appointment PATCH]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id: string }).id;

    const url = new URL(req.url);
    const id  = url.searchParams.get("id");
    const cin = url.searchParams.get("cin");

    await ensureColumns();
    const memberIds = await getTeamMemberIds(userId);

    if (id) {
      const rows = await prisma.$queryRawUnsafe<Array<{
        id: string; formDataJson: string; updatedAt: Date;
        isFinalized: boolean; finalizedBy: string | null; finalizedAt: Date | null;
      }>>(
        `SELECT id, "formDataJson", "updatedAt", "isFinalized", "finalizedBy", "finalizedAt"
         FROM csi_documents
         WHERE id = $1 AND "userId" = ANY($2::text[]) AND type = 'auditor_appointment'`,
        id, memberIds
      );
      if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ doc: rows[0] });
    }

    if (cin) {
      const fy = url.searchParams.get("fy");
      const rows = fy
        ? await prisma.$queryRawUnsafe<Array<{
            id: string; formDataJson: string; updatedAt: Date;
            isFinalized: boolean; finalizedBy: string | null; finalizedAt: Date | null;
          }>>(
            `SELECT id, "formDataJson", "updatedAt", "isFinalized", "finalizedBy", "finalizedAt"
             FROM csi_documents
             WHERE "userId" = ANY($1::text[]) AND type = 'auditor_appointment'
               AND "financialYear" = $2
               AND (
                 "formDataJson"::jsonb #>> '{cin}' = $3
                 OR "formDataJson"::jsonb #>> '{data,cin}' = $3
               )
             ORDER BY "isFinalized" DESC, "updatedAt" DESC LIMIT 1`,
            memberIds, fy, cin
          )
        : await prisma.$queryRawUnsafe<Array<{
            id: string; formDataJson: string; updatedAt: Date;
            isFinalized: boolean; finalizedBy: string | null; finalizedAt: Date | null;
          }>>(
            `SELECT id, "formDataJson", "updatedAt", "isFinalized", "finalizedBy", "finalizedAt"
             FROM csi_documents
             WHERE "userId" = ANY($1::text[]) AND type = 'auditor_appointment'
               AND (
                 "formDataJson"::jsonb #>> '{cin}' = $2
                 OR "formDataJson"::jsonb #>> '{data,cin}' = $2
               )
             ORDER BY "isFinalized" DESC, "updatedAt" DESC LIMIT 1`,
            memberIds, cin
          );
      return NextResponse.json({ doc: rows[0] ?? null });
    }

    const rows = await prisma.$queryRawUnsafe<Array<{
      id: string; title: string; companyName: string | null; financialYear: string | null;
      updatedAt: Date; isFinalized: boolean; finalizedAt: Date | null;
    }>>(
      `SELECT id, title, "companyName", "financialYear", "updatedAt", "isFinalized", "finalizedAt"
       FROM csi_documents
       WHERE "userId" = ANY($1::text[]) AND type = 'auditor_appointment'
       ORDER BY "updatedAt" DESC LIMIT 50`,
      memberIds
    );
    return NextResponse.json({ docs: rows });
  } catch (err) {
    console.error("[auditor-appointment GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
