import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/auth-helpers";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, otp } = await req.json() as {
      name: string; email: string; password: string; otp: string;
    };

    if (!name || !email || !password || !otp)
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });

    const emailLower = email.toLowerCase().trim();

    const otpValid = await verifyOtp(emailLower, otp, "signup");
    if (!otpValid)
      return NextResponse.json({ error: "Invalid or expired OTP. Please request a new one." }, { status: 400 });

    const passwordHash = await bcrypt.hash(password, 12);
    const id = crypto.randomUUID();
    const now = new Date();

    await prisma.$executeRawUnsafe(
      `INSERT INTO csi_users (id, name, email, "passwordHash", "emailVerified", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6)`,
      id, name.trim(), emailLower, passwordHash, now, now
    );

    return NextResponse.json({ success: true, message: "Account created! Please login." });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("unique") || msg.includes("duplicate"))
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    console.error("signup error:", e);
    return NextResponse.json({ error: "Signup failed. Please try again." }, { status: 500 });
  }
}
