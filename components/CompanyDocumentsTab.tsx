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
  OTHER:         { bg: "from-slate-50 to-gray-50",    border: "border-slate-200",  icon: "text-slate-500",  badge: "bg-slate-100 text-slate-600",   iconBg: "bg-slate-100" },
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
  const [selectedFY, setSelectedFY] = useState("ALL");

  const [uploadModal, setUploadModal] = useState<{
    category: string; docType: string; docLabel: string; hasExpiry: boolean; hasFY: boolean; isOther?: boolean;
  } | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadExpiry, setUploadExpiry] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadFY, setUploadFY] = useState(defaultFY);
  const [uploadCustomLabel, setUploadCustomLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Verification state
  type VerifyStatus = "idle" | "verifying" | "verified" | "warning" | "mismatch" | "skipped";
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>("idle");
  const [verifyReason, setVerifyReason] = useState("");
  const [verifyConfidence, setVerifyConfidence] = useState(0);
  const [confirmStep, setConfirmStep] = useState(0); // 0=none, 1,2,3
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Share link state
  const [shareModal, setShareModal]       = useState(false);
  const [shareLoading, setShareLoading]   = useState(false);
  const [shareUrl, setShareUrl]           = useState("");
  const [shareCopied, setShareCopied]     = useState<string>("");
  const [shareExpiry, setShareExpiry]     = useState(30);
  const [shareMode, setShareMode]         = useState<"all" | "selected">("all");
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [shareLinks, setShareLinks]       = useState<Array<{ id: string; url: string; label: string | null; shareMode: string; expiresAt: string | null; createdAt: string }>>([]);

  const FY_OPTIONS = ["2026-27", "2025-26", "2024-25", "2023-24", "2022-23", "2021-22"];
  const [viewMode, setViewMode] = useState<"standard" | "grouped">("standard");

  const VIEW_GROUPS = [
    {
      key: "INC_CERTS",
      label: "Incorporation & Certificates",
      icon: "ti-certificate",
      colorKey: "INCORPORATION",
      categories: ["INCORPORATION", "CERTIFICATES"],
      otherCategoryKey: "OTHER_INC_CERT",
      hasFY: false,
    },
    {
      key: "FINANCIALS",
      label: "Financials & Audit",
      icon: "ti-chart-bar",
      colorKey: "ANNUAL_FILING",
      categories: ["ANNUAL_FILING"],
      otherCategoryKey: "OTHER_FINANCIALS",
      hasFY: true,
      subLabel: "MCA Forms, Financial Statements, Auditor Report",
    },
    {
      key: "RESOLUTIONS",
      label: "Resolutions & Minutes",
      icon: "ti-notes",
      colorKey: "RESOLUTIONS",
      categories: ["RESOLUTIONS", "DIRECTORS"],
      otherCategoryKey: "OTHER_RESOLUTIONS",
      hasFY: true,
    },
    {
      key: "TAX",
      label: "Tax Filings",
      icon: "ti-receipt-tax",
      colorKey: "TAX",
      categories: ["TAX"],
      otherCategoryKey: "OTHER_TAX",
      hasFY: true,
    },
    {
      key: "OTHER_GROUP",
      label: "Other Documents",
      icon: "ti-folder-plus",
      colorKey: "OTHER",
      categories: [] as string[],
      otherCategoryKey: "OTHER",
      hasFY: false,
      isOtherGroup: true,
    },
  ];

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

  async function runAiVerify(file: File) {
    if (!uploadModal || !selectedCompany) return;
    setVerifyStatus("verifying");
    setVerifyReason("");
    setConfirmStep(0);
    setShowPreview(false);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("companyName", selectedCompany.companyName);
      fd.append("docLabel", uploadModal.docLabel);
      if (uploadModal.isOther) fd.append("isOther", "true");
      const res  = await fetch("/api/company-files/verify", { method: "POST", body: fd });
      const data = await res.json();
      if (uploadModal.isOther && data.suggestedTitle) {
        setUploadCustomLabel(data.suggestedTitle);
      }
      setVerifyStatus(data.status ?? "warning");
      setVerifyReason(data.reason ?? "");
      setVerifyConfidence(data.confidence ?? 0);
    } catch {
      setVerifyStatus("warning");
      setVerifyReason("AI check failed — please verify manually.");
    }
  }

  function handleFileSelect(file: File) {
    setUploadFile(file);
    // Create blob URL for preview
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setShowPreview(false);
    setConfirmStep(0);
    runAiVerify(file);
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
    if (uploadModal.isOther && uploadCustomLabel.trim()) fd.append("customLabel", uploadCustomLabel.trim());
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
      setUploadCustomLabel("");
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setVerifyStatus("idle");
      setConfirmStep(0);
      loadFiles(selectedCompany);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function closeUploadModal() {
    setUploadModal(null);
    setUploadFile(null);
    setUploadExpiry("");
    setUploadNotes("");
    setUploadCustomLabel("");
    setUploadError("");
    setVerifyStatus("idle");
    setConfirmStep(0);
    setShowPreview(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }

  const needsConfirm = verifyStatus === "warning" || verifyStatus === "mismatch";
  const canUpload = uploadFile && !uploading && (
    verifyStatus === "verified" || verifyStatus === "skipped" ||
    (needsConfirm && confirmStep >= 3)
  ) && (!uploadModal?.isOther || uploadCustomLabel.trim().length > 0);

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

  async function openShareModal() {
    if (!selectedCompany) return;
    setShareModal(true);
    setShareUrl("");
    setShareCopied("");
    setShareMode("all");
    setSelectedFileIds(new Set());
    const res = await fetch(`/api/company-files/share?companyId=${selectedCompany.companyId}`);
    if (res.ok) {
      const d = await res.json();
      setShareLinks(d.links ?? []);
    }
  }

  async function createShareLink() {
    if (!selectedCompany) return;
    if (shareMode === "selected" && selectedFileIds.size === 0) return;
    setShareLoading(true);
    const res = await fetch("/api/company-files/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId: selectedCompany.companyId,
        companyName: selectedCompany.companyName,
        expiryDays: shareExpiry,
        shareMode,
        fileIds: shareMode === "selected" ? Array.from(selectedFileIds) : [],
      }),
    });
    const d = await res.json();
    setShareLoading(false);
    if (d.url) {
      setShareUrl(d.url);
      // refresh link list
      const r2 = await fetch(`/api/company-files/share?companyId=${selectedCompany.companyId}`);
      if (r2.ok) setShareLinks((await r2.json()).links ?? []);
    }
  }

  async function copyShareUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setShareCopied(url);
    setTimeout(() => setShareCopied(""), 2500);
  }

  function toggleFileSelect(id: string) {
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function deleteShareLink(id: string) {
    await fetch(`/api/company-files/share?id=${id}`, { method: "DELETE" });
    setShareLinks(prev => prev.filter(l => l.id !== id));
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

                {/* View toggle */}
                <div className="flex items-center bg-slate-100 rounded-xl p-0.5 shadow-inner">
                  <button
                    onClick={() => setViewMode("standard")}
                    title="Standard View"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      viewMode === "standard"
                        ? "bg-white text-slate-700 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <i className="ti ti-layout-grid text-sm" />
                    <span className="hidden sm:inline">Standard</span>
                  </button>
                  <button
                    onClick={() => setViewMode("grouped")}
                    title="Grouped View"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      viewMode === "grouped"
                        ? "bg-white text-slate-700 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <i className="ti ti-layout-list text-sm" />
                    <span className="hidden sm:inline">Grouped</span>
                  </button>
                </div>

                {/* FY selector */}
                <select
                  value={selectedFY}
                  onChange={e => setSelectedFY(e.target.value)}
                  className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm font-medium"
                >
                  <option value="ALL">All Years</option>
                  {FY_OPTIONS.map(fy => (
                    <option key={fy} value={fy}>FY {fy}</option>
                  ))}
                </select>

                {/* Share button */}
                {files.length > 0 && (
                  <button
                    onClick={openShareModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-indigo-700 text-xs font-semibold transition-all shadow-sm"
                  >
                    <i className="ti ti-share text-sm" />
                    Share
                  </button>
                )}

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
              ) : viewMode === "grouped" ? (
                /* ── GROUPED VIEW ── */
                VIEW_GROUPS.map(group => {
                  const colors = (CAT_COLORS as Record<string, typeof CAT_COLORS.INCORPORATION>)[group.colorKey] ?? CAT_COLORS.INCORPORATION;

                  // Collect all doc definitions from mapped categories
                  const groupDocs = group.categories.flatMap(catKey => {
                    const cat = DOC_CATEGORIES.find(c => c.key === catKey);
                    return cat ? cat.docs.map(doc => ({ ...doc, catKey, catHasFY: !!cat.hasFY })) : [];
                  });

                  // Collect "other" files for this group
                  const otherFiles = group.isOtherGroup
                    ? files.filter(f => f.category === "OTHER")
                    : files.filter(f => f.category === group.otherCategoryKey);

                  const regularUploaded = groupDocs.filter(doc => {
                    const uploaded = getFilesForDocType(doc.catKey, doc.type).filter(
                      f => !doc.catHasFY || !f.financialYear || selectedFY === "ALL" || f.financialYear === selectedFY
                    );
                    return uploaded.length > 0;
                  }).length;
                  const totalDocs = groupDocs.length;

                  return (
                    <div key={group.key} className={`rounded-2xl border ${colors.border} bg-gradient-to-br ${colors.bg} overflow-hidden`}>
                      {/* Group header */}
                      <div className="px-4 py-3 flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl ${colors.iconBg} flex items-center justify-center`}>
                          <i className={`ti ${group.icon} text-base ${colors.icon}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">{group.label}</h4>
                            {group.hasFY && (
                              <span className="text-[10px] text-slate-400 font-medium bg-white/60 px-1.5 py-0.5 rounded-full">
                                {selectedFY === "ALL" ? "All Years" : `FY ${selectedFY}`}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {group.isOtherGroup
                              ? `${otherFiles.length} document${otherFiles.length !== 1 ? "s" : ""}`
                              : `${regularUploaded + otherFiles.length} of ${totalDocs} uploaded`}
                          </p>
                        </div>
                        {/* Add Other button */}
                        <button
                          onClick={() => {
                            setUploadModal({ category: group.otherCategoryKey, docType: "OTHER", docLabel: "Other Document", hasExpiry: false, hasFY: false, isOther: true });
                            setUploadFile(null); setUploadExpiry(""); setUploadNotes("");
                            setUploadFY(selectedFY === "ALL" ? FY_OPTIONS[0] : selectedFY);
                            setUploadError(""); setUploadCustomLabel("");
                            setVerifyStatus("idle"); setConfirmStep(0); setShowPreview(false);
                          }}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 transition-all shadow-sm flex-shrink-0"
                        >
                          <i className="ti ti-plus text-sm" /> Add Other
                        </button>
                        {/* Progress bar */}
                        {!group.isOtherGroup && (
                          <div className="w-16 h-1.5 bg-white/60 rounded-full overflow-hidden flex-shrink-0">
                            <div
                              className={`h-full rounded-full ${colors.icon.replace("text-", "bg-")} transition-all`}
                              style={{ width: `${totalDocs > 0 ? ((regularUploaded + otherFiles.length) / totalDocs) * 100 : 0}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Doc cards grid */}
                      {(groupDocs.length > 0 || otherFiles.length > 0) && (
                        <div className="px-4 pb-4 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
                          {/* Regular docs */}
                          {groupDocs.map(doc => {
                            const uploaded = getFilesForDocType(doc.catKey, doc.type).filter(
                              f => !doc.catHasFY || !f.financialYear || selectedFY === "ALL" || f.financialYear === selectedFY
                            );
                            const latest   = uploaded[0] ?? null;
                            const expiring = latest && isExpiringSoon(latest.expiryDate);
                            const expired  = latest && isExpired(latest.expiryDate);
                            const cardState = expired ? "expired" : expiring ? "expiring" : latest ? "done" : "missing";
                            const cardStyles = {
                              done:    "border-emerald-200 bg-white shadow-sm shadow-emerald-100/60 hover:shadow-emerald-200/80",
                              expiring:"border-amber-200 bg-white shadow-sm shadow-amber-100/60 hover:shadow-amber-200/80",
                              expired: "border-red-200 bg-white shadow-sm shadow-red-100/60 hover:shadow-red-200/80",
                              missing: "border-slate-200 bg-white hover:border-slate-300 hover:shadow-slate-100",
                            }[cardState];
                            return (
                              <div key={`${doc.catKey}-${doc.type}`} className={`rounded-2xl border-[1.5px] p-4 transition-all duration-200 group hover:shadow-lg hover:-translate-y-0.5 ${cardStyles}`}>
                                <div className="flex items-start justify-between mb-3">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                    cardState === "done"     ? "bg-emerald-50 border border-emerald-100" :
                                    cardState === "expiring" ? "bg-amber-50 border border-amber-100" :
                                    cardState === "expired"  ? "bg-red-50 border border-red-100" :
                                    "bg-slate-50 border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100"
                                  }`}>
                                    <i className={`ti text-base ${
                                      cardState === "done"     ? "ti-file-check text-emerald-500" :
                                      cardState === "expiring" ? "ti-clock text-amber-500" :
                                      cardState === "expired"  ? "ti-file-x text-red-500" :
                                      "ti-file-plus text-slate-300 group-hover:text-blue-400"
                                    }`} />
                                  </div>
                                  {cardState === "done" ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold"><i className="ti ti-check text-[9px]" /> Done</span>
                                  ) : cardState === "expiring" ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold"><i className="ti ti-alert-triangle text-[9px]" /> Soon</span>
                                  ) : cardState === "expired" ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold"><i className="ti ti-x text-[9px]" /> Expired</span>
                                  ) : (
                                    <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-slate-200 font-medium">Pending</span>
                                  )}
                                </div>
                                <p className="text-[12px] font-bold text-slate-700 leading-snug mb-1">{doc.label}</p>
                                {latest ? (
                                  <div className="space-y-0.5 mb-3">
                                    <p className="text-[10px] text-slate-400 truncate flex items-center gap-1" title={latest.fileName}>
                                      <i className="ti ti-paperclip text-slate-300 flex-shrink-0" /><span className="truncate">{latest.fileName}</span>
                                    </p>
                                    <div className="flex items-center gap-2">
                                      {latest.fileSize && <span className="text-[10px] text-slate-400">{formatBytes(latest.fileSize)}</span>}
                                      {latest.financialYear && <span className="text-[10px] bg-slate-50 text-slate-500 px-1.5 rounded-full border border-slate-100">FY {latest.financialYear}</span>}
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-slate-300 italic mb-3">Not uploaded yet</p>
                                )}
                                <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-100">
                                  {latest && (
                                    <a href={`/api/company-files/view/${latest.id}`} target="_blank" rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700 font-semibold transition-colors">
                                      <i className="ti ti-eye text-[11px]" /> View
                                    </a>
                                  )}
                                  {latest && (
                                    <button onClick={() => setDeleteId(latest.id)}
                                      className="inline-flex items-center text-[10px] text-slate-200 hover:text-red-400 transition-colors" title="Remove">
                                      <i className="ti ti-trash text-sm" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setUploadModal({ category: doc.catKey, docType: doc.type, docLabel: doc.label, hasExpiry: !!doc.hasExpiry, hasFY: doc.catHasFY });
                                      setUploadFile(null); setUploadExpiry(""); setUploadNotes("");
                                      setUploadFY(selectedFY === "ALL" ? FY_OPTIONS[0] : selectedFY);
                                      setUploadError(""); setVerifyStatus("idle"); setConfirmStep(0);
                                    }}
                                    className={`ml-auto inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                                      latest
                                        ? "text-slate-500 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-100"
                                        : "text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100"
                                    }`}
                                  >
                                    <i className="ti ti-upload text-[11px]" />{latest ? "Replace" : "Upload"}
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {/* Other docs for this group */}
                          {otherFiles.map(f => {
                            const expiring = isExpiringSoon(f.expiryDate);
                            const expired  = isExpired(f.expiryDate);
                            const cardState = expired ? "expired" : expiring ? "expiring" : "done";
                            const cardStyles = {
                              done:    "border-emerald-200 bg-white shadow-sm shadow-emerald-100/60 hover:shadow-emerald-200/80",
                              expiring:"border-amber-200 bg-white shadow-sm shadow-amber-100/60 hover:shadow-amber-200/80",
                              expired: "border-red-200 bg-white shadow-sm shadow-red-100/60 hover:shadow-red-200/80",
                            }[cardState];
                            return (
                              <div key={f.id} className={`rounded-2xl border-[1.5px] p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${cardStyles}`}>
                                <div className="flex items-start justify-between mb-3">
                                  <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                                    <i className="ti ti-file text-slate-400 text-base" />
                                  </div>
                                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200 font-medium">Custom</span>
                                </div>
                                <p className="text-[12px] font-bold text-slate-700 leading-snug mb-1 line-clamp-2">{f.customLabel || f.fileName}</p>
                                <div className="space-y-0.5 mb-3">
                                  <p className="text-[10px] text-slate-400 truncate flex items-center gap-1" title={f.fileName}>
                                    <i className="ti ti-paperclip text-slate-300 flex-shrink-0" /><span className="truncate">{f.fileName}</span>
                                  </p>
                                  {f.fileSize && <span className="text-[10px] text-slate-400 block">{formatBytes(f.fileSize)}</span>}
                                </div>
                                <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-100">
                                  <a href={`/api/company-files/view/${f.id}`} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700 font-semibold transition-colors">
                                    <i className="ti ti-eye text-[11px]" /> View
                                  </a>
                                  <button onClick={() => setDeleteId(f.id)}
                                    className="inline-flex items-center text-[10px] text-slate-200 hover:text-red-400 transition-colors ml-auto" title="Remove">
                                    <i className="ti ti-trash text-sm" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {/* Empty state for other group */}
                          {group.isOtherGroup && otherFiles.length === 0 && (
                            <div className="col-span-full py-4 text-center text-xs text-slate-400 italic">
                              No other documents yet — click &quot;Add Other&quot; to upload any document with a custom title.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                /* ── STANDARD VIEW ── */
                <>
                {DOC_CATEGORIES.filter(cat => cat.key !== "OTHER").map(cat => {
                  const colors = CAT_COLORS[cat.key] ?? CAT_COLORS.INCORPORATION;
                  const catUploaded = cat.docs.reduce((acc, doc) => {
                    return acc + getFilesForDocType(cat.key, doc.type).filter(
                      f => !cat.hasFY || !f.financialYear || selectedFY === "ALL" || f.financialYear === selectedFY
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
                                {selectedFY === "ALL" ? "All Years" : `FY ${selectedFY}`}
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
                      <div className="px-4 pb-4 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
                        {cat.docs.map(doc => {
                          const uploaded = getFilesForDocType(cat.key, doc.type).filter(
                            f => !cat.hasFY || !f.financialYear || selectedFY === "ALL" || f.financialYear === selectedFY
                          );
                          const latest   = uploaded[0] ?? null;
                          const expiring = latest && isExpiringSoon(latest.expiryDate);
                          const expired  = latest && isExpired(latest.expiryDate);

                          const cardState = expired ? "expired" : expiring ? "expiring" : latest ? "done" : "missing";
                          const cardStyles = {
                            done:     "border-emerald-200 bg-white shadow-sm shadow-emerald-100/60 hover:shadow-emerald-200/80",
                            expiring: "border-amber-200 bg-white shadow-sm shadow-amber-100/60 hover:shadow-amber-200/80",
                            expired:  "border-red-200 bg-white shadow-sm shadow-red-100/60 hover:shadow-red-200/80",
                            missing:  "border-slate-200 bg-white hover:border-slate-300 hover:shadow-slate-100",
                          }[cardState];

                          return (
                            <div
                              key={doc.type}
                              className={`rounded-2xl border-[1.5px] p-4 transition-all duration-200 group hover:shadow-lg hover:-translate-y-0.5 ${cardStyles}`}
                            >
                              {/* Top: icon + status badge */}
                              <div className="flex items-start justify-between mb-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                  cardState === "done"     ? "bg-emerald-50 border border-emerald-100" :
                                  cardState === "expiring" ? "bg-amber-50 border border-amber-100" :
                                  cardState === "expired"  ? "bg-red-50 border border-red-100" :
                                  "bg-slate-50 border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100"
                                }`}>
                                  <i className={`ti text-base ${
                                    cardState === "done"     ? "ti-file-check text-emerald-500" :
                                    cardState === "expiring" ? "ti-clock text-amber-500" :
                                    cardState === "expired"  ? "ti-file-x text-red-500" :
                                    "ti-file-plus text-slate-300 group-hover:text-blue-400"
                                  }`} />
                                </div>

                                {cardState === "done" ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                                    <i className="ti ti-check text-[9px]" /> Done
                                  </span>
                                ) : cardState === "expiring" ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                                    <i className="ti ti-alert-triangle text-[9px]" /> Soon
                                  </span>
                                ) : cardState === "expired" ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold">
                                    <i className="ti ti-x text-[9px]" /> Expired
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-slate-200 font-medium">
                                    Pending
                                  </span>
                                )}
                              </div>

                              {/* Doc name */}
                              <p className="text-[12px] font-bold text-slate-700 leading-snug mb-1">{doc.label}</p>

                              {/* File info */}
                              {latest ? (
                                <div className="space-y-0.5 mb-3">
                                  <p className="text-[10px] text-slate-400 truncate flex items-center gap-1" title={latest.fileName}>
                                    <i className="ti ti-paperclip text-slate-300 flex-shrink-0" />
                                    <span className="truncate">{latest.fileName}</span>
                                  </p>
                                  <div className="flex items-center gap-2">
                                    {latest.fileSize && (
                                      <span className="text-[10px] text-slate-400">{formatBytes(latest.fileSize)}</span>
                                    )}
                                    {latest.expiryDate && (
                                      <span className={`text-[10px] font-medium flex items-center gap-0.5 ${
                                        expired ? "text-red-500" : expiring ? "text-amber-600" : "text-slate-400"
                                      }`}>
                                        <i className="ti ti-calendar text-[9px]" />
                                        {new Date(latest.expiryDate).toLocaleDateString("en-IN")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[10px] text-slate-300 italic mb-3">Not uploaded yet</p>
                              )}

                              {/* Action row */}
                              <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-100">
                                {latest ? (
                                  <a
                                    href={`/api/company-files/view/${latest.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700 font-semibold transition-colors"
                                  >
                                    <i className="ti ti-eye text-[11px]" /> View
                                  </a>
                                ) : null}
                                {latest && (
                                  <button
                                    onClick={() => setDeleteId(latest.id)}
                                    className="inline-flex items-center text-[10px] text-slate-200 hover:text-red-400 transition-colors"
                                    title="Remove"
                                  >
                                    <i className="ti ti-trash text-sm" />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setUploadModal({ category: cat.key, docType: doc.type, docLabel: doc.label, hasExpiry: !!doc.hasExpiry, hasFY: !!cat.hasFY });
                                    setUploadFile(null); setUploadExpiry(""); setUploadNotes(""); setUploadFY(selectedFY); setUploadError("");
                                  }}
                                  className={`ml-auto inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                                    latest
                                      ? "text-slate-500 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-100"
                                      : "text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100"
                                  }`}
                                >
                                  <i className="ti ti-upload text-[11px]" />
                                  {latest ? "Replace" : "Upload"}
                                </button>
                              </div>

                              {uploaded.length > 1 && (
                                <p className="text-[9px] text-slate-400 mt-1.5 text-right">{uploaded.length} versions</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

              {/* ── Other Documents ── */}
              {!filesLoading && (() => {
                const otherFiles = files.filter(f => f.category === "OTHER" || f.category === "OTHER_INC_CERT" || f.category === "OTHER_FINANCIALS" || f.category === "OTHER_RESOLUTIONS" || f.category === "OTHER_TAX");
                return (
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-gray-50 overflow-hidden">
                    <div className="px-4 py-3 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                        <i className="ti ti-folder-plus text-base text-slate-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Other Documents</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {otherFiles.length} document{otherFiles.length !== 1 ? "s" : ""} uploaded
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setUploadModal({ category: "OTHER", docType: "OTHER", docLabel: "Other Document", hasExpiry: false, hasFY: false, isOther: true });
                          setUploadFile(null); setUploadExpiry(""); setUploadNotes("");
                          setUploadFY(selectedFY); setUploadError(""); setUploadCustomLabel("");
                          setVerifyStatus("idle"); setConfirmStep(0); setShowPreview(false);
                        }}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-all shadow-sm"
                      >
                        <i className="ti ti-plus text-sm" /> Add Document
                      </button>
                    </div>

                    {otherFiles.length === 0 ? (
                      <div className="px-4 pb-5 text-center">
                        <p className="text-[11px] text-slate-400 italic">No other documents yet — click "Add Document" to upload any file with a custom title.</p>
                      </div>
                    ) : (
                      <div className="px-4 pb-4 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
                        {otherFiles.map(f => {
                          const expiring = isExpiringSoon(f.expiryDate);
                          const expired  = isExpired(f.expiryDate);
                          const cardState = expired ? "expired" : expiring ? "expiring" : "done";
                          const cardStyles = {
                            done:     "border-emerald-200 bg-white shadow-sm shadow-emerald-100/60 hover:shadow-emerald-200/80",
                            expiring: "border-amber-200 bg-white shadow-sm shadow-amber-100/60 hover:shadow-amber-200/80",
                            expired:  "border-red-200 bg-white shadow-sm shadow-red-100/60 hover:shadow-red-200/80",
                          }[cardState];
                          return (
                            <div key={f.id} className={`rounded-2xl border-[1.5px] p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${cardStyles}`}>
                              <div className="flex items-start justify-between mb-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                                  <i className="ti ti-file text-slate-400 text-base" />
                                </div>
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                                  <i className="ti ti-check text-[9px]" /> Done
                                </span>
                              </div>
                              <p className="text-[12px] font-bold text-slate-700 leading-snug mb-1 line-clamp-2">{f.customLabel || f.fileName}</p>
                              <div className="space-y-0.5 mb-3">
                                <p className="text-[10px] text-slate-400 truncate flex items-center gap-1" title={f.fileName}>
                                  <i className="ti ti-paperclip text-slate-300 flex-shrink-0" />
                                  <span className="truncate">{f.fileName}</span>
                                </p>
                                {f.fileSize && <span className="text-[10px] text-slate-400 block">{formatBytes(f.fileSize)}</span>}
                              </div>
                              <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-100">
                                <a href={`/api/company-files/view/${f.id}`} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700 font-semibold transition-colors">
                                  <i className="ti ti-eye text-[11px]" /> View
                                </a>
                                <button onClick={() => setDeleteId(f.id)}
                                  className="inline-flex items-center text-[10px] text-slate-200 hover:text-red-400 transition-colors ml-auto" title="Remove">
                                  <i className="ti ti-trash text-sm" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Upload Modal ── */}
      {uploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-2xl shadow-2xl border border-slate-100 transition-all duration-300 ${showPreview ? "w-full max-w-5xl" : "w-full max-w-md"}`}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Upload Document</h3>
                <p className="text-xs text-slate-400 mt-0.5">{uploadModal.docLabel} — {selectedCompany?.companyName}</p>
              </div>
              <button onClick={closeUploadModal} className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                <i className="ti ti-x" />
              </button>
            </div>

            <div className={`flex ${showPreview ? "divide-x divide-slate-100" : ""}`}>

              {/* ── Left: Form ── */}
              <div className={`p-6 space-y-4 ${showPreview ? "w-96 flex-shrink-0 overflow-y-auto max-h-[80vh]" : "w-full"}`}>

                {/* Drop zone */}
                <div
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                    uploadFile
                      ? verifyStatus === "verified" ? "border-emerald-300 bg-emerald-50"
                        : verifyStatus === "mismatch" ? "border-red-300 bg-red-50"
                        : verifyStatus === "warning"  ? "border-amber-300 bg-amber-50"
                        : "border-blue-200 bg-blue-50/30"
                      : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/30"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadFile ? (
                    <div>
                      <i className={`ti text-3xl block mb-2 ${
                        verifyStatus === "verified" ? "ti-file-check text-emerald-500" :
                        verifyStatus === "mismatch" ? "ti-file-x text-red-500" :
                        verifyStatus === "warning"  ? "ti-file-alert text-amber-500" :
                        "ti-file text-blue-400"
                      }`} />
                      <p className="text-sm font-semibold text-slate-700">{uploadFile.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatBytes(uploadFile.size)} — click to change</p>
                    </div>
                  ) : (
                    <div>
                      <i className="ti ti-cloud-upload text-slate-300 text-3xl block mb-2" />
                      <p className="text-sm text-slate-500 font-medium">Click to select file</p>
                      <p className="text-xs text-slate-400 mt-0.5">PDF, JPG, PNG — max 25 MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.xls"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                />

                {/* AI Verification result */}
                {verifyStatus === "verifying" && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <i className="ti ti-loader-2 animate-spin text-blue-500 text-lg flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-blue-700">AI is verifying your document…</p>
                      <p className="text-[10px] text-blue-500 mt-0.5">Checking document type and company name</p>
                    </div>
                  </div>
                )}

                {verifyStatus === "verified" && (
                  <div className="flex items-start gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i className="ti ti-check text-emerald-600 font-bold" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-emerald-700">Document Verified ✓</p>
                      <p className="text-[11px] text-emerald-600 mt-0.5">{verifyReason}</p>
                      <p className="text-[10px] text-emerald-500 mt-1">Confidence: {verifyConfidence}%</p>
                    </div>
                    {previewUrl && (
                      <button onClick={() => setShowPreview(!showPreview)} className="text-[10px] text-emerald-600 hover:text-emerald-800 underline flex-shrink-0">
                        {showPreview ? "Hide" : "Preview"}
                      </button>
                    )}
                  </div>
                )}

                {(verifyStatus === "warning" || verifyStatus === "mismatch") && (
                  <div className={`px-4 py-3 border rounded-xl ${
                    verifyStatus === "mismatch"
                      ? "bg-red-50 border-red-200"
                      : "bg-amber-50 border-amber-200"
                  }`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        verifyStatus === "mismatch" ? "bg-red-100" : "bg-amber-100"
                      }`}>
                        <i className={`ti text-sm ${verifyStatus === "mismatch" ? "ti-alert-circle text-red-600" : "ti-alert-triangle text-amber-600"}`} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs font-bold ${verifyStatus === "mismatch" ? "text-red-700" : "text-amber-700"}`}>
                          {verifyStatus === "mismatch" ? "Document Mismatch Detected" : "AI Could Not Verify"}
                        </p>
                        <p className={`text-[11px] mt-0.5 ${verifyStatus === "mismatch" ? "text-red-600" : "text-amber-600"}`}>
                          {verifyReason}
                        </p>
                      </div>
                    </div>

                    {/* Preview button */}
                    {previewUrl && (
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className={`w-full py-2 rounded-xl text-xs font-semibold border transition-all mb-3 flex items-center justify-center gap-1.5 ${
                          verifyStatus === "mismatch"
                            ? "border-red-200 text-red-600 hover:bg-red-100"
                            : "border-amber-200 text-amber-700 hover:bg-amber-100"
                        }`}
                      >
                        <i className="ti ti-eye" />
                        {showPreview ? "Hide Document" : "Open & Read Document Yourself →"}
                      </button>
                    )}

                    {/* 3-step confirm */}
                    <div className="space-y-2">
                      {[
                        { step: 1, text: "Are you sure this is the correct document?" },
                        { step: 2, text: "Are you absolutely sure? This will be saved permanently." },
                        { step: 3, text: "I have read the document and confirm it is correct." },
                      ].map(({ step, text }) => (
                        <button
                          key={step}
                          disabled={confirmStep < step - 1}
                          onClick={() => setConfirmStep(s => Math.max(s, step))}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                            confirmStep >= step
                              ? "bg-slate-700 text-white border-slate-700"
                              : confirmStep >= step - 1
                              ? verifyStatus === "mismatch"
                                ? "border-red-300 text-red-700 hover:bg-red-100 cursor-pointer"
                                : "border-amber-300 text-amber-700 hover:bg-amber-100 cursor-pointer"
                              : "border-slate-200 text-slate-300 cursor-not-allowed"
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] border ${
                            confirmStep >= step ? "bg-white text-slate-700 border-white" : "border-current"
                          }`}>
                            {confirmStep >= step ? <i className="ti ti-check text-[10px]" /> : step}
                          </span>
                          {text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {uploadModal.hasFY && (
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Financial Year</label>
                    <select value={uploadFY} onChange={e => setUploadFY(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      {FY_OPTIONS.map(fy => <option key={fy} value={fy}>{fy}</option>)}
                    </select>
                  </div>
                )}

                {uploadModal.hasExpiry && (
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Expiry Date <span className="font-normal text-slate-400">(optional)</span></label>
                    <input type="date" value={uploadExpiry} onChange={e => setUploadExpiry(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}

                {uploadModal.isOther && (
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                      Document Title
                      {verifyStatus === "verified" && uploadCustomLabel && (
                        <span className="font-normal text-emerald-600 ml-1.5">— AI suggested ✓</span>
                      )}
                      {verifyStatus === "verifying" && (
                        <span className="font-normal text-blue-500 ml-1.5">— AI reading…</span>
                      )}
                    </label>
                    <input
                      value={uploadCustomLabel}
                      onChange={e => setUploadCustomLabel(e.target.value)}
                      placeholder="e.g. Board Resolution — Appointment of Auditor"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-300"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">This title will appear in the document list</p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Notes <span className="font-normal text-slate-400">(optional)</span></label>
                  <input value={uploadNotes} onChange={e => setUploadNotes(e.target.value)}
                    placeholder="e.g. Received from client on 10 Nov"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-300" />
                </div>

                {uploadError && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2.5 rounded-xl border border-red-100">
                    <i className="ti ti-alert-circle" /> {uploadError}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button onClick={closeUploadModal}
                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 font-medium transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!canUpload}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      needsConfirm && confirmStep >= 3
                        ? "bg-slate-800 text-white hover:bg-slate-900 shadow-md"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200"
                    }`}
                  >
                    {uploading ? (
                      <><i className="ti ti-loader-2 animate-spin" /> Uploading…</>
                    ) : verifyStatus === "verifying" ? (
                      <><i className="ti ti-loader-2 animate-spin" /> Verifying…</>
                    ) : (
                      <><i className="ti ti-brand-google-drive" /> Upload to Drive</>
                    )}
                  </button>
                </div>
              </div>

              {/* ── Right: Document Preview ── */}
              {showPreview && previewUrl && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <i className="ti ti-eye text-slate-400" /> Document Preview
                    </p>
                    <p className="text-[10px] text-slate-400">Read carefully before confirming</p>
                  </div>
                  <div className="flex-1 p-3" style={{ minHeight: 500 }}>
                    {uploadFile?.type.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewUrl} alt="Document preview" className="w-full h-full object-contain rounded-xl" />
                    ) : (
                      <iframe
                        src={previewUrl}
                        className="w-full rounded-xl border border-slate-200"
                        style={{ height: 560 }}
                        title="Document preview"
                      />
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ── Share Modal ── */}
      {shareModal && selectedCompany && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShareModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <i className="ti ti-share text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Share Documents</h3>
                  <p className="text-[11px] text-indigo-200 mt-0.5">{selectedCompany.companyName}</p>
                </div>
              </div>
              <button
                onClick={() => setShareModal(false)}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all"
                title="Close"
              >
                <i className="ti ti-x text-white text-base" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <div className="p-6 space-y-5">

                {/* Mode selector */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">What to Share</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => { setShareMode("all"); setSelectedFileIds(new Set()); }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left ${
                        shareMode === "all"
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${shareMode === "all" ? "bg-indigo-100" : "bg-slate-100"}`}>
                        <i className={`ti ti-files text-xl ${shareMode === "all" ? "text-indigo-600" : "text-slate-400"}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${shareMode === "all" ? "text-indigo-700" : "text-slate-700"}`}>All Documents</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{files.length} documents</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setShareMode("selected")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left ${
                        shareMode === "selected"
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${shareMode === "selected" ? "bg-indigo-100" : "bg-slate-100"}`}>
                        <i className={`ti ti-checklist text-xl ${shareMode === "selected" ? "text-indigo-600" : "text-slate-400"}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${shareMode === "selected" ? "text-indigo-700" : "text-slate-700"}`}>Select Documents</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Pick specific files</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* File picker — shown when "selected" mode */}
                {shareMode === "selected" && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Files</p>
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedFileIds(new Set(files.map(f => f.id)))} className="text-[11px] text-indigo-600 hover:underline">Select all</button>
                        <span className="text-slate-300">·</span>
                        <button onClick={() => setSelectedFileIds(new Set())} className="text-[11px] text-slate-400 hover:underline">Clear</button>
                      </div>
                    </div>
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50">
                      {files.map(f => {
                        const isSelected = selectedFileIds.has(f.id);
                        const icon = f.mimeType === "application/pdf" || f.fileName.endsWith(".pdf") ? "📄"
                          : f.mimeType?.startsWith("image/") ? "🖼️" : "📎";
                        return (
                          <button
                            key={f.id}
                            onClick={() => toggleFileSelect(f.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                              isSelected ? "bg-indigo-50 border border-indigo-200" : "bg-white border border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              isSelected ? "bg-indigo-600 border-indigo-600" : "border-slate-300"
                            }`}>
                              {isSelected && <i className="ti ti-check text-white text-[10px]" />}
                            </div>
                            <span className="text-base flex-shrink-0">{icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-700 truncate">{f.fileName}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {f.customLabel ?? f.docType}{f.financialYear ? ` · FY ${f.financialYear}` : ""}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {selectedFileIds.size > 0 && (
                      <p className="text-[11px] text-indigo-600 font-medium mt-1.5 ml-1">
                        {selectedFileIds.size} file{selectedFileIds.size > 1 ? "s" : ""} selected
                      </p>
                    )}
                  </div>
                )}

                {/* Expiry + Generate */}
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="text-[11px] text-slate-400 mb-1 block font-medium">Link validity</label>
                    <select
                      value={shareExpiry}
                      onChange={e => setShareExpiry(Number(e.target.value))}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-slate-700"
                    >
                      <option value={7}>7 days</option>
                      <option value={15}>15 days</option>
                      <option value={30}>30 days</option>
                      <option value={60}>60 days</option>
                      <option value={90}>90 days</option>
                    </select>
                  </div>
                  <button
                    onClick={createShareLink}
                    disabled={shareLoading || (shareMode === "selected" && selectedFileIds.size === 0)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 shadow-md shadow-indigo-200 transition-all"
                  >
                    {shareLoading ? <i className="ti ti-loader-2 animate-spin" /> : <i className="ti ti-link" />}
                    Generate Link
                  </button>
                </div>

                {/* Newly created link */}
                {shareUrl && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
                      <i className="ti ti-check text-emerald-500" /> Link Ready — Send to client
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-white border border-emerald-200 rounded-lg px-3 py-2 text-slate-600 truncate font-mono">
                        {shareUrl}
                      </code>
                      <button
                        onClick={() => copyShareUrl(shareUrl)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-all flex-shrink-0"
                      >
                        <i className={`ti ${shareCopied === shareUrl ? "ti-check" : "ti-copy"}`} />
                        {shareCopied === shareUrl ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Existing links */}
                {shareLinks.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Previous Links</p>
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {shareLinks.map(link => {
                        const expired = link.expiresAt && new Date(link.expiresAt) < new Date();
                        const isCopied = shareCopied === link.url;
                        return (
                          <div key={link.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${expired ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-slate-200"}`}>
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              link.shareMode === "selected" ? "bg-purple-50" : "bg-indigo-50"
                            }`}>
                              <i className={`ti text-sm ${
                                expired ? "ti-link-off text-slate-400" :
                                link.shareMode === "selected" ? "ti-checklist text-purple-500" : "ti-files text-indigo-500"
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-600 font-mono truncate">{link.url}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold mr-1 ${
                                  link.shareMode === "selected" ? "bg-purple-50 text-purple-600" : "bg-indigo-50 text-indigo-600"
                                }`}>
                                  {link.shareMode === "selected" ? "Selected" : "All docs"}
                                </span>
                                {expired ? "Expired" : `Valid till ${new Date(link.expiresAt!).toLocaleDateString("en-IN")}`}
                              </p>
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0">
                              {!expired && (
                                <button
                                  onClick={() => copyShareUrl(link.url)}
                                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${isCopied ? "text-emerald-600 bg-emerald-50 border border-emerald-200" : "text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100"}`}
                                >
                                  <i className={`ti ${isCopied ? "ti-check" : "ti-copy"} text-xs`} />
                                  {isCopied ? "Copied" : "Copy"}
                                </button>
                              )}
                              <button
                                onClick={() => deleteShareLink(link.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-all"
                                title="Revoke this link — client will no longer be able to open it"
                              >
                                <i className="ti ti-ban text-xs" />
                                Revoke
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <i className="ti ti-shield-check text-slate-300" />
                  Anyone with this link can view and download. Drive URL is never exposed to the client.
                </p>
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
