"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import CompanySearch from "@/components/CompanySearch";
import CompanyExcelUpload from "@/components/CompanyExcelUpload";
import type { CompanyData } from "@/lib/types/company";
import { injectPreviewWatermark } from "@/lib/preview-protection";
import { useSession } from "next-auth/react";

/* ══════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════ */
interface Director {
  id: string;
  name: string;
  din: string;
  designation: string;
  isPresent: boolean;
}

type DesignationType =
  | "additional_director"
  | "alternate_director"
  | "nominee_director"
  | "managing_director"
  | "whole_time_director"
  | "independent_director"
  | "director_gm";

interface F {
  // Step 1 — Company
  companyName: string;
  cin: string;
  regAddress: string;
  entityType: string;
  // Step 2 — Meeting
  meetingDate: string;
  meetingTime: string;
  meetingSerial: string;
  venue: string;
  chairmanName: string;
  chairmanDin: string;
  // Step 3 — Directors present
  directors: Director[];
  // Step 4 — New Director
  ndName: string;
  ndFatherName: string;
  ndDin: string;
  ndDob: string;
  ndPan: string;
  ndAddress: string;
  ndCity: string;
  ndState: string;
  ndPincode: string;
  ndEmail: string;
  ndMobile: string;
  ndDesignation: DesignationType;
  ndNationality: string;
  ndOccupation: string;
  effectiveDate: string;
  // Alternate Director
  ndOriginalDirector: string;
  ndOriginalDin: string;
  // Nominee Director
  ndNominatingBody: string;
  // MD / WTD
  ndTermYears: string;
}

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

// Board-level appointment (generates Board Notice + Board Resolution)
const IS_BOARD_APPOINTED = new Set([
  "additional_director", "alternate_director", "nominee_director",
  "managing_director", "whole_time_director", "independent_director",
]);

const DEFAULT: F = {
  companyName: "", cin: "", regAddress: "", entityType: "pvt_ltd",
  meetingDate: "", meetingTime: "", meetingSerial: "", venue: "",
  chairmanName: "", chairmanDin: "",
  directors: [],
  ndName: "", ndFatherName: "", ndDin: "", ndDob: "", ndPan: "",
  ndAddress: "", ndCity: "", ndState: "", ndPincode: "",
  ndEmail: "", ndMobile: "",
  ndDesignation: "additional_director",
  ndNationality: "Indian", ndOccupation: "",
  effectiveDate: "",
  ndOriginalDirector: "", ndOriginalDin: "",
  ndNominatingBody: "",
  ndTermYears: "5",
};

const DRAFT_KEY = "csi_cak_dir_appt_v1";

/* ══════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════ */
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
  const period = h >= 12 ? "P.M." : "A.M.";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}
function numWords(n: string): string {
  const map: Record<string, string> = { "1": "One", "2": "Two", "3": "Three", "4": "Four", "5": "Five", "6": "Six", "7": "Seven", "8": "Eight", "9": "Nine", "10": "Ten" };
  return map[n] || n;
}

function addDays(dateStr: string, days: number): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
function calcDates(meetingDate: string) {
  if (!meetingDate) return { noticeDate: "", rocDeadline: "", fy: "", nextAGM: "" };
  const noticeDate = addDays(meetingDate, -7);
  const rocDeadline = addDays(meetingDate, 30);
  const d = new Date(meetingDate);
  const y = d.getFullYear(), m = d.getMonth() + 1;
  const fy = m >= 4 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;
  return { noticeDate, rocDeadline, fy, nextAGM: `${m >= 4 ? y + 1 : y}-09-30` };
}

/* ══════════════════════════════════════════════════════════════════
   DOCUMENT GENERATORS
══════════════════════════════════════════════════════════════════ */
const DOC_CSS = `
  body{font-family:'Times New Roman',Times,serif;color:#000;font-size:12pt;line-height:1.8;margin:0;padding:0;}
  .page{max-width:720px;margin:0 auto;padding:50px 60px;}
  .co-hdr{text-align:center;border-bottom:2.5px solid #000;padding-bottom:14px;margin-bottom:22px;}
  .co-hdr h1{font-size:14pt;font-weight:bold;margin:0 0 4px;text-transform:uppercase;letter-spacing:.5px;}
  .co-hdr p{font-size:10.5pt;margin:2px 0;}
  .doc-title{text-align:center;font-weight:bold;font-size:13pt;text-decoration:underline;margin:18px 0 14px;}
  .addressee{margin:12px 0 18px;}
  .addressee p{margin:2px 0;}
  .subject{font-weight:bold;text-decoration:underline;margin:14px 0;}
  .res-box{border-left:3px solid #000;padding:8px 16px;margin:18px 0;background:#fafafa;}
  .res-box p{margin:10px 0;}
  .sign-block{margin-top:56px;}
  .sign-block table{width:100%;}
  .sign-block td{vertical-align:bottom;padding:0;}
  .field-row{margin:10px 0;}
  .field-lbl{font-weight:bold;}
  .field-val{border-bottom:1px solid #000;display:inline-block;min-width:280px;padding:0 4px;}
  ol li{margin-bottom:8px;}
  .decl-box{border:1px solid #555;padding:14px 18px;margin:18px 0;}
  .mf-label{font-size:9pt;text-align:center;margin-bottom:14px;font-style:italic;}
  @media print{
    .page{padding:30px 40px;}
    body{font-size:11pt;}
    @page{size:A4;margin:15mm;}
  }
`;

function wrap(body: string, title: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>${DOC_CSS}</style></head><body><div class="page">${body}</div></body></html>`;
}

function coHeader(f: F): string {
  return `<div class="co-hdr"><h1>${f.companyName || "[COMPANY NAME]"}</h1><p>CIN: ${f.cin || "___________________"}</p><p>${f.regAddress || "[Registered Office Address]"}</p></div>`;
}

function signDate(f: F, dateStr: string): string {
  return `<table><tr><td style="width:55%;"><br><br>____________________________<br><strong>${f.chairmanName || "[Authorised Director]"}</strong><br>Director${f.chairmanDin ? `<br>DIN: ${f.chairmanDin}` : ""}</td><td style="text-align:right;"><p>Date: ${fmtDate(dateStr)}<br>Place: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p></td></tr></table>`;
}

/* ── 1. Board Notice ─────────────────────────────────────────── */
function genBoardNotice(f: F): string {
  const { noticeDate } = calcDates(f.meetingDate);
  const designation = DESIGNATION_LABEL[f.ndDesignation] || "Additional Director";
  const section = SECTION_REF[f.ndDesignation] || "Section 161(1)";
  const presentDirs = f.directors.filter(d => d.isPresent);
  const addressees = presentDirs.length > 0
    ? presentDirs.map(d => `<div class="addressee"><p>To,</p><p><strong>${d.name}</strong><br>${d.designation || "Director"}${d.din ? `<br>DIN: ${d.din}` : ""}</p></div>`).join("")
    : `<div class="addressee"><p>To,</p><p><strong>All Directors</strong><br>${f.companyName || "[Company Name]"}</p></div>`;

  // Designation-specific agenda item wording
  let agendaItem5 = "";
  if (f.ndDesignation === "alternate_director") {
    agendaItem5 = `To consider and, if thought fit, to pass a resolution for appointment of <strong>${f.ndName || "__________"}</strong> (DIN: ${f.ndDin || "________"}) as <strong>Alternate Director</strong> pursuant to <strong>Section 161(2)</strong> of the Companies Act, 2013, in place of <strong>${f.ndOriginalDirector || "[Original Director Name]"}</strong>${f.ndOriginalDin ? ` (DIN: ${f.ndOriginalDin})` : ""}, during the period of his/her absence from India (expected to be absent for not less than 3 months).`;
  } else if (f.ndDesignation === "nominee_director") {
    agendaItem5 = `To consider and, if thought fit, to pass a resolution for appointment of <strong>${f.ndName || "__________"}</strong> (DIN: ${f.ndDin || "________"}) as <strong>Nominee Director</strong> pursuant to <strong>Section 161(3)</strong> of the Companies Act, 2013 / Articles of Association, as nominated by <strong>${f.ndNominatingBody || "[Nominating Institution]"}</strong>.`;
  } else if (f.ndDesignation === "managing_director" || f.ndDesignation === "whole_time_director") {
    agendaItem5 = `To consider and, if thought fit, to pass a resolution for appointment of <strong>${f.ndName || "__________"}</strong> (DIN: ${f.ndDin || "________"}) as <strong>${designation}</strong> of the Company pursuant to <strong>${section}</strong> of the Companies Act, 2013, for a term of <strong>${f.ndTermYears || "5"} (${numWords(f.ndTermYears || "5")}) years</strong> with effect from ${fmtDate(f.effectiveDate || f.meetingDate)}, subject to the approval of shareholders at the next General Meeting.`;
  } else if (f.ndDesignation === "independent_director") {
    agendaItem5 = `To consider and, if thought fit, to pass a resolution for appointment of <strong>${f.ndName || "__________"}</strong> (DIN: ${f.ndDin || "________"}) as <strong>Additional Independent Director</strong> pursuant to <strong>Section 161(1) read with Section 149(4) & (6)</strong> and Schedule IV of the Companies Act, 2013, who has submitted his/her Declaration of Independence under Section 149(7), to hold office until the conclusion of the next AGM or 3 months from appointment, whichever is earlier, subject to regularisation by shareholders.`;
  } else {
    agendaItem5 = `To consider and, if thought fit, to pass a resolution for appointment of <strong>${f.ndName || "__________"}</strong> (DIN: ${f.ndDin || "________"}) as <strong>${designation}</strong> of the Company pursuant to <strong>${section}</strong> of the Companies Act, 2013, with effect from ${fmtDate(f.effectiveDate || f.meetingDate)}.`;
  }

  const extraEnclosures = f.ndDesignation === "independent_director"
    ? `<li>Form <strong>DIR-2</strong> — Consent to Act as Director [pursuant to Section 152(5) and Rule 8].</li><li>Form <strong>DIR-8</strong> — Declaration of Non-Disqualification [pursuant to Section 164(2) and Rule 14(1)].</li><li><strong>Declaration of Independence</strong> — pursuant to Section 149(7) of the Companies Act, 2013.</li>`
    : `<li>Form <strong>DIR-2</strong> — Consent to Act as Director [pursuant to Section 152(5) and Rule 8].</li><li>Form <strong>DIR-8</strong> — Declaration of Non-Disqualification [pursuant to Section 164(2) and Rule 14(1)].</li>`;

  const body = `
    ${coHeader(f)}
    <p>Date: <strong>${fmtDate(noticeDate)}</strong></p><br>
    ${addressees}
    <p class="subject">Sub: Notice of Meeting of the Board of Directors of ${f.companyName || "[Company Name]"}</p>
    <p>Dear Sir/Madam,</p>
    <p>Pursuant to the provisions of <strong>Section 173</strong> of the Companies Act, 2013 and the Secretarial Standard on Meetings of the Board of Directors (<strong>SS-1</strong>) issued by the Institute of Company Secretaries of India, notice is hereby given that a Meeting of the Board of Directors of <strong>${f.companyName || "[Company Name]"}</strong> will be held on <strong>${fmtDay(f.meetingDate)}, the ${fmtDate(f.meetingDate)}</strong>, at <strong>${fmtTime(f.meetingTime)}</strong>, at <strong>${f.venue || "[Venue]"}</strong>, to transact, inter alia, the following business:</p>
    <p><strong>AGENDA:</strong></p>
    <ol>
      <li>Election of Chairman of the Meeting.</li>
      <li>Ascertainment of Quorum.</li>
      <li>Grant of Leave of Absence to Directors who have intimated their inability to attend the meeting.</li>
      <li>Noting of Attendance by Directors, Company Secretary (if any), and Invitees.</li>
      <li>${agendaItem5}</li>
      <li>Any Other Business with the permission of the Chairman.</li>
    </ol>
    <p>Please find enclosed herewith the following documents received from <strong>${f.ndName || "__________"}</strong> prior to this meeting:</p>
    <ol>${extraEnclosures}</ol>
    <p>You are requested to make it convenient to attend the meeting at the scheduled date, time, and venue.</p>
    <div class="sign-block">
      <p>By Order of the Board<br>For <strong>${f.companyName || "[Company Name]"}</strong></p>
      ${signDate(f, noticeDate)}
    </div>`;
  return wrap(body, "Board Notice — Director Appointment");
}

/* ── 2. Board Resolution ─────────────────────────────────────── */
function genBoardResolution(f: F): string {
  const designation = DESIGNATION_LABEL[f.ndDesignation] || "Additional Director";
  const section = SECTION_REF[f.ndDesignation] || "Section 161(1)";
  const presentDirs = f.directors.filter(d => d.isPresent);
  const totalDirs = f.directors.length;
  const effDate = fmtDate(f.effectiveDate || f.meetingDate);

  // Designation-specific operative clause for RESOLVED THAT
  let resolvedThat = "";
  if (f.ndDesignation === "additional_director") {
    resolvedThat = `pursuant to the provisions of <strong>Section 161(1)</strong> and all other applicable provisions of the Companies Act, 2013, read with the Companies (Appointment and Qualification of Directors) Rules, 2014, and in accordance with the Articles of Association of the Company, <strong>${f.ndName || "__________"}</strong> (DIN: <strong>${f.ndDin || "________"}</strong>), who has submitted his/her Consent in Form DIR-2 and Declaration in Form DIR-8, and who in the opinion of the Board is a person of integrity and possesses relevant expertise and experience, be and is hereby appointed as <strong>Additional Director</strong> of the Company with effect from <strong>${effDate}</strong>, to hold office up to the date of the next Annual General Meeting of the Company, or the last date on which the Annual General Meeting should have been held, whichever is earlier, and shall be eligible for regularisation as a Director by the members at the said AGM.`;
  } else if (f.ndDesignation === "alternate_director") {
    resolvedThat = `pursuant to the provisions of <strong>Section 161(2)</strong> and all other applicable provisions of the Companies Act, 2013, and in accordance with the Articles of Association of the Company, <strong>${f.ndName || "__________"}</strong> (DIN: <strong>${f.ndDin || "________"}</strong>), who has submitted his/her Consent in Form DIR-2 and Declaration in Form DIR-8, be and is hereby appointed as <strong>Alternate Director</strong> of the Company in place of <strong>${f.ndOriginalDirector || "[Original Director]"}</strong>${f.ndOriginalDin ? ` (DIN: ${f.ndOriginalDin})` : ""}, during the period of his/her absence from India (expected to be absent for not less than 3 months), with effect from <strong>${effDate}</strong>. The said Alternate Director shall vacate office if and when the original Director returns to India, or if the original Director's term of office expires before such return, whichever is earlier.`;
  } else if (f.ndDesignation === "nominee_director") {
    resolvedThat = `pursuant to the provisions of <strong>Section 161(3)</strong> of the Companies Act, 2013 and the relevant provisions of the Articles of Association of the Company, <strong>${f.ndName || "__________"}</strong> (DIN: <strong>${f.ndDin || "________"}</strong>), as nominated by <strong>${f.ndNominatingBody || "[Nominating Institution]"}</strong>, who has submitted his/her Consent in Form DIR-2 and Declaration in Form DIR-8, be and is hereby appointed as <strong>Nominee Director</strong> of the Company representing the interests of ${f.ndNominatingBody || "[Nominating Institution]"}, with effect from <strong>${effDate}</strong>.`;
  } else if (f.ndDesignation === "managing_director") {
    resolvedThat = `pursuant to the provisions of <strong>Sections 196, 197, 203</strong> and all other applicable provisions of the Companies Act, 2013, read with Schedule V and the Companies (Appointment and Remuneration of Managerial Personnel) Rules, 2014, and subject to the approval of the shareholders at the next General Meeting of the Company, <strong>${f.ndName || "__________"}</strong> (DIN: <strong>${f.ndDin || "________"}</strong>), who has submitted his/her Consent in Form DIR-2 and Declaration in Form DIR-8, be and is hereby appointed as <strong>Managing Director</strong> of the Company for a term of <strong>${f.ndTermYears || "5"} (${numWords(f.ndTermYears || "5")}) years</strong> with effect from <strong>${effDate}</strong>, on such terms and conditions including remuneration as may be mutually agreed and as set out in the service agreement to be entered into between the Company and the appointee, subject to compliance with Schedule V of the Companies Act, 2013.`;
  } else if (f.ndDesignation === "whole_time_director") {
    resolvedThat = `pursuant to the provisions of <strong>Sections 196, 197, 203</strong> and all other applicable provisions of the Companies Act, 2013, read with Schedule V and the Companies (Appointment and Remuneration of Managerial Personnel) Rules, 2014, and subject to the approval of the shareholders at the next General Meeting of the Company, <strong>${f.ndName || "__________"}</strong> (DIN: <strong>${f.ndDin || "________"}</strong>), who has submitted his/her Consent in Form DIR-2 and Declaration in Form DIR-8, be and is hereby appointed as <strong>Whole-time Director</strong> of the Company for a term of <strong>${f.ndTermYears || "5"} (${numWords(f.ndTermYears || "5")}) years</strong> with effect from <strong>${effDate}</strong>, to devote his/her whole time and attention to the management of the affairs of the Company, on such terms and conditions including remuneration as may be determined and as set out in the service agreement to be entered into between the Company and the appointee, subject to compliance with Schedule V of the Companies Act, 2013.`;
  } else if (f.ndDesignation === "independent_director") {
    resolvedThat = `pursuant to the provisions of <strong>Section 161(1) read with Section 149(4) & (6)</strong> and Schedule IV of the Companies Act, 2013, and the Companies (Appointment and Qualification of Directors) Rules, 2014, <strong>${f.ndName || "__________"}</strong> (DIN: <strong>${f.ndDin || "________"}</strong>), who has submitted his/her Consent in Form DIR-2, Declaration in Form DIR-8, and Declaration of Independence under Section 149(7), and who in the opinion of the Board fulfils the conditions specified in the Act and Rules for appointment as an Independent Director and is independent of the management, be and is hereby appointed as <strong>Additional Independent Director</strong> of the Company with effect from <strong>${effDate}</strong>, to hold office until the conclusion of the next Annual General Meeting or 3 (three) months from the date of appointment, whichever is earlier, subject to regularisation/appointment as Independent Director by the shareholders.`;
  } else {
    resolvedThat = `pursuant to the provisions of <strong>${section}</strong> and all other applicable provisions of the Companies Act, 2013, read with the Companies (Appointment and Qualification of Directors) Rules, 2014, and in accordance with the Articles of Association of the Company, <strong>${f.ndName || "__________"}</strong> (DIN: <strong>${f.ndDin || "________"}</strong>), who has submitted his/her Consent in Form DIR-2 and Declaration in Form DIR-8, and who in the opinion of the Board is a person of integrity and possesses relevant expertise and experience, be and is hereby appointed as <strong>${designation}</strong> of the Company with effect from <strong>${effDate}</strong>.`;
  }

  const isMdWtd = f.ndDesignation === "managing_director" || f.ndDesignation === "whole_time_director";
  const filingClause = isMdWtd
    ? `any Director or the Company Secretary (if any) of the Company be and is hereby severally authorised to file <strong>Form DIR-12</strong> with the Registrar of Companies within 30 (thirty) days, and <strong>Form MR-1</strong> within 60 (sixty) days of this appointment, along with the prescribed attachments, and to do all such acts, deeds, matters and things as may be necessary to give effect to the foregoing resolutions.`
    : `any Director or the Company Secretary (if any) of the Company be and is hereby severally authorised to file <strong>Form DIR-12</strong> with the Registrar of Companies within 30 (thirty) days of this appointment, along with the prescribed attachments, and to do all such acts, deeds, matters and things as may be necessary to give effect to the foregoing resolutions.`;

  const contextPara = f.ndDesignation === "alternate_director"
    ? `<p>The Chairman informed the Board that <strong>${f.ndOriginalDirector || "[Original Director]"}</strong>${f.ndOriginalDin ? ` (DIN: ${f.ndOriginalDin})` : ""} is expected to be absent from India for a period of not less than 3 (three) months. The Board proposed the appointment of <strong>${f.ndName || "__________"}</strong> (DIN: <strong>${f.ndDin || "________"}</strong>) as Alternate Director during such absence. The Board noted the following documents received from ${f.ndName || "__________"}:</p>`
    : f.ndDesignation === "nominee_director"
    ? `<p>The Chairman informed the Board that <strong>${f.ndNominatingBody || "[Nominating Institution]"}</strong> has, pursuant to its right under the Articles of Association / Loan Agreement, nominated <strong>${f.ndName || "__________"}</strong> (DIN: <strong>${f.ndDin || "________"}</strong>) as its Nominee Director on the Board of the Company. The Board noted the following documents received:</p>`
    : `<p>The Chairman informed the Board that the Company has received an intimation/application from <strong>${f.ndName || "__________"}</strong> (DIN: <strong>${f.ndDin || "________"}</strong>) expressing his/her willingness to be appointed as <strong>${designation}</strong> of the Company. The Board noted the following documents received from him/her prior to this meeting:</p>`;

  const body = `
    ${coHeader(f)}
    <div class="doc-title">EXTRACT OF MINUTES OF THE MEETING OF THE BOARD OF DIRECTORS</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
      <tr><td style="font-weight:bold;width:200px;padding:3px 0;">Meeting No.:</td><td style="padding:3px 0;">${f.meetingSerial || "___/____-__"}</td></tr>
      <tr><td style="font-weight:bold;padding:3px 0;">Date:</td><td style="padding:3px 0;">${fmtDate(f.meetingDate)}</td></tr>
      <tr><td style="font-weight:bold;padding:3px 0;">Time:</td><td style="padding:3px 0;">${fmtTime(f.meetingTime)}</td></tr>
      <tr><td style="font-weight:bold;padding:3px 0;">Venue:</td><td style="padding:3px 0;">${f.venue || "___________________"}</td></tr>
      <tr><td style="font-weight:bold;padding:3px 0;">Chairman:</td><td style="padding:3px 0;">${f.chairmanName || "___________"}${f.chairmanDin ? ` (DIN: ${f.chairmanDin})` : ""}</td></tr>
      <tr><td style="font-weight:bold;padding:3px 0;">Directors Present:</td><td style="padding:3px 0;">${presentDirs.length || "__"} out of ${totalDirs || "__"} Directors</td></tr>
    </table>
    <p><strong>AGENDA ITEM: Appointment of ${designation}</strong></p>
    ${contextPara}
    <ol>
      <li>Form DIR-2 — Consent to Act as Director under Section 152(5) read with Rule 8.</li>
      <li>Form DIR-8 — Declaration under Section 164(2) read with Rule 14(1).</li>
      ${f.ndDesignation === "independent_director" ? "<li>Declaration of Independence under Section 149(7).</li>" : ""}
    </ol>
    <p>The Board noted that <strong>${f.ndName || "__________"}</strong> satisfies the conditions specified in Section 164 and is not disqualified from being appointed as a Director of the Company. After discussion, the following resolution was proposed, seconded, and <strong>passed unanimously</strong>:</p>
    <div class="res-box">
      <p><strong>&ldquo;RESOLVED THAT</strong> ${resolvedThat}&rdquo;</p>
      <p><strong>&ldquo;RESOLVED FURTHER THAT</strong> pursuant to <strong>Section 170</strong> of the Companies Act, 2013, the Company Secretary (if any) or any Director of the Company be and is hereby authorised to make necessary entries in the Register of Directors and Key Managerial Personnel.&rdquo;</p>
      <p><strong>&ldquo;RESOLVED FURTHER THAT</strong> ${filingClause}&rdquo;</p>
    </div>
    <p>There being no other business to transact, the meeting was concluded with a vote of thanks to the Chair.</p>
    <div class="sign-block">
      <table style="width:100%;"><tr>
        <td style="width:55%;vertical-align:bottom;">
          <br><br>____________________________<br><strong>${f.chairmanName || "[Chairman]"}</strong><br>Chairman of the Meeting${f.chairmanDin ? `<br>DIN: ${f.chairmanDin}` : ""}
        </td>
        <td style="text-align:right;vertical-align:bottom;">
          Date: ${fmtDate(f.meetingDate)}<br>Place: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </td>
      </tr></table>
      <br>
      <p style="font-size:10pt;"><em>Certified to be a True Extract of the Minutes of the Meeting of the Board of Directors of <strong>${f.companyName || "[Company Name]"}</strong> held on ${fmtDate(f.meetingDate)}.</em></p>
      <br>____________________________<br><strong>${f.chairmanName || "[Director]"}</strong><br>Director${f.chairmanDin ? `<br>DIN: ${f.chairmanDin}` : ""}<br><br>Date: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Place: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    </div>`;
  return wrap(body, "Board Resolution — Director Appointment");
}

/* ── 3. DIR-2 Consent ────────────────────────────────────────── */
function genDIR2(f: F): string {
  const addr = [f.ndAddress, f.ndCity, f.ndState, f.ndPincode].filter(Boolean).join(", ");
  const body = `
    <div class="mf-label">FORM DIR-2<br>[Pursuant to Section 152(5) and Rule 8 of the Companies (Appointment and Qualification of Directors) Rules, 2014]</div>
    <div class="doc-title">CONSENT TO ACT AS DIRECTOR OF A COMPANY</div>
    <p>I, the undersigned, hereby give my consent to act as a Director of the following Company:</p>
    <div class="field-row"><span class="field-lbl">Name of Company: </span><span class="field-val">${f.companyName || ""}</span></div>
    <div class="field-row"><span class="field-lbl">CIN: </span><span class="field-val">${f.cin || ""}</span></div>
    <div class="field-row"><span class="field-lbl">Registered Office: </span><span class="field-val">${f.regAddress || ""}</span></div>
    <br>
    <p><strong>Particulars of the person giving consent:</strong></p>
    <div class="field-row"><span class="field-lbl">Full Name: </span><span class="field-val">${f.ndName || ""}</span></div>
    <div class="field-row"><span class="field-lbl">Father's / Husband's Name: </span><span class="field-val">${f.ndFatherName || ""}</span></div>
    <div class="field-row"><span class="field-lbl">DIN (Director Identification Number): </span><span class="field-val">${f.ndDin || ""}</span></div>
    <div class="field-row"><span class="field-lbl">Date of Birth: </span><span class="field-val">${fmtDate(f.ndDob)}</span></div>
    <div class="field-row"><span class="field-lbl">Nationality: </span><span class="field-val">${f.ndNationality || "Indian"}</span></div>
    <div class="field-row"><span class="field-lbl">Occupation: </span><span class="field-val">${f.ndOccupation || ""}</span></div>
    <div class="field-row"><span class="field-lbl">PAN: </span><span class="field-val">${f.ndPan || ""}</span></div>
    <div class="field-row"><span class="field-lbl">Present Address: </span><span class="field-val">${addr || ""}</span></div>
    <div class="field-row"><span class="field-lbl">Date of Appointment: </span><span class="field-val">${fmtDate(f.effectiveDate || f.meetingDate)}</span></div>
    <div class="decl-box">
      <p>I hereby declare that:</p>
      <ol>
        <li>I am not disqualified from being appointed as a Director under Section 164 of the Companies Act, 2013.</li>
        <li>I have not been declared insolvent and no petition has been filed against me for insolvency.</li>
        <li>I have read and understood my responsibilities as a Director under the Companies Act, 2013 and Rules made thereunder.</li>
        <li>The information furnished above is true and correct to the best of my knowledge and belief, and nothing material has been concealed.</li>
      </ol>
    </div>
    <div class="sign-block">
      <table><tr>
        <td style="width:55%;vertical-align:bottom;"><br><br>____________________________<br><strong>${f.ndName || "[Name]"}</strong><br>DIN: ${f.ndDin || "________"}</td>
        <td style="text-align:right;vertical-align:bottom;">Date: ${fmtDate(f.effectiveDate || f.meetingDate)}<br>Place: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
      </tr></table>
    </div>`;
  return wrap(body, "DIR-2 — Consent to Act as Director");
}

/* ── 4. DIR-8 Declaration ────────────────────────────────────── */
function genDIR8(f: F): string {
  const addr = [f.ndAddress, f.ndCity, f.ndState, f.ndPincode].filter(Boolean).join(", ");
  const body = `
    <div class="mf-label">FORM DIR-8<br>[Pursuant to Section 164(2) and Rule 14(1) of the Companies (Appointment and Qualification of Directors) Rules, 2014]</div>
    <div class="doc-title">DECLARATION BY A PERSON SEEKING APPOINTMENT AS DIRECTOR</div>
    <p>To,<br><strong>The Board of Directors,</strong><br><strong>${f.companyName || "[Company Name]"}</strong><br>${f.regAddress || "[Registered Office]"}</p>
    <p>I, <strong>${f.ndName || "__________"}</strong>, son/daughter of <strong>${f.ndFatherName || "__________"}</strong>, bearing DIN <strong>${f.ndDin || "__________"}</strong>${f.ndPan ? `, PAN <strong>${f.ndPan}</strong>` : ""}, residing at ${addr || "[Address]"}, do hereby declare that I am not disqualified to become a Director under Section 164 of the Companies Act, 2013. In particular, I hereby declare that:</p>
    <ol>
      <li>I have not been declared insolvent and no petition to declare me insolvent is pending before any court.</li>
      <li>I have not been convicted of any offence in connection with the promotion, formation or management of any company or LLP, and sentenced to imprisonment for six months or more.</li>
      <li>I have not been convicted of any offence involving moral turpitude and sentenced to imprisonment for not less than six months, and a period of five years has not elapsed from the date of expiry of the sentence.</li>
      <li>An order disqualifying me for appointment as a Director has not been passed by any Court or Tribunal and the same is not in force.</li>
      <li>I have not, as a Director of a company, defaulted in filing of Annual Returns or financial statements for any continuous period of three financial years.</li>
      <li>I have not failed to repay deposits accepted by a company or pay interest thereon or to redeem any debentures or pay interest due thereon or pay any dividend declared, for a continuous period of one year and a period of five years has not elapsed from the date of such failure.</li>
      <li>I have not been convicted of any offence in connection with related party transactions under Section 188 during the last five years.</li>
      <li>I am not detained under the Conservation of Foreign Exchange and Prevention of Smuggling Activities Act, 1974 for a period of two years or more, or if detained, the detention order has been revoked prior to making this declaration.</li>
    </ol>
    <p>I further undertake to immediately intimate the Company in writing about any subsequent event or change in circumstances which may render me disqualified to continue as a Director of the Company under Section 164 of the Companies Act, 2013.</p>
    <p>I am aware that any false statement made in this declaration shall constitute an offence punishable under Section 448 of the Companies Act, 2013.</p>
    <div class="sign-block">
      <table><tr>
        <td style="width:55%;vertical-align:bottom;"><br><br>____________________________<br><strong>${f.ndName || "[Name]"}</strong><br>DIN: ${f.ndDin || "________"}</td>
        <td style="text-align:right;vertical-align:bottom;">Date: ${fmtDate(f.effectiveDate || f.meetingDate)}<br>Place: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
      </tr></table>
    </div>`;
  return wrap(body, "DIR-8 — Non-Disqualification Declaration");
}

/* ── 5. ROC Filing Guide ─────────────────────────────────────── */
function genROCGuide(f: F): string {
  const { rocDeadline } = calcDates(f.meetingDate);
  const isMdWtd = f.ndDesignation === "managing_director" || f.ndDesignation === "whole_time_director";
  const isAdditional = f.ndDesignation === "additional_director";
  const isAlternate = f.ndDesignation === "alternate_director";
  const isNominee = f.ndDesignation === "nominee_director";
  const isIndependent = f.ndDesignation === "independent_director";
  const designation = DESIGNATION_LABEL[f.ndDesignation] || "Director";
  const body = `
    <div class="doc-title" style="text-decoration:none;font-size:15pt;">📋 ROC Filing Guide</div>
    <p style="text-align:center;font-size:11pt;color:#555;">${designation} Appointment — ${f.companyName || "[Company Name]"}</p>
    <br>

    <table style="width:100%;border-collapse:collapse;border:1.5px solid #999;">
      <tr style="background:#f0f0f0;">
        <td style="padding:10px;font-weight:bold;border:1px solid #999;font-size:13pt;" colspan="2">Form DIR-12 — Mandatory ROC Filing</td>
      </tr>
      <tr><td style="padding:8px 10px;font-weight:bold;border:1px solid #999;width:200px;">Filed by:</td><td style="padding:8px 10px;border:1px solid #999;">Company (${f.companyName || "Company Name"})</td></tr>
      <tr><td style="padding:8px 10px;font-weight:bold;border:1px solid #999;">Date of Appointment:</td><td style="padding:8px 10px;border:1px solid #999;">${fmtDate(f.effectiveDate || f.meetingDate)}</td></tr>
      <tr><td style="padding:8px 10px;font-weight:bold;border:1px solid #999;">DIR-12 Deadline:</td><td style="padding:8px 10px;border:1px solid #999;"><strong>30 days → ${fmtDate(rocDeadline)}</strong> ⚠️ Late filing incurs additional fees per Section 403</td></tr>
      ${isMdWtd ? `<tr><td style="padding:8px 10px;font-weight:bold;border:1px solid #999;color:#c00;">MR-1 Deadline:</td><td style="padding:8px 10px;border:1px solid #999;color:#c00;"><strong>60 days from appointment</strong> — Form MR-1 is additionally mandatory for MD/WTD. File within 60 days at MCA V3 → Company Forms → MR-1.</td></tr>` : ""}
      <tr><td style="padding:8px 10px;font-weight:bold;border:1px solid #999;">DSC Required:</td><td style="padding:8px 10px;border:1px solid #999;">DSC of any existing Director or Company Secretary</td></tr>
      <tr><td style="padding:8px 10px;font-weight:bold;border:1px solid #999;">Filing Portal:</td><td style="padding:8px 10px;border:1px solid #999;">MCA V3 Portal — www.mca.gov.in → e-Filing → Company Forms → DIR-12</td></tr>
    </table>
    <br>

    <p><strong>Attachments required for DIR-12:</strong></p>
    <ol>
      <li>✅ <strong>Board Resolution</strong> — Extract of Minutes <em>[generated above]</em></li>
      <li>✅ <strong>DIR-2</strong> — Consent to Act as Director <em>[generated above]</em></li>
      <li>✅ <strong>DIR-8</strong> — Declaration under Section 164(2) <em>[generated above]</em></li>
      ${isIndependent ? `<li>⬜ <strong>Declaration of Independence</strong> — Section 149(7) declaration signed by the director</li>` : ""}
      ${isIndependent ? `<li>⬜ <strong>Letter of Appointment</strong> — per Schedule IV (Code for Independent Directors), signed by both parties</li>` : ""}
      ${isNominee ? `<li>⬜ <strong>Nomination Letter</strong> — from ${f.ndNominatingBody || "the nominating institution"}</li>` : ""}
      <li>⬜ <strong>DIN Proof</strong> — DIN allotment letter or MCA portal screenshot for DIN ${f.ndDin || "________"}</li>
    </ol>
    ${isMdWtd ? `
    <br>
    <p><strong>Additional attachments for Form MR-1:</strong></p>
    <ol>
      <li>✅ <strong>Board Resolution</strong> approving the appointment</li>
      <li>⬜ <strong>Service Agreement / Appointment Letter</strong> — setting out terms and remuneration</li>
      <li>⬜ <strong>Schedule V compliance</strong> — remuneration certificate if company has adequate profits, OR CG approval if inadequate profits and remuneration exceeds limits</li>
    </ol>` : ""}
    <br>

    <p><strong>Step-by-Step DIR-12 Filing:</strong></p>
    <ol>
      <li>Log in to MCA V3 portal at www.mca.gov.in with Company credentials.</li>
      <li>Navigate to: <strong>e-Filing → Company Forms Submission → DIR-12</strong></li>
      <li>Enter Company CIN: <strong>${f.cin || "_______________"}</strong></li>
      <li>Under "Director / Officer Details": enter DIN <strong>${f.ndDin || "________"}</strong>, date of appointment <strong>${fmtDate(f.effectiveDate || f.meetingDate)}</strong>, designation <strong>${designation}</strong></li>
      <li>Upload all required attachments in PDF format.</li>
      <li>Affix DSC of authorised Director/CS and submit.</li>
      <li>Note the SRN (Service Request Number) for records.</li>
    </ol>
    <br>

    ${isAdditional ? `
    <table style="width:100%;border-collapse:collapse;border:1.5px solid #e59a00;background:#fffbeb;">
      <tr><td style="padding:12px;">
        <strong>⚠️ Regularization at Next AGM Required</strong><br><br>
        An Additional Director (Section 161(1)) holds office only <strong>till the next AGM</strong> or the last date the AGM should have been held, whichever is earlier.<br><br>
        To regularize <strong>${f.ndName || "this director"}</strong>: pass an <strong>Ordinary Resolution</strong> at the next AGM under Section 152(1), and file a fresh DIR-12 within 30 days of the AGM.
      </td></tr>
    </table><br>` : ""}

    ${isAlternate ? `
    <table style="width:100%;border-collapse:collapse;border:1.5px solid #e59a00;background:#fffbeb;">
      <tr><td style="padding:12px;">
        <strong>⚠️ Alternate Director — Key Conditions (Section 161(2))</strong><br><br>
        <ul style="margin:8px 0;padding-left:20px;">
          <li style="margin:6px 0;">The original director <strong>${f.ndOriginalDirector || "[Original Director]"}</strong> must be absent from India for <strong>not less than 3 months</strong>.</li>
          <li style="margin:6px 0;">Alternate Director <strong>vacates office</strong> automatically when the original director returns to India.</li>
          <li style="margin:6px 0;">Alternate Director cannot hold any other alternate directorship for any other director.</li>
          <li style="margin:6px 0;">When original director returns, file DIR-12 for cessation of Alternate Director within 30 days.</li>
        </ul>
      </td></tr>
    </table><br>` : ""}

    ${isIndependent ? `
    <table style="width:100%;border-collapse:collapse;border:1.5px solid #e59a00;background:#fffbeb;">
      <tr><td style="padding:12px;">
        <strong>⚠️ Independent Director — Regularization & Annual Compliance</strong><br><br>
        <ul style="margin:8px 0;padding-left:20px;">
          <li style="margin:6px 0;">Appointed now as <strong>Additional Independent Director</strong> — must be <strong>regularized at next AGM</strong> by Ordinary Resolution under Section 149 for a fixed term of 5 years.</li>
          <li style="margin:6px 0;"><strong>Annual Declaration of Independence</strong> (Section 149(7)) must be given at the first Board meeting of every financial year.</li>
          <li style="margin:6px 0;">Maximum 2 consecutive terms of 5 years each. After 2 terms: 3-year cooling-off before re-appointment.</li>
          <li style="margin:6px 0;">Issue formal <strong>Letter of Appointment</strong> per Schedule IV (Code for Independent Directors) — must include role, duties, remuneration, and review process.</li>
        </ul>
      </td></tr>
    </table><br>` : ""}

    ${isMdWtd ? `
    <table style="width:100%;border-collapse:collapse;border:1.5px solid #e59a00;background:#fffbeb;">
      <tr><td style="padding:12px;">
        <strong>⚠️ ${designation} — Shareholder Approval Required</strong><br><br>
        <ul style="margin:8px 0;padding-left:20px;">
          <li style="margin:6px 0;">Board has approved the appointment today — but <strong>shareholders must approve</strong> at next AGM/EGM within 3 months from Board meeting date (Section 196(4)).</li>
          <li style="margin:6px 0;">File Form MR-1 within <strong>60 days</strong> of the Board approval date (${fmtDate(f.meetingDate)}).</li>
          <li style="margin:6px 0;">If company does not have adequate profits, remuneration exceeding Schedule V limits requires <strong>Central Government (CG) approval</strong> via Form MR-2.</li>
          <li style="margin:6px 0;">Maximum term: 5 years at a time. Re-appointment only within 1 year before expiry of current term.</li>
        </ul>
      </td></tr>
    </table><br>` : ""}

    <table style="width:100%;border-collapse:collapse;border:1.5px solid #ccc;background:#f9f9f9;">
      <tr><td style="padding:12px;"><strong>📌 Additional Compliance Checklist:</strong><br><br>
      <ul style="margin:8px 0;padding-left:20px;">
        <li style="margin:6px 0;">Update <strong>Register of Directors & KMP (MBP-1)</strong> — Section 170.</li>
        <li style="margin:6px 0;">Send formal appointment letter to <strong>${f.ndName || "new director"}</strong> with copy of Board Resolution.</li>
        <li style="margin:6px 0;">If no DIN yet: apply via <strong>Form DIR-3</strong> first (allotted in 1-2 working days).</li>
        <li style="margin:6px 0;">For listed companies: intimate stock exchange via <strong>LODR Regulation 30</strong> within 24 hours.</li>
        <li style="margin:6px 0;">Update company website with new director details (if applicable).</li>
      </ul>
      </td></tr>
    </table>`;
  return wrap(body, "ROC Filing Guide — Director Appointment");
}

/* ══════════════════════════════════════════════════════════════════
   COMPONENTS
══════════════════════════════════════════════════════════════════ */
function SHead({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-black flex items-center justify-center flex-shrink-0 mt-0.5">{n}</div>
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function Field({ label, req, children, hint }: { label: string; req?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-slate-700">
        {label}{req && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-white";
const SELECT = "w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

function NavButtons({ step, setStep, maxStep, canProceed, onGenerate }: {
  step: number; setStep: (s: number) => void; maxStep: number; canProceed: boolean;
  onGenerate?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-100">
      {step > 1
        ? <button onClick={() => setStep(step - 1)} className="px-5 py-2.5 rounded-xl text-sm font-bold border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">← Back</button>
        : <div />}
      {step < maxStep
        ? <button
            onClick={() => canProceed && setStep(step + 1)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all ${canProceed ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-300 cursor-not-allowed"}`}>
            Continue →
          </button>
        : <button
            onClick={onGenerate}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all">
            ✅ Generate Package
          </button>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════ */
export default function DirectorAppointmentPage() {
  const { data: session } = useSession();

  const [f, setF] = useState<F>({ ...DEFAULT });
  const [hydrated, setHydrated] = useState(false);

  // Load draft from localStorage after mount (avoids SSR hydration mismatch)
  useEffect(() => {
    try {
      const s = localStorage.getItem(DRAFT_KEY);
      if (s) setF(JSON.parse(s) as F);
    } catch {}
    setHydrated(true);
  }, []);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [activeDoc, setActiveDoc] = useState<"notice" | "resolution" | "dir2" | "dir8" | "roc">("notice");
  const [companySearchVal, setCompanySearchVal] = useState("");

  // Auto-save draft (only after client hydration to avoid overwriting stored draft)
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(f)); } catch {}
  }, [f, hydrated]);

  // Sync effectiveDate with meetingDate if not manually set
  useEffect(() => {
    if (f.meetingDate && !f.effectiveDate) setF(p => ({ ...p, effectiveDate: p.meetingDate }));
  }, [f.meetingDate, f.effectiveDate]);

  const up = useCallback(<K extends keyof F>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setF(p => ({ ...p, [key]: e.target.value })), []);

  const dates = useMemo(() => calcDates(f.meetingDate), [f.meetingDate]);

  // Auto-fill from company data
  function fillCompany(c: CompanyData) {
    setF(p => ({
      ...p,
      companyName: c.companyName || p.companyName,
      cin: c.cin || p.cin,
      regAddress: c.regAddress || p.regAddress,
      entityType: c.entityType || p.entityType,
      directors: c.directors?.map((d, i) => ({
        id: `dir-${i}`,
        name: d.name || "",
        din: d.din || "",
        designation: d.designation || "Director",
        isPresent: true,
      })) || p.directors,
    }));
    setCompanySearchVal(c.companyName || "");
  }

  function addDirector() {
    setF(p => ({ ...p, directors: [...p.directors, { id: `dir-${Date.now()}`, name: "", din: "", designation: "Director", isPresent: true }] }));
  }
  function removeDirector(id: string) {
    setF(p => ({ ...p, directors: p.directors.filter(d => d.id !== id) }));
  }
  function updateDirector(id: string, field: keyof Director, val: string | boolean) {
    setF(p => ({ ...p, directors: p.directors.map(d => d.id === id ? { ...d, [field]: val } : d) }));
  }

  function openPrint(html: string) {
    const h = session ? html : injectPreviewWatermark(html);
    const w = window.open("", "_blank", "width=900,height=750");
    if (!w) return;
    w.document.write(h);
    w.document.close();
    setTimeout(() => w.print(), 600);
  }

  const docMap = useMemo(() => ({
    notice:     { label: "Board Notice",      emoji: "📬", gen: () => genBoardNotice(f) },
    resolution: { label: "Board Resolution",  emoji: "⚖️",  gen: () => genBoardResolution(f) },
    dir2:       { label: "DIR-2 Consent",     emoji: "✅",  gen: () => genDIR2(f) },
    dir8:       { label: "DIR-8 Declaration", emoji: "📜",  gen: () => genDIR8(f) },
    roc:        { label: "ROC Filing Guide",  emoji: "📋",  gen: () => genROCGuide(f) },
  }), [f]);

  // Validation
  const canStep1 = !!f.companyName;
  const canStep2 = !!f.meetingDate && !!f.meetingSerial && !!f.chairmanName;
  const canStep3 = f.directors.filter(d => d.isPresent).length >= 1;
  const canStep4 = !!f.ndName && !!f.ndDin && !!f.ndFatherName;

  const STEPS = ["Company", "Meeting & Dates", "Attendance", "New Director", "Documents"];

  /* ── STEP 1: Company ── */
  const s1 = (
    <div className="space-y-5">
      <SHead n={1} title="Company Details" sub="Auto-fill from MCA Excel or search by company name / CIN" />
      <CompanyExcelUpload onFill={fillCompany} />
      <div className="relative flex items-center gap-3 text-xs text-slate-400"><div className="flex-1 h-px bg-slate-200" /><span>or search your saved companies</span><div className="flex-1 h-px bg-slate-200" /></div>
      <CompanySearch value={companySearchVal} onChange={setCompanySearchVal} onSelect={fillCompany} className={INPUT} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
        <Field label="Company Name" req><input value={f.companyName} onChange={up("companyName")} className={INPUT} placeholder="e.g. ABC Enterprises Private Limited" /></Field>
        <Field label="CIN"><input value={f.cin} onChange={up("cin")} className={INPUT} placeholder="e.g. U74999MH2020PTC123456" /></Field>
        <Field label="Entity Type"><select value={f.entityType} onChange={up("entityType")} className={SELECT}><option value="pvt_ltd">Private Limited Company</option><option value="public_ltd">Public Limited Company</option><option value="opc">One Person Company (OPC)</option><option value="section8">Section 8 Company</option><option value="nidhi">Nidhi Company</option></select></Field>
        <div />
        <Field label="Registered Office Address" req><textarea value={f.regAddress} onChange={up("regAddress")} className={INPUT} rows={2} placeholder="Full registered office address" /></Field>
      </div>
      <NavButtons step={step} setStep={s => setStep(s as typeof step)} maxStep={5} canProceed={canStep1} />
    </div>
  );

  /* ── STEP 2: Meeting & Dates ── */
  const s2 = (
    <div className="space-y-5">
      <SHead n={2} title="Meeting Details & Date Planner" sub="Enter the board meeting date — notice date and ROC deadline are calculated automatically" />

      {/* Date planner card */}
      {f.meetingDate && (
        <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">📅 Auto Date Planner</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Board Notice (SS-1)", date: dates.noticeDate, note: "7 days before meeting", color: "bg-white border-slate-200 text-slate-700" },
              { label: "Board Meeting", date: f.meetingDate, note: "Director appointed on this date", color: "bg-blue-600 border-blue-600 text-white" },
              { label: "DIR-12 Deadline ⚠️", date: dates.rocDeadline, note: "30 days from appointment", color: "bg-red-50 border-red-300 text-red-700" },
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
        <Field label="Board Meeting Date" req hint="Notice will be 7 days before, DIR-12 deadline 30 days after">
          <input type="date" value={f.meetingDate} onChange={up("meetingDate")} className={INPUT} />
        </Field>
        <Field label="Meeting Time"><input type="time" value={f.meetingTime} onChange={up("meetingTime")} className={INPUT} /></Field>
        <Field label="Meeting Serial No." req hint="e.g. 3/2025-26 (3rd meeting of FY 2025-26)">
          <input value={f.meetingSerial} onChange={up("meetingSerial")} className={INPUT} placeholder="e.g. 3/2025-26" />
        </Field>
        <Field label="Venue"><input value={f.venue} onChange={up("venue")} className={INPUT} placeholder="Registered office / any other venue" /></Field>
        <Field label="Chairman's Name" req><input value={f.chairmanName} onChange={up("chairmanName")} className={INPUT} placeholder="Name of meeting chairman" /></Field>
        <Field label="Chairman's DIN"><input value={f.chairmanDin} onChange={up("chairmanDin")} className={INPUT} placeholder="8-digit DIN" maxLength={8} /></Field>
      </div>
      <NavButtons step={step} setStep={s => setStep(s as typeof step)} maxStep={5} canProceed={canStep2} />
    </div>
  );

  /* ── STEP 3: Directors Present ── */
  const presentCount = f.directors.filter(d => d.isPresent).length;
  const quorumOk = presentCount >= (f.entityType === "opc" ? 1 : 2);
  const s3 = (
    <div className="space-y-5">
      <SHead n={3} title="Directors Present at Meeting" sub="Mark who attended — needed for quorum and board notice addresses" />
      {f.directors.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          No directors loaded. Add directors manually or upload MCA Excel in Step 1.
        </div>
      )}
      <div className="space-y-3">
        {f.directors.map((d, i) => (
          <div key={d.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${d.isPresent ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"}`}>
            <input type="checkbox" checked={d.isPresent} onChange={e => updateDirector(d.id, "isPresent", e.target.checked)}
              className="w-5 h-5 rounded accent-blue-600 cursor-pointer flex-shrink-0" />
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input value={d.name} onChange={e => updateDirector(d.id, "name", e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm" placeholder={`Director ${i + 1} Name`} />
              <input value={d.din} onChange={e => updateDirector(d.id, "din", e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm" placeholder="DIN (8 digits)" maxLength={8} />
              <input value={d.designation} onChange={e => updateDirector(d.id, "designation", e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm" placeholder="Designation" />
            </div>
            <button onClick={() => removeDirector(d.id)} className="text-slate-400 hover:text-red-500 text-lg flex-shrink-0">✕</button>
          </div>
        ))}
      </div>
      <button onClick={addDirector} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm font-bold text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
        + Add Director
      </button>
      {f.directors.length > 0 && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold ${quorumOk ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {quorumOk ? "✓" : "⚠"} Quorum: {presentCount} director{presentCount !== 1 ? "s" : ""} present
          {!quorumOk && " — minimum 2 required for Pvt Ltd"}
        </div>
      )}
      <NavButtons step={step} setStep={s => setStep(s as typeof step)} maxStep={5} canProceed={canStep3} />
    </div>
  );

  /* ── STEP 4: New Director Details ── */
  const s4 = (
    <div className="space-y-5">
      <SHead n={4} title="New Director Details" sub="Details of the director being appointed — used in DIR-2, DIR-8, and all documents" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Type of Appointment" req hint="Select the designation — form changes accordingly">
          <select value={f.ndDesignation} onChange={up("ndDesignation")} className={SELECT}>
            <optgroup label="— Board Appointed —">
              <option value="additional_director">Additional Director — Section 161(1)</option>
              <option value="alternate_director">Alternate Director — Section 161(2)</option>
              <option value="nominee_director">Nominee Director — Section 161(3)</option>
              <option value="managing_director">Managing Director — Section 196 + Schedule V</option>
              <option value="whole_time_director">Whole-time Director — Section 196 + Schedule V</option>
              <option value="independent_director">Independent Director — Section 149(4)(6) + Schedule IV</option>
            </optgroup>
            <optgroup label="— General Meeting Appointed —">
              <option value="director_gm">Director (at General Meeting) — Section 152</option>
            </optgroup>
          </select>
        </Field>
        <Field label="Effective Date of Appointment" hint="Usually the date of board/GM meeting">
          <input type="date" value={f.effectiveDate || f.meetingDate} onChange={up("effectiveDate")} className={INPUT} />
        </Field>

        {/* GM director notice */}
        {f.ndDesignation === "director_gm" && (
          <div className="col-span-2 bg-amber-50 border border-amber-300 rounded-xl p-4 text-sm text-amber-800">
            <strong>📋 Note — General Meeting Appointment:</strong> A Director under Section 152 is appointed only at a General Meeting (AGM/EGM) by Ordinary Resolution — not at a Board meeting. The documents generated here (Board Notice, Board Resolution) are for the <em>Board recommending</em> the appointment. You will additionally need: <strong>GM Notice (21 days)</strong>, <strong>Explanatory Statement (Section 102)</strong>, and <strong>Ordinary Resolution at GM</strong>. DIR-12 must be filed within 30 days of the GM date.
          </div>
        )}

        {/* Alternate Director extra fields */}
        {f.ndDesignation === "alternate_director" && (
          <>
            <Field label="Original Director's Name" req hint="Director in whose place the alternate is being appointed">
              <input value={f.ndOriginalDirector} onChange={up("ndOriginalDirector")} className={INPUT} placeholder="Name of director who will be absent" />
            </Field>
            <Field label="Original Director's DIN" hint="DIN of the director being substituted">
              <input value={f.ndOriginalDin} onChange={up("ndOriginalDin")} className={INPUT} placeholder="8-digit DIN" maxLength={8} />
            </Field>
          </>
        )}

        {/* Nominee Director extra field */}
        {f.ndDesignation === "nominee_director" && (
          <Field label="Nominating Institution / Body" req hint="Name of bank, FI, or body nominating this director">
            <input value={f.ndNominatingBody} onChange={up("ndNominatingBody")} className={INPUT} placeholder="e.g. State Bank of India, XYZ Capital Partners" />
          </Field>
        )}

        {/* MD / WTD term */}
        {(f.ndDesignation === "managing_director" || f.ndDesignation === "whole_time_director") && (
          <Field label="Term of Appointment (years)" req hint="Max 5 years; reappointment allowed before expiry">
            <select value={f.ndTermYears} onChange={up("ndTermYears")} className={SELECT}>
              <option value="1">1 Year</option>
              <option value="2">2 Years</option>
              <option value="3">3 Years</option>
              <option value="4">4 Years</option>
              <option value="5">5 Years (Maximum)</option>
            </select>
          </Field>
        )}

        <Field label="Full Name" req><input value={f.ndName} onChange={up("ndName")} className={INPUT} placeholder="As per PAN / DIN records" /></Field>
        <Field label="Father's / Husband's Name" req hint="Required for DIR-2 and DIR-8">
          <input value={f.ndFatherName} onChange={up("ndFatherName")} className={INPUT} placeholder="Father's or Husband's full name" />
        </Field>
        <Field label="DIN" req hint="8-digit Director Identification Number">
          <input value={f.ndDin} onChange={up("ndDin")} className={INPUT} placeholder="e.g. 01234567" maxLength={8} />
        </Field>
        <Field label="Date of Birth"><input type="date" value={f.ndDob} onChange={up("ndDob")} className={INPUT} /></Field>
        <Field label="PAN"><input value={f.ndPan} onChange={up("ndPan")} className={INPUT} placeholder="e.g. ABCDE1234F" maxLength={10} /></Field>
        <Field label="Nationality"><input value={f.ndNationality} onChange={up("ndNationality")} className={INPUT} placeholder="e.g. Indian" /></Field>
        <Field label="Occupation"><input value={f.ndOccupation} onChange={up("ndOccupation")} className={INPUT} placeholder="e.g. Business, Professional" /></Field>
        <div />
        <Field label="Mobile"><input value={f.ndMobile} onChange={up("ndMobile")} className={INPUT} placeholder="10-digit mobile number" /></Field>
        <Field label="Email"><input value={f.ndEmail} onChange={up("ndEmail")} className={INPUT} placeholder="Email address" /></Field>
      </div>
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
        <p className="text-xs font-bold text-slate-600 mb-3">Residential Address (for DIR-2 & DIR-8)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="House / Flat / Street"><input value={f.ndAddress} onChange={up("ndAddress")} className={INPUT} placeholder="House no., street, locality" /></Field>
          <Field label="City"><input value={f.ndCity} onChange={up("ndCity")} className={INPUT} /></Field>
          <Field label="State"><input value={f.ndState} onChange={up("ndState")} className={INPUT} /></Field>
          <Field label="PIN Code"><input value={f.ndPincode} onChange={up("ndPincode")} className={INPUT} maxLength={6} /></Field>
        </div>
      </div>
      <NavButtons step={step} setStep={s => setStep(s as typeof step)} maxStep={5} canProceed={canStep4}
        onGenerate={() => setStep(5)} />
    </div>
  );

  /* ── STEP 5: Document Package ── */
  const s5 = (
    <div className="space-y-5">
      <SHead n={5} title="Complete Document Package" sub="All 5 documents ready to print. Click any document to preview, then Print." />

      {/* Package summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {(Object.entries(docMap) as [string, { label: string; emoji: string }][]).map(([key, d]) => (
          <button key={key}
            onClick={() => setActiveDoc(key as typeof activeDoc)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${activeDoc === key ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
            <span className="text-2xl">{d.emoji}</span>
            <span className={`text-xs font-bold leading-tight ${activeDoc === key ? "text-blue-700" : "text-slate-600"}`}>{d.label}</span>
          </button>
        ))}
      </div>

      {/* Document preview */}
      <div className="border-2 border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-lg">{docMap[activeDoc].emoji}</span>
            <span className="text-sm font-bold text-slate-800">{docMap[activeDoc].label}</span>
          </div>
          <button
            onClick={() => openPrint(docMap[activeDoc].gen())}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
            🖨️ Print / Download
          </button>
        </div>
        <div className="bg-white p-4 max-h-[500px] overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: docMap[activeDoc].gen()
            .replace(/<!DOCTYPE html>[\s\S]*?<body[^>]*>/, "")
            .replace(/<\/body>[\s\S]*?<\/html>/, "")
            .replace(/<style>[\s\S]*?<\/style>/g, "")
            .replace(/<div class="page">/, '<div style="font-family:Times New Roman,serif;font-size:12pt;line-height:1.8;color:#000;padding:4px 8px;">') }} />
      </div>

      {/* Print all */}
      <div className="flex flex-col sm:flex-row gap-3">
        {(Object.entries(docMap) as [string, { label: string; emoji: string; gen: () => string }][]).map(([key, d]) => (
          <button key={key} onClick={() => openPrint(d.gen())}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold border-2 border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-all flex items-center justify-center gap-1.5">
            {d.emoji} Print {d.label}
          </button>
        ))}
      </div>

      {/* Info box */}
      {f.ndDesignation === "additional_director" && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-sm text-amber-800">
          <strong>📌 Reminder:</strong> Additional Director holds office till the next AGM. Remember to regularize {f.ndName || "this director"} as a permanent Director by passing an Ordinary Resolution at the next AGM under Section 152, and file DIR-12 again within 30 days.
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <button onClick={() => setStep(4)} className="px-5 py-2.5 rounded-xl text-sm font-bold border-2 border-slate-200 text-slate-600 hover:bg-slate-50">← Edit Details</button>
        <button onClick={() => { setF({ ...DEFAULT }); setStep(1); localStorage.removeItem(DRAFT_KEY); }}
          className="px-5 py-2.5 rounded-xl text-sm font-bold border-2 border-slate-200 text-slate-500 hover:bg-slate-50">
          🔄 New Appointment
        </button>
      </div>
    </div>
  );

  const stepContent = { 1: s1, 2: s2, 3: s3, 4: s4, 5: s5 };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 py-6 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
            <Link href="/tools/corporate-action-kit" className="hover:text-blue-600 font-semibold">Corporate Action Kit</Link>
            <span>›</span>
            <span className="text-slate-700 font-bold">Director Appointment</span>
          </div>

          {/* Header */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#1d4ed8,#1e40af)" }}>👤</div>
              <div>
                <h1 className="text-lg font-extrabold text-slate-900">Director Appointment Kit</h1>
                <p className="text-xs text-slate-500">Section 161(1) / 152 · Companies Act 2013 · Generates 5 documents + ROC guide</p>
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
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${done ? "bg-blue-600 border-blue-600 text-white" : active ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-300 text-slate-400"}`}>
                        {done ? "✓" : n}
                      </div>
                      <span className={`text-xs mt-1 font-semibold hidden sm:block ${active ? "text-blue-700" : done ? "text-slate-600" : "text-slate-400"}`}>{s}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 ${n < step ? "bg-blue-500" : "bg-slate-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step content */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            {stepContent[step]}
          </div>

          {/* Draft saved indicator */}
          <p className="text-center text-xs text-slate-400 mt-3">Draft auto-saved to browser · No account needed</p>
        </div>
      </main>
    </>
  );
}
