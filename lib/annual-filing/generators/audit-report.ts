/**
 * Independent Auditor's Report Generator
 * Format: firm's standard template (AR_FORMAT.pdf)
 * SA 700 (Unmodified), SA 705 (Modified), SA 706 (EOM)
 *
 * Company-type variations:
 *   Section 8  → "Income and Expenditure Account" (not P&L); "surplus/deficit" (not profit)
 *   OPC        → "To the Member of" (singular)
 *   Section8 / FPC → cash flow included; OPC / Private Small → cash flow optional
 *   CARO 2020  → EXEMPT for all 4 types
 *   ICFR       → EXEMPT for all 4 types (turnover/borrowing threshold)
 *   Key Audit Matters → NOT APPLICABLE (unlisted companies)
 */

import type { AnnualFilingData } from "../types";
import { fmtDate, fyEndYear, wrapPage } from "../utils";

export type OpinionType = "unmodified" | "qualified" | "adverse" | "disclaimer";

export interface AuditReportOptions {
  opinionType: OpinionType;
  qualificationDetails?: string;  // required when opinion is qualified / adverse / disclaimer
  emphasisOfMatter?: string;      // SA 706 paragraph
  cashFlowIncluded: boolean;      // Section 8 / FPC must include; OPC / Small exempt
}

export function generateAuditReport(
  data: AnnualFilingData,
  opts: AuditReportOptions
): string {
  const fy         = data.financialYear;
  const fyEnd      = fyEndYear(fy);              // e.g. "2025"
  const aud        = data.auditor;
  const isOPC      = data.companyType === "opc";
  const isSection8 = data.companyType === "section8";
  const reportDate = fmtDate(aud.reportDate || data.dateOfReport);
  const bsDate     = `March 31, ${fyEnd}`;
  const incl_cf    = opts.cashFlowIncluded;

  // Section 8 uses Income & Expenditure Account, not Profit & Loss
  const plLabel    = isSection8
    ? "the Income and Expenditure Account"
    : "the Statement of Profit and Loss";
  const profitWord = isSection8 ? "surplus/deficit" : "profit";

  // Financial statement components — opening paragraph
  const fsOpen = incl_cf
    ? `the Balance Sheet as at ${bsDate}, ${plLabel} the year then ended, and the Cash Flow Statement`
    : `the Balance Sheet as at ${bsDate}, ${plLabel} the year then ended`;

  // Financial statement components — Section 143(3)(c)
  const fsC = incl_cf
    ? `the Balance Sheet, ${plLabel} and the Cash Flow Statement`
    : `the Balance Sheet and ${plLabel}`;

  // Opinion paragraph — varies by opinion type
  const isModified = opts.opinionType !== "unmodified";
  let opinionPara = "";
  if (opts.opinionType === "unmodified") {
    opinionPara = `In our opinion and to the best of our information and according to the explanations given to us, the aforesaid financial statements give the information required by the Act in the manner so required and give a true and fair view in conformity with the accounting principles generally accepted in India, of the state of affairs of the Company at ${bsDate}, and ${profitWord}, for the year ended on that date.`;
  } else if (opts.opinionType === "qualified") {
    opinionPara = `In our opinion and to the best of our information and according to the explanations given to us, except for the effects of the matter described in the Basis for Qualified Opinion paragraph above, the aforesaid financial statements give the information required by the Act in the manner so required and give a true and fair view in conformity with the accounting principles generally accepted in India, of the state of affairs of the Company at ${bsDate}, and ${profitWord}, for the year ended on that date.`;
  } else if (opts.opinionType === "adverse") {
    opinionPara = `In our opinion and to the best of our information and according to the explanations given to us, because of the significance of the matter described in the Basis for Adverse Opinion paragraph above, the aforesaid financial statements do not give the information required by the Act in the manner so required and do not give a true and fair view in conformity with the accounting principles generally accepted in India, of the state of affairs of the Company at ${bsDate}, and ${profitWord}, for the year ended on that date.`;
  } else {
    opinionPara = `Because of the significance of the matter described in the Basis for Disclaimer of Opinion paragraph above, we have not been able to obtain sufficient appropriate audit evidence to provide a basis for an audit opinion. Accordingly, we do not express an opinion on the financial statements.`;
  }

  const basisHeading = opts.opinionType === "qualified"  ? "Basis for Qualified Opinion"
                     : opts.opinionType === "adverse"    ? "Basis for Adverse Opinion"
                     : opts.opinionType === "disclaimer" ? "Basis for Disclaimer of Opinion"
                     : "";

  // Auditor's remarks — unmodified → clean remark; modified → shows the qualification
  const auditRemark = isModified
    ? (opts.qualificationDetails || "[Insert qualification / disclaimer details]")
    : "There is no any qualifications, reservation or adverse remark or disclaimer";

  // Emphasis of Matter text
  const eomText = opts.emphasisOfMatter
    || "There are no matters to be emphasized in the financial statements. Accordingly, no Emphasis of Matter paragraph has been reported.";

  // Signature block
  const partnerLabel = aud.firmType === "proprietorship" ? "Proprietor" : "Partner";
  const frnLine      = aud.frn
    ? `<em>Firm No.: ${aud.frn}</em><br>`
    : "";

  const bodyHtml = `
<div class="header-block">
  <div class="doc-title">Independent Auditor&rsquo;s Report</div>
</div>

<p class="mt-8"><strong>To the ${isOPC ? "Member" : "Members"} of</strong><br>
<strong>${data.companyName}</strong></p>

<h2>Report on the Financial Statements</h2>

<p>We have audited the accompanying standalone financial statements of ${data.companyName} (&ldquo;the Company&rdquo;) which comprise ${fsOpen}, and notes to the financial statements, including a summary of significant accounting policies and other explanatory information.</p>

${isModified ? `
<h2>${basisHeading}</h2>
<p>${opts.qualificationDetails || "[Insert basis for modification here]"}</p>
` : ""}

<p>${opinionPara}</p>

<h2>Basis for Opinion</h2>
<p>We conducted our audit in accordance with the Standards on Auditing (SAs) specified under section 143(10) of the Companies Act, 2013. Our responsibilities under those Standards are further described in the Auditor&rsquo;s Responsibilities for the Audit of the Financial Statements section of our report. We are independent of the Company in accordance with the Code of Ethics issued by the Institute of Chartered Accountants of India together with the ethical requirements that are relevant to our audit of the financial statements under the provisions of the Companies Act, 2013 and the Rules thereunder, and we have fulfilled our other ethical responsibilities in accordance with these requirements and the Code of Ethics. We believe that the audit evidence we have obtained is sufficient and appropriate to provide a basis for our opinion.</p>

<h2>Emphasis of Matter</h2>
<p>${eomText}</p>

<h2>Key Audit Matters</h2>
<p>Key audit matters are those matters that, in our professional judgement, were most significance in our audit of the financial statements of the current period. These matters were addressed in the context of our audit of the financial statement as a whole, and in forming our opinion thereon, and we do not provide a separate opinion on these matters. Reporting of Key audit matters as per SA 701, Key Audit matters are not applicable to the Company since the Company falls under the category of unlisted companies, and as such, the requirement for reporting Key Audit Matters does not apply to it.</p>

<h2>Information other than the Financial Statements and Auditor&rsquo;s Report thereon</h2>
<p>The Company&rsquo;s board of directors is responsible for the preparation of the other information. The other information comprises the information included in the Board&rsquo;s Report including Annexures to Board&rsquo;s Report but does not include the financial statements and our auditor&rsquo;s report thereon.</p>
<p>Our opinion on the financial statements does not cover the other information and we do not express any form of assurance conclusion thereon.</p>
<p>In connection with our audit of the financial statements, our responsibility is to read the other information and, in doing so, consider whether the other information is materially inconsistent with the financial statements or our knowledge obtained during the course of our audit or otherwise appears to be materially misstated. If, based on the work we have performed, we conclude that there is a material misstatement of this other information, we are required to report that fact. We have nothing to report in this regard.</p>

<h2>Auditor&rsquo;s remarks</h2>
<p>${auditRemark}</p>

<h2>Responsibilities of Management and Those Charged with Governance for the Standalone Financial Statements</h2>
<p>The Company&rsquo;s Board of Directors is responsible for the matters stated in section 134(5) of the Companies Act, 2013 (&ldquo;the Act&rdquo;) with respect to the preparation of these financial statements that give a true and fair view of the financial position, financial performance${incl_cf ? " and cash flows" : ""} of the Company in accordance with the accounting principles generally accepted in India, including the accounting Standards specified under section 133 of the Act. This responsibility also includes maintenance of adequate accounting records in accordance with the provisions of the Act for safeguarding of the assets of the Company and for preventing and detecting frauds and other irregularities; selection and application of appropriate accounting policies; making judgments and estimates that are reasonable and prudent; and design, implementation and maintenance of adequate internal financial controls, that were operating effectively for ensuring the accuracy and completeness of the accounting records, relevant to the preparation and presentation of the financial statements that give a true and fair view and are free from material misstatement, whether due to fraud or error.</p>
<p>In preparing the financial statements, the Board of Directors is responsible for assessing the Company&rsquo;s ability to continue as a going concern, disclosing, as applicable, matters related to going concern and using the going concern basis of accounting unless the Board of Directors either intends to liquidate the Company or to cease operations, or has no realistic alternative but to do so. The Board of Directors are also responsible for overseeing the company&rsquo;s financial reporting process.</p>

<h2>Auditor&rsquo;s Responsibility for the Audit of the Financial Statements.</h2>
<p>Our objectives are to obtain reasonable assurance about whether the financial statements as a whole are free from material misstatement, whether due to fraud or error, and to issue an auditor&rsquo;s report that includes our opinion. Reasonable assurance is a high level of assurance, but is not a guarantee that an audit conducted in accordance with SAs will always detect a material misstatement when it exists. Misstatements can arise from fraud or error and are considered material if, individually or in the aggregate, they could reasonably be expected to influence the economic decisions of users taken on the basis of these financial statements.</p>
<p>As part of an audit in accordance with SAs, we exercise professional judgment and maintain professional skepticism throughout the audit. We also:</p>
<ul>
  <li>Identify and assess the risks of material misstatement of the standalone Financial Statements, whether due to fraud or error, design and perform audit procedures responsive to those risks, and obtain audit evidence that is sufficient and appropriate to provide a basis for our opinion. The risk of not detecting a material misstatement resulting from fraud is higher than for one resulting from error, as fraud may involve collusion, forgery, intentional omissions, misrepresentations, or the override of internal control.</li>
  <li>Obtain an understanding of internal financial control relevant to the audit in order to design audit procedures that are appropriate in the circumstances. Under section 143(3)(i) of the Act, we are also responsible for expressing our opinion on whether the Company has adequate internal financial controls system in place and the operating effectiveness of such controls.</li>
  <li>Evaluate the appropriateness of accounting policies used and the reasonableness of accounting estimates and related disclosures made by the management and Board of Directors.</li>
  <li>Conclude on the appropriateness of Management and Board of Director&rsquo;s use of the going concern basis of accounting in preparation of the Standalone Financial Statements and, based on the audit evidence obtained, whether a material uncertainty exists related to events or conditions that may cast significant doubt on the Company&rsquo;s ability to continue as a going concern. If we conclude that a material uncertainty exists, we are required to draw attention in our auditor&rsquo;s report to the related disclosures in the standalone Financial Statements or, if such disclosures are inadequate, to modify our opinion. Our conclusions are based on the audit evidence obtained up to the date of our auditor&rsquo;s report. However, future events or conditions may cause the Company to cease to continue as a going concern.</li>
  <li>Evaluate the overall presentation, structure and content of the financial statements, including the disclosures, and whether the financial statements represent the underlying transactions and events in a manner that achieves fair presentation.</li>
</ul>
<p>Materiality is the magnitude of misstatements in the standalone financial statements that, individually or in aggregate, makes it probable that the economic decisions of a reasonably knowledgeable user of the standalone financial statements may be influenced. We consider quantitative materiality and qualitative factors in (i) planning the scope of our audit work and in evaluating the results of our work; and (ii) to evaluate the effect of any identified misstatements in the standalone financial statements.</p>
<p>We communicate with those charged with governance regarding, among other matters, the planned scope and timing of the audit and significant audit findings, including any significant deficiencies in internal control that we identify during our audit.</p>
<p>We also provide those charged with governance with a statement that we have complied with relevant ethical requirements regarding independence, and to communicate with them all relationships and other matters that may reasonably be thought to bear on our independence, and where applicable, related safeguards.</p>
<p>From the matters communicated with those charged with governance, we determine those matters that were of most significance in the audit of the financial statements of the current period and are therefore the key audit matters. We describe these matters in our auditor&rsquo;s report unless law or regulation precludes public disclosure about the matter or when, in extremely rare circumstances, we determine that a matter should not be communicated in our report because the adverse consequences of doing so would reasonably be expected to outweigh the public interest benefits of such communication.</p>

<div class="page-break"></div>
<h2>Report on Other Legal and Regulatory Requirements</h2>
<p>State other matters as per Rule 11 of Companies (Audit and Auditors) Rules, 2014.</p>

<p>With respect to the other matters to be included in the Auditor&rsquo;s Report in accordance with Rule 11 of the Companies (Audit and Auditors) Rules, 2014, in our opinion and to the best of our information and according to the explanations given to us:</p>
<p>i. The Company does not have any pending litigations which would impact its financial position.</p>
<p>ii. The Company did not have any long-term contracts including derivative contracts for which there were any material foreseeable losses.</p>
<p>iii. There were no amounts which were required to be transferred to the Investor Education and Protection Fund by the Company.</p>

<p>1. As required by the Companies (Auditor&rsquo;s Report) Order, 2020 (&ldquo;the Order&rdquo;), issued by the Central Government of India in terms of sub-section (11) of section 143 of the Companies Act, 2013, is not applicable to the Company since the Company has not exceeded the specified threshold limit and it does not fall into any criteria to be caused application of the Order.</p>

<p>2. As required by Section 143 (3) of the Act, we report that:</p>
<p>a) We have sought and obtained all the information and explanations which to the best of our knowledge and belief were necessary for the purposes of our audit.</p>
<p>b) In our opinion, proper books of account as required by law have been kept by the Company so far as it appears from our examination of those books.</p>
<p>c) ${fsC} dealt with by this Report are in agreement with the books of account.</p>
<p>d)&nbsp;&nbsp;&nbsp;&nbsp;In our opinion, the aforesaid Standalone Financial Statements comply with the Accounting Standards specified under Section 133 of the Act, read with Rule 7 of the Companies (Accounts) Rules, 2021. and rules made thereunder.</p>
<p>e) On the basis of the written representations received from the directors at ${bsDate} taken on record by the Board of Directors, none of the directors is disqualified at ${bsDate} from being appointed as a director in terms of Section 164 (2) of the Act.</p>
<p>f) With respect to the adequacy of the internal financial controls over financial reporting of the Company Since the Company&rsquo;s turnover as per last audited financial statements is less than Rs.50 Crores and its borrowings from banks and financial institutions at any time during the year is less than Rs.25 Crores, the Company is exempted from getting an audit opinion with respect to the adequacy of the internal financial controls over financial reporting of the company and the operating effectiveness of such controls vide notification dated June 13, 2017;</p>

<p>iv. (a) The management has represented that, to the best of it&rsquo;s knowledge and belief, other than as disclosed in the notes to the accounts, no funds have been advanced or loaned or invested (either from borrowed funds or share premium or any other sources or kind of funds) by the company to or in any other person(s) or entity(ies), including foreign entities (&ldquo;Intermediaries&rdquo;), with the understanding, whether recorded in writing or otherwise, that the Intermediary shall, whether, directly or indirectly lend or invest in other persons or entities identified in any manner whatsoever by or on behalf of the company (&ldquo;Ultimate Beneficiaries&rdquo;) or provide any guarantee, security or the like on behalf of the Ultimate Beneficiaries;</p>
<p>(b) The management has represented, that, to the best of it&rsquo;s knowledge and belief, other than as disclosed in the notes to the accounts, no funds have been received by the company from any person(s) or entity(ies), including foreign entities (&ldquo;Funding Parties&rdquo;), with the understanding, whether recorded in writing or otherwise, that the company shall, whether, directly or indirectly, lend or invest in other persons or entities identified in any manner whatsoever by or on behalf of the Funding Party (&ldquo;Ultimate Beneficiaries&rdquo;) or provide any guarantee, security or the like on behalf of the Ultimate Beneficiaries; and</p>
<p>(c) Based on such audit procedures that have been considered reasonable and appropriate in the circumstances, nothing has come to our notice that has caused us to believe that the representations under sub-clause (i) and (ii) of Rule 11(e), as provided under (a) and (b) above, contain any material misstatement.</p>
<p>v. No dividend have been declared or paid during the year by the company.</p>
<p>vi. The Pursuant to Rule 11(g) of the Companies (Audit and Auditors) Rules, 2014, we report that, based on our examination, which included test checks and information provided, the Company utilized accounting software for maintaining its books of account. However, the software lacked an audit trail (edit log) feature to record all relevant transactions throughout the year, as required by the Proviso to Rule 3(1) of the Companies (Accounts) Rules, 2014. Consequently, we are unable to give any opinion on this.</p>
<p>g) With respect to the matter to be included in the Auditor&rsquo;s Report under section 197(16), In our opinion and according to the information and explanations given to us, the remuneration paid by the Company to its directors during the current year is in accordance with the provisions of section 197 of the Act. The remuneration paid to any director is not in excess of the limit laid down under section 197 of the Act. The Ministry of Corporate Affairs has not prescribed other details under section 197(16) which are required to be commented upon by us. (applicable in case of Public Company)</p>

<div class="sig-block mt-24">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;">
    <div style="min-width:45%;">
      <p><em>For ${aud.firmName || "[Firm Name]"}</em><br>
      <em>Chartered Accountants</em><br>
      ${frnLine}</p>
      ${aud.sealBase64
        ? `<img src="data:image/jpeg;base64,${aud.sealBase64}" style="height:60pt;max-width:120pt;display:block;margin-top:8pt;object-fit:contain;" alt="Firm Seal">`
        : '<div style="height:60pt;"></div>'}
    </div>
    <div style="text-align:right;min-width:45%;">
      ${aud.signatureBase64
        ? `<img src="data:image/jpeg;base64,${aud.signatureBase64}" style="height:40pt;max-width:120pt;display:inline-block;object-fit:contain;margin-bottom:2pt;" alt="Signature">`
        : '<div style="height:40pt;"></div>'}
      <p><strong>${aud.partnerName || "[Partner Name]"}</strong><br>
      (${partnerLabel})<br>
      <em>M. No.: ${aud.membershipNo || "[Membership No.]"}</em><br>
      Date: ${reportDate || "________________"}<br>
      Place: ${aud.place || data.placeOfSigning || "________________"}<br>
      <strong>UDIN: ${aud.udin || "[UDIN]"}</strong></p>
    </div>
  </div>
</div>
`;

  return wrapPage(
    `Independent Auditor's Report — ${data.companyName} — FY ${fy}`,
    bodyHtml
  );
}
