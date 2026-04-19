// ============================================================
// BLOOD SPLATTER SVG DATA
// Procedural blood overlay system for combat sprites.
// Each splatter is an SVG path drawn inside a 100×100 viewBox
// (percentage-based so they scale to any sprite size).
// ============================================================

/** Which body zone a splatter targets — maps to vertical positioning. */
export type SplatterZone = "head" | "neck" | "torso" | "limbs";

/** Wound intensity — controls splatter size and opacity. */
export type WoundTier = "glancing" | "solid" | "devastating";

export interface SplatterDef {
  /** SVG path d-attribute, drawn in a 100×100 viewBox. */
  path: string;
  /** Center X offset within the zone band (0-100, percentage of sprite width). */
  cx: number;
  /** Center Y offset within the zone band (0-100, percentage of zone height). */
  cy: number;
  /** Base scale multiplier (before wound-tier adjustment). */
  baseScale: number;
}

// ── Splatter shape library ──
// Organic, asymmetric blobs — not circles. Each is roughly 30-50 units wide
// in the 100×100 viewBox so they can scale up/down per wound tier.

const SPLATTER_PATHS: string[] = [
  // 0 — heavy drip blob
  "M50 20 C58 18 68 25 70 35 C72 45 65 55 60 58 C55 62 48 65 42 60 C36 55 30 48 32 38 C34 28 42 22 50 20Z",
  // 1 — wide splat
  "M30 40 C35 30 45 25 55 28 C65 31 72 38 70 48 C68 58 60 62 50 60 C40 58 32 52 30 40Z",
  // 2 — elongated streak
  "M35 25 C42 22 55 24 62 30 C69 36 72 48 68 55 C64 62 55 58 48 55 C41 52 34 45 32 38 C30 31 33 27 35 25Z",
  // 3 — small spray dots merged
  "M45 30 C52 26 60 30 58 38 C56 46 50 50 44 48 C38 46 35 40 38 34 C41 28 44 30 45 30Z M62 42 C66 40 70 44 68 48 C66 52 62 50 62 46 C62 43 62 42 62 42Z",
  // 4 — dripping wound
  "M48 20 C55 18 62 24 60 32 C58 40 54 52 52 60 C50 68 48 72 46 68 C44 64 42 55 40 45 C38 35 41 24 48 20Z",
  // 5 — burst splatter
  "M50 25 C58 20 68 28 65 38 C62 48 70 52 65 58 C60 64 52 60 45 62 C38 64 30 58 32 48 C34 38 38 28 50 25Z",
  // 6 — slash mark
  "M30 30 C38 26 48 28 58 32 C68 36 74 42 70 48 C66 54 56 52 46 50 C36 48 28 44 26 38 C24 34 28 31 30 30Z",
  // 7 — pooling wound
  "M40 35 C46 28 58 30 62 38 C66 46 64 56 58 60 C52 64 44 62 38 58 C32 54 30 44 34 38 C36 34 39 35 40 35Z",
  // 8 — fine mist (many small marks)
  "M42 32 C46 30 50 32 48 36 C46 40 42 38 42 34Z M56 28 C60 26 64 30 62 34 C60 38 56 36 56 30Z M48 44 C52 42 56 46 54 50 C52 54 48 52 48 48Z M38 48 C42 46 44 50 42 52 C40 54 36 52 38 48Z",
  // 9 — heavy impact crater
  "M45 22 C55 18 66 24 68 36 C70 48 66 58 58 62 C50 66 40 64 34 58 C28 52 26 40 30 32 C34 24 40 22 45 22Z",
  // 10 — running drip
  "M50 18 C54 16 58 20 56 28 C54 36 56 44 54 52 C52 60 50 68 48 74 C46 68 44 60 46 52 C48 44 44 36 46 28 C48 20 50 18 50 18Z",
  // 11 — splashed arc
  "M28 45 C34 35 44 30 54 32 C64 34 72 40 70 50 C68 58 58 56 50 54 C42 52 34 50 30 48 C28 47 28 46 28 45Z",
];

// ── Zone positioning bands ──
// Each zone maps to a vertical band on the sprite (top=0%, bottom=100%).
// Splatters are placed randomly within these bands.
const ZONE_BANDS: Record<SplatterZone, { yMin: number; yMax: number }> = {
  head:  { yMin: 0,  yMax: 18 },
  neck:  { yMin: 14, yMax: 26 },
  torso: { yMin: 22, yMax: 58 },
  limbs: { yMin: 55, yMax: 88 },
};

// ── Wound tier scaling ──
const TIER_CONFIG: Record<WoundTier, { scale: number; opacity: number; count: number }> = {
  glancing:     { scale: 0.6,  opacity: 0.55, count: 1 },
  solid:        { scale: 0.85, opacity: 0.7,  count: 2 },
  devastating:  { scale: 1.2,  opacity: 0.85, count: 3 },
};

// ── Critical hit bonus ──
const CRIT_EXTRA: { scale: number; opacity: number; extraCount: number } = {
  scale: 1.4,
  opacity: 0.95,
  extraCount: 2,
};

/** A resolved splatter instance ready to render. */
export interface BloodSplatter {
  /** Unique ID for React keys. */
  id: string;
  /** Index into SPLATTER_PATHS for persistence. */
  pathIndex: number;
  /** SVG path data (resolved from pathIndex). */
  path: string;
  /** X position as % of sprite width (0-100). */
  x: number;
  /** Y position as % of sprite height (0-100). */
  y: number;
  /** Render scale (1 = base size ~30-50px in viewBox). */
  scale: number;
  /** Opacity 0-1. */
  opacity: number;
  /** Rotation in degrees (organic randomness). */
  rotation: number;
  /** Is this from a critical hit? (triggers extra glow). */
  isCrit: boolean;
}

let _idCounter = 0;

/** Generate a set of blood splatters for a single hit. */
export function generateHitSplatters(
  zone: SplatterZone,
  tier: WoundTier,
  isCrit: boolean,
): BloodSplatter[] {
  const band = ZONE_BANDS[zone];
  const cfg = TIER_CONFIG[tier];
  const count = cfg.count + (isCrit ? CRIT_EXTRA.extraCount : 0);
  const scale = cfg.scale * (isCrit ? CRIT_EXTRA.scale : 1);
  const opacity = isCrit ? CRIT_EXTRA.opacity : cfg.opacity;

  const splatters: BloodSplatter[] = [];
  for (let i = 0; i < count; i++) {
    const pathIdx = Math.floor(Math.random() * SPLATTER_PATHS.length);
    splatters.push({
      id: `blood_${++_idCounter}_${Date.now()}`,
      pathIndex: pathIdx,
      path: SPLATTER_PATHS[pathIdx],
      x: 25 + Math.random() * 50,  // center 50% of sprite width
      y: band.yMin + Math.random() * (band.yMax - band.yMin),
      scale: scale * (0.8 + Math.random() * 0.4), // ±20% variation
      opacity: opacity * (0.85 + Math.random() * 0.15),
      rotation: Math.random() * 360,
      isCrit,
    });
  }
  return splatters;
}

/** Derive wound tier from damage relative to max HP. */
export function getWoundTierFromDamage(damage: number, maxHp: number): WoundTier {
  const pct = damage / Math.max(1, maxHp);
  if (pct <= 0.1) return "glancing";
  if (pct <= 0.25) return "solid";
  return "devastating";
}

// ── Wound shapes — distinct from splatters ──
// Longer, thinner SVG paths that look like cuts, gashes, and punctures.
// These appear on the DEFENDER when they take a critical hit.

const WOUND_PATHS: string[] = [
  // 0 — diagonal slash
  "M25 30 C30 28 35 32 40 35 C50 40 60 45 70 42 C72 41 74 43 72 46 C62 50 52 48 42 44 C34 41 28 38 26 35 C24 33 24 31 25 30Z",
  // 1 — horizontal gash
  "M20 45 C28 42 38 44 50 43 C62 42 72 44 78 46 C80 47 80 50 78 51 C72 52 62 50 50 50 C38 50 28 52 22 50 C20 49 18 47 20 45Z",
  // 2 — jagged tear
  "M30 35 C35 32 38 36 42 34 C46 32 50 37 54 35 C58 33 62 38 66 36 C68 35 70 38 68 40 C64 42 60 39 56 41 C52 43 48 38 44 40 C40 42 36 38 32 40 C30 41 28 38 30 35Z",
  // 3 — deep puncture
  "M46 32 C50 30 54 32 56 36 C58 42 56 50 54 56 C52 60 50 62 48 60 C46 58 44 52 44 46 C44 40 44 34 46 32Z",
  // 4 — curved slash
  "M28 38 C34 30 44 28 54 32 C64 36 70 42 72 48 C73 52 70 54 68 52 C64 46 56 40 48 38 C40 36 34 38 30 42 C28 44 26 42 28 38Z",
  // 5 — X-shaped double cut
  "M30 30 C36 34 44 40 50 45 C56 50 62 54 68 58 C70 60 68 62 66 60 C60 56 54 50 50 47 C46 50 40 56 34 60 C32 62 30 60 32 58 C38 54 44 48 50 45Z",
];

/** Generate a wound mark on the defender for a critical hit. */
export function generateCritWound(zone: SplatterZone): BloodSplatter[] {
  const band = ZONE_BANDS[zone];
  const woundIdx = Math.floor(Math.random() * WOUND_PATHS.length);
  // Wounds use negative pathIndex range to distinguish from splatters.
  // We store the actual wound path index as -(woundIdx + 1) so it can
  // be persisted/reconstructed.
  const persistIdx = -(woundIdx + 1);

  return [{
    id: `wound_${++_idCounter}_${Date.now()}`,
    pathIndex: persistIdx,
    path: WOUND_PATHS[woundIdx],
    x: 35 + Math.random() * 30,  // centered on the body
    y: band.yMin + Math.random() * (band.yMax - band.yMin),
    scale: 1.3 + Math.random() * 0.4,  // large — wounds are visible
    opacity: 0.9,
    rotation: -20 + Math.random() * 40,  // slight angle variation
    isCrit: true,
  }];
}

/** Generate blood splatter on the ATTACKER from a critical hit they dealt. */
export function generateAttackerSplatter(zone: SplatterZone): BloodSplatter[] {
  // 2-3 splatters scattered across the attacker's torso/arms area
  // (the spray from the victim). Zone of the splatters on the attacker
  // is always torso/limbs since that's where spray lands.
  const attackerZones: SplatterZone[] = ["torso", "torso", "limbs"];
  const count = 2 + Math.floor(Math.random() * 2); // 2-3
  const splatters: BloodSplatter[] = [];
  for (let i = 0; i < count; i++) {
    const targetZone = attackerZones[i % attackerZones.length];
    const band = ZONE_BANDS[targetZone];
    const pathIdx = Math.floor(Math.random() * SPLATTER_PATHS.length);
    splatters.push({
      id: `atkblood_${++_idCounter}_${Date.now()}`,
      pathIndex: pathIdx,
      path: SPLATTER_PATHS[pathIdx],
      x: 25 + Math.random() * 50,
      y: band.yMin + Math.random() * (band.yMax - band.yMin),
      scale: 0.7 + Math.random() * 0.3,
      opacity: 0.6 + Math.random() * 0.2,
      rotation: Math.random() * 360,
      isCrit: false,  // on the attacker it's just splatter, not a wound
    });
  }
  return splatters;
}

// ── Persistence conversion ──
// BloodSplatterState (gameState.ts) is the DB-serializable form.
// BloodSplatter is the render-ready form with resolved SVG path.

import type { BloodSplatterState } from "./gameState";

/** Convert render-ready splatters to serializable form (drop the SVG path). */
export function toSplatterStates(splatters: BloodSplatter[]): BloodSplatterState[] {
  return splatters.map(s => ({
    id: s.id,
    pathIndex: s.pathIndex,
    x: s.x,
    y: s.y,
    scale: s.scale,
    opacity: s.opacity,
    rotation: s.rotation,
    isCrit: s.isCrit,
  }));
}

/** Reconstruct render-ready splatters from serialized state. */
export function fromSplatterStates(states: BloodSplatterState[]): BloodSplatter[] {
  return states.map(s => ({
    ...s,
    path: s.pathIndex < 0
      ? WOUND_PATHS[(-s.pathIndex - 1) % WOUND_PATHS.length]  // negative = wound
      : SPLATTER_PATHS[s.pathIndex % SPLATTER_PATHS.length],
  }));
}
