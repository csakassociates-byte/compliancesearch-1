import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q")?.trim() || "";
  if (!q || q.length < 2) return NextResponse.json({ rules: [], posts: [] });

  const [rules, posts] = await Promise.all([
    prisma.complianceRule.findMany({
      where: {
        isActive: true,
        OR: [
          { name:        { contains: q, mode: "insensitive" } },
          { shortName:   { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { tags:        { contains: q, mode: "insensitive" } },
          { authority:   { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, ruleKey: true, name: true, shortName: true, category: true, priority: true },
      take: 6,
    }),
    prisma.blogPost.findMany({
      where: {
        status: "approved",
        OR: [
          { title:      { contains: q, mode: "insensitive" } },
          { excerpt:    { contains: q, mode: "insensitive" } },
          { tags:       { contains: q, mode: "insensitive" } },
          { authorName: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, slug: true, title: true, category: true, authorName: true },
      take: 5,
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  return NextResponse.json({ rules, posts });
}
