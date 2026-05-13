// ============================================================
// PATCH /api/voice/script — update the canonical script for an
// audioId (CF-1.5).
//
// Body: { audioId, script }
// Auth: admin OR creator role.
//
// The script field stored here is BOTH (a) what the player sees
// in the Reader Panel, and (b) what the next regenerate-audio call
// uses as input. Editing the script does NOT auto-regenerate the
// audio — the admin must explicitly regenerate. The admin UI shows
// a "drift" warning when the approved version's text differs from
// the saved script.
// ============================================================

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { isValidAudioId, updateScript } from "@/lib/voice/storage";
import { getCurrentUserRole } from "@/lib/auth/role";

const MAX_SCRIPT_CHARS = 15000;

interface RequestBody {
  audioId?: string;
  script?: string;
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
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
    return NextResponse.json({ ok: false, error: "invalid audioId" }, { status: 400 });
  }
  if (typeof body.script !== "string") {
    return NextResponse.json({ ok: false, error: "script required (string)" }, { status: 400 });
  }
  if (body.script.length > MAX_SCRIPT_CHARS) {
    return NextResponse.json(
      { ok: false, error: `script length ${body.script.length} exceeds ${MAX_SCRIPT_CHARS}-char limit` },
      { status: 400 },
    );
  }

  try {
    const meta = await updateScript(audioId, body.script);
    return NextResponse.json({ ok: true, metadata: meta });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
