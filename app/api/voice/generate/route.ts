// ============================================================
// POST /api/voice/generate — pre-roll Eve TTS + store (CF-1.5).
//
// Body: { audioId, text, instructionsOverride? }
// Auth: admin OR creator role. Player-side does not generate.
//
// Pipeline:
//   1. Validate audioId + text shape.
//   2. Validate xAI effect tags (hard-fail with structured issues).
//   3. If text > TARGET_MAX, segment at chapter / heading / paragraph
//      / sentence boundaries (tag-aware — never splits inside a
//      wrapping tag).
//   4. Call xAI TTS once per segment. Concatenate the returned mp3
//      bytes into a single audio file (xAI returns CBR mp3 with
//      consistent codec settings, so byte-concat is safe).
//   5. Upload as voice/<audioId>/v<N>.mp3, append a sidecar version
//      entry to metadata.json. currentScript stores the full text
//      including tags.
//   6. Return the updated metadata + segmentation summary.
//
// Status after generate is always "pending" — an admin must
// approve via /api/voice/approve before the player can hear it.
// ============================================================

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { ttsEve } from "@/lib/voice/eve";
import { validateTags } from "@/lib/voice/effectTags";
import { TARGET_MAX, segmentForTTS } from "@/lib/voice/segmentText";
import { isValidAudioId, uploadVersion } from "@/lib/voice/storage";
import { getCurrentUserRole } from "@/lib/auth/role";

/**
 * Safety cap for the full pre-segmentation script. 100k chars at
 * $4.20/1M chars = $0.42 per generate — well-bounded. Raise if
 * Creator workflows demand longer single audio files.
 */
const MAX_SCRIPT_CHARS_TOTAL = 100_000;

interface RequestBody {
  audioId?: string;
  text?: string;
  instructionsOverride?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { role } = await getCurrentUserRole();
  if (role !== "admin" && role !== "creator") {
    return NextResponse.json(
      { ok: false, error: "admin or creator role required" },
      { status: 401 },
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }

  const audioId = (body.audioId ?? "").trim();
  if (!isValidAudioId(audioId)) {
    return NextResponse.json(
      { ok: false, error: "audioId required (a-z0-9_-, 1..128)" },
      { status: 400 },
    );
  }
  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ ok: false, error: "text required" }, { status: 400 });
  }
  if (text.length > MAX_SCRIPT_CHARS_TOTAL) {
    return NextResponse.json(
      {
        ok: false,
        error: `text length ${text.length} exceeds ${MAX_SCRIPT_CHARS_TOTAL}-char safety cap`,
      },
      { status: 400 },
    );
  }

  // Tag validation — hard fail with structured issues. The UI can
  // surface these inline and offer fixes (e.g., <loud> → <emphasis>).
  const validation = validateTags(text);
  if (!validation.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid effect tags",
        issues: validation.issues,
        validation,
      },
      { status: 400 },
    );
  }

  // Segment if needed.
  let segmentation;
  try {
    segmentation = segmentForTTS(text);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 400 },
    );
  }

  // Synthesize each segment, concat the mp3 bytes.
  try {
    const parts: Uint8Array[] = [];
    let contentType = "audio/mpeg";
    for (const seg of segmentation.segments) {
      const result = await ttsEve({
        text: seg.text,
        instructionsOverride: body.instructionsOverride,
      });
      parts.push(new Uint8Array(result.audio));
      contentType = result.contentType;
    }
    const audio = concatBuffers(parts);
    const meta = await uploadVersion(
      audioId,
      audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength) as ArrayBuffer,
      contentType,
      text,
      body.instructionsOverride,
    );
    return NextResponse.json({
      ok: true,
      metadata: meta,
      segmentation: {
        segmentCount: segmentation.segments.length,
        boundariesUsed: segmentation.boundariesUsed,
        totalChars: segmentation.totalChars,
        targetMax: TARGET_MAX,
      },
      validation,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 502 },
    );
  }
}

function concatBuffers(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}
