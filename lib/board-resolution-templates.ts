/* ══════════════════════════════════════════════════════════════════
   BOARD RESOLUTION TEMPLATES — Standalone Builder
   Companies Act, 2013 — Private Limited Companies
══════════════════════════════════════════════════════════════════ */

export type ResolutionKind = "ordinary" | "special";

export interface BRField {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "date" | "number" | "textarea" | "select";
  options?: string[];   // for select type
  required?: boolean;
}

export interface BRTemplate {
  id: string;
  title: string;
  icon: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  kind: ResolutionKind;
  section: string;       // e.g. "Sec. 56 — Companies Act, 2013"
  rocFiling?: string;    // e.g. "DIR-12 within 30 days" or undefined if not required
  fields: BRField[];
  preamble: string;      // discussion / whereas text
  resolution: string;    // resolution text (with {placeholders})
  furtherResolution?: string;  // RESOLVED FURTHER THAT...
  notes?: string;        // legal note shown in UI
}

// ── Helper ────────────────────────────────────────────────────────
const AUTH = `\n\nRESOLVED FURTHER THAT any Director or the Company Secretary of the Company be and is hereby severally authorised to do all such acts, deeds, matters and things as may be necessary, proper or expedient to give effect to this Resolution.`;

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 1 — DIRECTORS & KMP
══════════════════════════════════════════════════════════════════ */
const DIRECTORS: BRTemplate[] = [
  {
    id: "appoint_additional_director",
    title: "Appointment of Additional Director",
    icon: "👤", category: "directors", categoryLabel: "Directors & KMP", categoryIcon: "👥",
    kind: "ordinary",
    section: "Sec. 161(1) — Companies Act, 2013",
    rocFiling: "DIR-12 within 30 days",
    fields: [
      { key: "dirName",    label: "Director's Full Name",  placeholder: "e.g. Ramesh Kumar Sharma", required: true },
      { key: "dirDin",     label: "DIN",                   placeholder: "e.g. 01234567", required: true },
      { key: "dirDesig",   label: "Designation",           placeholder: "e.g. Additional Director",
        type: "select", options: ["Additional Director","Non-Executive Director","Independent Director","Nominee Director"] },
      { key: "effectDate", label: "Effective Date",        placeholder: "", type: "date", required: true },
    ],
    preamble: `The Chairman informed the Board that it was proposed to appoint {dirName} (DIN: {dirDin}) as an Additional Director of the Company with effect from {effectDate}, pursuant to Section 161(1) of the Companies Act, 2013 and the Articles of Association of the Company. The Board noted that {dirName} holds a valid Director Identification Number (DIN: {dirDin}) and is not disqualified from being appointed as a Director. {dirName} has given his/her consent in writing to act as Director in Form DIR-2.`,
    resolution: `RESOLVED THAT pursuant to Section 161(1) of the Companies Act, 2013 and the Articles of Association of the Company, {dirName} (DIN: {dirDin}) be and is hereby appointed as an {dirDesig} of the Company with effect from {effectDate}, to hold office up to the date of the next Annual General Meeting of the Company.${AUTH}`,
    notes: "File DIR-12 with ROC within 30 days of appointment.",
  },
  {
    id: "director_resignation",
    title: "Acceptance of Director's Resignation",
    icon: "🚪", category: "directors", categoryLabel: "Directors & KMP", categoryIcon: "👥",
    kind: "ordinary",
    section: "Sec. 168 — Companies Act, 2013",
    rocFiling: "DIR-12 within 30 days",
    fields: [
      { key: "dirName",    label: "Director's Full Name",  placeholder: "e.g. Ramesh Kumar Sharma", required: true },
      { key: "dirDin",     label: "DIN",                   placeholder: "e.g. 01234567", required: true },
      { key: "resignDate", label: "Date of Resignation",   placeholder: "", type: "date", required: true },
    ],
    preamble: `The Chairman informed the Board that {dirName} (DIN: {dirDin}) had submitted his/her resignation from the post of Director of the Company with effect from {resignDate}. The resignation letter dated {resignDate} was placed before the Board. The Board, after deliberation, decided to accept the same.`,
    resolution: `RESOLVED THAT the resignation of {dirName} (DIN: {dirDin}) from the post of Director of the Company with effect from {resignDate} be and is hereby accepted.\n\nRESOLVED FURTHER THAT the Board places on record its sincere appreciation for the valuable services rendered by {dirName} during his/her tenure as Director.${AUTH}`,
    notes: "File DIR-12 with ROC within 30 days. Director must also file DIR-11.",
  },
  {
    id: "appoint_md",
    title: "Appointment of Managing Director",
    icon: "🏢", category: "directors", categoryLabel: "Directors & KMP", categoryIcon: "👥",
    kind: "ordinary",
    section: "Sec. 196 / Sec. 203 — Companies Act, 2013",
    rocFiling: "MR-1 within 60 days + DIR-12 within 30 days",
    fields: [
      { key: "dirName",    label: "MD's Full Name",         placeholder: "e.g. Suresh Patel", required: true },
      { key: "dirDin",     label: "DIN",                    placeholder: "e.g. 01234567", required: true },
      { key: "tenure",     label: "Tenure (years)",         placeholder: "e.g. 5", type: "number", required: true },
      { key: "effectDate", label: "Effective Date",         placeholder: "", type: "date", required: true },
      { key: "salary",     label: "Monthly Remuneration (₹)", placeholder: "e.g. 50,000" },
    ],
    preamble: `The Chairman informed the Board that it is proposed to appoint {dirName} (DIN: {dirDin}) as the Managing Director of the Company for a period of {tenure} years with effect from {effectDate}, subject to the approval of shareholders at the next Annual General Meeting and in accordance with Schedule V of the Companies Act, 2013.`,
    resolution: `RESOLVED THAT pursuant to Sections 196, 197, 203 and other applicable provisions of the Companies Act, 2013 read with Schedule V thereto, approval of the Board of Directors be and is hereby accorded to the appointment of {dirName} (DIN: {dirDin}) as the Managing Director of the Company for a period of {tenure} (_{tenure}_) years with effect from {effectDate}, on a monthly remuneration of ₹{salary} and on such other terms and conditions as set out in the draft agreement placed before the Board and initialled by the Chairman for identification.\n\nRESOLVED FURTHER THAT the Board recommends the appointment and remuneration of {dirName} as Managing Director for approval of the shareholders at the ensuing Annual General Meeting.${AUTH}`,
    notes: "File MR-1 within 60 days. If remuneration exceeds Schedule V limits, Special Resolution at GM required.",
  },
  {
    id: "appoint_cs",
    title: "Appointment of Company Secretary (KMP)",
    icon: "📋", category: "directors", categoryLabel: "Directors & KMP", categoryIcon: "👥",
    kind: "ordinary",
    section: "Sec. 203 — Companies Act, 2013",
    rocFiling: "DIR-12 within 30 days",
    fields: [
      { key: "csName",     label: "CS Full Name",     placeholder: "e.g. Priya Mehta", required: true },
      { key: "csMemberNo", label: "ICSI Membership No.", placeholder: "e.g. ACS/FCS 12345", required: true },
      { key: "effectDate", label: "Effective Date",   placeholder: "", type: "date", required: true },
      { key: "salary",     label: "Monthly Salary (₹)", placeholder: "e.g. 40,000" },
    ],
    preamble: `The Chairman informed the Board of the proposal to appoint {csName}, a member of the Institute of Company Secretaries of India (Membership No. {csMemberNo}), as the Company Secretary and Key Managerial Personnel (KMP) of the Company with effect from {effectDate}, pursuant to Section 203 of the Companies Act, 2013.`,
    resolution: `RESOLVED THAT pursuant to Section 203 and other applicable provisions of the Companies Act, 2013, {csName} (ICSI Membership No. {csMemberNo}) be and is hereby appointed as the Company Secretary and Key Managerial Personnel (KMP) of the Company with effect from {effectDate}, on a monthly remuneration of ₹{salary} per month and on such terms and conditions as may be mutually agreed upon.${AUTH}`,
    notes: "File DIR-12 with ROC within 30 days of appointment.",
  },
  {
    id: "dir_interest_disclosure",
    title: "Noting of Director's Disclosure of Interest",
    icon: "📢", category: "directors", categoryLabel: "Directors & KMP", categoryIcon: "👥",
    kind: "ordinary",
    section: "Sec. 184 — Companies Act, 2013",
    rocFiling: undefined,
    fields: [
      { key: "dirName",  label: "Director's Name",   placeholder: "e.g. Amit Kumar", required: true },
      { key: "dirDin",   label: "DIN",               placeholder: "e.g. 01234567" },
      { key: "interest", label: "Nature of Interest", placeholder: "e.g. Director in M/s ABC Pvt Ltd", type: "textarea" },
    ],
    preamble: `The Chairman informed the Board that {dirName} (DIN: {dirDin}) had submitted Form MBP-1 disclosing his/her interest in other entities as required under Section 184 of the Companies Act, 2013. The said disclosure was placed before the Board.`,
    resolution: `RESOLVED THAT the disclosure of interest given by {dirName} (DIN: {dirDin}) in Form MBP-1 pursuant to Section 184(1) of the Companies Act, 2013, disclosing his/her concern or interest in — {interest} — be and is hereby noted and taken on record.`,
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 2 — SHARE CAPITAL & TRANSFERS
══════════════════════════════════════════════════════════════════ */
const SHARES: BRTemplate[] = [
  {
    id: "share_allotment",
    title: "Allotment of Shares",
    icon: "📈", category: "shares", categoryLabel: "Share Capital & Transfers", categoryIcon: "📈",
    kind: "ordinary",
    section: "Sec. 62 / Sec. 179(3)(c) — Companies Act, 2013",
    rocFiling: "PAS-3 within 15 days of allotment",
    fields: [
      { key: "noOfShares",    label: "Number of Shares",       placeholder: "e.g. 10,000", required: true },
      { key: "shareClass",    label: "Class of Shares",        type: "select", options: ["Equity Shares","Preference Shares"], required: true },
      { key: "nominalValue",  label: "Nominal Value (₹)",      placeholder: "e.g. 10", required: true },
      { key: "issuePrice",    label: "Issue Price (₹)",        placeholder: "e.g. 10 (at par) or 50 (at premium)" },
      { key: "allotteeName",  label: "Allottee Name(s)",       placeholder: "e.g. Rajesh Kumar Sharma", required: true, type: "textarea" },
      { key: "allotmentDate", label: "Date of Allotment",      placeholder: "", type: "date", required: true },
    ],
    preamble: `The Chairman informed the Board that the Company proposes to allot {noOfShares} {shareClass} of ₹{nominalValue} each at ₹{issuePrice} per share to {allotteeName} against receipt of application money. The Board considered the applications received and the allotment of shares.`,
    resolution: `RESOLVED THAT {noOfShares} ({noOfShares}) {shareClass} of ₹{nominalValue}/- each be and are hereby allotted at ₹{issuePrice}/- per share (including premium, if any) to {allotteeName} on {allotmentDate}, and that the said shares shall rank pari passu in all respects with the existing equity shares of the Company.\n\nRESOLVED FURTHER THAT share certificates in respect of the above allotment be issued to the allottees within 60 days from the date of allotment.${AUTH}`,
    notes: "File PAS-3 with ROC within 15 days. If issue is beyond rights issue / private placement — MGT-14 required.",
  },
  {
    id: "share_transfer_approval",
    title: "Approval of Share Transfer",
    icon: "🔄", category: "shares", categoryLabel: "Share Capital & Transfers", categoryIcon: "📈",
    kind: "ordinary",
    section: "Sec. 56 — Companies Act, 2013",
    rocFiling: undefined,
    fields: [
      { key: "transferorName", label: "Transferor (Seller) Name",  placeholder: "e.g. Ramesh Kumar", required: true },
      { key: "transfereeName", label: "Transferee (Buyer) Name",   placeholder: "e.g. Suresh Patel", required: true },
      { key: "noOfShares",     label: "Number of Shares",          placeholder: "e.g. 5,000", required: true },
      { key: "certNo",         label: "Certificate No.",           placeholder: "e.g. 01" },
      { key: "folioNo",        label: "Folio No.",                 placeholder: "e.g. 01" },
      { key: "distFrom",       label: "Distinctive No. From",      placeholder: "e.g. 1" },
      { key: "distTo",         label: "Distinctive No. To",        placeholder: "e.g. 5000" },
      { key: "consideration",  label: "Consideration (₹/share)",   placeholder: "e.g. 10" },
      { key: "transferDate",   label: "Date of Transfer Deed (SH-4)", placeholder: "", type: "date", required: true },
    ],
    preamble: `The Chairman placed before the Board the request for transfer of {noOfShares} Equity Shares bearing Certificate No. {certNo}, Folio No. {folioNo}, Distinctive Nos. {distFrom} to {distTo}, from {transferorName} to {transfereeName} along with the duly executed Share Transfer Deed in Form SH-4 dated {transferDate}. The Board verified that the transfer deed and documents are in order.`,
    resolution: `RESOLVED THAT the transfer of {noOfShares} Equity Shares bearing Certificate No. {certNo}, Folio No. {folioNo}, Distinctive Nos. {distFrom} to {distTo}, from {transferorName} to {transfereeName} pursuant to Form SH-4 (Share Transfer Deed) dated {transferDate}, at a consideration of ₹{consideration} per share, be and is hereby approved, and that the name of {transfereeName} be entered in the Register of Members as the holder of the said shares.${AUTH}`,
    notes: "SH-4 must be submitted within 60 days of execution (Sec. 56). Stamp Duty @ 0.25% of consideration.",
  },
  {
    id: "issue_share_certificate",
    title: "Issue of Share Certificate",
    icon: "📜", category: "shares", categoryLabel: "Share Capital & Transfers", categoryIcon: "📈",
    kind: "ordinary",
    section: "Sec. 46 — Companies Act, 2013",
    rocFiling: undefined,
    fields: [
      { key: "memberName",   label: "Member's Name",        placeholder: "e.g. Rajesh Kumar Sharma", required: true },
      { key: "noOfShares",   label: "Number of Shares",     placeholder: "e.g. 10,000", required: true },
      { key: "certNo",       label: "Certificate No.",      placeholder: "e.g. 01", required: true },
      { key: "issueDate",    label: "Date of Issue",        placeholder: "", type: "date", required: true },
    ],
    preamble: `The Chairman placed before the Board the proposal to issue Share Certificate No. {certNo} for {noOfShares} Equity Shares to {memberName}. The Board considered the matter and approved the issuance.`,
    resolution: `RESOLVED THAT Share Certificate No. {certNo} for {noOfShares} Equity Shares of the Company be and is hereby issued to {memberName} on {issueDate} in accordance with the provisions of Section 46 of the Companies Act, 2013 and the rules made thereunder.${AUTH}`,
    notes: "Share certificates must be issued within 60 days of allotment / 30 days of registration of transfer.",
  },
  {
    id: "issue_duplicate_cert",
    title: "Issue of Duplicate Share Certificate",
    icon: "📋", category: "shares", categoryLabel: "Share Capital & Transfers", categoryIcon: "📈",
    kind: "ordinary",
    section: "Sec. 46(2) — Companies Act, 2013",
    rocFiling: undefined,
    fields: [
      { key: "memberName",  label: "Member's Name",       placeholder: "e.g. Rajesh Kumar", required: true },
      { key: "origCertNo",  label: "Original Certificate No.", placeholder: "e.g. 01", required: true },
      { key: "noOfShares",  label: "Number of Shares",    placeholder: "e.g. 5,000", required: true },
      { key: "dupCertNo",   label: "Duplicate Certificate No.", placeholder: "e.g. 05", required: true },
      { key: "reason",      label: "Reason",              placeholder: "e.g. lost / destroyed / mutilated",
        type: "select", options: ["lost","destroyed","mutilated/defaced"], required: true },
    ],
    preamble: `The Chairman placed before the Board an application dated received from {memberName} requesting issue of a Duplicate Share Certificate in lieu of original Certificate No. {certNo} for {noOfShares} shares which has been reported as {reason}. The requisite indemnity bond and affidavit have been submitted by the member.`,
    resolution: `RESOLVED THAT a Duplicate Share Certificate bearing No. {dupCertNo} for {noOfShares} Equity Shares of the Company, in lieu of the original Certificate No. {origCertNo} (reported as {reason}), be and is hereby issued to {memberName} after obtaining the requisite indemnity bond and affidavit, in accordance with Section 46(2) of the Companies Act, 2013 and the Companies (Share Capital and Debentures) Rules, 2014.${AUTH}`,
    notes: "Maintain record in Register of Renewed and Duplicate Share Certificates (Form SH-2).",
  },
  {
    id: "buyback_board",
    title: "Buy-Back of Shares (Board Authorised — up to 10%)",
    icon: "💰", category: "shares", categoryLabel: "Share Capital & Transfers", categoryIcon: "📈",
    kind: "ordinary",
    section: "Sec. 68(2)(a) — Companies Act, 2013",
    rocFiling: "SH-8 / SH-11 filings required",
    fields: [
      { key: "noOfShares",  label: "Max Shares to Buy Back",  placeholder: "e.g. 5,000", required: true },
      { key: "maxPrice",    label: "Maximum Buy-Back Price (₹)", placeholder: "e.g. 100", required: true },
      { key: "totalAmount", label: "Maximum Total Amount (₹)",  placeholder: "e.g. 5,00,000", required: true },
    ],
    preamble: `The Chairman informed the Board that the Company proposes to buy back up to {noOfShares} fully paid-up Equity Shares of the Company at a price not exceeding ₹{maxPrice} per share for an aggregate consideration not exceeding ₹{totalAmount}, from the open market through stock exchange / tender offer route, in accordance with Section 68 of the Companies Act, 2013. The buy-back does not exceed 10% of the total paid-up equity share capital.`,
    resolution: `RESOLVED THAT pursuant to Section 68 and other applicable provisions of the Companies Act, 2013, the Board hereby approves the buy-back of up to {noOfShares} fully paid-up Equity Shares at a price not exceeding ₹{maxPrice} per share for a total consideration not exceeding ₹{totalAmount}, subject to applicable regulations.${AUTH}`,
    notes: "Buy-back exceeding 10% requires Special Resolution at General Meeting.",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 3 — FINANCIAL & BANKING
══════════════════════════════════════════════════════════════════ */
const FINANCIAL: BRTemplate[] = [
  {
    id: "open_bank_account",
    title: "Opening of Bank Account",
    icon: "🏦", category: "financial", categoryLabel: "Financial & Banking", categoryIcon: "💰",
    kind: "ordinary",
    section: "Sec. 179(3) — Companies Act, 2013",
    rocFiling: undefined,
    fields: [
      { key: "bankName",    label: "Bank Name",         placeholder: "e.g. State Bank of India", required: true },
      { key: "branchName",  label: "Branch Name",       placeholder: "e.g. Andheri West, Mumbai", required: true },
      { key: "accountType", label: "Account Type",      type: "select",
        options: ["Current Account","Savings Account","Cash Credit Account","Overdraft Account"] },
      { key: "signatories", label: "Authorised Signatories", placeholder: "e.g. Any two Directors jointly", required: true, type: "textarea" },
    ],
    preamble: `The Chairman placed before the Board a proposal to open a {accountType} in the name of the Company with {bankName}, {branchName}. The Board deliberated on the signatories and the mode of operation of the said bank account.`,
    resolution: `RESOLVED THAT the Company be and is hereby authorised to open a {accountType} with {bankName}, {branchName}.\n\nRESOLVED FURTHER THAT {signatories} be and are hereby authorised to operate the said bank account and to sign cheques, demand drafts, pay orders, RTGS/NEFT instructions and all instruments on behalf of the Company.${AUTH}`,
  },
  {
    id: "change_bank_signatories",
    title: "Change of Bank Authorised Signatories",
    icon: "🔑", category: "financial", categoryLabel: "Financial & Banking", categoryIcon: "💰",
    kind: "ordinary",
    section: "Sec. 179(3) — Companies Act, 2013",
    rocFiling: undefined,
    fields: [
      { key: "bankName",       label: "Bank Name",             placeholder: "e.g. HDFC Bank", required: true },
      { key: "branchName",     label: "Branch Name",           placeholder: "e.g. Bandra Branch", required: true },
      { key: "accountNo",      label: "Account Number",        placeholder: "e.g. XXXX1234" },
      { key: "removeSignatory",label: "Signatory to Remove",   placeholder: "e.g. Ramesh Kumar (Director)", type: "textarea" },
      { key: "addSignatory",   label: "New Signatory to Add",  placeholder: "e.g. Suresh Patel (Director)", type: "textarea" },
    ],
    preamble: `The Chairman informed the Board that changes are required in the authorised signatories for the Company's bank account with {bankName}, {branchName} (Account No. {accountNo}). The Board considered the request for addition/removal of signatories.`,
    resolution: `RESOLVED THAT the following changes in the authorised signatories for the Company's bank account with {bankName}, {branchName} (Account No. {accountNo}) be and are hereby approved:\n\nSignatory to be REMOVED: {removeSignatory}\nSignatory to be ADDED: {addSignatory}\n\nRESOLVED FURTHER THAT the Bank be and is hereby authorised to act upon the instructions of the new authorised signatories with effect from the date of this resolution.${AUTH}`,
  },
  {
    id: "borrow_within_limits",
    title: "Borrowing of Funds (within Board limits)",
    icon: "💳", category: "financial", categoryLabel: "Financial & Banking", categoryIcon: "💰",
    kind: "ordinary",
    section: "Sec. 179(3)(d) — Companies Act, 2013",
    rocFiling: undefined,
    fields: [
      { key: "lenderName",   label: "Lender / Bank Name",     placeholder: "e.g. HDFC Bank / XYZ Pvt Ltd", required: true },
      { key: "loanAmount",   label: "Loan Amount (₹)",        placeholder: "e.g. 50,00,000", required: true },
      { key: "loanType",     label: "Type of Facility",       type: "select",
        options: ["Term Loan","Working Capital Loan","Overdraft","Cash Credit","Unsecured Loan","Inter-Corporate Deposit"], required: true },
      { key: "interestRate", label: "Rate of Interest (% p.a.)", placeholder: "e.g. 12%" },
      { key: "tenure",       label: "Tenure / Repayment",     placeholder: "e.g. 5 years / 60 EMIs" },
      { key: "signatories",  label: "Authorised to Execute Documents", placeholder: "e.g. Managing Director", required: true },
    ],
    preamble: `The Chairman informed the Board about the requirement of funds by the Company for its business operations. The Company proposes to avail a {loanType} of ₹{loanAmount} from {lenderName} at an interest rate of {interestRate} p.a. for a tenure of {tenure}. The Board deliberated and considered the proposal.`,
    resolution: `RESOLVED THAT pursuant to Section 179(3)(d) and other applicable provisions of the Companies Act, 2013, the Board hereby approves the borrowing of ₹{loanAmount} (Rupees ___________) by way of {loanType} from {lenderName} at an interest rate of {interestRate} p.a., repayable over {tenure}, on such terms and conditions as may be agreed upon.\n\nRESOLVED FURTHER THAT {signatories} be and is/are hereby authorised to execute all loan documents, agreements, security documents and do all such acts as may be necessary for availing the said loan facility.${AUTH}`,
    notes: "Private companies exempt from filing Sec. 179(3) board resolutions via MGT-14. If borrowing exceeds paid-up capital + free reserves, Special Resolution at GM required (Sec. 180(1)(c)).",
  },
  {
    id: "approve_rpt",
    title: "Approval of Related Party Transaction (RPT)",
    icon: "🤝", category: "financial", categoryLabel: "Financial & Banking", categoryIcon: "💰",
    kind: "ordinary",
    section: "Sec. 188 — Companies Act, 2013",
    rocFiling: undefined,
    fields: [
      { key: "relatedParty",   label: "Related Party Name",       placeholder: "e.g. M/s ABC Pvt Ltd (Subsidiary)", required: true },
      { key: "relationship",   label: "Nature of Relationship",   placeholder: "e.g. Subsidiary / Associate / Director's relative", required: true },
      { key: "transactionType",label: "Nature of Transaction",    placeholder: "e.g. Sale of goods / Loan / Lease of property", required: true },
      { key: "amount",         label: "Amount / Value (₹)",       placeholder: "e.g. 25,00,000", required: true },
      { key: "terms",          label: "Terms & Conditions",       placeholder: "e.g. At arm's length, market rate", type: "textarea" },
    ],
    preamble: `The Chairman placed before the Board the proposal for entering into a related party transaction with {relatedParty} ({relationship}). The nature of transaction is {transactionType} for an amount of ₹{amount}. The Board noted that the transaction is at arm's length and in the ordinary course of business. The interested director(s) did not participate in the voting.`,
    resolution: `RESOLVED THAT pursuant to Section 188 and other applicable provisions of the Companies Act, 2013, approval of the Board be and is hereby accorded to enter into the following Related Party Transaction:\n\nRelated Party: {relatedParty}\nRelationship: {relationship}\nNature of Transaction: {transactionType}\nAmount: ₹{amount}\nTerms: {terms}\n\nRESOLVED FURTHER THAT the said transaction is at arm's length and in the ordinary course of business.${AUTH}`,
    notes: "Interested directors must not participate in voting. Maintain disclosure in Form AOC-2 for Board's Report.",
  },
  {
    id: "give_loan_guarantee",
    title: "Grant of Loan / Guarantee / Security (Sec. 186)",
    icon: "🔐", category: "financial", categoryLabel: "Financial & Banking", categoryIcon: "💰",
    kind: "ordinary",
    section: "Sec. 186 — Companies Act, 2013",
    rocFiling: undefined,
    fields: [
      { key: "recipientName",  label: "Recipient Name",          placeholder: "e.g. M/s XYZ Ltd (Subsidiary)", required: true },
      { key: "facilityType",   label: "Type",                    type: "select",
        options: ["Loan","Guarantee","Security","Investment in securities"], required: true },
      { key: "amount",         label: "Amount (₹)",              placeholder: "e.g. 20,00,000", required: true },
      { key: "purpose",        label: "Purpose / End Use",       placeholder: "e.g. Working capital requirement", required: true },
      { key: "interestRate",   label: "Rate of Interest (% p.a.)", placeholder: "e.g. 9%" },
    ],
    preamble: `The Chairman informed the Board about the proposal to grant a {facilityType} of ₹{amount} to {recipientName} for the purpose of {purpose}. The Board considered the matter and noted that the proposed {facilityType} is within the prescribed limits under Section 186(2) of the Companies Act, 2013. The resolution was passed unanimously with consent of all directors present.`,
    resolution: `RESOLVED THAT pursuant to Section 186 and other applicable provisions of the Companies Act, 2013, the Board hereby approves the grant of a {facilityType} of ₹{amount} (Rupees ___________) to {recipientName} for the purpose of {purpose}, at an interest rate of {interestRate} p.a., on such terms and conditions as mutually agreed.\n\nRESOLVED FURTHER THAT the proposed {facilityType} is within the limits prescribed under Section 186(2) of the Companies Act, 2013 and that a Register in Form MBP-2 be maintained as required.${AUTH}`,
    notes: "Sec. 186(5): Resolution must be passed with consent of ALL directors present. If beyond 60% of paid-up capital + free reserves or 100% of free reserves — Special Resolution at GM required.",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 4 — PROPERTY & CONTRACTS
══════════════════════════════════════════════════════════════════ */
const PROPERTY: BRTemplate[] = [
  {
    id: "create_charge",
    title: "Creation of Charge / Mortgage on Assets",
    icon: "🏗️", category: "property", categoryLabel: "Property & Contracts", categoryIcon: "🏢",
    kind: "ordinary",
    section: "Sec. 179(3)(f) — Companies Act, 2013",
    rocFiling: "CHG-1 within 30 days of creation",
    fields: [
      { key: "chargeholderName", label: "Charge Holder (Lender)",   placeholder: "e.g. HDFC Bank Ltd", required: true },
      { key: "chargeAmount",     label: "Amount Secured (₹)",       placeholder: "e.g. 1,00,00,000", required: true },
      { key: "propertyDesc",     label: "Property / Asset Description", placeholder: "e.g. Factory land & building at...", type: "textarea", required: true },
      { key: "chargeDate",       label: "Date of Charge Creation",  placeholder: "", type: "date" },
    ],
    preamble: `The Chairman informed the Board that the Company proposes to create a charge / mortgage on its assets described as {propertyDesc} in favour of {chargeholderName} to secure a loan/facility of ₹{chargeAmount}. The Board considered the creation of charge on the said assets.`,
    resolution: `RESOLVED THAT the Board hereby approves the creation of a charge / mortgage on the Company's assets (described as {propertyDesc}) in favour of {chargeholderName} to secure a facility of ₹{chargeAmount} on such terms and conditions as may be agreed upon.\n\nRESOLVED FURTHER THAT Form CHG-1 be filed with the Registrar of Companies within 30 days of creation of charge.${AUTH}`,
    notes: "File CHG-1 with ROC within 30 days. Late filing allowed up to 300 days with additional fees.",
  },
  {
    id: "approve_contract",
    title: "Approval of Major Contract / Agreement",
    icon: "📝", category: "property", categoryLabel: "Property & Contracts", categoryIcon: "🏢",
    kind: "ordinary",
    section: "Sec. 179(1) — Companies Act, 2013",
    rocFiling: undefined,
    fields: [
      { key: "contractParty",  label: "Counterparty Name",    placeholder: "e.g. M/s Tech Solutions Pvt Ltd", required: true },
      { key: "contractType",   label: "Nature of Contract",   placeholder: "e.g. Software Development Agreement / Lease Agreement", required: true },
      { key: "contractValue",  label: "Contract Value (₹)",   placeholder: "e.g. 25,00,000" },
      { key: "contractPeriod", label: "Contract Period",      placeholder: "e.g. 2 years" },
      { key: "signatories",    label: "Authorised to Sign",   placeholder: "e.g. Managing Director", required: true },
    ],
    preamble: `The Chairman placed before the Board the draft {contractType} proposed to be entered into with {contractParty} for a value of ₹{contractValue} for a period of {contractPeriod}. The Board deliberated upon the terms and conditions of the proposed agreement.`,
    resolution: `RESOLVED THAT the Board hereby approves the execution of the {contractType} with {contractParty} for a value of ₹{contractValue} for a period of {contractPeriod} on the terms and conditions as discussed and approved by the Board.\n\nRESOLVED FURTHER THAT {signatories} be and is/are hereby authorised to execute, sign and deliver the said agreement and all related documents on behalf of the Company.${AUTH}`,
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 5 — COMPLIANCE & ROC
══════════════════════════════════════════════════════════════════ */
const COMPLIANCE: BRTemplate[] = [
  {
    id: "approve_financial_statements",
    title: "Approval of Financial Statements",
    icon: "📊", category: "compliance", categoryLabel: "Compliance & Annual", categoryIcon: "⚖️",
    kind: "ordinary",
    section: "Sec. 134(1) — Companies Act, 2013",
    rocFiling: "AOC-4 within 30 days of AGM",
    fields: [
      { key: "financialYear", label: "Financial Year",           placeholder: "e.g. 2024-25", required: true },
      { key: "balanceSheetDate", label: "Balance Sheet Date",    placeholder: "", type: "date", required: true },
      { key: "auditorName",   label: "Statutory Auditor",        placeholder: "e.g. M/s ABC & Associates", required: true },
    ],
    preamble: `The Chairman placed before the Board the Audited Financial Statements of the Company for the Financial Year ended {balanceSheetDate}, comprising the Balance Sheet, Statement of Profit & Loss, Cash Flow Statement and Notes thereto, as audited by the Statutory Auditors, {auditorName}. The Board deliberated upon and considered the Financial Statements.`,
    resolution: `RESOLVED THAT the Audited Financial Statements of the Company for the Financial Year {financialYear} ending {balanceSheetDate}, comprising the Balance Sheet, Statement of Profit & Loss, Cash Flow Statement and Notes thereto, as prepared and audited by {auditorName}, be and are hereby approved and adopted.\n\nRESOLVED FURTHER THAT the Board's Report for the Financial Year {financialYear} as placed before the Board be and is hereby approved.${AUTH}`,
    notes: "File AOC-4 with ROC within 30 days of AGM. Annual Return MGT-7 within 60 days of AGM.",
  },
  {
    id: "convene_agm",
    title: "Convene Annual General Meeting (AGM)",
    icon: "🏛️", category: "compliance", categoryLabel: "Compliance & Annual", categoryIcon: "⚖️",
    kind: "ordinary",
    section: "Sec. 96 — Companies Act, 2013",
    rocFiling: undefined,
    fields: [
      { key: "agmDate",    label: "Proposed AGM Date",    placeholder: "", type: "date", required: true },
      { key: "agmTime",    label: "Time of AGM",          placeholder: "e.g. 11:00 AM", required: true },
      { key: "agmVenue",   label: "Venue of AGM",         placeholder: "e.g. Registered Office", required: true, type: "textarea" },
      { key: "financialYear", label: "Financial Year",    placeholder: "e.g. 2024-25", required: true },
    ],
    preamble: `The Chairman informed the Board about the requirement of holding the Annual General Meeting of the Company for the Financial Year {financialYear}, within the time prescribed under Section 96 of the Companies Act, 2013. The Board considered the date, time and venue of the proposed AGM.`,
    resolution: `RESOLVED THAT the {financialYear} Annual General Meeting of the Company be convened and held on {agmDate} at {agmTime} at {agmVenue} to transact the ordinary and special business as set out in the Notice of the AGM.\n\nRESOLVED FURTHER THAT the Notice of AGM along with Explanatory Statement, wherever applicable, be sent to all shareholders, Directors, Auditors and other entitled persons as required under the Companies Act, 2013.${AUTH}`,
    notes: "AGM must be held within 6 months of Financial Year end (Sec. 96). First AGM within 9 months.",
  },
  {
    id: "convene_egm",
    title: "Convene Extraordinary General Meeting (EGM)",
    icon: "⚡", category: "compliance", categoryLabel: "Compliance & Annual", categoryIcon: "⚖️",
    kind: "ordinary",
    section: "Sec. 100 — Companies Act, 2013",
    rocFiling: undefined,
    fields: [
      { key: "egmDate",    label: "Proposed EGM Date",    placeholder: "", type: "date", required: true },
      { key: "egmTime",    label: "Time of EGM",          placeholder: "e.g. 11:00 AM", required: true },
      { key: "egmVenue",   label: "Venue of EGM",         placeholder: "e.g. Registered Office", required: true },
      { key: "purpose",    label: "Purpose / Agenda",     placeholder: "e.g. Approval of increase in Authorised Capital", required: true, type: "textarea" },
    ],
    preamble: `The Chairman informed the Board that it is necessary to convene an Extraordinary General Meeting of the members of the Company to transact the following special business which requires approval of the members: {purpose}. The Board deliberated upon the date, time and venue of the proposed EGM.`,
    resolution: `RESOLVED THAT an Extraordinary General Meeting of the members of the Company be convened on {egmDate} at {egmTime} at {egmVenue} to transact the following business:\n\n{purpose}\n\nRESOLVED FURTHER THAT Notice of EGM along with the relevant Explanatory Statement under Section 102 of the Companies Act, 2013 be sent to all shareholders and other entitled persons.${AUTH}`,
  },
  {
    id: "change_registered_office",
    title: "Change of Registered Office (within same city)",
    icon: "🏢", category: "compliance", categoryLabel: "Compliance & Annual", categoryIcon: "⚖️",
    kind: "ordinary",
    section: "Sec. 12(3)(b) — Companies Act, 2013",
    rocFiling: "INC-22 within 30 days",
    fields: [
      { key: "newAddress",  label: "New Registered Office Address", placeholder: "Full address with PIN code", type: "textarea", required: true },
      { key: "effectDate",  label: "Effective Date",                placeholder: "", type: "date", required: true },
    ],
    preamble: `The Chairman informed the Board that the Company proposes to shift its Registered Office to a new address within the same city/town, with effect from {effectDate}. The Board deliberated upon the proposal.`,
    resolution: `RESOLVED THAT the Registered Office of the Company be and is hereby shifted to:\n\n{newAddress}\n\nwith effect from {effectDate}, within the same city, in accordance with Section 12(3)(b) of the Companies Act, 2013.\n\nRESOLVED FURTHER THAT Form INC-22 be filed with the Registrar of Companies within 30 days of such change.${AUTH}`,
    notes: "Change within same RoC jurisdiction — Ordinary Board Resolution. Change to different state requires Special Resolution + RD approval.",
  },
  {
    id: "authorize_roc_filing",
    title: "Authorise Director / CS to Sign & File ROC Forms",
    icon: "📁", category: "compliance", categoryLabel: "Compliance & Annual", categoryIcon: "⚖️",
    kind: "ordinary",
    section: "Sec. 179(1) — Companies Act, 2013",
    rocFiling: undefined,
    fields: [
      { key: "authorizedPerson", label: "Authorised Person",  placeholder: "e.g. Managing Director / Company Secretary", required: true },
      { key: "purpose",          label: "Purpose",            placeholder: "e.g. Filing Annual Return, Financial Statements and other forms with ROC", type: "textarea", required: true },
    ],
    preamble: `The Chairman informed the Board about the need to authorise a person to sign and file documents, returns and forms with the Registrar of Companies and other regulatory authorities on behalf of the Company.`,
    resolution: `RESOLVED THAT {authorizedPerson} be and is/are hereby authorised to sign, execute and file all necessary documents, returns, forms and applications including {purpose} with the Registrar of Companies, MCA Portal, Income Tax, GST and other statutory authorities on behalf of the Company.${AUTH}`,
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY 6 — AUDITOR
══════════════════════════════════════════════════════════════════ */
const AUDITOR: BRTemplate[] = [
  {
    id: "recommend_auditor_agm",
    title: "Recommend Appointment of Auditor (at AGM)",
    icon: "🔍", category: "auditor", categoryLabel: "Auditor Matters", categoryIcon: "🔍",
    kind: "ordinary",
    section: "Sec. 139(1) — Companies Act, 2013",
    rocFiling: "ADT-1 within 15 days of AGM",
    fields: [
      { key: "auditorName",    label: "Auditor / Firm Name",      placeholder: "e.g. M/s ABC & Associates", required: true },
      { key: "auditorRegNo",   label: "ICAI Reg. No. (FRN)",      placeholder: "e.g. 100123W", required: true },
      { key: "auditorAddress", label: "Auditor Address",          placeholder: "e.g. Mumbai" },
      { key: "tenure",         label: "Tenure (years)",           placeholder: "5", type: "number" },
      { key: "auditFee",       label: "Audit Fee (₹ p.a.)",       placeholder: "e.g. 50,000" },
    ],
    preamble: `The Chairman informed the Board that the term of the existing Statutory Auditors is expiring and it is proposed to recommend the appointment of {auditorName} (FRN: {auditorRegNo}) as Statutory Auditors of the Company for a period of {tenure} years to the shareholders at the ensuing Annual General Meeting. The Board noted that the firm has given its consent and confirmed its eligibility under Section 141 of the Companies Act, 2013.`,
    resolution: `RESOLVED THAT the Board hereby recommends to the shareholders the appointment of {auditorName} (FRN: {auditorRegNo}), {auditorAddress}, as the Statutory Auditors of the Company for a period of {tenure} consecutive years from the conclusion of this AGM until the conclusion of the {tenure}th subsequent AGM, at a remuneration of ₹{auditFee} per annum plus applicable taxes and reimbursement of out-of-pocket expenses.${AUTH}`,
    notes: "File ADT-1 with ROC within 15 days of AGM. Auditor appointment must be ratified each year at AGM (if applicable).",
  },
];

/* ══════════════════════════════════════════════════════════════════
   EXPORTS
══════════════════════════════════════════════════════════════════ */
export const ALL_BR_TEMPLATES: BRTemplate[] = [
  ...DIRECTORS,
  ...SHARES,
  ...FINANCIAL,
  ...PROPERTY,
  ...COMPLIANCE,
  ...AUDITOR,
];

export const BR_CATEGORY_ORDER = [
  "directors", "shares", "financial", "property", "compliance", "auditor",
];

export const BR_CATEGORY_META: Record<string, { label: string; icon: string }> = {
  directors:  { label: "Directors & KMP",              icon: "👥" },
  shares:     { label: "Share Capital & Transfers",    icon: "📈" },
  financial:  { label: "Financial & Banking",          icon: "💰" },
  property:   { label: "Property & Contracts",         icon: "🏢" },
  compliance: { label: "Compliance & Annual",          icon: "⚖️" },
  auditor:    { label: "Auditor Matters",              icon: "🔍" },
};

/** Fill {placeholder} in resolution/preamble text */
export function fillBRTemplate(text: string, fields: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, key) => fields[key] || `[${key.toUpperCase()}]`);
}
