import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  ...(process.env.ANTHROPIC_WORKSPACE_ID
    ? { defaultHeaders: { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID } }
    : {}),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.csi_users.findUnique({
    where: { email: session.user.email },
    select: { ai_enabled: true, ai_model: true },
  });

  if (!user?.ai_enabled) {
    return NextResponse.json(
      { error: "AI features not enabled for your organization" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { task, data } = body as { task: string; data: Record<string, unknown> };

  if (!task || !data) {
    return NextResponse.json({ error: "Missing task or data" }, { status: 400 });
  }

  const modelMap: Record<string, string> = {
    haiku: "claude-haiku-5-5",
    sonnet: "claude-sonnet-5-5",
  };
  const model = modelMap[user.ai_model ?? "haiku"] ?? "claude-haiku-5-5";

  try {
    if (task === "extract_financials") {
      return await handleExtractFinancials(model, data);
    } else if (task === "validate_financials") {
      return await handleValidateFinancials(model, data);
    } else if (task === "preflight_check") {
      return await handlePreflightCheck(model, data);
    } else {
      return NextResponse.json({ error: "Unknown task" }, { status: 400 });
    }
  } catch (e) {
    console.error("[ai-assist] error:", e);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}

async function handleExtractFinancials(model: string, data: Record<string, unknown>) {
  const { rawText } = data as { rawText: string };

  const msg = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a CA/financial data extractor. Extract structured financial data from the following balance sheet text. Return ONLY a JSON object with these keys (use null if not found):
{
  "paidUpCapital": number,
  "reservesAndSurplus": number,
  "totalShareholdersEquity": number,
  "longTermBorrowings": number,
  "shortTermBorrowings": number,
  "totalBorrowings": number,
  "fixedAssets": number,
  "currentAssets": number,
  "totalAssets": number,
  "revenue": number,
  "netProfit": number,
  "turnover": number
}

Text:\n${rawText.slice(0, 4000)}`,
      },
    ],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "Could not parse AI response" }, { status: 422 });
  }
  const extracted = JSON.parse(jsonMatch[0]);
  return NextResponse.json({ success: true, data: extracted });
}

async function handleValidateFinancials(model: string, data: Record<string, unknown>) {
  const financials = data as Record<string, number | null>;

  const msg = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a Chartered Accountant reviewing financial data for an Annual Filing. Check for errors, inconsistencies, or unusual values. Return a JSON object:
{
  "valid": boolean,
  "warnings": string[],
  "errors": string[]
}

Financial data: ${JSON.stringify(financials, null, 2)}`,
      },
    ],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "Could not parse AI response" }, { status: 422 });
  }
  const result = JSON.parse(jsonMatch[0]);
  return NextResponse.json({ success: true, data: result });
}

async function handlePreflightCheck(model: string, data: Record<string, unknown>) {
  const formData = data as Record<string, unknown>;

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-5-5", // always use sonnet for preflight
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are a senior CA reviewing an Annual Filing (AOC-4 / MGT-7) before submission. Review the following form data and identify any issues, missing mandatory fields, or compliance problems. Return a JSON object:
{
  "ready": boolean,
  "score": number (0-100),
  "critical": string[],
  "warnings": string[],
  "suggestions": string[]
}

Form data: ${JSON.stringify(formData, null, 2)}`,
      },
    ],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "Could not parse AI response" }, { status: 422 });
  }
  const result = JSON.parse(jsonMatch[0]);
  return NextResponse.json({ success: true, data: result });
}
