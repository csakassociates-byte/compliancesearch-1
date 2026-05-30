"use client";
import Link from "next/link";
import { useState } from "react";

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex flex-col">

      {/* ── Navbar ── */}
      <nav className="px-6 py-4 flex items-center justify-between border-b border-white/10 relative z-50">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-2xl">⚖️</span>
          <span className="text-white font-bold text-xl tracking-tight">ComplianceSearch</span>
          <span className="text-blue-300 text-xs font-medium bg-blue-500/20 px-2 py-0.5 rounded-full">.in</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          <Link href="/"        className="text-blue-200 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/10 transition">Home</Link>
          <Link href="/check"   className="text-blue-200 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/10 transition">Check Compliance</Link>
          <Link href="/about"   className="text-blue-200 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/10 transition">About Us</Link>
          <Link href="/contact" className="text-blue-200 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/10 transition">Contact</Link>
          <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
            className="ml-3 text-xs bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 hover:bg-yellow-400/30 px-3 py-1.5 rounded-full font-semibold transition flex items-center gap-1.5">
            🌐 Gee Bharat
          </a>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white p-2 rounded-lg hover:bg-white/10">
          {menuOpen ? "✕" : "☰"}
        </button>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="absolute top-full left-0 right-0 bg-slate-900/95 backdrop-blur border-b border-white/10 px-6 py-4 flex flex-col gap-2 md:hidden">
            <Link href="/"        onClick={() => setMenuOpen(false)} className="text-blue-200 hover:text-white text-sm font-medium py-2 border-b border-white/5">🏠 Home</Link>
            <Link href="/check"   onClick={() => setMenuOpen(false)} className="text-blue-200 hover:text-white text-sm font-medium py-2 border-b border-white/5">✅ Check Compliance</Link>
            <Link href="/about"   onClick={() => setMenuOpen(false)} className="text-blue-200 hover:text-white text-sm font-medium py-2 border-b border-white/5">ℹ️ About Us</Link>
            <Link href="/contact" onClick={() => setMenuOpen(false)} className="text-blue-200 hover:text-white text-sm font-medium py-2 border-b border-white/5">📞 Contact</Link>
            <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer" className="text-yellow-300 text-sm font-semibold py-2">🌐 Gee Bharat</a>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-medium px-4 py-2 rounded-full mb-8">
          <span>🇮🇳</span>
          <span>Covers Central, State &amp; Industry-Specific Compliances</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
          Know Every Compliance<br />
          <span className="text-yellow-400">Your Business Needs</span>
        </h1>

        <p className="text-blue-200 text-lg md:text-xl max-w-2xl mb-4">
          Answer a few questions about your business — get an instant, categorized list of all applicable
          licenses, registrations, tax filings, and statutory compliances.
        </p>
        <p className="text-blue-300 text-sm mb-10">
          Income Tax · GST · MCA/ROC · Labour Laws · FSSAI · Drug License · FEMA · CSR · DPDP Act and more
        </p>

        <Link
          href="/check"
          className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-xl px-12 py-5 rounded-2xl transition-all transform hover:scale-105 shadow-2xl inline-flex items-center gap-3"
        >
          Start Compliance Check →
        </Link>
        <p className="text-blue-300 text-sm mt-3">Free &nbsp;·&nbsp; 2 minutes &nbsp;·&nbsp; Instant results</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-10 mt-16 max-w-lg">
          {[
            { n: "77+", label: "Compliance Rules" },
            { n: "11",  label: "Categories" },
            { n: "100%", label: "India-Specific" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-bold text-yellow-400">{s.n}</div>
              <div className="text-blue-300 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Feature strip ── */}
      <div className="bg-white/10 backdrop-blur border-t border-white/10 px-4 py-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: "🏛️", title: "Central Tax", desc: "Income Tax, TDS, GST, Advance Tax" },
            { icon: "📋", title: "MCA / ROC",   desc: "Companies Act, LLP filings, AGM" },
            { icon: "👷", title: "Labour Laws", desc: "PF, ESIC, Bonus, Gratuity, POSH" },
            { icon: "🌏", title: "FEMA / FDI",  desc: "FC-GPR, ODI, Transfer Pricing, ECB" },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <span className="text-2xl">{f.icon}</span>
              <div>
                <p className="text-white font-semibold text-sm">{f.title}</p>
                <p className="text-blue-300 text-xs mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-blue-300 text-xs">
              For guidance purposes only. Always consult a qualified CA / CS for compliance decisions.
            </p>
            <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
              <Link href="/" className="text-blue-400 hover:text-white text-xs transition">Home</Link>
              <Link href="/about" className="text-blue-400 hover:text-white text-xs transition">About</Link>
              <Link href="/contact" className="text-blue-400 hover:text-white text-xs transition">Contact</Link>
              <Link href="/check" className="text-blue-400 hover:text-white text-xs transition">Check</Link>
            </div>
          </div>
          <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full transition">
            <span className="text-base">🌐</span>
            <span>Powered by <span className="text-yellow-300 font-bold">Gee Bharat</span></span>
          </a>
        </div>
      </footer>

    </main>
  );
}
