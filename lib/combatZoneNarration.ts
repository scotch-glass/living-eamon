// ============================================================
// LIVING EAMON — Zone-Specific Combat Narration
// Extends combatNarrationPools.ts with HWRR body-zone awareness.
// Template vars: {attacker}, {defender}, {weapon}, {damage}, {zone}
// ============================================================

import type { BodyZone, StatusEffectType, StrikeResolution } from "./combatTypes";
import type { WeaponCategory, WoundTier } from "./combatNarrationPools";

// ── Helpers ─────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key as string] ?? key);
}

// ── Zone Damage Tier ────────────────────────────────────────
// Converts raw damage into wound tier relative to defender max HP.

export function getZoneWoundTier(damage: number, maxHp: number): WoundTier {
  const pct = damage / Math.max(1, maxHp);
  if (pct <= 0.12) return "glancing";
  if (pct <= 0.3) return "solid";
  return "devastating";
}

// ── EVASION NARRATION (by zone) ─────────────────────────────

const EVASION_POOLS: Record<BodyZone, string[]> = {
  head: [
    "{defender} ducks and the blow sails over.",
    "{defender} jerks aside — the strike cuts nothing but air where the skull was.",
    "{defender} twists away from the head strike at the last instant.",
  ],
  neck: [
    "{defender} pulls back and the blade hisses past the throat.",
    "{defender} drops a shoulder — the neck strike finds nothing.",
    "The strike aimed at the throat goes wide as {defender} sways aside.",
  ],
  torso: [
    "{defender} sidesteps the body blow.",
    "{defender} pivots — the torso strike catches only cloth.",
    "A quick half-step and {defender} avoids the torso strike entirely.",
  ],
  limbs: [
    "{defender} pulls the arm back in time.",
    "{defender} hops aside — the limb strike whiffs.",
    "The strike aimed at the limbs finds empty space where {defender} was standing.",
  ],
};

// ── SHIELD BLOCK NARRATION (by zone) ────────────────────────

const SHIELD_BLOCK_POOLS: Record<BodyZone, string[]> = {
  head: [
    "{defender}'s shield snaps up — the head strike clangs off the boss.",
    "The shield catches the blow aimed at {defender}'s skull.",
  ],
  neck: [
    "{defender} gets the shield edge up and catches the throat strike.",
    "The shield deflects the strike aimed at the neck.",
  ],
  torso: [
    "{defender} brings the shield across and absorbs the body blow.",
    "The torso strike hammers into {defender}'s shield.",
  ],
  limbs: [
    "{defender} drops the shield low and blocks the limb strike.",
    "The strike at the limbs rings off {defender}'s shield.",
  ],
};

const SHIELD_BROKEN_POOLS: Record<BodyZone, string[]> = {
  head: ["{defender}'s shield catches the head blow — and splinters apart!"],
  neck: ["{defender}'s shield stops the throat strike — but cracks to pieces!"],
  torso: ["{defender}'s shield absorbs the body blow — and shatters!"],
  limbs: ["{defender}'s shield blocks the limb strike — and falls apart!"],
};

// ── ARMOR STOP NARRATION (by zone) ──────────────────────────

const ARMOR_STOP_POOLS: Record<BodyZone, string[]> = {
  head: [
    "The strike glances off {defender}'s helm.",
    "{attacker}'s blow rings off the helmet and does no harm.",
    "The headpiece holds — the strike slides off without penetrating.",
  ],
  neck: [
    "The gorget catches the blow at the throat.",
    "{attacker}'s strike scrapes across the neck guard without finding flesh.",
    "The throat armor turns the blade aside.",
  ],
  torso: [
    "{attacker}'s strike skids across {defender}'s chest armor.",
    "The body armor absorbs the blow without yielding.",
    "A solid hit — but the torso plate holds.",
  ],
  limbs: [
    "The greaves catch the strike before it can bite.",
    "{attacker}'s blow bounces off the limb armor.",
    "The limb guard deflects the blow.",
  ],
};

const ARMOR_BROKEN_POOLS: Record<BodyZone, string[]> = {
  head: [
    "The helm absorbs one last blow — and cracks apart. {defender}'s head is exposed.",
    "{attacker}'s strike shatters the headpiece. The fragments fall away.",
  ],
  neck: [
    "The gorget stops the strike — but crumples. The throat is unprotected now.",
    "The neck guard catches the blow and tears free, leaving {defender}'s throat bare.",
  ],
  torso: [
    "The chest armor holds against the strike — barely. The plate buckles and falls away in pieces.",
    "One hit too many. The body armor cracks apart and clatters to the ground.",
  ],
  limbs: [
    "The limb guard catches the blow and splits. {defender}'s limbs are unarmored now.",
    "The greaves shatter under the strike, leaving the limbs exposed.",
  ],
};

// ── HIT NARRATION — PLAYER STRIKES ENEMY (zone × weapon × tier) ──

type ZoneHitPool = Record<BodyZone, Record<WeaponCategory, Record<WoundTier, string[]>>>;

const PLAYER_ZONE_HIT: ZoneHitPool = {
  head: {
    slash: {
      glancing: [
        "Your {weapon} clips the {enemy}'s skull — a shallow cut above the brow. ({damage} damage)",
        "A glancing slash across the {enemy}'s temple. Blood but no real depth. ({damage} damage)",
        "Your {weapon} catches the {enemy}'s ear. A nick, nothing more. ({damage} damage)",
      ],
      solid: [
        "Your {weapon} bites into the {enemy}'s head, splitting scalp to bone. ({damage} damage)",
        "A vicious cut opens the {enemy}'s forehead. Blood sheets into its eyes. ({damage} damage)",
        "Your {weapon} carves a deep line across the {enemy}'s skull. ({damage} damage)",
      ],
      devastating: [
        "Your {weapon} cleaves into the {enemy}'s skull with terrible force. ({damage} damage)",
        "The {enemy}'s head opens under your {weapon}. The blow is catastrophic. ({damage} damage)",
        "A skull-splitting blow. Your {weapon} buries itself in the {enemy}'s head. ({damage} damage)",
      ],
    },
    pierce: {
      glancing: [
        "Your {weapon} scores a shallow gash across the {enemy}'s scalp. ({damage} damage)",
        "The point grazes the {enemy}'s temple. A thin line of blood. ({damage} damage)",
      ],
      solid: [
        "Your {weapon} punches through the {enemy}'s cheek. ({damage} damage)",
        "A clean thrust into the {enemy}'s face. The point finds bone. ({damage} damage)",
      ],
      devastating: [
        "Your {weapon} drives into the {enemy}'s eye socket. ({damage} damage)",
        "The point sinks deep into the {enemy}'s skull. ({damage} damage)",
      ],
    },
    blunt: {
      glancing: [
        "Your {weapon} clips the {enemy}'s jaw. The head snaps sideways. ({damage} damage)",
        "A glancing blow to the {enemy}'s temple. Enough to rattle, not enough to drop. ({damage} damage)",
      ],
      solid: [
        "Your {weapon} crunches into the {enemy}'s skull. Something gives. ({damage} damage)",
        "A solid blow to the head. The {enemy} staggers, eyes unfocused. ({damage} damage)",
      ],
      devastating: [
        "Your {weapon} caves in the side of the {enemy}'s skull. ({damage} damage)",
        "The {enemy}'s head deforms under the impact. The sound is wet and final. ({damage} damage)",
      ],
    },
    ranged: {
      glancing: ["Your shot nicks the {enemy}'s head. ({damage} damage)"],
      solid: ["Your shot punches into the {enemy}'s face. ({damage} damage)"],
      devastating: ["Your shot takes the {enemy} clean through the skull. ({damage} damage)"],
    },
  },
  neck: {
    slash: {
      glancing: [
        "Your {weapon} grazes the {enemy}'s throat. A thin red line appears. ({damage} damage)",
        "A shallow cut across the {enemy}'s neck. Close to something vital. ({damage} damage)",
      ],
      solid: [
        "Your {weapon} bites deep into the {enemy}'s neck. Blood sprays. ({damage} damage)",
        "A vicious slash opens the {enemy}'s throat halfway. ({damage} damage)",
        "Your {weapon} catches the {enemy} across the side of the neck. The wound is ugly. ({damage} damage)",
      ],
      devastating: [
        "Your {weapon} hews through the {enemy}'s neck with butcher-shop finality. ({damage} damage)",
        "The {enemy}'s throat opens from ear to ear under your {weapon}. ({damage} damage)",
        "A killing stroke. The {weapon} finds the neck and doesn't stop. ({damage} damage)",
      ],
    },
    pierce: {
      glancing: [
        "Your {weapon} pricks the {enemy}'s throat. A warning shot. ({damage} damage)",
      ],
      solid: [
        "Your {weapon} punches into the {enemy}'s neck. Blood wells fast. ({damage} damage)",
      ],
      devastating: [
        "Your {weapon} drives clean through the {enemy}'s throat. ({damage} damage)",
      ],
    },
    blunt: {
      glancing: [
        "Your {weapon} clips the {enemy}'s throat. It chokes and stumbles. ({damage} damage)",
      ],
      solid: [
        "Your {weapon} crushes into the {enemy}'s neck. The windpipe compresses. ({damage} damage)",
      ],
      devastating: [
        "Your {weapon} shatters the {enemy}'s throat. The sound is like snapping branches. ({damage} damage)",
      ],
    },
    ranged: {
      glancing: ["Your shot grazes the {enemy}'s neck. ({damage} damage)"],
      solid: ["Your shot buries itself in the {enemy}'s throat. ({damage} damage)"],
      devastating: ["Your shot tears through the {enemy}'s neck. ({damage} damage)"],
    },
  },
  torso: {
    slash: {
      glancing: [
        "Your {weapon} opens a shallow cut across the {enemy}'s ribs. ({damage} damage)",
        "A grazing slash across the {enemy}'s chest. More shirt than skin. ({damage} damage)",
        "Your {weapon} scores the {enemy}'s flank. A surface wound. ({damage} damage)",
      ],
      solid: [
        "Your {weapon} bites into the {enemy}'s chest. Ribs crack under the edge. ({damage} damage)",
        "A deep slash opens the {enemy}'s belly. The wound is serious. ({damage} damage)",
        "Your {weapon} carves a long gash across the {enemy}'s torso. ({damage} damage)",
      ],
      devastating: [
        "Your {weapon} cleaves into the {enemy}'s chest with killing force. ({damage} damage)",
        "The {enemy}'s ribcage opens under your {weapon}. The blow is mortal. ({damage} damage)",
        "Your {weapon} nearly cuts the {enemy} in half at the waist. ({damage} damage)",
      ],
    },
    pierce: {
      glancing: [
        "Your {weapon} pokes through the {enemy}'s side. Shallow but bleeding. ({damage} damage)",
        "The point scores the {enemy}'s ribs. A surface wound. ({damage} damage)",
      ],
      solid: [
        "Your {weapon} punches through the {enemy}'s chest. ({damage} damage)",
        "A clean thrust into the {enemy}'s belly. The point finds something soft. ({damage} damage)",
      ],
      devastating: [
        "Your {weapon} drives hilt-deep into the {enemy}'s chest. ({damage} damage)",
        "The point finds the {enemy}'s heart. Or close enough. ({damage} damage)",
      ],
    },
    blunt: {
      glancing: [
        "Your {weapon} thumps the {enemy}'s ribs. It grunts but holds. ({damage} damage)",
        "A body blow that lands without full force. The {enemy} winces. ({damage} damage)",
      ],
      solid: [
        "Your {weapon} crunches into the {enemy}'s ribs. Something breaks. ({damage} damage)",
        "A solid blow to the chest. The {enemy} doubles over, wheezing. ({damage} damage)",
      ],
      devastating: [
        "Your {weapon} caves in the {enemy}'s chest. The ribcage folds. ({damage} damage)",
        "The {enemy}'s torso crumples under the impact. Internal damage, without question. ({damage} damage)",
      ],
    },
    ranged: {
      glancing: ["Your shot grazes the {enemy}'s side. ({damage} damage)"],
      solid: ["Your shot punches into the {enemy}'s chest. ({damage} damage)"],
      devastating: ["Your shot tears clean through the {enemy}'s torso. ({damage} damage)"],
    },
  },
  limbs: {
    slash: {
      glancing: [
        "Your {weapon} nicks the {enemy}'s arm. A scratch. ({damage} damage)",
        "A shallow cut along the {enemy}'s forearm. Blood but no depth. ({damage} damage)",
        "Your {weapon} grazes the {enemy}'s leg. It stumbles but recovers. ({damage} damage)",
      ],
      solid: [
        "Your {weapon} bites deep into the {enemy}'s arm. The limb goes slack. ({damage} damage)",
        "A solid cut opens the {enemy}'s thigh. Blood runs freely. ({damage} damage)",
        "Your {weapon} chops into the {enemy}'s leg. It buckles. ({damage} damage)",
      ],
      devastating: [
        "Your {weapon} hews through the {enemy}'s arm. Bone shows white. ({damage} damage)",
        "The {enemy}'s leg folds under a devastating slash. ({damage} damage)",
        "Your {weapon} nearly severs the {enemy}'s limb. ({damage} damage)",
      ],
    },
    pierce: {
      glancing: [
        "Your {weapon} pricks the {enemy}'s hand. It flinches. ({damage} damage)",
      ],
      solid: [
        "Your {weapon} punches through the {enemy}'s forearm. ({damage} damage)",
      ],
      devastating: [
        "Your {weapon} pins the {enemy}'s arm to its own body. ({damage} damage)",
      ],
    },
    blunt: {
      glancing: [
        "Your {weapon} clips the {enemy}'s elbow. It shakes the arm out. ({damage} damage)",
      ],
      solid: [
        "Your {weapon} cracks into the {enemy}'s shin. Something snaps. ({damage} damage)",
      ],
      devastating: [
        "Your {weapon} shatters the {enemy}'s knee. The leg bends the wrong way. ({damage} damage)",
      ],
    },
    ranged: {
      glancing: ["Your shot grazes the {enemy}'s arm. ({damage} damage)"],
      solid: ["Your shot punches through the {enemy}'s leg. ({damage} damage)"],
      devastating: ["Your shot shatters the {enemy}'s limb. ({damage} damage)"],
    },
  },
};

// ── HIT NARRATION — ENEMY STRIKES PLAYER (zone × tier) ─────

type ZoneEnemyHitPool = Record<BodyZone, Record<WoundTier, string[]>>;

const ENEMY_ZONE_HIT: ZoneEnemyHitPool = {
  head: {
    glancing: [
      "The {enemy} clips your skull. Stars bloom behind your eyes. ({damage} damage)",
      "A glancing blow to the head from the {enemy}. Your ears ring. ({damage} damage)",
    ],
    solid: [
      "The {enemy} cracks you across the skull. Blood streams down your face. ({damage} damage)",
      "A solid blow to your head. Your vision blurs. ({damage} damage)",
    ],
    devastating: [
      "The {enemy} drives a devastating blow into your skull. The world goes white. ({damage} damage)",
      "Your head snaps sideways under the {enemy}'s strike. ({damage} damage)",
    ],
  },
  neck: {
    glancing: [
      "The {enemy} catches your throat — a graze, but close. ({damage} damage)",
      "A nick across your neck from the {enemy}. Warm blood trickles down your collar. ({damage} damage)",
    ],
    solid: [
      "The {enemy} strikes your neck. The pain is blinding. ({damage} damage)",
      "A vicious blow to your throat. You choke, gasping. ({damage} damage)",
    ],
    devastating: [
      "The {enemy} hacks into your neck. Blood sprays. ({damage} damage)",
      "A savage blow to your throat from the {enemy}. You can feel your pulse in the wound. ({damage} damage)",
    ],
  },
  torso: {
    glancing: [
      "The {enemy} grazes your ribs. A shallow cut. ({damage} damage)",
      "A glancing blow to your chest. You barely feel it through the adrenaline. ({damage} damage)",
    ],
    solid: [
      "The {enemy} drives into your chest. Ribs protest. ({damage} damage)",
      "A solid body blow from the {enemy}. The breath goes out of you. ({damage} damage)",
    ],
    devastating: [
      "The {enemy} buries its weapon in your chest. The pain is absolute. ({damage} damage)",
      "A devastating blow to your torso. Something inside shifts. ({damage} damage)",
    ],
  },
  limbs: {
    glancing: [
      "The {enemy} nicks your arm. A surface wound. ({damage} damage)",
      "A glancing strike across your leg from the {enemy}. ({damage} damage)",
    ],
    solid: [
      "The {enemy} chops into your arm. The limb goes numb. ({damage} damage)",
      "A solid hit to your leg. You stagger. ({damage} damage)",
    ],
    devastating: [
      "The {enemy} smashes into your arm. Bone grinds. ({damage} damage)",
      "Your leg buckles under the {enemy}'s devastating blow. ({damage} damage)",
    ],
  },
};

// ── INJURY NARRATION ────────────────────────────────────────

const INJURY_NARRATION: Record<StatusEffectType, string[]> = {
  bleed: [
    "Blood flows freely from the {zone} wound.",
    "The {zone} wound opens — bright blood starts to seep.",
  ],
  poison: [
    "The {zone} wound darkens. Black veins spider out from the cut.",
    "A chill spreads from the {zone}. The blood there runs sluggish and wrong.",
  ],
  concussion: [
    "The blow rattles {defender}'s brain. Eyes glaze. Concussion.",
    "{defender}'s head rocks. The lights are on but nobody's home.",
  ],
  damaged_eye: [
    "Blood fills {defender}'s eye. Vision halves in an instant.",
    "The strike catches {defender}'s eye. A ruined mess.",
  ],
  severed_artery: [
    "An artery opens. Blood jets in rhythmic pulses from {defender}'s {zone}.",
    "Bright arterial blood sprays from {defender}'s {zone}. This is bad.",
  ],
  crushed_windpipe: [
    "{defender}'s throat collapses. Breathing becomes a wet, failing enterprise.",
    "The windpipe buckles. {defender} gasps for air that won't come.",
  ],
  pierced_lung: [
    "The blow punctures a lung. {defender} coughs pink froth.",
    "Air whistles through the torso wound. {defender}'s breathing turns shallow and bubbly.",
  ],
  cracked_ribs: [
    "Ribs crack. {defender} flinches at every breath.",
    "Something snaps in {defender}'s chest. Every movement is a fresh knife of pain.",
  ],
  broken_arm: [
    "{defender}'s arm breaks with an audible snap. The weapon hand falters.",
    "The arm gives way. {defender} can barely grip the weapon now.",
  ],
  broken_leg: [
    "{defender}'s leg buckles and bends wrong. No running from this.",
    "A sickening crack. {defender}'s leg folds beneath the weight.",
  ],
};

// ── CRITICAL HIT PREFIXES ───────────────────────────────────

const CRITICAL_PREFIXES: Record<BodyZone, string[]> = {
  head: ["A perfect strike to the skull!", "CRITICAL — the head blow lands with terrible precision!"],
  neck: ["The throat is wide open!", "CRITICAL — the neck strike finds its mark exactly!"],
  torso: ["Dead center!", "CRITICAL — the body blow lands with full force!"],
  limbs: ["The limb is fully exposed!", "CRITICAL — a clean, devastating hit to the limb!"],
};

// ── CRITICAL FAIL NARRATION ─────────────────────────────────

/** Fumble without weapon drop — just a clumsy miss. */
const CRITICAL_FAIL_STUMBLE: string[] = [
  "{attacker} overcommits — the swing goes wide and leaves them staggering.",
  "{attacker}'s footing fails. A wild, clumsy swing at nothing.",
  "A terrible swing. {attacker} nearly trips over their own feet.",
  "{attacker} misjudges the distance badly — the strike whistles past {defender}'s ear and throws {attacker} off-balance.",
];

/** Fumble WITH weapon drop. */
const CRITICAL_FAIL_DROP: string[] = [
  "FUMBLE! {attacker}'s {weapon} slips from sweaty hands and clatters to the ground!",
  "FUMBLE! The grip fails — {attacker}'s {weapon} spins away across the floor!",
  "FUMBLE! {attacker}'s fingers lose the {weapon}. It hits the ground with a ring of iron. {attacker} is unarmed!",
  "FUMBLE! A miserable swing — {attacker}'s {weapon} flies from their hand and skids across the stone!",
];

// ── NARRATIVE BUILDER ───────────────────────────────────────
// Replaces the simple string in resolveStrike() with rich zone narration.

export function buildZoneStrikeNarrative(
  strike: StrikeResolution,
  attackerName: string,
  defenderName: string,
  weaponName: string,
  weaponCategory: WeaponCategory,
  defenderMaxHp: number,
  isPlayerAttacking: boolean
): string {
  const zone = strike.targetZone;
  const vars: Record<string, string> = {
    attacker: attackerName,
    defender: defenderName,
    weapon: weaponName,
    enemy: isPlayerAttacking ? defenderName : attackerName,
    damage: String(strike.damageDealt),
    zone,
  };

  // Evasion (possibly with critical fail)
  if (strike.evaded) {
    if (strike.isCriticalFail) {
      const pool = strike.weaponDropped ? CRITICAL_FAIL_DROP : CRITICAL_FAIL_STUMBLE;
      return fill(pick(EVASION_POOLS[zone]), vars) + " " + fill(pick(pool), vars);
    }
    return fill(pick(EVASION_POOLS[zone]), vars);
  }

  // Shield block
  if (strike.blocked) {
    const pool = strike.armorBroken ? SHIELD_BROKEN_POOLS[zone] : SHIELD_BLOCK_POOLS[zone];
    return fill(pick(pool), vars);
  }

  // Armor stop
  if (strike.armorStopped) {
    const pool = strike.armorBroken ? ARMOR_BROKEN_POOLS[zone] : ARMOR_STOP_POOLS[zone];
    return fill(pick(pool), vars);
  }

  // Hit lands — build full narrative
  const parts: string[] = [];

  // Critical prefix
  if (strike.isCritical) {
    parts.push(pick(CRITICAL_PREFIXES[zone]));
  }

  // Hit narration
  const tier = getZoneWoundTier(strike.damageDealt, defenderMaxHp);
  if (isPlayerAttacking) {
    const hitLine = pick(PLAYER_ZONE_HIT[zone][weaponCategory][tier]);
    parts.push(fill(hitLine, vars));
  } else {
    const hitLine = pick(ENEMY_ZONE_HIT[zone][tier]);
    parts.push(fill(hitLine, vars));
  }

  // Armor durability damage (penetrating hit)
  if (strike.armorDamaged > 0 && strike.armorBroken) {
    parts.push(fill(pick(ARMOR_BROKEN_POOLS[zone]), vars));
  }

  // Injury inflicted
  if (strike.injuryInflicted) {
    const injuryPool = INJURY_NARRATION[strike.injuryInflicted];
    if (injuryPool) {
      parts.push(fill(pick(injuryPool), vars));
    }
  }

  return parts.join(" ");
}
