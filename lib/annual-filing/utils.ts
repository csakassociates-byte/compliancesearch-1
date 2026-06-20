/**
 * Annual Filing — Shared utility helpers
 */

/** Format date from YYYY-MM-DD or DD/MM/YYYY → "1st April, 2024" */
export function fmtDate(raw: string): string {
  if (!raw) return "";
  let d: Date | null = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    d = new Date(raw + "T00:00:00");
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [dd, mm, yyyy] = raw.split("/");
    d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
  }
  if (!d || isNaN(d.getTime()) || d.getFullYear() < 1950 || d.getDate() === 0) return "";
  const day = d.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? "st"
               : day === 2 || day === 22 ? "nd"
               : day === 3 || day === 23 ? "rd" : "th";
  const months = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];
  return `${day}${suffix} ${months[d.getMonth()]}, ${d.getFullYear()}`;
}

/** Format number with Indian comma formatting: 12,34,567 */
export function fmtIndian(n: number): string {
  if (isNaN(n)) return "0";
  const s = Math.abs(Math.round(n)).toString();
  if (s.length <= 3) return (n < 0 ? "-" : "") + s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
  return (n < 0 ? "-" : "") + formatted;
}

/** Parse "12,34,567" or "1234567" → number */
export function parseIndian(s: string): number {
  if (!s) return 0;
  return parseFloat(s.replace(/,/g, "")) || 0;
}

/** Format rupee amount: "₹12,34,567" */
export function fmtRs(s: string): string {
  const n = parseIndian(s);
  return "₹" + fmtIndian(n);
}

/** Ordinal: 1 → "1st", 2 → "2nd" etc. */
export function ordinal(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

/** FY label: "2024-25" → "2024-2025" */
export function fyFull(fy: string): string {
  const [start, end] = fy.split("-");
  const endFull = start.slice(0, 2) + end;
  return `${start}-${endFull}`;
}

/** FY year end: "2024-25" → "2025" */
export function fyEndYear(fy: string): string {
  const [start, end] = fy.split("-");
  return start.slice(0, 2) + end;
}

/** FY year start: "2024-25" → "2024" */
export function fyStartYear(fy: string): string {
  return fy.split("-")[0];
}

/** Common print page CSS for all generated documents */
export function commonPrintCSS(): string {
  return `
    @page { size: A4 portrait; margin: 20mm; }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 12pt;
      color: #000;
      background: #fff;
      line-height: 1.6;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    p, li, td, th, span, div, h1, h2, h3 {
      overflow-wrap: break-word;
      word-wrap: break-word;
      word-break: break-word;
    }

    /* Screen: simulate A4 paper — 170mm = 210mm minus 20mm margins each side */
    @media screen {
      html { background: #c8c8c8; }
      body { width: 170mm; margin: 20mm auto; }
    }
    /* Print: 170mm body centered — @page margin:20mm handles all 4 sides every page */
    @media print {
      body { width: 170mm; margin: 0 auto; }
    }

    /* ── Typography ── */
    h1 { font-size: 14pt; font-weight: bold; text-align: center; margin-bottom: 6pt; }
    h2 {
      font-size: 12pt; font-weight: bold;
      margin-top: 14pt; margin-bottom: 5pt;
      border-bottom: 0.5pt solid #888; padding-bottom: 2pt;
    }
    h3 { font-size: 11pt; font-weight: bold; margin-top: 10pt; margin-bottom: 4pt; }
    p  { margin-bottom: 8pt; text-align: justify; }
    hr { border: none; border-top: 1pt solid #333; margin: 14pt 0; }
    sup { font-size: 8pt; vertical-align: super; line-height: 0; }

    /* ── Tables ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10pt;
      font-size: 11pt;
      table-layout: fixed;
    }
    th {
      background: #f0f0f0;
      font-weight: bold;
      padding: 5pt 7pt;
      border: 1px solid #444;
      text-align: left;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    td {
      padding: 4pt 7pt;
      border: 1px solid #444;
      vertical-align: top;
      overflow-wrap: break-word;
      word-break: break-word;
    }

    /* ── Utility classes ── */
    .center    { text-align: center; }
    .right     { text-align: right; }
    .bold      { font-weight: bold; }
    .italic    { font-style: italic; }
    .underline { text-decoration: underline; }
    .mt-8  { margin-top: 8pt; }
    .mt-16 { margin-top: 16pt; }
    .mt-24 { margin-top: 24pt; }
    .mb-4  { margin-bottom: 4pt; }
    .page-break  { page-break-before: always; }
    .no-break    { page-break-inside: avoid; }

    /* ── Document header block ── */
    .header-block { text-align: center; margin-bottom: 16pt; }
    .header-block .company-name {
      font-size: 14pt; font-weight: bold; text-transform: uppercase;
    }
    .header-block .cin-line {
      font-size: 9.5pt; margin-top: 2pt;
    }
    .header-block .doc-title {
      font-size: 13pt; font-weight: bold; margin-top: 10pt;
      text-decoration: underline; letter-spacing: 0.5pt;
    }
    .header-block .fy-line { font-size: 10.5pt; margin-top: 3pt; }

    /* ── Signature block ── */
    .sig-block   { margin-top: 28pt; }
    .sig-row     { display: flex; justify-content: space-between; gap: 16pt; margin-top: 36pt; }
    .sig-col     { flex: 1; min-width: 0; }
    .sig-col .sig-line { border-top: 1px solid #000; padding-top: 4pt; margin-top: 36pt; }

    /* ── Lists ── */
    ol { padding-left: 22pt; margin-bottom: 8pt; }
    ol li { margin-bottom: 5pt; text-align: justify; }
    ul { padding-left: 22pt; margin-bottom: 8pt; }
    ul li { margin-bottom: 5pt; text-align: justify; }

    .indent      { margin-left: 20pt; }
    .section-num { font-weight: bold; }
  `;
}

/** Generate a single signature column div (with optional embedded signature image) */
export function sigCol(sig: { name?: string; din?: string; designation?: string; signatureBase64?: string }, opts?: { width?: string }): string {
  const imgHtml = sig.signatureBase64
    ? `<img src="data:image/jpeg;base64,${sig.signatureBase64}" style="height:40pt;max-width:130pt;display:block;object-fit:contain;">`
    : "";
  const lineMargin = sig.signatureBase64 ? "margin-top:4pt" : "";
  const colStyle   = opts?.width ? ` style="width:${opts.width}"` : "";
  return `<div class="sig-col"${colStyle}>
  ${imgHtml}
  <div class="sig-line"${lineMargin ? ` style="${lineMargin}"` : ""}>
    <strong>${sig.name || "________________"}</strong><br>
    ${sig.designation || "Director"}<br>
    DIN: ${sig.din || "________________"}
  </div>
</div>`;
}

/** Wrap HTML content in a full printable page */
export function wrapPage(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>${commonPrintCSS()}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}
