---
date: 2026-04-13
status: draft
platforms: [x, bluesky, mastodon, discord]
screenshots:
  - ../screenshots/2026-04-13-zim-pots-and-bobbles-1.png
  - ../screenshots/2026-04-13-zim-pots-and-bobbles-2.png
---

## X / Bluesky / Mastodon (short)

Meet Zim — young wizard, runs the magic shop in Living Eamon's hub city. Dark blue robes, pockets full of vials, eyes that have read every book in the room.

NPC sprites are AI-generated (Grok Imagine), background-removed locally with rembg, and pregenerated on server start so the player never waits.

#gamedev #indiegame #buildinpublic

## Discord (longer)

New NPC sprite for **Zim** — the young wizard who runs Pots & Bobbles, the magic shop south of the courtyard.

Pipeline:
- Grok Imagine generates a 3:4 portrait on white background
- rembg (Python AI segmentation) cuts the background out
- Transparent PNG cached in Supabase Storage
- Sprite appears on the right side of the screen during conversation
- All sprites pregenerated on server startup — no waiting in-game

The new prompt focused on a clean, helpful look: dark blue robe with many small pockets, a leather utility belt with pouches, bright intelligent eyes, friendly expression. Came out beautifully.

[screenshot]
