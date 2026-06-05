const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

// Remove channel_binding param which pg doesn't support, use direct endpoint
const connStr = process.env.DATABASE_URL
  .replace("-pooler", "")
  .replace("&channel_binding=require", "")
  .replace("?channel_binding=require&", "?")
  .replace("channel_binding=require", "");

console.log("Endpoint:", connStr.split("@")[1].split("/")[0]);

const pool = new Pool({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
  query_timeout: 30000,
});

async function check() {
  console.log("Connecting to DB...");
  const client = await pool.connect();
  console.log("Connected!\n");

  const tables = await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
  );
  console.log("Tables:", tables.rows.map((r) => r.tablename).join(", "));

  const rules    = await client.query('SELECT COUNT(*) FROM "ComplianceRule"');
  const cal      = await client.query('SELECT COUNT(*) FROM "CalendarEvent"');
  const blog     = await client.query('SELECT COUNT(*) FROM "BlogPost"');
  const comments = await client.query('SELECT COUNT(*) FROM "BlogComment"');
  const likes    = await client.query('SELECT COUNT(*) FROM "BlogLike"');

  console.log("\n=== Row Counts ===");
  console.log("ComplianceRule  :", rules.rows[0].count);
  console.log("CalendarEvent   :", cal.rows[0].count);
  console.log("BlogPost        :", blog.rows[0].count);
  console.log("BlogComment     :", comments.rows[0].count);
  console.log("BlogLike        :", likes.rows[0].count);

  console.log("\n=== Sample Calendar Events ===");
  const events = await client.query(
    'SELECT title, recurrence, "dueDay", "dueMonth" FROM "CalendarEvent" ORDER BY "dueDay" LIMIT 8'
  );
  events.rows.forEach((r) =>
    console.log(` ✓ ${r.title} | ${r.recurrence} | day:${r.dueDay}`)
  );

  client.release();
  await pool.end();
  console.log("\n✅ Database sab theek hai!");
}

check().catch((e) => {
  console.error("\n❌ DB ERROR:", e.message);
  process.exit(1);
});
