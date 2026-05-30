"use client";
import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/",        label: "Home" },
  { href: "/check",   label: "Check Compliance" },
  { href: "/about",   label: "About Us" },
  { href: "/contact", label: "Contact" },
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen flex flex-col bg-white">

      {/* ══ NAVBAR ══ */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: "linear-gradient(135deg,#1e40af,#1d4ed8)" }}>
              ⚖️
            </div>
            <span className="text-slate-900 font-bold text-lg tracking-tight">ComplianceSearch</span>
            <span className="font-bold text-lg" style={{ color: "#d97706" }}>.in</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(n => (
              <Link key={n.href} href={n.href}
                className="text-slate-600 hover:text-slate-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-100 transition-all">
                {n.label}
              </Link>
            ))}
            <div className="w-px h-5 bg-slate-200 mx-2" />
            <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border transition-all hover:scale-105"
              style={{ background: "#fffbeb", borderColor: "#fde68a", color: "#92400e" }}>
              🌐 Gee Bharat
            </a>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-700 text-xl transition">
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-5 py-3 flex flex-col gap-1 shadow-lg">
            {NAV_LINKS.map(n => (
              <Link key={n.href} href={n.href} onClick={() => setMenuOpen(false)}
                className="text-slate-600 hover:text-slate-900 text-sm font-medium py-2.5 px-3 rounded-lg hover:bg-slate-50 transition">
                {n.label}
              </Link>
            ))}
            <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
              className="text-amber-700 font-semibold text-sm py-2.5 px-3 rounded-lg bg-amber-50 border border-amber-200 mt-1 transition">
              🌐 Gee Bharat →
            </a>
          </div>
        )}
      </nav>

      {/* ══ HERO ══ */}
      <section style={{ background: "linear-gradient(160deg,#eff6ff 0%,#f0f9ff 40%,#fafafa 100%)" }} className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle,#bfdbfe,transparent 70%)", transform: "translate(30%,-30%)" }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-15 pointer-events-none" style={{ background: "radial-gradient(circle,#fde68a,transparent 70%)", transform: "translate(-30%,30%)" }} />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full mb-8 border"
          style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}>
          <span>🇮🇳</span> Covers Central, State &amp; Industry-Specific Compliances
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-5 leading-[1.1] tracking-tight">
          Know Every<br />
          <span style={{ background: "linear-gradient(90deg,#1d4ed8,#2563eb,#0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Compliance
          </span>
          <br />
          <span className="text-slate-700 text-4xl md:text-5xl font-bold">Your Business Needs</span>
        </h1>

        <p className="text-slate-500 text-lg md:text-xl max-w-2xl mb-4 leading-relaxed">
          Answer a few questions — get an instant, categorized list of all applicable
          licenses, registrations, tax filings, and statutory compliances.
        </p>

        <p className="text-slate-400 text-sm mb-10 flex flex-wrap justify-center gap-x-2">
          {["Income Tax","GST","MCA/ROC","Labour Laws","FSSAI","FEMA","CSR","DPDP Act"].map((t, i, a) => (
            <span key={t} className="flex items-center gap-2">
              <span>{t}</span>
              {i < a.length - 1 && <span className="text-slate-300">·</span>}
            </span>
          ))}
        </p>

        <Link href="/check"
          className="inline-flex items-center gap-3 font-bold text-white text-lg px-10 py-4 rounded-2xl transition-all hover:scale-105 mb-3 shadow-xl"
          style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", boxShadow: "0 16px 40px rgba(29,78,216,0.35)" }}>
          Start Compliance Check →
        </Link>

        <p className="text-slate-400 text-sm flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="text-green-500">✓</span> Free</span>
          <span className="text-slate-300">·</span>
          <span className="flex items-center gap-1"><span className="text-green-500">✓</span> 2 minutes</span>
          <span className="text-slate-300">·</span>
          <span className="flex items-center gap-1"><span className="text-green-500">✓</span> Instant results</span>
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-5 mt-16 max-w-md w-full">
          {[
            { n: "77+",  label: "Compliance Rules" },
            { n: "11",   label: "Categories" },
            { n: "100%", label: "India-Specific" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-5 bg-white border border-slate-200 shadow-sm text-center">
              <div className="text-3xl font-extrabold mb-1" style={{ color: "#1d4ed8" }}>{s.n}</div>
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
