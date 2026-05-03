# Sprint 0 Audit Results — 2026-04-29

## Baseline tests
- `npx tsc --noEmit` — **PASSED** (exit 0, no errors).
- Pre-Sprint-1 codebase is type-safe.

## Mutation-point audit (legacy 10-virtue ledger)

**Finding:** 5 mutation call sites + 2 helper definitions + 1 import.
**HYDRATE_NEXT_SESSION.md said 4 sites — actual count is 5.** The 5th is in `combatEngine.ts:994` (POWER spell "An Unwanted Vision" outcome). Sprint 2 cold-delete must handle all of these.

### Call sites (5)
| # | File:line | Mutation |
|---|-----------|----------|
| 1 | `lib/gameEngine.ts:4052` | Honor −1 (charity steal) |
| 2 | `lib/gameEngine.ts:4215` | Honor −1 per garment taken |
| 3 | `lib/gameEngine.ts:4716` | Valor +1 (combat victory) |
| 4 | `lib/gameState.ts:1070` | Honor −1 (gray robe decay, every 10 turns) |
| 5 | `lib/combatEngine.ts:994` | Honor −1 (POWER spell "An Unwanted Vision" outcome) |

### Helper / import (3)
| File:line | What |
|-----------|------|
| `lib/gameState.ts:731` | `export function updateVirtue` — canonical helper |
| `lib/combatEngine.ts:1099` | `function updateVirtueLite` — local copy to avoid import cycle |
| `lib/gameEngine.ts:42` | `import { updateVirtue, ... }` |

### Sprint 2 cold-delete checklist (consequence of audit)

- [ ] Remove call sites 1, 2, 3, 4, 5 (replace with `// TODO(Sprint 5/3): wire to PICSSI applyKarma()`).
- [ ] Remove `updateVirtue` definition (`lib/gameState.ts:731`).
- [ ] Remove `updateVirtueLite` definition (`lib/combatEngine.ts:1099`).
- [ ] Remove `updateVirtue` import in `lib/gameEngine.ts:42`.
- [ ] Drop 10 legacy columns from `players` in same migration.
- [ ] Verify with `grep -rn "updateVirtue\|updateVirtueLite\|honesty\|valor\|honor.*[+\-]=" lib app` returns 0 hits.

## body-zone install verification
- `/Applications/Heads Will Roll Reforged/game/script_2.rpy` — **present**.
- Sprint 1's body-zone-derived stamina cost values can be re-extracted via grep when needed.

## Sprint 0 — DEFINITION OF DONE met
- ✅ DB snapshot manifest written (`pre_karma_2026-04-29.md`).
- ✅ Typecheck passes.
- ✅ Mutation-point audit complete (with 1 finding to feed into Sprint 2).
- ✅ body-zone install verified.

**Sprint 1 is unblocked.** Awaiting Scotch's "begin Sprint 1" approval per KARMA_SYSTEM.md §6.
