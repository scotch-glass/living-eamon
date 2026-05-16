export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

// Enumerate sprite files under /public/art/ that are in scope for the
// Sprite Review Tool v1: combat sprites and forged corpse PNGs.
//
// Scope (Decision #4): combat sprites + their de-facto equivalents.
//   - public/art/heroes/<hero>/combat/**/*.png
//   - public/art/heroes/<hero>/corpse/*.png         (Stage I forged corpses)
//   - public/art/npcs/<npc>/combat/**/*.png
//   - public/art/npcs/<npc>/master/*.png            (legacy combat sprites
//     for NPCs that were forged before the combat/ subfolder convention —
//     bandit_blade, bandit_brute, bandit_witch, henchman_brand all live
//     here. They are used in `lib/combat/sprites.ts:SPRITES`, so they
//     need approval to render in /dev/combat-arena.)
//   - public/art/npcs/<npc>/corpse/*.png            (Stage I forged corpses)

const PUBLIC_ROOT = path.join(process.cwd(), "public");
const ART_ROOT = path.join(PUBLIC_ROOT, "art");

async function dirExists(p: string): Promise<boolean> {
  try {
    const stat = await fs.stat(p);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function walkDirForPng(absDir: string): Promise<string[]> {
  if (!(await dirExists(absDir))) return [];
  const out: string[] = [];
  const entries = await fs.readdir(absDir, { withFileTypes: true });
  for (const ent of entries) {
    const abs = path.join(absDir, ent.name);
    if (ent.isDirectory()) {
      const nested = await walkDirForPng(abs);
      out.push(...nested);
    } else if (ent.isFile() && ent.name.toLowerCase().endsWith(".png")) {
      out.push(abs);
    }
  }
  return out;
}

function relUnderArt(abs: string): string {
  const rel = abs.slice(PUBLIC_ROOT.length).split(path.sep).join("/");
  return rel; // begins with /art/
}

export async function GET(): Promise<NextResponse> {
  const heroesRoot = path.join(ART_ROOT, "heroes");
  const npcsRoot = path.join(ART_ROOT, "npcs");
  const allPaths: string[] = [];

  // Heroes: <hero>/combat/**/*.png + <hero>/corpse/*.png
  if (await dirExists(heroesRoot)) {
    const heroDirs = await fs.readdir(heroesRoot, { withFileTypes: true });
    for (const hd of heroDirs) {
      if (!hd.isDirectory()) continue;
      const combatRoot = path.join(heroesRoot, hd.name, "combat");
      const corpseRoot = path.join(heroesRoot, hd.name, "corpse");
      allPaths.push(...(await walkDirForPng(combatRoot)));
      allPaths.push(...(await walkDirForPng(corpseRoot)));
    }
  }

  // NPCs: <npc>/combat/**/*.png + <npc>/master/*.png + <npc>/corpse/*.png.
  // master/ is included because legacy NPC combat sprites (bandits,
  // henchman_brand) were forged there before the combat/ subfolder split.
  if (await dirExists(npcsRoot)) {
    const npcDirs = await fs.readdir(npcsRoot, { withFileTypes: true });
    for (const nd of npcDirs) {
      if (!nd.isDirectory()) continue;
      const combatRoot = path.join(npcsRoot, nd.name, "combat");
      const masterRoot = path.join(npcsRoot, nd.name, "master");
      const corpseRoot = path.join(npcsRoot, nd.name, "corpse");
      allPaths.push(...(await walkDirForPng(combatRoot)));
      allPaths.push(...(await walkDirForPng(masterRoot)));
      allPaths.push(...(await walkDirForPng(corpseRoot)));
    }
  }

  const rels = allPaths.map(relUnderArt).sort();
  return NextResponse.json({ ok: true, paths: rels });
}
