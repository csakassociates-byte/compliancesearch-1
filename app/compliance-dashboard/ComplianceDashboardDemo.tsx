"use client";

import Link from "next/link";
import { Lock, CheckCircle, Clock, AlertTriangle, XCircle, TrendingUp, Building2, FileText, Bell } from "lucide-react";

const SAMPLE_COMPANIES = [
  {
    name: "Sharma & Associates Pvt Ltd",
    cin: "U74999MH2018PTC123456",
    type: "Private Limited",
    status: { bs: "filed", aoc4: "filed", mgt7: "pending", dir3: "filed", dpt3: "na", msme: "pending" },
  },
  {
    name: "Gupta Enterprises Pvt Ltd",
    cin: "U52100DL2015PTC287654",
    type: "Private Limited",
    status: { bs: "filed", aoc4: "pending", mgt7: "filed", dir3: "not_filed", dpt3: "na", msme: "filed" },
  },
  {
    name: "Verma Industries Limited",
    cin: "L27100MH2010PLC234567",
    type: "Public Limited",
    status: { bs: "filed", aoc4: "filed", mgt7: "filed", dir3: "filed", dpt3: "filed", msme: "na" },
  },
  {
    name: "Patel Constructions Pvt Ltd",
    cin: "U45200GJ2019PTC345678",
    type: "Private Limited",
    status: { bs: "not_filed", aoc4: "not_filed", mgt7: "not_filed", dir3: "pending", dpt3: "na", msme: "na" },
  },
  {
    name: "Singh Tech Solutions Pvt Ltd",
    cin: "U72200KA2020PTC456789",
    type: "Private Limited",
    status: { bs: "filed", aoc4: "pending", mgt7: "pending", dir3: "filed", dpt3: "na", msme: "pending" },
  },
];

const FIELDS = [
  { key: "bs",    label: "Balance Sheet" },
  { key: "aoc4",  label: "AOC-4" },
  { key: "mgt7",  label: "MGT-7" },
  { key: "dir3",  label: "DIR-3 KYC" },
  { key: "dpt3",  label: "DPT-3" },
  { key: "msme",  label: "MSME Form" },
];

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  filed:     { icon: <CheckCircle className="w-3.5 h-3.5" />, color: "text-emerald-700", bg: "bg-emerald-50",  label: "Filed" },
  pending:   { icon: <Clock       className="w-3.5 h-3.5" />, color: "text-amber-600",   bg: "bg-amber-50",    label: "Pending" },
  not_filed: { icon: <XCircle     className="w-3.5 h-3.5" />, color: "text-red-600",     bg: "bg-red-50",      label: "Not Filed" },
  na:        { icon: <span className="text-[10px] font-bold">N/A</span>, color: "text-slate-400", bg: "bg-slate-50", label: "N/A" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.na;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

const STATS = [
  { label: "Total Companies", value: "12", icon: <Building2 className="w-5 h-5" />, color: "text-blue-700", bg: "bg-blue-50" },
  { label: "Filings Pending", value: "7",  icon: <Clock className="w-5 h-5" />,     color: "text-amber-600", bg: "bg-amber-50" },
  { label: "Docs Generated",  value: "34", icon: <FileText className="w-5 h-5" />,  color: "text-indigo-700", bg: "bg-indigo-50" },
  { label: "Alerts This Month", value: "3", icon: <Bell className="w-5 h-5" />,     color: "text-red-600",  bg: "bg-red-50" },
];

export default function ComplianceDashboardDemo() {
  return (
    <div className="min-h-screen bg-gray-50 relative">

      {/* Page content (blurred) */}
      <div className="blur-[3px] pointer-events-none select-none" aria-hidden>

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Compliance Monitor</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track all client filings in one place · FY 2024–25</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-center">
              <div className="text-lg font-bold text-emerald-700">12</div>
              <div className="text-[10px] text-emerald-600 uppercase tracking-wide">Companies</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-center">
              <div className="text-lg font-bold text-amber-600">7</div>
              <div className="text-[10px] text-amber-600 uppercase tracking-wide">Pending</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center ${s.color}`}>{s.icon}</div>
              <div>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="px-6 pb-8">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700">Client Companies — FY 2024–25</span>
              <span className="text-xs text-gray-400">Showing 5 of 12</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Company</th>
                    {FIELDS.map(f => (
                      <th key={f.key} className="text-center px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{f.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_COMPANIES.map((co, i) => (
                    <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 === 1 ? "bg-gray-50/40" : ""}`}>
                      <td className="px-5 py-3">
                        <div className="font-semibold text-gray-900 text-sm">{co.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{co.cin} · {co.type}</div>
                      </td>
                      {FIELDS.map(f => (
                        <td key={f.key} className="px-3 py-3 text-center">
                          <StatusBadge status={(co.status as Record<string, string>)[f.key]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-8 max-w-md w-full mx-4 text-center">

          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-indigo-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Compliance Dashboard</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Track all your clients' annual filings, ROC compliance, and due dates — in one live dashboard.
            Sign in to see your real data.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6 text-left">
            {[
              { icon: <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />, text: "Live filing status for all clients" },
              { icon: <TrendingUp  className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />,   text: "AOC-4, MGT-7, DIR-3, DPT-3 tracking" },
              { icon: <Bell        className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />,   text: "Due date alerts & reminders" },
              { icon: <FileText    className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />,  text: "One-click document generation" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 bg-gray-50 rounded-xl p-3">
                {item.icon}
                <span className="text-xs text-gray-600 font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/auth/login"
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition text-center"
            >
              Sign In to View Dashboard
            </Link>
            <Link
              href="/auth/register"
              className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition text-center"
            >
              Create Free Account
            </Link>
          </div>

          <p className="text-xs text-gray-400 mt-4">Free to start · No credit card required</p>
        </div>
      </div>
    </div>
  );
}
