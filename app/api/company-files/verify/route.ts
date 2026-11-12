import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return NextResponse.json({ ok: true, status: "skipped", reason: "Could not parse request" }); }

  const file        = formData.get("file") as File | null;
  const companyName = formData.get("companyName") as string;
  const docLabel    = formData.get("docLabel") as string;

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
    const base64   = Buffer.from(arrayBuf).toString("base64");

    // Build content block — Claude supports PDF natively as "document" type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contentBlock: any = isPdf
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
      : { type: "image",    source: { type: "base64", media_type: file.type || "image/jpeg", data: base64 } };

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
