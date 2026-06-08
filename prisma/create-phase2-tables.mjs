import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_3RCEWjpHk7Fh@ep-empty-salad-aq0stiwo.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require',
});
const sql = `
CREATE TABLE IF NOT EXISTS csi_companies (
  id              TEXT PRIMARY KEY,
  "userId"        TEXT NOT NULL REFERENCES csi_users(id) ON DELETE CASCADE,
  cin             TEXT,
  "companyName"   TEXT NOT NULL,
  "regAddress"    TEXT,
  "entityType"    TEXT,
  "incorporationDate" TEXT,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS csi_companies_user ON csi_companies("userId");

CREATE TABLE IF NOT EXISTS csi_documents (
  id              TEXT PRIMARY KEY,
  "userId"        TEXT NOT NULL REFERENCES csi_users(id) ON DELETE CASCADE,
  "companyId"     TEXT REFERENCES csi_companies(id) ON DELETE SET NULL,
  type            TEXT NOT NULL,
  title           TEXT NOT NULL,
  "companyName"   TEXT,
  "financialYear" TEXT,
  "meetingDate"   TEXT,
  "formDataJson"  TEXT NOT NULL,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS csi_documents_user ON csi_documents("userId");
CREATE INDEX IF NOT EXISTS csi_documents_company ON csi_documents("companyId");
`;
await client.connect();
await client.query(sql);
console.log('✅ Phase 2 tables created');
await client.end();
