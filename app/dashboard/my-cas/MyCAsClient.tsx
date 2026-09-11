"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface CA {
  id: string;
  auditorType: string;
  firmName: string;
  frn: string;
  partnerName: string;
  membershipNo: string;
  partnerDesignation: string;
  auditorAddress: string;
  auditorCity: string;
  place?: string;
  auditorEmail: string;
  auditorMobile: string;
  remuneration: string;
  isActive: boolean;
  updatedAt: string;
}

const EMPTY: Omit<CA, "id" | "updatedAt"> = {
  auditorType: "firm",
  firmName: "", frn: "", partnerName: "", membershipNo: "",
  partnerDesignation: "Partner", auditorAddress: "", auditorCity: "",
  auditorEmail: "", auditorMobile: "", remuneration: "", isActive: true,
};

function ic(extra = "") {
  return `w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white ${extra}`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

export default function MyCAsClient() {
  const [cas, setCas] = useState<CA[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CA | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "found" | "not_found">("idle");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/auditors");
    const d = await r.json() as { auditors?: CA[] };
    setCas(d.auditors ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY });
    setLookupStatus("idle");
    setShowModal(true);
  }

  function openEdit(ca: CA) {
    setEditing(ca);
    setForm({
      auditorType: ca.auditorType || "firm",
      firmName: ca.firmName || "",
      frn: ca.frn || "",
      partnerName: ca.partnerName || "",
      membershipNo: ca.membershipNo || "",
      partnerDesignation: ca.partnerDesignation || "Partner",
      auditorAddress: ca.auditorAddress || "",
      auditorCity: ca.auditorCity || "",
      auditorEmail: ca.auditorEmail || "",
      auditorMobile: ca.auditorMobile || "",
      remuneration: ca.remuneration || "",
      isActive: ca.isActive ?? true,
    });
    setLookupStatus("idle");
    setShowModal(true);
  }

  async function lookupMembership(mno: string) {
    if (mno.trim().length < 3) { setLookupStatus("idle"); return; }
    setLookupStatus("loading");
    try {
      const r = await fetch(`/api/auditors/lookup?membership=${encodeURIComponent(mno.trim())}`);
      const d = await r.json() as { ca: Partial<CA> | null };
      if (d.ca) {
        const ca = d.ca;
        setForm(p => ({
          ...p,
          auditorType: (ca.auditorType as string) || p.auditorType,
          firmName: ca.firmName || p.firmName,
          frn: ca.frn || p.frn,
          partnerName: ca.partnerName || p.partnerName,
          partnerDesignation: ca.partnerDesignation || p.partnerDesignation,
          auditorAddress: ca.auditorAddress || p.auditorAddress,
          auditorCity: ca.auditorCity || ca.place as string || p.auditorCity,
          auditorEmail: ca.auditorEmail || p.auditorEmail,
          auditorMobile: ca.auditorMobile || p.auditorMobile,
        }));
        setLookupStatus("found");
      } else {
        setLookupStatus("not_found");
      }
    } catch {
      setLookupStatus("idle");
    }
  }

  async function handleSave() {
    if (!form.firmName.trim() && !form.partnerName.trim()) return;
    setSaving(true);
    const url = editing ? `/api/auditors/${editing.id}` : "/api/auditors";
    const method = editing ? "PUT" : "POST";
    try {
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firmName: form.auditorType === "individual" ? form.partnerName : form.firmName,
          frn: form.frn,
          partnerName: form.partnerName,
          membershipNo: form.membershipNo,
          partnerDesignation: form.partnerDesignation,
          auditorType: form.auditorType,
          auditorAddress: form.auditorAddress,
          auditorCity: form.auditorCity,
          auditorEmail: form.auditorEmail,
          auditorMobile: form.auditorMobile,
          remuneration: form.remuneration,
          isActive: form.isActive,
        }),
      });
      setShowModal(false);
      await load();
    } catch {
      // silently handle
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/auditors/${id}`, { method: "DELETE" });
    setDeleteId(null);
    await load();
  }

  const filtered = cas.filter(ca =>
    [ca.firmName, ca.partnerName, ca.membershipNo, ca.frn, ca.auditorCity]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/dashboard" className="hover:text-teal-600">Dashboard</Link>
            <span>/</span>
            <span className="text-slate-700 font-medium">My CA List</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">My CA List</h1>
          <p className="text-sm text-slate-500 mt-1">
            Saved auditors and CA firms. Add once — auto-fills in all tools.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold transition-all shadow-sm whitespace-nowrap"
        >
          + Add CA / Firm
        </button>
      </div>

      {/* Info banner */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
        <strong>How it works:</strong> Enter a membership number while adding — if this CA was added by any ComplianceSearch.in user before, details will auto-fill instantly. You can always edit before saving.
      </div>

      {/* Search */}
      {cas.length > 0 && (
        <input
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-teal-400"
          placeholder="Search by firm name, partner name, membership no, city…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <p className="text-slate-400 text-sm mb-4">
            {cas.length === 0 ? "No CAs saved yet. Add your first CA below." : "No results found."}
          </p>
          {cas.length === 0 && (
            <button
              onClick={openAdd}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold"
            >
              + Add CA / Firm
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map(ca => (
            <div key={ca.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                      {ca.auditorType === "individual" ? "Individual CA" : "CA Firm"}
                    </span>
                    {!ca.isActive && (
                      <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                        Inactive
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800 text-base truncate">
                    {ca.auditorType === "individual" ? ca.partnerName || ca.firmName : ca.firmName}
                  </h3>
                  {ca.auditorType === "firm" && ca.frn && (
                    <p className="text-xs text-slate-500 mt-0.5">FRN: {ca.frn}</p>
                  )}
                  {ca.auditorType === "firm" && ca.partnerName && (
                    <p className="text-xs text-slate-600 mt-0.5">
                      {ca.partnerDesignation || "Partner"}: {ca.partnerName}
                      {ca.membershipNo ? ` (M.No. ${ca.membershipNo})` : ""}
                    </p>
                  )}
                  {ca.auditorType === "individual" && ca.membershipNo && (
                    <p className="text-xs text-slate-500 mt-0.5">M.No. {ca.membershipNo}</p>
                  )}
                </div>
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-500 border-t border-slate-100 pt-3">
                {ca.auditorCity && <p>📍 {ca.auditorCity}{ca.auditorAddress ? `, ${ca.auditorAddress}` : ""}</p>}
                {ca.auditorMobile && <p>📞 {ca.auditorMobile}</p>}
                {ca.auditorEmail && <p>✉️ {ca.auditorEmail}</p>}
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => openEdit(ca)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteId(ca.id)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tools that use CA list */}
      <div className="mt-10 bg-slate-50 rounded-2xl p-5 border border-slate-200">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Used in these tools</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Auditor Appointment", href: "/tools/corporate-action-kit/auditor-appointment" },
            { label: "Annual Filing", href: "/tools/documents/annual-filing" },
          ].map(t => (
            <Link key={t.href} href={t.href}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-teal-700 hover:border-teal-300 transition-colors">
              {t.label} →
            </Link>
          ))}
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-base font-bold text-slate-800">
                {editing ? "Edit CA" : "Add CA / Firm"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>

            <div className="px-6 py-5 space-y-4">

              {/* Type toggle */}
              <div className="flex gap-2">
                {["firm", "individual"].map(t => (
                  <button key={t}
                    onClick={() => setForm(p => ({ ...p, auditorType: t }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      form.auditorType === t
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
                    }`}>
                    {t === "firm" ? "CA Firm" : "Individual CA"}
                  </button>
                ))}
              </div>

              {/* Membership number — with cross-user lookup */}
              <Field label="Membership Number">
                <div className="relative">
                  <input
                    className={ic()}
                    value={form.membershipNo}
                    placeholder="e.g. 416816"
                    onChange={e => {
                      const v = e.target.value;
                      setForm(p => ({ ...p, membershipNo: v }));
                      setLookupStatus("idle");
                    }}
                    onBlur={e => lookupMembership(e.target.value)}
                  />
                  {lookupStatus === "loading" && (
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400">Searching…</span>
                  )}
                </div>
                {lookupStatus === "found" && (
                  <p className="text-xs text-emerald-600 font-semibold mt-1">
                    ✓ Details auto-filled from CA directory
                  </p>
                )}
                {lookupStatus === "not_found" && (
                  <p className="text-xs text-slate-400 mt-1">
                    Not found in directory — fill details manually below.
                  </p>
                )}
              </Field>

              {/* Firm-specific fields */}
              {form.auditorType === "firm" && (
                <>
                  <Field label="Firm Name">
                    <input className={ic()} value={form.firmName}
                      placeholder="M/s ABC & Co."
                      onChange={e => setForm(p => ({ ...p, firmName: e.target.value }))} />
                  </Field>
                  <Field label="FRN (Firm Registration Number)">
                    <input className={ic()} value={form.frn}
                      placeholder="001234W"
                      onChange={e => setForm(p => ({ ...p, frn: e.target.value }))} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Signing Partner Name">
                      <input className={ic()} value={form.partnerName}
                        placeholder="CA Priya Sharma"
                        onChange={e => setForm(p => ({ ...p, partnerName: e.target.value }))} />
                    </Field>
                    <Field label="Designation">
                      <select className={ic()} value={form.partnerDesignation}
                        onChange={e => setForm(p => ({ ...p, partnerDesignation: e.target.value }))}>
                        <option>Partner</option>
                        <option>Proprietor</option>
                      </select>
                    </Field>
                  </div>
                </>
              )}

              {/* Individual-specific fields */}
              {form.auditorType === "individual" && (
                <Field label="CA Name">
                  <input className={ic()} value={form.partnerName || form.firmName}
                    placeholder="CA Ravi Kumar"
                    onChange={e => setForm(p => ({ ...p, partnerName: e.target.value, firmName: e.target.value }))} />
                </Field>
              )}

              {/* Contact details */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="City">
                  <input className={ic()} value={form.auditorCity}
                    placeholder="Mumbai"
                    onChange={e => setForm(p => ({ ...p, auditorCity: e.target.value }))} />
                </Field>
                <Field label="Mobile">
                  <input className={ic()} value={form.auditorMobile}
                    placeholder="+91 98765 43210"
                    onChange={e => setForm(p => ({ ...p, auditorMobile: e.target.value }))} />
                </Field>
              </div>
              <Field label="Office Address">
                <input className={ic()} value={form.auditorAddress}
                  placeholder="123, ABC Road, Andheri"
                  onChange={e => setForm(p => ({ ...p, auditorAddress: e.target.value }))} />
              </Field>
              <Field label="Email ID">
                <input className={ic()} value={form.auditorEmail}
                  placeholder="audit@firm.com"
                  onChange={e => setForm(p => ({ ...p, auditorEmail: e.target.value }))} />
              </Field>
              <Field label="Remuneration (optional)">
                <input className={ic()} value={form.remuneration}
                  placeholder="e.g. 25,000 or leave blank"
                  onChange={e => setForm(p => ({ ...p, remuneration: e.target.value }))} />
              </Field>

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive ? "bg-teal-500" : "bg-slate-300"}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isActive ? "translate-x-5" : ""}`} />
                </div>
                <span className="text-sm text-slate-600">Currently active / practicing</span>
              </label>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-3 rounded-b-2xl">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || (!form.firmName.trim() && !form.partnerName.trim())}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold disabled:opacity-50 transition-all">
                {saving ? "Saving…" : editing ? "Save Changes" : "Add to My List"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="font-bold text-slate-800 mb-2">Remove from My CA List?</h3>
            <p className="text-sm text-slate-500 mb-6">This only removes from your list. The CA remains in the shared directory for other users.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
