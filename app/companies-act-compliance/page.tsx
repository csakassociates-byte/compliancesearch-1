import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Companies Act 2013 — Complete Compliance Guide India | ComplianceSearch.in",
  description:
    "Complete Companies Act 2013 compliance guide for Indian businesses. Incorporation, annual filings, board meetings, AGM, audit, CSR, director KYC, related party transactions — everything explained.",
  keywords:
    "Companies Act 2013 compliance, Companies Act India, ROC compliance, annual filing checklist, board meeting rules, AGM requirements, CSR obligation, director KYC, MCA compliance guide",
};

/* ─── Data ─────────────────────────────────────────────── */

const COMPANY_TYPES = [
  {
    type: "Private Limited (Pvt Ltd)",
    members: "2–200 shareholders",
    directors: "Min 2, Max 15",
    capital: "No minimum paid-up capital",
    audit: "Mandatory (every year)",
    agm: "Yes — by 30 Sep",
    csr: "If threshold crossed",
    color: "#1d4ed8",
    icon: "🏢",
  },
  {
    type: "One Person Company (OPC)",
    members: "1 (nominee required)",
    directors: "Min 1, Max 15",
    capital: "No minimum",
    audit: "Mandatory",
    agm: "Not required (Board meeting)",
    csr: "Not applicable",
    color: "#0891b2",
    icon: "👤",
  },
  {
    type: "Public Limited Company",
    members: "Min 7 (no max)",
    directors: "Min 3, Max 15",
    capital: "No minimum",
    audit: "Mandatory",
    agm: "Yes — by 30 Sep",
    csr: "If threshold crossed",
    color: "#7c3aed",
    icon: "🏛️",
  },
  {
    type: "Small Company",
    members: "Same as Pvt Ltd",
    directors: "Min 2",
    capital: "Paid-up capital ≤ ₹4 Cr AND T/O ≤ ₹40 Cr",
    audit: "Mandatory (reduced penalty benefit)",
    agm: "Yes — by 30 Sep",
    csr: "Not applicable (usually)",
    color: "#16a34a",
    icon: "🏪",
  },
];

const ANNUAL_CHECKLIST = [
  {
    category: "April – June",
    color: "#16a34a",
    items: [
      { task: "DPT-3 filing (Return of Deposits / Outstanding Loans)", due: "30 June", critical: true },
      { task: "Board meeting — Q1 (within 120 days of last meeting)", due: "By June/July", critical: false },
      { task: "Advance Tax — 1st Installment (15%)", due: "15 June", critical: true },
      { task: "MSME-1 for Oct–Mar period (if applicable)", due: "30 April", critical: true },
      { task: "Update statutory registers for FY changes", due: "Ongoing", critical: false },
    ],
  },
  {
    category: "July – September",
    color: "#1d4ed8",
    items: [
      { task: "Finalize Financial Statements with auditor", due: "Before AGM", critical: true },
      { task: "Board meeting to approve Directors' Report + Financial Statements", due: "Before AGM", critical: true },
      { task: "Send AGM notice (min 21 clear days before)", due: "Before AGM", critical: true },
      { task: "Hold AGM — Annual General Meeting", due: "By 30 September", critical: true },
      { task: "ADT-1 — Auditor appointment / re-appointment", due: "Within 15 days of AGM", critical: true },
      { task: "DIR-3 KYC — All directors must file", due: "30 September", critical: true },
      { task: "Advance Tax — 2nd Installment (45% cumulative)", due: "15 September", critical: true },
      { task: "Board meeting — Q2", due: "By September", critical: false },
    ],
  },
  {
    category: "October – December",
    color: "#7c3aed",
    items: [
      { task: "AOC-4 — Financial Statements filing with ROC", due: "Within 30 days of AGM (by ~29 Oct)", critical: true },
      { task: "AOC-4 CFS — Consolidated FS (if applicable)", due: "Within 30 days of AGM", critical: true },
      { task: "MGT-7 / MGT-7A — Annual Return filing", due: "Within 60 days of AGM (by ~28 Nov)", critical: true },
      { task: "MSME-1 for Apr–Sep period (if applicable)", due: "31 October", critical: true },
      { task: "Board meeting — Q3", due: "By December", critical: false },
      { task: "Advance Tax — 3rd Installment (75% cumulative)", due: "15 December", critical: true },
      { task: "CRA-4 — Cost Audit Report (if applicable)", due: "Within 30 days of receiving report", critical: false },
    ],
  },
  {
    category: "January – March",
    color: "#dc2626",
    items: [
      { task: "Board meeting — Q4 (last meeting of year)", due: "By March", critical: false },
      { task: "Advance Tax — 4th Installment (100%)", due: "15 March", critical: true },
      { task: "Appoint auditor for next year (if term expiring)", due: "Before FY end", critical: false },
      { task: "Review / update related party transaction register", due: "Before FY end", critical: false },
      { task: "CSR spend — ensure 2% CSR obligation is met", due: "By 31 March", critical: true },
      { task: "Transfer unspent CSR amount to PM CARES / schedule fund", due: "By 31 March", critical: true },
      { task: "Prepare documents for audit — books of accounts, vouchers, registers", due: "By 31 March", critical: false },
    ],
  },
];

const KEY_SECTIONS = [
  { sec: "Sec 2(68)", title: "Private Company Definition", desc: "Restricts share transfer, prohibits public invitation, max 200 members" },
  { sec: "Sec 7", title: "Incorporation of Company", desc: "Memorandum, Articles, Directors consent, Registered office — all required for CIN" },
  { sec: "Sec 10A", title: "Commencement of Business", desc: "Company cannot commence business or borrow until INC-20A is filed (within 180 days)" },
  { sec: "Sec 12", title: "Registered Office", desc: "Every company must have a registered office within 15 days of incorporation, to which all official communications are sent" },
  { sec: "Sec 73–76A", title: "Acceptance of Deposits", desc: "Strict rules on who can accept deposits, limits, repayment period, TDS — violations attract heavy penalties" },
  { sec: "Sec 96", title: "Annual General Meeting (AGM)", desc: "First AGM: within 9 months of first FY end. Subsequent: within 6 months (by 30 Sep). Maximum gap between two AGMs: 15 months" },
  { sec: "Sec 129", title: "Financial Statements", desc: "Must give true & fair view, prepared as per Schedule III, signed by 2 directors (MD/CEO + CFO)" },
  { sec: "Sec 134", title: "Directors' Report", desc: "Must include extract of Annual Return, audit remarks, CSR report, related party disclosures, risk management policy" },
  { sec: "Sec 135", title: "Corporate Social Responsibility (CSR)", desc: "Net worth ≥ ₹500 Cr OR T/O ≥ ₹1,000 Cr OR net profit ≥ ₹5 Cr → 2% of avg net profit in CSR activities" },
  { sec: "Sec 139", title: "Appointment of Auditors", desc: "First auditor: Board appoints within 30 days. Subsequent: AGM → 5 year term. Rotation mandatory for certain companies" },
  { sec: "Sec 149", title: "Board of Directors", desc: "Pvt Ltd: min 2 directors. Public Ltd: min 3. Listed companies must have Independent Directors, woman director, resident director" },
  { sec: "Sec 166", title: "Duties of Directors", desc: "Act in good faith, not in conflict of interest, not gain undue advantage, not assign directorship — violation = personal liability" },
  { sec: "Sec 177", title: "Audit Committee", desc: "Mandatory for listed companies and others above threshold — review financials, internal audit, related party transactions" },
  { sec: "Sec 185", title: "Loans to Directors", desc: "Company cannot give loans/guarantees to directors or their relatives — violation: heavy penalty on company + director" },
  { sec: "Sec 186", title: "Loans & Investments", desc: "Company can invest/lend up to 60% of paid-up capital + free reserves OR 100% of free reserves — beyond this needs special resolution" },
  { sec: "Sec 188", title: "Related Party Transactions (RPT)", desc: "Transactions with directors, relatives, group companies need Board/Shareholder approval depending on threshold — MGT-14 if resolution passed" },
  { sec: "Sec 197", title: "Managerial Remuneration", desc: "Pvt Ltd: no restriction. Public Ltd / Listed: max 11% of net profits — excess needs Central Govt / shareholder approval" },
  { sec: "Sec 247", title: "Valuation by Registered Valuers", desc: "Compulsory for mergers, ESOPs, unregistered charge property valuation — only Registered Valuers can do this" },
];

const CSR_GUIDE = [
  { threshold: "Net Worth ≥ ₹500 Crore", applies: "Yes — must spend 2% of avg net profits" },
  { threshold: "Turnover ≥ ₹1,000 Crore", applies: "Yes — must spend 2% of avg net profits" },
  { threshold: "Net Profit ≥ ₹5 Crore in any FY", applies: "Yes — must spend 2% of avg net profits" },
  { threshold: "Below all three thresholds", applies: "No CSR obligation — voluntary only" },
];

const DIRECTOR_COMPLIANCE = [
  { compliance: "DIR-3 KYC (Annual)", when: "30 September every year", note: "All directors with DIN — DIN deactivated if missed" },
  { compliance: "MBP-1 (Disclosure of Interest)", when: "First Board meeting of every FY + whenever interest changes", note: "Non-disclosure = vacation of office" },
  { compliance: "DIR-8 (Non-disqualification declaration)", when: "At time of appointment + first Board meeting of every FY", note: "Written declaration to company" },
  { compliance: "Form 16 / 26Q (TDS on salary / professional fees)", when: "Quarterly TDS returns", note: "If director draws salary/remuneration" },
  { compliance: "Independent Director — Declaration of Independence", when: "First Board meeting of FY + whenever status changes", note: "Required under Sec 149(7)" },
  { compliance: "DIR-11 (Notice of Resignation)", when: "Within 30 days of resignation", note: "Director files directly with MCA + company files DIR-12" },
  { compliance: "DIR-12 (Change in Directors)", when: "Within 30 days of appointment/change/cessation", note: "Company files on behalf of the change" },
];

const AUDIT_TYPES = [
  {
    type: "Statutory Audit",
    by: "Chartered Accountant (CA)",
    mandatory: "All companies — every year",
    output: "Auditor's Report (CARO 2020 for eligible companies)",
    section: "Sec 139–147",
  },
  {
    type: "Cost Audit",
    by: "Cost Accountant (CMA)",
    mandatory: "Companies in specified industries (pharma, cement, power, steel, etc.) with turnover > threshold",
    output: "Cost Audit Report — CRA-3; filed in CRA-4",
    section: "Sec 148",
  },
  {
    type: "Secretarial Audit",
    by: "Company Secretary (CS)",
    mandatory: "Every listed company + unlisted public company with paid-up capital ≥ ₹50 Cr or T/O ≥ ₹250 Cr",
    output: "Secretarial Audit Report — MR-3 (annexed to Directors' Report)",
    section: "Sec 204",
  },
  {
    type: "Internal Audit",
    by: "CA / CMA (internal or external)",
    mandatory: "Listed companies + unlisted public companies above threshold",
    output: "Internal Audit Report — reviewed by Audit Committee",
    section: "Sec 138",
  },
];

const PENALTIES_OVERVIEW = [
  { offence: "Non-filing of AOC-4", company: "₹10,000 + ₹100/day", officer: "₹10,000 + ₹100/day", section: "Sec 137" },
  { offence: "Non-filing of MGT-7", company: "₹50,000 + ₹100/day (max ₹5L)", officer: "₹50,000 + ₹100/day (max ₹5L)", section: "Sec 92" },
  { offence: "Failure to hold AGM", company: "₹1,00,000 + ₹5,000/day", officer: "₹1,00,000", section: "Sec 99" },
  { offence: "Loan to directors (Sec 185 violation)", company: "₹5L–₹25L", officer: "₹5L–₹25L + 6 months imprisonment", section: "Sec 185" },
  { offence: "CSR non-spending", company: "2× unspent amount or ₹1 Cr (whichever less)", officer: "₹50,000 to ₹5,00,000", section: "Sec 135(7)" },
  { offence: "Not maintaining statutory registers", company: "₹1L–₹10L", officer: "₹25,000–₹1L", section: "Sec 88" },
  { offence: "Related party transaction without approval", company: "₹25L to ₹5 Cr", officer: "₹25L to ₹5 Cr", section: "Sec 188" },
  { offence: "Accepting deposits in violation", company: "Amount of deposits + 15% interest + ₹1 Cr", officer: "₹25L to ₹2 Cr + imprisonment", section: "Sec 73/76" },
];

/* ─── Page ─────────────────────────────────────────────── */

export default function CompaniesActCompliancePage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero */}
      <section
        className="py-14 px-4 text-center"
        style={{ background: "linear-gradient(160deg,#eff6ff 0%,#e0f2fe 40%,#fafafa 100%)" }}
      >
        <div
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-1.5 rounded-full mb-5 border"
          style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1e40af" }}
        >
          🏛️ Companies Act 2013 — Complete Compliance Guide
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
          Companies Act 2013
          <br />
          <span
            style={{
              background: "linear-gradient(90deg,#1d4ed8,#7c3aed)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Compliance Guide
          </span>
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
          Everything a Private Limited, OPC, or Public Company needs to know — incorporation, annual filings,
          board meetings, AGM, audit, CSR, director duties, related party transactions and penalties.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <Link
            href="/roc-filing-due-dates"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm transition hover:scale-105"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}
          >
            📅 ROC Due Dates Calendar →
          </Link>
          <Link
            href="/check"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-blue-700 border-2 border-blue-300 bg-blue-50 text-sm transition hover:bg-blue-100"
          >
            ✅ Check My Compliance
          </Link>
        </div>
      </section>

      <div className="max-w-5xl mx-auto w-full px-4 py-10 flex-1">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-8 flex-wrap">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>›</span>
          <Link href="/check" className="hover:text-blue-600">Compliance</Link>
          <span>›</span>
          <span className="text-blue-700 font-medium">Companies Act 2013 Guide</span>
        </div>

        {/* Overview */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-4">📖 What is the Companies Act 2013?</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-slate-700 leading-relaxed">
            <p className="mb-3">
              The <strong>Companies Act 2013</strong> is the primary legislation governing the formation, regulation,
              and dissolution of companies in India. It replaced the Companies Act 1956 and is administered by the
              <strong> Ministry of Corporate Affairs (MCA)</strong> through the Registrar of Companies (ROC).
            </p>
            <p className="mb-3">
              The Act has <strong>470 Sections, 7 Schedules</strong> and is supported by 29+ sets of Rules. It covers
              every aspect of a company's life — from incorporation to winding up — and introduces several key
              concepts like One Person Company (OPC), Small Company, dormant company, independent directors,
              class action suits, and mandatory CSR.
            </p>
            <p className="text-sm text-blue-700 font-medium">
              👉 Every Private Limited, Public Limited, OPC, Section 8 (NGO), and Nidhi Company registered in India
              must comply with this Act.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
            {[
              { n: "470", label: "Sections" },
              { n: "7", label: "Schedules" },
              { n: "29+", label: "Rules Sets" },
              { n: "2013", label: "Year Enacted" },
            ].map(s => (
              <div key={s.label} className="text-center bg-white border border-blue-200 rounded-2xl p-4">
                <p className="text-3xl font-extrabold text-blue-700 mb-1">{s.n}</p>
                <p className="text-slate-500 text-xs font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Company Types */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">🏢 Types of Companies &amp; Their Compliance Load</h2>
          <p className="text-slate-500 text-sm mb-5">Choose your company type to understand applicable compliances</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COMPANY_TYPES.map(c => (
              <div key={c.type} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{c.icon}</span>
                  <h3 className="font-extrabold text-slate-900 text-base">{c.type}</h3>
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    { label: "Members", val: c.members },
                    { label: "Directors", val: c.directors },
                    { label: "Capital", val: c.capital },
                    { label: "Statutory Audit", val: c.audit },
                    { label: "AGM Required", val: c.agm },
                    { label: "CSR", val: c.csr },
                  ].map(row => (
                    <div key={row.label} className="flex items-start gap-2">
                      <span className="font-semibold text-slate-400 w-28 shrink-0">{row.label}:</span>
                      <span className="text-slate-700">{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Annual Compliance Checklist */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">📋 Annual Compliance Checklist — Month by Month</h2>
          <p className="text-slate-500 text-sm mb-5">What needs to be done and when throughout the financial year</p>
          <div className="space-y-6">
            {ANNUAL_CHECKLIST.map(quarter => (
              <div key={quarter.category} className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 font-extrabold text-white text-sm" style={{ background: quarter.color }}>
                  📆 {quarter.category}
                </div>
                <div className="divide-y divide-slate-100">
                  {quarter.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 px-5 py-3 bg-white hover:bg-slate-50 transition">
                      <span className={`shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold ${item.critical ? "bg-red-500" : "bg-slate-300"}`}>
                        {item.critical ? "!" : "✓"}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-slate-800 font-medium">{item.task}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-500 shrink-0 mt-0.5">{item.due}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">🔴 Red dot = critical / penalty-attracting. ✓ = important but more flexible timing.</p>
        </section>

        {/* Types of Audit */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">🔍 Types of Audits Under Companies Act</h2>
          <p className="text-slate-500 text-sm mb-5">Different audits required for different types/sizes of companies</p>
          <div className="space-y-4">
            {AUDIT_TYPES.map(a => (
              <div key={a.type} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h3 className="font-extrabold text-slate-900">{a.type}</h3>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-medium">{a.section}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-slate-400 font-semibold uppercase tracking-wide mb-1">Conducted by</p>
                    <p className="text-slate-700 font-medium">{a.by}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase tracking-wide mb-1">Mandatory For</p>
                    <p className="text-slate-600">{a.mandatory}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase tracking-wide mb-1">Output</p>
                    <p className="text-slate-600">{a.output}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CSR */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">🌱 CSR — Corporate Social Responsibility (Sec 135)</h2>
          <p className="text-slate-500 text-sm mb-5">When does the 2% CSR obligation kick in?</p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-green-700 text-white">
                  <th className="text-left px-4 py-3 font-bold">Threshold (any one triggers CSR)</th>
                  <th className="text-left px-4 py-3 font-bold">CSR Applicable?</th>
                </tr>
              </thead>
              <tbody>
                {CSR_GUIDE.map((r, i) => (
                  <tr key={r.threshold} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.threshold}</td>
                    <td className={`px-4 py-3 font-bold ${r.applies.startsWith("Yes") ? "text-green-700" : "text-slate-400"}`}>
                      {r.applies}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-800">
              <p className="font-bold mb-2">✅ What counts as CSR spend?</p>
              <ul className="space-y-1 text-xs">
                {["Education & skill development", "Healthcare & sanitation", "Environment sustainability", "Gender equality & women empowerment", "Rural development projects", "PM CARES Fund (Schedule VII activities)", "Protection of national heritage & art"].map(i => (
                  <li key={i} className="flex items-start gap-2"><span>•</span><span>{i}</span></li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-800">
              <p className="font-bold mb-2">❌ What does NOT count as CSR?</p>
              <ul className="space-y-1 text-xs">
                {["Activities benefitting only employees/families", "Contributions to political parties", "Sponsorships for business advantage", "Activities outside India", "One-off events not linked to CSR policy", "Activities already mandated by law"].map(i => (
                  <li key={i} className="flex items-start gap-2"><span>•</span><span>{i}</span></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700">
            <strong>Unspent CSR:</strong> If CSR amount is unspent and no ongoing project — transfer to PM National Relief Fund or schedule-VII fund by 31 March. If ongoing project — transfer to a separate Unspent CSR Account within 30 days of FY end, spend within 3 years. <strong>Penalty for non-compliance: 2× unspent amount or ₹1 Cr (whichever is less) on company + ₹50K–₹5L on officer.</strong>
          </div>
        </section>

        {/* Director Compliance */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">👤 Director Compliance Requirements</h2>
          <p className="text-slate-500 text-sm mb-5">Filings and declarations that individual directors must make — non-compliance is personal liability</p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="text-left px-4 py-3 font-bold">Compliance</th>
                  <th className="text-left px-4 py-3 font-bold">When</th>
                  <th className="text-left px-4 py-3 font-bold">Important Note</th>
                </tr>
              </thead>
              <tbody>
                {DIRECTOR_COMPLIANCE.map((r, i) => (
                  <tr key={r.compliance} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-4 py-3 font-bold text-slate-800 text-xs">{r.compliance}</td>
                    <td className="px-4 py-3 text-blue-700 font-semibold text-xs">{r.when}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Key Sections */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">📑 Key Sections — Quick Reference</h2>
          <p className="text-slate-500 text-sm mb-5">Most important sections every business owner and CA/CS should know</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {KEY_SECTIONS.map(s => (
              <div key={s.sec} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg shrink-0 mt-0.5">{s.sec}</span>
                  <div>
                    <p className="font-bold text-slate-800 text-sm mb-1">{s.title}</p>
                    <p className="text-slate-500 text-xs leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Penalties */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">⚠️ Key Penalties Under Companies Act 2013</h2>
          <p className="text-slate-500 text-sm mb-5">Non-compliance is expensive — both company and individual officers are liable</p>
          <div className="overflow-x-auto rounded-2xl border border-red-100 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-red-700 text-white">
                  <th className="text-left px-4 py-3 font-bold">Non-Compliance</th>
                  <th className="text-left px-4 py-3 font-bold">Company Penalty</th>
                  <th className="text-left px-4 py-3 font-bold">Officer Penalty</th>
                  <th className="text-left px-4 py-3 font-bold">Section</th>
                </tr>
              </thead>
              <tbody>
                {PENALTIES_OVERVIEW.map((r, i) => (
                  <tr key={r.offence} className={i % 2 === 0 ? "bg-white" : "bg-red-50/30"}>
                    <td className="px-4 py-3 font-medium text-slate-800 text-xs">{r.offence}</td>
                    <td className="px-4 py-3 text-red-700 font-bold text-xs">{r.company}</td>
                    <td className="px-4 py-3 text-red-700 text-xs">{r.officer}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 font-medium">{r.section}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
            <strong>Small Company / OPC Benefit (Sec 446B):</strong> Penalty reduced to 50% of normal penalty, subject to maximum limits — significant relief for small businesses.
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">❓ Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "Is a Private Limited company required to have a statutory audit even if there are no transactions?",
                a: "Yes — statutory audit under the Companies Act 2013 is mandatory for ALL registered companies every financial year, regardless of whether there were any transactions or revenue. Even a dormant company must get its accounts audited.",
              },
              {
                q: "What is the penalty if a company doesn't hold its AGM on time?",
                a: "Under Section 99, the company and every officer in default is liable for a penalty of ₹1,00,000. Additionally, a continuing default attracts ₹5,000 per day. The Tribunal can also call the AGM on an application by any member.",
              },
              {
                q: "Can a director attend a board meeting via video conference?",
                a: "Yes — directors can attend board meetings through video conferencing or other audio-visual means as per the Companies (Meetings of Board and its Powers) Rules 2014. However, certain matters like approval of annual financial statements, Related Party Transactions above threshold, and amalgamation matters must be discussed in person (cannot be through video conference for these specific items).",
              },
              {
                q: "Our company's net profit is ₹6 Crore. How much CSR do we need to spend?",
                a: "CSR obligation = 2% of average net profits of the preceding 3 financial years. If your company's average net profit over 3 years is ₹6 Crore, CSR spend = 2% × ₹6 Cr = ₹12 Lakhs. The amount must be spent on activities listed in Schedule VII of the Companies Act.",
              },
              {
                q: "What is a 'Small Company' under Companies Act?",
                a: "A company is classified as a 'Small Company' if its paid-up share capital does not exceed ₹4 Crore AND its turnover does not exceed ₹40 Crore. Small Companies enjoy reduced compliance burden: simplified Annual Return (MGT-7A), reduced penalties (50%), and no requirement for internal audit/secretarial audit.",
              },
              {
                q: "Can a director be held personally liable for company's non-compliance?",
                a: "Yes — the Companies Act makes 'every officer in default' personally liable for penalties. Officers in default include: MD, Whole-time Director, Manager, Company Secretary, CFO, and any director who knowingly authorized or permitted the default. In serious cases (fraud, Sec 447), criminal prosecution and imprisonment are also possible.",
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link href="/roc-filing-due-dates"
            className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white text-sm transition hover:scale-105"
            style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
            📅 ROC Due Dates →
          </Link>
          <Link href="/check"
            className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white text-sm transition hover:scale-105"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
            🔍 Check My Compliance →
          </Link>
          <Link href="/tools/penalty-calculator"
            className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-red-700 border-2 border-red-200 bg-red-50 hover:bg-red-100 transition text-sm">
            🧮 Penalty Calculator
          </Link>
        </div>

        {/* Related */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-8">
          <p className="font-bold text-slate-700 mb-3 text-sm">📌 Related Pages</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "ROC Filing Due Dates", href: "/roc-filing-due-dates" },
              { label: "GST Due Dates", href: "/gst-due-dates" },
              { label: "Income Tax Due Dates", href: "/income-tax-due-dates" },
              { label: "Penalty Calculator", href: "/tools/penalty-calculator" },
              { label: "Compliance Calendar", href: "/calendar" },
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
          <strong>Disclaimer:</strong> This guide is based on the Companies Act 2013 and rules as of the date of publication. Parliament may amend the Act and MCA may issue circulars modifying provisions and deadlines. This is for general awareness only — consult a qualified Company Secretary (CS) or Chartered Accountant (CA) for specific compliance advice.
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
