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
