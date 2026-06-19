"use client";
import { useState, useMemo, useCallback, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { injectPreviewWatermark } from "@/lib/preview-protection";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import CompanyExcelUpload from "@/components/CompanyExcelUpload";
import CompanySearch from "@/components/CompanySearch";
import type { CompanyData } from "@/lib/types/company";
import { ALL_AGENDA_TEMPLATES, CATEGORY_ORDER as AGENDA_CATEGORY_ORDER, CATEGORY_META as AGENDA_CATEGORY_META, fillTemplate } from "@/lib/agenda-templates";
import type { AgendaTemplate } from "@/lib/agenda-templates";
import { ALL_MASTER_RESOLUTIONS, MASTER_CATEGORY_META } from "@/lib/master-resolutions";
import { generateCtcDocument, type CtcParams } from "@/lib/ctc-generator";

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
  incorporationDate?: string;  // for first-meeting detection
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
  ctcSignatories: Array<{ name: string; designation: string; din: string }>;
}

// Routine items pre-selected by default (in meeting order)
const DEFAULT_ROUTINE_IDS = [
  "elect_chairman",
  "ascertain_quorum",
  "leave_of_absence",
  "note_attendance",
  "prev_minutes",
  "action_taken_report",
  "disclosure_interest",
];

function makeDefaultAgendaItems(): AgendaItemData[] {
  return DEFAULT_ROUTINE_IDS
    .map(id => {
      const template = ALL_AGENDA_TEMPLATES.find(t => t.id === id);
      if (!template) return null;
      const fields: Record<string, string> = {};
      template.fields.forEach(f => { fields[f.key] = ""; });
      return {
        id: `${id}-default`,
        templateId: id,
        title: template.title,
        discussion: template.discussion,
        resolution: template.resolution,
        resolutionType: template.resolutionType,
        fields,
      } as AgendaItemData;
    })
    .filter(Boolean) as AgendaItemData[];
}

const DEFAULT: F = {
  companyName: "", cin: "", regAddress: "", entityType: "pvt_ltd",
  meetingSerial: "", financialYear: "", meetingDate: "", meetingTime: "",
  closingTime: "", venue: "", chairmanName: "", chairmanDin: "", chairmanDesig: "Director",
  prevMeetingDate: "",
  directors: [], invitees: [],
  agendaItems: makeDefaultAgendaItems(),
  printOnLetterhead: true, printMobile: "", printEmail: "",
  ctcSignatories: [{ name: "", designation: "Director", din: "" }, { name: "", designation: "Director", din: "" }],
};

const ENTITY_LABELS: Record<string, string> = {
  pvt_ltd: "Private Limited Company", opc: "One Person Company",
  public_ltd: "Public Limited Company", llp: "Limited Liability Partnership",
  section8: "Section 8 Company", nidhi: "Nidhi Company", other: "Company",
};


/* ══════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════ */
function fmtDate(d: string): string {
  if (!d) return "__________";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  } catch { return d; }
}

function fmtTime(t: string): string {
  if (!t) return "___";
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || "0", 10);
  if (isNaN(h)) return t;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function quorumRequired(totalDirs: number, entityType: string): number {
  if (entityType === "opc") return 1;
  if (entityType === "public_ltd") return Math.max(3, Math.ceil(totalDirs / 3));
  return Math.max(2, Math.ceil(totalDirs / 3));
}

// ── DIN / PAN Validation ────────────────────────────────────────
function isDinValid(din: string): boolean {
  const d = din.trim();
  if (!d) return true; // empty is ok (warn separately)
  return /^\d{8}$/.test(d) || /^[A-Z]{5}\d{4}[A-Z]$/.test(d); // DIN=8 digits, PAN=AAAAA9999A
}

// ── Draft localStorage key ──────────────────────────────────────
// Future: gate this behind login/paid subscription
const DRAFT_KEY = "csi_bm_draft_v2";

// ── Resolution Law Reference Map ────────────────────────────────
// Law-mandated resolution type for each agenda template.
// "ordinary" = Ordinary Board Resolution | "special" = Special Resolution
const RESOLUTION_LAW: Record<string, { type: "ordinary" | "special"; ref: string }> = {
  // ── Financial & Banking ──
  bank_account:             { type: "ordinary", ref: "Sec. 179(3)(d) CA 2013" },
  change_signatory:         { type: "ordinary", ref: "Sec. 179(3)(d) CA 2013" },
  banking_limits:           { type: "ordinary", ref: "Sec. 179(3)(d) CA 2013" },
  loan_sanction:            { type: "ordinary", ref: "Sec. 179(3)(d) CA 2013" },
  loan_documents:           { type: "ordinary", ref: "Ordinary Board Resolution" },
  charge_creation:          { type: "ordinary", ref: "Sec. 77/79/82 CA 2013" },
  corporate_guarantee:      { type: "ordinary", ref: "Sec. 185/186 CA 2013" },
  fund_investment:          { type: "ordinary", ref: "Sec. 186 CA 2013" },
  annual_budget:            { type: "ordinary", ref: "Ordinary Board Resolution" },
  annual_accounts:          { type: "ordinary", ref: "Sec. 134 CA 2013" },
  boards_report:            { type: "ordinary", ref: "Sec. 134 CA 2013" },
  rpt_approval:             { type: "ordinary", ref: "Sec. 188 CA 2013" },
  dividend:                 { type: "ordinary", ref: "Sec. 123 CA 2013" },
  // ── Auditor ──
  first_statutory_auditor:  { type: "ordinary", ref: "Sec. 139(6) CA 2013" },
  auditor_appt:             { type: "ordinary", ref: "Sec. 139 CA 2013" },
  auditor_resignation:      { type: "ordinary", ref: "Ordinary Board Resolution" },
  casual_vacancy_auditor:   { type: "ordinary", ref: "Sec. 139(8) CA 2013" },
  internal_auditor:         { type: "ordinary", ref: "Sec. 138 CA 2013" },
  secretarial_auditor:      { type: "ordinary", ref: "Sec. 204 CA 2013" },
  cost_auditor:             { type: "ordinary", ref: "Sec. 148 CA 2013" },
  auditor_remuneration:     { type: "ordinary", ref: "Ordinary Board Resolution" },
  // ── Directors & KMP ──
  appt_addl_director:       { type: "ordinary", ref: "Sec. 161(1) CA 2013" },
  appt_independent_director:{ type: "ordinary", ref: "Sec. 149/150 CA 2013 (2nd term: Special)" },
  appt_nominee_director:    { type: "ordinary", ref: "Sec. 161(3) CA 2013" },
  resign_director:          { type: "ordinary", ref: "Ordinary Board Resolution" },
  regularise_director:      { type: "ordinary", ref: "Sec. 152 CA 2013 (Shareholder level)" },
  appt_md_wrd:              { type: "ordinary", ref: "Sec. 196/197 CA 2013" },
  sitting_fees:             { type: "ordinary", ref: "Sec. 197 CA 2013" },
  // ── Share Capital ──
  share_allotment:          { type: "ordinary", ref: "Sec. 42/62 CA 2013" },
  share_certificate_issue:  { type: "ordinary", ref: "Sec. 56(4) CA 2013" },
  share_transfer:           { type: "ordinary", ref: "Sec. 56 CA 2013" },
  increase_auth_capital:    { type: "ordinary", ref: "Sec. 61 CA 2013 (Shareholder resolution)" },
  rights_issue:             { type: "ordinary", ref: "Sec. 62(1)(a) CA 2013" },
  preferential_allotment:   { type: "ordinary", ref: "Sec. 62(1)(c) — Board: Ordinary | Shareholders: Special Resolution at EGM" },
  // ── General Meeting ──
  fix_agm:                  { type: "ordinary", ref: "Sec. 96/101 CA 2013" },
  approve_agm_notice:       { type: "ordinary", ref: "Sec. 101 CA 2013" },
  fix_egm:                  { type: "ordinary", ref: "Sec. 100 CA 2013" },
  // ── Committees ──
  constitute_audit_committee:{ type: "ordinary", ref: "Sec. 177 CA 2013" },
  constitute_nrc:            { type: "ordinary", ref: "Sec. 178 CA 2013" },
  constitute_csr_committee:  { type: "ordinary", ref: "Sec. 135 CA 2013" },
  // ── Office & Branch ──
  change_reg_office:        { type: "ordinary", ref: "Sec. 12 CA 2013" },
  open_branch:              { type: "ordinary", ref: "Ordinary Board Resolution" },
  office_lease:             { type: "ordinary", ref: "Ordinary Board Resolution" },
  // ── Legal & Compliance ──
  authorise_roc_filings:    { type: "ordinary", ref: "Ordinary Board Resolution" },
  reply_to_notice:          { type: "ordinary", ref: "Ordinary Board Resolution" },
  legal_proceedings:        { type: "ordinary", ref: "Ordinary Board Resolution" },
  trademark:                { type: "ordinary", ref: "Ordinary Board Resolution" },
  // ── CSR ──
  csr_policy:               { type: "ordinary", ref: "Sec. 135 CA 2013" },
  csr_budget:               { type: "ordinary", ref: "Sec. 135 CA 2013" },
  csr_expenditure:          { type: "ordinary", ref: "Sec. 135 CA 2013" },
  csr_report:               { type: "ordinary", ref: "Sec. 135 CA 2013" },
  // ── Secretarial ──
  annual_return:            { type: "ordinary", ref: "Sec. 92 CA 2013" },
  annual_filings_roc:       { type: "ordinary", ref: "Ordinary Board Resolution" },
  // ── Strategic ──
  business_expansion:       { type: "ordinary", ref: "Ordinary Board Resolution" },
  joint_venture:            { type: "ordinary", ref: "Sec. 186 CA 2013" },
  property_purchase_sale:   { type: "ordinary", ref: "Ordinary Board Resolution" },
  merger_amalgamation:      { type: "ordinary", ref: "Sec. 230/232 — Board: Ordinary | Shareholders: Special Resolution at EGM" },
  key_contracts:            { type: "ordinary", ref: "Ordinary Board Resolution" },
};

/* ══════════════════════════════════════════════════════════════════
   PRINT HTML GENERATOR
══════════════════════════════════════════════════════════════════ */
function generateMinutesHTML(f: F): string {
  const presentDirs = f.directors.filter(d => d.isPresent);
  const absentDirs  = f.directors.filter(d => !d.isPresent);
  const entity = ENTITY_LABELS[f.entityType] || "Company";

  // Chairman name personalisation in discussion text
  const chairmanRef = f.chairmanName
    ? `The Chairman, ${f.chairmanName},`
    : "The Chairman";
  function personalize(text: string): string {
    return text.replace(/\bThe Chairman\b/g, chairmanRef);
  }

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
        <p style="font-size:9.5pt;text-align:justify;line-height:1.6;margin-bottom:8px;">${personalize(item.discussion)}</p>
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
    @page { size: A4; margin: 20mm; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Times New Roman", Times, serif; font-size: 10pt; line-height: 1.5;
      color: #000; background: #fff;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    p, td, th, span { overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; }
    @media screen { html { background: #c8c8c8; } body { width: 170mm; margin: 20mm auto; } }
    @media print  { body { width: 170mm; margin: 0 auto; } }
    .center { text-align: center; }
    .upper { text-transform: uppercase; }
    .bold { font-weight: bold; }
    table { width: 100%; border-collapse: collapse; }
    td, th { border: 1px solid #555; padding: 5px 8px; font-size: 9pt; vertical-align: top; }
    th { font-weight: bold; background: #f5f5f5; text-align: left; }
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
    <td>${fmtTime(f.meetingTime)}${f.closingTime ? " to " + fmtTime(f.closingTime) : ""}</td>
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
  the meeting concluded at ${fmtTime(f.closingTime) || "___"}.
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
   GENERATE BOARD MEETING CTC HTML — delegates to shared generator
══════════════════════════════════════════════════════════════════ */
function generateBoardCtcHTML(f: F): string {
  const resolutionItems = f.agendaItems.filter(
    item => item.resolutionType !== "none" && item.resolution && item.resolution.trim()
  );
  if (resolutionItems.length === 0) return "";

  const total    = resolutionItems.length;
  const fy       = f.financialYear || new Date().getFullYear().toString();
  const activeSigs = f.ctcSignatories.filter(s => s.name.trim()).length > 0
    ? f.ctcSignatories.filter(s => s.name.trim())
    : [{ name: f.chairmanName || "", designation: f.chairmanDesig || "Director", din: f.chairmanDin || "" }];

  const pages: CtcParams[] = resolutionItems.map((item, i) => ({
    company: {
      companyName: f.companyName,
      cin:         f.cin,
      regAddress:  f.regAddress,
      email:       f.printEmail,
      mobile:      f.printMobile,
    },
    meeting: {
      meetingType:      "board",
      meetingTypeLabel: "Board Meeting",
      meetingSerial:    f.meetingSerial,
      meetingDate:      f.meetingDate,
      meetingTime:      f.meetingTime,
      venue:            f.venue,
      financialYear:    fy,
    },
    resolution: {
      title:     item.title,
      text:      item.resolution,
      type:      item.resolutionType === "special" ? "special" : item.resolutionType === "none" ? "none" : "ordinary",
      number:    `${i + 1}/${f.meetingSerial || "BM"}/${fy}`,
    },
    ctcIndex:         i + 1,
    ctcTotal:         total,
    signatories:      activeSigs,
    printOnLetterhead: true,
    isDirectCTC:      false,
  }));

  return generateCtcDocument(pages);
}

function generateBoardAllHTML(f: F): string {
  const minutesHtml = generateMinutesHTML(f);
  const resolutionItems = f.agendaItems.filter(
    item => item.resolutionType !== "none" && item.resolution && item.resolution.trim()
  );
  if (resolutionItems.length === 0) return minutesHtml;
  const ctcBody    = generateBoardCtcHTML(f);
  const ctcContent = ctcBody.replace(/^[\s\S]*<body>/, "").replace(/<\/body>[\s\S]*$/, "");
  return minutesHtml.replace(/<\/body>\s*<\/html>/i, `${ctcContent}</body></html>`);
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
  contextWarning, resolutionNumber, meetingSerial, financialYear,
}: {
  item: AgendaItemData; index: number; total: number;
  onMove: (dir: "up" | "down") => void;
  onRemove: () => void;
  onChange: (updated: AgendaItemData) => void;
  contextWarning?: string;
  resolutionNumber?: number;
  meetingSerial?: string;
  financialYear?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const template = ALL_AGENDA_TEMPLATES.find(t => t.id === item.templateId);

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

  const isMandatory = [
    "elect_chairman", "ascertain_quorum", "leave_of_absence", "note_attendance",
    "prev_minutes", "action_taken_report", "disclosure_interest",
    "any_other_business", "vote_of_thanks",
  ].includes(item.templateId);

  const hasRes = item.resolutionType !== "none" && !!item.resolution;

  return (
    <div className={`border-2 rounded-2xl overflow-hidden transition-all ${expanded ? "border-blue-300 shadow-md" : contextWarning ? "border-amber-300" : "border-slate-200"}`}>
      {/* Conditional warning banner */}
      {contextWarning && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 border-b border-amber-200">
          <span className="text-xs">⚠️</span>
          <p className="text-xs text-amber-700 font-medium">{contextWarning}</p>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white">
        <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm truncate">{item.title}</p>
          {hasRes && (
            <p className="text-xs font-medium flex items-center gap-1.5">
              <span className={`px-1.5 py-0.5 rounded text-white text-xs font-bold ${item.resolutionType === "special" ? "bg-red-500" : "bg-blue-500"}`}>
                {resolutionNumber ? `Res ${resolutionNumber}` : "Res"}
                {meetingSerial ? `/${meetingSerial}` : ""}
                {financialYear ? `/${financialYear}` : ""}
              </span>
              <span className={item.resolutionType === "special" ? "text-red-500" : "text-blue-500"}>
                {item.resolutionType === "special" ? "Special Resolution" : "Ordinary Resolution"}
              </span>
            </p>
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
              {/* Resolution type selector with law reference */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1.5">
                  <Lbl c={<span>Resolution Text <span className="text-xs font-normal text-slate-400">(editable)</span></span>} />
                  <div className="flex items-center gap-2">
                    <select className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
                      value={item.resolutionType}
                      onChange={e => onChange({ ...item, resolutionType: e.target.value as "ordinary" | "special" })}>
                      <option value="ordinary">Ordinary Resolution</option>
                      <option value="special">Special Resolution</option>
                    </select>
                  </div>
                </div>

                {/* Law reference badge */}
                {RESOLUTION_LAW[item.templateId] && (() => {
                  const law = RESOLUTION_LAW[item.templateId];
                  const isChanged = item.resolutionType !== law.type;
                  return (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
                      isChanged
                        ? "bg-orange-50 border border-orange-200"
                        : law.type === "special"
                        ? "bg-red-50 border border-red-200"
                        : "bg-blue-50 border border-blue-100"
                    }`}>
                      <span>⚖️</span>
                      <span className={`font-semibold ${
                        isChanged ? "text-orange-700" :
                        law.type === "special" ? "text-red-700" : "text-blue-700"
                      }`}>
                        Law: {law.type === "special" ? "Special Resolution" : "Ordinary Resolution"}
                      </span>
                      <span className={`${isChanged ? "text-orange-500" : "text-slate-400"}`}>
                        — {law.ref}
                      </span>
                      {isChanged && (
                        <button
                          type="button"
                          onClick={() => onChange({ ...item, resolutionType: law.type })}
                          className="ml-auto text-orange-600 hover:text-orange-800 font-bold underline shrink-0"
                        >
                          ↺ Reset to {law.type === "special" ? "Special" : "Ordinary"}
                        </button>
                      )}
                    </div>
                  );
                })()}
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

/* ── Restore helper — isolated so useSearchParams can be Suspense-wrapped ── */
function RestoreDocWatcher({ onRestore, onPrevDate, onDocId }: {
  onRestore: (data: F) => void;
  onPrevDate: (date: string) => void;
  onDocId: (id: string) => void;
}) {
  const searchParams = useSearchParams();
  useEffect(() => {
    // Restore saved document
    if (searchParams.get('restore') === '1') {
      const saved = sessionStorage.getItem('csi_restore_doc');
      const docId = sessionStorage.getItem('csi_restore_doc_id');
      if (saved) {
        try {
          const data = JSON.parse(saved) as F;
          onRestore(data);
          sessionStorage.removeItem('csi_restore_doc');
        } catch {}
      }
      if (docId) {
        onDocId(docId);
        sessionStorage.removeItem('csi_restore_doc_id');
      }
    }
    // Auto-fill previous board meeting date from client timeline
    const prevDate = searchParams.get('prevDate');
    if (prevDate) onPrevDate(prevDate);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════ */
export default function BoardMinutesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  // ── LocalStorage draft save/resume ─────────────────────────────
  // Future: restrict to logged-in / paid users only
  const [f, setF] = useState<F>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) return JSON.parse(saved) as F;
      } catch {}
    }
    return { ...DEFAULT, agendaItems: makeDefaultAgendaItems() };
  });

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateTab, setTemplateTab] = useState<"standard" | "resolution">("standard");
  const [draftSaved, setDraftSaved] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  // If re-opened from dashboard, track the existing doc ID to update instead of create
  const [existingDocId, setExistingDocId] = useState<string | null>(null);

  // ── First Meeting & Duplicate Date detection ──
  const [firstMeetingBannerDismissed, setFirstMeetingBannerDismissed] = useState(false);
  const [firstMeetingItemsAdded, setFirstMeetingItemsAdded] = useState(false);
  const [dupMeeting, setDupMeeting] = useState<{ id: string; title: string } | null>(null);
  const [dupChecked, setDupChecked] = useState('');   // last checked date
  const [dupDismissed, setDupDismissed] = useState(false);

  // Auto-save draft on every change
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(f));
      setDraftSaved(true);
      const t = setTimeout(() => setDraftSaved(false), 1500);
      return () => clearTimeout(t);
    } catch {}
  }, [f]);

  async function saveDocument() {
    if (!session) { router.push('/auth/login'); return; }
    setSaveStatus('saving');
    try {
      const docPayload = {
        type: 'board_minutes',
        title: `Board Meeting Minutes — ${f.companyName || 'Company'} — ${f.meetingDate || ''}`,
        companyName: f.companyName || null,
        financialYear: f.financialYear || null,
        meetingDate: f.meetingDate || null,
        formDataJson: JSON.stringify(f),
      };

      let res: Response;
      if (existingDocId) {
        // UPDATE existing document — no duplicate
        res = await fetch(`/api/documents/${existingDocId}/full`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(docPayload),
        });
      } else {
        // CREATE new document
        res = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(docPayload),
        });
      }

      if (res.ok) { setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 3000); }
      else setSaveStatus('error');
    } catch { setSaveStatus('error'); }
  }

  function clearDraft() {
    if (!confirm("Naya form shuru karein? Abhi ka draft delete ho jayega.")) return;
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setF({ ...DEFAULT, agendaItems: makeDefaultAgendaItems() });
    setStep(1);
  }

  const set = useCallback(<K extends keyof F>(k: K, v: F[K]) =>
    setF(p => ({ ...p, [k]: v })), []);

  /* ── First Meeting Detection ── */
  const isFirstMeetingByDate = useMemo(() => {
    if (!f.meetingDate || !f.incorporationDate) return false;
    // Parse incorporation date (can be DD/MM/YYYY or YYYY-MM-DD)
    let incDate: Date;
    if (f.incorporationDate.includes('/')) {
      const [d, m, y] = f.incorporationDate.split('/');
      incDate = new Date(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`);
    } else {
      incDate = new Date(f.incorporationDate);
    }
    const meetDate = new Date(f.meetingDate);
    const diffDays = Math.floor((meetDate.getTime() - incDate.getTime()) / 86400000);
    return diffDays >= 0 && diffDays <= 35;
  }, [f.meetingDate, f.incorporationDate]);

  // Auto-add first meeting agenda items once
  useEffect(() => {
    if (!isFirstMeetingByDate || firstMeetingItemsAdded) return;
    const FIRST_MEETING_IDS = [
      'note_incorporation', 'note_moa_aoa', 'appoint_first_auditor',
      'fix_registered_office', 'open_bank_account', 'note_share_subscription',
      'authorize_inc20a', 'fix_financial_year', 'adopt_common_seal',
    ];
    const alreadyAdded = new Set(f.agendaItems.map(a => a.templateId));
    const toAdd = FIRST_MEETING_IDS.filter(id => !alreadyAdded.has(id));
    if (toAdd.length === 0) { setFirstMeetingItemsAdded(true); return; }

    // Insert before closing items
    const closingIds = new Set(['any_other_business', 'vote_of_thanks', 'close_meeting']);
    const closingIdx = f.agendaItems.findIndex(a => closingIds.has(a.templateId ?? ''));
    const newItems = toAdd.map(id => {
      const t = ALL_AGENDA_TEMPLATES.find(x => x.id === id)!;
      const fields: Record<string, string> = {};
      t.fields.forEach(field => { fields[field.key] = ''; });
      // Pre-fill known fields from company data
      if (fields.cin !== undefined)               fields.cin = f.cin || '';
      if (fields.incorporationDate !== undefined) fields.incorporationDate = f.incorporationDate || '';
      if (fields.regAddress !== undefined)        fields.regAddress = f.regAddress || '';
      return {
        id: `${id}-first-${Date.now()}-${Math.random()}`,
        templateId: id,
        title: t.title,
        discussion: t.discussion,
        resolution: t.resolution,
        resolutionType: t.resolutionType,
        fields,
      };
    });
    const updated = [...f.agendaItems];
    if (closingIdx >= 0) { updated.splice(closingIdx, 0, ...newItems); }
    else                 { updated.push(...newItems); }
    set('agendaItems', updated);
    setFirstMeetingItemsAdded(true);
  }, [isFirstMeetingByDate, firstMeetingItemsAdded, f.agendaItems, f.cin, f.incorporationDate, f.regAddress, set]);

  /* ── Duplicate Date Check (on Step 2 date change) ── */
  useEffect(() => {
    if (!f.meetingDate || !f.cin || f.meetingDate === dupChecked) return;
    if (existingDocId) return;   // editing existing — no dup check needed
    setDupChecked(f.meetingDate);
    setDupDismissed(false);
    // Resolve companyId via CIN search, then check for duplicate meeting
    fetch(`/api/companies/search?q=${encodeURIComponent(f.cin)}&limit=1`)
      .then(r => r.json())
      .then((d: { companies?: Array<{ id: string }> }) => {
        const companyId = d.companies?.[0]?.id;
        if (!companyId) return;
        return fetch(`/api/board-resolutions?companyId=${companyId}&date=${f.meetingDate}`)
          .then(r => r.json())
          .then((bd: { exactMatch: { id: string; title: string } | null }) => {
            setDupMeeting(bd.exactMatch ?? null);
          });
      })
      .catch(() => {});
  }, [f.meetingDate, f.cin, dupChecked, existingDocId]);

  /* ── Company fill ── */
  function applyCompany(data: CompanyData) {
    const dirs: Director[] = data.directors
      .filter(d => d.isActive)
      .map(d => ({ name: d.name, designation: d.designation || "Director", din: d.din || "", isPresent: true, leaveGranted: false }));

    // Auto-select chairman: prefer MD → WTD → first director
    const mdPriority = ["managing director", "whole-time director", "executive director", "chairman"];
    const autoChairman = dirs.find(d => mdPriority.some(p => d.designation.toLowerCase().includes(p))) || dirs[0];

    setF(p => ({
      ...p,
      ...(data.companyName        && { companyName:       data.companyName }),
      ...(data.cin                && { cin:               data.cin }),
      ...(data.regAddress         && { regAddress:        data.regAddress }),
      ...(data.entityType         && { entityType:        data.entityType }),
      ...(data.incorporationDate  && { incorporationDate: data.incorporationDate }),
      directors: dirs.length > 0 ? dirs : p.directors,
      // Auto-fill chairman only if not already set
      ...(autoChairman && !p.chairmanName && {
        chairmanName:  autoChairman.name,
        chairmanDin:   autoChairman.din,
        chairmanDesig: autoChairman.designation,
      }),
      ctcSignatories: dirs.slice(0, 4).map(d => ({ name: d.name, designation: d.designation, din: d.din })),
    }));
    // Store cin for duplicate-date API check (companyId resolved server-side via cin)
    if (data.cin && typeof window !== 'undefined') {
      try { sessionStorage.setItem('boardMinutesCompany', JSON.stringify({ cin: data.cin })); } catch {}
    }
    // Reset first-meeting items added flag so new detection can run
    setFirstMeetingItemsAdded(false);
    setDupChecked('');
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
  function addAgendaItem(templateId: string, fromLibrary = false) {
    let newItem: AgendaItemData;

    if (fromLibrary) {
      // From master-resolutions
      const res = ALL_MASTER_RESOLUTIONS.find(r => r.id === templateId);
      if (!res) return;
      const fields: Record<string, string> = {};
      res.fields.forEach(f => { fields[f.key] = ""; });
      newItem = {
        id: `mr-${templateId}-${Date.now()}`,
        templateId,
        title: res.agendaTitle || res.title,
        discussion: res.discussion,
        resolution: res.resolution,
        resolutionType: res.kind === "special" ? "special" : res.kind === "none" ? "none" : "ordinary",
        fields,
      };
    } else {
      // From original agenda-templates
      const template = ALL_AGENDA_TEMPLATES.find(t => t.id === templateId);
      if (!template) return;
      const fields: Record<string, string> = {};
      template.fields.forEach(f => { fields[f.key] = ""; });
      newItem = {
        id: `${templateId}-${Date.now()}`,
        templateId,
        title: template.title,
        discussion: template.discussion,
        resolution: template.resolution,
        resolutionType: template.resolutionType,
        fields,
      };
    }

    // AOB always last — insert before it if it exists
    const aobIdx = f.agendaItems.findIndex(a => a.templateId === "any_other_business" || a.templateId === "vote_of_thanks");
    if (aobIdx >= 0 && !["any_other_business", "vote_of_thanks"].includes(templateId)) {
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
  const indepDirCount = f.directors.filter(d =>
    d.isPresent && d.designation.toLowerCase().includes("independent")
  ).length;

  /* ── Conditional Agenda Logic ── */
  const isFirstMeeting = useMemo(() => {
    const s = f.meetingSerial.trim();
    if (!s) return false;
    return (parseInt(s.split("/")[0]) || 0) === 1;
  }, [f.meetingSerial]);

  const allDirectorsPresent = totalDirs > 0 && f.directors.every(d => d.isPresent);

  function getAgendaWarning(templateId: string): string | undefined {
    if (templateId === "leave_of_absence" && allDirectorsPresent && totalDirs > 0)
      return "Sabhi directors present hain — ye item is meeting mein needed nahi";
    if (templateId === "action_taken_report" && isFirstMeeting)
      return "Pehli meeting hai — koi previous decisions nahi hain; ye item skip kar sakte hain";
    if (templateId === "prev_minutes" && isFirstMeeting)
      return "Pehli meeting hai — koi previous minutes nahi hain; ye item skip kar sakte hain";
    return undefined;
  }

  /* ── Resolution numbering per agenda item ── */
  const resolutionCount = useMemo(() =>
    f.agendaItems.filter(a => a.resolution && a.resolutionType !== "none").length,
  [f.agendaItems]);

  const ctcCount = f.agendaItems.filter(
    item => item.resolutionType !== "none" && item.resolution && item.resolution.trim()
  ).length;

  const resolutionMap = useMemo(() => {
    const map: Record<string, number> = {};
    let cnt = 0;
    f.agendaItems.forEach(a => {
      if (a.resolution && a.resolutionType !== "none") map[a.id] = ++cnt;
    });
    return map;
  }, [f.agendaItems]);

  /* ── Filing Reminders from agenda ── */
  const filingReminders = useMemo(() => {
    const ids = new Set(f.agendaItems.map(a => a.templateId));
    const r: { icon: string; form: string; desc: string; days: string }[] = [];
    if (ids.has("first_statutory_auditor") || ids.has("auditor_appt"))
      r.push({ icon: "🔍", form: "ADT-1", desc: "Statutory Auditor appointment", days: "30 days" });
    if (ids.has("appt_addl_director") || ids.has("appt_independent_director") || ids.has("appt_nominee_director") || ids.has("appt_md_wrd"))
      r.push({ icon: "👤", form: "DIR-12", desc: "Director/KMP appointment/change", days: "30 days" });
    if (ids.has("resign_director"))
      r.push({ icon: "🚪", form: "DIR-12", desc: "Director resignation", days: "30 days" });
    if (ids.has("charge_creation"))
      r.push({ icon: "⚖️", form: "CHG-1", desc: "Charge creation/modification", days: "30 days" });
    if (ids.has("annual_accounts"))
      r.push({ icon: "📊", form: "AOC-4", desc: "Financial Statements filing", days: "30 days after AGM" });
    if (ids.has("annual_return"))
      r.push({ icon: "📗", form: "MGT-7", desc: "Annual Return filing", days: "60 days after AGM" });
    if (ids.has("share_allotment"))
      r.push({ icon: "📜", form: "PAS-3", desc: "Share allotment return", days: "15 days" });
    if (ids.has("change_reg_office"))
      r.push({ icon: "🏢", form: "INC-22", desc: "Registered office change", days: "30 days" });
    return r;
  }, [f.agendaItems]);

  /* ── SS-1 Compliance Checklist ── */
  const ss1Checklist = useMemo(() => {
    type Status = "ok" | "fail" | "warn" | "manual";
    const items: { label: string; status: Status; hint: string }[] = [];

    // 1. Notice 7 days
    items.push({
      label: "Board Meeting Notice ≥ 7 days in advance (SS-1 § 3.1)",
      status: "manual",
      hint: "Confirm karo ki sabhi directors ko 7 din pehle notice mila tha",
    });

    // 2. Quorum
    items.push({
      label: "Quorum at commencement of meeting (Companies Act § 174)",
      status: quorumMet ? "ok" : "fail",
      hint: quorumMet
        ? `${presentCount}/${totalDirs} directors present — quorum satisfied`
        : `${presentCount} present, ${qRequired} required — quorum NOT met`,
    });

    // 3. Agenda circulated
    items.push({
      label: "Agenda circulated with Notice (SS-1 § 3.1)",
      status: f.agendaItems.length > 0 ? "ok" : "warn",
      hint: f.agendaItems.length > 0 ? `${f.agendaItems.length} agenda items added` : "Step 4 mein agenda items add karo",
    });

    // 4. Minutes signing deadline (30 days)
    const meetD = f.meetingDate ? new Date(f.meetingDate) : null;
    const deadline = meetD ? new Date(meetD.getTime() + 30 * 86400000) : null;
    const today = new Date();
    const daysLeft = deadline ? Math.ceil((deadline.getTime() - today.getTime()) / 86400000) : null;
    items.push({
      label: "Minutes to be signed within 30 days of meeting (SS-1 § 7.1)",
      status: !deadline ? "manual" : daysLeft! < 0 ? "fail" : daysLeft! <= 5 ? "warn" : "ok",
      hint: !deadline
        ? "Meeting date select karo (Step 2)"
        : daysLeft! < 0
        ? `Deadline nikal gayi! (${Math.abs(daysLeft!)} days overdue)`
        : `Sign by: ${deadline.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} — ${daysLeft} days remaining`,
    });

    // 5. Chairman details
    items.push({
      label: "Chairman name & DIN recorded (SS-1 § 2.1)",
      status: f.chairmanName && f.chairmanDin ? "ok" : "warn",
      hint: !f.chairmanName ? "Step 2 mein Chairman ka naam fill karo" : !f.chairmanDin ? "Chairman ka DIN add karo" : `${f.chairmanName} (DIN: ${f.chairmanDin})`,
    });

    // 6. All DINs
    const missDin = f.directors.filter(d => d.isPresent && !d.din.trim()).length;
    items.push({
      label: "All present Directors' DINs recorded",
      status: f.directors.length === 0 ? "manual" : missDin > 0 ? "warn" : "ok",
      hint: missDin > 0 ? `${missDin} director(s) ka DIN missing — Step 3 mein fill karo` : "Sab DINs filled hain ✓",
    });

    // 7. DIN validity
    const invalidDin = f.directors.filter(d => d.din && !isDinValid(d.din)).length;
    items.push({
      label: "All DINs are 8-digit valid numbers",
      status: invalidDin > 0 ? "fail" : f.directors.length === 0 ? "manual" : "ok",
      hint: invalidDin > 0 ? `${invalidDin} director(s) ka DIN invalid format mein hai` : "Sab DINs valid format mein hain",
    });

    // 8. Venue
    items.push({
      label: "Venue / Place of Meeting recorded (SS-1 § 1.2)",
      status: f.venue ? "ok" : "warn",
      hint: f.venue ? f.venue.slice(0, 60) : "Step 2 mein venue fill karo",
    });

    return items;
  }, [quorumMet, presentCount, totalDirs, qRequired, f.agendaItems, f.meetingDate, f.chairmanName, f.chairmanDin, f.directors, f.venue]);

  /* ── canNext ── */
  function canNext(): boolean {
    if (step === 1) return !!f.companyName && !!f.cin;
    if (step === 2) return !!f.meetingDate && !!f.meetingSerial && !!f.venue;
    if (step === 3) return presentCount >= 1 && quorumMet; // quorum required to proceed
    if (step === 4) return f.agendaItems.length > 0;
    return true;
  }

  /* ── Print helpers ── */
  function openPrintWindow(html: string) {
    const src = session ? html : injectPreviewWatermark(html);
    const url = URL.createObjectURL(new Blob([src], { type: "text/html;charset=utf-8" }));
    const win = window.open(url, "_blank");
    if (!win) { alert("Pop-up blocked! Please allow pop-ups."); URL.revokeObjectURL(url); return; }
    if (session) { win.addEventListener("load", () => { win.focus(); win.print(); }); }
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
  }
  function openPrint()    { openPrintWindow(generateMinutesHTML(f)); }
  function openPrintCtc() { openPrintWindow(generateBoardCtcHTML(f)); }
  function openPrintAll() { openPrintWindow(generateBoardAllHTML(f)); }

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
        <div className="sm:col-span-2">
          <Lbl c="Date of Meeting *" />
          <input type="date" className={INP} value={f.meetingDate}
            onChange={e => {
              set("meetingDate", e.target.value);
              if (!f.financialYear) set("financialYear", autoFY(e.target.value));
            }} />

          {/* ── First Meeting Banner ── */}
          {isFirstMeetingByDate && !firstMeetingBannerDismissed && (
            <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-emerald-700">🎉 Pehli Board Meeting detect hui!</p>
                  <p className="text-emerald-600 text-xs mt-0.5">
                    Incorporation: <strong>{f.incorporationDate}</strong> — Meeting date is within 30 days ✅
                  </p>
                  {firstMeetingItemsAdded ? (
                    <p className="text-xs text-emerald-700 font-semibold mt-1">
                      ✅ {`9 special agenda items auto-add ho gaye hain (Auditor, Bank Account, INC-20A, etc.)`}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 font-semibold mt-1">
                      ⏳ First meeting agenda items add ho rahe hain…
                    </p>
                  )}
                </div>
                <button onClick={() => setFirstMeetingBannerDismissed(true)}
                  className="text-emerald-400 hover:text-emerald-600 text-lg leading-none flex-shrink-0">✕</button>
              </div>
            </div>
          )}

          {/* ── Duplicate Date Warning ── */}
          {dupMeeting && !dupDismissed && !existingDocId && (
            <div className="mt-2 bg-amber-50 border border-amber-300 rounded-xl p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-bold text-amber-700">⚠️ Is date pe already ek meeting hai!</p>
                  <p className="text-amber-600 text-xs mt-0.5 font-medium">{dupMeeting.title}</p>
                  <p className="text-slate-600 text-xs mt-1">
                    Agar aapko naya agenda ya resolution add karna hai, to ussi meeting mein add karein — naya banane ki zaroorat nahi.
                  </p>
                  <div className="flex gap-2 mt-2">
                    <a href={`/dashboard`}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700">
                      📂 Existing meeting open karein →
                    </a>
                    <button onClick={() => setDupDismissed(true)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-100">
                      Phir bhi naya banao
                    </button>
                  </div>
                </div>
                <button onClick={() => setDupDismissed(true)}
                  className="text-amber-400 hover:text-amber-600 text-lg leading-none flex-shrink-0">✕</button>
              </div>
            </div>
          )}
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
      <div className={`rounded-xl px-4 py-3 flex items-start gap-3 border ${
        quorumMet ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"
      }`}>
        <span className="text-2xl shrink-0">{quorumMet ? "✅" : "❌"}</span>
        <div className="flex-1">
          <p className={`font-bold text-sm ${quorumMet ? "text-green-800" : "text-red-700"}`}>
            Quorum: {presentCount}/{totalDirs} directors present
            {quorumMet ? " — Quorum Met ✓" : ` — ${qRequired} required (NOT MET)`}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {f.entityType === "opc" ? "OPC: 1 member sufficient" :
             f.entityType === "public_ltd" ? "Public Ltd: max(3, 1/3 of total)" :
             "Pvt Ltd: max(2, 1/3 of total)"}
            {indepDirCount > 0 && <span className="ml-2 text-blue-500 font-medium">· {indepDirCount} Independent Director(s) present</span>}
          </p>
          {!quorumMet && totalDirs > 0 && (
            <p className="text-xs text-red-600 font-semibold mt-1">
              ⛔ Quorum nahi hai — aage proceed nahi kar sakte. {qRequired - presentCount} aur director(s) ko present mark karo.
            </p>
          )}
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
                <p className="text-sm font-bold text-amber-800">
                  {f.directors.filter(d => !d.name.trim()).length} director{f.directors.filter(d => !d.name.trim()).length > 1 ? "s" : ""} ka naam fill karna hai
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Red border wale boxes mein director ka poora naam type karein. DIN dekh ke identify karein kaun sa director hai.
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
                  className={`flex-1 min-w-0 border rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 bg-white ${
                    !d.name.trim()
                      ? "border-red-400 bg-red-50 focus:ring-red-200 placeholder:text-red-400"
                      : "border-green-300 focus:ring-blue-300"
                  }`}
                  value={d.name}
                  onChange={e => setDirField(i, "name", e.target.value)}
                  placeholder={d.din ? `Director name (DIN: ${d.din})` : "Director full name *"}
                />
                <input className={`${INP} w-36`} value={d.designation}
                  onChange={e => setDirField(i, "designation", e.target.value)} placeholder="Designation" />
                <input
                  className={`${INP} w-28 font-mono text-xs ${
                    d.din && !isDinValid(d.din) ? "border-red-400 bg-red-50" :
                    f.directors.some((o, j) => j !== i && o.din.trim() && o.din.trim() === d.din.trim()) ? "border-orange-400 bg-orange-50" : ""
                  }`}
                  value={d.din}
                  onChange={e => setDirField(i, "din", e.target.value)}
                  placeholder="DIN/PAN"
                  maxLength={10}
                  title={
                    d.din && !isDinValid(d.din) ? "Invalid DIN (must be 8 digits)" :
                    f.directors.some((o, j) => j !== i && o.din.trim() === d.din.trim()) ? "Duplicate DIN!" : ""
                  }
                />

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
  const addedIds = new Set(f.agendaItems.map(a =>
    a.templateId.startsWith("rl_") ? a.templateId.slice(3) : a.templateId
  ));

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
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-blue-800">Select Agenda Item</p>
            <button type="button" onClick={() => { setShowTemplates(false); setTemplateSearch(""); }}
              className="text-slate-400 hover:text-slate-600 text-xs font-medium">✕ Close</button>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
            <button type="button"
              onClick={() => setTemplateTab("standard")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                templateTab === "standard"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}>
              📋 Standard Items
            </button>
            <button type="button"
              onClick={() => setTemplateTab("resolution")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                templateTab === "resolution"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}>
              📝 Resolution Library
              <span className="ml-1 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-black">
                {ALL_MASTER_RESOLUTIONS.filter(r => r.meetingType === "board").length}+
              </span>
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            value={templateSearch}
            onChange={e => setTemplateSearch(e.target.value)}
            placeholder={templateTab === "standard"
              ? "🔍 Search agenda items... (e.g. bank, director, audit)"
              : "🔍 Search resolutions... (e.g. director, shares, transfer)"
            }
            className="w-full border border-blue-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            autoFocus
          />

          {/* ── Tab: Standard agenda items ── */}
          {templateTab === "standard" && (
            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
              {AGENDA_CATEGORY_ORDER.map(cat => {
                const meta = AGENDA_CATEGORY_META[cat];
                const templates = ALL_AGENDA_TEMPLATES.filter(t =>
                  t.category === cat &&
                  (templateSearch === "" || t.title.toLowerCase().includes(templateSearch.toLowerCase()))
                );
                if (templates.length === 0) return null;
                return (
                  <div key={cat}>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <span>{meta.icon}</span> {meta.label}
                      <span className="ml-1 text-slate-300 font-normal normal-case">({templates.length})</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {templates.map(t => {
                        const alreadyAdded = addedIds.has(t.id);
                        return (
                          <button key={t.id} type="button"
                            onClick={() => !alreadyAdded && addAgendaItem(t.id)}
                            disabled={alreadyAdded}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-left transition-all ${
                              alreadyAdded
                                ? "border-green-200 bg-green-50 text-green-700 cursor-default"
                                : "border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50 text-slate-700"
                            }`}>
                            <span className="text-base shrink-0">{t.icon}</span>
                            <span className="flex-1 text-xs leading-tight">{t.title}</span>
                            {alreadyAdded
                              ? <span className="text-xs text-green-600 font-bold shrink-0">✓</span>
                              : <span className="text-xs text-blue-500 font-bold shrink-0">+</span>
                            }
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {templateSearch && ALL_AGENDA_TEMPLATES.filter(t =>
                t.title.toLowerCase().includes(templateSearch.toLowerCase())
              ).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">
                  No matching items for &quot;{templateSearch}&quot;
                </p>
              )}
            </div>
          )}

          {/* ── Tab: Resolution Library ── */}
          {templateTab === "resolution" && (
            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
              {Object.keys(MASTER_CATEGORY_META)
                .filter(cat => MASTER_CATEGORY_META[cat].meetingType === "board")
                .map(cat => {
                  const meta = MASTER_CATEGORY_META[cat];
                  const items = ALL_MASTER_RESOLUTIONS.filter(r =>
                    r.category === cat &&
                    r.meetingType === "board" &&
                    (templateSearch === ""
                      || r.title.toLowerCase().includes(templateSearch.toLowerCase())
                      || (r.agendaTitle ?? "").toLowerCase().includes(templateSearch.toLowerCase())
                    )
                  );
                  if (items.length === 0) return null;
                  return (
                    <div key={cat}>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                        <span>{meta.icon}</span> {meta.label}
                        <span className="ml-1 text-slate-300 font-normal normal-case">({items.length})</span>
                      </p>
                      <div className="space-y-1.5">
                        {items.map(r => {
                          const alreadyAdded = addedIds.has(r.id);
                          return (
                            <button key={r.id} type="button"
                              onClick={() => !alreadyAdded && addAgendaItem(r.id, true)}
                              disabled={alreadyAdded}
                              className={`w-full flex items-start gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                                alreadyAdded
                                  ? "border-green-200 bg-green-50 text-green-700 cursor-default"
                                  : "border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50 text-slate-700"
                              }`}>
                              <span className="text-base shrink-0 mt-0.5">{r.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold leading-tight">{r.agendaTitle ?? r.title}</div>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  {r.kind !== "none" && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                      r.kind === "ordinary" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                                    }`}>{r.kind === "ordinary" ? "OBR" : "SR"}</span>
                                  )}
                                  <span className="text-[10px] text-slate-400 truncate">{r.section}</span>
                                  {r.rocFiling && <span className="text-[10px] text-amber-600 font-semibold">⚠️ {r.rocFiling}</span>}
                                </div>
                              </div>
                              {alreadyAdded
                                ? <span className="text-xs text-green-600 font-bold shrink-0">✓</span>
                                : <span className="text-xs text-indigo-500 font-bold shrink-0">+</span>
                              }
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              {templateSearch && ALL_MASTER_RESOLUTIONS.filter(r =>
                r.meetingType === "board" &&
                (r.title.toLowerCase().includes(templateSearch.toLowerCase()) ||
                 (r.agendaTitle ?? "").toLowerCase().includes(templateSearch.toLowerCase()))
              ).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">
                  No resolutions found for &quot;{templateSearch}&quot;
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Agenda items */}
      {f.agendaItems.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl">
          <p className="text-slate-400 font-medium mb-2">No agenda items yet</p>
          <p className="text-sm text-slate-400">Click &quot;+ Add Agenda Item&quot; above to start</p>
        </div>
      ) : (
        <div className="space-y-3">
          {f.agendaItems.map((item, i) => (
            <AgendaCard key={item.id} item={item} index={i} total={f.agendaItems.length}
              onMove={dir => moveAgenda(i, dir)}
              onRemove={() => removeAgenda(i)}
              onChange={updated => updateAgendaItem(i, updated)}
              contextWarning={getAgendaWarning(item.templateId)}
              resolutionNumber={resolutionMap[item.id]}
              meetingSerial={f.meetingSerial}
              financialYear={f.financialYear}
            />
          ))}
        </div>
      )}

      {/* Resolution Preview */}
      {resolutionCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">
            📋 Resolutions Summary ({resolutionCount} total)
          </p>
          <div className="space-y-1.5">
            {(() => {
              let cnt = 0;
              return f.agendaItems
                .filter(a => a.resolutionType !== "none" && a.resolution)
                .map(a => {
                  cnt++;
                  return (
                    <div key={a.id} className="flex items-center gap-2 text-xs">
                      <span className={`shrink-0 px-2 py-0.5 rounded font-bold text-white ${
                        a.resolutionType === "special" ? "bg-red-500" : "bg-blue-600"
                      }`}>
                        {cnt}/{f.meetingSerial || "BM"}/{f.financialYear || "FY"}
                      </span>
                      <span className="text-slate-700 flex-1 truncate">{a.title}</span>
                      {a.resolutionType === "special" && (
                        <span className="text-red-500 font-semibold shrink-0">Special</span>
                      )}
                    </div>
                  );
                });
            })()}
          </div>
        </div>
      )}

      {/* Filing Reminders */}
      {filingReminders.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2">
            ⏰ ROC Filing Reminders — In agenda items se trigger hue
          </p>
          <div className="space-y-1.5">
            {filingReminders.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-amber-800">
                <span>{r.icon}</span>
                <span className="font-bold bg-amber-200 px-1.5 py-0.5 rounded">{r.form}</span>
                <span className="flex-1">{r.desc}</span>
                <span className="text-amber-600 shrink-0">within {r.days}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  /* ════════════════════════════════════════════
     STEP 5 — PREVIEW
  ════════════════════════════════════════════ */
  const s5 = (
    <div className="space-y-4">
      <SHead n={5} title="Preview & Print" sub="SS-1 checklist verify karo, phir print karo" />

      {/* SS-1 Compliance Checklist */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
        <p className="font-bold text-slate-700 text-sm uppercase tracking-wide flex items-center gap-2 mb-3">
          <span>📋</span> Secretarial Standard-1 (SS-1) Checklist
        </p>
        {ss1Checklist.map((item, i) => (
          <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-xl text-xs border ${
            item.status === "ok"     ? "bg-green-50  border-green-200"  :
            item.status === "fail"   ? "bg-red-50    border-red-200"    :
            item.status === "warn"   ? "bg-amber-50  border-amber-200"  :
            "bg-slate-50 border-slate-200"
          }`}>
            <span className="text-base shrink-0 leading-none mt-0.5">
              {item.status === "ok" ? "✅" : item.status === "fail" ? "❌" : item.status === "warn" ? "⚠️" : "🔲"}
            </span>
            <div>
              <p className={`font-semibold ${
                item.status === "ok" ? "text-green-800" : item.status === "fail" ? "text-red-800" :
                item.status === "warn" ? "text-amber-800" : "text-slate-700"
              }`}>{item.label}</p>
              <p className="text-slate-500 mt-0.5">{item.hint}</p>
            </div>
          </div>
        ))}
      </div>

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

      {/* CTC Signatories */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-800 text-sm">✍️ CTC Signatories</p>
            <p className="text-xs text-slate-400 mt-0.5">Who will sign the Certified True Copies — auto-filled from directors.</p>
          </div>
          <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-full border border-blue-200">
            {ctcCount} CTC{ctcCount !== 1 ? "s" : ""} will be generated
          </span>
        </div>
        <div className="space-y-2">
          {f.ctcSignatories.map((s, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input
                className={`${INP} col-span-4`}
                placeholder="Director / CS name"
                value={s.name}
                onChange={e => {
                  const updated = [...f.ctcSignatories];
                  updated[i] = { ...updated[i], name: e.target.value };
                  set("ctcSignatories", updated);
                }} />
              <input
                className={`${INP} col-span-4`}
                placeholder="Designation"
                value={s.designation}
                onChange={e => {
                  const updated = [...f.ctcSignatories];
                  updated[i] = { ...updated[i], designation: e.target.value };
                  set("ctcSignatories", updated);
                }} />
              <input
                className={`${INP} col-span-3 font-mono`}
                placeholder="DIN"
                value={s.din}
                onChange={e => {
                  const updated = [...f.ctcSignatories];
                  updated[i] = { ...updated[i], din: e.target.value };
                  set("ctcSignatories", updated);
                }} />
              <button
                onClick={() => set("ctcSignatories", f.ctcSignatories.filter((_, j) => j !== i))}
                className="col-span-1 text-red-400 hover:text-red-600 font-bold text-lg text-center">×</button>
            </div>
          ))}
        </div>
        <button
          onClick={() => set("ctcSignatories", [...f.ctcSignatories, { name: "", designation: "Director", din: "" }])}
          className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-lg">
          + Add Signatory
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
        <strong>Before printing:</strong> Verify all details — Director DINs, resolution text, dates. Minutes must be signed by the Chairman within 30 days. Consult a qualified CS for compliance review.
      </div>

      {/* Print buttons */}
      <div className="rounded-2xl p-5 text-white shadow-lg" style={{ background: "linear-gradient(135deg,#1d4ed8,#7c3aed)" }}>
        <h3 className="font-extrabold text-base mb-1 text-center">Ready to Print / Save as PDF</h3>
        <p className="text-blue-200 text-xs mb-4 text-center">Opens in new window — use browser Print → Save as PDF</p>
        <button
          onClick={openPrintAll}
          className="w-full bg-white text-blue-700 font-extrabold px-6 py-3 rounded-xl hover:bg-blue-50 transition-all shadow text-sm mb-3 flex items-center justify-center gap-2">
          🖨️ Print All — Minutes + {ctcCount} CTC{ctcCount !== 1 ? "s" : ""}
          <span className="text-xs bg-blue-100 text-blue-600 font-bold px-2 py-0.5 rounded-full">{ctcCount} CTC{ctcCount !== 1 ? "s" : ""}</span>
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={openPrint}
            className="bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all border border-white/30">
            📄 Minutes Only
          </button>
          <button
            onClick={openPrintCtc}
            disabled={ctcCount === 0}
            className="bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all border border-white/30 disabled:opacity-40 disabled:cursor-not-allowed">
            📋 CTCs Only ({ctcCount})
          </button>
        </div>
      </div>

      {/* Save to My Documents */}
      {session && (
        <div className="mt-3 text-center">
          <button
            onClick={saveDocument}
            disabled={saveStatus === 'saving' || saveStatus === 'saved'}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold border transition-all disabled:opacity-60"
            style={saveStatus === 'saved'
              ? { background: '#dcfce7', color: '#166534', borderColor: '#86efac' }
              : { background: '#f0f9ff', color: '#0369a1', borderColor: '#bae6fd' }
            }
          >
            {saveStatus === 'saving' ? '💾 Saving...' :
             saveStatus === 'saved'  ? '✓ Saved to My Documents' :
             saveStatus === 'error'  ? '❌ Save failed — retry' :
             '💾 Save to My Documents'}
          </button>
        </div>
      )}
    </div>
  );

  const stepContent: Record<number, React.ReactNode> = { 1: s1, 2: s2, 3: s3, 4: s4, 5: s5 };

  /* ══════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════ */
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Suspense fallback={null}>
        <RestoreDocWatcher
          onRestore={setF}
          onPrevDate={(date) => setF(prev => ({ ...prev, prevMeetingDate: date }))}
          onDocId={setExistingDocId}
        />
      </Suspense>
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

        {/* Draft status bar */}
        <div className="flex items-center justify-between mb-4 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className={`inline-flex items-center gap-1 transition-opacity duration-500 ${draftSaved ? "opacity-100" : "opacity-0"}`}>
              <span className="text-green-500">✓</span> Draft saved
            </span>
          </div>
          <button type="button" onClick={clearDraft}
            className="text-slate-400 hover:text-red-500 transition font-medium">
            🗑 New Meeting
          </button>
        </div>

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
            <div className="flex flex-col items-end gap-1">
              {step === 3 && !quorumMet && totalDirs > 0 && (
                <p className="text-xs text-red-500 font-medium">Quorum nahi hai — aage nahi ja sakte</p>
              )}
              <button onClick={() => setStep(s => Math.min(s + 1, 5) as typeof step)}
                disabled={!canNext()}
                className="px-8 py-3 rounded-xl font-bold text-white text-sm transition hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg,#1d4ed8,#7c3aed)" }}>
                Continue →
              </button>
            </div>
          ) : (
            <button onClick={openPrintAll}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white text-sm transition hover:scale-105 shadow-lg"
              style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
              🖨️ Print All (Minutes + {ctcCount} CTCs) →
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
