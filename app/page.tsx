"use client";
import Link from "next/link";
import { useState } from "react";

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #050d1a 0%, #0a1f3d 40%, #0d2a52 70%, #0f1f40 100%)" }}>

      {/* ══ NAVBAR ══ */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/8" style={{ background: "rgba(5,13,26,0.85)", backdropFilter: "blur(16px)" }}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
              <span className="text-lg">⚖️</span>
            </div>
            <div className="leading-tight">
              <span className="text-white font-bold text-base tracking-tight">ComplianceSearch</span>
              <span className="text-amber-400 font-bold text-base">.in</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { href:"/",       label:"Home" },
              { href:"/check",  label:"Check Compliance" },
              { href:"/about",  label:"About Us" },
              { href:"/contact",label:"Contact" },
            ].map(n => (
              <Link key={n.href} href={n.href}
                className="text-slate-300 hover:text-white text-sm font-medium px-4 py-2 rounded-lg transition-all hover:bg-white/8">
                {n.label}
              </Link>
            ))}
            <div className="w-px h-5 bg-white/15 mx-2" />
            <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all border"
              style={{ background:"rgba(245,158,11,0.12)", borderColor:"rgba(245,158,11,0.3)", color:"#fbbf24" }}>
              <span>🌐</span> Gee Bharat
            </a>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-xl transition">
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/8 px-5 py-3 flex flex-col gap-1" style={{ background:"rgba(5,13,26,0.97)" }}>
            {[
              { href:"/",        label:"🏠 Home" },
              { href:"/check",   label:"✅ Check Compliance" },
              { href:"/about",   label:"ℹ️ About Us" },
              { href:"/contact", label:"📞 Contact" },
            ].map(n => (
              <Link key={n.href} href={n.href} onClick={() => setMenuOpen(false)}
                className="text-slate-300 hover:text-white text-sm py-2.5 px-3 rounded-lg hover:bg-white/8 transition">
                {n.label}
              </Link>
            ))}
            <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
              className="text-amber-400 font-semibold text-sm py-2.5 px-3 rounded-lg hover:bg-amber-400/10 transition mt-1 border border-amber-400/20">
              🌐 Gee Bharat →
            </a>
          </div>
        )}
      </nav>

      {/* ══ HERO ══ */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center relative overflow-hidden">
        {/* Background glow circles */}
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-10 pointer-events-none" style={{ background:"radial-gradient(circle,#3b82f6,transparent 70%)", filter:"blur(40px)" }} />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full opacity-8 pointer-events-none" style={{ background:"radial-gradient(circle,#f59e0b,transparent 70%)", filter:"blur(50px)" }} />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full mb-8 border"
          style={{ background:"rgba(59,130,246,0.12)", borderColor:"rgba(59,130,246,0.25)", color:"#93c5fd" }}>
          <span>🇮🇳</span>
          <span>Covers Central, State &amp; Industry-Specific Compliances</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight">
          Know Every<br />
          <span style={{ background:"linear-gradient(90deg,#f59e0b,#fbbf24,#f97316)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            Compliance
          </span>
          <br />
          <span className="text-4xl md:text-5xl font-bold text-slate-200">Your Business Needs</span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mb-4 leading-relaxed">
          Answer a few questions — get an instant, categorized list of all applicable
          licenses, registrations, tax filings, and statutory compliances.
        </p>
        <p className="text-slate-500 text-sm mb-10 flex flex-wrap justify-center gap-x-3 gap-y-1">
          {["Income Tax","GST","MCA/ROC","Labour Laws","FSSAI","FEMA","CSR","DPDP Act"].map((t,i,a) => (
            <span key={t} className="flex items-center gap-3">
              <span className="text-slate-400">{t}</span>
              {i < a.length-1 && <span className="text-slate-600">·</span>}
            </span>
          ))}
        </p>

        <Link href="/check"
          className="inline-flex items-center gap-3 font-bold text-gray-900 text-lg px-10 py-4 rounded-2xl transition-all transform hover:scale-105 shadow-2xl mb-3"
          style={{ background:"linear-gradient(135deg,#f59e0b,#f97316)", boxShadow:"0 20px 40px rgba(245,158,11,0.35)" }}>
          Start Compliance Check →
        </Link>
        <p className="text-slate-500 text-sm flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="text-green-400">✓</span> Free</span>
          <span className="text-slate-600">·</span>
          <span className="flex items-center gap-1"><span className="text-green-400">✓</span> 2 minutes</span>
          <span className="text-slate-600">·</span>
          <span className="flex items-center gap-1"><span className="text-green-400">✓</span> Instant results</span>
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mt-16 max-w-md w-full">
          {[
            { n:"77+",   label:"Compliance Rules" },
            { n:"11",    label:"Categories" },
            { n:"100%",  label:"India-Specific" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 border text-center"
              style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.08)" }}>
              <div className="text-3xl font-extrabold mb-1" style={{ background:"linear-gradient(135deg,#f59e0b,#fbbf24)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{s.n}</div>
              <div className="text-slate-400 text-xs font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ FEATURES STRIP ══ */}
      <div className="border-t border-white/6 py-10 px-4" style={{ background:"rgba(255,255,255,0.025)" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { icon:"🏛️", title:"Central Tax",  desc:"Income Tax, TDS, GST, Advance Tax" },
            { icon:"📋", title:"MCA / ROC",    desc:"Companies Act, LLP, DPT-3, CSR, AGM" },
            { icon:"👷", title:"Labour Laws",  desc:"PF, ESIC, Gratuity, POSH, Bonus" },
            { icon:"🌏", title:"FEMA / FDI",   desc:"FC-GPR, ODI, Transfer Pricing, ECB" },
          ].map(f => (
            <div key={f.title} className="flex items-start gap-3 rounded-xl p-3 transition hover:bg-white/5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xl border" style={{ background:"rgba(255,255,255,0.06)", borderColor:"rgba(255,255,255,0.1)" }}>{f.icon}</div>
              <div>
                <p className="text-white font-semibold text-sm">{f.title}</p>
                <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ FOOTER ══ */}
      <footer className="border-t border-white/6 px-5 py-5" style={{ background:"rgba(0,0,0,0.3)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p className="text-slate-500 text-xs">© 2025 ComplianceSearch.in — For guidance only. Consult a CA / CS.</p>
            <div className="flex items-center gap-3">
              {[["Home","/"],["About","/about"],["Contact","/contact"],["Check","/check"]].map(([l,h]) => (
                <Link key={h} href={h} className="text-slate-500 hover:text-slate-300 text-xs transition">{l}</Link>
              ))}
            </div>
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
