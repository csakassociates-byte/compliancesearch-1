import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Free Board Resolution Generator India — All Resolution Types | Companies Act 2013",
  description:
    "Generate board resolutions for bank account opening, director appointment, loan approval, share allotment, auditor appointment and 10+ more types. Free, instant, professionally formatted per Companies Act 2013. Used by 500+ CAs & CSs.",
  keywords: [
    "board resolution generator India free",
    "board meeting resolution format India",
    "resolution for bank account opening company",
    "director appointment resolution Companies Act",
    "board resolution template private limited",
    "resolution for loan approval board",
    "share allotment board resolution India",
    "auditor appointment resolution format",
    "board resolution authorised signatory",
    "certified true copy board resolution",
    "resolution for GST registration company",
    "board resolution OPC private limited",
    "Companies Act 2013 board resolution",
    "online board resolution generator India",
    "board resolution for registered office change",
  ],
  alternates: { canonical: "https://compliancesearch.in/board-resolution-generator" },
  openGraph: {
    title: "Free Board Resolution Generator India — All Types, Instant",
    description: "Bank account, director appointment, loan, share allotment — all board resolutions free. Per Companies Act 2013.",
    url: "https://compliancesearch.in/board-resolution-generator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Board Resolution Generator India",
    description: "10+ resolution types, instant, professionally formatted. Free tool.",
  },
};

const resolutionTypes = [
  { icon: "🏦", title: "Bank Account Opening", desc: "Authorise directors/officers to open and operate company current account with specified signing authority (single/joint)." },
  { icon: "👤", title: "Director Appointment", desc: "Appoint a new director, additional director, or alternate director as per Section 161 of Companies Act 2013." },
  { icon: "🚪", title: "Director Resignation", desc: "Accept resignation of a director and record the effective date per Section 168." },
  { icon: "💰", title: "Loan / Borrowing Approval", desc: "Approve borrowings within the limits set by shareholders under Section 180(1)(c)." },
  { icon: "📜", title: "Share Allotment", desc: "Allot new equity shares to subscribers or as part of a rights/private placement under Section 62." },
  { icon: "🔍", title: "Auditor Appointment", desc: "Appoint or reappoint statutory auditor and authorise filing of ADT-1 with ROC." },
  { icon: "🔑", title: "Authorised Signatory", desc: "Designate authorised signatories for agreements, documents, applications and correspondence." },
  { icon: "🏢", title: "Registered Office Change", desc: "Change registered office address within the same city/state per Section 12." },
  { icon: "📋", title: "GST / PAN Application", desc: "Authorise a director or officer to apply for GST registration, PAN, trade licence, or other registrations." },
  { icon: "🤝", title: "Related Party Transaction", desc: "Approve transactions with related parties as required under Section 188 and Audit Committee recommendation." },
];

const faqs = [
  {
    q: "What is a board resolution and when is it required?",
    a: "A board resolution is a formal record of a decision made by the Board of Directors at a duly convened board meeting. Under Companies Act 2013, specific actions require a board resolution — such as opening a bank account (no statutory requirement but banks insist on it), appointing directors (Section 161), approving borrowings (Section 180), allotting shares (Section 62), and appointing auditors (Section 139).",
  },
  {
    q: "What must a valid board resolution contain?",
    a: "A valid board resolution must include: name of the company and CIN, date, time, and place of board meeting, names of directors present and total count establishing quorum, the resolution text (RESOLVED THAT...) with specific operative clauses, and the signature of the Chairman or director confirming it as a true extract of the minutes.",
  },
  {
    q: "What is a Certified True Copy (CTC) of a board resolution?",
    a: "A CTC is a copy of the resolution certified with the statement 'Certified to be a True Extract of the Minutes of the Board Meeting held on [date]' signed by a director or Company Secretary. Banks, regulatory authorities (ROC, SEBI, RBI), and government offices require a CTC rather than the original minutes.",
  },
  {
    q: "Does a board resolution need to be on company letterhead?",
    a: "There is no statutory requirement to print a board resolution on letterhead. However, banks typically prefer it on letterhead with company seal. Our tool generates a clean, professional format that includes company details prominently — acceptable for most banks and authorities.",
  },
  {
    q: "Can a board resolution be passed by circular instead of a meeting?",
    a: "Yes. Under Section 175 of Companies Act 2013, a resolution can be passed by circulation (without a physical meeting) if approved by a majority of directors entitled to vote. However, certain resolutions — like approving annual financial statements — cannot be passed by circulation and require a physical/video meeting.",
  },
];

export default function BoardResolutionGeneratorPage() {
  return (
    <main style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: "#1e293b" }}>

      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg,#1e293b 0%,#334155 100%)", padding: "68px 20px 56px", textAlign: "center" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ display: "inline-block", background: "rgba(255,255,255,0.12)", borderRadius: 99, padding: "4px 16px", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.85)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
            10+ Resolution Types
          </div>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 44px)", fontWeight: 900, color: "#fff", margin: "0 0 16px", lineHeight: 1.15 }}>
            Free Board Resolution<br />
            <span style={{ color: "#93c5fd" }}>Generator for Indian Companies</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.78)", fontSize: "clamp(15px, 2.5vw, 18px)", margin: "0 auto 32px", lineHeight: 1.6, maxWidth: 580 }}>
            Generate professionally formatted board resolutions in seconds — bank account opening, director appointment, loan approval, share allotment and more. Free, per Companies Act 2013.
          </p>
          <Link href="/tools/documents/board-resolution"
            style={{ background: "#fff", color: "#1e293b", fontWeight: 900, fontSize: 16, padding: "14px 36px", borderRadius: 14, textDecoration: "none", display: "inline-block", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            Generate Board Resolution →
          </Link>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 16 }}>Free · No subscription · Instant download</p>
        </div>
      </section>

      {/* Resolution Types */}
      <section style={{ padding: "68px 20px", background: "#f8fafc" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(20px, 4vw, 34px)", fontWeight: 900, textAlign: "center", margin: "0 0 12px" }}>
            10+ Resolution Types Covered
          </h2>
          <p style={{ color: "#64748b", textAlign: "center", marginBottom: 44, fontSize: 16 }}>Select a resolution type, fill in the details, download in seconds.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
            {resolutionTypes.map((r) => (
              <div key={r.title} style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0", padding: "18px 20px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{r.icon}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a", marginBottom: 6 }}>{r.title}</div>
                  <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link href="/tools/documents/board-resolution"
              style={{ background: "#1e40af", color: "#fff", fontWeight: 800, fontSize: 15, padding: "13px 32px", borderRadius: 12, textDecoration: "none", display: "inline-block" }}>
              Start Generating — Free →
            </Link>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section style={{ padding: "68px 20px", background: "#fff" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(20px, 4vw, 34px)", fontWeight: 900, textAlign: "center", margin: "0 0 40px" }}>
            What Every Resolution Includes
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              "Company name, CIN, and registered address",
              "Meeting date, time, venue, and quorum",
              "Directors present with designation",
              "Resolution text with operative clauses",
              "Certified True Copy (CTC) certification block",
              "Chairman/Director signature space",
              "Company seal placeholder",
              "Filing-ready format accepted by banks & ROC",
            ].map(item => (
              <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "#334155" }}>
                <span style={{ color: "#059669", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "68px 20px", background: "#f8fafc" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(20px, 4vw, 34px)", fontWeight: 900, textAlign: "center", margin: "0 0 44px" }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {faqs.map((f) => (
              <div key={f.q} style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", padding: "20px 24px" }}>
                <h3 style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", margin: "0 0 10px", lineHeight: 1.4 }}>{f.q}</h3>
                <p style={{ color: "#475569", fontSize: 14, margin: 0, lineHeight: 1.7 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "64px 20px", background: "linear-gradient(135deg,#1e293b,#334155)", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 900, color: "#fff", margin: "0 0 14px" }}>Generate Your Board Resolution</h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 16, margin: "0 0 28px", lineHeight: 1.6 }}>
            Select the resolution type, fill in your company details, and download the formatted document in under 60 seconds.
          </p>
          <Link href="/tools/documents/board-resolution"
            style={{ background: "#fff", color: "#1e293b", fontWeight: 900, fontSize: 17, padding: "15px 38px", borderRadius: 14, textDecoration: "none", display: "inline-block", boxShadow: "0 6px 24px rgba(0,0,0,0.2)" }}>
            Generate Resolution →
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
                "name": "Free Board Resolution Generator India",
                "url": "https://compliancesearch.in/board-resolution-generator",
                "breadcrumb": {
                  "@type": "BreadcrumbList",
                  "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://compliancesearch.in" },
                    { "@type": "ListItem", "position": 2, "name": "Board Resolution Generator", "item": "https://compliancesearch.in/board-resolution-generator" },
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
