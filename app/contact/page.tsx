import Link from "next/link";

const NAV = [
  { href:"/",        label:"Home" },
  { href:"/check",   label:"Check Compliance" },
  { href:"/about",   label:"About Us" },
  { href:"/contact", label:"Contact", active:true },
];

export default function ContactPage() {
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

      <div className="flex-1 max-w-3xl mx-auto px-4 py-16 w-full">

        {/* ── Page Header ── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full mb-5 border"
            style={{ background:"rgba(59,130,246,0.1)", borderColor:"rgba(59,130,246,0.25)", color:"#93c5fd" }}>
            <span>📞</span> Get in Touch
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Contact Us</h1>
          <p className="text-slate-400 text-lg">Questions, feedback, or compliance queries — we're here to help.</p>
        </div>

        {/* ── Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {/* Gee Bharat */}
          <div className="rounded-2xl p-6 border relative overflow-hidden"
            style={{ background:"linear-gradient(135deg,rgba(245,158,11,0.1),rgba(249,115,22,0.06))", borderColor:"rgba(245,158,11,0.25)" }}>
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none rounded-full"
              style={{ background:"radial-gradient(circle,#f59e0b,transparent)", transform:"translate(30%,-30%)" }} />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl border" style={{ background:"rgba(245,158,11,0.15)", borderColor:"rgba(245,158,11,0.3)" }}>🌐</div>
              <div>
                <p className="text-amber-400 text-[10px] font-bold uppercase tracking-widest">Platform</p>
                <p className="text-white font-bold text-lg leading-tight">Gee Bharat</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-5 leading-relaxed">
              ComplianceSearch.in is powered by Gee Bharat — your complete office management platform for attendance, tasks, and compliance.
            </p>
            <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl transition hover:scale-105"
              style={{ background:"linear-gradient(135deg,#f59e0b,#f97316)", color:"#0a0a0a" }}>
              🌐 Visit geebharat.com
            </a>
          </div>

          {/* Email */}
          <div className="rounded-2xl p-6 border"
            style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl border" style={{ background:"rgba(59,130,246,0.15)", borderColor:"rgba(59,130,246,0.3)" }}>✉️</div>
              <div>
                <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">Email</p>
                <p className="text-white font-bold text-lg leading-tight">Write to Us</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-5 leading-relaxed">
              For compliance queries, feedback, or to report an incorrect rule — send us a message anytime.
            </p>
            <a href="mailto:support@geebharat.com"
              className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl transition hover:scale-105 border"
              style={{ background:"rgba(59,130,246,0.15)", borderColor:"rgba(59,130,246,0.3)", color:"#93c5fd" }}>
              ✉️ support@geebharat.com
            </a>
          </div>
        </div>

        {/* ── CA Guidance ── */}
        <div className="rounded-2xl p-6 mb-6 border"
          style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.08)" }}>
          <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
            <span className="text-xl">🏛️</span> Need Professional CA / CS Guidance?
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-5">
            ComplianceSearch.in provides automated applicability analysis — but every business is unique.
            For filings, registrations, and complex compliance matters, always consult a qualified
            <strong className="text-slate-300"> Chartered Accountant (CA)</strong> or
            <strong className="text-slate-300"> Company Secretary (CS)</strong>.
          </p>
          <Link href="/check"
            className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl border transition hover:scale-105"
            style={{ background:"rgba(16,185,129,0.1)", borderColor:"rgba(16,185,129,0.25)", color:"#34d399" }}>
            ✅ Start Compliance Check →
          </Link>
        </div>

        {/* ── Quick Links ── */}
        <div className="rounded-2xl p-6 border"
          style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.06)" }}>
          <h3 className="text-white font-bold mb-4 flex items-center gap-2"><span>🔗</span> Quick Links</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { href:"/check",          label:"Start Compliance Check",       icon:"✅" },
              { href:"/about",          label:"About ComplianceSearch.in",    icon:"ℹ️" },
              { href:"/check/advanced", label:"Advanced Compliance Analysis", icon:"🔍" },
              { href:"https://geebharat.com", label:"Gee Bharat Platform",   icon:"🌐", ext:true },
            ].map(l => (
              l.ext
                ? <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-400 hover:text-white text-sm py-2.5 px-3 rounded-xl hover:bg-white/6 transition border border-transparent hover:border-white/8">
                    <span>{l.icon}</span> {l.label} <span className="ml-auto text-slate-600 text-xs">↗</span>
                  </a>
                : <Link key={l.href} href={l.href}
                    className="flex items-center gap-2 text-slate-400 hover:text-white text-sm py-2.5 px-3 rounded-xl hover:bg-white/6 transition border border-transparent hover:border-white/8">
                    <span>{l.icon}</span> {l.label}
                  </Link>
            ))}
          </div>
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
