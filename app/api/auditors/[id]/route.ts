import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH — update signature/seal for a saved CA
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const body = await req.json() as { signatureBase64?: string; sealBase64?: string };

  await prisma.$executeRawUnsafe(
    `UPDATE csi_auditors SET
      "signatureBase64" = COALESCE($3, "signatureBase64"),
      "sealBase64"      = COALESCE($4, "sealBase64"),
      "updatedAt"       = NOW()
     WHERE id = $1 AND "userId" = $2`,
    id, userId,
    body.signatureBase64 ?? null,
    body.sealBase64 ?? null
  );

  return NextResponse.json({ success: true });
}

// DELETE — remove a saved CA
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  await prisma.$executeRawUnsafe(
    `DELETE FROM csi_auditors WHERE id = $1 AND "userId" = $2`,
    id, userId
  );

  return NextResponse.json({ success: true });
}
