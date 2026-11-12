import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function isPdfPasswordProtected(buffer: Buffer, isPdf: boolean): boolean {
  if (!isPdf) return false;
  // All encrypted PDFs must have an /Encrypt entry in their cross-reference dictionary (PDF spec)
  const sample = buffer.slice(0, Math.min(buffer.length, 8192)).toString("latin1") +
                 buffer.slice(Math.max(0, buffer.length - 4096)).toString("latin1");
  return sample.includes("/Encrypt");
}

const PROMPT = (docLabel: string, companyName: string) =>
  `You are a document verification assistant for an Indian CA/CS firm.

Verify this document against:
- Expected document type: "${docLabel}"
- Expected company name: "${companyName}"

Respond ONLY with valid JSON (no markdown, no extra text):
{"status":"verified","reason":"one sentence","confidence":95}

status must be exactly one of: "verified", "mismatch", "warning"
- verified = document type AND company name both match
- mismatch = clearly wrong document type OR clearly different company name visible
- warning = cannot clearly determine
Allow partial company name matches (e.g. "Protax" matches "Protax Protect Services Pvt Ltd").`;

const TITLE_PROMPT = (companyName: string) =>
  `You are a document assistant for an Indian CA/CS firm.

Read this document and generate a short, professional title for it.
The company name is "${companyName}".

Rules:
- Title should be specific and descriptive (e.g. "Board Resolution — Appointment of Auditor", "MSME Udyam Certificate", "Bank Statement — April 2025")
- Include the company name only if it's a certificate or official document that prominently features it
- Max 60 characters
- Professional English, no vague names like "Document" or "File"

Respond ONLY with valid JSON (no markdown):
{"title":"your suggested title here","docType":"one of: Certificate, Resolution, Agreement, Statement, Return, Report, License, Letter, Other"}`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return NextResponse.json({ ok: true, status: "skipped", reason: "Could not parse request" }); }

  const file        = formData.get("file") as File | null;
  const companyName = formData.get("companyName") as string;
  const docLabel    = formData.get("docLabel") as string;
  const isOther     = formData.get("isOther") === "true";

  if (!file || !companyName || !docLabel) {
    return NextResponse.json({ ok: true, status: "skipped", reason: "Missing fields" });
  }

  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ ok: true, status: "skipped", reason: "File too large for AI check" });
  }

  const isPdf   = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isImage = file.type.startsWith("image/");

  if (!isPdf && !isImage) {
    return NextResponse.json({ ok: true, status: "skipped", reason: "File type not supported for AI check" });
  }

  try {
    const arrayBuf = await file.arrayBuffer();
    const buffer   = Buffer.from(arrayBuf);

    // Reject password-protected PDFs — /Encrypt entry is mandatory in any encrypted PDF
    if (isPdfPasswordProtected(buffer, isPdf)) {
      return NextResponse.json({
        ok: false,
        status: "mismatch",
        reason: "This PDF is password-protected and cannot be verified or uploaded. Please upload an unlocked version.",
        confidence: 0,
      });
    }

    const base64   = buffer.toString("base64");

    // Build content block — Claude supports PDF natively as "document" type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contentBlock: any = isPdf
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
      : { type: "image",    source: { type: "base64", media_type: file.type || "image/jpeg", data: base64 } };

    // For "Other" documents: generate a smart title instead of verifying
    if (isOther) {
      const msg = await client.messages.create({
        model: "claude-haiku-5-5",
        max_tokens: 200,
        messages: [{ role: "user", content: [contentBlock, { type: "text", text: TITLE_PROMPT(companyName) }] }],
      });
      const raw   = (msg.content[0] as { type: string; text: string }).text.trim();
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON in response");
      const result = JSON.parse(match[0]);
      return NextResponse.json({ ok: true, status: "verified", suggestedTitle: result.title, docType: result.docType, reason: `AI identified: ${result.docType}`, confidence: 90 });
    }

    const msg = await client.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: [
          contentBlock,
          { type: "text", text: PROMPT(docLabel, companyName) },
        ],
      }],
    });

    const raw    = (msg.content[0] as { type: string; text: string }).text.trim();
    // Extract JSON even if Claude adds surrounding text
    const match  = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");
    const result = JSON.parse(match[0]);
    return NextResponse.json({ ok: true, ...result });

  } catch (err) {
    console.error("Verify API error:", err);
    return NextResponse.json({
      ok: true, status: "warning",
      reason: "AI verification failed — please verify manually.",
      confidence: 0,
    });
  }
}
