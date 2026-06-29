/**
 * Details of Directors
 * Attachment for AOC-4 filing
 * 14-column format as per Companies Act 2013
 */

import type { AnnualFilingData } from "../../types";
import { buildPageSigFooter, fmtDate, fyEndYear, parseIndian, sigCol } from "../../utils";

export function generateDirectorList(data: AnnualFilingData): string {
  const fy    = data.financialYear;
  const fyEnd = fyEndYear(fy);

  const allDirectors = data.directors;

  const rows = allDirectors.length > 0
    ? allDirectors.map((d, i) => `
    <tr>
      <td class="center">${i + 1}</td>
      <td>${d.din || "—"}</td>
      <td>${d.name}</td>
      <td>${d.nationality || "Indian"}</td>
      <td>${d.fatherName || "—"}</td>
      <td class="center">${d.dateOfBirth ? fmtDate(d.dateOfBirth) : "—"}</td>
      <td>${d.designation}</td>
      <td>${d.category || "—"}</td>
      <td>${d.occupation || "—"}</td>
      <td>${d.email || "—"}</td>
      <td class="center">${d.sharesHeld !== undefined && d.sharesHeld !== null ? d.sharesHeld.toLocaleString("en-IN") : "—"}</td>
      <td class="center">${fmtDate(d.dateOfAppointment) || "—"}</td>
      <td class="center">${d.dateOfCessation ? fmtDate(d.dateOfCessation) : "—"}</td>
      <td>${d.address || "—"}</td>
    </tr>`).join("")
    : `<tr><td colspan="14" class="center">No directors found</td></tr>`;

  const authorisedCapital = data.financials?.authorisedCapital
    ? `₹${parseIndian(data.financials.authorisedCapital).toLocaleString("en-IN")}`
    : "—";
  const paidUpCapital = data.financials?.paidUpCapital
    ? `₹${parseIndian(data.financials.paidUpCapital).toLocaleString("en-IN")}`
    : "—";

  const bodyHtml = `

<!-- ══════════════ HEADER ══════════════ -->
<div class="header-block">
  <div class="company-name">${data.companyName}</div>
  <div class="cin-line">CIN: ${data.cin}</div>
  <div class="cin-line">Registered Office: ${data.regAddress}</div>
  <div class="doc-title">DETAILS OF DIRECTORS</div>
  <div class="fy-line">As on 31<sup>st</sup> March, ${fyEnd} &nbsp;|&nbsp; Financial Year ${fy}</div>
</div>

<!-- ══════════════ CAPITAL INFO ══════════════ -->
<table class="capital-table">
  <tr>
    <th>Authorised Share Capital</th>
    <td>${authorisedCapital}</td>
    <th>Paid-Up Capital</th>
    <td>${paidUpCapital}</td>
  </tr>
</table>

<!-- ══════════════ DIRECTORS TABLE ══════════════ -->
<table class="dir-table">
  <thead>
    <tr>
      <th class="center" style="width:3%">SN</th>
      <th style="width:6%">DIN</th>
      <th style="width:9%">Name</th>
      <th style="width:6%">Nationality</th>
      <th style="width:8%">Father's Name</th>
      <th class="center" style="width:7%">DOB</th>
      <th style="width:8%">Designation</th>
      <th style="width:7%">Category</th>
      <th style="width:6%">Occupation</th>
      <th style="width:8%">Email-Id</th>
      <th class="center" style="width:5%">Equity Shares Held</th>
      <th class="center" style="width:7%">Date of Appointment</th>
      <th class="center" style="width:7%">Date of Ceasing</th>
      <th style="width:13%">Residential Address</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
</table>

<!-- ══════════════ DECLARATION ══════════════ -->
<div class="mt-16">
  <p>I hereby certify that the above information is true and correct to the best of my knowledge and belief.</p>
</div>

<!-- ══════════════ SIGNATURE ══════════════ -->
<div class="sig-block">
  <p>For and on behalf of the Board of Directors of<br>
  <strong>${data.companyName}</strong></p>

  <div class="sig-row">
    ${sigCol(data.signatoryDirectors.director1)}
    ${data.signatoryDirectors.director2?.name ? sigCol(data.signatoryDirectors.director2) : ""}
    ${data.signatoryDirectors.director3?.name ? sigCol(data.signatoryDirectors.director3) : ""}
  </div>

  <p class="mt-16">
    Place: ${data.placeOfSigning || "________________"}<br>
    Date: ${fmtDate(data.dateOfReport) || "________________"}
  </p>
</div>

`;

  // Landscape page with smaller font for 14 columns
  const landscapeCSS = `
    @page { size: A4 landscape; margin: 0; }
    @media screen {
      html { background: #c8c8c8; }
      body { width: 247mm; margin: 15mm auto; }
    }
    @media print {
      body { width: 247mm; margin: 0 auto; padding-top: 15mm; }
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 9pt;
      color: #000;
      background: #fff;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    p, li, td, th, span, div { overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; }
    .header-block { text-align: center; margin-bottom: 10pt; }
    .header-block .company-name { font-size: 13pt; font-weight: bold; text-transform: uppercase; }
    .header-block .cin-line { font-size: 8.5pt; margin-top: 2pt; }
    .header-block .doc-title { font-size: 12pt; font-weight: bold; margin-top: 8pt; text-decoration: underline; letter-spacing: 0.5pt; }
    .header-block .fy-line { font-size: 9pt; margin-top: 3pt; }
    sup { font-size: 7pt; vertical-align: super; line-height: 0; }

    .capital-table {
      width: 60%; margin: 0 auto 10pt auto;
      border-collapse: collapse; font-size: 9pt;
    }
    .capital-table th, .capital-table td {
      border: 1px solid #444; padding: 3pt 6pt;
    }
    .capital-table th { background: #f0f0f0; font-weight: bold; }

    .dir-table {
      width: 100%; border-collapse: collapse;
      margin-bottom: 10pt; font-size: 7.5pt;
      table-layout: fixed;
    }
    .dir-table th {
      background: #f0f0f0; font-weight: bold;
      padding: 3pt 4pt; border: 1px solid #444;
      text-align: left; overflow-wrap: break-word; word-break: break-word;
    }
    .dir-table td {
      padding: 3pt 4pt; border: 1px solid #444;
      vertical-align: top; overflow-wrap: break-word; word-break: break-word;
    }
    .center { text-align: center; }

    .mt-16 { margin-top: 12pt; }
    p { margin-bottom: 6pt; text-align: justify; font-size: 9pt; }

    .sig-block { margin-top: 20pt; }
    .sig-row { display: flex; justify-content: space-between; gap: 16pt; margin-top: 24pt; }
    .sig-col { flex: 1; min-width: 0; }
    .sig-col .sig-line { border-top: 1px solid #000; padding-top: 3pt; margin-top: 24pt; font-size: 9pt; }

    @media screen { .page-sig-footer { margin-top: 40pt; } }
    @media print {
      .page-sig-footer { position: fixed; bottom: 0; left: 0; right: 0; height: 20mm; padding: 4pt 0 2pt; margin: 0; z-index: 9999; }
      .has-page-footer { padding-bottom: 24mm; }
    }
    .page-sig-footer { display: flex; align-items: flex-end; justify-content: space-between; gap: 6pt; background: white; border-top: 0.5pt solid #666; }
    .psf-slot { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 0; padding-top: 4pt; }
    .psf-sig-img { max-height: 26pt; max-width: 86pt; object-fit: contain; display: block; }
    .psf-name { font-size: 7pt; font-weight: bold; text-align: center; margin-top: 2pt; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
    .psf-sub  { font-size: 6pt; color: #333; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
  `;

  const d1 = data.signatoryDirectors.director1;
  const d2 = data.signatoryDirectors.director2;
  const d3 = data.signatoryDirectors.director3;
  const pageSigs = [
    { name: d1?.name, designation: d1?.designation, din: d1?.din, signatureBase64: d1?.signatureBase64 },
    ...(d2?.name ? [{ name: d2.name, designation: d2.designation, din: d2.din, signatureBase64: d2.signatureBase64 }] : []),
    ...(d3?.name ? [{ name: d3.name, designation: d3.designation, din: d3.din, signatureBase64: d3.signatureBase64 }] : []),
  ];
  const pageFooter = buildPageSigFooter(pageSigs);
  const bodyAttr = pageFooter ? ' class="has-page-footer"' : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Details of Directors — ${data.companyName} — FY ${fy}</title>
<style>${landscapeCSS}</style>
</head>
<body${bodyAttr}>
${bodyHtml}
${pageFooter}
</body>
</html>`;
}
