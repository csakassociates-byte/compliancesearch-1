import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import MyCAsClient from "./MyCAsClient";

export const metadata = { title: "My CA List — ComplianceSearch.in" };

export default async function MyCAsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login?callbackUrl=/dashboard/my-cas");
  return <><Navbar /><MyCAsClient /></>;
}
