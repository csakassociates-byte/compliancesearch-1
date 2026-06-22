/**
 * Puppeteer-specific header/footer templates for PDF generation.
 * These run in an isolated iframe context — all styles must be inline.
 */

export type PdfDirSlot = {
  name?: string;
  designation?: string;
  din?: string;
  signatureBase64?: string;
};

export type PdfAudSlot = {
  firmName?: string;
  frn?: string;
  sealBase64?: string;
};

export interface PdfDocConfig {
  landscape: boolean;
  marginSide: string;
  marginTop: string;
  marginBottom: string;
}

export function getDocPdfConfig(docType: string): PdfDocConfig {
  if (docType === "director-list") {
    return { landscape: true, marginSide: "15mm", marginTop: "25mm", marginBottom: "25mm" };
  }
  return { landscape: false, marginSide: "20mm", marginTop: "28mm", marginBottom: "28mm" };
}

export function buildPuppeteerHeader(
  companyName: string,
  docTitle: string,
  marginSide = "20mm"
): string {
  return `<div style="width:100%;box-sizing:border-box;font-size:0;
    padding:3px ${marginSide} 2px;
    border-bottom:0.5pt solid #aaa;
    display:flex;justify-content:space-between;align-items:center;
    background:white;">
    <span style="font-size:8px;font-weight:bold;font-family:'Times New Roman',serif;color:#000;
      max-width:38%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
    >${escHtml(companyName)}</span>
    <span style="font-size:7.5px;font-family:'Times New Roman',serif;color:#444;
      text-align:center;flex:1;padding:0 6px;overflow:hidden;white-space:nowrap;"
    >${escHtml(docTitle)}</span>
    <span style="font-size:7.5px;font-family:'Times New Roman',serif;color:#555;white-space:nowrap;"
    >Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
  </div>`;
}

export function buildPuppeteerFooter(
  dirs: PdfDirSlot[],
  aud?: PdfAudSlot,
  justify: "space-between" | "flex-end" = "space-between",
  marginSide = "20mm"
): string {
  const dirSlots = dirs
    .filter(d => d.name)
    .map(d => `<div style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:0;padding:0 2px;">
      ${d.signatureBase64
        ? `<img src="data:image/jpeg;base64,${d.signatureBase64}" style="max-height:20px;max-width:70px;object-fit:contain;display:block;">`
        : `<div style="height:20px;"></div>`}
      <div style="font-size:6.5px;font-weight:bold;font-family:serif;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%;color:#000;">${escHtml(d.name!)}</div>
      ${d.designation ? `<div style="font-size:5.5px;font-family:serif;color:#333;text-align:center;white-space:nowrap;">${escHtml(d.designation)}</div>` : ""}
      ${d.din ? `<div style="font-size:5.5px;font-family:serif;color:#333;text-align:center;">DIN: ${escHtml(d.din)}</div>` : ""}
    </div>`).join("");

  const sealSlot = aud && (aud.firmName || aud.sealBase64)
    ? `<div style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:0;padding:0 2px;">
      ${aud.sealBase64
        ? `<img src="data:image/jpeg;base64,${aud.sealBase64}" style="max-height:24px;max-width:56px;object-fit:contain;display:block;">`
        : `<div style="height:24px;"></div>`}
      ${aud.firmName ? `<div style="font-size:6.5px;font-weight:bold;font-family:serif;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%;color:#000;">M/s. ${escHtml(aud.firmName)}</div>` : ""}
      ${aud.frn ? `<div style="font-size:5.5px;font-family:serif;color:#333;text-align:center;">FRN: ${escHtml(aud.frn)}</div>` : ""}
    </div>`
    : "";

  if (!dirSlots && !sealSlot) return `<div style="font-size:0;"></div>`;

  return `<div style="width:100%;box-sizing:border-box;font-size:0;
    padding:2px ${marginSide} 0;
    border-top:0.5pt solid #aaa;
    display:flex;align-items:flex-end;justify-content:${justify};
    background:white;">
    ${dirSlots}${sealSlot}
  </div>`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
