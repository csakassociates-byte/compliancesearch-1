import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTeamContext, getPendingInvites, cancelTeamInvite } from "@/lib/team";

// GET /api/team/invites — list pending invites for current team (owner only)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const ctx = await getTeamContext(userId);
  if (!ctx.isOwner) return NextResponse.json({ invites: [] });

  const invites = await getPendingInvites(ctx.teamId);
  return NextResponse.json({ invites });
}

// DELETE /api/team/invites — cancel a pending invite
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { inviteId } = await req.json() as { inviteId: string };
  if (!inviteId) return NextResponse.json({ error: "inviteId required" }, { status: 400 });

  const ctx = await getTeamContext(userId);
  if (!ctx.isOwner) return NextResponse.json({ error: "Only team owner can cancel invites" }, { status: 403 });

  await cancelTeamInvite(inviteId, ctx.teamId);
  return NextResponse.json({ success: true });
}
