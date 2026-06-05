import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "";
  const page = Number(searchParams.get("page") || "1");
  const limit = 12;
  const skip = (page - 1) * limit;

  const where = {
    status: "approved",
    ...(category ? { category } : {}),
  };

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      select: {
        id: true, slug: true, title: true, excerpt: true,
        category: true, tags: true, authorName: true,
        views: true, publishedAt: true, createdAt: true,
        _count: { select: { comments: true, likes: true } },
      },
      orderBy: { publishedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return NextResponse.json({ posts, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, content, excerpt, category, tags, authorName, authorEmail, authorPhone } = body;

  if (!title || !content || !excerpt || !authorName || !authorEmail || !authorPhone) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const baseSlug = toSlug(title);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.blogPost.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const post = await prisma.blogPost.create({
    data: {
      title,
      slug,
      content,
      excerpt,
      category: category || "general",
      tags: tags || "",
      authorName,
      authorEmail,
      authorPhone,
      status: "pending",
    },
  });

  return NextResponse.json({ success: true, id: post.id, slug: post.slug }, { status: 201 });
}
