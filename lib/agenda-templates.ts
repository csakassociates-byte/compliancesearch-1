/* ══════════════════════════════════════════════════════════════════
   MASTER LIST OF AGENDA TEMPLATES — Board Meeting Minutes
   Source: Master List of Common Agenda Items (14 categories, 117 items)
══════════════════════════════════════════════════════════════════ */

export type ResolutionType = "ordinary" | "special" | "none";

export interface AgendaField {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "date" | "number" | "textarea";
}

export interface AgendaTemplate {
  id: string;
  title: string;
  icon: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  fields: AgendaField[];
  discussion: string;
  resolution: string;
  resolutionType: ResolutionType;
  /** Legal basis for resolution type — shown in UI so users know it's law-mandated */
  resolutionLaw?: string;
}

// ── Helper to fill template placeholders ────────────────────────
export function fillTemplate(template: string, fields: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => fields[key] || `[${key.toUpperCase()}]`);
}

// ── Generic resolution authorisation line ───────────────────────
const AUTH = `\n\nRESOLVED FURTHER THAT any Director / Company Secretary of the Company be and is hereby authorised to do all such acts, deeds and things as may be necessary to give effect to the above Resolution.`;

// ── Standard noting discussion ───────────────────────────────────
function noting(what: string): string {
  return `The Chairman placed before the Board ${what}. The Board, after deliberation, took note of the same.`;
}

function approving(what: string, extraDetail = ""): string {
  return `The Chairman informed the Board about ${what}.${extraDetail ? " " + extraDetail : ""} The Board, after detailed discussion, unanimously approved the same.`;
}

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 1 — ROUTINE BOARD MEETING MATTERS
══════════════════════════════════════════════════════════════════ */
const ROUTINE: AgendaTemplate[] = [
  {
    id: "elect_chairman",
    title: "Election of Chairman of the Meeting",
    icon: "👑", category: "routine", categoryLabel: "Routine Matters", categoryIcon: "🔄",
    fields: [],
    discussion: `As per Section 104 of the Companies Act, 2013 read with Secretarial Standard-1 (SS-1), the Board proceeded to elect the Chairman for presiding over the meeting. The Chairman took the Chair and called the meeting to order. The Chairman welcomed all the Directors and informed the Board that the requisite Notice along with the Agenda for the meeting had been circulated to all Directors in advance.`,
    resolution: "", resolutionType: "none",
  },
  {
    id: "ascertain_quorum",
    title: "Ascertainment of Quorum",
    icon: "🔢", category: "routine", categoryLabel: "Routine Matters", categoryIcon: "🔄",
    fields: [],
    discussion: noting("that the requisite quorum as required under Section 174 of the Companies Act, 2013 read with Secretarial Standard-1 (SS-1) was present at the commencement of the meeting. The meeting was duly constituted and the proceedings commenced"),
    resolution: "", resolutionType: "none",
  },
  {
    id: "leave_of_absence",
    title: "Grant of Leave of Absence to Directors",
    icon: "📩", category: "routine", categoryLabel: "Routine Matters", categoryIcon: "🔄",
    fields: [],
    discussion: `The Chairman informed the Board that leave of absence had been sought by the Directors who were not present at the meeting. The Board considered the requests and granted leave of absence to those Directors who had communicated their inability to attend the meeting in advance.`,
    resolution: "", resolutionType: "none",
  },
  {
    id: "note_attendance",
    title: "Noting of Attendance of Directors",
    icon: "📝", category: "routine", categoryLabel: "Routine Matters", categoryIcon: "🔄",
    fields: [],
    discussion: `The Chairman noted the attendance of the Directors present at the meeting. The Attendance Register was placed before the Board and the Directors present appended their signatures in the Register as required under Section 118 of the Companies Act, 2013 read with Secretarial Standard-1.`,
    resolution: "", resolutionType: "none",
  },
  {
    id: "prev_minutes",
    title: "Confirmation of Previous Meeting Minutes",
    icon: "📄", category: "routine", categoryLabel: "Routine Matters", categoryIcon: "🔄",
    fields: [
      { key: "prevMeetingNo", label: "Previous Meeting No.", placeholder: "e.g. 4/2024-25" },
      { key: "prevMeetingDate", label: "Date of Previous Meeting", placeholder: "e.g. 15 March 2025", type: "date" },
    ],
    discussion: `The Chairman informed the Board that the Minutes of the {prevMeetingNo} Meeting of the Board of Directors held on {prevMeetingDate} were circulated to all the Directors. The same were read and confirmed.`,
    resolution: "", resolutionType: "none",
  },
  {
    id: "action_taken_report",
    title: "Action Taken Report on Previous Decisions",
    icon: "✅", category: "routine", categoryLabel: "Routine Matters", categoryIcon: "🔄",
    fields: [],
    discussion: noting("the Action Taken Report (ATR) on the decisions taken at the previous Board Meeting. All actions had been duly carried out as per the directions of the Board"),
    resolution: "", resolutionType: "none",
  },
  {
    id: "disclosure_interest",
    title: "Disclosure of Interest by Directors (MBP-1 / DIR-8)",
    icon: "📢", category: "routine", categoryLabel: "Routine Matters", categoryIcon: "🔄",
    fields: [],
    discussion: `The Chairman informed the Board that disclosures of interest under Section 184 of the Companies Act, 2013 in Form MBP-1, and declarations under Section 164(2) in Form DIR-8, have been received from the Directors. The Board took note of the same. The disclosures are placed before the Board and shall be entered in the Register of Contracts.`,
    resolution: "", resolutionType: "none",
  },
  {
    id: "business_review",
    title: "Business Review and Performance Update",
    icon: "📈", category: "routine", categoryLabel: "Routine Matters", categoryIcon: "🔄",
    fields: [
      { key: "period", label: "Review Period", placeholder: "e.g. Q1 FY 2025-26 / April–June 2025" },
      { key: "highlights", label: "Key Business Highlights", placeholder: "e.g. revenue growth, new orders, operational updates, market developments" },
    ],
    discussion: `The Chairman presented to the Board a comprehensive review of the business performance for the period {period}. Key highlights discussed included {highlights}. The Board reviewed the operational and financial performance of the Company, deliberated on the challenges faced and opportunities ahead, and provided strategic direction to the management. The Board expressed satisfaction with the overall progress and advised the management to continue focused efforts toward achieving the Company's business objectives and sustainable growth.`,
    resolution: "", resolutionType: "none",
  },
  {
    id: "any_other_business",
    title: "Any Other Business (with permission of Chair)",
    icon: "📌", category: "routine", categoryLabel: "Routine Matters", categoryIcon: "🔄",
    fields: [],
    discussion: `The Chairman asked if there was any other business to be transacted with the permission of the Chair. There being no other business to transact, the Chairman thanked all present for their valuable contribution and declared the meeting concluded.`,
    resolution: "", resolutionType: "none",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 2 — FINANCIAL, BANKING AND BORROWING MATTERS
══════════════════════════════════════════════════════════════════ */
const FINANCIAL: AgendaTemplate[] = [
  {
    id: "bank_account",
    title: "Opening of Bank Account",
    icon: "🏦", category: "financial", categoryLabel: "Financial & Banking", categoryIcon: "💰",
    fields: [
      { key: "bankName", label: "Bank Name", placeholder: "e.g. State Bank of India" },
      { key: "branchName", label: "Branch & City", placeholder: "e.g. Andheri East, Mumbai" },
      { key: "accountType", label: "Account Type", placeholder: "e.g. Current Account" },
      { key: "signatoryNames", label: "Authorised Signatory(ies)", placeholder: "e.g. Mr. Rahul Sharma, Managing Director" },
      { key: "operationMode", label: "Mode of Operation", placeholder: "e.g. Severally / Jointly" },
    ],
    discussion: `The Chairman informed the Board about the requirement of opening a {accountType} with {bankName}, {branchName} for the smooth business operations of the Company. After deliberation, the Board unanimously agreed to open the said account.`,
    resolution: `RESOLVED THAT pursuant to Section 179(3)(d) of the Companies Act, 2013 read with Rule 8 of the Companies (Meetings of Board and its Powers) Rules, 2014, consent of the Board be and is hereby accorded to open a {accountType} in the name of the Company with {bankName}, {branchName}.\n\nRESOLVED FURTHER THAT {signatoryNames} be and is/are hereby authorised to operate the said Bank Account {operationMode} on behalf of the Company.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "change_signatory",
    title: "Change / Update Authorised Bank Signatories",
    icon: "🔄", category: "financial", categoryLabel: "Financial & Banking", categoryIcon: "💰",
    fields: [
      { key: "bankName", label: "Bank Name", placeholder: "e.g. HDFC Bank Ltd." },
      { key: "accountNo", label: "Account No. (last 4 digits)", placeholder: "e.g. XXXX1234" },
      { key: "removedSignatory", label: "Removed Signatory (if any)", placeholder: "e.g. Mr. Ramesh Kumar" },
      { key: "newSignatory", label: "New Authorised Signatory", placeholder: "e.g. Ms. Priya Sharma, CFO" },
      { key: "operationMode", label: "Mode of Operation", placeholder: "e.g. Severally" },
    ],
    discussion: approving(`a change in authorised signatories for the Company's bank account with {bankName} (A/c No. {accountNo})`),
    resolution: `RESOLVED THAT the existing authorisation granted to {removedSignatory} to operate the bank account of the Company with {bankName} (A/c No. {accountNo}) be and is hereby revoked.\n\nRESOLVED FURTHER THAT {newSignatory} be and is hereby authorised to operate the said bank account {operationMode} on behalf of the Company.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "banking_limits",
    title: "Approval of Banking Operations and Banking Limits",
    icon: "🏧", category: "financial", categoryLabel: "Financial & Banking", categoryIcon: "💰",
    fields: [
      { key: "bankName", label: "Bank Name", placeholder: "e.g. Punjab National Bank" },
      { key: "limitAmount", label: "Limit Amount", placeholder: "e.g. ₹2,00,00,000" },
      { key: "facilityType", label: "Type of Facility", placeholder: "e.g. Cash Credit / OD / Working Capital" },
    ],
    discussion: approving(`approval of banking limits with {bankName} for a {facilityType} facility of {limitAmount}`),
    resolution: `RESOLVED THAT the Board of Directors be and is hereby accorded to avail banking limits / {facilityType} facility from {bankName} up to an amount of {limitAmount} on such terms and conditions as may be negotiated and agreed upon.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "loan_sanction",
    title: "Acceptance of Loan / Credit Facility",
    icon: "💵", category: "financial", categoryLabel: "Financial & Banking", categoryIcon: "💰",
    fields: [
      { key: "lenderName", label: "Lender / Bank Name", placeholder: "e.g. HDFC Bank Ltd." },
      { key: "loanAmount", label: "Loan Amount", placeholder: "e.g. ₹50,00,000" },
      { key: "purpose", label: "Purpose", placeholder: "e.g. working capital requirements" },
      { key: "interestRate", label: "Rate of Interest", placeholder: "e.g. 12% p.a." },
      { key: "tenure", label: "Tenure", placeholder: "e.g. 3 years" },
    ],
    discussion: approving(`a proposal to avail a loan / credit facility from {lenderName} amounting to {loanAmount} for the purpose of {purpose}`),
    resolution: `RESOLVED THAT pursuant to Section 179(3)(d) and other applicable provisions of the Companies Act, 2013, consent of the Board be and is hereby accorded to borrow {loanAmount} from {lenderName} at {interestRate} for a tenure of {tenure} for the purpose of {purpose}.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "loan_documents",
    title: "Approval of Execution of Loan Documents",
    icon: "📝", category: "financial", categoryLabel: "Financial & Banking", categoryIcon: "💰",
    fields: [
      { key: "lenderName", label: "Lender Name", placeholder: "e.g. HDFC Bank Ltd." },
      { key: "loanAmount", label: "Loan Amount", placeholder: "e.g. ₹50,00,000" },
      { key: "authorisedPerson", label: "Authorised Signatory", placeholder: "e.g. Managing Director" },
    ],
    discussion: approving(`execution of loan/financing documents with {lenderName} for the sanctioned amount of {loanAmount}`),
    resolution: `RESOLVED THAT the {authorisedPerson} of the Company be and is hereby authorised to execute all loan documents, agreements, mortgages, deeds of hypothecation and any other documents as may be required in connection with the loan/facility sanctioned by {lenderName} for {loanAmount}, on behalf of the Company.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "charge_creation",
    title: "Creation / Modification / Satisfaction of Charge",
    icon: "⚖️", category: "financial", categoryLabel: "Financial & Banking", categoryIcon: "💰",
    fields: [
      { key: "chargeType", label: "Type", placeholder: "e.g. Creation / Modification / Satisfaction" },
      { key: "chargeHolder", label: "Charge Holder", placeholder: "e.g. State Bank of India" },
      { key: "chargeAmount", label: "Charge Amount", placeholder: "e.g. ₹1,00,00,000" },
      { key: "securedAssets", label: "Assets Secured", placeholder: "e.g. all moveable and immoveable assets" },
    ],
    discussion: approving(`{chargeType} of charge in favour of {chargeHolder} for an amount of {chargeAmount} on {securedAssets} of the Company`),
    resolution: `RESOLVED THAT pursuant to Section 77/79/82 of the Companies Act, 2013, consent of the Board be and is hereby accorded for {chargeType} of charge in favour of {chargeHolder} for an amount of {chargeAmount} secured by {securedAssets}.\n\nRESOLVED FURTHER THAT the Company Secretary / any Director be authorised to file Form CHG-1/CHG-4 with the Registrar of Companies.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "corporate_guarantee",
    title: "Corporate Guarantee / Security / Undertaking",
    icon: "🛡️", category: "financial", categoryLabel: "Financial & Banking", categoryIcon: "💰",
    fields: [
      { key: "beneficiary", label: "Beneficiary", placeholder: "e.g. ABC Pvt. Ltd. (Subsidiary)" },
      { key: "guaranteeAmount", label: "Guarantee Amount", placeholder: "e.g. ₹2,00,00,000" },
      { key: "lenderName", label: "In favour of", placeholder: "e.g. ICICI Bank Ltd." },
    ],
    discussion: approving(`providing corporate guarantee/security of {guaranteeAmount} in favour of {lenderName} on behalf of {beneficiary}`),
    resolution: `RESOLVED THAT pursuant to Section 185/186 of the Companies Act, 2013, consent of the Board be and is hereby accorded to provide corporate guarantee/security/undertaking of {guaranteeAmount} in favour of {lenderName} for the benefit of {beneficiary}, subject to compliance with applicable provisions.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "fund_investment",
    title: "Approval of Investment of Funds",
    icon: "📈", category: "financial", categoryLabel: "Financial & Banking", categoryIcon: "💰",
    fields: [
      { key: "investmentAmount", label: "Investment Amount", placeholder: "e.g. ₹25,00,000" },
      { key: "investmentType", label: "Type of Investment", placeholder: "e.g. Fixed Deposit / Mutual Fund / Securities" },
      { key: "investedWith", label: "Invested With", placeholder: "e.g. HDFC Bank / SBI Mutual Fund" },
    ],
    discussion: approving(`investment of surplus funds of the Company amounting to {investmentAmount} in {investmentType} with {investedWith}`),
    resolution: `RESOLVED THAT pursuant to Section 186 of the Companies Act, 2013, consent of the Board be and is hereby accorded to invest an amount of {investmentAmount} in {investmentType} with {investedWith}, on such terms and conditions as may be decided.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "annual_budget",
    title: "Approval of Annual Budget / Business Plan",
    icon: "📊", category: "financial", categoryLabel: "Financial & Banking", categoryIcon: "💰",
    fields: [
      { key: "fy", label: "Financial Year", placeholder: "e.g. 2025-26" },
      { key: "totalBudget", label: "Total Budget Amount", placeholder: "e.g. ₹5,00,00,000" },
    ],
    discussion: `The Chairman placed before the Board the Annual Budget / Business Plan for the Financial Year {fy} amounting to {totalBudget}. The Board reviewed the projections and unanimously approved the same.`,
    resolution: `RESOLVED THAT the Annual Budget / Business Plan of the Company for Financial Year {fy}, as placed before the Board, be and is hereby approved.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "annual_accounts",
    title: "Adoption of Annual Financial Statements",
    icon: "📋", category: "financial", categoryLabel: "Financial & Banking", categoryIcon: "💰",
    fields: [
      { key: "fy", label: "Financial Year", placeholder: "e.g. 2024-25" },
      { key: "balanceSheetDate", label: "Balance Sheet Date", placeholder: "e.g. 31 March 2025", type: "date" },
    ],
    discussion: `The Chairman placed before the Board the Audited Financial Statements for FY {fy} ended {balanceSheetDate} comprising Balance Sheet, Statement of Profit & Loss, Cash Flow Statement and Notes thereon, along with the Auditors' Report. The Board reviewed and unanimously adopted the same.`,
    resolution: `RESOLVED THAT the Audited Financial Statements of the Company for Financial Year {fy} ended {balanceSheetDate}, as placed before the Board together with the Auditors' Report, be and are hereby approved and adopted.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "boards_report",
    title: "Approval of Board's Report",
    icon: "📑", category: "financial", categoryLabel: "Financial & Banking", categoryIcon: "💰",
    fields: [{ key: "fy", label: "Financial Year", placeholder: "e.g. 2024-25" }],
    discussion: approving(`the Board's Report for Financial Year {fy} as required under Section 134 of the Companies Act, 2013. The Board reviewed the contents of the Report`),
    resolution: `RESOLVED THAT the Board's Report for Financial Year {fy}, as placed before the Board, be and is hereby approved.\n\nRESOLVED FURTHER THAT the Directors be authorised to sign the Board's Report on behalf of the Board.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "rpt_approval",
    title: "Approval of Related Party Transactions",
    icon: "🤝", category: "financial", categoryLabel: "Financial & Banking", categoryIcon: "💰",
    fields: [
      { key: "relatedParty", label: "Related Party Name", placeholder: "e.g. XYZ Private Limited" },
      { key: "relationshipNature", label: "Nature of Relationship", placeholder: "e.g. Subsidiary / Associate Company" },
      { key: "transactionNature", label: "Nature of Transaction", placeholder: "e.g. Sale of goods / Services / Loan" },
      { key: "transactionValue", label: "Transaction Value", placeholder: "e.g. ₹50,00,000 p.a." },
    ],
    discussion: `The Chairman placed before the Board the proposal for related party transaction with {relatedParty} ({relationshipNature}) involving {transactionNature} amounting to {transactionValue}. The Directors interested in the transaction, if any, abstained from voting. The Board, after deliberation, approved the transaction at arm's length and in ordinary course of business.`,
    resolution: `RESOLVED THAT pursuant to Section 188 of the Companies Act, 2013, the consent of the Board be and is hereby accorded for entering into a related party transaction with {relatedParty} ({relationshipNature}) for {transactionNature} up to a value of {transactionValue} per annum, on arm's length basis and in ordinary course of business.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "internal_controls",
    title: "Review of Internal Financial Controls",
    icon: "🔍", category: "financial", categoryLabel: "Financial & Banking", categoryIcon: "💰",
    fields: [],
    discussion: noting("the report on Internal Financial Controls of the Company as required under Section 134(5)(e) of the Companies Act, 2013. The Board noted that adequate internal financial controls are in place and are operating effectively"),
    resolution: "", resolutionType: "none",
  },
  {
    id: "dividend",
    title: "Declaration / Recommendation of Dividend",
    icon: "💸", category: "financial", categoryLabel: "Financial & Banking", categoryIcon: "💰",
    fields: [
      { key: "dividendType", label: "Dividend Type", placeholder: "e.g. Interim / Final" },
      { key: "dividendRate", label: "Rate", placeholder: "e.g. 10% (₹1 per share)" },
      { key: "fy", label: "Financial Year", placeholder: "e.g. 2024-25" },
      { key: "recordDate", label: "Record Date", placeholder: "e.g. 15 June 2025", type: "date" },
      { key: "paymentDate", label: "Payment Date", placeholder: "e.g. 30 June 2025", type: "date" },
    ],
    discussion: `The Chairman informed the Board about the proposal to declare {dividendType} Dividend for Financial Year {fy}. The Board considered the financial position of the Company and unanimously agreed.`,
    resolution: `RESOLVED THAT {dividendType} Dividend at the rate of {dividendRate} for Financial Year {fy} be and is hereby declared/recommended to shareholders whose names appear in the Register of Members as on the record date {recordDate}.\n\nRESOLVED FURTHER THAT the dividend shall be paid to eligible shareholders on or before {paymentDate}.${AUTH}`,
    resolutionType: "ordinary",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 3 — AUDITOR RELATED MATTERS
══════════════════════════════════════════════════════════════════ */
const AUDITOR: AgendaTemplate[] = [
  {
    id: "first_statutory_auditor",
    title: "Appointment of First Statutory Auditor",
    icon: "🔎", category: "auditor", categoryLabel: "Auditor Matters", categoryIcon: "🔍",
    fields: [
      { key: "auditorName", label: "Auditor / Firm Name", placeholder: "e.g. M/s ABC & Associates" },
      { key: "auditorRegNo", label: "ICAI Reg. No.", placeholder: "e.g. 123456W" },
      { key: "remuneration", label: "Remuneration", placeholder: "e.g. as mutually agreed" },
    ],
    discussion: approving(`appointment of the First Statutory Auditor of the Company in terms of Section 139(6) of the Companies Act, 2013`),
    resolution: `RESOLVED THAT pursuant to the provisions of Section 139(6) of the Companies Act, 2013 and the Companies (Audit and Auditors) Rules, 2014, {auditorName}, Chartered Accountants (ICAI Firm Reg. No. {auditorRegNo}) be and are hereby appointed as the First Statutory Auditors of the Company to hold office from this Meeting until the conclusion of the first Annual General Meeting, at a remuneration of {remuneration}.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "auditor_appt",
    title: "Recommend Appointment / Re-appointment of Statutory Auditor",
    icon: "📜", category: "auditor", categoryLabel: "Auditor Matters", categoryIcon: "🔍",
    fields: [
      { key: "auditorName", label: "Auditor Firm Name", placeholder: "e.g. M/s ABC & Associates" },
      { key: "auditorRegNo", label: "ICAI Firm Reg. No.", placeholder: "e.g. 123456W" },
      { key: "fromFY", label: "From FY", placeholder: "e.g. 2025-26" },
      { key: "toFY", label: "To FY", placeholder: "e.g. 2029-30" },
      { key: "remuneration", label: "Remuneration", placeholder: "e.g. as mutually agreed" },
    ],
    discussion: approving(`appointment/re-appointment of {auditorName} (ICAI Firm Reg. No. {auditorRegNo}) as Statutory Auditors for a term from FY {fromFY} to FY {toFY}`),
    resolution: `RESOLVED THAT pursuant to Sections 139, 141 and other applicable provisions of the Companies Act, 2013, the Board recommends to the shareholders for approval the appointment/re-appointment of {auditorName}, Chartered Accountants (ICAI Firm Reg. No. {auditorRegNo}) as Statutory Auditors of the Company from FY {fromFY} to FY {toFY} at a remuneration of {remuneration}.\n\nRESOLVED FURTHER THAT the Company Secretary / any Director be authorised to file Form ADT-1 with the ROC.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "auditor_resignation",
    title: "Noting of Resignation of Statutory Auditor",
    icon: "🚪", category: "auditor", categoryLabel: "Auditor Matters", categoryIcon: "🔍",
    fields: [
      { key: "auditorName", label: "Auditor / Firm Name", placeholder: "e.g. M/s XYZ & Co." },
      { key: "resignDate", label: "Date of Resignation", placeholder: "e.g. 01 June 2025", type: "date" },
    ],
    discussion: noting(`the resignation letter dated {resignDate} received from {auditorName}, the Statutory Auditors of the Company`),
    resolution: `RESOLVED THAT the resignation of {auditorName} from the position of Statutory Auditors of the Company with effect from {resignDate} be and is hereby noted and accepted.\n\nRESOLVED FURTHER THAT the Board shall take necessary steps to fill the casual vacancy so caused.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "casual_vacancy_auditor",
    title: "Fill Casual Vacancy of Auditor",
    icon: "🔁", category: "auditor", categoryLabel: "Auditor Matters", categoryIcon: "🔍",
    fields: [
      { key: "newAuditorName", label: "New Auditor Name", placeholder: "e.g. M/s New Associates" },
      { key: "newAuditorRegNo", label: "ICAI Reg. No.", placeholder: "e.g. 654321E" },
    ],
    discussion: approving(`appointment of {newAuditorName} (ICAI Reg. No. {newAuditorRegNo}) to fill the casual vacancy caused by the resignation / death of the previous auditor`),
    resolution: `RESOLVED THAT pursuant to Section 139(8) of the Companies Act, 2013, {newAuditorName}, Chartered Accountants (ICAI Reg. No. {newAuditorRegNo}) be and are hereby appointed to fill the casual vacancy in the office of Statutory Auditors of the Company, subject to ratification by members at the next AGM.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "internal_auditor",
    title: "Appointment of Internal Auditor",
    icon: "🔎", category: "auditor", categoryLabel: "Auditor Matters", categoryIcon: "🔍",
    fields: [
      { key: "auditorName", label: "Internal Auditor Name / Firm", placeholder: "e.g. M/s Internal Audit Co." },
      { key: "fy", label: "For Financial Year", placeholder: "e.g. 2025-26" },
      { key: "remuneration", label: "Remuneration", placeholder: "e.g. ₹1,50,000 per annum" },
    ],
    discussion: approving(`appointment of {auditorName} as Internal Auditor of the Company for FY {fy} as required under Section 138 of the Companies Act, 2013`),
    resolution: `RESOLVED THAT pursuant to Section 138 of the Companies Act, 2013, {auditorName} be and is hereby appointed as Internal Auditor of the Company for Financial Year {fy} at a remuneration of {remuneration}.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "secretarial_auditor",
    title: "Appointment of Secretarial Auditor",
    icon: "📋", category: "auditor", categoryLabel: "Auditor Matters", categoryIcon: "🔍",
    fields: [
      { key: "csName", label: "Company Secretary / Firm Name", placeholder: "e.g. CS Priya Sharma / M/s CS Firm" },
      { key: "fy", label: "Financial Year", placeholder: "e.g. 2025-26" },
      { key: "remuneration", label: "Remuneration", placeholder: "e.g. ₹75,000" },
    ],
    discussion: approving(`appointment of {csName} as Secretarial Auditor of the Company for FY {fy} as required under Section 204 of the Companies Act, 2013`),
    resolution: `RESOLVED THAT pursuant to Section 204 of the Companies Act, 2013 and the Companies (Appointment and Remuneration of Managerial Personnel) Rules, 2014, {csName} be and is hereby appointed as the Secretarial Auditor of the Company for FY {fy} at a remuneration of {remuneration}.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "cost_auditor",
    title: "Appointment of Cost Auditor",
    icon: "💹", category: "auditor", categoryLabel: "Auditor Matters", categoryIcon: "🔍",
    fields: [
      { key: "costAuditorName", label: "Cost Auditor / Firm Name", placeholder: "e.g. M/s Cost Audit Firm" },
      { key: "fy", label: "Financial Year", placeholder: "e.g. 2025-26" },
      { key: "remuneration", label: "Remuneration", placeholder: "e.g. ₹1,00,000" },
    ],
    discussion: approving(`appointment of {costAuditorName} as Cost Auditor of the Company for FY {fy} pursuant to Section 148 of the Companies Act, 2013`),
    resolution: `RESOLVED THAT pursuant to Section 148 of the Companies Act, 2013, {costAuditorName} be and is hereby appointed as Cost Auditor of the Company for FY {fy} at a remuneration of {remuneration}, subject to ratification by shareholders at the ensuing AGM.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "auditor_remuneration",
    title: "Fixation of Remuneration of Auditors",
    icon: "💰", category: "auditor", categoryLabel: "Auditor Matters", categoryIcon: "🔍",
    fields: [
      { key: "auditorType", label: "Auditor Type", placeholder: "e.g. Statutory / Internal / Secretarial" },
      { key: "auditorName", label: "Auditor Name", placeholder: "e.g. M/s ABC & Associates" },
      { key: "remuneration", label: "Remuneration", placeholder: "e.g. ₹2,00,000 per annum" },
    ],
    discussion: approving(`fixation of remuneration of {auditorType} Auditor {auditorName} at {remuneration}`),
    resolution: `RESOLVED THAT the remuneration of {auditorName}, {auditorType} Auditor of the Company, be fixed at {remuneration} plus applicable taxes and out-of-pocket expenses for the current financial year.${AUTH}`,
    resolutionType: "ordinary",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 4 — DIRECTORS AND KMP RELATED MATTERS
══════════════════════════════════════════════════════════════════ */
const DIRECTORS: AgendaTemplate[] = [
  {
    id: "appt_addl_director",
    title: "Appointment of Additional Director",
    icon: "👤", category: "directors", categoryLabel: "Directors & KMP", categoryIcon: "👥",
    fields: [
      { key: "dirName", label: "Director Name", placeholder: "e.g. Mr. Rajesh Kumar Sharma" },
      { key: "dirDin", label: "DIN", placeholder: "e.g. 01234567" },
      { key: "dirDesig", label: "Designation", placeholder: "e.g. Additional Director" },
      { key: "effectiveDate", label: "Effective Date", placeholder: "e.g. 05 June 2025", type: "date" },
    ],
    discussion: approving(`appointment of {dirName} (DIN: {dirDin}) as {dirDesig} of the Company with effect from {effectiveDate}`),
    resolution: `RESOLVED THAT pursuant to Section 161(1) of the Companies Act, 2013, {dirName} (DIN: {dirDin}) be and is hereby appointed as an Additional Director (as {dirDesig}) of the Company with effect from {effectiveDate}, to hold office till the date of the next Annual General Meeting or the last date on which the AGM should have been held, whichever is earlier.\n\nRESOLVED FURTHER THAT the Company Secretary be authorised to file Form DIR-12 with the ROC.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "appt_independent_director",
    title: "Appointment of Independent Director",
    icon: "🧑‍⚖️", category: "directors", categoryLabel: "Directors & KMP", categoryIcon: "👥",
    fields: [
      { key: "dirName", label: "Director Name", placeholder: "e.g. Mr. Suresh Mehta" },
      { key: "dirDin", label: "DIN", placeholder: "e.g. 09876543" },
      { key: "termYears", label: "Term (years)", placeholder: "e.g. 5" },
      { key: "effectiveDate", label: "Effective Date", placeholder: "e.g. 01 July 2025", type: "date" },
    ],
    discussion: approving(`appointment of {dirName} (DIN: {dirDin}) as Independent Director for a term of {termYears} years from {effectiveDate}`),
    resolution: `RESOLVED THAT pursuant to Sections 149, 150, 152 and Schedule IV of the Companies Act, 2013, and based on the recommendation of the Nomination and Remuneration Committee, {dirName} (DIN: {dirDin}), who has submitted a declaration that he/she meets the criteria of independence under Section 149(6), be and is hereby appointed as an Independent Director of the Company for a term of {termYears} consecutive years commencing from {effectiveDate}, not liable to retire by rotation, subject to approval of shareholders.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "appt_nominee_director",
    title: "Appointment of Nominee Director",
    icon: "🏛️", category: "directors", categoryLabel: "Directors & KMP", categoryIcon: "👥",
    fields: [
      { key: "dirName", label: "Director Name", placeholder: "e.g. Mr. Arun Singh" },
      { key: "dirDin", label: "DIN", placeholder: "e.g. 05678901" },
      { key: "nomineeOf", label: "Nominated By", placeholder: "e.g. ABC Bank Ltd. / Government of India" },
      { key: "effectiveDate", label: "Effective Date", placeholder: "e.g. 01 June 2025", type: "date" },
    ],
    discussion: approving(`appointment of {dirName} (DIN: {dirDin}) as Nominee Director on behalf of {nomineeOf} with effect from {effectiveDate}`),
    resolution: `RESOLVED THAT pursuant to Section 161(3) of the Companies Act, 2013, and in accordance with the nomination received from {nomineeOf}, {dirName} (DIN: {dirDin}) be and is hereby appointed as Nominee Director of the Company with effect from {effectiveDate} to represent {nomineeOf} on the Board.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "resign_director",
    title: "Noting of Resignation of Director",
    icon: "🚪", category: "directors", categoryLabel: "Directors & KMP", categoryIcon: "👥",
    fields: [
      { key: "dirName", label: "Director Name", placeholder: "e.g. Mr. Suresh Mehta" },
      { key: "dirDin", label: "DIN", placeholder: "e.g. 07654321" },
      { key: "resignDate", label: "Date of Resignation", placeholder: "e.g. 01 June 2025", type: "date" },
    ],
    discussion: noting(`the resignation letter dated {resignDate} received from {dirName} (DIN: {dirDin}), Director of the Company`),
    resolution: `RESOLVED THAT the resignation of {dirName} (DIN: {dirDin}) from the directorship of the Company with effect from {resignDate} be and is hereby noted and accepted.\n\nRESOLVED FURTHER THAT the Company Secretary be authorised to file Form DIR-12 with the ROC.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "regularise_director",
    title: "Regularisation of Additional Director",
    icon: "✔️", category: "directors", categoryLabel: "Directors & KMP", categoryIcon: "👥",
    fields: [
      { key: "dirName", label: "Director Name", placeholder: "e.g. Mr. Rajesh Kumar Sharma" },
      { key: "dirDin", label: "DIN", placeholder: "e.g. 01234567" },
    ],
    discussion: approving(`recommendation for regularisation of {dirName} (DIN: {dirDin}) as a Director at the ensuing Annual General Meeting`),
    resolution: `RESOLVED THAT the regularisation of {dirName} (DIN: {dirDin}), who was appointed as an Additional Director, be and is hereby recommended to the shareholders for approval as a Director at the ensuing Annual General Meeting.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "appt_md_wrd",
    title: "Appointment of MD / WTD / CEO / CFO / CS",
    icon: "👔", category: "directors", categoryLabel: "Directors & KMP", categoryIcon: "👥",
    fields: [
      { key: "personName", label: "Person Name", placeholder: "e.g. Mr. Amit Sharma" },
      { key: "designation", label: "Designation", placeholder: "e.g. Managing Director / CEO / CFO / CS" },
      { key: "din", label: "DIN / PAN", placeholder: "e.g. 01234567" },
      { key: "remuneration", label: "Remuneration", placeholder: "e.g. ₹5,00,000 per month" },
      { key: "effectiveDate", label: "Effective Date", placeholder: "e.g. 01 July 2025", type: "date" },
      { key: "term", label: "Term", placeholder: "e.g. 3 years" },
    ],
    discussion: approving(`appointment of {personName} (DIN/PAN: {din}) as {designation} of the Company for a period of {term} with effect from {effectiveDate} at a remuneration of {remuneration}`),
    resolution: `RESOLVED THAT pursuant to Sections 196, 197, 198 and Schedule V of the Companies Act, 2013 (wherever applicable), {personName} (DIN/PAN: {din}) be and is hereby appointed as {designation} of the Company for a period of {term} with effect from {effectiveDate} at a remuneration of {remuneration} per month on such terms and conditions as set out in the Agreement to be executed.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "dir_kyc",
    title: "Noting of DIN KYC / Director Compliances",
    icon: "🪪", category: "directors", categoryLabel: "Directors & KMP", categoryIcon: "👥",
    fields: [{ key: "fy", label: "Financial Year", placeholder: "e.g. 2024-25" }],
    discussion: noting("the status of DIR-3 KYC compliance of all Directors of the Company for the financial year {fy}. The Board was informed that all Directors have completed their KYC as required"),
    resolution: "", resolutionType: "none",
  },
  {
    id: "sitting_fees",
    title: "Approval of Sitting Fees / Remuneration to Directors",
    icon: "💵", category: "directors", categoryLabel: "Directors & KMP", categoryIcon: "👥",
    fields: [
      { key: "sittingFeeAmount", label: "Sitting Fee Amount", placeholder: "e.g. ₹10,000 per meeting" },
      { key: "effectiveDate", label: "Effective From", placeholder: "e.g. 01 April 2025", type: "date" },
    ],
    discussion: approving(`payment of sitting fees of {sittingFeeAmount} per meeting to Non-Executive / Independent Directors effective from {effectiveDate}`),
    resolution: `RESOLVED THAT pursuant to Section 197 of the Companies Act, 2013, the sitting fees payable to Non-Executive / Independent Directors for attending meetings of the Board and its Committees be and is hereby fixed at {sittingFeeAmount} per meeting with effect from {effectiveDate}.${AUTH}`,
    resolutionType: "ordinary",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 5 — SHARE CAPITAL AND SECURITIES
══════════════════════════════════════════════════════════════════ */
const SHARE_CAPITAL: AgendaTemplate[] = [
  {
    id: "share_allotment",
    title: "Allotment of Shares",
    icon: "📜", category: "shares", categoryLabel: "Share Capital & Securities", categoryIcon: "📈",
    fields: [
      { key: "noOfShares", label: "Number of Shares", placeholder: "e.g. 10,000" },
      { key: "shareClass", label: "Class of Shares", placeholder: "e.g. Equity / Preference" },
      { key: "faceValue", label: "Face Value", placeholder: "e.g. ₹10 per share" },
      { key: "issuePrice", label: "Issue Price", placeholder: "e.g. ₹10 per share (at par)" },
      { key: "allotteeNames", label: "Name(s) of Allottee(s)", placeholder: "e.g. Mr. Rahul Sharma, Ms. Priya Singh" },
    ],
    discussion: approving(`allotment of {noOfShares} {shareClass} Shares of {faceValue} each at {issuePrice} to {allotteeNames}`),
    resolution: `RESOLVED THAT pursuant to Section 62/42 of the Companies Act, 2013, {noOfShares} {shareClass} Shares of {faceValue} each be and are hereby allotted at {issuePrice} to {allotteeNames}, and the Directors be authorised to issue share certificates accordingly.\n\nRESOLVED FURTHER THAT the Company Secretary be authorised to file Form PAS-3 with the ROC within the prescribed time.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "share_certificate_issue",
    title: "Issue of Share Certificates (SH-1)",
    icon: "📑", category: "shares", categoryLabel: "Share Capital & Securities", categoryIcon: "📈",
    fields: [
      { key: "shareholderNames", label: "Shareholder Name(s)", placeholder: "e.g. as per allotment list" },
      { key: "totalShares", label: "Total Shares", placeholder: "e.g. 10,000 shares" },
    ],
    discussion: approving(`issue of Share Certificates in Form SH-1 to {shareholderNames} for {totalShares} shares`),
    resolution: `RESOLVED THAT Share Certificates in Form SH-1 be issued to {shareholderNames} for the shares held by them, as per the Register of Members. The certificates shall be issued within 2 months of allotment as required under Section 56(4) of the Companies Act, 2013.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "share_transfer",
    title: "Approval of Transfer of Shares",
    icon: "🔄", category: "shares", categoryLabel: "Share Capital & Securities", categoryIcon: "📈",
    fields: [
      { key: "transferorName", label: "Transferor Name", placeholder: "e.g. Mr. Rahul Sharma" },
      { key: "transfereeName", label: "Transferee Name", placeholder: "e.g. Ms. Neha Gupta" },
      { key: "noOfShares", label: "Number of Shares", placeholder: "e.g. 5,000" },
      { key: "consideration", label: "Consideration", placeholder: "e.g. ₹50,000" },
    ],
    discussion: approving(`transfer of {noOfShares} shares from {transferorName} to {transfereeName} for a consideration of {consideration}`),
    resolution: `RESOLVED THAT the transfer of {noOfShares} equity shares from {transferorName} to {transfereeName} for a consideration of {consideration} be and is hereby approved, subject to payment of stamp duty and submission of duly executed Form SH-4.\n\nRESOLVED FURTHER THAT the Company Secretary be authorised to update the Register of Members accordingly.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "increase_auth_capital",
    title: "Increase in Authorised Share Capital",
    icon: "⬆️", category: "shares", categoryLabel: "Share Capital & Securities", categoryIcon: "📈",
    fields: [
      { key: "existingCapital", label: "Existing Authorised Capital", placeholder: "e.g. ₹1,00,00,000" },
      { key: "proposedCapital", label: "Proposed Authorised Capital", placeholder: "e.g. ₹5,00,00,000" },
    ],
    discussion: approving(`increase in Authorised Share Capital of the Company from {existingCapital} to {proposedCapital}, subject to approval of shareholders`),
    resolution: `RESOLVED THAT pursuant to Section 61 of the Companies Act, 2013, the Board recommends to the shareholders for approval, the increase in the Authorised Share Capital of the Company from {existingCapital} to {proposedCapital}, and consequent alteration of the Capital Clause (Clause V) of the Memorandum of Association.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "rights_issue",
    title: "Approval of Rights Issue",
    icon: "⚖️", category: "shares", categoryLabel: "Share Capital & Securities", categoryIcon: "📈",
    fields: [
      { key: "rightsShares", label: "No. of Rights Shares", placeholder: "e.g. 50,000" },
      { key: "issuePrice", label: "Issue Price", placeholder: "e.g. ₹10 per share" },
      { key: "rightsRatio", label: "Rights Ratio", placeholder: "e.g. 1:1 (1 share for every 1 held)" },
      { key: "offerDate", label: "Offer Date", placeholder: "e.g. 15 June 2025", type: "date" },
    ],
    discussion: approving(`Rights Issue of {rightsShares} equity shares at {issuePrice} in the ratio of {rightsRatio} to existing shareholders`),
    resolution: `RESOLVED THAT pursuant to Section 62(1)(a) of the Companies Act, 2013, the Board hereby approves the Rights Issue of {rightsShares} equity shares at {issuePrice} in the ratio of {rightsRatio} to the existing shareholders as on the record date, with a right of renunciation. The offer letter shall be sent within 3 days of the record date.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "preferential_allotment",
    title: "Approval of Preferential Allotment",
    icon: "🎯", category: "shares", categoryLabel: "Share Capital & Securities", categoryIcon: "📈",
    fields: [
      { key: "noOfShares", label: "No. of Shares", placeholder: "e.g. 1,00,000" },
      { key: "issuePrice", label: "Issue Price", placeholder: "e.g. ₹15 per share" },
      { key: "allotteeNames", label: "Allottee(s)", placeholder: "e.g. specific investors/promoters" },
    ],
    discussion: approving(`Preferential Allotment of {noOfShares} shares at {issuePrice} to {allotteeNames}. The Board noted that the same would be subject to approval of shareholders by way of a Special Resolution at an Extra-Ordinary General Meeting`),
    resolution: `RESOLVED THAT pursuant to Section 62(1)(c) and other applicable provisions of the Companies Act, 2013, and subject to the approval of the shareholders of the Company by way of a Special Resolution at a duly convened Extra-Ordinary General Meeting, the Board recommends and approves in principle the Preferential Allotment of {noOfShares} shares at an issue price of {issuePrice} to {allotteeNames}, subject to compliance with applicable SEBI regulations, RBI guidelines and filing of requisite forms with the Registrar of Companies.\n\nRESOLVED FURTHER THAT the Board be and is hereby authorised to convene an Extra-Ordinary General Meeting for obtaining approval of shareholders by way of Special Resolution as required under Section 62(1)(c) of the Companies Act, 2013.${AUTH}`,
    resolutionType: "ordinary",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 6 — GENERAL MEETING MATTERS
══════════════════════════════════════════════════════════════════ */
const GENERAL_MEETING: AgendaTemplate[] = [
  {
    id: "fix_agm",
    title: "Fix Date, Time and Venue of AGM",
    icon: "📅", category: "gen_meeting", categoryLabel: "General Meeting", categoryIcon: "🏛️",
    fields: [
      { key: "agmDate", label: "AGM Date", placeholder: "e.g. 29 September 2025", type: "date" },
      { key: "agmTime", label: "AGM Time", placeholder: "e.g. 11:00 AM" },
      { key: "agmVenue", label: "AGM Venue", placeholder: "e.g. Registered Office of the Company" },
      { key: "fy", label: "For FY", placeholder: "e.g. 2024-25" },
    ],
    discussion: approving(`the date, time and venue for convening the Annual General Meeting (AGM) for Financial Year {fy}`),
    resolution: `RESOLVED THAT the Annual General Meeting of the Company for Financial Year {fy} be convened on {agmDate} at {agmTime} at {agmVenue}.\n\nRESOLVED FURTHER THAT the Company Secretary be authorised to issue Notice of the AGM to all members, directors, auditors and others entitled to receive the same.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "approve_agm_notice",
    title: "Approval of Notice of AGM",
    icon: "📨", category: "gen_meeting", categoryLabel: "General Meeting", categoryIcon: "🏛️",
    fields: [{ key: "agmDate", label: "AGM Date", placeholder: "e.g. 29 September 2025" }],
    discussion: approving(`the draft Notice of Annual General Meeting to be held on {agmDate}`),
    resolution: `RESOLVED THAT the draft Notice of the Annual General Meeting to be held on {agmDate}, as placed before the Board, be and is hereby approved.\n\nRESOLVED FURTHER THAT the Company Secretary be authorised to dispatch the Notice along with the Annual Report and other required documents to all members.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "fix_egm",
    title: "Convening of Extra-Ordinary General Meeting (EGM)",
    icon: "⚡", category: "gen_meeting", categoryLabel: "General Meeting", categoryIcon: "🏛️",
    fields: [
      { key: "egmDate", label: "EGM Date", placeholder: "e.g. 30 July 2025", type: "date" },
      { key: "egmTime", label: "EGM Time", placeholder: "e.g. 3:00 PM" },
      { key: "egmVenue", label: "EGM Venue", placeholder: "e.g. Registered Office of the Company" },
      { key: "purpose", label: "Purpose of EGM", placeholder: "e.g. approval of special resolution for capital increase" },
    ],
    discussion: approving(`convening an Extra-Ordinary General Meeting on {egmDate} at {egmTime} at {egmVenue} for {purpose}`),
    resolution: `RESOLVED THAT an Extra-Ordinary General Meeting of the Company be convened on {egmDate} at {egmTime} at {egmVenue} for the purpose of {purpose}.\n\nRESOLVED FURTHER THAT the Company Secretary be authorised to issue Notice and conduct the EGM.${AUTH}`,
    resolutionType: "ordinary",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 7 — COMMITTEE RELATED MATTERS
══════════════════════════════════════════════════════════════════ */
const COMMITTEES: AgendaTemplate[] = [
  {
    id: "constitute_audit_committee",
    title: "Constitution / Reconstitution of Audit Committee",
    icon: "🔎", category: "committees", categoryLabel: "Committees", categoryIcon: "👥",
    fields: [
      { key: "chairmanName", label: "Chairman of Committee", placeholder: "e.g. Mr. Suresh Mehta (Independent Director)" },
      { key: "memberNames", label: "Other Members", placeholder: "e.g. Mr. Amit Kumar, Ms. Priya Singh" },
    ],
    discussion: approving(`constitution/reconstitution of the Audit Committee of the Board with {chairmanName} as Chairman and {memberNames} as members, in accordance with Section 177 of the Companies Act, 2013`),
    resolution: `RESOLVED THAT the Audit Committee of the Board be and is hereby constituted/reconstituted with the following members:\n\n• Chairman: {chairmanName}\n• Members: {memberNames}\n\nThe Audit Committee shall exercise powers and perform functions as prescribed under Section 177 of the Companies Act, 2013.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "constitute_nrc",
    title: "Constitution / Reconstitution of Nomination & Remuneration Committee",
    icon: "👥", category: "committees", categoryLabel: "Committees", categoryIcon: "👥",
    fields: [
      { key: "chairmanName", label: "Chairman", placeholder: "e.g. Mr. Suresh Mehta (Independent Director)" },
      { key: "memberNames", label: "Members", placeholder: "e.g. Mr. Amit Kumar, Ms. Priya Singh" },
    ],
    discussion: approving(`constitution/reconstitution of the Nomination and Remuneration Committee (NRC) in accordance with Section 178 of the Companies Act, 2013`),
    resolution: `RESOLVED THAT the Nomination and Remuneration Committee be and is hereby constituted/reconstituted with:\n\n• Chairman: {chairmanName}\n• Members: {memberNames}\n\nThe NRC shall exercise powers as prescribed under Section 178 of the Companies Act, 2013.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "constitute_csr_committee",
    title: "Constitution / Reconstitution of CSR Committee",
    icon: "🌱", category: "committees", categoryLabel: "Committees", categoryIcon: "👥",
    fields: [
      { key: "chairmanName", label: "Chairman", placeholder: "e.g. Managing Director" },
      { key: "memberNames", label: "Members", placeholder: "e.g. two or more Directors" },
    ],
    discussion: approving(`constitution/reconstitution of the CSR Committee pursuant to Section 135 of the Companies Act, 2013`),
    resolution: `RESOLVED THAT the CSR Committee be and is hereby constituted/reconstituted with:\n\n• Chairman: {chairmanName}\n• Members: {memberNames}\n\nThe CSR Committee shall formulate and monitor the CSR Policy and expenditure of the Company.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "committee_recommendations",
    title: "Noting of Committee Recommendations / Reports",
    icon: "📋", category: "committees", categoryLabel: "Committees", categoryIcon: "👥",
    fields: [
      { key: "committeeName", label: "Committee Name", placeholder: "e.g. Audit Committee / NRC / CSR Committee" },
      { key: "meetingDate", label: "Committee Meeting Date", placeholder: "e.g. 01 June 2025" },
    ],
    discussion: noting(`the recommendations / minutes of the {committeeName} meeting held on {meetingDate}`),
    resolution: "", resolutionType: "none",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 8 — REGISTERED OFFICE AND BRANCH MATTERS
══════════════════════════════════════════════════════════════════ */
const OFFICE: AgendaTemplate[] = [
  {
    id: "change_reg_office",
    title: "Change of Registered Office",
    icon: "🏢", category: "office", categoryLabel: "Office & Branch", categoryIcon: "🏢",
    fields: [
      { key: "oldAddress", label: "Current Address", placeholder: "e.g. 101, ABC Tower, Mumbai" },
      { key: "newAddress", label: "New Address", placeholder: "e.g. 201, XYZ Building, Delhi" },
      { key: "effectiveDate", label: "Effective Date", placeholder: "e.g. 01 July 2025", type: "date" },
    ],
    discussion: approving(`change of Registered Office of the Company from {oldAddress} to {newAddress} with effect from {effectiveDate}`),
    resolution: `RESOLVED THAT the Registered Office of the Company be and is hereby shifted from {oldAddress} to {newAddress} with effect from {effectiveDate}.\n\nRESOLVED FURTHER THAT the Company Secretary be authorised to file Form INC-22 / INC-23 with the Registrar of Companies and update all statutory records.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "open_branch",
    title: "Opening of Branch Office",
    icon: "🏬", category: "office", categoryLabel: "Office & Branch", categoryIcon: "🏢",
    fields: [
      { key: "branchLocation", label: "Branch Location", placeholder: "e.g. 45, MG Road, Bengaluru" },
      { key: "stateCity", label: "State / City", placeholder: "e.g. Karnataka, Bengaluru" },
    ],
    discussion: approving(`opening of a Branch Office at {branchLocation}, {stateCity}`),
    resolution: `RESOLVED THAT a Branch Office of the Company be opened at {branchLocation}, {stateCity}. The Managing Director / any Director be authorised to take all necessary steps including obtaining approvals, licences and registrations for the said Branch Office.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "office_lease",
    title: "Approval of Lease / Rent Agreement for Office Premises",
    icon: "🔑", category: "office", categoryLabel: "Office & Branch", categoryIcon: "🏢",
    fields: [
      { key: "premisesAddress", label: "Premises Address", placeholder: "e.g. Ground Floor, ABC Complex, Pune" },
      { key: "lessorName", label: "Lessor Name", placeholder: "e.g. Mr. Rajesh Property" },
      { key: "rentAmount", label: "Monthly Rent", placeholder: "e.g. ₹50,000 per month" },
      { key: "leaseTerm", label: "Lease Term", placeholder: "e.g. 3 years" },
    ],
    discussion: approving(`execution of a lease/rent agreement with {lessorName} for premises at {premisesAddress} at a monthly rent of {rentAmount} for a period of {leaseTerm}`),
    resolution: `RESOLVED THAT the Company be and is hereby authorised to enter into a lease/rent agreement with {lessorName} for the premises situated at {premisesAddress} at a monthly rent of {rentAmount} for a period of {leaseTerm}, on such terms as may be negotiated.${AUTH}`,
    resolutionType: "ordinary",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 9 — LEGAL, REGULATORY AND COMPLIANCE
══════════════════════════════════════════════════════════════════ */
const LEGAL: AgendaTemplate[] = [
  {
    id: "authorise_roc_filings",
    title: "Authorisation for Filing of ROC Forms",
    icon: "📂", category: "legal", categoryLabel: "Legal & Compliance", categoryIcon: "⚖️",
    fields: [
      { key: "formNos", label: "Form Number(s)", placeholder: "e.g. MGT-7, AOC-4, ADT-1" },
      { key: "authorisedPerson", label: "Authorised Person", placeholder: "e.g. Company Secretary / Managing Director" },
    ],
    discussion: approving(`authorisation for filing of ROC forms {formNos} with the Registrar of Companies`),
    resolution: `RESOLVED THAT {authorisedPerson} be and is hereby authorised to file Forms {formNos} and any other necessary forms with the Registrar of Companies and to do all such acts as may be required.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "reply_to_notice",
    title: "Approval of Reply to Notices / Show Cause Notices",
    icon: "📬", category: "legal", categoryLabel: "Legal & Compliance", categoryIcon: "⚖️",
    fields: [
      { key: "authority", label: "Authority / Department", placeholder: "e.g. ROC / GST Department / Income Tax" },
      { key: "noticeDate", label: "Notice Date", placeholder: "e.g. 15 May 2025" },
      { key: "noticeSubject", label: "Subject of Notice", placeholder: "e.g. non-compliance of Section XYZ" },
    ],
    discussion: approving(`the draft reply to the show cause notice / notice dated {noticeDate} received from {authority} regarding {noticeSubject}`),
    resolution: `RESOLVED THAT the draft reply to the notice dated {noticeDate} of {authority} regarding {noticeSubject}, as placed before the Board, be and is hereby approved. The authorised signatory be directed to file / submit the same within the stipulated time.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "legal_proceedings",
    title: "Authorisation for Legal Proceedings",
    icon: "⚖️", category: "legal", categoryLabel: "Legal & Compliance", categoryIcon: "⚖️",
    fields: [
      { key: "caseDetails", label: "Case / Matter Details", placeholder: "e.g. civil suit against ABC Party for recovery" },
      { key: "authorisedPerson", label: "Authorised Person", placeholder: "e.g. Managing Director" },
    ],
    discussion: approving(`the Company to initiate/defend legal proceedings in the matter of {caseDetails}`),
    resolution: `RESOLVED THAT {authorisedPerson} be and is hereby authorised to initiate/defend legal proceedings on behalf of the Company in the matter of {caseDetails}, including appointment of advocates, signing of vakalatnama, and doing all necessary acts.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "trademark",
    title: "Approval of Trademark Application / Assignment",
    icon: "™️", category: "legal", categoryLabel: "Legal & Compliance", categoryIcon: "⚖️",
    fields: [
      { key: "trademarkName", label: "Trademark / Brand Name", placeholder: "e.g. ComplianceSearch" },
      { key: "trademarkClass", label: "Class", placeholder: "e.g. Class 45 (Legal Services)" },
      { key: "actionType", label: "Action", placeholder: "e.g. Application / Assignment / Transfer" },
    ],
    discussion: approving(`{actionType} for trademark '{trademarkName}' under Class {trademarkClass} with the Trademark Registry`),
    resolution: `RESOLVED THAT the Company be and is hereby authorised to file application/assignment/transfer for the trademark '{trademarkName}' under Class {trademarkClass} with the Trade Marks Registry. The Managing Director be authorised to sign and execute all documents.${AUTH}`,
    resolutionType: "ordinary",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 10 — CSR RELATED MATTERS
══════════════════════════════════════════════════════════════════ */
const CSR: AgendaTemplate[] = [
  {
    id: "csr_policy",
    title: "Approval of CSR Policy",
    icon: "🌱", category: "csr", categoryLabel: "CSR Matters", categoryIcon: "🌿",
    fields: [{ key: "fy", label: "Financial Year", placeholder: "e.g. 2025-26" }],
    discussion: approving(`the CSR Policy of the Company for FY {fy} as recommended by the CSR Committee, pursuant to Section 135 of the Companies Act, 2013`),
    resolution: `RESOLVED THAT the CSR Policy of the Company for FY {fy}, as recommended by the CSR Committee and placed before the Board, be and is hereby approved. The Policy shall be hosted on the Company's website.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "csr_budget",
    title: "Approval of CSR Budget and Annual Action Plan",
    icon: "💚", category: "csr", categoryLabel: "CSR Matters", categoryIcon: "🌿",
    fields: [
      { key: "fy", label: "Financial Year", placeholder: "e.g. 2025-26" },
      { key: "csrBudget", label: "CSR Budget Amount", placeholder: "e.g. ₹25,00,000" },
      { key: "activities", label: "Key CSR Activities", placeholder: "e.g. education, healthcare, environment" },
    ],
    discussion: approving(`the CSR Annual Action Plan and Budget of {csrBudget} for FY {fy} covering activities in {activities}`),
    resolution: `RESOLVED THAT the CSR Annual Action Plan and Budget of {csrBudget} for FY {fy}, as recommended by the CSR Committee, covering activities related to {activities} be and is hereby approved.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "csr_expenditure",
    title: "Approval of CSR Expenditure",
    icon: "🤲", category: "csr", categoryLabel: "CSR Matters", categoryIcon: "🌿",
    fields: [
      { key: "amount", label: "Expenditure Amount", placeholder: "e.g. ₹5,00,000" },
      { key: "ngoName", label: "Implementing Agency / NGO", placeholder: "e.g. Smile Foundation" },
      { key: "activity", label: "CSR Activity", placeholder: "e.g. providing mid-day meals to school children" },
    ],
    discussion: approving(`CSR expenditure of {amount} to {ngoName} for {activity}`),
    resolution: `RESOLVED THAT CSR expenditure of {amount} be incurred in favour of {ngoName} for the purpose of {activity}, which falls under Schedule VII of the Companies Act, 2013.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "csr_report",
    title: "Approval of CSR Report",
    icon: "📊", category: "csr", categoryLabel: "CSR Matters", categoryIcon: "🌿",
    fields: [{ key: "fy", label: "Financial Year", placeholder: "e.g. 2024-25" }],
    discussion: approving(`the CSR Report for FY {fy} as required under Section 135 of the Companies Act, 2013, for inclusion in the Board's Report`),
    resolution: `RESOLVED THAT the CSR Report for FY {fy}, as placed before the Board, be and is hereby approved for inclusion in the Board's Report.${AUTH}`,
    resolutionType: "ordinary",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 11 — SECRETARIAL AND ANNUAL COMPLIANCE
══════════════════════════════════════════════════════════════════ */
const SECRETARIAL: AgendaTemplate[] = [
  {
    id: "annual_return",
    title: "Approval of Annual Return (MGT-7)",
    icon: "📗", category: "secretarial", categoryLabel: "Secretarial & Compliance", categoryIcon: "📋",
    fields: [{ key: "fy", label: "Financial Year", placeholder: "e.g. 2024-25" }],
    discussion: approving(`the Annual Return (Form MGT-7) of the Company for FY {fy}`),
    resolution: `RESOLVED THAT the Annual Return of the Company for FY {fy} as prepared by the Company Secretary and placed before the Board, be and is hereby approved for signing and filing with the Registrar of Companies.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "secretarial_audit_report",
    title: "Noting of Secretarial Audit Report",
    icon: "📋", category: "secretarial", categoryLabel: "Secretarial & Compliance", categoryIcon: "📋",
    fields: [{ key: "fy", label: "Financial Year", placeholder: "e.g. 2024-25" }],
    discussion: noting("the Secretarial Audit Report (Form MR-3) for FY {fy} as submitted by the Secretarial Auditor. The Board took note of the observations/qualifications, if any, and directed the management to take appropriate steps"),
    resolution: "", resolutionType: "none",
  },
  {
    id: "compliance_certificate",
    title: "Noting of Compliance Certificate",
    icon: "✅", category: "secretarial", categoryLabel: "Secretarial & Compliance", categoryIcon: "📋",
    fields: [],
    discussion: noting("the Compliance Certificate issued by the Practicing Company Secretary/Company Secretary certifying compliance with applicable provisions of the Companies Act, 2013 for the relevant period"),
    resolution: "", resolutionType: "none",
  },
  {
    id: "annual_filings_roc",
    title: "Approval of Annual Filings with ROC (AOC-4 / MGT-7)",
    icon: "📤", category: "secretarial", categoryLabel: "Secretarial & Compliance", categoryIcon: "📋",
    fields: [{ key: "fy", label: "Financial Year", placeholder: "e.g. 2024-25" }],
    discussion: approving(`the annual filings with the Registrar of Companies including Form AOC-4 (Financial Statements) and Form MGT-7 (Annual Return) for FY {fy}`),
    resolution: `RESOLVED THAT the annual filings — Form AOC-4 and Form MGT-7 — for Financial Year {fy} be and are hereby approved.\n\nRESOLVED FURTHER THAT the Company Secretary / any Director be authorised to sign and file the same with the ROC within the prescribed time limits.${AUTH}`,
    resolutionType: "ordinary",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 12 — BUSINESS EXPANSION AND STRATEGIC
══════════════════════════════════════════════════════════════════ */
const STRATEGIC: AgendaTemplate[] = [
  {
    id: "business_expansion",
    title: "Approval of Business Expansion Proposal",
    icon: "🚀", category: "strategic", categoryLabel: "Strategic Matters", categoryIcon: "🎯",
    fields: [
      { key: "expansionDetails", label: "Expansion Details", placeholder: "e.g. launch of new product line / entering new market" },
      { key: "estimatedInvestment", label: "Estimated Investment", placeholder: "e.g. ₹2,00,00,000" },
    ],
    discussion: approving(`the business expansion proposal for {expansionDetails} with an estimated investment of {estimatedInvestment}`),
    resolution: `RESOLVED THAT the business expansion proposal for {expansionDetails} with an estimated investment of {estimatedInvestment} be and is hereby approved in principle.\n\nRESOLVED FURTHER THAT the Managing Director be authorised to take all necessary steps for implementation.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "joint_venture",
    title: "Approval of Joint Venture Agreement",
    icon: "🤝", category: "strategic", categoryLabel: "Strategic Matters", categoryIcon: "🎯",
    fields: [
      { key: "jvPartnerName", label: "JV Partner Name", placeholder: "e.g. XYZ Corporation" },
      { key: "jvPurpose", label: "Purpose of JV", placeholder: "e.g. joint development of technology products" },
      { key: "jvContribution", label: "Company's Contribution", placeholder: "e.g. ₹1,00,00,000 (50%)" },
    ],
    discussion: approving(`entering into a Joint Venture Agreement with {jvPartnerName} for {jvPurpose} with a contribution of {jvContribution}`),
    resolution: `RESOLVED THAT the Company be and is hereby authorised to enter into a Joint Venture Agreement with {jvPartnerName} for {jvPurpose}, with the Company's contribution being {jvContribution}.\n\nRESOLVED FURTHER THAT the Managing Director be authorised to sign and execute all necessary agreements and documents.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "property_purchase_sale",
    title: "Approval of Purchase / Sale of Property",
    icon: "🏗️", category: "strategic", categoryLabel: "Strategic Matters", categoryIcon: "🎯",
    fields: [
      { key: "actionType", label: "Action Type", placeholder: "Purchase / Sale" },
      { key: "propertyDetails", label: "Property Details", placeholder: "e.g. Plot No. 45, Industrial Area, Pune" },
      { key: "propertyValue", label: "Transaction Value", placeholder: "e.g. ₹1,50,00,000" },
    ],
    discussion: approving(`{actionType} of property at {propertyDetails} for a consideration of {propertyValue}`),
    resolution: `RESOLVED THAT the {actionType} of property situated at {propertyDetails} for a consideration of {propertyValue} be and is hereby approved. The Managing Director be authorised to execute sale deed/purchase deed and all related documents.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "merger_amalgamation",
    title: "Approval of Merger / Amalgamation / Restructuring Proposal",
    icon: "🔀", category: "strategic", categoryLabel: "Strategic Matters", categoryIcon: "🎯",
    fields: [
      { key: "otherCompany", label: "Other Company Name", placeholder: "e.g. ABC Private Limited" },
      { key: "proposalType", label: "Type", placeholder: "Merger / Amalgamation / Demerger / Restructuring" },
    ],
    discussion: approving(`the {proposalType} proposal involving {otherCompany}. The Board discussed the strategic rationale, valuation and swap ratio and unanimously approved proceeding with the proposal`),
    resolution: `RESOLVED THAT the Board of Directors hereby approves in principle the {proposalType} of the Company with {otherCompany}, subject to satisfactory due diligence, approval of shareholders by way of Special Resolution at an Extra-Ordinary General Meeting, approval of creditors, sanction of the National Company Law Tribunal (NCLT) and such other regulatory / statutory approvals as may be required.\n\nRESOLVED FURTHER THAT the Board be and is hereby authorised to convene an Extra-Ordinary General Meeting for the purpose of obtaining approval of the shareholders by way of Special Resolution as required under Sections 230/232 of the Companies Act, 2013.\n\nRESOLVED FURTHER THAT the Managing Director be authorised to appoint legal advisors, merchant bankers, valuers and other professionals, file applications before NCLT and take all necessary steps.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "key_contracts",
    title: "Approval of Key Commercial Contracts",
    icon: "📄", category: "strategic", categoryLabel: "Strategic Matters", categoryIcon: "🎯",
    fields: [
      { key: "contractParty", label: "Contract Party", placeholder: "e.g. XYZ Limited" },
      { key: "contractNature", label: "Nature of Contract", placeholder: "e.g. supply agreement / service contract" },
      { key: "contractValue", label: "Contract Value", placeholder: "e.g. ₹75,00,000 per annum" },
    ],
    discussion: approving(`execution of a {contractNature} with {contractParty} for a value of {contractValue}`),
    resolution: `RESOLVED THAT the Company be and is hereby authorised to execute a {contractNature} with {contractParty} for {contractValue}. The Managing Director be authorised to sign and execute the agreement.${AUTH}`,
    resolutionType: "ordinary",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CLOSING MATTER
══════════════════════════════════════════════════════════════════ */
const CLOSING: AgendaTemplate[] = [
  {
    id: "vote_of_thanks",
    title: "Vote of Thanks — Close Meeting",
    icon: "🙏", category: "closing", categoryLabel: "Closing Matter", categoryIcon: "✅",
    fields: [],
    discussion: `There being no other business to transact, the Chairman thanked the Board Members and all invitees present for their valuable time and contribution. With the permission of the Board, the Chairman declared the meeting concluded.`,
    resolution: "", resolutionType: "none",
  },
];

/* ══════════════════════════════════════════════════════════════════
   EXPORT — ALL TEMPLATES COMBINED
══════════════════════════════════════════════════════════════════ */
export const ALL_AGENDA_TEMPLATES: AgendaTemplate[] = [
  ...ROUTINE,
  ...FINANCIAL,
  ...AUDITOR,
  ...DIRECTORS,
  ...SHARE_CAPITAL,
  ...GENERAL_MEETING,
  ...COMMITTEES,
  ...OFFICE,
  ...LEGAL,
  ...CSR,
  ...SECRETARIAL,
  ...STRATEGIC,
  ...CLOSING,
];

export const CATEGORY_ORDER = [
  "routine", "financial", "auditor", "directors",
  "shares", "gen_meeting", "committees", "office",
  "legal", "csr", "secretarial", "strategic", "closing",
];

export const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  routine:    { label: "Routine Matters",             icon: "🔄" },
  financial:  { label: "Financial & Banking",          icon: "💰" },
  auditor:    { label: "Auditor Matters",              icon: "🔍" },
  directors:  { label: "Directors & KMP",              icon: "👥" },
  shares:     { label: "Share Capital & Securities",   icon: "📈" },
  gen_meeting:{ label: "General Meeting",              icon: "🏛️" },
  committees: { label: "Committees",                   icon: "👥" },
  office:     { label: "Office & Branch",              icon: "🏢" },
  legal:      { label: "Legal & Compliance",           icon: "⚖️" },
  csr:        { label: "CSR Matters",                  icon: "🌿" },
  secretarial:{ label: "Secretarial & Annual",         icon: "📋" },
  strategic:  { label: "Strategic Matters",            icon: "🎯" },
  closing:    { label: "Closing Matter",               icon: "✅" },
};
