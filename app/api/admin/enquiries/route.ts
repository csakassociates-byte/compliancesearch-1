import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  return !!session;
}

export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.$queryRawUnsafe<Array<{
    id: string; name: string; email: string; mobile: string;
    company_name: string | null; query_type: string; message: string;
    status: string; source: string; created_at: string;
  }>>(
    `SELECT id, name, email, mobile, company_name, query_type, message, status, source, created_at
     FROM csi_enquiries ORDER BY created_at DESC`
  );
  return NextResponse.json(rows);
}
