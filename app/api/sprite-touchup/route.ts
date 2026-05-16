export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

// Sprite touch-up writer. Accepts a relative path under /public/art/ and
// PNG bytes (base64) and overwrites the file. The /dev/sprite-touchup
// page uses this to save magic-wand-erased sprites in place.
//
// Path safety: must start with /art/, must end with .png, and the
// resolved absolute path must stay inside public/art/.

const PUBLIC_ROOT = path.join(process.cwd(), "public");
const ART_ROOT = path.join(PUBLIC_ROOT, "art");

function resolveSafe(rel: string): string | null {
  if (!rel.startsWith("/art/")) return null;
  if (!rel.endsWith(".png")) return null;
  const abs = path.normalize(path.join(PUBLIC_ROOT, rel));
  if (!abs.startsWith(ART_ROOT + path.sep)) return null;
  return abs;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as { path?: string; pngBase64?: string };
  const rel = body.path ?? "";
  const b64 = body.pngBase64 ?? "";
  const abs = resolveSafe(rel);
  if (!abs) {
    return NextResponse.json({ ok: false, error: "invalid path" }, { status: 400 });
  }
  if (!b64) {
    return NextResponse.json({ ok: false, error: "missing pngBase64" }, { status: 400 });
  }
  const buf = Buffer.from(b64, "base64");
  await fs.writeFile(abs, buf);
  return NextResponse.json({ ok: true, bytes: buf.length, path: rel });
}
