/**
 * MGT-7 / MGT-7A CTC — Extract of Board Resolution
 * Appointment of Designated Person to furnish information to ROC
 * under Rule 9, Section 89 & 90 of Companies Act 2013
 */

import type { AnnualFilingData } from "../types";
import { fmtDate, wrapPage } from "../utils";

export function generateMGT7CTC(data: AnnualFilingData): string {
  const meetingDate  = fmtDate(data.dateOfReport) || "________________";
  const meetingTime  = data.mgt7MeetingTime  || "11.00 A.M.";
  const meetingVenue = data.mgt7MeetingVenue || "Registered Office of the Company";

  const dir1 = data.signatoryDirectors.director1;
  const dir2 = data.signatoryDirectors.director2;

  // Build the designated persons string for the resolution body
  let designatedPersons = dir1.name || "________________";
  if (dir2?.name) designatedPersons += ` AND ${dir2.name}`;

  // Signature block
  const sig1 = `
    <div class="sig-col">
      ${dir1.signatureBase64 ? `<img src="data:image/jpeg;base64,${dir1.signatureBase64}" style="height:36pt;max-width:120pt;display:block;object-fit:contain;">` : ""}
      <div class="sig-line"${dir1.signatureBase64 ? ' style="margin-top:4pt"' : ""}>
        <strong>${dir1.name || "________________"}</strong><br>
        ${dir1.designation || "Director"}<br>
        DIN: ${dir1.din || "________________"}
      </div>
    </div>`;

  const sig2 = dir2?.name ? `
    <div class="sig-col">
      ${dir2.signatureBase64 ? `<img src="data:image/jpeg;base64,${dir2.signatureBase64}" style="height:36pt;max-width:120pt;display:block;object-fit:contain;">` : ""}
      <div class="sig-line"${dir2.signatureBase64 ? ' style="margin-top:4pt"' : ""}>
        <strong>${dir2.name}</strong><br>
        ${dir2.designation || "Director"}<br>
        DIN: ${dir2.din || "________________"}
      </div>
    </div>` : "";

  const bodyHtml = `

<!-- ══════════════ HEADER ══════════════ -->
<div class="header-block">
  <div class="company-name">${data.companyName}</div>
  <div class="cin-line">Registered Address: ${data.regAddress}</div>
  <div class="cin-line">CIN: ${data.cin}</div>
  ${data.companyEmail ? `<div class="cin-line">Email : ${data.companyEmail}${data.companyPhone ? ` &nbsp;&nbsp; Contact No: ${data.companyPhone}` : ""}</div>` : ""}
</div>

<hr>

<!-- ══════════════ RESOLUTION TITLE ══════════════ -->
<p class="res-title bold center">
  EXTRACT OF RESOLUTION PASSED IN THE BOARD MEETING OF ${data.companyName.toUpperCase()}
  HELD ON ${meetingDate} AT ${meetingTime} AT THE ${meetingVenue.toUpperCase()} OF THE
  COMPANY AT ${data.regAddress}
</p>

<hr>

<!-- ══════════════ SUBJECT ══════════════ -->
<p class="bold mt-8">
  Appointment of Designated Person to furnish information to Registrar of Companies with
  respect to Beneficial Interests in the Shares of the Company pursuant to Rule 9 of the
  Companies (Management and Administration) Rules, 2013.
</p>

<!-- ══════════════ RESOLUTION ══════════════ -->
<p class="mt-8 justified">
  "RESOLVED THAT pursuant to Rule 9 of the Companies (Management and Administration) Rules,
  2013 read with the provisions of Section 89 and 90 of the Companies Act, 2013; the Companies
  (Management and Administration) Rules, 2014 and such other applicable provisions of the
  Companies Act, 2013 and Rules made thereunder;
</p>

<p class="justified">
  The Board of Directors does hereby appoint <strong>${designatedPersons}</strong> as
  ${dir2?.name ? "Directors" : "Director"} of the Company as the Designated
  ${dir2?.name ? "Persons" : "Person"} for furnishing information to the Registrar of
  Companies or any such other Authority with respect to beneficial interests in the shares
  of the Company."
</p>

<!-- ══════════════ AUTHORITY LINE ══════════════ -->
<div class="mt-16">
  <p>For and on the behalf of the Board</p>
  <p>FOR:- ${data.companyName.toUpperCase()}</p>
</div>

<!-- ══════════════ SIGNATURE ══════════════ -->
<div class="sig-block">
  <div class="sig-row">
    ${sig1}
    ${sig2}
  </div>
  <p class="mt-16">
    Date: ${fmtDate(data.dateOfReport) || "________________"}&nbsp;&nbsp;&nbsp;&nbsp;
    Place: ${data.placeOfSigning || "________________"}
  </p>
</div>

`;

  const extraCSS = `
    p { margin-bottom: 8pt; text-align: justify; }
    p.center { text-align: center; }
    p.res-title { font-size: 11pt; line-height: 1.7; margin-top: 10pt; }
    p.justified { text-align: justify; }
    hr { border: none; border-top: 1pt solid #333; margin: 12pt 0; }
    .bold { font-weight: bold; }
    .mt-8  { margin-top: 8pt; }
    .mt-16 { margin-top: 16pt; }
    .sig-block { margin-top: 20pt; }
    .sig-row { display: flex; justify-content: space-between; margin-top: 30pt; }
    .sig-col { width: 45%; }
    .sig-col .sig-line { border-top: 1px solid #000; padding-top: 4pt; margin-top: 30pt; }
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MGT-7 CTC — ${data.companyName}</title>
<style>
  @page { size: A4 portrait; margin: 20mm; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    color: #000;
    background: #fff;
    line-height: 1.6;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @media screen {
    html { background: #c8c8c8; }
    body { width: 170mm; margin: 20mm auto; }
  }
  @media print {
    body { width: 170mm; margin: 0 auto; }
  }
  .header-block { text-align: center; margin-bottom: 10pt; }
  .header-block .company-name { font-size: 14pt; font-weight: bold; text-transform: uppercase; }
  .header-block .cin-line { font-size: 10pt; margin-top: 2pt; }
  ${extraCSS}
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}
