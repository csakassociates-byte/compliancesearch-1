import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const companies = await prisma.$queryRawUnsafe<Array<{
    id: string; cin: string | null; companyName: string;
    regAddress: string | null; entityType: string | null;
    incorporationDate: string | null; createdAt: Date;
  }>>(
    `SELECT * FROM csi_companies WHERE id = $1 AND "userId" = $2`, id, userId
  );
  if (!companies.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const documents = await prisma.$queryRawUnsafe<Array<{
    id: string; type: string; title: string; financialYear: string | null;
    meetingDate: string | null; createdAt: Date;
  }>>(
    `SELECT id, type, title, "financialYear", "meetingDate", "createdAt"
     FROM csi_documents
     WHERE "companyId" = $1 AND "userId" = $2
     ORDER BY "meetingDate" DESC NULLS LAST, "createdAt" DESC`,
    id, userId
  );

  return NextResponse.json({ company: companies[0], documents });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const body = await req.json() as {
    companyName?: string; cin?: string; entityType?: string;
    regAddress?: string; incorporationDate?: string;
  };

  await prisma.$executeRawUnsafe(
    `UPDATE csi_companies SET
      "companyName" = COALESCE($3, "companyName"),
      cin = COALESCE($4, cin),
      "entityType" = COALESCE($5, "entityType"),
      "regAddress" = COALESCE($6, "regAddress"),
      "incorporationDate" = COALESCE($7, "incorporationDate"),
      "updatedAt" = NOW()
     WHERE id = $1 AND "userId" = $2`,
    id, userId,
    body.companyName?.trim() || null, body.cin?.trim() || null,
    body.entityType?.trim() || null, body.regAddress?.trim() || null,
    body.incorporationDate?.trim() || null
  );
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  await prisma.$executeRawUnsafe(
    `DELETE FROM csi_companies WHERE id = $1 AND "userId" = $2`, id, userId
  );
  return NextResponse.json({ success: true });
}
