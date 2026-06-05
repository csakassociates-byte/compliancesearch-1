import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  return !!session;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { title, summary, content, authority, noticeType, refNumber, actName, issuedDate, isActive } = body;

  const notice = await prisma.notice.update({
    where: { id },
    data: {
      ...(title      && { title: title.trim() }),
      ...(summary    && { summary: summary.trim() }),
      ...(content    && { content: content.trim() }),
      ...(authority  && { authority }),
      ...(noticeType && { noticeType }),
      refNumber: refNumber?.trim() ?? null,
      actName:   actName?.trim()   ?? null,
      ...(issuedDate !== undefined && { issuedDate: new Date(issuedDate) }),
      ...(isActive   !== undefined && { isActive }),
    },
  });
  return NextResponse.json(notice);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.notice.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
