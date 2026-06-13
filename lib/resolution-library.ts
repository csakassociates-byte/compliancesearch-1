/**
 * UNIFIED RESOLUTION LIBRARY
 * Single source of truth for ALL resolutions/agenda items
 * Used by: Board Minutes Tool + Board Resolution Builder + AGM Minutes Tool
 *
 * Source: CimplyFive's Text of Model Resolutions under Companies Act, 2013
 */

export interface ResolutionField {
  key:          string;
  label:        string;
  placeholder?: string;
  type?:        "text" | "date" | "number" | "textarea" | "select";
  options?:     string[];
  required?:    boolean;
}

export interface UnifiedResolution {
  id:           string;
  title:        string;          // Short display title
  icon:         string;
  category:     string;          // category key
  meetingType:  "board" | "agm" | "egm" | "board_agm";  // which meeting type
  kind:         "ordinary" | "special";
  section:      string;          // Legal basis
  rocFiling?:   string;          // e.g. "DIR-12 within 30 days"

  // ── For Board/AGM Minutes tool (agenda item) ──
  agendaTitle:  string;          // "To appoint Additional Director"
  proposal:     string;          // What the board considers
  discussion:   string;          // Minutes gist template

  // ── For Board Resolution Builder (standalone doc) ──
  preamble:     string;          // Background/context
  resolution:   string;          // "RESOLVED THAT..." text

  fields:       ResolutionField[];
  notes?:       string;
}

/* ── Category metadata ─────────────────────────────────────────── */
export const RL_CATEGORY_META: Record<string, { label: string; icon: string; meetingType: "board" | "agm" | "egm" | "board_agm" }> = {
  first_meeting: { label: "First Board Meeting",       icon: "🎉", meetingType: "board" },
  directors:     { label: "Directors & KMP",            icon: "👤", meetingType: "board" },
  shares:        { label: "Share Capital",              icon: "📊", meetingType: "board" },
  banking:       { label: "Banking Operations",         icon: "🏦", meetingType: "board" },
  financial:     { label: "Accounts & Audit",           icon: "📋", meetingType: "board" },
  compliance:    { label: "Compliance & ROC",           icon: "⚖️", meetingType: "board" },
  moa_aoa:       { label: "MOA / AOA Changes",          icon: "📜", meetingType: "board" },
  borrowings:    { label: "Borrowings & Investments",   icon: "💰", meetingType: "board" },
  dividends:     { label: "Dividends & Buyback",        icon: "💸", meetingType: "board" },
  agm_mandatory: { label: "AGM Mandatory Items",        icon: "🏛️", meetingType: "agm"   },
  agm_shares:    { label: "AGM — Share Capital",        icon: "📈", meetingType: "agm"   },
  egm_special:   { label: "EGM / Special Resolutions",  icon: "🔔", meetingType: "egm"   },
};

export const RL_CATEGORY_ORDER = [
  "first_meeting", "directors", "shares", "banking",
  "financial", "compliance", "moa_aoa", "borrowings", "dividends",
  "agm_mandatory", "agm_shares", "egm_special",
];

/* ══════════════════════════════════════════════════════════════════
   RESOLUTION LIBRARY — 100+ Templates
══════════════════════════════════════════════════════════════════ */
export const RESOLUTION_LIBRARY: UnifiedResolution[] = [

  /* ─────────────────────────────────────────────────────────────
     CATEGORY: FIRST BOARD MEETING
  ───────────────────────────────────────────────────────────── */
  {
    id: "fm_note_coi",
    title: "Note Certificate of Incorporation",
    icon: "📋",
    category: "first_meeting",
    meetingType: "board",
    kind: "ordinary",
    section: "Companies Act, 2013 — Incorporation",
    agendaTitle: "To take note of the Certificate of Incorporation",
    proposal: "The Board to take note of the Certificate of Incorporation bearing CIN {cin} dated {incDate} issued by the Registrar of Companies, State of {state}.",
    discussion: "The Board took note of the Certificate of Incorporation bearing CIN {cin} dated {incDate} issued by the Registrar of Companies, State of {state}, a copy of which was placed at the meeting.",
    preamble: "The Company was incorporated under the Companies Act, 2013 and a Certificate of Incorporation was issued by the Registrar of Companies. The Board is required to take the same on record.",
    resolution: "RESOLVED THAT the Board of Directors of the Company do and hereby take on record the Certificate of Incorporation bearing CIN {cin} dated {incDate} issued by the Registrar of Companies, State of {state}, a copy of which is tabled at the meeting.",
    fields: [
      { key: "cin", label: "CIN", placeholder: "U12345MH2024PTC123456", required: true },
      { key: "incDate", label: "Date of Incorporation", type: "date", required: true },
      { key: "state", label: "State", placeholder: "Maharashtra", required: true },
    ],
  },

  {
    id: "fm_note_moa_aoa",
    title: "Note MOA & AOA",
    icon: "📃",
    category: "first_meeting",
    meetingType: "board",
    kind: "ordinary",
    section: "Companies Act, 2013",
    agendaTitle: "To take note of the Memorandum & Articles of Association",
    proposal: "The Board to take note of the Memorandum of Association and Articles of Association as registered with the Registrar of Companies at the time of company incorporation.",
    discussion: "The Board took note of the Memorandum of Association and Articles of Association as registered with the Registrar of Companies at the time of Company incorporation. The Board members discussed and approved the following resolution.",
    preamble: "The Memorandum of Association and Articles of Association of the Company were registered with the Registrar of Companies at the time of incorporation. The Board is required to formally note the same.",
    resolution: "RESOLVED THAT the Board of Directors of the Company do and hereby take on record the printed copy of the Memorandum of Association and Articles of Association of the Company, tabled at the meeting and initialled by the Chairman for the purpose of identification.",
    fields: [],
  },

  {
    id: "fm_registered_office",
    title: "Note Registered Office (Sec. 12)",
    icon: "🏢",
    category: "first_meeting",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 12 — Companies Act, 2013",
    agendaTitle: "To take note of the situation of the Registered Office",
    proposal: "The Board to take note of the Registered Office of the Company as registered with the Registrar of Companies at the time of incorporation and fix the same.",
    discussion: "The Board took note of the Registered Office of the Company at {regAddress} as registered with the Registrar of Companies at the time of incorporation of the Company and approved the following resolution.",
    preamble: "Pursuant to Section 12 of the Companies Act, 2013, the Company is required to have a registered office and affix name board at such office.",
    resolution: "RESOLVED THAT pursuant to Section 12(1) of the Companies Act, 2013 the Registered Office of the Company be situated at {regAddress}.\n\nRESOLVED FURTHER THAT pursuant to Section 12(3) of the Companies Act, 2013 a name board be affixed at the Registered Office of the Company and every other office or place of business of the Company and that the Company's name, CIN and address of the Registered Office be used or mentioned in legible characters in all its business letters, bill heads, letter papers, notices and other official publications.",
    fields: [
      { key: "regAddress", label: "Registered Office Address", type: "textarea", required: true },
    ],
  },

  {
    id: "fm_first_directors",
    title: "Confirm List of First Directors",
    icon: "👥",
    category: "first_meeting",
    meetingType: "board",
    kind: "ordinary",
    section: "Companies Act, 2013",
    agendaTitle: "To confirm the list of first Directors",
    proposal: "The Board to discuss and confirm the list of first Directors of the Company as per the details on record.",
    discussion: "The Board discussed and confirmed the list of first Directors of the Company and noted the relevant e-forms filed with the Registrar of Companies at the time of incorporation with respect to the Directors.",
    preamble: "The first directors of the Company were named in the Memorandum of Association at the time of incorporation. The Board is required to formally confirm the same on record.",
    resolution: "RESOLVED THAT the Board of Directors do and hereby confirm that the following are the first Directors of the Company:\n1. {director1}\n2. {director2}\n\nRESOLVED FURTHER THAT the Directors of the Company do and hereby take note of the relevant e-forms filed with the Registrar of Companies at the time of incorporation with respect to the above Directors.",
    fields: [
      { key: "director1", label: "Director 1 Name", required: true },
      { key: "director2", label: "Director 2 Name", required: true },
    ],
  },

  {
    id: "fm_director_disclosure",
    title: "Record Director Disclosure of Interest (MBP-1)",
    icon: "📝",
    category: "first_meeting",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 184(1) — Companies Act, 2013",
    agendaTitle: "To record disclosure of interest received from Directors",
    proposal: "Pursuant to Section 184(1) of the Companies Act, 2013, every Director shall at the first meeting disclose his concern or interest. The Board is required to take note of the Disclosure of Interest in Form MBP-1.",
    discussion: "The Board noted the Disclosure of Interest in Form MBP-1 received from all Directors as required under Section 184(1) of the Companies Act, 2013 and approved the following resolution.",
    preamble: "Pursuant to Section 184(1) of the Companies Act, 2013, every Director shall at the first meeting of the Board in which he participates as a Director, and thereafter at the first meeting of every financial year, disclose his concern or interest in any Company, body corporate, firms or other association of individuals including shareholding.",
    resolution: "RESOLVED THAT the Board of Directors do and hereby take on record Disclosure of Interest in Form MBP-1 received from the Directors in terms of Section 184(1) of the Companies Act, 2013 read with the Companies (Meetings of Board and its Powers) Rules, 2014.\n\nRESOLVED FURTHER THAT the necessary e-form be filed by any one of the Directors with the Registrar of Companies and take necessary steps to make entries in the Register of Directors of the Company.",
    fields: [],
    notes: "Form MBP-1 must be obtained from each director before the meeting.",
  },

  {
    id: "fm_appoint_chairman",
    title: "Appoint Chairperson of the Board",
    icon: "🪑",
    category: "first_meeting",
    meetingType: "board",
    kind: "ordinary",
    section: "Companies Act, 2013",
    agendaTitle: "To appoint the Chairperson of the Board",
    proposal: "One of the Directors needs to be appointed as the Chairperson of the Board for conducting the Board Meetings.",
    discussion: "The Directors after discussion unanimously elected {chairmanName} as the Chairperson of the Board for conducting the Board Meetings. The following resolution was approved.",
    preamble: "The Board of Directors requires a Chairperson for conducting its meetings. The directors have proposed the appointment of one of their members as Chairperson.",
    resolution: "RESOLVED THAT {chairmanName} be and is hereby appointed as the Chairperson of the Board with effect from {effectiveDate}.",
    fields: [
      { key: "chairmanName", label: "Director Name", required: true },
      { key: "effectiveDate", label: "Effective Date", type: "date", required: true },
    ],
  },

  {
    id: "fm_open_bank",
    title: "Open Bank Account",
    icon: "🏦",
    category: "first_meeting",
    meetingType: "board",
    kind: "ordinary",
    section: "Companies Act, 2013",
    agendaTitle: "To open bank accounts of the Company",
    proposal: "The Company needs a bank account to effectively monitor its finances and cash flows. The Board to approve opening of a current account.",
    discussion: "To effectively monitor Company's finances and cash flows, it was decided to open a bank account with {bankName}, {branchName} Branch. The following resolution was approved.",
    preamble: "The Company requires a bank account to conduct its operations and manage its finances. The Board needs to authorize the opening of a current account and designate authorized signatories.",
    resolution: "RESOLVED THAT a current account be opened in the name of the Company with {bankName}, at the {branchName} Branch.\n\nRESOLVED FURTHER THAT {authorizedPerson1} and {authorizedPerson2}, both Directors of the Company be and hereby are severally authorized to operate the bank account up to and not exceeding Rs. {singleLimit}/- per instrument/instruction.\n\nRESOLVED FURTHER THAT {authorizedPerson1} and {authorizedPerson2}, both Directors of the Company be and hereby are jointly authorized to operate the bank account exceeding the amount specified herein above.\n\nRESOLVED FURTHER THAT a copy of this resolution be given to the Banker, as may be required under the seal and signature of any one of the Directors of the Company.",
    fields: [
      { key: "bankName", label: "Bank Name", placeholder: "State Bank of India", required: true },
      { key: "branchName", label: "Branch Name", placeholder: "Connaught Place, New Delhi", required: true },
      { key: "authorizedPerson1", label: "Authorized Signatory 1 (Director)", required: true },
      { key: "authorizedPerson2", label: "Authorized Signatory 2 (Director)", required: true },
      { key: "singleLimit", label: "Single Signatory Limit (Rs.)", placeholder: "1,00,000", required: true },
    ],
  },

  {
    id: "fm_print_share_cert",
    title: "Print Share Certificates (Form SH-1)",
    icon: "📜",
    category: "first_meeting",
    meetingType: "board",
    kind: "ordinary",
    section: "Companies (Share Capital and Debentures) Rules, 2014",
    agendaTitle: "To approve format of Share Certificates and authorize printing",
    proposal: "The Board to approve the format for Share Certificate in Form SH-1 and authorize the Chairperson to get the same printed.",
    discussion: "The Board approved the format of Share Certificate in Form SH-1 tabled at the meeting and authorized {authPerson} to get the same printed. The following resolution was approved.",
    preamble: "The Company is required to issue Share Certificates to its shareholders in Form SH-1 as prescribed under the Companies (Share Capital and Debentures) Rules, 2014. The Board needs to approve the format and authorize printing.",
    resolution: "RESOLVED THAT the format of Share Certificate in Form SH-1 in terms of the Companies (Share Capital and Debentures) Rules, 2014 tabled before the meeting and initialled by the Chairman for the purpose of identification be and is hereby approved.\n\nRESOLVED FURTHER THAT {authPerson} be and is hereby authorized to get the said Share Certificates printed and keep in safe custody.",
    fields: [
      { key: "authPerson", label: "Authorized Person (Director/Chairman)", required: true },
    ],
  },

  {
    id: "fm_statutory_registrations",
    title: "Apply for PAN / TAN / GST & Statutory Registrations",
    icon: "🔏",
    category: "first_meeting",
    meetingType: "board",
    kind: "ordinary",
    section: "Companies Act, 2013",
    agendaTitle: "To apply for PAN, TAN, GST and other statutory registrations",
    proposal: "The Company is required to obtain statutory registrations like PAN, TAN, GST, Professional Tax registrations etc. The Board to authorize Directors to make necessary applications.",
    discussion: "It was noted that the Company is required to obtain statutory registrations. The Board members discussed and authorized the Directors to make necessary applications to the appropriate authorities.",
    preamble: "The Company is required to obtain various statutory registrations including PAN, TAN, GST Registration and other applicable registrations for conducting its business operations.",
    resolution: "RESOLVED THAT {director1} and {director2}, Directors of the Company be and are hereby authorized jointly and severally to make necessary applications to the appropriate authorities to obtain PAN, TAN, GST Registration, Professional Tax, Shops & Establishments, Import Export Code (IEC) Registrations and such other registrations as may be required.\n\nRESOLVED FURTHER THAT {director1} and {director2}, Directors of the Company be and are hereby authorized jointly and severally to correct, amend, delete or modify such applications and to sign all the papers, resolutions and such other documents related thereto and to do all such acts, deeds, matters and things necessary to implement this resolution.",
    fields: [
      { key: "director1", label: "Director 1 Name", required: true },
      { key: "director2", label: "Director 2 Name", required: true },
    ],
  },

  {
    id: "fm_preliminary_expenses",
    title: "Ratify Preliminary Expenses & Pre-Incorporation Contracts",
    icon: "💼",
    category: "first_meeting",
    meetingType: "board",
    kind: "ordinary",
    section: "Companies Act, 2013",
    agendaTitle: "To approve preliminary expenses and ratify preliminary contracts",
    proposal: "The pre-incorporation expenses incurred by the promoters are to be charged to the accounts of the Company and reimbursed. The Board to also ratify preliminary contracts entered by promoters.",
    discussion: "It was decided to charge the pre-incorporation expenses of Rs. {amount} incurred by the promoters to the accounts of the Company and reimburse the same. The Board further ratified the preliminary contracts.",
    preamble: "The promoters of the Company incurred certain expenses prior to incorporation for the purpose of incorporating the Company. These expenses need to be taken on record and reimbursed, and preliminary contracts ratified.",
    resolution: "RESOLVED THAT an amount of Rs. {amount}/- (Rupees {amountWords} only) being pre-incorporation expenses incurred by the Promoters as detailed in the statement placed before the Board be taken on record and accounted in the books of the Company.\n\nRESOLVED FURTHER THAT the said amount be and is hereby reimbursed to the promoters.\n\nRESOLVED FURTHER THAT all the preliminary contracts entered into by the promoters on behalf of the Company be and are hereby ratified and approved.",
    fields: [
      { key: "amount", label: "Amount (Rs.)", placeholder: "50,000", required: true },
      { key: "amountWords", label: "Amount in Words", placeholder: "Fifty Thousand", required: true },
    ],
  },

  {
    id: "fm_financial_year",
    title: "Fix Financial Year",
    icon: "📅",
    category: "first_meeting",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 2(41) — Companies Act, 2013",
    agendaTitle: "To fix the Financial Year of the Company",
    proposal: "The Board shall fix the first financial year of the Company as the period from the date of incorporation to 31st March and thereafter April to March each year.",
    discussion: "The Board fixed the first financial year of the Company from {incDate} to 31st March, {firstFYEnd} and that subsequent Financial Years shall be from 1st April to 31st March of the subsequent year.",
    preamble: "As per the Companies Act, 2013, the Board is required to fix the financial year of the Company. The first financial year shall be from the date of incorporation to the next 31st March.",
    resolution: "RESOLVED THAT the first financial year of the Company be the period from the date of incorporation {incDate} to 31st March, {firstFYEnd} and that the subsequent Financial Years of the Company start on 1st April of each year and end on 31st March of the subsequent year.",
    fields: [
      { key: "incDate", label: "Date of Incorporation", type: "date", required: true },
      { key: "firstFYEnd", label: "First FY End Year (e.g. 2026)", placeholder: "2026", required: true },
    ],
  },

  {
    id: "fm_first_auditor",
    title: "Appoint First Auditor (Sec. 139(6))",
    icon: "🧾",
    category: "first_meeting",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 139(6) — Companies Act, 2013",
    rocFiling: "ADT-1 within 15 days",
    agendaTitle: "To appoint the First Auditor of the Company",
    proposal: "The Board to appoint the First Auditors of the Company to hold office till the conclusion of the First Annual General Meeting.",
    discussion: "The Board after considering the qualification and experience appointed {auditorName} as the First Auditors of the Company to hold office till the conclusion of the First Annual General Meeting.",
    preamble: "Pursuant to Section 139(6) of the Companies Act, 2013, the first auditor of a company shall be appointed by the Board of Directors within thirty days from the date of registration of the company.",
    resolution: "RESOLVED THAT in terms of Section 139(6) and other applicable provisions, if any, of the Companies Act, 2013 read with the Companies (Audit and Auditors) Rules, 2014, {auditorName}, Chartered Accountant(s), {auditorAddress}, (Firm Regn. No. {firmRegNo}) be and are hereby appointed as First Auditors of the Company to hold office until the conclusion of the First Annual General Meeting of the Company on such remuneration as may be fixed by the Board of Directors.\n\nRESOLVED FURTHER THAT the Directors be and are hereby authorized severally to communicate the appointment to the said auditors and file necessary e-forms with the Registrar of Companies and to do all such acts, deeds and things which are necessary to give effect to the above resolution.",
    fields: [
      { key: "auditorName", label: "Auditor Name / Firm Name", required: true },
      { key: "auditorAddress", label: "Auditor Address / Place", required: true },
      { key: "firmRegNo", label: "Firm Registration No.", required: true },
    ],
    notes: "Must be appointed within 30 days of incorporation. File ADT-1 within 15 days of appointment.",
  },

  {
    id: "fm_kmp",
    title: "Appoint Key Managerial Personnel (Sec. 203)",
    icon: "👔",
    category: "first_meeting",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 203 — Companies Act, 2013",
    rocFiling: "MR-1 within 60 days",
    agendaTitle: "To appoint Key Managerial Personnel",
    proposal: "The Board to appoint Managing Director / CEO / CFO / Company Secretary as Key Managerial Personnel of the Company.",
    discussion: "The Board discussed and approved the appointment of {kmpName} as {kmpDesig}, a Key Managerial Personnel of the Company with effect from {effectiveDate}.",
    preamble: "Pursuant to Section 203 of the Companies Act, 2013, every company belonging to the prescribed class shall have Key Managerial Personnel. The Company has identified the candidate for appointment.",
    resolution: "RESOLVED THAT pursuant to Section 203 and other applicable provisions, if any, of the Companies Act, 2013 read with the Companies (Appointment and Remuneration of Managerial Personnel) Rules, 2014, {kmpName} be and is hereby appointed as {kmpDesig}, a Key Managerial Personnel of the Company with effect from {effectiveDate} on the remuneration and terms as embodied in the letter of appointment tabled at the meeting.\n\nRESOLVED FURTHER THAT the Directors be and are hereby authorized severally to file necessary e-Forms with Registrar of Companies, take necessary steps to make entries in the Register of Directors and Key Managerial Personnel and to do all such acts, deeds or things which are necessary to give effect to the said appointment.",
    fields: [
      { key: "kmpName", label: "KMP Name", required: true },
      { key: "kmpDesig", label: "Designation", type: "select", options: ["Managing Director", "Chief Executive Officer", "Chief Financial Officer", "Company Secretary", "Whole-Time Director"], required: true },
      { key: "effectiveDate", label: "Effective Date", type: "date", required: true },
    ],
  },

  {
    id: "fm_common_seal",
    title: "Adopt Common Seal",
    icon: "🔵",
    category: "first_meeting",
    meetingType: "board",
    kind: "ordinary",
    section: "Companies Act, 2013",
    agendaTitle: "To adopt the Common Seal of the Company",
    proposal: "The Common Seal of the Company to be placed before the Board for adoption.",
    discussion: "The Common Seal of the Company was placed before the Board for adoption. The Board members discussed and approved the following resolution.",
    preamble: "The Company requires a Common Seal for execution of documents. The Common Seal has been prepared and is placed before the Board for adoption.",
    resolution: "RESOLVED THAT the Common Seal of the Company, as per impression affixed in the margin of the Minutes as initialled by the Chairperson for the purpose of identification and produced at this meeting be and is hereby approved and adopted as the Common Seal of the Company.\n\nRESOLVED FURTHER THAT the said Common Seal be affixed on any instrument only on the authority of the resolution of the Board of Directors or of a Committee of the Board of Directors of the Company authorized by it in that behalf.",
    fields: [],
  },

  {
    id: "fm_share_subscription",
    title: "Note Share Subscription (INC-20A)",
    icon: "💵",
    category: "first_meeting",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 10A — Companies Act, 2013",
    rocFiling: "INC-20A within 180 days",
    agendaTitle: "To note share subscription and authorize INC-20A filing",
    proposal: "The Board to note receipt of share subscription money from subscribers and authorize filing of INC-20A declaration with the Registrar.",
    discussion: "The Board noted receipt of share subscription money of Rs. {subscriptionAmount} from the subscribers and authorized the filing of INC-20A declaration of commencement of business.",
    preamble: "Pursuant to Section 10A of the Companies Act, 2013 as inserted by the Companies (Amendment) Ordinance, 2018, every company having share capital is required to file a declaration for commencement of business within 180 days of incorporation.",
    resolution: "RESOLVED THAT the Board of Directors do and hereby take note of the receipt of subscription money of Rs. {subscriptionAmount}/- from the subscribers to the Memorandum of Association as detailed in the statement placed before the Board.\n\nRESOLVED FURTHER THAT {authorizedDirector}, Director of the Company be and is hereby authorized to file the declaration in Form INC-20A with the Registrar of Companies and do all such acts and deeds as may be necessary in this regard.\n\nRESOLVED FURTHER THAT the Directors be and are hereby authorized severally to do all such acts, deeds and things as may be necessary to give effect to this resolution.",
    fields: [
      { key: "subscriptionAmount", label: "Total Subscription Amount (Rs.)", required: true },
      { key: "authorizedDirector", label: "Authorized Director Name", required: true },
    ],
    notes: "INC-20A must be filed within 180 days of incorporation. Proof of payment of subscription money required.",
  },

  /* ─────────────────────────────────────────────────────────────
     CATEGORY: DIRECTORS & KMP
  ───────────────────────────────────────────────────────────── */
  {
    id: "dir_appoint_additional",
    title: "Appoint Additional Director (Sec. 161(1))",
    icon: "👤",
    category: "directors",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 161(1) — Companies Act, 2013",
    rocFiling: "DIR-12 within 30 days",
    agendaTitle: "To appoint Additional Director",
    proposal: "The Board to consider and approve the appointment of {directorName} as an Additional Director of the Company pursuant to Section 161(1) of the Companies Act, 2013.",
    discussion: "The Board considered the appointment of {directorName} as an Additional Director of the Company pursuant to Section 161(1) of the Companies Act, 2013 and approved the following resolution.",
    preamble: "The Company proposes to appoint an Additional Director pursuant to Section 161(1) of the Companies Act, 2013. The candidate has given his/her consent to act as Director and has submitted Form DIR-2.",
    resolution: "RESOLVED THAT pursuant to Section 161(1) and other applicable provisions, if any, of the Companies Act, 2013 read with the Companies (Appointment and Qualification of Directors) Rules, 2014, {directorName}, holding DIN {din} be and is hereby appointed as an Additional Director of the Company with effect from {effectiveDate} to hold office upto the date of next Annual General Meeting of the Company.\n\nRESOLVED FURTHER THAT the Directors be and are hereby authorized severally to file necessary e-form DIR-12 with the Registrar of Companies within 30 days and to do all such acts and things as may be necessary.",
    fields: [
      { key: "directorName", label: "Director's Full Name", required: true },
      { key: "din", label: "DIN", placeholder: "01234567", required: true },
      { key: "effectiveDate", label: "Effective Date", type: "date", required: true },
    ],
    notes: "File DIR-12 with ROC within 30 days of appointment. Director must also file DIR-11.",
  },

  {
    id: "dir_accept_resignation",
    title: "Acceptance of Director's Resignation (Sec. 168)",
    icon: "🚪",
    category: "directors",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 168 — Companies Act, 2013",
    rocFiling: "DIR-12 within 30 days",
    agendaTitle: "To accept resignation of Director",
    proposal: "The Board to consider and accept the resignation of {directorName} (DIN: {din}) as Director of the Company with effect from {effectiveDate}.",
    discussion: "The Board took note of the resignation letter received from {directorName} and accepted the resignation with effect from {effectiveDate}. The following resolution was approved.",
    preamble: "The Company has received a letter of resignation from {directorName}, Director of the Company. The Board is required to accept the resignation and file the necessary forms with the Registrar.",
    resolution: "RESOLVED THAT the Board of Directors do and hereby take note of and accept the resignation of {directorName} (DIN: {din}) as a Director of the Company with effect from {effectiveDate}.\n\nRESOLVED FURTHER THAT the Directors be and are hereby authorized severally to file e-form DIR-12 with the Registrar of Companies within 30 days and to do all such acts and things as may be necessary to give effect to this resolution.",
    fields: [
      { key: "directorName", label: "Director's Full Name", required: true },
      { key: "din", label: "DIN", placeholder: "01234567", required: true },
      { key: "effectiveDate", label: "Effective Date of Resignation", type: "date", required: true },
    ],
    notes: "File DIR-12 with ROC within 30 days. Director must also file DIR-11 with ROC.",
  },

  {
    id: "dir_appoint_md",
    title: "Appoint Managing Director (Sec. 196/197)",
    icon: "🏆",
    category: "directors",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 196, 197 — Companies Act, 2013",
    rocFiling: "MR-1 within 60 days",
    agendaTitle: "To appoint Managing Director",
    proposal: "The Board to consider and approve the appointment of {mdName} as Managing Director of the Company for a period of {tenure} years on the terms and conditions as recommended.",
    discussion: "The Board considered the appointment of {mdName} as Managing Director of the Company for a period of {tenure} years on the terms and conditions as tabled at the meeting.",
    preamble: "The Company proposes to appoint a Managing Director pursuant to Section 196 and 197 of the Companies Act, 2013. The candidate has given his/her consent and the terms of appointment have been worked out.",
    resolution: "RESOLVED THAT pursuant to Sections 196, 197 and other applicable provisions, if any, of the Companies Act, 2013 read with Schedule V thereof and Rules made thereunder, {mdName} (DIN: {din}) be and is hereby appointed as the Managing Director of the Company for a period of {tenure} years with effect from {effectiveDate}, not liable to retire by rotation, on such remuneration and terms and conditions as set out in the draft agreement tabled before the meeting and initialled by the Chairperson for identification.\n\nRESOLVED FURTHER THAT the Directors be and are hereby authorized severally to file necessary e-form MR-1 with the Registrar of Companies within 60 days and to do all such acts, deeds and things as may be necessary to give effect to this resolution.",
    fields: [
      { key: "mdName", label: "Managing Director Name", required: true },
      { key: "din", label: "DIN", placeholder: "01234567", required: true },
      { key: "tenure", label: "Tenure (years)", placeholder: "5", required: true },
      { key: "effectiveDate", label: "Effective Date", type: "date", required: true },
    ],
    notes: "File MR-1 within 60 days. Approval of members required if remuneration exceeds prescribed limits.",
  },

  {
    id: "dir_related_party",
    title: "Approve Related Party Transaction (Sec. 188)",
    icon: "🤝",
    category: "directors",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 188 — Companies Act, 2013",
    rocFiling: "MBP-4 — Maintained in Register",
    agendaTitle: "To approve Related Party Transaction",
    proposal: "The Board to consider and approve the transaction/arrangement with a related party pursuant to Section 188 of the Companies Act, 2013.",
    discussion: "The Board considered the proposed transaction with {relatedParty} which is a related party transaction as defined under Section 188 of the Companies Act, 2013. The Board approved the following resolution.",
    preamble: "The Company proposes to enter into a transaction with {relatedParty}, which is a related party. Pursuant to Section 188 of the Companies Act, 2013, Board approval is required for related party transactions.",
    resolution: "RESOLVED THAT pursuant to Section 188 and other applicable provisions, if any, of the Companies Act, 2013 read with the Companies (Meetings of Board and its Powers) Rules, 2014, the Board do and hereby approve the {transactionType} with {relatedParty}, a related party, on the following terms and conditions:\nNature of Transaction: {transactionType}\nValue: Rs. {transactionValue}/-\nPeriod: {transactionPeriod}\n\nRESOLVED FURTHER THAT the Directors be and are hereby authorized severally to execute all documents and to do all such acts, deeds and things as may be necessary to give effect to this resolution.",
    fields: [
      { key: "relatedParty", label: "Related Party Name", required: true },
      { key: "transactionType", label: "Nature of Transaction", placeholder: "Sale of goods / Purchase of goods / Services", required: true },
      { key: "transactionValue", label: "Transaction Value (Rs.)", required: true },
      { key: "transactionPeriod", label: "Period/Duration", placeholder: "FY 2025-26", required: true },
    ],
    notes: "Interested director must not participate in the vote. Entry in MBP-4 register required.",
  },

  {
    id: "dir_delegate_kmp",
    title: "Delegate Powers to KMP / Officers",
    icon: "🔑",
    category: "directors",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 179 — Companies Act, 2013",
    agendaTitle: "To delegate powers to Key Managerial Personnel",
    proposal: "The Board to consider and delegate certain powers to the KMP/Officers of the Company to enable efficient conduct of day-to-day operations.",
    discussion: "The Board considered the delegation of powers to {kmpName}, {kmpDesig} of the Company for the purpose of {purposeOfDelegation}. The following resolution was approved.",
    preamble: "For the efficient management of Company's operations, the Board proposes to delegate certain powers to the Key Managerial Personnel pursuant to Section 179(3) of the Companies Act, 2013.",
    resolution: "RESOLVED THAT the Board of Directors hereby delegates the following powers to {kmpName}, {kmpDesig} of the Company:\n{powersDelegate}\n\nRESOLVED FURTHER THAT the said delegation shall be effective from {effectiveDate} and shall remain in force until revoked by the Board.",
    fields: [
      { key: "kmpName", label: "KMP / Officer Name", required: true },
      { key: "kmpDesig", label: "Designation", required: true },
      { key: "powersDelegate", label: "Powers to be Delegated", type: "textarea", required: true },
      { key: "effectiveDate", label: "Effective Date", type: "date", required: true },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     CATEGORY: SHARE CAPITAL
  ───────────────────────────────────────────────────────────── */
  {
    id: "sh_transfer_approval",
    title: "Approve Transfer of Shares (Sec. 56)",
    icon: "🔄",
    category: "shares",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 56 — Companies Act, 2013",
    agendaTitle: "To consider and approve transfer of shares",
    proposal: "The Board to consider the request for transfer of {shares} equity shares from {transferor} to {transferee} as per Form SH-4 submitted along with share certificate(s).",
    discussion: "The Board considered the request for transfer of {shares} equity shares of Rs. {faceValue} each from {transferor} to {transferee} as per Form SH-4 and approved the following resolution.",
    preamble: "The Company has received Form SH-4 for transfer of {shares} equity shares from {transferor} to {transferee} along with the original share certificate(s). The Board needs to approve the transfer.",
    resolution: "RESOLVED THAT the request received for transfer of {shares} (in words: {sharesInWords}) Equity Shares of Rs. {faceValue}/- each bearing Certificate No. {certNo}, distinctive numbers {dnFrom} to {dnTo} from {transferor} to {transferee} as per Form SH-4 submitted along with the share certificate(s) be and is hereby approved.\n\nRESOLVED FURTHER THAT the Company Secretary / Director be and is hereby authorized to effect the transfer in the Register of Members, issue new Share Certificate in the name of {transferee} and take all other necessary steps to give effect to the above resolution.",
    fields: [
      { key: "transferor", label: "Transferor Name", required: true },
      { key: "transferee", label: "Transferee Name", required: true },
      { key: "shares", label: "Number of Shares", required: true },
      { key: "sharesInWords", label: "Shares in Words", required: true },
      { key: "faceValue", label: "Face Value (Rs.)", placeholder: "10", required: true },
      { key: "certNo", label: "Certificate No.", required: true },
      { key: "dnFrom", label: "Distinctive No. From", required: true },
      { key: "dnTo", label: "Distinctive No. To", required: true },
    ],
    notes: "Stamp duty @ 0.25% of market value payable on Form SH-4.",
  },

  {
    id: "sh_issue_duplicate_cert",
    title: "Issue Duplicate Share Certificate",
    icon: "📄",
    category: "shares",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 46(2) — Companies Act, 2013",
    agendaTitle: "To issue renewed and/or duplicate Share Certificates",
    proposal: "The Board to consider and approve the issue of a duplicate share certificate to {shareholderName} in lieu of the original certificate reported as lost/destroyed.",
    discussion: "The Board considered the application received from {shareholderName} for issue of duplicate share certificate in lieu of the original certificate No. {certNo} reported as {reason}. The Board approved the following resolution.",
    preamble: "The Company has received an application from {shareholderName} for issuance of a duplicate share certificate in lieu of the original certificate which has been lost/destroyed/mutilated. The Board needs to approve the same.",
    resolution: "RESOLVED THAT pursuant to Section 46(2) and other applicable provisions, if any, of the Companies Act, 2013 read with Rule 6 of the Companies (Share Capital and Debentures) Rules, 2014, the Company do and hereby issue a duplicate share certificate in lieu of the original Share Certificate No. {certNo} for {shares} Equity shares of Rs. {faceValue}/- each held by {shareholderName}, which has been reported as {reason}.\n\nRESOLVED FURTHER THAT necessary entries be made in the Register of Members and the Company Secretary / Director be and is hereby authorized to take all necessary steps to give effect to this resolution.",
    fields: [
      { key: "shareholderName", label: "Shareholder Name", required: true },
      { key: "certNo", label: "Original Certificate No.", required: true },
      { key: "shares", label: "Number of Shares", required: true },
      { key: "faceValue", label: "Face Value (Rs.)", placeholder: "10", required: true },
      { key: "reason", label: "Reason", type: "select", options: ["lost", "destroyed", "mutilated/defaced"], required: true },
    ],
  },

  {
    id: "sh_allot_equity",
    title: "Allot Equity Shares",
    icon: "📊",
    category: "shares",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 62 — Companies Act, 2013",
    rocFiling: "PAS-3 within 30 days",
    agendaTitle: "To allot Equity shares",
    proposal: "The Board to consider allotment of {shares} equity shares of Rs. {faceValue} each at a price of Rs. {issuePrice} per share to the applicants.",
    discussion: "The Board considered allotment of {shares} equity shares to {allottees} and approved the following resolution.",
    preamble: "The Company proposes to allot equity shares pursuant to the approval received from shareholders. The applications for subscription have been received and share application money has been received.",
    resolution: "RESOLVED THAT {shares} Equity Shares of Rs. {faceValue}/- each at a price of Rs. {issuePrice}/- per share aggregating to Rs. {totalAmount}/- be and are hereby allotted to {allottees} as per the list tabled before the meeting.\n\nRESOLVED FURTHER THAT the Directors be and are hereby authorized severally to file return of allotment in Form PAS-3 with the Registrar of Companies within 30 days and to issue Share Certificates and do all such acts and things as may be necessary.",
    fields: [
      { key: "shares", label: "Number of Shares", required: true },
      { key: "faceValue", label: "Face Value (Rs.)", placeholder: "10", required: true },
      { key: "issuePrice", label: "Issue Price (Rs.)", placeholder: "100", required: true },
      { key: "totalAmount", label: "Total Amount (Rs.)", required: true },
      { key: "allottees", label: "Name(s) of Allottees", type: "textarea", required: true },
    ],
    notes: "File PAS-3 within 30 days of allotment.",
  },

  {
    id: "sh_authorize_rights_issue",
    title: "Authorize Rights Issue (Sec. 62(1)(a))",
    icon: "🎯",
    category: "shares",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 62(1)(a) — Companies Act, 2013",
    agendaTitle: "To authorize Rights Issue of shares",
    proposal: "The Board to consider and approve a rights issue of equity shares to the existing shareholders of the Company in the ratio of {ratio} on the existing paid-up share capital.",
    discussion: "The Board considered and approved a rights issue of equity shares at Rs. {issuePrice} per share to the existing shareholders of the Company in the ratio of {ratio}.",
    preamble: "The Company proposes to issue equity shares on rights basis to the existing shareholders pursuant to Section 62(1)(a) of the Companies Act, 2013.",
    resolution: "RESOLVED THAT pursuant to Section 62(1)(a) and other applicable provisions, if any, of the Companies Act, 2013, the Board of Directors do and hereby approve the issue of {shares} Equity Shares of Rs. {faceValue}/- each at Rs. {issuePrice}/- per share on rights basis to the existing equity shareholders of the Company in the ratio of {ratio}.\n\nRESOLVED FURTHER THAT the offer letter be sent to all existing shareholders and the Directors be and are hereby authorized severally to do all such acts, deeds and things as may be necessary to complete the rights issue.",
    fields: [
      { key: "shares", label: "Total Shares to be Issued", required: true },
      { key: "faceValue", label: "Face Value (Rs.)", placeholder: "10", required: true },
      { key: "issuePrice", label: "Issue Price (Rs.)", required: true },
      { key: "ratio", label: "Rights Ratio (e.g. 1:2)", placeholder: "1 share for every 2 held", required: true },
    ],
  },

  {
    id: "sh_buyback",
    title: "Authorize Buy-Back of Shares (Sec. 68)",
    icon: "💹",
    category: "shares",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 68 — Companies Act, 2013",
    rocFiling: "SH-8 / SH-9 / SH-11 as applicable",
    agendaTitle: "To authorize buy-back of shares",
    proposal: "The Board to consider and approve a buy-back of {shares} equity shares of Rs. {faceValue} each aggregating to Rs. {totalAmount} from the shareholders.",
    discussion: "The Board considered the proposal for buy-back of {shares} equity shares aggregating to Rs. {totalAmount} representing {percentage}% of paid-up equity capital and approved the following resolution.",
    preamble: "The Company proposes to buy-back its equity shares pursuant to Section 68 of the Companies Act, 2013. The Company has sufficient free reserves for this purpose.",
    resolution: "RESOLVED THAT pursuant to Section 68 and other applicable provisions, if any, of the Companies Act, 2013 read with the Companies (Share Capital and Debentures) Rules, 2014 and subject to approval of members wherever required, approval of the Board be and is hereby accorded for the Buy-back of {shares} Equity Shares of Rs. {faceValue}/- each aggregating to Rs. {totalAmount}/- representing {percentage}% of the paid-up equity capital and free reserves, from the existing shareholders on a proportionate basis.\n\nRESOLVED FURTHER THAT the Directors be and are hereby authorized severally to do all such acts, deeds and things as may be necessary to complete the buy-back.",
    fields: [
      { key: "shares", label: "Number of Shares to Buy Back", required: true },
      { key: "faceValue", label: "Face Value (Rs.)", placeholder: "10", required: true },
      { key: "totalAmount", label: "Total Buy-Back Amount (Rs.)", required: true },
      { key: "percentage", label: "% of Paid-Up Capital", placeholder: "10", required: true },
    ],
    notes: "Buy-back cannot exceed 25% of total paid-up capital + free reserves.",
  },

  /* ─────────────────────────────────────────────────────────────
     CATEGORY: BANKING OPERATIONS
  ───────────────────────────────────────────────────────────── */
  {
    id: "bank_open_account",
    title: "Open Bank Account",
    icon: "🏦",
    category: "banking",
    meetingType: "board",
    kind: "ordinary",
    section: "Companies Act, 2013",
    agendaTitle: "To open Bank account(s)",
    proposal: "The Board to consider and authorize opening of a bank account with {bankName}, {branchName} Branch and designate authorized signatories.",
    discussion: "The Board considered the proposal to open a bank account with {bankName}, {branchName} Branch and authorized the designated signatories to operate the account.",
    preamble: "The Company requires an additional bank account for its operational requirements. The Board needs to authorize the opening of the account and designate authorized signatories.",
    resolution: "RESOLVED THAT a {accountType} account be opened in the name of the Company with {bankName}, at the {branchName} Branch.\n\nRESOLVED FURTHER THAT {authorizedPerson1} and {authorizedPerson2} be and hereby are severally authorized to operate the bank account up to and not exceeding Rs. {singleLimit}/- per instrument.\n\nRESOLVED FURTHER THAT {authorizedPerson1} and {authorizedPerson2} be and hereby are jointly authorized to operate the bank account exceeding the amount specified above.\n\nRESOLVED FURTHER THAT a certified copy of this resolution be provided to the bank as required.",
    fields: [
      { key: "bankName", label: "Bank Name", required: true },
      { key: "branchName", label: "Branch Name", required: true },
      { key: "accountType", label: "Account Type", type: "select", options: ["Current", "Savings", "Overdraft"], required: true },
      { key: "authorizedPerson1", label: "Authorized Signatory 1", required: true },
      { key: "authorizedPerson2", label: "Authorized Signatory 2", required: true },
      { key: "singleLimit", label: "Single Signatory Limit (Rs.)", placeholder: "1,00,000", required: true },
    ],
  },

  {
    id: "bank_close_account",
    title: "Close Bank Account",
    icon: "❌",
    category: "banking",
    meetingType: "board",
    kind: "ordinary",
    section: "Companies Act, 2013",
    agendaTitle: "To close Bank account(s)",
    proposal: "The Board to consider and authorize closure of bank account No. {accountNo} with {bankName}.",
    discussion: "The Board considered the proposal to close the bank account No. {accountNo} with {bankName}, {branchName} Branch and authorized the Directors to take necessary action.",
    preamble: "The Company no longer requires the bank account maintained with {bankName}. The Board is required to authorize the closure of the said account.",
    resolution: "RESOLVED THAT the bank account bearing account number {accountNo} maintained with {bankName}, {branchName} Branch be and is hereby closed.\n\nRESOLVED FURTHER THAT {authorizedPerson}, Director of the Company be and is hereby authorized to sign all documents and do all acts necessary for the closure of the said account and transfer of balances thereof.",
    fields: [
      { key: "accountNo", label: "Account Number", required: true },
      { key: "bankName", label: "Bank Name", required: true },
      { key: "branchName", label: "Branch Name", required: true },
      { key: "authorizedPerson", label: "Authorized Person", required: true },
    ],
  },

  {
    id: "bank_authorize_signatories",
    title: "Authorize Cheque / Banking Signatories",
    icon: "✍️",
    category: "banking",
    meetingType: "board",
    kind: "ordinary",
    section: "Companies Act, 2013",
    agendaTitle: "To authorize officials to sign cheques and financial instruments",
    proposal: "The Board to authorize designated persons to sign cheques, bills and other financial instruments on behalf of the Company.",
    discussion: "The Board authorized {person1} and {person2} to sign cheques, bills and financial instruments on behalf of the Company as authorized signatories.",
    preamble: "For efficient conduct of banking operations, the Board needs to authorize designated persons to sign cheques, bills of exchange and other financial instruments on behalf of the Company.",
    resolution: "RESOLVED THAT {person1}, {designation1} and {person2}, {designation2} of the Company be and are hereby authorized to sign cheques, bills of exchange, promissory notes and other financial instruments on behalf of the Company, either jointly or severally as specified below:\n- Up to Rs. {singleLimit}: Either one of the above may sign\n- Above Rs. {singleLimit}: Both must jointly sign\n\nRESOLVED FURTHER THAT the said authorization shall be communicated to the Company's bankers and shall remain in force until revoked by the Board.",
    fields: [
      { key: "person1", label: "Authorized Person 1 Name", required: true },
      { key: "designation1", label: "Designation 1", required: true },
      { key: "person2", label: "Authorized Person 2 Name", required: true },
      { key: "designation2", label: "Designation 2", required: true },
      { key: "singleLimit", label: "Single Signatory Limit (Rs.)", required: true },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     CATEGORY: ACCOUNTS & AUDIT
  ───────────────────────────────────────────────────────────── */
  {
    id: "audit_appoint_auditor",
    title: "Appoint / Reappoint Statutory Auditor (Sec. 139)",
    icon: "🔍",
    category: "financial",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 139 — Companies Act, 2013",
    rocFiling: "ADT-1 within 15 days of AGM",
    agendaTitle: "To appoint / reappoint Statutory Auditor",
    proposal: "The Board to recommend to members at the AGM the appointment/reappointment of {auditorName} as Statutory Auditors of the Company for a term of {term} years.",
    discussion: "The Board considered the appointment / reappointment of {auditorName}, Chartered Accountants as Statutory Auditors of the Company for a period of {term} years from the conclusion of the ensuing AGM and recommended the same for approval of members.",
    preamble: "The appointment/reappointment of Statutory Auditors is required to be approved by the members at the Annual General Meeting pursuant to Section 139 of the Companies Act, 2013.",
    resolution: "RESOLVED THAT pursuant to Section 139 and other applicable provisions, if any, of the Companies Act, 2013 read with the Companies (Audit and Auditors) Rules, 2014, subject to approval of members at the ensuing Annual General Meeting, {auditorName}, Chartered Accountants (Firm Registration No. {firmRegNo}) be and are hereby recommended for appointment/reappointment as Statutory Auditors of the Company for a term of {term} consecutive year(s) from the conclusion of the ensuing AGM to hold office till the conclusion of the {term}th AGM thereafter at such remuneration as may be fixed by the Board.",
    fields: [
      { key: "auditorName", label: "Audit Firm Name", required: true },
      { key: "firmRegNo", label: "Firm Registration No.", required: true },
      { key: "term", label: "Term (years)", placeholder: "5", required: true },
    ],
  },

  {
    id: "audit_appoint_secretarial_auditor",
    title: "Appoint Secretarial Auditor",
    icon: "📋",
    category: "financial",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 204 — Companies Act, 2013",
    agendaTitle: "To appoint Secretarial Auditor",
    proposal: "The Board to appoint a Practicing Company Secretary as Secretarial Auditor of the Company for the financial year.",
    discussion: "The Board approved the appointment of {auditorName}, Practicing Company Secretary as Secretarial Auditor of the Company for the year.",
    preamble: "Pursuant to Section 204 of the Companies Act, 2013, every listed company and certain other companies are required to obtain a Secretarial Audit Report. The Board needs to appoint a Practicing Company Secretary as Secretarial Auditor.",
    resolution: "RESOLVED THAT {auditorName}, Practicing Company Secretary, (Certificate of Practice No. {cpNo}) be and is hereby appointed as Secretarial Auditor of the Company for the year from 1st April {fyFrom} to 31st March {fyTo}.\n\nRESOLVED FURTHER THAT the Board of Directors / CEO be and are hereby authorized severally to fix the remuneration payable to the said auditor.",
    fields: [
      { key: "auditorName", label: "Company Secretary Name / Firm", required: true },
      { key: "cpNo", label: "Certificate of Practice No.", required: true },
      { key: "fyFrom", label: "FY Start Year", placeholder: "2025", required: true },
      { key: "fyTo", label: "FY End Year", placeholder: "2026", required: true },
    ],
  },

  {
    id: "audit_approve_financial_statements",
    title: "Approve Financial Statements",
    icon: "📊",
    category: "financial",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 134 — Companies Act, 2013",
    agendaTitle: "To approve the Financial Statements",
    proposal: "The Board to consider and approve the Financial Statements of the Company for the year ended 31st March, {year} prepared in accordance with the Companies Act, 2013 and applicable Accounting Standards.",
    discussion: "The Board considered and approved the Financial Statements of the Company for the year ended 31st March, {year} and authorized the Directors to sign the same.",
    preamble: "The Financial Statements of the Company for the financial year ended 31st March, {year} have been prepared and audited. The Board needs to approve the same pursuant to Section 134 of the Companies Act, 2013.",
    resolution: "RESOLVED THAT the Financial Statements of the Company comprising Balance Sheet as at 31st March, {year} and Statement of Profit and Loss, Cash Flow Statement and Notes thereto for the year ended on that date along with the Auditors' Report and the Directors' Report thereon as placed before the Board and initialled by the Chairman for identification be and are hereby approved.\n\nRESOLVED FURTHER THAT {director1} and {director2}, Directors of the Company be and are hereby authorized to sign the Financial Statements for and on behalf of the Board.",
    fields: [
      { key: "year", label: "Financial Year End (e.g. 2026)", placeholder: "2026", required: true },
      { key: "director1", label: "Signing Director 1", required: true },
      { key: "director2", label: "Signing Director 2", required: true },
    ],
  },

  {
    id: "audit_approve_boards_report",
    title: "Approve Board's Report",
    icon: "📝",
    category: "financial",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 134 — Companies Act, 2013",
    agendaTitle: "To approve the draft Board's Report",
    proposal: "The Board's Report for the year ended 31st March, {year} is placed before the Board for its approval.",
    discussion: "The Board considered and approved the Board's Report for the year ended 31st March, {year} and authorized Directors to sign and circulate the same.",
    preamble: "The Board's Report for the financial year ended 31st March, {year} has been prepared in accordance with Section 134 of the Companies Act, 2013. The Board needs to approve and adopt the same.",
    resolution: "RESOLVED THAT the Board's Report for the year ended 31st March, {year} placed before the Board and authenticated by the Chairperson be and is hereby approved for circulation among the shareholders and the same be signed by {director1} and {director2}, Directors of the Company for and on behalf of the Board.\n\nRESOLVED FURTHER THAT the Directors of the Company be and are hereby authorized severally to file necessary e-Forms with Registrar of Companies.",
    fields: [
      { key: "year", label: "Financial Year End (e.g. 2026)", placeholder: "2026", required: true },
      { key: "director1", label: "Director 1 Name", required: true },
      { key: "director2", label: "Director 2 Name", required: true },
    ],
  },

  {
    id: "audit_close_register",
    title: "Close Register of Members",
    icon: "📒",
    category: "financial",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 91 — Companies Act, 2013",
    agendaTitle: "To approve closure of Register of Members & Share Transfer Books",
    proposal: "The Board to consider closure of Register of Members and Share Transfer Books to crystallize the list of members entitled to dividend / attending AGM.",
    discussion: "The Board approved the closure of Register of Members and Share Transfer Register from {fromDate} to {toDate} (both days inclusive) for the purpose of the Annual General Meeting / dividend payment.",
    preamble: "Pursuant to Section 91 of the Companies Act, 2013, the Company proposes to close the Register of Members and Share Transfer Books to determine shareholders entitled to dividend and to attend the AGM.",
    resolution: "RESOLVED THAT pursuant to Section 91 of the Companies Act, 2013, the Register of Members and the Share Transfer Register be closed for a period of {days} days from {fromDate} to {toDate} both days inclusive.\n\nRESOLVED FURTHER THAT the Company Secretary and the Directors be and are hereby authorized severally to do all such acts and deeds as may be required in this regard.",
    fields: [
      { key: "fromDate", label: "Closure From Date", type: "date", required: true },
      { key: "toDate", label: "Closure To Date", type: "date", required: true },
      { key: "days", label: "Number of Days", required: true },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     CATEGORY: COMPLIANCE & ROC
  ───────────────────────────────────────────────────────────── */
  {
    id: "comp_review_compliance",
    title: "Review Compliance Status Report",
    icon: "⚖️",
    category: "compliance",
    meetingType: "board",
    kind: "ordinary",
    section: "Companies Act, 2013",
    agendaTitle: "To review the Compliance Status",
    proposal: "The periodical status report on the compliance of various statutory legislations is placed before the Board for its consideration.",
    discussion: "The Board noted the periodical compliance status report presented by the Company Secretary / Director and approved the following resolution.",
    preamble: "The Board of Directors is responsible for ensuring compliance with applicable laws. A periodic compliance status report has been prepared and is placed before the Board for review.",
    resolution: "RESOLVED THAT the status report on the statutory compliance presented by the Company Secretary / {presentedBy}, Director of the Company be and is hereby taken on record.",
    fields: [
      { key: "presentedBy", label: "Presented By (Name)", required: true },
    ],
  },

  {
    id: "comp_authorize_eforms",
    title: "Authorize Filing of e-Forms with ROC",
    icon: "🖥️",
    category: "compliance",
    meetingType: "board",
    kind: "ordinary",
    section: "Companies Act, 2013",
    agendaTitle: "To authorize filing of e-forms and documents with ROC",
    proposal: "The Board to authorize Directors / Company Secretary / CEO to file relevant e-forms, returns and documents including Annual Return with the Registrar of Companies.",
    discussion: "The Board authorized the Directors, Company Secretary and CEO to file relevant e-forms, returns and other documents with the Registrar of Companies as required from time to time.",
    preamble: "As per the Companies Act, 2013, every company needs to file various e-forms, returns, documents and records with the Registrar of Companies. To enable this, the Board needs to authorize designated persons.",
    resolution: "RESOLVED THAT the Directors of the Company be and are hereby authorized severally to file relevant e-forms and such other documents and records including Annual Return with Registrar of Companies or such other statutory authorities as may be required from time to time.\n\nRESOLVED FURTHER THAT the Company Secretary / the Directors / CEO / Manager be and are hereby authorized severally to do all such acts and deeds as may be required in this regard.",
    fields: [],
  },

  {
    id: "comp_agm_notice",
    title: "Approve AGM Notice",
    icon: "📣",
    category: "compliance",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 101 — Companies Act, 2013",
    agendaTitle: "To approve the draft notice of Annual General Meeting",
    proposal: "The Board to approve the draft notice of the Annual General Meeting to be held on {agmDate} along with the explanatory statement.",
    discussion: "The Board considered and approved the draft notice of the Annual General Meeting to be held on {agmDate} at {venue} and authorized the Company Secretary / Directors to circulate the same.",
    preamble: "The Company is required to hold its Annual General Meeting. The draft notice for the AGM along with the explanatory statement has been prepared for the Board's approval.",
    resolution: "RESOLVED THAT the draft Notice of the Annual General Meeting of the Company to be held on {agmDate} at {venue} as placed before the meeting and initialled by the Chairman for identification be and is hereby approved.\n\nRESOLVED FURTHER THAT the Company Secretary and the Directors be and are hereby authorized severally to issue the said Notice to the members and others entitled to receive the same and to do all necessary acts in this regard.",
    fields: [
      { key: "agmDate", label: "AGM Date", type: "date", required: true },
      { key: "venue", label: "AGM Venue", type: "textarea", required: true },
    ],
  },

  {
    id: "comp_recommend_dividend",
    title: "Recommend Dividend on Equity Shares",
    icon: "💸",
    category: "compliance",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 123 — Companies Act, 2013",
    agendaTitle: "To propose payment of dividend on Equity shares",
    proposal: "Based on the audited financials for the year ended 31st March, {year}, the Board to consider recommending a dividend of Rs. {dividendPerShare} per Equity Share.",
    discussion: "Based on the audited financials for the year ended 31st March, {year}, the Board recommended a dividend of Rs. {dividendPerShare} per Equity Share subject to approval of members at the Annual General Meeting.",
    preamble: "Based on the audited financial results for the year ended 31st March, {year}, the Company has earned profits and the Board proposes to recommend payment of dividend to the shareholders subject to approval at the Annual General Meeting.",
    resolution: "RESOLVED THAT pursuant to Section 123 of the Companies Act, 2013 read with the Companies (Declaration and Payment of Dividend) Rules, 2014 and subject to approval of the members at the Annual General Meeting, the Directors of the Company do and hereby recommend a dividend at the rate of Rs. {dividendPerShare}/- per share out of the current profits of the year on {totalShares} Equity shares to those shareholders whose names stand in the register of members as on {recordDate}.\n\nRESOLVED FURTHER THAT Directors and the Company Secretary be and are hereby authorized severally to deposit the dividend amount within 5 days from the date of declaration to a separate bank account and to comply with all legal requirements.",
    fields: [
      { key: "year", label: "Financial Year (e.g. 2026)", placeholder: "2026", required: true },
      { key: "dividendPerShare", label: "Dividend Per Share (Rs.)", required: true },
      { key: "totalShares", label: "Total Equity Shares", required: true },
      { key: "recordDate", label: "Record Date", type: "date", required: true },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     CATEGORY: MOA / AOA CHANGES
  ───────────────────────────────────────────────────────────── */
  {
    id: "moa_change_name",
    title: "Change Company Name (Sec. 13)",
    icon: "📛",
    category: "moa_aoa",
    meetingType: "board",
    kind: "special",
    section: "Sec. 13 — Companies Act, 2013",
    rocFiling: "INC-24 with RD approval",
    agendaTitle: "To propose change of name of the Company",
    proposal: "The Board to consider and pass a resolution for change of name of the Company from the existing name and seek availability of the proposed new name.",
    discussion: "The Board considered the proposal to change the name of the Company and approved the following resolution for seeking name availability and for calling EGM to pass a Special Resolution.",
    preamble: "The Company proposes to change its name. Pursuant to Section 13 of the Companies Act, 2013, change of name requires amendment to the Memorandum of Association by way of a Special Resolution and approval of the Central Government/ROC.",
    resolution: "RESOLVED THAT subject to the approval of the members by a special resolution at an Extraordinary General Meeting and approval of the Central Government/Registrar of Companies under Section 13 of the Companies Act, 2013, the name of the Company be changed from '{currentName}' to '{proposedName}' or such other name as may be allowed by the Registrar of Companies.\n\nRESOLVED FURTHER THAT the Company Secretary be and is hereby authorized to make the application in Form INC-1/RUN to the Registrar of Companies for ascertaining the availability of the proposed name.\n\nRESOLVED FURTHER THAT an Extraordinary General Meeting be called for passing the Special Resolution and the Directors be and are hereby authorized to take all steps necessary in this regard.",
    fields: [
      { key: "currentName", label: "Current Company Name", required: true },
      { key: "proposedName", label: "Proposed New Name", required: true },
    ],
    notes: "Requires EGM special resolution + RD/ROC approval. File INC-24.",
  },

  {
    id: "moa_amend_aoa",
    title: "Amend Articles of Association",
    icon: "📃",
    category: "moa_aoa",
    meetingType: "board",
    kind: "special",
    section: "Sec. 14 — Companies Act, 2013",
    rocFiling: "MGT-14 within 30 days",
    agendaTitle: "To propose amendment to Articles of Association",
    proposal: "The Board to consider and recommend to the members at the General Meeting the proposed amendment to the Articles of Association of the Company.",
    discussion: "The Board considered the proposed amendment to the Articles of Association of the Company and approved the following resolution for placing the same before the members for approval.",
    preamble: "The Company proposes to amend its Articles of Association. Pursuant to Section 14 of the Companies Act, 2013, amendment of AOA requires a Special Resolution of the members.",
    resolution: "RESOLVED THAT pursuant to Section 14 and other applicable provisions, if any, of the Companies Act, 2013 and subject to the approval of members by way of a Special Resolution at the General Meeting, the Articles of Association of the Company be amended as follows:\n{proposedAmendment}\n\nRESOLVED FURTHER THAT a General Meeting of the members be called for the said purpose and the Directors and Company Secretary be and are hereby authorized to take all necessary steps.",
    fields: [
      { key: "proposedAmendment", label: "Proposed Amendment (describe the change)", type: "textarea", required: true },
    ],
    notes: "Requires Special Resolution. File MGT-14 within 30 days of passing SR.",
  },

  {
    id: "moa_shift_reg_office",
    title: "Shift Registered Office (within State)",
    icon: "🏢",
    category: "moa_aoa",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 12 — Companies Act, 2013",
    rocFiling: "INC-22 within 30 days",
    agendaTitle: "To shift Registered Office to another location",
    proposal: "The Board to consider and approve shifting of Registered Office from {currentAddress} to {newAddress}.",
    discussion: "The Board considered the proposal to shift the Registered Office from {currentAddress} to {newAddress} and approved the following resolution.",
    preamble: "The Company proposes to shift its Registered Office. Pursuant to Section 12 of the Companies Act, 2013, the Company is required to intimate the Registrar of Companies about the change within 30 days.",
    resolution: "RESOLVED THAT pursuant to Section 12 of the Companies Act, 2013, the Registered Office of the Company be and is hereby shifted from {currentAddress} to {newAddress} with effect from {effectiveDate}.\n\nRESOLVED FURTHER THAT the Directors and Company Secretary be and are hereby authorized severally to file Form INC-22 with the Registrar of Companies within 30 days and to do all necessary acts to effect the change in all records, certificates, letterheads and other documents.",
    fields: [
      { key: "currentAddress", label: "Current Registered Office Address", type: "textarea", required: true },
      { key: "newAddress", label: "New Registered Office Address", type: "textarea", required: true },
      { key: "effectiveDate", label: "Effective Date", type: "date", required: true },
    ],
    notes: "File INC-22 within 30 days of shifting.",
  },

  /* ─────────────────────────────────────────────────────────────
     CATEGORY: BORROWINGS & INVESTMENTS
  ───────────────────────────────────────────────────────────── */
  {
    id: "bor_borrow_bank",
    title: "Borrow from Banks / Financial Institutions",
    icon: "🏛️",
    category: "borrowings",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 179(3)(d) — Companies Act, 2013",
    agendaTitle: "To authorize borrowing from Banks and Financial Institutions",
    proposal: "The Board to consider and authorize borrowing of funds from banks and financial institutions up to a limit of Rs. {borrowingLimit}.",
    discussion: "The Board considered and approved borrowing of funds from {lenderName} up to Rs. {borrowingAmount} at an interest rate of {interestRate} p.a. on such terms and conditions as detailed in the sanction letter.",
    preamble: "The Company requires funds for its business operations / expansion. The Board is required to approve borrowing under Section 179(3)(d) of the Companies Act, 2013.",
    resolution: "RESOLVED THAT pursuant to Section 179(3)(d) and other applicable provisions, if any, of the Companies Act, 2013 read with the Companies (Meetings of Board and its Powers) Rules, 2014, the Board of Directors do and hereby approve borrowing of funds from {lenderName} of an amount not exceeding Rs. {borrowingAmount}/- at an interest rate of {interestRate}% p.a. on the terms and conditions as detailed in the sanction letter dated {sanctionDate}.\n\nRESOLVED FURTHER THAT {authorizedPerson}, Director of the Company be and is hereby authorized to execute all documents, agreements and take all necessary steps for availing the said loan.",
    fields: [
      { key: "lenderName", label: "Bank / FI Name", required: true },
      { key: "borrowingAmount", label: "Borrowing Amount (Rs.)", required: true },
      { key: "interestRate", label: "Interest Rate (% p.a.)", required: true },
      { key: "sanctionDate", label: "Sanction Letter Date", type: "date", required: true },
      { key: "authorizedPerson", label: "Authorized Director", required: true },
    ],
  },

  {
    id: "bor_investments",
    title: "Make Investments (Sec. 186)",
    icon: "💰",
    category: "borrowings",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 186 — Companies Act, 2013",
    rocFiling: "MBP-2 — Register of Investments",
    agendaTitle: "To make Investments / Grant Loans / Provide Guarantees",
    proposal: "The Board to consider and approve making an investment of Rs. {investmentAmount} in {investeeCompany} pursuant to Section 186 of the Companies Act, 2013.",
    discussion: "The Board considered and approved the investment of Rs. {investmentAmount} in {investeeCompany} pursuant to Section 186 of the Companies Act, 2013.",
    preamble: "Pursuant to Section 186 of the Companies Act, 2013, the Board is required to approve investments, loans and guarantees. The Company proposes to make an investment in another company.",
    resolution: "RESOLVED THAT pursuant to Section 186 and other applicable provisions, if any, of the Companies Act, 2013, approval of the Board be and is hereby accorded for making an investment of Rs. {investmentAmount}/- in {investeeCompany} by way of {investmentType}.\n\nRESOLVED FURTHER THAT {authorizedPerson}, Director of the Company be and is hereby authorized to execute all documents and take all necessary steps to give effect to this resolution and to maintain necessary registers as required under the Act.",
    fields: [
      { key: "investeeCompany", label: "Investee Company / Entity Name", required: true },
      { key: "investmentAmount", label: "Investment Amount (Rs.)", required: true },
      { key: "investmentType", label: "Mode of Investment", type: "select", options: ["Equity Shares", "Preference Shares", "Debentures", "Mutual Funds", "Fixed Deposits", "Intercorporate Deposits"], required: true },
      { key: "authorizedPerson", label: "Authorized Director", required: true },
    ],
    notes: "Maintain register MBP-2. Loans/guarantees above 60% of paid-up capital + free reserves require members' approval.",
  },

  /* ─────────────────────────────────────────────────────────────
     CATEGORY: DIVIDENDS & BUYBACK
  ───────────────────────────────────────────────────────────── */
  {
    id: "div_declare_interim",
    title: "Declare Interim Dividend",
    icon: "💵",
    category: "dividends",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 123(3) — Companies Act, 2013",
    agendaTitle: "To declare an Interim Dividend",
    proposal: "The Board to consider declaration of an interim dividend of Rs. {dividendPerShare} per equity share for the financial year {financialYear}.",
    discussion: "The Board considered the financial position of the Company and declared an interim dividend of Rs. {dividendPerShare} per equity share for the financial year {financialYear}.",
    preamble: "Based on the financial performance of the Company for the period ended {periodEnded}, the Board of Directors proposes to declare an interim dividend pursuant to Section 123(3) of the Companies Act, 2013.",
    resolution: "RESOLVED THAT pursuant to Section 123(3) of the Companies Act, 2013, an Interim Dividend at the rate of Rs. {dividendPerShare}/- per Equity Share of Rs. {faceValue}/- each be and is hereby declared for the financial year {financialYear} to all shareholders whose names appear in the Register of Members as on {recordDate}.\n\nRESOLVED FURTHER THAT the Directors and Company Secretary be and are hereby authorized severally to open a separate Dividend account, transfer the required funds and make payment of dividend within 30 days of declaration.",
    fields: [
      { key: "dividendPerShare", label: "Dividend Per Share (Rs.)", required: true },
      { key: "faceValue", label: "Face Value (Rs.)", placeholder: "10", required: true },
      { key: "financialYear", label: "Financial Year", placeholder: "2025-26", required: true },
      { key: "periodEnded", label: "Period Ended", placeholder: "30 September 2025", required: true },
      { key: "recordDate", label: "Record Date", type: "date", required: true },
    ],
  },

  {
    id: "div_preference",
    title: "Declare Dividend on Preference Shares",
    icon: "📈",
    category: "dividends",
    meetingType: "board",
    kind: "ordinary",
    section: "Sec. 123 — Companies Act, 2013",
    agendaTitle: "To propose payment of Dividend on Preference Shares",
    proposal: "The Board to consider and declare dividend at {dividendRate}% on Preference Shares for the year ended {yearEnd}.",
    discussion: "The Board considered and declared a dividend at the rate of {dividendRate}% per Preference share for the year ended {yearEnd}.",
    preamble: "As per the terms of issue of Preference Shares, the Company is required to pay dividend at the prescribed rate to the Preference Shareholders.",
    resolution: "RESOLVED THAT a dividend at the rate of {dividendRate} per cent per Preference Share to the Preference Shareholders of the Company be and is hereby declared for the year ended on {yearEnd} subject to deduction of income tax as applicable.\n\nRESOLVED FURTHER THAT dividend warrants be posted to all the Preference Shareholders whose names appear on the Register of Members as on {recordDate}.\n\nRESOLVED FURTHER THAT Directors and the Company Secretary be and are hereby authorized severally to do all such acts, deeds and things which are necessary to give effect to this resolution.",
    fields: [
      { key: "dividendRate", label: "Dividend Rate (%)", required: true },
      { key: "yearEnd", label: "Year Ended", placeholder: "31st March 2026", required: true },
      { key: "recordDate", label: "Record Date", type: "date", required: true },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     CATEGORY: AGM MANDATORY ITEMS
  ───────────────────────────────────────────────────────────── */
  {
    id: "agm_adopt_financials",
    title: "Adopt Financial Statements & Reports",
    icon: "📊",
    category: "agm_mandatory",
    meetingType: "agm",
    kind: "ordinary",
    section: "Sec. 129(3), 134 — Companies Act, 2013",
    agendaTitle: "To consider and adopt Financial Statements, Board's Report and Auditors' Report",
    proposal: "The members to consider and adopt the Financial Statements of the Company for the year ended 31st March, {year} together with the Board's Report and Auditors' Report thereon.",
    discussion: "The members considered and adopted the Financial Statements of the Company for the year ended 31st March, {year} together with the Board's Report and Auditors' Report.",
    preamble: "The Financial Statements of the Company for the financial year ended 31st March, {year} have been audited and the Board's Report has been prepared. The members are required to adopt the same at the Annual General Meeting.",
    resolution: "RESOLVED THAT the Audited Financial Statements of the Company comprising the Balance Sheet as at 31st March, {year} and the Statement of Profit and Loss and Cash Flow Statement for the year ended on that date together with the Board's Report and the Auditors' Report thereon be and are hereby received, considered and adopted.",
    fields: [
      { key: "year", label: "Financial Year End (e.g. 2026)", placeholder: "2026", required: true },
    ],
  },

  {
    id: "agm_appoint_auditor",
    title: "Appoint Statutory Auditor at AGM",
    icon: "🔍",
    category: "agm_mandatory",
    meetingType: "agm",
    kind: "ordinary",
    section: "Sec. 139 — Companies Act, 2013",
    rocFiling: "ADT-1 within 15 days",
    agendaTitle: "Appointment / Ratification of Statutory Auditors",
    proposal: "The members to consider and approve the appointment / ratification of appointment of {auditorName} as Statutory Auditors of the Company.",
    discussion: "The members considered and approved the appointment of {auditorName}, Chartered Accountants as Statutory Auditors of the Company for a period of {term} years.",
    preamble: "Pursuant to Section 139 of the Companies Act, 2013, the appointment of Statutory Auditors is required to be approved by the members at the Annual General Meeting.",
    resolution: "RESOLVED THAT pursuant to Section 139 and other applicable provisions, if any, of the Companies Act, 2013 read with the Rules made thereunder, {auditorName}, Chartered Accountants (Firm Registration No. {firmRegNo}) be and are hereby appointed as the Statutory Auditors of the Company to hold office for a term of {term} consecutive year(s) from the conclusion of this Annual General Meeting till the conclusion of the {termEnd}th Annual General Meeting, at such remuneration as may be fixed by the Board of Directors.",
    fields: [
      { key: "auditorName", label: "Audit Firm Name", required: true },
      { key: "firmRegNo", label: "Firm Registration No.", required: true },
      { key: "term", label: "Term (years)", placeholder: "5", required: true },
      { key: "termEnd", label: "AGM Number at end of term", placeholder: "5th", required: true },
    ],
  },

  {
    id: "agm_appoint_director_rotation",
    title: "Appoint Director Retiring by Rotation",
    icon: "🔁",
    category: "agm_mandatory",
    meetingType: "agm",
    kind: "ordinary",
    section: "Sec. 152 — Companies Act, 2013",
    agendaTitle: "Appointment of Director retiring by rotation",
    proposal: "To consider and, if thought fit, to pass a resolution for appointment of {directorName} as a Director who retires by rotation and being eligible, offers himself for re-appointment.",
    discussion: "The members considered and approved the re-appointment of {directorName} as a Director of the Company who retires by rotation.",
    preamble: "Pursuant to Section 152(6) of the Companies Act, 2013, at every Annual General Meeting, one-third of the rotational directors are required to retire by rotation. {directorName} is retiring by rotation at this AGM and is eligible for re-appointment.",
    resolution: "RESOLVED THAT {directorName} (DIN: {din}), who retires by rotation at this Annual General Meeting and being eligible has offered himself/herself for re-appointment, be and is hereby re-appointed as a Director of the Company, liable to retire by rotation.",
    fields: [
      { key: "directorName", label: "Director Name", required: true },
      { key: "din", label: "DIN", required: true },
    ],
  },

  {
    id: "agm_declare_dividend",
    title: "Declare Dividend at AGM",
    icon: "💰",
    category: "agm_mandatory",
    meetingType: "agm",
    kind: "ordinary",
    section: "Sec. 123 — Companies Act, 2013",
    agendaTitle: "To declare dividend on Equity shares",
    proposal: "The members to consider and declare dividend of Rs. {dividendPerShare} per equity share as recommended by the Board for the financial year {financialYear}.",
    discussion: "The members approved and declared a dividend of Rs. {dividendPerShare} per equity share for the financial year {financialYear} as recommended by the Board.",
    preamble: "The Board of Directors has recommended a dividend on equity shares for the financial year ended 31st March, {year}. The members are required to declare the same at the Annual General Meeting.",
    resolution: "RESOLVED THAT dividend at the rate of Rs. {dividendPerShare}/- per Equity Share of Rs. {faceValue}/- each on {totalShares} Equity Shares of the Company be and is hereby declared for the financial year {financialYear} as recommended by the Board of Directors, payable to those members whose names appear in the Register of Members as on {recordDate}.",
    fields: [
      { key: "dividendPerShare", label: "Dividend Per Share (Rs.)", required: true },
      { key: "faceValue", label: "Face Value (Rs.)", placeholder: "10", required: true },
      { key: "totalShares", label: "Total Equity Shares", required: true },
      { key: "financialYear", label: "Financial Year", placeholder: "2025-26", required: true },
      { key: "year", label: "Year Ended", placeholder: "2026", required: true },
      { key: "recordDate", label: "Record Date", type: "date", required: true },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     CATEGORY: AGM — SHARE CAPITAL
  ───────────────────────────────────────────────────────────── */
  {
    id: "agm_increase_authorized",
    title: "Increase Authorized Share Capital",
    icon: "📈",
    category: "agm_shares",
    meetingType: "agm",
    kind: "ordinary",
    section: "Sec. 61 — Companies Act, 2013",
    rocFiling: "SH-7 within 30 days",
    agendaTitle: "To increase the Authorized Share Capital",
    proposal: "The members to consider and approve the increase in Authorized Share Capital of the Company from Rs. {currentCapital} to Rs. {newCapital} and consequent amendment to Memorandum of Association.",
    discussion: "The members approved the increase in Authorized Share Capital of the Company from Rs. {currentCapital} to Rs. {newCapital} and amendment to the Capital Clause of the Memorandum of Association.",
    preamble: "For meeting the future funding requirements, the Company proposes to increase its Authorized Share Capital. This requires amendment to the Memorandum of Association under Section 61 of the Companies Act, 2013.",
    resolution: "RESOLVED THAT pursuant to Section 61(1)(a) and other applicable provisions, if any, of the Companies Act, 2013, the Authorized Share Capital of the Company be increased from Rs. {currentCapital}/- (Rupees {currentCapitalWords} only) divided into {currentShares} equity shares of Rs. {faceValue}/- each to Rs. {newCapital}/- (Rupees {newCapitalWords} only) divided into {newShares} equity shares of Rs. {faceValue}/- each by creation of {additionalShares} new equity shares of Rs. {faceValue}/- each.\n\nRESOLVED FURTHER THAT the Memorandum of Association of the Company be altered by substituting the existing Clause V (Capital Clause) with the new capital as above.\n\nRESOLVED FURTHER THAT the Directors be and are hereby authorized severally to file Form SH-7 with ROC within 30 days and do all necessary acts.",
    fields: [
      { key: "currentCapital", label: "Current Authorized Capital (Rs.)", required: true },
      { key: "currentCapitalWords", label: "Current Capital in Words", required: true },
      { key: "currentShares", label: "Current Number of Shares", required: true },
      { key: "newCapital", label: "New Authorized Capital (Rs.)", required: true },
      { key: "newCapitalWords", label: "New Capital in Words", required: true },
      { key: "newShares", label: "New Total Number of Shares", required: true },
      { key: "additionalShares", label: "Additional Shares to be Created", required: true },
      { key: "faceValue", label: "Face Value (Rs.)", placeholder: "10", required: true },
    ],
    notes: "File SH-7 within 30 days. Also file MGT-14 for Special Resolution if required.",
  },

  {
    id: "agm_issue_bonus",
    title: "Issue Bonus Shares",
    icon: "🎁",
    category: "agm_shares",
    meetingType: "agm",
    kind: "ordinary",
    section: "Sec. 63 — Companies Act, 2013",
    rocFiling: "PAS-3 within 30 days",
    agendaTitle: "To approve Issue of Bonus Shares",
    proposal: "The members to consider and approve issue of bonus shares in the ratio of {bonusRatio} to the existing equity shareholders from the free reserves of the Company.",
    discussion: "The members approved the issue of bonus shares in the ratio of {bonusRatio} to the existing equity shareholders from the free reserves of the Company.",
    preamble: "The Board of Directors has recommended capitalization of free reserves by issue of Bonus Shares pursuant to Section 63 of the Companies Act, 2013, subject to approval of members.",
    resolution: "RESOLVED THAT pursuant to Section 63 and other applicable provisions, if any, of the Companies Act, 2013 read with the Rules made thereunder and in accordance with the Articles of Association of the Company, {bonusShares} Equity Shares of Rs. {faceValue}/- each be and are hereby allotted as Bonus Shares to the existing equity shareholders of the Company in the ratio of {bonusRatio} by capitalizing Rs. {capitalizationAmount}/- from the Free Reserves of the Company, to those shareholders whose names appear in the Register of Members as on {recordDate}.\n\nRESOLVED FURTHER THAT the Directors and Company Secretary be and are hereby authorized to do all acts necessary to give effect to this resolution.",
    fields: [
      { key: "bonusShares", label: "Total Bonus Shares", required: true },
      { key: "faceValue", label: "Face Value (Rs.)", placeholder: "10", required: true },
      { key: "bonusRatio", label: "Bonus Ratio (e.g. 1:1 = 1 for every 1 held)", required: true },
      { key: "capitalizationAmount", label: "Amount to be Capitalized (Rs.)", required: true },
      { key: "recordDate", label: "Record Date", type: "date", required: true },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     CATEGORY: EGM / SPECIAL RESOLUTIONS
  ───────────────────────────────────────────────────────────── */
  {
    id: "egm_borrow_beyond_limits",
    title: "Borrow in Excess of Paid-Up Capital & Reserves (Sec. 180(1)(c))",
    icon: "🔔",
    category: "egm_special",
    meetingType: "egm",
    kind: "special",
    section: "Sec. 180(1)(c) — Companies Act, 2013",
    rocFiling: "MGT-14 within 30 days",
    agendaTitle: "To authorize borrowing in excess of Share Capital & Reserves",
    proposal: "The members to pass a Special Resolution authorizing the Board to borrow money not exceeding Rs. {borrowingLimit} in excess of the paid-up share capital and free reserves.",
    discussion: "The members approved by way of a Special Resolution, authorization to the Board to borrow money up to Rs. {borrowingLimit} in excess of the paid-up capital and free reserves of the Company.",
    preamble: "Pursuant to Section 180(1)(c) of the Companies Act, 2013, the Board of Directors cannot borrow money exceeding the aggregate of paid-up capital and free reserves without the consent of the members. The Company requires funds and the borrowing may exceed the prescribed limit.",
    resolution: "RESOLVED AS A SPECIAL RESOLUTION THAT pursuant to Section 180(1)(c) and other applicable provisions, if any, of the Companies Act, 2013, consent be and is hereby accorded to the Board of Directors to borrow from time to time any sum or sums of money as they may consider requisite for the business of the Company, notwithstanding that the money so borrowed, together with money already borrowed by the Company (apart from temporary loans obtained from the Company's bankers in the ordinary course of business) will or may exceed the aggregate of the paid-up capital of the Company and its free reserves provided that the total amount of money so borrowed by the Board shall not at any time exceed the sum of Rs. {borrowingLimit}/-(Rupees {borrowingLimitWords} only).\n\nRESOLVED FURTHER THAT the Directors be and are hereby authorized to do all acts necessary to give effect to this resolution.",
    fields: [
      { key: "borrowingLimit", label: "Borrowing Limit (Rs.)", required: true },
      { key: "borrowingLimitWords", label: "Borrowing Limit in Words", required: true },
    ],
    notes: "File MGT-14 within 30 days of passing Special Resolution.",
  },

  {
    id: "egm_create_charge",
    title: "Create Charge / Mortgage on Company Assets (Sec. 180(1)(a))",
    icon: "🏗️",
    category: "egm_special",
    meetingType: "egm",
    kind: "special",
    section: "Sec. 180(1)(a) — Companies Act, 2013",
    rocFiling: "MGT-14 within 30 days; CHG-1 within 30 days",
    agendaTitle: "To authorize creation of charge / mortgage on assets",
    proposal: "The members to pass a Special Resolution authorizing the Board to create charge, mortgage or hypothecation on assets of the Company to secure borrowings.",
    discussion: "The members approved by way of Special Resolution, creation of charge on the assets of the Company for securing borrowings up to Rs. {chargeAmount}.",
    preamble: "Pursuant to Section 180(1)(a) of the Companies Act, 2013, creation of charge or mortgage on Company assets requires approval of members by Special Resolution.",
    resolution: "RESOLVED AS A SPECIAL RESOLUTION THAT pursuant to Section 180(1)(a) and other applicable provisions, if any, of the Companies Act, 2013 and in terms of Articles of Association of the Company, consent be and is hereby accorded to the Board of Directors to mortgage, charge, hypothecate and/or encumber all or any of the moveable and/or immoveable properties of the Company to secure any loan, overdraft facility, financial assistance or guarantee up to an aggregate amount not exceeding Rs. {chargeAmount}/- (Rupees {chargeAmountWords} only).\n\nRESOLVED FURTHER THAT the Directors be and are hereby authorized to execute all documents necessary to create the charge and file Form CHG-1 with the Registrar within 30 days.",
    fields: [
      { key: "chargeAmount", label: "Maximum Charge Amount (Rs.)", required: true },
      { key: "chargeAmountWords", label: "Amount in Words", required: true },
    ],
    notes: "File MGT-14 (SR) within 30 days and CHG-1 (charge creation) within 30 days.",
  },

  {
    id: "egm_appoint_independent_director",
    title: "Appoint Independent Director (Sec. 149)",
    icon: "👁️",
    category: "egm_special",
    meetingType: "egm",
    kind: "ordinary",
    section: "Sec. 149 — Companies Act, 2013",
    rocFiling: "DIR-12 within 30 days",
    agendaTitle: "Appointment of Independent Director",
    proposal: "The members to consider and approve appointment of {directorName} as an Independent Director of the Company for a term of {term} consecutive years.",
    discussion: "The members approved the appointment of {directorName} as an Independent Director of the Company for a first term of {term} consecutive years not liable to retire by rotation.",
    preamble: "Pursuant to Section 149 of the Companies Act, 2013, the Company is required to appoint Independent Directors. The candidate has given declaration of independence as required under Section 149(7).",
    resolution: "RESOLVED THAT pursuant to Sections 149, 150, 152 and other applicable provisions, if any, of the Companies Act, 2013 read with Schedule IV and the Companies (Appointment and Qualification of Directors) Rules, 2014, {directorName} (DIN: {din}), who has submitted a declaration that he/she meets the criteria for independence as provided in Section 149(6) of the Companies Act, 2013, be and is hereby appointed as an Independent Director of the Company, not liable to retire by rotation, for a first term of {term} consecutive year(s) with effect from {effectiveDate}.",
    fields: [
      { key: "directorName", label: "Director Name", required: true },
      { key: "din", label: "DIN", required: true },
      { key: "term", label: "Term (years, max 5)", placeholder: "5", required: true },
      { key: "effectiveDate", label: "Effective Date", type: "date", required: true },
    ],
    notes: "Independent Director must submit declaration of independence. File DIR-12 within 30 days.",
  },

  {
    id: "egm_remove_director",
    title: "Remove Director (Sec. 169)",
    icon: "🚫",
    category: "egm_special",
    meetingType: "egm",
    kind: "ordinary",
    section: "Sec. 169 — Companies Act, 2013",
    rocFiling: "DIR-12 within 30 days",
    agendaTitle: "To remove a Director",
    proposal: "The members to consider and pass a resolution for removal of {directorName} from the office of Director of the Company before the expiry of tenure.",
    discussion: "After due notice and opportunity to the Director to represent, the members approved the resolution for removal of {directorName} from the office of Director of the Company.",
    preamble: "Pursuant to Section 169 of the Companies Act, 2013, the members may, by ordinary resolution, remove a Director before the expiry of his/her tenure. Special notice has been given as required under Section 169(2).",
    resolution: "RESOLVED THAT pursuant to Section 169 and other applicable provisions, if any, of the Companies Act, 2013 and in terms of the Articles of Association of the Company, {directorName} (DIN: {din}) be and is hereby removed from the office of Director of the Company with effect from {effectiveDate}.\n\nRESOLVED FURTHER THAT the Directors be and are hereby authorized severally to file Form DIR-12 with the Registrar of Companies within 30 days and to do all such acts and things as may be necessary.",
    fields: [
      { key: "directorName", label: "Director Name", required: true },
      { key: "din", label: "DIN", required: true },
      { key: "effectiveDate", label: "Effective Date", type: "date", required: true },
    ],
    notes: "Special Notice required under Sec. 169(2). Director must be given opportunity to be heard.",
  },

];

/* ── Helper: fill template with field values ─────────────────── */
export function fillResolutionTemplate(text: string, fields: Record<string, string>): string {
  let result = text;
  Object.entries(fields).forEach(([k, v]) => {
    result = result.replace(new RegExp(`\\{${k}\\}`, "g"), v || `[${k}]`);
  });
  return result;
}

/* ── Lookup helpers ──────────────────────────────────────────── */
export function getResolutionById(id: string): UnifiedResolution | undefined {
  return RESOLUTION_LIBRARY.find(r => r.id === id);
}

export function getResolutionsByCategory(category: string): UnifiedResolution[] {
  return RESOLUTION_LIBRARY.filter(r => r.category === category);
}

export function getResolutionsByMeetingType(type: "board" | "agm" | "egm"): UnifiedResolution[] {
  return RESOLUTION_LIBRARY.filter(r => r.meetingType === type || r.meetingType === "board_agm");
}
