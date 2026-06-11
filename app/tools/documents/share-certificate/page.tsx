"use client";
import { useState, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { injectPreviewWatermark } from "@/lib/preview-protection";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import CompanyExcelUpload from "@/components/CompanyExcelUpload";
import CompanySearch from "@/components/CompanySearch";
import type { CompanyData } from "@/lib/types/company";

/* ══════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════ */
interface Shareholder {
  id: string;
  name: string;
  isDirector: boolean;
  din: string;
  shares: number;
  sharesInWords: string; // auto-computed
}

interface SigningDirector {
  name: string;
  designation: string;
  din: string;
}

interface DirectorInfo { name: string; designation: string; din: string }

interface F {
  // Step 1 — Company
  companyName: string; cin: string; regAddress: string; entityType: string;
  incorporationDate: string; paidUpCapitalStr: string; authorisedCapitalStr: string;
  // Step 2 — Share Details
  nominalValue: string; paidUpValue: string; shareClass: string;
  issueDate: string; issuePlace: string; startDistinctiveNo: number;
  // Step 3 — Shareholders
  shareholders: Shareholder[];
  // Step 4 — Signing Directors
  signingDirectors: SigningDirector[];
}

const DEFAULT: F = {
  companyName:"", cin:"", regAddress:"", entityType:"pvt_ltd",
  incorporationDate:"", paidUpCapitalStr:"", authorisedCapitalStr:"",
  nominalValue:"10", paidUpValue:"10", shareClass:"Equity",
  issueDate:"", issuePlace:"", startDistinctiveNo: 1,
  shareholders: [],
  signingDirectors: [{ name:"", designation:"Director", din:"" }, { name:"", designation:"Director", din:"" }],
};

const ENTITY_LABELS: Record<string,string> = {
  pvt_ltd:"Private Limited Company", opc:"One Person Company",
  public_ltd:"Public Limited Company", llp:"Limited Liability Partnership",
  section8:"Section 8 Company (NGO)", nidhi:"Nidhi Company", other:"Company",
};

/* ══════════════════════════════════════════════════════════════════
   NUMBER TO WORDS (Indian system)
══════════════════════════════════════════════════════════════════ */
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

function padNum(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

function formatNum(n: number): string {
  return n.toLocaleString("en-IN");
}

function fmtDate(d: string): { day: string; month: string; year: string; ordDay: string } {
  if (!d) return { day:"___", month:"___________", year:"____", ordDay:"___" };
  const dt = new Date(d);
  const day = dt.getDate();
  const months = ["January","February","March","April","May","June",
    "July","August","September","October","November","December"];
  const sfx = day===1||day===21||day===31?"st":day===2||day===22?"nd":day===3||day===23?"rd":"th";
  return { day: String(day), month: months[dt.getMonth()], year: String(dt.getFullYear()), ordDay: day+sfx };
}

/* ══════════════════════════════════════════════════════════════════
   COMPUTED SHARE RANGES
══════════════════════════════════════════════════════════════════ */
function computeRanges(shareholders: Shareholder[], startNo: number) {
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

/* ══════════════════════════════════════════════════════════════════
   PRINT STYLES (screen only — actual print uses new window)
══════════════════════════════════════════════════════════════════ */
const PRINT_CSS = ``;

/* ══════════════════════════════════════════════════════════════════
   HTML GENERATOR — Classic Legal Premium (Draft 1)
══════════════════════════════════════════════════════════════════ */
function generatePrintHTML(
  f: F,
  ranges: ReturnType<typeof computeRanges>
): string {

  const css = `
    @page { size: A4; margin: 0; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Times New Roman", Times, serif;
      background: #fff; color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ─── Page wrapper ─── */
    .page {
      width: 210mm;
      height: 297mm;
      page-break-after: always;
      page-break-inside: avoid;
      padding: 10mm 12mm;
      display: flex;
      flex-direction: column;
    }
    .page-last { page-break-after: avoid; }

    /* ─── Double border ─── */
    .outer-border {
      flex: 1;
      border: 2px solid #000;
      padding: 4px;
      display: flex;
      flex-direction: column;
    }
    .inner-border {
      flex: 1;
      border: 1px solid #444;
      padding: 7mm 9mm;
      display: flex;
      flex-direction: column;
    }

    /* ─── Spacing helpers ─── */
    .sp1 { flex: 1; }
    .sp05 { flex: 0.5; }
    .sp15 { flex: 1.5; }
    .sp2 { flex: 2; }

    /* ─── Typography ─── */
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .upper { text-transform: uppercase; }
    .italic { font-style: italic; }

    /* ─── Header section ─── */
    .cert-header { text-align: center; }
    .form-no {
      font-size: 10pt;
      font-weight: bold;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
    .cert-title {
      font-size: 19pt;
      font-weight: 900;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin: 4px 0 5px;
    }
    .ornament {
      border: none;
      border-top: 2.5px double #000;
      margin: 5px auto 6px;
      width: 55%;
    }
    .statutory {
      font-size: 9.5pt;
      font-style: italic;
      color: #111;
      line-height: 1.55;
    }

    /* ─── Company section ─── */
    .company-name {
      font-size: 15pt;
      font-weight: 900;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      text-align: center;
    }
    .company-meta {
      font-size: 10.5pt;
      text-align: center;
      line-height: 1.65;
      margin-top: 4px;
    }

    /* ─── Certification box ─── */
    .cert-text {
      border: 1px solid #555;
      padding: 7px 11px;
      font-size: 10.5pt;
      text-align: justify;
      line-height: 1.6;
      background: #fafafa;
    }

    /* ─── Equity lines ─── */
    .equity-wrap {
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      padding: 5px 0;
    }
    .equity-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.7;
    }

    /* ─── Main table ─── */
    .main-table {
      width: 100%;
      border-collapse: collapse;
    }
    .main-table td {
      border: 1px solid #333;
      padding: 6px 10px;
      font-size: 10.5pt;
      vertical-align: middle;
    }
    .main-table .lbl {
      font-weight: bold;
      white-space: nowrap;
      background: #f2f2f2;
      width: 34%;
    }
    .main-table .val-name {
      font-weight: bold;
      font-size: 12pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .main-table .val-shares {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 11pt;
    }

    /* ─── Given under ─── */
    .given { font-size: 10.5pt; line-height: 1.6; }
    .given-line { display: inline-block; border-bottom: 1px solid #000; padding: 0 4px; min-width: 30px; text-align: center; }

    /* ─── Signatures ─── */
    .sig-row {
      display: flex;
      gap: 30px;
      align-items: flex-end;
    }
    .sig-block { flex: 1; text-align: center; }
    .sig-line {
      border-bottom: 1.5px solid #000;
      height: 45px;
      margin-bottom: 5px;
    }
    .sig-name { font-size: 10pt; font-weight: bold; text-transform: uppercase; }
    .sig-desig { font-size: 9.5pt; }

    /* ─── Note ─── */
    .cert-note {
      font-size: 9pt;
      font-style: italic;
      border-top: 1px solid #bbb;
      padding-top: 5px;
      margin-top: 6px;
    }

    /* ─── Memo page ─── */
    .memo-outer {
      flex: 1;
      border: 2px solid #000;
      padding: 4px;
      display: flex;
      flex-direction: column;
    }
    .memo-inner {
      flex: 1;
      border: 1px solid #444;
      padding: 7mm 9mm;
      display: flex;
      flex-direction: column;
    }
    .memo-title {
      text-align: center;
      font-size: 12pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 3mm;
    }
    .memo-sub {
      font-size: 8.5pt;
      margin-bottom: 4mm;
    }
    .memo-table-wrap { flex: 1; display: flex; flex-direction: column; }
    .memo-table {
      width: 100%;
      height: 100%;
      border-collapse: collapse;
    }
    .memo-table th {
      border: 1px solid #444;
      padding: 4px 5px;
      font-size: 8.5pt;
      font-weight: bold;
      background: #f0f0f0;
      text-align: center;
    }
    .memo-table td {
      border: 1px solid #888;
      padding: 2px 4px;
    }
    .memo-table tbody tr { height: 1%; }
  `;

  function certPage(
    sh: Shareholder,
    range: ReturnType<typeof computeRanges>[0],
    isLastPage: boolean
  ): string {
    const dateInfo = fmtDate(f.issueDate);
    const words    = sh.shares > 0 ? numberToWords(sh.shares) : "___________";
    const numFmt   = sh.shares > 0 ? formatNum(sh.shares)     : "___";
    const fromPad  = String(range.from).padStart(5, "0");
    const toPad    = String(range.to);
    const signers  = f.signingDirectors.filter(d => d.name);

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
    <div class="page${isLastPage ? "" : ""}">
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
            <div class="company-name">${f.companyName || "[Company Name]"}</div>
            <div class="company-meta">
              <strong>CIN: ${f.cin || "___________________"}</strong><br>
              (Incorporated under the Companies Act, 2013)<br>
              <strong>Registered Office:</strong> ${f.regAddress || "[Registered Office Address]"}
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
              <span>${f.shareClass} Shares Each of</span>
              <span>Rupees ${f.nominalValue || "10"}.00 (Nominal Value)</span>
            </div>
            <div class="equity-row">
              <span>Amount Paid-up Per Share</span>
              <span>Rupees ${f.paidUpValue || "10"}.00</span>
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
                ${sh.shares > 0 ? `${fromPad} &ndash; ${toPad}` : "_____ &ndash; _____"}
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
            at <span class="given-line">&nbsp;${f.issuePlace || "___________"}&nbsp;</span>.
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

  function memoPage(sh: Shareholder, idx: number, isLast: boolean): string {
    const memoRows = Array.from({ length: 28 }, () => `
      <tr>
        <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
        <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
      </tr>`).join("");

    return `
    <div class="page${isLast ? " page-last" : ""}">
      <div class="memo-outer">
        <div class="memo-inner">
          <div class="memo-title">Memorandum of Transfers of ${f.shareClass} Shares</div>
          <hr class="ornament">
          <div class="memo-sub">
            <strong>Company:</strong> ${f.companyName || "___"} &nbsp;&nbsp;
            <strong>Certificate No.:</strong> ${String(idx+1).padStart(2,"0")} &nbsp;&nbsp;
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

  const pages = f.shareholders.map((sh, idx) => {
    const isLast = idx === f.shareholders.length - 1;
    return certPage(sh, ranges[idx], false) + memoPage(sh, idx, isLast);
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Share Certificates — ${f.companyName || "Company"}</title>
<style>${css}</style>
</head>
<body>${pages}</body>
</html>`;
}

/* ══════════════════════════════════════════════════════════════════
   UI HELPERS
══════════════════════════════════════════════════════════════════ */
const INP = "w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white";
const SEL = "w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white";

function Lbl({ c, h }: { c: React.ReactNode; h?: string }) {
  return (
    <div className="mb-1">
      <p className="text-sm font-semibold text-slate-700">{c}</p>
      {h && <p className="text-xs text-slate-400">{h}</p>}
    </div>
  );
}

function SHead({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-1">
        <span className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-extrabold text-sm shrink-0">{n}</span>
        <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
      </div>
      <p className="text-slate-500 text-sm ml-11">{sub}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MEMORANDUM PAGE COMPONENT
══════════════════════════════════════════════════════════════════ */
function MemorandumView({ f, sh, isLast }: { f: F; sh: Shareholder; isLast: boolean }) {
  const rows = 20;
  const tdS: React.CSSProperties = { border:"1px solid #555", padding:"5px 6px", fontSize:"8.5pt", minHeight:"22px" };
  const thS: React.CSSProperties = { ...tdS, fontWeight:"bold", backgroundColor:"#efefef", textAlign:"center" };
  return (
    <div className={isLast ? "print-page-last" : "print-page"}
      style={{ fontFamily:'"Times New Roman", Times, serif', fontSize:"10pt", color:"#000",
        border:"1.5px solid #333", padding:"16px 20px", maxWidth:"190mm", margin:"0 auto",
        background:"#fff" }}>
      <p style={{ fontWeight:"900", fontSize:"10.5pt", textAlign:"center", textTransform:"uppercase",
        letterSpacing:"0.8px", marginBottom:"10px" }}>
        Memorandum of Transfers of {f.shareClass} Shares
      </p>
      <p style={{ fontSize:"8.5pt", marginBottom:"8px" }}>
        <strong>Certificate No.:</strong> {sh ? String(f.shareholders.indexOf(sh)+1).padStart(2,"0") : "__"} &nbsp;&nbsp;
        <strong>Holder:</strong> {sh?.name || "___________"}
      </p>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr>
            {["Date","Transfer Number","Register Folio","Name(s) of the Transferee(s)","Initials","Authorised Signatory"].map(h => (
              <th key={h} style={thS}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {[1,2,3,4,5,6].map(c => (
                <td key={c} style={{ ...tdS, height:"24px" }}>&nbsp;</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SINGLE CERTIFICATE COMPONENT
══════════════════════════════════════════════════════════════════ */
function CertificateView({ f, sh, range }: {
  f: F;
  sh: Shareholder;
  range: ReturnType<typeof computeRanges>[0];
}) {
  const dateInfo = fmtDate(f.issueDate);

  const tdStyle: React.CSSProperties = {
    border:"1px solid #333", padding:"4px 8px", fontSize:"9.5pt",
    verticalAlign:"top", fontFamily:'"Times New Roman", Times, serif'
  };
  const thStyle: React.CSSProperties = {
    ...tdStyle, fontWeight:"bold", backgroundColor:"#f5f5f5", whiteSpace:"nowrap"
  };

  return (
    <div className="print-page bg-white mb-8 print:mb-0"
      style={{ fontFamily:'"Times New Roman", Times, serif', fontSize:"10pt",
        color:"#000", border:"1.5px solid #333", padding:"16px 20px",
        maxWidth:"190mm", margin:"0 auto" }}>

      {/* ── TOP HEADER ── */}
      <div style={{ textAlign:"center", borderBottom:"2px solid #000", paddingBottom:"8px", marginBottom:"8px" }}>
        <p style={{ fontWeight:"bold", fontSize:"9pt", letterSpacing:"1px" }}>FORM NO. SH-1</p>
        <p style={{ fontWeight:"900", fontSize:"13pt", letterSpacing:"2px", textTransform:"uppercase", margin:"2px 0" }}>
          SHARE CERTIFICATE
        </p>
        <p style={{ fontSize:"8pt", fontStyle:"italic", color:"#333" }}>
          [Pursuant to sub-section (3) of section 46 of the Companies Act, 2013 and Rule 5(2) of the Companies (Share Capital and Debentures) Rules 2014]
        </p>
      </div>

      {/* ── COMPANY NAME ── */}
      <div style={{ textAlign:"center", marginBottom:"6px" }}>
        <p style={{ fontWeight:"900", fontSize:"13pt", textTransform:"uppercase", letterSpacing:"1px" }}>
          {f.companyName || "[COMPANY NAME]"}
        </p>
        <p style={{ fontSize:"9pt" }}>
          <strong>CIN:</strong> {f.cin || "___________________"}
        </p>
        <p style={{ fontSize:"9pt" }}>
          (Incorporated under the Companies Act, 2013)
        </p>
        <p style={{ fontSize:"9pt" }}>
          <strong>Registered Office:</strong> {f.regAddress || "[REGISTERED OFFICE ADDRESS]"}
        </p>
      </div>

      {/* ── CERTIFICATION TEXT ── */}
      <div style={{ border:"1px solid #666", padding:"6px 10px", margin:"8px 0", fontSize:"9pt", textAlign:"justify" }}>
        <strong>"THIS IS TO CERTIFY</strong> that the person(s) named in this certificate is/are the Registered
        Holder(s) of the within mentioned share(s) bearing the distinctive number(s) herein specified in the
        above named Company subject to the Memorandum and Article of Association of the Company and the
        amount endorsed herein has been paid up on each such shares."
      </div>

      {/* ── SHARE CLASS ── */}
      <div style={{ textAlign:"center", margin:"6px 0", fontSize:"10pt", fontWeight:"bold", letterSpacing:"0.5px", textTransform:"uppercase" }}>
        {f.shareClass} SHARES EACH OF RUPEES {f.nominalValue || "10"}.00 (Nominal Value)
      </div>
      <div style={{ textAlign:"center", marginBottom:"8px", fontSize:"9.5pt", fontWeight:"bold" }}>
        AMOUNT PAID-UP PER SHARE &nbsp; RUPEES {f.paidUpValue || "10"}.00
      </div>

      {/* ── MAIN TABLE ── */}
      <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:"10px" }}>
        <tbody>
          <tr>
            <td style={thStyle}>Registered Folio No.</td>
            <td style={tdStyle}>{range.folioNo}</td>
            <td style={thStyle}>Certificate No.</td>
            <td style={tdStyle}>{range.certNo} ({range.certWord})</td>
          </tr>
          <tr>
            <td style={thStyle}>Name(s) of the Holder(s)</td>
            <td style={{ ...tdStyle, fontWeight:"bold", fontSize:"10.5pt", textTransform:"uppercase" }} colSpan={3}>
              {sh.name || "___________"}
              {sh.din && <span style={{ fontSize:"8.5pt", fontWeight:"normal" }}> (DIN: {sh.din})</span>}
            </td>
          </tr>
          <tr>
            <td style={thStyle}>Number of Share(s) held</td>
            <td style={{ ...tdStyle, fontWeight:"bold", textTransform:"uppercase" }} colSpan={3}>
              {sh.shares > 0
                ? `${sh.sharesInWords || numberToWords(sh.shares)} *** ${formatNum(sh.shares)} ***`
                : "___________"}
            </td>
          </tr>
          <tr>
            <td style={thStyle}>Distinctive No(s)</td>
            <td style={{ ...tdStyle }} colSpan={3}>
              {sh.shares > 0 ? `${range.fromPad} – ${range.toPad}` : "_____ – _____"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── GIVEN UNDER ── */}
      <div style={{ margin:"10px 0 8px", fontSize:"9.5pt" }}>
        <strong>GIVEN</strong> under the Common Seal of the Company this{" "}
        <strong>{dateInfo.ordDay}</strong> day of <strong>{dateInfo.month} {dateInfo.year}</strong>{" "}
        at <strong>{f.issuePlace || "___________"}</strong>.
      </div>

      {/* ── SIGNATURES ── */}
      <div style={{ display:"flex", gap:"40px", margin:"16px 0 8px" }}>
        {f.signingDirectors.filter(d => d.name).map((d, i) => (
          <div key={i} style={{ flex:1 }}>
            <div style={{ borderBottom:"1px solid #555", minHeight:"36px", marginBottom:"4px" }} />
            <p style={{ fontSize:"9pt", fontWeight:"bold" }}>{d.name}</p>
            <p style={{ fontSize:"8.5pt" }}>{d.designation}</p>
            {d.din && <p style={{ fontSize:"8pt", color:"#333" }}>(DIN: {d.din})</p>}
          </div>
        ))}
        {f.signingDirectors.filter(d => d.name).length === 0 && (
          <>
            <div style={{ flex:1 }}>
              <div style={{ borderBottom:"1px solid #555", minHeight:"36px", marginBottom:"4px" }} />
              <p style={{ fontSize:"9pt" }}>Director</p>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ borderBottom:"1px solid #555", minHeight:"36px", marginBottom:"4px" }} />
              <p style={{ fontSize:"9pt" }}>Director</p>
            </div>
          </>
        )}
      </div>

      {/* ── NOTE ── */}
      <p style={{ fontSize:"8.5pt", fontStyle:"italic" }}>
        <strong>Note:</strong> No transfer of Shares comprised in the Certificate can be registered unless accompanied by this Certificate.
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════ */
export default function ShareCertificatePage() {
  const [f, setF] = useState<F>(DEFAULT);
  const [step, setStep] = useState<1|2|3|4|5>(1);
  const [preview, setPreview] = useState(false);
  const [dirRegistry, setDirRegistry] = useState<DirectorInfo[]>([]);

  const set = (k: keyof F, v: unknown) => setF(p => ({ ...p, [k]: v }));
  const { data: session } = useSession();

  async function saveShareholders() {
    try {
      const companyRes = await fetch(`/api/clients/find?name=${encodeURIComponent(f.companyName)}`);
      const { companyId } = companyRes.ok ? await companyRes.json() : {};
      if (!companyId) return;

      const computedRanges = computeRanges(f.shareholders, f.startDistinctiveNo);

      for (let i = 0; i < f.shareholders.length; i++) {
        const sh = f.shareholders[i];
        const range = computedRanges[i];
        if (!sh.name) continue;

        // Upsert person
        const personRes = await fetch('/api/persons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId,
            name: sh.name,
            din: sh.din || null,
            isDirector: sh.isDirector,
            isShareholder: true,
          }),
        });
        const { id: personId } = await personRes.json();
        if (!personId) continue;

        // Save shareholder record
        await fetch('/api/shareholders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personId,
            companyId,
            folioNumber: range?.folioNo || null,
            certificateNumber: String(i + 1).padStart(2, '0'),
            distinctiveFrom: range?.from || null,
            distinctiveTo: range?.to || null,
            numberOfShares: sh.shares || 0,
            shareType: f.shareClass || 'Equity',
            dateOfAcquisition: f.issueDate || null,
          }),
        });
      }
    } catch {
      // fire-and-forget — silent failure
    }
  }

  function openPrintWindow(autoprint = false) {
    const html = generatePrintHTML(f, ranges);
    const win  = window.open("", "_blank", "width=900,height=700");
    if (!win) { alert("Pop-up blocked! Please allow pop-ups for this site."); return; }
    if (!session?.user) {
      win.document.write(injectPreviewWatermark(html));
      win.document.close();
      return;
    }
    // Auto-save shareholders to DB if logged in
    if (session?.user && f.companyName) {
      saveShareholders(); // fire-and-forget
    }
    win.document.write(html);
    win.document.close();
    if (autoprint) {
      win.onload = () => { win.focus(); win.print(); };
    }
  }

  function applyCompanyData(data: CompanyData) {
    const activeDirs = data.directors.filter(d => d.isActive);
    const reg: DirectorInfo[] = activeDirs.map(d => ({
      name: d.name, designation: d.designation || "Director", din: d.din || "",
    }));
    setDirRegistry(reg);

    const dirShareholders: Shareholder[] = activeDirs.map((d, i) => ({
      id: `dir-${i}`, name: d.name, isDirector: true, din: d.din || "",
      shares: 0, sharesInWords: "",
    }));

    // Auto-populate signing directors (top 2 active directors with DIN)
    const signingDirectors: SigningDirector[] = activeDirs
      .filter(d => d.din)  // prefer directors with DIN
      .slice(0, 2)
      .map(d => ({ name: d.name, designation: d.designation || "Director", din: d.din || "" }));
    // Pad to 2 if fewer than 2 with DIN
    if (signingDirectors.length < 2) {
      activeDirs
        .filter(d => !d.din)
        .slice(0, 2 - signingDirectors.length)
        .forEach(d => signingDirectors.push({ name: d.name, designation: d.designation || "Director", din: "" }));
    }
    while (signingDirectors.length < 2) signingDirectors.push({ name: "", designation: "Director", din: "" });

    setF(p => ({
      ...p,
      ...(data.companyName        && { companyName:          data.companyName }),
      ...(data.cin                && { cin:                  data.cin }),
      ...(data.regAddress         && { regAddress:           data.regAddress }),
      ...(data.entityType         && { entityType:           data.entityType }),
      ...(data.incorporationDate  && { incorporationDate:    data.incorporationDate }),
      ...(data.paidUpCapital      && { paidUpCapitalStr:     data.paidUpCapital }),
      ...(data.authorisedCapital  && { authorisedCapitalStr: data.authorisedCapital }),
      issuePlace:       extractCity(data.regAddress || "") || p.issuePlace,
      shareholders:     dirShareholders.length > 0 ? dirShareholders : p.shareholders,
      signingDirectors: signingDirectors,
    }));
  }

  function extractCity(addr: string): string {
    if (!addr) return "";
    const parts = addr.split(",").map(s => s.trim()).filter(Boolean);
    for (let i = parts.length-1; i >= 0; i--) {
      const p = parts[i];
      if (/^\d{6}$/.test(p) || /^india$/i.test(p) || /^\d/.test(p)) continue;
      return p;
    }
    return parts[0] || "";
  }

  /* ── Paid-up capital helpers ── */
  function parsePaidUp(str: string): number {
    if (!str) return 0;
    return parseInt(str.replace(/[,\s₹]/g, "")) || 0;
  }
  function fmtCapital(str: string): string {
    const n = parsePaidUp(str);
    if (!n) return "";
    return "₹" + n.toLocaleString("en-IN");
  }

  /* ── Flexible date parser (handles DD/MM/YYYY and YYYY-MM-DD) ── */
  function parseFlexDate(s: string): Date | null {
    if (!s) return null;
    // DD/MM/YYYY or DD-MM-YYYY
    const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmy) return new Date(`${dmy[3]}-${dmy[2].padStart(2,"0")}-${dmy[1].padStart(2,"0")}`);
    // ISO / YYYY-MM-DD / any other format browsers handle
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  /* ── 60-day date check ── */
  function dateAlert(): string | null {
    if (!f.incorporationDate || !f.issueDate) return null;
    const incorp = parseFlexDate(f.incorporationDate);
    const issue  = parseFlexDate(f.issueDate);
    if (!incorp || !issue) return null;
    const diffDays = Math.floor((issue.getTime() - incorp.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 60) return `Issue date is ${diffDays} days after incorporation. As per Section 56 of Companies Act 2013, certificates must be issued within 60 days of allotment. Please verify.`;
    return null;
  }

  /* ── Total share value vs paid-up capital ── */
  const nominalNum      = parseFloat(f.nominalValue) || 10;
  const totalSharesNow  = f.shareholders.reduce((s, sh) => s + (sh.shares || 0), 0);
  const totalShareValue = totalSharesNow * nominalNum;
  const paidUpNum       = parsePaidUp(f.paidUpCapitalStr);

  function shareCapitalStatus(): "ok" | "over" | "under" | "none" {
    if (!paidUpNum || totalSharesNow === 0) return "none";
    if (totalShareValue > paidUpNum)  return "over";
    if (totalShareValue < paidUpNum)  return "under";
    return "ok";
  }


  /* ── Shareholder helpers ── */
  function addDirectorShareholder() {
    const newDir: Shareholder = {
      id: `dir-${Date.now()}`, name:"", isDirector:true, din:"", shares:0, sharesInWords:"",
    };
    set("shareholders", [...f.shareholders, newDir]);
  }

  function addNonDirectorShareholder() {
    const newSh: Shareholder = {
      id: `ext-${Date.now()}`, name:"", isDirector:false, din:"", shares:0, sharesInWords:"",
    };
    set("shareholders", [...f.shareholders, newSh]);
  }

  function updateShareholder(id: string, k: keyof Shareholder, v: unknown) {
    set("shareholders", f.shareholders.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, [k]: v };
      if (k === "shares" || k === "name") {
        updated.sharesInWords = updated.shares > 0 ? numberToWords(updated.shares) : "";
      }
      if (k === "name" && s.isDirector) {
        const reg = dirRegistry.find(d => d.name === String(v));
        if (reg) { updated.din = reg.din; }
      }
      return updated;
    }));
  }

  function removeShareholder(id: string) {
    set("shareholders", f.shareholders.filter(s => s.id !== id));
  }

  /* ── Signing directors ── */
  function setSigningDir(i: number, k: keyof SigningDirector, v: string) {
    const next = [...f.signingDirectors];
    const reg  = dirRegistry.find(d => d.name === v);
    next[i]    = { ...next[i], [k]: v };
    if (k === "name" && reg) {
      next[i].designation = reg.designation;
      next[i].din         = reg.din || "";  // auto-fill DIN from registry
    }
    set("signingDirectors", next);
  }

  /* ── Computed ranges ── */
  const ranges = useMemo(
    () => computeRanges(f.shareholders, f.startDistinctiveNo),
    [f.shareholders, f.startDistinctiveNo]
  );

  const totalShares = useMemo(
    () => f.shareholders.reduce((s, sh) => s + (sh.shares || 0), 0),
    [f.shareholders]
  );

  const TOTAL = 4;

  /* ════════════════════════════════════════════════
     STEP 1: Company
  ════════════════════════════════════════════════ */
  const s1 = (
    <div className="space-y-4">
      <SHead n={1} title="Company Details" sub="Search from saved companies or upload MCA Excel" />

      {/* Upload — shared component */}
      <CompanyExcelUpload
        onFill={applyCompanyData}
        accent="amber"
        note="Company details + Directors auto-filled as shareholders."
      />

      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-slate-100" /><span className="text-xs text-slate-400 font-medium">or fill manually</span><div className="h-px flex-1 bg-slate-100" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Company Name — search from DB */}
        <div className="sm:col-span-2">
          <Lbl c="Company Name *" h="Type to search saved companies"/>
          <CompanySearch
            value={f.companyName}
            onChange={val => set("companyName", val)}
            onSelect={applyCompanyData}
            placeholder="Type company name or CIN…"
            className={INP}
            accent="amber"
          />
        </div>

        <div>
          <Lbl c="CIN *" />
          <input className={INP} value={f.cin} onChange={e=>set("cin",e.target.value)} placeholder="e.g. U74999BR2018PTC039719"/>
        </div>
        <div>
          <Lbl c="Entity Type"/>
          <select className={SEL} value={f.entityType} onChange={e=>set("entityType",e.target.value)}>
            <option value="pvt_ltd">Private Limited Company</option>
            <option value="opc">One Person Company (OPC)</option>
            <option value="public_ltd">Public Limited Company</option>
            <option value="section8">Section 8 Company (NGO)</option>
            <option value="nidhi">Nidhi Company</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <Lbl c="Registered Office Address *"/>
          <textarea className={INP+" h-16 resize-none"} value={f.regAddress} onChange={e=>set("regAddress",e.target.value)}
            placeholder="Full registered office address as per MCA records"/>
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════
     STEP 2: Share Details
  ════════════════════════════════════════════════ */
  const s2 = (
    <div className="space-y-4">
      <SHead n={2} title="Share Details" sub="Share class, nominal value, and issue particulars" />

      {/* ── Company Capital Info Card ── */}
      {(f.paidUpCapitalStr || f.authorisedCapitalStr) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">📊 Company Capital (from MCA records)</p>
          <div className="grid grid-cols-2 gap-3">
            {f.authorisedCapitalStr && (
              <div className="bg-white rounded-lg p-2.5 border border-blue-100">
                <p className="text-xs text-slate-500">Authorised Capital</p>
                <p className="font-bold text-slate-800 text-sm">{fmtCapital(f.authorisedCapitalStr)}</p>
              </div>
            )}
            {f.paidUpCapitalStr && (
              <div className="bg-white rounded-lg p-2.5 border border-blue-100">
                <p className="text-xs text-slate-500">Paid-up Capital</p>
                <p className="font-bold text-green-700 text-sm">{fmtCapital(f.paidUpCapitalStr)}</p>
                <p className="text-xs text-slate-400 mt-0.5">Total shares that can be issued</p>
              </div>
            )}
          </div>
          {f.incorporationDate && (
            <p className="text-xs text-blue-600 mt-2">
              📅 Date of Incorporation: <strong>{f.incorporationDate}</strong>
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Lbl c="Share Class *"/>
          <select className={SEL} value={f.shareClass} onChange={e=>set("shareClass",e.target.value)}>
            <option value="Equity">Equity Shares</option>
            <option value="Preference">Preference Shares</option>
          </select>
        </div>
        <div>
          <Lbl c="Nominal Value per Share (₹) *" h="Face value — usually ₹10"/>
          <input className={INP} value={f.nominalValue} onChange={e=>set("nominalValue",e.target.value)} placeholder="e.g. 10"/>
        </div>
        <div>
          <Lbl c="Paid-up Value per Share (₹) *" h="Amount actually paid — usually = nominal"/>
          <input className={INP} value={f.paidUpValue} onChange={e=>set("paidUpValue",e.target.value)} placeholder="e.g. 10"/>
        </div>
        <div>
          <Lbl c="Start Distinctive Number" h="First share serial number (usually 1 for new company)"/>
          <input type="number" className={INP} value={f.startDistinctiveNo} min={1}
            onChange={e=>set("startDistinctiveNo", parseInt(e.target.value)||1)} />
        </div>
        <div>
          <Lbl c="Date of Issue *" h="Must be within 60 days of incorporation / allotment (Sec 56)"/>
          <input type="date" className={INP} value={f.issueDate} onChange={e=>set("issueDate",e.target.value)}/>
          {/* 60-day alert */}
          {dateAlert() && (
            <div className="mt-1.5 bg-orange-50 border border-orange-300 rounded-lg px-3 py-2 flex items-start gap-2">
              <span className="text-orange-500 text-base shrink-0 mt-0.5">⚠️</span>
              <p className="text-xs text-orange-700">{dateAlert()}</p>
            </div>
          )}
        </div>
        <div>
          <Lbl c="Place of Issue *"/>
          <input className={INP} value={f.issuePlace} onChange={e=>set("issuePlace",e.target.value)} placeholder="e.g. Patna"/>
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════
     STEP 3: Shareholders
  ════════════════════════════════════════════════ */
  const s3 = (
    <div className="space-y-4">
      <SHead n={3} title="Shareholders" sub="Add directors and/or external shareholders — each gets a separate certificate" />

      {/* ── Total shares live banner ── */}
      {totalShares > 0 && (
        <div className={`rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border ${
          shareCapitalStatus() === "over"  ? "bg-red-50 border-red-300 text-red-700" :
          shareCapitalStatus() === "under" ? "bg-amber-50 border-amber-300 text-amber-800" :
          shareCapitalStatus() === "ok"    ? "bg-green-50 border-green-300 text-green-700" :
          "bg-slate-50 border-slate-200 text-slate-700"
        }`}>
          <span>📊</span>
          <span>Total shares to be issued: <strong>{formatNum(totalShares)}</strong> ({numberToWords(totalShares)})</span>
          {shareCapitalStatus() === "over"  && <span className="ml-auto text-xs font-bold text-red-600">🚫 EXCEEDS PAID-UP</span>}
          {shareCapitalStatus() === "under" && <span className="ml-auto text-xs font-semibold text-amber-600">⚠ Below Paid-up</span>}
          {shareCapitalStatus() === "ok"    && <span className="ml-auto text-xs font-bold text-green-600">✓ Matches Paid-up</span>}
        </div>
      )}

      {/* ── Capital summary card ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {f.paidUpCapitalStr && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs text-slate-500 font-medium">Company Paid-up Capital</p>
            <p className="font-bold text-blue-800">{fmtCapital(f.paidUpCapitalStr)}</p>
            <p className="text-xs text-slate-400">= {formatNum(paidUpNum / nominalNum)} shares @ ₹{nominalNum}</p>
          </div>
        )}
        <div className={`rounded-xl p-3 border ${
          shareCapitalStatus() === "over"  ? "bg-red-50 border-red-300" :
          shareCapitalStatus() === "under" ? "bg-yellow-50 border-yellow-300" :
          shareCapitalStatus() === "ok"    ? "bg-green-50 border-green-300" :
          "bg-slate-50 border-slate-200"}`}>
          <p className="text-xs text-slate-500 font-medium">Total Shares Being Issued</p>
          <p className={`font-bold text-base ${
            shareCapitalStatus() === "over"  ? "text-red-700" :
            shareCapitalStatus() === "under" ? "text-yellow-700" :
            shareCapitalStatus() === "ok"    ? "text-green-700" :
            "text-slate-700"}`}>
            {formatNum(totalShares)}
          </p>
          <p className="text-xs text-slate-400">Value: {fmtCapital(String(totalShareValue))}</p>
        </div>
        {f.authorisedCapitalStr && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <p className="text-xs text-slate-500 font-medium">Authorised Capital</p>
            <p className="font-bold text-slate-700">{fmtCapital(f.authorisedCapitalStr)}</p>
          </div>
        )}
      </div>

      {/* ── Capital validation alerts ── */}
      {shareCapitalStatus() === "over" && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex items-start gap-3">
          <span className="text-2xl shrink-0">🚫</span>
          <div>
            <p className="font-bold text-red-700 text-sm">Cannot Proceed — Share Value Exceeds Paid-up Capital!</p>
            <p className="text-xs text-red-600 mt-1">
              Total share value (<strong>{fmtCapital(String(totalShareValue))}</strong>) is more than company's
              paid-up capital (<strong>{fmtCapital(f.paidUpCapitalStr)}</strong>).
              Reduce shares for one or more shareholders.
            </p>
          </div>
        </div>
      )}
      {shareCapitalStatus() === "under" && (
        <div className="bg-yellow-50 border border-yellow-400 rounded-xl p-3 flex items-start gap-2">
          <span className="text-xl shrink-0">⚠️</span>
          <div>
            <p className="font-bold text-yellow-800 text-sm">Warning — Shares Below Paid-up Capital</p>
            <p className="text-xs text-yellow-700 mt-0.5">
              Total share value ({fmtCapital(String(totalShareValue))}) is less than paid-up capital ({fmtCapital(f.paidUpCapitalStr)}).
              This is allowed, but please verify. You may be issuing partial shares.
            </p>
          </div>
        </div>
      )}
      {shareCapitalStatus() === "ok" && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-3 flex items-center gap-2">
          <span className="text-lg">✅</span>
          <p className="text-sm font-semibold text-green-700">Share value matches paid-up capital exactly.</p>
        </div>
      )}

      {f.shareholders.length === 0 && (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
          <p className="text-slate-400 text-sm mb-3">No shareholders added yet.</p>
          <p className="text-xs text-slate-400">Upload Excel to auto-add directors, or add manually below.</p>
        </div>
      )}

      <div className="space-y-3">
        {f.shareholders.map((sh, idx) => {
          const range = ranges[idx];
          return (
            <div key={sh.id} className={`border-2 rounded-xl p-4 ${sh.isDirector ? "border-blue-200 bg-blue-50/30" : "border-purple-200 bg-purple-50/30"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: sh.isDirector ? "#2563eb" : "#7c3aed" }}>
                    {idx+1}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sh.isDirector ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                    {sh.isDirector ? "👤 Director Shareholder" : "🏢 External Shareholder"}
                  </span>
                  {sh.shares > 0 && (
                    <span className="text-xs text-slate-500 font-mono">
                      [{String(range.fromPad)} – {String(range.toPad)}]
                    </span>
                  )}
                </div>
                <button type="button" onClick={() => removeShareholder(sh.id)}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold">Remove</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Lbl c="Name *"/>
                  {sh.isDirector && dirRegistry.length > 0 ? (
                    <select className={SEL} value={sh.name}
                      onChange={e => updateShareholder(sh.id, "name", e.target.value)}>
                      <option value="">— Select Director —</option>
                      {dirRegistry.map((d,i) => (
                        <option key={i} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input className={INP} value={sh.name}
                      onChange={e => updateShareholder(sh.id, "name", e.target.value)}
                      placeholder="Full name of shareholder"/>
                  )}
                </div>
                <div>
                  <Lbl c={<>{sh.isDirector ? "DIN" : "PAN / ID"} <span className="text-red-500">*</span></>}
                    h={sh.isDirector ? "8-digit Director Identification Number — compulsory" : "PAN / Aadhaar — compulsory"}/>
                  <input
                    className={`${INP} ${!sh.din ? "border-red-300 focus:ring-red-200" : "border-green-300"}`}
                    value={sh.din}
                    onChange={e => updateShareholder(sh.id, "din", e.target.value)}
                    placeholder={sh.isDirector ? "e.g. 01234567" : "e.g. ABCDE1234F"}
                    maxLength={sh.isDirector ? 8 : 20}
                  />
                  {!sh.din && (
                    <p className="text-xs text-red-500 mt-0.5">
                      {sh.isDirector ? "DIN is compulsory for director shareholders" : "PAN/ID is required"}
                    </p>
                  )}
                </div>
                <div>
                  <Lbl c="Number of Shares *"/>
                  <input type="number" className={INP} value={sh.shares || ""}
                    onChange={e => updateShareholder(sh.id, "shares", parseInt(e.target.value)||0)}
                    placeholder="e.g. 15000" min={1}/>
                  {sh.shares > 0 && (
                    <p className="text-xs text-slate-500 mt-1 font-medium">{numberToWords(sh.shares)}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={addDirectorShareholder}
          className="flex-1 py-2.5 rounded-xl border-2 border-dashed border-blue-300 text-blue-600 text-sm font-semibold hover:border-blue-500 hover:bg-blue-50 transition">
          + Add Director Shareholder
        </button>
        <button type="button" onClick={addNonDirectorShareholder}
          className="flex-1 py-2.5 rounded-xl border-2 border-dashed border-purple-300 text-purple-600 text-sm font-semibold hover:border-purple-500 hover:bg-purple-50 transition">
          + Add External Shareholder
        </button>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════
     STEP 4: Signing Directors
  ════════════════════════════════════════════════ */
  const s4 = (
    <div className="space-y-4">
      <SHead n={4} title="Signing Directors" sub="Two directors who will sign all certificates (Companies Act requirement)" />
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
        As per Companies Act 2013 — Share Certificate must be signed by at least 2 Directors (or 1 Director + Company Secretary).
      </div>

      {[0,1].map(i => (
        <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-sm font-bold text-slate-700 mb-3">Signatory {i+1}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Lbl c="Name *"/>
              {dirRegistry.length > 0 ? (
                <select className={SEL} value={f.signingDirectors[i]?.name || ""}
                  onChange={e => setSigningDir(i, "name", e.target.value)}>
                  <option value="">— Select Director —</option>
                  {dirRegistry.map((d,di) => (
                    <option key={di} value={d.name}>{d.name} — {d.designation}</option>
                  ))}
                </select>
              ) : (
                <input className={INP} value={f.signingDirectors[i]?.name || ""}
                  onChange={e => setSigningDir(i, "name", e.target.value)}
                  placeholder="e.g. Rahul Sharma"/>
              )}
            </div>
            <div>
              <Lbl c="Designation"/>
              <select className={SEL} value={f.signingDirectors[i]?.designation || "Director"}
                onChange={e => setSigningDir(i, "designation", e.target.value)}>
                <option value="Director">Director</option>
                <option value="Managing Director">Managing Director</option>
                <option value="Whole-Time Director">Whole-Time Director</option>
                <option value="Company Secretary">Company Secretary</option>
              </select>
            </div>
            <div>
              <Lbl c="DIN" h="Auto-filled from registry"/>
              <input
                className={`${INP} ${f.signingDirectors[i]?.din ? "border-green-300" : "border-slate-300"}`}
                value={f.signingDirectors[i]?.din || ""}
                onChange={e => setSigningDir(i, "din", e.target.value)}
                placeholder="e.g. 01234567"
                maxLength={8}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const stepContent: Record<number, React.ReactNode> = { 1:s1, 2:s2, 3:s3, 4:s4 };

  function canNext(): boolean {
    if (step === 1) return !!f.companyName && !!f.cin && !!f.regAddress;
    if (step === 2) return !!f.nominalValue && !!f.issueDate && !!f.issuePlace;
    if (step === 3) {
      if (f.shareholders.length === 0) return false;
      if (!f.shareholders.every(s => s.name && s.shares > 0 && s.din)) return false;
      if (paidUpNum > 0 && totalShareValue > paidUpNum) return false; // BLOCK if exceeds paid-up capital
      return true;
    }
    return true;
  }

  return (
    <>
    <main className="min-h-screen bg-white flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <Navbar />

      {/* Hero */}
      {!preview && step === 1 && (
        <section className="border-b border-slate-100 print:hidden overflow-hidden relative"
          style={{ background:"linear-gradient(160deg,#fffbeb 0%,#fef3c7 40%,#fafafa 100%)" }}>
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none opacity-20"
            style={{ background:"radial-gradient(circle,#fcd34d,transparent 70%)", transform:"translate(30%,-30%)" }} />
          <div className="max-w-6xl mx-auto px-4 py-10 md:py-14 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="flex flex-col gap-4">
                <div className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full border w-fit"
                  style={{ background:"#fffbeb", borderColor:"#fcd34d", color:"#92400e" }}>
                  📜 Legal Document Generator
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-2">
                    Share Certificate{" "}
                    <span style={{ background:"linear-gradient(90deg,#d97706,#b45309)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                      Generator
                    </span>
                  </h1>
                  <p className="text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 px-3 py-1 rounded-full w-fit mb-2">
                    Form SH-1 — Companies Act 2013, Section 46
                  </p>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-md">
                    Generate standard Form SH-1 Share Certificates for all shareholders. Supports directors + external shareholders.
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-wrap text-sm text-slate-600">
                  <div className="flex items-center gap-1.5"><span className="text-amber-500 text-base">⬇</span><span className="font-bold text-slate-800">MDS Excel</span><span className="text-slate-500">auto-fill</span></div>
                  <div className="w-px h-4 bg-slate-200"/>
                  <div className="flex items-center gap-1.5"><span>📋</span><span>Distinctive Nos auto-calc</span></div>
                  <div className="w-px h-4 bg-slate-200"/>
                  <div className="flex items-center gap-1.5"><span>🖨️</span><span>Print-ready PDF</span></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["✓ Companies Act 2013","✓ Form SH-1","✓ All Share Types","✓ Free"].map(t => (
                    <span key={t} className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-full text-slate-600 font-medium shadow-sm">{t}</span>
                  ))}
                </div>
              </div>

              {/* Preview card */}
              <div className="relative flex items-center justify-center">
                <div className="w-full max-w-xs bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 rotate-1 hover:rotate-0 transition-transform duration-300">
                  <div className="text-center border-b-2 border-slate-800 pb-2 mb-3">
                    <p className="text-xs font-bold tracking-widest">FORM NO. SH-1</p>
                    <p className="text-sm font-black tracking-wide uppercase">Share Certificate</p>
                  </div>
                  <p className="text-xs font-black text-center uppercase mb-2">ABC COMPANY PVT. LTD.</p>
                  <div className="border border-slate-400 rounded p-2 text-xs mb-2">
                    <p className="font-bold text-slate-500">THIS IS TO CERTIFY that...</p>
                  </div>
                  <div className="border border-slate-300 rounded text-xs">
                    <div className="grid grid-cols-2 divide-x divide-slate-300">
                      <div className="p-1.5"><span className="font-bold text-slate-500">Folio No:</span> 01</div>
                      <div className="p-1.5"><span className="font-bold text-slate-500">Cert No:</span> 01</div>
                    </div>
                    <div className="p-1.5 border-t border-slate-300"><span className="font-bold text-slate-500">Holder:</span> RAHUL SHARMA</div>
                    <div className="p-1.5 border-t border-slate-300"><span className="font-bold text-slate-500">Shares:</span> TEN THOUSAND *** 10,000 ***</div>
                    <div className="p-1.5 border-t border-slate-300"><span className="font-bold text-slate-500">Nos:</span> 00001 – 10000</div>
                  </div>
                  <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">FREE</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Form */}
      {!preview ? (
        <div id="cert-form" className="max-w-3xl mx-auto w-full px-4 py-8 flex-1 print:hidden">
          {/* Progress */}
          <div className="mb-7">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-slate-700">
                Step {step} of {TOTAL} — {["Company","Share Details","Shareholders","Signing Directors"][step-1]}
              </p>
              <p className="text-xs text-slate-400">{Math.round((step/TOTAL)*100)}% complete</p>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width:`${(step/TOTAL)*100}%`, background:"linear-gradient(90deg,#d97706,#b45309)" }}/>
            </div>
          </div>

          <div className="bg-white mb-6">{stepContent[step]}</div>

          <div className="flex items-center justify-between">
            <button onClick={()=>setStep(s=>Math.max(s-1,1) as typeof step)} disabled={step===1}
              className="px-6 py-3 rounded-xl font-bold text-slate-600 border-2 border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50 transition">
              ← Back
            </button>
            {step < TOTAL ? (
              <button onClick={()=>setStep(s=>Math.min(s+1,TOTAL) as typeof step)} disabled={!canNext()}
                className="px-8 py-3 rounded-xl font-bold text-white text-sm transition hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background:"linear-gradient(135deg,#d97706,#b45309)" }}>
                Continue →
              </button>
            ) : (
              <button onClick={()=>setPreview(true)} disabled={!canNext()}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white text-sm transition hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background:"linear-gradient(135deg,#16a34a,#15803d)" }}>
                📜 Generate Certificates →
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ── PREVIEW MODE ── */
        <div className="max-w-4xl mx-auto w-full px-4 py-8 flex-1 print:hidden">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Certificates Preview</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {f.shareholders.length} certificate(s) — {formatNum(totalShares)} total shares
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={()=>setPreview(false)}
                className="px-4 py-2 rounded-xl font-bold text-slate-600 border-2 border-slate-200 text-sm hover:bg-slate-50 transition">
                ← Edit
              </button>
              <button onClick={()=>openPrintWindow(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white text-sm transition hover:scale-105"
                style={{ background:"linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
                👁️ Open Preview
              </button>
              <button onClick={()=>openPrintWindow(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm transition hover:scale-105"
                style={{ background:"linear-gradient(135deg,#d97706,#b45309)" }}>
                🖨️ Print / Download PDF
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {f.shareholders.map((sh, idx) => {
              const isLast = idx === f.shareholders.length - 1;
              return (
                <div key={sh.id}>
                  {/* Certificate */}
                  <div className="mb-1">
                    <p className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                      Certificate {String(idx+1).padStart(2,"0")} — {sh.name}
                    </p>
                    <CertificateView f={f} sh={sh} range={ranges[idx]} />
                  </div>
                  {/* Memorandum */}
                  <div className="mt-2">
                    <p className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                      Memorandum of Transfers — {sh.name}
                    </p>
                    <MemorandumView f={f} sh={sh} isLast={isLast} />
                  </div>
                  {!isLast && <div className="border-t-2 border-dashed border-slate-200 my-6" />}
                </div>
              );
            })}
          </div>

          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            <strong>Note:</strong> Share Certificates must be issued within 60 days of allotment (Section 56, Companies Act 2013).
            Get them signed by authorized directors before delivery to shareholders.
          </div>
          <div className="mt-3 flex justify-center">
            <button onClick={()=>setPreview(false)} className="text-sm text-amber-700 hover:underline font-semibold">
              ← Back to edit
            </button>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-200 py-5 px-4 mt-auto print:hidden">
        <div className="max-w-3xl mx-auto text-center text-sm text-slate-400">
          <Link href="/tools/documents" className="text-amber-600 hover:underline text-xs">← All Document Generators</Link>
          {" · "}
          © {new Date().getFullYear()} ComplianceSearch.in — Powered by{" "}
          <a href="https://geebharat.com" className="text-amber-600 hover:underline">Gee Bharat</a>
        </div>
      </footer>
    </main>

    </>
  );
}
