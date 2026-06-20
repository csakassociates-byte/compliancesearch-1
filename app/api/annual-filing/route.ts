import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Ensure csi_documents has all columns needed for annual filing
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
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_documents ADD COLUMN IF NOT EXISTS "formDataJson" TEXT NOT NULL DEFAULT '{}'`);
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_documents ADD COLUMN IF NOT EXISTS "companyName" TEXT`);
}

// Save / update annual filing draft
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id: string }).id;

    const body = await req.json() as {
      id?: string;
      companyName: string;
      cin?: string;
      financialYear: string;
      formDataJson: string;
    };

    await ensureColumns();

    if (body.id) {
      await prisma.$executeRawUnsafe(
        `UPDATE csi_documents SET
          title = $3,
          "companyName" = $4,
          "financialYear" = $5,
          "formDataJson" = $6,
          "updatedAt" = NOW()
         WHERE id = $1 AND "userId" = $2`,
        body.id,
        userId,
        `Annual Filing — ${body.companyName} — FY ${body.financialYear}`,
        body.companyName,
        body.financialYear,
        body.formDataJson,
      );
      return NextResponse.json({ success: true, id: body.id });
    }

    const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `INSERT INTO csi_documents
        (id, "userId", type, title, "companyName", "financialYear", "formDataJson", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::TEXT, $1, 'annual_filing', $2, $3, $4, $5, NOW(), NOW())
       RETURNING id`,
      userId,
      `Annual Filing — ${body.companyName} — FY ${body.financialYear}`,
      body.companyName,
      body.financialYear,
      body.formDataJson,
    );

    return NextResponse.json({ success: true, id: rows[0]?.id });
  } catch (err) {
    console.error("[annual-filing POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error while saving" },
      { status: 500 }
    );
  }
}

// Load existing annual filing drafts for the logged-in user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id: string }).id;

    const url = new URL(req.url);
    const id  = url.searchParams.get("id");
    const cin = url.searchParams.get("cin");

    await ensureColumns();

    if (id) {
      const rows = await prisma.$queryRawUnsafe<Array<{
        id: string; companyName: string | null; financialYear: string | null; formDataJson: string; updatedAt: Date;
      }>>(
        `SELECT id, "companyName", "financialYear", "formDataJson", "updatedAt"
         FROM csi_documents WHERE id = $1 AND "userId" = $2 AND type = 'annual_filing'`,
        id, userId
      );
      if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ filing: rows[0] });
    }

    if (cin) {
      const rows = await prisma.$queryRawUnsafe<Array<{
        id: string; companyName: string | null; financialYear: string | null; formDataJson: string; updatedAt: Date;
      }>>(
        `SELECT id, "companyName", "financialYear", "formDataJson", "updatedAt"
         FROM csi_documents
         WHERE "userId" = $1 AND type = 'annual_filing'
           AND "formDataJson"::jsonb #>> '{data,cin}' = $2
         ORDER BY "updatedAt" DESC LIMIT 1`,
        userId, cin
      );
      return NextResponse.json({ filing: rows[0] ?? null });
    }

    const rows = await prisma.$queryRawUnsafe<Array<{
      id: string; companyName: string | null; financialYear: string | null; updatedAt: Date;
    }>>(
      `SELECT id, "companyName", "financialYear", "updatedAt"
       FROM csi_documents WHERE "userId" = $1 AND type = 'annual_filing'
       ORDER BY "updatedAt" DESC LIMIT 50`,
      userId
    );
    return NextResponse.json({ filings: rows });
  } catch (err) {
    console.error("[annual-filing GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
