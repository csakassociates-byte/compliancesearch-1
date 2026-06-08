import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// GET /api/documents — list user's documents
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const docs = await prisma.$queryRawUnsafe<Array<{
    id: string; type: string; title: string; companyName: string | null;
    financialYear: string | null; meetingDate: string | null; createdAt: Date;
  }>>(
    `SELECT id, type, title, "companyName", "financialYear", "meetingDate", "createdAt"
     FROM csi_documents WHERE "userId" = $1 ORDER BY "createdAt" DESC`,
    userId
  );

  return NextResponse.json({ documents: docs });
}

// POST /api/documents — save a document
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json() as {
    type: string; title: string; companyName?: string;
    financialYear?: string; meetingDate?: string; formDataJson: string;
  };

  if (!body.type || !body.title || !body.formDataJson)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const id = crypto.randomUUID();
  const now = new Date();

  await prisma.$executeRawUnsafe(
    `INSERT INTO csi_documents (id, "userId", type, title, "companyName", "financialYear", "meetingDate", "formDataJson", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    id, userId, body.type, body.title,
    body.companyName ?? null, body.financialYear ?? null,
    body.meetingDate ?? null, body.formDataJson, now
  );

  return NextResponse.json({ success: true, id });
}
