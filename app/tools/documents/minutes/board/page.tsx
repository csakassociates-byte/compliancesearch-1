"use client";
import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import CompanyExcelUpload from "@/components/CompanyExcelUpload";
import CompanySearch from "@/components/CompanySearch";
import type { CompanyData } from "@/lib/types/company";

/* ══════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════ */
interface Director {
  name: string;
  designation: string;
  din: string;
  isPresent: boolean;
  leaveGranted: boolean;
}

interface Invitee {
  id: string;
  name: string;
  designation: string;
}

interface AgendaItemData {
  id: string;
  templateId: string;
  title: string;
  discussion: string;
  resolution: string;
  resolutionType: "ordinary" | "special" | "none";
  fields: Record<string, string>;
}

interface F {
  // Step 1 — Company
  companyName: string;
  cin: string;
  regAddress: string;
  entityType: string;
  // Step 2 — Meeting
  meetingSerial: string;
  financialYear: string;
  meetingDate: string;
  meetingTime: string;
  closingTime: string;
  venue: string;
  chairmanName: string;
  chairmanDin: string;
  chairmanDesig: string;
  prevMeetingDate: string;
  // Step 3 — Attendance
  directors: Director[];
  invitees: Invitee[];
  // Step 4 — Agenda
  agendaItems: AgendaItemData[];
  // Step 5 — Options
  printOnLetterhead: boolean;
  printMobile: string;
  printEmail: string;
}

const DEFAULT: F = {
  companyName: "", cin: "", regAddress: "", entityType: "pvt_ltd",
  meetingSerial: "", financialYear: "", meetingDate: "", meetingTime: "",
  closingTime: "", venue: "", chairmanName: "", chairmanDin: "", chairmanDesig: "Director",
  prevMeetingDate: "",
  directors: [], invitees: [],
  agendaItems: [],
  printOnLetterhead: true, printMobile: "", printEmail: "",
};

const ENTITY_LABELS: Record<string, string> = {
  pvt_ltd: "Private Limited Company", opc: "One Person Company",
  public_ltd: "Public Limited Company", llp: "Limited Liability Partnership",
  section8: "Section 8 Company", nidhi: "Nidhi Company", other: "Company",
};

/* ══════════════════════════════════════════════════════════════════
   AGENDA TEMPLATES
══════════════════════════════════════════════════════════════════ */
type AgendaTemplate = {
  id: string;
  title: string;
  icon: string;
  category: "mandatory" | "corporate" | "financial" | "hr";
  fields: { key: string; label: string; placeholder: string; type?: string }[];
  discussion: string;
  resolution: string;
  resolutionType: "ordinary" | "special" | "none";
};

const AGENDA_TEMPLATES: AgendaTemplate[] = [
  {
    id: "prev_minutes",
    title: "Noting of Previous Meeting Minutes",
    icon: "📄",
    category: "mandatory",
    fields: [
      { key: "prevMeetingNo", label: "Previous Meeting No.", placeholder: "e.g. 4/2024-25" },
      { key: "prevMeetingDate", label: "Date of Previous Meeting", placeholder: "e.g. 15 March 2025", type: "date" },
    ],
    discussion: `The Chairman informed the Board that the Minutes of the {prevMeetingNo} Meeting of the Board of Directors held on {prevMeetingDate} were circulated to all the Directors. The same were taken on record.`,
    resolution: "",
    resolutionType: "none",
  },
  {
    id: "bank_account",
    title: "Opening of Bank Account",
    icon: "🏦",
    category: "financial",
    fields: [
      { key: "bankName", label: "Bank Name", placeholder: "e.g. State Bank of India" },
      { key: "branchName", label: "Branch Name", placeholder: "e.g. Andheri East Branch" },
      { key: "accountType", label: "Account Type", placeholder: "e.g. Current Account" },
      { key: "signatoryNames", label: "Authorised Signatory(ies)", placeholder: "e.g. Mr. Rahul Sharma, Managing Director" },
      { key: "operationMode", label: "Mode of Operation", placeholder: "e.g. Severally / Jointly" },
    ],
    discussion: `The Chairman informed the Board about the requirement of opening a bank account with {bankName}, {branchName} for the business operations of the Company. After deliberation, the Board unanimously agreed to open the said account.`,
    resolution: `RESOLVED THAT pursuant to Section 179(3)(d) of the Companies Act, 2013 read with Rule 8 of the Companies (Meetings of Board and its Powers) Rules, 2014, consent of the Board of Directors be and is hereby accorded to open a {accountType} in the name of the Company with {bankName}, {branchName}.\n\nRESOLVED FURTHER THAT {signatoryNames} be and is/are hereby authorised to operate the said Bank Account {operationMode} on behalf of the Company.\n\nRESOLVED FURTHER THAT any one of the Directors of the Company be and is hereby authorised to do all such acts, deeds and things as may be necessary for giving effect to the above Resolution.`,
    resolutionType: "ordinary",
  },
  {
    id: "appt_director",
    title: "Appointment of Additional Director",
    icon: "👤",
    category: "corporate",
    fields: [
      { key: "dirName", label: "Director Name", placeholder: "e.g. Mr. Rajesh Kumar Sharma" },
      { key: "dirDin", label: "DIN", placeholder: "e.g. 01234567" },
      { key: "dirDesig", label: "Designation", placeholder: "e.g. Additional Director" },
      { key: "effectiveDate", label: "Effective Date", placeholder: "e.g. 05 June 2025", type: "date" },
    ],
    discussion: `The Chairman informed the Board about the proposal to appoint {dirName} (DIN: {dirDin}) as {dirDesig} on the Board of the Company with effect from {effectiveDate}. The Board after considering the experience and expertise of the proposed appointee, unanimously agreed to the appointment.`,
    resolution: `RESOLVED THAT pursuant to Section 161(1) of the Companies Act, 2013, {dirName} (DIN: {dirDin}), be and is hereby appointed as an Additional Director (in the capacity of {dirDesig}) of the Company with effect from {effectiveDate}, to hold office up to the date of the next Annual General Meeting or the last date on which the Annual General Meeting should have been held, whichever is earlier.\n\nRESOLVED FURTHER THAT the Company Secretary / any Director of the Company be and is hereby authorised to file necessary forms with the Registrar of Companies and to do all such acts, deeds and things as may be required in this regard.`,
    resolutionType: "ordinary",
  },
  {
    id: "resign_director",
    title: "Noting of Director's Resignation",
    icon: "🚪",
    category: "corporate",
    fields: [
      { key: "dirName", label: "Director Name", placeholder: "e.g. Mr. Suresh Mehta" },
      { key: "dirDin", label: "DIN", placeholder: "e.g. 07654321" },
      { key: "resignDate", label: "Date of Resignation", placeholder: "e.g. 01 June 2025", type: "date" },
    ],
    discussion: `The Chairman placed before the Board the resignation letter dated {resignDate} received from {dirName} (DIN: {dirDin}), Director of the Company, tendering his/her resignation from the directorship of the Company with effect from {resignDate}. The Board took note of the same.`,
    resolution: `RESOLVED THAT the resignation of {dirName} (DIN: {dirDin}) from the office of Director of the Company with effect from {resignDate}, be and is hereby noted and accepted.\n\nRESOLVED FURTHER THAT the Company Secretary / any Director of the Company be and is hereby authorised to file necessary forms with the Registrar of Companies and to do all such acts as may be necessary in this regard.`,
    resolutionType: "ordinary",
  },
  {
    id: "auditor_appt",
    title: "Appointment / Reappointment of Auditor",
    icon: "🔍",
    category: "financial",
    fields: [
      { key: "auditorName", label: "Auditor Firm Name", placeholder: "e.g. M/s ABC & Associates" },
      { key: "auditorRegNo", label: "ICAI Firm Reg. No.", placeholder: "e.g. 123456W" },
      { key: "fromFY", label: "From Financial Year", placeholder: "e.g. 2025-26" },
      { key: "toFY", label: "To Financial Year", placeholder: "e.g. 2029-30" },
      { key: "remuneration", label: "Remuneration", placeholder: "e.g. as mutually agreed" },
    ],
    discussion: `The Chairman informed the Board about the appointment/reappointment of Statutory Auditors of the Company. The Board considered the proposal to appoint {auditorName} (ICAI Firm Reg. No. {auditorRegNo}) as the Statutory Auditors of the Company for a term of 5 consecutive years from FY {fromFY} to FY {toFY}, subject to ratification by shareholders at each AGM.`,
    resolution: `RESOLVED THAT pursuant to Sections 139, 141 and other applicable provisions of the Companies Act, 2013 read with the Companies (Audit and Auditors) Rules, 2014, {auditorName}, Chartered Accountants (ICAI Firm Registration No. {auditorRegNo}), be and are hereby appointed as the Statutory Auditors of the Company, to hold office from the conclusion of this meeting until the conclusion of the Annual General Meeting to be held for FY {toFY}, at a remuneration of {remuneration}, plus applicable taxes and reimbursement of actual out-of-pocket expenses.\n\nRESOLVED FURTHER THAT any Director / Company Secretary of the Company be and is hereby authorised to file Form ADT-1 with the Registrar of Companies.`,
    resolutionType: "ordinary",
  },
  {
    id: "annual_accounts",
    title: "Adoption of Annual Accounts",
    icon: "📊",
    category: "financial",
    fields: [
      { key: "fy", label: "Financial Year", placeholder: "e.g. 2024-25" },
      { key: "balanceSheetDate", label: "Balance Sheet Date", placeholder: "e.g. 31 March 2025" },
    ],
    discussion: `The Chairman placed before the Board the Annual Financial Statements of the Company for the Financial Year ended {balanceSheetDate}, comprising of Balance Sheet, Statement of Profit and Loss, Cash Flow Statement, Statement of Changes in Equity and Notes to Accounts, along with the Auditors' Report and Board's Report thereon. The Board after detailed deliberation, unanimously adopted the same.`,
    resolution: `RESOLVED THAT the Audited Financial Statements of the Company for the Financial Year {fy} ended {balanceSheetDate}, as prepared and presented before the Board, together with the Auditors' Report and Board's Report thereon, be and are hereby approved and adopted.\n\nRESOLVED FURTHER THAT the Directors be and are hereby authorised to sign the Financial Statements on behalf of the Board.\n\nRESOLVED FURTHER THAT the Company Secretary / any Director be authorised to file the same with the Registrar of Companies.`,
    resolutionType: "ordinary",
  },
  {
    id: "loan_sanction",
    title: "Sanction of Loan / Borrowing",
    icon: "💰",
    category: "financial",
    fields: [
      { key: "loanAmount", label: "Loan Amount", placeholder: "e.g. ₹50,00,000" },
      { key: "lenderName", label: "Lender / Bank Name", placeholder: "e.g. HDFC Bank Ltd." },
      { key: "purpose", label: "Purpose of Loan", placeholder: "e.g. working capital requirements" },
      { key: "interestRate", label: "Rate of Interest", placeholder: "e.g. 12% p.a." },
      { key: "tenure", label: "Tenure", placeholder: "e.g. 3 years" },
    ],
    discussion: `The Chairman placed before the Board a proposal to avail a loan / credit facility from {lenderName} amounting to {loanAmount} for the purpose of {purpose}. The Board after deliberation unanimously approved the same.`,
    resolution: `RESOLVED THAT pursuant to Section 179(3)(d) and other applicable provisions of the Companies Act, 2013, consent of the Board be and is hereby accorded to borrow a sum of {loanAmount} from {lenderName} at an interest rate of {interestRate} for a period of {tenure} for the purpose of {purpose}.\n\nRESOLVED FURTHER THAT the Managing Director / any Director of the Company be and is hereby authorised to execute the necessary loan documents, agreements, and to do all such acts as may be necessary to give effect to this resolution.`,
    resolutionType: "ordinary",
  },
  {
    id: "dividend",
    title: "Declaration / Recommendation of Dividend",
    icon: "💸",
    category: "financial",
    fields: [
      { key: "dividendType", label: "Type", placeholder: "e.g. Interim / Final" },
      { key: "dividendRate", label: "Rate", placeholder: "e.g. 10% (₹1 per share)" },
      { key: "recordDate", label: "Record Date", placeholder: "e.g. 15 June 2025", type: "date" },
      { key: "paymentDate", label: "Payment Date", placeholder: "e.g. 30 June 2025", type: "date" },
      { key: "fy", label: "Financial Year", placeholder: "e.g. 2024-25" },
    ],
    discussion: `The Chairman informed the Board about the proposal to declare/recommend {dividendType} Dividend for the Financial Year {fy}. The Board considered the financial position of the Company and unanimously agreed to declare/recommend the dividend.`,
    resolution: `RESOLVED THAT {dividendType} Dividend at the rate of {dividendRate} for the Financial Year {fy} be and is hereby declared/recommended on the Equity Shares of the Company to those shareholders whose names appear in the Register of Members as on the record date i.e. {recordDate}.\n\nRESOLVED FURTHER THAT the dividend be paid to the eligible shareholders on or before {paymentDate}.\n\nRESOLVED FURTHER THAT any Director / Company Secretary be authorised to do all acts necessary for payment of dividend.`,
    resolutionType: "ordinary",
  },
  {
    id: "aob",
    title: "Any Other Business (AOB)",
    icon: "📌",
    category: "mandatory",
    fields: [],
    discussion: `There being no other business to transact, the Chairman thanked all present for their participation and with the permission of the Board, declared the meeting concluded.`,
    resolution: "",
    resolutionType: "none",
  },
];

/* ══════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════ */
function fillTemplate(template: string, fields: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => fields[key] || `[${key.toUpperCase()}]`);
}

function fmtDate(d: string): string {
  if (!d) return "__________";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  } catch { return d; }
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function quorumRequired(totalDirs: number, entityType: string): number {
  if (entityType === "public_ltd") return Math.max(3, Math.ceil(totalDirs / 3));
  return Math.max(2, Math.ceil(totalDirs / 3));
}

/* ══════════════════════════════════════════════════════════════════
   PRINT HTML GENERATOR
══════════════════════════════════════════════════════════════════ */
function generateMinutesHTML(f: F): string {
  const presentDirs = f.directors.filter(d => d.isPresent);
  const absentDirs  = f.directors.filter(d => !d.isPresent);
  const entity = ENTITY_LABELS[f.entityType] || "Company";

  let resolutionCounter = 0;
  const agendaHTML = f.agendaItems.map((item, idx) => {
    const hasResolution = item.resolution && item.resolution.trim() && item.resolutionType !== "none";
    if (hasResolution) resolutionCounter++;
    const resNo = hasResolution ? resolutionCounter : 0;
    const fy = f.financialYear || new Date().getFullYear().toString();

    return `
      <div style="margin-bottom:14px;">
        <p style="font-weight:bold;font-size:10pt;text-transform:uppercase;margin-bottom:4px;">
          ITEM NO. ${String(idx + 1).padStart(2, "0")} — ${item.title}
        </p>
        <p style="font-size:9.5pt;text-align:justify;line-height:1.6;margin-bottom:8px;">${item.discussion}</p>
        ${hasResolution ? `
          <p style="font-weight:bold;font-size:9.5pt;margin-bottom:3px;">
            Resolution No. ${resNo}/${f.meetingSerial || "BM"}/${fy}${item.resolutionType === "special" ? " [Special Resolution]" : ""}:
          </p>
          <div style="border-left:3px solid #1d4ed8;padding-left:12px;background:#f8faff;padding:8px 8px 8px 12px;margin-bottom:4px;">
            <p style="font-size:9.5pt;text-align:justify;line-height:1.6;white-space:pre-line;">${item.resolution}</p>
          </div>
        ` : ""}
      </div>`;
  }).join("");

  const css = `
    @page { size: A4; margin: 18mm 16mm 14mm 16mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Times New Roman", Times, serif; font-size: 10pt; line-height: 1.4; color: #000; background: #fff; }
    .center { text-align: center; }
    .upper { text-transform: uppercase; }
    .bold { font-weight: bold; }
    table { width: 100%; border-collapse: collapse; }
    td, th { border: 1px solid #555; padding: 5px 8px; font-size: 9pt; vertical-align: top; }
    th { font-weight: bold; background: #f5f5f5; text-align: center; }
    .divider { border-top: 1.5px solid #333; margin: 10px 0; }
    .thin-divider { border-top: 1px dashed #bbb; margin: 8px 0; }
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Board Meeting Minutes — ${f.companyName || "Company"}</title>
<style>${css}</style>
</head>
<body>

${f.printOnLetterhead ? `
  <div style="border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:10px;text-align:center;">
    <p style="font-weight:900;font-size:14pt;text-transform:uppercase;letter-spacing:1px;">${f.companyName || "[COMPANY NAME]"}</p>
    <p style="font-size:8.5pt;margin-top:2px;"><strong>CIN:</strong> ${f.cin || "___"}</p>
    <p style="font-size:8.5pt;"><strong>Reg. Office:</strong> ${f.regAddress || "___"}</p>
    <div style="display:flex;justify-content:center;gap:24px;font-size:8.5pt;margin-top:2px;flex-wrap:wrap;">
      ${f.printMobile ? `<span><strong>Tel:</strong> ${f.printMobile}</span>` : ""}
      ${f.printEmail  ? `<span><strong>Email:</strong> ${f.printEmail}</span>` : ""}
    </div>
  </div>
` : ""}

<!-- TITLE -->
<div class="center" style="margin-bottom:10px;">
  <p style="font-weight:bold;font-size:11pt;text-transform:uppercase;letter-spacing:0.5px;">
    Certified True Copy of Minutes
  </p>
  <p style="font-size:9.5pt;margin-top:2px;">
    of the ${f.meetingSerial ? ordinal(parseInt(f.meetingSerial.split("/")[0]) || 1) : "___"} Meeting of the Board of Directors
  </p>
  <p style="font-weight:bold;font-size:10pt;margin-top:2px;text-transform:uppercase;">
    ${f.companyName || "[COMPANY NAME]"}
  </p>
  <p style="font-size:9pt;margin-top:1px;">(${entity})</p>
  ${!f.printOnLetterhead ? `<p style="font-size:8.5pt;margin-top:2px;"><strong>CIN:</strong> ${f.cin || "___"}</p>` : ""}
</div>

<div class="divider"></div>

<!-- MEETING DETAILS TABLE -->
<table style="margin-bottom:10px;">
  <tr>
    <th style="width:30%;text-align:left;">Meeting No.</th>
    <td>${f.meetingSerial || "___"}</td>
    <th style="width:20%;text-align:left;">Financial Year</th>
    <td>${f.financialYear || "___"}</td>
  </tr>
  <tr>
    <th style="text-align:left;">Date</th>
    <td>${fmtDate(f.meetingDate)}</td>
    <th style="text-align:left;">Time</th>
    <td>${f.meetingTime || "___"} — ${f.closingTime || "___"}</td>
  </tr>
  <tr>
    <th style="text-align:left;">Venue</th>
    <td colspan="3">${f.venue || "___"}</td>
  </tr>
  <tr>
    <th style="text-align:left;">Chairman</th>
    <td colspan="3">
      ${f.chairmanName || "___"}${f.chairmanDesig ? `, ${f.chairmanDesig}` : ""}${f.chairmanDin ? ` (DIN: ${f.chairmanDin})` : ""}
    </td>
  </tr>
</table>

<!-- DIRECTORS PRESENT -->
<p style="font-weight:bold;font-size:9.5pt;margin-bottom:4px;">DIRECTORS PRESENT:</p>
<table style="margin-bottom:8px;">
  <tr>
    <th style="width:5%;">Sr.</th>
    <th style="width:40%;">Name</th>
    <th style="width:30%;">Designation</th>
    <th>DIN</th>
  </tr>
  ${presentDirs.map((d, i) => `
    <tr>
      <td class="center">${i + 1}</td>
      <td>${d.name || "___"}</td>
      <td>${d.designation || "Director"}</td>
      <td>${d.din || "—"}</td>
    </tr>`).join("")}
  ${presentDirs.length === 0 ? `<tr><td colspan="4" style="text-align:center;color:#888;font-style:italic;">No directors marked present</td></tr>` : ""}
</table>

${absentDirs.length > 0 ? `
  <p style="font-weight:bold;font-size:9.5pt;margin-bottom:4px;">DIRECTORS ABSENT:</p>
  <table style="margin-bottom:8px;">
    <tr>
      <th style="width:5%;">Sr.</th>
      <th style="width:40%;">Name</th>
      <th style="width:30%;">Designation</th>
      <th>DIN</th>
    </tr>
    ${absentDirs.map((d, i) => `
      <tr>
        <td class="center">${i + 1}</td>
        <td>${d.name || "___"}${d.leaveGranted ? " *" : ""}</td>
        <td>${d.designation || "Director"}</td>
        <td>${d.din || "—"}</td>
      </tr>`).join("")}
  </table>
  ${absentDirs.some(d => d.leaveGranted) ? `<p style="font-size:8pt;font-style:italic;margin-bottom:8px;">* Leave of absence granted by the Board.</p>` : ""}
` : ""}

${f.invitees.filter(inv => inv.name).length > 0 ? `
  <p style="font-weight:bold;font-size:9.5pt;margin-bottom:4px;">INVITEES PRESENT:</p>
  <table style="margin-bottom:8px;">
    <tr><th style="width:5%;">Sr.</th><th>Name</th><th>Designation</th></tr>
    ${f.invitees.filter(inv => inv.name).map((inv, i) => `
      <tr><td class="center">${i + 1}</td><td>${inv.name}</td><td>${inv.designation || "—"}</td></tr>`).join("")}
  </table>
` : ""}

<div class="divider"></div>

<!-- OPENING -->
<p style="font-size:9.5pt;text-align:justify;margin-bottom:10px;line-height:1.6;">
  The Chairman called the meeting to order, welcomed all the Directors and informed the Board that
  the requisite Notice along with the Agenda for the meeting was circulated in advance to all the Directors.
  The Chairman noted that the requisite quorum as required under Section 174 of the Companies Act, 2013
  and Secretarial Standard-1 was present. The Chairman presided over the meeting.
</p>

<div class="thin-divider"></div>

<!-- AGENDA -->
<p style="font-weight:bold;font-size:10pt;text-transform:uppercase;text-align:center;margin:8px 0 12px;">
  PROCEEDINGS
</p>

${agendaHTML}

<div class="divider"></div>

<!-- CLOSING -->
<p style="font-size:9.5pt;text-align:justify;margin-bottom:16px;line-height:1.6;">
  There being no other business to transact, the Chairman thanked all the Directors and invitees
  present for their valuable contribution. With the permission of the Board, the Chairman declared
  the meeting concluded at ${f.closingTime || "___"}.
</p>

<!-- SIGNATURE -->
<div style="margin-top:20px;display:flex;justify-content:flex-end;">
  <div style="text-align:center;min-width:200px;">
    <div style="border-bottom:1.5px solid #000;height:45px;margin-bottom:5px;"></div>
    <p style="font-weight:bold;font-size:10pt;">${f.chairmanName || "___________"}</p>
    <p style="font-size:9pt;">${f.chairmanDesig || "Chairman"}</p>
    ${f.chairmanDin ? `<p style="font-size:8.5pt;">DIN: ${f.chairmanDin}</p>` : ""}
    <p style="font-size:8.5pt;margin-top:4px;">Date: ${fmtDate(f.meetingDate)}</p>
    <p style="font-size:8.5pt;">Place: ${f.venue?.split(",")[0] || "___"}</p>
  </div>
</div>

<p style="font-size:7.5pt;color:#888;margin-top:20px;border-top:1px solid #eee;padding-top:6px;text-align:center;">
  Generated by ComplianceSearch.in — For guidance only. Review before finalizing. Consult a qualified CS/CA.
</p>

</body>
</html>`;
}

/* ══════════════════════════════════════════════════════════════════
   UI HELPERS
══════════════════════════════════════════════════════════════════ */
const INP = "w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white";
const SEL = "w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white";

function Lbl({ c, h }: { c: React.ReactNode; h?: string }) {
  return (
    <div className="mb-1">
      <p className="text-sm font-semibold text-slate-700">{c}</p>
      {h && <p className="text-xs text-slate-400">{h}</p>}
    </div>
  );
}

function SHead({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-1">
        <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm shrink-0">{n}</span>
        <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
      </div>
      <p className="text-slate-500 text-sm ml-11">{sub}</p>
    </div>
  );
}

const STEPS = ["Company", "Meeting", "Attendance", "Agenda", "Preview"];

/* ══════════════════════════════════════════════════════════════════
   AGENDA ITEM CARD
══════════════════════════════════════════════════════════════════ */
function AgendaCard({
  item, index, total,
  onMove, onRemove, onChange,
}: {
  item: AgendaItemData; index: number; total: number;
  onMove: (dir: "up" | "down") => void;
  onRemove: () => void;
  onChange: (updated: AgendaItemData) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const template = AGENDA_TEMPLATES.find(t => t.id === item.templateId);

  function updateField(key: string, val: string) {
    const newFields = { ...item.fields, [key]: val };
    const newItem: AgendaItemData = {
      ...item,
      fields: newFields,
      discussion: template ? fillTemplate(template.discussion, newFields) : item.discussion,
      resolution:  template ? fillTemplate(template.resolution, newFields)  : item.resolution,
    };
    onChange(newItem);
  }

  const isMandatory = item.templateId === "prev_minutes" || item.templateId === "aob";

  return (
    <div className={`border-2 rounded-2xl overflow-hidden transition-all ${expanded ? "border-blue-300 shadow-md" : "border-slate-200"}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white">
        <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm truncate">{item.title}</p>
          {item.resolutionType !== "none" && item.resolution && (
            <p className="text-xs text-blue-500 font-medium">Resolution included</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={() => onMove("up")} disabled={index === 0}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-20 transition">▲</button>
          <button type="button" onClick={() => onMove("down")} disabled={index === total - 1}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-20 transition">▼</button>
          <button type="button" onClick={() => setExpanded(!expanded)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 transition">
            {expanded ? "▲ Close" : "✎ Edit"}
          </button>
          {!isMandatory && (
            <button type="button" onClick={onRemove}
              className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition">✕</button>
          )}
        </div>
      </div>

      {/* Edit panel */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 space-y-3">
          {/* Template fields */}
          {template && template.fields.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {template.fields.map(field => (
                <div key={field.key}>
                  <Lbl c={field.label} />
                  <input
                    type={field.type === "date" ? "date" : "text"}
                    className={INP}
                    value={item.fields[field.key] || ""}
                    placeholder={field.type === "date" ? "" : field.placeholder}
                    onChange={e => updateField(field.key, field.type === "date" ? fmtDate(e.target.value) : e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Discussion text */}
          <div>
            <Lbl c="Discussion Text" h="Edit the proceeding text" />
            <textarea className={`${INP} resize-none`} rows={3} value={item.discussion}
              onChange={e => onChange({ ...item, discussion: e.target.value })} />
          </div>

          {/* Resolution text */}
          {item.resolutionType !== "none" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <Lbl c={<span>Resolution Text <span className="text-xs font-normal text-slate-400">(editable)</span></span>} />
                <select className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
                  value={item.resolutionType}
                  onChange={e => onChange({ ...item, resolutionType: e.target.value as "ordinary" | "special" })}>
                  <option value="ordinary">Ordinary Resolution</option>
                  <option value="special">Special Resolution</option>
                </select>
              </div>
              <textarea className={`${INP} resize-none font-mono text-xs`} rows={6} value={item.resolution}
                onChange={e => onChange({ ...item, resolution: e.target.value })} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════ */
export default function BoardMinutesPage() {
  const [f, setF] = useState<F>({ ...DEFAULT });
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [showTemplates, setShowTemplates] = useState(false);

  const set = useCallback(<K extends keyof F>(k: K, v: F[K]) =>
    setF(p => ({ ...p, [k]: v })), []);

  /* ── Company fill ── */
  function applyCompany(data: CompanyData) {
    const dirs: Director[] = data.directors
      .filter(d => d.isActive)
      .map(d => ({ name: d.name, designation: d.designation || "Director", din: d.din || "", isPresent: true, leaveGranted: false }));

    setF(p => ({
      ...p,
      ...(data.companyName && { companyName: data.companyName }),
      ...(data.cin         && { cin:         data.cin }),
      ...(data.regAddress  && { regAddress:  data.regAddress }),
      ...(data.entityType  && { entityType:  data.entityType }),
      directors: dirs.length > 0 ? dirs : p.directors,
    }));
  }

  /* ── Director helpers ── */
  function setDirField(i: number, k: keyof Director, v: boolean | string) {
    const next = [...f.directors];
    next[i] = { ...next[i], [k]: v };
    set("directors", next);
  }

  function addManualDir() {
    set("directors", [...f.directors, { name: "", designation: "Director", din: "", isPresent: true, leaveGranted: false }]);
  }

  function removeDir(i: number) {
    set("directors", f.directors.filter((_, x) => x !== i));
  }

  /* ── Invitee helpers ── */
  function addInvitee() {
    set("invitees", [...f.invitees, { id: Date.now().toString(), name: "", designation: "" }]);
  }

  function setInvitee(id: string, k: "name" | "designation", v: string) {
    set("invitees", f.invitees.map(inv => inv.id === id ? { ...inv, [k]: v } : inv));
  }

  function removeInvitee(id: string) {
    set("invitees", f.invitees.filter(inv => inv.id !== id));
  }

  /* ── Agenda helpers ── */
  function addAgendaItem(templateId: string) {
    const template = AGENDA_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    const fields: Record<string, string> = {};
    template.fields.forEach(f => { fields[f.key] = ""; });
    const newItem: AgendaItemData = {
      id: `${templateId}-${Date.now()}`,
      templateId,
      title: template.title,
      discussion: template.discussion,
      resolution: template.resolution,
      resolutionType: template.resolutionType,
      fields,
    };
    // AOB always last — insert before it if it exists
    const aobIdx = f.agendaItems.findIndex(a => a.templateId === "aob");
    if (aobIdx >= 0 && templateId !== "aob") {
      const next = [...f.agendaItems];
      next.splice(aobIdx, 0, newItem);
      set("agendaItems", next);
    } else {
      set("agendaItems", [...f.agendaItems, newItem]);
    }
    setShowTemplates(false);
  }

  function moveAgenda(i: number, dir: "up" | "down") {
    const next = [...f.agendaItems];
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    set("agendaItems", next);
  }

  function removeAgenda(i: number) {
    set("agendaItems", f.agendaItems.filter((_, x) => x !== i));
  }

  function updateAgendaItem(i: number, updated: AgendaItemData) {
    const next = [...f.agendaItems];
    next[i] = updated;
    set("agendaItems", next);
  }

  /* ── Quorum ── */
  const presentCount = f.directors.filter(d => d.isPresent).length;
  const totalDirs    = f.directors.length;
  const qRequired    = quorumRequired(totalDirs, f.entityType);
  const quorumMet    = presentCount >= qRequired;

  /* ── Resolution count ── */
  const resolutionCount = useMemo(() =>
    f.agendaItems.filter(a => a.resolution && a.resolutionType !== "none").length,
  [f.agendaItems]);

  /* ── canNext ── */
  function canNext(): boolean {
    if (step === 1) return !!f.companyName && !!f.cin;
    if (step === 2) return !!f.meetingDate && !!f.meetingSerial && !!f.venue;
    if (step === 3) return presentCount >= 1;
    if (step === 4) return f.agendaItems.length > 0;
    return true;
  }

  /* ── Print ── */
  function openPrint() {
    const html = generateMinutesHTML(f);
    const win  = window.open("", "_blank", "width=900,height=700");
    if (!win) { alert("Pop-up blocked! Please allow pop-ups."); return; }
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  }

  /* ── Auto FY from date ── */
  function autoFY(dateStr: string): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    return m >= 4 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;
  }

  /* ════════════════════════════════════════════
     STEP 1 — COMPANY
  ════════════════════════════════════════════ */
  const s1 = (
    <div className="space-y-4">
      <SHead n={1} title="Company Details" sub="Search from saved companies or upload MCA Excel" />

      <CompanyExcelUpload onFill={applyCompany} accent="blue"
        note="Company details + Directors auto-filled for attendance." />

      <div className="flex items-center gap-2 my-1">
        <div className="h-px flex-1 bg-slate-100" />
        <span className="text-xs text-slate-400 font-medium">or fill manually</span>
        <div className="h-px flex-1 bg-slate-100" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Lbl c="Company Name *" h="Type to search saved companies" />
          <CompanySearch value={f.companyName} onChange={v => set("companyName", v)}
            onSelect={applyCompany} placeholder="e.g. ABC Enterprises Private Limited" className={INP} />
        </div>
        <div>
          <Lbl c="CIN *" />
          <input className={INP} value={f.cin} onChange={e => set("cin", e.target.value)}
            placeholder="e.g. U74999MH2020PTC123456" />
        </div>
        <div>
          <Lbl c="Entity Type" />
          <select className={SEL} value={f.entityType} onChange={e => set("entityType", e.target.value)}>
            {Object.entries(ENTITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <Lbl c="Registered Office Address" />
          <textarea className={`${INP} h-16 resize-none`} value={f.regAddress}
            onChange={e => set("regAddress", e.target.value)}
            placeholder="Full registered office address as per MCA records" />
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════
     STEP 2 — MEETING DETAILS
  ════════════════════════════════════════════ */
  const s2 = (
    <div className="space-y-4">
      <SHead n={2} title="Meeting Details" sub="Meeting number, date, time, venue and chairman" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Lbl c="Meeting Serial No. *" h="e.g. 5/2025-26 (5th meeting of FY 2025-26)" />
          <input className={INP} value={f.meetingSerial}
            onChange={e => set("meetingSerial", e.target.value)}
            placeholder="e.g. 5/2025-26" />
        </div>
        <div>
          <Lbl c="Financial Year" h="Auto-filled from meeting date" />
          <input className={INP} value={f.financialYear}
            onChange={e => set("financialYear", e.target.value)}
            placeholder="e.g. 2025-26" />
        </div>
        <div>
          <Lbl c="Date of Meeting *" />
          <input type="date" className={INP} value={f.meetingDate}
            onChange={e => {
              set("meetingDate", e.target.value);
              if (!f.financialYear) set("financialYear", autoFY(e.target.value));
            }} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Lbl c="Start Time *" />
            <input type="time" className={INP} value={f.meetingTime}
              onChange={e => set("meetingTime", e.target.value)} />
          </div>
          <div>
            <Lbl c="End Time" />
            <input type="time" className={INP} value={f.closingTime}
              onChange={e => set("closingTime", e.target.value)} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <Lbl c="Venue / Place of Meeting *" h="Full address where meeting is held" />
          <input className={INP} value={f.venue}
            onChange={e => set("venue", e.target.value)}
            placeholder={f.regAddress ? `e.g. Registered Office: ${f.regAddress.split(",")[0]}` : "e.g. Registered Office, Mumbai"}
            onFocus={e => { if (!f.venue && f.regAddress) set("venue", `Registered Office of the Company at ${f.regAddress}`); }} />
          {!f.venue && f.regAddress && (
            <button type="button" onClick={() => set("venue", `Registered Office of the Company at ${f.regAddress}`)}
              className="text-xs text-blue-500 hover:text-blue-700 mt-1 font-medium">
              ↳ Use registered office address
            </button>
          )}
        </div>
      </div>

      {/* Chairman */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <p className="text-sm font-bold text-blue-800 mb-3">👑 Chairman of the Meeting</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <Lbl c="Chairman Name *" />
            {f.directors.length > 0 ? (
              <select className={SEL} value={f.chairmanName}
                onChange={e => {
                  const dir = f.directors.find(d => d.name === e.target.value);
                  set("chairmanName", e.target.value);
                  if (dir) { set("chairmanDin", dir.din); set("chairmanDesig", dir.designation); }
                }}>
                <option value="">— Select Director —</option>
                {f.directors.filter(d => d.isPresent).map((d, i) => (
                  <option key={i} value={d.name}>{d.name} — {d.designation}</option>
                ))}
              </select>
            ) : (
              <input className={INP} value={f.chairmanName} onChange={e => set("chairmanName", e.target.value)}
                placeholder="e.g. Rajesh Kumar Sharma" />
            )}
          </div>
          <div>
            <Lbl c="Designation" />
            <select className={SEL} value={f.chairmanDesig} onChange={e => set("chairmanDesig", e.target.value)}>
              <option value="Director">Director</option>
              <option value="Managing Director">Managing Director</option>
              <option value="Whole-Time Director">Whole-Time Director</option>
              <option value="Chairman & Managing Director">CMD</option>
            </select>
          </div>
          <div>
            <Lbl c="DIN" />
            <input className={`${INP} ${f.chairmanDin ? "border-green-300" : ""}`}
              value={f.chairmanDin} onChange={e => set("chairmanDin", e.target.value)}
              placeholder="e.g. 01234567" maxLength={8} />
          </div>
        </div>
      </div>

      {/* Previous meeting */}
      <div>
        <Lbl c="Previous Board Meeting Date" h="For noting of previous minutes (optional)" />
        <input type="date" className={INP + " max-w-xs"} value={f.prevMeetingDate}
          onChange={e => set("prevMeetingDate", e.target.value)} />
      </div>
    </div>
  );

  /* ════════════════════════════════════════════
     STEP 3 — ATTENDANCE
  ════════════════════════════════════════════ */
  const s3 = (
    <div className="space-y-4">
      <SHead n={3} title="Attendance" sub="Mark directors present or absent — quorum auto-checked" />

      {/* Quorum indicator */}
      <div className={`rounded-xl px-4 py-3 flex items-center gap-3 border ${
        quorumMet ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"
      }`}>
        <span className="text-2xl">{quorumMet ? "✅" : "❌"}</span>
        <div>
          <p className={`font-bold text-sm ${quorumMet ? "text-green-800" : "text-red-700"}`}>
            Quorum: {presentCount}/{totalDirs} directors present
            {quorumMet ? " — Quorum Met" : ` — ${qRequired} required, not met`}
          </p>
          <p className="text-xs text-slate-500">
            {f.entityType === "public_ltd" ? "Public Ltd: max(3, 1/3 of total)" : "Pvt Ltd/OPC: max(2, 1/3 of total)"}
          </p>
        </div>
      </div>

      {/* Directors list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-slate-700">Directors</p>
          <button type="button" onClick={addManualDir}
            className="text-xs font-bold text-blue-600 hover:text-blue-800">+ Add Director</button>
        </div>

        {/* Column headers */}
        {f.directors.length > 0 && (
          <div className="flex items-center gap-3 px-3 mb-1">
            <div className="w-6 shrink-0" />
            <p className="flex-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">Director Name *</p>
            <p className="w-36 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden sm:block">Designation</p>
            <p className="w-28 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden sm:block">DIN</p>
            <div className="w-5 shrink-0" />
          </div>
        )}

        <div className="space-y-2">
          {f.directors.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4 border-2 border-dashed border-slate-200 rounded-xl">
              No directors — upload Excel or add manually above
            </p>
          )}

          {/* Warn if any director has empty name */}
          {f.directors.some(d => !d.name.trim()) && (
            <div className="flex items-start gap-2 bg-amber-50 border-2 border-amber-400 rounded-xl px-4 py-3 mb-2">
              <span className="text-amber-500 text-lg shrink-0">⚠️</span>
              <div>
                <p className="text-sm font-bold text-amber-800">Director names missing</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Names DB mein store nahi hain. Har director ka naam niche type karein — DIN dekh ke pehchano kaun hai.
                  Ya pehle <strong>MDS Excel upload</strong> karein (upar) — names auto-fill ho jaenge.
                </p>
              </div>
            </div>
          )}

          {f.directors.map((d, i) => (
            <div key={i} className={`rounded-xl border-2 transition-all ${d.isPresent ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50"}`}>
              {/* Main row */}
              <div className="flex items-center gap-3 p-3">
                {/* Present toggle */}
                <button type="button" onClick={() => setDirField(i, "isPresent", !d.isPresent)}
                  className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    d.isPresent ? "bg-green-500 border-green-500 text-white" : "border-slate-300 hover:border-green-400"}`}>
                  {d.isPresent && <span className="text-xs font-bold">✓</span>}
                </button>

                <input
                  className={`${INP} flex-1 ${!d.name.trim() ? "border-red-400 bg-red-50 focus:ring-red-200 placeholder:text-red-400" : "border-green-300"}`}
                  value={d.name}
                  onChange={e => setDirField(i, "name", e.target.value)}
                  placeholder={d.din ? `Enter name (DIN: ${d.din})` : "Enter director full name *"}
                />
                <input className={`${INP} w-36`} value={d.designation}
                  onChange={e => setDirField(i, "designation", e.target.value)} placeholder="Designation" />
                <input className={`${INP} w-28 font-mono text-xs`} value={d.din}
                  onChange={e => setDirField(i, "din", e.target.value)} placeholder="DIN" maxLength={8} />

                <button type="button" onClick={() => removeDir(i)}
                  className="text-slate-300 hover:text-red-500 transition shrink-0">✕</button>
              </div>

              {/* Absent — leave of absence row */}
              {!d.isPresent && (
                <div className="px-4 pb-2 flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                    <input type="checkbox" checked={d.leaveGranted}
                      onChange={e => setDirField(i, "leaveGranted", e.target.checked)}
                      className="rounded" />
                    <span>Leave of absence granted by the Board</span>
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invitees */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-slate-700">Invitees (CS, CFO, Auditor etc.)</p>
          <button type="button" onClick={addInvitee}
            className="text-xs font-bold text-blue-600 hover:text-blue-800">+ Add Invitee</button>
        </div>
        {f.invitees.length === 0 && (
          <p className="text-xs text-slate-400 italic">No invitees — optional</p>
        )}
        <div className="space-y-2">
          {f.invitees.map(inv => (
            <div key={inv.id} className="flex items-center gap-2">
              <input className={`${INP} flex-1`} value={inv.name}
                onChange={e => setInvitee(inv.id, "name", e.target.value)}
                placeholder="e.g. CA Priya Sharma" />
              <input className={`${INP} w-48`} value={inv.designation}
                onChange={e => setInvitee(inv.id, "designation", e.target.value)}
                placeholder="e.g. Company Secretary" />
              <button type="button" onClick={() => removeInvitee(inv.id)}
                className="text-slate-300 hover:text-red-500 transition shrink-0">✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════
     STEP 4 — AGENDA BUILDER
  ════════════════════════════════════════════ */
  const templatesByCategory: Record<string, AgendaTemplate[]> = {
    mandatory: AGENDA_TEMPLATES.filter(t => t.category === "mandatory"),
    corporate: AGENDA_TEMPLATES.filter(t => t.category === "corporate"),
    financial: AGENDA_TEMPLATES.filter(t => t.category === "financial"),
  };

  const catLabels: Record<string, string> = {
    mandatory: "📌 Mandatory",
    corporate: "🏢 Corporate",
    financial: "💰 Financial",
  };

  const addedIds = new Set(f.agendaItems.map(a => a.templateId));

  const s4 = (
    <div className="space-y-4">
      <SHead n={4} title="Agenda Builder" sub="Add agenda items — pre-built templates with auto-text" />

      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
        <p className="text-sm text-slate-600 font-medium">
          {f.agendaItems.length} items · {resolutionCount} resolution{resolutionCount !== 1 ? "s" : ""}
        </p>
        <button type="button" onClick={() => setShowTemplates(!showTemplates)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition">
          + Add Agenda Item
        </button>
      </div>

      {/* Template picker */}
      {showTemplates && (
        <div className="border-2 border-blue-200 rounded-2xl bg-blue-50/40 p-4 space-y-3">
          <p className="text-sm font-bold text-blue-800 mb-2">Select Agenda Item Template:</p>
          {Object.entries(templatesByCategory).map(([cat, templates]) => (
            <div key={cat}>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{catLabels[cat]}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {templates.map(t => {
                  const alreadyAdded = addedIds.has(t.id);
                  return (
                    <button key={t.id} type="button"
                      onClick={() => !alreadyAdded && addAgendaItem(t.id)}
                      disabled={alreadyAdded}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                        alreadyAdded
                          ? "border-green-200 bg-green-50 text-green-700 cursor-default"
                          : "border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50 text-slate-700"
                      }`}>
                      <span className="text-xl">{t.icon}</span>
                      <span className="flex-1 leading-tight">{t.title}</span>
                      {alreadyAdded
                        ? <span className="text-xs text-green-600 font-bold">✓ Added</span>
                        : <span className="text-xs text-blue-500 font-bold">+ Add</span>
                      }
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setShowTemplates(false)}
            className="text-xs text-slate-400 hover:text-slate-600 font-medium mt-1">
            ✕ Close
          </button>
        </div>
      )}

      {/* Agenda items */}
      {f.agendaItems.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl">
          <p className="text-slate-400 font-medium mb-2">No agenda items yet</p>
          <p className="text-sm text-slate-400">Click "+ Add Agenda Item" above to start</p>
        </div>
      ) : (
        <div className="space-y-3">
          {f.agendaItems.map((item, i) => (
            <AgendaCard key={item.id} item={item} index={i} total={f.agendaItems.length}
              onMove={dir => moveAgenda(i, dir)}
              onRemove={() => removeAgenda(i)}
              onChange={updated => updateAgendaItem(i, updated)}
            />
          ))}
        </div>
      )}
    </div>
  );

  /* ════════════════════════════════════════════
     STEP 5 — PREVIEW
  ════════════════════════════════════════════ */
  const s5 = (
    <div className="space-y-4">
      <SHead n={5} title="Preview & Print" sub="Review and generate your board meeting minutes" />

      {/* Letterhead toggle */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
        <button type="button" onClick={() => set("printOnLetterhead", !f.printOnLetterhead)}
          className={`flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-xl border-2 transition-all text-sm font-medium ${
            f.printOnLetterhead ? "border-blue-500 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600"
          }`}>
          <span className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
            f.printOnLetterhead ? "bg-blue-600 border-blue-600" : "border-slate-300"
          }`}>
            {f.printOnLetterhead && <svg className="w-3 h-3 text-white" viewBox="0 0 10 8" fill="none">
              <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>}
          </span>
          <span>🏢 Print on Company Letterhead</span>
          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold ${
            f.printOnLetterhead ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
          }`}>{f.printOnLetterhead ? "ON" : "OFF"}</span>
        </button>
        {f.printOnLetterhead && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Lbl c="Mobile" /><input className={INP} value={f.printMobile} onChange={e => set("printMobile", e.target.value)} placeholder="+91 98765 43210" /></div>
            <div><Lbl c="Email" /><input className={INP} value={f.printEmail} onChange={e => set("printEmail", e.target.value)} placeholder="info@company.com" /></div>
          </div>
        )}
      </div>

      {/* Summary card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <p className="font-bold text-slate-700 text-sm uppercase tracking-wide">Meeting Summary</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Company", value: f.companyName || "—" },
            { label: "Meeting No.", value: f.meetingSerial || "—" },
            { label: "Date", value: fmtDate(f.meetingDate) || "—" },
            { label: "Directors Present", value: `${presentCount}/${totalDirs}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-slate-400 font-medium">{label}</p>
              <p className="font-bold text-slate-800 text-sm truncate mt-0.5">{value}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 text-sm pt-1">
          <span className="flex items-center gap-1.5">
            <span className="text-blue-500 font-bold">📋</span>
            <span className="text-slate-600">{f.agendaItems.length} Agenda Items</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1.5">
            <span className="text-green-500 font-bold">✅</span>
            <span className="text-slate-600">{resolutionCount} Resolution{resolutionCount !== 1 ? "s" : ""}</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className={`flex items-center gap-1.5 font-semibold ${quorumMet ? "text-green-600" : "text-red-500"}`}>
            {quorumMet ? "✓ Quorum Met" : "✗ Quorum Issue"}
          </span>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
        <strong>Before printing:</strong> Verify all details — Director DINs, resolution text, dates. Minutes must be signed by the Chairman within 30 days. Consult a qualified CS for compliance review.
      </div>
    </div>
  );

  const stepContent: Record<number, React.ReactNode> = { 1: s1, 2: s2, 3: s3, 4: s4, 5: s5 };

  /* ══════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════ */
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero */}
      {step === 1 && (
        <section className="border-b border-slate-100 overflow-hidden relative"
          style={{ background: "linear-gradient(160deg,#eff6ff 0%,#f5f3ff 50%,#fafafa 100%)" }}>
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none opacity-20"
            style={{ background: "radial-gradient(circle,#bfdbfe,transparent 70%)", transform: "translate(30%,-30%)" }} />
          <div className="max-w-4xl mx-auto px-4 py-10 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full border mb-4"
                  style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1e40af" }}>
                  📋 Legal Document Generator
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">
                  Board Meeting{" "}
                  <span style={{ background: "linear-gradient(90deg,#1d4ed8,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    Minutes
                  </span>
                </h1>
                <p className="text-xs font-bold text-blue-700 bg-blue-100 border border-blue-200 px-3 py-1 rounded-full w-fit mb-3">
                  Secretarial Standard-1 (SS-1) Compliant
                </p>
                <p className="text-slate-500 text-sm max-w-md">
                  Auto-fill from MCA Excel · Pre-built resolution templates · Quorum check · Chairman signature block
                </p>
              </div>
              <div className="w-full max-w-xs bg-white rounded-2xl shadow-xl border border-slate-200 p-5 rotate-1 hover:rotate-0 transition-transform">
                <div className="text-center border-b border-slate-100 pb-2 mb-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Board Meeting Minutes</p>
                  <p className="text-xs text-slate-400">Meeting No. 5/2025-26</p>
                </div>
                <div className="space-y-1.5 text-xs">
                  <p className="flex justify-between"><span className="text-slate-400">Date:</span><span className="font-medium">05 June 2025</span></p>
                  <p className="flex justify-between"><span className="text-slate-400">Directors:</span><span className="font-medium text-green-600">3/4 Present ✓</span></p>
                  <p className="flex justify-between"><span className="text-slate-400">Quorum:</span><span className="font-medium text-green-600">Met ✓</span></p>
                  <div className="border-t pt-1.5 mt-1.5">
                    <p className="text-slate-400 mb-1">Resolutions:</p>
                    <p className="text-blue-600">• Bank Account Opening</p>
                    <p className="text-blue-600">• Appointment of Director</p>
                  </div>
                </div>
                <div className="absolute top-3 right-3 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">FREE</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Form */}
      <div className="max-w-3xl mx-auto w-full px-4 py-8 flex-1">

        {/* Progress */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-slate-700">
              Step {step} of 5 — {STEPS[step - 1]}
            </p>
            <p className="text-xs text-slate-400">{Math.round((step / 5) * 100)}% complete</p>
          </div>
          <div className="flex items-center gap-1 mb-1">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`h-2 flex-1 rounded-full transition-all ${
                  i < step - 1 ? "bg-blue-500" : i === step - 1 ? "bg-blue-400" : "bg-slate-200"
                }`} />
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            {STEPS.map((s, i) => (
              <span key={s} className={`text-xs hidden sm:block ${i === step - 1 ? "text-blue-600 font-semibold" : "text-slate-300"}`}>
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="mb-6">{stepContent[step]}</div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button onClick={() => setStep(s => Math.max(s - 1, 1) as typeof step)}
            disabled={step === 1}
            className="px-6 py-3 rounded-xl font-bold text-slate-600 border-2 border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50 transition">
            ← Back
          </button>
          {step < 5 ? (
            <button onClick={() => setStep(s => Math.min(s + 1, 5) as typeof step)}
              disabled={!canNext()}
              className="px-8 py-3 rounded-xl font-bold text-white text-sm transition hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg,#1d4ed8,#7c3aed)" }}>
              Continue →
            </button>
          ) : (
            <button onClick={openPrint}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white text-sm transition hover:scale-105 shadow-lg"
              style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
              🖨️ Print / Download PDF →
            </button>
          )}
        </div>
      </div>

      <footer className="border-t border-slate-200 py-5 px-4 mt-auto">
        <div className="max-w-3xl mx-auto text-center text-sm text-slate-400">
          <Link href="/tools/documents/minutes" className="text-blue-500 hover:underline text-xs">← Meeting Types</Link>
          {" · "}
          © {new Date().getFullYear()} ComplianceSearch.in
        </div>
      </footer>
    </main>
  );
}
