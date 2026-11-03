"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Shield, FileText, Calendar, Mail, Coins, Building2,
  ArrowLeft, LogOut, LayoutDashboard,
} from "lucide-react";

const NAV = [
  { href: "/admin/dashboard",     label: "Rules",          icon: LayoutDashboard, color: "text-pink-300" },
  { href: "/admin/organisations", label: "Organisations",  icon: Building2,       color: "text-indigo-300" },
  { href: "/admin/credits",       label: "Credits",        icon: Coins,           color: "text-emerald-300" },
  { href: "/admin/enquiries",     label: "Enquiries",      icon: Mail,            color: "text-orange-300" },
  { href: "/admin/blog",          label: "Blog",           icon: FileText,        color: "text-blue-300" },
  { href: "/admin/calendar",      label: "Calendar",       icon: Calendar,        color: "text-cyan-300" },
];

export default function AdminSidebar() {
  const path = usePathname();

  return (
    <aside className="fixed top-0 left-0 h-screen w-56 flex flex-col z-50"
      style={{ background: "linear-gradient(180deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)" }}>

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #f472b6, #a855f7)" }}>
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-white text-xs font-bold leading-tight">Compliance</div>
            <div className="text-purple-300 text-[10px] font-medium">Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-purple-400 text-[10px] font-semibold uppercase tracking-widest px-2 mb-2">Menu</p>
        {NAV.map(({ href, label, icon: Icon, color }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-purple-200 hover:bg-white/8 hover:text-white"
              }`}>
              <Icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : color}`} />
              {label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
        <Link href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-purple-300 hover:text-white hover:bg-white/8 transition-all font-medium">
          <ArrowLeft className="w-4 h-4 shrink-0" />
          Back to App
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-purple-300 hover:text-red-300 hover:bg-red-500/10 transition-all font-medium">
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
