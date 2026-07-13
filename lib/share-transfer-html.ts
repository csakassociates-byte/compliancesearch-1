/* ══════════════════════════════════════════════════════════════════
   SH-4 Share Transfer Form HTML Generator
   Form SH-4 — Securities Transfer Form
   [Pursuant to Section 56 of the Companies Act, 2013 and
    Rule 11(1) of the Companies (Share Capital and Debentures) Rules, 2014]
   Exactly matches the official MCA 2-page prescribed format.
══════════════════════════════════════════════════════════════════ */

export interface TransferCompany {
  companyName: string;
  cin: string;
  regAddress: string;
  shareClass: string;    // 'Equity' | 'Preference'
  nominalValue: string;  // ₹ per share (face value)
  calledUpValue?: string; // ₹ per share (called-up — column 3 in SH-4)
  paidUpValue: string;   // ₹ per share (paid-up  — column 4 in SH-4)
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
  email?: string;
  pan?: string;
  occupation?: string;
  existingFolioNo?: string; // pre-existing folio if transferee already holds shares (M-5)
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

/* ── Number → Words ──────────────────────────────────────────── */
const ONES = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
  'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
const TENS = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

function convertHundreds(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
  return ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertHundreds(n % 100) : '');
}

export function numberToWords(n: number): string {
  if (n === 0) return 'Zero';
  const parts: string[] = [];
  let rem = Math.round(n);
  const cr  = Math.floor(rem / 10000000); rem %= 10000000;
  const lac = Math.floor(rem / 100000);   rem %= 100000;
  const th  = Math.floor(rem / 1000);     rem %= 1000;
  if (cr)  parts.push(convertHundreds(cr)  + ' Crore');
  if (lac) parts.push(convertHundreds(lac) + ' Lakh');
  if (th)  parts.push(convertHundreds(th)  + ' Thousand');
  if (rem) parts.push(convertHundreds(rem));
  return parts.join(' ');
}

export function padNum(n: number | string, len = 5): string {
  return String(n).padStart(len, '0');
}

export function fmtDate(d: string): { day: string; month: string; year: string; full: string } {
  if (!d) return { day: '___', month: '___________', year: '_______', full: '___________' };
  // Parse as local date to avoid UTC-offset off-by-one errors
  const parts = d.slice(0, 10).split('-').map(Number);
  const [y, m, day] = parts.length === 3 ? parts : [0, 0, 0];
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  if (!y) return { day: '___', month: '___________', year: '_______', full: '___________' };
  return {
    day:   String(day),
    month: months[m - 1] ?? '___',
    year:  String(y),
    full:  `${day} ${months[m - 1] ?? '___'} ${y}`,
  };
}

function cinBoxes(cin: string): string {
  const padded = (cin || '').padEnd(21, ' ');
  return Array.from(padded)
    .map(c => `<span class="cin-box">${c.trim() ? c : '&nbsp;'}</span>`)
    .join('');
}

function blank(w = '40mm'): string {
  return `<span style="display:inline-block;border-bottom:1px solid #000;min-width:${w};vertical-align:bottom;">&nbsp;</span>`;
}

/* ══════════════════════════════════════════════════════════════════
   CSS
══════════════════════════════════════════════════════════════════ */
const SH4_CSS = `
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 9.5pt; color: #000; background: #fff;
  }
  .page {
    width: 210mm; min-height: 297mm;
    padding: 9mm 11mm;
    page-break-after: always;
  }
  .outer-border {
    border: 1.5px solid #000;
    padding: 4mm 5mm;
    min-height: 279mm;
  }

  /* ── Form header ── */
  .form-header {
    text-align: center;
    border-bottom: 1px solid #000;
    padding-bottom: 3mm;
    margin-bottom: 2.5mm;
  }
  .form-no   { font-size: 8.5pt; font-weight: bold; letter-spacing: 2px; }
  .form-title { font-size: 14pt; font-weight: bold; margin: 1px 0; letter-spacing: 0.5px; }
  .pursuant  { font-size: 7.5pt; font-style: italic; line-height: 1.3; }

  .date-execution { text-align: right; font-size: 9pt; margin-bottom: 2.5mm; }
  .date-box { display: inline-block; border-bottom: 1px solid #000; min-width: 8mm; text-align: center; padding: 0 1px; }

  /* ── FOR THE CONSIDERATION ── */
  .consideration-para {
    font-size: 9pt; text-align: justify; line-height: 1.5;
    border: 1px solid #000; padding: 2mm 3mm;
    margin-bottom: 2.5mm;
  }

  /* ── Company info table ── */
  .co-table { width: 100%; border-collapse: collapse; margin-bottom: 2.5mm; font-size: 9pt; }
  .co-table td { border: 1px solid #000; padding: 2px 5px; vertical-align: middle; }
  .co-lbl   { font-size: 8.5pt; background: #fafafa; }
  .cin-box  {
    display: inline-block; width: 13px; height: 15px; line-height: 15px;
    border: 1px solid #000; text-align: center;
    font-family: "Courier New", monospace; font-size: 8pt;
    margin-right: 1px; vertical-align: middle;
  }

  /* ── Securities description table ── */
  .desc-table { width: 100%; border-collapse: collapse; margin-bottom: 2.5mm; font-size: 8.5pt; }
  .desc-table td { border: 1px solid #000; padding: 2px 4px; vertical-align: middle; }
  .sec-hdr  { font-weight: bold; text-align: center; background: #f0f0f0; font-size: 9pt; letter-spacing: 0.5px; padding: 3px 4px; }
  .col-hdr  { font-size: 7.5pt; font-weight: bold; background: #fafafa; text-align: center; line-height: 1.4; }
  .dat      { vertical-align: middle; }
  .tc       { text-align: center; }

  /* ── Section title ── */
  .sec-title {
    font-weight: bold; font-size: 9.5pt;
    border: 1px solid #000; background: #f0f0f0;
    padding: 2px 5px; text-align: center;
    text-transform: uppercase; letter-spacing: 0.5px;
    margin-bottom: 2mm;
  }

  /* ── Names / signers table ── */
  .names-tbl { width: 100%; border-collapse: collapse; margin-bottom: 2mm; font-size: 9pt; }
  .names-tbl td { border: 1px solid #000; padding: 2px 5px; }

  /* ── Page 2 transferees table ── */
  .t-tbl { width: 100%; border-collapse: collapse; font-size: 9pt; }
  .t-tbl td { border: 1px solid #000; padding: 2px 4px; vertical-align: top; }

  /* ── Folio + Specimen ── */
  .fs-tbl { width: 100%; border-collapse: collapse; margin-bottom: 2.5mm; font-size: 9pt; }
  .fs-tbl td { border: 1px solid #000; padding: 2px 5px; }

  /* ── Stamps ── */
  .stamp-row { display: flex; gap: 4mm; margin-bottom: 2.5mm; align-items: stretch; }
  .stamp-left { flex: 1; border: 1px solid #000; padding: 2.5mm; font-size: 9pt; }
  .stamps-box {
    width: 36mm; min-height: 18mm; border: 2px solid #000;
    display: flex; align-items: center; justify-content: center;
    font-weight: bold; font-size: 10pt; letter-spacing: 3px;
  }

  /* ── Enclosures ── */
  .encl-box { border: 1px solid #000; padding: 2mm 3mm; margin-bottom: 2.5mm; font-size: 9pt; }
  .encl-title { font-weight: bold; margin-bottom: 1mm; }
  .encl-item { padding-left: 3mm; margin-bottom: 0.5mm; line-height: 1.4; }

  /* ── For Office Use Only ── */
  .office-box { border: 1.5px solid #000; padding: 2.5mm; font-size: 9pt; }
  .office-hdr { font-weight: bold; text-align: center; text-decoration: underline; margin-bottom: 2mm; letter-spacing: 1px; }
  .office-line { border-bottom: 1px dashed #bbb; padding-bottom: 1.5mm; margin-bottom: 1.5mm; min-height: 6mm; }
  .office-line:last-child { border-bottom: none; margin-bottom: 0; }

  /* ── Auth signatories ── */
  .sig-row  { display: flex; gap: 8mm; margin-top: 3mm; }
  .sig-blk  { flex: 1; text-align: center; }
  .sig-line { border-bottom: 1.5px solid #000; min-height: 13mm; margin-bottom: 2px; }
  .sig-name { font-weight: bold; font-size: 9pt; }
  .sig-desig { font-size: 8pt; color: #333; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

/* ══════════════════════════════════════════════════════════════════
   PAGE 1
══════════════════════════════════════════════════════════════════ */
function buildPage1(
  company: TransferCompany,
  transferor: Transferor,
  details: TransferDetails,
  witnesses?: TransferWitness[]
): string {
  let dayStr = 'DD', monStr = 'MM', yrStr = 'YYYY';
  if (details.transferDate) {
    const d = new Date(details.transferDate);
    dayStr = String(d.getDate()).padStart(2, '0');
    monStr = String(d.getMonth() + 1).padStart(2, '0');
    yrStr  = String(d.getFullYear());
  }

  const sharesInFig   = transferor.numberOfShares.toLocaleString('en-IN');
  const sharesInWords = numberToWords(transferor.numberOfShares);
  const totalCons     = parseFloat(details.totalConsideration || '0') || 0;
  const consInFig     = totalCons > 0 ? `Rs. ${totalCons.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '';
  const consInWords   = totalCons > 0 ? `${numberToWords(Math.round(totalCons))} Only` : '';

  const w1 = witnesses?.[0];
  const w2 = witnesses?.[1];

  return `
  <div class="page">
    <div class="outer-border">

      <!-- ═══ FORM HEADER ═══ -->
      <div class="form-header">
        <div class="form-no">Form No. SH-4</div>
        <div class="form-title">Securities Transfer Form</div>
        <div class="pursuant">[Pursuant to section 56 of the Companies Act, 2013 and sub-rule (1) of rule 11 of the Companies (Share Capital and Debentures) Rules 2014]</div>
      </div>

      <!-- Date of execution -->
      <div class="date-execution">
        Date of execution:&nbsp;
        <span class="date-box">${dayStr}</span>&nbsp;/&nbsp;
        <span class="date-box">${monStr}</span>&nbsp;/&nbsp;
        <span class="date-box" style="min-width:14mm">${yrStr}</span>
      </div>

      <!-- FOR THE CONSIDERATION paragraph -->
      <div class="consideration-para">
        &nbsp;&nbsp;&nbsp;&nbsp;<strong>FOR THE CONSIDERATION</strong> of
        Rs.&nbsp;${details.totalConsideration || '___________'}&nbsp;(${consInWords || '___________'})
        paid by the Transferee(s) named herein, I/We, the Transferor(s) named herein do hereby transfer to
        the said Transferee(s), the security/securities specified hereunder.
      </div>

      <!-- Company info -->
      <table class="co-table">
        <tr>
          <td class="co-lbl" style="width:15mm;font-weight:bold">CIN</td>
          <td>${cinBoxes(company.cin)}</td>
        </tr>
        <tr>
          <td class="co-lbl">Name of the company (in full)</td>
          <td style="font-weight:bold;font-size:10pt">${company.companyName || '&nbsp;'}</td>
        </tr>
        <tr>
          <td class="co-lbl">Name of the Stock Exchange where the company is listed (if any)</td>
          <td>&nbsp;</td>
        </tr>
      </table>

      <!-- ═══ DESCRIPTION OF SECURITIES ═══ -->
      <table class="desc-table">
        <tr>
          <td colspan="4" class="sec-hdr">DESCRIPTION OF SECURITIES</td>
        </tr>
        <tr>
          <td class="col-hdr" style="width:25%">Kind/Class of<br>securities<br>(1)</td>
          <td class="col-hdr" style="width:25%">Nominal value of<br>each unit of<br>security<br>(2)</td>
          <td class="col-hdr" style="width:25%">Amount called up<br>per unit of<br>security<br>(3)</td>
          <td class="col-hdr" style="width:25%">Amount paid up<br>per unit of<br>security<br>(4)</td>
        </tr>
        <tr>
          <td class="dat tc">${company.shareClass || 'Equity'} Shares</td>
          <td class="dat tc">Rs.&nbsp;${company.nominalValue || '___'}</td>
          <td class="dat tc">Rs.&nbsp;${company.calledUpValue || company.nominalValue || '___'}</td>
          <td class="dat tc">Rs.&nbsp;${company.paidUpValue || '___'}</td>
        </tr>
        <tr>
          <td colspan="2" class="col-hdr tc" style="font-size:8pt">No. of Securities being Transferred</td>
          <td colspan="2" class="col-hdr tc" style="font-size:8pt">Consideration received (Rs.)</td>
        </tr>
        <tr>
          <td class="col-hdr tc">In figures</td>
          <td class="col-hdr tc">In words</td>
          <td class="col-hdr tc">In words</td>
          <td class="col-hdr tc">In figures</td>
        </tr>
        <tr>
          <td class="dat tc" style="font-weight:bold">${sharesInFig}</td>
          <td class="dat" style="font-size:8.5pt">${sharesInWords}</td>
          <td class="dat" style="font-size:8.5pt">${consInWords || '&nbsp;'}</td>
          <td class="dat tc">${consInFig || '&nbsp;'}</td>
        </tr>
        <tr>
          <td rowspan="2" class="col-hdr tc">Distinctive<br>Number</td>
          <td class="col-hdr tc">From</td>
          <td colspan="2" class="dat tc" style="font-weight:bold;font-family:'Courier New',monospace">
            ${padNum(transferor.distinctiveFrom)}
          </td>
        </tr>
        <tr>
          <td class="col-hdr tc">To</td>
          <td colspan="2" class="dat tc" style="font-weight:bold;font-family:'Courier New',monospace">
            ${padNum(transferor.distinctiveTo)}
          </td>
        </tr>
        <tr>
          <td colspan="2" class="col-hdr">Corresponding Certificate Nos.</td>
          <td colspan="2" class="dat" style="font-weight:bold">${transferor.certNo || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</td>
        </tr>
      </table>

      <!-- ═══ TRANSFERORS' PARTICULARS ═══ -->
      <div class="sec-title">Transferors&apos; Particulars</div>
      <div style="font-size:9pt;margin-bottom:2mm;padding:1px 0">
        &nbsp;Registered Folio Number&nbsp;&nbsp;
        <span style="border:1px solid #000;padding:1px 12px;display:inline-block;min-width:32mm">
          &nbsp;${transferor.folioNo || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}&nbsp;
        </span>
      </div>
      <table class="names-tbl">
        <tr>
          <td class="col-hdr" style="width:64%">Name(s) in full</td>
          <td class="col-hdr" style="width:36%">Signature(s)</td>
        </tr>
        <tr>
          <td style="padding:2px 5px;height:12mm;vertical-align:top">1.&nbsp;&nbsp;<strong>${transferor.name || '&nbsp;'}</strong></td>
          <td style="height:12mm;vertical-align:bottom;font-size:8pt;color:#666;padding:2px 5px">1.</td>
        </tr>
        <tr>
          <td style="padding:2px 5px;height:12mm;vertical-align:top">2.&nbsp;&nbsp;</td>
          <td style="height:12mm;vertical-align:bottom;font-size:8pt;color:#666;padding:2px 5px">2.</td>
        </tr>
        <tr>
          <td style="padding:2px 5px;height:12mm;vertical-align:top">3.&nbsp;&nbsp;</td>
          <td style="height:12mm;vertical-align:bottom;font-size:8pt;color:#666;padding:2px 5px">3.</td>
        </tr>
      </table>

      <!-- Witness -->
      <div style="font-size:8.5pt;font-style:italic;margin:2mm 0 1.5mm">
        I, hereby confirm that the transferor has signed before me.
      </div>
      <div style="font-size:9pt">
        <div style="display:flex;gap:8mm;margin-bottom:1.5mm">
          <div style="flex:1;border-bottom:1px solid #000;min-height:9mm;padding-bottom:1mm">
            <span style="font-size:7.5pt;color:#444">Signature of the Witness</span><br>
            ${w1 ? `<strong>${w1.name}</strong>` : '&nbsp;'}
          </div>
          <div style="flex:1;border-bottom:1px solid #000;min-height:9mm;padding-bottom:1mm">
            <span style="font-size:7.5pt;color:#444">Name of the Witness</span><br>
            ${w1?.name || '&nbsp;'}
          </div>
        </div>
        <div style="border-bottom:1px solid #000;min-height:9mm;padding-bottom:1mm;margin-bottom:1.5mm">
          <span style="font-size:7.5pt;color:#444">Address of the Witness</span><br>
          ${w1?.address || '&nbsp;'}
        </div>
        <div style="text-align:right;font-size:9pt">
          Pincode:&nbsp;<span style="display:inline-block;border-bottom:1px solid #000;min-width:22mm;vertical-align:bottom;">&nbsp;</span>
        </div>
      </div>

      <!-- Witness 2 -->
      <div style="font-size:9pt;margin-top:3mm">
        <div style="display:flex;gap:8mm;margin-bottom:1.5mm">
          <div style="flex:1;border-bottom:1px solid #000;min-height:9mm;padding-bottom:1mm">
            <span style="font-size:7.5pt;color:#444">Signature of Witness 2</span><br>
            ${w2 ? `<strong>${w2.name}</strong>` : '&nbsp;'}
          </div>
          <div style="flex:1;border-bottom:1px solid #000;min-height:9mm;padding-bottom:1mm">
            <span style="font-size:7.5pt;color:#444">Name of Witness 2</span><br>
            ${w2?.name || '&nbsp;'}
          </div>
        </div>
        <div style="border-bottom:1px solid #000;min-height:9mm;padding-bottom:1mm;margin-bottom:1.5mm">
          <span style="font-size:7.5pt;color:#444">Address of Witness 2</span><br>
          ${w2?.address || '&nbsp;'}
        </div>
        <div style="text-align:right;font-size:9pt">
          Pincode:&nbsp;<span style="display:inline-block;border-bottom:1px solid #000;min-width:22mm;vertical-align:bottom;">&nbsp;</span>
        </div>
      </div>

    </div>
  </div>`;
}

/* ══════════════════════════════════════════════════════════════════
   PAGE 2
══════════════════════════════════════════════════════════════════ */
function buildPage2(
  company: TransferCompany,
  transferee: Transferee,
  details: TransferDetails,
  signers: TransferSigner[]
): string {
  const addr  = transferee.address || '';
  const pinRx = addr.match(/\b(\d{6})\b/);
  const pin   = pinRx ? pinRx[1] : '';
  const cleanAddr = pin
    ? addr.replace(pin, '').replace(/,\s*$/, '').replace(/\s+/g, ' ').trim()
    : addr;

  const activeSigs = signers.filter(s => s.name);

  return `
  <div class="page" style="page-break-after:auto">
    <div class="outer-border">

      <!-- ═══ TRANSFEREES' PARTICULARS ═══ -->
      <div class="sec-title">Transferees&apos; Particulars</div>

      <table class="t-tbl" style="margin-bottom:0">
        <tr>
          <td class="col-hdr" style="width:28%">Name in full<br>(1)</td>
          <td class="col-hdr" style="width:28%">Father&apos;s/Mother&apos;s/<br>Spouse Name<br>(2)</td>
          <td class="col-hdr" style="width:44%">Address &amp; E-mail id<br>(3)</td>
        </tr>
        <tr>
          <td style="min-height:10mm;padding:2px 4px">1.&nbsp;&nbsp;<strong>${transferee.name || '&nbsp;'}</strong></td>
          <td style="min-height:10mm;padding:2px 4px">1.&nbsp;&nbsp;${transferee.fatherName || '&nbsp;'}</td>
          <td rowspan="3" style="vertical-align:top;padding:3px 5px;font-size:9pt">
            ${cleanAddr || '&nbsp;'}
            <div style="margin-top:4mm">Pin code:&nbsp;${pin || `<span style="display:inline-block;border-bottom:1px solid #000;min-width:16mm;">&nbsp;</span>`}</div>
            <div style="margin-top:2mm">Email id:&nbsp;${transferee.email || `<span style="display:inline-block;border-bottom:1px solid #000;min-width:28mm;">&nbsp;</span>`}</div>
          </td>
        </tr>
        <tr>
          <td style="min-height:10mm;padding:2px 4px">2.&nbsp;&nbsp;</td>
          <td style="min-height:10mm;padding:2px 4px">2.&nbsp;&nbsp;</td>
        </tr>
        <tr>
          <td style="min-height:10mm;padding:2px 4px">3.&nbsp;&nbsp;</td>
          <td style="min-height:10mm;padding:2px 4px">3.&nbsp;&nbsp;</td>
        </tr>
      </table>
      <table class="t-tbl" style="margin-bottom:2.5mm">
        <tr>
          <td class="col-hdr" style="width:33%;border-top:0">Occupation<br>(4)</td>
          <td class="col-hdr" style="width:33%;border-top:0">Existing Folio No., if any<br>(5)</td>
          <td class="col-hdr" style="width:34%;border-top:0">Signature<br>(6)</td>
        </tr>
        <tr>
          <td style="min-height:10mm;padding:2px 4px">1.&nbsp;&nbsp;${transferee.occupation || '&nbsp;'}</td>
          <td style="min-height:10mm;padding:2px 4px">1.&nbsp;&nbsp;${transferee.existingFolioNo || '&nbsp;'}</td>
          <td style="min-height:10mm;padding:2px 4px;vertical-align:bottom;font-size:8pt;color:#666">1.</td>
        </tr>
        <tr>
          <td style="min-height:10mm;padding:2px 4px">2.&nbsp;&nbsp;</td>
          <td style="min-height:10mm;padding:2px 4px">&nbsp;</td>
          <td style="min-height:10mm;padding:2px 4px;vertical-align:bottom;font-size:8pt;color:#666">2.</td>
        </tr>
        <tr>
          <td style="min-height:10mm;padding:2px 4px">3.&nbsp;&nbsp;</td>
          <td style="min-height:10mm;padding:2px 4px">&nbsp;</td>
          <td style="min-height:10mm;padding:2px 4px;vertical-align:bottom;font-size:8pt;color:#666">3.</td>
        </tr>
      </table>

      <!-- ═══ FOLIO + SPECIMEN SIGNATURES ═══ -->
      <table class="fs-tbl">
        <tr>
          <td class="col-hdr" style="width:40%">Folio No. of Transferee</td>
          <td class="col-hdr" style="width:60%">Specimen Signature of Transferee(s)</td>
        </tr>
        <tr>
          <td rowspan="3" style="text-align:center;vertical-align:middle;font-size:10pt;font-weight:bold;padding:4mm">
            ${transferee.newFolioNo || '&nbsp;'}
          </td>
          <td style="height:13mm;vertical-align:bottom;padding:2px 5px;font-size:8pt;color:#666">1.</td>
        </tr>
        <tr>
          <td style="height:13mm;vertical-align:bottom;padding:2px 5px;font-size:8pt;color:#666">2.</td>
        </tr>
        <tr>
          <td style="height:13mm;vertical-align:bottom;padding:2px 5px;font-size:8pt;color:#666">3.</td>
        </tr>
      </table>

      <!-- ═══ STAMPS ═══ -->
      <div class="stamp-row">
        <div class="stamp-left">
          <div style="font-size:8pt;margin-bottom:1.5mm">Value of Stamp affixed:</div>
          <div style="font-size:10pt;font-weight:bold">Rs.&nbsp;${details.stampDuty || blank('30mm')}</div>
        </div>
        <div class="stamps-box">STAMPS</div>
      </div>

      <!-- ═══ ENCLOSURES ═══ -->
      <div class="encl-box">
        <div class="encl-title">Enclosures:</div>
        <div class="encl-item">1.&nbsp;&nbsp;Certificate of shares or debentures or other securities</div>
        <div class="encl-item">2.&nbsp;&nbsp;If no certificate is issued, Letter of allotment</div>
        <div class="encl-item">3.&nbsp;&nbsp;Copy of PAN Card of all the Transferee(s) (For all listed Cos.)</div>
        <div class="encl-item">4.&nbsp;&nbsp;Others, Specify, ${blank('40mm')}</div>
      </div>

      <!-- ═══ FOR OFFICE USE ONLY ═══ -->
      <div class="office-box">
        <div class="office-hdr">For Office Use Only</div>
        <div style="display:flex;gap:5mm;margin-bottom:1.5mm">
          <div class="office-line" style="flex:1">Checked by ${blank('35mm')}</div>
          <div class="office-line" style="flex:1">Signature Tallied by ${blank('28mm')}</div>
        </div>
        <div class="office-line">
          Entered in the Register of Transfer on ${blank('35mm')} vide Transfer no ${blank('18mm')}
        </div>
        <div style="display:flex;gap:5mm;margin-bottom:1.5mm">
          <div class="office-line" style="flex:1">Approval Date ${blank('22mm')}</div>
          <div class="office-line" style="flex:2;font-size:8.5pt">
            Power of attorney / Probate / Death certificate / Letter of Administration
          </div>
        </div>
        <div class="office-line">
          Registered on ${blank('30mm')} at&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;No. ${blank('18mm')}
        </div>

        ${activeSigs.length > 0 ? `
        <div style="border-top:1px dashed #bbb;margin-top:3mm;padding-top:2.5mm">
          <div class="sig-row">
            ${activeSigs.map(s => `
            <div class="sig-blk">
              <div class="sig-line"></div>
              <div class="sig-name">${s.name}</div>
              <div class="sig-desig">${s.designation}${s.din ? ` (DIN: ${s.din})` : ''}</div>
            </div>`).join('')}
          </div>
          <div style="text-align:center;font-size:8.5pt;margin-top:2mm">For <strong>${company.companyName}</strong></div>
        </div>` : ''}
      </div>

    </div>
  </div>`;
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
  witnesses?: TransferWitness[],
  opts?: { autoPrint?: boolean }
): string {
  const printScript = opts?.autoPrint
    ? `<script>window.onload=function(){window.print();};<\/script>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Form SH-4 — Securities Transfer — ${company.companyName}</title>
  <style>${SH4_CSS}</style>
</head>
<body>
  ${buildPage1(company, transferor, details, witnesses)}
  ${buildPage2(company, transferee, details, signers)}
  ${printScript}
</body>
</html>`;
}
