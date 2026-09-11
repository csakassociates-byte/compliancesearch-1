"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const ACTIONS = [
  // ── DIRECTOR ACTIONS ──
  {
    icon: "👤",
    title: "Director Appointment",
    subtitle: "Section 161(1) / 152 · Companies Act 2013",
    desc: "Appoint an Additional Director or Regular Director. One action → Board Notice, Minutes, Resolution, DIR-2, DIR-8, and ROC filing guide.",
    docs: ["Board Notice (SS-1)", "Board Minutes", "Board Resolution", "DIR-2 Consent", "DIR-8 Declaration", "DIR-12 ROC Guide"],
    rocForm: "DIR-12 (within 30 days)",
    href: "/tools/corporate-action-kit/director-appointment",
    active: true,
    badge: "Live",
    color: { bg: "#eff6ff", border: "#bfdbfe", title: "#1d4ed8", badge: "#1d4ed8", badgeBg: "#dbeafe" },
    icon_bg: "linear-gradient(135deg,#1d4ed8,#1e40af)",
  },
  {
    icon: "🚪",
    title: "Director Resignation",
    subtitle: "Section 168 · DIR-11 / DIR-12",
    desc: "Accept director resignation — board notice, resignation letter, board resolution accepting resignation, DIR-11 guide for director, and DIR-12 guide for company.",
    docs: ["Board Notice (SS-1)", "Resignation Letter", "Resignation CTC", "DIR-11 Guide", "DIR-12 ROC Guide"],
    rocForm: "DIR-12 (within 30 days)",
    href: "/tools/corporate-action-kit/director-appointment?action=resign",
    active: true,
    badge: "Live",
    color: { bg: "#eff6ff", border: "#bfdbfe", title: "#1d4ed8", badge: "#1d4ed8", badgeBg: "#dbeafe" },
    icon_bg: "linear-gradient(135deg,#1d4ed8,#1e40af)",
  },
  {
    icon: "🔄",
    title: "Appoint + Resign (Same Meeting)",
    subtitle: "Combined board action · Section 152 + 168",
    desc: "Both director appointment and resignation in the same board meeting — complete document package for simultaneous director change.",
    docs: ["Board Notice (SS-1)", "2× Resolutions", "DIR-2", "DIR-8", "Resignation Letter", "Resignation CTC", "2× DIR-12 Guide"],
    rocForm: "2× DIR-12 (within 30 days each)",
    href: "/tools/corporate-action-kit/director-appointment?action=both",
    active: true,
    badge: "Live",
    color: { bg: "#eff6ff", border: "#bfdbfe", title: "#1d4ed8", badge: "#1d4ed8", badgeBg: "#dbeafe" },
    icon_bg: "linear-gradient(135deg,#1d4ed8,#1e40af)",
  },
  // ── AUDITOR ──
  {
    icon: "🔍",
    title: "Auditor Appointment",
    subtitle: "Section 139 · ADT-1",
    desc: "First auditor, AGM appointment, or casual vacancy — board notice, resolution CTC, auditor consent & certificate, letter of appointment, ADT-1 guide.",
    docs: ["Board/AGM Notice", "Resolution CTC", "Auditor Consent", "Appointment Letter", "ADT-1 Guide"],
    rocForm: "ADT-1 (within 15 days)",
    href: "/tools/corporate-action-kit/auditor-appointment",
    active: true,
    badge: "Live",
    color: { bg: "#f0fdfa", border: "#99f6e4", title: "#0f766e", badge: "#0f766e", badgeBg: "#ccfbf1" },
    icon_bg: "linear-gradient(135deg,#0d9488,#0f766e)",
  },
  // ── OTHER CORPORATE ACTIONS ──
  {
    icon: "🏢",
    title: "Registered Office Change",
    subtitle: "Section 12 · INC-22",
    desc: "Change registered office within same city or state — board resolution and INC-22 attachment.",
    docs: ["Board Minutes", "Board Resolution", "INC-22 Attachment"],
    rocForm: "INC-22 (within 30 days)",
    href: "#",
    active: false,
    badge: "Coming Soon",
    color: { bg: "#f8fafc", border: "#e2e8f0", title: "#64748b", badge: "#64748b", badgeBg: "#f1f5f9" },
    icon_bg: "linear-gradient(135deg,#64748b,#475569)",
  },
  {
    icon: "📝",
    title: "Company Name Change",
    subtitle: "Section 13 · RUN + INC-24",
    desc: "Change company name — board resolution, EGM special resolution, RUN application, INC-24 filing.",
    docs: ["Board Minutes", "EGM Notice", "EGM Minutes", "Special Resolution", "INC-24 Attachment"],
    rocForm: "INC-24 + MGT-14",
    href: "#",
    active: false,
    badge: "Coming Soon",
    color: { bg: "#f8fafc", border: "#e2e8f0", title: "#64748b", badge: "#64748b", badgeBg: "#f1f5f9" },
    icon_bg: "linear-gradient(135deg,#64748b,#475569)",
  },
  // ── MEETINGS ──
  {
    icon: "📋",
    title: "Board Meeting Minutes",
    subtitle: "Section 173 · SS-1 Compliant",
    desc: "Generate complete board meeting minutes for any agenda — routine quarterly meetings, resolutions, attendance register, and chairman's signature block.",
    docs: ["Board Notice (SS-1)", "Board Minutes", "Attendance Register", "Resolutions CTC"],
    rocForm: "As applicable per agenda",
    href: "/tools/documents/minutes/board",
    active: true,
    badge: "Live",
    color: { bg: "#eef2ff", border: "#c7d2fe", title: "#4338ca", badge: "#4338ca", badgeBg: "#e0e7ff" },
    icon_bg: "linear-gradient(135deg,#4f46e5,#4338ca)",
  },
  {
    icon: "🏛️",
    title: "AGM Minutes",
    subtitle: "Section 96 · Annual General Meeting",
    desc: "Annual General Meeting minutes — adoption of accounts, dividend declaration, director retirement, auditor reappointment, and all statutory resolutions.",
    docs: ["AGM Notice", "AGM Minutes", "Ordinary Resolutions", "Attendance Register"],
    rocForm: "As applicable",
    href: "/tools/documents/minutes/agm",
    active: true,
    badge: "Live",
    color: { bg: "#faf5ff", border: "#e9d5ff", title: "#7e22ce", badge: "#7e22ce", badgeBg: "#f3e8ff" },
    icon_bg: "linear-gradient(135deg,#9333ea,#7e22ce)",
  },
  {
    icon: "⚡",
    title: "EGM Minutes",
    subtitle: "Section 100 · Extraordinary General Meeting",
    desc: "Extraordinary General Meeting for special resolutions — name change, capital restructuring, MOA/AOA amendment, and other shareholder approvals.",
    docs: ["EGM Notice", "EGM Minutes", "Special Resolutions", "Attendance Register"],
    rocForm: "MGT-14 (within 30 days)",
    href: "/tools/documents/minutes/egm",
    active: true,
    badge: "Live",
    color: { bg: "#fffbeb", border: "#fde68a", title: "#b45309", badge: "#b45309", badgeBg: "#fef3c7" },
    icon_bg: "linear-gradient(135deg,#f59e0b,#b45309)",
  },
  {
    icon: "👥",
    title: "Committee Meeting Minutes",
    subtitle: "Audit · NRC · CSR · Stakeholder",
    desc: "Minutes for Audit Committee, Nomination & Remuneration Committee, CSR Committee, and Stakeholder Relationship Committee meetings.",
    docs: ["Committee Notice", "Committee Minutes", "Resolutions", "Attendance Register"],
    rocForm: "As applicable",
    href: "/tools/documents/minutes/committee",
    active: true,
    badge: "Live",
    color: { bg: "#f0fdf4", border: "#bbf7d0", title: "#166534", badge: "#166534", badgeBg: "#dcfce7" },
    icon_bg: "linear-gradient(135deg,#16a34a,#166534)",
  },
  {
    icon: "🏛️",
    title: "First Board Meeting",
    subtitle: "Section 173 · within 30 days of incorporation",
    desc: "Complete first board meeting — all SS-1 mandatory agenda items, appointment resolutions, bank account.",
    docs: ["Board Notice", "Board Minutes", "All Routine Resolutions", "Appointment Letters"],
    rocForm: "Multiple forms",
    href: "#",
    active: false,
    badge: "Coming Soon",
    color: { bg: "#f8fafc", border: "#e2e8f0", title: "#64748b", badge: "#64748b", badgeBg: "#f1f5f9" },
    icon_bg: "linear-gradient(135deg,#64748b,#475569)",
  },
  // ── SHARES ──
  {
    icon: "🔄",
    title: "Share Transfer",
    subtitle: "Section 56 · SH-4 · Companies Act 2013",
    desc: "Transfer equity shares between parties — SH-4 instrument of transfer, board resolution approving transfer, and updated share register.",
    docs: ["SH-4 Transfer Deed", "Board Resolution", "Share Register Update", "Intimation Letter"],
    rocForm: "No ROC filing (private company)",
    href: "/tools/documents/share-transfer",
    active: true,
    badge: "Live",
    color: { bg: "#fff7ed", border: "#fed7aa", title: "#c2410c", badge: "#c2410c", badgeBg: "#ffedd5" },
    icon_bg: "linear-gradient(135deg,#ea580c,#c2410c)",
  },
  {
    icon: "📜",
    title: "Share Certificate",
    subtitle: "Section 46 · SH-1 · Companies Act 2013",
    desc: "Issue or duplicate share certificates — SH-1 format, board resolution, register of members update.",
    docs: ["Share Certificate (SH-1)", "Board Resolution", "Register of Members"],
    rocForm: "No ROC filing required",
    href: "/tools/documents/share-certificate",
    active: true,
    badge: "Live",
    color: { bg: "#fff1f2", border: "#fecdd3", title: "#be123c", badge: "#be123c", badgeBg: "#ffe4e6" },
    icon_bg: "linear-gradient(135deg,#e11d48,#be123c)",
  },
  {
    icon: "💰",
    title: "Share Allotment",
    subtitle: "Section 62 · PAS-3",
    desc: "Allot equity shares via rights issue or private placement — board resolution, allotment letter, PAS-3.",
    docs: ["Board Minutes", "Board Resolution", "Allotment Letter", "PAS-3 Attachment"],
    rocForm: "PAS-3 (within 30 days)",
    href: "#",
    active: false,
    badge: "Coming Soon",
    color: { bg: "#f8fafc", border: "#e2e8f0", title: "#64748b", badge: "#64748b", badgeBg: "#f1f5f9" },
    icon_bg: "linear-gradient(135deg,#64748b,#475569)",
  },
  {
    icon: "📊",
    title: "Share Capital Increase",
    subtitle: "Section 61 · SH-7 + MGT-14",
    desc: "Increase authorised share capital by alteration of MOA — special resolution, EGM, SH-7 filing.",
    docs: ["Board Minutes", "EGM Notice", "EGM Minutes", "Special Resolution", "SH-7", "MGT-14"],
    rocForm: "SH-7 + MGT-14",
    href: "#",
    active: false,
    badge: "Coming Soon",
    color: { bg: "#f8fafc", border: "#e2e8f0", title: "#64748b", badge: "#64748b", badgeBg: "#f1f5f9" },
    icon_bg: "linear-gradient(135deg,#64748b,#475569)",
  },
  // ── BANK ──
  {
    icon: "🏦",
    title: "Bank Resolution",
    subtitle: "Section 179(3)(d) · Banking Operations",
    desc: "Board resolution for opening bank account, changing signatories, or sanctioning CC/OD limits — accepted by all banks.",
    docs: ["Board Resolution", "Signatory Authority Letter", "Board Minutes"],
    rocForm: "No ROC filing required",
    href: "/tools/documents/bank-resolution",
    active: true,
    badge: "Live",
    color: { bg: "#ecfeff", border: "#a5f3fc", title: "#0e7490", badge: "#0e7490", badgeBg: "#cffafe" },
    icon_bg: "linear-gradient(135deg,#0891b2,#0e7490)",
  },
  // ── ANNUAL COMPLIANCE ──
  {
    icon: "📊",
    title: "Annual Filing (AOC-4 / MGT-7)",
    subtitle: "Section 137 / 92 · MCA Annual Filing",
    desc: "Generate AOC-4 and MGT-7A attachments — Directors' Report, Secretarial Audit Report, MGT-9 Extract, and all annual return attachments.",
    docs: ["Directors' Report", "AOC-4 Attachments", "MGT-7A Attachments", "Annual Report Cover"],
    rocForm: "AOC-4 + MGT-7A",
    href: "/tools/documents/annual-filing",
    active: true,
    badge: "Live",
    color: { bg: "#f0fdf4", border: "#bbf7d0", title: "#15803d", badge: "#15803d", badgeBg: "#dcfce7" },
    icon_bg: "linear-gradient(135deg,#16a34a,#15803d)",
  },
];

export default function CorporateActionKitPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50">
        {/* Hero */}
        <section className="px-4 py-14 text-center" style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)" }}>
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-bold text-white/80 mb-5 tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              8 Actions Live · Board · AGM · EGM · Bank · Shares · Director · Auditor · Annual Filing
            </div>
            <h1 className="text-4xl font-black text-white mb-4 leading-tight">
              Corporate<span className="text-amber-400"> Action Kit</span>
            </h1>
            <p className="text-white/70 text-lg mb-3 leading-relaxed">
              Select a corporate action → get every document, deadline, and ROC filing guide automatically.
            </p>
            <p className="text-white/45 text-sm">
              Board Notice · Minutes · Resolutions · DIR-2 · DIR-8 · ROC Filing Guide — all at once.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 py-8 bg-white border-b border-slate-100">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-0 text-sm">
              {[
                { n: "1", label: "Select Action" },
                { n: "2", label: "Company Details" },
                { n: "3", label: "Meeting & Dates" },
                { n: "4", label: "Director Details" },
                { n: "5", label: "Get Full Package" },
              ].map((s, i, arr) => (
                <div key={s.n} className="flex items-center gap-0">
                  <div className="flex items-center gap-2 px-4 py-2">
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center flex-shrink-0">{s.n}</div>
                    <span className="font-semibold text-slate-700 whitespace-nowrap">{s.label}</span>
                  </div>
                  {i < arr.length - 1 && <span className="text-slate-300 text-lg hidden sm:block">→</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why use this Kit */}
        <section className="px-4 py-10 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  icon: "⚡",
                  title: "One Action → Full Package",
                  desc: "Select a corporate action and get every document you need — board notice, minutes, resolutions, director forms, and ROC filing guide — all at once.",
                },
                {
                  icon: "⚖️",
                  title: "Companies Act 2013 Compliant",
                  desc: "All documents follow the correct legal provisions — Section 161 for director appointment, Section 139 for auditor, SS-1 for board meetings, SS-2 for AGM/EGM.",
                },
                {
                  icon: "🎁",
                  title: "Always Free. No Login.",
                  desc: "All 10 live tools are completely free to use. No account required. Download your document package instantly.",
                },
              ].map(b => (
                <div key={b.title} className="flex gap-4 p-5 rounded-2xl border border-slate-100 bg-slate-50">
                  <div className="text-3xl flex-shrink-0">{b.icon}</div>
                  <div>
                    <h2 className="font-extrabold text-slate-800 text-sm mb-1">{b.title}</h2>
                    <p className="text-xs text-slate-500 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Actions Grid */}
        <section className="px-4 py-10">
          <div className="max-w-5xl mx-auto">
            <p className="text-center text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Choose your corporate action</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ACTIONS.map((a) => {
                const Card = (
                  <div
                    key={a.title}
                    className="rounded-2xl border-2 p-5 flex flex-col gap-3 transition-all"
                    style={{
                      background: a.color.bg,
                      borderColor: a.color.border,
                      opacity: a.active ? 1 : 0.7,
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{ background: a.icon_bg }}>
                          {a.icon}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm leading-tight" style={{ color: a.color.title }}>{a.title}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{a.subtitle}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                        style={{ color: a.color.badge, background: a.color.badgeBg }}>
                        {a.badge}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed">{a.desc}</p>

                    {/* Documents generated */}
                    <div className="flex flex-wrap gap-1.5">
                      {a.docs.map(d => (
                        <span key={d} className="text-xs bg-white border border-slate-200 rounded-full px-2.5 py-0.5 text-slate-600 font-medium">{d}</span>
                      ))}
                    </div>

                    {/* ROC form */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                      <span>📋</span>
                      <span>ROC: {a.rocForm}</span>
                    </div>

                    {/* CTA */}
                    {a.active && (
                      <div className="mt-auto pt-1">
                        <div className="w-full py-2.5 rounded-xl text-center text-sm font-bold text-white"
                          style={{ background: a.icon_bg }}>
                          Start → Generate Package
                        </div>
                      </div>
                    )}
                  </div>
                );

                return a.active ? (
                  <Link key={a.title} href={a.href} className="block hover:-translate-y-0.5 transition-transform">
                    {Card}
                  </Link>
                ) : (
                  <div key={a.title} className="cursor-not-allowed">
                    {Card}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="px-4 py-12 bg-white border-t border-slate-100">
          <div className="max-w-3xl mx-auto">
            <p className="text-center text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">FAQ</p>
            <h2 className="text-center text-2xl font-extrabold text-slate-900 mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                {
                  q: "What documents are needed for director appointment in a private limited company?",
                  a: "For appointing a director under Section 161 of the Companies Act 2013, you need 5 documents: (1) Board Meeting Notice (SS-1 compliant, minimum 7 days notice), (2) Board Resolution approving the appointment, (3) DIR-2 — Written Consent to Act as Director, (4) DIR-8 — Declaration that the person is not disqualified, and (5) DIR-12 ROC filing within 30 days of appointment. The Director Appointment tool generates all 5 in one step.",
                },
                {
                  q: "What documents are required for auditor appointment?",
                  a: "For auditor appointment under Section 139, you need: Board meeting notice, Board resolution, Auditor's written consent letter, Eligibility certificate (Section 141 compliance), and ADT-1 ROC filing within 15 days of AGM (or 30 days for Board-appointed first auditor). All documents are generated automatically by the Auditor Appointment tool.",
                },
                {
                  q: "What is SS-1 compliance for board meetings?",
                  a: "SS-1 is the Secretarial Standard for Board Meetings issued by ICSI. It prescribes mandatory requirements including: notice must be given at least 7 days before the meeting, agenda must accompany the notice, quorum must be maintained, and minutes must be signed within 30 days of the meeting. All board meeting documents generated by this kit are SS-1 compliant.",
                },
                {
                  q: "What is the difference between AGM and EGM?",
                  a: "AGM (Annual General Meeting) is held once a year, within 6 months of financial year end under Section 96. It covers statutory business — accounts adoption, dividend declaration, director retirement, auditor appointment. EGM (Extraordinary General Meeting) is called at any time for urgent matters under Section 100 — special resolutions for name change, capital restructuring, MOA/AOA amendment, etc. Filing MGT-14 with ROC within 30 days is required for special resolutions passed at EGM.",
                },
                {
                  q: "Is the Corporate Action Kit free to use?",
                  a: "Yes, completely free. All 10 live tools — Director Appointment, Auditor Appointment, Board Minutes, AGM Minutes, EGM Minutes, Committee Meeting, Share Transfer, Share Certificate, Bank Resolution, and Annual Filing — are available without login or payment. Download your complete document package instantly.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="font-extrabold text-slate-800 text-sm mb-2">{q}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
