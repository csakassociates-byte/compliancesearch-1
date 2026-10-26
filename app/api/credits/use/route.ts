import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deductCredit, canUse } from "@/lib/credits";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Please login to continue" }, { status: 401 });

  const { toolSlug, description, docId } = await req.json();
  if (!toolSlug) return NextResponse.json({ error: "toolSlug required" }, { status: 400 });

  const allowed = await canUse(userId, toolSlug);
  if (!allowed) {
    return NextResponse.json(
      { error: "Insufficient credits. Please buy more credits to continue.", insufficientCredits: true },
      { status: 402 }
    );
  }

  const result = await deductCredit(userId, toolSlug, description || toolSlug, docId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Insufficient credits", insufficientCredits: true },
      { status: 402 }
    );
  }

  return NextResponse.json({ success: true, balance: result.balance });
}
