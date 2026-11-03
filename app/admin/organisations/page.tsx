"use client";

import { useEffect, useState } from "react";
import {
  Building2, Coins, Infinity, Plus, Search, RefreshCw,
  CheckCircle, XCircle, Clock, ChevronDown, ChevronUp
} from "lucide-react";
import Link from "next/link";

type Txn = { id: string; type: string; amount: number; description: string; toolSlug?: string; createdAt: string };
type UtrReq = { id: string; utrNumber: string; amount: number; credits: number; status: string; createdAt: string; adminNote?: string };
type Org = {
  id: string; userId: string; balance: number; lifetimeCredits: number;
  isFreeUnlimited: boolean; freeLimit: number | null; createdAt: string;
  totalDocsGenerated: number; annualFilingCount: number; clientCount: number;
  csi_users: { id: string; name: string | null; email: string; createdAt: string; ai_enabled?: boolean | null; ai_model?: string | null };
  csi_credit_txns: Txn[];
  csi_utr_requests: UtrReq[];
};

const TOOL_LABELS: Record<string, string> = {
  annual_filing: "Annual Filing",
  auditor_appointment: "Auditor Appointment",
  bank_resolution: "Bank Resolution",
  share_certificate: "Share Certificate",
  share_transfer: "Share Transfer",
  compliance_monitor: "Compliance Monitor",
};

function getActivityBadge(txns: Txn[]) {
  const debits = txns.filter(t => t.type === "debit");
  if (debits.length === 0) return { label: "No Activity", color: "bg-gray-100 text-gray-500" };
  const latest = new Date(debits[0].createdAt);
  const daysSince = Math.floor((Date.now() - latest.getTime()) / 86400000);
  if (daysSince <= 7) return { label: "Active", color: "bg-green-100 text-green-700" };
  if (daysSince <= 30) return { label: "Moderate", color: "bg-yellow-100 text-yellow-700" };
  return { label: "Inactive", color: "bg-red-100 text-red-600" };
}

function getThisMonthCount(txns: Txn[]) {
  const now = new Date();
  return txns.filter(t => {
    const d = new Date(t.createdAt);
    return t.type === "debit" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
}

function getToolBreakdown(txns: Txn[]) {
  const counts: Record<string, number> = {};
  txns.filter(t => t.type === "debit" && t.toolSlug).forEach(t => {
    counts[t.toolSlug!] = (counts[t.toolSlug!] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

export default function AdminOrganisationsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Add credits modal
  const [addModal, setAddModal] = useState<Org | null>(null);
  const [addAmt, setAddAmt] = useState("10");
  const [addNote, setAddNote] = useState("Admin credit");
  const [addLoading, setAddLoading] = useState(false);
  const [msg, setMsg] = useState<{ orgId: string; text: string; ok: boolean } | null>(null);

  // Approve UTR modal (with AI plan choice)
  const [approveModal, setApproveModal] = useState<{ utr: UtrReq; org: Org } | null>(null);
  const [approveAi, setApproveAi] = useState<"with" | "without">("without");
  const [approveLoading, setApproveLoading] = useState(false);

  useEffect(() => { fetchOrgs(); }, []);

  async function fetchOrgs() {
    setLoading(true);
    const res = await fetch("/api/admin/credits");
    if (res.ok) setOrgs(await res.json());
    setLoading(false);
  }

  async function addCredits() {
    if (!addModal) return;
    setAddLoading(true);
    const res = await fetch("/api/admin/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: addModal.userId, amount: Number(addAmt), description: addNote }),
    });
    setAddLoading(false);
    setAddModal(null);
    if (res.ok) {
      setMsg({ orgId: addModal.id, text: `${addAmt} credits added`, ok: true });
      setTimeout(() => setMsg(null), 3000);
    }
    fetchOrgs();
  }

  async function toggleUnlimited(org: Org) {
    await fetch("/api/admin/credits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: org.userId, isFreeUnlimited: !org.isFreeUnlimited }),
    });
    fetchOrgs();
  }

  async function toggleAI(org: Org) {
    await fetch("/api/admin/ai", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: org.userId, ai_enabled: !org.csi_users.ai_enabled }),
    });
    fetchOrgs();
  }

  async function setAiModel(org: Org, model: string) {
    await fetch("/api/admin/ai", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: org.userId, ai_model: model }),
    });
    fetchOrgs();
  }

  async function setFreeLimit(org: Org, val: string) {
    const limit = val.trim() === "" ? null : Number(val);
    await fetch("/api/admin/credits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: org.userId, freeLimit: limit }),
    });
    fetchOrgs();
  }

  async function confirmApprove() {
    if (!approveModal) return;
    setApproveLoading(true);
    // 1. Approve the payment
    await fetch("/api/admin/credits/utr", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ utrId: approveModal.utr.id, action: "approve" }),
    });
    // 2. Set AI based on plan choice
    await fetch("/api/admin/ai", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: approveModal.org.userId, ai_enabled: approveAi === "with" }),
    });
    setApproveLoading(false);
    setApproveModal(null);
    fetchOrgs();
  }

  async function rejectUtr(utr: UtrReq) {
    await fetch("/api/admin/credits/utr", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ utrId: utr.id, action: "reject" }),
    });
    fetchOrgs();
  }

  const filtered = orgs.filter(o =>
    (o.csi_users.name?.toLowerCase().includes(search.toLowerCase()) ||
     o.csi_users.email.toLowerCase().includes(search.toLowerCase()))
  );

  const pendingUtrs = orgs.flatMap(o => o.csi_utr_requests.filter(u => u.status === "pending"));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h1 className="text-lg font-bold text-gray-800">Organisations</h1>
          </div>
          <span className="text-sm text-gray-400">{orgs.length} registered</span>
          {pendingUtrs.length > 0 && (
            <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {pendingUtrs.length} pending payment{pendingUtrs.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 w-64"
            />
          </div>
          <button onClick={fetchOrgs} className="text-gray-400 hover:text-gray-600">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Orgs", value: orgs.length, color: "text-gray-800" },
          { label: "Docs Generated", value: orgs.reduce((s, o) => s + o.totalDocsGenerated, 0), color: "text-blue-700" },
          { label: "Pending Payments", value: pendingUtrs.length, color: "text-yellow-700" },
          { label: "Total Credits Given", value: orgs.reduce((s, o) => s + o.lifetimeCredits, 0), color: "text-emerald-700" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Org List */}
      <div className="px-6 pb-8 space-y-3">
        {loading && <div className="text-center text-gray-400 py-12">Loading...</div>}
        {!loading && filtered.length === 0 && (
          <div className="text-center text-gray-400 py-12">No organisations found</div>
        )}

        {filtered.map(org => {
          const isExpanded = expanded === org.id;
          const pendingCount = org.csi_utr_requests.filter(u => u.status === "pending").length;
          const totalDocs = org.totalDocsGenerated;
          const thisMonth = getThisMonthCount(org.csi_credit_txns);
          const badge = getActivityBadge(org.csi_credit_txns);
          const toolBreakdown = getToolBreakdown(org.csi_credit_txns);

          return (
            <div key={org.id} className={`bg-white rounded-xl border overflow-hidden transition-all ${pendingCount > 0 ? "border-yellow-300 shadow-yellow-100 shadow-sm" : "border-gray-200"}`}>

              {/* ── Collapsed Row (always visible) ── */}
              <div
                className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : org.id)}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 shadow-sm">
                  <span className="text-white font-bold text-sm">
                    {(org.csi_users.name || org.csi_users.email)[0].toUpperCase()}
                  </span>
                </div>

                {/* Name + Email */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">
                      {org.csi_users.name || "—"}
                    </span>
                    {org.isFreeUnlimited && (
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-semibold tracking-wide">∞ UNLIMITED</span>
                    )}
                    {pendingCount > 0 && (
                      <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-semibold">{pendingCount} UTR pending</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{org.csi_users.email}</div>
                </div>

                {/* Credits */}
                <div className="text-right shrink-0 mr-2">
                  <div className="text-xl font-bold text-emerald-600">
                    {org.isFreeUnlimited ? "∞" : org.balance}
                  </div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide">credits</div>
                </div>

                {/* Add Credits button (stops propagation so it doesn't toggle expand) */}
                <button
                  onClick={e => { e.stopPropagation(); setAddModal(org); setAddAmt("10"); setAddNote("Admin credit"); }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 border border-emerald-200 font-medium shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Credits
                </button>

                {/* Chevron */}
                <div className="text-gray-400 shrink-0">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {/* Success msg */}
              {msg?.orgId === org.id && (
                <div className={`mx-5 mb-3 text-sm px-3 py-2 rounded-lg ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {msg.text}
                </div>
              )}

              {/* ── Expanded Details ── */}
              {isExpanded && (
                <div className="border-t border-gray-100">

                  {/* Quick Stats Bar */}
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-5 flex-wrap text-xs text-gray-600">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${badge.color}`}>{badge.label}</span>
                    <span>📄 <strong>{totalDocs}</strong> docs total</span>
                    <span>👥 <strong>{org.clientCount}</strong> clients</span>
                    <span>📑 <strong>{org.annualFilingCount}</strong> annual filings</span>
                    {thisMonth > 0 && <span className="text-blue-600">↑ <strong>{thisMonth}</strong> this month</span>}
                    <span className="text-gray-400">Joined: {new Date(org.csi_users.createdAt ?? "").toLocaleDateString("en-IN")}</span>
                  </div>

                  <div className="p-5 space-y-5">

                    {/* ── Section 1: Access Control ── */}
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Access Control</div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <button
                          onClick={() => toggleUnlimited(org)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                            org.isFreeUnlimited
                              ? "bg-purple-100 text-purple-700 border-purple-300"
                              : "bg-white text-gray-600 border-gray-300 hover:bg-purple-50 hover:border-purple-300"
                          }`}
                        >
                          <Infinity className="w-3.5 h-3.5" />
                          {org.isFreeUnlimited ? "Unlimited — Click to Disable" : "Enable Unlimited"}
                        </button>

                        <button
                          onClick={() => toggleAI(org)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                            org.csi_users.ai_enabled
                              ? "bg-violet-100 text-violet-700 border-violet-300"
                              : "bg-white text-gray-600 border-gray-300 hover:bg-violet-50 hover:border-violet-300"
                          }`}
                        >
                          🤖 {org.csi_users.ai_enabled ? "AI Enabled — Click to Disable" : "Enable AI"}
                        </button>

                        {org.csi_users.ai_enabled && (
                          <select
                            value={org.csi_users.ai_model ?? "haiku"}
                            onChange={e => setAiModel(org, e.target.value)}
                            onClick={e => e.stopPropagation()}
                            className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400 bg-white"
                          >
                            <option value="haiku">Haiku (Fast)</option>
                            <option value="sonnet">Sonnet (Smart)</option>
                          </select>
                        )}

                        <div className="flex items-center gap-1.5 ml-1">
                          <span className="text-xs text-gray-500">Free doc limit:</span>
                          <input
                            type="number" min="0"
                            defaultValue={org.freeLimit ?? ""}
                            placeholder="none"
                            onClick={e => e.stopPropagation()}
                            className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                            onBlur={e => setFreeLimit(org, e.target.value)}
                          />
                          <span className="text-xs text-gray-400">docs</span>
                        </div>
                      </div>
                    </div>

                    {/* ── Section 2: Pending Payments (highlighted if any) ── */}
                    {org.csi_utr_requests.filter(u => u.status === "pending").length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-yellow-600 uppercase tracking-widest mb-3">⚠ Pending Payment Requests</div>
                        <div className="space-y-2">
                          {org.csi_utr_requests.filter(u => u.status === "pending").map(utr => (
                            <div key={utr.id} className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between gap-4">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <code className="text-sm font-mono font-semibold text-gray-800">{utr.utrNumber}</code>
                                  <span className="text-xs text-gray-500">{new Date(utr.createdAt).toLocaleString("en-IN")}</span>
                                </div>
                                <div className="text-sm font-semibold text-emerald-700">₹{utr.amount} → {utr.credits} credits</div>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={() => { setApproveAi("without"); setApproveModal({ utr, org }); }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 font-medium"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                  onClick={() => rejectUtr(utr)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 text-xs rounded-lg hover:bg-red-200 font-medium"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Reject
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Section 3: Tool Usage Breakdown ── */}
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Tool Usage</div>
                      {toolBreakdown.length === 0 ? (
                        <div className="text-xs text-gray-400">No documents generated yet</div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {toolBreakdown.map(([slug, count]) => (
                            <div key={slug} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between">
                              <span className="text-xs text-gray-600 truncate">{TOOL_LABELS[slug] || slug}</span>
                              <span className="text-sm font-bold text-emerald-700 ml-2 shrink-0">{count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ── Section 4: Transaction History ── */}
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Transaction History</div>
                      {org.csi_credit_txns.length === 0 ? (
                        <div className="text-xs text-gray-400">No transactions yet</div>
                      ) : (
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                          {org.csi_credit_txns.slice(0, 15).map((t, idx) => (
                            <div key={t.id} className={`flex items-center justify-between px-4 py-2.5 text-xs ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.type === "debit" ? "bg-red-400" : "bg-green-500"}`} />
                                <span className="text-gray-600 truncate">{t.description}</span>
                                {t.toolSlug && <span className="text-gray-400 shrink-0">({t.toolSlug})</span>}
                              </div>
                              <div className="flex items-center gap-3 shrink-0 ml-3">
                                <span className={`font-semibold ${t.type === "debit" ? "text-red-600" : "text-green-600"}`}>
                                  {t.type === "debit" ? "−" : "+"}{t.amount}
                                </span>
                                <span className="text-gray-400">{new Date(t.createdAt).toLocaleDateString("en-IN")}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ── Section 5: All UTR History ── */}
                    {org.csi_utr_requests.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Payment Request History</div>
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                          {org.csi_utr_requests.map((r, idx) => (
                            <div key={r.id} className={`flex items-center justify-between px-4 py-2.5 text-xs ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                              <div className="flex items-center gap-2">
                                {r.status === "pending" && <Clock className="w-3.5 h-3.5 text-yellow-500" />}
                                {r.status === "approved" && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                                {r.status === "rejected" && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                                <code className="text-gray-700 font-mono">{r.utrNumber}</code>
                                <span className="text-gray-500">₹{r.amount} → {r.credits} cr</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`capitalize font-semibold ${
                                  r.status === "pending" ? "text-yellow-600" :
                                  r.status === "approved" ? "text-green-600" : "text-red-500"
                                }`}>{r.status}</span>
                                <span className="text-gray-400">{new Date(r.createdAt).toLocaleDateString("en-IN")}</span>
                              </div>
                            </div>
                        ))}
                      </div>
                    </div>
                  )}

                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Approve UTR Modal — with AI plan choice */}
      {approveModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h3 className="font-bold text-gray-800 text-lg">Approve Payment</h3>

            {/* UTR Summary */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <div className="font-medium text-gray-800">{approveModal.org.csi_users.name || "—"}</div>
              <div className="text-sm text-gray-500">{approveModal.org.csi_users.email}</div>
              <div className="text-sm text-gray-600 mt-1">
                UTR: <code className="font-mono text-gray-800">{approveModal.utr.utrNumber}</code>
              </div>
              <div className="text-sm font-semibold text-emerald-700">
                ₹{approveModal.utr.amount} → {approveModal.utr.credits} credits
              </div>
            </div>

            {/* AI Plan Choice */}
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-700">Select Plan Type</div>
              <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                approveAi === "without" ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"
              }`}>
                <input type="radio" name="ai" value="without" checked={approveAi === "without"}
                  onChange={() => setApproveAi("without")} className="accent-emerald-600" />
                <div>
                  <div className="text-sm font-medium text-gray-800">Without AI</div>
                  <div className="text-xs text-gray-500">Standard plan — no AI filling</div>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                approveAi === "with" ? "border-violet-500 bg-violet-50" : "border-gray-200 hover:border-gray-300"
              }`}>
                <input type="radio" name="ai" value="with" checked={approveAi === "with"}
                  onChange={() => setApproveAi("with")} className="accent-violet-600" />
                <div>
                  <div className="text-sm font-medium text-gray-800">🤖 With AI</div>
                  <div className="text-xs text-gray-500">AI auto-filling enabled for all tools</div>
                </div>
              </label>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setApproveModal(null)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={confirmApprove} disabled={approveLoading}
                className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50 font-medium">
                {approveLoading ? "Approving..." : "Confirm Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Credits Modal */}
      {addModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h3 className="font-bold text-gray-800 text-lg">Add Credits</h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="font-medium text-gray-800">{addModal.csi_users.name || "—"}</div>
              <div className="text-sm text-gray-500">{addModal.csi_users.email}</div>
              <div className="text-sm text-gray-600 mt-1">Current balance: <strong>{addModal.balance} credits</strong></div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Credits to Add</label>
              <input type="number" min="1" value={addAmt} onChange={e => setAddAmt(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Note / Reason</label>
              <input value={addNote} onChange={e => setAddNote(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setAddModal(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={addCredits} disabled={addLoading}
                className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50 font-medium">
                {addLoading ? "Adding..." : `Add ${addAmt} Credits`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
