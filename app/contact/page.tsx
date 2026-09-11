"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const QUERY_TYPES = [
  { value: "general",      label: "General Inquiry" },
  { value: "pricing",      label: "Pricing & Plans" },
  { value: "tool_support", label: "Tool Support" },
  { value: "technical",    label: "Technical Issue" },
  { value: "partnership",  label: "Partnership / Collaboration" },
];

const EMPTY = { name: "", email: "", mobile: "", companyName: "", queryType: "general", message: "" };

export default function ContactPage() {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

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
        body: JSON.stringify({ ...form, source: "contact_page" }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      setStatus("success");
      setForm(EMPTY);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  const INPUT = "w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white";

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero */}
      <section className="py-14 px-4 text-center bg-gradient-to-b from-blue-50 to-slate-50 border-b border-slate-200">
        <div className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full mb-4 border bg-blue-50 border-blue-200 text-blue-700">
          📩 Get in Touch
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">Contact Us</h1>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">Questions about our tools, pricing, or need support? We&apos;d love to hear from you.</p>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── Left sidebar ── */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 text-base mb-4">Reach Us Directly</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">✉️</div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Email</p>
                    <a href="mailto:csakassociates@gmail.com" className="text-sm text-blue-600 font-medium hover:underline">csakassociates@gmail.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">⏱️</div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Response Time</p>
                    <p className="text-sm text-slate-700 font-medium">Within 24 hours</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">🌐</div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Platform</p>
                    <a href="https://geebharat.com" target="_blank" rel="noopener noreferrer" className="text-sm text-amber-700 font-medium hover:underline">geebharat.com ↗</a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-700 rounded-2xl p-6 text-white">
              <p className="font-bold text-base mb-2">Free Compliance Tools</p>
              <p className="text-blue-200 text-sm mb-4 leading-relaxed">Check what laws apply to your business — GST, Labour, FEMA, CSR, MCA and 70+ more rules.</p>
              <Link href="/tools" className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-blue-50 transition">
                Explore Tools →
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-3">Quick Links</h3>
              <div className="space-y-2">
                {[
                  { href: "/check",   label: "Compliance Check",     icon: "✅" },
                  { href: "/tools",   label: "All Tools",             icon: "🛠️" },
                  { href: "/about",   label: "About Us",              icon: "ℹ️" },
                  { href: "/blog",    label: "Blog",                  icon: "📝" },
                ].map(l => (
                  <Link key={l.href} href={l.href}
                    className="flex items-center gap-2.5 text-slate-600 hover:text-blue-700 text-sm py-2 px-3 rounded-lg hover:bg-blue-50 transition">
                    <span>{l.icon}</span>{l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── Enquiry form ── */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              {status === "success" ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-5">
                    <svg className="w-10 h-10 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Enquiry Received!</h2>
                  <p className="text-slate-500 mb-2">Thank you for reaching out. We'll get back to you within <strong>24 hours</strong>.</p>
                  <p className="text-slate-400 text-sm mb-8">A confirmation email has been sent to you.</p>
                  <button onClick={() => setStatus("idle")}
                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">
                    Send Another Enquiry
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-slate-800 mb-1">Send us a Message</h2>
                  <p className="text-slate-500 text-sm mb-6">Fill in the form and our team will respond within 24 hours.</p>

                  <form onSubmit={submit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                        <input value={form.name} onChange={up("name")} className={INPUT} placeholder="Your full name" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Company Name <span className="text-slate-400 font-normal">(optional)</span></label>
                        <input value={form.companyName} onChange={up("companyName")} className={INPUT} placeholder="Your company or firm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Mobile Number <span className="text-red-500">*</span></label>
                        <input value={form.mobile} onChange={up("mobile")} className={INPUT} placeholder="10-digit mobile" maxLength={10} inputMode="numeric" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                        <input type="email" value={form.email} onChange={up("email")} className={INPUT} placeholder="you@example.com" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Query Type <span className="text-red-500">*</span></label>
                      <select value={form.queryType} onChange={up("queryType")} className={INPUT}>
                        {QUERY_TYPES.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Message <span className="text-red-500">*</span></label>
                      <textarea value={form.message} onChange={up("message")} rows={5} className={INPUT + " resize-none"} placeholder="Tell us how we can help you…" />
                    </div>

                    {(errorMsg || status === "error") && (
                      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                        {errorMsg || "Something went wrong. Please try again."}
                      </div>
                    )}

                    <button type="submit" disabled={status === "submitting"}
                      className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all shadow-sm ${status === "submitting" ? "bg-blue-400 cursor-not-allowed text-white" : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md"}`}>
                      {status === "submitting" ? "Sending…" : "Send Enquiry →"}
                    </button>

                    <p className="text-center text-xs text-slate-400">We reply within 24 hours · Email: csakassociates@gmail.com</p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
