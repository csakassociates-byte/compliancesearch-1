"use client";
import { useState } from "react";
import type { BalanceSheetData, FixedAssetRow, InvestmentItem } from "@/lib/balance-sheet/types";
import { makeEmptyFixedAssetRow, n } from "@/lib/balance-sheet/types";

interface Props {
  data: BalanceSheetData;
  update: (patch: Partial<BalanceSheetData>) => void;
  updateNote: <K extends keyof BalanceSheetData>(key: K, patch: Partial<BalanceSheetData[K]>) => void;
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

const S = {
  input:   { width: "100%", border: "1px solid #d1d5db", borderRadius: 7, padding: "8px 10px", fontSize: 13, color: "#0f172a", background: "#fff", boxSizing: "border-box" } as React.CSSProperties,
  num:     { width: "100%", border: "1px solid #d1d5db", borderRadius: 7, padding: "7px 8px", fontSize: 12, color: "#0f172a", background: "#fff", boxSizing: "border-box", textAlign: "right" } as React.CSSProperties,
  numAuto: { width: "100%", border: "1px solid #d1d5db", borderRadius: 7, padding: "7px 8px", fontSize: 12, color: "#0f172a", background: "#f1f5f9", boxSizing: "border-box", textAlign: "right" } as React.CSSProperties,
  label:   { display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: "0.04em" },
  card:    { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, marginBottom: 18, overflow: "hidden" } as React.CSSProperties,
  head:    { background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" } as React.CSSProperties,
  body:    { padding: "18px" } as React.CSSProperties,
  addBtn:  { background: "#f0fdf4", border: "1px dashed #86efac", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, color: "#059669", cursor: "pointer" } as React.CSSProperties,
  delBtn:  { background: "#fee2e2", border: "none", borderRadius: 6, padding: "4px 9px", fontSize: 11, fontWeight: 700, color: "#dc2626", cursor: "pointer" } as React.CSSProperties,
  total:   { fontWeight: 800, fontSize: 13, color: "#0f172a", textAlign: "right" as const, background: "#f1f5f9", borderRadius: 6, padding: "6px 10px" },
  subhead: { fontSize: 12, fontWeight: 800, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.06em", borderBottom: "1px solid #e2e8f0", paddingBottom: 8, marginBottom: 12 },
  row2:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } as React.CSSProperties,
};

function NoteCard({ noteNo, title, children, defaultOpen = true }: { noteNo: string; title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={S.card}>
      <div style={S.head}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ background: "#0f172a", color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 800 }}>Note {noteNo}</span>
          <span style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>{title}</span>
        </div>
        <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#94a3b8" }}>{open ? "▲" : "▼"}</button>
      </div>
      {open && <div style={S.body}>{children}</div>}
    </div>
  );
}

function TwoCol({ label1, v1, v2, onChange1, onChange2, showHeaders }: { label1: string; v1: string; v2: string; onChange1: (v: string) => void; onChange2: (v: string) => void; showHeaders?: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, alignItems: "end", marginBottom: 8 }}>
      <div style={{ fontSize: 13, color: "#374151", paddingBottom: 8 }}>
        {showHeaders && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}><span style={S.label}>Current Yr</span><span style={S.label}>Prev Yr</span></div>}
        {label1}
      </div>
      <input type="number" style={S.num} value={v1} onChange={e => onChange1(e.target.value)} placeholder="0" />
      <input type="number" style={S.num} value={v2} onChange={e => onChange2(e.target.value)} placeholder="0" />
    </div>
  );
}

// ── Note 10 — Fixed Assets ────────────────────────────────────────────────────

function FARTable({ rows, onChange, title }: { rows: FixedAssetRow[]; onChange: (rows: FixedAssetRow[]) => void; title: string }) {
  function updateRow(idx: number, patch: Partial<FixedAssetRow>) {
    const isTangible = rows[0]?.isTangible ?? true;
    const updated = rows.map((r, i) => {
      if (i !== idx) return r;
      const merged = { ...r, ...patch };
      // Auto-compute gross block closing
      merged.gbClosingBalance = (n(merged.gbOpeningBalance) + n(merged.gbAdditions) - n(merged.gbDisposals)).toFixed(2);
      // Auto-compute depreciation closing
      merged.depClosingBalance = (n(merged.depOpeningBalance) + n(merged.depForYear) - n(merged.depOnDisposals)).toFixed(2);
      return merged;
    });
    onChange(updated);
  }

  function addRow() {
    const isTangible = rows[0]?.isTangible ?? true;
    onChange([...rows, makeEmptyFixedAssetRow(isTangible)]);
  }

  function removeRow(idx: number) {
    onChange(rows.filter((_, i) => i !== idx));
  }

  const totGB    = rows.reduce((s, r) => s + n(r.gbClosingBalance), 0);
  const totDep   = rows.reduce((s, r) => s + n(r.depClosingBalance), 0);
  const totNB    = totGB - totDep;
  const totGBPrev  = rows.reduce((s, r) => s + n(r.gbPrevClosing), 0);
  const totDepPrev = rows.reduce((s, r) => s + n(r.depPrevClosing), 0);
  const totNBPrev  = totGBPrev - totDepPrev;

  const TH = ({ children, align = "right" }: { children: React.ReactNode; align?: string }) => (
    <th style={{ padding: "7px 8px", fontSize: 11, fontWeight: 700, color: "#374151", background: "#f1f5f9", border: "1px solid #e2e8f0", whiteSpace: "nowrap", textAlign: align as React.CSSProperties["textAlign"] }}>
      {children}
    </th>
  );
  const TD = ({ children }: { children: React.ReactNode }) => (
    <td style={{ padding: 4, border: "1px solid #e2e8f0", verticalAlign: "middle" }}>
      {children}
    </td>
  );

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ ...S.subhead, marginBottom: 14 }}>{title}</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 900 }}>
          <thead>
            <tr>
              <TH align="left">Asset Class</TH>
              <TH>GB Opening</TH><TH>Additions</TH><TH>Disposals</TH><TH>GB Closing (auto)</TH>
              <TH>Dep Opening</TH><TH>Dep for Year</TH><TH>Dep on Disp.</TH><TH>Dep Closing (auto)</TH>
              <TH>NB Closing (auto)</TH><TH>GB Prev</TH><TH>Dep Prev</TH><TH>NB Prev (auto)</TH>
              <TH>Del</TH>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const nbClose = n(row.gbClosingBalance) - n(row.depClosingBalance);
              const nbPrev  = n(row.gbPrevClosing)    - n(row.depPrevClosing);
              return (
                <tr key={row.id}>
                  <TD>
                    <input style={{ ...S.input, minWidth: 120 }} value={row.assetClass} onChange={e => updateRow(idx, { assetClass: e.target.value })} />
                  </TD>
                  <TD><input type="number" style={S.num} value={row.gbOpeningBalance}   onChange={e => updateRow(idx, { gbOpeningBalance: e.target.value })} /></TD>
                  <TD><input type="number" style={S.num} value={row.gbAdditions}        onChange={e => updateRow(idx, { gbAdditions: e.target.value })} /></TD>
                  <TD><input type="number" style={S.num} value={row.gbDisposals}        onChange={e => updateRow(idx, { gbDisposals: e.target.value })} /></TD>
                  <TD><input style={S.numAuto} readOnly value={row.gbClosingBalance} /></TD>
                  <TD><input type="number" style={S.num} value={row.depOpeningBalance}  onChange={e => updateRow(idx, { depOpeningBalance: e.target.value })} /></TD>
                  <TD><input type="number" style={S.num} value={row.depForYear}         onChange={e => updateRow(idx, { depForYear: e.target.value })} /></TD>
                  <TD><input type="number" style={S.num} value={row.depOnDisposals}     onChange={e => updateRow(idx, { depOnDisposals: e.target.value })} /></TD>
                  <TD><input style={S.numAuto} readOnly value={row.depClosingBalance} /></TD>
                  <TD><div style={{ ...S.numAuto, padding: "7px 8px" }}>{nbClose.toFixed(2)}</div></TD>
                  <TD><input type="number" style={S.num} value={row.gbPrevClosing}      onChange={e => updateRow(idx, { gbPrevClosing: e.target.value })} /></TD>
                  <TD><input type="number" style={S.num} value={row.depPrevClosing}     onChange={e => updateRow(idx, { depPrevClosing: e.target.value })} /></TD>
                  <TD><div style={{ ...S.numAuto, padding: "7px 8px" }}>{nbPrev.toFixed(2)}</div></TD>
                  <TD><button style={S.delBtn} onClick={() => removeRow(idx)}>×</button></TD>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "#f1f5f9", fontWeight: 800 }}>
              <td style={{ padding: "8px", fontSize: 12, border: "1px solid #e2e8f0", fontWeight: 800 }}>Total</td>
              <td colSpan={3} style={{ border: "1px solid #e2e8f0" }} />
              <td style={{ padding: "8px", textAlign: "right", border: "1px solid #e2e8f0", fontSize: 12 }}>{totGB.toFixed(2)}</td>
              <td colSpan={3} style={{ border: "1px solid #e2e8f0" }} />
              <td style={{ padding: "8px", textAlign: "right", border: "1px solid #e2e8f0", fontSize: 12 }}>{totDep.toFixed(2)}</td>
              <td style={{ padding: "8px", textAlign: "right", border: "1px solid #e2e8f0", fontSize: 12, color: "#059669" }}>{totNB.toFixed(2)}</td>
              <td style={{ padding: "8px", textAlign: "right", border: "1px solid #e2e8f0", fontSize: 12 }}>{totGBPrev.toFixed(2)}</td>
              <td style={{ padding: "8px", textAlign: "right", border: "1px solid #e2e8f0", fontSize: 12 }}>{totDepPrev.toFixed(2)}</td>
              <td style={{ padding: "8px", textAlign: "right", border: "1px solid #e2e8f0", fontSize: 12, color: "#059669" }}>{totNBPrev.toFixed(2)}</td>
              <td style={{ border: "1px solid #e2e8f0" }} />
            </tr>
          </tfoot>
        </table>
      </div>
      <button style={{ ...S.addBtn, marginTop: 10 }} onClick={addRow}>+ Add Row</button>
    </div>
  );
}

function Note10({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const d = data.note10FixedAssets;
  const u = (p: Partial<typeof d>) => updateNote("note10FixedAssets", p);
  const totalDepForYear = [
    ...d.tangibleAssets.map(r => n(r.depForYear)),
    ...d.intangibleAssets.map(r => n(r.depForYear)),
  ].reduce((s, v) => s + v, 0);

  return (
    <NoteCard noteNo="10" title="Property, Plant & Equipment / Fixed Assets">
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#1e40af", marginBottom: 16 }}>
        <strong>Auto-compute:</strong> GB Closing = Opening + Additions − Disposals &nbsp;|&nbsp; Dep Closing = Opening + For Year − On Disposals &nbsp;|&nbsp; Net Block = GB Closing − Dep Closing
      </div>

      <FARTable
        title="(A) Tangible Assets"
        rows={d.tangibleAssets}
        onChange={rows => u({ tangibleAssets: rows })}
      />

      <FARTable
        title="(B) Intangible Assets"
        rows={d.intangibleAssets}
        onChange={rows => u({ intangibleAssets: rows })}
      />

      {/* CWIP */}
      <div style={{ ...S.subhead }}>Capital Work-in-Progress (CWIP)</div>
      <div style={S.row2}>
        <div>
          <label style={S.label}>CWIP Amount — Current Yr</label>
          <input type="number" style={S.num} value={d.cwip} onChange={e => u({ cwip: e.target.value })} />
        </div>
        <div>
          <label style={S.label}>CWIP Amount — Prev Yr</label>
          <input type="number" style={S.num} value={d.cwipPrev} onChange={e => u({ cwipPrev: e.target.value })} />
        </div>
      </div>

      {/* CWIP Ageing — 2021 Amendment */}
      {n(d.cwip) > 0 && (
        <div style={{ marginTop: 12, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: 12 }}>
          <div style={{ ...S.subhead, borderColor: "#fde68a", marginBottom: 10 }}>CWIP Ageing (MCA 2021 Amendment)</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {[
              { label: "< 1 Year",  key: "cwipLessThan1yr" as const },
              { label: "1–2 Years", key: "cwip1to2yr" as const },
              { label: "2–3 Years", key: "cwip2to3yr" as const },
              { label: "> 3 Years", key: "cwipMore3yr" as const },
            ].map(b => (
              <div key={b.key}>
                <label style={S.label}>{b.label}</label>
                <input type="number" style={S.num} value={d[b.key]} onChange={e => u({ [b.key]: e.target.value } as Partial<typeof d>)} placeholder="0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goodwill */}
      <div style={{ marginTop: 14, ...S.row2 }}>
        <div>
          <label style={S.label}>Goodwill — Current Yr</label>
          <input type="number" style={S.num} value={d.goodwill} onChange={e => u({ goodwill: e.target.value })} />
        </div>
        <div>
          <label style={S.label}>Goodwill — Prev Yr</label>
          <input type="number" style={S.num} value={d.goodwillPrev} onChange={e => u({ goodwillPrev: e.target.value })} />
        </div>
      </div>

      {totalDepForYear > 0 && (
        <div style={{ ...S.total, marginTop: 14 }}>Total Depreciation for Year: ₹{totalDepForYear.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
      )}
    </NoteCard>
  );
}

// ── Note 11 — Non-current Investments ────────────────────────────────────────

function Note11({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const d = data.note11NonCurrentInvestments;
  const u = (p: Partial<typeof d>) => updateNote("note11NonCurrentInvestments", p);

  function addItem(type: "quotedItems" | "unquotedItems") {
    const item: InvestmentItem = { id: crypto.randomUUID(), description: "", faceValue: "", units: "", amount: "", amountPrev: "", valued: "cost" };
    u({ [type]: [...d[type], item] });
  }
  function updateItem(type: "quotedItems" | "unquotedItems", idx: number, patch: Partial<InvestmentItem>) {
    u({ [type]: d[type].map((x, i) => i === idx ? { ...x, ...patch } : x) });
  }
  function removeItem(type: "quotedItems" | "unquotedItems", idx: number) {
    u({ [type]: d[type].filter((_, i) => i !== idx) });
  }

  function InvTable({ type, label }: { type: "quotedItems" | "unquotedItems"; label: string }) {
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ ...S.subhead }}>{label}</div>
        {d[type].map((item, idx) => (
          <div key={item.id} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr 1fr auto", gap: 8, alignItems: "end", marginBottom: 8 }}>
            <div>
              {idx === 0 && <label style={S.label}>Description</label>}
              <input style={S.input} value={item.description} onChange={e => updateItem(type, idx, { description: e.target.value })} placeholder="e.g. 100 Equity Shares of ABC Ltd" />
            </div>
            <div>
              {idx === 0 && <label style={S.label}>Units</label>}
              <input type="number" style={S.num} value={item.units} onChange={e => updateItem(type, idx, { units: e.target.value })} />
            </div>
            <div>
              {idx === 0 && <label style={S.label}>Amount (Cur)</label>}
              <input type="number" style={S.num} value={item.amount} onChange={e => updateItem(type, idx, { amount: e.target.value })} />
            </div>
            <div>
              {idx === 0 && <label style={S.label}>Amount (Prev)</label>}
              <input type="number" style={S.num} value={item.amountPrev} onChange={e => updateItem(type, idx, { amountPrev: e.target.value })} />
            </div>
            <div>
              {idx === 0 && <label style={S.label}>Valued At</label>}
              <select style={S.input} value={item.valued} onChange={e => updateItem(type, idx, { valued: e.target.value as InvestmentItem["valued"] })}>
                <option value="cost">Cost</option>
                <option value="fair_value">Fair Value</option>
                <option value="equity_method">Equity Method</option>
              </select>
            </div>
            <button style={S.delBtn} onClick={() => removeItem(type, idx)}>×</button>
          </div>
        ))}
        <button style={S.addBtn} onClick={() => addItem(type)}>+ Add</button>
      </div>
    );
  }

  return (
    <NoteCard noteNo="11" title="Non-current Investments" defaultOpen={false}>
      <InvTable type="quotedItems" label="(A) Quoted Investments" />
      <InvTable type="unquotedItems" label="(B) Unquoted Investments" />
      <TwoCol label1="Less: Provision for Diminution in Value" v1={d.provisionForDiminution} v2={d.provisionForDiminutionPrev} onChange1={v => u({ provisionForDiminution: v })} onChange2={v => u({ provisionForDiminutionPrev: v })} />
    </NoteCard>
  );
}

// ── Note 12 — LT Loans & Advances ────────────────────────────────────────────

function Note12({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const d = data.note12LTLoansAdvances;
  const u = (p: Partial<typeof d>) => updateNote("note12LTLoansAdvances", p);
  return (
    <NoteCard noteNo="12" title="Long-term Loans & Advances" defaultOpen={false}>
      <TwoCol label1="Security Deposits" showHeaders v1={d.securityDeposits} v2={d.securityDepositsPrev} onChange1={v => u({ securityDeposits: v })} onChange2={v => u({ securityDepositsPrev: v })} />
      <TwoCol label1="Capital Advances" v1={d.capitalAdvances} v2={d.capitalAdvancesPrev} onChange1={v => u({ capitalAdvances: v })} onChange2={v => u({ capitalAdvancesPrev: v })} />
      <TwoCol label1="Loans to Related Parties" v1={d.loansToRelatedParties} v2={d.loansToRelatedPartiesPrev} onChange1={v => u({ loansToRelatedParties: v })} onChange2={v => u({ loansToRelatedPartiesPrev: v })} />
      <TwoCol label1="Other Loans & Advances" v1={d.otherLoansAdvances} v2={d.otherLoansAdvancesPrev} onChange1={v => u({ otherLoansAdvances: v })} onChange2={v => u({ otherLoansAdvancesPrev: v })} />
    </NoteCard>
  );
}

// ── Note 13 — Other Non-current Assets ───────────────────────────────────────

function Note13({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const d = data.note13OtherNonCurrentAssets;
  const u = (p: Partial<typeof d>) => updateNote("note13OtherNonCurrentAssets", p);
  return (
    <NoteCard noteNo="13" title="Other Non-current Assets" defaultOpen={false}>
      <TwoCol label1="Long-term Trade Receivables" showHeaders v1={d.longTermTradeReceivables} v2={d.longTermTradeReceivablesPrev} onChange1={v => u({ longTermTradeReceivables: v })} onChange2={v => u({ longTermTradeReceivablesPrev: v })} />
      <TwoCol label1="Other Non-current Assets" v1={d.otherNonCurrentAssets} v2={d.otherNonCurrentAssetsPrev} onChange1={v => u({ otherNonCurrentAssets: v })} onChange2={v => u({ otherNonCurrentAssetsPrev: v })} />
    </NoteCard>
  );
}

// ── Note 14 — Current Investments ────────────────────────────────────────────

function Note14({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const d = data.note14CurrentInvestments;
  const u = (p: Partial<typeof d>) => updateNote("note14CurrentInvestments", p);
  return (
    <NoteCard noteNo="14" title="Current Investments" defaultOpen={false}>
      <TwoCol label1="Mutual Funds" showHeaders v1={d.mutualFunds} v2={d.mutualFundsPrev} onChange1={v => u({ mutualFunds: v })} onChange2={v => u({ mutualFundsPrev: v })} />
      <TwoCol label1="Fixed Deposits (maturing within 12 months)" v1={d.fixedDepositsMaturing12m} v2={d.fixedDepositsMaturing12mPrev} onChange1={v => u({ fixedDepositsMaturing12m: v })} onChange2={v => u({ fixedDepositsMaturing12mPrev: v })} />
      <TwoCol label1="Other Current Investments" v1={d.otherCurrentInvestments} v2={d.otherCurrentInvestmentsPrev} onChange1={v => u({ otherCurrentInvestments: v })} onChange2={v => u({ otherCurrentInvestmentsPrev: v })} />
    </NoteCard>
  );
}

// ── Note 15 — Inventories ────────────────────────────────────────────────────

function Note15({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const d = data.note15Inventories;
  const u = (p: Partial<typeof d>) => updateNote("note15Inventories", p);
  const total = n(d.rawMaterials) + n(d.workInProgress) + n(d.finishedGoods) + n(d.stockInTrade) + n(d.storesSpares) + n(d.looseTool);
  return (
    <NoteCard noteNo="15" title="Inventories">
      <div style={{ marginBottom: 12, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Valuation Method:</span>
        {(["fifo", "weighted_avg"] as const).map(m => (
          <label key={m} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <input type="radio" checked={d.valuationMethod === m} onChange={() => u({ valuationMethod: m })} />
            {m === "fifo" ? "FIFO" : "Weighted Average"}
          </label>
        ))}
      </div>
      <TwoCol label1="Raw Materials" showHeaders v1={d.rawMaterials} v2={d.rawMaterialsPrev} onChange1={v => u({ rawMaterials: v })} onChange2={v => u({ rawMaterialsPrev: v })} />
      <TwoCol label1="Work-in-Progress" v1={d.workInProgress} v2={d.workInProgressPrev} onChange1={v => u({ workInProgress: v })} onChange2={v => u({ workInProgressPrev: v })} />
      <TwoCol label1="Finished Goods" v1={d.finishedGoods} v2={d.finishedGoodsPrev} onChange1={v => u({ finishedGoods: v })} onChange2={v => u({ finishedGoodsPrev: v })} />
      <TwoCol label1="Stock-in-Trade" v1={d.stockInTrade} v2={d.stockInTradePrev} onChange1={v => u({ stockInTrade: v })} onChange2={v => u({ stockInTradePrev: v })} />
      <TwoCol label1="Stores & Spares" v1={d.storesSpares} v2={d.storesSparesPrev} onChange1={v => u({ storesSpares: v })} onChange2={v => u({ storesSparesPrev: v })} />
      <TwoCol label1="Loose Tools" v1={d.looseTool} v2={d.looseToolPrev} onChange1={v => u({ looseTool: v })} onChange2={v => u({ looseToolPrev: v })} />
      {total > 0 && <div style={{ ...S.total, marginTop: 8 }}>Total Inventories: ₹{total.toLocaleString("en-IN")}</div>}
    </NoteCard>
  );
}

// ── Note 16 — Trade Receivables ───────────────────────────────────────────────

function Note16({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const d = data.note16TradeReceivables;
  const u = (p: Partial<typeof d>) => updateNote("note16TradeReceivables", p);

  return (
    <NoteCard noteNo="16" title="Trade Receivables">
      <div style={{ ...S.subhead }}>Amount Summary</div>
      <TwoCol label1="Outstanding > 6 months — Secured" showHeaders v1={d.outstandingMore6mSecured} v2={d.outstandingMore6mSecuredPrev} onChange1={v => u({ outstandingMore6mSecured: v })} onChange2={v => u({ outstandingMore6mSecuredPrev: v })} />
      <TwoCol label1="Outstanding > 6 months — Unsecured" v1={d.outstandingMore6mUnsecured} v2={d.outstandingMore6mUnsecuredPrev} onChange1={v => u({ outstandingMore6mUnsecured: v })} onChange2={v => u({ outstandingMore6mUnsecuredPrev: v })} />
      <TwoCol label1="Outstanding > 6 months — Doubtful" v1={d.outstandingMore6mDoubtful} v2={d.outstandingMore6mDoubtfulPrev} onChange1={v => u({ outstandingMore6mDoubtful: v })} onChange2={v => u({ outstandingMore6mDoubtfulPrev: v })} />
      <TwoCol label1="Outstanding ≤ 6 months — Secured" v1={d.outstandingLess6mSecured} v2={d.outstandingLess6mSecuredPrev} onChange1={v => u({ outstandingLess6mSecured: v })} onChange2={v => u({ outstandingLess6mSecuredPrev: v })} />
      <TwoCol label1="Outstanding ≤ 6 months — Unsecured" v1={d.outstandingLess6mUnsecured} v2={d.outstandingLess6mUnsecuredPrev} onChange1={v => u({ outstandingLess6mUnsecured: v })} onChange2={v => u({ outstandingLess6mUnsecuredPrev: v })} />
      <TwoCol label1="Less: Provision for Doubtful Debts" v1={d.provisionForDoubtful} v2={d.provisionForDoubtfulPrev} onChange1={v => u({ provisionForDoubtful: v })} onChange2={v => u({ provisionForDoubtfulPrev: v })} />

      {/* Ageing — 2021 Amendment */}
      <div style={{ marginTop: 16, ...S.subhead }}>Ageing Schedule (MCA 2021 Amendment)</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 700 }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              <th style={{ padding: "7px 8px", border: "1px solid #e2e8f0", textAlign: "left", fontWeight: 700 }}>Category</th>
              <th style={{ padding: "7px 8px", border: "1px solid #e2e8f0", fontWeight: 700 }}>0–6 Mo</th>
              <th style={{ padding: "7px 8px", border: "1px solid #e2e8f0", fontWeight: 700 }}>6–12 Mo</th>
              <th style={{ padding: "7px 8px", border: "1px solid #e2e8f0", fontWeight: 700 }}>1–2 Yr</th>
              <th style={{ padding: "7px 8px", border: "1px solid #e2e8f0", fontWeight: 700 }}>2–3 Yr</th>
              <th style={{ padding: "7px 8px", border: "1px solid #e2e8f0", fontWeight: 700 }}>{"> 3 Yr"}</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: "Undisputed", keys: ["ageingUndisputed0to6","ageingUndisputed6to12","ageingUndisputed1to2yr","ageingUndisputed2to3yr","ageingUndisputedMore3yr"] as const },
              { label: "Disputed",   keys: ["ageingDisputed0to6","ageingDisputed6to12","ageingDisputed1to2yr","ageingDisputed2to3yr","ageingDisputedMore3yr"] as const },
            ].map(row => (
              <tr key={row.label}>
                <td style={{ padding: "8px", fontWeight: 600, border: "1px solid #e2e8f0" }}>{row.label}</td>
                {row.keys.map(k => (
                  <td key={k} style={{ border: "1px solid #e2e8f0", padding: 3 }}>
                    <input type="number" style={{ ...S.num, border: "none", background: "transparent" }} value={d[k]} onChange={e => u({ [k]: e.target.value } as Partial<typeof d>)} placeholder="0" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </NoteCard>
  );
}

// ── Note 17 — Cash & Equivalents ──────────────────────────────────────────────

function Note17({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const d = data.note17CashEquivalents;
  const u = (p: Partial<typeof d>) => updateNote("note17CashEquivalents", p);
  const total = n(d.cashOnHand) + n(d.balancesWithBanks) + n(d.fixedDepositsWithin3m) + n(d.chequesDraftsOnHand);
  return (
    <NoteCard noteNo="17" title="Cash & Cash Equivalents">
      <TwoCol label1="Cash on Hand" showHeaders v1={d.cashOnHand} v2={d.cashOnHandPrev} onChange1={v => u({ cashOnHand: v })} onChange2={v => u({ cashOnHandPrev: v })} />
      <TwoCol label1="Balances with Banks (Current Accounts)" v1={d.balancesWithBanks} v2={d.balancesWithBanksPrev} onChange1={v => u({ balancesWithBanks: v })} onChange2={v => u({ balancesWithBanksPrev: v })} />
      <TwoCol label1="Fixed Deposits (maturity ≤ 3 months)" v1={d.fixedDepositsWithin3m} v2={d.fixedDepositsWithin3mPrev} onChange1={v => u({ fixedDepositsWithin3m: v })} onChange2={v => u({ fixedDepositsWithin3mPrev: v })} />
      <TwoCol label1="Cheques / Drafts on Hand" v1={d.chequesDraftsOnHand} v2={d.chequesDraftsOnHandPrev} onChange1={v => u({ chequesDraftsOnHand: v })} onChange2={v => u({ chequesDraftsOnHandPrev: v })} />
      {total > 0 && <div style={{ ...S.total, marginTop: 8 }}>Total Cash & Equivalents: ₹{total.toLocaleString("en-IN")}</div>}
    </NoteCard>
  );
}

// ── Note 18 — ST Loans & Advances ────────────────────────────────────────────

function Note18({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const d = data.note18STLoansAdvances;
  const u = (p: Partial<typeof d>) => updateNote("note18STLoansAdvances", p);
  return (
    <NoteCard noteNo="18" title="Short-term Loans & Advances" defaultOpen={false}>
      <TwoCol label1="Prepaid Expenses" showHeaders v1={d.prepaidExpenses} v2={d.prepaidExpensesPrev} onChange1={v => u({ prepaidExpenses: v })} onChange2={v => u({ prepaidExpensesPrev: v })} />
      <TwoCol label1="Advances to Suppliers" v1={d.advancesToSuppliers} v2={d.advancesToSuppliersPrev} onChange1={v => u({ advancesToSuppliers: v })} onChange2={v => u({ advancesToSuppliersPrev: v })} />
      <TwoCol label1="Balance with Govt. Authorities (GST/TDS/Advance Tax)" v1={d.balanceWithGovernment} v2={d.balanceWithGovernmentPrev} onChange1={v => u({ balanceWithGovernment: v })} onChange2={v => u({ balanceWithGovernmentPrev: v })} />
      <TwoCol label1="Other Advances" v1={d.otherAdvances} v2={d.otherAdvancesPrev} onChange1={v => u({ otherAdvances: v })} onChange2={v => u({ otherAdvancesPrev: v })} />
    </NoteCard>
  );
}

// ── Note 19 — Other Current Assets ───────────────────────────────────────────

function Note19({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const d = data.note19OtherCurrentAssets;
  const u = (p: Partial<typeof d>) => updateNote("note19OtherCurrentAssets", p);
  return (
    <NoteCard noteNo="19" title="Other Current Assets" defaultOpen={false}>
      <TwoCol label1="Interest Accrued on Deposits" showHeaders v1={d.interestAccruedOnDeposits} v2={d.interestAccruedOnDepositsPrev} onChange1={v => u({ interestAccruedOnDeposits: v })} onChange2={v => u({ interestAccruedOnDepositsPrev: v })} />
      <TwoCol label1="Other Current Assets" v1={d.otherCurrentAssets} v2={d.otherCurrentAssetsPrev} onChange1={v => u({ otherCurrentAssets: v })} onChange2={v => u({ otherCurrentAssetsPrev: v })} />
    </NoteCard>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export default function Step2Assets({ data, update, updateNote }: Props) {
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#166534", fontWeight: 600, marginBottom: 18 }}>
        🏗️ <strong>Assets</strong> — Fill Notes 10 to 19. Fixed Asset schedule auto-computes closing balances and net block.
        All amounts in ₹ ({data.displayUnit}).
      </div>

      <Note10 data={data} updateNote={updateNote} />
      <Note11 data={data} updateNote={updateNote} />
      <Note12 data={data} updateNote={updateNote} />
      <Note13 data={data} updateNote={updateNote} />
      <Note14 data={data} updateNote={updateNote} />
      <Note15 data={data} updateNote={updateNote} />
      <Note16 data={data} updateNote={updateNote} />
      <Note17 data={data} updateNote={updateNote} />
      <Note18 data={data} updateNote={updateNote} />
      <Note19 data={data} updateNote={updateNote} />
    </div>
  );
}
