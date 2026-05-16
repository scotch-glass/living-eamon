// ============================================================
// Claude Opus 4.7 client for the Creator Forge + Quest Line
// Orchestrator (Sprint CF-0).
//
// Hard rule (load-bearing): Opus is the ONLY model used for text
// generation across the Creator / Admin authoring surfaces — prose,
// SVG maps, Ink scaffolding, multiple-choice template prose, etc.
// Grok is forbidden for text in these surfaces. Grok-Imagine-Pro is
// reserved for raster image generation (scenes + sprites).
//
// Mirrors the shape of lib/anthropic/client.ts (Haiku client used by
// the interviewer daemon). No streaming, no Grok fallback, no
// Next/Edge entanglement. Server-only.
// ============================================================

import Anthropic from "@anthropic-ai/sdk";

const OPUS_MODEL = "claude-opus-4-7";

export interface CallOpusOpts {
  systemPrompt: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
}

let cached: Anthropic | null = null;

function getClient(): Anthropic {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. The Creator Forge needs it to call Opus."
    );
  }
  cached = new Anthropic({ apiKey });
  return cached;
}

/**
 * One-shot call to Claude Opus 4.7. Returns concatenated text content.
 * Throws on API errors — the caller decides whether to retry or surface.
 */
export async function callOpus(opts: CallOpusOpts): Promise<string> {
  const client = getClient();
  const res = await client.messages.create({
    model: OPUS_MODEL,
    max_tokens: opts.maxTokens ?? 2048,
    system: opts.systemPrompt,
    messages: opts.messages,
  });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return text.trim();
}
