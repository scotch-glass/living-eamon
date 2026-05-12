// ============================================================
// Creator Forge — server-side Claude Opus 4.7 proxy (Sprint CF-0).
//
// Admin-gated. Browser-side Creator UI POSTs here; we forward to the
// Anthropic SDK using ANTHROPIC_API_KEY from the server env. The key
// never leaves the server.
//
// Hard rule: this route ONLY calls Opus 4.7. No Grok, no other model,
// no fallback. Text generation in the Creator surfaces is single-vendor
// by design. Image generation uses a different route (CF-5).
// ============================================================

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { callOpus } from "@/lib/anthropic/opus";
import { getCurrentUserRole } from "@/lib/auth/role";

interface OpusRequestBody {
  systemPrompt?: string;
  messages?: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { role } = await getCurrentUserRole();
  if (role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "admin role required" },
      { status: 401 },
    );
  }

  let body: OpusRequestBody;
  try {
    body = (await req.json()) as OpusRequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid JSON body" },
      { status: 400 },
    );
  }

  if (!body.systemPrompt || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { ok: false, error: "missing systemPrompt or messages" },
      { status: 400 },
    );
  }

  try {
    const text = await callOpus({
      systemPrompt: body.systemPrompt,
      messages: body.messages,
      maxTokens: body.maxTokens,
    });
    return NextResponse.json({ ok: true, text });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
