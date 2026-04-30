// ============================================================
// LIVING EAMON — GAME ENGINE (client-safe subset)
//
// Pure-browser-safe exports. No node:fs, no node:path, no
// transitive imports of server-only modules (e.g. karma/loader,
// karma/scrolls).
//
// Client components ("use client") import from here so they
// don't pull the rest of `lib/gameEngine.ts` into the browser
// bundle, which would drag in the karma server-only modules
// and break Turbopack chunk generation.
// ============================================================

import { ITEMS, NPCS, ADVENTURES, type Room, type NPC } from "./gameData";
import type { WorldState, NPCStateEntry } from "./gameState";
import { ALL_ROOMS as MAIN_HALL_ROOMS } from "./adventures/registry";
import { BODY_ZONES } from "./combatTypes";

export const SITUATION_BLOCK_LINE = "─────────────────────────────────";

const EXIT_ORDER = ["north", "east", "south", "west", "up", "down"] as const;

export function exitDestinationLabel(roomId: string, visitedRooms: string[]): string {
  if (!visitedRooms.includes(roomId)) return "?";
  const dest = MAIN_HALL_ROOMS[roomId];
  if (!dest) return roomId.replace(/_/g, " ");
  if (dest.id === "guild_courtyard") return "Courtyard";
  return dest.name.replace(/^The\s+/i, "").trim();
}

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

export function presentNPCsInRoom(room: Room, state: WorldState): {
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

export function isShieldSlotItem(itemId: string): boolean {
  return itemId === "old_wooden_shield";
}

/** Body armor slot (not buckler). */
export function isBodyArmorSlotItem(itemId: string): boolean {
  const item = ITEMS[itemId];
  return Boolean(item?.type === "armor" && item.stats?.zoneSlot);
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
    // Three Thurian-Age PD adventures (Howard short stories).
    // Module implementations land sequentially per MODULE_PLAN.md.
    return [
      {
        label: "The Mirrors of Tuzun Thune (novice)",
        insertText: "ENTER THE MIRRORS OF TUZUN THUNE",
        autoSubmit: true,
      },
      {
        label: "The Serpent in the Court (moderate)",
        insertText: "ENTER THE SERPENT IN THE COURT",
        autoSubmit: true,
      },
      {
        label: "The Pictish Time-Tomb (deadly)",
        insertText: "ENTER THE PICTISH TIME-TOMB",
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
