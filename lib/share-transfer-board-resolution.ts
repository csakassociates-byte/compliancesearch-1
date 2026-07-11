/**
 * Generates a printable Board Resolution HTML for share transfer approval
 * under Section 56 of the Companies Act, 2013.
 */

export interface TransferBRCompany {
  companyName: string;
  cin: string;
  regAddress: string;
}

export interface TransferBRTransfer {
  transferorName: string;
  transferorFolio: string;
  transferorCertNo: string;
  numberOfShares: number;
  shareType: string;
  nominalValue: string;
  distinctiveFrom?: number;
  distinctiveTo?: number;
  transfereeName: string;
  transfereeFather?: string;
  transferDate: string;
  newFolioNo?: string;
  newCertNo?: string;
  transferId?: string;
}

export interface TransferBRMeeting {
  date: string;
  venue?: string;
  serialNo?: string;
  directors?: Array<{ name: string; din?: string; designation?: string }>;
}

function esc(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmtDate(d: string): string {
  if (!d) return "___________";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

export function buildTransferResolutionText(
  transfer: TransferBRTransfer,
  newFolioNo?: string,
  newCertNo?: string,
  signatoryName?: string
): string {
  const shares = transfer.numberOfShares;
  const type = transfer.shareType || "Equity";
  const nv = transfer.nominalValue || "10";
  const certNo = transfer.transferorCertNo || "—";
  const folio = transfer.transferorFolio || "—";
  const distRange = transfer.distinctiveFrom && transfer.distinctiveTo
    ? ` (Distinctive Nos. ${String(transfer.distinctiveFrom).padStart(5,"0")} to ${String(transfer.distinctiveTo).padStart(5,"0")})`
    : "";
  const eff_newCertNo = newCertNo || transfer.newCertNo || "(Auto)";
  const eff_newFolioNo = newFolioNo || transfer.newFolioNo || "(Auto)";
  const firstSigner = signatoryName || "the authorised signatory";

  const para1 =
    `RESOLVED THAT pursuant to the provisions of Section 56 of the Companies Act, 2013 ` +
    `read with Rule 11 of the Companies (Share Capital and Debentures) Rules, 2014 and ` +
    `the Articles of Association of the Company, the Board of Directors hereby approves ` +
    `the transfer of ${shares} (${numberToWords(shares)}) ${type} Share${shares !== 1 ? "s" : ""} ` +
    `of Rs. ${nv}/- each (fully paid-up), bearing Certificate No. ${certNo}, Folio No. ${folio}${distRange}, ` +
    `from ${transfer.transferorName} to ${transfer.transfereeName}, ` +
    `as per Form SH-4 executed on ${fmtDate(transfer.transferDate)}, ` +
    `subject to submission of a valid instrument of transfer in Form SH-4 duly stamped and executed ` +
    `by both parties, together with the original share certificate.`;

  const para2 =
    `RESOLVED FURTHER THAT the name of ${transfer.transfereeName} be and is hereby entered in ` +
    `the Register of Members of the Company as the registered holder of the aforesaid ` +
    `${shares} ${type} Share${shares !== 1 ? "s" : ""}, in place of ${transfer.transferorName}, ` +
    `and that a new share certificate bearing Certificate No. ${eff_newCertNo}, ` +
    `Folio No. ${eff_newFolioNo} be issued to ${transfer.transfereeName}.`;

  const para3 =
    `RESOLVED FURTHER THAT ${firstSigner} be and is hereby authorised to do all acts, deeds, ` +
    `and things as may be necessary or expedient to give effect to the foregoing resolution, ` +
    `including filing of the necessary forms with the Registrar of Companies.`;

  return `${para1}\n\n${para2}\n\n${para3}`;
}

function numberToWords(n: number): string {
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
                 "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen",
                 "Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];

  if (n === 0) return "Zero";
  if (n < 0) return "Minus " + numberToWords(-n);
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n/10)] + (n % 10 ? " " + ones[n % 10] : "");
  if (n < 1000) return ones[Math.floor(n/100)] + " Hundred" + (n % 100 ? " " + numberToWords(n % 100) : "");
  if (n < 100000) return numberToWords(Math.floor(n/1000)) + " Thousand" + (n % 1000 ? " " + numberToWords(n % 1000) : "");
  if (n < 10000000) return numberToWords(Math.floor(n/100000)) + " Lakh" + (n % 100000 ? " " + numberToWords(n % 100000) : "");
  return numberToWords(Math.floor(n/10000000)) + " Crore" + (n % 10000000 ? " " + numberToWords(n % 10000000) : "");
}

export function generateTransferBoardResolutionHTML(
  company: TransferBRCompany,
  transfer: TransferBRTransfer,
  meeting: TransferBRMeeting,
  signatories: Array<{ name: string; din?: string; designation?: string }>,
  resolutionText?: string,
  opts?: { autoPrint?: boolean }
): string {
  const resText = resolutionText || buildTransferResolutionText(
    transfer,
    transfer.newFolioNo,
    transfer.newCertNo,
    signatories[0]?.name
  );

  const meetingSerial = meeting.serialNo || "01";
  const venue = meeting.venue || "Registered Office of the Company";

  const directorsRows = (meeting.directors || signatories).map(d => `
    <tr>
      <td>${esc(d.name || "")}</td>
      <td>${esc(d.designation || "Director")}</td>
      <td>${esc(d.din || "—")}</td>
    </tr>`).join("");

  const signatureBlocks = signatories
    .filter(s => s.name)
    .map(s => `
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-name">${esc(s.name)}</div>
        <div class="sig-desig">${esc(s.designation || "Director")}</div>
        ${s.din ? `<div class="sig-din">DIN: ${esc(s.din)}</div>` : ""}
      </div>`).join("");

  const resParas = resText.split("\n\n").map(p =>
    `<p class="res-para">${esc(p).replace(/\n/g, "<br/>")}</p>`
  ).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Board Resolution — Share Transfer — ${esc(company.companyName)}</title>
<style>
  @page { size: A4 portrait; margin: 18mm 20mm 22mm 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Times New Roman", Times, serif; font-size: 11pt; color: #000; background: #fff; }

  .company-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 14px; }
  .company-name  { font-size: 14pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
  .company-sub   { font-size: 9pt; color: #333; margin-top: 3px; }

  .doc-title { text-align: center; font-size: 12pt; font-weight: bold; text-transform: uppercase;
               letter-spacing: 0.8px; margin: 14px 0 4px; border: 1.5px solid #000; padding: 8px 0; }
  .doc-sub   { text-align: center; font-size: 10pt; font-weight: bold; margin-bottom: 14px; }

  table.meta-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 10.5pt; }
  table.meta-table td { padding: 4px 8px; border: 1px solid #999; }
  table.meta-table td:first-child { width: 38%; font-weight: bold; background: #f9f9f9; }

  .section-head { font-size: 11pt; font-weight: bold; text-transform: uppercase;
                  border-top: 1.5px solid #000; border-bottom: 1px solid #999;
                  padding: 5px 0; margin: 14px 0 10px; }

  .discussion { margin-bottom: 12px; line-height: 1.6; text-align: justify; font-size: 10.5pt; }

  .resolution-box { border: 1.5px solid #000; padding: 10px 14px; margin-bottom: 14px; background: #fafafa; }
  .res-para { line-height: 1.7; text-align: justify; font-size: 10.5pt; margin-bottom: 10px; }
  .res-para:last-child { margin-bottom: 0; }

  table.directors-table { width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 14px; }
  table.directors-table th { background: #f0f0f0; border: 1px solid #999; padding: 4px 8px; text-align: left; font-weight: bold; }
  table.directors-table td { border: 1px solid #ccc; padding: 4px 8px; }

  .signatures-section { margin-top: 20px; }
  .signatures-row { display: flex; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
  .sig-block { flex: 1; min-width: 160px; text-align: center; margin-top: 10px; }
  .sig-line  { border-bottom: 1px solid #000; width: 80%; margin: 0 auto 6px; height: 40px; }
  .sig-name  { font-weight: bold; font-size: 10pt; }
  .sig-desig { font-size: 9.5pt; }
  .sig-din   { font-size: 9pt; color: #555; }

  .footer-note { text-align: center; font-size: 8.5pt; color: #666; margin-top: 20px;
                 border-top: 1px solid #ccc; padding-top: 8px; }
</style>
${opts?.autoPrint ? "<script>window.onload=()=>window.print();</script>" : ""}
</head>
<body>

<div class="company-header">
  <div class="company-name">${esc(company.companyName)}</div>
  <div class="company-sub">CIN: ${esc(company.cin || "—")} &nbsp;|&nbsp; ${esc(company.regAddress || "")}</div>
</div>

<div class="doc-title">Extract of Minutes of Meeting of Board of Directors</div>
<div class="doc-sub">Board Meeting No. ${esc(meetingSerial)} held on ${fmtDate(meeting.date)}</div>

<table class="meta-table">
  <tr><td>Meeting No.</td><td>${esc(meetingSerial)}</td></tr>
  <tr><td>Date of Meeting</td><td>${fmtDate(meeting.date)}</td></tr>
  <tr><td>Venue</td><td>${esc(venue)}</td></tr>
  <tr><td>Transfer Date</td><td>${fmtDate(transfer.transferDate)}</td></tr>
  <tr><td>Transfer ID</td><td>${esc(transfer.transferId || "—")}</td></tr>
</table>

${meeting.directors?.length ? `
<div class="section-head">Directors Present</div>
<table class="directors-table">
  <thead><tr><th>Name</th><th>Designation</th><th>DIN</th></tr></thead>
  <tbody>${directorsRows}</tbody>
</table>` : ""}

<div class="section-head">Agenda Item: Approval of Transfer of Shares — Section 56</div>

<div class="discussion">
  The Board of Directors considered the request for transfer of <strong>${transfer.numberOfShares}</strong>
  (${numberToWords(transfer.numberOfShares)}) ${esc(transfer.shareType || "Equity")} Share${transfer.numberOfShares !== 1 ? "s" : ""}
  from <strong>${esc(transfer.transferorName)}</strong> to <strong>${esc(transfer.transfereeName)}</strong>
  as evidenced by Form SH-4 and the original share certificate bearing Certificate No. ${esc(transfer.transferorCertNo || "—")},
  Folio No. ${esc(transfer.transferorFolio || "—")}.
  After due deliberation, the following resolution was passed:
</div>

<div class="resolution-box">
  ${resParas}
</div>

<div class="signatures-section">
  <div class="section-head">Signatures</div>
  <div class="signatures-row">${signatureBlocks || `<div class="sig-block"><div class="sig-line"></div><div class="sig-name">Director</div></div>`}</div>
</div>

<div class="footer-note">
  This is an extract of the minutes of the Board Meeting held on ${fmtDate(meeting.date)}.
  Certified to be a true copy of the resolution passed at the above meeting.
</div>

</body>
</html>`;
}
