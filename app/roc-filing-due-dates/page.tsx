import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "ROC Filing Due Dates FY 2025-26 — MCA Annual Compliance Calendar | ComplianceSearch.in",
  description:
    "Complete ROC filing due dates for FY 2025-26. AOC-4, MGT-7, ADT-1, DPT-3, MSME-1, DIR-3 KYC, BEN-2 — all MCA annual return deadlines for Pvt Ltd, OPC, LLP and public companies.",
  keywords:
    "ROC filing due dates 2025-26, AOC-4 due date, MGT-7 due date, ADT-1 due date, DPT-3 due date, DIR-3 KYC due date, MCA annual return, ROC compliance calendar India",
};

/* ─── Data ─────────────────────────────────────────────── */

const ANNUAL_FORMS = [
  {
    form: "ADT-1",
    name: "Auditor Appointment / Re-appointment",
    who: "All companies (other than OPC)",
    due: "15 days from AGM conclusion",
    fy2526: "14 October 2025*",
    penalty: "₹300/day (min ₹30,000)",
    color: "blue",
  },
  {
    form: "AOC-4",
    name: "Filing of Financial Statements",
    who: "All companies (other than OPC, XBRL companies)",
    due: "30 days from AGM",
    fy2526: "29 October 2025*",
    penalty: "₹100/day after due date",
    color: "blue",
  },
  {
    form: "AOC-4 CFS",
    name: "Consolidated Financial Statements",
    who: "Holding companies",
    due: "30 days from AGM",
    fy2526: "29 October 2025*",
    penalty: "₹100/day after due date",
    color: "blue",
  },
  {
    form: "AOC-4 XBRL",
    name: "Financial Statements in XBRL format",
    who: "Listed companies, companies with paid-up capital ≥ ₹5 Cr or T/O ≥ ₹100 Cr",
    due: "60 days from AGM",
    fy2526: "28 November 2025*",
    penalty: "₹100/day after due date",
    color: "blue",
  },
  {
    form: "MGT-7",
    name: "Annual Return (e-form)",
    who: "All companies except OPC and Small Companies",
    due: "60 days from AGM",
    fy2526: "28 November 2025*",
    penalty: "₹100/day (min ₹50,000, max ₹5,00,000) + director liability",
    color: "purple",
  },
  {
    form: "MGT-7A",
    name: "Annual Return — OPC & Small Companies",
    who: "One Person Companies (OPC) & Small Companies",
    due: "60 days from AGM / Board Meeting date",
    fy2526: "28 November 2025*",
    penalty: "₹100/day",
    color: "purple",
  },
  {
    form: "DPT-3",
    name: "Return of Deposits (outstanding loans / deposits)",
    who: "All companies that have accepted deposits or have outstanding loans not treated as deposits",
    due: "30th June every year",
    fy2526: "30 June 2025",
    penalty: "₹5,000 to ₹25,000 + ₹500/day continuing default",
    color: "green",
  },
  {
    form: "DIR-3 KYC",
    name: "Director KYC (Annual)",
    who: "All directors who were allotted DIN on or before 31 March",
    due: "30th September every year",
    fy2526: "30 September 2025",
    penalty: "₹5,000 (DIN deactivated if not filed)",
    color: "orange",
  },
  {
    form: "MSME-1",
    name: "Half-yearly Return — Outstanding MSME Payments",
    who: "Companies having outstanding payments to MSME suppliers for more than 45 days",
    due: "Apr–Sep: 31 Oct | Oct–Mar: 30 Apr",
    fy2526: "31 Oct 2025 (Apr–Sep) | 30 Apr 2026 (Oct–Mar)",
    penalty: "₹25,000 (non-filing)",
    color: "red",
  },
  {
    form: "CRA-4",
    name: "Cost Audit Report filing",
    who: "Companies to which cost audit is applicable (Sec 148)",
    due: "30 days from receipt of Cost Audit Report",
    fy2526: "Typically by 30 September 2025",
    penalty: "₹25,000 to ₹5,00,000",
    color: "slate",
  },
];

const EVENT_FORMS = [
  { form: "INC-20A", name: "Declaration of Commencement of Business", trigger: "New company incorporation", due: "Within 180 days of incorporation", note: "One-time; company cannot start business without this" },
  { form: "ADT-1", name: "First Auditor Appointment", trigger: "Incorporation of new company", due: "Within 30 days by Board; if failed, within 90 days by members (AGM/EGM)", note: "Board appointment or member appointment" },
  { form: "BEN-2", name: "Register of Significant Beneficial Owners (SBO)", trigger: "Receipt of BEN-1 declaration from SBO", due: "Within 30 days of receipt of BEN-1", note: "Applies when any person holds ≥10% shares/voting rights (unlisted) or ≥25% (other)" },
  { form: "MGT-14", name: "Filing of Board/Special Resolutions", trigger: "Passing of certain Board / Members' Resolutions", due: "Within 30 days of passing resolution", note: "Mandatory for resolutions u/s 179(3) and Special Resolutions" },
  { form: "PAS-3", name: "Return of Allotment of Shares", trigger: "Allotment of shares / debentures", due: "Within 30 days of allotment", note: "Required every time new shares are allotted" },
  { form: "SH-7", name: "Alteration of Share Capital", trigger: "Increase / consolidation / sub-division of share capital", due: "Within 30 days of resolution", note: "File with updated MOA/AOA" },
  { form: "CHG-1", name: "Creation / Modification of Charge", trigger: "Creation or modification of mortgage, pledge, hypothecation", due: "Within 30 days of creation (extended to 60 days with additional fee)", note: "Failure = charge not valid against liquidator" },
  { form: "CHG-4", name: "Satisfaction of Charge", trigger: "Repayment of loan / discharge of charge", due: "Within 30 days of satisfaction", note: "Important for clean title — lenders insist on this" },
  { form: "DIR-12", name: "Appointment / Resignation of Director / KMP", trigger: "Any change in directors or KMP", due: "Within 30 days of change", note: "Both appointment and cessation must be filed" },
  { form: "INC-22", name: "Notice of Situation of Registered Office", trigger: "Change of registered office within same city", due: "Within 15 days of Board resolution", note: "Different form for change across city/state" },
  { form: "INC-28", name: "Notice of Order of Court / Tribunal / CLB", trigger: "Order of NCLT / Court affecting company", due: "Within 30 days of receipt of order", note: "" },
  { form: "GNL-2", name: "Submission of Documents to Registrar", trigger: "Various — consent of first directors, etc.", due: "As specified in Act / Rules", note: "" },
];

const BOARD_AGM = [
  { item: "First Board Meeting", rule: "Within 30 days of incorporation", note: "Mandatory — adopt common seal, appoint auditor, etc." },
  { item: "Minimum Board Meetings / Year", rule: "4 meetings — gap ≤ 120 days between consecutive meetings", note: "OPC, small companies: 2 meetings (gap ≤ 90 days between halves)" },
  { item: "AGM (Annual General Meeting)", rule: "Within 6 months from end of financial year — by 30 September", note: "First AGM: within 9 months from end of first FY. OPC: no AGM required" },
  { item: "Notice of AGM", rule: "Minimum 21 clear days before AGM (can be shorter with 95% member consent)", note: "Listed: also publish in newspapers" },
  { item: "Quorum for Board Meeting", rule: "1/3rd of total directors or 2 directors — whichever is higher", note: "Cannot be less than 2" },
  { item: "Quorum for AGM", rule: "5 members personally present (if members ≤ 1,000) — up to 30 members (if > 5,000)", note: "OPC: 1 member" },
  { item: "Directors' Report (Board Report)", rule: "To be adopted at Board Meeting before AGM — laid before members at AGM", note: "Must include extract of annual return, CSR report, audit report remarks, etc." },
];

const STATUTORY_REGISTERS = [
  "Register of Members (MGT-1)",
  "Register of Debenture Holders / Other Security Holders (MGT-2)",
  "Register of Directors & Key Managerial Personnel (MBP-1 / DIR-8)",
  "Register of Contracts / Arrangements (MBP-4) — Related Party Transactions",
  "Register of Significant Beneficial Owners (BEN-3)",
  "Minutes Book — Board Meetings",
  "Minutes Book — General Meetings (AGM / EGM)",
  "Register of Loans, Guarantees, Security & Investments (MBP-2)",
  "Register of Charges (CHG-7)",
  "Register of Share Transfers",
];

const PENALTY = [
  { form: "AOC-4 (Financial Statements)", default: "Company: ₹10,000 + ₹100/day. MD/CFO: ₹10,000 + ₹100/day", max: "No cap mentioned — continues per day" },
  { form: "MGT-7 (Annual Return)", default: "Company: ₹50,000 + ₹100/day. Every defaulting officer: ₹50,000 + ₹100/day", max: "Max ₹5,00,000 each" },
  { form: "DPT-3 (Deposits)", default: "₹5,000 to ₹25,000 + ₹500/day continuing", max: "Continuing daily penalty" },
  { form: "DIR-3 KYC (Director KYC)", default: "₹5,000 for filing after 30 Sep (late fee). DIN deactivated until filed", max: "Company operations impacted" },
  { form: "MSME-1", default: "₹25,000 one time for non-filing", max: "Additionally interest on MSME dues at 3× bank rate" },
  { form: "ADT-1 (Auditor)", default: "Company: ₹1,00,000 + ₹1,000/day. Officer: ₹1,00,000 + ₹500/day", max: "High — auditor-related non-compliance is serious" },
  { form: "MGT-14 (Resolution)", default: "Company: ₹1,00,000 to ₹25,00,000. Officer: ₹25,000 to ₹5,00,000", max: "" },
  { form: "CHG-1 (Charge — beyond 60 days)", default: "Charge not registrable; unregistered charges void against liquidator", max: "Lender loses security — critical" },
  { form: "BEN-2 (Beneficial Owner)", default: "₹10 lakh to ₹50 lakh (company) + ₹1 lakh to ₹10 lakh (officer)", max: "One of the highest MCA penalties" },
  { form: "INC-20A (not filed at all)", default: "₹50,000 + ₹1,000/day. Company cannot commence business", max: "Company operations are illegal without this" },
];

const colorMap: Record<string, string> = {
  blue: "text-blue-700 bg-blue-50",
  purple: "text-purple-700 bg-purple-50",
  green: "text-green-700 bg-green-50",
  orange: "text-orange-700 bg-orange-50",
  red: "text-red-700 bg-red-50",
  slate: "text-slate-700 bg-slate-100",
};

/* ─── Page ─────────────────────────────────────────────── */

export default function ROCFilingDueDatesPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero */}
      <section
        className="py-14 px-4 text-center"
        style={{ background: "linear-gradient(160deg,#f5f3ff 0%,#ede9fe 40%,#fafafa 100%)" }}
      >
        <div
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-1.5 rounded-full mb-5 border"
          style={{ background: "#f5f3ff", borderColor: "#c4b5fd", color: "#6d28d9" }}
        >
          📋 MCA / Companies Act 2013 — FY 2025-26
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
          ROC Filing{" "}
          <span
            style={{
              background: "linear-gradient(90deg,#7c3aed,#6d28d9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Due Dates
          </span>
          <br />
          <span className="text-2xl md:text-3xl text-slate-600 font-bold">FY 2025-26 — All MCA Annual Forms</span>
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
          AOC-4, MGT-7, ADT-1, DPT-3, MSME-1, DIR-3 KYC, BEN-2 and all event-based forms —
          complete ROC compliance calendar for Private Limited, OPC, Public Companies and LLPs.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <Link
            href="/companies-act-compliance"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm transition hover:scale-105"
            style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}
          >
            📖 Companies Act Full Guide →
          </Link>
          <Link
            href="/tools/penalty-calculator"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-purple-700 border-2 border-purple-300 bg-purple-50 text-sm transition hover:bg-purple-100"
          >
            🧮 Calculate MCA Penalty
          </Link>
        </div>
      </section>

      <div className="max-w-5xl mx-auto w-full px-4 py-10 flex-1">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-8 flex-wrap">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>›</span>
          <Link href="/calendar" className="hover:text-blue-600">Compliance Calendar</Link>
          <span>›</span>
          <span className="text-purple-700 font-medium">ROC Filing Due Dates</span>
        </div>

        {/* AGM Cascade Banner */}
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 mb-8">
          <p className="font-extrabold text-purple-800 text-base mb-3">⚡ The AGM Cascade — Everything Flows from Your AGM Date</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-sm font-medium flex-wrap">
            <div className="bg-white rounded-xl border border-purple-200 px-4 py-2 text-purple-700 text-center">
              <p className="text-xs text-slate-400 mb-0.5">FY End</p>
              <p className="font-bold">31 March 2025</p>
            </div>
            <span className="text-purple-400 text-xl hidden sm:block">→</span>
            <div className="bg-white rounded-xl border border-purple-200 px-4 py-2 text-purple-700 text-center">
              <p className="text-xs text-slate-400 mb-0.5">AGM Deadline</p>
              <p className="font-bold">30 Sep 2025</p>
            </div>
            <span className="text-purple-400 text-xl hidden sm:block">→</span>
            <div className="bg-blue-50 rounded-xl border border-blue-200 px-4 py-2 text-blue-700 text-center">
              <p className="text-xs text-slate-400 mb-0.5">ADT-1 (AGM +15d)</p>
              <p className="font-bold">14 Oct 2025</p>
            </div>
            <span className="text-purple-400 text-xl hidden sm:block">→</span>
            <div className="bg-blue-50 rounded-xl border border-blue-200 px-4 py-2 text-blue-700 text-center">
              <p className="text-xs text-slate-400 mb-0.5">AOC-4 (AGM +30d)</p>
              <p className="font-bold">29 Oct 2025</p>
            </div>
            <span className="text-purple-400 text-xl hidden sm:block">→</span>
            <div className="bg-purple-100 rounded-xl border border-purple-300 px-4 py-2 text-purple-800 text-center">
              <p className="text-xs text-slate-400 mb-0.5">MGT-7 (AGM +60d)</p>
              <p className="font-bold">28 Nov 2025</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">* Assuming AGM held on last day — 30 September 2025. Earlier AGM = earlier deadlines.</p>
        </div>

        {/* Important Note */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 text-sm text-amber-800">
          <strong>📌 Note:</strong> Dates below are standard statutory due dates under Companies Act 2013. MCA may
          extend deadlines via General Circulars. Always verify on MCA21 portal (mca.gov.in) before filing.
          Additional Fees (₹100–₹300/day) are levied for late filings. Company-specific dates depend on actual AGM date.
        </div>

        {/* Annual Forms */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">📅 Annual Mandatory ROC Filings — FY 2025-26</h2>
          <p className="text-slate-500 text-sm mb-5">Forms that every company must file every financial year</p>
          <div className="space-y-4">
            {ANNUAL_FORMS.map((f) => (
              <div key={f.form} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`font-extrabold text-sm px-3 py-1 rounded-full ${colorMap[f.color]}`}>{f.form}</span>
                    <p className="font-bold text-slate-800">{f.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">FY 2025-26 Deadline</p>
                    <p className="font-extrabold text-slate-900 text-sm">{f.fy2526}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-slate-400 font-semibold uppercase tracking-wide mb-1">Who Files?</p>
                    <p className="text-slate-600">{f.who}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase tracking-wide mb-1">Standard Due Date</p>
                    <p className="text-slate-700 font-medium">{f.due}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase tracking-wide mb-1">Penalty for Late Filing</p>
                    <p className="text-red-600 font-medium">{f.penalty}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Board Meetings & AGM */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">🏛️ Board Meetings &amp; AGM Requirements</h2>
          <p className="text-slate-500 text-sm mb-5">Mandatory meeting rules under Companies Act 2013</p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="text-left px-4 py-3 font-bold">Requirement</th>
                  <th className="text-left px-4 py-3 font-bold">Rule / Deadline</th>
                  <th className="text-left px-4 py-3 font-bold">Important Note</th>
                </tr>
              </thead>
              <tbody>
                {BOARD_AGM.map((r, i) => (
                  <tr key={r.item} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-4 py-3 font-bold text-slate-800 text-xs">{r.item}</td>
                    <td className="px-4 py-3 font-semibold text-purple-700 text-xs">{r.rule}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Event-Based Forms */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">⚡ Event-Based ROC Filings</h2>
          <p className="text-slate-500 text-sm mb-5">Forms triggered by specific corporate events — must not be delayed</p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-700 text-white">
                  <th className="text-left px-4 py-3 font-bold">Form</th>
                  <th className="text-left px-4 py-3 font-bold">Purpose</th>
                  <th className="text-left px-4 py-3 font-bold">Trigger Event</th>
                  <th className="text-left px-4 py-3 font-bold">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {EVENT_FORMS.map((f, i) => (
                  <tr key={f.form} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-4 py-3 font-extrabold text-purple-700 whitespace-nowrap">{f.form}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 text-xs">{f.name}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{f.trigger}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 text-xs">{f.due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Statutory Registers */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">📚 Statutory Registers Every Company Must Maintain</h2>
          <p className="text-slate-500 text-sm mb-5">Physical or electronic registers — must be kept at registered office</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STATUTORY_REGISTERS.map((r, i) => (
              <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
                <span className="text-purple-500 font-bold mt-0.5 shrink-0">✓</span>
                <p className="text-slate-700 text-sm">{r}</p>
              </div>
            ))}
          </div>
        </section>

        {/* LLP Compliance Note */}
        <section className="mb-12">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h2 className="text-lg font-extrabold text-blue-900 mb-3">🔵 LLP Annual Compliance (LLP Act 2008)</h2>
            <p className="text-blue-700 text-sm mb-4">LLPs file different forms with ROC — not MGT-7 or AOC-4:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { form: "Form 8", name: "Statement of Account & Solvency", due: "30 October every year (for FY ending 31 March)", penalty: "₹100/day" },
                { form: "Form 11", name: "Annual Return of LLP", due: "30 May every year", penalty: "₹100/day" },
                { form: "DIR-3 KYC", name: "Designated Partner KYC", due: "30 September every year", penalty: "₹5,000 (DIN deactivated)" },
                { form: "Income Tax ITR-5", name: "LLP Income Tax Return", due: "31 July (no audit) | 31 Oct (audit)", penalty: "₹1,000–₹5,000 + interest" },
              ].map(f => (
                <div key={f.form} className="bg-white rounded-xl border border-blue-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-extrabold text-blue-700 text-sm px-2 py-0.5 bg-blue-100 rounded-full">{f.form}</span>
                    <p className="font-bold text-slate-800 text-sm">{f.name}</p>
                  </div>
                  <p className="text-xs text-slate-600"><span className="font-semibold">Due:</span> {f.due}</p>
                  <p className="text-xs text-red-500 mt-0.5"><span className="font-semibold">Penalty:</span> {f.penalty}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Penalty Table */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">⚠️ Penalty for ROC Non-Compliance</h2>
          <p className="text-slate-500 text-sm mb-5">Key penalties under Companies Act 2013 — Section 403 / 446B and specific sections</p>
          <div className="overflow-x-auto rounded-2xl border border-red-100 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-red-600 text-white">
                  <th className="text-left px-4 py-3 font-bold">Form / Non-Compliance</th>
                  <th className="text-left px-4 py-3 font-bold">Penalty</th>
                  <th className="text-left px-4 py-3 font-bold">Max / Note</th>
                </tr>
              </thead>
              <tbody>
                {PENALTY.map((r, i) => (
                  <tr key={r.form} className={i % 2 === 0 ? "bg-white" : "bg-red-50/30"}>
                    <td className="px-4 py-3 font-semibold text-slate-800 text-xs">{r.form}</td>
                    <td className="px-4 py-3 text-red-700 font-medium text-xs">{r.default}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{r.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
            <strong>Small Company Benefit (Sec 446B):</strong> For Small Companies and OPCs, penalty is 50% of the normal penalty specified, subject to maximum caps.
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">❓ Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "What is the due date for AOC-4 for FY 2024-25?",
                a: "AOC-4 must be filed within 30 days from the date of AGM. If the AGM is held on 30 September 2025 (last date), AOC-4 is due by 29 October 2025. If AGM is held earlier, the deadline moves up accordingly.",
              },
              {
                q: "What is the difference between MGT-7 and MGT-7A?",
                a: "MGT-7 is the Annual Return form for all companies except OPC and Small Companies. MGT-7A is a simplified Annual Return form applicable only to One Person Companies (OPC) and Small Companies. MGT-7A requires fewer disclosures.",
              },
              {
                q: "What happens if ADT-1 is not filed?",
                a: "Non-filing of ADT-1 attracts a penalty of ₹1,00,000 on the company + ₹1,000/day continuing default, and ₹1,00,000 on the auditor. Additionally, the auditor's appointment is not valid until ADT-1 is filed.",
              },
              {
                q: "Is DPT-3 mandatory if there are no deposits?",
                a: "Yes — DPT-3 is mandatory for all companies (other than Government companies) even if they have no deposits. Companies that have outstanding loans from directors, shareholders, or others (which are exempted from deposit rules) must report them in DPT-3 by 30 June every year.",
              },
              {
                q: "When must MSME-1 be filed?",
                a: "MSME-1 is filed twice a year: (1) for April to September period — due by 31 October, (2) for October to March period — due by 30 April. It applies to companies with outstanding payments to MSME suppliers exceeding 45 days.",
              },
              {
                q: "What is the DIR-3 KYC deadline?",
                a: "DIR-3 KYC must be filed by 30 September every year by all directors who were allotted a DIN on or before 31 March of that year. Filing after 30 September attracts a fee of ₹5,000 and the DIN gets deactivated until filed.",
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
          <Link href="/companies-act-compliance"
            className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white text-base transition hover:scale-105"
            style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
            📖 Read Full Companies Act Guide →
          </Link>
          <Link href="/check"
            className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-purple-700 border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 transition">
            🔍 Check All Your Compliances
          </Link>
        </div>

        {/* Related */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-8">
          <p className="font-bold text-slate-700 mb-3 text-sm">📌 Related Pages</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "GST Due Dates", href: "/gst-due-dates" },
              { label: "Income Tax Due Dates", href: "/income-tax-due-dates" },
              { label: "Penalty Calculator", href: "/tools/penalty-calculator" },
              { label: "Compliance Calendar", href: "/calendar" },
              { label: "Companies Act Guide", href: "/companies-act-compliance" },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-300 text-slate-600 hover:border-purple-400 hover:text-purple-600 transition">
                {l.label} →
              </Link>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-700">
          <strong>Disclaimer:</strong> The due dates and penalties above are based on the Companies Act 2013 and applicable rules as of the date of publication. MCA may issue General Circulars extending or modifying due dates. This page is for general guidance only — always verify with MCA21 portal (mca.gov.in) or consult a qualified Company Secretary or Chartered Accountant before filing.
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
