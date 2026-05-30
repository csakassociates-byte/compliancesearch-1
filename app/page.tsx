import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex flex-col">
      {/* Navbar */}
      <nav className="px-8 py-5 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">⚖️</span>
          <span className="text-white font-bold text-xl tracking-tight">ComplianceCheck</span>
          <span className="text-blue-300 text-sm font-medium">India</span>
        </div>
        <span className="text-blue-300 text-sm hidden md:block">India-Specific Business Compliance Tool</span>
      </nav>

      {/* Hero */}
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
          Income Tax · GST · MCA/ROC · Labour Laws · FSSAI · Drug License · Factory · PCB and more
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
            { n: "40+", label: "Compliance Rules" },
            { n: "9", label: "Categories" },
            { n: "100%", label: "India-Specific" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-bold text-yellow-400">{s.n}</div>
              <div className="text-blue-300 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature strip */}
      <div className="bg-white/10 backdrop-blur border-t border-white/10 px-4 py-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: "🏛️", title: "Central Tax", desc: "Income Tax, TDS, GST, Advance Tax" },
            { icon: "📋", title: "MCA / ROC", desc: "Companies Act, LLP filings, AGM" },
            { icon: "👷", title: "Labour Laws", desc: "PF, ESIC, Bonus, Gratuity, POSH" },
            { icon: "📜", title: "Licenses", desc: "FSSAI, Drug, Factory, PCB NOC" },
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

      <div className="text-center py-4 text-blue-400 text-xs">
        For guidance purposes only. Always consult a qualified CA / CS for compliance decisions.
      </div>
    </main>
  );
}
