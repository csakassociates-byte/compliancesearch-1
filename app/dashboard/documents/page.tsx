import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import DocumentsClient from "./DocumentsClient";

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login?callbackUrl=/dashboard/documents");
  return (
    <>
      <Navbar />
      <DocumentsClient />
    </>
  );
}
