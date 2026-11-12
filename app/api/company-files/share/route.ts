import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrCreateTeam } from "@/lib/team";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

async function ensureShareTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS csi_share_links (
      id            TEXT PRIMARY KEY,
      "teamId"      TEXT NOT NULL,
      "companyId"   TEXT NOT NULL,
      "companyName" TEXT NOT NULL,
      token         TEXT NOT NULL UNIQUE,
      label         TEXT,
      "fileIds"     TEXT[],
      "shareMode"   TEXT NOT NULL DEFAULT 'all',
      "expiresAt"   TIMESTAMPTZ,
      "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  // Add columns if table already exists without them
  await prisma.$executeRawUnsafe(
    `ALTER TABLE csi_share_links ADD COLUMN IF NOT EXISTS "fileIds" TEXT[]`
  ).catch(() => {});
  await prisma.$executeRawUnsafe(
    `ALTER TABLE csi_share_links ADD COLUMN IF NOT EXISTS "shareMode" TEXT NOT NULL DEFAULT 'all'`
  ).catch(() => {});
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS idx_share_links_token ON csi_share_links(token)`
  );
}

// POST /api/company-files/share
// Body: { companyId, companyName, label?, expiryDays?, fileIds?, shareMode? }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const teamId = await getOrCreateTeam(userId);
  await ensureShareTable();

  const body = await req.json();
  const { companyId, companyName, label, expiryDays = 30, fileIds, shareMode = "all" } = body;

  if (!companyId || !companyName) {
    return NextResponse.json({ error: "Missing companyId or companyName" }, { status: 400 });
  }

  const id        = crypto.randomUUID();
  const token     = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
  const fileIdsArr = fileIds && fileIds.length > 0 ? fileIds : null;

  await prisma.$executeRawUnsafe(
    `INSERT INTO csi_share_links
     (id, "teamId", "companyId", "companyName", token, label, "fileIds", "shareMode", "expiresAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    id, teamId, companyId, companyName, token, label ?? null,
    fileIdsArr, shareMode, expiresAt
  );

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  return NextResponse.json({ token, url: `${baseUrl}/share/${token}`, expiresAt, shareMode });
}

// GET /api/company-files/share?companyId=xxx
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const teamId = await getOrCreateTeam(userId);
  await ensureShareTable();

  const companyId = req.nextUrl.searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "Missing companyId" }, { status: 400 });

  const links = await prisma.$queryRawUnsafe<Array<{
    id: string; token: string; label: string | null; shareMode: string;
    fileIds: string[] | null; expiresAt: Date | null; createdAt: Date;
  }>>(
    `SELECT id, token, label, "shareMode", "fileIds", "expiresAt", "createdAt"
     FROM csi_share_links
     WHERE "teamId" = $1 AND "companyId" = $2
     ORDER BY "createdAt" DESC`,
    teamId, companyId
  );

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  return NextResponse.json({
    links: links.map(l => ({ ...l, url: `${baseUrl}/share/${l.token}` }))
  });
}

// DELETE /api/company-files/share?id=xxx
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const teamId = await getOrCreateTeam(userId);

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.$executeRawUnsafe(
    `DELETE FROM csi_share_links WHERE id = $1 AND "teamId" = $2`,
    id, teamId
  );
  return NextResponse.json({ ok: true });
}
