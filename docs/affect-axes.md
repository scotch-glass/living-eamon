# Affect axes — neuro-emotional reading

The atom-encounter design system already carries an [`AffectVector`](../lib/karma/atom-types.ts#L69) tagged on every encounter's pacing baseline + every choice's delta. The seven axes were authored as narrative-tuning fields (fear / excitement / eros / dread / awe / wonder / melancholy). This document captures the canonical **neuro-emotional reading** of those axes so future balance simulators and any algorithmic adventure generator can score adventures against neuro-chemical curves without renaming any fields or touching any atom JSON.

**Decision (2026-04-30):** Map AffectVector → neuro-emotional. One axis-set, two readings. Zero code churn.

## Mapping

| AffectVector field | Neuro-emotional reading | Notes |
|--------------------|-------------------------|-------|
| `excitement`       | dopamine                | Anticipation, novelty, risk-reward, agency-positive arousal |
| `awe`              | serotonin               | Reverence, lift, sublime |
| `wonder`           | serotonin               | Curiosity-positive — expanding the world |
| `eros`             | eros                    | Romantic / sexual charge |
| `fear`             | cortisol (acute)        | Sharp danger spike — fight-or-flight |
| `dread`            | cortisol (chronic)      | Slow-burn unease — cosmic, occult, decay |
| `melancholy`       | serotonin (low)         | Wistful sadness, ruin, regret |
| `fun` (composite)  | dopamine + serotonin balance | Implicit — derived from the curve, not a tagged field |

## How to read this

- **High dopamine, low serotonin** = restless, addictive, "more more more" loops. Combat-grind territory. Avoid as a sustained baseline.
- **High serotonin, low dopamine** = peaceful, contented, low-stakes. Safe haven beats. Important after combat / atom resolution; bad as a whole-act baseline.
- **High cortisol, low dopamine + serotonin** = grinding stress without payoff. The "monotone-stress" failure mode. Adventures must not stay here for more than ~3 consecutive encounters without a serotonin payoff.
- **High eros, blended with awe / wonder** = sacred-erotic charge. Fertility-temple territory; rare, deliberate.
- **Healthy curve** = sawtooth. Cortisol spikes (combat / dread reveals) followed by dopamine (victory / discovery) and serotonin (rest / consolidation).

## Use cases

1. **Adventure pacing audit.** A future `scripts/balance/neuro-curve.ts` (out of scope for this plan) reads the planned encounter sequence in an adventure module and validates that the cumulative curve sawtooths through all three primary axes (dopamine + serotonin + cortisol) rather than living in any single axis for too long.
2. **Choice scoring.** Each atom choice carries an `affect` delta. Reading it through the neuro-emotional lens lets the simulator answer "does this choice spike cortisol with no payoff later?" or "does this choice deliver a serotonin hit the adventure was missing?"
3. **Algorithmic generator constraints.** When a generator (deferred, post-Sprint-8) composes a candidate adventure, its constraint engine can express targets like "average dopamine delta per scene > 0.3" or "no more than 3 consecutive scenes with cortisol > 0.5 and dopamine < 0.2" — all read off the same `AffectVector` data already authored on every atom.

## What this document is NOT

- It is **not** a renaming of `AffectVector` fields. The TS type stays exactly as-authored. The neuro-emotional layer is a reading lens, not a schema change.
- It is **not** a runtime mechanic. Players never see "dopamine +0.3"; this is a designer + simulator vocabulary only.
- It is **not** an exhaustive neuroscience. The mapping is approximate, designer-friendly, and tuned for game-pacing decisions — not for a clinical model.

## See also

- [`lib/karma/atom-types.ts`](../lib/karma/atom-types.ts) — `AffectAxis` + `AffectVector` type definitions
- [`scripts/balance/simulator.ts`](../scripts/balance/simulator.ts) — existing coverage audit (`encounterAffectReach`); the foundation a future neuro-curve validator builds on
- [`~/.claude/plans/good-questions-ultimately-the-radiant-cat.md`](file:///Users/joshuamcclure/.claude/plans/good-questions-ultimately-the-radiant-cat.md) — pre-DB foundation plan that introduced this mapping
