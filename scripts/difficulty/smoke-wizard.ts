// Quick smoke check: pick a coherent set of wizard answers, generate
// a skeleton, dump key numbers.
//
// Run: npx tsx scripts/difficulty/smoke-wizard.ts

import { generateSkeleton } from "../../lib/creator/generateSkeleton";
import type { WizardAnswer } from "../../lib/creator/skeletonTypes";

const NOVICE_HEIST: WizardAnswer[] = [
  { questionId: "pd-anchor", optionId: "the-cat-and-the-skull" },
  { questionId: "biome", optionId: "civilization" },
  { questionId: "civilization-status", optionId: "bustling" },
  { questionId: "location-anchor", optionId: "valus" },
  { questionId: "conflict-pattern", optionId: "heist" },
  { questionId: "moral-palette", optionId: "morally-gray" },
  { questionId: "illumination-tilt", optionId: "neutral" },
  { questionId: "faction-count", optionId: "two-clashing" },
  { questionId: "enemy-composition", optionId: "grunts" },
  { questionId: "combat-density", optionId: "occasional" },
  { questionId: "henchman-availability", optionId: "one-hireable" },
  { questionId: "gear-gates", optionId: "one-common" },
  { questionId: "atom-severity", optionId: "standard" },
  { questionId: "scroll-seeding", optionId: "none" },
  { questionId: "length", optionId: "short" },
  { questionId: "quest-branching", optionId: "one-branch" },
  { questionId: "pace", optionId: "steady" },
  { questionId: "reward-shape", optionId: "loot-heavy" },
];

const DEADLY_MYSTERY: WizardAnswer[] = [
  { questionId: "pd-anchor", optionId: "mirrors-of-tuzun-thune" },
  { questionId: "biome", optionId: "jungle-or-lost" },
  { questionId: "civilization-status", optionId: "abandoned" },
  { questionId: "location-anchor", optionId: "geo-lost-lands" },
  { questionId: "conflict-pattern", optionId: "mystery" },
  { questionId: "moral-palette", optionId: "damned-by-design" },
  { questionId: "illumination-tilt", optionId: "toward-dark" },
  { questionId: "faction-count", optionId: "many" },
  { questionId: "enemy-composition", optionId: "elite-or-boss" },
  { questionId: "combat-density", optionId: "climactic-only" },
  { questionId: "henchman-availability", optionId: "none" },
  { questionId: "gear-gates", optionId: "multiple" },
  { questionId: "atom-severity", optionId: "defining" },
  { questionId: "scroll-seeding", optionId: "both" },
  { questionId: "length", optionId: "long" },
  { questionId: "quest-branching", optionId: "multi-branch" },
  { questionId: "pace", optionId: "sawtooth" },
  { questionId: "reward-shape", optionId: "lore-heavy" },
];

function dump(name: string, answers: WizardAnswer[]) {
  console.log(`\n=== ${name} ===`);
  const start = Date.now();
  const sk = generateSkeleton({
    moduleId: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    answers,
    runSimulation: true,
    simSeed: 0xc0ffee,
  });
  const ms = Date.now() - start;
  console.log(`Generated in ${ms} ms`);
  console.log(`PD anchor:           ${sk.pdAnchor}`);
  console.log(`Location:            ${sk.locationId}`);
  console.log(`Zones:               ${sk.travelZones.join(", ") || "(none)"}`);
  console.log(`Rooms:               ${sk.rooms.length}`);
  console.log(`Quest steps/branches: ${sk.questOutline.steps} / ${sk.questOutline.branches}`);
  console.log(`Intentionally skewed: ${sk.intentionallySkewed.join(", ")}`);
  console.log(`PICSSI targets:`, sk.picssiTargets);
  console.log(`Loads:`, sk.loads);
  console.log(`P(complete):  fresh=${pct(sk.pCompletePerArchetype.fresh)}  mid=${pct(sk.pCompletePerArchetype.mid)}  endgame=${pct(sk.pCompletePerArchetype.endgame)}`);
  console.log(`Courage baseline:`, sk.courageBaseline);
  console.log(`Rooms breakdown:`);
  for (const r of sk.rooms) {
    const atomTxt = r.atoms.length === 0 ? "no atoms" : `${r.atoms.length}× ${r.atoms[0].severity}/${r.atoms[0].virtue}`;
    const gateTxt = r.gearGate ? ` · gate=${r.gearGate.itemTag}(${r.gearGate.difficulty})` : "";
    const restTxt = r.restAvailable ? " · REST" : "";
    console.log(`  ${r.id}: ${r.encounterPattern.padEnd(20)} · ${atomTxt}${gateTxt}${restTxt}`);
  }
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

dump("Novice Heist", NOVICE_HEIST);
dump("Deadly Mystery", DEADLY_MYSTERY);
