// Per-combatant status-column visibility for Combat Arena v2 (Phase 2).
//
// Three triggers reveal the column:
//   1. Mouseenter on the slot (visible immediately, fade timer cancelled).
//   2. Mouseleave from the slot (schedule a 3-sec fade).
//   3. State delta — passed as a primitive `signature` string. Whenever
//      the signature changes the column auto-pops and schedules the same
//      3-sec fade. The caller composes the signature from the values it
//      wants watched: `${c.hp}|${c.mana}|${inv.length}|${effects.length}`.
//
// `signature` is a string rather than an array so the effect deps stay
// primitive — passing `[c.hp, c.mana]` inline would create a fresh array
// reference on every render and re-fire the effect in a loop.
"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface ColumnVisibility {
  visible: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const COLUMN_AUTO_HIDE_MS = 3000;

export function useColumnVisibility(signature: string): ColumnVisibility {
  const [visible, setVisible] = useState(false);
  const fadeTimerRef = useRef<number | null>(null);
  const prevSigRef = useRef<string>(signature);
  const isHoveringRef = useRef(false);
  const firstRenderRef = useRef(true);

  const scheduleFade = useCallback(() => {
    if (fadeTimerRef.current !== null) {
      window.clearTimeout(fadeTimerRef.current);
    }
    fadeTimerRef.current = window.setTimeout(() => {
      if (!isHoveringRef.current) setVisible(false);
      fadeTimerRef.current = null;
    }, COLUMN_AUTO_HIDE_MS);
  }, []);

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      prevSigRef.current = signature;
      return;
    }
    if (signature !== prevSigRef.current) {
      prevSigRef.current = signature;
      setVisible(true);
      scheduleFade();
    }
  }, [signature, scheduleFade]);

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current !== null) {
        window.clearTimeout(fadeTimerRef.current);
      }
    };
  }, []);

  const onMouseEnter = useCallback(() => {
    isHoveringRef.current = true;
    if (fadeTimerRef.current !== null) {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    setVisible(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    isHoveringRef.current = false;
    scheduleFade();
  }, [scheduleFade]);

  return { visible, onMouseEnter, onMouseLeave };
}
