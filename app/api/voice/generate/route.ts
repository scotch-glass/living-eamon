// ============================================================
// POST /api/voice/generate — pre-roll Eve TTS + store (CF-1.5).
//
// Body: { audioId, text, language? }
// Auth: admin OR creator role. Player-side does not generate.
//
// Pipeline:
//   1. Validate audioId + text (length cap, slug format).
//   2. Call xAI TTS (Eve voice — POST /v1/tts).
//   3. Upload audio to Supabase Storage bucket `creator-audio`
//      as voice/<audioId>/v<N>.mp3, append a sidecar version
//      entry to metadata.json.
//   4. Return the updated metadata (caller surfaces it in the
//      admin review UI).
//
// Status after generate is always "pending" — an admin must
// approve via /api/voice/approve before the player can hear it.
// ============================================================

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { MAX_TTS_CHARS, ttsEve } from "@/lib/voice/eve";
import { isValidAudioId, uploadVersion } from "@/lib/voice/storage";
import { getCurrentUserRole } from "@/lib/auth/role";

interface RequestBody {
  audioId?: string;
  text?: string;
  language?: string;
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
  if (text.length > MAX_TTS_CHARS) {
    return NextResponse.json(
      { ok: false, error: `text length ${text.length} exceeds ${MAX_TTS_CHARS}-char xAI limit` },
      { status: 400 },
    );
  }

  try {
    const { audio, contentType } = await ttsEve({
      text,
      language: body.language,
    });
    const meta = await uploadVersion(audioId, audio, contentType, text, body.language);
    return NextResponse.json({ ok: true, metadata: meta });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 502 },
    );
  }
}
