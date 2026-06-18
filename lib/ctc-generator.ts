/**
 * lib/ctc-generator.ts
 * Single source of truth for CTC (Certified True Copy) HTML generation.
 * Used by: Board Minutes, AGM Minutes, EGM Minutes, Committee Minutes, Direct CTC (Resolution Builder)
 */

/* ── Company ───────────────────────────────────────────────────── */
export interface CtcCompany {
  companyName: string;
  cin?: string;
  regAddress?: string;
  email?: string;
  mobile?: string;
}

/* ── Meeting ───────────────────────────────────────────────────── */
export type CtcMeetingType = "board" | "agm" | "egm" | "committee";

export interface CtcMeeting {
  meetingType: CtcMeetingType;
  /** Human-readable label: "Board Meeting" / "Annual General Meeting" / "Audit Committee Meeting" */
  meetingTypeLabel: string;
  /** Serial number — present for board & committee, absent for AGM/EGM */
  meetingSerial?: string;
  meetingDate: string;        // ISO date string "2025-06-15"
  meetingTime?: string;
  venue?: string;
  financialYear?: string;
}

/* ── Resolution ────────────────────────────────────────────────── */
export interface CtcResolution {
  title: string;
  /** Fully filled "RESOLVED THAT..." text (placeholders already substituted) */
  text: string;
  type: "ordinary" | "special" | "none";
  /** e.g. "1/BM-001/2025-26" or "AGM-1/2025-26" */
  number: string;
  section?: string;
  rocFiling?: string;
  /** Optional — shown only when isDirectCTC=true (Resolution Builder) */
  preamble?: string;
}

/* ── Signatory ─────────────────────────────────────────────────── */
export interface CtcSignatory {
  name: string;
  designation: string;
  din?: string;
}

/* ── Main params ───────────────────────────────────────────────── */
export interface CtcParams {
  company: CtcCompany;
  meeting: CtcMeeting;
  resolution: CtcResolution;
  /** 1-based index for "CTC X of Y" */
  ctcIndex: number;
  ctcTotal: number;
  signatories: CtcSignatory[];
  /** Whether to render company letterhead at top */
  printOnLetterhead?: boolean;
  /** true = Resolution Builder (standalone), false/absent = extract from minutes */
  isDirectCTC?: boolean;
}

/* ══════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════ */

function fmtDate(d: string): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return d;
  }
}

/** "Extract of Minutes of Board Meeting No. BM-001 held on..." */
function meetingHeaderLine(meeting: CtcMeeting, companyName: string): string {
  const date = fmtDate(meeting.meetingDate);
  const timeVenue = [
    meeting.meetingTime ? `at ${meeting.meetingTime}` : "",
    meeting.venue       ? `at ${meeting.venue}`       : "",
  ].filter(Boolean).join(" ");

  switch (meeting.meetingType) {
    case "board":
      return `Extract of Minutes of ${meeting.meetingTypeLabel} No. ${meeting.meetingSerial || "—"} held on ${date}${timeVenue ? " " + timeVenue : ""}`;
    case "agm":
      return `Extract of Minutes of ${meeting.meetingTypeLabel} of <strong>${companyName}</strong> held on ${date}${timeVenue ? " " + timeVenue : ""}`;
    case "egm":
      return `Extract of Minutes of ${meeting.meetingTypeLabel} of <strong>${companyName}</strong> held on ${date}${timeVenue ? " " + timeVenue : ""}`;
    case "committee":
      return `Extract of Minutes of ${meeting.meetingTypeLabel} No. ${meeting.meetingSerial || "—"} held on ${date}${timeVenue ? " " + timeVenue : ""}`;
  }
}

/** Badge label + color based on meeting type + resolution type */
function resolutionBadge(meeting: CtcMeeting, resType: "ordinary" | "special" | "none"): {
  label: string; bg: string; color: string; borderColor: string;
} {
  if (resType === "none") {
    return { label: "NOTING ITEM", bg: "#f1f5f9", color: "#475569", borderColor: "#cbd5e1" };
  }

  switch (meeting.meetingType) {
    case "board":
      return resType === "ordinary"
        ? { label: "✅ ORDINARY BOARD RESOLUTION", bg: "#eff6ff", color: "#1e40af", borderColor: "#1d4ed8" }
        : { label: "⚡ SPECIAL RESOLUTION",        bg: "#fffbeb", color: "#92400e", borderColor: "#f59e0b" };
    case "agm":
    case "egm":
      return resType === "ordinary"
        ? { label: "✅ ORDINARY RESOLUTION — Members", bg: "#f0fdf4", color: "#166534", borderColor: "#16a34a" }
        : { label: "⚡ SPECIAL RESOLUTION — Members",  bg: "#fffbeb", color: "#92400e", borderColor: "#f59e0b" };
    case "committee":
      return { label: "📋 COMMITTEE DECISION / RECOMMENDATION", bg: "#faf5ff", color: "#6b21a8", borderColor: "#9333ea" };
  }
}

/** Certification line at bottom */
function certificationLine(
  meeting: CtcMeeting,
  resolution: CtcResolution,
  companyName: string,
  cin?: string,
): string {
  const date   = fmtDate(meeting.meetingDate);
  const cinStr = cin ? ` (CIN: ${cin})` : "";
  const resTypeWord = resolution.type === "special" ? "Special" : resolution.type === "none" ? "" : "Ordinary";

  switch (meeting.meetingType) {
    case "board":
      return `Certified to be a True Copy of the <strong>${resTypeWord} Resolution</strong> passed at the <strong>${meeting.meetingTypeLabel} No. ${meeting.meetingSerial || "—"}</strong> of <strong>${companyName}</strong>${cinStr} held on <strong>${date}</strong>.`;
    case "agm":
      return `Certified to be a True Copy of the <strong>${resTypeWord} Resolution</strong> passed at the <strong>${meeting.meetingTypeLabel}</strong> of <strong>${companyName}</strong>${cinStr} held on <strong>${date}</strong>.`;
    case "egm":
      return `Certified to be a True Copy of the <strong>${resTypeWord} Resolution</strong> passed at the <strong>${meeting.meetingTypeLabel}</strong> of <strong>${companyName}</strong>${cinStr} held on <strong>${date}</strong>.`;
    case "committee":
      return `Certified to be a True Copy of the Decision/Recommendation made at the <strong>${meeting.meetingTypeLabel} No. ${meeting.meetingSerial || "—"}</strong> of <strong>${companyName}</strong>${cinStr} held on <strong>${date}</strong>.`;
  }
}

/** Signatory block HTML — always shows Name, Designation, DIN, Date, Place */
function signatoryBlock(signatories: CtcSignatory[], chairmanFallback?: string): string {
  const sigs = signatories.length > 0
    ? signatories
    : [{ name: chairmanFallback || "___________", designation: "Director", din: "" }];

  const colWidth = sigs.length <= 2 ? "45%" : sigs.length === 3 ? "30%" : "22%";

  return sigs.map(s => `
    <div style="text-align:center;width:${colWidth};min-width:130px;">
      <div style="border-top:1.5px solid #1e3a5f;padding-top:8px;">
        <p style="font-size:11px;font-weight:700;color:#1e293b;margin:0 0 3px 0;">${s.name || "___________"}</p>
        <p style="font-size:10.5px;color:#475569;margin:0 0 4px 0;">${s.designation || "Director"}</p>
        <p style="font-size:10px;color:#374151;margin:0 0 3px 0;">DIN: ${s.din || "___________"}</p>
        <p style="font-size:10px;color:#374151;margin:0 0 3px 0;">Date: _______________</p>
        <p style="font-size:10px;color:#374151;margin:0 0 0 0;">Place: _______________</p>
      </div>
    </div>`).join("");
}

/* ══════════════════════════════════════════════════════════════════
   MAIN FUNCTION — generates ONE CTC page
══════════════════════════════════════════════════════════════════ */
export function generateCtcPage(params: CtcParams): string {
  const { company, meeting, resolution, ctcIndex, ctcTotal, signatories, printOnLetterhead = true, isDirectCTC = false } = params;

  const badge       = resolutionBadge(meeting, resolution.type);
  const headerLine  = isDirectCTC
    ? `Board Resolution — Standalone Record (${meeting.meetingTypeLabel})`
    : meetingHeaderLine(meeting, company.companyName);
  const certLine    = certificationLine(meeting, resolution, company.companyName, company.cin);

  const letterhead = printOnLetterhead ? `
    <div style="text-align:center;border-bottom:2px solid #1e3a5f;padding-bottom:12px;margin-bottom:16px;">
      <h2 style="margin:0;font-size:17px;font-weight:900;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;">${company.companyName || "[COMPANY NAME]"}</h2>
      ${company.cin        ? `<p style="margin:3px 0 0;font-size:10px;color:#475569;">CIN: ${company.cin}</p>` : ""}
      ${company.regAddress ? `<p style="margin:2px 0 0;font-size:10px;color:#475569;">${company.regAddress}</p>` : ""}
      ${company.email      ? `<p style="margin:2px 0 0;font-size:10px;color:#475569;">${company.email}${company.mobile ? " | " + company.mobile : ""}</p>` : ""}
    </div>` : "";

  const preambleBlock = (isDirectCTC && resolution.preamble) ? `
    <div style="margin-bottom:14px;">
      <p style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin:0 0 5px 0;">Background / Preamble</p>
      <p style="font-size:11px;line-height:1.8;color:#374151;text-align:justify;margin:0;">${resolution.preamble}</p>
    </div>` : "";

  // ROC Filing warning intentionally omitted from CTC — it is an internal reminder only, not part of a legal document
  const rocBlock = "";

  return `
  <div style="page-break-before:always;padding:0;width:100%;max-width:100%;">
    ${letterhead}

    <div style="text-align:right;margin-bottom:10px;">
      <p style="font-size:9px;color:#94a3b8;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin:0;">
        CTC ${ctcIndex} of ${ctcTotal}
      </p>
    </div>

    <div style="text-align:center;margin-bottom:14px;">
      <h3 style="font-size:13px;font-weight:900;color:#1e3a5f;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 2px 0;border:2px solid #1e3a5f;display:inline-block;padding:4px 22px;">
        CERTIFIED TRUE COPY
      </h3>
      <p style="font-size:10px;color:#475569;margin:7px 0 0 0;font-style:italic;line-height:1.5;">
        ${headerLine}
      </p>
    </div>

    <div style="border-top:1px solid #e2e8f0;margin-bottom:12px;"></div>

    <div style="background:${badge.bg};border:1.5px solid ${badge.borderColor};border-radius:5px;padding:9px 14px;margin-bottom:12px;">
      <p style="font-size:10px;font-weight:700;color:${badge.color};text-transform:uppercase;margin:0 0 3px 0;letter-spacing:0.5px;">
        ${badge.label} &nbsp;—&nbsp; Resolution No. ${resolution.number}
      </p>
      <p style="font-size:12px;font-weight:800;color:#1e293b;margin:0 0 2px 0;">${resolution.title}</p>
      ${resolution.section ? `<p style="font-size:10px;color:#6b7280;margin:2px 0 0 0;">${resolution.section}</p>` : ""}
    </div>

    ${preambleBlock}

    <div style="border-left:4px solid ${badge.borderColor};padding:12px 16px;margin-bottom:4px;background:#fafafa;">
      <p style="font-size:11.5px;line-height:1.85;color:#1a1a1a;margin:0;white-space:pre-wrap;text-align:justify;">${resolution.text}</p>
    </div>

    ${rocBlock}

    <div style="border-top:1.5px dashed #cbd5e1;padding-top:12px;margin-top:16px;margin-bottom:18px;">
      <p style="font-size:11px;line-height:1.8;color:#1e293b;margin:0 0 6px 0;text-align:justify;">
        ${certLine}
      </p>
      <p style="font-size:11px;color:#1e293b;margin:0;font-weight:600;">
        For ${company.companyName || "[COMPANY NAME]"}
      </p>
    </div>

    <div style="display:flex;justify-content:space-around;flex-wrap:wrap;gap:20px;margin-top:22px;">
      ${signatoryBlock(signatories)}
    </div>

    <p style="font-size:9px;color:#94a3b8;text-align:center;margin-top:22px;border-top:1px solid #e2e8f0;padding-top:8px;">
      Generated by ComplianceSearch.in &nbsp;|&nbsp; Verify against original minute book before use.
    </p>
  </div>`;
}

/* ══════════════════════════════════════════════════════════════════
   WRAPPER — wraps multiple CTC pages in a full HTML document
   Use this when printing standalone (not embedded in minutes HTML)
══════════════════════════════════════════════════════════════════ */
export function generateCtcDocument(pages: CtcParams[]): string {
  if (pages.length === 0) return "";
  const bodyPages = pages.map(p => generateCtcPage(p)).join("");
  const title = pages[0]
    ? `CTCs — ${pages[0].company.companyName} ${pages[0].meeting.meetingTypeLabel} ${pages[0].meeting.meetingSerial || ""}`
    : "CTCs";

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>${title}</title>
<style>
  @page { size: A4; margin: 20mm 18mm; }
  *, *::before, *::after { box-sizing: border-box; }
  html, body { width: 100%; max-width: 100%; overflow-x: hidden; }
  body  { font-family: "Times New Roman", Times, serif; font-size: 12px; color: #1a1a1a; margin: 0; padding: 0; }
  p, h2, h3 { overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  body > div:first-child { page-break-before: auto !important; }
</style>
</head><body>${bodyPages}</body></html>`;
}
