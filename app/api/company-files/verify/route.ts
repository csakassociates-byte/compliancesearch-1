import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import pdfParse from "pdf-parse";

export const runtime = "nodejs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/company-files/verify
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ ok: true, status: "skipped", reason: "Could not parse request" });
  }

  const file        = formData.get("file") as File | null;
  const companyName = formData.get("companyName") as string;
  const docLabel    = formData.get("docLabel") as string;

  if (!file || !companyName || !docLabel) {
    return NextResponse.json({ ok: true, status: "skipped", reason: "Missing fields" });
  }

  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ ok: true, status: "skipped", reason: "File too large for AI check" });
  }

  const isPdf  = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isImage = file.type.startsWith("image/");

  if (!isPdf && !isImage) {
    return NextResponse.json({ ok: true, status: "skipped", reason: "File type not supported for AI check" });
  }

  try {
    let text = "";

    if (isPdf) {
      const buffer = Buffer.from(await file.arrayBuffer());
      try {
        const parsed = await pdfParse(buffer, { max: 3 });
        text = parsed.text.slice(0, 6000);
      } catch (pdfErr) {
        console.error("pdf-parse error:", pdfErr);
        return NextResponse.json({ ok: true, status: "warning", reason: "Could not read PDF — please verify manually.", confidence: 0 });
      }

      if (!text || text.trim().length < 50) {
        return NextResponse.json({ ok: true, status: "warning", reason: "PDF text is unreadable (possibly scanned image) — please verify manually.", confidence: 0 });
      }

      const msg = await client.messages.create({
        model: "claude-haiku-5-5",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `You are a document verification assistant for an Indian CA/CS firm.

Verify this document against:
- Expected document type: "${docLabel}"
- Expected company name: "${companyName}"

Document text (first 3 pages):
---
${text}
---

Respond ONLY with valid JSON (no markdown, no explanation):
{"status":"verified","reason":"one sentence","confidence":95}

status must be exactly one of: "verified", "warning", "mismatch"
- verified = document type AND company name both match
- mismatch = clearly wrong document type OR clearly different company
- warning = uncertain or cannot clearly determine
Allow partial company name matches (e.g. "Protax" matches "Protax Protect Services Pvt Ltd").`,
        }],
      });

      const raw = (msg.content[0] as { type: string; text: string }).text.trim();
      const result = JSON.parse(raw);
      return NextResponse.json({ ok: true, ...result });

    } else {
      // Image
      const arrayBuf  = await file.arrayBuffer();
      const base64    = Buffer.from(arrayBuf).toString("base64");
      const mediaType = (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

      const msg = await client.messages.create({
        model: "claude-haiku-5-5",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            {
              type: "text",
              text: `Verify this document image against:
- Expected document type: "${docLabel}"
- Expected company name: "${companyName}"

Respond ONLY with valid JSON (no markdown):
{"status":"verified","reason":"one sentence","confidence":95}

status: "verified" | "mismatch" | "warning"
Allow partial company name matches.`,
            },
          ],
        }],
      });

      const raw = (msg.content[0] as { type: string; text: string }).text.trim();
      const result = JSON.parse(raw);
      return NextResponse.json({ ok: true, ...result });
    }

  } catch (err) {
    console.error("Verify API error:", err);
    return NextResponse.json({
      ok: true,
      status: "warning",
      reason: "AI verification failed — please verify manually.",
      confidence: 0,
    });
  }
}
