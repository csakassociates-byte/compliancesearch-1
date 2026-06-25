import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "About ComplianceSearch.in — All Tools, Features & What We Do",
  description:
    "ComplianceSearch.in is India's free compliance platform for CAs, CSs and businesses. Annual filing attachments (AOC-4/MGT-7), compliance checker, business valuation, meeting minutes, board resolutions, share certificates, due dates and more — all free.",
  keywords: [
    // Brand
    "ComplianceSearch.in about",
    "ComplianceSearch India tools",
    "free compliance platform India",
    "compliance tools for CA CS India",
    // Annual Filing
    "AOC-4 MGT-7 attachment generator India",
    "annual filing tool FY 2025-26",
    "board report generator Companies Act",
    "annual return private limited company",
    "MGT-7A small company annual return",
    // Compliance Check
    "business compliance checker India free",
    "know your compliance India",
    "statutory compliance checklist India",
    "compliance requirements private limited",
    // Valuation
    "business valuation tool India free",
    "company valuation DCF NAV India",
    "Rule 11UA valuation calculator",
    // Minutes
    "AGM minutes generator free India",
    "board meeting minutes SS-1 SS-2",
    "meeting minutes Companies Act 2013",
    // Resolution
    "board resolution generator India",
    "bank account opening resolution",
    "director appointment resolution format",
    // Due Dates
    "GST due dates 2025-26 India",
    "ROC filing due dates FY 2025-26",
    "income tax due dates 2025-26",
    // Share docs
    "share certificate generator SH-1 India",
    "share transfer deed SH-4 India",
    // Penalty
    "MCA penalty calculator India",
    "ROC late filing fee calculator",
  ],
  alternates: { canonical: "https://compliancesearch.in/about" },
  openGraph: {
    title: "About ComplianceSearch.in — All Free Compliance Tools for India",
    description:
      "Annual Filing, Compliance Checker, Business Valuation, Minutes, Resolutions, Due Dates — all free tools for CAs, CSs and companies.",
    url: "https://compliancesearch.in/about",
    type: "website",
  },
};

const tools = [
  {
    id: "annual-filing",
    icon: "📊",
    badge: "Most Popular · FY 2025-26",
    badgeColor: "#059669",
    title: "Annual Filing Attachments Generator",
    subtitle: "AOC-4 & MGT-7 / MGT-7A",
    href: "/tools/documents/annual-filing",
    learnHref: "/aoc-4-mgt-7-annual-filing-attachments",
    color: "border-emerald-200 bg-emerald-50",
    headerBg: "linear-gradient(135deg,#059669,#047857)",
    features: [
      "Generate all 9+ attachments in 2 minutes per company",
      "Board Report (Director's Report) — Section 134 compliant",
      "Auditor's Report with CARO 2020 compliance",
      "Notes on Accounts — accounting policies, contingent liabilities",
      "Cash Flow Statement (mandatory for Section 8 & FPC companies)",
      "AOC-1 — subsidiary/associate company statement",
      "AOC-2 — related party transaction disclosure",
      "MGT-7 (full annual return) for non-small companies",
      "MGT-7A (abridged) for Small Companies and OPCs",
      "Director List with DIN and designation",
      "Auto-detects company type — routes MGT-7 vs MGT-7A automatically",
      "Save drafts per company, per financial year",
      "Team collaboration — share drafts with colleagues",
    ],
    keywords: [
      "AOC-4 attachment generator", "MGT-7 FY 2025-26", "MGT-7A small company",
      "board report format 2025-26", "audit report CARO 2020", "notes on accounts format",
      "annual filing tool for CA", "ROC filing attachments free", "director report generator",
      "annual return private limited 2025-26",
    ],
    description: "Generating annual filing attachments manually for each company takes 1–2 hours of repetitive drafting. ComplianceSearch.in eliminates this — you fill in company and financial details once, and all 9+ attachments are generated simultaneously in filing-ready format. Used by CAs and CSs across India to handle their entire client list during ROC filing season.",
  },
  {
    id: "compliance-check",
    icon: "✅",
    badge: "77+ Rules · 11 Categories",
    badgeColor: "#1d4ed8",
    title: "Know Your Business Compliance",
    subtitle: "Statutory Compliance Checker",
    href: "/check",
    learnHref: "/compliance-checker-india",
    color: "border-blue-200 bg-blue-50",
    headerBg: "linear-gradient(135deg,#1d4ed8,#1e40af)",
    features: [
      "Answer 5 questions — get your complete compliance list",
      "GST registration threshold check (₹20L services / ₹40L goods)",
      "Income Tax — ITR type, audit applicability (Section 44AB)",
      "MCA/ROC — AOC-4, MGT-7/7A, board meetings, AGM, DIR-3 KYC",
      "PF (EPF) applicability — 20+ employees threshold",
      "ESIC applicability — 10+ employees in notified areas",
      "FSSAI — food licence type (Basic/State/Central) by turnover",
      "Factories Act — registration requirements",
      "Shops & Establishments Act — state-wise",
      "Labour laws — Minimum Wages, Gratuity, POSH, Bonus Act",
      "MSME/Udyam registration eligibility",
      "FEMA / FDI compliance for foreign-invested companies",
      "CSR applicability — Section 135 threshold check",
      "DPDP Act (Digital Personal Data Protection) applicability",
      "Environmental compliance — PCB consent categories",
      "Advanced mode — Transfer Pricing, SEBI, NBFC, RERA",
    ],
    keywords: [
      "business compliance check India free", "GST registration requirement check",
      "PF ESIC applicability check", "FSSAI licence type checker",
      "Factories Act applicability", "CSR applicability Section 135",
      "annual compliance checklist Pvt Ltd", "labour law compliance India",
      "compliance for startup India", "statutory compliance 2025-26",
    ],
    description: "Instead of going through 20 different acts to understand what applies to your business, answer 5 questions on ComplianceSearch.in and get a personalised, categorised list of every compliance requirement — from GST and PF to FSSAI and DPDP Act. Used by CAs to quickly audit new clients, and by founders to understand their legal obligations from day one.",
  },
  {
    id: "valuation",
    icon: "📈",
    badge: "6 Methods · Rule 11UA",
    badgeColor: "#0369a1",
    title: "Business Valuation Calculator",
    subtitle: "DCF · NAV · EBITDA · Revenue · P/E · Berkus",
    href: "/tools/business-valuation",
    learnHref: "/business-valuation-india",
    color: "border-sky-200 bg-sky-50",
    headerBg: "linear-gradient(135deg,#0369a1,#0c4a6e)",
    features: [
      "DCF (Discounted Cash Flow) — FEMA/FDI compliant valuation",
      "NAV — Net Asset Value method (Rule 11UA Income Tax)",
      "EBITDA multiple method with BSE sector benchmarks",
      "Revenue multiple for early-stage and SaaS companies",
      "P/E ratio method using listed comparable companies",
      "Berkus method for pre-revenue startups",
      "India-specific WACC calculator with risk-free rate",
      "BSE industry multiples for 46+ sectors",
      "Rule 11UA formula automation — avoids Section 56(2)(x) tax",
      "FMV calculation for share transfer income tax purposes",
      "Pre-money / post-money valuation for fundraising",
      "Downloadable valuation summary report",
    ],
    keywords: [
      "business valuation India free", "DCF valuation India", "Rule 11UA valuation calculator",
      "FEMA valuation India", "share transfer fair value India", "company valuation Pvt Ltd",
      "startup valuation India free", "EBITDA multiple India", "unlisted company valuation",
      "business valuation for M&A India", "valuation for FDI India",
    ],
    description: "Whether you need a FEMA-compliant DCF valuation for an FDI transaction, a Rule 11UA NAV calculation for share transfer income tax purposes, or an EBITDA multiple for M&A negotiations — this tool runs all 6 methods simultaneously. India-specific industry multiples and WACC benchmarks are built in. Used by CAs for share transfer advisory, founders for fundraising, and legal teams for M&A.",
  },
  {
    id: "agm-minutes",
    icon: "🏛️",
    badge: "SS-2 Compliant",
    badgeColor: "#7c3aed",
    title: "AGM Minutes Generator",
    subtitle: "Annual General Meeting",
    href: "/tools/documents/minutes/agm",
    color: "border-purple-200 bg-purple-50",
    headerBg: "linear-gradient(135deg,#7c3aed,#6d28d9)",
    features: [
      "Compliant with Secretarial Standard SS-2 (ICSI)",
      "Full attendance roll — members, proxies, authorised representatives",
      "Quorum verification as per Articles of Association",
      "Agenda items — adoption of accounts, dividend declaration, director retirement/reappointment, auditor reappointment",
      "Ordinary and special resolutions with proper wording",
      "Voting results — show of hands or poll",
      "Chairman's declaration on results",
      "Leave of absence recording",
      "Minutes signed by Chairman with date",
      "Save and resume draft at any time",
      "Supports Pvt Ltd, OPC, Section 8, and public companies",
    ],
    keywords: [
      "AGM minutes generator free India", "annual general meeting minutes format",
      "SS-2 compliant AGM minutes", "AGM minutes Companies Act 2013",
      "AGM minutes template private limited", "dividend declaration resolution format",
      "auditor reappointment AGM minutes", "AGM notice format private limited",
    ],
    description: "Under Section 118 of Companies Act 2013 and Secretarial Standard SS-2, all companies must maintain minutes of every General Meeting. The minutes must be prepared within 30 days and signed by the Chairman. ComplianceSearch.in generates fully SS-2 compliant AGM minutes — covering attendance, quorum, all standard agenda items, and resolutions.",
  },
  {
    id: "board-minutes",
    icon: "📋",
    badge: "SS-1 Compliant · CTC",
    badgeColor: "#2563eb",
    title: "Board Meeting Minutes Generator",
    subtitle: "Board Minutes + Certified True Copy",
    href: "/tools/documents/minutes/board",
    color: "border-blue-200 bg-blue-50",
    headerBg: "linear-gradient(135deg,#2563eb,#1d4ed8)",
    features: [
      "Compliant with Secretarial Standard SS-1 (ICSI)",
      "Directors attendance, leave of absence, quorum",
      "Video conferencing / physical / circular meeting types",
      "Agenda items — financial statements, loans, investments, RPT",
      "Resolutions passed — ordinary and special",
      "Notes on dissenting opinions (if any)",
      "Certified True Copy (CTC) format accepted by banks and ROC",
      "Multiple directors and company secretary signature blocks",
      "Supports Section 175 — circular resolution format",
      "Meeting notice period compliance tracking",
    ],
    keywords: [
      "board meeting minutes generator India free", "board minutes SS-1 compliant",
      "certified true copy board minutes", "board meeting minutes format 2025-26",
      "board minutes private limited company", "CTC board resolution format",
      "board meeting minutes template India", "SS-1 secretarial standard minutes",
    ],
    description: "Board meeting minutes under SS-1 must record every decision of the Board — from approving financial statements to authorising transactions. The Certified True Copy (CTC) generated by this tool is accepted by banks, ROC, and regulatory authorities. CAs and CSs use it to quickly prepare post-meeting documentation.",
  },
  {
    id: "board-resolution",
    icon: "⚖️",
    badge: "10+ Resolution Types",
    badgeColor: "#475569",
    title: "Board Resolution Generator",
    subtitle: "All Resolution Types · Companies Act 2013",
    href: "/tools/documents/board-resolution",
    learnHref: "/board-resolution-generator",
    color: "border-slate-200 bg-slate-50",
    headerBg: "linear-gradient(135deg,#334155,#1e293b)",
    features: [
      "Bank account opening resolution (single/joint authority)",
      "Director appointment resolution — Section 161",
      "Director resignation acceptance",
      "Loan and borrowing approval — Section 180(1)(c)",
      "Share allotment resolution — Section 62",
      "Auditor appointment resolution — Section 139",
      "Authorised signatory designation",
      "Registered office change — Section 12",
      "GST/PAN/trade licence application authority",
      "Related party transaction approval — Section 188",
      "Certified True Copy (CTC) certification block",
      "Company seal and director signature space",
    ],
    keywords: [
      "board resolution generator India free", "resolution for bank account opening",
      "director appointment resolution format", "board resolution Companies Act 2013",
      "loan approval board resolution", "share allotment resolution format",
      "board resolution template private limited", "authorised signatory resolution bank",
      "board resolution for GST registration", "certified true copy resolution",
    ],
    description: "Every major business action — opening a bank account, appointing a director, borrowing funds, allotting shares — requires a formal Board Resolution under Companies Act 2013. This generator creates professionally formatted, CTC-ready resolutions for all common types. Banks, ROC, GSTN, and regulatory authorities accept this format.",
  },
  {
    id: "bank-resolution",
    icon: "🏦",
    badge: "All Banks Accepted",
    badgeColor: "#0d9488",
    title: "Bank Account Opening Resolution",
    subtitle: "Dedicated Current Account Resolution",
    href: "/tools/documents/bank-resolution",
    color: "border-teal-200 bg-teal-50",
    headerBg: "linear-gradient(135deg,#0d9488,#0f766e)",
    features: [
      "Dedicated resolution specifically for bank account opening",
      "Specify bank name, branch, account type",
      "Single or joint authorised signatory mode",
      "Up to 4 authorised signatories with designation",
      "Signing authority scope — NEFT, RTGS, cheques, deposits",
      "Accepted by SBI, HDFC, ICICI, Axis, Kotak and all major banks",
      "Company seal, chairman and director signature blocks",
      "Meeting date, venue, quorum details",
    ],
    keywords: [
      "bank account opening resolution company India", "board resolution for current account",
      "authorised signatory resolution bank India", "resolution for bank account private limited",
      "company bank account opening board resolution", "SBI HDFC bank resolution format",
      "joint signatory bank account resolution", "certified true copy bank resolution",
    ],
    description: "All banks in India require a Board Resolution before opening a company current account. This tool generates a dedicated, bank-compliant resolution specifying the authorised signatories and their signing authority. The format is accepted by all scheduled banks in India including SBI, HDFC, ICICI, Axis, and Kotak.",
  },
  {
    id: "share-certificate",
    icon: "📜",
    badge: "Form SH-1 · Section 46",
    badgeColor: "#d97706",
    title: "Share Certificate Generator",
    subtitle: "Form SH-1 — Companies Act 2013",
    href: "/tools/documents/share-certificate",
    color: "border-amber-200 bg-amber-50",
    headerBg: "linear-gradient(135deg,#d97706,#b45309)",
    features: [
      "Form SH-1 prescribed format — Rule 5(2) Companies Rules 2014",
      "Folio number, distinctive share numbers (from–to)",
      "Face value and consideration paid",
      "Multiple class shares — equity, preference",
      "Shareholder name, address, and PAN",
      "Company seal, two director signatures, CS signature",
      "Date of issue and board resolution reference",
      "Must issue within 2 months of allotment (Section 56)",
    ],
    keywords: [
      "share certificate generator India free", "Form SH-1 share certificate",
      "share certificate private limited company India", "SH-1 format generator",
      "share certificate Companies Act 2013", "equity share certificate format India",
      "distinctive number share certificate", "share certificate after incorporation",
    ],
    description: "Every allottee of shares must receive a share certificate in Form SH-1 within 2 months under Section 56(4) of Companies Act 2013. This generator creates print-ready SH-1 certificates with all required fields — folio number, distinctive numbers, face value, consideration paid, and signature blocks for two directors and the Company Secretary.",
  },
  {
    id: "share-transfer",
    icon: "🔄",
    badge: "Form SH-4 · Section 56",
    badgeColor: "#e11d48",
    title: "Share Transfer Deed Generator",
    subtitle: "Form SH-4 — Securities Transfer Instrument",
    href: "/tools/documents/share-transfer",
    color: "border-rose-200 bg-rose-50",
    headerBg: "linear-gradient(135deg,#e11d48,#be123c)",
    features: [
      "Form SH-4 — Rule 11(1) Companies (Share Capital & Debentures) Rules 2014",
      "Transferor and transferee full details",
      "Share class, distinctive numbers, consideration",
      "Stamp duty guidance — 0.015% of consideration",
      "Witness signatures (2 required)",
      "Board meeting date for transfer approval",
      "Section 56 compliance — 30-day transfer timeline",
      "Supports partial transfer of shares",
    ],
    keywords: [
      "share transfer deed generator India", "Form SH-4 share transfer India",
      "transfer of shares private limited India", "SH-4 format generator free",
      "stamp duty on share transfer India", "share transfer procedure Pvt Ltd",
      "Section 56 share transfer Companies Act", "share transfer instrument format",
    ],
    description: "Transferring shares in a private limited company requires a duly stamped Form SH-4 signed by both transferor and transferee. This generator creates the complete SH-4 instrument with all required fields. Stamp duty is 0.015% of consideration as per the Indian Stamp Act (amended 2020). Board approval and SH-7 may additionally be required.",
  },
  {
    id: "penalty-calculator",
    icon: "🧮",
    badge: "MCA Additional Fee",
    badgeColor: "#dc2626",
    title: "MCA Penalty Calculator",
    subtitle: "Late Filing Additional Fee — All MCA Forms",
    href: "/tools/penalty-calculator",
    color: "border-red-200 bg-red-50",
    headerBg: "linear-gradient(135deg,#dc2626,#991b1b)",
    features: [
      "AOC-4 additional fee calculation by share capital slab",
      "MGT-7 / MGT-7A late fee",
      "DIR-3 KYC late fee (₹5,000 flat)",
      "ADT-1 auditor appointment late fee",
      "DPT-3 deposit return late fee",
      "INC-20A commencement of business late fee",
      "Slab-wise calculation: 2x / 4x / 6x / 10x / 12x",
      "Delay period in days → total payable amount",
      "Compounding guidance beyond 270 days",
      "Section 454 penalty risk assessment",
    ],
    keywords: [
      "MCA penalty calculator India", "AOC-4 late filing fee calculator",
      "MGT-7 additional fee calculator", "DIR-3 KYC penalty",
      "ROC late filing fee India", "Companies Act 2013 penalty",
      "MCA additional fee calculator 2025-26", "ADT-1 late fee",
      "annual filing penalty private limited", "INC-20A late fee",
    ],
    description: "Late MCA filings attract significant additional fees — escalating to 12x the normal fee beyond 180 days, and compounding proceedings under Section 454 beyond 270 days. This calculator instantly computes the total payable based on your delay and the form type — helping you decide whether to file now or take professional advice on compounding.",
  },
  {
    id: "due-dates",
    icon: "📅",
    badge: "FY 2025-26 Updated",
    badgeColor: "#0891b2",
    title: "Compliance Due Date Calendars",
    subtitle: "GST · Income Tax · ROC/MCA",
    href: "/calendar",
    color: "border-cyan-200 bg-cyan-50",
    headerBg: "linear-gradient(135deg,#0891b2,#0e7490)",
    features: [
      "GST due dates — GSTR-1 (monthly/quarterly), GSTR-3B, GSTR-9, GSTR-9C",
      "Income Tax — ITR filing deadlines (all categories), advance tax dates",
      "TDS return due dates — Q1, Q2, Q3, Q4",
      "TDS certificate issuance dates (Form 16, 16A)",
      "ROC/MCA — AOC-4, MGT-7/7A, DIR-3 KYC, ADT-1, DPT-3",
      "ESIC/PF monthly contribution due dates",
      "GST annual return (GSTR-9) due date",
      "Tax audit report (Form 3CA/3CB/3CD) due date",
      "FY 2025-26 complete calendar — all months",
      "Printable compliance calendar",
    ],
    keywords: [
      "GST due dates FY 2025-26", "GSTR-1 due date 2025-26", "GSTR-3B due date monthly",
      "income tax due dates 2025-26", "ITR filing deadline AY 2026-27",
      "advance tax due date 2025-26", "TDS return due date quarterly 2025-26",
      "ROC filing due dates 2025-26", "AOC-4 due date 2025-26", "MGT-7 due date 2025-26",
      "DIR-3 KYC due date 2025-26", "compliance calendar 2025-26 India",
    ],
    description: "Missing a compliance due date means penalties, interest, and legal risk. ComplianceSearch.in maintains up-to-date calendars for all major statutory deadlines — GST returns, Income Tax filings, TDS returns, and ROC/MCA annual filings. All calendars are updated for FY 2025-26 / AY 2026-27.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ── */}
      <section className="py-16 px-4 text-center border-b border-slate-100"
        style={{ background: "linear-gradient(160deg,#0f172a 0%,#1e3a5f 60%,#1e293b 100%)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full mb-5 border uppercase tracking-widest"
            style={{ background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.85)" }}>
            🇮🇳 Made for Indian Compliance Professionals
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            About{" "}
            <span style={{ background: "linear-gradient(90deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              ComplianceSearch.in
            </span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed mb-8">
            India&apos;s free compliance platform — 10 professional tools for CAs, Company Secretaries, and businesses. Annual filing, compliance check, business valuation, meeting minutes, resolutions, and more.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[["10", "Free Tools"], ["500+", "Professionals"], ["9+", "Doc Types"], ["77+", "Compliance Rules"]].map(([n, l]) => (
              <div key={l} className="bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-center">
                <div className="text-2xl font-extrabold text-white">{n}</div>
                <div className="text-xs text-slate-400 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What is it ── */}
      <section className="py-12 px-4 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-4">What is ComplianceSearch.in?</h2>
          <div className="grid md:grid-cols-2 gap-6 text-slate-600 text-sm leading-relaxed">
            <p>
              <strong className="text-slate-900">ComplianceSearch.in</strong> is a free online compliance platform built specifically for Indian Chartered Accountants, Company Secretaries, and businesses. Every tool on this platform — from generating AOC-4 and MGT-7 annual filing attachments to calculating business valuation using the DCF or Rule 11UA method — is completely free, with no subscription or credit card required.
            </p>
            <p>
              The platform was built out of a real pain point: compliance professionals in India spend hours on repetitive document drafting — Board Reports, AGM Minutes, Share Certificates, Board Resolutions — that follow a predictable structure every time. ComplianceSearch.in automates all of this, so CAs and CSs can focus on advisory work rather than manual document preparation.
            </p>
          </div>
        </div>
      </section>

      {/* ── All Tools ── */}
      <section className="py-14 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Platform Overview</p>
            <h2 className="text-3xl font-extrabold text-slate-900">All 10 Free Tools — Explained</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">Everything ComplianceSearch.in offers — what each tool does, who it&apos;s for, and what it generates.</p>
          </div>

          <div className="space-y-8">
            {tools.map((tool, idx) => (
              <div key={tool.id} id={tool.id} className={`bg-white rounded-2xl border-2 ${tool.color} overflow-hidden shadow-sm`}>

                {/* Tool header */}
                <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-4" style={{ background: tool.headerBg }}>
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl flex-shrink-0">
                    {tool.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-xl font-extrabold text-white">{tool.title}</h3>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/20 text-white border border-white/30">
                        {tool.badge}
                      </span>
                    </div>
                    <p className="text-white/75 text-sm">{tool.subtitle}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link href={tool.href}
                      className="text-sm font-bold px-4 py-2 rounded-xl bg-white/20 text-white border border-white/30 hover:bg-white/30 transition">
                      Open Tool →
                    </Link>
                    {tool.learnHref && (
                      <Link href={tool.learnHref}
                        className="text-sm font-bold px-4 py-2 rounded-xl bg-white text-slate-800 hover:bg-white/90 transition">
                        Learn More
                      </Link>
                    )}
                  </div>
                </div>

                {/* Tool body */}
                <div className="p-6 grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">What It Does</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{tool.description}</p>

                    {/* Keywords as tags */}
                    <div className="mt-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Related Searches</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {tool.keywords.map(k => (
                          <span key={k} className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-md">{k}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Features</h4>
                    <ul className="space-y-1.5">
                      {tool.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="text-emerald-500 font-bold mt-0.5 flex-shrink-0">✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who is it for ── */}
      <section className="py-14 px-4 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-8">Who Uses ComplianceSearch.in?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { icon: "🧑‍💼", title: "Chartered Accountants", desc: "Handle annual filing for 20+ clients without manually drafting each AOC-4 / MGT-7 attachment. Save 30–40 hours per filing season." },
              { icon: "📜", title: "Company Secretaries", desc: "Generate SS-1 and SS-2 compliant board and AGM minutes, board resolutions, share certificates and transfer deeds." },
              { icon: "🏢", title: "Private Limited Companies", desc: "In-house finance teams generate their own annual filing attachments, check compliance requirements, and calculate valuations." },
              { icon: "🚀", title: "Startups & Founders", desc: "Understand compliance obligations from day one. Calculate pre-money valuation for fundraising. Track due dates." },
            ].map(u => (
              <div key={u.title} className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
                <div className="text-3xl mb-3">{u.icon}</div>
                <h3 className="font-extrabold text-slate-900 text-sm mb-2">{u.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── All Keywords/Search Terms section ── */}
      <section className="py-12 px-4 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">Comprehensive India Compliance Coverage</h2>
          <p className="text-slate-500 text-sm mb-6">ComplianceSearch.in covers every major compliance and document need for Indian businesses and professionals.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                heading: "Annual ROC Filing",
                items: ["AOC-4 attachments FY 2025-26", "MGT-7 annual return", "MGT-7A small company", "Board Report Director's Report", "Auditor's Report CARO 2020", "Notes on Accounts", "Cash Flow Statement", "AOC-1 subsidiary statement", "AOC-2 related party disclosure", "Director List with DIN"],
              },
              {
                heading: "Statutory Compliance",
                items: ["GST registration & returns", "Income Tax ITR filing", "TDS deduction & returns", "PF / EPF registration", "ESIC registration & returns", "FSSAI food licence", "Factories Act registration", "Shops & Establishment Act", "Minimum Wages compliance", "POSH compliance"],
              },
              {
                heading: "Company Secretarial",
                items: ["AGM Minutes SS-2", "Board Meeting Minutes SS-1", "Board Resolutions — all types", "Bank account opening resolution", "Share Certificate Form SH-1", "Share Transfer Deed SH-4", "Certified True Copy (CTC)", "DIR-3 KYC compliance", "Annual compliance calendar", "MCA V3 portal filings"],
              },
              {
                heading: "Business Valuation",
                items: ["DCF valuation India", "Rule 11UA NAV method", "EBITDA multiple valuation", "Revenue multiple method", "P/E ratio valuation", "Berkus method startups", "FEMA FDI valuation", "Section 56(2)(x) FMV", "Share transfer fair value", "Startup pre-money valuation"],
              },
              {
                heading: "Due Dates & Calendars",
                items: ["GST due dates 2025-26", "GSTR-1 GSTR-3B deadlines", "Income Tax ITR deadline", "Advance tax due dates", "TDS return quarterly dates", "AOC-4 MGT-7 due dates", "DIR-3 KYC due date", "ADT-1 ADT-3 deadlines", "DPT-3 due date", "Compliance calendar 2025-26"],
              },
              {
                heading: "Advanced Compliance",
                items: ["CSR applicability Section 135", "FEMA / FDI compliance", "Transfer Pricing India", "SEBI LODR compliance", "NBFC RBI compliance", "RERA compliance", "DPDP Act compliance", "Environmental PCB consent", "Import Export IEC DGFT", "MSME Udyam registration"],
              },
            ].map(cat => (
              <div key={cat.heading} className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-extrabold text-slate-800 mb-3 pb-2 border-b border-slate-100">{cat.heading}</h3>
                <ul className="space-y-1.5">
                  {cat.items.map(item => (
                    <li key={item} className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Powered by Gee Bharat ── */}
      <section className="py-10 px-4 border-t border-amber-100 bg-amber-50">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <p className="text-amber-600 text-xs font-bold uppercase tracking-widest mb-1">Powered by</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Gee Bharat</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              ComplianceSearch.in is a product of{" "}
              <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
                className="text-amber-700 font-semibold underline underline-offset-2 hover:text-amber-900">
                geebharat.com
              </a>{" "}
              — India&apos;s office management platform covering attendance, task tracking, leave management, and employee records. ComplianceSearch adds the compliance layer — ensuring every business knows what to file, when to file, and has the documents ready.
            </p>
          </div>
          <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl border transition hover:scale-105 shadow"
            style={{ background: "#f59e0b", borderColor: "#d97706", color: "#fff" }}>
            🌐 Visit Gee Bharat
          </a>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-12 px-4 bg-white border-t border-slate-100 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Start Using Free — No Signup Required</h2>
          <p className="text-slate-500 mb-7 text-sm leading-relaxed">
            All tools are free. No credit card. No subscription. Login optional — create an account to save drafts and collaborate with your team.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/tools/documents/annual-filing"
              className="font-bold text-white text-sm px-6 py-3 rounded-xl transition hover:scale-105 shadow"
              style={{ background: "linear-gradient(135deg,#059669,#047857)" }}>
              Annual Filing Generator →
            </Link>
            <Link href="/check"
              className="font-bold text-white text-sm px-6 py-3 rounded-xl transition hover:scale-105 shadow"
              style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
              Compliance Checker →
            </Link>
            <Link href="/tools"
              className="font-bold text-slate-700 text-sm px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition border border-slate-200">
              All Tools →
            </Link>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="px-4 pb-8 bg-white">
        <div className="max-w-4xl mx-auto rounded-xl px-5 py-4 bg-orange-50 border border-orange-200 flex items-start gap-3">
          <span className="text-orange-500 text-lg flex-shrink-0 mt-0.5">⚠️</span>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong className="text-orange-700">Disclaimer:</strong> ComplianceSearch.in provides compliance guidance for informational purposes only. Document templates are based on Companies Act 2013 and current rules but may require professional review before filing. Always consult a qualified <strong>Chartered Accountant (CA)</strong>, <strong>Company Secretary (CS)</strong>, or lawyer before acting on compliance decisions. Due dates shown are general guidance — verify with official MCA, CBIC, and CBDT portals for confirmed deadlines.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 px-5 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-white font-bold text-sm mb-3">Tools</p>
              <div className="space-y-1.5">
                {[["Annual Filing", "/tools/documents/annual-filing"], ["Compliance Check", "/check"], ["Business Valuation", "/tools/business-valuation"], ["Board Minutes", "/tools/documents/minutes/board"], ["AGM Minutes", "/tools/documents/minutes/agm"]].map(([l, h]) => (
                  <Link key={h} href={h} className="block text-xs hover:text-white transition">{l}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white font-bold text-sm mb-3">Documents</p>
              <div className="space-y-1.5">
                {[["Board Resolution", "/tools/documents/board-resolution"], ["Bank Resolution", "/tools/documents/bank-resolution"], ["Share Certificate", "/tools/documents/share-certificate"], ["Share Transfer", "/tools/documents/share-transfer"], ["Penalty Calculator", "/tools/penalty-calculator"]].map(([l, h]) => (
                  <Link key={h} href={h} className="block text-xs hover:text-white transition">{l}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white font-bold text-sm mb-3">Due Dates</p>
              <div className="space-y-1.5">
                {[["GST Due Dates", "/gst-due-dates"], ["Income Tax Dates", "/income-tax-due-dates"], ["ROC/MCA Dates", "/roc-filing-due-dates"], ["Compliance Calendar", "/calendar"], ["Companies Act Guide", "/companies-act-compliance"]].map(([l, h]) => (
                  <Link key={h} href={h} className="block text-xs hover:text-white transition">{l}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white font-bold text-sm mb-3">Company</p>
              <div className="space-y-1.5">
                {[["About Us", "/about"], ["Contact", "/contact"], ["Blog", "/blog"], ["All Tools", "/tools"]].map(([l, h]) => (
                  <Link key={h} href={h} className="block text-xs hover:text-white transition">{l}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs">© 2025 ComplianceSearch.in — For guidance only. Consult a CA / CS.</p>
            <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
              className="text-xs font-semibold px-4 py-2 rounded-full border border-amber-700 bg-amber-900/30 text-amber-400 hover:bg-amber-900/50 transition">
              🌐 Powered by Gee Bharat
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
