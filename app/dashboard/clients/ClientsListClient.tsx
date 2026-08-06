"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import CompanyExcelUpload from "@/components/CompanyExcelUpload";
import type { CompanyData } from "@/lib/types/company";

interface Company {
  id: string; companyName: string; cin: string | null;
  entityType: string | null; incorporationDate: string | null;
  regAddress: string | null; docCount: number; createdAt: string;
}

type DeleteStep = "confirm-name" | "enter-otp" | "deleting";

interface DeleteModal {
  company: Company;
  step: DeleteStep;
  typedName: string;
  otp: string;
  maskedEmail: string;
  error: string;
  busy: boolean;
}

export default function ClientsListClient() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState<DeleteModal | null>(null);
  const otpInputRef               = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const r = await fetch('/api/clients');
    const d = await r.json();
    setCompanies(d.companies || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  // Called after Excel auto-fill — company already saved to DB by CompanyExcelUpload
  function handleExcelFill(_data: CompanyData) {
    // Refresh the list after a short delay to let the DB write complete
    setTimeout(() => load(), 800);
  }

  function openDeleteModal(company: Company) {
    setModal({ company, step: "confirm-name", typedName: "", otp: "", maskedEmail: "", error: "", busy: false });
  }

  function closeModal() { setModal(null); }

  async function handleSendOtp() {
    if (!modal) return;
    setModal(m => m ? { ...m, busy: true, error: "" } : m);
    const r = await fetch(`/api/clients/${modal.company.id}/delete-otp`, { method: "POST" });
    const d = await r.json();
    if (!r.ok) {
      setModal(m => m ? { ...m, busy: false, error: d.error || "Failed to send OTP." } : m);
      return;
    }
    setModal(m => m ? { ...m, busy: false, step: "enter-otp", maskedEmail: d.maskedEmail } : m);
    setTimeout(() => otpInputRef.current?.focus(), 100);
  }

  async function handleConfirmDelete() {
    if (!modal) return;
    setModal(m => m ? { ...m, busy: true, error: "", step: "deleting" } : m);
    const r = await fetch(`/api/clients/${modal.company.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp: modal.otp }),
    });
    const d = await r.json();
    if (!r.ok) {
      setModal(m => m ? { ...m, busy: false, step: "enter-otp", error: d.error || "Deletion failed." } : m);
      return;
    }
    setCompanies(prev => prev.filter(c => c.id !== modal.company.id));
    setModal(null);
  }

  const filtered = companies.filter(c =>
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    (c.cin || '').toLowerCase().includes(search.toLowerCase())
  );

  const entityColors: Record<string, string> = {
    'Private Limited':   'from-blue-500 to-blue-700',
    'Public Limited':    'from-purple-500 to-purple-700',
    'LLP':               'from-emerald-500 to-emerald-700',
    'OPC':               'from-amber-500 to-amber-700',
    'Section 8':         'from-rose-500 to-rose-700',
    'Producer Company':  'from-teal-500 to-teal-700',
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 text-sm">← Dashboard</Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">My Clients</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Manage your client companies and track all documents — minutes, filings, appointments
            </p>
          </div>
        </div>

        {/* ── Excel Upload — Add New Client ── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: "linear-gradient(135deg,#1e40af,#1d4ed8)" }}>
              ➕
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Add New Client via Excel</h2>
              <p className="text-xs text-slate-400">Upload an MCA Master Data Sheet — the company will be automatically added to My Clients</p>
            </div>
          </div>
          <CompanyExcelUpload
            onFill={handleExcelFill}
            accent="blue"
            note="The company will be saved to My Clients as soon as you upload the Excel."
          />
        </div>

        {/* Search */}
        {companies.length > 0 && (
          <div className="relative mb-6">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search by company name or CIN..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* Companies Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
                <div className="w-12 h-12 bg-slate-100 rounded-xl mb-4"/>
                <div className="h-4 bg-slate-100 rounded mb-2 w-3/4"/>
                <div className="h-3 bg-slate-100 rounded w-1/2"/>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🏢</div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">
              {companies.length === 0 ? 'No clients yet' : 'No results found'}
            </h3>
            <p className="text-sm text-slate-400">
              {companies.length === 0
                ? 'Upload an MCA Excel above — the company will be added automatically'
                : 'Try a different search term'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(c => (
              <div key={c.id} className="relative group">
                <Link
                  href={`/dashboard/clients/${c.id}`}
                  className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-xl hover:border-blue-300 transition-all hover:-translate-y-0.5 group/card block"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                      entityColors[c.entityType || ''] || 'from-slate-500 to-slate-700'
                    } flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-md`}>
                      {c.companyName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 text-sm leading-tight group-hover/card:text-blue-700 transition-colors line-clamp-2">
                        {c.companyName}
                      </h3>
                      {c.entityType && (
                        <span className="inline-block text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mt-1">
                          {c.entityType}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-500">
                    {c.cin && (
                      <div className="flex items-center gap-1.5">
                        <span>🔢</span><span className="font-mono">{c.cin}</span>
                      </div>
                    )}
                    {c.incorporationDate && (
                      <div className="flex items-center gap-1.5">
                        <span>📅</span><span>Inc. {c.incorporationDate}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      {c.docCount === 0
                        ? 'No documents saved'
                        : `${c.docCount} document${c.docCount !== 1 ? 's' : ''} saved`}
                    </span>
                    <span className="text-xs font-bold text-blue-600 group-hover/card:translate-x-1 transition-transform inline-block">
                      View →
                    </span>
                  </div>
                </Link>

                {/* Delete button — shown on hover */}
                <button
                  onClick={e => { e.preventDefault(); e.stopPropagation(); openDeleteModal(c); }}
                  title="Delete this company"
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-400 hover:bg-red-50 hover:border-red-300 hover:text-red-500 flex items-center justify-center text-xs font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Delete Company Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-red-100 overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-base">Delete Company</h2>
                <p className="text-red-200 text-xs mt-0.5">This action is permanent and cannot be undone</p>
              </div>
              <button onClick={closeModal} className="text-red-200 hover:text-white text-xl font-bold leading-none">✕</button>
            </div>

            <div className="p-6">
              {/* Company info */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">Company to be deleted</p>
                <p className="font-bold text-slate-800 text-sm">{modal.company.companyName}</p>
                {modal.company.cin && <p className="text-xs text-slate-500 font-mono mt-0.5">{modal.company.cin}</p>}
                {modal.company.docCount > 0 && (
                  <p className="text-xs text-amber-600 font-semibold mt-2">
                    ⚠️ {modal.company.docCount} saved document{modal.company.docCount !== 1 ? 's' : ''} will become unlinked
                  </p>
                )}
              </div>

              {/* Step 1: Type name */}
              {(modal.step === "confirm-name") && (
                <>
                  <p className="text-sm text-slate-600 mb-3">
                    Type the company name exactly as shown above to continue:
                  </p>
                  <input
                    type="text"
                    autoFocus
                    autoComplete="off"
                    placeholder={modal.company.companyName}
                    value={modal.typedName}
                    onChange={e => setModal(m => m ? { ...m, typedName: e.target.value, error: "" } : m)}
                    onPaste={e => e.preventDefault()}
                    onCopy={e => e.preventDefault()}
                    onCut={e => e.preventDefault()}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 mb-1"
                  />
                  <p className="text-xs text-slate-400 mb-4">Copy-paste is disabled — you must type it manually.</p>

                  {modal.error && <p className="text-xs text-red-600 mb-3 font-medium">{modal.error}</p>}

                  <div className="flex gap-3">
                    <button
                      onClick={closeModal}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendOtp}
                      disabled={modal.typedName.trim() !== modal.company.companyName.trim() || modal.busy}
                      className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {modal.busy ? "Sending OTP…" : "Send OTP →"}
                    </button>
                  </div>
                </>
              )}

              {/* Step 2: Enter OTP */}
              {(modal.step === "enter-otp" || modal.step === "deleting") && (
                <>
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4">
                    <span className="text-blue-500 text-lg">📧</span>
                    <p className="text-sm text-blue-700">
                      OTP sent to <strong>{modal.maskedEmail}</strong> — check your inbox
                    </p>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">Enter the 6-digit OTP to confirm deletion:</p>
                  <input
                    ref={otpInputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    placeholder="000000"
                    value={modal.otp}
                    onChange={e => setModal(m => m ? { ...m, otp: e.target.value.replace(/\D/g, "").slice(0, 6), error: "" } : m)}
                    onPaste={e => e.preventDefault()}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-center font-mono text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-red-400 mb-1"
                  />
                  <p className="text-xs text-slate-400 mb-4">OTP is valid for 10 minutes. Copy-paste is disabled.</p>

                  {modal.error && <p className="text-xs text-red-600 mb-3 font-medium">{modal.error}</p>}

                  <div className="flex gap-3">
                    <button
                      onClick={closeModal}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      disabled={modal.otp.length !== 6 || modal.busy}
                      className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {modal.step === "deleting" ? "Deleting…" : "Confirm Delete"}
                    </button>
                  </div>

                  <button
                    onClick={() => setModal(m => m ? { ...m, step: "confirm-name", otp: "", error: "" } : m)}
                    className="w-full mt-3 text-xs text-slate-400 hover:text-slate-600 underline text-center"
                  >
                    ← Back to name confirmation
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
