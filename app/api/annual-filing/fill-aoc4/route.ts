import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { findFormSheet, loadFieldMap, applyFieldValues } from "@/lib/annual-filing/aoc4kit";
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
  const aoc4Excel    = formData.get("mcaZip") as File | null;   // frontend sends as "mcaZip"
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
  const parseN = (v: string | undefined) => parseFloat(v || "0") || 0;

  // ── Step 1: Read guide text (if uploaded) ────────────────────────────────────
  let guideText = "";
  if (guideFile) {
    try {
      const guideBuf = await guideFile.arrayBuffer();
      // If it's HTML, read as text directly
      if (guideFile.name.endsWith(".html") || guideFile.name.endsWith(".htm")) {
        guideText = Buffer.from(guideBuf).toString("utf-8").replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").slice(0, 8000);
      } else {
        // PDF — ask Claude to read it
        const base64Guide = Buffer.from(guideBuf).toString("base64");
        const guideMsg = await anthropic.messages.create({
          model: "claude-sonnet-5-5",
          max_tokens: 4096,
          messages: [{
            role: "user",
            content: [
              { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64Guide } } as unknown as { type: "text"; text: string },
              { type: "text", text: "Extract all field names, descriptions, and filling instructions from this MCA filling guide. Return as plain text." },
            ],
          }],
        });
        guideText = ((guideMsg.content.find(c => c.type === "text") as { text: string } | undefined)?.text ?? "").slice(0, 8000);
      }
    } catch (e) {
      console.error("[fill-aoc4] Guide read failed:", e);
    }
  }

  // ── Step 2: Extract financials from PDF ──────────────────────────────────────
  let aiFinancials: Record<string, number | null> = {};
  try {
    const pdfBuf = await financialPdf.arrayBuffer();
    const base64Pdf = Buffer.from(pdfBuf).toString("base64");
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 3000,
      messages: [{
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64Pdf } } as unknown as { type: "text"; text: string },
          {
            type: "text",
            text: `Extract ALL financial figures from this Indian company's audited financial statements (Balance Sheet + P&L) for MCA AOC-4 filing.
All amounts in Indian Rupees (actual rupees, NOT lakhs/crores).
Return ONLY raw JSON (no markdown):
{"share_capital":null,"reserves":null,"authorized_capital":null,"lt_borrowings":null,"st_borrowings":null,"payables_other":null,"payables_msme":null,"other_cl":null,"lt_provisions":null,"st_provisions":null,"ppe":null,"intangibles":null,"cwip":null,"nc_invest":null,"dta":null,"lt_loans_adv":null,"other_nca":null,"inventory":null,"trade_rec":null,"cash":null,"st_loans_adv":null,"other_ca":null,"sale_mfg":null,"sale_traded":null,"sale_services":null,"other_income":null,"materials":null,"purchases":null,"employee":null,"managerial_rem":null,"auditor_fee":null,"finance_cost":null,"depreciation":null,"other_exp":null,"exceptional":null,"current_tax":null,"deferred_tax":null,"profit_before_tax":null,"profit_after_tax":null,"total_assets":null,"total_equity_liab":null,"net_worth":null,"gross_ppe":null,"fp_depreciation":null,"eps_basic":null,"eps_diluted":null,"total_shares":null,"nominal_value":null,"eq_shares_begin":null,"eq_paidup_begin":null,"rent_paid":null,"insurance":null,"power":null,"tr_unsecured":null,"ltb_term_bank":null,"stb_bank":null,"rpt_gross_value":null}
Company: ${companyName}`,
          },
        ],
      }],
    });
    const text = (msg.content.find(c => c.type === "text") as { text: string } | undefined)?.text ?? "";
    aiFinancials = extractJson(text) as Record<string, number | null>;
  } catch (e) {
    console.error("[fill-aoc4] PDF extraction failed:", e);
  }

  // ── Step 3: Get AOC-4 FORM field list ────────────────────────────────────────
  const aoc4Buf = await aoc4Excel.arrayBuffer();
  let aocFields: Record<string, string> = {};
  try {
    const { findFormSheet: ffs, loadFieldMap: lfm } = await import("@/lib/annual-filing/aoc4kit");
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(aoc4Buf);
    const sheetPath = await ffs(zip);
    const { fields } = await lfm(zip, sheetPath);
    aocFields = fields;
  } catch (e) {
    return NextResponse.json({ error: `Could not read AOC-4 Excel FORM sheet: ${e instanceof Error ? e.message : String(e)}` }, { status: 400 });
  }

  // ── Step 4: Claude fills AOC-4 ───────────────────────────────────────────────
  const fieldList = Object.keys(aocFields)
    .filter(f => !f.startsWith("requestBody.formName") && !f.startsWith("requestBody.operation") && !f.includes("status") && !f.includes("formIntegrationId"))
    .slice(0, 150)
    .join("\n");

  const boardMeetings = (filingData.boardMeetings || []).map(bm => {
    const d = new Date(bm.date);
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
  });
  const bmDate = boardMeetings[boardMeetings.length - 1] || "01/09/2026";
  const signDin = filingData.signatoryDirectors?.director1?.din || (filingData.directors || [])[0]?.din || "";
  const pat = parseN(fin.profitAfterTax);
  const revenue = parseN(fin.revenueFromOperations);
  const nicCode = cin.substring(1, 6);
  let productCode4 = "9983", productCode8 = "99831300", productDesc = "Information technology (IT) consulting and support services";
  if (nicCode.startsWith("451") || nicCode.startsWith("452")) { productCode4="9954"; productCode8="99541100"; productDesc="Construction services of buildings"; }
  else if (nicCode.startsWith("681") || nicCode.startsWith("682")) { productCode4="9972"; productCode8="99721100"; productDesc="Real estate services involving own or leased property"; }
  else if (nicCode.startsWith("85") || nicCode.startsWith("80")) { productCode4="9992"; productCode8="99929900"; productDesc="Educational services"; }
  else if (nicCode.startsWith("86") || nicCode.startsWith("87") || nicCode.startsWith("88")) { productCode4="9993"; productCode8="99935900"; productDesc="Health and social care services"; }

  let aocValues: Record<string, string | number> = {};
  try {
    const prompt = `You are an expert MCA company secretary filling an AOC-4 Standalone financial statements form for an Indian private limited company.

COMPANY: ${companyName}
CIN: ${cin}
Financial Year: ${filingData.financialYear || "2025-2026"}
Authorized Capital: ₹${fin.authorisedCapital || "500000"}
Paid Up Capital: ₹${fin.paidUpCapital || "0"}
Company Type: ${filingData.companyType || "private"}
Signing Director DIN: ${signDin}
Board Meeting Date (DD/MM/YYYY): ${bmDate}
Number of members: 0
Product/Service Code (4-digit): ${productCode4}
Product/Service Code (8-digit): ${productCode8}
Product Description: ${productDesc}
Turnover from principal product: ₹${revenue}

FINANCIAL DATA from audited statements (all ₹, actual rupees):
${JSON.stringify(aiFinancials, null, 2)}

FORM DATA:
Paid up capital: ${fin.paidUpCapital || "0"}
Reserves & surplus: ${fin.reservesAndSurplus || "0"}
Revenue from operations: ${fin.revenueFromOperations || "0"}
Other income: ${fin.otherIncome || "0"}
Profit before tax: ${fin.profitBeforeTax || "0"}
Current tax: ${fin.currentTax || "0"}
Deferred tax: ${fin.deferredTax || "0"}
Profit after tax: ${fin.profitAfterTax || "0"}
Total assets: ${fin.totalAssets || "0"}
Net worth: ${fin.netWorth || "0"}
Previous year revenue: ${fin.prevRevenueFromOperations || "0"}
Previous year PAT: ${fin.prevProfitAfterTax || "0"}

${guideText ? `MCA FILLING GUIDE:\n${guideText}\n` : ""}

AOC-4 FIELD NAMES (fill these):
${fieldList}

FILLING RULES:
- All monetary values in Indian Rupees (actual rupees, not in lakhs/crores)
- Fields ending "InCurrentDate" = current year value from financial statements
- Fields ending "InPreviousDate" = previous year value (use 0 if not available)
- For "designation" dropdown fields: use value 1 (Director)
- For "identificationNumber" and "pan" fields: use the signing director DIN: ${signDin}
- For "resolutionNumberDate" or "decalartionDate": use ${bmDate}
- For numeric zero fields: use 0 not null
- For "numberOfMembers": 0
- For "authorisedCapital": ${fin.authorisedCapital || "500000"}
- For total shares: calculate from paid-up capital / nominal value (usually 10)
- Use AI-extracted values where available; form data as fallback
- principalProducts.totalNumberOfProduct: 1
- Set ZERO for all financial fields not found (don't leave empty)
- For "whetherSmallCompany" dropdown: "Yes"
- For board section: resolutionNumberDate = ${bmDate}

Return ONLY valid JSON: {"fieldName": value}
Fill ALL numeric financial fields you can determine. Set 0 for unknown numeric fields.`;

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });
    const text = (msg.content.find(c => c.type === "text") as { text: string } | undefined)?.text ?? "";
    aocValues = extractJson(text) as Record<string, string | number>;
  } catch (e) {
    console.error("[fill-aoc4] Claude fill failed:", e);
    return NextResponse.json({ error: `AI fill failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }

  // ── Step 5: Apply values to AOC-4 Excel ──────────────────────────────────────
  let filledAoc: Uint8Array;
  try {
    filledAoc = await applyFieldValues(aoc4Buf, aocValues);
  } catch (e) {
    return NextResponse.json({ error: `Excel write failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }

  // ── Step 6: Return filled AOC-4 ──────────────────────────────────────────────
  const aocName = (aoc4Excel.name || "AOC-4.xlsx").replace(".xlsx", "_FILLED.xlsx");
  return NextResponse.json({
    fieldsFound: Object.values(aiFinancials).filter(v => v !== null).length,
    fieldsFilled: Object.keys(aocValues).length,
    aoc: { name: aocName, data: Buffer.from(filledAoc).toString("base64") },
  });
}
