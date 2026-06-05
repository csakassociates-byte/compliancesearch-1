"use client";
import { useState } from "react";
import Link from "next/link";
import { Shield, Plus, Edit3, Trash2, Save, X, ExternalLink, ToggleLeft, ToggleRight } from "lucide-react";

type CalendarEvent = {
  id: string; title: string; description: string | null;
  category: string; authority: string; recurrence: string;
  dueDay: number | null; dueMonth: number | null;
  specificDate: string | null; penalty: string | null;
  link: string | null; isActive: boolean;
  createdAt: string; updatedAt: string;
};

const CATEGORIES = [
  { key: "central_tax",     label: "GST / Income Tax" },
  { key: "mca_roc",         label: "MCA / ROC" },
  { key: "labor_law",       label: "Labour Law" },
  { key: "import_export",   label: "FEMA / Import" },
  { key: "msme_startup",    label: "MSME / Startup" },
  { key: "environmental",   label: "Environment" },
  { key: "other",           label: "Other" },
];
const RECURRENCES = ["monthly","quarterly","annual","one-time"];
const MONTHS = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const blankForm = {
  title: "", description: "", category: "central_tax",
  authority: "", recurrence: "monthly", dueDay: "",
  dueMonth: "", specificDate: "", penalty: "", link: "",
};

export default function AdminCalendarClient({ events: initialEvents }: { events: CalendarEvent[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState("all");

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => { setForm(blankForm); setEditingId(null); setShowForm(true); };
  const openEdit = (e: CalendarEvent) => {
    setForm({
      title: e.title, description: e.description || "",
      category: e.category, authority: e.authority,
      recurrence: e.recurrence, dueDay: e.dueDay?.toString() || "",
      dueMonth: e.dueMonth?.toString() || "",
      specificDate: e.specificDate ? e.specificDate.split("T")[0] : "",
      penalty: e.penalty || "", link: e.link || "",
    });
    setEditingId(e.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.category || !form.authority) return;
    setSaving(true);
    const payload = {
      ...form,
      dueDay: form.dueDay ? Number(form.dueDay) : null,
      dueMonth: form.dueMonth ? Number(form.dueMonth) : null,
    };
    const url = editingId ? `/api/admin/calendar/${editingId}` : "/api/admin/calendar";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      if (editingId) {
        setEvents(prev => prev.map(e => e.id === editingId ? data : e));
      } else {
        setEvents(prev => [...prev, data]);
      }
      setShowForm(false);
    }
    setSaving(false);
  };

  const handleToggle = async (event: CalendarEvent) => {
    setLoading(event.id);
    const res = await fetch(`/api/admin/calendar/${event.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...event, isActive: !event.isActive }),
    });
    if (res.ok) {
      const data = await res.json();
      setEvents(prev => prev.map(e => e.id === event.id ? data : e));
    }
    setLoading(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    setLoading(id);
    await fetch(`/api/admin/calendar/${id}`, { method: "DELETE" });
    setEvents(prev => prev.filter(e => e.id !== id));
    setLoading(null);
  };

  const filtered = events.filter(e => filterCat === "all" || e.category === filterCat);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-900">Compliance Calendar</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/dashboard" className="text-sm font-medium text-slate-600 px-3 py-1.5 rounded-lg border hover:bg-slate-50">
            ← Rules
          </Link>
          <Link href="/admin/blog" className="text-sm font-medium text-slate-600 px-3 py-1.5 rounded-lg border hover:bg-slate-50">
            📝 Blog
          </Link>
          <Link href="/calendar" target="_blank" className="text-sm font-medium text-blue-600 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 flex items-center gap-1">
            <ExternalLink className="w-3.5 h-3.5" /> View Calendar
          </Link>
          <button onClick={openAdd}
            className="flex items-center gap-2 text-sm font-bold text-white px-4 py-1.5 rounded-lg"
            style={{ background: "#1d4ed8" }}>
            <Plus className="w-4 h-4" /> Add Event
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 border text-center">
            <div className="text-2xl font-extrabold text-slate-900">{events.length}</div>
            <div className="text-sm text-slate-500">Total Events</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border text-center">
            <div className="text-2xl font-extrabold text-green-600">{events.filter(e => e.isActive).length}</div>
            <div className="text-sm text-slate-500">Active</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border text-center">
            <div className="text-2xl font-extrabold text-slate-400">{events.filter(e => !e.isActive).length}</div>
            <div className="text-sm text-slate-500">Inactive</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setFilterCat("all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition ${filterCat === "all" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200"}`}>
            All ({events.length})
          </button>
          {CATEGORIES.map(c => {
            const count = events.filter(e => e.category === c.key).length;
            if (!count) return null;
            return (
              <button key={c.key} onClick={() => setFilterCat(c.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition ${filterCat === c.key ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200"}`}>
                {c.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Title</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Recurrence</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Due</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Authority</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Active</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-400">No events. Add one!</td></tr>
                )}
                {filtered.map(event => (
                  <tr key={event.id} className={`border-b border-slate-50 hover:bg-slate-50 transition ${!event.isActive ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{event.title}</p>
                      {event.description && <p className="text-xs text-slate-400 mt-0.5">{event.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700 capitalize">
                        {CATEGORIES.find(c => c.key === event.category)?.label || event.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600">{event.recurrence}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {event.recurrence === "monthly" && event.dueDay && `Every ${event.dueDay}th`}
                      {event.recurrence === "annual" && event.dueDay && event.dueMonth && `${event.dueDay} ${MONTHS[event.dueMonth]}`}
                      {event.recurrence === "quarterly" && event.dueDay && `${event.dueDay}th (quarterly)`}
                      {event.recurrence === "one-time" && event.specificDate && new Date(event.specificDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{event.authority}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleToggle(event)} disabled={loading === event.id} className="transition">
                        {event.isActive
                          ? <ToggleRight className="w-6 h-6 text-green-500" />
                          : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEdit(event)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(event.id)} disabled={loading === event.id}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">{editingId ? "Edit Event" : "Add Calendar Event"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Title *</label>
                <input value={form.title} onChange={e => set("title", e.target.value)}
                  placeholder="e.g. GSTR-3B Monthly Return"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <input value={form.description} onChange={e => set("description", e.target.value)}
                  placeholder="Brief description (optional)"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Category *</label>
                <select value={form.category} onChange={e => set("category", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white">
                  {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Authority *</label>
                <input value={form.authority} onChange={e => set("authority", e.target.value)}
                  placeholder="e.g. CBIC, MCA, EPFO"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Recurrence</label>
                <select value={form.recurrence} onChange={e => set("recurrence", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white">
                  {RECURRENCES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                </select>
              </div>
              {form.recurrence !== "one-time" ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Due Day (1-31)</label>
                    <input type="number" min="1" max="31" value={form.dueDay} onChange={e => set("dueDay", e.target.value)}
                      placeholder="e.g. 20"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  </div>
                  {form.recurrence === "annual" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Due Month</label>
                      <select value={form.dueMonth} onChange={e => set("dueMonth", e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white">
                        <option value="">Select month</option>
                        {MONTHS.slice(1).map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                      </select>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Specific Date</label>
                  <input type="date" value={form.specificDate} onChange={e => set("specificDate", e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Penalty</label>
                <input value={form.penalty} onChange={e => set("penalty", e.target.value)}
                  placeholder="e.g. ₹50/day, 18% interest"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Portal Link</label>
                <input type="url" value={form.link} onChange={e => set("link", e.target.value)}
                  placeholder="https://gst.gov.in"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving || !form.title || !form.authority}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white disabled:opacity-50 transition"
                style={{ background: "#1d4ed8" }}>
                <Save className="w-4 h-4" /> {saving ? "Saving..." : editingId ? "Update Event" : "Add Event"}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-6 py-3 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
