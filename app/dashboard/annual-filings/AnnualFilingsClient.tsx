"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface FilingRow {
  id: string;
  companyName: string | null;
  financialYear: string | null;
  updatedAt: string;
  isFinalized: boolean;
  finalizedAt: string | null;
}

export default function AnnualFilingsClient() {
  const router = useRouter();
  const [filings, setFilings] = useState<FilingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/annual-filing")
      .then(r => r.json())
      .then((j: { filings?: FilingRow[] }) => {
        setFilings(j.filings || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, name: string | null) {
    if (!confirm(`Delete draft for ${name || "this company"}? This cannot be undone.`)) return;
    setDeleting(id);
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    setFilings(prev => prev.filter(f => f.id !== id));
    setDeleting(null);
  }

  const filtered = search.trim()
    ? filings.filter(f =>
        (f.companyName || "").toLowerCase().includes(search.toLowerCase()) ||
        (f.financialYear || "").includes(search)
      )
    : filings;

  // Group by company name
  const grouped: Record<string, FilingRow[]> = {};
  for (const f of filtered) {
    const key = f.companyName || "Unknown Company";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(f);
  }

  const finalizedCount = filings.filter(f => f.isFinalized).length;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 text-sm">← Dashboard</Link>
            <h1 className="text-2xl font-extrabold text-slate-900">Annual Filings</h1>
            {!loading && (
              <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full">
                {filings.length}
              </span>
            )}
            {!loading && finalizedCount > 0 && (
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                🔒 {finalizedCount} Finalized
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/tools/compliance-monitor"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              📋 Compliance Monitor
            </Link>
            <button
              onClick={() => router.push("/tools/documents/annual-filing")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors"
            >
              + New Annual Filing
            </button>
          </div>
        </div>

        {/* Search */}
        {filings.length > 3 && (
          <div className="mb-5">
            <input
              type="text"
              placeholder="Search by company name or financial year…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border p-12 text-center text-slate-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-500 font-semibold mb-1">
              {search ? "No results found" : "No saved drafts yet"}
            </p>
            {!search && (
              <p className="text-slate-400 text-sm mb-5">
                Start a new Annual Filing to create your first draft.
              </p>
            )}
            {!search && (
              <button
                onClick={() => router.push("/tools/documents/annual-filing")}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors"
              >
                Start New Annual Filing
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([company, rows]) => {
              const anyFinalized = rows.some(r => r.isFinalized);
              return (
                <div key={company} className={`bg-white rounded-2xl border overflow-hidden ${anyFinalized ? "border-emerald-200" : "border-slate-200"}`}>
                  {/* Company header */}
                  <div className={`px-5 py-3 border-b flex items-center gap-2 ${anyFinalized ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"}`}>
                    <span className="text-base">{anyFinalized ? "🔒" : "🏢"}</span>
                    <span className="font-bold text-slate-800 text-sm">{company}</span>
                    <span className="ml-auto text-xs text-slate-400">
                      {rows.length} {rows.length === 1 && rows[0].isFinalized ? "filing" : `draft${rows.length > 1 ? "s" : ""}`}
                    </span>
                  </div>

                  {/* FY rows */}
                  {rows
                    .sort((a, b) => (b.financialYear || "").localeCompare(a.financialYear || ""))
                    .map((f, i) => (
                    <div
                      key={f.id}
                      className={`flex items-center gap-4 px-5 py-3.5 ${i !== 0 ? "border-t border-slate-100" : ""}`}
                    >
                      {/* FY badge */}
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                          FY {f.financialYear || "—"}
                        </span>
                        {f.isFinalized && (
                          <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            🔒 Finalized
                          </span>
                        )}
                      </div>

                      {/* Date info */}
                      <div className="flex-1 min-w-0">
                        {f.isFinalized && f.finalizedAt ? (
                          <span className="text-xs text-emerald-600 font-medium">
                            Generated on {new Date(f.finalizedAt).toLocaleDateString("en-IN", {
                              day: "2-digit", month: "short", year: "numeric"
                            })}{" "}
                            at {new Date(f.finalizedAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit", minute: "2-digit"
                            })}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Last saved: {new Date(f.updatedAt).toLocaleDateString("en-IN", {
                              day: "2-digit", month: "short", year: "numeric"
                            })}{" "}
                            at {new Date(f.updatedAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit", minute: "2-digit"
                            })}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          href={`/tools/documents/annual-filing?load=${f.id}`}
                          className={`px-4 py-1.5 text-white text-xs font-bold rounded-lg transition-colors ${
                            f.isFinalized
                              ? "bg-amber-500 hover:bg-amber-600"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          {f.isFinalized ? "View →" : "Resume →"}
                        </Link>
                        <button
                          onClick={() => handleDelete(f.id, f.companyName)}
                          disabled={deleting === f.id}
                          className="px-2.5 py-1.5 text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 rounded-lg transition-colors disabled:opacity-40"
                        >
                          {deleting === f.id ? "…" : "Delete"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
