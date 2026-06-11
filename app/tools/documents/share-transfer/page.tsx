"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import CompanySearch from "@/components/CompanySearch";
import CompanyExcelUpload from "@/components/CompanyExcelUpload";
import type { CompanyData } from "@/lib/types/company";
import {
  generateSH4HTML,
  type TransferCompany,
  type Transferor,
  type Transferee,
  type TransferDetails,
  type TransferSigner,
} from "@/lib/share-transfer-html";
import {
  generateShareCertificateHTML,
  computeCertRanges,
} from "@/lib/share-certificate-html";

/* ══════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════ */
interface SavedShareholder {
  id: string;                // csi_shareholders.id
  personId: string;
  personName?: string;
  din?: string;
  panNo?: string;
  folioNumber?: string;
  certificateNumber?: string;
  numberOfShares?: number;
  distinctiveFrom?: number;
  distinctiveTo?: number;
  shareType?: string;
  nominalValue?: string;
  paidUpValue?: string;
  signingDirectorsJson?: string;
  holdingPercent?: string;
  transferStatus?: string;
}

interface F {
  // Step 1 — Company
  companyName: string;
  cin: string;
  regAddress: string;
  companyId: string;
  // Step 2 — Transferor
  transferorShareholderId: string;
  transferorPersonId: string;
  transferorName: string;
  transferorFolio: string;
  transferorCertNo: string;
  transferorTotalShares: number;
  transferorDistinctiveFrom: number;
  transferorDistinctiveTo: number;
  transferorPan: string;
  transferorAddress: string;
  shareType: string;
  nominalValue: string;
  paidUpValue: string;
  // Step 3 — Transfer details
  sharesToTransfer: number;
  transferDate: string;
  considerationPerShare: string;
  stampDuty: string;
  issuePlace: string;
  // Step 4 — Transferee
  transfereePersonId: string;
  transfereeName: string;
  transfereeFather: string;
  transfereeAddress: string;
  transfereePan: string;
  transfereeOccupation: string;
  // Step 5 — Signatories
  signers: TransferSigner[];
}

const DEFAULT: F = {
  companyName: "", cin: "", regAddress: "", companyId: "",
  transferorShareholderId: "", transferorPersonId: "", transferorName: "",
  transferorFolio: "", transferorCertNo: "", transferorTotalShares: 0,
  transferorDistinctiveFrom: 1, transferorDistinctiveTo: 0,
  transferorPan: "", transferorAddress: "",
  shareType: "Equity", nominalValue: "10", paidUpValue: "10",
  sharesToTransfer: 0, transferDate: new Date().toISOString().slice(0, 10),
  considerationPerShare: "", stampDuty: "", issuePlace: "",
  transfereePersonId: "", transfereeName: "", transfereeFather: "",
  transfereeAddress: "", transfereePan: "", transfereeOccupation: "",
  signers: [{ name: "", designation: "Director", din: "" }, { name: "", designation: "Director", din: "" }],
};

/* ══════════════════════════════════════════════════════════════════
   UI HELPERS
══════════════════════════════════════════════════════════════════ */
const INP = "w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white";
const SEL = "w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white";

function Lbl({ c, h }: { c: React.ReactNode; h?: string }) {
  return (
    <div className="mb-1">
      <p className="text-sm font-semibold text-slate-700">{c}</p>
      {h && <p className="text-xs text-slate-400">{h}</p>}
    </div>
  );
}

function SHead({ n, title, sub, color = "#047857" }: { n: number; title: string; sub: string; color?: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-1">
        <span className="w-8 h-8 rounded-full text-white flex items-center justify-center font-extrabold text-sm shrink-0"
          style={{ background: color }}>{n}</span>
        <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
      </div>
      <p className="text-slate-500 text-sm ml-11">{sub}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════ */
export default function ShareTransferPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const [step, setStep] = useState(1);
  const [f, setF] = useState<F>(DEFAULT);
  const [companyQuery, setCompanyQuery] = useState("");

  /* ── Restore from sessionStorage on mount (guest users) ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = sessionStorage.getItem("csi_temp_company");
    if (saved) {
      try {
        const data: CompanyData = JSON.parse(saved);
        if (data.companyName) {
          applyCompanyData(data);
          setCompanyQuery(data.companyName);
        }
      } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [savedShareholders, setSavedShareholders] = useState<SavedShareholder[]>([]);
  const [loadingSh, setLoadingSh] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ newFolioNo: string; newCertNo: string; transferId: string } | null>(null);

  const upd = (patch: Partial<F>) => setF(prev => ({ ...prev, ...patch }));

  /* computed */
  const remaining = f.transferorTotalShares - f.sharesToTransfer;
  const totalConsideration = f.considerationPerShare && f.sharesToTransfer
    ? (parseFloat(f.considerationPerShare) * f.sharesToTransfer).toFixed(2) : "";
  const transferDistFrom = f.transferorDistinctiveFrom;
  const transferDistTo   = f.transferorDistinctiveFrom + f.sharesToTransfer - 1;

  /* Load saved shareholders when company is selected */
  const loadShareholders = useCallback(async (companyId: string) => {
    if (!isLoggedIn || !companyId) return;
    setLoadingSh(true);
    const r = await fetch(`/api/shareholders?companyId=${companyId}`);
    const d = r.ok ? await r.json() : { shareholders: [] };
    // Filter only active (not fully transferred)
    setSavedShareholders(
      ((d.shareholders || []) as SavedShareholder[]).filter(
        sh => sh.transferStatus !== "transferred" && (sh.numberOfShares || 0) > 0
      )
    );
    setLoadingSh(false);
  }, [isLoggedIn]);

  /* Extract city from address */
  function extractCity(addr: string): string {
    if (!addr) return "";
    const parts = addr.split(",").map(s => s.trim()).filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (/^\d{6}$/.test(p) || /^india$/i.test(p) || /^\d/.test(p)) continue;
      return p;
    }
    return parts[0] || "";
  }

  /* Apply company data from Excel upload OR search */
  async function applyCompanyData(c: CompanyData) {
    // Auto-fill signers from active directors (top 2)
    const activeDirs = (c.directors || []).filter(d => d.isActive !== false);
    const autoSigners: TransferSigner[] = activeDirs
      .filter(d => d.name)
      .slice(0, 2)
      .map(d => ({ name: d.name, designation: d.designation || "Director", din: d.din || "" }));
    while (autoSigners.length < 2) autoSigners.push({ name: "", designation: "Director", din: "" });

    upd({
      companyName: c.companyName || "",
      cin:         c.cin         || "",
      regAddress:  c.regAddress  || "",
      companyId:   "",
      issuePlace:  extractCity(c.regAddress || ""),
      signers:     autoSigners,
    });

    // Find companyId in our DB (logged-in users)
    if (isLoggedIn && c.companyName) {
      const r = await fetch(`/api/clients/find?name=${encodeURIComponent(c.companyName)}`);
      const d = r.ok ? await r.json() : null;
      if (d?.id) {
        upd({ companyId: d.id });
        loadShareholders(d.id);
      }
    }
  }

  /* Thin wrapper for CompanySearch onSelect (same signature) */
  function applyCompany(c: CompanyData) {
    void applyCompanyData(c);
  }

  /* Apply transferor from saved shareholder */
  function applyTransferor(sh: SavedShareholder) {
    upd({
      transferorShareholderId: sh.id,
      transferorPersonId: sh.personId,
      transferorName: sh.personName || "",
      transferorFolio: sh.folioNumber || "",
      transferorCertNo: sh.certificateNumber || "",
      transferorTotalShares: sh.numberOfShares || 0,
      transferorDistinctiveFrom: sh.distinctiveFrom || 1,
      transferorDistinctiveTo: sh.distinctiveTo || 0,
      transferorPan: sh.panNo || "",
      shareType: sh.shareType || "Equity",
      nominalValue: sh.nominalValue || "10",
      paidUpValue: sh.paidUpValue || "10",
      sharesToTransfer: sh.numberOfShares || 0,
      // pre-fill signers from saved cert
      signers: sh.signingDirectorsJson
        ? (() => { try { return JSON.parse(sh.signingDirectorsJson); } catch { return DEFAULT.signers; } })()
        : DEFAULT.signers,
    });
  }

  /* Print SH-4 preview */
  function printSH4() {
    const html = generateSH4HTML(
      {
        companyName: f.companyName,
        cin: f.cin,
        regAddress: f.regAddress,
        shareClass: f.shareType,
        nominalValue: f.nominalValue,
        paidUpValue: f.paidUpValue,
      } as TransferCompany,
      {
        name: f.transferorName,
        folioNo: f.transferorFolio,
        certNo: f.transferorCertNo,
        numberOfShares: f.sharesToTransfer,
        distinctiveFrom: transferDistFrom,
        distinctiveTo: transferDistTo,
        pan: f.transferorPan || undefined,
        address: f.transferorAddress || undefined,
      } as Transferor,
      {
        name: f.transfereeName || "_______________",
        fatherName: f.transfereeFather || undefined,
        address: f.transfereeAddress || undefined,
        pan: f.transfereePan || undefined,
        occupation: f.transfereeOccupation || undefined,
        newFolioNo: "(Auto)",
        newCertNo: "(Auto)",
        newDistinctiveFrom: transferDistFrom,
        newDistinctiveTo: transferDistTo,
      } as Transferee,
      {
        transferDate: f.transferDate,
        considerationPerShare: f.considerationPerShare || undefined,
        totalConsideration: totalConsideration || undefined,
        stampDuty: f.stampDuty || undefined,
        issuePlace: f.issuePlace || undefined,
      } as TransferDetails,
      f.signers.filter(s => s.name) as TransferSigner[]
    );
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) { alert("Pop-up blocked!"); return; }
    w.document.write(html); w.document.close();
  }

  /* Print new share certificate for transferee */
  function printNewCert(newFolioNo: string, newCertNo: string) {
    const ranges = computeCertRanges(
      [{ shares: f.sharesToTransfer }],
      transferDistFrom
    );
    const html = generateShareCertificateHTML(
      {
        companyName: f.companyName,
        cin: f.cin,
        regAddress: f.regAddress,
        shareClass: f.shareType,
        nominalValue: f.nominalValue,
        paidUpValue: f.paidUpValue,
        issueDate: f.transferDate,
        issuePlace: f.issuePlace,
      },
      [{ name: f.transfereeName, din: f.transfereePan || "", shares: f.sharesToTransfer }],
      [{ ...ranges[0], folioNo: newFolioNo, certNo: newCertNo }],
      f.signers.filter(s => s.name)
    );
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) { alert("Pop-up blocked!"); return; }
    w.document.write(html); w.document.close();
  }

  /* Execute transfer */
  async function handleExecute() {
    if (!f.transferorShareholderId && isLoggedIn) { setError("Please select a transferor from records"); return; }
    if (!f.transfereeName.trim()) { setError("Transferee name is required"); return; }
    if (f.sharesToTransfer <= 0) { setError("Shares to transfer must be > 0"); return; }

    // Guest mode — just print
    if (!isLoggedIn) {
      printSH4();
      return;
    }

    setSaving(true); setError("");
    const res = await fetch("/api/share-transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId: f.companyId,
        transferorPersonId: f.transferorPersonId || undefined,
        transferorName: f.transferorName,
        transferorFolio: f.transferorFolio || undefined,
        transferorCertNo: f.transferorCertNo || undefined,
        transferorShareholderId: f.transferorShareholderId,
        transfereeName: f.transfereeName.trim(),
        transfereeFatherName: f.transfereeFather || undefined,
        transfereeAddress: f.transfereeAddress || undefined,
        transfereePan: f.transfereePan || undefined,
        transfereeOccupation: f.transfereeOccupation || undefined,
        numberOfShares: f.sharesToTransfer,
        shareType: f.shareType,
        transferDate: f.transferDate || undefined,
        considerationPerShare: f.considerationPerShare || undefined,
        totalConsideration: totalConsideration || undefined,
        stampDuty: f.stampDuty || undefined,
        issuePlace: f.issuePlace || undefined,
        nominalValue: f.nominalValue,
        paidUpValue: f.paidUpValue,
        signingDirectorsJson: JSON.stringify(f.signers.filter(s => s.name)),
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError((d as { error?: string }).error || "Transfer failed");
      return;
    }
    const result = await res.json() as { transferId: string; newFolioNo: string; newCertNo: string };
    setDone(result);
    setStep(6);
  }

  /* ── STEP VALIDATORS ── */
  function canNext(s: number) {
    if (s === 1) return f.companyName.trim() !== "";
    if (s === 2) return f.transferorName.trim() !== "" && f.transferorTotalShares > 0;
    if (s === 3) return f.sharesToTransfer > 0 && f.sharesToTransfer <= f.transferorTotalShares;
    if (s === 4) return f.transfereeName.trim() !== "";
    return true;
  }

  /* ══════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100">
      <Navbar />

      {/* ── HERO ── */}
      <div className="py-10 px-4" style={{ background: "linear-gradient(135deg,#064e3b,#065f46)" }}>
        <div className="max-w-3xl mx-auto text-center text-white">
          <div className="text-4xl mb-3">🔄</div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Share Transfer</h1>
          <p className="text-emerald-200 text-sm max-w-xl mx-auto">
            Generate Form SH-4 (Securities Transfer Form) under Section 56 of the Companies Act, 2013.
            Transfer shares between parties and issue new share certificates.
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <Link href="/tools/documents/share-certificate"
              className="text-xs bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition-colors">
              📜 Share Certificate
            </Link>
            <Link href="/dashboard"
              className="text-xs bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition-colors">
              📊 Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* ── STEP INDICATOR ── */}
      <div className="max-w-3xl mx-auto px-4 mt-6">
        <div className="flex items-center gap-1">
          {["Company", "Transferor", "Details", "Transferee", "Signatories", "Done"].map((label, i) => (
            <div key={i} className="flex items-center flex-1">
              <button
                onClick={() => i + 1 < step && setStep(i + 1)}
                className={`w-full flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                  step === i + 1
                    ? "bg-emerald-600 text-white shadow-md"
                    : step > i + 1
                    ? "bg-emerald-100 text-emerald-700 cursor-pointer hover:bg-emerald-200"
                    : "bg-white text-slate-400 border border-slate-200"
                }`}>
                <span className="text-base">{["🏢","👤","📋","🤝","✍️","✅"][i]}</span>
                <span className="hidden sm:block">{label}</span>
              </button>
              {i < 5 && <div className={`h-0.5 w-3 shrink-0 ${step > i + 1 ? "bg-emerald-400" : "bg-slate-200"}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* ── FORM BODY ── */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">

          {/* ════ STEP 1: Company ════ */}
          {step === 1 && (
            <div>
              <SHead n={1} title="Company Details" sub="Search or upload Excel to auto-fill company details" />

              {/* ── Excel Upload (fastest way) ── */}
              <CompanyExcelUpload
                onFill={data => { applyCompany(data); setCompanyQuery(data.companyName || ""); }}
                accent="blue"
                note="Upload MCA Master Data Sheet — company, directors & signatories auto-fill ho jayenge"
              />

              {/* ── OR label ── */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 border-t border-slate-200" />
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">or search</span>
                <div className="flex-1 border-t border-slate-200" />
              </div>

              {/* Company Search */}
              <div className="mb-5">
                <Lbl c="Search Company" h="Start typing company name or CIN" />
                <CompanySearch
                  value={companyQuery}
                  onChange={setCompanyQuery}
                  onSelect={c => { setCompanyQuery(c.companyName || ""); applyCompany(c); }}
                  placeholder="Type company name or CIN…"
                  className={INP}
                  accent="blue"
                />
              </div>

              {/* Filled company preview */}
              {f.companyName && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-emerald-800 text-sm">{f.companyName}</div>
                      {f.cin && <div className="text-xs text-emerald-600 mt-0.5">CIN: {f.cin}</div>}
                      {f.regAddress && <div className="text-xs text-slate-500 mt-0.5">{f.regAddress}</div>}
                    </div>
                    <button onClick={() => { upd({ companyName:"", cin:"", regAddress:"", companyId:"" }); setCompanyQuery(""); setSavedShareholders([]); }}
                      className="text-slate-400 hover:text-red-500 text-lg leading-none shrink-0">✕</button>
                  </div>
                  {isLoggedIn && f.companyId && (
                    <div className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                      ✅ Found in your records — shareholders loading...
                    </div>
                  )}
                  {isLoggedIn && !f.companyId && (
                    <div className="text-xs text-amber-600 mt-2">
                      ⚠️ Not in your client list — transfer will not be saved to DB
                    </div>
                  )}
                </div>
              )}

              {/* Manual fallback */}
              <div className={`space-y-4 transition-all ${f.companyName ? "border-t border-slate-100 pt-4 mt-2" : ""}`}>
                {f.companyName && (
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Edit / correct details</p>
                )}
                <div>
                  <Lbl c={f.companyName ? "Company Name" : "Company Name *"} />
                  <input className={INP} value={f.companyName}
                    onChange={e => upd({ companyName: e.target.value })} placeholder="Full legal name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Lbl c="CIN" />
                    <input className={INP} value={f.cin}
                      onChange={e => upd({ cin: e.target.value.toUpperCase() })} placeholder="U12345XX2020PTC..." />
                  </div>
                  <div>
                    <Lbl c="Share Class" />
                    <select className={SEL} value={f.shareType} onChange={e => upd({ shareType: e.target.value })}>
                      <option>Equity</option>
                      <option>Preference</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Lbl c="Registered Address" />
                  <textarea className={INP} rows={2} value={f.regAddress}
                    onChange={e => upd({ regAddress: e.target.value })} placeholder="Registered office address" />
                </div>
              </div>
            </div>
          )}

          {/* ════ STEP 2: Transferor ════ */}
          {step === 2 && (
            <div>
              <SHead n={2} title="Transferor Details" sub="Select the shareholder who is transferring shares" />

              {/* From Records (logged in) */}
              {isLoggedIn && f.companyId && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                    📂 From Your Records
                    {loadingSh && <span className="ml-2 text-emerald-500 font-normal">Loading...</span>}
                  </p>
                  {savedShareholders.length === 0 && !loadingSh ? (
                    <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-400 text-center">
                      No active shareholders found for this company
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {savedShareholders.map(sh => (
                        <button key={sh.id} onClick={() => applyTransferor(sh)}
                          className={`text-left rounded-xl border-2 p-3 transition-all ${
                            f.transferorShareholderId === sh.id
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50"
                          }`}>
                          <div className="font-bold text-slate-800 text-sm">{sh.personName || "—"}</div>
                          <div className="text-xs text-slate-400 mt-1 space-y-0.5">
                            <div>Folio: {sh.folioNumber || "—"} · Cert: {sh.certificateNumber || "—"}</div>
                            <div className="font-semibold text-blue-700">{(sh.numberOfShares || 0).toLocaleString("en-IN")} shares ({sh.holdingPercent}%)</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Manual fields */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                  {isLoggedIn ? "Or fill manually" : "Transferor Details"}
                </p>
                <div>
                  <Lbl c="Full Name of Transferor *" />
                  <input className={INP} value={f.transferorName}
                    onChange={e => upd({ transferorName: e.target.value })} placeholder="Full legal name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Lbl c="Folio Number" />
                    <input className={INP} value={f.transferorFolio}
                      onChange={e => upd({ transferorFolio: e.target.value })} placeholder="e.g. 01" />
                  </div>
                  <div>
                    <Lbl c="Certificate Number" />
                    <input className={INP} value={f.transferorCertNo}
                      onChange={e => upd({ transferorCertNo: e.target.value })} placeholder="e.g. 01" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Lbl c="Total Shares Held *" />
                    <input type="number" className={INP} value={f.transferorTotalShares || ""}
                      onChange={e => upd({ transferorTotalShares: parseInt(e.target.value) || 0 })}
                      placeholder="Total shares" />
                  </div>
                  <div>
                    <Lbl c="Distinctive No. From" />
                    <input type="number" className={INP} value={f.transferorDistinctiveFrom || ""}
                      onChange={e => upd({ transferorDistinctiveFrom: parseInt(e.target.value) || 1 })}
                      placeholder="e.g. 1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Lbl c="PAN (optional)" />
                    <input className={`${INP} font-mono uppercase`} value={f.transferorPan}
                      onChange={e => upd({ transferorPan: e.target.value.toUpperCase() })}
                      placeholder="ABCDE1234F" maxLength={10} />
                  </div>
                  <div>
                    <Lbl c="Share Class" />
                    <select className={SEL} value={f.shareType} onChange={e => upd({ shareType: e.target.value })}>
                      <option>Equity</option>
                      <option>Preference</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Lbl c="Nominal Value (₹/share)" />
                    <input className={INP} value={f.nominalValue}
                      onChange={e => upd({ nominalValue: e.target.value })} placeholder="10" />
                  </div>
                  <div>
                    <Lbl c="Paid-up Value (₹/share)" />
                    <input className={INP} value={f.paidUpValue}
                      onChange={e => upd({ paidUpValue: e.target.value })} placeholder="10" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ STEP 3: Transfer Details ════ */}
          {step === 3 && (
            <div>
              <SHead n={3} title="Transfer Details" sub="Shares to transfer, consideration, date and place" />

              {/* Transferor summary */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6 text-sm">
                <div className="font-bold text-slate-700 mb-2">📤 Transferor: {f.transferorName}</div>
                <div className="grid grid-cols-3 gap-3 text-xs text-slate-500">
                  <div><span className="font-semibold">Total Shares:</span><br />{f.transferorTotalShares.toLocaleString("en-IN")}</div>
                  <div><span className="font-semibold">Folio:</span><br />{f.transferorFolio || "—"}</div>
                  <div><span className="font-semibold">Cert No:</span><br />{f.transferorCertNo || "—"}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Lbl c="Number of Shares to Transfer *"
                    h={`Max: ${f.transferorTotalShares.toLocaleString("en-IN")}`} />
                  <input type="number" className={INP} value={f.sharesToTransfer || ""}
                    min={1} max={f.transferorTotalShares}
                    onChange={e => upd({ sharesToTransfer: parseInt(e.target.value) || 0 })} />
                  {f.sharesToTransfer > 0 && (
                    <div className={`mt-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                      remaining === 0
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : remaining < 0
                        ? "bg-red-50 text-red-600 border border-red-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}>
                      {remaining < 0
                        ? `⚠️ Exceeds available shares by ${Math.abs(remaining)}`
                        : remaining === 0
                        ? "⚡ Full transfer — transferor will hold 0 shares after this"
                        : `✅ Remaining with transferor: ${remaining.toLocaleString("en-IN")} shares`}
                    </div>
                  )}
                </div>

                {/* Distinctive numbers preview */}
                {f.sharesToTransfer > 0 && f.transferorDistinctiveFrom > 0 && (
                  <div className="bg-blue-50 rounded-xl p-3 font-mono text-xs text-blue-700">
                    <strong>Distinctive Nos. to be Transferred:</strong>&nbsp;
                    {String(transferDistFrom).padStart(5, "0")} – {String(transferDistTo).padStart(5, "0")}
                  </div>
                )}

                <div>
                  <Lbl c="Date of Transfer *" />
                  <input type="date" className={INP} value={f.transferDate}
                    onChange={e => upd({ transferDate: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Lbl c="Consideration (₹ per share)" h="Leave blank if not applicable" />
                    <input type="number" className={INP} value={f.considerationPerShare}
                      onChange={e => upd({ considerationPerShare: e.target.value })} placeholder="e.g. 10" />
                  </div>
                  <div>
                    <Lbl c="Stamp Duty (₹)" h="Optional" />
                    <input type="number" className={INP} value={f.stampDuty}
                      onChange={e => upd({ stampDuty: e.target.value })} placeholder="optional" />
                  </div>
                </div>

                {totalConsideration && (
                  <div className="bg-emerald-50 rounded-xl px-4 py-3 text-sm font-bold text-emerald-700">
                    💰 Total Consideration: ₹ {parseFloat(totalConsideration).toLocaleString("en-IN")}
                  </div>
                )}

                <div>
                  <Lbl c="Place of Execution" />
                  <input className={INP} value={f.issuePlace}
                    onChange={e => upd({ issuePlace: e.target.value })} placeholder="e.g. Mumbai" />
                </div>
              </div>
            </div>
          )}

          {/* ════ STEP 4: Transferee ════ */}
          {step === 4 && (
            <div>
              <SHead n={4} title="Transferee Details" sub="Details of the person receiving the shares" />
              <div className="space-y-4">
                <div>
                  <Lbl c="Full Name of Transferee *" />
                  <input className={INP} value={f.transfereeName}
                    onChange={e => upd({ transfereeName: e.target.value })} placeholder="Full legal name" />
                </div>
                <div>
                  <Lbl c="Father's / Spouse's Name" />
                  <input className={INP} value={f.transfereeFather}
                    onChange={e => upd({ transfereeFather: e.target.value })} placeholder="optional" />
                </div>
                <div>
                  <Lbl c="Address" />
                  <textarea className={INP} rows={3} value={f.transfereeAddress}
                    onChange={e => upd({ transfereeAddress: e.target.value })} placeholder="Full residential/official address" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Lbl c="PAN" h="Mandatory for listed companies" />
                    <input className={`${INP} font-mono uppercase`} value={f.transfereePan}
                      onChange={e => upd({ transfereePan: e.target.value.toUpperCase() })}
                      placeholder="ABCDE1234F" maxLength={10} />
                  </div>
                  <div>
                    <Lbl c="Occupation" h="Optional" />
                    <input className={INP} value={f.transfereeOccupation}
                      onChange={e => upd({ transfereeOccupation: e.target.value })} placeholder="optional" />
                  </div>
                </div>
                {isLoggedIn && f.companyId && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-600">
                    <strong>ℹ️ Note:</strong> A new shareholder record will be created for the transferee.
                    New Folio No. and Certificate No. will be auto-generated.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ STEP 5: Signatories ════ */}
          {step === 5 && (
            <div>
              <SHead n={5} title="Authorised Signatories"
                sub="Directors / authorised persons who will sign Form SH-4 and the new share certificate" />
              <div className="space-y-3">
                {f.signers.map((s, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Signatory {i + 1}</span>
                      {f.signers.length > 1 && (
                        <button
                          onClick={() => upd({ signers: f.signers.filter((_, idx) => idx !== i) })}
                          className="text-xs text-red-400 hover:text-red-600">
                          ✕ Remove
                        </button>
                      )}
                    </div>
                    <input className={INP} value={s.name}
                      onChange={e => upd({ signers: f.signers.map((sg, idx) => idx === i ? { ...sg, name: e.target.value } : sg) })}
                      placeholder="Full Name" />
                    <div className="grid grid-cols-2 gap-3">
                      <input className={INP} value={s.designation}
                        onChange={e => upd({ signers: f.signers.map((sg, idx) => idx === i ? { ...sg, designation: e.target.value } : sg) })}
                        placeholder="Designation (e.g. Director)" />
                      <input className={`${INP} font-mono`} value={s.din || ""}
                        onChange={e => upd({ signers: f.signers.map((sg, idx) => idx === i ? { ...sg, din: e.target.value } : sg) })}
                        placeholder="DIN (optional)" />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => upd({ signers: [...f.signers, { name: "", designation: "Director", din: "" }] })}
                  className="w-full py-2.5 rounded-xl border-2 border-dashed border-emerald-300 text-emerald-600 text-sm font-semibold hover:bg-emerald-50 transition-colors">
                  + Add Signatory
                </button>

                {/* Summary box */}
                <div className="mt-4 bg-slate-50 rounded-xl p-4 space-y-2 text-xs text-slate-500">
                  <div className="font-bold text-slate-600 text-sm mb-2">📋 Transfer Summary</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <div><span className="font-semibold">Company:</span> {f.companyName}</div>
                    <div><span className="font-semibold">Date:</span> {f.transferDate}</div>
                    <div><span className="font-semibold">Transferor:</span> {f.transferorName}</div>
                    <div><span className="font-semibold">Transferee:</span> {f.transfereeName}</div>
                    <div><span className="font-semibold">Shares:</span> {f.sharesToTransfer.toLocaleString("en-IN")}</div>
                    <div><span className="font-semibold">Share Type:</span> {f.shareType}</div>
                    <div><span className="font-semibold">Distinctive From:</span> {String(transferDistFrom).padStart(5,"0")}</div>
                    <div><span className="font-semibold">Distinctive To:</span> {String(transferDistTo).padStart(5,"0")}</div>
                    {totalConsideration && <div className="col-span-2"><span className="font-semibold">Total Consideration:</span> ₹ {parseFloat(totalConsideration).toLocaleString("en-IN")}</div>}
                  </div>
                </div>

                {/* Preview SH-4 */}
                <button onClick={printSH4}
                  className="w-full py-3 rounded-xl border-2 border-emerald-600 text-emerald-700 font-bold text-sm hover:bg-emerald-50 flex items-center justify-center gap-2 transition-colors">
                  👁️ Preview Form SH-4
                </button>
              </div>
            </div>
          )}

          {/* ════ STEP 6: Done ════ */}
          {step === 6 && done && (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Transfer Complete!</h2>
              <p className="text-slate-500 text-sm mb-6">
                Share transfer has been recorded successfully.
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-left mb-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Transfer ID:</span>
                  <span className="font-mono text-xs text-slate-600">{done.transferId.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transferee:</span>
                  <span className="font-bold text-slate-800">{f.transfereeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Shares Transferred:</span>
                  <span className="font-bold text-emerald-700">{f.sharesToTransfer.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">New Folio No.:</span>
                  <span className="font-bold text-blue-700">{done.newFolioNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">New Cert No.:</span>
                  <span className="font-bold text-blue-700">{done.newCertNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Remaining (Transferor):</span>
                  <span className="font-bold text-slate-700">{remaining.toLocaleString("en-IN")} shares</span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={printSH4}
                  className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#065f46,#047857)" }}>
                  🖨️ Print Form SH-4
                </button>
                <button onClick={() => printNewCert(done.newFolioNo, done.newCertNo)}
                  className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#1e40af,#1d4ed8)" }}>
                  📜 Print New Share Certificate
                </button>
                <button onClick={() => { setF(DEFAULT); setStep(1); setDone(null); setSavedShareholders([]); }}
                  className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">
                  🔄 New Transfer
                </button>
                <Link href="/dashboard"
                  className="w-full py-3 rounded-xl bg-slate-50 text-slate-600 font-semibold text-sm text-center hover:bg-slate-100">
                  ← Back to Dashboard
                </Link>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-semibold">
              ⚠️ {error}
            </div>
          )}

          {/* ── Navigation ── */}
          {step < 6 && (
            <div className="flex gap-3 mt-8 pt-5 border-t border-slate-100">
              {step > 1 && (
                <button onClick={() => setStep(s => s - 1)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">
                  ← Back
                </button>
              )}
              {step < 5 ? (
                <button
                  onClick={() => { if (!canNext(step)) { setError("Please fill required fields"); return; } setError(""); setStep(s => s + 1); }}
                  disabled={!canNext(step)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
                  style={{ background: "linear-gradient(135deg,#065f46,#047857)" }}>
                  Next →
                </button>
              ) : (
                <button onClick={handleExecute} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#065f46,#047857)" }}>
                  {saving
                    ? "⏳ Processing..."
                    : isLoggedIn
                    ? "✅ Execute Transfer & Save"
                    : "🖨️ Generate SH-4 (Preview)"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Info cards ── */}
        {step < 6 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {[
              { icon: "📄", title: "Form SH-4", desc: "Legally compliant Securities Transfer Form under Section 56" },
              { icon: "📜", title: "New Certificate", desc: "Auto-generate new share certificate for transferee after transfer" },
              { icon: "💾", title: "Auto-save", desc: "Transfer records & updated share registers saved automatically" },
            ].map(card => (
              <div key={card.title} className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
                <div className="text-2xl mb-2">{card.icon}</div>
                <div className="font-bold text-slate-700 text-sm mb-1">{card.title}</div>
                <div className="text-xs text-slate-400">{card.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
