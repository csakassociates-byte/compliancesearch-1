"use client";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  BalanceSheetData,
  INITIAL_BALANCE_SHEET_DATA,
  n,
} from "@/lib/balance-sheet/types";

import Step0Setup from "./components/Step0Setup";
import Step1Liabilities from "./components/Step1Liabilities";
import Step2Assets from "./components/Step2Assets";
import Step3PL from "./components/Step3PL";
import Step4Disclosures from "./components/Step4Disclosures";
import BSPreview from "./components/BSPreview";

// ── Steps ──────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 0, label: "Setup",       icon: "🏢" },
  { id: 1, label: "Liabilities", icon: "📋" },
  { id: 2, label: "Assets",      icon: "🏗️" },
  { id: 3, label: "P&L Notes",   icon: "📈" },
  { id: 4, label: "Disclosures", icon: "📝" },
  { id: 5, label: "Preview",     icon: "👁️" },
];

// ── Balance check ──────────────────────────────────────────────────────────────

function computeBalance(d: BalanceSheetData): { totalLiabilities: number; totalAssets: number; diff: number } {
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

// ── Main Component ─────────────────────────────────────────────────────────────

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoggedIn = useRef(false);

  const balance = computeBalance(data);
  const isBalanced = balance.diff < 1;

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

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then((s: { user?: { id: string } }) => {
      isLoggedIn.current = !!s?.user?.id;
    }).catch(() => {});
  }, []);

  const update = useCallback((patch: Partial<BalanceSheetData>) => {
    setData(prev => ({ ...prev, ...patch }));
  }, []);

  const updateNote = useCallback(<K extends keyof BalanceSheetData>(key: K, patch: Partial<BalanceSheetData[K]>) => {
    setData(prev => ({ ...prev, [key]: { ...(prev[key] as object), ...(patch as object) } }));
  }, []);

  useEffect(() => {
    if (!isLoggedIn.current) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (data.companyName) void saveDoc(false);
    }, 30_000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  async function saveDoc(showFeedback = true) {
    if (!data.companyName) { setSaveError("Enter company name first."); return; }
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
        if (!loadId && json.id) window.history.replaceState({}, "", `?load=${json.id}`);
      } else {
        setSaveError(json.error || "Save failed");
      }
    } catch {
      setSaveError("Network error");
    } finally {
      if (showFeedback) setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div style={{ fontWeight: 700 }}>Loading balance sheet...</div>
          </div>
        </div>
      </>
    );
  }

  const currentStep = STEPS[step];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <Navbar />

      {/* ── Mobile sidebar overlay ── */}
      {mobileSidebarOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Left Sidebar ── */}
        <aside
          style={{
            background: "#162032",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            overflowY: "auto",
            overflowX: "hidden",
            transition: "width 0.2s ease",
            width: sidebarCollapsed ? 64 : 220,
            zIndex: 30,
          }}
          className="hidden md:flex"
        >
          {/* Tool header */}
          <div style={{
            padding: sidebarCollapsed ? "16px 0" : "16px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            justifyContent: sidebarCollapsed ? "center" : "flex-start",
          }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>📑</span>
            {!sidebarCollapsed && (
              <div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>Balance Sheet</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 600, marginTop: 2 }}>Schedule III · Div I</div>
              </div>
            )}
          </div>

          {/* Step nav */}
          <div style={{ flex: 1, padding: "10px 0" }}>
            {STEPS.map((s) => {
              const isCurrent = step === s.id;
              const isDone = step > s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setStep(s.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: sidebarCollapsed ? "10px 0" : "10px 14px",
                    justifyContent: sidebarCollapsed ? "center" : "flex-start",
                    background: isCurrent ? "rgba(16,185,129,0.12)" : "transparent",
                    border: "none",
                    borderLeft: isCurrent ? "2px solid #10b981" : "2px solid transparent",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if (!isCurrent) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={e => { if (!isCurrent) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  {/* Step circle */}
                  <div style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: isDone ? 13 : 11,
                    fontWeight: 800,
                    background: isDone ? "#10b981" : isCurrent ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.1)",
                    color: isDone ? "#fff" : isCurrent ? "#10b981" : "rgba(255,255,255,0.45)",
                    border: isCurrent ? "1.5px solid #10b981" : "1.5px solid transparent",
                  }}>
                    {isDone ? "✓" : s.id + 1}
                  </div>

                  {/* Label */}
                  {!sidebarCollapsed && (
                    <span style={{
                      fontSize: 13,
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? "#fff" : isDone ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.45)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {s.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Company badge + Save */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: sidebarCollapsed ? "12px 0" : "12px 14px" }}>
            {!sidebarCollapsed && data.companyName && (
              <div style={{
                background: "rgba(255,255,255,0.06)",
                borderRadius: 8,
                padding: "8px 10px",
                marginBottom: 10,
              }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, marginBottom: 2 }}>Company</div>
                <div style={{ fontSize: 12, color: "#fff", fontWeight: 700, lineHeight: 1.3, wordBreak: "break-word" }}>
                  {data.companyName}
                </div>
                {data.financialYear && (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>FY {data.financialYear}</div>
                )}
              </div>
            )}

            <button
              onClick={() => void saveDoc(true)}
              disabled={saving}
              style={{
                width: sidebarCollapsed ? 40 : "100%",
                height: sidebarCollapsed ? 40 : "auto",
                margin: sidebarCollapsed ? "0 auto" : 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: sidebarCollapsed ? 0 : "9px 0",
                background: saving ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.22)",
                border: "1px solid rgba(16,185,129,0.4)",
                borderRadius: 8,
                color: "#10b981",
                fontWeight: 700,
                fontSize: 13,
                cursor: saving ? "default" : "pointer",
              }}
            >
              <span>{saving ? "⏳" : "💾"}</span>
              {!sidebarCollapsed && <span>{saving ? "Saving..." : "Save"}</span>}
            </button>

            {!sidebarCollapsed && savedAt && !saveError && (
              <div style={{ fontSize: 10, color: "rgba(16,185,129,0.7)", textAlign: "center", marginTop: 5 }}>
                Saved {savedAt.toLocaleTimeString()}
              </div>
            )}
            {!sidebarCollapsed && saveError && (
              <div style={{ fontSize: 11, color: "#f87171", textAlign: "center", marginTop: 5 }}>{saveError}</div>
            )}
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(c => !c)}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "none",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.4)",
              padding: "10px 0",
              cursor: "pointer",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? "→" : "←"}
          </button>
        </aside>

        {/* ── Mobile sidebar (slide-in) ── */}
        <aside
          className="md:hidden"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            width: 240,
            background: "#162032",
            display: "flex",
            flexDirection: "column",
            zIndex: 45,
            transform: mobileSidebarOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.25s ease",
            overflowY: "auto",
          }}
        >
          <div style={{ padding: "16px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>📑</span>
              <div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>Balance Sheet</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>Schedule III · Div I</div>
              </div>
            </div>
            <button onClick={() => setMobileSidebarOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 18, cursor: "pointer" }}>✕</button>
          </div>

          <div style={{ flex: 1, padding: "10px 0" }}>
            {STEPS.map((s) => {
              const isCurrent = step === s.id;
              const isDone = step > s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => { setStep(s.id); setMobileSidebarOpen(false); }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    background: isCurrent ? "rgba(16,185,129,0.12)" : "transparent",
                    border: "none",
                    borderLeft: isCurrent ? "2px solid #10b981" : "2px solid transparent",
                    cursor: "pointer",
                  }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: isDone ? 13 : 11, fontWeight: 800,
                    background: isDone ? "#10b981" : isCurrent ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.1)",
                    color: isDone ? "#fff" : isCurrent ? "#10b981" : "rgba(255,255,255,0.45)",
                    border: isCurrent ? "1.5px solid #10b981" : "1.5px solid transparent",
                  }}>
                    {isDone ? "✓" : s.id + 1}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? "#fff" : "rgba(255,255,255,0.55)" }}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "12px 14px" }}>
            <button
              onClick={() => { void saveDoc(true); setMobileSidebarOpen(false); }}
              disabled={saving}
              style={{ width: "100%", padding: "9px 0", background: "rgba(16,185,129,0.22)", border: "1px solid rgba(16,185,129,0.4)", borderRadius: 8, color: "#10b981", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >
              {saving ? "⏳ Saving..." : "💾 Save"}
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

          {/* Sticky step header */}
          <div style={{
            background: "#fff",
            borderBottom: "1px solid #e2e8f0",
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexShrink: 0,
            minHeight: 52,
          }}>
            {/* Mobile hamburger */}
            <button
              className="md:hidden"
              onClick={() => setMobileSidebarOpen(true)}
              style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b", padding: "0 4px" }}
            >
              ☰
            </button>

            {/* Step title */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>{currentStep.icon}</span>
              <span style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>{currentStep.label}</span>
              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Step {step + 1} of {STEPS.length}</span>
            </div>

            {/* Balance indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
              {balance.totalAssets > 0 && (
                <div style={{
                  background: isBalanced ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${isBalanced ? "#86efac" : "#fca5a5"}`,
                  borderRadius: 7,
                  padding: "4px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: isBalanced ? "#16a34a" : "#dc2626",
                }}>
                  {isBalanced ? "✅ Balanced" : `⚠️ Diff ₹${balance.diff.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
                </div>
              )}
            </div>
          </div>

          {/* Scrollable step content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>

            {step === 0 && <Step0Setup data={data} update={update} />}
            {step === 1 && <Step1Liabilities data={data} update={update} updateNote={updateNote} />}
            {step === 2 && <Step2Assets data={data} update={update} updateNote={updateNote} />}
            {step === 3 && <Step3PL data={data} update={update} updateNote={updateNote} />}
            {step === 4 && <Step4Disclosures data={data} update={update} updateNote={updateNote} />}
            {step === 5 && <BSPreview data={data} />}

            {/* Prev / Next */}
            <div style={{
              marginTop: 32,
              paddingTop: 20,
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <button
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                style={{
                  background: step === 0 ? "#f1f5f9" : "#0f172a",
                  color: step === 0 ? "#94a3b8" : "#fff",
                  border: "none", borderRadius: 10,
                  padding: "10px 24px", fontWeight: 700, fontSize: 13,
                  cursor: step === 0 ? "default" : "pointer",
                }}
              >
                ← Previous
              </button>

              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
                {step + 1} / {STEPS.length}
              </span>

              {step < STEPS.length - 1 ? (
                <button
                  onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
                  style={{
                    background: "linear-gradient(135deg,#059669,#047857)",
                    color: "#fff", border: "none", borderRadius: 10,
                    padding: "10px 24px", fontWeight: 700, fontSize: 13, cursor: "pointer",
                  }}
                >
                  Next →
                </button>
              ) : (
                <div style={{ width: 100 }} />
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScheduleIIIDivIPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading...</div>}>
      <ScheduleIIIDivIInner />
    </Suspense>
  );
}
