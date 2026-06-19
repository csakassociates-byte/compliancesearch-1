"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { injectPreviewWatermark } from "@/lib/preview-protection";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import CompanyExcelUpload from "@/components/CompanyExcelUpload";
import CompanySearch from "@/components/CompanySearch";
import type { CompanyData } from "@/lib/types/company";
import {
  ALL_AGM_TEMPLATES,
  AGM_CATEGORY_ORDER,
  AGM_CATEGORY_META,
  fillAgmTemplate,
  type AgmAgendaTemplate,
} from "@/lib/agm-agenda-templates";
import { generateCtcDocument, type CtcParams } from "@/lib/ctc-generator";

/* ══════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════ */
interface Member {
  id: string;
  name: string;
  folioNo: string;
  sharesHeld: string;
  isPresent: boolean;           // physically present
  proxy: string;                // proxy holder name (if applicable)
  isProxyPresent: boolean;      // proxy attending on behalf
  isDirectorMember?: boolean;   // true = auto-populated from directors list
  designation?: string;         // director's designation (shown as badge)
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
  votingMode: "show_of_hands" | "poll" | "e_voting" | "na";
  votingResult: "passed_unanimously" | "passed_majority" | "defeated" | "";
}

interface F {
  // Step 1 — Company
  companyName: string;
  cin: string;
  regAddress: string;
  entityType: string;
  incorporationDate: string;
  companyDirectors: Array<{ name: string; designation: string; din: string }>;

  // Step 2 — Meeting
  agmSerial: string;         // "1st", "2nd", etc.
  financialYear: string;     // "2024-25"
  meetingDate: string;
  meetingTime: string;
  closingTime: string;
  venue: string;
  chairmanName: string;
  chairmanDesig: string;
  prevAgmDate: string;
  noticeDate: string;

  // Step 3 — Members
  members: Member[];
  invitees: Invitee[];

  // Step 4 — Agenda
  agendaItems: AgendaItemData[];

  // ── Meeting Decisions (controls which agenda items appear) ──
  dividendDecision: "declare" | "no_board_recommendation" | "declared_nil";
  dirRotationApplicable: "yes" | "no" | "not_applicable"; // yes=retiring dir, no=none retiring, not_applicable=pvt/OPC no rotation
  auditorStatus: "fresh_appt" | "reappt_new_term" | "ongoing_term";   // ongoing = no resolution needed
  additionalDirectors: Array<{ name: string; din: string; designation: string; boardApptDate: string }>;

  // Prior Board Meeting (Sec. 134 — mandatory before AGM)
  boardMeetingSerial: string;
  boardMeetingDate: string;

  // CTC signatories (who will sign each CTC)
  ctcSignatories: Array<{ name: string; designation: string; din: string }>;

  // Print
  printOnLetterhead: boolean;
  printMobile: string;
  printEmail: string;
}

/* ══════════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════════ */
const DRAFT_KEY = "csi_agm_draft_v1";

const ORDINAL = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];

// Mandatory ordinary business items — auto-added on new session
const MANDATORY_ROUTINE_IDS = ["agm_chairman", "agm_quorum", "agm_notice_read", "agm_reports_read"];
const MANDATORY_OB_IDS = ["agm_adopt_accounts", "agm_dividend", "agm_dir_reappt", "agm_auditor_appt"];
const MANDATORY_CLOSING_IDS = ["agm_vote_of_thanks"];

const DEFAULT_ITEM_IDS = [...MANDATORY_ROUTINE_IDS, ...MANDATORY_OB_IDS, ...MANDATORY_CLOSING_IDS];

const BLANK_MEMBER = (): Member => ({
  id: crypto.randomUUID(),
  name: "", folioNo: "", sharesHeld: "",
  isPresent: false, proxy: "", isProxyPresent: false,
});

const BLANK_INVITEE = (): Invitee => ({
  id: crypto.randomUUID(), name: "", designation: "",
});

/* ══════════════════════════════════════════════════════════════════
   QUORUM LOGIC — SS-2 / Sec. 103
   OPC → 1 member present
   Private → 2 members personally present
   Public → 5 members personally present
══════════════════════════════════════════════════════════════════ */
function quorumRequired(entityType: string): number {
  if (entityType === "One Person Company (OPC)") return 1;
  if (entityType === "Public Limited Company") return 5;
  return 2; // Private Limited
}

function quorumMet(members: Member[], entityType: string): boolean {
  const personally = members.filter(m => m.isPresent && !m.isProxyPresent).length;
  return personally >= quorumRequired(entityType);
}

// ── FY validation: must be "YYYY-YY" format and consecutive years ──
function isValidFY(fy: string): boolean {
  const m = fy.match(/^(\d{4})-(\d{2})$/);
  if (!m) return false;
  const y1 = parseInt(m[1]);
  const y2 = parseInt(m[2]);
  return y2 === (y1 + 1) % 100;
}

// ── FY end date: "2024-25" → "2025-03-31" ──
function fyEndDate(fy: string): string {
  const m = fy.match(/^(\d{4})-(\d{2})$/);
  if (!m) return "";
  const endYear = parseInt(m[1]) + 1;
  return `${endYear}-03-31`;
}

// ── Min AGM date: day after FY end ──
function minAgmDate(fy: string): string {
  const end = fyEndDate(fy);
  if (!end) return "";
  const d = new Date(end);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

// ── Max AGM date: 6 months from FY end (Sec. 96) ──
function maxAgmDate(fy: string): string {
  const m = fy.match(/^(\d{4})-(\d{2})$/);
  if (!m) return "";
  const endYear = parseInt(m[1]) + 1;
  return `${endYear}-09-30`;
}

// ── Suggest AGM serial from incorporation date + FY ──
function suggestAgmSerial(incorporationDate: string, financialYear: string): string | null {
  if (!incorporationDate || !financialYear) return null;
  const fyMatch = financialYear.match(/^(\d{4})-(\d{2})$/);
  if (!fyMatch) return null;
  const fyEndYear = parseInt(fyMatch[1]) + 1;
  try {
    const inc = new Date(incorporationDate);
    if (isNaN(inc.getTime())) return null;
    const incMonth = inc.getMonth() + 1;
    const incYear = inc.getFullYear();
    // First FY ends: if inc Jan-Mar → same year March; else next year March
    const firstFYEndYear = incMonth <= 3 ? incYear : incYear + 1;
    const serial = fyEndYear - firstFYEndYear + 1;
    if (serial < 1 || serial > 10) return null;
    return ["", "1st","2nd","3rd","4th","5th","6th","7th","8th","9th","10th"][serial];
  } catch { return null; }
}

// ── Parse MCA date format "DD/MM/YYYY" → ISO "YYYY-MM-DD" ──
function parseMcaDate(d: string): string {
  if (!d) return "";
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return d; // already ISO or unknown
}

// ── Check if ISO date is within a financial year "YYYY-YY" ──
function isWithinFY(isoDate: string, fy: string): boolean {
  if (!isoDate || !isValidFY(fy)) return false;
  const fyStart = parseInt(fy.split("-")[0]);
  const start = new Date(`${fyStart}-04-01`);
  const end = new Date(`${fyStart + 1}-03-31`);
  const d = new Date(isoDate);
  return d >= start && d <= end;
}

// ── Check if ISO date is within last N months from today ──
function isWithinMonths(isoDate: string, months: number): boolean {
  if (!isoDate) return false;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return false;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return d >= cutoff;
}

// ── Calculate clear days between notice and meeting ──
function calcClearDays(noticeDate: string, meetingDate: string): number {
  if (!noticeDate || !meetingDate) return 999;
  const nd = new Date(noticeDate);
  const md = new Date(meetingDate);
  return Math.floor((md.getTime() - nd.getTime()) / 86400000) - 1;
}

// ── Format date for display ──
function fmtDate(d: string): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return d; }
}
function fmtTime(t: string): string {
  if (!t) return "—";
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || "0", 10);
  if (isNaN(h)) return t;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/* ══════════════════════════════════════════════════════════════════
   INITIAL STATE
══════════════════════════════════════════════════════════════════ */
function defaultAgendaItem(templateId: string): AgendaItemData {
  const tpl = ALL_AGM_TEMPLATES.find(t => t.id === templateId);
  if (!tpl) return {
    id: crypto.randomUUID(), templateId, title: templateId,
    discussion: "", resolution: "", resolutionType: "none",
    fields: {}, votingMode: "na", votingResult: "",
  };
  return {
    id: crypto.randomUUID(), templateId,
    title: tpl.title,
    discussion: tpl.discussion,
    resolution: tpl.resolution,
    resolutionType: tpl.resolutionType,
    fields: Object.fromEntries(tpl.fields.map(f => [f.key, ""])),
    votingMode: tpl.resolutionType === "none" ? "na" : "show_of_hands",
    votingResult: "",
  };
}

const INITIAL_F: F = {
  companyName: "", cin: "", regAddress: "", entityType: "Private Limited Company",
  incorporationDate: "", companyDirectors: [],
  agmSerial: "1st", financialYear: "", meetingDate: "", meetingTime: "11:00",
  closingTime: "", venue: "", chairmanName: "", chairmanDesig: "Chairman",
  prevAgmDate: "", noticeDate: "",
  boardMeetingSerial: "", boardMeetingDate: "",
  members: [BLANK_MEMBER()],
  invitees: [],
  agendaItems: DEFAULT_ITEM_IDS.map(defaultAgendaItem),
  dividendDecision: "declare",
  dirRotationApplicable: "yes",
  auditorStatus: "fresh_appt",
  additionalDirectors: [],
  ctcSignatories: [{ name: "", designation: "Director", din: "" }, { name: "", designation: "Director", din: "" }],
  printOnLetterhead: true, printMobile: "", printEmail: "",
};

/* ══════════════════════════════════════════════════════════════════
   GENERATE HTML
══════════════════════════════════════════════════════════════════ */
function generateAgmHTML(f: F): string {
  const present = f.members.filter(m => m.isPresent || m.isProxyPresent);
  const inPerson = f.members.filter(m => m.isPresent && !m.isProxyPresent);
  const byProxy = f.members.filter(m => m.isProxyPresent && !m.isPresent);
  const totalSharesPresent = present.reduce((s, m) => s + (parseInt(m.sharesHeld) || 0), 0);

  let ordinaryCount = 0;
  let specialCount = 0;

  const globalFields: Record<string, string> = {
    boardMeetingSerial: f.boardMeetingSerial || "",
    boardMeetingDate: f.boardMeetingDate ? fmtDate(f.boardMeetingDate) : "",
  };

  const agendaRows = f.agendaItems.map((item, idx) => {
    const filled = fillAgmTemplate(item.discussion, { ...globalFields, ...item.fields });
    const resFilled = item.resolution ? fillAgmTemplate(item.resolution, { ...globalFields, ...item.fields }) : "";

    let resBlock = "";
    if (resFilled) {
      const rType = item.resolutionType;
      if (rType === "ordinary") ordinaryCount++;
      if (rType === "special") specialCount++;
      const voteLabel =
        item.votingMode === "show_of_hands" ? "ON SHOW OF HANDS" :
        item.votingMode === "poll" ? "BY POLL" :
        item.votingMode === "e_voting" ? "BY E-VOTING" : "";
      const voteResult =
        item.votingResult === "passed_unanimously" ? "PASSED UNANIMOUSLY" :
        item.votingResult === "passed_majority" ? "PASSED WITH REQUISITE MAJORITY" :
        item.votingResult === "defeated" ? "DEFEATED" : "";

      resBlock = `
        <div style="margin-top:12px;background:#f0fdf4;border-left:4px solid #16a34a;padding:14px 18px;border-radius:0 6px 6px 0;">
          <p style="font-weight:700;font-size:11px;color:#15803d;text-transform:uppercase;margin:0 0 8px 0;">
            ${rType === "special" ? "⚡ Special" : "✅ Ordinary"} Resolution — Item ${idx + 1}
            ${voteLabel ? ` &nbsp;|&nbsp; Voted ${voteLabel}` : ""}
            ${voteResult ? ` &nbsp;|&nbsp; <span style="color:#1d4ed8">${voteResult}</span>` : ""}
          </p>
          <p style="margin:0;white-space:pre-wrap;font-size:11px;line-height:1.7;color:#064e3b;">${resFilled}</p>
        </div>`;
    }

    return `
      <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #e2e8f0;">
        <p style="font-weight:700;font-size:12px;color:#1e293b;margin:0 0 8px 0;">${idx + 1}. ${fillAgmTemplate(item.title, { ...globalFields, ...item.fields })}</p>
        <p style="font-size:11.5px;color:#374151;line-height:1.7;margin:0;white-space:pre-wrap;">${filled}</p>
        ${resBlock}
      </div>`;
  }).join("");

  const memberRows = f.members.map(m => {
    const status = m.isPresent && !m.isProxyPresent ? "Present in Person" :
      m.isProxyPresent ? `Present by Proxy (${m.proxy || "—"})` : "Absent";
    return `<tr>
      <td style="${tdStyle}">${m.name || "—"}</td>
      <td style="${tdStyle}">${m.folioNo || "—"}</td>
      <td style="${tdStyle};text-align:right;">${m.sharesHeld || "—"}</td>
      <td style="${tdStyle};color:${m.isPresent || m.isProxyPresent ? "#16a34a" : "#dc2626"};">${status}</td>
    </tr>`;
  }).join("");

  const inviteeRows = f.invitees.map(i =>
    `<tr><td style="${tdStyle}">${i.name}</td><td style="${tdStyle}">${i.designation}</td></tr>`
  ).join("");

  const thStyle = "padding:8px 12px;background:#1e3a5f;color:#fff;font-size:10.5px;font-weight:700;text-align:left;border:1px solid #1e3a5f;";
  const tdStyle2 = "padding:7px 12px;font-size:11px;color:#374151;border:1px solid #e2e8f0;";

  const letterheadBlock = f.printOnLetterhead ? `
    <div style="text-align:center;border-bottom:3px double #1e3a5f;padding-bottom:14px;margin-bottom:20px;">
      <h2 style="margin:0;font-size:20px;font-weight:900;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;">${f.companyName || "[COMPANY NAME]"}</h2>
      <p style="margin:4px 0 0 0;font-size:11px;color:#475569;">CIN: ${f.cin || "—"}</p>
      <p style="margin:2px 0 0 0;font-size:11px;color:#475569;">Registered Office: ${f.regAddress || "—"}</p>
      ${f.printEmail ? `<p style="margin:2px 0 0 0;font-size:11px;color:#475569;">Email: ${f.printEmail}${f.printMobile ? " | Tel: " + f.printMobile : ""}</p>` : ""}
    </div>` : "";

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>AGM Minutes — ${f.companyName}</title>
  <style>
    @page { size:A4; margin:20mm 18mm; }
    *, *::before, *::after { box-sizing: border-box; }
    /* body width = A4 210mm − 18mm − 18mm = 174mm */
    body {
      font-family:'Times New Roman',Times,serif; font-size:12px; color:#1a1a1a;
      background:#fff; text-align:justify;
      width:174mm;
      -webkit-print-color-adjust:exact; print-color-adjust:exact;
    }
    p, td, th, span { overflow-wrap:break-word; word-wrap:break-word; }
    @media screen { html { background:#c8c8c8; } body { margin:10mm auto; } }
    @media print  { body { margin:0; } }
    table { border-collapse:collapse; width:100%; }
  </style>
  </head><body>
  <div style="width:100%;">

    ${letterheadBlock}

    <h3 style="text-align:center;font-size:15px;font-weight:900;text-transform:uppercase;color:#1e3a5f;margin:0 0 4px 0;letter-spacing:0.5px;">
      MINUTES OF THE ${f.agmSerial ? f.agmSerial.toUpperCase() + " " : ""}ANNUAL GENERAL MEETING
    </h3>
    <p style="text-align:center;font-size:11px;color:#64748b;margin:0 0 18px 0;">
      ${f.companyName} &nbsp;|&nbsp; FY ${f.financialYear || "—"} &nbsp;|&nbsp; ${f.meetingDate || "—"}
    </p>

    <!-- Meeting Details Table -->
    <table style="margin-bottom:20px;border:1px solid #e2e8f0;">
      <thead><tr>
        <th colspan="4" style="${thStyle}font-size:11.5px;text-align:center;letter-spacing:0.5px;">MEETING DETAILS</th>
      </tr></thead>
      <tbody>
        <tr>
          <td style="${tdStyle2}font-weight:700;background:#f8fafc;">Date</td>
          <td style="${tdStyle2}">${fmtDate(f.meetingDate) || "—"}</td>
          <td style="${tdStyle2}font-weight:700;background:#f8fafc;">Time</td>
          <td style="${tdStyle2}">${fmtTime(f.meetingTime)}${f.closingTime ? " to " + fmtTime(f.closingTime) : ""}</td>
        </tr>
        <tr>
          <td style="${tdStyle2}font-weight:700;background:#f8fafc;">Venue</td>
          <td style="${tdStyle2}" colspan="3">${f.venue || "—"}</td>
        </tr>
        <tr>
          <td style="${tdStyle2}font-weight:700;background:#f8fafc;">AGM Serial</td>
          <td style="${tdStyle2}">${f.agmSerial || "—"} AGM</td>
          <td style="${tdStyle2}font-weight:700;background:#f8fafc;">Financial Year</td>
          <td style="${tdStyle2}">${f.financialYear || "—"}</td>
        </tr>
        <tr>
          <td style="${tdStyle2}font-weight:700;background:#f8fafc;">Chairman</td>
          <td style="${tdStyle2}" colspan="3">${f.chairmanName || "—"}${f.chairmanDesig ? ", " + f.chairmanDesig : ""}</td>
        </tr>
        ${f.prevAgmDate ? `<tr>
          <td style="${tdStyle2}font-weight:700;background:#f8fafc;">Previous AGM</td>
          <td style="${tdStyle2}" colspan="3">${fmtDate(f.prevAgmDate)}</td>
        </tr>` : ""}
        ${f.boardMeetingDate ? `<tr>
          <td style="${tdStyle2}font-weight:700;background:#f0fdf4;color:#15803d;">Prior Board Meeting</td>
          <td style="${tdStyle2}" colspan="3">${f.boardMeetingSerial ? f.boardMeetingSerial + " Meeting held on " : "Held on "}${fmtDate(f.boardMeetingDate)} — Financial Statements approved &amp; AGM Notice issued (Sec. 134)</td>
        </tr>` : ""}
      </tbody>
    </table>

    <!-- Members Attendance -->
    <h4 style="font-size:12px;font-weight:800;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:4px;margin:18px 0 10px 0;">
      ATTENDANCE OF MEMBERS
    </h4>
    <table style="margin-bottom:8px;">
      <thead><tr>
        <th style="${thStyle}">Member Name</th>
        <th style="${thStyle}">Folio No.</th>
        <th style="${thStyle};text-align:right;">Shares Held</th>
        <th style="${thStyle}">Status</th>
      </tr></thead>
      <tbody>${memberRows}</tbody>
    </table>
    <p style="font-size:10.5px;color:#475569;margin:4px 0 16px 0;">
      Members present in person: <b>${inPerson.length}</b> &nbsp;|&nbsp;
      Present by Proxy: <b>${byProxy.length}</b> &nbsp;|&nbsp;
      Total Shares Represented: <b>${totalSharesPresent.toLocaleString("en-IN")}</b>
    </p>

    ${f.invitees.length > 0 ? `
    <h4 style="font-size:12px;font-weight:800;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:4px;margin:16px 0 10px 0;">
      OTHERS PRESENT (BY INVITATION)
    </h4>
    <table style="margin-bottom:16px;">
      <thead><tr>
        <th style="${thStyle}">Name</th>
        <th style="${thStyle}">Designation</th>
      </tr></thead>
      <tbody>${inviteeRows}</tbody>
    </table>` : ""}

    <!-- Proceedings -->
    <h4 style="font-size:12px;font-weight:800;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:4px;margin:16px 0 14px 0;">
      PROCEEDINGS
    </h4>
    ${agendaRows}

    <!-- Summary -->
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:14px 18px;margin:24px 0 20px 0;">
      <p style="font-weight:700;font-size:11px;color:#0369a1;margin:0 0 8px 0;text-transform:uppercase;">Resolution Summary</p>
      <p style="font-size:11px;color:#0c4a6e;margin:0;">
        Total Resolutions Passed: <b>${ordinaryCount + specialCount}</b> &nbsp;&nbsp;
        Ordinary Resolutions: <b>${ordinaryCount}</b> &nbsp;&nbsp;
        Special Resolutions: <b>${specialCount}</b>
      </p>
    </div>

    <!-- Signature -->
    <div style="margin-top:40px;display:flex;justify-content:space-between;">
      <div style="text-align:center;width:45%;">
        <div style="border-top:1px solid #374151;padding-top:6px;font-size:11px;color:#374151;">
          <b>${f.chairmanName || "Chairman"}</b><br/>${f.chairmanDesig || "Chairman"}
        </div>
      </div>
      <div style="text-align:center;width:45%;">
        <div style="border-top:1px solid #374151;padding-top:6px;font-size:11px;color:#374151;">
          <b>Company Secretary</b><br/>(if applicable)
        </div>
      </div>
    </div>
    <p style="font-size:9.5px;color:#94a3b8;text-align:center;margin-top:28px;border-top:1px solid #e2e8f0;padding-top:10px;">
      Generated by ComplianceSearch.in &nbsp;|&nbsp; For official use after review and authentication by authorised signatory.
    </p>

  </div></body></html>`;
}

const tdStyle = "padding:7px 12px;font-size:11px;color:#374151;border:1px solid #e2e8f0;";

/* ══════════════════════════════════════════════════════════════════
   GENERATE CTC HTML — one page per resolution
══════════════════════════════════════════════════════════════════ */
function generateCtcHTML(f: F): string {
  const resolutionItems = f.agendaItems.filter(
    item => item.resolutionType !== "none" && item.resolution.trim()
  );
  if (resolutionItems.length === 0) return "";

  const total = resolutionItems.length;
  const activeSigs = f.ctcSignatories.filter(s => s.name.trim()).length > 0
    ? f.ctcSignatories.filter(s => s.name.trim())
    : [{ name: f.chairmanName || "", designation: f.chairmanDesig || "Director", din: "" }];

  const voteLabel = (mode: string) => ({ show_of_hands: "Show of Hands", poll: "By Poll", e_voting: "E-Voting", na: "—" }[mode] ?? "—");
  const voteResultLabel = (result: string) => ({ passed_unanimously: "PASSED UNANIMOUSLY", passed_majority: "PASSED WITH REQUISITE MAJORITY", defeated: "NOT PASSED (DEFEATED)" }[result] ?? "—");

  const ctcGlobalFields: Record<string, string> = {
    boardMeetingSerial: f.boardMeetingSerial || "",
    boardMeetingDate: f.boardMeetingDate ? fmtDate(f.boardMeetingDate) : "",
  };

  const pages: CtcParams[] = resolutionItems.map((item, i) => ({
    company: {
      companyName: f.companyName,
      cin:         f.cin,
      regAddress:  f.regAddress,
      email:       f.printEmail,
      mobile:      f.printMobile,
    },
    meeting: {
      meetingType:      "agm",
      meetingTypeLabel: "Annual General Meeting",
      meetingSerial:    f.agmSerial,
      meetingDate:      f.meetingDate,
      meetingTime:      f.meetingTime,
      venue:            f.venue,
      financialYear:    f.financialYear,
    },
    resolution: {
      title:               fillAgmTemplate(item.title, { ...ctcGlobalFields, ...item.fields }),
      text:                fillAgmTemplate(item.resolution, { ...ctcGlobalFields, ...item.fields }),
      type:                item.resolutionType === "special" ? "special" : item.resolutionType === "none" ? "none" : "ordinary",
      number:              `Item ${f.agendaItems.findIndex(a => a.id === item.id) + 1} — ${f.agmSerial || ""} AGM/${f.financialYear || ""}`,
      votingMode:          voteLabel(item.votingMode),
      votingResult:        voteResultLabel(item.votingResult),
      votingResultPassed:  item.votingResult !== "defeated",
    },
    ctcIndex:          i + 1,
    ctcTotal:          total,
    signatories:       activeSigs,
    printOnLetterhead: true,
    isDirectCTC:       false,
  }));

  return generateCtcDocument(pages);
}

/* ── Combined: Minutes + all CTCs in one print job ── */
function generateMinutesAndCtcHTML(f: F): string {
  const minutesHtml = generateAgmHTML(f);
  const resolutionItems = f.agendaItems.filter(
    item => item.resolutionType !== "none" && item.resolution.trim()
  );
  if (resolutionItems.length === 0) return minutesHtml;

  // Inject CTCs after minutes body (before </body>)
  const ctcBody = generateCtcHTML(f);
  // Extract just the CTC pages content (between <body> and </body>)
  const ctcContent = ctcBody.replace(/^[\s\S]*<body>/, "").replace(/<\/body>[\s\S]*$/, "");
  return minutesHtml.replace(/<\/body>\s*<\/html>/i, `${ctcContent}</body></html>`);
}

/* ══════════════════════════════════════════════════════════════════
   SS-2 COMPLIANCE CHECKLIST
══════════════════════════════════════════════════════════════════ */
function buildSs2Checklist(f: F): Array<{ label: string; status: "ok" | "warn" | "manual" }> {
  const personally = f.members.filter(m => m.isPresent && !m.isProxyPresent).length;
  const req = quorumRequired(f.entityType);
  const hasOb1 = f.agendaItems.some(a => a.templateId === "agm_adopt_accounts");
  const hasOb4 = f.agendaItems.some(a => a.templateId === "agm_auditor_appt");
  const hasChairman = !!f.chairmanName;
  const hasVenue = !!f.venue;
  const hasFY = !!f.financialYear;
  const hasDate = !!f.meetingDate;

  return [
    { label: "Notice sent at least 21 clear days before AGM (SS-2 / Sec. 101)", status: "manual" },
    { label: `Quorum: ${personally} members personally present (required: ${req})`, status: personally >= req ? "ok" : "warn" },
    { label: "Financial Statements adoption included (Sec. 129)", status: hasOb1 ? "ok" : "warn" },
    { label: "Auditor appointment / ratification included (Sec. 139)", status: hasOb4 ? "ok" : "warn" },
    { label: "Chairman confirmed", status: hasChairman ? "ok" : "warn" },
    { label: "Meeting venue specified", status: hasVenue ? "ok" : "warn" },
    { label: "Financial year mentioned", status: hasFY ? "ok" : "warn" },
    { label: "Meeting date entered", status: hasDate ? "ok" : "warn" },
    { label: "AGM held within 6 months from close of FY (Sec. 96)", status: "manual" },
    { label: "Minutes to be entered in Minute Book within 30 days (Sec. 118)", status: "manual" },
    { label: "MGT-7 / MGT-7A (Annual Return) to be filed within 60 days of AGM — MGT-7A for small companies (Amendment Act 2020)", status: "manual" },
    { label: "AOC-4 / AOC-4 XBRL (Financial Statements) to be filed within 30 days of AGM (Listed/XBRL companies: 60 days)", status: "manual" },
  ];
}

/* ══════════════════════════════════════════════════════════════════
   POST-AGM ROC FILING REMINDERS
══════════════════════════════════════════════════════════════════ */
const AGM_FILING_REMINDERS: Array<{
  form: string; trigger: string[]; desc: string; dueDesc: string; color: string;
}> = [
  { form: "AOC-4", trigger: ["agm_adopt_accounts"], desc: "Filing of Financial Statements", dueDesc: "Within 30 days of AGM (Listed: 60 days)", color: "#2563eb" },
  { form: "MGT-7 / MGT-7A", trigger: ["agm_adopt_accounts"], desc: "Annual Return of the Company", dueDesc: "Within 60 days of AGM", color: "#7c3aed" },
  { form: "ADT-1", trigger: ["agm_auditor_appt"], desc: "Appointment of Auditor", dueDesc: "Within 15 days of AGM", color: "#0891b2" },
  { form: "DIR-12", trigger: ["agm_dir_reappt", "agm_appt_independent", "agm_appt_md_wrd"], desc: "Change in Directors / KMP", dueDesc: "Within 30 days of change", color: "#16a34a" },
  { form: "SH-7 + MGT-14", trigger: ["agm_increase_auth_capital"], desc: "Increase in Authorised Capital", dueDesc: "Within 30 days of passing resolution", color: "#dc2626" },
  { form: "MGT-14", trigger: ["agm_borrowing_limit", "agm_create_security", "agm_alter_moa", "agm_alter_aoa", "agm_change_name", "agm_shift_reg_office", "agm_preferential_allotment", "agm_buyback", "agm_merger"], desc: "Special/Certain Ordinary Resolutions", dueDesc: "Within 30 days of passing resolution", color: "#b45309" },
  { form: "PAS-3", trigger: ["agm_preferential_allotment"], desc: "Return of Allotment", dueDesc: "Within 15 days of allotment", color: "#9333ea" },
];

/* ══════════════════════════════════════════════════════════════════
   AGENDA CARD COMPONENT
══════════════════════════════════════════════════════════════════ */
function AgendaCard({
  item, tpl, idx, onChange, onRemove, canRemove, globalFields,
}: {
  item: AgendaItemData;
  tpl: AgmAgendaTemplate | undefined;
  idx: number;
  onChange: (updated: AgendaItemData) => void;
  onRemove: () => void;
  canRemove: boolean;
  globalFields: Record<string, string>;
}) {
  const [expanded, setExpanded] = useState(idx < 4);

  const set = (key: keyof AgendaItemData, val: unknown) =>
    onChange({ ...item, [key]: val });
  const setField = (key: string, val: string) =>
    onChange({ ...item, fields: { ...item.fields, [key]: val } });

  const merged = { ...globalFields, ...item.fields };
  const filled = fillAgmTemplate(item.discussion, merged);
  const resFilled = item.resolution ? fillAgmTemplate(item.resolution, merged) : "";

  const isOB = tpl?.isOrdinaryBusiness;
  const isMandatory = DEFAULT_ITEM_IDS.includes(item.templateId);

  return (
    <div className={`rounded-xl border-2 ${isOB ? "border-green-300 bg-green-50" : "border-slate-200 bg-white"} overflow-hidden`}>
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer select-none hover:bg-slate-50"
        onClick={() => setExpanded(e => !e)}
      >
        <span className="text-2xl">{tpl?.icon || "📌"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800 text-sm">{idx + 1}. {fillAgmTemplate(item.title, merged)}</span>
            {isOB && (
              <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold">
                Ordinary Business
              </span>
            )}
            {tpl?.resolutionLaw && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                {tpl.resolutionLaw}
              </span>
            )}
            {item.resolutionType === "special" && (
              <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                ⚡ Special Resolution
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{tpl?.categoryLabel || ""}</div>
        </div>
        <div className="flex items-center gap-2">
          {canRemove && (
            <button
              onClick={e => { e.stopPropagation(); onRemove(); }}
              className="text-red-400 hover:text-red-600 text-lg font-bold px-1"
              title="Remove item"
            >×</button>
          )}
          <span className="text-slate-400 text-sm">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100">
          {/* Custom fields */}
          {tpl && tpl.fields.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {tpl.fields.map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{f.label}</label>
                  {f.type === "textarea" ? (
                    <textarea
                      rows={2}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      placeholder={f.placeholder}
                      value={item.fields[f.key] || ""}
                      onChange={e => setField(f.key, e.target.value)}
                    />
                  ) : (
                    <input
                      type={f.type || "text"}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      placeholder={f.placeholder}
                      value={item.fields[f.key] || ""}
                      onChange={e => setField(f.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Discussion Preview */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Discussion / Proceedings</label>
            <textarea
              rows={4}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 mt-1 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={filled}
              onChange={e => set("discussion", e.target.value)}
            />
          </div>

          {/* Resolution */}
          {item.resolutionType !== "none" && (
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Resolution Text</label>
                <select
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none"
                  value={item.resolutionType}
                  onChange={e => set("resolutionType", e.target.value)}
                >
                  <option value="ordinary">Ordinary Resolution</option>
                  <option value="special">Special Resolution</option>
                </select>
              </div>
              <textarea
                rows={6}
                className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${item.resolutionType === "special" ? "border-amber-300 bg-amber-50 focus:ring-amber-400" : "border-green-200 bg-green-50 focus:ring-green-400"}`}
                value={resFilled}
                onChange={e => set("resolution", e.target.value)}
              />

              {/* Voting */}
              <div className="flex flex-wrap gap-3 mt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Voting Mode</label>
                  <select
                    className="ml-2 text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none"
                    value={item.votingMode}
                    onChange={e => set("votingMode", e.target.value)}
                  >
                    <option value="show_of_hands">Show of Hands</option>
                    <option value="poll">By Poll</option>
                    <option value="e_voting">E-Voting</option>
                    <option value="na">N/A</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Result</label>
                  <select
                    className="ml-2 text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none"
                    value={item.votingResult}
                    onChange={e => set("votingResult", e.target.value)}
                  >
                    <option value="">— Select —</option>
                    <option value="passed_unanimously">Passed Unanimously</option>
                    <option value="passed_majority">Passed with Majority</option>
                    <option value="defeated">Defeated</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
══════════════════════════════════════════════════════════════════ */
/* ── Restore helper — isolated so useSearchParams can be Suspense-wrapped ── */
function RestoreDocWatcher({ onRestore, onDocId }: { onRestore: (data: F) => void; onDocId: (id: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function AgmMinutesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [f, setF] = useState<F>(INITIAL_F);
  const [draftSaved, setDraftSaved] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [existingDocId, setExistingDocId] = useState<string | null>(null);
  const [showAddAgenda, setShowAddAgenda] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [showSs2, setShowSs2] = useState(false);
  const [showReminders, setShowReminders] = useState(false);

  // Load draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setF(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(f));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 1500);
    }, 800);
    return () => clearTimeout(timer);
  }, [f]);

  async function saveDocument() {
    if (!session) { router.push('/auth/login'); return; }
    setSaveStatus('saving');
    try {
      const docPayload = {
        type: 'agm_minutes',
        title: `AGM Minutes — ${f.companyName || 'Company'} — FY ${f.financialYear || ''}`,
        companyName: f.companyName || null,
        financialYear: f.financialYear || null,
        meetingDate: f.meetingDate || null,
        formDataJson: JSON.stringify(f),
      };
      let res: Response;
      if (existingDocId) {
        res = await fetch(`/api/documents/${existingDocId}/full`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(docPayload),
        });
      } else {
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

  const upd = useCallback((patch: Partial<F>) => setF(prev => ({ ...prev, ...patch })), []);

  /* ── Members helpers ── */
  const updMember = (id: string, patch: Partial<Member>) =>
    upd({ members: f.members.map(m => m.id === id ? { ...m, ...patch } : m) });
  const addMember = () => upd({ members: [...f.members, BLANK_MEMBER()] });
  const removeMember = (id: string) => upd({ members: f.members.filter(m => m.id !== id) });

  /* ── Invitees helpers ── */
  const updInvitee = (id: string, patch: Partial<Invitee>) =>
    upd({ invitees: f.invitees.map(i => i.id === id ? { ...i, ...patch } : i) });
  const addInvitee = () => upd({ invitees: [...f.invitees, BLANK_INVITEE()] });
  const removeInvitee = (id: string) => upd({ invitees: f.invitees.filter(i => i.id !== id) });

  /* ── Agenda helpers ── */
  const updAgenda = (id: string, updated: AgendaItemData) =>
    upd({ agendaItems: f.agendaItems.map(a => a.id === id ? updated : a) });
  const removeAgenda = (id: string) =>
    upd({ agendaItems: f.agendaItems.filter(a => a.id !== id) });
  const addAgendaItem = (templateId: string) => {
    upd({ agendaItems: [...f.agendaItems, defaultAgendaItem(templateId)] });
  };

  // Auto-sync fy + balanceSheetDate in agenda items when FY changes
  useEffect(() => {
    if (!isValidFY(f.financialYear)) return;
    const fyEndStr = fyEndDate(f.financialYear);
    const balSheetDateStr = fyEndStr ? new Date(fyEndStr).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "";
    setF(prev => ({
      ...prev,
      agendaItems: prev.agendaItems.map(item => {
        const newFields = { ...item.fields };
        let changed = false;
        if ("fy" in newFields && !newFields.fy) { newFields.fy = prev.financialYear; changed = true; }
        if ("balanceSheetDate" in newFields && !newFields.balanceSheetDate && balSheetDateStr) {
          newFields.balanceSheetDate = fyEndStr; changed = true;
        }
        return changed ? { ...item, fields: newFields } : item;
      }),
    }));
  }, [f.financialYear]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!f.noticeDate) return;
    setF(prev => ({
      ...prev,
      agendaItems: prev.agendaItems.map(item => {
        if (item.templateId === "agm_notice_read" && !item.fields.noticeDate) {
          return { ...item, fields: { ...item.fields, noticeDate: f.noticeDate } };
        }
        return item;
      }),
    }));
  }, [f.noticeDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync agenda items when meeting decisions change ──
  useEffect(() => {
    setF(prev => {
      let items = [...prev.agendaItems];

      // ── 1. DIVIDEND ──────────────────────────────────────────────
      const DIVIDEND_ALL = ["agm_dividend", "agm_no_dividend", "agm_dividend_nil_declared"];
      items = items.filter(a => !DIVIDEND_ALL.includes(a.templateId)); // remove all dividend variants
      const closingIdx = items.findIndex(a => a.templateId === "agm_vote_of_thanks");
      const divTemplateId =
        prev.dividendDecision === "declare" ? "agm_dividend" :
        prev.dividendDecision === "no_board_recommendation" ? "agm_no_dividend" :
        "agm_dividend_nil_declared";
      const divItem = defaultAgendaItem(divTemplateId);
      // Preserve FY if available
      if (prev.financialYear && isValidFY(prev.financialYear)) {
        divItem.fields.fy = prev.financialYear;
      }
      const insertAt = closingIdx >= 0 ? closingIdx : items.length;
      items.splice(Math.max(0, insertAt - (items.filter(a =>
        ["agm_dir_no_rotation","agm_dir_reappt","agm_auditor_appt","agm_auditor_ongoing_note","agm_dir_additional_confirm"].includes(a.templateId)
      ).length)), 0, divItem);

      // ── 2. DIRECTOR ROTATION ────────────────────────────────────
      const DIR_ROT_ALL = ["agm_dir_reappt", "agm_dir_no_rotation"];
      items = items.filter(a => !DIR_ROT_ALL.includes(a.templateId));
      if (prev.dirRotationApplicable === "yes") {
        const rotItem = defaultAgendaItem("agm_dir_reappt");
        // auto-fill from directors list if available
        const rotDir = prev.companyDirectors.find(d =>
          !/md|managing|wtd|whole.?time|independent/i.test(d.designation)
        ) || prev.companyDirectors[0];
        if (rotDir) {
          rotItem.fields.dirName = rotDir.name;
          rotItem.fields.dirDin = rotDir.din;
          rotItem.fields.dirDesig = rotDir.designation;
        }
        const audIdx = items.findIndex(a => ["agm_auditor_appt","agm_auditor_ongoing_note"].includes(a.templateId));
        const closeIdx2 = items.findIndex(a => a.templateId === "agm_vote_of_thanks");
        const rotInsert = audIdx >= 0 ? audIdx : closeIdx2 >= 0 ? closeIdx2 : items.length;
        items.splice(rotInsert, 0, rotItem);
      } else {
        // "no" or "not_applicable" → insert note item
        const rotNote = defaultAgendaItem("agm_dir_no_rotation");
        const audIdx2 = items.findIndex(a => ["agm_auditor_appt","agm_auditor_ongoing_note"].includes(a.templateId));
        const closeIdx3 = items.findIndex(a => a.templateId === "agm_vote_of_thanks");
        const noteInsert = audIdx2 >= 0 ? audIdx2 : closeIdx3 >= 0 ? closeIdx3 : items.length;
        items.splice(noteInsert, 0, rotNote);
      }

      // ── 3. AUDITOR ───────────────────────────────────────────────
      const AUD_ALL = ["agm_auditor_appt", "agm_auditor_ongoing_note"];
      items = items.filter(a => !AUD_ALL.includes(a.templateId));
      if (prev.auditorStatus !== "ongoing_term") {
        const audItem = defaultAgendaItem("agm_auditor_appt");
        if (prev.financialYear && isValidFY(prev.financialYear)) {
          // suggest toFY = 5 years ahead
          const fyYear = parseInt(prev.financialYear.split("-")[0]) + 5;
          const toFY2Digit = String(fyYear + 1).slice(-2);
          audItem.fields.toFY = `${fyYear}-${toFY2Digit}`;
        }
        const closeIdx4 = items.findIndex(a => a.templateId === "agm_vote_of_thanks");
        items.splice(closeIdx4 >= 0 ? closeIdx4 : items.length, 0, audItem);
      } else {
        // ongoing — insert a "no action needed" note
        const audNote = defaultAgendaItem("agm_auditor_ongoing_note");
        const closeIdx5 = items.findIndex(a => a.templateId === "agm_vote_of_thanks");
        items.splice(closeIdx5 >= 0 ? closeIdx5 : items.length, 0, audNote);
      }

      // ── 4. ADDITIONAL DIRECTORS (one agenda item per person) ────
      items = items.filter(a => a.templateId !== "agm_dir_additional_confirm");
      if (prev.additionalDirectors.length > 0) {
        const audPos = items.findIndex(a => ["agm_auditor_appt","agm_auditor_ongoing_note"].includes(a.templateId));
        const closeIdx6 = items.findIndex(a => a.templateId === "agm_vote_of_thanks");
        let insertAt = audPos >= 0 ? audPos : closeIdx6 >= 0 ? closeIdx6 : items.length;
        // Insert one item per additional director (in order)
        for (const addlDir of prev.additionalDirectors) {
          const addDirItem = defaultAgendaItem("agm_dir_additional_confirm");
          addDirItem.fields.dirName = addlDir.name;
          addDirItem.fields.dirDin = addlDir.din;
          addDirItem.fields.dirDesig = addlDir.designation;
          addDirItem.fields.boardApptDate = addlDir.boardApptDate;
          // Personalize title so each is distinguishable
          addDirItem.title = `Appointment of ${addlDir.name || "Additional Director"} as Director`;
          items.splice(insertAt, 0, addDirItem);
          insertAt++;
        }
      }

      return { ...prev, agendaItems: items };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.dividendDecision, f.dirRotationApplicable, f.auditorStatus, f.additionalDirectors]);

  // Already-added template IDs set — for ✓ indicator
  const addedIds = new Set(f.agendaItems.map(a => a.templateId));

  /* ── Company auto-fill ── */
  function applyCompany(data: CompanyData) {
    const activeDirs = (data.directors || []).filter(d => d.isActive);
    const companyDirectors = activeDirs.map(d => ({
      name: d.name,
      designation: d.designation || "Director",
      din: d.din || "",
    }));

    // Auto-pick chairman: MD > WTD > Executive Director > first director
    const chairman =
      activeDirs.find(d => /\bmd\b|managing director/i.test(d.designation || "")) ||
      activeDirs.find(d => /wtd|whole.?time/i.test(d.designation || "")) ||
      activeDirs.find(d => /executive/i.test(d.designation || "")) ||
      activeDirs[0];

    // Auto-populate members from directors (directors are usually shareholders)
    const currentMembersAreBlank =
      f.members.length === 1 && !f.members[0].name && !f.members[0].folioNo;
    const directorMembers: Member[] = companyDirectors.map(d => ({
      id: crypto.randomUUID(),
      name: d.name, folioNo: "", sharesHeld: "",
      isPresent: false, proxy: "", isProxyPresent: false,
      isDirectorMember: true, designation: d.designation,
    }));

    // ── Smart Previous AGM Date ──────────────────────────────────
    // MCA dateOfLastAGM is "DD/MM/YYYY". Auto-fill only if it looks like
    // last year's AGM (within 18 months). If older/stale → skip, let user fill.
    let smartPrevAgmDate: string | undefined;
    if (data.dateOfLastAGM && !f.prevAgmDate) {
      const isoLastAgm = parseMcaDate(data.dateOfLastAGM);
      if (isWithinMonths(isoLastAgm, 18)) {
        // Recent enough — this is likely last year's AGM
        smartPrevAgmDate = isoLastAgm;
      }
      // If older than 18 months → stale data, don't auto-fill
    }

    // ── Auto-detect Additional Directors ────────────────────────
    // Directors with designation containing "Additional Director"
    // and whose appointment date falls within current FY (or last 18 months if FY unknown)
    const detectedAddlDirs = activeDirs.filter(d => {
      const desig = (d.designation || "").toLowerCase();
      if (!desig.includes("additional")) return false;
      const apptIso = parseMcaDate(d.appointedAt || "");
      if (isValidFY(f.financialYear)) {
        // FY known — check if appointed within this FY
        return isWithinFY(apptIso, f.financialYear);
      }
      // FY unknown — check if appointed within last 18 months
      return isWithinMonths(apptIso, 18);
    });
    const autoAddlDirs = detectedAddlDirs.map(d => ({
      name: d.name,
      din: d.din || "",
      designation: "Director",
      boardApptDate: parseMcaDate(d.appointedAt || ""),
    }));

    const patch: Partial<F> = {
      companyName: data.companyName || f.companyName,
      cin: data.cin || f.cin,
      regAddress: data.regAddress || f.regAddress,
      entityType: data.entityType || f.entityType,
      incorporationDate: data.incorporationDate || f.incorporationDate,
      companyDirectors,
      printEmail: data.email || f.printEmail,
      ...(currentMembersAreBlank && directorMembers.length > 0 ? { members: directorMembers } : {}),
      ...(smartPrevAgmDate ? { prevAgmDate: smartPrevAgmDate } : {}),
      ...(autoAddlDirs.length > 0 ? { additionalDirectors: autoAddlDirs } : {}),
      // Auto-fill CTC signatories from top 2 directors (MD/WTD first)
      ctcSignatories: companyDirectors.slice(0, 4).map(d => ({
        name: d.name, designation: d.designation, din: d.din,
      })),
    };
    if (chairman) {
      patch.chairmanName = chairman.name;
      patch.chairmanDesig = chairman.designation || "Director";
    }
    // Auto-fill venue from registered address if blank
    if (!f.venue && data.regAddress) {
      patch.venue = `Registered Office of the Company at ${data.regAddress}`;
    }
    // Auto-fill financial year from dateOfLastAGM if available
    if (data.dateOfLastAGM && !f.financialYear) {
      try {
        const parts = data.dateOfLastAGM.split("/");
        if (parts.length === 3) {
          const agmYear = parseInt(parts[2]);
          const agmMonth = parseInt(parts[1]);
          const fyStartYear = agmMonth >= 4 ? agmYear : agmYear - 1;
          const nextFYStart = fyStartYear + 1;
          const nextFYEnd = String(nextFYStart + 1).slice(-2);
          patch.financialYear = `${nextFYStart}-${nextFYEnd}`;
        }
      } catch { /* ignore */ }
    }
    upd(patch);
  }

  // ── Computed validations ──
  const fyValid = !f.financialYear || isValidFY(f.financialYear);
  const fyEndStr = isValidFY(f.financialYear) ? fyEndDate(f.financialYear) : "";
  const minDate = isValidFY(f.financialYear) ? minAgmDate(f.financialYear) : "";
  const maxDate = isValidFY(f.financialYear) ? maxAgmDate(f.financialYear) : "";
  const meetingDateWarn = f.meetingDate && minDate && f.meetingDate < minDate
    ? `⚠️ AGM date ${fmtDate(f.meetingDate)} is before FY end (${fmtDate(fyEndStr)}). For FY ${f.financialYear}, AGM must be held AFTER ${fmtDate(fyEndStr)}.`
    : f.meetingDate && maxDate && f.meetingDate > maxDate
    ? `⚠️ AGM date ${fmtDate(f.meetingDate)} is after 30 Sep ${maxDate.split("-")[0]}. Under Sec. 96, AGM must be held within 6 months from FY end i.e. by ${fmtDate(maxDate)}.`
    : "";
  const closingTimeWarn = f.closingTime && f.meetingTime && f.closingTime <= f.meetingTime
    ? "⚠️ Closing time must be after start time." : "";
  const suggestedSerial = suggestAgmSerial(f.incorporationDate, f.financialYear);
  const clearDays = calcClearDays(f.noticeDate, f.meetingDate);
  const noticeWarn = f.noticeDate && f.meetingDate && clearDays < 21
    ? `⚠️ Only ${clearDays} clear days between notice (${fmtDate(f.noticeDate)}) and AGM (${fmtDate(f.meetingDate)}). SS-2 / Sec. 101 requires minimum 21 clear days. You may proceed with shorter notice only if consent of ≥95% members is obtained.`
    : "";
  const shorterNoticeConsent = noticeWarn ? `SHORTER NOTICE CONSENT LETTER

Date: ${fmtDate(f.noticeDate)}

To,
The Board of Directors / Company Secretary
${f.companyName || "[COMPANY NAME]"}
${f.cin ? "CIN: " + f.cin : ""}

Sub: Consent for Shorter Notice for ${f.agmSerial} Annual General Meeting

We, the undersigned Members of ${f.companyName || "[COMPANY NAME]"}, holding in aggregate more than 95% (ninety-five percent) of the total paid-up share capital of the Company, hereby give our consent and agree to the holding of the ${f.agmSerial} Annual General Meeting of the Company on ${fmtDate(f.meetingDate)} at ${f.meetingTime || "[TIME]"} at ${f.venue || "[VENUE]"}, on a shorter notice of ${clearDays} clear days, in accordance with the proviso to Section 101(1) of the Companies Act, 2013 read with Secretarial Standard-2 (SS-2).

We confirm that we have received the Notice of the Meeting and are fully aware of the business to be transacted thereat.

Yours faithfully,

[Signatures of Members holding ≥95% paid-up share capital]

Member Name          Folio No.        Shares Held        Signature
_________________    _____________    _______________    ___________
_________________    _____________    _______________    ___________` : "";

  /* ── Validation ── */
  function canNext(): boolean {
    if (step === 0) return !!f.companyName && !!f.cin;
    if (step === 1) return !!f.meetingDate && !!f.venue && !!f.financialYear && isValidFY(f.financialYear) && !!f.chairmanName && f.chairmanName !== "__manual__" && !closingTimeWarn && !meetingDateWarn;
    if (step === 2) return quorumMet(f.members, f.entityType);
    return true;
  }

  /* ── Print ── */
  function openPrint(html: string) {
    const src = session ? html : injectPreviewWatermark(html);
    const url = URL.createObjectURL(new Blob([src], { type: "text/html;charset=utf-8" }));
    const win = window.open(url, "_blank");
    if (!win) { alert("Please allow popups to open."); URL.revokeObjectURL(url); return; }
    if (session) { win.addEventListener("load", () => { win.focus(); win.print(); }); }
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
  }
  function handlePrint()        { openPrint(generateAgmHTML(f)); }
  function handlePrintCtc()     { openPrint(generateCtcHTML(f)); }
  function handlePrintAll()     { openPrint(generateMinutesAndCtcHTML(f)); }

  const ctcCount = f.agendaItems.filter(
    item => item.resolutionType !== "none" && item.resolution.trim()
  ).length;

  /* ── SS-2 Checklist ── */
  const ss2Checklist = buildSs2Checklist(f);
  const ss2Warns = ss2Checklist.filter(c => c.status === "warn").length;

  /* ── Filing Reminders — triggered ── */
  const activeTemplateIds = new Set(f.agendaItems.map(a => a.templateId));
  const triggeredReminders = AGM_FILING_REMINDERS.filter(r =>
    r.trigger.some(t => activeTemplateIds.has(t))
  );

  /* ═══════════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════════ */
  const steps = ["Company", "Meeting", "Attendance", "Agenda", "Preview"];

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <Suspense fallback={null}>
        <RestoreDocWatcher onRestore={setF} onDocId={setExistingDocId} />
      </Suspense>
      <Navbar />

      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1 className="font-extrabold text-slate-900 text-lg leading-tight">
              🏛️ AGM Minutes Generator
            </h1>
            <p className="text-xs text-slate-500">SS-2 Compliant &nbsp;·&nbsp; Companies Act 2013</p>
          </div>
          <div className="flex items-center gap-2">
            {draftSaved && (
              <span className="text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                ✓ Draft saved
              </span>
            )}
            <button
              onClick={() => { if (confirm("Reset all data?")) { setF(INITIAL_F); localStorage.removeItem(DRAFT_KEY); setStep(0); }}}
              className="text-xs text-red-500 hover:text-red-700 px-2.5 py-1 rounded-lg border border-red-200 hover:bg-red-50"
            >
              Reset
            </button>
            <Link href="/tools/documents/minutes" className="text-xs text-blue-600 hover:underline px-2">
              ← All Minutes
            </Link>
          </div>
        </div>
      </div>

      {/* Step Progress */}
      <div className="bg-white border-b border-slate-100 px-4 py-2">
        <div className="max-w-5xl mx-auto flex items-center gap-1 overflow-x-auto">
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => { if (i < step || canNext()) setStep(i); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                i === step ? "bg-purple-600 text-white shadow" :
                i < step ? "bg-purple-100 text-purple-700 hover:bg-purple-200" :
                "text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                i === step ? "bg-white text-purple-600" :
                i < step ? "bg-purple-600 text-white" :
                "bg-slate-200 text-slate-500"
              }`}>{i < step ? "✓" : i + 1}</span>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full px-4 py-6 flex-1">

        {/* ═══════════ STEP 0 — COMPANY ═══════════ */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="font-bold text-slate-800 text-base mb-4">Company Details</h2>

              {/* Excel Upload — shared component */}
              <CompanyExcelUpload onFill={applyCompany} accent="blue" note="Company details + Directors auto-filled." />

              {/* Divider */}
              <div className="flex items-center gap-2 my-4">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-xs text-slate-400 font-medium">or fill manually</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Company Name — CompanySearch IS the input field */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Company Name * <span className="text-slate-400 font-normal">(type to search saved companies)</span>
                  </label>
                  <CompanySearch
                    value={f.companyName}
                    onChange={val => upd({ companyName: val })}
                    onSelect={applyCompany}
                    placeholder="e.g. ABC Technologies Private Limited"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                    accent="blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">CIN *</label>
                  <input className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono"
                    value={f.cin} onChange={e => upd({ cin: e.target.value.toUpperCase() })}
                    placeholder="e.g. U72900MH2010PTC123456" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Entity Type</label>
                  <select className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={f.entityType} onChange={e => upd({ entityType: e.target.value })}>
                    <option>Private Limited Company</option>
                    <option>Public Limited Company</option>
                    <option>One Person Company (OPC)</option>
                    <option>Section 8 Company</option>
                    <option>Nidhi Company</option>
                    <option>Producer Company</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Registered Office Address</label>
                  <textarea className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 h-16 resize-none"
                    value={f.regAddress} onChange={e => upd({ regAddress: e.target.value })}
                    placeholder="Full registered office address as per MCA records" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ STEP 1 — MEETING ═══════════ */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800 text-base">AGM Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* AGM Serial with suggestion */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">AGM Serial *</label>
                {suggestedSerial && suggestedSerial !== f.agmSerial && (
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      💡 Suggested: <b>{suggestedSerial}</b> AGM based on incorporation date
                    </span>
                    <button type="button" onClick={() => upd({ agmSerial: suggestedSerial })}
                      className="text-xs text-blue-700 underline font-semibold">Apply</button>
                  </div>
                )}
                <select className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  value={f.agmSerial} onChange={e => upd({ agmSerial: e.target.value })}>
                  {ORDINAL.slice(1).map(o => <option key={o} value={o}>{o} AGM</option>)}
                </select>
              </div>

              {/* Financial Year with format validation */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Financial Year *
                  <span className="text-slate-400 font-normal ml-1">(format: 2024-25)</span>
                </label>
                <input
                  className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                    f.financialYear && !fyValid ? "border-red-400 bg-red-50" : "border-slate-300"
                  }`}
                  value={f.financialYear}
                  onChange={e => upd({ financialYear: e.target.value.trim() })}
                  placeholder="e.g. 2024-25"
                />
                {f.financialYear && !fyValid && (
                  <p className="text-red-500 text-xs mt-1">❌ Invalid format. Use YYYY-YY (e.g. 2024-25). Short format like &quot;24-25&quot; not accepted.</p>
                )}
                {fyValid && f.financialYear && (
                  <p className="text-green-600 text-xs mt-1">✓ FY ends 31 March {parseInt(f.financialYear.split("-")[0]) + 1}. AGM window: 01 Apr – 30 Sep {parseInt(f.financialYear.split("-")[0]) + 1}</p>
                )}
              </div>

              {/* Meeting Date with validation */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Meeting Date *</label>
                <input type="date"
                  className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 ${meetingDateWarn ? "border-amber-400 bg-amber-50" : "border-slate-300"}`}
                  value={f.meetingDate}
                  min={minDate || undefined}
                  max={maxDate || undefined}
                  onChange={e => upd({ meetingDate: e.target.value })} />
                {meetingDateWarn && <p className="text-amber-700 text-xs mt-1">{meetingDateWarn}</p>}
                {!meetingDateWarn && fyValid && f.financialYear && !f.meetingDate && (
                  <p className="text-slate-400 text-xs mt-1">Suggested range: 01 Apr – 30 Sep {parseInt(f.financialYear.split("-")[0]) + 1}</p>
                )}
              </div>

              {/* Notice Date with 21-day check */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Notice Date <span className="text-slate-400 font-normal">(date notice was sent)</span>
                </label>
                <input type="date"
                  className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 ${noticeWarn ? "border-amber-400 bg-amber-50" : "border-slate-300"}`}
                  value={f.noticeDate}
                  onChange={e => upd({ noticeDate: e.target.value })} />
                {f.noticeDate && f.meetingDate && !noticeWarn && (
                  <p className="text-green-600 text-xs mt-1">✓ {clearDays} clear days — 21-day notice requirement satisfied</p>
                )}
                {noticeWarn && (
                  <div className="mt-1 space-y-1">
                    <p className="text-amber-700 text-xs">{noticeWarn}</p>
                    <button type="button"
                      onClick={() => {
                        const w = window.open("", "_blank");
                        if (w) { w.document.write(`<pre style="font-family:serif;padding:20px;font-size:13px;">${shorterNoticeConsent}</pre>`); w.document.close(); w.print(); }
                      }}
                      className="text-xs bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-lg hover:bg-amber-200 font-semibold">
                      📄 Generate Shorter Notice Consent Letter
                    </button>
                  </div>
                )}
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Meeting Start Time</label>
                <input type="time" className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  value={f.meetingTime} onChange={e => upd({ meetingTime: e.target.value })} />
              </div>

              {/* Closing Time with validation */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Closing Time</label>
                <input type="time"
                  className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 ${closingTimeWarn ? "border-red-400 bg-red-50" : "border-slate-300"}`}
                  value={f.closingTime} onChange={e => upd({ closingTime: e.target.value })} />
                {closingTimeWarn && <p className="text-red-500 text-xs mt-1">{closingTimeWarn}</p>}
              </div>

              {/* Previous AGM Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Previous AGM Date</label>
                <input type="date"
                  className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                    f.prevAgmDate && f.meetingDate && f.prevAgmDate >= f.meetingDate ? "border-red-400 bg-red-50" : "border-slate-300"
                  }`}
                  value={f.prevAgmDate}
                  max={f.meetingDate || undefined}
                  onChange={e => upd({ prevAgmDate: e.target.value })} />
                {f.prevAgmDate && f.meetingDate && f.prevAgmDate >= f.meetingDate && (
                  <p className="text-red-500 text-xs mt-1">❌ Previous AGM date must be before current AGM date.</p>
                )}
                {f.prevAgmDate && !isWithinMonths(f.prevAgmDate, 18) && (
                  <p className="text-amber-600 text-xs mt-1">
                    ⚠️ This date is over 18 months old — please verify it is correct (MCA data may be outdated).
                  </p>
                )}
                {!f.prevAgmDate && (
                  <p className="text-slate-400 text-xs mt-1">
                    Auto-filled if last AGM data found in DB (within 18 months). Fill manually otherwise.
                  </p>
                )}
              </div>

              {/* Venue — auto-filled from address, editable */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-600">Venue / Mode of Meeting *</label>
                  {f.regAddress && f.venue !== `Registered Office of the Company at ${f.regAddress}` && (
                    <button type="button"
                      onClick={() => upd({ venue: `Registered Office of the Company at ${f.regAddress}` })}
                      className="text-xs text-purple-600 underline">Auto-fill from Reg. Office</button>
                  )}
                </div>
                <input className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  value={f.venue} onChange={e => upd({ venue: e.target.value })}
                  placeholder="e.g. Registered Office of the Company at..." />
              </div>

              {/* Chairman — dropdown if directors available, else manual input */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Chairman Name *</label>
                {f.companyDirectors.length > 0 ? (
                  <select
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={f.chairmanName}
                    onChange={e => {
                      const selected = f.companyDirectors.find(d => d.name === e.target.value);
                      upd({ chairmanName: e.target.value, chairmanDesig: selected?.designation || f.chairmanDesig });
                    }}>
                    <option value="">— Select Chairman —</option>
                    {f.companyDirectors.map((d, i) => (
                      <option key={i} value={d.name}>{d.name} ({d.designation})</option>
                    ))}
                    <option value="__manual__">Other (type manually)</option>
                  </select>
                ) : (
                  <input className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={f.chairmanName} onChange={e => upd({ chairmanName: e.target.value })}
                    placeholder="e.g. Mr. Rajesh Kumar Sharma" />
                )}
                {f.chairmanName === "__manual__" && (
                  <input className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="Enter chairman name manually"
                    onChange={e => upd({ chairmanName: e.target.value })} />
                )}
              </div>

              {/* Chairman Designation */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Chairman Designation</label>
                <input className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  value={f.chairmanDesig} onChange={e => upd({ chairmanDesig: e.target.value })}
                  placeholder="e.g. Managing Director / Chairman" />
              </div>

              {/* Prior Board Meeting */}
              <div className="sm:col-span-2 mt-1">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">📋</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-blue-900">Prior Board Meeting <span className="text-xs font-normal text-blue-600">(Mandatory — Sec. 134)</span></p>
                      <p className="text-xs text-blue-700 mb-3">Board MUST approve Financial Statements and recommend dividend before AGM. Enter the Board Meeting where these were approved — this will auto-appear in all relevant agenda items.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Board Meeting Number</label>
                          <select
                            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                            value={f.boardMeetingSerial}
                            onChange={e => upd({ boardMeetingSerial: e.target.value })}>
                            <option value="">— Select —</option>
                            {ORDINAL.slice(1).map(o => <option key={o} value={o}>{o} Meeting</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Board Meeting Date</label>
                          <input type="date"
                            className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                              f.boardMeetingDate && f.meetingDate && f.boardMeetingDate >= f.meetingDate ? "border-red-400 bg-red-50" : "border-slate-300"
                            }`}
                            value={f.boardMeetingDate}
                            max={f.meetingDate || undefined}
                            onChange={e => upd({ boardMeetingDate: e.target.value })} />
                          {f.boardMeetingDate && f.meetingDate && f.boardMeetingDate >= f.meetingDate && (
                            <p className="text-red-500 text-xs mt-1">❌ Board Meeting must be before AGM date.</p>
                          )}
                        </div>
                      </div>
                      {f.boardMeetingSerial && f.boardMeetingDate && (
                        <p className="text-green-700 text-xs mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                          ✓ <b>{f.boardMeetingSerial} Board Meeting</b> held on <b>{fmtDate(f.boardMeetingDate)}</b> — will be auto-referenced in Financial Statements Adoption, Dividend Declaration, and Auditor Appointment agenda items.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Meeting Decisions ── */}
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-1">📋 Meeting Decisions</h3>
                <p className="text-xs text-slate-400 mb-3">These control which agenda items are auto-inserted. You can always edit/remove items in the Agenda step.</p>
              </div>

              {/* Dividend */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">💸</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">Final Dividend Declaration</p>
                    <p className="text-xs text-slate-400 mb-2">Under Sec. 123 — Board must recommend; Members declare (cannot exceed Board's recommendation)</p>
                    <select
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      value={f.dividendDecision}
                      onChange={e => upd({ dividendDecision: e.target.value as F["dividendDecision"] })}>
                      <option value="declare">✅ Board recommended — Members will declare dividend</option>
                      <option value="no_board_recommendation">🚫 Board did NOT recommend any dividend (no proposal)</option>
                      <option value="declared_nil">❌ Board recommended — but AGM will NOT declare (override/decline)</option>
                    </select>
                    {f.dividendDecision === "no_board_recommendation" && (
                      <p className="text-xs text-blue-600 mt-1.5 bg-blue-50 px-2 py-1 rounded">
                        ℹ️ A note item will be added: "No dividend recommended by Board for FY..."
                      </p>
                    )}
                    {f.dividendDecision === "declared_nil" && (
                      <p className="text-xs text-amber-700 mt-1.5 bg-amber-50 px-2 py-1 rounded">
                        ⚠️ A resolution will be added declining the Board's recommended dividend (Members' right under Sec. 123(1))
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Director Rotation */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">🔄</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">Re-appointment of Director by Rotation</p>
                    <p className="text-xs text-slate-400 mb-2">Under Sec. 152(6) — 1/3rd of rotational directors retire each AGM. Independent / MD / WTD are exempt.</p>
                    <select
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      value={f.dirRotationApplicable}
                      onChange={e => upd({ dirRotationApplicable: e.target.value as F["dirRotationApplicable"] })}>
                      <option value="yes">✅ Yes — a Director is retiring by rotation and will be re-appointed</option>
                      <option value="no">ℹ️ No Director retiring by rotation at this AGM (note to be added)</option>
                      <option value="not_applicable">🚫 Not applicable — all directors are not liable to retire by rotation</option>
                    </select>
                    {(f.dirRotationApplicable === "no" || f.dirRotationApplicable === "not_applicable") && (
                      <p className="text-xs text-blue-600 mt-1.5 bg-blue-50 px-2 py-1 rounded">
                        ℹ️ A note item will be added in minutes recording that no director retires by rotation at this AGM
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Auditor Status */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">🔍</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">Statutory Auditor Status</p>
                    <p className="text-xs text-slate-400 mb-2">Under Sec. 139 — Appointed for 5 years (1st to 6th AGM). Annual ratification removed by 2017 Amendment. Action needed only at appointment/re-appointment AGM.</p>
                    <select
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      value={f.auditorStatus}
                      onChange={e => upd({ auditorStatus: e.target.value as F["auditorStatus"] })}>
                      <option value="fresh_appt">📌 Fresh Appointment — new auditor being appointed for first time / new term</option>
                      <option value="reappt_new_term">🔁 Re-appointment for new 5-year term (previous term expiring)</option>
                      <option value="ongoing_term">✅ Term ongoing — NO action required at this AGM (2nd–5th year of term)</option>
                    </select>
                    {f.auditorStatus === "ongoing_term" && (
                      <p className="text-xs text-green-700 mt-1.5 bg-green-50 px-2 py-1 rounded">
                        ✅ No auditor resolution needed. A note will be added confirming ongoing appointment.
                      </p>
                    )}
                    {f.auditorStatus === "reappt_new_term" && (
                      <p className="text-xs text-amber-700 mt-1.5 bg-amber-50 px-2 py-1 rounded">
                        ⚠️ Existing term expiring — a fresh appointment resolution for new 5-year term will be added.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Directors */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">👤</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-slate-700">Additional Directors to Confirm</p>
                      {f.additionalDirectors.length > 0 && (
                        <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full border border-purple-200">
                          {f.additionalDirectors.length} auto-detected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mb-3">
                      Under Sec. 160/161 — Board-appointed Additional Director ceases at next AGM. One agenda item (Ordinary Resolution) per person.
                    </p>

                    {/* Detected / added directors list */}
                    {f.additionalDirectors.length > 0 ? (
                      <div className="space-y-2 mb-3">
                        {f.additionalDirectors.map((d, i) => (
                          <div key={i} className="flex items-center gap-2 bg-white border border-purple-200 rounded-lg px-3 py-2">
                            <span className="text-purple-600 font-bold text-xs">👤</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate">{d.name || "—"}</p>
                              <p className="text-[10px] text-slate-400">
                                DIN: {d.din || "—"} &nbsp;·&nbsp; Board appt: {d.boardApptDate ? fmtDate(d.boardApptDate) : "—"}
                              </p>
                            </div>
                            {/* Edit boardApptDate inline */}
                            <input type="date"
                              className="border border-slate-200 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                              value={d.boardApptDate}
                              title="Board appointment date"
                              onChange={e => {
                                const updated = [...f.additionalDirectors];
                                updated[i] = { ...updated[i], boardApptDate: e.target.value };
                                upd({ additionalDirectors: updated });
                              }} />
                            <button
                              onClick={() => upd({ additionalDirectors: f.additionalDirectors.filter((_, j) => j !== i) })}
                              className="text-red-400 hover:text-red-600 font-bold text-base px-1 flex-shrink-0" title="Remove">×</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic mb-3">No additional directors detected. Add manually if needed.</p>
                    )}

                    {/* Add manually */}
                    <button
                      type="button"
                      onClick={() => upd({
                        additionalDirectors: [
                          ...f.additionalDirectors,
                          { name: "", din: "", designation: "Director", boardApptDate: "" },
                        ],
                      })}
                      className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 px-3 py-1.5 rounded-lg">
                      + Add Additional Director
                    </button>

                    {/* Inline name/DIN edit for any blank entries */}
                    {f.additionalDirectors.some(d => !d.name) && (
                      <div className="mt-2 space-y-2">
                        {f.additionalDirectors.map((d, i) => !d.name && (
                          <div key={i} className="grid grid-cols-3 gap-2">
                            <input className="border border-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400 col-span-1"
                              placeholder="Director name"
                              value={d.name}
                              onChange={e => {
                                const updated = [...f.additionalDirectors];
                                updated[i] = { ...updated[i], name: e.target.value };
                                upd({ additionalDirectors: updated });
                              }} />
                            <input className="border border-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                              placeholder="DIN"
                              value={d.din}
                              onChange={e => {
                                const updated = [...f.additionalDirectors];
                                updated[i] = { ...updated[i], din: e.target.value };
                                upd({ additionalDirectors: updated });
                              }} />
                            <input className="border border-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                              placeholder="Designation (after confirm)"
                              value={d.designation}
                              onChange={e => {
                                const updated = [...f.additionalDirectors];
                                updated[i] = { ...updated[i], designation: e.target.value };
                                upd({ additionalDirectors: updated });
                              }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Print settings */}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Print / Letterhead Settings</h3>
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input type="checkbox" className="w-4 h-4 accent-purple-600"
                  checked={f.printOnLetterhead} onChange={e => upd({ printOnLetterhead: e.target.checked })} />
                <span className="text-sm text-slate-700">Include Company Letterhead in print</span>
              </label>
              {f.printOnLetterhead && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="Email for letterhead" value={f.printEmail}
                    onChange={e => upd({ printEmail: e.target.value })} />
                  <input className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="Phone for letterhead" value={f.printMobile}
                    onChange={e => upd({ printMobile: e.target.value })} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════ STEP 2 — ATTENDANCE ═══════════ */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Quorum banner */}
            {(() => {
              const req = quorumRequired(f.entityType);
              const personally = f.members.filter(m => m.isPresent && !m.isProxyPresent).length;
              const met = personally >= req;
              return (
                <div className={`rounded-xl border-2 px-5 py-3 flex items-center gap-3 ${met ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
                  <span className="text-2xl">{met ? "✅" : "⚠️"}</span>
                  <div>
                    <p className={`font-bold text-sm ${met ? "text-green-800" : "text-red-800"}`}>
                      Quorum: {personally} of {req} required members present in person
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      SS-2 / Sec. 103 — {f.entityType} requires {req} member(s) personally present (proxies don't count for quorum)
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Members Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <h2 className="font-bold text-slate-800">Members / Shareholders Attendance</h2>
                  {f.members.some(m => m.isDirectorMember) && (
                    <p className="text-xs text-purple-600 mt-0.5">
                      👥 Directors auto-filled as members — just add Folio No. &amp; Shares Held
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {f.companyDirectors.length > 0 && (
                    <button
                      onClick={() => {
                        // Add any director not already in the list
                        const existingNames = new Set(f.members.map(m => m.name.toLowerCase()));
                        const missing = f.companyDirectors.filter(d => !existingNames.has(d.name.toLowerCase()));
                        if (missing.length === 0) return;
                        const newMembers: Member[] = missing.map(d => ({
                          id: crypto.randomUUID(),
                          name: d.name, folioNo: "", sharesHeld: "",
                          isPresent: false, proxy: "", isProxyPresent: false,
                          isDirectorMember: true, designation: d.designation,
                        }));
                        upd({ members: [...f.members, ...newMembers] });
                      }}
                      className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 px-3 py-1.5 rounded-lg">
                      + Add Directors
                    </button>
                  )}
                  <button onClick={addMember}
                    className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-lg">
                    + Add Member
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs text-slate-500 font-semibold uppercase">
                      <th className="px-4 py-3 text-left">Member Name</th>
                      <th className="px-3 py-3 text-left">Folio No.</th>
                      <th className="px-3 py-3 text-left">Shares Held</th>
                      <th className="px-3 py-3 text-center">Present<br/>(In Person)</th>
                      <th className="px-3 py-3 text-left">Proxy Holder Name</th>
                      <th className="px-3 py-3 text-center">Proxy<br/>Present</th>
                      <th className="px-3 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {f.members.map((m) => (
                      <tr key={m.id} className={`border-t border-slate-100 ${m.isPresent || m.isProxyPresent ? "bg-green-50" : ""}`}>
                        <td className="px-4 py-2">
                          {m.isDirectorMember ? (
                            // Director-member: name is read-only, show badge
                            <div>
                              <p className="text-xs font-semibold text-slate-800">{m.name}</p>
                              <span className="inline-block mt-0.5 text-[10px] font-bold text-purple-700 bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded-full">
                                🏢 {m.designation || "Director"}
                              </span>
                            </div>
                          ) : (
                            <input className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                              placeholder="Member name" value={m.name}
                              onChange={e => updMember(m.id, { name: e.target.value })} />
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                            placeholder="Folio/DP" value={m.folioNo}
                            onChange={e => updMember(m.id, { folioNo: e.target.value })} />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                            placeholder="No. of shares" value={m.sharesHeld}
                            onChange={e => updMember(m.id, { sharesHeld: e.target.value })} />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input type="checkbox" className="w-4 h-4 accent-green-600"
                            checked={m.isPresent}
                            onChange={e => updMember(m.id, { isPresent: e.target.checked })} />
                        </td>
                        <td className="px-3 py-2">
                          <input className="w-32 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                            placeholder="Proxy holder name" value={m.proxy}
                            onChange={e => updMember(m.id, { proxy: e.target.value })} />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input type="checkbox" className="w-4 h-4 accent-blue-600"
                            checked={m.isProxyPresent}
                            disabled={!m.proxy.trim()}
                            onChange={e => updMember(m.id, { isProxyPresent: e.target.checked })} />
                        </td>
                        <td className="px-3 py-2">
                          {f.members.length > 1 && (
                            <button onClick={() => removeMember(m.id)}
                              className="text-red-400 hover:text-red-600 font-bold text-lg px-1" title="Remove">×</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 bg-slate-50 text-xs text-slate-500 border-t border-slate-100 flex flex-wrap gap-3">
                <span>💡 Proxies can attend and vote, but do <b>not</b> count for quorum (SS-2)</span>
                <span className="text-slate-300">|</span>
                <span>🏢 <b>Purple badge</b> = auto-filled from company directors</span>
              </div>
            </div>

            {/* Invitees */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800 text-sm">Others Present (By Invitation)</h2>
                <button onClick={addInvitee}
                  className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-lg">
                  + Add
                </button>
              </div>
              {f.invitees.length === 0 ? (
                <p className="px-5 py-4 text-sm text-slate-400">No invitees added. (Optional — Auditor, CS, CFO, etc.)</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {f.invitees.map(inv => (
                    <div key={inv.id} className="flex items-center gap-3 px-5 py-3">
                      <input className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
                        placeholder="Name" value={inv.name}
                        onChange={e => updInvitee(inv.id, { name: e.target.value })} />
                      <input className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
                        placeholder="Designation (e.g. Statutory Auditor)" value={inv.designation}
                        onChange={e => updInvitee(inv.id, { designation: e.target.value })} />
                      <button onClick={() => removeInvitee(inv.id)}
                        className="text-red-400 hover:text-red-600 font-bold text-lg">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════ STEP 3 — AGENDA ═══════════ */}
        {step === 3 && (
          <div className="space-y-4">

            {/* Header bar */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
              <p className="text-sm text-slate-600 font-medium">
                {f.agendaItems.length} items · {f.agendaItems.filter(a => a.resolutionType !== "none").length} resolution{f.agendaItems.filter(a => a.resolutionType !== "none").length !== 1 ? "s" : ""}
              </p>
              <button type="button"
                onClick={() => { setShowAddAgenda(!showAddAgenda); setTemplateSearch(""); }}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition">
                + Add Agenda Item
              </button>
            </div>

            {/* Template picker — Board Meeting style */}
            {showAddAgenda && (
              <div className="border-2 border-purple-200 rounded-2xl bg-purple-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-purple-800">Select Agenda Item Template</p>
                  <button type="button"
                    onClick={() => { setShowAddAgenda(false); setTemplateSearch(""); }}
                    className="text-slate-400 hover:text-slate-600 text-xs font-medium">
                    ✕ Close
                  </button>
                </div>

                {/* Search box */}
                <input
                  type="text"
                  value={templateSearch}
                  onChange={e => setTemplateSearch(e.target.value)}
                  placeholder="🔍 Search agenda items... (e.g. dividend, director, auditor)"
                  className="w-full border border-purple-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
                  autoFocus
                />

                {/* Categories with items */}
                <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
                  {AGM_CATEGORY_ORDER.map(cat => {
                    const meta = AGM_CATEGORY_META[cat];
                    const templates = ALL_AGM_TEMPLATES.filter(t =>
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
                                    : "border-slate-200 bg-white hover:border-purple-400 hover:bg-purple-50 text-slate-700"
                                }`}>
                                <span className="text-base shrink-0">{t.icon}</span>
                                <span className="flex-1 text-xs leading-tight">{t.title}</span>
                                {alreadyAdded
                                  ? <span className="text-xs text-green-600 font-bold shrink-0">✓</span>
                                  : <span className="text-xs text-purple-500 font-bold shrink-0">+</span>
                                }
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* No results */}
                  {templateSearch !== "" && ALL_AGM_TEMPLATES.filter(t =>
                    t.title.toLowerCase().includes(templateSearch.toLowerCase())
                  ).length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">
                      No matching templates found for &quot;{templateSearch}&quot;
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Agenda Cards */}
            <div className="space-y-3">
              {f.agendaItems.map((item, idx) => {
                const tpl = ALL_AGM_TEMPLATES.find(t => t.id === item.templateId);
                return (
                  <AgendaCard
                    key={item.id} item={item} tpl={tpl} idx={idx}
                    onChange={updated => updAgenda(item.id, updated)}
                    onRemove={() => removeAgenda(item.id)}
                    canRemove={!DEFAULT_ITEM_IDS.includes(item.templateId)}
                    globalFields={{ boardMeetingSerial: f.boardMeetingSerial, boardMeetingDate: f.boardMeetingDate ? fmtDate(f.boardMeetingDate) : "" }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════ STEP 4 — PREVIEW ═══════════ */}
        {step === 4 && (
          <div className="space-y-4">
            {/* Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="font-bold text-slate-800 text-base mb-4">📋 Minutes Summary</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                {[
                  { label: "AGM No.", val: `${f.agmSerial} AGM`, icon: "🏛️" },
                  { label: "Financial Year", val: f.financialYear || "—", icon: "📅" },
                  { label: "Members Present", val: f.members.filter(m => m.isPresent || m.isProxyPresent).length, icon: "👥" },
                  { label: "Agenda Items", val: f.agendaItems.length, icon: "📌" },
                ].map((s, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3">
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <div className="font-bold text-slate-900 text-sm">{s.val}</div>
                    <div className="text-xs text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* SS-2 Checklist */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setShowSs2(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 text-left">
                <div>
                  <h3 className="font-bold text-slate-800">SS-2 Compliance Checklist</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Secretarial Standard-2 — Annual General Meeting</p>
                </div>
                <div className="flex items-center gap-2">
                  {ss2Warns > 0 && (
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200">
                      {ss2Warns} warning{ss2Warns > 1 ? "s" : ""}
                    </span>
                  )}
                  {ss2Warns === 0 && (
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">
                      ✓ All checks passed
                    </span>
                  )}
                  <span className="text-slate-400">{showSs2 ? "▲" : "▼"}</span>
                </div>
              </button>
              {showSs2 && (
                <div className="border-t border-slate-100 px-5 py-4 space-y-2">
                  {ss2Checklist.map((c, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className={`mt-0.5 text-base flex-shrink-0 ${c.status === "ok" ? "text-green-500" : c.status === "warn" ? "text-red-500" : "text-amber-500"}`}>
                        {c.status === "ok" ? "✅" : c.status === "warn" ? "❌" : "⚠️"}
                      </span>
                      <p className="text-sm text-slate-700">{c.label}
                        {c.status === "manual" && <span className="ml-1.5 text-xs text-amber-600 font-medium">(Manual check)</span>}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ROC Filing Reminders */}
            {triggeredReminders.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                <button
                  onClick={() => setShowReminders(v => !v)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left">
                  <div>
                    <h3 className="font-bold text-slate-800">📌 ROC Filing Reminders</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Post-AGM compliance filings based on agenda</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-200">
                      {triggeredReminders.length} form{triggeredReminders.length > 1 ? "s" : ""}
                    </span>
                    <span className="text-slate-400">{showReminders ? "▲" : "▼"}</span>
                  </div>
                </button>
                {showReminders && (
                  <div className="border-t border-slate-100 px-5 py-4 space-y-2">
                    {triggeredReminders.map((r, i) => (
                      <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
                        <span className="font-black text-sm px-2 py-1 rounded-lg text-white flex-shrink-0"
                          style={{ background: r.color, fontSize: "10px", letterSpacing: "0.3px" }}>
                          {r.form}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{r.desc}</p>
                          <p className="text-xs text-slate-500 mt-0.5">⏰ {r.dueDesc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CTC Signatories */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-slate-800">✍️ CTC Signatories</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Who will sign the Certified True Copies — auto-filled from directors. Edit as needed.
                  </p>
                </div>
                <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2.5 py-1 rounded-full border border-purple-200">
                  {ctcCount} CTC{ctcCount !== 1 ? "s" : ""} will be generated
                </span>
              </div>
              <div className="space-y-2">
                {f.ctcSignatories.map((s, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      className="col-span-4 border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      placeholder="Director / CS name"
                      value={s.name}
                      onChange={e => {
                        const updated = [...f.ctcSignatories];
                        updated[i] = { ...updated[i], name: e.target.value };
                        upd({ ctcSignatories: updated });
                      }} />
                    <input
                      className="col-span-4 border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      placeholder="Designation"
                      value={s.designation}
                      onChange={e => {
                        const updated = [...f.ctcSignatories];
                        updated[i] = { ...updated[i], designation: e.target.value };
                        upd({ ctcSignatories: updated });
                      }} />
                    <input
                      className="col-span-3 border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-400"
                      placeholder="DIN (optional)"
                      value={s.din}
                      onChange={e => {
                        const updated = [...f.ctcSignatories];
                        updated[i] = { ...updated[i], din: e.target.value };
                        upd({ ctcSignatories: updated });
                      }} />
                    <button
                      onClick={() => upd({ ctcSignatories: f.ctcSignatories.filter((_, j) => j !== i) })}
                      className="col-span-1 text-red-400 hover:text-red-600 font-bold text-lg text-center">×</button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => upd({ ctcSignatories: [...f.ctcSignatories, { name: "", designation: "Director", din: "" }] })}
                className="mt-3 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 px-3 py-1.5 rounded-lg">
                + Add Signatory
              </button>
            </div>

            {/* Print Buttons */}
            <div className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl p-5 text-white shadow-lg">
              <h3 className="font-extrabold text-lg mb-1 text-center">Ready to Print / Save as PDF</h3>
              <p className="text-purple-200 text-sm mb-5 text-center">
                A4 print-ready document opens in new window. Use browser <b>Print → Save as PDF</b>.
              </p>
              {/* Primary — Print All */}
              <button
                onClick={handlePrintAll}
                className="w-full bg-white text-purple-700 font-extrabold px-6 py-3.5 rounded-xl hover:bg-purple-50 transition-all shadow hover:scale-[1.02] text-sm mb-3 flex items-center justify-center gap-2">
                🖨️ Print All — Minutes + {ctcCount} CTC{ctcCount !== 1 ? "s" : ""}
                <span className="text-xs bg-purple-100 text-purple-600 font-bold px-2 py-0.5 rounded-full">{ctcCount} CTC{ctcCount !== 1 ? "s" : ""}</span>
              </button>
              {/* Secondary options */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handlePrint}
                  className="bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all border border-white/30">
                  📄 Minutes Only
                </button>
                <button
                  onClick={handlePrintCtc}
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
        )}

        {/* Nav Buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
            ← Previous
          </button>

          {step < steps.length - 1 && (
            <button
              onClick={() => { if (canNext()) setStep(s => s + 1); }}
              disabled={!canNext()}
              className="px-6 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:scale-105 transition-all">
              {step === 2 && !quorumMet(f.members, f.entityType)
                ? `⚠️ Quorum not met (need ${quorumRequired(f.entityType)})`
                : "Next →"}
            </button>
          )}

          {step === steps.length - 1 && (
            <button
              onClick={handlePrintAll}
              className="px-6 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 shadow-md hover:scale-105 transition-all">
              🖨️ Print All (Minutes + {ctcCount} CTCs)
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-5 px-4 mt-4 bg-white">
        <div className="max-w-5xl mx-auto text-center text-xs text-slate-400">
          <Link href="/tools/documents/minutes" className="text-blue-500 hover:underline">← All Minutes</Link>
          {" · "}AGM Minutes Generator — ComplianceSearch.in
          {" · "}SS-2 / Companies Act 2013
        </div>
      </footer>
    </main>
  );
}
