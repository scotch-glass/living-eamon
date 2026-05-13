// ============================================================
// POST /api/voice/approve — admin approval / rejection of a
// generated voice version (CF-1.5).
//
// Body: { audioId, version, decision: "approved" | "rejected" }
// Auth: admin only.
//
// Approval flips the metadata's approvedVersion to the chosen
// version + status to "approved". After this, the player-facing
// reader panel can fetch a signed URL via /api/voice/<audioId>.
// ============================================================

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { isValidAudioId, setApproval } from "@/lib/voice/storage";
import { getCurrentUserRole } from "@/lib/auth/role";

interface RequestBody {
  audioId?: string;
  version?: number;
  decision?: "approved" | "rejected";
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { role } = await getCurrentUserRole();
  if (role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "admin role required" },
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
  if (typeof body.version !== "number" || body.version < 1) {
    return NextResponse.json({ ok: false, error: "version required (>= 1)" }, { status: 400 });
  }
  if (body.decision !== "approved" && body.decision !== "rejected") {
    return NextResponse.json(
      { ok: false, error: "decision must be 'approved' or 'rejected'" },
      { status: 400 },
    );
  }

  try {
    const meta = await setApproval(audioId, body.decision, body.version);
    return NextResponse.json({ ok: true, metadata: meta });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
