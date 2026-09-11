import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  return !!session;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { status } = await req.json() as { status: string };
  if (!["new", "replied", "closed"].includes(status))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  await prisma.$executeRawUnsafe(
    `UPDATE csi_enquiries SET status = $1, updated_at = NOW() WHERE id = $2`, status, id
  );
  return NextResponse.json({ success: true });
}
