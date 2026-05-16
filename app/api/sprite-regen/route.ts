export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  isValidSpritePath,
  loadMetadata,
  saveMetadata,
} from "@/lib/art/spriteMetadata";

// Reject + regen flow. Writes an entry to public/art/_regen-queue.json
// and flips the sprite's approval to "rejected" in _sprite-metadata.json.
// Out-of-band: existing forge scripts pick up the queue and run Grok.

interface RegenQueueEntry {
  path: string;
  note?: string;
  editedPrompt?: string;
  queuedAt: string;
  status: "queued" | "completed" | "abandoned";
}

const QUEUE_FILE = path.join(process.cwd(), "public", "art", "_regen-queue.json");

async function loadQueue(): Promise<RegenQueueEntry[]> {
  try {
    const raw = await fs.readFile(QUEUE_FILE, "utf8");
    const parsed = JSON.parse(raw) as RegenQueueEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function saveQueue(entries: RegenQueueEntry[]): Promise<void> {
  await fs.writeFile(QUEUE_FILE, JSON.stringify(entries, null, 2) + "\n", "utf8");
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as {
    path?: string;
    note?: string;
    editedPrompt?: string;
  };
  const target = body.path ?? "";
  if (!isValidSpritePath(target)) {
    return NextResponse.json({ ok: false, error: "invalid path" }, { status: 400 });
  }

  // Append queue entry
  const queue = await loadQueue();
  const entry: RegenQueueEntry = {
    path: target,
    note: body.note,
    editedPrompt: body.editedPrompt,
    queuedAt: new Date().toISOString(),
    status: "queued",
  };
  queue.push(entry);
  await saveQueue(queue);

  // Flip approval → rejected, mark regenRequested so the list badge can
  // distinguish queued-for-regen from dead-end-reject.
  const meta = await loadMetadata(target);
  meta.approval = "rejected";
  meta.regenRequested = true;
  meta.note = body.note ?? meta.note;
  meta.reviewedAt = entry.queuedAt;
  await saveMetadata(meta);

  return NextResponse.json({ ok: true, queued: entry, metadata: meta });
}

export async function GET(): Promise<NextResponse> {
  const queue = await loadQueue();
  return NextResponse.json({ ok: true, queue });
}
