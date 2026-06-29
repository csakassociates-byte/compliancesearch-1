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
  type FinancialYear,
} from "@/lib/annual-filing/generators/index";
import type { AuditReportOptions } from "@/lib/annual-filing/generators/index";
import type { AuditorDetails, BoardMeeting, DirectorRecord, ShareholderRecord } from "@/lib/annual-filing/types";
import { stateFromCIN } from "@/lib/annual-filing/cin-state";

interface SavedCA {
  id: string;
  firmName: string;
  frn: string;
  partnerName: string;
  membershipNo: string;
  place?: string | null;
  signatureBase64?: string | null;
  sealBase64?: string | null;
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
type FinRowConfig = {
  label: string;
  fKey: string;
  prevKey: string;
  isComputed?: boolean;
  formula?: string;
};

const PL_ROWS: FinRowConfig[] = [
  { label: "Revenue from Operations", fKey: "revenueFromOperations",  prevKey: "prevRevenueFromOperations"  },
  { label: "Other Income",            fKey: "otherIncome",            prevKey: "prevOtherIncome"            },
  { label: "Total Income",            fKey: "totalIncome",            prevKey: "prevTotalIncome",            isComputed: true, formula: "Revenue from Operations + Other Income"    },
  { label: "Total Expenses",          fKey: "totalExpenses",          prevKey: "prevTotalExpenses"          },
  { label: "Profit Before Tax (PBT)", fKey: "profitBeforeTax",        prevKey: "prevProfitBeforeTax",        isComputed: true, formula: "Total Income − Total Expenses"              },
  { label: "Current Tax",             fKey: "currentTax",             prevKey: "prevCurrentTax"             },
  { label: "Deferred Tax",            fKey: "deferredTax",            prevKey: "prevDeferredTax"            },
  { label: "Profit After Tax (PAT)",  fKey: "profitAfterTax",         prevKey: "prevProfitAfterTax",         isComputed: true, formula: "PBT − Current Tax − Deferred Tax"           },
];

const BS_ROWS: FinRowConfig[] = [
  { label: "Authorised Share Capital", fKey: "authorisedCapital",  prevKey: "prevAuthorisedCapital"  },
  { label: "Paid-up Share Capital",    fKey: "paidUpCapital",      prevKey: "prevPaidUpCapital"      },
  { label: "Reserves & Surplus",       fKey: "reservesAndSurplus", prevKey: "prevReservesAndSurplus" },
  { label: "Total Assets",             fKey: "totalAssets",        prevKey: "prevTotalAssets"        },
  { label: "Total Liabilities",        fKey: "totalLiabilities",   prevKey: "prevTotalLiabilities"   },
  { label: "Net Worth",                fKey: "netWorth",           prevKey: "prevNetWorth",           isComputed: true, formula: "Paid-up Capital + Reserves & Surplus"       },
];

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

const FY_OPTIONS = ["2025-26", "2024-25"];

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
    emphasisOfMatter: "",
    qualificationDetails: "",
    auditTrailCompliant: false,
    auditTrailSoftware: "",
  });
  const [saving, setSaving]         = useState(false);
  const [loadMsg, setLoadMsg]       = useState("");
  // Derived FY end year — e.g. "2025-26" → 2026, "2024-25" → 2025
  const fyEndYr = data.financialYear
    ? parseInt(data.financialYear.split("-")[0]) + 1
    : 2025;
  const [saveId, setSaveId]         = useState<string | null>(null);
  const [saveIdFY, setSaveIdFY]     = useState<string | null>(null);
  const [savedMsg, setSavedMsg]     = useState<{ ok: boolean; text: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated]   = useState<Record<string, string>>({});
  const [pdfLoading, setPdfLoading] = useState<Record<string, boolean>>({});
  const [savedCAs, setSavedCAs]     = useState<SavedCA[]>([]);
  const [savingCA, setSavingCA]     = useState(false);
  const [showCAManager, setShowCAManager] = useState(false);
  const [companyId, setCompanyId]   = useState<string | null>(null);
  const [loadingPersons, setLoadingPersons] = useState(false);
  const [foundDraft, setFoundDraft] = useState<{
    id: string; companyName: string | null; financialYear: string | null;
    updatedAt: string; formDataJson: string;
  } | null>(null);
  const [resetting, setResetting]   = useState(false);

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
          setSaveIdFY(parsed.data.financialYear);
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

  // ── Auto-calculate Total Shares = Paid-up Capital / Nominal Value ───────
  useEffect(() => {
    const paidUp  = parseFloat(data.financials.paidUpCapital) || 0;
    const nominal = parseFloat(data.nominalValuePerShare)     || 0;
    if (paidUp > 0 && nominal > 0) {
      patch({ totalShares: Math.round(paidUp / nominal) });
    }
  }, [data.financials.paidUpCapital, data.nominalValuePerShare]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-calculate derived P&L and BS fields ──────────────────────────
  useEffect(() => {
    const f = data.financials;
    const n = (v: string) => parseFloat(v) || 0;

    const ti   = n(f.revenueFromOperations) + n(f.otherIncome);
    const pbt  = ti - n(f.totalExpenses);
    const pat  = pbt - n(f.currentTax) - n(f.deferredTax);
    const nw   = n(f.paidUpCapital) + n(f.reservesAndSurplus);

    const pti  = n(f.prevRevenueFromOperations) + n(f.prevOtherIncome);
    const ppbt = pti - n(f.prevTotalExpenses);
    const ppat = ppbt - n(f.prevCurrentTax) - n(f.prevDeferredTax);
    const pnw  = n(f.prevPaidUpCapital) + n(f.prevReservesAndSurplus);

    patchFin({
      totalIncome:         String(ti),
      profitBeforeTax:     String(pbt),
      profitAfterTax:      String(pat),
      netWorth:            String(nw),
      prevTotalIncome:     String(pti),
      prevProfitBeforeTax: String(ppbt),
      prevProfitAfterTax:  String(ppat),
      prevNetWorth:        String(pnw),
    });
  }, [ // eslint-disable-line react-hooks/exhaustive-deps
    data.financials.revenueFromOperations, data.financials.otherIncome,
    data.financials.totalExpenses, data.financials.currentTax, data.financials.deferredTax,
    data.financials.paidUpCapital, data.financials.reservesAndSurplus,
    data.financials.prevRevenueFromOperations, data.financials.prevOtherIncome,
    data.financials.prevTotalExpenses, data.financials.prevCurrentTax, data.financials.prevDeferredTax,
    data.financials.prevPaidUpCapital, data.financials.prevReservesAndSurplus,
  ]);

  // ── Company fill from Excel / Search ──────────────────────────────────
  function handleCompanyFill(co: CompanyData) {
    const companyType = detectCompanyType(co.entityType || "", co.smallCompany);
    const derivedState = stateFromCIN(co.cin || "");
    if (co.id) setCompanyId(co.id);
    // Auto-fill prevFYLastMeetingDate from MCA dateOfLastAGM — mark as unconfirmed (red)
    const lastAgm = co.dateOfLastAGM ? toDateInput(co.dateOfLastAGM) : "";
    patch({
      companyName:           co.companyName || "",
      cin:                   co.cin || "",
      regAddress:            co.regAddress || "",
      entityType:            co.entityType || "",
      companyType,
      rocName:               co.rocName || "",
      incorporationDate:     toDateInput(co.incorporationDate || ""),
      stateOfIncorporation:  derivedState || "",
      ...(co.email  && { companyEmail: co.email }),
      ...(co.mobile && { companyPhone: co.mobile }),
      ...(lastAgm   && { prevFYLastMeetingDate: lastAgm, prevFYLastMeetingDateConfirmed: false }),
      directors: (co.directors || []).map(d => ({
        din:               d.din || "",
        name:              d.name || "",
        designation:       d.designation || "Director",
        category:          d.category || "Non-Executive",
        dateOfAppointment: toDateInput(d.appointedAt || ""),
        dateOfCessation:   toDateInput(d.ceasedAt || ""),
        isActive:          d.isActive,
        changedDuringYear: false,
      })),
    });
    patchFin({
      authorisedCapital: co.authorisedCapital || "",
      paidUpCapital:     co.paidUpCapital     || "",
    });
    // Auto-load KYC from person records — pass dirs directly to avoid stale state
    if (co.id) {
      const newDirs = (co.directors || []).map(d => ({
        din:               d.din || "",
        name:              d.name || "",
        designation:       d.designation || "Director",
        category:          d.category || "Non-Executive",
        dateOfAppointment: toDateInput(d.appointedAt || ""),
        dateOfCessation:   toDateInput(d.ceasedAt || ""),
        isActive:          d.isActive,
        changedDuringYear: false,
      }));
      void loadPersonsForCompany(co.id, newDirs);
    }
    // Check if a saved draft exists for this CIN + current FY
    if (co.cin && session?.user) {
      setFoundDraft(null);
      setSaveId(null);
      setSaveIdFY(null);
      fetch(`/api/annual-filing?cin=${encodeURIComponent(co.cin)}&fy=${encodeURIComponent(data.financialYear)}`)
        .then(r => r.json())
        .then((json: { filing?: { id: string; companyName: string | null; financialYear: string | null; updatedAt: string; formDataJson: string } | null }) => {
          if (json.filing) setFoundDraft(json.filing);
        })
        .catch(() => {});
    }
  }

  // ── Core KYC load: fetch persons and merge into given dirs array ──────
  async function loadPersonsForCompany(cId: string, currentDirs: DirectorRecord[]) {
    if (!cId || !session?.user) return;
    setLoadingPersons(true);
    try {
      const res = await fetch(`/api/persons?companyId=${cId}&type=director`);
      const json = await res.json() as { persons?: Array<{
        id: string | null; din?: string; name: string;
        fatherName?: string | null; dateOfBirth?: string | null;
        email?: string | null; nationality?: string | null;
        occupation?: string | null; presentAddress?: string | null;
        panNo?: string | null; appointedAt?: string | null;
        signatureBase64?: string | null;
      }> };
      const persons = json.persons || [];
      if (!persons.length) return;
      const dirs = [...currentDirs];
      for (const p of persons) {
        const idx = dirs.findIndex(d =>
          (p.din && d.din && p.din === d.din) ||
          d.name.trim().toLowerCase() === p.name.trim().toLowerCase()
        );
        if (idx !== -1) {
          dirs[idx] = {
            ...dirs[idx],
            dateOfAppointment: dirs[idx].dateOfAppointment || toDateInput(p.appointedAt || ""),
            fatherName:       p.fatherName       || dirs[idx].fatherName,
            dateOfBirth:      p.dateOfBirth ? toDateInput(p.dateOfBirth) : dirs[idx].dateOfBirth,
            email:            p.email            || dirs[idx].email,
            nationality:      p.nationality      || dirs[idx].nationality,
            occupation:       p.occupation       || dirs[idx].occupation,
            address:          p.presentAddress   || dirs[idx].address,
            pan:              p.panNo            || dirs[idx].pan,
            signatureBase64:  p.signatureBase64  || dirs[idx].signatureBase64,
            _personId:        p.id,
          };
        }
      }
      patch({ directors: dirs });
    } finally {
      setLoadingPersons(false);
    }
  }

  // ── Load director KYC from Person Records (manual button) ────────────
  async function handleLoadPersons() {
    if (!companyId) return;
    await loadPersonsForCompany(companyId, data.directors || []);
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
        din:             d.din         || undefined,
        fatherName:      d.fatherName  || undefined,
        dateOfBirth:     d.dateOfBirth || undefined,
        email:           d.email       || undefined,
        nationality:     d.nationality || undefined,
        occupation:      d.occupation  || undefined,
        presentAddress:  d.address     || undefined,
        panNo:            d.pan              || undefined,
        designation:      d.designation     || undefined,
        directorCategory: d.category        || undefined,
        dateOfJoining:    d.dateOfAppointment || undefined,
        signatureBase64:  d.signatureBase64  || undefined,
        isDirector:       true,
      }),
    });
  }

  // ── Strip large base64 images before saving (they live in csi_persons / csi_auditors) ──
  function stripImagesForSave(d: AnnualFilingData): AnnualFilingData {
    return {
      ...d,
      auditor: { ...d.auditor, signatureBase64: undefined, sealBase64: undefined },
      signatoryDirectors: {
        director1: { ...d.signatoryDirectors.director1, signatureBase64: undefined },
        director2: d.signatoryDirectors.director2
          ? { ...d.signatoryDirectors.director2, signatureBase64: undefined }
          : undefined,
        director3: d.signatoryDirectors.director3
          ? { ...d.signatoryDirectors.director3, signatureBase64: undefined }
          : undefined,
      },
      directors: d.directors.map(dir => ({ ...dir, signatureBase64: undefined })),
    };
  }

  // ── DB Save ───────────────────────────────────────────────────────────
  async function handleSave() {
    if (!session?.user) return;
    // Only reuse the existing saveId if it belongs to the same FY
    const existingId = (saveId && saveIdFY === data.financialYear) ? saveId : null;
    if (existingId) {
      const ok = confirm(`This will update the FY ${data.financialYear} draft for ${data.companyName}. Continue?`);
      if (!ok) return;
    }
    setSaving(true);
    setSavedMsg(null);
    try {
      const res = await fetch("/api/annual-filing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id:            existingId || undefined,
          companyName:   data.companyName,
          cin:           data.cin,
          financialYear: data.financialYear,
          formDataJson:  JSON.stringify({ data: stripImagesForSave(data), auditOpts }),
        }),
      });
      const json = await res.json() as { id?: string; error?: string };
      if (json.id) {
        setSaveId(json.id);
        setSaveIdFY(data.financialYear);
        setFoundDraft(null);
        setSavedMsg({ ok: true, text: "Draft saved successfully" });
        setTimeout(() => setSavedMsg(null), 5000);
      } else {
        setSavedMsg({ ok: false, text: json.error || "Save failed — please try again" });
      }
    } catch {
      setSavedMsg({ ok: false, text: "Network error — save failed" });
    } finally {
      setSaving(false);
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────
  async function handleReset() {
    const first = confirm("Are you sure you want to reset all data?");
    if (!first) return;
    const second = confirm("All entered data will be cleared and the saved draft deleted permanently. This cannot be undone. Are you absolutely sure?");
    if (!second) return;
    setResetting(true);
    try {
      if (saveId) {
        await fetch(`/api/documents/${saveId}`, { method: "DELETE" });
      }
      setData({ ...INITIAL_FILING_DATA });
      setAuditOpts({
        opinionType: "unmodified",
        cashFlowIncluded: false,
        emphasisOfMatter: "",
        qualificationDetails: "",
        auditTrailCompliant: false,
        auditTrailSoftware: "",
      });
      setSaveId(null);
      setSaveIdFY(null);
      setGenerated({});
      setFoundDraft(null);
      setSavedMsg(null);
      setCompanyId(null);
      setStep(1);
    } finally {
      setResetting(false);
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
        body: JSON.stringify({ firmName: a.firmName, frn: a.frn, partnerName: a.partnerName, membershipNo: a.membershipNo, place: a.place, signatureBase64: a.signatureBase64, sealBase64: a.sealBase64 }),
      });
      const json = await res.json() as { id?: string };
      if (json.id) {
        patchAud({ _savedCAId: json.id });
        setSavedCAs(prev => {
          const exists = prev.find(c => c.id === json.id);
          const updated: SavedCA = { id: json.id!, firmName: a.firmName, frn: a.frn, partnerName: a.partnerName, membershipNo: a.membershipNo, place: a.place, signatureBase64: a.signatureBase64, sealBase64: a.sealBase64 };
          return exists ? prev.map(c => c.id === json.id ? updated : c) : [updated, ...prev];
        });
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

  async function handleDownloadPdf(key: string, label: string) {
    const html = generated[key];
    if (!html) return;
    setPdfLoading(prev => ({ ...prev, [key]: true }));
    try {
      // Dynamic imports — loaded only when PDF is requested
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const isLandscape = key === "director-list";
      const isAudit = key === "audit-report";
      const isNotes = key === "notes-on-accounts";

      // A4 dimensions in PDF points (1pt = 1/72 inch)
      // Portrait: 595.28 × 841.89   Landscape: 841.89 × 595.28
      const PAGE_W = isLandscape ? 841.89 : 595.28;
      const PAGE_H = isLandscape ? 595.28 : 841.89;
      const HEADER_H = 22;   // pt — top strip for company/title/page#
      const FOOTER_H = 52;   // pt — bottom strip for director sigs + seal
      const CONTENT_H = PAGE_H - HEADER_H - FOOTER_H;

      // We'll capture at 794px width (portrait) or 1123px (landscape) = A4 at 96 dpi
      const captureW = isLandscape ? 1123 : 794;

      // Create a hidden iframe and write the HTML into it
      const iframe = document.createElement("iframe");
      iframe.style.cssText =
        `position:fixed;left:-12000px;top:0;width:${captureW}px;height:4px;border:none;`;
      document.body.appendChild(iframe);

      const iDoc = iframe.contentDocument!;
      iDoc.open();
      iDoc.write(html);
      iDoc.close();

      // Override screen styles for pixel-perfect capture
      const overrideStyle = iDoc.createElement("style");
      overrideStyle.textContent = `
        html { background: white !important; }
        body {
          width: ${captureW}px !important;
          margin: 0 !important;
          padding: 76px !important;
          box-sizing: border-box !important;
          background: white !important;
        }
        .page-sig-footer { display: none !important; }
        .has-page-footer { padding-bottom: 0 !important; }
      `;
      iDoc.head.appendChild(overrideStyle);

      // Wait for layout + base64 images to render
      await new Promise(r => setTimeout(r, 900));

      const fullH = Math.max(
        iDoc.body.scrollHeight,
        iDoc.documentElement.scrollHeight,
        600
      );
      iframe.style.height = `${fullH}px`;
      await new Promise(r => setTimeout(r, 300));

      // Capture the full document as one tall canvas (scale 2 = ~192 dpi)
      const fullCanvas = await html2canvas(iDoc.body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: captureW,
        height: fullH,
        windowWidth: captureW,
        windowHeight: fullH,
        scrollX: 0,
        scrollY: 0,
      });
      document.body.removeChild(iframe);

      // Pixels per PDF point (canvas at scale 2, A4 at 96 dpi)
      // Portrait: 794px → 595.28pt  so 1588px / 595.28pt ≈ 2.668 px/pt
      // Landscape: 1123px → 841.89pt so 2246px / 841.89pt ≈ 2.668 px/pt
      const PX_PER_PT = (captureW * 2) / PAGE_W;
      const pageContentPx = Math.round(CONTENT_H * PX_PER_PT);
      const numPages = Math.ceil(fullCanvas.height / pageContentPx);

      // Director / seal data for footer
      const d1 = data.signatoryDirectors.director1;
      const d2 = data.signatoryDirectors.director2;
      const d3 = data.signatoryDirectors.director3;
      type DirSlot = { name: string; designation?: string; din?: string; signatureBase64?: string };
      const sigDirs: DirSlot[] = isAudit ? [] : (
        [d1, d2, d3]
          .filter((d): d is NonNullable<typeof d> => !!d?.name)
          .map(d => ({ name: d.name!, designation: d.designation ?? undefined, din: d.din ?? undefined, signatureBase64: d.signatureBase64 ?? undefined }))
      );
      const aud = (isAudit || isNotes) ? data.auditor : undefined;
      const hasSeal = !!(aud?.firmName || aud?.sealBase64);
      const totalFooterSlots = sigDirs.length + (hasSeal ? 1 : 0);
      const slotW = totalFooterSlots > 0 ? (PAGE_W - 40) / totalFooterSlots : 0;

      const pdf = new jsPDF({
        unit: "pt",
        format: "a4",
        orientation: isLandscape ? "landscape" : "portrait",
      });

      for (let pg = 0; pg < numPages; pg++) {
        if (pg > 0) pdf.addPage();

        const srcY = pg * pageContentPx;
        const srcH = Math.min(pageContentPx, fullCanvas.height - srcY);

        // Slice the canvas for this page
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width  = fullCanvas.width;
        sliceCanvas.height = pageContentPx;
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(
          fullCanvas,
          0, srcY, fullCanvas.width, srcH,
          0, 0,   fullCanvas.width, srcH
        );

        // Add content image — positioned below header, stops above footer
        pdf.addImage(
          sliceCanvas.toDataURL("image/jpeg", 0.92),
          "JPEG",
          0, HEADER_H, PAGE_W, CONTENT_H
        );

        // ── Header strip ──────────────────────────────────────────────────
        pdf.setDrawColor(170, 170, 170);
        pdf.setLineWidth(0.5);
        pdf.line(20, HEADER_H - 2, PAGE_W - 20, HEADER_H - 2);

        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 0, 0);
        const coName = (data.companyName || "").slice(0, 45);
        pdf.text(coName, 20, HEADER_H - 7);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);
        pdf.setTextColor(80, 80, 80);
        pdf.text(label.split("(")[0].trim(), PAGE_W / 2, HEADER_H - 7, { align: "center" });
        pdf.text(`Page ${pg + 1} of ${numPages}`, PAGE_W - 20, HEADER_H - 7, { align: "right" });

        // ── Footer strip ──────────────────────────────────────────────────
        const footerTopY = PAGE_H - FOOTER_H;
        pdf.setDrawColor(170, 170, 170);
        pdf.line(20, footerTopY, PAGE_W - 20, footerTopY);

        // Director signature slots
        for (let s = 0; s < sigDirs.length; s++) {
          const dir = sigDirs[s];
          const cx = 20 + s * slotW + slotW / 2;
          const sigImgY = footerTopY + 3;
          if (dir.signatureBase64) {
            try {
              pdf.addImage(
                `data:image/jpeg;base64,${dir.signatureBase64}`,
                "JPEG", cx - 18, sigImgY, 36, 15
              );
            } catch { /* skip if image fails */ }
          }
          pdf.setFontSize(6.5); pdf.setFont("helvetica", "bold"); pdf.setTextColor(0, 0, 0);
          pdf.text(dir.name, cx, footerTopY + 23, { align: "center", maxWidth: slotW - 4 });
          pdf.setFontSize(5.5); pdf.setFont("helvetica", "normal"); pdf.setTextColor(80, 80, 80);
          if (dir.designation) pdf.text(dir.designation, cx, footerTopY + 30, { align: "center", maxWidth: slotW - 4 });
          if (dir.din) pdf.text(`DIN: ${dir.din}`, cx, footerTopY + 37, { align: "center" });
        }

        // CA seal slot (audit-report & notes-on-accounts)
        if (hasSeal && aud) {
          const sealIdx = sigDirs.length;
          const cx = 20 + sealIdx * slotW + slotW / 2;
          const sealImgY = footerTopY + 2;
          if (aud.sealBase64) {
            try {
              pdf.addImage(
                `data:image/jpeg;base64,${aud.sealBase64}`,
                "JPEG", cx - 14, sealImgY, 28, 24
              );
            } catch { /* skip */ }
          }
          pdf.setFontSize(6.5); pdf.setFont("helvetica", "bold"); pdf.setTextColor(0, 0, 0);
          if (aud.firmName) pdf.text(`M/s. ${aud.firmName}`, cx, footerTopY + 32, { align: "center", maxWidth: slotW - 4 });
          pdf.setFontSize(5.5); pdf.setFont("helvetica", "normal"); pdf.setTextColor(80, 80, 80);
          if (aud.frn) pdf.text(`FRN: ${aud.frn}`, cx, footerTopY + 39, { align: "center" });
        }
      }

      const filename = `${key}_${data.companyName || "Company"}_FY${data.financialYear || ""}`
        .replace(/[^a-zA-Z0-9_\-. ]/g, "_");
      pdf.save(`${filename}.pdf`);

    } catch (err) {
      alert(`PDF generation failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setPdfLoading(prev => ({ ...prev, [key]: false }));
    }
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Field label="Company Email" value={data.companyEmail || ""} onChange={v => patch({ companyEmail: v })} placeholder="info@yourcompany.com" hint="Compulsory on letter head (as per law) · also used in MGT-7/7A CTC" />
            <Field label="Company Contact No." value={data.companyPhone || ""} onChange={v => patch({ companyPhone: v })} placeholder="9876543210" hint="Compulsory on letter head (as per law)" />
            <Field label="GSTIN (optional)" value={data.gstin || ""} onChange={v => patch({ gstin: v })} placeholder="22AAAAA0000A1Z5" hint="Shown on letter head if entered" />
          </div>
        </SectionCard>

        <SectionCard title="Document Preferences" color="violet">
          <Toggle
            label="Print Company Letter Head on Documents"
            value={data.useLetterHead !== false}
            onChange={v => patch({ useLetterHead: v })}
            hint="Turn OFF if company has its own printed letter head paper — documents will show only title, not company branding"
          />
          {(() => {
            const calcARNo = (incDate: string, fy: string): number => {
              if (!incDate) return 1;
              const d = new Date(incDate);
              const incFYStart = d.getMonth() + 1 >= 4 ? d.getFullYear() : d.getFullYear() - 1;
              const fyStart = parseInt(fy.split("-")[0]);
              return Math.max(1, fyStart - incFYStart + 1);
            };
            const autoARNo   = calcARNo(data.incorporationDate, data.financialYear);
            const displayARNo = data.annualReportNo ?? autoARNo;
            const isOverridden = !!data.annualReportNo && data.annualReportNo !== autoARNo;
            return (
              <div className="mt-3">
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Annual Report Number
                  <span className="ml-2 text-xs font-normal text-slate-400">(auto-calculated from incorporation date)</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number" min="1"
                    value={displayARNo}
                    onChange={e => patch({ annualReportNo: parseInt(e.target.value) || 1 })}
                    className="w-28 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <span className="text-xs text-slate-500">
                    → <strong>{displayARNo === 1 ? "1st" : displayARNo === 2 ? "2nd" : displayARNo === 3 ? "3rd" : `${displayARNo}th`} Annual Report</strong>
                    {data.incorporationDate && <span className="ml-1 text-slate-400">(auto: {autoARNo})</span>}
                  </span>
                  {isOverridden && (
                    <button onClick={() => patch({ annualReportNo: undefined })} className="text-xs text-blue-600 hover:underline font-semibold">Reset to auto</button>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">Appears in the Board Report opening: "Your Directors have pleasure in presenting the <em>{displayARNo === 1 ? "1st" : displayARNo === 2 ? "2nd" : displayARNo === 3 ? "3rd" : `${displayARNo}th`} Annual Report</em>..."</p>
              </div>
            );
          })()}
        </SectionCard>

        <SectionCard title="Financial Year & Company Classification" color="amber">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Select
              label="Financial Year" value={data.financialYear}
              onChange={v => {
                const newFY = v as FinancialYear;
                patch({ financialYear: newFY });
                // Re-search draft for new FY if a company is already loaded
                if (data.cin && session?.user) {
                  setFoundDraft(null);
                  if (saveIdFY && saveIdFY !== newFY) {
                    setSaveId(null);
                    setSaveIdFY(null);
                  }
                  fetch(`/api/annual-filing?cin=${encodeURIComponent(data.cin)}&fy=${encodeURIComponent(newFY)}`)
                    .then(r => r.json())
                    .then((json: { filing?: { id: string; companyName: string | null; financialYear: string | null; updatedAt: string; formDataJson: string } | null }) => {
                      if (json.filing) setFoundDraft(json.filing);
                    })
                    .catch(() => {});
                }
              }}
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
                          onClick={() => patchAud({ firmName: ca.firmName, frn: ca.frn, partnerName: ca.partnerName, membershipNo: ca.membershipNo, place: ca.place || "", signatureBase64: ca.signatureBase64 || undefined, sealBase64: ca.sealBase64 || undefined, _savedCAId: ca.id })}
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

          {/* Signature & Seal upload */}
          <div className="mt-5 pt-4 border-t border-blue-200">
            <p className="text-xs font-bold text-slate-700 mb-3">Signature &amp; Firm Seal — appear in Auditor&apos;s Report &amp; Notes on Accounts</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Partner Signature */}
              <div>
                <p className="text-xs text-slate-500 mb-2 font-semibold">Partner / Proprietor Signature</p>
                {data.auditor.signatureBase64 ? (
                  <div className="p-2 border border-emerald-200 rounded-lg bg-emerald-50">
                    <img src={`data:image/jpeg;base64,${data.auditor.signatureBase64}`} alt="Signature" className="h-12 object-contain mb-1" style={{ maxWidth: "140px" }} />
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-emerald-700 font-semibold">✓ Saved</span>
                      <label className="text-xs text-blue-600 cursor-pointer hover:underline font-semibold">
                        Change
                        <input type="file" className="hidden" accept="image/jpeg,image/png,image/jpg" onChange={e => {
                          const file = e.target.files?.[0]; if (!file) return;
                          const reader = new FileReader();
                          reader.onload = ev => {
                            const b64 = (ev.target?.result as string).split(",")[1];
                            patchAud({ signatureBase64: b64 });
                            if (data.auditor._savedCAId) void fetch(`/api/auditors/${data.auditor._savedCAId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ signatureBase64: b64 }) });
                          };
                          reader.readAsDataURL(file);
                        }} />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-1.5 cursor-pointer border-2 border-dashed border-slate-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    <span className="text-xs text-slate-500 font-semibold">Upload Signature</span>
                    <span className="text-xs text-slate-400">JPEG / PNG</span>
                    <input type="file" className="hidden" accept="image/jpeg,image/png,image/jpg" onChange={e => {
                      const file = e.target.files?.[0]; if (!file) return;
                      const reader = new FileReader();
                      reader.onload = ev => {
                        const b64 = (ev.target?.result as string).split(",")[1];
                        patchAud({ signatureBase64: b64 });
                        if (data.auditor._savedCAId) void fetch(`/api/auditors/${data.auditor._savedCAId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ signatureBase64: b64 }) });
                      };
                      reader.readAsDataURL(file);
                    }} />
                  </label>
                )}
              </div>

              {/* Firm Seal */}
              <div>
                <p className="text-xs text-slate-500 mb-2 font-semibold">Firm Rubber Stamp / Seal</p>
                {data.auditor.sealBase64 ? (
                  <div className="p-2 border border-emerald-200 rounded-lg bg-emerald-50">
                    <img src={`data:image/jpeg;base64,${data.auditor.sealBase64}`} alt="Firm Seal" className="h-14 object-contain mb-1" style={{ maxWidth: "140px" }} />
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-emerald-700 font-semibold">✓ Saved</span>
                      <label className="text-xs text-blue-600 cursor-pointer hover:underline font-semibold">
                        Change
                        <input type="file" className="hidden" accept="image/jpeg,image/png,image/jpg" onChange={e => {
                          const file = e.target.files?.[0]; if (!file) return;
                          const reader = new FileReader();
                          reader.onload = ev => {
                            const b64 = (ev.target?.result as string).split(",")[1];
                            patchAud({ sealBase64: b64 });
                            if (data.auditor._savedCAId) void fetch(`/api/auditors/${data.auditor._savedCAId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sealBase64: b64 }) });
                          };
                          reader.readAsDataURL(file);
                        }} />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-1.5 cursor-pointer border-2 border-dashed border-slate-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span className="text-xs text-slate-500 font-semibold">Upload Firm Seal</span>
                    <span className="text-xs text-slate-400">JPEG / PNG</span>
                    <input type="file" className="hidden" accept="image/jpeg,image/png,image/jpg" onChange={e => {
                      const file = e.target.files?.[0]; if (!file) return;
                      const reader = new FileReader();
                      reader.onload = ev => {
                        const b64 = (ev.target?.result as string).split(",")[1];
                        patchAud({ sealBase64: b64 });
                        if (data.auditor._savedCAId) void fetch(`/api/auditors/${data.auditor._savedCAId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sealBase64: b64 }) });
                      };
                      reader.readAsDataURL(file);
                    }} />
                  </label>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">Images are saved with this CA&apos;s record and auto-loaded in future years when you select this CA.</p>
          </div>

          {/* Auditor Appointment Details — for Board Report Section 26 / 27 */}
          <div className="mt-5 pt-4 border-t border-blue-200">
            <p className="text-xs font-bold text-slate-700 mb-3">Auditor Appointment Details <span className="font-normal text-slate-400">(used in Board Report — Section 26 / 27)</span></p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Appointment Type</label>
                <select
                  value={data.auditor.appointmentType || ""}
                  onChange={e => patchAud({ appointmentType: e.target.value as "agm" | "board" | undefined || undefined })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">— Select —</option>
                  <option value="board">Board of Directors — Sec. 139(6) (First Auditor)</option>
                  <option value="agm">Annual General Meeting — Sec. 139(1)</option>
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  {data.auditor.appointmentType === "board"
                    ? "First auditor — appointed by Board within 30 days of incorporation"
                    : data.auditor.appointmentType === "agm"
                    ? "Regular appointment / reappointment at AGM"
                    : "Choose how the auditor was appointed"}
                </p>
              </div>

              {data.auditor.appointmentType === "board" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Board Meeting Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={data.auditor.boardAppointmentDate || ""}
                    onChange={e => patchAud({ boardAppointmentDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">Date of board meeting where auditor was appointed</p>
                </div>
              )}
            </div>

            {data.auditor.appointmentType === "agm" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">AGM Number <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min={1}
                    value={data.auditor.appointmentAGMNo || ""}
                    onChange={e => patchAud({ appointmentAGMNo: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="e.g. 2"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">Which AGM was the auditor appointed at?</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Year of that AGM <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min={2000}
                    max={2099}
                    value={data.auditor.appointmentYear || ""}
                    onChange={e => patchAud({ appointmentYear: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="e.g. 2021"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">Calendar year the AGM was held</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tenure (Years)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={data.auditor.tenureYears ?? 5}
                    onChange={e => patchAud({ tenureYears: e.target.value ? Number(e.target.value) : 5 })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    {data.auditor.appointmentAGMNo
                      ? `Holds office till: ${(() => { const end = (data.auditor.appointmentAGMNo || 0) + (data.auditor.tenureYears || 5); const v = end % 100; const sfx = (v >= 11 && v <= 13) ? "th" : [,"st","nd","rd"][end % 10] || "th"; return `${end}${sfx}`; })()} AGM`
                      : "Default: 5 years (max under Sec. 139)"}
                  </p>
                </div>
              </div>
            )}
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
              <button
                onClick={handleSaveCA}
                disabled={savingCA || !auditorFilled}
                className="text-xs font-bold text-blue-700 border border-blue-300 px-4 py-2 rounded-lg hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {savingCA ? "Saving…" : alreadySaved ? "Update Saved CA" : "Save CA to My List"}
              </button>
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
              placeholder="If any matter needs to be emphasised (e.g. going concern uncertainty, pending litigation). Leave blank to omit the section."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Rule 11(vi) — Audit Trail */}
          <div className="mt-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Rule 11(vi): Audit Trail — Does the company use audit-trail-compliant accounting software?
            </label>
            <div className="flex gap-6 mb-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="auditTrail"
                  checked={!auditOpts.auditTrailCompliant}
                  onChange={() => setAuditOpts(o => ({ ...o, auditTrailCompliant: false, auditTrailSoftware: "" }))}
                  className="accent-emerald-600"
                />
                No — software lacked audit trail feature
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="auditTrail"
                  checked={!!auditOpts.auditTrailCompliant}
                  onChange={() => setAuditOpts(o => ({ ...o, auditTrailCompliant: true }))}
                  className="accent-emerald-600"
                />
                Yes — software has audit trail feature
              </label>
            </div>
            {auditOpts.auditTrailCompliant && (
              <input
                value={auditOpts.auditTrailSoftware || ""}
                onChange={e => setAuditOpts(o => ({ ...o, auditTrailSoftware: e.target.value }))}
                placeholder="Software name (e.g. Tally Prime, Busy, QuickBooks)"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            )}
          </div>

          <div className="mt-3 p-3 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
            <strong>Auto-applied:</strong> CARO 2020 — NOT APPLICABLE (exempt for {COMPANY_TYPE_LABELS[data.companyType]}) •
            ICFR Auditor Report — NOT APPLICABLE (exempt) •
            Key Audit Matters — NOT APPLICABLE (unlisted company)
          </div>
        </SectionCard>

        <SectionCard title="Audit Fees — Note (r) in Notes on Accounts" color="slate">
          <p className="text-xs text-slate-500 mb-3">Fees paid to Statutory Auditors — appears in Note (r) of Notes to Financial Statements.</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label={`Statutory Audit Fees — FY ${data.financialYear} (₹)`} value={data.auditFeesCurrent || ""} onChange={v => patch({ auditFeesCurrent: v })} placeholder="e.g. 15000" />
            <Field label={`Statutory Audit Fees — Prev FY (₹)`} value={data.auditFeesPrev || ""} onChange={v => patch({ auditFeesPrev: v })} placeholder="e.g. 15000" />
            <Field label={`Tax Audit Fees — FY ${data.financialYear} (₹)`} value={data.taxAuditFeesCurrent || ""} onChange={v => patch({ taxAuditFeesCurrent: v })} placeholder="e.g. 5000 or leave blank" />
            <Field label={`Tax Audit Fees — Prev FY (₹)`} value={data.taxAuditFeesPrev || ""} onChange={v => patch({ taxAuditFeesPrev: v })} placeholder="e.g. 5000 or leave blank" />
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
              {PL_ROWS.map(row => {
                const fmtVal = (v: string) => { const n = parseFloat(v); return isNaN(n) ? "0" : n.toLocaleString("en-IN"); };
                return (
                  <tr key={row.fKey} className={row.isComputed ? "bg-emerald-50/60" : ""}>
                    <td className="py-2 pr-3">
                      <span className={`text-sm font-medium ${row.isComputed ? "text-emerald-800" : "text-slate-700"}`}>{row.label}</span>
                      {row.isComputed && row.formula && (
                        <div className="text-[10px] text-emerald-600 mt-0.5">= {row.formula}</div>
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      {row.isComputed ? (
                        <div className="w-full bg-emerald-100 border border-emerald-300 rounded px-2 py-1.5 text-sm text-right font-semibold text-emerald-900">
                          {fmtVal((fin as unknown as Record<string,string>)[row.fKey])}
                        </div>
                      ) : (
                        <input
                          type="text" value={(fin as unknown as Record<string,string>)[row.fKey]}
                          onChange={e => patchFin({ [row.fKey]: e.target.value })}
                          placeholder="0"
                          className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      )}
                    </td>
                    <td className="py-2">
                      {row.isComputed ? (
                        <div className="w-full bg-emerald-50 border border-emerald-200 rounded px-2 py-1.5 text-sm text-right font-semibold text-emerald-700">
                          {fmtVal((fin as unknown as Record<string,string>)[row.prevKey])}
                        </div>
                      ) : (
                        <input
                          type="text" value={(fin as unknown as Record<string,string>)[row.prevKey]}
                          onChange={e => patchFin({ [row.prevKey]: e.target.value })}
                          placeholder="0"
                          className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
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
              {BS_ROWS.map(row => {
                const fmtVal = (v: string) => { const n = parseFloat(v); return isNaN(n) ? "0" : n.toLocaleString("en-IN"); };
                return (
                  <tr key={row.fKey} className={row.isComputed ? "bg-blue-50/60" : ""}>
                    <td className="py-2 pr-3">
                      <span className={`text-sm font-medium ${row.isComputed ? "text-blue-800" : "text-slate-700"}`}>{row.label}</span>
                      {row.isComputed && row.formula && (
                        <div className="text-[10px] text-blue-600 mt-0.5">= {row.formula}</div>
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      {row.isComputed ? (
                        <div className="w-full bg-blue-100 border border-blue-300 rounded px-2 py-1.5 text-sm text-right font-semibold text-blue-900">
                          {fmtVal((fin as unknown as Record<string,string>)[row.fKey])}
                        </div>
                      ) : (
                        <input
                          type="text" value={(fin as unknown as Record<string,string>)[row.fKey]}
                          onChange={e => patchFin({ [row.fKey]: e.target.value })}
                          placeholder="0"
                          className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      )}
                    </td>
                    <td className="py-2">
                      {row.isComputed ? (
                        <div className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1.5 text-sm text-right font-semibold text-blue-700">
                          {fmtVal((fin as unknown as Record<string,string>)[row.prevKey])}
                        </div>
                      ) : (
                        <input
                          type="text" value={(fin as unknown as Record<string,string>)[row.prevKey]}
                          onChange={e => patchFin({ [row.prevKey]: e.target.value })}
                          placeholder="0"
                          className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
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

        <SectionCard title="Accounting Policies — Notes on Accounts" color="blue">
          <p className="text-xs text-slate-500 mb-4">These settings control the accounting policy text that appears in Notes to Financial Statements.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Depreciation Method */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Depreciation Method</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="depMethod" checked={(data.depreciationMethod || "wdv") === "wdv"}
                    onChange={() => patch({ depreciationMethod: "wdv" })} className="accent-emerald-600" />
                  WDV — Written Down Value
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="depMethod" checked={data.depreciationMethod === "slm"}
                    onChange={() => patch({ depreciationMethod: "slm" })} className="accent-emerald-600" />
                  SLM — Straight Line Method
                </label>
              </div>
            </div>
            {/* Inventory Method */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Inventory Valuation Method</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="invMethod" checked={(data.inventoryMethod || "fifo") === "fifo"}
                    onChange={() => patch({ inventoryMethod: "fifo" })} className="accent-emerald-600" />
                  FIFO — First In First Out
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="invMethod" checked={data.inventoryMethod === "weighted_avg"}
                    onChange={() => patch({ inventoryMethod: "weighted_avg" })} className="accent-emerald-600" />
                  Weighted Average Method
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="invMethod" checked={data.inventoryMethod === "na"}
                    onChange={() => patch({ inventoryMethod: "na" })} className="accent-emerald-600" />
                  Not Applicable (no inventory)
                </label>
              </div>
            </div>
            {/* Udyam Registration */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Udyam / MSME Registration</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="udyam" checked={!data.hasUdyamRegistration}
                    onChange={() => patch({ hasUdyamRegistration: false })} className="accent-emerald-600" />
                  Not registered
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="udyam" checked={!!data.hasUdyamRegistration}
                    onChange={() => patch({ hasUdyamRegistration: true })} className="accent-emerald-600" />
                  Udyam Registration obtained
                </label>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Director Remuneration — Note (p)
            </label>
            <p className="text-xs text-slate-400 mb-2">Leave blank if NIL. For OPC enter sole director salary; for Private/Section8/FPC enter MD / WTD remuneration if any.</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label={`FY ${data.financialYear} (₹)`} value={data.directorRemunerationCurrent || ""} onChange={v => patch({ directorRemunerationCurrent: v })} placeholder="Leave blank if NIL" />
              <Field label="Previous Year (₹)" value={data.directorRemunerationPrev || ""} onChange={v => patch({ directorRemunerationPrev: v })} placeholder="Leave blank if NIL" />
            </div>
          </div>
        </SectionCard>
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STEP 4 — Board & Compliance
  // ══════════════════════════════════════════════════════════════════════
  function renderStep4() {
    // ── FY boundary calculations ──────────────────────────────────────
    const fyStartYear = data.financialYear.split("-")[0];           // "2024"
    const fyEndFull   = "20" + data.financialYear.split("-")[1];    // "2025"
    const fyStart     = `${fyStartYear}-04-01`;                     // "2024-04-01"
    const fyEnd       = `${fyEndFull}-03-31`;                       // "2025-03-31"

    // 15-month first-year exception (Sec. 2(41)):
    // If incorporated on/after Jan 1 of FY start year → it's first FY, allow from incorporation date
    const incDate    = data.incorporationDate || "";
    const isFirstYear = incDate >= `${fyStartYear}-01-01` && incDate <= fyEnd;
    // Effective min date for meeting input
    const effectiveMin = isFirstYear && incDate ? incDate : fyStart;

    // ── Board Meeting Helpers ──────────────────────────────────────────
    function addDays(dateStr: string, days: number): string {
      const d = new Date(dateStr + "T00:00:00");
      d.setDate(d.getDate() + days);
      return d.toISOString().split("T")[0];
    }

    function clampDate(date: string, min: string, max: string): string {
      if (date < min) return min;
      if (date > max) return max;
      return date;
    }

    function getEligible(meetingDate: string): DirectorRecord[] {
      if (!data.directors?.length) return [];
      if (!meetingDate) return data.directors;
      return data.directors.filter(d => {
        if (d.dateOfAppointment && d.dateOfAppointment > meetingDate) return false;
        if (d.dateOfCessation && d.dateOfCessation < meetingDate) return false;
        return true;
      });
    }

    function daysBetween(d1: string, d2: string): number {
      if (!d1 || !d2) return 0;
      return Math.round((new Date(d2).getTime() - new Date(d1).getTime()) / 86400000);
    }

    function quorumRequired(n: number): number {
      return Math.max(Math.ceil(n / 3), 2);
    }

    function removeMeeting(idx: number) {
      patch({ boardMeetings: (data.boardMeetings || []).filter((_, i) => i !== idx).map((m, i) => ({ ...m, serialNo: i + 1 })) });
    }

    function updateMeetingDate(idx: number, date: string) {
      const meetings    = [...(data.boardMeetings || [])];
      const eligible    = getEligible(date);
      const eligibleSet = new Set(eligible.map(d => d.name));
      const prev        = meetings[idx].directorsPresent;
      const stillIn     = prev.filter(n => eligibleSet.has(n));
      const newOnes     = eligible.filter(d => !prev.includes(d.name)).map(d => d.name);
      meetings[idx] = { ...meetings[idx], date, directorsPresent: [...stillIn, ...newOnes], dateConfirmed: false };
      patch({ boardMeetings: meetings });
    }

    function toggleDirector(meetingIdx: number, dirName: string, checked: boolean) {
      const meetings = [...(data.boardMeetings || [])];
      const m = meetings[meetingIdx];
      meetings[meetingIdx] = { ...m, directorsPresent: checked ? [...m.directorsPresent, dirName] : m.directorsPresent.filter(n => n !== dirName) };
      patch({ boardMeetings: meetings });
    }

    function markAllPresent(meetingIdx: number) {
      const meetings = [...(data.boardMeetings || [])];
      const m = meetings[meetingIdx];
      meetings[meetingIdx] = { ...m, directorsPresent: getEligible(m.date).map(d => d.name) };
      patch({ boardMeetings: meetings });
    }

    function addBlankMeeting() {
      patch({ boardMeetings: [...(data.boardMeetings || []), { serialNo: (data.boardMeetings?.length || 0) + 1, date: "", directorsPresent: [] }] });
    }

    // Smart auto-suggest:
    // – First year: start from effective incorporation date
    // – Non-first year with prevFYLastMeetingDate: place first meeting within 120 days of that
    // – Non-first year without prevFYLastMeetingDate: prompt user to fill it first
    function suggestMeetings() {
      const isOPCSmall = data.companyType === "opc" || data.companyType === "private_small";
      const minCount   = isOPCSmall ? 2 : 4;

      // Compute start anchor
      let anchor = isFirstYear ? effectiveMin : fyStart;

      if (!isFirstYear && data.prevFYLastMeetingDate) {
        // First meeting must be within 120 days of previous last meeting
        const latest   = addDays(data.prevFYLastMeetingDate, 110); // 10-day buffer
        const earliest = addDays(data.prevFYLastMeetingDate, 20);
        anchor = clampDate(earliest, fyStart, latest < fyEnd ? latest : fyEnd);
      } else if (!isFirstYear && !data.prevFYLastMeetingDate) {
        // Can't compute smart dates without prev date — user should fill it
        alert("Please enter the Last Board Meeting Date of the previous financial year first for smart date suggestion.");
        return;
      }

      // Generate minimum required dates
      let dates: string[] = [];
      if (isOPCSmall) {
        // One meeting per half of FY (H1: Apr–Sep, H2: Oct–Mar)
        const h1Max = `${fyStartYear}-09-30`;
        const h2Max = fyEnd;
        const h1    = clampDate(anchor, effectiveMin, h1Max);
        const h2    = clampDate(addDays(h1, 90), `${fyStartYear}-10-01`, h2Max);
        dates = [h1, h2];
      } else {
        // 4 meetings at ~90-day intervals, all within FY
        const step = Math.min(90, Math.floor(daysBetween(anchor, fyEnd) / (minCount - 1)));
        let cur = anchor;
        for (let i = 0; i < minCount; i++) {
          dates.push(clampDate(cur, effectiveMin, fyEnd));
          cur = addDays(cur, Math.max(step, 30));
        }
      }

      // Always add one mandatory Pre-AGM Board Meeting slot (separate from min count)
      // This meeting approves fin. statements & calls AGM — must be before Sep 30
      const agmBoardDate = clampDate(`${fyStartYear}-08-15`, effectiveMin, `${fyStartYear}-09-29`);

      const regularMeetings: BoardMeeting[] = dates.map((date, i) => ({
        serialNo:         i + 1,
        date,
        directorsPresent: getEligible(date).map(d => d.name),
        meetingType:      "regular" as const,
      }));

      const agmBoardMeeting: BoardMeeting = {
        serialNo:         regularMeetings.length + 1,
        date:             agmBoardDate,
        directorsPresent: getEligible(agmBoardDate).map(d => d.name),
        meetingType:      "agm_board" as const,
        purpose:          "Approval of Financial Statements, Directors' Report and Notice for Annual General Meeting",
      };

      patch({ boardMeetings: [...regularMeetings, agmBoardMeeting] });
    }

    const minMeetings  = (data.companyType === "opc" || data.companyType === "private_small") ? 2 : 4;
    const meetingCount = data.boardMeetings?.length || 0;
    const meetings     = data.boardMeetings || [];
    const sortedDates  = meetings.map(m => m.date).filter(Boolean).sort();

    // Gap check: prevFY last meeting → first meeting of this FY
    const prevToFirstGap = data.prevFYLastMeetingDate && sortedDates[0]
      ? daysBetween(data.prevFYLastMeetingDate, sortedDates[0])
      : null;

    return (
      <>
        <SectionCard title={`Board Meetings — FY ${data.financialYear}`} color="emerald">

          {/* ── First-year banner ── */}
          {isFirstYear && (
            <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800">
              <strong>First Financial Year detected</strong> (incorporated {incDate}).
              {incDate < fyStart
                ? ` 15-month FY applies (Sec. 2(41)) — meetings allowed from ${incDate}.`
                : ` Normal first FY — meetings allowed from incorporation date (${incDate}).`}
            </div>
          )}

          {/* ── Previous FY last meeting (non-first-year) ── */}
          {!isFirstYear && (
            <div className={`mb-4 p-3 rounded-lg border ${
              !data.prevFYLastMeetingDate
                ? "bg-amber-50 border-amber-300"
                : !data.prevFYLastMeetingDateConfirmed
                  ? "bg-red-50 border-red-400"
                  : "bg-emerald-50 border-emerald-200"
            }`}>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Last Board Meeting Date of Previous FY (FY {`${Number(fyStartYear)-1}-${fyStartYear.slice(2)}`})
                <span className="text-red-500 ml-1">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Required to verify the 120-day gap rule (Sec. 173) between last meeting of prev FY and first meeting of this FY, and for smart date auto-suggestion.
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="date"
                  value={data.prevFYLastMeetingDate || ""}
                  onChange={e => patch({ prevFYLastMeetingDate: e.target.value, prevFYLastMeetingDateConfirmed: false })}
                  max={fyStart}
                  className={`border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    data.prevFYLastMeetingDate && !data.prevFYLastMeetingDateConfirmed
                      ? "border-red-400 bg-red-50"
                      : "border-slate-300"
                  }`}
                />
                {data.prevFYLastMeetingDate && !data.prevFYLastMeetingDateConfirmed && (
                  <button
                    onClick={() => patch({ prevFYLastMeetingDateConfirmed: true })}
                    className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
                  >
                    ✓ Confirm Date
                  </button>
                )}
                {data.prevFYLastMeetingDate && data.prevFYLastMeetingDateConfirmed && (
                  <span className="text-xs text-emerald-700 font-semibold">✓ Confirmed</span>
                )}
              </div>
              {!data.prevFYLastMeetingDate && (
                <p className="text-xs text-amber-700 mt-1 font-semibold">⚠ Fill this date for smart auto-suggestion and complete gap validation.</p>
              )}
              {data.prevFYLastMeetingDate && !data.prevFYLastMeetingDateConfirmed && (
                <p className="text-xs text-red-700 mt-1 font-semibold">⚠ Auto-filled from MCA last AGM date. Please verify and confirm.</p>
              )}
              {/* Gap from prev FY last meeting to first meeting of this FY */}
              {prevToFirstGap !== null && (
                <p className={`text-xs mt-2 font-semibold ${prevToFirstGap <= 120 ? "text-emerald-700" : "text-red-700"}`}>
                  Gap from prev FY last meeting → Meeting 1: {prevToFirstGap} days {prevToFirstGap <= 120 ? "✓" : "⚠ EXCEEDS 120 DAYS!"}
                </p>
              )}
            </div>
          )}

          {/* ── Header: count badge + suggest button ── */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                meetingCount >= minMeetings ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}>
                {meetingCount}/{minMeetings} meetings {meetingCount >= minMeetings ? "✓" : "required"}
              </span>
              <span className="text-xs text-slate-400">
                {data.companyType === "opc" || data.companyType === "private_small"
                  ? "Min. 2 meetings/year — one per half-year (Sec. 173)"
                  : "Min. 4 meetings/year, gap ≤ 120 days (Sec. 173)"}
              </span>
            </div>
            <button
              onClick={suggestMeetings}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              ⚡ Auto-suggest Dates
            </button>
          </div>

          {/* ── Inter-meeting gap summary ── */}
          {sortedDates.length >= 2 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {sortedDates.slice(1).map((d, i) => {
                const gap = daysBetween(sortedDates[i], d);
                const ok  = gap <= 120;
                return (
                  <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                    ok ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                       : "bg-red-50 text-red-700 border-red-300"
                  }`}>
                    M{i + 1}→M{i + 2}: {gap}d {ok ? "✓" : "⚠ >120!"}
                  </span>
                );
              })}
            </div>
          )}

          {/* ── Reminder: missing Pre-AGM Board Meeting ── */}
          {!isFirstYear && meetings.length > 0 && !meetings.some(m => m.meetingType === "agm_board") && (
            <div className="mb-4 p-3 rounded-lg border border-amber-400 bg-amber-50 text-xs text-amber-800 font-semibold">
              ⚠ Please add the Pre-AGM Board Meeting — the board meeting held before the previous year&apos;s AGM (usually August–September) to approve Financial Statements, Directors&apos; Report and issue the AGM Notice. Use &ldquo;Auto-suggest Dates&rdquo; or add it manually using the &ldquo;+ Add Meeting&rdquo; button and select type &ldquo;Pre-AGM Board Meeting&rdquo;.
            </div>
          )}

          {/* ── Meeting cards ── */}
          {meetings.map((m, i) => {
            const eligible     = getEligible(m.date);
            const presentCount = m.directorsPresent.length;
            const quorum       = quorumRequired(eligible.length);
            const quorumMet    = presentCount >= quorum;
            const hasDirectors = (data.directors?.length || 0) > 0;
            const isAGMBoard   = m.meetingType === "agm_board";
            const dateOk       = !m.date || (m.date >= effectiveMin && m.date <= fyEnd);
            const dateTooEarly = m.date && m.date < effectiveMin;
            const dateTooLate  = m.date && m.date > fyEnd;

            const updateType = (t: BoardMeeting["meetingType"]) => {
              const ms = [...meetings]; ms[i] = { ...ms[i], meetingType: t }; patch({ boardMeetings: ms });
            };
            const updatePurpose = (p: string) => {
              const ms = [...meetings]; ms[i] = { ...ms[i], purpose: p }; patch({ boardMeetings: ms });
            };

            return (
              <div key={i} className={`mb-4 bg-white rounded-xl overflow-hidden border ${
                isAGMBoard ? "border-amber-400" : dateOk ? "border-slate-200" : "border-red-400"
              }`}>
                {/* Card header */}
                <div className={`flex items-center justify-between px-4 py-2.5 border-b ${
                  isAGMBoard ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Meeting {i + 1}</span>
                    {isAGMBoard && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 font-semibold">
                        Pre-AGM Board Meeting ★
                      </span>
                    )}
                    <select
                      value={m.meetingType || "regular"}
                      onChange={e => updateType(e.target.value as BoardMeeting["meetingType"])}
                      className="text-xs border border-slate-200 rounded px-1.5 py-0.5 bg-white text-slate-600 focus:outline-none"
                    >
                      <option value="regular">Regular</option>
                      <option value="agm_board">Pre-AGM Board Meeting</option>
                      <option value="extraordinary">Extraordinary</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.date && hasDirectors && (
                      <>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${quorumMet ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                          Quorum: {presentCount}/{quorum} {quorumMet ? "✓" : "✗"}
                        </span>
                        <button onClick={() => markAllPresent(i)} className="text-xs text-emerald-600 font-semibold hover:text-emerald-800 border border-emerald-300 rounded px-2 py-0.5">
                          All Present
                        </button>
                      </>
                    )}
                    <button onClick={() => removeMeeting(i)} className="text-red-400 hover:text-red-600 ml-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>

                {/* Card body */}
                <div className="px-4 py-3">
                  {isAGMBoard && (
                    <div className="mb-3 p-2 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800">
                      This meeting must be held before the AGM to approve Financial Statements, Directors&apos; Report and issue AGM Notice. Must be held before 30 September {fyStartYear}.
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">
                        Meeting Date <span className="text-slate-400">(allowed: {effectiveMin} → {fyEnd})</span>
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="date"
                          value={m.date}
                          min={effectiveMin}
                          max={isAGMBoard ? `${fyStartYear}-09-29` : fyEnd}
                          onChange={e => updateMeetingDate(i, e.target.value)}
                          className={`border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 flex-1 min-w-0 ${
                            m.date && !dateOk
                              ? "border-red-400 bg-red-50"
                              : isAGMBoard && m.date && !m.dateConfirmed
                                ? "border-red-400 bg-red-50"
                                : "border-slate-300"
                          }`}
                        />
                        {isAGMBoard && m.date && !m.dateConfirmed && (
                          <button
                            onClick={() => {
                              const ms = [...meetings]; ms[i] = { ...ms[i], dateConfirmed: true }; patch({ boardMeetings: ms });
                            }}
                            className="text-xs px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 whitespace-nowrap"
                          >
                            ✓ Confirm
                          </button>
                        )}
                        {isAGMBoard && m.date && m.dateConfirmed && (
                          <span className="text-xs text-emerald-700 font-semibold whitespace-nowrap">✓ Confirmed</span>
                        )}
                      </div>
                      {isAGMBoard && m.date && !m.dateConfirmed && (
                        <p className="text-xs text-red-700 mt-1 font-semibold">⚠ Auto-suggested date — please verify and confirm.</p>
                      )}
                      {dateTooEarly && <p className="text-xs text-red-600 mt-1">⚠ Before {isFirstYear ? "incorporation" : "FY start"} ({effectiveMin}).</p>}
                      {dateTooLate  && <p className="text-xs text-red-600 mt-1">⚠ After FY end ({fyEnd}).</p>}
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Purpose / Agenda (optional)</label>
                      <input
                        type="text"
                        value={m.purpose || ""}
                        onChange={e => updatePurpose(e.target.value)}
                        placeholder={isAGMBoard ? "Approval of Fin. Statements & Notice for AGM" : "e.g. Business review, policy approvals"}
                        className="border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full"
                      />
                    </div>
                  </div>

                  {/* Director checkboxes */}
                  {hasDirectors ? (
                    m.date ? (
                      eligible.length > 0 ? (
                        <div>
                          <p className="text-xs text-slate-500 mb-2">Directors Present ({presentCount}/{eligible.length}):</p>
                          <div className="flex flex-wrap gap-2">
                            {eligible.map((d, di) => {
                              const isPresent = m.directorsPresent.includes(d.name);
                              return (
                                <label key={di} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs cursor-pointer border transition-colors ${
                                  isPresent ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-500"
                                }`}>
                                  <input type="checkbox" checked={isPresent} onChange={e => toggleDirector(i, d.name, e.target.checked)} className="accent-emerald-600" />
                                  {d.name}
                                  <span className="text-slate-400">({d.designation})</span>
                                </label>
                              );
                            })}
                          </div>
                          {eligible.length < (data.directors?.length || 0) && (
                            <p className="text-xs text-slate-400 mt-2 italic">{(data.directors?.length || 0) - eligible.length} director(s) not yet appointed on this date — excluded.</p>
                          )}
                        </div>
                      ) : <p className="text-xs text-amber-600">No directors appointed on or before this date.</p>
                    ) : <p className="text-xs text-slate-400 italic">Select meeting date to see director attendance.</p>
                  ) : <p className="text-xs text-slate-400 italic">Add directors in Step 5 to enable attendance tracking.</p>}
                </div>
              </div>
            );
          })}

          <button onClick={addBlankMeeting} className="text-sm text-emerald-700 font-semibold flex items-center gap-1 hover:text-emerald-900">
            <span className="text-lg leading-none">+</span> Add Board Meeting
          </button>
        </SectionCard>

        {/* ══════════════ MEMBER MEETINGS (AGM / EGM) ══════════════ */}
        <SectionCard title="Member Meetings — AGM / EGM" color="blue">
          <p className="text-xs text-slate-500 mb-4">
            AGM must be held within 6 months of FY end i.e. by 30 September {fyStartYear} (Sec. 96).
            OPC is exempt from AGM (Sec. 96(1) proviso). EGM can be held any time.
          </p>
          {(data.memberMeetings || []).map((mm, i) => (
            <div key={mm.id} className="mb-3 p-4 bg-white border border-blue-200 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${mm.type === "agm" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                    {mm.type === "agm" ? "AGM" : "EGM"}
                  </span>
                  <select
                    value={mm.type}
                    onChange={e => {
                      const ms = [...(data.memberMeetings || [])]; ms[i] = { ...ms[i], type: e.target.value as "agm" | "egm" }; patch({ memberMeetings: ms });
                    }}
                    className="text-xs border border-slate-200 rounded px-1.5 py-0.5 bg-white text-slate-600 focus:outline-none"
                  >
                    <option value="agm">AGM — Annual General Meeting</option>
                    <option value="egm">EGM — Extraordinary General Meeting</option>
                  </select>
                </div>
                <button onClick={() => patch({ memberMeetings: (data.memberMeetings || []).filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">
                    {mm.type === "agm" ? `AGM Date (must be ≤ 30 Sep ${fyStartYear})` : "EGM Date"}
                  </label>
                  <input
                    type="date"
                    value={mm.date}
                    max={mm.type === "agm" ? `${fyStartYear}-09-30` : undefined}
                    onChange={e => { const ms = [...(data.memberMeetings || [])]; ms[i] = { ...ms[i], date: e.target.value }; patch({ memberMeetings: ms }); }}
                    className="border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                  />
                  {mm.type === "agm" && mm.date > `${fyStartYear}-09-30` && (
                    <p className="text-xs text-red-600 mt-1">⚠ AGM must be held by 30 Sep {fyStartYear}.</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Venue</label>
                  <input
                    type="text"
                    value={mm.venue || ""}
                    onChange={e => { const ms = [...(data.memberMeetings || [])]; ms[i] = { ...ms[i], venue: e.target.value }; patch({ memberMeetings: ms }); }}
                    placeholder="Registered Office / Virtual"
                    className="border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                  />
                </div>
                {mm.type === "egm" && (
                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-500 block mb-1">Purpose / Business Transacted</label>
                    <input
                      type="text"
                      value={mm.purpose || ""}
                      onChange={e => { const ms = [...(data.memberMeetings || [])]; ms[i] = { ...ms[i], purpose: e.target.value }; patch({ memberMeetings: ms }); }}
                      placeholder="e.g. Approval of related party transaction, Issue of shares"
                      className="border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          <button
            onClick={() => patch({ memberMeetings: [...(data.memberMeetings || []), { id: crypto.randomUUID(), type: "agm", date: "", venue: "" }] })}
            className="text-sm text-blue-700 font-semibold flex items-center gap-1 hover:text-blue-900"
          >
            <span className="text-lg leading-none">+</span> Add AGM / EGM
          </button>
        </SectionCard>

        {/* ══════════════ COMMITTEE MEETINGS ══════════════ */}
        <SectionCard title="Committee Meetings" color="slate">
          <p className="text-xs text-slate-500 mb-4">Add meetings of Board Committees (Audit, NRC, SRC, CSR etc.) held during FY {data.financialYear}.</p>
          {(data.committeeMeetings || []).map((cm, i) => {
            const eligible = getEligible(cm.date);
            return (
              <div key={cm.id} className="mb-3 p-4 bg-white border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-600">Committee Meeting {i + 1}</span>
                  <button onClick={() => patch({ committeeMeetings: (data.committeeMeetings || []).filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Committee Name</label>
                    <select
                      value={cm.committeeName}
                      onChange={e => { const cs = [...(data.committeeMeetings || [])]; cs[i] = { ...cs[i], committeeName: e.target.value }; patch({ committeeMeetings: cs }); }}
                      className="border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500 bg-white w-full"
                    >
                      <option value="Audit Committee">Audit Committee</option>
                      <option value="Nomination & Remuneration Committee">Nomination &amp; Remuneration Committee (NRC)</option>
                      <option value="Stakeholders Relationship Committee">Stakeholders Relationship Committee (SRC)</option>
                      <option value="CSR Committee">CSR Committee</option>
                      <option value="Risk Management Committee">Risk Management Committee</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Meeting Date</label>
                    <input
                      type="date"
                      value={cm.date}
                      min={effectiveMin}
                      max={fyEnd}
                      onChange={e => { const cs = [...(data.committeeMeetings || [])]; cs[i] = { ...cs[i], date: e.target.value }; patch({ committeeMeetings: cs }); }}
                      className="border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500 w-full"
                    />
                  </div>
                </div>
                {/* Committee member checkboxes */}
                {cm.date && eligible.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Members Present ({cm.membersPresent.length}/{eligible.length}):</p>
                    <div className="flex flex-wrap gap-2">
                      {eligible.map((d, di) => {
                        const isPresent = cm.membersPresent.includes(d.name);
                        return (
                          <label key={di} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs cursor-pointer border transition-colors ${
                            isPresent ? "bg-slate-100 border-slate-400 text-slate-800" : "bg-white border-slate-200 text-slate-400"
                          }`}>
                            <input
                              type="checkbox"
                              checked={isPresent}
                              onChange={e => {
                                const cs = [...(data.committeeMeetings || [])];
                                cs[i] = { ...cs[i], membersPresent: e.target.checked ? [...cm.membersPresent, d.name] : cm.membersPresent.filter(n => n !== d.name) };
                                patch({ committeeMeetings: cs });
                              }}
                            />
                            {d.name} <span className="text-slate-400">({d.designation})</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
                {!cm.date && <p className="text-xs text-slate-400 italic">Select meeting date to see member checkboxes.</p>}
              </div>
            );
          })}
          <button
            onClick={() => patch({ committeeMeetings: [...(data.committeeMeetings || []), { id: crypto.randomUUID(), committeeName: "Audit Committee", date: "", membersPresent: [] }] })}
            className="text-sm text-slate-700 font-semibold flex items-center gap-1 hover:text-slate-900"
          >
            <span className="text-lg leading-none">+</span> Add Committee Meeting
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
            <Field label="Material Changes Details" value={data.materialChangesDetails || ""} onChange={v => patch({ materialChangesDetails: v })} placeholder={`Details of material changes after 31 March ${fyEndYr}...`} />
          )}
          <Toggle label="Significant Orders by Regulators / Courts / Tribunals" value={data.significantOrders} onChange={v => patch({ significantOrders: v })} />
          {data.significantOrders && (
            <Field label="Order Details" value={data.significantOrdersDetails || ""} onChange={v => patch({ significantOrdersDetails: v })} placeholder="Details of significant orders..." />
          )}

          {/* Dividend — used in Board Report + Audit Report Rule 11(v) */}
          <div className="mt-2 pt-3 border-t border-slate-100">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Dividend [Sec. 134(3)(k) + Audit Report Rule 11(v)]
            </label>
            <div className="flex gap-6 mb-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="dividend"
                  checked={!data.dividendDeclared}
                  onChange={() => patch({ dividendDeclared: false, dividendDetails: "" })}
                  className="accent-emerald-600"
                />
                No dividend declared / paid
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="dividend"
                  checked={!!data.dividendDeclared}
                  onChange={() => patch({ dividendDeclared: true })}
                  className="accent-emerald-600"
                />
                Dividend was declared / paid
              </label>
            </div>
            {data.dividendDeclared && (
              <input
                value={data.dividendDetails || ""}
                onChange={e => patch({ dividendDetails: e.target.value })}
                placeholder="e.g. ₹2 per share (Final Dividend)"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            )}
            <p className="text-xs text-slate-400 mt-1">This affects both the Board Report (Section 2) and the Audit Report (Rule 11(v)).</p>
          </div>
        </SectionCard>

        {/* Employee Count */}
        <SectionCard title="Employee Count — Gender-wise [Sec. 197(12)]" color="slate">
          <p className="text-xs text-slate-500 mb-3">As on 31st March {data.financialYear?.split("-")[1] ? "20" + data.financialYear.split("-")[1] : ""}. Required in the Board Report under Section 197(12).</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Male</label>
              <input type="number" min="0"
                value={data.employeesMale ?? ""}
                onChange={e => patch({ employeesMale: e.target.value === "" ? undefined : parseInt(e.target.value) })}
                placeholder="0"
                className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Female</label>
              <input type="number" min="0"
                value={data.employeesFemale ?? ""}
                onChange={e => patch({ employeesFemale: e.target.value === "" ? undefined : parseInt(e.target.value) })}
                placeholder="0"
                className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Transgender / Other</label>
              <input type="number" min="0"
                value={data.employeesOther ?? ""}
                onChange={e => patch({ employeesOther: e.target.value === "" ? undefined : parseInt(e.target.value) })}
                placeholder="0"
                className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          {(data.employeesMale != null || data.employeesFemale != null || data.employeesOther != null) && (
            <p className="text-xs text-slate-500 mt-2">
              Total: <strong>{(data.employeesMale || 0) + (data.employeesFemale || 0) + (data.employeesOther || 0)}</strong> employees
            </p>
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

        <SectionCard title="MGT-7/7A — CTC Board Resolution Details" color="slate">
          <p className="text-xs text-slate-500 mb-4">Details for the &quot;Extract of Resolution&quot; CTC document (Rule 9, Sec. 89 &amp; 90 — Appointment of Designated Person). Meeting date is taken from Date of Report (Step 1).</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Field
              label="Meeting Time"
              value={data.mgt7MeetingTime || ""}
              onChange={v => patch({ mgt7MeetingTime: v })}
              placeholder="11.00 A.M."
              hint="Time at which the board meeting was held"
            />
            <Field
              label="Meeting Venue"
              value={data.mgt7MeetingVenue || ""}
              onChange={v => patch({ mgt7MeetingVenue: v })}
              placeholder="Registered Office of the Company"
              hint="Leave blank to use 'Registered Office of the Company'"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">Designated persons are auto-filled from Signatory Directors (Step 5).</p>
        </SectionCard>
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
        <SectionCard title={`Directors as on 31st March ${fyEndYr}`} color="emerald">
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
                  <select value={d.designation} onChange={e => updateDir(i, { designation: e.target.value })} className={inp + " bg-white"}
                    onBlur={() => companyId && saveDirectorKYC(d)}>
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
                  <select value={d.category} onChange={e => updateDir(i, { category: e.target.value })} className={inp + " bg-white"}
                    onBlur={() => companyId && saveDirectorKYC(d)}>
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
                  <input type="number" min="0" value={d.sharesHeld ?? ""} onChange={e => updateDir(i, { sharesHeld: e.target.value ? parseInt(e.target.value) : undefined })} placeholder="0" className={inp}
                    onBlur={() => companyId && saveDirectorKYC(d)} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-0.5">Date of Appointment</label>
                  <input type="date" value={d.dateOfAppointment} onChange={e => updateDir(i, { dateOfAppointment: e.target.value })} className={inp}
                    onBlur={() => companyId && saveDirectorKYC(d)} />
                </div>
                {d.changedDuringYear && (
                  <div>
                    <label className="text-xs text-slate-400 block mb-0.5">Change Type</label>
                    <select
                      value={d.changeType || (!d.isActive ? "ceased" : "appointed")}
                      onChange={e => {
                        const ct = e.target.value as "appointed" | "resigned" | "ceased";
                        updateDir(i, {
                          changeType: ct,
                          isActive: ct === "appointed" ? true : ct === "resigned" || ct === "ceased" ? false : d.isActive,
                        });
                      }}
                      className={inp + " bg-white"}
                    >
                      <option value="appointed">Appointed</option>
                      <option value="resigned">Resigned</option>
                      <option value="ceased">Ceased</option>
                    </select>
                  </div>
                )}
                {d.changedDuringYear && (d.changeType === "resigned" || d.changeType === "ceased" || !d.isActive) && (
                  <div>
                    <label className="text-xs text-slate-400 block mb-0.5">Date of Cessation</label>
                    <input type="date" value={d.dateOfCessation || ""} onChange={e => updateDir(i, { dateOfCessation: e.target.value })} className={inp} />
                  </div>
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
          <p className="text-xs text-slate-500 mb-4">
            Select directors who will sign the Board Report and documents. Signatures will appear in all generated PDFs and are saved for future years.
          </p>

          {(() => {
            // Sort directors by designation hierarchy for dropdown
            const HIER: Record<string, number> = {
              "Managing Director": 1, "Whole Time Director": 2, "Executive Director": 2,
              "Chairman": 3, "Director": 4, "Independent Director": 5, "Nominee Director": 6,
            };
            const sortedDirs = [...(data.directors || [])]
              .filter(d => d.isActive && d.name)
              .sort((a, b) => (HIER[a.designation] || 9) - (HIER[b.designation] || 9));

            function selectSignatory(slot: "director1" | "director2" | "director3", name: string) {
              if (!name) {
                if (slot === "director1") patch({ signatoryDirectors: { ...data.signatoryDirectors, director1: { name: "", din: "", designation: "" } } });
                else patch({ signatoryDirectors: { ...data.signatoryDirectors, [slot]: undefined } });
                return;
              }
              const dir = data.directors.find(d => d.name === name);
              if (!dir) return;
              patch({ signatoryDirectors: { ...data.signatoryDirectors, [slot]: { name: dir.name, din: dir.din, designation: dir.designation, signatureBase64: dir.signatureBase64 } } });
            }

            function uploadSignature(slot: "director1" | "director2" | "director3", file: File) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const raw = e.target?.result as string;
                const base64 = raw.split(",")[1];
                const currentSig = data.signatoryDirectors[slot];
                if (!currentSig?.name) return;
                patch({ signatoryDirectors: { ...data.signatoryDirectors, [slot]: { ...currentSig, signatureBase64: base64 } } });
                const dirs = [...(data.directors || [])];
                const idx = dirs.findIndex(d => (currentSig.din && d.din === currentSig.din) || d.name.trim().toLowerCase() === currentSig.name.trim().toLowerCase());
                if (idx !== -1) {
                  const updated = { ...dirs[idx], signatureBase64: base64 };
                  dirs[idx] = updated;
                  patch({ directors: dirs });
                  if (companyId) void saveDirectorKYC(updated);
                }
              };
              reader.readAsDataURL(file);
            }

            const slots: Array<"director1" | "director2" | "director3"> = ["director1", "director2", "director3"];
            const slotLabels = ["Signatory 1 (Required)", "Signatory 2", "Signatory 3"];
            const activeSlots = slots.filter((s, i) => i === 0 || data.signatoryDirectors[s]);
            const showAddBtn = activeSlots.length < 3;

            return (
              <>
                <div className={`grid grid-cols-1 md:grid-cols-${activeSlots.length > 1 ? activeSlots.length : "2"} gap-4`}>
                  {activeSlots.map((slot, i) => {
                    const sig = data.signatoryDirectors[slot];
                    return (
                      <div key={slot} className="bg-white border border-blue-100 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-slate-600">{slotLabels[slots.indexOf(slot)]}</span>
                          {slot !== "director1" && (
                            <button onClick={() => patch({ signatoryDirectors: { ...data.signatoryDirectors, [slot]: undefined } })} className="text-red-400 hover:text-red-600 text-xs font-semibold">Remove</button>
                          )}
                        </div>

                        {/* Director dropdown */}
                        <select
                          value={sig?.name || ""}
                          onChange={e => selectSignatory(slot, e.target.value)}
                          className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                        >
                          <option value="">— Select Director —</option>
                          {sortedDirs.map(d => (
                            <option key={d.din || d.name} value={d.name}>
                              {d.name} — {d.designation}
                            </option>
                          ))}
                        </select>

                        {sig?.name && (
                          <>
                            <div className="text-xs text-slate-500 mb-3 space-y-0.5">
                              <p><span className="text-slate-400">DIN:</span> {sig.din || "—"}</p>
                              <p><span className="text-slate-400">Designation:</span> {sig.designation}</p>
                            </div>

                            {/* Signature upload / preview */}
                            {sig.signatureBase64 ? (
                              <div className="p-2 border border-emerald-200 rounded-lg bg-emerald-50">
                                <img
                                  src={`data:image/jpeg;base64,${sig.signatureBase64}`}
                                  alt="Signature"
                                  className="h-12 object-contain mb-1"
                                  style={{ maxWidth: "140px" }}
                                />
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-emerald-700 font-semibold">✓ Signature saved</span>
                                  <label className="text-xs text-blue-600 cursor-pointer hover:underline font-semibold">
                                    Change
                                    <input type="file" className="hidden" accept="image/jpeg,image/png,image/jpg" onChange={e => e.target.files?.[0] && uploadSignature(slot, e.target.files[0])} />
                                  </label>
                                </div>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center gap-1.5 cursor-pointer border-2 border-dashed border-slate-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs text-slate-500 font-semibold">Upload Signature</span>
                                <span className="text-xs text-slate-400">JPEG / PNG — saved to director record</span>
                                <input type="file" className="hidden" accept="image/jpeg,image/png,image/jpg" onChange={e => e.target.files?.[0] && uploadSignature(slot, e.target.files[0])} />
                              </label>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {showAddBtn && (
                  <button
                    onClick={() => {
                      const nextSlot = activeSlots.length === 1 ? "director2" : "director3";
                      patch({ signatoryDirectors: { ...data.signatoryDirectors, [nextSlot]: { name: "", din: "", designation: "" } } });
                    }}
                    className="mt-3 text-xs text-blue-700 font-semibold flex items-center gap-1 hover:text-blue-900"
                  >
                    <span className="text-lg leading-none">+</span> Add Another Signatory
                  </button>
                )}
              </>
            );
          })()}
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
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Total Shares <span className="text-red-500 ml-1">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-1">Total issued &amp; paid-up shares</p>
              {data.totalShares > 0 ? (
                <>
                  <div className="w-full bg-emerald-100 border border-emerald-300 rounded-lg px-3 py-2 text-sm text-right font-semibold text-emerald-900">
                    {data.totalShares.toLocaleString("en-IN")}
                  </div>
                  <p className="text-[10px] text-emerald-600 mt-1">= Paid-up Capital ÷ Nominal Value per Share</p>
                </>
              ) : (
                <input
                  type="text"
                  value={String(data.totalShares || "")}
                  onChange={e => patch({ totalShares: parseInt(e.target.value) || 0 })}
                  placeholder="10000"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>
          </div>
          {totalSharesHeld > 0 && (
            <div className={`text-xs p-2 rounded mt-2 ${totalSharesHeld === data.totalShares ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
              {totalSharesHeld === data.totalShares ? `✓ Shares tally: ${totalSharesHeld.toLocaleString("en-IN")} shares` : `⚠ Shares held (${totalSharesHeld.toLocaleString("en-IN")}) ≠ Total shares (${data.totalShares.toLocaleString("en-IN")})`}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Shareholders / Member Register" color="emerald">
          <p className="text-xs text-slate-500 mb-4">Add all shareholders as on 31st March {fyEndYr}. Required for MGT-7A/MGT-7 filing.</p>
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
            <p className="text-xs text-slate-500 mb-4">Add subsidiaries, associate companies, and joint ventures as on 31st March {fyEndYr} [Sec. 129(3)].</p>
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
                    ["Investments (₹)", "investments", "0"],
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
                  {(s.type === "associate" || s.type === "joint_venture") && (
                    <>
                      {[
                        ["Net Worth Attributable to Shareholding (₹)", "netWorthAttributable", "0"],
                        ["Profit / Loss Considered in Consolidation (₹)", "profitConsideredInConsolidation", "0"],
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
                    </>
                  )}
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
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 block mb-0.5">Board Approval Date</label>
                    <input type="date" value={t.boardApprovalDate || t.approvalDate || ""}
                      onChange={e => {
                        const txns = [...data.relatedPartyTransactions!];
                        txns[i] = { ...txns[i], approvalDate: e.target.value, boardApprovalDate: e.target.value };
                        patch({ relatedPartyTransactions: txns });
                      }}
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
                  </div>
                  {!t.isArmLength && (
                    <div className="col-span-2">
                      <label className="text-xs text-slate-400 block mb-0.5">Justification (for non-arm&apos;s length)</label>
                      <input type="text" value={t.justification || ""} placeholder="Reason for entering into this transaction"
                        onChange={e => {
                          const txns = [...data.relatedPartyTransactions!];
                          txns[i] = { ...txns[i], justification: e.target.value };
                          patch({ relatedPartyTransactions: txns });
                        }}
                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
                    </div>
                  )}
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
      { key: "director-list",     label: "Details of Directors",            icon: "👥", always: true },
      { key: "shareholder-list",  label: `List of Shareholders (31 March ${fyEndYr})`, icon: "🏛️", always: true },
      { key: "mgt7-ctc",          label: "MGT-7/7A CTC — Extract of Board Resolution (Rule 9 / Sec. 89 & 90)", icon: "📝", always: true },
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
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all flex-shrink-0"
                    title="Preview in browser tab"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    Preview
                  </button>
                  <button
                    onClick={() => handleDownloadPdf(a.key, a.label)}
                    disabled={pdfLoading[a.key]}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-wait text-white text-xs font-semibold rounded-lg transition-all flex-shrink-0"
                    title="Generate and download PDF"
                  >
                    {pdfLoading[a.key] ? (
                      <>
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                        Generating…
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download PDF
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3 text-center">
              <b>Download PDF</b> — generates a properly formatted PDF with running header &amp; signatures on every page.&nbsp;
              <b>Preview</b> — opens HTML in a new browser tab.
            </p>

            {session?.user && (
              <div className="mt-5 pt-4 border-t border-blue-100 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  {saveId
                    ? <span>Draft already saved. Update it with latest data?</span>
                    : <span>Save all form data to your account — reload and re-download anytime without re-entering.</span>
                  }
                  {savedMsg && (
                    <span className={`ml-2 font-semibold ${savedMsg.ok ? "text-emerald-600" : "text-red-500"}`}>
                      {savedMsg.ok ? "✓" : "✗"} {savedMsg.text}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving || !data.companyName}
                  className="flex-shrink-0 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                  {saving ? "Saving…" : saveId ? "Update Saved Draft" : "Save Draft"}
                </button>
              </div>
            )}
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
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">A</div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Annual Filing Attachments Generator</h1>
                <p className="text-sm text-slate-500">AOC-4 &amp; MGT-7/7A | OPC, Private, Section 8, FPC</p>
              </div>
            </div>
            {session?.user && (
              <a
                href="/dashboard/annual-filings"
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                My Filings
              </a>
            )}
          </div>

          {/* Save / login bar */}
          <div className="mt-4 p-3 bg-white border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500 flex items-center gap-2 min-w-0">
                {loadMsg
                  ? <span className="text-blue-600 animate-pulse">{loadMsg}</span>
                  : data.companyName
                    ? <span className="font-semibold text-slate-700 truncate">{data.companyName}</span>
                    : <span>No company selected</span>
                }
                {saveId && !loadMsg && <span className="text-emerald-600 flex-shrink-0">• Draft saved</span>}
              </div>
              {session?.user ? (
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  {(saveId || data.companyName) && (
                    <button
                      onClick={handleReset}
                      disabled={resetting}
                      className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40 text-xs font-semibold rounded-lg transition-colors"
                    >
                      {resetting ? "Resetting…" : "Reset"}
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving || !data.companyName}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    {saving ? "Saving…" : saveId ? "Update Draft" : "Save Draft"}
                  </button>
                </div>
              ) : (
                <a href="/auth/login" className="text-xs text-blue-600 hover:underline font-semibold flex-shrink-0 ml-3">Sign in to save drafts</a>
              )}
            </div>
            {savedMsg && (
              <p className={`mt-2 text-xs font-semibold ${savedMsg.ok ? "text-emerald-600" : "text-red-500"}`}>
                {savedMsg.ok ? "✓" : "✗"} {savedMsg.text}
              </p>
            )}
          </div>

          {/* Found draft banner */}
          {foundDraft && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
              <div className="text-xs text-slate-700 min-w-0">
                <span className="font-bold text-blue-700">Saved draft found</span>
                {" — "}{foundDraft.companyName} · FY {foundDraft.financialYear}
                <span className="text-slate-400 ml-1">
                  (last saved: {new Date(foundDraft.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })})
                </span>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(foundDraft.formDataJson) as { data: AnnualFilingData; auditOpts: AuditReportOptions };
                      setData(parsed.data);
                      setAuditOpts(parsed.auditOpts);
                      setSaveId(foundDraft.id);
                      setSaveIdFY(foundDraft.financialYear ?? null);
                      setFoundDraft(null);
                      setSavedMsg({ ok: true, text: "Draft loaded successfully" });
                      setTimeout(() => setSavedMsg(null), 4000);
                      // Re-load director signatures from csi_persons
                      if (companyId) void loadPersonsForCompany(companyId, parsed.data.directors);
                      // Re-load auditor signature from saved CA list (already in state)
                      if (parsed.data.auditor._savedCAId) {
                        const ca = savedCAs.find(c => c.id === parsed.data.auditor._savedCAId);
                        if (ca) {
                          setData(prev => ({
                            ...prev,
                            auditor: {
                              ...prev.auditor,
                              signatureBase64: ca.signatureBase64 || undefined,
                              sealBase64: ca.sealBase64 || undefined,
                            },
                          }));
                        }
                      }
                    } catch { setFoundDraft(null); }
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
                >
                  Load Draft
                </button>
                <button
                  onClick={() => setFoundDraft(null)}
                  className="px-3 py-1.5 border border-blue-200 text-blue-600 hover:bg-blue-100 text-xs font-semibold rounded-lg"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
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
