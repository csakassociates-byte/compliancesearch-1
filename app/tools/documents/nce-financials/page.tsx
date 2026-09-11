"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { NCEFinancialsData, NCEFinancialYear, INITIAL_NCE_DATA } from "@/lib/nce-financials/types";
import Step0Setup from "./components/Step0Setup";
import Step1OwnersCapital from "./components/Step1OwnersCapital";
import Step2Liabilities from "./components/Step2Liabilities";
import Step3Assets from "./components/Step3Assets";
import Step4PL from "./components/Step4PL";
import Preview from "./components/Preview";

function getFYLabels(fy: NCEFinancialYear): { current: string; prev: string } {
  const endYear = 2000 + parseInt(fy.split("-")[1], 10);
  return {
    current: `Year ended 31st March ${endYear}`,
    prev: `Year ended 31st March ${endYear - 1}`,
  };
}

const STEPS = [
  { id: 0, label: "Setup", icon: "⚙" },
  { id: 1, label: "Owners' Capital", icon: "👥" },
  { id: 2, label: "Liabilities", icon: "📋" },
  { id: 3, label: "Assets", icon: "🏗" },
  { id: 4, label: "P&L", icon: "📈" },
  { id: 5, label: "Preview", icon: "👁" },
];

function NCEFinancialsInner() {
  const searchParams = useSearchParams();
  const loadId = searchParams.get("load");

  const [step, setStep] = useState(0);
  const [data, setData] = useState<NCEFinancialsData>(INITIAL_NCE_DATA);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | undefined>(undefined);
  const [saveMsg, setSaveMsg] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load existing doc
  useEffect(() => {
    if (!loadId) return;
    fetch(`/api/nce-financials?id=${loadId}`)
      .then(r => r.json())
      .then((j: { doc?: { formDataJson: string; id: string } }) => {
        if (j.doc?.formDataJson) {
          const parsed = JSON.parse(j.doc.formDataJson) as NCEFinancialsData;
          setData({ ...INITIAL_NCE_DATA, ...parsed });
          setSavedId(loadId);
        }
      })
      .catch(() => {});
  }, [loadId]);

  function update(patch: Partial<NCEFinancialsData>) {
    setData(prev => ({ ...prev, ...patch }));
  }

  const save = useCallback(async () => {
    if (!data.entityName) { setSaveMsg("Please enter Entity Name first."); return; }
    setSaving(true); setSaveMsg("");
    try {
      const body = {
        id: savedId,
        entityName: data.entityName,
        financialYear: data.financialYear,
        title: `NCE Financial Statements — ${data.entityName} — FY ${data.financialYear}`,
        formDataJson: JSON.stringify(data),
      };
      const res = await fetch("/api/nce-financials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await res.json() as { id?: string; error?: string };
      if (j.id) { setSavedId(j.id); setSaveMsg("Saved successfully!"); }
      else setSaveMsg(j.error || "Save failed.");
    } catch { setSaveMsg("Save failed."); }
    finally { setSaving(false); setTimeout(() => setSaveMsg(""), 3000); }
  }, [data, savedId]);

  // Auto-save every 30s
  useEffect(() => {
    if (!data.entityName) return;
    const t = setTimeout(() => { void save(); }, 30000);
    return () => clearTimeout(t);
  }, [data, save]);

  function handlePrint(withLetterhead: boolean) {
    const fyLabels = getFYLabels(data.financialYear);
    const endYear = 2000 + parseInt(data.financialYear.split("-")[1], 10);

    const letterhead = withLetterhead ? `
      <div style="text-align:center;padding:20px 0 16px;border-bottom:3px solid #0f172a;margin-bottom:24px;">
        <div style="font-size:22px;font-weight:900;color:#0f172a;">${data.entityName}</div>
        <div style="font-size:13px;color:#374151;margin-top:4px;">${data.address}</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px;">PAN: ${data.pan}${data.gstin ? ` | GSTIN: ${data.gstin}` : ""}</div>
      </div>
    ` : "";

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>NCE Financial Statements — ${data.entityName}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:12px;color:#222;margin:0;padding:20px;}
      @media print{body{padding:0;}}
      table{width:100%;border-collapse:collapse;margin-bottom:24px;}
      th,td{padding:6px 10px;border-bottom:1px solid #e2e8f0;}
      .hdr{background:#0f172a;color:#fff;font-weight:700;}
      .total{font-weight:700;background:#f8fafc;}
      .profit{background:#f0fdf4;color:#166534;font-weight:700;}
      .loss{background:#fef2f2;color:#991b1b;font-weight:700;}
      .right{text-align:right;}
      .center{text-align:center;}
      h2{text-align:center;font-size:16px;margin:0 0 4px;}
      h3{text-align:center;font-size:13px;color:#374151;font-weight:400;margin:0 0 20px;}
      .sig{display:flex;justify-content:space-between;margin-top:40px;gap:40px;}
      .sig-box{flex:1;}
      .sig-line{border-top:1px solid #374151;padding-top:4px;margin-top:40px;}
    </style></head><body>
    ${letterhead}
    <h2>${data.entityName}</h2>
    <h3>Balance Sheet as at 31st March ${endYear}<br><small>As per ICAI Guidance Note on Financial Statements for Non-Corporate Entities</small></h3>
    <div id="bs-content"></div>
    <script>
      // The preview HTML is rendered server-side inline
    </script>
    </body></html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) {
      win.addEventListener("load", () => {
        setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 400);
      });
    }
  }

  const fyLabels = getFYLabels(data.financialYear);

  return (
    <>
      <Navbar />
      <div style={{ display: "flex", minHeight: "calc(100vh - 64px)", background: "#f8fafc", fontFamily: "system-ui,-apple-system,sans-serif" }}>

        {/* Sidebar */}
        <aside style={{
          width: sidebarOpen ? 230 : 60, flexShrink: 0, background: "#162032", color: "#fff",
          display: "flex", flexDirection: "column", transition: "width 0.2s ease",
          borderRight: "1px solid rgba(255,255,255,0.08)", overflow: "hidden",
        }}>
          <div style={{ padding: "18px 14px 12px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {sidebarOpen && <div style={{ fontSize: 13, fontWeight: 800, color: "#4ade80", whiteSpace: "nowrap" as const }}>NCE Financials</div>}
              <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#94a3b8", borderRadius: 8, padding: "5px 9px", cursor: "pointer", fontSize: 14 }}>
                {sidebarOpen ? "◀" : "▶"}
              </button>
            </div>
            {sidebarOpen && data.entityName && (
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{data.entityName}</div>
            )}
          </div>

          <nav style={{ flex: 1, padding: "8px 0" }}>
            {STEPS.map(s => (
              <button key={s.id} onClick={() => setStep(s.id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: sidebarOpen ? "10px 16px" : "10px 0", justifyContent: sidebarOpen ? "flex-start" : "center",
                background: step === s.id ? "rgba(74,222,128,0.12)" : "transparent",
                border: "none", borderLeft: `3px solid ${step === s.id ? "#4ade80" : "transparent"}`,
                color: step === s.id ? "#4ade80" : "#94a3b8", cursor: "pointer",
                fontSize: 13, fontWeight: step === s.id ? 700 : 400, transition: "all 0.15s",
              }}>
                <span style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  background: step === s.id ? "#4ade80" : "rgba(255,255,255,0.08)",
                  color: step === s.id ? "#0f172a" : "#94a3b8",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800,
                }}>{s.icon}</span>
                {sidebarOpen && <span style={{ whiteSpace: "nowrap" as const }}>{s.label}</span>}
              </button>
            ))}
          </nav>

          {sidebarOpen && (
            <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <button onClick={save} disabled={saving} style={{
                width: "100%", background: saving ? "#1e3a5f" : "#0ea5e9", color: "#fff", border: "none",
                borderRadius: 8, padding: "9px", fontSize: 12, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
              }}>
                {saving ? "Saving…" : "💾 Save"}
              </button>
              {saveMsg && <div style={{ fontSize: 11, marginTop: 6, color: saveMsg.includes("success") ? "#4ade80" : "#fca5a5", textAlign: "center" }}>{saveMsg}</div>}
            </div>
          )}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflow: "auto", padding: "24px 28px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>

            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 12, color: "#64748b" }}>
              <a href="/tools/documents/balance-sheet" style={{ color: "#94a3b8", textDecoration: "none" }}>Financial Statements</a>
              <span>›</span>
              <span style={{ color: "#374151", fontWeight: 600 }}>NCE Financials</span>
              {data.entityName && <><span>›</span><span style={{ color: "#0ea5e9" }}>{data.entityName}</span></>}
            </div>

            {/* Step header */}
            <div style={{ marginBottom: 22 }}>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                {STEPS[step].icon} {STEPS[step].label}
              </h1>
              <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                {step === 0 && "Set up entity details, financial year, auditor and signatory information."}
                {step === 1 && "Note 3: Owners'/Partners' Capital Account movement and Note 4: Reserves."}
                {step === 2 && "Notes 5–10: Borrowings, Deferred Tax, Other Liabilities, Provisions, Payables."}
                {step === 3 && "Notes 11–18a: Fixed Assets, Investments, Loans, Inventories, Receivables, Cash."}
                {step === 4 && "Notes 19–25: Revenue, COGS, Employee Benefits, Finance Costs, Depreciation, Other Expenses, Tax."}
                {step === 5 && "Review Balance Sheet and P&L. Print with or without letterhead."}
              </p>
            </div>

            {/* Step content */}
            {step === 0 && <Step0Setup data={data} update={update} fyLabels={fyLabels} />}
            {step === 1 && <Step1OwnersCapital data={data} update={update} fyLabels={fyLabels} />}
            {step === 2 && <Step2Liabilities data={data} update={update} fyLabels={fyLabels} />}
            {step === 3 && <Step3Assets data={data} update={update} fyLabels={fyLabels} />}
            {step === 4 && <Step4PL data={data} update={update} fyLabels={fyLabels} />}
            {step === 5 && <Preview data={data} fyLabels={fyLabels} onPrint={handlePrint} />}

            {/* Navigation */}
            <div style={{ marginTop: 28, display: "flex", justifyContent: "space-between", gap: 12 }}>
              <button
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                style={{ background: step === 0 ? "#f1f5f9" : "#fff", color: step === 0 ? "#94a3b8" : "#374151", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: step === 0 ? "not-allowed" : "pointer" }}
              >
                ← Previous
              </button>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button onClick={save} disabled={saving} style={{ background: "#f0fdf4", color: "#059669", border: "1px solid #86efac", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {saving ? "Saving…" : "💾 Save Progress"}
                </button>
                {step < STEPS.length - 1 && (
                  <button
                    onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
                    style={{ background: "linear-gradient(135deg,#0ea5e9,#0369a1)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}

export default function NCEFinancialsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui", color: "#64748b" }}>Loading…</div>}>
      <NCEFinancialsInner />
    </Suspense>
  );
}
