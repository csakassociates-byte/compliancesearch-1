"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  isActive: boolean;
  createdAt: string;
}

const AUTHORITIES = ["CBDT","CBIC","MCA","SEBI","RBI","IBBI","Labour","FSSAI","IRDAI","CCI","Other"];
const NOTICE_TYPES = ["notification","circular","amendment","press_release","order"];

const EMPTY_FORM = {
  title:"", summary:"", content:"", authority:"MCA",
  noticeType:"notification", refNumber:"", actName:"", issuedDate: new Date().toISOString().split("T")[0],
};

export default function AdminNoticePage() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{type:"ok"|"err"; text:string}|null>(null);

  async function loadNotices() {
    setLoading(true);
    const r = await fetch("/api/admin/notice");
    if (r.status === 401) { router.push("/admin/login"); return; }
    const data = await r.json();
    setNotices(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { loadNotices(); }, []); // eslint-disable-line

  function openCreate() {
    setEditId(null);
    setForm({ ...EMPTY_FORM, issuedDate: new Date().toISOString().split("T")[0] });
    setShowForm(true);
    setMsg(null);
  }

  function openEdit(n: Notice) {
    setEditId(n.id);
    setForm({
      title: n.title, summary: n.summary, content: n.content,
      authority: n.authority, noticeType: n.noticeType,
      refNumber: n.refNumber || "", actName: n.actName || "",
      issuedDate: n.issuedDate.split("T")[0],
    });
    setShowForm(true);
    setMsg(null);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.summary.trim() || !form.content.trim()) {
      setMsg({ type:"err", text:"Title, Summary and Content are required." }); return;
    }
    setSaving(true);
    const url  = editId ? `/api/admin/notice/${editId}` : "/api/admin/notice";
    const method = editId ? "PUT" : "POST";
    const r = await fetch(url, {
      method,
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (r.ok) {
      setMsg({ type:"ok", text: editId ? "Notice updated!" : "Notice published!" });
      setShowForm(false);
      loadNotices();
    } else {
      const d = await r.json();
      setMsg({ type:"err", text: d.error || "Failed to save." });
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete notice: "${title}"?`)) return;
    const r = await fetch(`/api/admin/notice/${id}`, { method:"DELETE" });
    if (r.ok) loadNotices();
  }

  async function toggleActive(n: Notice) {
    await fetch(`/api/admin/notice/${n.id}`, {
      method:"PUT",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ isActive: !n.isActive }),
    });
    loadNotices();
  }

  const inp = "w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white";
  const sel = "w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="text-slate-400 hover:text-slate-700 text-sm">← Dashboard</Link>
          <h1 className="text-lg font-extrabold text-slate-900">🔔 Notice Management</h1>
          <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2.5 py-1 rounded-full border border-amber-200">
            {notices.length} Notices
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/notice" target="_blank"
            className="text-xs text-blue-600 hover:underline font-semibold">
            View Public Page ↗
          </Link>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm transition hover:scale-105"
            style={{ background:"linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
            + Post New Notice
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Flash message */}
        {msg && (
          <div className={`mb-5 p-4 rounded-xl text-sm font-semibold border ${msg.type==="ok"?"bg-green-50 border-green-200 text-green-700":"bg-red-50 border-red-200 text-red-700"}`}>
            {msg.type==="ok"?"✅":"❌"} {msg.text}
          </div>
        )}

        {/* ── Create / Edit Form ── */}
        {showForm && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-extrabold text-slate-900">{editId ? "✏️ Edit Notice" : "📝 Post New Notice"}</h2>
              <button onClick={() => { setShowForm(false); setMsg(null); }} className="text-slate-400 hover:text-slate-700 text-xl">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">Title *</label>
                <input className={inp} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. CBDT extends ITR filing deadline to 31 Dec 2025"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Authority *</label>
                <select className={sel} value={form.authority} onChange={e=>setForm(f=>({...f,authority:e.target.value}))}>
                  {AUTHORITIES.map(a=><option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Notice Type</label>
                <select className={sel} value={form.noticeType} onChange={e=>setForm(f=>({...f,noticeType:e.target.value}))}>
                  {NOTICE_TYPES.map(t=><option key={t} value={t} className="capitalize">{t.replace("_"," ")}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Reference / Circular No. (optional)</label>
                <input className={inp} value={form.refNumber} onChange={e=>setForm(f=>({...f,refNumber:e.target.value}))} placeholder="e.g. Circular No. 12/2025"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Issued Date</label>
                <input type="date" className={inp} value={form.issuedDate} onChange={e=>setForm(f=>({...f,issuedDate:e.target.value}))}/>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">Act / Law Name (optional)</label>
                <input className={inp} value={form.actName} onChange={e=>setForm(f=>({...f,actName:e.target.value}))} placeholder="e.g. Income Tax Act 1961, Companies Act 2013, GST Act"/>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">Summary * <span className="text-slate-400 font-normal">(shown on listing page — 1–3 sentences)</span></label>
                <textarea className={`${inp} h-20 resize-none`} value={form.summary} onChange={e=>setForm(f=>({...f,summary:e.target.value}))} placeholder="Brief summary of the notice — what has changed and who is affected..."/>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">Full Content * <span className="text-slate-400 font-normal">(shown when user expands notice)</span></label>
                <textarea className={`${inp} h-40 resize-y`} value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} placeholder="Detailed notice content, key points, effective dates, who is affected, what action is needed..."/>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition hover:scale-105 disabled:opacity-60"
                style={{ background:"linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
                {saving ? "Saving..." : editId ? "💾 Update Notice" : "🚀 Publish Notice"}
              </button>
              <button onClick={() => { setShowForm(false); setMsg(null); }}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 border-2 border-slate-200 text-sm hover:bg-slate-50 transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Notices Table ── */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i=><div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-slate-200"/>)}
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-slate-500 font-medium mb-4">No notices posted yet.</p>
            <button onClick={openCreate}
              className="px-6 py-3 rounded-xl font-bold text-white text-sm"
              style={{ background:"linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
              Post First Notice
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {notices.map(n => (
              <div key={n.id} className={`bg-white border rounded-2xl p-5 flex items-start gap-4 ${!n.isActive?"opacity-60 border-slate-100":"border-slate-200"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">{n.authority}</span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 capitalize">{n.noticeType.replace("_"," ")}</span>
                    {!n.isActive && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600 border border-red-200">Hidden</span>}
                    {n.refNumber && <span className="text-xs text-slate-400 font-mono">{n.refNumber}</span>}
                    <span className="text-xs text-slate-400 ml-auto">{new Date(n.issuedDate).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span>
                  </div>
                  <p className="font-bold text-slate-800 text-sm mb-1 leading-snug">{n.title}</p>
                  {n.actName && <p className="text-xs text-amber-600 font-medium mb-1">📋 {n.actName}</p>}
                  <p className="text-slate-500 text-xs line-clamp-2">{n.summary}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleActive(n)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${n.isActive?"border-green-200 text-green-700 bg-green-50 hover:bg-green-100":"border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                    {n.isActive ? "✓ Live" : "○ Hidden"}
                  </button>
                  <button onClick={() => openEdit(n)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(n.id, n.title)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
