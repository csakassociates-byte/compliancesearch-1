import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const companies = await prisma.$queryRawUnsafe<Array<{
    id: string; cin: string | null; companyName: string;
    regAddress: string | null; entityType: string | null;
    incorporationDate: string | null; createdAt: Date;
    docCount: bigint;
  }>>(
    `SELECT c.*, COUNT(d.id) as "docCount"
     FROM csi_companies c
     LEFT JOIN csi_documents d ON d."companyId" = c.id
     WHERE c."userId" = $1
     GROUP BY c.id
     ORDER BY c."createdAt" DESC`,
    userId
  );

  return NextResponse.json({
    companies: companies.map(c => ({ ...c, docCount: Number(c.docCount) }))
  });
}

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

  const id = crypto.randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO csi_companies (id, "userId", "companyName", cin, "entityType", "regAddress", "incorporationDate", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
    id, userId, body.companyName.trim(),
    body.cin?.trim() || null, body.entityType?.trim() || null,
    body.regAddress?.trim() || null, body.incorporationDate?.trim() || null
  );
  return NextResponse.json({ success: true, id });
}
