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
  noHeaderFooter?: boolean;
}

export function getDocPdfConfig(docType: string): PdfDocConfig {
  if (docType === "director-list") {
    return { landscape: true, marginSide: "15mm", marginTop: "25mm", marginBottom: "25mm" };
  }
  if (docType === "sh4") {
    // SH-4 is a prescribed form with its own border — no header/footer, zero margin
    return { landscape: false, marginSide: "0mm", marginTop: "0mm", marginBottom: "0mm", noHeaderFooter: true };
  }
  if (docType === "share-certificate") {
    // Share certificate has its own full-page border/layout
    return { landscape: false, marginSide: "0mm", marginTop: "0mm", marginBottom: "0mm", noHeaderFooter: true };
  }
  if (docType === "spa") {
    // Share Purchase Agreement — content includes own header; no Puppeteer header/footer
    return { landscape: false, marginSide: "15mm", marginTop: "15mm", marginBottom: "15mm", noHeaderFooter: true };
  }
  if (docType === "board-resolution") {
    // Board Resolution — content includes own header/title; no Puppeteer header/footer
    return { landscape: false, marginSide: "15mm", marginTop: "15mm", marginBottom: "15mm", noHeaderFooter: true };
  }
  return { landscape: false, marginSide: "20mm", marginTop: "28mm", marginBottom: "34mm" };
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
  // Only show signature images — no name/designation/DIN text in footer
  const dirSlots = dirs
    .filter(d => d.signatureBase64)
    .map(d => `<div style="display:flex;align-items:flex-end;padding:0 6px;">
      <img src="data:image/jpeg;base64,${d.signatureBase64}" style="max-height:40px;max-width:110px;object-fit:contain;display:block;">
    </div>`).join("");

  // Only show seal image — no firm name/FRN text in footer
  const sealSlot = aud?.sealBase64
    ? `<div style="display:flex;align-items:flex-end;padding:0 6px;">
      <img src="data:image/jpeg;base64,${aud.sealBase64}" style="max-height:44px;max-width:76px;object-fit:contain;display:block;">
    </div>`
    : "";

  const content = dirSlots + sealSlot;
  if (!content) return `<div style="font-size:0;"></div>`;

  return `<div style="width:100%;box-sizing:border-box;font-size:0;
    padding:2px ${marginSide} 0;
    border-top:0.5pt solid #aaa;
    display:flex;align-items:flex-end;justify-content:${justify};
    background:white;">
    ${content}
  </div>`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
