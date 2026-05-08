// ============================================================
// LIVING EAMON — Prompt-capture helper for forge scripts
//
// Forge scripts (forge-hero-combat, forge-corpses, regen-npc-sprites,
// forge-vivian-poses, etc.) call this helper after generating a sprite
// PNG. It writes the verbatim Grok prompt + a snapshot ID of the
// standing prompt rules into the canonical metadata registry so the
// Sprite Review Tool can show the prompt that produced any sprite.
// ============================================================

import {
  defaultMetadata,
  loadMetadata,
  saveMetadata,
  type SpriteMetadata,
} from "./spriteMetadata";

interface RecordOpts {
  /** Relative public-art path of the sprite, e.g. "/art/heroes/gaius/combat/great_sword/v3.png". */
  spritePath: string;
  /** Verbatim Grok Imagine prompt that produced this sprite. */
  prompt: string;
  /** snapshotId from prompt-rules/standing.json at generation time. */
  promptRulesSnapshotId?: string;
  /** Default size class to apply to fresh metadata (will not overwrite an existing classification). */
  defaultSizeClass?: SpriteMetadata["sizeClass"];
  /** Set true on a forged corpse PNG. */
  isCorpse?: boolean;
  /** For corpses: the path of the matching live sprite (or hero/NPC master). */
  livingSpriteRef?: string;
}

export async function recordPromptForSprite(opts: RecordOpts): Promise<SpriteMetadata> {
  const existing = await loadMetadata(opts.spritePath);
  const base = existing.path === opts.spritePath ? existing : defaultMetadata(opts.spritePath);
  const next: SpriteMetadata = {
    ...base,
    path: opts.spritePath,
    originalPrompt: opts.prompt,
    promptRulesSnapshotId: opts.promptRulesSnapshotId ?? base.promptRulesSnapshotId,
    sizeClass: base.sizeClass ?? opts.defaultSizeClass,
    isCorpse: opts.isCorpse ?? base.isCorpse,
    livingSpriteRef: opts.livingSpriteRef ?? base.livingSpriteRef,
    // Newly-forged sprites reset to unreviewed so the human re-pins eye-Y.
    approval: "unreviewed",
  };
  await saveMetadata(next);
  return next;
}
