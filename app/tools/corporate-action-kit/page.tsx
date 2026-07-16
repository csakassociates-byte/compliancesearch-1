"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const ACTIONS = [
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
    desc: "Accept director resignation — resignation letter, board resolution, DIR-11 by director, DIR-12 by company.",
    docs: ["Resignation Letter", "Board Minutes", "Board Resolution", "DIR-11", "DIR-12 ROC Guide"],
    rocForm: "DIR-12 (within 30 days)",
    href: "#",
    active: false,
    badge: "Coming Soon",
    color: { bg: "#f8fafc", border: "#e2e8f0", title: "#64748b", badge: "#64748b", badgeBg: "#f1f5f9" },
    icon_bg: "linear-gradient(135deg,#64748b,#475569)",
  },
  {
    icon: "🔄",
    title: "Appoint + Resign (Same Meeting)",
    subtitle: "Combined board action",
    desc: "Both actions in the same board meeting — complete package for simultaneous director change.",
    docs: ["Board Notice", "Board Minutes", "2× Resolutions", "DIR-2", "DIR-8", "2× ROC Guide"],
    rocForm: "2× DIR-12",
    href: "#",
    active: false,
    badge: "Coming Soon",
    color: { bg: "#f8fafc", border: "#e2e8f0", title: "#64748b", badge: "#64748b", badgeBg: "#f1f5f9" },
    icon_bg: "linear-gradient(135deg,#64748b,#475569)",
  },
  {
    icon: "🔍",
    title: "Auditor Appointment",
    subtitle: "Section 139 · ADT-1",
    desc: "Appoint statutory auditor at AGM — consent letter, AGM minutes, board resolution, ADT-1 attachment.",
    docs: ["AGM Notice", "AGM Minutes", "Resolution", "Consent Letter", "ADT-1 Attachment"],
    rocForm: "ADT-1 (within 15 days of AGM)",
    href: "#",
    active: false,
    badge: "Coming Soon",
    color: { bg: "#f8fafc", border: "#e2e8f0", title: "#64748b", badge: "#64748b", badgeBg: "#f1f5f9" },
    icon_bg: "linear-gradient(135deg,#64748b,#475569)",
  },
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
              Director Appointment Live · More Actions Coming Soon
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
      </main>
    </>
  );
}
