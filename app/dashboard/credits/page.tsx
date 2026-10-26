"use client";

import { useEffect, useState } from "react";
import { Coins, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle, XCircle, Copy } from "lucide-react";

const UPI_ID = "8800170088@ybl";
const PACKAGES = [
  { amount: 199, credits: 10, label: "Starter" },
  { amount: 499, credits: 30, label: "Basic" },
  { amount: 1199, credits: 100, label: "Pro" },
];

type Txn = { id: string; type: string; amount: number; description: string; toolSlug?: string; createdAt: string };
type UtrReq = { id: string; utrNumber: string; amount: number; credits: number; status: string; createdAt: string };

export default function CreditsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState(PACKAGES[1]);
  const [utrInput, setUtrInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const res = await fetch("/api/credits");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  async function submitUtr() {
    if (!utrInput.trim()) return;
    setSubmitting(true);
    setMsg(null);
    const res = await fetch("/api/credits/utr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ utrNumber: utrInput.trim(), amount: selectedPkg.amount }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setMsg({ ok: true, text: json.message });
      setUtrInput("");
      fetchData();
    } else {
      setMsg({ ok: false, text: json.error });
    }
  }

  function copyUpi() {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  const balance = data?.balance ?? 0;
  const isUnlimited = data?.isFreeUnlimited;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <Coins className="w-6 h-6" />
          <span className="text-sm font-medium opacity-80">Available Credits</span>
        </div>
        <div className="text-5xl font-bold">
          {isUnlimited ? "∞" : balance}
        </div>
        {isUnlimited && <div className="text-sm mt-1 opacity-80">Unlimited access enabled</div>}
        {data?.freeLimit != null && !isUnlimited && (
          <div className="text-sm mt-1 opacity-80">Organisation free plan</div>
        )}
        <div className="mt-3 text-sm opacity-70">
          Lifetime credits received: {data?.lifetimeCredits ?? 0}
        </div>
      </div>

      {/* Tool Pricing */}
      {data?.pricing?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Credit Cost per Tool</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {data.pricing.map((p: any) => (
              <div key={p.toolSlug} className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2 text-sm">
                <span className="text-gray-700">{p.toolName}</span>
                <span className="font-semibold text-emerald-700">{p.creditCost}cr</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buy Credits */}
      {!isUnlimited && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Buy Credits via UPI</h2>

          {/* Package Selection */}
          <div className="grid grid-cols-3 gap-3">
            {PACKAGES.map(pkg => (
              <button
                key={pkg.amount}
                onClick={() => setSelectedPkg(pkg)}
                className={`rounded-xl border-2 p-3 text-center transition-all ${
                  selectedPkg.amount === pkg.amount
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-gray-200 hover:border-emerald-300"
                }`}
              >
                <div className="text-xs text-gray-500 font-medium">{pkg.label}</div>
                <div className="text-lg font-bold text-gray-800 mt-0.5">₹{pkg.amount}</div>
                <div className="text-sm text-emerald-700 font-semibold">{pkg.credits} credits</div>
              </button>
            ))}
          </div>

          {/* UPI Details + QR */}
          <div className="bg-gray-50 rounded-xl p-4 flex flex-col md:flex-row gap-5 items-center">
            {/* QR Code */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`upi://pay?pa=${UPI_ID}&pn=ComplianceSearch&am=${selectedPkg.amount}&cu=INR&tn=Credits+${selectedPkg.credits}`)}`}
                  alt="UPI QR Code"
                  width={160}
                  height={160}
                  className="rounded-lg"
                />
              </div>
              <span className="text-xs text-gray-500">Scan with any UPI app</span>
            </div>

            {/* UPI ID + instructions */}
            <div className="flex-1 space-y-3 w-full">
              <div>
                <div className="text-sm text-gray-600 mb-1">Pay <strong className="text-gray-800">₹{selectedPkg.amount}</strong> to this UPI ID:</div>
                <div className="flex items-center gap-2">
                  <code className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono flex-1 text-gray-800 font-semibold">{UPI_ID}</code>
                  <button onClick={copyUpi} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium shrink-0">
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <p className="text-xs text-emerald-800 font-medium">How to pay:</p>
                <ol className="text-xs text-emerald-700 mt-1 space-y-0.5 list-decimal list-inside">
                  <li>Open GPay / PhonePe / Paytm</li>
                  <li>Scan the QR code or enter UPI ID manually</li>
                  <li>Pay exactly <strong>₹{selectedPkg.amount}</strong></li>
                  <li>Note the <strong>UTR / Reference Number</strong> from payment success screen</li>
                  <li>Enter it below and submit</li>
                </ol>
              </div>
            </div>
          </div>

          {/* UTR Submit */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Enter UTR / Reference Number</label>
            <div className="flex gap-2">
              <input
                value={utrInput}
                onChange={e => setUtrInput(e.target.value)}
                placeholder="e.g. 403521234567"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={submitUtr}
                disabled={submitting || !utrInput.trim()}
                className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
            {msg && (
              <div className={`text-sm px-3 py-2 rounded-lg ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {msg.text}
              </div>
            )}
            <p className="text-xs text-gray-400">Credits will be added within 2–4 hours after verification.</p>
          </div>
        </div>
      )}

      {/* UTR Request History */}
      {data?.utrRequests?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Payment Requests</h2>
          <div className="space-y-2">
            {data.utrRequests.map((r: UtrReq) => (
              <div key={r.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0">
                <div>
                  <div className="font-mono text-xs text-gray-500">{r.utrNumber}</div>
                  <div className="text-gray-700">₹{r.amount} → {r.credits} credits</div>
                </div>
                <div className="flex items-center gap-1.5">
                  {r.status === "pending" && <Clock className="w-4 h-4 text-yellow-500" />}
                  {r.status === "approved" && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {r.status === "rejected" && <XCircle className="w-4 h-4 text-red-500" />}
                  <span className={`capitalize text-xs font-medium ${
                    r.status === "pending" ? "text-yellow-600" :
                    r.status === "approved" ? "text-green-600" : "text-red-600"
                  }`}>{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      {data?.transactions?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Transaction History</h2>
          <div className="space-y-2">
            {data.transactions.map((t: Txn) => (
              <div key={t.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0">
                <div className="flex items-center gap-2">
                  {t.type === "debit"
                    ? <ArrowDownCircle className="w-4 h-4 text-red-400 shrink-0" />
                    : <ArrowUpCircle className="w-4 h-4 text-green-500 shrink-0" />}
                  <span className="text-gray-600 text-xs">{t.description}</span>
                </div>
                <div className={`font-semibold ${t.type === "debit" ? "text-red-600" : "text-green-600"}`}>
                  {t.type === "debit" ? "-" : "+"}{t.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
