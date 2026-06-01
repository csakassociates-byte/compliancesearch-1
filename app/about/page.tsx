import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us — India's Statutory Compliance Checker",
  description:
    "ComplianceSearch.in is a free statutory compliance applicability checker for Indian businesses. Know your GST, MCA, Labour, FEMA, CSR, and digital compliance obligations in 2 minutes. Powered by Gee Bharat.",
  keywords: [
    "about compliance checker india", "statutory compliance tool india",
    "business compliance applicability checker", "compliance requirements india",
    "gee bharat compliance", "77 compliance rules india",
  ],
  openGraph: {
    title: "About ComplianceSearch.in — India's Statutory Compliance Checker",
    description: "Free compliance checker covering 77+ rules — GST, Labour Laws, FEMA, CSR, DPDP Act and more for Indian businesses.",
    url: "https://compliancesearch.in/about",
  },
  alternates: { canonical: "https://compliancesearch.in/about" },
};

const NAV = [
  { href: "/",        label: "Home" },
  { href: "/check",   label: "Check Compliance" },
  { href: "/about",   label: "About Us", active: true },
  { href: "/contact", label: "Contact" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: "linear-gradient(135deg,#1e40af,#1d4ed8)" }}>⚖️</div>
            <span className="text-slate-900 font-bold text-lg tracking-tight">ComplianceSearch</span>
            <span className="font-bold text-lg" style={{ color: "#d97706" }}>.in</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {NAV.map(n => (
              <Link key={n.href} href={n.href}
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${n.active ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}>
                {n.label}
              </Link>
            ))}
            <div className="w-px h-5 bg-slate-200 mx-2" />
            <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border transition hover:scale-105"
              style={{ background: "#fffbeb", borderColor: "#fde68a", color: "#92400e" }}>
              🌐 Gee Bharat
            </a>
          </div>
          <Link href="/" className="md:hidden text-slate-500 text-xs hover:text-slate-800">← Home</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="border-b border-slate-100 py-16 px-4 text-center" style={{ background: "linear-gradient(160deg,#eff6ff 0%,#f0f9ff 50%,#fafafa 100%)" }}>
        <div className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full mb-5 border"
          style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}>
          ℹ️ About Us
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
          India's Smartest<br />
          <span style={{ background: "linear-gradient(90deg,#1d4ed8,#0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Compliance Checker
          </span>
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
          A free, intelligent tool that maps your exact business profile to all applicable laws, licenses, and filings — in minutes.
        </p>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-12 w-full space-y-6">

        {/* ── What is it ── */}
        <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">🎯</span>
            What is ComplianceSearch.in?
          </h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            <strong className="text-slate-900">ComplianceSearch.in</strong> is an India-specific compliance applicability checker. You answer a short questionnaire about your business — structure, turnover, sector, employees, and activities — and the tool instantly tells you which compliance obligations apply to you.
          </p>
          <p className="text-slate-600 leading-relaxed">
            From GST and Income Tax to PF/ESIC, FSSAI, CSR (Section 135), FEMA/FDI filings, Transfer Pricing, SEBI LODR, DPDP Act, RERA, and 70+ other compliances — everything is mapped to your unique business profile.
          </p>
        </div>

        {/* ── How it works ── */}
        <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center text-sm">⚙️</span>
            How It Works — 3 Simple Steps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { n: "1", icon: "📝", title: "Fill Quick Form",       desc: "5-step questionnaire: business type, sector, turnover, employees, and activities.", color: "bg-blue-500" },
              { n: "2", icon: "🔍", title: "Know More (Advanced)",  desc: "Deep-dive: CSR, FEMA/FDI, Transfer Pricing, SEBI, DPDP, RERA, crypto tax.", color: "bg-violet-500" },
              { n: "3", icon: "📄", title: "Download PDF Report",   desc: "Full report with compliances, due dates, penalties, and a printable document checklist.", color: "bg-emerald-500" },
            ].map(s => (
              <div key={s.n} className="rounded-xl p-5 bg-slate-50 border border-slate-200 relative">
                <div className={`w-7 h-7 rounded-full ${s.color} text-white text-xs font-bold flex items-center justify-center mb-3`}>{s.n}</div>
                <span className="text-3xl block mb-2">{s.icon}</span>
                <p className="text-slate-900 font-semibold text-sm mb-1">{s.title}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Categories ── */}
        <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-sm">📋</span>
            77+ Rules Across 11 Categories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { icon:"🏛️", cat:"Central Tax & GST",          desc:"GST, ITR, TDS, Advance Tax, Tax Audit, VDA Tax" },
              { icon:"🏢", cat:"MCA / ROC",                   desc:"Companies Act, AGM, DPT-3, CSR, Secretarial Audit" },
              { icon:"👷", cat:"Labour Law",                  desc:"PF, ESIC, Gratuity, POSH, Minimum Wages, Bonus" },
              { icon:"📜", cat:"Industry Licenses",           desc:"FSSAI, Drug License, Factory Act, PCB Consent" },
              { icon:"🌿", cat:"Environmental",               desc:"PCB, E-Waste EPR, Hazardous Waste Management" },
              { icon:"🗺️", cat:"State Compliance",            desc:"Shops Act, PT, MSME, State GST registration" },
              { icon:"🚢", cat:"Import / Export",             desc:"IEC, AD Code, GST LUT, DGFT, Advance Auth" },
              { icon:"🚀", cat:"MSME & Startup",              desc:"Udyam, DPIIT, Startup India, Startup Tax" },
              { icon:"🏦", cat:"Financial Sector",            desc:"SEBI LODR, NBFC Returns, PMLA, SEBI BRSR" },
              { icon:"🌏", cat:"Global / FEMA",               desc:"FC-GPR, FLA Return, ODI, ECB, Transfer Pricing" },
              { icon:"💻", cat:"Digital & E-Commerce",        desc:"DPDP Act, E-Commerce Rules, IT Intermediary" },
            ].map(c => (
              <div key={c.cat} className="rounded-xl p-3.5 bg-slate-50 border border-slate-200 flex items-start gap-3 hover:border-blue-200 hover:bg-blue-50/30 transition">
                <span className="text-xl shrink-0 mt-0.5">{c.icon}</span>
                <div>
                  <p className="text-slate-900 text-xs font-bold mb-0.5">{c.cat}</p>
                  <p className="text-slate-500 text-[11px] leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Who is it for ── */}
        <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-sm">👥</span>
            Who Is It For?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon:"🏭", label:"Business Owners",     desc:"Know what you need before you miss a deadline" },
              { icon:"💼", label:"CAs & CS Firms",      desc:"Quickly audit client compliance obligations" },
              { icon:"🚀", label:"Startups & Founders", desc:"Understand legal requirements from day one" },
              { icon:"🌍", label:"Foreign Investors",   desc:"Guide to setting up business in India" },
            ].map(u => (
              <div key={u.label} className="rounded-xl p-4 bg-slate-50 border border-slate-200 text-center hover:border-blue-200 hover:bg-blue-50/30 transition">
                <span className="text-4xl block mb-2">{u.icon}</span>
                <p className="text-slate-900 font-semibold text-sm mb-1">{u.label}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Powered by Gee Bharat ── */}
        <div className="rounded-2xl p-7 border border-amber-200 bg-amber-50">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-7">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl">🌐</div>
                <div>
                  <p className="text-amber-600 text-xs font-bold uppercase tracking-widest">Powered by</p>
                  <h3 className="text-2xl font-extrabold text-slate-900">Gee Bharat</h3>
                </div>
              </div>
              <p className="text-slate-700 leading-relaxed mb-2">
                <strong>ComplianceSearch.in</strong> is a product of{" "}
                <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
                  className="text-amber-700 hover:text-amber-900 font-semibold underline underline-offset-2">
                  geebharat.com
                </a>{" "}
                — a comprehensive office management platform for modern Indian businesses.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                Gee Bharat covers <strong>Attendance Management, Task Tracking, Leave Management, Employee Records</strong>, and now with ComplianceSearch — complete <strong>statutory compliance guidance</strong> for your business.
              </p>
            </div>
            <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl border border-amber-300 bg-amber-400 hover:bg-amber-500 text-white transition hover:scale-105 shadow-md">
              🌐 Visit geebharat.com
            </a>
          </div>
        </div>

        {/* ── Disclaimer ── */}
        <div className="rounded-xl px-5 py-4 bg-orange-50 border border-orange-200 flex items-start gap-3">
          <span className="text-orange-500 text-lg shrink-0 mt-0.5">⚠️</span>
          <p className="text-sm text-slate-600 leading-relaxed">
            <strong className="text-orange-700">Disclaimer:</strong> ComplianceSearch.in provides compliance guidance for informational purposes only. Always consult a qualified <strong>Chartered Accountant (CA)</strong> or <strong>Company Secretary (CS)</strong> before acting on compliance decisions.
          </p>
        </div>

      </div>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-slate-200 px-5 py-5 mt-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            {[["Home","/"],["About","/about"],["Contact","/contact"],["Check","/check"]].map(([l,h]) => (
              <Link key={h} href={h} className="text-slate-400 hover:text-slate-700 text-xs transition">{l}</Link>
            ))}
          </div>
          <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition">
            🌐 Powered by <span className="font-bold ml-0.5">Gee Bharat</span>
          </a>
        </div>
      </footer>

    </main>
  );
}
