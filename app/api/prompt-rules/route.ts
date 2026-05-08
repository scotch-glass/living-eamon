export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import {
  loadStandingRules,
  updatePromptRule,
} from "@/lib/art/promptRules";

// GET /api/prompt-rules — full rules file
// PUT /api/prompt-rules — { id, title?, body? } update one (rejects locked)

export async function GET(): Promise<NextResponse> {
  const file = await loadStandingRules();
  return NextResponse.json({ ok: true, file });
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as { id?: string; title?: string; body?: string };
  if (!body.id) {
    return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
  }
  try {
    const updated = await updatePromptRule(body.id, {
      title: body.title,
      body: body.body,
    });
    return NextResponse.json({ ok: true, rule: updated });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 400 },
    );
  }
}
