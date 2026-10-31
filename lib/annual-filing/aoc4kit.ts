/**
 * AOC-4 MCA V3 Excel Filler — TypeScript port of aoc4kit.py
 * Edits the FORM sheet XML inside the MCA-portal ZIP directly.
 * Never opens the file with a spreadsheet library (preserves form controls).
 */

import JSZip from "jszip";

// ── XML cell writer ───────────────────────────────────────────────────────────

function colNum(col: string): number {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

function splitRef(ref: string): [string, number] {
  const m = ref.match(/^([A-Z]+)(\d+)$/);
  if (!m) throw new Error("Bad ref: " + ref);
  return [m[1], parseInt(m[2])];
}

/** Write a single cell value into sheetData XML string (returns updated XML). */
function setCellInXml(xml: string, ref: string, value: string | number | null): string {
  if (value === null || value === undefined) return xml;
  const [col, row] = splitRef(ref);
  const strVal = String(value);
  const isNum = typeof value === "number" || (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value.trim()) && value.trim() !== "");

  // Build the new cell XML
  let cellXml: string;
  if (isNum) {
    cellXml = `<c r="${ref}"><v>${strVal}</v></c>`;
  } else {
    const escaped = strVal
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    cellXml = `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escaped}</t></is></c>`;
  }

  // First check: self-closing empty cell like <c r="E42" s="5"/>  — replace directly
  const selfClose = new RegExp(`<c r="${ref}"[^>]*/>`);
  if (selfClose.test(xml)) {
    return xml.replace(selfClose, cellXml);
  }

  // Second check: normal cell with content — replace (but never overwrite formula cells)
  const cellRegex = new RegExp(`<c r="${ref}"[^>]*>[\\s\\S]*?<\\/c>`);
  const existing = xml.match(cellRegex);
  if (existing) {
    if (existing[0].includes("<f>")) return xml; // formula cell — skip
    return xml.replace(cellRegex, cellXml);
  }

  // Insert into the correct row, in column order
  const rowRegex = new RegExp(`(<row r="${row}"[^>]*>)([\\s\\S]*?)(<\\/row>)`);
  const rowMatch = xml.match(rowRegex);
  if (rowMatch) {
    const rowContent = rowMatch[2];
    // Find insertion point (sorted by column)
    const cellsInRow = [...rowContent.matchAll(/<c r="([A-Z]+)\d+"[^>]*>/g)];
    let insertBefore = "";
    for (const cm of cellsInRow) {
      if (colNum(cm[1]) > colNum(col)) { insertBefore = cm[0]; break; }
    }
    const newRowContent = insertBefore
      ? rowContent.replace(insertBefore, cellXml + insertBefore)
      : rowContent + cellXml;
    return xml.replace(rowRegex, rowMatch[1] + newRowContent + rowMatch[3]);
  }

  // Row doesn't exist — insert before next row with higher number
  const allRowsRegex = /<row r="(\d+)"[^>]*>/g;
  let insertBeforeRow = "";
  let lastMatch: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  while ((m = allRowsRegex.exec(xml)) !== null) {
    if (parseInt(m[1]) > row) { insertBeforeRow = m[0]; break; }
    lastMatch = m;
  }
  const newRow = `<row r="${row}">${cellXml}</row>`;
  if (insertBeforeRow) {
    return xml.replace(insertBeforeRow, newRow + insertBeforeRow);
  }
  // Append before </sheetData>
  return xml.replace("</sheetData>", newRow + "</sheetData>");
}

// ── Field resolver ────────────────────────────────────────────────────────────

interface FieldMap { [fieldName: string]: string }  // fieldName → cell ref (e.g. "E42")
interface SectionInfo { start: number; end: number; cols: Record<string, string> }

/** Build shared-strings lookup from sharedStrings.xml */
async function loadSharedStrings(zip: JSZip): Promise<string[]> {
  const ssFile = zip.file("xl/sharedStrings.xml");
  if (!ssFile) return [];
  const xml = await ssFile.async("string");
  const result: string[] = [];
  // Each <si> element is one shared string
  const siRegex = /<si>([\s\S]*?)<\/si>/g;
  let m: RegExpExecArray | null;
  while ((m = siRegex.exec(xml)) !== null) {
    // Collect all <t> text inside the <si>, handling rich text (<r><t>...</t></r>)
    const parts: string[] = [];
    const tRegex = /<t[^>]*>([\s\S]*?)<\/t>/g;
    let tm: RegExpExecArray | null;
    while ((tm = tRegex.exec(m[1])) !== null) {
      parts.push(tm[1]);
    }
    const val = parts.join("").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#xD;/g, "").replace(/&#10;/g, "\n");
    result.push(val);
  }
  return result;
}

/** Read the FORM sheet from an already-opened JSZip to extract field→cell mapping. */
export async function loadFieldMap(zip: JSZip, sheetPath: string): Promise<{ fields: FieldMap; sections: Record<string, SectionInfo> }> {
  const [sheetXml, sharedStrings] = await Promise.all([
    zip.file(sheetPath)!.async("string"),
    loadSharedStrings(zip),
  ]);

  // col → row → value (string)
  const cellValues: Record<string, Record<number, string>> = {};
  // col → row → formula string (for reference cells like =$BE$42)
  const cellFormulas: Record<string, Record<number, string>> = {};

  const unescape = (s: string) =>
    s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#xD;/g, "").replace(/&#10;/g, "\n");

  const rowRegex = /<row r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  let rm: RegExpExecArray | null;
  while ((rm = rowRegex.exec(sheetXml)) !== null) {
    const rowNum = parseInt(rm[1]);
    const rowContent = rm[2];
    const cellRegex = /<c r="([A-Z]+\d+)"([^>]*)>([\s\S]*?)<\/c>/g;
    let cm: RegExpExecArray | null;
    while ((cm = cellRegex.exec(rowContent)) !== null) {
      const cellRef = cm[1];
      const colMatch = cellRef.match(/^([A-Z]+)/);
      if (!colMatch) continue;
      const col = colMatch[1];
      const attrs = cm[2];
      const cellContent = cm[3];

      // Read formula
      const fMatch = cellContent.match(/<f[^>]*>([\s\S]*?)<\/f>/);
      if (fMatch) {
        if (!cellFormulas[col]) cellFormulas[col] = {};
        cellFormulas[col][rowNum] = unescape(fMatch[1]);
      }

      // Read value
      let val = "";
      const isSharedStr = /t="s"/.test(attrs);
      const isInlineStr = /t="inlineStr"/.test(attrs);
      const isStr = /t="str"/.test(attrs);

      if (isInlineStr) {
        const isMatch = cellContent.match(/<is>([\s\S]*?)<\/is>/);
        if (isMatch) {
          const tMatch = isMatch[1].match(/<t[^>]*>([\s\S]*?)<\/t>/);
          val = tMatch ? unescape(tMatch[1]) : "";
        }
      } else if (isSharedStr) {
        const vMatch = cellContent.match(/<v>([\s\S]*?)<\/v>/);
        if (vMatch) {
          const idx = parseInt(vMatch[1]);
          val = sharedStrings[idx] ?? "";
        }
      } else if (isStr) {
        const vMatch = cellContent.match(/<v>([\s\S]*?)<\/v>/);
        val = vMatch ? unescape(vMatch[1]) : (fMatch ? unescape(fMatch[1]) : "");
      } else {
        // number or date
        const vMatch = cellContent.match(/<v>([\s\S]*?)<\/v>/);
        val = vMatch ? vMatch[1] : "";
      }

      if (!cellValues[col]) cellValues[col] = {};
      cellValues[col][rowNum] = val;
    }
  }

  const getCell = (col: string, row: number): string => cellValues[col]?.[row] ?? "";
  const getFormula = (col: string, row: number): string => cellFormulas[col]?.[row] ?? cellValues[col]?.[row] ?? "";

  // Auto-detect layout: try BB first, then BA (for EAUDITOR which uses BA)
  let layout = { target: "BB", type: "BC", valueRef: "BE", linkedRef: "BJ" };
  // Check first 10 rows for a field name in BB or BA
  let foundInBB = false, foundInBA = false;
  for (let r = 2; r <= 15; r++) {
    const bb = getCell("BB", r); const ba = getCell("BA", r);
    if (bb && bb.includes(".")) { foundInBB = true; break; }
    if (ba && ba.includes(".")) { foundInBA = true; break; }
  }
  if (!foundInBB && foundInBA) {
    layout = { target: "BA", type: "BB", valueRef: "BD", linkedRef: "BI" };
  }

  const fields: FieldMap = {};
  const rowNums = Object.values(cellValues).flatMap(r => Object.keys(r).map(Number));
  const maxRow = rowNums.length > 0 ? Math.max(...rowNums) : 500;

  for (let r = 2; r <= Math.min(maxRow, 3000); r++) {
    let tg = getCell(layout.target, r);
    if (!tg) continue;
    tg = tg.replace("requestBody.formData.", "").trim();
    if (!tg || !tg.includes(".")) continue; // skip non-field rows

    const kind = getCell(layout.type, r).toLowerCase();
    // Get the formula from valueRef or linkedRef column — it's like =$BE$42
    const refCol = kind === "dropdown" ? layout.linkedRef : layout.valueRef;
    const formula = getFormula(refCol, r);
    // Extract cell address from formula like =$BE$42 or =BE42
    const refMatch = formula.match(/\$?([A-Z]+)\$?(\d+)/);
    if (refMatch && !fields[tg]) {
      fields[tg] = refMatch[1] + refMatch[2];
    }
  }

  // Sections (multi-row tables) — columns AI=name, AL=startRow, AN=endRow
  const sections: Record<string, SectionInfo> = {};
  for (let r = 2; r <= 30; r++) {
    const name = getCell("AI", r);
    if (!name) continue;
    const sr = getCell("AL", r).replace(/\D/g, "") || getFormula("AL", r).replace(/\D/g, "");
    const er = getCell("AN", r).replace(/\D/g, "") || getFormula("AN", r).replace(/\D/g, "");
    if (sr && er) {
      sections[name] = { start: parseInt(sr), end: parseInt(er), cols: {} };
    }
  }
  // Section column defs — columns AR=section name, AS=field name, AV=column letter
  for (let r = 2; r <= 100; r++) {
    const name = getCell("AR", r);
    const fn = getCell("AS", r);
    const colLetter = getCell("AV", r);
    if (name && fn && colLetter && sections[name]) {
      sections[name].cols[fn] = colLetter;
    }
  }

  return { fields, sections };
}

/** Find the FORM sheet path inside the workbook XML. */
export async function findFormSheet(zip: JSZip): Promise<string> {
  const wbXml = await zip.file("xl/workbook.xml")!.async("string");
  const relsXml = await zip.file("xl/_rels/workbook.xml.rels")!.async("string");
  const ridMatch = wbXml.match(/name="FORM"[^>]*r:id="(rId\d+)"/);
  if (!ridMatch) throw new Error("FORM sheet not found in workbook");
  const rid = ridMatch[1];
  const tgtMatch = relsXml.match(new RegExp(`Id="${rid}"[^>]*Target="([^"]+)"`));
  if (!tgtMatch) throw new Error("FORM sheet target not found");
  const tgt = tgtMatch[1].replace(/^xl\//, "");
  return "xl/" + tgt.replace(/^xl\//, "");
}

// ── ALIAS map (short keys → full field names) ─────────────────────────────────

const BS = "balanceSheet."; const LIA = BS + "equityAndLiabilities."; const AS_ = BS + "assets.";
const DB = "detailedBS."; const PL = "statementOfProfitAndLoss."; const FP = "financialParameters."; const FPM = "financialPM.";

export const ALIAS: Record<string, string> = {
  share_capital:   LIA + "shareHoldersFund.shareCapitalInCurrentDate",
  reserves:        LIA + "shareHoldersFund.reservsAndSurplusInCurrentDate",
  share_warrants:  LIA + "shareHoldersFund.moneyRecievedAgainestShareWarrantsInCurrentDate",
  share_app_money: LIA + "shareApplicationMoneyInCurrentDate",
  lt_borrowings:   LIA + "nonCurrentLiabilities.longTermBorrowingsInCurrentDate",
  dtl:             LIA + "nonCurrentLiabilities.deferredTaxLiabilitiesInCurrentDate",
  other_lt_liab:   LIA + "nonCurrentLiabilities.otherLongTermLiabilitiesInCurrentDate",
  lt_provisions:   LIA + "nonCurrentLiabilities.longTermProvisionsInCurrentDate",
  st_borrowings:   LIA + "currentLiabilities.shortTermBorrowingsInCurrentDate",
  payables_msme:   LIA + "currentLiabilities.totaloutstandingduesMicroSmallEntCurrentYear",
  payables_other:  LIA + "currentLiabilities.totaloutduesOtherthanMicroSmallEntCurrentYear",
  other_cl:        LIA + "currentLiabilities.otherCurrentLiabilitiesInCurrentDate",
  st_provisions:   LIA + "currentLiabilities.shortTermProvisionsInCurrentDate",
  ppe:             AS_ + "nonCurrentAssets.propertyAndEquipmentsInCurrentDate",
  intangibles:     AS_ + "nonCurrentAssets.intangibleAssetsInCurrentDate",
  cwip:            AS_ + "nonCurrentAssets.capitalWorkInProgressInCurrentDate",
  iaud:            AS_ + "nonCurrentAssets.intangibleAssetsUnderDevelopmentInCurrentDate",
  nc_invest:       AS_ + "nonCurrentAssets.nonCurrentInvestmentsInCurrentDate",
  dta:             AS_ + "nonCurrentAssets.deferredTaxAssetsInCurrentDate",
  lt_loans_adv:    AS_ + "nonCurrentAssets.longTermLoansInCurrentDate",
  other_nca:       AS_ + "nonCurrentAssets.otherNonCurrentAssetsInCurrentDate",
  curr_invest:     AS_ + "currentAssets.currentInvestmentInCurrentDate",
  inventory:       AS_ + "currentAssets.inventoriesInCurrentDate",
  trade_rec:       AS_ + "currentAssets.tradeReceivablesInCurrentDate",
  cash:            AS_ + "currentAssets.cashAndCashEquivalentsInCurrentDate",
  st_loans_adv:    AS_ + "currentAssets.shortTermLoansAndAdvancesInCurrentDate",
  other_ca:        AS_ + "currentAssets.otherCurrentAssetsInCurrentDate",
  // break-ups LTB
  ltb_bonds:       DB + "detailOfLongTermBorrowings.bondsDebenturesInCurrentDate",
  ltb_term_bank:   DB + "detailOfLongTermBorrowings.termLoansFromBankInCurrentDate",
  ltb_term_other:  DB + "detailOfLongTermBorrowings.termLoansFromOtherPartiesInCurrentDate",
  ltb_deferred:    DB + "detailOfLongTermBorrowings.deferredPaymentLiabilitiesInCurrentDate",
  ltb_deposits:    DB + "detailOfLongTermBorrowings.depositsInCurrentDate",
  ltb_related:     DB + "detailOfLongTermBorrowings.loansFromRelatedPartiesInCurrentDate",
  ltb_lease:       DB + "detailOfLongTermBorrowings.longTermMaturitiesOfFinanceLeaseObligationsInCurrentDate",
  ltb_other:       DB + "detailOfLongTermBorrowings.otherLoansInCurrentDate",
  // break-ups STB
  stb_bank:        DB + "detailOfShortTermBorrowings.loansRepayableFromBankInCurrentDate",
  stb_other_parties: DB + "detailOfShortTermBorrowings.loansRepayableFromOtherPartiesInCurrentDate",
  stb_related:     DB + "detailOfShortTermBorrowings.loansFromRelatedPartiesInCurrentDate",
  stb_deposits:    DB + "detailOfShortTermBorrowings.depositsInCurrentDate",
  stb_other:       DB + "detailOfShortTermBorrowings.otherLoansInCurrentDate",
  // LLA
  lla_capital_adv: DB + "detailsOfLongTermLoansGood.capitalAdvancesInCurrentDate",
  lla_related:     DB + "detailsOfLongTermLoansGood.loansToRelatedPartiesInCurrentDate",
  lla_other:       DB + "detailsOfLongTermLoansGood.otherLoansInCurrentDate",
  lla_due_directors: DB + "detailsOfLongTermLoansGood.loansDueByDirectorsInCurrentDate",
  // trade rec
  tr_secured:      DB + "detailsOfTradeReceivables.securedCurrentExceedingSixMonth",
  tr_unsecured:    DB + "detailsOfTradeReceivables.unsecuredCurrentExceedingSixMonth",
  tr_doubtful:     DB + "detailsOfTradeReceivables.doubtfulCurrentExceedingSixMonth",
  tr_provision:    DB + "detailsOfTradeReceivables.provisionForDoubtfulDebtsCurrentExceedingSixMonth",
  tr_directors:    DB + "detailsOfTradeReceivables.debtByDirectorsCurrentExceedingSixMonth",
  // financial parameters
  rpt_gross_value: FP + "grossValueOfTransactionAsPerAS18",
  net_worth:       FP + "netWorthOfCompany",
  gross_ppe:       FP + "grossPropertyPlantsAssets",
  fp_depreciation: FP + "depreciationAndAmortization",
  secured_loan:    FP + "securedLoan",
  misc_exp_not_wo: FP + "expenditureToTheExtentNotAdjuested",
  // share capital
  eq_shares_begin: "raisedShareCapital.equityShare.atTheBeginningOfTheYearNumberOfShares",
  eq_nominal_begin: "raisedShareCapital.equityShare.atTheBeginningOfTheYearTotalNominalAmount",
  eq_paidup_begin: "raisedShareCapital.equityShare.atTheBeginningOfTheYearTotalPaidupAmount",
  // P&L
  sale_mfg:        PL + "currentDomesticsaleOfGoodsManufactured",
  sale_traded:     PL + "currentDomesticsaleOfGoodsTraded",
  sale_services:   PL + "currentDomesticsaleOrSupplyOfServices",
  dividend_income: PL + "currentOtherDividendIncome",
  interest_income: PL + "currentotherIncome",
  gain_invest:     PL + "coNetGainLoss",
  other_income:    PL + "coNonOperatingIncome",
  materials:       PL + "currentcostOfMaterialConsumed",
  purchases:       PL + "currentpurchaseOfStockInTrade",
  chg_fg:          PL + "currentfinishedGoods",
  chg_wip:         PL + "currentworkInProgress",
  chg_stock:       PL + "currentstockInTrade",
  employee:        PL + "currentemployeeBenefitExpenses",
  managerial_rem:  PL + "currentmanagerialRemuneration",
  auditor_fee:     PL + "currentpaymentOfAuditors",
  insurance:       PL + "currentInsuranceExpenses",
  power:           PL + "currentpowerAndFuel",
  finance_cost:    PL + "currentfinanceCost",
  depreciation:    PL + "currentdeprecationExpenses",
  other_exp:       PL + "currentotherExpenses",
  exceptional:     PL + "currentexceptionalItems",
  extraordinary:   PL + "currentextraordinaryItems",
  current_tax:     PL + "currentPeroidcurrentTax",
  deferred_tax:    PL + "currentdeferredTax",
  eps_basic_before:    PL + "currentbasicEarningsPerEquityShareBeforeExtraordinaryItems",
  eps_diluted_before:  PL + "currentdilutedEarningsPerEquityShareBeforeExtraordinaryItems",
  eps_basic_after:     PL + "currentbasicEarningsPerEquityShareAfterExtraordinaryItems",
  eps_diluted_after:   PL + "currentdilutedEarningsPerEquityShareAfterExtraordinaryItems",
  rent_paid:       FPM + "rentPaid",
  rpt_gross_value_pl: FPM + "grossValueOfTransaction",
};

// Fields that must be zeroed out when not provided (from AOC_ZERO_GROUPS in defaults.py)
const ZERO_FIELDS = [
  LIA + "shareHoldersFund.shareCapitalInCurrentDate",
  LIA + "shareHoldersFund.reservsAndSurplusInCurrentDate",
  LIA + "shareHoldersFund.moneyRecievedAgainestShareWarrantsInCurrentDate",
  LIA + "shareApplicationMoneyInCurrentDate",
  LIA + "nonCurrentLiabilities.longTermBorrowingsInCurrentDate",
  LIA + "nonCurrentLiabilities.deferredTaxLiabilitiesInCurrentDate",
  LIA + "nonCurrentLiabilities.otherLongTermLiabilitiesInCurrentDate",
  LIA + "nonCurrentLiabilities.longTermProvisionsInCurrentDate",
  LIA + "currentLiabilities.shortTermBorrowingsInCurrentDate",
  LIA + "currentLiabilities.totaloutstandingduesMicroSmallEntCurrentYear",
  LIA + "currentLiabilities.totaloutduesOtherthanMicroSmallEntCurrentYear",
  LIA + "currentLiabilities.otherCurrentLiabilitiesInCurrentDate",
  LIA + "currentLiabilities.shortTermProvisionsInCurrentDate",
  AS_ + "nonCurrentAssets.propertyAndEquipmentsInCurrentDate",
  AS_ + "nonCurrentAssets.intangibleAssetsInCurrentDate",
  AS_ + "nonCurrentAssets.capitalWorkInProgressInCurrentDate",
  AS_ + "nonCurrentAssets.intangibleAssetsUnderDevelopmentInCurrentDate",
  AS_ + "nonCurrentAssets.nonCurrentInvestmentsInCurrentDate",
  AS_ + "nonCurrentAssets.deferredTaxAssetsInCurrentDate",
  AS_ + "nonCurrentAssets.longTermLoansInCurrentDate",
  AS_ + "nonCurrentAssets.otherNonCurrentAssetsInCurrentDate",
  AS_ + "currentAssets.currentInvestmentInCurrentDate",
  AS_ + "currentAssets.inventoriesInCurrentDate",
  AS_ + "currentAssets.tradeReceivablesInCurrentDate",
  AS_ + "currentAssets.cashAndCashEquivalentsInCurrentDate",
  AS_ + "currentAssets.shortTermLoansAndAdvancesInCurrentDate",
  AS_ + "currentAssets.otherCurrentAssetsInCurrentDate",
  DB + "detailOfLongTermBorrowings.bondsDebenturesInCurrentDate",
  DB + "detailOfLongTermBorrowings.termLoansFromBankInCurrentDate",
  DB + "detailOfLongTermBorrowings.termLoansFromOtherPartiesInCurrentDate",
  DB + "detailOfLongTermBorrowings.deferredPaymentLiabilitiesInCurrentDate",
  DB + "detailOfLongTermBorrowings.depositsInCurrentDate",
  DB + "detailOfLongTermBorrowings.loansFromRelatedPartiesInCurrentDate",
  DB + "detailOfLongTermBorrowings.longTermMaturitiesOfFinanceLeaseObligationsInCurrentDate",
  DB + "detailOfLongTermBorrowings.otherLoansInCurrentDate",
  DB + "detailOfShortTermBorrowings.loansRepayableFromBankInCurrentDate",
  DB + "detailOfShortTermBorrowings.loansRepayableFromOtherPartiesInCurrentDate",
  DB + "detailOfShortTermBorrowings.loansFromRelatedPartiesInCurrentDate",
  DB + "detailOfShortTermBorrowings.depositsInCurrentDate",
  DB + "detailOfShortTermBorrowings.otherLoansInCurrentDate",
  DB + "detailsOfLongTermLoansGood.capitalAdvancesInCurrentDate",
  DB + "detailsOfLongTermLoansGood.loansToRelatedPartiesInCurrentDate",
  DB + "detailsOfLongTermLoansGood.otherLoansInCurrentDate",
  DB + "detailsOfLongTermLoansGood.fromRelatedPartiesInCurrentDate",
  DB + "detailsOfLongTermLoansGood.fromOthersInCurrentDate",
  DB + "detailsOfLongTermLoansGood.loansDueByDirectorsInCurrentDate",
  DB + "detailsOfTradeReceivables.securedCurrentExceedingSixMonth",
  DB + "detailsOfTradeReceivables.unsecuredCurrentExceedingSixMonth",
  DB + "detailsOfTradeReceivables.doubtfulCurrentExceedingSixMonth",
  DB + "detailsOfTradeReceivables.provisionForDoubtfulDebtsCurrentExceedingSixMonth",
  DB + "detailsOfTradeReceivables.debtByDirectorsCurrentExceedingSixMonth",
  PL + "currentDomesticsaleOfGoodsManufactured",
  PL + "currentDomesticsaleOfGoodsTraded",
  PL + "currentDomesticsaleOrSupplyOfServices",
  PL + "currentExportsaleOfGoodsManufactured",
  PL + "currentExportsaleOfGoodsTraded",
  PL + "currentExportsaleOrSupplyOfServices",
  PL + "currentOtherDividendIncome",
  PL + "currentotherIncome",
  PL + "coNetGainLoss",
  PL + "coNonOperatingIncome",
  PL + "currentcostOfMaterialConsumed",
  PL + "currentpurchaseOfStockInTrade",
  PL + "currentfinishedGoods",
  PL + "currentworkInProgress",
  PL + "currentstockInTrade",
  PL + "currentemployeeBenefitExpenses",
  PL + "currentmanagerialRemuneration",
  PL + "currentpaymentOfAuditors",
  PL + "currentInsuranceExpenses",
  PL + "currentpowerAndFuel",
  PL + "currentfinanceCost",
  PL + "currentdeprecationExpenses",
  PL + "currentotherExpenses",
  PL + "currentexceptionalItems",
  PL + "currentextraordinaryItems",
  PL + "currentPeroidcurrentTax",
  PL + "currentdeferredTax",
  PL + "currentPLFromDiscontinuingOperations",
  PL + "currenttaxExpensesOfDiscontinuingOperations",
  PL + "currentbasicEarningsPerEquityShareBeforeExtraordinaryItems",
  PL + "currentdilutedEarningsPerEquityShareBeforeExtraordinaryItems",
  PL + "currentbasicEarningsPerEquityShareAfterExtraordinaryItems",
  PL + "currentdilutedEarningsPerEquityShareAfterExtraordinaryItems",
  "raisedShareCapital.equityShare.atTheBeginningOfTheYearNumberOfShares",
  "raisedShareCapital.equityShare.atTheBeginningOfTheYearTotalNominalAmount",
  "raisedShareCapital.equityShare.atTheBeginningOfTheYearTotalPaidupAmount",
];

// ── Main fill function ────────────────────────────────────────────────────────

export interface AocFillData {
  // Company / filing
  name: string;
  cin: string;
  sign_din: string;          // first signing director DIN
  bm_date: string;           // DD/MM/YYYY board meeting date
  resolution_no?: string | null;
  bs_total: number;
  pat: number;

  // All financial values — short keys from ALIAS map
  aoc: Record<string, string | number | null>;

  // Products (NIC codes)
  products: Array<{ code4: string; code8: string; desc: string; turnover: number }>;

  // Board meetings: [date DD/MM/YYYY, total directors, attended]
  board_meetings: Array<[string, number, number]>;

  // Employees
  female_employees: string;
  male_employees: string;
  trans_employees: string;

  // Auditor texts
  aud: {
    opinion: string; basis: string; eom: string; kam: string;
    other_info: string; mgmt: string; aud_resp: string;
    rule11: string; other_matters: string; legal: string; ifc: string;
  };

  // Director report texts — full field names
  dir: Record<string, string | number>;
}

export interface FillResult {
  aocXlsx: Uint8Array;
  audXlsx: Uint8Array;
  dirXlsx: Uint8Array;
  aocName: string;
  audName: string;
  dirName: string;
}

/** Fill all 3 Excel files in the MCA portal ZIP and return as Uint8Array buffers. */
export async function fillAoc4(
  mcaZipBuffer: ArrayBuffer,
  fillData: AocFillData,
): Promise<FillResult> {
  const zip = await JSZip.loadAsync(mcaZipBuffer);

  // Find the 3 template files
  const allFiles = Object.keys(zip.files);
  const aocFile = allFiles.find(f => /AOC-4[^/]*\.xlsx$/i.test(f));
  const audFile = allFiles.find(f => /EAUDITOR[^/]*\.xlsx$/i.test(f));
  const dirFile = allFiles.find(f => /EDIRECTOR[^/]*\.xlsx$/i.test(f));

  if (!aocFile || !audFile || !dirFile) {
    throw new Error(`Missing templates in ZIP. Found: ${allFiles.join(", ")}`);
  }

  const [aocBuf, audBuf, dirBuf] = await Promise.all([
    zip.file(aocFile)!.async("arraybuffer"),
    zip.file(audFile)!.async("arraybuffer"),
    zip.file(dirFile)!.async("arraybuffer"),
  ]);

  const [filledAoc, filledAud, filledDir] = await Promise.all([
    fillSingleFile(aocBuf, fillData, "AOC"),
    fillSingleFile(audBuf, fillData, "AUD"),
    fillSingleFile(dirBuf, fillData, "DIR"),
  ]);

  const aocName = aocFile.split("/").pop()!.replace(".xlsx", "_FILLED.xlsx");
  const audName = audFile.split("/").pop()!.replace(".xlsx", "_FILLED.xlsx").replace("EAUDITOR Standalone", "EAUDITOR_Standalone");
  const dirName = dirFile.split("/").pop()!.replace(".xlsx", "_FILLED.xlsx");

  return { aocXlsx: filledAoc, audXlsx: filledAud, dirXlsx: filledDir, aocName, audName, dirName };
}

async function fillSingleFile(
  buf: ArrayBuffer,
  data: AocFillData,
  form: "AOC" | "AUD" | "DIR",
): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(buf);
  const sheetPath = await findFormSheet(zip);
  const { fields, sections } = await loadFieldMap(zip, sheetPath);

  let cellValues: Record<string, string | number | null> = {};

  if (form === "AOC") cellValues = buildAoc(fields, sections, data);
  else if (form === "AUD") cellValues = buildAud(fields, data);
  else cellValues = buildDir(fields, sections, data);

  // Apply cell values to sheet XML
  let sheetXml = await zip.file(sheetPath)!.async("string");
  for (const [ref, val] of Object.entries(cellValues)) {
    if (val !== null && val !== undefined) {
      sheetXml = setCellInXml(sheetXml, ref, val);
    }
  }

  zip.file(sheetPath, sheetXml);
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}

// ── AOC-4 builder ─────────────────────────────────────────────────────────────

function buildAoc(fields: FieldMap, sections: Record<string, SectionInfo>, data: AocFillData): Record<string, string | number | null> {
  const cells: Record<string, string | number | null> = {};

  // Zero all managed fields first
  for (const fname of ZERO_FIELDS) {
    if (fields[fname]) cells[fields[fname]] = "0";
  }

  // Fill user values
  for (const [k, v] of Object.entries(data.aoc)) {
    if (k.endsWith("premium_begin") || ALIAS[k]?.endsWith("Premium")) continue; // always blank
    const fname = ALIAS[k] ?? k;
    if (fields[fname]) cells[fields[fname]] = v !== null ? String(v) : null;
  }

  // Products
  if (fields["principalProducts.totalNumberOfProduct"]) {
    cells[fields["principalProducts.totalNumberOfProduct"]] = String(data.products.length);
  }

  // Resolution + signatory
  if (data.resolution_no && fields["resolutionNumber"]) cells[fields["resolutionNumber"]] = data.resolution_no;
  if (fields["resolutionNumberDate"]) cells[fields["resolutionNumberDate"]] = data.bm_date;
  if (fields["designation"]) cells[fields["designation"]] = 1;
  if (fields["identificationNumber"]) cells[fields["identificationNumber"]] = data.sign_din;

  // Products section
  const sec = sections["DetailsRelatedToPrincipalProducts"];
  if (sec) {
    for (let i = 0; i < data.products.length; i++) {
      const r = sec.start + i;
      const p = data.products[i];
      const c = sec.cols;
      if (c["productCode"]) cells[`${c["productCode"]}${r}`] = p.code4;
      if (c["turnoverOfService"]) cells[`${c["turnoverOfService"]}${r}`] = String(p.turnover);
      if (c["highestTurnoverContributingProductCode"]) cells[`${c["highestTurnoverContributingProductCode"]}${r}`] = p.code8;
      if (c["highestTurnoverContributingProductDescription"]) cells[`${c["highestTurnoverContributingProductDescription"]}${r}`] = p.desc;
      if (c["turnoverOfHighestContributingProduct"]) cells[`${c["turnoverOfHighestContributingProduct"]}${r}`] = String(p.turnover);
    }
  }

  return cells;
}

// ── EAUDITOR builder ──────────────────────────────────────────────────────────

function buildAud(fields: FieldMap, data: AocFillData): Record<string, string | number | null> {
  const cells: Record<string, string | number | null> = {};
  const t = data.aud;
  const nameMap: Record<string, string> = {
    opinionOfTheAuditor1:          t.opinion,
    basisOfOpinion1:               t.basis,
    emphasisOfMatter1:             t.eom,
    keyAuditMatter1:               t.kam,
    otherInformation1:             t.other_info,
    mamagementResponsibility1:     t.mgmt,
    auditorResponsibility1:        t.aud_resp,
    otherMattersAsPerRule11I:      t.rule11,
    stateAnyMatter1:               t.other_matters,
    reportOnLegalAndRegulatory1:   t.legal,
    reportingOnInternetFinancialControls1: t.ifc,
  };
  for (const [fname, val] of Object.entries(nameMap)) {
    if (fields[fname]) cells[fields[fname]] = val;
  }
  if (fields["declaration.designation"]) cells[fields["declaration.designation"]] = 1;
  if (fields["declaration.decalartionId"]) cells[fields["declaration.decalartionId"]] = data.sign_din;
  return cells;
}

// ── EDIRECTOR builder ─────────────────────────────────────────────────────────

function buildDir(fields: FieldMap, sections: Record<string, SectionInfo>, data: AocFillData): Record<string, string | number | null> {
  const cells: Record<string, string | number | null> = {};

  // Director report texts
  for (const [k, v] of Object.entries(data.dir)) {
    const fname = ALIAS[k] ?? k;
    if (fields[fname]) cells[fields[fname]] = v !== null ? String(v) : null;
  }

  // Employees
  if (fields["numOfFemaleEmployee"]) cells[fields["numOfFemaleEmployee"]] = data.female_employees;
  if (fields["numOfMaleEmployee"])   cells[fields["numOfMaleEmployee"]]   = data.male_employees;
  if (fields["numOfTransEmployee"])  cells[fields["numOfTransEmployee"]]  = data.trans_employees;

  // Board meetings
  const sec = sections["BoardMeetingDetails"];
  if (sec) {
    for (let i = 0; i < data.board_meetings.length; i++) {
      const r = sec.start + i;
      const [date, total, attended] = data.board_meetings[i];
      const c = sec.cols;
      if (c["dateOfMeeting"])      cells[`${c["dateOfMeeting"]}${r}`]      = date;
      if (c["totalNoOfDirectors"]) cells[`${c["totalNoOfDirectors"]}${r}`] = String(total);
      if (c["noOfDirectorAttended"]) cells[`${c["noOfDirectorAttended"]}${r}`] = String(attended);
    }
  }

  if (fields["declaration.decalartionDate"]) cells[fields["declaration.decalartionDate"]] = data.bm_date;
  if (fields["declaration.designation3"])    cells[fields["declaration.designation3"]]    = 1;
  if (fields["declaration.pan"])             cells[fields["declaration.pan"]]             = data.sign_din;
  if (data.resolution_no && fields["declaration.resolutionNo"]) {
    cells[fields["declaration.resolutionNo"]] = data.resolution_no;
  }

  return cells;
}
