"use client";
import { ITRData, TaxComputed, computeTax, AdvanceTax } from "@/lib/itr/types";

interface Props {
  data: ITRData;
  update: (patch: Partial<ITRData>) => void;
}

const inp = { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" as const };
const numInp = { ...inp, textAlign: "right" as const, fontFamily: "monospace" };
const lbl = { fontSize: 12, fontWeight: 700 as const, color: "#374151", marginBottom: 5, display: "block" };

function TaxRow({ label, value, big, green, red, sub }: { label: string; value: number; big?: boolean; green?: boolean; red?: boolean; sub?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: sub ? "6px 0 6px 18px" : "9px 0", borderBottom: "1px solid #f1f5f9" }}>
      <span style={{ fontSize: sub ? 12 : 13, color: sub ? "#64748b" : "#374151" }}>{label}</span>
      <span style={{ fontSize: big ? 18 : 14, fontWeight: big ? 900 : (sub ? 600 : 700), color: green ? "#059669" : red ? "#dc2626" : "#0f172a", fontFamily: "monospace" }}>
        ₹{value.toLocaleString("en-IN")}
      </span>
    </div>
  );
}

export default function Step4Tax({ data, update }: Props) {
  const tc: TaxComputed = computeTax(data);
  const hasRefund = tc.refund > 0;
  const hasDemand = tc.demand > 0;

  function addAdvanceTax() {
    update({
      advanceTaxPayments: [...data.advanceTaxPayments, {
        id: Date.now().toString(), bsrCode: "", srNo: "", date: "", amount: "", challanNo: "",
      }],
    });
  }

  function updateAT(i: number, patch: Partial<AdvanceTax>) {
    update({ advanceTaxPayments: data.advanceTaxPayments.map((a, j) => j === i ? { ...a, ...patch } : a) });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Tax Liability Banner */}
      <div style={{
        background: hasRefund ? "linear-gradient(135deg,#0f172a,#065f46)" : hasDemand ? "linear-gradient(135deg,#0f172a,#7f1d1d)" : "linear-gradient(135deg,#0f172a,#1e3a8a)",
        borderRadius: 16, padding: "24px 32px", color: "#fff",
      }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>Tax Computation — AY {data.assessmentYear} ({data.taxRegime} Regime)</div>
        <div style={{ display: "flex", gap: 48, alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Total Tax Liability</div>
            <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "monospace" }}>₹{tc.totalTaxLiability.toLocaleString("en-IN")}</div>
          </div>
          {hasRefund && (
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Refund Due</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#4ade80", fontFamily: "monospace" }}>+₹{tc.refund.toLocaleString("en-IN")}</div>
            </div>
          )}
          {hasDemand && (
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Tax Demand (Payable)</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#f87171", fontFamily: "monospace" }}>₹{tc.demand.toLocaleString("en-IN")}</div>
            </div>
          )}
          {!hasRefund && !hasDemand && (
            <div style={{ fontSize: 18, fontWeight: 700, color: "#86efac" }}>✓ NIL Balance</div>
          )}
        </div>
      </div>

      {/* Tax Computation Breakdown */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>Tax Computation</h3>
        <TaxRow label="Gross Total Income" value={tc.totalIncome} />
        <TaxRow label="Less: Chapter VI-A Deductions" value={tc.totalIncome - tc.taxableIncome} sub />
        <TaxRow label="Taxable Income" value={tc.taxableIncome} />

        {data.taxRegime === "NEW" && tc.taxableIncome <= 1200000 && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", margin: "12px 0" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>
              ✓ Rebate u/s 87A applicable — Income ≤ ₹12,00,000 under New Regime
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Tax payable = NIL (zero tax even if gross tax is positive)</div>
          </div>
        )}

        <TaxRow label="Income Tax (basic)" value={tc.basicTax} />
        {tc.surcharge > 0 && <TaxRow label="Surcharge" value={tc.surcharge} sub />}
        <TaxRow label="Health & Education Cess (4%)" value={tc.healthEduCess} sub />
        <TaxRow label="Total Tax Liability" value={tc.totalTaxLiability} big />

        <div style={{ height: 16 }} />
        <TaxRow label="TDS Credit (from 26AS)" value={tc.tdsCredit} green sub />
        <TaxRow label="Advance Tax Paid" value={tc.advanceTax} green sub />
        <TaxRow label="Total Tax Paid" value={tc.totalTaxPaid} green />

        <div style={{ height: 16 }} />
        {hasRefund && <TaxRow label="REFUND DUE" value={tc.refund} big green />}
        {hasDemand && <TaxRow label="TAX DEMAND PAYABLE" value={tc.demand} big red />}
        {!hasRefund && !hasDemand && (
          <div style={{ padding: "12px 0", textAlign: "center", fontSize: 14, fontWeight: 700, color: "#059669" }}>NIL Balance — No refund, no demand</div>
        )}
      </div>

      {/* TDS Credits (read-only, from prefill + editable) */}
      {data.tdsCredits.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 12px" }}>TDS Credits (Auto-loaded from 26AS)</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Deductor", "TAN", "Sec.", "Gross (₹)", "TDS (₹)"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, textAlign: h.includes("₹") ? "right" as const : "left" as const, borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.tdsCredits.map((t, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>{t.employerOrDeductorOrCollecterName}</td>
                    <td style={{ padding: "8px 12px", fontSize: 12, fontFamily: "monospace", color: "#64748b" }}>{t.tan}</td>
                    <td style={{ padding: "8px 12px", fontSize: 12 }}>
                      <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{t.sectionCode}</span>
                    </td>
                    <td style={{ padding: "8px 12px", fontSize: 13, textAlign: "right" as const }}>₹{t.grossAmount.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "8px 12px", fontSize: 13, fontWeight: 700, color: "#059669", textAlign: "right" as const }}>₹{t.taxDeductedOwnHands.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f0fdf4" }}>
                  <td colSpan={3} style={{ padding: "9px 12px", fontWeight: 700, fontSize: 13 }}>Total TDS</td>
                  <td style={{ padding: "9px 12px", textAlign: "right" as const, fontWeight: 700 }}>₹{data.tdsCredits.reduce((s, t) => s + t.grossAmount, 0).toLocaleString("en-IN")}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right" as const, fontWeight: 800, color: "#059669", fontSize: 14 }}>₹{data.tdsCredits.reduce((s, t) => s + t.taxDeductedOwnHands, 0).toLocaleString("en-IN")}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Advance Tax / Self-assessment */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>Advance Tax / Self-Assessment Tax Paid</h3>
          <button onClick={addAdvanceTax} style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Add Challan</button>
        </div>
        {data.advanceTaxPayments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: 13 }}>No advance tax payments — click + Add Challan</div>
        ) : data.advanceTaxPayments.map((at, i) => (
          <div key={at.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px", marginBottom: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr auto", gap: 12, alignItems: "flex-end" }}>
              <div>
                <label style={lbl}>BSR Code</label>
                <input style={inp} value={at.bsrCode} onChange={e => updateAT(i, { bsrCode: e.target.value })} placeholder="7-digit" />
              </div>
              <div>
                <label style={lbl}>Challan No.</label>
                <input style={inp} value={at.challanNo} onChange={e => updateAT(i, { challanNo: e.target.value })} />
              </div>
              <div>
                <label style={lbl}>Sr. No.</label>
                <input style={inp} value={at.srNo} onChange={e => updateAT(i, { srNo: e.target.value })} />
              </div>
              <div>
                <label style={lbl}>Date of Deposit</label>
                <input type="date" style={inp} value={at.date} onChange={e => updateAT(i, { date: e.target.value })} />
              </div>
              <div>
                <label style={lbl}>Amount (₹)</label>
                <input style={numInp} value={at.amount} onChange={e => updateAT(i, { amount: e.target.value })} placeholder="0" />
              </div>
              <button onClick={() => update({ advanceTaxPayments: data.advanceTaxPayments.filter((_, j) => j !== i) })}
                style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "8px 12px", cursor: "pointer", marginBottom: 1 }}>✕</button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
