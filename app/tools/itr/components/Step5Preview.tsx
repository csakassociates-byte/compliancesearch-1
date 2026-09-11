"use client";
import { ITRData, TaxComputed, computeTax } from "@/lib/itr/types";

interface Props {
  data: ITRData;
  savedId: string | null;
}

const n = (v: string) => parseFloat(v) || 0;

function SummaryRow({ label, value, sub, bold, green, red }: { label: string; value: string | number; sub?: boolean; bold?: boolean; green?: boolean; red?: boolean }) {
  const val = typeof value === "number" ? `₹${value.toLocaleString("en-IN")}` : value;
  return (
    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
      <td style={{ padding: sub ? "7px 12px 7px 28px" : "9px 12px", fontSize: sub ? 12 : 13, color: "#374151" }}>{label}</td>
      <td style={{ padding: "9px 12px", fontSize: sub ? 12 : 13, fontWeight: bold ? 800 : 600, color: green ? "#059669" : red ? "#dc2626" : "#0f172a", textAlign: "right", fontFamily: "monospace" }}>{val}</td>
    </tr>
  );
}

function buildPortalJson(data: ITRData, tc: TaxComputed): Record<string, unknown> {
  const raw = data.prefillRawJson ?? {};

  // Deep-clone raw to patch
  const patched = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;

  const personalInfo = (patched.personalInfo ?? {}) as Record<string, unknown>;
  personalInfo.pan = data.pan;
  const assesseeName = (personalInfo.assesseeName ?? {}) as Record<string, unknown>;
  assesseeName.firstName = data.firstName;
  assesseeName.middleName = data.middleName;
  assesseeName.surNameOrOrgName = data.lastName;
  personalInfo.assesseeName = assesseeName;
  personalInfo.fatherName = data.fatherName;
  personalInfo.dob = data.dob;
  const address = (personalInfo.address ?? {}) as Record<string, unknown>;
  address.mobileNo = data.mobile;
  address.emailAddress = data.email;
  address.stateCode = data.state;
  address.pinCode = data.pinCode;
  personalInfo.address = address;
  patched.personalInfo = personalInfo;

  // Schedule BP / presumptive
  if (data.businessIncome.schemeType === "44ADA") {
    const busIncome = n(data.businessIncome.grossReceipts) * 0.5;
    const schedBP: Record<string, unknown> = {
      NoAccountCase: { GrsRcptsUndr44ADA: n(data.businessIncome.grossReceipts), PrftUndr44ADA: busIncome },
    };
    patched.scheduleBP = schedBP;
  }

  // Other income
  const schedOS: Record<string, unknown> = {
    IncFrmOS: {
      DividendInc: n(data.otherIncome.dividendIncome),
      IntrstFrmSvng: n(data.otherIncome.savingsInterest),
      IntrstFrmTermDep: n(data.otherIncome.fdInterest),
      FmlPnsn: n(data.otherIncome.familyPension),
    },
  };
  patched.scheduleOS = schedOS;

  // Deductions
  const schedVIA: Record<string, unknown> = {};
  if (data.taxRegime === "OLD") {
    const sec80CFamily = Math.min(150000, n(data.deductions.sec80C) + n(data.deductions.sec80CCC) + n(data.deductions.sec80CCD1));
    Object.assign(schedVIA, {
      UsrDeductUndChapVIA: {
        Section80C: n(data.deductions.sec80C),
        Section80CCC: n(data.deductions.sec80CCC),
        Section80CCDEmployeeOrSE: n(data.deductions.sec80CCD1),
        DeductionUs80C: sec80CFamily,
        Section80CCDOther: n(data.deductions.sec80CCD1B),
        Section80D: n(data.deductions.sec80D_self) + n(data.deductions.sec80D_parents),
        Section80E: n(data.deductions.sec80E),
        Section80TTA: Math.min(10000, n(data.deductions.sec80TTA)),
        Section80G: n(data.deductions.sec80G),
        Section80GG: n(data.deductions.sec80GG),
        Section80U: n(data.deductions.sec80U),
      },
    });
  } else {
    Object.assign(schedVIA, {
      UsrDeductUndChapVIA: {
        Section80CCDEmployer: n(data.deductions.sec80CCD2),
        Section80CCDOther: n(data.deductions.sec80CCD1B),
      },
    });
  }
  patched.scheduleVIA = schedVIA;

  // Tax summary
  patched.taxPayable = {
    IntrstPayUs234A: 0,
    IntrstPayUs234B: 0,
    IntrstPayUs234C: 0,
    TotalTaxAndIntrstPay: tc.totalTaxLiability,
    TotalTaxPayable: tc.totalTaxLiability,
    NetTaxPayable: tc.demand > 0 ? tc.demand : 0,
    Refund: tc.refund,
  };

  // Bank for refund
  if (data.refundBankAccount) {
    patched.bankAccountDtls = [{
      addtnlBankDetails: data.bankAccounts.map(b => ({
        bankAccountNo: b.bankAccountNo,
        bankName: b.bankName,
        ifsccode: b.ifsccode,
        AccountType: b.AccountType,
        useForRefund: b.useForRefund,
      })),
    }];
  }

  return patched;
}

function downloadJson(data: ITRData, tc: TaxComputed) {
  const portal = buildPortalJson(data, tc);
  const blob = new Blob([JSON.stringify(portal, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.pan}-ITR-${data.itrForm.replace("ITR-", "")}-AY${data.assessmentYear}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Step5Preview({ data, savedId }: Props) {
  const tc = computeTax(data);
  const hasRefund = tc.refund > 0;
  const hasDemand = tc.demand > 0;

  const busIncome = data.businessIncome.schemeType === "44ADA"
    ? Math.max(0, n(data.businessIncome.grossReceipts) * 0.5)
    : data.businessIncome.schemeType === "44AD"
    ? Math.max(0, n(data.businessIncome.grossReceipts) * 0.08)
    : n(data.businessIncome.profitFromBusiness);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Final status banner */}
      <div style={{
        background: hasRefund ? "linear-gradient(135deg,#0f172a,#065f46)" : hasDemand ? "linear-gradient(135deg,#0f172a,#7f1d1d)" : "linear-gradient(135deg,#0f172a,#1e3a8a)",
        borderRadius: 18, padding: "28px 32px", color: "#fff",
      }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>
          ITR Filing Summary — {data.pan} · {data.firstName} {data.lastName} · AY {data.assessmentYear} · {data.itrForm} · {data.taxRegime} Regime
        </div>
        <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Taxable Income</div>
            <div style={{ fontSize: 26, fontWeight: 900, fontFamily: "monospace" }}>₹{tc.taxableIncome.toLocaleString("en-IN")}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Total Tax Liability</div>
            <div style={{ fontSize: 26, fontWeight: 900, fontFamily: "monospace" }}>₹{tc.totalTaxLiability.toLocaleString("en-IN")}</div>
          </div>
          {hasRefund && (
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>REFUND</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#4ade80", fontFamily: "monospace" }}>₹{tc.refund.toLocaleString("en-IN")}</div>
            </div>
          )}
          {hasDemand && (
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>DEMAND PAYABLE</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#f87171", fontFamily: "monospace" }}>₹{tc.demand.toLocaleString("en-IN")}</div>
            </div>
          )}
        </div>
      </div>

      {/* Income Summary */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 12px" }}>Income Summary</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {data.salaries.length > 0 && (
              <>
                <SummaryRow label="Salary Income" value={data.salaries.reduce((s, x) => s + n(x.netSalary), 0)} bold />
                {data.salaries.map((s, i) => <SummaryRow key={i} sub label={s.employerName || `Employer ${i+1}`} value={n(s.netSalary)} />)}
              </>
            )}
            {data.houseProperties.length > 0 && (
              <SummaryRow label="House Property Income" value={data.houseProperties.reduce((s, x) => s + n(x.netHPIncome), 0)} bold />
            )}
            {busIncome > 0 && (
              <>
                <SummaryRow label={`Business / Profession (${data.businessIncome.schemeType})`} value={busIncome} bold />
                {data.businessIncome.firmName && <SummaryRow sub label={data.businessIncome.firmName} value={busIncome} />}
              </>
            )}
            {(n(data.otherIncome.savingsInterest) + n(data.otherIncome.fdInterest) + n(data.otherIncome.dividendIncome)) > 0 && (
              <>
                <SummaryRow label="Other Sources Income" value={n(data.otherIncome.savingsInterest) + n(data.otherIncome.fdInterest) + n(data.otherIncome.dividendIncome) + n(data.otherIncome.familyPension) + data.otherIncome.otherItems.reduce((s, x) => s + n(x.amount), 0)} bold />
                {n(data.otherIncome.dividendIncome) > 0 && <SummaryRow sub label="Dividend" value={n(data.otherIncome.dividendIncome)} />}
                {n(data.otherIncome.savingsInterest) > 0 && <SummaryRow sub label="Savings Bank Interest" value={n(data.otherIncome.savingsInterest)} />}
                {n(data.otherIncome.fdInterest) > 0 && <SummaryRow sub label="FD / Other Interest" value={n(data.otherIncome.fdInterest)} />}
              </>
            )}
            <SummaryRow label="Gross Total Income" value={tc.totalIncome} bold />
            <SummaryRow label="Less: Deductions (Chapter VI-A)" value={tc.totalIncome - tc.taxableIncome} sub />
            <SummaryRow label="Taxable Income" value={tc.taxableIncome} bold />
          </tbody>
        </table>
      </div>

      {/* Tax Summary */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 12px" }}>Tax Computation</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <SummaryRow label="Basic Income Tax" value={tc.basicTax} />
            {tc.surcharge > 0 && <SummaryRow sub label="Surcharge" value={tc.surcharge} />}
            <SummaryRow sub label="Health & Education Cess (4%)" value={tc.healthEduCess} />
            <SummaryRow label="Total Tax Liability" value={tc.totalTaxLiability} bold />
            <SummaryRow label="TDS Credits (26AS)" value={tc.tdsCredit} sub green />
            <SummaryRow label="Advance Tax Paid" value={tc.advanceTax} sub green />
            <SummaryRow label="Total Tax Paid" value={tc.totalTaxPaid} bold green />
            {hasRefund && <SummaryRow label="REFUND DUE" value={tc.refund} bold green />}
            {hasDemand && <SummaryRow label="TAX DEMAND PAYABLE" value={tc.demand} bold red />}
            {!hasRefund && !hasDemand && <SummaryRow label="Balance" value="NIL" bold />}
          </tbody>
        </table>
      </div>

      {/* Refund bank */}
      {hasRefund && data.refundBankAccount && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: "18px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 6 }}>Refund Bank Account</div>
          <div style={{ fontSize: 13, color: "#374151" }}>{data.bankAccounts.find(b => b.bankAccountNo === data.refundBankAccount)?.bankName} — {data.refundBankAccount} (IFSC: {data.refundBankIFSC})</div>
        </div>
      )}

      {/* Export JSON */}
      <div style={{ background: "#fff", border: "2px dashed #3b82f6", borderRadius: 16, padding: "28px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: "#1d4ed8", marginBottom: 8 }}>Export Portal JSON</div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20, lineHeight: 1.6 }}>
          Downloads a JSON file pre-patched with your filled data.<br />
          Upload it to <strong>incometax.gov.in → e-File → Upload ITR</strong>.
        </div>
        <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
          <button
            onClick={() => downloadJson(data, tc)}
            style={{ background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
          >
            <span style={{ fontSize: 20 }}>⬇</span>
            Download {data.itrForm} JSON for Portal Upload
          </button>
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: "#94a3b8" }}>
          File: {data.pan}-ITR-{data.itrForm.replace("ITR-", "")}-AY{data.assessmentYear}.json
          {savedId && <span style={{ marginLeft: 12, color: "#059669" }}>• Saved (ID: {savedId})</span>}
        </div>
      </div>

    </div>
  );
}
