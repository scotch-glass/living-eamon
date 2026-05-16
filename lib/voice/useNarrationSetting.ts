// ============================================================
// Player narration preference — localStorage hook (CF-1.5).
//
// Persists the "voice narration on/off" preference across
// reader-panel opens. Default is OFF (player opts in) so audio
// never starts unexpectedly.
//
// A future Settings page can read/write the same key.
// ============================================================

'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'living-eamon:voice-narration-enabled';

export function useNarrationSetting(): {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  isReady: boolean;
} {
  const [enabled, setEnabledState] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  // Hydrate from localStorage on mount. SSR-safe — we don't read
  // window during render; we read inside useEffect which only
  // runs in the browser.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === 'true') setEnabledState(true);
    } catch {
      // private mode or storage-disabled — fall through to default
    }
    setIsReady(true);
  }, []);

  const setEnabled = (v: boolean) => {
    setEnabledState(v);
    try {
      window.localStorage.setItem(STORAGE_KEY, v ? 'true' : 'false');
    } catch {
      // ignore storage write failures
    }
  };

  return { enabled, setEnabled, isReady };
}

export const NARRATION_STORAGE_KEY = STORAGE_KEY;
