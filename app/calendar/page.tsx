"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  authority: string;
  recurrence: string;
  dueDay: number | null;
  dueMonth: number | null;
  specificDate: string | null;
  penalty: string | null;
  link: string | null;
};

const CATEGORIES = [
  { key: "all",             label: "All",             color: "#64748b", bg: "#f8fafc" },
  { key: "central_tax",     label: "GST / Income Tax", color: "#1d4ed8", bg: "#eff6ff" },
  { key: "mca_roc",         label: "MCA / ROC",        color: "#7c3aed", bg: "#f5f3ff" },
  { key: "labor_law",       label: "Labour Law",       color: "#d97706", bg: "#fffbeb" },
  { key: "import_export",   label: "FEMA / Import",    color: "#0891b2", bg: "#ecfeff" },
  { key: "msme_startup",    label: "MSME / Startup",   color: "#16a34a", bg: "#f0fdf4" },
  { key: "environmental",   label: "Environment",      color: "#15803d", bg: "#f0fdf4" },
  { key: "other",           label: "Other",            color: "#64748b", bg: "#f8fafc" },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getCatStyle(category: string) {
  return CATEGORIES.find(c => c.key === category) || CATEGORIES[CATEGORIES.length - 1];
}

function getDueDate(event: CalendarEvent, month: number, year: number): Date | null {
  if (event.recurrence === "one-time" && event.specificDate) {
    return new Date(event.specificDate);
  }
  if (event.recurrence === "monthly" && event.dueDay) {
    return new Date(year, month, event.dueDay);
  }
  if (event.recurrence === "quarterly" && event.dueDay) {
    // Q1 Apr, Q2 Jul, Q3 Oct, Q4 Jan
    const qMonths = [3, 6, 9, 0];
    if (qMonths.includes(month)) return new Date(year, month, event.dueDay);
    return null;
  }
  if (event.recurrence === "annual" && event.dueDay && event.dueMonth != null) {
    if (event.dueMonth === month) return new Date(year, month, event.dueDay);
    return null;
  }
  return null;
}

function isPast(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

function isDueSoon(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 7;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"month" | "list">("month");
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  useEffect(() => {
    fetch("/api/calendar")
      .then(r => r.json())
      .then(data => { setEvents(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = events.filter(e =>
    activeCategory === "all" || e.category === activeCategory
  );

  // Build events for current month
  const monthEvents: { event: CalendarEvent; date: Date }[] = [];
  filtered.forEach(e => {
    const d = getDueDate(e, viewMonth, viewYear);
    if (d) monthEvents.push({ event: e, date: d });
  });
  monthEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  // List view — next 3 months
  const listEvents: { event: CalendarEvent; date: Date }[] = [];
  if (viewMode === "list") {
    for (let i = 0; i < 3; i++) {
      const m = (viewMonth + i) % 12;
      const y = viewYear + Math.floor((viewMonth + i) / 12);
      filtered.forEach(e => {
        const d = getDueDate(e, m, y);
        if (d) listEvents.push({ event: e, date: d });
      });
    }
    listEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero */}
      <section style={{ background: "linear-gradient(160deg,#eff6ff 0%,#f0f9ff 40%,#fafafa 100%)" }}
        className="py-14 px-4 text-center">
        <div className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full mb-6 border"
          style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}>
          📅 India Statutory Compliance Calendar
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
          Never Miss a <span style={{ color: "#1d4ed8" }}>Compliance Deadline</span>
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          GST returns, TDS payments, ROC filings, PF/ESIC due dates — all in one place, always up to date.
        </p>
      </section>

      <div className="max-w-6xl mx-auto w-full px-4 py-10">
        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          {/* Month nav */}
          <div className="flex items-center gap-3">
            <button onClick={prevMonth}
              className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 font-bold">
              ‹
            </button>
            <span className="text-xl font-bold text-slate-800 min-w-[180px] text-center">
              {MONTHS_FULL[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth}
              className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 font-bold">
              ›
            </button>
            <button onClick={() => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200 bg-blue-50 ml-1">
              Today
            </button>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
            {(["month","list"] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                  viewMode === v ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
                }`}>
                {v === "month" ? "📅 Month" : "📋 List"}
              </button>
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setActiveCategory(c.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                activeCategory === c.key
                  ? "shadow-md scale-105"
                  : "opacity-60 hover:opacity-90"
              }`}
              style={activeCategory === c.key
                ? { background: c.bg, borderColor: c.color, color: c.color }
                : { background: "#f8fafc", borderColor: "#e2e8f0", color: "#64748b" }}>
              {c.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-20 text-slate-400">Loading calendar...</div>
        )}

        {!loading && viewMode === "month" && (
          <>
            {monthEvents.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-lg font-medium">No due dates this month for selected category</p>
              </div>
            ) : (
              <div className="space-y-3">
                {monthEvents.map(({ event, date }) => {
                  const cat = getCatStyle(event.category);
                  const past = isPast(date);
                  const soon = isDueSoon(date);
                  return (
                    <div key={event.id + date.toISOString()}
                      className={`flex items-start gap-4 p-4 rounded-2xl border transition hover:shadow-md ${
                        past ? "opacity-50" : soon ? "ring-2 ring-amber-400 ring-offset-1" : ""
                      }`}
                      style={{ background: cat.bg, borderColor: cat.color + "40" }}>
                      {/* Date badge */}
                      <div className="shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center font-bold shadow-sm"
                        style={{ background: cat.color, color: "white" }}>
                        <span className="text-xs uppercase">{MONTHS[date.getMonth()]}</span>
                        <span className="text-2xl leading-none">{date.getDate()}</span>
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900 text-base">{event.title}</h3>
                          {soon && !past && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300">
                              Due Soon!
                            </span>
                          )}
                          {past && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                              Past
                            </span>
                          )}
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: cat.color + "20", color: cat.color }}>
                            {cat.label}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-slate-600 text-sm mb-1">{event.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
                          <span>🏛 {event.authority}</span>
                          <span className="capitalize">🔄 {event.recurrence}</span>
                          {event.penalty && <span>⚠️ {event.penalty}</span>}
                        </div>
                      </div>
                      {event.link && (
                        <a href={event.link} target="_blank" rel="noopener noreferrer"
                          className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border transition hover:scale-105"
                          style={{ background: cat.color, color: "white", borderColor: cat.color }}>
                          Portal →
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {!loading && viewMode === "list" && (
          <div className="space-y-3">
            {listEvents.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-lg font-medium">No upcoming deadlines found</p>
              </div>
            ) : (
              listEvents.map(({ event, date }) => {
                const cat = getCatStyle(event.category);
                const past = isPast(date);
                const soon = isDueSoon(date);
                return (
                  <div key={event.id + date.toISOString()}
                    className={`flex items-start gap-4 p-4 rounded-2xl border transition hover:shadow-md ${
                      past ? "opacity-40" : soon ? "ring-2 ring-amber-400" : ""
                    }`}
                    style={{ background: cat.bg, borderColor: cat.color + "40" }}>
                    <div className="shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center font-bold shadow-sm"
                      style={{ background: cat.color, color: "white" }}>
                      <span className="text-xs uppercase">{MONTHS[date.getMonth()]}</span>
                      <span className="text-2xl leading-none">{date.getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900">{event.title}</h3>
                        {soon && !past && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300">
                            Due Soon!
                          </span>
                        )}
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: cat.color + "20", color: cat.color }}>
                          {cat.label}
                        </span>
                      </div>
                      {event.description && <p className="text-slate-600 text-sm">{event.description}</p>}
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
                        <span>🏛 {event.authority}</span>
                        {event.penalty && <span>⚠️ {event.penalty}</span>}
                      </div>
                    </div>
                    {event.link && (
                      <a href={event.link} target="_blank" rel="noopener noreferrer"
                        className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style={{ background: cat.color, color: "white" }}>
                        Portal →
                      </a>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 rounded-2xl p-8 text-center border"
          style={{ background: "linear-gradient(135deg,#eff6ff,#f0f9ff)", borderColor: "#bfdbfe" }}>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Not sure which compliances apply to you?</h2>
          <p className="text-slate-500 mb-6">Run a free check — get a personalized compliance list in 2 minutes.</p>
          <Link href="/check"
            className="inline-flex items-center gap-2 font-bold text-white px-8 py-3.5 rounded-xl transition hover:scale-105"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
            Start Compliance Check →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-4 mt-10">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4 text-sm text-slate-400">
          <span>© {new Date().getFullYear()} ComplianceSearch.in — Powered by <a href="https://geebharat.com" className="text-amber-600 hover:underline">Gee Bharat</a></span>
          <div className="flex gap-4">
            <Link href="/check" className="hover:text-slate-600">Check Compliance</Link>
            <Link href="/blog" className="hover:text-slate-600">Blog</Link>
            <Link href="/about" className="hover:text-slate-600">About</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
