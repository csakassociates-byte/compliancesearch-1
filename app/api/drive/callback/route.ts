import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  exchangeCodeForTokens,
  getDriveEmail,
  getOrCreateDriveFolder,
} from "@/lib/google-drive";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code    = searchParams.get("code");
  const teamId  = searchParams.get("state");
  const error   = searchParams.get("error");

  const baseUrl = process.env.NEXTAUTH_URL ?? "";

  if (error || !code || !teamId) {
    return NextResponse.redirect(`${baseUrl}/tools/compliance-monitor?tab=documents&driveError=1`);
  }

  try {
    const tokens  = await exchangeCodeForTokens(code);
    const email   = await getDriveEmail(tokens.access_token);
    const expiry  = new Date(Date.now() + tokens.expires_in * 1000);

    // Create root folder in Drive
    const folderId = await getOrCreateDriveFolder(tokens.access_token, "CSI Documents");

    await prisma.$executeRawUnsafe(
      `UPDATE csi_teams
       SET "driveAccessToken"  = $1,
           "driveRefreshToken" = $2,
           "driveTokenExpiry"  = $3,
           "driveEmail"        = $4,
           "driveFolderId"     = $5,
           "updatedAt"         = NOW()
       WHERE id = $6`,
      tokens.access_token,
      tokens.refresh_token ?? null,
      expiry,
      email,
      folderId,
      teamId
    );

    return NextResponse.redirect(`${baseUrl}/tools/compliance-monitor?tab=documents&driveConnected=1`);
  } catch (e) {
    console.error("Drive callback error:", e);
    return NextResponse.redirect(`${baseUrl}/tools/compliance-monitor?tab=documents&driveError=1`);
  }
}
