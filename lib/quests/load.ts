// ============================================================
// LIVING EAMON — Quest registry loader (KARMA Sprint 8d)
//
// Side-effect-only imports. Each line module calls
// `registerQuest(...)` at top-level, mutating the engine's
// REGISTRY map. To avoid a TDZ on the registry's `const`
// declaration, this file is imported by **consumers**
// (lib/gameEngine.ts) — never by `lib/quests/engine.ts` itself.
// That preserves the dependency direction:
//   lines → engine        (lines need registerQuest)
//   gameEngine → load     (gameEngine triggers registration)
//   gameEngine → engine   (gameEngine emits events)
//   load → lines          (load triggers each line module)
// No cycle through engine.
// ============================================================

import "./lines/vivian-arc";
import "./lines/way-of-thoth";
