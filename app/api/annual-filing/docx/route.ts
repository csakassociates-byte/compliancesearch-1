import { NextRequest, NextResponse } from "next/server";
import HTMLtoDOCX from "html-to-docx";

export async function POST(req: NextRequest) {
  try {
    const { html, key, label, companyName, financialYear } = await req.json() as {
      html: string; key: string; label: string;
      companyName?: string; financialYear?: string;
    };

    if (!html) return NextResponse.json({ error: "html required" }, { status: 400 });

    const isLandscape = key === "director-list";

    const docxBuffer = await HTMLtoDOCX(html, null, {
      orientation: isLandscape ? "landscape" : "portrait",
      pageSize: isLandscape
        ? { width: 16838, height: 11906 }
        : { width: 11906, height: 16838 },
      margins: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
      font: "Times New Roman",
      fontSize: 22,
      title: `${label} — ${companyName || ""} — FY ${financialYear || ""}`,
      creator: "ComplianceSearch.in",
    });

    const filename = `${key}_${companyName || "Company"}_FY${financialYear || ""}`
      .replace(/[^a-zA-Z0-9_\-. ]/g, "_");

    return new NextResponse(new Uint8Array(docxBuffer as Buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}.docx"`,
      },
    });
  } catch (err) {
    console.error("DOCX generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "DOCX generation failed" },
      { status: 500 }
    );
  }
}
