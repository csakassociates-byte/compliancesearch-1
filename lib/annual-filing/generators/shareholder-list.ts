/**
 * Shareholder / Member List as on 31st March
 * Attachment for MGT-7 / MGT-7A filing
 * Shows full member register as at year-end
 * Gender-wise breakdown required for MCA V3 (FY 2024-25 onwards)
 */

import type { AnnualFilingData, ShareholderRecord } from "../types";
import { fmtDate, fmtIndian, fyEndYear, wrapPage } from "../utils";

const SHAREHOLDER_TYPE_LABELS: Record<string, string> = {
  resident_individual: "Resident Individual",
  nri:                 "Non-Resident Indian (NRI)",
  body_corporate:      "Body Corporate",
  huf:                 "Hindu Undivided Family",
  trust:               "Trust",
  government:          "Government / Government Body",
};

function getShareholdingPattern(shareholders: ShareholderRecord[], totalShares: number): string {
  const groups: Record<string, { count: number; shares: number }> = {};
  shareholders.forEach(s => {
    if (!groups[s.type]) groups[s.type] = { count: 0, shares: 0 };
    groups[s.type].count  += 1;
    groups[s.type].shares += s.sharesHeld;
  });

  const rows = Object.entries(groups).map(([type, g]) => {
    const pct = totalShares > 0 ? ((g.shares / totalShares) * 100).toFixed(2) : "0.00";
    return `
    <tr>
      <td>${SHAREHOLDER_TYPE_LABELS[type] || type}</td>
      <td class="center">${g.count}</td>
      <td class="right">${fmtIndian(g.shares)}</td>
      <td class="right">${pct}%</td>
    </tr>`;
  }).join("");

  return rows;
}

function getMemberRows(shareholders: ShareholderRecord[]): string {
  if (!shareholders || shareholders.length === 0) {
    return `<tr><td colspan="7" class="center">No shareholder data available</td></tr>`;
  }
  return shareholders.map((s, i) => `
    <tr>
      <td class="center">${i + 1}</td>
      <td>${s.folioNo || "—"}</td>
      <td>${s.name}</td>
      <td>${s.pan || "—"}</td>
      <td>${SHAREHOLDER_TYPE_LABELS[s.type] || s.type}</td>
      <td class="right">${fmtIndian(s.sharesHeld)}</td>
      <td class="right">${s.percentHolding}%</td>
    </tr>`).join("");
}

export function generateShareholderList(data: AnnualFilingData): string {
  const fy    = data.financialYear;
  const fyEnd = fyEndYear(fy);

  const shareholders = data.shareholders || [];
  const totalShares  = data.totalShares || 0;

  const bodyHtml = `

<!-- ══════════════ HEADER ══════════════ -->
<div class="header-block">
  <div class="company-name">${data.companyName}</div>
  <div class="cin-line">CIN: ${data.cin}</div>
  <div class="cin-line">Registered Office: ${data.regAddress}</div>
  <div class="doc-title">LIST OF SHAREHOLDERS / MEMBERS</div>
  <div class="fy-line">As on 31<sup>st</sup> March, ${fyEnd}</div>
  <div class="fy-line">(For the Financial Year ${fy})</div>
</div>

<!-- ══════════════ CAPITAL SUMMARY ══════════════ -->
<h2>Capital Summary</h2>
<table>
  <tr>
    <th style="width:60%">Particulars</th>
    <th class="right">Details</th>
  </tr>
  <tr>
    <td>Authorised Share Capital</td>
    <td class="right">₹${data.financials.authorisedCapital || "—"}</td>
  </tr>
  <tr>
    <td>Paid-up Share Capital</td>
    <td class="right">₹${data.financials.paidUpCapital || "—"}</td>
  </tr>
  <tr>
    <td>Nominal Value per Share</td>
    <td class="right">₹${data.nominalValuePerShare || "10"} per share</td>
  </tr>
  <tr>
    <td>Total Number of Shares</td>
    <td class="right">${fmtIndian(totalShares)}</td>
  </tr>
  <tr>
    <td>Total Number of Shareholders / Members</td>
    <td class="right">${shareholders.length}</td>
  </tr>
</table>

<!-- ══════════════ SHAREHOLDING PATTERN ══════════════ -->
<h2 class="mt-16">Shareholding Pattern as on 31<sup>st</sup> March, ${fyEnd}</h2>
<table>
  <tr>
    <th style="width:45%">Category of Shareholder</th>
    <th class="center" style="width:15%">No. of Shareholders</th>
    <th class="right" style="width:20%">No. of Shares Held</th>
    <th class="right" style="width:20%">% of Total Shareholding</th>
  </tr>
  ${getShareholdingPattern(shareholders, totalShares)}
  <tr style="font-weight:bold; background:#f2f2f2;">
    <td><strong>TOTAL</strong></td>
    <td class="center"><strong>${shareholders.length}</strong></td>
    <td class="right"><strong>${fmtIndian(totalShares)}</strong></td>
    <td class="right"><strong>100.00%</strong></td>
  </tr>
</table>

<!-- ══════════════ MEMBER REGISTER ══════════════ -->
<h2 class="mt-16 page-break">Register of Members as on 31<sup>st</sup> March, ${fyEnd}</h2>
<table style="font-size:10.5pt;">
  <tr>
    <th class="center" style="width:4%">Sl.</th>
    <th style="width:10%">Folio No.</th>
    <th style="width:28%">Name of Shareholder</th>
    <th style="width:12%">PAN</th>
    <th style="width:18%">Category</th>
    <th class="right" style="width:14%">No. of Shares</th>
    <th class="right" style="width:14%">% Holding</th>
  </tr>
  ${getMemberRows(shareholders)}
  <tr style="font-weight:bold; background:#f2f2f2;">
    <td colspan="5" class="right"><strong>TOTAL</strong></td>
    <td class="right"><strong>${fmtIndian(totalShares)}</strong></td>
    <td class="right"><strong>100.00%</strong></td>
  </tr>
</table>

<!-- ══════════════ NOTES ══════════════ -->
<div class="mt-16">
  <p><em>Notes:</em></p>
  <ol>
    <li>This list is prepared as on 31<sup>st</sup> March, ${fyEnd} (close of the Financial Year ${fy}).</li>
    <li>The information is based on the Register of Members maintained by the Company under Section 88 of the Companies Act, 2013.</li>
    <li>Shares are fully paid-up equity shares of ₹${data.nominalValuePerShare || "10"} each unless otherwise stated.</li>
  </ol>
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
    `Shareholder List — ${data.companyName} — FY ${fy}`,
    bodyHtml
  );
}
