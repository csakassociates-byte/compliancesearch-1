import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const event = await prisma.calendarEvent.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description || null,
      category: body.category,
      authority: body.authority,
      recurrence: body.recurrence,
      dueDay: body.dueDay ? Number(body.dueDay) : null,
      dueMonth: body.dueMonth ? Number(body.dueMonth) : null,
      specificDate: body.specificDate ? new Date(body.specificDate) : null,
      penalty: body.penalty || null,
      link: body.link || null,
      isActive: body.isActive ?? true,
    },
  });
  return NextResponse.json(event);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.calendarEvent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
