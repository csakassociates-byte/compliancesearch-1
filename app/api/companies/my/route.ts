import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/companies/my?cin=xxx
// Returns user's saved csi_companies row for that CIN (email, mobile, etc.)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const cin = new URL(req.url).searchParams.get("cin");
  if (!cin) return NextResponse.json({ error: "cin required" }, { status: 400 });

  // Ensure email + mobile columns exist
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_companies ADD COLUMN IF NOT EXISTS email TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_companies ADD COLUMN IF NOT EXISTS mobile TEXT`);

  const rows = await prisma.$queryRawUnsafe<Array<{
    id: string;
    companyName: string;
    cin: string | null;
    regAddress: string | null;
    entityType: string | null;
    email: string | null;
    mobile: string | null;
    incorporationDate: string | null;
  }>>(
    `SELECT id, "companyName", cin, "regAddress", "entityType", email, mobile, "incorporationDate"
     FROM csi_companies
     WHERE "userId" = $1 AND cin = $2
     LIMIT 1`,
    userId, cin
  );

  return NextResponse.json({ company: rows[0] ?? null });
}

// PATCH /api/companies/my — update email/mobile for a company by CIN
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json() as { cin: string; email?: string; mobile?: string };
  if (!body.cin) return NextResponse.json({ error: "cin required" }, { status: 400 });

  await prisma.$executeRawUnsafe(`ALTER TABLE csi_companies ADD COLUMN IF NOT EXISTS email TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE csi_companies ADD COLUMN IF NOT EXISTS mobile TEXT`);

  await prisma.$executeRawUnsafe(
    `UPDATE csi_companies SET
      email  = COALESCE(NULLIF($3, ''), email),
      mobile = COALESCE(NULLIF($4, ''), mobile),
      "updatedAt" = NOW()
     WHERE "userId" = $1 AND cin = $2`,
    userId, body.cin, body.email || "", body.mobile || ""
  );

  return NextResponse.json({ success: true });
}
