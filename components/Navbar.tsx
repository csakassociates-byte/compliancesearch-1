"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import SearchModal from "./SearchModal";
import { useSession, signOut } from "next-auth/react";

/* ─── Tools Dropdown Data ─────────────────────────────────────── */
const TOOLS = [
  {
    href: "/check",
    icon: "⚖️",
    label: "Know Your Compliance",
    desc: "77+ rules across all categories",
    color: "text-blue-600 bg-blue-50",
  },
  {
    href: "/tools/business-valuation",
    icon: "📊",
    label: "Company Valuation",
    desc: "DCF · SOTP · DDM · 46 sectors",
    color: "text-purple-600 bg-purple-50",
    badge: "New",
  },
  {
    href: "/tools/documents/bank-resolution",
    icon: "🏦",
    label: "Bank Resolution",
    desc: "Board resolution for bank account opening",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    href: "/tools/documents/share-certificate",
    icon: "📜",
    label: "Share Certificate",
    desc: "Form SH-1 share certificate generator",
    color: "text-amber-600 bg-amber-50",
  },
  {
    href: "/tools/documents/share-transfer",
    icon: "🔄",
    label: "Share Transfer",
    desc: "Form SH-4 securities transfer form",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    href: "/tools/documents/minutes",
    icon: "📋",
    label: "Meeting Minutes",
    desc: "Board, AGM, EGM minutes generator",
    color: "text-blue-700 bg-blue-50",
    badge: "New",
  },
  {
    href: "/tools/penalty-calculator",
    icon: "🧮",
    label: "Penalty Calculator",
    desc: "GST, TDS, ITR, PF penalties",
    color: "text-red-600 bg-red-50",
  },
  {
    href: "/gst-due-dates",
    icon: "📅",
    label: "GST Due Dates",
    desc: "FY 2025-26 complete calendar",
    color: "text-green-600 bg-green-50",
  },
  {
    href: "/income-tax-due-dates",
    icon: "💰",
    label: "Income Tax Due Dates",
    desc: "ITR, advance tax, TDS deadlines",
    color: "text-blue-600 bg-blue-50",
  },
  {
    href: "/roc-filing-due-dates",
    icon: "📋",
    label: "ROC / MCA Filing Dates",
    desc: "AOC-4, MGT-7, ADT-1, DIR-3 KYC",
    color: "text-purple-600 bg-purple-50",
  },
  {
    href: "/calendar",
    icon: "🗓️",
    label: "Compliance Calendar",
    desc: "All statutory deadlines in one view",
    color: "text-orange-600 bg-orange-50",
  },
  {
    href: "/companies-act-compliance",
    icon: "🏛️",
    label: "Companies Act Guide",
    desc: "Annual checklist, CSR, Directors",
    color: "text-slate-700 bg-slate-100",
  },
];

const TOP_LINKS = [
  { href: "/",        label: "Home" },
  { href: "/blog",    label: "Blog" },
  { href: "/about",   label: "About" },
  { href: "/contact", label: "Contact Us" },
  { href: "/notice",  label: "Notice", badge: true },
];

export default function Navbar() {
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [toolsOpen,   setToolsOpen]   = useState(false);
  const [mobileTools, setMobileTools] = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const pathname  = usePathname();
  const toolsRef  = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  /* Ctrl+K → search */
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  /* Close tools dropdown on outside click */
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) setToolsOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-2">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: "linear-gradient(135deg,#1e40af,#1d4ed8)" }}>⚖️</div>
            <span className="text-slate-900 font-bold text-lg tracking-tight">ComplianceSearch</span>
            <span className="font-bold text-lg" style={{ color: "#d97706" }}>.in</span>
          </Link>

          {/* ── Desktop Nav ── */}
          <div className="hidden lg:flex items-center gap-0.5">

            {/* Home */}
            <Link href="/"
              className={`text-sm font-medium px-3 py-2 rounded-lg transition-all ${isActive("/")?"text-blue-700 bg-blue-50 font-semibold":"text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}>
              Home
            </Link>

            {/* Tools Dropdown */}
            <div ref={toolsRef} className="relative">
              <button
                onClick={() => setToolsOpen(o => !o)}
                onMouseEnter={() => setToolsOpen(true)}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-all ${
                  pathname.startsWith("/tools")||pathname==="/check"||pathname==="/calendar"||pathname.includes("due-dates")||pathname.includes("compliance-act")
                    ? "text-blue-700 bg-blue-50 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}>
                Tools
                <svg className={`w-3.5 h-3.5 transition-transform ${toolsOpen?"rotate-180":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="m6 9 6 6 6-6"/></svg>
              </button>

              {/* Dropdown Panel */}
              {toolsOpen && (
                <div
                  onMouseLeave={() => setToolsOpen(false)}
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-[520px] bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 z-50">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 px-2 pb-2">All Tools & Resources</p>
                  <div className="grid grid-cols-2 gap-1">
                    {TOOLS.map(t => (
                      <Link key={t.href} href={t.href} onClick={() => setToolsOpen(false)}
                        className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 ${t.color}`}>
                          {t.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition flex items-center gap-2">
                            {t.label}
                            {t.badge && <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">{t.badge}</span>}
                          </p>
                          <p className="text-xs text-slate-400 truncate">{t.desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Other Links */}
            {TOP_LINKS.filter(l => l.href !== "/").map(l => (
              <Link key={l.href} href={l.href}
                className={`relative text-sm font-medium px-3 py-2 rounded-lg transition-all ${
                  isActive(l.href) ? "text-blue-700 bg-blue-50 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}>
                {l.label}
                {l.badge && !isActive(l.href) && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </Link>
            ))}

            <div className="w-px h-5 bg-slate-200 mx-1.5" />

            {/* Search */}
            <button onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 text-sm text-slate-400 border border-slate-200 rounded-lg px-3 py-1.5 hover:border-blue-300 hover:text-blue-600 transition-all bg-slate-50 hover:bg-blue-50 mr-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <span className="hidden xl:inline text-xs">Search</span>
              <kbd className="hidden xl:flex items-center text-[10px] px-1.5 py-0.5 rounded border border-slate-200 font-mono text-slate-300">⌘K</kbd>
            </button>

            {/* Auth */}
            {session ? (
              <div className="relative group">
                <button className="flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {session.user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="max-w-[100px] truncate text-slate-700">{session.user?.name || session.user?.email}</span>
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-slate-200 shadow-xl p-1 hidden group-hover:block z-50">
                  <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">📊 Dashboard</Link>
                  <Link href="/dashboard/clients" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">🏢 My Clients</Link>
                  <button onClick={() => signOut({ callbackUrl: "/" })} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">🚪 Sign Out</button>
                </div>
              </div>
            ) : (
              <Link href="/auth/login"
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border transition-all hover:scale-105 bg-blue-600 text-white border-blue-600 hover:bg-blue-700">
                Sign In
              </Link>
            )}

            {/* Gee Bharat */}
            <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border transition-all hover:scale-105"
              style={{ background: "#fffbeb", borderColor: "#fde68a", color: "#92400e" }}>
              🌐 Gee Bharat
            </a>
          </div>

          {/* ── Mobile: search + hamburger ── */}
          <div className="lg:hidden flex items-center gap-2">
            <button onClick={() => setSearchOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
            <button onClick={() => setMenuOpen(o => !o)}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-700 text-xl transition">
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {menuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 px-4 py-3 flex flex-col gap-1 shadow-lg max-h-[80vh] overflow-y-auto">

            <Link href="/" onClick={() => setMenuOpen(false)}
              className={`text-sm font-medium py-2.5 px-3 rounded-lg transition ${isActive("/")?"text-blue-700 bg-blue-50 font-semibold":"text-slate-600 hover:bg-slate-50"}`}>
              Home
            </Link>

            {/* Mobile Tools Accordion */}
            <div>
              <button onClick={() => setMobileTools(o => !o)}
                className="w-full flex items-center justify-between text-sm font-medium py-2.5 px-3 rounded-lg text-slate-600 hover:bg-slate-50 transition">
                <span>Tools</span>
                <svg className={`w-4 h-4 transition-transform ${mobileTools?"rotate-180":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="m6 9 6 6 6-6"/></svg>
              </button>
              {mobileTools && (
                <div className="ml-3 mt-1 space-y-0.5">
                  {TOOLS.map(t => (
                    <Link key={t.href} href={t.href} onClick={() => { setMenuOpen(false); setMobileTools(false); }}
                      className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 transition">
                      <span className="text-base">{t.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{t.label}</p>
                        <p className="text-xs text-slate-400">{t.desc}</p>
                      </div>
                      {t.badge && <span className="ml-auto text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">{t.badge}</span>}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {TOP_LINKS.filter(l => l.href !== "/").map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 text-sm font-medium py-2.5 px-3 rounded-lg transition ${isActive(l.href)?"text-blue-700 bg-blue-50 font-semibold":"text-slate-600 hover:bg-slate-50"}`}>
                {l.label}
                {l.badge && <span className="w-2 h-2 rounded-full bg-red-500" />}
              </Link>
            ))}

            <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
              className="text-amber-700 font-semibold text-sm py-2.5 px-3 rounded-lg bg-amber-50 border border-amber-200 mt-1 transition">
              🌐 Gee Bharat →
            </a>
          </div>
        )}
      </nav>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
