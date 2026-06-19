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
  ALL_EGM_TEMPLATES,
  EGM_CATEGORY_ORDER,
  EGM_CATEGORY_META,
  fillEgmTemplate,
  type EgmAgendaTemplate,
} from "@/lib/egm-agenda-templates";
import { generateCtcDocument, type CtcParams } from "@/lib/ctc-generator";

/* ══════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════ */
interface Member {
  id: string;
  name: string;
  folioNo: string;
  sharesHeld: string;
  isPresent: boolean;
  proxy: string;
  isProxyPresent: boolean;
  isDirectorMember?: boolean;
  designation?: string;
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

  // Step 2 — EGM Details
  egmSerial: string;
  egmPurpose: string;
  calledBy: "board" | "members_requisition" | "nclt";
  meetingDate: string;
  meetingTime: string;
  closingTime: string;
  venue: string;
  chairmanName: string;
  chairmanDesig: string;
  noticeDate: string;

  // Prior Board Meeting (Sec. 100 — Board must pass resolution to convene EGM)
  boardMeetingSerial: string;
  boardMeetingDate: string;

  // Step 3 — Members
  members: Member[];
  invitees: Invitee[];

  // Step 4 — Agenda
  agendaItems: AgendaItemData[];

  // CTC signatories
  ctcSignatories: Array<{ name: string; designation: string; din: string }>;

  // Print
  printOnLetterhead: boolean;
  printMobile: string;
  printEmail: string;
}

/* ══════════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════════ */
const DRAFT_KEY = "csi_egm_draft_v1";
const ORDINAL = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];

const MANDATORY_ROUTINE_IDS = ["egm_chairman", "egm_quorum", "egm_notice_read"];
const MANDATORY_CLOSING_IDS = ["egm_vote_of_thanks"];
const DEFAULT_ITEM_IDS = [...MANDATORY_ROUTINE_IDS, ...MANDATORY_CLOSING_IDS];

const BLANK_MEMBER = (): Member => ({
  id: crypto.randomUUID(), name: "", folioNo: "", sharesHeld: "",
  isPresent: false, proxy: "", isProxyPresent: false,
});
const BLANK_INVITEE = (): Invitee => ({ id: crypto.randomUUID(), name: "", designation: "" });

/* ══════════════════════════════════════════════════════════════════
   QUORUM LOGIC — SS-2 / Sec. 103
══════════════════════════════════════════════════════════════════ */
function quorumRequired(entityType: string): number {
  if (entityType === "One Person Company (OPC)") return 1;
  if (entityType === "Public Limited Company") return 5;
  return 2;
}
function quorumMet(members: Member[], entityType: string): boolean {
  return members.filter(m => m.isPresent && !m.isProxyPresent).length >= quorumRequired(entityType);
}
function calcClearDays(noticeDate: string, meetingDate: string): number {
  if (!noticeDate || !meetingDate) return 999;
  return Math.floor((new Date(meetingDate).getTime() - new Date(noticeDate).getTime()) / 86400000) - 1;
}
function fmtDate(d: string): string {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }); }
  catch { return d; }
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
function parseMcaDate(d: string): string {
  if (!d) return "";
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : d;
}

/* ══════════════════════════════════════════════════════════════════
   INITIAL STATE
══════════════════════════════════════════════════════════════════ */
function defaultAgendaItem(templateId: string): AgendaItemData {
  const tpl = ALL_EGM_TEMPLATES.find(t => t.id === templateId);
  if (!tpl) return {
    id: crypto.randomUUID(), templateId, title: templateId,
    discussion: "", resolution: "", resolutionType: "none",
    fields: {}, votingMode: "na", votingResult: "",
  };
  return {
    id: crypto.randomUUID(), templateId,
    title: tpl.title, discussion: tpl.discussion,
    resolution: tpl.resolution, resolutionType: tpl.resolutionType,
    fields: Object.fromEntries(tpl.fields.map(f => [f.key, ""])),
    votingMode: tpl.resolutionType === "none" ? "na" : "show_of_hands",
    votingResult: "",
  };
}

const INITIAL_F: F = {
  companyName: "", cin: "", regAddress: "", entityType: "Private Limited Company",
  incorporationDate: "", companyDirectors: [],
  egmSerial: "1st", egmPurpose: "", calledBy: "board",
  meetingDate: "", meetingTime: "11:00", closingTime: "", venue: "",
  chairmanName: "", chairmanDesig: "Chairman", noticeDate: "",
  boardMeetingSerial: "", boardMeetingDate: "",
  members: [BLANK_MEMBER()], invitees: [],
  agendaItems: DEFAULT_ITEM_IDS.map(defaultAgendaItem),
  ctcSignatories: [{ name: "", designation: "Director", din: "" }, { name: "", designation: "Director", din: "" }],
  printOnLetterhead: true, printMobile: "", printEmail: "",
};

/* ══════════════════════════════════════════════════════════════════
   GENERATE MINUTES HTML
══════════════════════════════════════════════════════════════════ */
function generateEgmHTML(f: F): string {
  const present = f.members.filter(m => m.isPresent || m.isProxyPresent);
  const inPerson = f.members.filter(m => m.isPresent && !m.isProxyPresent);
  const byProxy = f.members.filter(m => m.isProxyPresent && !m.isPresent);
  const totalSharesPresent = present.reduce((s, m) => s + (parseInt(m.sharesHeld) || 0), 0);

  let ordinaryCount = 0, specialCount = 0;

  const tdStyle = "padding:7px 12px;font-size:11px;color:#374151;border:1px solid #e2e8f0;";
  const thStyle = "padding:8px 12px;background:#1e3a5f;color:#fff;font-size:10.5px;font-weight:700;text-align:left;border:1px solid #1e3a5f;";
  const tdStyle2 = "padding:7px 12px;font-size:11px;color:#374151;border:1px solid #e2e8f0;";

  const calledByLabel = f.calledBy === "members_requisition" ? "Members' Requisition (Sec. 100)"
    : f.calledBy === "nclt" ? "NCLT Order (Sec. 98)" : "Board of Directors";

  const boardMeetingRef = f.calledBy === "board" && f.boardMeetingDate
    ? `This Meeting was convened pursuant to the Resolution of the Board of Directors passed at its ${f.boardMeetingSerial ? f.boardMeetingSerial + " " : ""}Meeting held on ${fmtDate(f.boardMeetingDate)}, approving the agenda and authorising the issue of Notice for this Extraordinary General Meeting under Section 100 of the Companies Act, 2013.`
    : "";

  const globalFields: Record<string, string> = {
    boardMeetingSerial: f.boardMeetingSerial || "",
    boardMeetingDate: f.boardMeetingDate ? fmtDate(f.boardMeetingDate) : "",
    boardMeetingRef,
  };

  const agendaRows = f.agendaItems.map((item, idx) => {
    const filled = fillEgmTemplate(item.discussion, { ...globalFields, ...item.fields });
    const resFilled = item.resolution ? fillEgmTemplate(item.resolution, { ...globalFields, ...item.fields }) : "";
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
        <div style="margin-top:12px;background:${rType === "special" ? "#fffbeb" : "#f0fdf4"};border-left:4px solid ${rType === "special" ? "#f59e0b" : "#16a34a"};padding:14px 18px;border-radius:0 6px 6px 0;">
          <p style="font-weight:700;font-size:11px;color:${rType === "special" ? "#92400e" : "#15803d"};text-transform:uppercase;margin:0 0 8px 0;">
            ${rType === "special" ? "⚡ Special" : "✅ Ordinary"} Resolution — Item ${idx + 1}
            ${voteLabel ? ` &nbsp;|&nbsp; Voted ${voteLabel}` : ""}
            ${voteResult ? ` &nbsp;|&nbsp; <span style="color:#1d4ed8">${voteResult}</span>` : ""}
          </p>
          <p style="margin:0;white-space:pre-wrap;font-size:11px;line-height:1.7;color:${rType === "special" ? "#78350f" : "#064e3b"};">${resFilled}</p>
        </div>`;
    }
    return `
      <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #e2e8f0;">
        <p style="font-weight:700;font-size:12px;color:#1e293b;margin:0 0 8px 0;">${idx + 1}. ${fillEgmTemplate(item.title, { ...globalFields, ...item.fields })}</p>
        <p style="font-size:11.5px;color:#374151;line-height:1.7;margin:0;white-space:pre-wrap;">${filled}</p>
        ${resBlock}
      </div>`;
  }).join("");

  const memberRows = f.members.map(m => {
    const status = m.isPresent && !m.isProxyPresent ? "Present in Person"
      : m.isProxyPresent ? `Present by Proxy (${m.proxy || "—"})` : "Absent";
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

  const letterheadBlock = f.printOnLetterhead ? `
    <div style="text-align:center;border-bottom:3px double #1e3a5f;padding-bottom:14px;margin-bottom:20px;">
      <h2 style="margin:0;font-size:20px;font-weight:900;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;">${f.companyName || "[COMPANY NAME]"}</h2>
      <p style="margin:4px 0 0 0;font-size:11px;color:#475569;">CIN: ${f.cin || "—"}</p>
      <p style="margin:2px 0 0 0;font-size:11px;color:#475569;">Registered Office: ${f.regAddress || "—"}</p>
      ${f.printEmail ? `<p style="margin:2px 0 0 0;font-size:11px;color:#475569;">Email: ${f.printEmail}${f.printMobile ? " | Tel: " + f.printMobile : ""}</p>` : ""}
    </div>` : "";

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>EGM Minutes — ${f.companyName}</title>
  <style>
    @page { size:A4; margin:20mm 18mm; }
    *, *::before, *::after { box-sizing: border-box; }
    html { background:#c8c8c8; }
    body {
      font-family:'Times New Roman',Times,serif; font-size:12px; color:#1a1a1a;
      width:210mm; max-width:210mm; margin:8mm auto; padding:12mm 18mm;
      background:#fff; text-align:justify;
    }
    p, td, th, span { overflow-wrap:break-word; word-wrap:break-word; }
    @media print {
      html { background:transparent; }
      body { width:100%; max-width:100%; margin:0; padding:0; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    }
    table { border-collapse:collapse; width:100%; }
  </style>
  </head><body>
  <div style="width:100%;">

    ${letterheadBlock}

    <h3 style="text-align:center;font-size:15px;font-weight:900;text-transform:uppercase;color:#1e3a5f;margin:0 0 4px 0;letter-spacing:0.5px;">
      MINUTES OF THE ${f.egmSerial ? f.egmSerial.toUpperCase() + " " : ""}EXTRAORDINARY GENERAL MEETING
    </h3>
    <p style="text-align:center;font-size:11px;color:#64748b;margin:0 0 18px 0;">
      ${f.companyName} &nbsp;|&nbsp; ${f.meetingDate || "—"}
    </p>

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
          <td style="${tdStyle2}font-weight:700;background:#f8fafc;">EGM Serial</td>
          <td style="${tdStyle2}">${f.egmSerial || "—"} EGM</td>
          <td style="${tdStyle2}font-weight:700;background:#f8fafc;">Called By</td>
          <td style="${tdStyle2}">${calledByLabel}</td>
        </tr>
        <tr>
          <td style="${tdStyle2}font-weight:700;background:#f8fafc;">Chairman</td>
          <td style="${tdStyle2}" colspan="3">${f.chairmanName || "—"}${f.chairmanDesig ? ", " + f.chairmanDesig : ""}</td>
        </tr>
        ${f.egmPurpose ? `<tr>
          <td style="${tdStyle2}font-weight:700;background:#f8fafc;">Purpose</td>
          <td style="${tdStyle2}" colspan="3">${f.egmPurpose}</td>
        </tr>` : ""}
        ${f.boardMeetingDate ? `<tr>
          <td style="${tdStyle2}font-weight:700;background:#fef3c7;color:#92400e;">Prior Board Meeting</td>
          <td style="${tdStyle2}" colspan="3">${f.boardMeetingSerial ? f.boardMeetingSerial + " Meeting held on " : "Held on "}${fmtDate(f.boardMeetingDate)} — Board resolved to convene this EGM (Sec. 100)</td>
        </tr>` : ""}
      </tbody>
    </table>

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
        <th style="${thStyle}">Name</th><th style="${thStyle}">Designation</th>
      </tr></thead>
      <tbody>${inviteeRows}</tbody>
    </table>` : ""}

    <h4 style="font-size:12px;font-weight:800;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:4px;margin:16px 0 14px 0;">
      PROCEEDINGS
    </h4>
    ${agendaRows}

    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px 18px;margin:24px 0 20px 0;">
      <p style="font-weight:700;font-size:11px;color:#c2410c;margin:0 0 8px 0;text-transform:uppercase;">Resolution Summary</p>
      <p style="font-size:11px;color:#7c2d12;margin:0;">
        Total Resolutions Passed: <b>${ordinaryCount + specialCount}</b> &nbsp;&nbsp;
        Ordinary Resolutions: <b>${ordinaryCount}</b> &nbsp;&nbsp;
        Special Resolutions: <b>${specialCount}</b>
      </p>
    </div>

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

/* ══════════════════════════════════════════════════════════════════
   GENERATE CTC HTML — shared generator
══════════════════════════════════════════════════════════════════ */
function generateEgmCtcHTML(f: F): string {
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
    boardMeetingRef: "",
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
      meetingType:      "egm",
      meetingTypeLabel: "Extraordinary General Meeting",
      meetingSerial:    f.egmSerial,
      meetingDate:      f.meetingDate,
      meetingTime:      f.meetingTime,
      venue:            f.venue,
    },
    resolution: {
      title:              fillEgmTemplate(item.title, { ...ctcGlobalFields, ...item.fields }),
      text:               fillEgmTemplate(item.resolution, { ...ctcGlobalFields, ...item.fields }),
      type:               item.resolutionType === "special" ? "special" : item.resolutionType === "none" ? "none" : "ordinary",
      number:             `Item ${f.agendaItems.findIndex(a => a.id === item.id) + 1} — ${f.egmSerial || ""} EGM`,
      votingMode:         voteLabel(item.votingMode),
      votingResult:       voteResultLabel(item.votingResult),
      votingResultPassed: item.votingResult !== "defeated",
    },
    ctcIndex:          i + 1,
    ctcTotal:          total,
    signatories:       activeSigs,
    printOnLetterhead: true,
    isDirectCTC:       false,
  }));

  return generateCtcDocument(pages);
}

function generateMinutesAndCtcHTML(f: F): string {
  const minutesHtml = generateEgmHTML(f);
  const resolutionItems = f.agendaItems.filter(
    item => item.resolutionType !== "none" && item.resolution.trim()
  );
  if (resolutionItems.length === 0) return minutesHtml;
  const ctcBody = generateEgmCtcHTML(f);
  const ctcContent = ctcBody.replace(/^[\s\S]*<body>/, "").replace(/<\/body>[\s\S]*$/, "");
  return minutesHtml.replace(/<\/body>\s*<\/html>/i, `${ctcContent}</body></html>`);
}

/* ══════════════════════════════════════════════════════════════════
   SS-2 / EGM COMPLIANCE CHECKLIST
══════════════════════════════════════════════════════════════════ */
function buildEgmChecklist(f: F): Array<{ label: string; status: "ok" | "warn" | "manual" }> {
  const personally = f.members.filter(m => m.isPresent && !m.isProxyPresent).length;
  const req = quorumRequired(f.entityType);
  const clearDays = calcClearDays(f.noticeDate, f.meetingDate);
  return [
    { label: "Notice sent at least 21 clear days before EGM (SS-2 / Sec. 101)", status: f.noticeDate && f.meetingDate ? (clearDays >= 21 ? "ok" : "warn") : "manual" },
    { label: `Quorum: ${personally} member(s) personally present (required: ${req})`, status: personally >= req ? "ok" : "warn" },
    { label: "Chairman confirmed", status: !!f.chairmanName && f.chairmanName !== "__manual__" ? "ok" : "warn" },
    { label: "Venue specified", status: !!f.venue ? "ok" : "warn" },
    { label: "Meeting date entered", status: !!f.meetingDate ? "ok" : "warn" },
    { label: "At least one special business agenda item added", status: f.agendaItems.some(a => a.resolutionType !== "none") ? "ok" : "warn" },
    { label: "Purpose / reason for EGM stated", status: !!f.egmPurpose ? "ok" : "manual" },
    { label: "Shorter notice consent (if < 21 days) obtained from members holding ≥95%", status: "manual" },
    { label: "Minutes to be entered in Minute Book within 30 days (Sec. 118)", status: "manual" },
    { label: "Special resolutions to be filed in MGT-14 within 30 days of passing", status: "manual" },
  ];
}

/* ══════════════════════════════════════════════════════════════════
   ROC FILING REMINDERS
══════════════════════════════════════════════════════════════════ */
const EGM_FILING_REMINDERS: Array<{
  form: string; trigger: string[]; desc: string; dueDesc: string; color: string;
}> = [
  { form: "MGT-14", trigger: ["egm_moa_name_change","egm_moa_objects_change","egm_moa_reg_office_state","egm_moa_aoa_alteration","egm_aoa_alteration","egm_aoa_adoption","egm_borrow_limit","egm_mortgage","egm_debentures","egm_buyback","egm_merger","egm_conversion","egm_winding_up","egm_investments_loans","egm_preferential_allotment"], desc: "Filing of Special / Certain Ordinary Resolutions", dueDesc: "Within 30 days of passing resolution", color: "#7c3aed" },
  { form: "SH-7", trigger: ["egm_auth_capital_increase"], desc: "Increase in Authorised Share Capital", dueDesc: "Within 30 days of passing resolution", color: "#0891b2" },
  { form: "INC-24", trigger: ["egm_moa_name_change"], desc: "Application for Name Change (after availability confirmation)", dueDesc: "After Registrar's approval — file within 30 days", color: "#1d4ed8" },
  { form: "INC-22 / INC-23", trigger: ["egm_moa_reg_office_state"], desc: "Shifting of Registered Office to another State", dueDesc: "INC-23 (NCLT petition) + INC-22 after NCLT order", color: "#b45309" },
  { form: "PAS-3", trigger: ["egm_preferential_allotment","egm_rights_issue"], desc: "Return of Allotment", dueDesc: "Within 15 days of allotment", color: "#059669" },
  { form: "DIR-12", trigger: ["egm_appt_md","egm_appt_independent","egm_remove_director"], desc: "Change in Directors / KMP", dueDesc: "Within 30 days of change", color: "#16a34a" },
  { form: "MBP-1 / Disclosure", trigger: ["egm_rpt"], desc: "Related Party Transaction Disclosure", dueDesc: "Ensure MBP-1 is filed before the transaction", color: "#64748b" },
  { form: "SH-9 + MGT-14", trigger: ["egm_buyback"], desc: "Buy-back of Shares — Declaration + Filings", dueDesc: "Before and after buy-back as per schedule", color: "#dc2626" },
];

/* ══════════════════════════════════════════════════════════════════
   AGENDA CARD COMPONENT
══════════════════════════════════════════════════════════════════ */
function AgendaCard({
  item, tpl, idx, onChange, onRemove, canRemove, globalFields,
}: {
  item: AgendaItemData; tpl: EgmAgendaTemplate | undefined;
  idx: number; onChange: (u: AgendaItemData) => void;
  onRemove: () => void; canRemove: boolean;
  globalFields: Record<string, string>;
}) {
  const [expanded, setExpanded] = useState(idx < 3);
  const set = (key: keyof AgendaItemData, val: unknown) => onChange({ ...item, [key]: val });
  const setField = (key: string, val: string) => onChange({ ...item, fields: { ...item.fields, [key]: val } });
  const merged = { ...globalFields, ...item.fields };
  const filled = fillEgmTemplate(item.discussion, merged);
  const resFilled = item.resolution ? fillEgmTemplate(item.resolution, merged) : "";
  const isMandatory = DEFAULT_ITEM_IDS.includes(item.templateId);

  return (
    <div className={`rounded-xl border-2 ${item.resolutionType === "special" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"} overflow-hidden`}>
      <div className="flex items-center gap-3 p-4 cursor-pointer select-none hover:bg-slate-50" onClick={() => setExpanded(e => !e)}>
        <span className="text-2xl">{tpl?.icon || "📌"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800 text-sm">{idx + 1}. {fillEgmTemplate(item.title, merged)}</span>
            {tpl?.resolutionLaw && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">{tpl.resolutionLaw}</span>
            )}
            {item.resolutionType === "special" && (
              <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">⚡ Special Resolution</span>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{tpl?.categoryLabel || ""}</div>
        </div>
        <div className="flex items-center gap-2">
          {canRemove && (
            <button onClick={e => { e.stopPropagation(); onRemove(); }}
              className="text-red-400 hover:text-red-600 text-lg font-bold px-1" title="Remove">×</button>
          )}
          <span className="text-slate-400 text-sm">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100">
          {tpl && tpl.fields.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {tpl.fields.map(f => (
                <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{f.label}</label>
                  {f.type === "textarea" ? (
                    <textarea rows={3}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      placeholder={f.placeholder} value={item.fields[f.key] || ""}
                      onChange={e => setField(f.key, e.target.value)} />
                  ) : (
                    <input type={f.type || "text"}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      placeholder={f.placeholder} value={item.fields[f.key] || ""}
                      onChange={e => setField(f.key, e.target.value)} />
                  )}
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Discussion / Proceedings</label>
            <textarea rows={4}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 mt-1 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={filled} onChange={e => set("discussion", e.target.value)} />
          </div>

          {item.resolutionType !== "none" && (
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Resolution Text</label>
                <select className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none"
                  value={item.resolutionType} onChange={e => set("resolutionType", e.target.value)}>
                  <option value="ordinary">Ordinary Resolution</option>
                  <option value="special">Special Resolution</option>
                </select>
              </div>
              <textarea rows={7}
                className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${item.resolutionType === "special" ? "border-amber-300 bg-amber-50 focus:ring-amber-400" : "border-green-200 bg-green-50 focus:ring-green-400"}`}
                value={resFilled} onChange={e => set("resolution", e.target.value)} />

              <div className="flex flex-wrap gap-3 mt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Voting Mode</label>
                  <select className="ml-2 text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none"
                    value={item.votingMode} onChange={e => set("votingMode", e.target.value)}>
                    <option value="show_of_hands">Show of Hands</option>
                    <option value="poll">By Poll</option>
                    <option value="e_voting">E-Voting</option>
                    <option value="na">N/A</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Result</label>
                  <select className="ml-2 text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none"
                    value={item.votingResult} onChange={e => set("votingResult", e.target.value)}>
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
   RESTORE WATCHER
══════════════════════════════════════════════════════════════════ */
function RestoreDocWatcher({ onRestore, onDocId }: { onRestore: (d: F) => void; onDocId: (id: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("restore") === "1") {
      const saved = sessionStorage.getItem("csi_restore_doc");
      const docId = sessionStorage.getItem("csi_restore_doc_id");
      if (saved) { try { onRestore(JSON.parse(saved) as F); sessionStorage.removeItem("csi_restore_doc"); } catch {} }
      if (docId) { onDocId(docId); sessionStorage.removeItem("csi_restore_doc_id"); }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════ */
const INP = "w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white";

export default function EgmMinutesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [f, setF] = useState<F>(INITIAL_F);
  const [draftSaved, setDraftSaved] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [existingDocId, setExistingDocId] = useState<string | null>(null);
  const [showAddAgenda, setShowAddAgenda] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [showChecklist, setShowChecklist] = useState(false);
  const [showReminders, setShowReminders] = useState(false);

  useEffect(() => {
    try { const raw = localStorage.getItem(DRAFT_KEY); if (raw) setF(JSON.parse(raw)); } catch {}
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(f));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 1500);
    }, 800);
    return () => clearTimeout(t);
  }, [f]);

  async function saveDocument() {
    if (!session) { router.push("/auth/login"); return; }
    setSaveStatus("saving");
    try {
      const payload = {
        type: "egm_minutes",
        title: `EGM Minutes — ${f.companyName || "Company"} — ${f.egmSerial} EGM`,
        companyName: f.companyName || null,
        meetingDate: f.meetingDate || null,
        formDataJson: JSON.stringify(f),
      };
      const res = existingDocId
        ? await fetch(`/api/documents/${existingDocId}/full`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 3000); }
      else setSaveStatus("error");
    } catch { setSaveStatus("error"); }
  }

  const upd = useCallback((patch: Partial<F>) => setF(prev => ({ ...prev, ...patch })), []);
  const updMember = (id: string, patch: Partial<Member>) =>
    upd({ members: f.members.map(m => m.id === id ? { ...m, ...patch } : m) });
  const addMember = () => upd({ members: [...f.members, BLANK_MEMBER()] });
  const removeMember = (id: string) => upd({ members: f.members.filter(m => m.id !== id) });
  const updInvitee = (id: string, patch: Partial<Invitee>) =>
    upd({ invitees: f.invitees.map(i => i.id === id ? { ...i, ...patch } : i) });
  const addInvitee = () => upd({ invitees: [...f.invitees, BLANK_INVITEE()] });
  const removeInvitee = (id: string) => upd({ invitees: f.invitees.filter(i => i.id !== id) });
  const updAgenda = (id: string, updated: AgendaItemData) =>
    upd({ agendaItems: f.agendaItems.map(a => a.id === id ? updated : a) });
  const removeAgenda = (id: string) => upd({ agendaItems: f.agendaItems.filter(a => a.id !== id) });
  const addAgendaItem = (templateId: string) =>
    upd({ agendaItems: [...f.agendaItems, defaultAgendaItem(templateId)] });

  function applyCompany(data: CompanyData) {
    const activeDirs = (data.directors || []).filter(d => d.isActive);
    const companyDirectors = activeDirs.map(d => ({
      name: d.name, designation: d.designation || "Director", din: d.din || "",
    }));
    const chairman =
      activeDirs.find(d => /\bmd\b|managing director/i.test(d.designation || "")) ||
      activeDirs.find(d => /wtd|whole.?time/i.test(d.designation || "")) ||
      activeDirs[0];
    const currentMembersAreBlank = f.members.length === 1 && !f.members[0].name;
    const directorMembers: Member[] = companyDirectors.map(d => ({
      id: crypto.randomUUID(), name: d.name, folioNo: "", sharesHeld: "",
      isPresent: false, proxy: "", isProxyPresent: false,
      isDirectorMember: true, designation: d.designation,
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
      ctcSignatories: companyDirectors.slice(0, 4).map(d => ({
        name: d.name, designation: d.designation, din: d.din,
      })),
    };
    if (chairman) { patch.chairmanName = chairman.name; patch.chairmanDesig = chairman.designation || "Director"; }
    if (!f.venue && data.regAddress) patch.venue = `Registered Office of the Company at ${data.regAddress}`;
    upd(patch);
  }

  const clearDays = calcClearDays(f.noticeDate, f.meetingDate);
  const noticeWarn = f.noticeDate && f.meetingDate && clearDays < 21
    ? `⚠️ Only ${clearDays} clear days between notice (${fmtDate(f.noticeDate)}) and EGM (${fmtDate(f.meetingDate)}). SS-2 requires minimum 21 clear days.`
    : "";
  const closingTimeWarn = f.closingTime && f.meetingTime && f.closingTime <= f.meetingTime
    ? "⚠️ Closing time must be after start time." : "";

  function canNext(): boolean {
    if (step === 0) return !!f.companyName && !!f.cin;
    if (step === 1) return !!f.meetingDate && !!f.venue && !!f.chairmanName && f.chairmanName !== "__manual__" && !closingTimeWarn;
    if (step === 2) return quorumMet(f.members, f.entityType);
    return true;
  }

  function openPrint(html: string) {
    const src = session ? html : injectPreviewWatermark(html);
    const url = URL.createObjectURL(new Blob([src], { type: "text/html;charset=utf-8" }));
    const win = window.open(url, "_blank");
    if (!win) { alert("Please allow popups to open."); URL.revokeObjectURL(url); return; }
    if (session) { win.addEventListener("load", () => { win.focus(); win.print(); }); }
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
  }

  const ctcCount = f.agendaItems.filter(a => a.resolutionType !== "none" && a.resolution.trim()).length;
  const egmChecklist = buildEgmChecklist(f);
  const checklistWarns = egmChecklist.filter(c => c.status === "warn").length;
  const activeTemplateIds = new Set(f.agendaItems.map(a => a.templateId));
  const triggeredReminders = EGM_FILING_REMINDERS.filter(r => r.trigger.some(t => activeTemplateIds.has(t)));
  const addedIds = new Set(f.agendaItems.map(a => a.templateId));

  const steps = ["Company", "EGM Details", "Attendance", "Agenda", "Preview"];

  /* ──────────────────────────────────────────────────────────────
     RENDER
  ────────────────────────────────────────────────────────────── */
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
            <h1 className="font-extrabold text-slate-900 text-lg leading-tight">⚡ EGM Minutes Generator</h1>
            <p className="text-xs text-slate-500">SS-2 Compliant &nbsp;·&nbsp; Companies Act 2013 &nbsp;·&nbsp; Special Business</p>
          </div>
          <div className="flex items-center gap-2">
            {draftSaved && (
              <span className="text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full border border-green-200">✓ Draft saved</span>
            )}
            <button onClick={() => { if (confirm("Reset all data?")) { setF(INITIAL_F); localStorage.removeItem(DRAFT_KEY); setStep(0); }}}
              className="text-xs text-red-500 hover:text-red-700 px-2.5 py-1 rounded-lg border border-red-200 hover:bg-red-50">Reset</button>
            <Link href="/tools/documents/minutes" className="text-xs text-amber-600 hover:underline px-2">← All Minutes</Link>
          </div>
        </div>
      </div>

      {/* Step Progress */}
      <div className="bg-white border-b border-slate-100 px-4 py-2">
        <div className="max-w-5xl mx-auto flex items-center gap-1 overflow-x-auto">
          {steps.map((s, i) => (
            <button key={i}
              onClick={() => { if (i < step || canNext()) setStep(i); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                i === step ? "bg-amber-500 text-white shadow" :
                i < step ? "bg-amber-100 text-amber-700 hover:bg-amber-200" :
                "text-slate-400 hover:text-slate-600"
              }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                i === step ? "bg-white text-amber-600" :
                i < step ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-500"
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
              <CompanyExcelUpload onFill={applyCompany} accent="amber" note="Company details + Directors auto-filled from MCA Excel." />
              <div className="flex items-center gap-2 my-4">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-xs text-slate-400 font-medium">or fill manually</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Company Name * <span className="text-slate-400 font-normal">(type to search saved companies)</span>
                  </label>
                  <CompanySearch value={f.companyName} onChange={val => upd({ companyName: val })}
                    onSelect={applyCompany} placeholder="e.g. ABC Technologies Private Limited"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    accent="amber" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">CIN *</label>
                  <input className={`${INP} font-mono`} value={f.cin}
                    onChange={e => upd({ cin: e.target.value.toUpperCase() })} placeholder="e.g. U72900MH2010PTC123456" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Entity Type</label>
                  <select className={INP} value={f.entityType} onChange={e => upd({ entityType: e.target.value })}>
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
                  <textarea className={`${INP} h-16 resize-none`} value={f.regAddress}
                    onChange={e => upd({ regAddress: e.target.value })}
                    placeholder="Full registered office address as per MCA records" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ STEP 1 — EGM DETAILS ═══════════ */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800 text-base">EGM Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">EGM Serial *</label>
                <select className={INP} value={f.egmSerial} onChange={e => upd({ egmSerial: e.target.value })}>
                  {ORDINAL.slice(1).map(o => <option key={o} value={o}>{o} EGM</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Called By *</label>
                <select className={INP} value={f.calledBy} onChange={e => upd({ calledBy: e.target.value as F["calledBy"] })}>
                  <option value="board">Board of Directors</option>
                  <option value="members_requisition">Members&apos; Requisition (Sec. 100)</option>
                  <option value="nclt">NCLT Order (Sec. 98)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Meeting Date *</label>
                <input type="date" className={INP} value={f.meetingDate}
                  onChange={e => upd({ meetingDate: e.target.value })} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Notice Date <span className="text-slate-400 font-normal">(date notice was served)</span>
                </label>
                <input type="date" className={`${INP} ${noticeWarn ? "border-amber-400 bg-amber-50" : ""}`}
                  value={f.noticeDate} onChange={e => upd({ noticeDate: e.target.value })} />
                {f.noticeDate && f.meetingDate && !noticeWarn && (
                  <p className="text-green-600 text-xs mt-1">✓ {clearDays} clear days — 21-day requirement satisfied</p>
                )}
                {noticeWarn && <p className="text-amber-700 text-xs mt-1">{noticeWarn}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Start Time</label>
                <input type="time" className={INP} value={f.meetingTime}
                  onChange={e => upd({ meetingTime: e.target.value })} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Closing Time</label>
                <input type="time"
                  className={`${INP} ${closingTimeWarn ? "border-red-400 bg-red-50" : ""}`}
                  value={f.closingTime} onChange={e => upd({ closingTime: e.target.value })} />
                {closingTimeWarn && <p className="text-red-500 text-xs mt-1">{closingTimeWarn}</p>}
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-600">Venue *</label>
                  {f.regAddress && f.venue !== `Registered Office of the Company at ${f.regAddress}` && (
                    <button type="button"
                      onClick={() => upd({ venue: `Registered Office of the Company at ${f.regAddress}` })}
                      className="text-xs text-amber-600 underline">Auto-fill from Reg. Office</button>
                  )}
                </div>
                <input className={INP} value={f.venue} onChange={e => upd({ venue: e.target.value })}
                  placeholder="e.g. Registered Office of the Company at..." />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Chairman Name *</label>
                {f.companyDirectors.length > 0 ? (
                  <select className={INP} value={f.chairmanName}
                    onChange={e => {
                      const sel = f.companyDirectors.find(d => d.name === e.target.value);
                      upd({ chairmanName: e.target.value, chairmanDesig: sel?.designation || f.chairmanDesig });
                    }}>
                    <option value="">— Select Chairman —</option>
                    {f.companyDirectors.map((d, i) => (
                      <option key={i} value={d.name}>{d.name} ({d.designation})</option>
                    ))}
                    <option value="__manual__">Other (type manually)</option>
                  </select>
                ) : (
                  <input className={INP} value={f.chairmanName} onChange={e => upd({ chairmanName: e.target.value })}
                    placeholder="e.g. Mr. Rajesh Kumar Sharma" />
                )}
                {f.chairmanName === "__manual__" && (
                  <input className={`${INP} mt-2`} placeholder="Enter chairman name manually"
                    onChange={e => upd({ chairmanName: e.target.value })} />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Chairman Designation</label>
                <input className={INP} value={f.chairmanDesig} onChange={e => upd({ chairmanDesig: e.target.value })}
                  placeholder="e.g. Managing Director / Chairman" />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Purpose / Reason for EGM <span className="text-slate-400 font-normal">(brief description)</span>
                </label>
                <textarea className={`${INP} h-14 resize-none`} value={f.egmPurpose}
                  onChange={e => upd({ egmPurpose: e.target.value })}
                  placeholder="e.g. To consider and approve increase in authorised share capital and alteration of MOA" />
              </div>

              {/* Prior Board Meeting — only for Board-called EGM */}
              {f.calledBy === "board" && (
                <div className="sm:col-span-2 mt-1">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5">📋</span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-amber-900">Prior Board Meeting <span className="text-xs font-normal text-amber-600">(Mandatory — Sec. 100)</span></p>
                        <p className="text-xs text-amber-800 mb-3">Board MUST pass a resolution to convene the EGM and approve the Notice. Enter the Board Meeting where this was resolved — it will be auto-referenced in the Chairman&apos;s opening item.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Board Meeting Number</label>
                            <select
                              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                              value={f.boardMeetingSerial}
                              onChange={e => upd({ boardMeetingSerial: e.target.value })}>
                              <option value="">— Select —</option>
                              {ORDINAL.slice(1).map(o => <option key={o} value={o}>{o} Meeting</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Board Meeting Date</label>
                            <input type="date"
                              className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                                f.boardMeetingDate && f.meetingDate && f.boardMeetingDate >= f.meetingDate ? "border-red-400 bg-red-50" : "border-slate-300"
                              }`}
                              value={f.boardMeetingDate}
                              max={f.meetingDate || undefined}
                              onChange={e => upd({ boardMeetingDate: e.target.value })} />
                            {f.boardMeetingDate && f.meetingDate && f.boardMeetingDate >= f.meetingDate && (
                              <p className="text-red-500 text-xs mt-1">❌ Board Meeting must be before EGM date.</p>
                            )}
                          </div>
                        </div>
                        {f.boardMeetingSerial && f.boardMeetingDate && (
                          <p className="text-green-700 text-xs mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                            ✓ <b>{f.boardMeetingSerial} Board Meeting</b> held on <b>{fmtDate(f.boardMeetingDate)}</b> — will be referenced in Chairman&apos;s opening item and Meeting Details.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Print / Letterhead options */}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-bold text-slate-700 mb-3">🖨️ Print Options</h3>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-amber-500" checked={f.printOnLetterhead}
                    onChange={e => upd({ printOnLetterhead: e.target.checked })} />
                  <span className="text-sm text-slate-700 font-medium">Print on Company Letterhead</span>
                </label>
              </div>
              {f.printOnLetterhead && (
                <div className="flex flex-wrap gap-3 mt-2">
                  <input className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Email for letterhead" value={f.printEmail}
                    onChange={e => upd({ printEmail: e.target.value })} />
                  <input className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
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
                      SS-2 / Sec. 103 — {f.entityType} requires {req} member(s) personally present (proxies don&apos;t count for quorum)
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
                    <p className="text-xs text-amber-600 mt-0.5">👥 Directors auto-filled — add Folio No. &amp; Shares Held</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {f.companyDirectors.length > 0 && (
                    <button onClick={() => {
                      const existing = new Set(f.members.map(m => m.name.toLowerCase()));
                      const missing = f.companyDirectors.filter(d => !existing.has(d.name.toLowerCase()));
                      if (!missing.length) return;
                      upd({ members: [...f.members, ...missing.map(d => ({
                        id: crypto.randomUUID(), name: d.name, folioNo: "", sharesHeld: "",
                        isPresent: false, proxy: "", isProxyPresent: false,
                        isDirectorMember: true, designation: d.designation,
                      }))] });
                    }} className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 px-3 py-1.5 rounded-lg">
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
                      <th className="px-3 py-3 text-left">Proxy Holder</th>
                      <th className="px-3 py-3 text-center">Proxy<br/>Present</th>
                      <th className="px-3 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {f.members.map(m => (
                      <tr key={m.id} className={`border-t border-slate-100 ${m.isPresent || m.isProxyPresent ? "bg-green-50" : ""}`}>
                        <td className="px-4 py-2">
                          {m.isDirectorMember ? (
                            <div>
                              <p className="text-xs font-semibold text-slate-800">{m.name}</p>
                              <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-full">
                                🏢 {m.designation || "Director"}
                              </span>
                            </div>
                          ) : (
                            <input className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                              placeholder="Member name" value={m.name}
                              onChange={e => updMember(m.id, { name: e.target.value })} />
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
                            placeholder="Folio/DP" value={m.folioNo}
                            onChange={e => updMember(m.id, { folioNo: e.target.value })} />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
                            placeholder="Shares" value={m.sharesHeld}
                            onChange={e => updMember(m.id, { sharesHeld: e.target.value })} />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input type="checkbox" className="w-4 h-4 accent-green-600" checked={m.isPresent}
                            onChange={e => updMember(m.id, { isPresent: e.target.checked })} />
                        </td>
                        <td className="px-3 py-2">
                          <input className="w-32 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
                            placeholder="Proxy holder name" value={m.proxy}
                            onChange={e => updMember(m.id, { proxy: e.target.value })} />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input type="checkbox" className="w-4 h-4 accent-blue-600" checked={m.isProxyPresent}
                            disabled={!m.proxy.trim()}
                            onChange={e => updMember(m.id, { isProxyPresent: e.target.checked })} />
                        </td>
                        <td className="px-3 py-2">
                          {f.members.length > 1 && (
                            <button onClick={() => removeMember(m.id)}
                              className="text-red-400 hover:text-red-600 font-bold text-lg px-1">×</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 bg-slate-50 text-xs text-slate-500 border-t border-slate-100 flex flex-wrap gap-3">
                <span>💡 Proxies can vote but do <b>not</b> count for quorum (SS-2)</span>
                <span className="text-slate-300">|</span>
                <span>🏢 <b>Amber badge</b> = auto-filled from company directors</span>
              </div>
            </div>

            {/* Invitees */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800 text-sm">Others Present (By Invitation)</h2>
                <button onClick={addInvitee}
                  className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-lg">+ Add</button>
              </div>
              {f.invitees.length === 0 ? (
                <p className="px-5 py-4 text-sm text-slate-400">No invitees added. (Optional — Auditor, CS, CFO, Advocate, etc.)</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {f.invitees.map(inv => (
                    <div key={inv.id} className="flex items-center gap-3 px-5 py-3">
                      <input className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
                        placeholder="Name" value={inv.name}
                        onChange={e => updInvitee(inv.id, { name: e.target.value })} />
                      <input className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
                        placeholder="Designation" value={inv.designation}
                        onChange={e => updInvitee(inv.id, { designation: e.target.value })} />
                      <button onClick={() => removeInvitee(inv.id)} className="text-red-400 hover:text-red-600 font-bold text-lg">×</button>
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
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
              <p className="text-sm text-slate-600 font-medium">
                {f.agendaItems.length} items · {f.agendaItems.filter(a => a.resolutionType !== "none").length} resolution{f.agendaItems.filter(a => a.resolutionType !== "none").length !== 1 ? "s" : ""}
                {f.agendaItems.filter(a => a.resolutionType === "special").length > 0 && (
                  <span className="ml-2 text-amber-600 font-semibold">· {f.agendaItems.filter(a => a.resolutionType === "special").length} special</span>
                )}
              </p>
              <button type="button"
                onClick={() => { setShowAddAgenda(!showAddAgenda); setTemplateSearch(""); }}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition">
                + Add Agenda Item
              </button>
            </div>

            {showAddAgenda && (
              <div className="border-2 border-amber-200 rounded-2xl bg-amber-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-amber-800">Select Agenda Item Template</p>
                  <button type="button"
                    onClick={() => { setShowAddAgenda(false); setTemplateSearch(""); }}
                    className="text-slate-400 hover:text-slate-600 text-xs font-medium">✕ Close</button>
                </div>
                <input
                  className="w-full border border-amber-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  placeholder="Search templates... (e.g. MOA, share capital, director, borrowing)"
                  value={templateSearch} onChange={e => setTemplateSearch(e.target.value)} />
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {EGM_CATEGORY_ORDER.map(cat => {
                    const meta = EGM_CATEGORY_META[cat];
                    const templates = ALL_EGM_TEMPLATES.filter(t =>
                      t.category === cat && (
                        !templateSearch.trim() ||
                        t.title.toLowerCase().includes(templateSearch.toLowerCase()) ||
                        t.categoryLabel.toLowerCase().includes(templateSearch.toLowerCase()) ||
                        (t.resolutionLaw || "").toLowerCase().includes(templateSearch.toLowerCase())
                      )
                    );
                    if (!templates.length) return null;
                    return (
                      <div key={cat}>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: meta.color }}>
                          {meta.icon} {meta.label}
                        </p>
                        <div className="space-y-1">
                          {templates.map(tpl => (
                            <button key={tpl.id} type="button"
                              onClick={() => { addAgendaItem(tpl.id); setShowAddAgenda(false); setTemplateSearch(""); }}
                              className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border transition ${
                                addedIds.has(tpl.id) ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50"
                              }`}>
                              <span className="text-xl flex-shrink-0">{tpl.icon}</span>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">{tpl.title}</p>
                                {tpl.resolutionLaw && <p className="text-xs text-amber-600 mt-0.5">{tpl.resolutionLaw}</p>}
                              </div>
                              {addedIds.has(tpl.id) && (
                                <span className="ml-auto text-xs text-amber-600 font-bold flex-shrink-0">+ Add Again</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {f.agendaItems.map((item, idx) => {
                const tpl = ALL_EGM_TEMPLATES.find(t => t.id === item.templateId);
                return (
                  <AgendaCard key={item.id} item={item} tpl={tpl} idx={idx}
                    onChange={updated => updAgenda(item.id, updated)}
                    onRemove={() => removeAgenda(item.id)}
                    canRemove={!DEFAULT_ITEM_IDS.includes(item.templateId)}
                    globalFields={{ boardMeetingSerial: f.boardMeetingSerial, boardMeetingDate: f.boardMeetingDate ? fmtDate(f.boardMeetingDate) : "", boardMeetingRef: f.calledBy === "board" && f.boardMeetingDate ? `This Meeting was convened pursuant to the Resolution of the Board of Directors passed at its ${f.boardMeetingSerial ? f.boardMeetingSerial + " " : ""}Meeting held on ${fmtDate(f.boardMeetingDate)}.` : "" }} />
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
              <h2 className="font-bold text-slate-800 text-base mb-4">📋 EGM Summary</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                {[
                  { label: "EGM No.", val: `${f.egmSerial} EGM`, icon: "⚡" },
                  { label: "Called By", val: f.calledBy === "board" ? "Board" : f.calledBy === "members_requisition" ? "Members" : "NCLT", icon: "📣" },
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

            {/* EGM Compliance Checklist */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <button onClick={() => setShowChecklist(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 text-left">
                <div>
                  <h3 className="font-bold text-slate-800">EGM Compliance Checklist</h3>
                  <p className="text-xs text-slate-500 mt-0.5">SS-2 / Companies Act 2013 — Extraordinary General Meeting</p>
                </div>
                <div className="flex items-center gap-2">
                  {checklistWarns > 0 ? (
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200">
                      {checklistWarns} warning{checklistWarns > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">✓ All checks passed</span>
                  )}
                  <span className="text-slate-400">{showChecklist ? "▲" : "▼"}</span>
                </div>
              </button>
              {showChecklist && (
                <div className="border-t border-slate-100 px-5 py-4 space-y-2">
                  {egmChecklist.map((c, i) => (
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
                <button onClick={() => setShowReminders(v => !v)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left">
                  <div>
                    <h3 className="font-bold text-slate-800">📌 ROC Filing Reminders</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Post-EGM compliance filings based on agenda</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200">
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
                          style={{ background: r.color, fontSize: "10px", letterSpacing: "0.3px" }}>{r.form}</span>
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
                  <p className="text-xs text-slate-400 mt-0.5">Who will sign the Certified True Copies — auto-filled from directors.</p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2.5 py-1 rounded-full border border-amber-200">
                  {ctcCount} CTC{ctcCount !== 1 ? "s" : ""} will be generated
                </span>
              </div>
              <div className="space-y-2">
                {f.ctcSignatories.map((s, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input className="col-span-4 border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      placeholder="Director / CS name" value={s.name}
                      onChange={e => { const u = [...f.ctcSignatories]; u[i] = { ...u[i], name: e.target.value }; upd({ ctcSignatories: u }); }} />
                    <input className="col-span-4 border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      placeholder="Designation" value={s.designation}
                      onChange={e => { const u = [...f.ctcSignatories]; u[i] = { ...u[i], designation: e.target.value }; upd({ ctcSignatories: u }); }} />
                    <input className="col-span-3 border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                      placeholder="DIN (optional)" value={s.din}
                      onChange={e => { const u = [...f.ctcSignatories]; u[i] = { ...u[i], din: e.target.value }; upd({ ctcSignatories: u }); }} />
                    <button onClick={() => upd({ ctcSignatories: f.ctcSignatories.filter((_, j) => j !== i) })}
                      className="col-span-1 text-red-400 hover:text-red-600 font-bold text-lg text-center">×</button>
                  </div>
                ))}
              </div>
              <button onClick={() => upd({ ctcSignatories: [...f.ctcSignatories, { name: "", designation: "Director", din: "" }] })}
                className="mt-3 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 px-3 py-1.5 rounded-lg">
                + Add Signatory
              </button>
            </div>

            {/* Print Buttons */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg">
              <h3 className="font-extrabold text-lg mb-1 text-center">Ready to Print / Save as PDF</h3>
              <p className="text-amber-100 text-sm mb-5 text-center">
                A4 print-ready document opens in new window. Use browser <b>Print → Save as PDF</b>.
              </p>
              <button onClick={() => openPrint(generateMinutesAndCtcHTML(f))}
                className="w-full bg-white text-amber-700 font-extrabold px-6 py-3.5 rounded-xl hover:bg-amber-50 transition-all shadow hover:scale-[1.02] text-sm mb-3 flex items-center justify-center gap-2">
                🖨️ Print All — Minutes + {ctcCount} CTC{ctcCount !== 1 ? "s" : ""}
                <span className="text-xs bg-amber-100 text-amber-600 font-bold px-2 py-0.5 rounded-full">{ctcCount} CTC{ctcCount !== 1 ? "s" : ""}</span>
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => openPrint(generateEgmHTML(f))}
                  className="bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all border border-white/30">
                  📄 Minutes Only
                </button>
                <button onClick={() => openPrint(generateEgmCtcHTML(f))} disabled={ctcCount === 0}
                  className="bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all border border-white/30 disabled:opacity-40 disabled:cursor-not-allowed">
                  📋 CTCs Only ({ctcCount})
                </button>
              </div>
            </div>

            {/* Save to My Documents */}
            {session && (
              <div className="mt-3 text-center">
                <button onClick={saveDocument} disabled={saveStatus === "saving" || saveStatus === "saved"}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold border transition-all disabled:opacity-60"
                  style={saveStatus === "saved"
                    ? { background: "#dcfce7", color: "#166534", borderColor: "#86efac" }
                    : { background: "#fff7ed", color: "#c2410c", borderColor: "#fed7aa" }}>
                  {saveStatus === "saving" ? "💾 Saving..." :
                   saveStatus === "saved"  ? "✓ Saved to My Documents" :
                   saveStatus === "error"  ? "❌ Save Failed — Retry" :
                   "💾 Save to My Documents"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 pt-4 border-t border-slate-200">
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            ← Back
          </button>
          {step < steps.length - 1 && (
            <button onClick={() => { if (canNext()) setStep(s => s + 1); }}
              disabled={!canNext()}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow">
              Next →
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
