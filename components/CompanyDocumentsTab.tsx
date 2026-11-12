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
  return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000; // within 90 days
}

function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

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

  // Upload state
  const [uploadModal, setUploadModal] = useState<{
    category: string;
    docType: string;
    docLabel: string;
    hasExpiry: boolean;
    hasFY: boolean;
  } | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadExpiry, setUploadExpiry] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadFY, setUploadFY] = useState(defaultFY);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const FY_OPTIONS = ["2026-27", "2025-26", "2024-25", "2023-24", "2022-23", "2021-22"];

  // Load Drive status
  useEffect(() => {
    setDriveLoading(true);
    fetch("/api/drive/status")
      .then(r => r.json())
      .then(d => setDriveStatus(d))
      .catch(() => setDriveStatus({ connected: false, email: null, folderId: null }))
      .finally(() => setDriveLoading(false));
  }, []);

  // Load files when company changes
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

  // Count uploaded files per company (approximation from selected)
  function getDocCountLabel(company: Company): string {
    if (company.companyId !== selectedCompany?.companyId) return "";
    return `${files.length} file${files.length !== 1 ? "s" : ""}`;
  }

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

  // ── Drive not connected banner ──
  if (!driveLoading && !driveStatus?.connected) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Company Documents</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Store and manage documents for each company — COI, MOA/AOA, annual filings, certificates and more.
          </p>
        </div>

        {/* Connect card */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="ti ti-brand-google-drive text-3xl text-blue-500" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-2">Connect Google Drive</h3>
            <p className="text-sm text-slate-500 mb-6">
              Documents are stored in your organisation's Google Drive — organised by company and category.
              Connect once; all team members can view and upload.
            </p>
            <a
              href="/api/drive/auth"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              <i className="ti ti-brand-google" aria-hidden="true" />
              Connect with Google
            </a>
            <p className="text-xs text-slate-400 mt-4">
              We request only <code>drive.file</code> scope — we can only see files we create.
            </p>
            {!process.env.NEXT_PUBLIC_GOOGLE_DRIVE_ENABLED && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 text-left">
                <strong>Setup required:</strong> Add <code>GOOGLE_DRIVE_CLIENT_ID</code> and{" "}
                <code>GOOGLE_DRIVE_CLIENT_SECRET</code> to your <code>.env.local</code> file.
                See setup guide in the project README.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left sidebar ── */}
      <div className="w-56 flex-shrink-0 border-r border-slate-100 flex flex-col bg-slate-50/50">
        {/* Search */}
        <div className="p-3 border-b border-slate-100">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
            <i className="ti ti-search text-slate-400 text-sm" aria-hidden="true" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search companies…"
              className="flex-1 text-xs bg-transparent outline-none text-slate-700 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Company list */}
        <div className="flex-1 overflow-y-auto py-1">
          {filteredCompanies.length === 0 ? (
            <p className="px-3 py-4 text-xs text-slate-400 text-center">No companies found</p>
          ) : (
            filteredCompanies.map(company => {
              const initials = company.companyName
                .split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase().slice(0, 2);
              const isSelected = company.companyId === selectedCompany?.companyId;
              return (
                <button
                  key={company.companyId}
                  onClick={() => setSelectedCompany(company)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                    isSelected ? "bg-blue-50 border-r-2 border-blue-500" : "hover:bg-slate-100"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${
                    isSelected ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-600"
                  }`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium truncate ${isSelected ? "text-blue-700" : "text-slate-700"}`}>
                      {company.companyName}
                    </div>
                    {isSelected && (
                      <div className="text-[10px] text-blue-500 mt-0.5">{getDocCountLabel(company)}</div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedCompany ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Select a company to view documents
          </div>
        ) : (
          <>
            {/* Company header */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">{selectedCompany.companyName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedCompany.cin}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* FY selector for annual docs */}
                <select
                  value={selectedFY}
                  onChange={e => setSelectedFY(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
                >
                  {FY_OPTIONS.map(fy => (
                    <option key={fy} value={fy}>FY {fy}</option>
                  ))}
                </select>
                {/* Drive badge */}
                {driveStatus?.connected && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="text-[10px] text-emerald-700 font-medium truncate max-w-[140px]">
                      {driveStatus.email}
                    </span>
                    <button
                      onClick={disconnectDrive}
                      className="text-[10px] text-emerald-500 hover:text-red-500 ml-0.5"
                      title="Disconnect Drive"
                    >
                      <i className="ti ti-x" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Summary strip */}
            {!filesLoading && files.length > 0 && (
              <div className="px-5 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-4 text-[11px] text-slate-500 flex-shrink-0">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {files.length} uploaded
                </span>
                {files.filter(f => isExpiringSoon(f.expiryDate)).length > 0 && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    {files.filter(f => isExpiringSoon(f.expiryDate)).length} expiring soon
                  </span>
                )}
                {files.filter(f => isExpired(f.expiryDate)).length > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    {files.filter(f => isExpired(f.expiryDate)).length} expired
                  </span>
                )}
              </div>
            )}

            {/* Categories */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {filesLoading ? (
                <div className="text-sm text-slate-400 text-center pt-10">Loading…</div>
              ) : (
                DOC_CATEGORIES.map(cat => {
                  // For FY-based categories, show docs for selectedFY + all without FY
                  const catDocs = cat.hasFY
                    ? cat.docs
                    : cat.docs;

                  return (
                    <div key={cat.key}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <i className={`ti ${cat.icon} text-slate-400 text-sm`} aria-hidden="true" />
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          {cat.label}
                          {cat.hasFY && <span className="ml-1.5 font-normal normal-case text-slate-400">— FY {selectedFY}</span>}
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                        {catDocs.map(doc => {
                          const uploaded = getFilesForDocType(cat.key, doc.type).filter(
                            f => !cat.hasFY || !f.financialYear || f.financialYear === selectedFY
                          );
                          const latest = uploaded[0] ?? null;
                          const expiring = latest && isExpiringSoon(latest.expiryDate);
                          const expired  = latest && isExpired(latest.expiryDate);

                          return (
                            <div
                              key={doc.type}
                              className="border border-slate-200 rounded-xl p-3 bg-white hover:border-slate-300 transition-colors group"
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-semibold text-slate-700 leading-tight">{doc.label}</p>
                                  {latest ? (
                                    <>
                                      <p className="text-[10px] text-slate-400 mt-0.5 truncate" title={latest.fileName}>
                                        {latest.fileName}
                                      </p>
                                      {latest.fileSize && (
                                        <p className="text-[10px] text-slate-400">{formatBytes(latest.fileSize)}</p>
                                      )}
                                    </>
                                  ) : (
                                    <p className="text-[10px] text-slate-400 mt-0.5">Not uploaded</p>
                                  )}
                                </div>

                                {/* Status badge */}
                                {latest ? (
                                  expired ? (
                                    <span className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium whitespace-nowrap flex-shrink-0">
                                      Expired
                                    </span>
                                  ) : expiring ? (
                                    <span className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium whitespace-nowrap flex-shrink-0">
                                      Expiring
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium whitespace-nowrap flex-shrink-0">
                                      ✓ Uploaded
                                    </span>
                                  )
                                ) : (
                                  <span className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200 font-medium whitespace-nowrap flex-shrink-0">
                                    Missing
                                  </span>
                                )}
                              </div>

                              {/* Expiry date */}
                              {latest?.expiryDate && (
                                <p className={`text-[10px] mt-1 ${expired ? "text-red-500" : expiring ? "text-amber-600" : "text-slate-400"}`}>
                                  Expires: {new Date(latest.expiryDate).toLocaleDateString("en-IN")}
                                </p>
                              )}

                              {/* Action buttons */}
                              <div className="flex items-center gap-1 mt-2">
                                {latest?.driveWebViewLink && (
                                  <a
                                    href={latest.driveWebViewLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                                  >
                                    <i className="ti ti-eye text-[11px]" /> View
                                  </a>
                                )}
                                {latest && (
                                  <button
                                    onClick={() => setDeleteId(latest.id)}
                                    className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-0.5 ml-auto"
                                  >
                                    <i className="ti ti-trash text-[11px]" /> Remove
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setUploadModal({
                                      category: cat.key,
                                      docType: doc.type,
                                      docLabel: doc.label,
                                      hasExpiry: !!doc.hasExpiry,
                                      hasFY: !!cat.hasFY,
                                    });
                                    setUploadFile(null);
                                    setUploadExpiry("");
                                    setUploadNotes("");
                                    setUploadFY(selectedFY);
                                    setUploadError("");
                                  }}
                                  className={`text-[10px] flex items-center gap-0.5 ${
                                    latest
                                      ? "text-slate-400 hover:text-blue-600 ml-1"
                                      : "text-blue-600 hover:text-blue-800 ml-auto"
                                  }`}
                                >
                                  <i className="ti ti-upload text-[11px]" />
                                  {latest ? "Replace" : "Upload"}
                                </button>
                              </div>

                              {/* Multiple versions note */}
                              {uploaded.length > 1 && (
                                <p className="text-[10px] text-slate-400 mt-1">{uploaded.length} versions</p>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">Upload — {uploadModal.docLabel}</h3>
              <button onClick={() => setUploadModal(null)} className="text-slate-400 hover:text-slate-600">
                <i className="ti ti-x text-lg" />
              </button>
            </div>

            <div className="space-y-3">
              {/* File picker */}
              <div>
                <label className="text-xs text-slate-500 block mb-1">File (PDF, JPG, PNG, etc. — max 25 MB)</label>
                <div
                  className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadFile ? (
                    <div className="text-sm text-slate-700">
                      <i className="ti ti-file-check text-emerald-500 text-2xl block mb-1" />
                      <p className="font-medium">{uploadFile.name}</p>
                      <p className="text-xs text-slate-400">{formatBytes(uploadFile.size)}</p>
                    </div>
                  ) : (
                    <div className="text-slate-400">
                      <i className="ti ti-upload text-2xl block mb-1" />
                      <p className="text-xs">Click to select file</p>
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
              </div>

              {/* FY selector */}
              {uploadModal.hasFY && (
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Financial Year</label>
                  <select
                    value={uploadFY}
                    onChange={e => setUploadFY(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {FY_OPTIONS.map(fy => <option key={fy} value={fy}>{fy}</option>)}
                  </select>
                </div>
              )}

              {/* Expiry date */}
              {uploadModal.hasExpiry && (
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Expiry Date (optional)</label>
                  <input
                    type="date"
                    value={uploadExpiry}
                    onChange={e => setUploadExpiry(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-xs text-slate-500 block mb-1">Notes (optional)</label>
                <input
                  value={uploadNotes}
                  onChange={e => setUploadNotes(e.target.value)}
                  placeholder="e.g. Received from client on 10 Nov"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {uploadError && (
                <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{uploadError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setUploadModal(null)}
                  className="flex-1 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!uploadFile || uploading}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <><i className="ti ti-loader-2 animate-spin" /> Uploading…</>
                  ) : (
                    <><i className="ti ti-upload" /> Upload to Drive</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <i className="ti ti-trash text-red-500 text-lg" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Remove document?</h3>
                <p className="text-xs text-slate-500 mt-0.5">This will also delete the file from Google Drive.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
