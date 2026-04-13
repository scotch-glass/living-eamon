# NPC Sprite System

## Overview

NPCs appear as transparent PNG sprites on the right side of the screen during conversations. The whole pipeline runs through Grok Imagine + rembg AI background removal.

## Pipeline

```
Grok Imagine (3:4 portrait) → JPEG with white BG
      ↓
rembg (Python subprocess) → AI segmentation
      ↓
Transparent PNG → Supabase Storage
      ↓
scene_image_cache table
      ↓
NPCSprite component (right-aligned, bottom-anchored)
```

## Key Files

- `lib/imageProcessing.ts` — wraps rembg via Python subprocess
- `lib/spritePregenerate.ts` — runs on server startup, generates missing sprites
- `app/api/npc-image/route.ts` — on-demand generation (rarely needed after pregen)
- `components/NPCSprite.tsx` — fixed-position display with fade in/out
- `gameData.ts` — NPCs have `spritePrompt` field defining their appearance

## Decisions Made

1. **rembg over imgly** — better edge quality, no patchy artifacts
2. **3:4 aspect ratio** — consistent proportions across all NPCs
3. **Pre-generation on server start** — no API call risk during gameplay; Grok Imagine outage doesn't break sprites
4. **Cached by `sprite_${npcId}` key** — checked on startup, only missing ones generate
5. **Sprite shows only during active conversation** — not for every NPC in every room (less visual noise)
6. **Conversation NPC tagged via `__NPC__npcId__` token** at start of streamed response — client prefetches sprite while text is still streaming
