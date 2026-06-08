import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login?callbackUrl=/dashboard");

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900">Welcome back, {session.user?.name || session.user?.email}! 👋</h1>
          <p className="text-slate-500 mt-1">Your compliance dashboard — company history coming soon.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: "🏛️", title: "AGM Minutes", desc: "Generate AGM minutes", href: "/tools/documents/minutes/agm", color: "bg-purple-50 border-purple-200" },
            { icon: "📋", title: "Board Minutes", desc: "Generate board meeting minutes", href: "/tools/documents/minutes/board", color: "bg-blue-50 border-blue-200" },
            { icon: "🏦", title: "Bank Resolution", desc: "Bank account opening resolution", href: "/tools/documents/bank-resolution", color: "bg-emerald-50 border-emerald-200" },
            { icon: "⚖️", title: "Compliance Check", desc: "Check compliance status", href: "/check", color: "bg-amber-50 border-amber-200" },
          ].map(t => (
            <Link key={t.href} href={t.href}
              className={`rounded-2xl border-2 ${t.color} p-5 flex items-start gap-4 hover:shadow-lg transition-all hover:-translate-y-0.5`}>
              <div className="text-3xl">{t.icon}</div>
              <div>
                <h3 className="font-bold text-slate-800">{t.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
