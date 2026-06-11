import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id: companyId } = await params;
  const { documentId } = await req.json() as { documentId: string };

  await prisma.$executeRawUnsafe(
    `UPDATE csi_documents SET "companyId" = $1, "updatedAt" = NOW()
     WHERE id = $2 AND "userId" = $3`,
    companyId, documentId, userId
  );
  return NextResponse.json({ success: true });
}
