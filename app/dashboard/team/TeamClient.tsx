"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface Member {
  memberId: string;
  userId: string;
  role: string;
  addedAt: string;
  name: string | null;
  email: string;
}

interface TeamData {
  teamId: string;
  teamName: string | null;
  ownerId: string;
  isOwner: boolean;
  members: Member[];
}

interface ActivityEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string | null;
  entityName: string | null;
  createdAt: string;
}

export default function TeamClient() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string })?.id;

  const [team, setTeam] = useState<TeamData | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [teamNameEdit, setTeamNameEdit] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [activeTab, setActiveTab] = useState<"members" | "activity">("members");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [tRes, aRes] = await Promise.all([
      fetch("/api/team"),
      fetch("/api/activity"),
    ]);
    if (tRes.ok) {
      const t = await tRes.json() as TeamData;
      setTeam(t);
      setTeamNameEdit(t.teamName || "");
    }
    if (aRes.ok) setActivity(await aRes.json() as ActivityEntry[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true); setInviteMsg(null);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail }),
    });
    const data = await res.json() as { success?: boolean; error?: string; message?: string };
    setInviting(false);
    if (!res.ok) { setInviteMsg({ type: "error", text: data.error || "Failed." }); return; }
    setInviteMsg({ type: "success", text: data.message || "Member added!" });
    setInviteEmail("");
    loadData();
  }

  async function handleRemove(userId: string) {
    if (!confirm("Remove this member from the team? They will lose access to shared data.")) return;
    setRemovingId(userId);
    await fetch(`/api/team/members/${userId}`, { method: "DELETE" });
    setRemovingId(null);
    loadData();
  }

  async function handleSaveTeamName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    await fetch("/api/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamName: teamNameEdit }),
    });
    setSavingName(false);
    loadData();
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-slate-400">Loading team…</div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Team Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your team members. All members share access to the same companies and documents.
        </p>
      </div>

      {/* Team Name */}
      {team?.isOwner && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Team Name <span className="text-slate-400 font-normal">(optional)</span></h2>
          <form onSubmit={handleSaveTeamName} className="flex gap-3">
            <input
              type="text"
              className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="e.g. CS&A Associates"
              value={teamNameEdit}
              onChange={e => setTeamNameEdit(e.target.value)}
            />
            <button type="submit" disabled={savingName}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#1e40af,#1d4ed8)" }}>
              {savingName ? "Saving…" : "Save"}
            </button>
          </form>
        </div>
      )}

      {/* Invite Member */}
      {team?.isOwner && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="text-sm font-bold text-slate-700 mb-1">Add Team Member</h2>
          <p className="text-xs text-slate-400 mb-4">
            Enter their email address. If they don&apos;t have an account, one will be created and a temporary password sent to them.
          </p>
          {inviteMsg && (
            <div className={`px-4 py-2.5 rounded-xl text-sm mb-3 ${inviteMsg.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
              {inviteMsg.text}
            </div>
          )}
          <form onSubmit={handleInvite} className="flex gap-3">
            <input
              type="email" required
              className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="colleague@example.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
            />
            <button type="submit" disabled={inviting || !inviteEmail}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 flex items-center gap-2"
              style={{ background: "linear-gradient(135deg,#059669,#047857)" }}>
              {inviting ? "Adding…" : "+ Add Member"}
            </button>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-100">
          {(["members", "activity"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-3.5 text-sm font-semibold capitalize transition ${activeTab === tab ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-700"}`}>
              {tab === "members" ? `Members (${team?.members.length ?? 0})` : "Activity Log"}
            </button>
          ))}
        </div>

        {activeTab === "members" && (
          <div className="divide-y divide-slate-50">
            {team?.members.map(m => (
              <div key={m.memberId} className="flex items-center gap-4 px-6 py-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#1e40af,#1d4ed8)" }}>
                  {(m.name || m.email).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800 truncate">{m.name || m.email}</span>
                    {m.role === "owner" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">Owner</span>
                    )}
                    {m.userId === currentUserId && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 font-medium">You</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{m.name ? m.email : ""} · Added {new Date(m.addedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                </div>
                {team.isOwner && m.userId !== currentUserId && m.role !== "owner" && (
                  <button onClick={() => handleRemove(m.userId)} disabled={removingId === m.userId}
                    className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-50">
                    {removingId === m.userId ? "Removing…" : "Remove"}
                  </button>
                )}
              </div>
            ))}
            {!team?.members.length && (
              <div className="px-6 py-8 text-center text-slate-400 text-sm">No team members yet.</div>
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="divide-y divide-slate-50">
            {activity.map(log => (
              <div key={log.id} className="flex items-start gap-4 px-6 py-3.5">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0 mt-0.5">
                  {log.userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-slate-700">
                    <span className="font-semibold">{log.userName}</span> {log.action}
                    {log.entityName && <span className="text-slate-500"> — {log.entityName}</span>}
                  </span>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {new Date(log.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
            {!activity.length && (
              <div className="px-6 py-8 text-center text-slate-400 text-sm">No activity recorded yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
