/**
 * Board Report — Rule 8 (Full)
 * Applicable to: Section 8 Companies + Farmer Producer Companies (FPC)
 *   (and any Private Limited NOT qualifying as small company)
 * Legal basis: Section 134 of Companies Act 2013 read with Rule 8 of
 *   Companies (Accounts) Rules, 2014
 *
 * Section 8 is EXCLUDED from "small company" definition [Sec. 2(85)].
 * FPC follows full Rule 8 unless it qualifies as small company.
 *
 * Key additions over Rule 8A:
 *   - Conservation of energy [Rule 8(3)(A)]
 *   - Technology absorption [Rule 8(3)(B)]
 *   - Foreign exchange earnings & outgo [Rule 8(3)(C)]
 *   - Board performance evaluation [Sec. 134(3)(p)]
 *   - Independent Director declaration [Sec. 149(7)] — if any ID appointed
 *   - Risk management overview
 *   - CSR disclosure [Sec. 135] — if thresholds met
 *   - Insolvency proceedings (one-time settlement) [Sec. 134(3)(l)]
 *   - Difference in valuation — one-time settlement / valuation report
 *
 * NOTE: Secretarial Audit (MR-3) NOT required — threshold is public company
 *   with paid-up ≥ ₹50 cr OR turnover ≥ ₹250 cr. Section 8 / FPC are below.
 * NOTE: Vigil Mechanism NOT required — applies only to listed companies,
 *   companies accepting public deposits, or borrowings from banks > ₹50 cr.
 * NOTE: MGT-9 (Extract of Annual Return) is ABOLISHED.
 */

import type { AnnualFilingData } from "../types";
import { fmtDate, fmtRs, fyEndYear, fyStartYear, wrapPage } from "../utils";

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
      <td>${d.category || "—"}</td>
      <td class="center">${fmtDate(d.dateOfAppointment)}</td>
      <td class="center">${d.dateOfCessation ? fmtDate(d.dateOfCessation) : "—"}</td>
      <td>${d.isActive ? "Active" : "Ceased"}</td>
    </tr>`).join("");
}

function getDirectorChanges(data: AnnualFilingData): string {
  const changed = data.directors.filter(d => d.changedDuringYear);
  if (changed.length === 0) {
    return `<p>There were no changes in the composition of the Board of Directors of the Company during the Financial Year under review.</p>`;
  }
  const appointed = changed.filter(d => d.changeType === "appointed");
  const resigned  = changed.filter(d => d.changeType === "resigned" || d.changeType === "ceased");
  let html = "";
  if (appointed.length > 0) {
    html += `<p>The following Directors were appointed during the year:</p>
    <table style="font-size:9.5pt;">
      <tr>
        <th style="width:38%">Name</th>
        <th style="width:14%">DIN</th>
        <th style="width:28%">Designation</th>
        <th style="width:20%">Date of Appointment</th>
      </tr>
      ${appointed.map(d => `<tr><td>${d.name}</td><td>${d.din||"—"}</td><td>${d.designation}</td><td>${fmtDate(d.dateOfAppointment)}</td></tr>`).join("")}
    </table>`;
  }
  if (resigned.length > 0) {
    html += `<p>The following Directors resigned / ceased to hold office during the year:</p>
    <table style="font-size:9.5pt;">
      <tr>
        <th style="width:38%">Name</th>
        <th style="width:14%">DIN</th>
        <th style="width:28%">Designation</th>
        <th style="width:20%">Date of Cessation</th>
      </tr>
      ${resigned.map(d => `<tr><td>${d.name}</td><td>${d.din||"—"}</td><td>${d.designation}</td><td>${d.dateOfCessation ? fmtDate(d.dateOfCessation) : "—"}</td></tr>`).join("")}
    </table>`;
  }
  return html;
}

function hasIndependentDirectors(data: AnnualFilingData): boolean {
  return data.directors.some(d =>
    d.category?.toLowerCase().includes("independent") ||
    d.designation?.toLowerCase().includes("independent")
  );
}

export function generateBoardReportRule8(data: AnnualFilingData): string {
  const fy = data.financialYear;
  const fyEnd = fyEndYear(fy);
  const fyStart = fyStartYear(fy);
  const prevFY = `${Number(fyStart) - 1}-${fyStart.slice(2)}`;

  const sig1 = data.signatoryDirectors.director1;
  const sig2 = data.signatoryDirectors.director2;
  const reportDate = fmtDate(data.dateOfReport);
  const reportPlace = data.placeOfSigning || data.stateOfIncorporation || "";
  const totalMeetings = data.boardMeetings?.length || 0;

  const isSection8 = data.companyType === "section8";
  const isFPC      = data.companyType === "fpc";
  const hasID      = hasIndependentDirectors(data);

  const companyTypeLabel = isSection8
    ? "Section 8 Company (licensed under Section 8 of the Companies Act, 2013)"
    : isFPC
    ? "Farmer Producer Company (registered under Part IXA of the Companies Act, 1956 as preserved by Section 465 of the Companies Act, 2013)"
    : "Company";

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
The Members,<br>
<strong>${data.companyName}</strong></p>

<p>Your Directors have pleasure in presenting the Annual Report of the Company together with the Audited Financial Statements for the Financial Year ended 31<sup>st</sup> March, ${fyEnd}.</p>
${isSection8 ? `<p>The Company is incorporated as a ${companyTypeLabel} and is committed to its objects as stated in its Memorandum of Association.</p>` : ""}
${isFPC ? `<p>The Company is a ${companyTypeLabel}, formed to promote the economic interests of its Members who are engaged in primary produce activities.</p>` : ""}

<!-- ══════════════ 1. FINANCIAL SUMMARY ══════════════ -->
<h2>1. Financial Summary / Highlights</h2>
<p>The financial performance of the Company for the Financial Year ${fy} is summarized below:</p>
<table>
  <tr>
    <th style="width:55%">Particulars</th>
    <th class="right" style="width:22%">FY ${fy}<br>(₹)</th>
    <th class="right" style="width:23%">FY ${prevFY}<br>(₹)</th>
  </tr>
  <tr><td>Revenue from Operations</td><td class="right">${fmtRs(data.financials.revenueFromOperations)}</td><td class="right">${fmtRs(data.financials.prevRevenueFromOperations)}</td></tr>
  <tr><td>Other Income</td><td class="right">${fmtRs(data.financials.otherIncome)}</td><td class="right">${fmtRs(data.financials.prevOtherIncome)}</td></tr>
  <tr><td><strong>Total Income</strong></td><td class="right"><strong>${fmtRs(data.financials.totalIncome)}</strong></td><td class="right"><strong>${fmtRs(data.financials.prevTotalIncome)}</strong></td></tr>
  <tr><td>Total Expenses</td><td class="right">${fmtRs(data.financials.totalExpenses)}</td><td class="right">${fmtRs(data.financials.prevTotalExpenses)}</td></tr>
  <tr><td><strong>Profit Before Tax</strong></td><td class="right"><strong>${fmtRs(data.financials.profitBeforeTax)}</strong></td><td class="right"><strong>${fmtRs(data.financials.prevProfitBeforeTax)}</strong></td></tr>
  <tr><td>Current Tax</td><td class="right">${fmtRs(data.financials.currentTax)}</td><td class="right">${fmtRs(data.financials.prevCurrentTax)}</td></tr>
  <tr><td>Deferred Tax</td><td class="right">${fmtRs(data.financials.deferredTax)}</td><td class="right">${fmtRs(data.financials.prevDeferredTax)}</td></tr>
  <tr><td><strong>Profit After Tax (PAT)</strong></td><td class="right"><strong>${fmtRs(data.financials.profitAfterTax)}</strong></td><td class="right"><strong>${fmtRs(data.financials.prevProfitAfterTax)}</strong></td></tr>
</table>

<!-- ══════════════ 2. STATE OF AFFAIRS ══════════════ -->
<h2>2. State of Affairs / Business Operations</h2>
<p>${data.stateOfAffairs || `During the Financial Year ${fy}, the Company continued its principal business activities. The overall performance of the Company was satisfactory.`}</p>

<!-- ══════════════ 3. ANNUAL RETURN [Sec. 92(3)] ══════════════ -->
<h2>3. Annual Return</h2>
<p>Pursuant to Section 92(3) of the Companies Act, 2013 read with Rule 12(1) of the Companies (Management and Administration) Rules, 2014, the Annual Return of the Company for the Financial Year ended 31<sup>st</sup> March, ${fyEnd} ${
  data.annualReturnWebLink
    ? `is available on the website of the Company at: <strong>${data.annualReturnWebLink}</strong>`
    : `will be placed on the website of the Company after filing with the Registrar of Companies.`
}</p>

<!-- ══════════════ 4. BOARD MEETINGS [Sec. 134(3)(b)] ══════════════ -->
<h2>4. Number of Board Meetings</h2>
<p>During the Financial Year ${fy}, <strong>${totalMeetings}</strong> meeting(s) of the Board of Directors were held. The details are as under:</p>
<table>
  <tr>
    <th class="center" style="width:15%">Sl. No.</th>
    <th class="center" style="width:35%">Date of Meeting</th>
    <th style="width:50%">Directors Present</th>
  </tr>
  ${getMeetingRows(data)}
</table>
<p>The gap between any two consecutive Board Meetings did not exceed one hundred and twenty days as required under Section 173(1) of the Companies Act, 2013.</p>

<!-- ══════════════ 5. DIRECTORS' RESPONSIBILITY STATEMENT [Sec. 134(3)(c) & 134(5)] ══════════════ -->
<h2>5. Directors' Responsibility Statement</h2>
<p>Pursuant to Section 134(3)(c) read with Section 134(5) of the Companies Act, 2013, your Directors confirm that:</p>
<ol type="i">
  <li>In the preparation of the annual accounts for the Financial Year ended 31<sup>st</sup> March, ${fyEnd}, the applicable accounting standards have been followed along with proper explanation relating to material departures, if any;</li>
  <li>The Directors have selected such accounting policies and applied them consistently and made judgements and estimates that are reasonable and prudent so as to give a true and fair view of the state of affairs of the Company as at 31<sup>st</sup> March, ${fyEnd} and of the profit / loss of the Company for the year ended on that date;</li>
  <li>The Directors have taken proper and sufficient care for the maintenance of adequate accounting records in accordance with the provisions of the Companies Act, 2013 for safeguarding the assets of the Company and for preventing and detecting fraud and other irregularities;</li>
  <li>The Directors have prepared the annual accounts on a going concern basis; and</li>
  <li>The Directors have devised proper systems to ensure compliance with the provisions of all applicable laws and that such systems were adequate and operating effectively.</li>
</ol>

<!-- ══════════════ 6. INDEPENDENT DIRECTORS [Sec. 149(7)] ══════════════ -->
${hasID ? `
<h2>6. Declaration by Independent Directors</h2>
<p>The Company has received necessary declarations from all Independent Directors of the Company pursuant to Section 149(7) of the Companies Act, 2013 confirming that they meet the criteria of independence as prescribed under Section 149(6) of the Companies Act, 2013 and the applicable rules thereunder. In the opinion of the Board, the Independent Directors possess the attributes of integrity, expertise and experience as required to be disclosed under Rule 8(5)(iiia) of the Companies (Accounts) Rules, 2014.</p>
` : `
<h2>6. Declaration by Independent Directors</h2>
<p>As at 31<sup>st</sup> March, ${fyEnd}, the Company does not have any Independent Director on its Board. Therefore, no disclosure under Section 149(7) of the Companies Act, 2013 is required.</p>
`}

<!-- ══════════════ 7. BOARD PERFORMANCE EVALUATION [Sec. 134(3)(p)] ══════════════ -->
<h2>7. Board Performance Evaluation</h2>
<p>${hasID
  ? `Pursuant to the provisions of the Companies Act, 2013, the Board has carried out an annual performance evaluation of its own performance, the Directors individually, as well as the evaluation of the working of its Committees. The manner in which the evaluation has been carried out is explained herein. The performance of the Board was evaluated by the Board after seeking inputs from all the Directors on the basis of criteria such as composition, diversity, meeting process, strategic engagement etc. The performance of the Committees was evaluated by the Board after seeking inputs from the Committee members on the basis of criteria such as composition, frequency of meetings, engagement with the Board, role and responsibilities etc. The performance evaluation of Independent Directors was done by the entire Board, excluding the Director being evaluated.`
  : `The Board of Directors has carried out the annual evaluation of its own performance as well as that of individual Directors as mandated by the provisions of Section 134(3)(p) of the Companies Act, 2013. The evaluation framework focused on areas such as Board composition, Board meeting process, strategic engagement, effectiveness of decision making, and adherence to governance standards.`
}</p>

<!-- ══════════════ 8. SHARE CAPITAL [Sec. 134(3)] ══════════════ -->
<h2>8. Share Capital</h2>
<p>As on 31<sup>st</sup> March, ${fyEnd}, the Authorised Share Capital of the Company was <strong>${fmtRs(data.financials.authorisedCapital)}</strong> and the Paid-up Share Capital was <strong>${fmtRs(data.financials.paidUpCapital)}</strong>.</p>
<p>${data.capitalChanges || `There was no change in the Authorised or Paid-up Share Capital of the Company during the Financial Year ${fy}.`}</p>

<!-- ══════════════ 9. AUDITOR'S QUALIFICATIONS [Sec. 134(3)(f)] ══════════════ -->
<h2>9. Auditors' Report — Qualifications, Reservations and Adverse Remarks</h2>
${
  data.auditQualification && data.auditQualificationExplanation
    ? `<p>The Statutory Auditors have made certain qualifications/reservations/adverse remarks in their Audit Report. The Board of Directors provides the following explanation/comments thereon:</p>
       <p>${data.auditQualificationExplanation}</p>`
    : `<p>The Statutory Auditors' Report for the Financial Year ${fy} does not contain any qualification, reservation, adverse remark or disclaimer. Accordingly, no explanation or comment is required under Section 134(3)(f) of the Companies Act, 2013.</p>`
}

<!-- ══════════════ 10. FRAUD BY AUDITORS [Sec. 143(12)] ══════════════ -->
<h2>10. Frauds Reported by Statutory Auditors</h2>
${
  data.fraudReported && data.fraudDetails
    ? `<p>The Statutory Auditors have reported the following instances of fraud to the Board of Directors during the Financial Year ${fy}:</p>
       <p>${data.fraudDetails}</p>`
    : `<p>The Statutory Auditors of the Company have not reported any instance of fraud committed against the Company by its officers or employees as specified under Section 143(12) of the Companies Act, 2013 during the Financial Year ${fy}.</p>`
}

<!-- ══════════════ 11. RELATED PARTY TRANSACTIONS [Sec. 188, Sec. 134(3)(h)] ══════════════ -->
<h2>11. Related Party Transactions</h2>
${
  data.hasRPT
    ? `<p>All contracts or arrangements or transactions entered into by the Company during the Financial Year ${fy} with related parties referred to in sub-section (1) of Section 188 of the Companies Act, 2013 were in the ordinary course of business and on arm's length basis, except as mentioned in <strong>Form AOC-2</strong> annexed hereto as <strong>Annexure I</strong>.</p>`
    : `<p>All related party transactions entered into during the Financial Year ${fy} were in the ordinary course of business and at arm's length basis. The Company has not entered into any contracts, arrangements or transactions with related parties which could be considered material in terms of the policy on materiality of related party transactions. Therefore, disclosure in <strong>Form AOC-2</strong> is not required. Details of related party transactions as per AS-18 are set out in the Notes to the Financial Statements.</p>`
}

<!-- ══════════════ 12. CONSERVATION OF ENERGY [Rule 8(3)(A)] ══════════════ -->
<h2>12. Conservation of Energy</h2>
<p>${
  data.energyConservationDetails
    ? data.energyConservationDetails
    : `The Company has taken adequate measures for conservation of energy wherever possible. The operations of the Company are not energy-intensive. The particulars regarding energy consumption as per the Companies (Accounts) Rules, 2014 are given below:</p>
       <p>Steps taken or impact on conservation of energy: The Company continues to implement energy conservation measures such as usage of energy-efficient equipment and optimisation of energy usage in operations.</p>
       <p>Steps taken by the Company for utilising alternate sources of energy: Not applicable.</p>
       <p>Capital investment on energy conservation equipment: Nil.`
}</p>

<!-- ══════════════ 13. TECHNOLOGY ABSORPTION [Rule 8(3)(B)] ══════════════ -->
<h2>13. Technology Absorption</h2>
<p>${
  data.technologyAbsorptionDetails
    ? data.technologyAbsorptionDetails
    : `The Company has not imported any technology during the Financial Year ${fy}. The Company continues to use existing technology for its operations and has not incurred any expenditure on Research and Development during the year. There are no specific efforts required to be mentioned in this regard.`
}</p>

<!-- ══════════════ 14. FOREIGN EXCHANGE [Rule 8(3)(C)] ══════════════ -->
<h2>14. Foreign Exchange Earnings and Outgo</h2>
<table>
  <tr>
    <th style="width:70%">Particulars</th>
    <th class="right">FY ${fy} (₹)</th>
  </tr>
  <tr>
    <td>Foreign Exchange Earnings</td>
    <td class="right">${data.foreignExchangeEarnings ? fmtRs(data.foreignExchangeEarnings) : "Nil"}</td>
  </tr>
  <tr>
    <td>Foreign Exchange Outgo</td>
    <td class="right">${data.foreignExchangeOutgo ? fmtRs(data.foreignExchangeOutgo) : "Nil"}</td>
  </tr>
</table>

<!-- ══════════════ 15. RISK MANAGEMENT ══════════════ -->
<h2>15. Risk Management</h2>
<p>${
  data.riskManagementDetails
    ? data.riskManagementDetails
    : `The Company has a risk management policy in place to identify, assess and mitigate risks. The Board periodically reviews the risk landscape and takes appropriate steps to minimize and mitigate risks. The major risks identified by the Company include business risk, operational risk, financial risk and legal/regulatory risk, and the Company has in place adequate systems and processes to manage these risks.`
}</p>

<!-- ══════════════ 16. DEPOSITS [Sec. 73-76] ══════════════ -->
<h2>16. Deposits</h2>
${
  data.hasDeposits
    ? `<p>The Company has accepted deposits during the Financial Year ${fy}. Details in compliance with Chapter V of the Companies Act, 2013 are disclosed in the Notes to Financial Statements.</p>`
    : `<p>The Company has not accepted any deposits from the public within the meaning of Section 73 and 74 of the Companies Act, 2013 read with the Companies (Acceptance of Deposits) Rules, 2014 during the Financial Year ${fy}. No amount of principal or interest was outstanding as on the Balance Sheet date.</p>`
}

<!-- ══════════════ 17. LOANS, GUARANTEES & INVESTMENTS [Sec. 186] ══════════════ -->
<h2>17. Loans, Guarantees and Investments</h2>
${
  data.hasLoansGiven
    ? `<p>The particulars of loans given, investments made, guarantees given and securities provided under Section 186 of the Companies Act, 2013 are provided in the Notes to the Financial Statements.</p>`
    : `<p>The Company has not given any loans or provided any guarantees or made any investments as covered under Section 186 of the Companies Act, 2013 during the Financial Year ${fy}.</p>`
}

<!-- ══════════════ 18. SUBSIDIARIES [Sec. 129(3)] ══════════════ -->
<h2>18. Subsidiaries, Associates and Joint Ventures</h2>
${
  data.hasSubsidiaries
    ? `<p>A statement containing salient features of the financial statements of subsidiary/associate companies/joint ventures in the prescribed Form AOC-1 is annexed hereto as <strong>Annexure II</strong> pursuant to first proviso to Section 129(3) of the Companies Act, 2013.</p>`
    : `<p>The Company does not have any subsidiary, associate company or joint venture as on 31<sup>st</sup> March, ${fyEnd}. Therefore, Form AOC-1 is not applicable.</p>`
}

<!-- ══════════════ 19. CSR [Sec. 135] ══════════════ -->
<h2>19. Corporate Social Responsibility (CSR)</h2>
${
  data.csrApplicable && data.csrDetails
    ? `<p>The Company is required to constitute a Corporate Social Responsibility Committee and undertake CSR activities as per the provisions of Section 135 of the Companies Act, 2013 read with Schedule VII thereto and the Companies (Corporate Social Responsibility Policy) Rules, 2014. Details of CSR activities are as follows:</p>
       <p>${data.csrDetails}</p>`
    : `<p>The provisions of Section 135 of the Companies Act, 2013 regarding Corporate Social Responsibility are not applicable to the Company for the Financial Year ${fy}, as the Company's net worth, turnover and net profit are below the prescribed thresholds under Section 135(1) of the Companies Act, 2013.</p>`
}

<!-- ══════════════ 20. MATERIAL CHANGES [Sec. 134(3)(l)] ══════════════ -->
<h2>20. Material Changes and Commitments</h2>
${
  data.materialChangesAfterFY && data.materialChangesDetails
    ? `<p>${data.materialChangesDetails}</p>`
    : `<p>There are no material changes and commitments, affecting the financial position of the Company, which have occurred between the end of the Financial Year ${fy} and the date of this Report.</p>`
}

<!-- ══════════════ 21. DIRECTOR CHANGES ══════════════ -->
<h2>21. Changes in Directors and Key Managerial Personnel</h2>
${getDirectorChanges(data)}

<!-- ══════════════ 22. SIGNIFICANT ORDERS [Sec. 134(3)(q)] ══════════════ -->
<h2>22. Significant and Material Orders by Regulators / Courts</h2>
${
  data.significantOrders && data.significantOrdersDetails
    ? `<p>${data.significantOrdersDetails}</p>`
    : `<p>No significant or material orders have been passed by the Regulators, Courts or Tribunals which would impact the going concern status of the Company and its future operations during the Financial Year ${fy}.</p>`
}

<!-- ══════════════ 23. INSOLVENCY PROCEEDINGS [Sec. 134(3)(l)] ══════════════ -->
<h2>23. Proceedings Under Insolvency and Bankruptcy Code</h2>
<p>No application has been made or any proceeding is pending under the Insolvency and Bankruptcy Code, 2016 (31 of 2016) during the Financial Year ${fy}.</p>

<!-- ══════════════ 24. ONE-TIME SETTLEMENT [Sec. 134(3)(m)] ══════════════ -->
<h2>24. Details of Difference Between Valuation Amount on One-Time Settlement</h2>
<p>There were no instances of one-time settlement with Banks or Financial Institutions during the Financial Year ${fy}. Hence, no disclosure is required under this clause.</p>

<!-- ══════════════ 25. INTERNAL CONTROLS ══════════════ -->
<h2>25. Internal Financial Controls</h2>
<p>The Company has in place adequate internal financial controls with reference to the Financial Statements. Such controls have been assessed during the year taking into consideration the essential components of internal controls as stated in Guidance Note on Audit of Internal Financial Controls over Financial Reporting issued by the Institute of Chartered Accountants of India. Based on the results of such assessment, the Board of Directors is of the opinion that the Company's internal financial controls were adequate and effective during the Financial Year ${fy}.</p>

<!-- ══════════════ 26. SECRETARIAL STANDARDS ══════════════ -->
<h2>26. Compliance with Secretarial Standards</h2>
<p>The Company has complied with the applicable Secretarial Standards issued by the Institute of Company Secretaries of India (ICSI), namely SS-1 (Secretarial Standard on Meetings of the Board of Directors) and SS-2 (Secretarial Standard on General Meetings), as applicable to the Company.</p>

<!-- ══════════════ 27. POSH ══════════════ -->
<h2>27. Prevention of Sexual Harassment at Workplace</h2>
<p>The Company has in place a policy on Prevention, Prohibition and Redressal of Sexual Harassment at the Workplace in accordance with the provisions of the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 and the Rules made thereunder. No complaints of sexual harassment were filed during the Financial Year ${fy}.</p>

<!-- ══════════════ 28. STATUTORY AUDITOR ══════════════ -->
<h2>28. Statutory Auditor</h2>
<p>${
  data.auditor.firmName
    ? `M/s ${data.auditor.firmName} (FRN: ${data.auditor.frn}), Chartered Accountants, are the Statutory Auditors of the Company. The Company has received necessary certificate from the Auditors confirming that their appointment is in accordance with the conditions prescribed under Section 141 of the Companies Act, 2013.`
    : `The Statutory Auditors of the Company hold office as per applicable provisions of the Companies Act, 2013.`
}</p>

<!-- ══════════════ 29. ACKNOWLEDGEMENTS ══════════════ -->
<h2>29. Acknowledgements</h2>
<p>Your Directors would like to express their sincere appreciation for the assistance and co-operation received from the bankers, government authorities, regulatory authorities, customers and other business associates. Your Directors also wish to place on record their deep sense of appreciation to all the employees of the Company for their commendable teamwork and dedication.</p>

<!-- ══════════════ DIRECTORS TABLE ══════════════ -->
<div class="page-break"></div>
<h2>Composition of Board of Directors as on 31<sup>st</sup> March, ${fyEnd}</h2>
<table style="font-size:9.5pt;">
  <tr>
    <th class="center" style="width:4%">Sl.</th>
    <th style="width:22%">Name of Director</th>
    <th style="width:11%">DIN</th>
    <th style="width:15%">Designation</th>
    <th style="width:12%">Category</th>
    <th class="center" style="width:14%">Date of Appointment</th>
    <th class="center" style="width:14%">Date of Cessation</th>
    <th style="width:8%">Status</th>
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
