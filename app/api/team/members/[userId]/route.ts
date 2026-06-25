import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamContext, logActivity } from "@/lib/team";

// DELETE /api/team/members/[userId] — remove a member from the team
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const requesterId = (session.user as { id: string }).id;
  const { userId: targetUserId } = await params;

  const ctx = await getTeamContext(requesterId);
  if (!ctx.isOwner) return NextResponse.json({ error: "Only the team owner can remove members." }, { status: 403 });
  if (targetUserId === ctx.ownerId) return NextResponse.json({ error: "Cannot remove the team owner." }, { status: 400 });

  const removed = await prisma.$queryRawUnsafe<Array<{ email: string }>>(
    `SELECT u.email FROM csi_team_members tm
     JOIN csi_users u ON u.id = tm."userId"
     WHERE tm."teamId" = $1 AND tm."userId" = $2`,
    ctx.teamId, targetUserId
  );

  await prisma.$executeRawUnsafe(
    `DELETE FROM csi_team_members WHERE "teamId" = $1 AND "userId" = $2`,
    ctx.teamId, targetUserId
  );

  const removedEmail = removed[0]?.email || targetUserId;
  const requesterName = session.user.name || session.user.email || "Team owner";
  await logActivity({ teamId: ctx.teamId, userId: requesterId, userName: requesterName, action: `Removed ${removedEmail} from team`, entityType: "user", entityId: targetUserId, entityName: removedEmail });

  return NextResponse.json({ success: true });
}
