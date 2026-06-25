import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const userId = (session.user as { id?: string }).id;
    if (!userId) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const { newPassword } = await req.json() as { newPassword: string };
    if (!newPassword || newPassword.length < 8)
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$executeRawUnsafe(
      `UPDATE csi_users SET "passwordHash" = $1, "mustChangePassword" = FALSE, "updatedAt" = NOW() WHERE id = $2`,
      passwordHash, userId
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("set-password error:", e);
    return NextResponse.json({ error: "Failed. Please try again." }, { status: 500 });
  }
}
