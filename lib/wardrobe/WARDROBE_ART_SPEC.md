# Living Eamon — Wardrobe Art Spec

**Audience:** the outside Photoshop artist (or whoever is briefing them) plus any future Claude session reading this as the canonical deliverable contract.

**Status:** §1 Casual stance is the V2 pilot deliverable, ready to start. §2 Combat stance is reserved for a later pass; do not attempt to brief or deliver combat-stance art against this document until the spec section is filled in.

---

## 0 · Architecture in one paragraph

Every hero sprite in the running game is composited at render time from **two PNGs**: a **headless body** (cut off above the shoulders, hero-agnostic — the same body PNG is used for every hero) plus a **head crop** (per-hero, cut from that hero's master image). The artist's job is to produce both halves of that pair from inputs we already have on disk. The composite happens later, in code; the artist does not stack head-over-body, only delivers the parts.

There is exactly one cut line, called the **chin-line cut**, that determines where each pair meets. The body PNG ends at the chin-line (everything above is fully transparent). The head PNG ends at the chin-line (everything below is fully transparent). When the runtime stacks them, the seam is invisible because both halves were cut from the same Y coordinate against the same canvas size.

Hair that would extend below the chin-line cannot exist in the head asset; it would either get clipped or fight with the body's shoulder/neck region. The hero library has been pre-filtered so every surviving hero has either short hair or is bald — the artist does not need to make any judgment calls about hair length.

---

## 1 · Casual stance — V2 pilot deliverable

### 1.1 What the artist receives (inputs)

**A. 40 head-attached body PNGs** at `public/art/wardrobe/gaius/`, named `{equipment}_{weapon-carry}_casual.png`. These are renderings of the Gaius template hero in every casual-stance combination of:

- **Equipment (5):** `loincloth`, `gray_robe`, `common_clothes`, `leather_armor`, `chain_mail`
- **Weapon-carry (8):** `unarmed`, `hip_short_blade`, `hip_long_blade`, `hip_haft_mace`, `hip_haft_axe`, `back_two_hander`, `staff_bow`, `polearm`

Every combination → 40 input files. All have Gaius's head attached.

**B. 10 hero master PNGs** at `public/art/heroes/`, named `{slug}.png`. One per hero in the active library:

| slug | hair | facial hair |
|--|--|--|
| `gaius` | short brown | stubble |
| `dural` | bald | beard |
| `selek` | bald | clean-shaven |
| `halvar` | short white | stubble |
| `marik` | bald | beard |
| `talon` | bald | clean-shaven |
| `rurik` | short blond | clean-shaven |
| `hollan` | short brown | clean-shaven |
| `lev` | bald | stubble |
| `seward` | short red | stubble |

### 1.2 What the artist delivers (outputs)

**A. 40 headless body PNGs** — one per input from §1.1.A. Same image as the input, with Gaius's head/neck cleanly removed above the chin-line. Hero-agnostic: there is no hero identity in these files; they will be paired with any of the 10 hero heads at render time.

Output naming pattern (fixed dimension order: stance, equipment, weapon-carry):

```
body_{stance}_{equipment}_{weapon-carry}.png
```

For the casual stance pilot, all 40 filenames are:

```
body_casual_loincloth_unarmed.png
body_casual_loincloth_hip_short_blade.png
body_casual_loincloth_hip_long_blade.png
body_casual_loincloth_hip_haft_mace.png
body_casual_loincloth_hip_haft_axe.png
body_casual_loincloth_back_two_hander.png
body_casual_loincloth_staff_bow.png
body_casual_loincloth_polearm.png
body_casual_gray_robe_unarmed.png
body_casual_gray_robe_hip_short_blade.png
body_casual_gray_robe_hip_long_blade.png
body_casual_gray_robe_hip_haft_mace.png
body_casual_gray_robe_hip_haft_axe.png
body_casual_gray_robe_back_two_hander.png
body_casual_gray_robe_staff_bow.png
body_casual_gray_robe_polearm.png
body_casual_common_clothes_unarmed.png
body_casual_common_clothes_hip_short_blade.png
body_casual_common_clothes_hip_long_blade.png
body_casual_common_clothes_hip_haft_mace.png
body_casual_common_clothes_hip_haft_axe.png
body_casual_common_clothes_back_two_hander.png
body_casual_common_clothes_staff_bow.png
body_casual_common_clothes_polearm.png
body_casual_leather_armor_unarmed.png
body_casual_leather_armor_hip_short_blade.png
body_casual_leather_armor_hip_long_blade.png
body_casual_leather_armor_hip_haft_mace.png
body_casual_leather_armor_hip_haft_axe.png
body_casual_leather_armor_back_two_hander.png
body_casual_leather_armor_staff_bow.png
body_casual_leather_armor_polearm.png
body_casual_chain_mail_unarmed.png
body_casual_chain_mail_hip_short_blade.png
body_casual_chain_mail_hip_long_blade.png
body_casual_chain_mail_hip_haft_mace.png
body_casual_chain_mail_hip_haft_axe.png
body_casual_chain_mail_back_two_hander.png
body_casual_chain_mail_staff_bow.png
body_casual_chain_mail_polearm.png
```

Map between input filename and output filename (consistent rule for all 40):

```
input:  {equipment}_{weapon-carry}_casual.png
output: body_casual_{equipment}_{weapon-carry}.png
```

Output folder for the deliverable: `public/wardrobe-bodies/`.

**B. 10 head PNGs** — one per hero in §1.1.B. Cut from the hero's master image at the same chin-line so it lines up with any body PNG.

Output naming pattern:

```
head_{slug}.png
```

For the V2 pilot, all 10 filenames are:

```
head_gaius.png
head_dural.png
head_selek.png
head_halvar.png
head_marik.png
head_talon.png
head_rurik.png
head_hollan.png
head_lev.png
head_seward.png
```

Output folder: `public/wardrobe-heads/`.

### 1.3 The chin-line cut

The cut line passes horizontally across the figure just below the jaw — high enough that the whole jawline and the underside of the chin remain attached to the head, low enough that none of the neck remains attached to the body. Specifically:

- **Above the cut belongs to the head asset.** The full jawline, the entire neck, ears, the base of the skull. If the figure has any beard or stubble, the lower edge of the beard goes with the head (do not split a beard across the cut).
- **Below the cut belongs to the body asset.** The collarbones, shoulders, the trapezius, everything from the shoulders down. The shoulder line on the body PNG must read clean — no hair, no neck stub, no beard tip protruding from the top edge.
- **The cut Y coordinate must be identical between the body and head halves of every pair** *for the same source image*. The runtime relies on body[chin_y] == head[chin_y] so the seam disappears. If a head's chinY is 1840px on the canonical canvas, the matching body's transparency must start at 1840px exactly.

The cut is made by hand; pixel-perfect alignment via straight horizontal line is the goal, but the artist's judgment for the edge — feathering by 1–2 px to avoid hard aliasing — is welcome.

### 1.4 Technical requirements

- **Canvas size:** 1776 × 2528 px (3:4 aspect ratio at xAI's 2k output). Inputs are already at this size; outputs must preserve it. Do not crop or resize.
- **Format:** transparent PNG (RGBA). The transparent regions where the cut occurred must have alpha 0 (not white, not near-white).
- **Background:** outside the figure silhouette, the alpha is already 0 in the inputs (rembg was applied). Don't reintroduce any background.
- **Color space:** sRGB. Do not convert to a wide-gamut space.
- **No retouching of the figure** beyond the head/neck cut. Equipment, weapons, body proportions, lighting, and skin tone must be preserved exactly. The artist's job is mechanical separation, not artistic improvement.
- **No overlap.** If you sum the alpha channels of body + head pixel-by-pixel, no pixel should reach >255. Where one asset has opacity, the other must be transparent.

### 1.5 QA + acceptance

The dev team will composite each `(body, head)` pair with `sharp` (or a similar library) and compare the result visually to the original head-attached input. Acceptance criteria:

- Composite is visually indistinguishable from the original input at the seam.
- No visible halo, color shift, or geometric mismatch at the chin-line.
- Body PNG can be paired with any of the 10 head PNGs and produces a coherent result (no obvious head-too-big, head-too-small, head-floating).
- All 40 + 10 = 50 PNGs land at the correct paths with the correct names.

A round-trip QA tool (similar to the existing [public/art/wardrobe/gaius/qa.html](../../public/art/wardrobe/gaius/qa.html)) will be set up to let the dev team eyeball each composite. If a sprite fails QA, the artist re-cuts from scratch — adjusting the cut Y, re-feathering, re-sampling — rather than touching up the failed render.

---

## 2 · Combat stance — DEFERRED

The combat stance is a planned second pass that adds a parallel matrix:

- **Stance:** `combat`
- **Equipment (5):** same five as casual
- **Weapon-carry (8):** same eight as casual
- **Total:** 5 × 8 × 1 = 40 additional body PNGs

Combat stance art has not been forged yet, so there are no input PNGs for the artist to cut. When the combat-stance forge run lands, this section will be filled in with:

- The list of input filenames at `public/art/wardrobe/gaius/{equipment}_{weapon-carry}_combat.png`
- The list of output filenames at `public/wardrobe-bodies/body_combat_{equipment}_{weapon-carry}.png`
- Any combat-specific cut rules (the pose may shift the chin-line Y by a few pixels)
- A note on whether the existing 10 head PNGs from §1 can be re-used or whether the combat pose requires fresh head crops (likely the same 10 work, since heads are neutral)

Until this section is written, **do not deliver combat-stance art against this spec.** The naming pattern alone is not a sufficient brief.

---

## 3 · Forward-compatibility for new dimensions

V2 has three dimensions: stance, equipment, weapon-carry. Future iterations may add cloak, sash, jewelry, hairstyle-on-head, body-state overlays (scars, brands, eye patches), etc. When that happens:

1. The dev team adds a column to the relevant DB table.
2. The new dimension is appended to the filename in a fixed canonical position (stance → equipment → weapon-carry → `<new dimension>` → ...). Existing files keep their names.
3. Files without the new dimension are interpreted as `<new dimension> = none` at lookup time — no retroactive renames, ever.
4. The artist's spec sheet (this document) gets a new section for the new dimension's deliverable matrix.

This rule is non-negotiable: filenames in storage must be additive, never rewritten. Anything else risks cache bust and ingest churn.

---

## 4 · Long-term direction (context only — not this pass's work)

V2 ships at **carry-category** granularity: a `short_sword` and a `dagger` and a `kryss` all render against the same `body_casual_*_hip_short_blade.png` sprite, because at the silhouette of "sheathed blade at the hip" they're indistinguishable. The runtime maps the actual game-item id to the carry category before looking up the body PNG.

The eventual game design (V3+) calls for **per-item interchangeable gear** — every weapon, ring, cloak, helm gets its own art that fits onto a fully templated body. That's a much larger artist deliverable and a different spec. When V3 lands, this document gets a sister doc for the per-item brief; the carry-category art from V2 stays as a visual fallback for items that don't yet have bespoke art.

The artist's V2 deliverable is forward-compatible with V3: the same headless-body + head-crop architecture supports per-item bodies; only the dimensional values change.
