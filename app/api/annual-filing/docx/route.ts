import { NextRequest, NextResponse } from "next/server";
import {
  buildAuditReportDocx,
  buildBoardReportRule8aDocx,
  buildBoardReportRule8Docx,
  buildNotesOnAccountsDocx,
  buildDirectorListDocx,
  buildShareholderListDocx,
  buildMGT7CTCDocx,
  buildAOC2Docx,
  buildAOC1Docx,
} from "@/lib/annual-filing/docx-generators";
import type { AnnualFilingData } from "@/lib/annual-filing/types";
import type { AuditReportOptions } from "@/lib/annual-filing/generators/2025-26/audit-report";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      key: string;
      data: AnnualFilingData;
      auditOpts?: AuditReportOptions;
      companyName?: string;
      financialYear?: string;
      label?: string;
    };

    const { key, data, auditOpts, companyName, financialYear, label } = body;

    if (!key || !data) {
      return NextResponse.json({ error: "key and data are required" }, { status: 400 });
    }

    let buffer: Buffer;

    switch (key) {
      case "audit-report":
        if (!auditOpts) {
          return NextResponse.json({ error: "auditOpts required for audit-report" }, { status: 400 });
        }
        buffer = await buildAuditReportDocx(data, auditOpts);
        break;
      case "board-report-rule8a":
        buffer = await buildBoardReportRule8aDocx(data);
        break;
      case "board-report-rule8":
        buffer = await buildBoardReportRule8Docx(data);
        break;
      case "notes-on-accounts":
        buffer = await buildNotesOnAccountsDocx(data);
        break;
      case "director-list":
        buffer = await buildDirectorListDocx(data);
        break;
      case "shareholder-list":
        buffer = await buildShareholderListDocx(data);
        break;
      case "mgt7-ctc":
        buffer = await buildMGT7CTCDocx(data);
        break;
      case "aoc-2":
        buffer = await buildAOC2Docx(data);
        break;
      case "aoc-1":
        buffer = await buildAOC1Docx(data);
        break;
      default:
        return NextResponse.json({ error: `Unknown document key: ${key}` }, { status: 400 });
    }

    const filename = `${key}_${companyName || data.companyName || "Company"}_FY${financialYear || data.financialYear || ""}`
      .replace(/[^a-zA-Z0-9_\-. ]/g, "_");

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}.docx"`,
      },
    });
  } catch (err) {
    console.error("DOCX generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "DOCX generation failed" },
      { status: 500 }
    );
  }
}
