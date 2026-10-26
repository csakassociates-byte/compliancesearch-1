"use client";

import { useEffect, useState } from "react";
import { Coins, CheckCircle, XCircle, Plus, Infinity, RefreshCw, Settings } from "lucide-react";

type Account = {
  id: string; userId: string; balance: number; lifetimeCredits: number;
  isFreeUnlimited: boolean; freeLimit: number | null;
  csi_users: { name: string | null; email: string };
  csi_credit_txns: { createdAt: string }[];
  csi_utr_requests: { id: string }[];
};
type UtrReq = {
  id: string; utrNumber: string; amount: number; credits: number; status: string; createdAt: string;
  csi_credit_accounts: { userId: string; csi_users: { name: string | null; email: string } };
};
type Pricing = { id: string; toolSlug: string; toolName: string; creditCost: number };

export default function AdminCreditsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [utrs, setUtrs] = useState<UtrReq[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [tab, setTab] = useState<"orgs" | "utrs" | "pricing">("utrs");
  const [loading, setLoading] = useState(true);

  // Add credits modal
  const [addModal, setAddModal] = useState<Account | null>(null);
  const [addAmt, setAddAmt] = useState("10");
  const [addNote, setAddNote] = useState("Admin credit");
  const [addLoading, setAddLoading] = useState(false);

  // Reject modal
  const [rejectModal, setRejectModal] = useState<UtrReq | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [a, u, p] = await Promise.all([
      fetch("/api/admin/credits").then(r => r.json()),
      fetch("/api/admin/credits/utr").then(r => r.json()),
      fetch("/api/admin/credits/pricing").then(r => r.json()),
    ]);
    if (Array.isArray(a)) setAccounts(a);
    if (Array.isArray(u)) setUtrs(u);
    if (Array.isArray(p)) setPricing(p);
    setLoading(false);
  }

  async function approveUtr(utr: UtrReq) {
    await fetch("/api/admin/credits/utr", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ utrId: utr.id, action: "approve" }),
    });
    fetchAll();
  }

  async function rejectUtr() {
    if (!rejectModal) return;
    await fetch("/api/admin/credits/utr", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ utrId: rejectModal.id, action: "reject", adminNote: rejectNote }),
    });
    setRejectModal(null);
    setRejectNote("");
    fetchAll();
  }

  async function addCredits() {
    if (!addModal) return;
    setAddLoading(true);
    await fetch("/api/admin/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: addModal.userId, amount: Number(addAmt), description: addNote }),
    });
    setAddModal(null);
    setAddAmt("10");
    setAddLoading(false);
    fetchAll();
  }

  async function toggleUnlimited(acc: Account) {
    await fetch("/api/admin/credits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: acc.userId, isFreeUnlimited: !acc.isFreeUnlimited }),
    });
    fetchAll();
  }

  async function setFreeLimit(acc: Account, limit: number | null) {
    await fetch("/api/admin/credits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: acc.userId, freeLimit: limit }),
    });
    fetchAll();
  }

  async function updatePricing(toolSlug: string, cost: number) {
    await fetch("/api/admin/credits/pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolSlug, creditCost: cost }),
    });
    fetchAll();
  }

  const pendingUtrs = utrs.filter(u => u.status === "pending");

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Coins className="w-6 h-6 text-emerald-600" /> Credit Management
        </h1>
        <button onClick={fetchAll} className="text-gray-500 hover:text-gray-700"><RefreshCw className="w-5 h-5" /></button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(["utrs", "orgs", "pricing"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm rounded-md font-medium transition-all ${tab === t ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "utrs" ? `UTR Requests${pendingUtrs.length ? ` (${pendingUtrs.length})` : ""}` : t === "orgs" ? "Organisations" : "Tool Pricing"}
          </button>
        ))}
      </div>

      {loading && <div className="text-center text-gray-400 py-8">Loading...</div>}

      {/* UTR Requests */}
      {!loading && tab === "utrs" && (
        <div className="space-y-3">
          {utrs.length === 0 && <div className="text-center text-gray-400 py-8">No payment requests yet</div>}
          {utrs.map(utr => (
            <div key={utr.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-gray-800">{utr.csi_credit_accounts.csi_users.name || utr.csi_credit_accounts.csi_users.email}</div>
                <div className="text-xs text-gray-500">{utr.csi_credit_accounts.csi_users.email}</div>
                <div className="text-sm mt-1">UTR: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{utr.utrNumber}</code></div>
                <div className="text-sm text-gray-600">₹{utr.amount} → <strong>{utr.credits} credits</strong></div>
                <div className="text-xs text-gray-400">{new Date(utr.createdAt).toLocaleString("en-IN")}</div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                {utr.status === "pending" ? (
                  <div className="flex gap-2">
                    <button onClick={() => approveUtr(utr)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => { setRejectModal(utr); setRejectNote(""); }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                ) : (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${utr.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {utr.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Organisations */}
      {!loading && tab === "orgs" && (
        <div className="space-y-3">
          {accounts.length === 0 && <div className="text-center text-gray-400 py-8">No accounts yet</div>}
          {accounts.map(acc => (
            <div key={acc.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-gray-800">{acc.csi_users.name || acc.csi_users.email}</div>
                  <div className="text-xs text-gray-500">{acc.csi_users.email}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Last activity: {acc.csi_credit_txns[0] ? new Date(acc.csi_credit_txns[0].createdAt).toLocaleDateString("en-IN") : "Never"}
                    {acc.csi_utr_requests.length > 0 && <span className="ml-2 text-yellow-600">{acc.csi_utr_requests.length} pending UTR</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-700">
                    {acc.isFreeUnlimited ? "∞" : acc.balance}
                  </div>
                  <div className="text-xs text-gray-400">balance</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                {/* Add Credits */}
                <button onClick={() => { setAddModal(acc); setAddAmt("10"); setAddNote("Admin credit"); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 border border-emerald-200">
                  <Plus className="w-3.5 h-3.5" /> Add Credits
                </button>

                {/* Toggle Unlimited */}
                <button onClick={() => toggleUnlimited(acc)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all ${
                    acc.isFreeUnlimited
                      ? "bg-purple-100 text-purple-700 border-purple-200"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-purple-50"
                  }`}>
                  <Infinity className="w-3.5 h-3.5" />
                  {acc.isFreeUnlimited ? "Unlimited ON" : "Set Unlimited"}
                </button>

                {/* Free Limit */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">Free limit:</span>
                  <input
                    type="number" min="0"
                    defaultValue={acc.freeLimit ?? ""}
                    placeholder="none"
                    className="w-16 border border-gray-300 rounded px-2 py-1 text-xs"
                    onBlur={e => {
                      const val = e.target.value.trim();
                      setFreeLimit(acc, val === "" ? null : Number(val));
                    }}
                  />
                  <span className="text-xs text-gray-400">docs</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tool Pricing */}
      {!loading && tab === "pricing" && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
            <Settings className="w-4 h-4" /> Set credit cost per tool (0 = free)
          </div>
          {pricing.map(p => (
            <div key={p.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
              <div>
                <div className="font-medium text-gray-800">{p.toolName}</div>
                <div className="text-xs text-gray-400">{p.toolSlug}</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0" max="99"
                  defaultValue={p.creditCost}
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-center"
                  onBlur={e => updatePricing(p.toolSlug, Number(e.target.value))}
                />
                <span className="text-sm text-gray-500">credits</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Credits Modal */}
      {addModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-gray-800">Add Credits</h3>
            <div className="text-sm text-gray-600">{addModal.csi_users.name || addModal.csi_users.email}</div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Credits to Add</label>
              <input type="number" min="1" value={addAmt} onChange={e => setAddAmt(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Note</label>
              <input value={addNote} onChange={e => setAddNote(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setAddModal(null)} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600">Cancel</button>
              <button onClick={addCredits} disabled={addLoading}
                className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50">
                {addLoading ? "Adding..." : "Add Credits"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-gray-800">Reject UTR</h3>
            <div className="text-sm text-gray-600">UTR: <code>{rejectModal.utrNumber}</code></div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Reason (optional)</label>
              <input value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                placeholder="e.g. UTR not found"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setRejectModal(null)} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600">Cancel</button>
              <button onClick={rejectUtr} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
