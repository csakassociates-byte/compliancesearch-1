import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamMemberIds } from "@/lib/team";

async function resolveCompanyId(userId: string, entityName: string): Promise<string | null> {
  try {
    const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM csi_companies WHERE "userId" = $1 AND LOWER("companyName") = LOWER($2) LIMIT 1`,
      userId, entityName
    );
    if (existing.length) return existing[0].id;
    const newId = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO csi_companies (id, "userId", "companyName", cin, "updatedAt") VALUES ($1,$2,$3,NULL,NOW())`,
      newId, userId, entityName
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
      entityName: string;
      financialYear?: string;
      title: string;
      formDataJson: string;
    };

    const companyId = await resolveCompanyId(userId, body.entityName);

    if (body.id) {
      await prisma.$executeRawUnsafe(
        `UPDATE csi_documents SET
          title = $3, "companyName" = $4, "financialYear" = $5,
          "formDataJson" = $6, "companyId" = COALESCE("companyId", $7), "updatedAt" = NOW()
         WHERE id = $1 AND "userId" = ANY($2::text[])`,
        body.id, [userId], body.title, body.entityName,
        body.financialYear || null, body.formDataJson, companyId
      );
      return NextResponse.json({ id: body.id });
    }

    const id = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO csi_documents (id, "userId", type, title, "companyName", "financialYear", "formDataJson", "companyId", "createdAt", "updatedAt")
       VALUES ($1,$2,'nce_financials',$3,$4,$5,$6,$7,NOW(),NOW())`,
      id, userId, body.title, body.entityName,
      body.financialYear || null, body.formDataJson, companyId
    );
    return NextResponse.json({ id });
  } catch (e) {
    console.error("NCE save error:", e);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const memberIds = await getTeamMemberIds(userId);

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; formDataJson: string; title: string; companyName: string; financialYear: string | null; updatedAt: Date }>>(
      `SELECT id, "formDataJson", title, "companyName", "financialYear", "updatedAt"
       FROM csi_documents
       WHERE id = $1 AND "userId" = ANY($2::text[]) AND type = 'nce_financials' LIMIT 1`,
      id, memberIds
    );
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ doc: rows[0] });
  } catch (e) {
    console.error("NCE load error:", e);
    return NextResponse.json({ error: "Load failed" }, { status: 500 });
  }
}
