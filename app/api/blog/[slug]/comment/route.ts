import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await req.json();
  const { authorName, content, parentId } = body;

  if (!authorName?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Name and comment required" }, { status: 400 });
  }

  const post = await prisma.blogPost.findUnique({ where: { slug, status: "approved" } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const comment = await prisma.blogComment.create({
    data: {
      postId: post.id,
      parentId: parentId || null,
      authorName: authorName.trim(),
      content: content.trim(),
    },
    include: { replies: true },
  });

  return NextResponse.json(comment, { status: 201 });
}
