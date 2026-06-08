"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Doc {
  id: string; type: string; title: string;
  companyName: string | null; financialYear: string | null;
  meetingDate: string | null; createdAt: string;
}

export default function DashboardClient({ userName }: { userName: string }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/documents')
      .then(r => r.json())
      .then(d => { setDocs(d.documents || []); setLoading(false); });
  }, []);

  const tools = [
    { icon: "🏛️", title: "AGM Minutes", desc: "Annual General Meeting minutes", href: "/tools/documents/minutes/agm", color: "from-purple-50 to-purple-100 border-purple-200" },
    { icon: "📋", title: "Board Minutes", desc: "Board meeting minutes + CTC", href: "/tools/documents/minutes/board", color: "from-blue-50 to-blue-100 border-blue-200" },
    { icon: "🏦", title: "Bank Resolution", desc: "Bank account opening resolution", href: "/tools/documents/bank-resolution", color: "from-emerald-50 to-emerald-100 border-emerald-200" },
    { icon: "⚖️", title: "Compliance Check", desc: "Check applicable compliance rules", href: "/check", color: "from-amber-50 to-amber-100 border-amber-200" },
  ];

  const typeLabel: Record<string, string> = {
    agm_minutes: "AGM Minutes",
    board_minutes: "Board Minutes",
  };
  const typeIcon: Record<string, string> = {
    agm_minutes: "🏛️",
    board_minutes: "📋",
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900">
            Welcome back, {userName.split(" ")[0]}! 👋
          </h1>
          <p className="text-slate-500 mt-1">Your compliance workspace — generate, save, and access all your documents.</p>
        </div>

        {/* Quick Tools */}
        <section className="mb-10">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Quick Tools</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {tools.map(t => (
              <Link key={t.href} href={t.href}
                className={`rounded-2xl border-2 bg-gradient-to-br ${t.color} p-5 flex flex-col gap-3 hover:shadow-lg transition-all hover:-translate-y-0.5 group`}>
                <div className="text-3xl">{t.icon}</div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{t.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Documents */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">My Documents</h2>
            {docs.length > 5 && (
              <Link href="/dashboard/documents" className="text-xs text-blue-600 hover:underline font-semibold">
                View all ({docs.length}) →
              </Link>
            )}
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <div className="text-2xl mb-2">⏳</div>
              Loading your documents...
            </div>
          ) : docs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="text-4xl mb-3">📄</div>
              <h3 className="font-bold text-slate-700 mb-1">No saved documents yet</h3>
              <p className="text-sm text-slate-400 mb-4">Generate a minutes document and click &quot;Save to My Documents&quot;</p>
              <Link href="/tools/documents/minutes/agm"
                className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700">
                Generate AGM Minutes →
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {docs.slice(0, 8).map((doc, i) => (
                <div key={doc.id}
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors ${i !== 0 ? "border-t border-slate-100" : ""}`}>
                  <div className="text-2xl flex-shrink-0">{typeIcon[doc.type] || "📄"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 text-sm truncate">{doc.title}</div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-400">{typeLabel[doc.type] || doc.type}</span>
                      {doc.financialYear && <span className="text-xs text-slate-400">FY {doc.financialYear}</span>}
                      {doc.meetingDate && <span className="text-xs text-slate-400">{doc.meetingDate}</span>}
                      <span className="text-xs text-slate-400">
                        {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/dashboard/documents/${doc.id}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors">
                      Open →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
