"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Company {
  id: string; companyName: string; cin: string | null;
  entityType: string | null; incorporationDate: string | null;
  regAddress: string | null; createdAt: string;
}
interface Doc {
  id: string; type: string; title: string;
  financialYear: string | null; meetingDate: string | null; createdAt: string;
}
interface GapAlert {
  level: 'ok' | 'warning' | 'danger' | 'info';
  message: string;
  detail?: string;
}

const TYPE_LABEL: Record<string, string> = {
  agm_minutes: 'AGM',
  board_minutes: 'Board Meeting',
  egm_minutes: 'EGM',
  committee_minutes: 'Committee Meeting',
};
const TYPE_ICON: Record<string, string> = {
  agm_minutes: '🏛️',
  board_minutes: '📋',
  egm_minutes: '⚡',
  committee_minutes: '👥',
};
const TYPE_COLOR: Record<string, string> = {
  agm_minutes: 'bg-purple-100 text-purple-700 border-purple-200',
  board_minutes: 'bg-blue-100 text-blue-700 border-blue-200',
  egm_minutes: 'bg-amber-100 text-amber-700 border-amber-200',
  committee_minutes: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

function computeGapAlerts(docs: Doc[], entityType: string | null): GapAlert[] {
  const alerts: GapAlert[] = [];
  const today = new Date();

  // Sort by meetingDate
  const withDates = docs.filter(d => d.meetingDate).sort((a, b) =>
    new Date(b.meetingDate!).getTime() - new Date(a.meetingDate!).getTime()
  );

  const boardMeetings = withDates.filter(d => d.type === 'board_minutes');
  const agmMeetings = withDates.filter(d => d.type === 'agm_minutes');

  // ── Board Meeting Analysis (Sec. 173) ──────────────────
  if (boardMeetings.length > 0) {
    const latest = new Date(boardMeetings[0].meetingDate!);
    const daysSinceLast = Math.floor((today.getTime() - latest.getTime()) / 86400000);

    if (daysSinceLast > 120) {
      alerts.push({
        level: 'danger',
        message: `⚠️ Board Meeting overdue by ${daysSinceLast - 120} days`,
        detail: `Sec. 173: Max 120-day gap allowed. Last meeting was ${daysSinceLast} days ago (${boardMeetings[0].meetingDate}).`
      });
    } else if (daysSinceLast > 90) {
      alerts.push({
        level: 'warning',
        message: `📅 Board Meeting due within ${120 - daysSinceLast} days`,
        detail: `Sec. 173: Next board meeting must be held by ${new Date(latest.getTime() + 120*86400000).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'})}.`
      });
    } else {
      alerts.push({
        level: 'ok',
        message: `✅ Board Meeting schedule on track`,
        detail: `Last meeting: ${boardMeetings[0].meetingDate}. Next due within ${120 - daysSinceLast} days.`
      });
    }

    // Count board meetings this calendar year
    const thisYear = today.getFullYear();
    const boardThisYear = boardMeetings.filter(d => new Date(d.meetingDate!).getFullYear() === thisYear).length;
    const monthsGone = today.getMonth() + 1;
    const expectedByNow = Math.ceil(monthsGone / 3);
    if (boardThisYear < expectedByNow) {
      alerts.push({
        level: 'warning',
        message: `📊 Only ${boardThisYear}/${expectedByNow} board meetings held in ${thisYear}`,
        detail: `Sec. 173: Minimum 4 board meetings required per year. ${4 - boardThisYear} more needed before 31 Dec ${thisYear}.`
      });
    } else {
      alerts.push({
        level: 'info',
        message: `📊 ${boardThisYear} board meeting${boardThisYear>1?'s':''} held in ${thisYear}`,
        detail: `Sec. 173: Minimum 4 per year required. ${Math.max(0, 4 - boardThisYear)} more needed this year.`
      });
    }

    // Consecutive gap analysis
    if (boardMeetings.length >= 2) {
      for (let i = 0; i < boardMeetings.length - 1; i++) {
        const d1 = new Date(boardMeetings[i].meetingDate!);
        const d2 = new Date(boardMeetings[i+1].meetingDate!);
        const gap = Math.floor((d1.getTime() - d2.getTime()) / 86400000);
        if (gap > 120) {
          alerts.push({
            level: 'danger',
            message: `🚨 Past violation: ${gap}-day gap between board meetings`,
            detail: `Between ${boardMeetings[i+1].meetingDate} and ${boardMeetings[i].meetingDate} — exceeds 120-day limit (Sec. 173).`
          });
          break;
        }
      }
    }
  } else {
    alerts.push({
      level: 'info',
      message: `ℹ️ No board meetings recorded yet`,
      detail: `Sec. 173: At least 4 board meetings required per financial year.`
    });
  }

  // ── AGM Analysis (Sec. 96) ──────────────────────────────
  if (agmMeetings.length > 0) {
    const latestAgm = new Date(agmMeetings[0].meetingDate!);
    const daysSinceAgm = Math.floor((today.getTime() - latestAgm.getTime()) / 86400000);

    if (daysSinceAgm > 455) { // ~15 months
      alerts.push({
        level: 'danger',
        message: `🚨 AGM overdue — ${Math.floor(daysSinceAgm/30)} months since last AGM`,
        detail: `Sec. 96: Maximum 15 months between two AGMs. Last AGM: ${agmMeetings[0].meetingDate}.`
      });
    } else if (daysSinceAgm > 365) {
      alerts.push({
        level: 'warning',
        message: `⚠️ AGM required within ${455 - daysSinceAgm} days`,
        detail: `Sec. 96: Next AGM must be held by ${new Date(latestAgm.getTime() + 455*86400000).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'})}.`
      });
    } else {
      alerts.push({
        level: 'ok',
        message: `✅ AGM compliance on track`,
        detail: `Last AGM: ${agmMeetings[0].meetingDate}. ${455 - daysSinceAgm} days remaining before next AGM deadline.`
      });
    }
  } else {
    alerts.push({
      level: 'info',
      message: `ℹ️ No AGM recorded`,
      detail: `Sec. 96: AGM must be held within 6 months of financial year end.`
    });
  }

  // suppress unused variable warning
  void entityType;

  return alerts;
}

function daysBetween(d1: string, d2: string): number {
  return Math.abs(Math.floor((new Date(d1).getTime() - new Date(d2).getTime()) / 86400000));
}

const ALERT_STYLES: Record<string, string> = {
  ok:      'bg-emerald-50 border-emerald-200 text-emerald-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  danger:  'bg-red-50 border-red-200 text-red-800',
  info:    'bg-blue-50 border-blue-200 text-blue-700',
};

export default function ClientDetailClient({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'analysis'>('timeline');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Company>>({});

  const load = useCallback(async () => {
    const r = await fetch(`/api/clients/${companyId}`);
    if (!r.ok) { setLoading(false); return; }
    const d = await r.json();
    setCompany(d.company);
    setDocs(d.documents || []);
    setEditForm(d.company);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!confirm(`Delete ${company?.companyName}? All linked documents will be unlinked.`)) return;
    setDeleting(true);
    await fetch(`/api/clients/${companyId}`, { method: 'DELETE' });
    router.push('/dashboard/clients');
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/clients/${companyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setEditMode(false);
    load();
  }

  const alerts = company ? computeGapAlerts(docs, company.entityType) : [];

  // Group docs by type for summary
  const boardCount = docs.filter(d => d.type === 'board_minutes').length;
  const agmCount = docs.filter(d => d.type === 'agm_minutes').length;

  const dangerCount = alerts.filter(a => a.level === 'danger').length;
  const warningCount = alerts.filter(a => a.level === 'warning').length;

  if (loading) return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-slate-400 text-sm">Loading client data...</div>
    </main>
  );

  if (!company) return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3">😕</div>
        <p className="text-slate-600 font-semibold">Client not found</p>
        <Link href="/dashboard/clients" className="text-blue-600 text-sm mt-2 inline-block hover:underline">← Back</Link>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero Header */}
      <div style={{background:'linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#1d4ed8 100%)'}}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-start gap-2 mb-6">
            <Link href="/dashboard/clients" className="text-blue-300 hover:text-white text-sm transition-colors">← My Clients</Link>
            <span className="text-blue-500">/</span>
            <span className="text-blue-200 text-sm truncate">{company.companyName}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end gap-6 justify-between">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white font-black text-2xl flex-shrink-0">
                {company.companyName[0]}
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight">{company.companyName}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {company.entityType && (
                    <span className="text-xs font-semibold bg-white/10 text-white px-3 py-1 rounded-full border border-white/20">
                      {company.entityType}
                    </span>
                  )}
                  {company.cin && (
                    <span className="text-xs font-mono text-blue-200">{company.cin}</span>
                  )}
                  {company.incorporationDate && (
                    <span className="text-xs text-blue-300">Est. {company.incorporationDate}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex gap-3 flex-wrap">
              {[
                { label: 'Board Meetings', value: boardCount, icon: '📋' },
                { label: 'AGMs', value: agmCount, icon: '🏛️' },
                { label: 'Alerts', value: dangerCount + warningCount, icon: dangerCount > 0 ? '🚨' : warningCount > 0 ? '⚠️' : '✅', danger: dangerCount > 0 },
              ].map(s => (
                <div key={s.label} className={`bg-white/10 backdrop-blur border ${s.danger ? 'border-red-400/50 bg-red-500/20' : 'border-white/20'} rounded-xl px-4 py-3 text-center min-w-[80px]`}>
                  <div className="text-xl">{s.icon}</div>
                  <div className="text-xl font-black text-white">{s.value}</div>
                  <div className="text-xs text-blue-200 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 border-b border-white/10">
            {(['timeline', 'analysis'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 text-sm font-semibold capitalize transition-all border-b-2 ${
                  activeTab === tab
                    ? 'text-white border-white'
                    : 'text-blue-300 border-transparent hover:text-white'
                }`}>
                {tab === 'timeline' ? '📅 Meeting Timeline' : '📊 Compliance Analysis'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'timeline' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-800">Meeting History</h2>
                <div className="flex gap-2">
                  <Link href="/tools/documents/minutes/agm"
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100">
                    + AGM
                  </Link>
                  <Link href="/tools/documents/minutes/board"
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100">
                    + Board
                  </Link>
                </div>
              </div>

              {docs.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="font-semibold text-slate-600">No meetings recorded yet</p>
                  <p className="text-sm text-slate-400 mt-1 mb-4">Generate minutes and save them to see the timeline here</p>
                  <Link href="/tools/documents/minutes/agm"
                    className="inline-block px-5 py-2.5 rounded-xl font-bold text-white text-sm"
                    style={{background:'linear-gradient(135deg,#1e40af,#1d4ed8)'}}>
                    Generate Minutes →
                  </Link>
                </div>
              ) : (
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-200 via-slate-200 to-transparent" />
                  <div className="space-y-3">
                    {docs.map((doc, i) => {
                      const prevDoc = docs[i + 1];
                      const gapDays = prevDoc?.meetingDate && doc.meetingDate
                        ? daysBetween(doc.meetingDate, prevDoc.meetingDate) : null;
                      const gapWarning = doc.type === 'board_minutes' && gapDays !== null && gapDays > 120;
                      const gapCaution = doc.type === 'board_minutes' && gapDays !== null && gapDays > 90 && gapDays <= 120;

                      return (
                        <div key={doc.id}>
                          <div className="flex gap-4 items-start">
                            {/* Dot */}
                            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 text-base ${
                              doc.type === 'agm_minutes' ? 'bg-purple-50 border-purple-300' :
                              doc.type === 'board_minutes' ? 'bg-blue-50 border-blue-300' :
                              'bg-slate-50 border-slate-300'
                            }`}>
                              {TYPE_ICON[doc.type] || '📄'}
                            </div>
                            {/* Card */}
                            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${TYPE_COLOR[doc.type] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                      {TYPE_LABEL[doc.type] || doc.type}
                                    </span>
                                    {doc.financialYear && (
                                      <span className="text-xs text-slate-500 font-medium">FY {doc.financialYear}</span>
                                    )}
                                  </div>
                                  <p className="font-semibold text-slate-800 text-sm mt-1.5 leading-tight">{doc.title}</p>
                                  {doc.meetingDate && (
                                    <p className="text-xs text-slate-400 mt-1">
                                      📅 {new Date(doc.meetingDate).toLocaleDateString('en-IN', {day:'2-digit',month:'long',year:'numeric'})}
                                    </p>
                                  )}
                                </div>
                                <Link href={`/dashboard/documents/${doc.id}`}
                                  className="text-xs font-semibold text-blue-600 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-50 flex-shrink-0">
                                  Open
                                </Link>
                              </div>
                            </div>
                          </div>
                          {/* Gap indicator */}
                          {gapDays !== null && (
                            <div className="flex gap-4 items-center my-1">
                              <div className="w-10 flex justify-center">
                                <div className={`w-0.5 h-6 ${gapWarning ? 'bg-red-300' : gapCaution ? 'bg-amber-300' : 'bg-slate-200'}`}/>
                              </div>
                              <div className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                gapWarning ? 'bg-red-50 text-red-600 border border-red-200' :
                                gapCaution ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                'bg-slate-50 text-slate-400 border border-slate-100'
                              }`}>
                                {gapDays} day gap
                                {gapWarning && ' ⚠️ exceeds 120-day limit'}
                                {gapCaution && ' — approaching limit'}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar — Company Info + Quick Alerts */}
            <div className="space-y-4">
              {/* Company info card */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm">Company Info</h3>
                  <button onClick={() => setEditMode(!editMode)}
                    className="text-xs text-blue-600 hover:underline font-semibold">
                    {editMode ? 'Cancel' : '✏️ Edit'}
                  </button>
                </div>
                {editMode ? (
                  <form onSubmit={handleEdit} className="p-4 space-y-3">
                    <input type="text" placeholder="Company Name" required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={editForm.companyName || ''} onChange={e => setEditForm(f=>({...f, companyName: e.target.value}))} />
                    <input type="text" placeholder="CIN"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={editForm.cin || ''} onChange={e => setEditForm(f=>({...f, cin: e.target.value}))} />
                    <input type="text" placeholder="Incorporation Date"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={editForm.incorporationDate || ''} onChange={e => setEditForm(f=>({...f, incorporationDate: e.target.value}))} />
                    <button type="submit" className="w-full py-2 rounded-lg text-white text-xs font-bold" style={{background:'linear-gradient(135deg,#1e40af,#1d4ed8)'}}>
                      Save Changes
                    </button>
                  </form>
                ) : (
                  <div className="p-4 space-y-3">
                    {[
                      { label: 'CIN', value: company.cin, mono: true },
                      { label: 'Type', value: company.entityType },
                      { label: 'Incorporated', value: company.incorporationDate },
                      { label: 'Address', value: company.regAddress },
                    ].map(row => row.value ? (
                      <div key={row.label}>
                        <div className="text-xs text-slate-400 font-medium">{row.label}</div>
                        <div className={`text-xs text-slate-700 font-semibold mt-0.5 ${row.mono ? 'font-mono' : ''}`}>{row.value}</div>
                      </div>
                    ) : null)}
                    {!company.cin && !company.entityType && !company.incorporationDate && (
                      <p className="text-xs text-slate-400 text-center py-2">No details added yet.<br/>Click Edit to add.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Quick compliance status */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 text-sm">Quick Status</h3>
                </div>
                <div className="p-3 space-y-2">
                  {alerts.slice(0, 3).map((a, i) => (
                    <div key={i} className={`text-xs font-medium px-3 py-2 rounded-xl border ${ALERT_STYLES[a.level]}`}>
                      {a.message}
                    </div>
                  ))}
                  <button onClick={() => setActiveTab('analysis')}
                    className="w-full text-center text-xs text-blue-600 font-semibold mt-1 hover:underline py-1">
                    View full analysis →
                  </button>
                </div>
              </div>

              {/* Danger zone */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <button onClick={handleDelete} disabled={deleting}
                  className="w-full py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold transition-colors disabled:opacity-40">
                  {deleting ? 'Deleting...' : '🗑️ Delete Client'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliance Alerts */}
            <div>
              <h2 className="font-bold text-slate-800 mb-4">Compliance Gap Analysis</h2>
              <div className="space-y-3">
                {alerts.map((a, i) => (
                  <div key={i} className={`rounded-xl border p-4 ${ALERT_STYLES[a.level]}`}>
                    <div className="font-semibold text-sm">{a.message}</div>
                    {a.detail && <div className="text-xs mt-1.5 opacity-80 leading-relaxed">{a.detail}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Statutory reference */}
            <div>
              <h2 className="font-bold text-slate-800 mb-4">Statutory Reference</h2>
              <div className="space-y-3">
                {[
                  {
                    icon: '📋', title: 'Board Meetings — Sec. 173',
                    rules: [
                      'Minimum 4 board meetings per financial year',
                      'Maximum 120-day gap between two consecutive meetings',
                      'First meeting within 30 days of incorporation',
                      'Notice: 7 days before (shorter with consent)',
                    ],
                    status: docs.filter(d=>d.type==='board_minutes').length,
                    colorClass: 'bg-blue-100 text-blue-700',
                  },
                  {
                    icon: '🏛️', title: 'Annual General Meeting — Sec. 96',
                    rules: [
                      'Every company must hold AGM each year',
                      'Maximum 15 months between two AGMs',
                      'Within 6 months of financial year end',
                      '21 clear days notice required (Sec. 101)',
                    ],
                    status: docs.filter(d=>d.type==='agm_minutes').length,
                    colorClass: 'bg-purple-100 text-purple-700',
                  },
                  {
                    icon: '⚡', title: 'Extra-ordinary GM — Sec. 100',
                    rules: [
                      'Called by Board as and when required',
                      'Requisition by members holding ≥10% voting power',
                      '21 days notice required',
                      'No fixed frequency requirement',
                    ],
                    status: docs.filter(d=>d.type==='egm_minutes').length,
                    colorClass: 'bg-amber-100 text-amber-700',
                  },
                ].map(ref => (
                  <div key={ref.title} className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-slate-800 text-sm">{ref.icon} {ref.title}</h3>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ref.colorClass}`}>
                        {ref.status} recorded
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {ref.rules.map((r,i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="text-slate-300 mt-0.5 flex-shrink-0">▸</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
