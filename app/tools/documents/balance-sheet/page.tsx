"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const FORMATS = [
  {
    id: "schedule-iii-div1",
    icon: "📊",
    title: "Schedule III — Division I",
    subtitle: "Non-Ind AS (AS Standards)",
    desc: "For companies following Indian Accounting Standards (AS). Applicable to most Private Limited, OPC, and Section 8 Companies. Latest format as per MCA GSR 207(E) dated 24 March 2021.",
    applicableTo: ["Private Limited Companies", "OPC", "Section 8 Companies", "Producer Companies"],
    standard: "Companies Act 2013 — Schedule III Part I & II",
    amendment: "MCA Notification GSR 207(E) — 24 March 2021",
    href: "/tools/documents/balance-sheet/schedule-iii-div1",
    active: true,
    badge: "Available",
    badgeColor: "#059669",
    bgColor: "#f0fdf4",
    borderColor: "#86efac",
    accentColor: "#059669",
    gradient: "linear-gradient(135deg,#059669,#047857)",
  },
  {
    id: "schedule-iii-div2",
    icon: "📈",
    title: "Schedule III — Division II",
    subtitle: "Ind AS Companies",
    desc: "For companies mandatorily following Indian Accounting Standards (Ind AS). Applicable to listed companies and companies meeting the threshold criteria.",
    applicableTo: ["Listed Companies", "Companies with Net Worth ≥ ₹250 Cr", "Companies with Turnover ≥ ₹500 Cr"],
    standard: "Companies (Ind AS) Rules 2015",
    amendment: "Ind AS Framework",
    href: "#",
    active: false,
    badge: "Coming Soon",
    badgeColor: "#64748b",
    bgColor: "#f8fafc",
    borderColor: "#cbd5e1",
    accentColor: "#64748b",
    gradient: "linear-gradient(135deg,#64748b,#475569)",
  },
  {
    id: "schedule-iii-div3",
    icon: "🏦",
    title: "Schedule III — Division III",
    subtitle: "Non-Banking Financial Companies (NBFCs)",
    desc: "For NBFCs following Ind AS. Specific format for financial institutions with unique asset classifications and regulatory requirements.",
    applicableTo: ["NBFCs following Ind AS", "Micro Finance Institutions", "Housing Finance Companies"],
    standard: "Companies (Ind AS) Rules 2015 — Division III",
    amendment: "As amended",
    href: "#",
    active: false,
    badge: "Coming Soon",
    badgeColor: "#64748b",
    bgColor: "#f8fafc",
    borderColor: "#cbd5e1",
    accentColor: "#64748b",
    gradient: "linear-gradient(135deg,#64748b,#475569)",
  },
  {
    id: "banking",
    icon: "🏛️",
    title: "Banking Companies Format",
    subtitle: "Third Schedule — Banking Regulation Act",
    desc: "For banking companies under the Banking Regulation Act 1949. Specific balance sheet and P&L format for commercial banks.",
    applicableTo: ["Commercial Banks", "Cooperative Banks", "RRBs"],
    standard: "Banking Regulation Act 1949 — Third Schedule",
    amendment: "As amended by RBI",
    href: "#",
    active: false,
    badge: "Coming Soon",
    badgeColor: "#64748b",
    bgColor: "#f8fafc",
    borderColor: "#cbd5e1",
    accentColor: "#64748b",
    gradient: "linear-gradient(135deg,#64748b,#475569)",
  },
  {
    id: "insurance",
    icon: "🛡️",
    title: "Insurance Companies Format",
    subtitle: "IRDA Regulations",
    desc: "For insurance companies regulated by IRDAI. Revenue accounts, P&L account, and balance sheet as per IRDA (Preparation of Financial Statements) Regulations 2002.",
    applicableTo: ["Life Insurance Companies", "General Insurance Companies", "Health Insurance Companies"],
    standard: "IRDA Regulations 2002",
    amendment: "As amended by IRDAI",
    href: "#",
    active: false,
    badge: "Coming Soon",
    badgeColor: "#64748b",
    bgColor: "#f8fafc",
    borderColor: "#cbd5e1",
    accentColor: "#64748b",
    gradient: "linear-gradient(135deg,#64748b,#475569)",
  },
  {
    id: "llp",
    icon: "🤝",
    title: "LLP Format",
    subtitle: "Limited Liability Partnership",
    desc: "For LLPs under the Limited Liability Partnership Act 2008. Statement of Accounts and Solvency (Form 8) format.",
    applicableTo: ["Limited Liability Partnerships", "LLP with turnover > ₹40 lakhs"],
    standard: "LLP Act 2008 — Form 8",
    amendment: "LLP Rules 2009",
    href: "#",
    active: false,
    badge: "Coming Soon",
    badgeColor: "#64748b",
    bgColor: "#f8fafc",
    borderColor: "#cbd5e1",
    accentColor: "#64748b",
    gradient: "linear-gradient(135deg,#64748b,#475569)",
  },
];

export default function BalanceSheetLandingPage() {
  return (
    <>
      <Navbar />
      <main style={{ fontFamily: "system-ui, -apple-system, sans-serif", minHeight: "100vh", background: "#f8fafc" }}>

        {/* Hero */}
        <section style={{ background: "linear-gradient(135deg,#0f172a 0%,#064e3b 100%)", padding: "56px 20px 48px", textAlign: "center" }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 99, padding: "4px 16px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
              Schedule III Division I Live — 5 More Formats Coming Soon
            </div>
            <h1 style={{ fontSize: "clamp(26px, 5vw, 42px)", fontWeight: 900, color: "#fff", margin: "0 0 16px", lineHeight: 1.15 }}>
              Prepare Balance Sheet
            </h1>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "clamp(14px, 2.5vw, 17px)", margin: "0 auto 28px", lineHeight: 1.65, maxWidth: 560 }}>
              Schedule-based financial statement preparation. Fill notes → Balance Sheet, P&L, and Cash Flow Statement auto-generate. All 2021 mandatory disclosures included.
            </p>
            <div style={{ display: "flex", gap: 28, justifyContent: "center", flexWrap: "wrap" }}>
              {[["28+", "Schedules"], ["11", "Mandatory Ratios"], ["2021", "Amendment Ready"], ["Auto", "Cash Flow"]].map(([val, label]) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#4ade80" }}>{val}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "20px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "wrap" }}>
            {[
              { n: "1", label: "Choose Format" },
              { n: "2", label: "Company Setup" },
              { n: "3", label: "Fill Notes (1–28)" },
              { n: "4", label: "Auto-Validation" },
              { n: "5", label: "BS + P&L + CF" },
            ].map((s, i, arr) => (
              <div key={s.n} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#0f172a", color: "#fff", fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.n}</div>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "#374151", whiteSpace: "nowrap" }}>{s.label}</span>
                </div>
                {i < arr.length - 1 && <span style={{ color: "#cbd5e1", fontSize: 18 }}>→</span>}
              </div>
            ))}
          </div>
        </section>

        {/* Format Cards */}
        <section style={{ padding: "48px 20px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <p style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 24 }}>
              Choose the applicable format for your company
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
              {FORMATS.map((fmt) => (
                <div key={fmt.id} style={{
                  background: fmt.bgColor, border: `2px solid ${fmt.borderColor}`,
                  borderRadius: 20, overflow: "hidden",
                  opacity: fmt.active ? 1 : 0.7,
                  display: "flex", flexDirection: "column",
                }}>
                  {/* Card header */}
                  <div style={{ padding: "20px 22px 16px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: fmt.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                          {fmt.icon}
                        </div>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: 15, color: "#0f172a", lineHeight: 1.2 }}>{fmt.title}</div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{fmt.subtitle}</div>
                        </div>
                      </div>
                      <span style={{
                        background: fmt.active ? fmt.badgeColor : "#f1f5f9",
                        color: fmt.active ? "#fff" : "#94a3b8",
                        fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 99,
                        textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0, marginLeft: 8,
                      }}>
                        {fmt.badge}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: "0 0 12px" }}>{fmt.desc}</p>

                    {/* Applicable to */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Applicable to</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {fmt.applicableTo.map(a => (
                          <span key={a} style={{ background: "rgba(0,0,0,0.05)", color: "#374151", fontSize: 11, padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>{a}</span>
                        ))}
                      </div>
                    </div>

                    {/* Legal standard */}
                    <div style={{ fontSize: 11, color: "#64748b", borderTop: `1px solid ${fmt.borderColor}`, paddingTop: 10 }}>
                      <span style={{ fontWeight: 600 }}>Standard: </span>{fmt.standard}
                      <br />
                      <span style={{ fontWeight: 600 }}>Latest Amendment: </span>{fmt.amendment}
                    </div>
                  </div>

                  {/* CTA */}
                  <div style={{ padding: "0 22px 20px", marginTop: "auto" }}>
                    {fmt.active ? (
                      <Link href={fmt.href} style={{
                        display: "block", textAlign: "center", background: fmt.gradient,
                        color: "#fff", fontWeight: 700, fontSize: 14, padding: "12px 20px",
                        borderRadius: 12, textDecoration: "none",
                      }}>
                        Prepare Balance Sheet →
                      </Link>
                    ) : (
                      <div style={{
                        display: "block", textAlign: "center", background: "#f1f5f9",
                        color: "#94a3b8", fontWeight: 700, fontSize: 13, padding: "11px 20px",
                        borderRadius: 12, cursor: "default",
                      }}>
                        🔒 Coming Soon
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What's included */}
        <section style={{ padding: "48px 20px", background: "#fff", borderTop: "1px solid #e2e8f0" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ textAlign: "center", fontSize: "clamp(18px, 3vw, 26px)", fontWeight: 900, color: "#0f172a", margin: "0 0 8px" }}>
              What Schedule III Division I Generates
            </h2>
            <p style={{ textAlign: "center", color: "#64748b", fontSize: 14, margin: "0 0 32px" }}>
              All mandatory statements + disclosures as per Companies Act 2013 and MCA 2021 amendment
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {[
                { icon: "📊", title: "Balance Sheet (Part I)", desc: "Equity & Liabilities + Assets as per Schedule III format. Real-time balance check — Assets must equal Liabilities." },
                { icon: "📋", title: "Statement of P&L (Part II)", desc: "Revenue, expenses, and profit in Schedule III format. Current and previous year comparative figures." },
                { icon: "💧", title: "Cash Flow Statement", desc: "Indirect method — auto-generated from Balance Sheet movements and P&L data. Operating, Investing, Financing." },
                { icon: "📝", title: "Notes to Accounts (1–28)", desc: "All mandatory notes including Share Capital, Reserves, Fixed Assets, Trade Payables/Receivables ageing." },
                { icon: "📏", title: "11 Financial Ratios", desc: "All 11 ratios mandated by 2021 amendment — Current Ratio, D/E, DSCR, ROE, turnover ratios, etc." },
                { icon: "🏗️", title: "Fixed Asset Schedule", desc: "PPE gross block → additions → disposals → depreciation → net block. Tangible and intangible assets." },
                { icon: "⏳", title: "Ageing Schedules", desc: "Trade Payables and Receivables ageing (4 buckets) per 2021 amendment. MSME vs Others vs Disputed." },
                { icon: "👥", title: "Promoter Shareholding", desc: "Promoter shareholding movement table — beginning of year, end of year, % change (2021 requirement)." },
              ].map(f => (
                <div key={f.title} style={{ background: "#f8fafc", borderRadius: 14, border: "1px solid #e2e8f0", padding: "16px 18px" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 4 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.55 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
