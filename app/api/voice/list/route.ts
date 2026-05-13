// ============================================================
// GET /api/voice/list — admin audio review listing (CF-1.5).
//
// Returns every audioId in the creator-audio bucket with its
// current status, latest version, approved version (if any),
// and the first 120 chars of the latest text as a preview.
//
// Admin/creator only.
// ============================================================

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { listAudio } from "@/lib/voice/storage";
import { getCurrentUserRole } from "@/lib/auth/role";

export async function GET(): Promise<NextResponse> {
  const { role } = await getCurrentUserRole();
  if (role !== "admin" && role !== "creator") {
    return NextResponse.json(
      { ok: false, error: "admin or creator role required" },
      { status: 401 },
    );
  }
  try {
    const entries = await listAudio();
    return NextResponse.json({ ok: true, entries });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
