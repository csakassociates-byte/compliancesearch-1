import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamContext, logActivity, generateTempPassword } from "@/lib/team";
import { sendTeamInviteEmail, sendTeamJoinNotificationEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// GET /api/team — return team info + all members with user details
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const ctx = await getTeamContext(userId);

  const members = await prisma.$queryRawUnsafe<Array<{
    memberId: string; userId: string; role: string; addedAt: string;
    name: string | null; email: string;
  }>>(
    `SELECT tm.id as "memberId", tm."userId", tm.role, tm."addedAt",
            u.name, u.email
     FROM csi_team_members tm
     JOIN csi_users u ON u.id = tm."userId"
     WHERE tm."teamId" = $1
     ORDER BY tm."addedAt" ASC`,
    ctx.teamId
  );

  return NextResponse.json({
    teamId:   ctx.teamId,
    teamName: ctx.teamName,
    ownerId:  ctx.ownerId,
    isOwner:  ctx.isOwner,
    members,
  });
}

// POST /api/team — invite a member by email
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const inviterId = (session.user as { id: string }).id;
  const inviterName = session.user.name || session.user.email || "A team member";

  const { email } = await req.json() as { email: string };
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
  const emailLower = email.toLowerCase().trim();

  const ctx = await getTeamContext(inviterId);

  // Check if the email is already a team member
  const alreadyMember = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT tm.id FROM csi_team_members tm
     JOIN csi_users u ON u.id = tm."userId"
     WHERE tm."teamId" = $1 AND u.email = $2`,
    ctx.teamId, emailLower
  );
  if (alreadyMember.length) return NextResponse.json({ error: "This person is already a team member." }, { status: 409 });

  const teamName = ctx.teamName || "your team";
  const existingUser = await prisma.$queryRawUnsafe<Array<{ id: string; name: string | null }>>(
    `SELECT id, name FROM csi_users WHERE email = $1`,
    emailLower
  );

  if (existingUser.length) {
    // User already has an account — just add to team
    const targetUser = existingUser[0];
    await prisma.$executeRawUnsafe(
      `INSERT INTO csi_team_members (id, "teamId", "userId", role, "addedBy") VALUES ($1,$2,$3,'member',$4)
       ON CONFLICT ("teamId","userId") DO NOTHING`,
      crypto.randomUUID(), ctx.teamId, targetUser.id, inviterId
    );
    await sendTeamJoinNotificationEmail({ to: emailLower, toName: targetUser.name || "", invitedByName: inviterName, teamName });
    await logActivity({ teamId: ctx.teamId, userId: inviterId, userName: inviterName, action: `Added existing user ${emailLower} to team`, entityType: "user", entityId: targetUser.id, entityName: emailLower });
    return NextResponse.json({ success: true, message: `${emailLower} has been added to the team.` });
  }

  // New user — create account with temp password
  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  const newUserId = crypto.randomUUID();
  const now = new Date();

  await prisma.$executeRawUnsafe(
    `INSERT INTO csi_users (id, email, "passwordHash", "emailVerified", "mustChangePassword", "updatedAt")
     VALUES ($1,$2,$3,$4,TRUE,$5)`,
    newUserId, emailLower, passwordHash, now, now
  );
  await prisma.$executeRawUnsafe(
    `INSERT INTO csi_team_members (id,"teamId","userId",role,"addedBy") VALUES ($1,$2,$3,'member',$4)`,
    crypto.randomUUID(), ctx.teamId, newUserId, inviterId
  );
  await sendTeamInviteEmail({ to: emailLower, toName: "", invitedByName: inviterName, teamName, tempPassword });
  await logActivity({ teamId: ctx.teamId, userId: inviterId, userName: inviterName, action: `Invited new user ${emailLower} to team`, entityType: "user", entityId: newUserId, entityName: emailLower });

  return NextResponse.json({ success: true, message: `Invitation sent to ${emailLower}. They'll receive a temporary password by email.` });
}

// PATCH /api/team — update team name
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { teamName } = await req.json() as { teamName: string };
  const ctx = await getTeamContext(userId);
  if (!ctx.isOwner) return NextResponse.json({ error: "Only the team owner can update the team name." }, { status: 403 });

  await prisma.$executeRawUnsafe(
    `UPDATE csi_teams SET name = $1, "updatedAt" = NOW() WHERE id = $2`,
    teamName?.trim() || null, ctx.teamId
  );
  return NextResponse.json({ success: true });
}
