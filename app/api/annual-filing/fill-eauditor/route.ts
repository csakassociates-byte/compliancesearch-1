import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { applyCellValues } from "@/lib/annual-filing/aoc4kit";
import { generateMcaV3GuideText } from "@/lib/annual-filing/mca-v3-guide";
import type { AnnualFilingData } from "@/lib/annual-filing/types";

export const maxDuration = 300;
export const runtime = "nodejs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function extractJson(text: string): Record<string, unknown> {
  const stripped = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "");
  const m = stripped.match(/\{[\s\S]*\}/);
  if (!m) return {};
  try { return JSON.parse(m[0]) as Record<string, unknown>; } catch { return {}; }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const eauditorFile = formData.get("eauditorFile") as File | null;
  const saveId       = formData.get("saveId") as string | null;

  if (!eauditorFile) return NextResponse.json({ error: "EAUDITOR Excel file is required" }, { status: 400 });

  let filingData: AnnualFilingData | null = null;
  if (saveId) {
    const rows = await prisma.$queryRawUnsafe<Array<{ formDataJson: string }>>(
      `SELECT "formDataJson" FROM csi_documents WHERE id = $1 LIMIT 1`, saveId
    );
    if (rows[0]) try { filingData = JSON.parse(rows[0].formDataJson) as AnnualFilingData; } catch { /* ignore */ }
  }
  if (!filingData) return NextResponse.json({ error: "Filing data not found. Please save your filing first." }, { status: 404 });

  // Generate guide text from saved filing data — no PDF upload needed
  const guideText = generateMcaV3GuideText(filingData);

  const companyName = filingData.companyName || "";
  const cin = filingData.cin || "";
  const fy = filingData.financialYear || "2025-2026";
  const [, fyEnd] = fy.split("-");
  const fin = filingData.financials || {};
  const auditor = filingData.auditor || {};
  const auditorName = auditor.partnerName || auditor.firmName || "";
  const auditorFirm = auditor.firmName || auditor.partnerName || "";
  const auditorReg  = auditor.frn || "";
  const auditorMem  = auditor.membershipNo || "";

  const prompt = `You are an expert Chartered Accountant filling the MCA V3 EAUDITOR (Independent Auditor's Report) Excel form for an Indian private limited company.

COMPANY: ${companyName}
CIN: ${cin}
Financial Year: ${fy} (FY ending 31 March ${fyEnd})
Auditor Name: ${auditorName}
Auditor Firm: ${auditorFirm}
Firm Registration No: ${auditorReg}
Auditor Membership No: ${auditorMem}
PAT (Profit After Tax): ₹${fin.profitAfterTax || "0"}
Net Worth: ₹${fin.netWorth || "0"}
Total Assets: ₹${fin.totalAssets || "0"}

MCA V3 FILLING GUIDE (EAUDITOR / Auditor's Report section — use these exact texts for each field):
${guideText}

Using the guide above, fill ALL cells below. Copy the exact text from the guide for each field.

CELLS TO FILL (cell reference | field name):
B13  | opinionOfTheAuditor1
B16  | basisOfOpinion1
B19  | emphasisOfMatter1
H21  | keyAuditMatter1
H23  | otherInformation1
J27  | noOfQualification
B36  | mamagementResponsibility1
B41  | auditorResponsibility1
B49  | stateAnyMatter1
B52  | reportOnLegalAndRegulatory1
B83  | reportingOnInternetFinancialControls1
B46  | otherMattersAsPerRule11I
J94  | declaration.name
J99  | declaration.decalartionId

Return ONLY a JSON object: {"B13": "text...", "B16": "text...", "J27": 0, ...}
Use the exact text from the MCA V3 guide above for each field.`;

  let cellValues: Record<string, string | number | null> = {};
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });
    const text = (msg.content.find(c => c.type === "text") as { text: string } | undefined)?.text ?? "";
    cellValues = extractJson(text) as Record<string, string | number | null>;
  } catch (e) {
    return NextResponse.json({ error: `AI fill failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }

  let filledBuf: Uint8Array;
  try {
    const xlsBuf = await eauditorFile.arrayBuffer();
    filledBuf = await applyCellValues(xlsBuf, cellValues);
  } catch (e) {
    return NextResponse.json({ error: `Excel write failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }

  const outName = eauditorFile.name.replace(".xlsx", "_FILLED.xlsx");
  return NextResponse.json({
    fieldsFilled: Object.keys(cellValues).length,
    eauditor: { name: outName, data: Buffer.from(filledBuf).toString("base64") },
  });
}
