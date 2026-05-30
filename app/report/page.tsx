"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect, useCallback, Suspense } from "react";
import type { BusinessProfile } from "@/lib/types";
import { evaluateCondition, type ConditionNode } from "@/lib/condition-engine";

// ─── Types ────────────────────────────────────────────────────────────────────
type DBRule = {
  id: string;
  ruleKey: string;
  name: string;
  shortName: string;
  category: string;
  authority: string;
  description: string;
  howToComply: string;
  frequency: string;
  dueDate: string | null;
  penalty: string | null;
  registrationLink: string | null;
  priority: string;
  isActive: boolean;
  tags: string;
  conditionJson: string;
  documentsJson: string;
};

// ─── Constants ─────────────────────────────────────────────────────────────────
const CATEGORY_ORDER = [
  "central_tax","mca_roc","labor_law","industry_license",
  "environmental","state_compliance","import_export","msme_startup","financial_sector",
  "foreign_compliance","digital_compliance",
];
const CATEGORY_LABELS: Record<string, string> = {
  central_tax:        "Central Tax & GST",
  mca_roc:            "MCA / ROC Compliances",
  labor_law:          "Labour Law",
  industry_license:   "Industry Licenses",
  environmental:      "Environmental",
  state_compliance:   "State Compliance",
  import_export:      "Import / Export",
  msme_startup:       "MSME & Startup",
  financial_sector:   "Financial Sector",
  foreign_compliance: "Global / FEMA & Cross-Border",
  digital_compliance: "Digital, E-Commerce & Data Privacy",
};
const CATEGORY_ICONS: Record<string, string> = {
  central_tax:"🏛", mca_roc:"🏢", labor_law:"👷", industry_license:"🏭",
  environmental:"🌿", state_compliance:"🗺", import_export:"🚢",
  msme_startup:"🚀", financial_sector:"🏦",
  foreign_compliance:"🌏", digital_compliance:"💻",
};
const BIZ_LABEL: Record<string,string> = {
  proprietorship:"Sole Proprietorship", partnership:"Partnership Firm",
  llp:"LLP", opc:"One Person Company (OPC)", pvt_ltd:"Private Limited Company",
  public_ltd:"Public Limited Company", section8:"Section 8 / NGO",
};
const PRIORITY_LABEL: Record<string,string> = {
  critical:"CRITICAL", high:"HIGH", medium:"MEDIUM", low:"LOW",
};
const FREQ_ORDER: Record<string,number> = {
  one_time:0, "One-time":0,
  annually:1, "Annual":1,
  half_yearly:2, "Half-yearly":2,
  quarterly:3, "Quarterly":3,
  monthly:4, "Monthly":4,
  event_based:5, as_applicable:5, "Ongoing":5,
};
const FREQ_LABEL: Record<string,string> = {
  one_time:"One-time", "One-time":"One-time",
  annually:"Annual",   "Annual":"Annual",
  half_yearly:"Half-yearly", "Half-yearly":"Half-yearly",
  quarterly:"Quarterly", "Quarterly":"Quarterly",
  monthly:"Monthly",   "Monthly":"Monthly",
  event_based:"Event-based", as_applicable:"As Applicable", "Ongoing":"Ongoing",
};
const PRIORITY_ORDER: Record<string,number> = { critical:0, high:1, medium:2, low:3 };

// ─── Core helpers ─────────────────────────────────────────────────────────────
function isApplicable(rule: DBRule, profile: BusinessProfile): boolean {
  try { return evaluateCondition(JSON.parse(rule.conditionJson) as ConditionNode, profile); }
  catch { return false; }
}
function getDocuments(rule: DBRule): string[] {
  try { return JSON.parse(rule.documentsJson) as string[]; }
  catch { return []; }
}
function sortRules(rules: DBRule[]): DBRule[] {
  return [...rules].sort((a, b) => {
    const fa = FREQ_ORDER[a.frequency] ?? 5;
    const fb = FREQ_ORDER[b.frequency] ?? 5;
    if (fa !== fb) return fa - fb;
    return (PRIORITY_ORDER[a.priority]??2) - (PRIORITY_ORDER[b.priority]??2);
  });
}

// ─── Print styles ─────────────────────────────────────────────────────────────
const PRINT_CSS = `
  @page { size: A4 portrait; margin: 14mm 14mm 18mm 14mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; color: #1e293b; }
  @media print {
    .no-print { display: none !important; }
    .page-break { page-break-before: always; }
    .avoid-break { page-break-inside: avoid; }
    a { text-decoration: none; color: inherit; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .doc-crossed-text {
      text-decoration: line-through !important;
      color: #9ca3af !important;
      opacity: 0.7;
    }
    .doc-crossed-row {
      background-color: #f9fafb !important;
    }
  }
`;

// ─── Sub-components ───────────────────────────────────────────────────────────
function PriorityBadge({ p }: { p: string }) {
  const cls: Record<string,string> = {
    critical:"bg-red-100 text-red-700 border-red-200",
    high:"bg-orange-100 text-orange-700 border-orange-200",
    medium:"bg-yellow-100 text-yellow-700 border-yellow-200",
    low:"bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <span className={`text-[8pt] font-bold px-1.5 py-0.5 rounded border ${cls[p]||cls.low}`}>
      {PRIORITY_LABEL[p]||p.toUpperCase()}
    </span>
  );
}
function FreqBadge({ f }: { f: string }) {
  const isOneTime = f === "one_time" || f === "One-time";
  return (
    <span className={`text-[8pt] px-1.5 py-0.5 rounded border font-medium ${
      isOneTime ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-gray-50 text-gray-600 border-gray-200"
    }`}>
      {isOneTime ? "⚡ One-time" : (FREQ_LABEL[f] || f)}
    </span>
  );
}

// ─── Main Report Content ──────────────────────────────────────────────────────
function ReportContent() {
  const searchParams = useSearchParams();
  const [dbRules, setDbRules] = useState<DBRule[]>([]);
  const [loading, setLoading] = useState(true);
  // key = `${ruleId}-${docIndex}` → crossed out
  const [crossedDocs, setCrossedDocs] = useState<Set<string>>(new Set());

  const toggleCross = useCallback((key: string) => {
    setCrossedDocs(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  useEffect(() => {
    fetch("/api/rules")
      .then(r => r.json())
      .then(d => setDbRules(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const profile = useMemo<BusinessProfile | null>(() => {
    try { const d = searchParams.get("data"); return d ? JSON.parse(decodeURIComponent(d)) : null; }
    catch { return null; }
  }, [searchParams]);

  const applicable = useMemo<DBRule[]>(() => {
    if (!profile || !dbRules.length) return [];
    return dbRules.filter(r => isApplicable(r, profile));
  }, [profile, dbRules]);

  const byCategory = useMemo(() => {
    const map: Record<string, DBRule[]> = {};
    for (const r of applicable) {
      if (!map[r.category]) map[r.category] = [];
      map[r.category].push(r);
    }
    for (const cat of Object.keys(map)) map[cat] = sortRules(map[cat]);
    return map;
  }, [applicable]);

  const counts = useMemo(() => ({
    total:    applicable.length,
    critical: applicable.filter(r => r.priority === "critical").length,
    high:     applicable.filter(r => r.priority === "high").length,
    medium:   applicable.filter(r => r.priority === "medium").length,
    low:      applicable.filter(r => r.priority === "low").length,
  }), [applicable]);

  const totalDocs = useMemo(() =>
    applicable.reduce((s, r) => s + getDocuments(r).length, 0),
  [applicable]);

  const today = new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" });

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">No profile data found. <a href="/check" className="text-blue-600 underline">Start a new check</a>.</p>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-pulse mb-3">📄</div>
          <p className="text-gray-600 font-medium">Preparing your report…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      {/* Action bar */}
      <div className="no-print fixed top-0 inset-x-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            Compliance Report — {applicable.length} compliances · {totalDocs} documents
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition flex items-center gap-2"
            >
              ⬇ Download / Print PDF
            </button>
            <a href="javascript:history.back()" className="text-sm text-gray-400 hover:text-gray-700 transition">
              ← Back
            </a>
          </div>
        </div>
      </div>

      {/* Report Body */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-10 bg-white min-h-screen" style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>

        {/* ── Report Header ── */}
        <div className="avoid-break border-b-2 border-blue-600 pb-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">⚖️</span>
                <h1 className="text-xl font-bold text-blue-700">ComplianceCheck India</h1>
              </div>
              <p className="text-[9pt] text-gray-500">Comprehensive Business Compliance Applicability Report</p>
            </div>
            <div className="text-right">
              <p className="text-[9pt] text-gray-500">Report Date</p>
              <p className="text-sm font-semibold text-gray-700">{today}</p>
            </div>
          </div>
        </div>

        {/* ── Business Profile ── */}
        <div className="avoid-break bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
          <h2 className="text-[9pt] font-bold text-blue-800 uppercase tracking-wider mb-3">Business Profile</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label:"Business Structure", value: BIZ_LABEL[profile.businessType] || profile.businessType },
              { label:"State / UT",          value: profile.state || "—" },
              { label:"Annual Turnover",     value: profile.turnoverLakhs >= 10000 ? `₹${(profile.turnoverLakhs/100).toFixed(0)} Crore+` : profile.turnoverLakhs >= 100 ? `₹${(profile.turnoverLakhs/100).toFixed(1)} Crore` : `₹${profile.turnoverLakhs} Lakh` },
              { label:"Employee Count",      value: profile.employeeCount === 0 ? "None / NA" : `~${profile.employeeCount}` },
              { label:"Sector",              value: profile.sector.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase()) },
              { label:"Contract Workers",    value: profile.contractWorkers > 0 ? `~${profile.contractWorkers}` : "None" },
              { label:"Special Activities",  value: [
                  profile.hasFood && "Food Business",
                  profile.hasPharma && "Pharma / Drug",
                  profile.hasManufacturing && "Manufacturing",
                  profile.hasImportExport && "Import / Export",
                  profile.hasForeignInvestment && "FDI",
                  profile.isStartup && "Startup (DPIIT)",
                  profile.isListed && "Listed Company",
                  profile.isNBFC && "NBFC",
                ].filter(Boolean).join(", ") || "None" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[8pt] text-blue-600 font-semibold">{label}</p>
                <p className="text-[9pt] font-semibold text-gray-800 mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Summary Stats ── */}
        <div className="avoid-break grid grid-cols-5 gap-3 mb-6">
          {[
            { label:"Total Compliances", val: counts.total,    bg:"bg-blue-600",   text:"text-white" },
            { label:"Critical",           val: counts.critical, bg:"bg-red-50",     text:"text-red-700",    border:"border border-red-200" },
            { label:"High Priority",      val: counts.high,     bg:"bg-orange-50",  text:"text-orange-700", border:"border border-orange-200" },
            { label:"Medium / Low",       val: counts.medium + counts.low, bg:"bg-yellow-50", text:"text-yellow-700", border:"border border-yellow-200" },
            { label:"Total Documents",    val: totalDocs,       bg:"bg-purple-50",  text:"text-purple-700", border:"border border-purple-200" },
          ].map(({ label, val, bg, text, border }) => (
            <div key={label} className={`${bg} ${border||""} rounded-xl p-3 text-center`}>
              <div className={`text-2xl font-bold ${text}`}>{val}</div>
              <div className={`text-[8pt] mt-0.5 font-medium ${text} opacity-80`}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Disclaimer ── */}
        <div className="avoid-break bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-[8pt] text-amber-800">
          <span className="font-bold">⚠ Disclaimer: </span>
          This report is generated for guidance purposes only. Compliance thresholds, due dates, and penalties are subject to change as per government notifications.
          Always consult a qualified Chartered Accountant (CA) or Company Secretary (CS) before taking compliance decisions.
        </div>

        {/* ══ SECTION A: APPLICABLE COMPLIANCES ══ */}
        <div className="mb-2">
          <h2 className="text-base font-bold text-gray-900 border-b-2 border-gray-800 pb-1 mb-4">
            SECTION A — APPLICABLE COMPLIANCES ({counts.total})
          </h2>
          <p className="text-[8.5pt] text-gray-500 mb-4">
            Grouped by category. Within each group, <strong>One-time registrations appear first</strong>, followed by Annual, Quarterly, and Monthly compliances.
          </p>
        </div>

        {CATEGORY_ORDER.filter(cat => byCategory[cat]).map((cat, catIdx) => {
          const rules = byCategory[cat];
          const catDocs = rules.reduce((s, r) => s + getDocuments(r).length, 0);
          return (
            <div key={cat} className={`mb-6 avoid-break ${catIdx > 0 ? "" : ""}`}>
              <div className="flex items-center justify-between bg-gray-800 text-white px-4 py-2 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <span className="text-base">{CATEGORY_ICONS[cat] || "📋"}</span>
                  <h3 className="text-sm font-bold">{CATEGORY_LABELS[cat] || cat}</h3>
                </div>
                <div className="flex items-center gap-2 text-[9pt]">
                  <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{rules.length} compliances</span>
                  <span className="bg-blue-500/60 px-2 py-0.5 rounded text-xs">📋 {catDocs} docs</span>
                </div>
              </div>
              <table className="w-full text-[8.5pt] border border-gray-200 rounded-b-xl overflow-hidden border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600">
                    <th className="text-left px-3 py-1.5 font-semibold w-6">#</th>
                    <th className="text-left px-3 py-1.5 font-semibold">Compliance Name</th>
                    <th className="text-left px-3 py-1.5 font-semibold w-20">Frequency</th>
                    <th className="text-left px-3 py-1.5 font-semibold w-16">Priority</th>
                    <th className="text-left px-3 py-1.5 font-semibold">Authority</th>
                    <th className="text-left px-3 py-1.5 font-semibold">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule, i) => {
                    const isOneTime = rule.frequency === "one_time" || rule.frequency === "One-time";
                    return (
                      <tr key={rule.id} className={`border-t border-gray-100 ${isOneTime ? "bg-purple-50/40" : i%2===0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="px-3 py-2 text-gray-400 text-center">{i+1}</td>
                        <td className="px-3 py-2">
                          <div className="font-semibold text-gray-900">{rule.name}</div>
                          <div className="text-[7.5pt] text-gray-500 mt-0.5 leading-relaxed">{rule.description.length > 120 ? rule.description.substring(0,120)+"…" : rule.description}</div>
                        </td>
                        <td className="px-3 py-2"><FreqBadge f={rule.frequency} /></td>
                        <td className="px-3 py-2"><PriorityBadge p={rule.priority} /></td>
                        <td className="px-3 py-2 text-gray-600">{rule.authority}</td>
                        <td className="px-3 py-2 text-gray-700 font-medium">{rule.dueDate || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {rules.filter(r => r.penalty).length > 0 && (
                <div className="bg-red-50 border border-red-100 border-t-0 rounded-b-xl px-3 py-2 text-[7.5pt] text-red-700">
                  <span className="font-bold">⚠ Penalties: </span>
                  {rules.filter(r => r.penalty).map(r => `${r.shortName}: ${r.penalty}`).join("  •  ")}
                </div>
              )}
            </div>
          );
        })}

        {/* ══ SECTION B: LICENCE-WISE DOCUMENT CHECKLIST ══ */}
        <div className="page-break mt-8">
          <h2 className="text-base font-bold text-gray-900 border-b-2 border-gray-800 pb-1 mb-2">
            SECTION B — REQUIRED DOCUMENTS CHECKLIST (LICENCE-WISE)
          </h2>

          {/* Instruction note — screen only */}
          <div className="no-print mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-start gap-3">
            <span className="text-lg mt-0.5">💡</span>
            <div>
              <p className="text-[8.5pt] text-blue-800 font-semibold">Interactive Checklist</p>
              <p className="text-[8pt] text-blue-700 mt-0.5">
                Click any document row to <strong>cross it out</strong> if it is not applicable or already arranged.
                Click again to restore it. Then click <strong>⬇ Download / Print PDF</strong> to save with your markings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-5">
            <p className="text-[8.5pt] text-gray-500 flex-1">
              Documents required for each of your <strong>{counts.total} applicable compliances</strong>, grouped by category.
              One-time registrations are listed first. Cross out documents already in hand before printing.
            </p>
            <div className="shrink-0 bg-purple-600 text-white rounded-xl px-4 py-2 text-center">
              <div className="text-2xl font-bold">{totalDocs}</div>
              <div className="text-[7.5pt] opacity-80">Total Docs</div>
            </div>
          </div>

          {/* Category → Rule → Docs */}
          {CATEGORY_ORDER.filter(cat => byCategory[cat]).map((cat) => {
            const rules = byCategory[cat].filter(r => getDocuments(r).length > 0);
            if (!rules.length) return null;

            return (
              <div key={cat} className="mb-6">
                {/* Category separator */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">{CATEGORY_ICONS[cat]}</span>
                  <h3 className="text-[9.5pt] font-bold text-gray-700 uppercase tracking-wide">
                    {CATEGORY_LABELS[cat]}
                  </h3>
                  <div className="flex-1 border-b border-dashed border-gray-300 ml-2" />
                  <span className="text-[7.5pt] text-gray-400 shrink-0">{rules.length} compliances</span>
                </div>

                {/* Each rule */}
                {rules.map((rule) => {
                  const docs = getDocuments(rule);
                  const isOneTime = rule.frequency === "one_time" || rule.frequency === "One-time";
                  const crossedCount = docs.filter((_, di) => crossedDocs.has(`${rule.id}-${di}`)).length;

                  return (
                    <div key={rule.id} className="mb-4 avoid-break rounded-xl border border-gray-200 overflow-hidden">

                      {/* Rule header */}
                      <div className={`flex items-center justify-between px-3 py-2 ${
                        isOneTime
                          ? "bg-purple-50 border-b border-purple-100"
                          : "bg-slate-50 border-b border-slate-100"
                      }`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`shrink-0 text-[8pt] font-bold w-4 h-4 rounded flex items-center justify-center ${
                            isOneTime ? "bg-purple-200 text-purple-700" : "bg-slate-200 text-slate-600"
                          }`}>
                            {isOneTime ? "★" : "↻"}
                          </span>
                          <span className={`text-[9pt] font-bold truncate ${isOneTime ? "text-purple-900" : "text-slate-800"}`}>
                            {rule.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <FreqBadge f={rule.frequency} />
                          <PriorityBadge p={rule.priority} />
                          <span className="no-print text-[7.5pt] text-gray-400 ml-1">
                            {crossedCount > 0 ? `${crossedCount} crossed` : `${docs.length} docs`}
                          </span>
                          {/* Print-only doc count */}
                          <span className="hidden print:inline text-[7.5pt] text-gray-400 ml-1">
                            {docs.length} docs
                          </span>
                        </div>
                      </div>

                      {/* Document rows */}
                      <div>
                        {docs.map((doc, di) => {
                          const key = `${rule.id}-${di}`;
                          const crossed = crossedDocs.has(key);
                          return (
                            <div
                              key={di}
                              onClick={() => toggleCross(key)}
                              className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-all select-none
                                ${di < docs.length - 1 ? "border-b border-gray-100" : ""}
                                ${crossed
                                  ? "doc-crossed-row bg-gray-50 hover:bg-gray-100"
                                  : di % 2 === 0 ? "bg-white hover:bg-blue-50/40" : "bg-gray-50/40 hover:bg-blue-50/40"
                                }
                              `}
                            >
                              {/* Checkbox / Cross icon */}
                              <div className={`shrink-0 w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                crossed
                                  ? "bg-red-100 border-red-300 text-red-500"
                                  : "border-gray-400 bg-white"
                              }`}>
                                {crossed && (
                                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                  </svg>
                                )}
                              </div>

                              {/* Doc number */}
                              <span className={`shrink-0 text-[8pt] font-semibold w-5 text-right transition-colors ${
                                crossed ? "text-gray-300" : "text-gray-400"
                              }`}>{di + 1}.</span>

                              {/* Doc text */}
                              <span className={`text-[8.5pt] leading-relaxed flex-1 transition-all ${
                                crossed
                                  ? "doc-crossed-text line-through text-gray-400"
                                  : "text-gray-800"
                              }`}>
                                {doc}
                              </span>

                              {/* Screen-only tooltip */}
                              {crossed ? (
                                <span className="no-print shrink-0 text-[7pt] text-red-400 italic">not needed</span>
                              ) : (
                                <span className="no-print shrink-0 text-[7pt] text-gray-300 opacity-0 group-hover:opacity-100 italic">click to cross</span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Signature block */}
          <div className="mt-8 grid grid-cols-2 gap-8 avoid-break">
            <div>
              <div className="border-b border-gray-400 mb-1 h-8" />
              <p className="text-[8pt] text-gray-500">Prepared by (Name & Signature)</p>
              <p className="text-[8pt] text-gray-400 mt-0.5">CA / CS / Compliance Officer</p>
            </div>
            <div>
              <div className="border-b border-gray-400 mb-1 h-8" />
              <p className="text-[8pt] text-gray-500">Client / Authorized Signatory</p>
              <p className="text-[8pt] text-gray-400 mt-0.5">Date: _______________</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-3 border-t border-gray-200 text-center text-[7.5pt] text-gray-400">
            Generated by ComplianceCheck India  •  {today}  •  For professional guidance only
          </div>
        </div>

      </div>
    </>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">📄</div>
          <p className="text-gray-600 font-semibold">Preparing your report…</p>
        </div>
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}
