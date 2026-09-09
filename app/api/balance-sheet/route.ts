import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamMemberIds } from "@/lib/team";

async function resolveCompanyId(userId: string, companyName: string, cin?: string): Promise<string | null> {
  try {
    const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM csi_companies
       WHERE "userId" = $1 AND (
         LOWER("companyName") = LOWER($2)
         OR ($3::text IS NOT NULL AND cin = $3)
       ) LIMIT 1`,
      userId, companyName, cin || null
    );
    if (existing.length) {
      if (cin) {
        await prisma.$executeRawUnsafe(
          `UPDATE csi_companies SET cin = $3, "updatedAt" = NOW() WHERE id = $1 AND "userId" = $2 AND cin IS NULL`,
          existing[0].id, userId, cin
        );
      }
      return existing[0].id;
    }
    const newId = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO csi_companies (id, "userId", "companyName", cin, "updatedAt") VALUES ($1,$2,$3,$4,NOW())`,
      newId, userId, companyName, cin || null
    );
    return newId;
  } catch { return null; }
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
      title: string;
      formDataJson: string;
    };

    const companyId = await resolveCompanyId(userId, body.companyName, body.cin);

    if (body.id) {
      await prisma.$executeRawUnsafe(
        `UPDATE csi_documents SET
          title = $3,
          "companyName" = $4,
          "financialYear" = $5,
          "formDataJson" = $6,
          "companyId" = COALESCE("companyId", $7),
          "updatedAt" = NOW()
         WHERE id = $1 AND "userId" = $2`,
        body.id, userId,
        body.title, body.companyName,
        body.financialYear || null,
        body.formDataJson, companyId
      );
      return NextResponse.json({ success: true, id: body.id });
    }

    const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `INSERT INTO csi_documents
        (id, "userId", "companyId", type, title, "companyName", "financialYear", "formDataJson", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::TEXT, $1, $2, 'balance_sheet', $3, $4, $5, $6, NOW(), NOW())
       RETURNING id`,
      userId, companyId,
      body.title, body.companyName,
      body.financialYear || null,
      body.formDataJson
    );

    return NextResponse.json({ success: true, id: rows[0]?.id });
  } catch (err) {
    console.error("[balance-sheet POST]", err);
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
    const id = url.searchParams.get("id");

    const memberIds = await getTeamMemberIds(userId);

    if (id) {
      const rows = await prisma.$queryRawUnsafe<Array<{
        id: string; formDataJson: string; updatedAt: Date;
      }>>(
        `SELECT id, "formDataJson", "updatedAt"
         FROM csi_documents
         WHERE id = $1 AND "userId" = ANY($2::text[]) AND type = 'balance_sheet'`,
        id, memberIds
      );
      if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ doc: rows[0] });
    }

    const rows = await prisma.$queryRawUnsafe<Array<{
      id: string; title: string; companyName: string | null; financialYear: string | null; updatedAt: Date;
    }>>(
      `SELECT id, title, "companyName", "financialYear", "updatedAt"
       FROM csi_documents
       WHERE "userId" = ANY($1::text[]) AND type = 'balance_sheet'
       ORDER BY "updatedAt" DESC LIMIT 50`,
      memberIds
    );
    return NextResponse.json({ docs: rows });
  } catch (err) {
    console.error("[balance-sheet GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
