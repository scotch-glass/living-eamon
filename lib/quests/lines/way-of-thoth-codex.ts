// ============================================================
// LIVING EAMON — The Way of Thoth: codex renderer (Sprint 8h)
//
// Renders the 9-section in-fiction journal for the THE WAY /
// WAY / TEACHINGS commands. All sections are gated on quest
// progress derived from existing PlayerState — no new fields.
//
// Registered on the WAY_OF_THOTH quest definition via
// Quest.codexRenderer + Quest.codexCommands.
// ============================================================

import type { WorldState } from "../../gameState";

const DIV = "═══════════════════════════════════════════";
const SEC = "───────────────────────────────────────────";

const SCROLL_TITLES: Record<number, string> = {
  1:  "The Way of Thoth",
  2:  "The Seven Principles of Thoth",
  3:  "Mental Transmutation",
  4:  "The All",
  5:  "The Mental Universe",
  6:  "The Divine Paradox",
  7:  '"The All" in All',
  8:  "Planes of Correspondence",
  9:  "Vibration",
  10: "Polarity",
  11: "Rhythm",
  12: "Causation",
  13: "Gender",
  14: "Mental Gender",
  15: "Thothian Axioms",
};

const ROMAN_15 = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV"];
const ROMAN_8  = ["I","II","III","IV","V","VI","VII","VIII"];

// Each opened Circle gets a one-line warning in Howard's voice.
const CIRCLE_WARNINGS: Record<number, string> = {
  1: "The World answers what the mind asks, quietly and without price.",
  2: "Fire obeys the spoken name. It does not remember who held the match.",
  3: "Mind speaks and flesh listens. The listener, once taught, may speak back.",
  4: "The dream-road runs both ways. What walks it going out meets something walking in.",
  5: "Between the living and the dead stands only the Word. The Word does not care which side you stand on.",
  6: "The unseen is still present. The revealed was always there.",
  7: "Elementals are not servants. They are older than names and do not feel bound by them.",
  8: "The daemon answers. It always answers. What it answered is what you became in the asking.",
};

// Odd-numbered scrolls unlock a Circle. Circle → scroll number.
const CIRCLE_TO_SCROLL: Record<number, number> = {
  1:1, 2:3, 3:5, 4:7, 5:9, 6:11, 7:13, 8:15,
};

// 14 Stobaean Fragments. Keys must match the fireOnceKey used in
// way-of-thoth.ts: `${fragmentId}-delivered`.
const FRAGMENTS: Array<{
  scroll:  number;
  key:     string;
  npc:     string;
  title:   string;
  vector:  string;
}> = [
  { scroll:  2, key: "sh-2-1-delivered",   npc: "Old Bram",               title: "On Virtue",               vector: "spoken aloud"                      },
  { scroll:  3, key: "sh-11-2-delivered",  npc: "Sister Hela",             title: "On the Lamp",             vector: "mosaic engraving, chapel floor"     },
  { scroll:  4, key: "sh-18-3-delivered",  npc: "Vivian",                  title: "On the Hidden Good",      vector: "left under a pillow"                },
  { scroll:  5, key: "sh-1-1-delivered",   npc: "Aldric",                  title: "On Ordeal",               vector: "spoken after the duel"              },
  { scroll:  6, key: "sh-19-7-delivered",  npc: "Hokas Tokas",             title: "On What the Crowd Knows", vector: "slid across the bar"                },
  { scroll:  7, key: "sh-25-8-delivered",  npc: "Maelis the Seer",         title: "On Dreams",               vector: "sung in fever-sleep"                },
  { scroll:  8, key: "sh-23-5-delivered",  npc: "Cassian the Gravewright", title: "On the Body as Tomb",     vector: "read from a gravestone"             },
  { scroll:  9, key: "sh-7-4-delivered",   npc: "Tavren of the Long Road", title: "On Three That Weave",     vector: "stitched inside a helm"             },
  { scroll: 10, key: "sh-24-2-delivered",  npc: "Goodwife Yssa",           title: "On Soul-Fashioning",      vector: "whispered at a birth"               },
  { scroll: 11, key: "sh-21-6-delivered",  npc: "Master Orin Quill",       title: "On the All as One",       vector: "etched on a book spine"             },
  { scroll: 12, key: "sh-11-4-delivered",  npc: "Rhonen the Merchant",     title: "On the Word",             vector: "burnt into a chest lid"             },
  { scroll: 13, key: "sh-26-5-delivered",  npc: "Tava the Lash",           title: "On What Waits Beneath",   vector: "tattooed on her forearm"            },
  { scroll: 14, key: "sh-3-3-delivered",   npc: "Brother Inan",            title: "On the Strange-Season",   vector: "read from the Logos Teleios flyleaf" },
  { scroll: 15, key: "sh-27-1-delivered",  npc: "Mother Khe-Anun",         title: "On the Calling-Home",     vector: "spoken at the Lighthouse"           },
];

// 14 Way allies, keyed by the fragment delivery flag that proves the meeting.
const NETWORK: Array<{ key: string; name: string; role: string }> = [
  { key: "sh-2-1-delivered",   name: "Old Bram",               role: "Former priest · alms-corner" },
  { key: "sh-11-2-delivered",  name: "Sister Hela of the Lamp",role: "Lamp-tender · Side Chapel" },
  { key: "sh-18-3-delivered",  name: "Vivian",                  role: "Lockpicker · courier's daughter" },
  { key: "sh-1-1-delivered",   name: "Aldric",                  role: "Veteran warrior · training-ground" },
  { key: "sh-19-7-delivered",  name: "Hokas Tokas",             role: "Barkeep · rumor-broker" },
  { key: "sh-25-8-delivered",  name: "Maelis the Seer",         role: "Dream-walker · Salt Marsh" },
  { key: "sh-23-5-delivered",  name: "Cassian the Gravewright", role: "Stonecutter · keeper of old inscriptions" },
  { key: "sh-7-4-delivered",   name: "Tavren of the Long Road", role: "Scout · road-wanderer" },
  { key: "sh-24-2-delivered",  name: "Goodwife Yssa",           role: "Healer · hedge-witch" },
  { key: "sh-21-6-delivered",  name: "Master Orin Quill",       role: "Scholar · Library Annex" },
  { key: "sh-11-4-delivered",  name: "Rhonen the Merchant",     role: "Reagent trader" },
  { key: "sh-26-5-delivered",  name: "Tava the Lash",           role: "Serpent-hunter · Ruined Watchtower" },
  { key: "sh-3-3-delivered",   name: "Brother Inan",            role: "Pre-Thurian delver · former Order hermit" },
  { key: "sh-27-1-delivered",  name: "Mother Khe-Anun",         role: "Hierophant · Lighthouse of the Last Word" },
];

function scrollStatus(
  n: number,
  completedSteps: string[],
  scrollsRead: Record<string, unknown>,
): string {
  if (completedSteps.includes(`scroll-${n}`)) return "[READ]  ";
  if (scrollsRead[`thoth-${n}`])             return "[FOUND] ";
  return                                            "[ — ]   ";
}

export function renderTheWayCodex(state: WorldState): string {
  const qs = state.player.quests?.["way-of-thoth"];
  const lines: string[] = [];

  lines.push(DIV);
  lines.push("  THE WAY OF THOTH — A SEEKER'S JOURNAL");
  lines.push(DIV);
  lines.push("");

  if (!qs || qs.status === "failed") {
    lines.push("  The journal is blank.");
    lines.push("  The Way has not yet found you.");
    lines.push("");
    lines.push("  (Read the first Scroll of Thoth to begin.)");
    return lines.join("\n");
  }

  const completed    = qs.completedSteps;
  const scratch      = qs.scratch;
  const scrollsRead  = state.player.scrollsRead ?? {};
  const knownCircles = state.player.knownCircles ?? [];
  const scrollCount  = completed.length;

  // §1 — Faction creed (visible after scroll-1 comprehended)
  if (completed.includes("scroll-1")) {
    lines.push("  THE DOCTRINE");
    lines.push(SEC);
    lines.push("");
    lines.push("  \"Light without Dark is fire without a hearth;");
    lines.push("   Dark without Light is a hearth without fire.");
    lines.push("   The Adept walks both halls and stands at the threshold.");
    lines.push("   Power untempered by understanding rends the weaver from the loom.");
    lines.push("   Therefore the Book was sundered into fifteen pages");
    lines.push("   and given to fifteen hands,");
    lines.push("   that no single soul should bear the weight of the whole.");
    lines.push("   We are the keepers, not the wielders.");
    lines.push("   We teach because the Word must not die.");
    lines.push("   We refuse because the Word must not rule.\"");
    lines.push("");
  }

  // §2 — The Fifteen Scrolls
  lines.push("  THE FIFTEEN SCROLLS");
  lines.push(SEC);
  lines.push("");
  for (let n = 1; n <= 15; n++) {
    const badge = scrollStatus(n, completed, scrollsRead);
    lines.push(`  ${badge} Scroll ${ROMAN_15[n - 1]} — ${SCROLL_TITLES[n]}`);
  }
  lines.push("");
  lines.push(`  ${scrollCount} of 15 comprehended.`);
  lines.push("");

  // §3 — Stobaean Fragments (only if any delivered)
  const delivered = FRAGMENTS.filter(f => scratch[f.key]);
  if (delivered.length > 0) {
    lines.push("  THE STOBAEAN FRAGMENTS");
    lines.push(SEC);
    lines.push("  Hermetic wisdom carried across fourteen hands.");
    lines.push("");
    for (const f of delivered) {
      lines.push(`  Scroll ${ROMAN_15[f.scroll - 1]}:  ${f.title}`);
      lines.push(`    — ${f.npc} · ${f.vector}`);
    }
    lines.push("");
  }

  // §4 — Logos Teleios (after scroll-14 comprehended)
  if (completed.includes("scroll-14")) {
    lines.push("  THE LOGOS TELEIOS");
    lines.push(SEC);
    lines.push("");
    lines.push("  \"A time will come — and is already coming — when the gods");
    lines.push("   withdraw their hands from the land. The temples will stand,");
    lines.push("   but they will be empty rooms. Men will forget how to look up.");
    lines.push("   They will call the old reverences foolish, and the old");
    lines.push("   foolishnesses wise. The earth will sicken in answer.\"");
    lines.push("");
    lines.push("  \"This is not the end. This is the strange-season. After the");
    lines.push("   strange-season comes the calling-home — and after the");
    lines.push("   calling-home, the remaking.\"");
    lines.push("");
    lines.push("  — The Perfect Discourse. Found in the Pre-Thurian vault");
    lines.push("    below Valus. Carried upward by Brother Inan.");
    lines.push("");
  }

  // §5 — The Network (only if any NPCs have been met)
  const metAllies = NETWORK.filter(n => scratch[n.key]);
  if (metAllies.length > 0) {
    lines.push("  THE NETWORK");
    lines.push(SEC);
    lines.push("  Allies who walk the Way. Each carries one page of the Book.");
    lines.push("");
    for (const ally of metAllies) {
      lines.push(`  ${ally.name}`);
      lines.push(`    ${ally.role}`);
    }
    lines.push("");
  }

  // §6 — Circle Reveals
  lines.push("  THE CIRCLES");
  lines.push(SEC);
  lines.push("  Each odd-numbered scroll opens a Circle of Sorcery.");
  lines.push("");
  for (let c = 1; c <= 8; c++) {
    const scrollN = CIRCLE_TO_SCROLL[c];
    const label   = `Circle ${ROMAN_8[c - 1]}`;
    if (knownCircles.includes(c)) {
      const warning = CIRCLE_WARNINGS[c] ?? "";
      lines.push(`  ${label} — [OPENED via Scroll ${ROMAN_15[scrollN - 1]}]`);
      lines.push(`    "${warning}"`);
    } else {
      lines.push(`  ${label} — [SEALED]`);
    }
  }
  lines.push("");

  // §7 — The Black Vellum (stub; encounter flags not yet wired)
  if (scrollCount >= 10) {
    lines.push("  THE BLACK VELLUM");
    lines.push(SEC);
    lines.push("  Dark sorcerers who seek to bind the scattered pages into one Book.");
    lines.push("  They have noticed someone is collecting.");
    lines.push("  Their names are not yet known to you. Their reach is.");
    lines.push("");
  }

  // §8 — The Prophecy (after scroll-15)
  if (completed.includes("scroll-15") || qs.status === "completed") {
    lines.push("  THE PROPHECY OF THE CATACLYSM");
    lines.push(SEC);
    lines.push("");
    lines.push("  \"At the last, all that is bound shall be loosed;");
    lines.push("   all that is loosed shall be bound.\"");
    lines.push("");
    lines.push("  \"The choice is not whether — only when, and by whose hand.\"");
    lines.push("");
    lines.push("  \"He who binds the Book opens the door.");
    lines.push("   He who refuses to bind the Book holds it.");
    lines.push("   Choose, and choose alone, and choose knowing that");
    lines.push("   the greatest of the Adepts have lost their souls and their");
    lines.push("   Light in the choosing — and the greatest of those");
    lines.push("   have lost the world.\"");
    lines.push("");
    lines.push("  — Spoken by Mother Khe-Anun at the Lighthouse of the Last Word.");
    lines.push("");
  }

  // §9 — Title (after quest completed)
  if (qs.status === "completed") {
    const choice = scratch["capstone-choice"] as string | undefined;
    let title = "Keeper of the Fifteenth Word";
    if (choice === "bind") title = "Herald of the Bound Book";
    if (choice === "burn") title = "Last of the Sundering";
    lines.push("  EARNED TITLE");
    lines.push(SEC);
    lines.push("");
    lines.push(`  ${title}`);
    lines.push("");
  }

  return lines.join("\n");
}
