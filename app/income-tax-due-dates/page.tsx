import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Income Tax Due Dates FY 2025-26 — ITR, Advance Tax, TDS Calendar | ComplianceSearch.in",
  description:
    "Complete Income Tax due dates for FY 2025-26 (AY 2026-27). ITR filing deadlines, Advance Tax installment dates, TDS payment and return due dates for individuals, companies, and trusts.",
  keywords:
    "income tax due dates 2025-26, ITR filing deadline, advance tax due dates, TDS payment due date, TDS return due date, Form 16 due date, income tax calendar India",
};

const ADVANCE_TAX = [
  { installment: "1st Installment", dueDate: "15 June 2025",     percent: "15% of estimated tax",  who: "All taxpayers except senior citizens (no business income)" },
  { installment: "2nd Installment", dueDate: "15 September 2025",percent: "45% of estimated tax (cumulative)",  who: "All taxpayers except senior citizens (no business income)" },
  { installment: "3rd Installment", dueDate: "15 December 2025", percent: "75% of estimated tax (cumulative)", who: "All taxpayers except senior citizens (no business income)" },
  { installment: "4th Installment", dueDate: "15 March 2026",    percent: "100% of estimated tax (cumulative)", who: "All taxpayers including senior citizens (business income)" },
];

const ITR_DEADLINES = [
  { taxpayer: "Individuals, HUF, AOP, BOI (No Audit Required)", itr: "ITR-1, 2, 3, 4", due: "31 July 2026", note: "Standard deadline" },
  { taxpayer: "Business / Profession requiring Tax Audit (Sec 44AB)", itr: "ITR-3, 5, 6", due: "31 October 2026", note: "Audit report due 30 Sep 2026" },
  { taxpayer: "Companies (all)", itr: "ITR-6", due: "31 October 2026", note: "Tax audit mandatory for most" },
  { taxpayer: "Partners of firms requiring audit / working partners", itr: "ITR-2, 3", due: "31 October 2026", note: "Extended along with firm" },
  { taxpayer: "Transfer Pricing cases (Sec 92E)", itr: "All applicable", due: "30 November 2026", note: "TP report due 31 Oct 2026" },
  { taxpayer: "Revised Return (all)", itr: "Any ITR", due: "31 December 2026", note: "Before end of relevant AY" },
  { taxpayer: "Belated Return (all)", itr: "Any ITR", due: "31 December 2026", note: "With late filing fee u/s 234F" },
  { taxpayer: "Updated Return — ITR-U (u/s 139(8A))", itr: "Any ITR", due: "24 months from end of relevant AY", note: "i.e., 31 March 2028 for AY 2026-27" },
];

const TDS_PAYMENT = [
  { month: "April 2025",     due: "7 May 2025",     govtDue: "Same day (7 May)" },
  { month: "May 2025",       due: "7 June 2025",    govtDue: "Same day (7 Jun)" },
  { month: "June 2025",      due: "7 July 2025",    govtDue: "Same day (7 Jul)" },
  { month: "July 2025",      due: "7 August 2025",  govtDue: "Same day (7 Aug)" },
  { month: "August 2025",    due: "7 September 2025",govtDue: "Same day (7 Sep)" },
  { month: "September 2025", due: "7 October 2025", govtDue: "Same day (7 Oct)" },
  { month: "October 2025",   due: "7 November 2025",govtDue: "Same day (7 Nov)" },
  { month: "November 2025",  due: "7 December 2025",govtDue: "Same day (7 Dec)" },
  { month: "December 2025",  due: "7 January 2026", govtDue: "Same day (7 Jan)" },
  { month: "January 2026",   due: "7 February 2026",govtDue: "Same day (7 Feb)" },
  { month: "February 2026",  due: "7 March 2026",   govtDue: "Same day (7 Mar)" },
  { month: "March 2026",     due: "30 April 2026",  govtDue: "Same day (30 Apr)" },
];

const TDS_RETURNS = [
  { quarter: "Q1 — Apr to Jun 2025", payment: "30 June 2025 (last month 7 Jul)", returns: "31 July 2025", form16: "15 Sep 2025", form16a: "15 Aug 2025" },
  { quarter: "Q2 — Jul to Sep 2025", payment: "30 Sep 2025 (last month 7 Oct)", returns: "31 Oct 2025",  form16: "—",           form16a: "15 Nov 2025" },
  { quarter: "Q3 — Oct to Dec 2025", payment: "31 Dec 2025 (last month 7 Jan)", returns: "31 Jan 2026",  form16: "—",           form16a: "15 Feb 2026" },
  { quarter: "Q4 — Jan to Mar 2026", payment: "31 Mar 2026 (last month 30 Apr)", returns: "31 May 2026", form16: "15 Jun 2026",  form16a: "15 Jun 2026" },
];

const OTHER_DATES = [
  { task: "Form 15G / 15H submission by recipient to deductor", due: "Start of FY / at time of first payment", note: "Declarations for nil TDS" },
  { task: "Lower deduction certificate (Form 13)", due: "Apply before first payment — TRACES portal", note: "Valid for FY, TRACES" },
  { task: "Tax Audit Report (Form 3CA/3CB + 3CD)", due: "30 September 2026", note: "For audit cases" },
  { task: "Transfer Pricing Report (Form 3CEB)", due: "31 October 2026", note: "Sec 92E applicable cases" },
  { task: "Country-by-Country Report (Form 3CEAD)", due: "12 months from end of reporting accounting year", note: "MNCs / constituent entities" },
  { task: "SFT (Statement of Financial Transactions — Form 61A)", due: "31 May 2026", note: "Banks, MF, RDs, registrars, etc." },
  { task: "Annual Information Statement (AIS)", due: "Auto-generated by ITD", note: "Review before filing ITR" },
  { task: "Form 29B — MAT Certificate (CA Certificate)", due: "Along with ITR filing", note: "Companies under MAT / AMT" },
];

const PENALTY = [
  { offence: "Late ITR filing (income ≤ ₹5 lakh)", penalty: "₹1,000 (u/s 234F)", interest: "1% p.m. u/s 234A" },
  { offence: "Late ITR filing (income > ₹5 lakh)", penalty: "₹5,000 (u/s 234F)", interest: "1% p.m. u/s 234A" },
  { offence: "Late Advance Tax payment", penalty: "Interest u/s 234B (1% p.m.) + 234C (1% p.m.)", interest: "On shortfall" },
  { offence: "TDS not deducted (u/s 201)", penalty: "1% p.m. interest from deductible date to deduction date", interest: "1% p.m." },
  { offence: "TDS deducted but not deposited (u/s 201)", penalty: "1.5% p.m. interest from deduction date to deposit date", interest: "1.5% p.m." },
  { offence: "Late TDS return filing (u/s 234E)", penalty: "₹200/day up to TDS amount", interest: "Max = TDS amount" },
  { offence: "Concealment of income / Inaccurate particulars", penalty: "100% to 300% of tax evaded (u/s 271(1)(c))", interest: "Criminal prosecution possible" },
];

export default function IncomeTaxDueDatesPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero */}
      <section
        className="py-14 px-4 text-center"
        style={{ background: "linear-gradient(160deg,#eff6ff 0%,#f0f9ff 50%,#f9fafb 100%)" }}
      >
        <div
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-1.5 rounded-full mb-5 border"
          style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1e40af" }}
        >
          💰 Updated for FY 2025-26 / AY 2026-27
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
          Income Tax{" "}
          <span
            style={{
              background: "linear-gradient(90deg,#1d4ed8,#2563eb,#0ea5e9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Due Dates
          </span>
          <br />
          <span className="text-2xl md:text-3xl text-slate-600 font-bold">FY 2025-26 (AY 2026-27)</span>
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
          ITR filing deadlines, Advance Tax installment dates, TDS payment &amp; return due dates —
          for individuals, companies, firms, and trusts.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <Link
            href="/tools/penalty-calculator"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm transition hover:scale-105"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}
          >
            🧮 Calculate Income Tax Penalty →
          </Link>
          <Link
            href="/check"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-blue-700 border-2 border-blue-300 bg-blue-50 text-sm transition hover:bg-blue-100"
          >
            ✅ Check Your Tax Compliance
          </Link>
        </div>
      </section>

      <div className="max-w-5xl mx-auto w-full px-4 py-10 flex-1">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-8 flex-wrap">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>›</span>
          <span className="text-blue-700 font-medium">Income Tax Due Dates</span>
        </div>

        {/* Important Note */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 text-sm text-amber-800">
          <strong>📌 Note:</strong> Dates below are standard statutory due dates for FY 2025-26. The CBDT may
          extend deadlines via notifications. Always verify on the Income Tax portal (incometax.gov.in) or consult
          a qualified CA before filing.
        </div>

        {/* ITR Filing Deadlines */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">📄 ITR Filing Deadlines — AY 2026-27</h2>
          <p className="text-slate-500 text-sm mb-5">For income earned during FY 2025-26 (April 2025 – March 2026)</p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-700 text-white">
                  <th className="text-left px-4 py-3 font-bold">Taxpayer Category</th>
                  <th className="text-left px-4 py-3 font-bold">Applicable ITR</th>
                  <th className="text-left px-4 py-3 font-bold">Due Date</th>
                  <th className="text-left px-4 py-3 font-bold">Note</th>
                </tr>
              </thead>
              <tbody>
                {ITR_DEADLINES.map((r, i) => (
                  <tr key={r.taxpayer} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-4 py-3 font-semibold text-slate-800 text-xs leading-relaxed">{r.taxpayer}</td>
                    <td className="px-4 py-3 text-blue-700 font-bold whitespace-nowrap">{r.itr}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">{r.due}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Advance Tax */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">💳 Advance Tax Installment Dates — FY 2025-26</h2>
          <p className="text-slate-500 text-sm mb-5">Applicable when estimated tax liability exceeds ₹10,000 in a FY</p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-indigo-700 text-white">
                  <th className="text-left px-4 py-3 font-bold">Installment</th>
                  <th className="text-left px-4 py-3 font-bold">Due Date</th>
                  <th className="text-left px-4 py-3 font-bold">% of Estimated Tax</th>
                  <th className="text-left px-4 py-3 font-bold">Who Pays?</th>
                </tr>
              </thead>
              <tbody>
                {ADVANCE_TAX.map((r, i) => (
                  <tr key={r.installment} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-4 py-3 font-bold text-indigo-700">{r.installment}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{r.dueDate}</td>
                    <td className="px-4 py-3 text-slate-700">{r.percent}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{r.who}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
            <strong>Note:</strong> Senior citizens (60+ years) with NO income from business/profession are exempt from advance tax. Taxpayers under presumptive taxation (44AD/44ADA) must pay entire advance tax by 15th March.
          </div>
        </section>

        {/* TDS Payment Due Dates */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">🏛️ TDS / TCS Payment Due Dates</h2>
          <p className="text-slate-500 text-sm mb-5">Monthly TDS deposit deadlines for deductors</p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="text-left px-4 py-3 font-bold">Month of Deduction</th>
                  <th className="text-left px-4 py-3 font-bold">Due Date (Non-Govt.)</th>
                  <th className="text-left px-4 py-3 font-bold">Due Date (Govt. Deductors)</th>
                </tr>
              </thead>
              <tbody>
                {TDS_PAYMENT.map((r, i) => (
                  <tr key={r.month} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-4 py-3 font-semibold text-slate-700">{r.month}</td>
                    <td className="px-4 py-3 font-bold text-blue-700">{r.due}</td>
                    <td className="px-4 py-3 text-slate-600">{r.govtDue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-2">* March TDS has extended deadline of 30 April. Govt deductors pay on same day. TCS payment also follows same schedule.</p>
        </section>

        {/* TDS Returns */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">📋 TDS Return Filing Due Dates</h2>
          <p className="text-slate-500 text-sm mb-5">Quarterly TDS returns (24Q salary / 26Q non-salary) and Form 16 / 16A issuance deadlines</p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cyan-700 text-white">
                  <th className="text-left px-4 py-3 font-bold">Quarter</th>
                  <th className="text-left px-4 py-3 font-bold">TDS Return (24Q / 26Q)</th>
                  <th className="text-left px-4 py-3 font-bold">Form 16 (Salary)</th>
                  <th className="text-left px-4 py-3 font-bold">Form 16A (Non-Salary)</th>
                </tr>
              </thead>
              <tbody>
                {TDS_RETURNS.map((r, i) => (
                  <tr key={r.quarter} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-4 py-3 font-semibold text-slate-700 text-xs leading-snug">{r.quarter}</td>
                    <td className="px-4 py-3 font-bold text-cyan-700">{r.returns}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{r.form16 === "—" ? <span className="text-slate-300">—</span> : r.form16}</td>
                    <td className="px-4 py-3 text-slate-700">{r.form16a}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 bg-cyan-50 border border-cyan-200 rounded-xl p-3 text-xs text-cyan-700">
            <strong>Note:</strong> Form 16 (Part A + Part B) must be issued to employees by 15 June after year end. Form 16A (for non-salary TDS) must be issued within 15 days of TDS return filing.
          </div>
        </section>

        {/* Other Key Dates */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">📌 Other Key Compliance Dates</h2>
          <p className="text-slate-500 text-sm mb-5">Audit reports, SFT, 15G/15H and other important dates</p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-600">
                  <th className="text-left px-4 py-3 font-semibold">Task / Form</th>
                  <th className="text-left px-4 py-3 font-semibold">Due Date</th>
                  <th className="text-left px-4 py-3 font-semibold">Note</th>
                </tr>
              </thead>
              <tbody>
                {OTHER_DATES.map((r, i) => (
                  <tr key={r.task} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-4 py-3 font-semibold text-slate-700 text-xs leading-relaxed">{r.task}</td>
                    <td className="px-4 py-3 font-bold text-slate-800 text-xs">{r.due}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Penalty Table */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">⚠️ Penalty &amp; Interest for Non-Compliance</h2>
          <p className="text-slate-500 text-sm mb-5">Cost of missing income tax deadlines</p>
          <div className="overflow-x-auto rounded-2xl border border-red-100 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-red-600 text-white">
                  <th className="text-left px-4 py-3 font-bold">Offence</th>
                  <th className="text-left px-4 py-3 font-bold">Penalty / Interest</th>
                  <th className="text-left px-4 py-3 font-bold">Rate</th>
                </tr>
              </thead>
              <tbody>
                {PENALTY.map((r, i) => (
                  <tr key={r.offence} className={i % 2 === 0 ? "bg-white" : "bg-red-50/30"}>
                    <td className="px-4 py-3 text-slate-700 font-medium text-xs leading-relaxed">{r.offence}</td>
                    <td className="px-4 py-3 font-bold text-red-700 text-xs">{r.penalty}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{r.interest}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-center">
            <Link
              href="/tools/penalty-calculator"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition hover:scale-105"
              style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)" }}
            >
              🧮 Calculate Your Exact Penalty →
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">❓ Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "What is the last date to file ITR for FY 2025-26?",
                a: "For individuals and HUF not requiring audit: 31 July 2026. For businesses/professions requiring audit and companies: 31 October 2026. For transfer pricing cases: 30 November 2026. The belated return deadline is 31 December 2026.",
              },
              {
                q: "What happens if I miss advance tax payment?",
                a: "Interest under Section 234B (1% per month or part of month on the outstanding tax) is charged if you pay less than 90% of assessed tax by March 31. Section 234C also charges interest at 1% per month for deferral of each advance tax installment.",
              },
              {
                q: "What is the penalty for not filing ITR?",
                a: "Under Section 234F: ₹1,000 if income is up to ₹5 lakh; ₹5,000 if income exceeds ₹5 lakh. Additionally, interest at 1% per month under Section 234A on unpaid tax. Persons with income below the basic exemption limit are exempt from penalty.",
              },
              {
                q: "Is there any benefit to filing ITR early?",
                a: "Yes — faster refunds, easy loan/visa processing, carry forward of capital loss is allowed only if ITR is filed on time, and reduced scrutiny risk. You also have more time to revise if needed.",
              },
              {
                q: "What is ITR-U (Updated Return)?",
                a: "Under Section 139(8A), taxpayers can file an Updated Return (ITR-U) within 2 years from the end of the relevant assessment year. For AY 2026-27, the deadline is 31 March 2029. However, you must pay additional tax (25%-50% of tax + interest) depending on when you file.",
              },
            ].map(faq => (
              <div key={faq.q} className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <p className="font-bold text-slate-800 mb-2">Q: {faq.q}</p>
                <p className="text-slate-600 text-sm leading-relaxed">A: {faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link href="/check"
            className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white text-base transition hover:scale-105"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
            🔍 Check Your Full Tax Compliance →
          </Link>
          <Link href="/calendar"
            className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-blue-700 border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition">
            📅 View Compliance Calendar
          </Link>
        </div>

        {/* Related */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-8">
          <p className="font-bold text-slate-700 mb-3 text-sm">📌 Related Pages</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "GST Due Dates", href: "/gst-due-dates" },
              { label: "Penalty Calculator", href: "/tools/penalty-calculator" },
              { label: "Compliance Calendar", href: "/calendar" },
              { label: "Check Compliance", href: "/check" },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600 transition">
                {l.label} →
              </Link>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-700">
          <strong>Disclaimer:</strong> The due dates above are based on the Income Tax Act, 1961, and applicable rules as of the date of publication. The CBDT may issue circulars extending or modifying due dates. This page is for general guidance only — always verify with the official Income Tax portal (incometax.gov.in) or consult a qualified Chartered Accountant before filing.
        </div>
      </div>

      <footer className="border-t border-slate-200 py-6 px-4 mt-auto">
        <div className="max-w-5xl mx-auto text-center text-sm text-slate-400">
          © {new Date().getFullYear()} ComplianceSearch.in — Powered by{" "}
          <a href="https://geebharat.com" className="text-amber-600 hover:underline">Gee Bharat</a>
        </div>
      </footer>
    </main>
  );
}
