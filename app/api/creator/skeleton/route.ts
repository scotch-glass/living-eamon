// ============================================================
// POST /api/creator/skeleton — runs the CF-1 wizard generator
// server-side and returns the resulting ModuleSkeleton.
//
// Admin OR creator role required.
// ============================================================

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { generateSkeleton } from "@/lib/creator/generateSkeleton";
import type { WizardAnswer } from "@/lib/creator/skeletonTypes";
import { getCurrentUserRole } from "@/lib/auth/role";

interface RequestBody {
  moduleId?: string;
  name?: string;
  answers?: WizardAnswer[];
  simSeed?: number;
}

const MODULE_ID_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;

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

  if (!body.moduleId || !MODULE_ID_RE.test(body.moduleId)) {
    return NextResponse.json(
      { ok: false, error: "moduleId required (a-z0-9_-, 1..64)" },
      { status: 400 },
    );
  }
  if (!body.name || body.name.trim().length === 0) {
    return NextResponse.json({ ok: false, error: "name required" }, { status: 400 });
  }
  if (!Array.isArray(body.answers) || body.answers.length === 0) {
    return NextResponse.json({ ok: false, error: "answers[] required" }, { status: 400 });
  }

  try {
    const skeleton = generateSkeleton({
      moduleId: body.moduleId,
      name: body.name.trim(),
      answers: body.answers,
      runSimulation: true,
      simSeed: body.simSeed,
    });
    // Stamp createdAt server-side so the same answers + moduleId pair
    // produce determinstic structural output (timestamp is metadata only)
    skeleton.createdAt = new Date().toISOString();
    return NextResponse.json({ ok: true, skeleton });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
