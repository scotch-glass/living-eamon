"use client";

import { useEffect, useState } from "react";
import type { SpriteMetadata } from "./spriteMetadata";

/** Fetch sprite metadata for a single sprite path, with a per-path cache.
 *  Returns the metadata or null if not yet loaded / not found. */
const cache = new Map<string, SpriteMetadata>();
const inflight = new Map<string, Promise<SpriteMetadata>>();

async function fetchOne(spritePath: string): Promise<SpriteMetadata> {
  const existing = inflight.get(spritePath);
  if (existing) return existing;
  const p = (async () => {
    const resp = await fetch(`/api/sprite-metadata?path=${encodeURIComponent(spritePath)}`);
    const j = (await resp.json()) as { ok: boolean; entry?: SpriteMetadata };
    const entry = j.ok && j.entry ? j.entry : { path: spritePath, approval: "unreviewed" as const };
    cache.set(spritePath, entry);
    return entry;
  })();
  inflight.set(spritePath, p);
  try {
    const result = await p;
    return result;
  } finally {
    inflight.delete(spritePath);
  }
}

export function useSpriteMeta(spritePath: string | null): {
  meta: SpriteMetadata | null;
  ready: boolean;
} {
  const [meta, setMeta] = useState<SpriteMetadata | null>(
    spritePath ? cache.get(spritePath) ?? null : null,
  );

  useEffect(() => {
    if (!spritePath) {
      setMeta(null);
      return;
    }
    const cached = cache.get(spritePath);
    if (cached) {
      setMeta(cached);
      return;
    }
    let cancelled = false;
    void fetchOne(spritePath).then((entry) => {
      if (!cancelled) setMeta(entry);
    });
    return () => {
      cancelled = true;
    };
  }, [spritePath]);

  return { meta, ready: meta != null };
}
