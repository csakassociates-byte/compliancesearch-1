/**
 * Form AOC-1 — docx generator
 */

import { AlignmentType, Document, Paragraph, Table } from "docx";
import type { AnnualFilingData, SubsidiaryRecord } from "../types";
import { fmtDate, fyEndYear } from "../utils";
import {
  MARGIN, PAGE_HEIGHT, PAGE_WIDTH, SZ10, SZ12, SZ9,
  blankLine, buildFooter, buildHeader, buildTable,
  h2, h3, p, pr, r, sigParagraphs, toDocxBuffer,
} from "./utils";

export async function buildAOC1Docx(data: AnnualFilingData): Promise<Buffer> {
  const fy = data.financialYear;
  const fyEnd = fyEndYear(fy);
  const subsidiaries = data.subsidiaries || [];

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

  const subs = subsidiaries.filter(s => s.type === "subsidiary");
  const assocJV = subsidiaries.filter(s => s.type === "associate" || s.type === "joint_venture");

  const partAChildren: (Paragraph | Table)[] = [
    h2("Part A — Subsidiaries"),
  ];
  if (subs.length === 0) {
    partAChildren.push(p(`The Company does not have any subsidiary as on 31st March, ${fyEnd}. Hence, Part A is not applicable.`));
  } else {
    partAChildren.push(p("(Amount in Rs. unless otherwise stated)"));
    partAChildren.push(
      buildTable(
        ["Sl.", "Name of Subsidiary", "CIN / LLPIN", "Reporting Period", "Currency", "Exchange Rate", "Share Capital", "Reserves & Surplus", "Total Assets", "Total Liabilities", "Investments", "Turnover", "PBT", "Provision for Tax", "PAT", "Proposed Dividend", "% Shareholding"],
        subs.map((s, i) => [
          String(i + 1),
          s.name,
          s.cin || "—",
          s.reportingPeriod || `01/04/${Number(fyEnd) - 1} to 31/03/${fyEnd}`,
          s.currency || "INR",
          s.exchangeRate || "1",
          s.shareCapital || "—",
          s.reservesSurplus || "—",
          s.totalAssets || "—",
          s.totalLiabilities || "—",
          s.investments || "—",
          s.turnover || "—",
          s.profitBeforeTax || "—",
          s.provisionForTax || "—",
          s.profitAfterTax || "—",
          s.proposedDividend || "—",
          `${s.percentShareholding || "—"}%`,
        ]),
        [300, 1200, 900, 950, 450, 550, 650, 700, 650, 700, 550, 600, 500, 600, 500, 700, 500],
        { fontSize: SZ9 }
      )
    );
    partAChildren.push(blankLine());
    partAChildren.push(p("Notes:", { italic: true, bold: true }));
    partAChildren.push(p("1. Names of subsidiaries which are yet to commence operations: Nil (unless stated separately)."));
    partAChildren.push(p("2. Names of subsidiaries which have been liquidated or sold during the year: Nil (unless stated separately)."));
  }

  const partBChildren: (Paragraph | Table)[] = [
    h2("Part B — Associates and Joint Ventures"),
  ];
  if (assocJV.length === 0) {
    partBChildren.push(p(`The Company does not have any associate company or joint venture as on 31st March, ${fyEnd}. Hence, Part B is not applicable.`));
  } else {
    partBChildren.push(p("Statement pursuant to Section 129(3) of the Companies Act, 2013 related to Associate Companies and Joint Ventures", { italic: true }));
    partBChildren.push(p("(Amount in Rs. unless otherwise stated)", { italic: true }));
    partBChildren.push(
      buildTable(
        ["Sl.", "Name of Associate / JV", "CIN / LLPIN", "Type", "Reporting Period", "Extent of Holding (%)", "Net Worth Attributable to Shareholding", "Profit / Loss for the year (Total)", "Profit / Loss Considered in Consolidation", "Proposed Dividend"],
        assocJV.map((s, i) => [
          String(i + 1),
          s.name,
          s.cin || "—",
          s.type === "joint_venture" ? "Joint Venture" : "Associate",
          s.reportingPeriod || `01/04/${Number(fyEnd) - 1} to 31/03/${fyEnd}`,
          `${s.percentShareholding || "—"}%`,
          s.netWorthAttributable || s.reservesSurplus || "—",
          s.profitAfterTax || "—",
          s.profitConsideredInConsolidation || s.profitAfterTax || "—",
          s.proposedDividend || "—",
        ]),
        [400, 1700, 1100, 900, 1150, 900, 1100, 900, 950, 1100],
        { fontSize: SZ9 }
      )
    );
    partBChildren.push(blankLine());
    partBChildren.push(p("Notes:", { italic: true, bold: true }));
    partBChildren.push(p("1. Names of associates or joint ventures which are yet to commence operations: Nil (unless stated separately)."));
    partBChildren.push(p("2. Names of associates or joint ventures which have been liquidated or sold during the year: Nil (unless stated separately)."));
  }

  const children: (Paragraph | Table)[] = [
    new Paragraph({ children: [r(data.companyName.toUpperCase(), { bold: true, size: SZ12 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [r(`CIN: ${data.cin}`, { size: SZ10 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [r("FORM AOC-1", { bold: true, size: SZ12, underline: true })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [r("Statement containing salient features of the financial statement of subsidiaries / associate companies / joint ventures", { size: SZ10 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [r("[Pursuant to first proviso to sub-section (3) of Section 129 read with Rule 5 of Companies (Accounts) Rules, 2014]", { size: SZ9, italic: true })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [r(`For the Financial Year ended 31st March, ${fyEnd}`, { size: SZ10 })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),

    ...partAChildren,
    blankLine(),
    ...partBChildren,
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
      headers: { default: buildHeader(data.companyName, "Form AOC-1") },
      footers: { default: buildFooter() },
      children,
    }],
  });

  return toDocxBuffer(doc);
}
