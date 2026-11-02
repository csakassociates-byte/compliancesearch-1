import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { applyCellValues } from "@/lib/annual-filing/aoc4kit";
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
  const guideFile    = formData.get("guide") as File | null;
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

  const companyName = filingData.companyName || "";
  const cin = filingData.cin || "";
  const fy = filingData.financialYear || "2025-2026";
  const [, fyEnd] = fy.split("-");
  const fin = filingData.financials || {};
  const auditor = filingData.auditor || {};
  const auditorName = auditor.name || "";
  const auditorFirm = auditor.firmName || auditor.name || "";
  const auditorReg  = auditor.registrationNo || (auditor as Record<string,string>).regNo || "";
  const auditorMem  = auditor.membershipNo || (auditor as Record<string,string>).membershipNumber || "";

  const textPrompt = `You are an expert Chartered Accountant filling the MCA V3 EAUDITOR (Independent Auditor's Report) Excel form for an Indian private limited company.

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

${guideFile ? "The MCA V3 Filling Guide PDF is attached above. Read the EAUDITOR / Auditor's Report section carefully and follow its instructions for each field.\n" : ""}
Fill ALL the following cells with appropriate standard professional text for a small private limited company with an UNQUALIFIED audit opinion. Where the guide gives specific instructions, follow those exactly.

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

FILLING RULES:
1. Return ONLY a JSON object: {"B13": "text...", "B16": "text...", ...}
2. B13 (Opinion): Standard unqualified opinion — true and fair view of financial position of ${companyName} as at 31st March ${fyEnd}.
3. B16 (Basis of Opinion): Conducted audit per SAs under section 143(10); independence maintained per ICAI Code of Ethics; sufficient appropriate audit evidence obtained.
4. B19 (Emphasis of Matter): "Not Applicable" (clean audit — no emphasis needed)
5. H21 (Key Audit Matters): No key audit matters — company is a Small Company under section 2(85) of Companies Act 2013.
6. H23 (Other Information): Standard other information paragraph — management responsible for other info; auditor opinion doesn't cover it.
7. J27 (noOfQualification): 0
8. B36 (Management Responsibility): Standard section 134(5) directors' responsibility for true and fair financial statements.
9. B41 (Auditor Responsibility): Standard auditor responsibility — reasonable assurance, professional judgment, professional skepticism.
10. B49 (State Any Matter): "Nothing to report"
11. B52 (Report on Legal & Regulatory): Full section 143(3) report — (a) through (g) standard clauses; 31st March ${fyEnd} date; ${companyName}.
12. B83 (Internal Financial Controls): Adequate internal financial controls over financial reporting as at 31 March ${fyEnd} — operating effectively.
13. B46 (Other Matters as per Rule 11): Three points — (i) no pending litigations; (ii) no long-term contracts with foreseeable losses; (iii) no amounts to be transferred to IEPF.
14. J94 (Auditor Name): "${auditorName}"
15. J99 (Declaration ID / Membership No): "${auditorMem || auditorReg}"

Return ONLY the JSON object with these 14 cells. Use full professional paragraph text for each text field.`;

  // Build content array — attach guide PDF if provided
  type ContentBlock = { type: "text"; text: string } | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } };
  const content: ContentBlock[] = [];
  if (guideFile) {
    try {
      const guideBuf = await guideFile.arrayBuffer();
      const base64Guide = Buffer.from(guideBuf).toString("base64");
      content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64Guide } });
    } catch { /* skip guide if unreadable */ }
  }
  content.push({ type: "text", text: textPrompt });

  let cellValues: Record<string, string | number | null> = {};
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 8192,
      messages: [{ role: "user", content: content as Parameters<typeof anthropic.messages.create>[0]["messages"][0]["content"] }],
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
