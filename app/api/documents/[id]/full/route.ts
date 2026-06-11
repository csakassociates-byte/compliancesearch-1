import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Full update — title, date, FY, type AND formDataJson
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const body = await req.json() as {
    title?: string; meetingDate?: string; financialYear?: string;
    type?: string; companyName?: string; formDataJson?: string;
  };

  // Verify ownership
  const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM csi_documents WHERE id = $1 AND "userId" = $2`,
    id, userId
  );
  if (!existing.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$executeRawUnsafe(
    `UPDATE csi_documents SET
      title          = COALESCE($3, title),
      "meetingDate"  = COALESCE($4, "meetingDate"),
      "financialYear"= COALESCE($5, "financialYear"),
      type           = COALESCE($6, type),
      "companyName"  = COALESCE($7, "companyName"),
      "formDataJson" = COALESCE($8, "formDataJson"),
      "updatedAt"    = NOW()
     WHERE id = $1 AND "userId" = $2`,
    id, userId,
    body.title        ?? null,
    body.meetingDate  ?? null,
    body.financialYear?? null,
    body.type         ?? null,
    body.companyName  ?? null,
    body.formDataJson ?? null,
  );

  return NextResponse.json({ success: true, id });
}
