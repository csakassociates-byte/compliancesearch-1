import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamMemberIds } from "@/lib/team";
import crypto from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const memberIds = await getTeamMemberIds(userId);

  // ── Auto-clean duplicate companies for this user ──────────────────────────
  // Fetch user's own companies ordered oldest-first (we keep oldest when tied)
  const raw = await prisma.$queryRawUnsafe<Array<{
    id: string; cin: string | null; companyName: string; createdAt: Date; docCount: bigint;
  }>>(
    `SELECT c.id, c.cin, c."companyName", c."createdAt", COUNT(d.id) as "docCount"
     FROM csi_companies c
     LEFT JOIN csi_documents d ON d."companyId" = c.id
     WHERE c."userId" = $1
     GROUP BY c.id
     ORDER BY c."createdAt" ASC`,
    userId
  );

  // Group by CIN (non-null) first; remaining go into name groups
  const cinMap  = new Map<string, typeof raw>();
  const noCin: typeof raw = [];
  for (const c of raw) {
    const cin = c.cin?.trim();
    if (cin) {
      if (!cinMap.has(cin)) cinMap.set(cin, []);
      cinMap.get(cin)!.push(c);
    } else {
      noCin.push(c);
    }
  }
  const nameMap = new Map<string, typeof raw>();
  for (const c of noCin) {
    const norm = c.companyName.trim().toUpperCase();
    if (!nameMap.has(norm)) nameMap.set(norm, []);
    nameMap.get(norm)!.push(c);
  }

  // Merge helper: migrate linked rows from dup → keeper, then delete dup
  async function mergeGroup(group: typeof raw) {
    if (group.length <= 1) return;
    // Keep the one with the most documents; on a tie keep the oldest (first in list)
    const sorted = [...group].sort((a, b) => Number(b.docCount) - Number(a.docCount));
    const keeper = sorted[0];
    for (const dup of sorted.slice(1)) {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE csi_documents   SET "companyId" = $1 WHERE "companyId" = $2 AND "userId" = $3`, keeper.id, dup.id, userId);
        await prisma.$executeRawUnsafe(
          `UPDATE csi_persons     SET "companyId" = $1 WHERE "companyId" = $2 AND "userId" = $3`, keeper.id, dup.id, userId);
        await prisma.$executeRawUnsafe(
          `UPDATE csi_shareholders SET "companyId" = $1 WHERE "companyId" = $2 AND "userId" = $3`, keeper.id, dup.id, userId);
        await prisma.$executeRawUnsafe(
          `DELETE FROM csi_companies WHERE id = $1 AND "userId" = $2`, dup.id, userId);
      } catch { /* skip; will retry next load */ }
    }
  }

  for (const [, group] of cinMap)  await mergeGroup(group);
  for (const [, group] of nameMap) await mergeGroup(group);
  // ─────────────────────────────────────────────────────────────────────────

  const companies = await prisma.$queryRawUnsafe<Array<{
    id: string; cin: string | null; companyName: string;
    regAddress: string | null; entityType: string | null;
    incorporationDate: string | null; createdAt: Date;
    docCount: bigint;
  }>>(
    `SELECT c.*, COUNT(d.id) as "docCount"
     FROM csi_companies c
     LEFT JOIN csi_documents d ON d."companyId" = c.id
     WHERE c."userId" = ANY($1::text[])
     GROUP BY c.id
     ORDER BY c."createdAt" DESC`,
    memberIds
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
