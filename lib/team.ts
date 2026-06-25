import { prisma } from "./prisma";
import crypto from "crypto";

// ── Table setup ───────────────────────────────────────────────────────────────

export async function ensureTeamTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS csi_teams (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      name        TEXT,
      "ownerId"   TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS csi_team_members (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      "teamId"    TEXT NOT NULL,
      "userId"    TEXT NOT NULL,
      role        TEXT DEFAULT 'member',
      "addedBy"   TEXT NOT NULL,
      "addedAt"   TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE("teamId", "userId")
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS csi_activity_log (
      id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      "teamId"      TEXT NOT NULL,
      "userId"      TEXT NOT NULL,
      "userName"    TEXT NOT NULL,
      action        TEXT NOT NULL,
      "entityType"  TEXT,
      "entityId"    TEXT,
      "entityName"  TEXT,
      "createdAt"   TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await prisma.$executeRawUnsafe(
    `ALTER TABLE csi_users ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN DEFAULT FALSE`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS idx_csi_team_members_userId ON csi_team_members("userId")`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS idx_csi_activity_log_teamId ON csi_activity_log("teamId")`
  );
}

// ── Team creation ─────────────────────────────────────────────────────────────

export async function getOrCreateTeam(userId: string): Promise<string> {
  await ensureTeamTables();
  const existing = await prisma.$queryRawUnsafe<Array<{ teamId: string }>>(
    `SELECT "teamId" FROM csi_team_members WHERE "userId" = $1 LIMIT 1`,
    userId
  );
  if (existing.length) return existing[0].teamId;

  const teamId = crypto.randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO csi_teams (id, "ownerId") VALUES ($1, $2)`,
    teamId, userId
  );
  await prisma.$executeRawUnsafe(
    `INSERT INTO csi_team_members (id, "teamId", "userId", role, "addedBy") VALUES ($1, $2, $3, 'owner', $4)`,
    crypto.randomUUID(), teamId, userId, userId
  );
  return teamId;
}

// ── Team context ──────────────────────────────────────────────────────────────

export async function getTeamContext(userId: string): Promise<{
  teamId: string;
  memberIds: string[];
  isOwner: boolean;
  teamName: string | null;
  ownerId: string;
}> {
  await ensureTeamTables();
  const teamId = await getOrCreateTeam(userId);

  const [members, teams] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ userId: string }>>(
      `SELECT "userId" FROM csi_team_members WHERE "teamId" = $1`,
      teamId
    ),
    prisma.$queryRawUnsafe<Array<{ name: string | null; ownerId: string }>>(
      `SELECT name, "ownerId" FROM csi_teams WHERE id = $1`,
      teamId
    ),
  ]);

  const team = teams[0];
  return {
    teamId,
    memberIds: members.map(m => m.userId),
    isOwner: team?.ownerId === userId,
    teamName: team?.name || null,
    ownerId: team?.ownerId || userId,
  };
}

export async function getTeamMemberIds(userId: string): Promise<string[]> {
  const ctx = await getTeamContext(userId);
  return ctx.memberIds;
}

// ── Activity log ──────────────────────────────────────────────────────────────

export async function logActivity(params: {
  teamId: string;
  userId: string;
  userName: string;
  action: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
}) {
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO csi_activity_log (id,"teamId","userId","userName",action,"entityType","entityId","entityName")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      crypto.randomUUID(),
      params.teamId, params.userId, params.userName,
      params.action,
      params.entityType  ?? null,
      params.entityId    ?? null,
      params.entityName  ?? null
    );
  } catch { /* non-fatal */ }
}

// ── Temp password ─────────────────────────────────────────────────────────────

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I, O
const DIGITS  = "23456789";                 // no 0, 1

export function generateTempPassword(): string {
  let p = "";
  for (let i = 0; i < 3; i++) p += LETTERS[crypto.randomInt(LETTERS.length)];
  for (let i = 0; i < 5; i++) p += DIGITS[crypto.randomInt(DIGITS.length)];
  return p;
}
