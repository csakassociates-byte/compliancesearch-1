import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/company-files/verify
// Body: FormData { file, companyName, docType, docLabel }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData  = await req.formData();
  const file      = formData.get("file") as File | null;
  const companyName = formData.get("companyName") as string;
  const docLabel  = formData.get("docLabel") as string;

  if (!file || !companyName || !docLabel) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ ok: true, status: "skipped", reason: "File too large for AI check" });
  }

  try {
    const isPdf  = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImage = file.type.startsWith("image/");

    let result: { status: "verified" | "warning" | "mismatch"; reason: string; confidence: number };

    if (isPdf) {
      // Extract text from PDF
      const buffer = Buffer.from(await file.arrayBuffer());
      // Dynamic import to avoid SSR issues
      const pdfParse = (await import("pdf-parse")).default;
      const parsed   = await pdfParse(buffer, { max: 3 }); // first 3 pages only
      const text     = parsed.text.slice(0, 6000); // limit tokens

      const msg = await client.messages.create({
        model: "claude-haiku-5-5",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `You are a document verification assistant for an Indian CA/CS firm.

Verify this document against the expected details:
- Expected document type: "${docLabel}"
- Expected company name: "${companyName}"

Extracted text from the document (first 3 pages):
---
${text}
---

Respond ONLY with a JSON object (no markdown):
{
  "status": "verified" | "warning" | "mismatch",
  "reason": "one sentence explanation",
  "confidence": 0-100
}

Rules:
- "verified" = document type matches AND company name found
- "mismatch" = wrong document type OR different company name clearly visible
- "warning" = uncertain, text unclear, or partial match
- For company name: allow partial matches (e.g. "Protax" matches "Protax Protect Services Pvt Ltd")
- If text is too short or unreadable, return "warning"`,
        }],
      });

      const raw = (msg.content[0] as { type: string; text: string }).text.trim();
      result = JSON.parse(raw);

    } else if (isImage) {
      const arrayBuf = await file.arrayBuffer();
      const base64   = Buffer.from(arrayBuf).toString("base64");
      const mediaType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

      const msg = await client.messages.create({
        model: "claude-haiku-5-5",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `You are a document verification assistant for an Indian CA/CS firm.

Verify this document image against:
- Expected document type: "${docLabel}"
- Expected company name: "${companyName}"

Respond ONLY with a JSON object (no markdown):
{
  "status": "verified" | "warning" | "mismatch",
  "reason": "one sentence explanation",
  "confidence": 0-100
}

Rules:
- "verified" = document type matches AND company name found
- "mismatch" = wrong document type OR different company name clearly visible
- "warning" = uncertain or cannot read clearly
- Allow partial company name matches`,
            },
          ],
        }],
      });

      const raw = (msg.content[0] as { type: string; text: string }).text.trim();
      result = JSON.parse(raw);

    } else {
      // Non-PDF/image — skip AI check
      return NextResponse.json({ ok: true, status: "skipped", reason: "File type not supported for AI check" });
    }

    return NextResponse.json({ ok: true, ...result });

  } catch (err) {
    console.error("Verify error:", err);
    // Don't block upload on AI error — just warn
    return NextResponse.json({ ok: true, status: "warning", reason: "AI verification unavailable — please verify manually.", confidence: 0 });
  }
}
