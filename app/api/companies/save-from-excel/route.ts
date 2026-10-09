import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncCompany } from "@/lib/syncCompany";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json() as {
    companyName: string; cin?: string; entityType?: string;
    regAddress?: string; incorporationDate?: string;
  };

  if (!body.companyName?.trim())
    return NextResponse.json({ error: "Company name required" }, { status: 400 });

  const id = await syncCompany(userId, body.companyName.trim(), body.cin?.trim() || null, {
    entityType:        body.entityType?.trim()        || null,
    regAddress:        body.regAddress?.trim()        || null,
    incorporationDate: body.incorporationDate?.trim() || null,
  });
  return NextResponse.json({ success: true, id });
}
