import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

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

  // Check if already exists for this user (avoid duplicates)
  const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM csi_companies WHERE "userId" = $1 AND LOWER("companyName") = LOWER($2) LIMIT 1`,
    userId, body.companyName.trim()
  );

  if (existing.length) {
    // Update existing record with fresh data
    await prisma.$executeRawUnsafe(
      `UPDATE csi_companies SET
        cin = COALESCE($3, cin),
        "entityType" = COALESCE($4, "entityType"),
        "regAddress" = COALESCE($5, "regAddress"),
        "incorporationDate" = COALESCE($6, "incorporationDate"),
        "updatedAt" = NOW()
       WHERE id = $1 AND "userId" = $2`,
      existing[0].id, userId,
      body.cin?.trim() || null,
      body.entityType?.trim() || null,
      body.regAddress?.trim() || null,
      body.incorporationDate?.trim() || null
    );
    return NextResponse.json({ success: true, id: existing[0].id, updated: true });
  }

  // Insert new
  const id = crypto.randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO csi_companies (id, "userId", "companyName", cin, "entityType", "regAddress", "incorporationDate", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
    id, userId, body.companyName.trim(),
    body.cin?.trim() || null,
    body.entityType?.trim() || null,
    body.regAddress?.trim() || null,
    body.incorporationDate?.trim() || null
  );
  return NextResponse.json({ success: true, id });
}
