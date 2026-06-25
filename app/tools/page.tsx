import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Free Compliance Tools for CAs & CSs — ComplianceSearch.in",
  description:
    "Free online compliance tools for Indian CAs, Company Secretaries, and businesses. Generate AOC-4/MGT-7 attachments, board resolutions, share certificates, meeting minutes, business valuations, and more. All tools free, no subscription.",
  keywords: [
    "free compliance tools India CA CS",
    "company secretary tools online free",
    "CA compliance tools India",
    "ROC filing tools free",
    "MCA compliance tools online",
    "annual filing tool India free",
    "board resolution generator India",
    "share certificate generator India",
    "meeting minutes generator free",
    "business valuation tool India",
    "MCA penalty calculator",
    "compliance checker India free",
    "corporate law tools India",
    "companies act tools online",
  ],
  alternates: { canonical: "https://compliancesearch.in/tools" },
  openGraph: {
    title: "Free Compliance Tools for CAs & CSs — ComplianceSearch.in",
    description: "All compliance tools in one place — AOC-4/MGT-7, board resolutions, share certificates, minutes, business valuation and more. Free.",
    url: "https://compliancesearch.in/tools",
    type: "website",
  },
};

const tools = [
  {
    icon: "📊",
    title: "Annual Filing Attachments",
    subtitle: "AOC-4 & MGT-7 / MGT-7A",
    desc: "Generate all 9+ attachments for annual ROC filing in 2 minutes — Board Report, Audit Report, Notes on Accounts, Director List, Cash Flow, AOC-1, AOC-2 and more.",
    href: "/tools/documents/annual-filing",
    landingHref: "/aoc-4-mgt-7-annual-filing-attachments",
    badge: "Most Popular",
    badgeColor: "#059669",
    tags: ["AOC-4", "MGT-7", "MGT-7A", "FY 2025-26"],
    color: "from-emerald-500 to-green-600",
    bgLight: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  {
    icon: "🏛️",
    title: "AGM Minutes",
    subtitle: "Annual General Meeting",
    desc: "Generate Annual General Meeting minutes compliant with Secretarial Standard SS-2. Attendance, agenda items, resolutions passed — all in one document.",
    href: "/tools/documents/minutes/agm",
    badge: "SS-2 Compliant",
    badgeColor: "#7c3aed",
    tags: ["AGM", "SS-2", "Companies Act"],
    color: "from-purple-500 to-violet-600",
    bgLight: "#faf5ff",
    borderColor: "#ddd6fe",
  },
  {
    icon: "📋",
    title: "Board Meeting Minutes",
    subtitle: "Board Minutes + CTC",
    desc: "Generate Board Meeting minutes per Secretarial Standard SS-1. Full minutes with attendance, resolutions, and Certified True Copy (CTC) format for banks.",
    href: "/tools/documents/minutes/board",
    badge: "SS-1 Compliant",
    badgeColor: "#2563eb",
    tags: ["Board Minutes", "SS-1", "CTC"],
    color: "from-blue-500 to-indigo-600",
    bgLight: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  {
    icon: "⚖️",
    title: "Board Resolution Generator",
    subtitle: "All Resolution Types",
    desc: "Generate board resolutions for bank account opening, director appointment, loan approval, share allotment, auditor appointment and more.",
    href: "/tools/documents/board-resolution",
    landingHref: "/board-resolution-generator",
    badge: null,
    tags: ["Bank Account", "Director", "Loan"],
    color: "from-slate-600 to-slate-800",
    bgLight: "#f8fafc",
    borderColor: "#e2e8f0",
  },
  {
    icon: "🏦",
    title: "Bank Account Resolution",
    subtitle: "Current Account Opening",
    desc: "Dedicated resolution for company bank account opening — specify authorised signatories, single/joint authority, branch details. Accepted by all banks.",
    href: "/tools/documents/bank-resolution",
    badge: null,
    tags: ["SBI", "HDFC", "ICICI", "All Banks"],
    color: "from-teal-500 to-cyan-600",
    bgLight: "#f0fdfa",
    borderColor: "#99f6e4",
  },
  {
    icon: "📜",
    title: "Share Certificate",
    subtitle: "Form SH-1",
    desc: "Generate share certificates in Form SH-1 format as required under Companies Act 2013. Folio number, distinctive numbers, consideration paid — print-ready.",
    href: "/tools/documents/share-certificate",
    badge: null,
    tags: ["SH-1", "Section 46", "Equity Shares"],
    color: "from-amber-500 to-orange-500",
    bgLight: "#fffbeb",
    borderColor: "#fde68a",
  },
  {
    icon: "🔄",
    title: "Share Transfer Deed",
    subtitle: "Form SH-4",
    desc: "Generate share transfer instruments in Form SH-4 as per Section 56 of Companies Act 2013. Transferor and transferee details, stamp duty guidance.",
    href: "/tools/documents/share-transfer",
    badge: null,
    tags: ["SH-4", "Section 56", "Transfer"],
    color: "from-rose-500 to-pink-600",
    bgLight: "#fff1f2",
    borderColor: "#fecdd3",
  },
  {
    icon: "📈",
    title: "Business Valuation",
    subtitle: "DCF, NAV & EBITDA Methods",
    desc: "Calculate fair value of any Indian company using DCF, Net Asset Value (Rule 11UA), EBITDA multiples, Revenue multiples, P/E and Berkus methods.",
    href: "/tools/business-valuation",
    landingHref: "/business-valuation-india",
    badge: "6 Methods",
    badgeColor: "#0369a1",
    tags: ["DCF", "NAV", "Rule 11UA", "FEMA"],
    color: "from-sky-500 to-blue-600",
    bgLight: "#f0f9ff",
    borderColor: "#bae6fd",
  },
  {
    icon: "🔢",
    title: "MCA Penalty Calculator",
    subtitle: "Additional Fee Calculator",
    desc: "Calculate additional fees for late filing of AOC-4, MGT-7, DIR-3 KYC, ADT-1 and other MCA forms. Instant, accurate, slab-wise breakdown.",
    href: "/tools/penalty-calculator",
    badge: null,
    tags: ["AOC-4", "MGT-7", "DIR-3 KYC"],
    color: "from-red-500 to-rose-600",
    bgLight: "#fff5f5",
    borderColor: "#fecaca",
  },
  {
    icon: "✅",
    title: "Compliance Checker",
    subtitle: "77+ Rules, 11 Categories",
    desc: "Answer 5 questions about your business and get a personalised list of all applicable compliance requirements — GST, PF, ESIC, FSSAI, MCA, labour laws and more.",
    href: "/check",
    landingHref: "/compliance-checker-india",
    badge: "Free",
    badgeColor: "#16a34a",
    tags: ["GST", "PF", "ESIC", "FSSAI", "MCA"],
    color: "from-green-500 to-emerald-600",
    bgLight: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
];

export default function ToolsPage() {
  return (
    <main style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: "#1e293b" }}>

      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)", padding: "64px 20px 56px", textAlign: "center" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "inline-block", background: "rgba(255,255,255,0.1)", borderRadius: 99, padding: "4px 16px", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
            10 Free Tools
          </div>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 44px)", fontWeight: 900, color: "#fff", margin: "0 0 16px", lineHeight: 1.15 }}>
            Free Compliance Tools<br />
            <span style={{ color: "#7dd3fc" }}>for CAs, CSs &amp; Companies</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "clamp(15px, 2.5vw, 18px)", margin: "0 auto 32px", lineHeight: 1.6, maxWidth: 580 }}>
            Professional-grade compliance tools — all free, no subscription. Generate documents, calculate penalties, value businesses, and check compliance requirements instantly.
          </p>
          <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
            {[["10", "Free Tools"], ["9+", "Document Types"], ["2 min", "Per Filing"], ["500+", "Professionals"]].map(([val, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#7dd3fc" }}>{val}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section style={{ padding: "64px 20px", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
            {tools.map((tool) => (
              <div key={tool.href} style={{ background: "#fff", borderRadius: 20, border: `1.5px solid ${tool.borderColor}`, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
                {/* Card header */}
                <div style={{ background: tool.bgLight, padding: "22px 22px 18px", borderBottom: `1px solid ${tool.borderColor}` }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ fontSize: 32 }}>{tool.icon}</div>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: 16, color: "#0f172a", lineHeight: 1.2 }}>{tool.title}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{tool.subtitle}</div>
                      </div>
                    </div>
                    {tool.badge && (
                      <span style={{ background: tool.badgeColor, color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0, marginLeft: 8 }}>
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {tool.tags.map(t => (
                      <span key={t} style={{ background: "rgba(0,0,0,0.06)", color: "#475569", fontSize: 11, padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>{t}</span>
                    ))}
                  </div>
                </div>
                {/* Card body */}
                <div style={{ padding: "18px 22px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.65, margin: "0 0 18px", flex: 1 }}>{tool.desc}</p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <Link href={tool.href}
                      style={{ flex: 1, display: "block", textAlign: "center", background: "linear-gradient(135deg,#1e40af,#1d4ed8)", color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px 16px", borderRadius: 10, textDecoration: "none" }}>
                      Open Tool →
                    </Link>
                    {tool.landingHref && (
                      <Link href={tool.landingHref}
                        style={{ display: "block", textAlign: "center", background: "#f1f5f9", color: "#475569", fontWeight: 600, fontSize: 13, padding: "10px 14px", borderRadius: 10, textDecoration: "none" }}>
                        Learn More
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Free CTA */}
      <section style={{ padding: "64px 20px", background: "#fff", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 900, margin: "0 0 16px" }}>Why Are All Tools Free?</h2>
          <p style={{ color: "#64748b", fontSize: 17, lineHeight: 1.7, margin: "0 0 32px" }}>
            ComplianceSearch.in is built by compliance professionals, for compliance professionals.
            We believe every CA, CS, and company — regardless of size — should have access to
            professional-grade tools without paying per document or per company.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, textAlign: "left", marginBottom: 36 }}>
            {[
              { icon: "∞", label: "Unlimited companies", desc: "No cap on how many clients you generate for" },
              { icon: "💾", label: "Save drafts", desc: "All data saved per company, per financial year" },
              { icon: "👥", label: "Team sharing", desc: "Invite team members, share work seamlessly" },
              { icon: "🔄", label: "Always updated", desc: "Templates updated for current FY rules" },
            ].map(f => (
              <div key={f.label} style={{ background: "#f8fafc", borderRadius: 14, border: "1px solid #e2e8f0", padding: "16px 18px" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>{f.label}</div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
          <Link href="/auth/register"
            style={{ background: "linear-gradient(135deg,#059669,#047857)", color: "#fff", fontWeight: 800, fontSize: 16, padding: "14px 36px", borderRadius: 14, textDecoration: "none", display: "inline-block", boxShadow: "0 6px 24px rgba(5,150,105,0.3)" }}>
            Create Free Account →
          </Link>
        </div>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Free Compliance Tools — ComplianceSearch.in",
            "description": "Free online compliance tools for Indian CAs, Company Secretaries, and businesses.",
            "url": "https://compliancesearch.in/tools",
            "hasPart": tools.map(t => ({
              "@type": "SoftwareApplication",
              "name": t.title,
              "description": t.desc,
              "url": `https://compliancesearch.in${t.href}`,
              "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
              "applicationCategory": "BusinessApplication",
            })),
          }),
        }}
      />
    </main>
  );
}
