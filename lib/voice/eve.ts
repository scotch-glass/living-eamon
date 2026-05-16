// ============================================================
// Eve — xAI Text-to-Speech (strict TTS mode).
//
// HISTORY: we briefly used the realtime voice AGENT
// (wss://api.x.ai/v1/realtime) because it accepts a system prompt
// for personality. In practice the agent could not be reliably
// constrained to verbatim reading — even with strict TTS-style
// system prompts, the conversational model kept paraphrasing the
// input and tacking on "tell me what do you do next?" style
// responses (because it's an LLM, not a TTS engine).
//
// CURRENT: plain /v1/tts. Takes { text, voice_id, language }.
// Returns mp3 bytes that are the literal input read verbatim.
// No system prompt. Eve's voice profile (mysterious slow female,
// xAI default) provides the base tone. Custom persona prompts
// (Barcelona accent, Howard grimdark cadence) are NOT supported
// by this endpoint — revisit when xAI ships custom voices broadly.
//
// Docs:
//   https://docs.x.ai/developers/model-capabilities/audio/text-to-speech
//
// Pricing: $4.20 per 1M characters · 15,000-char cap per call.
// Server-only.
// ============================================================

export const EVE_VOICE_ID = "eve";

/**
 * Aspirational personality prompt. NOT currently sent to xAI —
 * /v1/tts doesn't accept a system prompt and the realtime agent
 * can't be constrained to verbatim reading. Preserved as
 * documentation of intent; revisit when xAI ships custom voices
 * with persona config baked into the voice itself.
 */
export const EVE_STANDING_PROMPT = [
  "You are a mysterious and assertive female narrator with a thick",
  "Barcelona accent, voicing an immersive sword and sorcery novel",
  "in the grimdark fantasy style of Robert E. Howard. Speak slowly,",
  "deeply, and commandingly with dramatic pauses, painting vivid",
  "scenes of brutal heroes, savage lands, ancient sorceries,",
  "eldritch horrors, and unrelenting violence.",
].join(" ");

const XAI_BASE_URL = "https://api.x.ai/v1";
const XAI_TTS_PATH = "/tts";

/** Max characters per REST call per xAI docs. */
export const MAX_TTS_CHARS = 15000;

export interface EveTtsRequest {
  text: string;
  /** BCP-47 language code or "auto". Defaults to "en". */
  language?: string;
  /**
   * Preserved on the request shape for future use (e.g., per-call
   * custom voice id). Currently ignored - we always use Eve.
   */
  instructionsOverride?: string;
}

export interface EveTtsResult {
  audio: ArrayBuffer;
  contentType: string;
}

/**
 * Strict TTS call. Throws on network or non-2xx responses; the
 * route handler surfaces the error as 502.
 */
export async function ttsEve(opts: EveTtsRequest): Promise<EveTtsResult> {
  const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY not configured");
  if (!opts.text || opts.text.trim().length === 0) {
    throw new Error("text required");
  }
  if (opts.text.length > MAX_TTS_CHARS) {
    throw new Error(
      `text length ${opts.text.length} exceeds ${MAX_TTS_CHARS}-char limit; chunk by paragraph`,
    );
  }

  const body = {
    text: opts.text,
    voice_id: EVE_VOICE_ID,
    language: opts.language ?? "en",
  };

  const res = await fetch(`${XAI_BASE_URL}${XAI_TTS_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "(no body)");
    throw new Error(`xAI TTS ${res.status}: ${errText.slice(0, 400)}`);
  }

  const contentType = res.headers.get("content-type") ?? "audio/mpeg";
  const audio = await res.arrayBuffer();
  return { audio, contentType };
}
