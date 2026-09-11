"use client";
import { NCEFinancialsData, PPERow, TradeReceivableItem, SimpleLineItem, newPPERow, newTradeReceivable, newSimpleItem } from "@/lib/nce-financials/types";

interface Props {
  data: NCEFinancialsData;
  update: (patch: Partial<NCEFinancialsData>) => void;
  fyLabels: { current: string; prev: string };
}

const inp = { padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, width: "100%", boxSizing: "border-box" as const, outline: "none", textAlign: "right" as const };
const inpL = { ...inp, textAlign: "left" as const };
const th = { padding: "9px 10px", fontSize: 10, fontWeight: 700 as const, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.05em", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" as const };
const td = { padding: "6px 8px", borderBottom: "1px solid #f1f5f9", verticalAlign: "middle" as const };

function n(v: string) { return parseFloat(v) || 0; }

function PPETable({ title, rows, onAdd, onRemove, onUpdate, showDep }: {
  title: string; rows: PPERow[];
  onAdd: () => void; onRemove: (id: string) => void; onUpdate: (id: string, p: Partial<PPERow>) => void;
  showDep?: boolean;
}) {
  const show = showDep !== false;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{title}</div>
        <button onClick={onAdd} style={{ background: "#f0fdf4", color: "#059669", border: "1px dashed #86efac", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+ Add Row</button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: show ? 900 : 500 }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: "left" }}>Asset Name</th>
              <th style={th}>Opening<br />Gross Block</th>
              <th style={th}>Additions</th>
              <th style={th}>Disposals</th>
              <th style={th}>Closing<br />Gross Block</th>
              <th style={th}>Prev Year<br />GB</th>
              {show && <>
                <th style={th}>Opening<br />Accum. Dep</th>
                <th style={th}>Dep for<br />Year</th>
                <th style={th}>Dep on<br />Disposals</th>
                <th style={th}>Closing<br />Accum. Dep</th>
                <th style={th}>Prev Year<br />Dep</th>
                <th style={{ ...th, color: "#059669" }}>Net Block<br />(Current)</th>
                <th style={{ ...th, color: "#64748b" }}>Net Block<br />(Prev)</th>
              </>}
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const netBlock = n(row.gbClosingBalance) - n(row.depClosingBalance);
              const netBlockPrev = n(row.gbPrevClosing) - n(row.depPrevClosing);
              return (
                <tr key={row.id}>
                  <td style={td}><input value={row.assetName} onChange={e => onUpdate(row.id, { assetName: e.target.value })} placeholder="Asset name" style={inpL} /></td>
                  <td style={td}><input value={row.gbOpeningBalance} onChange={e => onUpdate(row.id, { gbOpeningBalance: e.target.value })} placeholder="0" style={inp} /></td>
                  <td style={td}><input value={row.gbAdditions} onChange={e => onUpdate(row.id, { gbAdditions: e.target.value })} placeholder="0" style={inp} /></td>
                  <td style={td}><input value={row.gbDisposals} onChange={e => onUpdate(row.id, { gbDisposals: e.target.value })} placeholder="0" style={inp} /></td>
                  <td style={td}><input value={row.gbClosingBalance} onChange={e => onUpdate(row.id, { gbClosingBalance: e.target.value })} placeholder="0" style={inp} /></td>
                  <td style={td}><input value={row.gbPrevClosing} onChange={e => onUpdate(row.id, { gbPrevClosing: e.target.value })} placeholder="0" style={{ ...inp, color: "#94a3b8" }} /></td>
                  {show && <>
                    <td style={td}><input value={row.depOpeningBalance} onChange={e => onUpdate(row.id, { depOpeningBalance: e.target.value })} placeholder="0" style={inp} /></td>
                    <td style={td}><input value={row.depForYear} onChange={e => onUpdate(row.id, { depForYear: e.target.value })} placeholder="0" style={inp} /></td>
                    <td style={td}><input value={row.depOnDisposals} onChange={e => onUpdate(row.id, { depOnDisposals: e.target.value })} placeholder="0" style={inp} /></td>
                    <td style={td}><input value={row.depClosingBalance} onChange={e => onUpdate(row.id, { depClosingBalance: e.target.value })} placeholder="0" style={inp} /></td>
                    <td style={td}><input value={row.depPrevClosing} onChange={e => onUpdate(row.id, { depPrevClosing: e.target.value })} placeholder="0" style={{ ...inp, color: "#94a3b8" }} /></td>
                    <td style={{ ...td, background: "#f0fdf4" }}><div style={{ padding: "6px 10px", fontWeight: 700, fontSize: 12, color: "#059669", textAlign: "right" }}>{netBlock.toLocaleString("en-IN")}</div></td>
                    <td style={{ ...td, background: "#f8fafc" }}><div style={{ padding: "6px 10px", fontWeight: 600, fontSize: 12, color: "#64748b", textAlign: "right" }}>{netBlockPrev.toLocaleString("en-IN")}</div></td>
                  </>}
                  <td style={td}><button onClick={() => onRemove(row.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>✕</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SimpleItemTable({ items, onAdd, onRemove, onUpdate }: {
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

export default function Step3Assets({ data, update, fyLabels }: Props) {
  const fa = data.note11FixedAssets;
  function updatePPE(section: "tangibleAssets" | "intangibleAssets", id: string, p: Partial<PPERow>) {
    update({ note11FixedAssets: { ...fa, [section]: fa[section].map((r: PPERow) => r.id === id ? { ...r, ...p } : r) } });
  }

  const inv = data.note15Inventories;
  const cr = data.note16TradeReceivables;

  function updateTR(id: string, p: Partial<TradeReceivableItem>) {
    update({ note16TradeReceivables: { ...cr, items: cr.items.map(x => x.id === id ? { ...x, ...p } : x) } });
  }

  const cash = data.note17Cash;
  const stl = data.note18STLoans;
  const oca = data.note18aOtherCA;

  function card(title: string, noteNum: string, children: React.ReactNode) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 18px" }}>{noteNum} — {title}</h3>
        {children}
      </div>
    );
  }

  function invRow(label_: string, cur: keyof typeof inv, prev: keyof typeof inv) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", gap: 8, marginBottom: 8, alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "#374151" }}>{label_}</div>
        <input value={String(inv[cur] ?? "")} onChange={e => update({ note15Inventories: { ...inv, [cur]: e.target.value } })} placeholder="0" style={inp} />
        <input value={String(inv[prev] ?? "")} onChange={e => update({ note15Inventories: { ...inv, [prev]: e.target.value } })} placeholder="0" style={{ ...inp, color: "#94a3b8" }} />
      </div>
    );
  }

  function cashRow(label_: string, cur: keyof typeof cash, prev: keyof typeof cash) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", gap: 8, marginBottom: 8, alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "#374151" }}>{label_}</div>
        <input value={String(cash[cur] ?? "")} onChange={e => update({ note17Cash: { ...cash, [cur]: e.target.value } })} placeholder="0" style={inp} />
        <input value={String(cash[prev] ?? "")} onChange={e => update({ note17Cash: { ...cash, [prev]: e.target.value } })} placeholder="0" style={{ ...inp, color: "#94a3b8" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Column headers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", gap: 8, padding: "0 2px" }}>
        <div></div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#0369a1", textAlign: "right" as const }}>{fyLabels.current}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textAlign: "right" as const }}>{fyLabels.prev}</div>
      </div>

      {/* Note 11: Fixed Assets */}
      {card("Property, Plant & Equipment", "Note 11", (
        <>
          <PPETable
            title="Tangible Assets"
            rows={fa.tangibleAssets}
            onAdd={() => update({ note11FixedAssets: { ...fa, tangibleAssets: [...fa.tangibleAssets, newPPERow()] } })}
            onRemove={id => update({ note11FixedAssets: { ...fa, tangibleAssets: fa.tangibleAssets.filter((r: PPERow) => r.id !== id) } })}
            onUpdate={(id, p) => updatePPE("tangibleAssets", id, p)}
          />
          <PPETable
            title="Intangible Assets"
            rows={fa.intangibleAssets}
            onAdd={() => update({ note11FixedAssets: { ...fa, intangibleAssets: [...fa.intangibleAssets, newPPERow()] } })}
            onRemove={id => update({ note11FixedAssets: { ...fa, intangibleAssets: fa.intangibleAssets.filter((r: PPERow) => r.id !== id) } })}
            onUpdate={(id, p) => updatePPE("intangibleAssets", id, p)}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", gap: 8, alignItems: "center" }}>
            <div style={{ fontSize: 13, color: "#374151" }}>Capital Work-in-Progress</div>
            <input value={fa.cwip} onChange={e => update({ note11FixedAssets: { ...fa, cwip: e.target.value } })} placeholder="0" style={inp} />
            <input value={fa.cwipPrev} onChange={e => update({ note11FixedAssets: { ...fa, cwipPrev: e.target.value } })} placeholder="0" style={{ ...inp, color: "#94a3b8" }} />
          </div>
        </>
      ))}

      {/* Note 12: Investments */}
      {card("Non-current Investments", "Note 12", (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>INVESTMENT</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#0369a1", textAlign: "right" as const }}>CURRENT (₹)</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textAlign: "right" as const }}>PREV (₹)</div>
          </div>
          <SimpleItemTable
            items={data.note12Investments.items}
            onAdd={() => update({ note12Investments: { items: [...data.note12Investments.items, newSimpleItem()] } })}
            onRemove={id => update({ note12Investments: { items: data.note12Investments.items.filter(x => x.id !== id) } })}
            onUpdate={(id, p) => update({ note12Investments: { items: data.note12Investments.items.map(x => x.id === id ? { ...x, ...p } : x) } })}
          />
        </>
      ))}

      {/* Note 13: LT Loans & Advances */}
      {card("Long-term Loans & Advances", "Note 13", (
        <>
          {[
            ["Security Deposits", "securityDeposits", "securityDepositsPrev"],
            ["Capital Advances", "capitalAdvances", "capitalAdvancesPrev"],
          ].map(([lbl, cur, prev]) => (
            <div key={String(cur)} style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <div style={{ fontSize: 13, color: "#374151" }}>{lbl}</div>
              <input value={String(data.note13LTLoans[cur as keyof typeof data.note13LTLoans] ?? "")} onChange={e => update({ note13LTLoans: { ...data.note13LTLoans, [cur as string]: e.target.value } })} placeholder="0" style={inp} />
              <input value={String(data.note13LTLoans[prev as keyof typeof data.note13LTLoans] ?? "")} onChange={e => update({ note13LTLoans: { ...data.note13LTLoans, [prev as string]: e.target.value } })} placeholder="0" style={{ ...inp, color: "#94a3b8" }} />
            </div>
          ))}
          <div style={{ marginTop: 8 }}>
            <SimpleItemTable
              items={data.note13LTLoans.items}
              onAdd={() => update({ note13LTLoans: { ...data.note13LTLoans, items: [...data.note13LTLoans.items, newSimpleItem()] } })}
              onRemove={id => update({ note13LTLoans: { ...data.note13LTLoans, items: data.note13LTLoans.items.filter(x => x.id !== id) } })}
              onUpdate={(id, p) => update({ note13LTLoans: { ...data.note13LTLoans, items: data.note13LTLoans.items.map(x => x.id === id ? { ...x, ...p } : x) } })}
            />
          </div>
        </>
      ))}

      {/* Note 14: Other Non-current Assets */}
      {card("Other Non-current Assets", "Note 14", (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>ASSET</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#0369a1", textAlign: "right" as const }}>CURRENT (₹)</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textAlign: "right" as const }}>PREV (₹)</div>
          </div>
          <SimpleItemTable
            items={data.note14OtherNCAssets.items}
            onAdd={() => update({ note14OtherNCAssets: { items: [...data.note14OtherNCAssets.items, newSimpleItem()] } })}
            onRemove={id => update({ note14OtherNCAssets: { items: data.note14OtherNCAssets.items.filter(x => x.id !== id) } })}
            onUpdate={(id, p) => update({ note14OtherNCAssets: { items: data.note14OtherNCAssets.items.map(x => x.id === id ? { ...x, ...p } : x) } })}
          />
        </>
      ))}

      {/* Note 15: Inventories */}
      {card("Inventories", "Note 15", (
        <>
          {invRow("Raw Materials", "rawMaterials", "rawMaterialsPrev")}
          {invRow("Work-in-Progress", "wip", "wipPrev")}
          {invRow("Finished Goods", "finishedGoods", "finishedGoodsPrev")}
          {invRow("Trading Goods (Stock-in-Trade)", "tradingGoods", "tradingGoodsPrev")}
          {invRow("Stores & Spares", "stores", "storesPrev")}
          {invRow("Loose Tools", "looseTools", "looseToolsPrev")}
        </>
      ))}

      {/* Note 16: Trade Receivables */}
      {card("Trade Receivables", "Note 16", (
        <>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>Include aging buckets for receivables</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...th, textAlign: "left" }}>Debtor Name</th>
                  <th style={th}>Related Party</th>
                  <th style={th}>Disputed</th>
                  <th style={th}>&lt;6 Months (₹)</th>
                  <th style={th}>6-12 Months</th>
                  <th style={th}>&gt;1 Year</th>
                  <th style={th}>Prev Yr (₹)</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {cr.items.map(item => (
                  <tr key={item.id}>
                    <td style={td}><input value={item.name} onChange={e => updateTR(item.id, { name: e.target.value })} placeholder="Debtor name" style={inpL} /></td>
                    <td style={{ ...td, textAlign: "center" as const }}><input type="checkbox" checked={item.isRelatedParty} onChange={e => updateTR(item.id, { isRelatedParty: e.target.checked })} style={{ accentColor: "#0ea5e9", width: 16, height: 16 }} /></td>
                    <td style={{ ...td, textAlign: "center" as const }}><input type="checkbox" checked={item.isDisputed} onChange={e => updateTR(item.id, { isDisputed: e.target.checked })} style={{ accentColor: "#ef4444", width: 16, height: 16 }} /></td>
                    <td style={td}><input value={item.withinSixMonths} onChange={e => updateTR(item.id, { withinSixMonths: e.target.value })} placeholder="0" style={inp} /></td>
                    <td style={td}><input value={item.sixToTwelve} onChange={e => updateTR(item.id, { sixToTwelve: e.target.value })} placeholder="0" style={inp} /></td>
                    <td style={td}><input value={item.aboveOne} onChange={e => updateTR(item.id, { aboveOne: e.target.value })} placeholder="0" style={inp} /></td>
                    <td style={td}><input value={item.withinSixMonthsPrev} onChange={e => updateTR(item.id, { withinSixMonthsPrev: e.target.value })} placeholder="0" style={{ ...inp, color: "#94a3b8" }} /></td>
                    <td style={td}><button onClick={() => update({ note16TradeReceivables: { ...cr, items: cr.items.filter(x => x.id !== item.id) } })} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => update({ note16TradeReceivables: { ...cr, items: [...cr.items, newTradeReceivable()] } })} style={{ marginTop: 10, background: "#f0f9ff", color: "#0369a1", border: "1px dashed #bae6fd", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Add Receivable</button>

          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 140px 140px", gap: 8 }}>
            {[
              ["Secured — Considered Good", "securedGood", "securedGoodPrev"],
              ["Unsecured — Considered Good", "unsecuredGood", "unsecuredGoodPrev"],
              ["Doubtful", "doubtful", "doubtfulPrev"],
            ].map(([lbl, cur, prev]) => (
              <div key={String(cur)} style={{ display: "contents" }}>
                <div style={{ padding: "8px 4px", fontSize: 13, color: "#374151" }}>{lbl}</div>
                <input value={String(cr[cur as keyof typeof cr] ?? "")} onChange={e => update({ note16TradeReceivables: { ...cr, [cur as string]: e.target.value } })} placeholder="0" style={inp} />
                <input value={String(cr[prev as keyof typeof cr] ?? "")} onChange={e => update({ note16TradeReceivables: { ...cr, [prev as string]: e.target.value } })} placeholder="0" style={{ ...inp, color: "#94a3b8" }} />
              </div>
            ))}
          </div>
        </>
      ))}

      {/* Note 17: Cash & Bank */}
      {card("Cash & Cash Equivalents", "Note 17", (
        <>
          {cashRow("Cash in Hand", "cashInHand", "cashInHandPrev")}
          {cashRow("Bank — Current Account(s)", "bankCurrentAccount", "bankCurrentAccountPrev")}
          {cashRow("Bank — Savings Account(s)", "bankSavingsAccount", "bankSavingsAccountPrev")}
          {cashRow("Fixed Deposits (≤ 3 months maturity)", "fdDeposits", "fdDepositsPrev")}
        </>
      ))}

      {/* Note 18: ST Loans & Advances */}
      {card("Short-term Loans & Advances", "Note 18", (
        <>
          {[
            ["Advances to Suppliers", "advancesToSuppliers", "advancesToSuppliersPrev"],
            ["Prepaid Expenses", "prepaidExpenses", "prepaidExpensesPrev"],
          ].map(([lbl, cur, prev]) => (
            <div key={String(cur)} style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <div style={{ fontSize: 13, color: "#374151" }}>{lbl}</div>
              <input value={String(stl[cur as keyof typeof stl] ?? "")} onChange={e => update({ note18STLoans: { ...stl, [cur as string]: e.target.value } })} placeholder="0" style={inp} />
              <input value={String(stl[prev as keyof typeof stl] ?? "")} onChange={e => update({ note18STLoans: { ...stl, [prev as string]: e.target.value } })} placeholder="0" style={{ ...inp, color: "#94a3b8" }} />
            </div>
          ))}
          <div style={{ marginTop: 8 }}>
            <SimpleItemTable
              items={stl.items}
              onAdd={() => update({ note18STLoans: { ...stl, items: [...stl.items, newSimpleItem()] } })}
              onRemove={id => update({ note18STLoans: { ...stl, items: stl.items.filter(x => x.id !== id) } })}
              onUpdate={(id, p) => update({ note18STLoans: { ...stl, items: stl.items.map(x => x.id === id ? { ...x, ...p } : x) } })}
            />
          </div>
        </>
      ))}

      {/* Note 18a: Other Current Assets */}
      {card("Other Current Assets", "Note 18a", (
        <>
          {[
            ["Interest Accrued but not Due", "interestAccrued", "interestAccruedPrev"],
            ["TDS Receivable / Advance Tax", "tdsReceivable", "tdsReceivablePrev"],
            ["GST Input Tax Credit Receivable", "gstReceivable", "gstReceivablePrev"],
          ].map(([lbl, cur, prev]) => (
            <div key={String(cur)} style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <div style={{ fontSize: 13, color: "#374151" }}>{lbl}</div>
              <input value={String(oca[cur as keyof typeof oca] ?? "")} onChange={e => update({ note18aOtherCA: { ...oca, [cur as string]: e.target.value } })} placeholder="0" style={inp} />
              <input value={String(oca[prev as keyof typeof oca] ?? "")} onChange={e => update({ note18aOtherCA: { ...oca, [prev as string]: e.target.value } })} placeholder="0" style={{ ...inp, color: "#94a3b8" }} />
            </div>
          ))}
          <div style={{ marginTop: 8 }}>
            <SimpleItemTable
              items={oca.items}
              onAdd={() => update({ note18aOtherCA: { ...oca, items: [...oca.items, newSimpleItem()] } })}
              onRemove={id => update({ note18aOtherCA: { ...oca, items: oca.items.filter(x => x.id !== id) } })}
              onUpdate={(id, p) => update({ note18aOtherCA: { ...oca, items: oca.items.map(x => x.id === id ? { ...x, ...p } : x) } })}
            />
          </div>
        </>
      ))}

    </div>
  );
}
