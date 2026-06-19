import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Save / update annual filing draft
export async function POST(req: NextRequest) {
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

  if (body.id) {
    // Update existing
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

  // Create new
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `INSERT INTO csi_documents
      ("userId", type, title, "companyName", "financialYear", "formDataJson", "createdAt", "updatedAt")
     VALUES ($1, 'annual_filing', $2, $3, $4, $5, NOW(), NOW())
     RETURNING id`,
    userId,
    `Annual Filing — ${body.companyName} — FY ${body.financialYear}`,
    body.companyName,
    body.financialYear,
    body.formDataJson,
  );

  return NextResponse.json({ success: true, id: rows[0]?.id });
}

// Load existing annual filing drafts for the logged-in user
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const url = new URL(req.url);
  const id  = url.searchParams.get("id");

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

  // List all filings for this user
  const rows = await prisma.$queryRawUnsafe<Array<{
    id: string; companyName: string | null; financialYear: string | null; updatedAt: Date;
  }>>(
    `SELECT id, "companyName", "financialYear", "updatedAt"
     FROM csi_documents WHERE "userId" = $1 AND type = 'annual_filing'
     ORDER BY "updatedAt" DESC LIMIT 50`,
    userId
  );
  return NextResponse.json({ filings: rows });
}
