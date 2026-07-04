"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

interface InviteInfo {
  status: string;
  expired: boolean;
  invitedEmail: string;
  inviterName: string | null;
  teamName: string;
}

function AcceptContent() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const { data: session, status: authStatus } = useSession();

  const token        = searchParams.get("token") ?? "";
  const autoAction   = searchParams.get("action") as "accept" | "decline" | null;

  const [invite, setInvite]   = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState(false);
  const [result, setResult]   = useState<{ ok: boolean; msg: string } | null>(null);

  // Load invite info
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`/api/team/invite/${token}`)
      .then(r => r.json())
      .then((d: InviteInfo & { error?: string }) => {
        if (d.error) setInvite(null);
        else setInvite(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  // Auto-trigger decline if ?action=decline (no login needed)
  useEffect(() => {
    if (autoAction === "decline" && invite && invite.status === "pending" && !result) {
      handleAction("decline");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAction, invite]);

  async function handleAction(action: "accept" | "decline") {
    setActing(true);
    const res = await fetch(`/api/team/invite/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json() as { success?: boolean; error?: string; action?: string };
    setActing(false);

    if (res.ok && data.success) {
      if (action === "accept") {
        setResult({ ok: true, msg: "You have joined the team! Redirecting to dashboard…" });
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        setResult({ ok: true, msg: "Invite declined. No data has been shared." });
      }
    } else if (res.status === 401) {
      // Need login — redirect to login then come back
      signIn(undefined, { callbackUrl: `/team/accept?token=${token}&action=accept` });
    } else {
      setResult({ ok: false, msg: data.error || "Something went wrong." });
    }
  }

  // ── Render states ──────────────────────────────────────────────────────────

  const card = (children: React.ReactNode) => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-8 py-5 text-center" style={{ background: "linear-gradient(135deg,#1e40af,#1d4ed8)" }}>
          <span className="text-3xl">⚖️</span>
          <h1 className="text-white font-bold text-lg mt-1">
            ComplianceSearch<span style={{ color: "#fcd34d" }}>.in</span>
          </h1>
        </div>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );

  if (!token) return card(
    <p className="text-center text-slate-500">Invalid invite link.</p>
  );

  if (loading || authStatus === "loading") return card(
    <p className="text-center text-slate-400">Loading…</p>
  );

  if (!invite) return card(
    <div className="text-center">
      <div className="text-4xl mb-3">🔗</div>
      <h2 className="font-bold text-slate-800 text-lg mb-2">Invalid Invite Link</h2>
      <p className="text-slate-500 text-sm">This link is invalid or has already been used.</p>
    </div>
  );

  if (invite.expired || invite.status === "pending" === false) {
    const msgs: Record<string, { icon: string; title: string; sub: string }> = {
      accepted:  { icon: "✅", title: "Already Accepted", sub: "You have already joined this team." },
      declined:  { icon: "✗",  title: "Invite Declined",  sub: "You declined this invitation." },
      cancelled: { icon: "🚫", title: "Invite Cancelled",  sub: "This invite was cancelled by the sender." },
    };
    const m = msgs[invite.status] ?? { icon: "⏰", title: "Invite Expired", sub: "This invite link has expired. Ask the team owner to send a new invite." };
    return card(
      <div className="text-center">
        <div className="text-4xl mb-3">{m.icon}</div>
        <h2 className="font-bold text-slate-800 text-lg mb-2">{m.title}</h2>
        <p className="text-slate-500 text-sm">{m.sub}</p>
        {session && <Link href="/dashboard" className="mt-5 inline-block text-blue-600 text-sm font-semibold hover:underline">Go to Dashboard →</Link>}
      </div>
    );
  }

  // Also treat expired flag separately
  if (invite.expired) return card(
    <div className="text-center">
      <div className="text-4xl mb-3">⏰</div>
      <h2 className="font-bold text-slate-800 text-lg mb-2">Invite Expired</h2>
      <p className="text-slate-500 text-sm">This invite link expired after 7 days. Ask <strong>{invite.inviterName}</strong> to send a new invite.</p>
    </div>
  );

  if (result) return card(
    <div className="text-center">
      <div className="text-4xl mb-3">{result.ok ? "🎉" : "⚠️"}</div>
      <p className={`font-semibold text-lg ${result.ok ? "text-slate-800" : "text-red-600"}`}>{result.msg}</p>
      {result.ok && !result.msg.includes("Redirecting") && (
        <Link href="/dashboard" className="mt-5 inline-block text-blue-600 text-sm font-semibold hover:underline">Go to Dashboard →</Link>
      )}
    </div>
  );

  // Auto-declining in progress
  if (autoAction === "decline" && acting) return card(
    <p className="text-center text-slate-400">Declining invite…</p>
  );

  // ── Main invite card ───────────────────────────────────────────────────────

  const loggedInEmail = session?.user?.email?.toLowerCase();
  const emailMismatch = loggedInEmail && loggedInEmail !== invite.invitedEmail;

  return card(
    <div>
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">🤝</div>
        <h2 className="font-bold text-slate-800 text-xl mb-1">Team Invitation</h2>
        <p className="text-slate-500 text-sm">
          <strong>{invite.inviterName || "Someone"}</strong> has invited you to join{" "}
          <strong>{invite.teamName}</strong>
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6 text-sm text-blue-700">
        This invite was sent to <strong>{invite.invitedEmail}</strong>.<br />
        If you accept, your companies and documents will be shared with this team.
      </div>

      {emailMismatch && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-amber-700">
          ⚠️ You are logged in as <strong>{loggedInEmail}</strong>, but this invite was sent to{" "}
          <strong>{invite.invitedEmail}</strong>. Please login with the correct account to accept.
        </div>
      )}

      {!session ? (
        <div className="space-y-3">
          <button
            onClick={() => signIn(undefined, { callbackUrl: `/team/accept?token=${token}&action=accept` })}
            className="w-full py-3 rounded-xl font-bold text-white text-sm transition"
            style={{ background: "linear-gradient(135deg,#059669,#047857)" }}
          >
            Login to Accept Invitation
          </button>
          <button
            onClick={() => handleAction("decline")}
            disabled={acting}
            className="w-full py-2.5 rounded-xl font-semibold text-slate-500 text-sm border border-slate-200 hover:bg-slate-50 transition disabled:opacity-50"
          >
            {acting ? "Declining…" : "Decline without logging in"}
          </button>
        </div>
      ) : emailMismatch ? (
        <div className="space-y-3">
          <button
            onClick={() => signIn(undefined, { callbackUrl: `/team/accept?token=${token}&action=accept` })}
            className="w-full py-3 rounded-xl font-bold text-white text-sm"
            style={{ background: "linear-gradient(135deg,#1e40af,#1d4ed8)" }}
          >
            Login with {invite.invitedEmail}
          </button>
          <button
            onClick={() => handleAction("decline")}
            disabled={acting}
            className="w-full py-2.5 rounded-xl font-semibold text-slate-500 text-sm border border-slate-200 hover:bg-slate-50 transition disabled:opacity-50"
          >
            {acting ? "Declining…" : "Decline"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={() => handleAction("accept")}
            disabled={acting}
            className="w-full py-3 rounded-xl font-bold text-white text-sm transition disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#059669,#047857)" }}
          >
            {acting ? "Joining…" : "✅ Accept & Join Team"}
          </button>
          <button
            onClick={() => handleAction("decline")}
            disabled={acting}
            className="w-full py-2.5 rounded-xl font-semibold text-slate-500 text-sm border border-slate-200 hover:bg-slate-50 transition disabled:opacity-50"
          >
            {acting ? "…" : "✗ Decline"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function TeamAcceptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400">Loading…</p>
      </div>
    }>
      <AcceptContent />
    </Suspense>
  );
}
