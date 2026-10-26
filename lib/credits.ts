import { prisma } from "./prisma";

export const FREE_CREDITS_ON_SIGNUP = 5;

export async function getOrCreateAccount(userId: string) {
  let account = await prisma.csi_credit_accounts.findUnique({ where: { userId } });
  if (!account) {
    account = await prisma.csi_credit_accounts.create({
      data: {
        userId,
        balance: FREE_CREDITS_ON_SIGNUP,
        lifetimeCredits: FREE_CREDITS_ON_SIGNUP,
        freeCreditsGiven: FREE_CREDITS_ON_SIGNUP,
      },
    });
    await prisma.csi_credit_txns.create({
      data: {
        accountId: account.id,
        type: "free",
        amount: FREE_CREDITS_ON_SIGNUP,
        description: `Welcome bonus — ${FREE_CREDITS_ON_SIGNUP} free credits on signup`,
      },
    });
  }
  return account;
}

export async function getBalance(userId: string): Promise<number> {
  const account = await getOrCreateAccount(userId);
  if (account.isFreeUnlimited) return 999999;
  if (account.freeLimit != null) {
    const used = await prisma.csi_credit_txns.aggregate({
      where: { accountId: account.id, type: "debit" },
      _sum: { amount: true },
    });
    const totalUsed = used._sum.amount ?? 0;
    return Math.max(0, account.freeLimit - totalUsed) + account.balance;
  }
  return account.balance;
}

export async function getToolCost(toolSlug: string): Promise<number> {
  const pricing = await prisma.csi_tool_pricing.findUnique({ where: { toolSlug } });
  return pricing?.creditCost ?? 1;
}

export async function canUse(userId: string, toolSlug: string): Promise<boolean> {
  const account = await getOrCreateAccount(userId);
  if (account.isFreeUnlimited) return true;
  const cost = await getToolCost(toolSlug);
  if (account.freeLimit != null) {
    const used = await prisma.csi_credit_txns.aggregate({
      where: { accountId: account.id, type: "debit" },
      _sum: { amount: true },
    });
    const totalUsed = used._sum.amount ?? 0;
    if (account.freeLimit - totalUsed >= cost) return true;
  }
  return account.balance >= cost;
}

export async function deductCredit(
  userId: string,
  toolSlug: string,
  description: string,
  docId?: string
): Promise<{ success: boolean; balance: number; error?: string }> {
  const account = await getOrCreateAccount(userId);

  if (account.isFreeUnlimited) {
    await prisma.csi_credit_txns.create({
      data: { accountId: account.id, type: "debit", amount: 0, toolSlug, description: `[Unlimited] ${description}`, docId },
    });
    return { success: true, balance: 999999 };
  }

  const cost = await getToolCost(toolSlug);

  if (account.freeLimit != null) {
    const used = await prisma.csi_credit_txns.aggregate({
      where: { accountId: account.id, type: "debit" },
      _sum: { amount: true },
    });
    const totalUsed = used._sum.amount ?? 0;
    if (account.freeLimit - totalUsed >= cost) {
      await prisma.csi_credit_txns.create({
        data: { accountId: account.id, type: "debit", amount: cost, toolSlug, description: `[Free Org] ${description}`, docId },
      });
      return { success: true, balance: Math.max(0, account.freeLimit - totalUsed - cost) + account.balance };
    }
  }

  if (account.balance < cost) {
    return { success: false, balance: account.balance, error: "Insufficient credits" };
  }

  const updated = await prisma.csi_credit_accounts.update({
    where: { id: account.id },
    data: { balance: { decrement: cost }, updatedAt: new Date() },
  });

  await prisma.csi_credit_txns.create({
    data: { accountId: account.id, type: "debit", amount: cost, toolSlug, description, docId },
  });

  return { success: true, balance: updated.balance };
}

export async function addCredits(userId: string, amount: number, description: string, utrId?: string): Promise<number> {
  const account = await getOrCreateAccount(userId);
  const updated = await prisma.csi_credit_accounts.update({
    where: { id: account.id },
    data: { balance: { increment: amount }, lifetimeCredits: { increment: amount }, updatedAt: new Date() },
  });
  await prisma.csi_credit_txns.create({
    data: { accountId: account.id, type: "credit", amount, description, utrId },
  });
  return updated.balance + amount;
}
