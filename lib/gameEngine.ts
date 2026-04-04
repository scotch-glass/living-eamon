// ============================================================
// LIVING EAMON — GAME ENGINE
// Reads gameData.ts (static world) and gameState.ts (live state)
// Decides what is handled statically vs what needs an API call.
// Never mutates state directly — returns new state + response.
// ============================================================

import {
  MAIN_HALL_ROOMS,
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
  type NPCBodyType,
  type WoundTier,
  type SamShopRow,
  Room,
  NPC,
} from "./gameData";

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
} from "./gameState";

import type { TimeOfDay } from "./weatherService";

import { isTwoHanded, rollWeaponDamage, WEAPON_DATA, getDexReactionBonus } from "./uoData";

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

const EXIT_ARROW: Record<string, string> = {
  north: "N",
  east: "E",
  south: "S",
  west: "W",
  up: "U",
  down: "D",
};

/** Order on situation line: N, S, E, W, U, D (matches typical map layout) */
const SITUATION_EXIT_ORDER = ["north", "south", "east", "west", "up", "down"] as const;

const EXIT_ORDER = ["north", "east", "south", "west", "up", "down"] as const;

function exitDestinationLabel(roomId: string): string {
  const dest = MAIN_HALL_ROOMS[roomId];
  if (!dest) return roomId.replace(/_/g, " ");
  if (dest.id === "main_hall_exit") return "Exit";
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

  const exitParts: string[] = [];
  for (const dir of SITUATION_EXIT_ORDER) {
    const to = room.exits[dir];
    if (!to) continue;
    const arrow = EXIT_ARROW[dir] ?? dir[0]!.toUpperCase();
    exitParts.push(`${arrow}→${exitDestinationLabel(to)}`);
  }
  const exitLine =
    exitParts.length > 0 ? `🧭 ${exitParts.join(" · ")}` : "🧭 —";

  const npcParts = room.npcs
    .map(id => state.npcs[id])
    .filter((n): n is NPCStateEntry =>
      Boolean(n?.isAlive && n.location === room.id)
    )
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
  const eyeSet = [...new Set([...itemLabels, ...examLabels])];
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

  const newInventory = grantHokasUnarmedGiftInventory(p.inventory);
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
    `Hokas is wiping a mug when thou drawest near. He looks up — then looks away almost at once, fixing on the bottles, the counter, the fire, anywhere but thy face or thy empty hands. The silver bells in his beard give one soft chime, as if embarrassed for thee.\n\n` +
    `"Aye," he says to the woodgrain. "We've all stood where thou standest. None of us care to name the hour."\n\n` +
    `Still without meeting thine eyes, he reaches below the bar and sets out a folded pile — shirt, trousers, belt, and shoes, all ragged but whole. Beside it he lays a short sword: notched, loose in the grip, honest scrap metal.\n\n` +
    `"'Tis not guild issue. Cast-offs from the back. Take them. Go dressed. Go armed. Come back when thou hast a story worth the telling."\n\n` +
    `Thou hast the ragged garments and a Cast-Off Short Sword. The sword is equipped.`;

  return {
    responseType: "static",
    staticResponse: body,
    dynamicContext: null,
    newState: after,
    stateChanged: true,
    echoPrefix: opts?.echoPrefix ?? null,
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

  const exitSuggestions = (): AutocompleteItem[] =>
    EXIT_ORDER.flatMap(dir => {
      const to = room.exits[dir];
      if (!to) return [];
      const label = `${dir} (→ ${exitDestinationLabel(to)})`;
      const cmd = `GO ${dir.toUpperCase()}`;
      return [{ label, insertText: cmd, autoSubmit: true }];
    });

  const examineTargets = (): AutocompleteItem[] => {
    const items: AutocompleteItem[] = [];
    for (const n of npcs) {
      const tail = n.name.toUpperCase();
      items.push({ label: n.name, insertText: `EXAMINE ${tail}`, autoSubmit: false });
    }
    for (const id of room.items) {
      const it = ITEMS[id];
      if (it) items.push({ label: it.name, insertText: `EXAMINE ${it.name.toUpperCase()}`, autoSubmit: false });
    }
    for (const ex of room.examinableObjects ?? []) {
      items.push({
        label: ex.label,
        insertText: `EXAMINE ${ex.label.toUpperCase()}`,
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
        insertText: `GET ${it.name.toUpperCase()}`,
        autoSubmit: true,
      }));

  const invItemsForVerb = (verb: "DROP" | "SELL"): AutocompleteItem[] =>
    state.player.inventory
      .map(e => ITEMS[e.itemId])
      .filter((it): it is NonNullable<typeof it> => Boolean(it))
      .map(it => ({
        label: it.name,
        insertText: `${verb} ${it.name.toUpperCase()}`,
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
            insertText: `BUY ${it.name.toUpperCase()}`,
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
          label: `${full} (→ ${exitDestinationLabel(room.exits[full]!)})`,
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
        insertText: `${verbPrefix} ${it.name.toUpperCase()}`,
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
        insertText: `EQUIP SHIELD ${it.name.toUpperCase()}`,
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
        insertText: `EQUIP ARMOR ${it.name.toUpperCase()}`,
        autoSubmit: true,
      }))
      .filter(x => filterPartial(x.insertText) || filterPartial(x.label));
  }

  if (/^equip\s+/i.test(trimmed) && !/^equip\s+shield/i.test(trimmed) && !/^equip\s+armor/i.test(trimmed)) {
    return invEquippableSuggestions("EQUIP").filter(x => filterPartial(x.insertText) || filterPartial(x.label));
  }

  if (/^shield\s+/i.test(trimmed)) {
    return state.player.inventory
      .filter(e => e.quantity > 0 && isShieldSlotItem(e.itemId))
      .map(e => ITEMS[e.itemId]!)
      .map(it => ({
        label: it.name,
        insertText: `SHIELD ${it.name.toUpperCase()}`,
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
        insertText: `UNEQUIP ${it.name.toUpperCase()}`,
        autoSubmit: true,
      });
    }
    if (pl.armor) {
      const it = ITEMS[pl.armor]!;
      suggestions.push({
        label: `UNEQUIP ${it.name}`,
        insertText: `UNEQUIP ${it.name.toUpperCase()}`,
        autoSubmit: true,
      });
    }
    if (pl.weapon && pl.weapon !== "unarmed") {
      const it = ITEMS[pl.weapon]!;
      suggestions.push({
        label: `UNEQUIP ${it.name}`,
        insertText: `UNEQUIP ${it.name.toUpperCase()}`,
        autoSubmit: true,
      });
    }
    return suggestions.filter(
      x => !partialLower || x.insertText.toLowerCase().includes(partialLower) || x.label.toLowerCase().includes(partialLower)
    );
  }

  // ATTACK
  if (/^attack\s+/i.test(trimmed)) {
    return npcs
      .map(n => ({
        label: n.name,
        insertText: `ATTACK ${n.name.toUpperCase()}`,
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
        insertText: `BEG ${n.name.toUpperCase()}`,
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
      insertText: `SAY ${n.name.toUpperCase()} `,
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
          insertText: `TELL ${n.name.toUpperCase()} `,
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
        insertText: `ENTER ${a.name.toUpperCase()}`,
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
  GO [direction]     GO NORTH, GO SOUTH, GO EAST, GO WEST, GO UP, GO DOWN
  N / S / E / W      Shorthand directions

INTERACTION
  EXAMINE [target]   EXAMINE HOKAS, EXAMINE SWORD, EXAMINE FIREPLACE
  READ               Read notices, signs, or posted contracts
  GET [item]         GET SWORD, GET TORCH
  DROP [item]        DROP SWORD
  EQUIP [item]       Weapon, shield, or armor from inventory (primary)
  WIELD [item]       Alias for EQUIP [item] (either works)
  EQUIP SHIELD [item]  EQUIP SHIELD BUCKLER  |  SHIELD BUCKLER
  EQUIP ARMOR [item]   Body armor from inventory
  REMOVE SHIELD      Lower thy shield
  REMOVE ARMOR       Doff body armor
  UNEQUIP [item]     Sheathe weapon or remove shield/armor by name

COMBAT
  ATTACK [enemy]     ATTACK GOBLIN, ATTACK GUARD
  FLEE               Escape through a random exit (enemy stays wounded)
  BEG [name]         When you have nothing, BEG helps.
                     BEG SAM — Sam may spare a rusty blade.
                     BEG HOKAS — Hokas may part with a knife.
                     Use it to survive until you can do better.

SPEECH (MUD conventions)
  SAY [text]         SAY Hello everyone!  (speaks to whole room)
  TELL [name] [text] TELL HOKAS What news?  (speaks to one NPC)

MAGIC
  CAST [spell]       CAST BLAST, CAST HEAL, CAST LIGHT, CAST SPEED
  INVOKE [ritual]    INVOKE ...  (occult — discovered through play)
  PRAY [TO deity]    PRAY TO MYSTRA  (divine — discovered through play)

INVENTORY & STATS
  INVENTORY / I      Show what you're carrying
  STATS              Show your character sheet

ECONOMY
  SHOP / LIST / SAM   Sam's price list (Main Hall only, static)
  BUY [item]         In Main Hall: static Sam's shop; elsewhere merchant (Jane)
  SELL [item]        SELL DAGGER
  DEPOSIT [amount]   DEPOSIT 20  (must be in the Guild Vault)
  WITHDRAW [amount]  WITHDRAW 10

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
  return itemId === "leather_armor" || itemId === "chain_mail";
}

function matchArmorFromPhrase(phraseLower: string, player: PlayerState): string | null {
  let best: { id: string; len: number } | null = null;
  for (const entry of player.inventory) {
    if (entry.quantity <= 0) continue;
    if (!isBodyArmorSlotItem(entry.itemId)) continue;
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
  if (p.armor === itemId) {
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
    staticResponse: `${item.name} equipped.`,
    dynamicContext: null,
    newState: { ...state, player: { ...p, armor: itemId } },
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
  if (!p.armor) {
    return {
      responseType: "static",
      staticResponse: "Thou art not wearing armor.",
      dynamicContext: null,
      newState: state,
      stateChanged: false,
    };
  }
  return {
    responseType: "static",
    staticResponse: "Thou doffest thy armor.",
    dynamicContext: null,
    newState: { ...state, player: { ...p, armor: null } },
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
  if (p.armor && phraseMatchesEquippedItem(norm, p.armor)) {
    return runRemoveArmor(state);
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
      staticResponse: "The vault is below the Main Hall. Head down to bank thy gold.",
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
        staticResponse: `Thou dost not have ${amount} gold to deposit. Thou carriest only ${player.gold}.`,
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    let s = updatePlayerGold(newState, -amount);
    s = { ...s, player: { ...s.player, bankedGold: s.player.bankedGold + amount } };
    return {
      responseType: "static",
      staticResponse: `Brunt records the deposit without looking up. ${amount} gold secured in thy vault account. Carried gold: ${s.player.gold}. Banked: ${s.player.bankedGold}.`,
      dynamicContext: null,
      newState: s,
      stateChanged: true,
    };
  }

  if (lower.includes("withdraw") && amount > 0) {
    if (amount > player.bankedGold) {
      return {
        responseType: "static",
        staticResponse: `Thou hast only ${player.bankedGold} gold banked.`,
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    let s = updatePlayerGold(newState, amount);
    s = { ...s, player: { ...s.player, bankedGold: s.player.bankedGold - amount } };
    return {
      responseType: "static",
      staticResponse: `Brunt counts out ${amount} gold coins and slides them across the counter. Carried gold: ${s.player.gold}. Banked: ${s.player.bankedGold}.`,
      dynamicContext: null,
      newState: s,
      stateChanged: true,
    };
  }

  return {
    responseType: "static",
    staticResponse: `Brunt looks up. "Deposit or withdraw. State the amount."`,
    dynamicContext: null,
    newState,
    stateChanged: false,
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

  const playerSkill = Math.min(100, player.expertise * 2);
  const enemySkill = 30;
  const playerHitChance = (playerSkill + 50) / ((enemySkill + 50) * 2);
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
      narrative += fillTemplate(pickTemplate(PLAYER_MISS_DESCRIPTIONS), {
        weapon: weaponItem?.name ?? "weapon",
        enemy: enemyData.name,
      });
      return false;
    }

    const isCrit = Math.random() < 0.1;
    const baseDmg = calcPlayerDamage();
    const dmg = isCrit ? baseDmg * 2 : baseDmg;
    newEnemyHp -= dmg;
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

function buildRoomDescription(state: WorldState, roomId: string): string {
  const room = getRoom(roomId);
  if (!room) return "You find yourself in a place that defies description.";

  const roomState = state.rooms[roomId];
  const currentRoomState = roomState?.currentState ?? "normal";

  let description = "";

  if (currentRoomState !== "normal" && room.stateModifiers[currentRoomState]) {
    description = room.stateModifiers[currentRoomState]!.description;
  } else {
    description = room.description;
  }

  // List NPCs present
  const presentNpcs = room.npcs
    .map(id => state.npcs[id])
    .filter(npc => npc?.isAlive && npc.location === roomId);

  if (presentNpcs.length > 0) {
    const npcNames = presentNpcs.map(npc => NPCS[npc.npcId]?.name ?? npc.npcId).join(", ");
    description += `\n\nPresent here: ${npcNames}.`;
  }

// Exits
  const exitList = Object.keys(room.exits).join(", ");
  description += `\n\nExits: ${exitList}.`;

  // Suggest actions
  const npcSuggestions = presentNpcs.length > 0
    ? `talk to ${presentNpcs.map(n => NPCS[n.npcId]?.name?.split(" ")[0]).join(" or ")}, `
    : "";
  const itemSuggestions = room.items.length > 0 ? "examine the room, " : "";
  description += `\n\n*You might: ${npcSuggestions}${itemSuggestions}head ${Object.keys(room.exits)[0]}, or do something unexpected.*`;

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

  return description;
}

/** Guild courtyard narrative: time-of-day base + live weather line (no async here). */
export function buildCourtyardDescription(
  state: WorldState,
  weatherLine: string,
  timeOfDay: TimeOfDay
): string {
  const bases: Record<string, string> = {
    dawn: "The courtyard is caught in the grey hour before sunrise. The cobblestones are dark with dew. The Church of Perpetual Life rises to the west, its white walls the only bright thing in the half-light. The Main Hall entrance stands to the east, a line of warm amber light showing under its door.",
    day: "The courtyard lies open between the Church of Perpetual Life and the Main Hall, cobblestones worn smooth by ten thousand crossings. The sky is above it all, indifferent.",
    dusk: "The courtyard is filling with shadow. The western sky behind the Church of Perpetual Life has gone the color of a bruise. The Main Hall to the east glows amber, the sound of voices just audible through the walls.",
    night: "The courtyard at night is lit only by the lantern above the Main Hall entrance and whatever light escapes the Church's high windows. The cobblestones are slick and dark. The silence from the Church extends all the way out here.",
  };

  let description = bases[timeOfDay] ?? bases.day;
  description += "\n\n" + weatherLine;

  description +=
    "\n\nExits: west (Church of Perpetual Life), east (Main Hall Entrance).";

  const hasRobe =
    state.player.inventory?.some(e => e.itemId === "gray_robe") || false;
  if (hasRobe) {
    description += "\n\n" + pickTemplate(COURTYARD_ROBE_HUMILIATION);
  }

  return description;
}

function buildInventoryDescription(player: PlayerState): string {
  if (player.inventory.length === 0) {
    return "Thou carriest nothing but thy wits — and those are looking thin.";
  }
  const lines = player.inventory.map(entry => {
    const item = ITEMS[entry.itemId];
    const name = item?.name ?? entry.itemId;
    const qty = ` (x${entry.quantity})`;

    const statBits: string[] = [];
    if (item?.type === "weapon") {
      const dmg = WEAPON_DATA[entry.itemId]?.damage ?? item.stats?.damage;
      if (dmg) statBits.push(`[dmg: ${dmg}]`);
      if (isTwoHanded(entry.itemId)) statBits.push("[2H]");
    } else if (item?.type === "armor") {
      const ac = entry.itemId === "buckler" ? 1 : item.stats?.armorClass;
      if (ac !== undefined && ac !== null) statBits.push(`[AC: ${ac}]`);
    }
    const statStr = statBits.length > 0 ? ` ${statBits.join(" ")}` : "";

    const equipTags: string[] = [];
    if (entry.itemId === player.weapon) equipTags.push("(wielded)");
    if (entry.itemId === player.shield) equipTags.push("(shield equipped)");
    if (entry.itemId === player.armor) equipTags.push("(armor equipped)");
    const tagStr = equipTags.length > 0 ? ` ${equipTags.join(" ")}` : "";

    return `- ${name}${qty}${statStr}${tagStr}`;
  });
  return `Thou dost carry:\n${lines.join("\n")}\n\nGold on hand: ${player.gold} gp\nBanked gold: ${player.bankedGold} gp`;
}

function buildStatDescription(player: PlayerState): string {
  const virtueLines = Object.entries(player.virtues)
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => `  ${k}: ${v > 0 ? "+" : ""}${v}`)
    .join("\n");

  const armorAC = player.armor ? (ITEMS[player.armor]?.stats?.armorClass ?? 0) : 0;
  const shieldAC = player.shield ? (ITEMS[player.shield]?.stats?.armorClass ?? 0) : 0;
  const totalAC = armorAC + shieldAC;
  const strPct = Math.round(Math.min(20, Math.max(0, ((player.strength - 10) / 40) * 100)));
  const tacPct = Math.round(Math.min(20, (player.expertise / 50) * 20));
  const playerSkill = Math.min(100, player.expertise * 2);
  const hitVsAvg = Math.round(((playerSkill + 50) / ((30 + 50) * 2)) * 100);
  const wSpeed = WEAPON_DATA[player.weapon]?.weaponSpeed ?? 5;
  const dexBonus = getDexReactionBonus(player.dexterity);

  return `— ${player.name} —
HP: ${player.hp} / ${player.maxHp}
Strength: ${player.strength} | Dexterity: ${player.dexterity} | Charisma: ${player.charisma}
Expertise: ${player.expertise}
Gold (carried): ${player.gold} | Gold (banked): ${player.bankedGold}
Weapon: ${player.weapon === "unarmed"
    ? "Unarmed"
    : (ITEMS[player.weapon]?.name ?? player.weapon)} [spd: ${wSpeed}]
Armor: ${player.armor ? `${ITEMS[player.armor]?.name ?? player.armor} [AC: ${armorAC}]` : "None"}
Shield: ${player.shield ? `${ITEMS[player.shield]?.name ?? player.shield} [AC: ${shieldAC}]` : "None"}
Total AC: ${totalAC}
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
  const dotCount = Math.max(8, 28 - name.length);
  const left = `${name} ${".".repeat(dotCount)}`;
  const mid = ` ${row.price} gp`;
  const tail = wd ? `   [${wd.skill}, ${wd.damage}]` : "";
  return `${left}${mid}${tail}`;
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
    "TWO-HANDED WEAPONS [2H]",
    ...twoHanded.map(formatSamShopWeaponLine),
    "",
    "ARMOR & SHIELDS",
    ...armor.map(row => {
      const name = row.displayName;
      const dotCount = Math.max(8, 28 - name.length);
      const ac = ITEMS[row.key]?.stats?.armorClass;
      const acSeg = ac !== undefined && ac !== null ? `  [AC: ${ac}]` : "";
      return `${name} ${".".repeat(dotCount)} ${row.price} gp${acSeg}`;
    }),
    "",
    `Your gold: ${player.gold} gp`,
    "─────────────────────────────",
    "To buy: BUY <item name>",
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
      staticResponse: "Sam doesn't carry that. Type SHOP to see his wares.",
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
    staticResponse: "Sam keeps his wares in the Main Hall. Go there to browse or buy.",
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
  const player = newState.player;
  if (!player.knownSpells?.length) {
    newState = {
      ...newState,
      player: {
        ...newState.player,
        knownSpells: ["BLAST", "HEAL", "LIGHT", "SPEED"],
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

  // ── 1. PREFIX: SAY ─────────────────────────────────────
  if (first === "SAY") {
    const text = trimmed.slice(3).trim();
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
    if (!parsed || !parsed.message) {
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
    if (p.currentRoom !== "main_hall") {
      return samShopWrongRoomResult(newState);
    }
    return {
      responseType: "static",
      staticResponse: buildSamShopListing(p),
      dynamicContext: null,
      newState,
      stateChanged: false,
    };
  }

  if (first === "READ") {
    if (p.currentRoom === "notice_board") {
      return {
        responseType: "static",
        staticResponse: buildRoomDescription(newState, "notice_board"),
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
        staticResponse: buildRoomDescription(newState, p.currentRoom),
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
        return {
          responseType: "static",
          staticResponse: pickTemplate(BARREL_EXAMINE_DESCRIPTIONS),
          dynamicContext: null,
          newState,
          stateChanged: false,
        };
      }
      return buildExamineEngineResult(`look at ${targetPhrase}`, newState, currentRoom);
    }
    if (p.currentRoom === "main_hall" && mainHallBarrelExaminePhrase(rest)) {
      return {
        responseType: "static",
        staticResponse: pickTemplate(BARREL_EXAMINE_DESCRIPTIONS),
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    return buildExamineEngineResult(trimmed, newState, currentRoom);
  }

  if (first === "EXAMINE" || first === "EX") {
    const body = trimmed.replace(/^(examine|ex)\s+/i, "").trim();
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
    if (isNoticeExamineCommand(bl)) {
      return buildExamineEngineResult(`examine notice board`, newState, currentRoom, "notice_board");
    }
    if (p.currentRoom === "main_hall" && mainHallBarrelExaminePhrase(bl)) {
      return {
        responseType: "static",
        staticResponse: pickTemplate(BARREL_EXAMINE_DESCRIPTIONS),
        dynamicContext: null,
        newState,
        stateChanged: false,
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
    newState = movePlayer(newState, destinationId);
    return {
      responseType: "static",
      staticResponse: buildRoomDescription(newState, destinationId),
      dynamicContext: null,
      newState,
      stateChanged: true,
    };
  }

  if (first === "GET" || first === "TAKE" || first === "GRAB") {
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
        const set = randomClothingSet();
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

        if (wantsShirt) addItem(set.shirt);
        if (wantsPants) addItem(set.pants);
        if (wantsShoes) addItem(set.shoes);
        if (wantsBelt) addItem(set.belt);

        let updatedState: WorldState = {
          ...newState,
          player: { ...newState.player, inventory: newInventory },
        };

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
    if (afterLower.startsWith("shield ")) {
      const phrase = afterEquip.slice(7).trim().toLowerCase();
      return runEquipShield(newState, phrase);
    }
    if (afterLower.startsWith("armor ")) {
      const phrase = afterEquip.slice(6).trim().toLowerCase();
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
    const phrase = tokens.slice(1).join(" ").trim();
    if (!phrase) {
      return {
        responseType: "static",
        staticResponse:
          "Remove or unequip what? Try REMOVE SHIELD, REMOVE ARMOR, or UNEQUIP [item].",
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
    const [fleeDir, fleeDest] =
      exits[Math.floor(Math.random() * exits.length)]!;
    newState = movePlayer(newState, fleeDest);
    const destRoom = getRoom(fleeDest);
    const destName = destRoom?.name ?? fleeDest.replace(/_/g, " ");
    return {
      responseType: "static",
      staticResponse:
        `You bolt for the ${fleeDir} exit, crashing into ${destName}.\n\n` +
        buildRoomDescription(newState, fleeDest),
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
      p.currentRoom === "main_hall" &&
      p.weapon === "unarmed"
    ) {
      const newInventory = [
        ...p.inventory,
        { itemId: "rusty_shortsword", quantity: 1 },
      ];
      const afterGift: WorldState = {
        ...newState,
        player: {
          ...newState.player,
          weapon: "rusty_shortsword",
          inventory: newInventory,
        },
      };

      return {
        responseType: "static",
        staticResponse:
          `Sam looks at you for a long moment — the robe, the empty hands, the whole situation.\n\n` +
          `He reaches under the counter and produces a short sword so rusty it looks like it was ` +
          `recovered from a riverbed. He sets it on the bar without ceremony.\n\n` +
          `"Don't thank me. Kill something with it and buy a real one."\n\n` +
          `You have the Rusty Short Sword. It is equipped.` +
          "\n\n" +
          pickTemplate(BARREL_NPC_HINTS),
        dynamicContext: null,
        newState: afterGift,
        stateChanged: true,
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
      const afterGift: WorldState = {
        ...newState,
        player: {
          ...newState.player,
          weapon: "butcher_knife",
          inventory: newInventory,
        },
      };

      return {
        responseType: "static",
        staticResponse:
          `Hokas looks at you for a long moment — the robe, the empty hands,` +
          ` the general situation.\n\n` +
          `He disappears behind the bar and comes back with a large knife,` +
          ` the kind used for breaking down a side of beef. He sets it on` +
          ` the bar with a solid thunk.\n\n` +
          `"I don't need it anymore," he says. "Don't tell me what you do` +
          ` with it. Don't bring it back." He goes back to polishing a` +
          ` glass that doesn't need polishing.\n\n` +
          `You have the Butcher Knife. It is equipped.` +
          "\n\n" +
          pickTemplate(BARREL_NPC_HINTS),
        dynamicContext: null,
        newState: afterGift,
        stateChanged: true,
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

  if (first === "ATTACK") {
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
    if (!npcData.isHostile) {
      return {
        responseType: "static",
        staticResponse: `${npcData.name} is not thy foe here. To strike unprovoked would be a grave act.`,
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }
    const currentEnemyHp =
      newState.npcs[target.id]?.combatHp ?? npcData.stats.hp;
    const combat = resolveCombatRound(
      newState,
      target.id,
      currentEnemyHp,
      {
        name: npcData.name,
        damage: npcData.stats.damage,
        armor: npcData.stats.armor,
      },
      npcData.bodyType
    );
    let finalState = combat.newState;
    if (combat.playerWon) {
      finalState = {
        ...finalState,
        npcs: {
          ...finalState.npcs,
          [target.id]: {
            ...finalState.npcs[target.id]!,
            isAlive: false,
          },
        },
      };
      finalState = setNPCCombatHp(finalState, target.id, null);
    } else if (combat.combatOver) {
      finalState = setNPCCombatHp(finalState, target.id, null);
    } else {
      finalState = setNPCCombatHp(finalState, target.id, combat.enemyHp);
    }
    return {
      responseType: "static",
      staticResponse: combat.narrative,
      dynamicContext: null,
      newState: finalState,
      stateChanged: true,
    };
  }

  if (first === "BUY") {
    const buyRest = trimmed.slice(3).trim();
    if (p.currentRoom === "main_hall") {
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
    newState = movePlayer(newState, destinationId);
    return {
      responseType: "static",
      staticResponse: buildRoomDescription(newState, destinationId),
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