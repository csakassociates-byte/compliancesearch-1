import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { query } = body; // email or phone

  if (!query?.trim()) {
    return NextResponse.json({ error: "Email or phone required" }, { status: 400 });
  }

  const posts = await prisma.blogPost.findMany({
    where: {
      OR: [
        { authorEmail: { equals: query.trim(), mode: "insensitive" } },
        { authorPhone: query.trim() },
      ],
    },
    select: {
      id: true, slug: true, title: true, status: true,
      rejectionNote: true, adminNotes: true, views: true,
      content: true, excerpt: true, publishedAt: true,
      createdAt: true, category: true,
      _count: { select: { comments: true, likes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(posts);
}
