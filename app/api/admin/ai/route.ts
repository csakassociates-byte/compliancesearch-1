import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === "true";
}

export async function PATCH(req: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, ai_enabled, ai_model } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (ai_enabled !== undefined) update.ai_enabled = ai_enabled;
  if (ai_model !== undefined) update.ai_model = ai_model;

  await prisma.csi_users.update({ where: { id: userId }, data: update });
  return NextResponse.json({ success: true });
}
