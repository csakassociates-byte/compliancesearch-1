"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DOC_CATEGORIES } from "@/lib/document-categories";

interface Company {
  companyId: string;
  companyName: string;
  cin: string;
  entityType?: string;
}

interface CompanyFile {
  id: string;
  category: string;
  docType: string;
  customLabel: string | null;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  driveWebViewLink: string | null;
  driveDownloadLink: string | null;
  expiryDate: string | null;
  financialYear: string | null;
  notes: string | null;
  createdAt: string;
}

interface DriveStatus {
  connected: boolean;
  email: string | null;
  folderId: string | null;
}

interface Props {
  companies: Company[];
  defaultFY: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isExpiringSoon(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const exp = new Date(dateStr);
  const diff = exp.getTime() - Date.now();
  return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000;
}

function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

const CAT_COLORS: Record<string, { bg: string; border: string; icon: string; badge: string; iconBg: string }> = {
  INCORPORATION: { bg: "from-blue-50 to-indigo-50",    border: "border-blue-100",   icon: "text-blue-600",   badge: "bg-blue-100 text-blue-700",   iconBg: "bg-blue-100" },
  CERTIFICATES:  { bg: "from-emerald-50 to-teal-50",   border: "border-emerald-100",icon: "text-emerald-600",badge: "bg-emerald-100 text-emerald-700",iconBg: "bg-emerald-100" },
  ANNUAL_FILING: { bg: "from-violet-50 to-purple-50",  border: "border-violet-100", icon: "text-violet-600", badge: "bg-violet-100 text-violet-700", iconBg: "bg-violet-100" },
  DIRECTORS:     { bg: "from-amber-50 to-orange-50",   border: "border-amber-100",  icon: "text-amber-600",  badge: "bg-amber-100 text-amber-700",   iconBg: "bg-amber-100" },
  RESOLUTIONS:   { bg: "from-teal-50 to-cyan-50",      border: "border-teal-100",   icon: "text-teal-600",   badge: "bg-teal-100 text-teal-700",     iconBg: "bg-teal-100" },
  TAX:           { bg: "from-rose-50 to-red-50",       border: "border-rose-100",   icon: "text-rose-600",   badge: "bg-rose-100 text-rose-700",     iconBg: "bg-rose-100" },
};

export default function CompanyDocumentsTab({ companies, defaultFY }: Props) {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(
    companies.length > 0 ? companies[0] : null
  );
  const [files, setFiles] = useState<CompanyFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [driveStatus, setDriveStatus] = useState<DriveStatus | null>(null);
  const [driveLoading, setDriveLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFY, setSelectedFY] = useState(defaultFY);

  const [uploadModal, setUploadModal] = useState<{
    category: string; docType: string; docLabel: string; hasExpiry: boolean; hasFY: boolean;
  } | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadExpiry, setUploadExpiry] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadFY, setUploadFY] = useState(defaultFY);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const FY_OPTIONS = ["2026-27", "2025-26", "2024-25", "2023-24", "2022-23", "2021-22"];

  useEffect(() => {
    setDriveLoading(true);
    fetch("/api/drive/status")
      .then(r => r.json())
      .then(d => setDriveStatus(d))
      .catch(() => setDriveStatus({ connected: false, email: null, folderId: null }))
      .finally(() => setDriveLoading(false));
  }, []);

  const loadFiles = useCallback((company: Company) => {
    setFilesLoading(true);
    fetch(`/api/company-files?companyId=${company.companyId}`)
      .then(r => r.json())
      .then(d => setFiles(d.files || []))
      .catch(() => setFiles([]))
      .finally(() => setFilesLoading(false));
  }, []);

  useEffect(() => {
    if (selectedCompany) loadFiles(selectedCompany);
  }, [selectedCompany, loadFiles]);

  const filteredCompanies = companies.filter(c =>
    !search.trim() ||
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.cin.toLowerCase().includes(search.toLowerCase())
  );

  function getFilesForDocType(category: string, docType: string): CompanyFile[] {
    return files.filter(f => f.category === category && f.docType === docType);
  }

  async function handleUpload() {
    if (!uploadFile || !uploadModal || !selectedCompany) return;
    setUploading(true);
    setUploadError("");
    const fd = new FormData();
    fd.append("file", uploadFile);
    fd.append("companyId", selectedCompany.companyId);
    fd.append("companyName", selectedCompany.companyName);
    fd.append("category", uploadModal.category);
    fd.append("docType", uploadModal.docType);
    if (uploadModal.hasFY) fd.append("financialYear", uploadFY);
    if (uploadModal.hasExpiry && uploadExpiry) fd.append("expiryDate", uploadExpiry);
    if (uploadNotes) fd.append("notes", uploadNotes);
    try {
      const res = await fetch("/api/company-files/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Upload failed");
      }
      setUploadModal(null);
      setUploadFile(null);
      setUploadExpiry("");
      setUploadNotes("");
      loadFiles(selectedCompany);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!deleteId || !selectedCompany) return;
    setDeleting(true);
    await fetch(`/api/company-files?id=${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    loadFiles(selectedCompany);
  }

  async function disconnectDrive() {
    await fetch("/api/drive/disconnect", { method: "POST" });
    setDriveStatus({ connected: false, email: null, folderId: null });
  }

  // ── Drive not connected ──
  if (!driveLoading && !driveStatus?.connected) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-sm text-center">
            {/* Animated Drive icon */}
            <div className="relative mx-auto mb-6 w-24 h-24">
              <div className="absolute inset-0 bg-blue-100 rounded-3xl rotate-6 opacity-60" />
              <div className="absolute inset-0 bg-blue-200 rounded-3xl -rotate-3 opacity-40" />
              <div className="relative w-24 h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center border border-blue-100">
                <i className="ti ti-brand-google-drive text-5xl text-blue-500" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Connect Google Drive</h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              Store all client documents securely in your organisation's Google Drive — organised by company and category. Connect once; your team can access everything.
            </p>
            <a
              href="/api/drive/auth"
              className="inline-flex items-center gap-2.5 px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all hover:shadow-blue-300 hover:-translate-y-0.5"
            >
              <i className="ti ti-brand-google text-base" />
              Connect with Google
            </a>
            <p className="text-xs text-slate-400 mt-5 flex items-center justify-center gap-1.5">
              <i className="ti ti-lock text-slate-300" />
              Only sees files created by this app — no access to existing Drive content
            </p>
          </div>
        </div>
      </div>
    );
  }

  const uploadedCount = files.length;
  const expiringCount = files.filter(f => isExpiringSoon(f.expiryDate)).length;
  const expiredCount  = files.filter(f => isExpired(f.expiryDate)).length;

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left Sidebar ── */}
      <div className="w-60 flex-shrink-0 border-r border-slate-100 flex flex-col bg-white">
        {/* Sidebar header */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Companies</p>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
            <i className="ti ti-search text-slate-300 text-sm" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or CIN…"
              className="flex-1 text-xs bg-transparent outline-none text-slate-700 placeholder-slate-300"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-300 hover:text-slate-500">
                <i className="ti ti-x text-xs" />
              </button>
            )}
          </div>
        </div>

        {/* Company list */}
        <div className="flex-1 overflow-y-auto">
          {filteredCompanies.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <i className="ti ti-building-off text-3xl text-slate-200 block mb-2" />
              <p className="text-xs text-slate-400">No companies found</p>
            </div>
          ) : (
            filteredCompanies.map((company, idx) => {
              const initials = company.companyName
                .split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase().slice(0, 2);
              const isSelected = company.companyId === selectedCompany?.companyId;
              const colors = ["bg-blue-500","bg-violet-500","bg-emerald-500","bg-amber-500","bg-rose-500","bg-teal-500","bg-indigo-500","bg-orange-500"];
              const color = colors[idx % colors.length];
              return (
                <button
                  key={company.companyId}
                  onClick={() => setSelectedCompany(company)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-l-[3px] ${
                    isSelected
                      ? "bg-blue-50 border-l-blue-500"
                      : "border-l-transparent hover:bg-slate-50 hover:border-l-slate-200"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 shadow-sm ${
                    isSelected ? "bg-blue-500" : color
                  }`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-semibold truncate leading-tight ${isSelected ? "text-blue-700" : "text-slate-700"}`}>
                      {company.companyName}
                    </div>
                    <div className={`text-[10px] mt-0.5 truncate ${isSelected ? "text-blue-400" : "text-slate-400"}`}>
                      {company.cin || company.entityType || ""}
                    </div>
                  </div>
                  {isSelected && files.length > 0 && (
                    <span className="text-[10px] bg-blue-100 text-blue-600 font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {files.length}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
        {!selectedCompany ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-300">
            <i className="ti ti-building text-6xl" />
            <p className="text-sm font-medium">Select a company to view documents</p>
          </div>
        ) : (
          <>
            {/* Company header */}
            <div className="px-5 py-3.5 bg-white border-b border-slate-100 flex items-center justify-between flex-shrink-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-200">
                  {selectedCompany.companyName.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase().slice(0,2)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 leading-tight">{selectedCompany.companyName}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{selectedCompany.cin}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Stats pills */}
                {!filesLoading && (
                  <div className="hidden md:flex items-center gap-1.5">
                    {uploadedCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {uploadedCount} uploaded
                      </span>
                    )}
                    {expiringCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {expiringCount} expiring
                      </span>
                    )}
                    {expiredCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-100 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {expiredCount} expired
                      </span>
                    )}
                  </div>
                )}

                {/* FY selector */}
                <select
                  value={selectedFY}
                  onChange={e => setSelectedFY(e.target.value)}
                  className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm font-medium"
                >
                  {FY_OPTIONS.map(fy => (
                    <option key={fy} value={fy}>FY {fy}</option>
                  ))}
                </select>

                {/* Drive badge */}
                {driveStatus?.connected && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm">
                    <i className="ti ti-brand-google-drive text-emerald-500 text-sm" />
                    <span className="text-[10px] text-emerald-700 font-semibold truncate max-w-[120px]">
                      {driveStatus.email}
                    </span>
                    <button
                      onClick={disconnectDrive}
                      className="text-emerald-400 hover:text-red-400 ml-0.5 transition-colors"
                      title="Disconnect Drive"
                    >
                      <i className="ti ti-x text-[10px]" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Categories */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {filesLoading ? (
                <div className="flex flex-col items-center justify-center pt-16 gap-3">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400">Loading documents…</p>
                </div>
              ) : (
                DOC_CATEGORIES.map(cat => {
                  const colors = CAT_COLORS[cat.key] ?? CAT_COLORS.INCORPORATION;
                  const catUploaded = cat.docs.reduce((acc, doc) => {
                    return acc + getFilesForDocType(cat.key, doc.type).filter(
                      f => !cat.hasFY || !f.financialYear || f.financialYear === selectedFY
                    ).length;
                  }, 0);

                  return (
                    <div key={cat.key} className={`rounded-2xl border ${colors.border} bg-gradient-to-br ${colors.bg} overflow-hidden`}>
                      {/* Category header */}
                      <div className="px-4 py-3 flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl ${colors.iconBg} flex items-center justify-center`}>
                          <i className={`ti ${cat.icon} text-base ${colors.icon}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">{cat.label}</h4>
                            {cat.hasFY && (
                              <span className="text-[10px] text-slate-400 font-medium bg-white/60 px-1.5 py-0.5 rounded-full">
                                FY {selectedFY}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {catUploaded} of {cat.docs.length} documents uploaded
                          </p>
                        </div>
                        {/* Progress bar */}
                        <div className="w-16 h-1.5 bg-white/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colors.icon.replace("text-","bg-")} transition-all`}
                            style={{ width: `${cat.docs.length > 0 ? (catUploaded / cat.docs.length) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Doc cards */}
                      <div className="px-4 pb-4 grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-4">
                        {cat.docs.map(doc => {
                          const uploaded = getFilesForDocType(cat.key, doc.type).filter(
                            f => !cat.hasFY || !f.financialYear || f.financialYear === selectedFY
                          );
                          const latest   = uploaded[0] ?? null;
                          const expiring = latest && isExpiringSoon(latest.expiryDate);
                          const expired  = latest && isExpired(latest.expiryDate);

                          return (
                            <div
                              key={doc.type}
                              className={`bg-white rounded-xl p-3 border transition-all group hover:shadow-md ${
                                expired  ? "border-red-200 shadow-sm shadow-red-50"  :
                                expiring ? "border-amber-200 shadow-sm shadow-amber-50" :
                                latest   ? "border-emerald-200 shadow-sm shadow-emerald-50" :
                                "border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              {/* Doc name + status */}
                              <div className="flex items-start justify-between gap-1 mb-2">
                                <p className="text-[11px] font-semibold text-slate-700 leading-snug flex-1">{doc.label}</p>
                                {latest ? (
                                  expired ? (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold whitespace-nowrap flex-shrink-0">
                                      <i className="ti ti-alert-circle text-[8px]" /> Expired
                                    </span>
                                  ) : expiring ? (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold whitespace-nowrap flex-shrink-0">
                                      <i className="ti ti-clock text-[8px]" /> Expiring
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold whitespace-nowrap flex-shrink-0">
                                      <i className="ti ti-check text-[8px]" /> Done
                                    </span>
                                  )
                                ) : (
                                  <span className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium whitespace-nowrap flex-shrink-0">
                                    Missing
                                  </span>
                                )}
                              </div>

                              {/* File info */}
                              {latest ? (
                                <div className="mb-2">
                                  <p className="text-[10px] text-slate-500 truncate" title={latest.fileName}>
                                    <i className="ti ti-paperclip text-[9px] text-slate-300 mr-0.5" />
                                    {latest.fileName}
                                  </p>
                                  {latest.fileSize && (
                                    <p className="text-[10px] text-slate-400">{formatBytes(latest.fileSize)}</p>
                                  )}
                                  {latest.expiryDate && (
                                    <p className={`text-[10px] mt-0.5 ${expired ? "text-red-500 font-medium" : expiring ? "text-amber-600 font-medium" : "text-slate-400"}`}>
                                      <i className="ti ti-calendar text-[9px] mr-0.5" />
                                      {new Date(latest.expiryDate).toLocaleDateString("en-IN")}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="mb-2 h-8 flex items-center">
                                  <p className="text-[10px] text-slate-300 italic">Not uploaded yet</p>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex items-center gap-1 pt-1.5 border-t border-slate-100">
                                {latest?.driveWebViewLink && (
                                  <a
                                    href={latest.driveWebViewLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-0.5 text-[10px] text-blue-500 hover:text-blue-700 font-medium"
                                  >
                                    <i className="ti ti-eye text-[11px]" /> View
                                  </a>
                                )}
                                {latest && (
                                  <button
                                    onClick={() => setDeleteId(latest.id)}
                                    className="inline-flex items-center gap-0.5 text-[10px] text-slate-300 hover:text-red-500 transition-colors"
                                    title="Remove"
                                  >
                                    <i className="ti ti-trash text-[11px]" />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setUploadModal({ category: cat.key, docType: doc.type, docLabel: doc.label, hasExpiry: !!doc.hasExpiry, hasFY: !!cat.hasFY });
                                    setUploadFile(null); setUploadExpiry(""); setUploadNotes(""); setUploadFY(selectedFY); setUploadError("");
                                  }}
                                  className={`inline-flex items-center gap-0.5 text-[10px] font-medium transition-colors ml-auto ${
                                    latest ? "text-slate-400 hover:text-blue-500" : "text-blue-500 hover:text-blue-700"
                                  }`}
                                >
                                  <i className="ti ti-upload text-[11px]" />
                                  {latest ? "Replace" : "Upload"}
                                </button>
                              </div>

                              {uploaded.length > 1 && (
                                <p className="text-[9px] text-slate-400 mt-1 text-right">{uploaded.length} versions</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Upload Modal ── */}
      {uploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Upload Document</h3>
                <p className="text-xs text-slate-400 mt-0.5">{uploadModal.docLabel}</p>
              </div>
              <button onClick={() => setUploadModal(null)} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                <i className="ti ti-x" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Drop zone */}
              <div
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                  uploadFile ? "border-emerald-300 bg-emerald-50" : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/30"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadFile ? (
                  <div>
                    <i className="ti ti-file-check text-emerald-500 text-3xl block mb-2" />
                    <p className="text-sm font-semibold text-slate-700">{uploadFile.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatBytes(uploadFile.size)} — click to change</p>
                  </div>
                ) : (
                  <div>
                    <i className="ti ti-cloud-upload text-slate-300 text-3xl block mb-2" />
                    <p className="text-sm text-slate-500 font-medium">Click to select file</p>
                    <p className="text-xs text-slate-400 mt-0.5">PDF, JPG, PNG, DOC, XLS — max 25 MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.xls"
                onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
              />

              {uploadModal.hasFY && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Financial Year</label>
                  <select
                    value={uploadFY}
                    onChange={e => setUploadFY(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {FY_OPTIONS.map(fy => <option key={fy} value={fy}>{fy}</option>)}
                  </select>
                </div>
              )}

              {uploadModal.hasExpiry && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Expiry Date <span className="font-normal text-slate-400">(optional)</span></label>
                  <input
                    type="date"
                    value={uploadExpiry}
                    onChange={e => setUploadExpiry(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Notes <span className="font-normal text-slate-400">(optional)</span></label>
                <input
                  value={uploadNotes}
                  onChange={e => setUploadNotes(e.target.value)}
                  placeholder="e.g. Received from client on 10 Nov"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-300"
                />
              </div>

              {uploadError && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2.5 rounded-xl border border-red-100">
                  <i className="ti ti-alert-circle" /> {uploadError}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setUploadModal(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!uploadFile || uploading}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-blue-200 transition-all"
                >
                  {uploading ? (
                    <><i className="ti ti-loader-2 animate-spin" /> Uploading…</>
                  ) : (
                    <><i className="ti ti-brand-google-drive" /> Upload to Drive</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100">
                <i className="ti ti-trash text-red-500 text-xl" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Remove document?</h3>
                <p className="text-xs text-slate-400 mt-0.5">This will also delete the file from Google Drive.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 shadow-md shadow-red-100"
              >
                {deleting ? "Removing…" : "Yes, Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
