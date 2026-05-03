export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

// Records "Scotch clicked Submit at this time" so Claude knows when
// to read the latest _reviews.json and act on the feedback.
// Path: public/art/wardrobe/gaius/_submitted.json

const SUBMITTED_PATH = path.join(
  process.cwd(),
  "public",
  "art",
  "wardrobe",
  "gaius",
  "_submitted.json"
);
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

interface Submission {
  submittedAt: string;
  summary: {
    approved: string[];
    rejected: Array<{ key: string; notes: string }>;
    pending: string[];
    approvedCount: number;
    rejectedCount: number;
    pendingCount: number;
    totalCombos: number;
  };
  reviews: Record<string, Review>;
}

export async function POST(): Promise<NextResponse> {
  try {
    let reviews: Record<string, Review> = {};
    try {
      reviews = JSON.parse(await fs.readFile(REVIEWS_PATH, "utf8"));
    } catch {
      // empty reviews is fine — we still record the submission
    }

    const approved: string[] = [];
    const rejected: Array<{ key: string; notes: string }> = [];
    const pending: string[] = [];
    for (const [key, review] of Object.entries(reviews)) {
      if (review.state === "approved") approved.push(key);
      else if (review.state === "rejected") rejected.push({ key, notes: review.notes ?? "" });
      else pending.push(key);
    }

    // Full pilot matrix: 5 equipment × 8 weapon carries × 1 stance = 40 combos.
    // Anything not in reviews is also "pending".
    const totalCombos = 40;

    const submission: Submission = {
      submittedAt: new Date().toISOString(),
      summary: {
        approved,
        rejected,
        pending,
        approvedCount: approved.length,
        rejectedCount: rejected.length,
        pendingCount: totalCombos - approved.length - rejected.length,
        totalCombos,
      },
      reviews,
    };

    await fs.mkdir(path.dirname(SUBMITTED_PATH), { recursive: true });
    await fs.writeFile(SUBMITTED_PATH, JSON.stringify(submission, null, 2), "utf8");

    return NextResponse.json({ ok: true, submission });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
