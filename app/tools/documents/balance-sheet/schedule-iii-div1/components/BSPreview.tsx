"use client";
import type { BalanceSheetData } from "@/lib/balance-sheet/types";
import { n, UNIT_LABEL, UNIT_DIVISOR } from "@/lib/balance-sheet/types";

interface Props {
  data: BalanceSheetData;
}

// ── Number formatter ──────────────────────────────────────────────────────────

function fmt(val: string | number | undefined, div: number): string {
  const v = typeof val === "number" ? val : parseFloat(val as string) || 0;
  if (v === 0) return "-";
  return (v / div).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtRaw(val: number, div: number): string {
  if (val === 0) return "-";
  return (val / div).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Compute totals ────────────────────────────────────────────────────────────

function computeTotals(d: BalanceSheetData) {
  // Share Capital
  const shareCapital = d.note1ShareCapital.classes.reduce((s, c) => s + n(c.paidUpAmount), 0);

  // Reserves
  const generalReserveClose = n(d.note2ReservesSurplus.generalReserveOpen) + n(d.note2ReservesSurplus.generalReserveAdditions);
  const surplusClose = n(d.note2ReservesSurplus.surplusOpeningBalance) + n(d.note2ReservesSurplus.surplusNetProfit) - n(d.note2ReservesSurplus.surplusDividend) - n(d.note2ReservesSurplus.surplusTransferToReserve);
  const reserves = n(d.note2ReservesSurplus.capitalReserve) + n(d.note2ReservesSurplus.securitiesPremium) + generalReserveClose + surplusClose;

  // LT Borrowings
  const ltBorrow = d.note3LTBorrowings.items.reduce((s, i) => s + n(i.amount), 0);
  const deferredTax = n(d.note4DeferredTax.deferredTaxLiability) - n(d.note4DeferredTax.deferredTaxAsset);
  const ltProvisions = n(d.note5LTProvisions.provisionForGratuity) + n(d.note5LTProvisions.provisionForLeaveEncashment) + n(d.note5LTProvisions.otherProvisions);
  const stBorrow = d.note6STBorrowings.items.reduce((s, i) => s + n(i.amount), 0);
  const tradePay = n(d.note7TradePayables.msmeAmount) + n(d.note7TradePayables.othersAmount);
  const otherCL = n(d.note8OtherCurrentLiabilities.currentMaturitiesLTBorrowings) + n(d.note8OtherCurrentLiabilities.interestAccrued) + n(d.note8OtherCurrentLiabilities.advancesFromCustomers) + n(d.note8OtherCurrentLiabilities.statutoryDues) + n(d.note8OtherCurrentLiabilities.otherPayables);
  const stProvisions = n(d.note9STProvisions.provisionForTax) + n(d.note9STProvisions.proposedDividend) + n(d.note9STProvisions.otherProvisions);

  // Assets — Fixed Assets
  const tangibleNBV = d.note10FixedAssets.tangibleAssets.reduce((s, r) => s + (n(r.gbClosingBalance) - n(r.depClosingBalance)), 0);
  const intangibleNBV = d.note10FixedAssets.intangibleAssets.reduce((s, r) => s + (n(r.gbClosingBalance) - n(r.depClosingBalance)), 0);
  const cwip = n(d.note10FixedAssets.cwip);
  const goodwill = n(d.note10FixedAssets.goodwill);
  const totalFixedAssets = tangibleNBV + intangibleNBV + cwip + goodwill;

  const ncInvestments = [...d.note11NonCurrentInvestments.quotedItems, ...d.note11NonCurrentInvestments.unquotedItems].reduce((s, i) => s + n(i.amount), 0);
  const ltLoans = n(d.note12LTLoansAdvances.capitalAdvances) + n(d.note12LTLoansAdvances.securityDeposits) + n(d.note12LTLoansAdvances.otherLoansAdvances);
  const otherNCA = n(d.note13OtherNonCurrentAssets.longTermTradeReceivables) + n(d.note13OtherNonCurrentAssets.otherNonCurrentAssets);

  const currentInv = n(d.note14CurrentInvestments.mutualFunds) + n(d.note14CurrentInvestments.fixedDepositsMaturing12m) + n(d.note14CurrentInvestments.otherCurrentInvestments);
  const inventories = n(d.note15Inventories.rawMaterials) + n(d.note15Inventories.workInProgress) + n(d.note15Inventories.finishedGoods) + n(d.note15Inventories.stockInTrade) + n(d.note15Inventories.storesSpares) + n(d.note15Inventories.looseTool);
  const tradeRec = n(d.note16TradeReceivables.outstandingMore6mSecured) + n(d.note16TradeReceivables.outstandingMore6mUnsecured) + n(d.note16TradeReceivables.outstandingMore6mDoubtful) + n(d.note16TradeReceivables.outstandingLess6mSecured) + n(d.note16TradeReceivables.outstandingLess6mUnsecured);
  const cash = n(d.note17CashEquivalents.cashOnHand) + n(d.note17CashEquivalents.balancesWithBanks) + n(d.note17CashEquivalents.fixedDepositsWithin3m) + n(d.note17CashEquivalents.chequesDraftsOnHand);
  const stLoans = n(d.note18STLoansAdvances.prepaidExpenses) + n(d.note18STLoansAdvances.advancesToSuppliers) + n(d.note18STLoansAdvances.balanceWithGovernment) + n(d.note18STLoansAdvances.otherAdvances);
  const otherCA = n(d.note19OtherCurrentAssets.interestAccruedOnDeposits) + n(d.note19OtherCurrentAssets.otherCurrentAssets);

  // P&L
  const revenue = n(d.note20Revenue.saleOfProducts) + n(d.note20Revenue.saleOfServices) + n(d.note20Revenue.otherOperatingRevenue) - n(d.note20Revenue.lessExciseDuty);
  const otherIncome = n(d.note21OtherIncome.interestIncome) + n(d.note21OtherIncome.dividendIncome) + n(d.note21OtherIncome.profitOnSaleOfAssets) + n(d.note21OtherIncome.miscIncome);
  const totalRevenue = revenue + otherIncome;

  const materialsConsumed = n(d.note22Materials.openingStock) + n(d.note22Materials.purchases) - n(d.note22Materials.closingStock);
  const purchases = n(d.note23PurchasesStockInTrade.purchases);
  const invChange = n(d.note24InventoryChanges.openingFinishedGoods) + n(d.note24InventoryChanges.openingWIP) + n(d.note24InventoryChanges.openingStockInTrade) - n(d.note24InventoryChanges.closingFinishedGoods) - n(d.note24InventoryChanges.closingWIP) - n(d.note24InventoryChanges.closingStockInTrade);
  const employee = n(d.note25EmployeeBenefits.salariesWages) + n(d.note25EmployeeBenefits.providentFund) + n(d.note25EmployeeBenefits.gratuity) + n(d.note25EmployeeBenefits.staffWelfare) + n(d.note25EmployeeBenefits.bonuses) + n(d.note25EmployeeBenefits.directorRemuneration);
  const finCosts = n(d.note26FinanceCosts.interestOnBorrowings) + n(d.note26FinanceCosts.bankCharges) + n(d.note26FinanceCosts.otherFinanceCosts);
  const depreciation = n(d.note27Depreciation.depreciation) + n(d.note27Depreciation.amortization);
  const otherExp = n(d.note28OtherExpenses.powerFuel) + n(d.note28OtherExpenses.rent) + n(d.note28OtherExpenses.repairsMaintenance) + n(d.note28OtherExpenses.advertisingMarketing) + n(d.note28OtherExpenses.travellingConveyance) + n(d.note28OtherExpenses.legalProfessional) + n(d.note28OtherExpenses.auditFees) + n(d.note28OtherExpenses.insurancePremium) + n(d.note28OtherExpenses.miscExpenses);
  const totalExpenses = materialsConsumed + purchases + invChange + employee + finCosts + depreciation + otherExp;

  const pbt = totalRevenue - totalExpenses;
  const tax = n(d.currentTax) + n(d.deferredTaxCharge);
  const pat = pbt - tax;

  // Balance Sheet totals
  const totalEquity = shareCapital + reserves;
  const totalLT = ltBorrow + deferredTax + ltProvisions;
  const totalCurrentLiab = stBorrow + tradePay + otherCL + stProvisions;
  const totalLiabilities = totalEquity + totalLT + totalCurrentLiab;

  const totalNCA = totalFixedAssets + ncInvestments + ltLoans + otherNCA;
  const totalCA = currentInv + inventories + tradeRec + cash + stLoans + otherCA;
  const totalAssets = totalNCA + totalCA;

  return {
    shareCapital, reserves, totalEquity,
    ltBorrow, deferredTax, ltProvisions, totalLT,
    stBorrow, tradePay, otherCL, stProvisions, totalCurrentLiab,
    totalLiabilities,
    tangibleNBV, intangibleNBV, cwip, goodwill, totalFixedAssets,
    ncInvestments, ltLoans, otherNCA, totalNCA,
    currentInv, inventories, tradeRec, cash, stLoans, otherCA, totalCA,
    totalAssets,
    revenue, otherIncome, totalRevenue,
    materialsConsumed, purchases, invChange, employee, finCosts, depreciation, otherExp, totalExpenses,
    pbt, tax, pat,
    generalReserveClose, surplusClose,
  };
}

// ── HTML generators ───────────────────────────────────────────────────────────

function generateHTML(d: BalanceSheetData, withLetterhead: boolean): string {
  const t = computeTotals(d);
  const div = UNIT_DIVISOR[d.displayUnit] ?? 1;
  const unitLabel = UNIT_LABEL[d.displayUnit] ?? "₹";
  const f = (v: number) => fmtRaw(v, div);
  const isBalanced = Math.abs(t.totalAssets - t.totalLiabilities) < 1;
  const fyLabel = d.financialYear ? `FY ${d.financialYear}` : "";

  // ── Letterhead HTML ──
  const letterhead = withLetterhead ? `
    <div class="letterhead">
      <div class="lh-name">${d.companyName || "Company Name"}</div>
      <div class="lh-details">
        ${d.cin ? `CIN: ${d.cin}` : ""}
        ${d.regAddress ? ` &nbsp;|&nbsp; ${d.regAddress}` : ""}
      </div>
      <div class="lh-contact">
        ${d.companyPhone ? `📞 ${d.companyPhone}` : ""}
        ${d.companyEmail ? ` &nbsp;|&nbsp; ✉ ${d.companyEmail}` : ""}
        ${d.gstin ? ` &nbsp;|&nbsp; GSTIN: ${d.gstin}` : ""}
      </div>
      <hr class="lh-rule"/>
    </div>` : "";

  // ── Balance Sheet Part I ──
  const bsHtml = `
    <div class="doc-title">BALANCE SHEET AS AT ${d.dateOfBalance ? new Date(d.dateOfBalance).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "31st March"}</div>
    <div class="sub-title">Schedule III — Division I (Non-Ind AS) &nbsp;|&nbsp; ${fyLabel} &nbsp;|&nbsp; ${unitLabel}</div>
    <table class="main-table">
      <thead>
        <tr>
          <th class="col-label">Particulars</th>
          <th class="col-note">Note</th>
          <th class="col-amt">As at ${d.fyEnd || "31/03/2025"}</th>
          ${!d.isFirstYear ? `<th class="col-amt">As at ${d.fyStart ? new Date(d.fyStart.replace(/(\d{2})\/(\d{2})\/(\d{4})/,"$3-$2-$1")).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"}) : "31/03/2024"}</th>` : ""}
        </tr>
      </thead>
      <tbody>
        <tr class="section-hdr"><td colspan="4">I. EQUITY AND LIABILITIES</td></tr>

        <tr class="group-hdr"><td colspan="4">Shareholders' Funds</td></tr>
        <tr><td class="indent1">Share Capital</td><td>1</td><td class="amt">${f(t.shareCapital)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr><td class="indent1">Reserves and Surplus</td><td>2</td><td class="amt">${f(t.reserves)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr class="subtotal"><td class="indent1 bold">Total Shareholders' Funds</td><td></td><td class="amt bold">${f(t.totalEquity)}</td>${!d.isFirstYear?`<td class="amt bold">-</td>`:""}</tr>

        <tr class="group-hdr"><td colspan="4">Non-Current Liabilities</td></tr>
        <tr><td class="indent1">Long-Term Borrowings</td><td>3</td><td class="amt">${f(t.ltBorrow)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr><td class="indent1">Deferred Tax Liabilities (Net)</td><td>4</td><td class="amt">${f(t.deferredTax > 0 ? t.deferredTax : 0)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr><td class="indent1">Long-Term Provisions</td><td>5</td><td class="amt">${f(t.ltProvisions)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr class="subtotal"><td class="indent1 bold">Total Non-Current Liabilities</td><td></td><td class="amt bold">${f(t.totalLT)}</td>${!d.isFirstYear?`<td class="amt bold">-</td>`:""}</tr>

        <tr class="group-hdr"><td colspan="4">Current Liabilities</td></tr>
        <tr><td class="indent1">Short-Term Borrowings</td><td>6</td><td class="amt">${f(t.stBorrow)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr><td class="indent1">Trade Payables</td><td>7</td><td class="amt">${f(t.tradePay)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr><td class="indent1">Other Current Liabilities</td><td>8</td><td class="amt">${f(t.otherCL)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr><td class="indent1">Short-Term Provisions</td><td>9</td><td class="amt">${f(t.stProvisions)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr class="subtotal"><td class="indent1 bold">Total Current Liabilities</td><td></td><td class="amt bold">${f(t.totalCurrentLiab)}</td>${!d.isFirstYear?`<td class="amt bold">-</td>`:""}</tr>

        <tr class="grand-total"><td class="bold">TOTAL EQUITY AND LIABILITIES</td><td></td><td class="amt bold">${f(t.totalLiabilities)}</td>${!d.isFirstYear?`<td class="amt bold">-</td>`:""}</tr>

        <tr class="section-hdr"><td colspan="4">II. ASSETS</td></tr>

        <tr class="group-hdr"><td colspan="4">Non-Current Assets</td></tr>
        <tr><td class="indent1">Fixed Assets</td><td>10</td><td class="amt">${f(t.totalFixedAssets)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr><td class="indent1">Non-Current Investments</td><td>11</td><td class="amt">${f(t.ncInvestments)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr><td class="indent1">Long-Term Loans and Advances</td><td>12</td><td class="amt">${f(t.ltLoans)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr><td class="indent1">Other Non-Current Assets</td><td>13</td><td class="amt">${f(t.otherNCA)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr class="subtotal"><td class="indent1 bold">Total Non-Current Assets</td><td></td><td class="amt bold">${f(t.totalNCA)}</td>${!d.isFirstYear?`<td class="amt bold">-</td>`:""}</tr>

        <tr class="group-hdr"><td colspan="4">Current Assets</td></tr>
        <tr><td class="indent1">Current Investments</td><td>14</td><td class="amt">${f(t.currentInv)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr><td class="indent1">Inventories</td><td>15</td><td class="amt">${f(t.inventories)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr><td class="indent1">Trade Receivables</td><td>16</td><td class="amt">${f(t.tradeRec)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr><td class="indent1">Cash and Cash Equivalents</td><td>17</td><td class="amt">${f(t.cash)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr><td class="indent1">Short-Term Loans and Advances</td><td>18</td><td class="amt">${f(t.stLoans)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr><td class="indent1">Other Current Assets</td><td>19</td><td class="amt">${f(t.otherCA)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr class="subtotal"><td class="indent1 bold">Total Current Assets</td><td></td><td class="amt bold">${f(t.totalCA)}</td>${!d.isFirstYear?`<td class="amt bold">-</td>`:""}</tr>

        <tr class="grand-total"><td class="bold">TOTAL ASSETS</td><td></td><td class="amt bold">${f(t.totalAssets)}</td>${!d.isFirstYear?`<td class="amt bold">-</td>`:""}</tr>
      </tbody>
    </table>
    <div class="balance-note ${isBalanced ? "balanced" : "unbalanced"}">
      ${isBalanced ? "✅ Balance Sheet Balanced" : `⚠️ Difference: ₹${Math.abs(t.totalAssets - t.totalLiabilities).toFixed(2)} — Please recheck entries`}
    </div>`;

  // ── P&L Part II ──
  const plHtml = `
    <div class="page-break"></div>
    <div class="doc-title">STATEMENT OF PROFIT AND LOSS FOR THE YEAR ENDED ${d.dateOfBalance ? new Date(d.dateOfBalance).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "31st March"}</div>
    <div class="sub-title">${fyLabel} &nbsp;|&nbsp; ${unitLabel}</div>
    <table class="main-table">
      <thead>
        <tr>
          <th class="col-label">Particulars</th>
          <th class="col-note">Note</th>
          <th class="col-amt">Current Year</th>
          ${!d.isFirstYear ? `<th class="col-amt">Previous Year</th>` : ""}
        </tr>
      </thead>
      <tbody>
        <tr class="section-hdr"><td colspan="4">I. REVENUE</td></tr>
        <tr><td class="indent1">Revenue from Operations</td><td>20</td><td class="amt">${f(t.revenue)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr><td class="indent1">Other Income</td><td>21</td><td class="amt">${f(t.otherIncome)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr class="grand-total"><td class="bold">Total Revenue (I)</td><td></td><td class="amt bold">${f(t.totalRevenue)}</td>${!d.isFirstYear?`<td class="amt bold">-</td>`:""}</tr>

        <tr class="section-hdr"><td colspan="4">II. EXPENSES</td></tr>
        <tr><td class="indent1">Cost of Materials Consumed</td><td>22</td><td class="amt">${f(t.materialsConsumed)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr><td class="indent1">Purchases of Stock-in-Trade</td><td>23</td><td class="amt">${f(t.purchases)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr><td class="indent1">Changes in Inventories of FG/WIP/SIT</td><td>24</td><td class="amt">${f(t.invChange)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr><td class="indent1">Employee Benefit Expense</td><td>25</td><td class="amt">${f(t.employee)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr><td class="indent1">Finance Costs</td><td>26</td><td class="amt">${f(t.finCosts)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr><td class="indent1">Depreciation and Amortisation</td><td>27</td><td class="amt">${f(t.depreciation)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr><td class="indent1">Other Expenses</td><td>28</td><td class="amt">${f(t.otherExp)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr class="grand-total"><td class="bold">Total Expenses (II)</td><td></td><td class="amt bold">${f(t.totalExpenses)}</td>${!d.isFirstYear?`<td class="amt bold">-</td>`:""}</tr>

        <tr class="section-hdr"><td colspan="4">III. PROFIT / (LOSS)</td></tr>
        <tr class="subtotal"><td class="bold indent1">Profit Before Tax (I − II)</td><td></td><td class="amt bold">${f(t.pbt)}</td>${!d.isFirstYear?`<td class="amt bold">-</td>`:""}</tr>
        <tr><td class="indent2">Current Tax</td><td></td><td class="amt">${fmt(d.currentTax, div)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr><td class="indent2">Deferred Tax</td><td></td><td class="amt">${fmt(d.deferredTaxCharge, div)}</td>${!d.isFirstYear?`<td class="amt">-</td>`:""}</tr>
        <tr class="grand-total"><td class="bold">Profit After Tax (PAT)</td><td></td><td class="amt bold">${f(t.pat)}</td>${!d.isFirstYear?`<td class="amt bold">-</td>`:""}</tr>
      </tbody>
    </table>`;

  // ── Signature block ──
  const sigBlock = `
    <div class="sig-block">
      <div class="sig-row">
        <div class="sig-col">
          <div class="sig-line"></div>
          <div class="sig-name">${d.directorName1 || "Director 1"}</div>
          <div class="sig-meta">DIN: ${d.directorDin1 || "__________"} &nbsp;|&nbsp; ${d.directorDesignation1 || "Director"}</div>
        </div>
        ${d.directorName2 ? `
        <div class="sig-col">
          <div class="sig-line"></div>
          <div class="sig-name">${d.directorName2}</div>
          <div class="sig-meta">DIN: ${d.directorDin2 || "__________"} &nbsp;|&nbsp; ${d.directorDesignation2 || "Director"}</div>
        </div>` : ""}
        <div class="sig-col">
          <div class="sig-line"></div>
          <div class="sig-name">${d.auditorPartnerName || "Partner Name"}</div>
          <div class="sig-meta">M. No.: ${d.auditorMembershipNo || "__________"}</div>
          <div class="sig-meta">For ${d.auditorFirmName || "M/s _____"} (FRN: ${d.auditorFRN || "_____"})</div>
        </div>
      </div>
      <div class="sig-place">Place: ${d.placeOfSigning || "__________"} &nbsp;&nbsp; Date: ${d.auditorReportDate ? new Date(d.auditorReportDate).toLocaleDateString("en-IN") : "__________"}</div>
    </div>`;

  // ── Cash Flow (Indirect Method) ──
  const operatingAdj = t.depreciation + t.finCosts - t.otherIncome;
  const workCapAdj = -(t.tradeRec) - (t.inventories) - (t.stLoans) + t.tradePay + t.otherCL;
  const cfOperating = t.pbt + operatingAdj + workCapAdj - (n(d.currentTax) / div);
  const cfInvesting = -(t.totalFixedAssets) - t.ncInvestments + t.otherIncome;
  const cfFinancing = (t.ltBorrow + t.stBorrow) - t.finCosts;
  const netCF = cfOperating + cfInvesting + cfFinancing;

  const cfHtml = `
    <div class="page-break"></div>
    <div class="doc-title">CASH FLOW STATEMENT FOR THE YEAR ENDED ${d.dateOfBalance ? new Date(d.dateOfBalance).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "31st March"}</div>
    <div class="sub-title">Indirect Method (AS-3) &nbsp;|&nbsp; ${unitLabel}</div>
    <table class="main-table">
      <thead>
        <tr><th class="col-label">Particulars</th><th class="col-amt">Amount</th></tr>
      </thead>
      <tbody>
        <tr class="section-hdr"><td colspan="2">A. CASH FLOW FROM OPERATING ACTIVITIES</td></tr>
        <tr><td class="indent1">Net Profit Before Tax</td><td class="amt">${f(t.pbt)}</td></tr>
        <tr class="group-hdr"><td colspan="2">Adjustments for:</td></tr>
        <tr><td class="indent2">Add: Depreciation &amp; Amortisation</td><td class="amt">${f(t.depreciation)}</td></tr>
        <tr><td class="indent2">Add: Finance Costs</td><td class="amt">${f(t.finCosts)}</td></tr>
        <tr><td class="indent2">Less: Interest / Other Income</td><td class="amt">(${f(t.otherIncome)})</td></tr>
        <tr class="group-hdr"><td colspan="2">Working Capital Changes:</td></tr>
        <tr><td class="indent2">Trade Receivables</td><td class="amt">(${f(t.tradeRec)})</td></tr>
        <tr><td class="indent2">Inventories</td><td class="amt">(${f(t.inventories)})</td></tr>
        <tr><td class="indent2">Short-Term Loans &amp; Advances</td><td class="amt">(${f(t.stLoans)})</td></tr>
        <tr><td class="indent2">Trade Payables</td><td class="amt">${f(t.tradePay)}</td></tr>
        <tr><td class="indent2">Other Current Liabilities</td><td class="amt">${f(t.otherCL)}</td></tr>
        <tr><td class="indent1">Less: Income Tax Paid</td><td class="amt">(${fmt(d.currentTax, div)})</td></tr>
        <tr class="grand-total"><td class="bold">Net Cash from Operating Activities (A)</td><td class="amt bold">${fmtRaw(cfOperating, 1)}</td></tr>

        <tr class="section-hdr"><td colspan="2">B. CASH FLOW FROM INVESTING ACTIVITIES</td></tr>
        <tr><td class="indent1">Purchase of Fixed Assets</td><td class="amt">(${f(t.totalFixedAssets)})</td></tr>
        <tr><td class="indent1">Non-Current Investments</td><td class="amt">(${f(t.ncInvestments)})</td></tr>
        <tr><td class="indent1">Interest / Dividend Received</td><td class="amt">${f(t.otherIncome)}</td></tr>
        <tr class="grand-total"><td class="bold">Net Cash from Investing Activities (B)</td><td class="amt bold">${fmtRaw(cfInvesting, 1)}</td></tr>

        <tr class="section-hdr"><td colspan="2">C. CASH FLOW FROM FINANCING ACTIVITIES</td></tr>
        <tr><td class="indent1">Proceeds from Borrowings</td><td class="amt">${f(t.ltBorrow + t.stBorrow)}</td></tr>
        <tr><td class="indent1">Finance Costs Paid</td><td class="amt">(${f(t.finCosts)})</td></tr>
        <tr class="grand-total"><td class="bold">Net Cash from Financing Activities (C)</td><td class="amt bold">${fmtRaw(cfFinancing, 1)}</td></tr>

        <tr class="section-hdr"><td colspan="2"></td></tr>
        <tr class="grand-total"><td class="bold">Net Increase / (Decrease) in Cash (A+B+C)</td><td class="amt bold">${fmtRaw(netCF, 1)}</td></tr>
        <tr><td class="indent1">Opening Cash &amp; Cash Equivalents</td><td class="amt">-</td></tr>
        <tr class="grand-total"><td class="bold">Closing Cash &amp; Cash Equivalents</td><td class="amt bold">${f(t.cash)}</td></tr>
      </tbody>
    </table>
    <div class="cf-note">Note: Cash Flow Statement is prepared using the Indirect Method as per AS-3. Previous year figures are based on data entered in Step 1–3.</div>`;

  // ── Full HTML document ──
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Balance Sheet — ${d.companyName || "Company"} — ${fyLabel}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Times New Roman", Times, serif; font-size: 11pt; color: #111; background: #fff; }
  @page { size: A4; margin: 18mm 16mm 18mm 22mm; }
  @media print { .no-print { display: none !important; } }

  .letterhead { text-align: center; padding-bottom: 8px; }
  .lh-name { font-size: 16pt; font-weight: bold; letter-spacing: 1px; }
  .lh-details { font-size: 9pt; color: #444; margin-top: 2px; }
  .lh-contact { font-size: 9pt; color: #444; margin-top: 2px; }
  .lh-rule { border: 1.5px solid #333; margin: 8px 0; }

  .doc-title { font-size: 13pt; font-weight: bold; text-align: center; text-transform: uppercase; margin: 14px 0 4px; }
  .sub-title { font-size: 9pt; text-align: center; color: #555; margin-bottom: 10px; }

  .main-table { width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 12px; }
  .main-table th { background: #1e3a5f; color: #fff; padding: 6px 8px; text-align: left; font-size: 9.5pt; }
  .col-note { width: 48px; text-align: center !important; }
  .col-amt { width: 130px; text-align: right !important; }
  .col-label { }
  .main-table td { padding: 4px 8px; border-bottom: 1px solid #e0e0e0; vertical-align: top; }
  .section-hdr td { background: #e8f0fb; font-weight: bold; font-size: 9.5pt; padding: 5px 8px; border-top: 1.5px solid #1e3a5f; }
  .group-hdr td { background: #f4f6f9; font-weight: 600; font-size: 9.5pt; padding: 4px 8px; font-style: italic; }
  .subtotal td { border-top: 1px solid #aaa; border-bottom: 1px double #333; }
  .grand-total td { background: #f0f4ff; border-top: 1.5px double #333; border-bottom: 2px solid #1e3a5f; font-weight: bold; }
  .amt { text-align: right !important; font-variant-numeric: tabular-nums; font-family: "Courier New", monospace; }
  .indent1 { padding-left: 20px !important; }
  .indent2 { padding-left: 36px !important; }
  .bold { font-weight: bold; }

  .balance-note { text-align: center; font-size: 10pt; font-weight: 700; padding: 6px 12px; border-radius: 4px; margin: 8px 0 16px; }
  .balanced { background: #f0fdf4; color: #166534; border: 1px solid #86efac; }
  .unbalanced { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

  .sig-block { margin-top: 24px; padding-top: 12px; border-top: 1px solid #ccc; }
  .sig-row { display: flex; justify-content: space-between; gap: 24px; }
  .sig-col { flex: 1; text-align: center; }
  .sig-line { border-top: 1.5px solid #333; margin: 40px 16px 6px; }
  .sig-name { font-weight: bold; font-size: 10pt; }
  .sig-meta { font-size: 8.5pt; color: #444; margin-top: 2px; }
  .sig-place { text-align: center; font-size: 9pt; margin-top: 14px; color: #555; }

  .cf-note { font-size: 8.5pt; color: #555; margin-top: 8px; font-style: italic; }
  .page-break { page-break-before: always; padding-top: 10px; }
</style>
</head>
<body>
  ${letterhead}
  ${bsHtml}
  ${sigBlock}
  ${plHtml}
  ${sigBlock}
  ${cfHtml}
  ${sigBlock}
</body>
</html>`;
}

// ── Print helper ──────────────────────────────────────────────────────────────

function printDoc(d: BalanceSheetData, withLetterhead: boolean) {
  const html = generateHTML(d, withLetterhead);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => {
      setTimeout(() => {
        win.print();
        URL.revokeObjectURL(url);
      }, 400);
    };
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BSPreview({ data }: Props) {
  const t = computeTotals(data);
  const div = UNIT_DIVISOR[data.displayUnit] ?? 1;
  const f = (v: number) => fmtRaw(v, div);
  const unitLabel = UNIT_LABEL[data.displayUnit] ?? "₹";
  const isBalanced = Math.abs(t.totalAssets - t.totalLiabilities) < 1;
  const diff = Math.abs(t.totalAssets - t.totalLiabilities);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>

      {/* ── Download buttons ── */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20, marginBottom: 18 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", marginBottom: 14 }}>
          📄 Download / Print Balance Sheet
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <button
            onClick={() => printDoc(data, true)}
            style={{ background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
          >
            🏢 Download with Letterhead
          </button>
          <button
            onClick={() => printDoc(data, false)}
            style={{ background: "#f8fafc", color: "#1e3a5f", border: "2px solid #1e3a5f", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
          >
            📋 Download without Letterhead
          </button>
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 10 }}>
          Opens in a new tab → Print dialog opens automatically → Save as PDF or Print
        </div>
      </div>

      {/* ── Balance check ── */}
      <div style={{
        background: isBalanced ? "#f0fdf4" : "#fef2f2",
        border: `2px solid ${isBalanced ? "#86efac" : "#fecaca"}`,
        borderRadius: 12, padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12
      }}>
        <span style={{ fontSize: 28 }}>{isBalanced ? "✅" : "⚠️"}</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: isBalanced ? "#166534" : "#dc2626" }}>
            {isBalanced ? "Balance Sheet is Balanced" : `Balance Sheet NOT Balanced — Difference: ${unitLabel} ${fmtRaw(diff, div)}`}
          </div>
          <div style={{ fontSize: 12, color: isBalanced ? "#166534" : "#dc2626", marginTop: 2 }}>
            Total Assets: {unitLabel} {f(t.totalAssets)} &nbsp;|&nbsp; Total Liabilities: {unitLabel} {f(t.totalLiabilities)}
          </div>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 18 }}>
        {[
          { label: "Share Capital", value: f(t.shareCapital), color: "#1e3a5f" },
          { label: "Reserves & Surplus", value: f(t.reserves), color: "#059669" },
          { label: "Total Assets", value: f(t.totalAssets), color: "#0369a1" },
          { label: "Revenue from Operations", value: f(t.revenue), color: "#7c3aed" },
          { label: "Profit Before Tax", value: f(t.pbt), color: t.pbt >= 0 ? "#059669" : "#dc2626" },
          { label: "Profit After Tax (PAT)", value: f(t.pat), color: t.pat >= 0 ? "#059669" : "#dc2626" },
        ].map(c => (
          <div key={c.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: c.color, fontVariantNumeric: "tabular-nums" }}>{unitLabel} {c.value}</div>
          </div>
        ))}
      </div>

      {/* ── Quick BS summary table ── */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18, marginBottom: 18 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a", marginBottom: 14 }}>Balance Sheet — Quick View ({unitLabel})</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 12, color: "#1e3a5f", borderBottom: "2px solid #1e3a5f", paddingBottom: 4, marginBottom: 8 }}>EQUITY & LIABILITIES</div>
            {[
              ["Share Capital", f(t.shareCapital)],
              ["Reserves & Surplus", f(t.reserves)],
              ["Long-Term Borrowings", f(t.ltBorrow)],
              ["Deferred Tax Liabilities", f(t.deferredTax > 0 ? t.deferredTax : 0)],
              ["Long-Term Provisions", f(t.ltProvisions)],
              ["Short-Term Borrowings", f(t.stBorrow)],
              ["Trade Payables", f(t.tradePay)],
              ["Other Current Liabilities", f(t.otherCL)],
              ["Short-Term Provisions", f(t.stProvisions)],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#374151" }}>{k}</span>
                <span style={{ fontWeight: 600, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 800, padding: "8px 0", borderTop: "2px solid #1e3a5f", marginTop: 4, color: "#1e3a5f" }}>
              <span>TOTAL</span><span>{f(t.totalLiabilities)}</span>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 12, color: "#1e3a5f", borderBottom: "2px solid #1e3a5f", paddingBottom: 4, marginBottom: 8 }}>ASSETS</div>
            {[
              ["Fixed Assets", f(t.totalFixedAssets)],
              ["Non-Current Investments", f(t.ncInvestments)],
              ["LT Loans & Advances", f(t.ltLoans)],
              ["Other Non-Current Assets", f(t.otherNCA)],
              ["Current Investments", f(t.currentInv)],
              ["Inventories", f(t.inventories)],
              ["Trade Receivables", f(t.tradeRec)],
              ["Cash & Cash Equivalents", f(t.cash)],
              ["Other Current Assets", f(t.stLoans + t.otherCA)],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#374151" }}>{k}</span>
                <span style={{ fontWeight: 600, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 800, padding: "8px 0", borderTop: "2px solid #1e3a5f", marginTop: 4, color: "#1e3a5f" }}>
              <span>TOTAL</span><span>{f(t.totalAssets)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── P&L summary ── */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a", marginBottom: 14 }}>P&L — Quick View ({unitLabel})</div>
        {[
          { label: "Revenue from Operations", value: f(t.revenue), bold: false },
          { label: "Other Income", value: f(t.otherIncome), bold: false },
          { label: "Total Revenue", value: f(t.totalRevenue), bold: true },
          { label: "Total Expenses", value: f(t.totalExpenses), bold: true },
          { label: "Profit Before Tax", value: f(t.pbt), bold: true },
          { label: "Tax (Current + Deferred)", value: f(t.tax), bold: false },
          { label: "Profit After Tax (PAT)", value: f(t.pat), bold: true },
        ].map(r => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: r.bold ? 13 : 12, fontWeight: r.bold ? 800 : 400, padding: "5px 0", borderBottom: "1px solid #f1f5f9", color: r.bold ? "#0f172a" : "#374151" }}>
            <span>{r.label}</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{unitLabel} {r.value}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
