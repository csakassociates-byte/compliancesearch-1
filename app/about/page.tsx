import Link from "next/link";

const NAV = [
  { href:"/",        label:"Home" },
  { href:"/check",   label:"Check Compliance" },
  { href:"/about",   label:"About Us",  active:true },
  { href:"/contact", label:"Contact" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col" style={{ background:"linear-gradient(135deg,#050d1a 0%,#0a1f3d 40%,#0d2a52 70%,#0f1f40 100%)" }}>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/8" style={{ background:"rgba(5,13,26,0.88)", backdropFilter:"blur(16px)" }}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:"linear-gradient(135deg,#f59e0b,#d97706)" }}>
              <span className="text-lg">⚖️</span>
            </div>
            <span className="text-white font-bold text-base tracking-tight">ComplianceSearch</span>
            <span className="text-amber-400 font-bold text-base">.in</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {NAV.map(n => (
              <Link key={n.href} href={n.href}
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${n.active ? "text-white bg-white/10" : "text-slate-300 hover:text-white hover:bg-white/8"}`}>
                {n.label}
              </Link>
            ))}
            <div className="w-px h-5 bg-white/15 mx-2" />
            <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition"
              style={{ background:"rgba(245,158,11,0.12)", borderColor:"rgba(245,158,11,0.3)", color:"#fbbf24" }}>
              🌐 Gee Bharat
            </a>
          </div>
          <Link href="/" className="md:hidden text-slate-400 text-xs hover:text-white">← Home</Link>
        </div>
      </nav>

      <div className="flex-1 max-w-5xl mx-auto px-4 py-16 w-full">

        {/* ── Page Header ── */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full mb-5 border"
            style={{ background:"rgba(245,158,11,0.1)", borderColor:"rgba(245,158,11,0.25)", color:"#fbbf24" }}>
            <span>ℹ️</span> About ComplianceSearch.in
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
            India's Smartest<br />
            <span style={{ background:"linear-gradient(90deg,#f59e0b,#fbbf24,#f97316)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              Compliance Checker
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            A free, AI-assisted tool that maps your exact business profile to all applicable
            laws, licenses, and filings — in under 2 minutes.
          </p>
        </div>

        {/* ── What is it ── */}
        <div className="rounded-2xl p-7 mb-5 border"
          style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.08)" }}>
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background:"rgba(59,130,246,0.2)", color:"#60a5fa" }}>🎯</span>
            What is ComplianceSearch.in?
          </h2>
          <p className="text-slate-400 leading-relaxed mb-3">
            <strong className="text-white">ComplianceSearch.in</strong> is an India-specific compliance applicability checker.
            You answer a short questionnaire about your business — structure, turnover, sector, employee count, and activities —
            and the tool instantly tells you which compliance obligations apply to you.
          </p>
          <p className="text-slate-400 leading-relaxed">
            From GST and Income Tax to PF/ESIC, FSSAI, CSR (Section 135), FEMA/FDI filings, Transfer Pricing,
            SEBI LODR, DPDP Act, RERA, and 70+ other compliances — everything mapped to your unique business profile.
          </p>
        </div>

        {/* ── How it works ── */}
        <div className="rounded-2xl p-7 mb-5 border"
          style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.08)" }}>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background:"rgba(16,185,129,0.2)", color:"#34d399" }}>⚙️</span>
            How It Works — 3 Simple Steps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { n:"01", icon:"📝", title:"Fill Quick Form",    desc:"5-step questionnaire: business type, sector, turnover, employees, and activities." },
              { n:"02", icon:"🔍", title:"Know More (Advanced)", desc:"Optional deep-dive: CSR, FEMA/FDI, Transfer Pricing, SEBI, DPDP, RERA, crypto tax." },
              { n:"03", icon:"📄", title:"Download PDF Report", desc:"Full report with compliances, due dates, penalties, and a printable document checklist." },
            ].map(s => (
              <div key={s.n} className="rounded-xl p-5 border relative overflow-hidden"
                style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.07)" }}>
                <div className="text-5xl font-black mb-3 select-none" style={{ color:"rgba(255,255,255,0.04)", position:"absolute", top:8, right:12, lineHeight:1 }}>{s.n}</div>
                <span className="text-3xl mb-3 block">{s.icon}</span>
                <p className="text-white font-semibold text-sm mb-2">{s.title}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Categories ── */}
        <div className="rounded-2xl p-7 mb-5 border"
          style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.08)" }}>
          <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background:"rgba(139,92,246,0.2)", color:"#a78bfa" }}>📋</span>
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
              <div key={c.cat} className="rounded-xl p-3.5 border flex items-start gap-3 transition hover:border-white/15"
                style={{ background:"rgba(255,255,255,0.025)", borderColor:"rgba(255,255,255,0.06)" }}>
                <span className="text-xl shrink-0 mt-0.5">{c.icon}</span>
                <div>
                  <p className="text-white text-xs font-bold mb-0.5">{c.cat}</p>
                  <p className="text-slate-500 text-[11px] leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Who is it for ── */}
        <div className="rounded-2xl p-7 mb-5 border"
          style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.08)" }}>
          <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:"rgba(245,158,11,0.2)", color:"#fbbf24" }}>👥</span>
            Who Is It For?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon:"🏭", label:"Business Owners",     desc:"Know exactly what you need before you miss a deadline" },
              { icon:"💼", label:"CAs & CS Firms",      desc:"Quickly audit client compliance obligations" },
              { icon:"🚀", label:"Startups & Founders", desc:"Understand legal requirements from day one" },
              { icon:"🌍", label:"Foreign Investors",   desc:"Step-by-step guide to setting up business in India" },
            ].map(u => (
              <div key={u.label} className="rounded-xl p-4 border text-center transition hover:border-amber-400/20"
                style={{ background:"rgba(255,255,255,0.025)", borderColor:"rgba(255,255,255,0.06)" }}>
                <span className="text-4xl block mb-2">{u.icon}</span>
                <p className="text-white font-semibold text-sm mb-1">{u.label}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Powered by Gee Bharat ── */}
        <div className="rounded-2xl p-7 mb-5 border relative overflow-hidden"
          style={{ background:"linear-gradient(135deg,rgba(245,158,11,0.1),rgba(249,115,22,0.06))", borderColor:"rgba(245,158,11,0.25)" }}>
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 pointer-events-none" style={{ background:"radial-gradient(circle,#f59e0b,transparent 70%)", transform:"translate(30%,-30%)" }} />
          <div className="flex flex-col md:flex-row items-start md:items-center gap-7 relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border" style={{ background:"rgba(245,158,11,0.15)", borderColor:"rgba(245,158,11,0.3)" }}>🌐</div>
                <div>
                  <p className="text-amber-400 text-xs font-bold uppercase tracking-widest">Powered by</p>
                  <h3 className="text-2xl font-extrabold text-white">Gee Bharat</h3>
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed mb-2">
                <strong className="text-white">ComplianceSearch.in</strong> is a product of{" "}
                <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2">geebharat.com</a>
                {" "}— a comprehensive office management platform for modern Indian businesses.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Gee Bharat covers <strong className="text-slate-300">Attendance Management, Task Tracking, Leave Management,
                Employee Records</strong>, and now with ComplianceSearch —
                complete <strong className="text-slate-300">statutory compliance guidance</strong> for your business.
              </p>
            </div>
            <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all hover:scale-105 shadow-lg"
              style={{ background:"linear-gradient(135deg,#f59e0b,#f97316)", color:"#0a0a0a", boxShadow:"0 8px 24px rgba(245,158,11,0.3)" }}>
              🌐 Visit geebharat.com
            </a>
          </div>
        </div>

        {/* ── Disclaimer ── */}
        <div className="rounded-xl px-5 py-4 border flex items-start gap-3"
          style={{ background:"rgba(245,158,11,0.06)", borderColor:"rgba(245,158,11,0.2)" }}>
          <span className="text-amber-400 text-lg shrink-0 mt-0.5">⚠️</span>
          <p className="text-sm text-slate-400 leading-relaxed">
            <strong className="text-amber-300">Disclaimer:</strong> ComplianceSearch.in provides compliance guidance for informational purposes only.
            Thresholds, due dates, and penalties are subject to change per government notifications.
            Always consult a qualified <strong className="text-slate-300">Chartered Accountant (CA)</strong> or <strong className="text-slate-300">Company Secretary (CS)</strong> before acting.
          </p>
        </div>

      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-white/6 px-5 py-5" style={{ background:"rgba(0,0,0,0.3)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            {[["Home","/"],["About","/about"],["Contact","/contact"],["Check","/check"]].map(([l,h]) => (
              <Link key={h} href={h} className="text-slate-500 hover:text-slate-300 text-xs transition">{l}</Link>
            ))}
          </div>
          <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 border rounded-full px-4 py-2 text-xs font-semibold transition hover:scale-105"
            style={{ background:"rgba(245,158,11,0.1)", borderColor:"rgba(245,158,11,0.25)", color:"#fbbf24" }}>
            🌐 Powered by <span className="font-bold ml-0.5">Gee Bharat</span>
          </a>
        </div>
      </footer>

    </main>
  );
}
