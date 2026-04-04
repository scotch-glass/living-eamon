// ============================================================
// LIVING EAMON — GAME STATE
// This is the live, mutable state of the world.
// Everything here can change during play.
// Static definitions live in gameData.ts.
// The engine in gameEngine.ts reads and writes this state.
// ============================================================

import { RoomState } from "./gameData";

// ============================================================
// TYPES
// ============================================================

export type Disposition =
  | "friendly"    // Actively helpful
  | "neutral"     // Default, polite but guarded
  | "cold"        // Unhelpful, won't engage
  | "hostile"     // Will attack or call guards
  | "afraid"      // Will flee or comply out of fear
  | "furious";    // Angry, demands restitution before anything else

export type AgendaType =
  | "seek_restitution"   // NPC wants something fixed or paid for
  | "hunt_player"        // NPC or their agents are looking for the player
  | "spread_rumor"       // NPC is telling others what the player did
  | "seek_help"          // NPC needs the player's help
  | "reward_player"      // NPC wants to reward the player
  | "ignore_player";     // NPC is deliberately avoiding the player

export type RecoveryType =
  | "time"          // Recovers automatically after N player actions
  | "payment"       // Requires gold payment
  | "labor"         // Requires completing a task or adventure
  | "punishment"    // Requires serving punishment (prison, fine)
  | "permanent"     // Never recovers — world is changed forever
  | "combined";     // Requires multiple recovery types

export type ReputationLevel =
  | "legendary"    // +50 and above
  | "honored"      // +20 to +49
  | "respected"    // +5 to +19
  | "neutral"      // -4 to +4
  | "suspect"      // -5 to -19
  | "wanted"       // -20 to -49
  | "infamous";    // -50 and below

// ============================================================
// ROOM STATE ENTRY
// Tracks the current state of a room and how it got there
// ============================================================

export interface RoomStateEntry {
  roomId: string;
  currentState: RoomState;
  previousState: RoomState;
  causedBy: string | null;       // Player id or NPC id that caused the change
  causeDescription: string | null; // Human-readable cause e.g. "cast fireball"
  turnsInState: number;          // How many player actions since state changed
  recovery: {
    type: RecoveryType;
    description: string;         // Shown to player as hint e.g. "The hall needs repairs"
    goldRequired?: number;       // For payment recovery
    adventureRequired?: string;  // Adventure id for labor recovery
    turnsRequired?: number;      // For time recovery
    complete: boolean;
  } | null;
}

// ============================================================
// NPC STATE ENTRY
// Tracks disposition, memory, and active agenda for each NPC
// ============================================================

export interface NPCMemoryEntry {
  action: string;              // What the player did e.g. "burnt the main hall"
  turn: number;                // When it happened
  severity: "minor" | "moderate" | "severe" | "unforgivable";
  forgiven: boolean;           // Has the player made restitution
}

export interface NPCAgenda {
  type: AgendaType;
  description: string;         // What the NPC is actively doing about it
  targetPlayerId: string;
  resolvedBy: string | null;   // What action resolves this agenda
  active: boolean;
}

export interface NPCStateEntry {
  npcId: string;
  disposition: Disposition;
  memory: NPCMemoryEntry[];
  agenda: NPCAgenda | null;
  location: string;            // Current room id
  isAlive: boolean;
  /** Current HP in an active fight. null = not in combat / full HP. */
  combatHp: number | null;
  customGreeting: string | null; // Override default greeting based on state
}

// ============================================================
// PLAYER STATE
// The persistent adventurer
// ============================================================

export interface PlayerInventoryItem {
  itemId: string;
  quantity: number;
}

export interface PlayerState {
  id: string;
  name: string;
  currentRoom: string;
  previousRoom: string | null;

  // Core stats
  hp: number;
  maxHp: number;
  strength: number;
  dexterity: number;
  charisma: number;
  expertise: number;

  // Economy
  gold: number;                // Gold currently carried (lost on death)
  bankedGold: number;          // Gold in the vault (never lost)

  // Equipment
  weapon: string;              // Item id of equipped weapon
  armor: string | null;        // Item id of equipped armor
  shield: string | null;       // Item id of equipped shield (off-hand)
  inventory: PlayerInventoryItem[];

  // Virtues (tracked silently by Jane)
  virtues: {
    Honesty: number;
    Compassion: number;
    Valor: number;
    Justice: number;
    Sacrifice: number;
    Honor: number;
    Spirituality: number;
    Humility: number;
    Grace: number;
    Mercy: number;
  };

  // Reputation
  reputationScore: number;     // Numeric score
  reputationLevel: ReputationLevel;
  knownAs: string | null;      // Title earned e.g. "the Merciful" or "the Burned"

  // Adventure tracking
  currentAdventure: string | null;  // Adventure id if in an adventure
  completedAdventures: string[];
  activeQuests: string[];

  // Consequences
  bounty: number;              // Gold bounty on player's head (0 = none)
  isWanted: boolean;
  prisonTurnsRemaining: number; // 0 = not in prison

  // Session
  turnCount: number;           // Total actions taken this session
  lastAction: string | null;

  /** Official guild magic — autocomplete for CAST */
  knownSpells: string[];
  /** Divine names learned in play — autocomplete for PRAY */
  knownDeities: string[];
}

// ============================================================
// WORLD STATE
// The complete state of the living world
// ============================================================

export interface ActiveEvent {
  id: string;
  description: string;         // What's happening in the world
  affectedRooms: string[];
  turnsRemaining: number | null; // null = permanent until resolved
  resolvedBy: string | null;
}

export interface WorldState {
  // Room states
  rooms: Record<string, RoomStateEntry>;

  // NPC states
  npcs: Record<string, NPCStateEntry>;

  // Player
  player: PlayerState;

  // Active world events (Sheriff hunting, fires spreading, rumors)
  activeEvents: ActiveEvent[];

  // Chronicle — log of significant events for the daily newspaper
  chronicleLog: {
    turn: number;
    event: string;
    isPublic: boolean;         // false = Jane only, true = Chronicle-worthy
  }[];

  // Turn counter (global)
  worldTurn: number;
}

// ============================================================
// INITIAL STATE FACTORY
// Creates a fresh world state for a new player
// ============================================================

export function createInitialWorldState(playerName: string = "Adventurer"): WorldState {
  return {
    rooms: {
      main_hall: {
        roomId: "main_hall",
        currentState: "normal",
        previousState: "normal",
        causedBy: null,
        causeDescription: null,
        turnsInState: 0,
        recovery: null,
      },
      armory: {
        roomId: "armory",
        currentState: "normal",
        previousState: "normal",
        causedBy: null,
        causeDescription: null,
        turnsInState: 0,
        recovery: null,
      },
      notice_board: {
        roomId: "notice_board",
        currentState: "normal",
        previousState: "normal",
        causedBy: null,
        causeDescription: null,
        turnsInState: 0,
        recovery: null,
      },
      guild_vault: {
        roomId: "guild_vault",
        currentState: "normal",
        previousState: "normal",
        causedBy: null,
        causeDescription: null,
        turnsInState: 0,
        recovery: null,
      },
    },

    npcs: {
      hokas_tokas: {
        npcId: "hokas_tokas",
        disposition: "friendly",
        memory: [],
        agenda: null,
        location: "main_hall",
        isAlive: true,
        combatHp: null,
        customGreeting: null,
      },
      sam_slicker: {
        npcId: "sam_slicker",
        disposition: "neutral",
        memory: [],
        agenda: null,
        location: "main_hall",
        isAlive: true,
        combatHp: null,
        customGreeting: null,
      },
      old_mercenary: {
        npcId: "old_mercenary",
        disposition: "neutral",
        memory: [],
        agenda: null,
        location: "main_hall",
        isAlive: true,
        combatHp: null,
        customGreeting: null,
      },
      brunt_the_banker: {
        npcId: "brunt_the_banker",
        disposition: "neutral",
        memory: [],
        agenda: null,
        location: "guild_vault",
        isAlive: true,
        combatHp: null,
        customGreeting: null,
      },
      armory_attendant: {
        npcId: "armory_attendant",
        disposition: "neutral",
        memory: [],
        agenda: null,
        location: "armory",
        isAlive: true,
        combatHp: null,
        customGreeting: null,
      },
      door_guard: {
        npcId: "door_guard",
        disposition: "neutral",
        memory: [],
        agenda: null,
        location: "main_hall_exit",
        isAlive: true,
        combatHp: null,
        customGreeting: null,
      },
    },

    player: {
      id: "player_1",
      name: playerName,
      currentRoom: "main_hall",
      previousRoom: null,

      hp: 20,
      maxHp: 20,
      strength: 12,
      dexterity: 10,
      charisma: 10,
      expertise: 0,

      gold: 10000,
      bankedGold: 0,

      weapon: "short_sword",
      armor: null,
      shield: null,
      inventory: [
        { itemId: "short_sword", quantity: 1 },
      ],

      virtues: {
        Honesty: 0,
        Compassion: 0,
        Valor: 0,
        Justice: 0,
        Sacrifice: 0,
        Honor: 0,
        Spirituality: 0,
        Humility: 0,
        Grace: 0,
        Mercy: 0,
      },

      reputationScore: 0,
      reputationLevel: "neutral",
      knownAs: null,

      currentAdventure: null,
      completedAdventures: [],
      activeQuests: [],

      bounty: 0,
      isWanted: false,
      prisonTurnsRemaining: 0,

      turnCount: 0,
      lastAction: null,

      knownSpells: ["BLAST", "HEAL", "LIGHT", "SPEED"],
      knownDeities: [],
    },

    activeEvents: [],

    chronicleLog: [],

    worldTurn: 0,
  };
}

// ============================================================
// STATE MUTATION HELPERS
// Pure functions that return new state — never mutate directly
// ============================================================

export function changeRoomState(
  state: WorldState,
  roomId: string,
  newRoomState: RoomState,
  causedBy: string,
  causeDescription: string,
  recovery: RoomStateEntry["recovery"]
): WorldState {
  return {
    ...state,
    rooms: {
      ...state.rooms,
      [roomId]: {
        roomId,
        currentState: newRoomState,
        previousState: state.rooms[roomId]?.currentState ?? "normal",
        causedBy,
        causeDescription,
        turnsInState: 0,
        recovery,
      },
    },
  };
}

export function changeNPCDisposition(
  state: WorldState,
  npcId: string,
  newDisposition: Disposition,
  memory?: NPCMemoryEntry,
  newAgenda?: NPCAgenda,
  customGreeting?: string
): WorldState {
  const existing = state.npcs[npcId];
  if (!existing) return state;
  return {
    ...state,
    npcs: {
      ...state.npcs,
      [npcId]: {
        ...existing,
        disposition: newDisposition,
        memory: memory ? [...existing.memory, memory] : existing.memory,
        agenda: newAgenda ?? existing.agenda,
        customGreeting: customGreeting ?? existing.customGreeting,
      },
    },
  };
}

export function updatePlayerGold(
  state: WorldState,
  delta: number
): WorldState {
  return {
    ...state,
    player: {
      ...state.player,
      gold: Math.max(0, state.player.gold + delta),
    },
  };
}

export function updatePlayerHP(
  state: WorldState,
  delta: number
): WorldState {
  const newHp = Math.max(0, Math.min(state.player.maxHp, state.player.hp + delta));
  return {
    ...state,
    player: {
      ...state.player,
      hp: newHp,
    },
  };
}

export function updateVirtue(
  state: WorldState,
  virtue: keyof WorldState["player"]["virtues"],
  delta: number
): WorldState {
  const newScore = state.player.virtues[virtue] + delta;
  return {
    ...state,
    player: {
      ...state.player,
      virtues: {
        ...state.player.virtues,
        [virtue]: newScore,
      },
    },
  };
}

export function movePlayer(
  state: WorldState,
  newRoomId: string
): WorldState {
  return {
    ...state,
    player: {
      ...state.player,
      previousRoom: state.player.currentRoom,
      currentRoom: newRoomId,
      turnCount: state.player.turnCount + 1,
    },
    worldTurn: state.worldTurn + 1,
  };
}

export function addToChronicle(
  state: WorldState,
  event: string,
  isPublic: boolean
): WorldState {
  return {
    ...state,
    chronicleLog: [
      ...state.chronicleLog,
      { turn: state.worldTurn, event, isPublic },
    ],
  };
}

export function updatePlayerReputation(
  state: WorldState,
  delta: number
): WorldState {
  const newScore = state.player.reputationScore + delta;
  let level: ReputationLevel = "neutral";
  if (newScore >= 50) level = "legendary";
  else if (newScore >= 20) level = "honored";
  else if (newScore >= 5) level = "respected";
  else if (newScore >= -4) level = "neutral";
  else if (newScore >= -19) level = "suspect";
  else if (newScore >= -49) level = "wanted";
  else level = "infamous";

  return {
    ...state,
    player: {
      ...state.player,
      reputationScore: newScore,
      reputationLevel: level,
    },
  };
}

export function addBounty(
  state: WorldState,
  amount: number
): WorldState {
  return {
    ...state,
    player: {
      ...state.player,
      bounty: state.player.bounty + amount,
      isWanted: state.player.bounty + amount > 0,
    },
  };
}

export function setNPCCombatHp(
  state: WorldState,
  npcId: string,
  hp: number | null
): WorldState {
  const existing = state.npcs[npcId];
  if (!existing) return state;
  return {
    ...state,
    npcs: {
      ...state.npcs,
      [npcId]: { ...existing, combatHp: hp },
    },
  };
}

// ============================================================
// STATE RECOVERY TICK
// Call this every player turn to advance time-based recovery
// ============================================================

export function tickWorldState(state: WorldState): WorldState {
  let newState = { ...state, worldTurn: state.worldTurn + 1 };

  // Advance room state recovery timers
  for (const [roomId, roomState] of Object.entries(newState.rooms)) {
    if (roomState.currentState === "normal") continue;
    if (!roomState.recovery) continue;

    const updatedTurns = roomState.turnsInState + 1;

    // Time-based recovery
    if (
      roomState.recovery.type === "time" &&
      roomState.recovery.turnsRequired &&
      updatedTurns >= roomState.recovery.turnsRequired
    ) {
      newState = changeRoomState(
        newState, roomId, "normal", "time", "Natural recovery", null
      );
      continue;
    }

    newState = {
      ...newState,
      rooms: {
        ...newState.rooms,
        [roomId]: {
          ...newState.rooms[roomId],
          turnsInState: updatedTurns,
        },
      },
    };
  }

  return newState;
}

// ============================================================
// CONSEQUENCE ENGINE
// When a major event happens, this determines the world's
// reaction — NPC agenda changes, bounties, active events
// ============================================================

export function applyFireballConsequences(
  state: WorldState,
  roomId: string,
  playerId: string
): WorldState {
  let newState = state;

  // Burn the room
  newState = changeRoomState(
    newState,
    roomId,
    "burnt",
    playerId,
    "cast fireball",
    {
      type: "combined",
      description: "The hall needs repairs. Pay 50 gold, work off the debt, or face the Sheriff.",
      goldRequired: 50,
      adventureRequired: "timber_run",
      complete: false,
    }
  );

  // Hokas goes furious
  newState = changeNPCDisposition(
    newState,
    "hokas_tokas",
    "furious",
    {
      action: "burnt the Main Hall",
      turn: state.worldTurn,
      severity: "severe",
      forgiven: false,
    },
    {
      type: "seek_restitution",
      description: "Hokas has sent word to the Sheriff and is demanding 50 gold in repairs.",
      targetPlayerId: playerId,
      resolvedBy: "pay_50_gold_or_complete_timber_run",
      active: true,
    },
    `Hokas slams a scorched mug on the bar. "Thou hast some nerve showing thy face in here. Fifty gold for the damages — NOW — or I call the Sheriff this instant."`
  );

  // Add bounty
  newState = addBounty(newState, 50);

  // Add active event — Sheriff is alerted
  newState = {
    ...newState,
    activeEvents: [
      ...newState.activeEvents,
      {
        id: "sheriff_alerted",
        description: "The Sheriff has been notified of the Main Hall fire. Guards are asking questions.",
        affectedRooms: ["main_hall", "main_hall_exit", "notice_board"],
        turnsRemaining: null,
        resolvedBy: "pay_fine_or_serve_prison",
      },
    ],
  };

  // Chronicle it
  newState = addToChronicle(
    newState,
    `${state.player.name} set fire to the Main Hall of the Guild of Free Adventurers.`,
    true
  );

  // Hit reputation hard
  newState = updatePlayerReputation(newState, -15);

  return newState;
}