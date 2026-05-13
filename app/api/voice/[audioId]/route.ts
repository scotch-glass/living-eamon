// ============================================================
// GET /api/voice/<audioId> — fetch a signed URL for playback.
//
// Default: returns the URL to the APPROVED version. If no
// approved version exists, returns 404 with hasPendingVersion
// flag so the reader panel can show "voice pending approval".
//
// With ?version=N: returns a specific version (admin/creator
// only — used by the admin review surface to audition pending
// versions).
//
// With ?meta=1: returns full metadata + a signed URL for the
// approved version (if any).
// ============================================================

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import {
  getSignedUrlForApproved,
  getSignedUrlForVersion,
  isValidAudioId,
  readMetadata,
} from "@/lib/voice/storage";
import { createServerSupabase } from "@/lib/supabaseAuthServer";
import { getCurrentUserRole } from "@/lib/auth/role";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ audioId: string }> },
): Promise<NextResponse> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "authentication required" },
      { status: 401 },
    );
  }

  const { audioId } = await params;
  if (!isValidAudioId(audioId)) {
    return NextResponse.json({ ok: false, error: "invalid audioId" }, { status: 400 });
  }

  const url = new URL(req.url);
  const versionParam = url.searchParams.get("version");
  const wantsMeta = url.searchParams.get("meta") === "1";

  try {
    if (wantsMeta) {
      const meta = await readMetadata(audioId);
      const signedUrl = await getSignedUrlForApproved(audioId);
      return NextResponse.json({ ok: true, metadata: meta, signedUrl });
    }

    if (versionParam) {
      // Specific-version playback is admin/creator only (auditioning
      // pending versions before approval).
      const { role } = await getCurrentUserRole();
      if (role !== "admin" && role !== "creator") {
        return NextResponse.json(
          { ok: false, error: "admin or creator role required for version audition" },
          { status: 401 },
        );
      }
      const version = Number(versionParam);
      if (!Number.isFinite(version) || version < 1) {
        return NextResponse.json({ ok: false, error: "invalid version" }, { status: 400 });
      }
      const signedUrl = await getSignedUrlForVersion(audioId, version);
      return NextResponse.json({ ok: true, signedUrl, version });
    }

    // Default path: player-facing approved-only playback.
    const signedUrl = await getSignedUrlForApproved(audioId);
    if (!signedUrl) {
      const meta = await readMetadata(audioId);
      return NextResponse.json(
        {
          ok: false,
          error: "no approved version",
          hasPendingVersion: (meta.latestVersion ?? 0) > 0,
          status: meta.status,
        },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, signedUrl });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
