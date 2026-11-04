import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ComplianceDashboardDemo from "./ComplianceDashboardDemo";

export const metadata = { title: "Compliance Dashboard — ComplianceSearch.in" };

export default async function ComplianceDashboardPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/tools/compliance-monitor");
  return <ComplianceDashboardDemo />;
}
