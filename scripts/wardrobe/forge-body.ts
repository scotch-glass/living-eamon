// ========================================================================
// LIVING EAMON — Wardrobe V2 · Gaius wardrobe-sprite generator
//
// Generates one complete FULL-BODY hero sprite per (equipment × weapon
// × stance) triple using text-only Grok Imagine Pro at 2k. Output is a
// transparent-PNG sprite of the Gaius body-template hero in the
// specified outfit, WITH head attached — heads are handled by
// human artists in a separate manual pass (2026-04-24 pivot: Grok's
// variance across calls defeats automated head-cutting).
//
// Body template: by default the `gaius` hero — olive-skinned grizzled
// Mediterranean warrior. Override with --templateSlug=<slug>.
//
// LOCAL MODE (default): writes to public/art/wardrobe/gaius/{e}_{w}_{s}.png.
// REMOTE MODE (--upload): uploads to wardrobe-bodies Supabase bucket +
//                         inserts wardrobe_bodies DB row.
//
// Usage:
//   # One combo
//   npx tsx scripts/wardrobe/forge-body.ts \
//     --equipment=leather_armor --weapon=hip_short_blade --stance=casual
//
//   # Full pilot matrix (5 equipment × 7 weapons × 1 stance = 35 combos)
//   npx tsx scripts/wardrobe/forge-body.ts --all
//
//   # Dry-run prints prompts and exits
//   npx tsx scripts/wardrobe/forge-body.ts --all --dry-run
//
// Cost: ~$0.07 per combo (grok-imagine-image-pro at 2k).
// Rate limits: Pro RPS 1 → sleep 2s between calls for safety.
// ========================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { buildIdentityBlock } from "../../lib/identityBlock";
import type { HeroCustomization } from "../../lib/heroTypes";
import { canonicalFraming } from "../../lib/spriteFraming";
import { generate } from "../../lib/wardrobe/generate";
import {
  EQUIPMENT_FRAMING,
  WEAPON_CARRY_FRAMING,
  STANCE_FRAMING,
  FRESH_REBIRTH_FRAMING,
  PILOT_EQUIPMENT,
  PILOT_WEAPONS,
  PILOT_STANCES,
  type Equipment,
  type Stance,
  type WeaponCarry,
} from "../../lib/wardrobe/prompts/body";
// NOTE: ANCHOR_EXCLUSIONS deliberately NOT imported. It was built for
// the legacy pair-diff pipeline where Call A had to render a naked
// anchor body ("no armor, no belt, no boots — the figure is UNEQUIPPED").
// In the V2 body-combo forge we WANT the armor, belt, boots, scabbard,
// and baldric to render. Including EXCLUSIONS caused Grok to render
// open-vest shirts, erased boots, and missing belts when it tried to
// reconcile the contradiction with EQUIPMENT_FRAMING. Removed 2026-04-24
// after the round-5 common_clothes "male stripper" regression.
import { ANCHOR_POSE_LOCK } from "../../lib/wardrobe/prompts/anchor";
import { CANONICAL_BODY_PROMPT_CHECKSUM } from "../../lib/wardrobe/slots";

// ── env ───────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");

function readEnv(key: string): string | null {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return null;
  const raw = fs.readFileSync(envPath, "utf8");
  const line = raw.split(/\r?\n/).find((l) => l.trim().startsWith(`${key}=`));
  if (!line) return null;
  return line.slice(`${key}=`.length).trim().replace(/^["']|["']$/g, "");
}

const XAI_KEY = readEnv("XAI_API_KEY") ?? readEnv("GROK_API_KEY");
const SUPABASE_URL = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_KEY = readEnv("SUPABASE_SERVICE_KEY");

if (!XAI_KEY) {
  console.error("ERROR: missing XAI_API_KEY in .env.local");
  process.exit(1);
}

const grok = new OpenAI({ apiKey: XAI_KEY, baseURL: "https://api.x.ai/v1" });

// ── CLI parsing ──────────────────────────────────────────────────

const args = process.argv.slice(2);
function flag(name: string): string | undefined {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit?.slice(`--${name}=`.length);
}
function bool(name: string): boolean {
  return args.includes(`--${name}`);
}

const templateSlug = flag("templateSlug") ?? "gaius";
const equipmentArg = flag("equipment") as Equipment | undefined;
const weaponArg = flag("weapon") as WeaponCarry | undefined;
const stanceArg = (flag("stance") ?? "casual") as Stance;
const combosArg = flag("combos");
const all = bool("all");
const dryRun = bool("dry-run");
const upload = bool("upload");

if (!all && !combosArg && (!equipmentArg || !weaponArg)) {
  console.error(
    "ERROR: pass --equipment=<e> --weapon=<w> [--stance=casual]  OR  --combos=a,b,c  OR  --all"
  );
  process.exit(1);
}
if (upload && (!SUPABASE_URL || !SUPABASE_KEY)) {
  console.error(
    "ERROR: --upload requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase =
  upload && SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

// ── Template hero loader ──────────────────────────────────────────
//
// We read the hero's customization vector from scripts/hero-seed-data.json
// rather than the Supabase hero_masters table so `--dry-run` works
// offline without DB credentials. Keeps the identity block deterministic
// across all body-combo generations.

interface SeedHero extends HeroCustomization {
  slug: string;
  id: string;
}

const seedPath = path.join(root, "scripts", "hero-seed-data.json");
if (!fs.existsSync(seedPath)) {
  console.error(`ERROR: seed file not found: ${seedPath}`);
  process.exit(1);
}
const seeds: SeedHero[] = JSON.parse(fs.readFileSync(seedPath, "utf8"));
function loadTemplate(): SeedHero {
  const hit = seeds.find((h) => h.slug === templateSlug);
  if (!hit) {
    console.error(
      `ERROR: template slug "${templateSlug}" not in hero-seed-data.json (available: ${seeds.map((h) => h.slug).join(", ")})`
    );
    process.exit(1);
  }
  return hit;
}
const template: SeedHero = loadTemplate();

// ── Prompt builder ───────────────────────────────────────────────

function buildBodyPrompt(e: Equipment, w: WeaponCarry, s: Stance): string {
  const identityBlock = buildIdentityBlock(template);
  return [
    identityBlock,
    EQUIPMENT_FRAMING[e],
    WEAPON_CARRY_FRAMING[w],
    STANCE_FRAMING[s],
    FRESH_REBIRTH_FRAMING,
    ANCHOR_POSE_LOCK,
    canonicalFraming("left", "medium"),
  ]
    .filter((clause) => clause.length > 0)
    .join(" ");
}

// ── One-combo forge ──────────────────────────────────────────────

async function forgeOne(e: Equipment, w: WeaponCarry, s: Stance): Promise<void> {
  const key = `${e}_${w}_${s}`;
  const prompt = buildBodyPrompt(e, w, s);

  console.log(`\n── ${key} ──`);
  console.log(`  template: ${template.slug}   version: ${CANONICAL_BODY_PROMPT_CHECKSUM}`);
  console.log(`  prompt length: ${prompt.length} chars`);

  if (dryRun) {
    console.log("  [DRY-RUN] would forge. First 400 chars of prompt:");
    console.log(`  ${prompt.slice(0, 400)}…`);
    return;
  }

  console.log(`  calling grok-imagine-image-pro @ 2k…`);
  const sprite = await generate({ grok, prompt });
  console.log(
    `  ✓ sprite PNG received  ${Math.round(sprite.png.length / 1024)} KB  hash=${sprite.variantHash}`
  );

  // Full hero sprite (head attached) with transparent background from
  // rembg. Heads will be cut and swapped manually by Scotch's artists.
  const outDir = path.join(root, "public", "art", "wardrobe", "gaius");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${key}.png`);
  fs.writeFileSync(outPath, sprite.png);
  console.log(`  ✓ saved ${outPath}`);

  if (!upload) {
    console.log(
      `  http:  http://localhost:3000/art/wardrobe/gaius/${key}.png  (local-only)`
    );
    return;
  }

  // Upload to wardrobe-bodies bucket + insert DB row.
  if (!supabase) throw new Error("upload requested but supabase client missing");
  const BUCKET = "wardrobe-bodies";
  const storageKey = `${key}_v${CANONICAL_BODY_PROMPT_CHECKSUM}_${Date.now()}.png`;
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(storageKey, sprite.png, {
      contentType: "image/png",
      upsert: false,
    });
  if (uploadErr) throw new Error(`upload failed: ${uploadErr.message}`);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storageKey);

  const { error: insertErr } = await supabase.from("wardrobe_bodies").insert({
    equipment: e,
    weapon: w,
    stance: s,
    png_url: urlData.publicUrl,
    template_hero_slug: template.slug,
    prompt_used: prompt,
    wardrobe_version: CANONICAL_BODY_PROMPT_CHECKSUM,
  });
  if (insertErr) throw new Error(`wardrobe_bodies insert failed: ${insertErr.message}`);

  console.log(`  ✓ uploaded: ${urlData.publicUrl}`);
}

// ── main ─────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`── Gaius wardrobe sprite forge (V2) ──`);
  console.log(`  mode: ${upload ? "REMOTE (bucket + DB)" : "LOCAL (public/art/wardrobe/gaius/)"}`);
  console.log(`  template: ${templateSlug}`);

  if (all || combosArg) {
    const combos: Array<[Equipment, WeaponCarry, Stance]> = [];
    if (all) {
      for (const e of PILOT_EQUIPMENT) {
        for (const w of PILOT_WEAPONS) {
          for (const s of PILOT_STANCES) {
            combos.push([e, w, s]);
          }
        }
      }
    } else if (combosArg) {
      // --combos=equipment_weapon_stance,... — parse explicit list.
      const keys = combosArg.split(",").map((k) => k.trim()).filter(Boolean);
      const validEquip = new Set<string>(PILOT_EQUIPMENT);
      const validWeap = new Set<string>(PILOT_WEAPONS);
      const validStance = new Set<string>(PILOT_STANCES);
      for (const key of keys) {
        // Key format: "{equip}_{weap}_{stance}". Weapon ids contain
        // underscores (hip_short_blade, back_two_hander), so parse by
        // matching against the known vocabularies.
        let matched = false;
        for (const e of PILOT_EQUIPMENT) {
          if (!key.startsWith(`${e}_`)) continue;
          const rest = key.slice(e.length + 1);
          for (const w of PILOT_WEAPONS) {
            if (!rest.startsWith(`${w}_`)) continue;
            const s = rest.slice(w.length + 1);
            if (validStance.has(s)) {
              combos.push([e, w, s as Stance]);
              matched = true;
              break;
            }
          }
          if (matched) break;
        }
        if (!matched) {
          console.error(
            `ERROR: --combos entry "${key}" did not parse as {equipment}_{weapon}_{stance}. Valid equipment: ${[...validEquip].join(", ")}. Valid weapons: ${[...validWeap].join(", ")}. Valid stances: ${[...validStance].join(", ")}.`
          );
          process.exit(1);
        }
      }
    }

    console.log(`  combos: ${combos.length}`);
    console.log(`  estimated cost: $${(combos.length * 0.07).toFixed(2)}`);
    console.log(`  estimated wall time: ~${Math.ceil((combos.length * 32) / 60)} min (30s/combo + 2s sleep)`);

    let i = 0;
    for (const [e, w, s] of combos) {
      i++;
      console.log(`\n  [${i}/${combos.length}]`);
      await forgeOne(e, w, s);
      // Grok Pro RPS 1 → sleep 2s between calls for safety.
      if (i < combos.length && !dryRun) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    console.log(`\n  ✓ done. ${combos.length} combos forged.`);
    return;
  }

  await forgeOne(equipmentArg!, weaponArg!, stanceArg);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
