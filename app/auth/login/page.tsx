"use client";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";
  const successMsg = params.get("success");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
    } else {
      // Transfer temp Excel data to user's account
      const tempCompany = sessionStorage.getItem("csi_temp_company");
      if (tempCompany) {
        try {
          const companyData = JSON.parse(tempCompany);
          if (companyData.companyName) {
            await fetch("/api/companies/save-from-excel", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                companyName: companyData.companyName,
                cin: companyData.cin || null,
                entityType: companyData.entityType || null,
                regAddress: companyData.regAddress || null,
                incorporationDate: companyData.incorporationDate || null,
              }),
            });
            sessionStorage.removeItem("csi_temp_company");
          }
        } catch { /* silent */ }
      }
      // Check if user must change their temporary password
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json() as { user?: { mustChangePassword?: boolean } };
      if (sessionData?.user?.mustChangePassword) {
        router.push("/auth/set-password");
      } else {
        router.push(callbackUrl);
      }
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{background:"linear-gradient(135deg,#1e40af,#1d4ed8)"}}>⚖️</div>
            <span className="text-2xl font-bold text-slate-900">ComplianceSearch<span style={{color:"#d97706"}}>.in</span></span>
          </Link>
          <p className="text-slate-500 text-sm">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
          <h1 className="text-xl font-bold text-slate-800 mb-6">Welcome back</h1>

          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-4">
              ✓ {successMsg}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email address</label>
              <input
                type="email" required autoComplete="email"
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-600">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-blue-600 hover:underline">Forgot password?</Link>
              </div>
              <input
                type="password" required autoComplete="current-password"
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
              style={{background:"linear-gradient(135deg,#1e40af,#1d4ed8)"}}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-blue-600 font-semibold hover:underline">Sign up free</Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          <Link href="/" className="hover:underline">← Back to ComplianceSearch.in</Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
