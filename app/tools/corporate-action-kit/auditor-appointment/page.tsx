"use client";
import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import CompanySearch from "@/components/CompanySearch";
import CompanyExcelUpload from "@/components/CompanyExcelUpload";
import type { CompanyData } from "@/lib/types/company";
import { injectPreviewWatermark } from "@/lib/preview-protection";
import { useSession } from "next-auth/react";

/* ═══════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════ */
type AppointmentType = "first_auditor" | "subsequent" | "casual_vacancy";
type AuditorType = "individual" | "firm";
type VacancyReason = "resignation" | "other";

interface MeetingDirector {
  id: string;
  name: string;
  din: string;
  designation: string;
  isPresent: boolean;
}

interface DocEntry {
  key: string;
  label: string;
  emoji: string;
  gen: (withLH: boolean) => string;
  auditorDoc?: boolean;
}

interface SavedAuditor {
  id: string;
  firmName: string;
  frn: string;
  partnerName: string;
  membershipNo: string;
  place: string | null;
  auditorType: string | null;
  auditorAddress: string | null;
  auditorCity: string | null;
  auditorEmail: string | null;
  auditorMobile: string | null;
  appointmentType: string | null;
  agmFrom: string | null;
  agmTo: string | null;
  fyRange: string | null;
  remuneration: string | null;
  partnerDesignation: string | null;
  cin: string | null;
}

interface F {
  companyName: string;
  cin: string;
  regAddress: string;
  entityType: string;
  companyEmail: string;
  companyMobile: string;
  incorporationDate: string;
  fy: string;
  appointmentType: AppointmentType;
  auditorType: AuditorType;
  auditorName: string;
  membershipNo: string;
  firmName: string;
  firmRegNo: string;
  partnerName: string;
  partnerMembershipNo: string;
  partnerDesignation: string;
  auditorAddress: string;
  auditorCity: string;
  auditorEmail: string;
  auditorMobile: string;
  remuneration: string;
  agmOrdinal: string;
  meetingDate: string;
  meetingTime: string;
  meetingSerial: string;
  venue: string;
  boardRecommDate: string;
  chairmanName: string;
  chairmanDin: string;
  directors: MeetingDirector[];
  vacancyReason: VacancyReason;
  previousAuditorName: string;
  vacancyDate: string;
}

function makeDir(): MeetingDirector {
  return {
    id: `dir-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "", din: "", designation: "Director", isPresent: true,
  };
}

const DEFAULT: F = {
  companyName: "", cin: "", regAddress: "", entityType: "pvt_ltd",
  companyEmail: "", companyMobile: "",
  incorporationDate: "", fy: "",
  appointmentType: "first_auditor",
  auditorType: "firm",
  auditorName: "", membershipNo: "",
  firmName: "", firmRegNo: "", partnerName: "", partnerMembershipNo: "", partnerDesignation: "Partner",
  auditorAddress: "", auditorCity: "", auditorEmail: "", auditorMobile: "",
  remuneration: "",
  agmOrdinal: "1st",
  meetingDate: "", meetingTime: "", meetingSerial: "", venue: "",
  boardRecommDate: "",
  chairmanName: "", chairmanDin: "",
  directors: [makeDir(), makeDir()],
  vacancyReason: "resignation", previousAuditorName: "", vacancyDate: "",
};

/* ═══════════════════════════════════════════════
   STEPS
═══════════════════════════════════════════════ */
const AUDIT_STEPS = [
  { id: 1, label: "Company", desc: "Company name, CIN, address, contact" },
  { id: 2, label: "Appointment Type", desc: "First auditor, subsequent appointment, or casual vacancy" },
  { id: 3, label: "Auditor Details", desc: "Auditor or firm name, membership number, address" },
  { id: 4, label: "Meeting & Attendance", desc: "Meeting date, serial, chairman, directors present" },
  { id: 5, label: "Documents", desc: "Preview, print, and download all documents" },
];

/* ═══════════════════════════════════════════════
   SHARED DOC CSS
═══════════════════════════════════════════════ */
const DOC_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.65; color: #000; background: #fff; padding: 40px 50px; }
  h1 { font-size: 15pt; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  h2 { font-size: 13pt; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 4px; }
  h3 { font-size: 12.5pt; font-weight: bold; margin-bottom: 8px; text-transform: uppercase; }
  .center { text-align: center; }
  .right { text-align: right; }
  .section { margin: 18px 0; }
  .para { margin: 10px 0; text-align: justify; }
  .bold { font-weight: bold; }
  .italic { font-style: italic; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  td, th { border: 1px solid #000; padding: 6px 10px; vertical-align: top; font-size: 12pt; }
  th { background: #f0f0f0; font-weight: bold; }
  .no-border td, .no-border th { border: none; padding: 4px 0; }
  .sig-block { margin-top: 40px; }
  hr { border: none; border-top: 1px solid #000; margin: 14px 0; }
  .double-hr { border: none; border-top: 3px double #000; margin: 14px 0; }
  .indent { padding-left: 30px; }
  .box { border: 1px solid #000; padding: 12px 16px; margin: 12px 0; }
  .warning-box { border: 2px solid #b91c1c; padding: 12px 16px; margin: 12px 0; background: #fff8f8; }
  .info-box { border: 1px solid #0d9488; padding: 12px 16px; margin: 12px 0; background: #f0fdfa; }
  ol { padding-left: 28px; margin: 8px 0; }
  ol li { margin: 5px 0; }
  ul { padding-left: 28px; margin: 8px 0; }
  ul li { margin: 5px 0; }
  .lh-block { text-align: center; border-bottom: 3px double #000; padding-bottom: 14px; margin-bottom: 20px; }
  .lh-block h1 { font-size: 18pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .lh-block p { font-size: 10.5pt; margin: 3px 0; }
  @media print { body { padding: 20px 30px; } }
`;

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
function fmtDate(s: string): string {
  if (!s) return "___________";
  return new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtDay(s: string): string {
  if (!s) return "___________";
  return new Date(s).toLocaleDateString("en-IN", { weekday: "long" });
}

function addDays(s: string, n: number): string {
  if (!s) return "___________";
  const d = new Date(s);
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

function subDays(s: string, n: number): string {
  if (!s) return "___________";
  const d = new Date(s);
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

function fyRange(dateStr: string): string {
  if (!dateStr) return "FY ____-__ to FY ____-__";
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const startYear = month <= 3 ? year - 1 : year;
  const fmt = (y: number) => `${y}-${String(y + 1).slice(-2)}`;
  return `FY ${fmt(startYear)} to FY ${fmt(startYear + 4)}`;
}

function auditorLabel(f: F): string {
  if (f.auditorType === "firm") {
    return `M/s. ${f.firmName || "[FIRM NAME]"}, Chartered Accountants (FRN: ${f.firmRegNo || "[FRN]"})`;
  }
  return `${f.auditorName || "[AUDITOR NAME]"}, Chartered Accountant (Membership No. ${f.membershipNo || "[M.No.]"})`;
}

function apptTypeLabel(t: AppointmentType): string {
  if (t === "first_auditor") return "First Auditor";
  if (t === "subsequent") return "Subsequent Auditor (AGM)";
  return "Casual Vacancy";
}

function secRef(t: AppointmentType): string {
  if (t === "first_auditor") return "Section 139(6)";
  if (t === "subsequent") return "Section 139(1)";
  return "Section 139(8)";
}

function sixthAgm(ordinal: string): string {
  const m = ordinal.match(/^(\d+)/);
  if (!m) return "[6th]";
  const n = parseInt(m[1]) + 5;
  const suf = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
  return `${n}${suf}`;
}

function ordinal(n: number): string {
  if (n === 1) return "1st"; if (n === 2) return "2nd"; if (n === 3) return "3rd";
  return `${n}th`;
}

function calcAgmOrdinal(incorporationDate: string, fy: string): string {
  if (!incorporationDate || !fy) return "";
  const parts = fy.split("-");
  if (parts.length < 2) return "";
  const fyEndYear = parseInt(parts[0]) + 1;
  if (isNaN(fyEndYear)) return "";
  const inc = new Date(incorporationDate);
  if (isNaN(inc.getTime())) return "";
  const incMonth = inc.getMonth() + 1;
  const incYear = inc.getFullYear();
  // First FY ends: if inc is Jan-Mar → same year March; Apr-Dec → next year March
  const firstFYEnd = incMonth <= 3 ? incYear : incYear + 1;
  const agmNum = fyEndYear - firstFYEnd + 1;
  return agmNum >= 1 ? ordinal(agmNum) : "1st";
}

function suggestAppointmentType(incorporationDate: string): AppointmentType | null {
  if (!incorporationDate) return null;
  const inc = new Date(incorporationDate);
  if (isNaN(inc.getTime())) return null;
  const days = (Date.now() - inc.getTime()) / 86400000;
  return days <= 45 ? "first_auditor" : "subsequent";
}

function companyLH(f: F): string {
  return `<div class="lh-block">
<h1>${f.companyName || "[COMPANY NAME]"}</h1>
${f.cin ? `<p>CIN: ${f.cin}</p>` : ""}
<p>${f.regAddress || "[Registered Address]"}</p>
${(f.companyMobile || f.companyEmail) ? `<p>${f.companyMobile ? `Tel: ${f.companyMobile}` : ""}${f.companyMobile && f.companyEmail ? " | " : ""}${f.companyEmail ? `Email: ${f.companyEmail}` : ""}</p>` : ""}
</div>`;
}

function auditorLH(f: F): string {
  const name = f.auditorType === "firm" ? `M/s. ${f.firmName || "[FIRM NAME]"}` : `${f.auditorName || "[CA NAME]"}`;
  const regNo = f.auditorType === "firm" ? `FRN: ${f.firmRegNo || "[FRN]"}` : `M.No. ${f.membershipNo || "[M.No.]"}`;
  return `<div class="lh-block">
<h1>${name}</h1>
<p>Chartered Accountant${f.auditorType === "firm" ? "s" : ""} | ${regNo}</p>
${f.auditorAddress ? `<p>${f.auditorAddress}${f.auditorCity ? `, ${f.auditorCity}` : ""}</p>` : ""}
${(f.auditorMobile || f.auditorEmail) ? `<p>${f.auditorMobile ? `Tel: ${f.auditorMobile}` : ""}${f.auditorMobile && f.auditorEmail ? " | " : ""}${f.auditorEmail ? `Email: ${f.auditorEmail}` : ""}</p>` : ""}
</div>`;
}

function plainHeader(f: F): string {
  return `<h2>${f.companyName || "[COMPANY NAME]"}</h2>
<p class="center">${f.cin ? `CIN: ${f.cin}` : ""}</p>
<p class="center">${f.regAddress || "[Registered Address]"}</p>
<hr/>`;
}

function twoSigBlock(f: F, date?: string, label?: string): string {
  const dirs = f.directors.filter(d => d.isPresent);
  const d1 = dirs[0];
  const d2 = dirs[1];
  const useDate = date || fmtDate(f.meetingDate);
  return `<div class="sig-block">
${label !== "" ? `<p class="bold">${label ?? "Certified True Copy"}</p><p>For <strong>${f.companyName || "[COMPANY NAME]"}</strong></p>` : ""}
<table class="no-border" style="margin-top:40px;">
<tr>
<td style="width:50%; vertical-align:top;">
<p>_______________________</p>
<p><strong>${d1?.name || "[DIRECTOR 1]"}</strong></p>
<p>${d1?.designation || "Director"}</p>
<p>DIN: ${d1?.din || "[DIN]"}</p>
</td>
<td style="width:50%; vertical-align:top; text-align:right;">
<p>_______________________</p>
<p><strong>${d2?.name || "[DIRECTOR 2]"}</strong></p>
<p>${d2?.designation || "Director"}</p>
<p>DIN: ${d2?.din || "[DIN]"}</p>
</td>
</tr>
</table>
<p style="margin-top:10px; font-size:11pt;">Place: ${f.venue || "[PLACE]"}<br/>Date: ${useDate}</p>
</div>`;
}

/* ═══════════════════════════════════════════════
   DOCUMENT GENERATORS
═══════════════════════════════════════════════ */

/* 1 — Proposal Letter (company to auditor, before AGM) */
function genProposalLetter(f: F, withLH: boolean): string {
  const isFirst = f.appointmentType === "first_auditor";
  const propDate = f.boardRecommDate || f.meetingDate;
  const dirs = f.directors.filter(d => d.isPresent);
  const sigDir = dirs[0];

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Proposal Letter — Auditor</title><style>${DOC_CSS}</style></head><body>
${withLH ? companyLH(f) : plainHeader(f)}

<p class="right">Date: ${fmtDate(propDate)}</p>

<p>To,<br/>
${f.auditorType === "firm"
  ? `<strong>${f.firmName || "[FIRM NAME]"}</strong><br/>Chartered Accountants<br/>FRN: ${f.firmRegNo || "[FRN]"}<br/>${f.auditorAddress || "[Address]"}${f.auditorCity ? `, ${f.auditorCity}` : ""}`
  : `<strong>${f.auditorName || "[AUDITOR NAME]"}</strong><br/>Chartered Accountant<br/>M.No. ${f.membershipNo || "[M.No.]"}<br/>${f.auditorAddress || "[Address]"}${f.auditorCity ? `, ${f.auditorCity}` : ""}`}
</p>

<p class="para"><strong>Sub: Proposal for ${isFirst ? "appointment" : "re-appointment"} as Statutory Auditor${f.auditorType === "firm" ? "s" : ""} — ${f.companyName || "[COMPANY NAME]"}</strong></p>

<p class="para">Dear Sir/Madam,</p>

<p class="para">The company is planning to hold ${isFirst ? "a Board Meeting" : `the ${f.agmOrdinal || "[X]"} Annual General Meeting`} on <strong>${fmtDate(f.meetingDate)}</strong> and in accordance with the provisions of <strong>${secRef(f.appointmentType)}</strong> of the Companies Act, 2013, we need your consent and certificate under <strong>Section 141</strong> of the Companies Act, 2013.</p>

<p class="para">Kindly furnish the following at the earliest:</p>
<ol>
<li>Written consent to be appointed as Statutory Auditor of <strong>${f.companyName || "[COMPANY NAME]"}</strong></li>
<li>Certificate of eligibility under Section 141 confirming that the appointment is within the limits under Section 141(3)(g) and that you are not disqualified under Section 141 of the Act</li>
</ol>

<p class="para">Please note that the said documents should reach us before the ${isFirst ? "Board Meeting" : "Annual General Meeting"}.</p>

<p class="para">Thanking You,</p>
<p class="para">Yours faithfully,<br/>For <strong>${f.companyName || "[COMPANY NAME]"}</strong></p>

<div class="sig-block">
<p style="margin-top:50px;">_______________________<br/><strong>${sigDir?.name || f.chairmanName || "[DIRECTOR NAME]"}</strong><br/>${sigDir?.designation || "Director"}<br/>DIN: ${sigDir?.din || f.chairmanDin || "[DIN]"}</p>
<p style="margin-top:8px; font-size:11pt;">${f.regAddress || "[Address]"}</p>
</div>
</body></html>`;
}

/* 2 — Board Notice (First Auditor / Casual Vacancy) */
function genBoardNotice(f: F, withLH: boolean): string {
  const isFirst = f.appointmentType === "first_auditor";

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Board Notice — Auditor</title><style>${DOC_CSS}</style></head><body>
${withLH ? companyLH(f) : plainHeader(f)}
<h3 class="center">NOTICE OF MEETING OF THE BOARD OF DIRECTORS</h3>
<p class="center italic">Pursuant to Section 173 of the Companies Act, 2013 and Secretarial Standard-1 (SS-1)</p>

<div class="section">
<p class="para">Date of Notice: ${subDays(f.meetingDate, 7)}</p>
<p class="para">To,<br/>All the Directors,<br/><strong>${f.companyName || "[COMPANY NAME]"}</strong></p>
<p class="para">Dear Director(s),</p>
<p class="para">Notice is hereby given that a Meeting of the Board of Directors of <strong>${f.companyName || "[COMPANY NAME]"}</strong> is scheduled to be held on <strong>${fmtDate(f.meetingDate)} (${fmtDay(f.meetingDate)})</strong> at <strong>${f.meetingTime || "[TIME]"}</strong> at <strong>${f.venue || "[VENUE]"}</strong> to transact the following business:</p>
</div>

<div class="section">
<h3>AGENDA</h3>
<table>
<thead><tr><th style="width:8%">Item</th><th>Business</th><th style="width:22%">Type</th><th style="width:22%">Section</th></tr></thead>
<tbody>
<tr><td>1.</td><td>To take note of directors present and confirm quorum.</td><td>Procedural</td><td>Sec 174 / SS-1</td></tr>
<tr><td>2.</td><td>To confirm the minutes of the previous Board Meeting.</td><td>Procedural</td><td>SS-1 Para 7.3</td></tr>
${isFirst
  ? `<tr><td>3.</td><td><strong>Appointment of First Statutory Auditor</strong> — To appoint the First Auditor pursuant to Section 139(6) and to fix remuneration pursuant to Section 142.</td><td>Board Resolution</td><td>Sec 139(6) + 142</td></tr>`
  : `<tr><td>3.</td><td><strong>Filling of Casual Vacancy — Statutory Auditor</strong> — To appoint an auditor to fill the casual vacancy caused by the ${f.vacancyReason === "resignation" ? `resignation of ${f.previousAuditorName || "[PREVIOUS AUDITOR]"}` : "occurrence of a casual vacancy"} pursuant to Section 139(8), to hold office until the next AGM.</td><td>Board Resolution</td><td>Sec 139(8)</td></tr>`}
<tr><td>4.</td><td>Any other matter with the permission of the Chair.</td><td>Procedural</td><td>—</td></tr>
</tbody>
</table>
</div>

<div class="section">
<p class="bold">NOTES:</p>
<ol>
<li>This notice is issued at least 7 clear days prior to the meeting in compliance with Section 173(3) and SS-1.</li>
<li>The written consent and certificate of eligibility of the proposed auditor under Rule 4(1) is attached for the Board's consideration.</li>
${!isFirst && f.vacancyReason === "resignation" ? `<li><strong>Important:</strong> The Board appointment is subject to ratification by members at a General Meeting to be convened within 3 months [Section 139(8)].</li>` : ""}
</ol>
</div>

<div class="sig-block">
<p>By Order of the Board of Directors,<br/>For <strong>${f.companyName || "[COMPANY NAME]"}</strong></p>
<p style="margin-top:50px;">_______________________<br/>${f.chairmanName || "[DIRECTOR / CS NAME]"}<br/>Director / Company Secretary</p>
<p style="margin-top:8px; font-size:11pt;">Place: ${f.venue || "[CITY]"}<br/>Date: ${subDays(f.meetingDate, 7)}</p>
</div>
</body></html>`;
}

/* 3 — Board Resolution CTC (First Auditor / Casual Vacancy) */
function genBoardCTC(f: F, withLH: boolean): string {
  const isFirst = f.appointmentType === "first_auditor";
  const isCasual = f.appointmentType === "casual_vacancy";
  const presentDirs = f.directors.filter(d => d.isPresent);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Board Resolution CTC — Auditor Appointment</title><style>${DOC_CSS}</style></head><body>
${withLH ? companyLH(f) : plainHeader(f)}
<h3 class="center">CERTIFIED TRUE COPY OF RESOLUTION(S)</h3>
<p class="center">Passed at the Meeting of the Board of Directors</p>

<div class="section">
<table class="no-border">
<tr><td style="width:35%"><strong>Date of Meeting:</strong></td><td>${fmtDate(f.meetingDate)} (${fmtDay(f.meetingDate)})</td></tr>
<tr><td><strong>Time:</strong></td><td>${f.meetingTime || "[TIME]"}</td></tr>
<tr><td><strong>Venue:</strong></td><td>${f.venue || "[VENUE]"}</td></tr>
<tr><td><strong>Meeting Serial No.:</strong></td><td>${f.meetingSerial || "[SERIAL]"}</td></tr>
<tr><td><strong>Chairman:</strong></td><td>${f.chairmanName || "[CHAIRMAN]"} (DIN: ${f.chairmanDin || "[DIN]"})</td></tr>
</table>
</div>

<div class="section">
<p class="bold">DIRECTORS PRESENT:</p>
${presentDirs.length > 0
  ? `<table><thead><tr><th style="width:8%">S.No.</th><th>Name</th><th>DIN</th><th>Designation</th></tr></thead><tbody>${presentDirs.map((d, i) => `<tr><td>${i + 1}.</td><td>${d.name || "[NAME]"}</td><td>${d.din || "[DIN]"}</td><td>${d.designation}</td></tr>`).join("")}</tbody></table>`
  : `<p class="italic">[Directors present — please fill]</p>`}
</div>

<div class="section">
<p class="para">The Chairman confirmed that requisite quorum as per Section 174 was present and declared the meeting duly convened.</p>
${isCasual ? `<p class="para">The Chairman placed before the Board that a casual vacancy has arisen in the office of the Statutory Auditor${f.vacancyReason === "resignation" ? ` due to the resignation of ${f.previousAuditorName || "[PREVIOUS AUDITOR]"} vide resignation letter dated ${fmtDate(f.vacancyDate)}` : ""}. The Board noted the same and, pursuant to Section 139(8), proceeded to fill the vacancy within the prescribed period of thirty days.</p>` : ""}
${isFirst ? `<p class="para">The Chairman informed the Board that pursuant to Section 139(6), the Board is required to appoint the First Auditor within thirty days from the date of incorporation. The Board reviewed the written consent and eligibility certificate from the proposed auditor and proceeded to consider the appointment.</p>` : ""}
</div>

<div class="section">
<h3>${isFirst ? "RESOLUTION: APPOINTMENT OF FIRST STATUTORY AUDITOR" : "RESOLUTION: FILLING OF CASUAL VACANCY — STATUTORY AUDITOR"}</h3>
${isFirst ? `
<p class="para"><strong>"RESOLVED THAT</strong> pursuant to Section 139(6) read with Section 142 and other applicable provisions of the Companies Act, 2013, ${auditorLabel(f)}, who ${f.auditorType === "firm" ? "have" : "has"} given written consent and furnished a certificate confirming eligibility under Section 141 of the Act, be and ${f.auditorType === "firm" ? "are" : "is"} hereby appointed as the <strong>First Statutory Auditor</strong> of the Company, to hold office from the date of this meeting <strong>until the conclusion of the First Annual General Meeting</strong> of the Company, at a remuneration of ${f.remuneration ? `<strong>Rs. ${f.remuneration}</strong> per annum, exclusive of applicable GST and reimbursement of out-of-pocket expenses` : "[REMUNERATION — to be agreed]"}.</p>
<p class="para"><strong>RESOLVED FURTHER THAT</strong> any Director or the Company Secretary be and is hereby authorised to issue the formal Letter of Appointment to the Auditor, to file Form ADT-1 with the Registrar of Companies within fifteen days of this appointment, and to do all such acts as may be required to give effect to this resolution."</p>
` : `
<p class="para"><strong>"RESOLVED THAT</strong> pursuant to Section 139(8) and other applicable provisions of the Companies Act, 2013, ${auditorLabel(f)}, who ${f.auditorType === "firm" ? "have" : "has"} given written consent and furnished a certificate confirming eligibility under Section 141, be and ${f.auditorType === "firm" ? "are" : "is"} hereby appointed as Statutory Auditor to fill the casual vacancy, to hold office until the conclusion of the <strong>next Annual General Meeting</strong> of the Company, at a remuneration of ${f.remuneration ? `<strong>Rs. ${f.remuneration}</strong> per annum, exclusive of applicable GST` : "[REMUNERATION — to be agreed]"}${f.vacancyReason === "resignation" ? ", subject to ratification by members at a General Meeting to be convened within three months of this recommendation [Section 139(8)]" : ""}.</p>
<p class="para"><strong>RESOLVED FURTHER THAT</strong> any Director or the Company Secretary be and is hereby authorised to: (a) issue the Letter of Appointment; (b) ${f.vacancyReason === "resignation" ? "convene the requisite General Meeting for ratification and thereafter " : ""}file Form ADT-1 within fifteen days of ${f.vacancyReason === "resignation" ? "the General Meeting" : "this meeting"}; and (c) do all acts as may be required."</p>
`}
</div>

<div class="section">
<p class="para">The resolution was proposed, seconded and passed with requisite majority. The Chairman declared the resolution duly carried.</p>
</div>

${twoSigBlock(f)}
</body></html>`;
}

/* 4 — Board Resolution Recommending Appointment to AGM (Subsequent only) */
function genBoardRecommAGM(f: F, withLH: boolean): string {
  const agm = f.agmOrdinal || "1st";
  const sixth = sixthAgm(agm);
  const presentDirs = f.directors.filter(d => d.isPresent);
  const recommDate = f.boardRecommDate || f.meetingDate;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Board Resolution — Recommending Auditor to AGM</title><style>${DOC_CSS}</style></head><body>
${withLH ? companyLH(f) : plainHeader(f)}
<h3 class="center">CERTIFIED TRUE COPY OF RESOLUTION</h3>
<p class="center">Passed at the Meeting of the Board of Directors</p>

<div class="section">
<table class="no-border">
<tr><td style="width:35%"><strong>Date of Meeting:</strong></td><td>${fmtDate(recommDate)} (${fmtDay(recommDate)})</td></tr>
<tr><td><strong>Venue:</strong></td><td>${f.venue || "[VENUE]"}</td></tr>
<tr><td><strong>Chairman:</strong></td><td>${f.chairmanName || "[CHAIRMAN]"} (DIN: ${f.chairmanDin || "[DIN]"})</td></tr>
</table>
</div>

<div class="section">
<p class="bold">DIRECTORS PRESENT:</p>
${presentDirs.length > 0
  ? `<table><thead><tr><th style="width:8%">S.No.</th><th>Name</th><th>DIN</th><th>Designation</th></tr></thead><tbody>${presentDirs.map((d, i) => `<tr><td>${i + 1}.</td><td>${d.name || "[NAME]"}</td><td>${d.din || "[DIN]"}</td><td>${d.designation}</td></tr>`).join("")}</tbody></table>`
  : `<p class="italic">[Directors present]</p>`}
</div>

<div class="section">
<p class="para">The Chairman informed the Board that pursuant to Section 139(1) of the Companies Act, 2013, the existing Statutory Auditor's term is coming to a close and the Company is required to appoint a Statutory Auditor at the ${agm} Annual General Meeting. The Board reviewed the written consent and eligibility certificate received from ${auditorLabel(f)} and proceeded to recommend the appointment.</p>
</div>

<div class="section">
<h3>RESOLUTION: RECOMMENDATION FOR APPOINTMENT OF STATUTORY AUDITOR AT AGM</h3>
<div class="box">
<p class="para"><strong>"RESOLVED THAT</strong> pursuant to the provisions of Section 139(1) read with Section 142 and other applicable provisions of the Companies Act, 2013 and the Companies (Audit and Auditors) Rules, 2014, the consent of the Board be and is hereby accorded to recommend <strong>${auditorLabel(f)}</strong>, who ${f.auditorType === "firm" ? "have" : "has"} given written consent and furnished a certificate of eligibility under Section 141 of the Act, for appointment as <strong>Statutory Auditor${f.auditorType === "firm" ? "s" : ""}</strong> of the Company for a term of <strong>five consecutive years</strong> from the conclusion of the <strong>${agm} Annual General Meeting</strong> until the conclusion of the <strong>${sixth} Annual General Meeting</strong>, at such remuneration as may be fixed by the Board in consultation with the Auditors, subject to the approval of the members at the ensuing Annual General Meeting.</p>
<p class="para"><strong>RESOLVED FURTHER THAT</strong> any Director or the Company Secretary be and is hereby authorised to include the necessary item in the Notice of the ${agm} Annual General Meeting and to do all acts, deeds and things as may be required to give effect to this resolution."</p>
</div>
</div>

<div class="section">
<p class="para">The resolution was proposed, seconded and passed with requisite majority. The Chairman declared the resolution duly carried.</p>
</div>

${twoSigBlock(f, fmtDate(recommDate))}
</body></html>`;
}

/* 5 — AGM Notice (Subsequent Auditor) */
function genAGMNotice(f: F, withLH: boolean): string {
  const agm = f.agmOrdinal || "1st";
  const sixth = sixthAgm(agm);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>AGM Notice — Auditor Appointment</title><style>${DOC_CSS}</style></head><body>
${withLH ? companyLH(f) : plainHeader(f)}
<h3 class="center">NOTICE OF THE ${agm.toUpperCase()} ANNUAL GENERAL MEETING</h3>
<p class="center italic">Pursuant to Sections 96, 101, 102 and 139 of the Companies Act, 2013</p>

<div class="section">
<p class="para">Date of Notice: ${subDays(f.meetingDate, 21)}</p>
<p class="para">To,<br/>All Members / Shareholders,<br/><strong>${f.companyName || "[COMPANY NAME]"}</strong></p>
<p class="para">Dear Member(s),</p>
<p class="para">Notice is hereby given that the <strong>${agm} Annual General Meeting</strong> of the members of <strong>${f.companyName || "[COMPANY NAME]"}</strong> will be held on <strong>${fmtDate(f.meetingDate)} (${fmtDay(f.meetingDate)})</strong> at <strong>${f.meetingTime || "[TIME]"}</strong> at <strong>${f.venue || "[VENUE]"}</strong> to transact the following business:</p>
</div>

<div class="section">
<h3>ORDINARY BUSINESS</h3>
<p class="para"><strong>Item 1:</strong> To receive, consider, and adopt the Audited Financial Statements for the financial year ended March 31, _____ together with the Reports of the Board of Directors and Auditors thereon.</p>
</div>

<div class="section">
<h3>SPECIAL BUSINESS</h3>
<p class="para"><strong>Item 2: Appointment of Statutory Auditor</strong></p>
<p class="para">To consider and, if thought fit, to pass the following as an <strong>Ordinary Resolution</strong>:</p>
<div class="box">
<p class="para"><strong>"RESOLVED THAT</strong> pursuant to Section 139(1), Section 142 and other applicable provisions of the Companies Act, 2013 read with the Companies (Audit and Auditors) Rules, 2014, ${auditorLabel(f)}, who ${f.auditorType === "firm" ? "have" : "has"} given written consent and furnished a certificate under Rule 4(1) confirming eligibility under Section 141, be and ${f.auditorType === "firm" ? "are" : "is"} hereby appointed as the <strong>Statutory Auditor${f.auditorType === "firm" ? "s" : ""}</strong> of the Company, to hold office for a term of <strong>five consecutive years</strong> from the conclusion of this <strong>${agm} Annual General Meeting</strong> until the conclusion of the <strong>${sixth} Annual General Meeting</strong>, at such remuneration${f.remuneration ? ` of Rs. ${f.remuneration} per annum,` : ""} as shall be fixed by the Board in consultation with the Auditors.</p>
<p class="para"><strong>RESOLVED FURTHER THAT</strong> the Board of Directors be and is hereby authorised to file Form ADT-1 with the Registrar of Companies within fifteen days, to issue the Letter of Appointment, and to do all such acts as may be required to give effect to this resolution."</p>
</div>
<div class="info-box" style="margin-top:10px;">
<p style="font-size:11pt;"><em>Note: This appointment is for a five-year term. No annual ratification at subsequent AGMs is required [Companies (Amendment) Act, 2017].</em></p>
</div>
</div>

<div class="section">
<h3>EXPLANATORY STATEMENT</h3>
<p class="italic" style="font-size:11pt;">(Pursuant to Section 102(1) of the Companies Act, 2013)</p>
<p class="para">${auditorLabel(f)} has given written consent and furnished a certificate confirming eligibility. The Board of Directors recommends the Ordinary Resolution at Item No. 2 for approval by the Members.</p>
<p class="para"><strong>None of the Directors or KMPs are concerned or interested, financially or otherwise, in this resolution.</strong></p>
</div>

<div class="sig-block">
<p>By Order of the Board of Directors,<br/>For <strong>${f.companyName || "[COMPANY NAME]"}</strong></p>
<p style="margin-top:50px;">_______________________<br/>${f.chairmanName || "[DIRECTOR / CS NAME]"}<br/>Director / Company Secretary<br/>DIN: ${f.chairmanDin || "[DIN]"}</p>
<p style="margin-top:8px; font-size:11pt;">Place: ${f.venue || "[CITY]"}<br/>Date: ${subDays(f.meetingDate, 21)}</p>
</div>
</body></html>`;
}

/* 6 — AGM Resolution CTC (Subsequent Auditor) */
function genAGMCTC(f: F, withLH: boolean): string {
  const agm = f.agmOrdinal || "1st";
  const sixth = sixthAgm(agm);
  const presentDirs = f.directors.filter(d => d.isPresent);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>AGM Resolution CTC — Auditor Appointment</title><style>${DOC_CSS}</style></head><body>
${withLH ? companyLH(f) : plainHeader(f)}
<h3 class="center">CERTIFIED TRUE COPY OF RESOLUTION</h3>
<p class="center">Passed at the ${agm} Annual General Meeting of the Members</p>

<div class="section">
<table class="no-border">
<tr><td style="width:35%"><strong>Date of AGM:</strong></td><td>${fmtDate(f.meetingDate)} (${fmtDay(f.meetingDate)})</td></tr>
<tr><td><strong>Time:</strong></td><td>${f.meetingTime || "[TIME]"}</td></tr>
<tr><td><strong>Venue:</strong></td><td>${f.venue || "[VENUE]"}</td></tr>
<tr><td><strong>AGM No.:</strong></td><td>${agm} AGM${f.meetingSerial ? ` / ${f.meetingSerial}` : ""}</td></tr>
<tr><td><strong>Chairman:</strong></td><td>${f.chairmanName || "[CHAIRMAN]"} (DIN: ${f.chairmanDin || "[DIN]"})</td></tr>
</table>
</div>

${presentDirs.length > 0 ? `<div class="section"><p class="bold">DIRECTORS PRESENT:</p><table><thead><tr><th style="width:8%">S.No.</th><th>Name</th><th>DIN</th><th>Designation</th></tr></thead><tbody>${presentDirs.map((d, i) => `<tr><td>${i + 1}.</td><td>${d.name || "[NAME]"}</td><td>${d.din || "[DIN]"}</td><td>${d.designation}</td></tr>`).join("")}</tbody></table></div>` : ""}

<div class="section">
<p class="para">The Chairman noted that due notice of the meeting had been given to all members and that requisite quorum was present. The Chairman presented the item relating to Appointment of Statutory Auditors. It was noted that ${auditorLabel(f)} has furnished the requisite written consent and certificate of eligibility. The Board of Directors had recommended this appointment at the Board meeting held on ${fmtDate(f.boardRecommDate || f.meetingDate)}. After due deliberation, the following resolution was put to vote and declared passed as an <strong>Ordinary Resolution</strong>:</p>
</div>

<div class="section">
<h3>ORDINARY RESOLUTION — APPOINTMENT OF STATUTORY AUDITOR</h3>
<div class="box">
<p class="para"><strong>"RESOLVED THAT</strong> pursuant to Section 139(1), Section 142 and other applicable provisions of the Companies Act, 2013 read with the Companies (Audit and Auditors) Rules, 2014, ${auditorLabel(f)}, who ${f.auditorType === "firm" ? "have" : "has"} given written consent and furnished a certificate under Rule 4(1) confirming eligibility under Section 141, be and ${f.auditorType === "firm" ? "are" : "is"} hereby appointed as the <strong>Statutory Auditor${f.auditorType === "firm" ? "s" : ""}</strong> of the Company, to hold office for a term of <strong>five consecutive years</strong> from the conclusion of this <strong>${agm} Annual General Meeting</strong> until the conclusion of the <strong>${sixth} Annual General Meeting</strong>, at such remuneration${f.remuneration ? ` of Rs. ${f.remuneration} per annum,` : ""} as shall be fixed by the Board in consultation with the Auditors.</p>
<p class="para"><strong>RESOLVED FURTHER THAT</strong> the Board of Directors be and is hereby authorised to file Form ADT-1 within fifteen days and to do all acts as may be required."</p>
</div>
<p class="italic para" style="font-size:11pt;">Note: No annual ratification at subsequent AGMs is required [Companies (Amendment) Act, 2017].</p>
</div>

${twoSigBlock(f)}
</body></html>`;
}

/* 7 — Eligibility Certificate (from auditor) */
function genEligibilityCert(f: F, withLH: boolean): string {
  const agm = f.agmOrdinal || "1st";
  const sixth = sixthAgm(agm);
  let tenureText = "";
  if (f.appointmentType === "first_auditor") tenureText = "until the conclusion of the First Annual General Meeting";
  else if (f.appointmentType === "subsequent") tenureText = `from the conclusion of the ${agm} AGM until the conclusion of the ${sixth} AGM`;
  else tenureText = "until the conclusion of the next Annual General Meeting";

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Certificate of Eligibility — Auditor</title><style>${DOC_CSS}</style></head><body>
${withLH ? auditorLH(f) : ""}
<h3 class="center">CERTIFICATE OF ELIGIBILITY</h3>
<p class="center italic">Under Section 141 of the Companies Act, 2013 read with Rule 4(1) of the Companies (Audit and Auditors) Rules, 2014</p>
${!withLH ? `<hr/>
<p class="right">
${f.auditorType === "firm"
  ? `<strong>${f.firmName || "[FIRM NAME]"}</strong><br/>Chartered Accountants (FRN: ${f.firmRegNo || "[FRN]"})<br/>${f.auditorAddress || "[Office Address]"}${f.auditorCity ? `, ${f.auditorCity}` : ""}<br/>${f.auditorMobile ? `Tel: ${f.auditorMobile}` : ""}${f.auditorEmail ? `<br/>Email: ${f.auditorEmail}` : ""}`
  : `<strong>${f.auditorName || "[AUDITOR NAME]"}</strong><br/>Chartered Accountant (M.No. ${f.membershipNo || "[M.No.]"})<br/>${f.auditorAddress || "[Address]"}${f.auditorCity ? `, ${f.auditorCity}` : ""}<br/>${f.auditorMobile ? `Tel: ${f.auditorMobile}` : ""}${f.auditorEmail ? `<br/>Email: ${f.auditorEmail}` : ""}`}
</p>` : ""}

<p>Date: _______________</p>

<p class="para">To,<br/>The Board of Directors,<br/><strong>${f.companyName || "[COMPANY NAME]"}</strong><br/>${f.regAddress || "[Registered Address]"}</p>

<p class="para"><strong>Subject: Certificate of Eligibility for Appointment as Statutory Auditor under ${secRef(f.appointmentType)}</strong></p>

<p class="para">Dear Sir(s)/Madam,</p>
<p class="para">I/We, ${auditorLabel(f)}, hereby certify that as on the date of this certificate:</p>

<div class="section">
<ol>
<li class="para"><strong>Valid Certificate of Practice:</strong> I am/We are a Chartered Accountant registered with the Institute of Chartered Accountants of India (ICAI) and hold a valid Certificate of Practice. [Section 141(1)]</li>
<li class="para"><strong>Not an Officer or Employee:</strong> I am not/None of our partners is an officer or employee of <strong>${f.companyName || "the Company"}</strong>, or a person who was an officer or employee of the Company within the preceding five (5) years. [Section 141(3)(b) and (c)]</li>
<li class="para"><strong>No Holding of Securities or Interest:</strong> Neither I/we, nor any of my/our relative(s) or partner(s), hold any security or interest in the Company, or its subsidiary, holding or associate company exceeding the limits prescribed under Rule 10 and Section 141(3)(d)(i). [Section 141(3)(d)]</li>
<li class="para"><strong>No Indebtedness or Guarantee:</strong> Neither I/we, nor any of my/our relative(s) or partner(s), are indebted to the Company or any related company in excess of Rs. 5,00,000/-, nor have given any guarantee in connection with the indebtedness of any third party to the Company in excess of Rs. 1,00,000/-. [Section 141(3)(d)(ii) and (iii)]</li>
<li class="para"><strong>Ceiling on Number of Audits [Section 141(3)(g)]:</strong> This appointment will <strong>not</strong> result in my/our holding more than twenty (20) audit appointments as computed under Section 141(3)(g) read with the Companies (Audit and Auditors) Rules, 2014. ${f.auditorType === "firm" ? "No individual partner of the firm holds such appointment in more than twenty (20) companies." : ""}</li>
</ol>
</div>

<p class="para">I/We confirm that all information stated above is true and correct to the best of my/our knowledge and belief. I/We undertake to inform the Company immediately if any condition changes during the tenure of appointment.</p>

<div class="sig-block">
${f.auditorType === "firm"
  ? `<p>For <strong>${f.firmName || "[FIRM NAME]"}</strong><br/>Chartered Accountants<br/>FRN: ${f.firmRegNo || "[FRN]"}</p><p style="margin-top:50px;">_______________________<br/><strong>${f.partnerName || "[PARTNER NAME]"}</strong><br/>${f.partnerDesignation || "Partner"}<br/>Membership No.: ${f.partnerMembershipNo || "[M.No.]"}</p>`
  : `<p style="margin-top:50px;">_______________________<br/><strong>${f.auditorName || "[AUDITOR NAME]"}</strong><br/>Chartered Accountant<br/>Membership No.: ${f.membershipNo || "[M.No.]"}</p>`}
<p style="margin-top:10px; font-size:11pt;">Place: ${f.auditorCity || "[PLACE]"}<br/>Date: _______________</p>
</div>
</body></html>`;
}

/* 8 — Consent Letter (from auditor) */
function genConsentLetter(f: F, withLH: boolean): string {
  const agm = f.agmOrdinal || "1st";
  const sixth = sixthAgm(agm);
  const fy = fyRange(f.meetingDate);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Consent Letter — Auditor</title><style>${DOC_CSS}</style></head><body>
${withLH ? auditorLH(f) : ""}
<h3 class="center">CONSENT TO APPOINTMENT AS STATUTORY AUDITOR</h3>
<p class="center italic">Under ${secRef(f.appointmentType)} of the Companies Act, 2013</p>
${!withLH ? `<hr/>
<p class="right">
${f.auditorType === "firm"
  ? `<strong>${f.firmName || "[FIRM NAME]"}</strong><br/>Chartered Accountants (FRN: ${f.firmRegNo || "[FRN]"})<br/>${f.auditorAddress || "[Office Address]"}${f.auditorCity ? `, ${f.auditorCity}` : ""}`
  : `<strong>${f.auditorName || "[AUDITOR NAME]"}</strong><br/>Chartered Accountant (M.No. ${f.membershipNo || "[M.No.]"})<br/>${f.auditorAddress || "[Address]"}${f.auditorCity ? `, ${f.auditorCity}` : ""}`}
</p>` : ""}

<p>Date: _______________</p>

<p class="para">To,<br/>The Board of Directors,<br/><strong>${f.companyName || "[COMPANY NAME]"}</strong><br/>${f.regAddress || "[Registered Address]"}</p>

<p class="para"><strong>Subject: Written Consent for Appointment as Statutory Auditor — ${f.companyName || "[COMPANY NAME]"}</strong></p>

<p class="para">Dear Sir(s)/Madam,</p>

${f.appointmentType === "subsequent" ? `
<p class="para">I/We, ${auditorLabel(f)}, hereby give our written <strong>CONSENT</strong> to be appointed as the <strong>Statutory Auditor${f.auditorType === "firm" ? "s" : ""}</strong> of <strong>${f.companyName || "[COMPANY NAME]"}</strong> (CIN: ${f.cin || "[CIN]"}) for a period of <strong>five consecutive years</strong>, i.e., <strong>${fy}</strong>, from the conclusion of the <strong>${agm} Annual General Meeting</strong> until the conclusion of the <strong>${sixth} Annual General Meeting</strong> of the Company.</p>
` : f.appointmentType === "first_auditor" ? `
<p class="para">I/We, ${auditorLabel(f)}, hereby give our written <strong>CONSENT</strong> to be appointed as the <strong>First Statutory Auditor</strong> of <strong>${f.companyName || "[COMPANY NAME]"}</strong> (CIN: ${f.cin || "[CIN]"}), to hold office from the date of appointment <strong>until the conclusion of the First Annual General Meeting</strong> of the Company.</p>
` : `
<p class="para">I/We, ${auditorLabel(f)}, hereby give our written <strong>CONSENT</strong> to be appointed as the <strong>Statutory Auditor</strong> of <strong>${f.companyName || "[COMPANY NAME]"}</strong> (CIN: ${f.cin || "[CIN]"}) to fill the casual vacancy, to hold office <strong>until the conclusion of the next Annual General Meeting</strong> of the Company.</p>
`}

<p class="para">I/We confirm that this consent is given with full knowledge of our obligations as Statutory Auditors under the Companies Act, 2013, the Chartered Accountants Act, 1949 and the Standards on Auditing issued by the ICAI.</p>

<div class="sig-block">
${f.auditorType === "firm"
  ? `<p>For <strong>${f.firmName || "[FIRM NAME]"}</strong><br/>Chartered Accountants<br/>FRN: ${f.firmRegNo || "[FRN]"}</p><p style="margin-top:50px;">_______________________<br/><strong>${f.partnerName || "[PARTNER NAME]"}</strong><br/>${f.partnerDesignation || "Partner"}<br/>Membership No.: ${f.partnerMembershipNo || "[M.No.]"}</p>`
  : `<p style="margin-top:50px;">_______________________<br/><strong>${f.auditorName || "[AUDITOR NAME]"}</strong><br/>Chartered Accountant<br/>Membership No.: ${f.membershipNo || "[M.No.]"}</p>`}
<p style="margin-top:10px; font-size:11pt;">Place: ${f.auditorCity || "[PLACE]"}<br/>Date: _______________</p>
</div>
</body></html>`;
}

/* 9 — Appointment Intimation Letter (company to auditor, after appointment) */
function genAppointmentIntimation(f: F, withLH: boolean): string {
  const agm = f.agmOrdinal || "1st";
  const sixth = sixthAgm(agm);
  const fy = fyRange(f.meetingDate);
  let tenureText = "";
  if (f.appointmentType === "first_auditor") tenureText = "until the conclusion of the First Annual General Meeting of the Company";
  else if (f.appointmentType === "subsequent") tenureText = `from the conclusion of the ${agm} Annual General Meeting until the conclusion of the ${sixth} Annual General Meeting (${fy})`;
  else tenureText = "until the conclusion of the next Annual General Meeting of the Company";

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Appointment Intimation Letter</title><style>${DOC_CSS}</style></head><body>
${withLH ? companyLH(f) : plainHeader(f)}

<p class="right">Date: ${fmtDate(f.meetingDate)}</p>

<p>To,<br/>
${f.auditorType === "firm"
  ? `<strong>${f.firmName || "[FIRM NAME]"}</strong><br/>Chartered Accountants<br/>FRN: ${f.firmRegNo || "[FRN]"}<br/>${f.auditorAddress ? `${f.auditorAddress},` : ""}${f.auditorCity ? ` ${f.auditorCity}` : ""}`
  : `<strong>${f.auditorName || "[AUDITOR NAME]"}</strong><br/>Chartered Accountant<br/>Membership No.: ${f.membershipNo || "[M.No.]"}<br/>${f.auditorAddress ? `${f.auditorAddress},` : ""}${f.auditorCity ? ` ${f.auditorCity}` : ""}`}
</p>

<p class="para"><strong>Subject: Appointment as Statutory Auditor — Intimation</strong></p>
<p class="para">Dear Sir/Madam,</p>

${f.appointmentType === "subsequent"
  ? `<p class="para">The members of <strong>${f.companyName || "[COMPANY NAME]"}</strong> at the <strong>${agm} Annual General Meeting</strong> held on <strong>${fmtDate(f.meetingDate)}</strong> have ${f.agmOrdinal === "1st" ? "appointed" : "re-appointed"} ${auditorLabel(f)} as the <strong>Statutory Auditor${f.auditorType === "firm" ? "s" : ""}</strong> of the Company pursuant to <strong>Section 139(1)</strong> of the Companies Act, 2013, for a term of <strong>five consecutive years</strong>.</p>`
  : f.appointmentType === "first_auditor"
  ? `<p class="para">The Board of Directors of <strong>${f.companyName || "[COMPANY NAME]"}</strong> at the Board Meeting held on <strong>${fmtDate(f.meetingDate)}</strong> has appointed ${auditorLabel(f)} as the <strong>First Statutory Auditor</strong> of the Company pursuant to <strong>Section 139(6)</strong> of the Companies Act, 2013.</p>`
  : `<p class="para">The Board of Directors of <strong>${f.companyName || "[COMPANY NAME]"}</strong> at the Board Meeting held on <strong>${fmtDate(f.meetingDate)}</strong> has appointed ${auditorLabel(f)} as the <strong>Statutory Auditor</strong> of the Company to fill the casual vacancy pursuant to <strong>Section 139(8)</strong> of the Companies Act, 2013.</p>`}

<p class="para">The terms of appointment are as follows:</p>
<table>
<tr><td style="width:38%"><strong>Type of Appointment:</strong></td><td>${apptTypeLabel(f.appointmentType)}</td></tr>
<tr><td><strong>Date of Appointment:</strong></td><td>${fmtDate(f.meetingDate)}</td></tr>
<tr><td><strong>Applicable Section:</strong></td><td>${secRef(f.appointmentType)} of the Companies Act, 2013</td></tr>
<tr><td><strong>Tenure:</strong></td><td>${tenureText}</td></tr>
<tr><td><strong>Remuneration:</strong></td><td>${f.remuneration ? `Rs. ${f.remuneration} per annum, exclusive of applicable GST and out-of-pocket expenses` : "As mutually agreed and fixed by the Board in consultation with the Auditors"}</td></tr>
${f.appointmentType === "casual_vacancy" && f.vacancyReason === "resignation"
  ? `<tr><td><strong>Condition:</strong></td><td>Subject to ratification by members at a General Meeting within three (3) months [Section 139(8)].</td></tr>`
  : ""}
</table>

<p class="para">You are requested to confirm acceptance of this appointment by signing and returning the duplicate of this letter.</p>
${f.appointmentType !== "casual_vacancy" ? `<p class="para">The Company shall file Form ADT-1 with the Registrar of Companies within fifteen days of this appointment.</p>` : ""}

${twoSigBlock(f, undefined, "")}

<hr style="margin-top:40px; border-top: 1px dashed #999;"/>
<p class="center italic" style="margin-top:10px;">— Acknowledgement (Please sign and return) —</p>
<p class="para">I/We, ${auditorLabel(f)}, hereby confirm receipt of this Letter of Appointment dated ${fmtDate(f.meetingDate)} and accept the appointment as Statutory Auditor of <strong>${f.companyName || "[COMPANY NAME]"}</strong> on the terms stated herein.</p>
<p style="margin-top:40px;">
${f.auditorType === "firm"
  ? `For <strong>${f.firmName || "[FIRM NAME]"}</strong>, Chartered Accountants (FRN: ${f.firmRegNo || "[FRN]"})<br/><br/>_______________________<br/>${f.partnerName || "[PARTNER NAME]"}, ${f.partnerDesignation || "Partner"} (M.No. ${f.partnerMembershipNo || "[M.No.]"})`
  : `_______________________<br/>${f.auditorName || "[AUDITOR NAME]"}, CA (M.No. ${f.membershipNo || "[M.No.]"})`}
<br/>Date: _______________</p>
</body></html>`;
}

/* 10 — ADT-1 ROC Filing Guide */
function genADT1Guide(f: F, _withLH: boolean): string {
  const isFirst = f.appointmentType === "first_auditor";
  const isSubsequent = f.appointmentType === "subsequent";
  const isCasual = f.appointmentType === "casual_vacancy";
  const isResignVacancy = isCasual && f.vacancyReason === "resignation";

  const triggerDate = isResignVacancy ? "[Date of General Meeting — ratification]" : fmtDate(f.meetingDate);
  const deadline = isResignVacancy ? "[15 days from General Meeting date]" : addDays(f.meetingDate, 15);
  const triggerLabel = isSubsequent ? "AGM" : isResignVacancy ? "General Meeting (ratification by members)" : "Board Meeting";

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ADT-1 ROC Filing Guide</title><style>${DOC_CSS}</style></head><body>
<h2 style="color:#0d6e5a">FORM ADT-1 — ROC FILING GUIDE</h2>
<h3 class="center">Return of Appointment of Auditor</h3>
<p class="center" style="font-size:11pt;">Pursuant to Section 139 read with Rule 4(2) of the Companies (Audit and Auditors) Rules, 2014<br/>
[As amended by G.S.R. 359(E) dated May 30, 2025 — effective July 14, 2025]</p>
<hr/>

<div class="section">
<table>
<tr><td style="width:38%"><strong>Company:</strong></td><td>${f.companyName || "[COMPANY NAME]"}</td></tr>
<tr><td><strong>CIN:</strong></td><td>${f.cin || "[CIN]"}</td></tr>
<tr><td><strong>Auditor Appointed:</strong></td><td>${auditorLabel(f)}</td></tr>
<tr><td><strong>Appointment Type:</strong></td><td>${apptTypeLabel(f.appointmentType)}</td></tr>
<tr><td><strong>Trigger Event:</strong></td><td>${triggerLabel} on ${triggerDate}</td></tr>
</table>
</div>

<div class="warning-box">
<p class="bold" style="color:#b91c1c; font-size:14pt;">⚠ FILING DEADLINE: ${deadline}</p>
<p style="margin-top:6px;">ADT-1 must be filed within <strong>15 days</strong> of the ${triggerLabel}.</p>
${isFirst ? `<p style="margin-top:6px;"><strong>2025 Update:</strong> ADT-1 is now mandatory for first auditor appointments [G.S.R. 359(E), effective July 14, 2025].</p>` : ""}
</div>

<div class="section">
<h3>STEP-BY-STEP FILING — MCA21 V3</h3>
<p class="para"><strong>Step 1 — Documents to keep ready:</strong></p>
<ol>
<li>Certified true copy of the ${isSubsequent ? "AGM resolution" : "Board resolution"} — signed and dated</li>
<li>Auditor's eligibility certificate and written consent (Rule 4(1))</li>
<li>Appointment Intimation Letter</li>
${isResignVacancy ? `<li>Previous auditor's resignation letter</li><li>Copy of ADT-3 filed by ${f.previousAuditorName || "the previous auditor"}</li><li>Certified copy of General Meeting ratification resolution</li>` : ""}
</ol>

<p class="para"><strong>Step 2 — Fill Form ADT-1 on MCA21:</strong></p>
<ol>
<li>Date of appointment: <strong>${triggerDate}</strong></li>
<li>Auditor type: <strong>${f.auditorType === "firm" ? "Firm of Chartered Accountants" : "Individual Chartered Accountant"}</strong></li>
${f.auditorType === "firm"
  ? `<li>Firm Name: <strong>${f.firmName || "[FIRM NAME]"}</strong> | FRN: <strong>${f.firmRegNo || "[FRN]"}</strong></li>`
  : `<li>Auditor: <strong>${f.auditorName || "[AUDITOR NAME]"}</strong> | M.No.: <strong>${f.membershipNo || "[M.No.]"}</strong></li>`}
<li>Period: ${isFirst ? "Till conclusion of First AGM" : isSubsequent ? `${f.agmOrdinal || "1st"} AGM to ${sixthAgm(f.agmOrdinal || "1st")} AGM (5 years)` : "Till conclusion of next AGM"}</li>
</ol>

<p class="para"><strong>Step 3 — Attach (PDF, max 2MB each):</strong></p>
<ol>
<li>${isSubsequent ? "Certified extract of AGM minutes / AGM resolution" : "Certified true copy of Board resolution"}</li>
<li>Auditor's eligibility certificate and consent (Rule 4(1))</li>
</ol>

<p class="para"><strong>Step 4 — DSC, Submit, and preserve SRN receipt.</strong></p>
</div>

<div class="section">
<h3>KEY LEGAL POINTS</h3>
<ul>
<li>ADT-1 is filed by the <strong>Company</strong>, not the auditor.</li>
${isFirst ? `<li>Post July 14, 2025: ADT-1 filing is <strong>mandatory</strong> for first auditor appointments [Companies (Audit and Auditors) Amendment Rules, 2025].</li>` : ""}
${isSubsequent ? `<li>Appointment is for a <strong>5-year term</strong>. No annual ratification required [Companies (Amendment) Act, 2017].</li>` : ""}
${f.entityType === "pvt_ltd" ? `<li>Private companies with paid-up capital below Rs. 50 crore are <strong>exempt from the rotation requirement</strong> under Section 139(2) [Rule 5, as amended 2017].</li>` : ""}
</ul>
</div>
</body></html>`;
}

/* ═══════════════════════════════════════════════
   UI COMPONENTS
═══════════════════════════════════════════════ */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {title && (
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <h4 className="font-bold text-sm text-slate-700">{title}</h4>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function ic(extra = "") {
  return `w-full border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none transition-colors bg-white ${extra}`;
}

function printDoc(html: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (w) {
    w.addEventListener("load", () => {
      w.print();
      URL.revokeObjectURL(url);
    });
  }
}

function downloadWord(html: string, filename: string) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const style = styleMatch ? styleMatch[1] : "";
  const wordHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><style>${style}</style></head>
<body>${bodyContent}</body></html>`;
  const blob = new Blob(["﻿", wordHtml], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename.replace(/[^a-z0-9]/gi, "_")}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════ */
export default function AuditorAppointmentPage() {
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [f, setF] = useState<F>(DEFAULT);
  const [companySearchVal, setCompanySearchVal] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [previewLabel, setPreviewLabel] = useState("");
  const [previewKey, setPreviewKey] = useState<string>("");
  const [lhPending, setLhPending] = useState<{ docKey: string; action: "print" | "word" | "all" } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ── Saved-auditor autofill state ──
  const [savedAuditors, setSavedAuditors] = useState<SavedAuditor[]>([]);
  const [selectedSavedAuditorId, setSelectedSavedAuditorId] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Fetch saved auditors for this CIN whenever CIN changes (logged-in only)
  const fetchSavedAuditors = useCallback(async (cin: string) => {
    if (!session) { setSavedAuditors([]); return; }
    try {
      // Fetch ALL auditors for this user (not just company-specific)
      // so the same CA firm saved for one company appears as suggestion for others too
      const res = await fetch(`/api/auditors`);
      const data = await res.json() as { auditors?: SavedAuditor[] };
      const all = data.auditors ?? [];
      // Sort: this-company's auditors first, then the rest
      const sorted = [
        ...all.filter(a => a.cin === cin),
        ...all.filter(a => a.cin !== cin),
      ];
      setSavedAuditors(sorted);
      setSelectedSavedAuditorId("");
    } catch {
      setSavedAuditors([]);
    }
  }, [session]);

  useEffect(() => {
    fetchSavedAuditors(f.cin);
    setSaveStatus("idle");
  }, [f.cin, fetchSavedAuditors]);

  // Fetch saved company contact (email/mobile) when CIN changes
  useEffect(() => {
    if (!session || !f.cin) return;
    fetch(`/api/companies/my?cin=${encodeURIComponent(f.cin)}`)
      .then(r => r.json())
      .then((data: { company?: { email?: string | null; mobile?: string | null } | null }) => {
        if (data.company) {
          setF(p => ({
            ...p,
            companyEmail: p.companyEmail || data.company?.email || "",
            companyMobile: p.companyMobile || data.company?.mobile || "",
          }));
        }
      })
      .catch(() => {});
  }, [f.cin, session]);

  function applySavedAuditor(a: SavedAuditor) {
    const isIndividual = a.auditorType === "individual";
    setF(p => ({
      ...p,
      auditorType: (a.auditorType as AuditorType) || "firm",
      firmName: isIndividual ? "" : (a.firmName || ""),
      firmRegNo: isIndividual ? "" : (a.frn || ""),
      partnerName: isIndividual ? "" : (a.partnerName || ""),
      partnerMembershipNo: isIndividual ? "" : (a.membershipNo || ""),
      partnerDesignation: a.partnerDesignation || "Partner",
      auditorName: isIndividual ? a.firmName : "",
      membershipNo: isIndividual ? a.membershipNo : "",
      auditorAddress: a.auditorAddress || "",
      auditorCity: a.auditorCity || a.place || "",
      auditorEmail: a.auditorEmail || "",
      auditorMobile: a.auditorMobile || "",
      remuneration: a.remuneration || "",
    }));
  }

  async function handleSaveAuditor() {
    if (!session || !f.cin) return;
    setSaveStatus("saving");
    try {
      const payload = {
        firmName: f.auditorType === "individual" ? f.auditorName : f.firmName,
        frn: f.firmRegNo || "",
        partnerName: f.auditorType === "individual" ? f.auditorName : f.partnerName,
        membershipNo: f.auditorType === "individual" ? f.membershipNo : f.partnerMembershipNo,
        place: f.auditorCity,
        cin: f.cin,
        auditorType: f.auditorType,
        auditorAddress: f.auditorAddress,
        auditorCity: f.auditorCity,
        auditorEmail: f.auditorEmail,
        auditorMobile: f.auditorMobile,
        appointmentType: f.appointmentType,
        agmFrom: f.agmOrdinal,
        agmTo: sixthAgm(f.agmOrdinal),
        fyRange: fyRange(f.meetingDate),
        remuneration: f.remuneration,
        isActive: true,
        partnerDesignation: f.partnerDesignation,
      };
      const res = await fetch("/api/auditors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("save failed");
      // Also save company email/mobile if filled
      if (f.companyEmail || f.companyMobile) {
        await fetch("/api/companies/my", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cin: f.cin, email: f.companyEmail, mobile: f.companyMobile }),
        }).catch(() => {});
      }
      setSaveStatus("saved");
      await fetchSavedAuditors(f.cin);
    } catch {
      setSaveStatus("error");
    }
  }

  const docs: DocEntry[] = useMemo(() => {
    if (f.appointmentType === "first_auditor") {
      return [
        { key: "proposal", label: "Proposal Letter", emoji: "📩", gen: (lh) => genProposalLetter(f, lh) },
        { key: "board_notice", label: "Board Notice", emoji: "📬", gen: (lh) => genBoardNotice(f, lh) },
        { key: "board_ctc", label: "Board Resolution CTC", emoji: "⚖️", gen: (lh) => genBoardCTC(f, lh) },
        { key: "elig_cert", label: "Eligibility Certificate", emoji: "✅", gen: (lh) => genEligibilityCert(f, lh), auditorDoc: true },
        { key: "consent", label: "Consent Letter", emoji: "📋", gen: (lh) => genConsentLetter(f, lh), auditorDoc: true },
        { key: "intimation", label: "Appointment Intimation", emoji: "📄", gen: (lh) => genAppointmentIntimation(f, lh) },
        { key: "adt1", label: "ADT-1 ROC Guide", emoji: "🗂️", gen: (lh) => genADT1Guide(f, lh) },
      ];
    }
    if (f.appointmentType === "subsequent") {
      return [
        { key: "proposal", label: "Proposal Letter", emoji: "📩", gen: (lh) => genProposalLetter(f, lh) },
        { key: "board_recomm", label: "Board Resolution (Recommending)", emoji: "🏛️", gen: (lh) => genBoardRecommAGM(f, lh) },
        { key: "agm_notice", label: "AGM Notice", emoji: "📬", gen: (lh) => genAGMNotice(f, lh) },
        { key: "agm_ctc", label: "AGM Resolution CTC", emoji: "⚖️", gen: (lh) => genAGMCTC(f, lh) },
        { key: "elig_cert", label: "Eligibility Certificate", emoji: "✅", gen: (lh) => genEligibilityCert(f, lh), auditorDoc: true },
        { key: "consent", label: "Consent Letter", emoji: "📋", gen: (lh) => genConsentLetter(f, lh), auditorDoc: true },
        { key: "intimation", label: "Appointment Intimation", emoji: "📄", gen: (lh) => genAppointmentIntimation(f, lh) },
        { key: "adt1", label: "ADT-1 ROC Guide", emoji: "🗂️", gen: (lh) => genADT1Guide(f, lh) },
      ];
    }
    return [
      { key: "board_notice", label: "Board Notice", emoji: "📬", gen: (lh) => genBoardNotice(f, lh) },
      { key: "board_ctc", label: "Board Resolution CTC", emoji: "⚖️", gen: (lh) => genBoardCTC(f, lh) },
      { key: "elig_cert", label: "Eligibility Certificate", emoji: "✅", gen: (lh) => genEligibilityCert(f, lh), auditorDoc: true },
      { key: "consent", label: "Consent Letter", emoji: "📋", gen: (lh) => genConsentLetter(f, lh), auditorDoc: true },
      { key: "intimation", label: "Appointment Intimation", emoji: "📄", gen: (lh) => genAppointmentIntimation(f, lh) },
      { key: "adt1", label: "ADT-1 ROC Guide", emoji: "🗂️", gen: (lh) => genADT1Guide(f, lh) },
    ];
  }, [f]);

  function openPreview(key: string, label: string, html: string) {
    const final = session ? html : injectPreviewWatermark(html);
    setPreviewKey(key);
    setPreviewLabel(label);
    setPreview(final);
  }

  function handleLHChoice(withLH: boolean) {
    if (!lhPending) return;
    if (lhPending.action === "all") {
      docs.forEach((doc, i) => {
        setTimeout(() => {
          const html = doc.gen(withLH && !doc.auditorDoc);
          const final = session ? html : injectPreviewWatermark(html);
          printDoc(final);
        }, i * 900);
      });
      setLhPending(null);
      return;
    }
    const doc = docs.find(d => d.key === lhPending.docKey);
    if (!doc) { setLhPending(null); return; }
    const effectiveLH = withLH && !doc.auditorDoc;
    const html = doc.gen(effectiveLH);
    const final = session ? html : injectPreviewWatermark(html);
    if (lhPending.action === "print") {
      printDoc(final);
    } else {
      downloadWord(final, doc.label);
    }
    setLhPending(null);
  }

  function requestAction(docKey: string, action: "print" | "word") {
    setLhPending({ docKey, action });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* ── LETTERHEAD MODAL ── */}
      {lhPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 border border-slate-200">
            <div className="text-3xl mb-3 text-center">🖨️</div>
            <h3 className="font-black text-xl text-slate-900 mb-1 text-center">Company Letterhead?</h3>
            <p className="text-sm text-slate-500 mb-6 text-center">
              {lhPending.action === "all"
                ? "Print all documents — with or without company letterhead?"
                : `${lhPending.action === "word" ? "Download Word" : "Print"} — with or without company letterhead?`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleLHChoice(true)}
                className="flex-1 py-3 rounded-xl bg-teal-600 text-white font-bold text-sm hover:bg-teal-700 transition-colors shadow-sm">
                With Letterhead
              </button>
              <button onClick={() => handleLHChoice(false)}
                className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:border-teal-400 transition-colors">
                Without Letterhead
              </button>
            </div>
            <button onClick={() => setLhPending(null)}
              className="w-full mt-3 text-xs text-slate-400 hover:text-slate-600 transition-colors py-1">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 56px)" }}>

        {/* ── SIDEBAR ── */}
        <aside className="w-72 flex-shrink-0 flex flex-col"
          style={{ background: "linear-gradient(180deg,#0f172a 0%,#1a2a3a 100%)", borderRight: "1px solid #1e293b" }}>

          <div className="px-5 py-5 border-b border-white/10">
            <Link href="/tools/corporate-action-kit"
              className="flex items-center gap-1.5 text-white/40 text-xs hover:text-white/70 transition-colors mb-4">
              ← Corporate Action Kit
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#0d9488,#0f766e)" }}>
                🔍
              </div>
              <div>
                <h2 className="font-black text-white text-sm leading-tight">Auditor Appointment</h2>
                <p className="text-white/40 text-xs mt-0.5">Section 139 · ADT-1</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
            {AUDIT_STEPS.map(s => {
              const done = step > s.id;
              const active = step === s.id;
              return (
                <button key={s.id}
                  onClick={() => { if (s.id < step) setStep(s.id); }}
                  className={`w-full text-left px-4 py-3.5 rounded-xl transition-all flex items-start gap-3 ${
                    active ? "bg-teal-600/20 border border-teal-500/30" :
                    done ? "bg-white/5 hover:bg-white/10 cursor-pointer" :
                    "opacity-40 cursor-not-allowed"
                  }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 ${
                    done ? "bg-emerald-500 text-white" :
                    active ? "bg-teal-500 text-white" :
                    "bg-white/10 text-white/50"
                  }`}>
                    {done ? "✓" : s.id}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${active ? "text-teal-300" : done ? "text-white/80" : "text-white/40"}`}>
                      {s.label}
                    </p>
                    <p className={`text-xs mt-0.5 leading-tight ${active ? "text-teal-200/60" : "text-white/25"}`}>
                      {s.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {step === 5 && (
            <div className="px-4 pb-5">
              <p className="text-white/30 text-xs font-bold uppercase tracking-wider mb-2">Documents ({docs.length})</p>
              <div className="space-y-1">
                {docs.map(d => (
                  <div key={d.key} className="flex items-center gap-2 text-white/55 text-xs py-0.5">
                    <span>{d.emoji}</span><span>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 overflow-y-auto">

          {/* Sticky header */}
          <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 flex-wrap">
                {AUDIT_STEPS.map((s, i) => (
                  <span key={s.id} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-slate-300">›</span>}
                    <span className={
                      step === s.id ? "text-teal-600 font-bold" :
                      step > s.id ? "text-emerald-600 font-semibold" :
                      "text-slate-400"
                    }>{s.label}</span>
                  </span>
                ))}
              </div>
              <h1 className="font-black text-xl text-slate-900">
                {AUDIT_STEPS.find(s => s.id === step)?.label}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button onClick={() => { setStep(step - 1); setPreview(null); }}
                  className="px-4 py-2 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:border-slate-300 transition-colors">
                  ← Back
                </button>
              )}
              {step < 5 && (
                <button onClick={() => {
                  // Auto-save company to DB when leaving Step 1 (so it appears in future searches)
                  if (step === 1 && session && f.cin && f.companyName) {
                    fetch("/api/companies/upsert", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        cin: f.cin,
                        companyName: f.companyName,
                        regAddress: f.regAddress || null,
                        entityType: f.entityType || null,
                        incorporationDate: f.incorporationDate || null,
                        directors: f.directors.filter(d => d.name).map(d => ({
                          name: d.name, din: d.din, designation: d.designation, isActive: true,
                        })),
                        charges: [],
                      }),
                    }).catch(() => {});
                  }
                  setStep(step + 1);
                  setSaveStatus("idle");
                }}
                  className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 transition-all shadow-sm">
                  Continue →
                </button>
              )}
              {step === 5 && (
                <button onClick={() => { setStep(1); setF(DEFAULT); setPreview(null); setCompanySearchVal(""); setSavedAuditors([]); setSaveStatus("idle"); }}
                  className="px-4 py-2 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:border-slate-300 transition-colors">
                  🔄 New Appointment
                </button>
              )}
            </div>
          </div>

          {/* Step Content */}
          <div className="px-8 py-8 max-w-3xl">

            {/* ─ STEP 1: Company ─ */}
            {step === 1 && (
              <div className="space-y-5">
                <SectionCard title="Search Company (MCA Database)">
                  <div className="mb-4">
                    <CompanySearch
                      value={companySearchVal}
                      onChange={setCompanySearchVal}
                      className={ic()}
                      onSelect={(c: CompanyData) => {
                        setCompanySearchVal(c.companyName || "");
                        const incDate = c.incorporationDate || "";
                        const suggested = suggestAppointmentType(incDate);
                        // Populate directors from MCA data (active directors only)
                        const mcaDirs = (c.directors || [])
                          .filter((d) => d.isActive !== false)
                          .map((d) => ({
                            id: `dir-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                            name: d.name || "",
                            din: d.din || "",
                            designation: d.designation || "Director",
                            isPresent: true,
                          }));
                        setF(p => ({
                          ...p,
                          companyName: c.companyName || "",
                          cin: c.cin || "",
                          regAddress: c.regAddress || "",
                          entityType: (c.classOfCompany || "").toLowerCase().includes("public") ? "pub_ltd" : "pvt_ltd",
                          incorporationDate: incDate,
                          appointmentType: suggested ?? p.appointmentType,
                          directors: mcaDirs.length >= 1
                            ? (mcaDirs.length >= 2 ? mcaDirs : [...mcaDirs, makeDir()])
                            : p.directors,
                        }));
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 text-center">Or fill the details manually below</p>
                </SectionCard>

                <SectionCard title="Company Details">
                  <div className="space-y-4">
                    <Field label="Company Name">
                      <input className={ic()} value={f.companyName}
                        onChange={e => setF(p => ({ ...p, companyName: e.target.value }))}
                        placeholder="XYZ Private Limited" />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="CIN">
                        <input className={ic()} value={f.cin}
                          onChange={e => setF(p => ({ ...p, cin: e.target.value }))}
                          placeholder="U12345MH2020PTC123456" />
                      </Field>
                      <Field label="Entity Type">
                        <select className={ic()} value={f.entityType}
                          onChange={e => setF(p => ({ ...p, entityType: e.target.value }))}>
                          <option value="pvt_ltd">Private Limited Company</option>
                          <option value="pub_ltd">Public Limited Company</option>
                          <option value="opc">One Person Company (OPC)</option>
                        </select>
                      </Field>
                    </div>
                    <Field label="Registered Address">
                      <textarea className={ic("resize-none")} rows={2} value={f.regAddress}
                        onChange={e => setF(p => ({ ...p, regAddress: e.target.value }))}
                        placeholder="Full registered office address" />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Company Mobile" hint="Shown on letterhead">
                        <input className={ic()} value={f.companyMobile}
                          onChange={e => setF(p => ({ ...p, companyMobile: e.target.value }))}
                          placeholder="+91 98765 43210" />
                      </Field>
                      <Field label="Company Email" hint="Shown on letterhead">
                        <input className={ic()} value={f.companyEmail}
                          onChange={e => setF(p => ({ ...p, companyEmail: e.target.value }))}
                          placeholder="info@company.com" />
                      </Field>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="">
                  <CompanyExcelUpload onFill={(c: CompanyData) => {
                    const incDate = c.incorporationDate || "";
                    const suggested = suggestAppointmentType(incDate);
                    const mcaDirs = (c.directors || [])
                      .filter((d) => d.isActive !== false)
                      .map((d) => ({
                        id: `dir-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                        name: d.name || "",
                        din: d.din || "",
                        designation: d.designation || "Director",
                        isPresent: true,
                      }));
                    setF(p => ({
                      ...p,
                      companyName: c.companyName || "",
                      cin: c.cin || "",
                      regAddress: c.regAddress || "",
                      entityType: (c.classOfCompany || "").toLowerCase().includes("public") ? "pub_ltd" : "pvt_ltd",
                      incorporationDate: incDate,
                      appointmentType: suggested ?? p.appointmentType,
                      directors: mcaDirs.length >= 1
                        ? (mcaDirs.length >= 2 ? mcaDirs : [...mcaDirs, makeDir()])
                        : p.directors,
                    }));
                  }} />
                </SectionCard>
              </div>
            )}

            {/* ─ STEP 2: Appointment Type ─ */}
            {step === 2 && (
              <div className="space-y-5">
                {/* Auto-suggestion based on incorporation date */}
                {f.incorporationDate && (() => {
                  const suggested = suggestAppointmentType(f.incorporationDate);
                  if (!suggested) return null;
                  const days = Math.round((Date.now() - new Date(f.incorporationDate).getTime()) / 86400000);
                  return suggested === "first_auditor" ? (
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl px-4 py-3 flex items-start gap-3">
                      <span className="text-xl flex-shrink-0">💡</span>
                      <div>
                        <p className="text-sm font-bold text-amber-800">New company — First Auditor suggested</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          Incorporated {days} days ago. Board should appoint First Auditor within 30 days of incorporation (Section 139(6)).
                          <span className="font-semibold"> You can still change below.</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl px-4 py-3 flex items-start gap-3">
                      <span className="text-xl flex-shrink-0">💡</span>
                      <div>
                        <p className="text-sm font-bold text-blue-800">Subsequent Auditor suggested</p>
                        <p className="text-xs text-blue-600 mt-0.5">
                          Company incorporated {days} days ago. Members appoint at AGM for 5-year term.
                          <span className="font-semibold"> You can still change below.</span>
                        </p>
                      </div>
                    </div>
                  );
                })()}

                <SectionCard title="Select Appointment Type">
                  <div className="space-y-3">
                    {([
                      {
                        val: "first_auditor" as AppointmentType,
                        label: "First Auditor",
                        icon: "🆕",
                        ref: "Section 139(6)",
                        desc: "Board appoints within 30 days of incorporation. Holds office till conclusion of first AGM. ADT-1 mandatory (post July 2025).",
                        color: "border-teal-500 bg-teal-50",
                        textColor: "text-teal-800",
                      },
                      {
                        val: "subsequent" as AppointmentType,
                        label: "Subsequent Auditor (AGM)",
                        icon: "🏛️",
                        ref: "Section 139(1)",
                        desc: "Members appoint at AGM for 5-year term. Board first recommends at Board meeting, then members approve at AGM. No annual ratification since 2017.",
                        color: "border-blue-500 bg-blue-50",
                        textColor: "text-blue-800",
                      },
                      {
                        val: "casual_vacancy" as AppointmentType,
                        label: "Casual Vacancy",
                        icon: "🚨",
                        ref: "Section 139(8)",
                        desc: "Auditor vacated office (resignation / death / disqualification). Board fills within 30 days. GM ratification required if vacancy due to resignation.",
                        color: "border-amber-500 bg-amber-50",
                        textColor: "text-amber-800",
                      },
                    ]).map(opt => (
                      <button key={opt.val} onClick={() => setF(p => ({ ...p, appointmentType: opt.val }))}
                        className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all ${
                          f.appointmentType === opt.val ? `${opt.color} shadow-sm` : "border-slate-200 bg-white hover:border-slate-300"
                        }`}>
                        <div className="flex items-start gap-3">
                          <span className="text-2xl flex-shrink-0 mt-0.5">{opt.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`font-bold ${f.appointmentType === opt.val ? opt.textColor : "text-slate-800"}`}>
                                {opt.label}
                              </p>
                              <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">{opt.ref}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{opt.desc}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </SectionCard>

                {f.appointmentType === "casual_vacancy" && (
                  <SectionCard title="Casual Vacancy — Details">
                    <div className="space-y-4">
                      <Field label="Reason for Vacancy">
                        <div className="flex gap-3">
                          <button onClick={() => setF(p => ({ ...p, vacancyReason: "resignation" }))}
                            className={`flex-1 py-2.5 px-4 rounded-xl border-2 text-sm font-bold transition-all ${
                              f.vacancyReason === "resignation" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-600"
                            }`}>
                            Resignation
                          </button>
                          <button onClick={() => setF(p => ({ ...p, vacancyReason: "other" }))}
                            className={`flex-1 py-2.5 px-4 rounded-xl border-2 text-sm font-bold transition-all ${
                              f.vacancyReason === "other" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-600"
                            }`}>
                            Other (Death / Disqualification)
                          </button>
                        </div>
                      </Field>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Previous Auditor Name">
                          <input className={ic()} value={f.previousAuditorName}
                            onChange={e => setF(p => ({ ...p, previousAuditorName: e.target.value }))}
                            placeholder="M/s. Previous Firm" />
                        </Field>
                        <Field label="Date of Vacancy / Resignation">
                          <input type="date" className={ic()} value={f.vacancyDate}
                            onChange={e => setF(p => ({ ...p, vacancyDate: e.target.value }))} />
                        </Field>
                      </div>
                      {f.vacancyReason === "resignation" && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
                          <p className="font-bold mb-1.5">Resignation Vacancy — Process Summary</p>
                          <ol className="space-y-1 list-decimal pl-4">
                            <li>Resigning auditor files <strong>ADT-3</strong> within 30 days of resignation</li>
                            <li>Board fills vacancy within <strong>30 days</strong></li>
                            <li>General Meeting ratifies within <strong>3 months</strong> of Board recommendation</li>
                            <li>Company files <strong>ADT-1</strong> within 15 days of <strong>General Meeting</strong></li>
                          </ol>
                        </div>
                      )}
                    </div>
                  </SectionCard>
                )}

                {f.appointmentType === "subsequent" && (
                  <SectionCard title="AGM Details">
                    <div className="space-y-4">
                      <Field label="Financial Year of AGM" hint="e.g., 2025-26 means AGM will be held by Sep 30, 2026">
                        <input
                          className={ic()}
                          value={f.fy}
                          onChange={e => {
                            const fy = e.target.value.trim();
                            const auto = calcAgmOrdinal(f.incorporationDate, fy);
                            setF(p => ({ ...p, fy, agmOrdinal: auto || p.agmOrdinal }));
                          }}
                          placeholder="2025-26"
                          maxLength={7}
                        />
                        {f.fy && /^\d{4}-\d{2}$/.test(f.fy) && (
                          <p className="text-xs text-teal-600 mt-1.5">
                            AGM for FY {f.fy} must be held by <strong>30 September {parseInt(f.fy) + 1}</strong>
                          </p>
                        )}
                      </Field>
                      <Field label="AGM Serial Number" hint="Auto-calculated from incorporation date — type to override (e.g., 3rd, 15th, 50th)">
                        <input
                          className={ic()}
                          value={f.agmOrdinal}
                          onChange={e => setF(p => ({ ...p, agmOrdinal: e.target.value }))}
                          placeholder="e.g., 3rd"
                        />
                        {f.incorporationDate && !f.fy && (
                          <p className="text-xs text-slate-400 mt-1">Enter FY above to auto-calculate AGM number</p>
                        )}
                      </Field>
                      {f.agmOrdinal && (
                        <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
                          <p className="text-xs text-teal-700">
                            Auditor will hold office from conclusion of <strong>{f.agmOrdinal} AGM</strong> to conclusion of <strong>{sixthAgm(f.agmOrdinal)} AGM</strong> (five years).
                          </p>
                        </div>
                      )}
                    </div>
                  </SectionCard>
                )}

                <SectionCard title="Documents That Will Be Generated">
                  <div className="grid grid-cols-3 gap-2 text-xs text-center sm:grid-cols-4">
                    {docs.map(d => (
                      <div key={d.key} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <div className="text-2xl mb-1.5">{d.emoji}</div>
                        <div className="font-bold text-slate-700 leading-tight">{d.label}</div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ─ STEP 3: Auditor Details ─ */}
            {step === 3 && (
              <div className="space-y-5">

                {/* Saved auditor dropdown */}
                {savedAuditors.length > 0 && (
                  <div className="bg-teal-50 border-2 border-teal-300 rounded-2xl p-4">
                    <label className="block text-xs font-bold text-teal-800 uppercase tracking-wider mb-2">
                      💾 Select from Saved Auditors ({savedAuditors.length})
                    </label>
                    <select
                      value={selectedSavedAuditorId}
                      onChange={e => {
                        const id = e.target.value;
                        setSelectedSavedAuditorId(id);
                        if (id) {
                          const found = savedAuditors.find(a => a.id === id);
                          if (found) applySavedAuditor(found);
                        }
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-teal-200 bg-white text-sm text-slate-800 font-medium focus:outline-none focus:border-teal-500 transition-colors">
                      <option value="">— Select a saved auditor —</option>
                      {savedAuditors.map(a => {
                        const isThisCompany = a.cin === f.cin;
                        const namepart = a.auditorType === "individual"
                          ? `${a.firmName} (M.No. ${a.membershipNo})`
                          : `${a.firmName}${a.frn ? ` · FRN ${a.frn}` : ""}`;
                        const citypart = a.auditorCity ? ` · ${a.auditorCity}` : "";
                        const marker = isThisCompany ? " ★" : "";
                        return (
                          <option key={a.id} value={a.id}>
                            {marker}{namepart}{citypart}
                          </option>
                        );
                      })}
                    </select>
                    <div className="flex items-center justify-between mt-2">
                      {selectedSavedAuditorId ? (
                        <p className="text-xs text-teal-700 font-medium">
                          ✓ All details auto-filled below — edit if needed.
                        </p>
                      ) : (
                        <p className="text-xs text-teal-600">
                          ★ = previously used for this company
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <SectionCard title="Auditor Type">
                  <div className="flex gap-3">
                    {([
                      { val: "firm" as AuditorType, icon: "🏢", label: "CA Firm" },
                      { val: "individual" as AuditorType, icon: "👤", label: "Individual CA" },
                    ]).map(opt => (
                      <button key={opt.val} onClick={() => setF(p => ({ ...p, auditorType: opt.val }))}
                        className={`flex-1 py-4 px-4 rounded-xl border-2 text-center font-bold text-sm transition-all ${
                          f.auditorType === opt.val ? "border-teal-500 bg-teal-50 text-teal-700 shadow-sm" : "border-slate-200 bg-white text-slate-600"
                        }`}>
                        <div className="text-2xl mb-1">{opt.icon}</div>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </SectionCard>

                {f.auditorType === "firm" && (
                  <SectionCard title="Firm Details">
                    <div className="space-y-4">
                      <Field label="Firm Name" hint="Full name as registered with ICAI">
                        <input className={ic()} value={f.firmName}
                          onChange={e => setF(p => ({ ...p, firmName: e.target.value }))}
                          placeholder="M/s. ABC & Associates" />
                      </Field>
                      <Field label="Firm Registration Number (FRN)">
                        <input className={ic()} value={f.firmRegNo}
                          onChange={e => setF(p => ({ ...p, firmRegNo: e.target.value }))}
                          placeholder="123456W" />
                      </Field>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <Field label="Signing Partner Name">
                            <input className={ic()} value={f.partnerName}
                              onChange={e => setF(p => ({ ...p, partnerName: e.target.value }))}
                              placeholder="CA Ramesh Kumar" />
                          </Field>
                        </div>
                        <Field label="Designation">
                          <select className={ic()} value={f.partnerDesignation}
                            onChange={e => setF(p => ({ ...p, partnerDesignation: e.target.value }))}>
                            <option value="Partner">Partner</option>
                            <option value="Proprietor">Proprietor</option>
                          </select>
                        </Field>
                      </div>
                      <Field label="Partner Membership No.">
                        <input className={ic()} value={f.partnerMembershipNo}
                          onChange={e => setF(p => ({ ...p, partnerMembershipNo: e.target.value }))}
                          placeholder="098765" />
                      </Field>
                    </div>
                  </SectionCard>
                )}

                {f.auditorType === "individual" && (
                  <SectionCard title="Auditor Details">
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="CA Name">
                        <input className={ic()} value={f.auditorName}
                          onChange={e => setF(p => ({ ...p, auditorName: e.target.value }))}
                          placeholder="CA Priya Sharma" />
                      </Field>
                      <Field label="Membership Number">
                        <input className={ic()} value={f.membershipNo}
                          onChange={e => setF(p => ({ ...p, membershipNo: e.target.value }))}
                          placeholder="123456" />
                      </Field>
                    </div>
                  </SectionCard>
                )}

                <SectionCard title="Contact Details">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Office Address">
                        <input className={ic()} value={f.auditorAddress}
                          onChange={e => setF(p => ({ ...p, auditorAddress: e.target.value }))}
                          placeholder="123, ABC Road, Andheri" />
                      </Field>
                      <Field label="City">
                        <input className={ic()} value={f.auditorCity}
                          onChange={e => setF(p => ({ ...p, auditorCity: e.target.value }))}
                          placeholder="Mumbai" />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Mobile Number">
                        <input className={ic()} value={f.auditorMobile}
                          onChange={e => setF(p => ({ ...p, auditorMobile: e.target.value }))}
                          placeholder="+91 98765 43210" />
                      </Field>
                      <Field label="Email ID">
                        <input className={ic()} value={f.auditorEmail}
                          onChange={e => setF(p => ({ ...p, auditorEmail: e.target.value }))}
                          placeholder="audit@firm.com" />
                      </Field>
                    </div>
                    <Field label="Remuneration" hint="Amount in Rs. or leave blank for 'as decided by Board'">
                      <input className={ic()} value={f.remuneration}
                        onChange={e => setF(p => ({ ...p, remuneration: e.target.value }))}
                        placeholder="e.g., 25,000  (leave blank = as mutually decided)" />
                    </Field>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ─ STEP 4: Meeting & Attendance ─ */}
            {step === 4 && (
              <div className="space-y-5">
                {f.appointmentType === "subsequent" && (
                  <SectionCard title="Board Meeting (Recommendation)">
                    <div className="space-y-4">
                      <p className="text-xs text-slate-500 bg-blue-50 border border-blue-200 rounded-xl p-3">
                        Board first recommends the auditor at a Board meeting. Members then approve at the AGM.
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Board Meeting Date" hint="Date board recommends to members">
                          <input type="date" className={ic()} value={f.boardRecommDate}
                            onChange={e => setF(p => ({ ...p, boardRecommDate: e.target.value }))} />
                        </Field>
                        <Field label="AGM Date" hint="Date members actually appoint">
                          <input type="date" className={ic()} value={f.meetingDate}
                            onChange={e => setF(p => ({ ...p, meetingDate: e.target.value }))} />
                        </Field>
                      </div>
                    </div>
                  </SectionCard>
                )}

                <SectionCard title={f.appointmentType === "subsequent" ? "AGM Details" : "Board Meeting Details"}>
                  <div className="space-y-4">
                    {f.appointmentType !== "subsequent" && (
                      <Field label="Board Meeting Date">
                        <input type="date" className={ic()} value={f.meetingDate}
                          onChange={e => setF(p => ({ ...p, meetingDate: e.target.value }))} />
                      </Field>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <Field label={f.appointmentType === "subsequent" ? "AGM Time" : "Meeting Time"}>
                        <input type="time" className={ic()} value={f.meetingTime}
                          onChange={e => setF(p => ({ ...p, meetingTime: e.target.value }))} />
                      </Field>
                      <Field label="Meeting Serial / Number"
                        hint={f.appointmentType === "subsequent" ? "e.g., 1st AGM" : "e.g., BM-03/2025-26"}>
                        <input className={ic()} value={f.meetingSerial}
                          onChange={e => setF(p => ({ ...p, meetingSerial: e.target.value }))}
                          placeholder={f.appointmentType === "subsequent" ? "1st AGM" : "BM-03/2025"} />
                      </Field>
                    </div>
                    <Field label="Venue / Platform">
                      <input className={ic()} value={f.venue}
                        onChange={e => setF(p => ({ ...p, venue: e.target.value }))}
                        placeholder="Registered office / via VC" />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Chairman Name">
                        <input className={ic()} value={f.chairmanName}
                          onChange={e => setF(p => ({ ...p, chairmanName: e.target.value }))}
                          placeholder="Name of chairperson" />
                      </Field>
                      <Field label="Chairman DIN">
                        <input className={ic()} value={f.chairmanDin}
                          onChange={e => setF(p => ({ ...p, chairmanDin: e.target.value }))}
                          placeholder="8-digit DIN" />
                      </Field>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Directors / Members Attendance">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-slate-500">At least 2 directors needed for signature blocks</p>
                    <button
                      onClick={() => setF(p => ({ ...p, directors: [...p.directors, makeDir()] }))}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors">
                      + Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide px-1">
                      <div className="col-span-4">Name</div>
                      <div className="col-span-3">DIN</div>
                      <div className="col-span-3">Designation</div>
                      <div className="col-span-2">Status</div>
                    </div>
                    {f.directors.map((d, i) => (
                      <div key={d.id} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <input className={ic("text-xs")} value={d.name}
                            onChange={e => setF(p => ({ ...p, directors: p.directors.map((x, j) => j === i ? { ...x, name: e.target.value } : x) }))}
                            placeholder="Full name" />
                        </div>
                        <div className="col-span-3">
                          <input className={ic("text-xs")} value={d.din}
                            onChange={e => setF(p => ({ ...p, directors: p.directors.map((x, j) => j === i ? { ...x, din: e.target.value } : x) }))}
                            placeholder="DIN" />
                        </div>
                        <div className="col-span-3">
                          <input className={ic("text-xs")} value={d.designation}
                            onChange={e => setF(p => ({ ...p, directors: p.directors.map((x, j) => j === i ? { ...x, designation: e.target.value } : x) }))}
                            placeholder="Director" />
                        </div>
                        <div className="col-span-1">
                          <button
                            onClick={() => setF(p => ({ ...p, directors: p.directors.map((x, j) => j === i ? { ...x, isPresent: !x.isPresent } : x) }))}
                            className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
                              d.isPresent ? "bg-emerald-100 text-emerald-700" : "bg-red-50 text-red-500"
                            }`}>
                            {d.isPresent ? "✓" : "✗"}
                          </button>
                        </div>
                        <div className="col-span-1">
                          {f.directors.length > 1 && (
                            <button
                              onClick={() => setF(p => ({ ...p, directors: p.directors.filter((_, j) => j !== i) }))}
                              className="w-full py-2 rounded-lg text-xs text-red-400 hover:bg-red-50 transition-colors">
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {f.meetingDate && (
                  <div className={`rounded-xl p-4 border ${f.appointmentType === "casual_vacancy" && f.vacancyReason === "resignation" ? "bg-amber-50 border-amber-200" : "bg-teal-50 border-teal-200"}`}>
                    <p className={`text-xs font-bold mb-1 ${f.appointmentType === "casual_vacancy" && f.vacancyReason === "resignation" ? "text-amber-700" : "text-teal-700"}`}>
                      ADT-1 Deadline Reminder
                    </p>
                    <p className={`text-xs ${f.appointmentType === "casual_vacancy" && f.vacancyReason === "resignation" ? "text-amber-600" : "text-teal-600"}`}>
                      {f.appointmentType === "casual_vacancy" && f.vacancyReason === "resignation"
                        ? `Board fills vacancy first. Then convene General Meeting within 3 months of Board recommendation (from ${fmtDate(f.meetingDate)}). File ADT-1 within 15 days of the General Meeting.`
                        : `ADT-1 must be filed by ${addDays(f.meetingDate, 15)} (within 15 days of ${f.appointmentType === "subsequent" ? "AGM" : "Board meeting"} on ${fmtDate(f.meetingDate)}).`
                      }
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ─ STEP 5: Documents ─ */}
            {step === 5 && (
              <div className="space-y-5">
                {preview ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="font-bold text-slate-800">{previewLabel}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => requestAction(previewKey, "print")}
                          className="px-3 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-teal-600 to-teal-700 shadow-sm hover:from-teal-500 hover:to-teal-600 transition-all">
                          🖨️ Print
                        </button>
                        <button onClick={() => requestAction(previewKey, "word")}
                          className="px-3 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-blue-600 to-blue-700 shadow-sm hover:from-blue-500 hover:to-blue-600 transition-all">
                          📝 Word
                        </button>
                        <button onClick={() => setPreview(null)}
                          className="px-4 py-2 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:border-slate-300 transition-colors">
                          ← All Documents
                        </button>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
                      style={{ height: "60vh" }}>
                      <iframe ref={iframeRef} srcDoc={preview} className="w-full h-full" title="Document Preview" />
                    </div>
                  </div>
                ) : (
                  <>
                    <SectionCard title={`${docs.length} Documents Generated`}>
                      <div className="space-y-3">
                        {docs.map(doc => (
                          <div key={doc.key}
                            className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                            <span className="text-3xl flex-shrink-0">{doc.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 text-sm">{doc.label}</p>
                              {doc.auditorDoc && (
                                <p className="text-xs text-slate-400 mt-0.5">Auditor document — letterhead option uses auditor details</p>
                              )}
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button onClick={() => openPreview(doc.key, doc.label, doc.gen(false))}
                                className="px-3 py-1.5 rounded-lg border-2 border-teal-200 text-teal-700 text-xs font-bold hover:bg-teal-50 transition-colors">
                                Preview
                              </button>
                              <button onClick={() => requestAction(doc.key, "print")}
                                className="px-3 py-1.5 rounded-lg text-white text-xs font-bold bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 transition-all">
                                🖨️ Print
                              </button>
                              <button onClick={() => requestAction(doc.key, "word")}
                                className="px-3 py-1.5 rounded-lg text-white text-xs font-bold bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 transition-all">
                                📝 Word
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </SectionCard>

                    <SectionCard title="">
                      <button
                        onClick={() => setLhPending({ docKey: "all", action: "all" })}
                        className="w-full py-3 rounded-xl text-white font-bold text-sm bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 transition-all shadow-sm">
                        🖨️ Print All {docs.length} Documents
                      </button>
                      <p className="text-xs text-slate-400 text-center mt-2">
                        Opens each document in a separate print dialog
                      </p>
                    </SectionCard>

                    {/* Save auditor for future use */}
                    {session && f.cin && (
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Save for Future Use</p>
                        <button
                          onClick={handleSaveAuditor}
                          disabled={saveStatus === "saving" || saveStatus === "saved"}
                          className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                            saveStatus === "saved"
                              ? "bg-emerald-50 border-2 border-emerald-400 text-emerald-700"
                              : saveStatus === "error"
                              ? "bg-red-50 border-2 border-red-300 text-red-600 hover:bg-red-100"
                              : saveStatus === "saving"
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "bg-gradient-to-br from-slate-700 to-slate-800 text-white hover:from-slate-600 hover:to-slate-700"
                          }`}>
                          {saveStatus === "saving"
                            ? "Saving..."
                            : saveStatus === "saved"
                            ? "✓ Auditor Saved for Future Use"
                            : saveStatus === "error"
                            ? "Save Failed — Try Again"
                            : "💾 Save Auditor Details for Future Use"}
                        </button>
                        <p className="text-xs text-slate-400 text-center mt-2">
                          Auto-fills in future appointments and annual filings for this company
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
