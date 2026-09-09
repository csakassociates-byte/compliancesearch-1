"use client";
import { useState } from "react";
import type { BalanceSheetData } from "@/lib/balance-sheet/types";
import { n } from "@/lib/balance-sheet/types";

interface Props {
  data: BalanceSheetData;
  update: (patch: Partial<BalanceSheetData>) => void;
  updateNote: <K extends keyof BalanceSheetData>(key: K, patch: Partial<BalanceSheetData[K]>) => void;
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

const S = {
  num:    { width: "100%", border: "1px solid #d1d5db", borderRadius: 7, padding: "8px 10px", fontSize: 13, color: "#0f172a", background: "#fff", boxSizing: "border-box", textAlign: "right" } as React.CSSProperties,
  auto:   { width: "100%", border: "1px solid #d1d5db", borderRadius: 7, padding: "8px 10px", fontSize: 13, color: "#374151", background: "#f1f5f9", boxSizing: "border-box", textAlign: "right" } as React.CSSProperties,
  label:  { display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: "0.04em" },
  card:   { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, marginBottom: 18, overflow: "hidden" } as React.CSSProperties,
  head:   { background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" } as React.CSSProperties,
  body:   { padding: "18px" } as React.CSSProperties,
  total:  { fontWeight: 800, fontSize: 13, color: "#0f172a", textAlign: "right" as const, background: "#f1f5f9", borderRadius: 6, padding: "6px 10px", marginTop: 8 },
  divider:{ borderBottom: "1px solid #e2e8f0", margin: "10px 0" },
};

function NoteCard({ noteNo, title, children, defaultOpen = true }: { noteNo: string; title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={S.card}>
      <div style={S.head}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ background: "#7c3aed", color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 800 }}>Note {noteNo}</span>
          <span style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>{title}</span>
        </div>
        <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#94a3b8" }}>{open ? "▲" : "▼"}</button>
      </div>
      {open && <div style={S.body}>{children}</div>}
    </div>
  );
}

// Row: label | current yr | prev yr  (with optional column headers on first row)
function Row({ label, v1, v2, onChange1, onChange2, showHeaders, bold, autoVal }: {
  label: string; v1: string; v2: string;
  onChange1: (v: string) => void; onChange2: (v: string) => void;
  showHeaders?: boolean; bold?: boolean; autoVal?: boolean;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, alignItems: "end", marginBottom: 8 }}>
      <div style={{ fontSize: 13, fontWeight: bold ? 700 : 400, color: bold ? "#0f172a" : "#374151", paddingBottom: 8 }}>
        {showHeaders && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
            <span style={S.label}>Current Yr (₹)</span>
            <span style={S.label}>Prev Yr (₹)</span>
          </div>
        )}
        {label}
      </div>
      <input type="number" style={autoVal ? S.auto : S.num} readOnly={autoVal} value={v1} onChange={e => onChange1(e.target.value)} placeholder="0" />
      <input type="number" style={autoVal ? S.auto : S.num} readOnly={autoVal} value={v2} onChange={e => onChange2(e.target.value)} placeholder="0" />
    </div>
  );
}

// ── Note 20 — Revenue from Operations ────────────────────────────────────────

function Note20({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const d = data.note20Revenue;
  const u = (p: Partial<typeof d>) => updateNote("note20Revenue", p);
  const total    = n(d.saleOfProducts) + n(d.saleOfServices) + n(d.otherOperatingRevenue) - n(d.lessExciseDuty);
  const totalPrev= n(d.saleOfProductsPrev) + n(d.saleOfServicesPrev) + n(d.otherOperatingRevenuePrev) - n(d.lessExciseDutyPrev);
  return (
    <NoteCard noteNo="20" title="Revenue from Operations">
      <Row label="(a) Sale of Products" showHeaders v1={d.saleOfProducts} v2={d.saleOfProductsPrev} onChange1={v => u({ saleOfProducts: v })} onChange2={v => u({ saleOfProductsPrev: v })} />
      <Row label="(b) Sale of Services" v1={d.saleOfServices} v2={d.saleOfServicesPrev} onChange1={v => u({ saleOfServices: v })} onChange2={v => u({ saleOfServicesPrev: v })} />
      <Row label="(c) Other Operating Revenue" v1={d.otherOperatingRevenue} v2={d.otherOperatingRevenuePrev} onChange1={v => u({ otherOperatingRevenue: v })} onChange2={v => u({ otherOperatingRevenuePrev: v })} />
      <Row label="Less: Excise Duty" v1={d.lessExciseDuty} v2={d.lessExciseDutyPrev} onChange1={v => u({ lessExciseDuty: v })} onChange2={v => u({ lessExciseDutyPrev: v })} />
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 13, paddingBottom: 6 }}>Total Revenue from Operations</div>
        <div style={S.total}>{total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
        <div style={S.total}>{totalPrev.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
      </div>
    </NoteCard>
  );
}

// ── Note 21 — Other Income ────────────────────────────────────────────────────

function Note21({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const d = data.note21OtherIncome;
  const u = (p: Partial<typeof d>) => updateNote("note21OtherIncome", p);
  const total     = n(d.interestIncome) + n(d.dividendIncome) + n(d.profitOnSaleOfAssets) + n(d.miscIncome);
  const totalPrev = n(d.interestIncomePrev) + n(d.dividendIncomePrev) + n(d.profitOnSaleOfAssetsPrev) + n(d.miscIncomePrev);
  return (
    <NoteCard noteNo="21" title="Other Income">
      <Row label="(a) Interest Income" showHeaders v1={d.interestIncome} v2={d.interestIncomePrev} onChange1={v => u({ interestIncome: v })} onChange2={v => u({ interestIncomePrev: v })} />
      <Row label="(b) Dividend Income" v1={d.dividendIncome} v2={d.dividendIncomePrev} onChange1={v => u({ dividendIncome: v })} onChange2={v => u({ dividendIncomePrev: v })} />
      <Row label="(c) Profit on Sale of Assets" v1={d.profitOnSaleOfAssets} v2={d.profitOnSaleOfAssetsPrev} onChange1={v => u({ profitOnSaleOfAssets: v })} onChange2={v => u({ profitOnSaleOfAssetsPrev: v })} />
      <Row label="(d) Miscellaneous Income" v1={d.miscIncome} v2={d.miscIncomePrev} onChange1={v => u({ miscIncome: v })} onChange2={v => u({ miscIncomePrev: v })} />
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 13, paddingBottom: 6 }}>Total Other Income</div>
        <div style={S.total}>{total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
        <div style={S.total}>{totalPrev.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
      </div>
    </NoteCard>
  );
}

// ── Note 22 — Cost of Materials ───────────────────────────────────────────────

function Note22({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const d = data.note22Materials;
  const u = (p: Partial<typeof d>) => updateNote("note22Materials", p);
  const consumed     = n(d.openingStock)     + n(d.purchases)     - n(d.closingStock);
  const consumedPrev = n(d.openingStockPrev) + n(d.purchasesPrev) - n(d.closingStockPrev);
  return (
    <NoteCard noteNo="22" title="Cost of Materials Consumed">
      <Row label="Opening Stock of Raw Materials" showHeaders v1={d.openingStock} v2={d.openingStockPrev} onChange1={v => u({ openingStock: v })} onChange2={v => u({ openingStockPrev: v })} />
      <Row label="Add: Purchases" v1={d.purchases} v2={d.purchasesPrev} onChange1={v => u({ purchases: v })} onChange2={v => u({ purchasesPrev: v })} />
      <Row label="Less: Closing Stock" v1={d.closingStock} v2={d.closingStockPrev} onChange1={v => u({ closingStock: v })} onChange2={v => u({ closingStockPrev: v })} />
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 13, paddingBottom: 6 }}>Materials Consumed (auto)</div>
        <div style={S.total}>{consumed.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
        <div style={S.total}>{consumedPrev.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
      </div>
    </NoteCard>
  );
}

// ── Note 23 — Purchases of Stock-in-Trade ────────────────────────────────────

function Note23({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const d = data.note23PurchasesStockInTrade;
  const u = (p: Partial<typeof d>) => updateNote("note23PurchasesStockInTrade", p);
  return (
    <NoteCard noteNo="23" title="Purchases of Stock-in-Trade" defaultOpen={false}>
      <Row label="Purchases of Stock-in-Trade" showHeaders v1={d.purchases} v2={d.purchasesPrev} onChange1={v => u({ purchases: v })} onChange2={v => u({ purchasesPrev: v })} />
    </NoteCard>
  );
}

// ── Note 24 — Changes in Inventories ─────────────────────────────────────────

function Note24({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const d = data.note24InventoryChanges;
  const u = (p: Partial<typeof d>) => updateNote("note24InventoryChanges", p);
  // Change = Opening - Closing (positive = decrease in inventory = income)
  const change     = (n(d.openingFinishedGoods) + n(d.openingWIP) + n(d.openingStockInTrade)) - (n(d.closingFinishedGoods) + n(d.closingWIP) + n(d.closingStockInTrade));
  const changePrev = (n(d.openingFinishedGoodsPrev) + n(d.openingWIPPrev) + n(d.openingStockInTradePrev)) - (n(d.closingFinishedGoodsPrev) + n(d.closingWIPPrev) + n(d.closingStockInTradePrev));
  return (
    <NoteCard noteNo="24" title="Changes in Inventories of Finished Goods, WIP & Stock-in-Trade" defaultOpen={false}>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>Positive value = decrease in inventory (expense reduced). Negative = increase.</div>
      <div style={{ fontWeight: 700, fontSize: 12, color: "#374151", margin: "10px 0 6px" }}>Opening Stock</div>
      <Row label="Finished Goods" showHeaders v1={d.openingFinishedGoods} v2={d.openingFinishedGoodsPrev} onChange1={v => u({ openingFinishedGoods: v })} onChange2={v => u({ openingFinishedGoodsPrev: v })} />
      <Row label="Work-in-Progress" v1={d.openingWIP} v2={d.openingWIPPrev} onChange1={v => u({ openingWIP: v })} onChange2={v => u({ openingWIPPrev: v })} />
      <Row label="Stock-in-Trade" v1={d.openingStockInTrade} v2={d.openingStockInTradePrev} onChange1={v => u({ openingStockInTrade: v })} onChange2={v => u({ openingStockInTradePrev: v })} />
      <div style={S.divider} />
      <div style={{ fontWeight: 700, fontSize: 12, color: "#374151", margin: "10px 0 6px" }}>Closing Stock</div>
      <Row label="Finished Goods" v1={d.closingFinishedGoods} v2={d.closingFinishedGoodsPrev} onChange1={v => u({ closingFinishedGoods: v })} onChange2={v => u({ closingFinishedGoodsPrev: v })} />
      <Row label="Work-in-Progress" v1={d.closingWIP} v2={d.closingWIPPrev} onChange1={v => u({ closingWIP: v })} onChange2={v => u({ closingWIPPrev: v })} />
      <Row label="Stock-in-Trade" v1={d.closingStockInTrade} v2={d.closingStockInTradePrev} onChange1={v => u({ closingStockInTrade: v })} onChange2={v => u({ closingStockInTradePrev: v })} />
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 13, paddingBottom: 6 }}>Net Change (Opening − Closing)</div>
        <div style={S.total}>{change.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
        <div style={S.total}>{changePrev.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
      </div>
    </NoteCard>
  );
}

// ── Note 25 — Employee Benefits ───────────────────────────────────────────────

function Note25({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const d = data.note25EmployeeBenefits;
  const u = (p: Partial<typeof d>) => updateNote("note25EmployeeBenefits", p);
  const total     = n(d.salariesWages) + n(d.bonuses) + n(d.providentFund) + n(d.gratuity) + n(d.staffWelfare) + n(d.directorRemuneration);
  const totalPrev = n(d.salariesWagesPrev) + n(d.bonusesPrev) + n(d.providentFundPrev) + n(d.gratuityPrev) + n(d.staffWelfarePrev) + n(d.directorRemunerationPrev);
  return (
    <NoteCard noteNo="25" title="Employee Benefits Expense">
      <Row label="(a) Salaries, Wages & Allowances" showHeaders v1={d.salariesWages} v2={d.salariesWagesPrev} onChange1={v => u({ salariesWages: v })} onChange2={v => u({ salariesWagesPrev: v })} />
      <Row label="(b) Bonuses" v1={d.bonuses} v2={d.bonusesPrev} onChange1={v => u({ bonuses: v })} onChange2={v => u({ bonusesPrev: v })} />
      <Row label="(c) Provident Fund Contribution" v1={d.providentFund} v2={d.providentFundPrev} onChange1={v => u({ providentFund: v })} onChange2={v => u({ providentFundPrev: v })} />
      <Row label="(d) Gratuity" v1={d.gratuity} v2={d.gratuityPrev} onChange1={v => u({ gratuity: v })} onChange2={v => u({ gratuityPrev: v })} />
      <Row label="(e) Staff Welfare" v1={d.staffWelfare} v2={d.staffWelfarePrev} onChange1={v => u({ staffWelfare: v })} onChange2={v => u({ staffWelfarePrev: v })} />
      <Row label="(f) Director Remuneration (incl. sitting fees)" v1={d.directorRemuneration} v2={d.directorRemunerationPrev} onChange1={v => u({ directorRemuneration: v })} onChange2={v => u({ directorRemunerationPrev: v })} />
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 13, paddingBottom: 6 }}>Total Employee Benefits Expense</div>
        <div style={S.total}>{total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
        <div style={S.total}>{totalPrev.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
      </div>
    </NoteCard>
  );
}

// ── Note 26 — Finance Costs ───────────────────────────────────────────────────

function Note26({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const d = data.note26FinanceCosts;
  const u = (p: Partial<typeof d>) => updateNote("note26FinanceCosts", p);
  const total     = n(d.interestOnBorrowings) + n(d.bankCharges) + n(d.otherFinanceCosts);
  const totalPrev = n(d.interestOnBorrowingsPrev) + n(d.bankChargesPrev) + n(d.otherFinanceCostsPrev);
  return (
    <NoteCard noteNo="26" title="Finance Costs">
      <Row label="(a) Interest on Borrowings" showHeaders v1={d.interestOnBorrowings} v2={d.interestOnBorrowingsPrev} onChange1={v => u({ interestOnBorrowings: v })} onChange2={v => u({ interestOnBorrowingsPrev: v })} />
      <Row label="(b) Bank Charges & Processing Fees" v1={d.bankCharges} v2={d.bankChargesPrev} onChange1={v => u({ bankCharges: v })} onChange2={v => u({ bankChargesPrev: v })} />
      <Row label="(c) Other Finance Costs" v1={d.otherFinanceCosts} v2={d.otherFinanceCostsPrev} onChange1={v => u({ otherFinanceCosts: v })} onChange2={v => u({ otherFinanceCostsPrev: v })} />
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 13, paddingBottom: 6 }}>Total Finance Costs</div>
        <div style={S.total}>{total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
        <div style={S.total}>{totalPrev.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
      </div>
    </NoteCard>
  );
}

// ── Note 27 — Depreciation ────────────────────────────────────────────────────

function Note27({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const d = data.note27Depreciation;
  const u = (p: Partial<typeof d>) => updateNote("note27Depreciation", p);

  // Auto-fill depreciation from fixed assets if available
  const autoDepreciation = [
    ...data.note10FixedAssets.tangibleAssets.map(r => n(r.depForYear)),
    ...data.note10FixedAssets.intangibleAssets.map(r => n(r.depForYear)),
  ].reduce((s, v) => s + v, 0).toFixed(2);

  const total     = n(d.depreciation) + n(d.amortization);
  const totalPrev = n(d.depreciationPrev) + n(d.amortizationPrev);

  return (
    <NoteCard noteNo="27" title="Depreciation & Amortization Expense">
      {parseFloat(autoDepreciation) > 0 && (
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: "#166534" }}>
          Auto-computed from Note 10 Fixed Assets: <strong>₹{parseFloat(autoDepreciation).toLocaleString("en-IN")}</strong>
          <button
            onClick={() => u({ depreciation: autoDepreciation })}
            style={{ marginLeft: 12, background: "#059669", color: "#fff", border: "none", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
          >
            Use This Value
          </button>
        </div>
      )}
      <Row label="(a) Depreciation on Tangible Assets" showHeaders v1={d.depreciation} v2={d.depreciationPrev} onChange1={v => u({ depreciation: v })} onChange2={v => u({ depreciationPrev: v })} />
      <Row label="(b) Amortization on Intangible Assets" v1={d.amortization} v2={d.amortizationPrev} onChange1={v => u({ amortization: v })} onChange2={v => u({ amortizationPrev: v })} />
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 13, paddingBottom: 6 }}>Total Depreciation & Amortization</div>
        <div style={S.total}>{total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
        <div style={S.total}>{totalPrev.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
      </div>
    </NoteCard>
  );
}

// ── Note 28 — Other Expenses ──────────────────────────────────────────────────

function Note28({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const d = data.note28OtherExpenses;
  const u = (p: Partial<typeof d>) => updateNote("note28OtherExpenses", p);
  const items = [
    { label: "(a) Power & Fuel",                   cur: d.powerFuel,              prev: d.powerFuelPrev,              k1: "powerFuel" as const,              k2: "powerFuelPrev" as const },
    { label: "(b) Rent",                            cur: d.rent,                   prev: d.rentPrev,                   k1: "rent" as const,                   k2: "rentPrev" as const },
    { label: "(c) Repairs & Maintenance",           cur: d.repairsMaintenance,     prev: d.repairsMaintenancePrev,     k1: "repairsMaintenance" as const,     k2: "repairsMaintenancePrev" as const },
    { label: "(d) Advertising & Marketing",         cur: d.advertisingMarketing,   prev: d.advertisingMarketingPrev,   k1: "advertisingMarketing" as const,   k2: "advertisingMarketingPrev" as const },
    { label: "(e) Travelling & Conveyance",         cur: d.travellingConveyance,   prev: d.travellingConveyancePrev,   k1: "travellingConveyance" as const,   k2: "travellingConveyancePrev" as const },
    { label: "(f) Legal & Professional Charges",    cur: d.legalProfessional,      prev: d.legalProfessionalPrev,      k1: "legalProfessional" as const,      k2: "legalProfessionalPrev" as const },
    { label: "(g) Audit Fees",                      cur: d.auditFees,              prev: d.auditFeesPrev,              k1: "auditFees" as const,              k2: "auditFeesPrev" as const },
    { label: "(h) Insurance Premium",               cur: d.insurancePremium,       prev: d.insurancePremiumPrev,       k1: "insurancePremium" as const,       k2: "insurancePremiumPrev" as const },
    { label: "(i) Miscellaneous Expenses",          cur: d.miscExpenses,           prev: d.miscExpensesPrev,           k1: "miscExpenses" as const,           k2: "miscExpensesPrev" as const },
  ];
  const total     = items.reduce((s, i) => s + n(i.cur),  0);
  const totalPrev = items.reduce((s, i) => s + n(i.prev), 0);

  return (
    <NoteCard noteNo="28" title="Other Expenses">
      {items.map((item, idx) => (
        <Row key={item.k1} label={item.label} showHeaders={idx === 0}
          v1={item.cur} v2={item.prev}
          onChange1={v => u({ [item.k1]: v } as Partial<typeof d>)}
          onChange2={v => u({ [item.k2]: v } as Partial<typeof d>)}
        />
      ))}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 13, paddingBottom: 6 }}>Total Other Expenses</div>
        <div style={S.total}>{total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
        <div style={S.total}>{totalPrev.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
      </div>
    </NoteCard>
  );
}

// ── P&L Summary (read-only computed) ─────────────────────────────────────────

function PLSummary({ data, update }: { data: BalanceSheetData; update: Props["update"] }) {
  const r20 = data.note20Revenue; const r21 = data.note21OtherIncome;
  const r22 = data.note22Materials; const r23 = data.note23PurchasesStockInTrade;
  const r24 = data.note24InventoryChanges; const r25 = data.note25EmployeeBenefits;
  const r26 = data.note26FinanceCosts; const r27 = data.note27Depreciation;
  const r28 = data.note28OtherExpenses;

  const revenue     = n(r20.saleOfProducts) + n(r20.saleOfServices) + n(r20.otherOperatingRevenue) - n(r20.lessExciseDuty);
  const otherIncome = n(r21.interestIncome) + n(r21.dividendIncome) + n(r21.profitOnSaleOfAssets) + n(r21.miscIncome);
  const totalRev    = revenue + otherIncome;

  const materials   = n(r22.openingStock) + n(r22.purchases) - n(r22.closingStock);
  const purchases   = n(r23.purchases);
  const invChange   = (n(r24.openingFinishedGoods) + n(r24.openingWIP) + n(r24.openingStockInTrade)) - (n(r24.closingFinishedGoods) + n(r24.closingWIP) + n(r24.closingStockInTrade));
  const employee    = n(r25.salariesWages) + n(r25.bonuses) + n(r25.providentFund) + n(r25.gratuity) + n(r25.staffWelfare) + n(r25.directorRemuneration);
  const finance     = n(r26.interestOnBorrowings) + n(r26.bankCharges) + n(r26.otherFinanceCosts);
  const deprec      = n(r27.depreciation) + n(r27.amortization);
  const other       = n(r28.powerFuel) + n(r28.rent) + n(r28.repairsMaintenance) + n(r28.advertisingMarketing) + n(r28.travellingConveyance) + n(r28.legalProfessional) + n(r28.auditFees) + n(r28.insurancePremium) + n(r28.miscExpenses);
  const totalExp    = materials + purchases + invChange + employee + finance + deprec + other;

  const pbt = totalRev - totalExp;
  const tax = n(data.currentTax) + n(data.deferredTaxCharge);
  const pat = pbt - tax;

  const SummaryRow = ({ label, val, bold, indent }: { label: string; val: number; bold?: boolean; indent?: boolean }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f1f5f9", paddingLeft: indent ? 16 : 0 }}>
      <span style={{ fontSize: 13, fontWeight: bold ? 800 : 400, color: bold ? "#0f172a" : "#374151" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: bold ? 800 : 600, color: bold ? (val >= 0 ? "#059669" : "#dc2626") : "#374151", fontVariantNumeric: "tabular-nums" }}>
        {val < 0 ? "(" : ""}{Math.abs(val).toLocaleString("en-IN", { maximumFractionDigits: 2 })}{val < 0 ? ")" : ""}
      </span>
    </div>
  );

  return (
    <div style={{ background: "#fff", border: "2px solid #0f172a", borderRadius: 14, overflow: "hidden", marginBottom: 18 }}>
      <div style={{ background: "#0f172a", padding: "12px 18px" }}>
        <span style={{ color: "#fff", fontWeight: 900, fontSize: 14 }}>📊 P&L Summary (auto-computed)</span>
      </div>
      <div style={{ padding: 18 }}>
        <SummaryRow label="Revenue from Operations" val={revenue} />
        <SummaryRow label="Other Income" val={otherIncome} indent />
        <SummaryRow label="Total Revenue (I)" val={totalRev} bold />
        <div style={{ height: 8 }} />
        <SummaryRow label="Cost of Materials Consumed" val={materials} indent />
        <SummaryRow label="Purchases of Stock-in-Trade" val={purchases} indent />
        <SummaryRow label="Changes in Inventories" val={invChange} indent />
        <SummaryRow label="Employee Benefits Expense" val={employee} indent />
        <SummaryRow label="Finance Costs" val={finance} indent />
        <SummaryRow label="Depreciation & Amortization" val={deprec} indent />
        <SummaryRow label="Other Expenses" val={other} indent />
        <SummaryRow label="Total Expenses (II)" val={totalExp} bold />
        <div style={{ height: 8 }} />
        <SummaryRow label="Profit Before Tax (I − II)" val={pbt} bold />
        <div style={{ height: 8 }} />

        {/* Tax inputs */}
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, margin: "10px 0" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tax Expense</div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, alignItems: "end", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "#374151" }}>Current Tax</div>
            <input type="number" style={S.num} value={data.currentTax} onChange={e => update({ currentTax: e.target.value })} placeholder="0" />
            <input type="number" style={S.num} value={data.currentTaxPrev} onChange={e => update({ currentTaxPrev: e.target.value })} placeholder="0" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, alignItems: "end" }}>
            <div style={{ fontSize: 13, color: "#374151" }}>Deferred Tax Charge / (Credit)</div>
            <input type="number" style={S.num} value={data.deferredTaxCharge} onChange={e => update({ deferredTaxCharge: e.target.value })} placeholder="0" />
            <input type="number" style={S.num} value={data.deferredTaxChargePrev} onChange={e => update({ deferredTaxChargePrev: e.target.value })} placeholder="0" />
          </div>
        </div>

        <SummaryRow label={`Profit After Tax ${pat >= 0 ? "(Net Profit)" : "(Net Loss)"}`} val={pat} bold />

        {pat !== 0 && (
          <div style={{ marginTop: 10, fontSize: 12, color: "#64748b", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "8px 12px" }}>
            ℹ️ Transfer this Net Profit/Loss to <strong>Note 2 → Surplus → Net Profit for the year</strong> field.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export default function Step3PL({ data, update, updateNote }: Props) {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#7e22ce", fontWeight: 600, marginBottom: 18 }}>
        📈 <strong>Profit & Loss Notes</strong> — Fill Notes 20 to 28. The P&L Summary at the bottom auto-computes. All amounts in ₹ ({data.displayUnit}).
      </div>

      <PLSummary data={data} update={update} />

      <Note20 data={data} updateNote={updateNote} />
      <Note21 data={data} updateNote={updateNote} />
      <Note22 data={data} updateNote={updateNote} />
      <Note23 data={data} updateNote={updateNote} />
      <Note24 data={data} updateNote={updateNote} />
      <Note25 data={data} updateNote={updateNote} />
      <Note26 data={data} updateNote={updateNote} />
      <Note27 data={data} updateNote={updateNote} />
      <Note28 data={data} updateNote={updateNote} />
    </div>
  );
}
