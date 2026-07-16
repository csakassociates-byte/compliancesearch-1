"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import CompanySearch from "@/components/CompanySearch";
import CompanyExcelUpload from "@/components/CompanyExcelUpload";
import type { CompanyData } from "@/lib/types/company";
import { injectPreviewWatermark } from "@/lib/preview-protection";
import { useSession } from "next-auth/react";

/* ═══════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════ */
interface ExistingDirector {
  id: string; name: string; din: string; designation: string; isPresent: boolean;
}

type DesignationType =
  | "additional_director" | "alternate_director" | "nominee_director"
  | "managing_director" | "whole_time_director" | "independent_director"
  | "director_gm";

interface NewDirectorEntry {
  id: string;
  name: string; fatherName: string; din: string; dob: string; pan: string;
  address: string; city: string; state: string; pincode: string;
  email: string; mobile: string; nationality: string; occupation: string;
  effectiveDate: string;
  originalDirector: string; originalDin: string;
  nominatingBody: string;
  termYears: string;
}

interface F {
  companyName: string; cin: string; regAddress: string; entityType: string;
  ndDesignation: DesignationType;
  directorCount: number;
  newDirectors: NewDirectorEntry[];
  meetingDate: string; meetingTime: string; meetingSerial: string; venue: string;
  chairmanName: string; chairmanDin: string;
  directors: ExistingDirector[];
}

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════ */
const DESIGNATION_LABEL: Record<string, string> = {
  additional_director:  "Additional Director",
  alternate_director:   "Alternate Director",
  nominee_director:     "Nominee Director",
  managing_director:    "Managing Director",
  whole_time_director:  "Whole-time Director",
  independent_director: "Independent Director",
  director_gm:          "Director (Appointed at General Meeting)",
};

const SECTION_REF: Record<string, string> = {
  additional_director:  "Section 161(1)",
  alternate_director:   "Section 161(2)",
  nominee_director:     "Section 161(3)",
  managing_director:    "Section 196 read with Schedule V",
  whole_time_director:  "Section 196 read with Schedule V",
  independent_director: "Section 149(4) & 149(6) read with Schedule IV",
  director_gm:          "Section 152",
};

const DRAFT_KEY = "csi_cak_dir_appt_v2";

function makeNd(): NewDirectorEntry {
  return {
    id: `nd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "", fatherName: "", din: "", dob: "", pan: "",
    address: "", city: "", state: "", pincode: "",
    email: "", mobile: "", nationality: "Indian", occupation: "",
    effectiveDate: "",
    originalDirector: "", originalDin: "",
    nominatingBody: "", termYears: "5",
  };
}

const DEFAULT: F = {
  companyName: "", cin: "", regAddress: "", entityType: "pvt_ltd",
  ndDesignation: "additional_director",
  directorCount: 1,
  newDirectors: [makeNd()],
  meetingDate: "", meetingTime: "", meetingSerial: "", venue: "",
  chairmanName: "", chairmanDin: "",
  directors: [],
};

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════ */
function fmtDate(d: string): string {
  if (!d) return "___________";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return d; }
}
function fmtDay(d: string): string {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("en-IN", { weekday: "long" }); } catch { return ""; }
}
function fmtTime(t: string): string {
  if (!t) return "___";
  const [h, m] = t.split(":").map(Number);
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h >= 12 ? "P.M." : "A.M."}`;
}
function numWords(n: string): string {
  const map: Record<string, string> = { "1":"One","2":"Two","3":"Three","4":"Four","5":"Five","6":"Six","7":"Seven","8":"Eight","9":"Nine","10":"Ten" };
  return map[n] || n;
}
function addDays(dateStr: string, days: number): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
function ordinalDate(dateStr: string): string {
  if (!dateStr) return "___________";
  try {
    const d = new Date(dateStr + "T00:00:00");
    const day = d.getDate();
    const suffix = [11,12,13].includes(day) ? "th" : (["st","nd","rd"][((day%10)-1)] || "th");
    const month = d.toLocaleDateString("en-IN", { month: "short" }).toUpperCase();
    const year = d.getFullYear();
    return `${day}<sup>${suffix}</sup> DAY OF ${month}, ${year}`;
  } catch { return dateStr; }
}
function calcDates(meetingDate: string, isGM = false) {
  if (!meetingDate) return { noticeDate: "", rocDeadline: "", mr1Deadline: "" };
  return {
    noticeDate:   addDays(meetingDate, isGM ? -21 : -7),
    rocDeadline:  addDays(meetingDate, 30),
    mr1Deadline:  addDays(meetingDate, 60),
  };
}

/* ═══════════════════════════════════════════════════════════════════
   DOCUMENT GENERATORS
═══════════════════════════════════════════════════════════════════ */
const DOC_CSS = `
  body{font-family:'Times New Roman',Times,serif;color:#000;font-size:12pt;line-height:1.8;margin:0;padding:0;}
  .page{max-width:720px;margin:0 auto;padding:50px 60px;}
  .co-hdr{text-align:center;border-bottom:2.5px solid #000;padding-bottom:14px;margin-bottom:22px;}
  .co-hdr h1{font-size:14pt;font-weight:bold;margin:0 0 4px;text-transform:uppercase;letter-spacing:.5px;}
  .co-hdr p{font-size:10.5pt;margin:2px 0;}
  .doc-title{text-align:center;font-weight:bold;font-size:13pt;text-decoration:underline;margin:18px 0 14px;}
  .subject{font-weight:bold;text-decoration:underline;margin:14px 0;}
  .res-box{border-left:3px solid #000;padding:8px 16px;margin:18px 0;background:#fafafa;}
  .res-box p{margin:10px 0;}
  .sign-block{margin-top:56px;}
  .field-row{margin:10px 0;}
  .field-lbl{font-weight:bold;}
  .field-val{border-bottom:1px solid #000;display:inline-block;min-width:280px;padding:0 4px;}
  ol li{margin-bottom:8px;}
  .decl-box{border:1px solid #555;padding:14px 18px;margin:18px 0;}
  .mf-label{font-size:9pt;text-align:center;margin-bottom:14px;font-style:italic;}
  .page-break{page-break-before:always;break-before:page;margin-top:40px;padding-top:40px;}
  @media print{.page{padding:30px 40px;}body{font-size:11pt;}@page{size:A4;margin:15mm;}}
`;

function wrap(body: string, title: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>${DOC_CSS}</style></head><body><div class="page">${body}</div></body></html>`;
}
function coHeader(f: F): string {
  return `<div class="co-hdr"><h1>${f.companyName || "[COMPANY NAME]"}</h1><p>CIN: ${f.cin || "___________________"}</p><p>${f.regAddress || "[Registered Office Address]"}</p></div>`;
}
function signBlock(name: string, din: string, dateStr: string): string {
  return `<table style="width:100%;"><tr><td style="width:55%;vertical-align:bottom;"><br><br>____________________________<br><strong>${name || "[Authorised Signatory]"}</strong>${din ? `<br>DIN: ${din}` : ""}</td><td style="text-align:right;vertical-align:bottom;">Date: ${fmtDate(dateStr)}<br>Place: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td></tr></table>`;
}

/* ── 1. Board Notice ──────────────────────────────────────────── */
function genBoardNotice(f: F, nds: NewDirectorEntry[]): string {
  const { noticeDate } = calcDates(f.meetingDate);
  const presentDirs = f.directors.filter(d => d.isPresent);
  const needsEGM = f.ndDesignation === "director_gm";
  const isMdWtd = f.ndDesignation === "managing_director" || f.ndDesignation === "whole_time_director";
  const desg = DESIGNATION_LABEL[f.ndDesignation];

  const ndNames = nds.map(nd => `<strong>${nd.name || "___________"}</strong>`).join(" and ");

  function dirsSignTable(dirs: ExistingDirector[]): string {
    const d = dirs.slice(0, 2);
    if (!d.length) return `<table style="width:100%;"><tr><td><br><strong>[Director]</strong><br>Director</td></tr></table>`;
    const cells = d.map(x => `<td style="width:50%;vertical-align:top;padding-right:12px;"><br><strong>${x.name}</strong><br>Director<br>DIN: ${x.din}</td>`).join("");
    return `<table style="width:100%;"><tr>${cells}</tr></table>`;
  }

  const agendaItems = needsEGM ? `
    <li>Appointment of ${ndNames} as Director of the Company<br>To consider appointment of directors.</li>
    <li>To approve notice of Extra-Ordinary General Meeting (EGM) and explanatory statement.</li>
    <li>To fix date, time and venue of EGM.</li>
    <li>To authorize a Director to file necessary forms with ROC.</li>
    <li>Any other business with the permission of the Chair.</li>` : `
    <li>Appointment of ${ndNames} as <strong>${desg}</strong> of the Company<br>To consider and approve the appointment.</li>
    <li>To authorize a Director to file Form DIR-12 with the Registrar of Companies within 30 days of appointment.</li>
    ${isMdWtd ? `<li>To authorize a Director to file Form MR-1 with the Registrar of Companies within 60 days of appointment.</li>` : ""}
    <li>Any other business with the permission of the Chair.</li>`;

  const body = `
    <div style="text-align:center;font-weight:bold;font-size:14pt;margin-bottom:4px;">NOTICE OF BOARD MEETING</div>
    <div style="text-align:center;font-size:11pt;margin-bottom:18px;">(Section 173 of Companies Act, 2013)</div>
    ${coHeader(f)}
    <p style="font-weight:bold;font-size:13pt;margin:18px 0 8px;">NOTICE</p>
    <p>Notice is hereby given that the <strong>${f.meetingSerial || "___"}</strong> Meeting of the Board of Directors of <strong>${f.companyName || "[Company Name]"}</strong> will be held on <strong>${fmtDay(f.meetingDate)}, ${ordinalDate(f.meetingDate)}</strong> at <strong>${fmtTime(f.meetingTime)}</strong> at ${f.venue || "the Registered Office of the Company"} to transact the following business:</p>
    <p style="font-weight:bold;margin-top:18px;text-decoration:underline;">AGENDA</p>
    <ol>${agendaItems}</ol>
    <div class="sign-block" style="margin-top:40px;">
      <p>By Order of the Board<br>For <strong>${f.companyName || "[Company Name]"}</strong></p>
      ${dirsSignTable(presentDirs)}
      <br>
      <p>Date: ${fmtDate(noticeDate)}<br>Place: ${f.venue || f.regAddress || "_______________"}</p>
    </div>`;
  return wrap(body, "Board Notice — Director Appointment");
}

/* ── 2. Board Resolution (CTC Format) ────────────────────────── */
function genBoardResolution(f: F, nds: NewDirectorEntry[]): string {
  const presentDirs = f.directors.filter(d => d.isPresent);
  const isMdWtd = f.ndDesignation === "managing_director" || f.ndDesignation === "whole_time_director";
  const isGMType = f.ndDesignation === "director_gm";
  const desg = DESIGNATION_LABEL[f.ndDesignation];
  const sec  = SECTION_REF[f.ndDesignation];

  function resolvedThat(nd: NewDirectorEntry): string {
    const eff  = fmtDate(nd.effectiveDate || f.meetingDate);
    const term = `${nd.termYears || "5"} (${numWords(nd.termYears || "5")}) years`;
    const namedin = `${nd.name || "___________"} having DIN ${nd.din || "________"}`;
    if (f.ndDesignation === "additional_director")
      return `pursuant to the provisions of Section 161(1) and all other applicable provisions of the Companies Act, 2013 read with rules made thereunder and provisions of the Articles of Associations of the Company, ${namedin}, who has submitted Form DIR-2 and Form DIR-8, be and is hereby appointed as <strong>Additional Director</strong> with effect from ${eff}, to hold office up to the date of the next AGM or the last date on which the AGM should have been held, whichever is earlier.`;
    if (f.ndDesignation === "alternate_director")
      return `pursuant to Section 161(2) and all other applicable provisions of the Companies Act, 2013, ${namedin}, who has submitted Form DIR-2 and Form DIR-8, be and is hereby appointed as <strong>Alternate Director</strong> in place of ${nd.originalDirector || "[Original Director]"}${nd.originalDin ? ` having DIN ${nd.originalDin}` : ""}, during his/her absence from India for not less than 3 months, with effect from ${eff}.`;
    if (f.ndDesignation === "nominee_director")
      return `pursuant to Section 161(3) of the Companies Act, 2013 and the Articles of Association, ${namedin}, as nominated by ${nd.nominatingBody || "[Nominating Body]"}, who has submitted Form DIR-2 and Form DIR-8, be and is hereby appointed as <strong>Nominee Director</strong> with effect from ${eff}.`;
    if (f.ndDesignation === "managing_director")
      return `pursuant to Sections 196, 197, 203 and all other applicable provisions of the Companies Act, 2013 read with Schedule V and the Companies (Appointment and Remuneration of Managerial Personnel) Rules, 2014, and subject to shareholders&rsquo; approval at the next General Meeting, ${namedin}, who has submitted Form DIR-2 and Form DIR-8, be and is hereby appointed as <strong>Managing Director</strong> for a term of ${term} with effect from ${eff}, on such terms and conditions as the Board may determine.`;
    if (f.ndDesignation === "whole_time_director")
      return `pursuant to Sections 196, 197, 203 and all other applicable provisions of the Companies Act, 2013 read with Schedule V, and subject to shareholders&rsquo; approval at the next General Meeting, ${namedin}, who has submitted Form DIR-2 and Form DIR-8, be and is hereby appointed as <strong>Whole-time Director</strong> for a term of ${term} with effect from ${eff}.`;
    if (f.ndDesignation === "independent_director")
      return `pursuant to Section 161(1) read with Section 149(4) &amp; (6) and Schedule IV of the Companies Act, 2013, ${namedin}, who has submitted Form DIR-2, Form DIR-8, and Declaration of Independence under Section 149(7), be and is hereby appointed as <strong>Additional Independent Director</strong> with effect from ${eff}, to hold office till the conclusion of the next AGM or 3 months from appointment, whichever is earlier.`;
    // director_gm — Board recommends to EGM
    return `pursuant to the provisions of Section 152 read with Rule 8, 9, and 14 of Companies (Appointment and Qualification of Directors) Rules, 2014 and other applicable provisions of the Companies Act, 2013 read with rules made thereunder (including any statutory modifications or re-enactment thereof for the time being in force) and provisions of the Articles of Associations of the Company, subject to consent of the shareholders of the Company in EGM be and are hereby accorded to ${nd.name || "___________"} having DIN ${nd.din || "________"}, will be appointed with effect from ${eff}`;
  }

  const filingClause = isMdWtd
    ? `any of the director of the company be and is hereby authorized to file Form DIR-12 within 30 days and Form MR-1 within 60 days of this appointment, and to do all such acts /deeds/things as may deem fit to give effect to this resolution.`
    : isGMType
    ? `any of the director of the company be and is hereby authorized to approve the EGM notice and fix the date, time and venue of EGM and to file necessary forms with the Registrar of Companies, to do all such acts /deeds/things as may deem fit to give effect to this resolution.`
    : `any of the director of the company be and is hereby authorized to file Form DIR-12 with the Registrar of Companies, to do all such acts /deeds/things as may deem fit to give effect to this resolution.`;

  const ndNamesTitle = nds.map(nd => (nd.name || "___________").toUpperCase()).join(" AND ");
  const resolutionClauses = nds.map(nd =>
    `<p style="margin:12px 0;">"<strong>RESOLVED THAT</strong> ${resolvedThat(nd)}</p>`
  ).join("");

  function dirsSignTable(dirs: ExistingDirector[]): string {
    const d = dirs.slice(0, 2);
    if (!d.length) return `<table style="width:100%;"><tr><td><br><br>____________________________<br><strong>[Director]</strong><br>Director</td></tr></table>`;
    const cells = d.map(x => `<td style="width:50%;vertical-align:top;padding-right:12px;"><br><strong>${x.name}</strong><br>Director<br>DIN: ${x.din}</td>`).join("");
    return `<table style="width:100%;"><tr>${cells}</tr></table>`;
  }

  const body = `
    ${coHeader(f)}
    <div class="doc-title" style="font-size:12pt;">EXTRACT OF RESOLUTION PASSED IN THE BOARD MEETING OF BOARD OF DIRECTOR OF ${(f.companyName || "[COMPANY NAME]").toUpperCase()} HELD ON ${ordinalDate(f.meetingDate)} AT ${fmtTime(f.meetingTime)} AT THE REGISTERED OFFICE OF THE COMPANY AT ${(f.regAddress || "[ADDRESS]").toUpperCase()}</div>
    <p style="font-weight:bold;text-decoration:underline;margin:18px 0 10px;">APPOINTMENT OF ${ndNamesTitle} AS ${desg.toUpperCase()} OF THE COMPANY</p>
    <div class="res-box">
      ${resolutionClauses}
      <p style="margin:12px 0;">"<strong>RESOLVED FURTHER THAT</strong>, ${filingClause}"</p>
    </div>
    <div class="sign-block" style="margin-top:40px;">
      <p>Certified to Be True<br>For and on behalf of the Board of Directors</p>
      <p>Place: - ${f.venue || (f.regAddress ? f.regAddress.split(",")[0] : "_______________")}</p>
      ${dirsSignTable(presentDirs)}
      <br><p>Date: - ${fmtDate(f.meetingDate)}</p>
    </div>`;
  return wrap(body, "Board Resolution — Director Appointment");
}

/* ── 3. EGM Notice + Explanatory Statement ────────────────────── */
function genGMNotice(f: F, nds: NewDirectorEntry[]): string {
  const { noticeDate } = calcDates(f.meetingDate, true);

  const agendaItems = nds.map((nd, i) => {
    const label = nds.length > 1 ? ` ${i + 1}` : "";
    return `<li>APPOINTMENT OF <strong>${(nd.name || `DIRECTOR ${i+1}`).toUpperCase()}</strong>${nd.din ? ` HAVING DIN ${nd.din}` : ""} AS DIRECTOR OF THE COMPANY</li>`;
  }).join("");

  const resolutionClauses = nds.map((nd, i) => {
    const label = nds.length > 1 ? ` ${i + 1}` : "";
    const eff = fmtDate(nd.effectiveDate || f.meetingDate);
    const addr = [nd.address, nd.city, nd.state, nd.pincode].filter(Boolean).join(", ");
    return `
      <p style="font-weight:bold;text-decoration:underline;margin:18px 0 8px;">APPOINTMENT OF ${(nd.name || `[DIRECTOR${label}]`).toUpperCase()} AS DIRECTOR OF THE COMPANY</p>
      <p>To consider and if thought fit, to pass, with or without modification the following resolution as <strong>Ordinary Resolution</strong>:</p>
      <div class="res-box">
        <p>"<strong>RESOLVED THAT</strong> pursuant to the provisions of Section 152 read with Rule 8, 9, and 14 of Companies (Appointment and Qualification of Directors) Rules, 2014 and other applicable provisions of the Companies Act, 2013 read with rules made thereunder (including any statutory modifications or re-enactment thereof for the time being in force) and provisions of the Articles of Associations of the Company and subject to the approval of the shareholders of the Company in the Extraordinary General Meeting, <strong>${nd.name || "___________"}</strong>${nd.din ? ` having DIN <strong>${nd.din}</strong>` : ""} be and hereby are appointed as the Director of the Company with effect from <strong>${eff}</strong>.</p>
        <p><strong>RESOLVED FURTHER THAT</strong>, any of the director of the company be and is hereby authorized to file Form DIR-12 with the Registrar of Companies, to do all such acts /deeds/things as may deem fit to give effect to this resolution."</p>
      </div>
    `;
  }).join("");

  const explItems = nds.map((nd, i) => {
    const label = nds.length > 1 ? `Item No. ${i + 1}: ` : "";
    const addr = [nd.address, nd.city, nd.state, nd.pincode].filter(Boolean).join(", ");
    const eff = fmtDate(nd.effectiveDate || f.meetingDate);
    return `
      <p><strong>${label}APPOINTMENT OF ${(nd.name || `[DIRECTOR ${i+1}]`).toUpperCase()} AS DIRECTOR OF THE COMPANY</strong></p>
      <p>Pursuant to the provisions of Section 152 read with Rule 8, 9, and 14 of Companies (Appointment and Qualification of Directors) Rules, 2014 and other applicable provisions of the Companies Act, 2013 read with rules made thereunder (including any statutory modifications or re-enactment thereof for the time being in force) and provisions of the Articles of Associations of the Company and subject to the approval of the shareholders of the Company in the Extraordinary General Meeting, <strong>${nd.name || "___________"}</strong>${nd.din ? ` having DIN <strong>${nd.din}</strong>` : ""}${addr ? `, residing at ${addr}` : ""}, be and hereby are appointed as the Director of the Company with effect from <strong>${eff}</strong>.</p>
      ${nd.dob || nd.occupation ? `<p><strong>Brief profile:</strong>${nd.dob ? ` Date of Birth: ${fmtDate(nd.dob)}.` : ""}${nd.occupation ? ` Occupation: ${nd.occupation}.` : ""}</p>` : ""}
      <p>None of the Directors and Key Managerial Personnel of the Company and their relatives is concerned or interested, financially or otherwise, in the resolution, except for <strong>${nd.name || "the proposed director"}</strong>.</p>
      ${i < nds.length - 1 ? "<hr style=\"margin:20px 0;\">" : ""}
    `;
  }).join("");

  // Proxy Form (MGT-11)
  const proxyForm = `
    <div class="page-break">
      <div class="doc-title">Form No. MGT-11</div>
      <p style="text-align:center;font-weight:bold;">PROXY FORM</p>
      <p style="text-align:center;font-size:10pt;">[Pursuant to Section 105(6) of the Companies Act, 2013 and Rule 19(3) of the Companies (Management and Administration) Rules, 2014]</p>
      <p style="text-align:center;font-size:10pt;">Extraordinary General Meeting &ndash; ${fmtDate(f.meetingDate)}</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #555;margin:14px 0;">
        <tr><td style="padding:8px;border:1px solid #555;width:180px;font-weight:bold;">Name of the member(s):</td><td style="padding:8px;border:1px solid #555;">&nbsp;</td></tr>
        <tr><td style="padding:8px;border:1px solid #555;font-weight:bold;">Registered address:</td><td style="padding:8px;border:1px solid #555;">&nbsp;</td></tr>
        <tr><td style="padding:8px;border:1px solid #555;font-weight:bold;">Email:</td><td style="padding:8px;border:1px solid #555;">&nbsp;</td></tr>
        <tr><td style="padding:8px;border:1px solid #555;font-weight:bold;">Folio No. / Client ID:</td><td style="padding:8px;border:1px solid #555;">&nbsp;</td></tr>
      </table>
      <p>I / We, being the member(s) of ………………………………………………. shares of the above named company, hereby appoint:</p>
      <p><strong>Name:</strong> ………………………………………………&emsp;<strong>Email:</strong> ………………………………………<br>
      <strong>Address:</strong> ………………………………………………………………………………………………<br>
      <strong>Signature:</strong> ………………………………………… or failing him/her</p>
      <p><strong>Name:</strong> ………………………………………………&emsp;<strong>Email:</strong> ………………………………………<br>
      <strong>Address:</strong> ………………………………………………………………………………………………<br>
      <strong>Signature:</strong> …………………………………………</p>
      <p>as my / our proxy to attend and vote (on a poll) for me / us and on my / our behalf at the Extraordinary General Meeting of the Company, to be held on <strong>${fmtDate(f.meetingDate)}</strong>, at <strong>${fmtTime(f.meetingTime)}</strong> at ${f.venue || "[Venue]"} and at any adjournment thereof in respect of such resolutions as indicated below:</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #555;margin:14px 0;font-size:10.5pt;">
        <tr style="background:#f0f0f0;"><th style="border:1px solid #555;padding:7px;text-align:center;width:8%;">Res. No.</th><th style="border:1px solid #555;padding:7px;text-align:left;">Resolution</th><th style="border:1px solid #555;padding:7px;text-align:center;width:18%;">Type</th><th style="border:1px solid #555;padding:7px;text-align:center;width:8%;">For</th><th style="border:1px solid #555;padding:7px;text-align:center;width:8%;">Against</th></tr>
        ${nds.map((nd, i) => `<tr><td style="border:1px solid #555;padding:7px;text-align:center;">${i+1}</td><td style="border:1px solid #555;padding:7px;">Appointment of ${nd.name || `[Director ${i+1}]`}${nd.din ? ` (DIN: ${nd.din})` : ""} as Director</td><td style="border:1px solid #555;padding:7px;text-align:center;">Ordinary</td><td style="border:1px solid #555;padding:7px;">&nbsp;</td><td style="border:1px solid #555;padding:7px;">&nbsp;</td></tr>`).join("")}
      </table>
      <p>Signed this …………………………… day of ……………………… 2025-26.</p>
      <table style="width:100%;"><tr>
        <td style="width:50%;text-align:center;">
          <div style="border:1px dashed #999;padding:20px 10px;margin:0 10px;font-size:10pt;">Affix Revenue Stamp of ₹ 1</div>
        </td>
        <td style="width:50%;text-align:center;"></td>
      </tr><tr>
        <td style="text-align:center;font-size:10pt;padding-top:8px;">……………………………………<br>Signature of the member(s)</td>
        <td style="text-align:center;font-size:10pt;padding-top:8px;">……………………………………<br>Signature of the proxy holder(s)</td>
      </tr></table>
      <p style="font-size:9pt;margin-top:16px;"><strong>Notes:</strong> (1) This form of proxy, in order to be effective, should be duly stamped, completed, signed and deposited at the registered office of the Company, not less than 48 hours before the meeting. (2) A Proxy need not be a member of the company.</p>
    </div>`;

  // Attendance Slip
  const attendanceSlip = `
    <div class="page-break">
      <p style="text-align:center;border:1px dashed #999;padding:5px;font-size:9pt;">PLEASE CUT HERE AND BRING THE BELOW ATTENDANCE SLIP TO THE MEETING HALL</p>
      <p style="font-weight:bold;text-align:center;font-size:13pt;margin-bottom:4px;">ATTENDANCE SLIP</p>
      <p style="text-align:center;font-size:10pt;margin-bottom:16px;">Extraordinary General Meeting &ndash; ${fmtDate(f.meetingDate)} at ${fmtTime(f.meetingTime)}</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #555;margin:14px 0;">
        <tr><td style="padding:8px;border:1px solid #555;width:200px;font-weight:bold;">Registered Folio No. / Client ID:</td><td style="padding:8px;border:1px solid #555;">&nbsp;</td></tr>
        <tr><td style="padding:8px;border:1px solid #555;font-weight:bold;">DP ID No.:</td><td style="padding:8px;border:1px solid #555;">&nbsp;</td></tr>
        <tr><td style="padding:8px;border:1px solid #555;font-weight:bold;">Number of Shares Held:</td><td style="padding:8px;border:1px solid #555;">&nbsp;</td></tr>
      </table>
      <p>I certify that I am a member / proxy for the member of the Company.</p>
      <p>I / We hereby record my / our presence at the Extraordinary General Meeting of the Company on <strong>${fmtDate(f.meetingDate)}</strong> at <strong>${fmtTime(f.meetingTime)}</strong> at ${f.venue || "[Venue]"}.</p>
      <br><br>
      <table style="width:100%;"><tr>
        <td style="width:55%;">……………………………………………<br><em>Name of the member / proxy (in BLOCK letters)</em></td>
        <td style="text-align:right;">……………………………………………<br><em>Signature of the member / proxy</em></td>
      </tr></table>
      <p style="font-size:9pt;margin-top:12px;"><strong>Note:</strong> Please fill up this attendance slip and hand it over at the entrance of the meeting hall. Members are requested to bring their copies of the Notice to the EGM.</p>
    </div>`;

  const body = `
    <div style="text-align:center;font-weight:bold;font-size:14pt;margin-bottom:4px;">NOTICE OF EGM WITH EXPLANATORY STATEMENT</div>
    <div style="text-align:center;font-size:11pt;margin-bottom:18px;">(Section 101 &amp; 102 of Companies Act, 2013)</div>
    ${coHeader(f)}
    <p style="font-weight:bold;font-size:13pt;margin:18px 0 8px;">NOTICE</p>
    <p>Notice is hereby given that an Extra-Ordinary General Meeting (EGM) of the Members of <strong>${f.companyName || "[Company Name]"}</strong> will be held on <strong>${fmtDay(f.meetingDate)}, ${ordinalDate(f.meetingDate)}</strong> at <strong>${fmtTime(f.meetingTime)}</strong> at ${f.venue || "[Venue]"}, to transact the following business:</p>
    <p style="font-weight:bold;text-decoration:underline;margin-top:18px;">SPECIAL BUSINESS</p>
    <p style="font-weight:bold;">RESOLUTION:</p>
    <ol>${agendaItems}</ol>
    ${resolutionClauses}
    <div class="sign-block" style="margin-top:30px;">
      <p>For <strong>${f.companyName || "[Company Name]"}</strong></p>
      ${signBlock(f.chairmanName, f.chairmanDin, noticeDate)}
    </div>
    <br>
    <p>Date: ${fmtDate(noticeDate)}<br>Place: ${f.venue || f.regAddress || "_______________"}</p>
    <p style="font-weight:bold;margin-top:18px;">NOTES:</p>
    <ol style="font-size:10.5pt;">
      <li>Explanatory statement pursuant to Section 102 of the Companies Act, 2013 is annexed hereto as Annexure I.</li>
      <li>A member entitled to attend and vote at the meeting and is entitled to appoint a proxy, to attend and vote on poll instead of himself and proxy need not be a member of the Company. Proxy form, in order to be effective must be received by the company not less than 48 hours before the meeting.</li>
      <li>All documents and papers as referred to in this notice and as required by the Companies Act, 2013 shall be available for inspection between 11.00 a.m. to 1.00 p.m. on all working days at the Registered Office of the Company and shall also be so available during the meeting.</li>
      <li>Members are requested: (a) To bring their copies of Notice and Attendance Slip at the time of the Meeting. (b) To quote their Folio No. in all correspondence. (c) To notify the change in the address, if any. (d) Members desiring any information/clarification are requested to write to the Company in advance at least seven (7) days before the meeting.</li>
    </ol>
    <div class="sign-block" style="margin-top:20px;">
      <p>For <strong>${f.companyName || "[Company Name]"}</strong></p>
      ${signBlock(f.chairmanName, f.chairmanDin, noticeDate)}
    </div>
    <p>Date: ${fmtDate(noticeDate)}<br>Place: ${f.venue || f.regAddress || "_______________"}</p>
    <div class="page-break">
      <p style="font-weight:bold;text-align:center;">ANNEXURE I:</p>
      <div class="doc-title">EXPLANATORY STATEMENT</div>
      <p style="text-align:center;font-size:10.5pt;">ANNEXED TO THE NOTICE OF THE GENERAL MEETING OF THE COMPANY</p>
      ${explItems}
    </div>
    ${proxyForm}
    ${attendanceSlip}`;
  return wrap(body, "EGM Notice — Director Appointment");
}

/* ── 4. GM Resolution (EGM CTC Format) ───────────────────────── */
function genGMResolution(f: F, nds: NewDirectorEntry[]): string {
  const presentDirs = f.directors.filter(d => d.isPresent);

  const ndNamesTitle = nds.map(nd => (nd.name || "___________").toUpperCase()).join(" AND ");

  const resolutionClauses = nds.map((nd, i) => {
    const label = nds.length > 1 ? ` ${i + 1}` : "";
    const eff = fmtDate(nd.effectiveDate || f.meetingDate);
    return `
      ${nds.length > 1 ? `<p style="font-weight:bold;text-decoration:underline;margin-top:18px;">APPOINTMENT OF ${(nd.name || `[DIRECTOR ${i+1}]`).toUpperCase()} AS DIRECTOR:</p>` : ""}
      <p style="margin:12px 0;">"<strong>RESOLVED THAT</strong> pursuant to the provisions of Section 152 read with Rule 8, 9, and 14 of Companies (Appointment and Qualification of Directors) Rules, 2014 and other applicable provisions of the Companies Act, 2013 read with rules made thereunder (including any statutory modifications or re-enactment thereof for the time being in force) and provisions of the Articles of Associations of the Company, <strong>${nd.name || "___________"}</strong>${nd.din ? ` having DIN <strong>${nd.din}</strong>` : ""} be and hereby are appointed as the Director of the Company with effect from <strong>${eff}</strong>.</p>
      <p style="margin:12px 0;"><strong>RESOLVED FURTHER THAT</strong>, any of the director of the company be and is hereby authorized to file Form DIR-12 with the Registrar of Companies, to do all such acts /deeds/things as may deem fit to give effect to this resolution."</p>
    `;
  }).join("");

  function dirsSignTable(dirs: ExistingDirector[]): string {
    const d = dirs.slice(0, 2);
    if (!d.length) return `<table style="width:100%;"><tr><td><br><br>____________________________<br><strong>[Director]</strong><br>Director</td></tr></table>`;
    const cells = d.map(x => `<td style="width:50%;vertical-align:top;padding-right:12px;"><br><strong>${x.name}</strong><br>Director<br>DIN: ${x.din}</td>`).join("");
    return `<table style="width:100%;"><tr>${cells}</tr></table>`;
  }

  // Member Attendance Register (appended at end)
  const attendanceRegister = `
    <div class="page-break">
      <div class="doc-title">MEMBER ATTENDANCE REGISTER</div>
      <p style="text-align:center;font-size:10.5pt;">(Extra-Ordinary General Meeting)</p>
      <p><strong>Date of Meeting:</strong> ${fmtDate(f.meetingDate)}&emsp;<strong>Time:</strong> ${fmtTime(f.meetingTime)}&emsp;<strong>Venue:</strong> ${f.venue || "_______________"}</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #555;margin:14px 0;font-size:10.5pt;">
        <tr style="background:#f0f0f0;">
          <th style="border:1px solid #555;padding:7px;text-align:center;width:8%;">Sl. No.</th>
          <th style="border:1px solid #555;padding:7px;text-align:left;">Name of Member</th>
          <th style="border:1px solid #555;padding:7px;text-align:left;width:18%;">Folio No. / DP ID</th>
          <th style="border:1px solid #555;padding:7px;text-align:center;width:15%;">No. of Shares Held</th>
          <th style="border:1px solid #555;padding:7px;text-align:center;width:18%;">Signature of Member</th>
          <th style="border:1px solid #555;padding:7px;text-align:center;width:12%;">Time of Entry</th>
        </tr>
        ${presentDirs.map((d, i) => `<tr><td style="border:1px solid #555;padding:8px;text-align:center;">${i+1}.</td><td style="border:1px solid #555;padding:8px;">${d.name}</td><td style="border:1px solid #555;padding:8px;">&nbsp;</td><td style="border:1px solid #555;padding:8px;">&nbsp;</td><td style="border:1px solid #555;padding:8px;">&nbsp;</td><td style="border:1px solid #555;padding:8px;">&nbsp;</td></tr>`).join("")}
        ${Array.from({length: Math.max(0, 4 - presentDirs.length)}).map((_, i) => `<tr><td style="border:1px solid #555;padding:8px;text-align:center;">${presentDirs.length+i+1}.</td><td style="border:1px solid #555;padding:8px;">&nbsp;</td><td style="border:1px solid #555;padding:8px;">&nbsp;</td><td style="border:1px solid #555;padding:8px;">&nbsp;</td><td style="border:1px solid #555;padding:8px;">&nbsp;</td><td style="border:1px solid #555;padding:8px;">&nbsp;</td></tr>`).join("")}
      </table>
      <p style="font-size:10.5pt;"><strong>CERTIFICATION</strong><br>I hereby certify that the above members were present at the Extra-Ordinary General Meeting of the Company held on ${fmtDate(f.meetingDate)}.</p>
      <div class="sign-block" style="margin-top:30px;">
        <p>For <strong>${f.companyName || "[Company Name]"}</strong></p>
        ${dirsSignTable(presentDirs)}
        <p>Date: ${fmtDate(f.meetingDate)}<br>Place: ${f.venue || f.regAddress || "_______________"}</p>
      </div>
    </div>`;

  const body = `
    ${coHeader(f)}
    <div class="doc-title" style="font-size:12pt;">EXTRACT OF RESOLUTION PASSED IN THE EXTRA ORDINARY GENERAL MEETING OF ${(f.companyName || "[COMPANY NAME]").toUpperCase()} HELD ON ${ordinalDate(f.meetingDate)} AT ${fmtTime(f.meetingTime)} AT THE REGISTERED OFFICE OF THE COMPANY AT ${(f.regAddress || "[ADDRESS]").toUpperCase()}</div>
    <p style="font-weight:bold;text-decoration:underline;margin:18px 0 10px;">APPOINTMENT OF ${ndNamesTitle} AS DIRECTOR OF THE COMPANY</p>
    <div class="res-box">
      ${resolutionClauses}
    </div>
    <div class="sign-block" style="margin-top:40px;">
      <p>Certified to Be True<br>For and on behalf of the Board of Directors</p>
      <p>Place: - ${f.venue || (f.regAddress ? f.regAddress.split(",")[0] : "_______________")}</p>
      ${dirsSignTable(presentDirs)}
      <br><p>Date: - ${fmtDate(f.meetingDate)}</p>
    </div>
    ${attendanceRegister}`;
  return wrap(body, "EGM Resolution — Director Appointment");
}

/* ── 5. DIR-2 ──────────────────────────────────────────────────── */
function genDIR2(f: F, nd: NewDirectorEntry): string {
  const addr = [nd.address, nd.city, nd.state, nd.pincode].filter(Boolean).join(", ");
  const signDate = nd.effectiveDate || f.meetingDate;
  function fieldRow(label: string, val: string) {
    return `<tr><td style="padding:6px 10px;border:1px solid #555;font-weight:bold;width:42%;vertical-align:top;">${label}:</td><td style="padding:6px 10px;border:1px solid #555;">${val || "&nbsp;"}</td></tr>`;
  }
  const body = `
    <div class="mf-label">Form DIR-2<br>Consent to act as a director of a company<br>[Pursuant to section 152(5) and rule 8 of Companies (Appointment and Qualification of Directors) Rules, 2014]</div>
    <p>To<br><strong>${f.companyName || "[COMPANY NAME]"}</strong><br>Address- ${f.regAddress || "[Registered Office Address]"}</p>
    <p class="subject">Subject: Consent to act as a director.</p>
    <p>I <strong>${nd.name || "___________"}</strong>, hereby give my consent to act as director of <strong>${f.companyName || "[Company Name]"}</strong>, pursuant to sub-section (5) of section 152 of the Companies Act, 2013 and certify that I am not disqualified to become a director under the Companies Act, 2013.</p>
    <table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:11pt;">
      ${fieldRow("Director Identification Number (DIN)", nd.din || "")}
      ${fieldRow("Name (in full)", nd.name || "")}
      ${fieldRow("Father's Name (in full)", nd.fatherName || "")}
      ${fieldRow("Address", addr || "")}
      ${fieldRow("E-mail id", nd.email || "")}
      ${fieldRow("Mobile no.", nd.mobile ? `+91 ${nd.mobile}` : "")}
      ${fieldRow("Income-tax PAN", nd.pan || "")}
      ${fieldRow("Occupation", nd.occupation || "")}
      ${fieldRow("Date of birth", nd.dob ? fmtDate(nd.dob) : "")}
      ${fieldRow("Nationality", nd.nationality || "INDIAN")}
    </table>
    <p style="font-size:10.5pt;">No. of companies in which I am already a Director and such companies the names of the companies in which I am a Managing Director, Chief Executive Officer, Whole time Director, Secretary, Chief Financial Officer, Manager. <strong>NIL</strong></p>
    <p style="font-size:10.5pt;">Particulars of membership No. and Certificate of practice No. if the applicant is a member of any professional Institute. &nbsp;<strong>NIL</strong></p>
    <div class="decl-box">
      <p><strong>Declaration</strong></p>
      <p>I declare that I have not been convicted of any offence in connection with the promotion, formation or management of any company or LLP and have not been found guilty of any fraud or misfeasance or of any breach of duty to any company under this Act or any previous company law in the last five years. I further declare that if appointed my total Directorship in all the companies shall not exceed the prescribed number of companies in which a person can be appointed as a Director.</p>
    </div>
    <br>
    <table style="width:100%;"><tr>
      <td style="width:50%;vertical-align:bottom;">Date: ${fmtDate(signDate)}</td>
      <td style="text-align:right;vertical-align:bottom;">____________________________</td>
    </tr><tr>
      <td style="vertical-align:top;">Place: ${f.venue || (f.regAddress ? f.regAddress.split(",")[0] : "_______________")}</td>
      <td style="text-align:right;vertical-align:top;">Designation: &nbsp;<strong>Proposed Director</strong></td>
    </tr></table>
    <p style="margin-top:20px;font-size:10.5pt;"><strong>Attachments:</strong><br>1. Proof of identity;<br>2. Proof of Residence;</p>`;
  return wrap(body, `DIR-2 — ${nd.name || "Consent"}`);
}

/* ── 6. DIR-8 ──────────────────────────────────────────────────── */
function genDIR8(f: F, nd: NewDirectorEntry): string {
  const addr = [nd.address, nd.city, nd.state, nd.pincode].filter(Boolean).join(", ");
  const body = `
    <div class="mf-label">FORM DIR-8<br>[Pursuant to Section 164(2) and Rule 14(1) of the Companies (Appointment and Qualification of Directors) Rules, 2014]</div>
    <div class="doc-title">DECLARATION BY A PERSON SEEKING APPOINTMENT AS DIRECTOR</div>
    <p>To,<br><strong>The Board of Directors,</strong><br><strong>${f.companyName || "[Company Name]"}</strong><br>${f.regAddress || "[Registered Office]"}</p>
    <p>I, <strong>${nd.name || "__________"}</strong>, son/daughter of <strong>${nd.fatherName || "__________"}</strong>, bearing DIN <strong>${nd.din || "__________"}</strong>${nd.pan ? `, PAN <strong>${nd.pan}</strong>` : ""}, residing at ${addr || "[Address]"}, do hereby declare that I am not disqualified to become a Director under Section 164 of the Companies Act, 2013. In particular, I hereby declare that:</p>
    <ol>
      <li>I have not been declared insolvent and no petition to declare me insolvent is pending before any court.</li>
      <li>I have not been convicted of any offence in connection with the promotion, formation or management of any company or LLP, and sentenced to imprisonment for six months or more.</li>
      <li>I have not been convicted of any offence involving moral turpitude and sentenced to imprisonment for not less than six months, with a period of five years not having elapsed from the date of expiry of the sentence.</li>
      <li>An order disqualifying me for appointment as a Director has not been passed by any Court or Tribunal and the same is not in force.</li>
      <li>I have not, as a Director of a company, defaulted in filing Annual Returns or financial statements for any continuous period of three financial years.</li>
      <li>I have not failed to repay deposits or pay interest thereon or to redeem any debentures or pay dividend declared, for a continuous period of one year, with a period of five years not having elapsed from the date of such failure.</li>
      <li>I have not been convicted of any offence in connection with related party transactions under Section 188 during the last five years.</li>
      <li>I am not detained under the Conservation of Foreign Exchange and Prevention of Smuggling Activities Act, 1974 for a period of two years or more, or if detained, the detention order has been revoked prior to making this declaration.</li>
    </ol>
    <p>I further undertake to immediately intimate the Company in writing about any subsequent event which may render me disqualified under Section 164 of the Companies Act, 2013.</p>
    <p>I am aware that any false statement made herein constitutes an offence punishable under Section 448 of the Companies Act, 2013.</p>
    <div class="sign-block">
      <table><tr>
        <td style="width:55%;vertical-align:bottom;"><br><br>____________________________<br><strong>${nd.name || "[Name]"}</strong><br>DIN: ${nd.din || "________"}</td>
        <td style="text-align:right;vertical-align:bottom;">Date: ${fmtDate(nd.effectiveDate || f.meetingDate)}<br>Place: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
      </tr></table>
    </div>`;
  return wrap(body, `DIR-8 — ${nd.name || "Declaration"}`);
}

/* ── 7. ROC Filing Guide ───────────────────────────────────────── */
function genROCGuide(f: F, nds: NewDirectorEntry[]): string {
  const isGM = f.ndDesignation === "director_gm";
  const { rocDeadline, mr1Deadline } = calcDates(f.meetingDate);
  const isMdWtd   = f.ndDesignation === "managing_director" || f.ndDesignation === "whole_time_director";
  const isAddit   = f.ndDesignation === "additional_director";
  const isAltern  = f.ndDesignation === "alternate_director";
  const isIndep   = f.ndDesignation === "independent_director";
  const isNominee = f.ndDesignation === "nominee_director";
  const desg = DESIGNATION_LABEL[f.ndDesignation];

  const dirList = nds.map((nd, i) =>
    `<li>${nd.name || `Director ${i+1}`} — DIN: ${nd.din || "________"} — Date: ${fmtDate(nd.effectiveDate || f.meetingDate)}</li>`
  ).join("");

  const body = `
    <div class="doc-title" style="text-decoration:none;font-size:15pt;">📋 ROC Filing Guide</div>
    <p style="text-align:center;font-size:11pt;color:#555;">${desg} Appointment — ${f.companyName || "[Company Name]"}</p>
    <br>
    <table style="width:100%;border-collapse:collapse;border:1.5px solid #999;">
      <tr style="background:#f0f0f0;"><td style="padding:10px;font-weight:bold;border:1px solid #999;font-size:13pt;" colspan="2">Form DIR-12 — Mandatory ROC Filing</td></tr>
      <tr><td style="padding:8px 10px;font-weight:bold;border:1px solid #999;width:200px;">Directors to file:</td><td style="padding:8px 10px;border:1px solid #999;"><ul style="margin:0;padding-left:18px;">${dirList}</ul></td></tr>
      <tr><td style="padding:8px 10px;font-weight:bold;border:1px solid #999;">DIR-12 Deadline:</td><td style="padding:8px 10px;border:1px solid #999;"><strong>30 days → ${fmtDate(rocDeadline)}</strong> ⚠️ Late filing incurs additional fees per Section 403</td></tr>
      ${isMdWtd ? `<tr><td style="padding:8px 10px;font-weight:bold;border:1px solid #999;color:#c00;">MR-1 Deadline:</td><td style="padding:8px 10px;border:1px solid #999;color:#c00;"><strong>60 days → ${fmtDate(mr1Deadline)}</strong> — Form MR-1 is mandatory for MD/WTD. File at MCA V3 → Company Forms → MR-1.</td></tr>` : ""}
      <tr><td style="padding:8px 10px;font-weight:bold;border:1px solid #999;">DSC Required:</td><td style="padding:8px 10px;border:1px solid #999;">DSC of any existing Director or Company Secretary</td></tr>
      <tr><td style="padding:8px 10px;font-weight:bold;border:1px solid #999;">Filing Portal:</td><td style="padding:8px 10px;border:1px solid #999;">MCA V3 — www.mca.gov.in → e-Filing → Company Forms → DIR-12</td></tr>
    </table>
    <br>
    <p><strong>Attachments required for DIR-12:</strong></p>
    <ol>
      <li>✅ <strong>${isGM ? "GM / EGM Minutes with Ordinary Resolution" : "Board Resolution (Extract of Minutes)"}</strong> — generated above</li>
      <li>✅ <strong>DIR-2</strong> — Consent from each new director (generated above)</li>
      <li>✅ <strong>DIR-8</strong> — Declaration from each new director (generated above)</li>
      ${isIndep ? `<li>⬜ <strong>Declaration of Independence</strong> (Section 149(7)) from each director</li><li>⬜ <strong>Letter of Appointment</strong> per Schedule IV (Code for Independent Directors)</li>` : ""}
      ${isNominee ? `<li>⬜ <strong>Nomination Letter</strong> from ${nds.map(nd => nd.nominatingBody || "the nominating institution").join(" / ")}</li>` : ""}
      <li>⬜ <strong>DIN Proof</strong> — DIN allotment letters for all incoming directors</li>
    </ol>
    ${isMdWtd ? `
    <p><strong>Additional attachments for Form MR-1:</strong></p>
    <ol>
      <li>✅ <strong>Board Resolution</strong> approving the appointment</li>
      <li>⬜ <strong>Service Agreement / Appointment Letter</strong> with terms and remuneration</li>
      <li>⬜ <strong>Schedule V compliance</strong> — remuneration certificate or CG approval (Form MR-2) if inadequate profits</li>
    </ol>` : ""}
    <p><strong>Step-by-Step DIR-12 Filing:</strong></p>
    <ol>
      <li>Log in to MCA V3 portal at www.mca.gov.in with Company credentials.</li>
      <li>Navigate to: <strong>e-Filing → Company Forms Submission → DIR-12</strong></li>
      <li>Enter Company CIN: <strong>${f.cin || "_______________"}</strong></li>
      <li>Add one entry per director — enter DIN, date of appointment, and designation for each.</li>
      <li>Upload all required attachments in PDF format.</li>
      <li>Affix DSC of authorised Director/CS and submit. Note the SRN for records.</li>
    </ol>
    <br>
    ${isAddit ? `<table style="width:100%;border-collapse:collapse;border:1.5px solid #e59a00;background:#fffbeb;"><tr><td style="padding:12px;"><strong>⚠️ Regularization at Next AGM Required</strong><br><br>Additional Director(s) hold office only till the next AGM. To regularize: pass an Ordinary Resolution at the next AGM under Section 152 for each director, and file fresh DIR-12 within 30 days of the AGM.</td></tr></table><br>` : ""}
    ${isAltern ? `<table style="width:100%;border-collapse:collapse;border:1.5px solid #e59a00;background:#fffbeb;"><tr><td style="padding:12px;"><strong>⚠️ Alternate Director — Key Conditions (Section 161(2))</strong><br><br><ul style="margin:8px 0;padding-left:20px;"><li>Original director must be absent from India for not less than 3 months.</li><li>Alternate Director vacates office automatically when original director returns to India.</li><li>On original director&rsquo;s return: file DIR-12 for cessation of Alternate Director within 30 days.</li></ul></td></tr></table><br>` : ""}
    ${isIndep ? `<table style="width:100%;border-collapse:collapse;border:1.5px solid #e59a00;background:#fffbeb;"><tr><td style="padding:12px;"><strong>⚠️ Independent Director — Annual Compliance</strong><br><br><ul style="margin:8px 0;padding-left:20px;"><li>Appointed as Additional Independent Director — must be regularized at next AGM for a fixed 5-year term.</li><li>Annual Declaration of Independence (Section 149(7)) — first Board meeting of every financial year.</li><li>Maximum 2 consecutive terms of 5 years each. 3-year cooling-off before re-appointment after 2 terms.</li></ul></td></tr></table><br>` : ""}
    ${isMdWtd ? `<table style="width:100%;border-collapse:collapse;border:1.5px solid #e59a00;background:#fffbeb;"><tr><td style="padding:12px;"><strong>⚠️ ${desg} — Shareholder Approval Required</strong><br><br><ul style="margin:8px 0;padding-left:20px;"><li>Board has approved — shareholders must approve at next AGM/EGM within 3 months of Board meeting date (Section 196(4)).</li><li>File Form MR-1 within 60 days of Board approval (deadline: ${fmtDate(mr1Deadline)}).</li><li>If remuneration exceeds Schedule V limits and company has inadequate profits: file Form MR-2 for Central Government approval.</li></ul></td></tr></table><br>` : ""}
    ${isGM ? `<table style="width:100%;border-collapse:collapse;border:1.5px solid #4ade80;background:#f0fdf4;"><tr><td style="padding:12px;"><strong>✅ Section 152 — Director at General Meeting</strong><br><br><ul style="margin:8px 0;padding-left:20px;"><li>Director(s) appointed by Ordinary Resolution at EGM — DIR-12 filing deadline runs from the EGM date (${fmtDate(f.meetingDate)}).</li><li>These director(s) are liable to retire by rotation unless specifically exempted.</li><li>EGM Notice must have been sent at least 21 clear days before the meeting (Section 101).</li></ul></td></tr></table><br>` : ""}
    <table style="width:100%;border-collapse:collapse;border:1.5px solid #ccc;background:#f9f9f9;">
      <tr><td style="padding:12px;"><strong>📌 Additional Compliance Checklist:</strong><br><br>
      <ul style="margin:8px 0;padding-left:20px;">
        <li>Update <strong>Register of Directors &amp; KMP (MBP-1)</strong> — Section 170.</li>
        <li>Send formal appointment letter to each new director with a copy of the Resolution.</li>
        <li>If DIN not allotted yet: apply via <strong>Form DIR-3</strong> first (allotted in 1-2 working days).</li>
        <li>For listed companies: intimate stock exchange within 24 hours via <strong>LODR Regulation 30</strong>.</li>
        <li>Update company website with new director details (if applicable).</li>
      </ul>
      </td></tr>
    </table>`;
  return wrap(body, "ROC Filing Guide — Director Appointment");
}

/* ── 8. MBP-1 Notice of Interest ─────────────────────────────── */
function genMBP1(f: F, nd: NewDirectorEntry): string {
  const addr = [nd.address, nd.city, nd.state, nd.pincode].filter(Boolean).join(", ");
  const signDate = nd.effectiveDate || f.meetingDate;
  const body = `
    <div class="mf-label">FORM MBP - 1<br>Notice of interest by director<br>[Pursuant to section 184 (1) and rule 9(1)]</div>
    <p>To<br>The Board of Directors<br><strong>${f.companyName || "[Company Name]"}</strong><br>Address: ${f.regAddress || "[Registered Office]"}</p>
    <p>Dear Sir(s),</p>
    <p>I, <strong>${nd.name || "__________"}</strong> son of <strong>${nd.fatherName || "__________"}</strong>${addr ? ` resident of ${addr}` : ""} being a director in the company hereby give notice of my interest or concern in the following company or companies, bodies corporate, firms or other association of individuals:-</p>
    <table style="width:100%;border-collapse:collapse;border:1px solid #555;margin:16px 0;font-size:10.5pt;">
      <tr style="background:#f0f0f0;">
        <th style="border:1px solid #555;padding:7px 8px;text-align:center;width:6%;">Sr. No.</th>
        <th style="border:1px solid #555;padding:7px 8px;text-align:left;">Names of the Companies / bodies corporate / firms / association of individuals</th>
        <th style="border:1px solid #555;padding:7px 8px;text-align:left;width:22%;">Nature of interest or concern / Change in interest or concern</th>
        <th style="border:1px solid #555;padding:7px 8px;text-align:center;width:15%;">Shareholding</th>
        <th style="border:1px solid #555;padding:7px 8px;text-align:center;width:18%;">Date on which interest or concern arose / changed</th>
      </tr>
      ${[1,2,3,4,5].map(i => `<tr>
        <td style="border:1px solid #555;padding:10px 8px;text-align:center;">${i}.</td>
        <td style="border:1px solid #555;padding:10px 8px;">&nbsp;</td>
        <td style="border:1px solid #555;padding:10px 8px;">&nbsp;</td>
        <td style="border:1px solid #555;padding:10px 8px;">&nbsp;</td>
        <td style="border:1px solid #555;padding:10px 8px;">&nbsp;</td>
      </tr>`).join("")}
    </table>
    <br>
    <table style="width:100%;"><tr>
      <td style="vertical-align:bottom;">Place: ${f.venue || (f.regAddress ? f.regAddress.split(",")[0] : "_______________")}&emsp;<br>Date: ${fmtDate(signDate)}</td>
      <td style="text-align:right;vertical-align:bottom;">Signature:<br>____________________________<br><strong>${nd.name || "[Name]"}</strong><br>DIN: ${nd.din || "________"}</td>
    </tr></table>`;
  return wrap(body, `MBP-1 — ${nd.name || "Notice of Interest"}`);
}

/* ═══════════════════════════════════════════════════════════════════
   UI COMPONENTS
═══════════════════════════════════════════════════════════════════ */
function SHead({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-black flex items-center justify-center flex-shrink-0 mt-0.5">{n}</div>
      <div><h2 className="text-lg font-extrabold text-slate-900">{title}</h2><p className="text-xs text-slate-500 mt-0.5">{sub}</p></div>
    </div>
  );
}

function Field({ label, req, children, hint }: { label: string; req?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-slate-700">{label}{req && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-white";
const SELECT = "w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

function NavButtons({ step, setStep, maxStep, canProceed, onGenerate }: {
  step: number; setStep: (s: number) => void; maxStep: number; canProceed: boolean; onGenerate?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-100">
      {step > 1
        ? <button onClick={() => setStep(step - 1)} className="px-5 py-2.5 rounded-xl text-sm font-bold border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">← Back</button>
        : <div />}
      {step < maxStep
        ? <button onClick={() => canProceed && setStep(step + 1)} className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all ${canProceed ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-300 cursor-not-allowed"}`}>Continue →</button>
        : <button onClick={onGenerate} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all">✅ Generate Package</button>}
    </div>
  );
}

function NewDirectorForm({ nd, designation, onChange }: {
  nd: NewDirectorEntry;
  designation: DesignationType;
  onChange: (key: keyof NewDirectorEntry, val: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Full Name" req><input value={nd.name} onChange={e => onChange("name", e.target.value)} className={INPUT} placeholder="As per PAN / DIN records" /></Field>
      <Field label="Father's / Husband's Name" req hint="Required for DIR-2 and DIR-8"><input value={nd.fatherName} onChange={e => onChange("fatherName", e.target.value)} className={INPUT} placeholder="Father's or Husband's full name" /></Field>
      <Field label="DIN" req hint="8-digit Director Identification Number"><input value={nd.din} onChange={e => onChange("din", e.target.value)} className={INPUT} placeholder="e.g. 01234567" maxLength={8} /></Field>
      <Field label="Date of Birth"><input type="date" value={nd.dob} onChange={e => onChange("dob", e.target.value)} className={INPUT} /></Field>
      <Field label="PAN"><input value={nd.pan} onChange={e => onChange("pan", e.target.value)} className={INPUT} placeholder="e.g. ABCDE1234F" maxLength={10} /></Field>
      <Field label="Nationality"><input value={nd.nationality} onChange={e => onChange("nationality", e.target.value)} className={INPUT} /></Field>
      <Field label="Occupation"><input value={nd.occupation} onChange={e => onChange("occupation", e.target.value)} className={INPUT} placeholder="e.g. Business, Professional" /></Field>
      <Field label="Effective Date of Appointment" hint="Usually the meeting date"><input type="date" value={nd.effectiveDate} onChange={e => onChange("effectiveDate", e.target.value)} className={INPUT} /></Field>
      <Field label="Mobile"><input value={nd.mobile} onChange={e => onChange("mobile", e.target.value)} className={INPUT} placeholder="10-digit mobile" /></Field>
      <Field label="Email"><input value={nd.email} onChange={e => onChange("email", e.target.value)} className={INPUT} /></Field>

      {designation === "alternate_director" && (<>
        <Field label="Original Director's Name" req hint="Director in whose place the alternate is being appointed">
          <input value={nd.originalDirector} onChange={e => onChange("originalDirector", e.target.value)} className={INPUT} placeholder="Name of director who will be absent" />
        </Field>
        <Field label="Original Director's DIN" hint="DIN of the director being substituted">
          <input value={nd.originalDin} onChange={e => onChange("originalDin", e.target.value)} className={INPUT} placeholder="8-digit DIN" maxLength={8} />
        </Field>
      </>)}

      {designation === "nominee_director" && (
        <Field label="Nominating Institution / Body" req hint="Name of bank, financial institution, or body nominating this director">
          <input value={nd.nominatingBody} onChange={e => onChange("nominatingBody", e.target.value)} className={INPUT} placeholder="e.g. State Bank of India, XYZ Capital Partners" />
        </Field>
      )}

      {(designation === "managing_director" || designation === "whole_time_director") && (
        <Field label="Term of Appointment (years)" req hint="Max 5 years; reappointment allowed before expiry">
          <select value={nd.termYears} onChange={e => onChange("termYears", e.target.value)} className={SELECT}>
            <option value="1">1 Year</option>
            <option value="2">2 Years</option>
            <option value="3">3 Years</option>
            <option value="4">4 Years</option>
            <option value="5">5 Years (Maximum)</option>
          </select>
        </Field>
      )}

      <div className="col-span-2 rounded-xl bg-slate-50 border border-slate-200 p-4">
        <p className="text-xs font-bold text-slate-600 mb-3">Residential Address (for DIR-2 & DIR-8)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="House / Flat / Street"><input value={nd.address} onChange={e => onChange("address", e.target.value)} className={INPUT} placeholder="House no., street, locality" /></Field>
          <Field label="City"><input value={nd.city} onChange={e => onChange("city", e.target.value)} className={INPUT} /></Field>
          <Field label="State"><input value={nd.state} onChange={e => onChange("state", e.target.value)} className={INPUT} /></Field>
          <Field label="PIN Code"><input value={nd.pincode} onChange={e => onChange("pincode", e.target.value)} className={INPUT} maxLength={6} /></Field>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════ */
export default function DirectorAppointmentPage() {
  const { data: session } = useSession();
  const [f, setF] = useState<F>({ ...DEFAULT, newDirectors: [makeNd()] });
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(1);
  const [activeNdTab, setActiveNdTab] = useState(0);
  const [activeDocKey, setActiveDocKey] = useState("notice");
  const [companySearchVal, setCompanySearchVal] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [chairDropdown, setChairDropdown] = useState(false);
  const chairInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { const s = localStorage.getItem(DRAFT_KEY); if (s) setF(JSON.parse(s) as F); } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(f)); } catch {}
  }, [f, hydrated]);

  // Auto-fill effectiveDate for directors that don't have one
  useEffect(() => {
    if (!f.meetingDate) return;
    setF(p => ({
      ...p,
      newDirectors: p.newDirectors.map(nd => nd.effectiveDate ? nd : { ...nd, effectiveDate: p.meetingDate }),
    }));
  }, [f.meetingDate]);

  // Auto-fill venue from registered office when venue is empty
  useEffect(() => {
    if (f.regAddress && !f.venue) {
      setF(p => ({ ...p, venue: p.regAddress }));
    }
  }, [f.regAddress]);

  function up<K extends keyof F>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setF(p => ({ ...p, [key]: e.target.value }));
  }

  function setDirectorCount(count: number) {
    setF(p => {
      const current = p.newDirectors;
      const target = Array.from({ length: count }, (_, i) => current[i] || makeNd());
      return { ...p, directorCount: count, newDirectors: target };
    });
    if (activeNdTab >= count) setActiveNdTab(0);
  }

  function updateNd(idx: number, key: keyof NewDirectorEntry, val: string) {
    setF(p => {
      const updated = [...p.newDirectors];
      if (updated[idx]) updated[idx] = { ...updated[idx], [key]: val };
      return { ...p, newDirectors: updated };
    });
  }

  function fillCompany(c: CompanyData) {
    setF(p => ({
      ...p,
      companyName: c.companyName || p.companyName,
      cin: c.cin || p.cin,
      regAddress: c.regAddress || p.regAddress,
      entityType: c.entityType || p.entityType,
      directors: c.directors?.map((d, i) => ({
        id: `dir-${i}`, name: d.name || "", din: d.din || "",
        designation: d.designation || "Director", isPresent: true,
      })) || p.directors,
    }));
    setCompanySearchVal(c.companyName || "");
  }

  function addExistingDir() {
    setF(p => ({ ...p, directors: [...p.directors, { id: `dir-${Date.now()}`, name: "", din: "", designation: "Director", isPresent: true }] }));
  }
  function removeExistingDir(id: string) {
    setF(p => ({ ...p, directors: p.directors.filter(d => d.id !== id) }));
  }
  function updateExistingDir(id: string, field: keyof ExistingDirector, val: string | boolean) {
    setF(p => ({ ...p, directors: p.directors.map(d => d.id === id ? { ...d, [field]: val } : d) }));
  }

  function openPrint(html: string) {
    const h = session ? html : injectPreviewWatermark(html);
    const url = URL.createObjectURL(new Blob([h], { type: "text/html;charset=utf-8" }));
    const w = window.open(url, "_blank");
    if (!w) { alert("Pop-up blocked! Please allow pop-ups."); URL.revokeObjectURL(url); return; }
    if (session) { w.addEventListener("load", () => { w.focus(); w.print(); }); }
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
  }

  async function downloadDocPDF(html: string, docType: string, docTitle: string, key: string) {
    setBusyKey(key + "_pdf");
    try {
      const safeName = f.companyName.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
      const filename = `${key}_${safeName}`;
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, filename, docType, companyName: f.companyName, docTitle, dirs: [] }),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${filename}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { alert("Failed to download PDF. Please use the Print option instead."); }
    finally { setBusyKey(null); }
  }

  async function downloadDocWord(html: string, docTitle: string, key: string) {
    setBusyKey(key + "_word");
    try {
      const safeName = f.companyName.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
      const filename = `${key}_${safeName}`;
      const res = await fetch("/api/share-transfer/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, companyName: f.companyName, docTitle, filename }),
      });
      if (!res.ok) throw new Error("DOCX generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${filename}.docx`; a.click();
      URL.revokeObjectURL(url);
    } catch { alert("Failed to generate Word file. Please use the Print option instead."); }
    finally { setBusyKey(null); }
  }

  const isGM = f.ndDesignation === "director_gm";
  const isMdWtd = f.ndDesignation === "managing_director" || f.ndDesignation === "whole_time_director";
  const activeNds = useMemo(() => f.newDirectors.slice(0, f.directorCount), [f.newDirectors, f.directorCount]);
  const dates = useMemo(() => calcDates(f.meetingDate, isGM), [f.meetingDate, isGM]);

  const docs = useMemo(() => {
    const nds = f.newDirectors.slice(0, f.directorCount);
    const gm = f.ndDesignation === "director_gm";
    return [
      gm
        ? { key: "gm_notice",     label: "EGM Notice",       emoji: "📬", gen: () => genGMNotice(f, nds) }
        : { key: "notice",        label: "Board Notice",      emoji: "📬", gen: () => genBoardNotice(f, nds) },
      gm
        ? { key: "gm_resolution", label: "EGM Resolution",   emoji: "⚖️",  gen: () => genGMResolution(f, nds) }
        : { key: "resolution",    label: "Board Resolution",  emoji: "⚖️",  gen: () => genBoardResolution(f, nds) },
      ...nds.map((nd, i) => ({
        key: `dir2_${i}`,
        label: nds.length > 1 ? `DIR-2 Dir ${i + 1}` : "DIR-2 Consent",
        emoji: "✅",
        gen: () => genDIR2(f, nd),
      })),
      ...nds.map((nd, i) => ({
        key: `dir8_${i}`,
        label: nds.length > 1 ? `DIR-8 Dir ${i + 1}` : "DIR-8 Declaration",
        emoji: "📜",
        gen: () => genDIR8(f, nd),
      })),
      ...nds.map((nd, i) => ({
        key: `mbp1_${i}`,
        label: nds.length > 1 ? `MBP-1 Dir ${i + 1}` : "MBP-1 Interest",
        emoji: "🔔",
        gen: () => genMBP1(f, nd),
      })),
      { key: "roc", label: "ROC Guide", emoji: "📋", gen: () => genROCGuide(f, nds) },
    ];
  }, [f]);

  // Keep activeDocKey valid when docs change
  useEffect(() => {
    if (!docs.find(d => d.key === activeDocKey)) setActiveDocKey(docs[0]?.key || "notice");
  }, [docs, activeDocKey]);

  const activeDoc = docs.find(d => d.key === activeDocKey) || docs[0];

  // Validation
  const canStep1 = !!f.companyName;
  const canStep2 = true; // designation always has a default
  const chairSuggs = f.directors.filter(d => d.name && (!f.chairmanName || d.name.toLowerCase().includes(f.chairmanName.toLowerCase())));
  const chairDinError = f.chairmanDin.length > 0 && f.chairmanDin.length !== 8;
  const canStep3 = !!f.meetingDate && !!f.meetingSerial && !!f.chairmanName && !chairDinError;
  const canStep4 = f.directors.filter(d => d.isPresent).length >= (f.entityType === "opc" ? 1 : 2);
  const canStep5 = activeNds.length > 0 && activeNds.every(nd => !!nd.name && !!nd.din && !!nd.fatherName);
  const canProceed = [true, canStep1, canStep2, canStep3, canStep4, canStep5][step] ?? false;

  const STEPS = ["Company", "Appointment", "Meeting & Dates", "Attendance", "Director Details", "Documents"];
  const MAX_STEP = 6;

  /* ── Step 1: Company ── */
  const s1 = (
    <div className="space-y-5">
      <SHead n={1} title="Company Details" sub="Auto-fill from MCA Excel or search by company name / CIN" />
      <CompanyExcelUpload onFill={fillCompany} />
      <div className="relative flex items-center gap-3 text-xs text-slate-400">
        <div className="flex-1 h-px bg-slate-200" /><span>or search your saved companies</span><div className="flex-1 h-px bg-slate-200" />
      </div>
      <CompanySearch value={companySearchVal} onChange={setCompanySearchVal} onSelect={fillCompany} className={INPUT} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
        <Field label="Company Name" req><input value={f.companyName} onChange={up("companyName")} className={INPUT} placeholder="e.g. ABC Enterprises Private Limited" /></Field>
        <Field label="CIN"><input value={f.cin} onChange={up("cin")} className={INPUT} placeholder="e.g. U74999MH2020PTC123456" /></Field>
        <Field label="Entity Type">
          <select value={f.entityType} onChange={up("entityType")} className={SELECT}>
            <option value="pvt_ltd">Private Limited Company</option>
            <option value="public_ltd">Public Limited Company</option>
            <option value="opc">One Person Company (OPC)</option>
            <option value="section8">Section 8 Company</option>
            <option value="nidhi">Nidhi Company</option>
          </select>
        </Field>
        <div />
        <Field label="Registered Office Address" req>
          <textarea value={f.regAddress} onChange={up("regAddress")} className={INPUT} rows={2} placeholder="Full registered office address" />
        </Field>
      </div>
      <NavButtons step={step} setStep={setStep} maxStep={MAX_STEP} canProceed={canStep1} />
    </div>
  );

  /* ── Step 2: Appointment Setup ── */
  const s2 = (
    <div className="space-y-5">
      <SHead n={2} title="Appointment Setup" sub="Select the type of appointment and how many directors to appoint in this meeting" />

      <Field label="Type of Appointment" req hint="Select the designation — this determines which documents are generated and the notice period required">
        <select value={f.ndDesignation} onChange={up("ndDesignation")} className={SELECT}>
          <optgroup label="— Board Appointed —">
            <option value="additional_director">Additional Director — Section 161(1)</option>
            <option value="alternate_director">Alternate Director — Section 161(2)</option>
            <option value="nominee_director">Nominee Director — Section 161(3)</option>
            <option value="managing_director">Managing Director — Section 196 + Schedule V</option>
            <option value="whole_time_director">Whole-time Director — Section 196 + Schedule V</option>
            <option value="independent_director">Independent Director — Section 149(4) &amp; (6) + Schedule IV</option>
          </optgroup>
          <optgroup label="— General Meeting Appointed —">
            <option value="director_gm">Director (at General Meeting) — Section 152</option>
          </optgroup>
        </select>
      </Field>

      {/* GM banner */}
      {isGM && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-sm text-amber-800">
          <strong>📋 General Meeting Appointment (Section 152):</strong> This director is appointed by members at an EGM/AGM by Ordinary Resolution — not at a Board meeting. The tool will generate:
          <ul className="mt-2 ml-4 list-disc space-y-1 text-xs">
            <li><strong>EGM Notice</strong> (21-day notice per Section 101) with Explanatory Statement (Section 102)</li>
            <li><strong>EGM Minutes</strong> with Ordinary Resolution (Section 152)</li>
            <li>DIR-2 Consent and DIR-8 Declaration for each director</li>
            <li>ROC Filing Guide (DIR-12 within 30 days of EGM)</li>
          </ul>
        </div>
      )}

      {/* Board notice info */}
      {!isGM && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <strong>📋 Board Meeting Appointment ({SECTION_REF[f.ndDesignation]}):</strong> The Board will appoint this director at a Board meeting with 7-day advance notice (SS-1). Documents generated:
          <ul className="mt-2 ml-4 list-disc space-y-1 text-xs">
            <li><strong>Board Notice</strong> (7-day notice per SS-1 &amp; Section 173)</li>
            <li><strong>Board Resolution</strong> (Extract of Minutes)</li>
            <li>DIR-2 Consent and DIR-8 Declaration for each director</li>
            <li>ROC Filing Guide (DIR-12 within 30 days)</li>
          </ul>
        </div>
      )}

      <div>
        <p className="text-xs font-bold text-slate-700 mb-3">Number of Directors to Appoint in this Meeting <span className="text-red-500">*</span></p>
        <div className="flex gap-2 flex-wrap items-end">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} type="button"
              onClick={() => setDirectorCount(n)}
              className={`py-3 px-4 rounded-xl border-2 text-center font-bold transition-all ${f.directorCount === n ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
              <div className="text-xl font-black">{n}</div>
              <div className="text-xs mt-0.5 font-medium">{n === 1 ? "Director" : "Directors"}</div>
            </button>
          ))}
          <div className="flex flex-col items-center gap-1 ml-1">
            <span className="text-xs text-slate-400 font-medium">or type</span>
            <input
              type="number" min="1" max="10"
              value={f.directorCount}
              onChange={e => { const v = Math.min(10, Math.max(1, parseInt(e.target.value) || 1)); setDirectorCount(v); }}
              className="w-16 border-2 border-slate-200 rounded-xl px-2 py-2 text-center font-black text-lg text-slate-700 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
        {f.directorCount > 1 && (
          <p className="text-xs text-slate-500 mt-2">All {f.directorCount} directors will be appointed in the same {isGM ? "General Meeting" : "Board Meeting"} — separate documents (DIR-2, DIR-8) will be generated for each.</p>
        )}
      </div>

      <NavButtons step={step} setStep={setStep} maxStep={MAX_STEP} canProceed={canStep2} />
    </div>
  );

  /* ── Step 3: Meeting & Dates ── */
  const s3 = (
    <div className="space-y-5">
      <SHead
        n={3}
        title={isGM ? "General Meeting Details & Date Planner" : "Board Meeting Details & Date Planner"}
        sub={isGM ? "Enter the EGM date — notice must be sent 21 days in advance (Section 101)" : "Enter the board meeting date — notice date and ROC deadline are calculated automatically"}
      />

      {f.meetingDate && (
        <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">📅 Auto Date Planner</p>
          <div className={`grid gap-3 ${isMdWtd ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"}`}>
            {[
              { label: isGM ? "EGM Notice (Sec. 101)" : "Board Notice (SS-1)", date: dates.noticeDate, note: isGM ? "21 clear days before EGM" : "7 days before meeting", color: "bg-white border-slate-200 text-slate-700" },
              { label: isGM ? "EGM Date" : "Board Meeting", date: f.meetingDate, note: "Director appointed on this date", color: "bg-blue-600 border-blue-600 text-white" },
              { label: "DIR-12 Deadline ⚠️", date: dates.rocDeadline, note: "30 days from appointment", color: "bg-red-50 border-red-300 text-red-700" },
              ...(isMdWtd ? [{ label: "MR-1 Deadline ⚠️", date: dates.mr1Deadline, note: "60 days — MD/WTD mandatory", color: "bg-orange-50 border-orange-300 text-orange-700" }] : []),
            ].map(item => (
              <div key={item.label} className={`rounded-xl border-2 p-3 text-center ${item.color}`}>
                <p className="text-xs font-bold mb-1 opacity-80">{item.label}</p>
                <p className="font-extrabold text-sm">{fmtDate(item.date)}</p>
                <p className="text-xs opacity-70 mt-1">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={isGM ? "EGM / General Meeting Date" : "Board Meeting Date"} req hint={isGM ? "EGM Notice will be 21 days before; DIR-12 deadline 30 days after" : "Notice will be 7 days before; DIR-12 deadline 30 days after"}>
          <input type="date" value={f.meetingDate} onChange={up("meetingDate")} className={INPUT} />
        </Field>
        <Field label="Meeting Time"><input type="time" value={f.meetingTime} onChange={up("meetingTime")} className={INPUT} /></Field>
        <Field label={isGM ? "EGM Serial / Reference No." : "Board Meeting Serial No."} req hint="e.g. 3/2025-26 for 3rd Board meeting, or EGM/2025-26 for EGM">
          <input value={f.meetingSerial} onChange={up("meetingSerial")} className={INPUT} placeholder={isGM ? "e.g. EGM/2025-26" : "e.g. 3/2025-26"} />
        </Field>
        <Field label="Venue" hint="Defaults to registered office — edit if meeting is elsewhere">
          <input value={f.venue} onChange={up("venue")} className={INPUT} placeholder="Registered office / any other venue" />
        </Field>
        <Field label="Chairman's Name" req>
          <div className="relative" ref={chairInputRef}>
            <input
              value={f.chairmanName}
              onChange={e => { setF(p => ({ ...p, chairmanName: e.target.value })); setChairDropdown(true); }}
              onFocus={() => setChairDropdown(true)}
              onBlur={() => setTimeout(() => setChairDropdown(false), 150)}
              className={INPUT}
              placeholder="Name of meeting chairman"
            />
            {chairDropdown && chairSuggs.length > 0 && (
              <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                {chairSuggs.map(d => (
                  <button key={d.id} type="button"
                    onMouseDown={() => { setF(p => ({ ...p, chairmanName: d.name, chairmanDin: d.din || p.chairmanDin })); setChairDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center justify-between border-b border-slate-100 last:border-0">
                    <span className="font-medium text-slate-800">{d.name}</span>
                    {d.din && <span className="text-xs text-slate-400 ml-2 flex-shrink-0">DIN: {d.din}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Field>
        <Field label="Chairman's DIN" hint="8-digit Director Identification Number — auto-filled if selected above">
          <>
            <input
              value={f.chairmanDin}
              onChange={up("chairmanDin")}
              className={`${INPUT} ${chairDinError ? "!border-red-400 focus:!border-red-500" : ""}`}
              placeholder="e.g. 01234567"
              maxLength={8}
            />
            {chairDinError && (
              <p className="text-xs text-red-500 mt-1">⚠ DIN must be exactly 8 digits ({f.chairmanDin.length} entered)</p>
            )}
          </>
        </Field>
      </div>
      {f.meetingDate && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-700">
          <strong>💡 Tip:</strong> If your company already has a {isGM ? "General" : "Board"} Meeting scheduled in <strong>{new Date(f.meetingDate + "T00:00:00").toLocaleString("en-IN", { month: "long", year: "numeric" })}</strong>, use that same date and add this appointment as an agenda item — one meeting instead of two.
        </div>
      )}
      <NavButtons step={step} setStep={setStep} maxStep={MAX_STEP} canProceed={canStep3} />
    </div>
  );

  /* ── Step 4: Attendance ── */
  const presentCount = f.directors.filter(d => d.isPresent).length;
  const quorumOk = presentCount >= (f.entityType === "opc" ? 1 : 2);
  const s4 = (
    <div className="space-y-5">
      <SHead
        n={4}
        title={isGM ? "Members / Directors Present" : "Directors Present at Meeting"}
        sub={isGM ? "List members/directors attending the EGM — needed for quorum confirmation and minutes" : "Mark who attended — needed for quorum and board notice addresses"}
      />
      {f.directors.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          No directors loaded. Add manually or upload MCA Excel in Step 1.
        </div>
      )}
      <div className="space-y-3">
        {f.directors.map((d, i) => (
          <div key={d.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${d.isPresent ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"}`}>
            <input type="checkbox" checked={d.isPresent} onChange={e => updateExistingDir(d.id, "isPresent", e.target.checked)}
              className="w-5 h-5 rounded accent-blue-600 cursor-pointer flex-shrink-0" />
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input value={d.name} onChange={e => updateExistingDir(d.id, "name", e.target.value)} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm" placeholder={`Director ${i + 1} Name`} />
              <input value={d.din} onChange={e => updateExistingDir(d.id, "din", e.target.value)} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm" placeholder="DIN (8 digits)" maxLength={8} />
              <input value={d.designation} onChange={e => updateExistingDir(d.id, "designation", e.target.value)} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm" placeholder="Designation" />
            </div>
            <button onClick={() => removeExistingDir(d.id)} className="text-slate-400 hover:text-red-500 text-lg flex-shrink-0">✕</button>
          </div>
        ))}
      </div>
      <button onClick={addExistingDir} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm font-bold text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
        + Add Director / Member
      </button>
      {f.directors.length > 0 && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold ${quorumOk ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {quorumOk ? "✓" : "⚠"} Quorum: {presentCount} director{presentCount !== 1 ? "s" : ""} present
          {!quorumOk && " — minimum 2 required (Pvt Ltd)"}
        </div>
      )}
      <NavButtons step={step} setStep={setStep} maxStep={MAX_STEP} canProceed={canStep4} />
    </div>
  );

  /* ── Step 5: New Director(s) ── */
  const s5 = (
    <div className="space-y-5">
      <SHead n={5} title="New Director Details" sub="Details used in DIR-2, DIR-8, and all resolution documents" />

      {f.directorCount > 1 && (
        <div className="flex gap-2 border-b border-slate-200 pb-0">
          {activeNds.map((nd, i) => (
            <button key={nd.id} onClick={() => setActiveNdTab(i)}
              className={`px-4 py-2 text-sm font-bold rounded-t-xl border-2 border-b-0 transition-all ${activeNdTab === i ? "border-blue-400 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-700"}`}>
              {nd.name ? nd.name.split(" ")[0] : `Director ${i + 1}`}
              {!nd.name && !nd.din ? " ●" : ""}
            </button>
          ))}
        </div>
      )}

      {activeNds.map((nd, i) => (
        <div key={nd.id} className={f.directorCount > 1 && activeNdTab !== i ? "hidden" : ""}>
          {f.directorCount > 1 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 mb-3">
              <p className="text-xs font-bold text-slate-600">Director {i + 1} of {f.directorCount}</p>
            </div>
          )}
          <NewDirectorForm
            nd={nd}
            designation={f.ndDesignation}
            onChange={(key, val) => updateNd(i, key, val)}
          />
        </div>
      ))}

      {f.directorCount > 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
          <strong>Tip:</strong> Fill details for all {f.directorCount} directors using the tabs above. All documents will be generated for each director.
        </div>
      )}

      <NavButtons step={step} setStep={setStep} maxStep={MAX_STEP} canProceed={canStep5} onGenerate={() => setStep(6)} />
    </div>
  );

  /* ── Step 6: Documents ── */
  const s6 = (
    <div className="space-y-5">
      <SHead n={6} title="Complete Document Package" sub="All documents ready to print. Click any document to preview, then Print." />

      <div className="flex flex-wrap gap-2">
        {docs.map(d => (
          <button key={d.key} onClick={() => setActiveDocKey(d.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-center transition-all ${activeDocKey === d.key ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
            <span className="text-base">{d.emoji}</span>
            <span className="text-xs font-bold leading-tight">{d.label}</span>
          </button>
        ))}
      </div>

      {activeDoc && (
        <div className="border-2 border-slate-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-lg">{activeDoc.emoji}</span>
              <span className="text-sm font-bold text-slate-800">{activeDoc.label}</span>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => openPrint(activeDoc.gen())} disabled={!!busyKey}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
                🖨️ Print
              </button>
              <button onClick={() => downloadDocPDF(activeDoc.gen(), "director-resolution", activeDoc.label, activeDoc.key)} disabled={!!busyKey}
                className="flex items-center gap-1 bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
                {busyKey === activeDoc.key + "_pdf" ? "⏳…" : "⬇️ PDF"}
              </button>
              <button onClick={() => downloadDocWord(activeDoc.gen(), activeDoc.label, activeDoc.key)} disabled={!!busyKey}
                className="flex items-center gap-1 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
                {busyKey === activeDoc.key + "_word" ? "⏳…" : "📝 Word"}
              </button>
            </div>
          </div>
          <div className="bg-white p-4 max-h-[500px] overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: activeDoc.gen()
              .replace(/<!DOCTYPE html>[\s\S]*?<body[^>]*>/, `<style>${DOC_CSS.replace(/\bbody\s*\{[^}]*\}/g, "")}</style>`)
              .replace(/<\/body>[\s\S]*?<\/html>/, "")
              .replace(/<div class="page">/, '<div class="page" style="font-family:\'Times New Roman\',serif;font-size:12pt;line-height:1.8;color:#000;">')
            }} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {docs.map(d => (
          <div key={d.key} className="flex gap-1">
            <button onClick={() => openPrint(d.gen())} disabled={!!busyKey}
              className="py-2 px-2.5 rounded-l-xl text-xs font-bold border-2 border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-all flex items-center gap-1 disabled:opacity-50">
              {d.emoji} Print {d.label}
            </button>
            <button onClick={() => downloadDocPDF(d.gen(), "director-resolution", d.label, d.key)} disabled={!!busyKey}
              className="py-2 px-2.5 rounded-none text-xs font-bold border-2 border-l-0 border-slate-200 text-blue-700 hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50">
              {busyKey === d.key + "_pdf" ? "⏳" : "⬇️"}
            </button>
            <button onClick={() => downloadDocWord(d.gen(), d.label, d.key)} disabled={!!busyKey}
              className="py-2 px-2.5 rounded-r-xl text-xs font-bold border-2 border-l-0 border-slate-200 text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50 transition-all disabled:opacity-50">
              {busyKey === d.key + "_word" ? "⏳" : "📝"}
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <button onClick={() => setStep(5)} className="px-5 py-2.5 rounded-xl text-sm font-bold border-2 border-slate-200 text-slate-600 hover:bg-slate-50">← Edit Details</button>
        <button onClick={() => { setF({ ...DEFAULT, newDirectors: [makeNd()] }); setStep(1); try { localStorage.removeItem(DRAFT_KEY); } catch {} }}
          className="px-5 py-2.5 rounded-xl text-sm font-bold border-2 border-slate-200 text-slate-500 hover:bg-slate-50">
          🔄 New Appointment
        </button>
      </div>
    </div>
  );

  const stepContent: Record<number, React.ReactNode> = { 1: s1, 2: s2, 3: s3, 4: s4, 5: s5, 6: s6 };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
            <Link href="/tools/corporate-action-kit" className="hover:text-blue-600 font-semibold">Corporate Action Kit</Link>
            <span>›</span>
            <span className="text-slate-700 font-bold">Director Appointment</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#1d4ed8,#1e40af)" }}>👤</div>
              <div>
                <h1 className="text-lg font-extrabold text-slate-900">Director Appointment Kit</h1>
                <p className="text-xs text-slate-500">Section 161 / 152 · Companies Act 2013 · Board &amp; GM Appointment · Multi-Director Support</p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4 px-5 py-3">
            <div className="flex items-center gap-0">
              {STEPS.map((s, i) => {
                const n = i + 1;
                const done = n < step;
                const active = n === step;
                return (
                  <div key={s} className="flex items-center gap-0 flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${done || active ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-300 text-slate-400"}`}>
                        {done ? "✓" : n}
                      </div>
                      <span className={`text-xs mt-1 font-semibold hidden sm:block ${active ? "text-blue-700" : done ? "text-slate-600" : "text-slate-400"}`}>{s}</span>
                    </div>
                    {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${n < step ? "bg-blue-500" : "bg-slate-200"}`} />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            {stepContent[step]}
          </div>

          <p className="text-center text-xs text-slate-400 mt-3">Draft auto-saved to browser · No account needed</p>
        </div>
      </main>
    </>
  );
}
