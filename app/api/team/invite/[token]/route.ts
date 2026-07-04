import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInviteByToken, acceptTeamInvite, declineTeamInvite, logActivity } from "@/lib/team";

// GET /api/team/invite/[token] — verify token, return invite details (no auth needed)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const invite = await getInviteByToken(token);

  if (!invite) return NextResponse.json({ error: "invalid" }, { status: 404 });

  const expired = new Date(invite.expiresAt) < new Date();
  return NextResponse.json({
    status:        invite.status,
    expired,
    invitedEmail:  invite.invitedEmail,
    inviterName:   invite.inviterName,
    teamName:      invite.teamName || `${invite.inviterName}'s Team`,
  });
}

// POST /api/team/invite/[token] — accept or decline
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { action } = await req.json() as { action: "accept" | "decline" };

  if (action === "decline") {
    await declineTeamInvite(token);
    return NextResponse.json({ success: true, action: "declined" });
  }

  if (action === "accept") {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Login required to accept invite" }, { status: 401 });
    }
    const userId    = (session.user as { id: string }).id;
    const userEmail = session.user.email?.toLowerCase();

    const invite = await getInviteByToken(token);
    if (!invite) return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
    if (invite.status !== "pending") return NextResponse.json({ error: invite.status }, { status: 409 });
    if (new Date(invite.expiresAt) < new Date()) return NextResponse.json({ error: "expired" }, { status: 410 });

    // Security: only the invited email can accept
    if (userEmail !== invite.invitedEmail) {
      return NextResponse.json(
        { error: `This invite was sent to ${invite.invitedEmail}. Please login with that email.` },
        { status: 403 }
      );
    }

    await acceptTeamInvite(token, userId);
    await logActivity({
      teamId:     invite.teamId,
      userId,
      userName:   session.user.name || userEmail || "Member",
      action:     `${userEmail} accepted the team invite`,
      entityType: "user",
      entityId:   userId,
      entityName: userEmail,
    });

    return NextResponse.json({ success: true, action: "accepted" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
