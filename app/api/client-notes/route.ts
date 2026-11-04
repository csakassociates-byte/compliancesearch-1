import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS csi_client_notes (
      id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      "userId"      TEXT NOT NULL,
      "companyId"   TEXT,
      cin           TEXT,
      "companyName" TEXT,
      type          TEXT NOT NULL DEFAULT 'note',
      content       TEXT NOT NULL,
      metadata      JSONB,
      "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS idx_csi_cn_companyid ON csi_client_notes("companyId")`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS idx_csi_cn_cin ON csi_client_notes(cin)`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS idx_csi_cn_userid ON csi_client_notes("userId")`
  );
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id: string }).id;

    const url = new URL(req.url);
    const companyId = url.searchParams.get("companyId");
    const cin = url.searchParams.get("cin");

    if (!companyId && !cin) {
      return NextResponse.json({ error: "companyId or cin required" }, { status: 400 });
    }

    await ensureTable();

    const notes = await prisma.$queryRawUnsafe<Array<{
      id: string;
      type: string;
      content: string;
      metadata: unknown;
      createdAt: string;
    }>>(
      `SELECT id, type, content, metadata, "createdAt"
       FROM csi_client_notes
       WHERE "userId" = $1
         AND ($2::text IS NULL OR "companyId" = $2)
         AND ($3::text IS NULL OR cin = $3)
       ORDER BY "createdAt" DESC
       LIMIT 200`,
      userId,
      companyId ?? null,
      cin ?? null
    );

    return NextResponse.json({ notes });
  } catch (err) {
    console.error("[client-notes GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id: string }).id;

    const body = await req.json() as {
      companyId?: string;
      cin?: string;
      companyName?: string;
      type: string;
      content: string;
      metadata?: Record<string, unknown>;
    };

    if (!body.content?.trim()) {
      return NextResponse.json({ error: "content required" }, { status: 400 });
    }

    await ensureTable();

    const rows = await prisma.$queryRawUnsafe<[{ id: string }]>(
      `INSERT INTO csi_client_notes
        (id, "userId", "companyId", cin, "companyName", type, content, metadata)
       VALUES (gen_random_uuid()::TEXT, $1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      userId,
      body.companyId ?? null,
      body.cin ?? null,
      body.companyName ?? null,
      body.type ?? "note",
      body.content.trim(),
      body.metadata ? JSON.stringify(body.metadata) : null
    );

    return NextResponse.json({ success: true, id: rows[0]?.id });
  } catch (err) {
    console.error("[client-notes POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
