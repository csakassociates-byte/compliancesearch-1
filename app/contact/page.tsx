import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us — ComplianceSearch.in",
  description:
    "Get in touch with ComplianceSearch.in for compliance queries, feedback, or support. Powered by Gee Bharat — India's office management platform. Email: csakassociates@gmail.com",
  keywords: [
    "contact compliance checker india", "compliance support india",
    "business compliance help india", "csakassociates", "gee bharat contact",
  ],
  openGraph: {
    title: "Contact ComplianceSearch.in — Business Compliance Help India",
    description: "Reach out for compliance queries, feedback, or support. Powered by Gee Bharat.",
    url: "https://compliancesearch.in/contact",
  },
  alternates: { canonical: "https://compliancesearch.in/contact" },
};

const NAV = [
  { href: "/",        label: "Home" },
  { href: "/check",   label: "Check Compliance" },
  { href: "/about",   label: "About Us" },
  { href: "/contact", label: "Contact", active: true },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: "linear-gradient(135deg,#1e40af,#1d4ed8)" }}>⚖️</div>
            <span className="text-slate-900 font-bold text-lg tracking-tight">ComplianceSearch</span>
            <span className="font-bold text-lg" style={{ color: "#d97706" }}>.in</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {NAV.map(n => (
              <Link key={n.href} href={n.href}
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${n.active ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}>
                {n.label}
              </Link>
            ))}
            <div className="w-px h-5 bg-slate-200 mx-2" />
            <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border transition hover:scale-105"
              style={{ background: "#fffbeb", borderColor: "#fde68a", color: "#92400e" }}>
              🌐 Gee Bharat
            </a>
          </div>
          <Link href="/" className="md:hidden text-slate-500 text-xs hover:text-slate-800">← Home</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="border-b border-slate-100 py-14 px-4 text-center" style={{ background: "linear-gradient(160deg,#eff6ff 0%,#f0f9ff 50%,#fafafa 100%)" }}>
        <div className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full mb-5 border"
          style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}>
          📞 Get in Touch
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">Contact Us</h1>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">Questions, feedback, or compliance queries — we&apos;re here to help.</p>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-12 w-full space-y-5">

        {/* ── Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Gee Bharat card */}
          <div className="rounded-2xl p-6 border border-amber-200 bg-amber-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-xl">🌐</div>
              <div>
                <p className="text-amber-600 text-[10px] font-bold uppercase tracking-widest">Platform</p>
                <p className="text-slate-900 font-bold text-lg leading-tight">Gee Bharat</p>
              </div>
            </div>
            <p className="text-slate-600 text-sm mb-5 leading-relaxed">
              ComplianceSearch.in is powered by Gee Bharat — your complete office management platform for attendance, tasks, and compliance.
            </p>
            <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-white border border-amber-300 transition hover:scale-105 shadow-sm">
              🌐 Visit geebharat.com
            </a>
          </div>

          {/* Email card */}
          <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-xl">✉️</div>
              <div>
                <p className="text-blue-500 text-[10px] font-bold uppercase tracking-widest">Email</p>
                <p className="text-slate-900 font-bold text-lg leading-tight">Write to Us</p>
              </div>
            </div>
            <p className="text-slate-600 text-sm mb-5 leading-relaxed">
              For compliance queries, feedback, or to report an incorrect rule — send us a message anytime.
            </p>
            <a href="mailto:support@geebharat.com"
              className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition hover:scale-105 shadow-sm">
              ✉️ support@geebharat.com
            </a>
          </div>
        </div>

        {/* ── CA Guidance ── */}
        <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm">
          <h3 className="text-slate-900 font-bold text-lg mb-3 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">🏛️</span>
            Need Professional CA / CS Guidance?
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed mb-5">
            ComplianceSearch.in provides automated applicability analysis — but every business is unique. For filings, registrations, and complex matters, always consult a qualified <strong>Chartered Accountant (CA)</strong> or <strong>Company Secretary (CS)</strong>.
          </p>
          <Link href="/check"
            className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition hover:scale-105">
            ✅ Start Compliance Check →
          </Link>
        </div>

        {/* ── Quick links ── */}
        <div className="rounded-2xl p-6 border border-slate-200 bg-slate-50">
          <h3 className="text-slate-900 font-bold mb-4 flex items-center gap-2"><span>🔗</span> Quick Links</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { href: "/check",           label: "Start Compliance Check",       icon: "✅" },
              { href: "/about",           label: "About ComplianceSearch.in",    icon: "ℹ️" },
              { href: "/check/advanced",  label: "Advanced Compliance Analysis", icon: "🔍" },
              { href: "https://geebharat.com", label: "Gee Bharat Platform",    icon: "🌐", ext: true },
            ].map(l => (
              l.ext
                ? <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm py-2.5 px-3 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition">
                    <span>{l.icon}</span> {l.label} <span className="ml-auto text-slate-400 text-xs">↗</span>
                  </a>
                : <Link key={l.href} href={l.href}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm py-2.5 px-3 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition">
                    <span>{l.icon}</span> {l.label}
                  </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-slate-200 px-5 py-5 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            {[["Home","/"],["About","/about"],["Contact","/contact"],["Check","/check"]].map(([l,h]) => (
              <Link key={h} href={h} className="text-slate-400 hover:text-slate-700 text-xs transition">{l}</Link>
            ))}
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
