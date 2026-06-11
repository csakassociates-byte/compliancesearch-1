import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const body = await req.json() as Record<string, unknown>;

  const allowed = [
    "folioNumber","certificateNumber","distinctiveFrom","distinctiveTo",
    "numberOfShares","shareType","dateOfAcquisition","dateOfTransfer",
    "transferFrom","nomineeName","nomineeRelation","nomineeAddress",
  ];

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 3;

  for (const key of allowed) {
    if (key in body) {
      setClauses.push(`"${key}" = $${idx}`);
      values.push(body[key] ?? null);
      idx++;
    }
  }

  if (setClauses.length === 0)
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  setClauses.push(`"updatedAt" = NOW()`);

  await prisma.$executeRawUnsafe(
    `UPDATE csi_shareholders SET ${setClauses.join(", ")} WHERE id = $1 AND "userId" = $2`,
    id, userId, ...values
  );

  const updated = await prisma.$queryRawUnsafe<unknown[]>(
    `SELECT * FROM csi_shareholders WHERE id = $1 AND "userId" = $2`, id, userId
  );
  return NextResponse.json({ shareholder: updated[0] || null });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  await prisma.$executeRawUnsafe(
    `DELETE FROM csi_shareholders WHERE id = $1 AND "userId" = $2`, id, userId
  );
  return NextResponse.json({ success: true });
}
