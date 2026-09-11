import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/auditors/lookup?membership=XXXXX
// Cross-user lookup — searches ALL saved CAs across all users by membership number.
// Requires login to prevent public scraping.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ ca: null }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const membership = searchParams.get("membership")?.trim() || "";

  if (membership.length < 3) return NextResponse.json({ ca: null });

  try {
    const rows: Array<Record<string, unknown>> = await prisma.$queryRawUnsafe(
      `SELECT "firmName", frn, "partnerName", "membershipNo", "auditorType",
              "auditorAddress", "auditorCity", "auditorEmail", "auditorMobile",
              "partnerDesignation", place
       FROM csi_auditors
       WHERE "membershipNo" = $1
       ORDER BY "updatedAt" DESC
       LIMIT 1`,
      membership
    );
    return NextResponse.json({ ca: rows[0] ?? null });
  } catch {
    return NextResponse.json({ ca: null });
  }
}
