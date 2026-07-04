/**
 * Shared helpers for docx library document generation
 * Uses docx ^9.7.1
 */

import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  ImageRun,
  PageNumber,
  Packer,
  PageBreak,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  UnderlineType,
  WidthType,
  HeadingLevel,
  ShadingType,
  convertInchesToTwip,
} from "docx";
import type { AnnualFilingData } from "../types";

// ── A4 page constants (twips) ─────────────────────────────────────────────────
export const PAGE_WIDTH  = 11906;
export const PAGE_HEIGHT = 16838;
export const MARGIN      = 1134; // ~20mm
export const USABLE_WIDTH = PAGE_WIDTH - 2 * MARGIN; // 9638

// A4 Landscape
export const LAND_WIDTH  = 16838;
export const LAND_HEIGHT = 11906;

// ── Typography ────────────────────────────────────────────────────────────────
export const FONT = "Times New Roman";
export const SZ12 = 24; // 12pt in half-points
export const SZ11 = 22;
export const SZ10 = 20;
export const SZ9  = 18;
export const SZ8  = 16;

// ── Border helpers ────────────────────────────────────────────────────────────
export const THIN_BORDER = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: "444444",
};

export const NO_BORDER = {
  style: BorderStyle.NONE,
  size: 0,
  color: "FFFFFF",
};

// ── TextRun helper ────────────────────────────────────────────────────────────
export function r(
  text: string,
  opts?: {
    bold?: boolean;
    italic?: boolean;
    size?: number;
    break?: boolean;
    underline?: boolean;
  }
): TextRun {
  return new TextRun({
    text,
    font: FONT,
    bold: opts?.bold,
    italics: opts?.italic,
    size: opts?.size ?? SZ12,
    underline: opts?.underline ? { type: UnderlineType.SINGLE } : undefined,
    break: opts?.break ? 1 : undefined,
  });
}

// ── Paragraph helper (single TextRun) ─────────────────────────────────────────
export function p(
  text: string,
  opts?: {
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    after?: number;
    before?: number;
    pageBreak?: boolean;
    size?: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    indent?: number;
  }
): Paragraph {
  return new Paragraph({
    children: [
      ...(opts?.pageBreak ? [new PageBreak()] : []),
      r(text, {
        bold: opts?.bold,
        italic: opts?.italic,
        size: opts?.size,
        underline: opts?.underline,
      }),
    ],
    alignment: opts?.align ?? AlignmentType.JUSTIFIED,
    spacing: {
      after: opts?.after ?? 120,
      before: opts?.before ?? 0,
    },
    indent: opts?.indent ? { left: opts.indent } : undefined,
  });
}

// ── Multi-run Paragraph helper ────────────────────────────────────────────────
export function pr(
  runs: TextRun[],
  opts?: {
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    after?: number;
    before?: number;
    pageBreak?: boolean;
    indent?: number;
  }
): Paragraph {
  return new Paragraph({
    children: [
      ...(opts?.pageBreak ? [new PageBreak()] : []),
      ...runs,
    ],
    alignment: opts?.align ?? AlignmentType.JUSTIFIED,
    spacing: {
      after: opts?.after ?? 120,
      before: opts?.before ?? 0,
    },
    indent: opts?.indent ? { left: opts.indent } : undefined,
  });
}

// ── Heading helpers ───────────────────────────────────────────────────────────
export function h2(text: string): Paragraph {
  return new Paragraph({
    children: [
      r(text, { bold: true, size: SZ12, underline: true }),
    ],
    alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 120 },
  });
}

export function h3(text: string): Paragraph {
  return new Paragraph({
    children: [r(text, { bold: true, size: SZ12 })],
    alignment: AlignmentType.LEFT,
    spacing: { before: 120, after: 80 },
  });
}

export function blankLine(): Paragraph {
  return new Paragraph({
    children: [r("")],
    spacing: { after: 0, before: 0 },
  });
}

export function pageBreak(): Paragraph {
  return new Paragraph({
    children: [new PageBreak()],
    spacing: { after: 0, before: 0 },
  });
}

// ── Table builder ─────────────────────────────────────────────────────────────
export function buildTable(
  headers: string[],
  rows: (string | Paragraph)[][],
  colWidths: number[],
  opts?: {
    fontSize?: number;
    headerShade?: string;
    borderColor?: string;
  }
): Table {
  const fontSize = opts?.fontSize ?? SZ10;
  const headerShade = opts?.headerShade ?? "F0F0F0";
  const borderColor = opts?.borderColor ?? "444444";

  const border = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: borderColor,
  };

  const allBorders = {
    top: border,
    bottom: border,
    left: border,
    right: border,
    insideHorizontal: border,
    insideVertical: border,
  };

  const headerRow = new TableRow({
    children: headers.map((h, i) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [r(h, { bold: true, size: fontSize })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60, before: 60 },
          }),
        ],
        width: { size: colWidths[i], type: WidthType.DXA },
        shading: { fill: headerShade, type: ShadingType.CLEAR, color: "auto" },
        borders: allBorders,
      })
    ),
    tableHeader: true,
  });

  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map((cell, i) =>
          new TableCell({
            children:
              typeof cell === "string"
                ? [
                    new Paragraph({
                      children: [r(cell, { size: fontSize })],
                      alignment: AlignmentType.LEFT,
                      spacing: { after: 60, before: 60 },
                    }),
                  ]
                : [cell],
            width: { size: colWidths[i], type: WidthType.DXA },
            borders: allBorders,
          })
        ),
      })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: colWidths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
  });
}

// ── Header builder ────────────────────────────────────────────────────────────
export function buildHeader(companyName: string, docTitle: string): Header {
  return new Header({
    children: [
      new Paragraph({
        children: [r(companyName, { bold: true, size: SZ10 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 4, color: "888888" },
        },
      }),
      new Paragraph({
        children: [r(docTitle, { size: SZ9 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 0 },
      }),
    ],
  });
}

// ── Footer with page numbers ──────────────────────────────────────────────────
export function buildFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        children: [
          r("Page ", { size: SZ9 }),
          new TextRun({
            children: [PageNumber.CURRENT],
            font: FONT,
            size: SZ9,
          }),
          r(" of ", { size: SZ9 }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            font: FONT,
            size: SZ9,
          }),
        ],
        alignment: AlignmentType.CENTER,
        border: {
          top: { style: BorderStyle.SINGLE, size: 4, color: "888888" },
        },
        spacing: { before: 60, after: 0 },
      }),
    ],
  });
}

// ── Company header block ──────────────────────────────────────────────────────
export function companyHeader(
  data: AnnualFilingData,
  docTitle: string,
  subtitle?: string
): Paragraph[] {
  const paras: Paragraph[] = [
    new Paragraph({
      children: [r(data.companyName.toUpperCase(), { bold: true, size: SZ12 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [r(`CIN: ${data.cin || ""}`, { size: SZ10 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
  ];
  if (data.regAddress) {
    paras.push(
      new Paragraph({
        children: [r(data.regAddress, { size: SZ10 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      })
    );
  }
  paras.push(
    new Paragraph({
      children: [r(docTitle, { bold: true, size: SZ12, underline: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    })
  );
  if (subtitle) {
    paras.push(
      new Paragraph({
        children: [r(subtitle, { size: SZ10 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      })
    );
  }
  return paras;
}

// ── Signature block ───────────────────────────────────────────────────────────
export function sigParagraphs(
  dirs: Array<{
    name: string;
    designation: string;
    din: string;
    base64?: string;
  }>,
  aud?: {
    firmName?: string;
    frn?: string;
    partnerName?: string;
    membershipNo?: string;
    partnerLabel?: string;
    udin?: string;
    base64?: string;
    sealBase64?: string;
  },
  date?: string,
  place?: string
): Paragraph[] {
  const paras: Paragraph[] = [];

  paras.push(blankLine());
  paras.push(blankLine());

  // Build columns: auditor on left, directors on right (or just directors)
  const colCount = (aud ? 1 : 0) + dirs.length;
  const colWidth = Math.floor(USABLE_WIDTH / Math.max(colCount, 1));

  const cells: TableCell[] = [];

  if (aud) {
    const audChildren: Paragraph[] = [];
    const audFirmName = aud.firmName
      ? `For M/s ${aud.firmName.replace(/^M\/s\s*/i, "")}`
      : "For [Firm Name]";
    audChildren.push(
      p(audFirmName, { align: AlignmentType.LEFT, after: 60 }),
      p("Chartered Accountants", { align: AlignmentType.LEFT, italic: true, after: 60 })
    );
    if (aud.frn) {
      audChildren.push(p(`Firm No.: ${aud.frn}`, { align: AlignmentType.LEFT, after: 60 }));
    }
    if (aud.sealBase64) {
      try {
        const buf = base64ToBuffer(aud.sealBase64);
        audChildren.push(
          new Paragraph({
            children: [new ImageRun({ data: buf, transformation: { width: 90, height: 60 }, type: "jpg" })],
            spacing: { after: 40, before: 40 },
          })
        );
      } catch {}
    } else {
      audChildren.push(new Paragraph({ children: [r("", { size: SZ12 })], spacing: { before: 120, after: 0 } }));
      audChildren.push(new Paragraph({ children: [r("", { size: SZ12 })], spacing: { before: 120, after: 0 } }));
    }
    if (aud.base64) {
      try {
        const buf = base64ToBuffer(aud.base64);
        audChildren.push(
          new Paragraph({
            children: [new ImageRun({ data: buf, transformation: { width: 100, height: 40 }, type: "jpg" })],
            spacing: { after: 40, before: 40 },
          })
        );
      } catch {}
    }
    const partnerLabel = aud.partnerLabel ?? "Partner";
    audChildren.push(
      p(`${aud.partnerName || "[Partner Name]"}`, { bold: true, after: 40, align: AlignmentType.LEFT }),
      p(`(${partnerLabel})`, { after: 40, align: AlignmentType.LEFT }),
      p(`M. No.: ${aud.membershipNo || "[M.No.]"}`, { after: 40, align: AlignmentType.LEFT }),
      p(`UDIN: ${aud.udin || "[UDIN]"}`, { after: 40, align: AlignmentType.LEFT })
    );
    cells.push(
      new TableCell({
        children: audChildren,
        width: { size: colWidth, type: WidthType.DXA },
        borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
      })
    );
  }

  for (const dir of dirs) {
    const dirChildren: Paragraph[] = [];
    if (dir.base64) {
      try {
        const buf = base64ToBuffer(dir.base64);
        dirChildren.push(
          new Paragraph({
            children: [new ImageRun({ data: buf, transformation: { width: 100, height: 40 }, type: "jpg" })],
            spacing: { after: 40, before: 100 },
          })
        );
      } catch {
        dirChildren.push(new Paragraph({ children: [r("", { size: SZ12 })], spacing: { before: 140, after: 0 } }));
      }
    } else {
      dirChildren.push(new Paragraph({ children: [r("", { size: SZ12 })], spacing: { before: 140, after: 0 } }));
    }
    dirChildren.push(
      p(dir.name || "________________", { bold: true, after: 40, align: AlignmentType.LEFT }),
      p(dir.designation || "Director", { after: 40, align: AlignmentType.LEFT }),
      p(`DIN: ${dir.din || "________________"}`, { after: 40, align: AlignmentType.LEFT })
    );
    cells.push(
      new TableCell({
        children: dirChildren,
        width: { size: colWidth, type: WidthType.DXA },
        borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
      })
    );
  }

  if (cells.length > 0) {
    paras.push(
      new Paragraph({
        children: [r("", { size: SZ12 })],
        spacing: { before: 0, after: 60 },
      })
    );
    const table = new Table({
      rows: [new TableRow({ children: cells })],
      width: { size: USABLE_WIDTH, type: WidthType.DXA },
      borders: {
        top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER,
        right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER,
      },
    });
    // We can't push a Table to paras directly, so wrap it: return mixed
    // Instead we return it via a special wrapper — use a cast trick
    (paras as unknown[]).push(table);
  }

  paras.push(blankLine());
  if (place || date) {
    paras.push(
      pr([
        r(`Place: ${place || "________________"}`, { size: SZ12 }),
        r("          ", { size: SZ12 }),
        r(`Date: ${date || "________________"}`, { size: SZ12 }),
      ], { align: AlignmentType.LEFT, after: 60 })
    );
  }

  return paras;
}

// ── Footer with running director authorization (for board reports) ────────────
export function buildFooterWithDirectors(
  dirs: Array<{ name: string; designation: string; din: string }>,
  companyName: string
): Footer {
  const dirText = dirs.map(d => d.name).join("   |   ");
  const desigText = dirs.map(d => d.designation).join("   |   ");
  const dinText = dirs.map(d => `DIN: ${d.din || "N/A"}`).join("   |   ");

  const dirCol = new TableCell({
    children: [
      new Paragraph({
        children: [r(`For and on behalf of the Board of Directors of ${companyName}`, { size: SZ9 })],
        alignment: AlignmentType.LEFT,
        spacing: { after: 30, before: 30 },
      }),
      new Paragraph({
        children: [r(dirText, { bold: true, size: SZ9 })],
        alignment: AlignmentType.LEFT,
        spacing: { after: 20, before: 0 },
      }),
      new Paragraph({
        children: [r(desigText, { size: SZ9 })],
        alignment: AlignmentType.LEFT,
        spacing: { after: 20, before: 0 },
      }),
      new Paragraph({
        children: [r(dinText, { size: SZ9 })],
        alignment: AlignmentType.LEFT,
        spacing: { after: 0, before: 0 },
      }),
    ],
    width: { size: USABLE_WIDTH - 1200, type: WidthType.DXA },
    borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
  });

  const pageCol = new TableCell({
    children: [
      new Paragraph({
        children: [
          r("Page ", { size: SZ9 }),
          new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: SZ9 }),
          r(" of ", { size: SZ9 }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: SZ9 }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 0, before: 30 },
      }),
    ],
    width: { size: 1200, type: WidthType.DXA },
    borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
  });

  const table = new Table({
    rows: [new TableRow({ children: [dirCol, pageCol] })],
    width: { size: USABLE_WIDTH, type: WidthType.DXA },
    borders: {
      top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER,
      right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER,
    },
  });

  return new Footer({
    children: [
      new Paragraph({
        children: [r("", { size: SZ9 })],
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: "888888" } },
        spacing: { before: 40, after: 40 },
      }),
      table,
    ],
  });
}

// ── Base64 to Buffer ──────────────────────────────────────────────────────────
export function base64ToBuffer(b64: string): Buffer {
  // Strip data URI prefix if present
  const cleaned = b64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
  return Buffer.from(cleaned, "base64");
}

// ── Pack document to buffer ───────────────────────────────────────────────────
export async function toDocxBuffer(doc: Document): Promise<Buffer> {
  return Packer.toBuffer(doc);
}
