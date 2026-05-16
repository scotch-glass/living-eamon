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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CombatArena from "../../../components/CombatArena";
import {
  advanceTurn,
  currentActorId,
  initMultiCombatSession,
  resolveAction,
  resolveChannelStep,
  type CombatAction,
} from "../../../lib/combat/engine";
import type { ActiveCombatSession, BodyZone } from "../../../lib/combat/types";
import { BODY_ZONES } from "../../../lib/combat/types";
import { createInitialWorldState, type WorldState } from "../../../lib/gameState";
import {
  CANONICAL_PARTY_SPEC,
  ANCIENT_RUIN_BACKGROUND,
} from "../../../lib/combat/sprites";
import { DEFAULT_BANDIT_POLICY, pickAction } from "../../../lib/npcAi";
import { NPCS } from "../../../lib/gameData";

// Cadence between AI actions. Per Scotch 2026-05-08: roughly the speed
// a human player would take, so the player can read each line of
// narrative before the next one fires.
const AI_TURN_DELAY_MS = 5000;

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
        "HEAL", "BLAST", "SPEED",
        "GREATER-HEAL", "FIREBOLT", "HASTE", "WARD", "STEELSKIN",
        "SILENCE", "RESIST", "CLEANSE",
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
  // Most recently resolved offensive-projectile cast — drives the
  // streak FX in <CombatArena>. Each spell has its own state slot so
  // the animations don't fight over a shared key. The `key` field is
  // monotonic per slot so consecutive casts (even same source/target)
  // re-fire the animation.
  const [lastBlast, setLastBlast] = useState<{
    sourceId: string;
    targetId: string;
    key: number;
  } | null>(null);
  const [lastFirebolt, setLastFirebolt] = useState<{
    sourceId: string;
    targetId: string;
    key: number;
  } | null>(null);
  // Strike FX. Outcome ∈ hit/crit/evaded/blocked/armorStopped/criticalFail.
  // Drives lunge + target reaction + zone-anchored hit-flash + crit gore +
  // floating damage popup.
  const [lastStrike, setLastStrike] = useState<{
    sourceId: string;
    targetId: string;
    zone: BodyZone;
    outcome: "hit" | "crit" | "evaded" | "blocked" | "armorStopped" | "criticalFail";
    damage: number;
    key: number;
  } | null>(null);
  // One-shot CLEANSE purification flash on the target.
  const [lastCleanse, setLastCleanse] = useState<{
    targetId: string;
    key: number;
  } | null>(null);
  const blastKeyRef = useRef(0);
  const fireboltKeyRef = useRef(0);
  const strikeKeyRef = useRef(0);
  const cleanseKeyRef = useRef(0);

  // Trigger the right streak when the engine reports that a spell's
  // mechanical effect actually fired. Called from both the player
  // handler and the AI driver — passing `result.firedSpell` from the
  // engine instead of the raw action means interrupt-fizzles (Gaius
  // critically hit mid-cast) and multi-turn channel STARTS don't
  // accidentally trigger the streak.
  const flagSpellFx = useCallback(
    (firedSpell: { sourceId: string; targetId: string; spellName: string } | undefined) => {
      if (!firedSpell) return;
      const upper = firedSpell.spellName.toUpperCase();
      if (upper === "BLAST") {
        blastKeyRef.current += 1;
        setLastBlast({
          sourceId: firedSpell.sourceId,
          targetId: firedSpell.targetId,
          key: blastKeyRef.current,
        });
      } else if (upper === "FIREBOLT") {
        fireboltKeyRef.current += 1;
        setLastFirebolt({
          sourceId: firedSpell.sourceId,
          targetId: firedSpell.targetId,
          key: fireboltKeyRef.current,
        });
      } else if (upper === "CLEANSE") {
        cleanseKeyRef.current += 1;
        setLastCleanse({
          targetId: firedSpell.targetId,
          key: cleanseKeyRef.current,
        });
      }
    },
    [],
  );

  // Strike FX flag — populated whenever the engine resolves a strike
  // action, regardless of outcome. CombatArena reads this to drive the
  // source lunge, target reaction (dodge/knockback/recoil), zone-
  // anchored hit-flash, and crit gore. Always set when firedStrike is
  // present (every strike resolution) so misses still trigger the dodge.
  const flagStrikeFx = useCallback(
    (firedStrike: {
      sourceId: string;
      targetId: string;
      zone: BodyZone;
      outcome: "hit" | "crit" | "evaded" | "blocked" | "armorStopped" | "criticalFail";
      damage: number;
    } | undefined) => {
      if (!firedStrike) return;
      strikeKeyRef.current += 1;
      setLastStrike({
        sourceId: firedStrike.sourceId,
        targetId: firedStrike.targetId,
        zone: firedStrike.zone,
        outcome: firedStrike.outcome,
        damage: firedStrike.damage,
        key: strikeKeyRef.current,
      });
    },
    [],
  );

  useEffect(() => {
    setSession(buildFreshSession(heroState));
  }, [heroState]);

  const reset = useCallback(() => {
    setSession(buildFreshSession(heroState));
    setCombatLog([]);
    setLastBlast(null);
    setLastFirebolt(null);
    setLastStrike(null);
    setLastCleanse(null);
  }, [heroState]);

  const handleCommand = useCallback(
    (cmd: string) => {
      if (!session) return; // session not initialized yet (pre-mount SSR)
      const parsed = parseAct(cmd);
      if (parsed === null) {
        setCombatLog((log) => [...log, `[unknown command: ${cmd}]`]);
        return;
      }
      // Player action only — AI turns are driven by the useEffect below
      // at AI_TURN_DELAY_MS pacing. The legacy "ai_turn" command is kept
      // as a no-op so any stale callers don't error.
      if (parsed === "ai_turn") return;

      const result = resolveAction(session, parsed);
      if (result.invalid) {
        setCombatLog((log) => [...log, `[refused: ${result.invalid}]`]);
        return;
      }
      setSession(result.session);
      if (result.narrative) {
        setCombatLog((log) =>
          [...log, ...result.narrative.split("\n").filter(Boolean)].slice(-50),
        );
      }
      // Only fire FX when the engine confirms the spell actually
      // landed (i.e., applyCombatSpellEffect ran). Interrupt-fizzles
      // and multi-turn channel STARTS leave firedSpell undefined.
      flagSpellFx(result.firedSpell);
      flagStrikeFx(result.firedStrike);
    },
    [session, flagSpellFx, flagStrikeFx],
  );

  // ── AI auto-driver ────────────────────────────────────────────
  //
  // Watches `session` and runs ONE AI action per AI_TURN_DELAY_MS
  // whenever the active actor is AI-controlled or mid-channel. Each
  // step updates `session`, which re-fires this effect; if the next
  // actor is also AI, another timer is scheduled. Exits naturally
  // when control returns to a player-controlled non-channeling actor
  // OR combat ends.
  //
  // Fixes the freeze where an AI rolling lowest initiative at session
  // start (e.g. Sela tying Vivian at speed 2) had no trigger to act.
  // Per Scotch 2026-05-08.
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // Always cancel any pending timer when session changes.
    if (aiTimerRef.current !== null) {
      clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }
    if (!session || session.finished) return;

    const actorId = currentActorId(session);
    if (!actorId) return;
    const actor = session.combatants.find((c) => c.id === actorId);
    if (!actor || actor.hp <= 0) return;

    // Player-controlled non-channeling actor → wait for player input.
    if (actor.controlledBy === "player" && actor.channelingState === null) return;

    aiTimerRef.current = setTimeout(() => {
      aiTimerRef.current = null;
      // Re-validate: state may have changed during the delay (Reset).
      const stillActive = currentActorId(session);
      if (stillActive !== actor.id || session.finished) return;

      let r;
      if (actor.channelingState !== null) {
        r = resolveChannelStep(session);
      } else {
        const policy = (actor.npcId && NPCS[actor.npcId]?.aiPolicy) || DEFAULT_BANDIT_POLICY;
        r = resolveAction(session, pickAction(actor, session, policy));
      }

      if (r.invalid) {
        // Defensive: skip the turn rather than infinite-loop on a bad
        // pick. Should never fire unless an NPC's hotbar / state is
        // misconfigured.
        const advanced = advanceTurn(session).session;
        setSession(advanced);
        return;
      }
      setSession(r.session);
      if (r.narrative) {
        setCombatLog((log) =>
          [...log, ...r.narrative.split("\n").filter(Boolean)].slice(-50),
        );
      }
      // Engine reports firedSpell only when the spell's mechanical
      // effect actually ran — interrupt-fizzles and multi-turn channel
      // starts skip it. Works for both fresh casts and channel-final
      // resolves (when the original cast happened on a previous turn).
      flagSpellFx(r.firedSpell);
      flagStrikeFx(r.firedStrike);
    }, AI_TURN_DELAY_MS);

    return () => {
      if (aiTimerRef.current !== null) {
        clearTimeout(aiTimerRef.current);
        aiTimerRef.current = null;
      }
    };
  }, [session, flagSpellFx, flagStrikeFx]);

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
          loading={false}
          onCommand={handleCommand}
          lastBlast={lastBlast}
          lastFirebolt={lastFirebolt}
          lastStrike={lastStrike}
          lastCleanse={lastCleanse}
        />
      )}
    </div>
  );
}
