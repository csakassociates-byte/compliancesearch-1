"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ITRData, INITIAL_ITR_DATA, PrefillData } from "@/lib/itr/types";
import Step0Prefill from "./components/Step0Prefill";
import Step1Personal from "./components/Step1Personal";
import Step2Income from "./components/Step2Income";
import Step3Deductions from "./components/Step3Deductions";
import Step4Tax from "./components/Step4Tax";
import Step5Preview from "./components/Step5Preview";

const STEPS = [
  { label: "Prefill / Setup", icon: "📥" },
  { label: "Personal Info", icon: "👤" },
  { label: "Income", icon: "💼" },
  { label: "Deductions", icon: "🧾" },
  { label: "Tax Computation", icon: "🧮" },
  { label: "Preview & Export", icon: "📤" },
];

function ITRTool() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const loadId = searchParams.get("load");

  const [step, setStep] = useState(0);
  const [data, setData] = useState<ITRData>({ ...INITIAL_ITR_DATA });
  const [savedId, setSavedId] = useState<string | null>(loadId);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const update = useCallback((patch: Partial<ITRData>) => {
    setData(prev => ({ ...prev, ...patch }));
  }, []);

  // Load existing doc
  useEffect(() => {
    if (!loadId) return;
    fetch(`/api/itr?id=${loadId}`)
      .then(r => r.json())
      .then(res => {
        if (res.doc?.formDataJson) {
          const loaded = JSON.parse(res.doc.formDataJson) as ITRData;
          setData(loaded);
          setSavedId(loadId);
        }
      })
      .catch(() => {});
  }, [loadId]);

  // Handle prefill loaded
  function onPrefillLoaded(prefill: PrefillData) {
    setData(prev => ({
      ...prev,
      hasPrefill: true,
      pan: prefill.pan,
      firstName: prefill.firstName,
      middleName: prefill.middleName,
      lastName: prefill.lastName,
      fatherName: prefill.fatherName,
      dob: prefill.dob,
      aadhaar: prefill.aadhaar,
      mobile: prefill.mobile,
      email: prefill.email,
      address: prefill.address,
      city: prefill.city,
      state: prefill.state,
      pinCode: prefill.pinCode,
      residentialStatus: prefill.residentialStatus,
      taxRegime: prefill.taxRegime,
      tdsCredits: prefill.tdsCredits,
      bankAccounts: prefill.bankAccounts,
      carryForwardLosses: prefill.carryForwardLosses,
      otherIncome: {
        ...prev.otherIncome,
        dividendIncome: String(prefill.dividendIncome || ""),
        savingsInterest: String(prefill.savingsInterest || ""),
      },
      deductions: {
        ...prev.deductions,
        sec80TTA: String(prefill.sec80TTA || ""),
      },
      businessIncome: {
        ...prev.businessIncome,
        natureCode: prefill.businessNatureCode || prev.businessIncome.natureCode,
        tradeName: prefill.businessTradeName || prev.businessIncome.tradeName,
        wdvOpeningPlantMachinery: String(prefill.wdvPlantMachinery40 || ""),
      },
      prefillRawJson: prefill.rawJson,
    }));
  }

  async function save() {
    setSaving(true);
    try {
      const assesseeName = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(" ") || data.pan;
      const body = {
        id: savedId ?? undefined,
        pan: data.pan,
        assesseeName,
        assessmentYear: data.assessmentYear,
        title: `ITR ${data.itrForm} – ${assesseeName} – AY ${data.assessmentYear}`,
        formDataJson: JSON.stringify(data),
      };
      const res = await fetch("/api/itr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json() as { id: string };
      if (json.id) {
        setSavedId(json.id);
        setLastSaved(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
        if (!loadId) router.replace(`/tools/itr?load=${json.id}`);
      }
    } finally {
      setSaving(false);
    }
  }

  // Auto-save every 30s
  useEffect(() => {
    if (!data.pan) return;
    const t = setInterval(() => { save(); }, 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const sidebar: React.CSSProperties = {
    width: 220, minHeight: "100vh", background: "#0f172a", flexShrink: 0,
    position: "sticky", top: 0, display: "flex", flexDirection: "column",
    padding: "24px 0",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Sidebar */}
      <div style={sidebar}>
        <div style={{ padding: "0 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>ITR Filing</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>Income Tax Return</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>AY {data.assessmentYear} · {data.itrForm}</div>
        </div>
        <div style={{ flex: 1, padding: "12px 0" }}>
          {STEPS.map((s, i) => (
            <button key={i} onClick={() => setStep(i)} style={{
              width: "100%", textAlign: "left", padding: "11px 20px",
              border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
              background: i === step ? "rgba(59,130,246,0.15)" : "transparent",
              borderLeft: `3px solid ${i === step ? "#3b82f6" : "transparent"}`,
              transition: "all 0.15s",
            } as React.CSSProperties}>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: i === step ? 800 : 500, color: i === step ? "#93c5fd" : "rgba(255,255,255,0.6)" }}>
                  {i + 1}. {s.label}
                </div>
              </div>
            </button>
          ))}
        </div>
        {data.pan && (
          <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{data.pan}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {[data.firstName, data.lastName].filter(Boolean).join(" ")}
            </div>
            {lastSaved && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Saved at {lastSaved}</div>}
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: "32px 40px", maxWidth: 1100 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: 0 }}>{STEPS[step].label}</h1>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Step {step + 1} of {STEPS.length}</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={save} disabled={saving} style={{
              background: saving ? "#94a3b8" : "#0f172a", color: "#fff", border: "none", borderRadius: 10,
              padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
            }}>
              {saving ? "Saving…" : "Save Progress"}
            </button>
          </div>
        </div>

        {/* Step content */}
        {step === 0 && <Step0Prefill data={data} update={update} onPrefillLoaded={onPrefillLoaded} />}
        {step === 1 && <Step1Personal data={data} update={update} />}
        {step === 2 && <Step2Income data={data} update={update} />}
        {step === 3 && <Step3Deductions data={data} update={update} />}
        {step === 4 && <Step4Tax data={data} update={update} />}
        {step === 5 && <Step5Preview data={data} savedId={savedId} />}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, paddingTop: 24, borderTop: "1px solid #e2e8f0" }}>
          <button
            disabled={step === 0}
            onClick={() => setStep(s => s - 1)}
            style={{ background: step === 0 ? "#f1f5f9" : "#fff", color: step === 0 ? "#94a3b8" : "#374151", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: step === 0 ? "not-allowed" : "pointer" }}
          >
            ← Previous
          </button>
          <button
            disabled={step === STEPS.length - 1}
            onClick={() => { save(); setStep(s => s + 1); }}
            style={{ background: step === STEPS.length - 1 ? "#f1f5f9" : "#1d4ed8", color: step === STEPS.length - 1 ? "#94a3b8" : "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: step === STEPS.length - 1 ? "not-allowed" : "pointer" }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ITRPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontSize: 16, color: "#64748b" }}>Loading ITR tool…</div>}>
      <ITRTool />
    </Suspense>
  );
}
