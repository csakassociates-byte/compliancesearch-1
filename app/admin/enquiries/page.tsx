"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Enquiry {
  id: string; name: string; email: string; mobile: string;
  company_name: string | null; query_type: string; message: string;
  status: string; source: string; created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  new:     "bg-red-100 text-red-700 border-red-200",
  replied: "bg-blue-100 text-blue-700 border-blue-200",
  closed:  "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const QUERY_LABELS: Record<string, string> = {
  general: "General", pricing: "Pricing", tool_support: "Tool Support",
  technical: "Technical", partnership: "Partnership",
};

export default function AdminEnquiriesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "new" | "replied" | "closed">("all");
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/enquiries");
    if (r.status === 401) { router.push("/admin/login"); return; }
    const data = await r.json();
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    await fetch(`/api/admin/enquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setRows(r => r.map(e => e.id === id ? { ...e, status } : e));
    setUpdating(null);
  }

  const filtered = filter === "all" ? rows : rows.filter(r => r.status === filter);
  const counts = { all: rows.length, new: rows.filter(r => r.status === "new").length, replied: rows.filter(r => r.status === "replied").length, closed: rows.filter(r => r.status === "closed").length };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-slate-400 hover:text-slate-700 text-sm">← Dashboard</Link>
          <span className="text-slate-300">|</span>
          <h1 className="text-slate-800 font-bold text-lg">Enquiries</h1>
          {counts.new > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{counts.new} New</span>
          )}
        </div>
        <button onClick={load} className="text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition">
          🔄 Refresh
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-5">
          {(["all", "new", "replied", "closed"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${filter === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${filter === s ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                {counts[s]}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading enquiries…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-medium">{filter === "all" ? "No enquiries yet" : `No ${filter} enquiries`}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(eq => (
              <div key={eq.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Row header */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition"
                  onClick={() => setExpanded(prev => prev === eq.id ? null : eq.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 text-sm">{eq.name}</span>
                      {eq.company_name && <span className="text-xs text-slate-500">· {eq.company_name}</span>}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[eq.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                        {eq.status.toUpperCase()}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        {QUERY_LABELS[eq.query_type] || eq.query_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <a href={`tel:${eq.mobile}`} className="text-xs text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>📱 {eq.mobile}</a>
                      <a href={`mailto:${eq.email}`} className="text-xs text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>✉️ {eq.email}</a>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-400">{new Date(eq.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    <p className="text-[10px] text-slate-300">{new Date(eq.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <div className="text-slate-300 text-xs">{expanded === eq.id ? "▲" : "▼"}</div>
                </div>

                {/* Expanded detail */}
                {expanded === eq.id && (
                  <div className="border-t border-slate-100 px-5 py-4 bg-slate-50">
                    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Message</p>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{eq.message}</p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-xs text-slate-500 font-semibold">Update Status:</p>
                      {["new", "replied", "closed"].map(s => (
                        <button key={s} disabled={eq.status === s || updating === eq.id}
                          onClick={() => updateStatus(eq.id, s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${eq.status === s ? STATUS_COLORS[s] : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"}`}>
                          {updating === eq.id ? "…" : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                      <div className="flex-1" />
                      <a href={`mailto:${eq.email}?subject=Re: Your Enquiry on ComplianceSearch.in`}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition">
                        ✉️ Reply via Email
                      </a>
                      <a href={`tel:${eq.mobile}`}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition">
                        📱 Call
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
