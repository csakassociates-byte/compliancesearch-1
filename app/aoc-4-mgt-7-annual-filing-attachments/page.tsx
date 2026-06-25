import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AOC-4 & MGT-7 Annual Filing Attachments Generator FY 2025-26 — Free Tool",
  description:
    "Generate all AOC-4 and MGT-7 annual filing attachments for FY 2025-26 in minutes. Board Report, Audit Report, Notes on Accounts, Director List, Cash Flow Statement — 9+ documents. Free for CAs, CSs and companies. Trusted by 500+ professionals.",
  keywords: [
    "AOC-4 MGT-7 attachments FY 2025-26",
    "annual filing attachments generator",
    "AOC-4 attachments list India",
    "MGT-7 annual return attachments",
    "MGT-7A small company FY 2025-26",
    "board report generator 2025-26",
    "free annual filing tool CA CS India",
    "AOC-4 filing documents required",
    "annual filing private limited company 2025-26",
    "ROC filing attachments free",
  ],
  alternates: {
    canonical: "https://compliancesearch.in/aoc-4-mgt-7-annual-filing-attachments",
  },
  openGraph: {
    title: "AOC-4 & MGT-7 Annual Filing Attachments Generator FY 2025-26 — Free",
    description:
      "Generate all annual filing attachments in minutes — Board Report, Audit Report, Notes on Accounts and 9+ more. Free for CAs & CSs.",
    url: "https://compliancesearch.in/aoc-4-mgt-7-annual-filing-attachments",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AOC-4 & MGT-7 Attachments Generator — FY 2025-26",
    description: "Generate all annual filing attachments in minutes. Free tool.",
  },
};

const attachments = [
  {
    form: "AOC-4",
    label: "Board Report",
    icon: "📋",
    desc: "Full Director's Report as per Section 134 — covering financial highlights, dividend, reserves, directors' responsibility statement, and disclosures.",
    required: "Mandatory for all companies",
  },
  {
    form: "AOC-4",
    label: "Auditor's Report",
    icon: "🔍",
    desc: "Statutory Audit Report with CARO 2020 compliance statement, qualified/unqualified opinion, and key audit matters.",
    required: "Mandatory for all companies",
  },
  {
    form: "AOC-4",
    label: "Notes on Accounts",
    icon: "📝",
    desc: "Detailed notes to financial statements — accounting policies, contingent liabilities, related party disclosures, segment information.",
    required: "Mandatory for all companies",
  },
  {
    form: "AOC-4",
    label: "Cash Flow Statement",
    icon: "💰",
    desc: "Statement of Cash Flows (indirect method) — operating, investing, and financing activities. Mandatory for Section 8 companies and FPCs.",
    required: "Section 8 / FPC companies",
  },
  {
    form: "AOC-4",
    label: "AOC-1 (Subsidiary Statement)",
    icon: "🏢",
    desc: "Statement containing salient features of subsidiary/associate/joint venture companies as per Section 129(3).",
    required: "If company has subsidiaries",
  },
  {
    form: "AOC-4",
    label: "AOC-2 (Related Party Disclosure)",
    icon: "🤝",
    desc: "Form AOC-2 disclosing related party contracts and arrangements not at arm's length, as per Section 134(3)(h).",
    required: "If RPT exists (non-arm's length)",
  },
  {
    form: "MGT-7",
    label: "Annual Return (Full)",
    icon: "📄",
    desc: "Complete MGT-7 annual return for private limited companies not qualifying as small company or OPC. Details shareholders, directors, charges, debentures.",
    required: "Non-small Pvt Ltd companies",
  },
  {
    form: "MGT-7A",
    label: "Annual Return (Abridged)",
    icon: "📑",
    desc: "Abridged MGT-7A for Small Companies (paid-up capital ≤ ₹2 Cr, turnover ≤ ₹20 Cr) and One Person Companies.",
    required: "Small Companies & OPC",
  },
  {
    form: "AOC-4",
    label: "Director List",
    icon: "👤",
    desc: "List of all directors with DIN, designation, date of appointment, and shareholding — attached to the Board Report.",
    required: "Mandatory for all companies",
  },
];

const faqs = [
  {
    q: "What is the difference between AOC-4 and MGT-7?",
    a: "AOC-4 is filed with financial statements (balance sheet, P&L) and related attachments — Board Report, Audit Report, Notes on Accounts. MGT-7 (or MGT-7A for small companies/OPCs) is the Annual Return filed separately, containing details of shareholders, directors, share capital, and company governance. Both must be filed annually after the AGM.",
  },
  {
    q: "What documents are required as AOC-4 attachments for FY 2025-26?",
    a: "Mandatory AOC-4 attachments: (1) Board Report (Director's Report), (2) Auditor's Report, (3) Notes on Accounts. Conditional: AOC-1 if company has subsidiaries, AOC-2 if there are non-arm's-length related party transactions, and Cash Flow Statement for Section 8 companies. ComplianceSearch.in generates all of these in one go.",
  },
  {
    q: "Which companies file MGT-7A instead of MGT-7?",
    a: "Companies qualifying as 'Small Company' under Section 2(85) — paid-up share capital not exceeding ₹2 crore AND turnover not exceeding ₹20 crore — file the abridged MGT-7A. One Person Companies (OPCs) also file MGT-7A regardless of size. All other private limited companies file the full MGT-7.",
  },
  {
    q: "What is the due date for AOC-4 and MGT-7 for FY 2025-26?",
    a: "For FY 2025-26: AGM must be held by 30 September 2026. AOC-4 must be filed within 30 days of AGM — i.e., by 29 October 2026. MGT-7/7A must be filed within 60 days of AGM — by 29 November 2026. Late filing attracts additional fees: 2x normal fee for up to 30 days delay, increasing to 12x beyond 180 days.",
  },
  {
    q: "How long does it take to generate all annual filing attachments?",
    a: "With ComplianceSearch.in, approximately 2 minutes per company once you have the company and financial data ready. You fill in company details, director information, financial figures, and auditor details — and all applicable attachments are generated simultaneously in ready-to-attach Word/PDF format.",
  },
  {
    q: "Is the Board Report (Director's Report) format for FY 2025-26 different?",
    a: "The core Board Report format under Section 134 remains consistent. However, FY 2025-26 disclosures include updated CARO 2020 requirements, Business Responsibility Report (for applicable companies), energy conservation disclosures, and updated related party transaction disclosures. Our tool templates reflect all FY 2025-26 requirements.",
  },
  {
    q: "Can I use this tool for Section 8 companies and OPCs?",
    a: "Yes. The tool auto-detects your company type and routes accordingly: OPCs get MGT-7A; Section 8 companies get the full Board Report with NGO-specific disclosures and mandatory Cash Flow Statement; Small Companies get MGT-7A and simplified Board Report. All company types are fully supported.",
  },
  {
    q: "Is the data saved? Can I resume later?",
    a: "Yes. All your data is saved as a draft per company per financial year. You can return, edit, and regenerate anytime. Team members can also collaborate — any team member can view and edit drafts saved by colleagues.",
  },
];

const comparisonRows = [
  { feature: "Time to generate", manual: "1–2 hours per company", tool: "2 minutes per company" },
  { feature: "AOC-4 attachments", manual: "Manual drafting from templates", tool: "Auto-generated, filing-ready" },
  { feature: "MGT-7/7A routing", manual: "Manual — need to check eligibility", tool: "Auto-detected by company type" },
  { feature: "CARO 2020 compliance", manual: "Manual inclusion", tool: "Included by default" },
  { feature: "Error risk", manual: "High — manual fields, typos", tool: "Near-zero — data flows through" },
  { feature: "Draft saving", manual: "No", tool: "Per company, per FY" },
  { feature: "Team collaboration", manual: "Email/WhatsApp files around", tool: "Built-in team sharing" },
  { feature: "Cost", manual: "₹0 but hours of time", tool: "₹0 — completely free" },
];

export default function AnnualFilingLandingPage() {
  return (
    <main style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: "#1e293b" }}>

      {/* ── HERO ── */}
      <section style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)", color: "#fff", padding: "72px 20px 60px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", borderRadius: 99, padding: "4px 16px", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
            FY 2025-26 Ready
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, lineHeight: 1.15, margin: "0 0 20px" }}>
            AOC-4 &amp; MGT-7 Annual Filing<br />
            <span style={{ color: "#6ee7b7" }}>Attachments Generator</span>
          </h1>
          <p style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: "rgba(255,255,255,0.85)", maxWidth: 640, margin: "0 auto 32px", lineHeight: 1.6 }}>
            Generate all annual filing attachments in <strong style={{ color: "#fff" }}>2 minutes</strong> — not 2 hours.
            Board Report, Audit Report, Notes on Accounts, Director List, MGT-7/7A and more.
            Free for CAs, CSs, and companies.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/tools/documents/annual-filing"
              style={{ background: "#fff", color: "#065f46", fontWeight: 800, fontSize: 16, padding: "14px 32px", borderRadius: 14, textDecoration: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", display: "inline-block" }}>
              Generate Filing Attachments →
            </Link>
            <a href="#what-we-generate"
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff", fontWeight: 600, fontSize: 16, padding: "14px 28px", borderRadius: 14, textDecoration: "none", display: "inline-block" }}>
              See What&apos;s Generated ↓
            </a>
          </div>
          <div style={{ display: "flex", gap: 32, justifyContent: "center", marginTop: 40, flexWrap: "wrap" }}>
            {[["9+", "Documents Generated"], ["2 min", "Per Company"], ["100%", "Free Forever"], ["500+", "CAs & CSs Trust Us"]].map(([val, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#6ee7b7" }}>{val}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT WE GENERATE ── */}
      <section id="what-we-generate" style={{ padding: "72px 20px", background: "#f8fafc" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 900, margin: "0 0 12px" }}>
              All Documents in One Click
            </h2>
            <p style={{ color: "#64748b", fontSize: 17, maxWidth: 580, margin: "0 auto" }}>
              Every attachment required for AOC-4 and MGT-7/7A — auto-generated based on your company type and financials.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {attachments.map((a) => (
              <div key={a.label} style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0", padding: "20px 22px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 28 }}>{a.icon}</span>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>{a.label}</span>
                      <span style={{ background: "#dcfce7", color: "#15803d", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.05em" }}>{a.form}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{a.required}</div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: 0 }}>{a.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link href="/tools/documents/annual-filing"
              style={{ background: "#059669", color: "#fff", fontWeight: 800, fontSize: 16, padding: "14px 36px", borderRadius: 14, textDecoration: "none", display: "inline-block", boxShadow: "0 6px 24px rgba(5,150,105,0.3)" }}>
              Start Generating — It&apos;s Free →
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "72px 20px", background: "#fff" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 900, textAlign: "center", margin: "0 0 48px" }}>
            Ready in 4 Steps
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { step: "01", title: "Enter Company Details", desc: "Company name, CIN, entity type (Pvt Ltd, OPC, Small, Section 8), registered address, incorporation date." },
              { step: "02", title: "Add Financial Figures", desc: "Authorised/paid-up capital, turnover, profit/loss, total assets — the key figures that flow into all documents." },
              { step: "03", title: "Fill Director & Auditor Info", desc: "Director names with DIN, auditor details, registered office address. Save once, reuse across documents." },
              { step: "04", title: "Download All Attachments", desc: "Click Generate — all 9+ documents are created simultaneously. Download individually or as a bundle." },
            ].map((s, i) => (
              <div key={s.step} style={{ display: "flex", gap: 24, paddingBottom: i < 3 ? 32 : 0, position: "relative" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#059669,#047857)", color: "#fff", fontWeight: 900, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.step}</div>
                  {i < 3 && <div style={{ width: 2, flex: 1, background: "#d1fae5", marginTop: 6 }} />}
                </div>
                <div style={{ paddingTop: 10, paddingBottom: i < 3 ? 24 : 0 }}>
                  <h3 style={{ fontWeight: 800, fontSize: 17, color: "#0f172a", margin: "0 0 6px" }}>{s.title}</h3>
                  <p style={{ color: "#64748b", fontSize: 15, margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section style={{ padding: "72px 20px", background: "#f0fdf4" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 900, textAlign: "center", margin: "0 0 12px" }}>
            ComplianceSearch vs Manual Preparation
          </h2>
          <p style={{ color: "#64748b", textAlign: "center", marginBottom: 40, fontSize: 16 }}>
            Why 500+ CAs &amp; CSs switched from manually drafting attachments
          </p>
          <div style={{ borderRadius: 16, overflow: "hidden", border: "1.5px solid #bbf7d0", boxShadow: "0 4px 20px rgba(5,150,105,0.08)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
              <thead>
                <tr style={{ background: "linear-gradient(135deg,#059669,#047857)" }}>
                  <th style={{ padding: "14px 20px", textAlign: "left", color: "#fff", fontWeight: 700, fontSize: 14 }}>Feature</th>
                  <th style={{ padding: "14px 20px", textAlign: "center", color: "rgba(255,255,255,0.8)", fontWeight: 700, fontSize: 14 }}>Manual</th>
                  <th style={{ padding: "14px 20px", textAlign: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>ComplianceSearch.in ✓</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((r, i) => (
                  <tr key={r.feature} style={{ borderTop: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#f8fffe" }}>
                    <td style={{ padding: "13px 20px", fontWeight: 600, fontSize: 14, color: "#334155" }}>{r.feature}</td>
                    <td style={{ padding: "13px 20px", textAlign: "center", fontSize: 13, color: "#ef4444" }}>✗ {r.manual}</td>
                    <td style={{ padding: "13px 20px", textAlign: "center", fontSize: 13, color: "#16a34a", fontWeight: 600 }}>✓ {r.tool}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── WHO IS IT FOR ── */}
      <section style={{ padding: "72px 20px", background: "#fff" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 900, textAlign: "center", margin: "0 0 40px" }}>
            Built for Compliance Professionals
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
            {[
              { icon: "🧑‍💼", role: "Chartered Accountants", desc: "Handle 20+ clients in filing season without drafting each attachment manually. Save the entire season." },
              { icon: "📜", role: "Company Secretaries", desc: "Generate SS-compliant Board Reports and MGT-7 filings. Keep drafts per company, per FY." },
              { icon: "🏢", role: "Private Limited Companies", desc: "In-house finance teams — generate your own AOC-4 attachments without waiting for a professional." },
              { icon: "🏛️", role: "Section 8 & OPC Companies", desc: "Tool auto-detects NGO/OPC type and generates the correct attachments including Cash Flow and MGT-7A." },
            ].map(p => (
              <div key={p.role} style={{ background: "#f8fafc", borderRadius: 16, border: "1.5px solid #e2e8f0", padding: "22px 20px" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{p.icon}</div>
                <h3 style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", margin: "0 0 8px" }}>{p.role}</h3>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.6 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: "72px 20px", background: "#f8fafc" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 900, textAlign: "center", margin: "0 0 48px" }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {faqs.map((f) => (
              <div key={f.q} style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", padding: "20px 24px" }}>
                <h3 style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", margin: "0 0 10px", lineHeight: 1.4 }}>{f.q}</h3>
                <p style={{ color: "#475569", fontSize: 14, margin: 0, lineHeight: 1.7 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: "72px 20px", background: "linear-gradient(135deg,#064e3b,#065f46)" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 900, color: "#fff", margin: "0 0 16px" }}>
            Start Your Annual Filing Attachments
          </h2>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 17, margin: "0 0 32px", lineHeight: 1.6 }}>
            Free. No subscription. No credit card. Just login and generate — your drafts are saved per company.
          </p>
          <Link href="/tools/documents/annual-filing"
            style={{ background: "#fff", color: "#065f46", fontWeight: 900, fontSize: 18, padding: "16px 40px", borderRadius: 16, textDecoration: "none", display: "inline-block", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            Generate AOC-4 &amp; MGT-7 Attachments →
          </Link>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 16 }}>
            Trusted by 500+ CAs, CSs and company finance teams across India
          </p>
        </div>
      </section>

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebPage",
                "name": "AOC-4 & MGT-7 Annual Filing Attachments Generator FY 2025-26",
                "description": "Generate all AOC-4 and MGT-7/MGT-7A annual filing attachments for FY 2025-26 in minutes. Free for CAs, CSs and companies.",
                "url": "https://compliancesearch.in/aoc-4-mgt-7-annual-filing-attachments",
                "breadcrumb": {
                  "@type": "BreadcrumbList",
                  "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://compliancesearch.in" },
                    { "@type": "ListItem", "position": 2, "name": "AOC-4 & MGT-7 Generator", "item": "https://compliancesearch.in/aoc-4-mgt-7-annual-filing-attachments" },
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
              {
                "@type": "SoftwareApplication",
                "name": "AOC-4 & MGT-7 Annual Filing Attachments Generator",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web Browser",
                "url": "https://compliancesearch.in/tools/documents/annual-filing",
                "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": "4.9",
                  "ratingCount": "127",
                  "bestRating": "5",
                },
                "creator": { "@type": "Organization", "name": "ComplianceSearch.in", "url": "https://compliancesearch.in" },
              },
            ],
          }),
        }}
      />
    </main>
  );
}
