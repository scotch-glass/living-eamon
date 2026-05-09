// ============================================================
// Minimal Claude Haiku client for the offline interviewer daemon
// (`scripts/interview.ts`).
//
// This is intentionally NOT a refactor of `app/api/chat/route.ts` —
// that route's `streamWithFallback` is load-bearing for the Jane
// runtime path and was deemed too risky to extract in this sprint.
// Keep this client small and offline-only: no Grok fallback, no
// streaming, no Next/Edge entanglement.
// ============================================================

import Anthropic from "@anthropic-ai/sdk";

const HAIKU_MODEL = "claude-haiku-4-5-20251001";

export interface CallHaikuOpts {
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
      "ANTHROPIC_API_KEY is not set. The interviewer needs it to call Haiku."
    );
  }
  cached = new Anthropic({ apiKey });
  return cached;
}

/**
 * One-shot call to Claude Haiku. Returns the concatenated text from the
 * response's content blocks. Throws on API errors — the caller decides
 * whether to retry or surface to the user.
 */
export async function callHaiku(opts: CallHaikuOpts): Promise<string> {
  const client = getClient();
  const res = await client.messages.create({
    model: HAIKU_MODEL,
    max_tokens: opts.maxTokens ?? 1024,
    system: opts.systemPrompt,
    messages: opts.messages,
  });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return text.trim();
}
