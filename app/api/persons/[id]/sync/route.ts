import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  // H-6: accept direction so sync is not bidirectional by default
  // direction="toShareholder" → set isShareholder=true (keep isDirector as-is)
  // direction="toDirector"    → set isDirector=true (keep isShareholder as-is)
  // direction="both" or absent → old behaviour (set both true if either is true)
  const body = await req.json().catch(() => ({})) as { direction?: string };
  const direction = body.direction || "both";

  const [p] = await prisma.$queryRawUnsafe<Array<{
    id: string; isDirector: boolean; isShareholder: boolean;
  }>>(
    `SELECT id, "isDirector", "isShareholder" FROM csi_persons WHERE id = $1 AND "userId" = $2`,
    id, userId
  );

  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let newIsDirector   = p.isDirector;
  let newIsShareholder = p.isShareholder;

  if (direction === "toShareholder") {
    newIsShareholder = true;
  } else if (direction === "toDirector") {
    newIsDirector = true;
  } else {
    // "both" — original behaviour, used when intent is unclear
    newIsDirector   = p.isDirector   || p.isShareholder;
    newIsShareholder = p.isShareholder || p.isDirector;
  }

  await prisma.$executeRawUnsafe(
    `UPDATE csi_persons SET "isDirector" = $3, "isShareholder" = $4, "updatedAt" = NOW()
     WHERE id = $1 AND "userId" = $2`,
    id, userId, newIsDirector, newIsShareholder
  );

  // M-8: SELECT must also be scoped to userId
  const updated = await prisma.$queryRawUnsafe<unknown[]>(
    `SELECT * FROM csi_persons WHERE id = $1 AND "userId" = $2`, id, userId
  );
  return NextResponse.json({ person: updated[0] });
}
