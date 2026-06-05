import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await req.json();
  const visitorId = body.visitorId as string;

  if (!visitorId) return NextResponse.json({ error: "visitorId required" }, { status: 400 });

  const post = await prisma.blogPost.findUnique({ where: { slug, status: "approved" } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.blogLike.findUnique({
    where: { postId_visitorId: { postId: post.id, visitorId } },
  });

  if (existing) {
    await prisma.blogLike.delete({ where: { id: existing.id } });
    const count = await prisma.blogLike.count({ where: { postId: post.id } });
    return NextResponse.json({ liked: false, count });
  } else {
    await prisma.blogLike.create({ data: { postId: post.id, visitorId } });
    const count = await prisma.blogLike.count({ where: { postId: post.id } });
    return NextResponse.json({ liked: true, count });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const visitorId = searchParams.get("visitorId") || "";

  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post) return NextResponse.json({ liked: false, count: 0 });

  const [existing, count] = await Promise.all([
    visitorId
      ? prisma.blogLike.findUnique({
          where: { postId_visitorId: { postId: post.id, visitorId } },
        })
      : null,
    prisma.blogLike.count({ where: { postId: post.id } }),
  ]);

  return NextResponse.json({ liked: !!existing, count });
}
