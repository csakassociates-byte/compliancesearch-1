import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  buildPuppeteerHeader,
  buildPuppeteerFooter,
  getDocPdfConfig,
  type PdfDirSlot,
  type PdfAudSlot,
} from "@/lib/annual-filing/pdf-templates";

export const maxDuration = 30;

async function launchBrowser() {
  const puppeteer = (await import("puppeteer-core")).default;
  if (process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
      defaultViewport: { width: 1280, height: 800 },
    });
  }
  // Local development — requires Chrome installed
  return puppeteer.launch({
    executablePath:
      process.env.CHROME_EXECUTABLE_PATH ||
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      html: string;
      filename: string;
      docType: string;
      companyName: string;
      docTitle: string;
      dirs: PdfDirSlot[];
      auditor?: PdfAudSlot;
    };

    if (!body.html) {
      return NextResponse.json({ error: "No HTML provided" }, { status: 400 });
    }

    const cfg = getDocPdfConfig(body.docType);
    const isAudit = body.docType === "audit-report";
    const isNotes = body.docType === "notes-on-accounts";

    const headerTemplate = buildPuppeteerHeader(
      body.companyName,
      body.docTitle,
      cfg.marginSide
    );

    const footerDirs    = isAudit ? [] : (body.dirs ?? []);
    const footerAud     = isAudit || isNotes ? body.auditor : undefined;
    const footerJustify = isAudit ? "flex-end" : "space-between";
    const footerTemplate = buildPuppeteerFooter(
      footerDirs,
      footerAud,
      footerJustify,
      cfg.marginSide
    );

    const browser = await launchBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(body.html, { waitUntil: "domcontentloaded" });

      // Hide the inline CSS footer — Puppeteer's native footer handles every page
      await page.addStyleTag({
        content: [
          ".page-sig-footer { display: none !important; }",
          ".has-page-footer { padding-bottom: 0 !important; }",
        ].join(" "),
      });

      const pdf = await page.pdf({
        format: "A4",
        landscape: cfg.landscape,
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate,
        footerTemplate,
        margin: {
          top:    cfg.marginTop,
          right:  cfg.marginSide,
          bottom: cfg.marginBottom,
          left:   cfg.marginSide,
        },
      });

      const safeName = body.filename
        .replace(/[^a-zA-Z0-9_\-. ]/g, "_")
        .slice(0, 120);

      return new NextResponse(Buffer.from(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
        },
      });
    } finally {
      await browser.close();
    }
  } catch (err) {
    console.error("[generate-pdf POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PDF generation failed" },
      { status: 500 }
    );
  }
}
