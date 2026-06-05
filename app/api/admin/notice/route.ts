import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return false;
  return true;
}

export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const notices = await prisma.notice.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(notices);
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { title, summary, content, authority, noticeType, refNumber, actName, issuedDate } = body;
  if (!title?.trim() || !summary?.trim() || !content?.trim())
    return NextResponse.json({ error: "title, summary, content are required" }, { status: 400 });

  const notice = await prisma.notice.create({
    data: {
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      authority: authority || "MCA",
      noticeType: noticeType || "notification",
      refNumber: refNumber?.trim() || null,
      actName: actName?.trim() || null,
      issuedDate: issuedDate ? new Date(issuedDate) : new Date(),
    },
  });
  return NextResponse.json(notice, { status: 201 });
}
