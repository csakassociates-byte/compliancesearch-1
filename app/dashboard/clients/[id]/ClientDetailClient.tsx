"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PersonKYC, ShareholderRecord } from "@/lib/types/person";
import {
  generateShareCertificateHTML,
  computeCertRanges,
  type CertSigner,
} from "@/lib/share-certificate-html";
import { generateSH4HTML, type TransferSigner } from "@/lib/share-transfer-html";

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
    if (person.id) {
      // KYC record exists — update it
      await fetch(`/api/persons/${person.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } else {
      // No KYC record yet — create it with all form data
      await fetch('/api/persons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, companyId: person.companyId, isDirector: true }),
      });
    }
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

/* ── Number to words (Indian) ─────────────────────────── */
const ONES_W = ["","ONE","TWO","THREE","FOUR","FIVE","SIX","SEVEN","EIGHT","NINE",
  "TEN","ELEVEN","TWELVE","THIRTEEN","FOURTEEN","FIFTEEN","SIXTEEN","SEVENTEEN","EIGHTEEN","NINETEEN"];
const TENS_W = ["","","TWENTY","THIRTY","FORTY","FIFTY","SIXTY","SEVENTY","EIGHTY","NINETY"];
function cvtHundreds(n: number): string {
  if (n < 20) return ONES_W[n];
  if (n < 100) return TENS_W[Math.floor(n/10)] + (n%10 ? " "+ONES_W[n%10] : "");
  return ONES_W[Math.floor(n/100)] + " HUNDRED" + (n%100 ? " "+cvtHundreds(n%100) : "");
}
function numToWords(n: number): string {
  if (!n || n === 0) return "ZERO";
  if (n >= 10000000) return cvtHundreds(Math.floor(n/10000000)) + " CRORE" + (n%10000000 ? " "+numToWords(n%10000000) : "");
  if (n >= 100000)   return cvtHundreds(Math.floor(n/100000))   + " LAKH"  + (n%100000   ? " "+numToWords(n%100000)   : "");
  if (n >= 1000)     return cvtHundreds(Math.floor(n/1000))     + " THOUSAND" + (n%1000  ? " "+cvtHundreds(n%1000)   : "");
  return cvtHundreds(n);
}

/* ── Print: Single Share Certificate (exact same format as generator) ── */
function printShareCertificate(sh: ShareholderRow & { personName?: string }, company: Company) {
  // Parse saved signing directors from JSON (saved when certificate was generated)
  let signers: CertSigner[] = [];
  if (sh.signingDirectorsJson) {
    try { signers = JSON.parse(sh.signingDirectorsJson) as CertSigner[]; } catch { /* ignore */ }
  }

  // Build company params — use saved cert metadata if available
  const certCompany = {
    companyName:  company.companyName,
    cin:          company.cin || '',
    regAddress:   company.regAddress || '',
    shareClass:   sh.shareType || 'Equity',
    nominalValue: sh.nominalValue || '10',
    paidUpValue:  sh.paidUpValue  || '10',
    issueDate:    sh.dateOfAcquisition || '',
    issuePlace:   sh.issuePlace   || '',
  };

  // Build shareholder entry
  const certShareholder = {
    name:   sh.personName || '',
    din:    sh.din || sh.panNo || '',
    shares: sh.numberOfShares || 0,
  };

  // Build range from saved distinctive numbers (already computed at generation time)
  const certNo   = sh.certificateNumber || '01';
  const certIdx  = parseInt(certNo) - 1;
  // Build the ranges array — one entry for this single shareholder
  const range = {
    folioNo:  sh.folioNumber  || certNo,
    certNo:   certNo,
    certWord: ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
               'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen','Twenty',
               'Twenty-One','Twenty-Two','Twenty-Three','Twenty-Four','Twenty-Five'][parseInt(certNo)] || certNo,
    from:     sh.distinctiveFrom || 1,
    to:       sh.distinctiveTo   || (sh.numberOfShares || 0),
    fromPad:  String(sh.distinctiveFrom || 1).padStart(5, '0'),
    toPad:    String(sh.distinctiveTo   || sh.numberOfShares || 0),
  };
  void certIdx;

  const html = generateShareCertificateHTML(certCompany, [certShareholder], [range], signers);
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) { alert('Pop-up blocked! Please allow pop-ups.'); return; }
  w.document.write(html); w.document.close();
}

/* ── Print: All Shareholders list ─────────────────────── */
function printAllShareholders(shareholders: (ShareholderRow & { personName?: string })[], company: Company, totalShares: number) {
  const rows = shareholders.map((sh, i) => `
    <tr>
      <td>${i+1}</td>
      <td class="bold">${sh.personName || '—'}</td>
      <td style="font-family:monospace">${sh.din || sh.panNo || '—'}</td>
      <td>${sh.folioNumber || '—'}</td>
      <td>${sh.certificateNumber || '—'}</td>
      <td class="right bold">${sh.numberOfShares ? sh.numberOfShares.toLocaleString('en-IN') : '—'}</td>
      <td>${sh.holdingPercent || '0'}%</td>
      <td style="font-family:monospace">${sh.distinctiveFrom && sh.distinctiveTo ? sh.distinctiveFrom+' – '+sh.distinctiveTo : '—'}</td>
      <td>${sh.dateOfAcquisition || '—'}</td>
      <td>${sh.mobile || '—'}</td>
      <td>${sh.email || '—'}</td>
      <td>${sh.nomineeName ? sh.nomineeName + (sh.nomineeRelation ? ' ('+sh.nomineeRelation+')' : '') : '—'}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Shareholders Register</title>
  <style>
    @page{size:A4 landscape;margin:10mm}
    body{font-family:Arial,sans-serif;font-size:8pt;color:#000}
    h1{font-size:13pt;text-align:center;margin-bottom:2px}
    h2{font-size:9pt;text-align:center;color:#555;margin-bottom:8px}
    p.meta{font-size:8pt;text-align:center;margin-bottom:10px}
    table{width:100%;border-collapse:collapse}
    th{background:#1e3a8a;color:#fff;padding:5px 4px;text-align:left;font-size:7.5pt}
    td{border:1px solid #ccc;padding:4px;vertical-align:top}
    tr:nth-child(even) td{background:#f8f9ff}
    .right{text-align:right}
    .bold{font-weight:bold}
    .total-row td{background:#dbeafe;font-weight:bold;border-top:2px solid #1e3a8a}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>
  <h1>${company.companyName}</h1>
  <h2>CIN: ${company.cin || '—'} | Reg. Office: ${company.regAddress || '—'}</h2>
  <p class="meta">Register of Members — Total Issued Share Capital: <strong>${totalShares.toLocaleString('en-IN')} Shares</strong> | Printed: ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</p>
  <table>
    <thead><tr>
      <th>#</th><th>Name</th><th>DIN/PAN</th><th>Folio No.</th><th>Cert No.</th>
      <th>Shares</th><th>Holding%</th><th>Distinctive Nos.</th><th>Date</th>
      <th>Mobile</th><th>Email</th><th>Nominee</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr class="total-row"><td colspan="5" class="right">TOTAL:</td><td>${totalShares.toLocaleString('en-IN')}</td><td>100%</td><td colspan="5"></td></tr></tfoot>
  </table>
  <script>window.onload=function(){window.print();}</script>
  </body></html>`;
  const w = window.open('','_blank','width=1200,height=700');
  if (!w) { alert('Pop-up blocked!'); return; }
  w.document.write(html); w.document.close();
}

/* ── Print: All Directors list ────────────────────────── */
function printAllDirectors(directors: PersonKYC[], company: Company) {
  const rows = directors.map((d, i) => `
    <tr>
      <td>${i+1}</td>
      <td class="bold">${d.name}</td>
      <td style="font-family:monospace">${d.din || '—'}</td>
      <td>${d.designation || '—'}</td>
      <td>${d.directorCategory || d.category || '—'}</td>
      <td>${d.dateOfJoining || d.appointedAt || '—'}</td>
      <td style="font-family:monospace">${d.panNo || '—'}</td>
      <td style="font-family:monospace">${d.aadhaarNo || '—'}</td>
      <td>${d.mobile || '—'}</td>
      <td>${d.email || '—'}</td>
      <td style="font-size:7pt">${d.presentAddress || d.permanentAddress || '—'}</td>
      <td>${d.isActive === false ? 'Ceased' : 'Active'}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Directors Register</title>
  <style>
    @page{size:A4 landscape;margin:10mm}
    body{font-family:Arial,sans-serif;font-size:8pt;color:#000}
    h1{font-size:13pt;text-align:center;margin-bottom:2px}
    h2{font-size:9pt;text-align:center;color:#555;margin-bottom:8px}
    p.meta{font-size:8pt;text-align:center;margin-bottom:10px}
    table{width:100%;border-collapse:collapse}
    th{background:#1e3a8a;color:#fff;padding:5px 4px;text-align:left;font-size:7.5pt}
    td{border:1px solid #ccc;padding:4px;vertical-align:top}
    tr:nth-child(even) td{background:#f0f4ff}
    .bold{font-weight:bold}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>
  <h1>${company.companyName}</h1>
  <h2>CIN: ${company.cin || '—'} | Reg. Office: ${company.regAddress || '—'}</h2>
  <p class="meta">Register of Directors — Printed: ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</p>
  <table>
    <thead><tr>
      <th>#</th><th>Name</th><th>DIN</th><th>Designation</th><th>Category</th>
      <th>Date of Joining</th><th>PAN</th><th>Aadhaar</th><th>Mobile</th><th>Email</th><th>Address</th><th>Status</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <script>window.onload=function(){window.print();}</script>
  </body></html>`;
  const w = window.open('','_blank','width=1200,height=700');
  if (!w) { alert('Pop-up blocked!'); return; }
  w.document.write(html); w.document.close();
}

/* ── Shareholder View Modal ───────────────────────────── */
function ShareholderViewModal({
  sh, company, onClose, onPrint,
}: { sh: ShareholderRow & { personName?: string }; company: Company; onClose: () => void; onPrint: () => void }) {
  const row = (label: string, val?: string | number | null, mono = false) =>
    val != null && val !== '' ? (
      <div key={label} className="flex gap-3 py-1.5 border-b border-slate-50">
        <span className="text-xs text-slate-400 w-36 shrink-0 pt-0.5">{label}</span>
        <span className={`text-xs font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`}>{String(val)}</span>
      </div>
    ) : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4 py-8 overflow-y-auto"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 flex items-center justify-between rounded-t-2xl"
          style={{background:'linear-gradient(135deg,#0f172a,#1e40af)'}}>
          <div>
            <h3 className="font-bold text-white text-sm">{sh.personName || '—'}</h3>
            <p className="text-xs text-white/60 mt-0.5">Shareholder Details</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Certificate data */}
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">📜 Share Certificate</p>
            <div className="bg-blue-50 rounded-xl px-4 py-3 space-y-1">
              {row('Folio Number', sh.folioNumber)}
              {row('Certificate No.', sh.certificateNumber)}
              {row('Share Type', sh.shareType)}
              {row('Number of Shares', sh.numberOfShares ? sh.numberOfShares.toLocaleString('en-IN') : null)}
              {row('Distinctive Nos.', sh.distinctiveFrom && sh.distinctiveTo ? `${sh.distinctiveFrom} – ${sh.distinctiveTo}` : null, true)}
              {row('Date of Acquisition', sh.dateOfAcquisition)}
              {row('Holding %', sh.holdingPercent ? sh.holdingPercent + '%' : null)}
            </div>
          </div>
          {/* Personal KYC */}
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">👤 Personal Details</p>
            <div className="space-y-0">
              {row('DIN', sh.din, true)}
              {row('PAN', sh.panNo, true)}
              {row('Aadhaar', sh.aadhaarNo, true)}
              {row('Mobile', sh.mobile)}
              {row('Email', sh.email)}
            </div>
          </div>
          {/* Nominee */}
          {(sh.nomineeName || sh.nomineeRelation) && (
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">🔒 Nominee</p>
              <div className="space-y-0">
                {row('Nominee Name', sh.nomineeName)}
                {row('Relation', sh.nomineeRelation)}
              </div>
            </div>
          )}
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">
            Close
          </button>
          <button onClick={onPrint}
            className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2"
            style={{background:'linear-gradient(135deg,#d97706,#b45309)'}}>
            🖨️ Print Certificate
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Share Transfer Modal ─────────────────────────────── */
function ShareTransferModal({
  sh, company, onClose, onDone,
}: {
  sh: ShareholderRow & { personName?: string };
  company: Company;
  onClose: () => void;
  onDone: () => void;
}) {
  const INP = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400';

  const [step, setStep]   = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError]  = useState('');

  // ── Board Resolution (Step 1) ──
  const [brDate, setBrDate]             = useState(new Date().toISOString().slice(0, 10));
  const [brVenue, setBrVenue]           = useState('Registered Office of the Company');
  const [brChairman, setBrChairman]     = useState('');
  const [brSerial, setBrSerial]         = useState('');   // auto if blank
  const [existingMeetings, setExistingMeetings] = useState<Array<{
    id: string; title: string; meetingDate: string; formDataJson: string;
  }>>([]);
  const [exactMeeting, setExactMeeting] = useState<typeof existingMeetings[0] | null>(null);
  const [meetingChoice, setMeetingChoice] = useState<'exact' | 'existing' | 'new'>('new');
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [meetingsLoaded, setMeetingsLoaded] = useState(false);

  // Transfer details
  const [transferDate, setTransferDate]   = useState(new Date().toISOString().slice(0, 10));
  const [consideration, setConsideration] = useState('');
  const [issuePlace, setIssuePlace]       = useState('');

  // Transferee details
  const [transfereeName, setTransfereeName]           = useState('');
  const [transfereeFather, setTransfereeFather]       = useState('');
  const [transfereeAddress, setTransfereeAddress]     = useState('');
  const [transfereePan, setTransfereePan]             = useState('');
  const [transfereeOccupation, setTransfereeOccupation] = useState('');

  // Witnesses
  const [w1Name, setW1Name]       = useState('');
  const [w1Address, setW1Address] = useState('');
  const [w2Name, setW2Name]       = useState('');
  const [w2Address, setW2Address] = useState('');

  // Signing directors
  const [signers, setSigners] = useState<TransferSigner[]>(() => {
    if (sh.signingDirectorsJson) {
      try { return JSON.parse(sh.signingDirectorsJson) as TransferSigner[]; } catch { /* */ }
    }
    return [{ name: '', designation: 'Director', din: '' }];
  });

  // This cert has all shares — full transfer only (partial = split first)
  const totalShares      = sh.numberOfShares || 0;
  const totalConsideration = consideration
    ? (parseFloat(consideration) * totalShares).toFixed(2) : '';
  // Stamp duty = 0.25% of total consideration
  const autoStampDuty = totalConsideration
    ? (parseFloat(totalConsideration) * 0.0025).toFixed(2) : '';

  // 60-day warning from execution date
  const execDate    = new Date(transferDate);
  const deadline60  = new Date(execDate); deadline60.setDate(deadline60.getDate() + 60);
  const today       = new Date();
  const daysLeft    = Math.ceil((deadline60.getTime() - today.getTime()) / 86400000);
  const show60Warn  = daysLeft < 15 && daysLeft >= 0;
  const past60      = daysLeft < 0;

  function addSigner() { setSigners(s => [...s, { name: '', designation: 'Director', din: '' }]); }
  function removeSigner(i: number) { setSigners(s => s.filter((_, idx) => idx !== i)); }
  function updateSigner(i: number, field: keyof TransferSigner, val: string) {
    setSigners(s => s.map((sg, idx) => idx === i ? { ...sg, [field]: val } : sg));
  }

  // Load existing board meetings for this company
  useEffect(() => {
    if (meetingsLoaded) return;
    fetch(`/api/board-resolutions?companyId=${company.id}&date=${brDate}`)
      .then(r => r.json())
      .then((d: { allMeetings: typeof existingMeetings; exactMatch: typeof exactMeeting }) => {
        setExistingMeetings(d.allMeetings || []);
        if (d.exactMatch) {
          setExactMeeting(d.exactMatch);
          setMeetingChoice('exact');
          setSelectedMeetingId(d.exactMatch.id);
        }
        setMeetingsLoaded(true);
      })
      .catch(() => setMeetingsLoaded(true));
  }, [meetingsLoaded, company.id, brDate]);

  // Re-check when date changes
  useEffect(() => {
    if (!meetingsLoaded) return;
    const found = existingMeetings.find(m => m.meetingDate === brDate) ?? null;
    setExactMeeting(found);
    if (found) { setMeetingChoice('exact'); setSelectedMeetingId(found.id); }
    else        { setMeetingChoice('new');  setSelectedMeetingId(''); }
  }, [brDate, existingMeetings, meetingsLoaded]);

  // Auto-generate resolution text from transfer details
  const autoResolutionText = `RESOLVED THAT pursuant to Section 56 of the Companies Act, 2013 and the Articles of Association of the Company, the Board hereby approves the transfer of ${totalShares.toLocaleString('en-IN')} (${totalShares}) ${sh.shareType || 'Equity'} shares bearing Certificate No. ${sh.certificateNumber || '___'}, Folio No. ${sh.folioNumber || '___'}, Distinctive Nos. ${sh.distinctiveFrom || '___'} to ${sh.distinctiveTo || '___'}, from ${sh.personName || '_______________'} to ${transfereeName || '_______________'}${consideration ? ` at a consideration of ₹${consideration} per share (Total: ₹${parseFloat(totalConsideration || '0').toLocaleString('en-IN')})` : ''}, and that the Company Secretary / Authorised Officer be and is hereby directed to record the transfer in the Register of Members accordingly.`;

  const witnesses = [
    { name: w1Name, address: w1Address },
    { name: w2Name, address: w2Address },
  ].filter(w => w.name) as { name: string; address: string }[];

  function printSH4Preview() {
    const html = generateSH4HTML(
      {
        companyName:  company.companyName,
        cin:          company.cin || '',
        regAddress:   company.regAddress || '',
        shareClass:   sh.shareType || 'Equity',
        nominalValue: sh.nominalValue || '10',
        paidUpValue:  sh.paidUpValue  || '10',
      },
      {
        name:           sh.personName || '',
        folioNo:        sh.folioNumber || '',
        certNo:         sh.certificateNumber || '',
        numberOfShares: totalShares,
        distinctiveFrom: sh.distinctiveFrom || 1,
        distinctiveTo:  sh.distinctiveTo || totalShares,
        pan:            sh.panNo,
      },
      {
        name:              transfereeName || '_______________',
        fatherName:        transfereeFather,
        address:           transfereeAddress,
        pan:               transfereePan,
        occupation:        transfereeOccupation,
        newFolioNo:        '(Auto)',
        newCertNo:         '(Auto)',
        newDistinctiveFrom: sh.distinctiveFrom || 1,
        newDistinctiveTo:  sh.distinctiveTo || totalShares,
      },
      {
        transferDate,
        considerationPerShare: consideration,
        totalConsideration,
        stampDuty: autoStampDuty,
        issuePlace,
      },
      signers.filter(s => s.name),
      witnesses
    );
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) { alert('Pop-up blocked!'); return; }
    w.document.write(html); w.document.close();
  }

  async function handleSubmit() {
    if (!transfereeName.trim()) { setError('Transferee name is required'); return; }
    setSaving(true); setError('');
    const res = await fetch('/api/share-transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: company.id,
        transferorPersonId: sh.personId,
        transferorName: sh.personName || '',
        transferorFolio: sh.folioNumber,
        transferorCertNo: sh.certificateNumber,
        transferorShareholderId: sh.id,
        transfereeName: transfereeName.trim(),
        transfereeFatherName: transfereeFather,
        transfereeAddress,
        transfereePan,
        transfereeOccupation,
        numberOfShares: totalShares,
        shareType: sh.shareType || 'Equity',
        transferDate,
        considerationPerShare: consideration || undefined,
        totalConsideration: totalConsideration || undefined,
        stampDuty: autoStampDuty || undefined,
        issuePlace: issuePlace || undefined,
        witness1Name: w1Name || undefined,
        witness1Address: w1Address || undefined,
        witness2Name: w2Name || undefined,
        witness2Address: w2Address || undefined,
        nominalValue: sh.nominalValue || '10',
        paidUpValue:  sh.paidUpValue  || '10',
        signingDirectorsJson: JSON.stringify(signers.filter(s => s.name)),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      const errData = d as { error?: string; needsSplit?: boolean };
      if (errData.needsSplit) {
        setError('⚠️ Partial transfer ke liye pehle certificate split karna hoga. "✂️ Split" button use karein.');
      } else {
        setError(errData.error || 'Transfer failed');
      }
      return;
    }
    const result = await res.json() as { transferId: string; newFolioNo: string; newCertNo: string };

    // ── Auto-create / update Board Meeting + Minutes ──
    const meetingDocIdToUse =
      meetingChoice === 'exact'    ? exactMeeting?.id :
      meetingChoice === 'existing' ? selectedMeetingId :
      undefined;

    await fetch('/api/board-resolutions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId:      company.id,
        companyName:    company.companyName,
        cin:            company.cin            || '',
        regAddress:     company.regAddress     || '',
        meetingDocId:   meetingDocIdToUse      || undefined,
        meetingDate:    brDate,
        meetingSerial:  brSerial               || undefined,
        venue:          brVenue,
        chairmanName:   brChairman             || signers[0]?.name || '',
        directors:      signers.filter(s => s.name).map(s => ({
          name: s.name, din: s.din || '', designation: s.designation, present: true,
        })),
        resolutionText: autoResolutionText,
        transferId:     result.transferId,
      }),
    }).catch(() => {}); // non-blocking — transfer already saved

    alert(`✅ Transfer Complete!\n\nNew Folio: ${result.newFolioNo}\nNew Cert No: ${result.newCertNo}\nOld certificate CANCELLED.\n\n📋 Board Resolution recorded in Meeting minutes.`);
    onDone();
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4 py-8 overflow-y-auto"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between rounded-t-2xl"
          style={{ background: 'linear-gradient(135deg,#065f46,#047857)' }}>
          <div>
            <h3 className="font-bold text-white text-sm">🔄 Share Transfer</h3>
            <p className="text-xs text-white/60 mt-0.5">
              Transferor: {sh.personName} · {sh.numberOfShares?.toLocaleString('en-IN')} shares
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">×</button>
        </div>

        {/* Step tabs */}
        <div className="flex border-b border-slate-100">
          {['BR', 'Details', 'Transferee', 'Witnesses', 'Sign.'].map((label, i) => (
            <button key={i} onClick={() => setStep(i + 1)}
              className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                step === i + 1
                  ? 'border-b-2 border-emerald-600 text-emerald-700'
                  : 'text-slate-400 hover:text-slate-600'
              }`}>
              {i + 1}. {label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">

          {/* ── Step 1: Board Resolution ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 text-xs text-blue-700 font-semibold">
                📋 Companies Act, 2013 — Section 56: Board Resolution is mandatory before any share transfer in a private company.
              </div>

              {/* Meeting date */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Board Meeting Date *</label>
                <input type="date" value={brDate} onChange={e => setBrDate(e.target.value)} className={INP} />
              </div>

              {/* Existing meeting on same date — auto-detect */}
              {meetingsLoaded && exactMeeting && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs space-y-2">
                  <div className="font-bold text-emerald-700">✅ Same-date meeting found!</div>
                  <div className="text-emerald-600">{exactMeeting.title}</div>
                  <div className="text-slate-500">This transfer resolution will be added to the existing meeting minutes.</div>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => { setMeetingChoice('exact'); setSelectedMeetingId(exactMeeting.id); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${meetingChoice === 'exact' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-emerald-300'}`}>
                      ✅ Add to this meeting
                    </button>
                    <button onClick={() => { setMeetingChoice('new'); setSelectedMeetingId(''); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${meetingChoice === 'new' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-slate-300'}`}>
                      + New meeting
                    </button>
                  </div>
                </div>
              )}

              {/* Past meetings dropdown */}
              {meetingsLoaded && !exactMeeting && existingMeetings.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Link to Past Meeting? (optional)</label>
                  <div className="flex gap-2">
                    <select value={meetingChoice === 'existing' ? selectedMeetingId : ''}
                      onChange={e => {
                        if (e.target.value) { setMeetingChoice('existing'); setSelectedMeetingId(e.target.value); }
                        else { setMeetingChoice('new'); setSelectedMeetingId(''); }
                      }}
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400">
                      <option value="">— New meeting for {brDate} —</option>
                      {existingMeetings.map(m => (
                        <option key={m.id} value={m.id}>{m.title} ({m.meetingDate})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* New meeting details — only if creating new */}
              {meetingChoice === 'new' && (
                <div className="space-y-3 border border-slate-100 rounded-xl p-3 bg-slate-50">
                  <div className="text-xs font-bold text-slate-500">📋 New Board Meeting Details</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Meeting Serial No.</label>
                      <input type="text" value={brSerial} onChange={e => setBrSerial(e.target.value)}
                        placeholder="Auto" className={INP} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Chairman</label>
                      <input type="text" value={brChairman} onChange={e => setBrChairman(e.target.value)}
                        placeholder="Director name" className={INP} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Venue</label>
                    <input type="text" value={brVenue} onChange={e => setBrVenue(e.target.value)}
                      placeholder="Registered Office..." className={INP} />
                  </div>
                </div>
              )}

              {/* Resolution preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Resolution Text (auto-generated)</label>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-slate-600 leading-relaxed italic">
                  {autoResolutionText}
                </div>
                <p className="text-xs text-slate-400 mt-1">✏️ Final text will update once transferee name & consideration are filled.</p>
              </div>
            </div>
          )}

          {/* ── Step 2: Transfer Details ── */}
          {step === 2 && (
            <div className="space-y-3">
              {/* 60-day warning */}
              {past60 && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700 font-semibold">
                  ⛔ 60-day deadline passed! SH-4 must be submitted to company within 60 days of execution date.
                </div>
              )}
              {show60Warn && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 font-semibold">
                  ⚠️ Only {daysLeft} days left to submit SH-4 to company (60-day rule — Section 56)
                </div>
              )}

              {/* Transferor info */}
              <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 space-y-1">
                <div className="font-bold text-slate-600 mb-1">📤 Transferor Certificate</div>
                <div><span className="font-semibold">Name:</span> {sh.personName}</div>
                <div><span className="font-semibold">Folio:</span> {sh.folioNumber || '—'} · <span className="font-semibold">Cert No:</span> {sh.certificateNumber || '—'}</div>
                <div className="font-semibold text-blue-700">{totalShares.toLocaleString('en-IN')} shares (full cert transfer)</div>
                {sh.distinctiveFrom && sh.distinctiveTo && (
                  <div className="font-mono text-slate-500">DN: {String(sh.distinctiveFrom).padStart(5,'0')} – {sh.distinctiveTo}</div>
                )}
                <div className="text-amber-600 font-semibold pt-1">
                  ⚠️ This will CANCEL Cert No. {sh.certificateNumber}. For partial transfer, use ✂️ Split first.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Date of Transfer *</label>
                <input type="date" value={transferDate} onChange={e => setTransferDate(e.target.value)} className={INP} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Consideration (₹ per share)</label>
                <input type="number" value={consideration} onChange={e => setConsideration(e.target.value)}
                  placeholder="e.g. 10" className={INP} />
              </div>

              {totalConsideration && (
                <div className="bg-emerald-50 rounded-xl px-3 py-2.5 space-y-1">
                  <div className="text-xs font-bold text-emerald-700">💰 Total: ₹ {parseFloat(totalConsideration).toLocaleString('en-IN')}</div>
                  <div className="text-xs text-emerald-600">
                    📌 Stamp Duty (0.25%): <strong>₹ {parseFloat(autoStampDuty).toLocaleString('en-IN')}</strong>
                    <span className="text-slate-400 ml-1">(auto-calculated)</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Place of Execution</label>
                <input type="text" value={issuePlace} onChange={e => setIssuePlace(e.target.value)}
                  placeholder="e.g. Mumbai" className={INP} />
              </div>
            </div>
          )}

          {/* ── Step 3: Transferee ── */}
          {step === 3 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name of Transferee *</label>
                <input type="text" value={transfereeName} onChange={e => setTransfereeName(e.target.value)}
                  placeholder="Full name" className={INP} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Father's / Spouse's Name</label>
                <input type="text" value={transfereeFather} onChange={e => setTransfereeFather(e.target.value)}
                  placeholder="optional" className={INP} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Address</label>
                <textarea value={transfereeAddress} onChange={e => setTransfereeAddress(e.target.value)}
                  rows={2} placeholder="Full address"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">PAN</label>
                  <input type="text" value={transfereePan} onChange={e => setTransfereePan(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F" maxLength={10}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Occupation</label>
                  <input type="text" value={transfereeOccupation} onChange={e => setTransfereeOccupation(e.target.value)}
                    placeholder="optional"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-600">
                <strong>Note:</strong> Folio No. and Certificate No. will be auto-generated (next available number).
              </div>
            </div>
          )}

          {/* ── Step 4: Witnesses ── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 font-semibold">
                ⚖️ Section 56: SH-4 requires 2 independent witnesses (mandatory)
              </div>
              {/* Witness 1 */}
              <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                <div className="text-xs font-bold text-slate-600 mb-1">👤 Witness 1 (Transferor's Side) *</div>
                <input type="text" value={w1Name} onChange={e => setW1Name(e.target.value)}
                  placeholder="Full Name of Witness 1" className={INP} />
                <textarea value={w1Address} onChange={e => setW1Address(e.target.value)}
                  rows={2} placeholder="Address of Witness 1"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
              </div>
              {/* Witness 2 */}
              <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                <div className="text-xs font-bold text-slate-600 mb-1">👤 Witness 2 (Transferee's Side) *</div>
                <input type="text" value={w2Name} onChange={e => setW2Name(e.target.value)}
                  placeholder="Full Name of Witness 2" className={INP} />
                <textarea value={w2Address} onChange={e => setW2Address(e.target.value)}
                  rows={2} placeholder="Address of Witness 2"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
              </div>
              <div className="bg-blue-50 rounded-xl px-3 py-2 text-xs text-blue-600">
                Witnesses must be independent persons — not related to transferor or transferee.
              </div>
            </div>
          )}

          {/* ── Step 5: Signatories ── */}
          {step === 5 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">Authorised signatories for Form SH-4 &amp; new certificate</p>
              {signers.map((s, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Signatory {i + 1}</span>
                    {signers.length > 1 && (
                      <button onClick={() => removeSigner(i)} className="text-xs text-red-400 hover:text-red-600">✕ Remove</button>
                    )}
                  </div>
                  <input type="text" value={s.name} onChange={e => updateSigner(i, 'name', e.target.value)}
                    placeholder="Full Name"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={s.designation} onChange={e => updateSigner(i, 'designation', e.target.value)}
                      placeholder="Designation"
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    <input type="text" value={s.din || ''} onChange={e => updateSigner(i, 'din', e.target.value)}
                      placeholder="DIN (optional)"
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  </div>
                </div>
              ))}
              <button onClick={addSigner}
                className="text-xs font-semibold text-emerald-700 border border-emerald-200 rounded-lg px-3 py-2 hover:bg-emerald-50 w-full">
                + Add Signatory
              </button>

              {/* Preview SH-4 */}
              <button onClick={printSH4Preview}
                className="w-full py-2.5 rounded-xl font-bold text-sm border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 flex items-center justify-center gap-2">
                👁️ Preview Form SH-4
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600 font-semibold">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3 border-t border-slate-100 pt-4">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">
            Cancel
          </button>
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">
              ← Back
            </button>
          )}
          {step < 5 ? (
            <button onClick={() => { setError(''); setStep(s => s + 1); }}
              className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#065f46,#047857)' }}>
              Next →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#065f46,#047857)' }}>
              {saving ? '⏳ Saving...' : '✅ Execute Transfer'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Director View Modal ──────────────────────────────── */
function DirectorViewModal({
  person, onClose,
}: { person: PersonKYC; onClose: () => void }) {
  const row = (label: string, val?: string | boolean | null, mono = false) =>
    val != null && val !== '' && val !== false ? (
      <div key={label} className="flex gap-3 py-1.5 border-b border-slate-50">
        <span className="text-xs text-slate-400 w-36 shrink-0 pt-0.5">{label}</span>
        <span className={`text-xs font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`}>{String(val)}</span>
      </div>
    ) : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4 py-8 overflow-y-auto"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 flex items-center justify-between rounded-t-2xl"
          style={{background:'linear-gradient(135deg,#0f172a,#1e40af)'}}>
          <div>
            <h3 className="font-bold text-white text-sm">{person.name}</h3>
            <p className="text-xs text-white/60 mt-0.5">{person.designation || 'Director'} · {person.isActive === false ? 'Ceased' : 'Active'}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">🏢 Company Role</p>
            <div className="bg-blue-50 rounded-xl px-4 py-3 space-y-0">
              {row('DIN', person.din, true)}
              {row('Designation', person.designation)}
              {row('Category', person.directorCategory || person.category)}
              {row('Date of Joining', person.dateOfJoining || person.appointedAt)}
              {row('KYC Status', person.panNo && person.mobile ? '✅ Complete' : '⚠️ Pending')}
            </div>
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">👤 Personal Details</p>
            <div className="space-y-0">
              {row('Father Name', person.fatherName)}
              {row('Date of Birth', person.dateOfBirth)}
              {row('Nationality', person.nationality)}
              {row('Occupation', person.occupation)}
            </div>
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">📞 Contact</p>
            <div className="space-y-0">
              {row('Mobile', person.mobile)}
              {row('Email', person.email)}
              {row('Present Address', person.presentAddress)}
              {row('Permanent Address', person.permanentAddress)}
            </div>
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">🪪 Identity</p>
            <div className="space-y-0">
              {row('PAN', person.panNo, true)}
              {row('Aadhaar', person.aadhaarNo, true)}
            </div>
          </div>
          {(person.bankName || person.accountNo) && (
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">🏦 Bank</p>
              <div className="space-y-0">
                {row('Bank Name', person.bankName)}
                {row('Account No.', person.accountNo, true)}
                {row('IFSC', person.ifscCode, true)}
              </div>
            </div>
          )}
          {(person.nomineeName) && (
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">🔒 Nominee</p>
              <div className="space-y-0">
                {row('Nominee Name', person.nomineeName)}
                {row('Relation', person.nomineeRelation)}
                {row('Address', person.nomineeAddress)}
              </div>
            </div>
          )}
        </div>
        <div className="px-5 pb-5">
          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Transfers Tab ───────────────────────────────────── */
interface TransferRecord {
  id: string;
  transferorName: string;
  transfereeName: string;
  transferorFolio?: string;
  transferorCertNo?: string;
  transfereeFolio?: string;
  transfereeCertNo?: string;
  numberOfShares?: number;
  shareType?: string;
  distinctiveFrom?: number;
  distinctiveTo?: number;
  transferDate?: string;
  considerationPerShare?: string;
  totalConsideration?: string;
  stampDuty?: string;
  issuePlace?: string;
  nominalValue?: string;
  paidUpValue?: string;
  signingDirectorsJson?: string;
  status?: string;
  createdAt: string;
}

function TransfersTab({ companyId, company }: { companyId: string; company: Company }) {
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loading, setLoading]     = useState(true);
  const [viewT, setViewT]         = useState<TransferRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/share-transfers?companyId=${companyId}`);
    const d = r.ok ? await r.json() : { transfers: [] };
    setTransfers(d.transfers || []);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  function printSH4(t: TransferRecord) {
    import('@/lib/share-transfer-html').then(({ generateSH4HTML }) => {
      let signers: { name: string; designation: string; din?: string }[] = [];
      if (t.signingDirectorsJson) {
        try { signers = JSON.parse(t.signingDirectorsJson); } catch { /* */ }
      }
      const html = generateSH4HTML(
        {
          companyName:  company.companyName,
          cin:          company.cin || '',
          regAddress:   company.regAddress || '',
          shareClass:   t.shareType || 'Equity',
          nominalValue: t.nominalValue || '10',
          paidUpValue:  t.paidUpValue  || '10',
        },
        {
          name:           t.transferorName,
          folioNo:        t.transferorFolio || '',
          certNo:         t.transferorCertNo || '',
          numberOfShares: t.numberOfShares || 0,
          distinctiveFrom: t.distinctiveFrom || 1,
          distinctiveTo:  t.distinctiveTo   || 0,
        },
        {
          name:              t.transfereeName,
          newFolioNo:        t.transfereeFolio || '—',
          newCertNo:         t.transfereeCertNo || '—',
          newDistinctiveFrom: t.distinctiveFrom || 1,
          newDistinctiveTo:  t.distinctiveTo   || 0,
        },
        {
          transferDate:          t.transferDate || '',
          considerationPerShare: t.considerationPerShare || undefined,
          totalConsideration:    t.totalConsideration    || undefined,
          stampDuty:             t.stampDuty             || undefined,
          issuePlace:            t.issuePlace            || undefined,
        },
        signers
      );
      const w = window.open('', '_blank', 'width=900,height=700');
      if (!w) { alert('Pop-up blocked!'); return; }
      w.document.write(html); w.document.close();
    });
  }

  function printNewCert(t: TransferRecord) {
    import('@/lib/share-certificate-html').then(({ generateShareCertificateHTML, computeCertRanges }) => {
      let signers: { name: string; designation: string; din?: string }[] = [];
      if (t.signingDirectorsJson) {
        try { signers = JSON.parse(t.signingDirectorsJson); } catch { /* */ }
      }
      const ranges = computeCertRanges([{ shares: t.numberOfShares || 0 }], t.distinctiveFrom || 1);
      const html = generateShareCertificateHTML(
        {
          companyName:  company.companyName,
          cin:          company.cin || '',
          regAddress:   company.regAddress || '',
          shareClass:   t.shareType || 'Equity',
          nominalValue: t.nominalValue || '10',
          paidUpValue:  t.paidUpValue  || '10',
          issueDate:    t.transferDate || '',
          issuePlace:   t.issuePlace   || '',
        },
        [{ name: t.transfereeName, din: '', shares: t.numberOfShares || 0 }],
        [{ ...ranges[0], folioNo: t.transfereeFolio || '01', certNo: t.transfereeCertNo || '01' }],
        signers
      );
      const w = window.open('', '_blank', 'width=900,height=700');
      if (!w) { alert('Pop-up blocked!'); return; }
      w.document.write(html); w.document.close();
    });
  }

  if (loading) return <div className="text-sm text-slate-400 text-center py-12">Loading transfer history...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold text-slate-800">Share Transfer History</h2>
          <p className="text-xs text-slate-400 mt-0.5">{transfers.length} transfer{transfers.length !== 1 ? 's' : ''} recorded</p>
        </div>
        <a href="/tools/documents/share-transfer"
          className="text-xs font-semibold px-4 py-2 rounded-xl text-white flex items-center gap-1.5"
          style={{ background: 'linear-gradient(135deg,#065f46,#047857)' }}>
          + New Transfer
        </a>
      </div>

      {transfers.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="text-4xl mb-3">🔄</div>
          <p className="font-semibold text-slate-600">No transfers recorded</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">Execute a share transfer to see history here</p>
          <a href="/tools/documents/share-transfer"
            className="inline-block px-5 py-2.5 rounded-xl font-bold text-white text-sm"
            style={{ background: 'linear-gradient(135deg,#065f46,#047857)' }}>
            + New Transfer
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {transfers.map(t => (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Transfer arrow visual */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-slate-800">{t.transferorName}</span>
                    <span className="text-slate-400 font-bold">→</span>
                    <span className="font-bold text-emerald-700">{t.transfereeName}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-black text-blue-700 text-lg">{(t.numberOfShares||0).toLocaleString('en-IN')}</div>
                  <div className="text-xs text-slate-400">{t.shareType || 'Equity'} shares</div>
                </div>
              </div>

              {/* Details chips */}
              <div className="flex flex-wrap gap-2 mb-3">
                {t.transferDate && (
                  <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2.5 py-1">
                    📅 {t.transferDate}
                  </span>
                )}
                {t.transferorFolio && (
                  <span className="text-xs bg-blue-50 text-blue-600 rounded-full px-2.5 py-1">
                    Folio: {t.transferorFolio} → {t.transfereeFolio || '—'}
                  </span>
                )}
                {t.transferorCertNo && (
                  <span className="text-xs bg-amber-50 text-amber-600 rounded-full px-2.5 py-1">
                    Cert: {t.transferorCertNo} → {t.transfereeCertNo || '—'}
                  </span>
                )}
                {t.distinctiveFrom && t.distinctiveTo && (
                  <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-2.5 py-1 font-mono">
                    {String(t.distinctiveFrom).padStart(5,'0')}–{t.distinctiveTo}
                  </span>
                )}
                {t.totalConsideration && (
                  <span className="text-xs bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-1 font-semibold">
                    ₹ {parseFloat(t.totalConsideration).toLocaleString('en-IN')}
                  </span>
                )}
                <span className={`text-xs rounded-full px-2.5 py-1 font-semibold ${
                  t.status === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {t.status === 'approved' ? '✅ Approved' : '⏳ Pending'}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setViewT(t)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100">
                  👁️ View Details
                </button>
                <button onClick={() => printSH4(t)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100">
                  🖨️ Print SH-4
                </button>
                <button onClick={() => printNewCert(t)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100">
                  📜 New Certificate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Transfer Detail Modal ── */}
      {viewT && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4 py-8"
          onClick={() => setViewT(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between rounded-t-2xl sticky top-0 z-10"
              style={{ background: 'linear-gradient(135deg,#065f46,#047857)' }}>
              <div>
                <h3 className="font-bold text-white text-sm">🔄 Transfer Details</h3>
                <p className="text-xs text-white/60 mt-0.5">
                  {viewT.transferorName} → {viewT.transfereeName}
                </p>
              </div>
              <button onClick={() => setViewT(null)} className="text-white/70 hover:text-white text-xl">×</button>
            </div>

            <div className="p-5 space-y-4">
              {/* Shares */}
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-emerald-700">{(viewT.numberOfShares||0).toLocaleString('en-IN')}</div>
                <div className="text-xs text-emerald-600 mt-1">{viewT.shareType || 'Equity'} Shares Transferred</div>
                {viewT.transferDate && <div className="text-xs text-slate-500 mt-0.5">on {viewT.transferDate}</div>}
              </div>

              {/* Transferor */}
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">📤 Transferor</p>
                <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-slate-400">Name</span><span className="font-bold text-slate-800">{viewT.transferorName}</span></div>
                  {viewT.transferorFolio && <div className="flex justify-between"><span className="text-slate-400">Folio No.</span><span className="font-semibold">{viewT.transferorFolio}</span></div>}
                  {viewT.transferorCertNo && <div className="flex justify-between"><span className="text-slate-400">Cert No.</span><span className="font-semibold">{viewT.transferorCertNo}</span></div>}
                </div>
              </div>

              {/* Transferee */}
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">📥 Transferee</p>
                <div className="bg-emerald-50 rounded-xl px-4 py-3 space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-slate-400">Name</span><span className="font-bold text-emerald-800">{viewT.transfereeName}</span></div>
                  {viewT.transfereeFolio && <div className="flex justify-between"><span className="text-slate-400">New Folio No.</span><span className="font-semibold text-emerald-700">{viewT.transfereeFolio}</span></div>}
                  {viewT.transfereeCertNo && <div className="flex justify-between"><span className="text-slate-400">New Cert No.</span><span className="font-semibold text-emerald-700">{viewT.transfereeCertNo}</span></div>}
                </div>
              </div>

              {/* Distinctive Nos */}
              {viewT.distinctiveFrom && viewT.distinctiveTo && (
                <div className="bg-blue-50 rounded-xl px-4 py-3 text-xs font-mono text-blue-700 text-center">
                  <span className="font-bold not-italic">Distinctive Nos:</span>&nbsp;
                  {String(viewT.distinctiveFrom).padStart(5,'0')} – {viewT.distinctiveTo}
                </div>
              )}

              {/* Financials */}
              {(viewT.considerationPerShare || viewT.totalConsideration || viewT.stampDuty) && (
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">💰 Financials</p>
                  <div className="space-y-1 text-xs">
                    {viewT.considerationPerShare && <div className="flex justify-between"><span className="text-slate-400">Consideration/share</span><span className="font-semibold">₹ {viewT.considerationPerShare}</span></div>}
                    {viewT.totalConsideration && <div className="flex justify-between"><span className="text-slate-400">Total Consideration</span><span className="font-bold text-emerald-700">₹ {parseFloat(viewT.totalConsideration).toLocaleString('en-IN')}</span></div>}
                    {viewT.stampDuty && <div className="flex justify-between"><span className="text-slate-400">Stamp Duty</span><span className="font-semibold">₹ {viewT.stampDuty}</span></div>}
                  </div>
                </div>
              )}

              {/* Signatories */}
              {viewT.signingDirectorsJson && (() => {
                try {
                  const sigs = JSON.parse(viewT.signingDirectorsJson) as { name: string; designation: string; din?: string }[];
                  if (!sigs.length) return null;
                  return (
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">✍️ Signatories</p>
                      <div className="space-y-1">
                        {sigs.map((s, i) => (
                          <div key={i} className="text-xs flex gap-2">
                            <span className="font-semibold text-slate-700">{s.name}</span>
                            <span className="text-slate-400">{s.designation}</span>
                            {s.din && <span className="font-mono text-slate-400">DIN: {s.din}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                } catch { return null; }
              })()}
            </div>

            {/* Footer buttons */}
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => printSH4(viewT)}
                className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#065f46,#047857)' }}>
                🖨️ Print SH-4
              </button>
              <button onClick={() => printNewCert(viewT)}
                className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#1e40af,#1d4ed8)' }}>
                📜 New Cert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Directors Tab ───────────────────────────────────── */
function DirectorsTab({ companyId, company }: { companyId: string; company: Company }) {
  const [persons, setPersons] = useState<PersonKYC[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPerson, setEditPerson] = useState<PersonKYC | null>(null);
  const [viewPerson, setViewPerson] = useState<PersonKYC | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [creatingKyc, setCreatingKyc] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/persons?companyId=${companyId}&type=director`);
    const d = r.ok ? await r.json() : { persons: [] };
    setPersons(d.persons || []);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  /** Ensure csi_persons record exists, return its id */
  async function ensureKycRecord(p: PersonKYC): Promise<string | null> {
    if (p.id) return p.id;
    // Create KYC record for this director
    const res = await fetch('/api/persons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId,
        name: p.name,
        din: p.din || null,
        designation: p.designation || null,
        directorCategory: p.directorCategory || p.category || null,
        dateOfJoining: p.dateOfJoining || p.appointedAt || null,
        isDirector: true,
        isShareholder: false,
      }),
    });
    const d = res.ok ? await res.json() : null;
    return d?.id ?? null;
  }

  async function handleEditKyc(p: PersonKYC) {
    if (!p.id) {
      // Create KYC record first, then open modal with refreshed data
      setCreatingKyc(p._directorId || p.name);
      const newId = await ensureKycRecord(p);
      setCreatingKyc(null);
      if (newId) {
        // Re-fetch to get fresh merged data
        const r = await fetch(`/api/persons?companyId=${companyId}&type=director`);
        const d = r.ok ? await r.json() : { persons: [] };
        const fresh = (d.persons as PersonKYC[]).find(x => x.id === newId || x._directorId === p._directorId);
        if (fresh) { setPersons(d.persons); setEditPerson(fresh); }
      }
    } else {
      setEditPerson(p);
    }
  }

  async function handleSync(p: PersonKYC) {
    const id = await ensureKycRecord(p);
    if (!id) return;
    setSyncing(id);
    await fetch(`/api/persons/${id}/sync`, { method: 'POST' });
    setSyncing(null);
    load();
  }

  async function handleDelete(p: PersonKYC) {
    if (!confirm('Remove this director?')) return;
    if (p.id) {
      await fetch(`/api/persons/${p.id}`, { method: 'DELETE' });
    }
    load();
  }

  if (loading) return <div className="text-sm text-slate-400 text-center py-12">Loading directors...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="font-bold text-slate-800">Directors & KYC</h2>
          <p className="text-xs text-slate-400 mt-0.5">From MCA Excel upload · Edit to add KYC details</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {persons.length > 0 && (
            <button onClick={() => printAllDirectors(persons, company)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 flex items-center gap-1">
              🖨️ Print All Directors
            </button>
          )}
          <button onClick={() => setShowAdd(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100">
            + Add Director
          </button>
        </div>
      </div>

      {persons.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="text-4xl mb-3">👥</div>
          <p className="font-semibold text-slate-600">No directors found</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">Upload company Excel to auto-import directors, or add manually</p>
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
            const cardKey = p.id || p._directorId || p.name;
            const isCreating = creatingKyc === (p._directorId || p.name);
            return (
              <div key={cardKey} className={`bg-white rounded-2xl border p-5 hover:shadow-md transition-shadow ${
                p.isActive === false ? 'border-slate-100 opacity-60' : 'border-slate-200'
              }`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 truncate">{p.name}</div>
                    {p.din && <div className="text-xs font-mono text-slate-400 mt-0.5">DIN: {p.din}</div>}
                    {p.designation && <div className="text-xs text-slate-500 mt-0.5">{p.designation}</div>}
                    {(p.directorCategory || p.category) && (
                      <div className="text-xs text-slate-400">
                        {p.directorCategory || p.category}
                      </div>
                    )}
                    {p.isActive === false && (
                      <span className="inline-block text-xs bg-red-50 text-red-500 border border-red-200 px-2 py-0.5 rounded-full mt-1">
                        Ceased
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 whitespace-nowrap ${
                    complete ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                             : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {complete ? '✅ KYC Done' : '⚠️ KYC Pending'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button onClick={() => setViewPerson(p)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100">
                    👁️ View
                  </button>
                  <button onClick={() => handleEditKyc(p)} disabled={isCreating}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 disabled:opacity-60">
                    {isCreating ? '⏳...' : '✏️ Edit KYC'}
                  </button>
                  <button
                    onClick={() => handleSync(p)}
                    disabled={syncing === p.id}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                      p.isShareholder
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100'
                    }`}>
                    {syncing === p.id ? '...' : p.isShareholder ? '🔗 Shareholder' : '🔄 Add as SH'}
                  </button>
                  {p.id && (
                    <button onClick={() => handleDelete(p)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 ml-auto">
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editPerson && <KYCModal person={editPerson} onClose={() => setEditPerson(null)} onSaved={load} />}
      {viewPerson && <DirectorViewModal person={viewPerson} onClose={() => setViewPerson(null)} />}
      {showAdd && <AddPersonModal companyId={companyId} mode="director" onClose={() => setShowAdd(false)} onSaved={load} />}
    </div>
  );
}

/* ── Split Certificate Modal ─────────────────────────── */
function SplitCertificateModal({
  sh, companyId, onClose, onDone,
}: {
  sh: ShareholderRow & { personName?: string };
  companyId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const INP = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400';
  const totalShares = sh.numberOfShares || 0;

  // Default: 2 equal parts
  const half = Math.floor(totalShares / 2);
  const [parts, setParts] = useState<Array<{ shares: number }>>([
    { shares: half },
    { shares: totalShares - half },
  ]);
  const [splitDate, setSplitDate] = useState(new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks]     = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const partsTotal = parts.reduce((s, p) => s + (p.shares || 0), 0);
  const isBalanced = partsTotal === totalShares;

  const updatePart = (i: number, val: number) => {
    const next = [...parts];
    next[i] = { shares: val };
    setParts(next);
  };
  const addPart = () => setParts(p => [...p, { shares: 0 }]);
  const removePart = (i: number) => { if (parts.length > 2) setParts(p => p.filter((_, j) => j !== i)); };

  const handleSplit = async () => {
    if (!isBalanced) { setError(`Parts total ${partsTotal} ≠ ${totalShares}`); return; }
    if (parts.some(p => p.shares <= 0)) { setError('All parts must have > 0 shares'); return; }
    setSaving(true); setError('');
    try {
      const r = await fetch('/api/share-splits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, originalShId: sh.id, splitDate, parts, remarks }),
      });
      const d = await r.json() as { error?: string; newCertificates?: unknown[] };
      if (!r.ok) { setError(d.error || 'Split failed'); return; }
      onDone();
    } catch { setError('Network error'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg,#4c1d95,#7c3aed)' }}>
          <div>
            <h2 className="font-black text-white text-base">✂️ Split Certificate</h2>
            <p className="text-violet-200 text-xs mt-0.5">
              Cert No. {sh.certificateNumber} · {totalShares.toLocaleString('en-IN')} shares
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Legal notice */}
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-xs text-violet-800 space-y-1">
            <div className="font-bold">📋 Certificate Split Process:</div>
            <div>1. Old Cert No. <strong>{sh.certificateNumber}</strong> → CANCELLED (status: split)</div>
            <div>2. New certificates issued with next sequential numbers</div>
            <div>3. Same folio, same shareholder, same DN range redistributed</div>
            <div>4. Then transfer one of the new certs via 🔄 Transfer</div>
          </div>

          {/* Shareholder info */}
          <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 space-y-1">
            <div><span className="font-semibold">Shareholder:</span> {sh.personName}</div>
            <div><span className="font-semibold">Folio:</span> {sh.folioNumber} · <span className="font-semibold">Cert:</span> {sh.certificateNumber}</div>
            {sh.distinctiveFrom && sh.distinctiveTo && (
              <div className="font-mono">DN: {sh.distinctiveFrom} – {sh.distinctiveTo}</div>
            )}
          </div>

          {/* Split date */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Date of Split *</label>
            <input type="date" value={splitDate} onChange={e => setSplitDate(e.target.value)} className={INP} />
          </div>

          {/* Parts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500">Split into Parts *</label>
              <button onClick={addPart}
                className="text-xs font-semibold text-violet-700 border border-violet-200 rounded-lg px-2 py-1 hover:bg-violet-50">
                + Add Part
              </button>
            </div>
            <div className="space-y-2">
              {parts.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 w-6">P{i+1}</span>
                  <input type="number" value={p.shares || ''} min={1} max={totalShares}
                    onChange={e => updatePart(i, parseInt(e.target.value) || 0)}
                    placeholder="Shares"
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  <span className="text-xs text-slate-400">shares</span>
                  {parts.length > 2 && (
                    <button onClick={() => removePart(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  )}
                </div>
              ))}
            </div>
            <div className={`text-xs mt-2 font-semibold ${isBalanced ? 'text-emerald-600' : 'text-red-500'}`}>
              {isBalanced
                ? `✅ Total: ${partsTotal} shares (balanced)`
                : `❌ Total: ${partsTotal} / ${totalShares} shares — must equal original`}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Remarks (optional)</label>
            <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. Split for partial transfer to X" className={INP} />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600 font-semibold">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3 border-t border-slate-100 pt-4">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={handleSplit} disabled={saving || !isBalanced}
            className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#4c1d95,#7c3aed)' }}>
            {saving ? '⏳ Splitting...' : '✂️ Execute Split'}
          </button>
        </div>
      </div>
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
  // Certificate metadata (saved when generating)
  nominalValue?: string;
  paidUpValue?: string;
  issuePlace?: string;
  signingDirectorsJson?: string;
  // Transfer tracking
  transferStatus?: string;   // 'transferred' | 'partial' | 'received'
  transferredShares?: number;
  sourceTransferId?: string;
  // Certificate lifecycle
  certStatus?: string;       // 'active' | 'split' | 'cancelled'
  cancelledReason?: string;
  splitFromId?: string;
  splitEventId?: string;
}

function ShareholdersTab({ companyId, company }: { companyId: string; company: Company }) {
  const [shareholders, setShareholders] = useState<ShareholderRow[]>([]);
  const [totalShares, setTotalShares] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [editPerson, setEditPerson] = useState<PersonKYC | null>(null);
  const [viewSh, setViewSh] = useState<ShareholderRow | null>(null);
  const [transferSh, setTransferSh] = useState<ShareholderRow | null>(null);
  const [splitSh, setSplitSh]       = useState<ShareholderRow | null>(null);

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
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="font-bold text-slate-800">Shareholders</h2>
          {totalShares > 0 && (
            <p className="text-xs text-slate-400 mt-0.5">Total issued: {totalShares.toLocaleString('en-IN')} shares</p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {shareholders.length > 0 && (
            <button onClick={() => printAllShareholders(shareholders, company, totalShares)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 flex items-center gap-1">
              🖨️ Print All
            </button>
          )}
          <button onClick={() => setShowAdd(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100">
            + Add Shareholder
          </button>
        </div>
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
          {shareholders.map(sh => {
            const isCancelled = sh.certStatus === 'cancelled' || sh.certStatus === 'split';
            return (
            <div key={sh.id} className={`rounded-2xl border p-5 transition-shadow relative ${
              isCancelled
                ? 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-80'
                : 'bg-white border-slate-200 hover:shadow-md'
            }`}>
              {/* Cancelled diagonal stamp */}
              {isCancelled && (
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                  <div className="absolute top-3 right-3">
                    <div className={`text-xs font-black px-2.5 py-1 rounded-lg rotate-12 border-2 ${
                      sh.certStatus === 'split'
                        ? 'bg-amber-50 text-amber-600 border-amber-300'
                        : 'bg-red-50 text-red-500 border-red-300'
                    }`}>
                      {sh.certStatus === 'split' ? '✂️ SPLIT' : '🚫 CANCELLED'}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className={`font-bold flex items-center gap-2 ${isCancelled ? 'text-slate-400 line-through decoration-slate-400' : 'text-slate-800'}`}>
                    {sh.personName || '—'}
                    {sh.transferStatus === 'transferred' && (
                      <span className="text-xs font-semibold bg-red-100 text-red-600 rounded px-1.5 py-0.5 no-underline" style={{textDecoration:'none'}}>Transferred</span>
                    )}
                    {sh.transferStatus === 'partial' && (
                      <span className="text-xs font-semibold bg-amber-100 text-amber-600 rounded px-1.5 py-0.5 no-underline" style={{textDecoration:'none'}}>Partial</span>
                    )}
                    {sh.transferStatus === 'received' && (
                      <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 rounded px-1.5 py-0.5 no-underline" style={{textDecoration:'none'}}>Received</span>
                    )}
                  </div>
                  {sh.folioNumber && <div className="text-xs text-slate-400">Folio: {sh.folioNumber}</div>}
                  {sh.certificateNumber && <div className={`text-xs ${isCancelled ? 'text-slate-400 line-through' : 'text-slate-400'}`}>Cert No: {sh.certificateNumber}</div>}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`font-black text-lg ${isCancelled ? 'text-slate-400' : 'text-blue-700'}`}>{(sh.numberOfShares||0).toLocaleString('en-IN')}</div>
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
              {/* Cert status badge */}
              {sh.certStatus && sh.certStatus !== 'active' && (
                <div className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full mb-2 ${
                  sh.certStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                  sh.certStatus === 'split'     ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {sh.certStatus === 'cancelled' ? '🚫 Cancelled' : '✂️ Split'}
                  {sh.cancelledReason ? ` (${sh.cancelledReason})` : ''}
                </div>
              )}
              {sh.transferStatus === 'received' && (
                <div className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 mb-2 ml-1">
                  📥 Received via Transfer
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <button onClick={() => setViewSh(sh)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100">
                  👁️ View
                </button>
                <button onClick={() => printShareCertificate(sh, company)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100">
                  🖨️ Certificate
                </button>
                {(sh.numberOfShares || 0) > 0 && sh.certStatus !== 'cancelled' && sh.certStatus !== 'split' && sh.transferStatus !== 'transferred' && (
                  <>
                    <button onClick={() => setTransferSh(sh)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100">
                      🔄 Transfer
                    </button>
                    <button onClick={() => setSplitSh(sh)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100">
                      ✂️ Split
                    </button>
                  </>
                )}
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
                  {syncing === sh.personId ? '...' : sh.isDirector ? '🔗 Dir.' : '🔄 Add as Dir.'}
                </button>
                <button onClick={() => handleDelete(sh.id)}
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
      {showAdd && <AddPersonModal companyId={companyId} mode="shareholder" onClose={() => setShowAdd(false)} onSaved={load} />}
      {viewSh && (
        <ShareholderViewModal
          sh={viewSh}
          company={company}
          onClose={() => setViewSh(null)}
          onPrint={() => { printShareCertificate(viewSh, company); setViewSh(null); }}
        />
      )}
      {transferSh && (
        <ShareTransferModal
          sh={transferSh}
          company={company}
          onClose={() => setTransferSh(null)}
          onDone={() => { setTransferSh(null); load(); }}
        />
      )}
      {splitSh && (
        <SplitCertificateModal
          sh={splitSh}
          companyId={companyId}
          onClose={() => setSplitSh(null)}
          onDone={() => { setSplitSh(null); load(); }}
        />
      )}
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
  const [activeTab, setActiveTab] = useState<'timeline' | 'directors' | 'shareholders' | 'transfers' | 'analysis'>('timeline');
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
            {(['timeline', 'directors', 'shareholders', 'transfers', 'analysis'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                  activeTab===tab ? 'text-white border-white' : 'text-blue-300 border-transparent hover:text-white'
                }`}>
                {tab === 'timeline'     ? '📅 Meeting Timeline' :
                 tab === 'directors'    ? '👥 Directors' :
                 tab === 'shareholders' ? '📜 Shareholders' :
                 tab === 'transfers'    ? '🔄 Transfers' :
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
          <DirectorsTab companyId={companyId} company={company!} />
        )}

        {activeTab === 'shareholders' && (
          <ShareholdersTab companyId={companyId} company={company!} />
        )}

        {activeTab === 'transfers' && (
          <TransfersTab companyId={companyId} company={company!} />
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
