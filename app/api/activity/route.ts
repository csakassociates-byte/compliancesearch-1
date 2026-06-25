import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamContext } from "@/lib/team";

// GET /api/activity — return recent activity for the user's team
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const ctx = await getTeamContext(userId);

  const logs = await prisma.$queryRawUnsafe<Array<{
    id: string; userId: string; userName: string;
    action: string; entityType: string | null; entityName: string | null;
    createdAt: string;
  }>>(
    `SELECT id, "userId", "userName", action, "entityType", "entityName", "createdAt"
     FROM csi_activity_log
     WHERE "teamId" = $1
     ORDER BY "createdAt" DESC
     LIMIT 100`,
    ctx.teamId
  );

  return NextResponse.json(logs);
}
