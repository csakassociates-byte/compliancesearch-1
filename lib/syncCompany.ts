import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getTeamMemberIds } from "@/lib/team";

interface SyncCompanyOptions {
  entityType?:        string | null;
  regAddress?:        string | null;
  incorporationDate?: string | null;
}

/**
 * Finds or creates a company record, searching across the entire team.
 * Priority: CIN match > name match > insert new.
 * Prevents duplicates even when multiple team members work on the same company.
 */
export async function syncCompany(
  userId:      string,
  companyName: string,
  cin?:        string | null,
  opts?:       SyncCompanyOptions,
): Promise<string | null> {
  try {
    const memberIds = await getTeamMemberIds(userId);

    // 1. Check by CIN across the whole team (strongest match)
    if (cin) {
      const byCin = await prisma.$queryRawUnsafe<Array<{ id: string; cin: string | null }>>(
        `SELECT id, cin FROM csi_companies
         WHERE "userId" = ANY($1::text[]) AND cin = $2
         LIMIT 1`,
        memberIds, cin
      );
      if (byCin.length) {
        // Optionally update extra fields if they are now available
        if (opts?.entityType || opts?.regAddress || opts?.incorporationDate) {
          await prisma.$executeRawUnsafe(
            `UPDATE csi_companies SET
               "entityType"        = COALESCE(NULLIF("entityType",''),       $2),
               "regAddress"        = COALESCE(NULLIF("regAddress",''),        $3),
               "incorporationDate" = COALESCE(NULLIF("incorporationDate",''), $4),
               "updatedAt"         = NOW()
             WHERE id = $1`,
            byCin[0].id,
            opts.entityType        ?? null,
            opts.regAddress        ?? null,
            opts.incorporationDate ?? null,
          );
        }
        return byCin[0].id;
      }
    }

    // 2. Check by name (case-insensitive) across the whole team
    const byName = await prisma.$queryRawUnsafe<Array<{ id: string; cin: string | null }>>(
      `SELECT id, cin FROM csi_companies
       WHERE "userId" = ANY($1::text[]) AND LOWER(TRIM("companyName")) = LOWER(TRIM($2))
       LIMIT 1`,
      memberIds, companyName
    );
    if (byName.length) {
      const existing = byName[0];
      // Fill in CIN if it was missing before
      if (cin && !existing.cin) {
        await prisma.$executeRawUnsafe(
          `UPDATE csi_companies SET cin = $2, "updatedAt" = NOW() WHERE id = $1`,
          existing.id, cin
        );
      }
      return existing.id;
    }

    // 3. Not found anywhere in team — insert new
    const newId = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO csi_companies
         (id, "userId", "companyName", cin, "entityType", "regAddress", "incorporationDate", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
       ON CONFLICT DO NOTHING`,
      newId,
      userId,
      companyName.trim(),
      cin?.trim() || null,
      opts?.entityType        ?? null,
      opts?.regAddress        ?? null,
      opts?.incorporationDate ?? null,
    );
    // ON CONFLICT DO NOTHING means if a race condition hit, fetch the winner
    if (cin) {
      const winner = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM csi_companies WHERE "userId" = ANY($1::text[]) AND cin = $2 LIMIT 1`,
        memberIds, cin
      );
      if (winner.length) return winner[0].id;
    }
    return newId;
  } catch {
    return null;
  }
}
