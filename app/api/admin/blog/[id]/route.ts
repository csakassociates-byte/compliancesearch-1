import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { action, rejectionNote, adminNotes } = body;

  if (action === "approve") {
    const post = await prisma.blogPost.update({
      where: { id },
      data: { status: "approved", publishedAt: new Date(), rejectionNote: null, adminNotes: null },
    });
    return NextResponse.json(post);
  }

  if (action === "reject") {
    const post = await prisma.blogPost.update({
      where: { id },
      data: { status: "rejected", rejectionNote: rejectionNote || "Does not meet guidelines" },
    });
    return NextResponse.json(post);
  }

  if (action === "pending") {
    const post = await prisma.blogPost.update({
      where: { id },
      data: { status: "pending", rejectionNote: null, publishedAt: null },
    });
    return NextResponse.json(post);
  }

  if (action === "request_revision") {
    const post = await prisma.blogPost.update({
      where: { id },
      data: { status: "revision_requested", adminNotes: adminNotes || "" },
    });
    return NextResponse.json(post);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.blogPost.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
