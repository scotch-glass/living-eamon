// ============================================================
// Eve — the xAI narrator voice for the Reader Panel (CF-1.5).
//
// Standing prompt (instructions sent to the TTS engine):
//   A mysterious and assertive female narrator with a thick
//   Barcelona accent, voicing immersive sword-and-sorcery prose
//   in the grimdark style of Robert E. Howard. Slow, deep,
//   commanding, dramatic pauses, vivid brutal heroes / savage
//   lands / ancient sorceries / eldritch horrors / unrelenting
//   violence.
//
// Server-only. Uses XAI_API_KEY (the same env var the rest of
// the codebase already uses for Grok image gen + Jane chat).
//
// API contract: xAI exposes an OpenAI-compatible audio endpoint
// at https://api.x.ai/v1/audio/speech. Body shape mirrors
// OpenAI TTS: { model, input, voice, response_format,
// instructions? }. If xAI changes the contract, update this file
// and the route handler in lockstep.
// ============================================================

export const EVE_VOICE = "eve";

/**
 * Standing prompt for Eve's tone. Threaded into every TTS call as
 * the `instructions` field. The xAI/OpenAI TTS server may or may
 * not honor `instructions` depending on model — the field is
 * harmless if ignored.
 */
export const EVE_STANDING_PROMPT = [
  "You are a mysterious and assertive female narrator with a thick",
  "Barcelona accent, voicing an immersive sword and sorcery novel",
  "in the grimdark fantasy style of Robert E. Howard. Speak slowly,",
  "deeply, and commandingly with dramatic pauses, painting vivid",
  "scenes of brutal heroes, savage lands, ancient sorceries,",
  "eldritch horrors, and unrelenting violence.",
].join(" ");

/**
 * xAI voice model. As of mid-2026 the model identifier is
 * grok-2-voice-1212 per xAI's docs; if xAI updates the line, bump
 * the constant here and nothing else.
 */
export const EVE_MODEL = "grok-2-voice-1212";

/**
 * Audio response format. mp3 is well-supported in <audio> across
 * browsers and small over the wire.
 */
export const EVE_RESPONSE_FORMAT = "mp3";

const XAI_BASE_URL = "https://api.x.ai/v1";
const XAI_TTS_PATH = "/audio/speech";

export interface EveTtsRequest {
  text: string;
  /** Optional override (rarely needed). Falls back to EVE_STANDING_PROMPT. */
  instructions?: string;
}

export interface EveTtsResult {
  audio: ArrayBuffer;
  contentType: string;
}

/**
 * Server-side TTS call. Throws on network or non-2xx responses;
 * the route handler surfaces the error as 502 to the client so
 * the reader panel can disable the voice button and show "voice
 * unavailable" without crashing the read.
 */
export async function ttsEve(opts: EveTtsRequest): Promise<EveTtsResult> {
  const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
  if (!apiKey) {
    throw new Error("XAI_API_KEY not configured");
  }
  if (!opts.text || opts.text.trim().length === 0) {
    throw new Error("text required");
  }
  // Cap input length defensively — TTS over very long passages
  // takes long enough that the route times out and the client UX
  // degrades. CF-2 should chunk prose at paragraph boundaries
  // before calling this if length is a concern.
  if (opts.text.length > 4000) {
    throw new Error(
      `text length ${opts.text.length} exceeds 4000-char limit; chunk by paragraph`,
    );
  }

  const body = {
    model: EVE_MODEL,
    input: opts.text,
    voice: EVE_VOICE,
    response_format: EVE_RESPONSE_FORMAT,
    instructions: opts.instructions ?? EVE_STANDING_PROMPT,
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
    throw new Error(`xAI TTS ${res.status}: ${errText.slice(0, 300)}`);
  }

  const contentType = res.headers.get("content-type") ?? "audio/mpeg";
  const audio = await res.arrayBuffer();
  return { audio, contentType };
}
