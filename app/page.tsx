import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* ══ HERO ══ */}
      <section style={{ background: "linear-gradient(160deg,#eff6ff 0%,#f5f3ff 40%,#fafafa 100%)" }} className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle,#bfdbfe,transparent 70%)", transform: "translate(30%,-30%)" }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-15 pointer-events-none" style={{ background: "radial-gradient(circle,#ddd6fe,transparent 70%)", transform: "translate(-30%,30%)" }} />
        <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle,#fde68a,transparent 70%)", transform: "translate(20%,20%)" }} />

        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full mb-6 border uppercase tracking-widest"
          style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}>
          <span>🇮🇳</span> Trusted by CAs, CSs &amp; Business Leaders across India
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-4 leading-tight tracking-tight">
          India&apos;s Most Complete{" "}
          <span style={{ background: "linear-gradient(90deg,#1d4ed8,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Compliance
          </span>
          <br />&amp;{" "}
          <span style={{ background: "linear-gradient(90deg,#7c3aed,#6d28d9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Valuation
          </span>{" "}Platform
        </h1>
        <p className="text-slate-500 text-base md:text-lg max-w-2xl mb-10 leading-relaxed">
          Enterprise-grade regulatory compliance intelligence and business valuation —
          free for every Indian business, from startups to conglomerates.
        </p>

        {/* ── DUAL TOOL CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl w-full mb-12">

          {/* Card 1 — Compliance */}
          <div className="bg-white rounded-3xl p-7 border-2 border-blue-100 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all text-left flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}>⚖️</div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-0.5">Compliance Tool</p>
                <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
                  Know Every <span className="text-blue-600">Compliance</span><br/>Your Business Needs
                </h2>
              </div>
            </div>

            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              Answer a few questions — get an instant, categorized list of all applicable licenses, registrations, tax filings, and statutory compliances.
            </p>

            <div className="flex flex-wrap gap-1.5 mb-5">
              {["Income Tax","GST","MCA/ROC","Labour Laws","FSSAI","FEMA","CSR","DPDP Act"].map(t => (
                <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-medium border border-blue-100">{t}</span>
              ))}
            </div>

            <Link href="/check"
              className="mt-auto inline-flex items-center justify-center gap-2 font-bold text-white text-base px-7 py-3.5 rounded-2xl transition-all hover:scale-105 shadow-lg mb-3"
              style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", boxShadow: "0 12px 32px rgba(29,78,216,0.30)" }}>
              Start Compliance Check →
            </Link>
            <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="text-green-500">✓</span> Free</span>
              <span className="text-slate-200">·</span>
              <span className="flex items-center gap-1"><span className="text-green-500">✓</span> 2 minutes</span>
              <span className="text-slate-200">·</span>
              <span className="flex items-center gap-1"><span className="text-green-500">✓</span> 77+ Rules</span>
            </div>
          </div>

          {/* Card 2 — Valuation */}
          <div className="bg-white rounded-3xl p-7 border-2 border-purple-100 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all text-left flex flex-col relative overflow-hidden">
            {/* NEW badge */}
            <div className="absolute top-4 right-4 bg-purple-600 text-white text-xs font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide">New</div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>📊</div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-purple-500 mb-0.5">Valuation Tool</p>
                <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
                  Know Your <span className="text-purple-600">Company&apos;s</span><br/>Real Valuation
                </h2>
              </div>
            </div>

            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              Enter financials — get instant business valuation using 7 investment-banking methods. Works for ₹10L startup to ₹20 Lakh Cr Reliance-scale company.
            </p>

            <div className="flex flex-wrap gap-1.5 mb-5">
              {["DCF","EBITDA Multiple","SOTP","DDM","Berkus","P/E","46 Sectors"].map(t => (
                <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 font-medium border border-purple-100">{t}</span>
              ))}
            </div>

            <Link href="/tools/business-valuation"
              className="mt-auto inline-flex items-center justify-center gap-2 font-bold text-white text-base px-7 py-3.5 rounded-2xl transition-all hover:scale-105 shadow-lg mb-3"
              style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 12px 32px rgba(124,58,237,0.30)" }}>
              Value My Business →
            </Link>
            <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="text-green-500">✓</span> Free</span>
              <span className="text-slate-200">·</span>
              <span className="flex items-center gap-1"><span className="text-green-500">✓</span> Listed + Startup</span>
              <span className="text-slate-200">·</span>
              <span className="flex items-center gap-1"><span className="text-green-500">✓</span> Instant</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl w-full">
          {[
            { n: "77+",  label: "Compliance Rules",  color: "#1d4ed8" },
            { n: "11",   label: "Categories",         color: "#1d4ed8" },
            { n: "46",   label: "Valuation Sectors",  color: "#7c3aed" },
            { n: "7",    label: "Valuation Methods",  color: "#7c3aed" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 bg-white border border-slate-200 shadow-sm text-center hover:shadow-md transition">
              <div className="text-2xl font-extrabold mb-0.5" style={{ color: s.color }}>{s.n}</div>
              <div className="text-slate-500 text-xs font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES STRIP ══ */}
      <section className="bg-slate-50 border-t border-slate-200 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-slate-400 text-xs font-semibold uppercase tracking-widest mb-8">Coverage Highlights</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "🏛️", title: "Central Tax",  desc: "Income Tax, TDS, GST, Advance Tax" },
              { icon: "📋", title: "MCA / ROC",    desc: "Companies Act, LLP, DPT-3, CSR, AGM" },
              { icon: "👷", title: "Labour Laws",  desc: "PF, ESIC, Gratuity, POSH, Bonus" },
              { icon: "🌏", title: "FEMA / FDI",   desc: "FC-GPR, ODI, Transfer Pricing, ECB" },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-3xl block mb-3">{f.icon}</span>
                <p className="text-slate-900 font-bold text-sm mb-1">{f.title}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section className="bg-white border-t border-slate-100 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">What People Say</p>
          <h2 className="text-center text-2xl font-extrabold text-slate-900 mb-10">Trusted by CAs, CSs & Business Owners</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "CA Priya Sharma",
                role: "Partner, S&P Associates · Mumbai",
                avatar: "P",
                color: "#1d4ed8",
                quote: "ComplianceSearch.in has become my first reference for every new client. Instead of explaining 20 different compliances from scratch, I just ask them to run the check. Saves 30 minutes per consultation.",
              },
              {
                name: "Rajan Mehta",
                role: "CFO · TechStart Solutions, Bengaluru",
                avatar: "R",
                color: "#7c3aed",
                quote: "We were a 15-person startup and had no idea about PF, ESIC, and ROC filings. This tool showed us exactly what applied to us — helped us avoid penalties in our very first year.",
              },
              {
                name: "CS Kavita Nair",
                role: "Practicing Company Secretary · Pune",
                avatar: "K",
                color: "#16a34a",
                quote: "The Compliance Calendar is brilliant. I recommend it to all my clients to track their due dates. The blog articles are high quality — my team reads them regularly.",
              },
            ].map(t => (
              <div key={t.name} className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col gap-4 hover:shadow-md transition-shadow">
                <div className="text-2xl text-slate-300">&ldquo;</div>
                <p className="text-slate-600 text-sm leading-relaxed flex-1 -mt-4">{t.quote}</p>
                <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
                    style={{ background: t.color }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ QUICK LINKS STRIP ══ */}
      <section className="bg-slate-900 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-slate-400 text-xs font-semibold uppercase tracking-widest mb-6">Quick Reference</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { href:"/gst-due-dates",              icon:"📊", title:"GST Due Dates",         desc:"FY 2025-26 complete calendar" },
              { href:"/income-tax-due-dates",       icon:"💰", title:"Income Tax Dates",     desc:"ITR, advance tax, TDS deadlines" },
              { href:"/roc-filing-due-dates",       icon:"📋", title:"ROC / MCA Dates",      desc:"AOC-4, MGT-7, ADT-1, DIR-3 KYC" },
              { href:"/tools/penalty-calculator",        icon:"🧮", title:"Penalty Calculator",   desc:"GST, TDS, ITR, PF penalties" },
              { href:"/tools/documents/annual-filing",   icon:"📑", title:"Annual Filing",       desc:"AOC-4 & MGT-7 attachments — all at once" },
              { href:"/tools/business-valuation",        icon:"📈", title:"Business Valuation",   desc:"DCF · SOTP · Listed · 46 Sectors" },
              { href:"/companies-act-compliance",        icon:"🏛️", title:"Companies Act Guide",  desc:"Annual checklist, CSR, directors" },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="bg-slate-800 rounded-2xl p-4 border border-slate-700 hover:border-blue-400 hover:bg-slate-750 transition-all group">
                <div className="text-2xl mb-2">{l.icon}</div>
                <p className="font-bold text-white text-sm group-hover:text-blue-300 transition">{l.title}</p>
                <p className="text-slate-400 text-xs mt-0.5">{l.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ POWERED BY STRIP ══ */}
      <section className="bg-amber-50 border-t border-amber-100 py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left">
          <p className="text-amber-800 text-sm font-medium">
            A product of <strong>Gee Bharat</strong> — India's office management platform
          </p>
          <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2 rounded-xl border transition hover:scale-105"
            style={{ background: "#fffbeb", borderColor: "#fcd34d", color: "#92400e" }}>
            🌐 Visit geebharat.com
          </a>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="bg-white border-t border-slate-200 px-5 py-5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <span className="text-slate-400 text-xs">© 2025 ComplianceSearch.in — For guidance only. Consult a CA / CS.</span>
            <div className="flex items-center gap-3">
              {[["Home","/"],["About","/about"],["Contact","/contact"],["Check","/check"]].map(([l,h]) => (
                <Link key={h} href={h} className="text-slate-400 hover:text-slate-700 text-xs transition">{l}</Link>
              ))}
            </div>
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
