// ============================================================
// LIVING EAMON — Combat Effect Icon Data
// SVG paths, colors, animations, labels for all status effects.
// Hyborian aesthetic: angular, runic, carved-stone feel.
// ============================================================

import type { StatusEffectType } from "./combatTypes";

export interface EffectIconDef {
  /** SVG path `d` attribute, drawn inside a 20×20 viewBox. */
  svgPath: string;
  /** Primary color for the glyph + glow. */
  color: string;
  /** CSS animation class name (without the `le-fx-` prefix), or null for static. */
  animation: string | null;
  /** Player-facing label ("Bleed", "Haste", etc.). */
  label: string;
  /** Short description for tooltip. */
  description: string;
}

// ── Unified color palette (replaces the old EFFECT_COLORS in CombatScreen) ──

export const EFFECT_COLORS: Record<StatusEffectType, string> = {
  bleed: "#dc2626",
  severed_artery: "#dc2626",
  poison: "#84cc16",
  concussion: "#a855f7",
  damaged_eye: "#a855f7",
  crushed_windpipe: "#f97316",
  pierced_lung: "#f97316",
  cracked_ribs: "#facc15",
  broken_arm: "#facc15",
  broken_leg: "#facc15",
  haste: "#60a5fa",
  shield_aura: "#c0c0c0",
  invisible: "#93c5fd",
  feared_skip: "#f97316",
  numb_hand: "#94a3b8",
  hiccups: "#a78bfa",
  tongue_tied: "#a78bfa",
  marked_by_set: "#dc2626",
  blessed: "#facc15",
  cunning: "#34d399",
  feeblemind: "#6b7280",
};

// ── SVG paths (hand-crafted for 20×20 viewBox) ──

export const EFFECT_ICON_MAP: Record<StatusEffectType, EffectIconDef> = {
  // ── Injuries ──────────────────────────────────────────

  bleed: {
    // Three diagonal claw slashes
    svgPath: "M5 4L9 16 M8 3L12 15 M11 4L15 16",
    color: "#dc2626",
    animation: "pulse",
    label: "Bleeding",
    description: "Losing HP each round from an open wound.",
  },
  poison: {
    // Fanged serpent head (coiled S-shape)
    svgPath: "M7 3C4 5 4 8 7 10S13 12 10 15C8 17 5 16 4 14 M7 7L5 5 M7 7L5 9",
    color: "#84cc16",
    animation: "pulse",
    label: "Poisoned",
    description: "Venom spreads through the blood. HP loss until cured.",
  },
  concussion: {
    // Broken concentric circles (shattered halo)
    svgPath: "M10 3A7 7 0 0 1 17 10 M10 3A7 7 0 0 0 3 10 M7 6A4 4 0 0 1 14 8 M6 12A4 4 0 0 0 14 12",
    color: "#a855f7",
    animation: "wobble",
    label: "Concussion",
    description: "Rattled brain. Reduced accuracy.",
  },
  damaged_eye: {
    // Eye glyph with diagonal slash
    svgPath: "M3 10C3 10 7 4 10 4S17 10 17 10C17 10 13 16 10 16S3 10 3 10Z M10 8A2 2 0 1 1 10 12A2 2 0 1 1 10 8 M4 16L16 4",
    color: "#a855f7",
    animation: null,
    label: "Damaged Eye",
    description: "Impaired vision. Significant accuracy penalty.",
  },
  severed_artery: {
    // Spurting wound — angled line with spray dots
    svgPath: "M6 14L10 6 M8 5L6 2 M10 6L8 3 M10 6L12 3 M10 6L14 4 M10 6L11 2",
    color: "#dc2626",
    animation: "pulse",
    label: "Severed Artery",
    description: "Arterial wound. Heavy bleeding each round.",
  },
  crushed_windpipe: {
    // Throat with X through it
    svgPath: "M7 4L7 16 M13 4L13 16 M7 8L13 8 M7 12L13 12 M4 5L16 15 M16 5L4 15",
    color: "#f97316",
    animation: null,
    label: "Crushed Windpipe",
    description: "Choking. Potentially fatal.",
  },
  pierced_lung: {
    // Ribcage with arrow tip piercing
    svgPath: "M6 4L6 16 M14 4L14 16 M6 7L14 7 M6 10L14 10 M6 13L14 13 M2 10L6 10 M2 10L4 8 M2 10L4 12",
    color: "#f97316",
    animation: "pulse",
    label: "Pierced Lung",
    description: "Labored breathing. Reduced effectiveness.",
  },
  cracked_ribs: {
    // Cracked bone — two pieces with jagged split
    svgPath: "M5 4L8 9L5 10L8 16 M15 4L12 9L15 10L12 16 M8 9L12 9 M8 10L12 10",
    color: "#facc15",
    animation: null,
    label: "Cracked Ribs",
    description: "Pain on exertion. Each swing costs more.",
  },
  broken_arm: {
    // Arm bent at wrong angle
    svgPath: "M5 4L8 10L5 10L10 16 M10 16L12 14 M10 16L8 14",
    color: "#facc15",
    animation: null,
    label: "Broken Arm",
    description: "Weapon skill severely penalized.",
  },
  broken_leg: {
    // Leg with break mark, foot at angle
    svgPath: "M10 3L10 9L8 10L10 11L10 14L7 17 M10 14L13 17 M8 9L12 11",
    color: "#facc15",
    animation: null,
    label: "Broken Leg",
    description: "Cannot flee. Mobility gone.",
  },

  // ── Spell buffs / debuffs ─────────────────────────────

  haste: {
    // Winged sandal (single wing)
    svgPath: "M6 14L14 14L12 16L6 16Z M3 10L6 14 M3 10L6 8 M3 10L5 6 M3 10L7 7 M3 10L8 9",
    color: "#60a5fa",
    animation: "shimmer",
    label: "Haste",
    description: "+10 agility. Feet like wings.",
  },
  shield_aura: {
    // Radiant kite shield with emanating lines
    svgPath: "M10 3L16 7L10 17L4 7Z M10 3L10 1 M4 7L2 6 M16 7L18 6 M7 12L4 14 M13 12L16 14",
    color: "#c0c0c0",
    animation: "glow",
    label: "Silver Aura",
    description: "+20 armor cover on all zones. A silver glow catches blades.",
  },
  invisible: {
    // Dashed human outline (disappearing figure)
    svgPath: "M10 3L10 4 M10 5.5L10 6 M8 7L7 8 M7 9.5L7 11 M13 7L13 8 M13 9.5L13 11 M8 12L8 13 M8 14.5L8 17 M12 12L12 13 M12 14.5L12 17",
    color: "#93c5fd",
    animation: "fade",
    label: "Invisible",
    description: "Unseen. The next blow finds no one.",
  },
  feared_skip: {
    // Wide-eyed screaming face — Hyborian panic mask (angular, carved-stone feel)
    svgPath: "M4 4L10 2L16 4L16 14L13 17L10 18L7 17L4 14Z M6 7A1.5 1.5 0 1 1 9 7A1.5 1.5 0 1 1 6 7 M11 7A1.5 1.5 0 1 1 14 7A1.5 1.5 0 1 1 11 7 M8 12A2 3 0 1 1 12 12A2 3 0 1 1 8 12",
    color: "#f97316",
    animation: "shake",
    label: "Panic",
    description: "Terror freezes the limbs. Skips next strike.",
  },
  numb_hand: {
    // Open hand with frost lines from fingers
    svgPath: "M10 16L10 9 M10 9L7 5 M10 9L5 7 M10 9L8 4 M10 9L13 5 M10 9L15 7 M6 4L5 2 M14 4L15 2 M4 7L2 6 M16 7L18 6",
    color: "#94a3b8",
    animation: null,
    label: "Numb Hand",
    description: "Dead grip. Next strike will miss.",
  },
  hiccups: {
    // Spiral emerging from an open mouth
    svgPath: "M8 14L12 14L12 16L8 16Z M10 14L10 10 M10 10A2 2 0 0 1 12 8A3 3 0 0 0 9 5A4 4 0 0 1 13 3",
    color: "#a78bfa",
    animation: "bounce",
    label: "Hiccups",
    description: "*hic* -3 agility. Cannot be dignified.",
  },
  tongue_tied: {
    // Knotted tongue glyph
    svgPath: "M7 16L10 3L13 16 M8 10C8 8 12 8 12 10C12 12 8 12 8 10",
    color: "#a78bfa",
    animation: null,
    label: "Tongue-Tied",
    description: "Words of Power scramble on the tongue. Spells fizzle.",
  },
  marked_by_set: {
    // Coiled serpent in a circle (ouroboros of Set)
    svgPath: "M10 2A8 8 0 1 1 10 18A8 8 0 1 1 10 2 M7 6C5 8 5 12 7 14S13 16 15 12C16 10 14 7 12 6S8 5 7 6 M7 7L5 5 M7 7L5 9",
    color: "#dc2626",
    animation: "glow",
    label: "Marked by Set",
    description: "The serpent god smelled you. Enemy strikes at +15.",
  },
  blessed: {
    svgPath: "M10 2L10 18 M10 6L7 3 M10 6L13 3 M10 10L6 8 M10 10L14 8 M10 14L7 17 M10 14L13 17",
    color: "#facc15",
    animation: "glow",
    label: "Blessed",
    description: "Ma'at's light. Poison and bleeding blunted. Illumination and Charisma lifted.",
  },
  cunning: {
    svgPath: "M4 10 Q10 2 16 10 Q10 18 4 10 M8 10 Q10 6 12 10 Q10 14 8 10",
    color: "#34d399",
    animation: "pulse",
    label: "Cunning",
    description: "Thought quickens. Spells hit harder and fizzle less.",
  },
  feeblemind: {
    svgPath: "M6 6 Q10 4 14 6 M6 14 Q10 16 14 14 M4 10 L16 10 M10 4 L10 16",
    color: "#6b7280",
    animation: "none",
    label: "Feeblemind",
    description: "Thought thickens. Spells weaken and falter.",
  },
};
