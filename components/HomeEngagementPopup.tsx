"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

const STORAGE_KEY = "csi_hp_popup_ts";
const SUPPRESS_MS = 24 * 60 * 60 * 1000; // 24 hours
const DELAY_MS = 7000; // show after 7 s

type Step = "main" | "enquiry" | "done";

export default function HomeEngagementPopup() {
  const { status } = useSession();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>("main");
  const [form, setForm] = useState({ name: "", mobile: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status !== "unauthenticated") return;
    try {
      const last = localStorage.getItem(STORAGE_KEY);
      if (last && Date.now() - parseInt(last) < SUPPRESS_MS) return;
    } catch { /* ignore */ }
    const t = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(t);
  }, [status]);

  function dismiss() {
    setVisible(false);
    try { localStorage.setItem(STORAGE_KEY, Date.now().toString()); } catch { /* ignore */ }
  }

  async function submitEnquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.mobile.trim() || !form.message.trim()) return;
    setSubmitting(true);
    try {
      await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, mobile: form.mobile, message: form.message, queryType: "general", source: "home_popup" }),
      });
    } catch { /* non-blocking */ }
    setStep("done");
    setSubmitting(false);
    try { localStorage.setItem(STORAGE_KEY, Date.now().toString()); } catch { /* ignore */ }
  }

  if (!visible || status !== "unauthenticated") return null;

  const INPUT = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden animate-popup"
          style={{ animation: "popupIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both" }}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-700 to-blue-800 px-5 pt-5 pb-4">
            <button onClick={dismiss}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white text-lg font-light transition"
              aria-label="Close">×</button>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="text-xl">⚖️</span>
              <span className="text-white font-bold text-sm">ComplianceSearch.in</span>
            </div>
            <p className="text-blue-100 text-xs">India&apos;s free CA &amp; CS compliance platform</p>
          </div>

          {/* Body */}
          <div className="px-5 py-5">
            {step === "done" ? (
              /* ── Success ── */
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-bold text-slate-800 text-base mb-1">Message Sent!</p>
                <p className="text-slate-500 text-sm mb-4">We&apos;ll get back to you within 24 hours.</p>
                <div className="flex items-center gap-2 justify-center pt-2 border-t border-slate-100">
                  <Link href="/auth/signup"
                    className="flex-1 text-center py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition">
                    Create Free Account →
                  </Link>
                  <button onClick={dismiss} className="flex-1 py-2.5 border border-slate-200 text-slate-500 text-xs font-bold rounded-xl hover:bg-slate-50 transition">
                    Close
                  </button>
                </div>
              </div>

            ) : step === "enquiry" ? (
              /* ── Enquiry form ── */
              <form onSubmit={submitEnquiry}>
                <p className="font-bold text-slate-800 text-sm mb-3">Send a Quick Message</p>
                <div className="space-y-3">
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className={INPUT} placeholder="Your name *" />
                  <input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
                    className={INPUT} placeholder="Mobile number *" maxLength={10} inputMode="numeric" />
                  <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    className={INPUT + " resize-none"} rows={3} placeholder="How can we help you? *" />
                </div>
                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={() => setStep("main")}
                    className="px-4 py-2.5 border border-slate-200 text-slate-500 text-xs font-bold rounded-xl hover:bg-slate-50 transition">
                    ← Back
                  </button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
                    {submitting ? "Sending…" : "Send Message →"}
                  </button>
                </div>
              </form>

            ) : (
              /* ── Main choice ── */
              <>
                <p className="font-bold text-slate-800 text-base mb-0.5">Need help with compliance?</p>
                <p className="text-slate-500 text-xs mb-4">Ask a question or create a free account to use our tools.</p>

                {/* Enquiry CTA */}
                <button onClick={() => setStep("enquiry")}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-blue-100 bg-blue-50 hover:border-blue-300 hover:bg-blue-100 transition text-left mb-3">
                  <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-base">💬</div>
                  <div>
                    <p className="text-sm font-bold text-blue-800">Send a Quick Enquiry</p>
                    <p className="text-[11px] text-blue-600 mt-0.5">We&apos;ll reply within 24 hours</p>
                  </div>
                  <span className="ml-auto text-blue-400 text-sm">→</span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-xs text-slate-400 font-medium">OR</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                {/* Signup CTA */}
                <Link href="/auth/signup" onClick={dismiss}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-emerald-100 bg-emerald-50 hover:border-emerald-300 hover:bg-emerald-100 transition text-left block mb-4">
                  <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-base">🚀</div>
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Create Free Account</p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">Save documents · Access all tools · No card needed</p>
                  </div>
                  <span className="ml-auto text-emerald-400 text-sm">→</span>
                </Link>

                {/* Benefits strip */}
                <div className="flex items-center justify-around py-2.5 border-t border-slate-100">
                  {["✅ Free Forever", "📁 Save Docs", "🛠️ 10+ Tools"].map(b => (
                    <span key={b} className="text-[10px] font-semibold text-slate-400">{b}</span>
                  ))}
                </div>

                <div className="text-center mt-3">
                  <button onClick={dismiss} className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 transition">
                    Maybe later
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes popupIn {
          0% { opacity: 0; transform: scale(0.88) translateY(24px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
}
