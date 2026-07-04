/**
 * Details of Directors — docx generator (Landscape A4)
 */

import { AlignmentType, Document, Paragraph, SectionType, Table, TableCell, TableRow, WidthType } from "docx";
import type { AnnualFilingData } from "../types";
import { fmtDate, fyEndYear, parseIndian } from "../utils";
import {
  FONT, LAND_HEIGHT, LAND_WIDTH, MARGIN, NO_BORDER,
  SZ10, SZ12, SZ9, SZ8,
  blankLine, buildFooter, buildHeader, buildTable,
  h2, p, pr, r, sigParagraphs, toDocxBuffer,
} from "./utils";

export async function buildDirectorListDocx(data: AnnualFilingData): Promise<Buffer> {
  const fy = data.financialYear;
  const fyEnd = fyEndYear(fy);

  const authorisedCapital = data.financials?.authorisedCapital
    ? `Rs.${parseIndian(data.financials.authorisedCapital).toLocaleString("en-IN")}`
    : "—";
  const paidUpCapital = data.financials?.paidUpCapital
    ? `Rs.${parseIndian(data.financials.paidUpCapital).toLocaleString("en-IN")}`
    : "—";

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

  // Landscape usable width = LAND_WIDTH - 2*MARGIN = 16838 - 2268 = 14570 twips
  const LAND_USABLE = LAND_WIDTH - 2 * MARGIN;

  // Capital summary table
  const capTable = new Table({
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            children: [new Paragraph({ children: [r("Authorised Share Capital", { bold: true, size: SZ9 })], alignment: AlignmentType.LEFT, spacing: { after: 40, before: 40 } })],
            width: { size: 3500, type: WidthType.DXA },
            shading: { fill: "F0F0F0" },
          }),
          new TableCell({
            children: [new Paragraph({ children: [r(authorisedCapital, { size: SZ9 })], alignment: AlignmentType.LEFT, spacing: { after: 40, before: 40 } })],
            width: { size: 3500, type: WidthType.DXA },
          }),
          new TableCell({
            children: [new Paragraph({ children: [r("Paid-Up Capital", { bold: true, size: SZ9 })], alignment: AlignmentType.LEFT, spacing: { after: 40, before: 40 } })],
            width: { size: 3500, type: WidthType.DXA },
            shading: { fill: "F0F0F0" },
          }),
          new TableCell({
            children: [new Paragraph({ children: [r(paidUpCapital, { size: SZ9 })], alignment: AlignmentType.LEFT, spacing: { after: 40, before: 40 } })],
            width: { size: 4070, type: WidthType.DXA },
          }),
        ],
      }),
    ],
    width: { size: LAND_USABLE, type: WidthType.DXA },
  });

  // Directors table — 14 columns
  // Total = LAND_USABLE = 14570
  // Columns: SN(400), DIN(700), Name(1200), Nationality(800), FatherName(1200), DOB(900), Designation(1100), Category(900), Occupation(800), Email(1400), Shares(700), ApptDate(900), CessDate(900), Address(1670)
  const dirColWidths = [400, 700, 1200, 800, 1200, 900, 1100, 900, 800, 1400, 700, 900, 900, 1670];

  const dirRows = data.directors.length > 0
    ? data.directors.map((d, i) => [
        String(i + 1),
        d.din || "—",
        d.name,
        d.nationality || "Indian",
        d.fatherName || "—",
        d.dateOfBirth ? fmtDate(d.dateOfBirth) : "—",
        d.designation,
        d.category || "—",
        d.occupation || "—",
        d.email || "—",
        d.sharesHeld !== undefined && d.sharesHeld !== null ? d.sharesHeld.toLocaleString("en-IN") : "—",
        fmtDate(d.dateOfAppointment) || "—",
        d.dateOfCessation ? fmtDate(d.dateOfCessation) : "—",
        d.address || "—",
      ])
    : [["—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"]];

  const dirTable = buildTable(
    ["SN", "DIN", "Name", "Nationality", "Father's Name", "DOB", "Designation", "Category", "Occupation", "Email-Id", "Equity Shares Held", "Date of Appointment", "Date of Ceasing", "Residential Address"],
    dirRows,
    dirColWidths,
    { fontSize: SZ8 }
  );

  const children: (Paragraph | Table)[] = [
    // Header
    new Paragraph({ children: [r(data.companyName.toUpperCase(), { bold: true, size: SZ12 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [r(`CIN: ${data.cin}`, { size: SZ9 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [r(`Registered Office: ${data.regAddress}`, { size: SZ9 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [r("DETAILS OF DIRECTORS", { bold: true, size: SZ12, underline: true })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [r(`As on 31st March, ${fyEnd}  |  Financial Year ${fy}`, { size: SZ9 })], alignment: AlignmentType.CENTER, spacing: { after: 160 } }),

    capTable,
    blankLine(),
    dirTable,
    blankLine(),

    p("I hereby certify that the above information is true and correct to the best of my knowledge and belief.", { size: SZ9 }),
    blankLine(),

    pr([r("For and on behalf of the Board of Directors of", { size: SZ9 })], { align: AlignmentType.LEFT, after: 60 }),
    pr([r(data.companyName, { bold: true, size: SZ9 })], { align: AlignmentType.LEFT, after: 120 }),
    ...sigParagraphs(sigDirs, undefined, reportDate, reportPlace),
  ];

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: LAND_WIDTH, height: LAND_HEIGHT, orientation: "landscape" },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      headers: { default: buildHeader(data.companyName, "Details of Directors") },
      footers: { default: buildFooter() },
      children,
    }],
  });

  return toDocxBuffer(doc);
}
