import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { slug, status: "approved" },
    include: {
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: "asc" },
        include: {
          replies: { orderBy: { createdAt: "asc" } },
        },
      },
      _count: { select: { likes: true } },
    },
  });

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Increment view
  await prisma.blogPost.update({ where: { slug }, data: { views: { increment: 1 } } });

  return NextResponse.json(post);
}
