"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const CAT_LABEL: Record<string, string> = {
  central_tax: "Central Tax", mca_roc: "MCA / ROC", labor_law: "Labour Law",
  industry_license: "Industry License", environmental: "Environment",
  state_compliance: "State", import_export: "Import/Export",
  msme_startup: "MSME / Startup", financial_sector: "Financial",
  foreign_compliance: "Foreign", digital_compliance: "Digital",
  gst: "GST", income_tax: "Income Tax", labour_law: "Labour Law",
  fema: "FEMA", fssai: "FSSAI", startup: "Startup", general: "General",
};

type SearchResult = {
  rules: { id: string; ruleKey: string; name: string; shortName: string; category: string; priority: string }[];
  posts: { id: string; slug: string; title: string; category: string; authorName: string }[];
};

export default function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router   = useRouter();

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const doSearch = useCallback((q: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (q.length < 2) { setResults(null); setLoading(false); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
      setLoading(false);
    }, 280);
  }, []);

  const go = (url: string) => { router.push(url); onClose(); };

  const total = (results?.rules.length ?? 0) + (results?.posts.length ?? 0);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-start justify-center pt-[12vh] px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); doSearch(e.target.value); }}
            placeholder="Search compliance rules, articles..."
            className="flex-1 text-base text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
          />
          {loading
            ? <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
            : query && (
              <button onClick={() => { setQuery(""); setResults(null); }} className="text-slate-300 hover:text-slate-500 text-lg shrink-0">✕</button>
            )
          }
        </div>

        {/* Body */}
        <div className="max-h-[58vh] overflow-y-auto">
          {!query && (
            <div className="px-5 py-10 text-center text-slate-400 text-sm">
              <div className="text-4xl mb-3">🔍</div>
              <p className="font-medium text-slate-500 mb-1">Search ComplianceSearch.in</p>
              <p>Find compliance rules, articles, due dates and more</p>
            </div>
          )}

          {query.length === 1 && (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">Type at least 2 characters…</div>
          )}

          {results && total === 0 && (
            <div className="px-5 py-10 text-center text-slate-400 text-sm">
              <div className="text-4xl mb-3">😕</div>
              No results for <strong className="text-slate-600">&ldquo;{query}&rdquo;</strong>
            </div>
          )}

          {/* Compliance Rules */}
          {(results?.rules.length ?? 0) > 0 && (
            <div>
              <div className="px-5 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                ⚖️ Compliance Rules
              </div>
              {results!.rules.map(rule => (
                <button key={rule.id} onClick={() => go(`/compliance/${rule.ruleKey}`)}
                  className="w-full px-5 py-3.5 text-left hover:bg-blue-50 border-b border-slate-50 transition-colors flex items-start gap-3 group">
                  <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {rule.priority === "critical" ? "❗" : rule.priority === "high" ? "⚠" : "📋"}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm group-hover:text-blue-700 transition">{rule.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{CAT_LABEL[rule.category] || rule.category}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-300 group-hover:text-blue-400 ml-auto shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>
                </button>
              ))}
            </div>
          )}

          {/* Blog Articles */}
          {(results?.posts.length ?? 0) > 0 && (
            <div>
              <div className="px-5 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                ✍️ Blog Articles
              </div>
              {results!.posts.map(post => (
                <button key={post.id} onClick={() => go(`/blog/${post.slug}`)}
                  className="w-full px-5 py-3.5 text-left hover:bg-blue-50 border-b border-slate-50 transition-colors flex items-start gap-3 group">
                  <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">📄</span>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm group-hover:text-blue-700 transition line-clamp-1">{post.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">By {post.authorName}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-300 group-hover:text-blue-400 ml-auto shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>{results ? `${total} result${total !== 1 ? "s" : ""}` : "Press ESC to close"}</span>
          <span className="hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-slate-200 font-mono">↵</kbd> open</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-slate-200 font-mono">ESC</kbd> close</span>
          </span>
        </div>
      </div>
    </div>
  );
}
