import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminCalendarClient from "./AdminCalendarClient";

export default async function AdminCalendarPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const raw = await prisma.calendarEvent.findMany({
    orderBy: [{ category: "asc" }, { dueDay: "asc" }],
  });

  const events = raw.map(e => ({
    ...e,
    specificDate: e.specificDate ? e.specificDate.toISOString() : null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

  return <AdminCalendarClient events={events} />;
}
