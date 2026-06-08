"use client";
import { useState, useEffect, useCallback } from "react";
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

  // Step 3 — Members
  members: Member[];
  invitees: Invitee[];

  // Step 4 — Agenda
  agendaItems: AgendaItemData[];

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
  agmSerial: "1st", financialYear: "", meetingDate: "", meetingTime: "11:00",
  closingTime: "", venue: "", chairmanName: "", chairmanDesig: "Chairman",
  prevAgmDate: "",
  members: [BLANK_MEMBER()],
  invitees: [],
  agendaItems: DEFAULT_ITEM_IDS.map(defaultAgendaItem),
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

  const agendaRows = f.agendaItems.map((item, idx) => {
    const filled = fillAgmTemplate(item.discussion, item.fields);
    const resFilled = item.resolution ? fillAgmTemplate(item.resolution, item.fields) : "";

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
        <p style="font-weight:700;font-size:12px;color:#1e293b;margin:0 0 8px 0;">${idx + 1}. ${fillAgmTemplate(item.title, item.fields)}</p>
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
    body { font-family:'Times New Roman',Times,serif; font-size:12px; color:#1a1a1a; margin:0; padding:0; }
    @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
    table { border-collapse:collapse; width:100%; }
  </style>
  </head><body>
  <div style="max-width:800px;margin:0 auto;padding:0;">

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
          <td style="${tdStyle2}">${f.meetingDate || "—"}</td>
          <td style="${tdStyle2}font-weight:700;background:#f8fafc;">Time</td>
          <td style="${tdStyle2}">${f.meetingTime || "—"}${f.closingTime ? " to " + f.closingTime : ""}</td>
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
          <td style="${tdStyle2}" colspan="3">${f.prevAgmDate}</td>
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
    { label: "MGT-7 (Annual Return) to be filed within 60 days of AGM", status: "manual" },
    { label: "AOC-4 (Financial Statements) to be filed within 30/60 days of AGM", status: "manual" },
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
  item, tpl, idx, onChange, onRemove, canRemove,
}: {
  item: AgendaItemData;
  tpl: AgmAgendaTemplate | undefined;
  idx: number;
  onChange: (updated: AgendaItemData) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [expanded, setExpanded] = useState(idx < 4);

  const set = (key: keyof AgendaItemData, val: unknown) =>
    onChange({ ...item, [key]: val });
  const setField = (key: string, val: string) =>
    onChange({ ...item, fields: { ...item.fields, [key]: val } });

  const filled = fillAgmTemplate(item.discussion, item.fields);
  const resFilled = item.resolution ? fillAgmTemplate(item.resolution, item.fields) : "";

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
            <span className="font-bold text-slate-800 text-sm">{idx + 1}. {fillAgmTemplate(item.title, item.fields)}</span>
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
export default function AgmMinutesPage() {
  const [step, setStep] = useState(0);
  const [f, setF] = useState<F>(INITIAL_F);
  const [draftSaved, setDraftSaved] = useState(false);
  const [showAddAgenda, setShowAddAgenda] = useState(false);
  const [addAgendaCategory, setAddAgendaCategory] = useState("ordinary_biz");
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
    setShowAddAgenda(false);
  };

  /* ── Company auto-fill ── */
  function applyCompany(data: CompanyData) {
    const patch: Partial<F> = {
      companyName: data.companyName || f.companyName,
      cin: data.cin || f.cin,
      regAddress: data.regAddress || f.regAddress,
      entityType: data.entityType || f.entityType,
    };
    // Auto-fill chairman from directors if available
    if (data.directors && data.directors.length > 0) {
      const md = data.directors.find(d =>
        /md|managing director/i.test(d.designation || "")
      ) || data.directors[0];
      if (md) {
        patch.chairmanName = md.name || f.chairmanName;
      }
    }
    upd(patch);
  }

  /* ── Validation ── */
  function canNext(): boolean {
    if (step === 0) return !!f.companyName && !!f.cin;
    if (step === 1) return !!f.meetingDate && !!f.venue && !!f.financialYear && !!f.chairmanName;
    if (step === 2) return quorumMet(f.members, f.entityType);
    return true;
  }

  /* ── Print ── */
  function handlePrint() {
    const html = generateAgmHTML(f);
    const win = window.open("", "_blank");
    if (!win) { alert("Please allow popups to print."); return; }
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  }

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
              <div className="flex gap-3 mb-4 flex-wrap">
                <CompanySearch
                  value={f.companyName}
                  onChange={val => upd({ companyName: val })}
                  onSelect={applyCompany}
                />
                <CompanyExcelUpload onFill={applyCompany} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Company Name *</label>
                  <input className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={f.companyName} onChange={e => upd({ companyName: e.target.value })}
                    placeholder="e.g. ABC Technologies Private Limited" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">CIN *</label>
                  <input className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono"
                    value={f.cin} onChange={e => upd({ cin: e.target.value.toUpperCase() })}
                    placeholder="e.g. U72900MH2010PTC123456" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Registered Office Address</label>
                  <input className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={f.regAddress} onChange={e => upd({ regAddress: e.target.value })}
                    placeholder="Full registered office address" />
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
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ STEP 1 — MEETING ═══════════ */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800 text-base">AGM Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">AGM Serial *</label>
                <select className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  value={f.agmSerial} onChange={e => upd({ agmSerial: e.target.value })}>
                  {ORDINAL.slice(1).map(o => <option key={o} value={o}>{o} AGM</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Financial Year *</label>
                <input className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  value={f.financialYear} onChange={e => upd({ financialYear: e.target.value })}
                  placeholder="e.g. 2024-25" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Meeting Date *</label>
                <input type="date" className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  value={f.meetingDate} onChange={e => upd({ meetingDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Meeting Start Time</label>
                <input type="time" className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  value={f.meetingTime} onChange={e => upd({ meetingTime: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Closing Time</label>
                <input type="time" className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  value={f.closingTime} onChange={e => upd({ closingTime: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Previous AGM Date</label>
                <input type="date" className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  value={f.prevAgmDate} onChange={e => upd({ prevAgmDate: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Venue / Mode of Meeting *</label>
                <input className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  value={f.venue} onChange={e => upd({ venue: e.target.value })}
                  placeholder="e.g. Registered Office / Video Conferencing" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Chairman Name *</label>
                <input className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  value={f.chairmanName} onChange={e => upd({ chairmanName: e.target.value })}
                  placeholder="e.g. Mr. Rajesh Kumar Sharma" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Chairman Designation</label>
                <input className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  value={f.chairmanDesig} onChange={e => upd({ chairmanDesig: e.target.value })}
                  placeholder="e.g. Managing Director / Chairman" />
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
                <h2 className="font-bold text-slate-800">Members / Shareholders Attendance</h2>
                <button onClick={addMember}
                  className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 px-3 py-1.5 rounded-lg">
                  + Add Member
                </button>
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
                    {f.members.map((m, idx) => (
                      <tr key={m.id} className={`border-t border-slate-100 ${m.isPresent || m.isProxyPresent ? "bg-green-50" : ""}`}>
                        <td className="px-4 py-2">
                          <input className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                            placeholder="Member name" value={m.name}
                            onChange={e => updMember(m.id, { name: e.target.value })} />
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
                            disabled={!m.proxy}
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
              <div className="px-5 py-3 bg-slate-50 text-xs text-slate-500 border-t border-slate-100">
                💡 Proxies can attend and vote, but do <b>not</b> count for quorum (SS-2)
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
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-bold text-slate-800">Agenda Items</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {f.agendaItems.length} items — {f.agendaItems.filter(a => a.resolutionType !== "none").length} resolutions
                </p>
              </div>
              <button
                onClick={() => setShowAddAgenda(a => !a)}
                className="text-sm font-bold text-purple-700 bg-purple-50 border-2 border-purple-200 hover:bg-purple-100 px-4 py-2 rounded-xl">
                + Add Agenda Item
              </button>
            </div>

            {/* Add Agenda Picker */}
            {showAddAgenda && (
              <div className="bg-white rounded-2xl border-2 border-purple-200 p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800">Select Agenda Template</h3>
                  <button onClick={() => setShowAddAgenda(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">×</button>
                </div>
                {/* Category Tabs */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {AGM_CATEGORY_ORDER.map(cat => {
                    const meta = AGM_CATEGORY_META[cat];
                    return (
                      <button key={cat}
                        onClick={() => setAddAgendaCategory(cat)}
                        className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all ${addAgendaCategory === cat ? "bg-purple-600 text-white border-purple-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-purple-50"}`}>
                        {meta.icon} {meta.label}
                      </button>
                    );
                  })}
                </div>
                {/* Templates in selected category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {ALL_AGM_TEMPLATES.filter(t => t.category === addAgendaCategory).map(tpl => (
                    <button key={tpl.id}
                      onClick={() => addAgendaItem(tpl.id)}
                      className="text-left border border-slate-200 rounded-xl px-3 py-2.5 hover:border-purple-400 hover:bg-purple-50 transition-all group">
                      <span className="text-base mr-1.5">{tpl.icon}</span>
                      <span className="text-sm font-medium text-slate-700 group-hover:text-purple-800">{tpl.title}</span>
                      {tpl.resolutionType !== "none" && (
                        <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tpl.resolutionType === "special" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                          {tpl.resolutionType}
                        </span>
                      )}
                    </button>
                  ))}
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

            {/* Print Button */}
            <div className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl p-5 text-white text-center shadow-lg">
              <h3 className="font-extrabold text-lg mb-1">Ready to Print / Save as PDF</h3>
              <p className="text-purple-200 text-sm mb-4">A4 print-ready minutes will open in a new window. Use browser Print → Save as PDF.</p>
              <button
                onClick={handlePrint}
                className="bg-white text-purple-700 font-extrabold px-8 py-3 rounded-xl hover:bg-purple-50 transition-all shadow hover:scale-105 text-sm">
                🖨️ Generate &amp; Print AGM Minutes
              </button>
            </div>
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
              onClick={handlePrint}
              className="px-6 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 shadow-md hover:scale-105 transition-all">
              🖨️ Print Minutes
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
