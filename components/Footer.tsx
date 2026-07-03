import Link from "next/link";
import { Scale, Mail, Globe } from "lucide-react";

const TOOL_LINKS = [
  { href: "/check",                              label: "Know your compliance" },
  { href: "/tools/documents/annual-filing",      label: "Annual filing generator" },
  { href: "/tools/business-valuation",           label: "Business valuation" },
  { href: "/tools/documents/board-resolution",   label: "Board resolution" },
  { href: "/tools/documents/minutes",            label: "Meeting minutes" },
  { href: "/tools/penalty-calculator",           label: "MCA penalty calculator" },
  { href: "/calendar",                           label: "Compliance calendar" },
];

const RESOURCE_LINKS = [
  { href: "/blog",                    label: "Blog" },
  { href: "/gst-due-dates",           label: "GST due dates" },
  { href: "/income-tax-due-dates",    label: "Income tax due dates" },
  { href: "/roc-filing-due-dates",    label: "ROC / MCA filing dates" },
  { href: "/companies-act-compliance",label: "Companies Act guide" },
  { href: "/about",                   label: "About" },
  { href: "/contact",                 label: "Contact" },
];

export default function Footer() {
  return (
    <footer>
      {/* ── Main footer body ── */}
      <div className="px-6 py-14" style={{ background: "var(--cs-dark)" }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">

          {/* ── Brand column ── */}
          <div className="flex flex-col gap-5">
            <Link href="/" className="flex items-center gap-2.5 w-fit">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg,#1e40af,var(--cs-blue))" }}
              >
                <Scale className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <span className="font-bold text-lg text-slate-100 tracking-tight">
                ComplianceSearch
                <span style={{ color: "var(--cs-amber)" }}>.in</span>
              </span>
            </Link>

            <p className="text-slate-400 text-sm leading-relaxed">
              India&apos;s free compliance intelligence and business valuation
              platform — built for CAs, CSs, and business owners across India.
            </p>

            <a
              href="mailto:csakassociates@gmail.com"
              className="flex items-center gap-2 text-slate-500 text-sm hover:text-slate-300 transition-colors w-fit"
            >
              <Mail className="w-4 h-4 shrink-0" />
              csakassociates@gmail.com
            </a>

            <a
              href="https://geebharat.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition-colors w-fit hover:opacity-90"
              style={{
                background: "#1c1400",
                borderColor: "#78350f",
                color: "#fcd34d",
              }}
            >
              <Globe className="w-4 h-4 shrink-0" />
              Powered by Gee Bharat
            </a>
          </div>

          {/* ── Tools column ── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-5">
              Tools
            </p>
            <ul className="flex flex-col gap-3">
              {TOOL_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-slate-400 text-sm hover:text-slate-100 transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Resources column ── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-5">
              Resources
            </p>
            <ul className="flex flex-col gap-3">
              {RESOURCE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-slate-400 text-sm hover:text-slate-100 transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div
        className="px-6 py-4 border-t"
        style={{ background: "var(--cs-dark-3)", borderColor: "#1e293b" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-slate-600 text-xs">
            © {new Date().getFullYear()} ComplianceSearch.in — All rights reserved
          </p>
          <p className="text-slate-700 text-xs text-center sm:text-right">
            For guidance only. Consult a CA / CS for legal compliance advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
