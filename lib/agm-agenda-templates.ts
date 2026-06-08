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
    resolution: `RESOLVED THAT pursuant to Section 123 and other applicable provisions of the Companies Act, 2013, a Final Dividend at the rate of {dividendRate} for the Financial Year {fy} be and is hereby declared out of the profits of the Company for the said year, after providing for depreciation in accordance with Section 123(2) of the Act.\n\nRESOLVED FURTHER THAT the said Dividend shall be paid on or before {paymentDate} (being within 30 days of this declaration) to those Members whose names appear in the Register of Members / list of Beneficial Owners as on the Record Date / Book Closure Date of {recordDate}.\n\nRESOLVED FURTHER THAT the Company shall, within 5 (five) days of this declaration, open/operate a separate bank account titled "Dividend Account" and transfer therein the total amount of dividend so declared, in compliance with Section 123(4) of the Companies Act, 2013.`,
    resolutionType: "ordinary",
    resolutionLaw: "Sec. 123 — Companies Act, 2013 | Dividend payable within 30 days; separate a/c within 5 days",
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
    title: "Item 4 — Appointment of Statutory Auditor",
    icon: "🔍",
    category: "ordinary_biz", categoryLabel: "Ordinary Business (Statutory)", categoryIcon: "📋",
    isOrdinaryBusiness: true,
    fields: [
      { key: "auditorName", label: "Auditor / Firm Name", placeholder: "e.g. M/s ABC & Associates" },
      { key: "auditorRegNo", label: "ICAI Firm Reg. No.", placeholder: "e.g. 123456W" },
      { key: "toFY", label: "Till conclusion of AGM for FY", placeholder: "e.g. 2029-30" },
      { key: "remuneration", label: "Remuneration", placeholder: "e.g. as mutually agreed" },
    ],
    discussion: `The Chairman informed the Members about the proposal for appointment of {auditorName} (ICAI Firm Reg. No. {auditorRegNo}), Chartered Accountants, as the Statutory Auditors of the Company from the conclusion of this Annual General Meeting till the conclusion of the Annual General Meeting for the Financial Year {toFY}. The Chairman noted that the requirement of annual ratification has been dispensed with by the Companies (Amendment) Act, 2017. It was confirmed that the firm has given its written consent and has certified its eligibility under Section 141 of the Companies Act, 2013. The Resolution was put to vote.`,
    resolution: `RESOLVED THAT pursuant to the provisions of Section 139, 141, 142 and other applicable provisions of the Companies Act, 2013, read with the Companies (Audit and Auditors) Rules, 2014 (including any statutory modification or re-enactment thereof), {auditorName} (ICAI Firm Reg. No. {auditorRegNo}), Chartered Accountants, be and are hereby appointed as the Statutory Auditors of the Company to hold office from the conclusion of this Annual General Meeting till the conclusion of the Annual General Meeting of the Company to be held for the Financial Year {toFY}, at a remuneration of {remuneration} plus applicable taxes and out-of-pocket expenses as may be mutually agreed upon between the Board of Directors and the Auditors.${AUTH}`,
    resolutionType: "ordinary",
    resolutionLaw: "Sec. 139/141/142 — Companies Act, 2013 (Ratification removed by Amendment Act 2017)",
  },
  // ── CONDITIONAL VARIANTS — auto-inserted by page logic based on meeting decisions ──
  {
    id: "agm_no_dividend",
    title: "Item — No Dividend Declared (Board Did Not Recommend)",
    icon: "🚫",
    category: "ordinary_biz", categoryLabel: "Ordinary Business (Statutory)", categoryIcon: "📋",
    isOrdinaryBusiness: true,
    fields: [
      { key: "fy", label: "Financial Year", placeholder: "e.g. 2024-25" },
      { key: "reason", label: "Brief Reason (optional)", placeholder: "e.g. in order to conserve resources for business expansion" },
    ],
    discussion: `The Chairman informed the Members that the Board of Directors had, at its meeting, considered the matter of declaration of dividend for the Financial Year {fy}. After due deliberation and considering the financial position and future business requirements of the Company, the Board did not recommend any dividend for the Financial Year {fy}{reason}. The Chairman placed this before the Members for their information and noting. The Members took note of the same.`,
    resolution: "",
    resolutionType: "none",
    resolutionLaw: "Sec. 123 — No dividend recommended by Board; Members cannot declare dividend on their own",
  },
  {
    id: "agm_dividend_nil_declared",
    title: "Item — Dividend Proposed but Not Declared by AGM",
    icon: "❌",
    category: "ordinary_biz", categoryLabel: "Ordinary Business (Statutory)", categoryIcon: "📋",
    isOrdinaryBusiness: true,
    fields: [
      { key: "fy", label: "Financial Year", placeholder: "e.g. 2024-25" },
      { key: "recommendedRate", label: "Rate Recommended by Board", placeholder: "e.g. 5% i.e. ₹0.50 per share" },
      { key: "reason", label: "Reason for non-declaration", placeholder: "e.g. members resolved not to declare dividend and to retain profits" },
    ],
    discussion: `The Chairman informed the Members that the Board of Directors had recommended a dividend at the rate of {recommendedRate} for the Financial Year {fy}. After deliberation, the Members resolved not to declare the dividend as recommended by the Board, as {reason}. The Members noted that pursuant to Section 123(1) of the Companies Act, 2013, Members may declare a dividend not exceeding the amount recommended by the Board; however, the Members exercised their right to pass the proposal without declaration.`,
    resolution: `RESOLVED THAT the proposal of the Board of Directors for declaration of Final Dividend at the rate of {recommendedRate} for the Financial Year {fy} be and is hereby not approved, and no dividend be declared for the said Financial Year.`,
    resolutionType: "ordinary",
    resolutionLaw: "Sec. 123(1) — Members may declare less than or no dividend even if Board recommended",
  },
  {
    id: "agm_dir_no_rotation",
    title: "Item — No Director Retiring by Rotation (Note)",
    icon: "ℹ️",
    category: "ordinary_biz", categoryLabel: "Ordinary Business (Statutory)", categoryIcon: "📋",
    isOrdinaryBusiness: true,
    fields: [],
    discussion: `The Chairman informed the Members that as per the provisions of Section 152(6) of the Companies Act, 2013, one-third of the directors liable to retire by rotation shall retire at every Annual General Meeting. The Chairman stated that at this Annual General Meeting, no Director of the Company is liable to retire by rotation, as either the Directors hold office not subject to retirement by rotation (being an OPC/Private Company where no such rotation is applicable / all directors are not liable to retire by rotation as per the Articles of Association), or the computation under Section 152(6) does not result in any Director being required to retire at this Meeting. The Members took note of the same.`,
    resolution: "",
    resolutionType: "none",
    resolutionLaw: "Sec. 152(6) — Rotation applicable to 2/3rd of directors; Independent, MD, WTD are exempt",
  },
  {
    id: "agm_dir_additional_confirm",
    title: "Item — Appointment / Confirmation of Additional Director as Regular Director",
    icon: "👤",
    category: "ordinary_biz", categoryLabel: "Ordinary Business (Statutory)", categoryIcon: "📋",
    isOrdinaryBusiness: true,
    fields: [
      { key: "dirName", label: "Director Name", placeholder: "e.g. Mr. Vikram Singh" },
      { key: "dirDin", label: "DIN", placeholder: "e.g. 09876543" },
      { key: "dirDesig", label: "Designation", placeholder: "e.g. Director / Non-Executive Director" },
      { key: "boardApptDate", label: "Date of Board Appointment as Additional Director", placeholder: "e.g. 15 January 2025", type: "date" },
    ],
    discussion: `The Chairman informed the Members that {dirName} (DIN: {dirDin}) was appointed as an Additional Director of the Company by the Board of Directors at its meeting held on {boardApptDate}, pursuant to Section 161(1) of the Companies Act, 2013 and the Articles of Association of the Company. The Chairman stated that as per Section 161(1) of the Act, an Additional Director holds office only up to the date of the next Annual General Meeting. The Company has received a valid notice under Section 160(1) of the Act proposing the candidature of {dirName} for the office of Director. The Members, after deliberation, put the Resolution to vote.`,
    resolution: `RESOLVED THAT pursuant to Sections 152, 160 and 161 and other applicable provisions of the Companies Act, 2013, read with the Companies (Appointment and Qualification of Directors) Rules, 2014 (including any statutory modification or re-enactment thereof for the time being in force), {dirName} (DIN: {dirDin}), who was appointed as an Additional Director by the Board of Directors on {boardApptDate} and who holds office up to the date of this Annual General Meeting, and in respect of whom the Company has received a notice in writing under Section 160(1) of the Act from a Member proposing his/her candidature for the office of Director, be and is hereby appointed as a Director of the Company in the capacity of {dirDesig}, liable to retire by rotation.${AUTH}`,
    resolutionType: "ordinary",
    resolutionLaw: "Sec. 152/160/161 — Additional Director ceases at next AGM; must be confirmed by members",
  },
  {
    id: "agm_auditor_ongoing_note",
    title: "Item — Auditor Appointment Not Required (Term Continuing)",
    icon: "✅",
    category: "ordinary_biz", categoryLabel: "Ordinary Business (Statutory)", categoryIcon: "📋",
    isOrdinaryBusiness: true,
    fields: [
      { key: "auditorName", label: "Auditor / Firm Name", placeholder: "e.g. M/s ABC & Associates" },
      { key: "auditorRegNo", label: "ICAI Firm Reg. No.", placeholder: "e.g. 123456W" },
      { key: "apptAgm", label: "Appointed at (AGM number/year)", placeholder: "e.g. 3rd AGM held on 25 Sep 2022" },
      { key: "toFY", label: "Term valid till AGM for FY", placeholder: "e.g. 2027-28" },
    ],
    discussion: `The Chairman informed the Members that {auditorName} (ICAI Firm Reg. No. {auditorRegNo}), Chartered Accountants, were appointed as the Statutory Auditors of the Company at the {apptAgm} to hold office till the conclusion of the Annual General Meeting for the Financial Year {toFY}. The Chairman noted that as per the Companies (Amendment) Act, 2017, the requirement of annual ratification of auditors has been dispensed with, and accordingly, no resolution for ratification or re-appointment of the Statutory Auditor is required at this Annual General Meeting. The Members took note of the same.`,
    resolution: "",
    resolutionType: "none",
    resolutionLaw: "Sec. 139 + Companies (Amendment) Act, 2017 — Annual ratification removed; 5-year term continues",
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
    resolution: `RESOLVED THAT pursuant to Sections 149, 152 and Schedule IV and other applicable provisions of the Companies Act, 2013, read with the Companies (Appointment and Qualification of Directors) Rules, 2014 (including any statutory modification or re-enactment thereof for the time being in force), {dirName} (DIN: {dirDin}), who has submitted a declaration that he/she meets the criteria of independence as provided in Section 149(6) of the Act, and in respect of whom the Company has received a notice in writing under Section 160(1) of the Act proposing his/her candidature for the office of Director, be and is hereby appointed as an Independent Director of the Company, not liable to retire by rotation, to hold office for a term of {termYears} consecutive years commencing from {effectiveDate}.${AUTH}`,
    resolutionType: "ordinary",
    resolutionLaw: "Sec. 149/152/Schedule IV — Ordinary Resolution for 1st term (Sec. 150 not cited in resolution)",
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
    resolution: `RESOLVED THAT pursuant to Sections 196, 197, 198 and other applicable provisions of the Companies Act, 2013, read with the Companies (Appointment and Remuneration of Managerial Personnel) Rules, 2014 (Schedule V shall apply only in case of no profits or inadequate profits), {personName} (DIN: {din}) be and is hereby appointed/re-appointed as {designation} of the Company for a period of {term} with effect from {effectiveDate} at a remuneration of {remuneration} per month, plus such perquisites, allowances and benefits as set out in the Agreement to be executed between the Company and {personName}, subject to the overall ceiling on managerial remuneration under Section 197 of the Act.\n\nRESOLVED FURTHER THAT the Board be authorised to finalise and execute the Agreement with {personName} on such terms and conditions as it deems fit.${AUTH}`,
    resolutionType: "ordinary",
    resolutionLaw: "Sec. 196/197/198 — Ordinary Resolution (Schedule V applies ONLY if no profit / inadequate profit)",
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
    discussion: approving(`payment of commission to the Non-Executive Directors at the rate of {commissionPct} per annum with effect from FY {fy} for a period of {validForYears} as approved by the Board. It was noted that as the proposed commission exceeds the limits specified under Section 197(1) of the Companies Act, 2013, approval of Members by way of Special Resolution is required`),
    resolution: `RESOLVED THAT pursuant to Sections 197, 198 and other applicable provisions of the Companies Act, 2013, and as a Special Resolution, the Members hereby approve payment of commission to the Non-Executive Directors of the Company at a rate not exceeding {commissionPct} of the net profits of the Company per annum, computed in the manner laid down in Section 198 of the Act, with effect from Financial Year {fy} for a period of {validForYears}.\n\nRESOLVED FURTHER THAT such commission shall be in addition to sitting fees payable under Section 197(5) of the Act and shall be within the overall limit of 11% of net profits under Section 197(1).${AUTH}`,
    resolutionType: "special",
    resolutionLaw: "Sec. 197(1) Proviso — Special Resolution required if commission exceeds 1%/3% of net profits",
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
    discussion: approving(`the material Related Party Transaction(s) with {relatedParty} ({relationship}) for {transactionNature} amounting to {transactionValue} per annum. The Audit Committee has reviewed and recommended, and the Board has approved the same. It was noted that the said transaction(s) are not in the ordinary course of business and/or not on arm's length basis, and therefore prior approval of Members under Section 188 of the Companies Act, 2013 is required. The related party and interested Members abstained from voting on this Resolution`),
    resolution: `RESOLVED THAT pursuant to Section 188 and other applicable provisions of the Companies Act, 2013, read with the Companies (Meetings of Board and its Powers) Rules, 2014, and Regulation 23 of SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015 (wherever applicable), and subject to such other approvals as may be required, the consent of the Members be and is hereby accorded for entering into the following Related Party Transaction(s) with {relatedParty} ({relationship}):\n\nNature of Transaction: {transactionNature}\nMaximum Value: {transactionValue} per annum\n\nRESOLVED FURTHER THAT the Board of Directors / Audit Committee be authorised to finalise the terms and conditions and execute all documents in relation to the above transactions.${AUTH}`,
    resolutionType: "ordinary",
    resolutionLaw: "Sec. 188 — Approval required only when NOT arm's length / NOT ordinary course of business",
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
    resolution: `RESOLVED THAT pursuant to Section 13 and other applicable provisions of the Companies Act, 2013, read with the Companies (Incorporation) Rules, 2014, and subject to the approval of the Registrar of Companies and such other authorities as may be necessary, the name of the Company be changed from '{existingName}' to '{proposedName}'.\n\nRESOLVED FURTHER THAT upon approval of the new name by the Registrar of Companies, the name '{existingName}' wherever it appears in the Memorandum of Association and Articles of Association of the Company be substituted by '{proposedName}'.\n\nRESOLVED FURTHER THAT the Company Secretary be authorised to file Form INC-24 with the Registrar of Companies and to do all acts necessary to give effect to this Resolution.${AUTH}`,
    resolutionType: "special",
    resolutionLaw: "Sec. 13 — Special Resolution + RoC approval via Form INC-24 (Sec. 16 not applicable here)",
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
    resolution: `RESOLVED THAT pursuant to Section 13(4) and other applicable provisions of the Companies Act, 2013, read with the Companies (Incorporation) Rules, 2014, the Registered Office of the Company be shifted from the State of {fromState} to the State of {toState} and be situated at {newAddress}, subject to the confirmation of the Regional Director having jurisdiction.\n\nRESOLVED FURTHER THAT the Board of Directors and the Company Secretary be authorised to file the application before the Regional Director in Form INC-23 and to take all steps necessary for giving effect to this Resolution, including filing of Form INC-28 upon receipt of the Regional Director's order.${AUTH}`,
    resolutionType: "special",
    resolutionLaw: "Sec. 13(4) — Special Resolution + Regional Director confirmation via Form INC-23 (NOT Central Govt.)",
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
    discussion: approving(`inter-corporate loan/investment/guarantee of {loanAmount} to/in {beneficiaryName} for the purpose of {purpose}. It was noted that the proposed amount exceeds the limits prescribed under Section 186(2) of the Companies Act, 2013 i.e. 60% of paid-up share capital, free reserves and securities premium account OR 100% of free reserves and securities premium account, whichever is more, and therefore prior approval of Members by Special Resolution is required`),
    resolution: `RESOLVED THAT pursuant to Section 186 and other applicable provisions of the Companies Act, 2013, read with the Companies (Meetings of Board and its Powers) Rules, 2014, and subject to such approvals as may be necessary, the consent of the Members be and is hereby accorded for the Company to:\n(i) grant loan(s) / give guarantee(s) / provide security / make investment(s) in {beneficiaryName}\nup to an aggregate amount not exceeding {loanAmount}\nfor the purpose of {purpose}\n\nIt is hereby confirmed that no investment has been or shall be made by the Company in contravention of Section 186(3) of the Act and the Company has not defaulted in repayment of any deposits or interest thereon.${AUTH}`,
    resolutionType: "special",
    resolutionLaw: "Sec. 186(3) — Special Resolution when exceeds 60% of paid-up capital + free reserves + securities premium",
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
    resolution: `RESOLVED THAT pursuant to Sections 230, 232 and other applicable provisions of the Companies Act, 2013, read with the Companies (Compromises, Arrangements and Amalgamations) Rules, 2016, the Scheme of {proposalType} of the Company with {otherCompany} with a swap ratio/consideration of {swapRatio}, as circulated to the Members along with the Notice and the Explanatory Statement, be and is hereby approved.\n\nRESOLVED FURTHER THAT the Board of Directors and the Company Secretary be authorised to file the application before the National Company Law Tribunal (NCLT) and to take all steps necessary including filing of INC-28 upon receipt of NCLT Order, and to do all acts, deeds and things as may be required to give effect to this Resolution.${AUTH}`,
    resolutionType: "special",
    resolutionLaw: "Sec. 230/232 — Special Resolution + NCLT application (not petition) required",
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
