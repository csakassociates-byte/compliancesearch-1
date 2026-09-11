"use client";
import { useRef } from "react";
import { ITRData, ITRForm, TaxRegime, parsePrefill, PrefillData, SECTION_LABELS } from "@/lib/itr/types";

interface Props {
  data: ITRData;
  update: (patch: Partial<ITRData>) => void;
  onPrefillLoaded: (prefill: PrefillData) => void;
}

const ITR_FORMS: { value: ITRForm; label: string; desc: string }[] = [
  { value: "ITR-1", label: "ITR-1 (Sahaj)", desc: "Salary + one HP + other sources. No business income. Income ≤ ₹50 lakh." },
  { value: "ITR-2", label: "ITR-2", desc: "Salary + capital gains + multiple HP. No business income." },
  { value: "ITR-3", label: "ITR-3", desc: "Business / Profession income with P&L & Balance Sheet." },
  { value: "ITR-4", label: "ITR-4 (Sugam)", desc: "Presumptive income under 44AD / 44ADA / 44AE." },
];

const AY_OPTIONS = ["2026-27", "2025-26", "2024-25"];

export default function Step0Prefill({ data, update, onPrefillLoaded }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string) as Record<string, unknown>;
        const prefill = parsePrefill(raw);
        onPrefillLoaded(prefill);
      } catch {
        alert("Invalid prefill JSON. Please upload the file downloaded from the Income Tax portal.");
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  }

  const inp = { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" as const, outline: "none" };
  const lbl = { fontSize: 12, fontWeight: 700 as const, color: "#374151", marginBottom: 5, display: "block" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Prefill upload */}
      <div style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%)", borderRadius: 18, padding: "28px 32px", color: "#fff" }}>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>
          Upload Prefill JSON from IT Portal
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 20, lineHeight: 1.6 }}>
          Income Tax Portal → e-File → Income Tax Returns → <strong>Download Pre-filled XML/JSON</strong><br />
          Upload that JSON here — all available data auto-populates.
        </div>

        <input type="file" accept=".json" ref={fileRef} onChange={handleFile} style={{ display: "none" }} />

        <button
          onClick={() => fileRef.current?.click()}
          style={{
            background: "#3b82f6", color: "#fff", border: "none", borderRadius: 12,
            padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 10,
          }}
        >
          <span style={{ fontSize: 18 }}>📂</span>
          Upload Prefill JSON (PAN*****-Prefill-*.json)
        </button>

        {data.hasPrefill && (
          <div style={{ marginTop: 16, padding: "12px 18px", background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.4)", borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#4ade80" }}>Prefill loaded — {data.pan}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{data.firstName} {data.middleName} {data.lastName} | {data.tdsCredits.length} TDS entries | {data.bankAccounts.length} bank accounts</div>
            </div>
            <button onClick={() => fileRef.current?.click()} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>
              Re-upload
            </button>
          </div>
        )}
      </div>

      {/* ITR Form selection */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>Select ITR Form</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {ITR_FORMS.map(f => (
            <button
              key={f.value}
              onClick={() => update({ itrForm: f.value })}
              style={{
                padding: "14px 16px", borderRadius: 12, textAlign: "left" as const, cursor: "pointer",
                border: `2px solid ${data.itrForm === f.value ? "#3b82f6" : "#e2e8f0"}`,
                background: data.itrForm === f.value ? "#eff6ff" : "#f8fafc",
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: data.itrForm === f.value ? "#1d4ed8" : "#0f172a", marginBottom: 4 }}>{f.label}</div>
              <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{f.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Assessment Year + Tax Regime */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>Filing Details</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={lbl}>Assessment Year</label>
            <select value={data.assessmentYear} onChange={e => update({ assessmentYear: e.target.value })} style={inp}>
              {AY_OPTIONS.map(ay => <option key={ay} value={ay}>AY {ay}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Tax Regime</label>
            <div style={{ display: "flex", gap: 12 }}>
              {(["NEW", "OLD"] as TaxRegime[]).map(r => (
                <button key={r} onClick={() => update({ taxRegime: r })} style={{
                  flex: 1, padding: "9px 12px", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer",
                  border: `2px solid ${data.taxRegime === r ? "#3b82f6" : "#e2e8f0"}`,
                  background: data.taxRegime === r ? "#eff6ff" : "#f8fafc",
                  color: data.taxRegime === r ? "#1d4ed8" : "#374151",
                }}>
                  {r === "NEW" ? "🆕 New Regime" : "📜 Old Regime"}
                </button>
              ))}
            </div>
            {data.taxRegime === "NEW" && (
              <div style={{ marginTop: 8, fontSize: 11, color: "#059669", fontWeight: 600 }}>
                AY 2026-27: Income up to ₹12 lakh — Zero tax under new regime
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TDS Credits from prefill */}
      {data.tdsCredits.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
            TDS Credits from Form 26AS
            <span style={{ fontSize: 12, fontWeight: 600, color: "#059669", marginLeft: 10 }}>Auto-loaded from prefill</span>
          </h3>
          <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 14px" }}>These will be auto-credited against your tax liability.</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Deductor", "TAN", "Section", "Gross Amount (₹)", "TDS Deducted (₹)", "Head"].map(h => (
                    <th key={h} style={{ padding: "9px 12px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.04em", textAlign: h.includes("₹") ? "right" as const : "left" as const, borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.tdsCredits.map((t, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "9px 12px", fontSize: 13, fontWeight: 600 }}>{t.employerOrDeductorOrCollecterName}</td>
                    <td style={{ padding: "9px 12px", fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>{t.tan}</td>
                    <td style={{ padding: "9px 12px", fontSize: 12 }}>
                      <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                        Sec {t.sectionCode}
                      </span>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{SECTION_LABELS[t.sectionCode] ?? ""}</div>
                    </td>
                    <td style={{ padding: "9px 12px", fontSize: 13, textAlign: "right" as const }}>₹{t.grossAmount.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "9px 12px", fontSize: 13, fontWeight: 700, color: "#dc2626", textAlign: "right" as const }}>₹{t.taxDeductedOwnHands.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "9px 12px", fontSize: 12, color: "#64748b" }}>{t.headOfIncome}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f0fdf4" }}>
                  <td colSpan={3} style={{ padding: "9px 12px", fontSize: 13, fontWeight: 700 }}>Total TDS Credit</td>
                  <td style={{ padding: "9px 12px", fontSize: 13, fontWeight: 700, textAlign: "right" as const }}>
                    ₹{data.tdsCredits.reduce((s, t) => s + t.grossAmount, 0).toLocaleString("en-IN")}
                  </td>
                  <td style={{ padding: "9px 12px", fontSize: 14, fontWeight: 800, color: "#059669", textAlign: "right" as const }}>
                    ₹{data.tdsCredits.reduce((s, t) => s + t.taxDeductedOwnHands, 0).toLocaleString("en-IN")}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Carry Forward Losses */}
      {data.carryForwardLosses.length > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 16, padding: "20px 24px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "#92400e", margin: "0 0 12px" }}>
            ⚠ Carry Forward Losses (from previous ITR)
          </h3>
          {data.carryForwardLosses.map((c, i) => (
            <div key={i} style={{ fontSize: 13, color: "#78350f", marginBottom: 6 }}>
              AY {c.AssessmentYear}: Business Loss ₹{c.LossFrmSpecBusCF.toLocaleString("en-IN")}
              {c.HpLossCF > 0 && ` | HP Loss ₹${c.HpLossCF.toLocaleString("en-IN")}`}
              {c.StcgLossCF > 0 && ` | STCG Loss ₹${c.StcgLossCF.toLocaleString("en-IN")}`}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
