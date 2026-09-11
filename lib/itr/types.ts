// ── ITR Form types ──────────────────────────────────────────────────────────
export type ITRForm = "ITR-1" | "ITR-2" | "ITR-3" | "ITR-4";
export type TaxRegime = "OLD" | "NEW";
export type ResidentialStatus = "RES" | "RNOR" | "NRI";

// ── Prefill JSON types (IT Portal schema) ────────────────────────────────────
export interface PrefillTDS {
  tan: string;
  employerOrDeductorOrCollecterName: string;
  sectionCode: string;
  grossAmount: number;
  headOfIncome: string;
  taxDeductedOwnHands: number;
  taxClaimedOwnHands: number;
}

export interface PrefillBankAccount {
  bankAccountNo: string;
  bankName: string;
  ifsccode: string;
  AccountType: string;
  useForRefund: string;
}

export interface PrefillCFL {
  AssessmentYear: string;
  DateOfFiling: string;
  LossFrmSpecBusCF: number;
  HpLossCF: number;
  StcgLossCF: number;
  LtcgLossCF: number;
  BroughtFrwrdBusLoss: number;
}

export interface PrefillData {
  pan: string;
  firstName: string;
  middleName: string;
  lastName: string;
  fatherName: string;
  dob: string;
  aadhaar: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  residentialStatus: ResidentialStatus;
  taxRegime: TaxRegime;
  tdsCredits: PrefillTDS[];
  bankAccounts: PrefillBankAccount[];
  dividendIncome: number;
  savingsInterest: number;
  sec80TTA: number;
  carryForwardLosses: PrefillCFL[];
  businessNatureCode: string;
  businessTradeName: string;
  wdvPlantMachinery40: number;
  // raw JSON for patch-and-export
  rawJson: Record<string, unknown>;
}

// ── Our clean ITR data ────────────────────────────────────────────────────────
export interface SalaryIncome {
  employerName: string;
  tan: string;
  grossSalary: string;
  standardDeduction: string;         // 75000 for AY 2026-27 new regime, 50000 old
  profTax: string;
  netSalary: string;
}

export interface HouseProperty {
  id: string;
  type: "SOP" | "LOP" | "DLOP";
  annualLetValue: string;
  municipalTax: string;
  netAnnualValue: string;
  interestOnLoan: string;
  netHPIncome: string;
}

export interface CapitalGain {
  id: string;
  type: "STCG111A" | "STCG15" | "LTCG10" | "LTCG20" | "STCG_OTHER" | "LTCG_OTHER";
  description: string;
  saleDate: string;
  purchaseDate: string;
  saleValue: string;
  purchaseValue: string;
  expenses: string;
  gain: string;
  indexedCost: string;
}

export interface BusinessIncome {
  // For ITR-4 (44AD/44ADA/44AE)
  schemeType: "44AD" | "44ADA" | "44AE" | "NORMAL";
  grossReceipts: string;
  presumptiveIncome: string;          // 44AD: 8%/6%, 44ADA: 50%
  actualIncome: string;               // for NORMAL
  // For ITR-3 - P&L summary
  netProfitAsPerPL: string;
  addbacks: string;
  disallowances: string;
  depreciation: string;
  profitFromBusiness: string;
  // WDV from previous year
  wdvOpeningPlantMachinery: string;
  additionsDuringYear: string;
  wdvClosingPlantMachinery: string;
  depForYear: string;
  firmName: string;
  natureCode: string;
  tradeName: string;
}

export interface OtherSourceIncome {
  savingsInterest: string;            // 80TTA eligible
  fdInterest: string;
  dividendIncome: string;
  familyPension: string;
  otherItems: { id: string; description: string; amount: string }[];
}

export interface DeductionVIA {
  sec80C: string;                     // LIC, PPF, ELSS, etc.
  sec80CCC: string;                   // Pension fund
  sec80CCD1: string;                  // NPS - Employee
  sec80CCD1B: string;                 // NPS - Additional 50k
  sec80CCD2: string;                  // NPS - Employer
  sec80D_self: string;                // Health insurance - self
  sec80D_parents: string;             // Health insurance - parents
  sec80DD: string;                    // Disabled dependent
  sec80DDB: string;                   // Medical treatment
  sec80E: string;                     // Education loan interest
  sec80EE: string;                    // Home loan interest (first home)
  sec80EEA: string;                   // Home loan interest (affordable)
  sec80G: string;                     // Donations
  sec80GG: string;                    // Rent paid (no HRA)
  sec80TTA: string;                   // Savings bank interest (< 10k)
  sec80TTB: string;                   // Senior citizen interest (< 50k)
  sec80U: string;                     // Disability
}

export interface TaxComputed {
  totalIncome: number;
  taxableIncome: number;
  basicTax: number;
  surcharge: number;
  healthEduCess: number;
  totalTaxLiability: number;
  tdsCredit: number;
  advanceTax: number;
  selfAssessmentTax: number;
  totalTaxPaid: number;
  refund: number;
  demand: number;
}

export interface AdvanceTax {
  id: string;
  bsrCode: string;
  srNo: string;
  date: string;
  amount: string;
  challanNo: string;
}

export interface ITRData {
  _id?: string;
  _companyId?: string;

  // Meta
  itrForm: ITRForm;
  assessmentYear: string;             // "2026-27"
  taxRegime: TaxRegime;
  residentialStatus: ResidentialStatus;
  hasPrefill: boolean;

  // Personal Info
  pan: string;
  firstName: string;
  middleName: string;
  lastName: string;
  fatherName: string;
  dob: string;
  aadhaar: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;

  // Filing details
  firmName: string;                   // CA firm / practitioner name
  natureCode: string;

  // Income
  salaries: SalaryIncome[];
  houseProperties: HouseProperty[];
  capitalGains: CapitalGain[];
  businessIncome: BusinessIncome;
  otherIncome: OtherSourceIncome;

  // Deductions
  deductions: DeductionVIA;

  // Tax payments
  tdsCredits: PrefillTDS[];           // from 26AS + manual
  advanceTaxPayments: AdvanceTax[];

  // Bank accounts
  bankAccounts: PrefillBankAccount[];
  refundBankIFSC: string;
  refundBankAccount: string;

  // Carry forward losses
  carryForwardLosses: PrefillCFL[];

  // Prefill raw JSON (for patch-export)
  prefillRawJson?: Record<string, unknown>;

  // Computed (not stored, recomputed on load)
  computed?: TaxComputed;
}

export const INITIAL_ITR_DATA: ITRData = {
  itrForm: "ITR-3",
  assessmentYear: "2026-27",
  taxRegime: "NEW",
  residentialStatus: "RES",
  hasPrefill: false,
  pan: "", firstName: "", middleName: "", lastName: "", fatherName: "",
  dob: "", aadhaar: "", mobile: "", email: "",
  address: "", city: "", state: "", pinCode: "",
  firmName: "", natureCode: "",
  salaries: [],
  houseProperties: [],
  capitalGains: [],
  businessIncome: {
    schemeType: "44ADA", grossReceipts: "", presumptiveIncome: "",
    actualIncome: "", netProfitAsPerPL: "", addbacks: "", disallowances: "",
    depreciation: "", profitFromBusiness: "", firmName: "",
    wdvOpeningPlantMachinery: "", additionsDuringYear: "", wdvClosingPlantMachinery: "",
    depForYear: "", natureCode: "", tradeName: "",
  },
  otherIncome: {
    savingsInterest: "", fdInterest: "", dividendIncome: "",
    familyPension: "", otherItems: [],
  },
  deductions: {
    sec80C: "", sec80CCC: "", sec80CCD1: "", sec80CCD1B: "", sec80CCD2: "",
    sec80D_self: "", sec80D_parents: "", sec80DD: "", sec80DDB: "",
    sec80E: "", sec80EE: "", sec80EEA: "", sec80G: "", sec80GG: "",
    sec80TTA: "", sec80TTB: "", sec80U: "",
  },
  tdsCredits: [],
  advanceTaxPayments: [],
  bankAccounts: [],
  refundBankIFSC: "", refundBankAccount: "",
  carryForwardLosses: [],
};

// ── Prefill parser ───────────────────────────────────────────────────────────

interface RawPrefillJson {
  personalInfo?: {
    assesseeName?: { firstName?: string; middleName?: string; surNameOrOrgName?: string };
    assesseeVerName?: string;
    assesseVerPAN?: string;
    pan?: string;
    dob?: string;
    fatherName?: string;
    aadhaarCardNo?: string;
    address?: {
      mobileNo?: number;
      emailAddress?: string;
      residenceNo?: string;
      roadOrStreet?: string;
      localityOrArea?: string;
      cityOrTownOrDistrict?: string;
      stateCode?: string;
      pinCode?: number;
    };
    filingStatus?: { residentialStatus?: string };
  };
  filingStatus?: { OptingNewTaxRegimeForm10IF?: number };
  form24q?: { usrDeductUndChapVIAType?: { section80TTA?: number } };
  form26as?: {
    tdsOnOthThanSals?: {
      tdSonOthThanSal?: Array<{
        taxDeductCreditDtls?: { taxDeductedOwnHands?: number; taxClaimedOwnHands?: number };
        sectionCode?: string;
        grossAmount?: number;
        headOfIncome?: string;
        employerOrDeductorOrCollectDetl?: { tan?: string; employerOrDeductorOrCollecterName?: string };
      }>;
    };
    scheduleOS?: { incOthThanOwnRaceHorse?: { dividendGross?: number } };
    persumptiveInc44ADA?: { grsReceipt?: number };
  };
  insights?: {
    intrstFrmSavingBank?: number;
    scheduleOS?: { incOthThanOwnRaceHorse?: { dividendGross?: number } };
  };
  bankAccountDtls?: Array<{
    addtnlBankDetails?: Array<{
      bankAccountNo?: string;
      bankName?: string;
      ifsccode?: string;
      AccountType?: string;
      useForRefund?: string;
    }>;
  }>;
  scheduleCFL?: {
    CarryFwdLossDetail?: Array<{
      AssessmentYear?: string;
      DateOfFiling?: string;
      LossFrmSpecBusCF?: number;
      HpLossCF?: number;
      StcgLossCF?: number;
      LtcgLossCF?: number;
      BroughtFrwrdBusLoss?: number;
    }>;
  };
  lastFiledITR?: {
    natOfBus?: { NatureOfBusiness?: Array<{ TradeName1?: string; Code?: string }> };
    scheduleDPM?: {
      PlantMachinery?: {
        Rate40?: { DepreciationDetail?: { WdvfirstDay?: number } };
      };
    };
  };
}

export function parsePrefill(raw: Record<string, unknown>): PrefillData {
  const j = raw as RawPrefillJson;
  const pi = j.personalInfo;
  const addr = pi?.address;

  const firstName = pi?.assesseeName?.firstName ?? "";
  const middleName = pi?.assesseeName?.middleName ?? "";
  const lastName = pi?.assesseeName?.surNameOrOrgName ?? "";
  const pan = pi?.assesseVerPAN ?? pi?.pan ?? "";

  // Decode Aadhaar from base64
  let aadhaar = "";
  if (pi?.aadhaarCardNo) {
    try { aadhaar = atob(pi.aadhaarCardNo); } catch { aadhaar = pi.aadhaarCardNo; }
  }

  // Tax regime: 2 = new, 1 = old
  const regimeNum = j.filingStatus?.OptingNewTaxRegimeForm10IF ?? 1;
  const taxRegime: TaxRegime = regimeNum === 2 ? "NEW" : "OLD";

  // TDS credits from 26AS
  const tdsCredits: PrefillTDS[] = (j.form26as?.tdsOnOthThanSals?.tdSonOthThanSal ?? []).map(t => ({
    tan: t.employerOrDeductorOrCollectDetl?.tan ?? "",
    employerOrDeductorOrCollecterName: t.employerOrDeductorOrCollectDetl?.employerOrDeductorOrCollecterName ?? "",
    sectionCode: t.sectionCode ?? "",
    grossAmount: t.grossAmount ?? 0,
    headOfIncome: t.headOfIncome ?? "",
    taxDeductedOwnHands: t.taxDeductCreditDtls?.taxDeductedOwnHands ?? 0,
    taxClaimedOwnHands: t.taxDeductCreditDtls?.taxClaimedOwnHands ?? 0,
  }));

  // Bank accounts
  const bankAccounts: PrefillBankAccount[] = (j.bankAccountDtls?.[0]?.addtnlBankDetails ?? []).map(b => ({
    bankAccountNo: b.bankAccountNo ?? "",
    bankName: b.bankName ?? "",
    ifsccode: b.ifsccode ?? "",
    AccountType: b.AccountType ?? "SB",
    useForRefund: b.useForRefund ?? "false",
  }));

  // Carry forward losses (only non-zero)
  const carryForwardLosses: PrefillCFL[] = (j.scheduleCFL?.CarryFwdLossDetail ?? [])
    .filter(c => (c.LossFrmSpecBusCF ?? 0) + (c.HpLossCF ?? 0) + (c.StcgLossCF ?? 0) + (c.LtcgLossCF ?? 0) + (c.BroughtFrwrdBusLoss ?? 0) > 0)
    .map(c => ({
      AssessmentYear: c.AssessmentYear ?? "",
      DateOfFiling: c.DateOfFiling ?? "",
      LossFrmSpecBusCF: c.LossFrmSpecBusCF ?? 0,
      HpLossCF: c.HpLossCF ?? 0,
      StcgLossCF: c.StcgLossCF ?? 0,
      LtcgLossCF: c.LtcgLossCF ?? 0,
      BroughtFrwrdBusLoss: c.BroughtFrwrdBusLoss ?? 0,
    }));

  // Business nature
  const busNature = j.lastFiledITR?.natOfBus?.NatureOfBusiness?.[0];
  const wdv40 = j.lastFiledITR?.scheduleDPM?.PlantMachinery?.Rate40?.DepreciationDetail?.WdvfirstDay ?? 0;

  // Income from other sources
  const dividendIncome = j.insights?.scheduleOS?.incOthThanOwnRaceHorse?.dividendGross ??
    j.form26as?.scheduleOS?.incOthThanOwnRaceHorse?.dividendGross ?? 0;
  const savingsInterest = j.insights?.intrstFrmSavingBank ?? 0;
  const sec80TTA = j.form24q?.usrDeductUndChapVIAType?.section80TTA ?? 0;

  return {
    pan, firstName, middleName, lastName,
    fatherName: pi?.fatherName ?? "",
    dob: pi?.dob ?? "",
    aadhaar,
    mobile: String(addr?.mobileNo ?? ""),
    email: addr?.emailAddress ?? "",
    address: [addr?.residenceNo, addr?.roadOrStreet].filter(Boolean).join(", "),
    city: addr?.cityOrTownOrDistrict ?? "",
    state: String(addr?.stateCode ?? ""),
    pinCode: String(addr?.pinCode ?? ""),
    residentialStatus: (pi?.filingStatus?.residentialStatus as ResidentialStatus) ?? "RES",
    taxRegime,
    tdsCredits,
    bankAccounts,
    dividendIncome,
    savingsInterest,
    sec80TTA,
    carryForwardLosses,
    businessNatureCode: busNature?.Code ?? "",
    businessTradeName: busNature?.TradeName1 ?? "",
    wdvPlantMachinery40: wdv40,
    rawJson: raw,
  };
}

// ── Tax computation ──────────────────────────────────────────────────────────

const OLD_SLABS = [250000, 500000, 1000000];
const OLD_RATES = [0, 0.05, 0.20, 0.30];
const NEW_SLABS_26 = [400000, 800000, 1200000, 1600000, 2000000, 2400000];
const NEW_RATES_26 = [0, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30];

function computeSlabTax(income: number, slabs: number[], rates: number[]): number {
  let tax = 0;
  let prev = 0;
  for (let i = 0; i < slabs.length; i++) {
    if (income <= slabs[i]) { tax += (income - prev) * rates[i]; return tax; }
    tax += (slabs[i] - prev) * rates[i];
    prev = slabs[i];
  }
  tax += (income - prev) * rates[rates.length - 1];
  return tax;
}

export function computeTax(data: ITRData): TaxComputed {
  const n = (v: string) => parseFloat(v) || 0;

  // Total income
  const salaryNet = data.salaries.reduce((s, x) => s + n(x.netSalary), 0);
  const hpIncome = data.houseProperties.reduce((s, x) => s + n(x.netHPIncome), 0);
  const cgIncome = data.capitalGains.reduce((s, x) => s + n(x.gain), 0);
  const busIncome = data.businessIncome.schemeType === "44ADA"
    ? Math.max(0, n(data.businessIncome.grossReceipts) * 0.5)
    : data.businessIncome.schemeType === "44AD"
    ? Math.max(0, n(data.businessIncome.grossReceipts) * 0.08)
    : n(data.businessIncome.profitFromBusiness);

  const osIncome = n(data.otherIncome.savingsInterest) + n(data.otherIncome.fdInterest) +
    n(data.otherIncome.dividendIncome) + n(data.otherIncome.familyPension) +
    data.otherIncome.otherItems.reduce((s, x) => s + n(x.amount), 0);

  const grossTotal = salaryNet + hpIncome + cgIncome + busIncome + osIncome;

  // Deductions (capped at 1.5L for 80C family)
  let dedTotal = 0;
  if (data.taxRegime === "OLD") {
    const sec80CFamily = Math.min(150000,
      n(data.deductions.sec80C) + n(data.deductions.sec80CCC) + n(data.deductions.sec80CCD1));
    const nps = n(data.deductions.sec80CCD1B);
    const health = n(data.deductions.sec80D_self) + n(data.deductions.sec80D_parents);
    const interest = n(data.deductions.sec80E) + n(data.deductions.sec80EE) + n(data.deductions.sec80EEA);
    const tta = Math.min(10000, n(data.deductions.sec80TTA));
    const others = n(data.deductions.sec80G) + n(data.deductions.sec80GG) + n(data.deductions.sec80U);
    dedTotal = sec80CFamily + nps + health + interest + tta + others;
  }
  // New regime: only 80CCD2 (employer NPS) and 80CCD1B
  if (data.taxRegime === "NEW") {
    dedTotal = n(data.deductions.sec80CCD2) + n(data.deductions.sec80CCD1B);
  }

  const taxableIncome = Math.max(0, grossTotal - dedTotal);

  // Basic tax
  let basicTax = 0;
  if (data.taxRegime === "NEW") {
    // AY 2026-27 new regime slabs
    if (taxableIncome <= 1200000) basicTax = 0; // Rebate 87A available
    else basicTax = computeSlabTax(taxableIncome, NEW_SLABS_26, NEW_RATES_26);
  } else {
    basicTax = computeSlabTax(taxableIncome, OLD_SLABS, OLD_RATES);
    // Rebate 87A old regime: if income <= 5L, tax = 0
    if (taxableIncome <= 500000) basicTax = 0;
  }

  const surcharge = taxableIncome > 5000000 ? basicTax * 0.10 :
    taxableIncome > 10000000 ? basicTax * 0.15 : 0;
  const healthEduCess = Math.round((basicTax + surcharge) * 0.04);
  const totalTaxLiability = Math.round(basicTax + surcharge + healthEduCess);

  const tdsCredit = data.tdsCredits.reduce((s, t) => s + t.taxClaimedOwnHands, 0);
  const advanceTax = data.advanceTaxPayments.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
  const totalTaxPaid = tdsCredit + advanceTax;
  const refund = Math.max(0, totalTaxPaid - totalTaxLiability);
  const demand = Math.max(0, totalTaxLiability - totalTaxPaid);

  return {
    totalIncome: Math.round(grossTotal),
    taxableIncome: Math.round(taxableIncome),
    basicTax: Math.round(basicTax),
    surcharge: Math.round(surcharge),
    healthEduCess,
    totalTaxLiability,
    tdsCredit,
    advanceTax,
    selfAssessmentTax: 0,
    totalTaxPaid,
    refund,
    demand,
  };
}

// Section code → description
export const SECTION_LABELS: Record<string, string> = {
  "192A": "Salary",
  "4JA": "Professional/Technical Services (194J)",
  "4JB": "Professional Services (194JB)",
  "4J": "Professional Fees (194J)",
  "94A": "Interest other than securities (194A)",
  "94C": "Contractor payments (194C)",
  "4DB": "Dividend (194K)",
  "4Q": "Rent (194I)",
  "4R": "Commission (194H)",
  "94N": "Cash withdrawal (194N)",
  "206C": "TCS",
};

export const STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
  "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan",
  "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
  "13": "Nagaland", "14": "Manipur", "15": "Mizoram", "16": "Tripura",
  "17": "Meghalaya", "18": "Assam", "19": "West Bengal", "20": "Jharkhand",
  "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
  "25": "Daman & Diu", "26": "Dadra & Nagar Haveli", "27": "Maharashtra",
  "28": "Andhra Pradesh", "29": "Karnataka", "30": "Goa", "31": "Lakshadweep",
  "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman & Nicobar",
  "36": "Telangana", "37": "Andhra Pradesh (New)", "99": "Foreign",
};
