import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex flex-col">

      {/* ── Navbar ── */}
      <nav className="px-6 py-4 flex items-center justify-between border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-2xl">⚖️</span>
          <span className="text-white font-bold text-xl tracking-tight">ComplianceSearch</span>
          <span className="text-blue-300 text-xs font-medium bg-blue-500/20 px-2 py-0.5 rounded-full">.in</span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          <Link href="/"        className="text-blue-200 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/10 transition">Home</Link>
          <Link href="/check"   className="text-blue-200 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/10 transition">Check Compliance</Link>
          <Link href="/about"   className="text-white text-sm font-semibold px-4 py-2 rounded-lg bg-white/10 transition">About Us</Link>
          <Link href="/contact" className="text-blue-200 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/10 transition">Contact</Link>
          <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
            className="ml-3 text-xs bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 hover:bg-yellow-400/30 px-3 py-1.5 rounded-full font-semibold transition flex items-center gap-1.5">
            🌐 Gee Bharat
          </a>
        </div>
        <div className="md:hidden flex items-center gap-3">
          <Link href="/" className="text-blue-300 text-xs">← Home</Link>
        </div>
      </nav>

      {/* ── Page Content ── */}
      <div className="flex-1 max-w-4xl mx-auto px-4 py-14 w-full">

        {/* Page title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-yellow-400/20 border border-yellow-400/30 text-yellow-300 text-sm font-medium px-4 py-2 rounded-full mb-5">
            <span>ℹ️</span><span>About ComplianceSearch.in</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            India's Smart<br />
            <span className="text-yellow-400">Compliance Checker</span>
          </h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">
            A free, intelligent tool that helps Indian businesses understand exactly which
            laws, licenses, and filings apply to them — in minutes.
          </p>
        </div>

        {/* What is it */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-7 mb-6">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span>🎯</span> What is ComplianceSearch.in?
          </h2>
          <p className="text-blue-200 leading-relaxed mb-3">
            <strong className="text-white">ComplianceSearch.in</strong> is an India-specific, AI-assisted compliance
            applicability checker. You answer a short questionnaire about your business — structure, turnover, sector,
            employee count, and activities — and the tool instantly tells you which compliance obligations apply to you.
          </p>
          <p className="text-blue-200 leading-relaxed">
            From GST and Income Tax to PF/ESIC, factory licenses, FSSAI, SEBI LODR, CSR obligations, FEMA/FDI filings,
            DPDP Act, and 70+ other compliances — everything is mapped to your unique business profile.
          </p>
        </div>

        {/* How it works */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-7 mb-6">
          <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
            <span>⚙️</span> How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { step: "1", icon: "📝", title: "Answer Questions", desc: "Fill a short 5-step form about your business — type, sector, turnover, employees, activities." },
              { step: "2", icon: "🔍", title: "Know More (Advanced)", desc: "Optionally answer advanced questions for CSR, FEMA, Transfer Pricing, SEBI, DPDP and cross-border compliances." },
              { step: "3", icon: "📄", title: "Get Full Report", desc: "Download a PDF report with all applicable compliances, due dates, penalties, and a document checklist." },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-yellow-400 text-gray-900 font-bold text-lg rounded-full flex items-center justify-center mb-3">{s.step}</div>
                <span className="text-3xl mb-2">{s.icon}</span>
                <p className="text-white font-semibold text-sm mb-1">{s.title}</p>
                <p className="text-blue-300 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What it covers */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-7 mb-6">
          <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
            <span>📋</span> What It Covers — 77+ Rules, 11 Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { icon:"🏛️", cat:"Central Tax & GST",          desc:"GST, ITR, TDS, Advance Tax, Tax Audit, VDA Tax" },
              { icon:"🏢", cat:"MCA / ROC",                   desc:"Companies Act, AGM, DPT-3, CSR, Secretarial Audit" },
              { icon:"👷", cat:"Labour Law",                  desc:"PF, ESIC, Gratuity, POSH, Minimum Wages, Bonus" },
              { icon:"📜", cat:"Industry Licenses",           desc:"FSSAI, Drug License, Factory Act, PCB Consent" },
              { icon:"🌿", cat:"Environmental",               desc:"PCB, E-Waste EPR, Hazardous Waste" },
              { icon:"🗺️", cat:"State Compliance",            desc:"Shops Act, PT, MSME Registration, State GST" },
              { icon:"🚢", cat:"Import / Export",             desc:"IEC, AD Code, GST LUT, Advance Auth, DGFT" },
              { icon:"🚀", cat:"MSME & Startup",              desc:"Udyam, DPIIT, Startup India, Startup Tax" },
              { icon:"🏦", cat:"Financial Sector",            desc:"SEBI LODR, NBFC Returns, PMLA, SEBI BRSR" },
              { icon:"🌏", cat:"Global / FEMA",               desc:"FC-GPR, FLA Return, ODI, ECB, Branch/LO, Transfer Pricing" },
              { icon:"💻", cat:"Digital & E-Commerce",        desc:"DPDP Act, E-Commerce Rules, IT Intermediary Rules" },
            ].map((c) => (
              <div key={c.cat} className="bg-white/5 rounded-xl p-3">
                <p className="text-white text-xs font-bold flex items-center gap-1.5 mb-1"><span>{c.icon}</span>{c.cat}</p>
                <p className="text-blue-300 text-[11px] leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Who is it for */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-7 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>👥</span> Who Is It For?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon:"🏭", label:"Business Owners",     desc:"Know exactly what you need before you miss a deadline" },
              { icon:"💼", label:"CAs & CS Firms",      desc:"Quickly audit client compliance applicability" },
              { icon:"🚀", label:"Startups & Founders", desc:"Understand legal requirements from day one" },
              { icon:"🌍", label:"Foreign Investors",   desc:"Learn what's needed to set up business in India" },
            ].map((u) => (
              <div key={u.label} className="text-center">
                <span className="text-4xl">{u.icon}</span>
                <p className="text-white font-semibold text-sm mt-2">{u.label}</p>
                <p className="text-blue-300 text-xs mt-1 leading-relaxed">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Powered by Gee Bharat */}
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-2xl p-7 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl">🌐</span>
                <div>
                  <p className="text-yellow-300 text-xs font-semibold uppercase tracking-wider">Powered by</p>
                  <h2 className="text-2xl font-bold text-white">Gee Bharat</h2>
                </div>
              </div>
              <p className="text-blue-200 leading-relaxed mb-3">
                <strong className="text-white">ComplianceSearch.in</strong> is a product of{" "}
                <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
                  className="text-yellow-300 hover:text-yellow-200 font-semibold underline underline-offset-2">
                  Gee Bharat
                </a>{" "}
                — a comprehensive office management platform designed for modern Indian businesses.
              </p>
              <p className="text-blue-200 leading-relaxed text-sm">
                Gee Bharat's platform covers <strong className="text-white">Attendance Management, Task Tracking,
                Leave Management, Employee Records</strong>, and now — with ComplianceSearch — complete
                <strong className="text-white"> statutory compliance guidance</strong> for your business.
              </p>
            </div>
            <div className="shrink-0 text-center">
              <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-sm px-6 py-3 rounded-xl transition shadow-lg">
                <span>🌐</span>
                Visit geebharat.com
              </a>
              <p className="text-blue-300 text-xs mt-2">Office Management Platform</p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-500/10 border border-amber-400/30 rounded-xl px-5 py-4 text-sm text-amber-200">
          <span className="font-bold">⚠ Disclaimer: </span>
          ComplianceSearch.in provides compliance guidance for informational purposes only. Compliance thresholds,
          due dates, and penalties are subject to change. Always consult a qualified
          <strong> Chartered Accountant (CA)</strong> or <strong>Company Secretary (CS)</strong> before acting on
          compliance decisions.
        </div>

      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-blue-400 text-xs">
            <Link href="/"        className="hover:text-white transition">Home</Link>
            <Link href="/about"   className="hover:text-white transition">About</Link>
            <Link href="/contact" className="hover:text-white transition">Contact</Link>
            <Link href="/check"   className="hover:text-white transition">Check</Link>
          </div>
          <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full transition">
            <span>🌐</span>
            Powered by <span className="text-yellow-300 font-bold ml-1">Gee Bharat</span>
          </a>
        </div>
      </footer>

    </main>
  );
}
