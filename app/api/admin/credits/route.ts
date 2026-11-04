import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addCredits } from "@/lib/credits";

function isAdmin(session: any) {
  return !!session;
}

async function ensureHiddenColumn() {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE csi_users ADD COLUMN IF NOT EXISTS "isHiddenFromAdmin" BOOLEAN NOT NULL DEFAULT false`
    );
  } catch { /* already exists */ }
}

// GET: list all orgs with credit info
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await ensureHiddenColumn();

  const url = new URL(req.url);
  const showHidden = url.searchParams.get("showHidden") === "1";

  // Fetch ALL users, not just those with credit accounts
  const users = await prisma.csi_users.findMany({
    where: { plan: { not: "admin" } },
    select: {
      id: true, name: true, email: true, createdAt: true, ai_enabled: true, ai_model: true, phone: true, firmName: true,
      isHiddenFromAdmin: true,
      csi_credit_accounts: {
        include: {
          csi_credit_txns: { orderBy: { createdAt: "desc" }, take: 20 },
          csi_utr_requests: { orderBy: { createdAt: "desc" }, take: 20 },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter hidden unless showHidden requested
  const visibleUsers = showHidden ? users : users.filter(u => !u.isHiddenFromAdmin);

  // Fetch per-user doc stats from csi_documents (accurate, all-time)
  const userIds = visibleUsers.map(u => u.id);

  const [docCounts, annualFilingCounts, clientCounts] = await Promise.all([
    // Total documents generated per user
    prisma.csi_documents.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _count: { id: true },
    }),
    // Annual filing specifically
    prisma.csi_documents.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, type: "annual_filing" },
      _count: { id: true },
    }),
    // Unique clients per user
    prisma.csi_documents.groupBy({
      by: ["userId", "companyId"],
      where: { userId: { in: userIds }, companyId: { not: null } },
    }),
  ]);

  const docCountMap: Record<string, number> = {};
  docCounts.forEach(d => { docCountMap[d.userId] = d._count.id; });

  const annualFilingMap: Record<string, number> = {};
  annualFilingCounts.forEach(d => { annualFilingMap[d.userId] = d._count.id; });

  // Count unique companyIds per user
  const clientCountMap: Record<string, Set<string>> = {};
  clientCounts.forEach(d => {
    if (!clientCountMap[d.userId]) clientCountMap[d.userId] = new Set();
    if (d.companyId) clientCountMap[d.userId].add(d.companyId);
  });

  // Normalize: wrap users without a credit account into a consistent shape
  const result = visibleUsers.map((u) => {
    const acc = u.csi_credit_accounts;
    const stats = {
      totalDocsGenerated: docCountMap[u.id] ?? 0,
      annualFilingCount: annualFilingMap[u.id] ?? 0,
      clientCount: clientCountMap[u.id]?.size ?? 0,
    };
    const userInfo = { id: u.id, name: u.name, email: u.email, createdAt: u.createdAt, ai_enabled: u.ai_enabled, ai_model: u.ai_model, phone: u.phone, firmName: u.firmName, isHiddenFromAdmin: u.isHiddenFromAdmin ?? false };
    if (acc) return {
      ...acc,
      ...stats,
      isHiddenFromAdmin: u.isHiddenFromAdmin ?? false,
      csi_users: userInfo,
    };
    return {
      id: null,
      userId: u.id,
      balance: 0,
      lifetimeCredits: 0,
      freeCreditsGiven: 0,
      isFreeUnlimited: false,
      freeLimit: null,
      isHiddenFromAdmin: u.isHiddenFromAdmin ?? false,
      createdAt: u.createdAt,
      updatedAt: u.createdAt,
      ...stats,
      csi_users: userInfo,
      csi_credit_txns: [],
      csi_utr_requests: [],
    };
  });

  return NextResponse.json(result);
}

// POST: manually add credits to a user
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, amount, description } = await req.json();
  if (!userId || !amount || amount < 1) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const newBalance = await addCredits(userId, Number(amount), description || "Admin credit");
  return NextResponse.json({ success: true, newBalance });
}

// PATCH: toggle free unlimited, set freeLimit, or hide/unhide from admin
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { userId, isFreeUnlimited, freeLimit, isHiddenFromAdmin } = body;
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  // Handle hide/unhide — updates csi_users directly
  if (isHiddenFromAdmin !== undefined) {
    await ensureHiddenColumn();
    await prisma.$executeRawUnsafe(
      `UPDATE csi_users SET "isHiddenFromAdmin" = $1 WHERE id = $2`,
      isHiddenFromAdmin,
      userId
    );
    return NextResponse.json({ success: true });
  }

  const account = await prisma.csi_credit_accounts.findUnique({ where: { userId } });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const updated = await prisma.csi_credit_accounts.update({
    where: { userId },
    data: {
      ...(isFreeUnlimited !== undefined ? { isFreeUnlimited } : {}),
      ...(freeLimit !== undefined ? { freeLimit: freeLimit === null ? null : Number(freeLimit) } : {}),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, account: updated });
}
