import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  try {
    const { html, filename, isLandscape, companyName, docTitle } = await req.json() as {
      html: string;
      filename: string;
      isLandscape?: boolean;
      companyName?: string;
      docTitle?: string;
    };

    if (!html) return NextResponse.json({ error: "html required" }, { status: 400 });

    // Local dev: use system Chrome; Production (Vercel): use @sparticuz/chromium
    let executablePath: string;
    let launchArgs: string[];

    if (process.env.NODE_ENV === "production") {
      const chromium = (await import("@sparticuz/chromium")).default;
      executablePath = await chromium.executablePath();
      launchArgs = chromium.args;
    } else {
      // Windows local Chrome path — adjust if needed
      const possiblePaths = [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        "/usr/bin/google-chrome",
        "/usr/bin/chromium-browser",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      ];
      const fs = await import("fs");
      executablePath = possiblePaths.find(p => fs.existsSync(p)) || possiblePaths[0];
      launchArgs = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"];
    }

    const puppeteer = await import("puppeteer-core");
    const browser = await puppeteer.default.launch({
      executablePath,
      args: launchArgs,
      headless: true,
    });

    try {
      const page = await browser.newPage();

      // Inject running header into the HTML (company name + doc title + page X/Y)
      const safeCompany = (companyName || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const safeTitle   = (docTitle   || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      const htmlWithHeader = html.replace(
        /<\/head>/i,
        `<style>
          @media print {
            .pdf-running-header {
              position: fixed; top: 0; left: 0; right: 0;
              height: 14mm;
              display: flex; align-items: center; justify-content: space-between;
              padding: 0 20mm;
              font-family: Arial, sans-serif; font-size: 7.5pt; color: #555;
              border-bottom: 0.4pt solid #bbb;
              background: white; z-index: 99999;
            }
            body { padding-top: calc(20mm + 14mm) !important; }
          }
          @media screen { .pdf-running-header { display: none; } }
        </style>
        <script>
          // Page numbers via JS (runs before print)
          window.addEventListener('beforeprint', () => {
            const els = document.querySelectorAll('.pdf-page-num');
            els.forEach(el => { el.textContent = ''; });
          });
        </script>
        </head>`
      ).replace(
        /<body([^>]*)>/i,
        `<body$1>
        <div class="pdf-running-header">
          <span style="font-weight:bold;max-width:45%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${safeCompany}</span>
          <span style="color:#777;max-width:40%;text-align:center;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${safeTitle}</span>
          <span style="white-space:nowrap;">Page&nbsp;<span id="pdf-pg-num"></span></span>
        </div>`
      );

      await page.setContent(htmlWithHeader, { waitUntil: "load" });

      // Wait for images (signatures/seals) to render
      await page.evaluate(() => {
        return Promise.all(
          Array.from(document.images)
            .filter(img => !img.complete)
            .map(img => new Promise(resolve => {
              img.onload = img.onerror = resolve;
            }))
        );
      });

      const pdfBuffer = await page.pdf({
        format: "A4",
        landscape: isLandscape ?? false,
        printBackground: true,
        // Let HTML CSS handle all margins (@page margin:0 is already in the HTML)
      });

      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        },
      });
    } finally {
      await browser.close();
    }
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PDF generation failed" },
      { status: 500 }
    );
  }
}
