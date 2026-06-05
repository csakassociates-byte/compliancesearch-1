import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const events = await prisma.calendarEvent.findMany({
      where: { isActive: true },
      orderBy: [{ dueDay: "asc" }],
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
