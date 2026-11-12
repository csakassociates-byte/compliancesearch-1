import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDriveStatus } from "@/lib/google-drive";
import { ensureCompanyFilesTables } from "@/lib/company-files-setup";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  await ensureCompanyFilesTables();
  const status = await getDriveStatus(userId);
  return NextResponse.json(status);
}
