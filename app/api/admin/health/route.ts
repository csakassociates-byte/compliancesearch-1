import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Simple health check - counts only, no sensitive data
export async function GET() {
  try {
    const [rules, calendar, blog, comments, likes] = await Promise.all([
      prisma.complianceRule.count(),
      prisma.calendarEvent.count(),
      prisma.blogPost.count(),
      prisma.blogComment.count(),
      prisma.blogLike.count(),
    ]);

    const sampleCal = await prisma.calendarEvent.findMany({
      take: 5,
      select: { title: true, recurrence: true, dueDay: true },
      orderBy: { dueDay: "asc" },
    });

    return NextResponse.json({
      status: "healthy",
      db: { rules, calendar, blog, comments, likes },
      sample: sampleCal,
      time: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ status: "error", error: e.message }, { status: 500 });
  }
}
