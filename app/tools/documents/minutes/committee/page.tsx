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
  ALL_COMMITTEE_TEMPLATES,
  COMMITTEE_CATEGORY_ORDER,
  COMMITTEE_CATEGORY_META,
  COMMITTEE_TYPES,
  fillCommitteeTemplate,
  type CommitteeAgendaTemplate,
} from "@/lib/committee-agenda-templates";
import { generateCtcDocument, type CtcParams } from "@/lib/ctc-generator";

/* ══════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════ */
interface CommitteeMember {
  id: string;
  name: string;
  designation: string;
  din: string;
  isPresent: boolean;
  role: "chairman" | "member";
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
  resolutionType: "decision" | "recommendation" | "none";
  fields: Record<string, string>;
}

interface F {
  // Step 1 — Company
  companyName: string;
  cin: string;
  regAddress: string;
  entityType: string;
  incorporationDate: string;
  companyDirectors: Array<{ name: string; designation: string; din: string }>;

  // Step 2 — Committee & Meeting Details
  committeeType: string;
  customCommitteeName: string;
  meetingSerial: string;
  financialYear: string;
  meetingDate: string;
  meetingTime: string;
  closingTime: string;
  venue: string;
  chairmanName: string;
  chairmanDesig: string;
  noticeDate: string;

  // Step 3 — Attendance
  committeeMembers: CommitteeMember[];
  invitees: Invitee[];

  // Step 4 — Agenda
  agendaItems: AgendaItemData[];

  // CTC
  ctcSignatories: Array<{ name: string; designation: string; din: string }>;

  // Print
  printOnLetterhead: boolean;
  printMobile: string;
  printEmail: string;
}

/* ══════════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════════ */
const DRAFT_KEY = "csi_committee_draft_v1";
const ORDINAL = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
const BLANK_MEMBER = (): CommitteeMember => ({
  id: crypto.randomUUID(), name: "", designation: "Director", din: "", isPresent: true, role: "member",
});
const BLANK_INVITEE = (): Invitee => ({ id: crypto.randomUUID(), name: "", designation: "" });

function getCommitteeMeta(type: string) {
  return COMMITTEE_TYPES.find(c => c.value === type) ?? COMMITTEE_TYPES[COMMITTEE_TYPES.length - 1];
}
function getCommitteeDisplayName(f: F): string {
  if (f.committeeType === "custom") return f.customCommitteeName || "Committee";
  return getCommitteeMeta(f.committeeType).label;
}
function getCommitteeShort(f: F): string {
  if (f.committeeType === "custom") return f.customCommitteeName || "Committee";
  return getCommitteeMeta(f.committeeType).shortLabel;
}

function fmtDate(d: string): string {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }); }
  catch { return d; }
}
function parseMcaDate(d: string): string {
  if (!d) return "";
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : d;
}
function ordinal(n: number): string {
  return ORDINAL[n] ?? `${n}th`;
}

/* ══════════════════════════════════════════════════════════════════
   AGENDA HELPERS
══════════════════════════════════════════════════════════════════ */
function defaultAgendaItem(templateId: string): AgendaItemData {
  const tpl = ALL_COMMITTEE_TEMPLATES.find(t => t.id === templateId);
  if (!tpl) return {
    id: crypto.randomUUID(), templateId, title: templateId,
    discussion: "", resolution: "", resolutionType: "none", fields: {},
  };
  return {
    id: crypto.randomUUID(), templateId,
    title: tpl.title, discussion: tpl.discussion,
    resolution: tpl.resolution, resolutionType: tpl.resolutionType,
    fields: Object.fromEntries(tpl.fields.map(f => [f.key, ""])),
  };
}

function getRelevantTemplates(committeeType: string): CommitteeAgendaTemplate[] {
  return ALL_COMMITTEE_TEMPLATES.filter(
    t => t.committeeTypes.length === 0 || t.committeeTypes.includes(committeeType)
  );
}

/* ══════════════════════════════════════════════════════════════════
   INITIAL STATE
══════════════════════════════════════════════════════════════════ */
const INITIAL_F: F = {
  companyName: "", cin: "", regAddress: "", entityType: "Private Limited Company",
  incorporationDate: "", companyDirectors: [],
  committeeType: "audit", customCommitteeName: "",
  meetingSerial: "1", financialYear: "",
  meetingDate: "", meetingTime: "11:00", closingTime: "", venue: "Registered Office",
  chairmanName: "", chairmanDesig: "Chairman",
  noticeDate: "",
  committeeMembers: [
    { id: crypto.randomUUID(), name: "", designation: "Director", din: "", isPresent: true, role: "chairman" },
    { id: crypto.randomUUID(), name: "", designation: "Director", din: "", isPresent: true, role: "member" },
    { id: crypto.randomUUID(), name: "", designation: "Director", din: "", isPresent: true, role: "member" },
  ],
  invitees: [],
  agendaItems: [defaultAgendaItem("comm_opening"), defaultAgendaItem("comm_prev_minutes"), defaultAgendaItem("comm_closing")],
  ctcSignatories: [{ name: "", designation: "Director", din: "" }, { name: "", designation: "Director", din: "" }],
  printOnLetterhead: true, printMobile: "", printEmail: "",
};

/* ══════════════════════════════════════════════════════════════════
   GENERATE MINUTES HTML
══════════════════════════════════════════════════════════════════ */
function generateCommitteeHTML(f: F): string {
  const present = f.committeeMembers.filter(m => m.isPresent);
  const commName = getCommitteeDisplayName(f);
  const commShort = getCommitteeShort(f);
  let decisionCount = 0, recommendationCount = 0;

  const tdStyle = "padding:7px 12px;font-size:11px;color:#374151;border:1px solid #e2e8f0;";
  const thStyle = "padding:8px 12px;background:#064e3b;color:#fff;font-size:10.5px;font-weight:700;text-align:left;border:1px solid #064e3b;";
  const tdStyle2 = "padding:7px 12px;font-size:11px;color:#374151;border:1px solid #e2e8f0;";

  const memberRows = f.committeeMembers.map(m => `<tr>
    <td style="${tdStyle}">${m.name || "—"}</td>
    <td style="${tdStyle}">${m.designation || "—"}</td>
    <td style="${tdStyle}">${m.din || "—"}</td>
    <td style="${tdStyle}">${m.role === "chairman" ? "Chairman" : "Member"}</td>
    <td style="${tdStyle};color:${m.isPresent ? "#16a34a" : "#dc2626"};font-weight:600;">${m.isPresent ? "Present" : "Absent"}</td>
  </tr>`).join("");

  const inviteeRows = f.invitees.filter(i => i.name).map(i =>
    `<tr><td style="${tdStyle}">${i.name}</td><td style="${tdStyle}">${i.designation}</td></tr>`
  ).join("");

  const agendaRows = f.agendaItems.map((item, idx) => {
    const filled = fillCommitteeTemplate(item.discussion, item.fields);
    const resFilled = item.resolution ? fillCommitteeTemplate(item.resolution, item.fields) : "";
    let resBlock = "";
    if (resFilled) {
      const rType = item.resolutionType;
      if (rType === "decision") decisionCount++;
      if (rType === "recommendation") recommendationCount++;
      const label = rType === "recommendation" ? "📋 Recommendation to Board" : "✅ Decision of Committee";
      const bgColor = rType === "recommendation" ? "#fffbeb" : "#f0fdf4";
      const borderColor = rType === "recommendation" ? "#f59e0b" : "#16a34a";
      const labelColor = rType === "recommendation" ? "#92400e" : "#15803d";
      const textColor = rType === "recommendation" ? "#78350f" : "#064e3b";
      resBlock = `
        <div style="margin-top:12px;background:${bgColor};border-left:4px solid ${borderColor};padding:14px 18px;border-radius:0 6px 6px 0;">
          <p style="font-weight:700;font-size:11px;color:${labelColor};text-transform:uppercase;margin:0 0 8px 0;">
            ${label} — Item ${idx + 1}
          </p>
          <p style="margin:0;white-space:pre-wrap;font-size:11px;line-height:1.7;color:${textColor};">${resFilled}</p>
        </div>`;
    }
    return `
      <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #e2e8f0;">
        <p style="font-weight:700;font-size:12px;color:#1e293b;margin:0 0 8px 0;">${idx + 1}. ${fillCommitteeTemplate(item.title, item.fields)}</p>
        <p style="font-size:11.5px;color:#374151;line-height:1.7;margin:0;white-space:pre-wrap;">${filled}</p>
        ${resBlock}
      </div>`;
  }).join("");

  const letterheadBlock = f.printOnLetterhead ? `
    <div style="text-align:center;border-bottom:3px double #064e3b;padding-bottom:14px;margin-bottom:20px;">
      <h2 style="margin:0;font-size:20px;font-weight:900;color:#064e3b;text-transform:uppercase;letter-spacing:1px;">${f.companyName || "[COMPANY NAME]"}</h2>
      <p style="margin:4px 0 0 0;font-size:11px;color:#475569;">CIN: ${f.cin || "—"}</p>
      <p style="margin:2px 0 0 0;font-size:11px;color:#475569;">Registered Office: ${f.regAddress || "—"}</p>
      ${f.printEmail ? `<p style="margin:2px 0 0 0;font-size:11px;color:#475569;">Email: ${f.printEmail}${f.printMobile ? " | Tel: " + f.printMobile : ""}</p>` : ""}
    </div>` : "";

  const serialLabel = `${ordinal(parseInt(f.meetingSerial) || 1)} Meeting of the ${commName}`;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>${commName} Minutes — ${f.companyName}</title>
  <style>
    @page { size:A4; margin:20mm 18mm; }
    body { font-family:'Times New Roman',Times,serif; font-size:12px; color:#1a1a1a; margin:0; padding:0; text-align:justify; }
    @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
    table { border-collapse:collapse; width:100%; }
  </style>
  </head><body>
  <div style="max-width:800px;margin:0 auto;padding:0;">

    ${letterheadBlock}

    <h3 style="text-align:center;font-size:15px;font-weight:900;text-transform:uppercase;color:#064e3b;margin:0 0 4px 0;letter-spacing:0.5px;">
      MINUTES OF THE ${serialLabel.toUpperCase()}
    </h3>
    <p style="text-align:center;font-size:11px;color:#64748b;margin:0 0 18px 0;">
      ${f.companyName} &nbsp;|&nbsp; ${fmtDate(f.meetingDate) || "—"}
    </p>

    <table style="margin-bottom:20px;border:1px solid #e2e8f0;">
      <thead><tr>
        <th colspan="4" style="${thStyle}font-size:11.5px;text-align:center;letter-spacing:0.5px;">MEETING DETAILS</th>
      </tr></thead>
      <tbody>
        <tr>
          <td style="${tdStyle2}font-weight:700;background:#f0fdf4;">Committee</td>
          <td style="${tdStyle2}" colspan="3">${commName}</td>
        </tr>
        <tr>
          <td style="${tdStyle2}font-weight:700;background:#f0fdf4;">Meeting No.</td>
          <td style="${tdStyle2}">${ordinal(parseInt(f.meetingSerial) || 1)} Meeting${f.financialYear ? " — FY " + f.financialYear : ""}</td>
          <td style="${tdStyle2}font-weight:700;background:#f0fdf4;">Date</td>
          <td style="${tdStyle2}">${fmtDate(f.meetingDate) || "—"}</td>
        </tr>
        <tr>
          <td style="${tdStyle2}font-weight:700;background:#f0fdf4;">Time</td>
          <td style="${tdStyle2}">${f.meetingTime || "—"}${f.closingTime ? " to " + f.closingTime : ""}</td>
          <td style="${tdStyle2}font-weight:700;background:#f0fdf4;">Venue</td>
          <td style="${tdStyle2}">${f.venue || "—"}</td>
        </tr>
        <tr>
          <td style="${tdStyle2}font-weight:700;background:#f0fdf4;">Chairman</td>
          <td style="${tdStyle2}" colspan="3">${f.chairmanName || "—"}${f.chairmanDesig ? ", " + f.chairmanDesig : ""}</td>
        </tr>
      </tbody>
    </table>

    <h4 style="font-size:12px;font-weight:800;color:#064e3b;border-bottom:2px solid #064e3b;padding-bottom:4px;margin:18px 0 10px 0;">
      ATTENDANCE
    </h4>
    <table style="margin-bottom:8px;">
      <thead><tr>
        <th style="${thStyle}">Name</th>
        <th style="${thStyle}">Designation</th>
        <th style="${thStyle}">DIN</th>
        <th style="${thStyle}">Role</th>
        <th style="${thStyle}">Status</th>
      </tr></thead>
      <tbody>${memberRows}</tbody>
    </table>
    <p style="font-size:10.5px;color:#475569;margin:4px 0 16px 0;">
      Members present: <b>${present.length}</b> out of <b>${f.committeeMembers.length}</b>
      &nbsp;|&nbsp; Quorum required: <b>2 members</b>
      &nbsp;|&nbsp; Quorum status: <b style="color:${present.length >= 2 ? "#16a34a" : "#dc2626"};">${present.length >= 2 ? "Quorum Present ✓" : "Quorum NOT Met ✗"}</b>
    </p>

    ${f.invitees.filter(i => i.name).length > 0 ? `
    <h4 style="font-size:12px;font-weight:800;color:#064e3b;border-bottom:2px solid #064e3b;padding-bottom:4px;margin:16px 0 10px 0;">
      OTHERS PRESENT (BY INVITATION)
    </h4>
    <table style="margin-bottom:16px;">
      <thead><tr>
        <th style="${thStyle}">Name</th><th style="${thStyle}">Designation / Role</th>
      </tr></thead>
      <tbody>${inviteeRows}</tbody>
    </table>` : ""}

    <h4 style="font-size:12px;font-weight:800;color:#064e3b;border-bottom:2px solid #064e3b;padding-bottom:4px;margin:16px 0 14px 0;">
      PROCEEDINGS
    </h4>
    ${agendaRows}

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 18px;margin:24px 0 20px 0;">
      <p style="font-weight:700;font-size:11px;color:#14532d;margin:0 0 8px 0;text-transform:uppercase;">Summary of Decisions & Recommendations</p>
      <p style="font-size:11px;color:#166534;margin:0;">
        Total Items: <b>${f.agendaItems.length}</b> &nbsp;&nbsp;
        Decisions: <b>${decisionCount}</b> &nbsp;&nbsp;
        Recommendations to Board: <b>${recommendationCount}</b>
      </p>
    </div>

    <div style="margin-top:40px;display:flex;justify-content:space-between;">
      <div style="text-align:center;width:45%;">
        <div style="border-top:1px solid #374151;padding-top:6px;font-size:11px;color:#374151;">
          <b>${f.chairmanName || "Chairman"}</b><br/>${f.chairmanDesig || "Chairman"}, ${commName}
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
  </div>
  </body></html>`;
}

/* ══════════════════════════════════════════════════════════════════
   GENERATE CTC HTML
══════════════════════════════════════════════════════════════════ */
function generateCommitteeCtcHTML(f: F): string {
  const resolutionItems = f.agendaItems.filter(
    item => item.resolutionType !== "none" && item.resolution.trim()
  );
  if (resolutionItems.length === 0) return "";

  const total = resolutionItems.length;
  const commName = getCommitteeDisplayName(f);
  const commShort = getCommitteeShort(f);
  const activeSigs = f.ctcSignatories.filter(s => s.name.trim()).length > 0
    ? f.ctcSignatories.filter(s => s.name.trim())
    : [{ name: f.chairmanName || "", designation: f.chairmanDesig || "Director", din: "" }];

  const pages: CtcParams[] = resolutionItems.map((item, i) => ({
    company: {
      companyName: f.companyName, cin: f.cin,
      regAddress: f.regAddress, email: f.printEmail, mobile: f.printMobile,
    },
    meeting: {
      meetingType: "committee",
      meetingTypeLabel: commName,
      meetingSerial: `${ordinal(parseInt(f.meetingSerial) || 1)} Meeting`,
      meetingDate: fmtDate(f.meetingDate),
      meetingTime: f.meetingTime,
      venue: f.venue,
      financialYear: f.financialYear,
    },
    resolution: {
      title: fillCommitteeTemplate(item.title, item.fields),
      text: fillCommitteeTemplate(item.resolution, item.fields),
      type: "ordinary",
      number: `Item ${f.agendaItems.findIndex(a => a.id === item.id) + 1} — ${ordinal(parseInt(f.meetingSerial) || 1)} ${commShort}/${f.financialYear || ""}`,
    },
    ctcIndex: i + 1,
    ctcTotal: total,
    signatories: activeSigs,
    printOnLetterhead: true,
    isDirectCTC: false,
  }));

  return generateCtcDocument(pages);
}

/* ══════════════════════════════════════════════════════════════════
   COMPLIANCE CHECKLIST
══════════════════════════════════════════════════════════════════ */
function CommitteeComplianceChecklist({ f }: { f: F }) {
  const meta = getCommitteeMeta(f.committeeType);
  const present = f.committeeMembers.filter(m => m.isPresent);
  const hasChairman = f.committeeMembers.some(m => m.role === "chairman" && m.name.trim());
  const items = [
    { ok: present.length >= 2, label: "Quorum: Minimum 2 members present" },
    { ok: hasChairman, label: "Chairman of committee designated" },
    { ok: !!f.committeeType, label: "Committee type identified" },
    { ok: !!f.meetingDate, label: "Meeting date specified" },
    { ok: !!f.meetingTime, label: "Meeting time specified" },
    { ok: !!f.venue, label: "Venue recorded" },
    { ok: !!f.noticeDate, label: "Notice date recorded" },
    { ok: f.agendaItems.length > 0, label: "At least one agenda item added" },
    { ok: f.agendaItems.some(a => a.resolutionType !== "none" && a.resolution.trim()), label: "At least one decision/recommendation drafted" },
    { ok: f.ctcSignatories.some(s => s.name.trim()), label: "CTC signatory specified" },
    { ok: !!f.companyName, label: "Company name filled" },
  ];
  const passCount = items.filter(i => i.ok).length;
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-emerald-900 text-sm">Checklist</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${passCount === items.length ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
          {passCount}/{items.length} ready
        </span>
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs">
            <span className={item.ok ? "text-emerald-600" : "text-slate-400"}>{item.ok ? "✓" : "○"}</span>
            <span className={item.ok ? "text-emerald-800" : "text-slate-500"}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   AGENDA PICKER MODAL
══════════════════════════════════════════════════════════════════ */
function AgendaPickerModal({
  committeeType, onAdd, onClose,
}: {
  committeeType: string;
  onAdd: (tpl: CommitteeAgendaTemplate) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const relevantTemplates = getRelevantTemplates(committeeType);
  const categories = ["all", ...COMMITTEE_CATEGORY_ORDER.filter(cat =>
    relevantTemplates.some(t => t.category === cat)
  )];
  const filtered = relevantTemplates.filter(t => {
    const matchCat = activeCat === "all" || t.category === activeCat;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm pt-10 px-4 pb-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-lg">Add Agenda Item</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
        </div>
        <div className="p-4 border-b border-slate-100">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="flex flex-wrap gap-1.5 mt-3">
            {categories.map(cat => {
              const meta = cat === "all" ? { label: "All", icon: "📋", color: "#475569" } : COMMITTEE_CATEGORY_META[cat];
              return (
                <button key={cat} onClick={() => setActiveCat(cat)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${activeCat === cat ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400"}`}>
                  {meta.icon} {meta.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-4 space-y-2 max-h-[55vh] overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-6">No templates found.</p>
          )}
          {filtered.map(tpl => {
            const catMeta = COMMITTEE_CATEGORY_META[tpl.category];
            return (
              <button key={tpl.id} onClick={() => { onAdd(tpl); onClose(); }}
                className="w-full text-left border border-slate-200 rounded-xl p-3 hover:border-emerald-400 hover:bg-emerald-50 transition-all group">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{tpl.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm group-hover:text-emerald-800">{tpl.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-slate-400">{catMeta.icon} {catMeta.label}</span>
                      {tpl.resolutionLaw && (
                        <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{tpl.resolutionLaw}</span>
                      )}
                      {tpl.resolutionType !== "none" && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tpl.resolutionType === "recommendation" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {tpl.resolutionType === "recommendation" ? "Recommendation" : "Decision"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STEP COMPONENTS
══════════════════════════════════════════════════════════════════ */

/* — STEP 1: Company Details — */
function Step1({ f, upd, onExcelData, session }: {
  f: F; upd: (x: Partial<F>) => void; onExcelData: (d: CompanyData) => void; session: any;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
        <b>Step 1 of 5 — Company Details.</b> Import from MCA Master Data Excel or fill manually.
      </div>

      <CompanyExcelUpload onFill={onExcelData} accent="blue" />

      <div className="border-t border-slate-100 pt-5">
        <CompanySearch
          value={f.companyName}
          onChange={val => upd({ companyName: val })}
          onSelect={(d) => upd({
            companyName: d.companyName, cin: d.cin || "",
            regAddress: d.regAddress || "", entityType: d.entityType || "Private Limited Company",
          })} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Company Name *</label>
          <input value={f.companyName} onChange={e => upd({ companyName: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. ABC Private Limited" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">CIN</label>
          <input value={f.cin} onChange={e => upd({ cin: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="U12345MH2010PTC123456" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Entity Type</label>
          <select value={f.entityType} onChange={e => upd({ entityType: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option>Private Limited Company</option>
            <option>Public Limited Company</option>
            <option>One Person Company (OPC)</option>
            <option>Section 8 Company</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Registered Office Address</label>
          <textarea value={f.regAddress} onChange={e => upd({ regAddress: e.target.value })}
            rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Full registered address including PIN" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Print Email (optional)</label>
          <input value={f.printEmail} onChange={e => upd({ printEmail: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="company@example.com" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Print Mobile (optional)</label>
          <input value={f.printMobile} onChange={e => upd({ printMobile: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="+91 98765 43210" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="lh" checked={f.printOnLetterhead}
            onChange={e => upd({ printOnLetterhead: e.target.checked })}
            className="w-4 h-4 rounded text-emerald-600" />
          <label htmlFor="lh" className="text-sm text-slate-600">Print on company letterhead</label>
        </div>
      </div>
    </div>
  );
}

/* — STEP 2: Committee & Meeting Details — */
function Step2({ f, upd }: { f: F; upd: (x: Partial<F>) => void }) {
  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
        <b>Step 2 of 5 — Committee & Meeting Details.</b> Select the committee type and fill in the meeting particulars.
      </div>

      {/* Committee Type Selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-2">Committee Type *</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {COMMITTEE_TYPES.map(ct => (
            <button key={ct.value} type="button"
              onClick={() => upd({ committeeType: ct.value })}
              className={`border-2 rounded-xl p-3 text-left transition-all hover:shadow-md ${f.committeeType === ct.value ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:border-emerald-300"}`}>
              <div className="flex items-start gap-2">
                <span className="text-xl">{ct.icon}</span>
                <div>
                  <p className="font-semibold text-slate-800 text-xs leading-tight">{ct.label}</p>
                  {ct.law && <p className="text-slate-400 text-[10px] mt-0.5">{ct.law}</p>}
                </div>
              </div>
            </button>
          ))}
        </div>
        {f.committeeType === "custom" && (
          <input value={f.customCommitteeName}
            onChange={e => upd({ customCommitteeName: e.target.value })}
            className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Enter committee name (e.g. Investment Committee)" />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Meeting Serial Number *</label>
          <input value={f.meetingSerial} onChange={e => upd({ meetingSerial: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. 1" type="number" min="1" />
          {f.meetingSerial && (
            <p className="text-xs text-slate-400 mt-1">
              Will appear as: "{ordinal(parseInt(f.meetingSerial) || 1)} Meeting of the {getCommitteeDisplayName(f)}"
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Financial Year (optional)</label>
          <input value={f.financialYear} onChange={e => upd({ financialYear: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. 2024-25" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Meeting Date *</label>
          <input type="date" value={f.meetingDate} onChange={e => upd({ meetingDate: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Notice Date</label>
          <input type="date" value={f.noticeDate} onChange={e => upd({ noticeDate: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Commencement Time *</label>
          <input type="time" value={f.meetingTime} onChange={e => upd({ meetingTime: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Closing Time</label>
          <input type="time" value={f.closingTime} onChange={e => upd({ closingTime: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Venue *</label>
          <input value={f.venue} onChange={e => upd({ venue: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. Registered Office / Board Room, 2nd Floor, ..." />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Chairman Name *</label>
          <input value={f.chairmanName} onChange={e => upd({ chairmanName: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. Mr. Anil Sharma" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Chairman Designation</label>
          <input value={f.chairmanDesig} onChange={e => upd({ chairmanDesig: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. Independent Director / Chairman" />
        </div>
      </div>
    </div>
  );
}

/* — STEP 3: Attendance — */
function Step3({ f, upd }: { f: F; upd: (x: Partial<F>) => void }) {
  const present = f.committeeMembers.filter(m => m.isPresent);
  const quorumOk = present.length >= 2;

  function updateMember(id: string, patch: Partial<CommitteeMember>) {
    upd({ committeeMembers: f.committeeMembers.map(m => m.id === id ? { ...m, ...patch } : m) });
  }
  function removeMember(id: string) {
    upd({ committeeMembers: f.committeeMembers.filter(m => m.id !== id) });
  }
  function addMember() {
    upd({ committeeMembers: [...f.committeeMembers, BLANK_MEMBER()] });
  }
  function updateInvitee(id: string, patch: Partial<Invitee>) {
    upd({ invitees: f.invitees.map(i => i.id === id ? { ...i, ...patch } : i) });
  }
  function removeInvitee(id: string) {
    upd({ invitees: f.invitees.filter(i => i.id !== id) });
  }

  function importFromDirectors() {
    if (!f.companyDirectors?.length) return;
    const members: CommitteeMember[] = f.companyDirectors.slice(0, 4).map((d, i) => ({
      id: crypto.randomUUID(), name: d.name, designation: d.designation || "Director",
      din: d.din || "", isPresent: true, role: i === 0 ? "chairman" : "member",
    }));
    upd({ committeeMembers: members });
  }

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
        <b>Step 3 of 5 — Attendance.</b> Committee members require minimum 2 members present for quorum.
      </div>

      {/* Quorum Banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${quorumOk ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
        <span className="text-xl">{quorumOk ? "✅" : "⚠️"}</span>
        <div>
          <p className={`text-sm font-bold ${quorumOk ? "text-emerald-800" : "text-red-800"}`}>
            {quorumOk ? `Quorum Present — ${present.length} member${present.length !== 1 ? "s" : ""} present` : `Quorum NOT Met — Only ${present.length} member${present.length !== 1 ? "s" : ""} present (need 2)`}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Minimum quorum: 2 Committee Members</p>
        </div>
      </div>

      {/* Committee Members */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800 text-sm">Committee Members</h3>
          <div className="flex gap-2">
            {f.companyDirectors?.length > 0 && (
              <button onClick={importFromDirectors}
                className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-100 transition-colors">
                Import from Directors
              </button>
            )}
            <button onClick={addMember}
              className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-100 transition-colors">
              + Add Member
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {f.committeeMembers.map((m, idx) => (
            <div key={m.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                  <input value={m.name} onChange={e => updateMember(m.id, { name: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    placeholder="Member name" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Designation</label>
                  <input value={m.designation} onChange={e => updateMember(m.id, { designation: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    placeholder="Director / CFO" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">DIN (optional)</label>
                  <input value={m.din} onChange={e => updateMember(m.id, { din: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    placeholder="DIN / —" />
                </div>
              </div>
              <div className="flex items-center gap-5 flex-wrap">
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input type="checkbox" checked={m.isPresent} onChange={e => updateMember(m.id, { isPresent: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600" />
                  <span className={m.isPresent ? "text-emerald-700 font-semibold" : "text-slate-400"}>Present</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Role:</span>
                  <select value={m.role} onChange={e => updateMember(m.id, { role: e.target.value as "chairman" | "member" })}
                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white">
                    <option value="chairman">Chairman</option>
                    <option value="member">Member</option>
                  </select>
                </div>
                {f.committeeMembers.length > 2 && (
                  <button onClick={() => removeMember(m.id)} className="ml-auto text-xs text-red-400 hover:text-red-600 transition-colors">
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invitees */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800 text-sm">Others Present (By Invitation)</h3>
          <button onClick={() => upd({ invitees: [...f.invitees, BLANK_INVITEE()] })}
            className="text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-100 transition-colors">
            + Add Invitee
          </button>
        </div>
        {f.invitees.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No invitees added (e.g. CFO, Internal Auditor, Statutory Auditor)</p>
        ) : (
          <div className="space-y-2">
            {f.invitees.map(inv => (
              <div key={inv.id} className="flex items-center gap-2">
                <input value={inv.name} onChange={e => updateInvitee(inv.id, { name: e.target.value })}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Name" />
                <input value={inv.designation} onChange={e => updateInvitee(inv.id, { designation: e.target.value })}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Designation / Role" />
                <button onClick={() => removeInvitee(inv.id)} className="text-red-400 hover:text-red-600 text-lg leading-none px-1">×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* — STEP 4: Agenda — */
function Step4({ f, upd }: { f: F; upd: (x: Partial<F>) => void }) {
  const [showPicker, setShowPicker] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function addTemplate(tpl: CommitteeAgendaTemplate) {
    const item = defaultAgendaItem(tpl.id);
    upd({ agendaItems: [...f.agendaItems, item] });
    setExpandedId(item.id);
  }
  function removeItem(id: string) {
    upd({ agendaItems: f.agendaItems.filter(a => a.id !== id) });
  }
  function updateItem(id: string, patch: Partial<AgendaItemData>) {
    upd({ agendaItems: f.agendaItems.map(a => a.id === id ? { ...a, ...patch } : a) });
  }
  function updateField(id: string, key: string, val: string) {
    const item = f.agendaItems.find(a => a.id === id)!;
    updateItem(id, { fields: { ...item.fields, [key]: val } });
  }
  function moveItem(id: string, dir: -1 | 1) {
    const idx = f.agendaItems.findIndex(a => a.id === id);
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === f.agendaItems.length - 1)) return;
    const arr = [...f.agendaItems];
    [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];
    upd({ agendaItems: arr });
  }

  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
        <b>Step 4 of 5 — Agenda Items.</b> Add and customise agenda items. Fill in template fields to auto-complete discussion text.
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{f.agendaItems.length} item{f.agendaItems.length !== 1 ? "s" : ""} on agenda</p>
        <button onClick={() => setShowPicker(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all hover:scale-105 shadow-sm">
          + Add Item
        </button>
      </div>

      {f.agendaItems.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
          <p className="text-slate-400 text-sm">No agenda items yet. Click "Add Item" to begin.</p>
        </div>
      )}

      <div className="space-y-2">
        {f.agendaItems.map((item, idx) => {
          const tpl = ALL_COMMITTEE_TEMPLATES.find(t => t.id === item.templateId);
          const isExpanded = expandedId === item.id;
          const previewDiscussion = fillCommitteeTemplate(item.discussion, item.fields);

          return (
            <div key={item.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              {/* Header */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                <span className="text-slate-400 text-xs font-mono w-5 shrink-0">{idx + 1}.</span>
                <span className="text-base">{tpl?.icon ?? "📌"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {fillCommitteeTemplate(item.title, item.fields)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.resolutionType !== "none" && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.resolutionType === "recommendation" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {item.resolutionType === "recommendation" ? "Recommendation" : "Decision"}
                      </span>
                    )}
                    {item.resolutionType === "none" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">No resolution</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={e => { e.stopPropagation(); moveItem(item.id, -1); }}
                    className="text-slate-300 hover:text-slate-600 px-1 py-0.5 text-xs" title="Move Up">▲</button>
                  <button onClick={e => { e.stopPropagation(); moveItem(item.id, 1); }}
                    className="text-slate-300 hover:text-slate-600 px-1 py-0.5 text-xs" title="Move Down">▼</button>
                  <button onClick={e => { e.stopPropagation(); removeItem(item.id); }}
                    className="text-red-300 hover:text-red-500 px-1 py-0.5 text-sm ml-1">×</button>
                  <span className="text-slate-400 text-xs ml-1">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Expanded */}
              {isExpanded && (
                <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/50">
                  {/* Template Fields */}
                  {tpl && tpl.fields.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Template Fields</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {tpl.fields.map(field => (
                          <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                            <label className="block text-xs font-medium text-slate-500 mb-1">{field.label}</label>
                            {field.type === "textarea" ? (
                              <textarea
                                value={item.fields[field.key] ?? ""}
                                onChange={e => updateField(item.id, field.key, e.target.value)}
                                rows={3}
                                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                                placeholder={field.placeholder} />
                            ) : (
                              <input
                                type={field.type ?? "text"}
                                value={item.fields[field.key] ?? ""}
                                onChange={e => updateField(item.id, field.key, e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                                placeholder={field.placeholder} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Discussion Text */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Discussion Text</p>
                    <textarea
                      value={item.discussion}
                      onChange={e => updateItem(item.id, { discussion: e.target.value })}
                      rows={4}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      placeholder="Discussion text for minutes..." />
                  </div>

                  {/* Resolution Type */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Resolution Type</label>
                    <div className="flex gap-2 flex-wrap">
                      {(["decision", "recommendation", "none"] as const).map(rt => (
                        <button key={rt} type="button"
                          onClick={() => updateItem(item.id, { resolutionType: rt })}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${item.resolutionType === rt ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400"}`}>
                          {rt === "none" ? "No Resolution" : rt === "recommendation" ? "Recommendation to Board" : "Committee Decision"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Resolution Text */}
                  {item.resolutionType !== "none" && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        {item.resolutionType === "recommendation" ? "Recommendation Text" : "Decision Text"}
                      </p>
                      <textarea
                        value={item.resolution}
                        onChange={e => updateItem(item.id, { resolution: e.target.value })}
                        rows={5}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        placeholder="RESOLVED THAT / The Committee recommends that..." />
                    </div>
                  )}

                  {/* Preview */}
                  <details className="group">
                    <summary className="text-xs text-emerald-600 cursor-pointer hover:text-emerald-800 font-medium">Preview filled text ▾</summary>
                    <div className="mt-2 bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {previewDiscussion || "(empty)"}
                    </div>
                  </details>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showPicker && (
        <AgendaPickerModal
          committeeType={f.committeeType}
          onAdd={addTemplate}
          onClose={() => setShowPicker(false)} />
      )}
    </div>
  );
}

/* — STEP 5: Preview & Print — */
function Step5({ f, upd, session }: { f: F; upd: (x: Partial<F>) => void; session: any }) {
  const commName = getCommitteeDisplayName(f);

  function openMinutes() {
    const html = generateCommitteeHTML(f);
    const w = window.open("", "_blank");
    if (!w) { alert("Please allow popups to open."); return; }
    if (!session) { w.document.write(injectPreviewWatermark(html)); w.document.close(); }
    else { w.document.write(html); w.document.close(); w.onload = () => w.print(); }
  }

  function openCTC() {
    const html = generateCommitteeCtcHTML(f);
    if (!html) { alert("No decisions/recommendations found. Please add at least one agenda item with a Decision or Recommendation."); return; }
    const w = window.open("", "_blank");
    if (!w) { alert("Please allow popups to open."); return; }
    if (!session) { w.document.write(injectPreviewWatermark(html)); w.document.close(); }
    else { w.document.write(html); w.document.close(); w.onload = () => w.print(); }
  }

  const resolutionItems = f.agendaItems.filter(a => a.resolutionType !== "none" && a.resolution.trim());
  const present = f.committeeMembers.filter(m => m.isPresent);

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
        <b>Step 5 of 5 — Preview & Print.</b> Review the summary below, then generate your minutes or CTC documents.
      </div>

      {/* Summary Card */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-800 px-5 py-3 text-white flex items-center gap-3">
          <span className="text-xl">{getCommitteeMeta(f.committeeType).icon}</span>
          <div>
            <p className="font-bold text-sm">{ordinal(parseInt(f.meetingSerial) || 1)} Meeting of the {commName}</p>
            <p className="text-slate-300 text-xs">{f.companyName || "—"}</p>
          </div>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-400">Date</p>
            <p className="font-semibold text-slate-800">{fmtDate(f.meetingDate) || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Venue</p>
            <p className="font-semibold text-slate-800 text-xs">{f.venue || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Members Present</p>
            <p className={`font-semibold ${present.length >= 2 ? "text-emerald-700" : "text-red-600"}`}>
              {present.length}/{f.committeeMembers.length} (Quorum: {present.length >= 2 ? "Met ✓" : "Not Met ✗"})
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Agenda Items</p>
            <p className="font-semibold text-slate-800">{f.agendaItems.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Decisions / Recommendations</p>
            <p className="font-semibold text-slate-800">{resolutionItems.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">CTC Signatories</p>
            <p className="font-semibold text-slate-800">{f.ctcSignatories.filter(s => s.name.trim()).length}</p>
          </div>
        </div>
      </div>

      {/* CTC Signatories */}
      <div>
        <h3 className="font-bold text-slate-800 text-sm mb-3">CTC Signatories (for Certified True Copy)</h3>
        <div className="space-y-3">
          {f.ctcSignatories.map((sig, i) => (
            <div key={i} className="grid grid-cols-3 gap-3">
              <input value={sig.name}
                onChange={e => { const s = [...f.ctcSignatories]; s[i] = { ...s[i], name: e.target.value }; upd({ ctcSignatories: s }); }}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={`Signatory ${i + 1} Name`} />
              <input value={sig.designation}
                onChange={e => { const s = [...f.ctcSignatories]; s[i] = { ...s[i], designation: e.target.value }; upd({ ctcSignatories: s }); }}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Designation" />
              <input value={sig.din}
                onChange={e => { const s = [...f.ctcSignatories]; s[i] = { ...s[i], din: e.target.value }; upd({ ctcSignatories: s }); }}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="DIN (optional)" />
            </div>
          ))}
          <button onClick={() => upd({ ctcSignatories: [...f.ctcSignatories, { name: "", designation: "Director", din: "" }] })}
            className="text-xs text-emerald-600 hover:text-emerald-800 font-medium">+ Add Signatory</button>
        </div>
      </div>

      {/* Compliance Checklist */}
      <CommitteeComplianceChecklist f={f} />

      {/* Print Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <button onClick={openMinutes}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-2xl transition-all hover:scale-105 shadow-lg text-sm">
          <span className="text-lg">📄</span>
          <div className="text-left">
            <div>Generate Minutes</div>
            <div className="text-emerald-200 text-xs font-normal">Full meeting minutes (print/PDF)</div>
          </div>
        </button>
        <button onClick={openCTC}
          disabled={resolutionItems.length === 0}
          className={`flex items-center justify-center gap-2 font-bold py-4 px-6 rounded-2xl transition-all text-sm ${resolutionItems.length > 0 ? "bg-teal-600 hover:bg-teal-700 text-white hover:scale-105 shadow-lg" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
          <span className="text-lg">🖊️</span>
          <div className="text-left">
            <div>Generate CTC</div>
            <div className={`text-xs font-normal ${resolutionItems.length > 0 ? "text-teal-200" : "text-slate-400"}`}>
              {resolutionItems.length > 0 ? `${resolutionItems.length} decision${resolutionItems.length !== 1 ? "s" : ""} — Certified True Copies` : "No decisions/recommendations found"}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STEP INDICATOR
══════════════════════════════════════════════════════════════════ */
function StepIndicator({ step, total }: { step: number; total: number }) {
  const labels = ["Company", "Committee", "Attendance", "Agenda", "Preview"];
  return (
    <div className="flex items-center justify-between gap-1 mb-6 overflow-x-auto">
      {labels.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={n} className="flex items-center gap-1 min-w-0">
            <div className={`flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold ${active ? "text-emerald-700" : done ? "text-emerald-500" : "text-slate-400"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${active ? "bg-emerald-600 text-white" : done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                {done ? "✓" : n}
              </div>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < labels.length - 1 && <div className="flex-1 h-px bg-slate-200 min-w-[8px] mx-1" />}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════ */
function CommitteePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [f, setF] = useState<F>(INITIAL_F);
  const [draftSaved, setDraftSaved] = useState(false);

  function upd(patch: Partial<F>) {
    setF(prev => ({ ...prev, ...patch }));
  }

  /* — Draft persistence — */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) setF(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(f));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 1500);
      } catch { /* ignore */ }
    }, 800);
    return () => clearTimeout(timer);
  }, [f]);

  /* — Excel import — */
  function handleExcelData(d: CompanyData) {
    upd({
      companyName: d.companyName ?? f.companyName,
      cin: d.cin ?? f.cin,
      regAddress: d.regAddress ?? f.regAddress,
      entityType: d.entityType ?? f.entityType,
      incorporationDate: parseMcaDate(d.incorporationDate ?? "") || f.incorporationDate,
      companyDirectors: (d.directors ?? []).map(dir => ({
        name: dir.name ?? "", designation: dir.designation ?? "Director", din: dir.din ?? "",
      })),
    });
  }

  /* — When committee type changes, refresh relevant mandatory items if agenda is default — */
  useEffect(() => {
    // Don't auto-reset if user has already customised agenda
  }, [f.committeeType]);

  function clearDraft() {
    if (!confirm("Clear all data and start fresh?")) return;
    localStorage.removeItem(DRAFT_KEY);
    setF(INITIAL_F);
    setStep(1);
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link href="/tools/documents/minutes" className="text-xs text-emerald-600 hover:underline flex items-center gap-1 mb-2">
              ← Minutes Generator
            </Link>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1">
              Committee Meeting{" "}
              <span style={{ background: "linear-gradient(90deg,#059669,#0891b2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Minutes Generator
              </span>
            </h1>
            <p className="text-slate-500 text-sm">
              Audit Committee · NRC · CSR · Risk · SRC · Finance — CA 2013 &amp; SEBI LODR Compliant
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {draftSaved && (
              <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                Draft saved ✓
              </span>
            )}
            <button onClick={clearDraft}
              className="text-xs text-slate-500 hover:text-red-500 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors">
              Clear Draft
            </button>
          </div>
        </div>
      </section>

      {/* Main */}
      <div className="max-w-4xl mx-auto px-4 py-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Form Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <StepIndicator step={step} total={5} />

              {step === 1 && <Step1 f={f} upd={upd} onExcelData={handleExcelData} session={session} />}
              {step === 2 && <Step2 f={f} upd={upd} />}
              {step === 3 && <Step3 f={f} upd={upd} />}
              {step === 4 && <Step4 f={f} upd={upd} />}
              {step === 5 && <Step5 f={f} upd={upd} session={session} />}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  ← Back
                </button>
                <span className="text-xs text-slate-400">Step {step} of 5</span>
                <button onClick={() => setStep(s => Math.min(5, s + 1))} disabled={step === 5}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
                  Next →
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Nav */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Quick Navigation</p>
              <div className="space-y-1">
                {[
                  { n: 1, label: "Company Details", icon: "🏢" },
                  { n: 2, label: "Committee & Meeting", icon: "👥" },
                  { n: 3, label: "Attendance", icon: "✅" },
                  { n: 4, label: "Agenda Items", icon: "📋" },
                  { n: 5, label: "Preview & Print", icon: "🖨️" },
                ].map(({ n, label, icon }) => (
                  <button key={n} onClick={() => setStep(n)}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${step === n ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-slate-600 hover:bg-slate-50"}`}>
                    <span>{icon}</span> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Current Meeting</p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Committee:</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[55%] truncate">{getCommitteeDisplayName(f)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Company:</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[55%] truncate">{f.companyName || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-semibold text-slate-800">{fmtDate(f.meetingDate) || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Members Present:</span>
                  <span className={`font-semibold ${f.committeeMembers.filter(m => m.isPresent).length >= 2 ? "text-emerald-600" : "text-red-500"}`}>
                    {f.committeeMembers.filter(m => m.isPresent).length}/{f.committeeMembers.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Agenda Items:</span>
                  <span className="font-semibold text-slate-800">{f.agendaItems.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Decisions / Recs:</span>
                  <span className="font-semibold text-slate-800">
                    {f.agendaItems.filter(a => a.resolutionType !== "none" && a.resolution.trim()).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Tip */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
              <p className="font-bold mb-1">Pro Tip</p>
              <p>Committee decisions are not resolutions — they are either <b>decisions</b> (binding on the committee&apos;s mandate) or <b>recommendations</b> to the Board for formal approval. The CTC documents this distinction.</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-200 py-5 px-4 mt-auto bg-white">
        <div className="max-w-4xl mx-auto text-center text-xs text-slate-400">
          <Link href="/tools/documents/minutes" className="text-emerald-600 hover:underline">← All Meeting Minutes</Link>
          {" · "}© {new Date().getFullYear()} ComplianceSearch.in · For professional use only
        </div>
      </footer>
    </main>
  );
}

export default function CommitteePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>}>
      <CommitteePage />
    </Suspense>
  );
}
