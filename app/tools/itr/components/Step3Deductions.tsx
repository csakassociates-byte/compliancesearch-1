"use client";
import { ITRData, DeductionVIA } from "@/lib/itr/types";

interface Props {
  data: ITRData;
  update: (patch: Partial<ITRData>) => void;
}

const inp = { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" as const, textAlign: "right" as const, fontFamily: "monospace" };
const lbl = { fontSize: 12, fontWeight: 700 as const, color: "#374151", marginBottom: 4, display: "block" };
const n = (v: string) => parseFloat(v) || 0;

interface DedItem {
  key: keyof DeductionVIA;
  label: string;
  sub: string;
  cap?: number;
  regimeAvailable: "BOTH" | "OLD" | "NEW";
}

const DEDUCTIONS: DedItem[] = [
  { key: "sec80C", label: "80C", sub: "LIC, PPF, ELSS, Tuition, EPF, NSC, etc.", cap: 150000, regimeAvailable: "OLD" },
  { key: "sec80CCC", label: "80CCC", sub: "Pension fund contribution", cap: 150000, regimeAvailable: "OLD" },
  { key: "sec80CCD1", label: "80CCD(1)", sub: "NPS - Own contribution (within 80C limit)", cap: 150000, regimeAvailable: "OLD" },
  { key: "sec80CCD1B", label: "80CCD(1B)", sub: "NPS - Additional (over & above 80C)", cap: 50000, regimeAvailable: "BOTH" },
  { key: "sec80CCD2", label: "80CCD(2)", sub: "NPS - Employer contribution (no cap)", regimeAvailable: "BOTH" },
  { key: "sec80D_self", label: "80D - Self & Family", sub: "Medical insurance premium (self + family)", cap: 25000, regimeAvailable: "OLD" },
  { key: "sec80D_parents", label: "80D - Parents", sub: "Medical insurance premium (parents)", cap: 50000, regimeAvailable: "OLD" },
  { key: "sec80DD", label: "80DD", sub: "Disabled dependent (₹75,000 / ₹1,25,000)", regimeAvailable: "OLD" },
  { key: "sec80DDB", label: "80DDB", sub: "Medical treatment of specified illness", regimeAvailable: "OLD" },
  { key: "sec80E", label: "80E", sub: "Interest on education loan (no cap)", regimeAvailable: "OLD" },
  { key: "sec80EE", label: "80EE", sub: "Home loan interest - first home", cap: 50000, regimeAvailable: "OLD" },
  { key: "sec80EEA", label: "80EEA", sub: "Home loan interest - affordable housing", cap: 150000, regimeAvailable: "OLD" },
  { key: "sec80G", label: "80G", sub: "Donations to approved funds/institutions", regimeAvailable: "OLD" },
  { key: "sec80GG", label: "80GG", sub: "Rent paid (where no HRA received)", regimeAvailable: "OLD" },
  { key: "sec80TTA", label: "80TTA", sub: "Savings bank interest (non-senior citizen)", cap: 10000, regimeAvailable: "OLD" },
  { key: "sec80TTB", label: "80TTB", sub: "Interest income (senior citizen only)", cap: 50000, regimeAvailable: "OLD" },
  { key: "sec80U", label: "80U", sub: "Disability of assessee", regimeAvailable: "OLD" },
];

export default function Step3Deductions({ data, update }: Props) {
  const ded = data.deductions;
  const updateDed = (patch: Partial<DeductionVIA>) => update({ deductions: { ...ded, ...patch } });
  const isNew = data.taxRegime === "NEW";

  const visible = DEDUCTIONS.filter(d => d.regimeAvailable === "BOTH" || (isNew ? d.regimeAvailable === "NEW" : d.regimeAvailable === "OLD"));

  // 80C family cap
  const sec80CFamily = Math.min(150000, n(ded.sec80C) + n(ded.sec80CCC) + n(ded.sec80CCD1));
  const totalDed = isNew
    ? n(ded.sec80CCD2) + n(ded.sec80CCD1B)
    : sec80CFamily + n(ded.sec80CCD1B) + n(ded.sec80CCD2) +
      Math.min(25000, n(ded.sec80D_self)) + Math.min(50000, n(ded.sec80D_parents)) +
      n(ded.sec80DD) + n(ded.sec80DDB) + n(ded.sec80E) + n(ded.sec80EE) + n(ded.sec80EEA) +
      n(ded.sec80G) + n(ded.sec80GG) + Math.min(10000, n(ded.sec80TTA)) + Math.min(50000, n(ded.sec80TTB)) + n(ded.sec80U);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg,#0f172a,#4f46e5)", borderRadius: 16, padding: "20px 28px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Chapter VI-A Deductions</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>₹{totalDed.toLocaleString("en-IN")}</div>
        </div>
        {isNew && (
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 20px", textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>New Regime</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", marginTop: 4 }}>Only 80CCD(1B) & 80CCD(2) available</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Most deductions not allowed in new regime</div>
          </div>
        )}
        {!isNew && (
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 20px", textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Old Regime</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#86efac", marginTop: 4 }}>80C Family (capped ₹1.5L): ₹{sec80CFamily.toLocaleString("en-IN")}</div>
          </div>
        )}
      </div>

      {/* Deduction grid */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {visible.map(d => (
            <div key={d.key} style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px", border: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Section {d.label}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, lineHeight: 1.4 }}>{d.sub}</div>
                </div>
                {d.cap && <span style={{ fontSize: 10, background: "#eff6ff", color: "#1d4ed8", padding: "2px 8px", borderRadius: 8, fontWeight: 700, whiteSpace: "nowrap", marginLeft: 8 }}>Max ₹{(d.cap / 100000).toFixed(1)}L</span>}
              </div>
              <input
                style={{ ...inp, background: "#fff" }}
                value={ded[d.key]}
                onChange={e => updateDed({ [d.key]: e.target.value } as Partial<DeductionVIA>)}
                placeholder="₹ 0"
              />
              {d.cap && n(ded[d.key]) > d.cap && (
                <div style={{ fontSize: 11, color: "#dc2626", marginTop: 4 }}>⚠ Capped at ₹{d.cap.toLocaleString("en-IN")}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Total summary */}
      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: "18px 24px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 8 }}>Deduction Summary</div>
        {!isNew && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#374151", marginBottom: 4 }}>
              <span>80C Family (LIC + PPF + NPS) — capped at ₹1,50,000</span>
              <span style={{ fontWeight: 700 }}>₹{sec80CFamily.toLocaleString("en-IN")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#374151", marginBottom: 4 }}>
              <span>80CCD(1B) — NPS Additional</span>
              <span style={{ fontWeight: 700 }}>₹{Math.min(50000, n(ded.sec80CCD1B)).toLocaleString("en-IN")}</span>
            </div>
          </>
        )}
        {isNew && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#374151", marginBottom: 4 }}>
            <span>80CCD(1B) + 80CCD(2)</span>
            <span style={{ fontWeight: 700 }}>₹{(n(ded.sec80CCD1B) + n(ded.sec80CCD2)).toLocaleString("en-IN")}</span>
          </div>
        )}
        <div style={{ borderTop: "1px solid #bbf7d0", marginTop: 8, paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 900, color: "#166534" }}>
          <span>Total Deductions</span>
          <span>₹{totalDed.toLocaleString("en-IN")}</span>
        </div>
      </div>

    </div>
  );
}
