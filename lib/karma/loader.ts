// ============================================================
// KARMA — Atom library loader
// KARMA Sprint 4. Reads `scripts/balance/library/*.json` at
// runtime, validates each entry against the Encounter schema,
// caches the result. Same validation rules as the design-time
// simulator (`scripts/balance/simulator.ts`) — both share the
// canonical schema in `lib/karma/atom-types.ts`.
//
// Loader runs server-side only (uses `fs`). Client-side code
// should never import from this module.
// ============================================================

import fs from "node:fs";
import path from "node:path";
import type { Encounter } from "./atom-types";

const ATOM_LIBRARY_DIR = path.join(
  process.cwd(),
  "scripts",
  "balance",
  "library"
);

let cache: Encounter[] | null = null;

/**
 * Load and validate every atom in the library. Cached after first
 * call — atoms are static authored content, no need to re-read.
 *
 * Throws on validation failure. Atom JSONs that don't compile crash
 * the server in dev (loud) and never reach a live player.
 */
export function loadAtoms(): Encounter[] {
  if (cache) return cache;
  if (!fs.existsSync(ATOM_LIBRARY_DIR)) {
    cache = [];
    return cache;
  }
  const files = fs
    .readdirSync(ATOM_LIBRARY_DIR)
    .filter(f => f.endsWith(".json"));
  const out: Encounter[] = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(ATOM_LIBRARY_DIR, file), "utf8");
    let parsed: Encounter;
    try {
      parsed = JSON.parse(raw) as Encounter;
    } catch (e) {
      throw new Error(
        `[karma/loader] failed to parse ${file}: ${(e as Error).message}`
      );
    }
    validate(parsed, file);
    out.push(parsed);
  }
  cache = out;
  return cache;
}

/** Find a single atom by id, or null if unknown. */
export function findAtom(atomId: string): Encounter | null {
  return loadAtoms().find(a => a.id === atomId) ?? null;
}

/**
 * Same shape as `scripts/balance/simulator.ts:validate` so dev-time
 * coverage audits and runtime loads enforce the same contract.
 */
function validate(enc: Encounter, file: string): void {
  if (!enc.id) throw new Error(`[karma/loader] ${file}: missing id`);
  if (!enc.title) throw new Error(`[karma/loader] ${file}: missing title`);
  if (!enc.pdSource) throw new Error(`[karma/loader] ${file}: missing pdSource`);
  if (typeof enc.pdSafe !== "boolean")
    throw new Error(`[karma/loader] ${file}: missing pdSafe`);
  if (!enc.patternType)
    throw new Error(`[karma/loader] ${file}: missing patternType`);
  if (!Array.isArray(enc.triggers) || enc.triggers.length === 0)
    throw new Error(`[karma/loader] ${file}: missing or empty triggers`);
  if (!enc.choices || enc.choices.length === 0)
    throw new Error(`[karma/loader] ${file}: must have at least 1 choice`);
  for (const c of enc.choices) {
    if (!c.id) throw new Error(`[karma/loader] ${file}: choice missing id`);
    if (!c.karma)
      throw new Error(`[karma/loader] ${file}: choice ${c.id} missing karma`);
    if (!c.affect)
      throw new Error(`[karma/loader] ${file}: choice ${c.id} missing affect`);
    if (!c.resolutionHint)
      throw new Error(
        `[karma/loader] ${file}: choice ${c.id} missing resolutionHint`
      );
  }
}
