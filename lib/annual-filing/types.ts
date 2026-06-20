/**
 * Annual Filing Attachments Generator — Core Types
 * FY 2024-25 | Companies Act 2013
 */

// ── Company Type ──────────────────────────────────────────────────────────────

export type CompanyType = "opc" | "private_small" | "section8" | "fpc";

export type FinancialYear = "2024-25" | "2025-26";

// ── Financial Data ────────────────────────────────────────────────────────────

export interface FinancialFigures {
  // Income
  revenueFromOperations: string;
  otherIncome: string;
  totalIncome: string;
  // Expenses
  totalExpenses: string;
  // Profit
  profitBeforeTax: string;
  currentTax: string;
  deferredTax: string;
  profitAfterTax: string;
  // Balance Sheet
  authorisedCapital: string;
  paidUpCapital: string;
  reservesAndSurplus: string;
  totalAssets: string;
  totalLiabilities: string;
  netWorth: string;
  // Prior year comparatives
  prevRevenueFromOperations: string;
  prevOtherIncome: string;
  prevTotalIncome: string;
  prevTotalExpenses: string;
  prevProfitBeforeTax: string;
  prevCurrentTax: string;
  prevDeferredTax: string;
  prevProfitAfterTax: string;
  prevAuthorisedCapital: string;
  prevPaidUpCapital: string;
  prevReservesAndSurplus: string;
  prevTotalAssets: string;
  prevTotalLiabilities: string;
  prevNetWorth: string;
}

// ── Auditor ───────────────────────────────────────────────────────────────────

export interface AuditorDetails {
  firmType: "firm" | "proprietorship" | "partnership";
  firmName: string;
  frn: string;           // Firm Registration Number — optional for Proprietorship
  partnerName: string;
  membershipNo: string;  // ICAI membership number
  udin: string;
  place: string;         // Place of signing
  reportDate: string;    // YYYY-MM-DD
}

// ── Board Meetings ────────────────────────────────────────────────────────────

export interface BoardMeeting {
  serialNo: number;
  date: string;          // YYYY-MM-DD
  directorsPresent: string[];
}

// ── Director ─────────────────────────────────────────────────────────────────

export interface DirectorRecord {
  din: string;
  name: string;
  designation: string;   // "Managing Director" | "Director" | "Whole Time Director" | "Independent Director" | "Nominee Director"
  category: string;      // "Executive" | "Non-Executive" | "Independent" | "Nominee"
  dateOfAppointment: string;
  dateOfCessation?: string;
  pan?: string;
  isActive: boolean;
  changedDuringYear: boolean;
  changeType?: "appointed" | "resigned" | "ceased";
  // Extended KYC fields (from csi_persons)
  nationality?: string;
  fatherName?: string;
  dateOfBirth?: string;
  occupation?: string;
  email?: string;
  sharesHeld?: number;
  address?: string;
  _personId?: string | null;  // csi_persons.id — null means not yet saved
}

// ── Shareholder ───────────────────────────────────────────────────────────────

export interface ShareholderRecord {
  folioNo: string;
  name: string;
  address?: string;
  type: "resident_individual" | "nri" | "body_corporate" | "huf" | "trust" | "government";
  sharesHeld: number;
  percentHolding: string;
  pan?: string;
  changedDuringYear?: boolean;
}

// ── Subsidiary (for AOC-1) ────────────────────────────────────────────────────

export interface SubsidiaryRecord {
  name: string;
  cin?: string;
  country: string;
  currency: string;
  exchangeRate?: string;
  shareCapital: string;
  reservesSurplus: string;
  totalAssets: string;
  totalLiabilities: string;
  investments: string;
  turnover: string;
  profitBeforeTax: string;
  provisionForTax: string;
  profitAfterTax: string;
  proposedDividend: string;
  percentShareholding: string;
  reportingPeriod?: string;  // if different from holding company
  type: "subsidiary" | "associate" | "joint_venture";
}

// ── Related Party Transaction (for AOC-2) ─────────────────────────────────────

export interface RelatedPartyTransaction {
  id: string;
  relatedPartyName: string;
  cin?: string;          // CIN / LLPIN / PAN as applicable
  relationship: string;  // e.g. "Director", "Relative of Director", "Subsidiary"
  natureOfTransaction: string;
  duration: string;
  salientTerms: string;
  justification?: string;  // for non-arm's-length only
  amount: string;
  approvalDate?: string;
  boardApprovalDate?: string;
  isArmLength: boolean;
  isMaterial: boolean;
}

// ── Full Filing Form Data ──────────────────────────────────────────────────────

export interface AnnualFilingData {
  // ── Step 1: Company & FY ────────────────────
  companyName: string;
  cin: string;
  pan: string;
  regAddress: string;
  entityType: string;        // raw entityType from MCA data
  companyType: CompanyType;  // derived
  financialYear: FinancialYear;
  fyStart: string;           // "01/04/2024"
  fyEnd: string;             // "31/03/2025"
  rocName: string;
  incorporationDate: string;
  stateOfIncorporation: string;
  businessDescription: string;
  principalActivity: string;

  // ── Step 2: Auditor Details ─────────────────
  auditor: AuditorDetails;

  // ── Step 3: Financial Figures ───────────────
  financials: FinancialFigures;

  // ── Step 4: Board & Compliance ──────────────
  boardMeetings: BoardMeeting[];
  hasSubsidiaries: boolean;
  hasRPT: boolean;            // Related Party Transactions not at arm's length or material
  hasDeposits: boolean;       // Accepted deposits from public
  hasLoansGiven: boolean;     // Loans/investments under Sec. 186
  fraudReported: boolean;     // Auditor reported fraud under Sec. 143(12)
  fraudDetails?: string;
  auditQualification: boolean;  // Qualified/adverse/disclaimer opinion
  auditQualificationExplanation?: string;
  materialChangesAfterFY: boolean;
  materialChangesDetails?: string;
  significantOrders: boolean;   // Significant orders by regulators/courts
  significantOrdersDetails?: string;
  annualReturnWebLink?: string;  // Website link for annual return (Sec. 92(3))
  stateOfAffairs: string;        // Company's state of affairs narrative
  capitalChanges?: string;       // Changes in authorised/paid-up capital during year
  // Section 8 / FPC specific
  csrApplicable?: boolean;
  csrDetails?: string;
  energyConservationDetails?: string;
  technologyAbsorptionDetails?: string;
  foreignExchangeEarnings?: string;
  foreignExchangeOutgo?: string;
  riskManagementDetails?: string;

  // ── Company Contact (for MGT-7 CTC) ────────
  companyEmail?: string;
  companyPhone?: string;

  // ── MGT-7/7A CTC Board Resolution ──────────
  mgt7MeetingTime?: string;   // e.g. "11.00 A.M."
  mgt7MeetingVenue?: string;  // e.g. "Registered Office of the Company"

  // ── Step 5: Directors ───────────────────────
  directors: DirectorRecord[];
  signatoryDirectors: {
    director1: { name: string; din: string; designation: string };
    director2?: { name: string; din: string; designation: string };
  };
  placeOfSigning: string;
  dateOfReport: string;   // YYYY-MM-DD

  // ── Step 6: Shareholders ────────────────────
  shareholders: ShareholderRecord[];
  totalShares: number;
  nominalValuePerShare: string;  // e.g. "10"

  // ── Step 7: Conditional ─────────────────────
  subsidiaries?: SubsidiaryRecord[];
  relatedPartyTransactions?: RelatedPartyTransaction[];
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export const BLANK_FINANCIALS: FinancialFigures = {
  revenueFromOperations: "",
  otherIncome: "",
  totalIncome: "",
  totalExpenses: "",
  profitBeforeTax: "",
  currentTax: "",
  deferredTax: "",
  profitAfterTax: "",
  authorisedCapital: "",
  paidUpCapital: "",
  reservesAndSurplus: "",
  totalAssets: "",
  totalLiabilities: "",
  netWorth: "",
  prevRevenueFromOperations: "",
  prevOtherIncome: "",
  prevTotalIncome: "",
  prevTotalExpenses: "",
  prevProfitBeforeTax: "",
  prevCurrentTax: "",
  prevDeferredTax: "",
  prevProfitAfterTax: "",
  prevAuthorisedCapital: "",
  prevPaidUpCapital: "",
  prevReservesAndSurplus: "",
  prevTotalAssets: "",
  prevTotalLiabilities: "",
  prevNetWorth: "",
};

export const BLANK_AUDITOR: AuditorDetails = {
  firmType: "firm",
  firmName: "",
  frn: "",
  partnerName: "",
  membershipNo: "",
  udin: "",
  place: "",
  reportDate: "",
};

export const INITIAL_FILING_DATA: AnnualFilingData = {
  companyName: "",
  cin: "",
  pan: "",
  regAddress: "",
  entityType: "",
  companyType: "private_small",
  financialYear: "2024-25",
  fyStart: "01/04/2024",
  fyEnd: "31/03/2025",
  rocName: "",
  incorporationDate: "",
  stateOfIncorporation: "",
  businessDescription: "",
  principalActivity: "",
  auditor: BLANK_AUDITOR,
  financials: BLANK_FINANCIALS,
  boardMeetings: [],
  hasSubsidiaries: false,
  hasRPT: false,
  hasDeposits: false,
  hasLoansGiven: false,
  fraudReported: false,
  auditQualification: false,
  materialChangesAfterFY: false,
  significantOrders: false,
  stateOfAffairs: "",
  directors: [],
  signatoryDirectors: {
    director1: { name: "", din: "", designation: "" },
  },
  placeOfSigning: "",
  dateOfReport: "",
  shareholders: [],
  totalShares: 0,
  nominalValuePerShare: "10",
};
