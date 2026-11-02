import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { findFormSheet, loadFieldMap, applyCellValues } from "@/lib/annual-filing/aoc4kit";
import type { AnnualFilingData } from "@/lib/annual-filing/types";

export const maxDuration = 300;
export const runtime = "nodejs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function extractJson(text: string): Record<string, unknown> {
  const stripped = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "");
  const m = stripped.match(/\{[\s\S]*\}/);
  if (!m) return {};
  try { return JSON.parse(m[0]) as Record<string, unknown>; } catch { return {}; }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const financialPdf = formData.get("financialPdf") as File | null;
  const aoc4Excel    = formData.get("mcaZip") as File | null;
  const guideFile    = formData.get("guide") as File | null;
  const saveId       = formData.get("saveId") as string | null;

  if (!financialPdf || !aoc4Excel) {
    return NextResponse.json({ error: "Financial PDF and AOC-4 Excel are required" }, { status: 400 });
  }

  // Load saved filing data
  let filingData: AnnualFilingData | null = null;
  if (saveId) {
    const rows = await prisma.$queryRawUnsafe<Array<{ formDataJson: string }>>(
      `SELECT "formDataJson" FROM csi_documents WHERE id = $1 LIMIT 1`, saveId
    );
    if (rows[0]) {
      try { filingData = JSON.parse(rows[0].formDataJson) as AnnualFilingData; } catch { /* ignore */ }
    }
  }
  if (!filingData) {
    return NextResponse.json({ error: "Filing data not found. Please save your filing first." }, { status: 404 });
  }

  const fin = filingData.financials || {};
  const companyName = filingData.companyName || "";
  const cin = filingData.cin || "";

  // ── Step 1: Read guide text (if uploaded) ────────────────────────────────────
  let guideText = "";
  if (guideFile) {
    try {
      const guideBuf = await guideFile.arrayBuffer();
      if (guideFile.name.endsWith(".html") || guideFile.name.endsWith(".htm")) {
        guideText = Buffer.from(guideBuf).toString("utf-8")
          .replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").slice(0, 10000);
      } else {
        const base64Guide = Buffer.from(guideBuf).toString("base64");
        const guideMsg = await anthropic.messages.create({
          model: "claude-sonnet-5-5",
          max_tokens: 4096,
          messages: [{
            role: "user",
            content: [
              { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64Guide } } as unknown as { type: "text"; text: string },
              { type: "text", text: "Extract all field names, descriptions, and filling instructions from this MCA AOC-4 filling guide. List each field with what value/format is expected. Return as plain text." },
            ],
          }],
        });
        guideText = ((guideMsg.content.find(c => c.type === "text") as { text: string } | undefined)?.text ?? "").slice(0, 10000);
      }
    } catch (e) {
      console.error("[fill-aoc4] Guide read failed:", e);
    }
  }

  // ── Step 2: Extract financials from PDF ──────────────────────────────────────
  let financialSummary = "";
  try {
    const pdfBuf = await financialPdf.arrayBuffer();
    const base64Pdf = Buffer.from(pdfBuf).toString("base64");
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64Pdf } } as unknown as { type: "text"; text: string },
          {
            type: "text",
            text: `You are reading audited financial statements of an Indian company for MCA AOC-4 filing.
Company: ${companyName}

Extract ALL financial figures. All amounts in actual Indian Rupees (NOT lakhs/crores).
Return ONLY raw JSON (no markdown):
{
  "share_capital": null,
  "reserves_surplus": null,
  "authorized_capital": null,
  "lt_borrowings": null,
  "dt_liabilities": null,
  "other_lt_liabilities": null,
  "lt_provisions": null,
  "st_borrowings": null,
  "trade_payables_msme": null,
  "trade_payables_other": null,
  "other_current_liabilities": null,
  "st_provisions": null,
  "total_equity_liabilities": null,
  "ppe_net": null,
  "ppe_gross": null,
  "intangible_assets": null,
  "cwip": null,
  "intangible_under_dev": null,
  "nc_investments": null,
  "dt_assets": null,
  "lt_loans_advances": null,
  "other_nc_assets": null,
  "current_investments": null,
  "inventories": null,
  "trade_receivables": null,
  "cash_equivalents": null,
  "st_loans_advances": null,
  "other_current_assets": null,
  "total_assets": null,
  "revenue_from_operations": null,
  "other_income": null,
  "total_revenue": null,
  "cost_materials": null,
  "purchases_stock": null,
  "changes_inventories": null,
  "employee_expenses": null,
  "managerial_remuneration": null,
  "auditor_fees": null,
  "finance_costs": null,
  "depreciation": null,
  "other_expenses": null,
  "exceptional_items": null,
  "profit_before_tax": null,
  "current_tax": null,
  "deferred_tax": null,
  "profit_after_tax": null,
  "net_worth": null,
  "total_shares": null,
  "nominal_value_per_share": null,
  "eps_basic": null,
  "eps_diluted": null,
  "rent_paid": null,
  "insurance": null,
  "power_fuel": null,
  "trade_rec_unsecured_over6m": null,
  "lt_borrowings_term_bank": null,
  "st_borrowings_bank": null,
  "rpt_gross_value": null,
  "prev_revenue_from_operations": null,
  "prev_profit_after_tax": null,
  "prev_total_assets": null,
  "prev_net_worth": null
}`,
          },
        ],
      }],
    });
    const text = (msg.content.find(c => c.type === "text") as { text: string } | undefined)?.text ?? "";
    const parsed = extractJson(text) as Record<string, number | null>;
    // Build a human-readable summary for the next Claude call
    const lines = Object.entries(parsed)
      .filter(([, v]) => v !== null)
      .map(([k, v]) => `  ${k}: ${v}`);
    financialSummary = lines.join("\n");
  } catch (e) {
    console.error("[fill-aoc4] PDF extraction failed:", e);
  }

  // ── Step 3: Build field→cellRef table from AOC-4 FORM sheet ──────────────────
  const aoc4Buf = await aoc4Excel.arrayBuffer();
  // fieldTable: [{fieldName: "balanceSheet...shareCapital", cellRef: "G208"}, ...]
  let fieldTable: Array<{ fieldName: string; cellRef: string }> = [];
  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(aoc4Buf);
    const sheetPath = await findFormSheet(zip);
    const { fields } = await loadFieldMap(zip, sheetPath);
    fieldTable = Object.entries(fields)
      .filter(([name]) =>
        !name.startsWith("requestBody.formName") &&
        !name.startsWith("requestBody.operation") &&
        !name.includes("formIntegrationId") &&
        !name.includes("formDataVersion") &&
        !name.includes("status")
      )
      .map(([fieldName, cellRef]) => ({ fieldName, cellRef }));
  } catch (e) {
    return NextResponse.json({
      error: `Could not read AOC-4 Excel: ${e instanceof Error ? e.message : String(e)}`,
    }, { status: 400 });
  }

  // ── Step 4: Claude fills — returns {cellRef: value} directly ─────────────────
  const boardMeetings = (filingData.boardMeetings || []).map(bm => {
    const d = new Date(bm.date);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  });
  const bmDate = boardMeetings[boardMeetings.length - 1] || "01/09/2026";
  const signDin = filingData.signatoryDirectors?.director1?.din || (filingData.directors || [])[0]?.din || "";
  const revenue = parseFloat(fin.revenueFromOperations || "0") || 0;

  const nicCode = cin.substring(1, 6);
  let productCode4 = "9983", productCode8 = "99831300";
  let productDesc = "Information technology (IT) consulting and support services";
  if (nicCode.startsWith("451") || nicCode.startsWith("452")) {
    productCode4 = "9954"; productCode8 = "99541100"; productDesc = "Construction services of buildings";
  } else if (nicCode.startsWith("681") || nicCode.startsWith("682")) {
    productCode4 = "9972"; productCode8 = "99721100"; productDesc = "Real estate services involving own or leased property";
  } else if (nicCode.startsWith("85") || nicCode.startsWith("80")) {
    productCode4 = "9992"; productCode8 = "99929900"; productDesc = "Educational services";
  } else if (nicCode.startsWith("86") || nicCode.startsWith("87") || nicCode.startsWith("88")) {
    productCode4 = "9993"; productCode8 = "99935900"; productDesc = "Health and social care services";
  }

  // Format field table for Claude — show fieldName + cellRef together
  const fieldTableText = fieldTable
    .slice(0, 300)
    .map(({ fieldName, cellRef }) => `${cellRef} | ${fieldName}`)
    .join("\n");

  let cellValueMap: Record<string, string | number | null> = {};
  try {
    const prompt = `You are an expert Chartered Accountant and MCA company secretary filling an AOC-4 (Annual Financial Statement) form for an Indian private limited company.

═══ COMPANY DETAILS ═══
Company Name: ${companyName}
CIN: ${cin}
Financial Year: ${filingData.financialYear || "2025-2026"}
Authorised Capital: ₹${fin.authorisedCapital || "500000"}
Paid Up Capital: ₹${fin.paidUpCapital || "0"}
Company Type: ${filingData.companyType || "private"}
Signing Director DIN: ${signDin}
Board Meeting Date (DD/MM/YYYY): ${bmDate}
Number of Members: 0
Whether Small Company: Yes
Product/Service Code (4-digit): ${productCode4}
Product/Service Code (8-digit): ${productCode8}
Product Description: ${productDesc}
Turnover from Principal Product: ₹${revenue}

═══ FINANCIAL DATA (from audited statements, all amounts in actual ₹) ═══
${financialSummary || "No financial data extracted — use 0 for all financial fields"}

═══ ADDITIONAL FORM DATA ═══
Paid Up Capital: ₹${fin.paidUpCapital || "0"}
Reserves & Surplus: ₹${fin.reservesAndSurplus || "0"}
Revenue from Operations: ₹${fin.revenueFromOperations || "0"}
Other Income: ₹${fin.otherIncome || "0"}
Profit Before Tax: ₹${fin.profitBeforeTax || "0"}
Current Tax: ₹${fin.currentTax || "0"}
Deferred Tax: ₹${fin.deferredTax || "0"}
Profit After Tax: ₹${fin.profitAfterTax || "0"}
Total Assets: ₹${fin.totalAssets || "0"}
Net Worth: ₹${fin.netWorth || "0"}
Previous Year Revenue: ₹${fin.prevRevenueFromOperations || "0"}
Previous Year PAT: ₹${fin.prevProfitAfterTax || "0"}

${guideText ? `═══ MCA FILLING GUIDE ═══\n${guideText}\n` : ""}

═══ AOC-4 FORM CELLS (cellRef | fieldName) ═══
Each row shows the EXACT Excel cell address and its field name.
You must return values keyed by the cell reference (left column).

${fieldTableText}

═══ YOUR TASK ═══
Fill ALL the above cells with correct values from the financial data and company details.

RULES:
1. Return ONLY a JSON object: {"G208": 500000, "B13": "01/09/2026", ...}
2. Keys = EXACT cell references from the table above (e.g. "G208", "B15", "H21")
3. For all monetary fields: use actual Indian Rupees (numbers only, no ₹ symbol)
4. Fields with "InCurrentDate" = current year value
5. Fields with "InPreviousDate" = previous year value (use 0 if not available)
6. For "designation" fields: use 1 (means Director)
7. For "identificationNumber", "pan", "decalartionId" fields: use "${signDin}"
8. For date fields: use "${bmDate}" format DD/MM/YYYY
9. For "numberOfMembers": 0
10. For "authorisedCapital": ${fin.authorisedCapital || "500000"}
11. For "totalNumberOfProduct": 1
12. For "whetherSmallCompany": "Yes"
13. For all financial fields not found in data: use 0 (never leave blank)
14. For "productCode" (4-digit): "${productCode4}"
15. For 8-digit product code: "${productCode8}"
16. For product description: "${productDesc}"
17. Total shares = Paid up capital ÷ 10 (nominal value)

Fill every single cell in the table. Return ONLY the JSON, no explanation.`;

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });
    const text = (msg.content.find(c => c.type === "text") as { text: string } | undefined)?.text ?? "";
    cellValueMap = extractJson(text) as Record<string, string | number | null>;
  } catch (e) {
    console.error("[fill-aoc4] Claude fill failed:", e);
    return NextResponse.json({ error: `AI fill failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }

  // ── Step 5: Write cell values directly — no field name lookup ────────────────
  let filledAoc: Uint8Array;
  try {
    filledAoc = await applyCellValues(aoc4Buf, cellValueMap);
  } catch (e) {
    return NextResponse.json({ error: `Excel write failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }

  // ── Step 6: Return filled AOC-4 ──────────────────────────────────────────────
  const aocName = (aoc4Excel.name || "AOC-4.xlsx").replace(".xlsx", "_FILLED.xlsx");
  return NextResponse.json({
    fieldsFound: financialSummary.split("\n").length,
    fieldsFilled: Object.keys(cellValueMap).length,
    aoc: { name: aocName, data: Buffer.from(filledAoc).toString("base64") },
  });
}
