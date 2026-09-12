import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FIELD DEFINITIONS — covers all Indian CA/CS software formats
// Sources: Tally Prime, Busy, Zoho Books, QuickBooks India, SAP B1,
//          Schedule III (Companies Act 2013), ICAI formats, MCA XBRL
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
      /net\s+revenue/i,
      /gross\s+revenue/i,
      /turnover/i,
      // Tally format
      /^sales\s+account/i,
      /^sales$/i,
      /income\s+from\s+service/i,
      /service\s+income/i,
      /professional\s+income/i,
      /fee\s+income/i,
      /operating\s+revenue/i,
    ],
    // Exclude lines that also mention "other income" or totals
    exclude: [/other\s+income/i, /total\s+income/i, /total\s+revenue\s*$/i],
  },
  {
    label: "Other Income",
    fKey: "otherIncome",
    prevKey: "prevOtherIncome",
    patterns: [
      /other\s+income/i,
      /non.?operating\s+income/i,
      /miscellaneous\s+income/i,
      /sundry\s+income/i,
      /other\s+operating\s+revenue/i,
      /interest\s+income/i,
      /dividend\s+income/i,
    ],
    exclude: [/revenue\s+from\s+operation/i, /total/i],
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
      /iv\.\s*expenses/i,
      /total\s+of\s+expense/i,
      // Tally often shows total expense line
      /expenditure/i,
    ],
    exclude: [/other\s+expense/i, /finance\s+cost/i, /depreciation/i, /employee/i],
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
      /deferred\s+tax\s+(?:liability|asset)/i,
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
      /authoris[ae]d:?$/i,
    ],
    exclude: [/subscribed/i, /paid/i],
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
      // When just "Share Capital" line (below authorised)
      /^share\s+capital$/i,
      // Tally: "Capital Account"
      /capital\s+account/i,
      // Proprietorship: "Proprietor's Capital"
      /proprietor(?:'?s)?\s+(?:capital|fund)/i,
      // Partnership: "Partners' Capital"
      /partner(?:'?s)?\s+capital/i,
    ],
    exclude: [/authoris/i, /securities\s+premium/i, /working\s+capital/i, /loan/i],
  },
  {
    label: "Reserves & Surplus",
    fKey: "reservesAndSurplus",
    prevKey: "prevReservesAndSurplus",
    patterns: [
      /reserves\s*(?:and|&)\s*surplus/i,
      /other\s+equity/i,
      /retained\s+earning/i,
      /surplus\s+in.*(?:profit|p&l|p & l)/i,
      /general\s+reserve/i,
      /securities\s+premium/i,
      /profit\s+(?:and|&)\s+loss\s+(?:a\/c|account)/i,
      // Tally / NCE
      /reserve\s+and\s+surplus/i,
      /net\s+profit.*carried/i,
    ],
    exclude: [/share\s+capital/i],
  },
  {
    label: "Total Assets",
    fKey: "totalAssets",
    prevKey: "prevTotalAssets",
    patterns: [
      /^total\s+assets$/i,
      /total\s+assets\b/i,
      /grand\s+total.*asset/i,
    ],
    exclude: [/non.?current/i, /^current\s+assets/i, /net\s+assets/i, /fixed\s+assets/i, /tangible/i, /intangible/i, /other.*assets/i],
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
    ],
    exclude: [/^non.?current\s+liabilit/i, /^current\s+liabilit/i, /^other\s+liabilit/i],
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NUMBER EXTRACTION — handles Indian rupee formats
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function extractAmounts(text: string): number[] {
  const results: number[] = [];

  // Pattern 1: Indian comma-formatted numbers with optional parentheses for negatives
  // Matches: 3,00,000 | (2,45,123) | 45,67,890.50 | 1,00,00,000
  // The Indian system groups: units, then pairs after that
  const indianRe = /(\()(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?)(\))|(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?)/g;
  let m: RegExpExecArray | null;

  while ((m = indianRe.exec(text)) !== null) {
    if (m[1] === "(" && m[3] === ")") {
      const val = parseFloat(m[2].replace(/,/g, ""));
      if (!isNaN(val)) results.push(-val); // Negative (loss/contra)
    } else if (m[4]) {
      const val = parseFloat(m[4].replace(/,/g, ""));
      if (!isNaN(val)) results.push(val);
    }
  }

  // Pattern 2: If no comma-formatted numbers found, try plain integers >= 100
  // (some statements print without commas)
  if (results.length === 0) {
    const plainRe = /\b(\d{3,12})\b/g;
    while ((m = plainRe.exec(text)) !== null) {
      const val = parseInt(m[1], 10);
      if (!isNaN(val) && val >= 100 && !(val >= 1900 && val <= 2100)) {
        results.push(val);
      }
    }
  }

  return results;
}

// Detect if document uses lakhs/crores/thousands — return multiplier
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXTRACT FIELDS FROM RAW TEXT (PDF or Excel-as-text)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function extractFieldsFromText(rawText: string): ExtractedField[] {
  // Detect unit multiplier from header (first 3000 chars)
  const multiplier = detectMultiplier(rawText.slice(0, 3000));

  // Split into trimmed, non-empty lines
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  return FIELD_DEFS.map(fd => {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip excluded pattern matches
      if (fd.exclude.some(p => p.test(line))) continue;

      // Check main patterns
      if (!fd.patterns.some(p => p.test(line))) continue;

      // Aggregate text from this line + next 2 (values sometimes on next line in PDFs)
      const context = [line, lines[i + 1] ?? "", lines[i + 2] ?? ""].join(" ");
      const rawAmounts = extractAmounts(context);

      // Remove note-number candidates: small positive integers (1–99) at the START
      // Note numbers in Schedule III are always single/double digit, precede amounts
      const amounts = removeLeadingNoteNumbers(rawAmounts);

      // Apply unit multiplier
      const scaled = amounts.map(n => n * multiplier);

      if (scaled.length >= 2) {
        return {
          label: fd.label, fKey: fd.fKey, prevKey: fd.prevKey,
          currentValue: scaled[0], prevValue: scaled[1], found: true,
        };
      }
      if (scaled.length === 1) {
        return {
          label: fd.label, fKey: fd.fKey, prevKey: fd.prevKey,
          currentValue: scaled[0], prevValue: null, found: true,
        };
      }
    }

    return {
      label: fd.label, fKey: fd.fKey, prevKey: fd.prevKey,
      currentValue: null, prevValue: null, found: false,
    };
  });
}

// Remove leading small integers that are likely note/schedule numbers (1–99)
function removeLeadingNoteNumbers(amounts: number[]): number[] {
  if (amounts.length <= 1) return amounts;
  // If first element is a small positive integer (1–99) AND remaining elements exist, drop it
  const first = amounts[0];
  if (Number.isInteger(first) && first >= 1 && first <= 99) {
    return amounts.slice(1);
  }
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

  // Detect unit multiplier from all text content
  const allText = allCells.map(c => c.text).join(" ");
  const multiplier = detectMultiplier(allText.slice(0, 3000));

  return FIELD_DEFS.map(fd => {
    for (const cell of allCells) {
      if (fd.exclude.some(p => p.test(cell.text))) continue;
      if (!fd.patterns.some(p => p.test(cell.text))) continue;

      // Get all numeric cells in the same row, to the right of the label
      const sameRow = allCells
        .filter(c => c.row === cell.row && c.sheet === cell.sheet && c.col > cell.col && c.num !== null)
        .sort((a, b) => a.col - b.col);

      const rawAmounts = sameRow.map(c => c.num!);
      const amounts    = removeLeadingNoteNumbers(rawAmounts).map(n => n * multiplier);

      if (amounts.length >= 2) {
        return {
          label: fd.label, fKey: fd.fKey, prevKey: fd.prevKey,
          currentValue: amounts[0], prevValue: amounts[1], found: true,
        };
      }
      if (amounts.length === 1) {
        return {
          label: fd.label, fKey: fd.fKey, prevKey: fd.prevKey,
          currentValue: amounts[0], prevValue: null, found: true,
        };
      }
    }

    return {
      label: fd.label, fKey: fd.fKey, prevKey: fd.prevKey,
      currentValue: null, prevValue: null, found: false,
    };
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTE HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const maxDuration = 30; // Vercel function timeout (seconds)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext    = (file.name.split(".").pop() ?? "").toLowerCase();

    let fields: ExtractedField[];

    if (ext === "pdf") {
      // Use pdf-parse/lib/pdf-parse.js to avoid the test-file ENOENT issue on Vercel
      // The top-level pdf-parse module runs test code on import; the lib path skips it
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
        buf: Buffer,
        opts?: { max?: number }
      ) => Promise<{ text: string; numpages: number }>;

      const parsed = await pdfParse(buffer, { max: 0 }); // max:0 = all pages
      fields = extractFieldsFromText(parsed.text);

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

    return NextResponse.json({ fields, fileName: file.name });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[parse-financials]", msg);

    // Friendly error messages for known failure modes
    if (msg.includes("ENOENT") || msg.includes("test/data")) {
      return NextResponse.json(
        { error: "PDF library initialisation error on server. Please try again." },
        { status: 500 }
      );
    }
    if (msg.includes("Invalid PDF") || msg.includes("Bad PDF")) {
      return NextResponse.json(
        { error: "This PDF appears to be corrupted or password-protected. Try re-saving it as an unprotected PDF." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Could not read the file. Make sure it is a valid, unlocked PDF or Excel file." },
      { status: 500 }
    );
  }
}
