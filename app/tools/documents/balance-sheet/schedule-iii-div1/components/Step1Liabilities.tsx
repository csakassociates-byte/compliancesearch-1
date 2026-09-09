"use client";
import { useState } from "react";
import type { BalanceSheetData, Note1ShareCapital, Note2ReservesSurplus, Note3LTBorrowings, Note6STBorrowings } from "@/lib/balance-sheet/types";
import { makeEmptyShareCapitalClass, makeEmptyBorrowingItem, n } from "@/lib/balance-sheet/types";

interface Props {
  data: BalanceSheetData;
  update: (patch: Partial<BalanceSheetData>) => void;
  updateNote: <K extends keyof BalanceSheetData>(key: K, patch: Partial<BalanceSheetData[K]>) => void;
}

// ── Shared UI helpers ─────────────────────────────────────────────────────────

const S = {
  input: { width: "100%", border: "1px solid #d1d5db", borderRadius: 7, padding: "8px 10px", fontSize: 13, color: "#0f172a", background: "#fff", boxSizing: "border-box" } as React.CSSProperties,
  numInput: { width: "100%", border: "1px solid #d1d5db", borderRadius: 7, padding: "8px 10px", fontSize: 13, color: "#0f172a", background: "#fff", boxSizing: "border-box", textAlign: "right" } as React.CSSProperties,
  label: { display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: "0.04em" },
  card: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, marginBottom: 18, overflow: "hidden" } as React.CSSProperties,
  cardHead: { background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" } as React.CSSProperties,
  cardBody: { padding: "18px" } as React.CSSProperties,
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } as React.CSSProperties,
  row3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 } as React.CSSProperties,
  addBtn: { background: "#f0fdf4", border: "1px dashed #86efac", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, color: "#059669", cursor: "pointer" } as React.CSSProperties,
  delBtn: { background: "#fee2e2", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, color: "#dc2626", cursor: "pointer" } as React.CSSProperties,
  total: { fontWeight: 800, fontSize: 13, color: "#0f172a", textAlign: "right" as const, background: "#f1f5f9", borderRadius: 6, padding: "6px 10px" },
  subhead: { fontSize: 12, fontWeight: 800, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.06em", borderBottom: "1px solid #e2e8f0", paddingBottom: 8, marginBottom: 12 },
  prevBadge: { fontSize: 10, fontWeight: 600, color: "#94a3b8", marginLeft: 4 },
};

function NoteCard({ noteNo, title, children, defaultOpen = true }: { noteNo: string; title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={S.card}>
      <div style={S.cardHead}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ background: "#0f172a", color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 800 }}>Note {noteNo}</span>
          <span style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>{title}</span>
        </div>
        <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#94a3b8" }}>{open ? "▲" : "▼"}</button>
      </div>
      {open && <div style={S.cardBody}>{children}</div>}
    </div>
  );
}

function TwoCol({ label1, label2, v1, v2, onChange1, onChange2, bold }: { label1?: string; label2?: string; v1: string; v2: string; onChange1: (v: string) => void; onChange2: (v: string) => void; bold?: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, alignItems: "end" }}>
      <div style={{ fontSize: 13, fontWeight: bold ? 700 : 400, color: "#374151", paddingBottom: 8 }}>{label1}</div>
      <div>
        {label2 && <label style={S.label}>Current Yr</label>}
        <input type="number" style={S.numInput} value={v1} onChange={e => onChange1(e.target.value)} placeholder="0" />
      </div>
      <div>
        {label2 && <label style={S.label}>Prev Yr</label>}
        <input type="number" style={S.numInput} value={v2} onChange={e => onChange2(e.target.value)} placeholder="0" />
      </div>
    </div>
  );
}

// ── Note 1 — Share Capital ────────────────────────────────────────────────────

function Note1({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const note = data.note1ShareCapital;
  const totalPaidUp = note.classes.reduce((s, c) => s + n(c.paidUpAmount), 0);

  function updateClass(idx: number, patch: Partial<typeof note.classes[0]>) {
    const updated = note.classes.map((c, i) => i === idx ? { ...c, ...patch } : c);
    updateNote("note1ShareCapital", { classes: updated } as Partial<Note1ShareCapital>);
  }
  function addClass() {
    updateNote("note1ShareCapital", { classes: [...note.classes, makeEmptyShareCapitalClass()] } as Partial<Note1ShareCapital>);
  }
  function removeClass(idx: number) {
    updateNote("note1ShareCapital", { classes: note.classes.filter((_, i) => i !== idx) } as Partial<Note1ShareCapital>);
  }

  return (
    <NoteCard noteNo="1" title="Share Capital">
      {note.classes.map((cls, idx) => (
        <div key={cls.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Class {idx + 1}</span>
            {note.classes.length > 1 && <button style={S.delBtn} onClick={() => removeClass(idx)}>× Remove</button>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={S.row3}>
              <div>
                <label style={S.label}>Class of Shares</label>
                <input style={S.input} value={cls.className} onChange={e => updateClass(idx, { className: e.target.value })} placeholder="Equity Shares" />
              </div>
              <div>
                <label style={S.label}>Face Value (₹)</label>
                <input type="number" style={S.numInput} value={cls.faceValue} onChange={e => updateClass(idx, { faceValue: e.target.value })} placeholder="10" />
              </div>
              <div>
                <label style={S.label}>Authorised (No. of shares)</label>
                <input type="number" style={S.numInput} value={cls.authorisedShares} onChange={e => updateClass(idx, { authorisedShares: e.target.value })} />
              </div>
            </div>
            <div style={S.row3}>
              <div>
                <label style={S.label}>Issued Shares</label>
                <input type="number" style={S.numInput} value={cls.issuedShares} onChange={e => updateClass(idx, { issuedShares: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Subscribed Shares</label>
                <input type="number" style={S.numInput} value={cls.subscribedShares} onChange={e => updateClass(idx, { subscribedShares: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Paid-up Shares</label>
                <input type="number" style={S.numInput} value={cls.paidUpShares} onChange={e => updateClass(idx, { paidUpShares: e.target.value })} />
              </div>
            </div>
            <div style={S.row2}>
              <div>
                <label style={S.label}>Paid-up Amount (₹) — Current Yr</label>
                <input type="number" style={S.numInput} value={cls.paidUpAmount} onChange={e => updateClass(idx, { paidUpAmount: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Paid-up Amount (₹) — Prev Yr</label>
                <input type="number" style={S.numInput} value={cls.prevPaidUpAmount} onChange={e => updateClass(idx, { prevPaidUpAmount: e.target.value })} />
              </div>
            </div>
          </div>
        </div>
      ))}

      <button style={S.addBtn} onClick={addClass}>+ Add Share Class</button>

      <div style={{ marginTop: 14, ...S.total }}>Total Paid-up Capital: ₹{totalPaidUp.toLocaleString("en-IN")}</div>

      {/* Shareholders > 5% */}
      <div style={{ marginTop: 18 }}>
        <div style={S.subhead}>Shareholders Holding More Than 5%</div>
        {note.shareholdersAbove5.map((sh, idx) => (
          <div key={sh.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto", gap: 8, alignItems: "end", marginBottom: 8 }}>
            <div>
              {idx === 0 && <label style={S.label}>Shareholder Name</label>}
              <input style={S.input} value={sh.name} onChange={e => {
                const upd = note.shareholdersAbove5.map((s, i) => i === idx ? { ...s, name: e.target.value } : s);
                updateNote("note1ShareCapital", { shareholdersAbove5: upd } as Partial<Note1ShareCapital>);
              }} />
            </div>
            <div>
              {idx === 0 && <label style={S.label}>Shares (Cur)</label>}
              <input type="number" style={S.numInput} value={sh.shares} onChange={e => {
                const upd = note.shareholdersAbove5.map((s, i) => i === idx ? { ...s, shares: e.target.value } : s);
                updateNote("note1ShareCapital", { shareholdersAbove5: upd } as Partial<Note1ShareCapital>);
              }} />
            </div>
            <div>
              {idx === 0 && <label style={S.label}>% (Cur)</label>}
              <input type="number" style={S.numInput} value={sh.percent} onChange={e => {
                const upd = note.shareholdersAbove5.map((s, i) => i === idx ? { ...s, percent: e.target.value } : s);
                updateNote("note1ShareCapital", { shareholdersAbove5: upd } as Partial<Note1ShareCapital>);
              }} />
            </div>
            <div>
              {idx === 0 && <label style={S.label}>Shares (Prev)</label>}
              <input type="number" style={S.numInput} value={sh.prevShares} onChange={e => {
                const upd = note.shareholdersAbove5.map((s, i) => i === idx ? { ...s, prevShares: e.target.value } : s);
                updateNote("note1ShareCapital", { shareholdersAbove5: upd } as Partial<Note1ShareCapital>);
              }} />
            </div>
            <div>
              {idx === 0 && <label style={S.label}>% (Prev)</label>}
              <input type="number" style={S.numInput} value={sh.prevPercent} onChange={e => {
                const upd = note.shareholdersAbove5.map((s, i) => i === idx ? { ...s, prevPercent: e.target.value } : s);
                updateNote("note1ShareCapital", { shareholdersAbove5: upd } as Partial<Note1ShareCapital>);
              }} />
            </div>
            <button style={S.delBtn} onClick={() => updateNote("note1ShareCapital", { shareholdersAbove5: note.shareholdersAbove5.filter((_, i) => i !== idx) } as Partial<Note1ShareCapital>)}>×</button>
          </div>
        ))}
        <button style={S.addBtn} onClick={() => updateNote("note1ShareCapital", { shareholdersAbove5: [...note.shareholdersAbove5, { id: crypto.randomUUID(), name: "", shares: "", percent: "", prevShares: "", prevPercent: "" }] } as Partial<Note1ShareCapital>)}>
          + Add Shareholder
        </button>
      </div>
    </NoteCard>
  );
}

// ── Note 2 — Reserves & Surplus ───────────────────────────────────────────────

function Note2({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const r = data.note2ReservesSurplus;
  function u(patch: Partial<Note2ReservesSurplus>) { updateNote("note2ReservesSurplus", patch); }

  const genClose = (n(r.generalReserveOpen) + n(r.generalReserveAdditions)).toFixed(2);
  const surplusClose = (n(r.surplusOpeningBalance) + n(r.surplusNetProfit) - n(r.surplusDividend) - n(r.surplusTransferToReserve)).toFixed(2);
  const total = n(r.capitalReserve) + n(r.securitiesPremium) + parseFloat(genClose) + parseFloat(surplusClose) + n(r.otherReserves);

  return (
    <NoteCard noteNo="2" title="Reserves & Surplus">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Header row */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
          <div />
          <div style={{ ...S.label, textAlign: "right" }}>Current Yr (₹)</div>
          <div style={{ ...S.label, textAlign: "right" }}>Prev Yr (₹)</div>
        </div>

        <TwoCol label1="(a) Capital Reserve" label2="cur" v1={r.capitalReserve} v2={r.capitalReservePrev} onChange1={v => u({ capitalReserve: v })} onChange2={v => u({ capitalReservePrev: v })} />
        <TwoCol label1="(b) Securities Premium" label2="cur" v1={r.securitiesPremium} v2={r.securitiesPremiumPrev} onChange1={v => u({ securitiesPremium: v })} onChange2={v => u({ securitiesPremiumPrev: v })} />

        {/* General Reserve */}
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, marginTop: 4 }}>
          <div style={{ ...S.subhead, marginBottom: 10 }}>(c) General Reserve</div>
          <TwoCol label1="Opening Balance" v1={r.generalReserveOpen} v2={r.generalReservePrev} onChange1={v => u({ generalReserveOpen: v })} onChange2={v => u({ generalReservePrev: v })} />
          <TwoCol label1="Add: Additions during year" v1={r.generalReserveAdditions} v2="" onChange1={v => u({ generalReserveAdditions: v })} onChange2={() => {}} />
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginTop: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", paddingBottom: 8 }}>Closing Balance (auto)</div>
            <div style={S.total}>{genClose}</div>
            <div />
          </div>
        </div>

        {/* Surplus */}
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 12 }}>
          <div style={{ ...S.subhead, marginBottom: 10 }}>(d) Surplus — Statement of P&amp;L</div>
          <TwoCol label1="Opening Balance" v1={r.surplusOpeningBalance} v2={r.surplusPrev} onChange1={v => u({ surplusOpeningBalance: v })} onChange2={v => u({ surplusPrev: v })} />
          <TwoCol label1="Add: Net Profit for the year" v1={r.surplusNetProfit} v2="" onChange1={v => u({ surplusNetProfit: v })} onChange2={() => {}} />
          <TwoCol label1="Less: Dividend paid" v1={r.surplusDividend} v2="" onChange1={v => u({ surplusDividend: v })} onChange2={() => {}} />
          <TwoCol label1="Less: Transfer to General Reserve" v1={r.surplusTransferToReserve} v2="" onChange1={v => u({ surplusTransferToReserve: v })} onChange2={() => {}} />
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginTop: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", paddingBottom: 8 }}>Closing Balance (auto)</div>
            <div style={S.total}>{surplusClose}</div>
            <div />
          </div>
        </div>

        <TwoCol label1="(e) Other Reserves (specify)" label2="cur" v1={r.otherReserves} v2={r.otherReservesPrev} onChange1={v => u({ otherReserves: v })} onChange2={v => u({ otherReservesPrev: v })} />

        <div style={{ ...S.total, marginTop: 4 }}>Total Reserves & Surplus: ₹{total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
      </div>
    </NoteCard>
  );
}

// ── Notes 3 & 6 — Borrowings (reusable) ───────────────────────────────────────

function BorrowingsNote({ noteNo, title, note, onChange }: {
  noteNo: string; title: string;
  note: Note3LTBorrowings | Note6STBorrowings;
  onChange: (patch: Partial<Note3LTBorrowings>) => void;
}) {
  const total = note.items.reduce((s, i) => s + n(i.amount), 0);
  return (
    <NoteCard noteNo={noteNo} title={title}>
      {note.items.length === 0 && (
        <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12 }}>No borrowings added. Click below to add.</div>
      )}
      {note.items.map((item, idx) => (
        <div key={item.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>Borrowing {idx + 1}</span>
            <button style={S.delBtn} onClick={() => onChange({ items: note.items.filter((_, i) => i !== idx) })}>× Remove</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={S.row2}>
              <div>
                <label style={S.label}>Nature of Borrowing</label>
                <input style={S.input} value={item.nature} onChange={e => onChange({ items: note.items.map((x, i) => i === idx ? { ...x, nature: e.target.value } : x) })} placeholder="Term Loan from SBI" />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Amount (₹) — Cur</label>
                  <input type="number" style={S.numInput} value={item.amount} onChange={e => onChange({ items: note.items.map((x, i) => i === idx ? { ...x, amount: e.target.value } : x) })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Amount (₹) — Prev</label>
                  <input type="number" style={S.numInput} value={item.amountPrev} onChange={e => onChange({ items: note.items.map((x, i) => i === idx ? { ...x, amountPrev: e.target.value } : x) })} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
                <input type="checkbox" checked={item.secured} onChange={e => onChange({ items: note.items.map((x, i) => i === idx ? { ...x, secured: e.target.checked } : x) })} />
                Secured
              </label>
              {item.secured && (
                <div style={{ flex: 1 }}>
                  <input style={S.input} value={item.security || ""} onChange={e => onChange({ items: note.items.map((x, i) => i === idx ? { ...x, security: e.target.value } : x) })} placeholder="Security details (e.g. First charge on plant & machinery)" />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      <button style={S.addBtn} onClick={() => onChange({ items: [...note.items, makeEmptyBorrowingItem()] })}>+ Add Borrowing</button>
      {total > 0 && <div style={{ ...S.total, marginTop: 12 }}>Total: ₹{total.toLocaleString("en-IN")}</div>}
    </NoteCard>
  );
}

// ── Note 4 — Deferred Tax ─────────────────────────────────────────────────────

function Note4({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const d = data.note4DeferredTax;
  const u = (p: Partial<typeof d>) => updateNote("note4DeferredTax", p);
  const net = n(d.deferredTaxLiability) - n(d.deferredTaxAsset);
  return (
    <NoteCard noteNo="4" title="Deferred Tax Liabilities (Net)" defaultOpen={false}>
      <TwoCol label1="Deferred Tax Liability" label2="cur" v1={d.deferredTaxLiability} v2={d.deferredTaxLiabilityPrev} onChange1={v => u({ deferredTaxLiability: v })} onChange2={v => u({ deferredTaxLiabilityPrev: v })} />
      <TwoCol label1="Less: Deferred Tax Asset" v1={d.deferredTaxAsset} v2={d.deferredTaxAssetPrev} onChange1={v => u({ deferredTaxAsset: v })} onChange2={v => u({ deferredTaxAssetPrev: v })} />
      <div style={{ ...S.total, marginTop: 8 }}>Net Deferred Tax Liability: ₹{net.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
    </NoteCard>
  );
}

// ── Note 5 — Long-term Provisions ────────────────────────────────────────────

function Note5({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const d = data.note5LTProvisions;
  const u = (p: Partial<typeof d>) => updateNote("note5LTProvisions", p);
  return (
    <NoteCard noteNo="5" title="Long-term Provisions" defaultOpen={false}>
      <TwoCol label1="Provision for Gratuity" label2="cur" v1={d.provisionForGratuity} v2={d.provisionForGratuityPrev} onChange1={v => u({ provisionForGratuity: v })} onChange2={v => u({ provisionForGratuityPrev: v })} />
      <TwoCol label1="Provision for Leave Encashment" v1={d.provisionForLeaveEncashment} v2={d.provisionForLeaveEncashmentPrev} onChange1={v => u({ provisionForLeaveEncashment: v })} onChange2={v => u({ provisionForLeaveEncashmentPrev: v })} />
      <TwoCol label1="Other Provisions" v1={d.otherProvisions} v2={d.otherProvisionsPrev} onChange1={v => u({ otherProvisions: v })} onChange2={v => u({ otherProvisionsPrev: v })} />
    </NoteCard>
  );
}

// ── Note 7 — Trade Payables ───────────────────────────────────────────────────

function Note7({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const d = data.note7TradePayables;
  const u = (p: Partial<typeof d>) => updateNote("note7TradePayables", p);
  const total = n(d.msmeAmount) + n(d.othersAmount);

  return (
    <NoteCard noteNo="7" title="Trade Payables">
      {/* Main amounts */}
      <div style={{ ...S.subhead }}>Amount Summary</div>
      <TwoCol label1="(a) MSME (Micro & Small Enterprises)" label2="cur" v1={d.msmeAmount} v2={d.msmeAmountPrev} onChange1={v => u({ msmeAmount: v })} onChange2={v => u({ msmeAmountPrev: v })} />
      <TwoCol label1="(b) Others" v1={d.othersAmount} v2={d.othersAmountPrev} onChange1={v => u({ othersAmount: v })} onChange2={v => u({ othersAmountPrev: v })} />
      <TwoCol label1="(c) Disputed — MSME" v1={d.disputedMsme} v2={d.disputedMsmePrev} onChange1={v => u({ disputedMsme: v })} onChange2={v => u({ disputedMsmePrev: v })} />
      <TwoCol label1="(d) Disputed — Others" v1={d.disputedOthers} v2={d.disputedOthersPrev} onChange1={v => u({ disputedOthers: v })} onChange2={v => u({ disputedOthersPrev: v })} />
      {total > 0 && <div style={{ ...S.total, marginTop: 8 }}>Total Trade Payables: ₹{total.toLocaleString("en-IN")}</div>}

      {/* Ageing — 2021 Amendment */}
      <div style={{ marginTop: 18, ...S.subhead }}>Ageing Schedule (MCA 2021 Amendment)</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, border: "1px solid #e2e8f0" }}>Category</th>
              <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, border: "1px solid #e2e8f0" }}>{"< 1 Year"}</th>
              <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, border: "1px solid #e2e8f0" }}>1–2 Years</th>
              <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, border: "1px solid #e2e8f0" }}>2–3 Years</th>
              <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, border: "1px solid #e2e8f0" }}>{"> 3 Years"}</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: "MSME", key: "msmeAgeing" as const },
              { label: "Others", key: "othersAgeing" as const },
            ].map(row => (
              <tr key={row.key}>
                <td style={{ padding: "8px 10px", fontWeight: 600, border: "1px solid #e2e8f0" }}>{row.label}</td>
                {(["outstanding1yr", "outstanding13yr", "outstanding23yr", "moreThan3yr"] as const).map(field => (
                  <td key={field} style={{ border: "1px solid #e2e8f0", padding: 4 }}>
                    <input type="number" style={{ ...S.numInput, border: "none", background: "transparent" }} value={d[row.key][field]} onChange={e => u({ [row.key]: { ...d[row.key], [field]: e.target.value } } as Partial<typeof d>)} placeholder="0" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MSME Disclosure */}
      <div style={{ marginTop: 14, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: 12 }}>
        <div style={{ ...S.subhead, borderColor: "#fde68a" }}>MSME Disclosure</div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 8 }}>
          <input type="checkbox" checked={d.hasUdyamRegistration} onChange={e => u({ hasUdyamRegistration: e.target.checked })} />
          Company has Udyam / MSME Registration
        </label>
        <TwoCol label1="Interest provided to MSME (₹)" v1={d.msmeInterestProvided} v2={d.msmeInterestProvidedPrev} onChange1={v => u({ msmeInterestProvided: v })} onChange2={v => u({ msmeInterestProvidedPrev: v })} />
      </div>
    </NoteCard>
  );
}

// ── Note 8 — Other Current Liabilities ───────────────────────────────────────

function Note8({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const d = data.note8OtherCurrentLiabilities;
  const u = (p: Partial<typeof d>) => updateNote("note8OtherCurrentLiabilities", p);
  return (
    <NoteCard noteNo="8" title="Other Current Liabilities" defaultOpen={false}>
      <TwoCol label1="Current maturities of long-term borrowings" label2="cur" v1={d.currentMaturitiesLTBorrowings} v2={d.currentMaturitiesLTBorrowingsPrev} onChange1={v => u({ currentMaturitiesLTBorrowings: v })} onChange2={v => u({ currentMaturitiesLTBorrowingsPrev: v })} />
      <TwoCol label1="Interest accrued but not due" v1={d.interestAccrued} v2={d.interestAccruedPrev} onChange1={v => u({ interestAccrued: v })} onChange2={v => u({ interestAccruedPrev: v })} />
      <TwoCol label1="Advances from customers" v1={d.advancesFromCustomers} v2={d.advancesFromCustomersPrev} onChange1={v => u({ advancesFromCustomers: v })} onChange2={v => u({ advancesFromCustomersPrev: v })} />
      <TwoCol label1="Statutory dues (TDS, GST, PF, ESI)" v1={d.statutoryDues} v2={d.statutoryDuesPrev} onChange1={v => u({ statutoryDues: v })} onChange2={v => u({ statutoryDuesPrev: v })} />
      <TwoCol label1="Other payables" v1={d.otherPayables} v2={d.otherPayablesPrev} onChange1={v => u({ otherPayables: v })} onChange2={v => u({ otherPayablesPrev: v })} />
    </NoteCard>
  );
}

// ── Note 9 — Short-term Provisions ───────────────────────────────────────────

function Note9({ data, updateNote }: { data: BalanceSheetData; updateNote: Props["updateNote"] }) {
  const d = data.note9STProvisions;
  const u = (p: Partial<typeof d>) => updateNote("note9STProvisions", p);
  return (
    <NoteCard noteNo="9" title="Short-term Provisions" defaultOpen={false}>
      <TwoCol label1="Provision for Income Tax" label2="cur" v1={d.provisionForTax} v2={d.provisionForTaxPrev} onChange1={v => u({ provisionForTax: v })} onChange2={v => u({ provisionForTaxPrev: v })} />
      <TwoCol label1="Proposed Dividend" v1={d.proposedDividend} v2={d.proposedDividendPrev} onChange1={v => u({ proposedDividend: v })} onChange2={v => u({ proposedDividendPrev: v })} />
      <TwoCol label1="Other Provisions" v1={d.otherProvisions} v2={d.otherProvisionsPrev} onChange1={v => u({ otherProvisions: v })} onChange2={v => u({ otherProvisionsPrev: v })} />
    </NoteCard>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export default function Step1Liabilities({ data, update, updateNote }: Props) {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#1d4ed8", fontWeight: 600, marginBottom: 18 }}>
        📋 <strong>Equity & Liabilities</strong> — Fill Notes 1 to 9. All amounts in ₹ ({data.displayUnit}).
        The Balance Sheet Liabilities side auto-computes from these notes.
      </div>

      <Note1 data={data} updateNote={updateNote} />
      <Note2 data={data} updateNote={updateNote} />
      <BorrowingsNote noteNo="3" title="Long-term Borrowings" note={data.note3LTBorrowings} onChange={p => updateNote("note3LTBorrowings", p as Partial<Note3LTBorrowings>)} />
      <Note4 data={data} updateNote={updateNote} />
      <Note5 data={data} updateNote={updateNote} />
      <BorrowingsNote noteNo="6" title="Short-term Borrowings" note={data.note6STBorrowings} onChange={p => updateNote("note6STBorrowings", p as Partial<Note6STBorrowings>)} />
      <Note7 data={data} updateNote={updateNote} />
      <Note8 data={data} updateNote={updateNote} />
      <Note9 data={data} updateNote={updateNote} />
    </div>
  );
}
