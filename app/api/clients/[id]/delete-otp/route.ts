import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOtp } from "@/lib/auth-helpers";
import { sendDeleteOtpEmail } from "@/lib/resend";
import { getTeamContext } from "@/lib/team";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const userName = session.user.name || session.user.email || "A team member";
  const userEmail = session.user.email || "";
  const { id } = await params;

  // Verify company belongs to this user's team
  const companies = await prisma.$queryRawUnsafe<Array<{ id: string; companyName: string }>>(
    `SELECT id, "companyName" FROM csi_companies WHERE id = $1 AND "userId" = ANY(
       SELECT "userId" FROM csi_team_members WHERE "teamId" = (
         SELECT "teamId" FROM csi_team_members WHERE "userId" = $2 LIMIT 1
       )
     )`,
    id, userId
  );
  if (!companies.length) return NextResponse.json({ error: "Company not found" }, { status: 404 });
  const companyName = companies[0].companyName;

  // Get team owner email (OTP goes to admin)
  const ctx = await getTeamContext(userId);
  const ownerRows = await prisma.$queryRawUnsafe<Array<{ email: string; name: string | null }>>(
    `SELECT email, name FROM csi_users WHERE id = $1`,
    ctx.ownerId
  );
  if (!ownerRows.length) return NextResponse.json({ error: "Admin not found" }, { status: 500 });
  const adminEmail = ownerRows[0].email;

  const otp = await createOtp(adminEmail, "company_delete");
  await sendDeleteOtpEmail({
    to: adminEmail,
    otp,
    companyName,
    deletedByName: userName,
    deletedByEmail: userEmail,
  });

  // Return masked email so UI can show "OTP sent to a***@example.com"
  const [local, domain] = adminEmail.split("@");
  const maskedEmail = local.slice(0, 2) + "***@" + domain;

  return NextResponse.json({ success: true, maskedEmail });
}
