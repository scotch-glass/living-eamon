// ============================================================
// Creator Forge — module persistence REST (Sprint CF-0).
//
// Catch-all under /api/creator that handles the draft-module file
// system. Admin-gated. CF-0 ships the minimum surface needed by the
// upcoming sprints; later sprints extend the path schema.
//
// Path schema (v1, CF-0):
//   GET    /api/creator/modules                  → list all drafts
//   GET    /api/creator/modules/<id>             → read manifest
//   PUT    /api/creator/modules/<id>             → write manifest (full replace)
//   DELETE /api/creator/modules/<id>             → delete draft
//
// CF-1+ add nested room/atom/npc/map/interlude endpoints.
// ============================================================

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserRole } from "@/lib/auth/role";
import {
  deleteModule,
  isValidModuleId,
  listModules,
  readManifest,
  writeManifest,
  type ModuleManifestStub,
} from "@/lib/creator/storage";

async function ensureAdmin(): Promise<NextResponse | null> {
  const { role } = await getCurrentUserRole();
  if (role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "admin role required" },
      { status: 401 },
    );
  }
  return null;
}

function notFound() {
  return NextResponse.json({ ok: false, error: "route not found" }, { status: 404 });
}

function badRequest(msg: string) {
  return NextResponse.json({ ok: false, error: msg }, { status: 400 });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const denied = await ensureAdmin();
  if (denied) return denied;

  const { path: parts } = await params;
  if (!parts || parts.length === 0 || parts[0] !== "modules") return notFound();

  // GET /api/creator/modules
  if (parts.length === 1) {
    const modules = await listModules();
    return NextResponse.json({ ok: true, modules });
  }

  // GET /api/creator/modules/<id>
  if (parts.length === 2) {
    const id = parts[1];
    if (!isValidModuleId(id)) return badRequest("invalid module id");
    const manifest = await readManifest(id);
    if (!manifest) return notFound();
    return NextResponse.json({ ok: true, manifest });
  }

  return notFound();
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const denied = await ensureAdmin();
  if (denied) return denied;

  const { path: parts } = await params;
  if (parts.length !== 2 || parts[0] !== "modules") return notFound();
  const id = parts[1];
  if (!isValidModuleId(id)) return badRequest("invalid module id");

  let body: ModuleManifestStub;
  try {
    body = (await req.json()) as ModuleManifestStub;
  } catch {
    return badRequest("invalid JSON body");
  }
  if (!body || typeof body !== "object" || body.id !== id) {
    return badRequest("manifest.id must match url id");
  }

  await writeManifest(id, body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const denied = await ensureAdmin();
  if (denied) return denied;

  const { path: parts } = await params;
  if (parts.length !== 2 || parts[0] !== "modules") return notFound();
  const id = parts[1];
  if (!isValidModuleId(id)) return badRequest("invalid module id");

  await deleteModule(id);
  return NextResponse.json({ ok: true });
}
