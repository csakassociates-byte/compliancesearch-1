import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/auth-helpers";
import { getTeamContext, logActivity } from "@/lib/team";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const companies = await prisma.$queryRawUnsafe<Array<{
    id: string; cin: string | null; companyName: string;
    regAddress: string | null; entityType: string | null;
    incorporationDate: string | null; createdAt: Date;
  }>>(
    `SELECT * FROM csi_companies WHERE id = $1 AND "userId" = $2`, id, userId
  );
  if (!companies.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const documents = await prisma.$queryRawUnsafe<Array<{
    id: string; type: string; title: string; financialYear: string | null;
    meetingDate: string | null; createdAt: Date;
  }>>(
    `SELECT id, type, title, "financialYear", "meetingDate", "createdAt"
     FROM csi_documents
     WHERE "companyId" = $1 AND "userId" = $2
     ORDER BY "meetingDate" DESC NULLS LAST, "createdAt" DESC`,
    id, userId
  );

  return NextResponse.json({ company: companies[0], documents });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const body = await req.json() as {
    companyName?: string; cin?: string; entityType?: string;
    regAddress?: string; incorporationDate?: string;
  };

  await prisma.$executeRawUnsafe(
    `UPDATE csi_companies SET
      "companyName" = COALESCE($3, "companyName"),
      cin = COALESCE($4, cin),
      "entityType" = COALESCE($5, "entityType"),
      "regAddress" = COALESCE($6, "regAddress"),
      "incorporationDate" = COALESCE($7, "incorporationDate"),
      "updatedAt" = NOW()
     WHERE id = $1 AND "userId" = $2`,
    id, userId,
    body.companyName?.trim() || null, body.cin?.trim() || null,
    body.entityType?.trim() || null, body.regAddress?.trim() || null,
    body.incorporationDate?.trim() || null
  );
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const userName = session.user.name || session.user.email || "Unknown";
  const userEmail = session.user.email || "";
  const { id } = await params;

  const { otp } = await req.json() as { otp: string };
  if (!otp) return NextResponse.json({ error: "OTP is required" }, { status: 400 });

  // Verify OTP against admin email
  const ctx = await getTeamContext(userId);
  const ownerRows = await prisma.$queryRawUnsafe<Array<{ email: string }>>(
    `SELECT email FROM csi_users WHERE id = $1`, ctx.ownerId
  );
  if (!ownerRows.length) return NextResponse.json({ error: "Admin not found" }, { status: 500 });
  const adminEmail = ownerRows[0].email;

  const valid = await verifyOtp(adminEmail, otp.trim(), "company_delete");
  if (!valid) return NextResponse.json({ error: "Invalid or expired OTP. Please try again." }, { status: 400 });

  // Get company info before deleting (for the log)
  const companies = await prisma.$queryRawUnsafe<Array<{ companyName: string; cin: string | null }>>(
    `SELECT "companyName", cin FROM csi_companies WHERE id = $1 AND "userId" = $2`, id, userId
  );
  if (!companies.length) return NextResponse.json({ error: "Company not found" }, { status: 404 });
  const { companyName, cin } = companies[0];

  const [docCountRows] = await prisma.$queryRawUnsafe<Array<{ count: string }>>(
    `SELECT COUNT(*)::text as count FROM csi_documents WHERE "companyId" = $1`, id
  ) as Array<{ count: string }>;
  const docCount = parseInt(docCountRows?.count || "0", 10);

  // Delete company (documents get SetNull per schema)
  await prisma.$executeRawUnsafe(
    `DELETE FROM csi_companies WHERE id = $1 AND "userId" = $2`, id, userId
  );

  // Log the deletion
  await logActivity({
    teamId: ctx.teamId,
    userId,
    userName,
    action: `Deleted company "${companyName}"${cin ? ` (CIN: ${cin})` : ""} — ${docCount} document(s) affected. Deleted by: ${userEmail}`,
    entityType: "company",
    entityId: id,
    entityName: companyName,
  });

  return NextResponse.json({ success: true });
}
