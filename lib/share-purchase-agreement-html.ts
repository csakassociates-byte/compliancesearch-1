/**
 * Generates a printable Share Purchase Agreement (SPA) HTML
 * for transfer of equity shares under Section 56 of the Companies Act, 2013.
 */

export interface SPACompany {
  companyName: string;
  cin: string;
  regAddress: string;
}

export interface SPAParty {
  name: string;
  relation: string;        // "S/O" | "W/O" | "D/O"
  relativeName: string;    // father's / husband's name
  address: string;
  pan?: string;
  din?: string;
}

export interface SPAShareDetails {
  numberOfShares: number;
  shareType: string;
  nominalValue: string;
  folioNo: string;
  certNo: string;
  considerationPerShare: string;
  totalConsideration: string;
  paymentMode: string;     // "Bank Transfer" | "Cheque" | "Cash"
  agreementDate: string;
  place: string;
}

export interface SPAWitness {
  name: string;
  address: string;
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

function fmtMoney(s: string): string {
  if (!s) return "—";
  const n = parseFloat(s);
  if (isNaN(n)) return s;
  return `&#8377; ${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function numberToWords(n: number): string {
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
                 "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen",
                 "Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  if (n === 0) return "Zero";
  if (n < 0) return "Minus " + numberToWords(-n);
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + numberToWords(n % 100) : "");
  if (n < 100000) return numberToWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + numberToWords(n % 1000) : "");
  if (n < 10000000) return numberToWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + numberToWords(n % 100000) : "");
  return numberToWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + numberToWords(n % 10000000) : "");
}

function moneyToWords(s: string): string {
  const n = parseFloat(s);
  if (!s || isNaN(n)) return "—";
  const rupees = Math.floor(n);
  const paise = Math.round((n - rupees) * 100);
  let result = numberToWords(rupees) + " Rupees";
  if (paise > 0) result += " and " + numberToWords(paise) + " Paise";
  return result + " Only";
}

export function generateSPAHTML(
  company: SPACompany,
  seller: SPAParty,
  buyer: SPAParty,
  details: SPAShareDetails,
  witnesses: SPAWitness[],
  opts?: { autoPrint?: boolean }
): string {

  const paymentModes = ["Bank Transfer", "Cheque", "Cash"];
  const paymentLine = paymentModes.map(m =>
    `<span style="margin-right:18px;">${details.paymentMode === m ? "&#9745;" : "&#9744;"} ${m}</span>`
  ).join("");

  const w1 = witnesses[0] || { name: "", address: "" };
  const w2 = witnesses[1] || { name: "", address: "" };

  const sellerPartyLine = [
    `<strong>${esc(seller.name)}</strong>`,
    seller.relation && seller.relativeName
      ? `${esc(seller.relation)} ${esc(seller.relativeName)}`
      : seller.relation
      ? `${esc(seller.relation)} ___________`
      : "",
  ].filter(Boolean).join(", ");

  const buyerPartyLine = [
    `<strong>${esc(buyer.name)}</strong>`,
    buyer.relation && buyer.relativeName
      ? `${esc(buyer.relation)} ${esc(buyer.relativeName)}`
      : buyer.relation
      ? `${esc(buyer.relation)} ___________`
      : "",
  ].filter(Boolean).join(", ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Share Purchase Agreement &mdash; ${esc(company.companyName)}</title>
<style>
  @page { size: A4 portrait; margin: 20mm 22mm 22mm 22mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Times New Roman", Times, serif; font-size: 11pt; color: #000; background: #fff; line-height: 1.65; }

  .title-block { text-align: center; margin-bottom: 16px; border-bottom: 2px solid #000; padding-bottom: 12px; }
  .doc-title  { font-size: 14pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.8px; }
  .doc-sub    { font-size: 10.5pt; margin-top: 4px; color: #222; }
  .doc-date   { font-size: 10pt; margin-top: 6px; color: #333; }

  .between-word { text-align: center; font-weight: bold; font-size: 11pt; margin: 10px 0;
                  text-transform: uppercase; letter-spacing: 1px; }
  .party-block  { margin-bottom: 10px; font-size: 10.5pt; line-height: 1.7; text-align: justify; }
  .in-respect   { font-weight: bold; font-size: 10.5pt; text-transform: uppercase;
                  border-top: 1px solid #ccc; margin-top: 10px; padding-top: 8px; margin-bottom: 4px; }

  .whereas-head { font-weight: bold; font-size: 11pt; text-transform: uppercase;
                  border-top: 1.5px solid #000; margin-top: 14px; padding-top: 8px; margin-bottom: 8px; }
  .whereas      { margin-bottom: 8px; text-align: justify; font-size: 10.5pt; }

  .now-block { text-align: center; font-weight: bold; font-size: 11pt; text-transform: uppercase;
               border-top: 1px solid #999; border-bottom: 1px solid #999; padding: 6px 0; margin: 12px 0;
               letter-spacing: 0.5px; }

  .cl-head { font-weight: bold; font-size: 11pt; text-transform: uppercase; margin: 14px 0 5px; }
  .cl      { margin-bottom: 7px; text-align: justify; font-size: 10.5pt; }
  .cl-a    { margin-bottom: 4px; font-size: 10.5pt; margin-left: 22px; text-align: justify; }

  .sig-section { margin-top: 26px; }
  .sig-banner  { font-weight: bold; font-size: 10.5pt; text-transform: uppercase;
                 border-top: 1.5px solid #000; padding-top: 8px; margin-bottom: 14px; }
  .sig-row     { display: flex; justify-content: space-between; gap: 30px; }
  .sig-block   { flex: 1; }
  .sig-label   { font-weight: bold; font-size: 10.5pt; margin-bottom: 4px; }
  .sig-line    { border-bottom: 1px solid #000; height: 38px; margin: 6px 0 4px; }
  .sig-name    { font-size: 10.5pt; font-weight: bold; }
  .sig-meta    { font-size: 9.5pt; color: #444; margin-top: 1px; }

  .witness-section { margin-top: 22px; border-top: 1px solid #ccc; padding-top: 12px; }
  .witness-title   { font-weight: bold; font-size: 10.5pt; text-transform: uppercase; margin-bottom: 12px; }
  .witness-row     { display: flex; gap: 30px; }
  .witness-block   { flex: 1; }
  .w-label         { font-size: 10.5pt; font-weight: bold; margin-bottom: 3px; }
  .w-line          { border-bottom: 1px solid #000; height: 36px; margin: 4px 0 4px; }
  .w-meta          { font-size: 9.5pt; color: #444; }
</style>
${opts?.autoPrint ? "<script>window.onload=()=>window.print();</script>" : ""}
</head>
<body>

<!-- ─── TITLE ─── -->
<div class="title-block">
  <div class="doc-title">Share Purchase Agreement</div>
  <div class="doc-sub">(Transfer of Equity Shares)</div>
  <div class="doc-date">
    Executed on <strong>${fmtDate(details.agreementDate)}</strong> at <strong>${esc(details.place || "___________")}</strong>
  </div>
</div>

<!-- ─── PARTIES ─── -->
<div class="between-word">Between</div>

<div class="party-block">
  ${sellerPartyLine},<br>
  ${esc(seller.address || "___________")}
  ${seller.pan ? `,<br><strong>PAN: ${esc(seller.pan)}</strong>` : ""}
  ${seller.din ? `,<br><strong>DIN: ${esc(seller.din)}</strong>` : ""}<br>
  (hereinafter referred to as the <strong>"Seller" / "Transferor"</strong>, which expression shall unless
  repugnant to the context mean and include his/her heirs, legal representatives and assigns)
</div>

<div class="between-word">And</div>

<div class="party-block">
  ${buyerPartyLine},<br>
  ${esc(buyer.address || "___________")}
  ${buyer.pan ? `,<br><strong>PAN: ${esc(buyer.pan)}</strong>` : ""}<br>
  (hereinafter referred to as the <strong>"Buyer" / "Transferee"</strong>, which expression shall unless
  repugnant to the context mean and include his/her heirs, legal representatives and assigns)
</div>

<div class="in-respect">In Respect Of</div>

<div class="party-block">
  <strong>${esc(company.companyName)}</strong>${company.cin ? ` (CIN: ${esc(company.cin)})` : ""},<br>
  a Company incorporated under the Companies Act, 2013,<br>
  having its Registered Office at: ${esc(company.regAddress || "—")}<br>
  (hereinafter referred to as the <strong>"Company"</strong>)
</div>

<!-- ─── RECITALS ─── -->
<div class="whereas-head">Recitals</div>

<div class="whereas">
  <strong>A.</strong>&nbsp; The Company is a private limited company incorporated under the Companies Act, 2013,
  having an authorised and paid-up share capital divided into ${esc(details.shareType)} Shares of face
  value &#8377;${esc(details.nominalValue)}/- each.
</div>
<div class="whereas">
  <strong>B.</strong>&nbsp; The Seller is an existing shareholder of the Company and is the legal and beneficial
  owner of <strong>${details.numberOfShares.toLocaleString("en-IN")} (${numberToWords(details.numberOfShares)})</strong>
  ${esc(details.shareType)} Shares of &#8377;${esc(details.nominalValue)}/- each, fully paid-up, bearing
  Folio No. <strong>${esc(details.folioNo || "—")}</strong> and
  Certificate No. <strong>${esc(details.certNo || "—")}</strong>.
</div>
<div class="whereas">
  <strong>C.</strong>&nbsp; The Seller has agreed to sell and transfer, and the Buyer has agreed to purchase
  and acquire, <strong>${details.numberOfShares.toLocaleString("en-IN")} (${numberToWords(details.numberOfShares)})</strong>
  ${esc(details.shareType)} Shares of the Company on the terms and conditions set out herein.
</div>
<div class="whereas">
  <strong>D.</strong>&nbsp; This Agreement is executed in accordance with Section 56 of the Companies Act, 2013
  read with Rule 11 of the Companies (Share Capital and Debentures) Rules, 2014 and the Articles of Association
  of the Company.
</div>

<div class="now-block">Now This Share Purchase Agreement Witnesseth As Under</div>

<!-- ─── CLAUSES ─── -->
<div class="cl-head">1.&nbsp; Sale and Transfer of Shares</div>
<div class="cl">
  1.1&nbsp; Subject to the terms of this Agreement, the Seller hereby agrees to sell, transfer and convey to
  the Buyer, and the Buyer hereby agrees to purchase from the Seller,
  <strong>${details.numberOfShares.toLocaleString("en-IN")} (${numberToWords(details.numberOfShares)})</strong>
  ${esc(details.shareType)} Shares of the Company of face value &#8377;${esc(details.nominalValue)}/- each,
  fully paid-up (<strong>"Sale Shares"</strong>).
</div>
<div class="cl">
  1.2&nbsp; The Sale Shares shall be transferred together with all rights, title, interests and benefits
  attached thereto, including dividend and voting rights (if any), free from all encumbrances.
</div>

<div class="cl-head">2.&nbsp; Consideration</div>
<div class="cl">
  2.1&nbsp; The consideration for the transfer of the Sale Shares shall be
  <strong>${fmtMoney(details.totalConsideration)} (${moneyToWords(details.totalConsideration)})</strong>,
  calculated at &#8377;${esc(details.considerationPerShare)}/- per ${esc(details.shareType)} Share
  (<strong>"Purchase Consideration"</strong>).
</div>
<div class="cl">
  2.2&nbsp; The Purchase Consideration shall be paid by the Buyer to the Seller by:
  &nbsp;&nbsp;${paymentLine}<br>
  on or before the execution of the share transfer documents.
</div>
<div class="cl">
  2.3&nbsp; The Seller acknowledges receipt of the Purchase Consideration in full and confirms
  that no further amount is due or payable in respect of the Sale Shares.
</div>

<div class="cl-head">3.&nbsp; Closing &amp; Transfer Formalities</div>
<div class="cl">3.1&nbsp; The Seller shall execute and deliver to the Buyer:</div>
<div class="cl-a">(a)&nbsp; Duly signed Share Transfer Deed in Form SH-4;</div>
<div class="cl-a">(b)&nbsp; Original Share Certificate(s) bearing the Sale Shares; and</div>
<div class="cl-a">(c)&nbsp; Any other document required for effecting the transfer.</div>
<div class="cl">
  3.2&nbsp; The Buyer shall submit the executed transfer documents to the Company for approval and
  registration of the transfer.
</div>
<div class="cl">
  3.3&nbsp; The Company shall, upon compliance with applicable law and approval by its Board of Directors,
  register the transfer and issue a new share certificate in favour of the Buyer.
</div>

<div class="cl-head">4.&nbsp; Representations &amp; Warranties of the Seller</div>
<div class="cl">The Seller represents and warrants to the Buyer that:</div>
<div class="cl-a">(a)&nbsp; He/She is the sole legal and beneficial owner of the Sale Shares;</div>
<div class="cl-a">(b)&nbsp; The Sale Shares are free from any lien, charge, pledge, mortgage or encumbrance of any nature;</div>
<div class="cl-a">(c)&nbsp; He/She has full power, authority and capacity to execute this Agreement and transfer the Sale Shares;</div>
<div class="cl-a">(d)&nbsp; There is no restriction under any law, contract or articles preventing the proposed transfer; and</div>
<div class="cl-a">(e)&nbsp; All information provided to the Buyer is true, accurate and complete.</div>

<div class="cl-head">5.&nbsp; Representations &amp; Warranties of the Buyer</div>
<div class="cl">The Buyer represents and warrants to the Seller that:</div>
<div class="cl-a">(a)&nbsp; He/She has the full legal capacity and authority to acquire the Sale Shares;</div>
<div class="cl-a">(b)&nbsp; He/She has sufficient funds to pay the Purchase Consideration; and</div>
<div class="cl-a">(c)&nbsp; He/She agrees to be bound by the Memorandum and Articles of Association of the Company.</div>

<div class="cl-head">6.&nbsp; Indemnity</div>
<div class="cl">
  Each Party agrees to indemnify and hold harmless the other Party against any loss, claim, damage or liability
  arising from any breach of its representations, warranties or obligations under this Agreement.
</div>

<div class="cl-head">7.&nbsp; Confidentiality</div>
<div class="cl">
  The Parties shall keep the terms of this Agreement and all information relating to the Company strictly
  confidential and shall not disclose the same to any third party, except as required by applicable law
  or any regulatory authority.
</div>

<div class="cl-head">8.&nbsp; Governing Law &amp; Jurisdiction</div>
<div class="cl">
  This Agreement shall be governed by and construed in accordance with the laws of India.
  The courts at <strong>${esc(details.place || "—")}</strong> shall have exclusive jurisdiction over
  all disputes arising out of or in connection with this Agreement.
</div>

<div class="cl-head">9.&nbsp; Miscellaneous</div>
<div class="cl">
  9.1&nbsp; This Agreement constitutes the entire understanding between the Parties and supersedes all prior
  agreements, negotiations and understandings, whether oral or written.
</div>
<div class="cl">
  9.2&nbsp; Any amendment or modification shall be valid only if made in writing and signed by both Parties.
</div>
<div class="cl">
  9.3&nbsp; This Agreement may be executed in counterparts, each of which shall be deemed an original and
  all of which together shall constitute one and the same instrument.
</div>

<!-- ─── SIGNATURES ─── -->
<div class="sig-section">
  <div class="sig-banner">
    In Witness Whereof, the Parties have executed this Agreement on the day, month and year first written above.
  </div>
  <div class="sig-row">
    <div class="sig-block">
      <div class="sig-label">Seller / Transferor</div>
      <div class="sig-line"></div>
      <div class="sig-name">${esc(seller.name)}</div>
      ${seller.din ? `<div class="sig-meta">DIN: ${esc(seller.din)}</div>` : ""}
      ${seller.pan ? `<div class="sig-meta">PAN: ${esc(seller.pan)}</div>` : ""}
      <div class="sig-meta">Date: ___________________</div>
    </div>
    <div class="sig-block">
      <div class="sig-label">Buyer / Transferee</div>
      <div class="sig-line"></div>
      <div class="sig-name">${esc(buyer.name)}</div>
      ${buyer.pan ? `<div class="sig-meta">PAN: ${esc(buyer.pan)}</div>` : ""}
      <div class="sig-meta">Date: ___________________</div>
    </div>
  </div>
</div>

<!-- ─── WITNESSES ─── -->
<div class="witness-section">
  <div class="witness-title">Witnesses</div>
  <div class="witness-row">
    <div class="witness-block">
      <div class="w-label">Witness 1</div>
      <div class="w-line"></div>
      <div class="w-meta">Name: <strong>${esc(w1.name || "___________________")}</strong></div>
      <div class="w-meta">Address: ${esc(w1.address || "___________________")}</div>
    </div>
    <div class="witness-block">
      <div class="w-label">Witness 2</div>
      <div class="w-line"></div>
      <div class="w-meta">Name: <strong>${esc(w2.name || "___________________")}</strong></div>
      <div class="w-meta">Address: ${esc(w2.address || "___________________")}</div>
    </div>
  </div>
</div>

</body>
</html>`;
}
