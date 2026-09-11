import Link from "next/link";
import Navbar from "@/components/Navbar";
import AnnualFilingSplash from "@/components/AnnualFilingSplash";
import HomeEngagementPopup from "@/components/HomeEngagementPopup";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SUPER_USER_EMAIL } from "@/lib/tools-config";

const LOCKED_HREFS = new Set([
  "/tools/documents/minutes/agm",
  "/tools/penalty-calculator",
  "/tools/business-valuation",
]);

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const isSuperUser = session?.user?.email === SUPER_USER_EMAIL;
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <AnnualFilingSplash />

      {/* ══ HERO ══ */}
      <section
        style={{ background: "linear-gradient(160deg,#eff6ff 0%,#f5f3ff 40%,#fafafa 100%)" }}
        className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center relative overflow-hidden"
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle,#bfdbfe,transparent 70%)", transform: "translate(30%,-30%)" }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-15 pointer-events-none" style={{ background: "radial-gradient(circle,#ddd6fe,transparent 70%)", transform: "translate(-30%,30%)" }} />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full mb-6 border uppercase tracking-widest"
          style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}>
          <span>🇮🇳</span> India&apos;s Most Complete CA &amp; CS Platform
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-4 leading-tight tracking-tight">
          Everything a CA &amp; CS Needs —{" "}
          <span style={{ background: "linear-gradient(90deg,#1d4ed8,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            In One Place.
          </span>
        </h1>
        <p className="text-slate-700 text-lg md:text-2xl max-w-2xl mb-2 leading-relaxed font-bold">
          Compliance Checks · Annual Filings · Board Minutes · Business Valuation
        </p>
        <p className="text-slate-500 text-base md:text-xl max-w-2xl mb-10 font-semibold">
          Done in minutes. Not hours.
        </p>

        {/* 3 CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <Link href="/check"
            className="inline-flex items-center gap-2 font-bold text-white text-sm px-6 py-3 rounded-2xl transition-all hover:scale-105 shadow-lg"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", boxShadow: "0 10px 28px rgba(29,78,216,0.28)" }}>
            ✅ Start Compliance Check
          </Link>
          <Link href="/tools/corporate-action-kit"
            className="inline-flex items-center gap-2 font-bold text-white text-sm px-6 py-3 rounded-2xl transition-all hover:scale-105 shadow-lg"
            style={{ background: "linear-gradient(135deg,#4f46e5,#4338ca)", boxShadow: "0 10px 28px rgba(79,70,229,0.28)" }}>
            📋 Corporate Action Kit
          </Link>
          <Link href="/tools/business-valuation"
            className="inline-flex items-center gap-2 font-bold text-slate-700 text-sm px-6 py-3 rounded-2xl border-2 border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all">
            📊 Value My Business
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl w-full">
          {[
            { n: "10+",  label: "Free Tools",           color: "#1d4ed8" },
            { n: "17",   label: "Corporate Actions",     color: "#4f46e5" },
            { n: "77+",  label: "Compliance Rules",      color: "#1d4ed8" },
            { n: "50+",  label: "Document Types",        color: "#4f46e5" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 bg-white border border-slate-200 shadow-sm text-center hover:shadow-md transition">
              <div className="text-2xl font-extrabold mb-0.5" style={{ color: s.color }}>{s.n}</div>
              <div className="text-slate-500 text-xs font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ ALL TOOLS GRID ══ */}
      <section className="bg-slate-50 border-t border-slate-100 py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">Platform</p>
          <h2 className="text-center text-2xl font-extrabold text-slate-900 mb-10">All Tools — Right Here</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: "✅", title: "Compliance Checker",
                sub: "77+ rules · 11 categories · 2 minutes",
                desc: "Find every compliance your business needs — GST, PF, ROC, FSSAI, Labour Laws and more.",
                href: "/check",
                badge: "Most Used",
                badgeColor: { bg: "#dbeafe", text: "#1d4ed8" },
                iconBg: "linear-gradient(135deg,#1d4ed8,#2563eb)",
              },
              {
                icon: "📋", title: "Corporate Action Kit",
                sub: "10 live tools · Board, AGM, Director, Auditor",
                desc: "Generate the complete document package for any corporate action — minutes, resolutions, ROC guides.",
                href: "/tools/corporate-action-kit",
                badge: "10 Live",
                badgeColor: { bg: "#e0e7ff", text: "#4338ca" },
                iconBg: "linear-gradient(135deg,#4f46e5,#4338ca)",
              },
              {
                icon: "📑", title: "Annual Filing (AOC-4 / MGT-7)",
                sub: "Section 137 / 92 · FY 2025-26",
                desc: "Generate all AOC-4 & MGT-7A attachments at once — Directors' Report, Audit Report, and more.",
                href: "/tools/documents/annual-filing",
                badge: "Live",
                badgeColor: { bg: "#dcfce7", text: "#15803d" },
                iconBg: "linear-gradient(135deg,#059669,#047857)",
              },
              {
                icon: "🏦", title: "Bank Resolution",
                sub: "Section 179(3)(d) · All banks accepted",
                desc: "Board resolution for account opening, signatory change, or CC/OD limit — ready in minutes.",
                href: "/tools/documents/bank-resolution",
                badge: "Live",
                badgeColor: { bg: "#cffafe", text: "#0e7490" },
                iconBg: "linear-gradient(135deg,#0891b2,#0e7490)",
              },
              {
                icon: "🏛️", title: "AGM / EGM Minutes",
                sub: "Section 96 / 100 · SS-1 Compliant",
                desc: "Annual General Meeting and Extraordinary General Meeting minutes with all statutory resolutions.",
                href: "/tools/documents/minutes/agm",
                badge: "Live",
                badgeColor: { bg: "#f3e8ff", text: "#7e22ce" },
                iconBg: "linear-gradient(135deg,#9333ea,#7e22ce)",
              },
              {
                icon: "🧮", title: "MCA Penalty Calculator",
                sub: "AOC-4 · MGT-7 · DIR-3 KYC · Late fees",
                desc: "Calculate late filing fees for MCA forms — slab-wise breakdown as per Companies Act 2013.",
                href: "/tools/penalty-calculator",
                badge: "Live",
                badgeColor: { bg: "#fee2e2", text: "#dc2626" },
                iconBg: "linear-gradient(135deg,#dc2626,#991b1b)",
              },
              {
                icon: "🔄", title: "Share Transfer",
                sub: "Section 56 · SH-4 Transfer Deed",
                desc: "SH-4 instrument of transfer, board resolution approving transfer, share register update.",
                href: "/tools/documents/share-transfer",
                badge: "Live",
                badgeColor: { bg: "#ffedd5", text: "#c2410c" },
                iconBg: "linear-gradient(135deg,#ea580c,#c2410c)",
              },
              {
                icon: "📜", title: "Share Certificate",
                sub: "Section 46 · SH-1 Format",
                desc: "Issue or duplicate share certificates in SH-1 format with board resolution and register update.",
                href: "/tools/documents/share-certificate",
                badge: "Live",
                badgeColor: { bg: "#ffe4e6", text: "#be123c" },
                iconBg: "linear-gradient(135deg,#e11d48,#be123c)",
              },
              {
                icon: "📊", title: "Business Valuation",
                sub: "7 methods · 46 sectors · DCF · EBITDA",
                desc: "Instant business valuation using 7 investment-banking methods for startups to large companies.",
                href: "/tools/business-valuation",
                badge: "Free",
                badgeColor: { bg: "#f3e8ff", text: "#7c3aed" },
                iconBg: "linear-gradient(135deg,#7c3aed,#6d28d9)",
              },
            ].map(t => {
              const isLocked = !isSuperUser && LOCKED_HREFS.has(t.href);
              return (
                <Link key={t.title} href={t.href}
                  className={`bg-white rounded-2xl border p-5 flex flex-col gap-3 group transition-all ${isLocked ? "border-slate-200 opacity-70 cursor-default" : "border-slate-200 hover:shadow-xl hover:border-slate-300 hover:-translate-y-0.5"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm ${isLocked ? "grayscale" : ""}`}
                      style={{ background: t.iconBg }}>
                      {t.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-slate-800 text-sm leading-tight group-hover:text-blue-700 transition-colors">{t.title}</h3>
                        {isLocked ? (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: "#f1f5f9", color: "#64748b" }}>
                            🔒 Coming Soon
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: t.badgeColor.bg, color: t.badgeColor.text }}>
                            {isSuperUser && LOCKED_HREFS.has(t.href) ? "🔓 Admin" : t.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{t.sub}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{t.desc}</p>
                  {isLocked ? (
                    <span className="text-xs font-bold text-slate-400 inline-block mt-auto">Coming Soon</span>
                  ) : (
                    <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform inline-block mt-auto">Open →</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ CORPORATE ACTION KIT SPOTLIGHT ══ */}
      <section className="px-4 py-14" style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/10 border border-white/20 rounded-3xl overflow-hidden flex flex-col md:flex-row">

            {/* Left — copy */}
            <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full mb-4 self-start"
                style={{ background: "rgba(255,255,255,0.15)", color: "#a5b4fc", border: "1px solid rgba(255,255,255,0.2)" }}>
                ⚡ 10 Live Tools
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-3">
                Every document a CS needs —<br />
                <span style={{ color: "#a5b4fc" }}>one kit, one click.</span>
              </h2>
              <p className="text-white/70 text-sm md:text-base leading-relaxed mb-5">
                Director appointment, auditor appointment, board minutes, AGM, EGM, share transfer, bank resolution, annual filing — generate the complete document package in minutes. Always free.
              </p>
              <div className="flex flex-wrap gap-2 mb-7">
                {["Board Minutes","AGM Minutes","EGM Minutes","Director Appointment","Auditor Appointment","Bank Resolution","Share Transfer","Share Certificate","Annual Filing","Committee Meeting"].map(d => (
                  <span key={d} className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(255,255,255,0.1)", color: "#c7d2fe", border: "1px solid rgba(255,255,255,0.15)" }}>
                    {d}
                  </span>
                ))}
              </div>
              <Link href="/tools/corporate-action-kit"
                className="inline-flex items-center justify-center gap-2 font-bold text-slate-900 text-sm px-7 py-3.5 rounded-2xl transition-all hover:scale-105 self-start"
                style={{ background: "#ffffff" }}>
                Explore Corporate Action Kit →
              </Link>
            </div>

            {/* Right — stats */}
            <div className="md:w-56 flex-shrink-0 flex flex-col justify-center gap-6 px-8 py-8"
              style={{ background: "rgba(255,255,255,0.05)", borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
              {[
                { n: "10",   label: "Live tools",      sub: "Ready to use now" },
                { n: "50+",  label: "Document types",  sub: "Generated instantly" },
                { n: "Free", label: "Always",          sub: "No login required" },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-3xl font-extrabold text-white">{s.n}</div>
                  <div className="text-indigo-200 text-xs font-bold mt-0.5">{s.label}</div>
                  <div className="text-indigo-300/60 text-xs mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section className="bg-white border-t border-slate-100 py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">FAQ</p>
          <h2 className="text-center text-2xl font-extrabold text-slate-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {([
              {
                q: "Which compliances apply to my business in India?",
                a: "It depends on your business type, turnover, sector, and employee count. ComplianceSearch.in checks 77+ rules — GST, Income Tax, PF/ESIC, FSSAI, Factories Act, FEMA, CSR and more — and tells you exactly which ones apply. Answer 5 questions and get your personalised compliance list in 2 minutes.",
              },
              {
                q: "What documents are needed for director appointment in a private limited company?",
                a: "For appointing a director under Section 161, Companies Act 2013, you need: (1) SS-1 compliant Board Notice (7 days before meeting), (2) Board Resolution, (3) DIR-2 — Consent to Act as Director, (4) DIR-8 — Non-disqualification declaration, and (5) DIR-12 ROC filing within 30 days. ComplianceSearch.in generates all 5 documents instantly.",
              },
              {
                q: "What is the due date for AOC-4 and MGT-7A filing?",
                a: "AOC-4 (financial statements) must be filed within 30 days of AGM under Section 137. MGT-7A (annual return for OPCs and small companies) must be filed within 60 days of end of financial year. For FY 2025-26, if AGM is held by 30 September 2026, AOC-4 is due by 30 October 2026. Use the MCA Penalty Calculator to compute late filing fees.",
              },
              {
                q: "Is ComplianceSearch.in free to use?",
                a: "Yes, completely free. The Compliance Checker, Corporate Action Kit (10 live tools), Annual Filing Generator, MCA Penalty Calculator, Business Valuation tool — all tools on ComplianceSearch.in are free. No login required for most tools.",
              },
              {
                q: "How is this compliance checker different from general compliance guides?",
                a: "Unlike generic articles, ComplianceSearch.in personalises results based on your company type (Pvt Ltd, OPC, LLP, Proprietorship), industry, employee count, turnover, and specific business activities. You get only the compliance that actually applies to your business — not a generic 50-item checklist.",
              },
            ] as { q: string; a: string }[]).map(({ q, a }) => (
              <div key={q} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="font-extrabold text-slate-800 text-sm mb-2">{q}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{a}</p>
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
              { href: "/gst-due-dates",                      icon: "📊", title: "GST Due Dates",        desc: "FY 2025-26 complete calendar" },
              { href: "/income-tax-due-dates",               icon: "💰", title: "Income Tax Dates",     desc: "ITR, advance tax, TDS deadlines" },
              { href: "/roc-filing-due-dates",               icon: "📋", title: "ROC / MCA Dates",      desc: "AOC-4, MGT-7, ADT-1, DIR-3 KYC" },
              { href: "/tools/penalty-calculator",           icon: "🧮", title: "Penalty Calculator",   desc: "Late filing fees — all MCA forms" },
              { href: "/tools/documents/annual-filing",      icon: "📑", title: "Annual Filing",        desc: "AOC-4 & MGT-7A attachments" },
              { href: "/tools/corporate-action-kit",         icon: "⚡", title: "Corporate Action Kit", desc: "10 live tools · Board, AGM, Director" },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="bg-slate-800 rounded-2xl p-4 border border-slate-700 hover:border-indigo-400 hover:bg-slate-750 transition-all group">
                <div className="text-2xl mb-2">{l.icon}</div>
                <p className="font-bold text-white text-sm group-hover:text-indigo-300 transition">{l.title}</p>
                <p className="text-slate-400 text-xs mt-0.5">{l.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <HomeEngagementPopup />
    </main>
  );
}
