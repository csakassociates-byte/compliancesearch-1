const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const connStr = process.env.DATABASE_URL
  .replace("&channel_binding=require", "")
  .replace("channel_binding=require", "")
  .replace("-pooler", "");

const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } });

async function fix() {
  const client = await pool.connect();
  console.log("Connected");

  // Drop old ipAddress column, add visitorId
  await client.query('DELETE FROM "BlogLike"');
  console.log("Cleared BlogLike rows");

  // Check if ipAddress column exists
  const cols = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name='BlogLike' AND table_schema='public'
  `);
  console.log("Current columns:", cols.rows.map(r => r.column_name).join(", "));

  // Drop old unique constraint
  try {
    await client.query('ALTER TABLE "BlogLike" DROP CONSTRAINT IF EXISTS "BlogLike_postId_ipAddress_key"');
    console.log("Dropped old unique constraint");
  } catch (e) { console.log("No old constraint to drop"); }

  // Drop old ipAddress column if exists
  try {
    await client.query('ALTER TABLE "BlogLike" DROP COLUMN IF EXISTS "ipAddress"');
    console.log("Dropped ipAddress column");
  } catch (e) { console.log("ipAddress column not found"); }

  // Add visitorId column
  await client.query('ALTER TABLE "BlogLike" ADD COLUMN IF NOT EXISTS "visitorId" TEXT NOT NULL DEFAULT \'\'');
  console.log("Added visitorId column");

  // Add new unique constraint
  try {
    await client.query('ALTER TABLE "BlogLike" ADD CONSTRAINT "BlogLike_postId_visitorId_key" UNIQUE ("postId", "visitorId")');
    console.log("Added new unique constraint");
  } catch (e) { console.log("Constraint already exists or error:", e.message); }

  // Add adminNotes to BlogPost if not exists
  try {
    await client.query('ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT');
    console.log("Added adminNotes to BlogPost");
  } catch (e) { console.log("adminNotes error:", e.message); }

  const finalCols = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name='BlogLike' AND table_schema='public'
  `);
  console.log("Final BlogLike columns:", finalCols.rows.map(r => r.column_name).join(", "));

  client.release();
  await pool.end();
  console.log("\nAll done!");
}

fix().catch(e => { console.error("ERROR:", e.message); process.exit(1); });
