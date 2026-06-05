import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const events = await prisma.calendarEvent.findMany({
    orderBy: [{ category: "asc" }, { dueDay: "asc" }],
  });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const event = await prisma.calendarEvent.create({
    data: {
      title: body.title,
      description: body.description || null,
      category: body.category,
      authority: body.authority,
      recurrence: body.recurrence || "monthly",
      dueDay: body.dueDay ? Number(body.dueDay) : null,
      dueMonth: body.dueMonth ? Number(body.dueMonth) : null,
      specificDate: body.specificDate ? new Date(body.specificDate) : null,
      penalty: body.penalty || null,
      link: body.link || null,
      isActive: true,
    },
  });
  return NextResponse.json(event);
}
