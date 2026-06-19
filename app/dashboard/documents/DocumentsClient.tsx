"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Doc {
  id: string; type: string; title: string;
  companyName: string | null; financialYear: string | null;
  meetingDate: string | null; createdAt: string;
}

export default function DocumentsClient() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'agm_minutes' | 'board_minutes' | 'annual_filing'>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadDocs() {
    const r = await fetch('/api/documents');
    const d = await r.json();
    setDocs(d.documents || []);
    setLoading(false);
  }

  useEffect(() => { loadDocs(); }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this document? This cannot be undone.')) return;
    setDeleting(id);
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    setDocs(prev => prev.filter(d => d.id !== id));
    setDeleting(null);
  }

  const filtered = filter === 'all' ? docs : docs.filter(d => d.type === filter);
  const typeLabel: Record<string, string> = {
    agm_minutes:   "AGM Minutes",
    board_minutes: "Board Minutes",
    annual_filing: "Annual Filing",
  };
  const typeIcon: Record<string, string> = {
    agm_minutes:   "🏛️",
    board_minutes: "📋",
    annual_filing: "📑",
  };
  const typeBadge: Record<string, string> = {
    agm_minutes:   "bg-purple-100 text-purple-700",
    board_minutes: "bg-blue-100 text-blue-700",
    annual_filing: "bg-emerald-100 text-emerald-700",
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 text-sm">← Dashboard</Link>
          <h1 className="text-2xl font-extrabold text-slate-900">My Documents</h1>
          <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full">{docs.length}</span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {(['all', 'agm_minutes', 'board_minutes', 'annual_filing'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                filter === f
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              }`}>
              {f === 'all'           ? `All (${docs.length})` :
               f === 'agm_minutes'   ? `🏛️ AGM (${docs.filter(d=>d.type==='agm_minutes').length})` :
               f === 'board_minutes' ? `📋 Board (${docs.filter(d=>d.type==='board_minutes').length})` :
               `📑 Annual Filing (${docs.filter(d=>d.type==='annual_filing').length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border p-12 text-center text-slate-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-500">No documents found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {filtered.map((doc, i) => (
              <div key={doc.id}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-50 ${i !== 0 ? 'border-t border-slate-100' : ''}`}>
                <div className="text-2xl flex-shrink-0">{typeIcon[doc.type] || '📄'}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 text-sm truncate">{doc.title}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeBadge[doc.type] || 'bg-slate-100 text-slate-600'}`}>
                      {typeLabel[doc.type] || doc.type}
                    </span>
                    {doc.companyName && <span className="text-xs text-slate-500">{doc.companyName}</span>}
                    {doc.financialYear && <span className="text-xs text-slate-400">FY {doc.financialYear}</span>}
                    <span className="text-xs text-slate-400">
                      {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={doc.type === 'annual_filing'
                      ? `/tools/documents/annual-filing?load=${doc.id}`
                      : `/dashboard/documents/${doc.id}`}
                    className="text-xs font-semibold text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50">
                    Open →
                  </Link>
                  <button onClick={() => handleDelete(doc.id)} disabled={deleting === doc.id}
                    className="text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40">
                    {deleting === doc.id ? '...' : '🗑️'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
