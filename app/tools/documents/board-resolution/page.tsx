"use client";
import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import CompanySearch from "@/components/CompanySearch";
import CompanyExcelUpload from "@/components/CompanyExcelUpload";
import type { CompanyData } from "@/lib/types/company";
import {
  ALL_BR_TEMPLATES, BR_CATEGORY_ORDER, BR_CATEGORY_META,
  fillBRTemplate, type BRTemplate,
} from "@/lib/board-resolution-templates";

/* ── Helpers ──────────────────────────────────────────────────── */
const INP = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white";
const SEL = INP + " cursor-pointer";

function fmtDate(d: string) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

/* ══════════════════════════════════════════════════════════════════
   PRINT HTML — Board Resolution
══════════════════════════════════════════════════════════════════ */
function generateBRHtml(
  company: { companyName: string; cin: string; regAddress: string },
  template: BRTemplate,
  fields: Record<string, string>,
  meetingDate: string,
  meetingSerial: string,
  resolutionNo: string,
  directors: string[],
  chairmanName: string,
  onLetterhead: boolean,
): string {
  const preamble = fillBRTemplate(template.preamble, fields);
  const resolution = fillBRTemplate(template.resolution, fields);
  const fmtMeetingDate = fmtDate(meetingDate);

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>Board Resolution — ${template.title}</title>
<style>
  @page { size: A4; margin: 20mm 20mm 20mm 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Times New Roman", serif; font-size: 11pt; color: #1a1a1a; line-height: 1.7; }
  .letterhead { text-align: center; border-bottom: 2.5px double #1a3a6b; padding-bottom: 12px; margin-bottom: 18px; }
  .co-name { font-size: 15pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #1a3a6b; }
  .co-sub { font-size: 9pt; color: #555; margin-top: 3px; }
  .title-box { text-align: center; margin: 18px 0 14px; }
  .title-box h2 { font-size: 12pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #333; display: inline-block; padding-bottom: 3px; }
  .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10pt; }
  .meta-table td { padding: 3px 8px; vertical-align: top; }
  .meta-table td:first-child { font-weight: bold; width: 35%; color: #333; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 3px; font-size: 9pt; font-weight: bold; }
  .badge-ordinary { background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; }
  .badge-special  { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
  .section { margin-bottom: 14px; }
  .section-label { font-size: 9.5pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 5px; }
  .preamble { font-size: 10.5pt; text-align: justify; line-height: 1.75; color: #222; }
  .resolution-box { border-left: 4px solid #1a3a6b; background: #f0f4ff; padding: 12px 14px; margin: 14px 0; border-radius: 0 6px 6px 0; }
  .resolution-box p { font-size: 10.5pt; line-height: 1.75; white-space: pre-line; text-align: justify; }
  .voting-row { display: flex; gap: 24px; margin: 14px 0; font-size: 10pt; }
  .vote-box { text-align: center; padding: 8px 20px; border-radius: 6px; border: 1px solid; }
  .vote-for  { background: #f0fdf4; border-color: #86efac; color: #166534; }
  .vote-ag   { background: #fef2f2; border-color: #fca5a5; color: #991b1b; }
  .vote-abs  { background: #f8fafc; border-color: #cbd5e1; color: #475569; }
  .vote-label { font-size: 8pt; color: #888; margin-bottom: 2px; }
  .vote-val   { font-weight: bold; font-size: 11pt; }
  .sign-section { margin-top: 30px; }
  .sign-row { display: flex; justify-content: space-between; gap: 20px; margin-top: 20px; }
  .sign-box { flex: 1; border-top: 1px solid #333; padding-top: 8px; text-align: center; font-size: 9.5pt; }
  .footer { margin-top: 30px; border-top: 1px solid #ccc; padding-top: 8px; font-size: 8.5pt; color: #888; text-align: center; }
  .roc-banner { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 8px 12px; font-size: 9.5pt; color: #92400e; margin-bottom: 14px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>

${onLetterhead ? `
<div class="letterhead">
  <div class="co-name">${company.companyName}</div>
  <div class="co-sub">CIN: ${company.cin || "—"}</div>
  <div class="co-sub">${company.regAddress || ""}</div>
</div>` : ""}

<div class="title-box">
  <h2>Board Resolution</h2>
  <div style="margin-top:6px;font-size:10pt;color:#555;">${template.title}</div>
  <div style="margin-top:4px;">
    <span class="badge badge-${template.kind}">${template.kind === "ordinary" ? "Ordinary Board Resolution" : "Special Resolution"}</span>
  </div>
</div>

<table class="meta-table">
  <tr><td>Company</td><td>${company.companyName}</td></tr>
  <tr><td>CIN</td><td>${company.cin || "—"}</td></tr>
  <tr><td>Meeting No.</td><td>${meetingSerial || "—"}</td></tr>
  <tr><td>Date of Meeting</td><td>${fmtMeetingDate || "—"}</td></tr>
  <tr><td>Resolution No.</td><td>${resolutionNo || "—"}</td></tr>
  <tr><td>Legal Basis</td><td>${template.section}</td></tr>
  ${template.rocFiling ? `<tr><td>ROC Filing</td><td style="color:#b45309;font-weight:bold;">⚠️ ${template.rocFiling}</td></tr>` : `<tr><td>ROC Filing</td><td style="color:#166534;">✅ Not Required</td></tr>`}
  ${chairmanName ? `<tr><td>Chairman</td><td>${chairmanName}</td></tr>` : ""}
</table>

${template.rocFiling ? `<div class="roc-banner">⚠️ <strong>ROC Filing Required:</strong> ${template.rocFiling}</div>` : ""}

<div class="section">
  <div class="section-label">Preamble / Discussion</div>
  <p class="preamble">${preamble}</p>
</div>

<div class="section">
  <div class="section-label">Resolution</div>
  <div class="resolution-box">
    <p>${resolution}</p>
  </div>
</div>

<div class="voting-row">
  <div class="vote-box vote-for">
    <div class="vote-label">VOTED FOR</div>
    <div class="vote-val">${directors.length}</div>
  </div>
  <div class="vote-box vote-ag">
    <div class="vote-label">AGAINST</div>
    <div class="vote-val">0</div>
  </div>
  <div class="vote-box vote-abs">
    <div class="vote-label">ABSTAINED</div>
    <div class="vote-val">0</div>
  </div>
  <div class="vote-box" style="background:#f0fdf4;border-color:#86efac;color:#166534;">
    <div class="vote-label">STATUS</div>
    <div class="vote-val">✅ PASSED</div>
  </div>
</div>

<div class="sign-section">
  <p style="font-size:10pt;font-weight:bold;margin-bottom:6px;">Signed by Directors Present:</p>
  <div class="sign-row">
    ${directors.slice(0, 3).map(d => `<div class="sign-box"><br><br>${d}</div>`).join("")}
    ${directors.length === 0 ? `<div class="sign-box"><br><br>Director 1</div><div class="sign-box"><br><br>Director 2</div>` : ""}
  </div>
  ${directors.length > 3 ? `<div class="sign-row">${directors.slice(3).map(d => `<div class="sign-box"><br><br>${d}</div>`).join("")}</div>` : ""}
</div>

<div class="footer">
  This is a true and correct extract of the Resolution passed at the Meeting of the Board of Directors of
  <strong>${company.companyName}</strong> held on ${fmtMeetingDate || "_______________"}.<br>
  Generated via ComplianceSearch.in — For reference purposes only.
</div>

</body></html>`;
}

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════ */
export default function BoardResolutionPage() {
  const { data: session } = useSession();

  // ── Company ──────────────────────────────────────────────────
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [companyQuery, setCompanyQuery] = useState("");

  // ── Template selection ────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // ── Meeting details ───────────────────────────────────────────
  const [meetingDate,   setMeetingDate]   = useState(new Date().toISOString().slice(0, 10));
  const [meetingSerial, setMeetingSerial] = useState("");
  const [resolutionNo,  setResolutionNo]  = useState("");
  const [chairmanName,  setChairmanName]  = useState("");
  const [onLetterhead,  setOnLetterhead]  = useState(true);

  // ── Directors present ─────────────────────────────────────────
  const [directors, setDirectors] = useState<Array<{ name: string; present: boolean }>>([]);

  // ── Dynamic fields ────────────────────────────────────────────
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  // ── Existing meeting check ────────────────────────────────────
  const [existingMeetings, setExistingMeetings] = useState<Array<{ id: string; title: string; meetingDate: string }>>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState("");
  const [dupMeeting, setDupMeeting] = useState<{ id: string; title: string } | null>(null);

  // ── Save / UI state ───────────────────────────────────────────
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(false);
  const [error,  setError]    = useState("");

  /* ── Derived ── */
  const template = useMemo(() =>
    ALL_BR_TEMPLATES.find(t => t.id === selectedTemplateId) ?? null,
  [selectedTemplateId]);

  const templatesInCategory = useMemo(() =>
    ALL_BR_TEMPLATES.filter(t => t.category === selectedCategory),
  [selectedCategory]);

  const presentDirectors = directors.filter(d => d.present).map(d => d.name);

  /* ── Resolution text live preview ── */
  const previewResolution = useMemo(() => {
    if (!template) return "";
    return fillBRTemplate(template.resolution, fieldValues);
  }, [template, fieldValues]);

  /* ── Apply company ── */
  function applyCompany(data: CompanyData) {
    setCompany(data);
    setCompanyQuery(data.companyName);
    const dirs = data.directors
      .filter(d => d.isActive)
      .map(d => ({ name: d.name, present: true }));
    setDirectors(dirs);
    if (dirs.length > 0) setChairmanName(dirs[0].name);
    // Load existing meetings for this company
    if (data.cin) loadMeetings(data.cin);
  }

  async function loadMeetings(cin: string) {
    try {
      const r = await fetch(`/api/companies/search?q=${encodeURIComponent(cin)}&limit=1`);
      const d = await r.json() as { companies?: Array<{ id: string }> };
      const companyId = d.companies?.[0]?.id;
      if (!companyId) return;
      const r2 = await fetch(`/api/board-resolutions?companyId=${companyId}`);
      const d2 = await r2.json() as { allMeetings: typeof existingMeetings };
      setExistingMeetings(d2.allMeetings || []);
    } catch {}
  }

  /* ── Dup meeting check on date change ── */
  useEffect(() => {
    if (!meetingDate) return;
    const found = existingMeetings.find(m => m.meetingDate === meetingDate) ?? null;
    setDupMeeting(found);
    if (found) { setSelectedMeetingId(found.id); }
    else        { setSelectedMeetingId(""); }
  }, [meetingDate, existingMeetings]);

  /* ── Reset fields on template change ── */
  useEffect(() => {
    if (!template) return;
    const defaults: Record<string, string> = {};
    template.fields.forEach(f => {
      defaults[f.key] = "";
    });
    // Pre-fill from company data
    if (company) {
      if (defaults.cin !== undefined)        defaults.cin = company.cin || "";
      if (defaults.regAddress !== undefined) defaults.regAddress = company.regAddress || "";
    }
    setFieldValues(defaults);
    setResolutionNo(`BR-${new Date().getFullYear()}-${String(Math.floor(Math.random()*900)+100)}`);
  }, [template, company]);

  /* ── Print ── */
  function handlePrint() {
    if (!template || !company) { setError("Company aur resolution select karein pehle"); return; }
    const html = generateBRHtml(
      { companyName: company.companyName, cin: company.cin || "", regAddress: company.regAddress || "" },
      template, fieldValues, meetingDate, meetingSerial, resolutionNo,
      presentDirectors, chairmanName, onLetterhead,
    );
    const w = window.open("", "_blank", "width=950,height=750");
    if (!w) { alert("Pop-up blocked!"); return; }
    w.document.write(html); w.document.close();
    setTimeout(() => w.print(), 800);
  }

  /* ── Save ── */
  async function handleSave() {
    if (!session) { setError("Login karein pehle"); return; }
    if (!template || !company) { setError("Company aur resolution select karein"); return; }
    setSaving(true); setError("");
    try {
      const resolutionText = fillBRTemplate(template.resolution, fieldValues);
      const preambleText   = fillBRTemplate(template.preamble,    fieldValues);

      // 1. Save document
      const docRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "board_resolution",
          title: `${template.title} — ${company.companyName} — ${meetingDate}`,
          companyName: company.companyName,
          meetingDate,
          formDataJson: JSON.stringify({
            templateId: template.id, category: template.category,
            companyName: company.companyName, cin: company.cin,
            meetingDate, meetingSerial, resolutionNo, chairmanName,
            directors: presentDirectors,
            fieldValues, resolutionText, preambleText,
            section: template.section, rocFiling: template.rocFiling,
            kind: template.kind,
          }),
        }),
      });

      if (!docRes.ok) { setError("Save failed"); return; }
      const docData = await docRes.json() as { id: string };

      // 2. Auto-link to board meeting minutes (if meeting selected / exists)
      if (company.cin) {
        const r = await fetch(`/api/companies/search?q=${encodeURIComponent(company.cin)}&limit=1`);
        const d = await r.json() as { companies?: Array<{ id: string }> };
        const companyId = d.companies?.[0]?.id;
        if (companyId) {
          await fetch("/api/board-resolutions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              companyId, companyName: company.companyName,
              cin: company.cin, regAddress: company.regAddress,
              meetingDocId: selectedMeetingId || undefined,
              meetingDate, meetingSerial, venue: company.regAddress,
              chairmanName,
              directors: presentDirectors.map(n => ({ name: n, din: "", designation: "Director", present: true })),
              resolutionText,
              transferId: docData.id,
            }),
          }).catch(() => {});
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-5xl mx-auto px-4 py-8">

          {/* ── Page Header ── */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl">📝</div>
              <div>
                <h1 className="text-2xl font-black text-slate-800">Board Resolution Builder</h1>
                <p className="text-sm text-slate-500">Companies Act, 2013 — Instant resolution drafting for private companies</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ══ LEFT PANEL — Company + Template Selection ══ */}
            <div className="lg:col-span-1 space-y-4">

              {/* Company Select */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <h2 className="font-bold text-slate-700 text-sm mb-3">🏢 Company</h2>
                <CompanyExcelUpload onFill={applyCompany} />
                <div className="my-2 text-center text-xs text-slate-400">— ya —</div>
                <CompanySearch
                  value={companyQuery}
                  onChange={setCompanyQuery}
                  onSelect={applyCompany}
                  placeholder="Search by name / CIN…"
                />
                {company && (
                  <div className="mt-3 bg-blue-50 rounded-xl p-2.5 text-xs text-blue-700">
                    <div className="font-bold">{company.companyName}</div>
                    <div className="text-blue-500 font-mono">{company.cin}</div>
                  </div>
                )}
              </div>

              {/* Category */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <h2 className="font-bold text-slate-700 text-sm mb-3">📁 Category</h2>
                <div className="space-y-1.5">
                  {BR_CATEGORY_ORDER.map(cat => (
                    <button key={cat} onClick={() => { setSelectedCategory(cat); setSelectedTemplateId(""); }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
                        selectedCategory === cat
                          ? "bg-blue-600 text-white"
                          : "text-slate-600 hover:bg-slate-50 border border-slate-100"
                      }`}>
                      <span>{BR_CATEGORY_META[cat].icon}</span>
                      <span>{BR_CATEGORY_META[cat].label}</span>
                      <span className={`ml-auto text-xs rounded-full px-1.5 py-0.5 ${selectedCategory === cat ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                        {ALL_BR_TEMPLATES.filter(t => t.category === cat).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolutions in category */}
              {selectedCategory && (
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <h2 className="font-bold text-slate-700 text-sm mb-3">📋 Resolutions</h2>
                  <div className="space-y-1.5">
                    {templatesInCategory.map(t => (
                      <button key={t.id} onClick={() => setSelectedTemplateId(t.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-start gap-2 ${
                          selectedTemplateId === t.id
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "text-slate-600 hover:bg-slate-50 border border-slate-100"
                        }`}>
                        <span className="mt-0.5">{t.icon}</span>
                        <span className="flex-1 leading-snug">{t.title}</span>
                        <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full font-bold ${
                          t.kind === "ordinary" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                        }`}>{t.kind === "ordinary" ? "OBR" : "SR"}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ══ RIGHT PANEL — Form + Preview ══ */}
            <div className="lg:col-span-2 space-y-4">

              {!template && (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                  <div className="text-5xl mb-3">📝</div>
                  <p className="font-bold text-slate-600 text-lg">Resolution select karein</p>
                  <p className="text-sm text-slate-400 mt-1">Left panel mein category → resolution choose karein</p>
                </div>
              )}

              {template && (
                <>
                  {/* Template header */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{template.icon}</span>
                          <h2 className="font-black text-slate-800 text-base">{template.title}</h2>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className={`px-2 py-0.5 rounded-full font-bold ${template.kind === "ordinary" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                            {template.kind === "ordinary" ? "Ordinary Board Resolution" : "Special Resolution"}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{template.section}</span>
                        </div>
                        {template.rocFiling && (
                          <div className="mt-2 text-xs text-amber-700 font-semibold bg-amber-50 rounded-lg px-2 py-1 inline-block">
                            ⚠️ ROC Filing: {template.rocFiling}
                          </div>
                        )}
                        {!template.rocFiling && (
                          <div className="mt-2 text-xs text-emerald-700 font-semibold bg-emerald-50 rounded-lg px-2 py-1 inline-block">
                            ✅ No ROC Filing Required
                          </div>
                        )}
                      </div>
                    </div>
                    {template.notes && (
                      <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-xs text-blue-700">
                        📌 {template.notes}
                      </div>
                    )}
                  </div>

                  {/* Meeting Details */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                    <h3 className="font-bold text-slate-700 text-sm mb-3">📅 Meeting Details</h3>

                    {/* Dup meeting warning */}
                    {dupMeeting && (
                      <div className="mb-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs">
                        <div className="font-bold text-amber-700">⚠️ Is date pe already ek meeting hai!</div>
                        <div className="text-amber-600 mt-0.5">{dupMeeting.title}</div>
                        <div className="text-slate-500 mt-1">Yeh resolution us meeting ke minutes mein auto-add ho jaayega.</div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Meeting Date *</label>
                        <input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} className={INP} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Meeting Serial No.</label>
                        <input value={meetingSerial} onChange={e => setMeetingSerial(e.target.value)}
                          placeholder="e.g. 6/2025-26" className={INP} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Resolution No.</label>
                        <input value={resolutionNo} onChange={e => setResolutionNo(e.target.value)}
                          placeholder="e.g. BR-2025-001" className={INP} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Chairman</label>
                        {directors.length > 0 ? (
                          <select value={chairmanName} onChange={e => setChairmanName(e.target.value)} className={SEL}>
                            <option value="">— Select —</option>
                            {directors.map((d, i) => <option key={i} value={d.name}>{d.name}</option>)}
                          </select>
                        ) : (
                          <input value={chairmanName} onChange={e => setChairmanName(e.target.value)}
                            placeholder="Director name" className={INP} />
                        )}
                      </div>
                    </div>

                    {/* Link to existing meeting dropdown */}
                    {existingMeetings.length > 0 && (
                      <div className="mt-3">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Link to Board Meeting Minutes</label>
                        <select value={selectedMeetingId} onChange={e => setSelectedMeetingId(e.target.value)} className={SEL}>
                          <option value="">— Auto-detect by date / New —</option>
                          {existingMeetings.map(m => (
                            <option key={m.id} value={m.id}>{m.title} ({m.meetingDate})</option>
                          ))}
                        </select>
                        <p className="text-xs text-slate-400 mt-1">Save karne pe yeh resolution us meeting ke minutes mein add ho jaayega.</p>
                      </div>
                    )}
                  </div>

                  {/* Directors Present */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                    <h3 className="font-bold text-slate-700 text-sm mb-3">👥 Directors Present</h3>
                    {directors.length === 0 ? (
                      <p className="text-xs text-slate-400">Company select karo ya directors manually add karein.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {directors.map((d, i) => (
                          <label key={i} className="flex items-center gap-2.5 cursor-pointer">
                            <input type="checkbox" checked={d.present}
                              onChange={e => {
                                const next = [...directors];
                                next[i] = { ...next[i], present: e.target.checked };
                                setDirectors(next);
                              }}
                              className="w-4 h-4 accent-blue-600" />
                            <span className="text-sm text-slate-700">{d.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    <button onClick={() => setDirectors(d => [...d, { name: "", present: true }])}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-semibold">
                      + Add Director
                    </button>
                  </div>

                  {/* Dynamic Fields */}
                  {template.fields.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                      <h3 className="font-bold text-slate-700 text-sm mb-3">✏️ Resolution Details</h3>
                      <div className="space-y-3">
                        {template.fields.map(field => (
                          <div key={field.key}>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            {field.type === "textarea" ? (
                              <textarea value={fieldValues[field.key] || ""}
                                onChange={e => setFieldValues(v => ({ ...v, [field.key]: e.target.value }))}
                                placeholder={field.placeholder} rows={2}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
                            ) : field.type === "select" ? (
                              <select value={fieldValues[field.key] || ""}
                                onChange={e => setFieldValues(v => ({ ...v, [field.key]: e.target.value }))}
                                className={SEL}>
                                <option value="">— Select —</option>
                                {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            ) : (
                              <input type={field.type || "text"}
                                value={fieldValues[field.key] || ""}
                                onChange={e => setFieldValues(v => ({ ...v, [field.key]: e.target.value }))}
                                placeholder={field.placeholder} className={INP} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resolution Preview */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                    <h3 className="font-bold text-slate-700 text-sm mb-3">👁️ Resolution Preview</h3>
                    <div className="bg-blue-50 border-l-4 border-blue-600 rounded-r-xl p-4 text-xs text-slate-700 leading-relaxed whitespace-pre-line font-serif">
                      {previewResolution}
                    </div>
                  </div>

                  {/* Options + Actions */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <input type="checkbox" id="letterhead" checked={onLetterhead}
                        onChange={e => setOnLetterhead(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                      <label htmlFor="letterhead" className="text-sm font-semibold text-slate-600 cursor-pointer">
                        Print on company letterhead
                      </label>
                    </div>

                    {error && (
                      <div className="mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600 font-semibold">
                        ⚠️ {error}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button onClick={handlePrint}
                        className="flex-1 py-3 rounded-xl font-bold text-sm border-2 border-blue-600 text-blue-700 hover:bg-blue-50 flex items-center justify-center gap-2">
                        🖨️ Print / Preview
                      </button>
                      {session && (
                        <button onClick={handleSave} disabled={saving}
                          className="flex-1 py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                          style={{ background: "linear-gradient(135deg,#1e40af,#2563eb)" }}>
                          {saving ? "⏳ Saving…" : saved ? "✅ Saved!" : "💾 Save & Link to Minutes"}
                        </button>
                      )}
                    </div>
                    {session && (
                      <p className="text-xs text-slate-400 mt-2 text-center">
                        Save karne pe yeh resolution board meeting minutes mein auto-link ho jaayega.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
