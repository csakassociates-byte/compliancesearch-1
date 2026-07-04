/**
 * Form AOC-2 — docx generator
 */

import { AlignmentType, Document, Paragraph, Table } from "docx";
import type { AnnualFilingData, RelatedPartyTransaction } from "../types";
import { fmtDate, fyEndYear } from "../utils";
import {
  MARGIN, PAGE_HEIGHT, PAGE_WIDTH, SZ10, SZ12, SZ9,
  USABLE_WIDTH, blankLine, buildFooter, buildHeader, buildTable,
  h2, h3, p, pr, r, sigParagraphs, toDocxBuffer,
} from "./utils";

export async function buildAOC2Docx(data: AnnualFilingData): Promise<Buffer> {
  const fy = data.financialYear;
  const fyEnd = fyEndYear(fy);
  const txns = data.relatedPartyTransactions || [];

  const sig1 = data.signatoryDirectors.director1;
  const sig2 = data.signatoryDirectors.director2;
  const sig3 = data.signatoryDirectors.director3;
  const reportDate = fmtDate(data.dateOfReport) || "________________";
  const reportPlace = data.placeOfSigning || "________________";
  const sigDirs = [
    { name: sig1.name, designation: sig1.designation, din: sig1.din, base64: sig1.signatureBase64 },
    ...(sig2?.name ? [{ name: sig2.name, designation: sig2.designation, din: sig2.din, base64: sig2.signatureBase64 }] : []),
    ...(sig3?.name ? [{ name: sig3.name, designation: sig3.designation, din: sig3.din, base64: sig3.signatureBase64 }] : []),
  ];

  const nonArmLength = txns.filter(t => !t.isArmLength);
  const material = txns.filter(t => t.isArmLength && t.isMaterial);

  const partAChildren: (Paragraph | Table)[] = [
    h2("Part A"),
    h3("Contracts / Arrangements / Transactions NOT at Arm's Length Basis"),
  ];
  if (nonArmLength.length === 0) {
    partAChildren.push(
      pr([r("NIL", { bold: true, size: SZ12 }), r(` — There were no contracts or arrangements or transactions entered into during the Financial Year ended 31st March, ${fyEnd} which were not at arm's length basis.`, { size: SZ12 })], { after: 120 })
    );
  } else {
    partAChildren.push(
      buildTable(
        ["Name(s) of related party & nature of relationship", "Type of Relationship", "Nature of contracts / arrangements / transactions", "Duration", "Salient terms", "Justification", "Date(s) of approval by the Board", "Amount paid as advances", "Date of special resolution"],
        nonArmLength.map(t => [
          `${t.relatedPartyName}${t.cin ? `\nCIN/PAN: ${t.cin}` : ""}`,
          t.relationship,
          t.natureOfTransaction,
          t.duration || "—",
          t.salientTerms || "—",
          t.justification || "—",
          t.approvalDate ? fmtDate(t.approvalDate) : "—",
          `Rs.${t.amount || "—"}`,
          "—",
        ]),
        [1400, 900, 1100, 750, 1400, 1100, 950, 950, 750],
        { fontSize: SZ9 }
      )
    );
  }

  const partBChildren: (Paragraph | Table)[] = [
    h2("Part B"),
    h3("Material Contracts / Arrangements / Transactions at Arm's Length Basis"),
  ];
  if (material.length === 0) {
    partBChildren.push(
      pr([r("NIL", { bold: true, size: SZ12 }), r(` — There were no material contracts or arrangements or transactions entered into during the Financial Year ended 31st March, ${fyEnd} which are required to be reported under this Part.`, { size: SZ12 })], { after: 120 })
    );
  } else {
    partBChildren.push(
      buildTable(
        ["Name(s) of related party & nature of relationship", "Type of Relationship", "Nature of contracts / arrangements / transactions", "Duration", "Salient terms", "Value of Transaction (Rs.)", "Date(s) of approval by the Board", "Amount paid as advances"],
        material.map(t => [
          `${t.relatedPartyName}${t.cin ? `\nCIN/PAN: ${t.cin}` : ""}`,
          t.relationship,
          t.natureOfTransaction,
          t.duration || "—",
          t.salientTerms || "—",
          `Rs.${t.amount || "—"}`,
          t.boardApprovalDate ? fmtDate(t.boardApprovalDate) : "—",
          "—",
        ]),
        [1550, 950, 1300, 850, 1700, 1000, 1150, 1038],
        { fontSize: SZ9 }
      )
    );
  }

  const children: (Paragraph | Table)[] = [
    new Paragraph({ children: [r(data.companyName.toUpperCase(), { bold: true, size: SZ12 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [r(`CIN: ${data.cin}`, { size: SZ10 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [r("FORM AOC-2", { bold: true, size: SZ12, underline: true })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [r("Form for disclosure of particulars of contracts / arrangements entered into by the Company with related parties referred to in sub-section (1) of Section 188 of the Companies Act, 2013", { size: SZ10 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [r("[Pursuant to clause (h) of sub-section (3) of Section 134 of the Act and Rule 8(2) of the Companies (Accounts) Rules, 2014]", { size: SZ9, italic: true })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [r(`For the Financial Year ended 31st March, ${fyEnd}`, { size: SZ10 })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),

    p(`The following are the details of contracts or arrangements or transactions at arm's length basis and those not at arm's length basis for the Financial Year ${fy}:`),
    blankLine(),

    ...partAChildren,
    blankLine(),
    ...partBChildren,
    blankLine(),

    p("Note: This Form is to be signed by the persons who have signed the Board's Report.", { italic: true }),
    blankLine(),

    pr([r("For and on behalf of the Board of Directors of", { size: SZ12 })], { align: AlignmentType.LEFT, after: 60 }),
    pr([r(data.companyName, { bold: true, size: SZ12 })], { align: AlignmentType.LEFT, after: 120 }),
    ...sigParagraphs(sigDirs, undefined, reportDate, reportPlace),
  ];

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      headers: { default: buildHeader(data.companyName, "Form AOC-2") },
      footers: { default: buildFooter() },
      children,
    }],
  });

  return toDocxBuffer(doc);
}
