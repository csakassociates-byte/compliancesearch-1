import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import ClientsListClient from "./ClientsListClient";

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login?callbackUrl=/dashboard/clients");
  return <><Navbar /><ClientsListClient /></>;
}
