"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

type Comment = {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
  replies: Comment[];
};

type Post = {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string;
  authorName: string;
  views: number;
  publishedAt: string;
  createdAt: string;
  comments: Comment[];
  _count: { likes: number };
};

const CAT_COLORS: Record<string, string> = {
  gst: "#1d4ed8", income_tax: "#7c3aed", labour_law: "#d97706",
  mca_roc: "#0891b2", fema: "#0891b2", fssai: "#16a34a",
  startup: "#db2777", general: "#64748b",
};

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function renderContent(content: string) {
  const blocks = content.split(/\n{2,}/);
  return blocks.map((block, i) => {
    const t = block.trim();
    if (!t) return null;

    // ── Horizontal divider ──────────────────────────────────
    if (/^[─━—\-=]{4,}$/.test(t)) {
      return <hr key={i} className="my-10 border-slate-200" />;
    }

    const lines = t.split("\n").map(l => l.trim()).filter(Boolean);

    // ── Bullet list ──────────────────────────────────────────
    const allBullets = lines.length > 0 && lines.every(l => /^[•\-\*▪►]\s/.test(l));
    if (allBullets) {
      return (
        <ul key={i} className="my-5 space-y-2.5 ml-1">
          {lines.map((l, j) => (
            <li key={j} className="flex gap-3 text-slate-700 text-base leading-relaxed">
              <span className="text-blue-500 font-bold mt-0.5 shrink-0">•</span>
              <span className="text-justify">{l.replace(/^[•\-\*▪►]\s*/, "")}</span>
            </li>
          ))}
        </ul>
      );
    }

    // ── Single-line blocks (headings / callout markers) ──────
    if (lines.length === 1) {
      // "What to do:" callout
      if (t.toLowerCase().startsWith("what to do:")) {
        return (
          <div key={i} className="my-5 bg-blue-50 border-l-4 border-blue-400 rounded-r-xl px-4 py-3.5">
            <p className="text-sm text-blue-800 leading-relaxed">
              <strong className="font-bold">✅ What to do:</strong>
              {t.slice("what to do:".length)}
            </p>
          </div>
        );
      }

      // "Real example:" callout
      if (t.toLowerCase().startsWith("real example:")) {
        return (
          <div key={i} className="my-5 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl px-4 py-3.5">
            <p className="text-sm text-amber-800 leading-relaxed">
              <strong className="font-bold">📌 Real example:</strong>
              {t.slice("real example:".length)}
            </p>
          </div>
        );
      }

      // Strong section heading (MISTAKE #N, STEP N, TIP N, etc.)
      if (/^(MISTAKE|STEP|TIP|RULE|POINT|ERROR|MYTH)\s*#?\d/i.test(t) && t.length <= 100) {
        return (
          <h3 key={i} className="text-xl font-extrabold text-slate-900 mt-10 mb-3 leading-snug border-l-4 border-blue-500 pl-4">
            {t}
          </h3>
        );
      }

      // All-caps heading (e.g. "THE BOTTOM LINE")
      if (t === t.toUpperCase() && t.length <= 60 && /[A-Z]/.test(t)) {
        return (
          <h2 key={i} className="text-2xl font-extrabold text-slate-900 mt-12 mb-4 tracking-tight">
            {t}
          </h2>
        );
      }

      // Short line ending with colon = sub-label
      if (t.endsWith(":") && t.length <= 60) {
        return (
          <p key={i} className="font-bold text-slate-800 mt-6 mb-1">{t}</p>
        );
      }
    }

    // ── Multi-line block: check for mixed "What to do" at start ──
    if (lines[0]?.toLowerCase().startsWith("what to do:")) {
      return (
        <div key={i} className="my-5 bg-blue-50 border-l-4 border-blue-400 rounded-r-xl px-4 py-3.5">
          <p className="text-sm text-blue-800 leading-relaxed text-justify">
            <strong className="font-bold">✅ What to do:</strong>{" "}
            {lines[0].slice(lines[0].indexOf(":") + 1).trim()}
            {lines.slice(1).length > 0 && " " + lines.slice(1).join(" ")}
          </p>
        </div>
      );
    }

    // ── Regular paragraph ────────────────────────────────────
    return (
      <p key={i} className="text-slate-700 text-base leading-[1.85] text-justify mb-5">
        {lines.join(" ")}
      </p>
    );
  });
}

function CommentItem({
  comment, slug, onReply,
}: {
  comment: Comment;
  slug: string;
  onReply: (parentId: string, parentName: string) => void;
}) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm">
        {comment.authorName[0].toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="bg-slate-50 rounded-2xl rounded-tl-sm px-4 py-3">
          <span className="font-semibold text-slate-800 text-sm">{comment.authorName}</span>
          <p className="text-slate-700 text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
        </div>
        <div className="flex items-center gap-4 mt-1 px-1">
          <span className="text-xs text-slate-400">{fmtDate(comment.createdAt)}</span>
          <button onClick={() => onReply(comment.id, comment.authorName)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800">
            Reply
          </button>
        </div>
        {comment.replies?.length > 0 && (
          <div className="mt-2 ml-4 space-y-3 border-l-2 border-slate-100 pl-4">
            {comment.replies.map(r => (
              <div key={r.id} className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-600 text-xs">
                  {r.authorName[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="bg-purple-50 rounded-2xl rounded-tl-sm px-4 py-2.5">
                    <span className="font-semibold text-slate-800 text-sm">{r.authorName}</span>
                    <p className="text-slate-700 text-sm mt-0.5 whitespace-pre-wrap">{r.content}</p>
                  </div>
                  <span className="text-xs text-slate-400 px-1">{fmtDate(r.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BlogPostPage() {
  const { slug } = useParams() as { slug: string };
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  // Like state
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [visitorId, setVisitorId] = useState("");

  // Share
  const [copied, setCopied] = useState(false);

  // Comment form
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [commenting, setCommenting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [related, setRelated]   = useState<{slug:string;title:string;category:string;authorName:string;publishedAt:string;createdAt:string}[]>([]);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Get or create a unique visitor ID for this browser
    let vid = "";
    try {
      vid = localStorage.getItem("cs_visitor_id") || "";
      if (!vid) {
        vid = crypto.randomUUID();
        localStorage.setItem("cs_visitor_id", vid);
      }
    } catch (_) {
      vid = Math.random().toString(36).slice(2);
    }
    setVisitorId(vid);

    fetch(`/api/blog/${slug}`)
      .then(r => {
        if (r.status === 404) { setNotFoundFlag(true); return null; }
        return r.json();
      })
      .then(data => {
        if (data) {
          setPost(data);
          setComments(data.comments || []);
          setLikeCount(data._count.likes);
          // Fetch related articles
          fetch(`/api/blog?category=${data.category}&page=1`)
            .then(r => r.json())
            .then(d => {
              const others = (d.posts || []).filter((p: {slug:string}) => p.slug !== slug).slice(0, 3);
              setRelated(others);
            });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Check if this visitor already liked this post
    fetch(`/api/blog/${slug}/like?visitorId=${encodeURIComponent(vid)}`)
      .then(r => r.json())
      .then(d => { setLiked(d.liked); setLikeCount(d.count); });
  }, [slug]);

  const handleLike = async () => {
    if (likeLoading || !visitorId) return;
    setLikeLoading(true);
    const res = await fetch(`/api/blog/${slug}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId }),
    });
    const data = await res.json();
    setLiked(data.liked);
    setLikeCount(data.count);
    setLikeLoading(false);
  };

  const handleReply = (parentId: string, parentName: string) => {
    setReplyTo({ id: parentId, name: parentName });
    setCommentText(`@${parentName} `);
    setTimeout(() => commentRef.current?.focus(), 100);
  };

  const handleComment = async () => {
    if (!commentName.trim() || !commentText.trim()) return;
    setCommenting(true);
    const res = await fetch(`/api/blog/${slug}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorName: commentName.trim(),
        content: commentText.trim(),
        parentId: replyTo?.id || null,
      }),
    });
    if (res.ok) {
      const newComment = await res.json();
      if (replyTo) {
        setComments(prev => prev.map(c =>
          c.id === replyTo.id
            ? { ...c, replies: [...(c.replies || []), newComment] }
            : c
        ));
      } else {
        setComments(prev => [...prev, { ...newComment, replies: [] }]);
      }
      setCommentText("");
      setReplyTo(null);
    }
    setCommenting(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-20 animate-pulse">
          <div className="h-8 bg-slate-100 rounded mb-4 w-3/4" />
          <div className="h-4 bg-slate-100 rounded mb-2" />
          <div className="h-4 bg-slate-100 rounded mb-2 w-4/5" />
        </div>
      </main>
    );
  }

  if (notFoundFlag || !post) {
    return (
      <main className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Article not found</h1>
          <Link href="/blog" className="text-blue-600 hover:underline">← Back to Blog</Link>
        </div>
      </main>
    );
  }

  const color = CAT_COLORS[post.category] || "#64748b";
  const tags = post.tags ? post.tags.split(",").map(t => t.trim()).filter(Boolean) : [];

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <article className="max-w-3xl mx-auto w-full px-4 py-12 flex-1">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-8">
          <Link href="/blog" className="hover:text-blue-600">Blog</Link>
          <span>›</span>
          <span className="capitalize" style={{ color }}>{post.category.replace("_", " ")}</span>
        </div>

        {/* Category + Tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="text-sm font-bold px-3 py-1 rounded-full capitalize"
            style={{ background: color + "15", color }}>
            {post.category.replace("_", " ")}
          </span>
          {tags.map(t => (
            <span key={t} className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
              #{t}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-5">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-8 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm"
              style={{ background: color }}>
              {post.authorName[0].toUpperCase()}
            </div>
            <span className="font-semibold text-slate-700">{post.authorName}</span>
          </div>
          <span>📅 {fmtDate(post.publishedAt || post.createdAt)}</span>
          <span>👁 {post.views} views</span>
          <span>⏱ {Math.max(3, Math.ceil(post.content.trim().split(/\s+/).length / 200))} min read</span>
          <button onClick={handleLike} disabled={likeLoading}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all font-semibold ${
              liked
                ? "bg-red-50 border-red-200 text-red-600"
                : "bg-slate-50 border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-500"
            }`}>
            {liked ? "❤️" : "🤍"} {likeCount}
          </button>
        </div>

        {/* Content */}
        <div className="mb-12">
          {renderContent(post.content)}
        </div>

        {/* Share Section */}
        {(() => {
          const shareUrl = `https://compliancesearch.in/blog/${post.slug}`;
          const shareText = `${post.title}\n\n${post.excerpt}`;
          return (
            <div className="mb-12 p-5 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-200">
              <p className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                Share this article
              </p>
              <div className="flex flex-wrap gap-3">

                {/* WhatsApp */}
                <a href={`https://wa.me/?text=${encodeURIComponent(shareText + "\n\nRead full article: " + shareUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition hover:opacity-90 hover:scale-105 active:scale-95"
                  style={{ background: "#25D366" }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.524 3.656 1.435 5.163L2 22l4.932-1.413A9.944 9.944 0 0 0 12 22c5.523 0 10-4.477 10-10S17.522 2 11.999 2z"/>
                  </svg>
                  WhatsApp
                </a>

                {/* LinkedIn */}
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition hover:opacity-90 hover:scale-105 active:scale-95"
                  style={{ background: "#0A66C2" }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
                  </svg>
                  LinkedIn
                </a>

                {/* Twitter / X */}
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}&hashtags=compliance,india,tax`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-black transition hover:bg-slate-800 hover:scale-105 active:scale-95">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  X (Twitter)
                </a>

                {/* Facebook */}
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition hover:opacity-90 hover:scale-105 active:scale-95"
                  style={{ background: "#1877F2" }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </a>

                {/* Copy Link */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2500);
                    });
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition hover:scale-105 active:scale-95 border ${
                    copied
                      ? "bg-green-50 border-green-300 text-green-700"
                      : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600"
                  }`}>
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                      Copy Link
                    </>
                  )}
                </button>

              </div>
            </div>
          );
        })()}

        {/* Related Articles */}
        {related.length > 0 && (
          <div className="mb-12 pt-10 border-t border-slate-100">
            <h2 className="text-xl font-extrabold text-slate-900 mb-5">📚 Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map(r => (
                <Link key={r.slug} href={`/blog/${r.slug}`}
                  className="group rounded-2xl border border-slate-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full w-fit capitalize"
                    style={{ background: (CAT_COLORS[r.category]||"#64748b")+"18", color: CAT_COLORS[r.category]||"#64748b" }}>
                    {r.category.replace("_"," ")}
                  </span>
                  <p className="font-semibold text-slate-800 text-sm leading-snug group-hover:text-blue-700 transition line-clamp-2">{r.title}</p>
                  <p className="text-xs text-slate-400 mt-auto">✍ {r.authorName}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="border-t border-slate-200 pt-10">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            💬 Comments ({comments.length})
          </h2>

          {/* Comment form */}
          <div className="bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-100">
            {replyTo && (
              <div className="flex items-center gap-2 mb-3 text-sm text-blue-600 font-medium">
                <span>↩ Replying to {replyTo.name}</span>
                <button onClick={() => { setReplyTo(null); setCommentText(""); }}
                  className="text-slate-400 hover:text-slate-600 font-semibold">✕</button>
              </div>
            )}
            <h3 className="font-semibold text-slate-700 mb-3 text-sm">
              {replyTo ? "Write a reply" : "Leave a comment"}
            </h3>
            <input
              value={commentName}
              onChange={e => setCommentName(e.target.value)}
              placeholder="Your name *"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
            />
            <textarea
              ref={commentRef}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Share your thoughts..."
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white resize-none"
            />
            <button onClick={handleComment} disabled={commenting || !commentName.trim() || !commentText.trim()}
              className="px-5 py-2 rounded-xl font-semibold text-sm text-white disabled:opacity-50 transition hover:scale-105"
              style={{ background: "#1d4ed8" }}>
              {commenting ? "Posting..." : replyTo ? "Post Reply" : "Post Comment"}
            </button>
          </div>

          {/* Comments list */}
          {comments.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <div className="text-3xl mb-2">💭</div>
              <p className="text-sm">No comments yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-5">
              {comments.map(c => (
                <CommentItem key={c.id} comment={c} slug={slug} onReply={handleReply} />
              ))}
            </div>
          )}
        </div>
      </article>

      {/* CTA */}
      <div className="border-t border-slate-100 py-10 px-4">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 rounded-2xl p-6"
          style={{ background: "linear-gradient(135deg,#eff6ff,#f0f9ff)", border: "1px solid #bfdbfe" }}>
          <div>
            <h3 className="font-bold text-slate-900 mb-1">Check which compliances apply to your business</h3>
            <p className="text-slate-500 text-sm">Free, instant, 77+ rules covered.</p>
          </div>
          <Link href="/check"
            className="shrink-0 font-bold text-white px-6 py-3 rounded-xl transition hover:scale-105"
            style={{ background: "#1d4ed8" }}>
            Start Check →
          </Link>
        </div>
      </div>

      <footer className="border-t border-slate-200 py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-3 text-sm text-slate-400">
          <span>© {new Date().getFullYear()} ComplianceSearch.in</span>
          <div className="flex gap-4">
            <Link href="/blog" className="hover:text-slate-600">← All Articles</Link>
            <Link href="/blog/submit" className="hover:text-slate-600">Write an Article</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
