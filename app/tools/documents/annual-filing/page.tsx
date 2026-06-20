"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import CompanyExcelUpload from "@/components/CompanyExcelUpload";
import CompanySearch from "@/components/CompanySearch";
import type { CompanyData } from "@/lib/types/company";
import {
  generateAllAttachments,
  INITIAL_FILING_DATA,
  type AnnualFilingData,
  type CompanyType,
} from "@/lib/annual-filing/generators/index";
import type { AuditReportOptions } from "@/lib/annual-filing/generators/audit-report";
import type { AuditorDetails, BoardMeeting, DirectorRecord, ShareholderRecord } from "@/lib/annual-filing/types";
import { stateFromCIN } from "@/lib/annual-filing/cin-state";

interface SavedCA {
  id: string;
  firmName: string;
  frn: string;
  partnerName: string;
  membershipNo: string;
  place?: string | null;
}

// Convert any common date format → YYYY-MM-DD (required by <input type="date">)
function toDateInput(raw: string): string {
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;                // already YYYY-MM-DD
  // DD/MM/YYYY or D/M/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
    const [d, mo, y] = raw.split("/");
    return `${y}-${mo.padStart(2,"0")}-${d.padStart(2,"0")}`;
  }
  // DD-MM-YYYY or D-M-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(raw)) {
    const [d, mo, y] = raw.split("-");
    return `${y}-${mo.padStart(2,"0")}-${d.padStart(2,"0")}`;
  }
  // Try generic JS Date parse as fallback
  const p = new Date(raw);
  if (!isNaN(p.getTime())) return p.toISOString().split("T")[0];
  return raw;
}

// Min date for report: first day after FY end (e.g. FY 2024-25 → 2025-04-01)
function minReportDate(fy: string): string {
  const endYear = parseInt("20" + fy.split("-")[1]);
  return `${endYear}-04-01`;
}
function maxReportDate(fy: string): string {
  const endYear = parseInt("20" + fy.split("-")[1]);
  return `${endYear + 1}-03-31`;
}

// ── Financial row configs — MUST be outside render to avoid React remount ──
// Defining these as module-level constants prevents FinRow from being a new
// component type on every render (which causes input focus loss on keystroke).
const PL_ROWS = [
  { label: "Revenue from Operations", fKey: "revenueFromOperations",  prevKey: "prevRevenueFromOperations"  },
  { label: "Other Income",            fKey: "otherIncome",            prevKey: "prevOtherIncome"            },
  { label: "Total Income",            fKey: "totalIncome",            prevKey: "prevTotalIncome"            },
  { label: "Total Expenses",          fKey: "totalExpenses",          prevKey: "prevTotalExpenses"          },
  { label: "Profit Before Tax (PBT)", fKey: "profitBeforeTax",        prevKey: "prevProfitBeforeTax"        },
  { label: "Current Tax",             fKey: "currentTax",             prevKey: "prevCurrentTax"             },
  { label: "Deferred Tax",            fKey: "deferredTax",            prevKey: "prevDeferredTax"            },
  { label: "Profit After Tax (PAT)",  fKey: "profitAfterTax",         prevKey: "prevProfitAfterTax"         },
] as const;

const BS_ROWS = [
  { label: "Authorised Share Capital", fKey: "authorisedCapital",  prevKey: "prevAuthorisedCapital"  },
  { label: "Paid-up Share Capital",    fKey: "paidUpCapital",      prevKey: "prevPaidUpCapital"      },
  { label: "Reserves & Surplus",       fKey: "reservesAndSurplus", prevKey: "prevReservesAndSurplus" },
  { label: "Total Assets",             fKey: "totalAssets",        prevKey: "prevTotalAssets"        },
  { label: "Total Liabilities",        fKey: "totalLiabilities",   prevKey: "prevTotalLiabilities"   },
  { label: "Net Worth",                fKey: "netWorth",           prevKey: "prevNetWorth"           },
] as const;

// ── Company type detection from entityType ─────────────────────────────────
function detectCompanyType(entityType: string, smallCompany?: boolean): CompanyType {
  const e = (entityType || "").toLowerCase();
  if (e.includes("opc") || e.includes("one person")) return "opc";
  if (e.includes("section 8") || e.includes("sec 8") || e.includes("section8")) return "section8";
  if (e.includes("producer") || e.includes("fpc") || e.includes("farmer")) return "fpc";
  if (smallCompany) return "private_small";
  return "private_small";
}

// ── Steps config ───────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Company & FY"   },
  { id: 2, label: "Auditor"        },
  { id: 3, label: "Financials"     },
  { id: 4, label: "Board & Compliance" },
  { id: 5, label: "Directors"      },
  { id: 6, label: "Shareholders"   },
  { id: 7, label: "AOC-1 / AOC-2"  },
  { id: 8, label: "Generate All"   },
];

const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  opc:           "One Person Company (OPC)",
  private_small: "Private Limited — Small Company",
  section8:      "Section 8 Company",
  fpc:           "Farmer Producer Company (FPC)",
};

const FY_OPTIONS = ["2024-25"];

// ── Label + input helpers ──────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, type = "text", required, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean; hint?: string;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-slate-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-slate-500 mb-1">{hint}</p>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );
}

function Select({
  label, value, onChange, options, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; required?: boolean;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-slate-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Toggle({
  label, value, onChange, hint,
}: {
  label: string; value: boolean; onChange: (v: boolean) => void; hint?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors ${value ? "bg-emerald-500" : "bg-slate-300"}`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
      </button>
      <div>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}

function SectionCard({ title, color = "slate", children }: { title: string; color?: string; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    slate:   "border-slate-200  bg-slate-50",
    emerald: "border-emerald-200 bg-emerald-50",
    blue:    "border-blue-200   bg-blue-50",
    amber:   "border-amber-200  bg-amber-50",
  };
  return (
    <div className={`border rounded-xl p-5 mb-6 ${colors[color] || colors.slate}`}>
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">{title}</h3>
      {children}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AnnualFilingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-slate-500 text-sm">Loading…</div>
      </div>
    }>
      <AnnualFilingTool />
    </Suspense>
  );
}

function AnnualFilingTool() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<AnnualFilingData>({ ...INITIAL_FILING_DATA });
  const [auditOpts, setAuditOpts] = useState<AuditReportOptions>({
    opinionType: "unmodified",
    cashFlowIncluded: false,
    emphasisOfMatter: "There are no matters to be emphasized in the financial statements. Accordingly, no Emphasis of Matter paragraph has been reported.",
    qualificationDetails: "",
  });
  const [saving, setSaving]         = useState(false);
  const [loadMsg, setLoadMsg]       = useState("");
  const [saveId, setSaveId]         = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated]   = useState<Record<string, string>>({});
  const [savedCAs, setSavedCAs]     = useState<SavedCA[]>([]);
  const [savingCA, setSavingCA]     = useState(false);
  const [showCAManager, setShowCAManager] = useState(false);
  const [companyId, setCompanyId]   = useState<string | null>(null);
  const [loadingPersons, setLoadingPersons] = useState(false);

  // ── Load saved draft via ?load=<id> ──────────────────────────────────
  useEffect(() => {
    const id = searchParams.get("load");
    if (!id || !session?.user) return;
    setLoadMsg("Loading saved draft…");
    fetch(`/api/annual-filing?id=${id}`)
      .then(r => r.json())
      .then((json: { filing?: { formDataJson: string; id: string } }) => {
        if (json.filing?.formDataJson) {
          const parsed = JSON.parse(json.filing.formDataJson) as {
            data: AnnualFilingData;
            auditOpts: AuditReportOptions;
          };
          setData(parsed.data);
          setAuditOpts(parsed.auditOpts);
          setSaveId(json.filing.id);
        }
      })
      .catch(() => {})
      .finally(() => setLoadMsg(""));
  }, [searchParams, session]);

  // ── Load saved CAs for logged-in user ─────────────────────────────────
  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/auditors")
      .then(r => r.json())
      .then((j: { auditors?: SavedCA[] }) => setSavedCAs(j.auditors || []))
      .catch(() => {});
  }, [session]);

  // ── Auto-fill audit report date from board report date ─────────────────
  useEffect(() => {
    if (data.dateOfReport && !data.auditor.reportDate) {
      patchAud({ reportDate: data.dateOfReport });
    }
  }, [data.dateOfReport]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Patch helper ──────────────────────────────────────────────────────
  const patch = useCallback((partial: Partial<AnnualFilingData>) => {
    setData(prev => ({ ...prev, ...partial }));
  }, []);

  const patchAud = useCallback((partial: Partial<AnnualFilingData["auditor"]>) => {
    setData(prev => ({ ...prev, auditor: { ...prev.auditor, ...partial } }));
  }, []);

  const patchFin = useCallback((partial: Partial<AnnualFilingData["financials"]>) => {
    setData(prev => ({ ...prev, financials: { ...prev.financials, ...partial } }));
  }, []);

  // ── Company fill from Excel / Search ──────────────────────────────────
  function handleCompanyFill(co: CompanyData) {
    const companyType = detectCompanyType(co.entityType || "", co.smallCompany);
    const derivedState = stateFromCIN(co.cin || "");
    if (co.id) setCompanyId(co.id);
    patch({
      companyName:           co.companyName || "",
      cin:                   co.cin || "",
      regAddress:            co.regAddress || "",
      entityType:            co.entityType || "",
      companyType,
      rocName:               co.rocName || "",
      incorporationDate:     toDateInput(co.incorporationDate || ""),
      stateOfIncorporation:  derivedState || "",
      directors: (co.directors || []).map(d => ({
        din:               d.din || "",
        name:              d.name || "",
        designation:       d.designation || "Director",
        category:          d.category || "Non-Executive",
        dateOfAppointment: d.appointedAt || "",
        dateOfCessation:   d.ceasedAt || "",
        isActive:          d.isActive,
        changedDuringYear: false,
      })),
    });
    patchFin({
      authorisedCapital: co.authorisedCapital || "",
      paidUpCapital:     co.paidUpCapital     || "",
    });
  }

  // ── Load director KYC from Person Records ─────────────────────────────
  async function handleLoadPersons() {
    if (!companyId || !session?.user) return;
    setLoadingPersons(true);
    try {
      const res = await fetch(`/api/persons?companyId=${companyId}&type=director`);
      const json = await res.json() as { persons?: Array<{
        id: string | null; din?: string; name: string;
        fatherName?: string | null; dateOfBirth?: string | null;
        email?: string | null; nationality?: string | null;
        occupation?: string | null; presentAddress?: string | null;
        panNo?: string | null;
      }> };
      const persons = json.persons || [];
      if (!persons.length) return;
      // Merge KYC data into existing directors by DIN then by name
      const dirs = [...(data.directors || [])];
      for (const p of persons) {
        const idx = dirs.findIndex(d =>
          (p.din && d.din && p.din === d.din) ||
          d.name.trim().toLowerCase() === p.name.trim().toLowerCase()
        );
        if (idx !== -1) {
          dirs[idx] = {
            ...dirs[idx],
            fatherName:  p.fatherName  || dirs[idx].fatherName,
            dateOfBirth: p.dateOfBirth ? toDateInput(p.dateOfBirth) : dirs[idx].dateOfBirth,
            email:       p.email       || dirs[idx].email,
            nationality: p.nationality || dirs[idx].nationality,
            occupation:  p.occupation  || dirs[idx].occupation,
            address:     p.presentAddress || dirs[idx].address,
            pan:         p.panNo       || dirs[idx].pan,
            _personId:   p.id,
          };
        }
      }
      patch({ directors: dirs });
    } finally {
      setLoadingPersons(false);
    }
  }

  // ── Save director KYC back to csi_persons ─────────────────────────────
  async function saveDirectorKYC(d: DirectorRecord) {
    if (!companyId || !session?.user || !d.name.trim()) return;
    await fetch("/api/persons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id:              d._personId || undefined,
        companyId,
        name:            d.name,
        din:             d.din || undefined,
        fatherName:      d.fatherName  || undefined,
        dateOfBirth:     d.dateOfBirth || undefined,
        email:           d.email       || undefined,
        nationality:     d.nationality || undefined,
        occupation:      d.occupation  || undefined,
        presentAddress:  d.address     || undefined,
        panNo:           d.pan         || undefined,
        isDirector:      true,
      }),
    });
  }

  // ── DB Save ───────────────────────────────────────────────────────────
  async function handleSave() {
    if (!session?.user) return;
    setSaving(true);
    try {
      const res = await fetch("/api/annual-filing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id:           saveId || undefined,
          companyName:  data.companyName,
          cin:          data.cin,
          financialYear: data.financialYear,
          formDataJson: JSON.stringify({ data, auditOpts }),
        }),
      });
      const json = await res.json() as { id?: string };
      if (json.id) setSaveId(json.id);
    } finally {
      setSaving(false);
    }
  }

  // ── Save a new CA to list ─────────────────────────────────────────────
  async function handleSaveCA() {
    if (!session?.user) return;
    const a = data.auditor;
    if (!a.firmName || !a.frn || !a.partnerName || !a.membershipNo) return;
    setSavingCA(true);
    try {
      const res = await fetch("/api/auditors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firmName: a.firmName, frn: a.frn, partnerName: a.partnerName, membershipNo: a.membershipNo, place: a.place }),
      });
      const json = await res.json() as { id?: string };
      if (json.id) {
        setSavedCAs(prev => [{ id: json.id!, firmName: a.firmName, frn: a.frn, partnerName: a.partnerName, membershipNo: a.membershipNo, place: a.place }, ...prev]);
      }
    } finally {
      setSavingCA(false);
    }
  }

  // ── Delete a saved CA ─────────────────────────────────────────────────
  async function handleDeleteCA(id: string) {
    await fetch(`/api/auditors/${id}`, { method: "DELETE" });
    setSavedCAs(prev => prev.filter(c => c.id !== id));
  }

  // ── Generate All ──────────────────────────────────────────────────────
  function handleGenerate() {
    setGenerating(true);
    try {
      const cashFlowIncluded = data.companyType === "section8" || data.companyType === "fpc";
      const opts = { ...auditOpts, cashFlowIncluded };
      const docs = generateAllAttachments(data, opts);
      setGenerated(docs as unknown as Record<string, string>);
    } finally {
      setGenerating(false);
    }
  }

  function openDoc(html: string) {
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
  }

  function downloadDoc(html: string) {
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const w = window.open(url, "_blank");
    if (w) { w.addEventListener("load", () => { w.focus(); w.print(); }); }
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
  }

  // ── Step navigation ───────────────────────────────────────────────────
  const canNext = step < STEPS.length;
  const canPrev = step > 1;

  // ── Render helpers ────────────────────────────────────────────────────
  function renderStepIndicator() {
    return (
      <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-shrink-0">
            <button
              onClick={() => setStep(s.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                step === s.id
                  ? "bg-emerald-600 text-white shadow-md"
                  : step > s.id
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                step === s.id ? "bg-white text-emerald-600" :
                step > s.id  ? "bg-emerald-500 text-white" : "bg-slate-300 text-slate-600"
              }`}>{step > s.id ? "✓" : s.id}</span>
              <span className="hidden sm:block">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-4 mx-0.5 flex-shrink-0 ${step > s.id ? "bg-emerald-400" : "bg-slate-200"}`} />
            )}
          </div>
        ))}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STEP 1 — Company & Financial Year
  // ══════════════════════════════════════════════════════════════════════
  function renderStep1() {
    const minDate = minReportDate(data.financialYear);
    const maxDate = maxReportDate(data.financialYear);
    const dateInvalid = data.dateOfReport && data.dateOfReport < minDate;
    const fyEndLabel = `31 March ${minDate.split("-")[0]}`; // e.g. "31 March 2025"

    return (
      <>
        <SectionCard title="Import Company Data from MCA Excel" color="blue">
          <p className="text-xs text-slate-500 mb-3">Import from MCA Excel <strong>or</strong> type company name below to search from your saved companies.</p>
          <CompanyExcelUpload onFill={handleCompanyFill} accent="blue" note="Import company master data" />
        </SectionCard>

        <SectionCard title="Company Details" color="emerald">
          {/* Company Name — uses CompanySearch for suggestions from My Companies */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Company Name <span className="text-red-500 ml-1">*</span>
            </label>
            <CompanySearch
              value={data.companyName}
              onChange={v => patch({ companyName: v })}
              onSelect={handleCompanyFill}
              placeholder="e.g. ABC Enterprises Private Limited"
              accent="blue"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Field label="CIN" value={data.cin} onChange={v => {
              patch({ cin: v, stateOfIncorporation: stateFromCIN(v) || data.stateOfIncorporation });
            }} required placeholder="U12345MH2020PTC123456" hint="State auto-derives from CIN" />
            <Field label="PAN" value={data.pan} onChange={v => patch({ pan: v })} placeholder="AABCA1234A" />
            <Field label="ROC Name" value={data.rocName} onChange={v => patch({ rocName: v })} placeholder="Registrar of Companies, Mumbai" />
            {/* Incorporation Date — auto-filled from Excel / DB */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Incorporation Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={data.incorporationDate}
                  onChange={e => patch({ incorporationDate: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {data.incorporationDate && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-600 font-semibold">✓ auto</span>
                )}
              </div>
            </div>
            {/* State of Incorporation — auto-derived from CIN */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1">State of Incorporation</label>
              <div className="relative">
                <input
                  type="text"
                  value={data.stateOfIncorporation}
                  onChange={e => patch({ stateOfIncorporation: e.target.value })}
                  placeholder="Auto-derived from CIN"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {data.stateOfIncorporation && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-600 font-semibold">✓ auto</span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Automatically derived from CIN. Edit if needed.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-x-6">
            <Field label="Registered Office Address" value={data.regAddress} onChange={v => patch({ regAddress: v })} placeholder="Full registered address" />
          </div>
        </SectionCard>

        <SectionCard title="Financial Year & Company Classification" color="amber">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Select
              label="Financial Year" value={data.financialYear}
              onChange={v => patch({ financialYear: v as "2024-25" })}
              options={FY_OPTIONS.map(f => ({ value: f, label: f }))}
              required
            />
            <Select
              label="Company Type" value={data.companyType}
              onChange={v => patch({ companyType: v as CompanyType })}
              options={Object.entries(COMPANY_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
              required
            />
          </div>

          <div className="mt-3 p-3 rounded-lg border border-amber-300 bg-amber-50">
            <p className="text-xs text-amber-800 font-semibold mb-1">Auto-routing based on company type:</p>
            {data.companyType === "opc" && <p className="text-xs text-amber-700">MGT-7A • Abridged Board Report (Rule 8A) • Cash Flow Exempt • CARO Exempt</p>}
            {data.companyType === "private_small" && <p className="text-xs text-amber-700">MGT-7A • Abridged Board Report (Rule 8A) • Cash Flow Exempt • CARO Exempt</p>}
            {data.companyType === "section8" && <p className="text-xs text-amber-700">MGT-7 • Full Board Report (Rule 8) • Cash Flow REQUIRED • CARO Exempt</p>}
            {data.companyType === "fpc" && <p className="text-xs text-amber-700">MGT-7 • Full Board Report (Rule 8) • Cash Flow REQUIRED • CARO conditionally exempt</p>}
          </div>
        </SectionCard>

        <SectionCard title="Business Details" color="slate">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Field label="Principal Business Activity" value={data.principalActivity} onChange={v => patch({ principalActivity: v })} placeholder="e.g., Software Services, Trading in Goods" />
            <Field label="Place of Signing (for Board Report & Auditor)" value={data.placeOfSigning} onChange={v => patch({ placeOfSigning: v })} placeholder="Mumbai" required />

            {/* Date of Report — with FY-based validation */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Date of Board Report / Auditor Report <span className="text-red-500 ml-1">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-1">
                Must be <strong>after {fyEndLabel}</strong> (i.e., after financial year ends)
              </p>
              <input
                type="date"
                value={data.dateOfReport}
                onChange={e => patch({ dateOfReport: e.target.value })}
                min={minDate}
                max={maxDate}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  dateInvalid
                    ? "border-red-400 focus:ring-red-400 bg-red-50"
                    : "border-slate-300 focus:ring-emerald-500"
                }`}
              />
              {dateInvalid && (
                <p className="text-xs text-red-600 mt-1 font-semibold">
                  ⚠ Report date cannot be before {fyEndLabel}. Board/Auditor report must be signed after FY ends.
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">State of Affairs / Business Operations <span className="text-slate-400 font-normal">(for Board Report)</span></label>
            <textarea
              value={data.stateOfAffairs}
              onChange={e => patch({ stateOfAffairs: e.target.value })}
              rows={3}
              placeholder="Describe company's business operations and state of affairs for FY 2024-25..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </SectionCard>
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STEP 2 — Auditor Details
  // ══════════════════════════════════════════════════════════════════════
  function renderStep2() {
    const isProprietorship = data.auditor.firmType === "proprietorship";
    const auditorFilled = data.auditor.firmName &&
      (isProprietorship || data.auditor.frn) &&
      data.auditor.partnerName && data.auditor.membershipNo;
    const alreadySaved = savedCAs.some(c =>
      c.frn === data.auditor.frn && c.membershipNo === data.auditor.membershipNo
    );

    return (
      <>
        {/* ── Saved CA Selection ── */}
        {session?.user && (
          <SectionCard title="Select from Saved CAs" color="emerald">
            {savedCAs.length === 0 ? (
              <p className="text-sm text-slate-500">No CAs saved yet. Fill details below and click <strong>Save CA</strong> to add to your list.</p>
            ) : (
              <>
                <p className="text-xs text-slate-500 mb-3">Select a CA to auto-fill all details. You can edit after selecting.</p>
                <div className="grid grid-cols-1 gap-2">
                  {savedCAs.map(ca => (
                    <div key={ca.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 transition-all">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{ca.firmName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">FRN: {ca.frn} • {ca.partnerName} (M.No. {ca.membershipNo}){ca.place ? ` • ${ca.place}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        <button
                          onClick={() => patchAud({ firmName: ca.firmName, frn: ca.frn, partnerName: ca.partnerName, membershipNo: ca.membershipNo, place: ca.place || "" })}
                          className="text-xs font-bold text-emerald-700 border border-emerald-300 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition"
                        >
                          Select →
                        </button>
                        <button
                          onClick={() => { if (confirm(`Remove "${ca.firmName}" from saved CAs?`)) handleDeleteCA(ca.id); }}
                          className="text-xs text-red-400 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition"
                          title="Remove"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </SectionCard>
        )}

        <SectionCard title="Statutory Auditor Details" color="blue">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Select
              label="Auditor Type"
              value={data.auditor.firmType}
              onChange={v => patchAud({ firmType: v as AuditorDetails["firmType"] })}
              options={[
                { value: "firm",           label: "Firm (CA Firm)" },
                { value: "proprietorship", label: "Proprietorship" },
                { value: "partnership",    label: "Partnership Firm" },
              ]}
            />
            <Field label="Firm / Proprietor Name" value={data.auditor.firmName} onChange={v => patchAud({ firmName: v })} required placeholder="ABC & Co." hint="Without 'M/s' prefix — it is added automatically in documents" />
            <Field
              label={`Firm Registration Number (FRN)${isProprietorship ? " — Optional for Proprietorship" : ""}`}
              value={data.auditor.frn}
              onChange={v => patchAud({ frn: v })}
              required={!isProprietorship}
              placeholder="123456W"
              hint={isProprietorship ? "FRN is not mandatory for proprietorship auditors" : undefined}
            />
            <Field label="Partner / Proprietor Name" value={data.auditor.partnerName} onChange={v => patchAud({ partnerName: v })} required placeholder="CA Ramesh Kumar" />
            <Field label="ICAI Membership Number" value={data.auditor.membershipNo} onChange={v => patchAud({ membershipNo: v })} required placeholder="123456" />
            <Field label="UDIN" value={data.auditor.udin} onChange={v => patchAud({ udin: v })} placeholder="24123456ABCDEF1234" hint="Generate on ICAI UDIN portal after signing" />
            <Field label="Place of Signing" value={data.auditor.place} onChange={v => patchAud({ place: v })} placeholder="Mumbai" />
            <Field label="Date of Audit Report" value={data.auditor.reportDate} onChange={v => patchAud({ reportDate: v })} type="date" required
              hint={`Must be after ${minReportDate(data.financialYear).split("-").reverse().join("/")}`}
            />
          </div>

          {/* Save CA to list */}
          {session?.user && (
            <div className="mt-4 pt-4 border-t border-blue-200 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                {alreadySaved
                  ? <span className="text-emerald-600 font-semibold">✓ This CA is already in your saved list</span>
                  : <span>Save these CA details for future use across all companies</span>
                }
              </div>
              {!alreadySaved && (
                <button
                  onClick={handleSaveCA}
                  disabled={savingCA || !auditorFilled}
                  className="text-xs font-bold text-blue-700 border border-blue-300 px-4 py-2 rounded-lg hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  {savingCA ? "Saving…" : "Save CA to My List"}
                </button>
              )}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Audit Opinion" color="amber">
          <Select
            label="Type of Opinion"
            value={auditOpts.opinionType}
            onChange={v => setAuditOpts(o => ({ ...o, opinionType: v as AuditReportOptions["opinionType"] }))}
            options={[
              { value: "unmodified", label: "Unmodified (Clean) — SA 700" },
              { value: "qualified",  label: "Qualified Opinion — SA 705" },
              { value: "adverse",    label: "Adverse Opinion — SA 705" },
              { value: "disclaimer", label: "Disclaimer of Opinion — SA 705" },
            ]}
          />
          {auditOpts.opinionType !== "unmodified" && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Basis for {auditOpts.opinionType === "qualified" ? "Qualified" : auditOpts.opinionType === "adverse" ? "Adverse" : "Disclaimer"} Opinion
              </label>
              <textarea
                value={auditOpts.qualificationDetails || ""}
                onChange={e => setAuditOpts(o => ({ ...o, qualificationDetails: e.target.value }))}
                rows={4}
                placeholder="Describe the basis for modification..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}
          <div className="mt-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Emphasis of Matter (SA 706) — Optional
            </label>
            <textarea
              value={auditOpts.emphasisOfMatter || ""}
              onChange={e => setAuditOpts(o => ({ ...o, emphasisOfMatter: e.target.value }))}
              rows={3}
              placeholder="If any matter needs to be emphasised (e.g. going concern uncertainty, pending litigation)..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="mt-3 p-3 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
            <strong>Auto-applied:</strong> CARO 2020 — NOT APPLICABLE (exempt for {COMPANY_TYPE_LABELS[data.companyType]}) •
            ICFR Auditor Report — NOT APPLICABLE (exempt) •
            Key Audit Matters — NOT APPLICABLE (unlisted company)
          </div>
        </SectionCard>
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STEP 3 — Financial Figures
  // ══════════════════════════════════════════════════════════════════════
  function renderStep3() {
    const fin = data.financials;
    const fy  = data.financialYear;
    const fyStartYr = parseInt(fy.split("-")[0]);
    const prevFY = `${fyStartYr - 1}-${String(fyStartYr).slice(2)}`;

    return (
      <>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
          Enter all amounts in <strong>absolute Rupees (₹)</strong> — no rounding, no lakhs/crores. MCA V3 requirement.
        </div>

        <SectionCard title={`Profit & Loss — FY ${fy} vs FY ${prevFY}`} color="emerald">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-xs text-slate-500 pb-2 pr-3" style={{ width: "45%" }}>Particulars</th>
                <th className="text-right text-xs text-slate-700 pb-2 pr-2" style={{ width: "27.5%" }}>FY {fy} (₹)</th>
                <th className="text-right text-xs text-slate-500 pb-2" style={{ width: "27.5%" }}>FY {prevFY} (₹)</th>
              </tr>
            </thead>
            <tbody>
              {PL_ROWS.map(row => (
                <tr key={row.fKey}>
                  <td className="py-2 pr-3 text-sm text-slate-700 font-medium">{row.label}</td>
                  <td className="py-2 pr-2">
                    <input
                      type="text" value={fin[row.fKey]}
                      onChange={e => patchFin({ [row.fKey]: e.target.value })}
                      placeholder="0"
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="text" value={fin[row.prevKey]}
                      onChange={e => patchFin({ [row.prevKey]: e.target.value })}
                      placeholder="0"
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard title="Balance Sheet Items" color="blue">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-xs text-slate-500 pb-2 pr-3" style={{ width: "45%" }}>Particulars</th>
                <th className="text-right text-xs text-slate-700 pb-2 pr-2" style={{ width: "27.5%" }}>31 Mar {fy.split("-")[0].slice(2) === "24" ? "2025" : fy.split("-")[1]?.length === 2 ? `20${fy.split("-")[1]}` : "2025"} (₹)</th>
                <th className="text-right text-xs text-slate-500 pb-2" style={{ width: "27.5%" }}>31 Mar {fy.split("-")[0]} (₹)</th>
              </tr>
            </thead>
            <tbody>
              {BS_ROWS.map(row => (
                <tr key={row.fKey}>
                  <td className="py-2 pr-3 text-sm text-slate-700 font-medium">{row.label}</td>
                  <td className="py-2 pr-2">
                    <input
                      type="text" value={fin[row.fKey]}
                      onChange={e => patchFin({ [row.fKey]: e.target.value })}
                      placeholder="0"
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="text" value={fin[row.prevKey]}
                      onChange={e => patchFin({ [row.prevKey]: e.target.value })}
                      placeholder="0"
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard title="Capital Changes (if any)" color="slate">
          <Field
            label="Capital Changes During Year"
            value={data.capitalChanges || ""}
            onChange={v => patch({ capitalChanges: v })}
            placeholder="e.g., Authorised capital increased from ₹10,00,000 to ₹50,00,000 during the year. OR: No change in capital during the year."
            hint="Leave blank if no change"
          />
        </SectionCard>
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STEP 4 — Board & Compliance
  // ══════════════════════════════════════════════════════════════════════
  function renderStep4() {
    function addMeeting() {
      const meetings: BoardMeeting[] = [...(data.boardMeetings || []), {
        serialNo: (data.boardMeetings?.length || 0) + 1,
        date: "",
        directorsPresent: [],
      }];
      patch({ boardMeetings: meetings });
    }
    function removeMeeting(idx: number) {
      const meetings = (data.boardMeetings || []).filter((_, i) => i !== idx)
        .map((m, i) => ({ ...m, serialNo: i + 1 }));
      patch({ boardMeetings: meetings });
    }
    function updateMeetingDate(idx: number, date: string) {
      const meetings = [...(data.boardMeetings || [])];
      meetings[idx] = { ...meetings[idx], date };
      patch({ boardMeetings: meetings });
    }
    function updateDirectorsPresent(idx: number, val: string) {
      const meetings = [...(data.boardMeetings || [])];
      meetings[idx] = { ...meetings[idx], directorsPresent: val.split(",").map(s => s.trim()).filter(Boolean) };
      patch({ boardMeetings: meetings });
    }

    return (
      <>
        <SectionCard title="Board Meetings Held During FY 2024-25" color="emerald">
          <p className="text-xs text-slate-500 mb-3">Add all Board Meetings. Gap between 2 consecutive meetings must not exceed 120 days (Sec. 173).</p>
          {(data.boardMeetings || []).map((m, i) => (
            <div key={i} className="flex gap-3 items-start mb-3 p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-500 mt-2 w-5 flex-shrink-0">{i + 1}.</span>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Meeting Date</label>
                  <input type="date" value={m.date} onChange={e => updateMeetingDate(i, e.target.value)}
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Directors Present (comma-separated names)</label>
                  <input type="text" value={m.directorsPresent.join(", ")}
                    onChange={e => updateDirectorsPresent(i, e.target.value)}
                    placeholder="Rajesh Kumar, Priya Sharma"
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                </div>
              </div>
              <button onClick={() => removeMeeting(i)} className="text-red-400 hover:text-red-600 mt-2 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          <button onClick={addMeeting} className="text-sm text-emerald-700 font-semibold flex items-center gap-1 hover:text-emerald-900">
            <span className="text-lg leading-none">+</span> Add Board Meeting
          </button>
        </SectionCard>

        <SectionCard title="Compliance Flags" color="amber">
          <Toggle label="Company has Subsidiaries / Associates / JVs" value={data.hasSubsidiaries} onChange={v => patch({ hasSubsidiaries: v })} hint="If Yes → AOC-1 will be generated" />
          <Toggle label="Related Party Transactions (RPT) — not at arm's length or material" value={data.hasRPT} onChange={v => patch({ hasRPT: v })} hint="If Yes → AOC-2 will be generated" />
          <Toggle label="Accepted Deposits from Public (Sec. 73-76)" value={data.hasDeposits} onChange={v => patch({ hasDeposits: v })} />
          <Toggle label="Loans/Guarantees/Investments under Sec. 186" value={data.hasLoansGiven} onChange={v => patch({ hasLoansGiven: v })} />
          <Toggle label="Fraud reported by Auditor under Sec. 143(12)" value={data.fraudReported} onChange={v => patch({ fraudReported: v })} />
          {data.fraudReported && (
            <Field label="Fraud Details" value={data.fraudDetails || ""} onChange={v => patch({ fraudDetails: v })} placeholder="Nature and amount of fraud..." />
          )}
          <Toggle label="Audit Report has Qualification / Adverse Remark" value={data.auditQualification} onChange={v => patch({ auditQualification: v })} />
          {data.auditQualification && (
            <Field label="Board's Explanation for Qualification" value={data.auditQualificationExplanation || ""} onChange={v => patch({ auditQualificationExplanation: v })} placeholder="Board's response to auditor's qualification..." />
          )}
          <Toggle label="Material Changes After Financial Year End" value={data.materialChangesAfterFY} onChange={v => patch({ materialChangesAfterFY: v })} />
          {data.materialChangesAfterFY && (
            <Field label="Material Changes Details" value={data.materialChangesDetails || ""} onChange={v => patch({ materialChangesDetails: v })} placeholder="Details of material changes after 31 March 2025..." />
          )}
          <Toggle label="Significant Orders by Regulators / Courts / Tribunals" value={data.significantOrders} onChange={v => patch({ significantOrders: v })} />
          {data.significantOrders && (
            <Field label="Order Details" value={data.significantOrdersDetails || ""} onChange={v => patch({ significantOrdersDetails: v })} placeholder="Details of significant orders..." />
          )}
        </SectionCard>

        <SectionCard title="Annual Return Web Link" color="slate">
          <Field
            label="Website link where Annual Return (MGT-7/7A) is placed (optional)"
            value={data.annualReturnWebLink || ""}
            onChange={v => patch({ annualReturnWebLink: v })}
            placeholder="https://www.yourcompany.com/annual-return-2025"
            hint="As required under Sec. 92(3). Leave blank if company does not maintain a website."
          />
        </SectionCard>

        {(data.companyType === "section8" || data.companyType === "fpc") && (
          <SectionCard title="Rule 8 — Additional Disclosures" color="blue">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Conservation of Energy</label>
              <textarea value={data.energyConservationDetails || ""} onChange={e => patch({ energyConservationDetails: e.target.value })}
                rows={2} placeholder="Steps taken for energy conservation..." className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-3" />
              <label className="block text-sm font-semibold text-slate-700 mb-1">Technology Absorption</label>
              <textarea value={data.technologyAbsorptionDetails || ""} onChange={e => patch({ technologyAbsorptionDetails: e.target.value })}
                rows={2} placeholder="Technology absorption details..." className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-3" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Foreign Exchange Earnings (₹)" value={data.foreignExchangeEarnings || ""} onChange={v => patch({ foreignExchangeEarnings: v })} placeholder="0" />
              <Field label="Foreign Exchange Outgo (₹)" value={data.foreignExchangeOutgo || ""} onChange={v => patch({ foreignExchangeOutgo: v })} placeholder="0" />
            </div>
            <Toggle label="CSR Applicable (Sec. 135)" value={data.csrApplicable || false} onChange={v => patch({ csrApplicable: v })} hint="Net worth ≥ ₹500 cr OR turnover ≥ ₹1000 cr OR net profit ≥ ₹5 cr" />
            {data.csrApplicable && (
              <Field label="CSR Details" value={data.csrDetails || ""} onChange={v => patch({ csrDetails: v })} placeholder="CSR committee, activities, amount spent..." />
            )}
          </SectionCard>
        )}
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STEP 5 — Directors
  // ══════════════════════════════════════════════════════════════════════
  function renderStep5() {
    function addDirector() {
      const d: DirectorRecord = {
        din: "", name: "", designation: "Director", category: "Non-Executive",
        dateOfAppointment: "", isActive: true, changedDuringYear: false,
      };
      patch({ directors: [...(data.directors || []), d] });
    }
    function updateDir(idx: number, partial: Partial<DirectorRecord>) {
      const dirs = [...(data.directors || [])];
      dirs[idx] = { ...dirs[idx], ...partial };
      patch({ directors: dirs });
    }
    function removeDir(idx: number) {
      patch({ directors: data.directors.filter((_, i) => i !== idx) });
    }

    const inp = "border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full";

    return (
      <>
        <SectionCard title="Directors as on 31st March 2025" color="emerald">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500">Directors are pre-filled from company data. Add KYC details for the full Director List document.</p>
            {companyId && (
              <button
                onClick={handleLoadPersons}
                disabled={loadingPersons}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex-shrink-0 ml-3"
              >
                {loadingPersons ? "Loading…" : "Load from Person Records"}
              </button>
            )}
          </div>
          {(data.directors || []).map((d, i) => (
            <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl mb-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500">
                  Director {i + 1}{d._personId && <span className="ml-2 text-emerald-600">● KYC linked</span>}
                </span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 text-xs text-slate-600">
                    <input type="checkbox" checked={d.isActive} onChange={e => updateDir(i, { isActive: e.target.checked })} className="rounded" />
                    Active
                  </label>
                  <label className="flex items-center gap-1 text-xs text-slate-600">
                    <input type="checkbox" checked={d.changedDuringYear} onChange={e => updateDir(i, { changedDuringYear: e.target.checked })} className="rounded" />
                    Changed this year
                  </label>
                  <button onClick={() => removeDir(i)} className="text-red-400 hover:text-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              {/* Row 1: Basic fields */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-0.5">Full Name *</label>
                  <input type="text" value={d.name} onChange={e => updateDir(i, { name: e.target.value })} placeholder="Full Name" className={inp} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-0.5">DIN</label>
                  <input type="text" value={d.din} onChange={e => updateDir(i, { din: e.target.value })} placeholder="DIN" className={inp} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-0.5">Designation</label>
                  <select value={d.designation} onChange={e => updateDir(i, { designation: e.target.value })} className={inp + " bg-white"}>
                    <option>Managing Director</option>
                    <option>Whole Time Director</option>
                    <option>Director</option>
                    <option>Independent Director</option>
                    <option>Nominee Director</option>
                    <option>Chairman</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-0.5">Category</label>
                  <select value={d.category} onChange={e => updateDir(i, { category: e.target.value })} className={inp + " bg-white"}>
                    <option>Executive</option>
                    <option>Non-Executive</option>
                    <option>Independent</option>
                    <option>Nominee</option>
                  </select>
                </div>
              </div>

              {/* Row 2: KYC fields */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-0.5">Father&apos;s Name</label>
                  <input type="text" value={d.fatherName || ""} onChange={e => updateDir(i, { fatherName: e.target.value })} placeholder="Father's Full Name" className={inp}
                    onBlur={() => companyId && saveDirectorKYC({ ...d, fatherName: d.fatherName })} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-0.5">Date of Birth</label>
                  <input type="date" value={d.dateOfBirth || ""} onChange={e => updateDir(i, { dateOfBirth: e.target.value })} className={inp}
                    onBlur={() => companyId && saveDirectorKYC(d)} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-0.5">Nationality</label>
                  <input type="text" value={d.nationality || ""} onChange={e => updateDir(i, { nationality: e.target.value })} placeholder="e.g. Indian" className={inp}
                    onBlur={() => companyId && saveDirectorKYC(d)} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-0.5">Occupation</label>
                  <input type="text" value={d.occupation || ""} onChange={e => updateDir(i, { occupation: e.target.value })} placeholder="e.g. Business" className={inp}
                    onBlur={() => companyId && saveDirectorKYC(d)} />
                </div>
              </div>

              {/* Row 3: Contact + Shares */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-0.5">Email-Id</label>
                  <input type="email" value={d.email || ""} onChange={e => updateDir(i, { email: e.target.value })} placeholder="email@example.com" className={inp}
                    onBlur={() => companyId && saveDirectorKYC(d)} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-0.5">No. of Equity Shares Held</label>
                  <input type="number" min="0" value={d.sharesHeld ?? ""} onChange={e => updateDir(i, { sharesHeld: e.target.value ? parseInt(e.target.value) : undefined })} placeholder="0" className={inp} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-0.5">Date of Appointment</label>
                  <input type="date" value={d.dateOfAppointment} onChange={e => updateDir(i, { dateOfAppointment: e.target.value })} className={inp} />
                </div>
                {(d.changedDuringYear && !d.isActive) ? (
                  <div>
                    <label className="text-xs text-slate-400 block mb-0.5">Date of Cessation</label>
                    <input type="date" value={d.dateOfCessation || ""} onChange={e => updateDir(i, { dateOfCessation: e.target.value })} className={inp} />
                  </div>
                ) : (
                  d.changedDuringYear ? (
                    <div>
                      <label className="text-xs text-slate-400 block mb-0.5">Change Type</label>
                      <select value={d.changeType || "appointed"} onChange={e => updateDir(i, { changeType: e.target.value as "appointed" | "resigned" | "ceased" })} className={inp + " bg-white"}>
                        <option value="appointed">Appointed</option>
                        <option value="resigned">Resigned</option>
                        <option value="ceased">Ceased</option>
                      </select>
                    </div>
                  ) : null
                )}
              </div>

              {/* Row 4: Address (full width) */}
              <div>
                <label className="text-xs text-slate-400 block mb-0.5">Residential Address</label>
                <input type="text" value={d.address || ""} onChange={e => updateDir(i, { address: e.target.value })} placeholder="Full residential address" className={inp}
                  onBlur={() => companyId && saveDirectorKYC(d)} />
              </div>
            </div>
          ))}
          <button onClick={addDirector} className="text-sm text-emerald-700 font-semibold flex items-center gap-1 hover:text-emerald-900">
            <span className="text-lg leading-none">+</span> Add Director
          </button>
        </SectionCard>

        <SectionCard title="Signatory Directors (for Board Report signature)" color="blue">
          <p className="text-xs text-slate-500 mb-3">Select the directors who will sign the Board Report and other documents.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-slate-600 mb-2">Signatory 1 (Required)</p>
              <Field label="Name" value={data.signatoryDirectors.director1.name} onChange={v => patch({ signatoryDirectors: { ...data.signatoryDirectors, director1: { ...data.signatoryDirectors.director1, name: v } } })} />
              <Field label="DIN" value={data.signatoryDirectors.director1.din} onChange={v => patch({ signatoryDirectors: { ...data.signatoryDirectors, director1: { ...data.signatoryDirectors.director1, din: v } } })} />
              <Field label="Designation" value={data.signatoryDirectors.director1.designation} onChange={v => patch({ signatoryDirectors: { ...data.signatoryDirectors, director1: { ...data.signatoryDirectors.director1, designation: v } } })} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-600 mb-2">Signatory 2 (Optional — for Private/Section 8)</p>
              <Field label="Name" value={data.signatoryDirectors.director2?.name || ""} onChange={v => patch({ signatoryDirectors: { ...data.signatoryDirectors, director2: { name: v, din: data.signatoryDirectors.director2?.din || "", designation: data.signatoryDirectors.director2?.designation || "Director" } } })} />
              <Field label="DIN" value={data.signatoryDirectors.director2?.din || ""} onChange={v => patch({ signatoryDirectors: { ...data.signatoryDirectors, director2: { name: data.signatoryDirectors.director2?.name || "", din: v, designation: data.signatoryDirectors.director2?.designation || "Director" } } })} />
              <Field label="Designation" value={data.signatoryDirectors.director2?.designation || ""} onChange={v => patch({ signatoryDirectors: { ...data.signatoryDirectors, director2: { name: data.signatoryDirectors.director2?.name || "", din: data.signatoryDirectors.director2?.din || "", designation: v } } })} />
            </div>
          </div>
        </SectionCard>
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STEP 6 — Shareholders
  // ══════════════════════════════════════════════════════════════════════
  function renderStep6() {
    function addShareholder() {
      const s: ShareholderRecord = {
        folioNo: `SH${String((data.shareholders?.length || 0) + 1).padStart(4, "0")}`,
        name: "", type: "resident_individual", sharesHeld: 0, percentHolding: "0.00",
      };
      patch({ shareholders: [...(data.shareholders || []), s] });
    }
    function updateSh(idx: number, partial: Partial<ShareholderRecord>) {
      const shs = [...(data.shareholders || [])];
      shs[idx] = { ...shs[idx], ...partial };
      // Recalculate percent
      if (partial.sharesHeld !== undefined && data.totalShares > 0) {
        shs[idx].percentHolding = ((shs[idx].sharesHeld / data.totalShares) * 100).toFixed(2);
      }
      patch({ shareholders: shs });
    }
    function removeSh(idx: number) {
      patch({ shareholders: data.shareholders.filter((_, i) => i !== idx) });
    }

    const totalSharesHeld = (data.shareholders || []).reduce((s, sh) => s + (sh.sharesHeld || 0), 0);

    return (
      <>
        <SectionCard title="Share Capital" color="blue">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nominal Value per Share (₹)" value={data.nominalValuePerShare} onChange={v => patch({ nominalValuePerShare: v })} placeholder="10" required />
            <Field label="Total Shares" value={String(data.totalShares || "")} onChange={v => patch({ totalShares: parseInt(v) || 0 })} placeholder="10000" required hint="Total issued & paid-up shares" />
          </div>
          {totalSharesHeld > 0 && (
            <div className={`text-xs p-2 rounded mt-2 ${totalSharesHeld === data.totalShares ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
              {totalSharesHeld === data.totalShares ? `✓ Shares tally: ${totalSharesHeld.toLocaleString("en-IN")} shares` : `⚠ Shares held (${totalSharesHeld.toLocaleString("en-IN")}) ≠ Total shares (${data.totalShares.toLocaleString("en-IN")})`}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Shareholders / Member Register" color="emerald">
          <p className="text-xs text-slate-500 mb-4">Add all shareholders as on 31st March 2025. Required for MGT-7A/MGT-7 filing.</p>
          {(data.shareholders || []).map((s, i) => (
            <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">Shareholder {i + 1} — Folio: {s.folioNo}</span>
                <button onClick={() => removeSh(i)} className="text-red-400 hover:text-red-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input type="text" value={s.name} onChange={e => updateSh(i, { name: e.target.value })} placeholder="Shareholder Name" className="col-span-2 border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                <select value={s.type} onChange={e => updateSh(i, { type: e.target.value as ShareholderRecord["type"] })} className="border border-slate-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500">
                  <option value="resident_individual">Resident Individual</option>
                  <option value="nri">NRI</option>
                  <option value="body_corporate">Body Corporate</option>
                  <option value="huf">HUF</option>
                  <option value="trust">Trust</option>
                  <option value="government">Government</option>
                </select>
                <input type="text" value={s.pan || ""} onChange={e => updateSh(i, { pan: e.target.value })} placeholder="PAN" className="border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                <div>
                  <label className="text-xs text-slate-400 block mb-0.5">Shares Held</label>
                  <input type="number" value={s.sharesHeld || ""} onChange={e => updateSh(i, { sharesHeld: parseInt(e.target.value) || 0 })} placeholder="0" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-0.5">% Holding</label>
                  <input type="text" value={s.percentHolding} onChange={e => updateSh(i, { percentHolding: e.target.value })} placeholder="100.00" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                </div>
                <input type="text" value={s.folioNo} onChange={e => updateSh(i, { folioNo: e.target.value })} placeholder="Folio No." className="border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
            </div>
          ))}
          <button onClick={addShareholder} className="text-sm text-emerald-700 font-semibold flex items-center gap-1 hover:text-emerald-900">
            <span className="text-lg leading-none">+</span> Add Shareholder
          </button>
        </SectionCard>
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STEP 7 — AOC-1 / AOC-2
  // ══════════════════════════════════════════════════════════════════════
  function renderStep7() {
    return (
      <>
        {!data.hasSubsidiaries && !data.hasRPT && (
          <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-center">
            <p className="text-green-800 font-semibold text-sm">No Conditional Attachments Required</p>
            <p className="text-green-700 text-xs mt-1">AOC-1 and AOC-2 are not applicable based on your selections in Step 4. Proceed to Generate All.</p>
          </div>
        )}

        {data.hasSubsidiaries && (
          <SectionCard title="AOC-1 — Subsidiaries / Associates / JVs" color="blue">
            <p className="text-xs text-slate-500 mb-4">Add subsidiaries, associate companies, and joint ventures as on 31st March 2025 [Sec. 129(3)].</p>
            <button onClick={() => {
              const subs = [...(data.subsidiaries || []), {
                name: "", cin: "", country: "India", currency: "INR", shareCapital: "", reservesSurplus: "",
                totalAssets: "", totalLiabilities: "", investments: "", turnover: "", profitBeforeTax: "",
                provisionForTax: "", profitAfterTax: "", proposedDividend: "", percentShareholding: "",
                type: "subsidiary" as const,
              }];
              patch({ subsidiaries: subs });
            }} className="text-sm text-blue-700 font-semibold flex items-center gap-1 hover:text-blue-900 mb-3">
              <span className="text-lg leading-none">+</span> Add Subsidiary / Associate / JV
            </button>
            {(data.subsidiaries || []).map((s, i) => (
              <div key={i} className="p-4 bg-white border border-slate-200 rounded-lg mb-3">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-500">Entry {i + 1}</span>
                  <button onClick={() => patch({ subsidiaries: data.subsidiaries!.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    ["Name", "name", "Subsidiary Name"],
                    ["CIN / LLPIN", "cin", "U12345MH2020PTC123456"],
                    ["Country", "country", "India"],
                    ["Currency", "currency", "INR"],
                    ["% Shareholding", "percentShareholding", "51%"],
                    ["Share Capital (₹)", "shareCapital", "0"],
                    ["Reserves & Surplus (₹)", "reservesSurplus", "0"],
                    ["Total Assets (₹)", "totalAssets", "0"],
                    ["Total Liabilities (₹)", "totalLiabilities", "0"],
                    ["Turnover (₹)", "turnover", "0"],
                    ["PBT (₹)", "profitBeforeTax", "0"],
                    ["Provision for Tax (₹)", "provisionForTax", "0"],
                    ["PAT (₹)", "profitAfterTax", "0"],
                    ["Proposed Dividend (₹)", "proposedDividend", "0"],
                  ].map(([label, key, ph]) => (
                    <div key={key}>
                      <label className="text-xs text-slate-400 block mb-0.5">{label}</label>
                      <input type="text" value={(s as unknown as Record<string, string>)[key] || ""} placeholder={ph}
                        onChange={e => {
                          const subs = [...data.subsidiaries!];
                          (subs[i] as unknown as Record<string, string>)[key] = e.target.value;
                          patch({ subsidiaries: subs });
                        }}
                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs text-slate-400 block mb-0.5">Type</label>
                    <select value={s.type} onChange={e => {
                      const subs = [...data.subsidiaries!];
                      subs[i] = { ...subs[i], type: e.target.value as "subsidiary" | "associate" | "joint_venture" };
                      patch({ subsidiaries: subs });
                    }} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="subsidiary">Subsidiary</option>
                      <option value="associate">Associate</option>
                      <option value="joint_venture">Joint Venture</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </SectionCard>
        )}

        {data.hasRPT && (
          <SectionCard title="AOC-2 — Related Party Transactions" color="amber">
            <p className="text-xs text-slate-500 mb-4">Add RPTs that are not at arm's length OR are material [Sec. 188 read with Rule 8(2)].</p>
            <button onClick={() => {
              const txns = [...(data.relatedPartyTransactions || []), {
                id: Date.now().toString(), relatedPartyName: "", relationship: "",
                natureOfTransaction: "", duration: "", salientTerms: "",
                amount: "", isArmLength: true, isMaterial: false,
              }];
              patch({ relatedPartyTransactions: txns });
            }} className="text-sm text-amber-700 font-semibold flex items-center gap-1 hover:text-amber-900 mb-3">
              <span className="text-lg leading-none">+</span> Add RPT Entry
            </button>
            {(data.relatedPartyTransactions || []).map((t, i) => (
              <div key={t.id} className="p-4 bg-white border border-slate-200 rounded-lg mb-3">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-500">Transaction {i + 1}</span>
                  <button onClick={() => patch({ relatedPartyTransactions: data.relatedPartyTransactions!.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Related Party Name", "relatedPartyName", "Name of related party"],
                    ["CIN / PAN", "cin", "CIN or PAN of related party"],
                    ["Relationship", "relationship", "e.g., Director, Relative"],
                    ["Nature of Transaction", "natureOfTransaction", "e.g., Sale of goods"],
                    ["Duration", "duration", "e.g., Ongoing"],
                    ["Amount (₹)", "amount", "0"],
                    ["Salient Terms", "salientTerms", "Key terms of the transaction"],
                  ].map(([label, key, ph]) => (
                    <div key={key}>
                      <label className="text-xs text-slate-400 block mb-0.5">{label}</label>
                      <input type="text" value={(t as unknown as Record<string, string>)[key] || ""} placeholder={ph}
                        onChange={e => {
                          const txns = [...data.relatedPartyTransactions!];
                          (txns[i] as unknown as Record<string, string>)[key] = e.target.value;
                          patch({ relatedPartyTransactions: txns });
                        }}
                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
                    </div>
                  ))}
                  <div className="flex gap-4 items-center col-span-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={t.isArmLength} onChange={e => {
                        const txns = [...data.relatedPartyTransactions!];
                        txns[i] = { ...txns[i], isArmLength: e.target.checked };
                        patch({ relatedPartyTransactions: txns });
                      }} className="rounded" />
                      At Arm&apos;s Length
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={t.isMaterial} onChange={e => {
                        const txns = [...data.relatedPartyTransactions!];
                        txns[i] = { ...txns[i], isMaterial: e.target.checked };
                        patch({ relatedPartyTransactions: txns });
                      }} className="rounded" />
                      Material Transaction
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </SectionCard>
        )}
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STEP 8 — Generate All
  // ══════════════════════════════════════════════════════════════════════
  function renderStep8() {
    const cashFlowIncluded = data.companyType === "section8" || data.companyType === "fpc";
    const isOPCOrSmall     = data.companyType === "opc" || data.companyType === "private_small";

    const attachments = [
      { key: "audit-report",      label: "Independent Auditor's Report",    icon: "📋", always: true },
      { key: "board-report",      label: `Directors' Report (${isOPCOrSmall ? "Rule 8A — Abridged" : "Rule 8 — Full"})`, icon: "📄", always: true },
      { key: "notes-on-accounts", label: "Notes to Financial Statements",   icon: "📊", always: true },
      { key: "director-list",     label: "List of Directors (31 March 2025)", icon: "👥", always: true },
      { key: "shareholder-list",  label: "List of Shareholders (31 March 2025)", icon: "🏛️", always: true },
      { key: "aoc-1",             label: "Form AOC-1 — Subsidiaries Statement", icon: "🔗", always: false, condition: data.hasSubsidiaries },
      { key: "aoc-2",             label: "Form AOC-2 — Related Party Transactions", icon: "🤝", always: false, condition: data.hasRPT },
    ];

    const applicable = attachments.filter(a => a.always || a.condition);

    return (
      <>
        <SectionCard title="Summary — Documents to be Generated" color="emerald">
          <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-slate-500">Company:</span> <strong>{data.companyName || "—"}</strong></div>
              <div><span className="text-slate-500">CIN:</span> <strong>{data.cin || "—"}</strong></div>
              <div><span className="text-slate-500">Type:</span> <strong>{COMPANY_TYPE_LABELS[data.companyType]}</strong></div>
              <div><span className="text-slate-500">FY:</span> <strong>{data.financialYear}</strong></div>
              <div><span className="text-slate-500">Auditor:</span> <strong>{data.auditor.firmName || "—"}</strong></div>
              <div><span className="text-slate-500">Opinion:</span> <strong>{auditOpts.opinionType}</strong></div>
              <div><span className="text-slate-500">Board Meetings:</span> <strong>{data.boardMeetings?.length || 0}</strong></div>
              <div><span className="text-slate-500">Cash Flow:</span> <strong>{cashFlowIncluded ? "Included (Mandatory)" : "Exempt (OPC/Small)"}</strong></div>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-600 mb-3">Attachments to be generated ({applicable.length} documents):</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
            {applicable.map(a => (
              <div key={a.key} className="flex items-center gap-2 p-2 bg-white border border-emerald-200 rounded-lg text-xs text-slate-700">
                <span>{a.icon}</span>
                <span>{a.label}</span>
                <span className="ml-auto text-emerald-600 font-bold">✓</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !data.companyName}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-base transition-colors flex items-center justify-center gap-2"
          >
            {generating ? (
              <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Generating...</>
            ) : (
              <><span>⚡</span> Generate All Attachments at Once</>
            )}
          </button>
        </SectionCard>

        {Object.keys(generated).length > 0 && (
          <SectionCard title="Generated Documents" color="blue">
            <div className="grid grid-cols-1 gap-3">
              {applicable.filter(a => generated[a.key]).map(a => (
                <div key={a.key} className="flex items-center gap-2 p-3 bg-white border-2 border-blue-200 rounded-xl">
                  <span className="text-2xl flex-shrink-0">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{a.label}</p>
                  </div>
                  <button
                    onClick={() => openDoc(generated[a.key]!)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all flex-shrink-0"
                    title="Open in new tab → Ctrl+P to print or save as PDF"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print / PDF
                  </button>
                  <button
                    onClick={() => downloadDoc(generated[a.key]!)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all flex-shrink-0"
                    title="Open and auto-trigger Save as PDF dialog"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Save PDF
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3 text-center">
              <b>Print / PDF</b> — opens in new tab, use <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs">Ctrl+P</kbd> → Save as PDF.&nbsp;
              <b>Save PDF</b> — auto-opens print dialog directly.
            </p>
          </SectionCard>
        )}
      </>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">A</div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Annual Filing Attachments Generator</h1>
              <p className="text-sm text-slate-500">AOC-4 &amp; MGT-7/7A | FY 2024-25 | OPC, Private, Section 8, FPC</p>
            </div>
          </div>

          {/* Save / login bar */}
          <div className="flex items-center justify-between mt-4 p-3 bg-white border border-slate-200 rounded-xl">
            <div className="text-xs text-slate-500">
              {loadMsg
                ? <span className="text-blue-600 animate-pulse">{loadMsg}</span>
                : data.companyName ? <span className="font-semibold text-slate-700">{data.companyName}</span> : <span>No company selected</span>
              }
              {saveId && !loadMsg && <span className="ml-2 text-green-600">• Saved</span>}
            </div>
            {session?.user ? (
              <button onClick={handleSave} disabled={saving || !data.companyName} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg transition-colors">
                {saving ? "Saving…" : saveId ? "Update Save" : "Save Draft"}
              </button>
            ) : (
              <a href="/auth/login" className="text-xs text-blue-600 hover:underline font-semibold">Sign in to save drafts</a>
            )}
          </div>
        </div>

        {/* Step indicator */}
        {renderStepIndicator()}

        {/* Step content */}
        <div>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
          {step === 6 && renderStep6()}
          {step === 7 && renderStep7()}
          {step === 8 && renderStep8()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={!canPrev}
            className="flex items-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Previous
          </button>

          <span className="text-xs text-slate-400">Step {step} of {STEPS.length}</span>

          {step < STEPS.length ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          ) : (
            <div className="w-24" />
          )}
        </div>
      </div>
    </div>
  );
}
