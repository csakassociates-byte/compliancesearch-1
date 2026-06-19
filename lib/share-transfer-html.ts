/* ══════════════════════════════════════════════════════════════════
   SH-4 Share Transfer Form HTML Generator
   Form SH-4 — Securities Transfer Form
   [Pursuant to Section 56 of the Companies Act, 2013 and
    Rule 11(1) of the Companies (Share Capital and Debentures) Rules, 2014]
══════════════════════════════════════════════════════════════════ */

export interface TransferCompany {
  companyName: string;
  cin: string;
  regAddress: string;
  shareClass: string;   // 'Equity' | 'Preference'
  nominalValue: string; // ₹ per share
  paidUpValue: string;  // ₹ per share
}

export interface Transferor {
  name: string;
  folioNo: string;
  certNo: string;
  numberOfShares: number;
  distinctiveFrom: number | string;
  distinctiveTo: number | string;
  pan?: string;
  address?: string;
}

export interface Transferee {
  name: string;
  fatherName?: string;
  address?: string;
  pan?: string;
  occupation?: string;
  newFolioNo: string;
  newCertNo: string;
  newDistinctiveFrom: number | string;
  newDistinctiveTo: number | string;
}

export interface TransferSigner {
  name: string;
  designation: string;
  din?: string;
}

export interface TransferDetails {
  transferDate: string;
  considerationPerShare?: string;
  totalConsideration?: string;
  stampDuty?: string;
  issuePlace?: string;
}

export interface TransferWitness {
  name: string;
  address: string;
}

/* ── Utility: number → words ─────────────────────────────────── */
const ONES = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
  'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
const TENS = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

function convertHundreds(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n/10)] + (n%10 ? ' '+ONES[n%10] : '');
  return ONES[Math.floor(n/100)]+' Hundred'+(n%100 ? ' '+convertHundreds(n%100) : '');
}

export function numberToWords(n: number): string {
  if (n === 0) return 'Zero';
  const parts: string[] = [];
  const cr = Math.floor(n / 10000000); n %= 10000000;
  const lac = Math.floor(n / 100000);  n %= 100000;
  const th = Math.floor(n / 1000);     n %= 1000;
  if (cr)  parts.push(convertHundreds(cr)+' Crore');
  if (lac) parts.push(convertHundreds(lac)+' Lakh');
  if (th)  parts.push(convertHundreds(th)+' Thousand');
  if (n)   parts.push(convertHundreds(n));
  return parts.join(' ');
}

export function padNum(n: number | string, len = 5): string {
  return String(n).padStart(len, '0');
}

export function fmtDate(d: string): { day: string; month: string; year: string; full: string } {
  if (!d) return { day: '___', month: '___________', year: '_______', full: '___________' };
  const dt = new Date(d);
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  return {
    day:   String(dt.getDate()),
    month: months[dt.getMonth()],
    year:  String(dt.getFullYear()),
    full:  `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`,
  };
}

/* ══════════════════════════════════════════════════════════════════
   MAIN HTML GENERATOR
══════════════════════════════════════════════════════════════════ */
const TRANSFER_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&display=swap');
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Times New Roman", Times, serif;
    color: #000;
    background: #fff;
    font-size: 10pt;
    width: 210mm;
    padding: 12mm 14mm;
    margin: 10mm auto;
  }
  @media print { body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  .page {
    width: 100%;
    min-height: 273mm;
    margin: 0;
    padding: 0;
    page-break-after: always;
  }
  .outer-border {
    border: 3px double #000;
    padding: 4px;
    min-height: 265mm;
  }
  .inner-border {
    border: 1px solid #444;
    padding: 8mm 10mm;
    min-height: 257mm;
    display: flex;
    flex-direction: column;
  }
  /* ── Header ── */
  .sh4-header {
    text-align: center;
    border-bottom: 2px solid #000;
    padding-bottom: 6px;
    margin-bottom: 8px;
  }
  .sh4-form-no {
    font-size: 9pt;
    letter-spacing: 3px;
    text-transform: uppercase;
    font-weight: bold;
  }
  .sh4-title {
    font-size: 17pt;
    font-weight: bold;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin: 3px 0;
    font-family: "IM Fell English", "Times New Roman", serif;
  }
  .sh4-subtitle {
    font-size: 8pt;
    font-style: italic;
    color: #333;
    margin-top: 2px;
  }
  /* ── Company section ── */
  .company-block {
    text-align: center;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid #888;
  }
  .company-name {
    font-size: 13pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .company-meta {
    font-size: 9pt;
    margin-top: 3px;
    line-height: 1.5;
  }
  .company-meta span { margin: 0 6px; }
  /* ── Section heading ── */
  .section-head {
    font-size: 10pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    background: #f0f0f0;
    border: 1px solid #999;
    padding: 3px 8px;
    margin: 8px 0 4px;
  }
  /* ── Data table ── */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 6px;
    font-size: 9.5pt;
  }
  .data-table td {
    border: 1px solid #555;
    padding: 4px 8px;
    vertical-align: top;
  }
  .data-table .label {
    width: 42%;
    font-weight: bold;
    background: #fafafa;
    white-space: nowrap;
  }
  .data-table .value {
    font-size: 10pt;
  }
  /* ── Consideration box ── */
  .consideration-box {
    border: 1px solid #777;
    padding: 6px 10px;
    margin: 6px 0;
    font-size: 9.5pt;
    line-height: 1.7;
  }
  /* ── Signature row ── */
  .sig-section {
    display: flex;
    gap: 20px;
    margin-top: 10px;
  }
  .sig-block {
    flex: 1;
    text-align: center;
  }
  .sig-box {
    border: 1px solid #777;
    height: 40px;
    margin-bottom: 4px;
  }
  .sig-label {
    font-size: 9pt;
    font-weight: bold;
  }
  .sig-sub {
    font-size: 8pt;
    color: #444;
  }
  /* ── Office use ── */
  .office-use {
    border: 1.5px solid #333;
    margin-top: 10px;
    padding: 6px 10px;
  }
  .office-title {
    font-weight: bold;
    font-size: 9.5pt;
    text-decoration: underline;
    margin-bottom: 6px;
    text-align: center;
    letter-spacing: 1px;
  }
  .office-row {
    display: flex;
    gap: 16px;
    margin-bottom: 4px;
    font-size: 9pt;
  }
  .office-field {
    flex: 1;
    border-bottom: 1px solid #888;
    padding-bottom: 2px;
  }
  .office-field span { color: #555; font-style: italic; }
  /* ── Witness block ── */
  .witness-row {
    display: flex;
    gap: 30px;
    margin-top: 6px;
  }
  .witness-block {
    flex: 1;
    font-size: 8.5pt;
  }
  .witness-line {
    border-bottom: 1px solid #777;
    min-height: 22px;
    margin-bottom: 2px;
  }
  /* ── Note ── */
  .note-box {
    margin-top: auto;
    padding-top: 8px;
    border-top: 1px solid #999;
    font-size: 8pt;
    font-style: italic;
    color: #333;
    line-height: 1.5;
  }
  /* ── Auth sig row ── */
  .auth-sig-row {
    display: flex;
    gap: 20px;
    margin-top: 8px;
  }
  .auth-sig-block {
    flex: 1;
    text-align: center;
  }
  .auth-sig-line {
    border-bottom: 2px solid #000;
    margin-bottom: 4px;
    min-height: 36px;
  }
  .auth-sig-name { font-weight: bold; font-size: 9.5pt; }
  .auth-sig-desig { font-size: 8.5pt; color: #333; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { margin: 0 auto; }
  }
`;

function sh4PageHtml(
  company: TransferCompany,
  transferor: Transferor,
  transferee: Transferee,
  details: TransferDetails,
  signers: TransferSigner[],
  witnesses?: TransferWitness[]
): string {
  const dt = fmtDate(details.transferDate);
  const sharesInWords = numberToWords(transferor.numberOfShares);
  const totalConsideration = details.totalConsideration
    || (details.considerationPerShare
        ? (parseFloat(details.considerationPerShare) * transferor.numberOfShares).toFixed(2)
        : '');

  return `
  <div class="page">
    <div class="outer-border">
      <div class="inner-border">

        <!-- ══ HEADER ══ -->
        <div class="sh4-header">
          <div class="sh4-form-no">Form No. SH-4</div>
          <div class="sh4-title">Securities Transfer Form</div>
          <div class="sh4-subtitle">
            [Pursuant to Section 56 of the Companies Act, 2013 and
             Rule 11(1) of the Companies (Share Capital and Debentures) Rules, 2014]
          </div>
        </div>

        <!-- ══ COMPANY ══ -->
        <div class="company-block">
          <div class="company-name">${company.companyName}</div>
          <div class="company-meta">
            <span><strong>CIN:</strong> ${company.cin || '_______________'}</span>
            <span>|</span>
            <span>Incorporated under the Companies Act, 2013</span>
          </div>
          <div class="company-meta">
            <strong>Registered Office:</strong> ${company.regAddress || '_______________'}
          </div>
        </div>

        <!-- ══ SECURITY DETAILS ══ -->
        <div class="section-head">Details of Securities</div>
        <table class="data-table">
          <tr>
            <td class="label">Kind / Class of Security</td>
            <td class="value">${company.shareClass || 'Equity'} Shares</td>
            <td class="label">Nominal Value (₹)</td>
            <td class="value">₹ ${company.nominalValue} per share</td>
          </tr>
          <tr>
            <td class="label">Paid-up Value (₹)</td>
            <td class="value">₹ ${company.paidUpValue} per share</td>
            <td class="label">Date of Transfer</td>
            <td class="value">${dt.full || '___________'}</td>
          </tr>
          <tr>
            <td class="label">Number of Shares to be Transferred</td>
            <td class="value" colspan="3">
              <strong>${sharesInWords} *** ${transferor.numberOfShares.toLocaleString('en-IN')} ***</strong>
            </td>
          </tr>
          <tr>
            <td class="label">Distinctive Numbers</td>
            <td class="value" colspan="3">
              From: <strong>${padNum(transferor.distinctiveFrom)}</strong>
              &nbsp;&nbsp; To: <strong>${padNum(transferor.distinctiveTo)}</strong>
            </td>
          </tr>
        </table>

        <!-- ══ CONSIDERATION ══ -->
        <div class="consideration-box">
          <strong>Consideration:</strong>
          &nbsp; ₹ ${details.considerationPerShare || '___'} per share
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <strong>Total Consideration:</strong>
          &nbsp; ₹ ${totalConsideration || '___________'}
          ${details.stampDuty ? `&nbsp;&nbsp;|&nbsp;&nbsp;<strong>Stamp Duty:</strong> &nbsp; ₹ ${details.stampDuty}` : ''}
        </div>

        <!-- ══ TRANSFEROR ══ -->
        <div class="section-head">Part A — Transferor Details</div>
        <table class="data-table">
          <tr>
            <td class="label">Full Name of Transferor</td>
            <td class="value" colspan="3"><strong style="text-transform:uppercase">${transferor.name}</strong></td>
          </tr>
          <tr>
            <td class="label">Registered Folio No.</td>
            <td class="value">${transferor.folioNo || '___'}</td>
            <td class="label">Certificate No.</td>
            <td class="value">${transferor.certNo || '___'}</td>
          </tr>
          ${transferor.pan ? `<tr><td class="label">PAN</td><td class="value" colspan="3">${transferor.pan}</td></tr>` : ''}
          ${transferor.address ? `<tr><td class="label">Address</td><td class="value" colspan="3">${transferor.address}</td></tr>` : ''}
        </table>

        <!-- Transferor Signature + Witness 1 -->
        <div class="witness-row" style="margin:6px 0 0">
          <div class="witness-block">
            <div class="witness-line"></div>
            <div><strong>Signature of Transferor</strong></div>
            <div style="font-size:8pt">Name: <strong>${transferor.name}</strong></div>
            <div style="font-size:8pt">Date: ${dt.full || '___________'}</div>
          </div>
          <div class="witness-block">
            <div style="font-size:8.5pt;font-weight:bold;margin-bottom:2px">Witness 1</div>
            <div class="witness-line"></div>
            <div style="font-size:8pt">Name: <strong>${witnesses?.[0]?.name || '_________________________'}</strong></div>
            <div style="font-size:8pt">Address: ${witnesses?.[0]?.address || '______________________'}</div>
          </div>
        </div>

        <!-- ══ TRANSFEREE ══ -->
        <div class="section-head">Part B — Transferee Details</div>
        <table class="data-table">
          <tr>
            <td class="label">Full Name of Transferee</td>
            <td class="value" colspan="3"><strong style="text-transform:uppercase">${transferee.name}</strong></td>
          </tr>
          ${transferee.fatherName ? `<tr><td class="label">Father's / Spouse's Name</td><td class="value" colspan="3">${transferee.fatherName}</td></tr>` : ''}
          ${transferee.address ? `<tr><td class="label">Address</td><td class="value" colspan="3">${transferee.address}</td></tr>` : ''}
          ${transferee.pan ? `<tr><td class="label">PAN</td><td class="value" colspan="3"><strong>${transferee.pan}</strong></td></tr>` : '<tr><td class="label">PAN</td><td class="value" colspan="3" style="color:#b91c1c;font-style:italic">Not provided — required for unlisted share transfers</td></tr>'}
          ${transferee.occupation ? `<tr><td class="label">Occupation</td><td class="value" colspan="3">${transferee.occupation}</td></tr>` : ''}
        </table>

        <!-- Transferee Signature + Witness 2 -->
        <div class="witness-row" style="margin:6px 0 0">
          <div class="witness-block">
            <div class="witness-line"></div>
            <div><strong>Signature of Transferee</strong></div>
            <div style="font-size:8pt">Name: <strong>${transferee.name}</strong></div>
            <div style="font-size:8pt">Date: ${dt.full || '___________'}</div>
          </div>
          <div class="witness-block">
            <div style="font-size:8.5pt;font-weight:bold;margin-bottom:2px">Witness 2</div>
            <div class="witness-line"></div>
            <div style="font-size:8pt">Name: <strong>${witnesses?.[1]?.name || '_________________________'}</strong></div>
            <div style="font-size:8pt">Address: ${witnesses?.[1]?.address || '______________________'}</div>
          </div>
        </div>

        <!-- ══ FOR OFFICE USE ══ -->
        <div class="office-use">
          <div class="office-title">For Office Use Only</div>
          <div class="office-row">
            <div class="office-field">Transfer Registered on: <span>_______________</span></div>
            <div class="office-field">New Folio No.: <span><strong>${transferee.newFolioNo || '___'}</strong></span></div>
            <div class="office-field">New Certificate No.: <span><strong>${transferee.newCertNo || '___'}</strong></span></div>
          </div>
          <div class="office-row">
            <div class="office-field">New Distinctive Nos. From: <span><strong>${padNum(transferee.newDistinctiveFrom)}</strong></span></div>
            <div class="office-field">To: <span><strong>${padNum(transferee.newDistinctiveTo)}</strong></span></div>
            <div class="office-field">Place: <span>${details.issuePlace || '_______________'}</span></div>
          </div>

          <!-- Authorised Signatories -->
          ${signers.length > 0 ? `
          <div class="auth-sig-row" style="margin-top:10px">
            ${signers.map(s => `
            <div class="auth-sig-block">
              <div class="auth-sig-line"></div>
              <div class="auth-sig-name">${s.name}</div>
              <div class="auth-sig-desig">${s.designation}</div>
              ${s.din ? `<div class="auth-sig-desig">DIN: ${s.din}</div>` : ''}
            </div>`).join('')}
          </div>` : `
          <div class="auth-sig-row" style="margin-top:10px">
            <div class="auth-sig-block">
              <div class="auth-sig-line"></div>
              <div class="auth-sig-name">Authorised Signatory</div>
            </div>
            <div class="auth-sig-block">
              <div class="auth-sig-line"></div>
              <div class="auth-sig-name">Authorised Signatory</div>
            </div>
          </div>`}
          <div style="text-align:center;font-size:8.5pt;margin-top:4px">For <strong>${company.companyName}</strong></div>
        </div>

        <!-- ══ NOTE ══ -->
        <div class="note-box">
          <strong>Notes:</strong><br/>
          1. The transferor(s) and transferee(s) must sign the form in the presence of a witness who shall sign in the space provided above.<br/>
          2. The Transferee(s) shall furnish PAN for transfer of listed shares as well as unlisted shares.<br/>
          3. This form is to be duly stamped before signing by the transferor(s).
        </div>

      </div><!-- inner-border -->
    </div><!-- outer-border -->
  </div><!-- page -->
  `;
}

/* ══════════════════════════════════════════════════════════════════
   PUBLIC EXPORT
══════════════════════════════════════════════════════════════════ */
export function generateSH4HTML(
  company: TransferCompany,
  transferor: Transferor,
  transferee: Transferee,
  details: TransferDetails,
  signers: TransferSigner[],
  witnesses?: TransferWitness[]
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Form SH-4 — Securities Transfer — ${company.companyName}</title>
  <style>${TRANSFER_CSS}</style>
</head>
<body>
  ${sh4PageHtml(company, transferor, transferee, details, signers, witnesses)}
  <script>window.onload = function(){ window.print(); };<\/script>
</body>
</html>`;
}
