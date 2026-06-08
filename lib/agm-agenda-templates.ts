/* ══════════════════════════════════════════════════════════════════
   AGM AGENDA TEMPLATES — Annual General Meeting Minutes
   Companies Act 2013 + Secretarial Standard-2 (SS-2) Compliant
   Categories: 12 | Total Templates: ~65
══════════════════════════════════════════════════════════════════ */

export type ResolutionType = "ordinary" | "special" | "none";

export interface AgmAgendaField {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "date" | "number" | "textarea";
}

export interface AgmAgendaTemplate {
  id: string;
  title: string;
  icon: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  isOrdinaryBusiness?: boolean; // true = statutory mandatory ordinary business
  fields: AgmAgendaField[];
  discussion: string;
  resolution: string;
  resolutionType: ResolutionType;
  resolutionLaw?: string;
}

// ── Fill placeholders ────────────────────────────────────────────
export function fillAgmTemplate(template: string, fields: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => fields[key] || `[${key.toUpperCase()}]`);
}

// ── Standard authorisation line ──────────────────────────────────
const AUTH = `\n\nRESOLVED FURTHER THAT any Director or the Company Secretary of the Company be and is hereby severally authorised to do all such acts, deeds and things as may be necessary to give effect to the above Resolution.`;

// ── Helper functions ─────────────────────────────────────────────
function noting(what: string): string {
  return `The Chairman informed the Members that ${what}. The Members, after deliberation, took note of the same.`;
}
function approving(what: string, extra = ""): string {
  return `The Chairman placed before the Meeting ${what}.${extra ? " " + extra : ""} After deliberation, the Resolution was put to vote and passed with the requisite majority.`;
}

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 1 — ROUTINE / OPENING MATTERS
══════════════════════════════════════════════════════════════════ */
const ROUTINE: AgmAgendaTemplate[] = [
  {
    id: "agm_chairman",
    title: "Election / Confirmation of Chairman of AGM",
    icon: "👑",
    category: "routine", categoryLabel: "Routine / Opening Matters", categoryIcon: "🔄",
    fields: [],
    discussion: `As per the provisions of Section 104 of the Companies Act, 2013 read with the Articles of Association of the Company and Secretarial Standard-2 (SS-2), the Board of Directors' nominee, being the Chairman of the Board, took the Chair and presided over the Meeting as Chairman. The Chairman welcomed all the Members and thanked them for their presence.`,
    resolution: "", resolutionType: "none",
  },
  {
    id: "agm_quorum",
    title: "Ascertainment of Quorum",
    icon: "🔢",
    category: "routine", categoryLabel: "Routine / Opening Matters", categoryIcon: "🔄",
    fields: [],
    discussion: noting(`the requisite quorum as required under Section 103 of the Companies Act, 2013 read with Secretarial Standard-2 (SS-2) was present at the commencement of the Meeting. The Annual General Meeting was duly constituted and the proceedings commenced`),
    resolution: "", resolutionType: "none",
  },
  {
    id: "agm_notice_read",
    title: "Notice of AGM Taken as Read",
    icon: "📨",
    category: "routine", categoryLabel: "Routine / Opening Matters", categoryIcon: "🔄",
    fields: [
      { key: "noticeDate", label: "Date of Notice", placeholder: "e.g. 01 September 2025", type: "date" },
    ],
    discussion: `With the consent of the Members present, the Notice convening the Annual General Meeting dated {noticeDate} was taken as read. The Chairman informed the Members that the Notice had been duly circulated to all eligible Members of the Company.`,
    resolution: "", resolutionType: "none",
  },
  {
    id: "agm_reports_read",
    title: "Directors' Report and Auditors' Report Taken as Read",
    icon: "📄",
    category: "routine", categoryLabel: "Routine / Opening Matters", categoryIcon: "🔄",
    fields: [{ key: "fy", label: "Financial Year", placeholder: "e.g. 2024-25" }],
    discussion: `With the consent of the Members present, the Directors' Report and the Auditors' Report for the Financial Year {fy} were taken as read. The Chairman informed the Members that the said Reports had been circulated along with the Notice of the Meeting.`,
    resolution: "", resolutionType: "none",
  },
  {
    id: "agm_proxy_noting",
    title: "Noting of Proxies Received",
    icon: "📝",
    category: "routine", categoryLabel: "Routine / Opening Matters", categoryIcon: "🔄",
    fields: [
      { key: "proxyCount", label: "No. of Proxy Forms Received", placeholder: "e.g. 3" },
      { key: "sharesRepresented", label: "No. of Shares Represented by Proxies", placeholder: "e.g. 15,000" },
    ],
    discussion: noting(`{proxyCount} proxy form(s) representing {sharesRepresented} equity shares had been duly received by the Company before 48 hours of the Meeting as required under Section 105 of the Companies Act, 2013`),
    resolution: "", resolutionType: "none",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 2 — ORDINARY BUSINESS (Mandatory Statutory Items)
   These 4 items are required at every AGM under Companies Act 2013
══════════════════════════════════════════════════════════════════ */
const ORDINARY_BUSINESS: AgmAgendaTemplate[] = [
  {
    id: "agm_adopt_accounts",
    title: "Item 1 — Adoption of Annual Financial Statements",
    icon: "📊",
    category: "ordinary_biz", categoryLabel: "Ordinary Business (Statutory)", categoryIcon: "📋",
    isOrdinaryBusiness: true,
    fields: [
      { key: "fy", label: "Financial Year", placeholder: "e.g. 2024-25" },
      { key: "balanceSheetDate", label: "Balance Sheet Date", placeholder: "e.g. 31 March 2025", type: "date" },
    ],
    discussion: `The Chairman placed before the Meeting the Audited Financial Statements of the Company for the Financial Year ended {balanceSheetDate}, comprising the Balance Sheet, the Statement of Profit and Loss, the Cash Flow Statement, the Statement of Changes in Equity (wherever applicable), and the Notes thereon, together with the Reports of the Board of Directors and the Auditors thereon. The Chairman invited the Members to raise queries, if any, on the said Statements. After discussion, the Resolution was put to vote.`,
    resolution: `RESOLVED THAT the Audited Financial Statements of the Company for the Financial Year {fy} ended {balanceSheetDate}, comprising the Balance Sheet, Statement of Profit & Loss, Cash Flow Statement and Notes thereon, together with the Reports of the Board of Directors and the Auditors thereon, as laid before the Meeting, be and are hereby adopted.`,
    resolutionType: "ordinary",
    resolutionLaw: "Sec. 129(2) & 134 — Companies Act, 2013",
  },
  {
    id: "agm_dividend",
    title: "Item 2 — Declaration of Final Dividend",
    icon: "💸",
    category: "ordinary_biz", categoryLabel: "Ordinary Business (Statutory)", categoryIcon: "📋",
    isOrdinaryBusiness: true,
    fields: [
      { key: "dividendRate", label: "Dividend Rate", placeholder: "e.g. 10% i.e. ₹1 per share of ₹10 each" },
      { key: "fy", label: "Financial Year", placeholder: "e.g. 2024-25" },
      { key: "paymentDate", label: "Payment Date", placeholder: "e.g. on or before 30 October 2025", type: "date" },
      { key: "recordDate", label: "Record Date / Book Closure Date", placeholder: "e.g. 15 September 2025" },
    ],
    discussion: `The Chairman informed the Members that the Board of Directors had recommended a Final Dividend at the rate of {dividendRate} for the Financial Year {fy}. The Chairman stated that the dividend, if approved, would be paid to the Members whose names appear in the Register of Members / list of Beneficial Owners as on {recordDate}.`,
    resolution: `RESOLVED THAT a Final Dividend at the rate of {dividendRate} for the Financial Year {fy} be and is hereby declared out of the profits of the Company for the said year.\n\nRESOLVED FURTHER THAT the said Dividend shall be paid on or before {paymentDate} to those Members whose names appear in the Register of Members / list of Beneficial Owners as on {recordDate}.`,
    resolutionType: "ordinary",
    resolutionLaw: "Sec. 123 — Companies Act, 2013",
  },
  {
    id: "agm_dir_reappt",
    title: "Item 3 — Re-appointment of Director Retiring by Rotation",
    icon: "🔄",
    category: "ordinary_biz", categoryLabel: "Ordinary Business (Statutory)", categoryIcon: "📋",
    isOrdinaryBusiness: true,
    fields: [
      { key: "dirName", label: "Director Name", placeholder: "e.g. Mr. Rajesh Kumar Sharma" },
      { key: "dirDin", label: "DIN", placeholder: "e.g. 01234567" },
      { key: "dirDesig", label: "Designation", placeholder: "e.g. Director" },
    ],
    discussion: `The Chairman informed the Members that as per the provisions of Section 152(6) of the Companies Act, 2013, {dirName} (DIN: {dirDin}), {dirDesig}, retires by rotation at this Annual General Meeting and being eligible, offers himself/herself for re-appointment. The Chairman presented the brief profile of the Director as provided in the Notice. The Resolution was put to vote.`,
    resolution: `RESOLVED THAT pursuant to the provisions of Section 152(6) and other applicable provisions of the Companies Act, 2013, {dirName} (DIN: {dirDin}), who retires by rotation and being eligible, offers himself/herself for re-appointment, be and is hereby re-appointed as a Director of the Company, liable to retire by rotation.`,
    resolutionType: "ordinary",
    resolutionLaw: "Sec. 152(6) — Companies Act, 2013",
  },
  {
    id: "agm_auditor_appt",
    title: "Item 4 — Appointment / Ratification of Statutory Auditor",
    icon: "🔍",
    category: "ordinary_biz", categoryLabel: "Ordinary Business (Statutory)", categoryIcon: "📋",
    isOrdinaryBusiness: true,
    fields: [
      { key: "auditorName", label: "Auditor / Firm Name", placeholder: "e.g. M/s ABC & Associates" },
      { key: "auditorRegNo", label: "ICAI Firm Reg. No.", placeholder: "e.g. 123456W" },
      { key: "fromFY", label: "From FY", placeholder: "e.g. 2025-26" },
      { key: "toFY", label: "To FY / Till conclusion of AGM", placeholder: "e.g. 2029-30" },
      { key: "remuneration", label: "Remuneration", placeholder: "e.g. as mutually agreed" },
    ],
    discussion: `The Chairman informed the Members about the proposal for appointment/re-appointment of {auditorName} (ICAI Firm Reg. No. {auditorRegNo}), Chartered Accountants, as the Statutory Auditors of the Company for a term from FY {fromFY} to FY {toFY} as recommended by the Audit Committee and the Board of Directors. It was noted that the firm has given its consent and confirmed its eligibility under Section 141 of the Act. The Resolution was put to vote.`,
    resolution: `RESOLVED THAT pursuant to the provisions of Section 139, 142 and other applicable provisions of the Companies Act, 2013, read with the Companies (Audit and Auditors) Rules, 2014, {auditorName} (ICAI Firm Reg. No. {auditorRegNo}), Chartered Accountants, be and are hereby appointed as the Statutory Auditors of the Company for a period from the conclusion of this Annual General Meeting till the conclusion of the Annual General Meeting for the Financial Year {toFY}, to examine and audit the accounts of the Company at a remuneration of {remuneration} plus applicable taxes and out-of-pocket expenses as may be agreed upon between the Auditors and the Board of Directors.${AUTH}`,
    resolutionType: "ordinary",
    resolutionLaw: "Sec. 139 — Companies Act, 2013",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 3 — SPECIAL BUSINESS: DIRECTORS & KMP
══════════════════════════════════════════════════════════════════ */
const SPECIAL_DIRECTORS: AgmAgendaTemplate[] = [
  {
    id: "agm_appt_independent",
    title: "Appointment of Independent Director",
    icon: "🧑‍⚖️",
    category: "sp_directors", categoryLabel: "Special Business — Directors & KMP", categoryIcon: "👥",
    fields: [
      { key: "dirName", label: "Director Name", placeholder: "e.g. Mr. Suresh Mehta" },
      { key: "dirDin", label: "DIN", placeholder: "e.g. 09876543" },
      { key: "termYears", label: "Term (consecutive years)", placeholder: "e.g. 5" },
      { key: "effectiveDate", label: "Effective Date", placeholder: "e.g. 01 October 2025", type: "date" },
    ],
    discussion: approving(`the appointment of {dirName} (DIN: {dirDin}) as an Independent Director of the Company for a term of {termYears} consecutive years from {effectiveDate}, as recommended by the Nomination and Remuneration Committee and the Board of Directors. The brief profile of the Director was provided in the Notice. It was noted that {dirName} has submitted a declaration confirming independence under Section 149(6) of the Act`),
    resolution: `RESOLVED THAT pursuant to Sections 149, 150, 152 and Schedule IV and other applicable provisions of the Companies Act, 2013 and the Companies (Appointment and Qualification of Directors) Rules, 2014 (including any statutory modification or re-enactment thereof), {dirName} (DIN: {dirDin}), who has submitted a declaration that he/she meets the criteria of independence as provided in Section 149(6) of the Act, be and is hereby appointed as an Independent Director of the Company, to hold office for a term of {termYears} consecutive years commencing from {effectiveDate}, not liable to retire by rotation.${AUTH}`,
    resolutionType: "ordinary",
    resolutionLaw: "Sec. 149/150/152 — Companies Act, 2013",
  },
  {
    id: "agm_reappt_independent_second_term",
    title: "Re-appointment of Independent Director (2nd Term — Special Resolution)",
    icon: "🔁",
    category: "sp_directors", categoryLabel: "Special Business — Directors & KMP", categoryIcon: "👥",
    fields: [
      { key: "dirName", label: "Director Name", placeholder: "e.g. Mr. Suresh Mehta" },
      { key: "dirDin", label: "DIN", placeholder: "e.g. 09876543" },
      { key: "termYears", label: "Term (consecutive years)", placeholder: "e.g. 5" },
      { key: "effectiveDate", label: "Effective Date", placeholder: "e.g. 01 October 2025", type: "date" },
    ],
    discussion: approving(`the re-appointment of {dirName} (DIN: {dirDin}) as an Independent Director for a second consecutive term of {termYears} years from {effectiveDate}, as recommended by the NRC and Board. It was stated that for the second term, a Special Resolution is required as per Section 149(10) of the Act`),
    resolution: `RESOLVED THAT pursuant to Sections 149, 150, 152 and Schedule IV and other applicable provisions of the Companies Act, 2013, {dirName} (DIN: {dirDin}), who has submitted a declaration meeting the independence criteria under Section 149(6) and has completed his/her first term as Independent Director, be and is hereby re-appointed as an Independent Director of the Company for a second consecutive term of {termYears} years commencing from {effectiveDate}, not liable to retire by rotation.${AUTH}`,
    resolutionType: "special",
    resolutionLaw: "Sec. 149(10) — Second Term requires Special Resolution",
  },
  {
    id: "agm_appt_md_wrd",
    title: "Appointment / Re-appointment of MD / WTD",
    icon: "👔",
    category: "sp_directors", categoryLabel: "Special Business — Directors & KMP", categoryIcon: "👥",
    fields: [
      { key: "personName", label: "Person Name", placeholder: "e.g. Mr. Amit Sharma" },
      { key: "designation", label: "Designation", placeholder: "e.g. Managing Director / Whole-Time Director" },
      { key: "din", label: "DIN", placeholder: "e.g. 01234567" },
      { key: "remuneration", label: "Remuneration", placeholder: "e.g. ₹5,00,000 per month" },
      { key: "term", label: "Term", placeholder: "e.g. 3 years" },
      { key: "effectiveDate", label: "Effective Date", placeholder: "e.g. 01 October 2025", type: "date" },
    ],
    discussion: approving(`the appointment/re-appointment of {personName} (DIN: {din}) as {designation} of the Company for a period of {term} with effect from {effectiveDate} at a remuneration of {remuneration}, as recommended by the NRC and approved by the Board`),
    resolution: `RESOLVED THAT pursuant to Sections 196, 197, 198 and Schedule V and other applicable provisions of the Companies Act, 2013, read with the Companies (Appointment and Remuneration of Managerial Personnel) Rules, 2014, {personName} (DIN: {din}) be and is hereby appointed/re-appointed as {designation} of the Company for a period of {term} with effect from {effectiveDate} at a remuneration of {remuneration} per month plus perquisites and allowances as per the terms of the Agreement to be executed between the Company and {personName}.${AUTH}`,
    resolutionType: "ordinary",
    resolutionLaw: "Sec. 196/197/Schedule V — Companies Act, 2013",
  },
  {
    id: "agm_director_remuneration",
    title: "Commission / Remuneration to Non-Executive Directors",
    icon: "💵",
    category: "sp_directors", categoryLabel: "Special Business — Directors & KMP", categoryIcon: "👥",
    fields: [
      { key: "commissionPct", label: "Commission Percentage", placeholder: "e.g. 1% of net profits" },
      { key: "fy", label: "Applicable from FY", placeholder: "e.g. 2025-26" },
      { key: "validForYears", label: "Valid for (years)", placeholder: "e.g. 5 years" },
    ],
    discussion: approving(`payment of commission to the Non-Executive Directors at the rate of {commissionPct} per annum with effect from FY {fy} for a period of {validForYears} as approved by the Board`),
    resolution: `RESOLVED THAT pursuant to Sections 197, 198 and other applicable provisions of the Companies Act, 2013, the Members hereby approve payment of commission to the Non-Executive Directors of the Company at a rate not exceeding {commissionPct} of the net profits of the Company, computed in the manner laid down in Section 198 of the Act, with effect from Financial Year {fy} for a period of {validForYears}.${AUTH}`,
    resolutionType: "ordinary",
    resolutionLaw: "Sec. 197/198 — Companies Act, 2013",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 4 — SPECIAL BUSINESS: AUDITOR RELATED
══════════════════════════════════════════════════════════════════ */
const SPECIAL_AUDITOR: AgmAgendaTemplate[] = [
  {
    id: "agm_ratify_cost_auditor",
    title: "Ratification of Remuneration of Cost Auditor",
    icon: "💹",
    category: "sp_auditor", categoryLabel: "Special Business — Auditor", categoryIcon: "🔍",
    fields: [
      { key: "costAuditorName", label: "Cost Auditor Name", placeholder: "e.g. M/s Cost Audit Firm" },
      { key: "remuneration", label: "Remuneration", placeholder: "e.g. ₹1,00,000" },
      { key: "fy", label: "Financial Year", placeholder: "e.g. 2025-26" },
    ],
    discussion: approving(`the ratification of remuneration of {costAuditorName} appointed as Cost Auditor by the Board for FY {fy} at a remuneration of {remuneration}`),
    resolution: `RESOLVED THAT pursuant to Section 148(3) and other applicable provisions of the Companies Act, 2013 read with the Companies (Audit and Auditors) Rules, 2014, the remuneration of {remuneration} plus applicable taxes as payable to {costAuditorName}, Cost Auditors appointed by the Board of Directors for the Financial Year {fy}, be and is hereby ratified and confirmed.${AUTH}`,
    resolutionType: "ordinary",
    resolutionLaw: "Sec. 148(3) — Companies Act, 2013",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 5 — SPECIAL BUSINESS: SHARE CAPITAL
══════════════════════════════════════════════════════════════════ */
const SPECIAL_SHARES: AgmAgendaTemplate[] = [
  {
    id: "agm_increase_auth_capital",
    title: "Increase in Authorised Share Capital & MOA Alteration",
    icon: "⬆️",
    category: "sp_shares", categoryLabel: "Special Business — Share Capital", categoryIcon: "📈",
    fields: [
      { key: "existingCapital", label: "Existing Authorised Capital", placeholder: "e.g. ₹1,00,00,000" },
      { key: "proposedCapital", label: "Proposed Authorised Capital", placeholder: "e.g. ₹5,00,00,000" },
      { key: "newSharesDesc", label: "New Capital Structure", placeholder: "e.g. 50,00,000 equity shares of ₹10 each" },
    ],
    discussion: approving(`the increase in Authorised Share Capital of the Company from {existingCapital} to {proposedCapital} divided into {newSharesDesc} and consequential alteration of Clause V of the Memorandum of Association`),
    resolution: `RESOLVED THAT pursuant to Sections 61, 13 and other applicable provisions of the Companies Act, 2013, and the rules made thereunder, the Authorised Share Capital of the Company be increased from {existingCapital} to {proposedCapital} by creation of new shares.\n\nRESOLVED FURTHER THAT consequently, Clause V of the Memorandum of Association of the Company be altered as follows:\n"The Authorised Share Capital of the Company is {proposedCapital} divided into {newSharesDesc}."\n\nRESOLVED FURTHER THAT the Directors and the Company Secretary be authorised to file Form SH-7 and MGT-14 with the ROC.${AUTH}`,
    resolutionType: "special",
    resolutionLaw: "Sec. 61 & 13 — Special Resolution required",
  },
  {
    id: "agm_preferential_allotment",
    title: "Issue of Shares by Preferential Allotment",
    icon: "🎯",
    category: "sp_shares", categoryLabel: "Special Business — Share Capital", categoryIcon: "📈",
    fields: [
      { key: "noOfShares", label: "No. of Shares", placeholder: "e.g. 1,00,000" },
      { key: "issuePrice", label: "Issue Price", placeholder: "e.g. ₹15 per share" },
      { key: "allotteeNames", label: "Allottee(s)", placeholder: "e.g. specified investors / promoters" },
      { key: "allotmentDate", label: "Allotment Within", placeholder: "e.g. 60 days from date of passing of this resolution" },
    ],
    discussion: approving(`issue of {noOfShares} Equity Shares at an Issue Price of {issuePrice} per share on Preferential basis to {allotteeNames}`),
    resolution: `RESOLVED THAT pursuant to Section 62(1)(c), 42 and other applicable provisions of the Companies Act, 2013, read with the Companies (Share Capital and Debentures) Rules, 2014, and subject to compliance with applicable SEBI regulations, if any, the consent of the Members be and is hereby accorded to issue and allot up to {noOfShares} Equity Shares at a price of {issuePrice} per share (including premium, if any) on a Preferential basis to {allotteeNames}, within {allotmentDate}.${AUTH}`,
    resolutionType: "special",
    resolutionLaw: "Sec. 62(1)(c) — Special Resolution required",
  },
  {
    id: "agm_esop",
    title: "Approval of Employees Stock Option Plan (ESOP)",
    icon: "🏅",
    category: "sp_shares", categoryLabel: "Special Business — Share Capital", categoryIcon: "📈",
    fields: [
      { key: "esopName", label: "ESOP Scheme Name", placeholder: "e.g. ESOP Scheme 2025" },
      { key: "optionGrants", label: "Max Options to Grant", placeholder: "e.g. 5,00,000 options" },
      { key: "exercisePrice", label: "Exercise Price", placeholder: "e.g. ₹10 per share / face value / market price" },
    ],
    discussion: approving(`the introduction and implementation of {esopName} under which up to {optionGrants} options may be granted to eligible employees at an exercise price of {exercisePrice}`),
    resolution: `RESOLVED THAT pursuant to Section 62(1)(b) and other applicable provisions of the Companies Act, 2013, read with the Companies (Share Capital and Debentures) Rules, 2014, the Members hereby approve the introduction of {esopName} under which up to {optionGrants} options may be granted to eligible employees convertible into equity shares of the Company at an exercise price of {exercisePrice}, on such terms and conditions as the Board / NRC may determine.${AUTH}`,
    resolutionType: "special",
    resolutionLaw: "Sec. 62(1)(b) — Special Resolution required",
  },
  {
    id: "agm_buyback",
    title: "Buy-back of Equity Shares",
    icon: "🔙",
    category: "sp_shares", categoryLabel: "Special Business — Share Capital", categoryIcon: "📈",
    fields: [
      { key: "buybackShares", label: "Max Shares to Buy-back", placeholder: "e.g. 5,00,000 shares" },
      { key: "buybackPrice", label: "Maximum Price", placeholder: "e.g. ₹100 per share" },
      { key: "buybackAmount", label: "Total Buyback Amount", placeholder: "e.g. ₹5,00,00,000" },
      { key: "buybackMethod", label: "Mode of Buy-back", placeholder: "e.g. Open Market / Tender Offer" },
    ],
    discussion: approving(`the buy-back of up to {buybackShares} equity shares of the Company at a maximum price of {buybackPrice} per share for an aggregate amount not exceeding {buybackAmount} through {buybackMethod}`),
    resolution: `RESOLVED THAT pursuant to Section 68, 69, 70 and other applicable provisions of the Companies Act, 2013 and the Companies (Share Capital and Debentures) Rules, 2014, the consent of the Members be and is hereby accorded for Buy-back of up to {buybackShares} fully paid-up equity shares of the Company at a price not exceeding {buybackPrice} per share for an aggregate consideration not exceeding {buybackAmount}, from the open market through {buybackMethod}.${AUTH}`,
    resolutionType: "special",
    resolutionLaw: "Sec. 68 — Special Resolution required",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 6 — SPECIAL BUSINESS: BORROWING & SECURITY
══════════════════════════════════════════════════════════════════ */
const SPECIAL_BORROWING: AgmAgendaTemplate[] = [
  {
    id: "agm_borrowing_limit",
    title: "Increase in Borrowing Limits (Sec. 180(1)(c))",
    icon: "🏦",
    category: "sp_borrowing", categoryLabel: "Special Business — Borrowing", categoryIcon: "💳",
    fields: [
      { key: "borrowingLimit", label: "Proposed Borrowing Limit", placeholder: "e.g. ₹50,00,00,000 (₹50 Crore)" },
      { key: "paidUpCapital", label: "Paid-up Capital + Free Reserves", placeholder: "e.g. ₹10,00,00,000" },
    ],
    discussion: approving(`increase in the borrowing limits of the Company beyond its paid-up capital and free reserves up to {borrowingLimit} as required under Section 180(1)(c) of the Act`),
    resolution: `RESOLVED THAT pursuant to Section 180(1)(c) and other applicable provisions of the Companies Act, 2013, and in supersession of all earlier resolutions passed in this regard, the Members hereby accord their consent to the Board of Directors to borrow moneys in excess of the aggregate of paid-up share capital, free reserves and securities premium of the Company, provided that the total borrowings shall not at any time exceed {borrowingLimit}.${AUTH}`,
    resolutionType: "special",
    resolutionLaw: "Sec. 180(1)(c) — Special Resolution required",
  },
  {
    id: "agm_create_security",
    title: "Approval to Create Security on Company Assets (Sec. 180(1)(a))",
    icon: "🔒",
    category: "sp_borrowing", categoryLabel: "Special Business — Borrowing", categoryIcon: "💳",
    fields: [
      { key: "securityLimit", label: "Maximum Security Amount", placeholder: "e.g. ₹50,00,00,000" },
    ],
    discussion: approving(`creation of mortgage, charge, pledge or hypothecation on the properties and assets of the Company for securing borrowings up to {securityLimit}`),
    resolution: `RESOLVED THAT pursuant to Section 180(1)(a) and other applicable provisions of the Companies Act, 2013, consent of the Members be and is hereby accorded to the Board of Directors to create mortgage, charge, pledge, hypothecation or encumbrance on all or any of the immoveable and moveable properties of the Company for securing borrowings up to a limit of {securityLimit}.${AUTH}`,
    resolutionType: "special",
    resolutionLaw: "Sec. 180(1)(a) — Special Resolution required",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 7 — SPECIAL BUSINESS: RELATED PARTY TRANSACTIONS
══════════════════════════════════════════════════════════════════ */
const SPECIAL_RPT: AgmAgendaTemplate[] = [
  {
    id: "agm_rpt_ordinary",
    title: "Approval of Material Related Party Transactions",
    icon: "🤝",
    category: "sp_rpt", categoryLabel: "Special Business — Related Party", categoryIcon: "🤝",
    fields: [
      { key: "relatedParty", label: "Related Party Name", placeholder: "e.g. XYZ Private Limited" },
      { key: "relationship", label: "Nature of Relationship", placeholder: "e.g. Subsidiary / Associate" },
      { key: "transactionNature", label: "Nature of Transaction", placeholder: "e.g. sale of goods / services" },
      { key: "transactionValue", label: "Transaction Value", placeholder: "e.g. ₹50,00,00,000 per annum" },
    ],
    discussion: approving(`the material Related Party Transaction with {relatedParty} ({relationship}) for {transactionNature} amounting to {transactionValue} per annum. The Audit Committee and Board have already approved the same. The related party / interested members did not vote on this resolution`),
    resolution: `RESOLVED THAT pursuant to Section 188 and other applicable provisions of the Companies Act, 2013, and Regulation 23 of SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015 (wherever applicable), the Members hereby accord approval for entering into material Related Party Transaction(s) with {relatedParty} ({relationship}) for {transactionNature} for a value not exceeding {transactionValue} per annum, on arm's length basis and in the ordinary course of business.${AUTH}`,
    resolutionType: "ordinary",
    resolutionLaw: "Sec. 188 — Companies Act, 2013",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 8 — SPECIAL BUSINESS: MOA / AOA AMENDMENTS
══════════════════════════════════════════════════════════════════ */
const SPECIAL_MOA_AOA: AgmAgendaTemplate[] = [
  {
    id: "agm_alter_moa",
    title: "Alteration of Memorandum of Association",
    icon: "📜",
    category: "sp_moa_aoa", categoryLabel: "Special Business — MOA / AOA", categoryIcon: "📃",
    fields: [
      { key: "clauseNo", label: "Clause No. to be Altered", placeholder: "e.g. Clause III (Objects Clause)" },
      { key: "alterationDetails", label: "Nature of Alteration", placeholder: "e.g. addition of new business activity" },
    ],
    discussion: approving(`the alteration of {clauseNo} of the Memorandum of Association of the Company to include {alterationDetails}`),
    resolution: `RESOLVED THAT pursuant to Sections 13 and other applicable provisions of the Companies Act, 2013, {clauseNo} of the Memorandum of Association of the Company be and is hereby altered to include/substitute/delete the following:\n\n[{alterationDetails}]\n\nRESOLVED FURTHER THAT the Company Secretary be authorised to file Form MGT-14 with the Registrar of Companies.${AUTH}`,
    resolutionType: "special",
    resolutionLaw: "Sec. 13 — Special Resolution required",
  },
  {
    id: "agm_alter_aoa",
    title: "Alteration of Articles of Association",
    icon: "📋",
    category: "sp_moa_aoa", categoryLabel: "Special Business — MOA / AOA", categoryIcon: "📃",
    fields: [
      { key: "articleNo", label: "Article No. to be Altered", placeholder: "e.g. Article 45" },
      { key: "alterationDetails", label: "Nature of Alteration", placeholder: "e.g. amendment to quorum clause" },
    ],
    discussion: approving(`the alteration of {articleNo} of the Articles of Association of the Company as detailed in the Notice`),
    resolution: `RESOLVED THAT pursuant to Section 14 and other applicable provisions of the Companies Act, 2013, {articleNo} of the Articles of Association of the Company be and is hereby altered as follows:\n\n[{alterationDetails}]\n\nRESOLVED FURTHER THAT the Company Secretary be authorised to file Form MGT-14 with the Registrar of Companies.${AUTH}`,
    resolutionType: "special",
    resolutionLaw: "Sec. 14 — Special Resolution required",
  },
  {
    id: "agm_change_name",
    title: "Change of Name of the Company",
    icon: "🏷️",
    category: "sp_moa_aoa", categoryLabel: "Special Business — MOA / AOA", categoryIcon: "📃",
    fields: [
      { key: "existingName", label: "Existing Company Name", placeholder: "e.g. ABC Enterprises Private Limited" },
      { key: "proposedName", label: "Proposed New Name", placeholder: "e.g. XYZ Innovations Private Limited" },
    ],
    discussion: approving(`the change of name of the Company from '{existingName}' to '{proposedName}', subject to approval of the Registrar of Companies and Central Government, wherever applicable`),
    resolution: `RESOLVED THAT pursuant to Sections 13, 16 and other applicable provisions of the Companies Act, 2013, the name of the Company be changed from '{existingName}' to '{proposedName}', subject to the approval of the Registrar of Companies, and that the Memorandum and Articles of Association of the Company be altered accordingly.${AUTH}`,
    resolutionType: "special",
    resolutionLaw: "Sec. 13/16 — Special Resolution + RoC approval required",
  },
  {
    id: "agm_shift_reg_office",
    title: "Shifting of Registered Office (Outside State)",
    icon: "🏢",
    category: "sp_moa_aoa", categoryLabel: "Special Business — MOA / AOA", categoryIcon: "📃",
    fields: [
      { key: "fromState", label: "Current State", placeholder: "e.g. Maharashtra" },
      { key: "toState", label: "New State", placeholder: "e.g. Karnataka" },
      { key: "newAddress", label: "New Registered Address", placeholder: "e.g. 201, Tech Park, Bengaluru - 560001" },
    ],
    discussion: approving(`the shifting of Registered Office of the Company from the State of {fromState} to the State of {toState} at {newAddress}`),
    resolution: `RESOLVED THAT pursuant to Sections 13(4), 12 and other applicable provisions of the Companies Act, 2013, the Registered Office of the Company be shifted from the State of {fromState} to the State of {toState} and be located at {newAddress}, subject to the approval of the Regional Director / Central Government.${AUTH}`,
    resolutionType: "special",
    resolutionLaw: "Sec. 13(4) — Special Resolution + Regional Director approval",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 9 — SPECIAL BUSINESS: CORPORATE GOVERNANCE & CSR
══════════════════════════════════════════════════════════════════ */
const SPECIAL_GOVERNANCE: AgmAgendaTemplate[] = [
  {
    id: "agm_csr_policy_note",
    title: "Noting of CSR Policy and Annual CSR Report",
    icon: "🌱",
    category: "sp_governance", categoryLabel: "Special Business — Governance & CSR", categoryIcon: "⚙️",
    fields: [{ key: "fy", label: "Financial Year", placeholder: "e.g. 2024-25" }],
    discussion: noting(`the CSR Policy of the Company and the Annual Report on CSR activities for FY {fy} as included in the Board's Report. The Members noted the CSR expenditure and activities carried out during the year`),
    resolution: "", resolutionType: "none",
  },
  {
    id: "agm_fcra",
    title: "Approval for Receiving Foreign Donations (FCRA — NGOs / Section 8)",
    icon: "🌏",
    category: "sp_governance", categoryLabel: "Special Business — Governance & CSR", categoryIcon: "⚙️",
    fields: [
      { key: "foreignDonorName", label: "Foreign Donor / Organisation", placeholder: "e.g. XYZ Foundation, USA" },
      { key: "donationAmount", label: "Amount / Purpose", placeholder: "e.g. USD 50,000 for educational activities" },
    ],
    discussion: approving(`receipt of foreign contribution from {foreignDonorName} amounting to {donationAmount} in compliance with the Foreign Contribution (Regulation) Act, 2010`),
    resolution: `RESOLVED THAT pursuant to the Foreign Contribution (Regulation) Act, 2010 and Rules thereunder, the Company/Society be and is hereby authorised to receive foreign contribution from {foreignDonorName} amounting to {donationAmount} and to utilise the same in accordance with the FCRA registration and applicable guidelines.${AUTH}`,
    resolutionType: "special",
    resolutionLaw: "FCRA 2010 — applicable to Section 8 Companies / NGOs",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 10 — SPECIAL BUSINESS: LOANS & INVESTMENTS
══════════════════════════════════════════════════════════════════ */
const SPECIAL_LOANS: AgmAgendaTemplate[] = [
  {
    id: "agm_intercorporate_loans",
    title: "Approval of Inter-Corporate Loans / Investments (Sec. 186)",
    icon: "💱",
    category: "sp_loans", categoryLabel: "Special Business — Loans & Investments", categoryIcon: "💰",
    fields: [
      { key: "beneficiaryName", label: "Beneficiary Company", placeholder: "e.g. ABC Subsidiary Pvt. Ltd." },
      { key: "loanAmount", label: "Loan / Investment Amount", placeholder: "e.g. ₹10,00,00,000" },
      { key: "purpose", label: "Purpose", placeholder: "e.g. working capital / acquisition" },
    ],
    discussion: approving(`inter-corporate loan/investment of {loanAmount} to/in {beneficiaryName} for the purpose of {purpose}, exceeding the limits specified under Section 186`),
    resolution: `RESOLVED THAT pursuant to Section 186 and other applicable provisions of the Companies Act, 2013, and subject to such approvals as may be necessary, the Members hereby accord their consent for the Company to grant loans / provide guarantees / make investments in {beneficiaryName} up to an aggregate amount not exceeding {loanAmount} for the purpose of {purpose}.${AUTH}`,
    resolutionType: "special",
    resolutionLaw: "Sec. 186 — Special Resolution if exceeds prescribed limits",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 11 — SPECIAL BUSINESS: MERGER / RESTRUCTURING
══════════════════════════════════════════════════════════════════ */
const SPECIAL_MERGER: AgmAgendaTemplate[] = [
  {
    id: "agm_merger",
    title: "Approval of Merger / Amalgamation Scheme",
    icon: "🔀",
    category: "sp_merger", categoryLabel: "Special Business — Merger / Restructuring", categoryIcon: "🔀",
    fields: [
      { key: "otherCompany", label: "Transferor / Transferee Company", placeholder: "e.g. DEF Private Limited" },
      { key: "proposalType", label: "Type", placeholder: "e.g. Merger / Amalgamation / Demerger" },
      { key: "swapRatio", label: "Swap Ratio / Consideration", placeholder: "e.g. 1:1 share swap / Cash consideration of ₹X" },
    ],
    discussion: approving(`the Scheme of {proposalType} of the Company with {otherCompany} with a swap ratio / consideration of {swapRatio}, as approved by the Board. It was noted that the Scheme is subject to approval of NCLT and other regulatory authorities`),
    resolution: `RESOLVED THAT pursuant to Sections 230, 232 and other applicable provisions of the Companies Act, 2013, the Scheme of {proposalType} of the Company with {otherCompany} with a swap ratio/consideration of {swapRatio}, as circulated to the Members along with the Notice, be and is hereby approved.\n\nRESOLVED FURTHER THAT the Directors and Company Secretary be authorised to file the petition before the National Company Law Tribunal (NCLT) and take all necessary steps.${AUTH}`,
    resolutionType: "special",
    resolutionLaw: "Sec. 230/232 — Special Resolution + NCLT approval required",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 12 — CLOSING MATTERS
══════════════════════════════════════════════════════════════════ */
const CLOSING: AgmAgendaTemplate[] = [
  {
    id: "agm_q_and_a",
    title: "Questions and Answers / General Discussion",
    icon: "💬",
    category: "closing", categoryLabel: "Closing Matters", categoryIcon: "✅",
    fields: [],
    discussion: `The Chairman invited queries from the Members. Members present raised certain queries regarding business performance, future plans and other matters. The Chairman / Managing Director / CFO addressed the queries raised by the Members to their satisfaction.`,
    resolution: "", resolutionType: "none",
  },
  {
    id: "agm_vote_of_thanks",
    title: "Vote of Thanks — Close of AGM",
    icon: "🙏",
    category: "closing", categoryLabel: "Closing Matters", categoryIcon: "✅",
    fields: [],
    discussion: `There being no other business to be transacted at the Meeting, the Chairman thanked the Members, Auditors, Company Secretary and all others present for their active participation and contribution. With the consent of the Members present, the Chairman declared the Meeting concluded.`,
    resolution: "", resolutionType: "none",
  },
];

/* ══════════════════════════════════════════════════════════════════
   EXPORT — ALL AGM TEMPLATES COMBINED
══════════════════════════════════════════════════════════════════ */
export const ALL_AGM_TEMPLATES: AgmAgendaTemplate[] = [
  ...ROUTINE,
  ...ORDINARY_BUSINESS,
  ...SPECIAL_DIRECTORS,
  ...SPECIAL_AUDITOR,
  ...SPECIAL_SHARES,
  ...SPECIAL_BORROWING,
  ...SPECIAL_RPT,
  ...SPECIAL_MOA_AOA,
  ...SPECIAL_GOVERNANCE,
  ...SPECIAL_LOANS,
  ...SPECIAL_MERGER,
  ...CLOSING,
];

export const AGM_CATEGORY_ORDER = [
  "routine", "ordinary_biz",
  "sp_directors", "sp_auditor", "sp_shares", "sp_borrowing",
  "sp_rpt", "sp_moa_aoa", "sp_governance", "sp_loans", "sp_merger",
  "closing",
];

export const AGM_CATEGORY_META: Record<string, { label: string; icon: string }> = {
  routine:       { label: "Routine / Opening Matters",             icon: "🔄" },
  ordinary_biz:  { label: "Ordinary Business (Statutory — Items 1-4)", icon: "📋" },
  sp_directors:  { label: "Special Business — Directors & KMP",    icon: "👥" },
  sp_auditor:    { label: "Special Business — Auditor",            icon: "🔍" },
  sp_shares:     { label: "Special Business — Share Capital",      icon: "📈" },
  sp_borrowing:  { label: "Special Business — Borrowing & Security", icon: "💳" },
  sp_rpt:        { label: "Special Business — Related Party",      icon: "🤝" },
  sp_moa_aoa:    { label: "Special Business — MOA / AOA Amendment", icon: "📃" },
  sp_governance: { label: "Special Business — Governance & CSR",   icon: "⚙️" },
  sp_loans:      { label: "Special Business — Loans & Investments", icon: "💰" },
  sp_merger:     { label: "Special Business — Merger / Restructuring", icon: "🔀" },
  closing:       { label: "Closing Matters",                       icon: "✅" },
};
