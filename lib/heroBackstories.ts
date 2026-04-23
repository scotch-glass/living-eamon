// Prescripted "last memory" backstory templates for character creation.
// Each is a short vague memory of a divine non-human being granting a
// curse or a blessing. This is the final memory before the hero wakes
// on the floor of the Church of Perpetual Life with hazy recall.
//
// The divine entities in these templates are deliberately generic
// (shapes of flame, light, stars) — not tied to any specific named
// pantheon, PD or otherwise. This keeps us safe from IP entanglement
// and reinforces the game's "it is known, and it is not" tone.

export type BackstoryAlignment = "blessing" | "curse" | "ambiguous";

export interface HeroBackstoryTemplate {
  id: string;
  title: string;
  alignment: BackstoryAlignment;
  /** One-line summary shown on the card. */
  preview: string;
  /** The full text that fills the backstory field. 2–4 sentences. */
  full: string;
}

export const HERO_BACKSTORIES: HeroBackstoryTemplate[] = [
  // ── Blessings ─────────────────────────────────────────────
  {
    id: "pillar_of_white_fire",
    title: "Pillar of White Fire",
    alignment: "blessing",
    preview: "A pillar spoke your name. Your palm remembers.",
    full: "A pillar of white fire spoke your name in a voice that shook the air. It burned its shape into your left palm. No scar remains, but when you clench a weapon the fire answers from somewhere inside the bone.",
  },
  {
    id: "coin_of_obsidian",
    title: "The Coin Under the Tongue",
    alignment: "blessing",
    preview: "A being of stars gave you something to swallow.",
    full: "A being of quiet stars set a coin of obsidian under your tongue. \"Swallow it when death takes you,\" it said, \"and only then.\" You do not remember if you did.",
  },
  {
    id: "winged_breath",
    title: "The Passing Wing",
    alignment: "blessing",
    preview: "A pale-lit wing passed over you in the dark.",
    full: "A winged shape of pale light passed over you in a black field you cannot name. It touched your chest on the downstroke. You breathe easier than a mortal should when you are afraid.",
  },
  {
    id: "rope_of_living_fire",
    title: "The Binding Rope",
    alignment: "blessing",
    preview: "Rope of fire bound your wrists; it hardened instead of burning.",
    full: "A rope of living fire wound itself around your wrists. It did not burn. It hardened your bones instead, from the inside, without pain. You do not break easily now, and you do not remember a time when you did.",
  },
  {
    id: "blue_flame_weeping",
    title: "The Weeping Face",
    alignment: "blessing",
    preview: "A face of blue flame wept onto your eyes.",
    full: "A face of blue flame wept silver tears onto your eyes. They did not burn. You see a little further in the dark than other men, and the dark sees you less clearly for it.",
  },
  {
    id: "spear_of_light_worm",
    title: "The Grey Worm",
    alignment: "blessing",
    preview: "A spear of light drew a worm out of your forehead.",
    full: "Something shaped like a spear of pale light pierced your forehead and drew out a thin grey worm. You do not remember the worm. The worm remembers you, wherever it has gone.",
  },
  {
    id: "molten_gold_circle",
    title: "The Unspoken Word",
    alignment: "blessing",
    preview: "A circle of gold rose and gave you a word.",
    full: "A circle of molten gold rose around you and sank back into the earth. Something stayed behind — a word on your tongue that no living man has spoken aloud. You have not said it yet. You will know when.",
  },
  {
    id: "six_shapes_cave",
    title: "The Hidden Shadow",
    alignment: "blessing",
    preview: "Six shapes of fire in a four-cornered cave.",
    full: "Six shapes of pale fire stood at the six corners of a cave that had only four. The one to the north hid your shadow behind its own. Your shadow answers to you a little differently now.",
  },
  {
    id: "wind_of_white_light",
    title: "The Lifting Wind",
    alignment: "blessing",
    preview: "A wind set you down in another place.",
    full: "A wind of white light lifted you off the ground. When it set you down you were in another place, and your footprints remain where you were not. Sometimes travellers speak of finding them.",
  },
  {
    id: "drop_of_green_fire",
    title: "The Green Drop",
    alignment: "blessing",
    preview: "A green flame sank through your chest without burning.",
    full: "A single drop of green fire landed on your chest and sank through it without burning. It did not leave. Something in your heart is not entirely yours anymore, and it answers calls you do not make.",
  },

  // ── Curses ────────────────────────────────────────────────
  {
    id: "black_flame_shadow",
    title: "The Stolen Shadow",
    alignment: "curse",
    preview: "Black flame tore your shadow loose and swallowed it.",
    full: "A shape of black flame tore your shadow loose and swallowed it. You cast a new shadow now. It is not the same shape as you, and at noon it points the wrong way.",
  },
  {
    id: "cold_blue_question",
    title: "The Unanswered Question",
    alignment: "curse",
    preview: "A cold-lit figure asked a question you could not answer.",
    full: "A figure of cold blue light asked you a question in a language you knew for a moment. You could not answer. It cut you a small mark beneath your ribs that weeps a little salt when you lie.",
  },
  {
    id: "counted_breaths",
    title: "The Counted Breaths",
    alignment: "curse",
    preview: "An orange flame counted your breaths and stopped.",
    full: "A being of orange fire counted your breaths aloud. It stopped at one hundred and twenty-three thousand. You do not know how many you have used since, and you do not know what happens when the count runs out.",
  },
  {
    id: "white_serpent_heel",
    title: "The Wayward Foot",
    alignment: "curse",
    preview: "A serpent of white light bit your heel.",
    full: "A serpent of white light bit your heel and left no puncture. Sometimes, now, your right foot will not take you where you meant to go. It takes you somewhere else. Sometimes you are glad.",
  },
  {
    id: "silver_flame_death",
    title: "The Shown Death",
    alignment: "curse",
    preview: "A silver-flame face showed you your own death.",
    full: "A face of silver flame showed you your own death. It was nothing like glorious. You do not want to tell anyone what you saw, and you cannot say why the words will not form.",
  },
  {
    id: "yellow_fire_true_name",
    title: "The Burnt-Out Name",
    alignment: "curse",
    preview: "A yellow pillar burnt your true name out of you.",
    full: "A pillar of yellow fire burnt your true name out of you. What you call yourself now is not your true name, and you know it. You do not know what is. Some nights you almost remember.",
  },

  // ── Ambiguous ─────────────────────────────────────────────
  {
    id: "violet_hands",
    title: "The Cold and Hot Hand",
    alignment: "ambiguous",
    preview: "A violet being laid one hot, one cold hand on you.",
    full: "A being of pale violet light laid a cold hand on your chest and a hot hand on your back. Something moved between them, through you. You do not know yet which hand gave and which hand took.",
  },
  {
    id: "bronze_sigil_eyelids",
    title: "The Sigil on the Eyelid",
    alignment: "ambiguous",
    preview: "A bronze shape wrote a sigil inside your eyelids.",
    full: "A shape of molten bronze wrote a sigil on the inside of your eyelids. When you sleep, the sigil shines behind your closed eyes. You do not sleep as deeply now, but you do not remember your dreams either.",
  },
  {
    id: "white_flame_friend",
    title: "The Named Friend",
    alignment: "ambiguous",
    preview: "A white flame asked you to name a friend. You did.",
    full: "A column of white flame asked you to name a friend. You named one. The friend is not where you remember leaving him, and no one you ask remembers him either.",
  },
  {
    id: "light_voice_choice",
    title: "The Two-Door Choice",
    alignment: "ambiguous",
    preview: "A voice of light offered forgetting or fearing.",
    full: "A voice of pure light offered you a choice between forgetting and fearing. You do not remember which you picked, but you woke with one of them, and some mornings you suspect you did not pick either.",
  },
];

export function backstoriesByAlignment(
  filter: BackstoryAlignment | "all"
): HeroBackstoryTemplate[] {
  if (filter === "all") return HERO_BACKSTORIES;
  return HERO_BACKSTORIES.filter((b) => b.alignment === filter);
}
