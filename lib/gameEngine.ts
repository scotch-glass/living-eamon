// ============================================================
// LIVING EAMON — GAME ENGINE
// Reads gameData.ts (static world) and gameState.ts (live state)
// Decides what is handled statically vs what needs an API call.
// Never mutates state directly — returns new state + response.
// ============================================================

import {
  NPCS,
  ITEMS,
  ADVENTURES,
  COMBAT_TEMPLATES,
  getEnemyDeathPool,
  SAM_INVENTORY,
  PRIEST_SILENCE_RESPONSES,
  REBIRTH_NARRATIVES,
  ROOM_ROBE_HUMILIATION,
  COURTYARD_ROBE_HUMILIATION,
  BARREL_EXAMINE_DESCRIPTIONS,
  ROBE_CEREMONY_NARRATIVES,
  BARREL_NPC_HINTS,
  ALDRIC_OPENING_LINES,
  ALDRIC_TOPIC_RESPONSES,
  type NPCBodyType,
  type SamShopRow,
  Room,
  NPC,
} from "./gameData";

import { ALL_ROOMS as MAIN_HALL_ROOMS } from "./adventures/registry";
import { BRUNT_GREETINGS, getBruntTier } from "./adventures/guild-hall";

import {
  WorldState,
  PlayerState,
  PlayerInventoryItem,
  NPCStateEntry,
  tickWorldState,
  movePlayer,
  updatePlayerGold,
  updatePlayerHP,
  bumpStanding,
  addToChronicle,
  changeRoomState,
  changeNPCDisposition,
  applyFireballConsequences,
  setNPCCombatHp,
  applyPlayerDeath,
  updateWeaponSkill,
  addToVendorTempStock,
  SKILL_NAMES,
  SKILL_CAP,
  normalizeWeaponSkills,
  revealItemsInRoom,
  removeRevealedItem,
  isDay,
  type Corpse,
  type WeaponSkills,
} from "./gameState";

import type { TimeOfDay } from "./weatherService";

import {
  isTwoHanded,
  WEAPON_DATA,
  getDexReactionBonus,
  getWeaponSkillKey,
} from "./uoData";

import type { BodyZone, ActiveCombatSession, ActiveStatusEffect } from "./combatTypes";
import { BODY_ZONES } from "./combatTypes";
import {
  fatigueLevel,
  recomputeDerivedStats,
  weaponStaminaCost,
} from "./karma/recompute";
import { matchActivity, applyActivity } from "./karma/activities";
import { answerPendingRiddle, findScroll, readScroll } from "./karma/scrolls";
import { matchTriggers, type KarmaEvent } from "./karma/triggers";
import { findAtom } from "./karma/loader";
import { applyChoice, presentAtom } from "./karma/resolve";
import { applyKarma, logKarmaDelta } from "./karma/recompute";
import {
  computeCombatDeltas,
  sumDeltas,
  type CombatDeltaContext,
} from "./karma/combat-deltas";
import type { KarmaDelta } from "./karma/types";
import { emitQuestEvent } from "./quests/engine";
import { resolveQuestDialogue } from "./quests/dialogue";
import { handleInvoke, composeInvokeResponse } from "./sorcery/invoke";
import { renderActiveQuests, renderQuestLog } from "./quests/log";
import "./quests/load"; // side-effect: registers all quest line modules
import {
  SITUATION_BLOCK_LINE,
  exitDestinationLabel,
  presentNPCsInRoom,
  isShieldSlotItem,
  isBodyArmorSlotItem,
  getCommandAutocompleteSuggestions,
  type AutocompleteItem,
  type AutocompleteDispositionTone,
} from "./gameEngineClient";

export {
  SITUATION_BLOCK_LINE,
  getCommandAutocompleteSuggestions,
  type AutocompleteItem,
  type AutocompleteDispositionTone,
};

/**
 * Apply per-strike stamina drain. KARMA_SYSTEM.md §2.3: every swing
 * costs `weaponStaminaCost(weaponId)`; both pools take the hit so the
 * `stamina` bar shows immediate exhaustion while `fatiguePool` carries
 * tier debt across rounds and into the next fight if not recovered.
 */
// Sprint 7b.R — checks if there is a hot flame source in the room.
// First pass: looks for a campfire or pyre in the room's examinable objects.
// Fire Field / Fireball residue plug in here when those spells land.
// Sprint 7b.R — checks if there is a hot flame source in the room.
// First pass: room-state "burnt" is an after-fire state — not a live flame.
// Active fire (Fire Field / Fireball residue) plugs in here when those
// spells land. For now always returns false; BURN uses this as its gate.
function hasHotFlameSource(_state: WorldState, _roomId: string): boolean {
  // Future: check active Fire Field barriers and Fireball residue flags.
  return false;
}

function drainPlayerStaminaForStrike(
  state: WorldState,
  weaponId: string
): WorldState {
  const cost = weaponStaminaCost(weaponId);
  const p = state.player;
  return {
    ...state,
    player: {
      ...p,
      stamina: Math.max(0, p.stamina - cost),
      fatiguePool: p.fatiguePool - cost,
    },
  };
}

/**
 * Build combat-PICSSI tag flags from an NPC's authored tags.
 * Tags drive Illumination shifts (dark vs innocent vs friendly) and
 * the catastrophic delta path (killing a friendly).
 */
function tagFlagsFromNpc(
  npcId: string | null | undefined
): {
  killedDarkBeing: boolean;
  killedInnocent: boolean;
  killedFriendly: boolean;
} {
  if (!npcId) return { killedDarkBeing: false, killedInnocent: false, killedFriendly: false };
  const npc = NPCS[npcId];
  const tags = npc?.tags ?? [];
  const dark =
    tags.includes("dark") ||
    tags.includes("undead") ||
    tags.includes("daemon") ||
    tags.includes("sorceror") ||
    tags.includes("serpent");
  return {
    killedDarkBeing: dark,
    killedInnocent: tags.includes("innocent"),
    killedFriendly: tags.includes("friendly"),
  };
}

/**
 * Apply combat-PICSSI deltas (Sprint 5). Writes a single chronicle
 * line summarizing the net karmic shift if anything moved; the
 * narrative that goes back to the player is the caller's
 * responsibility.
 */
function applyCombatDeltas(
  state: WorldState,
  ctx: CombatDeltaContext,
  source = "combat"
): WorldState {
  const deltas = computeCombatDeltas(ctx);
  if (deltas.length === 0) return state;
  let next = state;
  for (const d of deltas) {
    next = { ...next, player: applyKarma(next.player, d) };
  }
  // Sprint 6: log the net summed delta as a single karma-history entry.
  const summary = sumDeltas(deltas);
  next = { ...next, player: logKarmaDelta(next.player, summary, source) };
  // Chronicle the net summary so the deed log captures the shift.
  const parts = (Object.entries(summary) as Array<[keyof KarmaDelta, number]>)
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => `${k.charAt(0).toUpperCase()}${k.slice(1)} ${v > 0 ? "+" : ""}${v}`);
  if (parts.length > 0) {
    next = addToChronicle(
      next,
      `Combat karma shifted: ${parts.join(", ")}.`,
      false
    );
  }
  return next;
}

/**
 * Combat-end recovery — applied on victory, dummy-kill, or flee.
 *   killed > 0 → fatiguePool recovers maxStamina × 1.5 per kill.
 *   killed = 0 → fatiguePool recovers maxStamina × 0.5 (a flee/breather).
 * Stamina restores fully either way (the heart finally slows).
 * Player-death path skips this; applyPlayerDeath handles rebirth.
 */
function applyCombatEndRecovery(
  state: WorldState,
  enemiesKilled: number
): WorldState {
  const p = state.player;
  const recovery =
    enemiesKilled > 0
      ? enemiesKilled * p.maxStamina * 1.5
      : p.maxStamina * 0.5;
  return {
    ...state,
    player: {
      ...p,
      stamina: p.maxStamina,
      fatiguePool: Math.min(0, p.fatiguePool + recovery),
    },
  };
}

// ── Combat-end helper: transfer persistent effects back to player ──
// Called from every place that ends combat (victory, flee, dummy).
// On player death, applyPlayerDeath() resets activeEffects = [] separately.
function endCombatSession(state: WorldState, transferEffects: boolean): WorldState {
  const session = state.player.activeCombat;
  const carried: ActiveStatusEffect[] = transferEffects && session
    ? session.playerCombatant.activeEffects.map(e => ({ ...e }))
    : (state.player.activeEffects ?? []);
  return {
    ...state,
    player: {
      ...state.player,
      activeCombat: null,
      activeEffects: carried,
    },
  };
}
import {
  initCombatSession,
  resolveCombatRound as resolveCombatRound,
  buildRoundNarrative,
  resolveCombatSpell,
  isCombatSpell,
} from "./combatEngine";

// ============================================================
// TYPES
// ============================================================

export type ResponseType = "static" | "dynamic";

export interface EngineResult {
  responseType: ResponseType;
  staticResponse: string | null;   // Ready to display, no API needed
  dynamicContext: string | null;   // Injected into Jane prompt if dynamic
  newState: WorldState;
  stateChanged: boolean;
  /** Prepended before streamed Jane text (SAY / TELL echo lines) */
  echoPrefix?: string | null;
  /** World-object cache key when response is examine-specific */
  examineObjectKey?: string | null;
  hasCritical?: boolean;
  criticalContext?: string | null;
  /** NPC id the hero is actively conversing with (shows sprite). */
  conversationNpcId?: string | null;
}

// ============================================================
// SITUATION BLOCK (static, always appended by API)
// ============================================================

const SIT_LINE = SITUATION_BLOCK_LINE;

/** "unarmed" is a sentinel — not an ITEMS id. */
function equippedWeaponDisplayLabel(weaponId: string): string {
  if (weaponId === "unarmed") return "Unarmed";
  return ITEMS[weaponId]?.name ?? weaponId;
}

/** Shop greetings — appended to room description when player enters a shop room. */
const SHOP_ROOM_GREETINGS: Record<string, string> = {
  sams_sharps: `Sam glances up. "Welcome. Would you like to __CMD:SHOP__?"`,
  armory: `Pip straightens up. "Welcome. Would you like to __CMD:SHOP__?"`,
  mage_school: `Zim looks up from his books. "Welcome. Would you like to __CMD:SHOP__?"`,
};

/** NPC id for each shop/service room — shown as sprite when entering. */
const SHOP_ROOM_NPC: Record<string, string> = {
  sams_sharps: "sam_slicker",
  armory: "armory_attendant",
  mage_school: "zim_the_wizard",
  guild_vault: "brunt_the_banker",
};

const EXIT_ARROW: Record<string, string> = {
  north: "North",
  east: "East",
  south: "South",
  west: "West",
  up: "Up",
  down: "Down",
};

/** Order on situation line: N, S, E, W, U, D (matches typical map layout) */
const SITUATION_EXIT_ORDER = ["north", "south", "east", "west", "up", "down"] as const;

/** Static situation footer: exits, present NPCs, room items & examinables */
export function buildSituationBlock(state: WorldState): string {
  const room = MAIN_HALL_ROOMS[state.player.currentRoom];
  if (!room) {
    const lines = [SIT_LINE, "🧭 —", "👤 —", "👁 —"];
    if (state.player.currentRoom === "main_hall") lines.push("Type HELP for help");
    lines.push(SIT_LINE);
    return lines.join("\n");
  }

  const visited = state.player.visitedRooms ?? [];
  const exitParts: string[] = [];
  for (const dir of SITUATION_EXIT_ORDER) {
    const to = room.exits[dir];
    if (!to) continue;
    const arrow = EXIT_ARROW[dir] ?? dir.charAt(0).toUpperCase() + dir.slice(1);
    exitParts.push(`${arrow}→${exitDestinationLabel(to, visited)}`);
  }
  const exitLine =
    exitParts.length > 0 ? `🧭 ${exitParts.join(" · ")}` : "🧭 —";

  const BARMAID_IDS = new Set(["lira", "mavia", "seraine"]);
  const chosenBarmaid = state.player.barmaidPreference;
  const npcParts = room.npcs
    .map(id => state.npcs[id])
    .filter((n): n is NPCStateEntry => {
      if (!n?.isAlive || n.location !== room.id) return false;
      // Hide barmaids from situation block unless she's the chosen one
      if (BARMAID_IDS.has(n.npcId)) return n.npcId === chosenBarmaid;
      // Hide training dummies from situation block — they're furniture
      if (NPCS[n.npcId]?.isTrainingDummy) return false;
      return true;
    })
    .map(n => {
      const npcData = NPCS[n.npcId];
      const name = npcData?.name ?? n.npcId;
      if (n.combatHp !== null && npcData) {
        const maxHp = npcData.stats?.hp ?? 1;
        const pct = Math.max(0, n.combatHp) / maxHp;
        const filled = Math.round(pct * 8);
        const bar = "█".repeat(filled) + "░".repeat(8 - filled);
        return `${name} [${bar} ${n.combatHp}/${maxHp}]`;
      }
      return name;
    });
  const npcLine =
    npcParts.length > 0 ? `👤 ${npcParts.join(" · ")}` : "👤 —";

  const itemLabels = room.items
    .map(id => ITEMS[id]?.name ?? id)
    .filter(Boolean);
  const examLabels = (room.examinableObjects ?? []).map(o => o.label);
  const roomStateEntry = state.rooms[room.id];
  const revealedLabels = (roomStateEntry?.revealedItems ?? [])
    .map(r => {
      const item = ITEMS[r.itemId];
      if (!item) return null;
      const container = (room.examinableObjects ?? []).find(
        ex => ex.id === r.containerId
      );
      const containerLabel = container?.label ?? r.containerId;
      return `${item.name} (in ${containerLabel})`;
    })
    .filter((x): x is string => x !== null);
  const eyeSet = [
    ...new Set([...itemLabels, ...examLabels, ...revealedLabels]),
  ];
  const eyeLine = eyeSet.length > 0 ? `👁 ${eyeSet.join(" · ")}` : "👁 —";

  const lines = [SIT_LINE, exitLine, npcLine, eyeLine];
  if (state.player.currentRoom === "main_hall") {
    lines.push("Type HELP for help");
  }
  lines.push(SIT_LINE);
  return lines.join("\n");
}

/**
 * Removes a trailing situation block (dashed box) if present, so the API
 * does not stack two blocks when the body already contained one.
 */
export function stripTrailingSituationBlocks(text: string): string {
  const esc = SITUATION_BLOCK_LINE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\n\\n${esc}\\n[\\s\\S]*?\\n${esc}$`);
  let t = text.trimEnd();
  let prev = "";
  while (t !== prev) {
    prev = t;
    t = t.replace(re, "").trimEnd();
  }
  return t;
}

// (Autocomplete + presentNPCsInRoom + npcTone moved to ./gameEngineClient
//  so client components can import them without dragging the rest of
//  the engine — and its server-only karma modules — into the browser bundle.)

const HOKAS_UNARMED_GIFT_WEAPON = "short_sword";
const HOKAS_UNARMED_GIFT_CLOTHES = [
  "ragged_shirt",
  "ragged_trousers",
  "ragged_belt",
  "ragged_shoes",
] as const;

function grantHokasUnarmedGiftInventory(inv: PlayerInventoryItem[]): PlayerInventoryItem[] {
  let next = [...inv];
  const addOne = (itemId: string) => {
    const idx = next.findIndex(e => e.itemId === itemId);
    if (idx < 0) next.push({ itemId, quantity: 1 });
    else
      next = next.map((e, i) =>
        i === idx ? { ...e, quantity: e.quantity + 1 } : e
      );
  };
  for (const id of HOKAS_UNARMED_GIFT_CLOTHES) addOne(id);
  addOne(HOKAS_UNARMED_GIFT_WEAPON);
  return next;
}

/** Hokas notices an unarmed adventurer and offers cast-off gear (once per life arc; resets on death). */
function tryHokasUnarmedPity(
  newState: WorldState,
  currentRoom: Room | null,
  p: PlayerState,
  opts?: { echoPrefix?: string | null }
): EngineResult | null {
  if (p.currentRoom !== "main_hall" || !currentRoom) return null;
  if (p.weapon !== "unarmed") return null;
  if (p.receivedHokasUnarmedGift) return null;

  const hokasHere = presentNPCsInRoom(currentRoom, newState).some(n => n.id === "hokas_tokas");
  if (!hokasHere) return null;

  const hokasState = newState.npcs["hokas_tokas"];
  if (!hokasState?.isAlive) return null;
  const disp = hokasState.disposition ?? "neutral";
  if (disp === "furious" || disp === "hostile") return null;

  const newInventory = grantHokasUnarmedGiftInventory(p.inventory)
    .filter(e => e.itemId !== "gray_robe"); // gown returned to barrel
  const after: WorldState = {
    ...newState,
    player: {
      ...p,
      weapon: HOKAS_UNARMED_GIFT_WEAPON,
      inventory: newInventory,
      receivedHokasUnarmedGift: true,
    },
  };

  const body =
    `Hokas is wiping a mug when you draw near. He looks up — then looks away almost at once, fixing on the bottles, the counter, the fire, anywhere but your face or your empty hands. The silver bells in his beard give one soft chime, as if embarrassed for you.\n\n` +
    `"Aye," he says to the woodgrain. "We've all stood where you stand. None of us care to name the hour."\n\n` +
    `Still without meeting your eyes, he reaches below the bar and sets out a folded pile — shirt, trousers, belt, and shoes, all ragged but whole. Beside it he lays a short sword: notched, loose in the grip, honest scrap metal.\n\n` +
    `"Not guild issue. Cast-offs from the back. Take them. Go dressed. Go armed. Come back when you have a story worth the telling."\n\n` +
    `You gratefully change into the ragged clothes and carry the sword in your belt, ready for use. The gray church gown goes into the return barrel with a shudder you do not try to suppress.`;

  return {
    responseType: "static",
    staticResponse: body,
    dynamicContext: null,
    newState: after,
    stateChanged: true,
    echoPrefix: opts?.echoPrefix ?? null,
    conversationNpcId: "hokas_tokas",
  };
}

function examinePhraseMentionsHokas(originalInput: string): boolean {
  const stripped = originalInput
    .toLowerCase()
    .replace(/look at|examine|inspect|touch|feel|study/g, "")
    .trim();
  if (!stripped) return false;
  return stripped.includes("hokas") || stripped.includes("tokas");
}


// ============================================================
// INPUT PARSING (priority order)
// ============================================================

const FIRE_IN_CAST = ["fireball", "fire ball", "flame", "ignite", "burn the hall", "set fire", "torch the"];

const HELP_TEXT = `MOVEMENT
  GO [direction]       GO NORTH
  N / S / E / W        shorthand directions

OBSERVATION
  LOOK                 quick scan of the room
  EXAMINE ROOM         thorough look, full detail
  EXAMINE [target]     EXAMINE HOKAS
  SEARCH               same as EXAMINE ROOM

INTERACTION
  READ                 read notices or signs
  GET [item]           GET SWORD
  GET ALL              take everything visible
  DROP [item]          DROP SWORD
  EQUIP [item]         EQUIP LONG SWORD
  REMOVE [slot]        REMOVE SHIELD, REMOVE HELMET, REMOVE ARMOR
  UNEQUIP [item]       UNEQUIP BUCKLER

COMBAT
  ATTACK [enemy]       ATTACK GOBLIN
  STRIKE [zone]        STRIKE HEAD, STRIKE NECK, STRIKE TORSO, STRIKE LIMBS
  FLEE                 escape through a random exit
  BEG [name]           BEG SAM, BEG HOKAS

SPEECH
  SAY [text]           SAY Hello everyone!
  TELL [name] [text]   TELL HOKAS What news?
  TELL Aldric [topic]  survival, combat, training, skills, adventures, world, magic, secrets

MAGIC
  CAST [spell]         CAST HEAL
  INVOKE [ritual]      occult — discovered through play
  PRAY [TO deity]      divine — discovered through play

INVENTORY & STATS
  INVENTORY / I        show what you carry
  STATS                character sheet
  HEALTH / HP          health and active effects

ECONOMY
  SHOP                 show merchant wares
  BUY [item]           BUY SHORT SWORD
  SELL [item]          SELL DAGGER
  DEPOSIT [amount]   DEPOSIT 20  (must be in the Guild Bank)
  WITHDRAW [amount]  WITHDRAW 10

TRAINING (Main Hall, Aldric the Veteran)
  TRAIN [skill]      Tiered cost/gain by current skill (Basic→Master); see TRAIN with no args

ADVENTURES
  ENTER [adventure]  ENTER THE MIRRORS OF TUZUN THUNE

META
  LOOK               Describe your current location
  HELP               Show this command list`;

function tokenize(input: string): string[] {
  return input.trim().split(/\s+/).filter(Boolean);
}

function parseTellTarget(
  rest: string,
  room: Room,
  state: WorldState
): { npcId: string; displayName: string; firstName: string; message: string } | null {
  const lower = rest.toLowerCase();
  const candidates = presentNPCsInRoom(room, state).sort((a, b) => b.name.length - a.name.length);
  for (const n of candidates) {
    const full = n.name.toLowerCase();
    if (lower.startsWith(full + " ") || lower === full) {
      const message = rest.slice(n.name.length).trim();
      return { npcId: n.id, displayName: n.name, firstName: n.firstName, message };
    }
    const fw = n.firstName.toLowerCase();
    if (lower.startsWith(fw + " ") || lower === fw) {
      const message = rest.slice(n.firstName.length).trim();
      return { npcId: n.id, displayName: n.name, firstName: n.firstName, message };
    }
  }
  return null;
}

function matchInventoryDrop(inputLower: string, player: PlayerState): string | null {
  let best: { id: string; len: number } | null = null;
  for (const entry of player.inventory) {
    const it = ITEMS[entry.itemId];
    if (!it) continue;
    const nl = it.name.toLowerCase();
    if (nl.includes(inputLower) || inputLower.includes(nl)) {
      const len = nl.length;
      if (!best || len > best.len) best = { id: entry.itemId, len };
    }
  }
  return best?.id ?? null;
}

function matchWeaponFromPhrase(phraseLower: string, player: PlayerState): string | null {
  let best: { id: string; len: number } | null = null;
  for (const entry of player.inventory) {
    if (entry.quantity <= 0) continue;
    const it = ITEMS[entry.itemId];
    if (!it || it.type !== "weapon") continue;
    const nl = it.name.toLowerCase();
    if (nl.includes(phraseLower) || phraseLower.includes(nl)) {
      const len = nl.length;
      if (!best || len > best.len) best = { id: entry.itemId, len };
    }
  }
  return best?.id ?? null;
}

function matchShieldFromPhrase(phraseLower: string, player: PlayerState): string | null {
  let best: { id: string; len: number } | null = null;
  for (const entry of player.inventory) {
    if (entry.quantity <= 0) continue;
    if (!isShieldSlotItem(entry.itemId)) continue;
    const it = ITEMS[entry.itemId];
    if (!it) continue;
    const nl = it.name.toLowerCase();
    if (nl.includes(phraseLower) || phraseLower.includes(nl)) {
      const len = nl.length;
      if (!best || len > best.len) best = { id: entry.itemId, len };
    }
  }
  return best?.id ?? null;
}

/** Map BodyZone to the PlayerState field that holds the equipped item id. */
const ZONE_TO_PLAYER_FIELD: Record<BodyZone, "helmet" | "gorget" | "bodyArmor" | "limbArmor"> = {
  head: "helmet",
  neck: "gorget",
  torso: "bodyArmor",
  limbs: "limbArmor",
};

/** Human-readable zone slot name for narration. */
const ZONE_SLOT_LABEL: Record<BodyZone, string> = {
  head: "head",
  neck: "neck",
  torso: "body",
  limbs: "limbs",
};

function matchArmorFromPhrase(phraseLower: string, player: PlayerState, filterZone?: BodyZone): string | null {
  let best: { id: string; len: number } | null = null;
  for (const entry of player.inventory) {
    if (entry.quantity <= 0) continue;
    if (!isBodyArmorSlotItem(entry.itemId)) continue;
    const it = ITEMS[entry.itemId];
    if (!it) continue;
    if (filterZone && it.stats?.zoneSlot !== filterZone) continue;
    const nl = it.name.toLowerCase();
    if (nl.includes(phraseLower) || phraseLower.includes(nl)) {
      const len = nl.length;
      if (!best || len > best.len) best = { id: entry.itemId, len };
    }
  }
  return best?.id ?? null;
}

/** Zone-specific equip: EQUIP HELMET [item], EQUIP GORGET [item], EQUIP GREAVES [item]. */
function runEquipZoneArmor(state: WorldState, phraseLower: string, zone: BodyZone, slotLabel: string): EngineResult {
  const p = state.player;
  if (!phraseLower.trim()) {
    // No argument — list available items for this zone
    const available = p.inventory
      .filter(e => e.quantity > 0 && isBodyArmorSlotItem(e.itemId))
      .map(e => ITEMS[e.itemId])
      .filter((it): it is NonNullable<typeof it> => Boolean(it?.stats?.zoneSlot === zone));
    if (available.length === 0) {
      return {
        responseType: "static",
        staticResponse: `Thou hast no ${slotLabel} armor in thy pack.`,
        dynamicContext: null,
        newState: state,
        stateChanged: false,
      };
    }
    const list = available.map(it => it.name).join(", ");
    return {
      responseType: "static",
      staticResponse: `Available ${slotLabel} armor: ${list}`,
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }
  const itemId = matchArmorFromPhrase(phraseLower, p, zone);
  if (!itemId) {
    return {
      responseType: "static",
      staticResponse: `Thou dost not carry ${slotLabel} armor by that name.`,
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }
  // Delegate to the main equip function (it already handles zone routing)
  return runEquipArmor(state, ITEMS[itemId]!.name.toLowerCase());
}

function runWieldWeapon(state: WorldState, phraseLower: string): EngineResult {
  const p = state.player;
  if (!phraseLower.trim()) {
    return {
      responseType: "static",
      staticResponse: "Equip what?",
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }
  const itemId = matchWeaponFromPhrase(phraseLower, p);
  if (!itemId) {
    return {
      responseType: "static",
      staticResponse: "Thou dost not carry that weapon.",
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }
  if (isTwoHanded(itemId) && p.shield) {
    return {
      responseType: "static",
      staticResponse:
        "You cannot wield a two-handed weapon while carrying a shield. Unequip your shield first.",
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }
  const item = ITEMS[itemId]!;
  return {
    responseType: "static",
    staticResponse: `Thou wieldest the ${item.name}.`,
    dynamicContext: null,
    newState: { ...state, player: { ...p, weapon: itemId } },
    stateChanged: true,
  };
}

function runEquipShield(state: WorldState, phraseLower: string): EngineResult {
  const p = state.player;
  if (!phraseLower.trim()) {
    return {
      responseType: "static",
      staticResponse: "Equip which shield?",
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }
  if (p.weapon && isTwoHanded(p.weapon)) {
    return {
      responseType: "static",
      staticResponse:
        "Your weapon requires both hands. Sheathe it before equipping a shield.",
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }
  const itemId = matchShieldFromPhrase(phraseLower, p);
  if (!itemId) {
    return {
      responseType: "static",
      staticResponse: "Thou dost not carry that shield.",
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }
  const item = ITEMS[itemId]!;
  if (p.shield === itemId) {
    return {
      responseType: "static",
      staticResponse: `Thou art already bearing the ${item.name}.`,
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }
  return {
    responseType: "static",
    staticResponse: `Thou bearest the ${item.name}.`,
    dynamicContext: null,
    newState: { ...state, player: { ...p, shield: itemId } },
    stateChanged: true,
  };
}

function runEquipArmor(state: WorldState, phraseLower: string): EngineResult {
  const p = state.player;
  if (!phraseLower.trim()) {
    return {
      responseType: "static",
      staticResponse: "Equip which armor?",
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }
  const itemId = matchArmorFromPhrase(phraseLower, p);
  if (!itemId) {
    return {
      responseType: "static",
      staticResponse: "Thou dost not carry that armor.",
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }
  const item = ITEMS[itemId]!;
  const zone = item.stats?.zoneSlot;
  if (!zone) {
    // Legacy armor without zoneSlot — default to torso
    if (p.bodyArmor === itemId) {
      return {
        responseType: "static",
        staticResponse: `${item.name} is already equipped.`,
        dynamicContext: null,
        newState: state,
        stateChanged: false,
      };
    }
    return {
      responseType: "static",
      staticResponse: `${item.name} equipped (body armor).`,
      dynamicContext: null,
      newState: { ...state, player: { ...p, armor: itemId, bodyArmor: itemId } },
      stateChanged: true,
    };
  }

  const field = ZONE_TO_PLAYER_FIELD[zone];
  if (p[field] === itemId) {
    return {
      responseType: "static",
      staticResponse: `${item.name} is already equipped.`,
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }
  // Sync legacy armor field when equipping torso piece
  const armorSync = zone === "torso" ? { armor: itemId } : {};
  return {
    responseType: "static",
    staticResponse: `${item.name} equipped (${ZONE_SLOT_LABEL[zone]}).`,
    dynamicContext: null,
    newState: { ...state, player: { ...p, [field]: itemId, ...armorSync } },
    stateChanged: true,
  };
}

/** Bare EQUIP [item] / WIELD [item]: shield in inventory first, then body armor, then weapon. */
function runEquipItemFromPhrase(state: WorldState, phrase: string): EngineResult {
  const phraseLower = phrase.trim().toLowerCase().replace(/_/g, " ");
  if (!phraseLower) {
    return {
      responseType: "static",
      staticResponse: "Equip what?",
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }
  if (matchShieldFromPhrase(phraseLower, state.player)) {
    return runEquipShield(state, phraseLower);
  }
  if (matchArmorFromPhrase(phraseLower, state.player)) {
    return runEquipArmor(state, phraseLower);
  }
  return runWieldWeapon(state, phraseLower);
}

const SHEATHED_WEAPON = "unarmed";

function runRemoveArmor(state: WorldState): EngineResult {
  const p = state.player;
  // Collect all equipped zone armor
  const equipped: { field: string; itemId: string; label: string }[] = [];
  for (const [zone, field] of Object.entries(ZONE_TO_PLAYER_FIELD)) {
    const itemId = p[field as keyof PlayerState] as string | null;
    if (itemId) {
      const it = ITEMS[itemId];
      equipped.push({ field, itemId, label: it?.name ?? itemId });
    }
  }
  // Also check legacy armor field as fallback
  if (equipped.length === 0 && p.armor) {
    const it = ITEMS[p.armor];
    equipped.push({ field: "armor", itemId: p.armor, label: it?.name ?? p.armor });
  }

  if (equipped.length === 0) {
    return {
      responseType: "static",
      staticResponse: "Thou art not wearing armor.",
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }

  // Remove all zone armor
  const updates: Partial<PlayerState> = {
    armor: null,
    helmet: null,
    gorget: null,
    bodyArmor: null,
    limbArmor: null,
  };
  const removed = equipped.map(e => e.label).join(", ");
  return {
    responseType: "static",
    staticResponse: `Thou doffest: ${removed}.`,
    dynamicContext: null,
    newState: { ...state, player: { ...p, ...updates } },
    stateChanged: true,
  };
}

/** Remove armor from a specific body zone. */
function runRemoveZoneArmor(state: WorldState, zone: BodyZone, slotLabel: string): EngineResult {
  const p = state.player;
  const field = ZONE_TO_PLAYER_FIELD[zone];
  const itemId = p[field] as string | null;
  if (!itemId) {
    return {
      responseType: "static",
      staticResponse: `Thou art not wearing a ${slotLabel}.`,
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }
  const it = ITEMS[itemId];
  const armorSync = zone === "torso" ? { armor: null } : {};
  return {
    responseType: "static",
    staticResponse: `Thou doffest the ${it?.name ?? itemId}.`,
    dynamicContext: null,
    newState: { ...state, player: { ...p, [field]: null, ...armorSync } },
    stateChanged: true,
  };
}

function phraseMatchesEquippedItem(phraseLower: string, itemId: string): boolean {
  const it = ITEMS[itemId];
  if (!it) return false;
  const nl = it.name.toLowerCase();
  return nl.includes(phraseLower) || phraseLower.includes(nl);
}

function runUnequipByPhrase(state: WorldState, phraseLower: string): EngineResult {
  const norm = phraseLower.trim().toLowerCase().replace(/_/g, " ");
  if (!norm) {
    return {
      responseType: "static",
      staticResponse: "Unequip what?",
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }
  const p = state.player;
  if (p.shield && phraseMatchesEquippedItem(norm, p.shield)) {
    return runRemoveShield(state);
  }
  // Check all zone armor slots
  for (const [zone, field] of Object.entries(ZONE_TO_PLAYER_FIELD)) {
    const itemId = p[field as keyof PlayerState] as string | null;
    if (itemId && phraseMatchesEquippedItem(norm, itemId)) {
      const it = ITEMS[itemId];
      const armorSync = zone === "torso" ? { armor: null } : {};
      return {
        responseType: "static",
        staticResponse: `Thou doffest the ${it?.name ?? itemId}.`,
        dynamicContext: null,
        newState: { ...state, player: { ...p, [field]: null, ...armorSync } },
        stateChanged: true,
      };
    }
  }
  // Legacy armor fallback
  if (p.armor && phraseMatchesEquippedItem(norm, p.armor)) {
    const it = ITEMS[p.armor];
    return {
      responseType: "static",
      staticResponse: `Thou doffest the ${it?.name ?? p.armor}.`,
      dynamicContext: null,
      newState: { ...state, player: { ...p, armor: null, bodyArmor: null } },
      stateChanged: true,
    };
  }
  if (p.weapon && p.weapon !== "unarmed" && phraseMatchesEquippedItem(norm, p.weapon)) {
    const item = ITEMS[p.weapon]!;
    return {
      responseType: "static",
      staticResponse: `Thou sheathest the ${item.name}.`,
      dynamicContext: null,
      newState: { ...state, player: { ...p, weapon: SHEATHED_WEAPON } },
      stateChanged: true,
    };
  }
  return {
    responseType: "static",
    staticResponse: "Thou hast not equipped that.",
    dynamicContext: null,
    newState: state,
    stateChanged: false,
  };
}

function runRemoveShield(state: WorldState): EngineResult {
  const p = state.player;
  if (!p.shield) {
    return {
      responseType: "static",
      staticResponse: "Thou art not bearing a shield.",
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }
  return {
    responseType: "static",
    staticResponse: "Thou lowerest thy shield.",
    dynamicContext: null,
    newState: { ...state, player: { ...p, shield: null } },
    stateChanged: true,
  };
}

function isNoticeExamineCommand(lower: string): boolean {
  return lower === "notice" || lower === "notice board" || lower.startsWith("notice board ");
}

// ============================================================
// DIRECTION RESOLUTION
// ============================================================

const DIRECTION_MAP: Record<string, string> = {
  n: "north", north: "north",
  s: "south", south: "south",
  e: "east", east: "east",
  w: "west", west: "west",
  u: "up", up: "up",
  d: "down", down: "down",
};

/** Resolves a direction only from whole words/tokens — never substring (e.g. "stats" must not match "s" → south). */
function extractDirection(input: string): string | null {
  const words = input
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  for (const word of words) {
    const dir = directionFromSingleToken(word);
    if (dir) return dir;
  }
  return null;
}

function directionFromSingleToken(token: string): string | null {
  const t = token.toLowerCase();
  return DIRECTION_MAP[t] ?? null;
}

function extractGoDirection(input: string): string | null {
  const lower = input.toLowerCase().trim();
  const m = lower.match(/^(?:go|walk|move)\s+(\S+)/);
  if (m) return directionFromSingleToken(m[1]!);
  return null;
}

function buildExamineEngineResult(
  originalInput: string,
  newState: WorldState,
  currentRoom: Room | null,
  objectKeyHint?: string
): EngineResult {
  if (currentRoom && examinePhraseMentionsHokas(originalInput)) {
    const pit = tryHokasUnarmedPity(newState, currentRoom, newState.player);
    if (pit) return pit;
  }

  const hint =
    objectKeyHint ??
    originalInput
      .toLowerCase()
      .replace(/look at|examine|inspect|touch|feel|study/g, "")
      .trim()
      .replace(/\s+/g, "_");
  return {
    responseType: "dynamic",
    staticResponse: null,
    examineObjectKey: hint,
    dynamicContext:
      "Player wants to examine something specific: \"" +
      originalInput +
      "\"\n" +
      "Use object key for cache: " +
      hint +
      "\n" +
      "Current room: " +
      (currentRoom?.name ?? "unknown") +
      "\n" +
      "Room description for context: " +
      (currentRoom?.description ?? "") +
      "\n" +
      "Respond with a vivid, specific description of what they are examining. If they try to interact with it (touch, take, move), describe the result naturally. Keep it to 1-2 paragraphs.",
    newState,
    stateChanged: false,
  };
}

function tryResolveNameAloneExamine(
  trimmed: string,
  newState: WorldState,
  room: Room | null
): EngineResult | null {
  if (!room) return null;
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("say ") || lower.startsWith("tell ")) return null;

  if (isNoticeExamineCommand(lower)) {
    return buildExamineEngineResult("examine notice board", newState, room, "notice_board");
  }

  for (const n of presentNPCsInRoom(room, newState)) {
    if (lower === n.firstName.toLowerCase() || lower === n.name.toLowerCase()) {
      // Training dummy: return static description, don't call Jane
      const npcDef = NPCS[n.id];
      if (npcDef?.isTrainingDummy) {
        return {
          responseType: "static",
          staticResponse: npcDef.description,
          dynamicContext: null,
          newState: newState,
          stateChanged: false,
        };
      }
      if (n.id === "hokas_tokas") {
        const pit = tryHokasUnarmedPity(newState, room, newState.player);
        if (pit) return pit;
      }
      return buildExamineEngineResult(`examine ${n.name}`, newState, room, n.name.toLowerCase().replace(/\s+/g, "_"));
    }
  }

  for (const id of room.items) {
    const it = ITEMS[id];
    if (it && lower === it.name.toLowerCase()) {
      return buildExamineEngineResult(`examine ${it.name}`, newState, room, it.name.toLowerCase().replace(/\s+/g, "_"));
    }
  }

  for (const ex of room.examinableObjects ?? []) {
    if (lower === ex.label.toLowerCase() || lower === ex.id.replace(/_/g, " ")) {
      return buildExamineEngineResult(`examine ${ex.label}`, newState, room, ex.id);
    }
  }

  return null;
}

function runBanking(
  input: string,
  newState: WorldState,
  player: PlayerState
): EngineResult {
  if (player.currentRoom !== "guild_vault") {
    return {
      responseType: "static",
      staticResponse: "The Guild Bank is below the Main Hall. Head down to bank your gold.",
      dynamicContext: null,
      newState,
      stateChanged: false,
    };
  }

  const lower = input.toLowerCase();
  const amountMatch = input.match(/\d+/);
  const amount = amountMatch ? parseInt(amountMatch[0]!, 10) : 0;

  if (lower.includes("deposit") && amount > 0) {
    if (amount > player.gold) {
      return {
        responseType: "static",
        staticResponse: `You don't have ${amount} gold to deposit. You carry only ${player.gold}.`,
        dynamicContext: null,
        newState,
        stateChanged: false,
        conversationNpcId: "brunt_the_banker",
      };
    }
    let s = updatePlayerGold(newState, -amount);
    s = { ...s, player: { ...s.player, bankedGold: s.player.bankedGold + amount } };
    return {
      responseType: "static",
      staticResponse: `Brunt records the deposit without looking up. ${amount} gold secured. Carried: ${s.player.gold} gp. Banked: ${s.player.bankedGold} gp.`,
      dynamicContext: null,
      newState: s,
      stateChanged: true,
      conversationNpcId: "brunt_the_banker",
    };
  }

  if (lower.includes("withdraw") && amount > 0) {
    if (amount > player.bankedGold) {
      return {
        responseType: "static",
        staticResponse: `You only have ${player.bankedGold} gold banked.`,
        dynamicContext: null,
        newState,
        stateChanged: false,
        conversationNpcId: "brunt_the_banker",
      };
    }
    let s = updatePlayerGold(newState, amount);
    s = { ...s, player: { ...s.player, bankedGold: s.player.bankedGold - amount } };
    return {
      responseType: "static",
      staticResponse: `Brunt counts out ${amount} gold coins and slides them across the counter. Carried: ${s.player.gold} gp. Banked: ${s.player.bankedGold} gp.`,
      dynamicContext: null,
      newState: s,
      stateChanged: true,
      conversationNpcId: "brunt_the_banker",
    };
  }

  return {
    responseType: "static",
    staticResponse: `Brunt looks up. "Deposit or withdraw. State the amount."\n\n__CMD:DEPOSIT__ __CMD:WITHDRAW__`,
    dynamicContext: null,
    newState,
    stateChanged: false,
    conversationNpcId: "brunt_the_banker",
  };
}

function runTakeItem(
  lowerInput: string,
  newState: WorldState,
  currentRoom: Room | null
): EngineResult {
  if (!currentRoom) {
    return {
      responseType: "static",
      staticResponse: "Thou dost not see that here.",
      dynamicContext: null,
      newState,
      stateChanged: false,
    };
  }

  const itemInRoom = currentRoom.items.find(id => {
    const item = ITEMS[id];
    return item && lowerInput.includes(item.name.toLowerCase());
  });

  if (!itemInRoom) {
    return {
      responseType: "static",
      staticResponse: "Thou dost not see that here.",
      dynamicContext: null,
      newState,
      stateChanged: false,
    };
  }

  const item = ITEMS[itemInRoom];
  if (!item?.isCarryable) {
    return {
      responseType: "static",
      staticResponse: `${item?.name ?? "That"} cannot be carried.`,
      dynamicContext: null,
      newState,
      stateChanged: false,
    };
  }

  const existingEntry = newState.player.inventory.find(e => e.itemId === itemInRoom);
  const newInventory = existingEntry
    ? newState.player.inventory.map(e =>
        e.itemId === itemInRoom ? { ...e, quantity: e.quantity + 1 } : e
      )
    : [...newState.player.inventory, { itemId: itemInRoom, quantity: 1 }];

  const s = { ...newState, player: { ...newState.player, inventory: newInventory } };

  return {
    responseType: "static",
    staticResponse: `Thou dost take the ${item.name}. ${item.description}`,
    dynamicContext: null,
    newState: s,
    stateChanged: true,
  };
}

function getRoom(roomId: string): Room | null {
  return MAIN_HALL_ROOMS[roomId] ?? null;
}

// ============================================================
// COMBAT ENGINE (fully static — no API)
// ============================================================

function rollDice(notation: string): number {
  // Parses "1d6", "1d8+2", "2d4+1" etc.
  const match = notation.match(/(\d+)d(\d+)([+-]\d+)?/);
  if (!match) return 1;
  const num = parseInt(match[1]);
  const sides = parseInt(match[2]);
  const mod = match[3] ? parseInt(match[3]) : 0;
  let total = mod;
  for (let i = 0; i < num; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return Math.max(1, total);
}

function pickTemplate(templates: string[]): string {
  return templates[Math.floor(Math.random() * templates.length)];
}

const SHIRT_VARIANTS = [
  "moth_eaten_woolen_shirt",
  "threadbare_linen_shirt",
  "stained_canvas_tunic",
] as const;

const PANTS_VARIANTS = [
  "homespun_pants",
  "patched_wool_breeches",
  "rough_canvas_trousers",
] as const;

const SHOES_VARIANTS = ["cloth_shoes", "worn_leather_sandals", "mismatched_boots"] as const;

const BELT_VARIANTS = [
  "worn_leather_belt",
  "fraying_rope_belt",
  "cracked_hide_strap",
] as const;

const ALL_CLOTHING_IDS: string[] = [
  ...SHIRT_VARIANTS,
  ...PANTS_VARIANTS,
  ...SHOES_VARIANTS,
  ...BELT_VARIANTS,
];

function isClothingItem(itemId: string): boolean {
  return ALL_CLOTHING_IDS.includes(itemId);
}

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomClothingSet(): {
  shirt: string;
  pants: string;
  shoes: string;
  belt: string;
} {
  return {
    shirt: randomFrom(SHIRT_VARIANTS),
    pants: randomFrom(PANTS_VARIANTS),
    shoes: randomFrom(SHOES_VARIANTS),
    belt: randomFrom(BELT_VARIANTS),
  };
}

function revealCharityBarrelContents(state: WorldState): WorldState {
  const clothingSet = randomClothingSet();
  return revealItemsInRoom(state, "main_hall", "charity_barrel", [
    clothingSet.shirt,
    clothingSet.pants,
    clothingSet.shoes,
    clothingSet.belt,
  ]);
}

function mainHallBarrelExaminePhrase(s: string): boolean {
  const l = s.toLowerCase();
  return (
    l.includes("barrel") ||
    l.includes("clothes for") ||
    l.includes("charity") ||
    l.includes("gown") ||
    l.includes("used gown")
  );
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? key);
}

function matchAldricTopic(message: string): string | null {
  const m = message.trim().toLowerCase().replace(/^the\s+/, "");
  const keys = Object.keys(ALDRIC_TOPIC_RESPONSES).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (m === k || m.startsWith(k + " ") || m.startsWith(k + ",")) return k;
  }
  if (m.startsWith("order")) return "order";
  return null;
}

const TRAIN_TIERS = [
  { cost: 25, gain: 5, maxSkill: 20, label: "Basic" },
  { cost: 100, gain: 10, maxSkill: 50, label: "Journeyman" },
  { cost: 300, gain: 15, maxSkill: 100, label: "Advanced" },
  { cost: 750, gain: 20, maxSkill: 200, label: "Master" },
] as const;

const TRAIN_PHRASE_TO_SKILL: { phrase: string; skill: keyof WeaponSkills }[] = [
  { phrase: "swordsmanship", skill: "swordsmanship" },
  { phrase: "sword", skill: "swordsmanship" },
  { phrase: "armor expertise", skill: "armor_expertise" },
  { phrase: "armor", skill: "armor_expertise" },
  { phrase: "shield expertise", skill: "shield_expertise" },
  { phrase: "shield", skill: "shield_expertise" },
  { phrase: "stealth", skill: "stealth" },
  { phrase: "lockpicking", skill: "lockpicking" },
  { phrase: "magery", skill: "magery" },
];

function resolveTrainTargetSkill(raw: string): keyof WeaponSkills | null {
  const m = raw.trim().toLowerCase();
  if (!m) return null;
  const sorted = [...TRAIN_PHRASE_TO_SKILL].sort((a, b) => b.phrase.length - a.phrase.length);
  for (const { phrase, skill } of sorted) {
    if (m === phrase || m.startsWith(phrase + " ")) return skill;
  }
  return null;
}

// ============================================================
// STATIC RESPONSE BUILDERS
// ============================================================

type Verbosity = "verbose" | "semiverbose" | "nonverbose";

function buildRoomDescription(
  state: WorldState,
  roomId: string,
  verbosity: Verbosity = "semiverbose"
): string {
  const room = getRoom(roomId);
  if (!room) return "You find yourself in a place that defies description.";

  const roomState = state.rooms[roomId];
  const currentRoomState = roomState?.currentState ?? "normal";

  let description = "";

  // State-modified rooms always show full description (state changes are notable)
  if (currentRoomState !== "normal" && room.stateModifiers[currentRoomState]) {
    description = room.stateModifiers[currentRoomState]!.description;
  } else if (verbosity === "nonverbose" && room.glance) {
    description = room.glance;
  } else if (verbosity === "semiverbose" && room.look) {
    description = room.look;
  } else {
    // Verbose, or fallback when look/glance not defined
    description = room.description;
  }

  // NPCs present — always shown (needed for orientation)
  const presentNpcs = room.npcs
    .map(id => state.npcs[id])
    .filter(npc => npc?.isAlive && npc.location === roomId);

  if (presentNpcs.length > 0) {
    if (verbosity === "nonverbose") {
      const npcNames = presentNpcs.map(npc => NPCS[npc.npcId]?.name ?? npc.npcId).join(", ");
      description += `\n\n${npcNames}.`;
    } else {
      const npcNames = presentNpcs.map(npc => NPCS[npc.npcId]?.name ?? npc.npcId).join(", ");
      description += `\n\nPresent here: ${npcNames}.`;
    }
  }

  // Exits — always shown
  const exitList = Object.keys(room.exits).join(", ");
  description += `\n\nExits: ${exitList}.`;

  // Robe humiliation — only on semiverbose and verbose (skip nonverbose)
  if (verbosity !== "nonverbose") {
    const player = state.player;
    const hasRobe =
      player.inventory?.some(e => e.itemId === "gray_robe") || false;
    if (hasRobe) {
      const pool =
        roomId === "guild_courtyard"
          ? COURTYARD_ROBE_HUMILIATION
          : ROOM_ROBE_HUMILIATION;
      description += "\n\n" + pickTemplate(pool);
    }
  }

  return description;
}

export function buildCourtyardDescription(
  state: WorldState,
  weatherLine: string,
  timeOfDay: TimeOfDay
): string {
  // Base room description comes from gameData.ts
  // We only add the live weather line here
  const room = MAIN_HALL_ROOMS["guild_courtyard"];
  const baseDesc = room?.description ?? "";

  let description = baseDesc + "\n\n" + weatherLine;

  description += "\n\nExits: west (Church of Perpetual Life), east (Main Hall), north (Sam's Sharps).";

  const hasRobe =
    state.player.inventory?.some(
      e => e.itemId === "gray_robe"
    ) ?? false;
  if (hasRobe) {
    description += "\n\n" + pickTemplate(COURTYARD_ROBE_HUMILIATION);
  }

  return description;
}

function buildInventoryDescription(player: PlayerState): string {
  if (player.inventory.length === 0) {
    return "Thou carriest nothing but thy wits — and those are looking thin.";
  }
  // Build set of all equipped zone armor item ids
  const equippedZoneArmor = new Set<string>();
  for (const field of Object.values(ZONE_TO_PLAYER_FIELD)) {
    const itemId = player[field] as string | null;
    if (itemId) equippedZoneArmor.add(itemId);
  }

  const lines = player.inventory.map(entry => {
    const item = ITEMS[entry.itemId];
    const name = item?.name ?? entry.itemId;
    const glanceNote = item?.glance ? ` — ${item.glance}` : "";
    const qty = ` (x${entry.quantity})`;

    const statBits: string[] = [];
    if (item?.type === "weapon") {
      const dmg = WEAPON_DATA[entry.itemId]?.damage ?? item.stats?.damage;
      if (dmg) statBits.push(`[dmg: ${dmg}]`);
      if (isTwoHanded(entry.itemId)) statBits.push("[2H]");
    } else if (item?.type === "armor") {
      if (item.stats?.zoneCover != null) {
        statBits.push(`[${item.stats.zoneSlot ?? "body"}: ${item.stats.zoneCover}% cover]`);
      } else if (item.stats?.shieldBlockChance != null) {
        statBits.push(`[block: ${item.stats.shieldBlockChance}%]`);
      } else {
        const ac = item.stats?.armorClass;
        if (ac != null) statBits.push(`[AC: ${ac}]`);
      }
    }
    const statStr = statBits.length > 0 ? ` ${statBits.join(" ")}` : "";

    const equipTags: string[] = [];
    if (entry.itemId === player.weapon) equipTags.push("(wielded)");
    if (entry.itemId === player.shield) equipTags.push("(shield equipped)");
    if (equippedZoneArmor.has(entry.itemId)) equipTags.push("(worn)");
    const tagStr = equipTags.length > 0 ? ` ${equipTags.join(" ")}` : "";

    return `- ${name}${glanceNote}${qty}${statStr}${tagStr}`;
  });
  return `Thou dost carry:\n${lines.join("\n")}\n\nGold on hand: ${player.gold} gp\nBanked gold: ${player.bankedGold} gp`;
}

// ── HEALTH command pools ──────────────────────────────────────────────────

const HEALTH_FULL = [
  "You are whole. Nothing hurts. Nothing protests. Unremarkably alive.",
  "The body reports no complaints. You are intact — which, in this line of work, counts for something.",
  "Full health. No wounds. The kind of morning that won't last.",
  "You could take a hit. Maybe two. You are as right as you're going to get.",
  "Nothing broken. Nothing bleeding. The account is square.",
];

const HEALTH_FINE = [
  "Minor wear. A bruise here, a stiffness there. Nothing that slows you down.",
  "You've taken some rough edges but the important parts are holding.",
  "Scratched but functional. You've been worse and you'll be worse again.",
  "The body isn't singing, but it's walking. That's enough for now.",
  "A little tender in places. Nothing worth reporting to anyone.",
];

const HEALTH_WOUNDED = [
  "You are wounded. Not dying — not yet — but something in you is leaking.",
  "The body is keeping score. You've taken real damage. Time to be careful.",
  "Half-gone. Hits are starting to mean something. Mind the next one.",
  "You hurt. Not in a philosophical way — in a practical, this-could-end-you way.",
  "Wounded and feeling it. The smart play is to find a way to heal before this gets worse.",
];

const HEALTH_BADLY = [
  "You are badly wounded. One bad round and this is over.",
  "The body is running low. Whatever fight brought you here, the next one may finish the job.",
  "You're more wound than warrior right now. Tread carefully.",
  "Critical territory. The realm has taken a significant piece of you.",
  "If the Chronicle were written here, it would not be flattering. You need to heal.",
];

const HEALTH_CRITICAL = [
  "You are near death. The Church floor is closer than it has ever been.",
  "Critical. One unlucky blow ends this. The Priest is probably watching.",
  "You are hanging on by the thinnest thread the realm can spare you.",
  "The body is failing. This is the part where you run, hide, or pray.",
  "Death is not a metaphor right now. It is standing a few feet away, patient.",
];

function pickHealthLine(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildHealthDescription(player: PlayerState): string {
  const pct = player.maxHp > 0 ? player.hp / player.maxHp : 1;

  let statusLine: string;
  if (pct >= 1) {
    statusLine = pickHealthLine(HEALTH_FULL);
  } else if (pct >= 0.75) {
    statusLine = pickHealthLine(HEALTH_FINE);
  } else if (pct >= 0.5) {
    statusLine = pickHealthLine(HEALTH_WOUNDED);
  } else if (pct >= 0.25) {
    statusLine = pickHealthLine(HEALTH_BADLY);
  } else {
    statusLine = pickHealthLine(HEALTH_CRITICAL);
  }

  const hpBar = `HP: ${player.hp} / ${player.maxHp}`;

  // Active status effects (bleed, poison, broken_leg, etc.)
  const effects: string[] = (player.activeEffects ?? []).map(e => {
    const sev = ["", "minor", "moderate", "severe"][e.severity] ?? `sev ${e.severity}`;
    const dur = e.turnsRemaining === -1 ? "until cured" : `${e.turnsRemaining} turn${e.turnsRemaining === 1 ? "" : "s"} left`;
    const dmg = e.bleedPerTurn ? ` — ${e.bleedPerTurn} HP/turn` : "";
    return `${sev} ${e.type.replace(/_/g, " ")} (${e.zone})${dmg}, ${dur}`;
  });

  const effectsLine = effects.length > 0
    ? `\nEffects:\n${effects.map(e => `  ${e}`).join("\n")}`
    : "\nNo active effects.";

  return `${hpBar}\n\n${statusLine}${effectsLine}`;
}

function buildStatDescription(player: PlayerState): string {
  // PICSSI display — only show non-zero axes. Capitalize for readability.
  const virtueLines = (Object.entries(player.picssi) as Array<[keyof typeof player.picssi, number]>)
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => `  ${k.charAt(0).toUpperCase()}${k.slice(1)}: ${v > 0 ? "+" : ""}${v}`)
    .join("\n");

  // Zone armor display
  const zoneArmorLines: string[] = [];
  const zoneLabels: Record<BodyZone, string> = { head: "Head", neck: "Neck", torso: "Torso", limbs: "Limbs" };
  for (const zone of BODY_ZONES) {
    const field = ZONE_TO_PLAYER_FIELD[zone];
    const itemId = player[field] as string | null;
    if (itemId) {
      const it = ITEMS[itemId];
      const cover = it?.stats?.zoneCover ?? 0;
      const dur = it?.stats?.zoneDurability ?? 0;
      zoneArmorLines.push(`  ${zoneLabels[zone]}: ${it?.name ?? itemId} [${cover}% cover, ${dur} dur]`);
    } else {
      zoneArmorLines.push(`  ${zoneLabels[zone]}: —`);
    }
  }
  const shieldItem = player.shield ? ITEMS[player.shield] : null;
  const shieldLine = shieldItem
    ? `${shieldItem.name} [block: ${shieldItem.stats?.shieldBlockChance ?? 0}%, dur: ${shieldItem.stats?.shieldDurability ?? 0}]`
    : "None";

  const strPct = Math.round(Math.min(20, Math.max(0, ((player.strength - 10) / 40) * 100)));
  const tacPct = Math.round(Math.min(20, (player.maxMana / 50) * 20));
  const ws = normalizeWeaponSkills(player.weaponSkills);
  const wSkillKey = getWeaponSkillKey(player.weapon);
  const weaponSkillVal = ws[wSkillKey] ?? 0;
  const hitVsEnemy = 0.75 + Math.min(0.2, weaponSkillVal * 0.005);
  const hitVsAvg = Math.round(hitVsEnemy * 100);
  const wSpeed = WEAPON_DATA[player.weapon]?.weaponSpeed ?? 5;
  const dexBonus = getDexReactionBonus(player.dexterity);
  const skillTotal = (Object.keys(ws) as (keyof WeaponSkills)[]).reduce((a, k) => a + ws[k], 0);
  const skillBlock = (Object.keys(ws) as (keyof WeaponSkills)[])
    .map(k => `  ${SKILL_NAMES[k]}: ${ws[k]}`)
    .join("\n");

  return `— ${player.name} —
HP: ${player.hp} / ${player.maxHp}
Strength: ${player.strength} | Dexterity: ${player.dexterity} | Charisma: ${player.charisma}
Mana: ${player.currentMana} / ${player.maxMana}
Weapon skills (total ${skillTotal} / ${SKILL_CAP}; active weapon uses ${SKILL_NAMES[wSkillKey]} @ ${weaponSkillVal})
${skillBlock}
Gold (carried): ${player.gold} | Gold (banked): ${player.bankedGold}
Weapon: ${player.weapon === "unarmed"
    ? "Unarmed"
    : (ITEMS[player.weapon]?.name ?? player.weapon)} [spd: ${wSpeed}]
Armor:
${zoneArmorLines.join("\n")}
Shield: ${shieldLine}
─────────────────────────
Hit% vs avg enemy: ${hitVsAvg}%
STR damage bonus: +${strPct}%
Tactics bonus: +${tacPct}%
Initiative: 1d10 + ${wSpeed} (weapon) - ${dexBonus} (DEX)
Reputation: ${player.reputationLevel}${player.knownAs ? ` — known as "${player.knownAs}"` : ""}${player.bounty > 0 ? `\n⚠ Bounty on your head: ${player.bounty} gold` : ""}${virtueLines ? `\n\nVirtues:\n${virtueLines}` : ""}`;
}

function buildNPCGreeting(state: WorldState, npcId: string): string {
  const npcState = state.npcs[npcId];
  const npcData = NPCS[npcId];
  if (!npcData) return "A stranger regards you silently.";

  // Use custom greeting if set (state-based override)
  if (npcState?.customGreeting) return npcState.customGreeting;

  // Disposition modifies greeting
  const disposition = npcState?.disposition ?? "neutral";
  if (disposition === "hostile") {
    return `${npcData.name} regards you with open hostility. "Get out before I make thee."`;
  }
  if (disposition === "furious") {
    return `${npcData.name} sees you and their jaw tightens. Whatever warmth was there before is gone.`;
  }
  if (disposition === "cold") {
    return `${npcData.name} acknowledges your presence with minimal enthusiasm. "What dost thou want."`;
  }
  if (disposition === "afraid") {
    return `${npcData.name} backs away slightly as you approach.`;
  }

  return npcData.greeting;
}

/** NPCs who can trigger the name-revelation moment. */
const NAME_REVELATION_NPCS = new Set(["hokas_tokas", "sam_slicker", "old_mercenary"]);

/**
 * If the hero hasn't remembered their own name yet, and this NPC is one who
 * would say it, append the name-revelation scene and set the flag.
 * Returns { text, newState } with the revelation appended if triggered.
 */
function maybeRevealName(
  responseText: string,
  state: WorldState,
  npcId: string
): { text: string; newState: WorldState; revealed: boolean } {
  if (state.player.remembersOwnName) return { text: responseText, newState: state, revealed: false };
  if (!NAME_REVELATION_NPCS.has(npcId)) return { text: responseText, newState: state, revealed: false };

  const p = state.player;
  const npcName = NPCS[npcId]?.name ?? "They";
  const hasRobe = p.inventory.some(e => e.itemId === "gray_robe" && e.quantity > 0);

  let revelation: string;
  if (hasRobe) {
    revelation =
      `\n\n${npcName} pauses. "...${p.name}." The name lands like something dropped from a height.\n\n` +
      `You stare. "${p.name}?" The word feels strange in your mouth. Familiar, but from a long way off.\n\n` +
      `${npcName} gestures at the gray gown you're wearing. You look down. There, stitched into the hem in small neat letters: ${p.name}.\n\n` +
      `Your name. You know your name. Everything else is fog — but that, at least, is solid ground.`;
  } else {
    revelation =
      `\n\n${npcName} pauses. "...${p.name}." The name lands like something dropped from a height.\n\n` +
      `You stare. "${p.name}?" The word feels strange in your mouth. Familiar, but from a long way off.\n\n` +
      `"I know you," ${npcName} says carefully. "From before. I don't know the details — just the name, and that I've seen you around here before. Many times." A beat of silence. "You don't remember, do you."\n\n` +
      `Your name. You know your name. Everything else is fog — but that, at least, is solid ground.`;
  }

  return {
    text: responseText + revelation,
    newState: {
      ...state,
      player: { ...p, remembersOwnName: true },
    },
    revealed: true,
  };
}

// ============================================================
// SAM SLICKER STATIC SHOP (main_hall only, Tier 1)
// ============================================================

const SAM_ARMOR_KEYS = new Set<string>();

function partitionSamInventory(): {
  oneHanded: SamShopRow[];
  twoHanded: SamShopRow[];
  armor: SamShopRow[];
} {
  const oneHanded: SamShopRow[] = [];
  const twoHanded: SamShopRow[] = [];
  const armor: SamShopRow[] = [];
  for (const row of SAM_INVENTORY) {
    if (SAM_ARMOR_KEYS.has(row.key)) {
      armor.push(row);
    } else {
      const wd = WEAPON_DATA[row.key];
      if (wd?.twoHanded) twoHanded.push(row);
      else oneHanded.push(row);
    }
  }
  return { oneHanded, twoHanded, armor };
}

function formatSamShopWeaponLine(row: SamShopRow): string {
  const wd = WEAPON_DATA[row.key];
  const name = row.displayName;
  const stats = wd ? ` [${wd.skill}, ${wd.damage}]` : "";
  return `__CMD:BUY ${name.toUpperCase()}__ ${name} | ${row.price} gp${stats}`;
}

function buildSamShopListing(player: PlayerState): string {
  const { oneHanded, twoHanded, armor } = partitionSamInventory();
  const lines: string[] = [
    "╔══════════════════════════════════════╗",
    "║         SAM SLICKER'S WARES         ║",
    "╚══════════════════════════════════════╝",
    "",
    "ONE-HANDED WEAPONS",
    ...oneHanded.map(formatSamShopWeaponLine),
    "",
    "TWO-HANDED WEAPONS",
    ...twoHanded.map(formatSamShopWeaponLine),
    "",
    "ARMOR & SHIELDS",
    ...armor.map(row => {
      const name = row.displayName;
      const item = ITEMS[row.key];
      const cover = item?.stats?.zoneCover;
      const coverSeg = cover != null ? ` [${item?.stats?.zoneSlot ?? "body"}: ${cover}% cover]` : "";
      const block = item?.stats?.shieldBlockChance;
      const blockSeg = block != null ? ` [block: ${block}%]` : "";
      return `__CMD:BUY ${name.toUpperCase()}__ ${name} | ${row.price} gp${coverSeg}${blockSeg}`;
    }),
    "",
    `Your gold: ${player.gold} gp`,
  ];
  return lines.join("\n");
}

function displayNameToUnderscore(displayName: string): string {
  return displayName.toLowerCase().replace(/'/g, "").replace(/\s+/g, "_");
}

function findSamShopRow(raw: string): SamShopRow | null {
  const phrase = raw.trim();
  if (!phrase) return null;
  const qUnd = phrase.toLowerCase().replace(/\s+/g, "_").replace(/'/g, "").replace(/\./g, "");
  const qLow = phrase.toLowerCase().replace(/'/g, "");

  for (const row of SAM_INVENTORY) {
    if (row.key === qUnd) return row;
    if (displayNameToUnderscore(row.displayName) === qUnd) return row;
  }

  let best: { row: SamShopRow; score: number } | null = null;
  for (const row of SAM_INVENTORY) {
    const k = row.key;
    const d = row.displayName.toLowerCase();
    let score = 0;
    if (qUnd.length >= 2 && k.includes(qUnd)) score += 2000 + qUnd.length * 10;
    if (qUnd.length >= 3 && k.length >= 3 && qUnd.includes(k)) score += 1500 + k.length * 5;
    if (k.startsWith(qUnd)) score += 3000;
    if (qUnd.startsWith(k) && k.length >= 4) score += 2800;
    const words = qLow.split(/\s+/).filter(Boolean);
    if (words.length > 0 && words.every(w => d.includes(w))) score += 1000 + words.join("").length;
    if (score > 0 && (!best || score > best.score)) best = { row, score };
  }
  return best?.row ?? null;
}

const SAM_STARTER_OUTFIT_IDS = [
  "plain_shirt",
  "plain_trousers",
  "plain_belt",
  "plain_shoes",
] as const;

function applySamFirstPurchaseOutfit(inv: PlayerInventoryItem[]): PlayerInventoryItem[] {
  let next = inv.filter(e => e.itemId !== "gray_robe");
  for (const id of SAM_STARTER_OUTFIT_IDS) {
    const idx = next.findIndex(e => e.itemId === id);
    if (idx < 0) next = [...next, { itemId: id, quantity: 1 }];
    else
      next = next.map((e, i) =>
        i === idx ? { ...e, quantity: e.quantity + 1 } : e
      );
  }
  return next;
}

function runSamPurchase(state: WorldState, query: string): EngineResult {
  const row = findSamShopRow(query);
  if (!row) {
    return {
      responseType: "static",
      staticResponse: "Sam doesn't carry that. Type __CMD:SHOP__ to see his wares.",
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }
  const p = state.player;
  if (row.price > p.gold) {
    return {
      responseType: "static",
      staticResponse: `Thou hast insufficient gold. That'll cost ${row.price} gp and thou hast only ${p.gold} gp.`,
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }

  const afterGold = updatePlayerGold(state, -row.price);
  const pg = afterGold.player;
  const remaining = pg.gold;

  const inv = pg.inventory;
  const idx = inv.findIndex(e => e.itemId === row.key);
  const nextInv =
    idx < 0
      ? [...inv, { itemId: row.key, quantity: 1 }]
      : inv.map((e, i) => (i === idx ? { ...e, quantity: e.quantity + 1 } : e));
  let nextPlayer: PlayerState = { ...pg, inventory: nextInv };

  let outfitNote = "";
  if (!p.receivedSamStarterOutfit) {
    nextPlayer = {
      ...nextPlayer,
      inventory: applySamFirstPurchaseOutfit(nextPlayer.inventory),
      receivedSamStarterOutfit: true,
    };
    outfitNote =
      "\n\nSam mutters about guild dignity and slides a plain bundle across the counter — shirt, trousers, belt, and shoes, nothing worth bragging about. The gray robe goes into his rag bin. Thou art at least dressed like a person.";
  }

  const newState: WorldState = { ...afterGold, player: nextPlayer };

  const msg =
    `Purchased: ${row.displayName} for ${row.price} gp. (${remaining} gp remaining.)\nType EQUIP [item] to equip any weapon, shield, or armor.` +
    outfitNote;

  return {
    responseType: "static",
    staticResponse: msg,
    dynamicContext: null,
    newState,
    stateChanged: true,
  };
}

// ───────────────────────────────────────────────────────────
// Consumable use — BANDAGE, TOURNIQUET, ANTIDOTE, potions.
// Self-target by default; ally targeting via [npc] supported
// (no-op until allies/escorts have status effects).
// ───────────────────────────────────────────────────────────

function decrementInventory(
  inv: PlayerInventoryItem[],
  itemId: string
): PlayerInventoryItem[] {
  return inv
    .map(e => (e.itemId === itemId ? { ...e, quantity: e.quantity - 1 } : e))
    .filter(e => e.quantity > 0);
}

function describeRemovedEffects(removed: ActiveStatusEffect[]): string {
  if (removed.length === 0) return "";
  return removed
    .map(e => `${e.type.replace(/_/g, " ")} (${e.zone})`)
    .join(", ");
}

function runConsumable(
  state: WorldState,
  itemId: string,
  targetNpcId: string | null
): EngineResult {
  const item = ITEMS[itemId];
  if (!item) {
    return {
      responseType: "static",
      staticResponse: "That item doesn't exist.",
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }
  const p = state.player;
  const inInv = p.inventory.find(e => e.itemId === itemId && e.quantity > 0);
  if (!inInv) {
    return {
      responseType: "static",
      staticResponse: `You have no ${item.name.toLowerCase()} to use.`,
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }

  // Targeted ally case: no NPCs carry status effects yet, so always a no-op
  // (graceful — doesn't consume the item). Wired for future ally/escort use.
  if (targetNpcId) {
    const npc = NPCS[targetNpcId];
    return {
      responseType: "static",
      staticResponse: `${npc?.name ?? "They"} have no need of that.`,
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }

  // Self-target — apply the item's effect to the player.
  const effects = p.activeEffects ?? [];
  let removed: ActiveStatusEffect[] = [];
  let remaining = effects;
  let hpDelta = 0;
  let manaDelta = 0;
  let refusalMsg: string | null = null;

  switch (itemId) {
    case "bandage": {
      // Reduce 1 severity of one bleed. Does NOT cure severed_artery.
      const idx = remaining.findIndex(e => e.type === "bleed");
      if (idx < 0) {
        refusalMsg = "You have no bleeding wound to bind.";
        break;
      }
      const target = remaining[idx]!;
      if (target.severity > 1) {
        remaining = remaining.map((e, i) =>
          i === idx
            ? { ...e, severity: e.severity - 1, bleedPerTurn: Math.max(0, (e.bleedPerTurn ?? e.severity) - 1) }
            : e
        );
      } else {
        removed = [target];
        remaining = remaining.filter((_, i) => i !== idx);
      }
      break;
    }
    case "tourniquet": {
      // Removes ALL bleed AND severed_artery, regardless of severity.
      removed = remaining.filter(e => e.type === "bleed" || e.type === "severed_artery");
      if (removed.length === 0) {
        refusalMsg = "You have no bleeding wound to staunch.";
        break;
      }
      remaining = remaining.filter(e => e.type !== "bleed" && e.type !== "severed_artery");
      break;
    }
    case "antidote": {
      // Reduce 1 severity of one poison.
      const idx = remaining.findIndex(e => e.type === "poison");
      if (idx < 0) {
        refusalMsg = "You are not poisoned.";
        break;
      }
      const target = remaining[idx]!;
      if (target.severity > 1) {
        remaining = remaining.map((e, i) =>
          i === idx
            ? { ...e, severity: e.severity - 1, bleedPerTurn: Math.max(0, (e.bleedPerTurn ?? e.severity) - 1) }
            : e
        );
      } else {
        removed = [target];
        remaining = remaining.filter((_, i) => i !== idx);
      }
      break;
    }
    case "strong_antidote": {
      // Removes ALL poison.
      removed = remaining.filter(e => e.type === "poison");
      if (removed.length === 0) {
        refusalMsg = "You are not poisoned.";
        break;
      }
      remaining = remaining.filter(e => e.type !== "poison");
      break;
    }
    case "healing_potion": {
      if (p.hp >= p.maxHp) {
        refusalMsg = "Your wounds are already healed.";
        break;
      }
      hpDelta = item.stats?.healAmount ?? 15;
      break;
    }
    case "greater_healing_potion": {
      if (p.hp >= p.maxHp) {
        refusalMsg = "Your wounds are already healed.";
        break;
      }
      hpDelta = item.stats?.healAmount ?? 35;
      break;
    }
    case "mana_potion": {
      const maxMana = p.maxMana ?? 0;
      if ((p.currentMana ?? 0) >= maxMana) {
        refusalMsg = "Your mana is already full.";
        break;
      }
      manaDelta = 10;
      break;
    }
    default: {
      // stamina_brew / fatigue_brew / poisons (Painful Poison, Quick Death):
      // no effect-on-self yet. Phase B will wire dex buff and APPLY-to-blade.
      refusalMsg = `${item.name} can't be used like that yet.`;
      break;
    }
  }

  if (refusalMsg) {
    return {
      responseType: "static",
      staticResponse: refusalMsg,
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }

  // Apply changes + consume the item
  const newPlayer: PlayerState = {
    ...p,
    hp: Math.min(p.maxHp, p.hp + hpDelta),
    currentMana: Math.min(p.maxMana ?? 0, (p.currentMana ?? 0) + manaDelta),
    activeEffects: remaining,
    inventory: decrementInventory(p.inventory, itemId),
  };

  const parts: string[] = [];
  if (hpDelta > 0) parts.push(`Restored ${hpDelta} HP. (${newPlayer.hp}/${newPlayer.maxHp})`);
  if (manaDelta > 0) parts.push(`Restored ${manaDelta} mana. (${newPlayer.currentMana}/${newPlayer.maxMana})`);
  if (removed.length > 0) parts.push(`Cured: ${describeRemovedEffects(removed)}.`);
  else if (effects.length !== remaining.length || effects !== remaining) {
    parts.push("The wound eases.");
  }
  parts.push(`(${item.name} consumed.)`);

  return {
    responseType: "static",
    staticResponse: parts.join("\n"),
    dynamicContext: null,
    newState: { ...state, player: newPlayer },
    stateChanged: true,
  };
}

// ───────────────────────────────────────────────────────────
// Generic merchant purchase — used by Zim, Pip, and any future
// shop that doesn't need bespoke logic. Sam still uses his own
// runSamPurchase because of the first-purchase outfit bundle.
// ───────────────────────────────────────────────────────────

function matchMerchantItem(raw: string, inventory: string[]): string | null {
  const phrase = raw.trim();
  if (!phrase) return null;
  const qUnd = phrase.toLowerCase().replace(/\s+/g, "_").replace(/'/g, "").replace(/\./g, "");
  const qLow = phrase.toLowerCase().replace(/'/g, "");

  // Exact id match or display-name → underscore match
  for (const itemId of inventory) {
    if (itemId === qUnd) return itemId;
    const item = ITEMS[itemId];
    if (item && displayNameToUnderscore(item.name) === qUnd) return itemId;
  }

  // Fuzzy (mirrors findSamShopRow scoring)
  let best: { itemId: string; score: number } | null = null;
  for (const itemId of inventory) {
    const item = ITEMS[itemId];
    if (!item) continue;
    const k = itemId;
    const d = item.name.toLowerCase();
    let score = 0;
    if (qUnd.length >= 2 && k.includes(qUnd)) score += 2000 + qUnd.length * 10;
    if (qUnd.length >= 3 && k.length >= 3 && qUnd.includes(k)) score += 1500 + k.length * 5;
    if (k.startsWith(qUnd)) score += 3000;
    if (qUnd.startsWith(k) && k.length >= 4) score += 2800;
    const words = qLow.split(/\s+/).filter(Boolean);
    if (words.length > 0 && words.every(w => d.includes(w))) score += 1000 + words.join("").length;
    if (score > 0 && (!best || score > best.score)) best = { itemId, score };
  }
  return best?.itemId ?? null;
}

function runMerchantPurchase(
  state: WorldState,
  merchantNpcId: string,
  query: string
): EngineResult {
  const npc = NPCS[merchantNpcId];
  const inventory = npc?.merchant?.inventory ?? [];
  if (!npc || inventory.length === 0) {
    return {
      responseType: "static",
      staticResponse: "Nothing for sale here.",
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }

  const itemId = matchMerchantItem(query, inventory);
  if (!itemId) {
    return {
      responseType: "static",
      staticResponse: `${npc.name} doesn't carry that. Type __CMD:SHOP__ to see the wares.`,
      dynamicContext: null,
      newState: state,
      stateChanged: false,
      conversationNpcId: merchantNpcId,
    };
  }

  const item = ITEMS[itemId];
  if (!item) {
    return {
      responseType: "static",
      staticResponse: "That item doesn't exist.",
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }

  const price = item.value ?? 0;
  const p = state.player;
  if (price > p.gold) {
    return {
      responseType: "static",
      staticResponse: `Insufficient gold. ${item.name} costs ${price} gp; thou hast only ${p.gold} gp.`,
      dynamicContext: null,
      newState: state,
      stateChanged: false,
      conversationNpcId: merchantNpcId,
    };
  }

  const afterGold = updatePlayerGold(state, -price);
  const pg = afterGold.player;
  const inv = pg.inventory;
  const idx = inv.findIndex(e => e.itemId === itemId);
  const nextInv =
    idx < 0
      ? [...inv, { itemId, quantity: 1 }]
      : inv.map((e, i) => (i === idx ? { ...e, quantity: e.quantity + 1 } : e));
  const nextPlayer: PlayerState = { ...pg, inventory: nextInv };
  const newState: WorldState = { ...afterGold, player: nextPlayer };

  return {
    responseType: "static",
    staticResponse: `Purchased: ${item.name} for ${price} gp. (${nextPlayer.gold} gp remaining.)`,
    dynamicContext: null,
    newState,
    stateChanged: true,
    conversationNpcId: merchantNpcId,
  };
}

// ───────────────────────────────────────────────────────────
// Universal SELL — every merchant buys at half price.
// Floor(value/2), minimum 1 gp. Skips equipped items and
// non-carryable items. Items with value <= 0 are refused.
// ───────────────────────────────────────────────────────────

const ROOM_MERCHANT_ID: Record<string, string> = {
  main_hall: "sam_slicker",
  sams_sharps: "sam_slicker",
  armory: "armory_attendant",
  mage_school: "zim_the_wizard",
};

function isItemEquipped(player: PlayerState, itemId: string): boolean {
  return (
    player.weapon === itemId ||
    player.shield === itemId ||
    player.helmet === itemId ||
    player.gorget === itemId ||
    player.bodyArmor === itemId ||
    player.limbArmor === itemId ||
    player.boots === itemId ||
    player.ringLeft === itemId ||
    player.ringRight === itemId ||
    player.cuffLeft === itemId ||
    player.cuffRight === itemId ||
    player.necklace === itemId
  );
}

function matchPlayerInventoryItem(
  raw: string,
  inventory: PlayerInventoryItem[]
): string | null {
  const phrase = raw.trim();
  if (!phrase) return null;
  const qUnd = phrase.toLowerCase().replace(/\s+/g, "_").replace(/'/g, "").replace(/\./g, "");
  const qLow = phrase.toLowerCase().replace(/'/g, "");

  // Exact id or display-name → underscore
  for (const entry of inventory) {
    if (entry.itemId === qUnd) return entry.itemId;
    const item = ITEMS[entry.itemId];
    if (item && displayNameToUnderscore(item.name) === qUnd) return entry.itemId;
  }

  // Fuzzy
  let best: { itemId: string; score: number } | null = null;
  for (const entry of inventory) {
    const item = ITEMS[entry.itemId];
    if (!item) continue;
    const k = entry.itemId;
    const d = item.name.toLowerCase();
    let score = 0;
    if (qUnd.length >= 2 && k.includes(qUnd)) score += 2000 + qUnd.length * 10;
    if (qUnd.length >= 3 && k.length >= 3 && qUnd.includes(k)) score += 1500 + k.length * 5;
    if (k.startsWith(qUnd)) score += 3000;
    if (qUnd.startsWith(k) && k.length >= 4) score += 2800;
    const words = qLow.split(/\s+/).filter(Boolean);
    if (words.length > 0 && words.every(w => d.includes(w))) score += 1000 + words.join("").length;
    if (score > 0 && (!best || score > best.score)) best = { itemId: entry.itemId, score };
  }
  return best?.itemId ?? null;
}

function buildSellListing(player: PlayerState, merchantName: string): string {
  const sellable = player.inventory
    .map(e => ({ entry: e, item: ITEMS[e.itemId] }))
    .filter(({ item }) => item && item.isCarryable && (item.value ?? 0) > 0);

  if (sellable.length === 0) {
    return `${merchantName} looks over your inventory. "Nothing here I'd pay for."`;
  }

  const lines = [
    "╔══════════════════════════════════════╗",
    `║   ${merchantName.toUpperCase().padEnd(34)} ║`,
    "║   Buying at half price.              ║",
    "╚══════════════════════════════════════╝",
    "",
    ...sellable.map(({ entry, item }) => {
      const halfPrice = Math.max(1, Math.floor((item!.value ?? 0) / 2));
      const equipped = isItemEquipped(player, entry.itemId) ? " (equipped — UNEQUIP first)" : "";
      const qty = entry.quantity > 1 ? ` x${entry.quantity}` : "";
      return `__CMD:SELL ${item!.name.toUpperCase()}__ ${item!.name}${qty} | ${halfPrice} gp${equipped}`;
    }),
    "",
    `Your gold: ${player.gold} gp`,
  ];
  return lines.join("\n");
}

function runMerchantSell(
  state: WorldState,
  merchantNpcId: string,
  query: string
): EngineResult {
  const npc = NPCS[merchantNpcId];
  if (!npc) {
    return {
      responseType: "static",
      staticResponse: "There is no merchant here.",
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }

  const p = state.player;
  if (!query) {
    return {
      responseType: "static",
      staticResponse: buildSellListing(p, npc.name),
      dynamicContext: null,
      newState: state,
      stateChanged: false,
      conversationNpcId: merchantNpcId,
    };
  }

  // Support bulk sell: SELL ITEM1, ITEM2, ITEM3 or SELL ITEM1 ITEM2 ITEM3
  const itemNames = query.split(/[,\s]+/).filter(s => s.trim());
  const itemIds: string[] = [];

  for (const name of itemNames) {
    const itemId = matchPlayerInventoryItem(name, p.inventory);
    if (!itemId) {
      return {
        responseType: "static",
        staticResponse: `You have no "${name}" to sell.`,
        dynamicContext: null,
        newState: state,
        stateChanged: false,
        conversationNpcId: merchantNpcId,
      };
    }
    itemIds.push(itemId);
  }

  // Validate all items
  let totalGold = 0;
  for (const itemId of itemIds) {
    const item = ITEMS[itemId];
    if (!item) {
      return {
        responseType: "static",
        staticResponse: "One of those items doesn't exist.",
        dynamicContext: null,
        newState: state,
        stateChanged: false,
      };
    }

    if (!item.isCarryable || (item.value ?? 0) <= 0) {
      return {
        responseType: "static",
        staticResponse: `${npc.name} shrugs. "${item.name}? Worthless to me."`,
        dynamicContext: null,
        newState: state,
        stateChanged: false,
        conversationNpcId: merchantNpcId,
      };
    }

    if (isItemEquipped(p, itemId)) {
      return {
        responseType: "static",
        staticResponse: `You can't sell ${item.name} while it's equipped. UNEQUIP it first.`,
        dynamicContext: null,
        newState: state,
        stateChanged: false,
        conversationNpcId: merchantNpcId,
      };
    }

    const halfPrice = Math.max(1, Math.floor((item.value ?? 0) / 2));
    totalGold += halfPrice;
  }

  // Process all sales
  let newState = updatePlayerGold(state, totalGold);
  const pg = newState.player;
  let nextInv = pg.inventory;
  for (const itemId of itemIds) {
    nextInv = decrementInventory(nextInv, itemId);
    newState = addToVendorTempStock(newState, merchantNpcId, itemId);
  }
  const nextPlayer: PlayerState = { ...pg, inventory: nextInv };
  newState = { ...newState, player: nextPlayer };

  const itemList = itemIds.map(id => ITEMS[id]!.name).join(", ");
  return {
    responseType: "static",
    staticResponse: `${npc.name} hands over ${totalGold} gp for ${itemList}. (${nextPlayer.gold} gp total.) You can buy these items back for 72 hours.`,
    dynamicContext: null,
    newState,
    stateChanged: true,
    conversationNpcId: merchantNpcId,
  };
}

function samShopWrongRoomResult(state: WorldState): EngineResult {
  return {
    responseType: "static",
    staticResponse: "Sam keeps his wares at Sam's Sharps, north from the courtyard. Go there to browse or buy.",
    dynamicContext: null,
    newState: state,
    stateChanged: false,
  };
}

// ============================================================
// MAIN ENGINE — PROCESS PLAYER INPUT
// ============================================================

/**
 * Core engine pipeline. Wrapped by `processInput` (below) to add the
 * KARMA Sprint 4 atom dispatch — pendingAtom intercept (resolves a
 * presented choice) + post-process trigger emission (presents a new
 * atom when an enter-room or talk-to-npc event matches the library).
 *
 * Direct callers should always use `processInput`; `processInputCore`
 * is internal and skips atom dispatch.
 */
function processInputCore(
  input: string,
  state: WorldState
): EngineResult {
  let newState = tickWorldState(state);
  if (!newState.player.weaponSkills) {
    newState = {
      ...newState,
      player: {
        ...newState.player,
        weaponSkills: normalizeWeaponSkills(undefined),
      },
    };
  }
  if (!newState.player.knownSpells) {
    newState = {
      ...newState,
      player: {
        ...newState.player,
        knownSpells: [],
        knownDeities: newState.player.knownDeities ?? [],
      },
    };
  }
  const p = newState.player;
  const currentRoom = getRoom(p.currentRoom);
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();
  const tokens = tokenize(trimmed);
  const first = tokens[0]?.toUpperCase() ?? "";

  const audienceNames =
    currentRoom?.npcs
      .map(id => newState.npcs[id])
      .filter((n): n is NPCStateEntry => Boolean(n?.isAlive && n.location === p.currentRoom))
      .map(n => NPCS[n.npcId]?.name ?? n.npcId)
      .join(", ") || "none";

  // ── Combat-mode guard: only combat commands allowed while in combat ──
  const COMBAT_ALLOWED_COMMANDS = new Set(["STRIKE", "FLEE", "HEALTH", "HELP", "CAST"]);
  if (p.activeCombat && !COMBAT_ALLOWED_COMMANDS.has(first)) {
    const enemy = p.activeCombat.enemyName;
    return {
      responseType: "static",
      staticResponse: `You are locked in combat with ${enemy}! STRIKE HEAD · STRIKE NECK · STRIKE TORSO · STRIKE LIMBS — or FLEE.`,
      dynamicContext: null,
      newState,
      stateChanged: false,
    };
  }

  // ── KARMA Sprint 3: pending Scroll-of-Thoth riddle ────────
  // The player's previous READ opened a riddle gate. Their next
  // input — whatever it is — is taken as the answer. HELP and HEALTH
  // are still passes (let the player check their state mid-riddle).
  const RIDDLE_BYPASS = new Set(["HELP", "HEALTH"]);
  if (p.pendingRiddle && !RIDDLE_BYPASS.has(first)) {
    const result = answerPendingRiddle(newState, trimmed);
    return {
      responseType: "static",
      staticResponse: result.narrative,
      dynamicContext: null,
      newState: result.state,
      stateChanged: true,
    };
  }

  // ── KARMA Sprint 3: activity dispatcher ───────────────────
  // REST / PRAY (in temples) / DRINK / BROTHEL / BATHE / DONATE /
  // MORTIFY consume actionBudget, restore stamina, apply PICSSI
  // deltas. PRAY in non-temple rooms falls through to the dynamic
  // Jane handler below. DRINK in non-tavern rooms ditto.
  const activityId = matchActivity(first, p.currentRoom);
  if (activityId) {
    const result = applyActivity(newState, activityId);
    if (!result.rejected) {
      return {
        responseType: "static",
        staticResponse: result.narrative,
        dynamicContext: null,
        newState: result.state,
        stateChanged: true,
      };
    }
    // For activities that REQUIRE a specific room (BROTHEL/BATHE/DONATE/
    // MORTIFY), surface the rejection. PRAY/DRINK fall through to the
    // existing dynamic handlers when the room isn't a match.
    if (activityId !== "pray" && activityId !== "drink") {
      return {
        responseType: "static",
        staticResponse: result.narrative,
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
  }

  if (
    p.currentRoom === "church_of_perpetual_life" &&
    (first === "ASK" || first === "SPEAK")
  ) {
    return {
      responseType: "static",
      staticResponse: pickTemplate(PRIEST_SILENCE_RESPONSES),
      dynamicContext: null,
      newState,
      stateChanged: false,
    };
  }

  // ── 1. PREFIX: TALK → quest dialogue resolver runs FIRST (Sprint 8c) ─
  // Quest-bound NPCs opt into stage-aware dialogue via
  // `registerQuestDialogue` in their quest line module. When the NPC
  // is registered, the resolver owns the response (lines or fallback);
  // when not registered, we fall through to the legacy paths below.
  if (first === "TALK") {
    const questNpcId = npcIdFromTalk(trimmed, newState);
    if (questNpcId) {
      const resolved = resolveQuestDialogue(newState, questNpcId);
      if (resolved) {
        return {
          responseType: "static",
          staticResponse: resolved.lines.join("\n"),
          dynamicContext: null,
          newState: resolved.state,
          stateChanged: resolved.state !== newState,
          conversationNpcId: questNpcId,
        };
      }
    }
  }

  // ── 1. PREFIX: TALK → Aldric topic list (before SAY alias) ─
  if (first === "TALK") {
    const talkRest = trimmed.slice(4).trim().toLowerCase().replace(/^to\s+/, "");
    const isAldric =
      talkRest.startsWith("aldric") ||
      talkRest.startsWith("veteran") ||
      talkRest === "old mercenary";
    if (
      isAldric &&
      p.currentRoom === "main_hall" &&
      newState.npcs["old_mercenary"]?.isAlive
    ) {
      return {
        responseType: "static",
        staticResponse: pickTemplate(ALDRIC_OPENING_LINES),
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
  }

  // ── 1. PREFIX: SAY / TALK (alias) ──────────────────────
  if (first === "SAY" || first === "TALK") {
    const text = trimmed.slice(first.length).trim();
    if (!text) {
      return {
        responseType: "static",
        staticResponse: "Say what?",
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    if (p.currentRoom === "church_of_perpetual_life") {
      return {
        responseType: "static",
        staticResponse: pickTemplate(PRIEST_SILENCE_RESPONSES),
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    const quoted = text.replace(/^["']|["']$/g, "");
    const echo = `You say, "${quoted}"`;
    return {
      responseType: "dynamic",
      staticResponse: null,
      echoPrefix: echo,
      dynamicContext: `MUD SAY (room speech). ${p.name} said aloud to everyone present: "${quoted}"
Current room: ${currentRoom?.name ?? "unknown"}
Room state: ${newState.rooms[p.currentRoom]?.currentState ?? "normal"}
All NPCs in the room hear this — they are the audience: ${audienceNames}
${p.inventory.some(e => e.itemId === "gray_robe")
  ? "The player is wearing a gray backless church robe and has nothing else. NPCs who notice should mention the charity barrel near the south wall naturally, without dwelling on it.\n\n"
  : ""}React with in-character replies from any NPCs who would naturally respond, ambient room color, and consequences. Use Universal Common for NPC dialogue.`,
      newState,
      stateChanged: false,
    };
  }

  // ── 1. PREFIX: TELL ────────────────────────────────────
  if (first === "TELL") {
    if (!currentRoom) {
      return {
        responseType: "static",
        staticResponse: "There is no one to tell.",
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    if (p.currentRoom === "church_of_perpetual_life") {
      return {
        responseType: "static",
        staticResponse: pickTemplate(PRIEST_SILENCE_RESPONSES),
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    const after = trimmed.slice(4).trim();
    const parsed = parseTellTarget(after, currentRoom, newState);
    if (!parsed) {
      return {
        responseType: "static",
        staticResponse: "Tell whom, and what? Example: TELL HOKAS What news?",
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }

    if (parsed.npcId === "old_mercenary") {
      const topicMsg = parsed.message.trim();
      if (!topicMsg) {
        return {
          responseType: "static",
          staticResponse: pickTemplate(ALDRIC_OPENING_LINES),
          dynamicContext: null,
          newState,
          stateChanged: false,
          conversationNpcId: "old_mercenary",
        };
      }
      const topic = matchAldricTopic(topicMsg);
      if (topic && ALDRIC_TOPIC_RESPONSES[topic]) {
        return {
          responseType: "static",
          staticResponse: pickTemplate(ALDRIC_TOPIC_RESPONSES[topic]!),
          dynamicContext: null,
          newState,
          stateChanged: false,
          conversationNpcId: "old_mercenary",
        };
      }
      return {
        responseType: "static",
        staticResponse:
          `Aldric raises an eyebrow. "Try one of the words I actually listed."\n\n` +
          `survival · combat · training · skills · adventures · world · magic · secrets · order`,
        dynamicContext: null,
        newState,
        stateChanged: false,
        conversationNpcId: "old_mercenary",
      };
    }

    if (!parsed.message.trim()) {
      return {
        responseType: "static",
        staticResponse: "Tell whom, and what? Example: TELL HOKAS What news?",
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    const npcData = NPCS[parsed.npcId];
    const npcState = newState.npcs[parsed.npcId];
    const quoted = parsed.message.replace(/^["']|["']$/g, "");
    const echo = `You tell ${parsed.firstName}, "${quoted}"`;
    if (parsed.npcId === "hokas_tokas") {
      const pit = tryHokasUnarmedPity(newState, currentRoom, p, { echoPrefix: echo });
      if (pit) return pit;
    }
    return {
      responseType: "dynamic",
      staticResponse: null,
      echoPrefix: echo,
      dynamicContext: `MUD TELL (private directed speech). ${p.name} speaks privately to ${npcData?.name ?? parsed.npcId}: "${quoted}"
Only this NPC should meaningfully respond; others may notice tone but do not interject unless it would be unavoidable.
NPC personality: ${npcData?.personality ?? ""}
Disposition: ${npcState?.disposition ?? "neutral"}
Memory: ${npcState?.memory.map(m => m.action).join(", ") || "none"}
Agenda: ${npcState?.agenda?.description ?? "none"}
Room: ${currentRoom.name} (${newState.rooms[p.currentRoom]?.currentState ?? "normal"})
${p.inventory.some(e => e.itemId === "gray_robe")
  ? "The player is wearing a gray backless church robe and has nothing else. NPCs who notice should mention the charity barrel near the south wall naturally, without dwelling on it.\n\n"
  : ""}Respond primarily in character as ${npcData?.name}. Universal Common for dialogue.`,
      newState,
      stateChanged: false,
      conversationNpcId: parsed.npcId,
    };
  }

  // ── 1. PREFIX: TRAIN (Aldric, Main Hall) ────────────────
  if (first === "TRAIN") {
    const rest = trimmed.slice(5).trim();
    if (p.currentRoom !== "main_hall") {
      return {
        responseType: "static",
        staticResponse:
          "Aldric only gives formal lessons where he keeps his usual table. Find him in the Main Hall.",
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    const merc = newState.npcs["old_mercenary"];
    if (!merc?.isAlive || merc.location !== "main_hall") {
      return {
        responseType: "static",
        staticResponse: "Aldric isn't here to train you right now.",
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    if (!rest) {
      const ws = normalizeWeaponSkills(p.weaponSkills);
      const wsTotal = (Object.keys(ws) as (keyof WeaponSkills)[]).reduce((a, k) => a + ws[k], 0);
      return {
        responseType: "static",
        staticResponse:
          `Training costs depend on your current skill level:\n` +
          `  0–19:    25 gp  (+5,  Basic)\n` +
          `  20–49:  100 gp  (+10, Journeyman)\n` +
          `  50–99:  300 gp  (+15, Advanced)\n` +
          `  100–199: 750 gp  (+20, Master)\n` +
          `  200+:   Nothing left to teach.\n\n` +
          `Your current skills:\n` +
          `  Swordsmanship:  ${ws.swordsmanship}\n\n` +
          `Total: ${wsTotal} / ${SKILL_CAP}\n\n` +
          `Example: TRAIN SWORDSMANSHIP, TRAIN ARMOR, TRAIN SHIELD, TRAIN STEALTH, TRAIN LOCKPICKING, TRAIN MAGERY.`,
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    const skillKey = resolveTrainTargetSkill(rest);
    if (!skillKey) {
      return {
        responseType: "static",
        staticResponse:
          `Aldric shakes his head. "I don't teach that under that name. Try swordsmanship, armor, shield, stealth, lockpicking, or magery."`,
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    const currentSkill = normalizeWeaponSkills(p.weaponSkills)[skillKey] ?? 0;
    const tier = TRAIN_TIERS.find(t => currentSkill < t.maxSkill) ?? null;
    if (!tier) {
      return {
        responseType: "static",
        staticResponse:
          `Aldric shakes his head. "I've taught you everything ` +
          `I know about ${SKILL_NAMES[skillKey]}. You ` +
          `need to find someone better than me. They exist."`,
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    if (p.gold < tier.cost) {
      return {
        responseType: "static",
        staticResponse:
          `Aldric looks at you levelly. "This tier costs ` +
          `${tier.cost} gold. You have ${p.gold}. Come back ` +
          `when you can afford it."`,
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    let trained = updatePlayerGold(newState, -tier.cost);
    const skillUp = updateWeaponSkill(trained, skillKey, tier.gain);
    trained = skillUp.newState;
    const finalSkill = normalizeWeaponSkills(trained.player.weaponSkills)[skillKey] ?? 0;
    let msg =
      `You train with Aldric.\n\n` +
      `*${SKILL_NAMES[skillKey]} +${tier.gain} (${tier.label} training). ` +
      `Now: ${finalSkill}. Cost: ${tier.cost} gp.*`;
    if (skillUp.degradedSkill) {
      msg += `\n\nYour ${SKILL_NAMES[skillUp.degradedSkill]} slips a point — total skill cannot exceed ${SKILL_CAP}.`;
    }
    return {
      responseType: "static",
      staticResponse: msg,
      dynamicContext: null,
      newState: trained,
      stateChanged: true,
    };
  }

  // ── 1. PREFIX: INVOKE — Sorcery dispatch (KARMA Sprint 7a) ──
  // Routes to lib/sorcery/invoke.ts. Recognized spells go through
  // the structured Circle/mana/reagent gate; unknown invocations
  // fall through to Jane for atmospheric fizzle narration (preserves
  // SORCERY.md §3 — Words of Power must be discovered in-game).
  if (first === "INVOKE") {
    const rest = trimmed.slice(6).trim();
    const result = handleInvoke(newState, rest);

    if (
      result.outcome.kind === "unrecognized" ||
      result.outcome.kind === "fizzle-no-reagents"
    ) {
      return {
        responseType: "dynamic",
        staticResponse: null,
        dynamicContext: `Occult / forbidden INVOKE attempt: "${rest || "(unspecified)"}"
Room: ${currentRoom?.name}. State: ${newState.rooms[p.currentRoom]?.currentState ?? "normal"}.
The player invoked unknown Words of Power. Describe a fizzle — nothing happens, a faint sulfur stench, perhaps something noticed nearby. Tension without effect.`,
        newState,
        stateChanged: false,
      };
    }

    return {
      responseType: "static",
      staticResponse: composeInvokeResponse(result.outcome),
      dynamicContext: null,
      newState: result.state,
      stateChanged: result.outcome.kind === "success",
    };
  }

  // ── 1. PREFIX: PRAY ────────────────────────────────────
  if (first === "PRAY") {
    const rest = trimmed.slice(4).trim();
    return {
      responseType: "dynamic",
      staticResponse: null,
      dynamicContext: `Divine PRAY: "${rest}"
Player known deities (may be empty): ${p.knownDeities.join(", ") || "none discovered yet"}
Room: ${currentRoom?.name}. Handle as quiet, sacred communication; hints at faith virtues if appropriate.`,
      newState,
      stateChanged: false,
    };
  }

  // ── 1. PREFIX: CAST ────────────────────────────────────
  if (first === "CAST") {
    const rest = trimmed.slice(4).trim().toLowerCase();
    if (FIRE_IN_CAST.some(f => rest.includes(f))) {
      const targetRoom = p.currentRoom;
      const roomData = getRoom(targetRoom);
      const currentRoomState = newState.rooms[targetRoom]?.currentState;

      if (currentRoomState === "burnt") {
        return {
          responseType: "static",
          staticResponse: "The room is already burnt. There is nothing more to set alight.",
          dynamicContext: null,
          newState,
          stateChanged: false,
        };
      }

      newState = applyFireballConsequences(newState, targetRoom, p.id);
      return {
        responseType: "dynamic",
        staticResponse: null,
        dynamicContext: `The player just cast a fireball in ${roomData?.name ?? targetRoom}. 
The room is now burnt. Hokas Tokas is furious and has sent for the Sheriff. 
A 50-gold bounty has been placed on the player. 
Describe the immediate chaos vividly — fire, screaming adventurers, Hokas's fury, smoke filling the hall. 
Then have Hokas deliver his ultimatum in Universal Common: pay 50 gold, work off the debt by fetching timber from the Darkwood, or face the Sheriff.
This is a severe virtue moment — Honor is at stake.`,
        newState,
        stateChanged: true,
      };
    }

    const spellName = rest.toUpperCase();
    const known = p.knownSpells?.length ? p.knownSpells.join(", ") : "none";

    // No argument or no spells known — same response
    if (!spellName || !p.knownSpells?.length) {
      return {
        responseType: "static",
        staticResponse: `Cast what? Your known spells: ${known}.`,
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }

    // Player knows spells but not this one
    if (!p.knownSpells.includes(spellName)) {
      return {
        responseType: "static",
        staticResponse: `You haven't learned ${spellName}. Your known spells: ${known}.`,
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }

    // ── Combat spell: deterministic resolver ──
    // Heal / Blast / Speed / Power are mechanical. Mana cost, damage rolls,
    // status effects, and the Power random-outcome table all live in
    // combatEngine.resolveCombatSpell. The enemy gets their swing afterward,
    // identical to a STRIKE round.
    if (p.activeCombat && isCombatSpell(spellName)) {
      const result = resolveCombatSpell(newState, spellName);
      if (result) {
        return {
          responseType: "static",
          staticResponse: result.combatOver
            ? result.narration + "\n__COMBAT_END__"
            : result.narration,
          dynamicContext: null,
          newState: result.newState,
          stateChanged: true,
        };
      }
    }

    return {
      responseType: "dynamic",
      staticResponse: null,
      dynamicContext: `Official CAST magic: "${trimmed}"
Current room: ${currentRoom?.name}. Room state: ${newState.rooms[p.currentRoom]?.currentState ?? "normal"}.
Known spells: ${p.knownSpells.join(", ")}.
Resolve as standard guild magic (BLAST, HEAL, SPEED, LIGHT) when matched; otherwise describe failure or ask to clarify.`,
      newState,
      stateChanged: false,
    };
  }

  // ── 2. STANDARD COMMANDS ─────────────────────────────
  if (first === "HELP" || lower === "help") {
    return {
      responseType: "static",
      staticResponse: HELP_TEXT,
      dynamicContext: null,
      newState,
      stateChanged: false,
    };
  }

  if (first === "STATS" || first === "STAT") {
    return {
      responseType: "static",
      staticResponse: buildStatDescription(p),
      dynamicContext: null,
      newState,
      stateChanged: false,
    };
  }

  if (first === "HEALTH" || first === "HP" || first === "HEALTH CHECK") {
    return {
      responseType: "static",
      staticResponse: buildHealthDescription(p),
      dynamicContext: null,
      newState,
      stateChanged: false,
    };
  }

  if (first === "INVENTORY" || first === "I" || first === "INV") {
    return {
      responseType: "static",
      staticResponse: buildInventoryDescription(p),
      dynamicContext: null,
      newState,
      stateChanged: false,
    };
  }

  if (first === "QUESTS" || first === "QUEST") {
    const rest = trimmed.slice(first.length).trim().toUpperCase();
    const body = rest === "LOG"
      ? renderQuestLog(newState)
      : renderActiveQuests(newState);
    return {
      responseType: "static",
      staticResponse: body,
      dynamicContext: null,
      newState,
      stateChanged: false,
    };
  }

  if (first === "SHOP" || first === "SAM" || first === "LIST") {
    if (p.currentRoom === "main_hall" || p.currentRoom === "sams_sharps") {
      return {
        responseType: "static",
        staticResponse: buildSamShopListing(p),
        dynamicContext: null,
        newState,
        stateChanged: false,
        conversationNpcId: "sam_slicker",
      };
    }
    if (p.currentRoom === "armory") {
      // Trigger armory listing via BUY handler (no arg = listing)
    }
    if (p.currentRoom === "mage_school") {
      // Trigger Zim listing via BUY handler (no arg = listing)
    }
    // Generic SHOP in any shop room — fall through to BUY with no args
    if (SHOP_ROOM_NPC[p.currentRoom]) {
      return processInput("BUY", newState);
    }
    return samShopWrongRoomResult(newState);
  }

  // ── APPLY [poison] TO [weapon / BLADE / ARROWS / BOLTS] ──
  // Coats the equipped weapon with poison. Consumes the poison item.
  // Works on any weapon including bow/crossbow (text reflects arrows/bolts).
  {
    const applyMatch = trimmed.match(
      /^APPLY\s+(.+?)\s+TO\s+(WEAPON|BLADE|SWORD|AXE|MACE|BOW|CROSSBOW|ARROWS?|BOLTS?|.+)$/i
    );
    if (applyMatch) {
      const poisonPhrase = applyMatch[1]!.trim();
      // Find the poison in inventory
      const poisonId =
        poisonPhrase.toUpperCase() === "PAINFUL POISON" ? "unreliable_poison"
        : poisonPhrase.toUpperCase() === "QUICK DEATH" ? "strong_poison"
        : null;
      if (!poisonId) {
        return {
          responseType: "static",
          staticResponse: `You have no "${poisonPhrase}" to apply.`,
          dynamicContext: null,
          newState,
          stateChanged: false,
        };
      }
      const poison = ITEMS[poisonId];
      if (!poison) {
        return {
          responseType: "static",
          staticResponse: `That poison doesn't exist.`,
          dynamicContext: null,
          newState,
          stateChanged: false,
        };
      }
      const inInv = p.inventory.find(e => e.itemId === poisonId && e.quantity > 0);
      if (!inInv) {
        return {
          responseType: "static",
          staticResponse: `You have no ${poison.name} to apply.`,
          dynamicContext: null,
          newState,
          stateChanged: false,
        };
      }
      if (p.weapon === "unarmed") {
        return {
          responseType: "static",
          staticResponse: "You need to equip a weapon first.",
          dynamicContext: null,
          newState,
          stateChanged: false,
        };
      }

      const severity = poison.stats?.poisonSeverity ?? 1;
      const charges = poison.stats?.poisonCharges ?? 3;
      const weaponItem = ITEMS[p.weapon];
      const weaponName = weaponItem?.name ?? p.weapon;

      const surfaceText = "blade";

      const nextInv = p.inventory
        .map(e => (e.itemId === poisonId ? { ...e, quantity: e.quantity - 1 } : e))
        .filter(e => e.quantity > 0);

      const updatedState: WorldState = {
        ...newState,
        player: {
          ...p,
          inventory: nextInv,
          weaponPoisonCharges: charges,
          weaponPoisonSeverity: severity,
        },
      };

      return {
        responseType: "static",
        staticResponse:
          `You carefully coat the ${surfaceText} of your ${weaponName} with ${poison.name}. ` +
          `${charges} poisoned strikes remain. (${poison.name} consumed.)`,
        dynamicContext: null,
        newState: updatedState,
        stateChanged: true,
      };
    }
  }

  // ── Consumables: BANDAGE / TOURNIQUET / ANTIDOTE / potions ──
  // Bare verbs and USE [item] [ON [npc]] forms. Targets default to self.
  // Resolved before the chest USE handler so they claim those verbs first.
  {
    const trimUpper = trimmed.toUpperCase();
    // Verb prefix → item id. Order matters: longer matches first.
    const consumableVerbs: [string, string][] = [
      ["USE STRONG ANTIDOTE", "strong_antidote"],
      ["USE GREATER HEALING POTION", "greater_healing_potion"],
      ["USE HEALING POTION", "healing_potion"],
      ["USE MANA POTION", "mana_potion"],
      ["USE NIMBLE TOES", "stamina_brew"],
      ["USE SILENT SHADOW", "fatigue_brew"],
      ["USE PAINFUL POISON", "unreliable_poison"],
      ["USE QUICK DEATH", "strong_poison"],
      ["USE BANDAGE", "bandage"],
      ["USE TOURNIQUET", "tourniquet"],
      ["USE ANTIDOTE", "antidote"],
      ["BANDAGE", "bandage"],
      ["TOURNIQUET", "tourniquet"],
      ["ANTIDOTE", "antidote"],
    ];
    let consumableId: string | null = null;
    let restAfterVerb = "";
    for (const [verb, id] of consumableVerbs) {
      if (trimUpper === verb || trimUpper.startsWith(verb + " ")) {
        consumableId = id;
        restAfterVerb = trimmed.slice(verb.length).trim();
        break;
      }
    }
    if (consumableId) {
      // Parse target: "ON [name]" or bare "[name]" both supported.
      let targetNpcId: string | null = null;
      let targetParseFailed = false;
      const onMatch = restAfterVerb.match(/^on\s+(.+)$/i);
      const targetText = onMatch ? onMatch[1].trim() : restAfterVerb;
      if (targetText) {
        const room = getRoom(p.currentRoom);
        const targetLower = targetText.toLowerCase();
        const matchedNpcId = room?.npcs.find(npcId => {
          const npc = NPCS[npcId];
          return npc && npc.name.toLowerCase().includes(targetLower);
        });
        if (matchedNpcId) {
          targetNpcId = matchedNpcId;
        } else {
          targetParseFailed = true;
        }
      }
      if (targetParseFailed) {
        return {
          responseType: "static",
          staticResponse: `There is no "${targetText}" here.`,
          dynamicContext: null,
          newState,
          stateChanged: false,
        };
      }
      return runConsumable(newState, consumableId, targetNpcId);
    }
  }

  // ── USE KEY / UNLOCK CHEST / OPEN CHEST ──
  if (first === "USE" || first === "UNLOCK" || first === "OPEN") {
    const rest = lower.replace(/^(use|unlock|open)\s+/, "").trim();
    const isChestAction = rest.includes("key") || rest.includes("chest") || rest.includes("locker");
    if (isChestAction && p.currentRoom === "main_hall") {
      const hasKey = p.inventory.some(e => e.itemId === "notice_board_key" && e.quantity > 0);
      if (!hasKey) {
        return {
          responseType: "static",
          staticResponse: "The iron chests along the wall are locked. Each bears a different personal lock. You would need a key.",
          dynamicContext: null,
          newState,
          stateChanged: false,
        };
      }
      // Check if already opened (note already in inventory)
      const alreadyOpened = p.inventory.some(e => e.itemId === "members_note" && e.quantity > 0);
      if (alreadyOpened) {
        return {
          responseType: "static",
          staticResponse: "You have already opened the chest that matches your key. It is empty now.",
          dynamicContext: null,
          newState,
          stateChanged: false,
        };
      }
      // Open the chest — grant 10 gold, short sword, and the note
      let afterOpen = updatePlayerGold(newState, 10);
      const hasShortSword = afterOpen.player.inventory.some(e => e.itemId === "short_sword");
      const newInv = [
        ...afterOpen.player.inventory,
        ...(!hasShortSword ? [{ itemId: "short_sword", quantity: 1 }] : []),
        { itemId: "members_note", quantity: 1 },
      ];
      afterOpen = {
        ...afterOpen,
        player: { ...afterOpen.player, inventory: newInv },
      };
      return {
        responseType: "static",
        staticResponse:
          `You try the Guild Member's Key on the iron chests along the wall. The third one clicks open.\n\n` +
          `Inside: 10 gold coins, a short sword in reasonable condition, and a folded scrap of parchment.\n\n` +
          `You take everything.\n\n` +
          `The note reads, in hastily scrawled ink:\n\n` +
          `"String of bad luck lately. Bank is empty. My friends have all disappeared. I'm going to fight that bastard Ishmael again and try to find out what he did to everyone to make them forget everything. Apologies to YOU, future me, if I failed."`,
        dynamicContext: null,
        newState: afterOpen,
        stateChanged: true,
      };
    }
  }

  if (first === "READ") {
    if (p.currentRoom === "notice_board") {
      return {
        responseType: "static",
        staticResponse: buildRoomDescription(newState, "notice_board", "verbose"),
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    // KARMA Sprint 3 — Scrolls of Thoth. The argument can be a number
    // ("READ 1"), a roman numeral ("READ III"), an id ("READ thoth-1"),
    // or any unique substring of the title. Carrying the scroll in
    // inventory is not yet required (player gets free reads in the hub
    // for now; later a "scroll item" system will gate this).
    const readArg = trimmed.slice(4).trim();
    if (readArg && /scroll|thoth|\d|^[ivx]+$/i.test(readArg)) {
      const scroll = findScroll(readArg.replace(/^scroll\s+/i, ""));
      if (scroll) {
        const result = readScroll(newState, scroll.id);
        return {
          responseType: "static",
          staticResponse: result.narrative,
          dynamicContext: null,
          newState: result.state,
          stateChanged: true,
        };
      }
    }
    return {
      responseType: "dynamic",
      staticResponse: null,
      dynamicContext: `Player wants to READ something. Input: "${trimmed}".
Room: ${currentRoom?.name ?? "unknown"}.
Describe what they find to read, or tell them there is nothing to read here.`,
      newState,
      stateChanged: false,
    };
  }

  if (first === "LOOK") {
    const rest = trimmed.slice(4).trim().toLowerCase();
    if (!rest || rest === "around" || rest === "room") {
      return {
        responseType: "static",
        staticResponse: buildRoomDescription(newState, p.currentRoom, "semiverbose"),
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    if (rest.startsWith("at ")) {
      const targetPhrase = trimmed.slice(trimmed.toLowerCase().indexOf("at ") + 3).trim();
      if (
        p.currentRoom === "main_hall" &&
        mainHallBarrelExaminePhrase(targetPhrase.toLowerCase())
      ) {
        const barrelState = revealCharityBarrelContents(newState);
        return {
          responseType: "static",
          staticResponse: pickTemplate(BARREL_EXAMINE_DESCRIPTIONS),
          dynamicContext: null,
          newState: barrelState,
          stateChanged: true,
        };
      }
      return buildExamineEngineResult(`look at ${targetPhrase}`, newState, currentRoom);
    }
    if (p.currentRoom === "main_hall" && mainHallBarrelExaminePhrase(rest)) {
      const barrelState = revealCharityBarrelContents(newState);
      return {
        responseType: "static",
        staticResponse: pickTemplate(BARREL_EXAMINE_DESCRIPTIONS),
        dynamicContext: null,
        newState: barrelState,
        stateChanged: true,
      };
    }
    return buildExamineEngineResult(trimmed, newState, currentRoom);
  }

  if (first === "SEARCH") {
    const searchBody = trimmed.slice(6).trim().toLowerCase();
    if (!searchBody || searchBody === "room" || searchBody === "around" || searchBody === "area") {
      return {
        responseType: "static",
        staticResponse: buildRoomDescription(newState, p.currentRoom, "verbose"),
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    // SEARCH [target] = same as EXAMINE [target], fall through below
  }

  if (first === "EXAMINE" || first === "EX" || first === "SEARCH") {
    const body = trimmed.replace(/^(examine|ex|search)\s+/i, "").trim();
    if (!body) {
      return {
        responseType: "static",
        staticResponse: "Examine what?",
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    const bl = body.toLowerCase();
    // EXAMINE ROOM / EXAMINE AROUND = verbose room description
    if (bl === "room" || bl === "around" || bl === "area" || bl === "surroundings") {
      return {
        responseType: "static",
        staticResponse: buildRoomDescription(newState, p.currentRoom, "verbose"),
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    if (isNoticeExamineCommand(bl)) {
      return buildExamineEngineResult(`examine notice board`, newState, currentRoom, "notice_board");
    }
    if (p.currentRoom === "main_hall" && mainHallBarrelExaminePhrase(bl)) {
      const barrelState = revealCharityBarrelContents(newState);
      return {
        responseType: "static",
        staticResponse: pickTemplate(BARREL_EXAMINE_DESCRIPTIONS),
        dynamicContext: null,
        newState: barrelState,
        stateChanged: true,
      };
    }
    return buildExamineEngineResult(`examine ${body}`, newState, currentRoom);
  }

  if (first === "GO" || first === "WALK" || first === "MOVE") {
    const dir = extractGoDirection(trimmed) ?? extractDirection(trimmed);
    if (!dir || !currentRoom) {
      return {
        responseType: "static",
        staticResponse: "Which way wouldst thou go? (north, south, east, west, up, down)",
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    const destinationId = currentRoom.exits[dir];
    if (!destinationId) {
      return {
        responseType: "static",
        staticResponse: `There is no passage to the ${dir} from here.`,
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    const alreadyVisited = newState.player.visitedRooms.includes(destinationId);
    newState = movePlayer(newState, destinationId);
    const roomDesc = buildRoomDescription(newState, destinationId, alreadyVisited ? "nonverbose" : "semiverbose");
    let roomGreeting = SHOP_ROOM_GREETINGS[destinationId] ?? "";
    // Brunt gets a dynamic greeting based on banked gold
    if (destinationId === "guild_vault") {
      const tier = getBruntTier(newState.player.bankedGold);
      const pool = BRUNT_GREETINGS[tier] ?? BRUNT_GREETINGS.poor;
      roomGreeting = pickTemplate(pool) + `\n\n__CMD:DEPOSIT__ __CMD:WITHDRAW__`;
    }
    return {
      responseType: "static",
      staticResponse: roomGreeting ? roomDesc + "\n\n" + roomGreeting : roomDesc,
      dynamicContext: null,
      newState,
      stateChanged: true,
      conversationNpcId: SHOP_ROOM_NPC[destinationId] ?? null,
    };
  }

  if (first === "GET" || first === "TAKE" || first === "GRAB") {
    const isGetAll =
      /^(get|take|grab)\s+(all|everything|it all|them all)$/i.test(trimmed);

    if (isGetAll) {
      const room = MAIN_HALL_ROOMS[p.currentRoom];
      if (!room) {
        return {
          responseType: "static",
          staticResponse: "There is nothing here to take.",
          dynamicContext: null,
          newState,
          stateChanged: false,
        };
      }

      let updatedState = newState;
      const takenNames: string[] = [];

      for (const itemId of room.items) {
        const item = ITEMS[itemId];
        if (!item?.isCarryable) continue;
        if (updatedState.player.inventory.some(e => e.itemId === itemId)) continue;

        const inv = updatedState.player.inventory;
        const newInventory = [...inv, { itemId, quantity: 1 }];
        updatedState = {
          ...updatedState,
          player: { ...updatedState.player, inventory: newInventory },
        };
        takenNames.push(item.name);
      }

      const roomState = updatedState.rooms[p.currentRoom];
      const revealed = roomState?.revealedItems ?? [];

      for (const entry of revealed) {
        const item = ITEMS[entry.itemId];
        if (!item?.isCarryable) continue;
        if (updatedState.player.inventory.some(e => e.itemId === entry.itemId))
          continue;

        const newInventory = [
          ...updatedState.player.inventory,
          { itemId: entry.itemId, quantity: 1 },
        ];
        updatedState = {
          ...updatedState,
          player: {
            ...updatedState.player,
            inventory: newInventory,
          },
        };

        updatedState = removeRevealedItem(
          updatedState,
          p.currentRoom,
          entry.itemId
        );

        takenNames.push(item.name);
      }

      if (p.currentRoom === "main_hall") {
        const alreadyRevealed = (
          updatedState.rooms["main_hall"]?.revealedItems ?? []
        ).filter(r => r.containerId === "charity_barrel");

        const SHIRT_IDS = [
          "moth_eaten_woolen_shirt",
          "threadbare_linen_shirt",
          "stained_canvas_tunic",
        ];
        const PANTS_IDS = [
          "homespun_pants",
          "patched_wool_breeches",
          "rough_canvas_trousers",
        ];
        const SHOES_IDS = [
          "cloth_shoes",
          "worn_leather_sandals",
          "mismatched_boots",
        ];
        const BELT_IDS = [
          "worn_leather_belt",
          "fraying_rope_belt",
          "cracked_hide_strap",
        ];
        const allBarrelIds = [
          ...SHIRT_IDS,
          ...PANTS_IDS,
          ...SHOES_IDS,
          ...BELT_IDS,
        ];

        const alreadyHasBarrelItems =
          alreadyRevealed.length > 0 ||
          updatedState.player.inventory.some(e =>
            allBarrelIds.includes(e.itemId)
          );

        if (!alreadyHasBarrelItems) {
          const set = randomClothingSet();
          const barrelItems = [set.shirt, set.pants, set.shoes, set.belt];
          for (const itemId of barrelItems) {
            const barrelItem = ITEMS[itemId];
            if (!barrelItem) continue;
            updatedState = {
              ...updatedState,
              player: {
                ...updatedState.player,
                inventory: [
                  ...updatedState.player.inventory,
                  { itemId, quantity: 1 },
                ],
              },
            };
            takenNames.push(barrelItem.name);
          }
        }
      }

      if (takenNames.length === 0) {
        return {
          responseType: "static",
          staticResponse: "There is nothing here to take.",
          dynamicContext: null,
          newState,
          stateChanged: false,
        };
      }

      const tookShirt = updatedState.player.inventory.some(e =>
        [
          "moth_eaten_woolen_shirt",
          "threadbare_linen_shirt",
          "stained_canvas_tunic",
        ].includes(e.itemId)
      );
      const robeWasInInventoryBefore = newState.player.inventory.some(
        e => e.itemId === "gray_robe"
      );

      if (robeWasInInventoryBefore && tookShirt) {
        updatedState = {
          ...updatedState,
          player: {
            ...updatedState.player,
            inventory: updatedState.player.inventory.filter(
              e => e.itemId !== "gray_robe"
            ),
          },
        };
        const gotLine = `You take everything: ${takenNames.join(", ")}.`;
        return {
          responseType: "static",
          staticResponse:
            gotLine + "\n\n" + pickTemplate(ROBE_CEREMONY_NARRATIVES),
          dynamicContext: null,
          newState: updatedState,
          stateChanged: true,
        };
      }

      return {
        responseType: "static",
        staticResponse: `You take everything: ${takenNames.join(", ")}.`,
        dynamicContext: null,
        newState: updatedState,
        stateChanged: true,
      };
    }

    if (p.currentRoom === "main_hall") {
      const lowerRest = trimmed.slice(first.length).trim().toLowerCase();

      // ── Gowns barrel: TAKE GRAY ROBE / TAKE ROBE / TAKE GOWN ──
      // Each take = −1 Honor + chronicle. Stock-limited (default 20).
      const wantsRobe =
        /\b(gray\s*robe|grey\s*robe|robe|gown)\b/.test(lowerRest);
      if (wantsRobe) {
        const gownStock = newState.barrelStock?.gowns ?? 0;
        if (gownStock <= 0) {
          return {
            responseType: "static",
            staticResponse: "The gowns barrel is empty. The Church will refill it eventually.",
            dynamicContext: null,
            newState,
            stateChanged: false,
          };
        }
        const inv = p.inventory;
        const idx = inv.findIndex(e => e.itemId === "gray_robe");
        const nextInv =
          idx < 0
            ? [...inv, { itemId: "gray_robe", quantity: 1 }]
            : inv.map((e, i) => (i === idx ? { ...e, quantity: e.quantity + 1 } : e));

        let updatedState: WorldState = {
          ...newState,
          player: { ...newState.player, inventory: nextInv },
          barrelStock: {
            ...newState.barrelStock,
            gowns: gownStock - 1,
          },
        };
        updatedState = bumpStanding(updatedState, -1);
        updatedState = addToChronicle(
          updatedState,
          "Took a gray church robe from the gowns barrel.",
          false
        );

        return {
          responseType: "static",
          staticResponse:
            "You take a gray church robe from the barrel. It is thin, backless, and identical to every other one in there. Nobody is watching. You tell yourself that.",
          dynamicContext: null,
          newState: updatedState,
          stateChanged: true,
        };
      }

      const wantsShirt =
        lowerRest.includes("shirt") ||
        lowerRest.includes("tunic") ||
        lowerRest.includes("top") ||
        lowerRest.includes("clothes") ||
        lowerRest.includes("clothing") ||
        lowerRest.includes("everything");
      const wantsPants =
        lowerRest.includes("pant") ||
        lowerRest.includes("trouser") ||
        lowerRest.includes("breech") ||
        lowerRest.includes("clothes") ||
        lowerRest.includes("clothing") ||
        lowerRest.includes("everything");
      const wantsShoes =
        lowerRest.includes("shoe") ||
        lowerRest.includes("boot") ||
        lowerRest.includes("sandal") ||
        lowerRest.includes("footwear") ||
        lowerRest.includes("clothes") ||
        lowerRest.includes("clothing") ||
        lowerRest.includes("everything");
      const wantsBelt =
        lowerRest.includes("belt") ||
        lowerRest.includes("strap") ||
        lowerRest.includes("rope belt") ||
        lowerRest.includes("clothes") ||
        lowerRest.includes("clothing") ||
        lowerRest.includes("everything");

      const wantsAny = wantsShirt || wantsPants || wantsShoes || wantsBelt;

      if (wantsAny) {
        // Stock check — barrel has finite capacity (10 mixed pieces by default)
        const stockAvailable = newState.barrelStock?.charityClothes ?? 0;
        if (stockAvailable <= 0) {
          return {
            responseType: "static",
            staticResponse: "The charity barrel is empty. Someone got there first.",
            dynamicContext: null,
            newState,
            stateChanged: false,
          };
        }

        const alreadyRevealed = (
          newState.rooms["main_hall"]?.revealedItems ?? []
        ).filter(r => r.containerId === "charity_barrel");

        const shirtIds = SHIRT_VARIANTS as readonly string[];
        const pantsIds = PANTS_VARIANTS as readonly string[];
        const shoesIds = SHOES_VARIANTS as readonly string[];
        const beltIds = BELT_VARIANTS as readonly string[];

        const revealedShirt = alreadyRevealed.find(r =>
          shirtIds.includes(r.itemId)
        )?.itemId;
        const revealedPants = alreadyRevealed.find(r =>
          pantsIds.includes(r.itemId)
        )?.itemId;
        const revealedShoes = alreadyRevealed.find(r =>
          shoesIds.includes(r.itemId)
        )?.itemId;
        const revealedBelt = alreadyRevealed.find(r =>
          beltIds.includes(r.itemId)
        )?.itemId;

        const hasRevealedSet = Boolean(
          revealedShirt &&
            revealedPants &&
            revealedShoes &&
            revealedBelt
        );

        let clothingState = newState;
        const clothingSet = hasRevealedSet
          ? {
              shirt: revealedShirt!,
              pants: revealedPants!,
              shoes: revealedShoes!,
              belt: revealedBelt!,
            }
          : randomClothingSet();

        if (!hasRevealedSet) {
          clothingState = revealItemsInRoom(
            clothingState,
            "main_hall",
            "charity_barrel",
            [
              clothingSet.shirt,
              clothingSet.pants,
              clothingSet.shoes,
              clothingSet.belt,
            ]
          );
        }

        const gotItems: string[] = [];
        let newInventory = [...p.inventory];
        let remainingStock = stockAvailable;

        const addItem = (itemId: string) => {
          if (!isClothingItem(itemId)) return false;
          if (remainingStock <= 0) return false;
          const existing = newInventory.find(e => e.itemId === itemId);
          if (existing) {
            newInventory = newInventory.map(e =>
              e.itemId === itemId ? { ...e, quantity: e.quantity + 1 } : e
            );
          } else {
            newInventory = [...newInventory, { itemId, quantity: 1 }];
          }
          gotItems.push(ITEMS[itemId]?.name ?? itemId);
          remainingStock--;
          return true;
        };

        if (wantsShirt) addItem(clothingSet.shirt);
        if (wantsPants) addItem(clothingSet.pants);
        if (wantsShoes) addItem(clothingSet.shoes);
        if (wantsBelt) addItem(clothingSet.belt);

        const itemsTaken = gotItems.length;
        if (itemsTaken === 0) {
          return {
            responseType: "static",
            staticResponse: "The charity barrel is empty. Someone got there first.",
            dynamicContext: null,
            newState,
            stateChanged: false,
          };
        }

        let updatedState: WorldState = {
          ...clothingState,
          player: { ...clothingState.player, inventory: newInventory },
          barrelStock: {
            ...clothingState.barrelStock,
            charityClothes: remainingStock,
          },
        };

        // Standing + chronicle: −1 Standing per item taken from charity,
        // single chronicle entry summarizing the take. (Was Honor pre-2026-04-29;
        // deprecated to PICSSI Standing per the Honor → Standing rewire.)
        for (let i = 0; i < itemsTaken; i++) {
          updatedState = bumpStanding(updatedState, -1);
        }
        updatedState = addToChronicle(
          updatedState,
          `Took ${itemsTaken} charity garment${itemsTaken === 1 ? "" : "s"} from the Main Hall barrels.`,
          false
        );

        const takenIds = [
          wantsShirt ? clothingSet.shirt : null,
          wantsPants ? clothingSet.pants : null,
          wantsShoes ? clothingSet.shoes : null,
          wantsBelt ? clothingSet.belt : null,
        ].filter((id): id is string => id !== null);

        for (const id of takenIds) {
          updatedState = removeRevealedItem(
            updatedState,
            "main_hall",
            id
          );
        }

        const hasRobe = newInventory.some(e => e.itemId === "gray_robe");
        const tookShirt = wantsShirt;

        if (hasRobe && tookShirt) {
          const withoutRobe = newInventory.filter(e => e.itemId !== "gray_robe");
          updatedState = {
            ...updatedState,
            player: {
              ...updatedState.player,
              inventory: withoutRobe,
            },
          };

          const ceremonyText = pickTemplate(ROBE_CEREMONY_NARRATIVES);
          const gotLine = `You take: ${gotItems.join(", ")}.`;

          return {
            responseType: "static",
            staticResponse: gotLine + "\n\n" + ceremonyText,
            dynamicContext: null,
            newState: updatedState,
            stateChanged: true,
          };
        }

        const gotLine = `You take from the charity barrel: ${gotItems.join(", ")}.`;
        const hint = newInventory.some(e => e.itemId === "gray_robe")
          ? "\n\nThe robe will come off once you have a shirt."
          : "";

        return {
          responseType: "static",
          staticResponse: gotLine + hint,
          dynamicContext: null,
          newState: updatedState,
          stateChanged: true,
        };
      }
    }

    return runTakeItem(lower, newState, currentRoom);
  }

  if (first === "DROP") {
    const rest = trimmed.slice(4).trim().toLowerCase();
    if (!rest) {
      return {
        responseType: "static",
        staticResponse: "Drop what?",
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    const itemId = matchInventoryDrop(rest, p);
    if (!itemId) {
      return {
        responseType: "static",
        staticResponse: "Thou dost not carry that.",
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    const item = ITEMS[itemId]!;
    const entry = newState.player.inventory.find(e => e.itemId === itemId)!;
    const newQty = entry.quantity - 1;
    const newInventory =
      newQty <= 0
        ? newState.player.inventory.filter(e => e.itemId !== itemId)
        : newState.player.inventory.map(e =>
            e.itemId === itemId ? { ...e, quantity: newQty } : e
          );
    const s = { ...newState, player: { ...newState.player, inventory: newInventory } };
    return {
      responseType: "static",
      staticResponse: `Thou droppest the ${item.name}.`,
      dynamicContext: null,
      newState: s,
      stateChanged: true,
    };
  }

  if (first === "WIELD") {
    const phrase = trimmed.slice(5).trim();
    return runEquipItemFromPhrase(newState, phrase);
  }

  if (first === "EQUIP") {
    const afterEquip = trimmed.slice(5).trim();
    const afterLower = afterEquip.toLowerCase();
    if (afterLower.startsWith("shield ") || afterLower === "shield") {
      const phrase = afterEquip.slice(6).trim().toLowerCase();
      return runEquipShield(newState, phrase);
    }
    if (afterLower.startsWith("helmet ") || afterLower === "helmet") {
      const phrase = afterEquip.slice(6).trim().toLowerCase();
      return runEquipZoneArmor(newState, phrase, "head", "head");
    }
    if (afterLower.startsWith("gorget ") || afterLower === "gorget") {
      const phrase = afterEquip.slice(6).trim().toLowerCase();
      return runEquipZoneArmor(newState, phrase, "neck", "neck");
    }
    if (afterLower.startsWith("greaves ") || afterLower === "greaves") {
      const phrase = afterEquip.slice(7).trim().toLowerCase();
      return runEquipZoneArmor(newState, phrase, "limbs", "limb");
    }
    if (afterLower.startsWith("armor ") || afterLower === "armor") {
      const phrase = afterEquip.slice(5).trim().toLowerCase();
      return runEquipArmor(newState, phrase);
    }
    return runEquipItemFromPhrase(newState, afterEquip);
  }

  if (first === "SHIELD") {
    const phrase = trimmed.slice(6).trim().toLowerCase();
    return runEquipShield(newState, phrase);
  }

  if (first === "REMOVE" || first === "UNEQUIP") {
    const t1 = tokens[1]?.toLowerCase();
    if (t1 === "shield") {
      return runRemoveShield(newState);
    }
    if (t1 === "armor") {
      return runRemoveArmor(newState);
    }
    // Per-zone removal
    if (t1 === "helmet" || t1 === "helm") {
      return runRemoveZoneArmor(newState, "head", "helmet");
    }
    if (t1 === "gorget") {
      return runRemoveZoneArmor(newState, "neck", "gorget");
    }
    if (t1 === "greaves") {
      return runRemoveZoneArmor(newState, "limbs", "greaves");
    }
    const phrase = tokens.slice(1).join(" ").trim();
    if (!phrase) {
      return {
        responseType: "static",
        staticResponse:
          "Remove or unequip what? Try REMOVE SHIELD, REMOVE ARMOR, REMOVE HELMET, REMOVE GORGET, REMOVE GREAVES, or UNEQUIP [item].",
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    return runUnequipByPhrase(newState, phrase);
  }

  if (first === "FLEE") {
    if (!currentRoom) {
      return {
        responseType: "static",
        staticResponse: "There is nowhere to flee.",
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    const exits = Object.entries(currentRoom.exits);
    if (exits.length === 0) {
      return {
        responseType: "static",
        staticResponse: "There is no way out. You are trapped.",
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }

    // Check for broken_leg preventing escape
    const session = p.activeCombat;
    if (session) {
      const hasLegInjury = session.playerCombatant.activeEffects.some(
        e => e.type === "broken_leg"
      );
      if (hasLegInjury) {
        return {
          responseType: "static",
          staticResponse: "Your broken leg buckles beneath you. You cannot flee!",
          dynamicContext: null,
          newState,
          stateChanged: false,
        };
      }
    }

    const [fleeDir, fleeDest] =
      exits[Math.floor(Math.random() * exits.length)]!;
    const wasInCombat = p.activeCombat;

    newState = movePlayer(newState, fleeDest);

    // Clear combat session on flee — bleed/poison persists out of combat
    if (wasInCombat) {
      // KARMA Sprint 5: solo flee → −1 Courage, −1 Standing
      // (KARMA_SYSTEM.md §4c). Allies-abandoned + ordered-retreat
      // branches stay dormant until the ally combat system lands.
      newState = applyCombatDeltas(newState, {
        victory: false,
        enemiesKilled: 0,
        enemyCount: 1,
        fled: true,
        playerLost: false,
      }, `combat: fled ${wasInCombat.enemyName}`);
      newState = endCombatSession(newState, true);
      // Flee = no kills → breather-tier recovery (maxStamina × 0.5).
      newState = applyCombatEndRecovery(newState, 0);
      newState = emitQuestEvent(newState, {
        type: "combat-end",
        victory: false,
        enemyNpcId: wasInCombat.enemyNpcId,
        enemyTag: NPCS[wasInCombat.enemyNpcId]?.bodyType,
      });
    }

    const destRoom = getRoom(fleeDest);
    const destName = destRoom?.name ?? fleeDest.replace(/_/g, " ");
    const fleePrefix = wasInCombat
      ? `You disengage from ${wasInCombat.enemyName} and `
      : "You ";
    return {
      responseType: "static",
      staticResponse:
        `${fleePrefix}bolt for the ${fleeDir} exit, crashing into ${destName}.\n` +
        (wasInCombat ? "__COMBAT_END__\n\n" : "\n") +
        buildRoomDescription(newState, fleeDest, "nonverbose"),
      dynamicContext: null,
      newState,
      stateChanged: true,
    };
  }

  if (first === "BEG") {
    const rest = trimmed.slice(3).trim().toLowerCase();

    const isSamTarget =
      rest.includes("sam") || rest.includes("slicker");

    if (
      isSamTarget &&
      (p.currentRoom === "main_hall" || p.currentRoom === "sams_sharps") &&
      p.weapon === "unarmed"
    ) {
      const newInventory = [
        ...p.inventory,
        { itemId: "short_sword", quantity: 1 },
      ];
      let afterGift: WorldState = {
        ...newState,
        player: {
          ...newState.player,
          weapon: "short_sword",
          inventory: newInventory,
        },
      };

      let samResponse =
        `Sam looks at you for a long moment — the empty hands, the whole situation. He's seen this before.\n\n` +
        `He reaches under the counter and produces a battered short sword and sets it on the counter without ceremony.\n\n` +
        `"Don't thank me. Kill something with it and buy a better one."\n\n` +
        `You have the Short Sword. It is equipped.`;

      const reveal = maybeRevealName(samResponse, afterGift, "sam_slicker");
      samResponse = reveal.text;
      afterGift = reveal.newState;

      return {
        responseType: "static",
        staticResponse: samResponse + "\n\n" + pickTemplate(BARREL_NPC_HINTS),
        dynamicContext: null,
        newState: afterGift,
        stateChanged: true,
        conversationNpcId: "sam_slicker",
      };
    }

    const isHokasTarget =
      rest.includes("hokas") || rest.includes("tokas");

    if (
      isHokasTarget &&
      p.currentRoom === "main_hall" &&
      p.weapon === "unarmed"
    ) {
      const newInventory = [
        ...p.inventory,
        { itemId: "short_sword", quantity: 1 },
      ];
      let afterGift: WorldState = {
        ...newState,
        player: {
          ...newState.player,
          weapon: "short_sword",
          inventory: newInventory,
        },
      };

      let hokasResponse =
        `Hokas looks at you for a long moment — the empty hands,` +
        ` the general situation. Something soft and worried crosses his face, but he` +
        ` buries it fast.\n\n` +
        `He disappears behind the bar and comes back with a worn short sword in a plain` +
        ` scabbard. He sets it on the bar with a solid thunk.\n\n` +
        `"I don't need it anymore," he says. "Don't tell me what you do` +
        ` with it. Don't bring it back." He goes back to polishing a` +
        ` glass that doesn't need polishing.\n\n` +
        `You have the Short Sword. It is equipped.`;

      const reveal = maybeRevealName(hokasResponse, afterGift, "hokas_tokas");
      hokasResponse = reveal.text;
      afterGift = reveal.newState;

      return {
        responseType: "static",
        staticResponse: hokasResponse + "\n\n" + pickTemplate(BARREL_NPC_HINTS),
        dynamicContext: null,
        newState: afterGift,
        stateChanged: true,
        conversationNpcId: "hokas_tokas",
      };
    }

    if (!rest) {
      return {
        responseType: "dynamic",
        staticResponse: null,
        dynamicContext: `${p.name} attempts to beg. They are wearing a backless gray robe and are unarmed.
Room: ${currentRoom?.name ?? "unknown"}.
NPCs present: ${audienceNames}.
Describe the reaction of whoever is present. This is a low moment. Play it with dignity and a little dark humor.`,
        newState,
        stateChanged: false,
      };
    }

    return {
      responseType: "dynamic",
      staticResponse: null,
      dynamicContext: `${p.name} begs from ${rest}. They are wearing a backless gray robe and are unarmed.
Room: ${currentRoom?.name ?? "unknown"}.
NPCs present: ${audienceNames}.
Describe the NPC's reaction. This is a low moment. Play it truthfully.`,
      newState,
      stateChanged: false,
    };
  }

  // ── STRIKE [zone] — body-zone body-part targeting (active combat only) ──
  if (first === "STRIKE") {
    const session = p.activeCombat;
    if (!session) {
      return {
        responseType: "static",
        staticResponse: "Thou art not in combat. Use ATTACK [enemy] to engage a foe.",
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    const zoneArg = (tokens[1] ?? "").toLowerCase() as BodyZone;
    if (!BODY_ZONES.includes(zoneArg)) {
      return {
        responseType: "static",
        staticResponse: "Strike where? STRIKE HEAD, STRIKE NECK, STRIKE TORSO, or STRIKE LIMBS.",
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }

    // Tier 4 (Exhausted) — KARMA_SYSTEM.md §2.3 / §4a. The player
    // cannot raise their arms. Combat session stays open; FLEE still
    // works (broken_leg permitting). Recovery happens at fight-end.
    if (fatigueLevel(newState.player) === 4) {
      return {
        responseType: "static",
        staticResponse:
          "You are utterly exhausted — your arms are lead, your lungs scream. You cannot strike. FLEE, or die where you stand.",
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }

    // Refresh the player combatant's fatigue tier so this round's
    // resolveStrike sees the latest drain (penalty applies as the
    // enemy targets the hero).
    const refreshedSession: ActiveCombatSession = {
      ...session,
      playerCombatant: {
        ...session.playerCombatant,
        fatigueTier: fatigueLevel(newState.player),
      },
    };

    // Resolve one body-zone combat round
    const isDummyEnemy = NPCS[session.enemyNpcId]?.isTrainingDummy === true;
    const roundResult = resolveCombatRound(refreshedSession, zoneArg, { enemyIsTrainingDummy: isDummyEnemy });
    let narrative = buildRoundNarrative(roundResult);

    // Session combatLog is re-synced after narrative amendments below.
    let updatedSession: ActiveCombatSession = {
      ...session,
      roundNumber: roundResult.roundNumber,
      playerCombatant: roundResult.updatedPlayer,
      enemyCombatant: roundResult.updatedEnemy,
      barriers: roundResult.updatedBarriers,
      combatLog: session.combatLog, // finalized below once narrative is amended
      finished: roundResult.combatOver,
      playerWon: roundResult.combatOver ? roundResult.playerWon : null,
    };

    let finalState = newState;

    // ── Stamina drain — every swing costs by weapon weight ──
    // KARMA_SYSTEM.md §2.3. Drains regardless of hit/miss/evade
    // (the swing happened). Tier 4 was already gated above; if the
    // player crosses into Tier 4 mid-round their NEXT command will
    // see it. Non-strike rounds (e.g., feared_skip) skip the cost.
    if (roundResult.playerStrike) {
      finalState = drainPlayerStaminaForStrike(finalState, finalState.player.weapon);
    }

    // ── Weapon poison: if player landed a hit and weapon is poisoned, apply poison to enemy ──
    if (
      roundResult.playerStrike &&
      roundResult.playerStrike.damageDealt > 0 &&
      finalState.player.weaponPoisonCharges > 0
    ) {
      const sev = finalState.player.weaponPoisonSeverity;
      const poisonEffect: import("./combatTypes").ActiveStatusEffect = {
        type: "poison",
        zone: roundResult.playerStrike.targetZone,
        severity: sev,
        turnsRemaining: -1, // persists until cured
        bleedPerTurn: sev,  // 1/2/3 HP per round based on severity
      };
      const updatedEnemy: import("./combatTypes").CombatantState = {
        ...updatedSession.enemyCombatant,
        activeEffects: [...updatedSession.enemyCombatant.activeEffects, poisonEffect],
      };
      updatedSession = {
        ...updatedSession,
        enemyCombatant: updatedEnemy,
      };

      const newCharges = finalState.player.weaponPoisonCharges - 1;
      finalState = {
        ...finalState,
        player: {
          ...finalState.player,
          weaponPoisonCharges: newCharges,
          weaponPoisonSeverity: newCharges > 0 ? sev : 0,
        },
      };
    }

    // Training dummy: grant weapon skill XP per strike (capped at 25)
    const isDummy = isDummyEnemy;
    const DUMMY_SKILL_CAP = 25;
    if (isDummy && roundResult.playerStrike && roundResult.playerStrike.damageDealt > 0) {
      const weaponSkillKey = getWeaponSkillKey(finalState.player.weapon);
      const currentSkill = finalState.player.weaponSkills[weaponSkillKey] ?? 0;
      if (currentSkill < DUMMY_SKILL_CAP) {
        const skillUp = updateWeaponSkill(finalState, weaponSkillKey, 1);
        finalState = skillUp.newState;
        const newSkill = finalState.player.weaponSkills[weaponSkillKey] ?? 0;
        narrative += `\n✦ ${SKILL_NAMES[weaponSkillKey]} skill rises: ${currentSkill} → ${newSkill}`;
      } else {
        narrative += `\n(${SKILL_NAMES[weaponSkillKey]} ${currentSkill}/${DUMMY_SKILL_CAP} — dummy cap reached)`;
      }
    }

    // Finalize session combatLog with the (possibly amended) narrative
    updatedSession = {
      ...updatedSession,
      combatLog: [...session.combatLog, narrative].slice(-20),
    };

    if (roundResult.combatOver) {
      if (isDummy && roundResult.playerWon) {
        // Training dummy: reset HP, don't kill. Keep session for loot screen.
        finalState = setNPCCombatHp(finalState, session.enemyNpcId, null);
        // Dummies aren't "kills" — give the breather-tier recovery only.
        finalState = applyCombatEndRecovery(finalState, 0);
        const weaponSkillKey = getWeaponSkillKey(finalState.player.weapon);
        const skillVal = finalState.player.weaponSkills[weaponSkillKey] ?? 0;
        const capNote = skillVal >= DUMMY_SKILL_CAP
          ? `\n\nThe dummy has nothing more to teach you. Your ${SKILL_NAMES[weaponSkillKey]} has outgrown wooden targets.`
          : `\n\n${SKILL_NAMES[weaponSkillKey]}: ${skillVal}/${DUMMY_SKILL_CAP} (dummy training cap)`;
        const carriedDummyEffects = updatedSession.playerCombatant.activeEffects.map(e => ({ ...e }));
        return {
          responseType: "static",
          staticResponse: narrative + "\n\nThe dummy splinters apart — but someone will patch it back together by morning." + capNote + "\n__COMBAT_VICTORY__",
          dynamicContext: null,
          newState: {
            ...finalState,
            player: {
              ...finalState.player,
              activeEffects: carriedDummyEffects,
              activeCombat: {
                ...updatedSession,
                finished: true,
                playerWon: true,
              },
            },
          },
          stateChanged: true,
        };
      }

      if (roundResult.playerWon) {
        // ── Prescripted death narration ──
        const npcDef = NPCS[session.enemyNpcId];
        const deathPool = getEnemyDeathPool(npcDef?.bodyType);
        const deathLine = fillTemplate(pickTemplate(deathPool), { enemy: session.enemyName, weapon: ITEMS[p.weapon]?.name ?? "weapon" });
        narrative += `\n\n${deathLine}`;

        // Mark NPC dead, clear combat HP, award virtue + mana pool growth
        finalState = {
          ...finalState,
          npcs: {
            ...finalState.npcs,
            [session.enemyNpcId]: {
              ...finalState.npcs[session.enemyNpcId]!,
              isAlive: false,
            },
          },
        };
        finalState = setNPCCombatHp(finalState, session.enemyNpcId, null);

        // Sprint 7b.R — create corpse in the world at the death room.
        const dyingNpcDef = NPCS[session.enemyNpcId];
        const corpseId = `corpse-${session.enemyNpcId}-${finalState.worldTurn}`;
        const newCorpse: Corpse = {
          id: corpseId,
          originalNpcId: session.enemyNpcId,
          name: `the body of ${session.enemyName}`,
          roomId: finalState.player.currentRoom,
          planeId: finalState.player.currentPlane,
          timeOfDeath: finalState.worldTurn,
          context: "surface",
          sunExposed: isDay(finalState.worldTurn),
          moonExposed: !isDay(finalState.worldTurn),
          creatureKind: dyingNpcDef?.creatureKind ?? "human",
          isHeroCorpse: false,
        };
        finalState = {
          ...finalState,
          corpses: { ...(finalState.corpses ?? {}), [corpseId]: newCorpse },
        };

        // KARMA Sprint 5: combat-end PICSSI deltas — KARMA_SYSTEM.md §4c.
        // Routine kill = +1 Passion; dark-tagged enemy = +3 Illumination;
        // killing an innocent or friendly carries the catastrophic delta.
        // Multi-enemy bonuses dormant until 1v1 → multi-enemy lands.
        finalState = applyCombatDeltas(finalState, {
          victory: true,
          enemiesKilled: 1,
          enemyCount: 1,
          fled: false,
          playerLost: false,
          ...tagFlagsFromNpc(session.enemyNpcId),
        }, `combat: defeated ${session.enemyName}`);
        finalState = addToChronicle(
          finalState,
          `${p.name} defeated ${session.enemyName}.`,
          false
        );
        // Combat-victory mana growth (KARMA_SYSTEM.md §2.2):
        // increment combatVictories; recompute derives the new maxMana.
        finalState = {
          ...finalState,
          player: recomputeDerivedStats({
            ...finalState.player,
            combatVictories: finalState.player.combatVictories + 1,
          }),
        };
        // Combat-end recovery: 1 kill × maxStamina × 1.5 added to fatiguePool
        // (clamped to 0). Stamina restores fully. KARMA_SYSTEM.md §2.3.
        finalState = applyCombatEndRecovery(finalState, 1);
        finalState = emitQuestEvent(finalState, {
          type: "combat-end",
          victory: true,
          enemyNpcId: session.enemyNpcId,
          enemyTag: NPCS[session.enemyNpcId]?.bodyType,
        });
      } else if (roundResult.playerDied) {
        // KARMA Sprint 5: stand-and-lose Courage credit (KARMA_SYSTEM.md §4c).
        // Standing falls because the room saw the loss. Apply BEFORE
        // applyPlayerDeath so the chronicle line lands while the
        // pre-death PlayerState is still active; the rebirth wipe in
        // applyPlayerDeath then resets PICSSI to midline as designed.
        finalState = applyCombatDeltas(finalState, {
          victory: false,
          enemiesKilled: 0,
          enemyCount: 1,
          fled: false,
          playerLost: true,
        }, `combat: stood and fell to ${session.enemyName}`);
        // Quest engine: emit combat-end BEFORE applyPlayerDeath, so any
        // life-scope quest step that fires on stand-and-lose still has
        // its slot intact (rebirth wipes life-scope quests).
        finalState = emitQuestEvent(finalState, {
          type: "combat-end",
          victory: false,
          enemyNpcId: session.enemyNpcId,
          enemyTag: NPCS[session.enemyNpcId]?.bodyType,
        });
        // Player death — apply death penalty, respawn
        const { newState: afterDeath, lostGold } = applyPlayerDeath(
          finalState,
          session.enemyName
        );
        finalState = afterDeath;
        const deathSuffix = `\n\n${fillTemplate(
          pickTemplate(COMBAT_TEMPLATES.playerDeath),
          { enemy: session.enemyName }
        )}\n\n${pickTemplate(REBIRTH_NARRATIVES)}\n\nYou lost ${lostGold} gold and everything you carried.`;
        return {
          responseType: "static",
          staticResponse: narrative + deathSuffix + "\n__COMBAT_END__",
          dynamicContext: null,
          // Death path: applyPlayerDeath already wiped activeEffects; use false transfer
          newState: endCombatSession(finalState, false),
          stateChanged: true,
        };
      }

      // Combat over (player won) — keep session alive with finished=true
      // so the combat screen stays up for the final blow + loot screen.
      // Transfer persistent effects but DON'T clear activeCombat yet —
      // page.tsx clears it when the loot screen is dismissed.
      const carriedEffects = updatedSession.playerCombatant.activeEffects.map(e => ({ ...e }));
      return {
        responseType: "static",
        staticResponse: narrative + "\n__COMBAT_VICTORY__",
        dynamicContext: null,
        newState: {
          ...finalState,
          player: {
            ...finalState.player,
            activeEffects: carriedEffects,
            activeCombat: {
              ...updatedSession,
              finished: true,
              playerWon: true,
            },
          },
        },
        stateChanged: true,
      };
    }

    // Combat continues — persist updated HP on NPC and updated session on player
    finalState = setNPCCombatHp(finalState, session.enemyNpcId, roundResult.updatedEnemy.hp);
    // Sync player HP from combatant state back to PlayerState
    finalState = updatePlayerHP(finalState, roundResult.updatedPlayer.hp - finalState.player.hp);

    return {
      responseType: "static",
      staticResponse: narrative,
      dynamicContext: null,
      newState: {
        ...finalState,
        player: { ...finalState.player, activeCombat: updatedSession },
      },
      stateChanged: true,
    };
  }

  if (first === "ATTACK") {
    // If already in combat, redirect to STRIKE
    if (p.activeCombat) {
      return {
        responseType: "static",
        staticResponse: "Thou art already engaged! Use STRIKE HEAD, STRIKE NECK, STRIKE TORSO, or STRIKE LIMBS.",
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    if (p.weapon === "unarmed") {
      return {
        responseType: "static",
        staticResponse:
          "Thou art unarmed. Find a weapon before picking a fight.",
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    const rest = trimmed.slice(6).trim().toLowerCase();
    if (!rest) {
      return {
        responseType: "static",
        staticResponse: "Attack whom?",
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    const npcsHere = currentRoom
      ? presentNPCsInRoom(currentRoom, newState)
      : [];
    const target = npcsHere.find(
      n =>
        rest.includes(n.firstName.toLowerCase()) ||
        rest.includes(n.name.toLowerCase())
    );
    if (!target) {
      return {
        responseType: "static",
        staticResponse: "Thou dost not see that foe here.",
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    const npcData = NPCS[target.id];
    if (!npcData) {
      return {
        responseType: "static",
        staticResponse: "Thou dost not see that foe here.",
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    if (!npcData.stats) {
      return {
        responseType: "dynamic",
        staticResponse: null,
        dynamicContext: `COMBAT / ATTACK: ${p.name} attacks ${npcData.name}.
NPC has no static combat stats — resolve with narration and sensible consequences.
Room: ${currentRoom?.name ?? "unknown"}.`,
        newState,
        stateChanged: false,
      };
    }
    if (!npcData.isHostile && !npcData.isTrainingDummy) {
      return {
        responseType: "static",
        staticResponse: `${npcData.name} is not thy foe here. To strike unprovoked would be a grave act.`,
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }

    // Initialize body-zone combat session
    const session = initCombatSession(newState, target.id);
    if (!session) {
      return {
        responseType: "static",
        staticResponse: "Something prevents thee from engaging that foe.",
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }

    // Store session and set NPC combat HP
    let finalState = setNPCCombatHp(newState, target.id, session.enemyCombatant.hp);
    finalState = {
      ...finalState,
      player: { ...finalState.player, activeCombat: session },
    };

    const weaponName = ITEMS[p.weapon]?.name ?? p.weapon;
    const engageNarrative =
      `You draw your ${weaponName} and engage ${npcData.name}.\n` +
      `__COMBAT_START__`;

    return {
      responseType: "static",
      staticResponse: engageNarrative,
      dynamicContext: null,
      newState: finalState,
      stateChanged: true,
    };
  }

  if (first === "BUY") {
    const buyRest = trimmed.slice(3).trim();
    if (p.currentRoom === "main_hall" || p.currentRoom === "sams_sharps") {
      if (!buyRest) {
        return {
          responseType: "static",
          staticResponse: buildSamShopListing(p),
          dynamicContext: null,
          newState,
          stateChanged: false,
        };
      }
      return runSamPurchase(newState, buyRest);
    }
    // Armory — Pip's static shop (list + purchase)
    if (p.currentRoom === "armory") {
      if (!buyRest) {
        const pip = NPCS["armory_attendant"];
        const pipItems = pip?.merchant?.inventory ?? [];
        const lines = [
          "╔══════════════════════════════════════╗",
          "║        GUILD ARMORY — PIP            ║",
          "╚══════════════════════════════════════╝",
          "",
          ...pipItems.map(iid => {
            const item = ITEMS[iid];
            if (!item) return iid;
            const cover = item.stats?.zoneCover;
            const coverSeg = cover != null ? ` [${item.stats?.zoneSlot ?? "body"}: ${cover}% cover]` : "";
            const block = item.stats?.shieldBlockChance;
            const blockSeg = block != null ? ` [block: ${block}%]` : "";
            const dmg = WEAPON_DATA[iid]?.damage ?? item.stats?.damage;
            const dmgSeg = dmg ? ` [dmg: ${dmg}]` : "";
            return `__CMD:BUY ${item.name.toUpperCase()}__ ${item.name} | ${item.value} gp${dmgSeg}${coverSeg}${blockSeg}`;
          }),
          "",
          `Your gold: ${p.gold} gp`,
        ];
        return {
          responseType: "static",
          staticResponse: lines.join("\n"),
          dynamicContext: null,
          newState,
          stateChanged: false,
          conversationNpcId: "armory_attendant",
        };
      }
      return runMerchantPurchase(newState, "armory_attendant", buyRest);
    }
    // Pots & Bobbles — Zim's static shop (list + purchase)
    if (p.currentRoom === "mage_school") {
      if (!buyRest) {
        const zim = NPCS["zim_the_wizard"];
        const zimItems = zim?.merchant?.inventory ?? [];
        const lines = [
          "╔══════════════════════════════════════╗",
          "║      POTS & BOBBLES — ZIM            ║",
          "╚══════════════════════════════════════╝",
          "",
          ...zimItems.map(iid => {
            const item = ITEMS[iid];
            if (!item) return iid;
            const desc = item.shortDescription ?? "";
            const readMore = item.alchemicalDescription ? ` __ITEM:${item.id}__` : "";
            return `__CMD:BUY ${item.name.toUpperCase()}__ | ${item.value} gp · ${desc}${readMore}`;
          }),
          "",
          `Your gold: ${p.gold} gp`,
        ];
        return {
          responseType: "static",
          staticResponse: lines.join("\n"),
          dynamicContext: null,
          newState,
          stateChanged: false,
          conversationNpcId: "zim_the_wizard",
        };
      }
      return runMerchantPurchase(newState, "zim_the_wizard", buyRest);
    }
    return {
      responseType: "dynamic",
      staticResponse: null,
      dynamicContext: `Player wants to buy something. Input: "${trimmed}".
They are in ${currentRoom?.name}.
Player gold: ${p.gold}.
NPCs present who are merchants: ${currentRoom?.npcs
  .filter(id => NPCS[id]?.merchant)
  .map(id => {
    const npc = NPCS[id];
    const items = npc?.merchant?.inventory.map(iid => {
      const item = ITEMS[iid];
      return item ? `${item.name} (${item.value}g)` : iid;
    }).join(", ");
    return `${npc?.name}: ${items}`;
  }).join(" | ") || "none"}.
Handle the purchase: if they have enough gold, complete the sale statically by updating gold and inventory. 
Present the merchant's response in Universal Common.
If haggling is involved, this is dynamic.`,
      newState,
      stateChanged: false,
    };
  }

  if (first === "SELL") {
    const sellRest = trimmed.slice(4).trim();
    const merchantId = ROOM_MERCHANT_ID[p.currentRoom];
    if (!merchantId) {
      return {
        responseType: "static",
        staticResponse: "There is no one here to buy that.",
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    return runMerchantSell(newState, merchantId, sellRest);
  }

  if (first === "DEPOSIT" || first === "WITHDRAW") {
    return runBanking(trimmed, newState, p);
  }

  if (first === "ENTER") {
    const rest = lower.replace(/^enter\s+/, "").trim();
    for (const [advId, adv] of Object.entries(ADVENTURES)) {
      const advWords = adv.name
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length >= 4);
      const wordMatch = advWords.some(w => rest.includes(w));
      if (
        rest.includes(adv.name.toLowerCase()) ||
        rest.includes(advId.replace(/_/g, " ")) ||
        wordMatch
      ) {
        return {
          responseType: "dynamic",
          staticResponse: null,
          dynamicContext: `Player wants to enter the adventure: ${adv.name}.
Adventure description: ${adv.description}
Entrance text: ${adv.entrance}
Difficulty: ${adv.difficulty}. Recommended level: ${adv.recommendedLevel}.
Player mana pool: ${p.currentMana} / ${p.maxMana}.
Present the entrance dramatically using the static entrance text, then begin the first room encounter.
The player starts in: ${adv.rooms[0]?.name} — ${adv.rooms[0]?.description}`,
          newState: {
            ...newState,
            player: { ...newState.player, currentAdventure: advId },
          },
          stateChanged: true,
        };
      }
    }
    return {
      responseType: "static",
      staticResponse:
        `The Guild has three open contracts posted on the notice board, but the writs are still being copied for the field. None can be entered yet.\n\n` +
        `When the modules ship, the entry commands will be:\n\n` +
        `  ENTER THE MIRRORS OF TUZUN THUNE  (novice)\n` +
        `  ENTER THE SERPENT IN THE COURT    (moderate)\n` +
        `  ENTER THE PICTISH TIME-TOMB       (deadly)\n\n` +
        `Head east (GO EAST) to read the postings, or talk to Aldric for the field summary.`,
      dynamicContext: null,
      newState,
      stateChanged: false,
    };
  }

  // ── 3. DIRECTION SHORTHAND ─────────────────────────────
  if (tokens.length === 1 && directionFromSingleToken(tokens[0]!)) {
    const dir = directionFromSingleToken(tokens[0]!)!;
    if (!currentRoom) {
      return {
        responseType: "static",
        staticResponse: "Which way wouldst thou go? (north, south, east, west, up, down)",
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    const destinationId = currentRoom.exits[dir];
    if (!destinationId) {
      return {
        responseType: "static",
        staticResponse: `There is no passage to the ${dir} from here.`,
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    const alreadyVisitedAdv = newState.player.visitedRooms.includes(destinationId);
    newState = movePlayer(newState, destinationId);
    const advRoomDesc = buildRoomDescription(newState, destinationId, alreadyVisitedAdv ? "nonverbose" : "semiverbose");
    const advShopGreeting = SHOP_ROOM_GREETINGS[destinationId];
    return {
      responseType: "static",
      staticResponse: advShopGreeting ? advRoomDesc + "\n\n" + advShopGreeting : advRoomDesc,
      dynamicContext: null,
      newState,
      stateChanged: true,
      conversationNpcId: SHOP_ROOM_NPC[destinationId] ?? null,
    };
  }

  // ── BURY / BURN ────────────────────────────────────────
  // Sprint 7b.R — funeral rites. Both require a surface corpse in the
  // current room. BURY costs stamina (digging). BURN costs no stamina
  // but requires a hot flame source present in the room.
  // Hero corpse: awards +Spirituality AND +Standing (hiding the shame
  // of failure). Other mortal corpses: +Spirituality only.

  if (first === "BURY" || first === "BURN") {
    const isBury = first === "BURY";
    const target = tokens.slice(1).join(" ").trim().toLowerCase();

    // Resolve corpse in current room matching target string
    const roomCorpses = Object.values(newState.corpses ?? {}).filter(
      c => c.roomId === p.currentRoom && c.context === "surface"
    );
    const corpse = roomCorpses.find(c =>
      c.name.toLowerCase().includes(target) ||
      c.originalNpcId.toLowerCase().includes(target) ||
      c.id.toLowerCase().includes(target)
    ) ?? (target === "" && roomCorpses.length === 1 ? roomCorpses[0] : null);

    if (!corpse) {
      const hint = roomCorpses.length === 0
        ? "There are no bodies here awaiting burial."
        : `There is ${roomCorpses.length > 1
            ? `more than one body here — be specific: ${roomCorpses.map(c => c.name).join(", ")}.`
            : `only one body here: ${roomCorpses[0]!.name}. Use ${first} without a name, or name it.`}`;
      return {
        responseType: "static",
        staticResponse: hint,
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }

    if (isBury) {
      // Stamina gate — digging is real labor
      const BURY_STAMINA_COST = 20;
      if (p.stamina < BURY_STAMINA_COST) {
        return {
          responseType: "static",
          staticResponse: `You have not the strength to break this earth. Rest first. (Need ${BURY_STAMINA_COST} stamina; have ${p.stamina}.)`,
          dynamicContext: null,
          newState,
          stateChanged: false,
        };
      }
      // Consume stamina
      newState = {
        ...newState,
        player: { ...newState.player, stamina: newState.player.stamina - BURY_STAMINA_COST },
      };
    } else {
      // BURN — requires a hot flame source
      const hasFlame = hasHotFlameSource(newState, p.currentRoom);
      if (!hasFlame) {
        return {
          responseType: "static",
          staticResponse: "You have nothing here to take this body to ash. You need a campfire, a pyre, or another source of strong flame.",
          dynamicContext: null,
          newState,
          stateChanged: false,
        };
      }
    }

    // Apply the rite
    const newContext: "buried" | "burnt" = isBury ? "buried" : "burnt";
    newState = {
      ...newState,
      corpses: {
        ...(newState.corpses ?? {}),
        [corpse.id]: { ...corpse, context: newContext },
      },
    };

    // PICSSI: +Spirituality for funeral rite; +Standing if hero's own corpse
    const funeralDelta: import("./karma/types").KarmaDelta = { spirituality: 3 };
    if (corpse.isHeroCorpse) funeralDelta.standing = 2;
    newState = {
      ...newState,
      player: applyKarma(newState.player, funeralDelta),
    };
    newState = {
      ...newState,
      player: logKarmaDelta(
        newState.player,
        funeralDelta,
        `funeral rite: ${newContext} ${corpse.name}`
      ),
    };

    newState = addToChronicle(
      newState,
      `${p.name} performed a funeral rite — ${newContext} ${corpse.name}.`,
      true
    );

    const riteNarrative = isBury
      ? `**You break the earth with your hands — each scoop, a prayer. ${corpse.name} lies at rest now, returned to the ground.**${corpse.isHeroCorpse ? "\n\nThe shame of your failure is covered. Perhaps no one need know." : ""}`
      : `**The flames take ${corpse.name}. It is done swiftly and without dignity, but it is done.** The smoke rises.${corpse.isHeroCorpse ? "\n\nThe evidence of your passing is gone." : ""}`;

    return {
      responseType: "static",
      staticResponse: riteNarrative + "\n\n*(+Spirituality)" + (corpse.isHeroCorpse ? " (+Standing)*" : "*"),
      dynamicContext: null,
      newState,
      stateChanged: true,
    };
  }

  // ── 4. NAME ALONE → EXAMINE ───────────────────────────
  const alone = tryResolveNameAloneExamine(trimmed, newState, currentRoom);
  if (alone) return alone;

  // ── 5. FREE TEXT → JANE ────────────────────────────────
  return {
    responseType: "dynamic",
    staticResponse: null,
    dynamicContext: `Player input: "${trimmed}"
Current room: ${currentRoom?.name ?? "unknown"}
Room state: ${newState.rooms[p.currentRoom]?.currentState ?? "normal"}
Player HP: ${p.hp}/${p.maxHp} | Gold: ${p.gold} | Weapon: ${equippedWeaponDisplayLabel(p.weapon)}
NPCs present: ${currentRoom?.npcs.map(id => {
      const s = newState.npcs[id];
      const disp = String(s?.disposition ?? "neutral").replace(/,\s*,+/g, ", ").trim();
      return `${NPCS[id]?.name} (${disp})`;
    }).join(", ") || "none"}
Active events: ${newState.activeEvents.map(e => e.description).join("; ") || "none"}
Bounty on player: ${p.bounty > 0 ? p.bounty + " gold" : "none"}
Handle this naturally as the living world. If it is a moral choice, note the relevant virtue.`,
    newState,
    stateChanged: false,
  };
}

// ============================================================
// KARMA Sprint 4 — public processInput wrapper
// Adds atom dispatch around the core engine pipeline:
//   1. Pending-atom intercept — if the player has a presented atom
//      open, treat their input as the numbered choice and resolve.
//   2. Run processInputCore for normal handling.
//   3. Post-process — if the turn produced an enter-room or
//      talk-to-npc event, evaluate the atom library; if a match
//      passes prerequisites, append the atom prompt to the result.
// ============================================================

const ATOM_BYPASS_VERBS = new Set([
  "HEALTH", "HELP", "STATS", "LOOK", "EXAMINE",
  "QUESTS", "QUEST", "INVENTORY", "INV", "PACK",
]);

/** "TALK ALDRIC", "TALK TO HOKAS", "TALK TO THE BANKER" → npcId or null. */
function npcIdFromTalk(input: string, state: WorldState): string | null {
  const tokens = input.trim().toLowerCase().split(/\s+/);
  if (tokens[0] !== "talk") return null;
  const rest = tokens.slice(1).join(" ").replace(/^to\s+/, "").trim();
  if (!rest) return null;
  const room = getRoom(state.player.currentRoom);
  if (!room) return null;
  // Match against NPCs present in the current room. Substring on
  // display name first, then on id, so "TALK ALDRIC" hits old_mercenary.
  for (const npcId of room.npcs ?? []) {
    const npc = NPCS[npcId];
    if (!npc) continue;
    const name = npc.name.toLowerCase();
    if (
      name.includes(rest) ||
      rest.includes(name) ||
      npcId.includes(rest) ||
      rest.includes(npcId.replace(/_/g, " "))
    ) {
      return npcId;
    }
  }
  return null;
}

export function processInput(
  input: string,
  state: WorldState
): EngineResult {
  const trimmedInput = input.trim();
  const firstVerb = trimmedInput.toUpperCase().split(/\s+/)[0] ?? "";

  // ── 1. Pending-atom intercept ─────────────────────────────
  // If the player has an atom open and is not requesting a bypass
  // command (HEALTH/HELP/STATS/etc.), interpret their input as the
  // numbered choice. Out-of-range / non-numeric input clears the
  // gate with a polite refusal rather than crashing.
  if (state.player.pendingAtom && !ATOM_BYPASS_VERBS.has(firstVerb)) {
    const atom = findAtom(state.player.pendingAtom.atomId);
    if (!atom) {
      // Atom file vanished between present and resolve — clear gate.
      const cleared: WorldState = {
        ...state,
        player: { ...state.player, pendingAtom: null },
      };
      return {
        responseType: "static",
        staticResponse: "The moment slips through your fingers, formless.",
        dynamicContext: null,
        newState: cleared,
        stateChanged: true,
      };
    }
    const choiceNum = parseInt(trimmedInput, 10);
    if (!Number.isFinite(choiceNum) || choiceNum < 1 || choiceNum > atom.choices.length) {
      // Show the atom again so the player can re-pick.
      return {
        responseType: "static",
        staticResponse:
          `Type a number 1–${atom.choices.length} to choose.\n\n` +
          atom.choices.map((c, i) => `  ${i + 1}. ${c.label}`).join("\n"),
        dynamicContext: null,
        newState: state,
        stateChanged: false,
      };
    }
    const choiceResult = applyChoice(state, atom, choiceNum - 1);
    // Quest engine: emit a synthetic command event so quest steps that
    // hinge on the player's atom-choice can react. The choice index is
    // packed as args[0]; the verb is "ATOM-CHOICE".
    const afterAtomQuestState = emitQuestEvent(choiceResult.state, {
      type: "command",
      verb: "ATOM-CHOICE",
      args: [String(choiceNum)],
    });
    return {
      responseType: "static",
      staticResponse: choiceResult.narrative,
      dynamicContext: null,
      newState: afterAtomQuestState,
      stateChanged: true,
    };
  }

  // ── 2. Run the core engine pipeline ──────────────────────
  const beforeRoom = state.player.currentRoom;
  const beforeInventory = inventorySignature(state);
  const result = processInputCore(input, state);

  // ── 3. Post-process: detect events + present matching atom ────
  const events: KarmaEvent[] = [];
  const afterRoom = result.newState.player.currentRoom;
  if (afterRoom !== beforeRoom) {
    events.push({ type: "enter-room", roomId: afterRoom });
  }
  let talkNpcId: string | null = null;
  if (firstVerb === "TALK") {
    talkNpcId = npcIdFromTalk(input, result.newState);
    if (talkNpcId) events.push({ type: "talk-to-npc", npcId: talkNpcId });
  }

  // ── 3a. Quest engine: emit events. Silent (no narrative); quests
  //       advance their state machine without printing anything. The
  //       karma-atom presenter (3b) runs AFTER, on the updated state.
  let questState = result.newState;
  // command event: every turn, so quests can hook on raw verbs.
  if (firstVerb) {
    const args = input.trim().split(/\s+/).slice(1);
    questState = emitQuestEvent(questState, {
      type: "command",
      verb: firstVerb,
      args,
    });
  }
  if (afterRoom !== beforeRoom) {
    questState = emitQuestEvent(questState, { type: "enter-room", roomId: afterRoom });
  }
  if (talkNpcId) {
    questState = emitQuestEvent(questState, { type: "talk-to-npc", npcId: talkNpcId });
  }
  // item-acquired: diff inventory signatures, emit one event per net-new unit.
  const afterInventory = inventorySignature({ ...result.newState, player: questState.player });
  for (const itemId of inventoryDiff(beforeInventory, afterInventory)) {
    questState = emitQuestEvent(questState, { type: "item-acquired", itemId });
  }
  const stateAfterQuestEvents = questState;

  // Don't fire atoms while another gate is open or while in combat.
  if (
    stateAfterQuestEvents.player.pendingAtom ||
    stateAfterQuestEvents.player.pendingRiddle ||
    stateAfterQuestEvents.player.activeCombat
  ) {
    return { ...result, newState: stateAfterQuestEvents };
  }

  for (const event of events) {
    const matches = matchTriggers(stateAfterQuestEvents, event);
    if (matches.length === 0) continue;
    const atom = matches[0]!;
    const presented = presentAtom(stateAfterQuestEvents, atom);
    return {
      ...result,
      staticResponse:
        (result.staticResponse ?? "").trim() +
        (result.staticResponse?.trim() ? "\n\n" : "") +
        presented.rendered,
      newState: presented.state,
      stateChanged: true,
    };
  }

  return { ...result, newState: stateAfterQuestEvents };
}

/**
 * Build a Map of itemId → quantity for inventory diffing. Used by the
 * processInput wrapper to detect item-acquired events without
 * instrumenting every TAKE / BUY / loot path.
 */
function inventorySignature(state: WorldState): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of state.player.inventory ?? []) {
    map.set(e.itemId, (map.get(e.itemId) ?? 0) + e.quantity);
  }
  return map;
}

/**
 * Yield each newly-acquired itemId, repeated once per net-positive unit
 * delta. Decreases (sell, drop, item-lost) yield nothing.
 */
function inventoryDiff(before: Map<string, number>, after: Map<string, number>): string[] {
  const out: string[] = [];
  for (const [itemId, qty] of after.entries()) {
    const prev = before.get(itemId) ?? 0;
    const gained = qty - prev;
    for (let i = 0; i < gained; i++) out.push(itemId);
  }
  return out;
}