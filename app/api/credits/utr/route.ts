import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateAccount } from "@/lib/credits";
import { Resend } from "resend";

const CREDIT_PACKAGES = [
  { amount: 199, credits: 10 },
  { amount: 499, credits: 30 },
  { amount: 1199, credits: 100 },
];

const ADMIN_EMAILS = ["csakassociates@gmail.com", "bkgupta5011@gmail.com"];

async function sendUtrNotification(userName: string, userEmail: string, utrNumber: string, amount: number, credits: number) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // silently skip if key not configured

  const resend = new Resend(apiKey);
  const adminUrl = "https://compliancesearch.in/admin/organisations";

  await resend.emails.send({
    from: "ComplianceSearch <noreply@compliancesearch.in>",
    to: ADMIN_EMAILS,
    subject: `💰 New Payment Request — ₹${amount} from ${userName || userEmail}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
        <div style="background:#059669;padding:20px 24px">
          <h2 style="color:#fff;margin:0;font-size:18px">New Payment Request on ComplianceSearch.in</h2>
        </div>
        <div style="padding:24px;background:#fff">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#6b7280;width:40%">User Name</td><td style="padding:8px 0;font-weight:600;color:#111827">${userName || "—"}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">Email</td><td style="padding:8px 0;color:#111827">${userEmail}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">UTR Number</td><td style="padding:8px 0;font-family:monospace;font-size:15px;font-weight:700;color:#111827">${utrNumber}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">Amount Paid</td><td style="padding:8px 0;font-weight:700;color:#059669;font-size:16px">₹${amount}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">Credits to Add</td><td style="padding:8px 0;font-weight:700;color:#7c3aed">${credits} credits</td></tr>
          </table>
          <div style="margin-top:20px">
            <a href="${adminUrl}" style="display:inline-block;background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
              Open Admin Panel →
            </a>
          </div>
          <p style="margin-top:16px;font-size:12px;color:#9ca3af">Verify the UTR on your UPI app / bank statement before approving.</p>
        </div>
      </div>
    `,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { utrNumber, amount } = await req.json();
  if (!utrNumber?.trim() || !amount) return NextResponse.json({ error: "UTR number and amount required" }, { status: 400 });

  const pkg = CREDIT_PACKAGES.find(p => p.amount === Number(amount));
  if (!pkg) return NextResponse.json({ error: "Invalid package amount" }, { status: 400 });

  const account = await getOrCreateAccount(userId);

  const existing = await prisma.csi_utr_requests.findFirst({ where: { utrNumber: utrNumber.trim() } });
  if (existing) return NextResponse.json({ error: "This UTR number has already been submitted" }, { status: 400 });

  await prisma.csi_utr_requests.create({
    data: {
      accountId: account.id,
      utrNumber: utrNumber.trim(),
      amount: pkg.amount,
      credits: pkg.credits,
    },
  });

  // Send email notification to admins (non-blocking)
  const user = await prisma.csi_users.findUnique({ where: { id: userId }, select: { name: true, email: true } });
  sendUtrNotification(user?.name || "", user?.email || "", utrNumber.trim(), pkg.amount, pkg.credits).catch(() => {});

  return NextResponse.json({ success: true, message: "Payment request submitted. Credits will be added within 2-4 hours after verification." });
}
