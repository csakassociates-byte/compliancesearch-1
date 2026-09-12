import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

// ── Field definitions ─────────────────────────────────────────────────────────
const FIELD_DEFS = [
  { patterns: [/revenue from operation/i, /net revenue/i, /net sales/i, /income from operation/i, /turnover/i, /sales.*revenue/i], fKey: "revenueFromOperations", prevKey: "prevRevenueFromOperations", label: "Revenue from Operations" },
  { patterns: [/other income/i], fKey: "otherIncome", prevKey: "prevOtherIncome", label: "Other Income" },
  { patterns: [/total expenses/i, /total cost/i, /total expenditure/i, /cost of.*production/i, /cost of sales/i, /total.*expense/i], fKey: "totalExpenses", prevKey: "prevTotalExpenses", label: "Total Expenses" },
  { patterns: [/current tax/i, /income tax.*current/i, /current.*income tax/i, /^income tax$/i, /tax.*for.*year/i, /provision.*tax/i], fKey: "currentTax", prevKey: "prevCurrentTax", label: "Current Tax" },
  { patterns: [/deferred tax/i], fKey: "deferredTax", prevKey: "prevDeferredTax", label: "Deferred Tax" },
  { patterns: [/authoris[ae]d.*capital/i, /authoris[ae]d.*share/i, /^authoris[ae]d$/i], fKey: "authorisedCapital", prevKey: "prevAuthorisedCapital", label: "Authorised Share Capital" },
  { patterns: [/paid.?up.*capital/i, /subscribed.*paid/i, /paid.?up.*share/i, /called.?up.*paid/i], fKey: "paidUpCapital", prevKey: "prevPaidUpCapital", label: "Paid-up Share Capital" },
  { patterns: [/reserves.*surplus/i, /reserves.*and.*surplus/i, /other.*equity/i, /retained.*earning/i, /surplus.*reserve/i], fKey: "reservesAndSurplus", prevKey: "prevReservesAndSurplus", label: "Reserves & Surplus" },
  { patterns: [/total assets/i], fKey: "totalAssets", prevKey: "prevTotalAssets", label: "Total Assets" },
  { patterns: [/total liabilit/i, /^liabilit.*total/i, /total.*liabilit/i], fKey: "totalLiabilities", prevKey: "prevTotalLiabilities", label: "Total Liabilities" },
];

// ── Indian number format parsing ──────────────────────────────────────────────
// Handles: 3,00,000 | (2,45,123) | 45,67,890.50 | -12,34,567
function parseIndianAmounts(text: string): number[] {
  const results: number[] = [];
  // Match optional leading minus or open paren, then digits+commas+optional decimal, optional close paren
  const pattern = /(\(|\-)?(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)(\))?/g;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    const numStr = m[2].replace(/,/g, "");
    const val = parseFloat(numStr);
    if (isNaN(val) || val === 0) continue;
    // Negative if wrapped in parens or preceded by minus
    const negative = (m[1] === "(" && m[3] === ")") || m[1] === "-";
    results.push(negative ? -val : val);
  }
  return results;
}

type ExtractedField = {
  label: string;
  fKey: string;
  prevKey: string;
  currentValue: number | null;
  prevValue: number | null;
  found: boolean;
};

// ── Extract fields from raw text (works for PDF & Excel-as-text) ──────────────
function extractFieldsFromText(text: string): ExtractedField[] {
  const lines = text.split(/\r?\n/);

  return FIELD_DEFS.map(fd => {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const labelMatch = fd.patterns.some(p => p.test(line));
      if (!labelMatch) continue;

      // Gather numbers from this line and the next 2 lines (some PDFs split label and values)
      const searchText = [line, lines[i + 1] ?? "", lines[i + 2] ?? ""].join(" ");
      const amounts = parseIndianAmounts(searchText);

      // Filter out likely year numbers (1900–2100) and small note numbers (1–99)
      const validAmounts = amounts.filter(n => Math.abs(n) >= 100);

      if (validAmounts.length >= 2) {
        return { label: fd.label, fKey: fd.fKey, prevKey: fd.prevKey, currentValue: validAmounts[0], prevValue: validAmounts[1], found: true };
      }
      if (validAmounts.length === 1) {
        return { label: fd.label, fKey: fd.fKey, prevKey: fd.prevKey, currentValue: validAmounts[0], prevValue: null, found: true };
      }
    }
    return { label: fd.label, fKey: fd.fKey, prevKey: fd.prevKey, currentValue: null, prevValue: null, found: false };
  });
}

// ── Extract fields from Excel workbook ────────────────────────────────────────
function extractFieldsFromWorkbook(workbook: XLSX.WorkBook): ExtractedField[] {
  type CellEntry = { row: number; col: number; text: string; num: number | null; sheet: string };
  const allCells: CellEntry[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const ref = sheet["!ref"] ?? "A1:A1";
    const range = XLSX.utils.decode_range(ref);
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = sheet[addr];
        if (!cell) continue;
        const text = String(cell.v ?? "").trim();
        const num  = typeof cell.v === "number" ? cell.v : null;
        if (text) allCells.push({ row: r, col: c, text, num, sheet: sheetName });
      }
    }
  }

  return FIELD_DEFS.map(fd => {
    for (const cell of allCells) {
      const labelMatch = fd.patterns.some(p => p.test(cell.text));
      if (!labelMatch) continue;

      const sameRow = allCells
        .filter(c => c.row === cell.row && c.sheet === cell.sheet && c.col > cell.col && c.num !== null)
        .sort((a, b) => a.col - b.col);

      const amounts = sameRow.filter(c => Math.abs(c.num!) >= 100);

      if (amounts.length >= 2) {
        return { label: fd.label, fKey: fd.fKey, prevKey: fd.prevKey, currentValue: amounts[0].num, prevValue: amounts[1].num, found: true };
      }
      if (amounts.length === 1) {
        return { label: fd.label, fKey: fd.fKey, prevKey: fd.prevKey, currentValue: amounts[0].num, prevValue: null, found: true };
      }
    }
    return { label: fd.label, fKey: fd.fKey, prevKey: fd.prevKey, currentValue: null, prevValue: null, found: false };
  });
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext    = file.name.split(".").pop()?.toLowerCase() ?? "";

    let fields: ExtractedField[];

    if (ext === "pdf") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
      const parsed   = await pdfParse(buffer);
      fields = extractFieldsFromText(parsed.text);
    } else if (["xlsx", "xls", "csv", "ods"].includes(ext)) {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      fields = extractFieldsFromWorkbook(workbook);
    } else if (["doc", "docx"].includes(ext)) {
      return NextResponse.json({ error: "Word (.docx) support coming soon. Please use PDF or Excel." }, { status: 400 });
    } else {
      return NextResponse.json({ error: "Unsupported file type. Upload PDF or Excel." }, { status: 400 });
    }

    return NextResponse.json({ fields, fileName: file.name });
  } catch (err) {
    console.error("parse-financials error:", err);
    return NextResponse.json({ error: "Failed to parse the file. Ensure it is a valid PDF or Excel." }, { status: 500 });
  }
}
