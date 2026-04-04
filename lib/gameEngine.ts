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
  Room,
  NPC,
} from "./gameData";

import {
  WorldState,
  PlayerState,
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
} from "./gameState";

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
}

// ============================================================
// SITUATION BLOCK (static, always appended by API)
// ============================================================

export const SITUATION_BLOCK_LINE = "─────────────────────────────────";
const SIT_LINE = SITUATION_BLOCK_LINE;

const EXIT_ARROW: Record<string, string> = {
  north: "N",
  east: "E",
  south: "S",
  west: "W",
  up: "U",
  down: "D",
};

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
    return `${SIT_LINE}\n(Unknown location)\n${SIT_LINE}`;
  }

  const exitParts: string[] = [];
  for (const dir of EXIT_ORDER) {
    const to = room.exits[dir];
    if (!to) continue;
    const arrow = EXIT_ARROW[dir] ?? dir[0]!.toUpperCase();
    exitParts.push(`${arrow}→${exitDestinationLabel(to)}`);
  }
  const exitLine = exitParts.join("  ");

  const presentNpcs = room.npcs
    .map(id => state.npcs[id])
    .filter((n): n is NPCStateEntry => Boolean(n?.isAlive && n.location === room.id))
    .map(n => NPCS[n.npcId]?.name ?? n.npcId);

  const npcLine = presentNpcs.length > 0 ? `👤 ${presentNpcs.join(" · ")}` : "👤 —";

  const itemLabels = room.items
    .map(id => ITEMS[id]?.name ?? id)
    .filter(Boolean);
  const examLabels = (room.examinableObjects ?? []).map(o => o.label);
  const eyeSet = [...new Set([...itemLabels, ...examLabels])];
  const eyeLine = eyeSet.length > 0 ? `👁 ${eyeSet.join(" · ")}` : "👁 —";

  return [SIT_LINE, exitLine, npcLine, eyeLine, SIT_LINE].join("\n");
}

// ============================================================
// COMMAND AUTOCOMPLETE (client input bar)
// ============================================================

export type AutocompleteDispositionTone = "hostile" | "friendly" | "neutral";

export interface AutocompleteItem {
  label: string;
  insertText: string;
  tone?: AutocompleteDispositionTone;
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
      const insert = dir;
      return [{ label, insertText: insert }];
    });

  const examineTargets = (): AutocompleteItem[] => {
    const items: AutocompleteItem[] = [];
    for (const n of npcs) {
      items.push({ label: n.name, insertText: n.firstName });
    }
    for (const id of room.items) {
      const it = ITEMS[id];
      if (it) items.push({ label: it.name, insertText: it.name });
    }
    for (const ex of room.examinableObjects ?? []) {
      items.push({ label: ex.label, insertText: ex.label });
    }
    return items;
  };

  const carryableRoomItems = (): AutocompleteItem[] =>
    room.items
      .map(id => ITEMS[id])
      .filter((it): it is NonNullable<typeof it> => Boolean(it?.isCarryable))
      .map(it => ({ label: it.name, insertText: it.name }));

  const invItems = (): AutocompleteItem[] =>
    state.player.inventory
      .map(e => ITEMS[e.itemId])
      .filter((it): it is NonNullable<typeof it> => Boolean(it))
      .map(it => ({ label: it.name, insertText: it.name }));

  const merchantStock = (): AutocompleteItem[] => {
    const items: AutocompleteItem[] = [];
    for (const n of npcs) {
      if (!n.merchant) continue;
      for (const iid of n.merchant.inventory) {
        const it = ITEMS[iid];
        if (it) items.push({ label: `${it.name} (${n.firstName})`, insertText: it.name });
      }
    }
    return items;
  };

  // Movement: GO <dir> or lone direction token
  if (/^(go|walk|move)\s*$/i.test(trimmed) || (/^go\s+/i.test(trimmed) && restTokens.length <= 1)) {
    return exitSuggestions().filter(x => !partialLower || x.insertText.toLowerCase().startsWith(partialLower));
  }
  if (tokens.length === 1 && /^[nsewud]$/i.test(tokens[0]!)) {
    return exitSuggestions().filter(x => x.insertText.toLowerCase().startsWith(tokens[0]!.toLowerCase()));
  }

  if (/^(n|north|s|south|e|east|w|west|u|up|d|down)$/i.test(trimmed) && tokens.length === 1) {
    return exitSuggestions();
  }

  // EXAMINE / LOOK AT
  if (/^(examine|ex|inspect)\s+/i.test(trimmed) || /^look at\s+/i.test(trimmed)) {
    return examineTargets().filter(x => filterPartial(x.insertText) || filterPartial(x.label));
  }
  if (/^look\s+$/i.test(trimmed)) {
    return [{ label: "around", insertText: "around" }];
  }

  // GET / TAKE
  if (/^(get|take|grab)\s+/i.test(trimmed)) {
    return carryableRoomItems().filter(x => filterPartial(x.insertText));
  }

  // DROP / SELL
  if (/^(drop|sell)\s+/i.test(trimmed)) {
    return invItems().filter(x => filterPartial(x.insertText));
  }

  // ATTACK
  if (/^attack\s+/i.test(trimmed)) {
    return npcs
      .map(n => ({
        label: n.name,
        insertText: n.firstName,
        tone: npcTone(n.disposition, n.isHostile),
      }))
      .filter(x => filterPartial(x.insertText) || filterPartial(x.label));
  }

  // SAY / TALK — room audience + ALL + SELF
  if (/^(say|talk)\s+/i.test(trimmed)) {
    const special: AutocompleteItem[] = [
      { label: "ALL (whole room)", insertText: "ALL" },
      { label: "SELF", insertText: "SELF" },
    ];
    const fromNpcs = npcs.map(n => ({ label: n.name, insertText: n.firstName }));
    return [...special, ...fromNpcs].filter(x => !partialLower || x.insertText.toLowerCase().startsWith(partialLower) || x.label.toLowerCase().includes(partialLower));
  }

  // TELL (private)
  if (/^tell\s+/i.test(trimmed)) {
    if (restTokens.length <= 1) {
      return npcs
        .map(n => ({ label: n.name, insertText: n.firstName }))
        .filter(x => !partialLower || x.insertText.toLowerCase().startsWith(partialLower) || x.label.toLowerCase().includes(partialLower));
    }
    return [];
  }

  // BUY
  if (/^buy\s+/i.test(trimmed)) {
    return merchantStock().filter(x => filterPartial(x.insertText) || filterPartial(x.label));
  }

  // CAST
  if (/^cast\s+/i.test(trimmed)) {
    return state.player.knownSpells
      .map(s => ({ label: s, insertText: s }))
      .filter(x => !partialLower || x.insertText.toLowerCase().startsWith(partialLower));
  }

  // INVOKE — never list
  if (/^invoke\b/i.test(trimmed)) {
    return [];
  }

  // PRAY
  if (/^pray\s+/i.test(trimmed)) {
    return state.player.knownDeities
      .map(d => ({ label: d, insertText: d }))
      .filter(x => !partialLower || x.insertText.toLowerCase().startsWith(partialLower));
  }

  // DEPOSIT / WITHDRAW — vault only
  if (state.player.currentRoom === "guild_vault" && /^(deposit|withdraw)\s+/i.test(trimmed)) {
    return ["10", "20", "50", "100"]
      .map(n => ({ label: n, insertText: n }))
      .filter(x => !partialLower || x.insertText.startsWith(partialLower));
  }

  // ENTER
  if (/^enter\s+/i.test(trimmed)) {
    return Object.values(ADVENTURES)
      .map(a => ({ label: a.name, insertText: a.name }))
      .filter(x => filterPartial(x.insertText) || filterPartial(x.label));
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
  GET [item]         GET SWORD, GET TORCH
  DROP [item]        DROP SWORD

COMBAT
  ATTACK [enemy]     ATTACK GOBLIN, ATTACK GUARD

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
  BUY [item]         BUY SWORD  (must be near a merchant)
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

function extractDirection(input: string): string | null {
  const lower = input.toLowerCase();
  for (const [key, val] of Object.entries(DIRECTION_MAP)) {
    if (lower.includes(key)) return val;
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

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? key);
}

export function resolveCombatRound(
  state: WorldState,
  enemyId: string,
  enemyHp: number,
  enemyData: { name: string; damage: string; armor: number }
): {
  narrative: string;
  newState: WorldState;
  enemyHp: number;
  combatOver: boolean;
  playerWon: boolean;
} {
  const player = state.player;
  const weaponData = ITEMS[player.weapon];
  const damageDice = weaponData?.stats?.damage ?? "1d6";
  const strBonus = Math.floor((player.strength - 10) / 2);

  // Player attacks
  const playerHit = Math.random() > 0.25; // 75% hit chance base
  let narrative = "";
  let newState = state;
  let newEnemyHp = enemyHp;

  if (playerHit) {
    const dmg = rollDice(damageDice) + strBonus;
    newEnemyHp = enemyHp - dmg;
    narrative += fillTemplate(pickTemplate(COMBAT_TEMPLATES.playerHit), {
      weapon: weaponData?.name ?? "weapon",
      damage: String(dmg),
      enemy: enemyData.name,
    });
  } else {
    narrative += fillTemplate(pickTemplate(COMBAT_TEMPLATES.playerMiss), {
      weapon: weaponData?.name ?? "weapon",
      enemy: enemyData.name,
    });
  }

  // Check enemy death
  if (newEnemyHp <= 0) {
    narrative += "\n\n" + fillTemplate(pickTemplate(COMBAT_TEMPLATES.enemyDeath), {
      enemy: enemyData.name,
    });
    newState = updateVirtue(newState, "Valor", 1);
    newState = addToChronicle(newState, `${player.name} defeated ${enemyData.name}.`, false);
    return { narrative, newState, enemyHp: 0, combatOver: true, playerWon: true };
  }

  // Enemy attacks back
  const enemyHit = Math.random() > 0.3; // 70% hit chance
  if (enemyHit) {
    const enemyDmg = Math.max(1, rollDice(enemyData.damage) - (player.armor ? 2 : 0));
    newState = updatePlayerHP(newState, -enemyDmg);
    narrative += "\n\n" + fillTemplate(pickTemplate(COMBAT_TEMPLATES.enemyHit), {
      enemy: enemyData.name,
      damage: String(enemyDmg),
    });
  } else {
    narrative += "\n\n" + fillTemplate(pickTemplate(COMBAT_TEMPLATES.enemyMiss), {
      enemy: enemyData.name,
    });
  }

  // Check player death
  if (newState.player.hp <= 0) {
    const lostGold = newState.player.gold;
    newState = updatePlayerGold(newState, -lostGold); // Lose carried gold
    newState = updatePlayerHP(newState, newState.player.maxHp); // Respawn at full HP
    narrative += "\n\n" + fillTemplate(pickTemplate(COMBAT_TEMPLATES.playerDeath), {
      enemy: enemyData.name,
    });
    narrative += `\n\nYou lost ${lostGold} gold, but your legend endures. You awaken in the Main Hall.`;
    newState = { ...newState, player: { ...newState.player, currentRoom: "main_hall" } };
    newState = addToChronicle(newState, `${player.name} was defeated by ${enemyData.name}.`, true);
    return { narrative, newState, enemyHp: newEnemyHp, combatOver: true, playerWon: false };
  }

  return { narrative, newState, enemyHp: newEnemyHp, combatOver: false, playerWon: false };
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

  return description;
}

function buildInventoryDescription(player: PlayerState): string {
  if (player.inventory.length === 0) {
    return "Thou carriest nothing but thy wits — and those are looking thin.";
  }
  const lines = player.inventory.map(entry => {
    const item = ITEMS[entry.itemId];
    return `- ${item?.name ?? entry.itemId}${entry.quantity > 1 ? ` (x${entry.quantity})` : ""}`;
  });
  return `Thou dost carry:\n${lines.join("\n")}\n\nGold on hand: ${player.gold}\nBanked gold: ${player.bankedGold}`;
}

function buildStatDescription(player: PlayerState): string {
  const virtueLines = Object.entries(player.virtues)
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => `  ${k}: ${v > 0 ? "+" : ""}${v}`)
    .join("\n");

  return `— ${player.name} —
HP: ${player.hp} / ${player.maxHp}
Strength: ${player.strength} | Agility: ${player.agility} | Charisma: ${player.charisma}
Expertise: ${player.expertise}
Gold (carried): ${player.gold} | Gold (banked): ${player.bankedGold}
Weapon: ${ITEMS[player.weapon]?.name ?? player.weapon}
Armor: ${player.armor ? ITEMS[player.armor]?.name : "None"}
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
React with in-character replies from any NPCs who would naturally respond, ambient room color, and consequences. Use Universal Common for NPC dialogue.`,
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
Respond primarily in character as ${npcData?.name}. Universal Common for dialogue.`,
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
      return buildExamineEngineResult(`look at ${targetPhrase}`, newState, currentRoom);
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

  if (first === "ATTACK") {
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
    const npcData = NPCS[target.id]!;
    return {
      responseType: "dynamic",
      staticResponse: null,
      dynamicContext: `COMBAT / ATTACK: ${p.name} attacks ${npcData.name}.
NPC stats: HP ${npcData.stats.hp}, armor ${npcData.stats.armor}, damage ${npcData.stats.damage}, hostile=${npcData.isHostile}
Disposition: ${newState.npcs[target.id]?.disposition ?? "neutral"}
Room: ${currentRoom?.name}. Resolve this attack round with vivid narration; apply sensible HP consequences in the fiction. If the NPC is not hostile, this is a grave social choice (virtue).`,
      newState,
      stateChanged: false,
    };
  }

  if (first === "BUY") {
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
      if (
        rest.includes(adv.name.toLowerCase()) ||
        rest.includes(advId.replace(/_/g, " "))
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
      staticResponse: `Three adventures are posted on the notice board:

1. The Beginner's Cave — A goblin-infested cave north of the city. Novice difficulty. Guild pays bounty on goblin ears.

2. The Thieves Guild — A social infiltration of the city's criminal underworld. Moderate difficulty. Requires wit over strength.

3. The Haunted Manor — Something is wrong at the old Blackwood estate. Moderate to deadly. Not recommended for the faint of heart.

Use ENTER THE BEGINNER'S CAVE (or whichever) to begin.`,
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
Player HP: ${p.hp}/${p.maxHp} | Gold: ${p.gold} | Weapon: ${ITEMS[p.weapon]?.name ?? p.weapon}
NPCs present: ${currentRoom?.npcs.map(id => {
      const s = newState.npcs[id];
      return `${NPCS[id]?.name} (${s?.disposition ?? "neutral"})`;
    }).join(", ") || "none"}
Active events: ${newState.activeEvents.map(e => e.description).join("; ") || "none"}
Bounty on player: ${p.bounty > 0 ? p.bounty + " gold" : "none"}
Handle this naturally as the living world. If it is a moral choice, note the relevant virtue.`,
    newState,
    stateChanged: false,
  };
}