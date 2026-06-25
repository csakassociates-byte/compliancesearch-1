"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function SetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) { setError("Passwords do not match."); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }

    setLoading(true); setError("");
    const res = await fetch("/api/auth/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });
    const data = await res.json() as { success?: boolean; error?: string };
    setLoading(false);

    if (!res.ok) { setError(data.error || "Something went wrong."); return; }

    // Force session refresh so mustChangePassword flag is cleared
    await signOut({ redirect: false });
    router.push("/auth/login?success=Password updated! Please login with your new password.");
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
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-xl">🔐</div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Set New Password</h1>
              <p className="text-xs text-slate-500">You must set a permanent password to continue.</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm mb-5">
            You logged in with a temporary password. Please choose a new password to secure your account.
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">New Password</label>
              <input type="password" required minLength={8} autoComplete="new-password"
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Minimum 8 characters"
                value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm New Password</label>
              <input type="password" required minLength={8} autoComplete="new-password"
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Re-enter your new password"
                value={confirm} onChange={e => setConfirm(e.target.value)} />
            </div>
            <button type="submit" disabled={loading || !newPassword || !confirm}
              className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#1e40af,#1d4ed8)" }}>
              {loading ? "Saving…" : "Set New Password →"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
