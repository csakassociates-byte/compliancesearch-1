"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

/* ─── types ────────────────────────────────── */
interface Notice {
  id: string;
  title: string;
  summary: string;
  content: string;
  authority: string;
  noticeType: string;
  refNumber: string | null;
  actName: string | null;
  issuedDate: string;
  createdAt: string;
}

/* ─── constants ─────────────────────────────── */
const AUTHORITIES = ["All","CBDT","CBIC","MCA","SEBI","RBI","IBBI","Labour","FSSAI","IRDAI","CCI","Other"];
const NOTICE_TYPES = ["All","notification","circular","amendment","press_release","order"];

const AUTH_COLOR: Record<string,string> = {
  CBDT:"bg-blue-100 text-blue-700 border-blue-200",
  CBIC:"bg-green-100 text-green-700 border-green-200",
  MCA:"bg-purple-100 text-purple-700 border-purple-200",
  SEBI:"bg-orange-100 text-orange-700 border-orange-200",
  RBI:"bg-red-100 text-red-700 border-red-200",
  IBBI:"bg-cyan-100 text-cyan-700 border-cyan-200",
  Labour:"bg-yellow-100 text-yellow-700 border-yellow-200",
  FSSAI:"bg-lime-100 text-lime-700 border-lime-200",
  IRDAI:"bg-indigo-100 text-indigo-700 border-indigo-200",
  CCI:"bg-rose-100 text-rose-700 border-rose-200",
  Other:"bg-slate-100 text-slate-600 border-slate-200",
};

const TYPE_LABEL: Record<string,string> = {
  notification:"Notification",
  circular:"Circular",
  amendment:"Amendment",
  press_release:"Press Release",
  order:"Order",
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN",{ day:"numeric", month:"short", year:"numeric" });
}

/* ─── page ──────────────────────────────────── */
export default function NoticePage() {
  const [notices,   setNotices]   = useState<Notice[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [authority, setAuthority] = useState("All");
  const [typeF,     setTypeF]     = useState("All");
  const [expanded,  setExpanded]  = useState<string|null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (authority !== "All") params.set("authority", authority);
    if (typeF     !== "All") params.set("type",      typeF);
    fetch(`/api/notice?${params}`)
      .then(r => r.json())
      .then(data => { setNotices(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [authority, typeF]);

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="py-12 px-4 text-center border-b border-slate-100"
        style={{ background:"linear-gradient(160deg,#fef9c3 0%,#fefce8 50%,#fafafa 100%)" }}>
        <div className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full mb-4 border"
          style={{ background:"#fefce8", borderColor:"#fde047", color:"#713f12" }}>
          🔔 Latest Regulatory Updates
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-3 leading-tight">
          Regulatory <span style={{ background:"linear-gradient(90deg,#ca8a04,#d97706)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Notices</span>
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto text-base leading-relaxed">
          Latest circulars, notifications, amendments and orders from CBDT, CBIC, MCA, SEBI, RBI and other regulatory bodies.
        </p>
        <p className="text-xs text-slate-400 mt-2">Updated regularly by our compliance team</p>
      </section>

      <div className="max-w-4xl mx-auto w-full px-4 py-8 flex-1">

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-1.5">Authority</p>
            <div className="flex flex-wrap gap-1.5">
              {AUTHORITIES.map(a => (
                <button key={a} onClick={() => setAuthority(a)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${authority===a?"border-amber-400 bg-amber-50 text-amber-700":"border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-1.5">Type</p>
            <div className="flex flex-wrap gap-1.5">
              {NOTICE_TYPES.map(t => (
                <button key={t} onClick={() => setTypeF(t)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all capitalize ${typeF===t?"border-amber-400 bg-amber-50 text-amber-700":"border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                  {t==="All"?"All Types":TYPE_LABEL[t]||t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notice Count */}
        <p className="text-sm text-slate-400 mb-5">
          {loading ? "Loading..." : `${notices.length} notice${notices.length!==1?"s":""} found`}
        </p>

        {/* List */}
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i=>(
              <div key={i} className="bg-slate-100 rounded-2xl h-32 animate-pulse"/>
            ))}
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-slate-500 font-medium">No notices found for the selected filters.</p>
            <button onClick={() => { setAuthority("All"); setTypeF("All"); }}
              className="mt-3 text-sm text-blue-600 hover:underline">Clear filters</button>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map(n => (
              <article key={n.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${AUTH_COLOR[n.authority]||AUTH_COLOR.Other}`}>
                      {n.authority}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 capitalize">
                      {TYPE_LABEL[n.noticeType]||n.noticeType}
                    </span>
                    {n.refNumber && (
                      <span className="text-xs font-mono text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
                        Ref: {n.refNumber}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-slate-400 font-medium">{fmt(n.issuedDate)}</span>
                  </div>

                  <h2 className="font-extrabold text-slate-900 text-base mb-2 leading-snug">{n.title}</h2>
                  {n.actName && (
                    <p className="text-xs text-amber-700 font-semibold mb-2 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg inline-block">
                      📋 {n.actName}
                    </p>
                  )}
                  <p className="text-slate-600 text-sm leading-relaxed">{n.summary}</p>
                </div>

                {/* Expand toggle */}
                <div className="border-t border-slate-100">
                  <button
                    onClick={() => setExpanded(expanded===n.id ? null : n.id)}
                    className="w-full flex items-center justify-between px-5 py-3 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors">
                    {expanded===n.id ? "Hide details ▲" : "Read full notice ▼"}
                  </button>
                  {expanded===n.id && (
                    <div className="px-5 pb-5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap border-t border-slate-100 bg-slate-50">
                      <div className="pt-4">{n.content}</div>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-10 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-700">
          <strong>Disclaimer:</strong> Notices posted here are for general awareness only. Always verify from official government portals (incometax.gov.in, gst.gov.in, mca.gov.in, sebi.gov.in, rbi.org.in) before taking any compliance action. Consult a qualified CA or CS for specific advice.
        </div>
      </div>

      <footer className="border-t border-slate-200 py-6 px-4 mt-auto">
        <div className="max-w-4xl mx-auto text-center text-sm text-slate-400">
          © {new Date().getFullYear()} ComplianceSearch.in — Powered by{" "}
          <a href="https://geebharat.com" className="text-amber-600 hover:underline">Gee Bharat</a>
          {" · "}
          <Link href="/check" className="text-blue-500 hover:underline">Check Compliance</Link>
          {" · "}
          <Link href="/tools/business-valuation" className="text-purple-500 hover:underline">Valuation Tool</Link>
        </div>
      </footer>
    </main>
  );
}
