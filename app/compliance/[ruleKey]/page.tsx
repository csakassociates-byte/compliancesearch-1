import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import type { Metadata } from "next";

const CAT_META: Record<string, { label: string; color: string; icon: string }> = {
  central_tax:       { label: "Central Tax",        color: "#1d4ed8", icon: "🏛️" },
  mca_roc:           { label: "MCA / ROC",           color: "#0891b2", icon: "📋" },
  labor_law:         { label: "Labour Law",          color: "#d97706", icon: "👷" },
  industry_license:  { label: "Industry License",    color: "#16a34a", icon: "🏭" },
  environmental:     { label: "Environment",         color: "#059669", icon: "🌿" },
  state_compliance:  { label: "State Compliance",    color: "#7c3aed", icon: "🗺️" },
  import_export:     { label: "Import / Export",     color: "#dc2626", icon: "🚢" },
  msme_startup:      { label: "MSME / Startup",      color: "#db2777", icon: "🚀" },
  financial_sector:  { label: "Financial Sector",    color: "#0369a1", icon: "🏦" },
  foreign_compliance:{ label: "Foreign Compliance",  color: "#6d28d9", icon: "🌐" },
  digital_compliance:{ label: "Digital / Data",      color: "#0f766e", icon: "💻" },
};

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  critical: { label: "Critical",  className: "bg-red-100 text-red-700 border border-red-200" },
  high:     { label: "High",      className: "bg-orange-100 text-orange-700 border border-orange-200" },
  medium:   { label: "Medium",    className: "bg-yellow-100 text-yellow-700 border border-yellow-200" },
  low:      { label: "Low",       className: "bg-slate-100 text-slate-500 border border-slate-200" },
};

const FREQ_LABEL: Record<string, string> = {
  monthly: "📅 Monthly", quarterly: "📆 Quarterly", annually: "📆 Annual",
  one_time: "⚡ One-time", half_yearly: "📆 Half-yearly", event_based: "🔔 Event-based",
  as_applicable: "📌 As applicable", ongoing: "🔄 Ongoing",
};

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

type Props = { params: Promise<{ ruleKey: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ruleKey } = await params;
  const rule = await prisma.complianceRule.findUnique({ where: { ruleKey } });
  if (!rule) return { title: "Not Found" };
  return {
    title: `${rule.name} — Compliance Guide | ComplianceSearch.in`,
    description: rule.description.slice(0, 155),
    keywords: `${rule.name}, ${rule.tags}, compliance India, ${rule.authority}`,
  };
}

export default async function ComplianceRulePage({ params }: Props) {
  const { ruleKey } = await params;
  const rule = await prisma.complianceRule.findUnique({ where: { ruleKey } });
  if (!rule || !rule.isActive) notFound();

  const cat = CAT_META[rule.category] || { label: rule.category, color: "#64748b", icon: "📋" };
  const pri = PRIORITY_CONFIG[rule.priority] || PRIORITY_CONFIG.medium;
  const docs: string[] = (() => { try { return JSON.parse(rule.documentsJson); } catch { return []; } })();

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <div className="max-w-3xl mx-auto w-full px-4 py-10 flex-1">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-8 flex-wrap">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>›</span>
          <Link href="/check" className="hover:text-blue-600">Compliance</Link>
          <span>›</span>
          <span style={{ color: cat.color }}>{cat.icon} {cat.label}</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm font-bold px-3 py-1 rounded-full"
              style={{ background: cat.color + "18", color: cat.color }}>
              {cat.icon} {cat.label}
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${pri.className}`}>
              {pri.label} Priority
            </span>
            {rule.frequency && (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                {FREQ_LABEL[rule.frequency] || rule.frequency}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight mb-2">{rule.name}</h1>
          {rule.shortName !== rule.name && (
            <p className="text-slate-500 font-medium">{rule.shortName}</p>
          )}
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Authority</p>
            <p className="font-bold text-slate-800 text-sm">{rule.authority}</p>
          </div>
          {rule.dueDate && (
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1">Due Date</p>
              <p className="font-bold text-blue-800 text-sm">{rule.dueDate}</p>
            </div>
          )}
          {rule.penalty && (
            <div className="bg-red-50 rounded-2xl p-4 border border-red-100 col-span-2 sm:col-span-1">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">Penalty</p>
              <p className="font-bold text-red-700 text-sm line-clamp-2">{rule.penalty}</p>
            </div>
          )}
        </div>

        {/* Description */}
        <section className="mb-8">
          <h2 className="text-lg font-extrabold text-slate-900 mb-3 flex items-center gap-2">
            📌 What is this Compliance?
          </h2>
          <p className="text-slate-700 leading-relaxed text-justify">{rule.description}</p>
        </section>

        {/* How to Comply */}
        <section className="mb-8">
          <h2 className="text-lg font-extrabold text-slate-900 mb-3 flex items-center gap-2">
            ✅ How to Comply
          </h2>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm text-justify">{rule.howToComply}</p>
          </div>
        </section>

        {/* Penalty Detail */}
        {rule.penalty && (
          <section className="mb-8">
            <h2 className="text-lg font-extrabold text-slate-900 mb-3 flex items-center gap-2">
              ⚠️ Penalty for Non-Compliance
            </h2>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
              <p className="text-slate-700 leading-relaxed text-sm">{rule.penalty}</p>
            </div>
          </section>
        )}

        {/* Required Documents */}
        {docs.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-extrabold text-slate-900 mb-3 flex items-center gap-2">
              📄 Required Documents
            </h2>
            <ul className="space-y-2">
              {docs.map((d: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="text-blue-500 font-bold mt-0.5 shrink-0">•</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Tags */}
        {rule.tags && (
          <div className="flex flex-wrap gap-2 mb-8">
            {rule.tags.split(",").map(t => t.trim()).filter(Boolean).map(t => (
              <span key={t} className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">#{t}</span>
            ))}
          </div>
        )}

        {/* Last Updated */}
        <p className="text-xs text-slate-400 mb-8">
          🕒 Last updated: {fmtDate(rule.updatedAt)}
        </p>

        {/* CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link href="/check"
            className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white text-base transition hover:scale-105"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
            🔍 Check if This Applies to You →
          </Link>
          {rule.registrationLink && (
            <a href={rule.registrationLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-blue-700 border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition">
              🔗 Official Portal →
            </a>
          )}
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-700">
          <strong>Disclaimer:</strong> This information is for guidance only. Laws change frequently. Always consult a qualified CA or CS for compliance decisions.
        </div>
      </div>

      <footer className="border-t border-slate-200 py-6 px-4 mt-auto">
        <div className="max-w-3xl mx-auto text-center text-sm text-slate-400">
          © {new Date().getFullYear()} ComplianceSearch.in — Powered by{" "}
          <a href="https://geebharat.com" className="text-amber-600 hover:underline">Gee Bharat</a>
        </div>
      </footer>
    </main>
  );
}
