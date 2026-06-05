"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const BLOG_CATEGORIES = [
  { key: "gst",        label: "GST" },
  { key: "income_tax", label: "Income Tax" },
  { key: "labour_law", label: "Labour Law" },
  { key: "mca_roc",    label: "MCA / ROC" },
  { key: "fema",       label: "FEMA" },
  { key: "fssai",      label: "FSSAI" },
  { key: "startup",    label: "Startup" },
  { key: "general",    label: "General" },
];

export default function BlogSubmitPage() {
  const [form, setForm] = useState({
    title: "", excerpt: "", content: "", category: "general",
    tags: "", authorName: "", authorEmail: "", authorPhone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ slug: string } | null>(null);
  const [error, setError] = useState("");

  // Phone lookup state
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "found" | "new">("idle");
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Auto-lookup when phone reaches 10 digits
  useEffect(() => {
    const phone = form.authorPhone.replace(/\D/g, "");
    if (lookupTimer.current) clearTimeout(lookupTimer.current);

    if (phone.length === 10) {
      setLookupStatus("loading");
      lookupTimer.current = setTimeout(async () => {
        const res = await fetch("/api/blog/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        });
        const data = await res.json();
        if (data.found) {
          setLookupStatus("found");
          setForm(f => ({
            ...f,
            authorName: f.authorName || data.authorName,
            authorEmail: f.authorEmail || data.authorEmail,
          }));
        } else {
          setLookupStatus("new");
        }
      }, 400);
    } else if (phone.length < 10) {
      setLookupStatus("idle");
    }

    return () => { if (lookupTimer.current) clearTimeout(lookupTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.authorPhone]);

  const handleSubmit = async () => {
    setError("");
    const { title, excerpt, content, authorName, authorEmail, authorPhone } = form;
    if (!title.trim() || !excerpt.trim() || !content.trim() || !authorName.trim() || !authorEmail.trim() || !authorPhone.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (content.trim().length < 200) {
      setError("Article content must be at least 200 characters.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setSubmitted(data);
    } else {
      setError(data.error || "Submission failed. Please try again.");
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✅</div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-3">Article Submitted!</h1>
            <p className="text-slate-500 mb-6">
              Your article is under review. Our team will verify and publish it soon.
              You can track the status anytime using your email or phone.
            </p>
            <div className="bg-blue-50 rounded-2xl p-4 mb-6 text-sm text-blue-700 border border-blue-200">
              <p className="font-semibold mb-1">Save for tracking:</p>
              <p>Email or phone you provided will be used to check status.</p>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/blog/status"
                className="font-bold text-white py-3 rounded-xl block"
                style={{ background: "#1d4ed8" }}>
                Track My Article Status
              </Link>
              <Link href="/blog"
                className="font-semibold text-slate-600 py-3 rounded-xl block border border-slate-200 hover:bg-slate-50">
                ← Back to Blog
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <div className="max-w-2xl mx-auto w-full px-4 py-12 flex-1">
        {/* Header */}
        <div className="mb-10">
          <Link href="/blog" className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-6">
            ← Back to Blog
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Write an Article</h1>
          <p className="text-slate-500">
            Share your expertise on Indian compliance. After submission, our admin will review and publish it.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">

          {/* ── Author Info ── */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              👤 Your Details
              <span className="text-xs font-normal text-slate-400">(used for tracking &amp; communication)</span>
            </h2>

            {/* Phone field — FIRST */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Mobile Number *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={form.authorPhone}
                  onChange={e => set("authorPhone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className={`w-full border rounded-xl px-4 py-3 text-base font-semibold focus:outline-none focus:ring-2 bg-white transition ${
                    lookupStatus === "found"
                      ? "border-green-400 focus:ring-green-200"
                      : "border-slate-200 focus:ring-blue-200"
                  }`}
                />
                {/* Status indicator inside field */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {lookupStatus === "loading" && (
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  )}
                  {lookupStatus === "found" && (
                    <span className="text-green-500 text-lg">✓</span>
                  )}
                </div>
              </div>

              {/* Welcome back banner */}
              {lookupStatus === "found" && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                  <span className="text-base">👋</span>
                  <span>Welcome back, <strong>{form.authorName}</strong>! Details filled automatically.</span>
                </div>
              )}
              {lookupStatus === "new" && (
                <p className="mt-1.5 text-xs text-slate-400">
                  New contributor? Fill in your name and email below.
                </p>
              )}
            </div>

            {/* Name + Email — side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name *</label>
                <input
                  value={form.authorName}
                  onChange={e => set("authorName", e.target.value)}
                  placeholder="CA Ramesh Kumar"
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${
                    lookupStatus === "found" && form.authorName
                      ? "border-green-300 bg-green-50 focus:ring-green-200"
                      : "border-slate-200 bg-white focus:ring-blue-200"
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={form.authorEmail}
                  onChange={e => set("authorEmail", e.target.value)}
                  placeholder="ca@firm.com"
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${
                    lookupStatus === "found" && form.authorEmail
                      ? "border-green-300 bg-green-50 focus:ring-green-200"
                      : "border-slate-200 bg-white focus:ring-blue-200"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Article Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Article Title *</label>
            <input
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder="e.g. GST Compliance for E-commerce Businesses in India"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Category + Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category *</label>
              <select value={form.category} onChange={e => set("category", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white">
                {BLOG_CATEGORIES.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tags (comma-separated)</label>
              <input value={form.tags} onChange={e => set("tags", e.target.value)}
                placeholder="gst, tax, registration"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>

          {/* Short Summary */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Short Summary *</label>
            <textarea value={form.excerpt} onChange={e => set("excerpt", e.target.value)}
              placeholder="A 2-3 sentence summary that will appear on the blog listing page..."
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
          </div>

          {/* Article Content */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Article Content * <span className="text-slate-400 font-normal">(min. 200 characters)</span>
            </label>
            <textarea value={form.content} onChange={e => set("content", e.target.value)}
              placeholder="Write your full article here. Use blank lines between paragraphs for better readability..."
              rows={18}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-y font-mono leading-relaxed" />
            <p className={`text-xs mt-1 ${form.content.length >= 200 ? "text-green-500" : "text-slate-400"}`}>
              {form.content.length} / 200 characters minimum
              {form.content.length >= 200 && " ✓"}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">
              ⚠️ {error}
            </div>
          )}

          {/* Guidelines */}
          <div className="bg-amber-50 rounded-2xl p-4 text-sm text-amber-700 border border-amber-200">
            <p className="font-semibold mb-1">📋 Submission Guidelines</p>
            <ul className="space-y-1 text-xs list-disc list-inside">
              <li>Content must be original and related to Indian business compliance</li>
              <li>No promotional content or spam</li>
              <li>Cite sources where applicable</li>
              <li>Admin will review within 2-3 business days</li>
            </ul>
          </div>

          <button onClick={handleSubmit} disabled={submitting}
            className="w-full py-4 rounded-2xl font-bold text-white text-base transition hover:scale-105 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
            {submitting ? "Submitting..." : "Submit Article for Review →"}
          </button>
        </div>
      </div>

      <footer className="border-t border-slate-200 py-6 px-4">
        <div className="max-w-6xl mx-auto text-center text-sm text-slate-400">
          © {new Date().getFullYear()} ComplianceSearch.in — Powered by <a href="https://geebharat.com" className="text-amber-600 hover:underline">Gee Bharat</a>
        </div>
      </footer>
    </main>
  );
}
