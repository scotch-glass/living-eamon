// Deterministic Identity Block generator.
// The output of buildIdentityBlock() is stored verbatim in
// hero_masters.identity_block and re-sent on every future scene-image
// call for this hero. Zero LLM involvement at runtime. Lookup-table
// phrase composition ensures coherence across the hero's lifetime.
//
// If any phrase helper changes, existing heroes' identity blocks become
// inconsistent with their already-generated masters. Prefer additive
// changes (new branches, never altering existing phrase outputs).

import type {
  AgeBand,
  EyeColor,
  FacialHair,
  HairColor,
  HairLength,
  HeroCustomization,
  ScarCount,
  SkinTone,
} from "./heroTypes";

// ─── Phrase helpers ─────────────────────────────────────────────────

function ageClause(age: AgeBand): string {
  // Age-appropriate features only. NOT weathering — the Perpetual Hero
  // wakes at the Church of Perpetual Life in fresh body state on every
  // rebirth, so outdoor-exposure damage is accumulated runtime state
  // that does not belong here.
  switch (age) {
    case "young":
      return "In his late twenties, lean-featured and sharp-eyed";
    case "middle":
      return "In his mid-thirties, strong-jawed and at the apex of his physical power, face unlined";
    case "grizzled":
      return "Past forty, grey-threaded and strong-featured, face carrying the authority of long experience";
  }
}

function skinClause(skin: SkinTone): string {
  // Howard-canon palette: European-coded tones dominate.
  // Keep "dark" available for rare Stygian/southern heroes but steer
  // away from sub-Saharan ebony — Howard's "dark" characters are
  // Mediterranean-to-North-African in color, not African.
  switch (skin) {
    case "pale":
      return "Fair pale skin, northern-European in coloring, faintly ruddy at the cheeks";
    case "olive":
      return "Olive-toned Mediterranean skin, warm and sun-touched";
    case "tan":
      return "Sun-tanned skin, the healthy warm color of a man who lives outdoors";
    case "bronze":
      return "Warm bronzed skin, rich golden-brown from long hours under hard sun";
    case "dark":
      return "Deeply sun-browned skin the color of old saddle leather, Mediterranean-to-North-African in tone";
    case "weathered_tan":
      return "Weathered sun-beaten tan skin, lined from open country and salt wind";
  }
}

function hairClause(color: HairColor, length: HairLength): string {
  if (length === "bald") {
    return "Shaved bald, scalp bare and sun-darkened";
  }
  const colorName: Record<HairColor, string> = {
    black: "jet-black",
    brown: "chestnut-brown",
    blond: "sun-bleached blond",
    red: "deep auburn-red",
    grey: "iron-grey",
    white: "snow-white",
  };
  const templates: Record<Exclude<HairLength, "bald">, (c: string) => string> = {
    short: (c) => `Close-cropped ${c} hair`,
    medium: (c) => `${capitalize(c)} hair cut to the shoulder, loose`,
    long: (c) => `Long ${c} hair falling well past the shoulders, loose and unbound`,
  };
  return templates[length](colorName[color]);
}

function capitalize(s: string): string {
  if (s.length === 0) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function facialHairClause(style: FacialHair, hairColor: HairColor): string {
  // Beard color tracks hair color except for bald heroes — caller should
  // pass the hero's hair color regardless of hairLength so beard color
  // matches the original pre-shaving hair color.
  const beardColor: Record<HairColor, string> = {
    black: "black",
    brown: "chestnut",
    blond: "blond",
    red: "auburn",
    grey: "grey",
    white: "white",
  };
  switch (style) {
    case "clean":
      return "Clean-shaven, jawline hard and exposed";
    case "stubble":
      return `Several days of ${beardColor[hairColor]} stubble across the jaw`;
    case "beard":
      return `A short, well-trimmed ${beardColor[hairColor]} beard`;
    case "full_beard":
      return `A full thick ${beardColor[hairColor]} beard reaching to the collarbone`;
  }
}

function eyeClause(eye: EyeColor): string {
  switch (eye) {
    case "blue":
      return "Piercing ice-blue eyes";
    case "green":
      return "Pale green eyes with a wolfish steadiness";
    case "brown":
      return "Dark brown eyes, unreadable";
    case "grey":
      return "Cold steel-grey eyes";
    case "amber":
      return "Amber-gold eyes, almost feline";
    case "violet":
      return "Strange pale-violet eyes, uncommon and unsettling";
  }
}

function scarClause(count: ScarCount): string {
  // Scars are body state that accumulates runtime and wipes on death.
  // For the library hero (fresh rebirth state) this clause is NOT emitted
  // — see buildIdentityBlock below. This function exists for future
  // runtime scene-image calls that want to describe the hero's CURRENT
  // scar state (once we build the scar-layer system).
  switch (count) {
    case "none":
      return "";
    case "few":
      return "A handful of old pale scars across arms and chest — the marks of a working warrior";
    case "many":
      return "Dozens of overlapping scars across arms, chest, and shoulders — the ledger of a long violent life";
  }
}

function distinguishingMarkClause(mark?: string): string {
  if (!mark || mark.trim().length === 0) return "";
  return ` ${mark.trim()}.`;
}

// ─── Base template ──────────────────────────────────────────────────

const HERO_BASE_TEMPLATE = [
  "Photorealistic painted-realism male warrior from Living Eamon,",
  "in the spirit of Frank Frazetta and Gerald Brom.",
  "Heavily-muscled Conan-proportioned build: broad shoulders, thick chest and",
  "trapezius, powerful arms with defined brachialis and deltoids, chiseled",
  "abdominals, muscular thighs and calves. Approximately 6'2\" tall, athletic",
  "warrior silhouette. Clothed only in a dark leather loincloth, bare-chested",
  "and fully barefoot (no shoes, no sandals, no footwear of any kind), with",
  "torso and limbs exposed.",
].join(" ");

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Build the Identity Block for a hero. Pure function. Deterministic.
 * The returned string is stored verbatim in `hero_masters.identity_block`
 * and re-used on every future scene-image call for this hero.
 *
 * Identity only — no accumulated body state. Scars and distinguishing
 * marks are emitted only if explicitly provided in `h`; the library
 * hero is always fresh-rebirth state with those fields absent.
 */
export function buildIdentityBlock(h: HeroCustomization): string {
  const parts: string[] = [
    HERO_BASE_TEMPLATE,
    `${ageClause(h.ageBand)}.`,
    `${skinClause(h.skinTone)}.`,
    `${hairClause(h.hairColor, h.hairLength)}.`,
    `${facialHairClause(h.facialHair, h.hairColor)}.`,
    `${eyeClause(h.eyeColor)}.`,
  ];

  // Scars/marks: emit only when explicitly provided (body state, not identity).
  const scars = h.scarCount ? scarClause(h.scarCount) : "";
  if (scars) parts.push(`${scars}.`);
  const mark = distinguishingMarkClause(h.distinguishingMark);
  if (mark) parts.push(mark.trim());

  parts.push(`This is the single persistent hero named ${h.heroName}.`);
  return parts.join(" ");
}

// ─── Forge framing (master-image generation only) ───────────────────
//
// When generating the MASTER image that will become the hero's permanent
// reference, we append framing instructions so the output is cleanly
// isolated for the rembg pipeline. This framing is NOT part of the
// Identity Block itself — it's applied only at master-generation time.
// Future scene-image calls use the Identity Block without this framing,
// because those scenes have their own environment.

const FORGE_FRAMING = [
  "Rendered on a pure white studio backdrop, cleanly isolated from any",
  "environment, no background elements, no props except what is worn.",
  "Three-quarter standing pose facing the camera, arms slightly away from",
  "the body, weight balanced, gaze direct and unflinching. Even studio",
  "lighting. Full body in frame from head to feet with comfortable margin.",
  "Fresh-rebirth state: unscarred smooth skin, no battle marks, no blood,",
  "no dirt or grime, no tan lines or sunburn, no visible wounds, no",
  "bandages, no eye patches, no brands. The hero as he awakens on the",
  "floor of the Church of Perpetual Life — whole and unblemished.",
].join(" ");

/**
 * Full prompt for generating the master reference image. Combines the
 * Identity Block with forge-specific framing (white backdrop, neutral pose).
 * Used by the Grok Imagine Pro master-generation call.
 */
export function buildForgeGenerationPrompt(h: HeroCustomization): string {
  return `${buildIdentityBlock(h)} ${FORGE_FRAMING}`;
}
