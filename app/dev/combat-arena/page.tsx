// /dev/combat-arena — v2 combat-UI test page.
//
// Hosts the new <CombatArena> component with the canonical 3v3 party
// (hero + Vivian + Brand vs Korm + Rurik + Sela) in front of the
// ancient-ruin background.
//
// THIS PAGE DOES NOT REPLACE /dev/combat-test. Both routes coexist.
// The original /dev/combat-test is preserved as the v1 reference.
//
// Local React state only. Reset button rebuilds the session from
// scratch so we can iterate on combat features repeatedly.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import CombatArena from "../../../components/CombatArena";
import {
  initMultiCombatSession,
  resolveAction,
  runAiTurns,
  type CombatAction,
} from "../../../lib/combat/engine";
import type { ActiveCombatSession, BodyZone } from "../../../lib/combat/types";
import { BODY_ZONES } from "../../../lib/combat/types";
import { createInitialWorldState, type WorldState } from "../../../lib/gameState";
import {
  CANONICAL_PARTY_SPEC,
  ANCIENT_RUIN_BACKGROUND,
} from "../../../lib/combat/sprites";

function buildHeroState(): WorldState {
  const base = createInitialWorldState("Gaius");
  return {
    ...base,
    player: {
      ...base.player,
      hp: 50,
      maxHp: 50,
      currentMana: 40,
      maxMana: 40,
      knownSpells: [
        "HEAL", "BLAST", "POWER", "SPEED",
        "GREATER-HEAL", "FIREBOLT", "HASTE", "WARD", "STEELSKIN",
        "SILENCE", "RESIST", "DAYLIGHT", "CLEANSE",
      ],
      // Stage 5 caps the active hotbar at 4. Until then the engine
      // limit (6) is fine; the UI just exposes a subset.
      combatHotbar: ["HEAL", "BLAST", "FIREBOLT", "WARD"],
      weapon: "great_sword",
      inventory: [
        ...(base.player.inventory ?? []),
        { itemId: "great_sword",            quantity: 1 },
        { itemId: "healing_potion",         quantity: 3 },
        { itemId: "greater_healing_potion", quantity: 1 },
        { itemId: "mana_potion",            quantity: 2 },
        { itemId: "stamina_brew",           quantity: 1 },
        { itemId: "fatigue_brew",           quantity: 1 },
        { itemId: "antidote",               quantity: 1 },
        { itemId: "strong_antidote",        quantity: 1 },
        { itemId: "bandage",                quantity: 4 },
        { itemId: "tourniquet",             quantity: 1 },
      ],
    },
  };
}

function buildFreshSession(state: WorldState): ActiveCombatSession {
  const session = initMultiCombatSession(state, CANONICAL_PARTY_SPEC, {
    backgroundUrl: ANCIENT_RUIN_BACKGROUND,
  });
  if (!session) {
    throw new Error("initMultiCombatSession returned null — check NPC registry");
  }
  return session;
}

// Parse the ACT/<verb>/<args> grammar into a CombatAction for resolveAction.
function parseAct(cmd: string): CombatAction | "ai_turn" | null {
  const tokens = cmd.trim().split(/\s+/);
  const first = tokens[0]?.toUpperCase();
  if (first === "AI_TURN") return "ai_turn";
  if (first !== "ACT") return null;
  const sourceId = (tokens[1] ?? "").toLowerCase();
  const verb = (tokens[2] ?? "").toUpperCase();
  switch (verb) {
    case "STRIKE": {
      const zone = (tokens[3] ?? "").toLowerCase() as BodyZone;
      const targetId = (tokens[4] ?? "").toLowerCase();
      if (!BODY_ZONES.includes(zone) || !targetId) return null;
      return { kind: "strike", sourceId, targetId, zone };
    }
    case "CAST": {
      const spellName = (tokens[3] ?? "").toUpperCase();
      const targetId = (tokens[4] ?? "").toLowerCase();
      if (!spellName || !targetId) return null;
      return { kind: "cast", sourceId, targetId, spellName };
    }
    case "USE":
    case "DRINK": {
      const itemId = (tokens[3] ?? "").toLowerCase();
      const targetId = (tokens[4] ?? sourceId).toLowerCase();
      if (!itemId) return null;
      return { kind: "use", sourceId, targetId, itemId };
    }
    case "SWAP_HOTBAR":
    case "SWAP": {
      const slotIdx = parseInt(tokens[3] ?? "", 10);
      const spellArg = tokens[4];
      if (Number.isNaN(slotIdx)) return null;
      return {
        kind: "swap_hotbar",
        sourceId,
        slotIdx,
        spellName: spellArg ? spellArg.toUpperCase() : null,
      };
    }
    case "FLEE":
      return { kind: "flee", sourceId };
    default:
      return null;
  }
}

export default function CombatArenaPage(): React.JSX.Element {
  const heroState = useMemo(() => buildHeroState(), []);
  // Session is null on SSR + initial render so the server-rendered HTML
  // doesn't depend on `initMultiCombatSession`, which uses Math.random()
  // for initiative tiebreaks. Without this, server and client compute
  // different turn orders and React reports a hydration mismatch.
  const [session, setSession] = useState<ActiveCombatSession | null>(null);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSession(buildFreshSession(heroState));
  }, [heroState]);

  const reset = useCallback(() => {
    setSession(buildFreshSession(heroState));
    setCombatLog([]);
    setLoading(false);
  }, [heroState]);

  const handleCommand = useCallback(
    (cmd: string) => {
      if (!session) return; // session not initialized yet (pre-mount SSR)
      const parsed = parseAct(cmd);
      if (parsed === null) {
        setCombatLog((log) => [...log, `[unknown command: ${cmd}]`]);
        return;
      }
      setLoading(true);
      let next: ActiveCombatSession = session;
      const newLines: string[] = [];

      if (parsed === "ai_turn") {
        const ai = runAiTurns(next);
        next = ai.session;
        if (ai.narrative) newLines.push(...ai.narrative.split("\n").filter(Boolean));
      } else {
        const result = resolveAction(next, parsed);
        if (result.invalid) {
          newLines.push(`[refused: ${result.invalid}]`);
        } else {
          next = result.session;
          if (result.narrative) newLines.push(...result.narrative.split("\n").filter(Boolean));
          if (!next.finished) {
            const ai = runAiTurns(next);
            next = ai.session;
            if (ai.narrative) newLines.push(...ai.narrative.split("\n").filter(Boolean));
          }
        }
      }
      setSession(next);
      setCombatLog((log) => [...log, ...newLines].slice(-50));
      setLoading(false);
    },
    [session],
  );

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#0a0805" }}>
      <div
        style={{
          position: "fixed",
          top: 8,
          left: 8,
          zIndex: 100,
          display: "flex",
          gap: 8,
          alignItems: "center",
          background: "rgba(20,12,6,0.85)",
          border: "1px solid #92400e",
          borderRadius: 6,
          padding: "6px 10px",
          fontFamily: "Georgia, serif",
          color: "#e8d4a0",
          fontSize: 13,
        }}
      >
        <span style={{ fontWeight: 700 }}>Combat Arena v2</span>
        <button
          onClick={reset}
          style={{
            background: "#7c2d12",
            color: "#fde68a",
            border: "1px solid #b45309",
            borderRadius: 4,
            padding: "4px 10px",
            cursor: "pointer",
            fontFamily: "Georgia, serif",
            fontWeight: 700,
          }}
        >
          ↻ Reset
        </button>
        <span style={{ opacity: 0.7 }}>
          {session ? (
            <>
              Round {session.roundNumber} · {session.combatants.filter((c) => c.hp > 0).length} alive
              {session.finished && (session.playerWon ? " · Victory" : " · Defeat")}
            </>
          ) : (
            "loading…"
          )}
        </span>
      </div>

      {session && (
        <CombatArena
          session={session}
          combatLog={combatLog}
          loading={loading}
          onCommand={handleCommand}
        />
      )}
    </div>
  );
}
