"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState, useEffect, useCallback, Suspense } from "react";
import type { BusinessProfile } from "@/lib/types";
import { evaluateCondition, type ConditionNode } from "@/lib/condition-engine";
import { CATEGORY_META } from "@/lib/compliance-rules";

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
  updatedAt: string;
};

const CATEGORY_ORDER = [
  "central_tax","mca_roc","labor_law","industry_license",
  "environmental","state_compliance","import_export","msme_startup","financial_sector",
  "foreign_compliance","digital_compliance",
];

/** True if any advanced-form field has been filled in the profile */
function hasAdvancedData(p: BusinessProfile): boolean {
  return (
    p.netProfitLakhs !== undefined ||
    p.netWorthCrore !== undefined ||
    p.hasFDIReceived !== undefined ||
    p.hasOverseasSub !== undefined ||
    p.makesForeignPayments !== undefined ||
    p.intlTxnLakhs !== undefined ||
    p.groupRevCrore !== undefined ||
    p.hasECBBorrowing !== undefined ||
    p.isForeignEntityIndia !== undefined ||
    p.expandingAbroad !== undefined ||
    p.isEcomOperator !== undefined ||
    p.collectsPersonalData !== undefined ||
    p.hasRealEstateDev !== undefined ||
    p.hasConstructionActivity !== undefined ||
    p.hasCryptoVDA !== undefined ||
    p.receivesForeignDonation !== undefined ||
    p.hasMSMEDues !== undefined
  );
}

const PRIORITY_BADGE: Record<string,string> = {
  critical: "bg-red-100 text-red-700 border border-red-200",
  high:     "bg-orange-100 text-orange-700 border border-orange-200",
  medium:   "bg-yellow-100 text-yellow-700 border border-yellow-200",
  low:      "bg-gray-100 text-gray-500 border border-gray-200",
};

const FREQ_LABEL: Record<string,string> = {
  "One-time":"⚡ One-time","Monthly":"📅 Monthly","Quarterly":"📆 Quarterly",
  "Half-yearly":"📆 Half-yearly","Annual":"📆 Annual","Ongoing":"🔄 Ongoing",
  one_time:"⚡ One-time",monthly:"📅 Monthly",quarterly:"📆 Quarterly",
  half_yearly:"📆 Half-yearly",annually:"📆 Annual",
  event_based:"🔔 Event-based",as_applicable:"📌 As applicable",
};

const BIZ_LABEL: Record<string,string> = {
  proprietorship:"Sole Proprietorship",partnership:"Partnership Firm",
  llp:"LLP",opc:"OPC",pvt_ltd:"Private Limited",
  public_ltd:"Public Limited",section8:"Section 8 / NGO",
};

function isApplicable(rule: DBRule, profile: BusinessProfile): boolean {
  try {
    const node = JSON.parse(rule.conditionJson) as ConditionNode;
    return evaluateCondition(node, profile);
  } catch { return false; }
}

function getDocuments(rule: DBRule): string[] {
  try { return JSON.parse(rule.documentsJson) as string[]; }
  catch { return []; }
}

// ─── Document Checklist ───────────────────────────────────────────────────────
function DocumentChecklist({ docs }: { docs: string[] }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const toggle = useCallback((i: number) => {
    setChecked(prev => ({ ...prev, [i]: !prev[i] }));
  }, []);

  const doneCount = Object.values(checked).filter(Boolean).length;
  const pct = docs.length > 0 ? Math.round((doneCount / docs.length) * 100) : 0;

  if (docs.length === 0) return null;

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 border-b border-blue-100">
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">
            Required Documents Checklist
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-blue-600">
            {doneCount}/{docs.length}
          </span>
          <div className="w-16 h-1.5 bg-blue-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <ul className="divide-y divide-blue-100/60">
        {docs.map((doc, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => toggle(i)}
              className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-blue-50/80 transition-colors group"
            >
              {/* Checkbox */}
              <div className={`shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                checked[i]
                  ? "bg-blue-500 border-blue-500"
                  : "border-blue-300 group-hover:border-blue-400"
              }`}>
                {checked[i] && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className={`text-xs leading-relaxed transition-colors ${
                checked[i] ? "text-blue-400 line-through" : "text-gray-700"
              }`}>
                {doc}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* All done banner */}
      {doneCount === docs.length && docs.length > 0 && (
        <div className="px-4 py-2 bg-green-50 border-t border-green-100 text-xs text-green-700 font-semibold flex items-center gap-1.5">
          <span>✅</span> All documents ready!
        </div>
      )}
    </div>
  );
}

// ─── Compliance Card ──────────────────────────────────────────────────────────
function ComplianceCard({ rule, idx }: { rule: DBRule; idx: number }) {
  const [open, setOpen] = useState(false);
  const meta = CATEGORY_META[rule.category];
  const docs = getDocuments(rule);

  return (
    <div className={`border border-gray-200 rounded-xl overflow-hidden ${open ? "shadow-md" : ""}`}>
      {/* Header row */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 p-4 text-left bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="text-gray-300 text-xs font-mono mt-1 w-6 shrink-0 text-right">{idx + 1}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-gray-900 text-sm">{rule.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORITY_BADGE[rule.priority] || PRIORITY_BADGE.low}`}>
              {rule.priority.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {FREQ_LABEL[rule.frequency] || rule.frequency}
            </span>
            {docs.length > 0 && (
              <span className="text-xs text-blue-500 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
                📋 {docs.length} docs
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">{rule.authority}</p>
        </div>
        <span className={`text-gray-400 shrink-0 mt-1 text-xs transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▼</span>
      </button>

      {/* Expanded details */}
      {open && (
        <div className={`px-4 pb-5 pt-3 border-t border-gray-100 space-y-3 ${meta?.bg || "bg-gray-50"}`}>
          <p className="text-sm text-gray-700 leading-relaxed">{rule.description}</p>

          {/* Documents Checklist — top priority, show first */}
          {docs.length > 0 && <DocumentChecklist docs={docs} />}

          <div className="space-y-2.5">
            {rule.howToComply && (
              <div className="bg-white rounded-xl px-4 py-3 border border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">✅ How to Comply</p>
                <p className="text-sm text-gray-700 leading-relaxed">{rule.howToComply}</p>
              </div>
            )}
            {rule.dueDate && (
              <div className="bg-white rounded-xl px-4 py-3 border border-blue-100 flex gap-3">
                <span className="text-blue-500 text-lg shrink-0">📅</span>
                <div>
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Due Date</p>
                  <p className="text-sm text-gray-700 mt-0.5">{rule.dueDate}</p>
                </div>
              </div>
            )}
            {rule.penalty && (
              <div className="bg-white rounded-xl px-4 py-3 border border-red-100 flex gap-3">
                <span className="text-red-500 text-lg shrink-0">⚠️</span>
                <div>
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wide">Penalty / Consequence of Non-Compliance</p>
                  <p className="text-sm text-gray-700 mt-0.5">{rule.penalty}</p>
                </div>
              </div>
            )}
            {rule.registrationLink && (
              <a
                href={rule.registrationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 bg-white border border-blue-200 rounded-xl px-4 py-2.5 hover:bg-blue-50 transition-colors font-medium"
              >
                🔗 Official Portal / Registration Link ↗
              </a>
            )}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              🕒 Updated: {new Date(rule.updatedAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
            </span>
            <a href={`/compliance/${rule.ruleKey}`} target="_blank" rel="noopener noreferrer"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1">
              Full Details →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Results Content ──────────────────────────────────────────────────────────
function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(CATEGORY_ORDER));
  const [dbRules, setDbRules] = useState<DBRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);

  useEffect(() => {
    fetch("/api/rules")
      .then(r => r.json())
      .then(data => setDbRules(Array.isArray(data) ? data : []))
      .catch(() => setDbRules([]))
      .finally(() => setLoadingRules(false));
  }, []);

  const profile = useMemo<BusinessProfile | null>(() => {
    try {
      const data = searchParams.get("data");
      return data ? JSON.parse(decodeURIComponent(data)) as BusinessProfile : null;
    } catch { return null; }
  }, [searchParams]);

  const applicable = useMemo<DBRule[]>(() => {
    if (!profile || dbRules.length === 0) return [];
    return dbRules.filter(r => isApplicable(r, profile));
  }, [profile, dbRules]);

  const byCategory = useMemo(() => {
    const map: Record<string, DBRule[]> = {};
    const ord: Record<string,number> = { critical:0, high:1, medium:2, low:3 };
    for (const rule of applicable) {
      if (!map[rule.category]) map[rule.category] = [];
      map[rule.category].push(rule);
    }
    for (const cat of Object.keys(map)) {
      map[cat].sort((a,b) => (ord[a.priority]??3) - (ord[b.priority]??3));
    }
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
    applicable.reduce((sum, r) => sum + getDocuments(r).length, 0),
  [applicable]);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No data found. Please start a new check.</p>
          <button onClick={() => router.push("/check")} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold">
            Start Check →
          </button>
        </div>
      </div>
    );
  }

  if (loadingRules) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">⚙️</div>
          <p className="text-gray-600 font-semibold text-lg">Analyzing your compliance requirements…</p>
          <p className="text-gray-400 text-sm mt-2">Fetching latest rules from database</p>
        </div>
      </div>
    );
  }

  const filteredByCategory: Record<string,DBRule[]> = {};
  for (const cat of CATEGORY_ORDER) {
    const rules = (byCategory[cat] || []).filter(
      r => filterPriority === "all" || r.priority === filterPriority
    );
    if (rules.length > 0) filteredByCategory[cat] = rules;
  }

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Top bar */}
      <div className="bg-slate-900 text-white px-4 py-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-bold text-lg hover:text-blue-300 transition-colors">
            <span>⚖️</span> ComplianceCheck India
          </a>
          <div className="flex items-center gap-2">
            {!hasAdvancedData(profile) && (
              <button
                onClick={() => {
                  const data = searchParams.get("data");
                  router.push(`/check/advanced?data=${data}`);
                }}
                className="text-sm bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                🔍 Know More
              </button>
            )}
            <button
              onClick={() => {
                const data = searchParams.get("data");
                window.open(`/report?data=${data}`, "_blank");
              }}
              className="text-sm bg-green-500 hover:bg-green-400 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              ⬇ Download Report
            </button>
            <button onClick={() => router.push("/check")} className="text-sm text-blue-300 hover:text-white">
              ← New Check
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Business Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
          <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-3">Business Profile</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Structure",       value: BIZ_LABEL[profile.businessType] || profile.businessType },
              { label: "State",           value: profile.state || "—" },
              { label: "Annual Turnover", value: profile.turnoverLakhs >= 10000 ? `₹${(profile.turnoverLakhs/100).toFixed(0)} Crore+` : profile.turnoverLakhs >= 100 ? `₹${(profile.turnoverLakhs/100).toFixed(1)} Crore` : `₹${profile.turnoverLakhs} Lakh` },
              { label: "Employees",       value: profile.employeeCount === 0 ? "None" : `~${profile.employeeCount}` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl px-3 py-2.5">
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className="font-bold text-gray-900 text-sm truncate mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Know More / Advanced Banner ── */}
        {!hasAdvancedData(profile) ? (
          <div className="mb-6 rounded-2xl border-2 border-dashed border-indigo-300 bg-gradient-to-r from-indigo-50 to-violet-50 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🔍</span>
                <span className="font-bold text-indigo-800 text-sm">Unlock Advanced Compliance Analysis</span>
                <span className="text-xs bg-indigo-100 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full font-semibold">NEW</span>
              </div>
              <p className="text-xs text-indigo-700 leading-relaxed">
                You are viewing <strong>basic compliance results</strong>. Answer a few more questions to get a
                {" "}<strong>complete 360° analysis</strong> — covering CSR, Transfer Pricing, FEMA/FDI, SEBI LODR,
                DPDP Act, Crypto/VDA tax, RERA, FCRA, ECB reporting, foreign expansion and much more.
              </p>
            </div>
            <button
              onClick={() => {
                const data = searchParams.get("data");
                router.push(`/check/advanced?data=${data}`);
              }}
              className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
            >
              Know More →
            </button>
          </div>
        ) : (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-3 flex items-center gap-3">
            <span className="text-xl">✅</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-green-800">Advanced Analysis Included</p>
              <p className="text-xs text-green-700">
                This report includes advanced compliances — CSR, FEMA/FDI, Transfer Pricing, SEBI, DPDP, RERA, and more.
              </p>
            </div>
            <button
              onClick={() => {
                const data = searchParams.get("data");
                router.push(`/check/advanced?data=${data}`);
              }}
              className="shrink-0 text-xs bg-white border border-green-300 text-green-700 hover:bg-green-100 font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              Update Details
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <div className="bg-blue-600 text-white rounded-2xl p-4 text-center shadow-sm md:col-span-1">
            <div className="text-4xl font-bold">{counts.total}</div>
            <div className="text-blue-200 text-xs mt-1 font-medium">Total</div>
          </div>
          <div className="bg-white border border-red-200 rounded-2xl p-4 text-center shadow-sm">
            <div className="text-4xl font-bold text-red-600">{counts.critical}</div>
            <div className="text-red-400 text-xs mt-1 font-medium">Critical</div>
          </div>
          <div className="bg-white border border-orange-200 rounded-2xl p-4 text-center shadow-sm">
            <div className="text-4xl font-bold text-orange-600">{counts.high}</div>
            <div className="text-orange-400 text-xs mt-1 font-medium">High</div>
          </div>
          <div className="bg-white border border-yellow-200 rounded-2xl p-4 text-center shadow-sm">
            <div className="text-4xl font-bold text-yellow-600">{counts.medium + counts.low}</div>
            <div className="text-yellow-500 text-xs mt-1 font-medium">Med/Low</div>
          </div>
          <div className="bg-white border border-blue-200 rounded-2xl p-4 text-center shadow-sm">
            <div className="text-4xl font-bold text-blue-600">{totalDocs}</div>
            <div className="text-blue-400 text-xs mt-1 font-medium">Total Docs</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="text-sm text-gray-500 font-medium mr-1">Filter:</span>
          {[
            { id:"all", label:"All" },
            { id:"critical", label:"🔴 Critical" },
            { id:"high", label:"🟠 High" },
            { id:"medium", label:"🟡 Medium" },
            { id:"low", label:"⚪ Low" },
          ].map(f => (
            <button key={f.id} onClick={() => setFilterPriority(f.id)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all border ${
                filterPriority === f.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              }`}>
              {f.label}
            </button>
          ))}
          <button onClick={() => window.print()}
            className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors md:hidden">
            🖨️ Print
          </button>
        </div>

        {/* Compliance Categories */}
        {Object.keys(filteredByCategory).length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-400 font-medium">No compliances found for this filter</p>
          </div>
        ) : (
          <div className="space-y-5">
            {CATEGORY_ORDER.filter(c => filteredByCategory[c]).map(cat => {
              const meta = CATEGORY_META[cat];
              const rules = filteredByCategory[cat];
              const isExpanded = expandedCats.has(cat);
              const catDocs = rules.reduce((s,r) => s + getDocuments(r).length, 0);
              return (
                <div key={cat} className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                  <button type="button" onClick={() => toggleCat(cat)}
                    className={`w-full flex items-center gap-3 px-5 py-4 ${meta?.bg||"bg-gray-50"} border-b ${meta?.border||"border-gray-200"} transition-colors hover:opacity-90`}>
                    <span className="text-2xl">{meta?.icon||"📋"}</span>
                    <h3 className={`font-bold text-base flex-1 text-left ${meta?.color||"text-gray-700"}`}>{meta?.label||cat}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 border border-blue-200`}>
                        📋 {catDocs} docs
                      </span>
                      <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${meta?.bg||"bg-gray-100"} ${meta?.color||"text-gray-700"} border ${meta?.border||"border-gray-200"}`}>
                        {rules.length}
                      </span>
                    </div>
                    <span className={`text-xs ${meta?.color||"text-gray-500"} transition-transform ${isExpanded ? "rotate-180" : ""}`}>▼</span>
                  </button>
                  {isExpanded && (
                    <div className="p-3 space-y-2">
                      {rules.map((rule, i) => (
                        <ComplianceCard key={rule.id} rule={rule} idx={i} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <p className="text-sm font-bold text-amber-800 mb-1">⚠️ Disclaimer</p>
          <p className="text-sm text-amber-700 leading-relaxed">
            This tool is for educational and guidance purposes only. Compliance thresholds, rates, and
            due dates are subject to change. Always consult a qualified Chartered Accountant (CA) or
            Company Secretary (CS) before making compliance decisions.
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              const data = searchParams.get("data");
              window.open(`/report?data=${data}`, "_blank");
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-xl transition-colors shadow-sm flex items-center gap-2"
          >
            ⬇ Download Full Report + Document Checklist
          </button>
          <button onClick={() => router.push("/check")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl transition-colors shadow-sm">
            ← Run Another Check
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">⚙️</div>
          <p className="text-gray-600 font-semibold text-lg">Analyzing your compliance requirements…</p>
          <p className="text-gray-400 text-sm mt-2">Please wait a moment</p>
        </div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
