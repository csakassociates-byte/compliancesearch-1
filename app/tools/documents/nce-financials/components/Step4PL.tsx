"use client";
import { NCEFinancialsData, SimpleLineItem, PartnersRemunerationItem, newSimpleItem } from "@/lib/nce-financials/types";

interface Props {
  data: NCEFinancialsData;
  update: (patch: Partial<NCEFinancialsData>) => void;
  fyLabels: { current: string; prev: string };
}

const inp = { padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, width: "100%", boxSizing: "border-box" as const, outline: "none", textAlign: "right" as const };
const inpL = { ...inp, textAlign: "left" as const };

function n(v: string | undefined | null) { return parseFloat(v ?? "") || 0; }

function SimpleTable({ items, onAdd, onRemove, onUpdate }: {
  items: SimpleLineItem[]; onAdd: () => void; onRemove: (id: string) => void; onUpdate: (id: string, p: Partial<SimpleLineItem>) => void;
}) {
  return (
    <div>
      {items.map(item => (
        <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px 36px", gap: 8, marginBottom: 8 }}>
          <input value={item.description} onChange={e => onUpdate(item.id, { description: e.target.value })} placeholder="Description" style={inpL} />
          <input value={item.amount} onChange={e => onUpdate(item.id, { amount: e.target.value })} placeholder="0" style={inp} />
          <input value={item.amountPrev} onChange={e => onUpdate(item.id, { amountPrev: e.target.value })} placeholder="0" style={{ ...inp, color: "#94a3b8" }} />
          <button onClick={() => onRemove(item.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>✕</button>
        </div>
      ))}
      <button onClick={onAdd} style={{ background: "#f0f9ff", color: "#0369a1", border: "1px dashed #bae6fd", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Add Row</button>
    </div>
  );
}

export default function Step4PL({ data, update, fyLabels }: Props) {
  const rev = data.note19Revenue;
  const mat = data.note21Materials;
  const emp = data.note22EmployeeBenefits;
  const fin = data.note23FinanceCosts;
  const dep = data.note24Depreciation;

  function card(title: string, noteNum: string, children: React.ReactNode) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 18px" }}>{noteNum} — {title}</h3>
        {children}
      </div>
    );
  }

  function row2(label_: string, curVal: string, prevVal: string, onCur: (v: string) => void, onPrev: (v: string) => void) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", gap: 8, marginBottom: 8, alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "#374151" }}>{label_}</div>
        <input value={curVal} onChange={e => onCur(e.target.value)} placeholder="0" style={inp} />
        <input value={prevVal} onChange={e => onPrev(e.target.value)} placeholder="0" style={{ ...inp, color: "#94a3b8" }} />
      </div>
    );
  }

  // Totals for P&L summary
  const totalRevenue = n(rev.saleOfGoods) + n(rev.saleOfServices) + n(rev.otherOperatingRevenue) +
    data.note20OtherIncome.reduce((s, x) => s + n(x.amount), 0);
  const cogsMat = n(mat.openingStock) + n(mat.purchases) + n(mat.directExpenses) - n(mat.closingStock);
  const totalEmp = n(emp.salariesWages) + n(emp.bonuses) + n(emp.pf) + n(emp.esi) + n(emp.gratuity) + n(emp.staffWelfare) + emp.items.reduce((s, x) => s + n(x.amount), 0);
  const totalFin = n(fin.interestOnBorrowings) + n(fin.bankCharges) + fin.items.reduce((s, x) => s + n(x.amount), 0);
  const totalDep = n(dep.depOnTangibleAssets) + n(dep.depOnIntangibleAssets) + n(dep.amortization);
  const totalOther = data.note25OtherExpenses.reduce((s, x) => s + n(x.amount), 0);
  const totalRemun = data.partnersRemuneration.reduce((s, x) => s + n(x.amount), 0);
  const totalExpenses = cogsMat + totalEmp + totalFin + totalDep + totalOther + totalRemun;
  const profitBeforeTax = totalRevenue - totalExpenses;
  const netProfit = profitBeforeTax - n(data.incomeTaxProvision) - n(data.deferredTaxCharge);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Column headers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", gap: 8, padding: "0 2px" }}>
        <div></div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#0369a1", textAlign: "right" as const }}>{fyLabels.current}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textAlign: "right" as const }}>{fyLabels.prev}</div>
      </div>

      {/* P&L Summary */}
      <div style={{ background: "linear-gradient(135deg,#0f172a,#1e3a5f)", borderRadius: 16, padding: "20px 24px", color: "#fff" }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>P&L Summary (Auto-calculated)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {[
            { label: "Total Revenue", value: totalRevenue, color: "#4ade80" },
            { label: "Total Expenses", value: totalExpenses, color: "#fb923c" },
            { label: profitBeforeTax >= 0 ? "Net Profit (Before Tax)" : "Net Loss (Before Tax)", value: Math.abs(profitBeforeTax), color: profitBeforeTax >= 0 ? "#34d399" : "#f87171" },
          ].map(({ label: lbl, value, color }) => (
            <div key={lbl} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>{lbl}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color }}>
                ₹{value.toLocaleString("en-IN")}
              </div>
            </div>
          ))}
        </div>
        {netProfit !== profitBeforeTax && (
          <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(255,255,255,0.06)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#94a3b8" }}>Net Profit / (Loss) after Tax</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: netProfit >= 0 ? "#4ade80" : "#f87171" }}>₹{Math.abs(netProfit).toLocaleString("en-IN")} {netProfit < 0 ? "(Loss)" : ""}</span>
          </div>
        )}
      </div>

      {/* Note 19: Revenue */}
      {card("Revenue from Operations", "Note 19", (
        <>
          {row2("Sale of Goods", rev.saleOfGoods, rev.saleOfGoodsPrev, v => update({ note19Revenue: { ...rev, saleOfGoods: v } }), v => update({ note19Revenue: { ...rev, saleOfGoodsPrev: v } }))}
          {row2("Sale of Services", rev.saleOfServices, rev.saleOfServicesPrev, v => update({ note19Revenue: { ...rev, saleOfServices: v } }), v => update({ note19Revenue: { ...rev, saleOfServicesPrev: v } }))}
          {row2("Other Operating Revenue", rev.otherOperatingRevenue, rev.otherOperatingRevenuePrev, v => update({ note19Revenue: { ...rev, otherOperatingRevenue: v } }), v => update({ note19Revenue: { ...rev, otherOperatingRevenuePrev: v } }))}
        </>
      ))}

      {/* Note 20: Other Income */}
      {card("Other Income", "Note 20", (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>INCOME HEAD</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#0369a1", textAlign: "right" as const }}>CURRENT (₹)</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textAlign: "right" as const }}>PREV (₹)</div>
          </div>
          <SimpleTable
            items={data.note20OtherIncome}
            onAdd={() => update({ note20OtherIncome: [...data.note20OtherIncome, newSimpleItem()] })}
            onRemove={id => update({ note20OtherIncome: data.note20OtherIncome.filter(x => x.id !== id) })}
            onUpdate={(id, p) => update({ note20OtherIncome: data.note20OtherIncome.map(x => x.id === id ? { ...x, ...p } : x) })}
          />
        </>
      ))}

      {/* Note 21: Cost of Materials */}
      {card("Cost of Materials Consumed / COGS", "Note 21", (
        <>
          {row2("Opening Stock", mat.openingStock, mat.openingStockPrev, v => update({ note21Materials: { ...mat, openingStock: v } }), v => update({ note21Materials: { ...mat, openingStockPrev: v } }))}
          {row2("Add: Purchases", mat.purchases, mat.purchasesPrev, v => update({ note21Materials: { ...mat, purchases: v } }), v => update({ note21Materials: { ...mat, purchasesPrev: v } }))}
          {row2("Add: Direct Expenses", mat.directExpenses, mat.directExpensesPrev, v => update({ note21Materials: { ...mat, directExpenses: v } }), v => update({ note21Materials: { ...mat, directExpensesPrev: v } }))}
          {row2("Less: Closing Stock", mat.closingStock, mat.closingStockPrev, v => update({ note21Materials: { ...mat, closingStock: v } }), v => update({ note21Materials: { ...mat, closingStockPrev: v } }))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", gap: 8, marginTop: 4, padding: "10px 0", borderTop: "2px solid #e2e8f0" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Cost of Materials Consumed</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", textAlign: "right" as const }}>{cogsMat.toLocaleString("en-IN")}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textAlign: "right" as const }}>
              {(n(mat.openingStockPrev) + n(mat.purchasesPrev) + n(mat.directExpensesPrev) - n(mat.closingStockPrev)).toLocaleString("en-IN")}
            </div>
          </div>
        </>
      ))}

      {/* Note 22: Employee Benefits */}
      {card("Employee Benefits Expense", "Note 22", (
        <>
          {[
            ["Salaries & Wages", emp.salariesWages, emp.salariesWagesPrev, (v: string) => update({ note22EmployeeBenefits: { ...emp, salariesWages: v } }), (v: string) => update({ note22EmployeeBenefits: { ...emp, salariesWagesPrev: v } })],
            ["Bonus", emp.bonuses, emp.bonusesPrev, (v: string) => update({ note22EmployeeBenefits: { ...emp, bonuses: v } }), (v: string) => update({ note22EmployeeBenefits: { ...emp, bonusesPrev: v } })],
            ["Provident Fund", emp.pf, emp.pfPrev, (v: string) => update({ note22EmployeeBenefits: { ...emp, pf: v } }), (v: string) => update({ note22EmployeeBenefits: { ...emp, pfPrev: v } })],
            ["ESI", emp.esi, emp.esiPrev, (v: string) => update({ note22EmployeeBenefits: { ...emp, esi: v } }), (v: string) => update({ note22EmployeeBenefits: { ...emp, esiPrev: v } })],
            ["Gratuity", emp.gratuity, emp.gratuityPrev, (v: string) => update({ note22EmployeeBenefits: { ...emp, gratuity: v } }), (v: string) => update({ note22EmployeeBenefits: { ...emp, gratuityPrev: v } })],
            ["Staff Welfare", emp.staffWelfare, emp.staffWelfarePrev, (v: string) => update({ note22EmployeeBenefits: { ...emp, staffWelfare: v } }), (v: string) => update({ note22EmployeeBenefits: { ...emp, staffWelfarePrev: v } })],
          ].map(([lbl, cur, prev, onCur, onPrev]) => row2(lbl as string, cur as string, prev as string, onCur as (v: string) => void, onPrev as (v: string) => void))}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Other Employee Benefits</div>
            <SimpleTable
              items={emp.items}
              onAdd={() => update({ note22EmployeeBenefits: { ...emp, items: [...emp.items, newSimpleItem()] } })}
              onRemove={id => update({ note22EmployeeBenefits: { ...emp, items: emp.items.filter(x => x.id !== id) } })}
              onUpdate={(id, p) => update({ note22EmployeeBenefits: { ...emp, items: emp.items.map(x => x.id === id ? { ...x, ...p } : x) } })}
            />
          </div>
        </>
      ))}

      {/* Note 23: Finance Costs */}
      {card("Finance Costs", "Note 23", (
        <>
          {row2("Interest on Borrowings", fin.interestOnBorrowings, fin.interestOnBorrowingsPrev, v => update({ note23FinanceCosts: { ...fin, interestOnBorrowings: v } }), v => update({ note23FinanceCosts: { ...fin, interestOnBorrowingsPrev: v } }))}
          {row2("Bank Charges & Commission", fin.bankCharges, fin.bankChargesPrev, v => update({ note23FinanceCosts: { ...fin, bankCharges: v } }), v => update({ note23FinanceCosts: { ...fin, bankChargesPrev: v } }))}
          <div style={{ marginTop: 8 }}>
            <SimpleTable
              items={fin.items}
              onAdd={() => update({ note23FinanceCosts: { ...fin, items: [...fin.items, newSimpleItem()] } })}
              onRemove={id => update({ note23FinanceCosts: { ...fin, items: fin.items.filter(x => x.id !== id) } })}
              onUpdate={(id, p) => update({ note23FinanceCosts: { ...fin, items: fin.items.map(x => x.id === id ? { ...x, ...p } : x) } })}
            />
          </div>
        </>
      ))}

      {/* Note 24: Depreciation */}
      {card("Depreciation & Amortization", "Note 24", (
        <>
          {row2("Depreciation on Tangible Assets", dep.depOnTangibleAssets, dep.depOnTangibleAssetsPrev, v => update({ note24Depreciation: { ...dep, depOnTangibleAssets: v } }), v => update({ note24Depreciation: { ...dep, depOnTangibleAssetsPrev: v } }))}
          {row2("Depreciation on Intangible Assets", dep.depOnIntangibleAssets, dep.depOnIntangibleAssetsPrev, v => update({ note24Depreciation: { ...dep, depOnIntangibleAssets: v } }), v => update({ note24Depreciation: { ...dep, depOnIntangibleAssetsPrev: v } }))}
          {row2("Amortization", dep.amortization, dep.amortizationPrev, v => update({ note24Depreciation: { ...dep, amortization: v } }), v => update({ note24Depreciation: { ...dep, amortizationPrev: v } }))}
          <div style={{ marginTop: 12, padding: "10px 12px", background: "#f0f9ff", borderRadius: 8, fontSize: 12, color: "#0369a1" }}>
            <strong>Tip:</strong> Enter depreciation for year directly here, OR it will be auto-populated when you set &quot;Dep for Year&quot; values in Note 11 Fixed Assets.
          </div>
        </>
      ))}

      {/* Note 25: Other Expenses */}
      {card("Other Expenses", "Note 25", (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>EXPENSE HEAD</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#0369a1", textAlign: "right" as const }}>CURRENT (₹)</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textAlign: "right" as const }}>PREV (₹)</div>
          </div>
          <SimpleTable
            items={data.note25OtherExpenses}
            onAdd={() => update({ note25OtherExpenses: [...data.note25OtherExpenses, newSimpleItem()] })}
            onRemove={id => update({ note25OtherExpenses: data.note25OtherExpenses.filter(x => x.id !== id) })}
            onUpdate={(id, p) => update({ note25OtherExpenses: data.note25OtherExpenses.map(x => x.id === id ? { ...x, ...p } : x) })}
          />
        </>
      ))}

      {/* Partners' Remuneration */}
      {data.entityType !== "proprietorship" && card("Partners' / Designated Partners' Remuneration", "Schedule", (
        <>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
            Remuneration paid/payable to partners as per Deed / LLP Agreement (deducted from P&L before computing tax)
          </div>
          {data.partnersRemuneration.length === 0 && (
            <div style={{ padding: "14px 16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, fontSize: 13, color: "#92400e", marginBottom: 14 }}>
              No remuneration entries. Go to Note 3 — Owners&apos; Capital and click &quot;Sync Remuneration to P&L&quot; to auto-populate, or add manually below.
            </div>
          )}
          {data.partnersRemuneration.map((item, idx) => (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px 36px", gap: 8, marginBottom: 8 }}>
              <input value={item.name} onChange={e => update({ partnersRemuneration: data.partnersRemuneration.map((x, i) => i === idx ? { ...x, name: e.target.value } : x) })} placeholder="Partner name" style={inpL} />
              <input value={item.amount} onChange={e => update({ partnersRemuneration: data.partnersRemuneration.map((x, i) => i === idx ? { ...x, amount: e.target.value } : x) })} placeholder="0" style={inp} />
              <input value={item.amountPrev} onChange={e => update({ partnersRemuneration: data.partnersRemuneration.map((x, i) => i === idx ? { ...x, amountPrev: e.target.value } : x) })} placeholder="0" style={{ ...inp, color: "#94a3b8" }} />
              <button onClick={() => update({ partnersRemuneration: data.partnersRemuneration.filter((_, i) => i !== idx) })} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>✕</button>
            </div>
          ))}
          <button onClick={() => update({ partnersRemuneration: [...data.partnersRemuneration, { id: crypto.randomUUID(), name: "", amount: "", amountPrev: "" } as PartnersRemunerationItem] })} style={{ marginTop: 4, background: "#f0f9ff", color: "#0369a1", border: "1px dashed #bae6fd", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Add Partner</button>
        </>
      ))}

      {/* Tax */}
      {card("Tax on Profit", "Tax", (
        <>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>Applicable if entity is liable to income tax (LLP, trust, AOP/BOI, HUF)</div>
          {row2("Current Year Income Tax Provision", data.incomeTaxProvision, data.incomeTaxProvisionPrev, v => update({ incomeTaxProvision: v }), v => update({ incomeTaxProvisionPrev: v }))}
          {row2("Deferred Tax Charge / (Credit)", data.deferredTaxCharge, data.deferredTaxChargePrev, v => update({ deferredTaxCharge: v }), v => update({ deferredTaxChargePrev: v }))}
        </>
      ))}

    </div>
  );
}
