"use client";
import React, { useState, useMemo, useRef } from "react";
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

interface F {
  companyName: string;
  cin: string;
  regAddress: string;
  entityType: string;
  appointmentType: AppointmentType;
  auditorType: AuditorType;
  auditorName: string;
  membershipNo: string;
  firmName: string;
  firmRegNo: string;
  partnerName: string;
  partnerMembershipNo: string;
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
  appointmentType: "first_auditor",
  auditorType: "firm",
  auditorName: "", membershipNo: "",
  firmName: "", firmRegNo: "", partnerName: "", partnerMembershipNo: "",
  auditorAddress: "", auditorCity: "", auditorEmail: "", auditorMobile: "",
  remuneration: "",
  agmOrdinal: "1st",
  meetingDate: "", meetingTime: "", meetingSerial: "", venue: "",
  chairmanName: "", chairmanDin: "",
  directors: [makeDir()],
  vacancyReason: "resignation", previousAuditorName: "", vacancyDate: "",
};

/* ═══════════════════════════════════════════════
   STEPS
═══════════════════════════════════════════════ */
const AUDIT_STEPS = [
  { id: 1, label: "Company", desc: "Company name, CIN, address, entity type" },
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
  .indent { padding-left: 30px; }
  .box { border: 1px solid #000; padding: 12px 16px; margin: 12px 0; }
  .warning-box { border: 2px solid #b91c1c; padding: 12px 16px; margin: 12px 0; background: #fff8f8; }
  .info-box { border: 1px solid #0d9488; padding: 12px 16px; margin: 12px 0; background: #f0fdfa; }
  ol { padding-left: 28px; margin: 8px 0; }
  ol li { margin: 5px 0; }
  ul { padding-left: 28px; margin: 8px 0; }
  ul li { margin: 5px 0; }
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

/* ═══════════════════════════════════════════════
   DOCUMENT GENERATORS
═══════════════════════════════════════════════ */

/* 1 ─ Board Notice (First Auditor / Casual Vacancy) */
function genBoardNotice(f: F): string {
  const isFirst = f.appointmentType === "first_auditor";
  const purpose = isFirst
    ? "Appointment of First Statutory Auditor — Section 139(6)"
    : "Filling of Casual Vacancy in the Office of Statutory Auditor — Section 139(8)";

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Board Notice — Auditor</title><style>${DOC_CSS}</style></head><body>
<h2>${f.companyName || "[COMPANY NAME]"}</h2>
<p class="center">${f.cin ? `CIN: ${f.cin}` : ""}</p>
<p class="center">${f.regAddress || "[Registered Address]"}</p>
<hr/>
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
${isFirst ? `<tr><td>3.</td><td><strong>Appointment of First Statutory Auditor</strong> — To appoint the First Auditor of the Company pursuant to Section 139(6) and to fix remuneration pursuant to Section 142 of the Companies Act, 2013.</td><td>Board Resolution</td><td>Sec 139(6) + 142</td></tr>` : `<tr><td>3.</td><td><strong>Filling of Casual Vacancy — Statutory Auditor</strong> — To appoint an auditor to fill the casual vacancy caused by the ${f.vacancyReason === "resignation" ? `resignation of ${f.previousAuditorName || "[PREVIOUS AUDITOR]"}` : "occurrence of a casual vacancy"} pursuant to Section 139(8) of the Companies Act, 2013, to hold office until the conclusion of the next Annual General Meeting.</td><td>Board Resolution</td><td>Sec 139(8)</td></tr>`}
<tr><td>4.</td><td>Any other matter with the permission of the Chair.</td><td>Procedural</td><td>—</td></tr>
</tbody>
</table>
</div>

<div class="section">
<p class="bold">NOTES:</p>
<ol>
<li>This notice is issued at least 7 clear days prior to the meeting in compliance with Section 173(3) and SS-1.</li>
<li>The written consent and certificate of eligibility of the proposed auditor under Rule 4(1) of the Companies (Audit and Auditors) Rules, 2014 is attached herewith for the Board's consideration.</li>
${!isFirst && f.vacancyReason === "resignation" ? `<li><strong>Important:</strong> As the casual vacancy arises from resignation, the Board appointment is subject to ratification by members at a General Meeting to be convened within 3 months of the Board's recommendation [Section 139(8)].</li>` : ""}
</ol>
</div>

<div class="sig-block">
<p>By Order of the Board of Directors,<br/>For <strong>${f.companyName || "[COMPANY NAME]"}</strong></p>
<p style="margin-top:50px;">_______________________<br/>${f.chairmanName || "[DIRECTOR / CS NAME]"}<br/>Director / Company Secretary</p>
<p style="margin-top:8px; font-size:11pt;">Place: ${f.venue || "[CITY]"}<br/>Date: ${subDays(f.meetingDate, 7)}</p>
</div>
</body></html>`;
}

/* 2 ─ AGM Notice (Subsequent Auditor) */
function genAGMNotice(f: F): string {
  const agm = f.agmOrdinal || "1st";
  const sixth = sixthAgm(agm);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>AGM Notice — Auditor Appointment</title><style>${DOC_CSS}</style></head><body>
<h2>${f.companyName || "[COMPANY NAME]"}</h2>
<p class="center">${f.cin ? `CIN: ${f.cin}` : ""}</p>
<p class="center">${f.regAddress || "[Registered Address]"}</p>
<hr/>
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
<p class="para"><strong>"RESOLVED THAT</strong> pursuant to Section 139(1), Section 142 and other applicable provisions of the Companies Act, 2013 read with the Companies (Audit and Auditors) Rules, 2014 and any amendments thereto, ${auditorLabel(f)}, who ${f.auditorType === "firm" ? "have" : "has"} given written consent and furnished a certificate under Rule 4(1) confirming eligibility under Section 141 of the Act, be and ${f.auditorType === "firm" ? "are" : "is"} hereby appointed as the <strong>Statutory Auditor(s)</strong> of the Company, to hold office for a term of <strong>five consecutive years</strong> from the conclusion of this <strong>${agm} Annual General Meeting</strong> until the conclusion of the <strong>${sixth} Annual General Meeting</strong> of the Company, at such remuneration${f.remuneration ? ` of Rs. ${f.remuneration} per annum,` : ""} as shall be fixed by the Board of Directors in consultation with the Auditors.</p>
<p class="para"><strong>RESOLVED FURTHER THAT</strong> the Board of Directors be and is hereby authorised to file Form ADT-1 with the Registrar of Companies within fifteen days of this meeting, to issue the Letter of Appointment, and to do all such acts, deeds and things as may be necessary to give effect to this resolution."</p>
</div>
<div class="info-box" style="margin-top:10px;">
<p style="font-size:11pt;"><em>Note: This appointment is for a five-year term. Pursuant to the Companies (Amendment) Act, 2017 (effective May 7, 2018), no annual ratification by members at subsequent AGMs is required.</em></p>
</div>
</div>

<div class="section">
<h3>EXPLANATORY STATEMENT</h3>
<p class="italic" style="font-size:11pt;">(Pursuant to Section 102(1) of the Companies Act, 2013)</p>
<p class="para"><strong>Re: Item 2 — Appointment of Statutory Auditors</strong></p>
<p class="para">${auditorLabel(f)} has given written consent and furnished a certificate pursuant to Rule 4(1) of the Companies (Audit and Auditors) Rules, 2014 confirming that: (a) the appointment is within the limits prescribed under Section 141(3)(g); (b) they are not disqualified under Section 141; and (c) there are no pending proceedings relating to professional matters of conduct.</p>
<p class="para">The Board of Directors recommends the Ordinary Resolution at Item No. 2 for approval by the Members.</p>
<p class="para"><strong>None of the Directors or Key Managerial Personnel of the Company or their relatives is/are concerned or interested, financially or otherwise, in the resolution at Item No. 2.</strong></p>
</div>

<div class="sig-block">
<p>By Order of the Board of Directors,<br/>For <strong>${f.companyName || "[COMPANY NAME]"}</strong></p>
<p style="margin-top:50px;">_______________________<br/>${f.chairmanName || "[DIRECTOR / CS NAME]"}<br/>Director / Company Secretary<br/>DIN: ${f.chairmanDin || "[DIN]"}</p>
<p style="margin-top:8px; font-size:11pt;">Place: ${f.venue || "[CITY]"}<br/>Date: ${subDays(f.meetingDate, 21)}</p>
</div>
</body></html>`;
}

/* 3 ─ Board Resolution CTC (First Auditor / Casual Vacancy) */
function genBoardCTC(f: F): string {
  const isFirst = f.appointmentType === "first_auditor";
  const isCasual = f.appointmentType === "casual_vacancy";
  const presentDirs = f.directors.filter(d => d.isPresent);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Board Resolution CTC — Auditor Appointment</title><style>${DOC_CSS}</style></head><body>
<h2>${f.companyName || "[COMPANY NAME]"}</h2>
<p class="center">${f.cin ? `CIN: ${f.cin}` : ""}</p>
<hr/>
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
${isCasual ? `<p class="para">The Chairman placed before the Board that a casual vacancy has arisen in the office of the Statutory Auditor ${f.vacancyReason === "resignation" ? `due to the resignation of ${f.previousAuditorName || "[PREVIOUS AUDITOR]"} vide resignation letter dated ${fmtDate(f.vacancyDate)}` : ""}. The Board noted the same and, pursuant to Section 139(8), proceeded to fill the vacancy within the prescribed period of thirty days.</p>` : ""}
${isFirst ? `<p class="para">The Chairman informed the Board that pursuant to Section 139(6) of the Companies Act, 2013, the Board is required to appoint the First Auditor of the Company within thirty days from the date of incorporation. The Board reviewed the written consent and eligibility certificate received from the proposed auditor and proceeded to consider the appointment.</p>` : ""}
</div>

<div class="section">
<h3>${isFirst ? "RESOLUTION: APPOINTMENT OF FIRST STATUTORY AUDITOR" : "RESOLUTION: FILLING OF CASUAL VACANCY — STATUTORY AUDITOR"}</h3>
${isFirst ? `
<p class="para"><strong>"RESOLVED THAT</strong> pursuant to Section 139(6) read with Section 142 and other applicable provisions of the Companies Act, 2013, and the Companies (Audit and Auditors) Rules, 2014 and amendments thereto, ${auditorLabel(f)}, who ${f.auditorType === "firm" ? "have" : "has"} given written consent and furnished a certificate confirming that the appointment is within the limits under Section 141(3)(g) and that ${f.auditorType === "firm" ? "they are" : "they are"} not disqualified under Section 141 of the Act, be and ${f.auditorType === "firm" ? "are" : "is"} hereby appointed as the <strong>First Statutory Auditor</strong> of the Company, to hold office from the date of this meeting <strong>until the conclusion of the First Annual General Meeting</strong> of the Company, at a remuneration of ${f.remuneration ? `<strong>Rs. ${f.remuneration}</strong> per annum, exclusive of applicable GST and reimbursement of out-of-pocket expenses actually incurred` : "[REMUNERATION — to be agreed]"}.</p>
<p class="para"><strong>RESOLVED FURTHER THAT</strong> any Director or the Company Secretary of the Company be and is hereby authorised to issue the formal Letter of Appointment to the Auditor(s), to file Form ADT-1 with the Registrar of Companies within fifteen days from the date of this appointment, and to do all such acts, deeds and things as may be required to give effect to this resolution."</p>
` : `
<p class="para"><strong>"RESOLVED THAT</strong> pursuant to Section 139(8) and other applicable provisions of the Companies Act, 2013, read with the Companies (Audit and Auditors) Rules, 2014, ${auditorLabel(f)}, who ${f.auditorType === "firm" ? "have" : "has"} given written consent and furnished a certificate confirming eligibility under Section 141 of the Act, be and ${f.auditorType === "firm" ? "are" : "is"} hereby recommended for appointment as the Statutory Auditor(s) of the Company to fill the casual vacancy, to hold office until the conclusion of the <strong>next Annual General Meeting</strong> of the Company, at a remuneration of ${f.remuneration ? `<strong>Rs. ${f.remuneration}</strong> per annum, exclusive of applicable GST and reimbursement of out-of-pocket expenses` : "[REMUNERATION — to be agreed]"}${f.vacancyReason === "resignation" ? ", subject to ratification of this appointment by members at a General Meeting to be convened within three months of this recommendation, as required under Section 139(8) of the Act" : ""}.</p>
<p class="para"><strong>RESOLVED FURTHER THAT</strong> any Director or the Company Secretary be and is hereby authorised to: (a) issue the Letter of Appointment to the Auditor; (b) ${f.vacancyReason === "resignation" ? "convene the requisite General Meeting for ratification by members and thereafter " : ""}file Form ADT-1 with the Registrar of Companies within fifteen days of ${f.vacancyReason === "resignation" ? "the General Meeting" : "this meeting"}; and (c) do all acts as may be required in this regard."</p>
`}
</div>

<div class="section">
<p class="para">The resolution was proposed, seconded and passed with requisite majority. The Chairman declared the resolution duly carried.</p>
</div>

<div class="sig-block">
<p><strong>Certified True Copy</strong></p>
<p style="margin-top:50px;">_______________________<br/>${f.chairmanName || "[CHAIRMAN]"}<br/>Chairman<br/>DIN: ${f.chairmanDin || "[DIN]"}</p>
<p style="margin-top:10px; font-size:11pt;">Place: ${f.venue || "[PLACE]"}<br/>Date: ${fmtDate(f.meetingDate)}</p>
</div>
</body></html>`;
}

/* 4 ─ AGM Resolution CTC (Subsequent Auditor) */
function genAGMCTC(f: F): string {
  const agm = f.agmOrdinal || "1st";
  const sixth = sixthAgm(agm);
  const presentDirs = f.directors.filter(d => d.isPresent);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>AGM Resolution CTC — Auditor Appointment</title><style>${DOC_CSS}</style></head><body>
<h2>${f.companyName || "[COMPANY NAME]"}</h2>
<p class="center">${f.cin ? `CIN: ${f.cin}` : ""}</p>
<hr/>
<h3 class="center">CERTIFIED TRUE COPY OF RESOLUTION</h3>
<p class="center">Passed at the ${agm} Annual General Meeting of the Members</p>

<div class="section">
<table class="no-border">
<tr><td style="width:35%"><strong>Date of AGM:</strong></td><td>${fmtDate(f.meetingDate)} (${fmtDay(f.meetingDate)})</td></tr>
<tr><td><strong>Time:</strong></td><td>${f.meetingTime || "[TIME]"}</td></tr>
<tr><td><strong>Venue:</strong></td><td>${f.venue || "[VENUE]"}</td></tr>
<tr><td><strong>AGM No. / Serial:</strong></td><td>${agm} AGM${f.meetingSerial ? ` / ${f.meetingSerial}` : ""}</td></tr>
<tr><td><strong>Chairman:</strong></td><td>${f.chairmanName || "[CHAIRMAN]"} (DIN: ${f.chairmanDin || "[DIN]"})</td></tr>
</table>
</div>

${presentDirs.length > 0 ? `<div class="section"><p class="bold">DIRECTORS PRESENT:</p><table><thead><tr><th style="width:8%">S.No.</th><th>Name</th><th>DIN</th><th>Designation</th></tr></thead><tbody>${presentDirs.map((d, i) => `<tr><td>${i + 1}.</td><td>${d.name || "[NAME]"}</td><td>${d.din || "[DIN]"}</td><td>${d.designation}</td></tr>`).join("")}</tbody></table></div>` : ""}

<div class="section">
<p class="para">The Chairman noted that due notice of the meeting had been given to all members and that the requisite quorum was present. The Chairman called the meeting to order.</p>
<p class="para">The Chairman presented the item relating to Appointment of Statutory Auditors. It was noted that ${auditorLabel(f)} has furnished the requisite written consent and certificate of eligibility under Rule 4(1) of the Companies (Audit and Auditors) Rules, 2014. After due deliberation, the following resolution was put to vote and declared passed as an <strong>Ordinary Resolution</strong>:</p>
</div>

<div class="section">
<h3>ORDINARY RESOLUTION — APPOINTMENT OF STATUTORY AUDITOR</h3>
<div class="box">
<p class="para"><strong>"RESOLVED THAT</strong> pursuant to Section 139(1), Section 142 and other applicable provisions of the Companies Act, 2013 read with the Companies (Audit and Auditors) Rules, 2014 and any amendments thereto, ${auditorLabel(f)}, who ${f.auditorType === "firm" ? "have" : "has"} given written consent and furnished a certificate under Rule 4(1) confirming that the appointment is within the limits prescribed under Section 141(3)(g) and that ${f.auditorType === "firm" ? "they are" : "they are"} not disqualified under Section 141 of the Act, be and ${f.auditorType === "firm" ? "are" : "is"} hereby appointed as the <strong>Statutory Auditor(s)</strong> of the Company, to hold office for a term of <strong>five consecutive years</strong> from the conclusion of this <strong>${agm} Annual General Meeting</strong> until the conclusion of the <strong>${sixth} Annual General Meeting</strong> of the Company, at such remuneration${f.remuneration ? ` of Rs. ${f.remuneration} per annum,` : ""} as shall be fixed by the Board of Directors in consultation with the Auditors.</p>
<p class="para"><strong>RESOLVED FURTHER THAT</strong> the Board of Directors be and is hereby authorised to fix the remuneration of the Auditors, to file Form ADT-1 with the Registrar of Companies within fifteen days of this meeting, to issue the Letter of Appointment, and to do all acts, deeds and things as may be required to give effect to this resolution."</p>
</div>
<p class="italic para" style="font-size:11pt;">Note: This appointment is for a five-year term. No annual ratification at subsequent AGMs is required pursuant to the Companies (Amendment) Act, 2017 effective May 7, 2018.</p>
</div>

<div class="sig-block">
<p><strong>Certified True Copy</strong></p>
<p style="margin-top:50px;">_______________________<br/>${f.chairmanName || "[CHAIRMAN]"}<br/>Chairman — ${agm} Annual General Meeting<br/>DIN: ${f.chairmanDin || "[DIN]"}</p>
<p style="margin-top:10px; font-size:11pt;">Place: ${f.venue || "[PLACE]"}<br/>Date: ${fmtDate(f.meetingDate)}</p>
</div>
</body></html>`;
}

/* 5 ─ Auditor Consent & Certificate of Eligibility */
function genAuditorConsent(f: F): string {
  const agm = f.agmOrdinal || "1st";
  const sixth = sixthAgm(agm);
  let tenureText = "";
  if (f.appointmentType === "first_auditor") tenureText = "until the conclusion of the First Annual General Meeting";
  else if (f.appointmentType === "subsequent") tenureText = `from the conclusion of the ${agm} AGM until the conclusion of the ${sixth} AGM`;
  else tenureText = "until the conclusion of the next Annual General Meeting";

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Auditor Consent & Certificate of Eligibility</title><style>${DOC_CSS}</style></head><body>
<h3 class="center">WRITTEN CONSENT AND CERTIFICATE OF ELIGIBILITY</h3>
<p class="center italic">Under ${secRef(f.appointmentType)} and Section 141 of the Companies Act, 2013<br/>read with Rule 4(1) of the Companies (Audit and Auditors) Rules, 2014</p>
<hr/>

<p class="right">
${f.auditorType === "firm"
  ? `<strong>${f.firmName || "[FIRM NAME]"}</strong><br/>Chartered Accountants (FRN: ${f.firmRegNo || "[FRN]"})<br/>${f.auditorAddress || "[Office Address]"}${f.auditorCity ? `, ${f.auditorCity}` : ""}<br/>${f.auditorMobile ? `Tel: ${f.auditorMobile}` : ""}${f.auditorEmail ? `<br/>Email: ${f.auditorEmail}` : ""}`
  : `<strong>${f.auditorName || "[AUDITOR NAME]"}</strong><br/>Chartered Accountant (M.No. ${f.membershipNo || "[M.No.]"})<br/>${f.auditorAddress || "[Address]"}${f.auditorCity ? `, ${f.auditorCity}` : ""}<br/>${f.auditorMobile ? `Tel: ${f.auditorMobile}` : ""}${f.auditorEmail ? `<br/>Email: ${f.auditorEmail}` : ""}`}
</p>

<p>Date: _______________</p>

<p class="para">To,<br/>The Board of Directors,<br/><strong>${f.companyName || "[COMPANY NAME]"}</strong><br/>${f.regAddress || "[Registered Address]"}</p>

<p class="para"><strong>Subject: Written Consent and Certificate of Eligibility for Appointment as ${apptTypeLabel(f.appointmentType)} under ${secRef(f.appointmentType)} of the Companies Act, 2013</strong></p>

<p class="para">Dear Sir(s) / Madam,</p>
<p class="para">I/We, ${auditorLabel(f)}, hereby furnish the following consent and certificate pursuant to ${secRef(f.appointmentType)} read with Rule 4(1) of the Companies (Audit and Auditors) Rules, 2014:</p>

<div class="section">
<h3>PART A — CONSENT TO APPOINTMENT</h3>
<p class="para">I/We hereby give written <strong>CONSENT</strong> to be appointed as the ${f.appointmentType === "first_auditor" ? "First Statutory Auditor" : f.appointmentType === "casual_vacancy" ? "Statutory Auditor (Casual Vacancy)" : "Statutory Auditor"} of <strong>${f.companyName || "[COMPANY NAME]"}</strong> (CIN: ${f.cin || "[CIN]"}), to hold office <strong>${tenureText}</strong>.</p>
</div>

<div class="section">
<h3>PART B — CERTIFICATE OF ELIGIBILITY AND NON-DISQUALIFICATION</h3>
<p class="para">I/We hereby certify that, as on the date of this certificate:</p>
<ol>
<li class="para"><strong>Valid Certificate of Practice:</strong> I am / We are a Chartered Accountant(s) registered with the Institute of Chartered Accountants of India (ICAI) and hold a valid Certificate of Practice. [Section 141(1)]</li>
<li class="para"><strong>Not an Officer or Employee:</strong> I am not / None of our partners is an officer or employee of <strong>${f.companyName || "the Company"}</strong>, or a person who was an officer or employee of the Company within the preceding 5 (five) years. [Section 141(3)(b) and (c)]</li>
<li class="para"><strong>No Holding of Securities:</strong> Neither I/we, nor any of my/our relative(s) or partner(s), hold any security or interest in the Company or its subsidiary, holding or associate company exceeding the prescribed limit. [Section 141(3)(d)(i) and Rule 10]</li>
<li class="para"><strong>No Indebtedness:</strong> Neither I/we, nor any of my/our relative(s) or partner(s), are indebted to the Company or its subsidiary, holding, associate or fellow subsidiary company in an amount exceeding Rs. 5,00,000/- (Rupees Five Lakhs). [Section 141(3)(d)(ii)]</li>
<li class="para"><strong>No Guarantee:</strong> Neither I/we, nor any of my/our relative(s) or partner(s), have given any guarantee or provided security in connection with the indebtedness of any third person to the Company or its related companies exceeding Rs. 1,00,000/-. [Section 141(3)(d)(iii)]</li>
<li class="para"><strong>No Business Relationship:</strong> I/We do not have any direct or indirect business relationship with the Company or its subsidiaries, holding or associated companies as defined under Section 141(3)(e) of the Act.</li>
<li class="para"><strong>No Relative as Director/KMP:</strong> None of my/our relative(s) is a Director of the Company or is in the employment of the Company as a Director or as Key Managerial Personnel. [Section 141(3)(f)]</li>
<li class="para"><strong>Ceiling on Number of Audits [Section 141(3)(g)]:</strong> This appointment will <strong>not</strong> result in my/our holding appointments as auditor in more than twenty (20) companies as computed under Section 141(3)(g) read with MCA Notification dated June 5, 2015 and Rule 4 of the Companies (Audit and Auditors) Rules, 2014.${f.auditorType === "firm" ? " No individual partner of the firm, including myself, holds appointment as auditor in more than twenty (20) such companies." : ""}</li>
<li class="para"><strong>No Prohibited Services:</strong> I/We do not render, directly or indirectly, any of the services specified in Section 144 of the Companies Act, 2013 to the Company or its subsidiary or holding company. [Section 141(3)(i)]</li>
<li class="para"><strong>No Conviction Involving Fraud:</strong> I/We have not been convicted by a court of an offence involving fraud, or if convicted, more than ten (10) years have elapsed from the date of such conviction. [Section 141(3)(h)]</li>
<li class="para"><strong>Pending Proceedings:</strong> There are no orders or pending proceedings against me/us before any competent authority relating to professional matters of conduct, except as disclosed below:<br/><span class="italic">Disclosure (if any): NIL / [state any pending proceedings]</span></li>
</ol>
</div>

<div class="section">
<h3>PART C — DECLARATION</h3>
<p class="para">I/We confirm that all the information stated above is true and correct to the best of my/our knowledge and belief. I/We undertake to inform the Company immediately if any of the conditions stated above change or cease to be satisfied during the tenure of the appointment.</p>
</div>

<div class="sig-block">
${f.auditorType === "firm"
  ? `<p>For <strong>${f.firmName || "[FIRM NAME]"}</strong><br/>Chartered Accountants<br/>FRN: ${f.firmRegNo || "[FRN]"}</p><p style="margin-top:50px;">_______________________<br/><strong>${f.partnerName || "[PARTNER NAME]"}</strong><br/>Partner<br/>Membership No.: ${f.partnerMembershipNo || "[M.No.]"}</p>`
  : `<p style="margin-top:50px;">_______________________<br/><strong>${f.auditorName || "[AUDITOR NAME]"}</strong><br/>Chartered Accountant<br/>Membership No.: ${f.membershipNo || "[M.No.]"}</p>`}
<p style="margin-top:10px; font-size:11pt;">Place: ${f.auditorCity || "[PLACE]"}<br/>Date: _______________</p>
</div>
</body></html>`;
}

/* 6 ─ Letter of Appointment */
function genLetterOfAppointment(f: F): string {
  const agm = f.agmOrdinal || "1st";
  const sixth = sixthAgm(agm);
  let tenureText = "";
  if (f.appointmentType === "first_auditor") tenureText = "until the conclusion of the First Annual General Meeting of the Company";
  else if (f.appointmentType === "subsequent") tenureText = `from the conclusion of the ${agm} Annual General Meeting until the conclusion of the ${sixth} Annual General Meeting of the Company`;
  else tenureText = "until the conclusion of the next Annual General Meeting of the Company";

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Letter of Appointment — Auditor</title><style>${DOC_CSS}</style></head><body>
<h2>${f.companyName || "[COMPANY NAME]"}</h2>
<p class="center">${f.cin ? `CIN: ${f.cin}` : ""}<br/>${f.regAddress || "[Registered Address]"}</p>
<hr/>

<p class="right">Date: ${fmtDate(f.meetingDate)}</p>

<p>To,<br/>
${f.auditorType === "firm"
  ? `<strong>${f.firmName || "[FIRM NAME]"}</strong><br/>Chartered Accountants<br/>FRN: ${f.firmRegNo || "[FRN]"}<br/>${f.auditorAddress ? `${f.auditorAddress},` : ""}${f.auditorCity ? ` ${f.auditorCity}` : ""}`
  : `<strong>${f.auditorName || "[AUDITOR NAME]"}</strong><br/>Chartered Accountant<br/>Membership No.: ${f.membershipNo || "[M.No.]"}<br/>${f.auditorAddress ? `${f.auditorAddress},` : ""}${f.auditorCity ? ` ${f.auditorCity}` : ""}`}
</p>

<p class="para"><strong>Subject: Letter of Appointment as Statutory Auditor — ${apptTypeLabel(f.appointmentType)}</strong></p>
<p class="para">Dear Sir/Madam,</p>

<p class="para">We are pleased to inform you that at the ${f.appointmentType === "subsequent" ? `${agm} Annual General Meeting` : "meeting of the Board of Directors"} of <strong>${f.companyName || "[COMPANY NAME]"}</strong> held on <strong>${fmtDate(f.meetingDate)}</strong>, ${auditorLabel(f)} ${f.auditorType === "firm" ? "has" : "has"} been duly appointed as the <strong>${f.appointmentType === "first_auditor" ? "First Statutory Auditor" : f.appointmentType === "casual_vacancy" ? "Statutory Auditor (Casual Vacancy)" : "Statutory Auditor"}</strong> of the Company pursuant to <strong>${secRef(f.appointmentType)}</strong> of the Companies Act, 2013.</p>

<p class="para">The terms of appointment are as follows:</p>
<table>
<tr><td style="width:38%"><strong>Type of Appointment:</strong></td><td>${apptTypeLabel(f.appointmentType)}</td></tr>
<tr><td><strong>Date of Appointment:</strong></td><td>${fmtDate(f.meetingDate)}</td></tr>
<tr><td><strong>Applicable Section:</strong></td><td>${secRef(f.appointmentType)} of the Companies Act, 2013</td></tr>
<tr><td><strong>Tenure:</strong></td><td>${tenureText}</td></tr>
<tr><td><strong>Remuneration:</strong></td><td>${f.remuneration ? `Rs. ${f.remuneration} per annum, exclusive of applicable GST and reimbursement of out-of-pocket expenses, subject to tax deduction at source as applicable` : "As shall be mutually agreed and fixed by the Board of Directors in consultation with the Auditors"}</td></tr>
${f.appointmentType === "casual_vacancy" && f.vacancyReason === "resignation"
  ? `<tr><td><strong>Condition:</strong></td><td>Subject to ratification by members at a General Meeting within three (3) months of the Board's recommendation [Section 139(8)].</td></tr>`
  : ""}
</table>

<p class="para">You are requested to:</p>
<ol>
<li>Confirm acceptance of this appointment by signing and returning the enclosed duplicate of this letter;</li>
<li>Maintain all audit documentation and working papers in accordance with the Companies Act, 2013, the Chartered Accountants Act, 1949 and the Standards on Auditing issued by ICAI.</li>
</ol>

<p class="para">The Company shall file Form ADT-1 with the Registrar of Companies within fifteen days of ${f.appointmentType === "casual_vacancy" && f.vacancyReason === "resignation" ? "the General Meeting for ratification" : "the date of this appointment"}.</p>

<p class="para">We look forward to a professional and productive engagement.</p>

<div class="sig-block">
<p>Yours faithfully,<br/>For <strong>${f.companyName || "[COMPANY NAME]"}</strong></p>
<p style="margin-top:50px;">_______________________<br/>${f.chairmanName || "[DIRECTOR NAME]"}<br/>Director / Authorised Signatory<br/>DIN: ${f.chairmanDin || "[DIN]"}</p>
</div>

<hr style="margin-top:40px; border-top: 1px dashed #999;"/>
<p class="center italic" style="margin-top:10px;">— Acknowledgement (Please sign and return) —</p>
<p class="para">I/We, ${auditorLabel(f)}, hereby confirm receipt of this Letter of Appointment dated ${fmtDate(f.meetingDate)} and accept the appointment as Statutory Auditor of <strong>${f.companyName || "[COMPANY NAME]"}</strong> on the terms stated herein.</p>
<p style="margin-top:40px;">
${f.auditorType === "firm"
  ? `For <strong>${f.firmName || "[FIRM NAME]"}</strong>, Chartered Accountants (FRN: ${f.firmRegNo || "[FRN]"})<br/><br/>_______________________<br/>${f.partnerName || "[PARTNER NAME]"}, Partner (M.No. ${f.partnerMembershipNo || "[M.No.]"})`
  : `_______________________<br/>${f.auditorName || "[AUDITOR NAME]"}, CA (M.No. ${f.membershipNo || "[M.No.]"})`}
<br/>Date: _______________</p>
</body></html>`;
}

/* 7 ─ ADT-1 ROC Filing Guide */
function genADT1Guide(f: F): string {
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
<tr><td><strong>Applicable Section:</strong></td><td>${secRef(f.appointmentType)}</td></tr>
<tr><td><strong>Trigger Event:</strong></td><td>${triggerLabel} on ${triggerDate}</td></tr>
</table>
</div>

<div class="warning-box">
<p class="bold" style="color:#b91c1c; font-size:14pt;">⚠ FILING DEADLINE: ${deadline}</p>
<p style="margin-top:6px;">ADT-1 must be filed within <strong>15 days</strong> of the ${triggerLabel}. Late filing attracts additional fees under Section 403 and can lead to adjudication proceedings.</p>
${isResignVacancy ? `<p style="margin-top:6px;"><strong>Note:</strong> For resignation vacancies — the Board fills the vacancy first; the General Meeting ratifies within 3 months. ADT-1 is filed after the General Meeting (not after the Board meeting).</p>` : ""}
${isFirst ? `<p style="margin-top:6px;"><strong>2025 Update:</strong> ADT-1 is now mandatory for first auditor appointments under Section 139(6) as per the Companies (Audit and Auditors) Amendment Rules, 2025 [G.S.R. 359(E)].</p>` : ""}
</div>

<div class="section">
<h3>STEP-BY-STEP FILING — MCA21 V3</h3>

<p class="para"><strong>Step 1 — Keep documents ready before opening MCA portal:</strong></p>
<ol>
<li>Certified true copy of the ${isSubsequent ? "AGM resolution" : "Board resolution"} — signed and dated</li>
<li>Auditor's written consent and certificate of eligibility under Rule 4(1) — signed by the auditor</li>
<li>Letter of Appointment issued by the Company</li>
${isResignVacancy ? `<li>Previous auditor's resignation letter (date: ${fmtDate(f.vacancyDate)})</li><li>Copy of ADT-3 filed by ${f.previousAuditorName || "the previous auditor"} within 30 days of resignation</li><li>Certified copy of General Meeting resolution ratifying the Board appointment</li>` : ""}
</ol>

<p class="para"><strong>Step 2 — Login to MCA21:</strong></p>
<ol>
<li>Visit <strong>www.mca.gov.in</strong> → MCA Services → e-Filing Services → Company e-Filing</li>
<li>Login with Company Director / Authorised Signatory (DSC-linked login)</li>
<li>Select Company (CIN: ${f.cin || "[CIN]"}) → Form Filing → Search Form ADT-1</li>
</ol>

<p class="para"><strong>Step 3 — Fill Form ADT-1:</strong></p>
<ol>
<li>Date of appointment / trigger event: <strong>${triggerDate}</strong></li>
<li>Type of auditor: <strong>${f.auditorType === "firm" ? "Firm of Chartered Accountants" : "Individual Chartered Accountant"}</strong></li>
${f.auditorType === "firm"
  ? `<li>Firm Name: <strong>${f.firmName || "[FIRM NAME]"}</strong></li><li>Firm Registration No. (FRN): <strong>${f.firmRegNo || "[FRN]"}</strong></li>`
  : `<li>Auditor Name: <strong>${f.auditorName || "[AUDITOR NAME]"}</strong></li><li>Membership No.: <strong>${f.membershipNo || "[M.No.]"}</strong></li>`}
<li>Auditor Address: <strong>${f.auditorAddress || "[ADDRESS]"}${f.auditorCity ? `, ${f.auditorCity}` : ""}</strong></li>
<li>Period of appointment: ${isFirst ? "Till conclusion of First AGM" : isSubsequent ? `${f.agmOrdinal || "1st"} AGM to ${sixthAgm(f.agmOrdinal || "1st")} AGM (5 years)` : "Till conclusion of next AGM"}</li>
</ol>

<p class="para"><strong>Step 4 — Attach documents (PDF, max 2MB each):</strong></p>
<ol>
<li>${isSubsequent ? "Certified extract of AGM minutes / AGM resolution" : "Certified true copy of Board resolution"}</li>
<li>Auditor's written consent and certificate of eligibility (Rule 4(1))</li>
</ol>

<p class="para"><strong>Step 5 — DSC and Submit:</strong></p>
<ol>
<li>Affix DSC of any Director or Company Secretary</li>
<li>Submit and note the SRN generated</li>
<li>ADT-1 is processed on STP (Straight-Through Processing) basis — no ROC officer processing needed</li>
<li>Download the Acknowledgement (SRN receipt) for Company records</li>
</ol>
</div>

<div class="section">
<h3>FILING FEES (per share capital)</h3>
<table>
<thead><tr><th>Paid-up Capital</th><th>Filing Fee</th></tr></thead>
<tbody>
<tr><td>Up to Rs. 1,00,000</td><td>Rs. 200</td></tr>
<tr><td>Rs. 1,00,001 to Rs. 4,99,999</td><td>Rs. 300</td></tr>
<tr><td>Rs. 5,00,000 to Rs. 24,99,999</td><td>Rs. 400</td></tr>
<tr><td>Rs. 25,00,000 to Rs. 99,99,999</td><td>Rs. 500</td></tr>
<tr><td>Rs. 1,00,00,000 and above</td><td>Rs. 600</td></tr>
</tbody>
</table>
<p class="italic" style="font-size:11pt; margin-top:6px;">Late filing fee applies after 15 days per Section 403. Adjudication may be initiated after 30 days.</p>
</div>

${isResignVacancy ? `
<div class="section">
<h3>ADT-3 — RESIGNING AUDITOR'S OBLIGATION</h3>
<div class="info-box">
<p class="para"><strong>Important:</strong> The <strong>resigning auditor</strong> (${f.previousAuditorName || "[PREVIOUS AUDITOR]"}) is required to file <strong>Form ADT-3</strong> with the Registrar of Companies within <strong>30 days</strong> of the resignation date (${fmtDate(f.vacancyDate)}), pursuant to Section 140(2) of the Companies Act, 2013.</p>
<p class="para">Please ensure you receive a copy of the filed ADT-3 from the outgoing auditor and retain it in Company records. The Company's ADT-1 (for the new auditor) is filed after the General Meeting ratification — not after the Board meeting.</p>
</div>
</div>
` : ""}

<div class="section">
<h3>KEY LEGAL POINTS</h3>
<ul>
<li>ADT-1 is filed by the <strong>Company</strong>, not the auditor.</li>
${isFirst ? `<li>Post July 14, 2025: ADT-1 filing is <strong>mandatory</strong> for first auditor appointments under Section 139(6) [Companies (Audit and Auditors) Amendment Rules, 2025].</li>` : ""}
${isSubsequent ? `<li>The appointment is for a <strong>5-year term</strong>. No annual ratification by members is required [Companies (Amendment) Act, 2017, effective May 7, 2018].</li><li>Special Resolution required only for a firm's <strong>second 5-year term</strong> under Section 139(2) in companies subject to rotation. For a first 5-year appointment, Ordinary Resolution suffices.</li>` : ""}
<li>Auditor's consent and certificate must be obtained <strong>before</strong> the meeting — not after or on the same day.</li>
<li>Certificate must explicitly cover all disqualifications under Section 141, including the audit ceiling per partner under Section 141(3)(g).</li>
${f.entityType === "pvt_ltd" ? `<li>Private companies with paid-up capital below Rs. 50 crore and public borrowings below Rs. 50 crore are <strong>exempt from the rotation requirement</strong> under Section 139(2) [Rule 5, as amended in 2017].</li>` : ""}
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const docs = useMemo(() => {
    if (f.appointmentType === "first_auditor") {
      return [
        { key: "board_notice", label: "Board Notice", emoji: "📬", gen: () => genBoardNotice(f) },
        { key: "board_ctc", label: "Board Resolution CTC", emoji: "⚖️", gen: () => genBoardCTC(f) },
        { key: "consent", label: "Auditor Consent & Certificate", emoji: "✅", gen: () => genAuditorConsent(f) },
        { key: "letter", label: "Letter of Appointment", emoji: "📄", gen: () => genLetterOfAppointment(f) },
        { key: "adt1", label: "ADT-1 ROC Guide", emoji: "📋", gen: () => genADT1Guide(f) },
      ];
    }
    if (f.appointmentType === "subsequent") {
      return [
        { key: "agm_notice", label: "AGM Notice", emoji: "📬", gen: () => genAGMNotice(f) },
        { key: "agm_ctc", label: "AGM Resolution CTC", emoji: "⚖️", gen: () => genAGMCTC(f) },
        { key: "consent", label: "Auditor Consent & Certificate", emoji: "✅", gen: () => genAuditorConsent(f) },
        { key: "letter", label: "Letter of Appointment", emoji: "📄", gen: () => genLetterOfAppointment(f) },
        { key: "adt1", label: "ADT-1 ROC Guide", emoji: "📋", gen: () => genADT1Guide(f) },
      ];
    }
    // casual_vacancy
    return [
      { key: "board_notice", label: "Board Notice", emoji: "📬", gen: () => genBoardNotice(f) },
      { key: "board_ctc", label: "Board Resolution CTC", emoji: "⚖️", gen: () => genBoardCTC(f) },
      { key: "consent", label: "Auditor Consent & Certificate", emoji: "✅", gen: () => genAuditorConsent(f) },
      { key: "letter", label: "Letter of Appointment", emoji: "📄", gen: () => genLetterOfAppointment(f) },
      { key: "adt1", label: "ADT-1 ROC Guide", emoji: "📋", gen: () => genADT1Guide(f) },
    ];
  }, [f]);

  function openPreview(label: string, html: string) {
    const final = session ? html : injectPreviewWatermark(html);
    setPreviewLabel(label);
    setPreview(final);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
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
              <p className="text-white/30 text-xs font-bold uppercase tracking-wider mb-2">Documents</p>
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
                <button onClick={() => setStep(step - 1)}
                  className="px-4 py-2 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:border-slate-300 transition-colors">
                  ← Back
                </button>
              )}
              {step < 5 && (
                <button onClick={() => setStep(step + 1)}
                  className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 transition-all shadow-sm">
                  Continue →
                </button>
              )}
              {step === 5 && (
                <button onClick={() => { setStep(1); setF(DEFAULT); setPreview(null); }}
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
                      onSelect={(c: CompanyData) => {
                        setCompanySearchVal(c.company_name || "");
                        setF(p => ({
                          ...p,
                          companyName: c.company_name || "",
                          cin: c.cin || "",
                          regAddress: [c.registered_address, c.city, c.state].filter(Boolean).join(", "),
                          entityType: (c.company_category || "").toLowerCase().includes("public") ? "pub_ltd" : "pvt_ltd",
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
                  </div>
                </SectionCard>

                <SectionCard title="">
                  <CompanyExcelUpload onFill={(c: CompanyData) => setF(p => ({
                    ...p,
                    companyName: c.company_name || "",
                    cin: c.cin || "",
                    regAddress: [c.registered_address, c.city, c.state].filter(Boolean).join(", "),
                    entityType: (c.company_category || "").toLowerCase().includes("public") ? "pub_ltd" : "pvt_ltd",
                  }))} />
                </SectionCard>
              </div>
            )}

            {/* ─ STEP 2: Appointment Type ─ */}
            {step === 2 && (
              <div className="space-y-5">
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
                        desc: "Members appoint at AGM for 5-year term. No annual ratification required since Companies (Amendment) Act, 2017.",
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
                              f.vacancyReason === "resignation"
                                ? "border-amber-500 bg-amber-50 text-amber-700"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            }`}>
                            Resignation
                          </button>
                          <button onClick={() => setF(p => ({ ...p, vacancyReason: "other" }))}
                            className={`flex-1 py-2.5 px-4 rounded-xl border-2 text-sm font-bold transition-all ${
                              f.vacancyReason === "other"
                                ? "border-amber-500 bg-amber-50 text-amber-700"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
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
                            <li>Resigning auditor files <strong>ADT-3</strong> within 30 days of resignation date</li>
                            <li>Board fills vacancy and issues recommendation within <strong>30 days</strong></li>
                            <li>General Meeting ratifies Board recommendation within <strong>3 months</strong> of Board recommendation</li>
                            <li>Company files <strong>ADT-1</strong> within 15 days of <strong>General Meeting</strong> (not Board meeting)</li>
                          </ol>
                        </div>
                      )}
                    </div>
                  </SectionCard>
                )}

                {f.appointmentType === "subsequent" && (
                  <SectionCard title="AGM Number">
                    <Field label="This is the ___ Annual General Meeting" hint="Auditor holds office from this AGM to the 5th subsequent AGM.">
                      <select className={ic()} value={f.agmOrdinal}
                        onChange={e => setF(p => ({ ...p, agmOrdinal: e.target.value }))}>
                        {["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"].map(n => (
                          <option key={n} value={n}>{n} AGM</option>
                        ))}
                      </select>
                    </Field>
                    {f.agmOrdinal && (
                      <p className="text-xs text-teal-700 bg-teal-50 rounded-lg px-3 py-2 mt-3">
                        Auditor will hold office from conclusion of <strong>{f.agmOrdinal} AGM</strong> to conclusion of <strong>{sixthAgm(f.agmOrdinal)} AGM</strong> (five years).
                      </p>
                    )}
                  </SectionCard>
                )}

                <SectionCard title="Documents That Will Be Generated">
                  <div className="grid grid-cols-3 gap-2 text-xs text-center sm:grid-cols-5">
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
                <SectionCard title="Auditor Type">
                  <div className="flex gap-3">
                    {([
                      { val: "firm" as AuditorType, icon: "🏢", label: "CA Firm" },
                      { val: "individual" as AuditorType, icon: "👤", label: "Individual CA" },
                    ]).map(opt => (
                      <button key={opt.val} onClick={() => setF(p => ({ ...p, auditorType: opt.val }))}
                        className={`flex-1 py-4 px-4 rounded-xl border-2 text-center font-bold text-sm transition-all ${
                          f.auditorType === opt.val
                            ? "border-teal-500 bg-teal-50 text-teal-700 shadow-sm"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
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
                      <Field label="Firm Registration Number (FRN)" hint="6-digit number issued by ICAI (e.g., 123456W)">
                        <input className={ic()} value={f.firmRegNo}
                          onChange={e => setF(p => ({ ...p, firmRegNo: e.target.value }))}
                          placeholder="123456W" />
                      </Field>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Signing Partner Name">
                          <input className={ic()} value={f.partnerName}
                            onChange={e => setF(p => ({ ...p, partnerName: e.target.value }))}
                            placeholder="CA Ramesh Kumar" />
                        </Field>
                        <Field label="Partner Membership No.">
                          <input className={ic()} value={f.partnerMembershipNo}
                            onChange={e => setF(p => ({ ...p, partnerMembershipNo: e.target.value }))}
                            placeholder="098765" />
                        </Field>
                      </div>
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
                      <Field label="Membership Number" hint="6-digit ICAI membership number">
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
                <SectionCard title="Meeting Details">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Field label={f.appointmentType === "subsequent" ? "AGM Date" : "Board Meeting Date"}>
                        <input type="date" className={ic()} value={f.meetingDate}
                          onChange={e => setF(p => ({ ...p, meetingDate: e.target.value }))} />
                      </Field>
                      <Field label="Meeting Time">
                        <input type="time" className={ic()} value={f.meetingTime}
                          onChange={e => setF(p => ({ ...p, meetingTime: e.target.value }))} />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Meeting Serial / Number"
                        hint={f.appointmentType === "subsequent" ? "e.g., 1st AGM" : "e.g., BM-03/2025-26"}>
                        <input className={ic()} value={f.meetingSerial}
                          onChange={e => setF(p => ({ ...p, meetingSerial: e.target.value }))}
                          placeholder={f.appointmentType === "subsequent" ? "1st AGM" : "BM-03/2025"} />
                      </Field>
                      <Field label="Venue / Platform">
                        <input className={ic()} value={f.venue}
                          onChange={e => setF(p => ({ ...p, venue: e.target.value }))}
                          placeholder="Registered office / via VC" />
                      </Field>
                    </div>
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
                    <p className="text-xs text-slate-500">Directors present at the meeting</p>
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
                        ? `Board fills vacancy first (within 30 days). Then convene General Meeting within 3 months of Board recommendation (from ${fmtDate(f.meetingDate)}). File ADT-1 within 15 days of the General Meeting.`
                        : `ADT-1 must be filed by ${addDays(f.meetingDate, 15)} (within 15 days of ${fmtDate(f.meetingDate)}).`
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
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-800">{previewLabel}</h3>
                      <div className="flex items-center gap-2">
                        <button onClick={() => printDoc(preview)}
                          className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-teal-600 to-teal-700 shadow-sm">
                          🖨️ Print / Download
                        </button>
                        <button onClick={() => setPreview(null)}
                          className="px-4 py-2 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:border-slate-300">
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
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button onClick={() => openPreview(doc.label, doc.gen())}
                                className="px-3 py-1.5 rounded-lg border-2 border-teal-200 text-teal-700 text-xs font-bold hover:bg-teal-50 transition-colors">
                                Preview
                              </button>
                              <button onClick={() => printDoc(doc.gen())}
                                className="px-3 py-1.5 rounded-lg text-white text-xs font-bold bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 transition-all">
                                Print
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </SectionCard>

                    <SectionCard title="">
                      <button
                        onClick={() => docs.forEach((doc, i) => setTimeout(() => printDoc(doc.gen()), i * 900))}
                        className="w-full py-3 rounded-xl text-white font-bold text-sm bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 transition-all shadow-sm">
                        🖨️ Print All {docs.length} Documents
                      </button>
                      <p className="text-xs text-slate-400 text-center mt-2">
                        Opens each document in a separate print dialog
                      </p>
                    </SectionCard>
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
