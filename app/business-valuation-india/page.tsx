import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Free Business Valuation Calculator India — DCF, NAV, EBITDA Multiple FY 2025-26",
  description:
    "Calculate fair value of any Indian company using 6 methods: DCF, Net Asset Value (Rule 11UA), EBITDA multiple, Revenue multiple, P/E ratio, and Berkus method. Free tool for CAs, investors, founders, and M&A professionals.",
  keywords: [
    "business valuation India free",
    "company valuation calculator India",
    "DCF valuation India free tool",
    "Rule 11UA valuation calculator",
    "EBITDA multiple valuation India",
    "unlisted company valuation India",
    "startup valuation India free",
    "fair market value shares India",
    "FEMA valuation India",
    "business valuation for share transfer",
    "NAV method valuation India",
    "private company valuation India",
    "pre-money post-money valuation India",
    "business valuation for FDI India",
    "income tax valuation Section 56",
  ],
  alternates: { canonical: "https://compliancesearch.in/business-valuation-india" },
  openGraph: {
    title: "Free Business Valuation Calculator India — 6 Methods, Instant Results",
    description: "DCF, NAV, EBITDA, Revenue, P/E, Berkus — all valuation methods in one free tool. India-specific WACC and industry multiples.",
    url: "https://compliancesearch.in/business-valuation-india",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Business Valuation Calculator India",
    description: "6 valuation methods, India-specific data. Free for CAs, investors, founders.",
  },
};

const methods = [
  {
    icon: "📉",
    name: "DCF — Discounted Cash Flow",
    use: "FEMA, FDI, investor rounds",
    desc: "Projects future free cash flows and discounts them to present value using WACC. The gold standard for investment-grade valuation. Required for FEMA pricing under RBI guidelines.",
    inputs: "Projected FCF (5 years), terminal growth rate, WACC",
  },
  {
    icon: "📚",
    name: "NAV — Net Asset Value",
    use: "Income Tax Section 56(2)(x), Rule 11UA",
    desc: "Fair market value based on book value of assets minus liabilities. Prescribed under Rule 11UA of Income Tax Rules for valuation of unquoted equity shares for transfer tax purposes.",
    inputs: "Total assets, total liabilities, paid-up capital",
  },
  {
    icon: "📊",
    name: "EBITDA Multiple",
    use: "M&A, PE investment, market benchmarking",
    desc: "Values the business at a multiple of EBITDA based on comparable industry transactions. Uses BSE sector multiples as benchmark. Most common for mature profitable businesses.",
    inputs: "EBITDA, industry multiple (suggested by tool)",
  },
  {
    icon: "📈",
    name: "Revenue Multiple",
    use: "Early-stage, SaaS, high-growth companies",
    desc: "Values based on revenue when EBITDA is negative or not meaningful. Common for early-stage startups, SaaS businesses, and high-growth companies with thin margins.",
    inputs: "Annual revenue, industry revenue multiple",
  },
  {
    icon: "💹",
    name: "P/E Ratio Method",
    use: "Profitable companies, listed comparables",
    desc: "Values based on earnings per share multiplied by industry P/E ratio from comparable listed companies. Best for businesses with stable earnings.",
    inputs: "Net profit after tax, industry P/E ratio",
  },
  {
    icon: "🚀",
    name: "Berkus Method",
    use: "Pre-revenue startups",
    desc: "Assigns value across 5 qualitative factors: idea quality, prototype, team, strategic relationships, and product rollout/sales. Best for pre-revenue startups without financial history.",
    inputs: "5 qualitative factors scored 0–₹2.5 Cr each",
  },
];

const useCases = [
  { icon: "📋", title: "Share Transfer (Section 56)", desc: "Avoid gift tax — prove the transfer price is at or above FMV calculated per Rule 11UA. Defensible valuation report." },
  { icon: "🌏", title: "FDI & FEMA Compliance", desc: "Price shares at fair value for foreign investment under FEMA pricing guidelines. Required by AD bank before remittance." },
  { icon: "💼", title: "Fundraising & Term Sheet", desc: "Calculate pre-money and post-money valuation for seed, Series A, or angel investment rounds. DCF + revenue multiple comparison." },
  { icon: "🤝", title: "M&A — Buy or Sell Side", desc: "Get multiple valuation approaches for negotiation. EBITDA multiples, DCF, and NAV give a valuation range for deal structuring." },
  { icon: "📊", title: "ESOP Fair Market Value", desc: "Determine fair market value per share for ESOP grants and exercises — avoids perquisite tax disputes for employees." },
  { icon: "⚖️", title: "Court & Dispute Resolution", desc: "Provide court-ready valuation for shareholder disputes, divorce proceedings, and partition suits involving business interests." },
];

const faqs = [
  {
    q: "Which valuation method should I use for share transfer in India?",
    a: "For income tax purposes (Section 56(2)(x) and Rule 11UA), use the Net Asset Value (NAV/book value) method. The formula is: FMV per share = (A + B + C + D – L) × PV ÷ PE. For FEMA compliance (foreign investment), use the DCF method certified by a SEBI-registered merchant banker or practicing CA. ComplianceSearch.in calculates both automatically.",
  },
  {
    q: "What is Rule 11UA valuation?",
    a: "Rule 11UA of Income Tax Rules, 1962 prescribes the method for calculating fair market value of unquoted equity shares. The book value method considers all assets at book value (excluding certain items) minus all liabilities. If consideration received is below FMV, the difference is taxable as 'income from other sources' in the hands of the buyer.",
  },
  {
    q: "Is a chartered accountant required for business valuation in India?",
    a: "For regulatory purposes: FEMA valuation requires a SEBI-registered Merchant Banker. For income tax purposes, Rule 11UA allows self-calculation. For court proceedings, a registered valuer under IBBI is required. This tool helps you calculate and understand the valuation — get it certified by the appropriate professional based on your use case.",
  },
  {
    q: "What is the WACC used in the DCF method?",
    a: "WACC (Weighted Average Cost of Capital) is the blended cost of equity and debt. For Indian companies, it typically ranges from 12% to 22% depending on the sector, size, and risk profile. This tool suggests an appropriate WACC range based on your inputs, and you can override with your own rate.",
  },
  {
    q: "Can I use this tool for startup valuation?",
    a: "Yes. For pre-revenue startups, use the Berkus method. For startups with revenue but no profit, use the Revenue Multiple method. For startups projecting profitability in 3-5 years, use DCF. The tool runs all applicable methods simultaneously so you can compare the range.",
  },
];

export default function BusinessValuationIndiaPage() {
  return (
    <main style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: "#1e293b" }}>

      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg,#0c4a6e 0%,#075985 50%,#0369a1 100%)", padding: "68px 20px 56px", textAlign: "center" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", borderRadius: 99, padding: "4px 16px", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.9)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
            6 Valuation Methods
          </div>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 44px)", fontWeight: 900, color: "#fff", margin: "0 0 16px", lineHeight: 1.15 }}>
            Free Business Valuation<br />
            <span style={{ color: "#7dd3fc" }}>Calculator for India</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.82)", fontSize: "clamp(15px, 2.5vw, 18px)", margin: "0 auto 32px", lineHeight: 1.6, maxWidth: 580 }}>
            DCF, NAV (Rule 11UA), EBITDA Multiple, Revenue Multiple, P/E, and Berkus — all 6 methods in one free tool. India-specific industry multiples and WACC benchmarks.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/tools/business-valuation"
              style={{ background: "#fff", color: "#0c4a6e", fontWeight: 900, fontSize: 16, padding: "14px 32px", borderRadius: 14, textDecoration: "none", display: "inline-block", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
              Calculate Valuation →
            </Link>
          </div>
          <div style={{ display: "flex", gap: 28, justifyContent: "center", marginTop: 40, flexWrap: "wrap" }}>
            {[["6", "Valuation Methods"], ["Rule 11UA", "Tax Compliant"], ["FEMA", "Compliant DCF"], ["Free", "No Signup Needed"]].map(([val, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#7dd3fc" }}>{val}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Methods */}
      <section style={{ padding: "68px 20px", background: "#f0f9ff" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(20px, 4vw, 34px)", fontWeight: 900, textAlign: "center", margin: "0 0 12px" }}>
            6 Valuation Methods — One Tool
          </h2>
          <p style={{ color: "#64748b", textAlign: "center", marginBottom: 44, fontSize: 16 }}>Pick the right method for your purpose, or run all six and compare.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 20 }}>
            {methods.map((m) => (
              <div key={m.name} style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #bae6fd", padding: "20px 22px", boxShadow: "0 2px 10px rgba(3,105,161,0.06)" }}>
                <div style={{ fontSize: 30, marginBottom: 10 }}>{m.icon}</div>
                <div style={{ fontWeight: 900, fontSize: 15, color: "#0f172a", marginBottom: 4 }}>{m.name}</div>
                <div style={{ display: "inline-block", background: "#e0f2fe", color: "#0369a1", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 99, marginBottom: 10 }}>{m.use}</div>
                <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.65, margin: "0 0 10px" }}>{m.desc}</p>
                <div style={{ fontSize: 12, color: "#94a3b8" }}><strong style={{ color: "#64748b" }}>Inputs:</strong> {m.inputs}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section style={{ padding: "68px 20px", background: "#fff" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(20px, 4vw, 34px)", fontWeight: 900, textAlign: "center", margin: "0 0 44px" }}>
            When Do You Need a Business Valuation?
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
            {useCases.map((u) => (
              <div key={u.title} style={{ background: "#f8fafc", borderRadius: 16, border: "1.5px solid #e2e8f0", padding: "20px 20px" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{u.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a", marginBottom: 8 }}>{u.title}</div>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.65 }}>{u.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link href="/tools/business-valuation"
              style={{ background: "#0369a1", color: "#fff", fontWeight: 800, fontSize: 15, padding: "13px 32px", borderRadius: 12, textDecoration: "none", display: "inline-block" }}>
              Start Valuation — Free →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "68px 20px", background: "#f0f9ff" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(20px, 4vw, 34px)", fontWeight: 900, textAlign: "center", margin: "0 0 44px" }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {faqs.map((f) => (
              <div key={f.q} style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #bae6fd", padding: "20px 24px" }}>
                <h3 style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", margin: "0 0 10px", lineHeight: 1.4 }}>{f.q}</h3>
                <p style={{ color: "#475569", fontSize: 14, margin: 0, lineHeight: 1.7 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "64px 20px", background: "linear-gradient(135deg,#0c4a6e,#0369a1)", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 900, color: "#fff", margin: "0 0 14px" }}>Calculate Your Business Value</h2>
          <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 16, margin: "0 0 28px", lineHeight: 1.6 }}>
            All 6 methods. India-specific multiples and WACC benchmarks. Free, instant, no signup required.
          </p>
          <Link href="/tools/business-valuation"
            style={{ background: "#fff", color: "#0c4a6e", fontWeight: 900, fontSize: 17, padding: "15px 38px", borderRadius: 14, textDecoration: "none", display: "inline-block", boxShadow: "0 6px 24px rgba(0,0,0,0.2)" }}>
            Open Valuation Tool →
          </Link>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebPage",
                "name": "Free Business Valuation Calculator India",
                "url": "https://compliancesearch.in/business-valuation-india",
                "breadcrumb": {
                  "@type": "BreadcrumbList",
                  "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://compliancesearch.in" },
                    { "@type": "ListItem", "position": 2, "name": "Business Valuation India", "item": "https://compliancesearch.in/business-valuation-india" },
                  ],
                },
              },
              {
                "@type": "FAQPage",
                "mainEntity": faqs.map(f => ({
                  "@type": "Question",
                  "name": f.q,
                  "acceptedAnswer": { "@type": "Answer", "text": f.a },
                })),
              },
            ],
          }),
        }}
      />
    </main>
  );
}
