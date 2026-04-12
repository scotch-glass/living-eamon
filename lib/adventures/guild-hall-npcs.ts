// ============================================================
// GUILD HALL — NPC SCRIPTED INTERACTIONS
// All scripted NPC dialogue for the Guild Hall hub lives here.
// route.ts reads these scripts via the registry — no prose in
// the router.
// ============================================================

import type { NPCScript } from "../roomTypes";
import { NPCS } from "../gameData";

// ── Aldric's welcome (first Main Hall entry after amnesia) ──
// Aldric is the most talkative, forthcoming NPC in the hub.
// He proactively buys the hero a drink, says their name
// (triggering the name-revelation), explains the situation,
// and walks them through the basics via command chips.

const ALDRIC_WELCOME: NPCScript = {
  id: "aldric_welcome",
  npcId: "old_mercenary",
  condition: {
    room: "main_hall",
    playerState: {
      remembersOwnName: false,
      previousRoomNotNull: true,
    },
  },
  trigger: "on_enter",
  lines: [
    "",
    "A weathered man with a grey beard and a prosthetic left hand carved from dark wood looks up from a corner booth. He takes in the whole situation in about two seconds — the gray robe, the empty hands, the look of someone who just woke up somewhere they don't remember.",
    "",
    "He doesn't hesitate. He raises two fingers toward the bar and a tankard appears. He sets it in front of you.",
    "",
    "\"Sit down. Drink. My treat.\"",
  ],
  stateUpdate: () => ({
    remembersOwnName: true,
  }),
};

/**
 * Build the Aldric welcome response dynamically — we need the player's
 * name for the revelation scene, which isn't available in static lines.
 */
export function getAldricWelcomeLines(playerName: string, hasRobe: boolean): string[] {
  const nameReveal = hasRobe
    ? [
        `He waits until you drink, then says it: "${playerName}."`,
        "",
        `The word lands like something dropped from a height. You stare at him.`,
        "",
        `"${playerName}?" you repeat. The name feels strange in your mouth. Familiar, but from a long way off.`,
        "",
        `He gestures at the gray gown you're wearing. You look down. There, stitched into the hem in small neat letters: ${playerName}.`,
        "",
        `Your name. You know your name. Everything else is fog — but that, at least, is solid ground.`,
      ]
    : [
        `He waits until you drink, then says it: "${playerName}."`,
        "",
        `The word lands like something dropped from a height. You stare at him.`,
        "",
        `"${playerName}?" you repeat. The name feels strange in your mouth. Familiar, but from a long way off.`,
        "",
        `"I know you," he says. "From before. I don't know the details — just the name, and that I've seen you in here many times." A beat of silence. "You don't remember, do you."`,
        "",
        `Your name. You know your name. Everything else is fog — but that, at least, is solid ground.`,
      ];

  return [
    ...nameReveal,
    "",
    `Aldric leans back. "I can see your situation, ${playerName}. Last you left the Hall, you were in a furious rush and armed for slaughter. I'm guessing you lost, and lost badly. That's all I know about you."`,
    "",
    `He pauses. "But first — which one of these lovely women should bring us a proper drink?" He nods toward the bar, where three women work the room.`,
    "",
    "__BARMAID_SELECT__",
  ];
}

// ── Combat training response (YES → courtyard with Dufus) ──

const ALDRIC_TRAINING_RESPONSE: NPCScript = {
  id: "aldric_training_response",
  npcId: "old_mercenary",
  condition: {
    room: "main_hall",
  },
  trigger: "on_response",
  validInputs: ["YES", "NO"],
  lines: [],
  stateUpdate: () => ({}),
};

/**
 * Build response for the combat training YES/NO.
 */
export function getAldricTrainingLines(input: string, playerName: string, weapon: string): { lines: string[]; giveWeapon: boolean } {
  if (input === "YES") {
    const unarmed = weapon === "unarmed";
    const weaponGift = unarmed
      ? [
          "",
          `Aldric looks at your empty hands. He sighs — not unkindly — and reaches behind the dummy where a short sword leans against the wall. It's well-used, the leather grip dark with old sweat, but the edge is sound.`,
          "",
          `"Can't have you punching the dummy barehanded. Take this. It's nobody's anymore."`,
          "",
          `You have a Well-Used Short Sword. It is equipped.`,
        ]
      : [];

    return {
      lines: [
        `Aldric stands. It's the first time you've seen him move — he's bigger than you expected. The wooden hand clicks against the table edge.`,
        "",
        `"Good. Follow me."`,
        "",
        `He leads you west through the Main Hall doors and into the courtyard. Weathered wooden training dummies stand in a row along the far wall. Aldric walks to one and slaps it on the shoulder like an old friend.`,
        "",
        `"${playerName}, meet Dufus." He gestures at the dummy. Someone has carved the name DUFUS into its forehead in rough letters. "Dufus has been here longer than I have. He doesn't hit back, he doesn't complain, and he doesn't judge. Perfect training partner."`,
        ...weaponGift,
        "",
        `"Now — __CMD:ATTACK DUFUS__. Strike different body parts. __CMD:STRIKE HEAD__, __CMD:STRIKE NECK__, __CMD:STRIKE TORSO__, __CMD:STRIKE LIMBS__. Smaller targets are harder to hit but do more damage when they land."`,
        "",
        `"Dufus will teach you the basics. After that, you'll want real enemies." He nods toward the Main Hall. "Three contracts on the notice board when you're ready."`,
        "",
        `Aldric walks back inside, leaving you in the courtyard.`,
      ],
      giveWeapon: unarmed,
    };
  }

  // NO
  return {
    lines: [
      `Aldric shrugs. "Suit yourself. The dummy isn't going anywhere." He drains his tankard.`,
      "",
      `"When you're ready, head south to the courtyard. Dufus will be waiting. He always is."`,
      "",
      `He settles back into his corner booth.`,
    ],
    giveWeapon: false,
  };
}

// ── Barmaid selection (fires after training choice) ─────────

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
  lines: [],
  stateUpdate: (input: string) => ({
    barmaidPreference: input.toLowerCase(),
  }),
};

/**
 * Build the response lines for a barmaid selection.
 * Called by route.ts when the script matches.
 * Returns lines + the chosen barmaid NPC id for sprite display.
 */
export function getBarmaidResponseLines(input: string, isFirstMeeting: boolean): { lines: string[]; barmaidNpcId: string } {
  const chosen = input.toLowerCase();
  const barmaid = NPCS[chosen];
  if (!barmaid) return { lines: [`Someone brings two tankards to the table.`], barmaidNpcId: chosen };

  const arrivalFn = BARMAID_ARRIVALS[chosen];
  const arrival = arrivalFn
    ? arrivalFn(barmaid.name)
    : `${barmaid.name} brings two tankards to the table.`;

  const baseLines = [
    `Aldric raises two fingers toward the bar. ${barmaid.name} catches the signal.`,
    "",
    arrival,
  ];

  if (isFirstMeeting) {
    // First meeting: barmaid arrives, then Aldric launches into the tutorial
    return {
      lines: [
        ...baseLines,
        "",
        `Aldric lifts his drink. "Good. Now — what would you like to remember first?"`,
        "",
        `__CMD:TELL Aldric survival__ __CMD:TELL Aldric combat__ __CMD:TELL Aldric adventures__`,
        `__CMD:TELL Aldric training__ __CMD:TELL Aldric skills__ __CMD:TELL Aldric world__`,
        `__CMD:TELL Aldric magic__ __CMD:TELL Aldric secrets__`,
        "",
        `"And if you forget any of this again — ask yourself for __CMD:HELP__. It all comes back."`,
        "",
        `He drains half his tankard in one pull. "Would you like to remember how to fight? I can take you out to the courtyard and we can knock the rust off."`,
        "",
        "__YESNO__",
      ],
      barmaidNpcId: chosen,
    };
  }

  // Subsequent visits: just the barmaid arrival
  return {
    lines: [
      ...baseLines,
      "",
      `Aldric lifts his drink. "Good choice." He settles back into his corner booth.`,
    ],
    barmaidNpcId: chosen,
  };
}

// ── Zim's Introduction (first visit to Pots & Bobbles) ──────

const ZIM_WELCOME: NPCScript = {
  id: "zim_welcome",
  npcId: "zim_the_wizard",
  condition: {
    room: "mage_school",
    playerState: {
      metZim: false,
    },
  },
  trigger: "on_enter",
  lines: [], // built dynamically
  stateUpdate: () => ({
    metZim: true,
  }),
};

export function getZimWelcomeLines(playerName: string): string[] {
  return [
    "",
    `A tall, gangly young man in ink-stained robes looks up from three open books. His spectacles are crooked. His eyes go wide.`,
    "",
    `"Wow..." he breathes. "${playerName}, you've been erased, haven't you. A shame. They say life is memory. That really means you lost your true life."`,
    "",
    `He freezes. His hand clamps over his mouth. His eyes go wider.`,
    "",
    `"I — " he mutters through his fingers. "I always — I talk too much. I'm sorry. That was horrible. I'm Zim. I'm — sorry."`,
    "",
    `He takes a visible breath, pulls himself together, and hops off his stool.`,
    "",
    `"Let me make it up to you. I can teach you the basics of healing magic — CAST HEAL — it won't fix your memory but it will fix a few scrapes and cuts. Normally a hundred and fifty gold for the introductory course but — " he waves vaguely at his own mouth " — considering my rudeness, I'll do it for a hundred. Would you like to learn?"`,
    "",
    `__YESNO__`,
  ];
}

const ZIM_HEAL_RESPONSE: NPCScript = {
  id: "zim_heal_response",
  npcId: "zim_the_wizard",
  condition: {
    room: "mage_school",
  },
  trigger: "on_response",
  validInputs: ["YES", "NO"],
  lines: [],
  stateUpdate: () => ({}),
};

/** Common text about reagents, identification, and potions — appended to all Zim YES/NO paths. */
function zimReagentSpeech(): string[] {
  return [
    `"Now — when you're out in the field, keep your eyes open for reagents. __CMD:EXAMINE__ anything that looks like a plant, a crystal, or a substance that shouldn't be there. Mandrake root, ginseng, blood moss, nightshade, black pearls, spider silk — I buy all of it. Bring it to me and I'll pay fair."`,
    "",
    `He leans in and drops his voice. "Also — and this is important — if you find any magical items, bring them to me before you use them. I identify things for a small fee. It's important because some items are cursed, and —"`,
    "",
    `He looks around the empty shop, then whispers: "...or have been corrupted by demons or even darker ancient forces."`,
    "",
    `He crosses himself — shoulder, shoulder, forehead, heart, then kisses his fingertips. The gesture is quick and practiced, like someone who does it a lot.`,
    "",
    `"Just bring them to me first. That's all I'm saying."`,
    "",
    `"Oh, and potions!" He gestures at the glass counter:`,
    "",
    `__CMD:BUY HEALING POTION__ Healing Potion | 25 gp · __CMD:BUY GREATER HEALING POTION__ Greater Healing | 60 gp`,
    `__CMD:BUY STAMINA BREW__ Stamina Brew | 20 gp · __CMD:BUY FATIGUE BREW__ Fatigue Brew | 40 gp`,
    `__CMD:BUY ANTIDOTE__ Antidote | 10 gp · __CMD:BUY STRONG ANTIDOTE__ Strong Antidote | 30 gp`,
    `__CMD:BUY BANDAGE__ Bandage | 5 gp · __CMD:BUY TOURNIQUET__ Tourniquet | 15 gp`,
    `__CMD:BUY MANA POTION__ Mana Potion | 30 gp`,
    `__CMD:BUY UNRELIABLE POISON__ Unreliable Poison | 20 gp · __CMD:BUY STRONG POISON__ Strong Poison | 50 gp`,
  ];
}

/** Zim's explanation of the magic curriculum — shown on YES regardless of gold. */
function zimCurriculumSpeech(): string[] {
  return [
    `Zim pulls a chalk slate from under the counter. He's vibrating with enthusiasm. Then he stops.`,
    "",
    `"You know — you never seemed interested in magic before. Not once. It's a bit different now that you've been on the wrong side of a nasty wizard, eh?"`,
    "",
    `He freezes again. Closes his eyes.`,
    "",
    `"I did it again. Sorry. Moving on."`,
    "",
    `He starts writing on the slate, chalk squeaking:`,
    "",
    `"The Guild authorizes four schools of magic. Each has eight levels of power. I teach the entry level — Level One — for each school. Higher levels, you'll need to find more advanced teachers or... other means."`,
    "",
    `__CMD:BUY HEAL__ HEAL — Mends wounds. The foundation. | 100 gp (discounted for you)`,
    `__CMD:BUY BLAST__ BLAST — Raw offensive energy. | 150 gp`,
    `__CMD:BUY LIGHT__ LIGHT — Illumination. Reveals hidden things. | 75 gp`,
    `__CMD:BUY SPEED__ SPEED — Quickens reflexes. Better initiative and evasion. | 125 gp`,
    "",
    `"Each spell costs a little bit of life force energy to cast. We call it Mana." He taps his chest. "You can feel it — a warmth right here, behind the sternum. Every person has some. Casting draws from it. It regenerates over time, or you can drink a mana potion to restore it quickly."`,
    "",
    `"Don't drain yourself completely. Zero mana is..." He makes a face. "Unpleasant. You'll know."`,
  ];
}

export function getZimHealResponseLines(input: string, gold: number): string[] {
  if (input === "YES") {
    const curriculum = zimCurriculumSpeech();
    const reagents = zimReagentSpeech();

    if (gold >= 100) {
      return [
        `"Excellent!" Zim's face lights up.`,
        "",
        ...curriculum,
        "",
        `"Let's start with Heal."`,
        "",
        `He talks for ten minutes without stopping. The principle, he says, is simple — you channel ambient thaumic energy through your palms into the wound site. The body wants to heal. You're just reminding it. Aggressively.`,
        "",
        `You understood about a third of it. But something clicked.`,
        "",
        `You learned HEAL (Level 1). This will allow you to __CMD:CAST HEAL__ when you need it. 100 gold deducted.`,
        "",
        `"Come back when you have gold for the others," Zim says. "I'm always here."`,
        "",
        ...reagents,
      ];
    }
    return [
      `"Excellent! Let me show you what's available —"`,
      "",
      ...curriculum,
      "",
      `Zim pauses. He looks at your belt. Counts on his fingers.`,
      "",
      `"You don't have a hundred gold yet, do you." It's not a question.`,
      "",
      `He sighs. "The offer stands. All of them stand. Come back when you've earned it — the Beginner's Cave pays well enough for goblins. I'll be here." He gestures at the books. "I'm always here."`,
      "",
      ...reagents,
    ];
  }

  // NO
  return [
    `"No problem at all," Zim says, though he deflates slightly. "The offer stands whenever you change your mind."`,
    "",
    ...zimCurriculumSpeech(),
    "",
    `"Any of those, any time. Just say the word."`,
    "",
    ...zimReagentSpeech(),
  ];
}

// ── Sam's Shop Greeting (every entry to Sam's Sharps) ───────

// Sam's greeting removed from on_enter to prevent it appending to every command response.
// Sam's greeting is in his NPC data. The SHOP command shows his wares.

// ── All Guild Hall NPC scripts ───────────────────────────────

export const GUILD_HALL_NPC_SCRIPTS: NPCScript[] = [
  ALDRIC_WELCOME,
  ALDRIC_TRAINING_RESPONSE,
  BARMAID_SELECT_RESPONSE,
  ZIM_WELCOME,
  ZIM_HEAL_RESPONSE,
];
