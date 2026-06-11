import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const person = await prisma.$queryRawUnsafe<Array<{
    id: string; isDirector: boolean; isShareholder: boolean;
  }>>(
    `SELECT id, "isDirector", "isShareholder" FROM csi_persons WHERE id = $1 AND "userId" = $2`,
    id, userId
  );

  if (!person.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const p = person[0];
  // If director → also set as shareholder; if shareholder → also set as director
  const newIsDirector = p.isDirector || p.isShareholder;
  const newIsShareholder = p.isShareholder || p.isDirector;

  await prisma.$executeRawUnsafe(
    `UPDATE csi_persons SET "isDirector" = $3, "isShareholder" = $4, "updatedAt" = NOW()
     WHERE id = $1 AND "userId" = $2`,
    id, userId, newIsDirector, newIsShareholder
  );

  const updated = await prisma.$queryRawUnsafe<unknown[]>(
    `SELECT * FROM csi_persons WHERE id = $1`, id
  );
  return NextResponse.json({ person: updated[0] });
}
