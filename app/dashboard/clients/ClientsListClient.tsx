"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import CompanyExcelUpload from "@/components/CompanyExcelUpload";
import type { CompanyData } from "@/lib/types/company";

interface Company {
  id: string; companyName: string; cin: string | null;
  entityType: string | null; incorporationDate: string | null;
  regAddress: string | null; docCount: number; createdAt: string;
}

async function deleteCompany(id: string): Promise<boolean> {
  const r = await fetch(`/api/clients/${id}`, { method: "DELETE" });
  return r.ok;
}

export default function ClientsListClient() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [deleting, setDeleting]   = useState<string | null>(null); // id being deleted

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
              Manage your client companies and track their compliance meetings
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
                      {c.docCount} meeting{c.docCount !== 1 ? 's' : ''} saved
                    </span>
                    <span className="text-xs font-bold text-blue-600 group-hover/card:translate-x-1 transition-transform inline-block">
                      View →
                    </span>
                  </div>
                </Link>

                {/* Delete button — shown on hover */}
                <button
                  onClick={async e => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (deleting === c.id) return;
                    if (!confirm(`Delete "${c.companyName}"?\n\nThis will remove the company and all its saved data. This cannot be undone.`)) return;
                    setDeleting(c.id);
                    const ok = await deleteCompany(c.id);
                    if (ok) {
                      setCompanies(prev => prev.filter(x => x.id !== c.id));
                    } else {
                      alert("Could not delete company. Please try again.");
                    }
                    setDeleting(null);
                  }}
                  disabled={deleting === c.id}
                  title="Delete this company"
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-400 hover:bg-red-50 hover:border-red-300 hover:text-red-500 flex items-center justify-center text-xs font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 z-10"
                >
                  {deleting === c.id ? '…' : '✕'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
