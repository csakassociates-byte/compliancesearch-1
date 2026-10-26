import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateAccount } from "@/lib/credits";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await getOrCreateAccount(userId);

  const txns = await prisma.csi_credit_txns.findMany({
    where: { accountId: account.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const utrRequests = await prisma.csi_utr_requests.findMany({
    where: { accountId: account.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const pricing = await prisma.csi_tool_pricing.findMany({ where: { isActive: true } });

  let effectiveBalance = account.balance;
  if (account.isFreeUnlimited) effectiveBalance = 999999;
  else if (account.freeLimit != null) {
    const used = txns.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    effectiveBalance = Math.max(0, account.freeLimit - used) + account.balance;
  }

  return NextResponse.json({
    balance: effectiveBalance,
    isFreeUnlimited: account.isFreeUnlimited,
    freeLimit: account.freeLimit,
    lifetimeCredits: account.lifetimeCredits,
    transactions: txns,
    utrRequests,
    pricing,
  });
}
