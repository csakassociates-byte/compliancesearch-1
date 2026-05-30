"use client";

import { useState, useMemo } from "react";
import { signOut } from "next-auth/react";
import {
  Shield, LogOut, Search, Filter, ChevronDown, ChevronUp,
  Edit3, Save, X, Check, AlertCircle, ToggleLeft, ToggleRight,
  RefreshCw
} from "lucide-react";
import {
  extractThresholds,
  updateThreshold,
  conditionLabel,
  type ConditionNode,
} from "@/lib/condition-engine";

type Rule = {
  id: string;
  ruleKey: string;
  name: string;
  shortName: string;
  category: string;
  authority: string;
  description: string;
  howToComply: string;
  frequency: string;
  dueDate: string | null;
  penalty: string | null;
  priority: string;
  isActive: boolean;
  tags: string;
  conditionJson: string;
  documentsJson: string;
  registrationLink: string | null;
};

function getDocs(rule: Rule): string[] {
  try { return JSON.parse(rule.documentsJson) as string[]; }
  catch { return []; }
}

const CATEGORY_LABELS: Record<string, string> = {
  central_tax:      "Central Tax",
  mca_roc:          "MCA / ROC",
  labor_law:        "Labour Law",
  industry_license: "Industry Licenses",
  environmental:    "Environmental",
  state_compliance: "State Compliance",
  import_export:    "Import / Export",
  msme_startup:     "MSME / Startup",
  financial_sector: "Financial Sector",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-600 border-red-200",
  high:     "bg-orange-100 text-orange-600 border-orange-200",
  medium:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  low:      "bg-green-100 text-green-700 border-green-200",
};

export default function AdminDashboardClient({ rules: initialRules }: { rules: Rule[] }) {
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Rule>>({});
  const [thresholdEdits, setThresholdEdits] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = useMemo(
    () => [...new Set(rules.map((r) => r.category))].sort(),
    [rules]
  );

  const filtered = useMemo(() => {
    return rules.filter((r) => {
      const matchCat = categoryFilter === "all" || r.category === categoryFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.shortName.toLowerCase().includes(q) ||
        r.authority.toLowerCase().includes(q) ||
        r.tags.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [rules, search, categoryFilter]);

  function startEdit(rule: Rule) {
    setEditingId(rule.id);
    setEditData({ ...rule });
    setThresholdEdits({});
    setExpandedId(rule.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditData({});
    setThresholdEdits({});
  }

  function getThresholds(conditionJson: string) {
    try {
      const node = JSON.parse(conditionJson) as ConditionNode;
      return extractThresholds(node);
    } catch {
      return [];
    }
  }

  function getConditionLabel(conditionJson: string) {
    try {
      const node = JSON.parse(conditionJson) as ConditionNode;
      return conditionLabel(node);
    } catch {
      return conditionJson;
    }
  }

  async function saveRule(rule: Rule) {
    if (!editingId) return;
    setSaving(true);
    setSaveStatus("idle");

    let conditionJson = editData.conditionJson || rule.conditionJson;
    try {
      let node = JSON.parse(conditionJson) as ConditionNode;
      const thresholds = extractThresholds(node);
      for (const [idxStr, newVal] of Object.entries(thresholdEdits)) {
        const t = thresholds[Number(idxStr)];
        if (t) node = updateThreshold(node, t.path, newVal) as ConditionNode;
      }
      conditionJson = JSON.stringify(node);
    } catch { /* keep original */ }

    const payload = { ...editData, conditionJson };

    try {
      const res = await fetch(`/api/admin/rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      const updated = await res.json();
      setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSaveStatus("success");
      setEditingId(null);
      setEditData({});
      setThresholdEdits({});
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(rule: Rule) {
    try {
      const res = await fetch(`/api/admin/rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch {
      alert("Failed to toggle rule status");
    }
  }

  const activeCount = rules.filter((r) => r.isActive).length;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #fff5f7 0%, #fdf2f8 40%, #fff8f9 100%)" }}>

      {/* Header */}
      <header className="bg-white border-b border-pink-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f472b6, #a855f7)" }}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-800">Compliance Admin Panel</h1>
              <p className="text-xs text-pink-400">{activeCount} active rules</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {saveStatus === "success" && (
              <span className="text-green-600 text-sm flex items-center gap-1 font-medium">
                <Check className="w-4 h-4" /> Saved successfully
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Save failed
              </span>
            )}
            <a href="/" className="text-gray-400 hover:text-pink-500 text-sm transition font-medium">
              ← Back to App
            </a>
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 text-sm transition font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
          {[
            { key: "central_tax",      label: "Central Tax",       color: "#ec4899" },
            { key: "mca_roc",          label: "MCA / ROC",         color: "#8b5cf6" },
            { key: "labor_law",        label: "Labour Law",        color: "#f59e0b" },
            { key: "industry_license", label: "Industry Licenses", color: "#10b981" },
          ].map(({ key, label, color }) => {
            const count = rules.filter((r) => r.category === key).length;
            return (
              <div key={key} className="bg-white rounded-2xl border border-pink-100 p-4 shadow-sm">
                <div className="text-3xl font-bold" style={{ color }}>{count}</div>
                <div className="text-xs text-gray-500 mt-1 font-medium">{label}</div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-300" />
            <input
              type="text"
              placeholder="Search rules by name, authority, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-pink-100 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-200 shadow-sm"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-300" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-pink-100 rounded-xl pl-9 pr-8 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-300 shadow-sm appearance-none"
            >
              <option value="all">All Categories ({rules.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat] || cat} ({rules.filter((r) => r.category === cat).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-gray-400 text-xs mb-4 font-medium">
          Showing {filtered.length} of {rules.length} rules
        </p>

        {/* Rules List */}
        <div className="space-y-2.5">
          {filtered.map((rule) => {
            const isEditing = editingId === rule.id;
            const isExpanded = expandedId === rule.id;
            const thresholds = getThresholds(rule.conditionJson);

            return (
              <div
                key={rule.id}
                className={`bg-white rounded-2xl border overflow-hidden transition-all shadow-sm ${
                  isEditing
                    ? "border-pink-300 shadow-md shadow-pink-100"
                    : rule.isActive
                    ? "border-pink-100 hover:border-pink-200"
                    : "border-gray-100 opacity-55"
                }`}
              >
                {/* Row */}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  {/* Active toggle */}
                  <button
                    onClick={() => !isEditing && toggleActive(rule)}
                    className="shrink-0 transition"
                    title={rule.isActive ? "Disable rule" : "Enable rule"}
                  >
                    {rule.isActive ? (
                      <ToggleRight className="w-5 h-5 text-pink-400" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-gray-300" />
                    )}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800 text-sm">{rule.name}</span>
                      <span className="text-xs text-gray-400">({rule.shortName})</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${PRIORITY_COLORS[rule.priority] || "bg-gray-100 text-gray-500 border-gray-200"}`}>
                        {rule.priority}
                      </span>
                      <span className="text-xs bg-pink-50 text-pink-500 border border-pink-100 px-2 py-0.5 rounded-full font-medium">
                        {CATEGORY_LABELS[rule.category] || rule.category}
                      </span>
                      {(() => { const n = getDocs(rule).length; return n > 0 ? (
                        <span className="text-xs bg-blue-50 text-blue-500 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
                          📋 {n} docs
                        </span>
                      ) : null; })()}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {rule.authority}
                      <span className="mx-1.5 text-gray-200">·</span>
                      {rule.frequency}
                      {rule.dueDate && (
                        <><span className="mx-1.5 text-gray-200">·</span><span className="text-blue-400">Due: {rule.dueDate}</span></>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => saveRule(rule)}
                          disabled={saving}
                          className="flex items-center gap-1 text-white text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-50 font-semibold"
                          style={{ background: "linear-gradient(135deg, #f472b6, #a855f7)" }}
                        >
                          {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEdit(rule)}
                        className="text-gray-300 hover:text-pink-400 p-1.5 rounded-lg hover:bg-pink-50 transition"
                        title="Edit rule"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : rule.id)}
                      className="text-gray-300 hover:text-gray-500 p-1.5 rounded-lg hover:bg-gray-50 transition"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded area */}
                {isExpanded && (
                  <div className="border-t border-pink-50 px-4 py-5 bg-pink-50/30 space-y-4">
                    {isEditing ? (
                      <EditForm
                        rule={rule}
                        editData={editData}
                        setEditData={setEditData}
                        thresholdEdits={thresholdEdits}
                        setThresholdEdits={setThresholdEdits}
                        thresholds={thresholds}
                      />
                    ) : (
                      <ViewDetails rule={rule} thresholds={thresholds} getConditionLabel={getConditionLabel} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-pink-100">
            <Search className="w-10 h-10 mx-auto mb-3 text-pink-200" />
            <p className="text-gray-400">No rules match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── View Details ──────────────────────────────────────────────────────────────

function ViewDetails({
  rule,
  thresholds,
  getConditionLabel,
}: {
  rule: Rule;
  thresholds: ReturnType<typeof extractThresholds>;
  getConditionLabel: (j: string) => string;
}) {
  const docs = getDocs(rule);
  return (
    <div className="space-y-4 text-sm">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</label>
          <p className="text-gray-600 mt-1 leading-relaxed">{rule.description}</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">How to Comply</label>
          <p className="text-gray-600 mt-1 leading-relaxed">{rule.howToComply}</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Applicability Condition</label>
          <p className="text-pink-500 mt-1 font-mono text-xs bg-pink-50 px-3 py-2 rounded-lg border border-pink-100">{getConditionLabel(rule.conditionJson)}</p>
        </div>
        {thresholds.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Numeric Thresholds</label>
            <div className="mt-1 space-y-1">
              {thresholds.map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-pink-100">
                  <span>{t.label}</span>
                  <span className="text-gray-300">{t.cmp}</span>
                  <span className="text-pink-500 font-bold">{t.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {rule.penalty && (
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Penalty</label>
            <p className="text-red-500 mt-1 text-xs bg-red-50 px-3 py-2 rounded-lg border border-red-100">{rule.penalty}</p>
          </div>
        )}
        {rule.dueDate && (
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Due Date</label>
            <p className="text-blue-500 mt-1 text-xs bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">{rule.dueDate}</p>
          </div>
        )}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tags</label>
          <div className="flex flex-wrap gap-1 mt-1">
            {rule.tags.split(",").map((t) => (
              <span key={t} className="bg-white border border-pink-100 text-pink-400 text-xs px-2 py-0.5 rounded-full">
                {t.trim()}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Documents section */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
            📋 Required Documents
          </label>
          <span className="text-xs bg-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
            {docs.length} items
          </span>
        </div>
        {docs.length === 0 ? (
          <p className="text-xs text-blue-400 italic">No documents defined yet — click edit to add.</p>
        ) : (
          <ol className="space-y-1.5">
            {docs.map((doc, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                <span className="shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-[10px]">{i + 1}</span>
                <span className="leading-relaxed">{doc}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

// ─── Edit Form ─────────────────────────────────────────────────────────────────

function DocListEditor({
  docs,
  onChange,
}: {
  docs: string[];
  onChange: (docs: string[]) => void;
}) {
  const [newDoc, setNewDoc] = useState("");

  const add = () => {
    const trimmed = newDoc.trim();
    if (!trimmed) return;
    onChange([...docs, trimmed]);
    setNewDoc("");
  };

  const remove = (i: number) => onChange(docs.filter((_, idx) => idx !== i));

  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...docs];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next);
  };

  const moveDown = (i: number) => {
    if (i === docs.length - 1) return;
    const next = [...docs];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    onChange(next);
  };

  const editDoc = (i: number, val: string) => {
    const next = [...docs];
    next[i] = val;
    onChange(next);
  };

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2">
          <span className="text-base">📋</span> Required Documents Checklist
        </h3>
        <span className="text-xs bg-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
          {docs.length} items
        </span>
      </div>

      {/* Document list */}
      <div className="space-y-2 mb-3">
        {docs.length === 0 && (
          <p className="text-xs text-blue-400 italic px-1">No documents yet. Add below.</p>
        )}
        {docs.map((doc, i) => (
          <div key={i} className="flex items-center gap-2 bg-white border border-blue-100 rounded-xl px-3 py-2">
            <span className="shrink-0 w-5 h-5 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center text-[10px] font-bold">
              {i + 1}
            </span>
            <input
              type="text"
              value={doc}
              onChange={(e) => editDoc(i, e.target.value)}
              className="flex-1 text-xs text-gray-700 bg-transparent focus:outline-none"
            />
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => moveUp(i)}
                disabled={i === 0}
                className="text-gray-300 hover:text-blue-400 disabled:opacity-20 transition p-0.5"
                title="Move up"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => moveDown(i)}
                disabled={i === docs.length - 1}
                className="text-gray-300 hover:text-blue-400 disabled:opacity-20 transition p-0.5"
                title="Move down"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-gray-300 hover:text-red-400 transition p-0.5"
                title="Remove"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add new document */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newDoc}
          onChange={(e) => setNewDoc(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Add a required document…"
          className="flex-1 bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          type="button"
          onClick={add}
          disabled={!newDoc.trim()}
          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-200 text-white text-xs font-semibold rounded-xl transition"
        >
          + Add
        </button>
      </div>
    </div>
  );
}

function EditForm({
  rule,
  editData,
  setEditData,
  thresholdEdits,
  setThresholdEdits,
  thresholds,
}: {
  rule: Rule;
  editData: Partial<Rule>;
  setEditData: React.Dispatch<React.SetStateAction<Partial<Rule>>>;
  thresholdEdits: Record<number, number>;
  setThresholdEdits: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  thresholds: ReturnType<typeof extractThresholds>;
}) {
  const set = (key: keyof Rule, val: unknown) =>
    setEditData((prev) => ({ ...prev, [key]: val }));

  // Current documents list
  const currentDocs: string[] = (() => {
    const raw = editData.documentsJson ?? rule.documentsJson;
    try { return JSON.parse(raw) as string[]; }
    catch { return []; }
  })();

  const inputCls = "w-full bg-white border border-pink-100 rounded-xl px-3 py-2 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-200";
  const labelCls = "text-xs font-semibold text-gray-400 block mb-1";

  return (
    <div className="space-y-4">
      {/* Thresholds — top priority */}
      {thresholds.length > 0 && (
        <div className="bg-white border border-pink-200 rounded-2xl p-4 shadow-sm">
          <h3 className="text-xs font-bold text-pink-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-5 h-5 bg-pink-100 rounded-full flex items-center justify-center text-pink-500 text-xs">✦</span>
            Applicability Thresholds — Edit to update government limits
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {thresholds.map((t, i) => {
              const current = thresholdEdits[i] !== undefined ? thresholdEdits[i] : t.val;
              return (
                <div key={i}>
                  <label className={labelCls}>
                    {t.label} <span className="text-gray-300 font-normal">{t.cmp}</span>
                  </label>
                  <input
                    type="number"
                    value={current}
                    onChange={(e) =>
                      setThresholdEdits((prev) => ({ ...prev, [i]: Number(e.target.value) }))
                    }
                    className={inputCls}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Documents editor */}
      <DocListEditor
        docs={currentDocs}
        onChange={(docs) => set("documentsJson", JSON.stringify(docs))}
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Rule Name</label>
          <input type="text" value={editData.name ?? rule.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Short Name</label>
          <input type="text" value={editData.shortName ?? rule.shortName} onChange={(e) => set("shortName", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Due Date</label>
          <input type="text" value={editData.dueDate ?? rule.dueDate ?? ""} onChange={(e) => set("dueDate", e.target.value)} placeholder="e.g. 31st July every year" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Penalty</label>
          <input type="text" value={editData.penalty ?? rule.penalty ?? ""} onChange={(e) => set("penalty", e.target.value)} placeholder="e.g. ₹10,000 per day" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Frequency</label>
          <select value={editData.frequency ?? rule.frequency} onChange={(e) => set("frequency", e.target.value)} className={inputCls}>
            {["One-time", "Annual", "Half-yearly", "Quarterly", "Monthly", "Ongoing"].map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Priority</label>
          <select value={editData.priority ?? rule.priority} onChange={(e) => set("priority", e.target.value)} className={inputCls}>
            {["critical", "high", "medium", "low"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea value={editData.description ?? rule.description} onChange={(e) => set("description", e.target.value)} rows={2} className={`${inputCls} resize-none`} />
      </div>
      <div>
        <label className={labelCls}>How to Comply</label>
        <textarea value={editData.howToComply ?? rule.howToComply} onChange={(e) => set("howToComply", e.target.value)} rows={2} className={`${inputCls} resize-none`} />
      </div>
      <div>
        <label className={labelCls}>Tags (comma-separated)</label>
        <input type="text" value={editData.tags ?? rule.tags} onChange={(e) => set("tags", e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Registration Link</label>
        <input type="url" value={editData.registrationLink ?? rule.registrationLink ?? ""} onChange={(e) => set("registrationLink", e.target.value)} placeholder="https://..." className={inputCls} />
      </div>
    </div>
  );
}
