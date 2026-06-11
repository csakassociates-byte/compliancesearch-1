"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Company {
  id: string; companyName: string; cin: string | null;
  entityType: string | null; incorporationDate: string | null;
  regAddress: string | null; docCount: number; createdAt: string;
}

export default function ClientsListClient() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ companyName: '', cin: '', entityType: 'Private Limited', incorporationDate: '', regAddress: '' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  async function load() {
    const r = await fetch('/api/clients');
    const d = await r.json();
    setCompanies(d.companies || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setShowAdd(false); setForm({ companyName: '', cin: '', entityType: 'Private Limited', incorporationDate: '', regAddress: '' }); load(); }
  }

  const filtered = companies.filter(c =>
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    (c.cin || '').toLowerCase().includes(search.toLowerCase())
  );

  const entityColors: Record<string, string> = {
    'Private Limited': 'from-blue-500 to-blue-700',
    'Public Limited': 'from-purple-500 to-purple-700',
    'LLP': 'from-emerald-500 to-emerald-700',
    'OPC': 'from-amber-500 to-amber-700',
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 text-sm">← Dashboard</Link>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">My Clients</h1>
              <p className="text-slate-500 text-sm mt-0.5">Manage your client companies and track their compliance meetings</p>
            </div>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105"
            style={{background:'linear-gradient(135deg,#1e40af,#1d4ed8)'}}>
            + Add Client
          </button>
        </div>

        {/* Search */}
        {companies.length > 0 && (
          <div className="relative mb-6">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input type="text" placeholder="Search by company name or CIN..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={search} onChange={e => setSearch(e.target.value)} />
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
            <p className="text-sm text-slate-400 mb-6">
              {companies.length === 0 ? 'Add your first client company to start tracking compliance meetings' : 'Try a different search term'}
            </p>
            {companies.length === 0 && (
              <button onClick={() => setShowAdd(true)}
                className="px-6 py-3 rounded-xl font-bold text-white text-sm"
                style={{background:'linear-gradient(135deg,#1e40af,#1d4ed8)'}}>
                + Add First Client
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(c => (
              <Link key={c.id} href={`/dashboard/clients/${c.id}`}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-xl hover:border-blue-300 transition-all hover:-translate-y-0.5 group block">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${entityColors[c.entityType||''] || 'from-slate-500 to-slate-700'} flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-md`}>
                    {c.companyName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm leading-tight group-hover:text-blue-700 transition-colors line-clamp-2">
                      {c.companyName}
                    </h3>
                    {c.entityType && (
                      <span className="inline-block text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mt-1">{c.entityType}</span>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-500">
                  {c.cin && <div className="flex items-center gap-1.5"><span>🔢</span><span className="font-mono">{c.cin}</span></div>}
                  {c.incorporationDate && <div className="flex items-center gap-1.5"><span>📅</span><span>Inc. {c.incorporationDate}</span></div>}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    {c.docCount} meeting{c.docCount !== 1 ? 's' : ''} saved
                  </span>
                  <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform inline-block">View →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100" style={{background:'linear-gradient(135deg,#1e40af,#1d4ed8)'}}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Add New Client</h2>
                  <p className="text-blue-200 text-sm mt-0.5">Enter company details to start tracking</p>
                </div>
                <button onClick={() => setShowAdd(false)} className="text-white/70 hover:text-white text-2xl leading-none">×</button>
              </div>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Company Name <span className="text-red-400">*</span></label>
                <input required type="text" placeholder="NNT DEVELOPERS LIMITED"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={form.companyName} onChange={e => setForm(f=>({...f, companyName: e.target.value}))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">CIN</label>
                  <input type="text" placeholder="U12345MH2010PLC123456"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
                    value={form.cin} onChange={e => setForm(f=>({...f, cin: e.target.value}))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Entity Type</label>
                  <select className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    value={form.entityType} onChange={e => setForm(f=>({...f, entityType: e.target.value}))}>
                    <option>Private Limited</option>
                    <option>Public Limited</option>
                    <option>LLP</option>
                    <option>OPC</option>
                    <option>Section 8</option>
                    <option>Producer Company</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Incorporation Date</label>
                <input type="text" placeholder="e.g. 15 March 2010"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={form.incorporationDate} onChange={e => setForm(f=>({...f, incorporationDate: e.target.value}))} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Registered Address</label>
                <textarea rows={2} placeholder="Registered office address..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  value={form.regAddress} onChange={e => setForm(f=>({...f, regAddress: e.target.value}))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving || !form.companyName}
                  className="flex-1 py-3 rounded-xl font-bold text-white text-sm disabled:opacity-60 shadow-md"
                  style={{background:'linear-gradient(135deg,#1e40af,#1d4ed8)'}}>
                  {saving ? 'Adding...' : 'Add Client →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
