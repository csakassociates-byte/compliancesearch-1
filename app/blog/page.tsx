"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string;
  authorName: string;
  views: number;
  publishedAt: string;
  createdAt: string;
  _count: { comments: number; likes: number };
};

const BLOG_CATEGORIES = [
  { key: "all",       label: "All Topics" },
  { key: "gst",       label: "GST" },
  { key: "income_tax",label: "Income Tax" },
  { key: "labour_law",label: "Labour Law" },
  { key: "mca_roc",   label: "MCA / ROC" },
  { key: "fema",      label: "FEMA" },
  { key: "fssai",     label: "FSSAI" },
  { key: "startup",   label: "Startup" },
  { key: "general",   label: "General" },
];

const CAT_COLORS: Record<string, string> = {
  gst: "#1d4ed8", income_tax: "#7c3aed", labour_law: "#d97706",
  mca_roc: "#0891b2", fema: "#0891b2", fssai: "#16a34a",
  startup: "#db2777", general: "#64748b",
};

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function readingTime(excerpt: string) {
  const words = excerpt.trim().split(/\s+/).length * 8; // estimate from excerpt
  return `${Math.max(3, Math.ceil(words / 200))} min read`;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    const cat = activeCategory === "all" ? "" : activeCategory;
    fetch(`/api/blog?category=${cat}&page=${page}`)
      .then(r => r.json())
      .then(d => {
        setPosts(d.posts || []);
        setTotal(d.total || 0);
        setPages(d.pages || 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeCategory, page]);

  const handleCatChange = (cat: string) => {
    setActiveCategory(cat);
    setPage(1);
  };

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero */}
      <section style={{ background: "linear-gradient(160deg,#eff6ff 0%,#f0f9ff 50%,#fafafa 100%)" }}
        className="py-14 px-4 text-center">
        <div className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full mb-6 border"
          style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}>
          ✍️ Compliance Knowledge Hub
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
          Stay Ahead on <span style={{ color: "#1d4ed8" }}>Compliance</span>
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto mb-8">
          Expert articles, guides, and updates on Indian business compliance — by CAs, CSs, and professionals.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/blog/submit"
            className="inline-flex items-center gap-2 font-bold text-white px-6 py-3 rounded-xl transition hover:scale-105"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
            ✍️ Write an Article
          </Link>
          <Link href="/blog/status"
            className="inline-flex items-center gap-2 font-semibold text-blue-700 px-6 py-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition">
            Track My Article
          </Link>
        </div>
      </section>

      <div className="max-w-6xl mx-auto w-full px-4 py-10">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {BLOG_CATEGORIES.map(c => (
            <button key={c.key} onClick={() => handleCatChange(c.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                activeCategory === c.key
                  ? "text-white shadow-md scale-105"
                  : "text-slate-500 bg-white border-slate-200 hover:border-slate-300"
              }`}
              style={activeCategory === c.key ? { background: CAT_COLORS[c.key] || "#1d4ed8", borderColor: "transparent" } : {}}>
              {c.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 p-6 animate-pulse">
                <div className="h-4 bg-slate-100 rounded mb-3 w-1/3" />
                <div className="h-6 bg-slate-100 rounded mb-2" />
                <div className="h-4 bg-slate-100 rounded mb-1 w-4/5" />
                <div className="h-4 bg-slate-100 rounded w-3/5" />
              </div>
            ))}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No articles yet</h3>
            <p className="text-slate-400 mb-6">Be the first to share your compliance expertise!</p>
            <Link href="/blog/submit"
              className="inline-flex items-center gap-2 font-bold text-white px-6 py-3 rounded-xl"
              style={{ background: "#1d4ed8" }}>
              Write First Article →
            </Link>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <>
            <p className="text-slate-400 text-sm mb-6">{total} article{total !== 1 ? "s" : ""} found</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => {
                const color = CAT_COLORS[post.category] || "#64748b";
                return (
                  <Link key={post.id} href={`/blog/${post.slug}`}
                    className="group rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col">
                    {/* Color strip */}
                    <div className="h-1.5 w-full" style={{ background: color }} />
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize"
                          style={{ background: color + "15", color }}>
                          {BLOG_CATEGORIES.find(c => c.key === post.category)?.label || post.category}
                        </span>
                      </div>
                      <h2 className="font-bold text-slate-900 text-lg leading-snug mb-2 group-hover:text-blue-700 transition line-clamp-2">
                        {post.title}
                      </h2>
                      <p className="text-slate-500 text-sm leading-relaxed flex-1 line-clamp-3 mb-4">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
                        <span className="font-medium text-slate-600">✍ {post.authorName}</span>
                        <span>{fmtDate(post.publishedAt || post.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span>👁 {post.views}</span>
                        <span>❤️ {post._count.likes}</span>
                        <span>💬 {post._count.comments}</span>
                        <span className="ml-auto">⏱ {readingTime(post.excerpt)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-slate-50">
                  ← Prev
                </button>
                {[...Array(pages)].map((_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)}
                    className={`w-9 h-9 rounded-lg text-sm font-bold ${
                      page === i + 1 ? "bg-blue-600 text-white" : "border hover:bg-slate-50 text-slate-600"
                    }`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                  className="px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-slate-50">
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <footer className="border-t border-slate-200 py-8 px-4 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4 text-sm text-slate-400">
          <span>© {new Date().getFullYear()} ComplianceSearch.in — Powered by <a href="https://geebharat.com" className="text-amber-600 hover:underline">Gee Bharat</a></span>
          <div className="flex gap-4">
            <Link href="/check" className="hover:text-slate-600">Check Compliance</Link>
            <Link href="/calendar" className="hover:text-slate-600">Calendar</Link>
            <Link href="/about" className="hover:text-slate-600">About</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
