/**
 * MGT-7 / MGT-7A CTC — Extract of Board Resolution — docx generator
 */

import { AlignmentType, Document, ImageRun, Paragraph, Table, TableCell, TableRow, WidthType, BorderStyle } from "docx";
import type { AnnualFilingData } from "../types";
import { fmtDate } from "../utils";
import {
  FONT, MARGIN, NO_BORDER, PAGE_HEIGHT, PAGE_WIDTH,
  SZ10, SZ12, SZ9, USABLE_WIDTH,
  base64ToBuffer, blankLine, buildFooter, buildHeader,
  p, pr, r, sigParagraphs, toDocxBuffer,
} from "./utils";

export async function buildMGT7CTCDocx(data: AnnualFilingData): Promise<Buffer> {
  const meetingDate = fmtDate(data.dateOfReport) || "________________";
  const meetingTime = data.mgt7MeetingTime || "11.00 A.M.";
  const meetingVenue = data.mgt7MeetingVenue || "Registered Office of the Company";

  const dir1 = data.signatoryDirectors.director1;
  const dir2 = data.signatoryDirectors.director2;
  const dir3 = data.signatoryDirectors.director3;

  const designatedNames = [dir1.name, dir2?.name, dir3?.name].filter(Boolean) as string[];
  const designatedPersons = designatedNames.length > 0 ? designatedNames.join(" AND ") : "________________";
  const personWord = designatedNames.length > 1 ? "Persons" : "Person";
  const directorWord = designatedNames.length > 1 ? "Directors" : "Director";

  const isDefaultVenue = !data.mgt7MeetingVenue || data.mgt7MeetingVenue.toLowerCase().includes("registered office");
  const venueTitleLine = isDefaultVenue
    ? `AT THE REGISTERED OFFICE OF THE COMPANY SITUATED AT ${data.regAddress}`
    : `AT ${meetingVenue.toUpperCase()}`;

  const sigDirs = [
    { name: dir1.name, designation: dir1.designation, din: dir1.din, base64: dir1.signatureBase64 },
    ...(dir2?.name ? [{ name: dir2.name, designation: dir2.designation, din: dir2.din, base64: dir2.signatureBase64 }] : []),
    ...(dir3?.name ? [{ name: dir3.name, designation: dir3.designation, din: dir3.din, base64: dir3.signatureBase64 }] : []),
  ];

  const hrParagraph = new Paragraph({
    children: [r("", { size: SZ12 })],
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: "333333" },
    },
    spacing: { after: 160, before: 80 },
  });

  const children: (Paragraph | Table)[] = [
    // Company header
    new Paragraph({ children: [r(data.companyName.toUpperCase(), { bold: true, size: SZ12 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [r(`Registered Address: ${data.regAddress}`, { size: SZ10 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [r(`CIN: ${data.cin}`, { size: SZ10 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    ...(data.companyEmail ? [new Paragraph({ children: [r(`Email: ${data.companyEmail}${data.companyPhone ? `   Contact No: ${data.companyPhone}` : ""}`, { size: SZ10 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } })] : []),

    hrParagraph,

    // Resolution title
    new Paragraph({
      children: [
        r(`EXTRACT OF RESOLUTION PASSED IN THE BOARD MEETING OF ${data.companyName.toUpperCase()} HELD ON ${meetingDate} AT ${meetingTime} ${venueTitleLine}`, { bold: true, size: SZ12 })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 160, before: 80 },
    }),

    new Paragraph({
      children: [r("", { size: SZ12 })],
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: "333333" } },
      spacing: { after: 160, before: 0 },
    }),

    // Subject
    new Paragraph({
      children: [r(`Appointment of Designated ${personWord} to furnish information to Registrar of Companies with respect to Beneficial Interests in the Shares of the Company pursuant to Rule 9 of the Companies (Management and Administration) Rules, 2014.`, { bold: true, size: SZ12 })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 160, before: 80 },
    }),

    // Resolution body
    p(`"RESOLVED THAT pursuant to Rule 9 of the Companies (Management and Administration) Rules, 2014 read with the provisions of Section 89 and 90 of the Companies Act, 2013 and such other applicable provisions of the Companies Act, 2013 and Rules made thereunder;`),

    pr([
      r(`The Board of Directors does hereby appoint `, { size: SZ12 }),
      r(designatedPersons, { bold: true, size: SZ12 }),
      r(` as ${directorWord} of the Company as the Designated ${personWord} for furnishing information to the Registrar of Companies or any such other Authority with respect to beneficial interests in the shares of the Company."`, { size: SZ12 }),
    ], { after: 160 }),

    // Authority line
    blankLine(),
    p("For and on the behalf of the Board", { align: AlignmentType.LEFT }),
    pr([r("FOR:- ", { size: SZ12 }), r(data.companyName.toUpperCase(), { size: SZ12 })], { align: AlignmentType.LEFT, after: 120 }),

    // Signature block
    ...sigParagraphs(sigDirs, undefined, fmtDate(data.dateOfReport) || "________________", data.placeOfSigning || "________________"),
  ];

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      headers: { default: buildHeader(data.companyName, "MGT-7 CTC — Board Resolution") },
      footers: { default: buildFooter() },
      children,
    }],
  });

  return toDocxBuffer(doc);
}
