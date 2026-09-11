"use client";
import { NCEFinancialsData, OwnerCapitalAccount, PPERow, BorrowingItem, TradePayableItem, TradeReceivableItem, SimpleLineItem } from "@/lib/nce-financials/types";

interface Props {
  data: NCEFinancialsData;
  fyLabels: { current: string; prev: string };
  onPrint: (withLetterhead: boolean) => void;
}

function n(v: string | undefined | null) { return parseFloat(v ?? "") || 0; }
function f(v: number) { return v === 0 ? "—" : v.toLocaleString("en-IN"); }
function fAbs(v: number) { return Math.abs(v) === 0 ? "—" : Math.abs(v).toLocaleString("en-IN"); }

function ownerClosing(o: OwnerCapitalAccount) {
  return n(o.openingCapital) + n(o.contributions) + n(o.profitShare) - n(o.remuneration) - n(o.interest) - n(o.withdrawals);
}

const ROW = ({ label, cur, prev, bold, indent }: { label: string; cur?: number; prev?: number; bold?: boolean; indent?: boolean }) => (
  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
    <td style={{ padding: "6px 12px", fontSize: 13, fontWeight: bold ? 700 : 400, color: "#374151", paddingLeft: indent ? 28 : 12 }}>{label}</td>
    <td style={{ padding: "6px 16px", textAlign: "right", fontSize: 13, fontWeight: bold ? 700 : 400, color: bold ? "#0f172a" : "#374151" }}>{cur !== undefined ? f(cur) : ""}</td>
    <td style={{ padding: "6px 16px", textAlign: "right", fontSize: 13, color: "#64748b" }}>{prev !== undefined ? f(prev) : ""}</td>
  </tr>
);

const SUB = ({ label }: { label: string }) => (
  <tr style={{ background: "#f8fafc" }}>
    <td colSpan={3} style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</td>
  </tr>
);

const HDR = ({ label, cur, prev }: { label: string; cur?: string; prev?: string }) => (
  <tr style={{ background: "#0f172a" }}>
    <td style={{ padding: "10px 12px", fontSize: 12, fontWeight: 700, color: "#fff" }}>{label}</td>
    <td style={{ padding: "10px 16px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>{cur || ""}</td>
    <td style={{ padding: "10px 16px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>{prev || ""}</td>
  </tr>
);

export default function Preview({ data, fyLabels, onPrint }: Props) {
  // ── Computed totals ──
  const totalOwnersCapital = data.note3OwnersCapital.reduce((s, o) => s + ownerClosing(o), 0);
  const totalReserves = n(data.note4Reserves.generalReserveClose) + n(data.note4Reserves.surplusClosingBalance) + n(data.note4Reserves.otherReserves);
  const totalOwnersEquity = totalOwnersCapital + totalReserves;

  const ltBorrowings = [...data.note5Borrowings.ltSecured, ...data.note5Borrowings.ltUnsecured].reduce((s, x: BorrowingItem) => s + n(x.amount), 0);
  const stBorrowings = [...data.note5Borrowings.stSecured, ...data.note5Borrowings.stUnsecured].reduce((s, x: BorrowingItem) => s + n(x.amount), 0);
  const deferredTaxLiab = Math.max(0, n(data.note6DeferredTax.deferredTaxLiability) - n(data.note6DeferredTax.deferredTaxAsset));
  const otherLTLiab = data.note7OtherLTLiabilities.items.reduce((s, x: SimpleLineItem) => s + n(x.amount), 0);
  const ltProvisions = n(data.note8Provisions.ltGratuity) + n(data.note8Provisions.ltLeaveEncashment) + n(data.note8Provisions.ltOther);
  const stProvisions = n(data.note8Provisions.stIncomeTax) + n(data.note8Provisions.stOther);
  const tradePayables = data.note9TradePayables.items.reduce((s, x: TradePayableItem) => s + n(x.withinYear) + n(x.oneToTwo) + n(x.twoToThree) + n(x.aboveThree), 0);
  const otherCL = n(data.note10OtherCL.advancesFromCustomers) + n(data.note10OtherCL.tdsPayable) + n(data.note10OtherCL.gstPayable) + n(data.note10OtherCL.salariesPayable) + data.note10OtherCL.items.reduce((s, x: SimpleLineItem) => s + n(x.amount), 0);

  const totalNCL = ltBorrowings + deferredTaxLiab + otherLTLiab + ltProvisions;
  const totalCL = stBorrowings + stProvisions + tradePayables + otherCL;
  const totalLiabilities = totalOwnersEquity + totalNCL + totalCL;

  // Assets
  const tangibleNetBlock = data.note11FixedAssets.tangibleAssets.reduce((s, r: PPERow) => s + n(r.gbClosingBalance) - n(r.depClosingBalance), 0);
  const intangibleNetBlock = data.note11FixedAssets.intangibleAssets.reduce((s, r: PPERow) => s + n(r.gbClosingBalance) - n(r.depClosingBalance), 0);
  const cwip = n(data.note11FixedAssets.cwip);
  const totalFixedAssets = tangibleNetBlock + intangibleNetBlock + cwip;
  const investments = data.note12Investments.items.reduce((s, x: SimpleLineItem) => s + n(x.amount), 0);
  const ltLoans = n(data.note13LTLoans.securityDeposits) + n(data.note13LTLoans.capitalAdvances) + data.note13LTLoans.items.reduce((s, x: SimpleLineItem) => s + n(x.amount), 0);
  const otherNCA = data.note14OtherNCAssets.items.reduce((s, x: SimpleLineItem) => s + n(x.amount), 0);
  const totalNCA = totalFixedAssets + investments + ltLoans + otherNCA;

  const inventories = n(data.note15Inventories.rawMaterials) + n(data.note15Inventories.wip) + n(data.note15Inventories.finishedGoods) + n(data.note15Inventories.tradingGoods) + n(data.note15Inventories.stores) + n(data.note15Inventories.looseTools);
  const tradeReceivables = data.note16TradeReceivables.items.reduce((s, x: TradeReceivableItem) => s + n(x.withinSixMonths) + n(x.sixToTwelve) + n(x.aboveOne), 0);
  const cashTotal = n(data.note17Cash.cashInHand) + n(data.note17Cash.bankCurrentAccount) + n(data.note17Cash.bankSavingsAccount) + n(data.note17Cash.fdDeposits);
  const stLoans = n(data.note18STLoans.advancesToSuppliers) + n(data.note18STLoans.prepaidExpenses) + data.note18STLoans.items.reduce((s, x: SimpleLineItem) => s + n(x.amount), 0);
  const otherCA = n(data.note18aOtherCA.interestAccrued) + n(data.note18aOtherCA.tdsReceivable) + n(data.note18aOtherCA.gstReceivable) + data.note18aOtherCA.items.reduce((s, x: SimpleLineItem) => s + n(x.amount), 0);
  const totalCA = inventories + tradeReceivables + cashTotal + stLoans + otherCA;
  const totalAssets = totalNCA + totalCA;

  // P&L
  const totalRevenue = n(data.note19Revenue.saleOfGoods) + n(data.note19Revenue.saleOfServices) + n(data.note19Revenue.otherOperatingRevenue) + data.note20OtherIncome.reduce((s, x: SimpleLineItem) => s + n(x.amount), 0);
  const cogsMat = n(data.note21Materials.openingStock) + n(data.note21Materials.purchases) + n(data.note21Materials.directExpenses) - n(data.note21Materials.closingStock);
  const totalEmp = n(data.note22EmployeeBenefits.salariesWages) + n(data.note22EmployeeBenefits.bonuses) + n(data.note22EmployeeBenefits.pf) + n(data.note22EmployeeBenefits.esi) + n(data.note22EmployeeBenefits.gratuity) + n(data.note22EmployeeBenefits.staffWelfare) + data.note22EmployeeBenefits.items.reduce((s, x: SimpleLineItem) => s + n(x.amount), 0);
  const totalFin = n(data.note23FinanceCosts.interestOnBorrowings) + n(data.note23FinanceCosts.bankCharges) + data.note23FinanceCosts.items.reduce((s, x: SimpleLineItem) => s + n(x.amount), 0);
  const totalDep = n(data.note24Depreciation.depOnTangibleAssets) + n(data.note24Depreciation.depOnIntangibleAssets) + n(data.note24Depreciation.amortization);
  const totalOther = data.note25OtherExpenses.reduce((s, x: SimpleLineItem) => s + n(x.amount), 0);
  const totalRemun = data.partnersRemuneration.reduce((s, x) => s + n(x.amount), 0);
  const totalExpenses = cogsMat + totalEmp + totalFin + totalDep + totalOther + totalRemun;
  const profitBeforeTax = totalRevenue - totalExpenses;
  const totalTax = n(data.incomeTaxProvision) + n(data.deferredTaxCharge);
  const netProfit = profitBeforeTax - totalTax;

  const balanced = Math.abs(totalAssets - totalLiabilities) < 2;

  const table = (children: React.ReactNode) => (
    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 32 }}>
      <tbody>{children}</tbody>
    </table>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Actions */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Preview — {data.entityName || "Entity"}</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>FY {data.financialYear} | {data.entityType.charAt(0).toUpperCase() + data.entityType.slice(1)}</div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => onPrint(false)} style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Print without Letterhead
          </button>
          <button onClick={() => onPrint(true)} style={{ background: "linear-gradient(135deg,#0ea5e9,#0369a1)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Print with Letterhead
          </button>
        </div>
      </div>

      {/* Balance check */}
      <div style={{ background: balanced ? "#f0fdf4" : "#fef2f2", border: `1px solid ${balanced ? "#86efac" : "#fca5a5"}`, borderRadius: 12, padding: "12px 18px", fontSize: 13, fontWeight: 600, color: balanced ? "#166534" : "#991b1b" }}>
        {balanced
          ? `✓ Balance Sheet Balanced — Total Assets = Total Liabilities & Equity = ₹${totalAssets.toLocaleString("en-IN")}`
          : `⚠ Balance Sheet Not Balanced — Assets: ₹${totalAssets.toLocaleString("en-IN")} | Liabilities & Equity: ₹${totalLiabilities.toLocaleString("en-IN")} | Difference: ₹${Math.abs(totalAssets - totalLiabilities).toLocaleString("en-IN")}`
        }
      </div>

      {/* Balance Sheet */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "28px 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>{data.entityName || "Entity Name"}</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Balance Sheet as at 31st March {2000 + parseInt(data.financialYear.split("-")[1], 10)}</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>(As per ICAI Guidance Note on Financial Statements for Non-Corporate Entities)</div>
        </div>

        {table(<>
          <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#374151" }}>Particulars</th>
            <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#0369a1" }}>{fyLabels.current} (₹)</th>
            <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#64748b" }}>{fyLabels.prev} (₹)</th>
          </tr>
          <HDR label="I. OWNERS' FUNDS" />
          <ROW label="Note 3 — Owners'/Partners' Capital Account" cur={totalOwnersCapital} />
          <ROW label="Note 4 — Reserves & Surplus" cur={totalReserves} />
          <ROW label="Total Owners' Funds" cur={totalOwnersEquity} bold />

          <HDR label="II. NON-CURRENT LIABILITIES" />
          <ROW label="Note 5 — Long-term Borrowings" cur={ltBorrowings} indent />
          <ROW label="Note 6 — Deferred Tax Liability (Net)" cur={deferredTaxLiab} indent />
          <ROW label="Note 7 — Other Long-term Liabilities" cur={otherLTLiab} indent />
          <ROW label="Note 8 — Long-term Provisions" cur={ltProvisions} indent />
          <ROW label="Total Non-current Liabilities" cur={totalNCL} bold />

          <HDR label="III. CURRENT LIABILITIES" />
          <ROW label="Note 5 — Short-term Borrowings" cur={stBorrowings} indent />
          <ROW label="Note 9 — Trade Payables" cur={tradePayables} indent />
          <ROW label="Note 10 — Other Current Liabilities" cur={otherCL} indent />
          <ROW label="Note 8 — Short-term Provisions" cur={stProvisions} indent />
          <ROW label="Total Current Liabilities" cur={totalCL} bold />

          <tr style={{ background: "#0f172a" }}>
            <td style={{ padding: "12px 12px", fontSize: 14, fontWeight: 800, color: "#fff" }}>TOTAL (I + II + III)</td>
            <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 14, fontWeight: 800, color: "#4ade80" }}>{f(totalLiabilities)}</td>
            <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>{""}</td>
          </tr>

          <HDR label="IV. NON-CURRENT ASSETS" />
          <ROW label="Note 11 — Property, Plant & Equipment (Net Block)" cur={totalFixedAssets} indent />
          <ROW label="Note 12 — Non-current Investments" cur={investments} indent />
          <ROW label="Note 13 — Long-term Loans & Advances" cur={ltLoans} indent />
          <ROW label="Note 14 — Other Non-current Assets" cur={otherNCA} indent />
          <ROW label="Total Non-current Assets" cur={totalNCA} bold />

          <HDR label="V. CURRENT ASSETS" />
          <ROW label="Note 15 — Inventories" cur={inventories} indent />
          <ROW label="Note 16 — Trade Receivables" cur={tradeReceivables} indent />
          <ROW label="Note 17 — Cash & Cash Equivalents" cur={cashTotal} indent />
          <ROW label="Note 18 — Short-term Loans & Advances" cur={stLoans} indent />
          <ROW label="Note 18a — Other Current Assets" cur={otherCA} indent />
          <ROW label="Total Current Assets" cur={totalCA} bold />

          <tr style={{ background: "#0f172a" }}>
            <td style={{ padding: "12px 12px", fontSize: 14, fontWeight: 800, color: "#fff" }}>TOTAL (IV + V)</td>
            <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 14, fontWeight: 800, color: "#4ade80" }}>{f(totalAssets)}</td>
            <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>{""}</td>
          </tr>
        </>)}

        {/* Statement of P&L */}
        <div style={{ fontSize: 17, fontWeight: 900, color: "#0f172a", margin: "32px 0 12px", textAlign: "center" }}>
          Statement of Profit & Loss<br />
          <span style={{ fontSize: 12, fontWeight: 400, color: "#64748b" }}>for the year ended 31st March {2000 + parseInt(data.financialYear.split("-")[1], 10)}</span>
        </div>

        {table(<>
          <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#374151" }}>Particulars</th>
            <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#0369a1" }}>{fyLabels.current} (₹)</th>
            <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#64748b" }}>{fyLabels.prev} (₹)</th>
          </tr>
          <SUB label="I. INCOME" />
          <ROW label="Note 19 — Revenue from Operations" cur={n(data.note19Revenue.saleOfGoods) + n(data.note19Revenue.saleOfServices) + n(data.note19Revenue.otherOperatingRevenue)} indent />
          <ROW label="Note 20 — Other Income" cur={data.note20OtherIncome.reduce((s, x: SimpleLineItem) => s + n(x.amount), 0)} indent />
          <ROW label="Total Income (I)" cur={totalRevenue} bold />

          <SUB label="II. EXPENSES" />
          <ROW label="Note 21 — Cost of Materials Consumed / COGS" cur={cogsMat} indent />
          <ROW label="Note 22 — Employee Benefits Expense" cur={totalEmp} indent />
          <ROW label="Note 23 — Finance Costs" cur={totalFin} indent />
          <ROW label="Note 24 — Depreciation & Amortization" cur={totalDep} indent />
          <ROW label="Note 25 — Other Expenses" cur={totalOther} indent />
          {totalRemun > 0 && <ROW label="Partners' / Designated Partners' Remuneration" cur={totalRemun} indent />}
          <ROW label="Total Expenses (II)" cur={totalExpenses} bold />

          <ROW label="Profit / (Loss) Before Tax (I − II)" cur={profitBeforeTax} bold />
          {totalTax > 0 && <>
            <ROW label="Less: Current Tax Provision" cur={n(data.incomeTaxProvision)} indent />
            <ROW label="Less: Deferred Tax Charge / (Credit)" cur={n(data.deferredTaxCharge)} indent />
          </>}

          <tr style={{ background: netProfit >= 0 ? "#f0fdf4" : "#fef2f2" }}>
            <td style={{ padding: "12px 12px", fontSize: 14, fontWeight: 800, color: netProfit >= 0 ? "#166534" : "#991b1b" }}>Net Profit / (Loss) After Tax</td>
            <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 14, fontWeight: 800, color: netProfit >= 0 ? "#166534" : "#991b1b" }}>{fAbs(netProfit)} {netProfit < 0 ? "(Loss)" : ""}</td>
            <td style={{ padding: "12px 16px" }}></td>
          </tr>
        </>)}

        {/* Signatures */}
        <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>For {data.auditorFirm || "___________________"}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 32 }}>Chartered Accountants / Accountant</div>
            <div style={{ borderTop: "1px solid #374151", paddingTop: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{data.auditorName || "CA Name"}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>M. No. {data.auditorMembership || "______"}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Place: {data.auditorPlace || "______"}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Date: {data.auditorDate || "______"}</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>For {data.entityName || "___________________"}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 32 }}></div>
            <div style={{ borderTop: "1px solid #374151", paddingTop: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{data.signatoryName || "Authorised Signatory"}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{data.signatoryDesignation || "Managing Partner"}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Place: {data.signatoryPlace || "______"}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Date: {data.signatoryDate || "______"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
