"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

type CalcType = "gst_filing" | "tds_deposit" | "itr_filing" | "pf_deposit";

const CALC_OPTIONS = [
  { key: "gst_filing",  label: "GST Late Filing",    icon: "📊", desc: "GSTR-1 / GSTR-3B late fee + interest" },
  { key: "tds_deposit", label: "TDS Late Deposit",   icon: "💸", desc: "Interest for late TDS deduction / deposit" },
  { key: "itr_filing",  label: "ITR Late Filing",    icon: "📋", desc: "Penalty u/s 234F + interest u/s 234A" },
  { key: "pf_deposit",  label: "PF Late Deposit",    icon: "👷", desc: "EPF damage charges for late contribution" },
] as const;

type GSTResult = { lateFee: number; interest: number; total: number; isNilReturn: boolean; capped: boolean };
type TDSResult  = { interestAmt: number; rate: number; months: number };
type ITRResult  = { penalty234F: number; interest234A: number; total: number };
type PFResult   = { damageRate: number; damageAmt: number; period: string };
type CalcResult = { gst?: GSTResult; tds?: TDSResult; itr?: ITRResult; pf?: PFResult };

function calcGST(daysLate: number, taxAmt: number, isNil: boolean): GSTResult {
  const dailyFee  = isNil ? 20 : 50;
  const rawFee    = dailyFee * daysLate;
  const capped    = rawFee > 10000;
  const lateFee   = Math.min(rawFee, 10000);
  const interest  = taxAmt > 0 ? Math.round(taxAmt * 0.18 * daysLate / 365) : 0;
  return { lateFee, interest, total: lateFee + interest, isNilReturn: isNil, capped };
}

function calcTDS(taxAmt: number, daysLate: number, notDeducted: boolean): TDSResult {
  const rate     = notDeducted ? 0.01 : 0.015; // 1% or 1.5% per month
  const months   = Math.ceil(daysLate / 30);
  const interestAmt = Math.round(taxAmt * rate * months);
  return { interestAmt, rate: rate * 100, months };
}

function calcITR(income: number, taxDue: number, daysLate: number): ITRResult {
  const penalty234F  = income <= 500000 ? 1000 : 5000;
  const months       = Math.ceil(daysLate / 30);
  const interest234A = Math.round(taxDue * 0.01 * months);
  return { penalty234F, interest234A, total: penalty234F + interest234A };
}

function calcPF(amount: number, daysLate: number): PFResult {
  let damageRate: number; let period: string;
  if (daysLate <= 60)       { damageRate = 0.05; period = "Up to 2 months (5% p.a.)"; }
  else if (daysLate <= 120) { damageRate = 0.10; period = "2–4 months (10% p.a.)"; }
  else if (daysLate <= 180) { damageRate = 0.15; period = "4–6 months (15% p.a.)"; }
  else                      { damageRate = 0.25; period = "Above 6 months (25% p.a.)"; }
  const damageAmt = Math.round(amount * damageRate * daysLate / 365);
  return { damageRate: damageRate * 100, damageAmt, period };
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function PenaltyCalculatorPage() {
  const [activeCalc, setActiveCalc] = useState<CalcType>("gst_filing");

  // GST fields
  const [gstDays,  setGstDays]  = useState("");
  const [gstTax,   setGstTax]   = useState("");
  const [gstNil,   setGstNil]   = useState(false);

  // TDS fields
  const [tdsTax,      setTdsTax]      = useState("");
  const [tdsDays,     setTdsDays]     = useState("");
  const [tdsNotDed,   setTdsNotDed]   = useState(false);

  // ITR fields
  const [itrIncome, setItrIncome] = useState("");
  const [itrTax,    setItrTax]    = useState("");
  const [itrDays,   setItrDays]   = useState("");

  // PF fields
  const [pfAmt,  setPfAmt]  = useState("");
  const [pfDays, setPfDays] = useState("");

  const [result, setResult] = useState<CalcResult | null>(null);

  const calculate = () => {
    setResult(null);
    if (activeCalc === "gst_filing") {
      if (!gstDays) return;
      setResult({ gst: calcGST(Number(gstDays), Number(gstTax)||0, gstNil) });
    } else if (activeCalc === "tds_deposit") {
      if (!tdsTax || !tdsDays) return;
      setResult({ tds: calcTDS(Number(tdsTax), Number(tdsDays), tdsNotDed) });
    } else if (activeCalc === "itr_filing") {
      if (!itrIncome || !itrDays) return;
      setResult({ itr: calcITR(Number(itrIncome), Number(itrTax)||0, Number(itrDays)) });
    } else if (activeCalc === "pf_deposit") {
      if (!pfAmt || !pfDays) return;
      setResult({ pf: calcPF(Number(pfAmt), Number(pfDays)) });
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <div className="max-w-2xl mx-auto w-full px-4 py-12 flex-1">
        <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-8">← Home</Link>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full mb-4 border"
            style={{ background:"#eff6ff", borderColor:"#bfdbfe", color:"#1d4ed8" }}>
            🧮 Compliance Penalty Calculator
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Calculate Your Penalty</h1>
          <p className="text-slate-500">Find out exactly how much penalty, interest, or damage charges you owe for late compliance.</p>
        </div>

        {/* Calc type selector */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {CALC_OPTIONS.map(opt => (
            <button key={opt.key} onClick={() => { setActiveCalc(opt.key); setResult(null); }}
              className={`rounded-2xl p-4 text-left border-2 transition ${
                activeCalc === opt.key
                  ? "border-blue-400 bg-blue-50 shadow"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}>
              <div className="text-2xl mb-1">{opt.icon}</div>
              <p className="font-bold text-slate-800 text-sm">{opt.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>

        {/* Input Form */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="font-bold text-slate-800 mb-5">
            {CALC_OPTIONS.find(o => o.key === activeCalc)?.icon}{" "}
            {CALC_OPTIONS.find(o => o.key === activeCalc)?.label}
          </h2>

          {/* GST Filing */}
          {activeCalc === "gst_filing" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Number of Days Late *</label>
                <input type="number" min="1" value={gstDays} onChange={e => setGstDays(e.target.value)}
                  placeholder="e.g. 30"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Unpaid Tax Amount (₹) <span className="text-slate-400 font-normal">— for interest calculation</span></label>
                <input type="number" min="0" value={gstTax} onChange={e => setGstTax(e.target.value)}
                  placeholder="e.g. 50000 (leave blank if fully paid)"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={gstNil} onChange={e => setGstNil(e.target.checked)}
                  className="w-4 h-4 accent-blue-600" />
                <span className="text-sm text-slate-700">This is a Nil Return <span className="text-slate-400 text-xs">(₹20/day instead of ₹50/day)</span></span>
              </label>
            </div>
          )}

          {/* TDS Deposit */}
          {activeCalc === "tds_deposit" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">TDS Amount (₹) *</label>
                <input type="number" min="0" value={tdsTax} onChange={e => setTdsTax(e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Number of Days Late *</label>
                <input type="number" min="1" value={tdsDays} onChange={e => setTdsDays(e.target.value)}
                  placeholder="e.g. 45"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={tdsNotDed} onChange={e => setTdsNotDed(e.target.checked)}
                  className="w-4 h-4 accent-blue-600" />
                <span className="text-sm text-slate-700">TDS was <strong>not deducted</strong> at all <span className="text-slate-400 text-xs">(1%/month instead of 1.5%/month)</span></span>
              </label>
            </div>
          )}

          {/* ITR Filing */}
          {activeCalc === "itr_filing" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Annual Income (₹) *</label>
                <input type="number" min="0" value={itrIncome} onChange={e => setItrIncome(e.target.value)}
                  placeholder="e.g. 800000"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tax Due (₹) <span className="text-slate-400 font-normal">— for interest u/s 234A</span></label>
                <input type="number" min="0" value={itrTax} onChange={e => setItrTax(e.target.value)}
                  placeholder="e.g. 15000 (0 if fully paid via advance tax)"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Days Late (after due date) *</label>
                <input type="number" min="1" value={itrDays} onChange={e => setItrDays(e.target.value)}
                  placeholder="e.g. 90"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white" />
              </div>
            </div>
          )}

          {/* PF Deposit */}
          {activeCalc === "pf_deposit" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">PF Contribution Amount (₹) *</label>
                <input type="number" min="0" value={pfAmt} onChange={e => setPfAmt(e.target.value)}
                  placeholder="e.g. 30000"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Days Late *</label>
                <input type="number" min="1" value={pfDays} onChange={e => setPfDays(e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white" />
              </div>
            </div>
          )}

          <button onClick={calculate}
            className="w-full mt-6 py-3.5 rounded-2xl font-bold text-white transition hover:scale-105"
            style={{ background:"linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
            Calculate Penalty →
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-6">
            <h3 className="font-extrabold text-red-800 text-lg mb-4">📊 Penalty Breakdown</h3>

            {result.gst && (
              <div className="space-y-3">
                <Row label="Late Fee" value={fmt(result.gst.lateFee)}
                  note={result.gst.capped ? "Capped at ₹10,000 maximum" : `${gstNil?"₹20":"₹50"}/day × ${gstDays} days`} />
                {result.gst.interest > 0 && (
                  <Row label="Interest (18% p.a.)" value={fmt(result.gst.interest)}
                    note="On unpaid tax amount" />
                )}
                <div className="border-t border-red-200 pt-3">
                  <Row label="TOTAL PAYABLE" value={fmt(result.gst.total)} big />
                </div>
                <p className="text-xs text-red-600 bg-red-100 rounded-xl px-3 py-2">
                  💡 Both CGST and SGST late fees are included in the above amount.
                </p>
              </div>
            )}

            {result.tds && (
              <div className="space-y-3">
                <Row label={`Interest Rate`} value={`${result.tds.rate}% per month`}
                  note={tdsNotDed ? "TDS not deducted (1%/month from deduction date)" : "TDS deducted but not deposited (1.5%/month)"} />
                <Row label="Months Counted" value={`${result.tds.months} month${result.tds.months>1?"s":""}`} note="Rounded up to nearest month" />
                <div className="border-t border-red-200 pt-3">
                  <Row label="INTEREST PAYABLE" value={fmt(result.tds.interestAmt)} big />
                </div>
                <p className="text-xs text-red-600 bg-red-100 rounded-xl px-3 py-2">
                  ⚠️ Penalty equal to TDS amount may also apply under Section 271C for non-deduction.
                </p>
              </div>
            )}

            {result.itr && (
              <div className="space-y-3">
                <Row label="Penalty u/s 234F" value={fmt(result.itr.penalty234F)}
                  note={Number(itrIncome)<=500000?"₹1,000 (income ≤ ₹5 lakh)":"₹5,000 (income > ₹5 lakh)"} />
                {result.itr.interest234A > 0 && (
                  <Row label="Interest u/s 234A" value={fmt(result.itr.interest234A)}
                    note="1% per month on unpaid tax" />
                )}
                <div className="border-t border-red-200 pt-3">
                  <Row label="TOTAL PAYABLE" value={fmt(result.itr.total)} big />
                </div>
              </div>
            )}

            {result.pf && (
              <div className="space-y-3">
                <Row label="Damage Rate" value={`${result.pf.damageRate}% p.a.`} note={result.pf.period} />
                <div className="border-t border-red-200 pt-3">
                  <Row label="DAMAGE CHARGES" value={fmt(result.pf.damageAmt)} big />
                </div>
                <p className="text-xs text-red-600 bg-red-100 rounded-xl px-3 py-2">
                  ⚠️ Additional 12% interest p.a. is also charged separately on delayed PF deposits.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-700">
          <strong>Disclaimer:</strong> This calculator provides an estimate based on standard rates. Actual penalty may vary. Consult a CA or CS for exact calculations and legal advice.
        </div>
      </div>

      <footer className="border-t border-slate-200 py-6 px-4 mt-auto">
        <div className="max-w-2xl mx-auto text-center text-sm text-slate-400">
          © {new Date().getFullYear()} ComplianceSearch.in — Powered by{" "}
          <a href="https://geebharat.com" className="text-amber-600 hover:underline">Gee Bharat</a>
        </div>
      </footer>
    </main>
  );
}

function Row({ label, value, note, big }: { label: string; value: string; note?: string; big?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className={`font-semibold ${big ? "text-red-800 text-base" : "text-slate-700 text-sm"}`}>{label}</p>
        {note && <p className="text-xs text-slate-400 mt-0.5">{note}</p>}
      </div>
      <p className={`font-extrabold shrink-0 ${big ? "text-red-700 text-xl" : "text-slate-800 text-sm"}`}>{value}</p>
    </div>
  );
}
