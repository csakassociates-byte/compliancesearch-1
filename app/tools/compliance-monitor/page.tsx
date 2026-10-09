"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface ComplianceRow {
  companyId: string;
  companyName: string;
  cin: string;
  recordId: string | null;
  docStatus: string;
  docStatusRemarks: string;
  workStatus: string;
  workStatusRemarks: string;
  inc20aStatus: string;
  balanceSheetReady: boolean;
  udinStatutory: string;
  udinTaxAudit: string;
  attachmentsGenerated: boolean;
  aoc4Srn: string;
  mgt7Srn: string;
  adt1Srn: string;
  adt1FromFy: string;
  adt1ToFy: string;
  adt1CarriedForward?: boolean;
  dpt3Applicable: boolean;
  dpt3Srn: string;
  remarks: string;
}

const FY_OPTIONS = ["2026-27", "2025-26", "2024-25", "2023-24", "2022-23", "2021-22"];

// Default = previous FY (the one we're filing for)
function getDefaultFY(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const fyStart = month >= 4 ? year : year - 1; // current FY start year
  const prev = fyStart - 1;
  return `${prev}-${String(prev + 1).slice(-2)}`;
}

const FIELD_LABELS: Record<string, string> = {
  docStatus: "Document status",
  workStatus: "Work status",
  inc20a: "INC-20A status",
  bs: "Balance sheet",
  udinStat: "UDIN — statutory audit",
  udinTax: "UDIN — tax audit",
  aoc4: "AOC-4 SRN",
  mgt7: "MGT-7/7A SRN",
  adt1: "ADT-1 appointment details",
  dpt3: "DPT-3",
  remarks: "Remarks",
};

function isFullyCompliant(r: ComplianceRow): boolean {
  return (
    r.workStatus === "active" &&
    r.inc20aStatus !== "pending" &&
    r.balanceSheetReady &&
    !!r.udinStatutory &&
    r.attachmentsGenerated &&
    !!r.aoc4Srn &&
    !!r.mgt7Srn &&
    !!r.adt1Srn &&
    (!r.dpt3Applicable || !!r.dpt3Srn)
  );
}

function hasPendingItems(r: ComplianceRow): boolean {
  if (r.workStatus === "declined") return false;
  if (r.workStatus === "confirming") return true;
  return (
    r.inc20aStatus === "pending" ||
    !r.balanceSheetReady ||
    !r.udinStatutory ||
    !r.attachmentsGenerated ||
    !r.aoc4Srn ||
    !r.mgt7Srn ||
    !r.adt1Srn ||
    (r.dpt3Applicable && !r.dpt3Srn)
  );
}

function getDueDates(fyStr: string): { aoc4: Date; mgt7: Date } {
  const fyEndYear = parseInt(fyStr.split("-")[0]) + 1;
  return {
    aoc4: new Date(fyEndYear, 9, 30),  // October 30
    mgt7: new Date(fyEndYear, 10, 29), // November 29
  };
}

const pb = "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap border";
const okPill   = `${pb} bg-emerald-50 text-emerald-700 border-emerald-200`;
const errPill  = `${pb} bg-red-50 text-red-700 border-red-200 cursor-pointer hover:bg-red-100 transition-colors`;
const naPill   = `${pb} bg-slate-100 text-slate-500 border-slate-200`;
const warnPill = `${pb} bg-amber-50 text-amber-700 border-amber-200`;
const infoPill = `${pb} bg-blue-50 text-blue-700 border-blue-100`;

export default function ComplianceMonitorPage() {
  const { status } = useSession({ required: true });
  const [fy, setFy] = useState(getDefaultFY);
  const [rows, setRows] = useState<ComplianceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editField, setEditField] = useState("");
  const [editValues, setEditValues] = useState<Record<string, string | boolean>>({});
  const [saving, setSaving] = useState(false);
  const [confirmPending, setConfirmPending] = useState<{ patch: Partial<ComplianceRow> } | null>(null);
  const [reminderRow, setReminderRow] = useState<ComplianceRow | null>(null);
  const [reminderText, setReminderText] = useState("");
  const [copied, setCopied] = useState(false);
  const editRef = useRef<HTMLDivElement>(null);
  // Close modal on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeEdit(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const load = useCallback((selectedFy: string) => {
    setLoading(true);
    fetch(`/api/annual-compliance?fy=${selectedFy}`)
      .then(r => r.json())
      .then(d => { setRows(d.rows || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    load(fy);
  }, [fy, status, load]);

  function generateReminder(r: ComplianceRow): string {
    const pendingItems: string[] = [];
    if (r.workStatus !== "declined") {
      if (r.inc20aStatus === "pending") pendingItems.push("INC-20A filing");
      if (!r.balanceSheetReady) pendingItems.push("Balance sheet finalization");
      if (!r.udinStatutory) pendingItems.push("UDIN (statutory audit)");
      if (!r.aoc4Srn) pendingItems.push("AOC-4 filing");
      if (!r.mgt7Srn) pendingItems.push("MGT-7/7A filing");
      if (!r.adt1Srn) pendingItems.push("ADT-1 (auditor appointment)");
      if (r.dpt3Applicable && !r.dpt3Srn) pendingItems.push("DPT-3 filing");
    }
    const docLine =
      r.docStatus === "awaited"
        ? "We are awaiting the required documents for completing annual compliance."
        : r.docStatus === "partial"
        ? `We have received partial documents.${r.docStatusRemarks ? ` (${r.docStatusRemarks})` : " Some items are still pending."}`
        : "";
    const itemsList = pendingItems.length > 0
      ? `\n\nPending items:\n${pendingItems.map(i => `• ${i}`).join("\n")}`
      : "";
    return `Dear Team,\n\nGreetings!\n\nThis is a gentle reminder for *${r.companyName}* regarding Annual Compliance for FY *${fy}*.\n\n${docLine}${itemsList}\n\nKindly provide the required documents and information at the earliest to ensure timely filing and avoid any late fees or penalties.\n\nThank you for your cooperation.\n\nWarm Regards`;
  }

  function exportToCSV() {
    const dueDates = getDueDates(fy);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const aoc4DueDays = Math.ceil((dueDates.aoc4.getTime() - today.getTime()) / 86400000);
    const mgt7DueDays = Math.ceil((dueDates.mgt7.getTime() - today.getTime()) / 86400000);
    const headers = [
      "S.No", "Company Name", "CIN", "Work Status", "Doc Status", "Doc Remarks",
      "INC-20A", "Balance Sheet", "UDIN (Statutory)", "UDIN (Tax Audit)", "Attachments",
      `AOC-4 SRN (due ${dueDates.aoc4.toLocaleDateString("en-IN")})`,
      `MGT-7 SRN (due ${dueDates.mgt7.toLocaleDateString("en-IN")})`,
      "ADT-1 SRN", "ADT-1 From FY", "ADT-1 To FY", "DPT-3", "DPT-3 SRN", "Remarks",
    ];
    const csvRows = rows.map((r, i) => [
      i + 1,
      `"${r.companyName.replace(/"/g, '""')}"`,
      r.cin,
      r.workStatus,
      r.docStatus,
      `"${(r.docStatusRemarks || "").replace(/"/g, '""')}"`,
      r.inc20aStatus,
      r.balanceSheetReady ? "Ready" : "Pending",
      r.udinStatutory || "",
      r.udinTaxAudit || "",
      r.attachmentsGenerated ? "Generated" : "Pending",
      r.aoc4Srn || (aoc4DueDays < 0 ? "OVERDUE" : "Pending"),
      r.mgt7Srn || (mgt7DueDays < 0 ? "OVERDUE" : "Pending"),
      r.adt1Srn || "",
      r.adt1FromFy || "",
      r.adt1ToFy || "",
      r.dpt3Applicable ? "Yes" : "No",
      r.dpt3Srn || "",
      `"${(r.remarks || "").replace(/"/g, '""')}"`,
    ].join(","));
    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Compliance-Monitor-FY${fy}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Stats
  const activeRows = rows.filter(r => r.workStatus === "active");
  const stats = {
    total:          rows.length,
    active:         activeRows.length,
    udinPending:    activeRows.filter(r => !r.udinStatutory).length,
    filingsPending: activeRows.filter(r => !r.aoc4Srn || !r.mgt7Srn).length,
    fullyCompliant: activeRows.filter(r => isFullyCompliant(r)).length,
  };

  const counts = {
    all:        rows.length,
    active:     rows.filter(r => r.workStatus === "active").length,
    declined:   rows.filter(r => r.workStatus === "declined").length,
    confirming: rows.filter(r => r.workStatus === "confirming").length,
    alerts:     rows.filter(r => hasPendingItems(r)).length,
  };

  const filteredRows = rows.filter(r => {
    if (filterMode === "active")    return r.workStatus === "active";
    if (filterMode === "declined")  return r.workStatus === "declined";
    if (filterMode === "confirming") return r.workStatus === "confirming";
    if (filterMode === "alerts")    return hasPendingItems(r);
    return true;
  });

  async function save(row: ComplianceRow, patch: Partial<ComplianceRow>) {
    setRows(prev => prev.map(r => r.companyId === row.companyId ? { ...r, ...patch } : r));
    setSaving(true);
    try {
      const res = await fetch("/api/annual-compliance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId:     row.recordId ?? undefined,
          companyId:    row.companyId,
          cin:          row.cin,
          companyName:  row.companyName,
          financialYear: fy,
          ...patch,
        }),
      });
      const data = await res.json();
      if (data.id && !row.recordId) {
        setRows(prev => prev.map(r => r.companyId === row.companyId ? { ...r, recordId: data.id } : r));
      }
    } finally {
      setSaving(false);
    }
  }

  function openEdit(companyId: string, field: string, initValues: Record<string, string | boolean>) {
    setEditingId(companyId);
    setEditField(field);
    setEditValues(initValues);
    // no scroll needed — modal overlay
  }

  function closeEdit() {
    setEditingId(null);
    setEditField("");
    setEditValues({});
  }

  function handleSave() {
    const row = rows.find(r => r.companyId === editingId);
    if (!row) return;
    const patch: Partial<ComplianceRow> = {};
    switch (editField) {
      case "docStatus":
        patch.docStatus        = editValues.docStatus as string;
        patch.docStatusRemarks = editValues.docStatusRemarks as string ?? "";
        break;
      case "workStatus":
        patch.workStatus        = editValues.workStatus as string;
        patch.workStatusRemarks = editValues.workStatusRemarks as string ?? "";
        break;
      case "inc20a":
        patch.inc20aStatus = editValues.inc20aStatus as string;
        break;
      case "bs":
        patch.balanceSheetReady = editValues.balanceSheetReady as boolean;
        break;
      case "udinStat":
        patch.udinStatutory = editValues.udinStatutory as string;
        break;
      case "udinTax":
        patch.udinTaxAudit = editValues.udinTaxAudit as string;
        break;
      case "aoc4":
        patch.aoc4Srn = editValues.aoc4Srn as string;
        break;
      case "mgt7":
        patch.mgt7Srn = editValues.mgt7Srn as string;
        break;
      case "adt1":
        patch.adt1Srn    = editValues.adt1Srn as string;
        patch.adt1FromFy = editValues.adt1FromFy as string;
        patch.adt1ToFy   = editValues.adt1ToFy as string;
        break;
      case "dpt3":
        patch.dpt3Applicable = editValues.dpt3Applicable as boolean;
        patch.dpt3Srn        = editValues.dpt3Srn as string ?? "";
        break;
      case "remarks":
        patch.remarks = editValues.remarks as string;
        break;
    }
    // Show confirmation before saving
    setConfirmPending({ patch });
  }

  function confirmSave() {
    const row = rows.find(r => r.companyId === editingId);
    if (!row || !confirmPending) return;
    save(row, confirmPending.patch);
    setConfirmPending(null);
    closeEdit();
  }

  // ─── Edit panel content ────────────────────────────────────────────────────
  function renderEditContent() {
    const inp = "border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full";
    const inpMono = `${inp} font-mono`;
    const selBtn = (active: boolean, extra?: string) =>
      `px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${extra} ${active ? "ring-2 ring-offset-1 ring-blue-400 opacity-100" : "opacity-70 hover:opacity-100"}`;

    switch (editField) {
      case "docStatus":
        return (
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {[
                { v: "received", label: "✓ Received",        cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                { v: "partial",  label: "⚠ Partial",         cls: "bg-amber-50 text-amber-700 border-amber-200" },
                { v: "awaited",  label: "⏳ Awaited",         cls: "bg-blue-50 text-blue-700 border-blue-100" },
                { v: "na",       label: "N/A",                cls: "bg-slate-100 text-slate-600 border-slate-300" },
              ].map(({ v, label, cls }) => (
                <button key={v} onClick={() => setEditValues(ev => ({ ...ev, docStatus: v }))}
                  className={selBtn(editValues.docStatus === v, cls)}>{label}</button>
              ))}
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Remarks — what arrived, what is pending, what client said</label>
              <input value={editValues.docStatusRemarks as string || ""}
                onChange={e => setEditValues(v => ({ ...v, docStatusRemarks: e.target.value }))}
                placeholder="e.g. Bank statements received, purchase bills awaited"
                className={inp} />
            </div>
          </div>
        );
      case "workStatus":
        return (
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {[
                { v: "active",     label: "✓ Active",     cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                { v: "confirming", label: "⏳ Confirming", cls: "bg-amber-50 text-amber-700 border-amber-200" },
                { v: "declined",   label: "✕ Declined",   cls: "bg-slate-100 text-slate-600 border-slate-300" },
              ].map(({ v, label, cls }) => (
                <button key={v} onClick={() => setEditValues(ev => ({ ...ev, workStatus: v }))}
                  className={selBtn(editValues.workStatus === v, cls)}>{label}</button>
              ))}
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Remarks (optional)</label>
              <input value={editValues.workStatusRemarks as string || ""}
                onChange={e => setEditValues(v => ({ ...v, workStatusRemarks: e.target.value }))}
                placeholder="e.g. Declined — low turnover, will engage next year"
                className={inp} />
            </div>
          </div>
        );
      case "inc20a":
        return (
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {[
                { v: "na",      label: "N/A — not applicable", cls: "bg-slate-100 text-slate-600 border-slate-300" },
                { v: "filed",   label: "✓ Filed",              cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                { v: "pending", label: "Pending",              cls: "bg-red-50 text-red-700 border-red-200" },
              ].map(({ v, label, cls }) => (
                <button key={v} onClick={() => setEditValues(ev => ({ ...ev, inc20aStatus: v }))}
                  className={selBtn(editValues.inc20aStatus === v, cls)}>{label}</button>
              ))}
            </div>
            <p className="text-xs text-slate-400">INC-20A not applicable for companies incorporated before 2 Nov 2018.</p>
          </div>
        );
      case "bs":
        return (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setEditValues(v => ({ ...v, balanceSheetReady: true }))}
              className={selBtn(editValues.balanceSheetReady === true, "bg-emerald-50 text-emerald-700 border-emerald-200")}>
              ✓ Ready / finalized
            </button>
            <button onClick={() => setEditValues(v => ({ ...v, balanceSheetReady: false }))}
              className={selBtn(editValues.balanceSheetReady === false, "bg-red-50 text-red-700 border-red-200")}>
              Pending
            </button>
          </div>
        );
      case "udinStat":
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input value={editValues.udinStatutory as string || ""}
                onChange={e => setEditValues(v => ({ ...v, udinStatutory: e.target.value.toUpperCase() }))}
                placeholder="e.g. ICAI24-0812345"
                className={inpMono} />
              <button onClick={() => setEditValues(v => ({ ...v, udinStatutory: "na" }))}
                className="px-3 py-2 text-xs rounded-lg bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 whitespace-nowrap">
                Mark N/A
              </button>
            </div>
            <p className="text-xs text-slate-400">Generate UDIN from ICAI UDIN portal after signing the balance sheet.</p>
          </div>
        );
      case "udinTax":
        return (
          <div className="flex gap-2">
            <input value={editValues.udinTaxAudit as string || ""}
              onChange={e => setEditValues(v => ({ ...v, udinTaxAudit: e.target.value.toUpperCase() }))}
              placeholder="UDIN for tax audit (if applicable)"
              className={inpMono} />
            <button onClick={() => setEditValues(v => ({ ...v, udinTaxAudit: "na" }))}
              className="px-3 py-2 text-xs rounded-lg bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 whitespace-nowrap">
              Mark N/A
            </button>
          </div>
        );
      case "aoc4":
        return (
          <div className="space-y-2">
            <input value={editValues.aoc4Srn as string || ""}
              onChange={e => setEditValues(v => ({ ...v, aoc4Srn: e.target.value.toUpperCase() }))}
              placeholder="SRN — e.g. A12345678"
              className={inpMono} />
            <p className="text-xs text-slate-400">SRN issued by MCA portal after AOC-4 submission. Filing marked done only when SRN is entered.</p>
          </div>
        );
      case "mgt7":
        return (
          <div className="space-y-2">
            <input value={editValues.mgt7Srn as string || ""}
              onChange={e => setEditValues(v => ({ ...v, mgt7Srn: e.target.value.toUpperCase() }))}
              placeholder="SRN — e.g. A87654321"
              className={inpMono} />
            <p className="text-xs text-slate-400">For Section 8 / OPC / Small companies, enter MGT-7A SRN here.</p>
          </div>
        );
      case "adt1":
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">SRN of ADT-1</label>
                <input value={editValues.adt1Srn as string || ""}
                  onChange={e => setEditValues(v => ({ ...v, adt1Srn: e.target.value.toUpperCase() }))}
                  placeholder="A11122233" className={inpMono} />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Appointed from FY</label>
                <input value={editValues.adt1FromFy as string || ""}
                  onChange={e => setEditValues(v => ({ ...v, adt1FromFy: e.target.value }))}
                  placeholder="2022–23" className={inp} />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Appointed to FY</label>
                <input value={editValues.adt1ToFy as string || ""}
                  onChange={e => setEditValues(v => ({ ...v, adt1ToFy: e.target.value }))}
                  placeholder="2026–27" className={inp} />
              </div>
            </div>
            <p className="text-xs text-slate-400">&ldquo;To FY&rdquo; is the last year of current auditor appointment — used to track when re-appointment is needed.</p>
          </div>
        );
      case "dpt3":
        return (
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox"
                checked={editValues.dpt3Applicable as boolean || false}
                onChange={e => setEditValues(v => ({ ...v, dpt3Applicable: e.target.checked, dpt3Srn: e.target.checked ? (v.dpt3Srn as string || "") : "" }))}
                className="rounded" />
              <span className="text-sm">DPT-3 is applicable for this company</span>
            </label>
            {editValues.dpt3Applicable && (
              <div className="space-y-1">
                <label className="text-xs text-slate-500 block">SRN (enter when filed)</label>
                <input value={editValues.dpt3Srn as string || ""}
                  onChange={e => setEditValues(v => ({ ...v, dpt3Srn: e.target.value.toUpperCase() }))}
                  placeholder="SRN — e.g. D99900011"
                  className={inpMono} />
              </div>
            )}
          </div>
        );
      case "remarks":
        return (
          <input value={editValues.remarks as string || ""}
            onChange={e => setEditValues(v => ({ ...v, remarks: e.target.value }))}
            placeholder="Add notes or remarks..."
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" />
        );
      default:
        return null;
    }
  }

  // ─── Table cell helpers ────────────────────────────────────────────────────
  function cellDocStatus(r: ComplianceRow) {
    const open = () => openEdit(r.companyId, "docStatus", { docStatus: r.docStatus, docStatusRemarks: r.docStatusRemarks });
    const tip = r.docStatusRemarks || undefined;
    if (r.docStatus === "received") return (
      <div className="flex flex-col gap-0.5">
        <span className={`${okPill} cursor-pointer hover:opacity-80`} onClick={open} title={tip}>✓ Received</span>
        {r.docStatusRemarks && <div className="text-[10px] text-slate-400 truncate max-w-[110px]" title={r.docStatusRemarks}>{r.docStatusRemarks}</div>}
      </div>
    );
    if (r.docStatus === "partial") return (
      <div className="flex flex-col gap-0.5">
        <span className={`${warnPill} cursor-pointer hover:opacity-80`} onClick={open} title={tip}>⚠ Partial</span>
        {r.docStatusRemarks && <div className="text-[10px] text-slate-400 truncate max-w-[110px]" title={r.docStatusRemarks}>{r.docStatusRemarks}</div>}
      </div>
    );
    if (r.docStatus === "na") return <span className={`${naPill} cursor-pointer hover:opacity-80`} onClick={open}>N/A</span>;
    return (
      <div className="flex flex-col gap-0.5">
        <span className={`${infoPill} cursor-pointer hover:opacity-80`} onClick={open} title={tip}>⏳ Awaited</span>
        {r.docStatusRemarks && <div className="text-[10px] text-slate-400 truncate max-w-[110px]" title={r.docStatusRemarks}>{r.docStatusRemarks}</div>}
      </div>
    );
  }

  function cellInc20a(r: ComplianceRow) {
    if (r.workStatus === "declined") return <span className={naPill}>N/A</span>;
    if (r.inc20aStatus === "na")     return <span className={naPill}>N/A</span>;
    if (r.inc20aStatus === "filed")  return <span className={okPill}>✓ Filed</span>;
    return <span className={errPill} onClick={() => openEdit(r.companyId, "inc20a", { inc20aStatus: r.inc20aStatus })}>Pending</span>;
  }

  function cellBs(r: ComplianceRow) {
    if (r.workStatus === "declined") return <span className={naPill}>N/A</span>;
    if (r.balanceSheetReady) return <span className={okPill}>✓ Ready</span>;
    return <span className={errPill} onClick={() => openEdit(r.companyId, "bs", { balanceSheetReady: false })}>Pending</span>;
  }

  function cellUdin(val: string, field: "udinStat" | "udinTax", row: ComplianceRow) {
    if (row.workStatus === "declined") return <span className={naPill}>N/A</span>;
    if (val === "na") return <span className={naPill}>N/A</span>;
    if (val) return <span className={infoPill} title={val}>{val.slice(0, 14)}{val.length > 14 ? "…" : ""}</span>;
    return <span className={errPill} onClick={() => openEdit(row.companyId, field, { [field === "udinStat" ? "udinStatutory" : "udinTaxAudit"]: "" })}>Pending</span>;
  }

  function cellSrn(val: string, field: "aoc4" | "mgt7", row: ComplianceRow) {
    if (row.workStatus === "declined") return <span className={naPill}>N/A</span>;
    if (val) return <span className={infoPill} title={`SRN: ${val}`}>#{val}</span>;
    const dueDates = getDueDates(fy);
    const dueDate  = field === "aoc4" ? dueDates.aoc4 : dueDates.mgt7;
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
    const openFn   = () => openEdit(row.companyId, field, { [field === "aoc4" ? "aoc4Srn" : "mgt7Srn"]: "" });
    if (daysLeft < 0) return (
      <div className="flex flex-col gap-0.5">
        <span className={`${pb} bg-red-100 text-red-700 border-red-300 cursor-pointer hover:bg-red-200`} onClick={openFn}>🚨 Overdue</span>
        <div className="text-[9px] text-red-400">{Math.abs(daysLeft)}d past due</div>
      </div>
    );
    if (daysLeft <= 15) return (
      <div className="flex flex-col gap-0.5">
        <span className={`${pb} bg-orange-50 text-orange-700 border-orange-200 cursor-pointer hover:bg-orange-100`} onClick={openFn}>⏰ Due in {daysLeft}d</span>
        <div className="text-[9px] text-orange-400">{dueDate.toLocaleDateString("en-IN")}</div>
      </div>
    );
    return <span className={errPill} onClick={openFn}>Pending</span>;
  }

  function cellAdt1(r: ComplianceRow) {
    if (r.workStatus === "declined") return <span className={naPill}>N/A</span>;
    if (r.adt1Srn) return (
      <div>
        {r.adt1CarriedForward
          ? <span className={`${warnPill}`} title="Carried forward from previous year">↩ Carried Fwd</span>
          : <span className={okPill}>✓ Filed</span>}
        {r.adt1FromFy && <div className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">{r.adt1FromFy} → {r.adt1ToFy}</div>}
      </div>
    );
    return <span className={errPill} onClick={() => openEdit(r.companyId, "adt1", { adt1Srn: "", adt1FromFy: r.adt1FromFy, adt1ToFy: r.adt1ToFy })}>Pending</span>;
  }

  function cellDpt3(r: ComplianceRow) {
    if (!r.dpt3Applicable) return <span className={naPill}>N/A</span>;
    return (
      <div className="flex flex-col gap-0.5">
        <span className={warnPill}>Applicable</span>
        {r.dpt3Srn
          ? <span className={okPill}>✓ Filed</span>
          : <span className={errPill} onClick={() => openEdit(r.companyId, "dpt3", { dpt3Applicable: true, dpt3Srn: "" })}>Pending</span>}
      </div>
    );
  }

  function cellAttach(r: ComplianceRow) {
    if (r.workStatus === "declined") return <span className={naPill}>N/A</span>;
    if (r.attachmentsGenerated) return <span className={okPill}>✓ Generated</span>;
    return (
      <Link href={`/tools/documents/annual-filing${r.cin ? `?cin=${encodeURIComponent(r.cin)}&fy=${fy}` : ""}`}
        className={`${errPill} no-underline`}>
        Generate →
      </Link>
    );
  }

  // ─── Filter tab ────────────────────────────────────────────────────────────
  function FilterTab({ id, label, count, danger }: { id: string; label: string; count: number; danger?: boolean }) {
    const active = filterMode === id;
    return (
      <button onClick={() => setFilterMode(id)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
          active ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
        }`}>
        {label}
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
          active ? "bg-white/20 text-white" :
          danger ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"
        }`}>{count}</span>
      </button>
    );
  }

  if (status === "loading" || loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-slate-400 text-sm">Loading compliance data…</div>
        </main>
      </>
    );
  }

  const editingRow = rows.find(r => r.companyId === editingId);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-[1400px] mx-auto px-4 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Annual compliance monitor</div>
              <h1 className="text-2xl font-bold text-slate-800">Compliance Dashboard</h1>
              <p className="text-sm text-slate-500 mt-0.5">Track compliance status for all your clients — one view, every filing.</p>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <label className="text-xs text-slate-500 font-medium">Financial Year</label>
              <select value={fy} onChange={e => setFy(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {FY_OPTIONS.map(y => <option key={y} value={y}>FY {y}</option>)}
              </select>
              <button onClick={exportToCSV}
                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all font-medium flex items-center gap-1.5">
                ⬇ Export Excel
              </button>
              <Link href="/dashboard/clients"
                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all font-medium">
                + Manage clients
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {[
              { label: "Total companies",  val: stats.total,          color: "text-slate-700" },
              { label: "Active / agreed",  val: stats.active,         color: "text-emerald-600" },
              { label: "UDIN pending",     val: stats.udinPending,    color: stats.udinPending   > 0 ? "text-red-600"    : "text-emerald-600" },
              { label: "Filings pending",  val: stats.filingsPending, color: stats.filingsPending > 0 ? "text-amber-600" : "text-emerald-600" },
              { label: "Fully compliant",  val: `${stats.fullyCompliant} / ${stats.active}`, color: "text-emerald-600" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                <div className="text-[11px] text-slate-400 mb-1">{s.label}</div>
                <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Alert banner */}
          {stats.filingsPending > 0 && (() => {
            const dd = getDueDates(fy);
            const today = new Date(); today.setHours(0,0,0,0);
            const aoc4Days = Math.ceil((dd.aoc4.getTime() - today.getTime()) / 86400000);
            const mgt7Days = Math.ceil((dd.mgt7.getTime() - today.getTime()) / 86400000);
            const isOverdue = aoc4Days < 0 || mgt7Days < 0;
            return (
              <div className={`border rounded-xl px-4 py-3 mb-4 flex items-center gap-2 ${isOverdue ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
                <span className="text-sm">{isOverdue ? "🚨" : "⚠️"}</span>
                <span className={`text-sm ${isOverdue ? "text-red-800" : "text-amber-800"}`}>
                  <strong className="font-semibold">{stats.filingsPending} active {stats.filingsPending === 1 ? "company has" : "companies have"}</strong> AOC-4 or MGT-7 still pending for FY {fy}.
                  {aoc4Days < 0
                    ? <> AOC-4 was due {dd.aoc4.toLocaleDateString("en-IN")} ({Math.abs(aoc4Days)}d ago).</>
                    : aoc4Days <= 15
                    ? <> AOC-4 due in <strong>{aoc4Days}d</strong> ({dd.aoc4.toLocaleDateString("en-IN")}).</>
                    : null}
                  {mgt7Days < 0
                    ? <> MGT-7 was due {dd.mgt7.toLocaleDateString("en-IN")} ({Math.abs(mgt7Days)}d ago).</>
                    : mgt7Days <= 15
                    ? <> MGT-7 due in <strong>{mgt7Days}d</strong> ({dd.mgt7.toLocaleDateString("en-IN")}).</>
                    : null}
                </span>
                <button onClick={() => setFilterMode("alerts")}
                  className={`ml-auto text-xs underline hover:no-underline font-medium ${isOverdue ? "text-red-700" : "text-amber-700"}`}>
                  View all →
                </button>
              </div>
            );
          })()}

          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap mb-3">
            <FilterTab id="all"        label="All"         count={counts.all} />
            <FilterTab id="active"     label="Active"      count={counts.active} />
            <FilterTab id="declined"   label="Declined"    count={counts.declined} />
            <FilterTab id="confirming" label="Confirming"  count={counts.confirming} />
            <FilterTab id="alerts"     label="Has pending" count={counts.alerts} danger />
          </div>
          <div className="text-xs text-slate-400 mb-3">Click any <span className="bg-red-50 text-red-700 border border-red-200 rounded-full px-1.5 py-0.5 font-medium">Pending</span> badge to update it</div>

          {/* Empty state */}
          {rows.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="text-4xl mb-3">📋</div>
              <div className="text-slate-700 font-semibold mb-1">No companies yet</div>
              <p className="text-sm text-slate-500 mb-4">Add clients to your account to track their compliance here.</p>
              <Link href="/dashboard/clients" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                Go to Clients →
              </Link>
            </div>
          )}

          {/* Table */}
          {rows.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-[1260px] w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="sticky left-0 z-20 bg-slate-50 px-2 py-2.5 text-center text-[10px] font-semibold text-slate-400 uppercase w-8">#</th>
                    <th className="sticky left-8 z-20 bg-slate-50 px-3 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase min-w-[160px] border-r border-slate-200">Company</th>
                    <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase text-left whitespace-nowrap min-w-[120px]">Doc status</th>
                    <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase text-left whitespace-nowrap">Work status</th>
                    <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase text-left whitespace-nowrap">INC-20A</th>
                    <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase text-left whitespace-nowrap">Balance sheet</th>
                    <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase text-left whitespace-nowrap">UDIN statutory</th>
                    <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase text-left whitespace-nowrap">UDIN tax audit</th>
                    <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase text-left whitespace-nowrap">Attachments</th>
                    <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase text-left whitespace-nowrap">AOC-4</th>
                    <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase text-left whitespace-nowrap">MGT-7/7A</th>
                    <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase text-left whitespace-nowrap">ADT-1</th>
                    <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase text-left whitespace-nowrap">DPT-3</th>
                    <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase text-left min-w-[130px]">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, idx) => {
                    const isEditing = editingId === row.companyId;
                    return (
                      <tr key={row.companyId}
                        className={`border-b border-slate-100 group last:border-0 ${isEditing ? "bg-blue-50/50" : "hover:bg-slate-50"}`}>
                        <td className={`sticky left-0 z-10 px-2 py-2 text-center text-[10px] text-slate-400 ${isEditing ? "bg-blue-50/50" : "bg-white group-hover:bg-slate-50"}`}>
                          {idx + 1}
                        </td>
                        <td className={`sticky left-8 z-10 px-3 py-2 border-r border-slate-100 ${isEditing ? "bg-blue-50/50" : "bg-white group-hover:bg-slate-50"}`}>
                          <div className="font-medium text-slate-800 text-xs truncate max-w-[155px]" title={row.companyName}>{row.companyName}</div>
                          {row.cin && <div className="text-[10px] text-slate-400 font-mono mt-0.5">{row.cin}</div>}
                        </td>
                        <td className="px-3 py-2">{cellDocStatus(row)}</td>
                        <td className="px-3 py-2">
                          <button onClick={() => openEdit(row.companyId, "workStatus", { workStatus: row.workStatus, workStatusRemarks: row.workStatusRemarks })}
                            className={`${pb} cursor-pointer hover:opacity-80 transition-opacity ${
                              row.workStatus === "active"    ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              row.workStatus === "declined"  ? "bg-slate-100 text-slate-500 border-slate-200" :
                                                               "bg-amber-50 text-amber-700 border-amber-200"}`}>
                            {row.workStatus === "active" ? "✓ Active" : row.workStatus === "declined" ? "✕ Declined" : "⏳ Confirming"}
                          </button>
                        </td>
                        <td className="px-3 py-2">{cellInc20a(row)}</td>
                        <td className="px-3 py-2">{cellBs(row)}</td>
                        <td className="px-3 py-2">{cellUdin(row.udinStatutory, "udinStat", row)}</td>
                        <td className="px-3 py-2">{cellUdin(row.udinTaxAudit, "udinTax", row)}</td>
                        <td className="px-3 py-2">{cellAttach(row)}</td>
                        <td className="px-3 py-2">{cellSrn(row.aoc4Srn, "aoc4", row)}</td>
                        <td className="px-3 py-2">{cellSrn(row.mgt7Srn, "mgt7", row)}</td>
                        <td className="px-3 py-2">{cellAdt1(row)}</td>
                        <td className="px-3 py-2">{cellDpt3(row)}</td>
                        <td className="px-3 py-2 max-w-[130px]">
                          <div className="flex items-center gap-1 group/rem">
                            <span className="text-[11px] text-slate-500 truncate">{row.remarks || "—"}</span>
                            <button onClick={() => openEdit(row.companyId, "remarks", { remarks: row.remarks })}
                              className="opacity-0 group-hover/rem:opacity-100 text-slate-300 hover:text-slate-600 transition-opacity text-xs shrink-0"
                              title="Edit remarks">✏️</button>
                            <button onClick={() => { setReminderRow(row); setReminderText(generateReminder(row)); setCopied(false); }}
                              className="opacity-0 group-hover/rem:opacity-100 text-slate-300 hover:text-blue-500 transition-opacity text-xs shrink-0"
                              title="Generate client reminder">📩</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}


        </div>
      </main>

      {/* ── Edit Modal ───────────────────────────────────────────────────── */}
      {editingId && editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => { if (!confirmPending) closeEdit(); }} />

          {/* Panel */}
          <div ref={editRef} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-0.5 truncate max-w-[340px]">
                  {editingRow.companyName}
                </div>
                <div className="text-base font-semibold text-slate-800">
                  {FIELD_LABELS[editField] || editField}
                </div>
              </div>
              <button onClick={closeEdit}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors rounded-full w-8 h-8 flex items-center justify-center text-xl leading-none">
                ×
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {renderEditContent()}
              <div className="flex gap-2 mt-5 pt-4 border-t border-slate-100">
                <button onClick={handleSave} disabled={saving}
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {saving ? "Saving…" : "Save"}
                </button>
                <button onClick={closeEdit}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* ── Confirmation overlay (z-60, on top of edit modal) ─────────── */}
          {confirmPending && editingRow && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
                <div className="px-6 pt-6 pb-4">
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-2xl mx-auto mb-3">⚠️</div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Are you sure you want to update <strong className="font-bold text-slate-900 block mt-1 text-base">{editingRow.companyName}</strong>?
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Updating: {FIELD_LABELS[editField] || editField}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={confirmSave} disabled={saving}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                      {saving ? "Saving…" : "Yes, Update"}
                    </button>
                    <button onClick={() => setConfirmPending(null)}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      Go Back
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Reminder Modal ───────────────────────────────────────────────── */}
      {reminderRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => setReminderRow(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-0.5">Client Reminder</div>
                <div className="text-base font-semibold text-slate-800 truncate max-w-[340px]">{reminderRow.companyName}</div>
              </div>
              <button onClick={() => setReminderRow(null)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors rounded-full w-8 h-8 flex items-center justify-center text-xl leading-none">
                ×
              </button>
            </div>
            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <p className="text-xs text-slate-500">WhatsApp / message ready. Edit if needed, then copy.</p>
              <textarea
                value={reminderText}
                onChange={e => setReminderText(e.target.value)}
                rows={12}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y bg-slate-50"
              />
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => { navigator.clipboard.writeText(reminderText); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${copied ? "bg-emerald-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                  {copied ? "✓ Copied!" : "📋 Copy to Clipboard"}
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(reminderText)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="px-5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors">
                  📲 Open in WhatsApp
                </a>
                <button onClick={() => setReminderRow(null)}
                  className="ml-auto px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
