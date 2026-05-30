import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const rules = await prisma.complianceRule.findMany({
    orderBy: [{ category: "asc" }, { priority: "asc" }],
  });

  return <AdminDashboardClient rules={rules} />;
}
