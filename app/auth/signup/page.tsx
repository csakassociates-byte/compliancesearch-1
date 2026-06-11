"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  async function sendOtp() {
    setLoading(true); setError("");
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), purpose: "signup" }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Failed to send OTP"); return; }
    setStep(2);
    setResendCooldown(60);
    const t = setInterval(() => setResendCooldown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, otp }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Signup failed"); return; }
    // Transfer temp Excel data — will be re-saved on next login after session starts
    try {
      const tempCompany = sessionStorage.getItem("csi_temp_company");
      if (tempCompany) {
        const companyData = JSON.parse(tempCompany);
        if (companyData.companyName) {
          // Keep in sessionStorage so login page can transfer it after signIn
        }
      }
    } catch { /* silent */ }
    router.push("/auth/login?success=Account+created+successfully!+Please+sign+in.");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{background:"linear-gradient(135deg,#1e40af,#1d4ed8)"}}>⚖️</div>
            <span className="text-2xl font-bold text-slate-900">ComplianceSearch<span style={{color:"#d97706"}}>.in</span></span>
          </Link>
          <p className="text-slate-500 text-sm">Create your free account</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${step >= 1 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"}`}>1</div>
            <div className={`flex-1 h-0.5 ${step >= 2 ? "bg-blue-600" : "bg-slate-200"}`}/>
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${step >= 2 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"}`}>2</div>
            <span className="text-xs text-slate-400 ml-1">{step === 1 ? "Your details" : "Verify email"}</span>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">❌ {error}</div>
          )}

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name</label>
                <input type="text" required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Rajesh Kumar" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email address</label>
                <input type="email" required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password <span className="text-slate-400 font-normal">(min 6 characters)</span></label>
                <input type="password" required minLength={6}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <button type="button" disabled={loading || !name || !email || !password}
                onClick={sendOtp}
                className="w-full py-3 rounded-xl font-bold text-white text-sm transition hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
                style={{background:"linear-gradient(135deg,#1e40af,#1d4ed8)"}}>
                {loading ? "Sending OTP..." : "Send OTP →"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700 mb-2">
                📧 OTP sent to <strong>{email}</strong>. Check your inbox (and spam folder).
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Enter 6-digit OTP</label>
                <input type="text" required maxLength={6} pattern="\d{6}"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="_ _ _ _ _ _" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} />
              </div>
              <button type="submit" disabled={loading || otp.length !== 6}
                className="w-full py-3 rounded-xl font-bold text-white text-sm transition hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
                style={{background:"linear-gradient(135deg,#16a34a,#15803d)"}}>
                {loading ? "Creating account..." : "✓ Verify & Create Account"}
              </button>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <button type="button" onClick={() => setStep(1)} className="hover:underline">← Change details</button>
                <button type="button" disabled={resendCooldown > 0 || loading} onClick={sendOtp}
                  className="text-blue-600 hover:underline disabled:text-slate-400 disabled:no-underline">
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
