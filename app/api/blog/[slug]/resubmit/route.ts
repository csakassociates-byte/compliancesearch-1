import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await req.json();
  const { authorEmail, title, content, excerpt } = body;

  if (!authorEmail || !title || !content || !excerpt) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (post.status !== "revision_requested") {
    return NextResponse.json({ error: "Post is not awaiting revision" }, { status: 400 });
  }

  if (post.authorEmail.toLowerCase() !== authorEmail.toLowerCase()) {
    return NextResponse.json({ error: "Email does not match our records" }, { status: 403 });
  }

  await prisma.blogPost.update({
    where: { id: post.id },
    data: {
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt.trim(),
      status: "pending",
      adminNotes: null,
    },
  });

  return NextResponse.json({ success: true });
}
