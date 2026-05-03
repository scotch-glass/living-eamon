// ============================================================
// ADVENTURE REGISTRY
// All AdventureModules are registered here.
// To add a new adventure: import it and add it to MODULES.
// ============================================================

import type { AdventureModule, Room, NPCScript } from "../roomTypes";
import { GUILD_HALL } from "./guild-hall";

const MODULES: AdventureModule[] = [
  GUILD_HALL,
  // The first three adventures ship as Thurian-Age PD Robert E. Howard
  // adaptations (see lore/hyborian-pd/MODULE_PLAN.md):
  //   MIRRORS_OF_TUZUN_THUNE,   // The Mirrors of Tuzun Thune (1929)
  //   SERPENT_IN_THE_COURT,     // The Shadow Kingdom (1929)
  //   PICTISH_TIME_TOMB,        // Kings of the Night (1930)
];

/** All rooms from all registered modules, keyed by room id. */
export const ALL_ROOMS: Record<string, Room> = Object.assign(
  {},
  ...MODULES.map((m) => m.rooms)
);

/** Look up a single room by id across all registered modules. */
export function getRoom(id: string): Room | undefined {
  return ALL_ROOMS[id];
}

/** The adventure module that contains a given room id, or undefined. */
export function getAdventureForRoom(roomId: string): AdventureModule | undefined {
  return MODULES.find((m) => roomId in m.rooms);
}

/** All registered adventure modules. */
export function getModules(): AdventureModule[] {
  return MODULES;
}

/** All NPC scripts from all registered modules. */
export function getAllNPCScripts(): NPCScript[] {
  return MODULES.flatMap((m) => m.npcScripts ?? []);
}

/** Find NPC scripts that match a room and trigger type. */
export function getScriptsForRoom(
  roomId: string,
  trigger: "on_enter" | "on_response"
): NPCScript[] {
  return getAllNPCScripts().filter(
    (s) => s.condition.room === roomId && s.trigger === trigger
  );
}
