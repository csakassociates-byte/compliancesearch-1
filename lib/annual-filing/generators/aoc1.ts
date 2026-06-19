/**
 * AOC-1 — Statement containing salient features of financial statements
 *   of subsidiaries / associate companies / joint ventures
 * Pursuant to: First proviso to Section 129(3) of the Companies Act, 2013
 * Rule: Rule 5 of the Companies (Accounts) Rules, 2014
 *
 * Structure:
 *   Part A — Subsidiaries
 *   Part B — Associates and Joint Ventures
 *
 * Applicable to ALL 4 company types IF they have subsidiaries/associates/JVs.
 * Even companies exempt from consolidated financial statements must attach
 * AOC-1 if they have subsidiaries [MCA Clarification].
 *
 * Note: OPC CANNOT have subsidiaries (Sec. 2(62) — sole member company).
 *   However, if an OPC is a subsidiary of another company, that parent
 *   needs AOC-1. For generation purposes, we allow all types.
 */

import type { AnnualFilingData, SubsidiaryRecord } from "../types";
import { fmtDate, fyEndYear, wrapPage } from "../utils";

function renderPartA(
  subsidiaries: SubsidiaryRecord[],
  fyEnd: string
): string {
  const subs = subsidiaries.filter(s => s.type === "subsidiary");
  if (subs.length === 0) {
    return `<h2>Part A — Subsidiaries</h2>
    <p>The Company does not have any subsidiary as on 31<sup>st</sup> March, ${fyEnd}. Hence, Part A is not applicable.</p>`;
  }

  const rows = subs.map((s, i) => `
    <tr>
      <td class="center">${i + 1}</td>
      <td>${s.name}</td>
      <td>${s.cin || "—"}</td>
      <td>${s.reportingPeriod || `01/04/${Number(fyEnd) - 1} to 31/03/${fyEnd}`}</td>
      <td>${s.currency || "INR"}</td>
      <td class="right">${s.exchangeRate || "1"}</td>
      <td class="right">${s.shareCapital || "—"}</td>
      <td class="right">${s.reservesSurplus || "—"}</td>
      <td class="right">${s.totalAssets || "—"}</td>
      <td class="right">${s.totalLiabilities || "—"}</td>
      <td class="right">${s.investments || "—"}</td>
      <td class="right">${s.turnover || "—"}</td>
      <td class="right">${s.profitBeforeTax || "—"}</td>
      <td class="right">${s.provisionForTax || "—"}</td>
      <td class="right">${s.profitAfterTax || "—"}</td>
      <td class="right">${s.proposedDividend || "—"}</td>
      <td class="right">${s.percentShareholding || "—"}%</td>
    </tr>`).join("");

  return `
<h2>Part A — Subsidiaries</h2>
<p><em>(Amount in ₹ unless otherwise stated)</em></p>
<div style="overflow-x:auto;">
<table style="font-size:10pt; min-width:1200px;">
  <tr>
    <th class="center" style="width:3%">Sl.</th>
    <th style="width:12%">Name of Subsidiary</th>
    <th style="width:10%">CIN / LLPIN</th>
    <th style="width:10%">Reporting Period</th>
    <th style="width:5%">Currency</th>
    <th class="right" style="width:6%">Exchange Rate</th>
    <th class="right" style="width:7%">Share Capital</th>
    <th class="right" style="width:7%">Reserves &amp; Surplus</th>
    <th class="right" style="width:7%">Total Assets</th>
    <th class="right" style="width:7%">Total Liabilities</th>
    <th class="right" style="width:6%">Investments</th>
    <th class="right" style="width:6%">Turnover</th>
    <th class="right" style="width:6%">PBT</th>
    <th class="right" style="width:6%">Provision for Tax</th>
    <th class="right" style="width:6%">PAT</th>
    <th class="right" style="width:6%">Proposed Dividend</th>
    <th class="right" style="width:5%">% Shareholding</th>
  </tr>
  ${rows}
</table>
</div>
<p class="mt-8"><em>Notes:</em></p>
<ol>
  <li>Names of subsidiaries which are yet to commence operations: Nil (unless stated separately).</li>
  <li>Names of subsidiaries which have been liquidated or sold during the year: Nil (unless stated separately).</li>
</ol>`;
}

function renderPartB(
  subsidiaries: SubsidiaryRecord[],
  fyEnd: string
): string {
  const assocJV = subsidiaries.filter(s => s.type === "associate" || s.type === "joint_venture");
  if (assocJV.length === 0) {
    return `<h2>Part B — Associates and Joint Ventures</h2>
    <p>The Company does not have any associate company or joint venture as on 31<sup>st</sup> March, ${fyEnd}. Hence, Part B is not applicable.</p>`;
  }

  const rows = assocJV.map((s, i) => `
    <tr>
      <td class="center">${i + 1}</td>
      <td>${s.name}</td>
      <td>${s.cin || "—"}</td>
      <td>${s.type === "joint_venture" ? "Joint Venture" : "Associate"}</td>
      <td>${s.reportingPeriod || `01/04/${Number(fyEnd) - 1} to 31/03/${fyEnd}`}</td>
      <td class="right">${s.percentShareholding || "—"}%</td>
      <td class="right">${s.reservesSurplus || "—"}</td>
      <td class="right">${s.profitAfterTax || "—"}</td>
      <td class="right">${s.profitAfterTax || "—"}</td>
      <td class="right">${s.proposedDividend || "—"}</td>
    </tr>`).join("");

  return `
<h2>Part B — Associates and Joint Ventures</h2>
<p><em>Statement pursuant to Section 129(3) of the Companies Act, 2013 related to Associate Companies and Joint Ventures</em></p>
<p><em>(Amount in ₹ unless otherwise stated)</em></p>
<table style="font-size:10pt;">
  <tr>
    <th class="center" style="width:4%">Sl.</th>
    <th style="width:18%">Name of Associate / JV</th>
    <th style="width:12%">CIN / LLPIN</th>
    <th style="width:10%">Type</th>
    <th style="width:12%">Reporting Period</th>
    <th class="right" style="width:10%">Extent of Holding (%)</th>
    <th class="right" style="width:12%">Net Worth Attributable to Shareholding</th>
    <th class="right" style="width:10%">Profit / Loss for the year (Total)</th>
    <th class="right" style="width:10%">Profit / Loss Considered in Consolidation</th>
    <th class="right" style="width:12%">Proposed Dividend</th>
  </tr>
  ${rows}
</table>
<p class="mt-8"><em>Notes:</em></p>
<ol>
  <li>Names of associates or joint ventures which are yet to commence operations: Nil (unless stated separately).</li>
  <li>Names of associates or joint ventures which have been liquidated or sold during the year: Nil (unless stated separately).</li>
</ol>`;
}

export function generateAOC1(data: AnnualFilingData): string {
  const fy    = data.financialYear;
  const fyEnd = fyEndYear(fy);

  const subsidiaries = data.subsidiaries || [];
  const sig1 = data.signatoryDirectors.director1;
  const sig2 = data.signatoryDirectors.director2;
  const reportDate  = fmtDate(data.dateOfReport);
  const reportPlace = data.placeOfSigning || "";

  const bodyHtml = `

<!-- ══════════════ HEADER ══════════════ -->
<div class="header-block">
  <div class="company-name">${data.companyName}</div>
  <div class="cin-line">CIN: ${data.cin}</div>
  <div class="doc-title">FORM AOC-1</div>
  <div class="fy-line">Statement containing salient features of the financial statement of<br>
  subsidiaries / associate companies / joint ventures</div>
  <div class="fy-line">[Pursuant to first proviso to sub-section (3) of Section 129 read with<br>
  Rule 5 of Companies (Accounts) Rules, 2014]</div>
  <div class="fy-line mt-8">For the Financial Year ended 31<sup>st</sup> March, ${fyEnd}</div>
</div>

<!-- ══════════════ PART A ══════════════ -->
${renderPartA(subsidiaries, fyEnd)}

<!-- ══════════════ PART B ══════════════ -->
<div class="mt-24">
${renderPartB(subsidiaries, fyEnd)}
</div>

<!-- ══════════════ SIGNATURE ══════════════ -->
<div class="sig-block">
  <p>For and on behalf of the Board of Directors of<br>
  <strong>${data.companyName}</strong></p>

  <div class="sig-row">
    <div class="sig-col">
      <div class="sig-line">
        <strong>${sig1.name || "________________"}</strong><br>
        ${sig1.designation || "Director"}<br>
        DIN: ${sig1.din || "________________"}
      </div>
    </div>
    ${sig2 && sig2.name ? `
    <div class="sig-col">
      <div class="sig-line">
        <strong>${sig2.name}</strong><br>
        ${sig2.designation || "Director"}<br>
        DIN: ${sig2.din || "________________"}
      </div>
    </div>` : ""}
  </div>

  <p class="mt-16">
    Place: ${reportPlace}<br>
    Date: ${reportDate || "________________"}
  </p>
</div>

`;

  return wrapPage(
    `Form AOC-1 — ${data.companyName} — FY ${fy}`,
    bodyHtml
  );
}
