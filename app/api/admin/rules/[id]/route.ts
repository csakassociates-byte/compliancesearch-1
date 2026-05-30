import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // Only allow updating safe fields
  const allowed = [
    "name", "shortName", "description", "howToComply",
    "frequency", "dueDate", "penalty", "registrationLink",
    "priority", "isActive", "tags", "conditionJson", "documentsJson",
  ];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  try {
    const updated = await prisma.complianceRule.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update rule:", error);
    return NextResponse.json({ error: "Failed to update rule" }, { status: 500 });
  }
}
