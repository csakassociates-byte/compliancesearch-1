import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import TeamClient from "./TeamClient";

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  return <TeamClient />;
}
