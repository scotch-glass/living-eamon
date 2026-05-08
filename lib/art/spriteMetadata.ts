// ============================================================
// LIVING EAMON — Sprite metadata registry
//
// Single committed JSON file at public/art/_sprite-metadata.json
// keyed by relative sprite path. Holds per-sprite eye-Y pin,
// size class, facing flip, approval state, and the verbatim Grok
// prompt that produced it. Read at runtime, written by the
// Sprite Review Tool (`/dev/sprite-review`) and by forge scripts.
//
// Deterministic key ordering on every write so git diffs stay
// clean.
// ============================================================

import { promises as fs } from "node:fs";
import path from "node:path";
import type { SizeClass } from "./sizeClasses";

export interface GoreZone {
  id: string;
  /** 0..1 normalized X relative to the sprite alpha bbox. */
  normalizedX: number;
  /** 0..1 normalized Y relative to the sprite alpha bbox. */
  normalizedY: number;
  /** Splatter radius in normalized units (0..1, fraction of bbox). */
  radius: number;
  severity: "wound" | "splatter";
}

export interface SpriteMetadata {
  /** Relative path under /art/, e.g. "/art/heroes/gaius/combat/great_sword/v3.png". */
  path: string;
  sizeClass?: SizeClass;
  /** Image-space Y of the eye line; manually pinned in the review tool. */
  eyeYPx?: number;
  /** When true, render with `transform: scaleX(-1)`. Replaces SPRITES.flip hardcoding. */
  flip?: boolean;
  approval: "unreviewed" | "approved" | "rejected";
  /**
   * True iff approval=="rejected" AND a regen entry was added to
   * `_regen-queue.json`. False / undefined means rejected with no regen
   * queued (dead-end rejection — the sprite is bad but we don't want a
   * fresh roll, e.g. duplicate of a better candidate).
   */
  regenRequested?: boolean;
  /** Verbatim Grok prompt used to generate this sprite. */
  originalPrompt?: string;
  /** Snapshot ID of the standing prompt rules at generation time. */
  promptRulesSnapshotId?: string;
  /** ISO timestamp of last review action. */
  reviewedAt?: string;
  /** Free-form note from the reviewer (e.g., "regen — facing wrong"). */
  note?: string;
  /** True if this PNG is a forged corpse sprite. */
  isCorpse?: boolean;
  /** Corpse: path of the matching live sprite (or hero/NPC master). */
  livingSpriteRef?: string;
  /** Human-placed gore anchors. */
  goreZones?: GoreZone[];
  /** Whether gore placement has been reviewed + approved separately. */
  goreApproved?: boolean;
}

export type SpriteMetadataMap = Record<string, SpriteMetadata>;

const PUBLIC_ROOT = path.join(process.cwd(), "public");
const METADATA_FILE = path.join(PUBLIC_ROOT, "art", "_sprite-metadata.json");

export function defaultMetadata(spritePath: string): SpriteMetadata {
  return { path: spritePath, approval: "unreviewed" };
}

export async function loadAllMetadata(): Promise<SpriteMetadataMap> {
  try {
    const raw = await fs.readFile(METADATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as SpriteMetadataMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw err;
  }
}

export async function loadMetadata(spritePath: string): Promise<SpriteMetadata> {
  const all = await loadAllMetadata();
  return all[spritePath] ?? defaultMetadata(spritePath);
}

/** Sort keys deterministically for clean git diffs. */
function sortObjectKeys(obj: SpriteMetadataMap): SpriteMetadataMap {
  const sorted: SpriteMetadataMap = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = obj[key];
  }
  return sorted;
}

export async function saveMetadata(entry: SpriteMetadata): Promise<void> {
  const all = await loadAllMetadata();
  all[entry.path] = entry;
  const sorted = sortObjectKeys(all);
  await fs.writeFile(METADATA_FILE, JSON.stringify(sorted, null, 2) + "\n", "utf8");
}

export async function saveManyMetadata(entries: SpriteMetadata[]): Promise<void> {
  const all = await loadAllMetadata();
  for (const entry of entries) {
    all[entry.path] = entry;
  }
  const sorted = sortObjectKeys(all);
  await fs.writeFile(METADATA_FILE, JSON.stringify(sorted, null, 2) + "\n", "utf8");
}

/** Path-safety check matching `app/api/sprite-touchup/route.ts`. */
export function isValidSpritePath(rel: string): boolean {
  if (!rel.startsWith("/art/")) return false;
  if (!rel.endsWith(".png")) return false;
  const abs = path.normalize(path.join(PUBLIC_ROOT, rel));
  const artRoot = path.join(PUBLIC_ROOT, "art");
  return abs.startsWith(artRoot + path.sep);
}
