/**
 * Downloads Razorpay IFSC dataset and seeds IFSCBranch table.
 * Run: node scripts/seed-ifsc.js
 */

require("dotenv").config({ path: ".env.local" });
const https  = require("https");
const http   = require("http");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg }     = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma  = new PrismaClient({ adapter });

const CSV_URL = "https://github.com/razorpay/ifsc/releases/latest/download/IFSC.csv";
const BATCH   = 500;

// ── Simple CSV line parser (handles quoted fields) ──────────────
function parseLine(line) {
  const fields = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; continue; }
    if (c === "," && !inQ) { fields.push(cur.trim()); cur = ""; continue; }
    cur += c;
  }
  fields.push(cur.trim());
  return fields;
}

// ── Follow redirects ─────────────────────────────────────────────
function fetchUrl(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 10) return reject(new Error("Too many redirects"));
    const mod = url.startsWith("https") ? https : http;
    mod.get(url, { headers: { "User-Agent": "ifsc-seeder/1.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = res.headers.location.startsWith("http")
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        res.resume();
        return resolve(fetchUrl(next, redirectCount + 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      resolve(res);
    }).on("error", reject);
  });
}

async function main() {
  // Check if already seeded
  const count = await prisma.iFSCBranch.count();
  if (count > 0) {
    console.log(`✓ Already seeded — ${count.toLocaleString()} IFSC records in DB. Skipping.`);
    console.log("  To re-seed: DELETE FROM \"IFSCBranch\"; then run again.");
    await prisma.$disconnect();
    return;
  }

  console.log("⬇  Downloading IFSC.csv from Razorpay GitHub…");
  const stream = await fetchUrl(CSV_URL);

  let header  = null;
  let buffer  = "";
  let batch   = [];
  let total   = 0;
  let skipped = 0;

  async function flushBatch() {
    if (batch.length === 0) return;
    await prisma.iFSCBranch.createMany({ data: batch, skipDuplicates: true });
    total += batch.length;
    process.stdout.write(`\r  Inserted: ${total.toLocaleString()} records…`);
    batch = [];
  }

  await new Promise((resolve, reject) => {
    stream.on("data", async (chunk) => {
      stream.pause();
      buffer += chunk.toString("utf8");
      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep last incomplete line

      for (const rawLine of lines) {
        const line = rawLine.replace(/\r$/, "").trim();
        if (!line) continue;

        if (!header) {
          header = parseLine(line).map(h => h.toUpperCase());
          continue;
        }

        const fields = parseLine(line);
        const get = (key) => (fields[header.indexOf(key)] || "").trim();

        const ifsc     = get("IFSC");
        const bank     = get("BANK");
        const bankCode = get("BANKCODE");
        const branch   = get("BRANCH");
        const city     = get("CITY") || get("DISTRICT");
        const district = get("DISTRICT");
        const state    = get("STATE");
        const address  = get("ADDRESS");

        if (!ifsc || !bank) { skipped++; continue; }

        batch.push({ ifsc, bank, bankCode, branch, city, district, state, address });

        if (batch.length >= BATCH) {
          await flushBatch();
        }
      }
      stream.resume();
    });

    stream.on("end", async () => {
      // flush remaining
      if (buffer.trim()) {
        const line = buffer.trim();
        if (header) {
          const fields = parseLine(line);
          const get = (key) => (fields[header.indexOf(key)] || "").trim();
          const ifsc = get("IFSC"), bank = get("BANK");
          if (ifsc && bank) {
            batch.push({
              ifsc, bank,
              bankCode: get("BANKCODE"),
              branch:   get("BRANCH"),
              city:     get("CITY") || get("DISTRICT"),
              district: get("DISTRICT"),
              state:    get("STATE"),
              address:  get("ADDRESS"),
            });
          }
        }
      }
      await flushBatch();
      resolve();
    });

    stream.on("error", reject);
  });

  console.log(`\n✅ Done! Seeded ${total.toLocaleString()} IFSC records. Skipped: ${skipped}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("\n❌ Error:", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
