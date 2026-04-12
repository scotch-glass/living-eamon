// ============================================================
// LIVING EAMON — Room & Adventure Module Types
// All room-level interfaces live here so adventure modules
// can import them without circular dependencies.
// ============================================================

export type RoomState = "normal" | "burnt" | "flooded" | "dark" | "ransacked";
export type SceneTone = "pastoral" | "civilized" | "aquilonian" | "grimdark";

export interface RoomStateModifier {
  description: string;
  npcMoodShift?: string;
  dangerLevel?: number;
}

// ── Cold Open ────────────────────────────────────────────────
// Defines all pre-scripted narrative branches for a room's
// session-start experience. Writers fill these arrays;
// route.ts assembles and delivers them.
export interface RoomColdOpen {
  /** Shown on the very first session (player.turnCount === 0). May contain __YESNO__. */
  newGame: string[];
  /** Shown when player answers YES to __YESNO__ (muscle memory branch). */
  yesResponse: string[];
  /** Shown when player answers NO to __YESNO__ (full tutorial branch). */
  noResponse: string[];
  /** Shown when player dies and respawns here (turnCount > 0). */
  respawn?: string[];
}

// ── Room ─────────────────────────────────────────────────────
export interface Room {
  id: string;
  name: string;
  /** Verbose — full detailed description. Shown via EXAMINE ROOM / SEARCH only. */
  description: string;
  /** Semiverbose — 2-4 sentences for LOOK and first visit. Orientation. */
  look?: string;
  /** Nonverbose — 1-2 sentences for revisits, fleeing, passing through. */
  glance?: string;
  exits: Record<string, string>;
  stateModifiers: Partial<Record<RoomState, RoomStateModifier>>;
  npcs: string[];
  items: string[];
  examinableObjects?: { id: string; label: string }[];
  isAdventureEntrance?: string;

  // Scene image data (replaces the old flat SCENE_DATA in sceneData.ts)
  visualDescription?: string;
  sceneTone?: SceneTone;
  /** Overrides the standard tone modifier for Grok Imagine — use for rooms
   *  with unique lighting that doesn't fit the three tonal archetypes. */
  sceneAtmosphereOverride?: string;

  // Cold open (optional — only rooms that are session-start entry points need this)
  coldOpen?: RoomColdOpen;
}

// ── NPC Scripted Interactions ────────────────────────────────
// Condition-triggered scripts that fire when a player enters
// a room or responds to a prompt. Lives in the adventure module
// so route.ts stays clean of prose.

export interface NPCScriptCondition {
  /** Room the player must be in. */
  room: string;
  /** Fires only once per player when true. Uses the script id as the flag key. */
  once?: boolean;
  /** Player state checks — all must be true. */
  playerState?: {
    barmaidPreference?: null | string;  // null = not yet chosen
    turnCountMax?: number;              // turnCount <= this value
    previousRoomNotNull?: boolean;      // player came from somewhere
    remembersOwnName?: boolean;         // false = hasn't remembered yet
    metZim?: boolean;                    // false = hasn't visited Pots & Bobbles yet
  };
}

export interface NPCScript {
  /** Unique id — also used as the "already seen" flag on player state. */
  id: string;
  /** The NPC who initiates this script. */
  npcId: string;
  /** When this script should fire. */
  condition: NPCScriptCondition;
  /** What kind of trigger: "on_enter" fires when entering the room,
   *  "on_response" fires when the player sends a matching input. */
  trigger: "on_enter" | "on_response";
  /** For "on_response": the valid player inputs (uppercased). */
  validInputs?: string[];
  /** The narrative lines to send. May contain tokens like __BARMAID_SELECT__. */
  lines: string[];
  /** If set, this function runs after the script fires to mutate state.
   *  Receives the player's input (for on_response) and returns partial PlayerState updates. */
  stateUpdate?: (input: string) => Record<string, unknown>;
}

// ── Adventure Module ─────────────────────────────────────────
// One adventure = one self-contained package.
// Writers define rooms, NPCs, and items here.
// The engine loads modules via lib/adventures/registry.ts.
export interface AdventureModule {
  id: string;
  name: string;
  description: string;
  difficulty?: "novice" | "moderate" | "deadly";
  /** The room id where the player first enters this adventure. */
  entryRoom: string;
  rooms: Record<string, Room>;
  /** Scripted NPC interactions for this adventure. */
  npcScripts?: NPCScript[];
}
