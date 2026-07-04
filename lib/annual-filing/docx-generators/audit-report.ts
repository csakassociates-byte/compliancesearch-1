/**
 * Independent Auditor's Report — docx generator
 */

import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Paragraph,
  SectionType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { AnnualFilingData } from "../types";
import { buildDividendText } from "../types";
import type { AuditReportOptions } from "../generators/2025-26/audit-report";
import { fmtDate, fyEndYear } from "../utils";
import {
  FONT,
  MARGIN,
  NO_BORDER,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  SZ10,
  SZ12,
  SZ9,
  USABLE_WIDTH,
  base64ToBuffer,
  blankLine,
  buildAuditFooter,
  buildHeader,
  h2,
  h3,
  p,
  pr,
  r,
  toDocxBuffer,
} from "./utils";

export { AuditReportOptions };

function bulletParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [r(text, { size: SZ12 })],
    bullet: { level: 0 },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 100, before: 0 },
  });
}

function subPara(prefix: string, text: string): Paragraph {
  return pr([r(prefix, { bold: true, size: SZ12 }), r(text, { size: SZ12 })], {
    align: AlignmentType.JUSTIFIED,
    after: 100,
    before: 0,
  });
}

export async function buildAuditReportDocx(
  data: AnnualFilingData,
  opts: AuditReportOptions
): Promise<Buffer> {
  const fy = data.financialYear;
  const fyEnd = fyEndYear(fy);
  const aud = data.auditor;
  const isOPC = data.companyType === "opc";
  const isSection8 = data.companyType === "section8";
  const reportDate = fmtDate(aud.reportDate || data.dateOfReport);
  const bsDate = `March 31, ${fyEnd}`;
  const incl_cf = opts.cashFlowIncluded;

  const plLabel = isSection8
    ? "the Income and Expenditure Account"
    : "the Statement of Profit and Loss";
  const profitWord = isSection8 ? "surplus/deficit" : "profit";

  const fsOpen = incl_cf
    ? `the Balance Sheet as at ${bsDate}, ${plLabel} the year then ended, and the Cash Flow Statement`
    : `the Balance Sheet as at ${bsDate}, ${plLabel} the year then ended`;

  const fsC = incl_cf
    ? `the Balance Sheet, ${plLabel} and the Cash Flow Statement`
    : `the Balance Sheet and ${plLabel}`;

  const isModified = opts.opinionType !== "unmodified";
  let opinionText = "";
  if (opts.opinionType === "unmodified") {
    opinionText = `In our opinion and to the best of our information and according to the explanations given to us, the aforesaid financial statements give the information required by the Act in the manner so required and give a true and fair view in conformity with the accounting principles generally accepted in India, of the state of affairs of the Company at ${bsDate}, and ${profitWord}, for the year ended on that date.`;
  } else if (opts.opinionType === "qualified") {
    opinionText = `In our opinion and to the best of our information and according to the explanations given to us, except for the effects of the matter described in the Basis for Qualified Opinion paragraph above, the aforesaid financial statements give the information required by the Act in the manner so required and give a true and fair view in conformity with the accounting principles generally accepted in India, of the state of affairs of the Company at ${bsDate}, and ${profitWord}, for the year ended on that date.`;
  } else if (opts.opinionType === "adverse") {
    opinionText = `In our opinion and to the best of our information and according to the explanations given to us, because of the significance of the matter described in the Basis for Adverse Opinion paragraph above, the aforesaid financial statements do not give the information required by the Act in the manner so required and do not give a true and fair view in conformity with the accounting principles generally accepted in India, of the state of affairs of the Company at ${bsDate}, and ${profitWord}, for the year ended on that date.`;
  } else {
    opinionText = `Because of the significance of the matter described in the Basis for Disclaimer of Opinion paragraph above, we have not been able to obtain sufficient appropriate audit evidence to provide a basis for an audit opinion. Accordingly, we do not express an opinion on the financial statements.`;
  }

  const basisHeading =
    opts.opinionType === "qualified"
      ? "Basis for Qualified Opinion"
      : opts.opinionType === "adverse"
      ? "Basis for Adverse Opinion"
      : opts.opinionType === "disclaimer"
      ? "Basis for Disclaimer of Opinion"
      : "";

  const auditRemark = isModified
    ? opts.qualificationDetails || "[Insert qualification / disclaimer details]"
    : "There are no qualifications, reservations or adverse remarks or disclaimers.";

  const dividendText = data.dividendDeclared
    ? `v. The Company has declared and/or paid dividend of ${buildDividendText(data)} during the year in compliance with the provisions of Section 123 of the Companies Act, 2013.`
    : `v. No dividend has been declared or paid during the year by the Company.`;

  const auditTrailText = opts.auditTrailCompliant
    ? `vi. Pursuant to Rule 11(g) of the Companies (Audit and Auditors) Rules, 2014, we report that, based on our examination, which included test checks and information provided, the Company utilized ${opts.auditTrailSoftware || "accounting"} software for maintaining its books of account. The software has an audit trail (edit log) feature to record all relevant transactions throughout the year as required by the Proviso to Rule 3(1) of the Companies (Accounts) Rules, 2014. Based on our examination, the audit trail feature was enabled and operated throughout the year for all the relevant transactions recorded in the software.`
    : `vi. Pursuant to Rule 11(g) of the Companies (Audit and Auditors) Rules, 2014, we report that, based on our examination, which included test checks and information provided, the Company utilized accounting software for maintaining its books of account. However, the software lacked an audit trail (edit log) feature to record all relevant transactions throughout the year, as required by the Proviso to Rule 3(1) of the Companies (Accounts) Rules, 2014. Consequently, we are unable to give an opinion on this.`;

  const firmDisplayName = (aud.firmName || "[Firm Name]").replace(/^M\/s\s*/i, "");
  const partnerLabel = aud.firmType === "proprietorship" ? "Proprietor" : "Partner";

  const children: (Paragraph | Table)[] = [
    // Document title
    new Paragraph({
      children: [r("Independent Auditor's Report", { bold: true, size: SZ12, underline: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, before: 0 },
    }),
    // To the Members
    pr([r(`To the ${isOPC ? "Member" : "Members"} of`, { bold: true, size: SZ12 })], {
      align: AlignmentType.LEFT, after: 60,
    }),
    pr([r(data.companyName, { bold: true, size: SZ12 })], {
      align: AlignmentType.LEFT, after: 160,
    }),

    h2("Report on the Financial Statements"),
    p(`We have audited the accompanying standalone financial statements of ${data.companyName} ("the Company") which comprise ${fsOpen}, and notes to the financial statements, including a summary of significant accounting policies and other explanatory information.`),
  ];

  // Modified opinion — basis section first
  if (isModified && basisHeading) {
    children.push(
      h2(basisHeading),
      p(opts.qualificationDetails || "[Insert basis for modification here]")
    );
  }

  children.push(p(opinionText));

  children.push(
    h2("Basis for Opinion"),
    p(`We conducted our audit in accordance with the Standards on Auditing (SAs) specified under section 143(10) of the Companies Act, 2013. Our responsibilities under those Standards are further described in the Auditor's Responsibilities for the Audit of the Financial Statements section of our report. We are independent of the Company in accordance with the Code of Ethics issued by the Institute of Chartered Accountants of India together with the ethical requirements that are relevant to our audit of the financial statements under the provisions of the Companies Act, 2013 and the Rules thereunder, and we have fulfilled our other ethical responsibilities in accordance with these requirements and the Code of Ethics. We believe that the audit evidence we have obtained is sufficient and appropriate to provide a basis for our opinion.`)
  );

  if (opts.emphasisOfMatter) {
    children.push(h2("Emphasis of Matter"), p(opts.emphasisOfMatter));
  }

  children.push(
    h2("Key Audit Matters"),
    p("Key audit matters are those matters that, in our professional judgement, were most significance in our audit of the financial statements of the current period. These matters were addressed in the context of our audit of the financial statement as a whole, and in forming our opinion thereon, and we do not provide a separate opinion on these matters. Reporting of Key audit matters as per SA 701, Key Audit matters are not applicable to the Company since the Company falls under the category of unlisted companies, and as such, the requirement for reporting Key Audit Matters does not apply to it."),

    h2("Information other than the Financial Statements and Auditor's Report thereon"),
    p("The Company's board of directors is responsible for the preparation of the other information. The other information comprises the information included in the Board's Report including Annexures to Board's Report but does not include the financial statements and our auditor's report thereon."),
    p("Our opinion on the financial statements does not cover the other information and we do not express any form of assurance conclusion thereon."),
    p("In connection with our audit of the financial statements, our responsibility is to read the other information and, in doing so, consider whether the other information is materially inconsistent with the financial statements or our knowledge obtained during the course of our audit or otherwise appears to be materially misstated. If, based on the work we have performed, we conclude that there is a material misstatement of this other information, we are required to report that fact. We have nothing to report in this regard."),

    h2("Auditor's remarks"),
    p(auditRemark),

    h2("Responsibilities of Management and Those Charged with Governance for the Standalone Financial Statements"),
    p(`The Company's Board of Directors is responsible for the matters stated in section 134(5) of the Companies Act, 2013 ("the Act") with respect to the preparation of these financial statements that give a true and fair view of the financial position, financial performance${incl_cf ? " and cash flows" : ""} of the Company in accordance with the accounting principles generally accepted in India, including the accounting Standards specified under section 133 of the Act. This responsibility also includes maintenance of adequate accounting records in accordance with the provisions of the Act for safeguarding of the assets of the Company and for preventing and detecting frauds and other irregularities; selection and application of appropriate accounting policies; making judgments and estimates that are reasonable and prudent; and design, implementation and maintenance of adequate internal financial controls, that were operating effectively for ensuring the accuracy and completeness of the accounting records, relevant to the preparation and presentation of the financial statements that give a true and fair view and are free from material misstatement, whether due to fraud or error.`),
    p("In preparing the financial statements, the Board of Directors is responsible for assessing the Company's ability to continue as a going concern, disclosing, as applicable, matters related to going concern and using the going concern basis of accounting unless the Board of Directors either intends to liquidate the Company or to cease operations, or has no realistic alternative but to do so. The Board of Directors are also responsible for overseeing the company's financial reporting process."),

    h2("Auditor's Responsibility for the Audit of the Financial Statements."),
    p("Our objectives are to obtain reasonable assurance about whether the financial statements as a whole are free from material misstatement, whether due to fraud or error, and to issue an auditor's report that includes our opinion. Reasonable assurance is a high level of assurance, but is not a guarantee that an audit conducted in accordance with SAs will always detect a material misstatement when it exists. Misstatements can arise from fraud or error and are considered material if, individually or in the aggregate, they could reasonably be expected to influence the economic decisions of users taken on the basis of these financial statements."),
    p("As part of an audit in accordance with SAs, we exercise professional judgment and maintain professional skepticism throughout the audit. We also:"),
    bulletParagraph("Identify and assess the risks of material misstatement of the standalone Financial Statements, whether due to fraud or error, design and perform audit procedures responsive to those risks, and obtain audit evidence that is sufficient and appropriate to provide a basis for our opinion. The risk of not detecting a material misstatement resulting from fraud is higher than for one resulting from error, as fraud may involve collusion, forgery, intentional omissions, misrepresentations, or the override of internal control."),
    bulletParagraph("Obtain an understanding of internal financial control relevant to the audit in order to design audit procedures that are appropriate in the circumstances. Under section 143(3)(i) of the Act, we are also responsible for expressing our opinion on whether the Company has adequate internal financial controls system in place and the operating effectiveness of such controls."),
    bulletParagraph("Evaluate the appropriateness of accounting policies used and the reasonableness of accounting estimates and related disclosures made by the management and Board of Directors."),
    bulletParagraph("Conclude on the appropriateness of Management and Board of Director's use of the going concern basis of accounting in preparation of the Standalone Financial Statements and, based on the audit evidence obtained, whether a material uncertainty exists related to events or conditions that may cast significant doubt on the Company's ability to continue as a going concern. If we conclude that a material uncertainty exists, we are required to draw attention in our auditor's report to the related disclosures in the standalone Financial Statements or, if such disclosures are inadequate, to modify our opinion. Our conclusions are based on the audit evidence obtained up to the date of our auditor's report. However, future events or conditions may cause the Company to cease to continue as a going concern."),
    bulletParagraph("Evaluate the overall presentation, structure and content of the financial statements, including the disclosures, and whether the financial statements represent the underlying transactions and events in a manner that achieves fair presentation."),
    p("Materiality is the magnitude of misstatements in the standalone financial statements that, individually or in aggregate, makes it probable that the economic decisions of a reasonably knowledgeable user of the standalone financial statements may be influenced. We consider quantitative materiality and qualitative factors in (i) planning the scope of our audit work and in evaluating the results of our work; and (ii) to evaluate the effect of any identified misstatements in the standalone financial statements."),
    p("We communicate with those charged with governance regarding, among other matters, the planned scope and timing of the audit and significant audit findings, including any significant deficiencies in internal control that we identify during our audit."),
    p("We also provide those charged with governance with a statement that we have complied with relevant ethical requirements regarding independence, and to communicate with them all relationships and other matters that may reasonably be thought to bear on our independence, and where applicable, related safeguards."),
    p("From the matters communicated with those charged with governance, we determine those matters that were of most significance in the audit of the financial statements of the current period and are therefore the key audit matters. We describe these matters in our auditor's report unless law or regulation precludes public disclosure about the matter or when, in extremely rare circumstances, we determine that a matter should not be communicated in our report because the adverse consequences of doing so would reasonably be expected to outweigh the public interest benefits of such communication."),

    // Page break before regulatory requirements
    new Paragraph({ children: [], pageBreakBefore: true, spacing: { after: 0, before: 0 } }),
    h2("Report on Other Legal and Regulatory Requirements"),
    p("With respect to the other matters to be included in the Auditor's Report in accordance with Rule 11 of the Companies (Audit and Auditors) Rules, 2014, in our opinion and to the best of our information and according to the explanations given to us:"),
    p("i. The Company does not have any pending litigations which would impact its financial position."),
    p("ii. The Company did not have any long-term contracts including derivative contracts for which there were any material foreseeable losses."),
    p("iii. There were no amounts which were required to be transferred to the Investor Education and Protection Fund by the Company."),
    p(`1. As required by the Companies (Auditor's Report) Order, 2020 ("the Order"), issued by the Central Government of India in terms of sub-section (11) of section 143 of the Companies Act, 2013, is not applicable to the Company since the Company has not exceeded the specified threshold limit and it does not fall into any criteria to be caused application of the Order.`),
    p("2. As required by Section 143 (3) of the Act, we report that:"),
    p("a) We have sought and obtained all the information and explanations which to the best of our knowledge and belief were necessary for the purposes of our audit."),
    p("b) In our opinion, proper books of account as required by law have been kept by the Company so far as it appears from our examination of those books."),
    p(`c) ${fsC} dealt with by this Report are in agreement with the books of account.`),
    p("d)    In our opinion, the aforesaid Standalone Financial Statements comply with the Accounting Standards specified under Section 133 of the Act, read with Rule 7 of the Companies (Accounts) Rules, 2021. and rules made thereunder."),
    p(`e) On the basis of the written representations received from the directors at ${bsDate} taken on record by the Board of Directors, none of the directors is disqualified at ${bsDate} from being appointed as a director in terms of Section 164 (2) of the Act.`),
    p("f) With respect to the adequacy of the internal financial controls over financial reporting of the Company Since the Company's turnover as per last audited financial statements is less than Rs.50 Crores and its borrowings from banks and financial institutions at any time during the year is less than Rs.25 Crores, the Company is exempted from getting an audit opinion with respect to the adequacy of the internal financial controls over financial reporting of the company and the operating effectiveness of such controls vide notification dated June 13, 2017;"),
    p("iv. (a) The management has represented that, to the best of it's knowledge and belief, other than as disclosed in the notes to the accounts, no funds have been advanced or loaned or invested (either from borrowed funds or share premium or any other sources or kind of funds) by the company to or in any other person(s) or entity(ies), including foreign entities (\"Intermediaries\"), with the understanding, whether recorded in writing or otherwise, that the Intermediary shall, whether, directly or indirectly lend or invest in other persons or entities identified in any manner whatsoever by or on behalf of the company (\"Ultimate Beneficiaries\") or provide any guarantee, security or the like on behalf of the Ultimate Beneficiaries;"),
    p("(b) The management has represented, that, to the best of it's knowledge and belief, other than as disclosed in the notes to the accounts, no funds have been received by the company from any person(s) or entity(ies), including foreign entities (\"Funding Parties\"), with the understanding, whether recorded in writing or otherwise, that the company shall, whether, directly or indirectly, lend or invest in other persons or entities identified in any manner whatsoever by or on behalf of the Funding Party (\"Ultimate Beneficiaries\") or provide any guarantee, security or the like on behalf of the Ultimate Beneficiaries; and"),
    p("(c) Based on such audit procedures that have been considered reasonable and appropriate in the circumstances, nothing has come to our notice that has caused us to believe that the representations under sub-clause (i) and (ii) of Rule 11(e), as provided under (a) and (b) above, contain any material misstatement."),
    p(dividendText),
    p(auditTrailText),
    p("g) With respect to the matter to be included in the Auditor's Report under section 197(16), in our opinion and according to the information and explanations given to us, the remuneration paid by the Company to its directors during the current year is in accordance with the provisions of section 197 of the Act. The remuneration paid to any director is not in excess of the limit laid down under section 197 of the Act. The Ministry of Corporate Affairs has not prescribed other details under section 197(16) which are required to be commented upon by us."),

    blankLine(),
    blankLine(),
  );

  // Signature block table — firm (left) and partner (right)
  const leftCells: Paragraph[] = [
    p(`For M/s ${firmDisplayName}`, { align: AlignmentType.LEFT, after: 60 }),
    p("Chartered Accountants", { italic: true, after: 60, align: AlignmentType.LEFT }),
    ...(aud.frn ? [p(`Firm No.: ${aud.frn}`, { italic: true, after: 60, align: AlignmentType.LEFT })] : []),
  ];
  if (aud.sealBase64) {
    try {
      const buf = base64ToBuffer(aud.sealBase64);
      leftCells.push(
        new Paragraph({
          children: [new ImageRun({ data: buf, transformation: { width: 90, height: 60 }, type: "jpg" })],
          spacing: { after: 40, before: 40 },
        })
      );
    } catch {
      leftCells.push(new Paragraph({ children: [r("", { size: SZ12 })], spacing: { before: 120, after: 0 } }));
    }
  } else {
    leftCells.push(new Paragraph({ children: [r("", { size: SZ12 })], spacing: { before: 120, after: 0 } }));
  }

  const rightCells: Paragraph[] = [];
  if (aud.signatureBase64) {
    try {
      const buf = base64ToBuffer(aud.signatureBase64);
      rightCells.push(
        new Paragraph({
          children: [new ImageRun({ data: buf, transformation: { width: 100, height: 40 }, type: "jpg" })],
          spacing: { after: 40, before: 80 },
          alignment: AlignmentType.RIGHT,
        })
      );
    } catch {
      rightCells.push(new Paragraph({ children: [r("", { size: SZ12 })], spacing: { before: 120, after: 0 } }));
    }
  } else {
    rightCells.push(new Paragraph({ children: [r("", { size: SZ12 })], spacing: { before: 120, after: 0 } }));
  }
  rightCells.push(
    p(aud.partnerName || "[Partner Name]", { bold: true, after: 40, align: AlignmentType.RIGHT }),
    p(`(${partnerLabel})`, { after: 40, align: AlignmentType.RIGHT }),
    p(`M. No.: ${aud.membershipNo || "[Membership No.]"}`, { italic: true, after: 40, align: AlignmentType.RIGHT }),
    p(`Date: ${reportDate || "________________"}`, { after: 40, align: AlignmentType.RIGHT }),
    p(`Place: ${aud.place || data.placeOfSigning || "________________"}`, { after: 40, align: AlignmentType.RIGHT }),
    p(`UDIN: ${aud.udin || "[UDIN]"}`, { bold: true, after: 40, align: AlignmentType.RIGHT })
  );

  const halfWidth = Math.floor(USABLE_WIDTH / 2);
  const sigTable = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: leftCells,
            width: { size: halfWidth, type: WidthType.DXA },
            borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
          }),
          new TableCell({
            children: rightCells,
            width: { size: halfWidth, type: WidthType.DXA },
            borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
          }),
        ],
      }),
    ],
    width: { size: USABLE_WIDTH, type: WidthType.DXA },
    borders: {
      top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER,
      right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER,
    },
  });
  children.push(sigTable);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        headers: { default: buildHeader(data.companyName, "Independent Auditor's Report") },
        footers: { default: buildAuditFooter(data.auditor.sealBase64) },
        children,
      },
    ],
  });

  return toDocxBuffer(doc);
}
