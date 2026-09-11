"use client";
import { useState, useEffect, useRef } from "react";

const QUERY_TYPES = [
  { value: "general",      label: "General Inquiry" },
  { value: "pricing",      label: "Pricing & Plans" },
  { value: "tool_support", label: "Tool Support" },
  { value: "technical",    label: "Technical Issue" },
  { value: "partnership",  label: "Partnership / Collaboration" },
];

const EMPTY = { name: "", email: "", mobile: "", companyName: "", queryType: "general", message: "" };

export default function EnquiryDrawer() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const drawerRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => firstInputRef.current?.focus(), 120);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function up(key: keyof typeof EMPTY) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.mobile.trim() || !form.message.trim()) {
      setErrorMsg("Please fill Name, Email, Mobile and Message."); return;
    }
    setStatus("submitting"); setErrorMsg("");
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "floating" }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      setStatus("success");
      setForm(EMPTY);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  const INPUT = "w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white";

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => { setOpen(true); setStatus("idle"); setErrorMsg(""); }}
        className="fixed bottom-20 right-6 z-40 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
        aria-label="Open enquiry form"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span className="hidden sm:inline">Enquire Now</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-in drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full z-50 w-full sm:w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-700 to-blue-800 flex-shrink-0">
          <div>
            <p className="text-white font-bold text-base">Enquire / Get in Touch</p>
            <p className="text-blue-200 text-xs mt-0.5">We reply within 24 hours</p>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white text-2xl font-light leading-none">&times;</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {status === "success" ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Enquiry Received!</h3>
              <p className="text-sm text-slate-500 mb-6">Thank you! We'll get back to you within 24 hours. A confirmation has been sent to your email.</p>
              <button onClick={() => { setOpen(false); setStatus("idle"); }}
                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors">
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input ref={firstInputRef} value={form.name} onChange={up("name")} className={INPUT} placeholder="Your full name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Mobile <span className="text-red-500">*</span></label>
                    <input value={form.mobile} onChange={up("mobile")} className={INPUT} placeholder="10-digit mobile" maxLength={10} inputMode="numeric" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Email <span className="text-red-500">*</span></label>
                    <input type="email" value={form.email} onChange={up("email")} className={INPUT} placeholder="you@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Company Name <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input value={form.companyName} onChange={up("companyName")} className={INPUT} placeholder="Your company or firm name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Query Type <span className="text-red-500">*</span></label>
                  <select value={form.queryType} onChange={up("queryType")} className={INPUT}>
                    {QUERY_TYPES.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Message <span className="text-red-500">*</span></label>
                  <textarea value={form.message} onChange={up("message")} rows={4} className={INPUT + " resize-none"} placeholder="Tell us how we can help you…" />
                </div>
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{errorMsg}</div>
              )}

              {status === "error" && !errorMsg && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">Something went wrong. Please try again.</div>
              )}

              <button type="submit" disabled={status === "submitting"}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${status === "submitting" ? "bg-blue-400 cursor-not-allowed text-white" : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow"}`}>
                {status === "submitting" ? "Sending…" : "Send Enquiry →"}
              </button>

              <p className="text-center text-xs text-slate-400">We'll reply to your email within 24 hours</p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
