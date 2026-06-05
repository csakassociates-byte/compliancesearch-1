import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "GST Due Dates FY 2025-26 — Complete Calendar | ComplianceSearch.in",
  description:
    "Complete GST return due dates for FY 2025-26. GSTR-1, GSTR-3B, GSTR-9, GSTR-4, CMP-08, GSTR-5, GSTR-6, GSTR-7, GSTR-8 — monthly, quarterly and annual deadlines.",
  keywords:
    "GST due dates 2025-26, GSTR-1 due date, GSTR-3B due date, GST annual return, GSTR-9 deadline, GST calendar India",
};

const TABLE_HEAD = ["Return", "Who Files?", "Frequency", "Due Date"];

const MONTHLY_RETURNS = [
  {
    name: "GSTR-1",
    who: "Normal taxpayers (T/O > ₹5 Cr or opted out of QRMP)",
    freq: "Monthly",
    due: "11th of next month",
    note: "",
  },
  {
    name: "GSTR-1 (IFF)",
    who: "QRMP taxpayers (T/O ≤ ₹5 Cr) — optional for Months 1 & 2 of quarter",
    freq: "Monthly (optional)",
    due: "13th of next month",
    note: "",
  },
  {
    name: "GSTR-3B",
    who: "Normal taxpayers (T/O > ₹5 Cr)",
    freq: "Monthly",
    due: "20th of next month",
    note: "",
  },
  {
    name: "GSTR-3B (Group A)",
    who: "QRMP — States: Chhattisgarh, MP, Gujarat, Daman & Diu, Dadra & Nagar Haveli, Maharashtra, Karnataka, Goa, Lakshadweep, Kerala, TN, Puducherry, A&N Islands, Telangana, AP",
    freq: "Quarterly",
    due: "22nd of month following quarter",
    note: "",
  },
  {
    name: "GSTR-3B (Group B)",
    who: "QRMP — States: HP, Punjab, Uttarakhand, Haryana, Rajasthan, UP, Bihar, Sikkim, AR, Nagaland, Manipur, Mizoram, Tripura, Meghalaya, Assam, W. Bengal, Jharkhand, Odisha, J&K, Ladakh, Delhi, Chandigarh",
    freq: "Quarterly",
    due: "24th of month following quarter",
    note: "",
  },
  {
    name: "PMT-06",
    who: "QRMP taxpayers — advance tax payment for months 1 & 2",
    freq: "Monthly (Months 1 & 2 of quarter)",
    due: "25th of next month",
    note: "",
  },
];

const QUARTERLY_ANNUAL = [
  {
    name: "GSTR-1 (Quarterly)",
    who: "QRMP taxpayers (T/O ≤ ₹5 Cr)",
    freq: "Quarterly",
    due: "13th of month following quarter-end",
    note: "",
  },
  {
    name: "CMP-08",
    who: "Composition dealers",
    freq: "Quarterly",
    due: "18th of month following quarter-end",
    note: "",
  },
  {
    name: "GSTR-4",
    who: "Composition dealers (Annual)",
    freq: "Annual",
    due: "30th April",
    note: "For FY 2025-26: 30 April 2026",
  },
  {
    name: "GSTR-5",
    who: "Non-Resident taxable persons",
    freq: "Monthly",
    due: "13th of next month (within 7 days of expiry of registration)",
    note: "",
  },
  {
    name: "GSTR-6",
    who: "Input Service Distributors (ISD)",
    freq: "Monthly",
    due: "13th of next month",
    note: "",
  },
  {
    name: "GSTR-7",
    who: "Persons liable to deduct TDS under GST (Govt. bodies)",
    freq: "Monthly",
    due: "10th of next month",
    note: "",
  },
  {
    name: "GSTR-8",
    who: "E-commerce operators liable to collect TCS",
    freq: "Monthly",
    due: "10th of next month",
    note: "",
  },
  {
    name: "GSTR-9",
    who: "Normal/Regular taxpayers (Annual GST Return)",
    freq: "Annual",
    due: "31st December",
    note: "For FY 2025-26: 31 December 2026",
  },
  {
    name: "GSTR-9C",
    who: "Taxpayers with T/O > ₹5 Cr (Self-Certified Reconciliation Statement)",
    freq: "Annual",
    due: "31st December (along with GSTR-9)",
    note: "For FY 2025-26: 31 December 2026",
  },
  {
    name: "GSTR-10",
    who: "Cancelled GST registration holders (Final Return)",
    freq: "One-time",
    due: "Within 3 months of cancellation order",
    note: "",
  },
  {
    name: "GSTR-11",
    who: "Persons with UIN (UN bodies, embassies) claiming refund",
    freq: "Monthly",
    due: "28th of month following the month of purchase",
    note: "",
  },
];

const MONTHLY_CALENDAR = [
  { month: "April 2025",    gstr1: "11 Apr", gstr3b: "20 Apr", qrmp1: "13 Apr",  cmp08: "—",      },
  { month: "May 2025",      gstr1: "11 May", gstr3b: "20 May", qrmp1: "13 May",  cmp08: "—",      },
  { month: "June 2025",     gstr1: "11 Jun", gstr3b: "20 Jun", qrmp1: "13 Jun",  cmp08: "18 Jul", },
  { month: "July 2025",     gstr1: "11 Jul", gstr3b: "20 Jul", qrmp1: "13 Jul",  cmp08: "—",      },
  { month: "August 2025",   gstr1: "11 Aug", gstr3b: "20 Aug", qrmp1: "13 Aug",  cmp08: "—",      },
  { month: "September 2025",gstr1: "11 Sep", gstr3b: "20 Sep", qrmp1: "13 Sep",  cmp08: "18 Oct", },
  { month: "October 2025",  gstr1: "11 Oct", gstr3b: "20 Oct", qrmp1: "13 Oct",  cmp08: "—",      },
  { month: "November 2025", gstr1: "11 Nov", gstr3b: "20 Nov", qrmp1: "13 Nov",  cmp08: "—",      },
  { month: "December 2025", gstr1: "11 Dec", gstr3b: "20 Dec", qrmp1: "13 Dec",  cmp08: "18 Jan", },
  { month: "January 2026",  gstr1: "11 Jan", gstr3b: "20 Jan", qrmp1: "13 Jan",  cmp08: "—",      },
  { month: "February 2026", gstr1: "11 Feb", gstr3b: "20 Feb", qrmp1: "13 Feb",  cmp08: "—",      },
  { month: "March 2026",    gstr1: "11 Mar", gstr3b: "20 Mar", qrmp1: "13 Mar",  cmp08: "18 Apr", },
];

const PENALTY = [
  { offence: "Late filing of GSTR-3B / GSTR-1", penalty: "₹50/day (₹25 CGST + ₹25 SGST)", cap: "₹10,000 per return" },
  { offence: "Late filing — NIL return", penalty: "₹20/day (₹10 CGST + ₹10 SGST)", cap: "₹10,000 per return" },
  { offence: "Late payment of tax (Interest)", penalty: "18% p.a. on outstanding tax", cap: "No upper cap" },
  { offence: "Non-filing of annual GSTR-9", penalty: "₹200/day (₹100 CGST + ₹100 SGST)", cap: "0.25% of T/O in state" },
  { offence: "Wrong ITC claim / short payment (fraud)", penalty: "100% of tax (min ₹10,000)", cap: "—" },
];

export default function GSTDueDatesPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero */}
      <section
        className="py-14 px-4 text-center"
        style={{ background: "linear-gradient(160deg,#f0fdf4 0%,#ecfdf5 50%,#f9fafb 100%)" }}
      >
        <div
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-1.5 rounded-full mb-5 border"
          style={{ background: "#f0fdf4", borderColor: "#86efac", color: "#166534" }}
        >
          📊 Updated for FY 2025-26
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
          GST Return{" "}
          <span
            style={{
              background: "linear-gradient(90deg,#16a34a,#15803d)",
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
          Complete GST filing calendar — GSTR-1, GSTR-3B, GSTR-9, CMP-08, GSTR-4 and all returns for regular,
          QRMP, composition, NR, ISD, TDS &amp; TCS filers.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <Link
            href="/tools/penalty-calculator"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm transition hover:scale-105"
            style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}
          >
            🧮 Calculate GST Penalty →
          </Link>
          <Link
            href="/check"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-green-700 border-2 border-green-300 bg-green-50 text-sm transition hover:bg-green-100"
          >
            ✅ Check GST Applicability
          </Link>
        </div>
      </section>

      <div className="max-w-5xl mx-auto w-full px-4 py-10 flex-1">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-8 flex-wrap">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>›</span>
          <span className="text-green-700 font-medium">GST Due Dates</span>
        </div>

        {/* Quick Note */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 text-sm text-amber-800">
          <strong>📌 Important:</strong> Due dates may be extended by CBIC notifications. Always check the latest
          GST portal (gst.gov.in) or notifications before filing. Dates below are standard statutory dates
          for FY 2025-26.
        </div>

        {/* Monthly Calendar Table */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">📅 Month-wise GST Due Date Calendar</h2>
          <p className="text-slate-500 text-sm mb-5">Quick reference: key returns each month for FY 2025-26</p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-green-700 text-white">
                  <th className="text-left px-4 py-3 font-bold">Month</th>
                  <th className="text-center px-4 py-3 font-bold">GSTR-1<br/><span className="font-normal text-xs opacity-80">(Normal / Monthly)</span></th>
                  <th className="text-center px-4 py-3 font-bold">GSTR-3B<br/><span className="font-normal text-xs opacity-80">(T/O &gt; ₹5 Cr)</span></th>
                  <th className="text-center px-4 py-3 font-bold">GSTR-1<br/><span className="font-normal text-xs opacity-80">(QRMP / Quarter-end)</span></th>
                  <th className="text-center px-4 py-3 font-bold">CMP-08<br/><span className="font-normal text-xs opacity-80">(Composition)</span></th>
                </tr>
              </thead>
              <tbody>
                {MONTHLY_CALENDAR.map((row, i) => (
                  <tr key={row.month} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-4 py-3 font-semibold text-slate-700">{row.month}</td>
                    <td className="px-4 py-3 text-center text-slate-700">{row.gstr1}</td>
                    <td className="px-4 py-3 text-center text-slate-700">{row.gstr3b}</td>
                    <td className="px-4 py-3 text-center">
                      {row.qrmp1 === "—" ? (
                        <span className="text-slate-300">—</span>
                      ) : (
                        <span className="text-slate-700">{row.qrmp1}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.cmp08 === "—" ? (
                        <span className="text-slate-300">—</span>
                      ) : (
                        <span className="font-semibold text-green-700">{row.cmp08}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-2">* QRMP GSTR-1 shown for quarter-end month only. IFF available months 1 &amp; 2 (13th). GSTR-3B for QRMP: 22nd (Group A) / 24th (Group B) after quarter-end.</p>
        </section>

        {/* All Returns */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">📋 All GST Returns — Who Files &amp; When</h2>
          <p className="text-slate-500 text-sm mb-5">Standard due dates for all GST return types</p>

          <h3 className="text-base font-bold text-slate-700 mb-3 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Monthly Returns</h3>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-600">
                  {TABLE_HEAD.map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MONTHLY_RETURNS.map((r, i) => (
                  <tr key={r.name} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-4 py-3 font-bold text-green-700 whitespace-nowrap">{r.name}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs leading-relaxed">{r.who}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{r.freq}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{r.due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-base font-bold text-slate-700 mb-3 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> Quarterly, Annual &amp; Other Returns</h3>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-600">
                  <th className="text-left px-4 py-3 font-semibold">Return</th>
                  <th className="text-left px-4 py-3 font-semibold">Who Files?</th>
                  <th className="text-left px-4 py-3 font-semibold">Frequency</th>
                  <th className="text-left px-4 py-3 font-semibold">Due Date</th>
                  <th className="text-left px-4 py-3 font-semibold">FY 2025-26</th>
                </tr>
              </thead>
              <tbody>
                {QUARTERLY_ANNUAL.map((r, i) => (
                  <tr key={r.name} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-4 py-3 font-bold text-blue-700 whitespace-nowrap">{r.name}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs leading-relaxed">{r.who}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{r.freq}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.due}</td>
                    <td className="px-4 py-3 text-xs text-green-700 font-medium">{r.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Penalty Table */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">⚠️ Penalty for GST Non-Compliance</h2>
          <p className="text-slate-500 text-sm mb-5">Know the cost of missing GST deadlines</p>
          <div className="overflow-x-auto rounded-2xl border border-red-100 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-red-50 text-red-700">
                  <th className="text-left px-4 py-3 font-bold">Offence</th>
                  <th className="text-left px-4 py-3 font-bold">Penalty / Interest</th>
                  <th className="text-left px-4 py-3 font-bold">Cap</th>
                </tr>
              </thead>
              <tbody>
                {PENALTY.map((r, i) => (
                  <tr key={r.offence} className={i % 2 === 0 ? "bg-white" : "bg-red-50/30"}>
                    <td className="px-4 py-3 text-slate-700 font-medium">{r.offence}</td>
                    <td className="px-4 py-3 font-bold text-red-700">{r.penalty}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{r.cap}</td>
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
                q: "What is QRMP Scheme?",
                a: "QRMP (Quarterly Return Monthly Payment) scheme allows taxpayers with aggregate annual turnover up to ₹5 crore to file GSTR-1 and GSTR-3B quarterly. However, they must pay tax every month using Form PMT-06 by the 25th of the following month.",
              },
              {
                q: "What happens if I miss the GSTR-3B deadline?",
                a: "A late fee of ₹50/day (₹25 CGST + ₹25 SGST) is charged, capped at ₹10,000. For nil returns, the fee is ₹20/day. Additionally, interest at 18% p.a. is charged on unpaid tax.",
              },
              {
                q: "Is GSTR-9 mandatory for all taxpayers?",
                a: "GSTR-9 (Annual Return) is mandatory for taxpayers with T/O above ₹2 crore. For T/O up to ₹2 crore, it is optional as per recent notifications. GSTR-9C (reconciliation statement) is required only for taxpayers with T/O above ₹5 crore.",
              },
              {
                q: "What is the due date for GSTR-1 for monthly filers?",
                a: "Monthly GSTR-1 is due by the 11th of the following month. For example, GSTR-1 for July 2025 must be filed by 11th August 2025.",
              },
              {
                q: "Can GST due dates be extended?",
                a: "Yes. The Government / CBIC can and frequently does extend due dates through notifications. Always check the GST portal (gst.gov.in) or official CBIC website for latest notifications.",
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
            🔍 Check Your GST Compliance →
          </Link>
          <Link href="/calendar"
            className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-green-700 border-2 border-green-200 bg-green-50 hover:bg-green-100 transition">
            📅 View Full Compliance Calendar
          </Link>
        </div>

        {/* Related */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-8">
          <p className="font-bold text-slate-700 mb-3 text-sm">📌 Related Pages</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Income Tax Due Dates", href: "/income-tax-due-dates" },
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
          <strong>Disclaimer:</strong> The due dates above are based on standard statutory provisions under the CGST Act, 2017 and applicable rules as on the date of publication. CBIC may issue circulars/notifications extending or modifying due dates. This information is for guidance only — always verify with the official GST portal (gst.gov.in) or a qualified GST practitioner before filing.
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
