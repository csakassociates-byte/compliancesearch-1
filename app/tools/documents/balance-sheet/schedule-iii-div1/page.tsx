"use client";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  BalanceSheetData,
  INITIAL_BALANCE_SHEET_DATA,
  n,
} from "@/lib/balance-sheet/types";

// Step components (loaded lazily via conditional render)
import Step0Setup from "./components/Step0Setup";
import Step1Liabilities from "./components/Step1Liabilities";
import Step2Assets from "./components/Step2Assets";
import Step3PL from "./components/Step3PL";
import Step4Disclosures from "./components/Step4Disclosures";
import BSPreview from "./components/BSPreview";

// ── Steps ──────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 0, label: "Setup",       short: "Setup",      icon: "🏢" },
  { id: 1, label: "Liabilities", short: "Liabilities", icon: "📋" },
  { id: 2, label: "Assets",      short: "Assets",      icon: "🏗️" },
  { id: 3, label: "P&L Notes",   short: "P&L",         icon: "📈" },
  { id: 4, label: "Disclosures", short: "Disclosures", icon: "📝" },
  { id: 5, label: "Preview",     short: "Preview",     icon: "👁️" },
];

// ── Compute BS balance check ───────────────────────────────────────────────────

function computeBalance(d: BalanceSheetData): { totalLiabilities: number; totalAssets: number; diff: number } {
  // Liabilities side
  const paidUpCapital = d.note1ShareCapital.classes.reduce((s, c) => s + n(c.paidUpAmount), 0);
  const reserves = n(d.note2ReservesSurplus.capitalReserve) + n(d.note2ReservesSurplus.securitiesPremium) +
    n(d.note2ReservesSurplus.generalReserveClose) + n(d.note2ReservesSurplus.surplusClosingBalance) +
    n(d.note2ReservesSurplus.otherReserves);
  const ltBorrowings = d.note3LTBorrowings.items.reduce((s, i) => s + n(i.amount), 0);
  const deferredTax = n(d.note4DeferredTax.deferredTaxLiability) - n(d.note4DeferredTax.deferredTaxAsset);
  const ltProvisions = n(d.note5LTProvisions.provisionForGratuity) + n(d.note5LTProvisions.provisionForLeaveEncashment) + n(d.note5LTProvisions.otherProvisions);
  const stBorrowings = d.note6STBorrowings.items.reduce((s, i) => s + n(i.amount), 0);
  const tradePayables = n(d.note7TradePayables.msmeAmount) + n(d.note7TradePayables.othersAmount);
  const otherCL = n(d.note8OtherCurrentLiabilities.currentMaturitiesLTBorrowings) + n(d.note8OtherCurrentLiabilities.interestAccrued) +
    n(d.note8OtherCurrentLiabilities.advancesFromCustomers) + n(d.note8OtherCurrentLiabilities.statutoryDues) + n(d.note8OtherCurrentLiabilities.otherPayables);
  const stProvisions = n(d.note9STProvisions.provisionForTax) + n(d.note9STProvisions.proposedDividend) + n(d.note9STProvisions.otherProvisions);
  const totalLiabilities = paidUpCapital + reserves + ltBorrowings + (deferredTax > 0 ? deferredTax : 0) + ltProvisions + stBorrowings + tradePayables + otherCL + stProvisions;

  // Assets side
  const tangibleNB = d.note10FixedAssets.tangibleAssets.reduce((s, r) => s + (n(r.gbClosingBalance) - n(r.depClosingBalance)), 0);
  const intangibleNB = d.note10FixedAssets.intangibleAssets.reduce((s, r) => s + (n(r.gbClosingBalance) - n(r.depClosingBalance)), 0);
  const ncInvestments = d.note11NonCurrentInvestments.quotedItems.reduce((s, i) => s + n(i.amount), 0) + d.note11NonCurrentInvestments.unquotedItems.reduce((s, i) => s + n(i.amount), 0) - n(d.note11NonCurrentInvestments.provisionForDiminution);
  const ltLoans = n(d.note12LTLoansAdvances.securityDeposits) + n(d.note12LTLoansAdvances.capitalAdvances) + n(d.note12LTLoansAdvances.otherLoansAdvances) + n(d.note12LTLoansAdvances.loansToRelatedParties);
  const otherNCA = n(d.note13OtherNonCurrentAssets.longTermTradeReceivables) + n(d.note13OtherNonCurrentAssets.otherNonCurrentAssets);
  const currentInv = n(d.note14CurrentInvestments.mutualFunds) + n(d.note14CurrentInvestments.fixedDepositsMaturing12m) + n(d.note14CurrentInvestments.otherCurrentInvestments);
  const inventories = n(d.note15Inventories.rawMaterials) + n(d.note15Inventories.workInProgress) + n(d.note15Inventories.finishedGoods) + n(d.note15Inventories.stockInTrade) + n(d.note15Inventories.storesSpares);
  const tradeRec = n(d.note16TradeReceivables.outstandingMore6mSecured) + n(d.note16TradeReceivables.outstandingMore6mUnsecured) + n(d.note16TradeReceivables.outstandingLess6mSecured) + n(d.note16TradeReceivables.outstandingLess6mUnsecured) - n(d.note16TradeReceivables.provisionForDoubtful);
  const cash = n(d.note17CashEquivalents.cashOnHand) + n(d.note17CashEquivalents.balancesWithBanks) + n(d.note17CashEquivalents.fixedDepositsWithin3m) + n(d.note17CashEquivalents.chequesDraftsOnHand);
  const stLoans = n(d.note18STLoansAdvances.prepaidExpenses) + n(d.note18STLoansAdvances.advancesToSuppliers) + n(d.note18STLoansAdvances.balanceWithGovernment) + n(d.note18STLoansAdvances.otherAdvances);
  const otherCA = n(d.note19OtherCurrentAssets.interestAccruedOnDeposits) + n(d.note19OtherCurrentAssets.otherCurrentAssets);
  const totalAssets = tangibleNB + intangibleNB + n(d.note10FixedAssets.cwip) + n(d.note10FixedAssets.goodwill) +
    ncInvestments + ltLoans + otherNCA + currentInv + inventories + tradeRec + cash + stLoans + otherCA;

  return { totalLiabilities, totalAssets, diff: Math.abs(totalAssets - totalLiabilities) };
}

// ── Main Component ────────────────────────────────────────────────────────────

function ScheduleIIIDivIInner() {
  const searchParams = useSearchParams();
  const loadId = searchParams.get("load");

  const [step, setStep] = useState(0);
  const [data, setData] = useState<BalanceSheetData>(INITIAL_BALANCE_SHEET_DATA);
  const [docId, setDocId] = useState<string | null>(loadId);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState("");
  const [loading, setLoading] = useState(!!loadId);

  // Auto-save timer ref
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoggedIn = useRef(false);

  // Balance check
  const balance = computeBalance(data);
  const isBalanced = balance.diff < 1; // allow ₹1 rounding

  // ── Load existing doc ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!loadId) return;
    setLoading(true);
    fetch(`/api/balance-sheet?id=${loadId}`)
      .then(r => r.json())
      .then((j: { doc?: { formDataJson: string } }) => {
        if (j.doc?.formDataJson) {
          const parsed = JSON.parse(j.doc.formDataJson) as BalanceSheetData;
          setData({ ...INITIAL_BALANCE_SHEET_DATA, ...parsed });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loadId]);

  // ── Check login status ────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then((s: { user?: { id: string } }) => {
      isLoggedIn.current = !!s?.user?.id;
    }).catch(() => {});
  }, []);

  // ── Update field helper ────────────────────────────────────────────────────
  const update = useCallback((patch: Partial<BalanceSheetData>) => {
    setData(prev => ({ ...prev, ...patch }));
  }, []);

  // ── Deep update for nested notes ──────────────────────────────────────────
  const updateNote = useCallback(<K extends keyof BalanceSheetData>(key: K, patch: Partial<BalanceSheetData[K]>) => {
    setData(prev => ({ ...prev, [key]: { ...(prev[key] as object), ...(patch as object) } }));
  }, []);

  // ── Auto-save (every 30s after first change) ───────────────────────────────
  useEffect(() => {
    if (!isLoggedIn.current) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (data.companyName) void saveDoc(false);
    }, 30_000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // ── Save function ──────────────────────────────────────────────────────────
  async function saveDoc(showFeedback = true) {
    if (!data.companyName) {
      setSaveError("Enter company name first.");
      return;
    }
    if (showFeedback) setSaving(true);
    setSaveError("");
    try {
      const fyLabel = data.financialYear || "2025-26";
      const title = `Balance Sheet — ${data.companyName} — FY ${fyLabel}`;
      const body = {
        id: docId || undefined,
        companyName: data.companyName,
        cin: data.cin || undefined,
        financialYear: data.financialYear,
        title,
        formDataJson: JSON.stringify(data),
      };
      const res = await fetch("/api/balance-sheet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json() as { id?: string; error?: string };
      if (json.id) {
        setDocId(json.id);
        setSavedAt(new Date());
        if (!loadId && json.id) {
          window.history.replaceState({}, "", `?load=${json.id}`);
        }
      } else {
        setSaveError(json.error || "Save failed");
      }
    } catch {
      setSaveError("Network error");
    } finally {
      if (showFeedback) setSaving(false);
    }
  }

  // ── Render loading ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
          <div style={{ textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div style={{ fontWeight: 700 }}>Loading balance sheet...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>

        {/* ── Top bar ── */}
        <div style={{ background: "linear-gradient(135deg,#0f172a,#064e3b)", padding: "14px 20px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Schedule III · Division I · Non-Ind AS
              </div>
              <div style={{ color: "#fff", fontWeight: 900, fontSize: 16, marginTop: 2 }}>
                {data.companyName || "Prepare Balance Sheet"}
                {data.financialYear && <span style={{ fontWeight: 400, fontSize: 13, color: "rgba(255,255,255,0.6)", marginLeft: 8 }}>FY {data.financialYear}</span>}
              </div>
            </div>

            {/* Balance indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              {balance.totalAssets > 0 && (
                <div style={{
                  background: isBalanced ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)",
                  border: `1px solid ${isBalanced ? "rgba(74,222,128,0.4)" : "rgba(248,113,113,0.4)"}`,
                  borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700,
                  color: isBalanced ? "#4ade80" : "#f87171",
                }}>
                  {isBalanced ? "✅ BS Balanced" : `⚠️ Diff: ₹${balance.diff.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
                </div>
              )}
              <button
                onClick={() => void saveDoc(true)}
                disabled={saving}
                style={{ background: saving ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 13, padding: "8px 18px", cursor: saving ? "default" : "pointer" }}
              >
                {saving ? "Saving..." : "💾 Save"}
              </button>
            </div>
          </div>
          {saveError && <div style={{ maxWidth: 1200, margin: "4px auto 0", fontSize: 12, color: "#fca5a5" }}>{saveError}</div>}
          {savedAt && !saveError && <div style={{ maxWidth: 1200, margin: "4px auto 0", fontSize: 11, color: "rgba(74,222,128,0.8)" }}>Saved at {savedAt.toLocaleTimeString()}</div>}
        </div>

        {/* ── Step tabs ── */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", overflowX: "auto" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", padding: "0 12px" }}>
            {STEPS.map((s) => {
              const active = step === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setStep(s.id)}
                  style={{
                    padding: "14px 18px", fontSize: 13, fontWeight: active ? 800 : 600,
                    color: active ? "#059669" : "#64748b",
                    borderBottom: active ? "2px solid #059669" : "2px solid transparent",
                    background: "none", border: "none", borderRadius: 0,
                    cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
                    transition: "color 0.15s",
                  }}
                >
                  <span>{s.icon}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{s.short}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Step content ── */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px 60px" }}>

          {step === 0 && (
            <Step0Setup data={data} update={update} />
          )}

          {step === 1 && (
            <Step1Liabilities data={data} update={update} updateNote={updateNote} />
          )}

          {step === 2 && (
            <Step2Assets data={data} update={update} updateNote={updateNote} />
          )}

          {step === 3 && (
            <Step3PL data={data} update={update} updateNote={updateNote} />
          )}

          {step === 4 && (
            <Step4Disclosures data={data} update={update} updateNote={updateNote} />
          )}

          {step === 5 && (
            <BSPreview data={data} />
          )}

        </div>

        {/* ── Prev / Next nav ── */}
        {step < 5 && (
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e2e8f0", padding: "12px 20px", zIndex: 50 }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                style={{ background: step === 0 ? "#f1f5f9" : "#0f172a", color: step === 0 ? "#94a3b8" : "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 700, fontSize: 13, cursor: step === 0 ? "default" : "pointer" }}
              >
                ← Previous
              </button>

              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
                Step {step + 1} of {STEPS.length}
              </div>

              <button
                onClick={() => setStep(s => Math.min(5, s + 1))}
                style={{ background: "linear-gradient(135deg,#059669,#047857)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
              >
                Next →
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

export default function ScheduleIIIDivIPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading...</div>}>
      <ScheduleIIIDivIInner />
    </Suspense>
  );
}
