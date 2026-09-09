"use client";
import { useState } from "react";
import type { BalanceSheetData, PromoterShareholding, FinancialRatios } from "@/lib/balance-sheet/types";
import { n } from "@/lib/balance-sheet/types";

interface Props {
  data: BalanceSheetData;
  update: (patch: Partial<BalanceSheetData>) => void;
  updateNote: <K extends keyof BalanceSheetData>(key: K, patch: Partial<BalanceSheetData[K]>) => void;
}

const S = {
  num:   { width: "100%", border: "1px solid #d1d5db", borderRadius: 7, padding: "7px 10px", fontSize: 13, color: "#0f172a", background: "#fff", boxSizing: "border-box", textAlign: "right" } as React.CSSProperties,
  input: { width: "100%", border: "1px solid #d1d5db", borderRadius: 7, padding: "8px 10px", fontSize: 13, color: "#0f172a", background: "#fff", boxSizing: "border-box" } as React.CSSProperties,
  ta:    { width: "100%", border: "1px solid #d1d5db", borderRadius: 7, padding: "8px 10px", fontSize: 13, color: "#0f172a", background: "#fff", boxSizing: "border-box", minHeight: 80, resize: "vertical" } as React.CSSProperties,
  label: { display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: "0.04em" },
  card:  { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, marginBottom: 18, overflow: "hidden" } as React.CSSProperties,
  head:  { background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" } as React.CSSProperties,
  body:  { padding: "18px" } as React.CSSProperties,
  addBtn:{ background: "#f0fdf4", border: "1px dashed #86efac", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, color: "#059669", cursor: "pointer" } as React.CSSProperties,
  delBtn:{ background: "#fee2e2", border: "none", borderRadius: 6, padding: "4px 9px", fontSize: 11, fontWeight: 700, color: "#dc2626", cursor: "pointer" } as React.CSSProperties,
};

function Section({ title, icon, children, defaultOpen = true }: { title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={S.card}>
      <div style={S.head}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>{title}</span>
        </div>
        <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#94a3b8" }}>{open ? "▲" : "▼"}</button>
      </div>
      {open && <div style={S.body}>{children}</div>}
    </div>
  );
}

// ── Auto-compute ratios from filled data ───────────────────────────────────────

function computeAutoRatios(data: BalanceSheetData): Partial<FinancialRatios> {
  // Collect key figures
  const currentAssets =
    n(data.note14CurrentInvestments.mutualFunds) + n(data.note14CurrentInvestments.fixedDepositsMaturing12m) +
    n(data.note15Inventories.rawMaterials) + n(data.note15Inventories.workInProgress) + n(data.note15Inventories.finishedGoods) + n(data.note15Inventories.stockInTrade) +
    n(data.note16TradeReceivables.outstandingMore6mUnsecured) + n(data.note16TradeReceivables.outstandingLess6mUnsecured) +
    n(data.note17CashEquivalents.cashOnHand) + n(data.note17CashEquivalents.balancesWithBanks) +
    n(data.note18STLoansAdvances.prepaidExpenses) + n(data.note18STLoansAdvances.advancesToSuppliers) + n(data.note18STLoansAdvances.balanceWithGovernment);

  const currentLiabilities =
    n(data.note6STBorrowings.items.reduce((s, i) => s + n(i.amount), 0)) +
    n(data.note7TradePayables.msmeAmount) + n(data.note7TradePayables.othersAmount) +
    n(data.note8OtherCurrentLiabilities.currentMaturitiesLTBorrowings) + n(data.note8OtherCurrentLiabilities.interestAccrued) + n(data.note8OtherCurrentLiabilities.advancesFromCustomers) + n(data.note8OtherCurrentLiabilities.statutoryDues) + n(data.note8OtherCurrentLiabilities.otherPayables) +
    n(data.note9STProvisions.provisionForTax) + n(data.note9STProvisions.proposedDividend);

  const paidUpCapital = data.note1ShareCapital.classes.reduce((s, c) => s + n(c.paidUpAmount), 0);
  const reserves = n(data.note2ReservesSurplus.capitalReserve) + n(data.note2ReservesSurplus.securitiesPremium) +
    parseFloat((n(data.note2ReservesSurplus.generalReserveOpen) + n(data.note2ReservesSurplus.generalReserveAdditions)).toFixed(2)) +
    parseFloat((n(data.note2ReservesSurplus.surplusOpeningBalance) + n(data.note2ReservesSurplus.surplusNetProfit) - n(data.note2ReservesSurplus.surplusDividend)).toFixed(2));
  const equity = paidUpCapital + reserves;

  const ltBorrowings = data.note3LTBorrowings.items.reduce((s, i) => s + n(i.amount), 0);
  const stBorrowings = data.note6STBorrowings.items.reduce((s, i) => s + n(i.amount), 0);
  const totalDebt = ltBorrowings + stBorrowings + n(data.note8OtherCurrentLiabilities.currentMaturitiesLTBorrowings);

  const revenue = n(data.note20Revenue.saleOfProducts) + n(data.note20Revenue.saleOfServices) + n(data.note20Revenue.otherOperatingRevenue) - n(data.note20Revenue.lessExciseDuty);
  const tradePayables = n(data.note7TradePayables.msmeAmount) + n(data.note7TradePayables.othersAmount);
  const tradeReceivables = n(data.note16TradeReceivables.outstandingMore6mUnsecured) + n(data.note16TradeReceivables.outstandingLess6mUnsecured);
  const inventories = n(data.note15Inventories.rawMaterials) + n(data.note15Inventories.workInProgress) + n(data.note15Inventories.finishedGoods) + n(data.note15Inventories.stockInTrade);

  const depreciation = n(data.note27Depreciation.depreciation) + n(data.note27Depreciation.amortization);
  const finCosts = n(data.note26FinanceCosts.interestOnBorrowings) + n(data.note26FinanceCosts.bankCharges) + n(data.note26FinanceCosts.otherFinanceCosts);
  const netProfit = n(data.note2ReservesSurplus.surplusNetProfit);
  const ebit = netProfit + n(data.currentTax) + n(data.deferredTaxCharge) + finCosts;
  const capitalEmployed = equity + ltBorrowings;

  const fmt2 = (v: number) => isFinite(v) && !isNaN(v) ? v.toFixed(2) : "";

  return {
    currentRatio:              fmt2(currentLiabilities > 0 ? currentAssets / currentLiabilities : 0),
    debtEquityRatio:           fmt2(equity > 0 ? totalDebt / equity : 0),
    debtServiceCoverageRatio:  fmt2(finCosts > 0 ? ebit / finCosts : 0),
    returnOnEquity:            fmt2(equity > 0 ? (netProfit / equity) * 100 : 0),
    inventoryTurnoverRatio:    fmt2(inventories > 0 ? revenue / inventories : 0),
    tradeReceivablesTurnover:  fmt2(tradeReceivables > 0 ? revenue / tradeReceivables : 0),
    tradePayablesTurnover:     fmt2(tradePayables > 0 ? revenue / tradePayables : 0),
    netCapitalTurnoverRatio:   fmt2((currentAssets - currentLiabilities) > 0 ? revenue / (currentAssets - currentLiabilities) : 0),
    netProfitRatio:            fmt2(revenue > 0 ? (netProfit / revenue) * 100 : 0),
    returnOnCapitalEmployed:   fmt2(capitalEmployed > 0 ? (ebit / capitalEmployed) * 100 : 0),
  };
}

// ── 11 Financial Ratios ───────────────────────────────────────────────────────

const RATIO_DEFS = [
  { key: "currentRatio",             prevKey: "currentRatioPrev",             label: "Current Ratio",                       formula: "Current Assets / Current Liabilities",              unit: "x" },
  { key: "debtEquityRatio",          prevKey: "debtEquityRatioPrev",          label: "Debt-Equity Ratio",                   formula: "Total Debt / Shareholders' Equity",                  unit: "x" },
  { key: "debtServiceCoverageRatio", prevKey: "debtServiceCoverageRatioPrev", label: "Debt Service Coverage Ratio (DSCR)",  formula: "EBIT / (Interest + Principal repayment)",            unit: "x" },
  { key: "returnOnEquity",           prevKey: "returnOnEquityPrev",           label: "Return on Equity (ROE)",              formula: "Net Profit / Average Shareholders' Equity × 100",    unit: "%" },
  { key: "inventoryTurnoverRatio",   prevKey: "inventoryTurnoverRatioPrev",   label: "Inventory Turnover Ratio",            formula: "Revenue / Average Inventory",                        unit: "x" },
  { key: "tradeReceivablesTurnover", prevKey: "tradeReceivablesTurnoverPrev", label: "Trade Receivables Turnover Ratio",    formula: "Revenue / Average Trade Receivables",                unit: "x" },
  { key: "tradePayablesTurnover",    prevKey: "tradePayablesTurnoverPrev",    label: "Trade Payables Turnover Ratio",       formula: "Purchases / Average Trade Payables",                 unit: "x" },
  { key: "netCapitalTurnoverRatio",  prevKey: "netCapitalTurnoverRatioPrev",  label: "Net Capital Turnover Ratio",          formula: "Revenue / Working Capital",                          unit: "x" },
  { key: "netProfitRatio",           prevKey: "netProfitRatioPrev",           label: "Net Profit Ratio",                    formula: "Net Profit / Revenue × 100",                         unit: "%" },
  { key: "returnOnCapitalEmployed",  prevKey: "returnOnCapitalEmployedPrev",  label: "Return on Capital Employed (ROCE)",   formula: "EBIT / Capital Employed × 100",                      unit: "%" },
  { key: "returnOnInvestment",       prevKey: "returnOnInvestmentPrev",       label: "Return on Investment (ROI)",          formula: "Income from Investments / Cost of Investments × 100", unit: "%" },
] as const;

function RatiosSection({ data, update }: { data: BalanceSheetData; update: Props["update"] }) {
  const ratios = data.additionalDisclosures.ratios;
  const ad = data.additionalDisclosures;
  const autoRatios = computeAutoRatios(data);

  function updateRatio(patch: Partial<FinancialRatios>) {
    update({ additionalDisclosures: { ...ad, ratios: { ...ratios, ...patch } } });
  }

  function applyAutoRatios() {
    updateRatio(autoRatios as Partial<FinancialRatios>);
  }

  const hasAutoData = Object.values(autoRatios).some(v => v && v !== "0.00");

  return (
    <Section title="11 Financial Ratios (MCA 2021 Mandatory)" icon="📏">
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12, lineHeight: 1.6 }}>
        Mandatory per MCA GSR 207(E) — 24 March 2021. All 11 ratios must be disclosed with previous year comparison and explanation of significant changes (&gt;25%).
      </div>

      {hasAutoData && (
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>
            ✅ Auto-computed ratios available from your filled data
          </span>
          <button onClick={applyAutoRatios} style={{ background: "#059669", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Apply Auto-Computed Ratios
          </button>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              <th style={{ padding: "10px 12px", textAlign: "left", border: "1px solid #e2e8f0", fontWeight: 700, fontSize: 12 }}>Ratio</th>
              <th style={{ padding: "10px 12px", textAlign: "left", border: "1px solid #e2e8f0", fontWeight: 700, fontSize: 12, minWidth: 200 }}>Formula</th>
              <th style={{ padding: "10px 12px", textAlign: "right", border: "1px solid #e2e8f0", fontWeight: 700, fontSize: 12 }}>Current Yr</th>
              <th style={{ padding: "10px 12px", textAlign: "right", border: "1px solid #e2e8f0", fontWeight: 700, fontSize: 12 }}>Prev Yr</th>
              <th style={{ padding: "10px 12px", textAlign: "center", border: "1px solid #e2e8f0", fontWeight: 700, fontSize: 12 }}>Unit</th>
            </tr>
          </thead>
          <tbody>
            {RATIO_DEFS.map((r, idx) => {
              const curVal  = ratios[r.key];
              const prevVal = ratios[r.prevKey];
              const autoVal = autoRatios[r.key as keyof typeof autoRatios];
              const curNum  = parseFloat(curVal);
              const prevNum = parseFloat(prevVal);
              const changePct = (prevNum && curNum) ? Math.abs((curNum - prevNum) / prevNum * 100) : 0;
              const flagChange = changePct >= 25;
              return (
                <tr key={r.key} style={{ background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "8px 12px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{r.label}</div>
                    {flagChange && (
                      <div style={{ fontSize: 10, color: "#b45309", fontWeight: 600, marginTop: 2 }}>
                        ⚠️ {changePct.toFixed(0)}% change — explanation required
                      </div>
                    )}
                    {autoVal && (
                      <div style={{ fontSize: 10, color: "#059669", fontWeight: 600, marginTop: 2 }}>
                        Auto: {autoVal}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "8px 12px", border: "1px solid #e2e8f0", fontSize: 11, color: "#64748b" }}>{r.formula}</td>
                  <td style={{ padding: 4, border: "1px solid #e2e8f0" }}>
                    <input type="number" style={{ ...S.num, background: flagChange ? "#fffbeb" : "#fff" }} value={curVal}
                      onChange={e => updateRatio({ [r.key]: e.target.value } as Partial<FinancialRatios>)} placeholder="0.00" />
                  </td>
                  <td style={{ padding: 4, border: "1px solid #e2e8f0" }}>
                    <input type="number" style={S.num} value={prevVal}
                      onChange={e => updateRatio({ [r.prevKey]: e.target.value } as Partial<FinancialRatios>)} placeholder="0.00" />
                  </td>
                  <td style={{ padding: "8px 12px", border: "1px solid #e2e8f0", textAlign: "center", fontSize: 12, color: "#64748b" }}>{r.unit}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 14, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#92400e" }}>
        <strong>Note:</strong> Where any ratio has changed by more than 25% compared to previous year, the company must provide an explanation of the reasons for the change. Add this in the Notes to Accounts.
      </div>
    </Section>
  );
}

// ── Promoter Shareholding ─────────────────────────────────────────────────────

function PromoterSection({ data, update }: { data: BalanceSheetData; update: Props["update"] }) {
  const ad = data.additionalDisclosures;
  const list = ad.promoterShareholding;

  function addRow() {
    const row: PromoterShareholding = { promoterName: "", sharesBeginning: "", percentBeginning: "", sharesEnd: "", percentEnd: "", percentChange: "" };
    update({ additionalDisclosures: { ...ad, promoterShareholding: [...list, row] } });
  }
  function updateRow(idx: number, patch: Partial<PromoterShareholding>) {
    update({ additionalDisclosures: { ...ad, promoterShareholding: list.map((r, i) => i === idx ? { ...r, ...patch } : r) } });
  }
  function removeRow(idx: number) {
    update({ additionalDisclosures: { ...ad, promoterShareholding: list.filter((_, i) => i !== idx) } });
  }

  return (
    <Section title="Promoter Shareholding (MCA 2021 Mandatory)" icon="👥" defaultOpen={false}>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>
        Mandatory per MCA 2021 amendment — disclose the movement in promoters' shareholding during the year.
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 680 }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              <th style={{ padding: "8px 10px", textAlign: "left", border: "1px solid #e2e8f0", fontWeight: 700 }}>Promoter Name</th>
              <th style={{ padding: "8px 10px", border: "1px solid #e2e8f0", fontWeight: 700 }}>Shares (Beginning)</th>
              <th style={{ padding: "8px 10px", border: "1px solid #e2e8f0", fontWeight: 700 }}>% (Beginning)</th>
              <th style={{ padding: "8px 10px", border: "1px solid #e2e8f0", fontWeight: 700 }}>Shares (End)</th>
              <th style={{ padding: "8px 10px", border: "1px solid #e2e8f0", fontWeight: 700 }}>% (End)</th>
              <th style={{ padding: "8px 10px", border: "1px solid #e2e8f0", fontWeight: 700 }}>% Change</th>
              <th style={{ padding: "8px 10px", border: "1px solid #e2e8f0" }}></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 14, textAlign: "center", color: "#94a3b8", border: "1px solid #e2e8f0", fontSize: 13 }}>No promoters added yet</td></tr>
            )}
            {list.map((row, idx) => (
              <tr key={idx}>
                <td style={{ padding: 4, border: "1px solid #e2e8f0" }}>
                  <input style={S.input} value={row.promoterName} onChange={e => updateRow(idx, { promoterName: e.target.value })} placeholder="Promoter / Director Name" />
                </td>
                <td style={{ padding: 4, border: "1px solid #e2e8f0" }}><input type="number" style={S.num} value={row.sharesBeginning} onChange={e => updateRow(idx, { sharesBeginning: e.target.value })} /></td>
                <td style={{ padding: 4, border: "1px solid #e2e8f0" }}><input type="number" style={S.num} value={row.percentBeginning} onChange={e => updateRow(idx, { percentBeginning: e.target.value })} placeholder="%" /></td>
                <td style={{ padding: 4, border: "1px solid #e2e8f0" }}><input type="number" style={S.num} value={row.sharesEnd} onChange={e => updateRow(idx, { sharesEnd: e.target.value })} /></td>
                <td style={{ padding: 4, border: "1px solid #e2e8f0" }}><input type="number" style={S.num} value={row.percentEnd} onChange={e => updateRow(idx, { percentEnd: e.target.value })} placeholder="%" /></td>
                <td style={{ padding: 4, border: "1px solid #e2e8f0" }}><input type="number" style={S.num} value={row.percentChange} onChange={e => updateRow(idx, { percentChange: e.target.value })} placeholder="%" /></td>
                <td style={{ padding: 4, border: "1px solid #e2e8f0", textAlign: "center" }}><button style={S.delBtn} onClick={() => removeRow(idx)}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button style={{ ...S.addBtn, marginTop: 12 }} onClick={addRow}>+ Add Promoter</button>
    </Section>
  );
}

// ── Contingent Liabilities & Commitments ─────────────────────────────────────

function ContingentSection({ data, update }: { data: BalanceSheetData; update: Props["update"] }) {
  const ad = data.additionalDisclosures;
  return (
    <Section title="Contingent Liabilities & Capital Commitments" icon="⚠️" defaultOpen={false}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={S.label}>Contingent Liabilities</label>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>Claims not acknowledged as debts, guarantees, disputed tax matters, etc.</div>
          <textarea style={S.ta} value={ad.contingentLiabilities} onChange={e => update({ additionalDisclosures: { ...ad, contingentLiabilities: e.target.value } })}
            placeholder="e.g. Claim against the Company not acknowledged as debts: ₹X lakhs (bank guarantee issued on behalf of subsidiary: ₹Y lakhs)" />
        </div>
        <div>
          <label style={S.label}>Capital Commitments</label>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>Estimated amount of contracts remaining to be executed on capital account.</div>
          <textarea style={S.ta} value={ad.capitalCommitments} onChange={e => update({ additionalDisclosures: { ...ad, capitalCommitments: e.target.value } })}
            placeholder="e.g. Estimated amount of contracts remaining to be executed on capital account, net of advances: ₹X lakhs" />
        </div>
      </div>
    </Section>
  );
}

// ── Related Party Transactions ────────────────────────────────────────────────

function RPTSection({ data, update }: { data: BalanceSheetData; update: Props["update"] }) {
  const ad = data.additionalDisclosures;
  return (
    <Section title="Related Party Transactions (AS-18)" icon="🔗" defaultOpen={false}>
      <div>
        <label style={S.label}>Related Party Disclosure</label>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>List related parties, nature of relationship, and transactions during the year.</div>
        <textarea style={{ ...S.ta, minHeight: 120 }} value={ad.relatedPartyDisclosure}
          onChange={e => update({ additionalDisclosures: { ...ad, relatedPartyDisclosure: e.target.value } })}
          placeholder="Name of Related Party | Relationship | Nature of Transaction | Amount (₹)" />
      </div>
    </Section>
  );
}

// ── Other Statutory Disclosures (2021 Amendment) ──────────────────────────────

function OtherDisclosures({ data, update }: { data: BalanceSheetData; update: Props["update"] }) {
  const ad = data.additionalDisclosures;
  return (
    <Section title="Other Mandatory Disclosures (MCA 2021)" icon="📋" defaultOpen={false}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Security details */}
        <div>
          <label style={S.label}>Security Details for Borrowings</label>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>Details of security given for loans / borrowings (charge on assets).</div>
          <textarea style={S.ta} value={ad.securityDetails}
            onChange={e => update({ additionalDisclosures: { ...ad, securityDetails: e.target.value } })}
            placeholder="e.g. Term Loan from SBI secured by first charge on Plant & Machinery and hypothecation of current assets" />
        </div>

        {/* Wilful defaulter */}
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 14 }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" style={{ marginTop: 2 }} checked={ad.isWilfulDefaulter}
              onChange={e => update({ additionalDisclosures: { ...ad, isWilfulDefaulter: e.target.checked } })} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#dc2626" }}>Wilful Defaulter Declaration</div>
              <div style={{ fontSize: 12, color: "#9f1239", marginTop: 2 }}>
                Check if the Company or any of its promoters/directors have been declared as wilful defaulters by any bank or financial institution.
                (MCA 2021 — Schedule III mandatory disclosure)
              </div>
            </div>
          </label>
        </div>

        {/* Struck-off companies */}
        <div>
          <label style={S.label}>Transactions with Struck-off Companies</label>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>
            Disclose any transactions with companies struck off under Section 248 of Companies Act 2013 (MCA 2021 requirement).
          </div>
          <textarea style={S.ta} value={ad.transactionsWithStruckOff}
            onChange={e => update({ additionalDisclosures: { ...ad, transactionsWithStruckOff: e.target.value } })}
            placeholder="NIL — or describe the nature and amount of transactions" />
        </div>

        {/* Registration details */}
        <div>
          <label style={S.label}>Regulatory Registration Details (if applicable)</label>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>
            For NBFCs, Nidhi Companies — registration with RBI / MCA and relevant details.
          </div>
          <textarea style={S.ta} value={ad.registrationDetails || ""}
            onChange={e => update({ additionalDisclosures: { ...ad, registrationDetails: e.target.value } })}
            placeholder="e.g. The Company is registered as NBFC-MFI with RBI. Registration No: XXXXXXXXXX" />
        </div>

      </div>
    </Section>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export default function Step4Disclosures({ data, update, updateNote }: Props) {
  void updateNote; // used by parent, passed for consistency
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#c2410c", fontWeight: 600, marginBottom: 18 }}>
        📝 <strong>Additional Disclosures</strong> — Mandatory per Companies Act 2013 and MCA GSR 207(E) dated 24 March 2021.
        Fill all sections applicable to your company.
      </div>

      <RatiosSection data={data} update={update} />
      <PromoterSection data={data} update={update} />
      <ContingentSection data={data} update={update} />
      <RPTSection data={data} update={update} />
      <OtherDisclosures data={data} update={update} />
    </div>
  );
}
