import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FIELD DEFINITIONS — covers Tally, Busy, Zoho, SAP, CompuOffice, Schedule III
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const FIELD_DEFS = [
  {
    label: "Revenue from Operations",
    fKey: "revenueFromOperations",
    prevKey: "prevRevenueFromOperations",
    patterns: [
      /revenue\s+from\s+operation/i,
      /net\s+revenue\s+from\s+operation/i,
      /income\s+from\s+operation/i,
      /gross\s+revenue\s+from\s+operation/i,
      /sales\s*[\/\\]\s*revenue\s+from\s+operation/i,
      /total\s+revenue\s+from\s+operation/i,
      /revenue\s+from\s+contracts\s+with\s+customer/i,
      /net\s+sales/i,
      /gross\s+revenue/i,
      /turnover/i,
      /^sales\s+account/i,
      /^sales$/i,
      /income\s+from\s+service/i,
      /income\s+from\s+hospital/i,
      /income\s+from\s+medical/i,
      /income\s+from\s+healthcare/i,
      /service\s+income/i,
      /professional\s+income/i,
      /professional\s+fees/i,
      /fee\s+income/i,
      /operating\s+revenue/i,
      /receipts\s+from\s+patient/i,
      /patient\s+care\s+service/i,
      // CompuOffice often labels hospital income as "OPD/IPD"
      /opd\s*[\/&]\s*ipd/i,
      /medical\s+service/i,
      /consultation\s+fee/i,
    ],
    exclude: [/other\s+income/i, /total\s+income/i, /total\s+revenue\s*$/i],
  },
  {
    label: "Other Income",
    fKey: "otherIncome",
    prevKey: "prevOtherIncome",
    allowNil: true, // OK if 0 / nil
    patterns: [
      /other\s+income/i,
      /non.?operating\s+income/i,
      /miscellaneous\s+income/i,
      /sundry\s+income/i,
      /other\s+operating\s+revenue/i,
      /interest\s+income/i,
      /dividend\s+income/i,
      /ii\.\s*other\s+income/i,
    ],
    exclude: [/revenue\s+from\s+operation/i, /total\s+(?:revenue|income)/i],
  },
  {
    label: "Total Expenses",
    fKey: "totalExpenses",
    prevKey: "prevTotalExpenses",
    patterns: [
      /total\s+expenses/i,
      /total\s+expenditure/i,
      /total\s+cost/i,
      /total\s+operating\s+expense/i,
      /total\s+outgoing/i,
      /total\s+of\s+expense/i,
      /[iv]+\.\s*total\s+expenses/i,
      /\bv\b.*total\s+expenses/i,
      // CompuOffice sometimes labels as just "Total" in P&L expenses section
      /^total\s+(?:of\s+)?expenditure/i,
    ],
    exclude: [/other\s+expense/i, /finance\s+cost/i, /depreciation/i, /employee\s+benefit/i, /tax\s+expense/i],
  },
  {
    label: "Current Tax",
    fKey: "currentTax",
    prevKey: "prevCurrentTax",
    patterns: [
      /current\s+tax/i,
      /income\s+tax\s*[-–:]\s*current/i,
      /current\s+income\s+tax/i,
      /provision\s+for\s+income\s+tax/i,
      /provision\s+for\s+tax/i,
      /income\s+tax\s+expense.*current/i,
      /current\s+year\s+tax/i,
      /tax\s+for\s+the\s+year/i,
      /mat\s+provision/i,
      /\(1\)\s*current\s+tax/i,
    ],
    exclude: [/deferred/i, /prior/i],
  },
  {
    label: "Deferred Tax",
    fKey: "deferredTax",
    prevKey: "prevDeferredTax",
    patterns: [
      /deferred\s+tax/i,
      /deferred\s+income\s+tax/i,
      /mat\s+credit/i,
      /deferred\s+tax\s+(?:liability|asset|expense|income)/i,
      /\(2\)\s*deferred\s+tax/i,
    ],
    exclude: [],
  },
  {
    label: "Authorised Share Capital",
    fKey: "authorisedCapital",
    prevKey: "prevAuthorisedCapital",
    patterns: [
      /authoris[ae]d\s+(?:share\s+)?capital/i,
      /authoris[ae]d\s+share/i,
      /authoris[ae]d:?\s*$/i,
      /authoris[ae]d\s+capital/i,
      // CompuOffice / Schedule III: standalone "Authorised" header in Note 1
      /^\s*authoris[ae]d\s*:?\s*$/i,
      /authoris[ae]d\s+(?:but\s+unissued|equity)/i,
    ],
    exclude: [/subscribed/i, /paid.?up/i, /issued/i],
  },
  {
    label: "Paid-up Share Capital",
    fKey: "paidUpCapital",
    prevKey: "prevPaidUpCapital",
    patterns: [
      /paid.?up\s+(?:share\s+)?capital/i,
      /issued\s*,?\s*subscribed\s*(?:and|&|,)\s*paid.?up/i,
      /subscribed\s*(?:and|&)\s*paid.?up/i,
      /called.?up\s+(?:share\s+)?capital/i,
      /equity\s+share\s+capital/i,
      /^share\s+capital$/i,
      /capital\s+account/i,
      /proprietor(?:'?s)?\s+(?:capital|fund)/i,
      /partner(?:'?s)?\s+capital/i,
      // CompuOffice Note format: "Issued, Subscribed and Paid Up"
      /issued.*subscribed.*paid/i,
      /subscribed.*paid.?up/i,
      // Simple label in balance sheet body
      /^\s*share\s+capital\s*$/i,
      /^\(a\)\s+share\s+capital/i,
    ],
    exclude: [/authoris/i, /working\s+capital/i, /loan/i, /reserve/i],
  },
  {
    label: "Reserves & Surplus",
    fKey: "reservesAndSurplus",
    prevKey: "prevReservesAndSurplus",
    patterns: [
      /reserves?\s*(?:and|&)\s*surplus/i,
      /other\s+equity/i,
      /retained\s+earning/i,
      /surplus\s+in.*(?:profit|p&l|p\s*&\s*l)/i,
      /general\s+reserve/i,
      /securities\s+premium/i,
      /profit\s+(?:and|&)\s+loss\s+(?:a\/c|account)/i,
      /reserve\s+and\s+surplus/i,
      /net\s+profit.*carried/i,
      /^\(b\)\s+reserves?\s*(?:and|&)\s*surplus/i,
      // CompuOffice sub-label
      /opening\s+balance.*p\s*&?\s*l/i,
    ],
    exclude: [/share\s+capital/i, /total/i],
  },
  {
    label: "Total Assets",
    fKey: "totalAssets",
    prevKey: "prevTotalAssets",
    patterns: [
      /^total\s+assets$/i,
      /total\s+assets\b/i,
      /grand\s+total.*asset/i,
      // CompuOffice / Schedule III: just "TOTAL" at end of assets section
      // We match standalone "total" but only if in an assets context
      /total\s+(?:of\s+)?assets/i,
    ],
    exclude: [/non.?current\s+assets/i, /^current\s+assets/i, /net\s+assets/i, /fixed\s+assets/i, /tangible/i, /intangible/i],
  },
  {
    label: "Total Liabilities",
    fKey: "totalLiabilities",
    prevKey: "prevTotalLiabilities",
    patterns: [
      /^total\s+liabilit/i,
      /total\s+liabilit/i,
      /total\s+equity\s*(?:and|&)\s*liabilit/i,
      /grand\s+total.*liabilit/i,
      // CompuOffice Schedule III balance total — "Total" appears at bottom of L+E side
      /total\s+(?:equity\s+and\s+)?liabilit/i,
    ],
    exclude: [/^non.?current\s+liabilit/i, /^current\s+liabilit/i, /^other\s+liabilit/i],
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NUMBER EXTRACTION — Indian rupee formats + nil markers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function extractAmounts(text: string): number[] {
  const results: number[] = [];

  // Indian comma-formatted numbers: 3,00,000 | (2,45,123) | 45,67,890.50
  const indianRe = /(\()(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?)(\))|(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?)/g;
  let m: RegExpExecArray | null;
  while ((m = indianRe.exec(text)) !== null) {
    if (m[1] === "(" && m[3] === ")") {
      const val = parseFloat(m[2].replace(/,/g, ""));
      if (!isNaN(val)) results.push(-val);
    } else if (m[4]) {
      const val = parseFloat(m[4].replace(/,/g, ""));
      if (!isNaN(val)) results.push(val);
    }
  }

  // Fallback: plain integers >= 100 (statements without commas)
  if (results.length === 0) {
    const plainRe = /\b(\d{4,12})\b/g;
    while ((m = plainRe.exec(text)) !== null) {
      const val = parseInt(m[1], 10);
      if (!isNaN(val) && !(val >= 1900 && val <= 2100)) {
        results.push(val);
      }
    }
  }

  return results;
}

// Check if a line/context has explicit nil markers (dash, -, nil, zero)
function hasNilMarker(text: string): boolean {
  return /[\s\t]([-–—])\s*(?:[\s\t]|$)/.test(text) ||
         /\bnil\b/i.test(text) ||
         /\bN\.?A\.?\b/i.test(text);
}

function detectMultiplier(headerText: string): number {
  if (/(?:amount|figure|rs\.?|₹)\s*in\s+crore/i.test(headerText)) return 10_000_000;
  if (/(?:amount|figure|rs\.?|₹)\s*in\s+lakh/i.test(headerText))  return 100_000;
  if (/(?:amount|figure|rs\.?|₹)\s*in\s+thousand/i.test(headerText)) return 1_000;
  if (/\(₹\s*in\s+crore/i.test(headerText)) return 10_000_000;
  if (/\(₹\s*in\s+lakh/i.test(headerText))  return 100_000;
  if (/\(rs\.\s*in\s+lakh/i.test(headerText)) return 100_000;
  return 1;
}

type ExtractedField = {
  label: string; fKey: string; prevKey: string;
  currentValue: number | null; prevValue: number | null; found: boolean;
};

type FieldDef = typeof FIELD_DEFS[number];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXTRACT FIELDS FROM RAW TEXT (PDF)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function extractFieldsFromText(rawText: string): ExtractedField[] {
  const multiplier = detectMultiplier(rawText.slice(0, 5000));
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  return FIELD_DEFS.map((fd: FieldDef) => {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (fd.exclude.some((p: RegExp) => p.test(line))) continue;
      if (!fd.patterns.some((p: RegExp) => p.test(line))) continue;

      // Aggregate context: this line + next 3 lines (amounts sometimes on next line in PDFs)
      const context = [line, lines[i + 1] ?? "", lines[i + 2] ?? "", lines[i + 3] ?? ""].join("  ");
      const rawAmounts = extractAmounts(context);
      const amounts = removeLeadingNoteNumbers(rawAmounts).map(n => n * multiplier);

      if (amounts.length >= 2) {
        return { label: fd.label, fKey: fd.fKey, prevKey: fd.prevKey, currentValue: amounts[0], prevValue: amounts[1], found: true };
      }
      if (amounts.length === 1) {
        return { label: fd.label, fKey: fd.fKey, prevKey: fd.prevKey, currentValue: amounts[0], prevValue: null, found: true };
      }
      // Pattern matched but no amounts — could be nil (0) entry
      if ((fd as FieldDef & { allowNil?: boolean }).allowNil || hasNilMarker(context)) {
        return { label: fd.label, fKey: fd.fKey, prevKey: fd.prevKey, currentValue: 0, prevValue: 0, found: true };
      }
    }
    return { label: fd.label, fKey: fd.fKey, prevKey: fd.prevKey, currentValue: null, prevValue: null, found: false };
  });
}

function removeLeadingNoteNumbers(amounts: number[]): number[] {
  if (amounts.length <= 1) return amounts;
  const first = amounts[0];
  if (Number.isInteger(first) && first >= 1 && first <= 99) return amounts.slice(1);
  return amounts;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXTRACT FIELDS FROM EXCEL WORKBOOK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
        const raw  = cell.v;
        const text = String(raw ?? "").trim();
        const num  = typeof raw === "number" ? raw : null;
        if (text) allCells.push({ row: r, col: c, text, num, sheet: sheetName });
      }
    }
  }

  const allText = allCells.map(c => c.text).join(" ");
  const multiplier = detectMultiplier(allText.slice(0, 3000));

  return FIELD_DEFS.map((fd: FieldDef) => {
    for (const cell of allCells) {
      if (fd.exclude.some((p: RegExp) => p.test(cell.text))) continue;
      if (!fd.patterns.some((p: RegExp) => p.test(cell.text))) continue;

      const sameRow = allCells
        .filter(c => c.row === cell.row && c.sheet === cell.sheet && c.col > cell.col && c.num !== null)
        .sort((a, b) => a.col - b.col);

      const rawAmounts = sameRow.map(c => c.num!);
      const amounts = removeLeadingNoteNumbers(rawAmounts).map(n => n * multiplier);

      if (amounts.length >= 2) {
        return { label: fd.label, fKey: fd.fKey, prevKey: fd.prevKey, currentValue: amounts[0], prevValue: amounts[1], found: true };
      }
      if (amounts.length === 1) {
        return { label: fd.label, fKey: fd.fKey, prevKey: fd.prevKey, currentValue: amounts[0], prevValue: null, found: true };
      }
    }
    return { label: fd.label, fKey: fd.fKey, prevKey: fd.prevKey, currentValue: null, prevValue: null, found: false };
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PDF TEXT EXTRACTION — reconstructs lines using y-coordinate grouping
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function extractPdfText(buffer: Buffer): Promise<{ text: string; pages: number }> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js") as typeof import("pdfjs-dist");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = "";

  const data = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({
    data,
    disableFontFace: true,
    useWorkerFetch: false,
    isEvalSupported: false,
  });
  const pdf = await loadingTask.promise;

  let fullText = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Reconstruct lines by grouping items with same y-coordinate
    // PDF y-axis is bottom-up; round to nearest 3px to cluster items on same visual line
    type TItem = { str: string; transform: number[] };
    const items = textContent.items as TItem[];

    const lineMap = new Map<number, { x: number; str: string }[]>();
    for (const item of items) {
      if (!item.str) continue;
      const yRaw = item.transform[5];
      const y = Math.round(yRaw / 3) * 3; // cluster within 3pt
      const x = item.transform[4];
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y)!.push({ x, str: item.str });
    }

    // Sort y descending (top of page first), then x ascending within each line
    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
    for (const y of sortedYs) {
      const lineItems = lineMap.get(y)!.sort((a, b) => a.x - b.x);
      const lineText = lineItems.map(i => i.str).join("  ");
      if (lineText.trim()) fullText += lineText + "\n";
    }
    fullText += "\n"; // page separator
  }

  return { text: fullText, pages: pdf.numPages };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTE HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext    = (file.name.split(".").pop() ?? "").toLowerCase();

    let fields: ExtractedField[];
    let rawTextSample = "";

    if (ext === "pdf") {
      const { text, pages } = await extractPdfText(buffer);
      rawTextSample = text.slice(0, 6000); // first 6000 chars for debug
      console.log(`[parse-financials] PDF pages=${pages} text_len=${text.length}`);
      console.log(`[parse-financials] RAW TEXT SAMPLE:\n${rawTextSample}`);
      fields = extractFieldsFromText(text);

    } else if (["xlsx", "xls", "csv", "ods"].includes(ext)) {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      fields = extractFieldsFromWorkbook(workbook);

    } else if (ext === "docx" || ext === "doc") {
      return NextResponse.json(
        { error: "Word files (.docx) are not yet supported. Please save as PDF or Excel and re-upload." },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or Excel file (.pdf / .xlsx / .xls)." },
        { status: 400 }
      );
    }

    return NextResponse.json({ fields, fileName: file.name, rawTextSample });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[parse-financials] ERROR:", msg);
    if (err instanceof Error && err.stack) console.error("[parse-financials] STACK:", err.stack);

    if (msg.includes("Invalid PDF") || msg.includes("Bad PDF") || msg.includes("password")) {
      return NextResponse.json(
        { error: "This PDF appears to be corrupted or password-protected. Try re-saving it." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `Could not parse the file: ${msg.slice(0, 200)}` },
      { status: 500 }
    );
  }
}
