/**
 * Board Report — Rule 8A (Abridged)
 * Applicable to: OPC (One Person Company) + Small Companies
 * Legal basis: Section 134 of Companies Act 2013 read with Rule 8A of
 *   Companies (Accounts) Amendment Rules, 2018
 *
 * Mandatory disclosures under Rule 8A:
 *   (a) Web link of Annual Return [Sec. 92(3)]
 *   (b) Number of Board meetings held
 *   (c) Authorised & Paid-up capital and changes
 *   (d) Directors' Responsibility Statement [Sec. 134(3)(c) & 134(5)]
 *   (e) Explanation of Auditor qualifications [Sec. 134(3)(f)]
 *   (f) Frauds reported by Auditor [Sec. 143(12)]
 *   (g) Particulars of RPT in Form AOC-2 [Sec. 188(1)]
 *   (h) State of company affairs
 *   (i) Financial highlights
 *   (j) Material changes after FY end
 *   (k) Director changes during year
 *   (l) Significant & material orders by regulators/courts
 *
 * NOTE: IFC clause [Sec. 134(5)(e)] is NOT required — it applies only to
 *   listed companies. OPC and Small Companies are unlisted.
 * NOTE: MGT-9 (Extract of Annual Return) is ABOLISHED — upload full return
 *   on website and mention the link only.
 */

import type { AnnualFilingData } from "../types";
import { fmtDate, fmtRs, fyEndYear, fyStartYear, ordinal, wrapPage } from "../utils";

function getMeetingRows(data: AnnualFilingData): string {
  if (!data.boardMeetings || data.boardMeetings.length === 0) {
    return `<tr><td colspan="3" class="center">No board meetings data provided</td></tr>`;
  }
  return data.boardMeetings.map(m => `
    <tr>
      <td class="center">${m.serialNo}</td>
      <td class="center">${fmtDate(m.date)}</td>
      <td>${m.directorsPresent && m.directorsPresent.length > 0 ? m.directorsPresent.join(", ") : "—"}</td>
    </tr>`).join("");
}

function getDirectorRows(data: AnnualFilingData): string {
  return data.directors
    .filter(d => d.isActive || d.changeType === "resigned" || d.changeType === "ceased")
    .map((d, i) => `
    <tr>
      <td class="center">${i + 1}</td>
      <td>${d.name}</td>
      <td>${d.din || "—"}</td>
      <td>${d.designation}</td>
      <td class="center">${fmtDate(d.dateOfAppointment)}</td>
      <td class="center">${d.dateOfCessation ? fmtDate(d.dateOfCessation) : "—"}</td>
      <td>${d.isActive ? "Active" : "Ceased"}</td>
    </tr>`).join("");
}

function getDirectorChanges(data: AnnualFilingData): string {
  const changed = data.directors.filter(d => d.changedDuringYear);
  if (changed.length === 0) {
    return `<p>There were no changes in the directorship of the Company during the financial year under review.</p>`;
  }
  const appointed = changed.filter(d => d.changeType === "appointed");
  const resigned  = changed.filter(d => d.changeType === "resigned" || d.changeType === "ceased");
  let html = "";
  if (appointed.length > 0) {
    html += `<p>The following Directors were appointed during the year:</p>
    <table>
      <tr><th>Name of Director</th><th>DIN</th><th>Designation</th><th>Date of Appointment</th></tr>
      ${appointed.map(d => `<tr><td>${d.name}</td><td>${d.din || "—"}</td><td>${d.designation}</td><td>${fmtDate(d.dateOfAppointment)}</td></tr>`).join("")}
    </table>`;
  }
  if (resigned.length > 0) {
    html += `<p>The following Directors resigned / ceased during the year:</p>
    <table>
      <tr><th>Name of Director</th><th>DIN</th><th>Designation</th><th>Date of Cessation</th></tr>
      ${resigned.map(d => `<tr><td>${d.name}</td><td>${d.din || "—"}</td><td>${d.designation}</td><td>${d.dateOfCessation ? fmtDate(d.dateOfCessation) : "—"}</td></tr>`).join("")}
    </table>`;
  }
  return html;
}

export function generateBoardReportRule8A(data: AnnualFilingData): string {
  const fy = data.financialYear;         // "2024-25"
  const fyEnd = fyEndYear(fy);           // "2025"
  const fyStart = fyStartYear(fy);       // "2024"
  const prevFY = `${Number(fyStart) - 1}-${fyStart.slice(2)}`;  // "2023-24"

  const sig1 = data.signatoryDirectors.director1;
  const sig2 = data.signatoryDirectors.director2;
  const reportDate = fmtDate(data.dateOfReport);
  const reportPlace = data.placeOfSigning || data.stateOfIncorporation || "";
  const totalMeetings = data.boardMeetings?.length || 0;

  const isOPC = data.companyType === "opc";

  const bodyHtml = `

<!-- ══════════════ HEADER ══════════════ -->
<div class="header-block">
  <div class="company-name">${data.companyName}</div>
  <div class="cin-line">CIN: ${data.cin}</div>
  <div class="cin-line">Registered Office: ${data.regAddress}</div>
  <div class="doc-title">DIRECTORS' REPORT</div>
  <div class="fy-line">For the Financial Year ended 31<sup>st</sup> March, ${fyEnd}</div>
</div>

<!-- ══════════════ OPENING ══════════════ -->
<p>To,<br>
${isOPC
  ? `The Member,`
  : `The Members,`
}<br>
<strong>${data.companyName}</strong></p>

<p>Your Directors have pleasure in presenting the Annual Report of the Company together with the Audited Financial Statements for the Financial Year ended 31<sup>st</sup> March, ${fyEnd}.</p>

<!-- ══════════════ 1. FINANCIAL SUMMARY ══════════════ -->
<h2>1. Financial Summary / Highlights</h2>
<p>The financial performance of the Company for the Financial Year ${fy} is summarized below:</p>
<table>
  <tr>
    <th style="width:55%">Particulars</th>
    <th class="right" style="width:22%">FY ${fy}<br>(₹)</th>
    <th class="right" style="width:23%">FY ${prevFY}<br>(₹)</th>
  </tr>
  <tr>
    <td>Revenue from Operations</td>
    <td class="right">${fmtRs(data.financials.revenueFromOperations)}</td>
    <td class="right">${fmtRs(data.financials.prevRevenueFromOperations)}</td>
  </tr>
  <tr>
    <td>Other Income</td>
    <td class="right">${fmtRs(data.financials.otherIncome)}</td>
    <td class="right">${fmtRs(data.financials.prevOtherIncome)}</td>
  </tr>
  <tr class="bold">
    <td><strong>Total Income</strong></td>
    <td class="right"><strong>${fmtRs(data.financials.totalIncome)}</strong></td>
    <td class="right"><strong>${fmtRs(data.financials.prevTotalIncome)}</strong></td>
  </tr>
  <tr>
    <td>Total Expenses</td>
    <td class="right">${fmtRs(data.financials.totalExpenses)}</td>
    <td class="right">${fmtRs(data.financials.prevTotalExpenses)}</td>
  </tr>
  <tr class="bold">
    <td><strong>Profit Before Tax</strong></td>
    <td class="right"><strong>${fmtRs(data.financials.profitBeforeTax)}</strong></td>
    <td class="right"><strong>${fmtRs(data.financials.prevProfitBeforeTax)}</strong></td>
  </tr>
  <tr>
    <td>Current Tax</td>
    <td class="right">${fmtRs(data.financials.currentTax)}</td>
    <td class="right">${fmtRs(data.financials.prevCurrentTax)}</td>
  </tr>
  <tr>
    <td>Deferred Tax</td>
    <td class="right">${fmtRs(data.financials.deferredTax)}</td>
    <td class="right">${fmtRs(data.financials.prevDeferredTax)}</td>
  </tr>
  <tr class="bold">
    <td><strong>Profit After Tax (PAT)</strong></td>
    <td class="right"><strong>${fmtRs(data.financials.profitAfterTax)}</strong></td>
    <td class="right"><strong>${fmtRs(data.financials.prevProfitAfterTax)}</strong></td>
  </tr>
</table>

<!-- ══════════════ 2. STATE OF AFFAIRS ══════════════ -->
<h2>2. State of Affairs / Business Operations</h2>
<p>${data.stateOfAffairs || `During the Financial Year ${fy}, the Company continued its principal business activities. The overall performance of the Company was satisfactory during the year under review.`}</p>

<!-- ══════════════ 3. WEB LINK OF ANNUAL RETURN [Rule 8A(a), Sec. 92(3)] ══════════════ -->
<h2>3. Annual Return</h2>
<p>Pursuant to Section 92(3) of the Companies Act, 2013 read with Rule 12(1) of the Companies (Management and Administration) Rules, 2014, the Annual Return of the Company for the Financial Year ended 31<sup>st</sup> March, ${fyEnd} ${
  data.annualReturnWebLink
    ? `is available on the website of the Company at: <strong>${data.annualReturnWebLink}</strong>`
    : `will be placed on the website of the Company after filing with the Registrar of Companies. The Company does not maintain a website; accordingly, the copy of Annual Return in Form MGT-7A shall be available at the Registered Office of the Company for inspection during business hours.`
}</p>

<!-- ══════════════ 4. BOARD MEETINGS [Rule 8A(b)] ══════════════ -->
<h2>4. Number of Board Meetings</h2>
<p>During the Financial Year ${fy}, <strong>${totalMeetings} (${totalMeetings === 1 ? "One" : totalMeetings === 2 ? "Two" : totalMeetings === 3 ? "Three" : totalMeetings === 4 ? "Four" : totalMeetings === 5 ? "Five" : totalMeetings === 6 ? "Six" : String(totalMeetings)} )</strong> meeting(s) of the Board of Directors were held. The details of Board Meetings held during the year are as under:</p>
<table>
  <tr>
    <th class="center" style="width:15%">Sl. No.</th>
    <th class="center" style="width:35%">Date of Meeting</th>
    <th style="width:50%">Directors Present</th>
  </tr>
  ${getMeetingRows(data)}
</table>
<p>The gap between any two consecutive Board Meetings did not exceed one hundred and twenty days as required under Section 173(1) of the Companies Act, 2013.</p>

<!-- ══════════════ 5. CAPITAL [Rule 8A(c)] ══════════════ -->
<h2>5. Share Capital</h2>
<p>As on 31<sup>st</sup> March, ${fyEnd}:</p>
<table>
  <tr>
    <th style="width:60%">Particulars</th>
    <th class="right">Amount (₹)</th>
  </tr>
  <tr>
    <td>Authorised Share Capital</td>
    <td class="right">${fmtRs(data.financials.authorisedCapital)}</td>
  </tr>
  <tr>
    <td>Paid-up Share Capital</td>
    <td class="right">${fmtRs(data.financials.paidUpCapital)}</td>
  </tr>
</table>
<p>${
  data.capitalChanges
    ? data.capitalChanges
    : `There was no change in the Authorised or Paid-up Share Capital of the Company during the Financial Year ${fy}.`
}</p>

<!-- ══════════════ 6. DIRECTORS' RESPONSIBILITY STATEMENT [Sec. 134(3)(c) & 134(5)] ══════════════ -->
<h2>6. Directors' Responsibility Statement</h2>
<p>Pursuant to the requirement under Section 134(3)(c) read with Section 134(5) of the Companies Act, 2013, your Directors state that:</p>
<ol type="i">
  <li>In the preparation of the annual accounts for the Financial Year ended 31<sup>st</sup> March, ${fyEnd}, the applicable accounting standards have been followed along with proper explanation relating to material departures, if any;</li>
  <li>The Directors have selected such accounting policies and applied them consistently and made judgements and estimates that are reasonable and prudent so as to give a true and fair view of the state of affairs of the Company as at 31<sup>st</sup> March, ${fyEnd} and of the profit / loss of the Company for the year ended on that date;</li>
  <li>The Directors have taken proper and sufficient care for the maintenance of adequate accounting records in accordance with the provisions of the Companies Act, 2013 for safeguarding the assets of the Company and for preventing and detecting fraud and other irregularities;</li>
  <li>The Directors have prepared the annual accounts on a going concern basis; and</li>
  <li>The Directors have devised proper systems to ensure compliance with the provisions of all applicable laws and that such systems were adequate and operating effectively.</li>
</ol>

<!-- ══════════════ 7. AUDITOR'S QUALIFICATIONS [Rule 8A(e), Sec. 134(3)(f)] ══════════════ -->
<h2>7. Auditors' Report — Qualifications, Reservations and Adverse Remarks</h2>
${
  data.auditQualification && data.auditQualificationExplanation
    ? `<p>The Statutory Auditors have made certain qualifications/reservations/adverse remarks in their Audit Report. The Board of Directors provides the following explanation/comments thereon:</p>
       <p>${data.auditQualificationExplanation}</p>`
    : `<p>The Statutory Auditors' Report for the Financial Year ${fy} does not contain any qualification, reservation, adverse remark or disclaimer. Accordingly, no explanation or comment is required to be given by the Board of Directors under Section 134(3)(f) of the Companies Act, 2013.</p>`
}

<!-- ══════════════ 8. FRAUD BY AUDITORS [Rule 8A(d), Sec. 143(12)] ══════════════ -->
<h2>8. Frauds Reported by Statutory Auditors</h2>
${
  data.fraudReported && data.fraudDetails
    ? `<p>The Statutory Auditors have reported the following instances of fraud to the Board of Directors during the Financial Year ${fy}:</p>
       <p>${data.fraudDetails}</p>`
    : `<p>The Statutory Auditors of the Company have not reported any instance of fraud committed against the Company by its officers or employees as specified under Section 143(12) of the Companies Act, 2013 during the Financial Year ${fy}. Hence, no disclosure is required to be made in this Annual Report under Rule 13 of the Companies (Audit and Auditors) Rules, 2014.</p>`
}

<!-- ══════════════ 9. RELATED PARTY TRANSACTIONS [Rule 8A(g), Sec. 188] ══════════════ -->
<h2>9. Related Party Transactions</h2>
${
  data.hasRPT
    ? `<p>All contracts or arrangements or transactions entered into by the Company during the Financial Year ${fy} with related parties referred to in sub-section (1) of Section 188 of the Companies Act, 2013 were in the ordinary course of business and on an arm's length basis, except as mentioned in <strong>Form AOC-2</strong> annexed hereto as <strong>Annexure I</strong>. The particulars of material contracts or arrangements or transactions, or those not at arm's length basis, have been set out in Form AOC-2.</p>`
    : `<p>All contracts or arrangements or transactions entered into by the Company during the Financial Year ${fy} with related parties referred to in sub-section (1) of Section 188 of the Companies Act, 2013 were in the ordinary course of business and at arm's length basis. The Company does not have any contracts, arrangements or transactions with related parties which are not at arm's length or which may be considered material. Accordingly, the disclosure in <strong>Form AOC-2</strong> is not required.</p>
       <p>There are no materially significant related party transactions that may have potential conflict with the interests of the Company at large. The details of related party transactions as per AS-18 are set out in the Notes to the Financial Statements.</p>`
}

<!-- ══════════════ 10. DEPOSITS [Sec. 73-76] ══════════════ -->
<h2>10. Deposits</h2>
${
  data.hasDeposits
    ? `<p>The Company has accepted deposits during the Financial Year ${fy}. Details in compliance with Chapter V of the Companies Act, 2013 are disclosed in the Notes to Financial Statements.</p>`
    : `<p>The Company has not accepted any deposits from the public within the meaning of Section 73 and 74 of the Companies Act, 2013 read with the Companies (Acceptance of Deposits) Rules, 2014 during the Financial Year ${fy}. Hence, no amount of principal or interest was outstanding as on the Balance Sheet date.</p>`
}

<!-- ══════════════ 11. LOANS, GUARANTEES & INVESTMENTS [Sec. 186] ══════════════ -->
<h2>11. Loans, Guarantees and Investments</h2>
${
  data.hasLoansGiven
    ? `<p>The particulars of loans given, investments made, guarantees given and securities provided under Section 186 of the Companies Act, 2013 are provided in the Notes to the Financial Statements.</p>`
    : `<p>During the Financial Year ${fy}, the Company has not given any loans, provided any guarantees or made any investments as covered under the provisions of Section 186 of the Companies Act, 2013.</p>`
}

<!-- ══════════════ 12. SUBSIDIARIES / ASSOCIATES [Sec. 129(3)] ══════════════ -->
<h2>12. Subsidiaries, Associates and Joint Ventures</h2>
${
  data.hasSubsidiaries
    ? `<p>The Company has subsidiaries / associate companies / joint ventures as on 31<sup>st</sup> March, ${fyEnd}. A statement containing salient features of the financial statements of such entities in the prescribed Form AOC-1 is annexed hereto as <strong>Annexure II</strong> pursuant to Section 129(3) of the Companies Act, 2013.</p>`
    : `<p>The Company does not have any subsidiary, associate company or joint venture as on 31<sup>st</sup> March, ${fyEnd}. Therefore, no statement in Form AOC-1 is required to be annexed.</p>`
}

<!-- ══════════════ 13. MATERIAL CHANGES [Rule 8A(j)] ══════════════ -->
<h2>13. Material Changes and Commitments</h2>
${
  data.materialChangesAfterFY && data.materialChangesDetails
    ? `<p>${data.materialChangesDetails}</p>`
    : `<p>There are no material changes and commitments, affecting the financial position of the Company, which have occurred between the end of the Financial Year ${fy} and the date of this Report.</p>`
}

<!-- ══════════════ 14. DIRECTORS — CHANGES [Rule 8A(k)] ══════════════ -->
<h2>14. Changes in Directors</h2>
${getDirectorChanges(data)}

<!-- ══════════════ 15. SIGNIFICANT ORDERS [Rule 8A(l)] ══════════════ -->
<h2>15. Significant and Material Orders</h2>
${
  data.significantOrders && data.significantOrdersDetails
    ? `<p>${data.significantOrdersDetails}</p>`
    : `<p>No significant or material orders have been passed by the Regulators, Courts or Tribunals which would impact the going concern status of the Company and its future operations during the Financial Year ${fy}.</p>`
}

<!-- ══════════════ 16. SECRETARIAL STANDARDS ══════════════ -->
<h2>16. Compliance with Secretarial Standards</h2>
<p>The Company has complied with the applicable Secretarial Standards issued by the Institute of Company Secretaries of India (ICSI), namely SS-1 (Secretarial Standard on Meetings of the Board of Directors) and SS-2 (Secretarial Standard on General Meetings), as applicable to the Company.</p>

<!-- ══════════════ 17. STATUTORY AUDITOR ══════════════ -->
<h2>17. Statutory Auditor</h2>
<p>${
  data.auditor.firmName
    ? `M/s ${data.auditor.firmName} (FRN: ${data.auditor.frn}), Chartered Accountants, are the Statutory Auditors of the Company. They were appointed to hold office until the conclusion of the Annual General Meeting. The Board places on record its appreciation for the services rendered by the Statutory Auditors.`
    : `The Statutory Auditors of the Company hold office as per applicable provisions of the Companies Act, 2013.`
}</p>

<!-- ══════════════ 18. POSH (SEXUAL HARASSMENT) ══════════════ -->
<h2>18. Prevention of Sexual Harassment at Workplace</h2>
<p>The Company is committed to providing a safe working environment. ${
  isOPC
    ? `The Company has complied with provisions relating to the constitution of Internal Complaints Committee under the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013, to the extent applicable.`
    : `The Company has put in place a policy for prevention of sexual harassment in compliance with the provisions of the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013. No complaints of sexual harassment were received during the Financial Year ${fy}.`
}</p>

<!-- ══════════════ 19. INTERNAL CONTROLS ══════════════ -->
<h2>19. Internal Financial Controls</h2>
<p>The Company has established adequate internal financial controls with reference to financial statements. The Company has devised proper systems to ensure compliance with provisions of all applicable laws, and such systems are adequate and are operating effectively. The Statutory Auditors have not reported any significant deficiency or material weakness in internal financial controls over financial reporting.</p>

<!-- ══════════════ 20. ACKNOWLEDGEMENTS ══════════════ -->
<h2>20. Acknowledgements</h2>
<p>Your Directors place on record their sincere appreciation for the assistance, co-operation and support extended by the bankers, government authorities, regulatory agencies, customers, suppliers and other business associates. Your Directors also express their deep appreciation for the dedicated efforts and contribution of the employees at all levels. The Board also thanks the ${isOPC ? "Member" : "Members"} of the Company for reposing confidence and trust in the Company.</p>

<!-- ══════════════ DIRECTORS TABLE ══════════════ -->
<div class="page-break"></div>
<h2>Details of Directors of the Company as on 31<sup>st</sup> March, ${fyEnd}</h2>
<table style="font-size:9.5pt;">
  <tr>
    <th class="center" style="width:5%">Sl.</th>
    <th style="width:26%">Name of Director</th>
    <th style="width:12%">DIN</th>
    <th style="width:18%">Designation</th>
    <th class="center" style="width:16%">Date of Appointment</th>
    <th class="center" style="width:16%">Date of Cessation</th>
    <th style="width:7%">Status</th>
  </tr>
  ${getDirectorRows(data)}
</table>

<!-- ══════════════ SIGNATURE BLOCK ══════════════ -->
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
    `Directors' Report — ${data.companyName} — FY ${fy}`,
    bodyHtml
  );
}
