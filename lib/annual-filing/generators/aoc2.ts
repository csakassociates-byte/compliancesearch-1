/**
 * AOC-2 — Form for disclosure of particulars of contracts / arrangements
 *   entered into by the company with related parties referred to in
 *   sub-section (1) of Section 188 of the Companies Act, 2013
 * Rule: Rule 8(2) of Companies (Accounts) Rules, 2014
 *       Rule 8A(1)(g) for OPC and Small Companies
 *
 * Structure:
 *   Part A — Contracts / arrangements / transactions NOT at arm's length
 *   Part B — Material contracts / arrangements at arm's length basis
 *
 * Required identifiers per updated format:
 *   - CIN / LLPIN / FCRN / PAN / Passport No. as applicable
 *   - Type of related party (Director, Relative, Subsidiary, KMP, etc.)
 *
 * IMPORTANT: AOC-2 is required only when:
 *   (a) There are RPTs not at arm's length OR not in ordinary course, OR
 *   (b) There are material arm's length RPTs (requires Board/Shareholder approval)
 *   If ALL RPTs are non-material + at arm's length + ordinary course → NIL AOC-2
 */

import type { AnnualFilingData, RelatedPartyTransaction } from "../types";
import { buildPageSigFooter, fmtDate, fyEndYear, sigCol, wrapPage } from "../utils";

function renderPartA(
  txns: RelatedPartyTransaction[],
  fyEnd: string
): string {
  const nonArmLength = txns.filter(t => !t.isArmLength);

  if (nonArmLength.length === 0) {
    return `
<h2>Part A</h2>
<h3>Contracts / Arrangements / Transactions NOT at Arm's Length Basis</h3>
<p><strong>NIL</strong> — There were no contracts or arrangements or transactions entered into during the Financial Year ended 31<sup>st</sup> March, ${fyEnd} which were not at arm's length basis.</p>`;
  }

  const rows = nonArmLength.map(t => `
    <tr>
      <td>${t.relatedPartyName}<br><small>${t.cin ? `CIN/PAN: ${t.cin}` : ""}</small></td>
      <td>${t.relationship}</td>
      <td>${t.natureOfTransaction}</td>
      <td>${t.duration || "—"}</td>
      <td>${t.salientTerms || "—"}</td>
      <td>${t.justification || "—"}</td>
      <td class="center">${t.approvalDate ? fmtDate(t.approvalDate) : "—"}</td>
      <td class="right">₹${t.amount || "—"}</td>
      <td>${"—"}</td>
    </tr>`).join("");

  return `
<h2>Part A</h2>
<h3>Contracts / Arrangements / Transactions NOT at Arm's Length Basis</h3>
<table style="font-size:10pt;">
  <tr>
    <th style="width:15%">Name(s) of related party &amp; nature of relationship</th>
    <th style="width:10%">Type of Relationship</th>
    <th style="width:12%">Nature of contracts / arrangements / transactions</th>
    <th style="width:8%">Duration of contracts / arrangements / transactions</th>
    <th style="width:15%">Salient terms of contracts / arrangements / transactions including the value</th>
    <th style="width:12%">Justification for entering into such contracts / arrangements / transactions</th>
    <th class="center" style="width:10%">Date(s) of approval by the Board</th>
    <th class="right" style="width:10%">Amount paid as advances, if any</th>
    <th style="width:8%">Date on which special resolution was passed in general meeting</th>
  </tr>
  ${rows}
</table>`;
}

function renderPartB(
  txns: RelatedPartyTransaction[],
  fyEnd: string
): string {
  const material = txns.filter(t => t.isArmLength && t.isMaterial);

  if (material.length === 0) {
    return `
<h2>Part B</h2>
<h3>Material Contracts / Arrangements / Transactions at Arm's Length Basis</h3>
<p><strong>NIL</strong> — There were no material contracts or arrangements or transactions entered into during the Financial Year ended 31<sup>st</sup> March, ${fyEnd} which are required to be reported under this Part.</p>`;
  }

  const rows = material.map(t => `
    <tr>
      <td>${t.relatedPartyName}<br><small>${t.cin ? `CIN/PAN: ${t.cin}` : ""}</small></td>
      <td>${t.relationship}</td>
      <td>${t.natureOfTransaction}</td>
      <td>${t.duration || "—"}</td>
      <td>${t.salientTerms || "—"}</td>
      <td class="right">₹${t.amount || "—"}</td>
      <td class="center">${t.boardApprovalDate ? fmtDate(t.boardApprovalDate) : "—"}</td>
      <td>—</td>
    </tr>`).join("");

  return `
<h2>Part B</h2>
<h3>Material Contracts / Arrangements / Transactions at Arm's Length Basis</h3>
<table style="font-size:10pt;">
  <tr>
    <th style="width:16%">Name(s) of related party &amp; nature of relationship</th>
    <th style="width:10%">Type of Relationship</th>
    <th style="width:14%">Nature of contracts / arrangements / transactions</th>
    <th style="width:9%">Duration of the contracts / arrangements / transactions</th>
    <th style="width:18%">Salient terms of the contracts or arrangements or transactions including the value</th>
    <th class="right" style="width:10%">Value of Transaction (₹)</th>
    <th class="center" style="width:12%">Date(s) of approval by the Board</th>
    <th style="width:11%">Amount paid as advances, if any</th>
  </tr>
  ${rows}
</table>`;
}

export function generateAOC2(data: AnnualFilingData): string {
  const fy    = data.financialYear;
  const fyEnd = fyEndYear(fy);
  const txns  = data.relatedPartyTransactions || [];

  const sig1 = data.signatoryDirectors.director1;
  const sig2 = data.signatoryDirectors.director2;
  const sig3 = data.signatoryDirectors.director3;
  const reportDate  = fmtDate(data.dateOfReport);
  const reportPlace = data.placeOfSigning || "";

  const bodyHtml = `

<!-- ══════════════ HEADER ══════════════ -->
<div class="header-block">
  <div class="company-name">${data.companyName}</div>
  <div class="cin-line">CIN: ${data.cin}</div>
  <div class="doc-title">FORM AOC-2</div>
  <div class="fy-line">Form for disclosure of particulars of contracts / arrangements<br>
  entered into by the Company with related parties referred to in<br>
  sub-section (1) of Section 188 of the Companies Act, 2013</div>
  <div class="fy-line">[Pursuant to clause (h) of sub-section (3) of Section 134 of the Act<br>
  and Rule 8(2) of the Companies (Accounts) Rules, 2014]</div>
  <div class="fy-line mt-8">For the Financial Year ended 31<sup>st</sup> March, ${fyEnd}</div>
</div>

<p>The following are the details of contracts or arrangements or transactions at arm's length basis and those not at arm's length basis for the Financial Year ${fy}:</p>

<!-- ══════════════ PART A ══════════════ -->
${renderPartA(txns, fyEnd)}

<!-- ══════════════ PART B ══════════════ -->
<div class="mt-16">
${renderPartB(txns, fyEnd)}
</div>

<p class="mt-16"><em>Note: This Form is to be signed by the persons who have signed the Board's Report.</em></p>

<!-- ══════════════ SIGNATURE ══════════════ -->
<div class="sig-block">
  <p>For and on behalf of the Board of Directors of<br>
  <strong>${data.companyName}</strong></p>

  <div class="sig-row">
    ${sigCol(sig1)}
    ${sig2?.name ? sigCol(sig2) : ""}
    ${sig3?.name ? sigCol(sig3) : ""}
  </div>

  <p class="mt-16">
    Place: ${reportPlace}<br>
    Date: ${reportDate || "________________"}
  </p>
</div>

`;

  const pageSigs = [
    { name: sig1?.name, designation: sig1?.designation, din: sig1?.din, signatureBase64: sig1?.signatureBase64 },
    ...(sig2?.name ? [{ name: sig2.name, designation: sig2.designation, din: sig2.din, signatureBase64: sig2.signatureBase64 }] : []),
    ...(sig3?.name ? [{ name: sig3.name, designation: sig3.designation, din: sig3.din, signatureBase64: sig3.signatureBase64 }] : []),
  ];
  const pageFooter = buildPageSigFooter(pageSigs);

  return wrapPage(
    `Form AOC-2 — ${data.companyName} — FY ${fy}`,
    bodyHtml,
    pageFooter || undefined
  );
}
