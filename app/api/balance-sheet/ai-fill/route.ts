import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import type { BalanceSheetData } from "@/lib/balance-sheet/types";
import { INITIAL_BALANCE_SHEET_DATA } from "@/lib/balance-sheet/types";

export const maxDuration = 120;
export const runtime = "nodejs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function extractJson(text: string): Record<string, unknown> | null {
  const stripped = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "");
  const m = stripped.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]) as Record<string, unknown>; } catch { return null; }
}

function safe(v: unknown): string {
  if (v === null || v === undefined) return "";
  const n = Number(v);
  if (!isNaN(n) && isFinite(n)) return String(Math.abs(Math.round(n)));
  const s = String(v).replace(/[₹,\s]/g, "").replace(/\(([^)]+)\)/g, "-$1");
  const parsed = parseFloat(s);
  if (!isNaN(parsed)) return String(Math.abs(Math.round(parsed)));
  return "";
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.csi_users.findUnique({
    where: { email: session.user.email },
    select: { ai_enabled: true, ai_model: true },
  });

  // Choose model: ai_enabled users get their chosen model, others get Haiku
  const model = user?.ai_enabled
    ? (user.ai_model === "sonnet" ? "claude-sonnet-5-5" : "claude-haiku-5-5")
    : "claude-haiku-5-5";

  const formData = await req.formData();
  const file = formData.get("financialPdf") as File | null;

  if (!file || file.type !== "application/pdf") {
    return NextResponse.json({ error: "Please upload a valid PDF file." }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "PDF too large. Max 10 MB allowed." }, { status: 400 });
  }

  // Read PDF as base64
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  const PROMPT = `You are a CA (Chartered Accountant) extracting financial data from an Indian company's Balance Sheet / Financial Statements (Schedule III, Division I, Companies Act 2013).

IMPORTANT RULES:
- All amounts must be in RUPEES (₹) — the PDF should already be in rupees
- Return only RAW JSON, no markdown, no explanation
- If a value is not found, use "" (empty string)
- For amounts: return only the number as a string (e.g. "1500000"), no commas, no ₹ symbol
- For items with "current year" and "previous year" — fill both
- Round to nearest rupee

Extract the following JSON structure exactly (fill what you can find):

{
  "companyName": "",
  "cin": "",
  "pan": "",
  "financialYear": "",

  "note1": {
    "equityShares_authorised": "", "equityShares_issued": "", "equityShares_subscribed": "",
    "equityShares_paidUpCount": "", "equityShares_paidUpAmount": "",
    "equityShares_paidUpCountPrev": "", "equityShares_paidUpAmountPrev": "",
    "faceValue": ""
  },

  "note2": {
    "capitalReserve": "", "capitalReservePrev": "",
    "securitiesPremium": "", "securitiesPremiumPrev": "",
    "generalReserveOpen": "", "generalReserveAdditions": "",
    "surplusOpeningBalance": "", "surplusNetProfit": "", "surplusClosingBalance": "",
    "surplusPrev": "", "otherReserves": "", "otherReservesPrev": ""
  },

  "note3": {
    "termLoanBank": "", "termLoanBankPrev": "",
    "termLoanNBFC": "", "termLoanNBFCPrev": "",
    "debentures": "", "debenturesPrev": "",
    "otherLTBorrowings": "", "otherLTBorrowingsPrev": ""
  },

  "note4": {
    "deferredTaxLiability": "", "deferredTaxLiabilityPrev": "",
    "deferredTaxAsset": "", "deferredTaxAssetPrev": ""
  },

  "note5": {
    "provisionForGratuity": "", "provisionForGratuityPrev": "",
    "provisionForLeaveEncashment": "", "provisionForLeaveEncashmentPrev": "",
    "otherProvisions": "", "otherProvisionsPrev": ""
  },

  "note6": {
    "ccOdBank": "", "ccOdBankPrev": "",
    "otherSTBorrowings": "", "otherSTBorrowingsPrev": ""
  },

  "note7": {
    "msmeAmount": "", "msmeAmountPrev": "",
    "othersAmount": "", "othersAmountPrev": ""
  },

  "note8": {
    "currentMaturitiesLTBorrowings": "", "currentMaturitiesLTBorrowingsPrev": "",
    "interestAccrued": "", "interestAccruedPrev": "",
    "advancesFromCustomers": "", "advancesFromCustomersPrev": "",
    "statutoryDues": "", "statutoryDuesPrev": "",
    "otherPayables": "", "otherPayablesPrev": ""
  },

  "note9": {
    "provisionForTax": "", "provisionForTaxPrev": "",
    "proposedDividend": "", "proposedDividendPrev": "",
    "otherProvisions": "", "otherProvisionsPrev": ""
  },

  "note10": {
    "land_gbOpen": "", "land_additions": "", "land_gbClose": "",
    "land_depOpen": "", "land_depYear": "", "land_depClose": "",
    "land_gbPrev": "", "land_depPrev": "",
    "buildings_gbOpen": "", "buildings_additions": "", "buildings_gbClose": "",
    "buildings_depOpen": "", "buildings_depYear": "", "buildings_depClose": "",
    "buildings_gbPrev": "", "buildings_depPrev": "",
    "plantMachinery_gbOpen": "", "plantMachinery_additions": "", "plantMachinery_gbClose": "",
    "plantMachinery_depOpen": "", "plantMachinery_depYear": "", "plantMachinery_depClose": "",
    "plantMachinery_gbPrev": "", "plantMachinery_depPrev": "",
    "furniture_gbOpen": "", "furniture_additions": "", "furniture_gbClose": "",
    "furniture_depOpen": "", "furniture_depYear": "", "furniture_depClose": "",
    "furniture_gbPrev": "", "furniture_depPrev": "",
    "vehicles_gbOpen": "", "vehicles_additions": "", "vehicles_gbClose": "",
    "vehicles_depOpen": "", "vehicles_depYear": "", "vehicles_depClose": "",
    "vehicles_gbPrev": "", "vehicles_depPrev": "",
    "officeEquipment_gbOpen": "", "officeEquipment_additions": "", "officeEquipment_gbClose": "",
    "officeEquipment_depOpen": "", "officeEquipment_depYear": "", "officeEquipment_depClose": "",
    "officeEquipment_gbPrev": "", "officeEquipment_depPrev": "",
    "cwip": "", "cwipPrev": ""
  },

  "note12": {
    "securityDeposits": "", "securityDepositsPrev": "",
    "capitalAdvances": "", "capitalAdvancesPrev": "",
    "otherLoansAdvances": "", "otherLoansAdvancesPrev": ""
  },

  "note13": {
    "longTermTradeReceivables": "", "longTermTradeReceivablesPrev": "",
    "otherNonCurrentAssets": "", "otherNonCurrentAssetsPrev": ""
  },

  "note14": {
    "mutualFunds": "", "mutualFundsPrev": "",
    "fixedDepositsMaturing12m": "", "fixedDepositsMaturing12mPrev": "",
    "otherCurrentInvestments": "", "otherCurrentInvestmentsPrev": ""
  },

  "note15": {
    "rawMaterials": "", "rawMaterialsPrev": "",
    "workInProgress": "", "workInProgressPrev": "",
    "finishedGoods": "", "finishedGoodsPrev": "",
    "stockInTrade": "", "stockInTradePrev": "",
    "storesSpares": "", "storesSparesPrev": ""
  },

  "note16": {
    "outstandingMore6mUnsecured": "", "outstandingMore6mUnsecuredPrev": "",
    "outstandingLess6mUnsecured": "", "outstandingLess6mUnsecuredPrev": "",
    "provisionForDoubtful": "", "provisionForDoubtfulPrev": ""
  },

  "note17": {
    "cashOnHand": "", "cashOnHandPrev": "",
    "balancesWithBanks": "", "balancesWithBanksPrev": "",
    "fixedDepositsWithin3m": "", "fixedDepositsWithin3mPrev": "",
    "chequesDraftsOnHand": "", "chequesDraftsOnHandPrev": ""
  },

  "note18": {
    "prepaidExpenses": "", "prepaidExpensesPrev": "",
    "advancesToSuppliers": "", "advancesToSuppliersPrev": "",
    "balanceWithGovernment": "", "balanceWithGovernmentPrev": "",
    "otherAdvances": "", "otherAdvancesPrev": ""
  },

  "note19": {
    "interestAccruedOnDeposits": "", "interestAccruedOnDepositsPrev": "",
    "otherCurrentAssets": "", "otherCurrentAssetsPrev": ""
  },

  "note20": {
    "saleOfProducts": "", "saleOfProductsPrev": "",
    "saleOfServices": "", "saleOfServicesPrev": "",
    "otherOperatingRevenue": "", "otherOperatingRevenuePrev": ""
  },

  "note21": {
    "interestIncome": "", "interestIncomePrev": "",
    "dividendIncome": "", "dividendIncomePrev": "",
    "profitOnSaleOfAssets": "", "profitOnSaleOfAssetsPrev": "",
    "miscIncome": "", "miscIncomePrev": ""
  },

  "note22": {
    "openingStock": "", "openingStockPrev": "",
    "purchases": "", "purchasesPrev": "",
    "closingStock": "", "closingStockPrev": ""
  },

  "note25": {
    "salariesWages": "", "salariesWagesPrev": "",
    "bonuses": "", "bonusesPrev": "",
    "providentFund": "", "providentFundPrev": "",
    "gratuity": "", "gratuityPrev": "",
    "staffWelfare": "", "staffWelfarePrev": "",
    "directorRemuneration": "", "directorRemunerationPrev": ""
  },

  "note26": {
    "interestOnBorrowings": "", "interestOnBorrowingsPrev": "",
    "bankCharges": "", "bankChargesPrev": "",
    "otherFinanceCosts": "", "otherFinanceCostsPrev": ""
  },

  "note27": {
    "depreciation": "", "depreciationPrev": "",
    "amortization": "", "amortizationPrev": ""
  },

  "note28": {
    "powerFuel": "", "powerFuelPrev": "",
    "rent": "", "rentPrev": "",
    "repairsMaintenance": "", "repairsMaintenancePrev": "",
    "advertisingMarketing": "", "advertisingMarketingPrev": "",
    "travellingConveyance": "", "travellingConveyancePrev": "",
    "legalProfessional": "", "legalProfessionalPrev": "",
    "auditFees": "", "auditFeesPrev": "",
    "insurancePremium": "", "insurancePremiumPrev": "",
    "miscExpenses": "", "miscExpensesPrev": ""
  },

  "currentTax": "", "currentTaxPrev": "",
  "deferredTaxCharge": "", "deferredTaxChargePrev": ""
}`;

  try {
    const msg = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
            {
              type: "text",
              text: PROMPT,
            },
          ],
        },
      ],
    });

    const textBlock = msg.content.find(c => c.type === "text") as { text: string } | undefined;
    const rawText = textBlock?.text ?? "";
    const extracted = extractJson(rawText);

    if (!extracted) {
      return NextResponse.json({ error: "AI could not parse the PDF. Make sure it is a text-based PDF with financial data." }, { status: 422 });
    }

    // Map extracted fields to BalanceSheetData patch
    const n1 = (extracted.note1 ?? {}) as Record<string, unknown>;
    const n2 = (extracted.note2 ?? {}) as Record<string, unknown>;
    const n3 = (extracted.note3 ?? {}) as Record<string, unknown>;
    const n4 = (extracted.note4 ?? {}) as Record<string, unknown>;
    const n5 = (extracted.note5 ?? {}) as Record<string, unknown>;
    const n6 = (extracted.note6 ?? {}) as Record<string, unknown>;
    const n7 = (extracted.note7 ?? {}) as Record<string, unknown>;
    const n8 = (extracted.note8 ?? {}) as Record<string, unknown>;
    const n9 = (extracted.note9 ?? {}) as Record<string, unknown>;
    const n10 = (extracted.note10 ?? {}) as Record<string, unknown>;
    const n12 = (extracted.note12 ?? {}) as Record<string, unknown>;
    const n13 = (extracted.note13 ?? {}) as Record<string, unknown>;
    const n14 = (extracted.note14 ?? {}) as Record<string, unknown>;
    const n15 = (extracted.note15 ?? {}) as Record<string, unknown>;
    const n16 = (extracted.note16 ?? {}) as Record<string, unknown>;
    const n17 = (extracted.note17 ?? {}) as Record<string, unknown>;
    const n18 = (extracted.note18 ?? {}) as Record<string, unknown>;
    const n19 = (extracted.note19 ?? {}) as Record<string, unknown>;
    const n20 = (extracted.note20 ?? {}) as Record<string, unknown>;
    const n21 = (extracted.note21 ?? {}) as Record<string, unknown>;
    const n22 = (extracted.note22 ?? {}) as Record<string, unknown>;
    const n25 = (extracted.note25 ?? {}) as Record<string, unknown>;
    const n26 = (extracted.note26 ?? {}) as Record<string, unknown>;
    const n27 = (extracted.note27 ?? {}) as Record<string, unknown>;
    const n28 = (extracted.note28 ?? {}) as Record<string, unknown>;

    // Build fixed asset rows
    const makeAssetRow = (id: string, assetClass: string, prefix: string, tangible: boolean) => ({
      id,
      assetClass,
      isTangible: tangible,
      gbOpeningBalance: safe(n10[`${prefix}_gbOpen`]),
      gbAdditions: safe(n10[`${prefix}_additions`]),
      gbDisposals: "",
      gbClosingBalance: safe(n10[`${prefix}_gbClose`]),
      gbPrevClosing: safe(n10[`${prefix}_gbPrev`]),
      depOpeningBalance: safe(n10[`${prefix}_depOpen`]),
      depForYear: safe(n10[`${prefix}_depYear`]),
      depOnDisposals: "",
      depClosingBalance: safe(n10[`${prefix}_depClose`]),
      depPrevClosing: safe(n10[`${prefix}_depPrev`]),
    });

    const patch: Partial<BalanceSheetData> = {
      ...(extracted.companyName ? { companyName: String(extracted.companyName) } : {}),
      ...(extracted.cin ? { cin: String(extracted.cin) } : {}),
      ...(extracted.pan ? { pan: String(extracted.pan) } : {}),

      note1ShareCapital: {
        ...INITIAL_BALANCE_SHEET_DATA.note1ShareCapital,
        classes: [{
          id: "equity",
          className: "Equity Shares",
          faceValue: safe(n1.faceValue) || "10",
          authorisedShares: safe(n1.equityShares_authorised),
          issuedShares: safe(n1.equityShares_issued),
          subscribedShares: safe(n1.equityShares_subscribed),
          paidUpShares: safe(n1.equityShares_paidUpCount),
          paidUpAmount: safe(n1.equityShares_paidUpAmount),
          prevPaidUpShares: safe(n1.equityShares_paidUpCountPrev),
          prevPaidUpAmount: safe(n1.equityShares_paidUpAmountPrev),
        }],
        shareholdersAbove5: [],
      },

      note2ReservesSurplus: {
        capitalReserve: safe(n2.capitalReserve),
        capitalReservePrev: safe(n2.capitalReservePrev),
        securitiesPremium: safe(n2.securitiesPremium),
        securitiesPremiumPrev: safe(n2.securitiesPremiumPrev),
        generalReserveOpen: safe(n2.generalReserveOpen),
        generalReserveAdditions: safe(n2.generalReserveAdditions),
        generalReserveClose: "",
        generalReservePrev: "",
        surplusOpeningBalance: safe(n2.surplusOpeningBalance),
        surplusNetProfit: safe(n2.surplusNetProfit),
        surplusDividend: "",
        surplusTransferToReserve: "",
        surplusClosingBalance: safe(n2.surplusClosingBalance),
        surplusPrev: safe(n2.surplusPrev),
        otherReserves: safe(n2.otherReserves),
        otherReservesPrev: safe(n2.otherReservesPrev),
      },

      note3LTBorrowings: {
        items: [
          ...(safe(n3.termLoanBank) ? [{ id: "tl1", nature: "Term Loan from Bank", secured: true, amount: safe(n3.termLoanBank), amountPrev: safe(n3.termLoanBankPrev) }] : []),
          ...(safe(n3.termLoanNBFC) ? [{ id: "tl2", nature: "Term Loan from NBFC", secured: true, amount: safe(n3.termLoanNBFC), amountPrev: safe(n3.termLoanNBFCPrev) }] : []),
          ...(safe(n3.debentures) ? [{ id: "deb1", nature: "Debentures", secured: true, amount: safe(n3.debentures), amountPrev: safe(n3.debenturesPrev) }] : []),
          ...(safe(n3.otherLTBorrowings) ? [{ id: "olt1", nature: "Other Long-term Borrowings", secured: false, amount: safe(n3.otherLTBorrowings), amountPrev: safe(n3.otherLTBorrowingsPrev) }] : []),
        ],
      },

      note4DeferredTax: {
        deferredTaxLiability: safe(n4.deferredTaxLiability),
        deferredTaxLiabilityPrev: safe(n4.deferredTaxLiabilityPrev),
        deferredTaxAsset: safe(n4.deferredTaxAsset),
        deferredTaxAssetPrev: safe(n4.deferredTaxAssetPrev),
      },

      note5LTProvisions: {
        provisionForGratuity: safe(n5.provisionForGratuity),
        provisionForGratuityPrev: safe(n5.provisionForGratuityPrev),
        provisionForLeaveEncashment: safe(n5.provisionForLeaveEncashment),
        provisionForLeaveEncashmentPrev: safe(n5.provisionForLeaveEncashmentPrev),
        otherProvisions: safe(n5.otherProvisions),
        otherProvisionsPrev: safe(n5.otherProvisionsPrev),
      },

      note6STBorrowings: {
        items: [
          ...(safe(n6.ccOdBank) ? [{ id: "cc1", nature: "Cash Credit / OD from Bank", secured: true, amount: safe(n6.ccOdBank), amountPrev: safe(n6.ccOdBankPrev) }] : []),
          ...(safe(n6.otherSTBorrowings) ? [{ id: "stb1", nature: "Other Short-term Borrowings", secured: false, amount: safe(n6.otherSTBorrowings), amountPrev: safe(n6.otherSTBorrowingsPrev) }] : []),
        ],
      },

      note7TradePayables: {
        ...INITIAL_BALANCE_SHEET_DATA.note7TradePayables,
        msmeAmount: safe(n7.msmeAmount),
        msmeAmountPrev: safe(n7.msmeAmountPrev),
        othersAmount: safe(n7.othersAmount),
        othersAmountPrev: safe(n7.othersAmountPrev),
      },

      note8OtherCurrentLiabilities: {
        currentMaturitiesLTBorrowings: safe(n8.currentMaturitiesLTBorrowings),
        currentMaturitiesLTBorrowingsPrev: safe(n8.currentMaturitiesLTBorrowingsPrev),
        interestAccrued: safe(n8.interestAccrued),
        interestAccruedPrev: safe(n8.interestAccruedPrev),
        advancesFromCustomers: safe(n8.advancesFromCustomers),
        advancesFromCustomersPrev: safe(n8.advancesFromCustomersPrev),
        statutoryDues: safe(n8.statutoryDues),
        statutoryDuesPrev: safe(n8.statutoryDuesPrev),
        otherPayables: safe(n8.otherPayables),
        otherPayablesPrev: safe(n8.otherPayablesPrev),
      },

      note9STProvisions: {
        provisionForTax: safe(n9.provisionForTax),
        provisionForTaxPrev: safe(n9.provisionForTaxPrev),
        proposedDividend: safe(n9.proposedDividend),
        proposedDividendPrev: safe(n9.proposedDividendPrev),
        otherProvisions: safe(n9.otherProvisions),
        otherProvisionsPrev: safe(n9.otherProvisionsPrev),
      },

      note10FixedAssets: {
        ...INITIAL_BALANCE_SHEET_DATA.note10FixedAssets,
        tangibleAssets: [
          makeAssetRow("land", "Land", "land", true),
          makeAssetRow("buildings", "Buildings", "buildings", true),
          makeAssetRow("plant", "Plant & Machinery", "plantMachinery", true),
          makeAssetRow("furniture", "Furniture & Fixtures", "furniture", true),
          makeAssetRow("vehicles", "Vehicles", "vehicles", true),
          makeAssetRow("office", "Office Equipment", "officeEquipment", true),
        ].filter(r => r.gbOpeningBalance || r.gbAdditions || r.gbClosingBalance || r.depForYear),
        intangibleAssets: [],
        cwip: safe(n10.cwip),
        cwipPrev: safe(n10.cwipPrev),
      },

      note12LTLoansAdvances: {
        securityDeposits: safe(n12.securityDeposits),
        securityDepositsPrev: safe(n12.securityDepositsPrev),
        capitalAdvances: safe(n12.capitalAdvances),
        capitalAdvancesPrev: safe(n12.capitalAdvancesPrev),
        otherLoansAdvances: safe(n12.otherLoansAdvances),
        otherLoansAdvancesPrev: safe(n12.otherLoansAdvancesPrev),
        loansToRelatedParties: "",
        loansToRelatedPartiesPrev: "",
      },

      note13OtherNonCurrentAssets: {
        longTermTradeReceivables: safe(n13.longTermTradeReceivables),
        longTermTradeReceivablesPrev: safe(n13.longTermTradeReceivablesPrev),
        otherNonCurrentAssets: safe(n13.otherNonCurrentAssets),
        otherNonCurrentAssetsPrev: safe(n13.otherNonCurrentAssetsPrev),
      },

      note14CurrentInvestments: {
        mutualFunds: safe(n14.mutualFunds),
        mutualFundsPrev: safe(n14.mutualFundsPrev),
        fixedDepositsMaturing12m: safe(n14.fixedDepositsMaturing12m),
        fixedDepositsMaturing12mPrev: safe(n14.fixedDepositsMaturing12mPrev),
        otherCurrentInvestments: safe(n14.otherCurrentInvestments),
        otherCurrentInvestmentsPrev: safe(n14.otherCurrentInvestmentsPrev),
      },

      note15Inventories: {
        ...INITIAL_BALANCE_SHEET_DATA.note15Inventories,
        rawMaterials: safe(n15.rawMaterials),
        rawMaterialsPrev: safe(n15.rawMaterialsPrev),
        workInProgress: safe(n15.workInProgress),
        workInProgressPrev: safe(n15.workInProgressPrev),
        finishedGoods: safe(n15.finishedGoods),
        finishedGoodsPrev: safe(n15.finishedGoodsPrev),
        stockInTrade: safe(n15.stockInTrade),
        stockInTradePrev: safe(n15.stockInTradePrev),
        storesSpares: safe(n15.storesSpares),
        storesSparesPrev: safe(n15.storesSparesPrev),
        looseTool: "",
        looseToolPrev: "",
      },

      note16TradeReceivables: {
        ...INITIAL_BALANCE_SHEET_DATA.note16TradeReceivables,
        outstandingMore6mSecured: "",
        outstandingMore6mSecuredPrev: "",
        outstandingMore6mUnsecured: safe(n16.outstandingMore6mUnsecured),
        outstandingMore6mUnsecuredPrev: safe(n16.outstandingMore6mUnsecuredPrev),
        outstandingMore6mDoubtful: "",
        outstandingMore6mDoubtfulPrev: "",
        outstandingLess6mSecured: "",
        outstandingLess6mSecuredPrev: "",
        outstandingLess6mUnsecured: safe(n16.outstandingLess6mUnsecured),
        outstandingLess6mUnsecuredPrev: safe(n16.outstandingLess6mUnsecuredPrev),
        provisionForDoubtful: safe(n16.provisionForDoubtful),
        provisionForDoubtfulPrev: safe(n16.provisionForDoubtfulPrev),
      },

      note17CashEquivalents: {
        cashOnHand: safe(n17.cashOnHand),
        cashOnHandPrev: safe(n17.cashOnHandPrev),
        balancesWithBanks: safe(n17.balancesWithBanks),
        balancesWithBanksPrev: safe(n17.balancesWithBanksPrev),
        fixedDepositsWithin3m: safe(n17.fixedDepositsWithin3m),
        fixedDepositsWithin3mPrev: safe(n17.fixedDepositsWithin3mPrev),
        chequesDraftsOnHand: safe(n17.chequesDraftsOnHand),
        chequesDraftsOnHandPrev: safe(n17.chequesDraftsOnHandPrev),
      },

      note18STLoansAdvances: {
        prepaidExpenses: safe(n18.prepaidExpenses),
        prepaidExpensesPrev: safe(n18.prepaidExpensesPrev),
        advancesToSuppliers: safe(n18.advancesToSuppliers),
        advancesToSuppliersPrev: safe(n18.advancesToSuppliersPrev),
        balanceWithGovernment: safe(n18.balanceWithGovernment),
        balanceWithGovernmentPrev: safe(n18.balanceWithGovernmentPrev),
        otherAdvances: safe(n18.otherAdvances),
        otherAdvancesPrev: safe(n18.otherAdvancesPrev),
      },

      note19OtherCurrentAssets: {
        interestAccruedOnDeposits: safe(n19.interestAccruedOnDeposits),
        interestAccruedOnDepositsPrev: safe(n19.interestAccruedOnDepositsPrev),
        otherCurrentAssets: safe(n19.otherCurrentAssets),
        otherCurrentAssetsPrev: safe(n19.otherCurrentAssetsPrev),
      },

      note20Revenue: {
        saleOfProducts: safe(n20.saleOfProducts),
        saleOfProductsPrev: safe(n20.saleOfProductsPrev),
        saleOfServices: safe(n20.saleOfServices),
        saleOfServicesPrev: safe(n20.saleOfServicesPrev),
        otherOperatingRevenue: safe(n20.otherOperatingRevenue),
        otherOperatingRevenuePrev: safe(n20.otherOperatingRevenuePrev),
        lessExciseDuty: "",
        lessExciseDutyPrev: "",
      },

      note21OtherIncome: {
        interestIncome: safe(n21.interestIncome),
        interestIncomePrev: safe(n21.interestIncomePrev),
        dividendIncome: safe(n21.dividendIncome),
        dividendIncomePrev: safe(n21.dividendIncomePrev),
        profitOnSaleOfAssets: safe(n21.profitOnSaleOfAssets),
        profitOnSaleOfAssetsPrev: safe(n21.profitOnSaleOfAssetsPrev),
        miscIncome: safe(n21.miscIncome),
        miscIncomePrev: safe(n21.miscIncomePrev),
      },

      note22Materials: {
        openingStock: safe(n22.openingStock),
        openingStockPrev: safe(n22.openingStockPrev),
        purchases: safe(n22.purchases),
        purchasesPrev: safe(n22.purchasesPrev),
        closingStock: safe(n22.closingStock),
        closingStockPrev: safe(n22.closingStockPrev),
      },

      note25EmployeeBenefits: {
        salariesWages: safe(n25.salariesWages),
        salariesWagesPrev: safe(n25.salariesWagesPrev),
        bonuses: safe(n25.bonuses),
        bonusesPrev: safe(n25.bonusesPrev),
        providentFund: safe(n25.providentFund),
        providentFundPrev: safe(n25.providentFundPrev),
        gratuity: safe(n25.gratuity),
        gratuityPrev: safe(n25.gratuityPrev),
        staffWelfare: safe(n25.staffWelfare),
        staffWelfarePrev: safe(n25.staffWelfarePrev),
        directorRemuneration: safe(n25.directorRemuneration),
        directorRemunerationPrev: safe(n25.directorRemunerationPrev),
      },

      note26FinanceCosts: {
        interestOnBorrowings: safe(n26.interestOnBorrowings),
        interestOnBorrowingsPrev: safe(n26.interestOnBorrowingsPrev),
        bankCharges: safe(n26.bankCharges),
        bankChargesPrev: safe(n26.bankChargesPrev),
        otherFinanceCosts: safe(n26.otherFinanceCosts),
        otherFinanceCostsPrev: safe(n26.otherFinanceCostsPrev),
      },

      note27Depreciation: {
        depreciation: safe(n27.depreciation),
        depreciationPrev: safe(n27.depreciationPrev),
        amortization: safe(n27.amortization),
        amortizationPrev: safe(n27.amortizationPrev),
      },

      note28OtherExpenses: {
        powerFuel: safe(n28.powerFuel),
        powerFuelPrev: safe(n28.powerFuelPrev),
        rent: safe(n28.rent),
        rentPrev: safe(n28.rentPrev),
        repairsMaintenance: safe(n28.repairsMaintenance),
        repairsMaintenancePrev: safe(n28.repairsMaintenancePrev),
        advertisingMarketing: safe(n28.advertisingMarketing),
        advertisingMarketingPrev: safe(n28.advertisingMarketingPrev),
        travellingConveyance: safe(n28.travellingConveyance),
        travellingConveyancePrev: safe(n28.travellingConveyancePrev),
        legalProfessional: safe(n28.legalProfessional),
        legalProfessionalPrev: safe(n28.legalProfessionalPrev),
        auditFees: safe(n28.auditFees),
        auditFeesPrev: safe(n28.auditFeesPrev),
        insurancePremium: safe(n28.insurancePremium),
        insurancePremiumPrev: safe(n28.insurancePremiumPrev),
        miscExpenses: safe(n28.miscExpenses),
        miscExpensesPrev: safe(n28.miscExpensesPrev),
      },

      currentTax: safe(extracted.currentTax),
      currentTaxPrev: safe(extracted.currentTaxPrev),
      deferredTaxCharge: safe(extracted.deferredTaxCharge),
      deferredTaxChargePrev: safe(extracted.deferredTaxChargePrev),
    };

    return NextResponse.json({ success: true, patch });
  } catch (e) {
    console.error("[bs-ai-fill]", e);
    return NextResponse.json({ error: "AI request failed. Please try again." }, { status: 500 });
  }
}
