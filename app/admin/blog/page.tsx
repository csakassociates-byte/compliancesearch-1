import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminBlogClient from "./AdminBlogClient";

export default async function AdminBlogPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const raw = await prisma.blogPost.findMany({
    select: {
      id: true, slug: true, title: true, category: true,
      authorName: true, authorEmail: true, authorPhone: true,
      status: true, rejectionNote: true, adminNotes: true, views: true,
      publishedAt: true, createdAt: true,
      _count: { select: { comments: true, likes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Serialize dates to strings for client component
  const posts = raw.map(p => ({
    ...p,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
  }));

  return <AdminBlogClient posts={posts} />;
}
