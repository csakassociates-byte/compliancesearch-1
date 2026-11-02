import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { findFormSheet, applyCellValues } from "@/lib/annual-filing/aoc4kit";
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

async function extractGuideText(guideFile: File, anthropicClient: Anthropic): Promise<string> {
  try {
    const guideBuf = await guideFile.arrayBuffer();
    if (guideFile.name.endsWith(".html") || guideFile.name.endsWith(".htm")) {
      return Buffer.from(guideBuf).toString("utf-8")
        .replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").slice(0, 12000);
    }
    const base64Guide = Buffer.from(guideBuf).toString("base64");
    const guideMsg = await anthropicClient.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64Guide } } as unknown as { type: "text"; text: string },
          { type: "text", text: "Extract all filling instructions, field descriptions, and guidelines from this MCA V3 guide for EAUDITOR / Auditor's Report. Return as plain text with field names and what to write." },
        ],
      }],
    });
    return ((guideMsg.content.find(c => c.type === "text") as { text: string } | undefined)?.text ?? "").slice(0, 12000);
  } catch { return ""; }
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

  // Extract guide instructions if provided
  const guideText = guideFile ? await extractGuideText(guideFile, anthropic) : "";

  const companyName = filingData.companyName || "";
  const cin = filingData.cin || "";
  const fy = filingData.financialYear || "2025-2026";
  const [, fyEnd] = fy.split("-");
  const fin = filingData.financials || {};
  const auditor = filingData.auditor || {};
  const auditorName = auditor.name || "";
  const auditorFirm = auditor.firmName || auditor.name || "";
  const auditorReg  = auditor.registrationNo || auditor.regNo || "";
  const auditorMem  = auditor.membershipNo || auditor.membershipNumber || "";

  const boardMeetings = (filingData.boardMeetings || []);
  const lastBoardDate = boardMeetings.length > 0
    ? (() => { const d = new Date(boardMeetings[boardMeetings.length - 1].date);
        return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`; })()
    : "30/09/2026";

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
${guideText ? `\nMCA V3 FILLING GUIDE (EAUDITOR section — follow these instructions exactly):\n${guideText}\n` : ""}
Fill ALL the following cells with appropriate standard professional text for a small private limited company with an UNQUALIFIED audit opinion (no qualifications or emphasis of matter for a clean audit). Where the MCA guide above gives specific instructions for a field, follow those exactly.

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
2. B13 (Opinion): "In our opinion and to the best of our information and according to the explanations given to us, the aforesaid standalone financial statements give the information required by the Companies Act, 2013 in the manner so required and give a true and fair view in conformity with the accounting principles generally accepted in India, of the state of affairs of ${companyName} as at 31st March ${fyEnd}, and its profit/loss and cash flows for the year ended on that date."
3. B16 (Basis of Opinion): "We conducted our audit in accordance with the Standards on Auditing (SAs) specified under section 143(10) of the Companies Act, 2013. Our responsibilities under those Standards are further described in the Auditor's Responsibilities for the Audit of the Financial Statements section of our report. We are independent of the Company in accordance with the Code of Ethics issued by the Institute of Chartered Accountants of India together with the ethical requirements that are relevant to our audit of the financial statements under the provisions of the Companies Act, 2013 and the Rules thereunder, and we have fulfilled our other ethical responsibilities in accordance with these requirements and the Code of Ethics. We believe that the audit evidence we have obtained is sufficient and appropriate to provide a basis for our audit opinion."
4. B19 (Emphasis of Matter): "Not applicable" (clean audit — no emphasis needed)
5. H21 (Key Audit Matters): "Key audit matters are those matters that, in our professional judgment, were of most significance in our audit of the financial statements of the current period. There are no key audit matters to be communicated as the company is a Small company as defined under section 2(85) of the Companies Act, 2013."
6. H23 (Other Information): "The Company's management and Board of Directors are responsible for the other information. The other information comprises the information included in the Company's Annual Report but does not include the financial statements and our auditor's report thereon. Our opinion on the financial statements does not cover the other information and we do not express any form of assurance conclusion thereon."
7. J27 (noOfQualification): 0
8. B36 (Management Responsibility): "The Company's Board of Directors is responsible for the matters stated in section 134(5) of the Companies Act, 2013 ('the Act') with respect to the preparation of these standalone financial statements that give a true and fair view of the financial position, financial performance, and cash flows of the Company in accordance with the accounting principles generally accepted in India, including the Indian Accounting Standards (Ind AS) or the Accounting Standards (AS) specified under section 133 of the Act, read with rule 7 of the Companies (Accounts) Rules, 2014. This responsibility also includes maintenance of adequate accounting records in accordance with the provisions of the Act for safeguarding of the assets of the Company and for preventing and detecting frauds and other irregularities; selection and application of appropriate implementation and maintenance of accounting policies; making judgments and estimates that are reasonable and prudent; and design, implementation and maintenance of adequate internal financial controls, that were operating effectively for ensuring the accuracy and completeness of the accounting records, relevant to the preparation and presentation of the financial statements that give a true and fair view and are free from material misstatement, whether due to fraud or error."
9. B41 (Auditor Responsibility): "Our objectives are to obtain reasonable assurance about whether the financial statements as a whole are free from material misstatement, whether due to fraud or error, and to issue an auditor's report that includes our opinion. Reasonable assurance is a high level of assurance, but is not a guarantee that an audit conducted in accordance with SAs will always detect a material misstatement when it exists. Misstatements can arise from fraud or error and are considered material if, individually or in the aggregate, they could reasonably be expected to influence the economic decisions of users taken on the basis of these financial statements. As part of an audit in accordance with SAs, we exercise professional judgment and maintain professional skepticism throughout the audit."
10. B49 (State Any Matter): "Nothing to report"
11. B52 (Report on Legal & Regulatory): "As required by Section 143(3) of the Act, we report that: (a) We have sought and obtained all the information and explanations which to the best of our knowledge and belief were necessary for the purposes of our audit; (b) In our opinion, proper books of account as required by law have been kept by the Company so far as it appears from our examination of those books; (c) The Balance Sheet, the Statement of Profit and Loss including other comprehensive income, the Cash Flow Statement and Statement of Changes in Equity dealt with by this Report are in agreement with the books of account; (d) In our opinion, the aforesaid standalone financial statements comply with the Accounting Standards specified under Section 133 of the Act, read with Rule 7 of the Companies (Accounts) Rules, 2014; (e) On the basis of the written representations received from the directors as on 31st March ${fyEnd} taken on record by the Board of Directors, none of the directors is disqualified as on 31st March ${fyEnd} from being appointed as a director in terms of Section 164(2) of the Act; (f) With respect to the adequacy of the internal financial controls over financial reporting of the Company and the operating effectiveness of such controls, refer to our separate Report in 'Annexure B'; (g) With respect to the other matters to be included in the Auditor's Report in accordance with the requirements of section 197(16) of the Act, as amended: In our opinion and to the best of our information and according to the explanations given to us, the remuneration paid by the Company to its directors during the current year is in accordance with the provisions of section 197 of the Act."
12. B83 (Internal Financial Controls): "We have audited the internal financial controls over financial reporting of ${companyName} ('the Company') as of 31 March ${fyEnd} in conjunction with our audit of the standalone financial statements of the Company for the year ended on that date. In our opinion, the Company has, in all material respects, an adequate internal financial controls system over financial reporting and such internal financial controls over financial reporting were operating effectively as at 31 March ${fyEnd}."
13. B46 (Other Matters as per Rule 11): "i. The Company does not have any pending litigations which would impact its financial position. ii. The Company did not have any long-term contracts including derivative contracts for which there were any material foreseeable losses. iii. There were no amounts which were required to be transferred to the Investor Education and Protection Fund by the Company."
14. J94 (Auditor Name): "${auditorName}"
15. J99 (Declaration ID / Membership No): "${auditorMem || auditorReg}"

Return ONLY the JSON object with these 14 cells. Use full professional text for each paragraph.`;

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

  // Apply to Excel
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
