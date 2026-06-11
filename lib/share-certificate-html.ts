/**
 * Shared Share Certificate HTML Generator
 * Used by:
 *   - app/tools/documents/share-certificate/page.tsx  (generation tool)
 *   - app/dashboard/clients/[id]/ClientDetailClient.tsx (print from client tab)
 *
 * Format: Form SH-1, Companies Act 2013, Section 46
 * Layout: A4 portrait, double border, classic legal style
 */

/* ── Public interfaces ─────────────────────────────────── */
export interface CertCompany {
  companyName: string;
  cin: string;
  regAddress: string;
  shareClass: string;       // "Equity" | "Preference"
  nominalValue: string;     // e.g. "10"
  paidUpValue: string;      // e.g. "10"
  issueDate: string;        // YYYY-MM-DD
  issuePlace: string;       // e.g. "Patna"
}

export interface CertShareholder {
  name: string;
  din: string;              // DIN for directors, PAN/ID for others
  shares: number;
}

export interface CertSigner {
  name: string;
  designation: string;
  din?: string;
}

export interface CertRange {
  folioNo: string;
  certNo: string;
  certWord: string;
  from: number;
  to: number;
  fromPad: string;
  toPad: string;
}

/* ── Utility helpers ───────────────────────────────────── */
const ONES = ["","ONE","TWO","THREE","FOUR","FIVE","SIX","SEVEN","EIGHT","NINE",
  "TEN","ELEVEN","TWELVE","THIRTEEN","FOURTEEN","FIFTEEN","SIXTEEN","SEVENTEEN","EIGHTEEN","NINETEEN"];
const TENS = ["","","TWENTY","THIRTY","FORTY","FIFTY","SIXTY","SEVENTY","EIGHTY","NINETY"];

function convertHundreds(n: number): string {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n/10)] + (n%10 ? " "+ONES[n%10] : "");
  return ONES[Math.floor(n/100)] + " HUNDRED" + (n%100 ? " "+convertHundreds(n%100) : "");
}

export function numberToWords(n: number): string {
  if (!n || n === 0) return "ZERO";
  if (n >= 10000000) return convertHundreds(Math.floor(n/10000000)) + " CRORE" + (n%10000000 ? " "+numberToWords(n%10000000) : "");
  if (n >= 100000)   return convertHundreds(Math.floor(n/100000))   + " LAKH"  + (n%100000   ? " "+numberToWords(n%100000)   : "");
  if (n >= 1000)     return convertHundreds(Math.floor(n/1000))     + " THOUSAND" + (n%1000  ? " "+convertHundreds(n%1000)   : "");
  return convertHundreds(n);
}

function toOrdinalWord(n: number): string {
  const w = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten",
    "Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen","Twenty",
    "Twenty-One","Twenty-Two","Twenty-Three","Twenty-Four","Twenty-Five"];
  return w[n] || n.toString();
}

export function padNum(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

export function formatNum(n: number): string {
  return n.toLocaleString("en-IN");
}

export function fmtDate(d: string): { day: string; month: string; year: string; ordDay: string } {
  if (!d) return { day:"___", month:"___________", year:"____", ordDay:"___" };
  const dt = new Date(d);
  const day = dt.getDate();
  const months = ["January","February","March","April","May","June",
    "July","August","September","October","November","December"];
  const sfx = day===1||day===21||day===31?"st":day===2||day===22?"nd":day===3||day===23?"rd":"th";
  return { day: String(day), month: months[dt.getMonth()], year: String(dt.getFullYear()), ordDay: day+sfx };
}

/** Compute distinctive number ranges for a list of shareholders */
export function computeCertRanges(
  shareholders: { shares: number }[],
  startNo: number
): CertRange[] {
  let cursor = startNo;
  return shareholders.map((s, i) => {
    const from = cursor;
    const to   = cursor + (s.shares || 0) - 1;
    cursor     = to + 1;
    return {
      folioNo:  padNum(i+1),
      certNo:   padNum(i+1),
      certWord: toOrdinalWord(i+1),
      from,
      to,
      fromPad:  String(from).padStart(5,"0"),
      toPad:    String(to),
    };
  });
}

/* ── CSS (shared between all generators) ──────────────── */
const CERT_CSS = `
  @page { size: A4; margin: 0; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Times New Roman", Times, serif;
    background: #fff; color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 210mm; height: 297mm;
    page-break-after: always; page-break-inside: avoid;
    padding: 10mm 12mm;
    display: flex; flex-direction: column;
  }
  .page-last { page-break-after: avoid; }
  .outer-border {
    flex: 1; border: 2px solid #000; padding: 4px;
    display: flex; flex-direction: column;
  }
  .inner-border {
    flex: 1; border: 1px solid #444; padding: 7mm 9mm;
    display: flex; flex-direction: column;
  }
  .sp1  { flex: 1; }
  .sp05 { flex: 0.5; }
  .sp15 { flex: 1.5; }
  .sp2  { flex: 2; }
  .center { text-align: center; }
  .bold   { font-weight: bold; }
  .upper  { text-transform: uppercase; }
  .italic { font-style: italic; }
  .cert-header { text-align: center; }
  .form-no {
    font-size: 10pt; font-weight: bold;
    letter-spacing: 3px; text-transform: uppercase;
  }
  .cert-title {
    font-size: 19pt; font-weight: 900;
    letter-spacing: 4px; text-transform: uppercase; margin: 4px 0 5px;
  }
  .ornament {
    border: none; border-top: 2.5px double #000;
    margin: 5px auto 6px; width: 55%;
  }
  .statutory {
    font-size: 9.5pt; font-style: italic; color: #111; line-height: 1.55;
  }
  .company-name {
    font-size: 15pt; font-weight: 900;
    letter-spacing: 1.5px; text-transform: uppercase; text-align: center;
  }
  .company-meta {
    font-size: 10.5pt; text-align: center; line-height: 1.65; margin-top: 4px;
  }
  .cert-text {
    border: 1px solid #555; padding: 7px 11px;
    font-size: 10.5pt; text-align: justify; line-height: 1.6; background: #fafafa;
  }
  .equity-wrap {
    border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 5px 0;
  }
  .equity-row {
    display: flex; justify-content: space-between; align-items: baseline;
    font-size: 11pt; font-weight: bold; text-transform: uppercase;
    letter-spacing: 0.5px; line-height: 1.7;
  }
  .main-table { width: 100%; border-collapse: collapse; }
  .main-table td {
    border: 1px solid #333; padding: 6px 10px;
    font-size: 10.5pt; vertical-align: middle;
  }
  .main-table .lbl {
    font-weight: bold; white-space: nowrap; background: #f2f2f2; width: 34%;
  }
  .main-table .val-name {
    font-weight: bold; font-size: 12pt;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .main-table .val-shares { font-weight: bold; text-transform: uppercase; font-size: 11pt; }
  .given { font-size: 10.5pt; line-height: 1.6; }
  .given-line {
    display: inline-block; border-bottom: 1px solid #000;
    padding: 0 4px; min-width: 30px; text-align: center;
  }
  .sig-row { display: flex; gap: 30px; align-items: flex-end; }
  .sig-block { flex: 1; text-align: center; }
  .sig-line { border-bottom: 1.5px solid #000; height: 45px; margin-bottom: 5px; }
  .sig-name { font-size: 10pt; font-weight: bold; text-transform: uppercase; }
  .sig-desig { font-size: 9.5pt; }
  .cert-note {
    font-size: 9pt; font-style: italic;
    border-top: 1px solid #bbb; padding-top: 5px; margin-top: 6px;
  }
  .memo-outer {
    flex: 1; border: 2px solid #000; padding: 4px;
    display: flex; flex-direction: column;
  }
  .memo-inner {
    flex: 1; border: 1px solid #444; padding: 7mm 9mm;
    display: flex; flex-direction: column;
  }
  .memo-title {
    text-align: center; font-size: 12pt; font-weight: 900;
    text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 3mm;
  }
  .memo-sub { font-size: 8.5pt; margin-bottom: 4mm; }
  .memo-table-wrap { flex: 1; display: flex; flex-direction: column; }
  .memo-table { width: 100%; height: 100%; border-collapse: collapse; }
  .memo-table th {
    border: 1px solid #444; padding: 4px 5px;
    font-size: 8.5pt; font-weight: bold; background: #f0f0f0; text-align: center;
  }
  .memo-table td { border: 1px solid #888; padding: 2px 4px; }
  .memo-table tbody tr { height: 1%; }
`;

/* ── Single certificate page HTML ─────────────────────── */
function certPageHtml(
  company: CertCompany,
  sh: CertShareholder,
  range: CertRange,
  signers: CertSigner[],
): string {
  const dateInfo = fmtDate(company.issueDate);
  const words    = sh.shares > 0 ? numberToWords(sh.shares) : "___________";
  const numFmt   = sh.shares > 0 ? formatNum(sh.shares) : "___";

  const sigHtml = signers.length > 0
    ? signers.map(d => `
        <div class="sig-block">
          <div class="sig-line"></div>
          <div class="sig-name">${d.name}</div>
          <div class="sig-desig">${d.designation}</div>
          ${d.din ? `<div style="font-size:8pt;color:#333;">(DIN: ${d.din})</div>` : ""}
        </div>`).join("")
    : `<div class="sig-block"><div class="sig-line"></div><div class="sig-desig">Director</div></div>
       <div class="sig-block"><div class="sig-line"></div><div class="sig-desig">Director</div></div>`;

  const dinHtml = sh.din
    ? ` <span style="font-size:8.5pt;font-weight:normal;">(DIN/PAN: ${sh.din})</span>`
    : "";

  return `
  <div class="page">
    <div class="outer-border">
      <div class="inner-border">

        <!-- ── HEADER ── -->
        <div class="cert-header">
          <div class="form-no">Form No. SH-1</div>
          <hr class="ornament">
          <div class="cert-title">Share Certificate</div>
          <div class="statutory">[Pursuant to sub-section (3) of section 46 of the Companies Act, 2013 and Rule 5(2) of<br>the Companies (Share Capital and Debentures) Rules 2014]</div>
        </div>

        <div class="sp1"></div>

        <!-- ── COMPANY ── -->
        <div>
          <div class="company-name">${company.companyName || "[Company Name]"}</div>
          <div class="company-meta">
            <strong>CIN: ${company.cin || "___________________"}</strong><br>
            (Incorporated under the Companies Act, 2013)<br>
            <strong>Registered Office:</strong> ${company.regAddress || "[Registered Office Address]"}
          </div>
        </div>

        <div class="sp1"></div>

        <!-- ── CERTIFICATION TEXT ── -->
        <div class="cert-text">
          <strong>"THIS IS TO CERTIFY</strong> that the person(s) named in this certificate is/are the Registered
          Holder(s) of the within mentioned share(s) bearing the distinctive number(s) herein specified in the
          above named Company subject to the Memorandum and Article of Association of the Company and
          the amount endorsed herein has been paid up on each such shares."
        </div>

        <div class="sp05"></div>

        <!-- ── EQUITY LINES ── -->
        <div class="equity-wrap">
          <div class="equity-row">
            <span>${company.shareClass} Shares Each of</span>
            <span>Rupees ${company.nominalValue || "10"}.00 (Nominal Value)</span>
          </div>
          <div class="equity-row">
            <span>Amount Paid-up Per Share</span>
            <span>Rupees ${company.paidUpValue || "10"}.00</span>
          </div>
        </div>

        <div class="sp05"></div>

        <!-- ── MAIN TABLE ── -->
        <table class="main-table">
          <tr>
            <td class="lbl">Registered Folio No.</td>
            <td style="width:16%;"><strong>${range.folioNo}</strong></td>
            <td class="lbl" style="width:28%;">Certificate No.</td>
            <td><strong>${range.certNo} (${range.certWord})</strong></td>
          </tr>
          <tr>
            <td class="lbl">Name(s) of the Holder(s)</td>
            <td colspan="3" class="val-name">${sh.name || "___________"}${dinHtml}</td>
          </tr>
          <tr>
            <td class="lbl">Number of Share(s) held</td>
            <td colspan="3" class="val-shares">${words}&nbsp;&nbsp;&nbsp;*** ${numFmt} ***</td>
          </tr>
          <tr>
            <td class="lbl">Distinctive No(s)</td>
            <td colspan="3" style="font-size:10pt;font-weight:bold;">
              ${sh.shares > 0 ? `${range.fromPad} &ndash; ${range.toPad}` : "_____ &ndash; _____"}
            </td>
          </tr>
        </table>

        <div class="sp1"></div>

        <!-- ── GIVEN UNDER ── -->
        <div class="given">
          <strong>GIVEN</strong> under the Common Seal of the Company this
          <span class="given-line">&nbsp;${dateInfo.ordDay}&nbsp;</span> day of
          <span class="given-line">&nbsp;${dateInfo.month}&nbsp;</span>
          <span class="given-line">&nbsp;${dateInfo.year}&nbsp;</span>
          at <span class="given-line">&nbsp;${company.issuePlace || "___________"}&nbsp;</span>.
        </div>

        <div class="sp2"></div>

        <!-- ── SIGNATURES ── -->
        <div class="sig-row">${sigHtml}</div>

        <!-- ── NOTE ── -->
        <div class="cert-note">
          <strong>Note:</strong> No transfer of Shares comprised in the Certificate can be registered unless accompanied by this Certificate.
        </div>

      </div>
    </div>
  </div>`;
}

/* ── Memorandum page HTML ──────────────────────────────── */
function memoPageHtml(
  shareClass: string,
  companyName: string,
  sh: CertShareholder,
  certNo: string,
  isLast: boolean
): string {
  const memoRows = Array.from({ length: 28 }, () => `
    <tr>
      <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
      <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
    </tr>`).join("");

  return `
  <div class="page${isLast ? " page-last" : ""}">
    <div class="memo-outer">
      <div class="memo-inner">
        <div class="memo-title">Memorandum of Transfers of ${shareClass} Shares</div>
        <hr class="ornament">
        <div class="memo-sub">
          <strong>Company:</strong> ${companyName || "___"} &nbsp;&nbsp;
          <strong>Certificate No.:</strong> ${certNo} &nbsp;&nbsp;
          <strong>Holder:</strong> ${sh.name || "___________"}
        </div>
        <div class="memo-table-wrap">
          <table class="memo-table">
            <thead>
              <tr>
                <th style="width:12%;">Date</th>
                <th style="width:14%;">Transfer Number</th>
                <th style="width:14%;">Register Folio</th>
                <th>Name(s) of the Transferee(s)</th>
                <th style="width:10%;">Initials</th>
                <th style="width:16%;">Authorised Signatory</th>
              </tr>
            </thead>
            <tbody>${memoRows}</tbody>
          </table>
        </div>
      </div>
    </div>
  </div>`;
}

/* ══════════════════════════════════════════════════════
   MAIN EXPORT: Full Share Certificate HTML
   Generates one certificate page + one memorandum page per shareholder
══════════════════════════════════════════════════════ */
export function generateShareCertificateHTML(
  company: CertCompany,
  shareholders: CertShareholder[],
  ranges: CertRange[],
  signers: CertSigner[],
): string {
  const pages = shareholders.map((sh, idx) => {
    const isLast = idx === shareholders.length - 1;
    return (
      certPageHtml(company, sh, ranges[idx], signers) +
      memoPageHtml(company.shareClass, company.companyName, sh, ranges[idx].certNo, isLast)
    );
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Share Certificates — ${company.companyName || "Company"}</title>
<style>${CERT_CSS}</style>
</head>
<body>${pages}</body>
</html>`;
}
