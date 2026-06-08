import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/auth-helpers";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json() as {
      email: string; otp: string; newPassword: string;
    };

    if (!email || !otp || !newPassword)
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    if (newPassword.length < 6)
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    const emailLower = email.toLowerCase().trim();
    const otpValid = await verifyOtp(emailLower, otp, "forgot_password");
    if (!otpValid)
      return NextResponse.json({ error: "Invalid or expired OTP." }, { status: 400 });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.$executeRawUnsafe(
      `UPDATE csi_users SET "passwordHash" = $1, "updatedAt" = NOW() WHERE email = $2`,
      passwordHash, emailLower
    );

    return NextResponse.json({ success: true, message: "Password updated! Please login." });
  } catch (e) {
    console.error("forgot-password error:", e);
    return NextResponse.json({ error: "Failed to update password." }, { status: 500 });
  }
}
