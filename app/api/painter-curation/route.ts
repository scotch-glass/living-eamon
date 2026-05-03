export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

// Persists Scotch's curation decisions on the painter-canon LoRA training
// candidates (Frazetta · Vallejo · Kelly · Brunner). Modeled on
// app/api/wardrobe/qa-review/route.ts.
//
// Storage shape (public/art/painter-curation/_curation.json):
//   {
//     "frazetta_death_dealer_1973": {
//       "state": "approved" | "rejected" | null,
//       "notes": "...",
//       "updatedAt": "ISO-8601"
//     },
//     ...
//   }

const CURATION_PATH = path.join(
  process.cwd(),
  "public",
  "art",
  "painter-curation",
  "_curation.json"
);

interface Decision {
  state: "approved" | "rejected" | null;
  notes: string;
  updatedAt: string;
}

async function loadCuration(): Promise<Record<string, Decision>> {
  try {
    const raw = await fs.readFile(CURATION_PATH, "utf8");
    return JSON.parse(raw) as Record<string, Decision>;
  } catch {
    return {};
  }
}

async function saveCuration(state: Record<string, Decision>): Promise<void> {
  await fs.mkdir(path.dirname(CURATION_PATH), { recursive: true });
  await fs.writeFile(CURATION_PATH, JSON.stringify(state, null, 2), "utf8");
}

/** GET — return current curation state so the page hydrates on reload. */
export async function GET(): Promise<NextResponse> {
  const state = await loadCuration();
  return NextResponse.json(state);
}

/** POST — patch one candidate { id, state, notes, updatedAt }. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      id?: string;
      state?: "approved" | "rejected" | null;
      notes?: string;
      updatedAt?: string;
    };

    const id = (body.id ?? "").trim();
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const state = await loadCuration();
    state[id] = {
      state: body.state ?? null,
      notes: body.notes ?? "",
      updatedAt: body.updatedAt ?? new Date().toISOString(),
    };
    await saveCuration(state);

    return NextResponse.json({ ok: true, id, decision: state[id] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
