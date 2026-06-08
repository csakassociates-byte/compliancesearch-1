import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_3RCEWjpHk7Fh@ep-empty-salad-aq0stiwo.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

const sql = `
CREATE TABLE IF NOT EXISTS csi_users (
  id              TEXT PRIMARY KEY,
  name            TEXT,
  email           TEXT UNIQUE NOT NULL,
  "emailVerified" TIMESTAMPTZ,
  "passwordHash"  TEXT,
  plan            TEXT NOT NULL DEFAULT 'free',
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS csi_sessions (
  id               TEXT PRIMARY KEY,
  "sessionToken"   TEXT UNIQUE NOT NULL,
  "userId"         TEXT NOT NULL REFERENCES csi_users(id) ON DELETE CASCADE,
  expires          TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS csi_otps (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  code        TEXT NOT NULL,
  purpose     TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "userId"    TEXT REFERENCES csi_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS csi_otps_email_purpose ON csi_otps(email, purpose);
`;

await client.connect();
await client.query(sql);
console.log('✅ Auth tables created successfully');
await client.end();
