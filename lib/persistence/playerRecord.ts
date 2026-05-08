// ============================================================
// Sprint A — persistence serializer (extracted 2026-05-03)
//
// Pure WorldState → row-record mapping consumed by savePlayer().
// Lives outside app/api/chat/route.ts so the round-trip test can
// import it directly without booting the API surface.
// ============================================================

import type { WorldState } from "../gameState";
import { syncCombatantArray } from "../combat/types";

export function worldStateToPlayerRecord(
  state: WorldState
): Record<string, unknown> {
  return {
    barrelStock: state.barrelStock,
    id: state.player.id,
    name: state.player.name,
    hp: state.player.hp,
    maxHp: state.player.maxHp,
    strength: state.player.strength,
    dexterity: state.player.dexterity,
    charisma: state.player.charisma,
    maxMana: state.player.maxMana,
    currentMana: state.player.currentMana,
    gold: state.player.gold,
    bankedGold: state.player.bankedGold,
    weapon: state.player.weapon,
    armor: state.player.armor,
    shield: state.player.shield,
    inventory: state.player.inventory,
    // PICSSI virtues (KARMA Sprint 2 — virtues column dropped).
    picssi_passion: state.player.picssi.passion,
    picssi_integrity: state.player.picssi.integrity,
    picssi_courage: state.player.picssi.courage,
    picssi_standing: state.player.picssi.standing,
    picssi_spirituality: state.player.picssi.spirituality,
    picssi_illumination: state.player.picssi.illumination,
    combat_victories: state.player.combatVictories,
    vd_active: state.player.vdActive,
    scrolls_read: state.player.scrollsRead,
    pending_riddle: state.player.pendingRiddle,
    npc_affection: state.player.npcAffection,
    flags_life: state.player.flagsLife,
    flags_legacy: state.player.flagsLegacy,
    pending_atom: state.player.pendingAtom,
    karma_log: state.player.karmaLog,
    quests: state.player.quests,
    // Sprint S3 — Words; persist across rebirth.
    givenWords: state.player.givenWords ?? [],
    reputationScore: state.player.reputationScore,
    reputationLevel: state.player.reputationLevel,
    knownAs: state.player.knownAs,
    currentRoom: state.player.currentRoom,
    currentAdventure: state.player.currentAdventure,
    completedAdventures: state.player.completedAdventures,
    bounty: state.player.bounty,
    isWanted: state.player.isWanted,
    turnCount: state.player.turnCount,
    visitedRooms: state.player.visitedRooms ?? [],
    receivedSamStarterOutfit: state.player.receivedSamStarterOutfit,
    receivedHokasUnarmedGift: state.player.receivedHokasUnarmedGift,
    barmaidPreference: state.player.barmaidPreference ?? null,
    helmet: state.player.helmet ?? null,
    gorget: state.player.gorget ?? null,
    bodyArmor: state.player.bodyArmor ?? null,
    limbArmor: state.player.limbArmor ?? null,
    boots: state.player.boots ?? null,
    ringLeft: state.player.ringLeft ?? null,
    ringRight: state.player.ringRight ?? null,
    cuffLeft: state.player.cuffLeft ?? null,
    cuffRight: state.player.cuffRight ?? null,
    necklace: state.player.necklace ?? null,
    // Sprint C1: ensure `combatants` array stays mirrored against the
    // legacy `playerCombatant` / `enemyCombatant` references on every write.
    // Mid-fight code paths only update the legacy fields; the persistence
    // boundary is where we re-canonicalize.
    activeCombat: state.player.activeCombat
      ? syncCombatantArray(state.player.activeCombat)
      : null,
    activeEffects: state.player.activeEffects ?? [],
    weaponPoisonCharges: state.player.weaponPoisonCharges ?? 0,
    weaponPoisonSeverity: state.player.weaponPoisonSeverity ?? 0,
    mounted: state.player.mounted ?? false,
    remembersOwnName: state.player.remembersOwnName ?? false,
    metZim: state.player.metZim ?? false,
    weaponSkills: state.player.weaponSkills,
    knownSpells: state.player.knownSpells ?? [],
    knownDeities: state.player.knownDeities ?? [],
    goreSplatters: state.player.goreSplatters ?? [],
    stamina: state.player.stamina,
    maxStamina: state.player.maxStamina,
    fatiguePool: state.player.fatiguePool,
    actionBudget: state.player.actionBudget,
    // Sprint A — persistence gap-fill (2026-05-03)
    knownCircles: state.player.knownCircles ?? [],
    tempModifiers: state.player.tempModifiers ?? [],
    currentPlane: state.player.currentPlane ?? "thurian",
    // Sprint S4c — world-map node; persists across rebirth
    currentNodeId: state.player.currentNodeId ?? "valus",
    // Sprint S4d — active travel route
    isTraveling: state.player.isTraveling ?? false,
    travelRoute: state.player.travelRoute ?? null,
    previousRoom: state.player.previousRoom ?? null,
    prisonTurnsRemaining: state.player.prisonTurnsRemaining ?? 0,
    lastAction: state.player.lastAction ?? null,
    worldTurn: state.worldTurn ?? 0,
    corpses: state.corpses ?? {},
    vendorTempStock: state.vendorTempStock ?? {},
    activeEvents: state.activeEvents ?? [],
    // Sprint G1 — real-time clock
    realTimeMs: state.realTimeMs ?? Date.now(),
    lastTickAt: state.lastTickAt ?? Date.now(),
    // Sprint G3 — current weather snapshot
    currentWeather: state.currentWeather ?? null,
    // Sprint G5 — room residues (sparse: only rooms that have active residue)
    roomResidue: Object.fromEntries(
      Object.entries(state.rooms)
        .filter(([, r]) => r.activeResidue?.length)
        .map(([id, r]) => [id, r.activeResidue])
    ),
  };
}
