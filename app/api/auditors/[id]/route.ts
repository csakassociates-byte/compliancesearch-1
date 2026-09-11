import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT — full update of a saved CA record
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const body = await req.json() as Record<string, unknown>;

  await prisma.$executeRawUnsafe(
    `UPDATE csi_auditors SET
      "firmName"           = COALESCE($3, "firmName"),
      frn                  = COALESCE($4, frn),
      "partnerName"        = COALESCE($5, "partnerName"),
      "membershipNo"       = COALESCE($6, "membershipNo"),
      "partnerDesignation" = COALESCE($7, "partnerDesignation"),
      "auditorType"        = COALESCE($8, "auditorType"),
      "auditorAddress"     = COALESCE($9, "auditorAddress"),
      "auditorCity"        = COALESCE($10, "auditorCity"),
      "auditorEmail"       = COALESCE($11, "auditorEmail"),
      "auditorMobile"      = COALESCE($12, "auditorMobile"),
      remuneration         = COALESCE($13, remuneration),
      "isActive"           = COALESCE($14, "isActive"),
      "updatedAt"          = NOW()
     WHERE id = $1 AND "userId" = $2`,
    id, userId,
    body.firmName || null, body.frn || null, body.partnerName || null,
    body.membershipNo || null, body.partnerDesignation || null,
    body.auditorType || null, body.auditorAddress || null,
    body.auditorCity || null, body.auditorEmail || null,
    body.auditorMobile || null, body.remuneration || null,
    body.isActive ?? null
  );

  return NextResponse.json({ success: true });
}

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
