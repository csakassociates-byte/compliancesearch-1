import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncCompany } from "@/lib/syncCompany";
import { getTeamMemberIds } from "@/lib/team";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id: string }).id;

    const body = await req.json() as {
      id?: string;
      companyName: string;
      cin?: string;
      meetingDate?: string;
      title: string;
      formDataJson: string;
    };

    const companyId = await syncCompany(userId, body.companyName, body.cin);

    if (body.id) {
      await prisma.$executeRawUnsafe(
        `UPDATE csi_documents SET
          title = $3,
          "companyName" = $4,
          "meetingDate" = $5,
          "formDataJson" = $6,
          "companyId" = COALESCE("companyId", $7),
          "updatedAt" = NOW()
         WHERE id = $1 AND "userId" = $2`,
        body.id, userId,
        body.title, body.companyName,
        body.meetingDate || null,
        body.formDataJson, companyId
      );
      return NextResponse.json({ success: true, id: body.id });
    }

    const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `INSERT INTO csi_documents
        (id, "userId", "companyId", type, title, "companyName", "meetingDate", "formDataJson", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::TEXT, $1, $2, 'director_appointment', $3, $4, $5, $6, NOW(), NOW())
       RETURNING id`,
      userId, companyId,
      body.title, body.companyName,
      body.meetingDate || null,
      body.formDataJson
    );

    return NextResponse.json({ success: true, id: rows[0]?.id });
  } catch (err) {
    console.error("[director-appointment POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id: string }).id;

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    const memberIds = await getTeamMemberIds(userId);

    if (id) {
      const rows = await prisma.$queryRawUnsafe<Array<{
        id: string; formDataJson: string; updatedAt: Date;
      }>>(
        `SELECT id, "formDataJson", "updatedAt"
         FROM csi_documents
         WHERE id = $1 AND "userId" = ANY($2::text[]) AND type = 'director_appointment'`,
        id, memberIds
      );
      if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ doc: rows[0] });
    }

    const rows = await prisma.$queryRawUnsafe<Array<{
      id: string; title: string; companyName: string | null; meetingDate: string | null; updatedAt: Date;
    }>>(
      `SELECT id, title, "companyName", "meetingDate", "updatedAt"
       FROM csi_documents
       WHERE "userId" = ANY($1::text[]) AND type = 'director_appointment'
       ORDER BY "updatedAt" DESC LIMIT 50`,
      memberIds
    );
    return NextResponse.json({ docs: rows });
  } catch (err) {
    console.error("[director-appointment GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
