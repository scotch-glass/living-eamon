// ============================================================
// GUILD HALL — NPC SCRIPTED INTERACTIONS
// All scripted NPC dialogue for the Guild Hall hub lives here.
// route.ts reads these scripts via the registry — no prose in
// the router.
// ============================================================

import type { NPCScript } from "../roomTypes";
import { NPCS } from "../gameData";

// ── Aldric's drink offer (first entry to Main Hall) ──────────

const ALDRIC_DRINK_OFFER: NPCScript = {
  id: "aldric_drink_offer",
  npcId: "old_mercenary",
  condition: {
    room: "main_hall",
    once: true,
    playerState: {
      barmaidPreference: null,
      previousRoomNotNull: true,
    },
  },
  trigger: "on_enter",
  lines: [
    "",
    "A weathered man with a grey beard and a prosthetic left hand carved from dark wood looks up from a corner booth. He takes in the whole situation in about two seconds — the gray robe, the empty hands, the look of someone who just woke up somewhere they don't remember.",
    "",
    "\"Sit down,\" he says. Not unkindly. \"You look like you could use a drink. My treat.\"",
    "",
    "He leans back and nods toward the bar, where three women work the room.",
    "",
    "\"Three of them on shift today. Which one do you want bringing it over?\"",
    "",
    "__BARMAID_SELECT__",
  ],
};

// ── Barmaid selection response ───────────────────────────────

const BARMAID_ARRIVALS: Record<string, (name: string) => string> = {
  lira: (name) =>
    `${name} appears at the table almost before Aldric's hand drops, two tankards balanced in one small hand. She sets them down with a grin and a wink, then she's gone — back to the bar before you can blink.`,
  mavia: (name) =>
    `${name} arrives unhurried, a tankard in each hand. She sets them down, leans one hip against the table edge, and smiles — a warm, easy thing. Then she touches Aldric's shoulder as she leaves, like an old friend.`,
  seraine: (name) =>
    `${name} arrives without a sound and places two tankards on the table with quiet precision. She meets your eyes and gives a small, gentle smile before turning back toward the bar.`,
};

const BARMAID_SELECT_RESPONSE: NPCScript = {
  id: "barmaid_select_response",
  npcId: "old_mercenary",
  condition: {
    room: "main_hall",
    playerState: {
      barmaidPreference: null,
    },
  },
  trigger: "on_response",
  validInputs: ["LIRA", "MAVIA", "SERAINE"],
  lines: [], // built dynamically in stateUpdate — see getResponseLines below
  stateUpdate: (input: string) => ({
    barmaidPreference: input.toLowerCase(),
  }),
};

/**
 * Build the response lines for a barmaid selection.
 * Called by route.ts when the script matches.
 */
export function getBarmaidResponseLines(input: string): string[] {
  const chosen = input.toLowerCase();
  const barmaid = NPCS[chosen];
  if (!barmaid) return [`Someone brings two tankards to the table.`];

  const arrivalFn = BARMAID_ARRIVALS[chosen];
  const arrival = arrivalFn
    ? arrivalFn(barmaid.name)
    : `${barmaid.name} brings two tankards to the table.`;

  return [
    `Aldric raises two fingers toward the bar. ${barmaid.name} catches the signal.`,
    "",
    arrival,
    "",
    `Aldric lifts his drink. "Good. Now — there are things you should know before you get yourself killed."`,
    "",
    `He nods at the chair across from him. "Ask me anything. I've been here long enough."`,
  ];
}

// ── All Guild Hall NPC scripts ───────────────────────────────

export const GUILD_HALL_NPC_SCRIPTS: NPCScript[] = [
  ALDRIC_DRINK_OFFER,
  BARMAID_SELECT_RESPONSE,
];
