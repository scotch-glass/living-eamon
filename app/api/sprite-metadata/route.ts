export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import {
  defaultMetadata,
  isValidSpritePath,
  loadAllMetadata,
  loadMetadata,
  saveMetadata,
  type SpriteMetadata,
} from "@/lib/art/spriteMetadata";

// GET /api/sprite-metadata           → all metadata
// GET /api/sprite-metadata?path=...  → one entry (default if missing)
// PUT /api/sprite-metadata           → upsert one entry { path, ... }

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const target = url.searchParams.get("path");
  if (target == null) {
    const all = await loadAllMetadata();
    return NextResponse.json({ ok: true, metadata: all });
  }
  if (!isValidSpritePath(target)) {
    return NextResponse.json({ ok: false, error: "invalid path" }, { status: 400 });
  }
  const entry = await loadMetadata(target);
  return NextResponse.json({ ok: true, entry });
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as Partial<SpriteMetadata> & { path?: string };
  const target = body.path ?? "";
  if (!isValidSpritePath(target)) {
    return NextResponse.json({ ok: false, error: "invalid path" }, { status: 400 });
  }
  const existing = await loadMetadata(target);
  const merged: SpriteMetadata = {
    ...defaultMetadata(target),
    ...existing,
    ...body,
    path: target,
  };
  await saveMetadata(merged);
  return NextResponse.json({ ok: true, entry: merged });
}
