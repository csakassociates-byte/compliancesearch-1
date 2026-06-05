"use client";
import { useState } from "react";
import Link from "next/link";
import { Shield, Check, X, Trash2, ExternalLink, RefreshCw, Edit3, FileText } from "lucide-react";

type Post = {
  id: string; slug: string; title: string; category: string;
  authorName: string; authorEmail: string; authorPhone: string;
  status: string; rejectionNote: string | null; adminNotes: string | null;
  views: number; publishedAt: string | null; createdAt: string;
  _count: { comments: number; likes: number };
};

type FullPost = {
  id: string; slug: string; title: string; category: string; tags: string;
  authorName: string; content: string; excerpt: string;
  status: string; views: number; publishedAt: string | null; createdAt: string;
};

const STATUS_TABS = ["all", "pending", "revision_requested", "approved", "rejected"] as const;
type TabType = typeof STATUS_TABS[number];

const TAB_LABELS: Record<TabType, string> = {
  all: "Total", pending: "Pending", revision_requested: "Revision",
  approved: "Approved", rejected: "Rejected",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  revision_requested: "bg-orange-100 text-orange-700",
};

const CAT_COLORS: Record<string, string> = {
  gst: "#1d4ed8", income_tax: "#7c3aed", labour_law: "#d97706",
  mca_roc: "#0891b2", fema: "#0891b2", fssai: "#16a34a",
  startup: "#db2777", general: "#64748b",
};

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminBlogClient({ posts: initialPosts }: { posts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [loading, setLoading] = useState<string | null>(null);

  // Reject modal
  const [rejectModal, setRejectModal] = useState<{ id: string; title: string } | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  // Revision modal
  const [revisionModal, setRevisionModal] = useState<{ id: string; title: string } | null>(null);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [revisionLoading, setRevisionLoading] = useState(false);

  // Preview modal
  const [previewPost, setPreviewPost] = useState<FullPost | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const filtered = posts.filter(p => activeTab === "all" || p.status === activeTab);

  const counts: Record<TabType, number> = {
    all: posts.length,
    pending: posts.filter(p => p.status === "pending").length,
    revision_requested: posts.filter(p => p.status === "revision_requested").length,
    approved: posts.filter(p => p.status === "approved").length,
    rejected: posts.filter(p => p.status === "rejected").length,
  };

  const doAction = async (id: string, action: string, extra?: Record<string, string | undefined>) => {
    setLoading(id);
    const res = await fetch(`/api/admin/blog/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
    }
    setLoading(null);
  };

  const doDelete = async (id: string) => {
    if (!confirm("Delete this post permanently?")) return;
    setLoading(id);
    await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    setPosts(prev => prev.filter(p => p.id !== id));
    setLoading(null);
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    await doAction(rejectModal.id, "reject", {
      rejectionNote: rejectNote || "Does not meet content guidelines",
    });
    setRejectModal(null);
    setRejectNote("");
  };

  const handleRequestRevision = async () => {
    if (!revisionModal || !revisionNotes.trim()) return;
    setRevisionLoading(true);
    await doAction(revisionModal.id, "request_revision", { adminNotes: revisionNotes.trim() });
    setRevisionModal(null);
    setRevisionNotes("");
    setRevisionLoading(false);
  };

  const handlePreview = async (post: Post) => {
    setPreviewLoading(true);
    setPreviewPost(null);
    const res = await fetch(`/api/admin/blog/${post.id}`);
    if (res.ok) {
      const full = await res.json();
      setPreviewPost(full);
    }
    setPreviewLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-900">Blog Management</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/dashboard"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border hover:bg-slate-50">
            ← Rules Dashboard
          </Link>
          <Link href="/admin/calendar"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border hover:bg-slate-50">
            📅 Calendar
          </Link>
          <Link href="/blog" target="_blank"
            className="text-sm font-medium text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 flex items-center gap-1">
            <ExternalLink className="w-3.5 h-3.5" /> View Blog
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats tabs */}
        <div className="grid grid-cols-5 gap-3 mb-8">
          {STATUS_TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`p-4 rounded-2xl border-2 text-center transition ${
                activeTab === tab
                  ? "border-blue-400 bg-blue-50 shadow"
                  : "border-transparent bg-white hover:border-slate-200"
              }`}>
              <div className="text-2xl font-extrabold text-slate-900">{counts[tab]}</div>
              <div className="text-sm text-slate-500 mt-0.5">{TAB_LABELS[tab]}</div>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Article</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Author</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Stats</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">No posts found</td>
                  </tr>
                )}
                {filtered.map(post => (
                  <tr key={post.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-semibold text-slate-900 leading-snug line-clamp-2">{post.title}</p>
                      <span className="text-xs text-slate-400 capitalize">{post.category.replace("_", " ")}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700">{post.authorName}</p>
                      <p className="text-xs text-slate-400">{post.authorEmail}</p>
                      <p className="text-xs text-slate-400">{post.authorPhone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        STATUS_COLORS[post.status] || "bg-slate-100 text-slate-600"
                      }`}>
                        {post.status === "revision_requested" ? "Revision" : post.status}
                      </span>
                      {post.rejectionNote && (
                        <p className="text-xs text-red-500 mt-1 max-w-[160px] line-clamp-2">{post.rejectionNote}</p>
                      )}
                      {post.adminNotes && post.status === "revision_requested" && (
                        <p className="text-xs text-orange-600 mt-1 max-w-[160px] line-clamp-2">
                          📝 {post.adminNotes}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <div>👁 {post.views}</div>
                      <div>❤️ {post._count.likes}</div>
                      <div>💬 {post._count.comments}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(post.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Preview — always available */}
                        <button onClick={() => handlePreview(post)} title="Preview Article"
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition">
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* Approve */}
                        {post.status !== "approved" && (
                          <button onClick={() => doAction(post.id, "approve")}
                            disabled={loading === post.id} title="Approve"
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition">
                            <Check className="w-4 h-4" />
                          </button>
                        )}

                        {/* Request Revision */}
                        {(post.status === "pending" || post.status === "revision_requested") && (
                          <button onClick={() => {
                            setRevisionModal({ id: post.id, title: post.title });
                            setRevisionNotes(post.adminNotes || "");
                          }}
                            title="Request Revision" disabled={loading === post.id}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 transition">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Reject */}
                        {post.status !== "rejected" && (
                          <button onClick={() => {
                            setRejectModal({ id: post.id, title: post.title });
                            setRejectNote("");
                          }}
                            title="Reject" disabled={loading === post.id}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition">
                            <X className="w-4 h-4" />
                          </button>
                        )}

                        {/* View live */}
                        {post.status === "approved" && (
                          <Link href={`/blog/${post.slug}`} target="_blank" title="View Live"
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}

                        {/* Move to Pending */}
                        {post.status === "rejected" && (
                          <button onClick={() => doAction(post.id, "pending")}
                            disabled={loading === post.id} title="Move to Pending"
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 transition">
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete */}
                        <button onClick={() => doDelete(post.id)} disabled={loading === post.id}
                          title="Delete"
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Reject Modal ── */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-slate-900 mb-2">Reject Article</h3>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">&ldquo;{rejectModal.title}&rdquo;</p>
            <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)}
              placeholder="Reason for rejection (shown to author)..."
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 mb-4 resize-none" />
            <div className="flex gap-3">
              <button onClick={handleReject}
                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition">
                Reject
              </button>
              <button onClick={() => setRejectModal(null)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Request Revision Modal ── */}
      {revisionModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-slate-900 mb-1">Request Revision</h3>
            <p className="text-sm text-slate-500 mb-1 line-clamp-2">&ldquo;{revisionModal.title}&rdquo;</p>
            <p className="text-xs text-slate-400 mb-3">Write specific changes needed — the author will see this before editing.</p>
            <textarea value={revisionNotes} onChange={e => setRevisionNotes(e.target.value)}
              placeholder="e.g. Please expand section 2 with practical examples, correct the GST rates mentioned, and shorten the introduction..."
              rows={5}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 mb-4 resize-none" />
            <div className="flex gap-3">
              <button onClick={handleRequestRevision}
                disabled={revisionLoading || !revisionNotes.trim()}
                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition">
                {revisionLoading ? "Sending..." : "Send for Revision"}
              </button>
              <button onClick={() => { setRevisionModal(null); setRevisionNotes(""); }}
                className="flex-1 py-2.5 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview Modal ── */}
      {(previewLoading || previewPost) && (
        <div
          className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 px-4 py-8 overflow-y-auto"
          onClick={() => { if (!previewLoading) setPreviewPost(null); }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl my-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Article Preview
              </h3>
              {!previewLoading && (
                <button onClick={() => setPreviewPost(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-lg">
                  ✕
                </button>
              )}
            </div>

            {/* Loading state */}
            {previewLoading && (
              <div className="flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            )}

            {/* Content */}
            {!previewLoading && previewPost && (
              <div className="px-6 py-6">
                {/* Category chip */}
                <div className="mb-4">
                  <span className="text-xs font-bold px-3 py-1 rounded-full capitalize"
                    style={{
                      background: (CAT_COLORS[previewPost.category] || "#64748b") + "20",
                      color: CAT_COLORS[previewPost.category] || "#64748b",
                    }}>
                    {previewPost.category.replace("_", " ")}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-4">
                  {previewPost.title}
                </h2>

                {/* Author + stats */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-6 pb-5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs"
                      style={{ background: CAT_COLORS[previewPost.category] || "#64748b" }}>
                      {previewPost.authorName[0].toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-700">{previewPost.authorName}</span>
                  </div>
                  <span>👁 {previewPost.views} views</span>
                </div>

                {/* Excerpt */}
                <div className="bg-slate-50 rounded-xl px-4 py-3 mb-6 border-l-4 border-blue-300">
                  <p className="text-sm text-slate-600 italic">{previewPost.excerpt}</p>
                </div>

                {/* Full content */}
                <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {previewPost.content}
                </div>

                {/* Tags */}
                {previewPost.tags && previewPost.tags.trim() && (
                  <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-slate-100">
                    {previewPost.tags.split(",").map(t => t.trim()).filter(Boolean).map(t => (
                      <span key={t} className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            {!previewLoading && previewPost && (
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
                <button onClick={() => setPreviewPost(null)}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition">
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
