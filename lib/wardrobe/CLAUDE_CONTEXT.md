# Wardrobe Engine — Claude Context (scoped)

> **You are working on the Wardrobe Engine only.** Load this file INSTEAD of the root `CLAUDE_CONTEXT.md` when touching any code under [lib/wardrobe/](.), [app/api/wardrobe/](../../app/api/wardrobe/), [scripts/wardrobe/](../../scripts/wardrobe/), or assets under [public/art/wardrobe/gaius/](../../public/art/wardrobe/gaius/), [public/wardrobe-bodies/](../../public/wardrobe-bodies/), [public/wardrobe-heads/](../../public/wardrobe-heads/). Skip combat, mana, body-zone combat, adventures, and PD lore unless expressly relevant.
>
> Adjacent reference files worth knowing about: [lib/identityBlock.ts](../identityBlock.ts) (per-hero identity prompt), [lib/spriteFraming.ts](../spriteFraming.ts) (canonical "left, medium" figure-fill framing), and [lib/weaponCarry.ts](../weaponCarry.ts) (weapon-id → carry-style map). Everything else in the root context is out of scope here.

---

## 0 · Phase + status (2026-04-25)

**Architecture locked: headless body + composited head.** Per the 2026-04-25 plan, every body PNG has its head/neck cut off above the shoulders and is shared across ALL heroes; each hero has one head PNG; runtime (or deploy-time) stacks head over body. The `cut-head.ts` programmatic approach was abandoned — heads are cut by an outside Photoshop artist.

**Library state:** 10 heroes (was 20). Long-hair (6) and medium-hair (4) heroes were deleted on 2026-04-25 because their hair drapes onto/past the shoulders, which is incompatible with the head/body composite (the head asset has to fit cleanly above the chin-line cut). The `HairLength` type is now narrowed to `"bald" | "short"` — long and medium are permanently banned.

**Body art state:** The 40 Gaius pilot PNGs in [public/art/wardrobe/gaius/](../../public/art/wardrobe/gaius/) are still HEAD-ATTACHED (Gaius's head). They were forged before the architecture pivot. They become the artist's input — the artist cuts off Gaius's head, producing 40 headless body PNGs that get stored at [public/wardrobe-bodies/](../../public/wardrobe-bodies/). Then each of the 10 hero heads is cut from its master and stored at [public/wardrobe-heads/](../../public/wardrobe-heads/). Runtime composites head + body.

**Character-LoRA spike (2026-04-26 → 2026-04-27): ABANDONED.** Tried Scenario.gg → Civitai → Vast.ai self-hosted (Flux Dev + PuLID, then Pony Realism v23, then Illustrious XL). No model produced the painterly + character-coherent + correct-weapons trifecta. Flux Dev fundamentally doesn't understand objects (independently confirmed); Pony has female bias + bad weapons; Illustrious is anime-coded. **Strategic resolution: Grok Imagine Pro for everything**, with **human-artist polish** as the quality gate for the player character (manual Photoshop fixes weapons/anatomy before sprite ships). The headless-body + composited-head architecture in §6 stays canonical — it's the right shape for human-polished outputs. Full post-mortem in [memory: project_session_003_lora_pivot_outcome.md](/Users/joshuamcclure/.claude/projects/-Users-joshuamcclure-Desktop-living-eamon/memory/project_session_003_lora_pivot_outcome.md). Pony Realism v23 infrastructure preserved as **dormant backup** for NSFW art if Grok's content policies tighten — see [memory: project_pony_nsfw_backup_pipeline.md](/Users/joshuamcclure/.claude/projects/-Users-joshuamcclure-Desktop-living-eamon/memory/project_pony_nsfw_backup_pipeline.md). §13 procedure is now historical.

**What's parked:**
- Wiring forged sprites into [/api/hero-equipment-sprite](../../app/api/hero-equipment-sprite/route.ts) — waits for the headless deliverable.
- The `wardrobe_bodies` + `hero_heads` migration — also waits for the deliverable.
- Combat stance, plate armor, drag-and-drop paperdoll UX.

---

## 1 · What V2 is now

A pre-rendered sprite library of headless bodies (hero-agnostic) plus per-hero head crops, composited at render time. Indexed by `(stance, equipment, weapon-carry)` for bodies and `(hero_slug)` for heads.

The previous "monolithic full-body sprite" design (one PNG per hero × combo) was scrapped because:
- 40 combos × 10 heroes = 400 PNGs of artist time per stance dimension, exploding when combat stance lands.
- Headless bodies are SHARED — 40 body PNGs cover all heroes regardless of count.
- Death-cost / gear-customization ambition (see §7) requires per-item art eventually; that's much easier on a templated body than on baked composites.

V1's pair-diff cutter design (naked + dressed → mask the diff → transparent armor piece → composite at runtime) was scrapped earlier. Pair-diff failed because Grok's per-call pose drift made pair registration unusable. The 19-slot paperdoll architecture in [slots.ts](./slots.ts) is dormant scaffolding from V1 — kept in case we revisit at the per-item-art stage.

## 2 · Pilot matrix — 40 Gaius head-attached sprites, all approved

**Equipment (5):** loincloth · gray_robe · common_clothes · leather_armor · chain_mail
**Weapon-carry (8):** unarmed · hip_short_blade · hip_long_blade · hip_haft_mace · hip_haft_axe · back_two_hander · staff_bow · polearm
**Stance (1):** casual

`5 × 8 × 1 = 40`. All forged + approved 2026-04-24, recorded in [public/art/wardrobe/gaius/_submitted.json](../../public/art/wardrobe/gaius/_submitted.json). These are the artist's input for the head-cut step.

Deferred:
- **plate_armor** — type exists, excluded from `PILOT_EQUIPMENT` until horses ship.
- **combat stance** — type exists, no combat-stance combos forged yet.

## 3 · Public API (barrel: [index.ts](./index.ts))

External callers (`app/api/hero-equipment-sprite/route.ts`, `components/HeroScenePortrait.tsx`, etc.) import from `lib/wardrobe`. The barrel exports:

- **Types:** `Equipment`, `WeaponCarry`, `Stance` — the three pilot dimensions.
- **Prompt framings:** `EQUIPMENT_FRAMING`, `WEAPON_CARRY_FRAMING`, `STANCE_FRAMING`, `FRESH_REBIRTH_FRAMING` — single source of truth for body prompts (see [prompts/body.ts](./prompts/body.ts)). Both the V2 forge and the legacy runtime route import these strings.
- **Pilot scope:** `PILOT_EQUIPMENT`, `PILOT_WEAPONS`, `PILOT_STANCES` — the matrix the forge iterates over.
- **Paperdoll types** (dormant): `Outfit`, `Posture`, `Slot`.

ESLint (no-restricted-imports in [eslint.config.mjs](../../eslint.config.mjs)) blocks any reach into `lib/wardrobe/{slots,generate,prompts/*,_internal/*}` from outside the module. Internal code stays internal.

## 4 · Forge pipeline ([scripts/wardrobe/forge-body.ts](../../scripts/wardrobe/forge-body.ts))

```
buildIdentityBlock(template hero)
  + EQUIPMENT_FRAMING[equipment]
  + WEAPON_CARRY_FRAMING[weapon]
  + STANCE_FRAMING[stance]
  + FRESH_REBIRTH_FRAMING
  + ANCHOR_POSE_LOCK            (rigid joints + lighting + pure-white backdrop)
  + canonicalFraming("left", "medium")
→ grok-imagine-image-pro @ 2k, aspect_ratio 3:4
→ rembg                         (white backdrop → transparent PNG)
→ public/art/wardrobe/gaius/{equipment}_{weapon}_{stance}.png
   (or, with --upload: wardrobe-bodies bucket + wardrobe_bodies DB row — bucket and table not yet created)
```

CLI:
```bash
npx tsx scripts/wardrobe/forge-body.ts --equipment=leather_armor --weapon=hip_short_blade --stance=casual
npx tsx scripts/wardrobe/forge-body.ts --all
npx tsx scripts/wardrobe/forge-body.ts --combos=common_clothes_back_two_hander_casual,gray_robe_staff_bow_casual
npx tsx scripts/wardrobe/forge-body.ts --all --dry-run
```

Cost: $0.07 per combo. Pro RPS is 1; script sleeps 2s between calls. Full matrix ≈ 22 min wall, ~$2.80. `--templateSlug=<slug>` swaps the hero whose identity drives generation; defaults to `gaius`.

## 5 · QA loop

After a forge run, Scotch reviews each PNG in [public/art/wardrobe/gaius/qa.html](../../public/art/wardrobe/gaius/qa.html) — a static page showing every combo in a grid. Approve/reject decisions persist via two API routes:

- [app/api/wardrobe/qa-review/route.ts](../../app/api/wardrobe/qa-review/route.ts) — GET hydrates state, POST patches one combo into [_reviews.json](../../public/art/wardrobe/gaius/_reviews.json).
- [app/api/wardrobe/qa-submit/route.ts](../../app/api/wardrobe/qa-submit/route.ts) — POST snapshots `_reviews.json` into `_submitted.json` with timestamp + summary.

Rejection loop:
1. Read notes in `_reviews.json`.
2. Adjust the relevant clause in [prompts/body.ts](./prompts/body.ts) (often EQUIPMENT_FRAMING for that equipment).
3. Re-run the forge for just the rejected combos via `--combos=...`.
4. Mark approved in the QA UI.

`_reviews.backup-{timestamp}.json` files are frozen snapshots — never edited.

## 6 · Head/body composite architecture (locked)

### How it works

Two storage paths, each named with a strict pattern:

```
public/wardrobe-bodies/body_{stance}_{equipment}_{weapon-carry}.png   ← hero-agnostic, headless
public/wardrobe-heads/head_{slug}.png                                 ← per-hero
```

A render of player X with `(stance=casual, equipment=leather_armor, weapon-carry=hip_short_blade)` is the composite of:
- `head_{X.slug}.png` (e.g. `head_seward.png`)
- `body_casual_leather_armor_hip_short_blade.png`

Same body PNG serves all 10 heroes. Same head PNG serves all 40 combos for that hero. Total art at full pilot scope: 40 bodies + 10 heads = **50 unique PNGs** (down from 400 if we were baking heads into bodies per-hero).

### Why programmatic head-cut failed (history)

`cut-head.ts` used a fixed chinY + alpha gate to cut bodies. Worked geometrically but failed visually:
- Grok renders the head at slightly different Y, scale, and tilt every call. A constant chinY clipped some sprites mid-jaw and others below the collarbone.
- Body↔head mismatch in skin tone, lighting, and shadow direction made even successfully-cut heads look pasted-on.

Adaptive segmentation was tried; not robust. **Decision: outside Photoshop artist does the cuts.** Hand-blending solves the lighting/skin-tone seam trivially.

### Hair length is permanently bounded

The chin-line cut means the head asset CANNOT contain hair that reaches the shoulders. Long and medium hair are banned in [lib/heroTypes.ts](../identityBlock.ts) and [lib/identityBlock.ts](../identityBlock.ts) — the `HairLength` type is `"bald" | "short"`. Any seed entry that tries to use `medium` or `long` is a TypeScript error.

The canonical phrase in `hairClause()` for short hair is verbatim:
```
Close-cropped {color} hair
```

## 6.5 · Asset naming + identity

**The artist-facing canonical reference is [WARDROBE_ART_SPEC.md](./WARDROBE_ART_SPEC.md)** in this folder. That document is the contract for the outside Photoshop artist's deliverable: filename patterns, the chin-line cut rule, technical requirements, the per-stance input/output matrix, and forward-compat rules for future dimensions. It is a separate file so it can be handed to the artist (or briefer) without dragging the whole codebase context along, and so combat-stance specs can be appended cleanly when that pass starts.

Quick dev-reference (full detail in `WARDROBE_ART_SPEC.md`):

- Headless body filename: `body_{stance}_{equipment}_{weapon-carry}.png` in `public/wardrobe-bodies/`.
- Head filename: `head_{slug}.png` in `public/wardrobe-heads/`.
- Adding new dimensions: append `_{value}` to the filename in fixed canonical order; never retroactively rename existing files.

### DB schema (sketch — migration deferred until artist delivers)

```sql
create table wardrobe_bodies (
  id uuid primary key default gen_random_uuid(),
  filename_slug text not null unique,        -- "body_casual_leather_armor_hip_short_blade"
  stance text not null,
  equipment text not null,
  weapon text not null,                      -- carry category for V2; per-item later
  png_url text not null,
  wardrobe_version integer not null,
  retired_at timestamptz,
  created_at timestamptz not null default now()
);

create table hero_heads (
  id uuid primary key default gen_random_uuid(),
  hero_slug text not null,
  filename_slug text not null unique,        -- "head_gaius"
  png_url text not null,
  head_version integer not null default 1,
  retired_at timestamptz,
  created_at timestamptz not null default now()
);
```

## 7 · Long-term direction: per-item gear (NOT this phase's work)

V2 ships **carry-category** granularity for art economy: a `short_sword` and a `dagger` both render as the `hip_short_blade` body sprite. Multiple weapon items share one underlying sprite where their visual class is the same; the runtime maps `weapon_id → carry_category` via [lib/weaponCarry.ts](../weaponCarry.ts).

Long-term, the game design calls for **per-item interchangeable gear**, modeled on Ultima Online and Heads Will Roll Reforged: every weapon, ring, cloak, helm, etc. has its own art that fits onto a fully templated body. Reason: gear loss on death is the only meaningful penalty in a Perpetual Hero game; if gear is generic and easily replaced, death loses its sting. Player attachment to a character is built through their accumulated gear. The Conan-in-a-loincloth aesthetic is our in-canon explanation: a Perpetual Hero who has died many times learns not to attach to gear that will be lost.

Implications for how we build forward:

- **Don't bake category assumptions into runtime types.** When per-item lands, `WeaponCarry` may stay as a *visual fallback class* but the primary lookup key becomes the actual item id. Keep the indirection layer ([lib/weaponCarry.ts](../weaponCarry.ts)) so per-item art can slot in without rewriting consumers.
- **Filename schema accommodates the shift.** The fixed canonical-order rule above means when item ids replace carry categories, the pattern stays `body_{stance}_{equipment}_{weapon}.png`, just with `weapon = short_sword` instead of `weapon = hip_short_blade`.
- **DB schema accommodates the shift.** Add columns for new dimensions; existing rows stay valid.

## 8 · Anchor pose lock + prompt-language discipline

[prompts/anchor.ts](./prompts/anchor.ts) holds `ANCHOR_POSE_LOCK` — the rigid joint, gaze, lighting, and backdrop spec appended to every forge call. Exhaustively specified because under-specified pose lets Grok drift a few degrees per regen, and that drift breaks the "this is the same hero, just dressed differently" contract across 40 sprites.

**Prompt-language rule of thumb:** if a Grok output already demonstrates a property we want, keep its generating clause **verbatim**. Paraphrasing equals property loss. The gaze clause is copy-pasted from the proven-working library generator (every existing hero master makes direct eye contact with the camera). Don't embroider it.

The `CANONICAL_BODY_PROMPT_CHECKSUM` in [slots.ts](./slots.ts) is the monotonic version. Bump by 1 whenever any of the following changes:
- `ANCHOR_POSE_LOCK` text
- `CANVAS_WIDTH` / `CANVAS_HEIGHT`

## 9 · xAI Grok Imagine Pro capability notes

- **Model:** `grok-imagine-image-pro` ONLY. Standard `grok-imagine-image` is banned per `feedback_art_quality_pro_only.md`.
- **Endpoint:** `/v1/images/generations` via the `openai` SDK (`baseURL: https://api.x.ai/v1`). Text-only prompt. `response_format: "b64_json"`, `aspect_ratio: "3:4"`, `resolution: "2k"`.
- **Resolution:** always `"2k"`. 2k is the SAME $0.07 as 1k on Pro.
- **Cost:** $0.07 per call.
- **Rate limits:** RPM 30, RPS 1. Forge sleeps 2s between calls.

## 10 · Files inventory (post-2026-04-25 hair audit + rename)

```
lib/wardrobe/
  index.ts            ← public barrel (types + framings + pilot constants)
  generate.ts         ← Grok Imagine Pro wrapper (used by forge-body.ts)
  slots.ts            ← dormant 19-slot paperdoll scaffold + CANONICAL_BODY_PROMPT_CHECKSUM
  prompts/
    body.ts           ← EQUIPMENT × WEAPON × STANCE framing strings (single source of truth)
    anchor.ts         ← ANCHOR_POSE_LOCK
  _internal/          ← reserved for future internals
  scratch/            ← reserved for ad-hoc debugging
  CLAUDE_CONTEXT.md   ← this file
  WARDROBE_ART_SPEC.md ← canonical artist deliverable spec (filename patterns, cut rules, stance matrices)

scripts/wardrobe/
  forge-body.ts       ← V2 generator (one head-attached PNG per combo)
  create-bucket.ts    ← one-shot bucket bootstrap

app/api/wardrobe/
  qa-review/route.ts  ← persist QA decisions
  qa-submit/route.ts  ← snapshot for Claude to act on

public/art/wardrobe/gaius/                  ← 40 head-attached pilot sprites, artist input
  {equipment}_{weapon}_{stance}.png     ← LEGACY filename pattern (pre-architecture-pivot)
  _reviews.json + _submitted.json       ← QA state
  _reviews.backup-*.json                ← frozen historical snapshots
public/art/wardrobe/gaius/qa.html           ← static QA review UI

public/wardrobe-bodies/                 ← (FUTURE) artist deliverable: headless bodies
  body_{stance}_{equipment}_{weapon-carry}.png
public/wardrobe-heads/                  ← (FUTURE) artist deliverable: per-hero head crops
  head_{slug}.png

public/art/heroes/                    ← 10 hero master PNGs (post hair audit)
public/wardrobe-scratch/                ← Gaius anchor v1–v4 + dead pair-diff outputs (visual record)
```

## 11 · Experiments log (append-only)

Append new entries at the bottom. Bias toward facts and prompt diffs that future-you would otherwise have to rediscover.

### 2026-04-24 — Day 1 scaffold (V1, pair-diff plan)
- 19-slot registry + canvas constants + canonical pose lock committed.
- Migration `20260424120000_wardrobe_tables.sql` + `wardrobe-layers` bucket created.
- ESLint barrel boundary enforced.
- **Seward v1 casual anchor** (DISCARDED): pilot's first attempt at 1k. Three problems surfaced — (a) Seward's seed had `facialHair: "full_beard"` → "collarbone-length auburn beard" violates short-beards-only rule; pilot switched to **Gaius** (brown stubble) as the test template; (b) screen-facing inversion across the WHOLE library — `spriteFraming.framingForSide()` used anatomical left/right ("left shoulder forward") that Grok read from the character's perspective; fixed in [lib/spriteFraming.ts](../spriteFraming.ts) by replacing anatomical language with viewer-frame landmarks; (c) 1k looked grainy → switched to `resolution: "2k"`.
- **Gaius v2 / v3 / v4 casual anchors**: three-step iteration arriving at the v4 gaze clause. v2 lost direct eye contact when a "no-eyes-straight-ahead" clause was added; v3 tried "over-shoulder eye contact" / "pupils return to camera" and Grok mis-interpreted; v4 reverted to the pre-wardrobe library generator's exact verbiage and eye contact returned. **Lesson, repeated as the prompt-language rule above:** keep proven-working clauses verbatim.

### 2026-04-24 — Day 2 pivot from pair-diff to V2 monolithic
- Pair-diff cutter was built and run repeatedly against a leather-cuirass test piece. Output masks were unusable — two independent Grok calls drifted pose, backdrop tint, and garment cut between A (naked) and B (dressed) by enough that the LAB-space ΔE diff caught skin-tone shifts as foreground.
- Decision: scrap pair-diff entirely. Generate the full body per combo. The 40-combo matrix is small enough that pre-rendering is cheaper and more controllable than runtime composition.

### 2026-04-24 — V2 forge + QA loop ship
- `forge-body.ts` iterated through `--all` against the Gaius template across 40 combos in ≈22 min, ≈$2.80.
- QA UI + qa-review/qa-submit routes shipped.
- Several prompt regressions discovered + fixed during QA:
  - `common_clothes` regressed to a "male stripper" rendering when ANCHOR_EXCLUSIONS was inherited unchanged from the V1 pair-diff naked-anchor prompt — the exclusion rail forbade the very clothes the equipment clause was asking for. ANCHOR_EXCLUSIONS dropped from V2 forge prompt.
  - `back_bow` (legacy slug) was rejected across gray_robe + common_clothes when Grok rendered it as actually-shouldered. Prompt was rewritten so the bow is held vertically in the right hand like a walking staff (butt on the ground, upper limb past the shoulder).
  - `chain_mail` had visible-through-rings transparency artifacts; fixed by adding a "sewn directly onto a thick solid black cotton inner liner" clause.
- Final batch: 40 / 40 approved at 2026-04-24 17:58:36Z.

### 2026-04-25 — Cleanup pass
- Pair-diff cutter purged: deleted `lib/wardrobe/{extract.ts, paintCrop.ts, anchor.ts, prompts/chest.ts}`, `scripts/wardrobe/{forge-anchor.ts, forge-piece.ts, paint-crop-piece.ts, smoke-composite.ts}`. `editImage` removed from `generate.ts`. `LANDMARK_*` constants removed from `slots.ts`.
- Programmatic head-cut abandoned: deleted `scripts/wardrobe/cut-head.ts`, `public/wardrobe-heads/`, `public/wardrobe-bodies/`. Head-swap to be done by an outside Photoshop artist.
- `back_bow` → **`staff_bow`** rename across all source files, the 5 PNG filenames, and JSON keys. Backup snapshots left untouched. New slug describes carry style ("held like a staff, butt on the ground") rather than location.
- ESLint internal-imports rule trimmed to `**/lib/wardrobe/*` + `**/lib/wardrobe/**/*` now that the explicit per-file list contained dead names.

### 2026-04-25 — Tool research: Scenario.gg + Layer.ai (evening)
- Two parallel research agents investigated [Scenario.gg](https://www.scenario.gg/) (character-LoRA on Flux 2) and [Layer.ai](https://layer.ai/) as alternatives to Grok Imagine Pro for hero sprite generation.
- **Layer.ai rejected.** Despite the name, the product does NOT output per-slot transparent layered sprites. Their tools produce single sprite sheets / atlases. Style showcase is pixel-art / 8-bit / casual mobile (Zynga, King, Tripledot, SciPlay); painterly oil-realism is explicitly absent. The "layered sprites" framing was marketing copy, not a product feature. No spike planned. (Sources: [Sprite Generation use case](https://www.layer.ai/use-cases/sprite-generation), [Sprite Sheet tool](https://www.layer.ai/tools/layer--generate-a-sprite-sheet))
- **Scenario.gg looks credible for the character-drift problem.** Documented character-LoRA training on Flux 2 from 5–15 reference images, up to 5 LoRAs stacked, REST API + MCP server. Pricing tiers $45/mo Pro and $75/mo Max. Three caveats: (1) 4MP resolution ceiling on Flux 2 — our 1776×2528 = 4.49MP exceeds this, so we'd generate at ~1456×2080 (3MP) and optionally upscale; (2) no third-party LoRA upload, so a Frazetta/Brom painterly style LoRA would have to be trained from scratch; (3) identity preservation past ~30 generations is undocumented by Scenario themselves. (Sources: [Training docs](https://docs.scenario.com/docs/training-models), [Pricing](https://www.scenario.com/pricing), [LoRA Blends](https://www.scenario.com/features/lora-blends))
- Decision: spike Scenario in parallel with the V2 artist-cut plan. Cheap data ($45 worth of drift measurement), no risk to existing plan. Full procedure in §13.

### 2026-04-25 — Architecture pivot + hair audit + rename
- **Architecture locked: headless body + composited head.** `wardrobe_bodies` keyed by `(stance, equipment, weapon-carry)` (hero-agnostic); `hero_heads` keyed by hero slug. Body PNGs are SHARED across all heroes. Headless bodies + head crops will be produced by an outside Photoshop artist using the existing 40 Gaius PNGs as input.
- **Asset naming locked:** `body_{stance}_{equipment}_{weapon-carry}.png` for hero-agnostic bodies, `head_{slug}.png` for heads. Documented in §6.5 as the canonical reference for the artist's spec sheet.
- **Hair audit:** library shrunk 20 → 10. Deleted (LONG): kane, orin, roderic, aldan, karn, draxan. Deleted (MEDIUM): vard, corin, thane, ivorn. Survivors: gaius, dural, selek, halvar, marik, talon, rurik, hollan, lev, seward (5 short + 5 bald). FK pre-flight clean (no players bound). 10 hero_masters DB rows deleted; 10 PNGs `rm`-ed from public/art/heroes/.
- **`HairLength` type narrowed** in [lib/heroTypes.ts](../heroTypes.ts) to `"bald" | "short"`. Removed `medium` and `long` from `hairClause` in [lib/identityBlock.ts](../identityBlock.ts). Long/medium hair is permanently disallowed because it's incompatible with the chin-line head/body composite.
- **`hip_blade` → `hip_short_blade` rename** for symmetry with `hip_long_blade`. Files touched: [lib/weaponCarry.ts](../weaponCarry.ts), [lib/wardrobe/prompts/body.ts](./prompts/body.ts), [components/HeroScenePortrait.tsx](../../components/HeroScenePortrait.tsx), [public/art/wardrobe/gaius/qa.html](../../public/art/wardrobe/gaius/qa.html), [scripts/wardrobe/forge-body.ts](../../scripts/wardrobe/forge-body.ts) (comments only), the 5 `*_hip_blade_casual.png` PNGs, `_reviews.json`, `_submitted.json`, root and wardrobe `CLAUDE_CONTEXT.md`. Backup snapshots left frozen.
- **Long-term direction documented** in §7: per-item interchangeable gear (UO/body-zone-style) is the V3+ target; the V2 carry-category granularity is economy not end-state. Memory entries added in user's project memory.

### 2026-04-26 — Scenario.gg auth verified
- Probed Scenario's REST API with HTTP Basic auth (KEY:SECRET base64-encoded into the Authorization header) against `GET https://api.cloud.scenario.com/v1/models`. Result: **HTTP 200**, response body `{"models":[]}` — empty array because no LoRAs have been trained on this account yet. Auth handshake works; cleared to start the spike's next phase.
- Env-var convention locked: `SCENARIO_API_KEY` + `SCENARIO_API_SECRET` in `.env.local`. Added to `.env.example` as placeholders, root [CLAUDE_CONTEXT.md](../../CLAUDE_CONTEXT.md) updated to flag Scenario as a project-wide provider. The planned client module lives at `lib/scenario/` — not yet built; will be scaffolded when the first real call is made.
- **§13 step ordering revised** per Scotch's 2026-04-26 direction: train the **sword-and-sorcery style LoRA first** (the locked four-painter canon — **Frank Frazetta, Boris Vallejo, Ken Kelly, Frank Brunner**), then the Gaius character LoRA on top with style stacked. Style LoRA is project-wide infrastructure (every future Scenario call uses it: heroes, NPCs, monsters, scenes, item art) regardless of whether the character spike succeeds.

### 2026-04-26 → 04-27 — Character-LoRA spike: ABANDONED
- Scenario.gg abandoned mid-spike (Pro plan capped uploads at 25 vs 50 needed; auth lockout after partial run; account deleted). Civitai considered next, rejected for content-policy reasons.
- Pivoted to self-hosted Vast.ai + Cloudflare R2. Trained a Frazetta/Vallejo style LoRA on Flux Dev (50 painter reference images, 2000 steps, ~$4 spend) — style transfer worked. Saved as dormant artifact at `r2://living-eamon/trained-loras/style-v1/`.
- Built PuLID-Flux multi-character generation pipeline. Generated 90 hero variations (5 heroes × 18 prompts) at 1280×1920. Face identity preserved cleanly.
- **The killer:** Flux Dev's base model fundamentally doesn't understand objects. Weapons hallucinate (two-headed axes, scythe-spears, weapons floating disconnected from hands, fingers wrapping the blade not the hilt). Independently confirmed by another Claude agent. Documented as a community-known Flux failure mode.
- Tested Pony Realism v23 as alternative — better grip mechanics (NSFW training transfer) but generates female characters by default without explicit `1boy` booru tags, AND weapons still rendered incorrectly (weaponless characters, deformed objects) even with male tags + position-explicit prompts.
- Tested Illustrious XL as final fallback — too anime-coded for Frazetta/Vallejo aesthetic.
- **Decision (2026-04-27):** Abandon LoRA character training entirely. Return to Grok Imagine Pro for all generation, with **human-artist polish** as the quality gate for the player character. Pony Realism v23 path preserved as dormant backup for NSFW art if Grok content policies tighten.
- Total Vast.ai spend: ~$22-25 of $35 cap. Lessons captured in memory ([project_session_003_lora_pivot_outcome.md](/Users/joshuamcclure/.claude/projects/-Users-joshuamcclure-Desktop-living-eamon/memory/project_session_003_lora_pivot_outcome.md), [feedback_grok_drift_reduction.md](/Users/joshuamcclure/.claude/projects/-Users-joshuamcclure-Desktop-living-eamon/memory/feedback_grok_drift_reduction.md), [project_pony_nsfw_backup_pipeline.md](/Users/joshuamcclure/.claude/projects/-Users-joshuamcclure-Desktop-living-eamon/memory/project_pony_nsfw_backup_pipeline.md)).
- Repo cleanup: deleted Flux/character-LoRA/Illustrious scripts and outputs. Kept the Pony NSFW pipeline as dormant infrastructure under `scripts/lora/anatomy-test-pony*.py` + `public/art/lora/anatomy-test/`.

## 12 · Open questions for the next active phase

- **Character-LoRA spike resolved (2026-04-27, ABANDONED).** Original §13 question is moot — no model met the painterly+character+weapon trifecta. Identity drift on Grok Imagine Pro is mitigated via the four prompt-discipline tactics in [memory: feedback_grok_drift_reduction.md](/Users/joshuamcclure/.claude/projects/-Users-joshuamcclure-Desktop-living-eamon/memory/feedback_grok_drift_reduction.md), not via per-character LoRAs. The headless-body + composited-head plan in §6 is the canonical V2 architecture.
- **When the artist delivers** the first batch of headless bodies + heads, write the migration (`wardrobe_bodies` + `hero_heads`) and the upload-from-disk script that ingests them into Supabase storage + DB.
- **Wire the runtime route.** [/api/hero-equipment-sprite](../../app/api/hero-equipment-sprite/route.ts) needs to look up `(stance, equipment, weapon-carry)` in `wardrobe_bodies` and `(slug)` in `hero_heads`, then composite via `sharp` (or pre-composite at deploy time and cache). Today: defer until artist delivers.
- **Combat stance.** 40 more body combos when we get there. Defer until the new combat UI lands.
- **Per-item gear (V3 roadmap, §7).** Plan when V2 system is in production and the team is ready for the next granularity step.

---

## 13 · Character-LoRA spike — HISTORICAL (abandoned 2026-04-27)

**Outcome:** Spike abandoned after testing four platforms across two sessions.

**The path:** Scenario.gg → Civitai → Vast.ai self-hosted (Flux Dev + PuLID, then Pony Realism v23, then Illustrious XL).

**The verdict:**
- **Scenario.gg** abandoned 2026-04-26 — Pro plan capped at 25 training images (we needed 50), then API auth lockout, then Scotch deleted the account.
- **Civitai** considered 2026-04-26 — rejected for "doesn't allow the freedom I want."
- **Flux Dev + PuLID** (Vast.ai self-hosted) — face identity via PuLID worked, but Flux **fundamentally doesn't understand objects**: weapons hallucinate (two-headed axes, scythe-spears, weapons floating not gripped). Independently confirmed by another Claude agent.
- **Pony Realism v23** — better grip mechanics (NSFW training transfer) but female-biased without explicit `1boy/1man` tags AND weapons still in "WTF territory" even with weapon-position language.
- **Illustrious XL v0.1** — too anime-coded for Frazetta/Vallejo aesthetic.

**Strategic resolution:** Grok Imagine Pro for everything; human artist polishes the player character before sprite ships. The headless-body + composited-head architecture in §6 absorbs that polished output.

**Lessons preserved in memory** (read these before reconsidering):
- [project_session_003_lora_pivot_outcome.md](/Users/joshuamcclure/.claude/projects/-Users-joshuamcclure-Desktop-living-eamon/memory/project_session_003_lora_pivot_outcome.md) — full post-mortem
- [feedback_grok_drift_reduction.md](/Users/joshuamcclure/.claude/projects/-Users-joshuamcclure-Desktop-living-eamon/memory/feedback_grok_drift_reduction.md) — the 4 tactics that mitigate Grok identity drift without infrastructure
- [project_pony_nsfw_backup_pipeline.md](/Users/joshuamcclure/.claude/projects/-Users-joshuamcclure-Desktop-living-eamon/memory/project_pony_nsfw_backup_pipeline.md) — Pony NSFW path preserved as dormant backup

**Total spike cost:** ~$22-25 of a $35 Vast.ai cap. Within budget. Lesson learned.

**What survives in the repo (from this spike, intentionally kept):**
- `SESSION_001_VAST_R2_SETUP.md` — Vast bootstrap doc, useful if Pony NSFW backup is ever activated
- `scripts/lora/anatomy-test-pony.py` + `anatomy-test-pony-painterly.py` — validated Pony NSFW templates
- `scripts/lora/sync-from-r2.sh` + `sync-to-r2.sh` — R2 helpers
- `public/art/lora/anatomy-test/pony/` + `pony-painterly/` + `anatomy-test-qa.html` — Pony NSFW validation evidence
- `.env.infrastructure` (gitignored) — working Vast/R2/HF credentials

**What was deleted:**
- All Flux + character-LoRA + Illustrious scripts and outputs (dead end)
- `SESSION_002_LORA_TRAINING.md` (LoRA training playbook, no longer relevant)

Don't revive any of this without re-checking the lessons-learned memory entries first.
