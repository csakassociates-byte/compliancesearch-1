"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

type PostStatus = {
  id: string;
  slug: string;
  title: string;
  status: string;
  rejectionNote: string | null;
  adminNotes: string | null;
  content: string;
  excerpt: string;
  views: number;
  publishedAt: string | null;
  createdAt: string;
  category: string;
  _count: { comments: number; likes: number };
};

const STATUS_CONFIG = {
  pending:            { label: "Under Review",      bg: "#fffbeb", color: "#d97706", border: "#fde68a", icon: "⏳" },
  approved:           { label: "Published",          bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", icon: "✅" },
  rejected:           { label: "Not Approved",       bg: "#fef2f2", color: "#dc2626", border: "#fecaca", icon: "❌" },
  revision_requested: { label: "Changes Requested",  bg: "#fff7ed", color: "#ea580c", border: "#fed7aa", icon: "📝" },
};

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function BlogStatusPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PostStatus[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Resubmit state
  const [editingPost, setEditingPost] = useState<PostStatus | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editExcerpt, setEditExcerpt] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [resubmitLoading, setResubmitLoading] = useState(false);
  const [resubmitDone, setResubmitDone] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setEditingPost(null);
    const res = await fetch("/api/blog/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query.trim() }),
    });
    const data = await res.json();
    setResults(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const startEdit = (post: PostStatus) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditExcerpt(post.excerpt);
    setEditEmail("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResubmit = async () => {
    if (!editingPost || !editEmail.trim() || !editTitle.trim() || !editContent.trim() || !editExcerpt.trim()) return;
    setResubmitLoading(true);
    const res = await fetch(`/api/blog/${editingPost.slug}/resubmit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorEmail: editEmail.trim(),
        title: editTitle.trim(),
        content: editContent.trim(),
        excerpt: editExcerpt.trim(),
      }),
    });
    if (res.ok) {
      setResubmitDone(prev => new Set([...prev, editingPost.id]));
      // Update local results
      setResults(prev => prev
        ? prev.map(p => p.id === editingPost.id
            ? { ...p, title: editTitle.trim(), content: editContent.trim(), excerpt: editExcerpt.trim(), status: "pending", adminNotes: null }
            : p)
        : prev
      );
      setEditingPost(null);
    } else {
      const err = await res.json();
      alert(err.error || "Something went wrong. Please check your email and try again.");
    }
    setResubmitLoading(false);
  };

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <div className="max-w-2xl mx-auto w-full px-4 py-12 flex-1">
        <Link href="/blog" className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-8">
          ← Back to Blog
        </Link>

        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Track Your Article</h1>
        <p className="text-slate-500 mb-10">
          Enter your email or phone number to see the status of your submitted articles.
        </p>

        {/* Search */}
        <div className="flex gap-3 mb-10">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Enter your email or phone number..."
            className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button onClick={handleSearch} disabled={loading || !query.trim()}
            className="px-6 py-3 rounded-xl font-bold text-white disabled:opacity-50 transition hover:scale-105 shrink-0"
            style={{ background: "#1d4ed8" }}>
            {loading ? "..." : "Search"}
          </button>
        </div>

        {/* Edit & Resubmit Form */}
        {editingPost && (
          <div className="mb-10 rounded-2xl border-2 border-orange-200 bg-orange-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-orange-900 text-lg">✏️ Edit & Resubmit Article</h2>
              <button onClick={() => setEditingPost(null)}
                className="text-slate-400 hover:text-slate-600 font-semibold text-xl leading-none">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Title *</label>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Short Summary / Excerpt *</label>
                <textarea value={editExcerpt} onChange={e => setEditExcerpt(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Article Content *</label>
                <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                  rows={14}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 resize-y font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Your Email (for verification) *</label>
                <input value={editEmail} onChange={e => setEditEmail(e.target.value)}
                  type="email" placeholder="Enter the email you used when submitting..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={handleResubmit}
                disabled={resubmitLoading || !editEmail.trim() || !editTitle.trim() || !editContent.trim() || !editExcerpt.trim()}
                className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-50 transition"
                style={{ background: "#ea580c" }}>
                {resubmitLoading ? "Submitting..." : "Submit for Review →"}
              </button>
              <button onClick={() => setEditingPost(null)}
                className="px-6 py-3 rounded-xl font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {searched && !loading && results !== null && (
          <>
            {results.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">No articles found</h3>
                <p className="text-slate-400 text-sm mb-6">No articles submitted with this email or phone.</p>
                <Link href="/blog/submit"
                  className="font-bold text-white px-6 py-3 rounded-xl inline-block"
                  style={{ background: "#1d4ed8" }}>
                  Submit an Article →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-400 mb-4">
                  {results.length} article{results.length > 1 ? "s" : ""} found
                </p>
                {results.map(post => {
                  const s = STATUS_CONFIG[post.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                  const wasResubmitted = resubmitDone.has(post.id);
                  return (
                    <div key={post.id} className="rounded-2xl border p-5"
                      style={{ background: s.bg, borderColor: s.border }}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="font-bold text-slate-900 text-base leading-snug">{post.title}</h3>
                        <span className="shrink-0 text-sm font-bold px-3 py-1 rounded-full"
                          style={{ background: s.color + "20", color: s.color }}>
                          {s.icon} {s.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-3">
                        <span>📅 Submitted: {fmtDate(post.createdAt)}</span>
                        {post.publishedAt && <span>🚀 Published: {fmtDate(post.publishedAt)}</span>}
                        <span className="capitalize">🏷 {post.category.replace("_", " ")}</span>
                      </div>

                      {post.status === "approved" && (
                        <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                          <span>👁 {post.views} views</span>
                          <span>❤️ {post._count.likes} likes</span>
                          <span>💬 {post._count.comments} comments</span>
                        </div>
                      )}

                      {post.status === "rejected" && post.rejectionNote && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
                          <p className="text-xs font-semibold text-red-600 mb-1">Reason:</p>
                          <p className="text-sm text-red-700">{post.rejectionNote}</p>
                        </div>
                      )}

                      {post.status === "revision_requested" && post.adminNotes && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4">
                          <p className="text-xs font-semibold text-orange-700 mb-1">📋 Changes requested by our editor:</p>
                          <p className="text-sm text-orange-800 whitespace-pre-wrap">{post.adminNotes}</p>
                        </div>
                      )}

                      {post.status === "pending" && (
                        <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                          ⏳ Our team is reviewing your article. This usually takes 2-3 business days.
                        </p>
                      )}

                      {wasResubmitted && (
                        <p className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg mb-3">
                          ✅ Your revised article has been submitted for review!
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3 mt-3">
                        {post.status === "approved" && (
                          <Link href={`/blog/${post.slug}`}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:underline">
                            Read Article →
                          </Link>
                        )}
                        {post.status === "revision_requested" && !wasResubmitted && (
                          <button onClick={() => startEdit(post)}
                            className="text-sm font-bold px-4 py-2 rounded-xl text-white transition hover:scale-105"
                            style={{ background: "#ea580c" }}>
                            ✏️ Edit & Resubmit
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <footer className="border-t border-slate-200 py-6 px-4">
        <div className="max-w-6xl mx-auto text-center text-sm text-slate-400">
          © {new Date().getFullYear()} ComplianceSearch.in
        </div>
      </footer>
    </main>
  );
}
