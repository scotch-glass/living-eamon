// Public barrel for the combat module.
//
// Import from "lib/combat" rather than reaching into individual files where
// possible. Sub-files are exported directly only for type imports that the
// barrel can't carry without inflating the surface (zoneNarration / narrationPools
// internals are rarely needed externally — pull from those files directly when
// you do).

export * from "./types";
export {
  initCombatSession,
  resolveCombatRound,
  resolveCombatSpell,
  buildRoundNarrative,
  buildCombatantFromPlayer,
  buildCombatantFromNPC,
  tickStatusEffects,
  resolveStrike,
} from "./engine";
export { isCrossingBarrier, tickBarriers } from "./barriers";
export { EFFECT_ICON_MAP } from "./effectIconData";
export type { EffectIconDef } from "./effectIconData";
// Sprint C3 spell metadata — re-export for one-stop combat imports.
export {
  isCombatSpell,
  getSpellManaCost,
  getSpellCastSpeed,
  getSpellCastTurns,
  getSpellCircle,
  getSpellData,
  SPELL_DATA,
  SUPPORTED_COMBAT_SPELLS,
} from "./spellData";
export type { SpellCombatMetadata, SpellCircle, CastTurns } from "./spellData";
