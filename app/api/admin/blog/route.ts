import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";

  const posts = await prisma.blogPost.findMany({
    where: status ? { status } : {},
    select: {
      id: true, slug: true, title: true, category: true,
      authorName: true, authorEmail: true, authorPhone: true,
      status: true, rejectionNote: true, views: true,
      publishedAt: true, createdAt: true,
      _count: { select: { comments: true, likes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(posts);
}
