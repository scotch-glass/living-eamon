// ============================================================
// Eve — the xAI narrator voice for the Reader Panel (CF-1.5).
//
// API: POST https://api.x.ai/v1/tts
//   body  { text, voice_id, language }
//   resp  raw audio bytes (mp3 by default)
//
// Docs: https://docs.x.ai/developers/model-capabilities/audio/text-to-speech
// Pricing: $4.20 per 1M characters · max 15,000 chars per REST call.
// Voice catalogue: eve (default), ara, rex, sal, leo.
//
// Server-only. Uses XAI_API_KEY (same env var the codebase already
// uses for Grok image gen + Jane chat).
// ============================================================

export const EVE_VOICE_ID = "eve";

/**
 * Standing prompt for Eve's tone. xAI's TTS API does NOT currently
 * accept a free-text instructions field — tone is controlled by
 * voice_id + inline speech tags within the text. We keep the
 * prompt here as documentation of the intent so future xAI features
 * (or our own pre-processor that injects speech tags) can honor it.
 *
 * Eve voice profile per xAI: mysterious, slow, deep, female. The
 * Howard-grimdark feel comes from Eve's defaults plus the prose
 * itself; we do NOT pass this to the API.
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
}

export interface EveTtsResult {
  audio: ArrayBuffer;
  contentType: string;
}

/**
 * Call xAI TTS for Eve. Throws on network or non-2xx responses;
 * the route handler surfaces the error as 502 so the reader panel
 * can disable the voice button gracefully.
 */
export async function ttsEve(opts: EveTtsRequest): Promise<EveTtsResult> {
  const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
  if (!apiKey) {
    throw new Error("XAI_API_KEY not configured");
  }
  if (!opts.text || opts.text.trim().length === 0) {
    throw new Error("text required");
  }
  if (opts.text.length > MAX_TTS_CHARS) {
    throw new Error(
      `text length ${opts.text.length} exceeds ${MAX_TTS_CHARS}-char xAI limit; chunk by paragraph`,
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
