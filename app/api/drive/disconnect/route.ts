import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrCreateTeam } from "@/lib/team";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const teamId = await getOrCreateTeam(userId);

  await prisma.$executeRawUnsafe(
    `UPDATE csi_teams
     SET "driveAccessToken"  = NULL,
         "driveRefreshToken" = NULL,
         "driveTokenExpiry"  = NULL,
         "driveEmail"        = NULL,
         "driveFolderId"     = NULL,
         "updatedAt"         = NOW()
     WHERE id = $1`,
    teamId
  );
  return NextResponse.json({ ok: true });
}
