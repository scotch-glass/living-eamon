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

// Odd-numbered scrolls unlock a Circle of Sorcery (on step reward, not
// Zim dialogue). Circle unlocks are idempotent in applyReward.
const CIRCLE_BY_SCROLL: Partial<Record<number, 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>> = {
  1: 1, 3: 2, 5: 3, 7: 4, 9: 5, 11: 6, 13: 7, 15: 8,
};

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
  const circle = CIRCLE_BY_SCROLL[n];
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
      ...(circle !== undefined ? { unlockCircle: circle } : {}),
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

// ============================================================
// SPRINT 8f — Zim's 15 turn-in branches + Circle-unlock wiring
//
// Extension pattern: no `fallback` — legacy NPCScript in
// lib/gameData.ts fires pre-quest. These 15 branches own Zim's
// TALK response once "way-of-thoth" is accepted.
//
// onStep:"scroll-(N+1)" fires exactly when the player has read
// scroll N and awaits scroll N+1 — the canonical turn-in beat.
//
// Circle unlocks are on buildStep.reward.unlockCircle, NOT here.
// Zim's role: spell-teacher + emotional anchor only.
// ============================================================

registerQuestDialogue({
  npcId: "zim_the_wizard",
  // No fallback: extension pattern. Legacy NPCScript fires pre-quest.
  branches: [

    // ── Branch 1 · Scroll I → Circle 1 · Amazement ───────────
    {
      id: "zim-turn-in-1",
      when: { questId: "way-of-thoth", onStep: "scroll-2" },
      lines: [
        "Zim is at his workbench when you enter — sorting glass rods by color with the focus of a man who has been failing to think about something else. He looks up. His hands go still.",
        "",
        '"You read it." Not a question. "The actual scroll. Not just handled — read." He sets the last rod down and comes around the bench. "Most would have sold it. I assumed most would."',
        "",
        "He studies you for a long moment, as if revising a number.",
        "",
        '"Greater Heal. Not the hedgerow version — the form that reaches the marrow." He pulls a folded paper from his coat and puts it in your hand. "I have been carrying that for someone worth giving it to. It seems the scroll found them first."',
        "",
        "*(He teaches you Greater Heal with the care of a man making a correction he should have made years ago.)*",
      ],
      fireOnceReward: {
        knownSpells: ["greater-heal"],
        chronicle:
          "Zim looked at you differently after the first scroll. He gave you Greater Heal — not as payment, but as recognition.",
      },
      fireOnceKey: "zim-scroll-1",
    },

    // ── Branch 2 · Scroll II · Curiosity ─────────────────────
    {
      id: "zim-turn-in-2",
      when: { questId: "way-of-thoth", onStep: "scroll-3" },
      lines: [
        "Zim has been waiting for you. The bench is cleared and his hands are folded. He looks up the moment the door opens.",
        "",
        '"Tell me what it did," he says. "Not what it said — what it did. There is a difference and I want to know which one you noticed."',
        "",
        "He listens with the attention of someone adding to a record they have been keeping for a long time.",
        "",
        '"Daylight. Not a torch — a conjured light that does not burn or cast shadow in the usual way." He slides a slim tube of pale crystal across the bench. "Learn the Word and the light answers. You will want it in the places the scroll is sending you."',
        "",
        "*(He teaches you Daylight with the precision of someone who has memorized the spell but hasn't cast it in years.)*",
      ],
      fireOnceReward: {
        knownSpells: ["daylight"],
        chronicle:
          "After the second scroll, Zim began to ask questions. He gave you Daylight and seemed more interested in your answer than the spell.",
      },
      fireOnceKey: "zim-scroll-2",
    },

    // ── Branch 3 · Scroll III → Circle 2 · Awed ──────────────
    {
      id: "zim-turn-in-3",
      when: { questId: "way-of-thoth", onStep: "scroll-4" },
      lines: [
        "He is reading when you arrive and sets the book face-down in the middle of a sentence. The gesture says: you matter more than the page.",
        "",
        '"Three." He says it quietly, as if checking the number against something. "I did not think three was possible at this pace."',
        "",
        "He moves to the cabinet along the far wall — the locked one — and opens it with a key from his breast pocket.",
        "",
        '"Firebolt. The direct form. Not the blunt Circle-3 detonation — a directed bolt that carries intent the way an arrow does and heat the way fire does." He speaks the Words slowly, twice over, until you have them. "You are being prepared for something. I am beginning to understand what."',
        "",
        "*(He teaches you Firebolt with the solemnity of a man arming an ally before a campaign.)*",
      ],
      fireOnceReward: {
        knownSpells: ["firebolt"],
        chronicle:
          "Three scrolls in, Zim opened the locked cabinet and gave you Firebolt. He seemed awed in a way he was working to conceal.",
      },
      fireOnceKey: "zim-scroll-3",
    },

    // ── Branch 4 · Scroll IV · Nervous ───────────────────────
    {
      id: "zim-turn-in-4",
      when: { questId: "way-of-thoth", onStep: "scroll-5" },
      lines: [
        "The humor has gone from his face. He is pacing when you arrive — two steps left, two right — and he stops when he sees you but does not quite settle.",
        "",
        '"Four. And still walking. Good." He does not sound entirely convinced that good is the right word.',
        "",
        '"The scrolls are not just teaching you. The ones who carry them have started to notice that someone is collecting. The knowledge draws attention. The attention has weight." He pauses. "Are you fast on your feet?"',
        "",
        "Before you answer he is already reciting the Words.",
        "",
        '"Haste. For when thinking cannot fix what speed might." He speaks the form quickly, as if in a hurry already. "Learn it. You will need it sooner than you think."',
        "",
        "*(He teaches you Haste without ceremony. The joke is gone from his face and does not come back.)*",
      ],
      fireOnceReward: {
        knownSpells: ["haste"],
        chronicle:
          "Something changed in Zim after the fourth scroll. He gave you Haste and said nothing else. The humor was gone from him.",
      },
      fireOnceKey: "zim-scroll-4",
    },

    // ── Branch 5 · Scroll V → Circle 3 · First Fear ──────────
    {
      id: "zim-turn-in-5",
      when: { questId: "way-of-thoth", onStep: "scroll-6" },
      lines: [
        "He knows. You do not need to tell him about the Circle. He can see it in the way you stand.",
        "",
        '"The third Circle." His voice is careful and even. "You can feel it, can\'t you. It is not a door that opens and closes. It stays open."',
        "",
        "He sits on the stool beside the bench — something you have not seen him do before.",
        "",
        '"I was taught Ward before the third Circle by a woman who said I would regret it if I wasn\'t ready, and regret it worse if I was. She was right on both counts." He speaks the Words. "Ward. A shell of will between you and what comes for you. Cast it when you do not know what is in the room with you yet."',
        "",
        "He holds your gaze.",
        "",
        '"The things that notice you at Circle 3 are not interested in the scroll. They are interested in the door."',
        "",
        "*(He teaches you Ward. His fear is real and he does not try to soften it.)*",
      ],
      fireOnceReward: {
        knownSpells: ["ward"],
        chronicle:
          "After the fifth scroll and the third Circle, Zim showed his first genuine fear. He gave you Ward with the air of a man arming someone going somewhere he cannot follow.",
      },
      fireOnceKey: "zim-scroll-5",
    },

    // ── Branch 6 · Scroll VI · Self-Reflection ────────────────
    {
      id: "zim-turn-in-6",
      when: { questId: "way-of-thoth", onStep: "scroll-7" },
      lines: [
        "He is not at the bench. He is sitting by the window with his back to the room, looking at the street below. He speaks without turning.",
        "",
        '"I had a teacher. When I was younger than you. She gave me my first scroll the same way — just put it in my hands and said: read this first, ask questions after." A pause. "I read it. I did not come back. I was a coward of a different kind than you are."',
        "",
        "Now he turns.",
        "",
        '"I have wondered, since you started coming back, whether I could have walked this far. I do not think I could have. That is worth knowing about yourself."',
        "",
        '"Detect. Not to find what is in front of you — to find what is behind, above, below, and has been there since before you entered." He teaches you the Words. "Use it when you think you are alone."',
        "",
        "*(He teaches you Detect with the focus of a man who has been thinking about his own failures and has arrived somewhere that helped.)*",
      ],
      fireOnceReward: {
        knownSpells: ["detect"],
        chronicle:
          "After the sixth scroll, Zim spoke of his own teacher and his own failures. He gave you Detect — and you understood the gift was also a reckoning.",
      },
      fireOnceKey: "zim-scroll-6",
    },

    // ── Branch 7 · Scroll VII → Circle 4 · Open Dread ────────
    {
      id: "zim-turn-in-7",
      when: { questId: "way-of-thoth", onStep: "scroll-8" },
      lines: [
        "He knows about the fourth Circle before you say it. He has been waiting for this one.",
        "",
        '"Circle Four." He says it flat and even. "The door has been open since Three. But at Four, what lives on the other side has a name for you now. Not your name — a name for what you are. The kind of name that travels."',
        "",
        "He walks to the far end of the bench and back.",
        "",
        '"The cost is not pain. Pain is cheap and the body pays it and forgets. The cost is erosion. Every casting at this circle and above shaves something from the Illumination. Not catastrophic — not at this circle. But cumulative." He stops. "You are not afraid enough. That is the right amount. But you should know."',
        "",
        '"Cleanse. To purge what attaches to you when you reach through the high circles. Cast it after anything above Circle 3." He speaks the Words. "Do not skip it."',
        "",
        "*(He teaches you Cleanse with the bluntness of someone who has watched the alternative.)*",
      ],
      fireOnceReward: {
        knownSpells: ["cleanse"],
        chronicle:
          "After the seventh scroll, Zim named the dread plainly. He gave you Cleanse and explained the erosion cost at Circle Four without softening it.",
      },
      fireOnceKey: "zim-scroll-7",
    },

    // ── Branch 8 · Scroll VIII · Sober ───────────────────────
    {
      id: "zim-turn-in-8",
      when: { questId: "way-of-thoth", onStep: "scroll-9" },
      lines: [
        "He is quiet when you arrive. The kind of quiet that has settled after a decision.",
        "",
        '"Eight." He says it and nods once. Not approval — acknowledgment. "You are past the halfway mark."',
        "",
        "He does not mention what waits at the other end of that mark.",
        "",
        '"Shield. Not armor — armor absorbs. A shield deflects. The distinction matters at the circles you are about to enter." He teaches you the Words without preamble. "Hold it and the blow goes elsewhere. It costs mana faster than the other Circle-4 forms. Worth the price."',
        "",
        "He lets a moment pass.",
        "",
        '"You should sleep while you still do it easily."',
        "",
        "*(He teaches you Shield with the efficiency of a man who has stripped everything unnecessary from his words.)*",
      ],
      fireOnceReward: {
        knownSpells: ["shield"],
        chronicle:
          "The eighth scroll found Zim sober and deliberate. He gave you Shield without ceremony and told you to sleep while it was still simple.",
      },
      fireOnceKey: "zim-scroll-8",
    },

    // ── Branch 9 · Scroll IX → Circle 5 · Genuine Terror ─────
    {
      id: "zim-turn-in-9",
      when: { questId: "way-of-thoth", onStep: "scroll-10" },
      lines: [
        "His hands are not steady. He does not pretend they are.",
        "",
        '"Five." The word comes out carefully. "I need you to understand something. The things in Circle 5 are not abstractions in a text. They existed before the scrolls existed. They will exist after."',
        "",
        "He picks up a tool from the bench and puts it down again.",
        "",
        '"I am afraid. I was afraid at Three. I was afraid at Four. At Five I am afraid in a way I have not been since I was a child and my teacher told me what was in the dark beyond the fire." He meets your eyes. "This is the good kind of fear. It means you understand what you are doing."',
        "",
        '"Steelskin. Because at Circle 5 the things that come for you hit hard and without warning." He speaks the Words. His voice is level. "You will know when to cast it."',
        "",
        "*(He teaches you Steelskin. He is frightened and he is still here. That, too, is a teaching.)*",
      ],
      fireOnceReward: {
        knownSpells: ["steelskin"],
        chronicle:
          "After the ninth scroll and the fifth Circle, Zim was afraid and made no attempt to hide it. He gave you Steelskin and named the fear as comprehension, not weakness.",
      },
      fireOnceKey: "zim-scroll-9",
    },

    // ── Branch 10 · Scroll X · Conspiratorial ────────────────
    {
      id: "zim-turn-in-10",
      when: { questId: "way-of-thoth", onStep: "scroll-11" },
      lines: [
        '"Old Bram is gone."',
        "",
        "He says it when you sit down. No preamble.",
        "",
        '"Two weeks ago. Someone saw him taken off the street near the alms-corner. Not arrested — taken. There is a difference." He keeps his voice low. "He was of the Way. You met him. You know what that means."',
        "",
        "He leans across the bench.",
        "",
        '"It means they know what you are doing. Not your name — not yet. But they know someone is walking the scrolls, and they have decided to start removing the network." A pause. "Old Bram was Circle 2. Gentle man. He knew nothing that could have helped them — and they took him anyway."',
        "",
        '"Silence. To become something that makes no noise in the Aether when you cast. The things that follow you at this stage can hear a Word spoken at fifty paces of the other world." He speaks the form quietly. "Cast it on yourself before you enter any space you are not certain of."',
        "",
        "*(He teaches you Silence. What he cannot teach you is what happened to Old Bram.)*",
      ],
      fireOnceReward: {
        knownSpells: ["silence"],
        chronicle:
          "After the tenth scroll, Zim told you Old Bram was gone — taken, not arrested. He gave you Silence with the urgency of a man counting losses and not done counting.",
      },
      fireOnceKey: "zim-scroll-10",
    },

    // ── Branch 11 · Scroll XI → Circle 6 · Resigned ──────────
    {
      id: "zim-turn-in-11",
      when: { questId: "way-of-thoth", onStep: "scroll-12" },
      lines: [
        "Something has cleared from his face since the last time. The noise is gone — the nervous energy, the pacing. What is left is simple and direct.",
        "",
        '"Eleven." He nods. "You are going to finish this, aren\'t you. I stopped believing that was possible for someone my age. I am beginning to believe it is possible for you."',
        "",
        "He does not say this warmly. He says it like a man updating a record.",
        "",
        '"Circle 6 means the Word is beginning to hear itself in you. That is what the Circle unlocks — not your access to the spell, but the spell\'s access to you. They are different directions."',
        "",
        '"Resist. To hold what the high circles throw at you without letting it through." He speaks the Words. "Not a shield — Resist is what happens after the shield fails. Cast it when you are inside something you cannot leave quickly."',
        "",
        "*(He teaches you Resist. He is resigned the way a man is resigned when he has accepted the weight and decided it is his to carry.)*",
      ],
      fireOnceReward: {
        knownSpells: ["resist"],
        chronicle:
          "After the eleventh scroll, Zim was resigned in a way that had stripped him of noise. He gave you Resist and explained the difference between a shield and what comes after a shield fails.",
      },
      fireOnceKey: "zim-scroll-11",
    },

    // ── Branch 12 · Scroll XII · Mournful ────────────────────
    {
      id: "zim-turn-in-12",
      when: { questId: "way-of-thoth", onStep: "scroll-13" },
      lines: [
        '"Maelis is dead."',
        "",
        "He does not look up when you enter. He is sitting at the bench with his hands flat on the surface and his eyes on the middle distance.",
        "",
        '"She was the seer. The one in the reed hut on the salt marsh. She dreamed things before they happened and she was almost always right." A pause. "Khepratha found her two nights ago. She was not built for fighting. That was never the point of her."',
        "",
        "He closes his eyes for a moment.",
        "",
        '"She heard me once, in a dream, she said — before we had ever met. She described the room we were standing in when she told me. Every detail correct." He opens his eyes. "That kind of person is not common. That kind of person is not replaceable."',
        "",
        '"Mirror. To throw back what comes for you through the Aether — spells, intentions, the attention of things that should not have found you." He speaks the Words. "Maelis knew this one. She is the reason I know it."',
        "",
        "*(He teaches you Mirror. He does not say anything else for a long time.)*",
      ],
      fireOnceReward: {
        knownSpells: ["mirror"],
        chronicle:
          "Maelis the Seer was dead by the twelfth scroll. Zim gave you Mirror in her memory, and said she was the reason he knew it.",
      },
      fireOnceKey: "zim-scroll-12",
    },

    // ── Branch 13 · Scroll XIII → Circle 7 · Defiant ─────────
    {
      id: "zim-turn-in-13",
      when: { questId: "way-of-thoth", onStep: "scroll-14" },
      lines: [
        "He is standing when you arrive. Not pacing — standing, as if he has decided something.",
        "",
        '"Thirteen. Circle 7." He says it and then says what he has been thinking: "We are losing people. Old Bram, Maelis. Others I have not told you about because they were taken before you started and I did not want to weight the first half of your walk with the full count." He pauses. "But you have arrived at Circle 7 anyway."',
        "",
        "He says the next thing with some surprise.",
        "",
        '"I find that I am no longer afraid. Not because the danger is less. Because watching you walk this far has convinced me that the Way is going to outlast its enemies. I am not certain of that. But I feel it."',
        "",
        '"Banish. To drive out what has no right to be here — spirits, bound entities, presences that slipped through someone\'s broken working and stayed." He speaks the Words. "It is not a weapon. It is a correction. Say it with that intention."',
        "",
        "*(He teaches you Banish with a conviction that has come from somewhere he did not have access to a week ago.)*",
      ],
      fireOnceReward: {
        knownSpells: ["banish"],
        chronicle:
          "The thirteenth scroll found Zim defiant for the first time since his fear began. He gave you Banish and said the Way was going to outlast its enemies — and seemed surprised to believe it.",
      },
      fireOnceKey: "zim-scroll-13",
    },

    // ── Branch 14 · Scroll XIV · Reverent ────────────────────
    {
      id: "zim-turn-in-14",
      when: { questId: "way-of-thoth", onStep: "scroll-15" },
      lines: [
        "He already knows about the Logos Teleios. He does not say how.",
        "",
        '"The Perfect Discourse." He says it very quietly. "I read it once, in a translation, twenty years ago. In a library that does not exist anymore, kept by a man who does not exist anymore. I thought I understood it." He shakes his head. "I understood the words."',
        "",
        "He sits and folds his hands.",
        "",
        '"Brother Inan found the original. That should not be possible — the Pre-Thurian vault has been sealed for a thousand years. And yet." He looks at you. "And yet here you are, having read it. The Way does not explain this. It is just the Way."',
        "",
        '"Invoke Light." He speaks the Words first, before explaining them — as if they are an offering. Then: "The direct call to the Word. Not a light-spell — a declaration. You are saying: the Word that built this place is real, and I am standing in it, and I am asking it to answer. The most demanding form I know. It asks something of you every time."',
        "",
        "*(He teaches you Invoke Light with the reverence of a man who has stopped pretending he is a skeptic.)*",
      ],
      fireOnceReward: {
        knownSpells: ["invoke-light"],
        chronicle:
          "After the fourteenth scroll and the Logos Teleios, Zim taught you Invoke Light. He read the Words aloud before he explained them — as if making an offering rather than giving a lesson.",
      },
      fireOnceKey: "zim-scroll-14",
    },

    // ── Branch 15 · Quest Complete · The Threshold ────────────
    {
      id: "zim-threshold",
      when: { questId: "way-of-thoth", questCompleted: true },
      lines: [
        "He is waiting for you. The bench has been cleared completely — tools, glass, catalogue cards, everything. The surface is bare.",
        "",
        '"You have all fifteen." It is not a question and not quite a congratulation. Something between. "Sit down."',
        "",
        "You sit. He sits across from you.",
        "",
        '"There is one more thing I can teach you. I have not decided whether I should, but I am going to — because you have earned the right to know it, and because if I do not tell you, you will learn it from someone worse."',
        "",
        "He folds his hands on the bare bench.",
        "",
        '"The binding rite. The Words that call the fifteen scrolls from their fifteen hands and weave them into a single Book. Whoever speaks the rite holds the whole of the Way — every Circle, every Word, every working, simultaneously, without the progression." He speaks the rite once, quietly, in full. "That is what it does."',
        "",
        "He lets the silence sit.",
        "",
        '"Here is what I am asking you. The greatest Adepts who have tried this are dead, or worse. Not because the rite failed — because it worked. The Book is not meant to be held by a single soul. It was sundered for a reason. The world\'s memory of why is very long."',
        "",
        "He stands.",
        "",
        '"I am asking you not to bind the Book. I have no authority to forbid you anything, not now, not after this walk. I am asking." He looks at you steadily. "The choice is yours and it has always been yours. Make it knowing what I told you."',
        "",
        '"Whatever you choose: you have walked the Way further than I have. Further than anyone I have trained. That is true and I want you to know it."',
        "",
        "He picks up a glass rod from the shelf — the last thing left — and turns it over in his fingers.",
        "",
        '"Go. The lighthouse is waiting."',
        "",
        "*(Zim turns back to the shelf. He does not watch you leave.)*",
      ],
      fireOnceReward: {
        legacyChronicle:
          "You completed the Way of Thoth and returned to Zim at the threshold. He taught you the binding rite and asked you not to use it. The choice was yours. It has always been yours.",
      },
      fireOnceKey: "zim-threshold",
    },

  ],
});

export default WAY_OF_THOTH;
