// ============================================================
// LIVING EAMON — SUPABASE CLIENT
// Two clients:
// - browserClient: for reading shared world data (anon key)
// - serviceClient: for writing player data (service key, server only)
// ============================================================

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Browser client — safe to use in frontend, read-only for shared data
export const browserClient = createClient(supabaseUrl, supabaseAnonKey);

// Service client — server-side only, full access
export const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================
// PLAYER OPERATIONS
// ============================================================

/**
 * Persist player row. Upsert conflicts on primary key `id`. When `player.userId`
 * is set, `user_id` is included in the row payload (e.g. backfill / link).
 */
export async function savePlayer(player: Record<string, unknown>) {
  const authUserId =
    typeof player.userId === "string" && player.userId.length > 0
      ? player.userId
      : undefined;

  const row: Record<string, unknown> = {
    id: player.id,
    character_name: player.name,
    hp: player.hp,
    max_hp: player.maxHp,
    strength: player.strength,
    dexterity: player.dexterity,
    charisma: player.charisma,
    max_mana: player.maxMana ?? 10,
    current_mana: player.currentMana ?? player.maxMana ?? 0,
    gold: player.gold,
    banked_gold: player.bankedGold,
    weapon: player.weapon,
    armor: player.bodyArmor ?? player.armor ?? null,
    shield: player.shield,
    inventory: player.inventory,
    virtues: player.virtues,
    reputation_score: player.reputationScore,
    reputation_level: player.reputationLevel,
    known_as: player.knownAs,
    current_room: player.currentRoom,
    current_adventure: player.currentAdventure,
    completed_adventures: player.completedAdventures,
    bounty: player.bounty,
    is_wanted: player.isWanted,
    turn_count: player.turnCount,
    visited_rooms: player.visitedRooms ?? [],
    barmaid_preference: player.barmaidPreference ?? null,
    helmet: player.helmet ?? null,
    gorget: player.gorget ?? null,
    body_armor: player.bodyArmor ?? null,
    limb_armor: player.limbArmor ?? null,
    boots: player.boots ?? null,
    ring_left: player.ringLeft ?? null,
    ring_right: player.ringRight ?? null,
    cuff_left: player.cuffLeft ?? null,
    cuff_right: player.cuffRight ?? null,
    necklace: player.necklace ?? null,
    active_combat: player.activeCombat ?? null,
    active_effects: player.activeEffects ?? [],
    barrel_stock: player.barrelStock ?? { gowns: 20, charityClothes: 10 },
    weapon_poison_charges: player.weaponPoisonCharges ?? 0,
    weapon_poison_severity: player.weaponPoisonSeverity ?? 0,
    mounted: Boolean(player.mounted),
    remembers_own_name: Boolean(player.remembersOwnName),
    met_zim: Boolean(player.metZim),
    received_sam_starter_outfit: Boolean(player.receivedSamStarterOutfit),
    received_hokas_unarmed_gift: Boolean(player.receivedHokasUnarmedGift),
    weapon_skills: player.weaponSkills ?? {},
    known_spells: player.knownSpells ?? [],
    known_deities: player.knownDeities ?? [],
    gore_splatters: player.goreSplatters ?? [],
    last_seen: new Date().toISOString(),
  };

  if (authUserId) {
    row.user_id = authUserId;
  }

  const { error } = await serviceClient
    .from("players")
    .upsert(row, { onConflict: "id" });

  if (error) console.error("Error saving player:", error, "id:", row.id, "room:", row.current_room);
  else console.log("[save] player", row.id, "room:", row.current_room, "turn:", row.turn_count);
  return !error;
}

export async function loadPlayer(playerId: string) {
  const { data, error } = await serviceClient
    .from("players")
    .select("*")
    .eq("id", playerId)
    .single();

  if (error) return null;
  return data;
}

/** Resolve by Supabase Auth user id (see `players.user_id`). */
export async function loadPlayerByUserId(userId: string) {
  const { data, error } = await serviceClient
    .from("players")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data;
}

/**
 * Creates a new player row, linked to the auth user immediately.
 * If a player already exists for this auth user, returns the existing one.
 * This prevents duplicate rows from repeated logins or page refreshes.
 */
export async function createPlayer(name: string, authUserId?: string) {
  // Guard: if authUserId provided, check for existing player first
  if (authUserId) {
    const { data: existing } = await serviceClient
      .from("players")
      .select("*")
      .eq("user_id", authUserId)
      .single();

    if (existing) {
      return existing;
    }
  }

  const row: Record<string, unknown> = {
    character_name: name,
    current_room: "church_of_perpetual_life",
    turn_count: 0,
  };

  if (authUserId) {
    row.user_id = authUserId;
  }

  const { data, error } = await serviceClient
    .from("players")
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error("Error creating player:", error);
    return null;
  }
  return data;
}

// ============================================================
// WORLD OBJECT CACHE
// ============================================================

export async function getWorldObject(roomId: string, objectKey: string, roomState: string = "normal") {
  const cacheKey = roomState === "normal"
    ? roomId + ":" + objectKey
    : roomId + ":" + objectKey + ":" + roomState;

  const { data, error } = await serviceClient
    .from("world_objects")
    .select("*")
    .eq("id", cacheKey)
    .single();

  if (error || !data) return null;

  // Increment access count
  await serviceClient
    .from("world_objects")
    .update({ access_count: (data.access_count ?? 1) + 1 })
    .eq("id", cacheKey);

  return data;
}

export async function saveWorldObject(
  roomId: string,
  objectKey: string,
  description: string,
  generatedBy: string,
  roomState: string = "normal",
  touchResult?: string
) {
  const cacheKey = roomState === "normal"
    ? roomId + ":" + objectKey
    : roomId + ":" + objectKey + ":" + roomState;

  const { error } = await serviceClient
    .from("world_objects")
    .upsert({
      id: cacheKey,
      room_id: roomId,
      object_key: objectKey,
      canonical_description: description,
      touch_result: touchResult ?? null,
      generated_by: generatedBy,
      access_count: 1,
    });

  if (error) console.error("Error saving world object:", error);
  return !error;
}

// ============================================================
// ROOM STATE
// ============================================================

export async function getRoomState(roomId: string) {
  const { data, error } = await serviceClient
    .from("room_states")
    .select("*")
    .eq("room_id", roomId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function saveRoomState(roomId: string, state: Record<string, unknown>) {
  const { error } = await serviceClient
    .from("room_states")
    .upsert({
      room_id: roomId,
      current_state: state.currentState,
      previous_state: state.previousState,
      caused_by: state.causedBy,
      cause_description: state.causeDescription,
      turns_in_state: state.turnsInState,
      recovery_type: state.recovery ? (state.recovery as Record<string, unknown>).type : null,
      recovery_description: state.recovery ? (state.recovery as Record<string, unknown>).description : null,
      gold_required: state.recovery ? (state.recovery as Record<string, unknown>).goldRequired : null,
      adventure_required: state.recovery ? (state.recovery as Record<string, unknown>).adventureRequired : null,
      recovery_complete: state.recovery ? (state.recovery as Record<string, unknown>).complete : false,
      updated_at: new Date().toISOString(),
    });

  if (error) console.error("Error saving room state:", error);
  return !error;
}

// ============================================================
// NPC STATE
// ============================================================

export async function getNPCState(npcId: string, playerId: string) {
  const { data, error } = await serviceClient
    .from("npc_states")
    .select("*")
    .eq("npc_id", npcId)
    .eq("player_id", playerId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function saveNPCState(npcId: string, playerId: string, state: Record<string, unknown>) {
  const { error } = await serviceClient
    .from("npc_states")
    .upsert({
      npc_id: npcId,
      player_id: playerId,
      disposition: state.disposition,
      memory: state.memory,
      agenda: state.agenda,
      custom_greeting: state.customGreeting,
      updated_at: new Date().toISOString(),
    }, { onConflict: "npc_id,player_id" });

  if (error) console.error("Error saving NPC state:", error);
  return !error;
}

// ============================================================
// JANE MEMORY
// ============================================================

export async function saveJaneMemory(
  playerId: string,
  eventType: string,
  summary: string,
  virtueDeltas: Record<string, number> = {},
  turnCount: number = 0
) {
  const { error } = await serviceClient
    .from("jane_memories")
    .insert({
      player_id: playerId,
      event_type: eventType,
      summary,
      virtue_deltas: virtueDeltas,
      turn_count: turnCount,
    });

  if (error) console.error("Error saving Jane memory:", error);
  return !error;
}

export async function getRecentJaneMemories(playerId: string, limit: number = 10) {
  const { data, error } = await serviceClient
    .from("jane_memories")
    .select("*")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data ?? [];
}

// ============================================================
// CHRONICLE
// ============================================================

export async function addChronicleEntry(
  playerId: string,
  event: string,
  isPublic: boolean,
  worldTurn: number
) {
  const { error } = await serviceClient
    .from("chronicle_log")
    .insert({
      player_id: playerId,
      event,
      is_public: isPublic,
      world_turn: worldTurn,
    });

  if (error) console.error("Error saving chronicle entry:", error);
  return !error;
}

export async function getChronicle(playerId: string, limit: number = 20) {
  const { data, error } = await serviceClient
    .from("chronicle_log")
    .select("*")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data ?? [];
}

// ============================================================
// JANE CALL TRACKING
// ============================================================

export async function checkAndDecrementJaneCalls(playerId: string): Promise<boolean> {
  const { data, error } = await serviceClient
    .from("players")
    .select("jane_calls_today, jane_calls_reset_at, tier")
    .eq("id", playerId)
    .single();

  if (error || !data) return false;

  // Check if reset needed (new day)
  const resetAt = new Date(data.jane_calls_reset_at);
  const now = new Date();
  const needsReset = now.getTime() - resetAt.getTime() > 24 * 60 * 60 * 1000;

  // Unlimited tiers
  if (process.env.NODE_ENV === "development") return true;
  if (data.tier === "worldshaper" || data.tier === "eternal_legend") return true;

  const maxCalls = data.tier === "adventurer" ? 100 : 10;

  if (needsReset) {
    // Reset counter
    await serviceClient
      .from("players")
      .update({
        jane_calls_today: maxCalls - 1,
        jane_calls_reset_at: now.toISOString(),
      })
      .eq("id", playerId);
    return true;
  }

  if (data.jane_calls_today <= 0) return false;

  // Decrement
  await serviceClient
    .from("players")
    .update({ jane_calls_today: data.jane_calls_today - 1 })
    .eq("id", playerId);

  return true;
}