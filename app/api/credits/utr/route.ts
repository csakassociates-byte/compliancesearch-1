import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateAccount } from "@/lib/credits";

const CREDIT_PACKAGES = [
  { amount: 199, credits: 10 },
  { amount: 499, credits: 30 },
  { amount: 1199, credits: 100 },
];

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

  return NextResponse.json({ success: true, message: "Payment request submitted. Credits will be added within 2-4 hours after verification." });
}
