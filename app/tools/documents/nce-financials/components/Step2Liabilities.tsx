"use client";
import { NCEFinancialsData, BorrowingItem, TradePayableItem, SimpleLineItem, newBorrowingItem, newTradePayable, newSimpleItem } from "@/lib/nce-financials/types";

interface Props {
  data: NCEFinancialsData;
  update: (patch: Partial<NCEFinancialsData>) => void;
  fyLabels: { current: string; prev: string };
}

const inp = { padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, width: "100%", boxSizing: "border-box" as const, outline: "none" };
const inpR = { ...inp, textAlign: "right" as const };
const th = { padding: "9px 10px", fontSize: 11, fontWeight: 700 as const, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.05em", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" };
const td = { padding: "7px 8px", borderBottom: "1px solid #f1f5f9", verticalAlign: "middle" as const };

const BORROWING_CATEGORIES = ["Term Loan from Bank", "Working Capital Loan", "Vehicle Loan", "Loan from Partners/Directors", "Loan from Friends/Relatives", "ICDs from Related Parties", "Other Loans"];

function SimpleItemTable({ items, onAdd, onRemove, onUpdate }: {
  items: SimpleLineItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<SimpleLineItem>) => void;
}) {
  return (
    <div>
      {items.map(item => (
        <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px 36px", gap: 8, marginBottom: 8 }}>
          <input value={item.description} onChange={e => onUpdate(item.id, { description: e.target.value })} placeholder="Description" style={inp} />
          <input value={item.amount} onChange={e => onUpdate(item.id, { amount: e.target.value })} placeholder="0" style={inpR} />
          <input value={item.amountPrev} onChange={e => onUpdate(item.id, { amountPrev: e.target.value })} placeholder="0" style={{ ...inpR, color: "#94a3b8" }} />
          <button onClick={() => onRemove(item.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>✕</button>
        </div>
      ))}
      <button onClick={onAdd} style={{ background: "#f0f9ff", color: "#0369a1", border: "1px dashed #bae6fd", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Add Row</button>
    </div>
  );
}

function BorrowingSection({ title, items, onAdd, onRemove, onUpdate }: {
  title: string; items: BorrowingItem[];
  onAdd: () => void; onRemove: (id: string) => void; onUpdate: (id: string, p: Partial<BorrowingItem>) => void;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{title}</div>
        <button onClick={onAdd} style={{ background: "#f0fdf4", color: "#059669", border: "1px dashed #86efac", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Add</button>
      </div>
      {items.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: "left" }}>Category</th>
                <th style={{ ...th, textAlign: "left" }}>Lender Name</th>
                <th style={th}>Rate %</th>
                <th style={{ ...th, textAlign: "left" }}>Repayment Terms</th>
                <th style={th}>Amount (₹)</th>
                <th style={th}>Prev Year (₹)</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={td}>
                    <select value={item.category} onChange={e => onUpdate(item.id, { category: e.target.value })} style={inp}>
                      <option value="">Select...</option>
                      {BORROWING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td style={td}><input value={item.name} onChange={e => onUpdate(item.id, { name: e.target.value })} placeholder="Name" style={inp} /></td>
                  <td style={td}><input value={item.rate} onChange={e => onUpdate(item.id, { rate: e.target.value })} placeholder="0.00" style={inpR} /></td>
                  <td style={td}><input value={item.tenure} onChange={e => onUpdate(item.id, { tenure: e.target.value })} placeholder="e.g. Monthly EMI" style={inp} /></td>
                  <td style={td}><input value={item.amount} onChange={e => onUpdate(item.id, { amount: e.target.value })} placeholder="0" style={inpR} /></td>
                  <td style={td}><input value={item.amountPrev} onChange={e => onUpdate(item.id, { amountPrev: e.target.value })} placeholder="0" style={{ ...inpR, color: "#94a3b8" }} /></td>
                  <td style={td}><button onClick={() => onRemove(item.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {items.length === 0 && <p style={{ fontSize: 12, color: "#94a3b8", margin: "8px 0 0" }}>No entries. Click + Add to add.</p>}
    </div>
  );
}

export default function Step2Liabilities({ data, update, fyLabels }: Props) {
  const b = data.note5Borrowings;

  function updateBorrowing(section: keyof typeof b, id: string, patch: Partial<BorrowingItem>) {
    update({ note5Borrowings: { ...b, [section]: b[section].map((x: BorrowingItem) => x.id === id ? { ...x, ...patch } : x) } });
  }
  function addBorrowing(section: keyof typeof b) {
    update({ note5Borrowings: { ...b, [section]: [...b[section], newBorrowingItem()] } });
  }
  function removeBorrowing(section: keyof typeof b, id: string) {
    update({ note5Borrowings: { ...b, [section]: b[section].filter((x: BorrowingItem) => x.id !== id) } });
  }

  function updateTPItem(id: string, patch: Partial<TradePayableItem>) {
    update({ note9TradePayables: { items: data.note9TradePayables.items.map(x => x.id === id ? { ...x, ...patch } : x) } });
  }

  const note8 = data.note8Provisions;
  function updateNote8(key: keyof typeof note8, val: string) {
    update({ note8Provisions: { ...note8, [key]: val } });
  }

  const note10 = data.note10OtherCL;
  function updateNote10(key: keyof typeof note10, val: string) {
    update({ note10OtherCL: { ...note10, [key]: val } as typeof note10 });
  }

  function card(title: string, noteNum: string, children: React.ReactNode) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 18px" }}>{noteNum} — {title}</h3>
        {children}
      </div>
    );
  }

  function amtRow(label_: string, curKey: keyof typeof note8, prevKey: keyof typeof note8) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", gap: 8, marginBottom: 8, alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "#374151" }}>{label_}</div>
        <input value={String(note8[curKey] ?? "")} onChange={e => updateNote8(curKey, e.target.value)} placeholder="0" style={inpR} />
        <input value={String(note8[prevKey] ?? "")} onChange={e => updateNote8(prevKey, e.target.value)} placeholder="0" style={{ ...inpR, color: "#94a3b8" }} />
      </div>
    );
  }

  function n10Row(label_: string, curKey: keyof typeof note10, prevKey: keyof typeof note10) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", gap: 8, marginBottom: 8, alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "#374151" }}>{label_}</div>
        <input value={String(note10[curKey] ?? "")} onChange={e => updateNote10(curKey, e.target.value)} placeholder="0" style={inpR} />
        <input value={String(note10[prevKey] ?? "")} onChange={e => updateNote10(prevKey, e.target.value)} placeholder="0" style={{ ...inpR, color: "#94a3b8" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header row for columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", gap: 8, padding: "0 2px" }}>
        <div></div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#0369a1", textAlign: "right" as const }}>{fyLabels.current}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textAlign: "right" as const }}>{fyLabels.prev}</div>
      </div>

      {/* Note 5: Borrowings */}
      {card("Borrowings", "Note 5", (
        <>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>Long-term and short-term borrowings (secured and unsecured)</div>
          <BorrowingSection
            title="Long-term Secured Borrowings"
            items={b.ltSecured}
            onAdd={() => addBorrowing("ltSecured")}
            onRemove={id => removeBorrowing("ltSecured", id)}
            onUpdate={(id, p) => updateBorrowing("ltSecured", id, p)}
          />
          <BorrowingSection
            title="Long-term Unsecured Borrowings"
            items={b.ltUnsecured}
            onAdd={() => addBorrowing("ltUnsecured")}
            onRemove={id => removeBorrowing("ltUnsecured", id)}
            onUpdate={(id, p) => updateBorrowing("ltUnsecured", id, p)}
          />
          <BorrowingSection
            title="Short-term Secured Borrowings"
            items={b.stSecured}
            onAdd={() => addBorrowing("stSecured")}
            onRemove={id => removeBorrowing("stSecured", id)}
            onUpdate={(id, p) => updateBorrowing("stSecured", id, p)}
          />
          <BorrowingSection
            title="Short-term Unsecured Borrowings"
            items={b.stUnsecured}
            onAdd={() => addBorrowing("stUnsecured")}
            onRemove={id => removeBorrowing("stUnsecured", id)}
            onUpdate={(id, p) => updateBorrowing("stUnsecured", id, p)}
          />
        </>
      ))}

      {/* Note 6: Deferred Tax */}
      {card("Deferred Tax Liability (Net)", "Note 6", (
        <div>
          {[
            ["Deferred Tax Liability", "deferredTaxLiability", "deferredTaxLiabilityPrev"],
            ["Less: Deferred Tax Asset", "deferredTaxAsset", "deferredTaxAssetPrev"],
          ].map(([lbl, cur, prev]) => (
            <div key={String(cur)} style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <div style={{ fontSize: 13, color: "#374151" }}>{lbl}</div>
              <input value={String(data.note6DeferredTax[cur as keyof typeof data.note6DeferredTax] ?? "")} onChange={e => update({ note6DeferredTax: { ...data.note6DeferredTax, [cur as string]: e.target.value } })} placeholder="0" style={inpR} />
              <input value={String(data.note6DeferredTax[prev as keyof typeof data.note6DeferredTax] ?? "")} onChange={e => update({ note6DeferredTax: { ...data.note6DeferredTax, [prev as string]: e.target.value } })} placeholder="0" style={{ ...inpR, color: "#94a3b8" }} />
            </div>
          ))}
        </div>
      ))}

      {/* Note 7: Other LT Liabilities */}
      {card("Other Long-term Liabilities", "Note 7", (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>DESCRIPTION</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#0369a1", textAlign: "right" as const }}>CURRENT (₹)</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textAlign: "right" as const }}>PREV (₹)</div>
          </div>
          <SimpleItemTable
            items={data.note7OtherLTLiabilities.items}
            onAdd={() => update({ note7OtherLTLiabilities: { items: [...data.note7OtherLTLiabilities.items, newSimpleItem()] } })}
            onRemove={id => update({ note7OtherLTLiabilities: { items: data.note7OtherLTLiabilities.items.filter(x => x.id !== id) } })}
            onUpdate={(id, p) => update({ note7OtherLTLiabilities: { items: data.note7OtherLTLiabilities.items.map(x => x.id === id ? { ...x, ...p } : x) } })}
          />
        </>
      ))}

      {/* Note 8: Provisions */}
      {card("Provisions (Long-term & Short-term)", "Note 8", (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Long-term Provisions</div>
          {amtRow("Provision for Gratuity", "ltGratuity", "ltGratuityPrev")}
          {amtRow("Provision for Leave Encashment", "ltLeaveEncashment", "ltLeaveEncashmentPrev")}
          {amtRow("Other Long-term Provisions", "ltOther", "ltOtherPrev")}
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", margin: "16px 0 10px", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Short-term Provisions</div>
          {amtRow("Provision for Income Tax", "stIncomeTax", "stIncomeTaxPrev")}
          {amtRow("Other Short-term Provisions", "stOther", "stOtherPrev")}
        </>
      ))}

      {/* Note 9: Trade Payables */}
      {card("Trade Payables", "Note 9", (
        <>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>MSME disclosure mandatory — mark each payable accordingly</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...th, textAlign: "left" }}>Name</th>
                  <th style={th}>MSME</th>
                  <th style={th}>Disputed</th>
                  <th style={th}>&lt; 1 Year (₹)</th>
                  <th style={th}>1-2 Yrs</th>
                  <th style={th}>2-3 Yrs</th>
                  <th style={th}>&gt;3 Yrs</th>
                  <th style={th}>Prev Yr (₹)</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {data.note9TradePayables.items.map(item => (
                  <tr key={item.id}>
                    <td style={td}><input value={item.name} onChange={e => updateTPItem(item.id, { name: e.target.value })} placeholder="Supplier name" style={inp} /></td>
                    <td style={{ ...td, textAlign: "center" as const }}>
                      <input type="checkbox" checked={item.isMSME} onChange={e => updateTPItem(item.id, { isMSME: e.target.checked })} style={{ accentColor: "#0ea5e9", width: 16, height: 16 }} />
                    </td>
                    <td style={{ ...td, textAlign: "center" as const }}>
                      <input type="checkbox" checked={item.isDisputed} onChange={e => updateTPItem(item.id, { isDisputed: e.target.checked })} style={{ accentColor: "#ef4444", width: 16, height: 16 }} />
                    </td>
                    <td style={td}><input value={item.withinYear} onChange={e => updateTPItem(item.id, { withinYear: e.target.value })} placeholder="0" style={inpR} /></td>
                    <td style={td}><input value={item.oneToTwo} onChange={e => updateTPItem(item.id, { oneToTwo: e.target.value })} placeholder="0" style={inpR} /></td>
                    <td style={td}><input value={item.twoToThree} onChange={e => updateTPItem(item.id, { twoToThree: e.target.value })} placeholder="0" style={inpR} /></td>
                    <td style={td}><input value={item.aboveThree} onChange={e => updateTPItem(item.id, { aboveThree: e.target.value })} placeholder="0" style={inpR} /></td>
                    <td style={td}><input value={item.withinYearPrev} onChange={e => updateTPItem(item.id, { withinYearPrev: e.target.value })} placeholder="0" style={{ ...inpR, color: "#94a3b8" }} /></td>
                    <td style={td}><button onClick={() => update({ note9TradePayables: { items: data.note9TradePayables.items.filter(x => x.id !== item.id) } })} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => update({ note9TradePayables: { items: [...data.note9TradePayables.items, newTradePayable()] } })} style={{ marginTop: 10, background: "#f0f9ff", color: "#0369a1", border: "1px dashed #bae6fd", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Add Payable</button>
        </>
      ))}

      {/* Note 10: Other Current Liabilities */}
      {card("Other Current Liabilities", "Note 10", (
        <>
          {n10Row("Advances from Customers", "advancesFromCustomers", "advancesFromCustomersPrev")}
          {n10Row("TDS / Tax Payable", "tdsPayable", "tdsPayablePrev")}
          {n10Row("GST Payable", "gstPayable", "gstPayablePrev")}
          {n10Row("Salaries & Wages Payable", "salariesPayable", "salariesPayablePrev")}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Other Items</div>
            <SimpleItemTable
              items={note10.items}
              onAdd={() => update({ note10OtherCL: { ...note10, items: [...note10.items, newSimpleItem()] } })}
              onRemove={id => update({ note10OtherCL: { ...note10, items: note10.items.filter((x: SimpleLineItem) => x.id !== id) } })}
              onUpdate={(id, p) => update({ note10OtherCL: { ...note10, items: note10.items.map((x: SimpleLineItem) => x.id === id ? { ...x, ...p } : x) } })}
            />
          </div>
        </>
      ))}

    </div>
  );
}
