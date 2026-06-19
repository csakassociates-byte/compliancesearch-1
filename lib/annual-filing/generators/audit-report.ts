/**
 * Independent Auditor's Report Generator
 * Standards: SA 700 (Forming an Opinion), SA 705 (Modifications), SA 706 (EOM)
 *
 * CARO 2020 applicability for our 4 company types:
 *   - OPC            → EXEMPT unconditionally
 *   - Private Small  → EXEMPT (small company)
 *   - Section 8      → EXEMPT (licensed under Sec. 8)
 *   - FPC            → EXEMPT if paid-up + reserves ≤ ₹1 cr AND borrowings ≤ ₹1 cr
 *                      (for small FPCs — treated as exempt here by default)
 *
 * ICFR Auditor Reporting [Sec. 143(3)(i)] applicability:
 *   - OPC            → EXEMPT (MCA notification G.S.R. 583(E) dated 13.06.2017)
 *   - Private Small  → EXEMPT (same notification)
 *   - Section 8      → EXEMPT (turnover < ₹50 cr threshold)
 *   - FPC            → EXEMPT (turnover < ₹50 cr threshold)
 *
 * Key Audit Matters (SA 701):
 *   → NOT APPLICABLE for all 4 types (unlisted companies)
 *
 * Opinion types:
 *   - "unmodified" → Clean / Unqualified opinion (SA 700)
 *   - "qualified"  → Qualified opinion (SA 705)
 *   - "adverse"    → Adverse opinion (SA 705)
 *   - "disclaimer" → Disclaimer of opinion (SA 705)
 */

import type { AnnualFilingData } from "../types";
import { fmtDate, fyEndYear, wrapPage } from "../utils";

export type OpinionType = "unmodified" | "qualified" | "adverse" | "disclaimer";

export interface AuditReportOptions {
  opinionType: OpinionType;
  qualificationDetails?: string;    // Required if opinion is qualified/adverse/disclaimer
  emphasisOfMatter?: string;        // Optional EOM paragraph (SA 706)
  cashFlowIncluded: boolean;        // Section 8 / FPC must include; OPC / Small exempt
}

function getOpinionParagraph(
  data: AnnualFilingData,
  opts: AuditReportOptions,
  fyEnd: string
): string {
  const { opinionType } = opts;
  const fsComponents = opts.cashFlowIncluded
    ? `the Balance Sheet as at 31st March, ${fyEnd}, the Statement of Profit and Loss (including Other Comprehensive Income), the Cash Flow Statement, and the Statement of Changes in Equity`
    : `the Balance Sheet as at 31st March, ${fyEnd}, and the Statement of Profit and Loss`;

  if (opinionType === "unmodified") {
    return `
<h2>Opinion</h2>
<p>We have audited the accompanying financial statements of <strong>${data.companyName}</strong> ("the Company"), which comprise ${fsComponents} for the year then ended, and notes to the financial statements, including a summary of significant accounting policies and other explanatory information (hereinafter referred to as "the financial statements").</p>
<p>In our opinion and to the best of our information and according to the explanations given to us, the aforesaid financial statements give the information required by the Companies Act, 2013 ("the Act") in the manner so required and give a true and fair view in conformity with the accounting principles generally accepted in India, of the state of affairs of the Company as at 31<sup>st</sup> March, ${fyEnd}, and its profit/loss and ${opts.cashFlowIncluded ? "cash flows" : "other financial information"} for the year ended on that date.</p>`;
  }

  if (opinionType === "qualified") {
    return `
<h2>Basis for Qualified Opinion</h2>
<p>${opts.qualificationDetails || "[Insert basis for qualification here]"}</p>
<h2>Qualified Opinion</h2>
<p>In our opinion and to the best of our information and according to the explanations given to us, except for the effects of the matter described in the Basis for Qualified Opinion paragraph above, the aforesaid financial statements give the information required by the Companies Act, 2013 in the manner so required and give a true and fair view in conformity with the accounting principles generally accepted in India, of the state of affairs of the Company as at 31<sup>st</sup> March, ${fyEnd}, and its profit/loss ${opts.cashFlowIncluded ? "and cash flows" : ""} for the year ended on that date.</p>`;
  }

  if (opinionType === "adverse") {
    return `
<h2>Basis for Adverse Opinion</h2>
<p>${opts.qualificationDetails || "[Insert basis for adverse opinion here]"}</p>
<h2>Adverse Opinion</h2>
<p>In our opinion and to the best of our information and according to the explanations given to us, because of the significance of the matter described in the Basis for Adverse Opinion paragraph above, the aforesaid financial statements do not give the information required by the Companies Act, 2013 in the manner so required and do not give a true and fair view in conformity with the accounting principles generally accepted in India, of the state of affairs of the Company as at 31<sup>st</sup> March, ${fyEnd}, and its profit/loss ${opts.cashFlowIncluded ? "and cash flows" : ""} for the year ended on that date.</p>`;
  }

  // disclaimer
  return `
<h2>Basis for Disclaimer of Opinion</h2>
<p>${opts.qualificationDetails || "[Insert basis for disclaimer here]"}</p>
<h2>Disclaimer of Opinion</h2>
<p>Because of the significance of the matter described in the Basis for Disclaimer of Opinion paragraph above, we have not been able to obtain sufficient appropriate audit evidence to provide a basis for an audit opinion. Accordingly, we do not express an opinion on the financial statements.</p>`;
}

export function generateAuditReport(
  data: AnnualFilingData,
  opts: AuditReportOptions
): string {
  const fy    = data.financialYear;
  const fyEnd = fyEndYear(fy);
  const aud   = data.auditor;
  const reportDate = fmtDate(aud.reportDate || data.dateOfReport);

  const isOPC         = data.companyType === "opc";
  const isSmall       = data.companyType === "private_small";
  const isSection8    = data.companyType === "section8";
  const isFPC         = data.companyType === "fpc";

  // CARO exemption reason for the report
  let caroExemptionReason = "";
  if (isOPC)      caroExemptionReason = "a One Person Company, which is excluded from the applicability of the Companies (Auditor's Report) Order, 2020 as per paragraph 2 of the said Order";
  if (isSmall)    caroExemptionReason = "a small company as defined under Section 2(85) of the Companies Act, 2013, which is excluded from the applicability of the Companies (Auditor's Report) Order, 2020 as per paragraph 2 of the said Order";
  if (isSection8) caroExemptionReason = "a company licensed under Section 8 of the Companies Act, 2013, which is excluded from the applicability of the Companies (Auditor's Report) Order, 2020 as per paragraph 2 of the said Order";
  if (isFPC)      caroExemptionReason = "a producer company as defined in Section 2(70) of the Companies Act, 2013, falling within the exempted category under paragraph 2 of the Companies (Auditor's Report) Order, 2020";

  const companyTypeLabel = isOPC ? "One Person Company"
    : isSmall    ? "Private Limited Company (Small Company)"
    : isSection8 ? "Section 8 Company"
    : "Farmer Producer Company";

  const opinionSection = getOpinionParagraph(data, opts, fyEnd);

  const bodyHtml = `

<!-- ══════════════ HEADER ══════════════ -->
<div class="header-block">
  <div class="doc-title">INDEPENDENT AUDITOR'S REPORT</div>
  <div class="fy-line mt-8">To the ${isOPC ? "Member" : "Members"} of</div>
  <div class="company-name">${data.companyName}</div>
  <div class="cin-line">CIN: ${data.cin} | ${companyTypeLabel}</div>
</div>

<!-- ══════════════ REPORT ON AUDIT OF FINANCIAL STATEMENTS ══════════════ -->
<h2>Report on the Audit of the Financial Statements</h2>

<!-- Opinion / Basis for Qualified Opinion -->
${opinionSection}

<!-- Basis for Opinion (for unmodified only) -->
${opts.opinionType === "unmodified" ? `
<h2>Basis for Opinion</h2>
<p>We conducted our audit in accordance with the Standards on Auditing (SAs) specified under Section 143(10) of the Companies Act, 2013. Our responsibilities under those Standards are further described in the <em>Auditor's Responsibilities for the Audit of the Financial Statements</em> section of our report. We are independent of the Company in accordance with the Code of Ethics issued by the Institute of Chartered Accountants of India together with the ethical requirements that are relevant to our audit of the financial statements under the provisions of the Companies Act, 2013 and the Rules thereunder, and we have fulfilled our other ethical responsibilities in accordance with these requirements and the Code of Ethics. We believe that the audit evidence we have obtained is sufficient and appropriate to provide a basis for our opinion.</p>
` : ""}

<!-- Emphasis of Matter (SA 706) -->
${opts.emphasisOfMatter ? `
<h2>Emphasis of Matter</h2>
<p>${opts.emphasisOfMatter}</p>
<p>Our opinion is not modified in respect of this matter.</p>
` : ""}

<!-- Key Audit Matters -->
<h2>Key Audit Matters</h2>
<p>Key Audit Matters are those matters that, in our professional judgment, were of most significance in our audit of the financial statements of the current period. These matters were addressed in the context of our audit of the financial statements as a whole, and in forming our opinion thereon, and we do not provide a separate opinion on these matters. We have determined that there are no key audit matters to communicate in our report, as the Company is an unlisted entity and SA 701 on communicating Key Audit Matters is not applicable.</p>

<!-- Information Other Than FS -->
<h2>Information Other than the Financial Statements and Auditor's Report Thereon</h2>
<p>The Company's Board of Directors is responsible for the other information. The other information comprises the information included in the Directors' Report but does not include the financial statements and our Auditor's Report thereon.</p>
<p>Our opinion on the financial statements does not cover the other information and we do not express any form of assurance conclusion thereon.</p>
<p>In connection with our audit of the financial statements, our responsibility is to read the other information and, in doing so, consider whether the other information is materially inconsistent with the financial statements or our knowledge obtained in the audit or otherwise appears to be materially misstated. If, based on the work we have performed, we conclude that there is a material misstatement of this other information, we are required to report that fact. We have nothing to report in this regard.</p>

<!-- Management's Responsibility -->
<h2>Responsibilities of Management for the Financial Statements</h2>
<p>The Company's Board of Directors is responsible for the matters stated in Section 134(5) of the Companies Act, 2013 with respect to the preparation of these financial statements that give a true and fair view of the financial position, financial performance${opts.cashFlowIncluded ? ", changes in equity and cash flows" : ""} of the Company in accordance with the accounting principles generally accepted in India, including the Accounting Standards specified under Section 133 of the Act read with the Companies (Accounting Standards) Rules, 2021. This responsibility also includes maintenance of adequate accounting records in accordance with the provisions of the Act for safeguarding of the assets of the Company and for preventing and detecting frauds and other irregularities; selection and application of appropriate accounting policies; making judgments and estimates that are reasonable and prudent; and design, implementation and maintenance of adequate internal financial controls, that were operating effectively for ensuring accuracy and completeness of the accounting records, relevant to the preparation and presentation of the financial statements that give a true and fair view and are free from material misstatement, whether due to fraud or error.</p>
<p>In preparing the financial statements, management is responsible for assessing the Company's ability to continue as a going concern, disclosing, as applicable, matters related to going concern and using the going concern basis of accounting unless management either intends to liquidate the Company or to cease operations, or has no realistic alternative but to do so.</p>
<p>The Board of Directors is also responsible for overseeing the Company's financial reporting process.</p>

<!-- Auditor's Responsibilities -->
<h2>Auditor's Responsibilities for the Audit of the Financial Statements</h2>
<p>Our objectives are to obtain reasonable assurance about whether the financial statements as a whole are free from material misstatement, whether due to fraud or error, and to issue an auditor's report that includes our opinion. Reasonable assurance is a high level of assurance, but is not a guarantee that an audit conducted in accordance with SAs will always detect a material misstatement when it exists. Misstatements can arise from fraud or error and are considered material if, individually or in the aggregate, they could reasonably be expected to influence the economic decisions of users taken on the basis of these financial statements.</p>
<p>As part of an audit in accordance with SAs, we exercise professional judgment and maintain professional skepticism throughout the audit. We also:</p>
<ul>
  <li>Identify and assess the risks of material misstatement of the financial statements, whether due to fraud or error, design and perform audit procedures responsive to those risks, and obtain audit evidence that is sufficient and appropriate to provide a basis for our opinion. The risk of not detecting a material misstatement resulting from fraud is higher than for one resulting from error, as fraud may involve collusion, forgery, intentional omissions, misrepresentations, or the override of internal control.</li>
  <li>Obtain an understanding of internal control relevant to the audit in order to design audit procedures that are appropriate in the circumstances. Under Section 143(3)(i) of the Companies Act, 2013, we are also responsible for expressing our opinion on whether the Company has adequate internal financial controls system in place and the operating effectiveness of such controls, to the extent applicable.</li>
  <li>Evaluate the appropriateness of accounting policies used and the reasonableness of accounting estimates and related disclosures made by management.</li>
  <li>Conclude on the appropriateness of management's use of the going concern basis of accounting and, based on the audit evidence obtained, whether a material uncertainty exists related to events or conditions that may cast significant doubt on the Company's ability to continue as a going concern. If we conclude that a material uncertainty exists, we are required to draw attention in our auditor's report to the related disclosures in the financial statements or, if such disclosures are inadequate, to modify our opinion. Our conclusions are based on the audit evidence obtained up to the date of our auditor's report. However, future events or conditions may cause the Company to cease to continue as a going concern.</li>
  <li>Evaluate the overall presentation, structure and content of the financial statements, including the disclosures, and whether the financial statements represent the underlying transactions and events in a manner that achieves fair presentation.</li>
</ul>
<p>We communicate with those charged with governance regarding, among other matters, the planned scope and timing of the audit and significant audit findings, including any significant deficiencies in internal control that we identify during our audit.</p>

<!-- ══════════════ REPORT ON OTHER LEGAL AND REGULATORY REQUIREMENTS ══════════════ -->
<div class="page-break"></div>
<h2>Report on Other Legal and Regulatory Requirements</h2>
<p>1. As required by Section 197(16) of the Act, we report that the Company being a private company, the provisions relating to managerial remuneration under Section 197 of the Act are not applicable.</p>

<p>2. As required by the Companies (Auditor's Report) Order, 2020 ("the Order") issued by the Central Government of India in terms of Section 143(11) of the Act, we report that the Company is ${caroExemptionReason}. Accordingly, the said Order is not applicable to the Company.</p>

<p>3. As required by Section 143(3) of the Act, we report that:</p>
<ol type="a">
  <li>We have sought and obtained all the information and explanations which to the best of our knowledge and belief were necessary for the purposes of our audit;</li>
  <li>In our opinion, proper books of account as required by law have been kept by the Company so far as it appears from our examination of those books;</li>
  <li>The Balance Sheet, the Statement of Profit and Loss${opts.cashFlowIncluded ? ", the Cash Flow Statement" : ""} and the Statement of Changes in Equity dealt with by this Report are in agreement with the books of account;</li>
  <li>In our opinion, the aforesaid financial statements comply with the Accounting Standards specified under Section 133 of the Act, read with the Companies (Accounting Standards) Rules, 2021;</li>
  <li>On the basis of the written representations received from the Directors as on 31<sup>st</sup> March, ${fyEnd} taken on record by the Board of Directors, none of the Directors is disqualified as on 31<sup>st</sup> March, ${fyEnd} from being appointed as a Director in terms of Section 164(2) of the Act;</li>
  <li>With respect to the adequacy of the internal financial controls with reference to financial statements of the Company and the operating effectiveness of such controls, we report that: In terms of the notification issued by the Ministry of Corporate Affairs dated 13th June, 2017 (G.S.R. 583(E)), the Company, being ${
    isOPC   ? "a One Person Company" :
    isSmall ? "a Small Company" :
    isSection8 ? "a private company with turnover below ₹50 crore" :
    "a private company with turnover below ₹50 crore"
  }, is exempt from the applicability of the reporting requirement on Internal Financial Controls over Financial Reporting under Section 143(3)(i) of the Companies Act, 2013. Hence, no such report is included herein;</li>
  <li>With respect to the other matters to be included in the Auditor's Report in accordance with the requirements of Section 197(16) of the Act, as amended: As the Company is a private company, Section 197 read with Schedule V to the Act is not applicable to the Company; and</li>
  <li>With respect to the other matters to be included in the Auditor's Report in accordance with Rule 11 of the Companies (Audit and Auditors) Rules, 2014, in our opinion and to the best of our information and according to the explanations given to us:
    <ol type="i">
      <li>The Company ${opts.emphasisOfMatter ? "has" : "does not have"} any pending litigations which would impact its financial position${opts.emphasisOfMatter ? ". The same is disclosed in the Notes to the Financial Statements" : ""};</li>
      <li>The Company did not have any long-term contracts including derivative contracts for which there were any material foreseeable losses;</li>
      <li>There were no amounts which were required to be transferred to the Investor Education and Protection Fund by the Company;</li>
      <li>The management has represented that, to the best of its knowledge and belief, no funds have been advanced or loaned or invested (either from borrowed funds or share premium or any other sources or kind of funds) by the Company to or in any other persons or entities, including foreign entities ("Intermediaries"), with the understanding, whether recorded in writing or otherwise, that the Intermediary shall, whether directly or indirectly, lend or invest in other persons or entities identified in any manner whatsoever by or on behalf of the Company ("Ultimate Beneficiaries") or provide any guarantee, security or the like on behalf of the Ultimate Beneficiaries;</li>
      <li>The management has represented that, to the best of its knowledge and belief, no funds have been received by the Company from any persons or entities, including foreign entities ("Funding Parties"), with the understanding, whether recorded in writing or otherwise, that the Company shall, whether directly or indirectly, lend or invest in other persons or entities identified in any manner whatsoever by or on behalf of the Funding Party ("Ultimate Beneficiaries") or provide any guarantee, security or the like on behalf of the Ultimate Beneficiaries;</li>
      <li>Based on the audit procedures performed and as represented by the Management, the Company has not declared or paid any dividend during the year in violation of the provisions of Section 123 of the Act; and</li>
      <li>As proviso to Rule 3(1) of the Companies (Accounts) Rules, 2014 is applicable for the Company only with effect from April 1, 2023, reporting under this clause is not applicable for the Financial Year ${fy}.</li>
    </ol>
  </li>
</ol>

<!-- ══════════════ SIGNATURE ══════════════ -->
<div class="sig-block">
  <p><strong>For ${aud.firmName ? `M/s ${aud.firmName}` : "[Firm Name]"}</strong><br>
  Chartered Accountants<br>
  ${aud.frn ? `Firm Registration Number: ${aud.frn}` : "FRN: [___________]"}</p>

  <div style="margin-top: 40pt;">
    <p><strong>${aud.partnerName || "[Partner Name]"}</strong><br>
    Partner<br>
    ${aud.membershipNo ? `Membership Number: ${aud.membershipNo}` : "Membership No.: [_______]"}<br>
    ${aud.udin ? `UDIN: ${aud.udin}` : "UDIN: [____________________]"}</p>
  </div>

  <p class="mt-16">
    Place: ${aud.place || data.placeOfSigning || "________________"}<br>
    Date: ${reportDate || "________________"}
  </p>
</div>

`;

  return wrapPage(
    `Independent Auditor's Report — ${data.companyName} — FY ${fy}`,
    bodyHtml
  );
}
