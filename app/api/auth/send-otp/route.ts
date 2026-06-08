import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOtp } from "@/lib/auth-helpers";
import { sendOtpEmail } from "@/lib/resend";

export async function POST(req: NextRequest) {
  try {
    const { email, purpose } = await req.json() as { email: string; purpose: "signup" | "forgot_password" };
    if (!email || !purpose) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const emailLower = email.toLowerCase().trim();

    if (purpose === "signup") {
      const rows = await prisma.$queryRawUnsafe<Array<{id:string}>>(
        `SELECT id FROM csi_users WHERE email = $1`, emailLower
      );
      if (rows.length) return NextResponse.json({ error: "Email already registered. Please login." }, { status: 409 });
    }

    if (purpose === "forgot_password") {
      const rows = await prisma.$queryRawUnsafe<Array<{id:string}>>(
        `SELECT id FROM csi_users WHERE email = $1`, emailLower
      );
      if (!rows.length) return NextResponse.json({ error: "No account found with this email." }, { status: 404 });
    }

    const code = await createOtp(emailLower, purpose);
    await sendOtpEmail(emailLower, code, purpose);

    return NextResponse.json({ success: true, message: "OTP sent to your email." });
  } catch (e) {
    console.error("send-otp error:", e);
    return NextResponse.json({ error: "Failed to send OTP. Please try again." }, { status: 500 });
  }
}
