/**
 * Shareholder / Member List — docx generator
 */

import { AlignmentType, Document, Paragraph, Table } from "docx";
import type { AnnualFilingData, ShareholderRecord } from "../types";
import { fmtDate, fmtIndian, fyEndYear } from "../utils";
import {
  MARGIN, PAGE_HEIGHT, PAGE_WIDTH, SZ10, SZ12, SZ9,
  USABLE_WIDTH, blankLine, buildFooter, buildHeader, buildTable,
  h2, p, pr, r, sigParagraphs, toDocxBuffer,
} from "./utils";

const SHAREHOLDER_TYPE_LABELS: Record<string, string> = {
  resident_individual: "Resident Individual",
  nri: "Non-Resident Indian (NRI)",
  body_corporate: "Body Corporate",
  huf: "Hindu Undivided Family",
  trust: "Trust",
  government: "Government / Government Body",
};

export async function buildShareholderListDocx(data: AnnualFilingData): Promise<Buffer> {
  const fy = data.financialYear;
  const fyEnd = fyEndYear(fy);
  const shareholders = data.shareholders || [];
  const totalShares = data.totalShares || 0;
  const reportDate = fmtDate(data.dateOfReport) || "________________";
  const reportPlace = data.placeOfSigning || "________________";

  const sig1 = data.signatoryDirectors.director1;
  const sig2 = data.signatoryDirectors.director2;
  const sig3 = data.signatoryDirectors.director3;
  const sigDirs = [
    { name: sig1.name, designation: sig1.designation, din: sig1.din, base64: sig1.signatureBase64 },
    ...(sig2?.name ? [{ name: sig2.name, designation: sig2.designation, din: sig2.din, base64: sig2.signatureBase64 }] : []),
    ...(sig3?.name ? [{ name: sig3.name, designation: sig3.designation, din: sig3.din, base64: sig3.signatureBase64 }] : []),
  ];

  // Shareholding pattern
  const groups: Record<string, { count: number; shares: number }> = {};
  shareholders.forEach(s => {
    if (!groups[s.type]) groups[s.type] = { count: 0, shares: 0 };
    groups[s.type].count += 1;
    groups[s.type].shares += s.sharesHeld;
  });
  const patternRows = Object.entries(groups).map(([type, g]) => {
    const pct = totalShares > 0 ? ((g.shares / totalShares) * 100).toFixed(2) : "0.00";
    return [SHAREHOLDER_TYPE_LABELS[type] || type, String(g.count), fmtIndian(g.shares), `${pct}%`];
  });
  patternRows.push(["TOTAL", String(shareholders.length), fmtIndian(totalShares), "100.00%"]);

  const memberRows = shareholders.length > 0
    ? shareholders.map((s, i) => [
        String(i + 1),
        s.folioNo || "—",
        s.name,
        s.pan || "—",
        SHAREHOLDER_TYPE_LABELS[s.type] || s.type,
        fmtIndian(s.sharesHeld),
        `${s.percentHolding}%`,
      ])
    : [["—", "—", "—", "—", "—", "—", "—"]];
  memberRows.push(["", "", "", "", "TOTAL", fmtIndian(totalShares), "100.00%"]);

  const children: (Paragraph | Table)[] = [
    new Paragraph({ children: [r(data.companyName.toUpperCase(), { bold: true, size: SZ12 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [r(`CIN: ${data.cin}`, { size: SZ10 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [r(`Registered Office: ${data.regAddress}`, { size: SZ10 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [r("LIST OF SHAREHOLDERS / MEMBERS", { bold: true, size: SZ12, underline: true })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [r(`As on 31st March, ${fyEnd}`, { size: SZ10 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [r(`(For the Financial Year ${fy})`, { size: SZ10 })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),

    h2("Capital Summary"),
    buildTable(
      ["Particulars", "Details"],
      [
        ["Authorised Share Capital", `Rs.${data.financials.authorisedCapital || "—"}`],
        ["Paid-up Share Capital", `Rs.${data.financials.paidUpCapital || "—"}`],
        ["Nominal Value per Share", `Rs.${data.nominalValuePerShare || "10"} per share`],
        ["Total Number of Shares", fmtIndian(totalShares)],
        ["Total Number of Shareholders / Members", String(shareholders.length)],
      ],
      [6000, 3638], { fontSize: SZ10 }
    ),
    blankLine(),

    h2(`Shareholding Pattern as on 31st March, ${fyEnd}`),
    buildTable(
      ["Category of Shareholder", "No. of Shareholders", "No. of Shares Held", "% of Total Shareholding"],
      patternRows,
      [4400, 1500, 2000, 1738], { fontSize: SZ10 }
    ),
    blankLine(),

    // Page break before register
    new Paragraph({ children: [], pageBreakBefore: true, spacing: { after: 0, before: 0 } }),
    h2(`Register of Members as on 31st March, ${fyEnd}`),
    buildTable(
      ["Sl.", "Folio No.", "Name of Shareholder", "PAN", "Category", "No. of Shares", "% Holding"],
      memberRows,
      [400, 1000, 2700, 1200, 1800, 1400, 1138], { fontSize: SZ10 }
    ),
    blankLine(),

    h2("Notes"),
    p(`1. This list is prepared as on 31st March, ${fyEnd} (close of the Financial Year ${fy}).`),
    p("2. The information is based on the Register of Members maintained by the Company under Section 88 of the Companies Act, 2013."),
    p(`3. Shares are fully paid-up equity shares of Rs.${data.nominalValuePerShare || "10"} each unless otherwise stated.`),
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
      headers: { default: buildHeader(data.companyName, "List of Shareholders / Members") },
      footers: { default: buildFooter() },
      children,
    }],
  });

  return toDocxBuffer(doc);
}
