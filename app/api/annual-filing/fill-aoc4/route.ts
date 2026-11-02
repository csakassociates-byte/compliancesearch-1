import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import JSZip from "jszip";
import { findFormSheet, loadFieldMap, applyFieldValues } from "@/lib/annual-filing/aoc4kit";
import type { AnnualFilingData } from "@/lib/annual-filing/types";

export const maxDuration = 300;
export const runtime = "nodejs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── JSON extractor ─────────────────────────────────────────────────────────────
function extractJson(text: string): Record<string, unknown> {
  const stripped = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "");
  const m = stripped.match(/\{[\s\S]*\}/);
  if (!m) return {};
  try { return JSON.parse(m[0]) as Record<string, unknown>; } catch { return {}; }
}

// ── Get field list for one Excel file ─────────────────────────────────────────
async function getFieldList(xlsBuf: ArrayBuffer): Promise<Record<string, string>> {
  const zip = await JSZip.loadAsync(xlsBuf);
  const sheetPath = await findFormSheet(zip);
  const { fields } = await loadFieldMap(zip, sheetPath);
  return fields; // fieldName → dataCell
}

// ── Step 1: Extract financials from PDF ───────────────────────────────────────
async function extractFinancials(pdfBuf: ArrayBuffer, companyName: string): Promise<Record<string, number | null>> {
  const base64Pdf = Buffer.from(pdfBuf).toString("base64");
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: [
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: base64Pdf },
        } as unknown as { type: "text"; text: string },
        {
          type: "text",
          text: `Extract ALL financial figures from this Indian company's audited financial statements for MCA AOC-4 filing.
Return amounts in Indian Rupees (actual rupees, NOT lakhs/crores unless explicitly stated that way).
Return ONLY raw JSON (no markdown) with these exact keys, null if not found:
{
  "sale_services":null,"sale_mfg":null,"sale_traded":null,"other_income":null,
  "materials":null,"purchases":null,"employee":null,"managerial_rem":null,
  "auditor_fee":null,"finance_cost":null,"depreciation":null,"other_exp":null,
  "exceptional":null,"current_tax":null,"deferred_tax":null,
  "share_capital":null,"reserves":null,"authorized_capital":null,
  "lt_borrowings":null,"st_borrowings":null,"lt_provisions":null,"st_provisions":null,
  "payables_other":null,"payables_msme":null,"other_cl":null,
  "ppe":null,"intangibles":null,"cwip":null,"nc_invest":null,"dta":null,
  "lt_loans_adv":null,"other_nca":null,"inventory":null,"trade_rec":null,
  "cash":null,"st_loans_adv":null,"other_ca":null,
  "eps_basic_before":null,"eps_diluted_before":null,"eps_basic_after":null,"eps_diluted_after":null,
  "net_worth":null,"gross_ppe":null,"fp_depreciation":null,
  "rpt_gross_value":null,"rpt_gross_value_pl":null,
  "eq_shares_begin":null,"eq_nominal_begin":null,"eq_paidup_begin":null,"total_shares":null,
  "nominal_value_per_share":null,
  "lla_related":null,"lla_due_directors":null,"ltb_related":null,"stb_related":null,
  "tr_unsecured":null,"tr_secured":null,"insurance":null,"power":null,"rent_paid":null,
  "ltb_term_bank":null,"ltb_term_other":null,"stb_bank":null,"stb_other_parties":null,
  "profit_before_tax":null,"profit_after_tax":null,"total_revenue":null,"total_expenses":null,
  "total_assets":null,"total_liabilities":null
}
Company: ${companyName}`,
        },
      ],
    }],
  });
  const text = (msg.content.find(c => c.type === "text") as { text: string } | undefined)?.text ?? "";
  return extractJson(text) as Record<string, number | null>;
}

// ── Step 3: Claude fills AOC-4 ────────────────────────────────────────────────
async function claudeFillAoc4(
  fields: Record<string, string>,
  aiFinancials: Record<string, number | null>,
  filingData: AnnualFilingData,
): Promise<Record<string, string | number>> {
  const fin = filingData.financials || {};
  const parseN = (v: string | undefined) => parseFloat(v || "0") || 0;

  // Compact field list for prompt (exclude Hidden fields to save tokens)
  const fieldList = Object.keys(fields)
    .filter(f => !f.startsWith("requestBody.formName") && !f.startsWith("requestBody.operation"))
    .slice(0, 120)
    .join("\n");

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `You are an expert MCA company secretary filling an AOC-4 Standalone financial statements form for an Indian private limited company.

COMPANY: ${filingData.companyName || ""}
CIN: ${filingData.cin || ""}
Financial Year: ${filingData.financialYear || "2025-2026"}
Authorized Capital: ₹${filingData.financials?.authorisedCapital || "500000"}
Company Type: ${filingData.companyType || "private"}

FINANCIAL DATA (from audited balance sheet, all amounts in ₹):
${JSON.stringify(aiFinancials, null, 2)}

FORM DATA (from saved filing):
- Paid up capital: ${fin.paidUpCapital || "0"}
- Reserves and surplus: ${fin.reservesAndSurplus || "0"}
- Revenue from operations: ${fin.revenueFromOperations || "0"}
- Other income: ${fin.otherIncome || "0"}
- Total expenses: ${fin.totalExpenses || "0"}
- Profit before tax: ${fin.profitBeforeTax || "0"}
- Current tax: ${fin.currentTax || "0"}
- Deferred tax: ${fin.deferredTax || "0"}
- Profit after tax: ${fin.profitAfterTax || "0"}
- Total assets: ${fin.totalAssets || "0"}
- Net worth: ${fin.netWorth || "0"}

SIGNING DIRECTOR DIN: ${filingData.signatoryDirectors?.director1?.din || (filingData.directors || [])[0]?.din || ""}
BOARD MEETING DATE: ${filingData.boardMeetings?.[filingData.boardMeetings.length - 1]?.date || "2026-09-01"}

FIELDS TO FILL (fieldName as used in the MCA form):
${fieldList}

MCA AOC-4 FILLING RULES:
- All monetary amounts in Indian Rupees (actual rupees, not lakhs/crores)
- For balance sheet fields: use the values from the audited financial statements
- Fields ending in "InCurrentDate" = current year value
- Fields ending in "InPreviousDate" = use 0 if not available
- For EPS: Basic EPS = PAT / Number of shares; use null if can't calculate
- For "designation" dropdown: use 1 (Director)
- For numeric zero fields: use "0" not null
- Prefer AI-extracted data over form data when both available
- Do NOT fill Hidden fields or pre-populated CIN/company name fields

Return ONLY valid JSON object with field names as keys and values.
Example: {"balanceSheet.equityAndLiabilities.shareHoldersFund.shareCapitalInCurrentDate": 500000, ...}
Return ALL fillable numeric/financial fields you can determine values for.`,
    }],
  });
  const text = (msg.content.find(c => c.type === "text") as { text: string } | undefined)?.text ?? "";
  return extractJson(text) as Record<string, string | number>;
}

// ── Step 4: Claude fills EAUDITOR ─────────────────────────────────────────────
async function claudeFillAuditor(
  fields: Record<string, string>,
  filingData: AnnualFilingData,
  aiFinancials: Record<string, number | null>,
): Promise<Record<string, string | number>> {
  const fin = filingData.financials || {};
  const pat = parseFloat(fin.profitAfterTax || "0") || 0;
  const revenue = parseFloat(fin.revenueFromOperations || "0") || aiFinancials.total_revenue || 0;
  const isSection8 = filingData.companyType === "section8";
  const fyEnd = "31st March, 2026";

  const fieldList = Object.keys(fields).slice(0, 40).join("\n");

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 8192,
    messages: [{
      role: "user",
      content: `You are an expert Indian Chartered Accountant writing an Audit Report for MCA EAUDITOR Standalone form.

COMPANY: ${filingData.companyName || ""}
CIN: ${filingData.cin || ""}
Financial Year Ended: ${fyEnd}
Net ${pat >= 0 ? "Profit" : "Loss"} after tax: ₹${Math.abs(pat).toLocaleString("en-IN")}
Revenue from operations: ₹${Number(revenue).toLocaleString("en-IN")}
Type: ${isSection8 ? "Section 8 Company" : "Private Limited Company"}
Small Company: Yes (turnover < ₹2 crore, paid-up capital < ₹2 crore)
Auditor DIN: ${filingData.signatoryDirectors?.director1?.din || (filingData.directors || [])[0]?.din || ""}

FIELDS TO FILL:
${fieldList}

EAUDITOR FILLING GUIDE:
- opinionOfTheAuditor1: Full unqualified/clean audit opinion paragraph per SA 700. Mention Balance Sheet, P&L, financial year ended ${fyEnd}. State "true and fair view".
- basisOfOpinion1: Standards on Auditing (SAs), ICAI Code of Ethics, independence. About 3-4 sentences.
- emphasisOfMatter1: "There are no matters to be emphasized... no Emphasis of Matter paragraph has been reported."
- keyAuditMatter1: Not applicable for unlisted companies - state accordingly.
- otherInformation1: Other information = Board's Report. State auditor is not responsible for it, nothing to report.
- mamagementResponsibility1: Section 134(5) responsibilities, maintaining books, prevention of fraud, going concern. Full paragraph.
- auditorResponsibility1: SA 700/705/706, reasonable assurance, material misstatement, fraud or error. 3-4 sentences.
- otherMattersAsPerRule11I: Rule 11(i) to (iv): no pending litigations, no long-term contracts, no IEPF transfer needed, management representation on fund routing.
- stateAnyMatter1: Rule 11(g) - audit trail. State that accounting software lacked audit trail feature per Proviso to Rule 3(1) of Companies (Accounts) Rules 2014.
- reportOnLegalAndRegulatory1: Section 143(3)(a) to (g): sought info, proper books kept, BS and P&L agree with books, Accounting Standards followed, directors not disqualified u/s 164(2), IFC exemption for small company, remuneration within limits u/s 197.
- reportingOnInternetFinancialControls1: IFC exemption - small company with turnover < ₹50 Cr and borrowings < ₹25 Cr from banks, exempted per notification dated June 13, 2017.
- declaration.designation: 1 (for "Statutory Auditor")
- declaration.decalartionId: Use the DIN provided above

Return ONLY valid JSON with field names as keys. Write full, professional, legally compliant text for each text field.
All text fields should use \\n for paragraph breaks within a field.`,
    }],
  });
  const text = (msg.content.find(c => c.type === "text") as { text: string } | undefined)?.text ?? "";
  return extractJson(text) as Record<string, string | number>;
}

// ── Step 5: Claude fills EDIRECTOR ───────────────────────────────────────────
async function claudeFillDirector(
  fields: Record<string, string>,
  filingData: AnnualFilingData,
  aiFinancials: Record<string, number | null>,
): Promise<Record<string, string | number>> {
  const fin = filingData.financials || {};
  const pat = parseFloat(fin.profitAfterTax || "0") || 0;
  const revenue = parseFloat(fin.revenueFromOperations || "0") || aiFinancials.total_revenue || 0;
  const prevRevenue = parseFloat(fin.prevRevenueFromOperations || "0") || 0;
  const prevPat = parseFloat(fin.prevProfitAfterTax || "0") || 0;
  const femaleEmp = filingData.employeesFemale ?? 0;
  const maleEmp = filingData.employeesMale ?? 0;

  const boardMeetings = (filingData.boardMeetings || []).map(bm => {
    const d = new Date(bm.date);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  });
  const bmCount = boardMeetings.length || 1;
  const totalDirs = (filingData.directors || []).filter(d => d.isActive).length || 2;

  const fieldList = Object.keys(fields).slice(0, 100).join("\n");

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 8192,
    messages: [{
      role: "user",
      content: `You are an expert Company Secretary writing a Board's Report / Director's Report for MCA EDIRECTOR Standalone form.

COMPANY: ${filingData.companyName || ""}
CIN: ${filingData.cin || ""}
Financial Year: ${filingData.financialYear || "2025-26"}
Small Company: Yes
Private Limited Company (not listed)
Net ${pat >= 0 ? "Profit" : "Loss"} after tax: ₹${Math.abs(pat).toLocaleString("en-IN")} (Previous year: ₹${Math.abs(prevPat).toLocaleString("en-IN")})
Revenue from operations: ₹${Number(revenue).toLocaleString("en-IN")} (Previous year: ₹${Number(prevRevenue).toLocaleString("en-IN")})
Total Employees: Male=${maleEmp}, Female=${femaleEmp}, Transgender=0
Board meetings held: ${bmCount} (dates: ${boardMeetings.join(", ") || "01/09/2026"})
Total active directors: ${totalDirs}
Signing director DIN: ${filingData.signatoryDirectors?.director1?.din || (filingData.directors || [])[0]?.din || ""}

STATE OF AFFAIRS (for descriptionOfStateOfCompanyAffairs - max 490 chars):
${filingData.stateOfAffairs || `During FY 2025-26, the Company earned revenue of ₹${Number(revenue).toLocaleString("en-IN")} and recorded net ${pat >= 0 ? "profit" : "loss"} of ₹${Math.abs(pat).toLocaleString("en-IN")} after tax. Operations continued normally.`}

FIELDS TO FILL:
${fieldList}

EDIRECTOR FILLING GUIDE:
- whetherSmallCompany: "Yes" (it IS a small company)
- noOfBoardMeetingHeld: ${bmCount}
- noOfCommitteeMeetingHeld: 0
- directorResponsibilityStatement: 5-point statement per Section 134(5) - accounting standards followed, policies applied consistently, proper care for maintenance of accounts, going concern basis, systems for compliance.
- fraudReportedByAuditors: "No cases regarding frauds have been filed during the year under the Act."
- disclosureOfStatementOnDecalaration: "The provision regarding appointment of Independent Director is not applicable to this Company."
- disclosureForCompaniesOnDirectorAppointmentAndReumeration: Sections 178(1) and 178(3) not applicable - state accordingly.
- whetherAnyLoanGuaranteeByCompany: "N" (No loans/guarantees under Sec 186)
- whetherAnyCompanyFallsInCategory: 2 (No - not a Sec 186(1) company)
- anyReportableTarnsactions: "N"
- briefDetails: "The Company has not given any loans, guarantees or investments under Section 186 during the financial year."
- descriptionOfStateOfCompanyAffairs: Use the state of affairs text above (max 490 chars)
- reserveDetails.briefDescription: "The Company has transferred Rs. NIL to its Reserves during the year under review."
- reserveDetails.amount: "0"
- dividendDetails.briefDescription: ${pat > 0 ? '"The Board of Directors has not recommended any dividend for FY 2025-26 in order to conserve resources."' : '"In view of the losses incurred, the Board has not recommended any dividend for FY 2025-26."'}
- dividendDetails.amount: "0"
- detailsOfMaterialChangesAndCommitment: "There have been no material changes and commitments affecting the financial position between year end and date of this Report."
- disclosureOfStementOnDevelopmentAndImplemetationOfRiskMgmt: Risk management policy framed, no material risk threatening existence.
- csrDetails.whetherCsrApplicableAsPerSec135: 2 (No - small company exempted)
- detRegardTechAbsorptionAsperRule83B: "The Company has not imported any technology during the period."
- detRegardEngyConserRule83A: "The Company has taken adequate measures to ensure optimum utilization of all equipment and resources so as to conserve energy."
- detForeignExngeEarnOutgoAsPerRul83C: "There were no foreign exchange earnings or outgo during the financial year under review."
- rule8Disclosure.disclosureOfCompanies: "The Company does not have any subsidiary, associate company or joint venture. Hence, no disclosures are required."
- stmtIndicatingAnnualEval: "The formal annual evaluation of Board performance is not mandatorily applicable to the Company as per Section 134(3)(p)."
- stmtUnderSexualHarassAct: Zero tolerance policy statement per POSH Act 2013.
- numOfSHComplaintsRcvd: "0"
- numOfSHComplaintsDispOff: "0"
- numOfSHComplaintsBeyond90Days: "0"
- stmtCompiledMaternityBenefit: "The Board confirms compliance with the Maternity Benefit Act, 1961."
- numOfFemaleEmployee: "${femaleEmp}"
- numOfMaleEmployee: "${maleEmp > 0 ? maleEmp : femaleEmp > 0 ? 0 : 2}"
- numOfTransEmployee: "0"
- rule8Disclosure.depositsAcceptedDuringYear: "0"
- rule8Disclosure.depositsRemainedUnpaidOrUnclaimedAtEndOfYear: "0"
- rule8Disclosure.amountOfDefaultInRepaymentOfDepositBeginingOfYear: "0"
- rule8Disclosure.maximumAmountOfDefaultInRepaymentOfDepositDuringYear: "0"
- rule8Disclosure.amountOfDefaultInRepaymentOfDepositEndOfYear: "0"
- rule8Disclosure.noOfCasesOfDefaultInRepaymentOfDepositBeginingOfYear: "0"
- rule8Disclosure.maximumNoOfCasesOfDefaultInRepaymentOfDepositDuringYear: "0"
- rule8Disclosure.noOfCasesOfDefaultInRepaymentOfDepositEndOfYear: "0"
- rule8Disclosure.detailsOfDepositNotInComplianceWithReqOfChapt5OfAct: Company has not accepted any deposits from public within meaning of Sec 73-76 and rules thereunder.
- rule8Disclosure.detailsOfSinificantAndMaterialOrderPassedByRegulator: "No significant or material orders passed by any Regulators or Courts or Tribunals."
- rule8Disclosure.disclsoreOfFinancialSummaryOrHighlight: Revenue ₹${Number(revenue).toLocaleString("en-IN")}, Net ${pat >= 0 ? "profit" : "loss"} ₹${Math.abs(pat).toLocaleString("en-IN")} (max 490 chars)
- rule8Disclosure.detailsOfDirectorsOrKeyManagerialAppointedOrresignedDuringYear: "During FY ended 31st March, 2026, there were no appointments or resignations of directors or KMP."
- rule8Disclosure.disclosureOfChangeInNatureOfBusiness: "During FY ended 31st March, 2026, there has been no change in the nature of business."
- stmtRegBoardOpinion: "Not applicable, as no independent director was appointed during the year."
- detInResOfAdequacy: "There is an adequate internal financial control system in place."
- disWhetherMaintananceCRReq: "Maintenance of cost records is not mandated under Companies (Cost Records and Audit) Rules, 2014."
- detProceedingPending: "No applications are filed or pending under the Insolvency and Bankruptcy Code, 2016 against the Company."
- detDiffBetweenValuationAmt: "There was no instance of one-time settlement with any Bank or Financial Institution."
- declaration.decalartionDate: use board meeting date ${boardMeetings[boardMeetings.length - 1] || "01/09/2026"} in DD/MM/YYYY
- declaration.designation3: 1 (Director)
- declaration.pan: ${filingData.signatoryDirectors?.director1?.din || (filingData.directors || [])[0]?.din || ""}

Return ONLY valid JSON. All text fields should be professional, legally compliant, and appropriate for a small Indian private company.`,
    }],
  });
  const text = (msg.content.find(c => c.type === "text") as { text: string } | undefined)?.text ?? "";
  return extractJson(text) as Record<string, string | number>;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const financialPdf = formData.get("financialPdf") as File | null;
  const mcaZip       = formData.get("mcaZip") as File | null;
  const saveId       = formData.get("saveId") as string | null;

  if (!financialPdf || !mcaZip) {
    return NextResponse.json({ error: "Both financialPdf and mcaZip are required" }, { status: 400 });
  }

  // Load saved filing data from DB
  let filingData: AnnualFilingData | null = null;
  if (saveId) {
    const rows = await prisma.$queryRawUnsafe<Array<{ formDataJson: string }>>(
      `SELECT "formDataJson" FROM csi_documents WHERE id = $1 LIMIT 1`,
      saveId
    );
    if (rows[0]) {
      try { filingData = JSON.parse(rows[0].formDataJson) as AnnualFilingData; } catch { /* ignore */ }
    }
  }
  if (!filingData) {
    return NextResponse.json({ error: "Filing data not found. Please save your filing first." }, { status: 404 });
  }

  // ── Step 1: Extract financials from PDF ──────────────────────────────────────
  let aiFinancials: Record<string, number | null> = {};
  try {
    const pdfBuf = await financialPdf.arrayBuffer();
    aiFinancials = await extractFinancials(pdfBuf, filingData.companyName || "");
  } catch (e) {
    console.error("[fill-aoc4] PDF extraction failed:", e);
  }

  // ── Step 2: Open MCA ZIP and get the 3 Excel buffers ────────────────────────
  const mcaZipBuf = await mcaZip.arrayBuffer();
  const outerZip = await JSZip.loadAsync(mcaZipBuf);
  const allFiles = Object.keys(outerZip.files);
  const aocFile = allFiles.find(f => /AOC-4[^/]*\.xlsx$/i.test(f));
  const audFile = allFiles.find(f => /EAUDITOR[^/]*\.xlsx$/i.test(f));
  const dirFile = allFiles.find(f => /EDIRECTOR[^/]*\.xlsx$/i.test(f));
  if (!aocFile || !audFile || !dirFile) {
    return NextResponse.json({ error: `Missing templates. Found: ${allFiles.join(", ")}` }, { status: 400 });
  }
  const [aocBuf, audBuf, dirBuf] = await Promise.all([
    outerZip.file(aocFile)!.async("arraybuffer"),
    outerZip.file(audFile)!.async("arraybuffer"),
    outerZip.file(dirFile)!.async("arraybuffer"),
  ]);

  // ── Step 3–5: Get field lists (needed for Claude prompts and value application) ─
  const [aocFields, audFields, dirFields] = await Promise.all([
    getFieldList(aocBuf),
    getFieldList(audBuf),
    getFieldList(dirBuf),
  ]);

  // ── Step 6: Claude fills AOC-4 ───────────────────────────────────────────────
  let aocValues: Record<string, string | number> = {};
  try {
    aocValues = await claudeFillAoc4(aocFields, aiFinancials, filingData);
  } catch (e) {
    console.error("[fill-aoc4] AOC-4 Claude fill failed:", e);
  }

  // ── Step 7: Claude fills EAUDITOR ────────────────────────────────────────────
  let audValues: Record<string, string | number> = {};
  try {
    audValues = await claudeFillAuditor(audFields, filingData, aiFinancials);
  } catch (e) {
    console.error("[fill-aoc4] EAUDITOR Claude fill failed:", e);
  }

  // ── Step 8: Claude fills EDIRECTOR ───────────────────────────────────────────
  let dirValues: Record<string, string | number> = {};
  try {
    dirValues = await claudeFillDirector(dirFields, filingData, aiFinancials);
  } catch (e) {
    console.error("[fill-aoc4] EDIRECTOR Claude fill failed:", e);
  }

  // ── Step 9: Apply values to each Excel ───────────────────────────────────────
  let filledAoc: Uint8Array, filledAud: Uint8Array, filledDir: Uint8Array;
  try {
    [filledAoc, filledAud, filledDir] = await Promise.all([
      applyFieldValues(aocBuf, aocValues),
      applyFieldValues(audBuf, audValues),
      applyFieldValues(dirBuf, dirValues),
    ]);
  } catch (e) {
    console.error("[fill-aoc4] Excel apply failed:", e);
    return NextResponse.json({ error: `Failed to apply values to Excel: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }

  // ── Step 10: Return 3 files as base64 ────────────────────────────────────────
  const toB64 = (u8: Uint8Array) => Buffer.from(u8).toString("base64");
  const aocName = aocFile.split("/").pop()!.replace(".xlsx", "_FILLED.xlsx");
  const audName = audFile.split("/").pop()!.replace(".xlsx", "_FILLED.xlsx");
  const dirName = dirFile.split("/").pop()!.replace(".xlsx", "_FILLED.xlsx");

  return NextResponse.json({
    fieldsFound: Object.values(aiFinancials).filter(v => v !== null).length,
    aocFieldsFilled: Object.keys(aocValues).length,
    audFieldsFilled: Object.keys(audValues).length,
    dirFieldsFilled: Object.keys(dirValues).length,
    aoc: { name: aocName, data: toB64(filledAoc) },
    aud: { name: audName, data: toB64(filledAud) },
    dir: { name: dirName, data: toB64(filledDir) },
  });
}
