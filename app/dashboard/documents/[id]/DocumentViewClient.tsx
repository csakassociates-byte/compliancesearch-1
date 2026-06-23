"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface DocDetail {
  id: string; type: string; title: string;
  companyName: string | null; financialYear: string | null;
  meetingDate: string | null; formDataJson: string; createdAt: string;
}

export default function DocumentViewClient({ docId }: { docId: string }) {
  const router = useRouter();
  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/documents/${docId}`)
      .then(r => r.json())
      .then(d => { setDoc(d.document || null); setLoading(false); });
  }, [docId]);

  async function handleDelete() {
    if (!confirm('Delete this document permanently?')) return;
    setDeleting(true);
    await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
    router.push('/dashboard/documents');
  }

  function handleReOpen() {
    if (!doc) return;
    // Annual filing uses ?load=<id> — no sessionStorage needed
    if (doc.type === 'annual_filing') {
      router.push(`/tools/documents/annual-filing?load=${doc.id}`);
      return;
    }
    // Other tools restore via sessionStorage
    sessionStorage.setItem('csi_restore_doc', doc.formDataJson);
    sessionStorage.setItem('csi_restore_doc_id', doc.id);
    const path = doc.type === 'agm_minutes'
      ? '/tools/documents/minutes/agm'
      : doc.type === 'board_minutes'
      ? '/tools/documents/minutes/board'
      : doc.type === 'bank_resolution'
      ? '/tools/documents/bank-resolution'
      : doc.type === 'share_certificate'
      ? '/tools/documents/share-certificate'
      : '/tools/documents/minutes/board';
    router.push(`${path}?restore=1`);
  }

  const typeLabel: Record<string, string> = { agm_minutes: "AGM Minutes", board_minutes: "Board Minutes", annual_filing: "Annual Filing" };
  const typeIcon: Record<string, string> = { agm_minutes: "🏛️", board_minutes: "📋", annual_filing: "📑" };

  if (loading) return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-400">Loading document...</p>
    </main>
  );

  if (!doc) return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3">😕</div>
        <p className="text-slate-600 font-semibold">Document not found</p>
        <Link href="/dashboard/documents" className="text-blue-600 text-sm mt-2 inline-block hover:underline">← Back to Documents</Link>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard/documents" className="text-slate-400 hover:text-slate-600 text-sm">← My Documents</Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{typeIcon[doc.type] || '📄'}</div>
              <div className="flex-1">
                <h1 className="text-xl font-extrabold text-slate-900">{doc.title}</h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap text-sm text-slate-500">
                  <span>{typeLabel[doc.type] || doc.type}</span>
                  {doc.companyName && <span>• {doc.companyName}</span>}
                  {doc.financialYear && <span>• FY {doc.financialYear}</span>}
                  {doc.meetingDate && <span>• {doc.meetingDate}</span>}
                  <span>• Saved {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <p className="text-sm text-slate-500 mb-5">
              Click <strong>Re-open in Tool</strong> to load this document back into the{" "}
              {doc.type === 'annual_filing' ? 'Annual Filing tool' : 'document generator'} — all fields will be pre-filled. You can then edit and regenerate.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleReOpen}
                className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-sm">
                🔄 Re-open in Tool →
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="py-3 px-5 border border-red-200 text-red-500 hover:bg-red-50 font-semibold rounded-xl transition-colors text-sm disabled:opacity-50">
                {deleting ? 'Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
