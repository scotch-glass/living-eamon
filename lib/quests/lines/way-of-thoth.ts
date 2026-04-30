// ============================================================
// LIVING EAMON — The Way of Thoth (KARMA Sprint 8d scaffold)
//
// 15-step legacy quest covering the fifteen Scrolls of Thoth.
// SPRINT 8d ships **stub rewards only** — chronicle lines, no
// Circle unlocks, no Stobaean Fragments, no NPC introductions.
// Sprint 8e adds Stobaean Fragments + Logos Teleios. Sprint 8f
// wires the 14 new NPCs, Zim's evolving turn-in dialogue, and the
// `unlockCircle` rewards on the appropriate stages.
//
// Acceptance: reading scroll thoth-1 auto-accepts the quest AND
// completes its first step in the same event (engine Phase 1
// auto-accept + Phase 2 step walk on the same emitQuestEvent
// invocation — see lib/quests/engine.ts).
//
// Step-id convention: `scroll-N` for N in 1..15. Each step's
// trigger is a `scroll-read` event with `target: "thoth-N"`.
// ============================================================

import { registerQuest } from "../engine";
import { registerQuestDialogue } from "../dialogue";
import type { Quest, QuestStep } from "../types";

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

function buildStep(n: number): QuestStep {
  const next = n < 15 ? `scroll-${n + 1}` : null;
  return {
    id: `scroll-${n}`,
    hint:
      n === 1
        ? "A scroll has fallen into your hands. Read it; comprehend it."
        : `The next scroll waits — Scroll ${roman(n)}: ${SCROLL_TITLES[n]}.`,
    trigger: {
      event: "scroll-read",
      target: `thoth-${n}`,
      // First-pass only: rewards land once per scroll, even on re-reads.
      guard: (_s, e) => e.type === "scroll-read" && e.firstPass === true,
    },
    reward: {
      chronicle: `You read Scroll ${roman(n)} — ${SCROLL_TITLES[n]} — and felt a thread of the Way tighten.`,
    },
    nextStep: next,
  };
}

function roman(n: number): string {
  const map: Record<number, string> = {
    1: "I",  2: "II",  3: "III", 4: "IV", 5: "V",
    6: "VI", 7: "VII", 8: "VIII", 9: "IX", 10: "X",
    11: "XI", 12: "XII", 13: "XIII", 14: "XIV", 15: "XV",
  };
  return map[n] ?? String(n);
}

const steps: Record<string, QuestStep> = {};
for (let n = 1; n <= 15; n++) steps[`scroll-${n}`] = buildStep(n);

const WAY_OF_THOTH: Quest = {
  id: "way-of-thoth",
  title: "The Way of Thoth",
  blurb:
    "Fifteen scrolls. Fifteen hands. The Book of Thoth was sundered so that no " +
    "single soul could bear the weight of the whole. Walk the Way and the scrolls " +
    "will find you.",
  scope: "legacy",

  // Reading thoth-1 (firstPass) accepts the quest and completes step 1
  // on the same event. Subsequent scrolls advance one step each.
  acceptanceTrigger: {
    event: "scroll-read",
    target: "thoth-1",
    guard: (_s, e) => e.type === "scroll-read" && e.firstPass === true,
  },

  acceptReward: {
    legacyChronicle:
      "The Way found you. Whatever happens next, the threads of the world are " +
      "different now — and so is what you can carry across death.",
  },

  startStep: "scroll-1",
  steps,

  completionChronicle:
    "You have read all fifteen Scrolls of Thoth. The Word lives in you. The choice — " +
    "to bind, to keep, or to burn — waits at the threshold.",
};

registerQuest(WAY_OF_THOTH);

// ============================================================
// SPRINT 8e — Stobaean Hermetic Fragment delivery
//
// Each branch fires when the player TALKs to the delivering NPC
// while on the matching scroll-N step. fireOnceReward awards +1
// Illumination + a chronicle entry, keyed by `<fragmentId>-delivered`
// in QuestState.scratch. way-of-thoth is legacy-scope, so the
// scratch (and therefore the once-per-lifetime guarantee) survives
// rebirth.
//
// Source-of-meaning for each fragment lives in
//   lore/stobaean-fragments/SH-*.md
// — original Living Eamon prose carrying the philosophical content
// of the Stobaean Hermetica fragment of the same number. Frontmatter
// of those files documents the source tradition for traceability.
//
// 11 NEW-NPC fragments are wired here (Sprint 8e):
//   old_bram, sister_hela, maelis_the_seer, cassian_the_gravewright,
//   tavren_of_the_long_road, goodwife_yssa, master_orin_quill,
//   rhonen_the_merchant, tava_the_lash, brother_inan, mother_khe_anun
//
// 3 EXISTING-NPC fragments are deferred to Sprint 8f:
//   - Aldric (old_mercenary)  → SH 1.1, scroll-5
//   - Hokas (hokas_tokas)     → SH 19.7, scroll-6
//   - Vivian (vivian)         → SH 18.3, scroll-4
// QuestNPCDialogue OWNS the TALK response once registered, and these
// NPCs have rich legacy NPCScript paths in lib/gameData.ts that must
// be migrated into QuestNPCDialogue branches first. Sprint 8f Wave 1
// covers all three.
//
// Brother Inan's branch also delivers the Logos Teleios Lament in
// the same dialogue. The codex itself (lore/logos-teleios/the-lament.md)
// has a frontmatter `illuminationDelta: 10` that will be awarded by
// Sprint 8f's scroll-discovery wiring; the +1 here covers SH 3.3 only.
// ============================================================

interface FragmentDialogueOpts {
  npcId: string;
  step: string;
  fragmentId: string;
  lines: string[];
  chronicle: string;
  /**
   * Optional. When provided, the resolver returns these lines on
   * non-matching turns (the registered NPC's TALK is fully owned by
   * this dialogue). When omitted, the resolver falls through to the
   * legacy NPCScript matcher — the **extension** pattern used by
   * Sprint 8f for Aldric, Hokas, and Vivian.
   */
  fallback?: string[];
  illuminationDelta?: number;
}

function fragmentDialogue(opts: FragmentDialogueOpts): void {
  registerQuestDialogue({
    npcId: opts.npcId,
    branches: [
      {
        id: `deliver-${opts.fragmentId}`,
        when: { questId: "way-of-thoth", onStep: opts.step },
        lines: opts.lines,
        fireOnceReward: {
          picssi: { illumination: opts.illuminationDelta ?? 1 },
          chronicle: opts.chronicle,
        },
        fireOnceKey: `${opts.fragmentId}-delivered`,
      },
    ],
    ...(opts.fallback !== undefined ? { fallback: opts.fallback } : {}),
  });
}

// ── SH 2.1 · Old Bram · scroll-2 · spoken aloud ──────────────
fragmentDialogue({
  npcId: "old_bram",
  step: "scroll-2",
  fragmentId: "sh-2-1",
  lines: [
    "Old Bram catches your sleeve as you pass and pulls you down into the alms-corner. He says nothing at first. Then, very quietly, in the voice of a man who used to teach:",
    "",
    "\"Hear, then. The first virtue is to know what you owe.\"",
    "",
    "He smiles, gap-toothed, and lets your sleeve go.",
    "",
    "\"The proud man counts what he has earned. The wise man counts what he has been given — and finds the count larger by every measure. He owes his breath, his bones, his name. He owns nothing.\"",
    "",
    "\"To know this is not to despair. It is to begin.\"",
    "",
    "*(SH 2.1 — On Virtue. The teaching settles in you somewhere it will not easily be lost.)*",
  ],
  chronicle:
    "Old Bram, in his beggar's corner, taught you the first fragment of the Way: that virtue begins in knowing what you owe.",
  fallback: [
    "Old Bram hunkers in his alms-corner, rattling his cup. \"Coppers for an old soldier, friend?\" he says, and does not look up.",
  ],
});

// ── SH 11.2 · Sister Hela · scroll-3 · mosaic engraving ──────
fragmentDialogue({
  npcId: "sister_hela",
  step: "scroll-3",
  fragmentId: "sh-11-2",
  lines: [
    "Sister Hela kneels at the altar. Without a word, she draws back the carpet, revealing a mosaic of green and bronze tiles set into the chapel floor.",
    "",
    "She traces the edge of the design with one finger and reads aloud, as though for the lamp's benefit and not yours:",
    "",
    "\"Light has no enemy but neglect.\"",
    "",
    "\"Above, Mind is light without form — pure, unbodied, wholly itself. Below, light is Mind taking shape: a flame, a lamp, a steady-burning oil. Tend the lamp and you tend a piece of God. Let it gutter and you let a piece of God grow lonely.\"",
    "",
    "She lets the carpet fall back into place.",
    "",
    "*(SH 11.2 — On the Lamp. The chapel feels older than it did a moment ago.)*",
  ],
  chronicle:
    "Sister Hela of the Lamp showed you the mosaic beneath the altar carpet. You learned that light below is Mind taking shape.",
  fallback: [
    "Sister Hela tends the chapel lamp in silence, her back to you. She is busy, or pretending to be.",
  ],
});

// ── SH 25.8 · Maelis the Seer · scroll-7 · sung dream ────────
fragmentDialogue({
  npcId: "maelis_the_seer",
  step: "scroll-7",
  fragmentId: "sh-25-8",
  lines: [
    "Maelis is shivering on the reed floor of her hut, eyes rolled back, hand twitching as if trying to write. Her grandmother presses a stick of charcoal into your fingers and gestures at a scrap of birch bark.",
    "",
    "\"She'll sing. You write. Don't ask which of you is awake.\"",
    "",
    "Maelis's voice, when it comes, is younger than her body:",
    "",
    "\"In sleep the soul is loosed from its mooring. It does not wander — it returns. To where it went before the body was given. To where it will go when the body is undone.\"",
    "",
    "\"What it sees there is older than waking. The dreamer who remembers is half-prophet, half-mad. There is no third kind.\"",
    "",
    "Your hand has written it down. You do not remember writing.",
    "",
    "*(SH 25.8 — On Dreams.)*",
  ],
  chronicle:
    "Maelis the Seer dreamed a fragment of the Way and sang it through you. You wrote what she sang and do not remember writing.",
  fallback: [
    "Maelis is sleeping fitfully. Her grandmother lifts a finger to her lips and shakes her head.",
  ],
});

// ── SH 23.5 · Cassian the Gravewright · scroll-8 · gravestone ─
fragmentDialogue({
  npcId: "cassian_the_gravewright",
  step: "scroll-8",
  fragmentId: "sh-23-5",
  lines: [
    "Cassian is rubbing the side of his hammer against a gravestone whose name has been worn smooth by generations of weeping. He is bringing back only the verse, not the name.",
    "",
    "He steps aside so you can read it.",
    "",
    "\"What the mason makes of stone, the soul makes of flesh.\"",
    "",
    "\"The grave is the body's answer to the body. We carve it knowing — wordlessly, by old instinct — that we have been doing the same work all our lives. The first burial is the first breath. The last is only later.\"",
    "",
    "Cassian shoulders his hammer. \"Most clients won't read it,\" he says. \"That's why I carve it.\"",
    "",
    "*(SH 23.5 — On the Body as Tomb.)*",
  ],
  chronicle:
    "Cassian the Gravewright unburied a verse from a forgotten stone for you. The body, you learned, is a tomb the soul has built itself.",
  fallback: [
    "Cassian works without looking up. The chisel sets a rhythm older than your breathing.",
  ],
});

// ── SH 7.4 · Tavren of the Long Road · scroll-9 · helm interior
fragmentDialogue({
  npcId: "tavren_of_the_long_road",
  step: "scroll-9",
  fragmentId: "sh-7-4",
  lines: [
    "Tavren turns his campaign helm over and points to the lining. Three words in three colors, repeated three times.",
    "",
    "\"My Way mentor told me to read it in any language I knew. Try.\"",
    "",
    "You read.",
    "",
    "\"Three weave the world. Fate decrees what shall be. Providence orders what may be. Necessity executes what must be.\"",
    "",
    "\"None of them love you. None of them hate you. The traveler who walks knowing this walks lighter — for he carries only what is his to carry, and never the weight of what was never going to bend.\"",
    "",
    "Tavren takes the helm back. \"Useful in a long march,\" he says. \"Useful in everything else, too.\"",
    "",
    "*(SH 7.4 — On Three That Weave.)*",
  ],
  chronicle:
    "Tavren of the Long Road showed you the helm-stitching: three weave the world — fate, providence, necessity — and none of them love you.",
  fallback: [
    "Tavren is oiling his helm-strap. He nods at you but is busy with the work of someone who walks a lot of roads.",
  ],
});

// ── SH 24.2 · Goodwife Yssa · scroll-10 · healing-rite recitation
fragmentDialogue({
  npcId: "goodwife_yssa",
  step: "scroll-10",
  fragmentId: "sh-24-2",
  lines: [
    "Yssa has one hand on the laboring mother and one hand on the child that has, against most expectations, just begun to cry. Her voice is low, almost private.",
    "",
    "\"The gods were made first. From what was left, the souls were made.\"",
    "",
    "\"We are afterthought. We are remainder. And so we are God's choosing — for what is kept, after the great work, is kept on purpose. The newborn does not need to earn its keeping. It was kept already, before it began.\"",
    "",
    "She wipes her hands. \"Older than any prayer my mother taught me,\" she says. \"Tell no one but the next bearer.\"",
    "",
    "*(SH 24.2 — On Soul-Fashioning.)*",
  ],
  chronicle:
    "Goodwife Yssa whispered a midwife's prayer over a difficult birth. You learned that souls are God's afterthought — and therefore God's choosing.",
  fallback: [
    "Yssa is brewing something bitter over the fire. The cottage smells of yarrow. She does not seem ready to talk.",
  ],
});

// ── SH 21.6 · Master Orin Quill · scroll-11 · book-spine etching
fragmentDialogue({
  npcId: "master_orin_quill",
  step: "scroll-11",
  fragmentId: "sh-21-6",
  lines: [
    "Master Orin lays a book on the lectern. Its title has been deliberately scraped off the spine. Where the title used to be, an etching has been cut into the leather instead.",
    "",
    "\"The title was the danger,\" he says. \"The etching is only the door. Read.\"",
    "",
    "You read.",
    "",
    "\"The cosmos is one living thing. Its parts know each other as your hand knows your other hand — wordlessly, without effort. The forgetting came later, with the body, with the name. The work of the seeker is not to learn this. It is to remember it.\"",
    "",
    "Beneath, in older script:",
    "",
    "\"As above, so below. As within, so without.\"",
    "",
    "Orin closes the book gently. \"That last line is older than this volume,\" he says. \"It will outlive it.\"",
    "",
    "*(SH 21.6 — On the All as One.)*",
  ],
  chronicle:
    "Master Orin Quill showed you the etched spine of a nameless book. The cosmos, you learned, is one living thing — and the seeker's work is to remember it.",
  fallback: [
    "Orin is pulling cards from a long catalogue, lips moving. He does not look up. The annex is very quiet.",
  ],
});

// ── SH 11.4 · Rhonen the Merchant · scroll-12 · reagent-chest lid
fragmentDialogue({
  npcId: "rhonen_the_merchant",
  step: "scroll-12",
  fragmentId: "sh-11-4",
  lines: [
    "Rhonen unlocks the reagent chest and lifts the lid. On its underside — burnt into the wood by someone who knew the heat tolerance of dried saltpeter — is a short passage.",
    "",
    "He will not say who burned it there.",
    "",
    "\"The Word holds the world.\"",
    "",
    "\"Not a word as men speak it — but the first word, spoken once, sounding still. Stones cohere because the Word is loud in them. Bodies stand because the Word is loud in them. When the Word grows quiet, the world begins to come unbound.\"",
    "",
    "\"Listen, then. Listen, while listening is still possible.\"",
    "",
    "Rhonen closes the chest. \"I made my money,\" he says. \"Now I am making my soul. The reagents are still for sale.\"",
    "",
    "*(SH 11.4 — On the Word.)*",
  ],
  chronicle:
    "Rhonen the Merchant opened his reagent chest and showed you what was burnt into its lid. The Word holds the world — and the world is beginning to come unbound.",
  fallback: [
    "Rhonen is weighing out powdered nightshade by candlelight. \"With you in a moment, friend,\" he says without looking up.",
  ],
});

// ── SH 26.5 · Tava the Lash · scroll-13 · body tattoo ────────
fragmentDialogue({
  npcId: "tava_the_lash",
  step: "scroll-13",
  fragmentId: "sh-26-5",
  lines: [
    "Tava draws her short sword to clean it. As her arm extends, the tattoo on the inside of her left forearm catches the firelight. Dark ink, set the year she turned thirteen — the year her village was infiltrated and only she saw it.",
    "",
    "She does not lower her arm.",
    "",
    "\"Where men forget, things older than men remember.\"",
    "",
    "\"They wait beneath the stones with patience the dead do not have. They remember the names that were spoken when the world was new. They remember the doors that were closed, and how to open them.\"",
    "",
    "She sheathes the blade. \"The Way is the watch we keep against the patient ones,\" she says. \"Sleep light.\"",
    "",
    "*(SH 26.5 — On What Waits Beneath.)*",
  ],
  chronicle:
    "Tava the Lash showed you the tattoo on her forearm — set the year her village fell. Old things wait beneath the stones; the Way is the watch kept against them.",
  fallback: [
    "Tava is sharpening her short sword in the watchtower's broken light. She nods, but her eyes do not leave the southern horizon.",
  ],
});

// ── SH 3.3 + Logos Teleios · Brother Inan · scroll-14 · codex flyleaf
fragmentDialogue({
  npcId: "brother_inan",
  step: "scroll-14",
  fragmentId: "sh-3-3",
  lines: [
    "Brother Inan opens the codex carefully, as one opens a door whose hinges have not turned in a thousand years.",
    "",
    "On the flyleaf — in a hand that does not match any of the inks below — is a fragment older than the binding it now sits behind.",
    "",
    "\"There comes a season — and seasons of seasons — when the gods withdraw, when the earth grows ill, when the things made well grow strange.\"",
    "",
    "\"This is not the end. The end is what comes after the season ends. The Way is the long watch through the strange-time. Walk it knowing the dawn is not promised — and walk it anyway.\"",
    "",
    "He turns past the flyleaf and reads on. The codex is the Logos Teleios — the Perfect Discourse — and what follows is its Lament:",
    "",
    "\"A time will come — and is already coming — when the gods withdraw their hands from the land. The temples will stand, but they will be empty rooms. Men will forget how to look up. They will call the old reverences foolish, and the old foolishnesses wise. The earth will sicken in answer.\"",
    "",
    "\"The wonders that remain will be called madness; the madness that comes will be called sense. The dead will be more honored than the living, for the dead at least remembered.\"",
    "",
    "\"This is not the end. This is the strange-season. After the strange-season comes the calling-home — and after the calling-home, the remaking. The Word that built the world has not unmade it. It has only grown quiet. He who keeps the watch in the quiet is named in the remaking.\"",
    "",
    "Brother Inan closes the codex. He does not speak for a long time.",
    "",
    "*(SH 3.3 — On the Strange-Season. The Logos Teleios is now in your hands.)*",
  ],
  chronicle:
    "In the Pre-Thurian vault, Brother Inan opened the Logos Teleios for you. You heard the Lament read aloud and the strange-season named.",
  fallback: [
    "Brother Inan is on his knees in front of the vault door. \"Not yet,\" he says quietly. \"Not for you, not yet.\"",
  ],
});

// ── SH 27.1 · Mother Khe-Anun · scroll-15 · prophecy preamble ─
fragmentDialogue({
  npcId: "mother_khe_anun",
  step: "scroll-15",
  fragmentId: "sh-27-1",
  lines: [
    "Mother Khe-Anun is at the lighthouse's open window. The sea behind her is the color of cold iron. The Fifteenth Scroll is in her lap; she has not opened it.",
    "",
    "She does not turn.",
    "",
    "\"Forty years I have known these lines by heart and never said them to a living soul. Hear them now.\"",
    "",
    "\"At the last, all that is bound shall be loosed; all that is loosed shall be bound.\"",
    "",
    "\"The choice is not whether — only when, and by whose hand.\"",
    "",
    "\"Hear, then, while there is still hearing. The Word that made the world has begun to call it home. What you do in the calling is what you will be when the calling ends.\"",
    "",
    "Now she turns. Her eyes are very tired and very kind.",
    "",
    "\"Sit. There is one more thing to read, and then a choice.\"",
    "",
    "*(SH 27.1 — On the Calling-Home.)*",
  ],
  chronicle:
    "Mother Khe-Anun spoke the prophecy's preamble — words she had carried alone for forty years. The calling-home has begun.",
  fallback: [
    "Mother Khe-Anun stands at the lighthouse window, watching the sea. She does not turn. \"Not yet,\" she says, very softly.",
  ],
});

// ============================================================
// TODO — three SH fragments awaiting remote-NPC assignment
//
// SH 1.1 (scroll-5), SH 18.3 (scroll-4), and SH 19.7 (scroll-6)
// are NOT delivered by Guild Hall NPCs (Aldric, Vivian, Hokas).
// Per Scotch's design directive (2026-04-30): the Way of Thoth is
// PICSSI's spine through the main adventure line, not a side quest
// rooted in the hub. Epic-quest seeds belong in remote NPCs that
// adventure modules reference ("go talk with [NPC] in the salt
// marsh to the east"), not in main-hall fixtures.
//
// These three fragments will be assigned to new remote NPCs (or
// folded into existing remote NPCs from the Sprint 8e roster) as
// the main adventure line — Module 1 (Mirrors of Tuzun Thune),
// Module 2 (Serpent in the Court), Module 3 (Pictish Time-Tomb),
// and post-2028 Conan modules — is authored.
//
// The lore content for these fragments lives at
//   lore/stobaean-fragments/SH-{1.1,18.3,19.7}.md
// — frontmatter currently marks deliveryNpc: tbd-pd-module.
// ============================================================

export default WAY_OF_THOTH;
