const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS csi_persons (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "companyId" TEXT NOT NULL,
        name TEXT NOT NULL,
        "fatherName" TEXT,
        "dateOfBirth" TEXT,
        mobile TEXT,
        email TEXT,
        "presentAddress" TEXT,
        "permanentAddress" TEXT,
        "aadhaarNo" TEXT,
        "panNo" TEXT,
        "accountNo" TEXT,
        "ifscCode" TEXT,
        "bankName" TEXT,
        nationality TEXT DEFAULT 'Indian',
        occupation TEXT,
        "occupationCategory" TEXT,
        din TEXT,
        "dateOfJoining" TEXT,
        designation TEXT,
        "directorCategory" TEXT,
        "nomineeName" TEXT,
        "nomineeRelation" TEXT,
        "nomineeAddress" TEXT,
        "dematDpId" TEXT,
        "dematClientId" TEXT,
        "isDirector" BOOLEAN DEFAULT false,
        "isShareholder" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('csi_persons table created');

    await client.query(`
      CREATE TABLE IF NOT EXISTS csi_shareholders (
        id TEXT PRIMARY KEY,
        "personId" TEXT REFERENCES csi_persons(id) ON DELETE CASCADE,
        "userId" TEXT NOT NULL,
        "companyId" TEXT NOT NULL,
        "folioNumber" TEXT,
        "certificateNumber" TEXT,
        "distinctiveFrom" INTEGER,
        "distinctiveTo" INTEGER,
        "numberOfShares" INTEGER,
        "shareType" TEXT DEFAULT 'Equity',
        "dateOfAcquisition" TEXT,
        "dateOfTransfer" TEXT,
        "transferFrom" TEXT,
        "nomineeName" TEXT,
        "nomineeRelation" TEXT,
        "nomineeAddress" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('csi_shareholders table created');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
