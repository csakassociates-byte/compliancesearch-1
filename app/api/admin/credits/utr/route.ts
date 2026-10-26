import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addCredits } from "@/lib/credits";

function isAdmin(session: any) {
  return !!session;
}

// GET: pending UTR requests
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const requests = await prisma.csi_utr_requests.findMany({
    include: {
      csi_credit_accounts: {
        include: { csi_users: { select: { name: true, email: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(requests);
}

// PATCH: approve or reject a UTR
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { utrId, action, adminNote } = await req.json();
  if (!utrId || !["approve", "reject"].includes(action)) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const utr = await prisma.csi_utr_requests.findUnique({
    where: { id: utrId },
    include: { csi_credit_accounts: true },
  });
  if (!utr) return NextResponse.json({ error: "UTR not found" }, { status: 404 });
  if (utr.status !== "pending") return NextResponse.json({ error: "Already processed" }, { status: 400 });

  await prisma.csi_utr_requests.update({
    where: { id: utrId },
    data: { status: action === "approve" ? "approved" : "rejected", adminNote: adminNote || null, updatedAt: new Date() },
  });

  if (action === "approve") {
    await addCredits(
      utr.csi_credit_accounts.userId,
      utr.credits,
      `Payment verified — ₹${utr.amount} (UTR: ${utr.utrNumber})`,
      utr.id
    );
  }

  return NextResponse.json({ success: true });
}
