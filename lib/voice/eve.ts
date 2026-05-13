// ============================================================
// Eve — the xAI realtime voice AGENT for the Reader Panel (CF-1.5).
//
// Why agent (not direct TTS):
//   The plain TTS endpoint (/v1/tts) accepts only voice_id +
//   text — no system prompt, no personality. The xAI realtime
//   voice agent at wss://api.x.ai/v1/realtime DOES accept a
//   free-text `instructions` field on session.update, which is
//   our hook for Eve's standing prompt (Barcelona accent, slow
//   grimdark Howard-voice delivery, dramatic pauses).
//
// Protocol (mirrors OpenAI Realtime):
//   1. Open WSS with Bearer auth
//   2. session.update with voice="eve", instructions=standing
//      prompt, turn_detection=null (we feed text, not audio),
//      audio output format = PCM 24kHz
//   3. conversation.item.create with the prose as input_text
//   4. response.create to trigger generation
//   5. Accumulate response.output_audio.delta chunks (base64
//      PCM16)
//   6. On response.done, decode + wrap PCM in a WAV header,
//      resolve
//
// Server-only. Uses XAI_API_KEY.
//
// Docs:
//   https://docs.x.ai/developers/model-capabilities/audio/voice-agent
//   https://docs.x.ai/docs/guides/voice/agent
// ============================================================

import WebSocket from "ws";

export const EVE_VOICE_ID = "eve";

/**
 * Standing prompt sent as `instructions` on session.update. xAI's
 * realtime agent treats this as the agent's system prompt and
 * shapes voice delivery + behaviour accordingly. This is the hook
 * the plain TTS endpoint lacks.
 */
export const EVE_STANDING_PROMPT = [
  "You are a mysterious and assertive female narrator with a thick",
  "Barcelona accent, voicing an immersive sword and sorcery novel",
  "in the grimdark fantasy style of Robert E. Howard. Speak slowly,",
  "deeply, and commandingly with dramatic pauses, painting vivid",
  "scenes of brutal heroes, savage lands, ancient sorceries,",
  "eldritch horrors, and unrelenting violence.",
  "",
  "You will be given a script. Read it back EXACTLY as written.",
  "Do not paraphrase, do not summarise, do not respond or comment.",
  "Read the words as the narrator. That is your only task.",
].join(" ");

const REALTIME_URL = "wss://api.x.ai/v1/realtime?model=grok-voice-latest";
const PCM_SAMPLE_RATE = 24000;

/**
 * Per-request timeout. Eve speaks slowly per the standing prompt,
 * so a 600-char passage can take 60+ seconds to fully synthesize.
 * Set generously.
 */
const TIMEOUT_MS = 180_000;

/** Max characters the realtime agent will accept in one input_text. */
export const MAX_TTS_CHARS = 15000;

export interface EveTtsRequest {
  text: string;
  /**
   * Override the standing prompt for this one call. Rarely needed.
   * If omitted, the canonical EVE_STANDING_PROMPT is used.
   */
  instructionsOverride?: string;
}

export interface EveTtsResult {
  audio: ArrayBuffer;
  contentType: string;
}

/**
 * Connect to the xAI realtime voice agent, configure Eve with the
 * standing prompt, send the prose, accumulate audio chunks, and
 * return a WAV-wrapped buffer. Throws on protocol errors or
 * timeouts; the calling route handler converts to 502.
 */
export async function ttsEve(opts: EveTtsRequest): Promise<EveTtsResult> {
  const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY not configured");
  if (!opts.text || opts.text.trim().length === 0) {
    throw new Error("text required");
  }
  if (opts.text.length > MAX_TTS_CHARS) {
    throw new Error(
      `text length ${opts.text.length} exceeds ${MAX_TTS_CHARS}-char limit`,
    );
  }

  const instructions = opts.instructionsOverride ?? EVE_STANDING_PROMPT;

  return new Promise<EveTtsResult>((resolve, reject) => {
    const ws = new WebSocket(REALTIME_URL, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const pcmChunks: Buffer[] = [];
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        ws.close();
      } catch {
        /* noop */
      }
      reject(new Error(`xAI voice agent timeout after ${TIMEOUT_MS}ms`));
    }, TIMEOUT_MS);

    function finish(err: Error | null, result?: EveTtsResult) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        ws.close();
      } catch {
        /* noop */
      }
      if (err) reject(err);
      else if (result) resolve(result);
    }

    ws.on("open", () => {
      // 1. Configure the session
      ws.send(
        JSON.stringify({
          type: "session.update",
          session: {
            voice: EVE_VOICE_ID,
            instructions,
            turn_detection: { type: null },
            audio: {
              output: {
                format: { type: "audio/pcm", rate: PCM_SAMPLE_RATE },
              },
            },
          },
        }),
      );

      // 2. Send the prose as a user message
      ws.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: opts.text }],
          },
        }),
      );

      // 3. Trigger generation
      ws.send(JSON.stringify({ type: "response.create" }));
    });

    ws.on("message", (raw) => {
      let event: { type?: string; delta?: string; error?: { message?: string } };
      try {
        event = JSON.parse(raw.toString());
      } catch {
        return;
      }

      switch (event.type) {
        // Some flavours of the realtime API emit response.audio.delta
        // and some emit response.output_audio.delta. Accept both.
        case "response.output_audio.delta":
        case "response.audio.delta": {
          if (typeof event.delta === "string" && event.delta.length > 0) {
            pcmChunks.push(Buffer.from(event.delta, "base64"));
          }
          break;
        }
        case "response.done":
        case "response.completed": {
          if (pcmChunks.length === 0) {
            finish(new Error("xAI voice agent: no audio in response"));
            return;
          }
          const pcm = Buffer.concat(pcmChunks);
          const wav = pcmToWav(pcm, PCM_SAMPLE_RATE);
          finish(null, {
            audio: wav.buffer.slice(
              wav.byteOffset,
              wav.byteOffset + wav.byteLength,
            ) as ArrayBuffer,
            contentType: "audio/wav",
          });
          break;
        }
        case "error": {
          finish(
            new Error(
              `xAI voice agent error: ${event.error?.message ?? JSON.stringify(event)}`,
            ),
          );
          break;
        }
        default:
          // ignore session.created, session.updated, conversation.item.created,
          // response.created, response.output_item.added, etc.
          break;
      }
    });

    ws.on("error", (err: Error) => {
      finish(err);
    });

    ws.on("close", (code, reason) => {
      // If we got chunks but the server closed without response.done,
      // assemble what we have. If we got nothing, that's a real error.
      if (!settled) {
        if (pcmChunks.length === 0) {
          finish(
            new Error(
              `xAI voice agent: socket closed (code=${code}) ${reason?.toString() ?? ""}`,
            ),
          );
        } else {
          const pcm = Buffer.concat(pcmChunks);
          const wav = pcmToWav(pcm, PCM_SAMPLE_RATE);
          finish(null, {
            audio: wav.buffer.slice(
              wav.byteOffset,
              wav.byteOffset + wav.byteLength,
            ) as ArrayBuffer,
            contentType: "audio/wav",
          });
        }
      }
    });
  });
}

// ── PCM → WAV header wrapper ───────────────────────────────────

/**
 * Wraps 16-bit mono PCM bytes in a standard WAV header so the
 * audio is playable directly in browser <audio> elements without
 * extra decoding. WAV is bigger than mp3 over the wire (~48 KB/sec
 * vs ~8 KB/sec at 64 kbps) — future work can swap in an mp3
 * encoder if size matters; the pre-roll + caching model makes this
 * a one-time cost.
 */
function pcmToWav(pcm: Buffer, sampleRate: number): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcm.length;

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4); // file size - 8
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcm]);
}
