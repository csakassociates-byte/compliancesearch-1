import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import DocumentViewClient from "./DocumentViewClient";

export default async function DocumentViewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  const { id } = await params;
  return (
    <>
      <Navbar />
      <DocumentViewClient docId={id} />
    </>
  );
}
