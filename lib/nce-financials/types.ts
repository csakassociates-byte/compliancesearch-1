export type NCEEntityType = "proprietorship" | "partnership" | "llp" | "huf" | "trust" | "association";
export type NCEFinancialYear = "2025-26" | "2024-25" | "2023-24" | "2022-23";

export interface OwnerCapitalAccount {
  id: string;
  ownerName: string;
  ratio: string;
  openingCapital: string;
  openingCapitalPrev: string;
  contributions: string;
  contributionsPrev: string;
  remuneration: string;
  remunerationPrev: string;
  interest: string;
  interestPrev: string;
  withdrawals: string;
  withdrawalsPrev: string;
  profitShare: string;
  profitSharePrev: string;
}

export interface Note4Reserves {
  generalReserveOpen: string;
  generalReserveAdditions: string;
  generalReserveClose: string;
  generalReservePrev: string;
  surplusOpeningBalance: string;
  surplusNetProfit: string;
  surplusTransferToReserve: string;
  surplusClosingBalance: string;
  surplusPrev: string;
  otherReserves: string;
  otherReservesPrev: string;
}

export interface BorrowingItem {
  id: string;
  category: string;
  name: string;
  secured: boolean;
  amount: string;
  amountPrev: string;
  rate: string;
  tenure: string;
}

export interface Note5Borrowings {
  ltSecured: BorrowingItem[];
  ltUnsecured: BorrowingItem[];
  stSecured: BorrowingItem[];
  stUnsecured: BorrowingItem[];
}

export interface Note6DeferredTax {
  deferredTaxLiability: string;
  deferredTaxLiabilityPrev: string;
  deferredTaxAsset: string;
  deferredTaxAssetPrev: string;
}

export interface SimpleLineItem {
  id: string;
  description: string;
  amount: string;
  amountPrev: string;
}

export interface Note7OtherLTLiabilities {
  items: SimpleLineItem[];
}

export interface Note8Provisions {
  ltGratuity: string;
  ltGratuityPrev: string;
  ltLeaveEncashment: string;
  ltLeaveEncashmentPrev: string;
  ltOther: string;
  ltOtherPrev: string;
  stIncomeTax: string;
  stIncomeTaxPrev: string;
  stOther: string;
  stOtherPrev: string;
}

export interface TradePayableItem {
  id: string;
  name: string;
  isMSME: boolean;
  isDisputed: boolean;
  withinYear: string;
  withinYearPrev: string;
  oneToTwo: string;
  twoToThree: string;
  aboveThree: string;
}

export interface Note9TradePayables {
  items: TradePayableItem[];
}

export interface Note10OtherCL {
  advancesFromCustomers: string;
  advancesFromCustomersPrev: string;
  tdsPayable: string;
  tdsPayablePrev: string;
  gstPayable: string;
  gstPayablePrev: string;
  salariesPayable: string;
  salariesPayablePrev: string;
  items: SimpleLineItem[];
}

export interface PPERow {
  id: string;
  assetName: string;
  gbOpeningBalance: string;
  gbAdditions: string;
  gbDisposals: string;
  gbClosingBalance: string;
  gbPrevClosing: string;
  depOpeningBalance: string;
  depForYear: string;
  depOnDisposals: string;
  depClosingBalance: string;
  depPrevClosing: string;
}

export interface Note11FixedAssets {
  tangibleAssets: PPERow[];
  intangibleAssets: PPERow[];
  cwip: string;
  cwipPrev: string;
}

export interface Note12Investments {
  items: SimpleLineItem[];
}

export interface Note13LTLoans {
  securityDeposits: string;
  securityDepositsPrev: string;
  capitalAdvances: string;
  capitalAdvancesPrev: string;
  items: SimpleLineItem[];
}

export interface Note14OtherNCAssets {
  items: SimpleLineItem[];
}

export interface Note15Inventories {
  rawMaterials: string;
  rawMaterialsPrev: string;
  wip: string;
  wipPrev: string;
  finishedGoods: string;
  finishedGoodsPrev: string;
  tradingGoods: string;
  tradingGoodsPrev: string;
  stores: string;
  storesPrev: string;
  looseTools: string;
  looseToolsPrev: string;
}

export interface TradeReceivableItem {
  id: string;
  name: string;
  isRelatedParty: boolean;
  isDisputed: boolean;
  withinSixMonths: string;
  withinSixMonthsPrev: string;
  sixToTwelve: string;
  aboveOne: string;
}

export interface Note16TradeReceivables {
  items: TradeReceivableItem[];
  securedGood: string;
  securedGoodPrev: string;
  unsecuredGood: string;
  unsecuredGoodPrev: string;
  doubtful: string;
  doubtfulPrev: string;
}

export interface Note17Cash {
  cashInHand: string;
  cashInHandPrev: string;
  bankCurrentAccount: string;
  bankCurrentAccountPrev: string;
  bankSavingsAccount: string;
  bankSavingsAccountPrev: string;
  fdDeposits: string;
  fdDepositsPrev: string;
}

export interface Note18STLoans {
  advancesToSuppliers: string;
  advancesToSuppliersPrev: string;
  prepaidExpenses: string;
  prepaidExpensesPrev: string;
  items: SimpleLineItem[];
}

export interface Note18aOtherCA {
  interestAccrued: string;
  interestAccruedPrev: string;
  tdsReceivable: string;
  tdsReceivablePrev: string;
  gstReceivable: string;
  gstReceivablePrev: string;
  items: SimpleLineItem[];
}

export interface Note19Revenue {
  saleOfGoods: string;
  saleOfGoodsPrev: string;
  saleOfServices: string;
  saleOfServicesPrev: string;
  otherOperatingRevenue: string;
  otherOperatingRevenuePrev: string;
}

export interface Note21Materials {
  openingStock: string;
  openingStockPrev: string;
  purchases: string;
  purchasesPrev: string;
  closingStock: string;
  closingStockPrev: string;
  directExpenses: string;
  directExpensesPrev: string;
}

export interface Note22EmployeeBenefits {
  salariesWages: string;
  salariesWagesPrev: string;
  bonuses: string;
  bonusesPrev: string;
  pf: string;
  pfPrev: string;
  esi: string;
  esiPrev: string;
  gratuity: string;
  gratuityPrev: string;
  staffWelfare: string;
  staffWelfarePrev: string;
  items: SimpleLineItem[];
}

export interface Note23FinanceCosts {
  interestOnBorrowings: string;
  interestOnBorrowingsPrev: string;
  bankCharges: string;
  bankChargesPrev: string;
  items: SimpleLineItem[];
}

export interface Note24Depreciation {
  depOnTangibleAssets: string;
  depOnTangibleAssetsPrev: string;
  depOnIntangibleAssets: string;
  depOnIntangibleAssetsPrev: string;
  amortization: string;
  amortizationPrev: string;
}

export interface PartnersRemunerationItem {
  id: string;
  name: string;
  amount: string;
  amountPrev: string;
}

export interface NCEFinancialsData {
  _id?: string;
  _companyId?: string;

  // Setup
  entityName: string;
  entityType: NCEEntityType;
  address: string;
  pan: string;
  gstin: string;
  registrationNumber: string;
  financialYear: NCEFinancialYear;
  isFirstYear: boolean;

  // Auditor
  auditorName: string;
  auditorFirm: string;
  auditorMembership: string;
  auditorAddress: string;
  auditorPlace: string;
  auditorDate: string;

  // Signatory
  signatoryName: string;
  signatoryDesignation: string;
  signatoryPlace: string;
  signatoryDate: string;

  // Liabilities
  note3OwnersCapital: OwnerCapitalAccount[];
  note4Reserves: Note4Reserves;
  note5Borrowings: Note5Borrowings;
  note6DeferredTax: Note6DeferredTax;
  note7OtherLTLiabilities: Note7OtherLTLiabilities;
  note8Provisions: Note8Provisions;
  note9TradePayables: Note9TradePayables;
  note10OtherCL: Note10OtherCL;

  // Assets
  note11FixedAssets: Note11FixedAssets;
  note12Investments: Note12Investments;
  note13LTLoans: Note13LTLoans;
  note14OtherNCAssets: Note14OtherNCAssets;
  note15Inventories: Note15Inventories;
  note16TradeReceivables: Note16TradeReceivables;
  note17Cash: Note17Cash;
  note18STLoans: Note18STLoans;
  note18aOtherCA: Note18aOtherCA;

  // P&L
  note19Revenue: Note19Revenue;
  note20OtherIncome: SimpleLineItem[];
  note21Materials: Note21Materials;
  note22EmployeeBenefits: Note22EmployeeBenefits;
  note23FinanceCosts: Note23FinanceCosts;
  note24Depreciation: Note24Depreciation;
  note25OtherExpenses: SimpleLineItem[];
  partnersRemuneration: PartnersRemunerationItem[];
  incomeTaxProvision: string;
  incomeTaxProvisionPrev: string;
  deferredTaxCharge: string;
  deferredTaxChargePrev: string;
}

function makeId() { return crypto.randomUUID(); }

export function newPPERow(assetName = ""): PPERow {
  return { id: makeId(), assetName, gbOpeningBalance: "", gbAdditions: "", gbDisposals: "", gbClosingBalance: "", gbPrevClosing: "", depOpeningBalance: "", depForYear: "", depOnDisposals: "", depClosingBalance: "", depPrevClosing: "" };
}

export function newBorrowingItem(): BorrowingItem {
  return { id: makeId(), category: "", name: "", secured: true, amount: "", amountPrev: "", rate: "", tenure: "" };
}

export function newOwnerAccount(): OwnerCapitalAccount {
  return { id: makeId(), ownerName: "", ratio: "", openingCapital: "", openingCapitalPrev: "", contributions: "", contributionsPrev: "", remuneration: "", remunerationPrev: "", interest: "", interestPrev: "", withdrawals: "", withdrawalsPrev: "", profitShare: "", profitSharePrev: "" };
}

export function newTradePayable(): TradePayableItem {
  return { id: makeId(), name: "", isMSME: false, isDisputed: false, withinYear: "", withinYearPrev: "", oneToTwo: "", twoToThree: "", aboveThree: "" };
}

export function newTradeReceivable(): TradeReceivableItem {
  return { id: makeId(), name: "", isRelatedParty: false, isDisputed: false, withinSixMonths: "", withinSixMonthsPrev: "", sixToTwelve: "", aboveOne: "" };
}

export function newSimpleItem(description = ""): SimpleLineItem {
  return { id: makeId(), description, amount: "", amountPrev: "" };
}

export const INITIAL_NCE_DATA: NCEFinancialsData = {
  entityName: "", entityType: "partnership", address: "", pan: "", gstin: "",
  registrationNumber: "", financialYear: "2025-26", isFirstYear: false,
  auditorName: "", auditorFirm: "", auditorMembership: "", auditorAddress: "", auditorPlace: "", auditorDate: "",
  signatoryName: "", signatoryDesignation: "Managing Partner", signatoryPlace: "", signatoryDate: "",

  note3OwnersCapital: [newOwnerAccount()],
  note4Reserves: {
    generalReserveOpen: "", generalReserveAdditions: "", generalReserveClose: "", generalReservePrev: "",
    surplusOpeningBalance: "", surplusNetProfit: "", surplusTransferToReserve: "", surplusClosingBalance: "", surplusPrev: "",
    otherReserves: "", otherReservesPrev: "",
  },
  note5Borrowings: { ltSecured: [], ltUnsecured: [], stSecured: [], stUnsecured: [] },
  note6DeferredTax: { deferredTaxLiability: "", deferredTaxLiabilityPrev: "", deferredTaxAsset: "", deferredTaxAssetPrev: "" },
  note7OtherLTLiabilities: { items: [] },
  note8Provisions: { ltGratuity: "", ltGratuityPrev: "", ltLeaveEncashment: "", ltLeaveEncashmentPrev: "", ltOther: "", ltOtherPrev: "", stIncomeTax: "", stIncomeTaxPrev: "", stOther: "", stOtherPrev: "" },
  note9TradePayables: { items: [newTradePayable()] },
  note10OtherCL: { advancesFromCustomers: "", advancesFromCustomersPrev: "", tdsPayable: "", tdsPayablePrev: "", gstPayable: "", gstPayablePrev: "", salariesPayable: "", salariesPayablePrev: "", items: [] },

  note11FixedAssets: {
    tangibleAssets: [newPPERow("Land"), newPPERow("Building"), newPPERow("Plant & Machinery"), newPPERow("Furniture & Fixtures"), newPPERow("Vehicles"), newPPERow("Computers")],
    intangibleAssets: [newPPERow("Goodwill"), newPPERow("Software")],
    cwip: "", cwipPrev: "",
  },
  note12Investments: { items: [] },
  note13LTLoans: { securityDeposits: "", securityDepositsPrev: "", capitalAdvances: "", capitalAdvancesPrev: "", items: [] },
  note14OtherNCAssets: { items: [] },
  note15Inventories: { rawMaterials: "", rawMaterialsPrev: "", wip: "", wipPrev: "", finishedGoods: "", finishedGoodsPrev: "", tradingGoods: "", tradingGoodsPrev: "", stores: "", storesPrev: "", looseTools: "", looseToolsPrev: "" },
  note16TradeReceivables: { items: [newTradeReceivable()], securedGood: "", securedGoodPrev: "", unsecuredGood: "", unsecuredGoodPrev: "", doubtful: "", doubtfulPrev: "" },
  note17Cash: { cashInHand: "", cashInHandPrev: "", bankCurrentAccount: "", bankCurrentAccountPrev: "", bankSavingsAccount: "", bankSavingsAccountPrev: "", fdDeposits: "", fdDepositsPrev: "" },
  note18STLoans: { advancesToSuppliers: "", advancesToSuppliersPrev: "", prepaidExpenses: "", prepaidExpensesPrev: "", items: [] },
  note18aOtherCA: { interestAccrued: "", interestAccruedPrev: "", tdsReceivable: "", tdsReceivablePrev: "", gstReceivable: "", gstReceivablePrev: "", items: [] },

  note19Revenue: { saleOfGoods: "", saleOfGoodsPrev: "", saleOfServices: "", saleOfServicesPrev: "", otherOperatingRevenue: "", otherOperatingRevenuePrev: "" },
  note20OtherIncome: [newSimpleItem("Interest Income"), newSimpleItem("Profit on Sale of Assets")],
  note21Materials: { openingStock: "", openingStockPrev: "", purchases: "", purchasesPrev: "", closingStock: "", closingStockPrev: "", directExpenses: "", directExpensesPrev: "" },
  note22EmployeeBenefits: { salariesWages: "", salariesWagesPrev: "", bonuses: "", bonusesPrev: "", pf: "", pfPrev: "", esi: "", esiPrev: "", gratuity: "", gratuityPrev: "", staffWelfare: "", staffWelfarePrev: "", items: [] },
  note23FinanceCosts: { interestOnBorrowings: "", interestOnBorrowingsPrev: "", bankCharges: "", bankChargesPrev: "", items: [] },
  note24Depreciation: { depOnTangibleAssets: "", depOnTangibleAssetsPrev: "", depOnIntangibleAssets: "", depOnIntangibleAssetsPrev: "", amortization: "", amortizationPrev: "" },
  note25OtherExpenses: [newSimpleItem("Rent"), newSimpleItem("Electricity & Water"), newSimpleItem("Repairs & Maintenance"), newSimpleItem("Office Expenses"), newSimpleItem("Communication Expenses"), newSimpleItem("Professional Fees"), newSimpleItem("Travelling & Conveyance"), newSimpleItem("Advertisement & Publicity"), newSimpleItem("Bad Debts Written Off"), newSimpleItem("Miscellaneous Expenses")],
  partnersRemuneration: [],
  incomeTaxProvision: "", incomeTaxProvisionPrev: "",
  deferredTaxCharge: "", deferredTaxChargePrev: "",
};
