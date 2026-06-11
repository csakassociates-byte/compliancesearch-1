"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PersonKYC, ShareholderRecord } from "@/lib/types/person";

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
  agm_minutes:       'AGM',
  board_minutes:     'Board Meeting',
  egm_minutes:       'EGM',
  committee_minutes: 'Committee Meeting',
  bank_resolution:   'Bank Resolution',
  share_certificate: 'Share Certificate',
};
const TYPE_ICON: Record<string, string> = {
  agm_minutes:       '🏛️',
  board_minutes:     '📋',
  egm_minutes:       '⚡',
  committee_minutes: '👥',
  bank_resolution:   '🏦',
  share_certificate: '📜',
};
const TYPE_COLOR: Record<string, string> = {
  agm_minutes:       'bg-purple-100 text-purple-700 border-purple-200',
  board_minutes:     'bg-blue-100 text-blue-700 border-blue-200',
  egm_minutes:       'bg-amber-100 text-amber-700 border-amber-200',
  committee_minutes: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  bank_resolution:   'bg-cyan-100 text-cyan-700 border-cyan-200',
  share_certificate: 'bg-rose-100 text-rose-700 border-rose-200',
};

// All unique FYs from docs
function extractFYs(docs: Doc[]): string[] {
  const fys = new Set<string>();
  docs.forEach(d => { if (d.financialYear) fys.add(d.financialYear); });
  return Array.from(fys).sort().reverse();
}

function computeGapAlerts(docs: Doc[], entityType: string | null): GapAlert[] {
  const alerts: GapAlert[] = [];
  const today = new Date();
  const withDates = docs.filter(d => d.meetingDate).sort((a, b) =>
    new Date(b.meetingDate!).getTime() - new Date(a.meetingDate!).getTime()
  );
  const boardMeetings = withDates.filter(d => d.type === 'board_minutes');
  const agmMeetings   = withDates.filter(d => d.type === 'agm_minutes');

  if (boardMeetings.length > 0) {
    const latest = new Date(boardMeetings[0].meetingDate!);
    const daysSinceLast = Math.floor((today.getTime() - latest.getTime()) / 86400000);
    if (daysSinceLast > 120) {
      alerts.push({ level:'danger', message:`⚠️ Board Meeting overdue by ${daysSinceLast - 120} days`,
        detail:`Sec. 173: Max 120-day gap allowed. Last meeting was ${daysSinceLast} days ago (${boardMeetings[0].meetingDate}).` });
    } else if (daysSinceLast > 90) {
      alerts.push({ level:'warning', message:`📅 Board Meeting due within ${120 - daysSinceLast} days`,
        detail:`Sec. 173: Next board meeting must be held by ${new Date(latest.getTime() + 120*86400000).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'})}.` });
    } else {
      alerts.push({ level:'ok', message:`✅ Board Meeting schedule on track`,
        detail:`Last meeting: ${boardMeetings[0].meetingDate}. Next due within ${120 - daysSinceLast} days.` });
    }
    const thisYear = today.getFullYear();
    const boardThisYear = boardMeetings.filter(d => new Date(d.meetingDate!).getFullYear() === thisYear).length;
    const expectedByNow = Math.ceil((today.getMonth() + 1) / 3);
    if (boardThisYear < expectedByNow) {
      alerts.push({ level:'warning', message:`📊 Only ${boardThisYear}/${expectedByNow} board meetings held in ${thisYear}`,
        detail:`Sec. 173: Min 4 per year. ${4 - boardThisYear} more needed before 31 Dec ${thisYear}.` });
    } else {
      alerts.push({ level:'info', message:`📊 ${boardThisYear} board meeting${boardThisYear>1?'s':''} held in ${thisYear}`,
        detail:`Sec. 173: Min 4 per year. ${Math.max(0,4-boardThisYear)} more needed this year.` });
    }
    if (boardMeetings.length >= 2) {
      for (let i = 0; i < boardMeetings.length - 1; i++) {
        const d1 = new Date(boardMeetings[i].meetingDate!);
        const d2 = new Date(boardMeetings[i+1].meetingDate!);
        const gap = Math.floor((d1.getTime() - d2.getTime()) / 86400000);
        if (gap > 120) {
          alerts.push({ level:'danger', message:`🚨 Past violation: ${gap}-day gap between board meetings`,
            detail:`Between ${boardMeetings[i+1].meetingDate} and ${boardMeetings[i].meetingDate} — exceeds 120-day limit (Sec. 173).` });
          break;
        }
      }
    }
  } else {
    alerts.push({ level:'info', message:`ℹ️ No board meetings recorded yet`,
      detail:`Sec. 173: At least 4 board meetings required per financial year.` });
  }

  if (agmMeetings.length > 0) {
    const latestAgm = new Date(agmMeetings[0].meetingDate!);
    const daysSinceAgm = Math.floor((today.getTime() - latestAgm.getTime()) / 86400000);
    if (daysSinceAgm > 455) {
      alerts.push({ level:'danger', message:`🚨 AGM overdue — ${Math.floor(daysSinceAgm/30)} months since last AGM`,
        detail:`Sec. 96: Max 15 months between two AGMs. Last AGM: ${agmMeetings[0].meetingDate}.` });
    } else if (daysSinceAgm > 365) {
      alerts.push({ level:'warning', message:`⚠️ AGM required within ${455 - daysSinceAgm} days`,
        detail:`Sec. 96: Next AGM due by ${new Date(latestAgm.getTime() + 455*86400000).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'})}.` });
    } else {
      alerts.push({ level:'ok', message:`✅ AGM compliance on track`,
        detail:`Last AGM: ${agmMeetings[0].meetingDate}. ${455-daysSinceAgm} days remaining.` });
    }
  } else {
    alerts.push({ level:'info', message:`ℹ️ No AGM recorded`,
      detail:`Sec. 96: AGM must be held within 6 months of financial year end.` });
  }

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

// ── Edit Document Mini-Modal ──────────────────────────────
function EditDocModal({
  doc, onClose, onSaved,
}: { doc: Doc; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: doc.title,
    meetingDate: doc.meetingDate || '',
    financialYear: doc.financialYear || '',
    type: doc.type,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/documents/${doc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between"
          style={{background:'linear-gradient(135deg,#1e40af,#1d4ed8)'}}>
          <h3 className="font-bold text-white text-sm">✏️ Edit Meeting Record</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Meeting Type</label>
            <select
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              value={form.type} onChange={e => setForm(f=>({...f, type: e.target.value}))}>
              <option value="board_minutes">Board Meeting</option>
              <option value="agm_minutes">AGM</option>
              <option value="egm_minutes">EGM</option>
              <option value="committee_minutes">Committee Meeting</option>
              <option value="bank_resolution">Bank Resolution</option>
              <option value="share_certificate">Share Certificate</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Title</label>
            <input type="text" required
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.title} onChange={e => setForm(f=>({...f, title: e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Meeting Date</label>
              <input type="date"
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.meetingDate} onChange={e => setForm(f=>({...f, meetingDate: e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Financial Year</label>
              <input type="text" placeholder="2025-26"
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.financialYear} onChange={e => setForm(f=>({...f, financialYear: e.target.value}))} />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-60"
              style={{background:'linear-gradient(135deg,#1e40af,#1d4ed8)'}}>
              {saving ? 'Saving...' : 'Save Changes →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── KYC Edit Modal ───────────────────────────────────── */
function KYCModal({
  person,
  onClose,
  onSaved,
}: { person: PersonKYC; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Partial<PersonKYC>>({ ...person });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof PersonKYC, v: string | boolean) =>
    setForm(p => ({ ...p, [k]: v }));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/persons/${person.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  const inp = "w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white";
  const lbl = "block text-xs font-bold text-slate-500 mb-1";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4 py-6 overflow-y-auto"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10"
          style={{background:'linear-gradient(135deg,#1e40af,#1d4ed8)'}}>
          <h3 className="font-bold text-white">✏️ KYC — {person.name}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">

          {/* Section 1: Personal */}
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Personal Details</h4>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Name *</label>
                <input className={inp} value={form.name||''} onChange={e=>set('name',e.target.value)} required /></div>
              <div><label className={lbl}>Father Name</label>
                <input className={inp} value={form.fatherName||''} onChange={e=>set('fatherName',e.target.value)} /></div>
              <div><label className={lbl}>Date of Birth</label>
                <input type="date" className={inp} value={form.dateOfBirth||''} onChange={e=>set('dateOfBirth',e.target.value)} /></div>
              <div><label className={lbl}>Nationality</label>
                <input className={inp} value={form.nationality||'Indian'} onChange={e=>set('nationality',e.target.value)} /></div>
              <div><label className={lbl}>Occupation</label>
                <input className={inp} value={form.occupation||''} onChange={e=>set('occupation',e.target.value)} /></div>
              <div><label className={lbl}>Occupation Category</label>
                <select className={inp} value={form.occupationCategory||''} onChange={e=>set('occupationCategory',e.target.value)}>
                  <option value="">Select</option>
                  <option>Business</option><option>Service</option><option>Professional</option><option>Retired</option><option>Student</option>
                </select></div>
            </div>
          </div>

          {/* Section 2: Contact */}
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Contact Details</h4>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Mobile</label>
                <input className={inp} value={form.mobile||''} onChange={e=>set('mobile',e.target.value)} /></div>
              <div><label className={lbl}>Email</label>
                <input type="email" className={inp} value={form.email||''} onChange={e=>set('email',e.target.value)} /></div>
              <div className="col-span-2"><label className={lbl}>Present Address</label>
                <textarea className={inp} rows={2} value={form.presentAddress||''} onChange={e=>set('presentAddress',e.target.value)} /></div>
              <div className="col-span-2"><label className={lbl}>Permanent Address</label>
                <textarea className={inp} rows={2} value={form.permanentAddress||''} onChange={e=>set('permanentAddress',e.target.value)} /></div>
            </div>
          </div>

          {/* Section 3: Identity */}
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Identity Documents</h4>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>PAN Number</label>
                <input className={`${inp} font-mono uppercase`} value={form.panNo||''} onChange={e=>set('panNo',e.target.value)} /></div>
              <div><label className={lbl}>Aadhaar Number</label>
                <input className={`${inp} font-mono`} value={form.aadhaarNo||''} onChange={e=>set('aadhaarNo',e.target.value)} /></div>
            </div>
          </div>

          {/* Section 4: Bank */}
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Bank Details</h4>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Bank Name</label>
                <input className={inp} value={form.bankName||''} onChange={e=>set('bankName',e.target.value)} /></div>
              <div><label className={lbl}>IFSC Code</label>
                <input className={`${inp} font-mono uppercase`} value={form.ifscCode||''} onChange={e=>set('ifscCode',e.target.value)} /></div>
              <div className="col-span-2"><label className={lbl}>Account Number</label>
                <input className={`${inp} font-mono`} value={form.accountNo||''} onChange={e=>set('accountNo',e.target.value)} /></div>
              <div><label className={lbl}>Demat DP ID</label>
                <input className={`${inp} font-mono`} value={form.dematDpId||''} onChange={e=>set('dematDpId',e.target.value)} /></div>
              <div><label className={lbl}>Demat Client ID</label>
                <input className={`${inp} font-mono`} value={form.dematClientId||''} onChange={e=>set('dematClientId',e.target.value)} /></div>
            </div>
          </div>

          {/* Section 5: Company (director fields) */}
          {form.isDirector && (
            <div>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Company-Specific</h4>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>DIN</label>
                  <input className={`${inp} font-mono`} value={form.din||''} onChange={e=>set('din',e.target.value)} /></div>
                <div><label className={lbl}>Designation</label>
                  <input className={inp} value={form.designation||''} onChange={e=>set('designation',e.target.value)} /></div>
                <div><label className={lbl}>Date of Joining</label>
                  <input type="date" className={inp} value={form.dateOfJoining||''} onChange={e=>set('dateOfJoining',e.target.value)} /></div>
                <div><label className={lbl}>Director Category</label>
                  <select className={inp} value={form.directorCategory||''} onChange={e=>set('directorCategory',e.target.value)}>
                    <option value="">Select</option>
                    <option>Independent Executive</option>
                    <option>Independent Non-Executive</option>
                    <option>Non-Independent Executive</option>
                    <option>Non-Independent Non-Executive</option>
                    <option>Whole-time Director</option>
                    <option>Managing Director</option>
                    <option>Nominee Director</option>
                  </select></div>
              </div>
            </div>
          )}

          {/* Section 6: Nominee */}
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Nominee Details</h4>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Nominee Name</label>
                <input className={inp} value={form.nomineeName||''} onChange={e=>set('nomineeName',e.target.value)} /></div>
              <div><label className={lbl}>Relation</label>
                <input className={inp} value={form.nomineeRelation||''} onChange={e=>set('nomineeRelation',e.target.value)} /></div>
              <div className="col-span-2"><label className={lbl}>Nominee Address</label>
                <textarea className={inp} rows={2} value={form.nomineeAddress||''} onChange={e=>set('nomineeAddress',e.target.value)} /></div>
            </div>
          </div>

          <div className="flex gap-3 pt-2 sticky bottom-0 bg-white py-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-60"
              style={{background:'linear-gradient(135deg,#1e40af,#1d4ed8)'}}>
              {saving ? 'Saving...' : 'Save KYC →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Add Person Modal ─────────────────────────────────── */
function AddPersonModal({
  companyId,
  mode,
  onClose,
  onSaved,
}: { companyId: string; mode: 'director' | 'shareholder'; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [din, setDin] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/persons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId,
        name: name.trim(),
        din: din.trim() || null,
        isDirector: mode === 'director',
        isShareholder: mode === 'shareholder',
      }),
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e=>e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between"
          style={{background:'linear-gradient(135deg,#1e40af,#1d4ed8)'}}>
          <h3 className="font-bold text-white text-sm">
            {mode === 'director' ? '👥 Add Director' : '📜 Add Shareholder'}
          </h3>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleAdd} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Full Name *</label>
            <input required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Ramesh Kumar" />
          </div>
          {mode === 'director' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">DIN (optional)</label>
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={din} onChange={e=>setDin(e.target.value)} placeholder="e.g. 01234567" />
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-60"
              style={{background:'linear-gradient(135deg,#1e40af,#1d4ed8)'}}>
              {saving ? 'Saving...' : 'Add →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function kycComplete(p: PersonKYC): boolean {
  return !!(p.panNo && p.aadhaarNo && p.mobile && p.dateOfBirth);
}

/* ── Directors Tab ───────────────────────────────────── */
function DirectorsTab({ companyId }: { companyId: string }) {
  const [persons, setPersons] = useState<PersonKYC[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPerson, setEditPerson] = useState<PersonKYC | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/persons?companyId=${companyId}&type=director`);
    const d = r.ok ? await r.json() : { persons: [] };
    setPersons(d.persons || []);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  async function handleSync(p: PersonKYC) {
    setSyncing(p.id);
    await fetch(`/api/persons/${p.id}/sync`, { method: 'POST' });
    setSyncing(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this director?')) return;
    await fetch(`/api/persons/${id}`, { method: 'DELETE' });
    load();
  }

  if (loading) return <div className="text-sm text-slate-400 text-center py-12">Loading directors...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-800">Directors & KYC</h2>
        <button onClick={() => setShowAdd(true)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100">
          + Add Director
        </button>
      </div>

      {persons.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="text-4xl mb-3">👥</div>
          <p className="font-semibold text-slate-600">No directors recorded</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">Add directors to track their KYC status</p>
          <button onClick={() => setShowAdd(true)}
            className="inline-block px-5 py-2.5 rounded-xl font-bold text-white text-sm"
            style={{background:'linear-gradient(135deg,#1e40af,#1d4ed8)'}}>
            + Add Director
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {persons.map(p => {
            const complete = kycComplete(p);
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="font-bold text-slate-800">{p.name}</div>
                    {p.din && <div className="text-xs font-mono text-slate-400 mt-0.5">DIN: {p.din}</div>}
                    {p.designation && <div className="text-xs text-slate-500 mt-0.5">{p.designation}</div>}
                    {p.directorCategory && <div className="text-xs text-slate-400">{p.directorCategory}</div>}
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                    complete ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                             : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {complete ? '✅ KYC Complete' : '⚠️ KYC Pending'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button onClick={() => setEditPerson(p)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100">
                    ✏️ Edit KYC
                  </button>
                  <button
                    onClick={() => handleSync(p)}
                    disabled={syncing === p.id}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                      p.isShareholder
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100'
                    }`}>
                    {syncing === p.id ? '...' : p.isShareholder ? '🔗 Also Shareholder' : '🔄 Add as Shareholder'}
                  </button>
                  <button onClick={() => handleDelete(p.id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 ml-auto">
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editPerson && <KYCModal person={editPerson} onClose={() => setEditPerson(null)} onSaved={load} />}
      {showAdd && <AddPersonModal companyId={companyId} mode="director" onClose={() => setShowAdd(false)} onSaved={load} />}
    </div>
  );
}

/* ── Shareholders Tab ────────────────────────────────── */
interface ShareholderRow extends ShareholderRecord {
  personName?: string;
  din?: string;
  mobile?: string;
  email?: string;
  panNo?: string;
  aadhaarNo?: string;
  isDirector?: boolean;
  designation?: string;
  holdingPercent?: string;
  companyId?: string;
  userId?: string;
}

function ShareholdersTab({ companyId }: { companyId: string }) {
  const [shareholders, setShareholders] = useState<ShareholderRow[]>([]);
  const [totalShares, setTotalShares] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [editPerson, setEditPerson] = useState<PersonKYC | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/shareholders?companyId=${companyId}`);
    const d = r.ok ? await r.json() : { shareholders: [], totalShares: 0 };
    setShareholders(d.shareholders || []);
    setTotalShares(d.totalShares || 0);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  async function handleSyncToDirector(sh: ShareholderRow) {
    if (!sh.personId) return;
    setSyncing(sh.personId);
    await fetch(`/api/persons/${sh.personId}/sync`, { method: 'POST' });
    setSyncing(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this shareholder record?')) return;
    await fetch(`/api/shareholders/${id}`, { method: 'DELETE' });
    load();
  }

  async function openKYC(sh: ShareholderRow) {
    if (!sh.personId) return;
    const r = await fetch(`/api/persons?companyId=${companyId}`);
    const d = r.ok ? await r.json() : { persons: [] };
    const person = (d.persons as PersonKYC[]).find(p => p.id === sh.personId);
    if (person) setEditPerson(person);
  }

  if (loading) return <div className="text-sm text-slate-400 text-center py-12">Loading shareholders...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-slate-800">Shareholders</h2>
          {totalShares > 0 && (
            <p className="text-xs text-slate-400 mt-0.5">Total issued: {totalShares.toLocaleString('en-IN')} shares</p>
          )}
        </div>
        <button onClick={() => setShowAdd(true)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100">
          + Add Shareholder
        </button>
      </div>

      {shareholders.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="text-4xl mb-3">📜</div>
          <p className="font-semibold text-slate-600">No shareholders recorded</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">Generate a share certificate or add manually</p>
          <button onClick={() => setShowAdd(true)}
            className="inline-block px-5 py-2.5 rounded-xl font-bold text-white text-sm"
            style={{background:'linear-gradient(135deg,#1e40af,#1d4ed8)'}}>
            + Add Shareholder
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shareholders.map(sh => (
            <div key={sh.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="font-bold text-slate-800">{sh.personName || '—'}</div>
                  {sh.folioNumber && <div className="text-xs text-slate-400">Folio: {sh.folioNumber}</div>}
                  {sh.certificateNumber && <div className="text-xs text-slate-400">Cert No: {sh.certificateNumber}</div>}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-black text-blue-700 text-lg">{(sh.numberOfShares||0).toLocaleString('en-IN')}</div>
                  <div className="text-xs text-slate-400">{sh.shareType || 'Equity'}</div>
                  <div className="text-xs font-semibold text-slate-500">{sh.holdingPercent}%</div>
                </div>
              </div>
              {(sh.distinctiveFrom || sh.distinctiveTo) && (
                <div className="text-xs text-slate-400 font-mono bg-slate-50 rounded px-2 py-1 mb-2">
                  Distinctive: {sh.distinctiveFrom} – {sh.distinctiveTo}
                </div>
              )}
              {sh.dateOfAcquisition && (
                <div className="text-xs text-slate-400 mb-2">Acquired: {sh.dateOfAcquisition}</div>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <button onClick={() => openKYC(sh)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100">
                  ✏️ Edit KYC
                </button>
                <button
                  onClick={() => handleSyncToDirector(sh)}
                  disabled={syncing === sh.personId}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                    sh.isDirector
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100'
                  }`}>
                  {syncing === sh.personId ? '...' : sh.isDirector ? '🔗 Also Director' : '🔄 Add as Director'}
                </button>
                <button onClick={() => handleDelete(sh.id)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 ml-auto">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editPerson && <KYCModal person={editPerson} onClose={() => setEditPerson(null)} onSaved={load} />}
      {showAdd && <AddPersonModal companyId={companyId} mode="shareholder" onClose={() => setShowAdd(false)} onSaved={load} />}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────
export default function ClientDetailClient({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [company, setCompany]   = useState<Company | null>(null);
  const [docs, setDocs]         = useState<Doc[]>([]);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'directors' | 'shareholders' | 'analysis'>('timeline');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Company>>({});

  // Filters
  const [filterFY, setFilterFY]       = useState('');
  const [filterType, setFilterType]   = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');

  // Edit doc modal
  const [editDoc, setEditDoc] = useState<Doc | null>(null);

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
  const boardCount = docs.filter(d => d.type === 'board_minutes').length;
  const agmCount   = docs.filter(d => d.type === 'agm_minutes').length;
  const dangerCount  = alerts.filter(a => a.level === 'danger').length;
  const warningCount = alerts.filter(a => a.level === 'warning').length;

  // Sorted docs (newest first)
  const sortedDocs = [...docs].sort((a, b) => {
    if (a.meetingDate && b.meetingDate)
      return new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime();
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Filtered docs
  const filteredDocs = sortedDocs.filter(d => {
    if (filterFY   && d.financialYear !== filterFY) return false;
    if (filterType && d.type !== filterType) return false;
    if (filterKeyword && !d.title.toLowerCase().includes(filterKeyword.toLowerCase())) return false;
    return true;
  });

  const allFYs = extractFYs(docs);

  // Previous board meeting date (for auto-fill hint)
  const lastBoardDate = sortedDocs.find(d => d.type === 'board_minutes')?.meetingDate;

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
            <Link href="/dashboard/clients" className="text-blue-300 hover:text-white text-sm">← My Clients</Link>
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
                    <span className="text-xs font-semibold bg-white/10 text-white px-3 py-1 rounded-full border border-white/20">{company.entityType}</span>
                  )}
                  {company.cin && <span className="text-xs font-mono text-blue-200">{company.cin}</span>}
                  {company.incorporationDate && <span className="text-xs text-blue-300">Est. {company.incorporationDate}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              {[
                { label:'Board Meetings', value:boardCount, icon:'📋' },
                { label:'AGMs', value:agmCount, icon:'🏛️' },
                { label:'Alerts', value:dangerCount+warningCount, icon:dangerCount>0?'🚨':warningCount>0?'⚠️':'✅', danger:dangerCount>0 },
              ].map(s => (
                <div key={s.label} className={`bg-white/10 backdrop-blur border ${s.danger?'border-red-400/50 bg-red-500/20':'border-white/20'} rounded-xl px-4 py-3 text-center min-w-[80px]`}>
                  <div className="text-xl">{s.icon}</div>
                  <div className="text-xl font-black text-white">{s.value}</div>
                  <div className="text-xs text-blue-200 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-1 mt-6 border-b border-white/10 overflow-x-auto">
            {(['timeline', 'directors', 'shareholders', 'analysis'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                  activeTab===tab ? 'text-white border-white' : 'text-blue-300 border-transparent hover:text-white'
                }`}>
                {tab === 'timeline' ? '📅 Meeting Timeline' :
                 tab === 'directors' ? '👥 Directors' :
                 tab === 'shareholders' ? '📜 Shareholders' :
                 '📊 Compliance Analysis'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'timeline' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Timeline ── */}
            <div className="lg:col-span-2">
              {/* Toolbar: title + add buttons */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-slate-800">
                  Meeting History
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    ({filteredDocs.length}{filteredDocs.length !== docs.length ? ` of ${docs.length}` : ''})
                  </span>
                </h2>
                <div className="flex gap-2">
                  <Link href={`/tools/documents/minutes/agm${lastBoardDate ? '' : ''}`}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100">
                    + AGM
                  </Link>
                  <Link
                    href={`/tools/documents/minutes/board${lastBoardDate ? `?prevDate=${encodeURIComponent(lastBoardDate)}` : ''}`}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100">
                    + Board
                  </Link>
                </div>
              </div>

              {/* ── Smart Filters ── */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3 mb-4 flex flex-wrap gap-2 items-center">
                {/* Keyword / Agenda search */}
                <div className="relative flex-1 min-w-[160px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                  <input
                    type="text"
                    placeholder="Search agenda / title..."
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50"
                    value={filterKeyword}
                    onChange={e => setFilterKeyword(e.target.value)}
                  />
                </div>

                {/* Financial Year */}
                <select
                  className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-600"
                  value={filterFY}
                  onChange={e => setFilterFY(e.target.value)}
                >
                  <option value="">All FY</option>
                  {allFYs.map(fy => (
                    <option key={fy} value={fy}>FY {fy}</option>
                  ))}
                </select>

                {/* Meeting Type */}
                <select
                  className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-600"
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                >
                  <option value="">All Types</option>
                  {Object.entries(TYPE_LABEL).map(([k,v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>

                {/* Clear filters */}
                {(filterFY || filterType || filterKeyword) && (
                  <button
                    onClick={() => { setFilterFY(''); setFilterType(''); setFilterKeyword(''); }}
                    className="text-xs text-red-500 font-semibold hover:underline px-1"
                  >
                    ✕ Clear
                  </button>
                )}
              </div>

              {/* ── Scrollable Timeline ── */}
              {docs.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="font-semibold text-slate-600">No meetings recorded yet</p>
                  <p className="text-sm text-slate-400 mt-1 mb-4">Generate minutes and save them to see the timeline here</p>
                  <Link href="/tools/documents/minutes/board"
                    className="inline-block px-5 py-2.5 rounded-xl font-bold text-white text-sm"
                    style={{background:'linear-gradient(135deg,#1e40af,#1d4ed8)'}}>
                    Generate Minutes →
                  </Link>
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                  <div className="text-3xl mb-2">🔎</div>
                  <p className="text-slate-500 text-sm font-medium">No results for current filters</p>
                  <button onClick={() => { setFilterFY(''); setFilterType(''); setFilterKeyword(''); }}
                    className="text-xs text-blue-600 hover:underline mt-2">Clear filters</button>
                </div>
              ) : (
                // Scrollable container — max height 560px
                <div className="max-h-[560px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  <div className="relative">
                    <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-200 via-slate-200 to-transparent" />
                    <div className="space-y-3">
                      {filteredDocs.map((doc, i) => {
                        const prevDoc = filteredDocs[i + 1];
                        const gapDays = prevDoc?.meetingDate && doc.meetingDate
                          ? daysBetween(doc.meetingDate, prevDoc.meetingDate) : null;
                        const gapWarning = doc.type === 'board_minutes' && gapDays !== null && gapDays > 120;
                        const gapCaution = doc.type === 'board_minutes' && gapDays !== null && gapDays > 90 && gapDays <= 120;

                        return (
                          <div key={doc.id}>
                            <div className="flex gap-4 items-start">
                              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 text-base ${
                                doc.type==='agm_minutes'   ? 'bg-purple-50 border-purple-300' :
                                doc.type==='board_minutes' ? 'bg-blue-50 border-blue-300' :
                                doc.type==='bank_resolution' ? 'bg-cyan-50 border-cyan-300' :
                                'bg-slate-50 border-slate-300'
                              }`}>
                                {TYPE_ICON[doc.type] || '📄'}
                              </div>
                              <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${TYPE_COLOR[doc.type] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                        {TYPE_LABEL[doc.type] || doc.type}
                                      </span>
                                      {doc.financialYear && (
                                        <span className="text-xs text-slate-500 font-medium">FY {doc.financialYear}</span>
                                      )}
                                    </div>
                                    <p className="font-semibold text-slate-800 text-sm mt-1.5 leading-tight line-clamp-2">{doc.title}</p>
                                    {doc.meetingDate && (
                                      <p className="text-xs text-slate-400 mt-1">
                                        📅 {new Date(doc.meetingDate).toLocaleDateString('en-IN', {day:'2-digit',month:'long',year:'numeric'})}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex gap-1.5 flex-shrink-0">
                                    {/* Edit button */}
                                    <button
                                      onClick={() => setEditDoc(doc)}
                                      className="text-xs font-semibold text-slate-500 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-50 hover:text-slate-700"
                                      title="Edit meeting details"
                                    >
                                      ✏️
                                    </button>
                                    {/* Open button */}
                                    <Link href={`/dashboard/documents/${doc.id}`}
                                      className="text-xs font-semibold text-blue-600 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-50">
                                      Open
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {gapDays !== null && (
                              <div className="flex gap-4 items-center my-1">
                                <div className="w-10 flex justify-center">
                                  <div className={`w-0.5 h-6 ${gapWarning?'bg-red-300':gapCaution?'bg-amber-300':'bg-slate-200'}`}/>
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
                </div>
              )}
            </div>

            {/* ── Sidebar ── */}
            <div className="space-y-4">
              {/* Company info */}
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
                      value={editForm.companyName||''} onChange={e=>setEditForm(f=>({...f,companyName:e.target.value}))}/>
                    <input type="text" placeholder="CIN"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={editForm.cin||''} onChange={e=>setEditForm(f=>({...f,cin:e.target.value}))}/>
                    <input type="text" placeholder="Incorporation Date"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={editForm.incorporationDate||''} onChange={e=>setEditForm(f=>({...f,incorporationDate:e.target.value}))}/>
                    <button type="submit" className="w-full py-2 rounded-lg text-white text-xs font-bold"
                      style={{background:'linear-gradient(135deg,#1e40af,#1d4ed8)'}}>Save Changes</button>
                  </form>
                ) : (
                  <div className="p-4 space-y-3">
                    {[
                      {label:'CIN',value:company.cin,mono:true},
                      {label:'Type',value:company.entityType},
                      {label:'Incorporated',value:company.incorporationDate},
                      {label:'Address',value:company.regAddress},
                    ].map(row=>row.value?(
                      <div key={row.label}>
                        <div className="text-xs text-slate-400 font-medium">{row.label}</div>
                        <div className={`text-xs text-slate-700 font-semibold mt-0.5 ${row.mono?'font-mono':''}`}>{row.value}</div>
                      </div>
                    ):null)}
                    {!company.cin&&!company.entityType&&!company.incorporationDate&&(
                      <p className="text-xs text-slate-400 text-center py-2">No details added yet.<br/>Click Edit to add.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Quick compliance */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 text-sm">Quick Status</h3>
                </div>
                <div className="p-3 space-y-2">
                  {alerts.slice(0,3).map((a,i)=>(
                    <div key={i} className={`text-xs font-medium px-3 py-2 rounded-xl border ${ALERT_STYLES[a.level]}`}>
                      {a.message}
                    </div>
                  ))}
                  <button onClick={()=>setActiveTab('analysis')}
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

        {activeTab === 'directors' && (
          <DirectorsTab companyId={companyId} />
        )}

        {activeTab === 'shareholders' && (
          <ShareholdersTab companyId={companyId} />
        )}

        {activeTab === 'analysis' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="font-bold text-slate-800 mb-4">Compliance Gap Analysis</h2>
              <div className="space-y-3">
                {alerts.map((a,i)=>(
                  <div key={i} className={`rounded-xl border p-4 ${ALERT_STYLES[a.level]}`}>
                    <div className="font-semibold text-sm">{a.message}</div>
                    {a.detail&&<div className="text-xs mt-1.5 opacity-80 leading-relaxed">{a.detail}</div>}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="font-bold text-slate-800 mb-4">Statutory Reference</h2>
              <div className="space-y-3">
                {[
                  { icon:'📋', title:'Board Meetings — Sec. 173',
                    rules:['Min 4 board meetings per FY','Max 120-day gap between meetings','First meeting within 30 days of incorporation','Notice: 7 days before (shorter with consent)'],
                    status:docs.filter(d=>d.type==='board_minutes').length, colorClass:'bg-blue-100 text-blue-700' },
                  { icon:'🏛️', title:'Annual General Meeting — Sec. 96',
                    rules:['Every company must hold AGM each year','Max 15 months between two AGMs','Within 6 months of FY end','21 clear days notice required (Sec. 101)'],
                    status:docs.filter(d=>d.type==='agm_minutes').length, colorClass:'bg-purple-100 text-purple-700' },
                  { icon:'⚡', title:'Extra-ordinary GM — Sec. 100',
                    rules:['Called by Board as required','Requisition by members ≥10% voting power','21 days notice required','No fixed frequency requirement'],
                    status:docs.filter(d=>d.type==='egm_minutes').length, colorClass:'bg-amber-100 text-amber-700' },
                ].map(ref=>(
                  <div key={ref.title} className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-slate-800 text-sm">{ref.icon} {ref.title}</h3>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ref.colorClass}`}>{ref.status} recorded</span>
                    </div>
                    <ul className="space-y-1.5">
                      {ref.rules.map((r,i)=>(
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="text-slate-300 mt-0.5 flex-shrink-0">▸</span>{r}
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

      {/* ── Edit Document Modal ── */}
      {editDoc && (
        <EditDocModal
          doc={editDoc}
          onClose={() => setEditDoc(null)}
          onSaved={load}
        />
      )}
    </main>
  );
}
