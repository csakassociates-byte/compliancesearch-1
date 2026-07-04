/**
 * MCA V3 Filling Guide — HTML Generator
 * Generates a ready-to-use reference page for:
 *   Section A — Extract of Board's Report (Rule 8/8A/12, Sec. 134)
 *   Section B — Extract of Auditor's Report (Sec. 143(2), Rule 11/12)
 *
 * Pure function: takes AnnualFilingData → returns HTML string.
 * Opens in a new browser tab. Zero effect on attachment generation.
 */

import type { AnnualFilingData } from "./types";
import { fmtDate, fyEndYear, fyStartYear, fmtIndian, parseIndian } from "./utils";

// ── Small helpers ──────────────────────────────────────────────────────────────

function num(s: string | undefined): number {
  return parseIndian(s || "0");
}

function rs(s: string | undefined): string {
  const n = num(s);
  return n === 0 ? "₹NIL" : `₹${fmtIndian(Math.abs(n))}`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

// ── Board's Report text builders ───────────────────────────────────────────────

function buildStateOfAffairs(data: AnnualFilingData): string {
  if (data.stateOfAffairs) return data.stateOfAffairs;
  const fy = data.financialYear;
  const fyEnd = fyEndYear(fy);
  const rev  = num(data.financials.revenueFromOperations);
  const pbt  = num(data.financials.profitBeforeTax);
  const pat  = num(data.financials.profitAfterTax);
  const prevPbt = num(data.financials.prevProfitBeforeTax);
  const revStr  = rev === 0 ? "NIL" : `₹${fmtIndian(Math.abs(rev))}`;
  const pbtLbl  = pbt < 0 ? "Net Loss before Tax" : "Net Profit before Tax";
  const patLbl  = pat < 0 ? "Net Loss after Tax"  : "Net Profit after Tax";
  const trend   = Math.abs(pbt) < Math.abs(prevPbt) ? "reflecting a slight improvement" : "reflecting a change";
  return (
    `During the financial year ${fy}, the Company recorded a turnover of ${revStr}, similar to the previous year. ` +
    `The ${pbtLbl} stood at ₹${fmtIndian(Math.abs(pbt))} as against ₹${fmtIndian(Math.abs(prevPbt))} reported in the previous year, ${trend}. ` +
    `After tax adjustments, the ${patLbl} amounted to ₹${fmtIndian(Math.abs(pat))}. ` +
    `The Company remains focused on strengthening its business model and enhancing future profitability.`
  );
}

function buildDividend(data: AnnualFilingData): string {
  if (!data.dividendDeclared) {
    return "No dividend was declared for the current financial year due to conservation of profits and continued investment in the business.";
  }
  if (data.dividendDetails) return data.dividendDetails;
  const type  = data.dividendType === "interim" ? "Interim Dividend"
              : data.dividendType === "final"   ? "Final Dividend"
              : "Interim and Final Dividend";
  const perSh = data.dividendAmountPerShare ? ` of ₹${data.dividendAmountPerShare} per equity share` : "";
  return `The Board of Directors declared/recommended ${type}${perSh} for the financial year ${data.financialYear}.`;
}

function buildDirectorChanges(data: AnnualFilingData): string {
  const fyEnd   = `31st March, ${fyEndYear(data.financialYear)}`;
  const changed = data.directors.filter(d => d.changedDuringYear && d.changeType);
  if (changed.length === 0) {
    return `During the financial year ended ${fyEnd}, there were no appointments or resignations of directors or key managerial personnel in the Company.`;
  }
  const lines = changed.map(d => {
    const action = d.changeType === "appointed" ? `${d.name} was appointed as ${d.designation}` :
                   `${d.name} (${d.designation}) resigned/ceased`;
    return action + " during the financial year.";
  });
  return `During the financial year ended ${fyEnd}, the following changes took place: ${lines.join(" ")}`;
}

function countOtherMatters(data: AnnualFilingData): number {
  // Base mandatory Rule 8/8A/5 items always in Board's Report
  let n = 18; // annual return, energy, technology, forex, IFC, cost records, IBC, OTS,
              // financial summary, change in business, director changes, deposits,
              // significant orders, board evaluation, POSH, maternity, secretarial audit, subsidiaries
  if (data.hasLoansGiven)   n += 1; // Sec 186 details
  if (data.hasDeposits)     n += 1; // deposit details
  if (data.hasSubsidiaries) n += 1; // subsidiary performance details
  if (data.csrApplicable)   n += 2; // CSR activities + committee statement
  if (data.companyType !== "opc" && data.companyType !== "private_small") n += 1; // NRC details
  return n;
}

// ── Auditor's Report text builders ─────────────────────────────────────────────

function buildAuditOpinion(data: AnnualFilingData): string {
  const co    = data.companyName;
  const fyEnd = fyEndYear(data.financialYear);
  const date  = `March 31, ${fyEnd}`;
  const pl    = num(data.financials.profitAfterTax) < 0 ? "loss" : "profit";
  return (
    `We have audited the accompanying standalone financial statements of ${co} (the Company), ` +
    `which comprise the Balance Sheet as at ${date}, the Statement of Profit and Loss for the year then ended, ` +
    `and the notes to the financial statements, including a summary of significant accounting policies and other explanatory information.\n\n` +
    `In our opinion and to the best of our information and according to the explanations given to us, the aforesaid financial statements ` +
    `give the information required by the Act in the manner so required and give a true and fair view, ` +
    `in conformity with the accounting principles generally accepted in India, of the state of affairs of the Company as at ${date}, ` +
    `and its ${pl} for the year ended on that date.`
  );
}

function buildBasisOfOpinion(): string {
  return (
    `We conducted our audit in accordance with the Standards on Auditing (SAs) specified under section 143(10) of the Companies Act, 2013. ` +
    `Our responsibilities under those Standards are further described in the Auditor's Responsibilities section of our report. ` +
    `We are independent of the Company in accordance with the Code of Ethics issued by the Institute of Chartered Accountants of India, ` +
    `together with the ethical requirements relevant to our audit under the provisions of the Companies Act, 2013 and the Rules thereunder, ` +
    `and we have fulfilled our other ethical responsibilities in accordance with these requirements and the Code of Ethics. ` +
    `We believe that the audit evidence we have obtained is sufficient and appropriate to provide a basis for our opinion.`
  );
}

function buildEmphasis(): string {
  return "There are no matters to be emphasized in the financial statements. Accordingly, no Emphasis of Matter paragraph has been reported.";
}

function buildKeyAuditMatters(): string {
  return (
    `Key Audit Matters are those matters that, in our professional judgement, were of most significance in our audit of the financial statements ` +
    `of the current period. These matters were addressed in the context of our audit of the financial statements as a whole and in forming our ` +
    `opinion thereon, and we do not provide a separate opinion on these matters. ` +
    `Reporting of Key Audit Matters as per SA 701 is not applicable to the Company, since the Company falls under the category of ` +
    `unlisted companies, and as such, the requirement for reporting Key Audit Matters does not apply to it.`
  );
}

function buildOtherInfo(): string {
  return (
    `The Company's Board of Directors is responsible for the preparation of the other information. The other information comprises ` +
    `the information included in the Board's Report, including Annexures to the Board's Report, but does not include the financial statements ` +
    `and our auditor's report thereon. Our opinion on the financial statements does not cover the other information, and we do not express ` +
    `any form of assurance conclusion thereon. In connection with our audit of the financial statements, our responsibility is to read the ` +
    `other information and, in doing so, consider whether the other information is materially inconsistent with the financial statements or ` +
    `our knowledge obtained during the course of our audit, or otherwise appears to be materially misstated. ` +
    `If, based on the work we have performed, we conclude that there is a material misstatement of this other information, we are required ` +
    `to report that fact. We have nothing to report in this regard.`
  );
}

function buildMgmtResponsibility(data: AnnualFilingData): string {
  return (
    `The Company's Board of Directors is responsible for the matters stated in Section 134(5) of the Companies Act, 2013 (the Act) ` +
    `with respect to the preparation of these financial statements that give a true and fair view of the financial position, ` +
    `financial performance, and cash flows of the Company in accordance with the accounting principles generally accepted in India, ` +
    `including the Accounting Standards specified under Section 133 of the Act. This responsibility also includes the maintenance of ` +
    `adequate accounting records in accordance with the provisions of the Act for safeguarding the assets of the Company and for ` +
    `preventing and detecting frauds and other irregularities; selection and application of appropriate accounting policies; ` +
    `making of judgments and estimates that are reasonable and prudent; and the design, implementation, and maintenance of adequate ` +
    `internal financial controls that were operating effectively for ensuring the accuracy and completeness of the accounting records, ` +
    `relevant to the preparation and presentation of the financial statements that give a true and fair view and are free from material misstatement.\n\n` +
    `In preparing the financial statements, the Board of Directors is responsible for assessing the Company's ability to continue as a ` +
    `going concern, disclosing, as applicable, matters related to going concern, and using the going concern basis of accounting, unless ` +
    `the Board of Directors either intends to liquidate the Company or to cease operations, or has no realistic alternative but to do so. ` +
    `The Board of Directors is also responsible for overseeing the Company's financial reporting process.`
  );
}

function buildAuditorResponsibility(): string {
  return (
    `Our objectives are to obtain reasonable assurance about whether the financial statements as a whole are free from material misstatement, ` +
    `whether due to fraud or error, and to issue an auditor's report that includes our opinion. Reasonable assurance is a high level of assurance, ` +
    `but it is not a guarantee that an audit conducted in accordance with the SAs will always detect a material misstatement when it exists. ` +
    `Misstatements can arise from fraud or error and are considered material if, individually or in the aggregate, they could reasonably be expected ` +
    `to influence the economic decisions of users taken on the basis of these financial statements.\n\n` +
    `As part of an audit in accordance with SAs, we exercise professional judgment and maintain professional skepticism throughout the audit. We also:\n\n` +
    `• Identify and assess the risks of material misstatement of the financial statements, whether due to fraud or error, design and perform audit ` +
    `procedures responsive to those risks, and obtain audit evidence that is sufficient and appropriate to provide a basis for our opinion.\n\n` +
    `• Obtain an understanding of internal financial control relevant to the audit in order to design audit procedures that are appropriate in the circumstances.\n\n` +
    `• Evaluate the appropriateness of accounting policies used and the reasonableness of accounting estimates and related disclosures made by management.\n\n` +
    `• Conclude on the appropriateness of the Board of Directors' use of the going concern basis of accounting and, based on the audit evidence obtained, ` +
    `whether a material uncertainty exists related to events or conditions that may cast significant doubt on the Company's ability to continue as a going concern.`
  );
}

function buildRule11(data: AnnualFilingData): string {
  return (
    `With respect to the other matters to be included in the Auditor's Report in accordance with Rule 11 of the Companies (Audit and Auditors) Rules, 2014, ` +
    `in our opinion and to the best of our information and according to the explanations given to us:\n\n` +
    `i. The Company does not have any pending litigations which would impact its financial position.\n\n` +
    `ii. The Company did not have any long-term contracts including derivative contracts for which there were any material foreseeable losses.\n\n` +
    `iii. There were no amounts which were required to be transferred to the Investor Education and Protection Fund by the Company.\n\n` +
    `iv. (a) The management has represented that, to the best of its knowledge and belief, other than as disclosed in the notes to the accounts, ` +
    `no funds have been advanced or loaned or invested (either from borrowed funds or share premium or any other sources or kind of funds) by the ` +
    `Company to or in any other person(s) or entity(ies), including foreign entities (Intermediaries), with the understanding, whether recorded in ` +
    `writing or otherwise, that the Intermediary shall, whether directly or indirectly, lend or invest in other persons or entities identified in ` +
    `any manner whatsoever by or on behalf of the Company (Ultimate Beneficiaries) or provide any guarantee, security or the like on behalf of the Ultimate Beneficiaries.\n\n` +
    `(b) The management has represented that, to the best of its knowledge and belief, other than as disclosed in the notes to the accounts, ` +
    `no funds have been received by the Company from any person(s) or entity(ies), including foreign entities (Funding Parties), with the understanding, ` +
    `whether recorded in writing or otherwise, that the Company shall, whether directly or indirectly, lend or invest in other persons or entities ` +
    `identified in any manner whatsoever by or on behalf of the Funding Party (Ultimate Beneficiaries) or provide any guarantee, security or the ` +
    `like on behalf of the Ultimate Beneficiaries.\n\n` +
    `(c) Based on audit procedures considered reasonable and appropriate in the circumstances, nothing has come to our notice that has caused us to ` +
    `believe that the representations under sub-clauses (a) and (b) above contain any material misstatement.`
  );
}

function buildRule11g(): string {
  return (
    `Pursuant to Rule 11(g) of the Companies (Audit and Auditors) Rules, 2014, we report that, based on our examination, which included test checks ` +
    `and information provided, the Company utilized accounting software for maintaining its books of account. However, the software lacked an audit ` +
    `trail (edit log) feature to record all relevant transactions throughout the year, as required by the Proviso to Rule 3(1) of the Companies ` +
    `(Accounts) Rules, 2014. Consequently, we are unable to give any opinion on this matter.`
  );
}

function buildSection143(data: AnnualFilingData): string {
  const fyEnd = fyEndYear(data.financialYear);
  const date  = `31st March, ${fyEnd}`;
  const rev   = num(data.financials.revenueFromOperations);
  const exempted = rev < 500000000; // < ₹50 crore
  const ifcPart  = exempted
    ? `With respect to the adequacy of the internal financial controls over financial reporting of the Company: Since the Company's turnover as per last audited financial statements is less than Rs.50 Crores and its borrowings from banks and financial institutions at any time during the year is less than Rs.25 Crores, the Company is exempted from getting an audit opinion with respect to the adequacy of the internal financial controls over financial reporting of the company and the operating effectiveness of such controls vide notification dated June 13, 2017.`
    : `The Company has adequate internal financial controls system in place and the operating effectiveness of such controls.`;
  return (
    `As required by Section 143(3) of the Act, we report that:\n\n` +
    `a) We have sought and obtained all the information and explanations which to the best of our knowledge and belief were necessary for the purposes of our audit.\n\n` +
    `b) In our opinion, proper books of account as required by law have been kept by the Company so far as it appears from our examination of those books.\n\n` +
    `c) The Balance Sheet, the Statement of Profit and Loss and the Cash Flow Statement dealt with by this Report are in agreement with the books of account.\n\n` +
    `d) In our opinion, the aforesaid financial statements comply with the Accounting Standards specified under Section 133 of the Act and rules made thereunder.\n\n` +
    `e) On the basis of the written representations received from the directors as on ${date} taken on record by the Board of Directors, none of the directors is disqualified as on ${date} from being appointed as a director in terms of Section 164(2) of the Act.\n\n` +
    `f) ${ifcPart}\n\n` +
    `g) With respect to the matter to be included in the Auditor's Report under section 197(16): In our opinion and according to the information and explanations given to us, the remuneration paid by the Company to its directors during the current year is in accordance with the provisions of section 197 of the Act. The remuneration paid to any director is not in excess of the limit laid down under section 197 of the Act.`
  );
}

function buildIFC(data: AnnualFilingData): string {
  const rev = num(data.financials.revenueFromOperations);
  if (rev < 500000000) {
    return (
      `With respect to the adequacy of the internal financial controls over financial reporting of the Company: ` +
      `Since the Company's turnover as per last audited financial statements is less than Rs.50 Crores and its borrowings from banks ` +
      `and financial institutions at any time during the year is less than Rs.25 Crores, the Company is exempted from getting an audit ` +
      `opinion with respect to the adequacy of the internal financial controls over financial reporting of the company and the operating ` +
      `effectiveness of such controls vide notification dated June 13, 2017.`
    );
  }
  return "The Company has adequate internal financial controls system in place and such controls were operating effectively as at the balance sheet date.";
}

// ── HTML component builders ────────────────────────────────────────────────────

function secHdr(letter: string, title: string, sub: string): string {
  return `<div class="sec-hdr sec-${letter.toLowerCase()}">
    <div class="sec-badge">Section ${letter}</div>
    <div class="sec-title">${title}</div>
    <div class="sec-sub">${sub}</div>
  </div>`;
}

function subHdr(text: string): string {
  return `<div class="sub-hdr">${text}</div>`;
}

const COPY_BTN = `<button class="cpbtn" onclick="cpField(this)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy</button>`;

function fieldText(num: string, title: string, content: string): string {
  const len  = content.length;
  const warn = len > 3500 ? `<span class="warn">⚠ ${len} chars</span>` : `<span class="cc">${len} chars</span>`;
  return `<div class="field">
    <div class="fhdr"><span class="fnum">${num}</span><span class="ftitle">${title}</span>${warn}${COPY_BTN}</div>
    <div class="fcontent">${esc(content)}</div>
  </div>`;
}

function fieldYN(num: string, title: string, yes: boolean): string {
  return `<div class="field">
    <div class="fhdr"><span class="fnum">${num}</span><span class="ftitle">${title}</span></div>
    <div class="fyn">${yes ? '<span class="y">☑ Yes</span> &nbsp; ☐ No' : '☐ Yes &nbsp; <span class="n">☑ No</span>'}</div>
  </div>`;
}

function fieldTable(num: string, title: string, inner: string): string {
  return `<div class="field">
    <div class="fhdr"><span class="fnum">${num}</span><span class="ftitle">${title}</span></div>
    <div class="ftbl">${inner}</div>
  </div>`;
}

function fieldNum(num: string, title: string, value: number | string): string {
  return `<div class="field">
    <div class="fhdr"><span class="fnum">${num}</span><span class="ftitle">${title}</span>${COPY_BTN}</div>
    <div class="fval">${value}</div>
  </div>`;
}

// ── Main export ────────────────────────────────────────────────────────────────

export function generateMcaV3GuideHtml(data: AnnualFilingData): string {
  const fy      = data.financialYear;
  const fyEnd   = fyEndYear(fy);
  const fyStart = fyStartYear(fy);
  const endDate = `31st March, ${fyEnd}`;
  const isOPC   = data.companyType === "opc";
  const isSml   = data.companyType === "private_small";
  const isSec8  = data.companyType === "section8";

  // Active directors count for board meeting attendance
  const activeDirCount = data.directors.filter(d => d.isActive).length;

  // ── Board meetings table ─────────────────────────────────────────────────────
  const bmRows = data.boardMeetings.map((m, i) => {
    const attended = m.directorsPresent.length;
    const total    = activeDirCount || attended;
    const pct      = total > 0 ? ((attended / total) * 100).toFixed(2) : "100.00";
    return `<tr><td>${i + 1}</td><td>${fmtDate(m.date) || m.date}</td><td>${total}</td><td>${attended}</td><td>${pct}%</td></tr>`;
  }).join("");

  const bmTable = `<table>
    <thead><tr><th>S.No.</th><th>Date of Meeting (DD/MM/YYYY)</th><th>Total Directors</th><th>Directors Attended</th><th>% Attendance</th></tr></thead>
    <tbody>${bmRows || "<tr><td colspan='5'>No board meetings recorded</td></tr>"}</tbody>
  </table>`;

  // ── Field content values ─────────────────────────────────────────────────────

  const DRS = `Directors state that:\ni. In the preparation of the Annual Accounts, the applicable accounting standards have been followed along with proper explanation relating to material departures;\nii. The Directors have selected such accounting policies and applied them consistently and made judgments and estimates that are reasonable and prudent so as to give a true and fair view of the state of affairs of the Company at the end of the financial year and of the profit and loss of the Company for that period;\niii. The Directors have taken proper and sufficient care for the maintenance of adequate accounting records in accordance with the provisions of the Companies Act, 2013 for safeguarding the assets of the Company and for preventing and detecting fraud and other irregularities;\niv. The Directors have prepared the annual accounts on a going concern basis;\nv. The Directors have devised proper systems to ensure compliance with the provisions of all applicable laws and that such systems are adequate and operating effectively.`;

  const fraudText = data.fraudReported
    ? (data.fraudDetails || "Fraud has been reported under sub-section (12) of section 143. Details: [Add details as per Auditor's Report]")
    : "No cases regarding frauds have been filed during the year under the Act.";

  const indepText = (isOPC || isSml || isSec8)
    ? "The provision regarding appointment of Independent Director is not applicable to this Company."
    : "All the Independent Directors have given their declarations that they meet the criteria of independence as laid down under Section 149(6) of the Companies Act, 2013.";

  const nrcText = (isOPC || isSml)
    ? "The provisions of Section 178(1) and Section 178(3) relating to the constitution of Nomination and Remuneration Committee and Stakeholders Relationship Committee are not applicable to the Company. Hence, no such disclosures are required to be made in this Report."
    : "The Nomination and Remuneration Committee has been duly constituted in compliance with Section 178 of the Companies Act, 2013. The Committee has formulated a policy for the appointment and remuneration of directors and key managerial personnel.";

  const auditRmk = data.auditQualification
    ? (data.auditQualificationExplanation || "The auditor has expressed a qualification/reservation. Board's explanation: [Add explanation here as per Section 134(3)(f)]")
    : "There are no qualifications, reservations, adverse remarks or disclaimers in the auditor's report.";

  const sec186 = data.hasLoansGiven
    ? "Details of loans, guarantees, investments and securities given by the Company under Section 186 are provided in the notes to financial statements."
    : "This clause is Not applicable on this Company.";

  const materialChg = data.materialChangesAfterFY
    ? (data.materialChangesDetails || "There have been material changes and commitments affecting the financial position of the Company between the end of the financial year and the date of this Report. Details: [Add details]")
    : "There have been no material changes and commitments affecting the financial position of the Company between the end of the financial year to which the financial statement relates and date of this Report.";

  const riskText = data.riskManagementDetails
    || "The Management of the Company has framed the risk management policy for the Company including identification of the elements of risk. Further, there is no material risk which in the opinion of the Board might threaten the existence of the Company.";

  const techText = data.technologyAbsorptionDetails
    || "The Company has not imported any technology during the period under review. Continuous efforts are being made to improve the quality of products and processes in order to enhance operational efficiency and customer satisfaction.";

  const energyText = data.energyConservationDetails
    || "The Company has taken adequate measures to ensure optimum utilization of all equipment and resources so as to conserve energy. Efforts are continuously made to identify and implement energy-saving opportunities.";

  const fxEarn = num(data.foreignExchangeEarnings);
  const fxOut  = num(data.foreignExchangeOutgo);
  const fxText = (fxEarn === 0 && fxOut === 0)
    ? "There were no foreign exchange earnings or outgo during the financial year under review."
    : `Foreign Exchange Earnings: ₹${fmtIndian(fxEarn)}\nForeign Exchange Outgo: ₹${fmtIndian(fxOut)}`;

  const subsText = data.hasSubsidiaries
    ? "Details of subsidiary/associate companies and their contribution to the overall performance of the Company are provided separately as an annexure to this Report."
    : "The Company does not have any subsidiary, associate company or joint venture. Hence, no such disclosures are required.";

  const ifcBoardText = "There is an adequate internal financial control system in place. The Company has in place systems of internal control designed to provide reasonable assurance regarding the effectiveness and reliability of financial reporting and compliance with applicable Laws and regulations.";

  const costText  = "The maintenance of cost records is not mandated under Companies (Cost Records and Audit) Rules, 2014, for the business activities carried out by the Company.";
  const ibcText   = "No applications are filed or pending under the Insolvency and Bankruptcy Code, 2016 (31 of 2016) against the Company. Hence the said provision is not applicable to the Company.";
  const otsText   = "There was no instance of one-time settlement with any Bank or Financial Institution.";
  const chngBizText = `During the financial year ended ${endDate}, there has been no change in the nature of the business of the Company.`;

  const evalText = (isOPC || isSml)
    ? "The formal annual evaluation of Board performance is not mandatorily applicable to the Company as per provisions of Section 134(3)(p) read with applicable Rules."
    : "The Board of Directors has carried out an annual evaluation of its own performance, the performance of the committees and individual directors as per the provisions of the Companies Act, 2013.";

  const depositsText = data.hasDeposits
    ? "The Company has accepted deposits from public/members during the year. Details are provided as per Sections 73 to 76 of the Companies Act, 2013 and rules made thereunder. [Add details]"
    : "During the year under review, the Company has not accepted any deposits from the public within the meaning of Sections 73 to 76 of the Companies Act, 2013 and rules made thereunder.";

  const ordersText = data.significantOrders
    ? (data.significantOrdersDetails || "Significant/material orders have been passed by Regulators/Courts/Tribunals. Details: [Add details]")
    : "There are no significant or material orders passed by any Regulators or Courts or Tribunals which would impact the going concern status of the Company and its future operations.";

  const poshText = `In compliance with the Sexual Harassment of Women at Workplace (Prevention, Prohibition & Redressal) Act, 2013, the Company has adopted a zero-tolerance policy towards sexual harassment. An Internal Complaints Committee is in place to address complaints, and regular training and awareness programs are conducted to ensure a safe and respectful workplace.`;
  const maternityText = "The Board of Directors confirms that the Company has complied with the provisions of the Maternity Benefit Act, 1961. The policy has been adopted and is in force.";

  const webLink = data.annualReturnWebLink || "The Company does not have any functional website. Annual Return is not required to be placed on website.";

  const reservesText = `The Company has transferred Rs. NIL to its Reserves in the Balance Sheet during the year under review.`;

  // CARO — OPC and Section 8 are exempt; private_small may be exempt if thresholds met
  const caroExempt = isOPC || isSec8;
  // For small companies, CARO exemption depends on capital + borrowings + revenue < thresholds
  // We mark as "Verify with CA" for private_small
  const caroApplicable = !caroExempt && !isSml;

  const otherMatters = countOtherMatters(data);

  // ── Employees ────────────────────────────────────────────────────────────────
  const empM = data.employeesMale   ?? 0;
  const empF = data.employeesFemale ?? 0;
  const empO = data.employeesOther  ?? 0;

  // ── Auditor details ──────────────────────────────────────────────────────────
  const audFirm  = data.auditor.firmName
    ? `M/s. ${data.auditor.firmName.replace(/^M\/s\.?\s*/i, "")}`
    : "[Firm Name]";

  // ── Build HTML ───────────────────────────────────────────────────────────────
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MCA V3 Guide — ${data.companyName} — FY ${fy}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#1e293b;background:#f1f5f9}
.pg-hdr{background:linear-gradient(120deg,#1e40af,#6d28d9);color:#fff;padding:18px 28px;display:flex;justify-content:space-between;align-items:center;gap:16px}
.pg-hdr-left h1{font-size:20px;margin-bottom:3px}
.pg-hdr-left h2{font-size:13px;font-weight:400;opacity:.8}
.pg-hdr-left .meta{font-size:11px;opacity:.65;margin-top:5px}
.print-btn{background:#fff;color:#1e40af;border:none;padding:8px 16px;border-radius:7px;cursor:pointer;font-weight:700;font-size:13px;white-space:nowrap}
.print-btn:hover{background:#e0e7ff}
.notice{background:#fef3c7;border-left:4px solid #f59e0b;padding:10px 24px;font-size:12px;color:#78350f}
.container{max-width:980px;margin:0 auto;padding:20px 14px 40px}
.sec-hdr{padding:13px 18px;margin:24px 0 14px;border-radius:8px}
.sec-a{background:#dbeafe;border-left:5px solid #1e40af}
.sec-b{background:#ede9fe;border-left:5px solid #6d28d9}
.sec-badge{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;opacity:.6}
.sec-title{font-size:15px;font-weight:700;margin:2px 0}
.sec-sub{font-size:11px;opacity:.65}
.sub-hdr{background:#f1f5f9;border-left:3px solid #94a3b8;padding:7px 14px;margin:14px 0 8px;font-weight:600;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:.5px}
.field{background:#fff;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:10px;overflow:hidden}
.fhdr{display:flex;align-items:center;gap:8px;padding:7px 13px;background:#f8fafc;border-bottom:1px solid #e2e8f0}
.fnum{background:#1e40af;color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;white-space:nowrap}
.sec-b .fnum{background:#6d28d9}
.ftitle{font-weight:600;font-size:12px;flex:1}
.cc{font-size:10px;color:#94a3b8}
.warn{font-size:10px;color:#d97706;font-weight:600}
.fcontent,.fval{padding:11px 13px;white-space:pre-wrap;line-height:1.65;font-size:12.5px}
.fval{font-size:20px;font-weight:700;color:#1e40af;text-align:center}
.fyn{padding:11px 13px;font-size:14px}
.cpbtn{margin-left:auto;background:#e0e7ff;color:#1e40af;border:none;border-radius:5px;padding:4px 11px;font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px;white-space:nowrap;transition:background .15s,color .15s;flex-shrink:0}
.cpbtn:hover{background:#c7d2fe}
.cpbtn.ok{background:#dcfce7;color:#16a34a}
.sec-b .cpbtn{background:#ede9fe;color:#6d28d9}
.sec-b .cpbtn:hover{background:#ddd6fe}
.sec-b .cpbtn.ok{background:#dcfce7;color:#16a34a}
.y{color:#16a34a;font-weight:700}
.n{color:#94a3b8;font-weight:700}
.ftbl{padding:11px 13px;overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:12px}
th{background:#f1f5f9;font-weight:600;padding:6px 10px;text-align:left;border:1px solid #e2e8f0}
td{padding:6px 10px;border:1px solid #e2e8f0}
tr:nth-child(even) td{background:#f8fafc}
.emp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:11px 13px}
.emp-box{text-align:center;padding:10px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0}
.emp-box .cnt{font-size:26px;font-weight:700;color:#1e40af}
.emp-box .lbl{font-size:11px;color:#64748b;margin-top:2px}
.pg-ftr{text-align:center;padding:20px;color:#94a3b8;font-size:11px;border-top:1px solid #e2e8f0;margin-top:24px}
.small-note{font-size:11px;color:#64748b;font-style:italic;padding:6px 13px 10px}
@media print{
  body{background:#fff}
  .print-btn,.cpbtn{display:none}
  .field{break-inside:avoid}
  .pg-hdr{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .sec-hdr{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
</style>
</head>
<body>
<div class="pg-hdr">
  <div class="pg-hdr-left">
    <h1>📋 MCA V3 Filling Guide</h1>
    <h2>${data.companyName} &nbsp;|&nbsp; CIN: ${data.cin}</h2>
    <div class="meta">FY: ${fy} &nbsp;|&nbsp; Generated: ${today} &nbsp;|&nbsp; ComplianceSearch.in</div>
  </div>
  <button class="print-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
</div>

<div class="notice">
  ⚠️ <strong>Instructions:</strong> Click the <strong>Copy</strong> button on any field → paste in MCA V3 portal. Verify all data before final submission. Character limits apply on portal — trim text if the portal shows an error.
</div>

<div class="container">

${secHdr("A", "Extract of Board's Report", "Pursuant to Section 134 | Rule 8, 8A & 12 | Companies (Accounts) Rules, 2014")}

${subHdr("General")}

${fieldText("1", "Web address where Annual Return is placed (Sec. 92(3))", webLink)}

${subHdr("Board Meetings — Section 2")}

${fieldYN("2(a)", "Whether Company is an OPC or Small Company as at FY end date?", isOPC || isSml)}

${fieldTable(`2(b)(i) — Number of meetings held: ${data.boardMeetings.length}`, "Board Meeting details with attendance", bmTable)}

${fieldNum("2(c)(i)", "Number of Committee Meetings held", 0)}

${subHdr("Important Disclosures")}

${fieldText("3", "*Directors' Responsibility Statement (Section 134(5))", DRS)}

${fieldText("4", "*Frauds reported by Auditors under Sec. 143(12)", fraudText)}

${fieldText("5", "Declaration by Independent Directors under Sec. 149(6)", indepText)}

${fieldText("6", "Sec. 178(1) — Directors appointment & remuneration policy (NRC)", nrcText)}

${subHdr("Audit Remarks")}

${fieldText("7", "Auditor's qualifications / reservations / adverse remarks", auditRmk)}

${subHdr("Section 186 — Loans, Guarantees & Investments")}

${fieldYN("9(a)", "Whether any loan, guarantee given or securities of another body corporate purchased?", data.hasLoansGiven)}
${fieldYN("9(b)", "Whether Company falls under Section 186(11) exemption category?", false)}
${fieldYN("9(c)", "Are there any reportable transactions under Section 186?", data.hasLoansGiven)}
${fieldText("9(d)", "Brief details as to why transaction is not reportable", sec186)}

${subHdr("State of Affairs & Financial Disclosures")}

${fieldText("11", "*Description of state of company's affairs", buildStateOfAffairs(data))}

${fieldText("12(a)", "Brief description — amounts proposed to carry to reserves", reservesText)}
${fieldNum("12(b)", "Amount (in INR)", 0)}

${fieldText("13(a)", "Brief description — dividend recommended/declared", buildDividend(data))}
${fieldNum("13(b)", "Dividend Amount (in INR)", data.dividendDeclared ? (data.dividendAmountPerShare || "0") : "0")}

${fieldText("14", "*Material changes between FY end and date of report", materialChg)}

${fieldText("15", "*Risk Management Policy — development & implementation", riskText)}

${subHdr("CSR — Sections 16 to 22")}

${fieldYN("16(a)(i)", "Whether CSR is applicable under Section 135?", data.csrApplicable || false)}
${data.csrApplicable
  ? fieldText("16–22", "CSR Details (Net profit, expenditure, activities, implementing agency)", data.csrDetails || "[Add CSR net profit for last 3 years, prescribed expenditure 2%, amount spent, and activity-wise details as per Schedule VII]")
  : `<div class="field"><div class="fhdr"><span class="fnum">16–22</span><span class="ftitle">CSR Details</span></div><div class="small-note">CSR not applicable — all CSR fields can be left as 0 / blank.</div></div>`
}

${subHdr("Rule 8/8A Disclosures — Section 23")}

${fieldText("23(a)", "Technology Absorption — Rule 8(3)(B)", techText)}

${fieldText("23(b)", "Energy Conservation — Rule 8(3)(A)", energyText)}

${fieldText("23(c)", "Foreign Exchange Earnings & Outgo — Rule 8(3)(C)", fxText)}

${fieldText("23(e)(i)", "Subsidiaries/Associates/JVs which became or ceased during year", subsText)}

${fieldText("23(e)(iii)", "Adequacy of Internal Financial Controls with reference to Financial Statements", ifcBoardText)}

${fieldText("23(e)(iv)", "Maintenance of Cost Records under Sec. 148(1)", costText)}

${fieldText("23(e)(v)", "Proceedings under Insolvency & Bankruptcy Code, 2016", ibcText)}

${fieldText("23(e)(vi)", "One-time Settlement with Banks / Financial Institutions", otsText)}

${fieldText("23(e)(vii)", "*Financial Summary / Highlights", buildStateOfAffairs(data))}

${fieldText("23(e)(viii)", "*Change in nature of business during FY", chngBizText)}

${fieldText("23(e)(ix)", "*Directors / KMP appointed or resigned during the year", buildDirectorChanges(data))}

${fieldText("23(f)", "Details of Deposits under Chapter V (Sec. 73–76)", depositsText)}

${fieldText("23(g)", "Significant / material orders by Regulators / Courts / Tribunals", ordersText)}

${fieldText("23(h)", "Annual evaluation of Board's own performance", evalText)}

${fieldText("23(i)(a)", "POSH — Sexual Harassment at Workplace compliance", poshText)}

${fieldText("23(i)(a)(i–iii)", "POSH Complaint counts", `Number of complaints received: 0\nNumber of complaints disposed off: 0\nNumber of complaints pending beyond 90 days: 0`)}

${fieldText("23(i)(b)", "Maternity Benefit Act compliance", maternityText)}

${subHdr("Number of Employees — Section 23(j)")}

<div class="field">
  <div class="fhdr"><span class="fnum">23(j)</span><span class="ftitle">Number of employees as on closure of financial year</span></div>
  <div class="emp-grid">
    <div class="emp-box"><div class="cnt">${empF}</div><div class="lbl">Female</div></div>
    <div class="emp-box"><div class="cnt">${empM}</div><div class="lbl">Male</div></div>
    <div class="emp-box"><div class="cnt">${empO}</div><div class="lbl">Transgender</div></div>
  </div>
</div>

${subHdr("Other Matters — Section 24")}

${fieldNum("24(i)", "Number of other matters included in Director's Report", otherMatters)}
${fieldText("24(ii)", "Heading for the matter", "Refer to Directors' Report for the same")}
${fieldText("24(iii)", "Reference to section / rule to which it pertains", "Refer to Directors' Report for the same")}
${fieldText("24(iv)", "Brief description of the matter", "Refer to Directors' Report for the same")}

${secHdr("B", "Extract of Auditor's Report (Standalone)", "Pursuant to Section 143(2) | Rule 12 | Rule 11 | Companies (Audit and Auditors) Rules, 2014")}

${subHdr("Report of the Auditor — Section 1")}

${fieldText("1(a)", "*Opinion of the Auditor", buildAuditOpinion(data))}

${fieldText("1(b)", "*Basis of Opinion", buildBasisOfOpinion())}

${fieldText("1(c)", "*Emphasis of Matter", buildEmphasis())}

${fieldText("1(d)", "*Key Audit Matters", buildKeyAuditMatters())}

${fieldText("1(e)", "*Other Information (if any)", buildOtherInfo())}

${subHdr("Auditor's Remarks — Section 2")}

${fieldNum("2", "Number of qualifications / reservations / adverse remarks / disclaimer", data.auditQualification ? 1 : 0)}

${subHdr("Management Responsibility — Section 3")}

${fieldText("3", "*Responsibilities of Management and Those Charged with Governance", buildMgmtResponsibility(data))}

${subHdr("Auditor Responsibility — Section 4")}

${fieldText("4", "*Auditor's Responsibilities for the Audit of the Financial Statements", buildAuditorResponsibility())}

${subHdr("Other Details — Section 5")}

${fieldText("5(a)", "*Other matters as per Rule 11 of Companies (Audit & Auditors) Rules, 2014", buildRule11(data))}

${fieldText("5(b)", "Other matters — Rule 11(g): Audit Trail in Accounting Software", buildRule11g())}

${subHdr("Other Legal & Regulatory Requirements — Section 6")}

${fieldText("6(a)", "*Report on Other Legal and Regulatory Requirements — Section 143(3)", buildSection143(data))}

${isSml
  ? `<div class="field"><div class="fhdr"><span class="fnum">6(b)</span><span class="ftitle">Whether CARO is applicable? (Small Company — verify thresholds with CA)</span></div><div class="small-note">Small Company may be exempt if: paid-up capital + reserves ≤ ₹1 crore AND borrowings ≤ ₹1 crore AND revenue ≤ ₹10 crore. Confirm with your CA before selecting Yes/No.</div></div>`
  : fieldYN("6(b)", "Whether CARO (Companies Auditor's Report Order) is applicable?", caroApplicable)
}

${fieldText("6(d)", "*Reporting on Internal Financial Controls", buildIFC(data))}

<div class="pg-ftr">
  Generated by <strong>ComplianceSearch.in</strong> &nbsp;|&nbsp; ${data.companyName} &nbsp;|&nbsp; FY ${fy}<br>
  <span style="font-size:10px">For reference only. Verify all content with your CA/CS before filing on MCA V3 portal. Character limits vary by field — trim text if portal rejects.</span>
</div>

</div>

<script>
function cpField(btn) {
  const field = btn.closest('.field');
  const el = field.querySelector('.fcontent') || field.querySelector('.fval');
  if (!el) return;
  const txt = el.innerText;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(txt).then(() => flashBtn(btn));
  } else {
    const r = document.createRange();
    r.selectNodeContents(el);
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
    document.execCommand('copy');
    flashBtn(btn);
  }
}
function flashBtn(btn) {
  const orig = btn.innerHTML;
  btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
  btn.classList.add('ok');
  setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('ok'); }, 1800);
}
</script>
</body>
</html>`;
}
