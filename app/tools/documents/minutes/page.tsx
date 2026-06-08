"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const TYPES = [
  {
    id: "board",
    title: "Board Meeting Minutes",
    icon: "📋",
    desc: "Minutes of Board of Directors meeting — SS-1 compliant format with resolutions, attendance, quorum check.",
    tags: ["SS-1 Compliant", "Resolutions", "Auto Quorum"],
    href: "/tools/documents/minutes/board",
    available: true,
    color: "#1d4ed8",
    bg: "from-blue-50 to-indigo-50",
    border: "border-blue-200",
    btnColor: "bg-blue-600 hover:bg-blue-700",
  },
  {
    id: "agm",
    title: "AGM Minutes",
    icon: "🏛️",
    desc: "Annual General Meeting minutes — SS-2 compliant, shareholder attendance, dividend, accounts adoption, special resolutions.",
    tags: ["SS-2 Compliant", "Shareholders", "Dividend", "Special Resolutions"],
    href: "/tools/documents/minutes/agm",
    available: true,
    color: "#7c3aed",
    bg: "from-purple-50 to-violet-50",
    border: "border-purple-200",
    btnColor: "bg-purple-600 hover:bg-purple-700",
  },
  {
    id: "egm",
    title: "EGM Minutes",
    icon: "⚡",
    desc: "Extraordinary General Meeting — special resolutions, capital restructuring, major decisions.",
    tags: ["Special Resolution", "Capital", "Restructuring"],
    href: "#",
    available: false,
    color: "#b45309",
    bg: "from-amber-50 to-orange-50",
    border: "border-amber-200",
    btnColor: "bg-amber-200",
  },
  {
    id: "committee",
    title: "Committee Meeting Minutes",
    icon: "👥",
    desc: "Audit Committee, NRC, CSR Committee, Risk Committee — as per SEBI LODR and Companies Act.",
    tags: ["Audit Committee", "NRC", "CSR Committee"],
    href: "#",
    available: false,
    color: "#047857",
    bg: "from-emerald-50 to-teal-50",
    border: "border-emerald-200",
    btnColor: "bg-emerald-200",
  },
];

export default function MinutesPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="border-b border-slate-100 overflow-hidden relative"
        style={{ background: "linear-gradient(160deg,#eff6ff 0%,#f5f3ff 50%,#fafafa 100%)" }}>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none opacity-20"
          style={{ background: "radial-gradient(circle,#bfdbfe,transparent 70%)", transform: "translate(30%,-30%)" }} />
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-16 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full border mb-5"
            style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1e40af" }}>
            📝 Legal Document Generator
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Minutes of{" "}
            <span style={{ background: "linear-gradient(90deg,#1d4ed8,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Meeting
            </span>{" "}Generator
          </h1>
          <p className="text-slate-500 text-base max-w-2xl mx-auto">
            Generate legally formatted minutes — Companies Act 2013 &amp; Secretarial Standards (SS-1/SS-2) compliant.
            Auto-fill company details, attendance, quorum check, and resolution drafting.
          </p>
          <div className="flex items-center justify-center gap-6 mt-5 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><span className="text-green-500 font-bold">✓</span> SS-1 / SS-2 Format</span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5"><span className="text-green-500 font-bold">✓</span> MDS Excel Auto-fill</span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5"><span className="text-green-500 font-bold">✓</span> Print-ready PDF</span>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="max-w-5xl mx-auto px-4 py-12 w-full">
        <p className="text-center text-slate-400 text-xs font-semibold uppercase tracking-widest mb-8">
          Select Meeting Type
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {TYPES.map(t => (
            <div key={t.id}
              className={`rounded-2xl border-2 ${t.border} bg-gradient-to-br ${t.bg} p-6 flex flex-col gap-4 relative overflow-hidden transition-all ${t.available ? "hover:shadow-xl hover:-translate-y-1" : "opacity-75"}`}>

              {!t.available && (
                <div className="absolute top-4 right-4 bg-slate-700 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                  Coming Soon
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 bg-white shadow-sm">
                  {t.icon}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">{t.title}</h2>
                  <p className="text-slate-500 text-sm leading-relaxed mt-1">{t.desc}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {t.tags.map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 font-medium shadow-sm">
                    {tag}
                  </span>
                ))}
              </div>

              {t.available ? (
                <Link href={t.href}
                  className={`mt-auto inline-flex items-center justify-center gap-2 font-bold text-white text-sm px-6 py-3 rounded-xl transition-all hover:scale-105 shadow-md ${t.btnColor}`}>
                  Start Drafting →
                </Link>
              ) : (
                <button disabled
                  className="mt-auto inline-flex items-center justify-center gap-2 font-semibold text-slate-400 text-sm px-6 py-3 rounded-xl bg-slate-100 cursor-not-allowed">
                  Coming Soon
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 py-5 px-4 mt-auto">
        <div className="max-w-5xl mx-auto text-center text-xs text-slate-400">
          <Link href="/tools/documents" className="text-blue-500 hover:underline">← All Document Generators</Link>
          {" · "}© {new Date().getFullYear()} ComplianceSearch.in
        </div>
      </footer>
    </main>
  );
}
