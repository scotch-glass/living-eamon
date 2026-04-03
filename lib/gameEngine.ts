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
  DYNAMIC_TRIGGERS,
  Room,
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
}

// ============================================================
// KEYWORD DETECTION
// Classify player input without an API call
// ============================================================

const MOVEMENT_WORDS = ["go", "walk", "move", "head", "travel", "enter", "leave", "north", "south", "east", "west", "up", "down", "n", "s", "e", "w"];
const LOOK_WORDS = ["look", "examine", "inspect", "describe", "what", "where", "survey", "check"];
const INVENTORY_WORDS = ["inventory", "items", "carrying", "bag", "pack", "i"];
const TAKE_WORDS = ["take", "pick", "grab", "get", "loot", "steal"];
const DROP_WORDS = ["drop", "leave", "discard", "put down"];
const ATTACK_WORDS = ["attack", "fight", "hit", "strike", "kill", "stab", "slash", "shoot", "charge"];
const TALK_WORDS = ["talk", "speak", "ask", "say", "tell", "greet", "hello", "hi", "chat", "converse"];
const BUY_WORDS = ["buy", "purchase", "trade", "shop", "price", "how much", "cost"];
const BANK_WORDS = ["bank", "deposit", "withdraw", "balance", "vault", "save gold"];
const STAT_WORDS = ["stats", "status", "character", "sheet", "hp", "health", "gold", "level", "virtues"];
const ADVENTURE_WORDS = ["adventure", "quest", "dungeon", "cave", "guild", "enter", "explore"];
const FIRE_WORDS = ["fireball", "fire", "burn", "ignite", "torch the", "set fire", "flame"];
const MAGIC_WORDS = ["cast", "spell", "magic", "invoke", "summon", "enchant"];

function detectIntent(input: string): string {
  const lower = input.toLowerCase();
  if (FIRE_WORDS.some(w => lower.includes(w)) && MAGIC_WORDS.some(w => lower.includes(w))) return "cast_fire";
  if (MAGIC_WORDS.some(w => lower.includes(w))) return "cast_spell";
  if (MOVEMENT_WORDS.some(w => lower.startsWith(w) || lower === w)) return "movement";
  if (LOOK_WORDS.some(w => lower.startsWith(w))) return "look";
  if (INVENTORY_WORDS.some(w => lower === w || lower.startsWith(w))) return "inventory";
  if (TAKE_WORDS.some(w => lower.startsWith(w))) return "take";
  if (DROP_WORDS.some(w => lower.startsWith(w))) return "drop";
  if (ATTACK_WORDS.some(w => lower.startsWith(w))) return "attack";
  if (TALK_WORDS.some(w => lower.startsWith(w))) return "talk";
  if (BUY_WORDS.some(w => lower.includes(w))) return "buy";
  if (BANK_WORDS.some(w => lower.includes(w))) return "bank";
  if (STAT_WORDS.some(w => lower.includes(w))) return "stats";
  if (ADVENTURE_WORDS.some(w => lower.includes(w))) return "adventure";
  return "unknown";
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
  // Tick the world forward
  let newState = tickWorldState(state);
  const intent = detectIntent(input);
  const player = newState.player;
  const currentRoom = getRoom(player.currentRoom);

  // ── STATS ──────────────────────────────────────────────
  if (intent === "stats") {
    return {
      responseType: "static",
      staticResponse: buildStatDescription(player),
      dynamicContext: null,
      newState,
      stateChanged: false,
    };
  }

  // ── INVENTORY ──────────────────────────────────────────
  if (intent === "inventory") {
    return {
      responseType: "static",
      staticResponse: buildInventoryDescription(player),
      dynamicContext: null,
      newState,
      stateChanged: false,
    };
  }

// ── LOOK ───────────────────────────────────────────────
  if (intent === "look") {
    const lower = input.toLowerCase();
    const isRoomLook = lower === "look" || lower === "look around" || lower === "examine room" || lower === "survey";
    
    if (isRoomLook) {
      return {
        responseType: "static",
        staticResponse: buildRoomDescription(newState, player.currentRoom),
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }

    // Looking at a specific thing — send to Jane
    return {
      responseType: "dynamic",
      staticResponse: null,
      dynamicContext: "Player wants to examine something specific: \"" + input + "\"\n" +
        "Current room: " + (currentRoom?.name ?? "unknown") + "\n" +
        "Room description for context: " + (currentRoom?.description ?? "") + "\n" +
        "Respond with a vivid, specific description of what they are examining. If they try to interact with it (touch, take, move), describe the result naturally. Keep it to 1-2 paragraphs.",
      newState,
      stateChanged: false,
    };
  }

  // ── MOVEMENT ───────────────────────────────────────────
  if (intent === "movement") {
    const direction = extractDirection(input);
    if (!direction || !currentRoom) {
      return {
        responseType: "static",
        staticResponse: "Which way wouldst thou go? (north, south, east, west, up, down)",
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }

    const destinationId = currentRoom.exits[direction];
    if (!destinationId) {
      return {
        responseType: "static",
        staticResponse: `There is no passage to the ${direction} from here.`,
        dynamicContext: null,
        newState,
        stateChanged: false,
      };
    }

    newState = movePlayer(newState, destinationId);
    const roomDesc = buildRoomDescription(newState, destinationId);

    return {
      responseType: "static",
      staticResponse: roomDesc,
      dynamicContext: null,
      newState,
      stateChanged: true,
    };
  }

  // ── FIRE MAGIC ─────────────────────────────────────────
  if (intent === "cast_fire") {
    const targetRoom = player.currentRoom;
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

    // Apply full consequence cascade
    newState = applyFireballConsequences(newState, targetRoom, player.id);

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

  // ── OTHER MAGIC ────────────────────────────────────────
  if (intent === "cast_spell") {
    return {
      responseType: "dynamic",
      staticResponse: null,
      dynamicContext: `Player attempted to cast a spell: "${input}". 
Current room: ${currentRoom?.name}. 
Room state: ${newState.rooms[player.currentRoom]?.currentState ?? "normal"}.
Handle this as an Official Magic action if the spell is standard Eamon magic (BLAST, HEAL, SPEED, LIGHT).
If it seems like Occult/forbidden magic, hint at danger and ask for clarification.`,
      newState,
      stateChanged: false,
    };
  }

  // ── TALK TO NPC ────────────────────────────────────────
  if (intent === "talk") {
    // Find which NPC the player is addressing
    const lowerInput = input.toLowerCase();
    const npcInRoom = currentRoom?.npcs.find(id => {
      const npc = NPCS[id];
      return npc && lowerInput.includes(npc.name.toLowerCase().split(" ")[0].toLowerCase());
    });

    if (npcInRoom) {
      const npcState = newState.npcs[npcInRoom];
      const npcData = NPCS[npcInRoom];

      // First greeting = static
      const hasSpokenBefore = npcState?.memory.length > 0 ||
        (npcState?.disposition !== "neutral" && npcState?.disposition !== "friendly");

      if (!hasSpokenBefore && input.toLowerCase().includes("greet") || input.toLowerCase().includes("hello") || input.toLowerCase().includes("hi")) {
        return {
          responseType: "static",
          staticResponse: buildNPCGreeting(newState, npcInRoom),
          dynamicContext: null,
          newState,
          stateChanged: false,
        };
      }

      // Deeper conversation = dynamic
      return {
        responseType: "dynamic",
        staticResponse: null,
        dynamicContext: `Player is speaking with ${npcData?.name ?? npcInRoom}.
NPC personality: ${npcData?.personality}
Current disposition toward player: ${npcState?.disposition ?? "neutral"}
NPC memory of player: ${npcState?.memory.map(m => m.action).join(", ") || "none"}
NPC current agenda: ${npcState?.agenda?.description ?? "none"}
Room state: ${newState.rooms[player.currentRoom]?.currentState ?? "normal"}
Player said: "${input}"
Respond in character as ${npcData?.name}. Use Universal Common for all dialogue.
If the NPC has an agenda, they should actively pursue it in this conversation.`,
        newState,
        stateChanged: false,
      };
    }

    // Talking to no one in particular — dynamic
    return {
      responseType: "dynamic",
      staticResponse: null,
      dynamicContext: `Player said: "${input}" in ${currentRoom?.name ?? "unknown location"}.
Room state: ${newState.rooms[player.currentRoom]?.currentState ?? "normal"}.
NPCs present: ${currentRoom?.npcs.map(id => NPCS[id]?.name).join(", ") || "none"}.
Respond naturally as the world.`,
      newState,
      stateChanged: false,
    };
  }

  // ── BANK ───────────────────────────────────────────────
  if (intent === "bank") {
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
    const amount = amountMatch ? parseInt(amountMatch[0]) : 0;

    if (lower.includes("deposit") && amount > 0) {
      if (amount > player.gold) {
        return {
          responseType: "static",
          staticResponse: `Thou dost not have ${amount} gold to deposit. Thou carriest only ${player.gold}.`,
          dynamicContext: null, newState, stateChanged: false,
        };
      }
      newState = updatePlayerGold(newState, -amount);
      newState = { ...newState, player: { ...newState.player, bankedGold: newState.player.bankedGold + amount } };
      return {
        responseType: "static",
        staticResponse: `Brunt records the deposit without looking up. ${amount} gold secured in thy vault account. Carried gold: ${newState.player.gold}. Banked: ${newState.player.bankedGold}.`,
        dynamicContext: null, newState, stateChanged: true,
      };
    }

    if (lower.includes("withdraw") && amount > 0) {
      if (amount > player.bankedGold) {
        return {
          responseType: "static",
          staticResponse: `Thou hast only ${player.bankedGold} gold banked.`,
          dynamicContext: null, newState, stateChanged: false,
        };
      }
      newState = updatePlayerGold(newState, amount);
      newState = { ...newState, player: { ...newState.player, bankedGold: newState.player.bankedGold - amount } };
      return {
        responseType: "static",
        staticResponse: `Brunt counts out ${amount} gold coins and slides them across the counter. Carried gold: ${newState.player.gold}. Banked: ${newState.player.bankedGold}.`,
        dynamicContext: null, newState, stateChanged: true,
      };
    }

    return {
      responseType: "static",
      staticResponse: `Brunt looks up. "Deposit or withdraw. State the amount."`,
      dynamicContext: null, newState, stateChanged: false,
    };
  }

  // ── TAKE ITEM ──────────────────────────────────────────
  if (intent === "take") {
    const lowerInput = input.toLowerCase();
    const itemInRoom = currentRoom?.items.find(id => {
      const item = ITEMS[id];
      return item && lowerInput.includes(item.name.toLowerCase());
    });

    if (!itemInRoom) {
      return {
        responseType: "static",
        staticResponse: "Thou dost not see that here.",
        dynamicContext: null, newState, stateChanged: false,
      };
    }

    const item = ITEMS[itemInRoom];
    if (!item?.isCarryable) {
      return {
        responseType: "static",
        staticResponse: `${item?.name ?? "That"} cannot be carried.`,
        dynamicContext: null, newState, stateChanged: false,
      };
    }

    // Add to inventory
    const existingEntry = newState.player.inventory.find(e => e.itemId === itemInRoom);
    const newInventory = existingEntry
      ? newState.player.inventory.map(e => e.itemId === itemInRoom ? { ...e, quantity: e.quantity + 1 } : e)
      : [...newState.player.inventory, { itemId: itemInRoom, quantity: 1 }];

    newState = { ...newState, player: { ...newState.player, inventory: newInventory } };

    return {
      responseType: "static",
      staticResponse: `Thou dost take the ${item.name}. ${item.description}`,
      dynamicContext: null, newState, stateChanged: true,
    };
  }

  // ── BUY ────────────────────────────────────────────────
  if (intent === "buy") {
    return {
      responseType: "dynamic",
      staticResponse: null,
      dynamicContext: `Player wants to buy something. Input: "${input}".
They are in ${currentRoom?.name}.
Player gold: ${player.gold}.
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

  // ── ADVENTURE ENTRANCE ─────────────────────────────────
  if (intent === "adventure") {
    const lower = input.toLowerCase();
    for (const [advId, adv] of Object.entries(ADVENTURES)) {
      if (lower.includes(adv.name.toLowerCase()) || lower.includes(advId.replace("_", " "))) {
        return {
          responseType: "dynamic",
          staticResponse: null,
          dynamicContext: `Player wants to enter the adventure: ${adv.name}.
Adventure description: ${adv.description}
Entrance text: ${adv.entrance}
Difficulty: ${adv.difficulty}. Recommended level: ${adv.recommendedLevel}.
Player current level/expertise: ${player.expertise}.
Present the entrance dramatically using the static entrance text, then begin the first room encounter.
The player starts in: ${adv.rooms[0]?.name} — ${adv.rooms[0]?.description}`,
          newState: { ...newState, player: { ...newState.player, currentAdventure: advId } },
          stateChanged: true,
        };
      }
    }

    // Generic adventure inquiry
    return {
      responseType: "static",
      staticResponse: `Three adventures are posted on the notice board:

1. The Beginner's Cave — A goblin-infested cave north of the city. Novice difficulty. Guild pays bounty on goblin ears.

2. The Thieves Guild — A social infiltration of the city's criminal underworld. Moderate difficulty. Requires wit over strength.

3. The Haunted Manor — Something is wrong at the old Blackwood estate. Moderate to deadly. Not recommended for the faint of heart.

Say "enter the Beginner's Cave" (or whichever) to begin.`,
      dynamicContext: null,
      newState,
      stateChanged: false,
    };
  }

  // ── UNKNOWN / COMPLEX ──────────────────────────────────
  // Anything we can't classify goes to Jane
  return {
    responseType: "dynamic",
    staticResponse: null,
    dynamicContext: `Player input: "${input}"
Current room: ${currentRoom?.name ?? "unknown"}
Room state: ${newState.rooms[player.currentRoom]?.currentState ?? "normal"}
Player HP: ${player.hp}/${player.maxHp} | Gold: ${player.gold} | Weapon: ${ITEMS[player.weapon]?.name ?? player.weapon}
NPCs present: ${currentRoom?.npcs.map(id => {
  const s = newState.npcs[id];
  return `${NPCS[id]?.name} (${s?.disposition ?? "neutral"})`;
}).join(", ") || "none"}
Active events: ${newState.activeEvents.map(e => e.description).join("; ") || "none"}
Bounty on player: ${player.bounty > 0 ? player.bounty + " gold" : "none"}
Handle this naturally as the living world. If it is a moral choice, note the relevant virtue.`,
    newState,
    stateChanged: false,
  };
}