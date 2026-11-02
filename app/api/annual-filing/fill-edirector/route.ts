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
  const edirectorFile = formData.get("edirectorFile") as File | null;
  const saveId        = formData.get("saveId") as string | null;
  const guideJsonRaw  = formData.get("guideJson") as File | null;

  if (!edirectorFile) return NextResponse.json({ error: "EDIRECTOR Excel file is required" }, { status: 400 });

  // Try uploaded JSON first, then fall back to DB
  let filingData: AnnualFilingData | null = null;
  if (guideJsonRaw) {
    try { filingData = JSON.parse(await guideJsonRaw.text()) as AnnualFilingData; } catch { /* fall through */ }
  }
  if (!filingData && saveId) {
    const rows = await prisma.$queryRawUnsafe<Array<{ formDataJson: string }>>(
      `SELECT "formDataJson" FROM csi_documents WHERE id = $1 LIMIT 1`, saveId
    );
    if (rows[0]) try { filingData = JSON.parse(rows[0].formDataJson) as AnnualFilingData; } catch { /* ignore */ }
  }
  if (!filingData) return NextResponse.json({ error: "Filing data not found. Upload Guide JSON or save your filing first." }, { status: 404 });

  // Pass raw filing data as JSON context — strip base64 images (not needed, just bloat)
  const auditorClean = filingData.auditor ? { ...filingData.auditor, signatureBase64: undefined, sealBase64: undefined } : undefined;
  const guideText = JSON.stringify({
    companyName: filingData.companyName,
    cin: filingData.cin,
    financialYear: filingData.financialYear,
    companyType: filingData.companyType,
    auditor: auditorClean,
    financials: filingData.financials,
    directors: (filingData.directors || []).map(d => ({ ...d, signatureBase64: undefined })),
    boardMeetings: filingData.boardMeetings,
    committeeMeetings: filingData.committeeMeetings,
    stateOfAffairs: filingData.stateOfAffairs,
    dividendDeclared: filingData.dividendDeclared,
    dividendDetails: filingData.dividendDetails,
    csrApplicable: filingData.csrApplicable,
    foreignExchangeEarnings: filingData.foreignExchangeEarnings,
    foreignExchangeOutgo: filingData.foreignExchangeOutgo,
    hasLoansGiven: filingData.hasLoansGiven,
    hasDeposits: filingData.hasDeposits,
    hasSubsidiaries: filingData.hasSubsidiaries,
    signatoryDirectors: filingData.signatoryDirectors,
    employeesMale: filingData.employeesMale,
    employeesFemale: filingData.employeesFemale,
    employeesOther: filingData.employeesOther,
  }, null, 2);

  const companyName = filingData.companyName || "";
  const cin = filingData.cin || "";
  const fy = filingData.financialYear || "2025-2026";
  const [, fyEnd] = fy.split("-");
  const fin = filingData.financials || {};
  const directors = filingData.directors || [];
  const firstDir = directors[0] || {};
  const firstDirName = firstDir.name || "";
  const firstDirDin = firstDir.din || "";
  const firstDirPan = firstDir.pan || firstDirDin; // fallback to DIN
  const firstDirDesig = firstDir.designation || "Director";

  const boardMeetings = filingData.boardMeetings || [];
  const bmCount = boardMeetings.length || 4;
  const lastBM = boardMeetings[boardMeetings.length - 1];
  const bmDate = lastBM
    ? (() => { const d = new Date(lastBM.date);
        return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`; })()
    : "30/09/2026";

  // Board meeting dates for table (C21, C22, C23... up to 12)
  const bmDateCells: Record<string, string> = {};
  boardMeetings.slice(0, 12).forEach((bm, i) => {
    const d = new Date(bm.date);
    const formatted = `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
    bmDateCells[`C${21 + i}`] = formatted;
  });

  const isOpc = (filingData.companyType || "").toLowerCase().includes("opc") || (filingData.companyType || "").toLowerCase().includes("one person");
  const isSmallCompany = (filingData.companyType || "").toLowerCase().includes("small") || isOpc;

  const pat = parseFloat(fin.profitAfterTax || "0") || 0;
  const revenue = parseFloat(fin.revenueFromOperations || "0") || 0;
  const paidupCap = parseFloat(fin.paidUpCapital || "0") || 0;
  const reserves = parseFloat(fin.reservesAndSurplus || "0") || 0;
  const netWorth = parseFloat(fin.netWorth || String(paidupCap + reserves)) || 0;

  const dirList = directors.map(d => `- ${d.name || ""} (DIN: ${d.din || ""}, ${d.designation || "Director"})`).join("\n");

  const prompt = `You are an expert Company Secretary filling the MCA V3 EDIRECTOR (Director's Report / Board's Report) Excel form for an Indian private limited company.

COMPANY: ${companyName}
CIN: ${cin}
Financial Year: ${fy} (FY ending 31 March ${fyEnd})
Board of Directors:
${dirList}

Financial Highlights (FY ${fy}):
- Revenue from Operations: ₹${revenue.toLocaleString("en-IN")}
- Profit After Tax: ₹${pat.toLocaleString("en-IN")}
- Paid-up Capital: ₹${paidupCap.toLocaleString("en-IN")}
- Reserves & Surplus: ₹${reserves.toLocaleString("en-IN")}
- Net Worth: ₹${netWorth.toLocaleString("en-IN")}

FILING DATA (JSON — use this to write appropriate professional text for each field):
${guideText}

CELLS TO FILL:
M17  | noOfBoardMeetingHeld
M27  | noOfCommitteeMeetingHeld
B36  | directorResponsibilityStatement
B39  | fraudReportedByAuditors
B42  | disclosureOfStatementOnDecalaration
B45  | disclosureForCompaniesOnDirectorAppointmentAndReumeration
B74  | briefDetails
M77  | noOfTransactionForEnquiringDetails
B83  | descriptionOfStateOfCompanyAffairs
B87  | reserveDetails.briefDescription
M89  | reserveDetails.amount
B92  | dividendDetails.briefDescription
M94  | dividendDetails.amount
B98  | detailsOfMaterialChangesAndCommitment
B100 | disclosureOfStementOnDevelopmentAndImplemetationOfRiskMgmt
M107 | csrDetails.turnover
M109 | csrDetails.netWorth
B156 | detRegardTechAbsorptionAsperRule83B
B158 | detRegardEngyConserRule83A
B160 | detForeignExngeEarnOutgoAsPerRul83C
B163 | rule8Disclosure.reportOnHighlightOfPerformance
B168 | rule8Disclosure.disclosureOfCompanies
B171 | stmtRegBoardOpinion
B173 | detInResOfAdequacy
B176 | disWhetherMaintananceCRReq
B179 | detProceedingPending
B182 | detDiffBetweenValuationAmt
B184 | rule8Disclosure.disclsoreOfFinancialSummaryOrHighlight
B186 | rule8Disclosure.disclosureOfChangeInNatureOfBusiness
B188 | rule8Disclosure.detailsOfDirectorsOrKeyManagerialAppointedOrresignedDuringYear
M191 | rule8Disclosure.depositsAcceptedDuringYear
M193 | rule8Disclosure.depositsRemainedUnpaidOrUnclaimedAtEndOfYear
M195 | rule8Disclosure.amountOfDefaultInRepaymentOfDepositBeginingOfYear
M197 | rule8Disclosure.maximumAmountOfDefaultInRepaymentOfDepositDuringYear
M199 | rule8Disclosure.amountOfDefaultInRepaymentOfDepositEndOfYear
M201 | rule8Disclosure.noOfCasesOfDefaultInRepaymentOfDepositBeginingOfYear
M203 | rule8Disclosure.maximumNoOfCasesOfDefaultInRepaymentOfDepositDuringYear
M205 | rule8Disclosure.noOfCasesOfDefaultInRepaymentOfDepositEndOfYear
M207 | rule8Disclosure.detailsOfDepositNotInComplianceWithReqOfChapt5OfAct
B211 | rule8Disclosure.detailsOfSinificantAndMaterialOrderPassedByRegulator
B214 | stmtIndicatingAnnualEval
B219 | stmtUnderSexualHarassAct
M221 | numOfSHComplaintsRcvd
M223 | numOfSHComplaintsDispOff
M225 | numOfSHComplaintsBeyond90Days
B228 | stmtCompiledMaternityBenefit
M231 | numOfFemaleEmployee
M233 | numOfMaleEmployee
M235 | numOfTransEmployee
M237 | noOfMatterToBeIncludedInDirectorReport
B240 | headingForTheMatter
B242 | referenceToSectionRuleItPertains
B244 | briefDescriptionOfMatter
I249 | declaration.resolutionNo
C250 | declaration.decalartionDate
J266 | declaration.pan

FILLING INSTRUCTIONS (for a small private limited company with no CSR obligation — where MCA guide above gives specific instructions, follow those exactly):

Numeric fields:
- M17 = ${bmCount} (number of board meetings held)
- M27 = 0 (no committee meetings for small company)
- M77 = 0 (no interested transactions requiring details)
- M89 = 0 (no amount transferred to reserves)
- M94 = 0 (no dividend declared)
- M107 = ${revenue} (turnover for CSR check — not applicable as company is small)
- M109 = ${netWorth} (net worth for CSR check)
- M191 to M205 = 0 (no public deposits)
- M207 = 0 (no non-compliant deposits)
- M221 = 0, M223 = 0, M225 = 0 (sexual harassment complaints)
- M231 = 0, M233 = 0, M235 = 0 (employee counts — fill with 0 if unknown)
- M237 = count of additional matters beyond standard disclosures (e.g. details of loans given u/s 186, investments, guarantees, related party contracts u/s 188, etc.) — use 0 only if truly none exist; check filing data (hasLoansGiven, hasDeposits, hasSubsidiaries fields)
- I249 = "4" (board resolution number)
- C250 = "${bmDate}" (board meeting date DD/MM/YYYY)
- J266 = "${firstDirPan}" (signing director's PAN or DIN)

Text fields (use standard professional language):
- B36 (Directors' Responsibility Statement): Standard statement per Section 134(5) — directors confirm financial statements give true & fair view, proper accounting records maintained, applicable accounting standards followed, internal financial controls adequate, proper systems to ensure compliance with laws.
- B39 (Fraud by Auditors): "There are no frauds reported by Auditors of the Company."
- B42 (Declaration by Independent Directors): "Not applicable as the Company does not have Independent Directors." (for a private company with no independent directors)
- B45 (Director Appointment/Remuneration): "During the year under review, there were no changes in the composition of the Board of Directors."
- B74 (Related Party Brief Details): "All related party transactions entered during the financial year were on arm's length basis and in the ordinary course of business."
- B83 (State of Company Affairs): "During the financial year ${fy}, the Company achieved revenue from operations of ₹${revenue.toLocaleString("en-IN")} and recorded a net ${pat >= 0 ? "profit" : "loss"} of ₹${Math.abs(pat).toLocaleString("en-IN")}. The overall performance of the company was satisfactory."
- B87 (Reserve Details): "No amount has been transferred to reserves during the year."
- B92 (Dividend Details): "The Board of Directors of the Company has not recommended any dividend for the financial year ${fy}."
- B98 (Material Changes): "No material changes and commitments affecting the financial position of the Company occurred after the end of the financial year and before the date of this report."
- B100 (Risk Management): "The Company has in place a mechanism to identify, assess, monitor and mitigate various risks to key business objectives. Major risks identified are systematically addressed through mitigating actions on a continuing basis."
- B156 (Technology Absorption): "Not Applicable. The Company has not imported any technology during the year."
- B158 (Energy Conservation): "The Company's activities are not energy intensive. However, the Company continues to take steps to reduce energy consumption."
- B160 (Foreign Exchange): "Foreign Exchange Earned: Nil. Foreign Exchange Outgo: Nil."
- B163 (Performance Highlights): "During the year ${fy}, the Company achieved revenue of ₹${revenue.toLocaleString("en-IN")} and net ${pat >= 0 ? "profit" : "loss"} of ₹${Math.abs(pat).toLocaleString("en-IN")}."
- B168 (Disclosure of Companies): "Not Applicable."
- B171 (Board Opinion on Integrity): "The Board is satisfied that the integrity, expertise and experience (including proficiency) of the Independent Directors is satisfactory." or "Not Applicable" if no independent directors.
- B173 (Adequacy): "The Board has ensured that all mandatory board committees have been constituted as required." or "Not Applicable" for small company.
- B176 (Cost Records): "The provisions of Section 148(1) of the Companies Act, 2013 for maintenance of cost records are not applicable to the Company."
- B179 (Pending Proceedings): "There are no significant and material orders passed by the Regulators or Courts or Tribunals impacting the going concern status and Company's operations in future."
- B182 (Valuation Difference): "Not Applicable."
- B184 (Financial Summary): "The financial highlights for FY ${fy}: Revenue ₹${revenue.toLocaleString("en-IN")}, PAT ₹${pat.toLocaleString("en-IN")}."
- B186 (Change in Business): "There was no change in the nature of business of the Company during the financial year ${fy}."
- B188 (Director Changes): "During the year under review, there were no changes in the composition of the Board of Directors."
- B211 (Regulatory Orders): "There are no significant and material orders passed by any Regulator, Court or Tribunal during the year."
- B214 (Annual Evaluation): "The Board of Directors has carried out an annual evaluation of its own performance, board committees and individual directors."
- B219 (Sexual Harassment): "The Company has complied with the provisions relating to the constitution of Internal Complaints Committee under the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013."
- B228 (Maternity Benefit): "The Company has complied with the provisions of the Maternity Benefit (Amendment) Act, 2017."
- B240, B242, B244 — if M237 > 0, fill with the heading, section reference, and brief description of the additional matter(s). If M237 = 0, set all three to "Nil".

Return ONLY a JSON object: {"M17": 4, "B36": "text...", ...}`;

  let cellValues: Record<string, string | number | null> = {};
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 8192,
      system: "You are a professional Company Secretary and Chartered Accountant assistant helping prepare the Board of Directors Report (Director's Report) for MCA V3 EDIRECTOR filing in India. All content is for legitimate statutory compliance under the Companies Act 2013. Generate professional, factual, legally compliant text as required.",
      messages: [{ role: "user", content: prompt }],
    });
    const text = (msg.content.find(c => c.type === "text") as { text: string } | undefined)?.text ?? "";
    cellValues = extractJson(text) as Record<string, string | number | null>;
  } catch (e) {
    return NextResponse.json({ error: `AI fill failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }

  // Auto-correct M237: count non-nil "other matters" entries filled by AI
  const otherMatterCells = ["B240", "B242", "B244"];
  const nonNilMatters = otherMatterCells.filter(c => {
    const v = String(cellValues[c] || "").trim().toLowerCase();
    return v && v !== "nil" && v !== "n/a" && v !== "not applicable";
  }).length;
  if (nonNilMatters > 0) cellValues["M237"] = nonNilMatters;

  // Hardcode mandatory fields that AI tends to miss
  // B14 — OPC / Small Company flag
  cellValues["B14"] = isOpc ? "Yes" : (isSmallCompany ? "Yes" : "No");

  // Board meeting dates table (C21, C22, ... up to C32)
  Object.assign(cellValues, bmDateCells);

  // Employee counts from filing data
  const empMale = filingData.employeesMale != null ? Number(filingData.employeesMale) : null;
  const empFemale = filingData.employeesFemale != null ? Number(filingData.employeesFemale) : null;
  const empOther = filingData.employeesOther != null ? Number(filingData.employeesOther) : null;
  if (empMale !== null) cellValues["M233"] = empMale;
  if (empFemale !== null) cellValues["M231"] = empFemale;
  if (empOther !== null) cellValues["M235"] = empOther;

  // OPC-specific overrides
  if (isOpc) {
    cellValues["B42"] = "Not applicable. The Company is a One Person Company (OPC) and does not have Independent Directors.";
    cellValues["B171"] = "Not applicable. The Company is a One Person Company (OPC) and does not require an evaluation of Independent Directors.";
    cellValues["B173"] = "Not applicable. The Company is a One Person Company (OPC) and is exempt from mandatory committee requirements.";
    cellValues["B214"] = "Not applicable. The Company is a One Person Company (OPC) with a single Director. The concept of annual evaluation of Board performance is not applicable.";
  }

  let filledBuf: Uint8Array;
  try {
    const xlsBuf = await edirectorFile.arrayBuffer();
    filledBuf = await applyCellValues(xlsBuf, cellValues);
  } catch (e) {
    return NextResponse.json({ error: `Excel write failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }

  const outName = edirectorFile.name.replace(".xlsx", "_FILLED.xlsx");
  return NextResponse.json({
    fieldsFilled: Object.keys(cellValues).length,
    edirector: { name: outName, data: Buffer.from(filledBuf).toString("base64") },
  });
}
