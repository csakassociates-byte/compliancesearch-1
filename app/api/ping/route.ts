import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false });

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE csi_users SET "lastSeen" = NOW() WHERE id = $1`,
      session.user.id
    );
  } catch {
    // column may not exist yet — add it
    await prisma.$executeRawUnsafe(
      `ALTER TABLE csi_users ADD COLUMN IF NOT EXISTS "lastSeen" TIMESTAMPTZ`
    );
    await prisma.$executeRawUnsafe(
      `UPDATE csi_users SET "lastSeen" = NOW() WHERE id = $1`,
      session.user.id
    );
  }

  return NextResponse.json({ ok: true });
}
