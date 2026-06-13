"use client";
import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import CompanySearch from "@/components/CompanySearch";
import CompanyExcelUpload from "@/components/CompanyExcelUpload";
import type { CompanyData } from "@/lib/types/company";
import {
  RESOLUTION_LIBRARY, RL_CATEGORY_ORDER, RL_CATEGORY_META,
  fillResolutionTemplate, type UnifiedResolution,
} from "@/lib/resolution-library";

/* ── Helpers ──────────────────────────────────────────────────── */
const INP = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white";
const SEL = INP + " cursor-pointer";

function fmtDate(d: string) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

/* ── Step indicator ───────────────────────────────────────────── */
function StepBar({ step }: { step: number }) {
  const steps = ["Category", "Resolution", "Company", "Details & Print"];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const n = i + 1;
        const done    = step > n;
        const current = step === n;
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all ${
                done    ? "bg-indigo-600 text-white" :
                current ? "bg-indigo-600 text-white ring-4 ring-indigo-100" :
                          "bg-slate-100 text-slate-400"
              }`}>
                {done ? "✓" : n}
              </div>
              <span className={`text-xs font-semibold whitespace-nowrap ${current ? "text-indigo-700" : done ? "text-indigo-500" : "text-slate-400"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mb-5 mx-1 transition-all ${step > n ? "bg-indigo-500" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Print HTML ───────────────────────────────────────────────── */
function generateBRHtml(
  company: { companyName: string; cin: string; regAddress: string },
  template: UnifiedResolution,
  fields: Record<string, string>,
  meetingDate: string,
  meetingSerial: string,
  resolutionNo: string,
  directors: string[],
  chairmanName: string,
  onLetterhead: boolean,
): string {
  const preamble   = fillResolutionTemplate(template.preamble,   fields);
  const resolution = fillResolutionTemplate(template.resolution, fields);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>Board Resolution — ${template.title}</title>
<style>
  @page{size:A4;margin:20mm}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Times New Roman",serif;font-size:11pt;color:#1a1a1a;line-height:1.7}
  .lh{text-align:center;border-bottom:2.5px double #1a3a6b;padding-bottom:12px;margin-bottom:18px}
  .co-name{font-size:15pt;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#1a3a6b}
  .co-sub{font-size:9pt;color:#555;margin-top:3px}
  .title-box{text-align:center;margin:18px 0 14px}
  .title-box h2{font-size:12pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #333;display:inline-block;padding-bottom:3px}
  .meta-table{width:100%;border-collapse:collapse;margin-bottom:14px;font-size:10pt}
  .meta-table td{padding:3px 8px;vertical-align:top}
  .meta-table td:first-child{font-weight:bold;width:35%;color:#333}
  .badge{display:inline-block;padding:2px 10px;border-radius:3px;font-size:9pt;font-weight:bold}
  .bo{background:#dbeafe;color:#1e40af;border:1px solid #93c5fd}
  .bs{background:#fef3c7;color:#92400e;border:1px solid #fcd34d}
  .sec-label{font-size:9pt;font-weight:bold;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;margin-bottom:5px}
  .preamble{font-size:10.5pt;text-align:justify;line-height:1.75;color:#222}
  .res-box{border-left:4px solid #1a3a6b;background:#f0f4ff;padding:12px 14px;margin:14px 0;border-radius:0 6px 6px 0}
  .res-box p{font-size:10.5pt;line-height:1.75;white-space:pre-line;text-align:justify}
  .vote-row{display:flex;gap:20px;margin:14px 0}
  .vb{text-align:center;padding:8px 18px;border-radius:6px;border:1px solid}
  .vf{background:#f0fdf4;border-color:#86efac;color:#166534}
  .va{background:#fef2f2;border-color:#fca5a5;color:#991b1b}
  .vn{background:#f8fafc;border-color:#cbd5e1;color:#475569}
  .vp{background:#eff6ff;border-color:#93c5fd;color:#1e40af}
  .vl{font-size:8pt;color:#888;margin-bottom:2px}
  .vv{font-weight:bold;font-size:11pt}
  .sign-row{display:flex;justify-content:space-between;gap:20px;margin-top:24px}
  .sign-box{flex:1;border-top:1px solid #333;padding-top:8px;text-align:center;font-size:9.5pt}
  .footer{margin-top:28px;border-top:1px solid #ccc;padding-top:8px;font-size:8.5pt;color:#888;text-align:center}
  .roc-box{background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;padding:8px 12px;font-size:9.5pt;color:#92400e;margin-bottom:12px}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
${onLetterhead ? `<div class="lh"><div class="co-name">${company.companyName}</div><div class="co-sub">CIN: ${company.cin||"—"}</div><div class="co-sub">${company.regAddress||""}</div></div>` : ""}
<div class="title-box">
  <h2>Board Resolution</h2>
  <div style="margin-top:6px;font-size:10pt;color:#555">${template.title}</div>
  <div style="margin-top:4px"><span class="badge ${template.kind==="ordinary"?"bo":"bs"}">${template.kind==="ordinary"?"Ordinary Board Resolution":"Special Resolution"}</span></div>
</div>
<table class="meta-table">
  <tr><td>Company</td><td>${company.companyName}</td></tr>
  <tr><td>CIN</td><td>${company.cin||"—"}</td></tr>
  <tr><td>Meeting No.</td><td>${meetingSerial||"—"}</td></tr>
  <tr><td>Date of Meeting</td><td>${fmtDate(meetingDate)||"—"}</td></tr>
  <tr><td>Resolution No.</td><td>${resolutionNo||"—"}</td></tr>
  <tr><td>Legal Basis</td><td>${template.section}</td></tr>
  <tr><td>ROC Filing</td><td style="${template.rocFiling?"color:#b45309;font-weight:bold":"color:#166534"}">${template.rocFiling?"⚠️ "+template.rocFiling:"✅ Not Required"}</td></tr>
  ${chairmanName?`<tr><td>Chairman</td><td>${chairmanName}</td></tr>`:""}
</table>
${template.rocFiling?`<div class="roc-box">⚠️ <strong>ROC Filing Required:</strong> ${template.rocFiling}</div>`:""}
<div style="margin-bottom:12px"><div class="sec-label">Preamble / Discussion</div><p class="preamble">${preamble}</p></div>
<div style="margin-bottom:12px"><div class="sec-label">Resolution</div><div class="res-box"><p>${resolution}</p></div></div>
<div class="vote-row">
  <div class="vb vf"><div class="vl">VOTED FOR</div><div class="vv">${directors.length}</div></div>
  <div class="vb va"><div class="vl">AGAINST</div><div class="vv">0</div></div>
  <div class="vb vn"><div class="vl">ABSTAINED</div><div class="vv">0</div></div>
  <div class="vb vp"><div class="vl">STATUS</div><div class="vv">✅ PASSED</div></div>
</div>
<p style="font-size:10pt;font-weight:bold;margin-top:16px;margin-bottom:4px">Signed by Directors Present:</p>
<div class="sign-row">${directors.slice(0,3).map(d=>`<div class="sign-box"><br><br>${d}</div>`).join("")}${directors.length===0?`<div class="sign-box"><br><br>Director 1</div><div class="sign-box"><br><br>Director 2</div>`:""}</div>
${directors.length>3?`<div class="sign-row">${directors.slice(3).map(d=>`<div class="sign-box"><br><br>${d}</div>`).join("")}</div>`:""}
<div class="footer">True and correct extract of Resolution passed at Board Meeting of <strong>${company.companyName}</strong> held on ${fmtDate(meetingDate)||"___"}.<br>Generated via ComplianceSearch.in</div>
</body></html>`;
}

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════ */
export default function BoardResolutionPage() {
  const { data: session } = useSession();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  /* Step 1 — Category */
  const [selectedCategory, setSelectedCategory] = useState("");

  /* Step 2 — Resolution */
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  /* Step 3 — Company */
  const [company, setCompany]           = useState<CompanyData | null>(null);
  const [companyQuery, setCompanyQuery] = useState("");
  const [directors, setDirectors]       = useState<Array<{ name: string; present: boolean }>>([]);
  const [existingMeetings, setExistingMeetings] = useState<Array<{ id: string; title: string; meetingDate: string }>>([]);

  /* Step 4 — Details */
  const [meetingDate,    setMeetingDate]    = useState(new Date().toISOString().slice(0, 10));
  const [meetingSerial,  setMeetingSerial]  = useState("");
  const [resolutionNo,   setResolutionNo]   = useState("");
  const [chairmanName,   setChairmanName]   = useState("");
  const [onLetterhead,   setOnLetterhead]   = useState(true);
  const [fieldValues,    setFieldValues]    = useState<Record<string, string>>({});
  const [selectedMeetingId, setSelectedMeetingId] = useState("");
  const [dupMeeting,     setDupMeeting]     = useState<{ id: string; title: string } | null>(null);

  /* Save state */
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState("");

  /* Derived */
  const template = useMemo(() =>
    RESOLUTION_LIBRARY.find(t => t.id === selectedTemplateId) ?? null,
  [selectedTemplateId]);

  const templatesInCategory = useMemo(() =>
    RESOLUTION_LIBRARY.filter(t => t.category === selectedCategory),
  [selectedCategory]);

  // Step 1: only show board-relevant categories
  const boardCategories = RL_CATEGORY_ORDER.filter(cat => {
    const meta = RL_CATEGORY_META[cat];
    return meta.meetingType === "board" || meta.meetingType === "board_agm";
  });

  const presentDirectors = directors.filter(d => d.present).map(d => d.name);

  const previewResolution = useMemo(() => {
    if (!template) return "";
    return fillResolutionTemplate(template.resolution, fieldValues);
  }, [template, fieldValues]);

  /* ── Apply company ── */
  function applyCompany(data: CompanyData) {
    setCompany(data);
    setCompanyQuery(data.companyName);
    const dirs = data.directors.filter(d => d.isActive).map(d => ({ name: d.name, present: true }));
    setDirectors(dirs);
    if (dirs.length > 0) setChairmanName(dirs[0].name);
    loadMeetings(data.cin);
  }

  async function loadMeetings(cin: string) {
    try {
      // First try by companyId (internal DB id)
      const r  = await fetch(`/api/companies/search?q=${encodeURIComponent(cin)}&limit=1`);
      const d  = await r.json() as { companies?: Array<{ id: string }> };
      const id = d.companies?.[0]?.id;

      // Pass both companyId (if found) AND cin — API will merge results
      const params = new URLSearchParams({ cin });
      if (id) params.set("companyId", id);
      const r2 = await fetch(`/api/board-resolutions?${params.toString()}`);
      const d2 = await r2.json() as { allMeetings: typeof existingMeetings };
      setExistingMeetings(d2.allMeetings || []);
    } catch {}
  }

  /* ── Dup check on date change ── */
  useEffect(() => {
    const found = existingMeetings.find(m => m.meetingDate === meetingDate) ?? null;
    setDupMeeting(found);
    setSelectedMeetingId(found?.id ?? "");
  }, [meetingDate, existingMeetings]);

  /* ── Reset fields when template changes ── */
  useEffect(() => {
    if (!template) return;
    const defaults: Record<string, string> = {};
    template.fields.forEach(f => { defaults[f.key] = ""; });
    if (company) {
      if (defaults.cin !== undefined)        defaults.cin = company.cin || "";
      if (defaults.regAddress !== undefined) defaults.regAddress = company.regAddress || "";
    }
    setFieldValues(defaults);
    setResolutionNo(`BR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`);
  }, [template, company]);

  /* ── Print ── */
  function handlePrint() {
    if (!template || !company) return;
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
    if (!session || !template || !company) return;
    setSaving(true); setError("");
    try {
      const resolutionText = fillResolutionTemplate(template.resolution, fieldValues);
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
            directors: presentDirectors, fieldValues, resolutionText,
            section: template.section, rocFiling: template.rocFiling, kind: template.kind,
          }),
        }),
      });
      if (!docRes.ok) { setError("Save failed"); return; }
      const docData = await docRes.json() as { id: string };
      // Link to meeting
      if (company.cin) {
        const r = await fetch(`/api/companies/search?q=${encodeURIComponent(company.cin)}&limit=1`);
        const d = await r.json() as { companies?: Array<{ id: string }> };
        const cId = d.companies?.[0]?.id;
        if (cId) await fetch("/api/board-resolutions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId: cId, companyName: company.companyName, cin: company.cin,
            meetingDocId: selectedMeetingId || undefined,
            meetingDate, meetingSerial, chairmanName,
            directors: presentDirectors.map(n => ({ name: n, din: "", designation: "Director", present: true })),
            resolutionText, transferId: docData.id,
          }),
        }).catch(() => {});
      }
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 py-8">

          {/* Header */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white text-2xl mb-3">📝</div>
            <h1 className="text-2xl font-black text-slate-800">Board Resolution Builder</h1>
            <p className="text-sm text-slate-500 mt-1">Companies Act, 2013 — Private Company Resolutions</p>
          </div>

          <StepBar step={step} />

          {/* ════════ STEP 1 — CATEGORY ════════ */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-black text-slate-700 mb-1">Kaunsi category ka resolution chahiye?</h2>
              <p className="text-sm text-slate-400 mb-5">Category choose karein — resolution list dikhegi</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {boardCategories.map(cat => {
                  const meta  = RL_CATEGORY_META[cat];
                  const count = RESOLUTION_LIBRARY.filter(t => t.category === cat).length;
                  return (
                    <button key={cat}
                      onClick={() => { setSelectedCategory(cat); setStep(2); }}
                      className="group bg-white rounded-2xl border-2 border-slate-200 hover:border-indigo-400 p-5 text-left transition-all hover:shadow-md hover:-translate-y-0.5">
                      <div className="text-3xl mb-2">{meta.icon}</div>
                      <div className="font-bold text-slate-700 text-sm leading-tight group-hover:text-indigo-700">{meta.label}</div>
                      <div className="text-xs text-slate-400 mt-1">{count} resolutions</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════════ STEP 2 — RESOLUTION ════════ */}
          {step === 2 && (
            <div>
              <button onClick={() => setStep(1)} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold mb-4 flex items-center gap-1">
                ← Back
              </button>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{RL_CATEGORY_META[selectedCategory]?.icon}</span>
                <h2 className="text-lg font-black text-slate-700">{RL_CATEGORY_META[selectedCategory]?.label}</h2>
              </div>
              <p className="text-sm text-slate-400 mb-5">Konsa resolution banana hai?</p>
              <div className="space-y-3">
                {templatesInCategory.map(t => (
                  <button key={t.id}
                    onClick={() => { setSelectedTemplateId(t.id); setStep(3); }}
                    className="w-full bg-white rounded-2xl border-2 border-slate-200 hover:border-indigo-400 p-4 text-left transition-all hover:shadow-md flex items-start gap-3 group">
                    <span className="text-2xl mt-0.5">{t.icon}</span>
                    <div className="flex-1">
                      <div className="font-bold text-slate-700 group-hover:text-indigo-700 text-sm">{t.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{t.section}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${t.kind === "ordinary" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                          {t.kind === "ordinary" ? "Ordinary Board Resolution" : "Special Resolution"}
                        </span>
                        {t.rocFiling && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                            ⚠️ {t.rocFiling}
                          </span>
                        )}
                        {!t.rocFiling && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                            ✅ No ROC filing
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-slate-300 group-hover:text-indigo-400 text-xl mt-1">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ════════ STEP 3 — COMPANY ════════ */}
          {step === 3 && (
            <div>
              <button onClick={() => setStep(2)} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold mb-4 flex items-center gap-1">
                ← Back
              </button>
              {/* Selected resolution summary */}
              {template && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
                  <span className="text-2xl">{template.icon}</span>
                  <div>
                    <div className="font-bold text-indigo-800 text-sm">{template.title}</div>
                    <div className="text-xs text-indigo-500">{template.section}</div>
                  </div>
                </div>
              )}
              <h2 className="text-lg font-black text-slate-700 mb-1">Company select karein</h2>
              <p className="text-sm text-slate-400 mb-5">Excel upload karo ya naam/CIN se search karo</p>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <CompanyExcelUpload onFill={applyCompany} />
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 font-semibold">YA</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <CompanySearch
                  value={companyQuery}
                  onChange={setCompanyQuery}
                  onSelect={applyCompany}
                  placeholder="Company naam ya CIN se search karein…"
                />
              </div>

              {company && (
                <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-emerald-800">{company.companyName}</div>
                    <div className="text-xs text-emerald-600 font-mono mt-0.5">{company.cin}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{directors.length} directors loaded</div>
                  </div>
                  <button onClick={() => setStep(4)}
                    className="px-5 py-2.5 rounded-xl font-bold text-white text-sm flex items-center gap-2 flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#4338ca,#6366f1)" }}>
                    Aage Badhein →
                  </button>
                </div>
              )}

              {!company && (
                <button onClick={() => setStep(4)}
                  className="mt-4 w-full py-3 rounded-xl text-sm font-semibold text-slate-500 border-2 border-dashed border-slate-300 hover:border-indigo-300 hover:text-indigo-600">
                  Company ke bina continue karein (manually fill karenge)
                </button>
              )}
            </div>
          )}

          {/* ════════ STEP 4 — DETAILS + PRINT ════════ */}
          {step === 4 && template && (
            <div className="space-y-4">
              <button onClick={() => setStep(3)} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold mb-1 flex items-center gap-1">
                ← Back
              </button>

              {/* Resolution + Company summary bar */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center gap-3">
                <span className="text-2xl">{template.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 text-sm truncate">{template.title}</div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${template.kind === "ordinary" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                      {template.kind === "ordinary" ? "OBR" : "SR"}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{template.section}</span>
                    {template.rocFiling && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">⚠️ {template.rocFiling}</span>
                    )}
                  </div>
                </div>
                {company && (
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-bold text-indigo-700">{company.companyName}</div>
                    <div className="text-xs text-slate-400 font-mono">{company.cin}</div>
                  </div>
                )}
              </div>

              {template.notes && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-xs text-blue-700 font-semibold">
                  📌 {template.notes}
                </div>
              )}

              {/* Meeting Details */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold text-slate-700 text-sm mb-4">📅 Meeting Details</h3>

                <div className="grid grid-cols-2 gap-3">
                  {/* Date field — full width with suggestion below */}
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Meeting Date *</label>
                    <input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} className={INP} />

                    {/* ── Date-based suggestions ── */}
                    {meetingDate && existingMeetings.length > 0 && (() => {
                      const sel = new Date(meetingDate).getTime();
                      // exact match
                      if (dupMeeting) return (
                        <div className="mt-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 flex items-start gap-2">
                          <span className="text-base mt-0.5">⚠️</span>
                          <div>
                            <div className="text-xs font-bold text-amber-700">Is date pe already ek meeting recorded hai!</div>
                            <div className="text-xs text-amber-800 font-semibold mt-0.5">{dupMeeting.title}</div>
                            <div className="text-xs text-slate-500 mt-1">Save karne pe yeh resolution <strong>us meeting mein auto-add</strong> hoga — alag meeting nahi banega.</div>
                            <button onClick={() => setSelectedMeetingId(dupMeeting.id)}
                              className="mt-1.5 text-xs font-bold text-amber-700 underline">
                              → Us meeting se link karein
                            </button>
                          </div>
                        </div>
                      );
                      // nearby meetings (±60 days)
                      const nearby = existingMeetings.filter(m => {
                        const diff = Math.abs(new Date(m.meetingDate).getTime() - sel) / 86400000;
                        return diff > 0 && diff <= 60;
                      }).slice(0, 3);
                      if (nearby.length > 0) return (
                        <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                          <div className="text-xs font-bold text-slate-500 mb-1.5">📋 Is company ke recent meetings (link kar sakte hain):</div>
                          <div className="space-y-1">
                            {nearby.map(m => (
                              <button key={m.id}
                                onClick={() => { setSelectedMeetingId(m.id); setMeetingDate(m.meetingDate); }}
                                className={`w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                                  selectedMeetingId === m.id
                                    ? "bg-indigo-100 border border-indigo-300 text-indigo-700 font-semibold"
                                    : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
                                }`}>
                                <span className="font-medium">{m.title}</span>
                                <span className="text-slate-400 font-mono ml-2">{m.meetingDate}</span>
                              </button>
                            ))}
                          </div>
                          <div className="text-xs text-slate-400 mt-1.5">Click karein us meeting se link karne ke liye, ya naya meeting date rakho.</div>
                        </div>
                      );
                      return null;
                    })()}

                    {/* No meetings at all for this company */}
                    {meetingDate && company && existingMeetings.length === 0 && (
                      <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                        ✅ Is company ka koi purana meeting record nahi mila — naya meeting create hoga.
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Meeting Serial No.</label>
                    <input value={meetingSerial} onChange={e => setMeetingSerial(e.target.value)} placeholder="e.g. 6/2025-26" className={INP} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Resolution No.</label>
                    <input value={resolutionNo} onChange={e => setResolutionNo(e.target.value)} placeholder="e.g. BR-2025-001" className={INP} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Chairman</label>
                    {directors.length > 0 ? (
                      <select value={chairmanName} onChange={e => setChairmanName(e.target.value)} className={SEL}>
                        <option value="">— Select —</option>
                        {directors.map((d, i) => <option key={i} value={d.name}>{d.name}</option>)}
                      </select>
                    ) : (
                      <input value={chairmanName} onChange={e => setChairmanName(e.target.value)} placeholder="Director name" className={INP} />
                    )}
                  </div>
                </div>

                {existingMeetings.length > 0 && (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">🔗 Board Meeting Minutes se Link</label>
                    <select value={selectedMeetingId} onChange={e => setSelectedMeetingId(e.target.value)} className={SEL}>
                      <option value="">— Naya meeting banao / Auto-detect —</option>
                      {existingMeetings.map(m => (
                        <option key={m.id} value={m.id}>{m.title} · {m.meetingDate}</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-400 mt-1">Agar yeh resolution kisi existing meeting ka hissa hai to wahan link karo</p>
                  </div>
                )}
              </div>

              {/* Directors Present */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold text-slate-700 text-sm mb-3">👥 Directors Present</h3>
                {directors.length === 0 ? (
                  <p className="text-xs text-slate-400 mb-2">Company select karein ya manually add karein</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {directors.map((d, i) => (
                      <label key={i} className="flex items-center gap-2 cursor-pointer bg-slate-50 rounded-xl px-3 py-2">
                        <input type="checkbox" checked={d.present}
                          onChange={e => { const n = [...directors]; n[i] = { ...n[i], present: e.target.checked }; setDirectors(n); }}
                          className="w-4 h-4 accent-indigo-600" />
                        <span className="text-sm text-slate-700 truncate">{d.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                <button onClick={() => setDirectors(d => [...d, { name: "", present: true }])}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold">+ Add Director</button>
              </div>

              {/* Resolution Fields */}
              {template.fields.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="font-bold text-slate-700 text-sm mb-4">✏️ Resolution Details</h3>
                  <div className="space-y-3">
                    {template.fields.map(field => (
                      <div key={field.key}>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.type === "textarea" ? (
                          <textarea value={fieldValues[field.key] || ""} rows={2}
                            onChange={e => setFieldValues(v => ({ ...v, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                        ) : field.type === "select" ? (
                          <select value={fieldValues[field.key] || ""}
                            onChange={e => setFieldValues(v => ({ ...v, [field.key]: e.target.value }))}
                            className={SEL}>
                            <option value="">— Select —</option>
                            {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input type={field.type || "text"} value={fieldValues[field.key] || ""}
                            onChange={e => setFieldValues(v => ({ ...v, [field.key]: e.target.value }))}
                            placeholder={field.placeholder} className={INP} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution Preview */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold text-slate-700 text-sm mb-3">👁️ Resolution Preview</h3>
                <div className="border-l-4 border-indigo-500 bg-indigo-50 rounded-r-2xl p-4 text-xs text-slate-700 leading-relaxed whitespace-pre-line font-serif">
                  {previewResolution || <span className="text-slate-400 italic">Details fill karne par yahan preview dikhegi…</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <label className="flex items-center gap-2 mb-4 cursor-pointer">
                  <input type="checkbox" checked={onLetterhead} onChange={e => setOnLetterhead(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                  <span className="text-sm font-semibold text-slate-600">Company letterhead par print karein</span>
                </label>

                {error && <div className="mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600 font-semibold">⚠️ {error}</div>}

                <div className="flex gap-3">
                  <button onClick={handlePrint}
                    className="flex-1 py-3 rounded-xl font-bold text-sm border-2 border-indigo-600 text-indigo-700 hover:bg-indigo-50 flex items-center justify-center gap-2">
                    🖨️ Print / Preview
                  </button>
                  {session && (
                    <button onClick={handleSave} disabled={saving}
                      className="flex-1 py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg,#4338ca,#6366f1)" }}>
                      {saving ? "⏳ Saving…" : saved ? "✅ Saved!" : "💾 Save & Link to Minutes"}
                    </button>
                  )}
                </div>
                {session && <p className="text-xs text-slate-400 mt-2 text-center">Save karne pe board meeting minutes mein auto-link hoga</p>}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
