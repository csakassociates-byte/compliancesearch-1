import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  // Find all duplicate groups: same userId + same frn (non-empty) or same membershipNo (non-empty)
  // Keep the most recently updated record, delete the rest

  // Step 1: Duplicates by FRN (non-empty)
  const frnDups: Array<{ userId: string; frn: string; ids: string; count: bigint }> =
    await prisma.$queryRawUnsafe(`
      SELECT "userId", frn,
             STRING_AGG(id, ',' ORDER BY "updatedAt" DESC) AS ids,
             COUNT(*) AS count
      FROM csi_auditors
      WHERE frn IS NOT NULL AND frn != ''
      GROUP BY "userId", frn
      HAVING COUNT(*) > 1
    `);

  let deleted = 0;
  for (const grp of frnDups) {
    const [_keep, ...toDelete] = grp.ids.split(",");
    for (const id of toDelete) {
      await prisma.$executeRawUnsafe(`DELETE FROM csi_auditors WHERE id = $1`, id.trim());
      deleted++;
      console.log(`  Deleted duplicate (frn=${grp.frn}): ${id.trim()}`);
    }
  }

  // Step 2: Duplicates by membershipNo (non-empty), same userId — after FRN dedup
  const mnoDups: Array<{ userId: string; membershipNo: string; ids: string; count: bigint }> =
    await prisma.$queryRawUnsafe(`
      SELECT "userId", "membershipNo",
             STRING_AGG(id, ',' ORDER BY "updatedAt" DESC) AS ids,
             COUNT(*) AS count
      FROM csi_auditors
      WHERE "membershipNo" IS NOT NULL AND "membershipNo" != ''
      GROUP BY "userId", "membershipNo"
      HAVING COUNT(*) > 1
    `);

  for (const grp of mnoDups) {
    const [_keep, ...toDelete] = grp.ids.split(",");
    for (const id of toDelete) {
      await prisma.$executeRawUnsafe(`DELETE FROM csi_auditors WHERE id = $1`, id.trim());
      deleted++;
      console.log(`  Deleted duplicate (membershipNo=${grp.membershipNo}): ${id.trim()}`);
    }
  }

  if (deleted === 0) {
    console.log("No duplicates found.");
  } else {
    console.log(`\nDone. ${deleted} duplicate record(s) removed.`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
