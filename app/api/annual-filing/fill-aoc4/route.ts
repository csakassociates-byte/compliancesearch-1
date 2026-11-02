import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { findFormSheet, loadFieldMap, applyCellValues } from "@/lib/annual-filing/aoc4kit";
import type { AnnualFilingData } from "@/lib/annual-filing/types";

export const maxDuration = 300;
export const runtime = "nodejs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Fields that must ALWAYS stay blank — never write anything (not even 0)
const ALWAYS_BLANK_PATTERNS = [
  /reasonForChange/i,
  /reason.*change/i,
  /Premium/,           // "Total premium" column always blank per MCA rule
  /premium/i,
];

// Fields that must be zeroed out when not provided (from aoc4kit ZERO_FIELDS)
const BS = "balanceSheet."; const LIA = BS + "equityAndLiabilities."; const AS_ = BS + "assets.";
const DB = "detailedBS."; const PL = "statementOfProfitAndLoss.";
const ZERO_FIELD_PREFIXES = [
  // Balance sheet — equity & liabilities breakdowns
  LIA + "shareHoldersFund.shareCapitalIn",
  LIA + "shareHoldersFund.reservsAndSurplusIn",
  LIA + "shareHoldersFund.moneyRecievedAgainestShareWarrantsIn",
  LIA + "shareApplicationMoneyIn",
  LIA + "nonCurrentLiabilities.longTermBorrowingsIn",
  LIA + "nonCurrentLiabilities.deferredTaxLiabilitiesIn",
  LIA + "nonCurrentLiabilities.otherLongTermLiabilitiesIn",
  LIA + "nonCurrentLiabilities.longTermProvisionsIn",
  LIA + "currentLiabilities.shortTermBorrowingsIn",
  LIA + "currentLiabilities.totaloutstandingduesMicroSmallEntCurrent",
  LIA + "currentLiabilities.totaloutduesOtherthanMicroSmallEntCurrent",
  LIA + "currentLiabilities.otherCurrentLiabilitiesIn",
  LIA + "currentLiabilities.shortTermProvisionsIn",
  // Balance sheet — assets breakdowns
  AS_ + "nonCurrentAssets.propertyAndEquipmentsIn",
  AS_ + "nonCurrentAssets.intangibleAssetsIn",
  AS_ + "nonCurrentAssets.capitalWorkInProgressIn",
  AS_ + "nonCurrentAssets.intangibleAssetsUnderDevelopmentIn",
  AS_ + "nonCurrentAssets.nonCurrentInvestmentsIn",
  AS_ + "nonCurrentAssets.deferredTaxAssetsIn",
  AS_ + "nonCurrentAssets.longTermLoansIn",
  AS_ + "nonCurrentAssets.otherNonCurrentAssetsIn",
  AS_ + "currentAssets.currentInvestmentIn",
  AS_ + "currentAssets.inventoriesIn",
  AS_ + "currentAssets.tradeReceivablesIn",
  AS_ + "currentAssets.cashAndCashEquivalentsIn",
  AS_ + "currentAssets.shortTermLoansAndAdvancesIn",
  AS_ + "currentAssets.otherCurrentAssetsIn",
  // Balance sheet totals (G and J columns)
  LIA + "totalIn",
  AS_ + "totalIn",
  // Detailed BS sections
  DB + "detailOfLongTermBorrowings.",
  DB + "detailOfShortTermBorrowings.",
  DB + "detailsOfLongTermLoansGood.",
  DB + "detailsOfLongTermLoansDoubtful.",
  DB + "detailsOfTradeReceivables.",
  // P&L — ALL sub-items and totals (Claude overrides with actual values)
  PL,
  // Share capital movement (increase/decrease rows — not beginning/end totals)
  "raisedShareCapital.equityShare.atTheBeginningOfTheYear",
  "raisedShareCapital.equityShare.increaseDuringTheYear",
  "raisedShareCapital.equityShare.decreaseDuringTheYear",
  "raisedShareCapital.equityShare.atTheEndOfTheYear",
  "raisedShareCapital.equityShare.increaseAmount.",
  "raisedShareCapital.equityShare.decreaseAmount.",
  "raisedShareCapital.preferenceShare.",  // all preference share rows = 0
  // SBN demonetization (2016) — most companies = 0
  "sBNDetails.",
  // Financial parameters percentages
  "financialParameters.paidupCapitalFgnCmpnyPercent",
  "financialParameters.paidupCapitalFgnHoldPercent",
];

function shouldAlwaysBlank(fieldName: string): boolean {
  return ALWAYS_BLANK_PATTERNS.some(p => p.test(fieldName));
}

function shouldPreZero(fieldName: string): boolean {
  if (shouldAlwaysBlank(fieldName)) return false;
  return ZERO_FIELD_PREFIXES.some(prefix => fieldName.startsWith(prefix));
}

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
  const financialPdf = formData.get("financialPdf") as File | null;
  const aoc4Excel    = formData.get("mcaZip") as File | null;
  const saveId       = formData.get("saveId") as string | null;

  if (!financialPdf || !aoc4Excel) {
    return NextResponse.json({ error: "Financial PDF and AOC-4 Excel are required" }, { status: 400 });
  }

  // Load saved filing data
  let filingData: AnnualFilingData | null = null;
  if (saveId) {
    const rows = await prisma.$queryRawUnsafe<Array<{ formDataJson: string }>>(
      `SELECT "formDataJson" FROM csi_documents WHERE id = $1 LIMIT 1`, saveId
    );
    if (rows[0]) {
      try { filingData = JSON.parse(rows[0].formDataJson) as AnnualFilingData; } catch { /* ignore */ }
    }
  }
  if (!filingData) {
    return NextResponse.json({ error: "Filing data not found. Please save your filing first." }, { status: 404 });
  }

  const fin = filingData.financials || {};
  const companyName = filingData.companyName || "";
  const cin = filingData.cin || "";

  // guideText is only needed for EAUDITOR/EDIRECTOR paragraph fields — not used in AOC-4

  // ── Step 2: Extract financials from PDF ──────────────────────────────────────
  let financialSummary = "";
  try {
    const pdfBuf = await financialPdf.arrayBuffer();
    const base64Pdf = Buffer.from(pdfBuf).toString("base64");
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64Pdf } } as unknown as { type: "text"; text: string },
          {
            type: "text",
            text: `Extract ALL financial figures from this Indian company's audited financial statements for MCA AOC-4 filing.
Company: ${companyName}
All amounts in actual Indian Rupees (NOT lakhs/crores).
Return ONLY raw JSON:
{"share_capital":null,"reserves_surplus":null,"authorized_capital":null,"lt_borrowings":null,"dt_liabilities":null,"other_lt_liabilities":null,"lt_provisions":null,"st_borrowings":null,"trade_payables_msme":null,"trade_payables_other":null,"other_current_liabilities":null,"st_provisions":null,"total_equity_liabilities":null,"ppe_net":null,"ppe_gross":null,"intangible_assets":null,"cwip":null,"intangible_under_dev":null,"nc_investments":null,"dt_assets":null,"lt_loans_advances":null,"other_nc_assets":null,"current_investments":null,"inventories":null,"trade_receivables":null,"cash_equivalents":null,"st_loans_advances":null,"other_current_assets":null,"total_assets":null,"revenue_from_operations":null,"other_income":null,"total_revenue":null,"cost_materials":null,"purchases_stock":null,"changes_inventories":null,"employee_expenses":null,"managerial_remuneration":null,"auditor_fees":null,"finance_costs":null,"depreciation":null,"other_expenses":null,"exceptional_items":null,"profit_before_tax":null,"current_tax":null,"deferred_tax":null,"profit_after_tax":null,"net_worth":null,"total_shares":null,"nominal_value_per_share":null,"eps_basic":null,"eps_diluted":null,"rent_paid":null,"insurance":null,"power_fuel":null,"trade_rec_unsecured_over6m":null,"lt_borrowings_term_bank":null,"st_borrowings_bank":null,"rpt_gross_value":null,"prev_revenue_from_operations":null,"prev_profit_after_tax":null,"prev_total_assets":null,"prev_net_worth":null}`,
          },
        ],
      }],
    });
    const text = (msg.content.find(c => c.type === "text") as { text: string } | undefined)?.text ?? "";
    const parsed = extractJson(text) as Record<string, number | null>;
    const lines = Object.entries(parsed).filter(([, v]) => v !== null).map(([k, v]) => `  ${k}: ${v}`);
    financialSummary = lines.join("\n");
  } catch (e) {
    console.error("[fill-aoc4] PDF extraction failed:", e);
  }

  // ── Step 3: Build field→cellRef table from FORM sheet ────────────────────────
  const aoc4Buf = await aoc4Excel.arrayBuffer();
  let allFields: Record<string, string> = {};  // fieldName → cellRef
  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(aoc4Buf);
    const sheetPath = await findFormSheet(zip);
    const { fields } = await loadFieldMap(zip, sheetPath);
    allFields = fields;
  } catch (e) {
    return NextResponse.json({
      error: `Could not read AOC-4 Excel: ${e instanceof Error ? e.message : String(e)}`,
    }, { status: 400 });
  }

  // ── Step 3.5: Pre-zero all financial cells ───────────────────────────────────
  // First write 0 to every financial cell — same as Python kit's ZERO_GROUPS
  // This ensures no financial cell is left blank even if Claude misses it
  const preZeroCells: Record<string, string | number | null> = {};
  for (const [fieldName, cellRef] of Object.entries(allFields)) {
    if (shouldPreZero(fieldName)) {
      preZeroCells[cellRef] = 0;
    }
  }

  // ── Step 4: Build field table for Claude (exclude reason + premium fields) ────
  const boardMeetings = (filingData.boardMeetings || []).map(bm => {
    const d = new Date(bm.date);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  });
  const bmDate = boardMeetings[boardMeetings.length - 1] || "01/09/2026";
  const signDin = filingData.signatoryDirectors?.director1?.din || (filingData.directors || [])[0]?.din || "";
  const revenue = parseFloat(fin.revenueFromOperations || "0") || 0;

  const nicCode = cin.substring(1, 6);
  let productCode4 = "9983", productCode8 = "99831300";
  let productDesc = "Information technology (IT) consulting and support services";
  if (nicCode.startsWith("451") || nicCode.startsWith("452")) {
    productCode4 = "9954"; productCode8 = "99541100"; productDesc = "Construction services of buildings";
  } else if (nicCode.startsWith("681") || nicCode.startsWith("682")) {
    productCode4 = "9972"; productCode8 = "99721100"; productDesc = "Real estate services involving own or leased property";
  } else if (nicCode.startsWith("85") || nicCode.startsWith("80")) {
    productCode4 = "9992"; productCode8 = "99929900"; productDesc = "Educational services";
  } else if (nicCode.startsWith("86") || nicCode.startsWith("87") || nicCode.startsWith("88")) {
    productCode4 = "9993"; productCode8 = "99935900"; productDesc = "Health and social care services";
  }

  // Only send Claude the fields it should fill — exclude reason/premium
  const fieldTableForClaude = Object.entries(allFields)
    .filter(([fieldName]) =>
      !shouldAlwaysBlank(fieldName) &&
      !fieldName.startsWith("requestBody.formName") &&
      !fieldName.startsWith("requestBody.operation") &&
      !fieldName.includes("formIntegrationId") &&
      !fieldName.includes("formDataVersion") &&
      !fieldName.includes("status")
    )
    .map(([fieldName, cellRef]) => `${cellRef} | ${fieldName}`)
    .join("\n");

  let claudeCellValues: Record<string, string | number | null> = {};
  try {
    const prompt = `You are an expert Chartered Accountant filling an MCA V3 AOC-4 (Annual Financial Statement) form for an Indian private limited company.

═══ COMPANY DETAILS ═══
Company Name: ${companyName}
CIN: ${cin}
Financial Year: ${filingData.financialYear || "2025-2026"}
Authorised Capital: ₹${fin.authorisedCapital || "500000"}
Paid Up Capital: ₹${fin.paidUpCapital || "0"}
Company Type: ${filingData.companyType || "private"}
Signing Director DIN: ${signDin}
Board Meeting Date (DD/MM/YYYY): ${bmDate}
Number of Members: 0
Whether Small Company: Yes
Product/Service Code (4-digit): ${productCode4}
Product/Service Code (8-digit): ${productCode8}
Product Description: ${productDesc}
Turnover from Principal Product: ₹${revenue}

═══ FINANCIAL DATA (all amounts in actual ₹, NOT lakhs/crores) ═══
${financialSummary || "(No financial data extracted — use 0 for all financial fields)"}

═══ ADDITIONAL DATA FROM FILING FORM ═══
Paid Up Capital: ₹${fin.paidUpCapital || "0"}
Reserves & Surplus: ₹${fin.reservesAndSurplus || "0"}
Revenue from Operations: ₹${fin.revenueFromOperations || "0"}
Other Income: ₹${fin.otherIncome || "0"}
Profit Before Tax: ₹${fin.profitBeforeTax || "0"}
Current Tax: ₹${fin.currentTax || "0"}
Deferred Tax: ₹${fin.deferredTax || "0"}
Profit After Tax: ₹${fin.profitAfterTax || "0"}
Total Assets: ₹${fin.totalAssets || "0"}
Net Worth: ₹${fin.netWorth || "0"}
Previous Year Revenue: ₹${fin.prevRevenueFromOperations || "0"}
Previous Year PAT: ₹${fin.prevProfitAfterTax || "0"}


═══ FORM CELLS TO FILL (cellRef | fieldName) ═══
Return values keyed by the cell reference (left column).

${fieldTableForClaude}

═══ STRICT FILLING RULES ═══
1. Return ONLY a JSON object: {"G208": 500000, "B13": "01/09/2026", ...}
2. Keys = EXACT cell references shown above (e.g. "G208", "B15")
3. All monetary amounts = actual Indian Rupees (plain number, no ₹ symbol)
4. Fields ending "InCurrentDate" = current year value
5. Fields ending "InPreviousDate" = previous year value (0 if not available)
6. Fields ending "InCurrentYear" = current year; "InPreviousYear" = previous year
7. For "designation" fields → 1 (means Director)
8. For "identificationNumber", "pan", "decalartionId" fields → "${signDin}"
9. For date fields → "${bmDate}" (DD/MM/YYYY format)
10. For "numberOfMembers" → 0
11. For "authorisedCapital" → ${fin.authorisedCapital || "500000"}
12. For "totalNumberOfProduct" → 1
13. For "whetherSmallCompany" → "Yes"
14. For "productCode" (4-digit) → "${productCode4}"
15. For 8-digit product code → "${productCode8}"
16. For product description → "${productDesc}"
17. Total shares = Paid up capital ÷ 10 (nominal value per share = 10)
18. EPS = Profit After Tax ÷ Total shares (if PAT < 0, EPS is negative)
19. ⚠️ DO NOT fill any "reasonForChange" fields — they are NOT in the table above
20. ⚠️ DO NOT fill any "Premium" fields — they are NOT in the table above
21. ⚠️ For ALL financial numeric fields: if value is unknown → use 0 (never leave blank)
22. For break-up fields (ltb_*, stb_*, lla_*, tr_*): sum must equal main line item
23. P&L SECTION MAPPING (statementOfProfitAndLoss.*):
    - currentDomesticSaleOrSupplyOfServices = Revenue from Operations (domestic services)
    - currentTotalIncome = Total Income (Revenue from Operations + Other Income)
    - prevTotalIncome = Previous year Total Income
    - coNetGainLoss = 0 (not applicable), coNonOperatingIncome = 0
    - currenttotalExpenses = Total Expenses (sum of all expense line items)
    - previoustotalExpenses = Previous year Total Expenses
    - currentprofitBeforeExceptionalAndExtraordinaryItems = EBIT equivalent = currentTotalIncome - currenttotalExpenses
    - previousprofitBeforeExceptionalAndExtraordinaryItems = prev year same
    - currentprofitBeforeExtraordinaryItems = same as above (no exceptional items)
    - currentprofitBeforeTax = Profit Before Tax
    - previousprofitBeforeTax = Previous year PBT
    - currentPLforThePeriodFromContinuingOperations = Profit After Tax (PAT)
    - previousPLforThePeriodFromContinuingOperations = Previous year PAT
    - currentPLFromDiscontinuingOperationsAfterTax = 0 (no discontinuing operations)
    - currentProfitAndLossForThePeriod = PAT (same as continuing operations)
    - Fields ending "InCurrentYear" = current year figure; "InPreviousYear" = previous year figure

Fill EVERY cell in the table above. Return ONLY the JSON object, no explanation.`;

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });
    const text = (msg.content.find(c => c.type === "text") as { text: string } | undefined)?.text ?? "";
    claudeCellValues = extractJson(text) as Record<string, string | number | null>;
  } catch (e) {
    console.error("[fill-aoc4] Claude fill failed:", e);
    return NextResponse.json({ error: `AI fill failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }

  // ── Step 5: Safety filter — remove any reason/premium cells Claude returned ───
  // Build reverse map: cellRef → fieldName (to check what Claude wrote)
  const cellRefToFieldName: Record<string, string> = {};
  for (const [fieldName, cellRef] of Object.entries(allFields)) {
    cellRefToFieldName[cellRef] = fieldName;
  }
  const filteredClaudeCells: Record<string, string | number | null> = {};
  for (const [cellRef, value] of Object.entries(claudeCellValues)) {
    const fieldName = cellRefToFieldName[cellRef] ?? "";
    if (shouldAlwaysBlank(fieldName)) continue;  // skip reason/premium
    if (!/^[A-Z]{1,3}\d+$/.test(cellRef.trim())) continue;  // skip invalid refs
    filteredClaudeCells[cellRef] = value;
  }

  // ── Step 5.5: Hardcode cells that are outside BB/BE field map ─────────────────
  // Product/service table (rows 543-557 in Excel) — directly referenced cells
  const directCells: Record<string, string | number | null> = {
    // Product table — row 543 (first product entry)
    "B543": productCode4,         // ITC/NPCS 4-digit category code
    "C543": productDesc,          // Category description
    "E543": revenue,              // Turnover of product/service category (in ₹)
    "F543": productCode8,         // ITC/NPCS 8-digit contributing product code
    "H543": productDesc,          // Description of highest contributing product
    "I543": revenue,              // Turnover of highest contributing product
    // Declaration section
    "J609": "4",                  // Board resolution number
    "C610": bmDate,               // Date of board resolution (DD/MM/YYYY)
    "AA622": 1,                   // Designation dropdown: 1 = Director
    "J626": signDin,              // DIN of signing director
  };

  // ── Step 6: Apply in order: zeros first, then Claude's values, then direct ────
  let filledAoc: Uint8Array;
  try {
    // Pass 1: pre-zero all financial cells
    filledAoc = await applyCellValues(aoc4Buf, preZeroCells);
    // Pass 2: apply Claude's values (overrides zeros with actual values)
    // Use slice() to get a proper ArrayBuffer — filledAoc.buffer may be a shared buffer with offset
    const pass1Buf = filledAoc.buffer.slice(filledAoc.byteOffset, filledAoc.byteOffset + filledAoc.byteLength);
    filledAoc = await applyCellValues(pass1Buf as ArrayBuffer, filteredClaudeCells);
    // Pass 3: apply hardcoded direct cells (product table + declaration)
    const pass2Buf = filledAoc.buffer.slice(filledAoc.byteOffset, filledAoc.byteOffset + filledAoc.byteLength);
    filledAoc = await applyCellValues(pass2Buf as ArrayBuffer, directCells);
  } catch (e) {
    return NextResponse.json({ error: `Excel write failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }

  // ── Step 7: Return filled AOC-4 ──────────────────────────────────────────────
  const aocName = (aoc4Excel.name || "AOC-4.xlsx").replace(".xlsx", "_FILLED.xlsx");
  return NextResponse.json({
    fieldsFound: financialSummary.split("\n").length,
    fieldsFilled: Object.keys(filteredClaudeCells).length,
    preZeroed: Object.keys(preZeroCells).length,
    aoc: { name: aocName, data: Buffer.from(filledAoc).toString("base64") },
  });
}
