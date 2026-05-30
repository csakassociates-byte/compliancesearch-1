import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex flex-col">

      {/* ── Navbar ── */}
      <nav className="px-6 py-4 flex items-center justify-between border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-2xl">⚖️</span>
          <span className="text-white font-bold text-xl tracking-tight">ComplianceSearch</span>
          <span className="text-blue-300 text-xs font-medium bg-blue-500/20 px-2 py-0.5 rounded-full">.in</span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          <Link href="/"        className="text-blue-200 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/10 transition">Home</Link>
          <Link href="/check"   className="text-blue-200 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/10 transition">Check Compliance</Link>
          <Link href="/about"   className="text-blue-200 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/10 transition">About Us</Link>
          <Link href="/contact" className="text-white text-sm font-semibold px-4 py-2 rounded-lg bg-white/10 transition">Contact</Link>
          <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
            className="ml-3 text-xs bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 hover:bg-yellow-400/30 px-3 py-1.5 rounded-full font-semibold transition flex items-center gap-1.5">
            🌐 Gee Bharat
          </a>
        </div>
        <div className="md:hidden">
          <Link href="/" className="text-blue-300 text-xs">← Home</Link>
        </div>
      </nav>

      {/* ── Page Content ── */}
      <div className="flex-1 max-w-3xl mx-auto px-4 py-14 w-full">

        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-medium px-4 py-2 rounded-full mb-5">
            <span>📞</span><span>Get in Touch</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Contact Us</h1>
          <p className="text-blue-200 text-lg">
            Questions, feedback, or compliance queries? We're here to help.
          </p>
        </div>

        {/* Contact cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {/* Gee Bharat */}
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-yellow-400/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🌐</span>
              <div>
                <p className="text-yellow-300 text-xs font-semibold uppercase tracking-wider">Platform</p>
                <p className="text-white font-bold text-lg">Gee Bharat</p>
              </div>
            </div>
            <p className="text-blue-200 text-sm mb-4 leading-relaxed">
              ComplianceSearch.in is powered by Gee Bharat — your complete office management platform.
            </p>
            <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-sm px-5 py-2.5 rounded-xl transition">
              🌐 Visit geebharat.com
            </a>
          </div>

          {/* General contact */}
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">✉️</span>
              <div>
                <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider">Email</p>
                <p className="text-white font-bold text-lg">Write to Us</p>
              </div>
            </div>
            <p className="text-blue-200 text-sm mb-4 leading-relaxed">
              For compliance questions, feedback, or to report an incorrect rule — send us a message.
            </p>
            <a href="mailto:support@geebharat.com"
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition">
              ✉️ support@geebharat.com
            </a>
          </div>
        </div>

        {/* CA Guidance note */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 mb-8">
          <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
            <span>🏛️</span> Need Professional CA / CS Guidance?
          </h3>
          <p className="text-blue-200 text-sm leading-relaxed mb-4">
            ComplianceSearch.in provides automated applicability analysis — but every business is unique.
            For filings, registrations, and complex compliance matters, always consult a qualified
            <strong className="text-white"> Chartered Accountant (CA)</strong> or
            <strong className="text-white"> Company Secretary (CS)</strong>.
          </p>
          <Link href="/check"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition">
            ✅ Start Compliance Check →
          </Link>
        </div>

        {/* FAQ quick links */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2"><span>❓</span> Quick Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { href:"/check",         label:"Start Compliance Check",        icon:"✅" },
              { href:"/about",         label:"About ComplianceSearch.in",     icon:"ℹ️" },
              { href:"/check/advanced",label:"Advanced Compliance Analysis",  icon:"🔍" },
              { href:"https://geebharat.com", label:"Gee Bharat Platform", icon:"🌐", ext:true },
            ].map((l) => (
              l.ext
                ? <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-200 hover:text-white text-sm py-2 px-3 rounded-lg hover:bg-white/10 transition">
                    <span>{l.icon}</span> {l.label} <span className="text-blue-400 text-xs ml-auto">↗</span>
                  </a>
                : <Link key={l.href} href={l.href}
                    className="flex items-center gap-2 text-blue-200 hover:text-white text-sm py-2 px-3 rounded-lg hover:bg-white/10 transition">
                    <span>{l.icon}</span> {l.label}
                  </Link>
            ))}
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-blue-400 text-xs">
            <Link href="/"        className="hover:text-white transition">Home</Link>
            <Link href="/about"   className="hover:text-white transition">About</Link>
            <Link href="/contact" className="hover:text-white transition">Contact</Link>
            <Link href="/check"   className="hover:text-white transition">Check</Link>
          </div>
          <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full transition">
            <span>🌐</span>
            Powered by <span className="text-yellow-300 font-bold ml-1">Gee Bharat</span>
          </a>
        </div>
      </footer>

    </main>
  );
}
