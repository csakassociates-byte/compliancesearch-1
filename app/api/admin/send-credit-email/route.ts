import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendCreditEmail } from "@/lib/email/send-credit-email";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { toEmail, toName, creditsAdded } = await req.json();
  if (!toEmail || !creditsAdded) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  try {
    await sendCreditEmail({ toEmail, toName: toName || null, creditsAdded: Number(creditsAdded) });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Credit email failed:", err?.message);
    return NextResponse.json({ error: "Email send failed", detail: err?.message }, { status: 500 });
  }
}
