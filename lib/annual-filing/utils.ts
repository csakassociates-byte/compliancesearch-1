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
    @page { size: A4 portrait; margin: 20mm 20mm 20mm 25mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Times New Roman", Times, serif; font-size: 12pt; color: #000; background: #fff; line-height: 1.6; }
    h1 { font-size: 14pt; font-weight: bold; text-align: center; margin-bottom: 4pt; }
    h2 { font-size: 13pt; font-weight: bold; margin-bottom: 6pt; }
    h3 { font-size: 12pt; font-weight: bold; margin-bottom: 4pt; }
    p { margin-bottom: 8pt; text-align: justify; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10pt; font-size: 11pt; }
    th { background: #f2f2f2; font-weight: bold; padding: 6pt 8pt; border: 1px solid #333; text-align: left; }
    td { padding: 5pt 8pt; border: 1px solid #333; vertical-align: top; }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: bold; }
    .underline { text-decoration: underline; }
    .mt-8 { margin-top: 8pt; }
    .mt-16 { margin-top: 16pt; }
    .mt-24 { margin-top: 24pt; }
    .mb-4 { margin-bottom: 4pt; }
    .page-break { page-break-before: always; }
    .no-break { page-break-inside: avoid; }
    .header-block { text-align: center; margin-bottom: 20pt; }
    .header-block .company-name { font-size: 15pt; font-weight: bold; text-transform: uppercase; }
    .header-block .cin-line { font-size: 10pt; margin-top: 3pt; }
    .header-block .doc-title { font-size: 13pt; font-weight: bold; margin-top: 10pt; text-decoration: underline; }
    .header-block .fy-line { font-size: 11pt; margin-top: 3pt; }
    .sig-block { margin-top: 30pt; }
    .sig-row { display: flex; justify-content: space-between; margin-top: 40pt; }
    .sig-col { width: 45%; }
    .sig-col .sig-line { border-top: 1px solid #000; padding-top: 4pt; margin-top: 40pt; }
    ol { padding-left: 20pt; margin-bottom: 8pt; }
    ol li { margin-bottom: 6pt; }
    ul { padding-left: 20pt; margin-bottom: 8pt; }
    ul li { margin-bottom: 4pt; }
    .indent { margin-left: 20pt; }
    .section-num { font-weight: bold; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;
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
