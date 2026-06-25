import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTempPassword, ensureTeamTables } from "@/lib/team";
import { sendForgotPasswordEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json() as { email: string };
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const emailLower = email.toLowerCase().trim();

    await ensureTeamTables();

    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; name: string | null }>>(
      `SELECT id, name FROM csi_users WHERE email = $1`,
      emailLower
    );

    // Always return success to avoid email enumeration
    if (!rows.length) {
      return NextResponse.json({ success: true, message: "If this email exists, a temporary password has been sent." });
    }

    const user = rows[0];
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    await prisma.$executeRawUnsafe(
      `UPDATE csi_users SET "passwordHash" = $1, "mustChangePassword" = TRUE, "updatedAt" = NOW() WHERE id = $2`,
      passwordHash, user.id
    );

    await sendForgotPasswordEmail({
      to:           emailLower,
      toName:       user.name || "",
      tempPassword,
    });

    return NextResponse.json({ success: true, message: "A temporary password has been sent to your email." });
  } catch (e) {
    console.error("forgot-password error:", e);
    return NextResponse.json({ error: "Failed. Please try again." }, { status: 500 });
  }
}
