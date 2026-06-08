"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  async function sendOtp() {
    setLoading(true); setError("");
    const res = await fetch("/api/auth/send-otp", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ email: email.trim(), purpose: "forgot_password" }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setStep(2);
    setResendCooldown(60);
    const t = setInterval(() => setResendCooldown(c => { if (c<=1){clearInterval(t);return 0;} return c-1; }), 1000);
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ email, otp, newPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    router.push("/auth/login?success=Password+reset+successfully!+Please+sign+in.");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{background:"linear-gradient(135deg,#1e40af,#1d4ed8)"}}>⚖️</div>
            <span className="text-2xl font-bold text-slate-900">ComplianceSearch<span style={{color:"#d97706"}}>.in</span></span>
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
          <h1 className="text-xl font-bold text-slate-800 mb-2">Reset Password</h1>
          <p className="text-sm text-slate-500 mb-6">Enter your email to receive a reset OTP</p>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">❌ {error}</div>}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email address</label>
                <input type="email" required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button type="button" disabled={loading || !email} onClick={sendOtp}
                className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-60 shadow-md"
                style={{background:"linear-gradient(135deg,#1e40af,#1d4ed8)"}}>
                {loading ? "Sending..." : "Send OTP →"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
                📧 OTP sent to <strong>{email}</strong>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Enter OTP</label>
                <input type="text" maxLength={6} pattern="\d{6}"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="_ _ _ _ _ _" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))} />
              </div>
              <button type="button" disabled={otp.length !== 6} onClick={() => { setError(""); setStep(3); }}
                className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-60 shadow-md"
                style={{background:"linear-gradient(135deg,#1e40af,#1d4ed8)"}}>
                Verify OTP →
              </button>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <button onClick={() => setStep(1)} className="hover:underline">← Back</button>
                <button disabled={resendCooldown > 0} onClick={sendOtp} className="text-blue-600 hover:underline disabled:text-slate-400">
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">New Password <span className="text-slate-400 font-normal">(min 6 chars)</span></label>
                <input type="password" required minLength={6}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <button type="submit" disabled={loading || newPassword.length < 6}
                className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-60 shadow-md"
                style={{background:"linear-gradient(135deg,#16a34a,#15803d)"}}>
                {loading ? "Updating..." : "✓ Reset Password"}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            <Link href="/auth/login" className="text-blue-600 hover:underline">← Back to login</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
