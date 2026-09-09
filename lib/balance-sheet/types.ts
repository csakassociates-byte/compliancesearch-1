/**
 * Balance Sheet Tool — Core Types
 * Schedule III Division I (Non-Ind AS) — Companies Act 2013
 * MCA GSR 207(E) dated 24 March 2021 (latest amendment)
 */

// ── Display unit ──────────────────────────────────────────────────────────────

export type DisplayUnit = "actual" | "thousands" | "lakhs" | "millions" | "crores";

export const UNIT_LABEL: Record<DisplayUnit, string> = {
  actual:    "₹",
  thousands: "₹ in Thousands",
  lakhs:     "₹ in Lakhs",
  millions:  "₹ in Millions",
  crores:    "₹ in Crores",
};

export const UNIT_DIVISOR: Record<DisplayUnit, number> = {
  actual:    1,
  thousands: 1_000,
  lakhs:     1_00_000,
  millions:  10_00_000,
  crores:    1_00_00_000,
};

// ── Company type (for Schedule III) ──────────────────────────────────────────

export type BSCompanyType = "manufacturing" | "trading" | "service" | "finance" | "nidhi" | "nbfc";

// ── Financial Year ────────────────────────────────────────────────────────────

export type BSFinancialYear = "2023-24" | "2024-25" | "2025-26";

// ── Note 1 — Share Capital ────────────────────────────────────────────────────

export interface ShareCapitalClass {
  id: string;
  className: string;           // e.g. "Equity Shares", "Preference Shares"
  faceValue: string;           // ₹ per share
  authorisedShares: string;    // number of shares
  issuedShares: string;
  subscribedShares: string;
  paidUpShares: string;
  paidUpAmount: string;        // total paid up
  // Prev year
  prevPaidUpShares: string;
  prevPaidUpAmount: string;
}

export interface ShareholderAbove5 {
  id: string;
  name: string;
  shares: string;
  percent: string;
  prevShares: string;
  prevPercent: string;
}

export interface Note1ShareCapital {
  classes: ShareCapitalClass[];
  shareholdersAbove5: ShareholderAbove5[];
  sharesHeldByHoldingCo?: string;   // number
  sharesHeldByHoldingCoName?: string;
  // Reconciliation (auto-computed from classes)
  notes?: string;
}

// ── Note 2 — Reserves & Surplus ──────────────────────────────────────────────

export interface Note2ReservesSurplus {
  capitalReserve: string;
  capitalReservePrev: string;
  securitiesPremium: string;
  securitiesPremiumPrev: string;
  generalReserveOpen: string;
  generalReserveAdditions: string;
  generalReserveClose: string;       // auto-computed
  generalReservePrev: string;
  surplusOpeningBalance: string;
  surplusNetProfit: string;          // from P&L (auto-filled)
  surplusDividend: string;
  surplusTransferToReserve: string;
  surplusClosingBalance: string;     // auto-computed
  surplusPrev: string;
  otherReserves: string;
  otherReservesPrev: string;
  notes?: string;
}

// ── Note 3 — Long-term Borrowings ─────────────────────────────────────────────

export interface BorrowingItem {
  id: string;
  nature: string;       // "Term Loan from Bank", "Debentures", etc.
  secured: boolean;
  security?: string;    // collateral description
  amount: string;
  amountPrev: string;
}

export interface Note3LTBorrowings {
  items: BorrowingItem[];
  notes?: string;
}

// ── Note 4 — Deferred Tax ────────────────────────────────────────────────────

export interface Note4DeferredTax {
  deferredTaxLiability: string;
  deferredTaxLiabilityPrev: string;
  deferredTaxAsset: string;
  deferredTaxAssetPrev: string;
  // net = DTL - DTA
  notes?: string;
}

// ── Note 5 — Long-term Provisions ────────────────────────────────────────────

export interface Note5LTProvisions {
  provisionForGratuity: string;
  provisionForGratuityPrev: string;
  provisionForLeaveEncashment: string;
  provisionForLeaveEncashmentPrev: string;
  otherProvisions: string;
  otherProvisionsPrev: string;
  notes?: string;
}

// ── Note 6 — Short-term Borrowings ───────────────────────────────────────────

export interface Note6STBorrowings {
  items: BorrowingItem[];
  notes?: string;
}

// ── Note 7 — Trade Payables ──────────────────────────────────────────────────

export interface AgeingBucket {
  outstanding1yr: string;   // Outstanding for less than 1 year
  outstanding13yr: string;  // 1-2 years
  outstanding23yr: string;  // 2-3 years
  moreThan3yr: string;      // More than 3 years
}

export interface Note7TradePayables {
  msmeAmount: string;
  msmeAmountPrev: string;
  othersAmount: string;
  othersAmountPrev: string;
  disputedMsme: string;
  disputedMsmePrev: string;
  disputedOthers: string;
  disputedOthersPrev: string;
  // 2021 amendment — ageing schedule (4 buckets)
  msmeAgeing: AgeingBucket;
  othersAgeing: AgeingBucket;
  // MSME disclosure
  hasUdyamRegistration: boolean;
  msmeInterestProvided: string;
  msmeInterestProvidedPrev: string;
  notes?: string;
}

// ── Note 8 — Other Current Liabilities ───────────────────────────────────────

export interface Note8OtherCurrentLiabilities {
  currentMaturitiesLTBorrowings: string;
  currentMaturitiesLTBorrowingsPrev: string;
  interestAccrued: string;
  interestAccruedPrev: string;
  advancesFromCustomers: string;
  advancesFromCustomersPrev: string;
  statutoryDues: string;
  statutoryDuesPrev: string;     // TDS, GST, PF, ESI etc.
  otherPayables: string;
  otherPayablesPrev: string;
  notes?: string;
}

// ── Note 9 — Short-term Provisions ───────────────────────────────────────────

export interface Note9STProvisions {
  provisionForTax: string;
  provisionForTaxPrev: string;
  proposedDividend: string;
  proposedDividendPrev: string;
  otherProvisions: string;
  otherProvisionsPrev: string;
  notes?: string;
}

// ── Note 10 — Fixed Assets (PPE + Intangible) ────────────────────────────────

export interface FixedAssetRow {
  id: string;
  assetClass: string;          // "Land", "Buildings", "Plant & Machinery", etc.
  isTangible: boolean;
  // Gross Block
  gbOpeningBalance: string;
  gbAdditions: string;
  gbDisposals: string;
  gbClosingBalance: string;    // auto: open + add - disp
  gbPrevClosing: string;
  // Depreciation
  depOpeningBalance: string;
  depForYear: string;
  depOnDisposals: string;
  depClosingBalance: string;   // auto: open + for year - on disp
  depPrevClosing: string;
  // Net Block (auto)
  // nbClosing = gbClosing - depClosing
  // nbPrev = gbPrev - depPrev
}

export interface Note10FixedAssets {
  tangibleAssets: FixedAssetRow[];
  intangibleAssets: FixedAssetRow[];
  cwip: string;              // Capital Work-in-Progress
  cwipPrev: string;
  // 2021 amendment — CWIP ageing
  cwipLessThan1yr: string;
  cwip1to2yr: string;
  cwip2to3yr: string;
  cwipMore3yr: string;
  goodwill: string;          // Goodwill on consolidation (if any)
  goodwillPrev: string;
  notes?: string;
}

// ── Note 11 — Non-current Investments ────────────────────────────────────────

export interface InvestmentItem {
  id: string;
  description: string;
  faceValue: string;
  units: string;
  amount: string;
  amountPrev: string;
  valued: "cost" | "fair_value" | "equity_method";
}

export interface Note11NonCurrentInvestments {
  quotedItems: InvestmentItem[];
  unquotedItems: InvestmentItem[];
  provisionForDiminution: string;
  provisionForDiminutionPrev: string;
  notes?: string;
}

// ── Note 12 — Long-term Loans & Advances ─────────────────────────────────────

export interface Note12LTLoansAdvances {
  securityDeposits: string;
  securityDepositsPrev: string;
  capitalAdvances: string;
  capitalAdvancesPrev: string;
  otherLoansAdvances: string;
  otherLoansAdvancesPrev: string;
  loansToRelatedParties: string;
  loansToRelatedPartiesPrev: string;
  notes?: string;
}

// ── Note 13 — Other Non-current Assets ───────────────────────────────────────

export interface Note13OtherNonCurrentAssets {
  longTermTradeReceivables: string;
  longTermTradeReceivablesPrev: string;
  otherNonCurrentAssets: string;
  otherNonCurrentAssetsPrev: string;
  notes?: string;
}

// ── Note 14 — Current Investments ────────────────────────────────────────────

export interface Note14CurrentInvestments {
  mutualFunds: string;
  mutualFundsPrev: string;
  fixedDepositsMaturing12m: string;
  fixedDepositsMaturing12mPrev: string;
  otherCurrentInvestments: string;
  otherCurrentInvestmentsPrev: string;
  notes?: string;
}

// ── Note 15 — Inventories ────────────────────────────────────────────────────

export interface Note15Inventories {
  rawMaterials: string;
  rawMaterialsPrev: string;
  workInProgress: string;
  workInProgressPrev: string;
  finishedGoods: string;
  finishedGoodsPrev: string;
  stockInTrade: string;
  stockInTradePrev: string;
  storesSpares: string;
  storesSparesPrev: string;
  looseTool: string;
  looseToolPrev: string;
  valuationMethod?: "fifo" | "weighted_avg";
  notes?: string;
}

// ── Note 16 — Trade Receivables ───────────────────────────────────────────────

export interface Note16TradeReceivables {
  outstandingMore6mSecured: string;
  outstandingMore6mUnsecured: string;
  outstandingMore6mDoubtful: string;
  outstandingLess6mSecured: string;
  outstandingLess6mUnsecured: string;
  // Prev
  outstandingMore6mSecuredPrev: string;
  outstandingMore6mUnsecuredPrev: string;
  outstandingMore6mDoubtfulPrev: string;
  outstandingLess6mSecuredPrev: string;
  outstandingLess6mUnsecuredPrev: string;
  provisionForDoubtful: string;
  provisionForDoubtfulPrev: string;
  // 2021 amendment — ageing (6-month buckets)
  ageingUndisputed0to6: string;
  ageingUndisputed6to12: string;
  ageingUndisputed1to2yr: string;
  ageingUndisputed2to3yr: string;
  ageingUndisputedMore3yr: string;
  ageingDisputed0to6: string;
  ageingDisputed6to12: string;
  ageingDisputed1to2yr: string;
  ageingDisputed2to3yr: string;
  ageingDisputedMore3yr: string;
  notes?: string;
}

// ── Note 17 — Cash & Cash Equivalents ────────────────────────────────────────

export interface Note17CashEquivalents {
  cashOnHand: string;
  cashOnHandPrev: string;
  balancesWithBanks: string;
  balancesWithBanksPrev: string;
  fixedDepositsWithin3m: string;
  fixedDepositsWithin3mPrev: string;
  chequesDraftsOnHand: string;
  chequesDraftsOnHandPrev: string;
  notes?: string;
}

// ── Note 18 — Short-term Loans & Advances ────────────────────────────────────

export interface Note18STLoansAdvances {
  prepaidExpenses: string;
  prepaidExpensesPrev: string;
  advancesToSuppliers: string;
  advancesToSuppliersPrev: string;
  balanceWithGovernment: string;    // GST, TDS refund, advance tax
  balanceWithGovernmentPrev: string;
  otherAdvances: string;
  otherAdvancesPrev: string;
  notes?: string;
}

// ── Note 19 — Other Current Assets ───────────────────────────────────────────

export interface Note19OtherCurrentAssets {
  interestAccruedOnDeposits: string;
  interestAccruedOnDepositsPrev: string;
  otherCurrentAssets: string;
  otherCurrentAssetsPrev: string;
  notes?: string;
}

// ── Note 20 — Revenue from Operations ────────────────────────────────────────

export interface Note20Revenue {
  saleOfProducts: string;
  saleOfProductsPrev: string;
  saleOfServices: string;
  saleOfServicesPrev: string;
  otherOperatingRevenue: string;
  otherOperatingRevenuePrev: string;
  lessExciseDuty: string;
  lessExciseDutyPrev: string;
  notes?: string;
}

// ── Note 21 — Other Income ───────────────────────────────────────────────────

export interface Note21OtherIncome {
  interestIncome: string;
  interestIncomePrev: string;
  dividendIncome: string;
  dividendIncomePrev: string;
  profitOnSaleOfAssets: string;
  profitOnSaleOfAssetsPrev: string;
  miscIncome: string;
  miscIncomePrev: string;
  notes?: string;
}

// ── Note 22 — Cost of Materials ──────────────────────────────────────────────

export interface Note22Materials {
  openingStock: string;
  openingStockPrev: string;
  purchases: string;
  purchasesPrev: string;
  closingStock: string;
  closingStockPrev: string;
  // consumed = opening + purchases - closing (auto)
  notes?: string;
}

// ── Note 23 — Purchases of Stock-in-Trade ────────────────────────────────────

export interface Note23PurchasesStockInTrade {
  purchases: string;
  purchasesPrev: string;
  notes?: string;
}

// ── Note 24 — Changes in Inventories ─────────────────────────────────────────

export interface Note24InventoryChanges {
  openingFinishedGoods: string;
  openingFinishedGoodsPrev: string;
  openingWIP: string;
  openingWIPPrev: string;
  openingStockInTrade: string;
  openingStockInTradePrev: string;
  closingFinishedGoods: string;
  closingFinishedGoodsPrev: string;
  closingWIP: string;
  closingWIPPrev: string;
  closingStockInTrade: string;
  closingStockInTradePrev: string;
  notes?: string;
}

// ── Note 25 — Employee Benefits Expense ──────────────────────────────────────

export interface Note25EmployeeBenefits {
  salariesWages: string;
  salariesWagesPrev: string;
  bonuses: string;
  bonusesPrev: string;
  providentFund: string;
  providentFundPrev: string;
  gratuity: string;
  gratuityPrev: string;
  staffWelfare: string;
  staffWelfarePrev: string;
  directorRemuneration: string;
  directorRemunerationPrev: string;
  notes?: string;
}

// ── Note 26 — Finance Costs ──────────────────────────────────────────────────

export interface Note26FinanceCosts {
  interestOnBorrowings: string;
  interestOnBorrowingsPrev: string;
  bankCharges: string;
  bankChargesPrev: string;
  otherFinanceCosts: string;
  otherFinanceCostsPrev: string;
  notes?: string;
}

// ── Note 27 — Depreciation & Amortization ────────────────────────────────────

export interface Note27Depreciation {
  depreciation: string;       // auto from Note 10 fixed assets
  depreciationPrev: string;
  amortization: string;
  amortizationPrev: string;
  notes?: string;
}

// ── Note 28 — Other Expenses ─────────────────────────────────────────────────

export interface Note28OtherExpenses {
  powerFuel: string;
  powerFuelPrev: string;
  rent: string;
  rentPrev: string;
  repairsMaintenance: string;
  repairsMaintenancePrev: string;
  advertisingMarketing: string;
  advertisingMarketingPrev: string;
  travellingConveyance: string;
  travellingConveyancePrev: string;
  legalProfessional: string;
  legalProfessionalPrev: string;
  auditFees: string;
  auditFeesPrev: string;
  insurancePremium: string;
  insurancePremiumPrev: string;
  miscExpenses: string;
  miscExpensesPrev: string;
  notes?: string;
}

// ── Additional Disclosures (2021 Amendment) ───────────────────────────────────

export interface FinancialRatios {
  // 11 mandatory ratios per 2021 amendment
  currentRatio: string;              // Current Assets / Current Liabilities
  debtEquityRatio: string;           // Total Debt / Shareholders' Equity
  debtServiceCoverageRatio: string;  // EBIT / (Interest + Principal)
  returnOnEquity: string;            // Net Profit / Average Shareholders' Equity %
  inventoryTurnoverRatio: string;    // Revenue / Average Inventory
  tradeReceivablesTurnover: string;  // Revenue / Average Trade Receivables
  tradePayablesTurnover: string;     // Purchases / Average Trade Payables
  netCapitalTurnoverRatio: string;   // Revenue / Working Capital
  netProfitRatio: string;            // Net Profit / Revenue %
  returnOnCapitalEmployed: string;   // EBIT / Capital Employed %
  returnOnInvestment: string;        // Income from investments / Cost of investments %
  // Prev year for comparison
  currentRatioPrev: string;
  debtEquityRatioPrev: string;
  debtServiceCoverageRatioPrev: string;
  returnOnEquityPrev: string;
  inventoryTurnoverRatioPrev: string;
  tradeReceivablesTurnoverPrev: string;
  tradePayablesTurnoverPrev: string;
  netCapitalTurnoverRatioPrev: string;
  netProfitRatioPrev: string;
  returnOnCapitalEmployedPrev: string;
  returnOnInvestmentPrev: string;
}

export interface PromoterShareholding {
  promoterName: string;
  sharesBeginning: string;
  percentBeginning: string;
  sharesEnd: string;
  percentEnd: string;
  percentChange: string;
}

export interface AdditionalDisclosures {
  // Contingent Liabilities (Sch III Para 5)
  contingentLiabilities: string;
  capitalCommitments: string;
  // Related Party Transactions (AS-18)
  relatedPartyDisclosure: string;
  // Promoter Shareholding (2021 amendment)
  promoterShareholding: PromoterShareholding[];
  // Security given for borrowings
  securityDetails: string;
  // Wilful defaulter disclosure
  isWilfulDefaulter: boolean;
  // Transactions with struck-off companies
  transactionsWithStruckOff: string;
  // Registration with RBI / other regulator
  registrationDetails?: string;
  ratios: FinancialRatios;
  notes?: string;
}

// ── Cash Flow Statement (Indirect Method) ────────────────────────────────────

export interface CashFlowStatement {
  // Auto-computed from BS + P&L data
  // Stored for override purposes
  netProfitBeforeTax: string;
  depreciation: string;
  financeCosts: string;
  // Working capital adjustments
  decreaseInTradeReceivables: string;
  decreaseInInventories: string;
  increaseInTradePayables: string;
  // Investing
  purchaseOfPPE: string;
  proceedsFromSaleOfAssets: string;
  purchaseOfInvestments: string;
  saleOfInvestments: string;
  // Financing
  proceedsFromBorrowings: string;
  repaymentOfBorrowings: string;
  dividendPaid: string;
  // Opening / closing cash
  openingCash: string;
  closingCash: string;
  // Override flags
  isManualOverride: boolean;
}

// ── Full Balance Sheet Form Data ──────────────────────────────────────────────

export interface BalanceSheetData {
  // ── Setup ───────────────────────────────────────
  companyName: string;
  cin: string;
  pan?: string;
  regAddress: string;
  financialYear: BSFinancialYear;
  fyStart: string;              // "01/04/2025"
  fyEnd: string;                // "31/03/2026"
  companyType: BSCompanyType;
  displayUnit: DisplayUnit;
  isFirstYear: boolean;         // No comparative figures if true
  dateOfBalance: string;        // Balance sheet date YYYY-MM-DD
  placeOfSigning: string;
  // Signatories
  directorName1: string;
  directorDin1: string;
  directorDesignation1: string;
  directorName2?: string;
  directorDin2?: string;
  directorDesignation2?: string;
  auditorFirmName: string;
  auditorPartnerName: string;
  auditorFRN: string;
  auditorMembershipNo: string;
  auditorPlace: string;
  auditorReportDate: string;
  // Company contact
  companyEmail?: string;
  companyPhone?: string;
  gstin?: string;
  useLetterHead?: boolean;

  // ── Equity & Liabilities Notes ─────────────────
  note1ShareCapital: Note1ShareCapital;
  note2ReservesSurplus: Note2ReservesSurplus;
  note3LTBorrowings: Note3LTBorrowings;
  note4DeferredTax: Note4DeferredTax;
  note5LTProvisions: Note5LTProvisions;
  note6STBorrowings: Note6STBorrowings;
  note7TradePayables: Note7TradePayables;
  note8OtherCurrentLiabilities: Note8OtherCurrentLiabilities;
  note9STProvisions: Note9STProvisions;

  // ── Asset Notes ─────────────────────────────────
  note10FixedAssets: Note10FixedAssets;
  note11NonCurrentInvestments: Note11NonCurrentInvestments;
  note12LTLoansAdvances: Note12LTLoansAdvances;
  note13OtherNonCurrentAssets: Note13OtherNonCurrentAssets;
  note14CurrentInvestments: Note14CurrentInvestments;
  note15Inventories: Note15Inventories;
  note16TradeReceivables: Note16TradeReceivables;
  note17CashEquivalents: Note17CashEquivalents;
  note18STLoansAdvances: Note18STLoansAdvances;
  note19OtherCurrentAssets: Note19OtherCurrentAssets;

  // ── P&L Notes ──────────────────────────────────
  note20Revenue: Note20Revenue;
  note21OtherIncome: Note21OtherIncome;
  note22Materials: Note22Materials;
  note23PurchasesStockInTrade: Note23PurchasesStockInTrade;
  note24InventoryChanges: Note24InventoryChanges;
  note25EmployeeBenefits: Note25EmployeeBenefits;
  note26FinanceCosts: Note26FinanceCosts;
  note27Depreciation: Note27Depreciation;
  note28OtherExpenses: Note28OtherExpenses;

  // ── Tax & Profit ────────────────────────────────
  currentTax: string;
  currentTaxPrev: string;
  deferredTaxCharge: string;    // movement in deferred tax
  deferredTaxChargePrev: string;

  // ── Additional Disclosures ──────────────────────
  additionalDisclosures: AdditionalDisclosures;

  // ── Cash Flow ───────────────────────────────────
  cashFlow: CashFlowStatement;

  // ── Internal ───────────────────────────────────
  _companyId?: string;
}

// ── Computed Balance Sheet Summary ────────────────────────────────────────────

export interface BSComputedTotals {
  // Liabilities side
  shareholdersFunds: number;
  shareApplicationMoney: number;
  nonCurrentLiabilities: number;
  currentLiabilities: number;
  totalLiabilities: number;
  // Assets side
  nonCurrentAssets: number;
  currentAssets: number;
  totalAssets: number;
  // Balance check
  isBalanced: boolean;
  difference: number;
  // P&L
  totalRevenue: number;
  totalExpenses: number;
  profitBeforeTax: number;
  profitAfterTax: number;
}

// ── Helper: parse number string safely ────────────────────────────────────────

export function n(val: string | undefined | null): number {
  if (!val) return 0;
  const parsed = parseFloat(val.replace(/,/g, ""));
  return isNaN(parsed) ? 0 : parsed;
}

// ── Initial data ──────────────────────────────────────────────────────────────

export function makeEmptyAgeingBucket(): AgeingBucket {
  return { outstanding1yr: "", outstanding13yr: "", outstanding23yr: "", moreThan3yr: "" };
}

export function makeEmptyBorrowingItem(): BorrowingItem {
  return { id: crypto.randomUUID(), nature: "", secured: false, security: "", amount: "", amountPrev: "" };
}

export function makeEmptyShareCapitalClass(): ShareCapitalClass {
  return {
    id: crypto.randomUUID(), className: "Equity Shares", faceValue: "10",
    authorisedShares: "", issuedShares: "", subscribedShares: "", paidUpShares: "", paidUpAmount: "",
    prevPaidUpShares: "", prevPaidUpAmount: "",
  };
}

export function makeEmptyFixedAssetRow(isTangible = true): FixedAssetRow {
  return {
    id: crypto.randomUUID(), assetClass: "", isTangible,
    gbOpeningBalance: "", gbAdditions: "", gbDisposals: "", gbClosingBalance: "", gbPrevClosing: "",
    depOpeningBalance: "", depForYear: "", depOnDisposals: "", depClosingBalance: "", depPrevClosing: "",
  };
}

export function makeEmptyRatios(): FinancialRatios {
  return {
    currentRatio: "", debtEquityRatio: "", debtServiceCoverageRatio: "", returnOnEquity: "",
    inventoryTurnoverRatio: "", tradeReceivablesTurnover: "", tradePayablesTurnover: "",
    netCapitalTurnoverRatio: "", netProfitRatio: "", returnOnCapitalEmployed: "", returnOnInvestment: "",
    currentRatioPrev: "", debtEquityRatioPrev: "", debtServiceCoverageRatioPrev: "", returnOnEquityPrev: "",
    inventoryTurnoverRatioPrev: "", tradeReceivablesTurnoverPrev: "", tradePayablesTurnoverPrev: "",
    netCapitalTurnoverRatioPrev: "", netProfitRatioPrev: "", returnOnCapitalEmployedPrev: "", returnOnInvestmentPrev: "",
  };
}

export const INITIAL_BALANCE_SHEET_DATA: BalanceSheetData = {
  companyName: "", cin: "", pan: "", regAddress: "",
  financialYear: "2025-26", fyStart: "01/04/2025", fyEnd: "31/03/2026",
  companyType: "manufacturing", displayUnit: "lakhs", isFirstYear: false,
  dateOfBalance: "", placeOfSigning: "",
  directorName1: "", directorDin1: "", directorDesignation1: "Director",
  auditorFirmName: "", auditorPartnerName: "", auditorFRN: "", auditorMembershipNo: "",
  auditorPlace: "", auditorReportDate: "",
  note1ShareCapital: {
    classes: [makeEmptyShareCapitalClass()],
    shareholdersAbove5: [],
  },
  note2ReservesSurplus: {
    capitalReserve: "", capitalReservePrev: "",
    securitiesPremium: "", securitiesPremiumPrev: "",
    generalReserveOpen: "", generalReserveAdditions: "", generalReserveClose: "", generalReservePrev: "",
    surplusOpeningBalance: "", surplusNetProfit: "", surplusDividend: "", surplusTransferToReserve: "",
    surplusClosingBalance: "", surplusPrev: "",
    otherReserves: "", otherReservesPrev: "",
  },
  note3LTBorrowings: { items: [] },
  note4DeferredTax: { deferredTaxLiability: "", deferredTaxLiabilityPrev: "", deferredTaxAsset: "", deferredTaxAssetPrev: "" },
  note5LTProvisions: {
    provisionForGratuity: "", provisionForGratuityPrev: "",
    provisionForLeaveEncashment: "", provisionForLeaveEncashmentPrev: "",
    otherProvisions: "", otherProvisionsPrev: "",
  },
  note6STBorrowings: { items: [] },
  note7TradePayables: {
    msmeAmount: "", msmeAmountPrev: "",
    othersAmount: "", othersAmountPrev: "",
    disputedMsme: "", disputedMsmePrev: "",
    disputedOthers: "", disputedOthersPrev: "",
    msmeAgeing: makeEmptyAgeingBucket(),
    othersAgeing: makeEmptyAgeingBucket(),
    hasUdyamRegistration: false,
    msmeInterestProvided: "", msmeInterestProvidedPrev: "",
  },
  note8OtherCurrentLiabilities: {
    currentMaturitiesLTBorrowings: "", currentMaturitiesLTBorrowingsPrev: "",
    interestAccrued: "", interestAccruedPrev: "",
    advancesFromCustomers: "", advancesFromCustomersPrev: "",
    statutoryDues: "", statutoryDuesPrev: "",
    otherPayables: "", otherPayablesPrev: "",
  },
  note9STProvisions: {
    provisionForTax: "", provisionForTaxPrev: "",
    proposedDividend: "", proposedDividendPrev: "",
    otherProvisions: "", otherProvisionsPrev: "",
  },
  note10FixedAssets: {
    tangibleAssets: [
      { ...makeEmptyFixedAssetRow(true), assetClass: "Land" },
      { ...makeEmptyFixedAssetRow(true), assetClass: "Buildings" },
      { ...makeEmptyFixedAssetRow(true), assetClass: "Plant & Machinery" },
      { ...makeEmptyFixedAssetRow(true), assetClass: "Furniture & Fixtures" },
      { ...makeEmptyFixedAssetRow(true), assetClass: "Vehicles" },
      { ...makeEmptyFixedAssetRow(true), assetClass: "Office Equipment" },
    ],
    intangibleAssets: [],
    cwip: "", cwipPrev: "",
    cwipLessThan1yr: "", cwip1to2yr: "", cwip2to3yr: "", cwipMore3yr: "",
    goodwill: "", goodwillPrev: "",
  },
  note11NonCurrentInvestments: { quotedItems: [], unquotedItems: [], provisionForDiminution: "", provisionForDiminutionPrev: "" },
  note12LTLoansAdvances: {
    securityDeposits: "", securityDepositsPrev: "",
    capitalAdvances: "", capitalAdvancesPrev: "",
    otherLoansAdvances: "", otherLoansAdvancesPrev: "",
    loansToRelatedParties: "", loansToRelatedPartiesPrev: "",
  },
  note13OtherNonCurrentAssets: { longTermTradeReceivables: "", longTermTradeReceivablesPrev: "", otherNonCurrentAssets: "", otherNonCurrentAssetsPrev: "" },
  note14CurrentInvestments: { mutualFunds: "", mutualFundsPrev: "", fixedDepositsMaturing12m: "", fixedDepositsMaturing12mPrev: "", otherCurrentInvestments: "", otherCurrentInvestmentsPrev: "" },
  note15Inventories: {
    rawMaterials: "", rawMaterialsPrev: "", workInProgress: "", workInProgressPrev: "",
    finishedGoods: "", finishedGoodsPrev: "", stockInTrade: "", stockInTradePrev: "",
    storesSpares: "", storesSparesPrev: "", looseTool: "", looseToolPrev: "",
    valuationMethod: "fifo",
  },
  note16TradeReceivables: {
    outstandingMore6mSecured: "", outstandingMore6mUnsecured: "", outstandingMore6mDoubtful: "",
    outstandingLess6mSecured: "", outstandingLess6mUnsecured: "",
    outstandingMore6mSecuredPrev: "", outstandingMore6mUnsecuredPrev: "", outstandingMore6mDoubtfulPrev: "",
    outstandingLess6mSecuredPrev: "", outstandingLess6mUnsecuredPrev: "",
    provisionForDoubtful: "", provisionForDoubtfulPrev: "",
    ageingUndisputed0to6: "", ageingUndisputed6to12: "", ageingUndisputed1to2yr: "", ageingUndisputed2to3yr: "", ageingUndisputedMore3yr: "",
    ageingDisputed0to6: "", ageingDisputed6to12: "", ageingDisputed1to2yr: "", ageingDisputed2to3yr: "", ageingDisputedMore3yr: "",
  },
  note17CashEquivalents: {
    cashOnHand: "", cashOnHandPrev: "", balancesWithBanks: "", balancesWithBanksPrev: "",
    fixedDepositsWithin3m: "", fixedDepositsWithin3mPrev: "", chequesDraftsOnHand: "", chequesDraftsOnHandPrev: "",
  },
  note18STLoansAdvances: {
    prepaidExpenses: "", prepaidExpensesPrev: "", advancesToSuppliers: "", advancesToSuppliersPrev: "",
    balanceWithGovernment: "", balanceWithGovernmentPrev: "", otherAdvances: "", otherAdvancesPrev: "",
  },
  note19OtherCurrentAssets: { interestAccruedOnDeposits: "", interestAccruedOnDepositsPrev: "", otherCurrentAssets: "", otherCurrentAssetsPrev: "" },
  note20Revenue: {
    saleOfProducts: "", saleOfProductsPrev: "", saleOfServices: "", saleOfServicesPrev: "",
    otherOperatingRevenue: "", otherOperatingRevenuePrev: "", lessExciseDuty: "", lessExciseDutyPrev: "",
  },
  note21OtherIncome: {
    interestIncome: "", interestIncomePrev: "", dividendIncome: "", dividendIncomePrev: "",
    profitOnSaleOfAssets: "", profitOnSaleOfAssetsPrev: "", miscIncome: "", miscIncomePrev: "",
  },
  note22Materials: { openingStock: "", openingStockPrev: "", purchases: "", purchasesPrev: "", closingStock: "", closingStockPrev: "" },
  note23PurchasesStockInTrade: { purchases: "", purchasesPrev: "" },
  note24InventoryChanges: {
    openingFinishedGoods: "", openingFinishedGoodsPrev: "", openingWIP: "", openingWIPPrev: "",
    openingStockInTrade: "", openingStockInTradePrev: "", closingFinishedGoods: "", closingFinishedGoodsPrev: "",
    closingWIP: "", closingWIPPrev: "", closingStockInTrade: "", closingStockInTradePrev: "",
  },
  note25EmployeeBenefits: {
    salariesWages: "", salariesWagesPrev: "", bonuses: "", bonusesPrev: "",
    providentFund: "", providentFundPrev: "", gratuity: "", gratuityPrev: "",
    staffWelfare: "", staffWelfarePrev: "", directorRemuneration: "", directorRemunerationPrev: "",
  },
  note26FinanceCosts: {
    interestOnBorrowings: "", interestOnBorrowingsPrev: "", bankCharges: "", bankChargesPrev: "",
    otherFinanceCosts: "", otherFinanceCostsPrev: "",
  },
  note27Depreciation: { depreciation: "", depreciationPrev: "", amortization: "", amortizationPrev: "" },
  note28OtherExpenses: {
    powerFuel: "", powerFuelPrev: "", rent: "", rentPrev: "",
    repairsMaintenance: "", repairsMaintenancePrev: "", advertisingMarketing: "", advertisingMarketingPrev: "",
    travellingConveyance: "", travellingConveyancePrev: "", legalProfessional: "", legalProfessionalPrev: "",
    auditFees: "", auditFeesPrev: "", insurancePremium: "", insurancePremiumPrev: "",
    miscExpenses: "", miscExpensesPrev: "",
  },
  currentTax: "", currentTaxPrev: "", deferredTaxCharge: "", deferredTaxChargePrev: "",
  additionalDisclosures: {
    contingentLiabilities: "", capitalCommitments: "", relatedPartyDisclosure: "",
    promoterShareholding: [], securityDetails: "", isWilfulDefaulter: false,
    transactionsWithStruckOff: "", ratios: makeEmptyRatios(),
  },
  cashFlow: {
    netProfitBeforeTax: "", depreciation: "", financeCosts: "",
    decreaseInTradeReceivables: "", decreaseInInventories: "", increaseInTradePayables: "",
    purchaseOfPPE: "", proceedsFromSaleOfAssets: "", purchaseOfInvestments: "", saleOfInvestments: "",
    proceedsFromBorrowings: "", repaymentOfBorrowings: "", dividendPaid: "",
    openingCash: "", closingCash: "", isManualOverride: false,
  },
};
