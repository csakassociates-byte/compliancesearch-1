import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Free Business Compliance Checker India — 77+ Rules, 11 Categories | ComplianceSearch.in",
  description:
    "Find all statutory compliance requirements for your business in India. Answer 5 questions — get personalised list of GST, PF, ESIC, FSSAI, Factories Act, MCA/ROC, labour law and more. Free, instant, 100% India-specific.",
  keywords: [
    "business compliance checker India free",
    "statutory compliance requirements India",
    "compliance checklist private limited company India",
    "GST registration requirement checker",
    "PF ESIC compliance check India",
    "FSSAI food licence requirement check",
    "Factories Act applicability check",
    "MCA ROC compliance checklist",
    "annual compliance requirement India",
    "labour law compliance checker India",
    "startup compliance India checklist",
    "mandatory compliance new business India",
    "compliance requirements by company type",
    "free compliance audit India",
    "what compliance does my business need India",
  ],
  alternates: { canonical: "https://compliancesearch.in/compliance-checker-india" },
  openGraph: {
    title: "Free Business Compliance Checker India — Personalised Results in 2 Minutes",
    description: "Answer 5 questions, get all compliance requirements for your business. GST, PF, ESIC, FSSAI, MCA and 77+ more rules. Free.",
    url: "https://compliancesearch.in/compliance-checker-india",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Business Compliance Checker India",
    description: "77+ rules, 11 categories, personalised results. Free compliance checker.",
  },
};

const categories = [
  { icon: "🧾", name: "GST & Indirect Tax", rules: 12, desc: "Registration threshold, return frequency (GSTR-1, 3B, 9, 9C), composition scheme eligibility, e-invoicing, e-way bill." },
  { icon: "💰", name: "Income Tax & TDS", rules: 10, desc: "ITR filing type (ITR-6/7), advance tax, TDS deductions (194A, 194J, 192), audit u/s 44AB, MSME payment compliance." },
  { icon: "🏛️", name: "MCA / ROC (Companies Act)", rules: 8, desc: "AOC-4, MGT-7/7A filing, board meetings, AGM, DIR-3 KYC, ADT-1, DPT-3, BEN-2 and annual compliance calendar." },
  { icon: "👷", name: "Provident Fund (PF)", rules: 6, desc: "EPF registration (20+ employees), contribution rate, ECR filing, UAN generation, international worker provisions." },
  { icon: "🏥", name: "ESIC", rules: 5, desc: "ESI registration (10+ employees in notified areas), contribution, monthly return, IP registration." },
  { icon: "🍽️", name: "FSSAI — Food Safety", rules: 7, desc: "License type (Basic/State/Central) based on turnover, annual return, food safety management system compliance." },
  { icon: "🏭", name: "Factories Act", rules: 6, desc: "Registration (10+ workers with power, 20+ without), annual return, health/safety/welfare provisions, working hours." },
  { icon: "🏪", name: "Shops & Establishments", rules: 5, desc: "State-specific registration, working hours, leave policy, employee register maintenance, renewal." },
  { icon: "👩‍💼", name: "Labour Laws", rules: 9, desc: "Contract Labour Act, Minimum Wages, Payment of Wages, Gratuity, Maternity Benefit, CLRA registration, labour welfare fund." },
  { icon: "🌿", name: "Environmental", rules: 5, desc: "Pollution Control Board consent (Green/Orange/Red category), Hazardous Waste rules, Environment Impact Assessment." },
  { icon: "🏗️", name: "MSME & Sector-Specific", rules: 10, desc: "MSME registration (Udyam), MSME payment compliance (Section 15-24 MSMED Act), professional tax, shop licence." },
];

const companyTypes = [
  { type: "Private Limited (Pvt Ltd)", count: "45+", examples: ["AOC-4, MGT-7 annual filing", "Board + AGM meetings", "DIR-3 KYC", "ADT-1 for auditor", "GST (if applicable)", "PF/ESIC (if eligible)"] },
  { type: "One Person Company (OPC)", count: "32+", examples: ["AOC-4, MGT-7A", "No AGM required", "DIR-3 KYC", "GST (if applicable)", "Simplified board meeting rules"] },
  { type: "LLP", count: "18+", examples: ["Form 11 annual return", "Form 8 statement of accounts", "Income Tax (ITR-5)", "GST (if applicable)", "DIN for Designated Partners"] },
  { type: "Proprietorship / Partnership", count: "22+", examples: ["ITR-3 / ITR-4", "GST (if applicable)", "PF/ESIC (if eligible)", "Shop & establishment registration", "MSME/Udyam registration"] },
];

const faqs = [
  {
    q: "How does the compliance checker determine which rules apply to my business?",
    a: "The tool asks 5 key questions: (1) business entity type, (2) industry/sector, (3) annual turnover, (4) number of employees, and (5) state of operation. Based on your answers, it applies India's statutory thresholds and conditions — for example, GST registration triggers at ₹40L turnover, PF at 20 employees, FSSAI at food business type. You get only the rules that actually apply to your combination.",
  },
  {
    q: "Is GST registration mandatory for all businesses?",
    a: "No. GST registration is mandatory if: annual turnover exceeds ₹40 lakhs (goods) or ₹20 lakhs (services) in most states (₹10 lakhs for special category states), you make inter-state supply regardless of turnover, you operate as an e-commerce operator or supplier through e-commerce, you are a casual taxable person, or your are required to deduct TDS under GST. Voluntary registration is also possible.",
  },
  {
    q: "When does PF (Provident Fund) registration become mandatory?",
    a: "PF registration under EPF & MP Act 1952 is mandatory when an establishment employs 20 or more persons. This includes contract labour deployed at your premises. Once covered, the obligation continues even if headcount later drops below 20. Contribution is 12% of basic wages from both employer and employee.",
  },
  {
    q: "What is the difference between FSSAI Basic, State, and Central licence?",
    a: "FSSAI registration/licence depends on your turnover: Basic Registration for turnover below ₹12 lakhs, State Licence for ₹12 lakhs to ₹20 crores, and Central Licence for above ₹20 crores or businesses operating in multiple states, importing/exporting, operating a 100+ bed hospital canteen, or running a central government canteen.",
  },
  {
    q: "Does a private limited company need to hold AGM every year?",
    a: "Yes. Under Section 96 of Companies Act 2013, every company (except OPC) must hold its AGM each year. The first AGM must be held within 9 months of the close of the first financial year. Subsequent AGMs must be held within 6 months of financial year end (by 30 September) and not more than 15 months after the last AGM. Failure attracts penalty under Section 99.",
  },
];

export default function ComplianceCheckerIndiaPage() {
  return (
    <main style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: "#1e293b" }}>

      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg,#14532d 0%,#166534 50%,#15803d 100%)", padding: "68px 20px 56px", textAlign: "center" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", borderRadius: 99, padding: "4px 16px", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.9)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
            77+ Rules · 11 Categories
          </div>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 44px)", fontWeight: 900, color: "#fff", margin: "0 0 16px", lineHeight: 1.15 }}>
            Business Compliance Checker<br />
            <span style={{ color: "#86efac" }}>for India — Free &amp; Instant</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.82)", fontSize: "clamp(15px, 2.5vw, 18px)", margin: "0 auto 32px", lineHeight: 1.6, maxWidth: 580 }}>
            Answer 5 questions about your business and get a personalised checklist of every statutory compliance that applies to you — GST, PF, ESIC, FSSAI, MCA, Factories Act, labour laws and more.
          </p>
          <Link href="/check"
            style={{ background: "#fff", color: "#14532d", fontWeight: 900, fontSize: 16, padding: "14px 36px", borderRadius: 14, textDecoration: "none", display: "inline-block", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            Check My Compliance →
          </Link>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 14 }}>Takes 2 minutes · 100% personalised · Free</p>
        </div>
      </section>

      {/* 11 Categories */}
      <section style={{ padding: "68px 20px", background: "#f0fdf4" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(20px, 4vw, 34px)", fontWeight: 900, textAlign: "center", margin: "0 0 12px" }}>
            11 Compliance Categories Covered
          </h2>
          <p style={{ color: "#64748b", textAlign: "center", marginBottom: 44, fontSize: 16 }}>
            Every major statutory obligation — not just MCA, but the full picture.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 18 }}>
            {categories.map((c) => (
              <div key={c.name} style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #bbf7d0", padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 26 }}>{c.icon}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>{c.rules} rules checked</div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.6 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* By Company Type */}
      <section style={{ padding: "68px 20px", background: "#fff" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(20px, 4vw, 34px)", fontWeight: 900, textAlign: "center", margin: "0 0 44px" }}>
            Compliance by Business Type
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {companyTypes.map((c) => (
              <div key={c.type} style={{ background: "#f8fafc", borderRadius: 16, border: "1.5px solid #e2e8f0", padding: "20px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>{c.type}</div>
                  <span style={{ background: "#dcfce7", color: "#15803d", fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 99 }}>{c.count} rules</span>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                  {c.examples.map(ex => (
                    <li key={ex} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "#475569" }}>
                      <span style={{ color: "#059669", fontWeight: 700, flexShrink: 0 }}>✓</span>
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link href="/check"
              style={{ background: "#059669", color: "#fff", fontWeight: 800, fontSize: 15, padding: "13px 32px", borderRadius: 12, textDecoration: "none", display: "inline-block", boxShadow: "0 6px 24px rgba(5,150,105,0.3)" }}>
              Get My Personalised Checklist →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "68px 20px", background: "#f0fdf4" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(20px, 4vw, 34px)", fontWeight: 900, textAlign: "center", margin: "0 0 44px" }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {faqs.map((f) => (
              <div key={f.q} style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #bbf7d0", padding: "20px 24px" }}>
                <h3 style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", margin: "0 0 10px", lineHeight: 1.4 }}>{f.q}</h3>
                <p style={{ color: "#475569", fontSize: 14, margin: 0, lineHeight: 1.7 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "64px 20px", background: "linear-gradient(135deg,#14532d,#166534)", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 900, color: "#fff", margin: "0 0 14px" }}>
            Know Every Compliance You Need
          </h2>
          <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 16, margin: "0 0 28px", lineHeight: 1.6 }}>
            5 questions. 2 minutes. A complete, personalised compliance checklist — so you never miss a filing or a due date.
          </p>
          <Link href="/check"
            style={{ background: "#fff", color: "#14532d", fontWeight: 900, fontSize: 17, padding: "15px 38px", borderRadius: 14, textDecoration: "none", display: "inline-block", boxShadow: "0 6px 24px rgba(0,0,0,0.2)" }}>
            Check My Compliance →
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
                "name": "Free Business Compliance Checker India",
                "url": "https://compliancesearch.in/compliance-checker-india",
                "breadcrumb": {
                  "@type": "BreadcrumbList",
                  "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://compliancesearch.in" },
                    { "@type": "ListItem", "position": 2, "name": "Compliance Checker India", "item": "https://compliancesearch.in/compliance-checker-india" },
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
