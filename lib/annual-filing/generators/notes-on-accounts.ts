/**
 * Notes to Financial Statements
 * Format: Section A (Corporate Information) + Section B (Significant Accounting Policies a–u)
 * Applicable: Companies Act 2013 | Indian GAAP | AS framework
 * Company-type variants: Private Limited, Section 8, OPC, Producer Company (FPC)
 */

import type { AnnualFilingData } from "../types";
import { fmtDate, fyEndYear, fyStartYear, wrapPage } from "../utils";

export function generateNotesOnAccounts(data: AnnualFilingData): string {
  const fy      = data.financialYear;
  const fyEnd   = fyEndYear(fy);
  const fyStart = fyStartYear(fy);
  const prevFY  = `${Number(fyStart) - 1}-${fyStart.slice(2)}`;

  const isSection8 = data.companyType === "section8";
  const isOPC      = data.companyType === "opc";
  const isFPC      = data.companyType === "fpc";

  // P&L / I&E label
  const pandlLabel = isSection8
    ? "Income and Expenditure Account"
    : "Statement of Profit and Loss";

  // ── Section A: Corporate Information ─────────────────────────────────────────

  let corporateInfo: string;
  if (isFPC) {
    corporateInfo = `${data.companyName} is a Producer Company incorporated in India under the provisions of Part IXA of the Companies Act, 1956 read with the Companies Act, 2013. The CIN of the Company is ${data.cin || "____"}. The Company is registered under ${data.rocName || "Registrar of Companies"}. The registered office of the Company is situated at ${data.regAddress || "____"}. The principal business of the Company is ${data.businessDescription || "procurement, processing, marketing and other activities for the benefit of its producer members"}.`;
  } else if (isSection8) {
    corporateInfo = `${data.companyName} is a Company incorporated under Section 8 of the Companies Act, 2013 for the promotion of charitable objects including ${data.businessDescription || "promotion of commerce, arts, science, education, research, social welfare, religion, charity, protection of environment or any such other object"}. The CIN of the Company is ${data.cin || "____"}. The Company is registered under ${data.rocName || "Registrar of Companies"}. The registered office of the Company is situated at ${data.regAddress || "____"}.`;
  } else if (isOPC) {
    corporateInfo = `${data.companyName} is a One Person Company (OPC) incorporated in India under Section 3(1)(c) of the Companies Act, 2013 having a single member. The CIN of the Company is ${data.cin || "____"}. The Company is registered under ${data.rocName || "Registrar of Companies"}. The registered office of the Company is situated at ${data.regAddress || "____"}.`;
  } else {
    corporateInfo = `${data.companyName} is a Private Limited Company incorporated in India under the Companies Act, 2013. The CIN of the Company is ${data.cin || "____"}. The Company is registered under ${data.rocName || "Registrar of Companies"}. The registered office of the Company is situated at ${data.regAddress || "____"}.`;
  }

  // ── OPC Nominee Note ──────────────────────────────────────────────────────────

  const nomineeDirector = data.directors.find(
    d => d.designation?.toLowerCase().includes("nominee")
  );
  const opcNomineeNote = isOPC
    ? `<p>The Company has nominated <strong>${nomineeDirector?.name || "________________"}</strong> as the Nominee of the sole member in the event of death or incapacity of the sole member, as required under Section 3(1)(c) of the Companies Act, 2013.</p>`
    : "";

  // ── Section B.j: Earnings Per Share ─────────────────────────────────────────

  const epsText = isSection8
    ? `<p>The Company is incorporated as a Section 8 (Not-for-Profit) Company. Earnings per Share (AS 20) is not applicable as the Company does not distribute profits to its members.</p>`
    : `<p>Basic earnings per share are calculated by dividing the net profit for the year attributable to equity shareholders (after deducting preference dividends and attributable taxes) by the weighted average number of equity shares outstanding during the year.</p>
<p>For the purpose of calculating diluted earnings per share, the net profit or loss for the period attributable to equity shareholders and the weighted average number of shares outstanding during the period are adjusted for the effects of all dilutive potential equity shares.</p>`;

  // ── Section B.f: Revenue Recognition ────────────────────────────────────────

  const revenueText = isFPC
    ? `Revenue is recognized on accrual basis. Revenue from operations includes income from procurement, processing, storage and marketing of produce on behalf of producer members. Revenue from Services including applicable taxes is excluded while recording Revenue from Operations. Patronage bonus to members, if declared, is recognised as an expenditure.`
    : `Revenue is recognized on accrual basis. Income from Services is recognized as per the terms of the contract upon rendering of Services. Revenue from Services including service tax/GST is excluded while recording Revenue from Operations.`;

  // ── Section B.p: Director Remuneration ──────────────────────────────────────

  const dirRemunerationText = isOPC
    ? `Details of Directors Remuneration: As per the terms of appointment, the sole director was paid a remuneration of Rs. __________ during the Financial Year ${fy}. (Previous Year: Rs. __________)`
    : `Details of Directors Remuneration: NIL`;

  // ── Section B.u: Other ───────────────────────────────────────────────────────

  let otherNote: string;
  if (isSection8) {
    otherNote = `<p>The Company is a Section 8 Company incorporated for the promotion of charitable/non-profit objects. The Company is prohibited under Section 8 of the Companies Act, 2013 from paying dividends to its members. Any income or property of the Company shall be applied solely towards the promotion of the objects of the Company as set out in its Memorandum of Association.</p>`;
  } else if (isFPC) {
    otherNote = `<p>The Company is a Producer Company formed and registered under the provisions of Part IXA of the Companies Act, 1956 read with the Companies Act, 2013. The objects of the Company include production, harvesting, procurement, grading, pooling, handling, marketing, selling and export of primary produce of members and import of goods or services for their benefit. The Company complies with Sections 581A to 581ZT of the Companies Act, 1956 as saved and continued under the Companies Act, 2013.</p>
<p>Disclosure pursuant to Notification No. S.O. 1702(E) dated 16th June, 2016 issued by the Ministry of Corporate Affairs: The amount due to Micro, Small and Medium Enterprises as on date is Rs. NIL.</p>`;
  } else {
    otherNote = `<p>Disclosure pursuant to Notification No. S.O. 1702(E) dated 16th June, 2016 issued by the Ministry of Corporate Affairs: The Company has obtained Udyam Registration under the Micro, Small and Medium Enterprises Development Act, 2006. The amount due to Micro, Small and Medium Enterprises as on date is Rs. NIL.</p>`;
  }

  // ── Surplus / Reserves note (FPC / Section 8 specific) ──────────────────────

  const surplusNote = isSection8
    ? `<p class="mt-8"><em>Note: The Company being a Section 8 Company is prohibited from distributing surplus as dividend. Any surplus from the ${pandlLabel} is retained and applied towards the furtherance of the Company's charitable objects.</em></p>`
    : isFPC
    ? `<p class="mt-8"><em>Note: As a Producer Company, after making provisions for limited return and reserves as required under Part IXA of the Companies Act, 1956, the Board may distribute the remaining surplus as Patronage Bonus amongst members in proportion to their participation in the business of the Company.</em></p>`
    : "";

  // ── Auditor & Signatory details ───────────────────────────────────────────────

  const auditorFirmName = data.auditor.firmName
    ? `M/s ${data.auditor.firmName}`
    : "[Firm Name]";
  const auditorFRN   = data.auditor.frn          || "[_______]";
  const partnerName  = data.auditor.partnerName   || "[Partner Name]";
  const memberNo     = data.auditor.membershipNo  || "[_______]";
  const udin         = data.auditor.udin          || "[____________________]";
  const reportDate   = data.dateOfReport ? fmtDate(data.dateOfReport) : "________________";
  const signingPlace = data.placeOfSigning || "________________";

  const dir1 = data.signatoryDirectors.director1;
  const dir2 = data.signatoryDirectors.director2;

  // ── HTML Body ─────────────────────────────────────────────────────────────────

  const bodyHtml = `

<!-- ══════════════ HEADER ══════════════ -->
<div class="header-block">
  <div class="company-name">${data.companyName}</div>
  <div class="cin-line">CIN: ${data.cin || "____"}</div>
  ${data.regAddress ? `<div class="cin-line">${data.regAddress}</div>` : ""}
  <div class="doc-title">NOTES TO FINANCIAL STATEMENTS</div>
  <div class="fy-line">For the year ended 31<sup>st</sup> March, ${fyEnd}</div>
</div>

<!-- ══════════════ A. CORPORATE INFORMATION ══════════════ -->
<h2>A. Corporate Information</h2>
<p>${corporateInfo}</p>
${data.incorporationDate ? `<p>The Company was incorporated on <strong>${fmtDate(data.incorporationDate)}</strong>.</p>` : ""}
${opcNomineeNote}

<!-- ══════════════ B. SIGNIFICANT ACCOUNTING POLICIES ══════════════ -->
<h2>B. Significant Accounting Policies</h2>

<h3>a. Basis of Accounting</h3>
<p>These financial statements are prepared in accordance with Indian Generally Accepted Accounting Principles (GAAP) under the historical cost convention on an accrual basis. GAAP comprises mandatory accounting standards as prescribed under Section 133 of the Companies Act, 2013 read with Companies (Accounting Standards) Rules, 2021, and guidelines issued by the Institute of Chartered Accountants of India (ICAI). The accounts are prepared based on the concept of a going concern.</p>
<p><strong>System of Accounting:</strong> The Company follows the Accrual System of Accounting and these accounts are prepared in accordance with the Indian Accounting Standards notified under the provisions of Section 133 of the Companies Act, 2013 as amended from time to time. The Company has adopted a 12-month operating cycle for classifying assets and liabilities into current and non-current.</p>

<h3>b. Use of Estimates</h3>
<p>In preparing the Company's financial statements in conformity with accounting principles generally accepted in India, management is required to make estimates and assumptions that affect the reported amounts of assets and liabilities and the disclosure of contingent liabilities as of the date of the financial statements, and reported amounts of revenues and expenses during the reporting period. Actual results could differ from those estimates. Any revisions to accounting estimates are recognised prospectively in current and future periods.</p>

<h3>c. Property, Plant &amp; Equipment (Including Intangibles)</h3>
<p>Fixed assets are stated at cost of acquisition net of recoverable taxes less depreciation. All costs attributable to acquisition including incidental expenditure incurred during installation and erection forming part of the asset has been capitalised as part of the asset.</p>

<h3>d. Depreciation and Amortization</h3>
<p>Depreciation on fixed assets is provided on Written Down Value Method (WDV Method) for the following assets for the period from the date they are available for use:</p>
<table style="width:65%;">
  <tr>
    <th style="width:70%">Asset</th>
    <th class="center">Useful Life</th>
  </tr>
  <tr><td>Plant &amp; Machinery</td><td class="center">10 Years</td></tr>
  <tr><td>Computer and Peripherals</td><td class="center">3 Years</td></tr>
  <tr><td>Furniture &amp; Fixtures</td><td class="center">15 Years</td></tr>
  <tr><td>Office Equipment</td><td class="center">10 Years</td></tr>
  <tr><td>Intangible Assets</td><td class="center">3 Years</td></tr>
</table>

<h3>e. Inventories</h3>
<p>The inventories are valued at cost or net realisable value, whichever is lower. Cost is determined by First In First Out (FIFO) Method.</p>

<h3>f. Revenue Recognition</h3>
<p>${revenueText}</p>

<h3>g. Employee Benefits</h3>
<p>Expenditure on Employee Benefits is charged to the ${pandlLabel} as per the requirement of Accounting Standard 15 (Revised) on Employee Benefits issued by the Institute of Chartered Accountants of India (ICAI):</p>
<p><strong>a. Defined Contribution Plans:</strong> The Company's contribution to Defined Contribution plans in the form of Provident Fund is charged to the ${pandlLabel} of the year when the contributions to the respective funds are due. As per the approved scheme with the prescribed authority, there is no obligation other than contribution payable to the fund.</p>
<p><strong>b. Defined Benefit Plans:</strong> The Company has a defined benefit plan in the form of Employee Gratuity Plan and Leave Encashment. Provision for Gratuity and Leave Encashment is made based on the Projected Unit Credit (PUC) Method through an actuarial valuation carried out at the balance sheet date. In accordance with the applicable Indian laws, the Company provides for gratuity, a defined benefit retirement plan (the Gratuity Plan) for all employees.</p>
<p><strong>c. Short-term employee benefits:</strong> All employee benefits payable within twelve months of rendering the service are classified as short-term employee benefits. Benefits such as salaries, wages, expected cost of bonus and ex-gratia are recognised during the period in which the employee renders the related service.</p>
<p><strong>d. Long-term employee benefits:</strong> Compensated absences which are not expected to occur within twelve months after the end of the period in which the employee renders the related service are recognised as a liability at the present value of the defined benefit obligation as at the balance sheet date.</p>

<h3>h. Taxation</h3>
<p>Income tax expense for the year comprises current tax and deferred tax.</p>
<p>Current tax liability has been computed in accordance with the provisions of the Income Tax Act, 1961 for the accounting period ended on 31<sup>st</sup> March, ${fyEnd}.</p>
<p>Deferred tax is recognized on timing differences, being the difference between taxable income and accounting income that originate in one period and are capable of reversal in one or more subsequent periods. Deferred tax assets and liabilities are measured at tax rates prescribed under the Income Tax Act, 1961 that have been enacted or substantively enacted by the Balance Sheet date. Deferred tax assets are recognized only to the extent there is virtual certainty of realization. Deferred tax is recognized as per AS-22.</p>

<h3>i. Provisions and Contingencies</h3>
<p>A provision is recognised when the company has a present obligation as a result of a past event and it is probable that an outflow of resources will be required to settle the obligation, in respect of which a reliable estimate can be made. Provisions are not discounted to present value and are determined based on best estimate required to settle the obligation at the balance sheet date. These are reviewed at each balance sheet date and adjusted to reflect the current best estimates.</p>
<p>Contingent liability is disclosed for possible obligations which will be confirmed only by future events not wholly within the control of the company, or present obligations where it is not probable that an outflow of resources will be required or the amount cannot be estimated reliably. Contingent assets are not recognised in the financial statements since this may result in recognition of income that may never be achieved.</p>

<h3>j. Earnings Per Share</h3>
${epsText}

<h3>k. Impairment of Asset</h3>
<p>An asset is treated as impaired when the carrying cost of the asset exceeds its recoverable value. An impairment loss is charged to the ${pandlLabel} in the year in which an asset is identified as impaired. The impairment loss recognised in prior accounting periods is reversed if there has been a change in the estimate of recoverable amount.</p>

<h3>l. Leases</h3>
<p>Leases, where the lessor effectively retains substantially all the risks and benefits of ownership of the leased item, are classified as operating leases. Operating lease payments are recognised as an expense in the ${pandlLabel} on a straight-line basis over the lease term.</p>

<h3>m. Operating Cycle</h3>
<p>Based on the nature of products/activities of the company and the normal time between acquisition of assets and their realisation in cash or cash equivalents, the company has determined its operating cycle as 12 months for the purpose of classification of its assets and liabilities as current and non-current.</p>

<h3>n. General</h3>
<p>Accounting policies not specifically referred to are consistent with generally accepted accounting principles.</p>

<h3>o. Cash and Cash Equivalents</h3>
<p>Cash and cash equivalents comprise cash at bank and in hand and short-term investments with an original maturity of three months or less.</p>

<h3>p. Directors Remuneration</h3>
<p>${dirRemunerationText}</p>

<h3>q. Capital and Other Commitments</h3>
<p>Capital and other commitments: Rs. Nil</p>

<h3>r. Details of Payment to Auditors</h3>
<table style="width:70%;">
  <tr>
    <th>Particulars</th>
    <th class="right">Current Year<br/>(FY ${fy}) (₹)</th>
    <th class="right">Previous Year<br/>(FY ${prevFY}) (₹)</th>
  </tr>
  <tr>
    <td>Statutory Audit Fees</td>
    <td class="right"></td>
    <td class="right"></td>
  </tr>
  <tr>
    <td>Tax Audit Fees</td>
    <td class="right"></td>
    <td class="right"></td>
  </tr>
</table>

<h3>s. Depreciation</h3>
<p>Depreciation has been provided for in the accounts on Written Down Value (WDV) Method in accordance with and on the basis of useful life of the assets as prescribed under Schedule II of the Companies Act, 2013. Assets costing less than Rs. 5,000/- are fully depreciated in the year of acquisition.</p>

<h3>t. Functional and Presentation Currency</h3>
<p>The functional and presentation currency of the Company is Indian Rupees (₹). Amounts in the financial statements are rounded off to the nearest rupee.</p>

<h3>u. Other</h3>
${otherNote}
${surplusNote}

<!-- ══════════════ SIGNATURE BLOCK ══════════════ -->
<div class="sig-block no-break">
  <div class="sig-row">
    <div class="sig-col">
      <p>As per our report of even date attached<br>
      For <strong>${auditorFirmName}</strong><br>
      Chartered Accountants<br>
      Firm No.: ${auditorFRN}</p>
      <div class="sig-line">
        <strong>${partnerName}</strong><br>
        Partner<br>
        M.No.: ${memberNo}<br>
        UDIN: ${udin}
      </div>
    </div>
    <div class="sig-col">
      <p>For and on behalf of the Board<br>
      <strong>FOR:- ${data.companyName}</strong></p>
      <div class="sig-line">
        <strong>${dir1.name || "________________"}</strong><br>
        ${dir1.designation || "Director"}<br>
        DIN: ${dir1.din || "________________"}
      </div>
      ${dir2 ? `<div class="sig-line" style="margin-top:20pt;">
        <strong>${dir2.name || "________________"}</strong><br>
        ${dir2.designation || "Director"}<br>
        DIN: ${dir2.din || "________________"}
      </div>` : ""}
    </div>
  </div>
  <p class="mt-16">
    Date: ${reportDate}&nbsp;&nbsp;&nbsp;&nbsp;Place: ${signingPlace}
  </p>
</div>

`;

  return wrapPage(
    `Notes to Financial Statements — ${data.companyName} — FY ${fy}`,
    bodyHtml
  );
}
