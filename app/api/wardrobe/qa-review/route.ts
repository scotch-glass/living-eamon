export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

// Persist Gaius-wardrobe-QA reviews to disk so Claude can read them
// after Scotch submits. Path: public/art/wardrobe/gaius/_reviews.json
// Shape:
//   {
//     "loincloth_unarmed_casual": {
//       "state": "approved" | "rejected" | null,
//       "notes": "...",
//       "updatedAt": "ISO-8601"
//     },
//     ...
//   }

const REVIEWS_PATH = path.join(
  process.cwd(),
  "public",
  "art",
  "wardrobe",
  "gaius",
  "_reviews.json"
);

interface Review {
  state: "approved" | "rejected" | null;
  notes: string;
  updatedAt: string;
}

async function loadReviews(): Promise<Record<string, Review>> {
  try {
    const raw = await fs.readFile(REVIEWS_PATH, "utf8");
    return JSON.parse(raw) as Record<string, Review>;
  } catch {
    return {};
  }
}

async function saveReviews(reviews: Record<string, Review>): Promise<void> {
  await fs.mkdir(path.dirname(REVIEWS_PATH), { recursive: true });
  await fs.writeFile(REVIEWS_PATH, JSON.stringify(reviews, null, 2), "utf8");
}

/** GET — return the current review state so the page hydrates on reload. */
export async function GET(): Promise<NextResponse> {
  const reviews = await loadReviews();
  return NextResponse.json(reviews);
}

/** POST — accept a single review patch { key, state, notes, updatedAt }. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      key?: string;
      state?: "approved" | "rejected" | null;
      notes?: string;
      updatedAt?: string;
    };

    const key = (body.key ?? "").trim();
    if (!key) {
      return NextResponse.json({ error: "key required" }, { status: 400 });
    }

    const reviews = await loadReviews();
    reviews[key] = {
      state: body.state ?? null,
      notes: body.notes ?? "",
      updatedAt: body.updatedAt ?? new Date().toISOString(),
    };
    await saveReviews(reviews);

    return NextResponse.json({ ok: true, key, review: reviews[key] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
