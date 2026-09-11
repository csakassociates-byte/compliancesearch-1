"use client";
import { ITRData, SalaryIncome, HouseProperty, CapitalGain, OtherSourceIncome } from "@/lib/itr/types";

interface Props {
  data: ITRData;
  update: (patch: Partial<ITRData>) => void;
}

const inp = { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" as const };
const numInp = { ...inp, textAlign: "right" as const, fontFamily: "monospace" };
const lbl = { fontSize: 12, fontWeight: 700 as const, color: "#374151", marginBottom: 5, display: "block" };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" as const }}>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  );
}

const n = (v: string) => parseFloat(v) || 0;

// ── Salary ──────────────────────────────────────────────────────────────────
function SalarySection({ data, update }: Props) {
  const updateSalary = (i: number, patch: Partial<SalaryIncome>) => {
    const salaries = data.salaries.map((s, j) => {
      if (j !== i) return s;
      const updated = { ...s, ...patch };
      const net = n(updated.grossSalary) - n(updated.standardDeduction) - n(updated.profTax);
      return { ...updated, netSalary: String(Math.max(0, net)) };
    });
    update({ salaries });
  };
  const addSalary = () => update({
    salaries: [...data.salaries, { employerName: "", tan: "", grossSalary: "", standardDeduction: data.taxRegime === "NEW" ? "75000" : "50000", profTax: "", netSalary: "" }],
  });

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>Salary Income</h3>
        <button onClick={addSalary} style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Add Employer</button>
      </div>
      {data.salaries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8", fontSize: 13 }}>No salary income — click + Add Employer</div>
      ) : data.salaries.map((s, i) => (
        <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Employer {i + 1}</span>
            <button onClick={() => update({ salaries: data.salaries.filter((_, j) => j !== i) })} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" }}>Remove</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", gap: 12 }}>
            <Row label="Employer Name"><input style={inp} value={s.employerName} onChange={e => updateSalary(i, { employerName: e.target.value })} /></Row>
            <Row label="TAN"><input style={{ ...inp, fontFamily: "monospace" }} value={s.tan} onChange={e => updateSalary(i, { tan: e.target.value.toUpperCase() })} maxLength={10} /></Row>
            <Row label="Gross Salary (₹)"><input style={numInp} value={s.grossSalary} onChange={e => updateSalary(i, { grossSalary: e.target.value })} placeholder="0" /></Row>
            <Row label="Standard Deduction (₹)"><input style={numInp} value={s.standardDeduction} onChange={e => updateSalary(i, { standardDeduction: e.target.value })} /></Row>
            <Row label="Prof. Tax (₹)"><input style={numInp} value={s.profTax} onChange={e => updateSalary(i, { profTax: e.target.value })} placeholder="0" /></Row>
            <Row label="Net Salary (₹)">
              <div style={{ ...numInp, background: "#f0fdf4", color: "#166534", fontWeight: 700, display: "flex", alignItems: "center", borderRadius: 8, height: 38, paddingRight: 12 }}>
                ₹{n(s.netSalary).toLocaleString("en-IN")}
              </div>
            </Row>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Business / Profession ────────────────────────────────────────────────────
function BusinessSection({ data, update }: Props) {
  const bi = data.businessIncome;
  const updateBI = (patch: Partial<typeof bi>) => update({ businessIncome: { ...bi, ...patch } });
  const showBusiness = ["ITR-3", "ITR-4"].includes(data.itrForm);
  if (!showBusiness) return null;

  const presumptiveAmt = bi.schemeType === "44ADA"
    ? Math.max(0, n(bi.grossReceipts) * 0.5)
    : bi.schemeType === "44AD"
    ? Math.max(0, n(bi.grossReceipts) * 0.08)
    : 0;

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px" }}>
      <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>
        {data.itrForm === "ITR-4" ? "Presumptive Business / Profession Income" : "Business / Profession Income (ITR-3)"}
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
        <Row label="Scheme / Method">
          <select style={inp} value={bi.schemeType} onChange={e => updateBI({ schemeType: e.target.value as typeof bi.schemeType })}>
            <option value="44ADA">44ADA — Profession (50% of receipts)</option>
            <option value="44AD">44AD — Business (8%/6% of turnover)</option>
            <option value="44AE">44AE — Goods carriage</option>
            {data.itrForm === "ITR-3" && <option value="NORMAL">Normal — P&L based</option>}
          </select>
        </Row>
        <Row label="Firm / Trade Name">
          <input style={inp} value={bi.firmName} onChange={e => updateBI({ firmName: e.target.value })} placeholder="Your firm or trade name" />
        </Row>
        <Row label="Nature Code (NIC)">
          <input style={inp} value={bi.natureCode} onChange={e => updateBI({ natureCode: e.target.value })} placeholder="e.g. 21008" />
        </Row>
      </div>

      {(bi.schemeType === "44ADA" || bi.schemeType === "44AD" || bi.schemeType === "44AE") && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <Row label="Gross Receipts / Turnover (₹)">
            <input style={numInp} value={bi.grossReceipts} onChange={e => updateBI({ grossReceipts: e.target.value })} placeholder="0" />
          </Row>
          <Row label={bi.schemeType === "44ADA" ? "Presumptive Income (50%) (₹)" : "Presumptive Income (8%) (₹)"}>
            <div style={{ ...numInp, background: "#f0fdf4", color: "#166534", fontWeight: 700, display: "flex", alignItems: "center", height: 38, borderRadius: 8 }}>
              ₹{presumptiveAmt.toLocaleString("en-IN")}
              <span style={{ fontSize: 11, color: "#86efac", marginLeft: 8 }}>Auto</span>
            </div>
          </Row>
          {bi.schemeType === "44ADA" && (
            <Row label="WDV of P&M at start of year (₹)">
              <input style={numInp} value={bi.wdvOpeningPlantMachinery} onChange={e => updateBI({ wdvOpeningPlantMachinery: e.target.value })} placeholder="From prev. ITR" />
            </Row>
          )}
        </div>
      )}

      {bi.schemeType === "NORMAL" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <Row label="Net Profit as per P&L (₹)"><input style={numInp} value={bi.netProfitAsPerPL} onChange={e => updateBI({ netProfitAsPerPL: e.target.value })} /></Row>
          <Row label="Add-backs / Disallowances (₹)"><input style={numInp} value={bi.disallowances} onChange={e => updateBI({ disallowances: e.target.value })} /></Row>
          <Row label="Depreciation (₹)"><input style={numInp} value={bi.depreciation} onChange={e => updateBI({ depreciation: e.target.value })} /></Row>
          <Row label="Profit from Business (₹)">
            <div style={{ ...numInp, background: "#f0fdf4", color: "#166534", fontWeight: 700, display: "flex", alignItems: "center", height: 38, borderRadius: 8 }}>
              ₹{(n(bi.netProfitAsPerPL) + n(bi.disallowances) + n(bi.depreciation)).toLocaleString("en-IN")}
            </div>
          </Row>
        </div>
      )}
    </div>
  );
}

// ── Other Sources ────────────────────────────────────────────────────────────
function OtherSourcesSection({ data, update }: Props) {
  const oi = data.otherIncome;
  const updateOI = (patch: Partial<OtherSourceIncome>) => update({ otherIncome: { ...oi, ...patch } });

  const total = n(oi.savingsInterest) + n(oi.fdInterest) + n(oi.dividendIncome) + n(oi.familyPension) +
    oi.otherItems.reduce((s, x) => s + n(x.amount), 0);

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>Other Sources Income</h3>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#1d4ed8" }}>Total: ₹{total.toLocaleString("en-IN")}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
        <Row label="Savings Bank Interest (₹)">
          <input style={numInp} value={oi.savingsInterest} onChange={e => updateOI({ savingsInterest: e.target.value })} placeholder="0" />
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Eligible for 80TTA (up to ₹10,000)</div>
        </Row>
        <Row label="FD / Other Interest (₹)">
          <input style={numInp} value={oi.fdInterest} onChange={e => updateOI({ fdInterest: e.target.value })} placeholder="0" />
        </Row>
        <Row label="Dividend Income (₹)">
          <input style={numInp} value={oi.dividendIncome} onChange={e => updateOI({ dividendIncome: e.target.value })} placeholder="0" />
          {n(oi.dividendIncome) > 0 && <div style={{ fontSize: 11, color: "#059669", marginTop: 4 }}>Auto-loaded from 26AS</div>}
        </Row>
        <Row label="Family Pension (₹)">
          <input style={numInp} value={oi.familyPension} onChange={e => updateOI({ familyPension: e.target.value })} placeholder="0" />
        </Row>
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <label style={{ ...lbl, marginBottom: 0 }}>Other Items</label>
          <button onClick={() => updateOI({ otherItems: [...oi.otherItems, { id: Date.now().toString(), description: "", amount: "" }] })}
            style={{ background: "#f1f5f9", color: "#374151", border: "none", borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            + Add Item
          </button>
        </div>
        {oi.otherItems.map((item, i) => (
          <div key={item.id} style={{ display: "grid", gridTemplateColumns: "3fr 1fr auto", gap: 10, marginBottom: 8 }}>
            <input style={inp} value={item.description} placeholder="Description"
              onChange={e => updateOI({ otherItems: oi.otherItems.map((x, j) => j === i ? { ...x, description: e.target.value } : x) })} />
            <input style={numInp} value={item.amount} placeholder="Amount"
              onChange={e => updateOI({ otherItems: oi.otherItems.map((x, j) => j === i ? { ...x, amount: e.target.value } : x) })} />
            <button onClick={() => updateOI({ otherItems: oi.otherItems.filter((_, j) => j !== i) })}
              style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 14 }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Step2Income({ data, update }: Props) {
  const totalIncome =
    data.salaries.reduce((s, x) => s + n(x.netSalary), 0) +
    data.houseProperties.reduce((s, x) => s + n(x.netHPIncome), 0) +
    (data.businessIncome.schemeType === "44ADA" ? Math.max(0, n(data.businessIncome.grossReceipts) * 0.5) :
     data.businessIncome.schemeType === "44AD" ? Math.max(0, n(data.businessIncome.grossReceipts) * 0.08) :
     n(data.businessIncome.profitFromBusiness)) +
    n(data.otherIncome.savingsInterest) + n(data.otherIncome.fdInterest) + n(data.otherIncome.dividendIncome) +
    n(data.otherIncome.familyPension) + data.otherIncome.otherItems.reduce((s, x) => s + n(x.amount), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Summary banner */}
      <div style={{ background: "linear-gradient(135deg,#0f172a,#1e3a8a)", borderRadius: 16, padding: "20px 28px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Gross Total Income (so far)</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>₹{totalIncome.toLocaleString("en-IN")}</div>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: "right" }}>
          <div>AY {data.assessmentYear} · {data.itrForm}</div>
          <div style={{ marginTop: 4 }}>{data.taxRegime} Regime · {data.residentialStatus}</div>
        </div>
      </div>

      {/* Show only relevant income types based on ITR form */}
      {(data.itrForm === "ITR-1" || data.itrForm === "ITR-2") && <SalarySection data={data} update={update} />}
      {(data.itrForm === "ITR-3" || data.itrForm === "ITR-4") && <BusinessSection data={data} update={update} />}
      <OtherSourcesSection data={data} update={update} />

    </div>
  );
}
