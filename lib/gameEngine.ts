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
  ARMOR_ABSORB_DESCRIPTIONS,
  ARMOR_FULL_ABSORB_DESCRIPTIONS,
  PLAYER_MISS_DESCRIPTIONS,
  getEnemyHitPlayerPool,
  getEnemyMissPlayerPool,
  getPlayerHitEnemyPool,
  getWeaponCategory,
  PRIEST_SILENCE_RESPONSES,
  REBIRTH_NARRATIVES,
  ROOM_ROBE_HUMILIATION,
  COURTYARD_ROBE_HUMILIATION,
  BARREL_EXAMINE_DESCRIPTIONS,
  ROBE_CEREMONY_NARRATIVES,
  BARREL_NPC_HINTS,
  ALDRIC_OPENING_LINES,
  ALDRIC_TOPIC_RESPONSES,
  PLAYER_FUMBLE_DESCRIPTIONS,
  type NPCBodyType,
  type WoundTier,
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
  updateVirtue,
  addToChronicle,
  changeRoomState,
  changeNPCDisposition,
  applyFireballConsequences,
  setNPCCombatHp,
  applyPlayerDeath,
  updateWeaponSkill,
  SKILL_NAMES,
  SKILL_CAP,
  normalizeWeaponSkills,
  revealItemsInRoom,
  removeRevealedItem,
  type WeaponSkills,
} from "./gameState";

import type { TimeOfDay } from "./weatherService";

import {
  isTwoHanded,
  rollWeaponDamage,
  WEAPON_DATA,
  getDexReactionBonus,
  getWeaponSkillKey,
} from "./uoData";

import type { BodyZone, ActiveCombatSession } from "./combatTypes";
import { BODY_ZONES } from "./combatTypes";
import {
  initCombatSession,
  resolveCombatRound as resolveHWRRRound,
  buildRoundNarrative,
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

export const SITUATION_BLOCK_LINE = "─────────────────────────────────";
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

const EXIT_ORDER = ["north", "east", "south", "west", "up", "down"] as const;

function exitDestinationLabel(roomId: string, visitedRooms: string[]): string {
  if (!visitedRooms.includes(roomId)) return "?";
  const dest = MAIN_HALL_ROOMS[roomId];
  if (!dest) return roomId.replace(/_/g, " ");
  if (dest.id === "guild_courtyard") return "Courtyard";
  return dest.name.replace(/^The\s+/i, "").trim();
}

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

// ============================================================
// COMMAND AUTOCOMPLETE (client input bar)
// ============================================================

export type AutocompleteDispositionTone = "hostile" | "friendly" | "neutral";

export interface AutocompleteItem {
  label: string;
  /** Full value for the input field (ready to submit or continue typing) */
  insertText: string;
  tone?: AutocompleteDispositionTone;
  /** When true, picking this item should send the command immediately */
  autoSubmit?: boolean;
}

function npcTone(disposition: NPCStateEntry["disposition"], isHostile: boolean): AutocompleteDispositionTone {
  if (isHostile || disposition === "hostile" || disposition === "furious") return "hostile";
  if (disposition === "friendly") return "friendly";
  return "neutral";
}

function presentNPCsInRoom(room: Room, state: WorldState): {
  id: string;
  name: string;
  firstName: string;
  disposition: NPCStateEntry["disposition"];
  isHostile: boolean;
  merchant?: NPC["merchant"];
}[] {
  return room.npcs
    .map(id => {
      const nState = state.npcs[id];
      const data = NPCS[id];
      if (!nState?.isAlive || nState.location !== room.id || !data) return null;
      const firstName = data.name.split(/\s+/)[0] ?? data.name;
      return {
        id,
        name: data.name,
        firstName,
        disposition: nState.disposition,
        isHostile: data.isHostile,
        merchant: data.merchant,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

const HOKAS_UNARMED_GIFT_WEAPON = "castoff_short_sword";
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

/** Suggestions for CommandInput from live world state */
export function getCommandAutocompleteSuggestions(
  state: WorldState | null,
  rawInput: string
): AutocompleteItem[] {
  if (!state) return [];
  const room = MAIN_HALL_ROOMS[state.player.currentRoom];
  if (!room) return [];

  const trimmed = rawInput.trimStart();
  if (!trimmed) return [];
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  const firstLower = tokens[0]?.toLowerCase() ?? "";
  const restTokens = tokens.slice(1);
  const partial = restTokens.length > 0 ? restTokens[restTokens.length - 1]! : "";
  const partialLower = partial.toLowerCase();

  const npcs = presentNPCsInRoom(room, state);
  const filterPartial = (s: string) =>
    !partialLower || s.toLowerCase().startsWith(partialLower) || s.toLowerCase().includes(partialLower);

  const visited = state.player.visitedRooms ?? [];
  const exitSuggestions = (): AutocompleteItem[] =>
    EXIT_ORDER.flatMap(dir => {
      const to = room.exits[dir];
      if (!to) return [];
      const label = `${dir} (→ ${exitDestinationLabel(to, visited)})`;
      const cmd = `GO ${dir.toUpperCase()}`;
      return [{ label, insertText: cmd, autoSubmit: true }];
    });

  const examineTargets = (): AutocompleteItem[] => {
    const items: AutocompleteItem[] = [];
    for (const n of npcs) {
      items.push({ label: n.name, insertText: `EXAMINE ${n.name}`, autoSubmit: false });
    }
    for (const id of room.items) {
      const it = ITEMS[id];
      if (it) items.push({ label: it.name, insertText: `EXAMINE ${it.name}`, autoSubmit: false });
    }
    for (const ex of room.examinableObjects ?? []) {
      items.push({
        label: ex.label,
        insertText: `EXAMINE ${ex.label}`,
        autoSubmit: false,
      });
    }
    return items;
  };

  const carryableRoomItems = (): AutocompleteItem[] =>
    room.items
      .map(id => ITEMS[id])
      .filter((it): it is NonNullable<typeof it> => Boolean(it?.isCarryable))
      .map(it => ({
        label: it.name,
        insertText: `GET ${it.name}`,
        autoSubmit: true,
      }));

  const invItemsForVerb = (verb: "DROP" | "SELL"): AutocompleteItem[] =>
    state.player.inventory
      .map(e => ITEMS[e.itemId])
      .filter((it): it is NonNullable<typeof it> => Boolean(it))
      .map(it => ({
        label: it.name,
        insertText: `${verb} ${it.name}`,
        autoSubmit: verb === "DROP",
      }));

  const merchantStock = (): AutocompleteItem[] => {
    const items: AutocompleteItem[] = [];
    for (const n of npcs) {
      if (!n.merchant) continue;
      for (const iid of n.merchant.inventory) {
        const it = ITEMS[iid];
        if (it)
          items.push({
            label: `${it.name} (${n.firstName})`,
            insertText: `BUY ${it.name}`,
            autoSubmit: false,
          });
      }
    }
    return items;
  };

  // Movement: GO <dir> or lone direction token
  if (/^(go|walk|move)\s*$/i.test(trimmed) || (/^go\s+/i.test(trimmed) && restTokens.length <= 1)) {
    return exitSuggestions().filter(
      x =>
        !partialLower ||
        x.insertText.toLowerCase().includes(partialLower) ||
        x.label.toLowerCase().includes(partialLower)
    );
  }
  if (tokens.length === 1 && /^[nsewud]$/i.test(tokens[0]!)) {
    const letter = tokens[0]!.toLowerCase();
    const dirMap: Record<string, string> = {
      n: "north",
      s: "south",
      e: "east",
      w: "west",
      u: "up",
      d: "down",
    };
    const full = dirMap[letter];
    if (full && room.exits[full]) {
      return [
        {
          label: `${full} (→ ${exitDestinationLabel(room.exits[full]!, visited)})`,
          insertText: letter.toUpperCase(),
          autoSubmit: true,
        },
      ];
    }
    return [];
  }

  if (/^(n|north|s|south|e|east|w|west|u|up|d|down)$/i.test(trimmed) && tokens.length === 1) {
    return exitSuggestions();
  }

  // EXAMINE / LOOK AT
  if (/^(examine|ex|inspect)\s+/i.test(trimmed) || /^look at\s+/i.test(trimmed)) {
    return examineTargets().filter(x => filterPartial(x.insertText) || filterPartial(x.label));
  }
  if (/^look\s+$/i.test(trimmed)) {
    return [{ label: "around", insertText: "LOOK", autoSubmit: true }];
  }

  // GET / TAKE
  if (/^(get|take|grab)\s*$/i.test(trimmed)) {
    const hasRoomItems = room.items.some(id => ITEMS[id]?.isCarryable);
    const hasRevealedItems =
      (state.rooms[state.player.currentRoom]?.revealedItems ?? []).length > 0;
    if (hasRoomItems || hasRevealedItems) {
      return [
        {
          label: "GET ALL — take everything",
          insertText: "GET ALL",
          autoSubmit: true,
        },
        ...carryableRoomItems(),
      ];
    }
  }
  if (/^(get|take|grab)\s+/i.test(trimmed)) {
    return carryableRoomItems().filter(x => filterPartial(x.insertText));
  }

  // DROP / SELL
  if (/^drop\s+/i.test(trimmed)) {
    return invItemsForVerb("DROP").filter(x => filterPartial(x.insertText) || filterPartial(x.label));
  }
  if (/^sell\s+/i.test(trimmed)) {
    return invItemsForVerb("SELL").filter(x => filterPartial(x.insertText) || filterPartial(x.label));
  }

  const invEquippableSuggestions = (verbPrefix: string): AutocompleteItem[] =>
    state.player.inventory
      .filter(
        e =>
          e.quantity > 0 &&
          (ITEMS[e.itemId]?.type === "weapon" ||
            isShieldSlotItem(e.itemId) ||
            isBodyArmorSlotItem(e.itemId))
      )
      .map(e => ITEMS[e.itemId]!)
      .map(it => ({
        label: it.name,
        insertText: `${verbPrefix} ${it.name}`,
        autoSubmit: true,
      }));

  if (/^wield\s+/i.test(trimmed)) {
    return invEquippableSuggestions("WIELD").filter(x => filterPartial(x.insertText) || filterPartial(x.label));
  }

  if (/^equip\s+shield\s*/i.test(trimmed)) {
    return state.player.inventory
      .filter(e => e.quantity > 0 && isShieldSlotItem(e.itemId))
      .map(e => ITEMS[e.itemId]!)
      .map(it => ({
        label: it.name,
        insertText: `EQUIP SHIELD ${it.name}`,
        autoSubmit: true,
      }))
      .filter(x => filterPartial(x.insertText) || filterPartial(x.label));
  }

  if (/^equip\s+armor\s*/i.test(trimmed)) {
    return state.player.inventory
      .filter(e => e.quantity > 0 && isBodyArmorSlotItem(e.itemId))
      .map(e => ITEMS[e.itemId]!)
      .map(it => ({
        label: it.name,
        insertText: `EQUIP ARMOR ${it.name}`,
        autoSubmit: true,
      }))
      .filter(x => filterPartial(x.insertText) || filterPartial(x.label));
  }

  if (/^equip\s+helmet\s*/i.test(trimmed)) {
    return state.player.inventory
      .filter(e => e.quantity > 0 && isBodyArmorSlotItem(e.itemId) && ITEMS[e.itemId]?.stats?.zoneSlot === "head")
      .map(e => ITEMS[e.itemId]!)
      .map(it => ({ label: it.name, insertText: `EQUIP HELMET ${it.name}`, autoSubmit: true }))
      .filter(x => filterPartial(x.insertText) || filterPartial(x.label));
  }

  if (/^equip\s+gorget\s*/i.test(trimmed)) {
    return state.player.inventory
      .filter(e => e.quantity > 0 && isBodyArmorSlotItem(e.itemId) && ITEMS[e.itemId]?.stats?.zoneSlot === "neck")
      .map(e => ITEMS[e.itemId]!)
      .map(it => ({ label: it.name, insertText: `EQUIP GORGET ${it.name}`, autoSubmit: true }))
      .filter(x => filterPartial(x.insertText) || filterPartial(x.label));
  }

  if (/^equip\s+greaves\s*/i.test(trimmed)) {
    return state.player.inventory
      .filter(e => e.quantity > 0 && isBodyArmorSlotItem(e.itemId) && ITEMS[e.itemId]?.stats?.zoneSlot === "limbs")
      .map(e => ITEMS[e.itemId]!)
      .map(it => ({ label: it.name, insertText: `EQUIP GREAVES ${it.name}`, autoSubmit: true }))
      .filter(x => filterPartial(x.insertText) || filterPartial(x.label));
  }

  if (/^equip\s+/i.test(trimmed) && !/^equip\s+(shield|armor|helmet|gorget|greaves)/i.test(trimmed)) {
    return invEquippableSuggestions("EQUIP").filter(x => filterPartial(x.insertText) || filterPartial(x.label));
  }

  if (/^shield\s+/i.test(trimmed)) {
    return state.player.inventory
      .filter(e => e.quantity > 0 && isShieldSlotItem(e.itemId))
      .map(e => ITEMS[e.itemId]!)
      .map(it => ({
        label: it.name,
        insertText: `SHIELD ${it.name}`,
        autoSubmit: true,
      }))
      .filter(x => filterPartial(x.insertText) || filterPartial(x.label));
  }

  if (
    /^remove\s*$/i.test(trimmed) ||
    /^remove\s+/i.test(trimmed) ||
    /^unequip\s*$/i.test(trimmed) ||
    /^unequip\s+/i.test(trimmed)
  ) {
    const suggestions: AutocompleteItem[] = [
      { label: "REMOVE SHIELD", insertText: "REMOVE SHIELD", autoSubmit: true },
      { label: "REMOVE ARMOR", insertText: "REMOVE ARMOR", autoSubmit: true },
    ];
    const pl = state.player;
    if (pl.shield) {
      const it = ITEMS[pl.shield]!;
      suggestions.push({
        label: `UNEQUIP ${it.name}`,
        insertText: `UNEQUIP ${it.name}`,
        autoSubmit: true,
      });
    }
    if (pl.armor) {
      const it = ITEMS[pl.armor]!;
      suggestions.push({
        label: `UNEQUIP ${it.name}`,
        insertText: `UNEQUIP ${it.name}`,
        autoSubmit: true,
      });
    }
    if (pl.weapon && pl.weapon !== "unarmed") {
      const it = ITEMS[pl.weapon]!;
      suggestions.push({
        label: `UNEQUIP ${it.name}`,
        insertText: `UNEQUIP ${it.name}`,
        autoSubmit: true,
      });
    }
    return suggestions.filter(
      x => !partialLower || x.insertText.toLowerCase().includes(partialLower) || x.label.toLowerCase().includes(partialLower)
    );
  }

  // In combat: STRIKE zone suggestions take priority
  if (state.player.activeCombat) {
    if (/^(s|st|str|stri|strik|strike)$/i.test(trimmed)) {
      return BODY_ZONES.map(z => ({
        label: `STRIKE ${z.toUpperCase()}`,
        insertText: `STRIKE ${z.toUpperCase()}`,
        autoSubmit: true,
      }));
    }
    if (/^strike\s+/i.test(trimmed)) {
      return BODY_ZONES
        .map(z => ({
          label: z.toUpperCase(),
          insertText: `STRIKE ${z.toUpperCase()}`,
          autoSubmit: true,
        }))
        .filter(x => filterPartial(x.label));
    }
    if (/^(fl|fle|flee)$/i.test(trimmed)) {
      return [{ label: "FLEE", insertText: "FLEE", autoSubmit: true }];
    }
    // Block other autocomplete while in combat
    return [];
  }

  // ATTACK
  if (/^attack\s+/i.test(trimmed)) {
    return npcs
      .map(n => ({
        label: n.name,
        insertText: `ATTACK ${n.name}`,
        tone: npcTone(n.disposition, n.isHostile),
        autoSubmit: true,
      }))
      .filter(x => {
        const first = x.label.split(/\s+/)[0] ?? "";
        return filterPartial(x.insertText) || filterPartial(x.label) || filterPartial(first);
      });
  }

  if (/^(fl|fle|flee)$/i.test(trimmed)) {
    return [{ label: "FLEE", insertText: "FLEE", autoSubmit: true }];
  }

  if (/^(b|be|beg)$/i.test(trimmed)) {
    return [{ label: "BEG", insertText: "BEG ", autoSubmit: false }];
  }
  if (/^beg\s+/i.test(trimmed)) {
    return npcs
      .map(n => ({
        label: n.name,
        insertText: `BEG ${n.name}`,
        autoSubmit: true,
      }))
      .filter(
        x =>
          !partialLower ||
          x.insertText.toLowerCase().includes(partialLower) ||
          x.label.toLowerCase().includes(partialLower)
      );
  }

  // SAY / TALK — room audience + ALL + SELF (trailing space for message)
  if (/^(say|talk)\s+/i.test(trimmed)) {
    const special: AutocompleteItem[] = [
      { label: "ALL (whole room)", insertText: "SAY ALL ", autoSubmit: false },
      { label: "SELF", insertText: "SAY SELF ", autoSubmit: false },
    ];
    const fromNpcs = npcs.map(n => ({
      label: n.name,
      insertText: `SAY ${n.name} `,
      autoSubmit: false,
    }));
    return [...special, ...fromNpcs].filter(
      x =>
        !partialLower ||
        x.insertText.toLowerCase().includes(partialLower) ||
        x.label.toLowerCase().includes(partialLower)
    );
  }

  // TELL (private)
  if (/^tell\s+/i.test(trimmed)) {
    if (restTokens.length <= 1) {
      return npcs
        .map(n => ({
          label: n.name,
          insertText: `TELL ${n.name} `,
          autoSubmit: false,
        }))
        .filter(
          x =>
            !partialLower ||
            x.insertText.toLowerCase().includes(partialLower) ||
            x.label.toLowerCase().includes(partialLower)
        );
    }
    return [];
  }

  if (state.player.currentRoom === "main_hall") {
    if (/^(look|examine|ex)\s+(barrel|cloth|gown)/i.test(trimmed)) {
      return [
        {
          label: "Barrel 1 — Clothes for the Poor",
          insertText: "LOOK BARREL 1",
          autoSubmit: true,
        },
        {
          label: "Barrel 2 — Used Gowns Only",
          insertText: "LOOK BARREL 2",
          autoSubmit: true,
        },
      ];
    }
    if (
      /^(take|get|grab)\s*/i.test(trimmed) &&
      state.player.inventory.some(e => e.itemId === "gray_robe")
    ) {
      return [
        {
          label: "Take everything from the charity barrel",
          insertText: "TAKE EVERYTHING",
          autoSubmit: true,
        },
        { label: "Take shirt", insertText: "TAKE SHIRT", autoSubmit: true },
        { label: "Take pants", insertText: "TAKE PANTS", autoSubmit: true },
        { label: "Take shoes", insertText: "TAKE SHOES", autoSubmit: true },
        { label: "Take belt", insertText: "TAKE BELT", autoSubmit: true },
      ];
    }
    if (/^(s|sh|sho|shop)$/i.test(trimmed)) {
      return [{ label: "SHOP (Sam's wares)", insertText: "SHOP", autoSubmit: true }];
    }
    if (/^(l|li|lis|list)$/i.test(trimmed)) {
      return [{ label: "LIST (Sam's wares)", insertText: "LIST", autoSubmit: true }];
    }
    if (/^(sa|sam)$/i.test(trimmed)) {
      return [{ label: "SAM (shop list)", insertText: "SAM", autoSubmit: true }];
    }
    if (/^train\s*/i.test(trimmed)) {
      return [
        {
          label: "Train Swordsmanship (tiered gp)",
          insertText: "TRAIN SWORDSMANSHIP",
          autoSubmit: true,
        },
        { label: "Train Mace", insertText: "TRAIN MACE", autoSubmit: true },
        { label: "Train Fencing", insertText: "TRAIN FENCING", autoSubmit: true },
        { label: "Train Archery", insertText: "TRAIN ARCHERY", autoSubmit: true },
        { label: "Train Armor", insertText: "TRAIN ARMOR", autoSubmit: true },
        { label: "Train Shield", insertText: "TRAIN SHIELD", autoSubmit: true },
        { label: "Train Stealth", insertText: "TRAIN STEALTH", autoSubmit: true },
        { label: "Train Lockpicking", insertText: "TRAIN LOCKPICKING", autoSubmit: true },
        { label: "Train Magery", insertText: "TRAIN MAGERY", autoSubmit: true },
      ];
    }
    if (/^tell\s+ald/i.test(trimmed) && restTokens.length <= 2) {
      return [
        { label: "Aldric — survival", insertText: "TELL Aldric survival", autoSubmit: true },
        { label: "Aldric — combat", insertText: "TELL Aldric combat", autoSubmit: true },
        { label: "Aldric — training", insertText: "TELL Aldric training", autoSubmit: true },
        { label: "Aldric — skills", insertText: "TELL Aldric skills", autoSubmit: true },
        { label: "Aldric — adventures", insertText: "TELL Aldric adventures", autoSubmit: true },
        { label: "Aldric — world", insertText: "TELL Aldric world", autoSubmit: true },
        { label: "Aldric — magic", insertText: "TELL Aldric magic", autoSubmit: true },
        { label: "Aldric — secrets", insertText: "TELL Aldric secrets", autoSubmit: true },
        { label: "Aldric — order", insertText: "TELL Aldric order", autoSubmit: true },
      ];
    }
  }

  // BUY
  if (/^buy\s+/i.test(trimmed)) {
    return merchantStock().filter(x => filterPartial(x.insertText) || filterPartial(x.label));
  }

  // CAST
  if (/^cast\s+/i.test(trimmed)) {
    return state.player.knownSpells
      .map(s => ({
        label: s,
        insertText: `CAST ${s.toUpperCase()}`,
        autoSubmit: true,
      }))
      .filter(
        x =>
          !partialLower ||
          x.insertText.toLowerCase().includes(partialLower) ||
          x.label.toLowerCase().startsWith(partialLower)
      );
  }

  // INVOKE — never list
  if (/^invoke\b/i.test(trimmed)) {
    return [];
  }

  // PRAY
  if (/^pray\s+/i.test(trimmed)) {
    return state.player.knownDeities
      .map(d => ({
        label: d,
        insertText: `PRAY ${d.toUpperCase()}`,
        autoSubmit: false,
      }))
      .filter(
        x =>
          !partialLower ||
          x.insertText.toLowerCase().includes(partialLower) ||
          x.label.toLowerCase().startsWith(partialLower)
      );
  }

  // DEPOSIT / WITHDRAW — vault only
  if (state.player.currentRoom === "guild_vault" && /^(deposit|withdraw)\s+/i.test(trimmed)) {
    const verb = /^deposit/i.test(trimmed) ? "DEPOSIT" : "WITHDRAW";
    return ["10", "20", "50", "100"]
      .map(n => ({
        label: n,
        insertText: `${verb} ${n}`,
        autoSubmit: true,
      }))
      .filter(x => !partialLower || x.insertText.toLowerCase().includes(partialLower));
  }

  // READ — notice board room
  if (
    /^(r|re|rea|read)$/i.test(trimmed) &&
    state.player.currentRoom === "notice_board"
  ) {
    return [
      {
        label: "READ (notice board)",
        insertText: "READ",
        autoSubmit: true,
      },
    ];
  }

  // ENTER — full commands on notice board
  if (
    /^enter\s*$/i.test(trimmed) &&
    state.player.currentRoom === "notice_board"
  ) {
    return [
      {
        label: "The Beginner's Cave (novice)",
        insertText: "ENTER THE BEGINNER'S CAVE",
        autoSubmit: true,
      },
      {
        label: "The Thieves Guild (moderate)",
        insertText: "ENTER THE THIEVES GUILD",
        autoSubmit: true,
      },
      {
        label: "The Haunted Manor (deadly)",
        insertText: "ENTER THE HAUNTED MANOR",
        autoSubmit: true,
      },
    ];
  }

  // ENTER
  if (/^enter\s+/i.test(trimmed)) {
    return Object.values(ADVENTURES)
      .map(a => ({
        label: a.name,
        insertText: `ENTER ${a.name}`,
        autoSubmit: false,
      }))
      .filter(x => filterPartial(x.insertText) || filterPartial(x.label));
  }

  // HELP / STATS / INVENTORY / LOOK — typed prefixes (full command)
  if (/^(h|he|hel|help)$/i.test(trimmed)) {
    return [{ label: "HELP", insertText: "HELP", autoSubmit: true }];
  }
  if (/^(s|st|sta|stat|stats)$/i.test(trimmed)) {
    return [{ label: "STATS", insertText: "STATS", autoSubmit: true }];
  }
  if (/^(hp|hea|heal|healt|health)$/i.test(trimmed)) {
    return [{ label: "HEALTH", insertText: "HEALTH", autoSubmit: true }];
  }
  if (/^(i|in|inv|inve|inven|invent|invento|inventor|inventory)$/i.test(trimmed)) {
    return [{ label: "INVENTORY", insertText: "INVENTORY", autoSubmit: true }];
  }
  if (/^(l|lo|loo|look)$/i.test(trimmed)) {
    return [{ label: "LOOK", insertText: "LOOK", autoSubmit: true }];
  }

  return [];
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
  ENTER [adventure]  ENTER THE BEGINNER'S CAVE

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

/** Item ids that occupy the shield slot (off-hand), distinct from body armor. */
function isShieldSlotItem(itemId: string): boolean {
  return itemId === "buckler";
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

/** Body armor slot (not buckler). */
function isBodyArmorSlotItem(itemId: string): boolean {
  const item = ITEMS[itemId];
  return Boolean(item?.type === "armor" && item.stats?.zoneSlot);
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
  { phrase: "mace fighting", skill: "mace_fighting" },
  { phrase: "mace", skill: "mace_fighting" },
  { phrase: "fencing", skill: "fencing" },
  { phrase: "archery", skill: "archery" },
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

export function resolveCombatRound(
  state: WorldState,
  enemyId: string,
  enemyHp: number,
  enemyData: { name: string; damage: string; armor: number },
  bodyType?: NPCBodyType
): {
  narrative: string;
  newState: WorldState;
  enemyHp: number;
  combatOver: boolean;
  playerWon: boolean;
} {
  const player = state.player;
  if (player.weapon === "unarmed") {
    return {
      narrative: "You cannot fight unarmed.",
      newState: state,
      enemyHp,
      combatOver: false,
      playerWon: false,
    };
  }
  const weaponItem = ITEMS[player.weapon];
  const playerSpeed = WEAPON_DATA[player.weapon]?.weaponSpeed ?? 5;
  const playerInit =
    Math.floor(Math.random() * 10) +
    1 +
    playerSpeed -
    getDexReactionBonus(player.dexterity);
  const enemyInit = Math.floor(Math.random() * 10) + 1 + 5;
  const playerGoesFirst = playerInit <= enemyInit;
  const winnerLabel = playerGoesFirst ? "You" : enemyData.name;

  const enemyStartHp = enemyHp;

  let narrative = `⚡ Initiative — You: ${playerInit} · ${enemyData.name}: ${enemyInit}\n${winnerLabel} acts first.\n\n`;

  const weaponSkillKey = getWeaponSkillKey(player.weapon);
  const skillBonus = Math.min(
    0.2,
    (player.weaponSkills?.[weaponSkillKey] ?? 0) * 0.005
  );
  const playerHitChance = 0.75 + skillBonus;

  const ws = normalizeWeaponSkills(player.weaponSkills);
  const weaponSkillVal = ws[weaponSkillKey] ?? 0;
  const playerSkill = Math.min(100, weaponSkillVal / 7);
  const enemySkill = 30;
  const enemyHitChance = (enemySkill + 50) / ((playerSkill + 50) * 2);

  function getWoundTier(
    dmg: number,
    maxHp: number,
    axis: "playerOnEnemy" | "enemyOnPlayer"
  ): WoundTier {
    const pct = dmg / Math.max(1, maxHp);
    if (axis === "playerOnEnemy") {
      if (pct <= 0.15) return "glancing";
      if (pct <= 0.4) return "solid";
      return "devastating";
    }
    if (pct <= 0.1) return "glancing";
    if (pct <= 0.25) return "solid";
    return "devastating";
  }

  function calcPlayerDamage(): number {
    const base = rollWeaponDamage(player.weapon);
    const strPct = Math.min(0.2, Math.max(0, (player.strength - 10) / 40));
    const tacPct = Math.min(0.2, (player.expertise / 50) * 0.2);
    const boosted = base * (1 + strPct + tacPct);
    const afterAR = Math.max(0, boosted - (enemyData.armor ?? 0));
    const result = Math.max(1, Math.floor(afterAR / 2));
    return isNaN(result) ? 1 : result;
  }

  let newState = state;
  let newEnemyHp = enemyHp;

  function doPlayerAttack(): boolean {
    const roll = Math.random();
    if (roll >= playerHitChance) {
      if (Math.random() < 0.08) {
        narrative += pickTemplate(PLAYER_FUMBLE_DESCRIPTIONS);
      } else {
        narrative += fillTemplate(pickTemplate(PLAYER_MISS_DESCRIPTIONS), {
          weapon: weaponItem?.name ?? "weapon",
          enemy: enemyData.name,
        });
      }
      return false;
    }

    const isCrit = Math.random() < 0.1;
    const baseDmg = calcPlayerDamage();
    const dmg = isCrit ? baseDmg * 2 : baseDmg;
    newEnemyHp -= dmg;

    const skillUp = updateWeaponSkill(newState, weaponSkillKey, 1);
    newState = skillUp.newState;
    const tier = getWoundTier(dmg, enemyStartHp, "playerOnEnemy");
    const category = getWeaponCategory(player.weapon);
    const pool = getPlayerHitEnemyPool(bodyType, category, tier);
    const hitLine = fillTemplate(pickTemplate(pool), {
      weapon: weaponItem?.name ?? "weapon",
      enemy: enemyData.name,
      damage: String(dmg),
    });
    if (isCrit) {
      narrative += `__CRITICAL__ ${hitLine}`;
    } else {
      narrative += hitLine;
    }
    if (skillUp.degradedSkill) {
      narrative += `\n\nYour ${SKILL_NAMES[skillUp.degradedSkill]} slips a point — the guild's ${SKILL_CAP}-point skill ceiling makes room for your ${SKILL_NAMES[weaponSkillKey]}.`;
    }

    if (newEnemyHp <= 0) {
      const deathPool = getEnemyDeathPool(bodyType);
      narrative +=
        "\n\n" +
        fillTemplate(pickTemplate(deathPool), {
          enemy: enemyData.name,
          weapon: weaponItem?.name ?? "weapon",
        });
      return true;
    }
    return false;
  }

  function doEnemyAttack(): boolean {
    const roll = Math.random();
    if (roll >= enemyHitChance) {
      const missPool = getEnemyMissPlayerPool(bodyType);
      narrative +=
        "\n\n" +
        fillTemplate(pickTemplate(missPool), {
          enemy: enemyData.name,
        });
      return false;
    }

    const rawEnemyDmg = rollDice(enemyData.damage);
    const armorAC = player.armor
      ? (ITEMS[player.armor]?.stats?.armorClass ?? 0)
      : 0;
    const shieldAC = player.shield
      ? (ITEMS[player.shield]?.stats?.armorClass ?? 0)
      : 0;
    const totalAC = armorAC + shieldAC;
    const enemyDmg = Math.max(0, rawEnemyDmg - totalAC);
    const absorbKey = player.armor ?? player.shield ?? "default";

    if (totalAC > 0 && rawEnemyDmg > 0) {
      if (enemyDmg <= 0) {
        const pool =
          ARMOR_FULL_ABSORB_DESCRIPTIONS[absorbKey] ??
          ARMOR_FULL_ABSORB_DESCRIPTIONS["default"]!;
        narrative += "\n\n" + fillTemplate(pickTemplate(pool), {
          enemy: enemyData.name,
          armor: ITEMS[absorbKey]?.name ?? absorbKey,
        });
      } else {
        const pool =
          ARMOR_ABSORB_DESCRIPTIONS[absorbKey] ??
          ARMOR_ABSORB_DESCRIPTIONS["default"]!;
        narrative += "\n\n" + fillTemplate(pickTemplate(pool), {
          enemy: enemyData.name,
          armor: ITEMS[absorbKey]?.name ?? absorbKey,
        });
      }
    }

    if (enemyDmg <= 0) return false;

    newState = updatePlayerHP(newState, -enemyDmg);
    const enemyTier = getWoundTier(enemyDmg, player.maxHp, "enemyOnPlayer");
    const enemyPool = getEnemyHitPlayerPool(bodyType, enemyTier);
    narrative +=
      "\n\n" +
      fillTemplate(pickTemplate(enemyPool), {
        enemy: enemyData.name,
        damage: String(enemyDmg),
      });

    return newState.player.hp <= 0;
  }

  function completePlayerDeathReturn(): {
    narrative: string;
    newState: WorldState;
    enemyHp: number;
    combatOver: boolean;
    playerWon: boolean;
  } {
    const deathLine = fillTemplate(
      pickTemplate(COMBAT_TEMPLATES.playerDeath),
      { enemy: enemyData.name }
    );
    const rebirthLine = pickTemplate(REBIRTH_NARRATIVES);
    const { newState: afterDeath, lostGold } = applyPlayerDeath(
      newState,
      enemyData.name
    );
    const fullNarrative =
      narrative +
      "\n\n" +
      deathLine +
      "\n\n" +
      rebirthLine +
      `\n\nYou lost ${lostGold} gold and everything you carried.`;
    return {
      narrative: fullNarrative,
      newState: afterDeath,
      enemyHp: newEnemyHp,
      combatOver: true,
      playerWon: false,
    };
  }

  function applyEnemyDeath(): void {
    newState = updateVirtue(newState, "Valor", 1);
    newState = addToChronicle(
      newState,
      `${player.name} defeated ${enemyData.name}.`,
      false
    );
    newState = {
      ...newState,
      player: {
        ...newState.player,
        expertise: newState.player.expertise + 1,
      },
    };
  }

  if (playerGoesFirst) {
    if (doPlayerAttack()) {
      applyEnemyDeath();
      return {
        narrative,
        newState,
        enemyHp: 0,
        combatOver: true,
        playerWon: true,
      };
    }
    narrative += "\n\n";
    if (doEnemyAttack()) {
      return completePlayerDeathReturn();
    }
  } else {
    if (doEnemyAttack()) {
      return completePlayerDeathReturn();
    }
    narrative += "\n\n";
    if (doPlayerAttack()) {
      applyEnemyDeath();
      return {
        narrative,
        newState,
        enemyHp: 0,
        combatOver: true,
        playerWon: true,
      };
    }
  }

  return {
    narrative,
    newState,
    enemyHp: newEnemyHp,
    combatOver: false,
    playerWon: false,
  };
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

  // Effects — Phase 2 systems (poison, stamina, hunger) will populate this list.
  // For now the hook is here and ready.
  const effects: string[] = [];
  // e.g. if (player.poisoned) effects.push("Poison: active");
  // e.g. if (player.stamina < 20) effects.push("Stamina: dangerously low");

  const effectsLine = effects.length > 0
    ? `\nEffects:\n${effects.map(e => `  ${e}`).join("\n")}`
    : "\nNo active effects.";

  return `${hpBar}\n\n${statusLine}${effectsLine}`;
}

function buildStatDescription(player: PlayerState): string {
  const virtueLines = Object.entries(player.virtues)
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => `  ${k}: ${v > 0 ? "+" : ""}${v}`)
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
  const tacPct = Math.round(Math.min(20, (player.expertise / 50) * 20));
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
Expertise: ${player.expertise}
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

const SAM_ARMOR_KEYS = new Set(["leather_armor", "chain_mail", "buckler"]);

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

export function processInput(
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
  const COMBAT_ALLOWED_COMMANDS = new Set(["STRIKE", "FLEE", "HEALTH", "HELP"]);
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
          `  Swordsmanship:  ${ws.swordsmanship}\n` +
          `  Mace Fighting:  ${ws.mace_fighting}\n` +
          `  Fencing:        ${ws.fencing}\n` +
          `  Archery:        ${ws.archery}\n\n` +
          `Total: ${wsTotal} / ${SKILL_CAP}\n\n` +
          `Example: TRAIN SWORDSMANSHIP, TRAIN MACE, TRAIN FENCING, TRAIN ARCHERY, TRAIN ARMOR, TRAIN SHIELD, TRAIN STEALTH, TRAIN LOCKPICKING, TRAIN MAGERY.`,
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
          `Aldric shakes his head. "I don't teach that under that name. Try swordsmanship, mace, fencing, archery, armor, shield, stealth, lockpicking, or magery."`,
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

  // ── 1. PREFIX: INVOKE ──────────────────────────────────
  if (first === "INVOKE") {
    const rest = trimmed.slice(6).trim();
    return {
      responseType: "dynamic",
      staticResponse: null,
      dynamicContext: `Occult / forbidden INVOKE attempt: "${rest || "(unspecified)"}"
Room: ${currentRoom?.name}. State: ${newState.rooms[p.currentRoom]?.currentState ?? "normal"}.
This is dangerous, rare magic — never listed in UI. Describe tension, risk, and what stirs (or does not).`,
      newState,
      stateChanged: false,
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

        const addItem = (itemId: string) => {
          if (!isClothingItem(itemId)) return;
          const existing = newInventory.find(e => e.itemId === itemId);
          if (existing) {
            newInventory = newInventory.map(e =>
              e.itemId === itemId ? { ...e, quantity: e.quantity + 1 } : e
            );
          } else {
            newInventory = [...newInventory, { itemId, quantity: 1 }];
          }
          gotItems.push(ITEMS[itemId]?.name ?? itemId);
        };

        if (wantsShirt) addItem(clothingSet.shirt);
        if (wantsPants) addItem(clothingSet.pants);
        if (wantsShoes) addItem(clothingSet.shoes);
        if (wantsBelt) addItem(clothingSet.belt);

        let updatedState: WorldState = {
          ...clothingState,
          player: { ...clothingState.player, inventory: newInventory },
        };

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

    // Clear combat session on flee
    if (wasInCombat) {
      newState = {
        ...newState,
        player: { ...newState.player, activeCombat: null },
      };
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
        { itemId: "rusty_shortsword", quantity: 1 },
      ];
      let afterGift: WorldState = {
        ...newState,
        player: {
          ...newState.player,
          weapon: "rusty_shortsword",
          inventory: newInventory,
        },
      };

      let samResponse =
        `Sam looks at you for a long moment — the empty hands, the whole situation. He's seen this before.\n\n` +
        `He reaches under the counter and produces a short sword so rusty it looks like it was ` +
        `recovered from a riverbed. He sets it on the counter without ceremony.\n\n` +
        `"Don't thank me. Kill something with it and buy a real one."\n\n` +
        `You have the Rusty Short Sword. It is equipped.`;

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
        { itemId: "butcher_knife", quantity: 1 },
      ];
      let afterGift: WorldState = {
        ...newState,
        player: {
          ...newState.player,
          weapon: "butcher_knife",
          inventory: newInventory,
        },
      };

      let hokasResponse =
        `Hokas looks at you for a long moment — the empty hands,` +
        ` the general situation. Something soft and worried crosses his face, but he` +
        ` buries it fast.\n\n` +
        `He disappears behind the bar and comes back with a large knife,` +
        ` the kind used for breaking down a side of beef. He sets it on` +
        ` the bar with a solid thunk.\n\n` +
        `"I don't need it anymore," he says. "Don't tell me what you do` +
        ` with it. Don't bring it back." He goes back to polishing a` +
        ` glass that doesn't need polishing.\n\n` +
        `You have the Butcher Knife. It is equipped.`;

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

  // ── STRIKE [zone] — HWRR body-part targeting (active combat only) ──
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

    // Resolve one HWRR combat round
    const roundResult = resolveHWRRRound(session, zoneArg);
    const narrative = buildRoundNarrative(roundResult);

    // Update session with new combatant states
    let updatedSession: ActiveCombatSession = {
      ...session,
      roundNumber: roundResult.roundNumber,
      playerCombatant: roundResult.updatedPlayer,
      enemyCombatant: roundResult.updatedEnemy,
      combatLog: [...session.combatLog, narrative].slice(-20),
      finished: roundResult.combatOver,
      playerWon: roundResult.combatOver ? roundResult.playerWon : null,
    };

    let finalState = newState;

    // Training dummy: grant weapon skill XP per strike (capped at 25)
    const isDummy = NPCS[session.enemyNpcId]?.isTrainingDummy === true;
    const DUMMY_SKILL_CAP = 25;
    if (isDummy && roundResult.playerStrike && roundResult.playerStrike.damageDealt > 0) {
      const weaponSkillKey = getWeaponSkillKey(finalState.player.weapon);
      const currentSkill = finalState.player.weaponSkills[weaponSkillKey] ?? 0;
      if (currentSkill < DUMMY_SKILL_CAP) {
        const skillUp = updateWeaponSkill(finalState, weaponSkillKey, 1);
        finalState = skillUp.newState;
      }
    }

    if (roundResult.combatOver) {
      if (isDummy && roundResult.playerWon) {
        // Training dummy: reset HP, don't kill, end session
        finalState = setNPCCombatHp(finalState, session.enemyNpcId, null);
        const weaponSkillKey = getWeaponSkillKey(finalState.player.weapon);
        const skillVal = finalState.player.weaponSkills[weaponSkillKey] ?? 0;
        const capNote = skillVal >= DUMMY_SKILL_CAP
          ? `\n\nThe dummy has nothing more to teach you. Your ${SKILL_NAMES[weaponSkillKey]} has outgrown wooden targets.`
          : `\n\n${SKILL_NAMES[weaponSkillKey]}: ${skillVal}/${DUMMY_SKILL_CAP} (dummy training cap)`;
        return {
          responseType: "static",
          staticResponse: narrative + "\n\nThe dummy splinters apart — but someone will patch it back together by morning." + capNote + "\n__COMBAT_END__",
          dynamicContext: null,
          newState: {
            ...finalState,
            player: { ...finalState.player, activeCombat: null },
          },
          stateChanged: true,
        };
      }

      if (roundResult.playerWon) {
        // Mark NPC dead, clear combat HP, award virtue + expertise
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
        finalState = updateVirtue(finalState, "Valor", 1);
        finalState = addToChronicle(
          finalState,
          `${p.name} defeated ${session.enemyName}.`,
          false
        );
        finalState = {
          ...finalState,
          player: {
            ...finalState.player,
            expertise: finalState.player.expertise + 1,
          },
        };
      } else if (roundResult.playerDied) {
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
          newState: {
            ...finalState,
            player: { ...finalState.player, activeCombat: null },
          },
          stateChanged: true,
        };
      }

      // Combat over (player won) — clear session
      return {
        responseType: "static",
        staticResponse: narrative + "\n__COMBAT_END__",
        dynamicContext: null,
        newState: {
          ...finalState,
          player: { ...finalState.player, activeCombat: null },
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

    // Initialize HWRR combat session
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
      `You draw your ${weaponName} and engage ${npcData.name}!\n\n` +
      `${npcData.name}: ${session.enemyCombatant.hp}/${session.enemyCombatant.maxHp} HP\n` +
      `Choose your target: STRIKE HEAD · STRIKE NECK · STRIKE TORSO · STRIKE LIMBS\n` +
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
    // Armory — Pip's static shop listing
    if (p.currentRoom === "armory" && !buyRest) {
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
    // Pots & Bobbles — Zim's static shop listing
    if (p.currentRoom === "mage_school" && !buyRest) {
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
          const heal = item.stats?.healAmount;
          const healSeg = heal != null ? ` [heals: ${heal}]` : "";
          return `__CMD:BUY ${item.name.toUpperCase()}__ ${item.name} | ${item.value} gp${healSeg}`;
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
    return {
      responseType: "dynamic",
      staticResponse: null,
      dynamicContext: `Player wants to SELL from inventory. Input: "${trimmed}".
Room: ${currentRoom?.name}. Gold: ${p.gold}.
Merchants present: ${currentRoom?.npcs
  .filter(id => NPCS[id]?.merchant)
  .map(id => NPCS[id]?.name)
  .join(", ") || "none"}.
Negotiate sale; update gold/inventory if a deal completes.`,
      newState,
      stateChanged: false,
    };
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
Player current level/expertise: ${p.expertise}.
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
        `The Guild has three open contracts posted on the notice board.\n\n` +
        `Head east to read them, or type one of these directly:\n\n` +
        `  ENTER THE BEGINNER'S CAVE\n` +
        `  ENTER THE THIEVES GUILD\n` +
        `  ENTER THE HAUNTED MANOR`,
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