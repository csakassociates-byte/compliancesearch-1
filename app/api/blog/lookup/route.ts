import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { phone } = body;

  if (!phone?.trim()) return NextResponse.json({ found: false });

  const post = await prisma.blogPost.findFirst({
    where: { authorPhone: phone.trim() },
    select: { authorName: true, authorEmail: true },
    orderBy: { createdAt: "desc" },
  });

  if (!post) return NextResponse.json({ found: false });

  return NextResponse.json({
    found: true,
    authorName: post.authorName,
    authorEmail: post.authorEmail,
  });
}
