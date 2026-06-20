/**
 * Board Report — Rule 8 (Full)
 * Applicable to: Section 8 Companies, Farmer Producer Companies (FPC),
 *   and Private Limited NOT qualifying as small company
 * Legal basis: Section 134 of Companies Act 2013 read with Rule 8 of
 *   Companies (Accounts) Rules, 2014
 *
 * Section 8 is EXCLUDED from "small company" definition [Sec. 2(85)].
 * FPC follows full Rule 8 unless it qualifies as small company.
 *
 * Includes all Section 134(3) disclosures + Rule 8(3) + additional good practice:
 * Energy, Technology, Forex, Committees, Vigil Mechanism, Secretarial/Cost Audit (N/A),
 * Particulars of Employees, POSH, Maternity Benefit, IBC, One-time Settlement,
 * Business Responsibility (N/A), Corporate Governance (N/A)
 *
 * NOTE: Secretarial Audit not mandatory below thresholds (public company, paid-up ≥ ₹50 Cr / turnover ≥ ₹250 Cr).
 * NOTE: MGT-9 abolished. Web link of Annual Return only.
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

function getAttendanceRows(data: AnnualFilingData): string {
  const total = data.boardMeetings?.length || 0;
  return data.directors
    .filter(d => d.isActive)
    .map(d => {
      const attended = data.boardMeetings?.filter(m =>
        m.directorsPresent?.some(p => p.toLowerCase().includes(d.name.toLowerCase()))
      ).length ?? 0;
      const pct = total > 0 ? `${Math.round((attended / total) * 100)}%` : "—";
      return `<tr>
        <td>${d.name}</td>
        <td>${d.designation}</td>
        <td class="center">${total}</td>
        <td class="center">${attended || "—"}</td>
        <td class="center">${attended > 0 ? pct : "—"}</td>
      </tr>`;
    }).join("") || `<tr><td colspan="5" class="center">No director data available</td></tr>`;
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
  const fy       = data.financialYear;
  const fyEnd    = fyEndYear(fy);
  const fyStart  = fyStartYear(fy);
  const prevFY   = `${Number(fyStart) - 1}-${fyStart.slice(2)}`;

  const sig1 = data.signatoryDirectors.director1;
  const sig2 = data.signatoryDirectors.director2;
  const reportDate  = fmtDate(data.dateOfReport);
  const reportPlace = data.placeOfSigning || data.stateOfIncorporation || "";
  const totalMeetings = data.boardMeetings?.length || 0;

  const isSection8 = data.companyType === "section8";
  const isFPC      = data.companyType === "fpc";
  const hasID      = hasIndependentDirectors(data);

  const totalMeetingsWord = ["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve"][totalMeetings] ?? String(totalMeetings);

  // Labels
  const pandlLabel    = isSection8 ? "Income and Expenditure Account" : "Statement of Profit and Loss";
  const membersLabel  = isFPC ? "Producer Members" : "Members";
  const profitLabel   = isSection8 ? "Surplus / (Deficit)" : "Profit / (Loss) After Tax (PAT)";
  const incomeLabel   = isSection8 ? "Total Income" : "Total Income";

  const companyTypeNote = isSection8
    ? `<p>The Company is a Company incorporated under Section 8 of the Companies Act, 2013 and is committed to its objects as stated in its Memorandum of Association. The Company is prohibited from distributing its profits as dividends to its members.</p>`
    : isFPC
    ? `<p>The Company is a Farmer Producer Company (FPC) registered under Part IXA of the Companies Act, 1956 as preserved by Section 465 of the Companies Act, 2013, formed to promote the economic interests of its Producer Members engaged in primary produce activities.</p>`
    : "";

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
The ${membersLabel},<br>
<strong>${data.companyName}</strong></p>

<p>Your Directors have pleasure in presenting the Annual Report of the Company together with the Audited Financial Statements${isSection8 ? ` (${pandlLabel})` : ""} for the Financial Year ended 31<sup>st</sup> March, ${fyEnd}.</p>
${companyTypeNote}

<!-- ══════════════ 1. FINANCIAL SUMMARY ══════════════ -->
<h2>1. Financial Summary / Highlights</h2>
<p>The financial performance of the Company for the Financial Year ended 31<sup>st</sup> March, ${fyEnd} is summarized below:</p>
<table>
  <tr>
    <th style="width:55%">Particulars</th>
    <th class="right" style="width:22%">FY ${fy}<br>(₹)</th>
    <th class="right" style="width:23%">FY ${prevFY}<br>(₹)</th>
  </tr>
  <tr><td>${isSection8 ? "Income from Operations" : "Revenue from Operations"}</td><td class="right">${fmtRs(data.financials.revenueFromOperations)}</td><td class="right">${fmtRs(data.financials.prevRevenueFromOperations)}</td></tr>
  <tr><td>Other Income</td><td class="right">${fmtRs(data.financials.otherIncome)}</td><td class="right">${fmtRs(data.financials.prevOtherIncome)}</td></tr>
  <tr><td><strong>${incomeLabel}</strong></td><td class="right"><strong>${fmtRs(data.financials.totalIncome)}</strong></td><td class="right"><strong>${fmtRs(data.financials.prevTotalIncome)}</strong></td></tr>
  <tr><td>Total Expenses</td><td class="right">${fmtRs(data.financials.totalExpenses)}</td><td class="right">${fmtRs(data.financials.prevTotalExpenses)}</td></tr>
  <tr><td><strong>${isSection8 ? "Surplus / (Deficit) Before Tax" : "Profit / (Loss) Before Tax"}</strong></td><td class="right"><strong>${fmtRs(data.financials.profitBeforeTax)}</strong></td><td class="right"><strong>${fmtRs(data.financials.prevProfitBeforeTax)}</strong></td></tr>
  <tr><td>Current Tax</td><td class="right">${fmtRs(data.financials.currentTax)}</td><td class="right">${fmtRs(data.financials.prevCurrentTax)}</td></tr>
  <tr><td>Deferred Tax</td><td class="right">${fmtRs(data.financials.deferredTax)}</td><td class="right">${fmtRs(data.financials.prevDeferredTax)}</td></tr>
  <tr><td><strong>${profitLabel}</strong></td><td class="right"><strong>${fmtRs(data.financials.profitAfterTax)}</strong></td><td class="right"><strong>${fmtRs(data.financials.prevProfitAfterTax)}</strong></td></tr>
  <tr><td>${isSection8 ? "Total Corpus / General Fund" : "Total Reserves &amp; Surplus"}</td><td class="right">${fmtRs(data.financials.reservesAndSurplus)}</td><td class="right">${fmtRs(data.financials.prevReservesAndSurplus)}</td></tr>
  ${!isSection8 ? `<tr><td>Earnings Per Share (Basic &amp; Diluted) (₹)</td><td class="right">${data.financials.profitAfterTax && data.totalShares ? (parseFloat(data.financials.profitAfterTax.replace(/,/g, "")) / data.totalShares).toFixed(2) : "—"}</td><td class="right">${data.financials.prevProfitAfterTax && data.totalShares ? (parseFloat(data.financials.prevProfitAfterTax.replace(/,/g, "")) / data.totalShares).toFixed(2) : "—"}</td></tr>` : ""}
</table>

<!-- ══════════════ 2. DIVIDEND [Sec. 134(3)(k)] ══════════════ -->
<h2>2. Dividend</h2>
${isSection8
  ? `<p>The Company is incorporated under Section 8 of the Companies Act, 2013 as a not-for-profit entity. The Company is prohibited from declaring or paying any dividend to its Members. The surplus, if any, arising from the ${pandlLabel} is applied solely towards the furtherance of the Company's objects as stated in its Memorandum of Association.</p>`
  : isFPC
  ? `<p>Your Directors do not recommend any dividend on the Equity Shares of the Company for the Financial Year ${fy}. The Board may, subject to the provisions of Part IXA of the Companies Act, 1956, declare a Patronage Bonus from the surplus available after making required provisions. No Patronage Bonus has been declared for the Financial Year ${fy}.</p>`
  : `<p>Your Directors do not recommend any dividend on the Equity Shares of the Company for the Financial Year ended 31<sup>st</sup> March, ${fyEnd} in order to conserve resources for the future operations of the Company. No dividend was paid during the Financial Year ${fy}. There is no unpaid / unclaimed dividend pending for transfer to the Investor Education and Protection Fund (IEPF).</p>`
}

<!-- ══════════════ 3. TRANSFER TO RESERVES ══════════════ -->
<h2>3. Transfer to Reserves</h2>
${isSection8
  ? `<p>The surplus, if any, from the ${pandlLabel} for the Financial Year ${fy} has been retained in the corpus of the Company and applied towards its charitable objects. No amount has been transferred to any separate reserve during the year.</p>`
  : `<p>The Board of Directors has not proposed any amount to be transferred to reserves for the Financial Year ${fy}. The entire profit / (loss) has been retained in the ${pandlLabel} of the Company.</p>`
}

<!-- ══════════════ 4. STATE OF AFFAIRS ══════════════ -->
<h2>4. State of Affairs / Business Operations</h2>
<p>${data.stateOfAffairs || `During the Financial Year ${fy}, the Company continued its principal business activities. The overall performance of the Company was satisfactory during the year under review.`}</p>

<!-- ══════════════ 5. ANNUAL RETURN [Sec. 92(3)] ══════════════ -->
<h2>5. Annual Return</h2>
<p>Pursuant to Section 92(3) of the Companies Act, 2013 read with Rule 12(1) of the Companies (Management and Administration) Rules, 2014, the Annual Return of the Company in Form MGT-7 for the Financial Year ended 31<sup>st</sup> March, ${fyEnd} ${
  data.annualReturnWebLink
    ? `is available on the website of the Company at: <strong>${data.annualReturnWebLink}</strong>`
    : `shall be filed with the Registrar of Companies. A copy of the Annual Return shall be made available at the Registered Office of the Company for inspection during business hours. The extract of Annual Return in Form MGT-9 is no longer required pursuant to the Companies (Amendment) Act, 2017.`
}</p>

<!-- ══════════════ 6. BOARD MEETINGS [Sec. 134(3)(b)] ══════════════ -->
<h2>6. Number of Board Meetings</h2>
<p>During the Financial Year ${fy}, <strong>${totalMeetings} (${totalMeetingsWord})</strong> meeting(s) of the Board of Directors were held. The details of Board Meetings held during the year are as under:</p>
<table>
  <tr>
    <th class="center" style="width:12%">Sl. No.</th>
    <th class="center" style="width:33%">Date of Meeting</th>
    <th style="width:55%">Directors Present</th>
  </tr>
  ${getMeetingRows(data)}
</table>
<p>The gap between any two consecutive Board Meetings did not exceed one hundred and twenty days as required under Section 173(1) of the Companies Act, 2013.</p>

<p><strong>Attendance of Directors at Board Meetings:</strong></p>
<table>
  <tr>
    <th>Name of Director</th>
    <th>Designation</th>
    <th class="center">Meetings Entitled</th>
    <th class="center">Meetings Attended</th>
    <th class="center">% Attendance</th>
  </tr>
  ${getAttendanceRows(data)}
</table>

<!-- ══════════════ 7. GENERAL MEETINGS / AGM ══════════════ -->
<h2>7. General Meetings</h2>
<p>The Annual General Meeting (AGM) of the Company for the Financial Year ${prevFY} was held on <strong>________________</strong>. The ${membersLabel} present at the AGM were:</p>
<table>
  <tr>
    <th style="width:50%">Name</th>
    <th>Designation / Status</th>
    <th class="center">Attendance</th>
  </tr>
  ${data.directors.filter(d => d.isActive).map(d => `<tr><td>${d.name}</td><td>${d.designation}</td><td class="center">Present</td></tr>`).join("") || `<tr><td colspan="3" class="center">Details to be filled</td></tr>`}
</table>
<p>The next AGM for the Financial Year ${fy} shall be held within the time stipulated under Section 96 of the Companies Act, 2013.</p>

<!-- ══════════════ 8. SHARE CAPITAL [Sec. 134(3)] ══════════════ -->
<h2>8. Share Capital</h2>
<p>As on 31<sup>st</sup> March, ${fyEnd}, the Share Capital of the Company stood as under:</p>
<table>
  <tr>
    <th style="width:60%">Particulars</th>
    <th class="right">Amount (₹)</th>
  </tr>
  <tr><td>Authorised Share Capital</td><td class="right">${fmtRs(data.financials.authorisedCapital)}</td></tr>
  <tr><td>Paid-up Share Capital</td><td class="right">${fmtRs(data.financials.paidUpCapital)}</td></tr>
</table>
<p>${data.capitalChanges || `There was no change in the Authorised or Paid-up Share Capital of the Company during the Financial Year ${fy}.`}</p>

<!-- ══════════════ 9. DIRECTORS' RESPONSIBILITY STATEMENT [Sec. 134(3)(c) & 134(5)] ══════════════ -->
<h2>9. Directors' Responsibility Statement</h2>
<p>Pursuant to Section 134(3)(c) read with Section 134(5) of the Companies Act, 2013, your Directors confirm that:</p>
<ol type="i">
  <li>In the preparation of the annual accounts for the Financial Year ended 31<sup>st</sup> March, ${fyEnd}, the applicable accounting standards have been followed along with proper explanation relating to material departures, if any;</li>
  <li>The Directors have selected such accounting policies and applied them consistently and made judgements and estimates that are reasonable and prudent so as to give a true and fair view of the state of affairs of the Company as at 31<sup>st</sup> March, ${fyEnd} and of the ${isSection8 ? "surplus / (deficit)" : "profit / (loss)"} of the Company for the year ended on that date;</li>
  <li>The Directors have taken proper and sufficient care for the maintenance of adequate accounting records in accordance with the provisions of the Companies Act, 2013 for safeguarding the assets of the Company and for preventing and detecting fraud and other irregularities;</li>
  <li>The Directors have prepared the annual accounts on a going concern basis; and</li>
  <li>The Directors have devised proper systems to ensure compliance with the provisions of all applicable laws and that such systems were adequate and operating effectively.</li>
</ol>

<!-- ══════════════ 10. INDEPENDENT DIRECTORS [Sec. 149(7)] ══════════════ -->
<h2>10. Declaration by Independent Directors</h2>
${hasID
  ? `<p>The Company has received necessary declarations from all Independent Directors of the Company pursuant to Section 149(7) of the Companies Act, 2013, confirming that they meet the criteria of independence as prescribed under Section 149(6) of the Companies Act, 2013. In the opinion of the Board, the Independent Directors possess the attributes of integrity, expertise and experience as required to be disclosed under Rule 8(5)(iiia) of the Companies (Accounts) Rules, 2014.</p>`
  : `<p>As at 31<sup>st</sup> March, ${fyEnd}, the Company does not have any Independent Director on its Board. ${isSection8 ? "Section 8 Companies are generally not required to appoint Independent Directors unless they meet the thresholds prescribed under Rule 4 of the Companies (Appointment and Qualification of Directors) Rules, 2014." : "Accordingly, no declaration under Section 149(7) of the Companies Act, 2013 is required."}</p>`
}

<!-- ══════════════ 11. BOARD PERFORMANCE EVALUATION [Sec. 134(3)(p)] ══════════════ -->
<h2>11. Board Performance Evaluation</h2>
<p>${hasID
  ? `Pursuant to the provisions of the Companies Act, 2013, the Board has carried out an annual performance evaluation of its own performance, the Directors individually, as well as the evaluation of the working of its Committees. The performance of the Board was evaluated after seeking inputs from all the Directors on the basis of criteria such as composition, diversity, meeting process, strategic engagement and governance. The performance evaluation of Independent Directors was done by the entire Board, excluding the Director being evaluated.`
  : `The Board of Directors has carried out the annual evaluation of its own performance as well as that of individual Directors as mandated by Section 134(3)(p) of the Companies Act, 2013. The evaluation framework focused on areas such as Board composition, Board meeting process, strategic engagement, effectiveness of decision-making, and adherence to governance standards.`
}</p>
${isSection8 ? `<p><em>Note: As the Company's paid-up capital is below ₹25 Crores, the formal evaluation of Independent Directors is not applicable.</em></p>` : ""}

<!-- ══════════════ 12. AUDIT COMMITTEE [Sec. 177] ══════════════ -->
<h2>12. Audit Committee</h2>
<p>The provisions of Section 177 of the Companies Act, 2013 relating to constitution of Audit Committee are applicable to public companies with paid-up capital ≥ ₹10 Crores or turnover ≥ ₹100 Crores or outstanding loans ≥ ₹50 Crores. The Company does not meet these thresholds as a private company. Accordingly, the Company is not mandatorily required to constitute an Audit Committee.</p>

<!-- ══════════════ 13. NOMINATION & REMUNERATION COMMITTEE [Sec. 178] ══════════════ -->
<h2>13. Nomination &amp; Remuneration Committee</h2>
<p>The provisions of Section 178(1) of the Companies Act, 2013 regarding Nomination and Remuneration Committee are not applicable to the Company as it is a private company not meeting the prescribed thresholds. Accordingly, the Company is not required to constitute a Nomination and Remuneration Committee or frame a Nomination and Remuneration Policy under Section 178(3) of the Companies Act, 2013 at present.</p>
${isFPC ? `<p><em>Note: As a Producer Company, the Board determines remuneration for its Key Managerial Personnel in accordance with the provisions applicable to Producer Companies under Part IXA of the Companies Act, 1956.</em></p>` : ""}

<!-- ══════════════ 14. CSR COMMITTEE [Sec. 135] ══════════════ -->
<h2>14. Corporate Social Responsibility (CSR)</h2>
${data.csrApplicable && data.csrDetails
  ? `<p>The Company is required to undertake CSR activities as per the provisions of Section 135 of the Companies Act, 2013. A CSR Committee has been constituted. Details of CSR activities and expenditure during the Financial Year ${fy} are as follows:</p>
     <p>${data.csrDetails}</p>`
  : `<p>The provisions of Section 135 of the Companies Act, 2013 regarding Corporate Social Responsibility are not applicable to the Company for the Financial Year ${fy} as the Company's net worth, turnover and net profit are below the prescribed thresholds under Section 135(1) of the Companies Act, 2013. Accordingly, the Company has not constituted a CSR Committee and no CSR expenditure was required to be made.</p>`
}

<!-- ══════════════ 15. STAKEHOLDERS RELATIONSHIP COMMITTEE ══════════════ -->
<h2>15. Stakeholders Relationship Committee</h2>
<p>The constitution of a Stakeholders Relationship Committee is required where the number of shareholders or debenture holders exceeds one thousand. As the Company's total number of ${isFPC ? "producer members" : "shareholders"} is well below the said threshold, the Stakeholders Relationship Committee has not been constituted. ${isFPC ? "Grievances of Producer Members are addressed directly by the Board of Directors." : ""}</p>

<!-- ══════════════ 16. RISK MANAGEMENT COMMITTEE ══════════════ -->
<h2>16. Risk Management Committee</h2>
<p>The provisions relating to constitution of a Risk Management Committee under the SEBI (LODR) Regulations, 2015 are not applicable to the Company as it is an unlisted company. Accordingly, no Risk Management Committee has been constituted. However, the Board periodically reviews the risk landscape of the Company.</p>

<!-- ══════════════ 17. VIGIL MECHANISM / WHISTLE-BLOWER [Sec. 177(9)/(10)] ══════════════ -->
<h2>17. Vigil Mechanism / Whistle-blower Policy</h2>
<p>The provisions of Section 177(9) and 177(10) of the Companies Act, 2013 regarding Vigil Mechanism are mandatory for listed companies, companies accepting deposits from the public, and companies with outstanding borrowings from banks exceeding ₹50 Crores. The Company does not fall under any of the above categories. Accordingly, the Company is not required to establish a formal Vigil Mechanism / Whistle-blower Policy. The Board ensures a culture of transparency and integrity within the organization.</p>

<!-- ══════════════ 18. RISK MANAGEMENT ══════════════ -->
<h2>18. Risk Management</h2>
<p>${data.riskManagementDetails || `The Company has a risk management framework to identify, assess and mitigate the risks that could affect its operations and financial performance. The Board periodically reviews the risk landscape and takes appropriate steps to minimize and mitigate risks. The major risks identified include business risk, operational risk, financial risk and legal / regulatory risk. Adequate systems and processes are in place to manage these risks effectively.`}</p>

<!-- ══════════════ 19. CONSERVATION OF ENERGY [Rule 8(3)(A)] ══════════════ -->
<h2>19. Conservation of Energy</h2>
<p>${data.energyConservationDetails
  ? data.energyConservationDetails
  : `The operations of the Company are not energy-intensive. The Company has taken adequate measures for conservation of energy wherever possible.`}</p>
<p><em>(i) Steps taken or impact on conservation of energy:</em> The Company continues to implement energy conservation practices such as usage of energy-efficient equipment and optimisation of energy usage in operations.<br>
<em>(ii) Steps taken by the Company for utilising alternate sources of energy:</em> Not applicable.<br>
<em>(iii) Capital investment on energy conservation equipment:</em> Nil.</p>

<!-- ══════════════ 20. TECHNOLOGY ABSORPTION [Rule 8(3)(B)] ══════════════ -->
<h2>20. Technology Absorption</h2>
<p>${data.technologyAbsorptionDetails || `The Company has not imported any technology during the Financial Year ${fy}. The Company has not incurred any expenditure on Research and Development. No technology absorption, adaptation or innovation was carried out during the year.`}</p>

<!-- ══════════════ 21. FOREIGN EXCHANGE EARNINGS & OUTGO [Rule 8(3)(C)] ══════════════ -->
<h2>21. Foreign Exchange Earnings and Outgo</h2>
<table>
  <tr>
    <th style="width:70%">Particulars</th>
    <th class="right">FY ${fy} (₹)</th>
  </tr>
  <tr><td>Foreign Exchange Earnings</td><td class="right">${data.foreignExchangeEarnings ? fmtRs(data.foreignExchangeEarnings) : "Nil"}</td></tr>
  <tr><td>Foreign Exchange Outgo</td><td class="right">${data.foreignExchangeOutgo ? fmtRs(data.foreignExchangeOutgo) : "Nil"}</td></tr>
</table>

<!-- ══════════════ 22. RELATED PARTY TRANSACTIONS [Sec. 188, 134(3)(h)] ══════════════ -->
<h2>22. Related Party Transactions</h2>
${data.hasRPT
  ? `<p>All contracts or arrangements or transactions entered into by the Company during the Financial Year ${fy} with related parties referred to in Section 188(1) of the Companies Act, 2013 were in the ordinary course of business and on arm's length basis, except as mentioned in <strong>Form AOC-2</strong> annexed hereto as <strong>Annexure I</strong>.</p>`
  : `<p>All related party transactions entered into during the Financial Year ${fy} were in the ordinary course of business and at arm's length basis. The Company has not entered into any contracts, arrangements or transactions with related parties which could be considered material. Accordingly, disclosure in <strong>Form AOC-2</strong> is not required. Details of related party transactions as per AS-18 are set out in the Notes to the Financial Statements.</p>`
}

<!-- ══════════════ 23. LOANS, GUARANTEES & INVESTMENTS [Sec. 186] ══════════════ -->
<h2>23. Loans, Guarantees and Investments</h2>
${data.hasLoansGiven
  ? `<p>The particulars of loans given, investments made, guarantees given and securities provided under Section 186 of the Companies Act, 2013 are provided in the Notes to the Financial Statements.</p>`
  : `<p>The Company has not given any loans, provided any guarantees or made any investments falling under the provisions of Section 186 of the Companies Act, 2013 during the Financial Year ${fy}.</p>`
}

<!-- ══════════════ 24. SUBSIDIARIES [Sec. 129(3)] ══════════════ -->
<h2>24. Subsidiaries, Associates and Joint Ventures</h2>
${data.hasSubsidiaries
  ? `<p>A statement containing salient features of the financial statements of subsidiary/associate companies in Form AOC-1 is annexed hereto as <strong>Annexure II</strong> pursuant to Section 129(3) of the Companies Act, 2013.</p>`
  : `<p>The Company does not have any subsidiary, associate company or joint venture as on 31<sup>st</sup> March, ${fyEnd}. Accordingly, Form AOC-1 is not required to be annexed.</p>`
}

<!-- ══════════════ 25. DEPOSITS [Sec. 73-76] ══════════════ -->
<h2>25. Deposits</h2>
${data.hasDeposits
  ? `<p>The Company has accepted deposits during the Financial Year ${fy}. Details in compliance with Chapter V of the Companies Act, 2013 are disclosed in the Notes to Financial Statements.</p>`
  : `<p>The Company has not accepted any deposits from the public within the meaning of Sections 73 and 74 of the Companies Act, 2013 read with the Companies (Acceptance of Deposits) Rules, 2014 during the Financial Year ${fy}. No amount of principal or interest was outstanding as on 31<sup>st</sup> March, ${fyEnd}.</p>`
}

<!-- ══════════════ 26. STATUTORY AUDITOR ══════════════ -->
<h2>26. Statutory Auditor</h2>
<p>${data.auditor.firmName
  ? `M/s ${data.auditor.firmName} (Firm Registration No.: ${data.auditor.frn}), Chartered Accountants, are the Statutory Auditors of the Company. The Company has received a certificate from the Auditors confirming that their appointment is in accordance with the conditions prescribed under Section 141 of the Companies Act, 2013.`
  : `The Statutory Auditors of the Company hold office as per applicable provisions of the Companies Act, 2013. Their appointment has been duly made in compliance with Section 139 of the Companies Act, 2013.`
}</p>

<!-- ══════════════ 27. SECRETARIAL AUDIT [Sec. 204] ══════════════ -->
<h2>27. Secretarial Audit</h2>
<p>The provisions of Section 204 of the Companies Act, 2013 relating to Secretarial Audit are applicable to public companies with paid-up share capital of ₹50 Crores or more, or turnover of ₹250 Crores or more. The Company does not meet the aforesaid thresholds. Accordingly, Secretarial Audit is not applicable to the Company for the Financial Year ${fy}.</p>

<!-- ══════════════ 28. COST AUDIT [Sec. 148] ══════════════ -->
<h2>28. Cost Audit</h2>
<p>The provisions of Section 148 of the Companies Act, 2013 relating to Cost Audit are not applicable to the Company for the Financial Year ${fy} as the Company is below the prescribed thresholds for maintenance of cost records and audit under the Companies (Cost Records and Audit) Rules, 2014.</p>

<!-- ══════════════ 29. AUDITOR QUALIFICATIONS [Sec. 134(3)(f)] ══════════════ -->
<h2>29. Auditors' Report — Qualifications, Reservations and Adverse Remarks</h2>
${data.auditQualification && data.auditQualificationExplanation
  ? `<p>The Statutory Auditors have made certain qualifications / reservations / adverse remarks in their Audit Report. The Board of Directors provides the following explanation / comments thereon as required under Section 134(3)(f) of the Companies Act, 2013:</p>
     <p>${data.auditQualificationExplanation}</p>`
  : `<p>The Statutory Auditors' Report for the Financial Year ${fy} does not contain any qualification, reservation, adverse remark or disclaimer. Accordingly, no explanation or comment is required to be given by the Board of Directors under Section 134(3)(f) of the Companies Act, 2013.</p>`
}

<!-- ══════════════ 30. FRAUDS BY AUDITORS [Sec. 143(12)] ══════════════ -->
<h2>30. Frauds Reported by Statutory Auditors</h2>
${data.fraudReported && data.fraudDetails
  ? `<p>The Statutory Auditors have reported the following instances of fraud committed against the Company by its officers or employees to the Board of Directors during the Financial Year ${fy}:</p>
     <p>${data.fraudDetails}</p>`
  : `<p>The Statutory Auditors of the Company have not reported any instance of fraud committed against the Company by its officers or employees as specified under Section 143(12) of the Companies Act, 2013 during the Financial Year ${fy}. Hence, no disclosure is required to be made under Rule 13 of the Companies (Audit and Auditors) Rules, 2014.</p>`
}

<!-- ══════════════ 31. INTERNAL FINANCIAL CONTROLS ══════════════ -->
<h2>31. Internal Financial Controls</h2>
<p>The Company has in place adequate internal financial controls with reference to the Financial Statements. Such controls have been assessed during the year taking into consideration the essential components of internal controls as stated in the Guidance Note on Audit of Internal Financial Controls over Financial Reporting issued by the Institute of Chartered Accountants of India. Based on the results of such assessment, the Board of Directors is of the opinion that the Company's internal financial controls were adequate and effective during the Financial Year ${fy}. The Statutory Auditors have not reported any significant deficiency or material weakness in internal financial controls over financial reporting.</p>

<!-- ══════════════ 32. MATERIAL CHANGES [Sec. 134(3)(l)] ══════════════ -->
<h2>32. Material Changes and Commitments</h2>
${data.materialChangesAfterFY && data.materialChangesDetails
  ? `<p>${data.materialChangesDetails}</p>`
  : `<p>There are no material changes and commitments, affecting the financial position of the Company, which have occurred between the end of the Financial Year ${fy} and the date of this Report.</p>`
}

<!-- ══════════════ 33. DIRECTOR / KMP CHANGES ══════════════ -->
<h2>33. Changes in Directors and Key Managerial Personnel</h2>
${getDirectorChanges(data)}

<!-- ══════════════ 34. SIGNIFICANT ORDERS [Sec. 134(3)(q)] ══════════════ -->
<h2>34. Significant and Material Orders by Regulators / Courts</h2>
${data.significantOrders && data.significantOrdersDetails
  ? `<p>${data.significantOrdersDetails}</p>`
  : `<p>No significant or material orders have been passed by any Regulator, Court or Tribunal which would impact the going concern status and future operations of the Company during the Financial Year ${fy}.</p>`
}

<!-- ══════════════ 35. INSOLVENCY PROCEEDINGS [Sec. 134(3)(l)] ══════════════ -->
<h2>35. Proceedings Under Insolvency and Bankruptcy Code, 2016</h2>
<p>No application has been made and no proceeding is pending under the Insolvency and Bankruptcy Code, 2016 (31 of 2016) against the Company during the Financial Year ${fy}.</p>

<!-- ══════════════ 36. ONE-TIME SETTLEMENT [Sec. 134(3)(m)] ══════════════ -->
<h2>36. Details of Difference Between Amount of Valuation on One-Time Settlement</h2>
<p>There were no instances of one-time settlement with any Bank or Financial Institution during the Financial Year ${fy}. Hence, no disclosure is required under this clause.</p>

<!-- ══════════════ 37. PARTICULARS OF EMPLOYEES [Sec. 197(12)] ══════════════ -->
<h2>37. Particulars of Employees</h2>
<p>The information required pursuant to Section 197(12) of the Companies Act, 2013 read with Rule 5(2) and 5(3) of the Companies (Appointment and Remuneration of Managerial Personnel) Rules, 2014 in respect of employees of the Company is as under:</p>
<p>During the Financial Year ${fy}, no employee of the Company was in receipt of remuneration in excess of the limits prescribed under Rule 5(2) of the Companies (Appointment and Remuneration of Managerial Personnel) Rules, 2014. Accordingly, no statement is required to be annexed to this Report.</p>

<!-- ══════════════ 38. POSH ══════════════ -->
<h2>38. Prevention of Sexual Harassment at Workplace (POSH)</h2>
<p>The Company has in place a policy on Prevention, Prohibition and Redressal of Sexual Harassment at the Workplace in accordance with the provisions of the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 and the Rules made thereunder.</p>
<p>The following is the summary of complaints received and disposed-off during the Financial Year ${fy}:</p>
<table>
  <tr>
    <th style="width:70%">Particulars</th>
    <th class="right">Number</th>
  </tr>
  <tr><td>Number of complaints received during the year</td><td class="right">Nil</td></tr>
  <tr><td>Number of complaints disposed-off during the year</td><td class="right">Nil</td></tr>
  <tr><td>Number of complaints pending as on end of the year</td><td class="right">Nil</td></tr>
</table>

<!-- ══════════════ 39. MATERNITY BENEFIT ACT ══════════════ -->
<h2>39. Compliance with Maternity Benefit Act, 1961</h2>
<p>The Company is in compliance with the applicable provisions of the Maternity Benefit Act, 1961. No employee availed maternity leave or filed any related complaint during the Financial Year ${fy}.</p>

<!-- ══════════════ 40. EMPLOYEE COUNT (GENDER-WISE) ══════════════ -->
<h2>40. Particulars of Employees (Gender-wise) as on 31<sup>st</sup> March, ${fyEnd}</h2>
<table>
  <tr>
    <th style="width:50%">Category</th>
    <th class="right">Number of Employees</th>
  </tr>
  <tr><td>Female</td><td class="right">________________</td></tr>
  <tr><td>Male</td><td class="right">________________</td></tr>
  <tr><td>Transgender</td><td class="right">________________</td></tr>
  <tr><td><strong>Total</strong></td><td class="right"><strong>________________</strong></td></tr>
</table>

<!-- ══════════════ 41. SECRETARIAL STANDARDS ══════════════ -->
<h2>41. Compliance with Secretarial Standards</h2>
<p>The Company has complied with the applicable Secretarial Standards issued by the Institute of Company Secretaries of India (ICSI), namely SS-1 (Secretarial Standard on Meetings of the Board of Directors) and SS-2 (Secretarial Standard on General Meetings), as applicable to the Company during the Financial Year ${fy}.</p>

<!-- ══════════════ 42. BUSINESS RESPONSIBILITY ══════════════ -->
<h2>42. Business Responsibility and Sustainability Report</h2>
<p>The provisions of Regulation 34(2)(f) of the SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015 regarding Business Responsibility and Sustainability Report are applicable only to the top 1000 listed companies by market capitalisation. The Company is an unlisted company. Accordingly, this provision is not applicable to the Company.</p>

<!-- ══════════════ 43. CORPORATE GOVERNANCE ══════════════ -->
<h2>43. Corporate Governance</h2>
<p>The provisions relating to Corporate Governance Report as required under the SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015 are not applicable to the Company as it is an unlisted company. However, the Company strives to maintain good corporate governance practices in its day-to-day operations consistent with the principles of transparency, accountability and integrity.</p>

<!-- ══════════════ 44. ACKNOWLEDGEMENTS ══════════════ -->
<h2>44. Acknowledgements</h2>
<p>Your Directors would like to express their sincere appreciation for the assistance and co-operation received from the bankers, government authorities, regulatory authorities, customers and other business associates during the Financial Year ${fy}. Your Directors also wish to place on record their deep sense of appreciation to all the employees of the Company for their commendable teamwork and dedication.</p>
<p>The Board also thanks the ${membersLabel} of the Company for reposing confidence and trust in the management of the Company.</p>

<!-- ══════════════ DIRECTOR TABLE ══════════════ -->
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
