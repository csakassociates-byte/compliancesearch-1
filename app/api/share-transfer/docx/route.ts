import { NextRequest, NextResponse } from "next/server";
import HTMLtoDOCX from "html-to-docx";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      html: string;
      companyName: string;
      docTitle: string;
      filename?: string;
    };

    if (!body.html) {
      return NextResponse.json({ error: "No HTML provided" }, { status: 400 });
    }

    const esc = (s: string) =>
      (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Running header — matches annual-filing style: company name + doc title
    const headerHtml = `
      <p style="text-align:center;font-family:'Times New Roman',serif;font-size:11pt;font-weight:bold;
                margin:0 0 3pt 0;border-bottom:0.5pt solid #888;padding-bottom:2pt;">
        ${esc(body.companyName)}
      </p>
      <p style="text-align:center;font-family:'Times New Roman',serif;font-size:9pt;color:#444;margin:0;">
        ${esc(body.docTitle)}
      </p>
    `;

    // Running footer — page number centred, matches annual-filing style
    const footerHtml = `
      <p style="text-align:center;font-family:'Times New Roman',serif;font-size:9pt;
                border-top:0.5pt solid #888;padding-top:2pt;margin:0;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      </p>
    `;

    const result = await HTMLtoDOCX(
      body.html,
      headerHtml,
      {
        orientation: "portrait",
        margins: {
          top: 1587,    // 28mm — matches annual filing marginTop
          right: 1134,  // 20mm — matches annual filing marginSide
          bottom: 1927, // 34mm — matches annual filing marginBottom
          left: 1134,   // 20mm
          header: 709,  // ~12.5mm header area
          footer: 709,
          gutter: 0,
        },
        font: "Times New Roman",
        fontSize: 22,    // 11pt in half-points (Word unit)
        header: true,
        footer: true,
        pageNumber: true,
        lang: "en-IN",
      },
      footerHtml
    );

    let outBuf: Buffer;
    if (Buffer.isBuffer(result)) {
      outBuf = result;
    } else if (result instanceof Blob) {
      outBuf = Buffer.from(await result.arrayBuffer());
    } else {
      outBuf = Buffer.from(result as ArrayBuffer);
    }

    const safeName = (body.filename || `SPA_${body.companyName}`)
      .replace(/[^a-zA-Z0-9_\-. ]/g, "_")
      .slice(0, 120);

    return new NextResponse(new Uint8Array(outBuf), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeName}.docx"`,
      },
    });
  } catch (err) {
    console.error("[share-transfer/docx POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "DOCX generation failed" },
      { status: 500 }
    );
  }
}
