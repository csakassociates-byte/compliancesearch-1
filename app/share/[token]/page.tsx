"use client";

import { useEffect, useState } from "react";

interface SharedFile {
  id: string;
  category: string;
  docType: string;
  customLabel: string | null;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  financialYear: string | null;
  expiryDate: string | null;
  notes: string | null;
  createdAt: string;
}

interface ShareData {
  companyName: string;
  label: string | null;
  expiresAt: string | null;
  files: SharedFile[];
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getFileIcon(mimeType: string | null, fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (mimeType === "application/pdf" || ext === "pdf") return "📄";
  if (["jpg","jpeg","png","gif","webp"].includes(ext)) return "🖼️";
  if (["doc","docx"].includes(ext)) return "📝";
  if (["xls","xlsx"].includes(ext)) return "📊";
  return "📎";
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  INCORPORATION:  { bg: "#eff6ff", border: "#3b82f6", text: "#1d4ed8", icon: "🏛️" },
  CERTIFICATES:   { bg: "#f0fdf4", border: "#22c55e", text: "#15803d", icon: "🏅" },
  ANNUAL_FILING:  { bg: "#fefce8", border: "#eab308", text: "#854d0e", icon: "📅" },
  DIRECTORS:      { bg: "#fdf4ff", border: "#a855f7", text: "#7e22ce", icon: "👤" },
  RESOLUTIONS:    { bg: "#fff7ed", border: "#f97316", text: "#9a3412", icon: "⚖️" },
  TAX:            { bg: "#f0f9ff", border: "#0ea5e9", text: "#0369a1", icon: "🧾" },
};

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken]       = useState<string>("");
  const [data, setData]         = useState<ShareData | null>(null);
  const [error, setError]       = useState<string>("");
  const [loading, setLoading]   = useState(true);
  const [viewing, setViewing]   = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/share/${token}/files`)
      .then(r => r.ok ? r.json() : r.json().then(e => { throw new Error(e.error); }))
      .then(d => setData(d))
      .catch(e => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [token]);

  // Group files by category directly from data — avoids key mismatch
  const filesByCategory = (() => {
    const files = data?.files ?? [];
    const catMap = new Map<string, { label: string; icon: string; docs: Map<string, { label: string; files: SharedFile[] }> }>();
    const CAT_META: Record<string, { label: string; icon: string }> = {
      INCORPORATION:  { label: "Incorporation",          icon: "🏛️" },
      CERTIFICATES:   { label: "Certificates",           icon: "🏅" },
      ANNUAL_FILING:  { label: "Annual Filings",         icon: "📅" },
      DIRECTORS:      { label: "Director Documents",     icon: "👤" },
      RESOLUTIONS:    { label: "Resolutions & Minutes",  icon: "⚖️" },
      TAX:            { label: "Tax Filings",            icon: "🧾" },
    };
    const DOC_LABELS: Record<string, string> = {
      COI:"Certificate of Incorporation",MOA:"MOA (Memorandum of Association)",AOA:"AOA (Articles of Association)",
      PAN:"PAN Card",TAN:"TAN Card",SHOP_ACT:"Shop & Establishment",GST_CERT:"GST Certificate",
      MSME_CERT:"MSME Certificate",IEC_CERT:"IEC Certificate",TRADE_LICENSE:"Trade License",
      FSSAI:"FSSAI License",DRUG_LICENSE:"Drug License",AOC4:"AOC-4",MGT7:"MGT-7 / 7A",
      BOARD_REPORT:"Board Report",AUDITOR_REPORT:"Auditor's Report",FINANCIAL_STATEMENTS:"Financial Statements",
      DIR3_KYC:"DIR-3 KYC",DIR12:"DIR-12",DIN_LETTER:"DIN Allotment Letter",
      BOARD_MINUTES:"Board Meeting Minutes",AGM_MINUTES:"AGM Minutes",EGM_MINUTES:"EGM Minutes",
      SHAREHOLDER_AGREEMENT:"Shareholder Agreement",ITR:"Income Tax Return (ITR)",
      TAX_AUDIT_3CD:"Tax Audit Report (3CD)",TDS_RETURNS:"TDS Returns",GST_ANNUAL:"GST Annual Return (GSTR-9)",
    };
    files.forEach(f => {
      const catKey = f.category;
      if (!catMap.has(catKey)) {
        catMap.set(catKey, { label: CAT_META[catKey]?.label ?? catKey, icon: CAT_META[catKey]?.icon ?? "📁", docs: new Map() });
      }
      const cat = catMap.get(catKey)!;
      const docKey = f.docType;
      const docLabel = f.customLabel ?? DOC_LABELS[docKey] ?? docKey;
      if (!cat.docs.has(docKey)) cat.docs.set(docKey, { label: docLabel, files: [] });
      cat.docs.get(docKey)!.files.push(f);
    });
    return Array.from(catMap.entries()).map(([key, v]) => ({
      key, label: v.label, icon: v.icon,
      docs: Array.from(v.docs.entries()).map(([dk, dv]) => ({ key: dk, label: dv.label, files: dv.files })),
    }));
  })();

  const totalFiles = data?.files.length ?? 0;

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, border: "3px solid #e2e8f0", borderTop: "3px solid #3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "#64748b", fontFamily: "Inter, sans-serif" }}>Loading documents…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <div style={{ textAlign: "center", padding: 40, background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontFamily: "Inter, sans-serif", color: "#1e293b", marginBottom: 8 }}>Link Unavailable</h2>
        <p style={{ color: "#64748b", fontFamily: "Inter, sans-serif" }}>{error}</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Inter, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)", padding: "24px 24px 24px", color: "#fff" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, background: "rgba(255,255,255,0.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🏢</div>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.55)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Company Documents</p>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>{data?.companyName}</h1>
              </div>
            </div>
            {/* Close tab button */}
            <button
              onClick={() => window.close()}
              style={{
                background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 8, padding: "6px 12px", color: "rgba(255,255,255,0.75)",
                fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                flexShrink: 0, fontFamily: "Inter, sans-serif",
              }}
            >
              ✕ Close
            </button>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
            <span style={{ background: "rgba(255,255,255,0.12)", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "rgba(255,255,255,0.85)" }}>
              📁 {totalFiles} document{totalFiles !== 1 ? "s" : ""}
            </span>
            {data?.expiresAt && (
              <span style={{ background: "rgba(255,255,255,0.12)", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "rgba(255,255,255,0.85)" }}>
                🕐 Valid till {formatDate(data.expiresAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
        {totalFiles === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 16, color: "#94a3b8" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
            <p style={{ fontSize: 16 }}>No documents have been shared yet.</p>
          </div>
        ) : (
          filesByCategory.map(cat => {
            const colors = CATEGORY_COLORS[cat.key] ?? { bg: "#f8fafc", border: "#94a3b8", text: "#475569", icon: "📁" };
            return (
              <div key={cat.key} style={{ marginBottom: 28 }}>
                {/* Category header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 18 }}>{cat.icon}</span>
                  <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{cat.label}</h2>
                  <div style={{ flex: 1, height: 1, background: "#e2e8f0", marginLeft: 8 }} />
                </div>

                {/* Doc cards */}
                <div style={{ display: "grid", gap: 10 }}>
                  {cat.docs.map(doc => (
                    <div key={doc.key} style={{ background: "#fff", borderRadius: 12, border: `1px solid #e2e8f0`, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                      <div style={{ background: colors.bg, borderBottom: `2px solid ${colors.border}`, padding: "10px 16px" }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: colors.text }}>{doc.label}</span>
                      </div>
                      {doc.files.map((f, i) => (
                        <div key={f.id} style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "12px 16px",
                          borderTop: i > 0 ? "1px solid #f1f5f9" : undefined,
                        }}>
                          <span style={{ fontSize: 24, flexShrink: 0 }}>{getFileIcon(f.mimeType, f.fileName)}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.fileName}</p>
                            <div style={{ display: "flex", gap: 8, marginTop: 2, flexWrap: "wrap" }}>
                              {f.financialYear && <span style={{ fontSize: 11, color: "#64748b", background: "#f1f5f9", borderRadius: 4, padding: "1px 6px" }}>FY {f.financialYear}</span>}
                              {f.expiryDate && <span style={{ fontSize: 11, color: "#dc2626", background: "#fef2f2", borderRadius: 4, padding: "1px 6px" }}>Exp: {formatDate(f.expiryDate)}</span>}
                              {f.fileSize && <span style={{ fontSize: 11, color: "#94a3b8" }}>{formatBytes(f.fileSize)}</span>}
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>{formatDate(f.createdAt)}</span>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            <a
                              href={`/api/share/${token}/file/${f.id}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => setViewing(f.id)}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                                background: "#eff6ff", color: "#2563eb", textDecoration: "none",
                                border: "1px solid #bfdbfe",
                              }}
                            >
                              👁️ View
                            </a>
                            <a
                              href={`/api/share/${token}/file/${f.id}`}
                              download={f.fileName}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                                background: "#f0fdf4", color: "#16a34a", textDecoration: "none",
                                border: "1px solid #bbf7d0",
                              }}
                            >
                              ⬇️ Download
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 40, padding: "20px", color: "#94a3b8", fontSize: 12 }}>
          <p style={{ margin: 0 }}>Shared securely via <strong style={{ color: "#64748b" }}>ComplianceSearch.in</strong></p>
          {data?.expiresAt && <p style={{ margin: "4px 0 0" }}>This link expires on {formatDate(data.expiresAt)}</p>}
        </div>
      </div>
      <style>{`* { box-sizing: border-box; } body { margin: 0; }`}</style>
    </div>
  );
}
