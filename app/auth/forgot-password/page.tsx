"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json() as { success?: boolean; error?: string };
    setLoading(false);
    if (!res.ok) { setError(data.error || "Something went wrong."); return; }
    setDone(true);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: "linear-gradient(135deg,#1e40af,#1d4ed8)" }}>⚖️</div>
            <span className="text-2xl font-bold text-slate-900">
              ComplianceSearch<span style={{ color: "#d97706" }}>.in</span>
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
          {done ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-xl font-bold text-slate-800 mb-3">Check your email</h2>
              <p className="text-sm text-slate-500 mb-6">
                We&apos;ve sent a temporary password to <strong>{email}</strong>.
                Use it to login — you&apos;ll be asked to set a new password immediately.
              </p>
              <Link href="/auth/login"
                className="block w-full py-3 rounded-xl font-bold text-white text-sm text-center"
                style={{ background: "linear-gradient(135deg,#1e40af,#1d4ed8)" }}>
                Go to Login →
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-slate-800 mb-2">Forgot Password?</h1>
              <p className="text-sm text-slate-500 mb-6">
                Enter your email address and we&apos;ll send you a temporary password.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email address</label>
                  <input type="email" required
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <button type="submit" disabled={loading || !email}
                  className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#1e40af,#1d4ed8)" }}>
                  {loading ? "Sending…" : "Send Temporary Password →"}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            <Link href="/auth/login" className="text-blue-600 hover:underline">← Back to login</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
