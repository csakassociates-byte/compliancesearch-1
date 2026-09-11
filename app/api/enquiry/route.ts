import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEnquiryAdminNotification, sendEnquiryAutoReply } from "@/lib/resend";

async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS csi_enquiries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      mobile TEXT NOT NULL,
      company_name TEXT,
      query_type TEXT NOT NULL DEFAULT 'general',
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      source TEXT DEFAULT 'website',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, mobile, companyName, queryType, message, source } = body as {
      name: string; email: string; mobile: string;
      companyName?: string; queryType: string; message: string; source?: string;
    };

    if (!name?.trim() || !email?.trim() || !mobile?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Name, email, mobile and message are required." }, { status: 400 });
    }

    await ensureTable();

    const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `INSERT INTO csi_enquiries (name, email, mobile, company_name, query_type, message, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      name.trim(), email.trim().toLowerCase(), mobile.trim(),
      companyName?.trim() || null,
      queryType || "general",
      message.trim(),
      source || "website"
    );

    const id = rows[0]?.id || "unknown";

    // Send emails (don't block response on failure)
    Promise.all([
      sendEnquiryAdminNotification({ name, email, mobile, companyName, queryType: queryType || "general", message, source: source || "website", id }),
      sendEnquiryAutoReply({ name, email, queryType: queryType || "general" }),
    ]).catch(err => console.error("Enquiry email error:", err));

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (err) {
    console.error("Enquiry POST error:", err);
    return NextResponse.json({ error: "Failed to submit enquiry. Please try again." }, { status: 500 });
  }
}
