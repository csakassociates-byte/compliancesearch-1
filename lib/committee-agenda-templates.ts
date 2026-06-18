/* ══════════════════════════════════════════════════════════════════
   COMMITTEE MEETING AGENDA TEMPLATES
   Companies Act 2013 + SEBI LODR Compliant
   Committees: AC, NRC, CSR, Risk, SRC, Finance, Executive, Custom
   Categories: 8 | Total Templates: ~45
══════════════════════════════════════════════════════════════════ */

export type ResolutionType = "decision" | "recommendation" | "none";

export interface CommitteeAgendaField {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "date" | "number" | "textarea";
}

export interface CommitteeAgendaTemplate {
  id: string;
  title: string;
  icon: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  /** Which committee types this template is relevant for — empty = all */
  committeeTypes: string[];
  fields: CommitteeAgendaField[];
  discussion: string;
  resolution: string;
  resolutionType: ResolutionType;
  resolutionLaw?: string;
}

export function fillCommitteeTemplate(template: string, fields: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => fields[key] || `[${key.toUpperCase()}]`);
}

const AUTH_COMM = `\n\nRESOLVED FURTHER THAT the Chairman / any Member of the Committee or the Company Secretary be authorised to take all necessary steps and actions to give effect to the above decision.`;

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 1 — ROUTINE (all committees)
══════════════════════════════════════════════════════════════════ */
const ROUTINE: CommitteeAgendaTemplate[] = [
  {
    id: "comm_opening",
    title: "Call to Order / Opening of Meeting",
    icon: "🔔",
    category: "routine", categoryLabel: "Routine Matters", categoryIcon: "🔄",
    committeeTypes: [],
    fields: [],
    discussion: `The Chairman called the Meeting to order and confirmed that due notice of the Meeting had been served upon all Members of the Committee. It was noted that the requisite quorum was present and the Meeting was duly constituted to transact the business on the agenda.`,
    resolution: "", resolutionType: "none",
  },
  {
    id: "comm_prev_minutes",
    title: "Confirmation of Previous Meeting Minutes",
    icon: "📋",
    category: "routine", categoryLabel: "Routine Matters", categoryIcon: "🔄",
    committeeTypes: [],
    fields: [
      { key: "prevDate", label: "Date of Previous Meeting", placeholder: "e.g. 15 March 2025", type: "date" },
    ],
    discussion: `The Minutes of the previous Meeting of the Committee held on {prevDate} were placed before the Meeting. The same were read, considered and, there being no corrections, confirmed and signed by the Chairman.`,
    resolution: `RESOLVED THAT the Minutes of the previous Meeting of the Committee held on {prevDate} be and are hereby confirmed.`,
    resolutionType: "decision",
  },
  {
    id: "comm_action_taken",
    title: "Action Taken Report on Previous Meeting Decisions",
    icon: "✅",
    category: "routine", categoryLabel: "Routine Matters", categoryIcon: "🔄",
    committeeTypes: [],
    fields: [
      { key: "actionSummary", label: "Summary of Actions Taken", placeholder: "Describe actions completed since last meeting...", type: "textarea" },
    ],
    discussion: `The Management/Secretariat placed before the Committee a report on the actions taken on the decisions of the previous Meeting. The Committee noted that {actionSummary}. The Committee took note of the same and expressed its satisfaction with the progress made.`,
    resolution: "", resolutionType: "none",
  },
  {
    id: "comm_any_other",
    title: "Any Other Business with Permission of Chairman",
    icon: "💬",
    category: "routine", categoryLabel: "Routine Matters", categoryIcon: "🔄",
    committeeTypes: [],
    fields: [
      { key: "otherMatters", label: "Matters discussed", placeholder: "Describe any other matters discussed...", type: "textarea" },
    ],
    discussion: `With the permission of the Chairman, the following matters were discussed: {otherMatters}. The Committee took note of the same and the Chairman directed the Management to take appropriate action.`,
    resolution: "", resolutionType: "none",
  },
  {
    id: "comm_closing",
    title: "Closing of Meeting / Next Meeting Date",
    icon: "🔚",
    category: "routine", categoryLabel: "Routine Matters", categoryIcon: "🔄",
    committeeTypes: [],
    fields: [
      { key: "nextMeetingDate", label: "Proposed Next Meeting Date (if known)", placeholder: "e.g. 15 September 2025", type: "date" },
    ],
    discussion: `There being no other business to transact, the Chairman thanked all the Members for their active participation. The next Meeting of the Committee is proposed to be held on {nextMeetingDate}. The Meeting thereupon concluded.`,
    resolution: "", resolutionType: "none",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 2 — AUDIT COMMITTEE (AC)
   Sec. 177 Companies Act 2013 / SEBI LODR Reg. 18
══════════════════════════════════════════════════════════════════ */
const AUDIT: CommitteeAgendaTemplate[] = [
  {
    id: "ac_financial_statements",
    title: "Review of Financial Statements (Quarterly / Annual)",
    icon: "📊",
    category: "audit", categoryLabel: "Audit Committee", categoryIcon: "🔍",
    committeeTypes: ["audit"],
    resolutionLaw: "Sec. 177(4)(i) / LODR Reg. 18",
    fields: [
      { key: "period", label: "Period / Quarter", placeholder: "e.g. Q2 FY 2024-25 / Annual FY 2024-25" },
    ],
    discussion: `The Chief Financial Officer / Management placed before the Audit Committee the Financial Statements for the period {period}. The Committee reviewed the Financial Statements in detail including the notes thereon, accounting policies applied, and significant judgments made by the Management. The Statutory Auditors/Internal Auditors, if present, were heard. After detailed discussion, the Committee was satisfied with the Financial Statements and recommended the same for consideration of the Board of Directors.`,
    resolution: `RESOLVED THAT the Audit Committee, having reviewed and discussed the Financial Statements for the period {period} with the Management and the Statutory Auditors, recommends the same to the Board of Directors for approval, subject to such modifications, if any, as the Board may deem appropriate.`,
    resolutionType: "recommendation",
  },
  {
    id: "ac_internal_audit_report",
    title: "Review of Internal Audit Report",
    icon: "🔎",
    category: "audit", categoryLabel: "Audit Committee", categoryIcon: "🔍",
    committeeTypes: ["audit"],
    resolutionLaw: "Sec. 177(4)(ii) / LODR Reg. 18",
    fields: [
      { key: "period", label: "Audit Period", placeholder: "e.g. Q2 FY 2024-25" },
      { key: "auditorName", label: "Internal Auditor Name / Firm", placeholder: "e.g. M/s. XYZ & Associates" },
    ],
    discussion: `{auditorName}, the Internal Auditor of the Company, presented the Internal Audit Report for the period {period}. The Report highlighted the key observations, audit findings, control deficiencies, and management responses thereon. The Committee discussed the significant audit findings with the Management. The Management assured that appropriate corrective actions would be taken within the timelines agreed. The Committee took note of the audit findings and directed the Management to ensure implementation of the agreed action plans.`,
    resolution: `RESOLVED THAT the Internal Audit Report for the period {period} presented by {auditorName} be and is hereby noted, and the Management be directed to ensure timely implementation of the agreed corrective action plans.`,
    resolutionType: "decision",
  },
  {
    id: "ac_rpt_review",
    title: "Review and Approval of Related Party Transactions",
    icon: "🤝",
    category: "audit", categoryLabel: "Audit Committee", categoryIcon: "🔍",
    committeeTypes: ["audit"],
    resolutionLaw: "Sec. 177(4)(iv) / LODR Reg. 23",
    fields: [
      { key: "partyName", label: "Related Party Name", placeholder: "e.g. ABC Enterprises / Director's relative" },
      { key: "transactionNature", label: "Nature and Value of Transaction", placeholder: "e.g. Purchase of services — ₹5,00,000 per annum", type: "textarea" },
    ],
    discussion: `The Management placed before the Audit Committee details of the proposed / ongoing related party transaction with {partyName}. The nature and value of the transaction is as follows: {transactionNature}. The Committee was informed that the said transaction is on an arms-length basis and in the ordinary course of business. The Committee reviewed the terms and conditions and found them to be fair and not prejudicial to the interests of the Company or minority shareholders.`,
    resolution: `RESOLVED THAT the Audit Committee, having reviewed the terms and conditions, approves the following related party transaction with {partyName}: {transactionNature}, subject to the transaction being carried out on arms-length basis and in the ordinary course of business. The Committee authorises the Management to execute the same.${AUTH_COMM}`,
    resolutionType: "decision",
  },
  {
    id: "ac_internal_auditor",
    title: "Appointment / Reappointment of Internal Auditor",
    icon: "🧑‍💼",
    category: "audit", categoryLabel: "Audit Committee", categoryIcon: "🔍",
    committeeTypes: ["audit"],
    resolutionLaw: "Sec. 138 / Sec. 177",
    fields: [
      { key: "auditorName", label: "Name of Internal Auditor / Firm", placeholder: "e.g. M/s. XYZ & Associates, Chartered Accountants" },
      { key: "period", label: "Appointment Period", placeholder: "e.g. FY 2025-26" },
      { key: "remuneration", label: "Proposed Remuneration", placeholder: "e.g. ₹1,50,000 per annum" },
    ],
    discussion: `The Management placed before the Committee a proposal for appointment / reappointment of {auditorName} as Internal Auditor of the Company for {period} at a remuneration of {remuneration}. The Committee reviewed the credentials, independence, and proposed scope of internal audit.`,
    resolution: `RESOLVED THAT pursuant to the provisions of Section 138 of the Companies Act, 2013 and based on the recommendation of the Audit Committee, the Board be recommended to appoint {auditorName} as Internal Auditor of the Company for {period} at a remuneration of {remuneration}.${AUTH_COMM}`,
    resolutionType: "recommendation",
  },
  {
    id: "ac_statutory_auditor_fees",
    title: "Recommendation of Statutory Auditor Fees",
    icon: "💰",
    category: "audit", categoryLabel: "Audit Committee", categoryIcon: "🔍",
    committeeTypes: ["audit"],
    resolutionLaw: "Sec. 177(4)(iii)",
    fields: [
      { key: "auditorName", label: "Statutory Auditor Firm Name", placeholder: "e.g. M/s. Patel & Shah, Chartered Accountants" },
      { key: "fees", label: "Proposed Fees", placeholder: "e.g. ₹3,00,000 for FY 2025-26" },
    ],
    discussion: `The Committee discussed the remuneration payable to {auditorName}, the Statutory Auditors of the Company, for the audit services to be rendered. The proposal of {fees} was considered in light of the scope of work and prevailing market rates.`,
    resolution: `RESOLVED THAT the Audit Committee recommends to the Board of Directors that the remuneration of {auditorName}, Statutory Auditors, be fixed at {fees}, which may be approved by the Members at the Annual General Meeting.`,
    resolutionType: "recommendation",
  },
  {
    id: "ac_risk_review",
    title: "Review of Risk Management Framework",
    icon: "⚠️",
    category: "audit", categoryLabel: "Audit Committee", categoryIcon: "🔍",
    committeeTypes: ["audit"],
    fields: [
      { key: "riskSummary", label: "Key Risks Reviewed", placeholder: "Summarise key risks discussed...", type: "textarea" },
    ],
    discussion: `The Management presented an update on the Risk Management Framework of the Company. The following key risks were discussed: {riskSummary}. The Committee reviewed the risk mitigation measures in place and the status of implementation thereof.`,
    resolution: `RESOLVED THAT the status of the Risk Management Framework as presented be noted and the Management be directed to ensure continued monitoring and mitigation of identified risks.`,
    resolutionType: "decision",
  },
  {
    id: "ac_whistleblower",
    title: "Review of Vigil Mechanism / Whistleblower Policy",
    icon: "📣",
    category: "audit", categoryLabel: "Audit Committee", categoryIcon: "🔍",
    committeeTypes: ["audit"],
    resolutionLaw: "Sec. 177(9) CA 2013",
    fields: [
      { key: "complaintsReceived", label: "No. of Complaints Received", placeholder: "e.g. Nil / 2 complaints" },
      { key: "complaintsDisposed", label: "No. of Complaints Disposed / Status", placeholder: "e.g. 2 resolved, Nil pending" },
    ],
    discussion: `The Management placed before the Committee a report on the functioning of the Vigil Mechanism / Whistleblower Policy of the Company. During the period under review, {complaintsReceived} complaints were received under the Vigil Mechanism. The status of disposal is: {complaintsDisposed}. The Committee reviewed the adequacy and effectiveness of the Vigil Mechanism.`,
    resolution: `RESOLVED THAT the report on Vigil Mechanism / Whistleblower Policy be noted and the Management be directed to ensure proper communication of the policy to all stakeholders.`,
    resolutionType: "decision",
  },
  {
    id: "ac_audit_plan",
    title: "Approval of Internal Audit Plan",
    icon: "📝",
    category: "audit", categoryLabel: "Audit Committee", categoryIcon: "🔍",
    committeeTypes: ["audit"],
    fields: [
      { key: "auditYear", label: "Audit Plan Year", placeholder: "e.g. FY 2025-26" },
    ],
    discussion: `The Internal Auditor presented the Internal Audit Plan for {auditYear} covering the key audit areas, scope, methodology, and timeline. The Committee reviewed the plan and suggested certain areas to be included / given priority.`,
    resolution: `RESOLVED THAT the Internal Audit Plan for {auditYear} as presented by the Internal Auditor, with such modifications as discussed, be and is hereby approved.`,
    resolutionType: "decision",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 3 — NRC (Nomination & Remuneration Committee)
   Sec. 178 Companies Act 2013
══════════════════════════════════════════════════════════════════ */
const NRC: CommitteeAgendaTemplate[] = [
  {
    id: "nrc_director_recommendation",
    title: "Recommendation for Appointment of Director",
    icon: "👤",
    category: "nrc", categoryLabel: "NRC", categoryIcon: "👥",
    committeeTypes: ["nrc"],
    resolutionLaw: "Sec. 178(2)",
    fields: [
      { key: "name", label: "Director Name", placeholder: "e.g. Mr. Suresh Sharma" },
      { key: "din", label: "DIN", placeholder: "e.g. 01234567" },
      { key: "designation", label: "Proposed Designation", placeholder: "e.g. Additional Director / Independent Director" },
    ],
    discussion: `The Committee considered the proposal for appointment of {name} (DIN: {din}) as {designation} of the Company. The Committee reviewed the profile, qualifications, experience, and expertise of the candidate. The Committee was satisfied that the candidate fulfils the criteria laid down under the Companies Act, 2013, the Articles of Association, and the Nomination & Remuneration Policy of the Company.`,
    resolution: `RESOLVED THAT the NRC hereby recommends to the Board of Directors the appointment of {name} (DIN: {din}) as {designation} of the Company, having satisfied itself that the candidate meets the qualification criteria under the applicable provisions of the Companies Act, 2013 and the Company's Nomination Policy.`,
    resolutionType: "recommendation",
  },
  {
    id: "nrc_remuneration_recommendation",
    title: "Recommendation of Remuneration for MD / WTD / KMP",
    icon: "💸",
    category: "nrc", categoryLabel: "NRC", categoryIcon: "👥",
    committeeTypes: ["nrc"],
    resolutionLaw: "Sec. 178(4)",
    fields: [
      { key: "name", label: "Name of MD/WTD/KMP", placeholder: "e.g. Mr. Rajesh Kumar" },
      { key: "designation", label: "Designation", placeholder: "e.g. Managing Director" },
      { key: "remunerationDetails", label: "Proposed Remuneration Details", placeholder: "e.g. ₹5,00,000 p.m. as basic salary + perquisites...", type: "textarea" },
    ],
    discussion: `The Committee reviewed the remuneration package of {name} ({designation}). The proposed remuneration is as follows: {remunerationDetails}. The Committee considered the overall performance of the individual, the financial position of the Company, and industry benchmarks before arriving at the recommendation.`,
    resolution: `RESOLVED THAT the NRC, having reviewed the remuneration package of {name} ({designation}) in accordance with the Remuneration Policy of the Company and the provisions of the Companies Act, 2013, recommends to the Board of Directors the following remuneration: {remunerationDetails}.`,
    resolutionType: "recommendation",
  },
  {
    id: "nrc_board_evaluation",
    title: "Annual Board Performance Evaluation",
    icon: "📈",
    category: "nrc", categoryLabel: "NRC", categoryIcon: "👥",
    committeeTypes: ["nrc"],
    resolutionLaw: "Sec. 178(2) / Schedule IV",
    fields: [
      { key: "evalPeriod", label: "Evaluation Period", placeholder: "e.g. FY 2024-25" },
      { key: "evalSummary", label: "Key Evaluation Findings", placeholder: "Summarise key observations...", type: "textarea" },
    ],
    discussion: `The Committee undertook the annual evaluation of the performance of the Board, its Committees, and individual Directors for the period {evalPeriod} in accordance with Schedule IV of the Companies Act, 2013 and the Board Evaluation Policy of the Company. The Committee noted the following key findings: {evalSummary}.`,
    resolution: `RESOLVED THAT the NRC notes the results of the annual performance evaluation of the Board, its Committees and individual Directors for {evalPeriod} as discussed and reviewed, and recommends the same to the Board for its consideration.`,
    resolutionType: "recommendation",
  },
  {
    id: "nrc_remuneration_policy",
    title: "Review / Amendment of Nomination & Remuneration Policy",
    icon: "📋",
    category: "nrc", categoryLabel: "NRC", categoryIcon: "👥",
    committeeTypes: ["nrc"],
    resolutionLaw: "Sec. 178(3)(4)",
    fields: [
      { key: "changes", label: "Summary of Changes Proposed", placeholder: "Describe the key changes...", type: "textarea" },
    ],
    discussion: `The Committee reviewed the existing Nomination & Remuneration Policy of the Company in light of regulatory changes and evolving best practices. The following changes were proposed and discussed: {changes}.`,
    resolution: `RESOLVED THAT the revised Nomination & Remuneration Policy of the Company, incorporating the changes as discussed, be and is hereby recommended to the Board of Directors for approval.`,
    resolutionType: "recommendation",
  },
  {
    id: "nrc_succession_planning",
    title: "Succession Planning Review",
    icon: "🔀",
    category: "nrc", categoryLabel: "NRC", categoryIcon: "👥",
    committeeTypes: ["nrc"],
    fields: [],
    discussion: `The Committee reviewed the succession planning framework for the Board, Key Managerial Personnel, and Senior Management of the Company. The Committee discussed the identified successors, their readiness, and the development plans in place to prepare potential candidates for leadership roles.`,
    resolution: `RESOLVED THAT the succession planning review as presented be noted and the Management be directed to continue implementing the development plans for identified successors.`,
    resolutionType: "decision",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 4 — CSR COMMITTEE
   Sec. 135 Companies Act 2013
══════════════════════════════════════════════════════════════════ */
const CSR: CommitteeAgendaTemplate[] = [
  {
    id: "csr_policy_review",
    title: "Review / Amendment of CSR Policy",
    icon: "📜",
    category: "csr", categoryLabel: "CSR Committee", categoryIcon: "🌱",
    committeeTypes: ["csr"],
    resolutionLaw: "Sec. 135(3)(a)",
    fields: [
      { key: "policyChanges", label: "Key Changes / Areas Updated", placeholder: "Describe the changes to the CSR policy...", type: "textarea" },
    ],
    discussion: `The Committee reviewed the Corporate Social Responsibility Policy of the Company in light of regulatory amendments and the Company's evolving sustainability agenda. The following key areas were reviewed/updated: {policyChanges}.`,
    resolution: `RESOLVED THAT the revised CSR Policy of the Company, as reviewed and discussed, be and is hereby recommended to the Board of Directors for approval and adoption.`,
    resolutionType: "recommendation",
  },
  {
    id: "csr_annual_plan",
    title: "Approval of Annual CSR Action Plan",
    icon: "📅",
    category: "csr", categoryLabel: "CSR Committee", categoryIcon: "🌱",
    committeeTypes: ["csr"],
    resolutionLaw: "Sec. 135(4) / CSR Rules 2014 (as amended)",
    fields: [
      { key: "fy", label: "Financial Year", placeholder: "e.g. 2025-26" },
      { key: "totalBudget", label: "Total CSR Budget Proposed", placeholder: "e.g. ₹15,00,000" },
      { key: "activities", label: "Key CSR Activities Planned", placeholder: "Briefly describe the activities / areas...", type: "textarea" },
    ],
    discussion: `The Committee reviewed the Annual CSR Action Plan for FY {fy}. The total proposed CSR budget is {totalBudget} (being 2% of average net profit as computed under Section 135). The key CSR activities planned are: {activities}. The Committee reviewed the implementing agencies, beneficiaries, and timelines for each activity.`,
    resolution: `RESOLVED THAT the Annual CSR Action Plan for FY {fy} with a total budget of {totalBudget} covering the activities as discussed, be and is hereby approved and recommended to the Board of Directors for formal adoption.${AUTH_COMM}`,
    resolutionType: "recommendation",
  },
  {
    id: "csr_budget_approval",
    title: "Approval of CSR Expenditure / Budget Release",
    icon: "💵",
    category: "csr", categoryLabel: "CSR Committee", categoryIcon: "🌱",
    committeeTypes: ["csr"],
    resolutionLaw: "Sec. 135 / Rule 4",
    fields: [
      { key: "amount", label: "Amount to be Released", placeholder: "e.g. ₹5,00,000" },
      { key: "activity", label: "CSR Activity / Project", placeholder: "e.g. Education support for underprivileged children" },
      { key: "implementingAgency", label: "Implementing Agency / NGO", placeholder: "e.g. ABC Foundation (Reg. No. ...)" },
    ],
    discussion: `The Committee reviewed the proposal for release of CSR funds of {amount} for the activity "{activity}" to be implemented through {implementingAgency}. The Committee verified the registration and credentials of the implementing agency, project details, and expected beneficiaries.`,
    resolution: `RESOLVED THAT CSR expenditure of {amount} be released for the activity "{activity}" to {implementingAgency}, subject to submission of utilisation certificate. The Management is authorised to process the payment.${AUTH_COMM}`,
    resolutionType: "decision",
  },
  {
    id: "csr_implementation_review",
    title: "Review of CSR Implementation Status",
    icon: "📊",
    category: "csr", categoryLabel: "CSR Committee", categoryIcon: "🌱",
    committeeTypes: ["csr"],
    fields: [
      { key: "fy", label: "Financial Year", placeholder: "e.g. 2024-25" },
      { key: "spentSoFar", label: "Amount Spent to Date", placeholder: "e.g. ₹8,00,000 out of ₹15,00,000" },
      { key: "status", label: "Status / Key Highlights", placeholder: "Summarise implementation status...", type: "textarea" },
    ],
    discussion: `The Management presented the CSR implementation status report for FY {fy}. The amount spent to date is {spentSoFar}. Status of ongoing activities: {status}. The Committee reviewed the progress, impact assessment, and any implementation challenges.`,
    resolution: `RESOLVED THAT the CSR implementation status for FY {fy} as presented be noted and the Management be directed to ensure completion of all planned activities and full utilisation of CSR budget within the stipulated timeframe.`,
    resolutionType: "decision",
  },
  {
    id: "csr_annual_report_content",
    title: "Review of CSR Annual Report Content (for Board's Report)",
    icon: "📄",
    category: "csr", categoryLabel: "CSR Committee", categoryIcon: "🌱",
    committeeTypes: ["csr"],
    resolutionLaw: "Sec. 135(2) / Rule 8 CSR Rules",
    fields: [
      { key: "fy", label: "Financial Year", placeholder: "e.g. 2024-25" },
    ],
    discussion: `The Committee reviewed the draft CSR Annual Report for FY {fy} to be included in the Board's Report, covering details of CSR policy, CSR activities undertaken, amount spent, and amount unspent (if any) along with reasons therefor.`,
    resolution: `RESOLVED THAT the CSR Annual Report for FY {fy}, as reviewed and discussed, be recommended to the Board for inclusion in the Annual Report / Board's Report.`,
    resolutionType: "recommendation",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 5 — RISK MANAGEMENT COMMITTEE
   SEBI LODR Reg. 21
══════════════════════════════════════════════════════════════════ */
const RISK: CommitteeAgendaTemplate[] = [
  {
    id: "risk_register_review",
    title: "Review of Risk Register",
    icon: "🗂️",
    category: "risk", categoryLabel: "Risk Management", categoryIcon: "⚠️",
    committeeTypes: ["risk"],
    resolutionLaw: "SEBI LODR Reg. 21",
    fields: [
      { key: "quarter", label: "Period / Quarter", placeholder: "e.g. Q2 FY 2024-25" },
      { key: "topRisks", label: "Top Risks Identified / Changed", placeholder: "Summarise key risk changes...", type: "textarea" },
    ],
    discussion: `The Management presented the updated Risk Register for {quarter}. The key changes in risk ratings, newly identified risks, and risks that have been resolved or de-escalated are as follows: {topRisks}. The Committee reviewed the inherent and residual risk ratings for each risk category.`,
    resolution: `RESOLVED THAT the updated Risk Register for {quarter} as presented be noted and the Management be directed to continue monitoring and updating the Risk Register on a quarterly basis.`,
    resolutionType: "decision",
  },
  {
    id: "risk_mitigation_review",
    title: "Review of Risk Mitigation Measures",
    icon: "🛡️",
    category: "risk", categoryLabel: "Risk Management", categoryIcon: "⚠️",
    committeeTypes: ["risk"],
    fields: [
      { key: "mitigationStatus", label: "Status of Key Mitigation Actions", placeholder: "Describe progress on key risk mitigation...", type: "textarea" },
    ],
    discussion: `The Management presented the status of risk mitigation actions for the critical and high-priority risks. Key updates: {mitigationStatus}. The Committee reviewed the effectiveness of controls in place and discussed areas where additional mitigation may be required.`,
    resolution: `RESOLVED THAT the status of risk mitigation measures as presented be noted and the Management be directed to complete pending action items by the committed timelines.`,
    resolutionType: "decision",
  },
  {
    id: "risk_cyber_review",
    title: "Cyber Security & IT Risk Review",
    icon: "🔐",
    category: "risk", categoryLabel: "Risk Management", categoryIcon: "⚠️",
    committeeTypes: ["risk"],
    fields: [
      { key: "cyberSummary", label: "Key Cyber / IT Risk Updates", placeholder: "Summarise cyber security updates and incidents...", type: "textarea" },
    ],
    discussion: `The Chief Information Officer / IT team presented an update on the cyber security posture of the Company including recent threats, incidents (if any), and status of cyber security initiatives. Key highlights: {cyberSummary}. The Committee reviewed the business continuity plan and disaster recovery readiness.`,
    resolution: `RESOLVED THAT the cyber security and IT risk update as presented be noted and the Management be directed to maintain and enhance the cyber security framework.`,
    resolutionType: "decision",
  },
  {
    id: "risk_policy_review",
    title: "Review / Update of Risk Management Policy",
    icon: "📋",
    category: "risk", categoryLabel: "Risk Management", categoryIcon: "⚠️",
    committeeTypes: ["risk"],
    fields: [
      { key: "policyChanges", label: "Changes Proposed to Policy", placeholder: "Describe key amendments...", type: "textarea" },
    ],
    discussion: `The Committee reviewed the Risk Management Policy in light of business changes, regulatory developments, and emerging risk landscape. The proposed changes are: {policyChanges}.`,
    resolution: `RESOLVED THAT the revised Risk Management Policy incorporating the changes as discussed be and is hereby recommended to the Board of Directors for approval.`,
    resolutionType: "recommendation",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 6 — STAKEHOLDERS RELATIONSHIP COMMITTEE (SRC)
   Sec. 178(5) CA 2013
══════════════════════════════════════════════════════════════════ */
const SRC: CommitteeAgendaTemplate[] = [
  {
    id: "src_investor_complaints",
    title: "Review of Investor Complaints / Grievances",
    icon: "📬",
    category: "src", categoryLabel: "Stakeholders Relationship Committee", categoryIcon: "🤝",
    committeeTypes: ["src"],
    resolutionLaw: "Sec. 178(5) / SEBI Circular",
    fields: [
      { key: "period", label: "Period", placeholder: "e.g. Q2 FY 2024-25" },
      { key: "received", label: "Complaints Received", placeholder: "e.g. 5 complaints" },
      { key: "resolved", label: "Complaints Resolved", placeholder: "e.g. 5 resolved, Nil pending" },
    ],
    discussion: `The Company Secretary / RTA placed before the Committee a report on investor complaints received during {period}. Complaints received: {received}. Complaints resolved: {resolved}. The Committee reviewed the nature of complaints and the redressal mechanism in place. SEBI/Stock Exchange SCORES portal status was also discussed.`,
    resolution: `RESOLVED THAT the investor complaints report for {period} be and is hereby noted. The Management is directed to resolve all pending grievances within the regulatory timelines and maintain the complaint data on SEBI SCORES portal.`,
    resolutionType: "decision",
  },
  {
    id: "src_transfer_requests",
    title: "Review of Share Transfer / Transmission Requests",
    icon: "🔄",
    category: "src", categoryLabel: "Stakeholders Relationship Committee", categoryIcon: "🤝",
    committeeTypes: ["src"],
    fields: [
      { key: "transferCount", label: "No. of Transfer/Transmission Requests", placeholder: "e.g. 10 transfer requests, 2 transmission requests" },
    ],
    discussion: `The RTA / Company Secretary presented the share transfer and transmission requests received during the period. {transferCount}. The Committee reviewed the documents submitted and verified compliance with the applicable provisions.`,
    resolution: `RESOLVED THAT the share transfer/transmission requests as presented, having been found to be in order and in compliance with the applicable provisions, be and are hereby approved.${AUTH_COMM}`,
    resolutionType: "decision",
  },
  {
    id: "src_unclaimed_dividend",
    title: "Review of Unclaimed / Unpaid Dividend",
    icon: "💰",
    category: "src", categoryLabel: "Stakeholders Relationship Committee", categoryIcon: "🤝",
    committeeTypes: ["src"],
    fields: [
      { key: "unclaimed", label: "Unclaimed Dividend Amount / Status", placeholder: "e.g. ₹3,50,000 remaining unclaimed for FY 2017-18" },
    ],
    discussion: `The Management placed before the Committee the status of unclaimed/unpaid dividend. {unclaimed}. The Committee reviewed the actions taken to reach out to shareholders for claiming dividends and the status of amounts due for transfer to IEPF (Investor Education and Protection Fund).`,
    resolution: `RESOLVED THAT the status of unclaimed/unpaid dividend as presented be noted. The Management be directed to initiate the process of transfer to IEPF as required under the IEPF Rules and to notify affected shareholders.`,
    resolutionType: "decision",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 7 — FINANCE / EXECUTIVE COMMITTEE
══════════════════════════════════════════════════════════════════ */
const FINANCE: CommitteeAgendaTemplate[] = [
  {
    id: "fin_capex_approval",
    title: "Approval of Capital Expenditure",
    icon: "🏗️",
    category: "finance", categoryLabel: "Finance / Executive Committee", categoryIcon: "💼",
    committeeTypes: ["finance", "executive"],
    fields: [
      { key: "capexDescription", label: "Capex Description", placeholder: "e.g. Purchase of CNC Machine for Plant 2" },
      { key: "capexAmount", label: "Capex Amount", placeholder: "e.g. ₹25,00,000" },
      { key: "vendor", label: "Vendor / Supplier", placeholder: "e.g. XYZ Machines Ltd." },
    ],
    discussion: `The Management presented a proposal for capital expenditure of {capexAmount} for {capexDescription} from {vendor}. The Committee reviewed the business justification, competitive quotes, payment terms, and budget availability.`,
    resolution: `RESOLVED THAT the capital expenditure of {capexAmount} for {capexDescription} from {vendor} be and is hereby approved, subject to the expenditure being within the approved budget. The Management is authorised to issue the purchase order.${AUTH_COMM}`,
    resolutionType: "decision",
  },
  {
    id: "fin_budget_review",
    title: "Review of Budget vs. Actual Performance",
    icon: "📊",
    category: "finance", categoryLabel: "Finance / Executive Committee", categoryIcon: "💼",
    committeeTypes: ["finance", "executive"],
    fields: [
      { key: "period", label: "Period Reviewed", placeholder: "e.g. Q2 FY 2024-25" },
      { key: "keyVariances", label: "Key Variances / Highlights", placeholder: "Summarise key budget vs actual variances...", type: "textarea" },
    ],
    discussion: `The CFO / Management presented the Budget vs. Actual performance report for {period}. The key variances and highlights are: {keyVariances}. The Committee reviewed the reasons for material variances and the corrective measures proposed by the Management.`,
    resolution: `RESOLVED THAT the Budget vs. Actual performance report for {period} be noted and the Management be directed to take corrective actions to address adverse variances and provide a revised forecast at the next meeting.`,
    resolutionType: "decision",
  },
  {
    id: "fin_bank_facilities",
    title: "Review of Banking Facilities / Credit Limits",
    icon: "🏦",
    category: "finance", categoryLabel: "Finance / Executive Committee", categoryIcon: "💼",
    committeeTypes: ["finance", "executive"],
    fields: [
      { key: "bankName", label: "Bank Name", placeholder: "e.g. HDFC Bank / State Bank of India" },
      { key: "facilityDetails", label: "Facility Details / Limit", placeholder: "e.g. CC limit enhancement from ₹5 Cr to ₹8 Cr", type: "textarea" },
    ],
    discussion: `The Management presented a proposal regarding banking facilities from {bankName}: {facilityDetails}. The Committee reviewed the terms, interest rates, security offered, and operational requirements.`,
    resolution: `RESOLVED THAT the banking facility proposal from {bankName} as described — {facilityDetails} — be and is hereby approved and recommended to the Board for ratification. The Management and authorised signatories are directed to execute the necessary loan / credit documents.${AUTH_COMM}`,
    resolutionType: "decision",
  },
  {
    id: "fin_key_contracts",
    title: "Approval / Review of Key Contracts",
    icon: "📝",
    category: "finance", categoryLabel: "Finance / Executive Committee", categoryIcon: "💼",
    committeeTypes: ["finance", "executive"],
    fields: [
      { key: "partyName", label: "Counter-party Name", placeholder: "e.g. ABC Logistics Ltd." },
      { key: "contractNature", label: "Nature and Value of Contract", placeholder: "e.g. 3-year logistics service contract — ₹50,00,000 p.a." },
    ],
    discussion: `The Management presented the key terms of the proposed contract with {partyName}: {contractNature}. The Committee reviewed the commercial terms, legal implications, and risk factors associated with the contract.`,
    resolution: `RESOLVED THAT the contract with {partyName} for {contractNature}, as reviewed and discussed, be and is hereby approved. The Management is authorised to finalise and execute the agreement.${AUTH_COMM}`,
    resolutionType: "decision",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 8 — GENERAL (applicable to any committee)
══════════════════════════════════════════════════════════════════ */
const GENERAL: CommitteeAgendaTemplate[] = [
  {
    id: "gen_policy_review",
    title: "Review / Amendment of Committee Charter / Terms of Reference",
    icon: "📄",
    category: "general", categoryLabel: "General Business", categoryIcon: "📌",
    committeeTypes: [],
    fields: [
      { key: "changes", label: "Changes Proposed", placeholder: "Describe the key amendments to ToR/Charter...", type: "textarea" },
    ],
    discussion: `The Committee reviewed its Terms of Reference / Charter in light of regulatory changes and evolving responsibilities. The proposed amendments are: {changes}.`,
    resolution: `RESOLVED THAT the revised Terms of Reference / Charter of the Committee, as reviewed and discussed, be recommended to the Board of Directors for approval.`,
    resolutionType: "recommendation",
  },
  {
    id: "gen_self_evaluation",
    title: "Self-Evaluation of Committee Performance",
    icon: "⭐",
    category: "general", categoryLabel: "General Business", categoryIcon: "📌",
    committeeTypes: [],
    fields: [
      { key: "evalPeriod", label: "Evaluation Period", placeholder: "e.g. FY 2024-25" },
    ],
    discussion: `The Committee undertook an evaluation of its own performance for {evalPeriod} covering areas such as composition, frequency of meetings, quality of deliberations, and fulfillment of its mandate as per its Terms of Reference.`,
    resolution: `RESOLVED THAT the self-evaluation of the Committee's performance for {evalPeriod} be noted and the same be reported to the Board of Directors.`,
    resolutionType: "decision",
  },
  {
    id: "gen_mgmt_update",
    title: "Management Update / Presentation",
    icon: "📢",
    category: "general", categoryLabel: "General Business", categoryIcon: "📌",
    committeeTypes: [],
    fields: [
      { key: "topic", label: "Topic of Presentation", placeholder: "e.g. Business operations update, Compliance status, etc." },
      { key: "summary", label: "Key Points / Takeaways", placeholder: "Summarise key points discussed...", type: "textarea" },
    ],
    discussion: `The Management presented an update on {topic}. Key highlights: {summary}. The Committee discussed the points raised and provided guidance to the Management.`,
    resolution: "", resolutionType: "none",
  },
  {
    id: "gen_custom",
    title: "Custom Agenda Item",
    icon: "📌",
    category: "general", categoryLabel: "General Business", categoryIcon: "📌",
    committeeTypes: [],
    fields: [
      { key: "title", label: "Agenda Title", placeholder: "e.g. Approval of Annual Operating Plan" },
      { key: "discussion", label: "Discussion / Background", placeholder: "Describe the background and deliberations...", type: "textarea" },
      { key: "resolutionText", label: "Resolution Text (if any)", placeholder: "RESOLVED THAT ...", type: "textarea" },
    ],
    discussion: `{discussion}`,
    resolution: `{resolutionText}`,
    resolutionType: "decision",
  },
];

/* ══════════════════════════════════════════════════════════════════
   EXPORTS
══════════════════════════════════════════════════════════════════ */
export const ALL_COMMITTEE_TEMPLATES: CommitteeAgendaTemplate[] = [
  ...ROUTINE, ...AUDIT, ...NRC, ...CSR, ...RISK, ...SRC, ...FINANCE, ...GENERAL,
];

export const COMMITTEE_CATEGORY_ORDER = [
  "routine", "audit", "nrc", "csr", "risk", "src", "finance", "general",
];

export const COMMITTEE_CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  routine: { label: "Routine Matters",                   icon: "🔄", color: "#6366f1" },
  audit:   { label: "Audit Committee",                   icon: "🔍", color: "#1d4ed8" },
  nrc:     { label: "NRC",                               icon: "👥", color: "#7c3aed" },
  csr:     { label: "CSR Committee",                     icon: "🌱", color: "#059669" },
  risk:    { label: "Risk Management",                   icon: "⚠️", color: "#dc2626" },
  src:     { label: "Stakeholders Relationship",         icon: "🤝", color: "#0891b2" },
  finance: { label: "Finance / Executive Committee",     icon: "💼", color: "#b45309" },
  general: { label: "General Business",                  icon: "📌", color: "#64748b" },
};

export const COMMITTEE_TYPES: Array<{
  value: string; label: string; shortLabel: string; icon: string;
  color: string; law: string;
}> = [
  { value: "audit",     label: "Audit Committee",                        shortLabel: "AC",   icon: "🔍", color: "#1d4ed8", law: "Sec. 177 CA 2013" },
  { value: "nrc",       label: "Nomination & Remuneration Committee",    shortLabel: "NRC",  icon: "👥", color: "#7c3aed", law: "Sec. 178 CA 2013" },
  { value: "csr",       label: "CSR Committee",                          shortLabel: "CSR",  icon: "🌱", color: "#059669", law: "Sec. 135 CA 2013" },
  { value: "risk",      label: "Risk Management Committee",              shortLabel: "RMC",  icon: "⚠️", color: "#dc2626", law: "SEBI LODR Reg. 21" },
  { value: "src",       label: "Stakeholders Relationship Committee",    shortLabel: "SRC",  icon: "🤝", color: "#0891b2", law: "Sec. 178(5) CA 2013" },
  { value: "finance",   label: "Finance Committee",                      shortLabel: "FC",   icon: "💼", color: "#b45309", law: "Board Constitution" },
  { value: "executive", label: "Executive Committee",                    shortLabel: "EC",   icon: "⚡", color: "#64748b", law: "Board Constitution" },
  { value: "it",        label: "IT / Technology Committee",              shortLabel: "ITC",  icon: "💻", color: "#0891b2", law: "Board Constitution" },
  { value: "custom",    label: "Other Committee (Custom)",               shortLabel: "Comm", icon: "📋", color: "#475569", law: "" },
];
