import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const rows = await prisma.$queryRawUnsafe<Array<{
    id: string; type: string; title: string; companyName: string | null;
    financialYear: string | null; meetingDate: string | null;
    formDataJson: string; createdAt: Date;
  }>>(
    `SELECT * FROM csi_documents WHERE id = $1 AND "userId" = $2`,
    id, userId
  );

  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ document: rows[0] });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const body = await req.json() as {
    title?: string; meetingDate?: string; financialYear?: string; type?: string;
  };

  await prisma.$executeRawUnsafe(
    `UPDATE csi_documents SET
      title = COALESCE($3, title),
      "meetingDate" = COALESCE($4, "meetingDate"),
      "financialYear" = COALESCE($5, "financialYear"),
      type = COALESCE($6, type),
      "updatedAt" = NOW()
     WHERE id = $1 AND "userId" = $2`,
    id, userId,
    body.title?.trim() || null,
    body.meetingDate?.trim() || null,
    body.financialYear?.trim() || null,
    body.type?.trim() || null,
  );
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  await prisma.$executeRawUnsafe(
    `DELETE FROM csi_documents WHERE id = $1 AND "userId" = $2`, id, userId
  );
  return NextResponse.json({ success: true });
}
