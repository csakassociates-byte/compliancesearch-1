/**
 * Board Report — Rule 8A (Abridged)
 * Applicable to: OPC (One Person Company) + Small Companies
 * Legal basis: Section 134 of Companies Act 2013 read with Rule 8A of
 *   Companies (Accounts) Amendment Rules, 2018
 *
 * Mandatory under Rule 8A: (a) Web link of Annual Return, (b) Board meetings,
 * (c) Capital, (d) DRS [Sec.134(5)], (e) Auditor qualifications, (f) Frauds,
 * (g) RPT/AOC-2, (h) State of affairs, (i) Financial highlights,
 * (j) Material changes, (k) Director changes, (l) Significant orders
 *
 * Additional sections included (good practice / applicable law):
 * — Dividend, Transfer to Reserves, AGM, Committees (all N/A), Vigil Mechanism (N/A),
 *   Energy/Tech/Forex (Rule 8(3)), Risk Management, Deposits, Secretarial/Cost Audit (N/A),
 *   Particulars of Employees, POSH, Maternity Benefit, IBC, One-time Settlement,
 *   Business Responsibility (N/A), Corporate Governance (N/A)
 *
 * NOTE: MGT-9 abolished; Secretarial Audit N/A for private companies.
 */

import type { AnnualFilingData } from "../types";
import { fmtDate, fmtRs, fyEndYear, fyStartYear, sigCol, wrapPage } from "../utils";

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

function dirIsFirstDirector(d: AnnualFilingData["directors"][0], data: AnnualFilingData): boolean {
  return !!(d.dateOfAppointment && data.incorporationDate && d.dateOfAppointment === data.incorporationDate);
}

function dirHasLeft(d: AnnualFilingData["directors"][0]): boolean {
  return d.changedDuringYear === true && (
    d.changeType === "resigned" || d.changeType === "ceased" || d.isActive === false
  );
}

function getDirectorRows(data: AnnualFilingData): string {
  return data.directors
    .filter(d => d.isActive || dirHasLeft(d) || d.changeType === "resigned" || d.changeType === "ceased")
    .map((d, i) => {
      const left        = dirHasLeft(d);
      const statusLabel = left
        ? (d.changeType === "resigned" ? "Resigned" : "Ceased")
        : "Active";
      const isFirst = dirIsFirstDirector(d, data);
      const apptCell = `${fmtDate(d.dateOfAppointment) || "—"}${isFirst ? `<br><em style="font-size:7.5pt;">(First Director)</em>` : ""}`;
      return `
    <tr>
      <td class="center">${i + 1}</td>
      <td>${d.name}</td>
      <td>${d.din || "—"}</td>
      <td>${d.designation}</td>
      <td class="center">${apptCell}</td>
      <td class="center">${d.dateOfCessation ? fmtDate(d.dateOfCessation) : "—"}</td>
      <td>${statusLabel}</td>
    </tr>`;
    }).join("");
}

function getDirectorChanges(data: AnnualFilingData): string {
  const fy      = data.financialYear;
  const fyStart = fy.split("-")[0];
  const fyEnd   = String(parseInt(fyStart) + 1);
  const fyFrom  = new Date(`${fyStart}-04-01`);
  const fyTo    = new Date(`${fyEnd}-03-31`);

  const isInFY = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= fyFrom && d <= fyTo;
  };

  // Auto-detect newly appointed: appointment date falls in current FY and is NOT incorporation date
  const appointed = data.directors.filter(d =>
    isInFY(d.dateOfAppointment) && !dirIsFirstDirector(d, data) && !dirHasLeft(d)
  );

  // Resigned / ceased: manual flag OR isActive=false when changedDuringYear
  const resigned = data.directors.filter(d => dirHasLeft(d));

  if (appointed.length === 0 && resigned.length === 0) {
    return `<p>There were no changes in the directorship of the Company during the Financial Year under review.</p>`;
  }

  let html = "";
  if (appointed.length > 0) {
    html += `<p>During the Financial Year ${fy}, the following Director(s) were appointed on the Board of the Company:</p>
    <table style="font-size:9.5pt;">
      <tr>
        <th style="width:35%">Name of Director</th><th style="width:15%">DIN</th>
        <th style="width:25%">Designation</th><th style="width:25%" class="center">Date of Appointment</th>
      </tr>
      ${appointed.map(d => `<tr><td>${d.name}</td><td>${d.din || "—"}</td><td>${d.designation}</td><td class="center">${fmtDate(d.dateOfAppointment)}</td></tr>`).join("")}
    </table>`;
  }
  if (resigned.length > 0) {
    html += `<p>During the Financial Year ${fy}, the following Director(s) resigned / ceased to be Director(s) of the Company:</p>
    <table style="font-size:9.5pt;">
      <tr>
        <th style="width:35%">Name of Director</th><th style="width:15%">DIN</th>
        <th style="width:25%">Designation</th><th style="width:25%" class="center">Date of Cessation</th>
      </tr>
      ${resigned.map(d => `<tr><td>${d.name}</td><td>${d.din || "—"}</td><td>${d.designation}</td><td class="center">${d.dateOfCessation ? fmtDate(d.dateOfCessation) : "—"}</td></tr>`).join("")}
    </table>`;
  }
  return html;
}

function ordinalStr(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) { case 1: return `${n}st`; case 2: return `${n}nd`; case 3: return `${n}rd`; default: return `${n}th`; }
}

const TENURE_WORDS: Record<number, string> = {
  1: "one (1)", 2: "two (2)", 3: "three (3)", 4: "four (4)", 5: "five (5)"
};

function getStatutoryAuditorPara(data: AnnualFilingData): string {
  const a = data.auditor;
  const isProp = a.firmType === "proprietorship";
  const auditorWord = isProp ? "Auditor" : "Auditors";
  const auditorName = isProp
    ? `${a.partnerName}, Chartered Accountant (Membership No. ${a.membershipNo})`
    : `M/s. ${a.firmName}, Chartered Accountants (Firm Registration No. ${a.frn})`;

  if (a.appointmentType === "board" && a.boardAppointmentDate) {
    return `The Board of Directors of the Company, at its meeting held on ${fmtDate(a.boardAppointmentDate)}, appointed ${auditorName}, as the First Statutory ${auditorWord} of the Company pursuant to Section 139(6) of the Companies Act, 2013, to hold office until the conclusion of the First Annual General Meeting of the Company.`;
  }

  if (a.appointmentType === "agm" && a.appointmentAGMNo && a.appointmentYear) {
    const tenure = a.tenureYears || 5;
    const tenureWord = TENURE_WORDS[tenure] || `${tenure}`;
    const endAGMNo = a.appointmentAGMNo + tenure;
    const apptOrd = ordinalStr(a.appointmentAGMNo);
    const endOrd = ordinalStr(endAGMNo);
    return `The Company at its ${apptOrd} Annual General Meeting held in ${a.appointmentYear}, appointed ${auditorName}, as the Statutory ${auditorWord} of the Company for a period of ${tenureWord} consecutive year${tenure > 1 ? "s" : ""}, to hold office from the conclusion of the ${apptOrd} Annual General Meeting until the conclusion of the ${endOrd} Annual General Meeting of the Company.`;
  }

  if (a.firmName) {
    return isProp
      ? `${a.partnerName}, Chartered Accountant (Membership No. ${a.membershipNo}), is the Statutory ${auditorWord} of the Company. The appointment is in compliance with the applicable provisions of Section 139 of the Companies Act, 2013.`
      : `M/s. ${a.firmName}, Chartered Accountants (Firm Registration No. ${a.frn}), are the Statutory ${auditorWord} of the Company. The appointment is in compliance with the applicable provisions of Section 139 of the Companies Act, 2013.`;
  }

  return `The Statutory Auditors of the Company hold office as per applicable provisions of the Companies Act, 2013. Their appointment has been duly made in compliance with Section 139 of the Companies Act, 2013.`;
}

export function generateBoardReportRule8A(data: AnnualFilingData): string {
  const fy       = data.financialYear;
  const fyEnd    = fyEndYear(fy);
  const fyStart  = fyStartYear(fy);
  const prevFY   = `${Number(fyStart) - 1}-${fyStart.slice(2)}`;

  const sig1 = data.signatoryDirectors.director1;
  const sig2 = data.signatoryDirectors.director2;
  const sig3 = data.signatoryDirectors.director3;
  const reportDate  = fmtDate(data.dateOfReport);
  const reportPlace = data.placeOfSigning || data.stateOfIncorporation || "";
  const totalMeetings = data.boardMeetings?.length || 0;

  const isOPC = data.companyType === "opc";

  const nomineeDirector = data.directors.find(
    d => d.designation?.toLowerCase().includes("nominee")
  );

  const totalMeetingsWord = ["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve"][totalMeetings] ?? String(totalMeetings);

  // ── Annual Report Number ───────────────────────────────────────────────
  function calcARNo(): number {
    if (!data.incorporationDate) return 1;
    const d = new Date(data.incorporationDate);
    const incFYStart = d.getMonth() + 1 >= 4 ? d.getFullYear() : d.getFullYear() - 1;
    const fyStart = parseInt(data.financialYear.split("-")[0]);
    return Math.max(1, fyStart - incFYStart + 1);
  }
  const arNo    = data.annualReportNo || calcARNo();
  const arLabel = `${ordinalStr(arNo)} Annual Report`;

  // ── Letter Head ────────────────────────────────────────────────────────
  const showLetterHead = data.useLetterHead !== false;
  const contactLine = [
    data.companyPhone ? `Tel: ${data.companyPhone}` : "",
    data.companyEmail ? `Email: ${data.companyEmail}` : "",
  ].filter(Boolean).join(" &nbsp;|&nbsp; ");

  const headerHtml = showLetterHead ? `
<div class="header-block">
  <div class="company-name">${data.companyName}</div>
  <div class="cin-line">CIN: ${data.cin}</div>
  <div class="cin-line">Registered Office: ${data.regAddress}</div>
  ${contactLine ? `<div class="cin-line">${contactLine}</div>` : ""}
  ${data.gstin ? `<div class="cin-line">GSTIN: ${data.gstin}</div>` : ""}
  <div class="doc-title">DIRECTORS' REPORT</div>
  <div class="fy-line">For the Financial Year ended 31<sup>st</sup> March, ${fyEnd}</div>
</div>` : `
<div class="header-block">
  <div class="doc-title">DIRECTORS' REPORT</div>
  <div class="fy-line">For the Financial Year ended 31<sup>st</sup> March, ${fyEnd}</div>
</div>`;

  const bodyHtml = `

<!-- ══════════════ HEADER ══════════════ -->
${headerHtml}

<!-- ══════════════ OPENING ══════════════ -->
<p>To,<br>
${isOPC ? `The Member,` : `The Members,`}<br>
<strong>${data.companyName}</strong></p>

<p>Your Directors have pleasure in presenting the <strong>${arLabel}</strong> of the Company together with the Audited Financial Statements for the Financial Year ended 31<sup>st</sup> March, ${fyEnd}.</p>
${isOPC ? `<p>The Company is a One Person Company (OPC) within the meaning of Section 2(62) of the Companies Act, 2013. The Nominee of the sole Member is <strong>${nomineeDirector?.name || "________________"}</strong>.</p>` : ""}

<!-- ══════════════ 1. FINANCIAL SUMMARY ══════════════ -->
<h2>1. Financial Summary / Highlights</h2>
<p>The financial performance of the Company for the Financial Year ended 31<sup>st</sup> March, ${fyEnd} is summarized below:</p>
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
  <tr><td><strong>Profit / (Loss) Before Tax</strong></td><td class="right"><strong>${fmtRs(data.financials.profitBeforeTax)}</strong></td><td class="right"><strong>${fmtRs(data.financials.prevProfitBeforeTax)}</strong></td></tr>
  <tr><td>Current Tax</td><td class="right">${fmtRs(data.financials.currentTax)}</td><td class="right">${fmtRs(data.financials.prevCurrentTax)}</td></tr>
  <tr><td>Deferred Tax</td><td class="right">${fmtRs(data.financials.deferredTax)}</td><td class="right">${fmtRs(data.financials.prevDeferredTax)}</td></tr>
  <tr><td><strong>Profit / (Loss) After Tax (PAT)</strong></td><td class="right"><strong>${fmtRs(data.financials.profitAfterTax)}</strong></td><td class="right"><strong>${fmtRs(data.financials.prevProfitAfterTax)}</strong></td></tr>
  <tr><td>Total Reserves &amp; Surplus</td><td class="right">${fmtRs(data.financials.reservesAndSurplus)}</td><td class="right">${fmtRs(data.financials.prevReservesAndSurplus)}</td></tr>
  <tr><td>Earnings Per Share (Basic &amp; Diluted) (₹)</td><td class="right">${data.financials.profitAfterTax && data.totalShares ? (parseFloat(data.financials.profitAfterTax.replace(/,/g, "")) / data.totalShares).toFixed(2) : "—"}</td><td class="right">${data.financials.prevProfitAfterTax && data.totalShares ? (parseFloat(data.financials.prevProfitAfterTax.replace(/,/g, "")) / data.totalShares).toFixed(2) : "—"}</td></tr>
</table>

<!-- ══════════════ 2. DIVIDEND [Sec. 134(3)(k)] ══════════════ -->
<h2>2. Dividend</h2>
${data.dividendDeclared
  ? `<p>Your Directors are pleased to report that the Company has declared and/or paid dividend of ${data.dividendDetails || "[details]"} on the Equity Shares of the Company for the Financial Year ended 31<sup>st</sup> March, ${fyEnd}. The dividend was paid in compliance with the provisions of Section 123 of the Companies Act, 2013. There is no unpaid / unclaimed dividend pending for transfer to the Investor Education and Protection Fund (IEPF).</p>`
  : `<p>Your Directors do not recommend any dividend on the Equity Shares of the Company for the Financial Year ended 31<sup>st</sup> March, ${fyEnd} in order to conserve resources for the future operations of the Company. No dividend was paid during the Financial Year ${fy}. There is no unpaid / unclaimed dividend pending for transfer to the Investor Education and Protection Fund (IEPF).</p>`
}

<!-- ══════════════ 3. TRANSFER TO RESERVES ══════════════ -->
<h2>3. Transfer to Reserves</h2>
<p>The Board of Directors has not proposed any transfer to reserves for the Financial Year ${fy}. The entire profit / (loss) has been retained in the Profit and Loss Account of the Company.</p>

<!-- ══════════════ 4. STATE OF AFFAIRS ══════════════ -->
<h2>4. State of Affairs / Business Operations</h2>
<p>${data.stateOfAffairs || `During the Financial Year ${fy}, the Company continued its principal business activities. The overall performance of the Company was satisfactory during the year under review.`}</p>

<!-- ══════════════ 5. ANNUAL RETURN [Rule 8A(a), Sec. 92(3)] ══════════════ -->
<h2>5. Annual Return</h2>
<p>Pursuant to Section 92(3) of the Companies Act, 2013 read with Rule 12(1) of the Companies (Management and Administration) Rules, 2014, the Annual Return of the Company in Form MGT-7A for the Financial Year ended 31<sup>st</sup> March, ${fyEnd} ${
  data.annualReturnWebLink
    ? `is available on the website of the Company at: <strong>${data.annualReturnWebLink}</strong>`
    : `shall be filed with the Registrar of Companies. A copy of the Annual Return shall be made available at the Registered Office of the Company for inspection during business hours. The extract of Annual Return in Form MGT-9 is no longer required pursuant to the Companies (Amendment) Act, 2017.`
}</p>

<!-- ══════════════ 6. BOARD MEETINGS [Rule 8A(b)] ══════════════ -->
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
${(() => {
  if (isOPC) {
    return `<p>The Company being a One Person Company is exempt from holding Annual General Meeting pursuant to Section 96 of the Companies Act, 2013. As per the provisions applicable to One Person Companies, resolutions are passed by the sole member / sole director by means of circular resolutions or in writing, as applicable.</p>`;
  }
  const agm = data.memberMeetings?.find(m => m.type === "agm");
  const agmDate = agm?.date ? fmtDate(agm.date) : "________________";
  const agmVenue = agm?.venue ? `, held at ${agm.venue}` : "";
  return `<p>The Annual General Meeting (AGM) of the Company for the Financial Year ${prevFY} was held on <strong>${agmDate}</strong>${agmVenue}. The next AGM for the Financial Year ${fy} will be held within the stipulated time as prescribed under Section 96 of the Companies Act, 2013.</p>`;
})()}

<!-- ══════════════ 8. SHARE CAPITAL [Rule 8A(c)] ══════════════ -->
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
<p>Pursuant to the requirement under Section 134(3)(c) read with Section 134(5) of the Companies Act, 2013, your Directors confirm and state that:</p>
<ol type="i">
  <li>In the preparation of the annual accounts for the Financial Year ended 31<sup>st</sup> March, ${fyEnd}, the applicable accounting standards have been followed along with proper explanation relating to material departures, if any;</li>
  <li>The Directors have selected such accounting policies and applied them consistently and made judgements and estimates that are reasonable and prudent so as to give a true and fair view of the state of affairs of the Company as at 31<sup>st</sup> March, ${fyEnd} and of the profit / (loss) of the Company for the year ended on that date;</li>
  <li>The Directors have taken proper and sufficient care for the maintenance of adequate accounting records in accordance with the provisions of the Companies Act, 2013 for safeguarding the assets of the Company and for preventing and detecting fraud and other irregularities;</li>
  <li>The Directors have prepared the annual accounts on a going concern basis; and</li>
  <li>The Directors have devised proper systems to ensure compliance with the provisions of all applicable laws and that such systems were adequate and operating effectively.</li>
</ol>

<!-- ══════════════ 10. INDEPENDENT DIRECTORS [Sec. 149(7)] ══════════════ -->
<h2>10. Declaration by Independent Directors</h2>
<p>${isOPC
  ? `The Company being a One Person Company is not required to appoint Independent Director(s) on its Board as per the provisions of the Companies Act, 2013. Accordingly, no declaration under Section 149(7) of the Companies Act, 2013 is required.`
  : `As at 31<sup>st</sup> March, ${fyEnd}, the Company does not have any Independent Director on its Board. Accordingly, the provisions of Section 149(6) and Section 149(7) of the Companies Act, 2013 are not applicable to the Company.`
}</p>

<!-- ══════════════ 11. BOARD PERFORMANCE EVALUATION [Sec. 134(3)(p)] ══════════════ -->
<h2>11. Board Performance Evaluation</h2>
<p>${isOPC
  ? `The Company being a One Person Company with a sole director is exempt from the provisions relating to performance evaluation as prescribed under Section 134(3)(p) of the Companies Act, 2013.`
  : `The Board of Directors has carried out an annual evaluation of its own performance as well as that of individual Directors as mandated by Section 134(3)(p) of the Companies Act, 2013. The evaluation framework focused on areas such as Board composition, meeting process, strategic engagement, effectiveness of decision-making, adherence to governance standards, and contribution of each Director. The performance evaluation of the Company does not require formal evaluation by an NRC / Independent Directors as the Company is below the prescribed thresholds.`
}</p>

<!-- ══════════════ 12. AUDIT COMMITTEE [Sec. 177] ══════════════ -->
<h2>12. Audit Committee</h2>
<p>The provisions of Section 177 of the Companies Act, 2013 relating to constitution of Audit Committee are applicable to public companies with paid-up share capital of ₹10 Crores or more, or turnover of ₹100 Crores or more, or outstanding loans/borrowings/debentures/deposits ≥ ₹50 Crores. The Company does not meet these thresholds. Accordingly, the constitution of an Audit Committee is not mandatory for the Company at present.</p>

<!-- ══════════════ 13. NOMINATION & REMUNERATION COMMITTEE [Sec. 178] ══════════════ -->
<h2>13. Nomination &amp; Remuneration Committee (NRC)</h2>
<p>The provisions of Section 178 of the Companies Act, 2013 relating to constitution of a Nomination and Remuneration Committee are not applicable to the Company as it does not meet the prescribed thresholds (paid-up capital ≥ ₹10 Crore or turnover ≥ ₹100 Crore). Accordingly, the Company is not required to formulate a Nomination and Remuneration Policy under Section 178(3) of the Companies Act, 2013.</p>

<!-- ══════════════ 14. CSR COMMITTEE [Sec. 135] ══════════════ -->
<h2>14. Corporate Social Responsibility (CSR) Committee</h2>
<p>The provisions of Section 135 of the Companies Act, 2013 relating to Corporate Social Responsibility are not applicable to the Company for the Financial Year ${fy} as the Company's net worth, turnover and net profit are below the prescribed thresholds under Section 135(1) of the Companies Act, 2013. Accordingly, the Company has not constituted a CSR Committee and no CSR expenditure was required to be made.</p>

<!-- ══════════════ 15. STAKEHOLDERS RELATIONSHIP COMMITTEE ══════════════ -->
<h2>15. Stakeholders Relationship Committee</h2>
<p>The constitution of a Stakeholders Relationship Committee is required only where the number of shareholders, debenture holders or other security holders exceeds one thousand. As the Company's total number of members is well below the said threshold, the Stakeholders Relationship Committee has not been constituted.</p>

<!-- ══════════════ 16. RISK MANAGEMENT COMMITTEE ══════════════ -->
<h2>16. Risk Management Committee</h2>
<p>The provisions relating to constitution of a Risk Management Committee under the Companies Act, 2013 and SEBI (LODR) Regulations, 2015 are not applicable to the Company as it is an unlisted private company. Accordingly, no Risk Management Committee has been constituted.</p>

<!-- ══════════════ 17. VIGIL MECHANISM / WHISTLE-BLOWER [Sec. 177(9)/(10)] ══════════════ -->
<h2>17. Vigil Mechanism / Whistle-blower Policy</h2>
<p>The provisions of Section 177(9) and 177(10) of the Companies Act, 2013 regarding Vigil Mechanism are mandatory for listed companies, companies accepting deposits from the public, and companies with outstanding borrowings from banks/public financial institutions exceeding ₹50 Crores. The Company does not fall under any of the above categories. Accordingly, the Company is not required to establish a formal Vigil Mechanism / Whistle-blower Policy. However, the Board of Directors ensures that a culture of transparency and integrity is maintained within the organisation and any genuine concerns of the employees can be communicated directly to the Directors.</p>

<!-- ══════════════ 18. RISK MANAGEMENT ══════════════ -->
<h2>18. Risk Management</h2>
<p>${data.riskManagementDetails || `The Company has a risk management framework to identify, assess and mitigate risks. The Board periodically reviews the risk landscape and takes appropriate steps to minimize risks. The major risks identified by the Company include business risk, operational risk, financial risk and legal/regulatory risk. Adequate systems and processes are in place to manage these risks effectively.`}</p>

<!-- ══════════════ 19. CONSERVATION OF ENERGY [Rule 8(3)(A)] ══════════════ -->
<h2>19. Conservation of Energy</h2>
<p>${data.energyConservationDetails || `The operations of the Company are not energy-intensive. The Company has taken adequate measures for conservation of energy wherever possible, including use of energy-efficient equipment and optimisation of energy usage.`}</p>
<p><em>(i) Steps taken or impact on conservation of energy: The Company continues to implement energy conservation practices.</em><br>
<em>(ii) Steps taken for utilising alternate sources of energy: Not applicable.</em><br>
<em>(iii) Capital investment on energy conservation equipment: Nil.</em></p>

<!-- ══════════════ 20. TECHNOLOGY ABSORPTION [Rule 8(3)(B)] ══════════════ -->
<h2>20. Technology Absorption</h2>
<p>${data.technologyAbsorptionDetails || `The Company has not imported any technology during the Financial Year ${fy}. The Company has not incurred any expenditure on Research and Development. No technology absorption or adaptation was carried out during the year.`}</p>

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

<!-- ══════════════ 22. RELATED PARTY TRANSACTIONS [Rule 8A(g), Sec. 188] ══════════════ -->
<h2>22. Related Party Transactions</h2>
${data.hasRPT
  ? `<p>All contracts or arrangements or transactions entered into by the Company during the Financial Year ${fy} with related parties referred to in Section 188(1) of the Companies Act, 2013 were in the ordinary course of business and on arm's length basis, except as mentioned in <strong>Form AOC-2</strong> annexed hereto as <strong>Annexure I</strong>.</p>`
  : `<p>All contracts or arrangements or transactions entered into by the Company during the Financial Year ${fy} with related parties referred to in Section 188(1) of the Companies Act, 2013 were in the ordinary course of business and at arm's length basis. The Company does not have any contracts, arrangements or transactions with related parties which are not at arm's length. Accordingly, disclosure in <strong>Form AOC-2</strong> is not required. Details of related party transactions as per AS-18 are disclosed in the Notes to the Financial Statements.</p>`
}

<!-- ══════════════ 23. LOANS, GUARANTEES & INVESTMENTS [Sec. 186] ══════════════ -->
<h2>23. Loans, Guarantees and Investments</h2>
${data.hasLoansGiven
  ? `<p>The particulars of loans given, investments made, guarantees given and securities provided under Section 186 of the Companies Act, 2013 are provided in the Notes to the Financial Statements.</p>`
  : `<p>During the Financial Year ${fy}, the Company has not given any loans, provided any guarantees or made any investments falling under the provisions of Section 186 of the Companies Act, 2013.</p>`
}

<!-- ══════════════ 24. SUBSIDIARIES [Sec. 129(3)] ══════════════ -->
<h2>24. Subsidiaries, Associates and Joint Ventures</h2>
${data.hasSubsidiaries
  ? `<p>A statement containing salient features of the financial statements of subsidiary/associate companies in Form AOC-1 is annexed hereto as <strong>Annexure II</strong> pursuant to Section 129(3) of the Companies Act, 2013.</p>`
  : `<p>The Company does not have any subsidiary, associate company or joint venture as on 31<sup>st</sup> March, ${fyEnd}. Accordingly, Form AOC-1 is not required to be annexed.</p>`
}

<!-- ══════════════ 25. CSR [Sec. 135] ══════════════ -->
<h2>25. Corporate Social Responsibility</h2>
${data.csrApplicable && data.csrDetails
  ? `<p>The Company is required to undertake CSR activities as per the provisions of Section 135 of the Companies Act, 2013. A CSR Committee has been constituted. Details of CSR activities and expenditure during the Financial Year ${fy} are as follows:</p><p>${data.csrDetails}</p>`
  : `<p>The provisions of Section 135 of the Companies Act, 2013 regarding Corporate Social Responsibility are not applicable to the Company for the Financial Year ${fy} as the Company's net worth, turnover and net profit are below the prescribed thresholds under Section 135(1) of the Companies Act, 2013. Hence, no CSR activity is required to be undertaken and no disclosure is required under the Companies (Corporate Social Responsibility Policy) Rules, 2014.</p>`
}

<!-- ══════════════ 26. DEPOSITS [Sec. 73-76] ══════════════ -->
<h2>26. Deposits</h2>
${data.hasDeposits
  ? `<p>The Company has accepted deposits during the Financial Year ${fy}. Details in compliance with Chapter V of the Companies Act, 2013 are disclosed in the Notes to Financial Statements.</p>`
  : `<p>The Company has not accepted any deposits from the public within the meaning of Sections 73 and 74 of the Companies Act, 2013 read with the Companies (Acceptance of Deposits) Rules, 2014 during the Financial Year ${fy}. There are no outstanding deposits and no amount of principal or interest was outstanding as on 31<sup>st</sup> March, ${fyEnd}.</p>`
}

<!-- ══════════════ 27. STATUTORY AUDITOR ══════════════ -->
<h2>27. Statutory Auditor</h2>
<p>${getStatutoryAuditorPara(data)}</p>

<!-- ══════════════ 28. SECRETARIAL AUDIT [Sec. 204] ══════════════ -->
<h2>28. Secretarial Audit</h2>
<p>The provisions of Section 204 of the Companies Act, 2013 relating to Secretarial Audit are applicable to public companies with paid-up share capital of ₹50 Crores or more, or turnover of ₹250 Crores or more. The Company is a private limited company and does not meet the aforesaid thresholds. Accordingly, Secretarial Audit is not applicable to the Company.</p>

<!-- ══════════════ 29. COST AUDIT [Sec. 148] ══════════════ -->
<h2>29. Cost Audit</h2>
<p>The provisions of Section 148 of the Companies Act, 2013 relating to Cost Audit are not applicable to the Company for the Financial Year ${fy} as the Company is below the prescribed thresholds for maintenance of cost records and audit. Accordingly, no Cost Audit was conducted during the year.</p>

<!-- ══════════════ 30. AUDITOR QUALIFICATIONS [Rule 8A(e), Sec. 134(3)(f)] ══════════════ -->
<h2>30. Auditors' Report — Qualifications, Reservations and Adverse Remarks</h2>
${data.auditQualification && data.auditQualificationExplanation
  ? `<p>The Statutory Auditors have made certain qualifications / reservations / adverse remarks in their Audit Report. The Board of Directors provides the following explanation / comments thereon as required under Section 134(3)(f) of the Companies Act, 2013:</p>
     <p>${data.auditQualificationExplanation}</p>`
  : `<p>The Statutory Auditors' Report for the Financial Year ${fy} does not contain any qualification, reservation, adverse remark or disclaimer. Accordingly, no explanation or comment is required to be given by the Board of Directors under Section 134(3)(f) of the Companies Act, 2013.</p>`
}

<!-- ══════════════ 31. FRAUDS BY AUDITORS [Rule 8A(d), Sec. 143(12)] ══════════════ -->
<h2>31. Frauds Reported by Statutory Auditors</h2>
${data.fraudReported && data.fraudDetails
  ? `<p>The Statutory Auditors have reported the following instances of fraud committed against the Company by its officers or employees to the Board of Directors during the Financial Year ${fy}:</p>
     <p>${data.fraudDetails}</p>`
  : `<p>The Statutory Auditors of the Company have not reported any instance of fraud committed against the Company by its officers or employees as specified under Section 143(12) of the Companies Act, 2013 during the Financial Year ${fy}. Hence, no disclosure is required to be made under Rule 13 of the Companies (Audit and Auditors) Rules, 2014.</p>`
}

<!-- ══════════════ 32. INTERNAL FINANCIAL CONTROLS ══════════════ -->
<h2>32. Internal Financial Controls</h2>
<p>The Company has established adequate internal financial controls with reference to the financial statements. The Board of Directors has devised proper systems to ensure compliance with the provisions of all applicable laws, and such systems are adequate and operating effectively. The Statutory Auditors have not reported any significant deficiency or material weakness in internal financial controls over financial reporting.</p>

<!-- ══════════════ 33. MATERIAL CHANGES [Rule 8A(j)] ══════════════ -->
<h2>33. Material Changes and Commitments</h2>
${data.materialChangesAfterFY && data.materialChangesDetails
  ? `<p>${data.materialChangesDetails}</p>`
  : `<p>There are no material changes and commitments, affecting the financial position of the Company, which have occurred between the end of the Financial Year ${fy} and the date of this Report.</p>`
}

<!-- ══════════════ 34. DIRECTOR / KMP CHANGES [Rule 8A(k)] ══════════════ -->
<h2>34. Changes in Directors and Key Managerial Personnel</h2>
${getDirectorChanges(data)}

<!-- ══════════════ 35. SIGNIFICANT ORDERS [Rule 8A(l)] ══════════════ -->
<h2>35. Significant and Material Orders by Regulators / Courts</h2>
${data.significantOrders && data.significantOrdersDetails
  ? `<p>${data.significantOrdersDetails}</p>`
  : `<p>No significant or material orders have been passed by any Regulator, Court or Tribunal which would impact the going concern status and future operations of the Company during the Financial Year ${fy}.</p>`
}

<!-- ══════════════ 36. INSOLVENCY PROCEEDINGS [Sec. 134(3)(l)] ══════════════ -->
<h2>36. Proceedings Under Insolvency and Bankruptcy Code, 2016</h2>
<p>No application has been made and no proceeding is pending under the Insolvency and Bankruptcy Code, 2016 against the Company during the Financial Year ${fy}.</p>

<!-- ══════════════ 37. ONE-TIME SETTLEMENT [Sec. 134(3)(m)] ══════════════ -->
<h2>37. Details of Difference Between Amount of Valuation on One-Time Settlement</h2>
<p>There were no instances of one-time settlement with any Bank or Financial Institution during the Financial Year ${fy}. Hence, no disclosure is required under this clause.</p>

<!-- ══════════════ 38. PARTICULARS OF EMPLOYEES [Sec. 197(12)] ══════════════ -->
<h2>38. Particulars of Employees</h2>
<p>The information required pursuant to Section 197(12) of the Companies Act, 2013 read with Rule 5(2) and 5(3) of the Companies (Appointment and Remuneration of Managerial Personnel) Rules, 2014 in respect of employees of the Company is as under:</p>
<p>During the Financial Year ${fy}, no employee of the Company was in receipt of remuneration in excess of the limits prescribed under Rule 5(2) of the Companies (Appointment and Remuneration of Managerial Personnel) Rules, 2014. Accordingly, no statement is required to be annexed to this Report.</p>

<!-- ══════════════ 39. POSH [Sexual Harassment Act, 2013] ══════════════ -->
<h2>39. Prevention of Sexual Harassment at Workplace (POSH)</h2>
<p>The Company is committed to providing a safe and harassment-free workplace for every woman at work. The Company has put in place a policy for prevention of sexual harassment in compliance with the provisions of the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 and the Rules made thereunder.</p>
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

<!-- ══════════════ 40. MATERNITY BENEFIT ACT ══════════════ -->
<h2>40. Compliance with Maternity Benefit Act, 1961</h2>
<p>The Company is in compliance with the applicable provisions of the Maternity Benefit Act, 1961. No employee availed maternity leave or filed any related complaint during the Financial Year ${fy}.</p>

<!-- ══════════════ 41. EMPLOYEE COUNT (GENDER-WISE) ══════════════ -->
<h2>41. Particulars of Employees (Gender-wise) as on 31<sup>st</sup> March, ${fyEnd}</h2>
<table>
  <tr>
    <th style="width:50%">Category</th>
    <th class="right">Number of Employees</th>
  </tr>
  <tr><td>Female</td><td class="right">${data.employeesFemale ?? "________________"}</td></tr>
  <tr><td>Male</td><td class="right">${data.employeesMale ?? "________________"}</td></tr>
  <tr><td>Transgender / Other</td><td class="right">${data.employeesOther ?? "________________"}</td></tr>
  <tr><td><strong>Total</strong></td><td class="right"><strong>${
    (data.employeesMale != null || data.employeesFemale != null || data.employeesOther != null)
      ? ((data.employeesMale || 0) + (data.employeesFemale || 0) + (data.employeesOther || 0))
      : "________________"
  }</strong></td></tr>
</table>

<!-- ══════════════ 42. SECRETARIAL STANDARDS ══════════════ -->
<h2>42. Compliance with Secretarial Standards</h2>
<p>The Company has complied with the applicable Secretarial Standards issued by the Institute of Company Secretaries of India (ICSI), namely SS-1 (Secretarial Standard on Meetings of the Board of Directors) and SS-2 (Secretarial Standard on General Meetings), as applicable to the Company.</p>

<!-- ══════════════ 43. BUSINESS RESPONSIBILITY ══════════════ -->
<h2>43. Business Responsibility and Sustainability Report</h2>
<p>The provisions of Regulation 34(2)(f) of the SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015 regarding Business Responsibility and Sustainability Report are applicable only to the top 1000 listed companies by market capitalisation. The Company is an unlisted private company. Accordingly, this provision is not applicable to the Company.</p>

<!-- ══════════════ 44. CORPORATE GOVERNANCE ══════════════ -->
<h2>44. Corporate Governance</h2>
<p>The provisions relating to Corporate Governance Report as required under the SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015 are not applicable to the Company as it is an unlisted private company. However, the Company strives to maintain good corporate governance practices in its day-to-day operations.</p>

<!-- ══════════════ 45. ACKNOWLEDGEMENTS ══════════════ -->
<h2>45. Acknowledgements</h2>
<p>Your Directors place on record their sincere appreciation for the assistance, co-operation and support extended by the bankers, government authorities, regulatory agencies, customers, suppliers and other business associates during the Financial Year ${fy}. Your Directors also express their deep appreciation for the dedicated efforts and contribution of the employees at all levels.</p>
<p>The Board also thanks the ${isOPC ? "Member" : "Members"} of the Company for reposing confidence and trust in the management of the Company.</p>

<!-- ══════════════ DIRECTOR TABLE ══════════════ -->
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

  return wrapPage(
    `Directors' Report — ${data.companyName} — FY ${fy}`,
    bodyHtml
  );
}
