/**
 * Director List as on 31st March
 * Attachment for AOC-4 filing
 * Contains full details of Board composition as required for annual filing
 */

import type { AnnualFilingData } from "../types";
import { fmtDate, fyEndYear, wrapPage } from "../utils";

export function generateDirectorList(data: AnnualFilingData): string {
  const fy    = data.financialYear;
  const fyEnd = fyEndYear(fy);

  const activeDirectors    = data.directors.filter(d => d.isActive);
  const resignedDirectors  = data.directors.filter(d => !d.isActive && d.changedDuringYear);

  const activeRows = activeDirectors.map((d, i) => `
    <tr>
      <td class="center">${i + 1}</td>
      <td>${d.name}</td>
      <td>${d.din || "—"}</td>
      <td>${d.pan || "—"}</td>
      <td>${d.designation}</td>
      <td>${d.category || "—"}</td>
      <td class="center">${fmtDate(d.dateOfAppointment)}</td>
      <td class="center">—</td>
      <td class="center">Active</td>
    </tr>`).join("");

  const resignedRows = resignedDirectors.length > 0
    ? resignedDirectors.map((d, i) => `
    <tr>
      <td class="center">${i + 1}</td>
      <td>${d.name}</td>
      <td>${d.din || "—"}</td>
      <td>${d.pan || "—"}</td>
      <td>${d.designation}</td>
      <td>${d.category || "—"}</td>
      <td class="center">${fmtDate(d.dateOfAppointment)}</td>
      <td class="center">${d.dateOfCessation ? fmtDate(d.dateOfCessation) : "—"}</td>
      <td class="center">Ceased</td>
    </tr>`).join("")
    : `<tr><td colspan="9" class="center">No changes in directorship during the year</td></tr>`;

  const bodyHtml = `

<!-- ══════════════ HEADER ══════════════ -->
<div class="header-block">
  <div class="company-name">${data.companyName}</div>
  <div class="cin-line">CIN: ${data.cin}</div>
  <div class="cin-line">Registered Office: ${data.regAddress}</div>
  <div class="doc-title">LIST OF DIRECTORS</div>
  <div class="fy-line">As on 31<sup>st</sup> March, ${fyEnd}</div>
  <div class="fy-line">(For the Financial Year ${fy})</div>
</div>

<!-- ══════════════ ACTIVE DIRECTORS ══════════════ -->
<h2>A. Directors as on 31<sup>st</sup> March, ${fyEnd}</h2>
<table>
  <tr>
    <th class="center" style="width:4%">Sl.</th>
    <th style="width:20%">Name of Director</th>
    <th style="width:11%">DIN</th>
    <th style="width:11%">PAN</th>
    <th style="width:16%">Designation</th>
    <th style="width:12%">Category</th>
    <th class="center" style="width:13%">Date of Appointment</th>
    <th class="center" style="width:8%">Date of Cessation</th>
    <th class="center" style="width:5%">Status</th>
  </tr>
  ${activeRows || `<tr><td colspan="9" class="center">No active directors found</td></tr>`}
</table>

<!-- ══════════════ CHANGES DURING YEAR ══════════════ -->
<h2 class="mt-16">B. Changes in Directorship during Financial Year ${fy}</h2>
<table>
  <tr>
    <th class="center" style="width:4%">Sl.</th>
    <th style="width:20%">Name of Director</th>
    <th style="width:11%">DIN</th>
    <th style="width:11%">PAN</th>
    <th style="width:16%">Designation</th>
    <th style="width:12%">Category</th>
    <th class="center" style="width:13%">Date of Appointment</th>
    <th class="center" style="width:8%">Date of Cessation</th>
    <th class="center" style="width:5%">Status</th>
  </tr>
  ${resignedRows}
</table>

<!-- ══════════════ DECLARATION ══════════════ -->
<div class="mt-24">
  <p>I hereby certify that the above information is true and correct to the best of my knowledge and belief.</p>
</div>

<!-- ══════════════ SIGNATURE ══════════════ -->
<div class="sig-block">
  <p>For and on behalf of the Board of Directors of<br>
  <strong>${data.companyName}</strong></p>

  <div class="sig-row">
    <div class="sig-col">
      <div class="sig-line">
        <strong>${data.signatoryDirectors.director1.name || "________________"}</strong><br>
        ${data.signatoryDirectors.director1.designation || "Director"}<br>
        DIN: ${data.signatoryDirectors.director1.din || "________________"}
      </div>
    </div>
    ${data.signatoryDirectors.director2?.name ? `
    <div class="sig-col">
      <div class="sig-line">
        <strong>${data.signatoryDirectors.director2.name}</strong><br>
        ${data.signatoryDirectors.director2.designation || "Director"}<br>
        DIN: ${data.signatoryDirectors.director2.din || "________________"}
      </div>
    </div>` : ""}
  </div>

  <p class="mt-16">
    Place: ${data.placeOfSigning || "________________"}<br>
    Date: ${fmtDate(data.dateOfReport) || "________________"}
  </p>
</div>

`;

  return wrapPage(
    `Director List — ${data.companyName} — FY ${fy}`,
    bodyHtml
  );
}
