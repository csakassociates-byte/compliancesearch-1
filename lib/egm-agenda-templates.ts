/* ══════════════════════════════════════════════════════════════════
   EGM AGENDA TEMPLATES — Extraordinary General Meeting Minutes
   Companies Act 2013 + Secretarial Standard-2 (SS-2) Compliant
   Categories: 9 | Total Templates: ~32
══════════════════════════════════════════════════════════════════ */

export type ResolutionType = "ordinary" | "special" | "none";

export interface EgmAgendaField {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "date" | "number" | "textarea";
}

export interface EgmAgendaTemplate {
  id: string;
  title: string;
  icon: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  fields: EgmAgendaField[];
  discussion: string;
  resolution: string;
  resolutionType: ResolutionType;
  resolutionLaw?: string;
}

export function fillEgmTemplate(template: string, fields: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => fields[key] || `[${key.toUpperCase()}]`);
}

const AUTH = `\n\nRESOLVED FURTHER THAT any Director or the Company Secretary of the Company be and is hereby severally authorised to do all such acts, deeds, things and to execute all documents as may be necessary, proper or expedient to give effect to the above Resolution.`;

function noting(what: string): string {
  return `The Chairman informed the Members that ${what}. The Members, after deliberation, took note of the same.`;
}
function approving(what: string, extra = ""): string {
  return `The Chairman placed before the Meeting ${what}.${extra ? " " + extra : ""} After deliberation, the Resolution was put to vote and passed with the requisite majority.`;
}

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 1 — ROUTINE / OPENING MATTERS
══════════════════════════════════════════════════════════════════ */
const ROUTINE: EgmAgendaTemplate[] = [
  {
    id: "egm_chairman",
    title: "Election / Confirmation of Chairman",
    icon: "👑",
    category: "routine", categoryLabel: "Routine / Opening Matters", categoryIcon: "🔄",
    fields: [],
    discussion: `As per the provisions of Section 104 of the Companies Act, 2013 read with the Articles of Association of the Company and Secretarial Standard-2 (SS-2), the Board of Directors' nominee took the Chair and presided over the Meeting as Chairman. The Chairman welcomed all the Members and thanked them for their presence at the Extraordinary General Meeting. {boardMeetingRef}`,
    resolution: "", resolutionType: "none",
  },
  {
    id: "egm_quorum",
    title: "Ascertainment of Quorum",
    icon: "🔢",
    category: "routine", categoryLabel: "Routine / Opening Matters", categoryIcon: "🔄",
    fields: [],
    discussion: noting(`the requisite quorum as required under Section 103 of the Companies Act, 2013 read with Secretarial Standard-2 (SS-2) was present at the commencement of the Meeting. The Extraordinary General Meeting was duly constituted and the proceedings commenced`),
    resolution: "", resolutionType: "none",
  },
  {
    id: "egm_notice_read",
    title: "Notice of EGM Taken as Read",
    icon: "📨",
    category: "routine", categoryLabel: "Routine / Opening Matters", categoryIcon: "🔄",
    fields: [
      { key: "noticeDate", label: "Date of Notice", placeholder: "e.g. 01 June 2025", type: "date" },
    ],
    discussion: `With the consent of the Members present, the Notice convening the Extraordinary General Meeting dated {noticeDate} was taken as read. The Chairman informed the Members that the Notice had been duly served upon all Members of the Company in the manner prescribed under the Companies Act, 2013 and Secretarial Standard-2.`,
    resolution: "", resolutionType: "none",
  },
  {
    id: "egm_proxy_noting",
    title: "Noting of Proxies Received",
    icon: "📝",
    category: "routine", categoryLabel: "Routine / Opening Matters", categoryIcon: "🔄",
    fields: [
      { key: "proxyCount", label: "No. of Proxy Forms Received", placeholder: "e.g. 2" },
      { key: "sharesRepresented", label: "No. of Shares Represented by Proxies", placeholder: "e.g. 10,000" },
    ],
    discussion: noting(`{proxyCount} proxy form(s) representing {sharesRepresented} equity shares had been duly received by the Company before 48 hours of the Meeting as required under Section 105 of the Companies Act, 2013`),
    resolution: "", resolutionType: "none",
  },
  {
    id: "egm_vote_of_thanks",
    title: "Vote of Thanks",
    icon: "🙏",
    category: "routine", categoryLabel: "Routine / Opening Matters", categoryIcon: "🔄",
    fields: [],
    discussion: `There being no other business to transact, the Chairman thanked all the Members and others present for their active participation and co-operation. A vote of thanks was proposed and passed by acclamation. The Meeting thereupon concluded.`,
    resolution: "", resolutionType: "none",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 2 — MEMORANDUM OF ASSOCIATION (MOA)
══════════════════════════════════════════════════════════════════ */
const MOA: EgmAgendaTemplate[] = [
  {
    id: "egm_moa_name_change",
    title: "Change of Company Name (Alteration of MOA)",
    icon: "🏷️",
    category: "moa", categoryLabel: "Memorandum of Association", categoryIcon: "📜",
    resolutionLaw: "Sec. 13(2) — Special Resolution",
    fields: [
      { key: "oldName", label: "Existing Company Name", placeholder: "e.g. ABC Private Limited" },
      { key: "newName", label: "Proposed New Name", placeholder: "e.g. XYZ Technologies Private Limited" },
    ],
    discussion: approving(`a proposal for change of the name of the Company from "{oldName}" to "{newName}", subject to the approval of the Central Government / Registrar of Companies`, `The Chairman explained that the proposed name has been approved in-principle / availability confirmed and the change is being made for better brand identity.`),
    resolution: `RESOLVED THAT pursuant to the provisions of Section 13(2) and other applicable provisions, if any, of the Companies Act, 2013, and subject to the approval of the Central Government and/or the Registrar of Companies, the name of the Company be and is hereby changed from "{oldName}" to "{newName}" and consequently Clause I of the Memorandum of Association of the Company be altered by substituting the existing name with the new name "{newName}".${AUTH}`,
    resolutionType: "special",
  },
  {
    id: "egm_moa_objects_change",
    title: "Alteration of Objects Clause of MOA",
    icon: "📋",
    category: "moa", categoryLabel: "Memorandum of Association", categoryIcon: "📜",
    resolutionLaw: "Sec. 13 — Special Resolution",
    fields: [
      { key: "objectClause", label: "New / Altered Object Clause Text", placeholder: "Describe the alteration to the objects clause...", type: "textarea" },
    ],
    discussion: approving(`a proposal to alter the Objects Clause (Clause III) of the Memorandum of Association of the Company`, `The Chairman explained the need and rationale for the proposed alteration.`),
    resolution: `RESOLVED THAT pursuant to the provisions of Section 13 and other applicable provisions, if any, of the Companies Act, 2013, the Objects Clause (Clause III) of the Memorandum of Association of the Company be and is hereby altered as follows:\n\n{objectClause}${AUTH}`,
    resolutionType: "special",
  },
  {
    id: "egm_moa_reg_office_state",
    title: "Shifting Registered Office to Another State",
    icon: "🏢",
    category: "moa", categoryLabel: "Memorandum of Association", categoryIcon: "📜",
    resolutionLaw: "Sec. 13(4) — Special Resolution + NCLT",
    fields: [
      { key: "fromState", label: "Current State", placeholder: "e.g. Maharashtra" },
      { key: "toState", label: "Proposed State", placeholder: "e.g. Karnataka" },
      { key: "newAddress", label: "New Registered Office Address", placeholder: "Full address in the new state", type: "textarea" },
    ],
    discussion: approving(`a proposal for shifting the Registered Office of the Company from the State of {fromState} to the State of {toState}`, `The Chairman explained the business reasons for the shift. Members were informed that the change requires confirmation by the National Company Law Tribunal (NCLT) under Section 13(4).`),
    resolution: `RESOLVED THAT pursuant to the provisions of Sections 12, 13(4) and other applicable provisions, if any, of the Companies Act, 2013, and subject to the confirmation by the National Company Law Tribunal, the Registered Office of the Company be shifted from the State of {fromState} to the State of {toState} and the Registered Office Clause (Clause II) of the Memorandum of Association be altered accordingly to read as: "The Registered Office of the Company will be situated in the State of {toState}."\n\nRESOLVED FURTHER THAT upon receipt of the NCLT order, the Registered Office of the Company be established at {newAddress}.${AUTH}`,
    resolutionType: "special",
  },
  {
    id: "egm_moa_aoa_alteration",
    title: "Simultaneous Alteration of MOA and AOA",
    icon: "📑",
    category: "moa", categoryLabel: "Memorandum of Association", categoryIcon: "📜",
    resolutionLaw: "Sec. 13 & 14 — Special Resolution",
    fields: [
      { key: "moaAlteration", label: "MOA Clause(s) to be altered", placeholder: "Describe the MOA alterations...", type: "textarea" },
      { key: "aoaAlteration", label: "AOA Article(s) to be altered", placeholder: "Describe the AOA alterations...", type: "textarea" },
    ],
    discussion: approving(`a proposal for simultaneous alteration of the Memorandum of Association and Articles of Association of the Company`),
    resolution: `RESOLVED THAT pursuant to Sections 13 and 14 and other applicable provisions, if any, of the Companies Act, 2013, the Memorandum of Association and Articles of Association of the Company be altered as follows:\n\nMOA Alterations: {moaAlteration}\n\nAOA Alterations: {aoaAlteration}${AUTH}`,
    resolutionType: "special",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 3 — ARTICLES OF ASSOCIATION (AOA)
══════════════════════════════════════════════════════════════════ */
const AOA: EgmAgendaTemplate[] = [
  {
    id: "egm_aoa_alteration",
    title: "Alteration of Articles of Association",
    icon: "📝",
    category: "aoa", categoryLabel: "Articles of Association", categoryIcon: "⚖️",
    resolutionLaw: "Sec. 14 — Special Resolution",
    fields: [
      { key: "articleNo", label: "Article No(s) being altered", placeholder: "e.g. Article 5, 12 and 25" },
      { key: "alterationDetails", label: "Nature of Alteration", placeholder: "Describe what is being added/substituted/deleted...", type: "textarea" },
    ],
    discussion: approving(`a proposal to alter certain Articles of the Articles of Association of the Company`, `The Chairman explained the need for the amendment to bring the Articles in line with the Companies Act, 2013 and operational requirements.`),
    resolution: `RESOLVED THAT pursuant to the provisions of Section 14 and other applicable provisions, if any, of the Companies Act, 2013, the Articles of Association of the Company be and is hereby altered as follows:\n\n{alterationDetails}${AUTH}`,
    resolutionType: "special",
  },
  {
    id: "egm_aoa_adoption",
    title: "Adoption of New / Revised Articles of Association",
    icon: "📗",
    category: "aoa", categoryLabel: "Articles of Association", categoryIcon: "⚖️",
    resolutionLaw: "Sec. 14 — Special Resolution",
    fields: [],
    discussion: approving(`the draft of the new/revised Articles of Association of the Company, which shall be in the Table F format as per Schedule I to the Companies Act, 2013 with suitable modifications`, `The Chairman explained that the existing Articles require a comprehensive revision to align with the Companies Act, 2013.`),
    resolution: `RESOLVED THAT pursuant to the provisions of Section 14 and other applicable provisions, if any, of the Companies Act, 2013, the new/revised Articles of Association, a draft whereof was placed before the Meeting duly initialled by the Chairman for identification, be and is hereby adopted as the Articles of Association of the Company in substitution of and to the entire exclusion of the existing Articles of Association.${AUTH}`,
    resolutionType: "special",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 4 — SHARE CAPITAL
══════════════════════════════════════════════════════════════════ */
const SHARE_CAPITAL: EgmAgendaTemplate[] = [
  {
    id: "egm_auth_capital_increase",
    title: "Increase in Authorised Share Capital",
    icon: "💹",
    category: "share_capital", categoryLabel: "Share Capital", categoryIcon: "📊",
    resolutionLaw: "Sec. 61 — Ordinary Resolution",
    fields: [
      { key: "existingCapital", label: "Existing Authorised Capital", placeholder: "e.g. ₹10,00,000 divided into 1,00,000 Equity Shares of ₹10 each" },
      { key: "newCapital", label: "New / Increased Authorised Capital", placeholder: "e.g. ₹50,00,000 divided into 5,00,000 Equity Shares of ₹10 each" },
    ],
    discussion: approving(`a proposal to increase the Authorised Share Capital of the Company`, `The Chairman explained that the current authorised capital is insufficient to meet the proposed expansion and fundraising plans.`),
    resolution: `RESOLVED THAT pursuant to the provisions of Section 61(1)(a) and other applicable provisions, if any, of the Companies Act, 2013 read with the Articles of Association of the Company, the Authorised Share Capital of the Company be and is hereby increased from {existingCapital} to {newCapital} by creation of additional share capital and that consequently Clause V of the Memorandum of Association of the Company be altered accordingly.\n\nRESOLVED FURTHER THAT the Board of Directors of the Company be and is hereby authorised to take all steps for amendment of the Memorandum of Association of the Company and to file the necessary forms with the Registrar of Companies.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "egm_preferential_allotment",
    title: "Preferential Allotment of Shares",
    icon: "📤",
    category: "share_capital", categoryLabel: "Share Capital", categoryIcon: "📊",
    resolutionLaw: "Sec. 62(1)(c) — Special Resolution",
    fields: [
      { key: "noOfShares", label: "No. of Shares to be allotted", placeholder: "e.g. 50,000 equity shares" },
      { key: "faceValue", label: "Face Value per Share", placeholder: "e.g. ₹10" },
      { key: "issuePrice", label: "Issue Price per Share", placeholder: "e.g. ₹100 (including premium of ₹90)" },
      { key: "allotteeName", label: "Name(s) of Proposed Allottee(s)", placeholder: "e.g. Mr. Rohit Mehta / XYZ Ventures LLP" },
    ],
    discussion: approving(`a proposal for preferential allotment of {noOfShares} equity shares of face value {faceValue} each at an issue price of {issuePrice} per share to {allotteeName}`, `The Chairman explained the valuation, use of proceeds, and compliance with Rule 13 of the Companies (Share Capital and Debentures) Rules, 2014.`),
    resolution: `RESOLVED THAT pursuant to the provisions of Section 62(1)(c) and other applicable provisions, if any, of the Companies Act, 2013 read with the Companies (Share Capital and Debentures) Rules, 2014 and the Articles of Association of the Company, the consent of the Company be and is hereby accorded to the Board of Directors for allotment of {noOfShares} equity shares of face value of {faceValue} per share at an issue price of {issuePrice} per share (including premium, if any) on a preferential basis to {allotteeName} in accordance with the applicable provisions.\n\nRESOLVED FURTHER THAT the Board of Directors be and is hereby authorised to determine the final terms and conditions of such allotment, to receive the application money, to allot the shares and to issue share certificates and to take all such steps as may be necessary for giving effect to this resolution.${AUTH}`,
    resolutionType: "special",
  },
  {
    id: "egm_rights_issue",
    title: "Issue of Shares by Way of Rights Issue",
    icon: "🔖",
    category: "share_capital", categoryLabel: "Share Capital", categoryIcon: "📊",
    resolutionLaw: "Sec. 62(1)(a) — Ordinary / Special Resolution",
    fields: [
      { key: "noOfShares", label: "No. of Shares to be offered", placeholder: "e.g. 1,00,000 equity shares" },
      { key: "issuePrice", label: "Issue Price per Share", placeholder: "e.g. ₹10 (at par) / ₹50 (at premium)" },
      { key: "ratio", label: "Rights Ratio", placeholder: "e.g. 1 share for every 2 shares held" },
      { key: "offerOpenDate", label: "Offer Open Date", placeholder: "e.g. 01 July 2025", type: "date" },
      { key: "offerCloseDate", label: "Offer Close Date", placeholder: "e.g. 15 July 2025", type: "date" },
    ],
    discussion: approving(`a proposal for Rights Issue of {noOfShares} equity shares at {issuePrice} per share in the ratio of {ratio}`, `The Chairman explained the purpose of the rights issue and the use of proceeds.`),
    resolution: `RESOLVED THAT pursuant to the provisions of Section 62(1)(a) and other applicable provisions, if any, of the Companies Act, 2013 read with the Articles of Association of the Company, the Board of Directors be and is hereby authorised to offer {noOfShares} equity shares of the Company at {issuePrice} per share by way of Rights Issue to the existing shareholders in the ratio of {ratio}, with the offer remaining open from {offerOpenDate} to {offerCloseDate}.\n\nRESOLVED FURTHER THAT the Board be authorised to determine the final terms, to allot shares upon receipt of applications and monies, and to issue share certificates.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "egm_buyback",
    title: "Buy-back of Equity Shares",
    icon: "🔁",
    category: "share_capital", categoryLabel: "Share Capital", categoryIcon: "📊",
    resolutionLaw: "Sec. 68 — Special Resolution",
    fields: [
      { key: "noOfShares", label: "Max. No. of Shares to be bought back", placeholder: "e.g. up to 10,000 equity shares" },
      { key: "maxPrice", label: "Maximum Buy-back Price", placeholder: "e.g. not exceeding ₹500 per share" },
      { key: "maxAmount", label: "Maximum Buy-back Amount (Total)", placeholder: "e.g. ₹50,00,000" },
      { key: "method", label: "Method of Buy-back", placeholder: "e.g. Open Market / Tender Offer / Odd Lot" },
    ],
    discussion: approving(`a proposal for buy-back of up to {noOfShares} equity shares at a price not exceeding {maxPrice} aggregating up to {maxAmount} through the {method} method`, `The Chairman confirmed compliance with Section 68 conditions — buy-back does not exceed 25% of paid-up capital and free reserves, and the Company has no defaults in repayment of deposits, redemption of debentures, or dividend payment.`),
    resolution: `RESOLVED THAT pursuant to the provisions of Sections 68, 69, 70 and other applicable provisions, if any, of the Companies Act, 2013 read with the Companies (Share Capital and Debentures) Rules, 2014 and the Articles of Association of the Company, the consent of the Members be and is hereby accorded to the Board of Directors to buy back up to {noOfShares} fully paid-up equity shares of the Company at a price not exceeding {maxPrice} per share, for a total consideration not exceeding {maxAmount} (Rupees as mentioned), through the {method} method, out of the free reserves and / or the securities premium account of the Company, in accordance with and subject to the applicable provisions.\n\nRESOLVED FURTHER THAT the Board be authorised to extinguish and physically destroy the share certificates so bought back and to take all steps necessary for giving effect to this resolution.${AUTH}`,
    resolutionType: "special",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 5 — DIRECTORS & KMP
══════════════════════════════════════════════════════════════════ */
const DIRECTORS: EgmAgendaTemplate[] = [
  {
    id: "egm_appt_md",
    title: "Appointment of Managing Director / Whole-Time Director",
    icon: "👔",
    category: "directors", categoryLabel: "Directors & KMP", categoryIcon: "👥",
    resolutionLaw: "Sec. 196, 197 — Ordinary Resolution",
    fields: [
      { key: "name", label: "Name of MD/WTD", placeholder: "e.g. Mr. Rajesh Kumar" },
      { key: "din", label: "DIN", placeholder: "e.g. 01234567" },
      { key: "designation", label: "Designation", placeholder: "Managing Director / Whole-Time Director" },
      { key: "startDate", label: "Appointment Date", placeholder: "e.g. 01 July 2025", type: "date" },
      { key: "tenure", label: "Tenure", placeholder: "e.g. 5 years" },
      { key: "remuneration", label: "Remuneration / Terms", placeholder: "e.g. ₹5,00,000 p.m. as per agreement", type: "textarea" },
    ],
    discussion: approving(`the appointment and remuneration of {name} (DIN: {din}) as {designation} of the Company`, `The Chairman informed that the Board at its meeting had approved the appointment, subject to Members' approval, as required under Section 196 of the Companies Act, 2013.`),
    resolution: `RESOLVED THAT pursuant to the provisions of Sections 196, 197, 203 and Schedule V and other applicable provisions, if any, of the Companies Act, 2013 read with the Companies (Appointment and Remuneration of Managerial Personnel) Rules, 2014, the consent of the Company be and is hereby accorded to the appointment of {name} (DIN: {din}) as {designation} of the Company with effect from {startDate} for a period of {tenure}, on the following terms and conditions:\n\nRemuneration: {remuneration}\n\nRESOLVED FURTHER THAT the Board of Directors be and is hereby authorised to vary, alter or modify the terms and conditions of appointment, including remuneration, from time to time, as may be agreed mutually between the Board and {name}, within the limits prescribed under Schedule V or as approved by the Central Government.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "egm_appt_independent",
    title: "Appointment of Independent Director",
    icon: "🧑‍⚖️",
    category: "directors", categoryLabel: "Directors & KMP", categoryIcon: "👥",
    resolutionLaw: "Sec. 149, 150 — Ordinary Resolution",
    fields: [
      { key: "name", label: "Name of Director", placeholder: "e.g. Mr. Suresh Sharma" },
      { key: "din", label: "DIN", placeholder: "e.g. 01234567" },
      { key: "startDate", label: "Appointment Date", placeholder: "e.g. 01 July 2025", type: "date" },
      { key: "tenure", label: "Tenure", placeholder: "e.g. 5 years (1st term)" },
    ],
    discussion: approving(`the appointment of {name} (DIN: {din}) as an Independent Director of the Company`, `The Chairman informed that {name} has given consent to act as Director in Form DIR-2, has filed his declaration of independence as required under Section 149(7), is duly registered on the Data Bank of Independent Directors, and is not disqualified under the Act.`),
    resolution: `RESOLVED THAT pursuant to the provisions of Sections 149, 150, 152 and Schedule IV and other applicable provisions, if any, of the Companies Act, 2013 read with the Companies (Appointment and Qualification of Directors) Rules, 2014, {name} (DIN: {din}), who has submitted his declaration of independence under Section 149(7) and whose appointment has been recommended by the Board, be and is hereby appointed as an Independent Director of the Company for a term of {tenure} commencing from {startDate}, not liable to retire by rotation.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "egm_remove_director",
    title: "Removal of Director",
    icon: "🚫",
    category: "directors", categoryLabel: "Directors & KMP", categoryIcon: "👥",
    resolutionLaw: "Sec. 169 — Ordinary Resolution (Special Notice)",
    fields: [
      { key: "name", label: "Name of Director to be removed", placeholder: "e.g. Mr. Anil Verma" },
      { key: "din", label: "DIN", placeholder: "e.g. 01234567" },
      { key: "reason", label: "Reason / Ground for Removal", placeholder: "e.g. Non-attendance, conflict of interest, etc." },
    ],
    discussion: `The Chairman informed the Members that special notice was duly received for removal of {name} (DIN: {din}) as a Director of the Company under Section 169 of the Companies Act, 2013. The said Director was given an opportunity to be heard at the Meeting. After deliberation, the Resolution was put to vote.`,
    resolution: `RESOLVED THAT pursuant to the provisions of Section 169 and other applicable provisions, if any, of the Companies Act, 2013, {name} (DIN: {din}) be and is hereby removed from the office of Director of the Company with effect from the conclusion of this Meeting.${AUTH}`,
    resolutionType: "ordinary",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 6 — BORROWINGS
══════════════════════════════════════════════════════════════════ */
const BORROWINGS: EgmAgendaTemplate[] = [
  {
    id: "egm_borrow_limit",
    title: "Increase in Borrowing Limits (Sec. 180(1)(c))",
    icon: "🏦",
    category: "borrowings", categoryLabel: "Borrowings & Charges", categoryIcon: "💰",
    resolutionLaw: "Sec. 180(1)(c) — Special Resolution",
    fields: [
      { key: "borrowLimit", label: "Revised Borrowing Limit", placeholder: "e.g. ₹50 crores over and above paid-up capital & free reserves" },
    ],
    discussion: approving(`a proposal to increase the borrowing limits of the Company under Section 180(1)(c) of the Companies Act, 2013`, `The Chairman explained that the existing limits are insufficient for the Company's expansion plans and that additional borrowings are required.`),
    resolution: `RESOLVED THAT pursuant to the provisions of Section 180(1)(c) and other applicable provisions, if any, of the Companies Act, 2013, the consent of the Members of the Company be and is hereby accorded to the Board of Directors to borrow money, on such terms and conditions as may be thought fit, in excess of the aggregate of the paid-up share capital, securities premium and free reserves of the Company, provided that the total outstanding amount of monies so borrowed shall not at any time exceed {borrowLimit} in aggregate.${AUTH}`,
    resolutionType: "special",
  },
  {
    id: "egm_mortgage",
    title: "Creation of Mortgage / Charge on Company Assets (Sec. 180(1)(a))",
    icon: "🔏",
    category: "borrowings", categoryLabel: "Borrowings & Charges", categoryIcon: "💰",
    resolutionLaw: "Sec. 180(1)(a) — Special Resolution",
    fields: [
      { key: "chargeAmount", label: "Amount secured / Charge amount", placeholder: "e.g. up to ₹50 crores" },
      { key: "lender", label: "Name of Lender / Financial Institution", placeholder: "e.g. State Bank of India" },
    ],
    discussion: approving(`a proposal to create mortgage or charge on the whole or substantially the whole of the undertaking or assets of the Company to secure borrowings from {lender}`),
    resolution: `RESOLVED THAT pursuant to the provisions of Section 180(1)(a) and other applicable provisions, if any, of the Companies Act, 2013, the consent of the Members be and is hereby accorded to the Board of Directors to mortgage and / or create charge on the movable and immovable properties of the Company, both present and future, in favour of {lender} and / or its nominees, to secure the borrowing of {chargeAmount} (Rupees as mentioned) including interest, costs, charges, and expenses, on such terms and conditions as the Board may deem fit.\n\nRESOLVED FURTHER THAT the Board be authorised to execute all deeds, documents and instruments as may be required and to do all such other acts and things as may be necessary to give effect to this resolution.${AUTH}`,
    resolutionType: "special",
  },
  {
    id: "egm_debentures",
    title: "Issue of Debentures / Bonds",
    icon: "📃",
    category: "borrowings", categoryLabel: "Borrowings & Charges", categoryIcon: "💰",
    resolutionLaw: "Sec. 71 — Special Resolution",
    fields: [
      { key: "debenAmount", label: "Debenture Aggregate Amount", placeholder: "e.g. ₹10 crores" },
      { key: "debenType", label: "Type of Debentures", placeholder: "e.g. Non-Convertible Secured Debentures / NCDs" },
      { key: "interest", label: "Interest Rate (if fixed)", placeholder: "e.g. 12% per annum" },
    ],
    discussion: approving(`a proposal for issue of {debenType} aggregating {debenAmount} at {interest}`, `The Chairman explained the purpose of the issue and the terms thereof.`),
    resolution: `RESOLVED THAT pursuant to the provisions of Section 71 and other applicable provisions, if any, of the Companies Act, 2013, the consent of the Members be and is hereby accorded to the Board of Directors to issue {debenType} for an aggregate amount not exceeding {debenAmount} at such rate of interest, redemption date and other terms and conditions as the Board may determine, subject to the applicable provisions of the Companies Act, 2013 and the Rules made thereunder.${AUTH}`,
    resolutionType: "special",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 7 — INVESTMENTS & LOANS
══════════════════════════════════════════════════════════════════ */
const INVESTMENTS: EgmAgendaTemplate[] = [
  {
    id: "egm_investments_loans",
    title: "Inter-Corporate Investments / Loans / Guarantees (Sec. 186)",
    icon: "💼",
    category: "investments", categoryLabel: "Investments & Loans", categoryIcon: "📈",
    resolutionLaw: "Sec. 186 — Special Resolution",
    fields: [
      { key: "limitAmount", label: "Revised Limit for Investments / Loans / Guarantees", placeholder: "e.g. ₹25 crores in aggregate" },
    ],
    discussion: approving(`a proposal to increase the limits for making investments in, providing loans to, and giving guarantees or security in connection with loans to, other bodies corporate or persons under Section 186 of the Companies Act, 2013`),
    resolution: `RESOLVED THAT pursuant to the provisions of Section 186 and other applicable provisions, if any, of the Companies Act, 2013, the consent of the Members be and is hereby accorded to the Board of Directors to (i) make investments in the securities of other bodies corporate; (ii) give loans to any person or body corporate; and / or (iii) give guarantees or provide security in connection with any loan made to any body corporate or person — such that the aggregate of investments, loans, guarantees and securities so made / given at any time shall not exceed {limitAmount} (Rupees as mentioned) over and above the limits specified in Section 186(2).${AUTH}`,
    resolutionType: "special",
  },
  {
    id: "egm_rpt",
    title: "Approval of Related Party Transaction(s)",
    icon: "🤝",
    category: "investments", categoryLabel: "Investments & Loans", categoryIcon: "📈",
    resolutionLaw: "Sec. 188 — Ordinary Resolution",
    fields: [
      { key: "partyName", label: "Name of Related Party", placeholder: "e.g. ABC Enterprises (Proprietor: Mr. Rajesh, Director)" },
      { key: "nature", label: "Nature of Transaction", placeholder: "e.g. Sale / Purchase / Lease / Service / Loan" },
      { key: "value", label: "Transaction Value / Limit", placeholder: "e.g. ₹5,00,000 per annum" },
      { key: "relationship", label: "Relationship with Related Party", placeholder: "e.g. Director's relative / Associate Company" },
    ],
    discussion: approving(`a proposal for entering into related party transaction(s) with {partyName}`, `The Chairman disclosed that {relationship} and that the said transaction is on arms-length basis and in the ordinary course of business.`),
    resolution: `RESOLVED THAT pursuant to the provisions of Section 188 and other applicable provisions, if any, of the Companies Act, 2013 read with the Companies (Meetings of Board and its Powers) Rules, 2014, the consent of the Members be and is hereby accorded for entering into the following related party transaction with {partyName}:\n\nNature of Transaction: {nature}\nValue of Transaction: {value}\nRelationship: {relationship}\n\nRESOLVED FURTHER THAT the Board be authorised to negotiate, finalise and execute such agreements and documents as may be required.${AUTH}`,
    resolutionType: "ordinary",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 8 — RESTRUCTURING
══════════════════════════════════════════════════════════════════ */
const RESTRUCTURING: EgmAgendaTemplate[] = [
  {
    id: "egm_merger",
    title: "Approval of Scheme of Merger / Amalgamation",
    icon: "🔀",
    category: "restructuring", categoryLabel: "Restructuring", categoryIcon: "♻️",
    resolutionLaw: "Sec. 230-232 — Special Resolution",
    fields: [
      { key: "companyName2", label: "Transferee / Merging Company Name", placeholder: "e.g. XYZ Private Limited" },
      { key: "swapRatio", label: "Share Exchange Ratio (if applicable)", placeholder: "e.g. 1 share of transferee for every 2 shares of transferor" },
    ],
    discussion: approving(`the Scheme of Amalgamation / Merger between the Company and {companyName2} under Sections 230 to 232 of the Companies Act, 2013`, `The Chairman explained the terms of the Scheme including the share exchange ratio and the benefits of the amalgamation. Members were informed that the Scheme requires approval of the NCLT.`),
    resolution: `RESOLVED THAT pursuant to the provisions of Sections 230 to 232 and other applicable provisions, if any, of the Companies Act, 2013, and subject to the approval of the National Company Law Tribunal and such other regulatory approvals as may be required, the Scheme of Amalgamation between the Company and {companyName2}, as placed before this Meeting, be and is hereby approved.${AUTH}`,
    resolutionType: "special",
  },
  {
    id: "egm_conversion",
    title: "Conversion of Company Type",
    icon: "🔄",
    category: "restructuring", categoryLabel: "Restructuring", categoryIcon: "♻️",
    resolutionLaw: "Sec. 18 — Special Resolution",
    fields: [
      { key: "fromType", label: "Existing Company Type", placeholder: "e.g. Private Limited Company" },
      { key: "toType", label: "Proposed Company Type", placeholder: "e.g. Public Limited Company / Section 8 Company / LLP" },
    ],
    discussion: approving(`a proposal for conversion of the Company from {fromType} to {toType}`, `The Chairman explained the legal requirements, benefits, and compliance steps for the conversion.`),
    resolution: `RESOLVED THAT pursuant to the provisions of Section 18 and other applicable provisions, if any, of the Companies Act, 2013, and subject to such approvals as may be required, the Company be and is hereby converted from a {fromType} to a {toType} and the name of the Company be changed accordingly.\n\nRESOLVED FURTHER THAT the Memorandum and Articles of Association of the Company be altered to give effect to such conversion.${AUTH}`,
    resolutionType: "special",
  },
  {
    id: "egm_winding_up",
    title: "Voluntary Winding Up of the Company",
    icon: "🔚",
    category: "restructuring", categoryLabel: "Restructuring", categoryIcon: "♻️",
    resolutionLaw: "Sec. 59 IBC / Sec. 271 — Special Resolution",
    fields: [
      { key: "liquidatorName", label: "Name of Proposed Liquidator", placeholder: "e.g. CA Ramesh Jain, IP Reg. No. IBBI/IPA-001/IP-P00001" },
      { key: "reason", label: "Reason for Winding Up", placeholder: "e.g. Business closure, all liabilities discharged", type: "textarea" },
    ],
    discussion: approving(`a proposal for voluntary winding up of the Company`, `The Chairman explained that the Company has no outstanding liabilities, all creditors have been paid, and the Members have decided to dissolve the Company. The proposed Insolvency Professional / Liquidator was introduced to the Members.`),
    resolution: `RESOLVED THAT pursuant to the provisions applicable to voluntary winding up under the Insolvency and Bankruptcy Code, 2016 and / or the Companies Act, 2013 as applicable, the Company be wound up voluntarily.\n\nRESOLVED FURTHER THAT {liquidatorName} be and is hereby appointed as the Liquidator of the Company for the purpose of such winding up.\n\nRESOLVED FURTHER THAT the Board of Directors be authorised to take all necessary steps and to execute all documents required for giving effect to this resolution.`,
    resolutionType: "special",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 9 — MISCELLANEOUS
══════════════════════════════════════════════════════════════════ */
const MISC: EgmAgendaTemplate[] = [
  {
    id: "egm_ratification",
    title: "Ratification of Acts / Contracts of the Company",
    icon: "✅",
    category: "misc", categoryLabel: "Miscellaneous", categoryIcon: "📌",
    resolutionLaw: "General — Ordinary Resolution",
    fields: [
      { key: "actDesc", label: "Description of Act / Contract to be ratified", placeholder: "Describe the act or contract...", type: "textarea" },
    ],
    discussion: approving(`a proposal for ratification of certain acts, deeds and/or contracts entered into by the Company`),
    resolution: `RESOLVED THAT the Members do hereby confirm and ratify all the acts, deeds and things done by the Directors and officers of the Company in connection with the following: {actDesc}, and declare the same to be valid and binding on the Company.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "egm_remuneration_increase",
    title: "Revision of Remuneration of MD / WTD",
    icon: "💸",
    category: "misc", categoryLabel: "Miscellaneous", categoryIcon: "📌",
    resolutionLaw: "Sec. 197 / Schedule V — Ordinary Resolution",
    fields: [
      { key: "name", label: "Name of MD/WTD", placeholder: "e.g. Mr. Rajesh Kumar" },
      { key: "designation", label: "Designation", placeholder: "Managing Director" },
      { key: "newRemuneration", label: "Revised Remuneration Terms", placeholder: "e.g. ₹7,50,000 per month w.e.f. 01 April 2025", type: "textarea" },
    ],
    discussion: approving(`a proposal for revision of the remuneration payable to {name} ({designation}) of the Company`, `The Chairman informed that the revision is in accordance with Schedule V to the Companies Act, 2013 and is commensurate with industry benchmarks.`),
    resolution: `RESOLVED THAT pursuant to the provisions of Sections 196, 197 and Schedule V and other applicable provisions, if any, of the Companies Act, 2013, the consent of the Members be and is hereby accorded to revise the remuneration of {name} ({designation}) as follows:\n\n{newRemuneration}\n\nAll other terms and conditions of appointment shall remain unchanged.${AUTH}`,
    resolutionType: "ordinary",
  },
  {
    id: "egm_custom",
    title: "Special / Other Business (Custom Agenda Item)",
    icon: "📌",
    category: "misc", categoryLabel: "Miscellaneous", categoryIcon: "📌",
    fields: [
      { key: "agendaTitle", label: "Agenda Item Title", placeholder: "e.g. Approval for XYZ Contract" },
      { key: "discussion", label: "Discussion / Background", placeholder: "Describe the background and deliberations...", type: "textarea" },
      { key: "resolutionText", label: "Resolution Text", placeholder: "RESOLVED THAT ...", type: "textarea" },
    ],
    discussion: `{discussion}`,
    resolution: `{resolutionText}`,
    resolutionType: "ordinary",
  },
];

/* ══════════════════════════════════════════════════════════════════
   EXPORT — all templates + metadata
══════════════════════════════════════════════════════════════════ */
export const ALL_EGM_TEMPLATES: EgmAgendaTemplate[] = [
  ...ROUTINE,
  ...MOA,
  ...AOA,
  ...SHARE_CAPITAL,
  ...DIRECTORS,
  ...BORROWINGS,
  ...INVESTMENTS,
  ...RESTRUCTURING,
  ...MISC,
];

export const EGM_CATEGORY_ORDER = [
  "routine", "moa", "aoa", "share_capital", "directors",
  "borrowings", "investments", "restructuring", "misc",
];

export const EGM_CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  routine:       { label: "Routine / Opening Matters",  icon: "🔄", color: "#6366f1" },
  moa:           { label: "Memorandum of Association",  icon: "📜", color: "#1d4ed8" },
  aoa:           { label: "Articles of Association",    icon: "⚖️", color: "#7c3aed" },
  share_capital: { label: "Share Capital",              icon: "📊", color: "#0891b2" },
  directors:     { label: "Directors & KMP",            icon: "👥", color: "#059669" },
  borrowings:    { label: "Borrowings & Charges",       icon: "💰", color: "#b45309" },
  investments:   { label: "Investments & Loans",        icon: "📈", color: "#7c3aed" },
  restructuring: { label: "Restructuring",              icon: "♻️", color: "#dc2626" },
  misc:          { label: "Miscellaneous",              icon: "📌", color: "#64748b" },
};
