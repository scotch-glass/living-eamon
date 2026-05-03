#!/usr/bin/env python3
"""
Vivian LoRA inference batch — 165 poses on Pony Realism v23.

Categories (totals):
  EXPLICIT (25)             — nude / sex / suggestive
  CLOTHED CASUAL (25)       — leather thief outfit, common attire
  JOKES (3)                 — laughing / mid-quip
  NOBLE BALL (2)            — formal ballgown
  NOBLE WOMAN (5)           — court attire
  TORN DRESS UPSET (5)      — captured / aftermath
  SHADOW KINGDOM (20)       — Valusian court intrigue, serpent-cult
  MIRRORS OF TUZUN THUNE (15) — visions, alternate selves, trance
  KINGS OF THE NIGHT (15)   — Pictish wilderness, druidic ritual
  R-RATED SHEET-COVERED (20) — topless / partial sheet, only breasts exposed
  HOOD SNEAKING (30)        — thief sneaking with hood obscuring face

HARD CONSTRAINTS (locked across the whole batch):
  1. PURE WHITE BACKGROUND — every prompt ends with the WHITE_BG suffix and
     the negative prompt aggressively suppresses scenery / shadows / floors.
     This makes every output rembg-cuttable for game compositing.
  2. NO WEAPONS ANYWHERE — Pony Realism renders weapons poorly (extra fingers,
     bent blades, etc.). Sword / dagger / bow / arrow / staff / mace / axe
     are all in the negative prompt, and no positive prompt mentions any of
     them. Action poses that would normally include weapons (combat, fighting
     stance, sneaking-thief) use empty hands or non-weapon props (torch, coin,
     locket, sheet).

Runs on the Vast.ai box AFTER training completes. Sync output to R2 with:
  rclone copy /root/training/output/eros-batch-v1/ \\
      r2-living-eamon:living-eamon/eros-batches/vivian-v1/

Cost on RTX 4090: ~$0.18 for the full 165 (~36 min @ 28 steps).
"""

import argparse
from pathlib import Path

import torch
from diffusers import StableDiffusionXLPipeline

PONY_PATH = "/root/models/pony-realism-v23"
LORA_PATH = "/root/training/output/vivian-pony-v1/vivian-pony-v1.safetensors"
OUTPUT_DIR = Path("/root/training/output/eros-batch-v1")

NEGATIVE_PROMPT = (
    "score_4, score_5, score_6, low quality, worst quality, blurry, "
    "deformed, extra limbs, missing limbs, fused fingers, extra fingers, "
    "mutated hands, bad anatomy, bad proportions, watermark, text, signature, "
    "painterly, oil painting, anime, cartoon, cel shaded, 3d render, plastic, "
    "smooth airbrushed, source_anime, source_furry, source_cartoon, "
    "long hair down, hair down, loose hair, bangs, "
    # Aggressive scenery / background suppression — composites need white BG
    "scenery, indoor scene, walls, wall, furniture, floor, ground, ground line, "
    "tavern interior, library interior, ballroom interior, drawing room, "
    "marble floor, chandelier, fur rug, drapes, draped fabric, wallpaper, "
    "painting on wall, window, balcony, garden, outdoors, nature, "
    "shadow, floor shadow, cast shadow, wood floor, stone floor, stone wall, "
    "background detail, environmental detail, props, table, chair, bed, barrel, "
    "rug, carpet, throne, candelabra, fireplace, hearth, columns, pillars, "
    "trees, sky, clouds, grass, sunlight rays, dust motes, "
    # NO WEAPONS — Pony is bad with them
    "sword, dagger, knife, bow, longbow, arrow, mace, axe, hammer, staff, "
    "weapon, blade, hilt, pommel, scabbard, holster, holstered weapon, sheath, "
    "spear, polearm, halberd, club, throwing weapon, projectile, quiver, bowstring"
)

# Every prompt ends with this — locks the white backdrop hard.
WHITE_BG = (
    "white background, plain white backdrop, pure white background, "
    "no scenery, no shadow, no floor, simple background, studio shot"
)

PFX_EXP    = "score_9, score_8_up, score_7_up, source_realistic, rating_explicit, nsfw, vivian1, 1girl, solo, "
PFX_QUEST  = "score_9, score_8_up, score_7_up, source_realistic, rating_questionable, vivian1, 1girl, solo, "
PFX_SAFE   = "score_9, score_8_up, score_7_up, source_realistic, rating_safe, vivian1, 1girl, solo, "

PROMPTS = [
    # ────────────────────────────────────────────────────────────────
    # EXPLICIT (1-25) — nude / sex / suggestive
    # ────────────────────────────────────────────────────────────────
    (1, "standing-nude-front", PFX_EXP + f"nude, completely nude, bare breasts, small breasts, nipples, pussy, navel, standing, hands behind head, looking at viewer, three quarter view, soft window light, {WHITE_BG}"),
    (2, "kneeling-look-up-eye-contact", PFX_EXP + f"nude, bare breasts, nipples, kneeling, on knees, looking up, looking at viewer, eye contact, hands on thighs, parted lips, soft submissive expression, three quarter view, soft window light, {WHITE_BG}"),
    (3, "lying-back-legs-spread", PFX_EXP + f"nude, bare breasts, nipples, pussy, lying on back, on back, spread legs, looking at viewer, soft smile, soft directional lighting, {WHITE_BG}"),
    (4, "all-fours-from-behind-ass-spread", PFX_EXP + f"nude, on all fours, doggystyle, from behind, ass focus, spread ass, ass cheeks spread, looking back, looking at viewer, soft warm light, {WHITE_BG}"),
    (5, "lying-stomach-ass-up-look-back", PFX_EXP + f"nude, lying on stomach, ass focus, ass, looking back over shoulder, smirk, soft warm lighting, {WHITE_BG}"),
    (6, "bent-over-presenting", PFX_EXP + f"nude, bent over, presenting, ass focus, spread legs, pussy, looking back, looking at viewer, soft light, {WHITE_BG}"),
    (7, "back-knees-up-spread-pussy", PFX_EXP + f"nude, lying on back, knees up, spread legs, spread pussy, pussy, looking at viewer, parted lips, candlelight, {WHITE_BG}"),
    (8, "sitting-leaning-back-knees-apart", PFX_EXP + f"nude, bare breasts, nipples, pussy, sitting, leaning back, hands behind back, knees apart, spread legs, looking at viewer, slight smile, candlelight, {WHITE_BG}"),
    (9, "standing-profile-side-light", PFX_EXP + f"nude, bare breasts, small breasts, nipples, standing, profile view, from side, side boob, soft side lighting, {WHITE_BG}"),
    (10, "stretching-arched-back-breasts-up", PFX_EXP + f"nude, bare breasts, nipples, standing, arms up, both arms up, stretching, arched back, breasts up, looking at viewer, soft smile, warm light, {WHITE_BG}"),
    (11, "reclining-on-side-elbow-prop", PFX_EXP + f"nude, bare breasts, nipples, lying down, on side, reclining, head on hand, looking at viewer, slow smile, warm light, {WHITE_BG}"),
    (12, "back-knees-drawn-hand-between", PFX_EXP + f"nude, bare breasts, nipples, pussy, lying on back, knees drawn up, knees up, spread legs, hand between thighs, looking at viewer, parted lips, blush, candlelight, {WHITE_BG}"),
    (13, "kneeling-hands-back-chest-out", PFX_EXP + f"nude, bare breasts, nipples, kneeling, hands clasped behind back, arms behind back, chest out, looking at viewer, slight smile, soft window light, {WHITE_BG}"),
    (14, "standing-hand-on-own-breast", PFX_EXP + f"nude, bare breasts, nipples, standing, hand on own breast, touching self, half-closed eyes, parted lips, soft warm lighting, {WHITE_BG}"),
    (15, "back-fingers-spread-pussy", PFX_EXP + f"nude, bare breasts, nipples, pussy, lying on back, spread legs, fingers spreading pussy, spread pussy, looking at viewer, parted lips, blush, candlelight, {WHITE_BG}"),
    (16, "after-bath-walking-towel", PFX_EXP + f"nude, bare breasts, nipples, walking, just out of bath, wet hair high ponytail, water drops on skin, towel held to side, looking at viewer, soft smile, warm light, {WHITE_BG}"),
    (17, "partial-nude-vest-open-pants-on", PFX_EXP + f"partially nude, leather pants, open vest, vest open, breasts visible, bare breasts, nipples, sitting, leaning back, looking at viewer, slight smirk, soft warm lighting, {WHITE_BG}"),
    (18, "embraced-from-behind-suggestive", PFX_EXP + f"nude, bare breasts, nipples, hugged from behind, large unseen male hands on her breasts, eyes closed, parted lips, sensual, warm lighting, {WHITE_BG}"),
    (19, "straddle-cowgirl-implied", PFX_EXP + f"nude, bare breasts, nipples, sitting, straddle position, knees apart, hands on own thighs, looking down, parted lips, blush, warm light, {WHITE_BG}"),
    (20, "doggystyle-implied-look-back-blush", PFX_EXP + f"nude, on all fours, doggystyle, from behind, looking back over shoulder, parted lips, blush, soft warm light, {WHITE_BG}"),
    (21, "missionary-pov-from-above", PFX_EXP + f"nude, bare breasts, nipples, lying on back, looking up, parted lips, hands above head, missionary pose, breasts exposed, candlelight, {WHITE_BG}"),
    (22, "spread-eagle-relaxed-back", PFX_EXP + f"nude, bare breasts, nipples, pussy, lying on back, spread eagle, arms out, legs spread, relaxed, looking at viewer, soft smile, soft warm light, {WHITE_BG}"),
    (23, "kneeling-leaning-forward-look-up", PFX_EXP + f"nude, bare breasts, nipples, kneeling, leaning forward, looking up, looking at viewer, eye contact, mouth slightly open, parted lips, soft light, {WHITE_BG}"),
    (24, "knees-to-chest-presenting", PFX_EXP + f"nude, bare breasts, nipples, pussy, lying on back, legs up, knees to chest, spread legs, spread pussy, presenting, looking at viewer, blush, candlelight, {WHITE_BG}"),
    (25, "standing-back-look-shoulder-ass", PFX_EXP + f"nude, standing, from behind, ass focus, ass, back focus, looking back, looking at viewer, slight smile, soft window light, {WHITE_BG}"),

    # ────────────────────────────────────────────────────────────────
    # CLOTHED CASUAL (26-50) — leather thief outfit + common attire
    # NO weapons — leather belt with pouches only.
    # ────────────────────────────────────────────────────────────────
    (26, "leather-thief-hand-on-hip", PFX_SAFE + f"leather vest, leather pants, leather belt with pouches, standing, hand on hip, both hands on hips, looking at viewer, slight smile, soft window light, {WHITE_BG}"),
    (27, "leather-walking-look-back", PFX_SAFE + f"leather vest, leather pants, leather belt with pouches, walking, mid-stride, looking back, soft light, {WHITE_BG}"),
    (28, "leather-sitting-leg-swing", PFX_SAFE + f"leather vest, leather pants, sitting, dangling legs, looking at viewer, smile, soft warm light, {WHITE_BG}"),
    (29, "leather-leaning-back-ankles-crossed", PFX_SAFE + f"leather vest, leather pants, leaning back, ankles crossed, crossed legs, looking at viewer, smirk, soft light, {WHITE_BG}"),
    (30, "leather-eating-apple", PFX_SAFE + f"leather vest, leather pants, holding fruit, holding apple, eating, looking at viewer, slight smile, soft light, {WHITE_BG}"),
    (31, "leather-reaching-forward-alert", PFX_SAFE + f"leather vest, leather pants, leaning forward, both hands raised in defensive posture, alert eyes, parted lips, soft warm light, {WHITE_BG}"),
    (32, "leather-climbing-rope", PFX_SAFE + f"leather vest, leather pants, climbing rope, both arms up, looking up, parted lips, soft light, {WHITE_BG}"),
    (33, "leather-peeking-shh", PFX_SAFE + f"leather vest, leather pants, peeking, leaning forward, finger to mouth, shushing, smile, soft warm light, {WHITE_BG}"),
    (34, "leather-picking-lock", PFX_SAFE + f"leather vest, leather pants, kneeling, on one knee, hands working at chest level, focused, looking at hands, parted lips, candlelight, {WHITE_BG}"),
    (35, "leather-counting-coins", PFX_SAFE + f"leather vest, leather pants, standing, holding coin, counting, looking down, slight smile, soft light, {WHITE_BG}"),
    (36, "leather-sitting-crosslegged-chin", PFX_SAFE + f"leather vest, leather pants, sitting, indian style, hand on chin, looking at viewer, slight smile, soft light, {WHITE_BG}"),
    (37, "leather-hands-hips-look-back", PFX_SAFE + f"leather vest, leather pants, standing, both hands on hips, looking back, smirk, soft light, {WHITE_BG}"),
    (38, "leather-stretching-arched", PFX_SAFE + f"leather vest, leather pants, standing, both arms up, stretching, arched back, closed eyes, slight smile, soft warm light, {WHITE_BG}"),
    (39, "leather-examining-gem", PFX_SAFE + f"leather vest, leather pants, holding gem, looking at object, raised eyebrow, parted lips, candlelight, {WHITE_BG}"),
    (40, "leather-hand-on-locket", PFX_SAFE + f"leather vest, leather pants, hand at neck, jewelry, locket, looking at viewer, slight smile, warm light, {WHITE_BG}"),
    (41, "leather-tossing-coin", PFX_SAFE + f"leather vest, leather pants, throwing, holding coin, hand up, looking up, slight smile, soft light, {WHITE_BG}"),
    (42, "leather-arms-crossed-judging", PFX_SAFE + f"leather vest, leather pants, standing, crossed arms, smirk, looking at viewer, soft light, {WHITE_BG}"),
    (43, "leather-finger-to-lips", PFX_SAFE + f"leather vest, leather pants, finger to mouth, shushing, conspiratorial smile, looking at viewer, soft light, {WHITE_BG}"),
    (44, "leather-sitting-knees-elbows", PFX_SAFE + f"leather vest, leather pants, sitting, knees together, leaning forward, elbows on knees, looking at viewer, slight smile, soft light, {WHITE_BG}"),
    (45, "common-clothes-tankard", PFX_SAFE + f"plain shirt, simple skirt, sitting, holding tankard, holding cup, looking at viewer, smile, warm light, {WHITE_BG}"),
    (46, "nightgown-just-woke-up", PFX_SAFE + f"nightgown, just woke up, rubbing eye, half-closed eyes, soft warm light, {WHITE_BG}"),
    (47, "silk-dress-formal", PFX_SAFE + f"silk dress, formal dress, elegant pose, hand on hip, looking at viewer, slight smile, soft directional lighting, {WHITE_BG}"),
    (48, "cloak-hood-up-mysterious", PFX_SAFE + f"cloak, hood up, hood, mysterious, looking at viewer, half shadowed face, candlelight, {WHITE_BG}"),
    (49, "dancer-mid-dance", PFX_SAFE + f"dancer outfit, dancing, twirling, motion lines, smile, looking at viewer, soft light, {WHITE_BG}"),
    (50, "bath-robe-after-bath", PFX_SAFE + f"bath robe, robe, wet hair, after bath, leaning back, soft smile, looking at viewer, soft warm light, {WHITE_BG}"),

    # ────────────────────────────────────────────────────────────────
    # JOKES (51-53) — mid-laugh / mid-quip
    # ────────────────────────────────────────────────────────────────
    (51, "joke-laughing-head-back", PFX_SAFE + f"leather vest, leather pants, leather belt with pouches, standing, laughing, open mouth, teeth visible, eyes closed, head tilted back, hand on stomach, mid-laugh, soft warm light, {WHITE_BG}"),
    (52, "joke-grin-at-viewer", PFX_SAFE + f"leather vest, leather pants, standing, big grin, teeth visible, smiling, looking at viewer, eyebrow raised, hand gesture, mid-quip, amused, soft warm light, {WHITE_BG}"),
    (53, "joke-leaning-laugh", PFX_SAFE + f"leather vest, leather pants, leaning forward, laughing, open mouth, eyes crinkled, looking down, mid-joke, soft warm light, {WHITE_BG}"),

    # ────────────────────────────────────────────────────────────────
    # FORMAL NOBLE BALL (54-55)
    # ────────────────────────────────────────────────────────────────
    (54, "ball-gown-wine-glass", PFX_SAFE + f"silk ball gown, evening gown, formal dress, elegant, standing, holding wine glass, slight smile, looking at viewer, soft warm directional lighting, {WHITE_BG}"),
    (55, "ball-gown-mid-curtsy", PFX_SAFE + f"silk ball gown, formal dress, mid-curtsy, holding skirts, head tilted down, looking up at viewer, slight smile, soft warm directional lighting, {WHITE_BG}"),

    # ────────────────────────────────────────────────────────────────
    # NOBLE WOMAN ATTIRE (56-60)
    # ────────────────────────────────────────────────────────────────
    (56, "noble-silk-portrait", PFX_SAFE + f"silk dress, embroidered dress, noblewoman, elegant attire, standing, hand on hip, looking at viewer, neutral elegant smile, soft directional lighting, {WHITE_BG}"),
    (57, "noble-fur-trimmed-sitting", PFX_SAFE + f"fur-trimmed robe, brocade dress, noblewoman, court dress, sitting, looking at viewer, hand on lap, slight smile, candlelight, {WHITE_BG}"),
    (58, "noble-silk-gown-walking", PFX_SAFE + f"silk gown, light dress, noblewoman, walking, holding skirts, looking at viewer, gentle smile, warm light, {WHITE_BG}"),
    (59, "noble-velvet-reading", PFX_SAFE + f"velvet dress, court dress, noblewoman, sitting, holding book, reading, looking down, slight smile, candlelight, {WHITE_BG}"),
    (60, "noble-embroidered-profile", PFX_SAFE + f"silk gown, embroidered bodice, noblewoman, standing, hand on hip, profile view, looking out, soft warm light, {WHITE_BG}"),

    # ────────────────────────────────────────────────────────────────
    # TORN DRESS / UPSET (61-65)
    # ────────────────────────────────────────────────────────────────
    (61, "torn-dress-tearful-defiant", PFX_SAFE + f"silk gown, torn clothes, ripped clothes, ragged dress, tears in eyes, tearful, scared, defiant expression, parted lips, dim cold light, {WHITE_BG}"),
    (62, "torn-dress-hugged-knees", PFX_SAFE + f"silk gown, torn clothes, ripped clothes, sitting, hugging legs, knees up, hugging knees, head down, sad, crying, distress, dim light, {WHITE_BG}"),
    (63, "torn-dress-defiant-angry", PFX_SAFE + f"silk gown, torn clothes, ripped clothes, standing, defiant expression, angry, glaring at viewer, clenched fists, dim cold light, {WHITE_BG}"),
    (64, "torn-dress-walking-tears", PFX_SAFE + f"silk gown, torn clothes, ripped clothes, walking, mid-stride, tears, tearful eyes, scared expression, parted lips, dim light, {WHITE_BG}"),
    (65, "torn-dress-fleeing", PFX_SAFE + f"silk gown, torn clothes, ripped clothes, looking back over shoulder, frightened expression, scared, parted lips, fleeing, dim light, {WHITE_BG}"),

    # ────────────────────────────────────────────────────────────────
    # THE SHADOW KINGDOM (66-85) — Valusian court intrigue, serpent-cult
    # NO weapons — replaced with hands, gestures, props.
    # ────────────────────────────────────────────────────────────────
    (66, "shadow-watching-from-shadows", PFX_SAFE + f"valusian noble dress, dark blue silk dress, hood drawn forward, watching, suspicious gaze, looking at viewer, parted lips, candlelight, {WHITE_BG}"),
    (67, "shadow-cult-priestess-ritual", PFX_SAFE + f"dark hooded robe, both arms raised in ritual pose, palms up, looking up, fierce ritual expression, parted lips, candlelight, {WHITE_BG}"),
    (68, "shadow-spy-listening", PFX_SAFE + f"valusian court dress, embroidered, ear pressed forward, leaning forward, focused, hand up, candlelight, {WHITE_BG}"),
    (69, "shadow-fleeing-palace", PFX_SAFE + f"valusian noble dress, ripped sleeve, running, mid-stride, looking back over shoulder, scared, parted lips, dim light, {WHITE_BG}"),
    (70, "shadow-bloody-hands-grim", PFX_SAFE + f"valusian noble dress, hands stained with blood, looking down at her own hands, calm grim expression, parted lips, dim cold light, {WHITE_BG}"),
    (71, "shadow-whispering-to-ally", PFX_SAFE + f"valusian noble dress, hand cupped to mouth, leaning forward, conspiratorial expression, candlelight, {WHITE_BG}"),
    (72, "shadow-reading-scroll", PFX_SAFE + f"valusian noble dress, holding scroll, unrolled parchment, reading, looking down, candlelight, {WHITE_BG}"),
    (73, "shadow-court-conversation-clever", PFX_SAFE + f"valusian court dress, embroidered bodice, mid-conversation, clever smile, looking at viewer, raised eyebrow, candlelight, {WHITE_BG}"),
    (74, "shadow-reaching-into-sleeve", PFX_SAFE + f"valusian noble dress, hand reaching into hidden sleeve pocket, sudden alarm, fierce expression, parted lips, candlelight, {WHITE_BG}"),
    (75, "shadow-disguised-mask", PFX_SAFE + f"valusian noble dress, holding ceremonial mask, tense expression, alert, looking at viewer, candlelight, {WHITE_BG}"),
    (76, "shadow-speaking-exposure-phrase", PFX_SAFE + f"valusian noble dress, mouth open mid-syllable, eyes locked on viewer, accusing expression, finger pointing, candlelight, {WHITE_BG}"),
    (77, "shadow-throwing-coin-toss", PFX_SAFE + f"valusian noble dress, throwing motion, arm extended, mid-throw, fierce focus, parted lips, candlelight, {WHITE_BG}"),
    (78, "shadow-bound-defiant", PFX_SAFE + f"valusian noble dress, hands tied behind back, ropes, defiant glare, head held high, looking at viewer, dim light, {WHITE_BG}"),
    (79, "shadow-crouched-alert", PFX_SAFE + f"valusian noble dress, crouching, hiding pose, hands open and ready, alert eyes, scared, candlelight, {WHITE_BG}"),
    (80, "shadow-fighting-stance-fists", PFX_SAFE + f"valusian noble dress, fighting stance, fists raised, fierce expression, looking at viewer, candlelight, {WHITE_BG}"),
    (81, "shadow-serpent-tattoo-revealed", PFX_SAFE + f"sleeveless valusian dress, torn sleeve, serpent tattoo on shoulder, accusing finger pointing, fierce expression, candlelight, {WHITE_BG}"),
    (82, "shadow-deep-curtsy-cunning", PFX_SAFE + f"valusian noble dress, deep curtsy, holding skirts, looking up at viewer through eyelashes, cunning smile, candlelight, {WHITE_BG}"),
    (83, "shadow-poisoned-cup-debating", PFX_SAFE + f"valusian noble dress, holding goblet, looking at cup suspiciously, raised eyebrow, candlelight, {WHITE_BG}"),
    (84, "shadow-bloody-hands-kneeling", PFX_SAFE + f"valusian noble dress, kneeling, hands stained with blood, looking down, grim expression, dim light, {WHITE_BG}"),
    (85, "shadow-recovering-from-wound", PFX_SAFE + f"valusian noble dress, hand on side, blood on dress, slight wince, leaning slightly, looking at viewer, dim light, {WHITE_BG}"),

    # ────────────────────────────────────────────────────────────────
    # THE MIRRORS OF TUZUN THUNE (86-100) — visions, alternate selves
    # NO weapons — staff replaced with bare hands.
    # ────────────────────────────────────────────────────────────────
    (86, "mirrors-vision-glowing-eyes", PFX_SAFE + f"silk robe, eyes glowing faintly, transfixed expression, parted lips, magical aura, mystical lighting, {WHITE_BG}"),
    (87, "mirrors-translucent-ghostly", PFX_SAFE + f"silk robe, semi-transparent, fading, ghostly effect, looking at viewer, ethereal expression, mystical lighting, {WHITE_BG}"),
    (88, "mirrors-reaching-disbelief", PFX_SAFE + f"silk robe, both hands reaching forward, eyes wide, disbelief, parted lips, mystical lighting, {WHITE_BG}"),
    (89, "mirrors-stepping-back-shock", PFX_SAFE + f"silk robe, stepping back, hand on chest, shocked expression, parted lips, mystical lighting, {WHITE_BG}"),
    (90, "mirrors-aged-version", PFX_SAFE + f"silk robe, gray streak in ponytail, faint wrinkles around eyes, same locket, knowing sad smile, soft warm lighting, {WHITE_BG}"),
    (91, "mirrors-younger-version", PFX_SAFE + f"simple shift, very young, same green eyes, same locket, looking up, innocent expression, soft warm lighting, {WHITE_BG}"),
    (92, "mirrors-head-in-hands", PFX_SAFE + f"silk robe, sitting, head in hands, overwhelmed, hair disheveled but ponytail intact, dim mystical light, {WHITE_BG}"),
    (93, "mirrors-magical-aura-transcendent", PFX_SAFE + f"silk robe, glowing aura, hair lifting slightly, transcendent expression, eyes closed, mystical light, {WHITE_BG}"),
    (94, "mirrors-floating", PFX_SAFE + f"silk robe, floating, feet not touching ground, hair flowing, magical effect, eyes closed, mystical lighting, {WHITE_BG}"),
    (95, "mirrors-multiple-ghost-selves", PFX_SAFE + f"silk robe, multiple translucent copies of herself behind her, alternate selves, mysterious, mystical lighting, {WHITE_BG}"),
    (96, "mirrors-hand-to-face-recognition", PFX_SAFE + f"silk robe, hand on her own cheek, looking at viewer, recognition disbelief, parted lips, soft mystical lighting, {WHITE_BG}"),
    (97, "mirrors-alternate-royal", PFX_SAFE + f"royal robes, golden crown, regal pose, looking at viewer, queenly smile, candlelight, {WHITE_BG}"),
    (98, "mirrors-alternate-peasant", PFX_SAFE + f"peasant rags, simple shift, dirty face, humble pose, looking at viewer, sad smile, dim light, {WHITE_BG}"),
    (99, "mirrors-falling-backward-vision", PFX_SAFE + f"silk robe, falling backward, hand to forehead, eyes rolled back, hair flowing, mystical light, {WHITE_BG}"),
    (100, "mirrors-touching-invisible-surface", PFX_SAFE + f"silk robe, palm pressed flat against unseen surface, looking at her own hand, awe, parted lips, mystical lighting, {WHITE_BG}"),

    # ────────────────────────────────────────────────────────────────
    # KINGS OF THE NIGHT (101-115) — Pictish wilderness, druidic ritual
    # NO weapons — sword/bow/staff replaced with empty hands & gestures.
    # ────────────────────────────────────────────────────────────────
    (101, "kings-pictish-war-paint", PFX_SAFE + f"leather armor, blue war paint on face, wild expression, fierce eyes, looking at viewer, dim cold light, {WHITE_BG}"),
    (102, "kings-druidess-arms-raised", PFX_SAFE + f"druidess robes, antler headdress, both arms raised, eyes closed, ritual chanting, mystical light, {WHITE_BG}"),
    (103, "kings-druidess-palms-out", PFX_SAFE + f"druidess robes, antler headdress, both arms forward, palms out, mystical pose, parted lips, mystical lighting, {WHITE_BG}"),
    (104, "kings-mid-incantation-glow", PFX_SAFE + f"druidess robes, both arms up, magical glow around her, eyes closed, chanting expression, mystical light, {WHITE_BG}"),
    (105, "kings-bloodied-after-battle-empty-hands", PFX_SAFE + f"leather armor, blood on face, empty hands hanging at sides, tired but alive expression, looking at viewer, dim battlefield light, {WHITE_BG}"),
    (106, "kings-victor-looking-down", PFX_SAFE + f"leather armor, hands at sides, looking down at unseen fallen foe, grim victorious expression, parted lips, dim light, {WHITE_BG}"),
    (107, "kings-on-horseback", PFX_SAFE + f"leather armor, riding horse, holding reins, looking forward, determined expression, dim light, {WHITE_BG}"),
    (108, "kings-carrying-wounded-ally", PFX_SAFE + f"leather armor, supporting unseen wounded ally with one arm around, struggling, exertion, parted lips, dim light, {WHITE_BG}"),
    (109, "kings-tracking-on-knees", PFX_SAFE + f"leather armor, on hands and knees, examining ground, focused expression, looking down, dim light, {WHITE_BG}"),
    (110, "kings-crouched-alert-scout", PFX_SAFE + f"leather armor, crouching low, hand on the ground, alert scanning eyes, parted lips, dim light, {WHITE_BG}"),
    (111, "kings-chanting-circle-arms-out", PFX_SAFE + f"druidess robes, both arms out, eyes closed, chanting expression, mystical pose, mystical light, {WHITE_BG}"),
    (112, "kings-furs-pictish-proud", PFX_SAFE + f"pictish furs, leather armor over furs, proud stance, hands on hips, looking at viewer, fierce expression, dim cold light, {WHITE_BG}"),
    (113, "kings-burning-torch", PFX_SAFE + f"leather armor, holding burning torch high, peering forward, alert expression, parted lips, torchlight, {WHITE_BG}"),
    (114, "kings-calling-vision", PFX_SAFE + f"druidess robes, hand outstretched, magical effect, calling forth, eyes glowing faint, mystical light, {WHITE_BG}"),
    (115, "kings-final-stand-fists-overhead", PFX_SAFE + f"leather armor, fists raised overhead, fierce battle cry, mouth open shouting, fighting stance, dim battlefield light, {WHITE_BG}"),

    # ────────────────────────────────────────────────────────────────
    # R-RATED SHEET-COVERED (116-135) — only breasts exposed, partial sheet
    # ────────────────────────────────────────────────────────────────
    (116, "sheet-lying-back-breasts", PFX_QUEST + f"topless, bare breasts, nipples, lying on back, sheet covering hips and legs, sheet pulled to waist, looking at viewer, slight smile, parted lips, soft warm light, {WHITE_BG}"),
    (117, "sheet-on-side-elbow", PFX_QUEST + f"topless, bare breasts, nipples, lying on side, sheet covering hips and legs, head propped on hand, looking at viewer, soft smile, candlelight, {WHITE_BG}"),
    (118, "sheet-sitting-up-bunched-waist", PFX_QUEST + f"topless, bare breasts, nipples, sitting up, sheet bunched at waist, sheet pooled around hips, hand brushing hair back, looking at viewer, slight smile, candlelight, {WHITE_BG}"),
    (119, "sheet-stretching-arms-up", PFX_QUEST + f"topless, bare breasts, nipples, sitting, sheet at waist, both arms raised overhead, stretching, eyes closed, content smile, soft warm light, {WHITE_BG}"),
    (120, "sheet-coy-hair-aside", PFX_QUEST + f"topless, bare breasts, nipples, sitting, sheet at hips, pulling hair to one side, ponytail forward, looking at viewer, coy smile, candlelight, {WHITE_BG}"),
    (121, "sheet-stomach-back-arched", PFX_QUEST + f"topless, bare back, lying on stomach, sheet covering legs and hips, looking back over shoulder, parted lips, soft smile, candlelight, {WHITE_BG}"),
    (122, "sheet-knees-up-shy", PFX_QUEST + f"topless, bare breasts, sitting, sheet draped around lower body, knees bent up, arm around knees partially covering breast, looking at viewer through hair, blush, slight smile, soft warm light, {WHITE_BG}"),
    (123, "sheet-leaning-back-relaxed", PFX_QUEST + f"topless, bare breasts, nipples, leaning back, propped on elbows, sheet covering hips and legs, knees bent, looking at viewer, slow smile, candlelight, {WHITE_BG}"),
    (124, "sheet-just-waking-stretch", PFX_QUEST + f"topless, bare breasts, nipples, just woke up, stretching, both arms over head, sheet pooled at waist, eyes half-open sleepy, soft smile, soft morning light, {WHITE_BG}"),
    (125, "sheet-cross-legged-modest", PFX_QUEST + f"topless, bare breasts, nipples, sitting cross-legged, sheet draped over lap, hands resting on thighs, looking at viewer, gentle smile, candlelight, {WHITE_BG}"),
    (126, "sheet-reaching-side", PFX_QUEST + f"topless, bare breasts, nipples, sitting, sheet at hips, reaching to one side with extended arm, looking at hand, parted lips, candlelight, {WHITE_BG}"),
    (127, "sheet-laughing-back-arch", PFX_QUEST + f"topless, bare breasts, sitting, sheet at waist, laughing, head tilted back, hand on stomach, eyes closed, candlelight, {WHITE_BG}"),
    (128, "sheet-hands-behind-head", PFX_QUEST + f"topless, bare breasts, nipples, lying on back, both hands behind head, sheet covering hips and legs, looking at viewer, soft come-hither smile, candlelight, {WHITE_BG}"),
    (129, "sheet-side-coy-look", PFX_QUEST + f"topless, bare breasts, lying on side, sheet covering hips, knees together, looking at viewer over shoulder, coy expression, parted lips, soft warm light, {WHITE_BG}"),
    (130, "sheet-knee-up-arm-rest", PFX_QUEST + f"topless, bare breasts, nipples, lying on back, one knee up, arm draped across stomach, sheet at hips, looking at viewer, half-closed eyes, soft smile, candlelight, {WHITE_BG}"),
    (131, "sheet-leaning-look-up", PFX_QUEST + f"topless, bare breasts, sitting, sheet at hips, leaning on one hand to side, looking up at viewer through eyelashes, lower lip bitten, soft warm light, {WHITE_BG}"),
    (132, "sheet-hand-on-locket", PFX_QUEST + f"topless, bare breasts, nipples, sitting up, sheet at waist, hand at throat fingertips on locket, looking at viewer, soft thoughtful expression, candlelight, {WHITE_BG}"),
    (133, "sheet-back-curve-look-back", PFX_QUEST + f"topless, bare back, sitting up, sheet around hips, body angled away, looking back over shoulder, hair pulled to one side, parted lips, candlelight, {WHITE_BG}"),
    (134, "sheet-pulling-up-modest", PFX_QUEST + f"topless, bare breasts, sitting, both hands pulling sheet up to chest level, partial coverage, only top of breasts visible, looking at viewer, slight blush, soft warm light, {WHITE_BG}"),
    (135, "sheet-fingers-in-hair-laugh", PFX_QUEST + f"topless, bare breasts, nipples, sitting, sheet at waist, both hands in own hair, laughing, eyes squinted, candlelight, {WHITE_BG}"),

    # ────────────────────────────────────────────────────────────────
    # HOOD SNEAKING (136-165) — hood partially obscuring face, NO weapons
    # ────────────────────────────────────────────────────────────────
    (136, "sneak-hood-crouch-look-back", PFX_SAFE + f"hooded cloak, dark hood, hood up partially obscuring face, half shadowed face, crouching low, looking back over shoulder, alert expression, parted lips, dim light, {WHITE_BG}"),
    (137, "sneak-hood-pressed-against-corner", PFX_SAFE + f"hooded cloak, hood up, half shadowed face, leaning against unseen corner, peeking around, alert, dim light, {WHITE_BG}"),
    (138, "sneak-hood-tiptoe", PFX_SAFE + f"hooded cloak, hood up, hood obscuring face, walking on tiptoes, sneaking, leaning forward, hand outstretched for balance, dim light, {WHITE_BG}"),
    (139, "sneak-hood-finger-to-lips", PFX_SAFE + f"hooded cloak, dark hood up, half shadowed face, finger to lips, shushing, looking at viewer, dim light, {WHITE_BG}"),
    (140, "sneak-hood-peeking-over-edge", PFX_SAFE + f"hooded cloak, hood up, only eyes visible under hood, peeking over invisible ledge, hands gripping unseen surface, alert, dim light, {WHITE_BG}"),
    (141, "sneak-hood-low-crouch-listen", PFX_SAFE + f"hooded cloak, hood up, half shadowed face, low crouch, ear cocked, listening intently, hand cupped to ear, dim light, {WHITE_BG}"),
    (142, "sneak-hood-pressed-flat", PFX_SAFE + f"hooded cloak, hood up, hood covering most of face, pressed flat back as if against wall, breathing held, parted lips, alert, dim light, {WHITE_BG}"),
    (143, "sneak-hood-climbing-rope", PFX_SAFE + f"hooded cloak, hood up, half shadowed face, climbing rope, both hands gripping rope, looking up, parted lips, dim light, {WHITE_BG}"),
    (144, "sneak-hood-sliding-down-rope", PFX_SAFE + f"hooded cloak, hood up, sliding down rope, hands gripping above, looking down, focused, dim light, {WHITE_BG}"),
    (145, "sneak-hood-careful-stride", PFX_SAFE + f"hooded cloak, hood up, hood obscuring face, foot raised mid-step, careful stride, hand out for balance, dim light, {WHITE_BG}"),
    (146, "sneak-hood-glancing-back", PFX_SAFE + f"hooded cloak, hood up, half shadowed face, walking, mid-stride, looking back over shoulder, alert eyes, dim light, {WHITE_BG}"),
    (147, "sneak-hood-checking-corner", PFX_SAFE + f"hooded cloak, hood up, half shadowed face, leaning out from cover, eyes scanning, hand reaching out, dim light, {WHITE_BG}"),
    (148, "sneak-hood-from-behind-back", PFX_SAFE + f"hooded cloak, hood up, from behind, back focus, walking away, looking back slightly, dim light, {WHITE_BG}"),
    (149, "sneak-hood-rolling-stealth", PFX_SAFE + f"hooded cloak, hood up, mid-roll, dynamic pose, body curled, alert eyes, dim light, {WHITE_BG}"),
    (150, "sneak-hood-sliding-low", PFX_SAFE + f"hooded cloak, hood up, sliding low, body angled, one hand down, alert, dim light, {WHITE_BG}"),
    (151, "sneak-hood-hiding-peek", PFX_SAFE + f"hooded cloak, hood up, hiding pose, peeking out from cover, half shadowed face, alert, dim light, {WHITE_BG}"),
    (152, "sneak-hood-on-one-knee", PFX_SAFE + f"hooded cloak, hood up, half shadowed face, down on one knee, hand on the ground, looking forward, alert, dim light, {WHITE_BG}"),
    (153, "sneak-hood-flat-on-ground", PFX_SAFE + f"hooded cloak, hood up, lying flat on stomach, low to the ground, hands gripping ground, looking up, alert, dim light, {WHITE_BG}"),
    (154, "sneak-hood-vaulting", PFX_SAFE + f"hooded cloak, hood up, mid-jump, vaulting over invisible obstacle, hand on obstacle, dynamic pose, dim light, {WHITE_BG}"),
    (155, "sneak-hood-looking-up-window", PFX_SAFE + f"hooded cloak, hood up, half shadowed face, looking up at unseen high window, calculating, parted lips, dim light, {WHITE_BG}"),
    (156, "sneak-hood-feet-light", PFX_SAFE + f"hooded cloak, hood up, hood obscuring face, light step, body angled forward, hand poised, dim light, {WHITE_BG}"),
    (157, "sneak-hood-ducking-low", PFX_SAFE + f"hooded cloak, hood up, ducking head low, half shadowed face, walking forward, alert, dim light, {WHITE_BG}"),
    (158, "sneak-hood-grabbing-pouch", PFX_SAFE + f"hooded cloak, hood up, half shadowed face, hand reaching into hip pouch, focused, looking forward, dim light, {WHITE_BG}"),
    (159, "sneak-hood-checking-shoulder", PFX_SAFE + f"hooded cloak, hood up, walking, looking back over shoulder, alert eyes visible under hood, dim light, {WHITE_BG}"),
    (160, "sneak-hood-climbing-up-ledge", PFX_SAFE + f"hooded cloak, hood up, climbing, both hands gripping unseen ledge, pulling up, looking up, parted lips, dim light, {WHITE_BG}"),
    (161, "sneak-hood-pause-and-breathe", PFX_SAFE + f"hooded cloak, hood up, half shadowed face, hand on unseen surface, leaning, catching breath, parted lips, dim light, {WHITE_BG}"),
    (162, "sneak-hood-shadowed-confident", PFX_SAFE + f"hooded cloak, hood up, completely shadowed face, only mouth visible, slight smirk, hands at sides, dim light, {WHITE_BG}"),
    (163, "sneak-hood-look-back-shh", PFX_SAFE + f"hooded cloak, hood up, half shadowed face, walking, looking back over shoulder, finger to lips, shushing, alert, dim light, {WHITE_BG}"),
    (164, "sneak-hood-pause-at-door", PFX_SAFE + f"hooded cloak, hood up, half shadowed face, hand reaching to unseen handle, pausing, listening, parted lips, alert, dim light, {WHITE_BG}"),
    (165, "sneak-hood-hand-on-locket", PFX_SAFE + f"hooded cloak, hood up, half shadowed face, fingertips touching silver locket at throat, calm before action, parted lips, dim light, {WHITE_BG}"),

    # ────────────────────────────────────────────────────────────────
    # LOCKPICK TUTORIAL (166-175) — demonstrating thieves' tradecraft
    # Lockpicks are TOOLS, not weapons. Shown as thin metal tools.
    # ────────────────────────────────────────────────────────────────
    (166, "lockpick-explain-holding-picks", PFX_SAFE + f"leather vest, leather pants, leather belt with pouches, holding small lockpicks, holding thin metal tools, raising tools to eye level, looking at viewer, teaching expression, slight smile, candlelight, {WHITE_BG}"),
    (167, "lockpick-inserting-into-lock", PFX_SAFE + f"leather vest, leather pants, both hands raised at chest level, working at invisible lock, holding small lockpicks, focused expression, looking at hands, parted lips, candlelight, {WHITE_BG}"),
    (168, "lockpick-tension-wrench-and-pick", PFX_SAFE + f"leather vest, leather pants, holding tension wrench in one hand, thin metal lockpick in other hand, hands at chest level working at invisible lock, intense focus, looking at hands, candlelight, {WHITE_BG}"),
    (169, "lockpick-listening-for-click", PFX_SAFE + f"leather vest, leather pants, hands at chest level holding lockpicks, eyes closed, head tilted, listening, parted lips, focused expression, candlelight, {WHITE_BG}"),
    (170, "lockpick-showing-set-of-tools", PFX_SAFE + f"leather vest, leather pants, holding fan of small thin metal lockpicks, displaying tools to viewer, teaching pose, slight smile, looking at viewer, candlelight, {WHITE_BG}"),
    (171, "lockpick-pointing-at-lock", PFX_SAFE + f"leather vest, leather pants, one hand holding lockpick, other hand pointing at invisible lock, explaining, looking at viewer, teaching expression, candlelight, {WHITE_BG}"),
    (172, "lockpick-eyes-closed-feel", PFX_SAFE + f"leather vest, leather pants, fingers delicately holding lockpick, eyes closed, head tilted slightly, feeling for pin tumblers, parted lips, intense concentration, candlelight, {WHITE_BG}"),
    (173, "lockpick-just-opened-triumph", PFX_SAFE + f"leather vest, leather pants, hand on invisible opened lock, lockpick in other hand, victorious smile, looking at viewer, slight grin, candlelight, {WHITE_BG}"),
    (174, "lockpick-both-hands-demo", PFX_SAFE + f"leather vest, leather pants, both hands raised in front of viewer, holding lockpicks up demonstrating technique, looking at viewer, teaching expression, slight smile, candlelight, {WHITE_BG}"),
    (175, "lockpick-kneeling-at-lock", PFX_SAFE + f"leather vest, leather pants, kneeling on one knee, hands working at chest-height invisible lock, holding lockpick, focused expression, looking at hands, parted lips, candlelight, {WHITE_BG}"),

    # ────────────────────────────────────────────────────────────────
    # BODY STATES & REST (176-215, 40)
    # ────────────────────────────────────────────────────────────────
    (176, "sitting-cross-legged-relaxed", PFX_SAFE + f"leather vest, leather pants, sitting cross-legged, hands on knees, looking at viewer, relaxed expression, soft warm light, {WHITE_BG}"),
    (177, "sitting-on-heels", PFX_SAFE + f"leather vest, leather pants, kneeling on heels, hands on thighs, looking at viewer, calm expression, soft light, {WHITE_BG}"),
    (178, "sitting-leaning-back-arms-prop", PFX_SAFE + f"leather vest, leather pants, sitting, leaning back, both arms behind for support, knees up, looking at viewer, slight smile, soft light, {WHITE_BG}"),
    (179, "sitting-slumped-tired", PFX_SAFE + f"leather vest, leather pants, sitting, slumped over, head down, exhausted, dim light, {WHITE_BG}"),
    (180, "sitting-knees-arms-around", PFX_SAFE + f"leather vest, leather pants, sitting, knees up, arms around knees, head resting on knees, sad, dim light, {WHITE_BG}"),
    (181, "sitting-alert-back-straight", PFX_SAFE + f"leather vest, leather pants, sitting, perfectly straight back, alert eyes, looking ahead, hands on knees, soft light, {WHITE_BG}"),
    (182, "sitting-side-leg-tucked", PFX_SAFE + f"leather vest, leather pants, sitting on side, one leg tucked under, looking at viewer, slight smile, soft warm light, {WHITE_BG}"),
    (183, "sitting-meditating", PFX_SAFE + f"silk robe, sitting cross-legged, eyes closed, hands on knees palms up, peaceful, mystical light, {WHITE_BG}"),
    (184, "crouching-low-alert", PFX_SAFE + f"leather vest, leather pants, crouching low, hand on ground, alert eyes, parted lips, dim light, {WHITE_BG}"),
    (185, "crouching-examining-floor", PFX_SAFE + f"leather vest, leather pants, crouching, examining ground, focused, looking down, parted lips, dim light, {WHITE_BG}"),
    (186, "crouching-stalking-forward", PFX_SAFE + f"leather vest, leather pants, crouching, mid-step, body forward, eyes ahead, hand poised, dim light, {WHITE_BG}"),
    (187, "crouching-hiding-knees-tight", PFX_SAFE + f"leather vest, leather pants, crouching, knees tight to chest, arms wrapped, hiding, scared, dim light, {WHITE_BG}"),
    (188, "crouching-listening", PFX_SAFE + f"leather vest, leather pants, crouching, ear cocked, eyes alert, hand cupped to ear, dim light, {WHITE_BG}"),
    (189, "lying-on-back-relaxed", PFX_SAFE + f"leather vest, leather pants, lying on back, arms behind head, eyes open, soft smile, soft warm light, {WHITE_BG}"),
    (190, "lying-on-side-sleeping", PFX_SAFE + f"leather vest, leather pants, lying on side, eyes closed, peaceful sleep, hand under cheek, soft warm light, {WHITE_BG}"),
    (191, "lying-stomach-propped-elbow", PFX_SAFE + f"leather vest, leather pants, lying on stomach, propped on elbows, looking at viewer, slight smile, soft warm light, {WHITE_BG}"),
    (192, "lying-flat-stomach-exhausted", PFX_SAFE + f"leather vest, leather pants, lying flat on stomach, arms outstretched, face down, exhausted, dim light, {WHITE_BG}"),
    (193, "sleeping-curled-fetal", PFX_SAFE + f"leather vest, leather pants, sleeping, curled up fetal position, peaceful expression, eyes closed, soft warm light, {WHITE_BG}"),
    (194, "sleeping-sprawled-back", PFX_SAFE + f"leather vest, leather pants, sleeping, sprawled on back, arms out, mouth slightly open, eyes closed, soft warm light, {WHITE_BG}"),
    (195, "sleeping-side-knees-up", PFX_SAFE + f"leather vest, leather pants, sleeping on side, knees drawn up, hands tucked, peaceful, eyes closed, soft warm light, {WHITE_BG}"),
    (196, "sleeping-fitful-frowning", PFX_SAFE + f"leather vest, leather pants, sleeping, frowning slightly, fitful expression, eyes closed, dim light, {WHITE_BG}"),
    (197, "sitting-leaning-back-thoughtful", PFX_SAFE + f"leather vest, leather pants, sitting, leaning back, knees up, looking off to side, thoughtful, soft warm light, {WHITE_BG}"),
    (198, "sitting-tying-bootlaces", PFX_SAFE + f"leather vest, leather pants, sitting, bending forward, fingers at boot laces, focused expression, looking down, soft light, {WHITE_BG}"),
    (199, "sitting-stretching-arms-up", PFX_SAFE + f"leather vest, leather pants, sitting, both arms up, stretching, eyes closed, content smile, soft warm light, {WHITE_BG}"),
    (200, "sitting-edge-feet-dangling", PFX_SAFE + f"leather vest, leather pants, sitting on edge, feet dangling, looking down, slight smile, soft warm light, {WHITE_BG}"),
    (201, "crouching-rubbing-foot", PFX_SAFE + f"leather vest, leather pants, crouching, hand rubbing foot, slight grimace, looking down, soft light, {WHITE_BG}"),
    (202, "lying-back-arm-over-eyes", PFX_SAFE + f"leather vest, leather pants, lying on back, one arm draped over eyes, mouth slightly open, exhausted, dim light, {WHITE_BG}"),
    (203, "lying-back-staring-up", PFX_SAFE + f"leather vest, leather pants, lying on back, both arms at sides, eyes open staring upward, contemplative, soft light, {WHITE_BG}"),
    (204, "lying-side-fetal-cold", PFX_SAFE + f"leather vest, leather pants, lying on side, fetal position, shivering, cold, dim cold light, {WHITE_BG}"),
    (205, "sitting-clutching-self-cold", PFX_SAFE + f"leather vest, leather pants, sitting, hugging self, shivering, cold, dim cold light, {WHITE_BG}"),
    (206, "sleeping-head-on-arm", PFX_SAFE + f"leather vest, leather pants, lying on back, head turned, arm cradling head, peaceful sleep, soft warm light, {WHITE_BG}"),
    (207, "sleeping-sitting-against-wall", PFX_SAFE + f"leather vest, leather pants, sitting, head fallen forward, eyes closed, exhausted sleep, soft warm light, {WHITE_BG}"),
    (208, "crouching-balanced-toes", PFX_SAFE + f"leather vest, leather pants, crouching balanced on toes, hands forward on ground, alert, low silhouette, dim light, {WHITE_BG}"),
    (209, "lying-injured-grimacing", PFX_SAFE + f"leather vest, leather pants, lying on side, hand on stomach, grimacing in pain, eyes squeezed shut, dim light, {WHITE_BG}"),
    (210, "sitting-head-in-hands", PFX_SAFE + f"leather vest, leather pants, sitting, both hands cradling head, elbows on knees, distress, dim light, {WHITE_BG}"),
    (211, "sitting-arms-dangling-defeated", PFX_SAFE + f"leather vest, leather pants, sitting, arms hanging at sides, head down, defeated expression, dim light, {WHITE_BG}"),
    (212, "sitting-laughing-head-back", PFX_SAFE + f"leather vest, leather pants, sitting, head tilted back, laughing, mouth wide open, eyes closed, joyful, soft warm light, {WHITE_BG}"),
    (213, "lying-back-arms-spread-rest", PFX_SAFE + f"leather vest, leather pants, lying on back, arms spread out, eyes closed, deep rest, soft warm light, {WHITE_BG}"),
    (214, "sitting-cross-legged-counting", PFX_SAFE + f"leather vest, leather pants, sitting cross-legged, holding coins in cupped hands, counting, focused, looking down, candlelight, {WHITE_BG}"),
    (215, "lying-side-ponytail-spread", PFX_SAFE + f"leather vest, leather pants, lying on side, ponytail spread, eyes closed, peaceful, soft warm light, {WHITE_BG}"),

    # ────────────────────────────────────────────────────────────────
    # EMOTIONAL STATES (216-245, 30)
    # ────────────────────────────────────────────────────────────────
    (216, "crying-sobbing-hand-over-face", PFX_SAFE + f"leather vest, leather pants, hand over face, sobbing, shoulders shaking, tears, dim light, {WHITE_BG}"),
    (217, "crying-silent-tears", PFX_SAFE + f"leather vest, leather pants, looking at viewer, silent tears, parted lips, devastated expression, soft light, {WHITE_BG}"),
    (218, "crying-head-in-arms", PFX_SAFE + f"leather vest, leather pants, sitting, head buried in folded arms on knees, sobbing, dim light, {WHITE_BG}"),
    (219, "crying-looking-up-tearful", PFX_SAFE + f"leather vest, leather pants, looking up, eyes brimming with tears, parted lips, soft light, {WHITE_BG}"),
    (220, "crying-fists-clenched-angry", PFX_SAFE + f"leather vest, leather pants, standing, fists clenched, face wet with angry tears, glaring at viewer, dim light, {WHITE_BG}"),
    (221, "laughing-head-back-belly", PFX_SAFE + f"leather vest, leather pants, head tilted back, mouth wide open laughing, hand on belly, eyes closed, joyful, soft warm light, {WHITE_BG}"),
    (222, "laughing-doubled-over", PFX_SAFE + f"leather vest, leather pants, doubled over laughing, hands on knees, mouth open, eyes squeezed shut, soft warm light, {WHITE_BG}"),
    (223, "laughing-hand-to-mouth", PFX_SAFE + f"leather vest, leather pants, hand to mouth, laughing, eyes crinkled, amused, soft warm light, {WHITE_BG}"),
    (224, "laughing-pointing-at-viewer", PFX_SAFE + f"leather vest, leather pants, pointing at viewer, laughing, mouth open, teasing, soft warm light, {WHITE_BG}"),
    (225, "laughing-falling-back", PFX_SAFE + f"leather vest, leather pants, falling backward laughing, both hands up, mouth wide open, joyful, soft warm light, {WHITE_BG}"),
    (226, "tired-yawning-hand-mouth", PFX_SAFE + f"leather vest, leather pants, yawning, hand to mouth, eyes squinted closed, exhausted, soft warm light, {WHITE_BG}"),
    (227, "tired-rubbing-eyes", PFX_SAFE + f"leather vest, leather pants, rubbing eyes with fists, eyes squeezed, sleepy, soft warm light, {WHITE_BG}"),
    (228, "tired-leaning-knees", PFX_SAFE + f"leather vest, leather pants, leaning forward, hands on knees, panting, sweat, exhausted, dim light, {WHITE_BG}"),
    (229, "tired-slumped-shoulders", PFX_SAFE + f"leather vest, leather pants, walking, slumped shoulders, head down, dragging feet, exhausted, dim light, {WHITE_BG}"),
    (230, "tired-eyes-drooping", PFX_SAFE + f"leather vest, leather pants, sitting, eyes half-closed drooping, head nodding, almost asleep, soft warm light, {WHITE_BG}"),
    (231, "sore-rubbing-shoulder", PFX_SAFE + f"leather vest, leather pants, hand reaching across to opposite shoulder, rubbing sore muscle, slight wince, soft light, {WHITE_BG}"),
    (232, "sore-stretching-neck", PFX_SAFE + f"leather vest, leather pants, stretching neck to one side, hand on neck, slight grimace, eyes closed, soft light, {WHITE_BG}"),
    (233, "sore-hand-on-back", PFX_SAFE + f"leather vest, leather pants, hand on lower back, leaning back slightly, wincing, soft light, {WHITE_BG}"),
    (234, "sore-rolling-shoulder", PFX_SAFE + f"leather vest, leather pants, rolling shoulder, hand on shoulder, slight grimace, soft light, {WHITE_BG}"),
    (235, "sore-massaging-temples", PFX_SAFE + f"leather vest, leather pants, both hands massaging temples, eyes closed, headache, dim light, {WHITE_BG}"),
    (236, "relieved-hands-knees-breath", PFX_SAFE + f"leather vest, leather pants, hands on knees, breathing heavily, slight smile of relief, soft warm light, {WHITE_BG}"),
    (237, "amazed-mouth-open-eyes-wide", PFX_SAFE + f"leather vest, leather pants, mouth open, eyes wide, hand to chest, amazed expression, soft warm light, {WHITE_BG}"),
    (238, "fearful-hand-to-mouth", PFX_SAFE + f"leather vest, leather pants, hand to mouth, eyes wide, fearful, parted lips, dim light, {WHITE_BG}"),
    (239, "determined-jaw-set", PFX_SAFE + f"leather vest, leather pants, jaw set firmly, eyes hard, determined expression, looking forward, soft light, {WHITE_BG}"),
    (240, "relief-tears-of-joy", PFX_SAFE + f"leather vest, leather pants, hands clasped at chest, tears in eyes, joyful smile, soft warm light, {WHITE_BG}"),
    (241, "heartbroken-staring", PFX_SAFE + f"leather vest, leather pants, eyes wet but unshed, staring at nothing, hollow expression, dim light, {WHITE_BG}"),
    (242, "confused-tilting-head", PFX_SAFE + f"leather vest, leather pants, head tilted, eyebrow raised, confused expression, parted lips, soft light, {WHITE_BG}"),
    (243, "surprised-jumping-back", PFX_SAFE + f"leather vest, leather pants, stepping back, hand to chest, mouth open in surprise, eyes wide, soft warm light, {WHITE_BG}"),
    (244, "annoyed-arms-eye-roll", PFX_SAFE + f"leather vest, leather pants, arms crossed, eye roll, exasperated expression, soft light, {WHITE_BG}"),
    (245, "content-soft-smile", PFX_SAFE + f"leather vest, leather pants, soft contented smile, eyes closed, head tilted slightly back, soft warm light, {WHITE_BG}"),

    # ────────────────────────────────────────────────────────────────
    # COMBAT AFTERMATH / INJURED (246-285, 40)
    # ────────────────────────────────────────────────────────────────
    (246, "injured-holding-side-wound", PFX_SAFE + f"leather vest, leather pants, hand pressed to side, blood seeping between fingers, slight wince, parted lips, dim light, {WHITE_BG}"),
    (247, "injured-arm-cradled-broken", PFX_SAFE + f"leather vest, leather pants, one arm cradled to chest, broken arm, slight grimace, looking down, dim light, {WHITE_BG}"),
    (248, "injured-head-cut-blood", PFX_SAFE + f"leather vest, leather pants, blood on forehead, hand to head, slight wince, dim light, {WHITE_BG}"),
    (249, "injured-cuts-bruises-arms", PFX_SAFE + f"leather vest, leather pants, cuts and bruises on bare arms, scratches, looking at her own arm, dim light, {WHITE_BG}"),
    (250, "injured-limping-favoring-leg", PFX_SAFE + f"leather vest, leather pants, limping, favoring one leg, walking, slight grimace, dim light, {WHITE_BG}"),
    (251, "leg-broken-braced-sitting", PFX_SAFE + f"leather vest, leather pants, sitting, one leg straight out with wooden splint and bandages bracing, slight grimace, dim light, {WHITE_BG}"),
    (252, "leg-broken-splint-crutch", PFX_SAFE + f"leather vest, leather pants, standing on one leg, broken leg in splint, leaning on wooden crutch, dim light, {WHITE_BG}"),
    (253, "leg-broken-elevated-lying", PFX_SAFE + f"leather vest, leather pants, lying on back, broken leg with splint elevated, hands on chest, parted lips, dim light, {WHITE_BG}"),
    (254, "scorched-singed-hair-soot", PFX_SAFE + f"leather vest, leather pants, soot smudges on face, ends of ponytail singed black, looking at viewer, parted lips, dim light, {WHITE_BG}"),
    (255, "scorched-burn-marks-arm", PFX_SAFE + f"leather vest, leather pants, red burn marks on bare forearm, hand cradling burned arm, slight wince, dim light, {WHITE_BG}"),
    (256, "scorched-clothes-smoking", PFX_SAFE + f"leather vest, leather pants, smoke rising from edges of clothes, soot on face, exhausted, dim light, {WHITE_BG}"),
    (257, "blood-splattered-face-shocked", PFX_SAFE + f"leather vest, leather pants, blood splatters across her face and chest, shocked expression, parted lips, dim light, {WHITE_BG}"),
    (258, "blood-splattered-body-wide-eyed", PFX_SAFE + f"leather vest, leather pants, blood splattered on torso, leather, and arms, wide eyed, hands red, dim light, {WHITE_BG}"),
    (259, "blood-spatter-walking-grim", PFX_SAFE + f"leather vest, leather pants, blood splatter on cheek and chest, walking grim, dim light, {WHITE_BG}"),
    (260, "poisoned-pale-knees", PFX_SAFE + f"leather vest, leather pants, on knees, pale, sweating, hand on stomach, eyes squeezed shut, dim light, {WHITE_BG}"),
    (261, "poisoned-staggering", PFX_SAFE + f"leather vest, leather pants, staggering, blurry pose, hand to head, eyes unfocused, parted lips, dim light, {WHITE_BG}"),
    (262, "poisoned-vomiting-side", PFX_SAFE + f"leather vest, leather pants, bent over to side, hand to mouth, sick expression, pale, dim light, {WHITE_BG}"),
    (263, "poisoned-collapsed-side", PFX_SAFE + f"leather vest, leather pants, lying on side, pale, sweating, parted lips, eyes half-open, dim light, {WHITE_BG}"),
    (264, "bandaged-head-wound", PFX_SAFE + f"leather vest, leather pants, bandage wrapped around head, blood seeping through, looking at viewer, parted lips, dim light, {WHITE_BG}"),
    (265, "bandaged-arm-sling", PFX_SAFE + f"leather vest, leather pants, one arm in cloth sling, looking at viewer, slight smile, soft light, {WHITE_BG}"),
    (266, "bandaged-side-torso", PFX_SAFE + f"leather vest, leather pants, white bandages wrapped around torso under leather vest, sitting, slight grimace, dim light, {WHITE_BG}"),
    (267, "bandaged-leg-thigh", PFX_SAFE + f"leather vest, leather pants, bandage wrapped around thigh, blood spot, sitting, looking down, dim light, {WHITE_BG}"),
    (268, "bandaged-multiple-wounds", PFX_SAFE + f"leather vest, leather pants, multiple bandages on arms and side, sitting, exhausted but alive, dim light, {WHITE_BG}"),
    (269, "dying-hand-reaching", PFX_SAFE + f"leather vest, leather pants, lying on back, blood on chest, one hand reaching upward, eyes glassy, fading, dim light, {WHITE_BG}"),
    (270, "dying-eyes-half-closed-tear", PFX_SAFE + f"leather vest, leather pants, lying on side, eyes half-closed, single tear rolling down cheek, parted lips, dim light, {WHITE_BG}"),
    (271, "dying-final-breath", PFX_SAFE + f"leather vest, leather pants, lying on back, mouth slightly open, eyes glassy and unfocused, peaceful expression, dim light, {WHITE_BG}"),
    (272, "dying-cradled-by-unseen", PFX_SAFE + f"leather vest, leather pants, lying back, head tilted up as if cradled by unseen arms, eyes closed, blood on lips, dim light, {WHITE_BG}"),
    (273, "dying-grasping-locket", PFX_SAFE + f"leather vest, leather pants, lying on back, fingers wrapped around silver locket at throat, eyes half-closed, dim light, {WHITE_BG}"),
    (274, "dead-eyes-closed-peaceful", PFX_SAFE + f"leather vest, leather pants, lying on back, eyes closed, peaceful expression, hands at sides, dim cold light, {WHITE_BG}"),
    (275, "dead-eyes-open-staring", PFX_SAFE + f"leather vest, leather pants, lying on back, eyes open and staring, lifeless expression, dim cold light, {WHITE_BG}"),
    (276, "dead-curled-on-side", PFX_SAFE + f"leather vest, leather pants, lying on side, curled, eyes closed, lifeless, dim cold light, {WHITE_BG}"),
    (277, "dead-arms-spread-fallen", PFX_SAFE + f"leather vest, leather pants, lying on back, arms spread wide as fallen, eyes closed, dim cold light, {WHITE_BG}"),
    (278, "dead-face-down", PFX_SAFE + f"leather vest, leather pants, lying face down, ponytail spread, motionless, dim cold light, {WHITE_BG}"),
    (279, "exhausted-collapsed-knees", PFX_SAFE + f"leather vest, leather pants, on hands and knees, exhausted, head down, panting, soft warm light, {WHITE_BG}"),
    (280, "exhausted-sliding-down", PFX_SAFE + f"leather vest, leather pants, leaning back, sliding down to sit, exhausted, eyes closed, soft warm light, {WHITE_BG}"),
    (281, "recovering-bandaged-sitting-up", PFX_SAFE + f"leather vest, leather pants, sitting up, bandages on torso, slight smile, looking at viewer, soft warm light, {WHITE_BG}"),
    (282, "fainted-collapsed", PFX_SAFE + f"leather vest, leather pants, lying collapsed, eyes closed, one arm extended, parted lips, dim light, {WHITE_BG}"),
    (283, "shaking-cold-clutching", PFX_SAFE + f"leather vest, leather pants, hugging self, shivering, blue lips, dim cold light, {WHITE_BG}"),
    (284, "fevered-pale-sweating", PFX_SAFE + f"leather vest, leather pants, lying on side, sweating, pale, eyes glazed, parted lips, dim warm light, {WHITE_BG}"),
    (285, "recovering-stretching", PFX_SAFE + f"leather vest, leather pants, stretching, both arms up, slight smile, alive again, soft warm light, {WHITE_BG}"),

    # ────────────────────────────────────────────────────────────────
    # PHYSICAL ACTIONS (286-325, 40) — eat / drink / fall / jump / climb / look / listen
    # ────────────────────────────────────────────────────────────────
    (286, "eating-apple-mid-bite", PFX_SAFE + f"leather vest, leather pants, holding apple, mid-bite, looking at viewer, slight smile, soft warm light, {WHITE_BG}"),
    (287, "eating-bread-tearing", PFX_SAFE + f"leather vest, leather pants, tearing piece of bread, looking down at hands, focused, soft warm light, {WHITE_BG}"),
    (288, "eating-stew-bowl-spoon", PFX_SAFE + f"leather vest, leather pants, holding wooden bowl and spoon, mid-bite, eyes closed in pleasure, soft warm light, {WHITE_BG}"),
    (289, "eating-dried-meat-strip", PFX_SAFE + f"leather vest, leather pants, tearing strip of dried meat with teeth, looking sideways, soft light, {WHITE_BG}"),
    (290, "eating-cross-legged-bowl", PFX_SAFE + f"leather vest, leather pants, sitting cross-legged, holding food bowl, eating, looking at viewer, soft warm light, {WHITE_BG}"),
    (291, "drinking-water-cupped-hands", PFX_SAFE + f"leather vest, leather pants, kneeling, cupped hands at mouth, drinking water, eyes closed, soft warm light, {WHITE_BG}"),
    (292, "drinking-tankard-deep", PFX_SAFE + f"leather vest, leather pants, holding tankard up, drinking deeply, head tilted back, soft warm light, {WHITE_BG}"),
    (293, "drinking-wineskin-overhead", PFX_SAFE + f"leather vest, leather pants, holding wineskin overhead, stream into open mouth, eyes closed, soft warm light, {WHITE_BG}"),
    (294, "drinking-from-stream-bent", PFX_SAFE + f"leather vest, leather pants, bent over, hands cupped at unseen water, drinking, soft warm light, {WHITE_BG}"),
    (295, "drinking-tossing-back-flask", PFX_SAFE + f"leather vest, leather pants, throwing head back, holding small flask, drinking, eyes closed, soft warm light, {WHITE_BG}"),
    (296, "falling-mid-fall-arms-out", PFX_SAFE + f"leather vest, leather pants, mid-fall, arms outstretched, hair flowing up, scared, parted lips, dim light, {WHITE_BG}"),
    (297, "falling-backward-shock", PFX_SAFE + f"leather vest, leather pants, falling backward, arms windmilling, mouth open in shock, dim light, {WHITE_BG}"),
    (298, "falling-forward-stumbling", PFX_SAFE + f"leather vest, leather pants, mid-stumble, falling forward, hands out to catch, dim light, {WHITE_BG}"),
    (299, "falling-spread-eagle-air", PFX_SAFE + f"leather vest, leather pants, falling, body spread eagle in air, hair flowing, dim light, {WHITE_BG}"),
    (300, "falling-tucking-roll", PFX_SAFE + f"leather vest, leather pants, tucking into roll, hands forward, knees up, mid-air, dim light, {WHITE_BG}"),
    (301, "jumping-tucked-mid-jump", PFX_SAFE + f"leather vest, leather pants, mid-jump, knees tucked up, arms forward, dim light, {WHITE_BG}"),
    (302, "jumping-arms-out-leaping", PFX_SAFE + f"leather vest, leather pants, mid-jump, arms outstretched, body horizontal in air, dim light, {WHITE_BG}"),
    (303, "jumping-pushing-off-toes", PFX_SAFE + f"leather vest, leather pants, pushing off toes, leaning forward, arms swinging back, mid-launch, dim light, {WHITE_BG}"),
    (304, "jumping-landing-knees-bent", PFX_SAFE + f"leather vest, leather pants, mid-landing, knees bent absorbing impact, hands out for balance, dim light, {WHITE_BG}"),
    (305, "jumping-vaulting-over", PFX_SAFE + f"leather vest, leather pants, vaulting, one hand on invisible obstacle, body horizontal, mid-vault, dim light, {WHITE_BG}"),
    (306, "climb-up-rope-hand-over-hand", PFX_SAFE + f"leather vest, leather pants, climbing rope, both hands gripping rope above, looking up, parted lips, dim light, {WHITE_BG}"),
    (307, "climb-up-free-stone-grips", PFX_SAFE + f"leather vest, leather pants, climbing free, both hands gripping unseen handholds, looking up, focused, dim light, {WHITE_BG}"),
    (308, "climb-up-pulling-up-ledge", PFX_SAFE + f"leather vest, leather pants, pulling up onto unseen ledge, both arms extended above, looking up, exertion, dim light, {WHITE_BG}"),
    (309, "climb-up-feet-against-wall", PFX_SAFE + f"leather vest, leather pants, climbing, feet against unseen wall, hands gripping, body angled, dim light, {WHITE_BG}"),
    (310, "climb-up-fingertips-grip", PFX_SAFE + f"leather vest, leather pants, hanging by fingertips on unseen ledge, looking up, parted lips, exertion, dim light, {WHITE_BG}"),
    (311, "climb-down-rope-controlled", PFX_SAFE + f"leather vest, leather pants, sliding down rope, hands gripping above, looking down, focused, dim light, {WHITE_BG}"),
    (312, "climb-down-free-handholds", PFX_SAFE + f"leather vest, leather pants, climbing down free, body angled, both hands gripping handholds, looking down, dim light, {WHITE_BG}"),
    (313, "climb-down-rappelling", PFX_SAFE + f"leather vest, leather pants, rappelling on rope, body horizontal, feet on unseen wall, dim light, {WHITE_BG}"),
    (314, "climb-down-cautious-steps", PFX_SAFE + f"leather vest, leather pants, descending carefully, hands and feet, looking down, dim light, {WHITE_BG}"),
    (315, "climb-down-jumping-final", PFX_SAFE + f"leather vest, leather pants, jumping the last bit, body in air, hands above gripping rope last moment, dim light, {WHITE_BG}"),
    (316, "look-far-distance-shading-eyes", PFX_SAFE + f"leather vest, leather pants, hand shading eyes, looking into distance, alert expression, soft warm light, {WHITE_BG}"),
    (317, "look-far-distance-pointing", PFX_SAFE + f"leather vest, leather pants, pointing forward at far distance, looking ahead, parted lips, soft warm light, {WHITE_BG}"),
    (318, "look-far-distance-on-tiptoe", PFX_SAFE + f"leather vest, leather pants, on tiptoe, hand on unseen ledge, peering far ahead, parted lips, soft warm light, {WHITE_BG}"),
    (319, "look-far-distance-visor", PFX_SAFE + f"leather vest, leather pants, hand to forehead like a visor, scanning horizon, eyes narrowed, soft warm light, {WHITE_BG}"),
    (320, "look-far-distance-surveying", PFX_SAFE + f"leather vest, leather pants, looking out at distance, both hands on hips, surveying, profile view, soft warm light, {WHITE_BG}"),
    (321, "listen-cupped-ear-eyes-closed", PFX_SAFE + f"leather vest, leather pants, hand cupped to ear, eyes closed, head tilted, listening intently, soft light, {WHITE_BG}"),
    (322, "listen-finger-up-other-ear", PFX_SAFE + f"leather vest, leather pants, one hand to ear, other finger up to lips for silence, eyes wide alert, dim light, {WHITE_BG}"),
    (323, "listen-pressed-against", PFX_SAFE + f"leather vest, leather pants, ear pressed forward, palm flat, eyes wide, dim light, {WHITE_BG}"),
    (324, "listen-head-cocked-side", PFX_SAFE + f"leather vest, leather pants, head cocked to one side, eyes alert, parted lips, listening, dim light, {WHITE_BG}"),
    (325, "listen-eyes-darting", PFX_SAFE + f"leather vest, leather pants, eyes wide, darting to side, head still, listening, parted lips, dim light, {WHITE_BG}"),

    # ────────────────────────────────────────────────────────────────
    # SILENCE GESTURES & STEALTH SIGNALS (326-355, 30)
    # ────────────────────────────────────────────────────────────────
    (326, "shh-finger-eyes-wide", PFX_SAFE + f"leather vest, leather pants, finger pressed firmly to lips, eyes wide alert, parted lips, dim light, {WHITE_BG}"),
    (327, "shh-finger-walking-look-back", PFX_SAFE + f"leather vest, leather pants, walking, looking back, finger to lips, shushing, dim light, {WHITE_BG}"),
    (328, "shh-finger-conspiratorial-grin", PFX_SAFE + f"leather vest, leather pants, finger to lips, conspiratorial grin, looking at viewer, soft warm light, {WHITE_BG}"),
    (329, "shh-finger-pressed-frowning", PFX_SAFE + f"leather vest, leather pants, finger to mouth, slight frown of concern, eyes intense, dim light, {WHITE_BG}"),
    (330, "shh-finger-other-pointing", PFX_SAFE + f"leather vest, leather pants, finger to lips, other hand pointing forward, alert, dim light, {WHITE_BG}"),
    (331, "watch-cover-peek", PFX_SAFE + f"leather vest, leather pants, peeking out from cover, only half face visible, alert, dim light, {WHITE_BG}"),
    (332, "watch-low-cover-eyes", PFX_SAFE + f"leather vest, leather pants, crouched low, only eyes visible above unseen cover, alert, dim light, {WHITE_BG}"),
    (333, "watch-shadows-arms-folded", PFX_SAFE + f"leather vest, leather pants, partially in shadow, arms folded, watching, alert, dim light, {WHITE_BG}"),
    (334, "watch-tracking-target", PFX_SAFE + f"leather vest, leather pants, eyes locked on something off to side, head turning to follow, alert, dim light, {WHITE_BG}"),
    (335, "watch-pondering-finger-chin", PFX_SAFE + f"leather vest, leather pants, finger on chin, watching, calculating expression, soft light, {WHITE_BG}"),
    (336, "signal-pointing-direction", PFX_SAFE + f"leather vest, leather pants, pointing forward, looking back at viewer, alert, parted lips, dim light, {WHITE_BG}"),
    (337, "signal-hand-up-stop", PFX_SAFE + f"leather vest, leather pants, hand raised palm out to viewer, stop gesture, alert eyes, dim light, {WHITE_BG}"),
    (338, "signal-circle-finger", PFX_SAFE + f"leather vest, leather pants, finger making circling gesture, looking at viewer, soft light, {WHITE_BG}"),
    (339, "signal-thumbs-up", PFX_SAFE + f"leather vest, leather pants, thumbs up at viewer, slight smile, soft warm light, {WHITE_BG}"),
    (340, "signal-cut-throat", PFX_SAFE + f"leather vest, leather pants, finger drawn across own throat, dark expression, dim light, {WHITE_BG}"),
    (341, "signal-three-fingers", PFX_SAFE + f"leather vest, leather pants, three fingers raised, looking at viewer, signal expression, soft light, {WHITE_BG}"),
    (342, "signal-hand-flat-down", PFX_SAFE + f"leather vest, leather pants, hand flat palm-down, lowering gesture, alert, soft light, {WHITE_BG}"),
    (343, "signal-fist-then-pointing", PFX_SAFE + f"leather vest, leather pants, fist clenched, alert pose, dim light, {WHITE_BG}"),
    (344, "spot-pointing-far", PFX_SAFE + f"leather vest, leather pants, pointing to far distance, looking ahead, parted lips, soft warm light, {WHITE_BG}"),
    (345, "spot-grabbing-arm-warn", PFX_SAFE + f"leather vest, leather pants, arm extended grabbing unseen, pointing forward, alert, dim light, {WHITE_BG}"),
    (346, "stealth-crouch-warn-friend", PFX_SAFE + f"leather vest, leather pants, crouched, hand reaching out as if to stop unseen ally, alert, dim light, {WHITE_BG}"),
    (347, "stealth-half-step-forward", PFX_SAFE + f"leather vest, leather pants, half-step forward, body low, hand poised, alert, dim light, {WHITE_BG}"),
    (348, "stealth-crawling-elbows", PFX_SAFE + f"leather vest, leather pants, crawling on elbows, body low to ground, alert, dim light, {WHITE_BG}"),
    (349, "stealth-rolling-cover", PFX_SAFE + f"leather vest, leather pants, mid-roll, body curling, hands forward, dynamic, dim light, {WHITE_BG}"),
    (350, "stealth-ducking-quick", PFX_SAFE + f"leather vest, leather pants, ducking down, body low, hand on ground, alert, dim light, {WHITE_BG}"),
    (351, "stealth-flat-against", PFX_SAFE + f"leather vest, leather pants, pressed flat as if against wall, breathing held, alert, dim light, {WHITE_BG}"),
    (352, "stealth-shoulder-roll-pop", PFX_SAFE + f"leather vest, leather pants, mid-recovery from roll, popping up to crouch, dynamic, dim light, {WHITE_BG}"),
    (353, "stealth-peek-around-low", PFX_SAFE + f"leather vest, leather pants, crouched low, peeking around unseen corner, alert, dim light, {WHITE_BG}"),
    (354, "stealth-still-breath-held", PFX_SAFE + f"leather vest, leather pants, perfectly still, eyes wide, breath held, hand near mouth, alert, dim light, {WHITE_BG}"),
    (355, "stealth-arm-forward-go-now", PFX_SAFE + f"leather vest, leather pants, arm extended forward urgently, look at viewer, urgent expression, dim light, {WHITE_BG}"),

    # ────────────────────────────────────────────────────────────────
    # ADVENTURE-FLAVORED (356-375, 20) — extra Mirrors / Shadow / Kings + tools
    # ────────────────────────────────────────────────────────────────
    (356, "mirrors-staring-into-nothing", PFX_SAFE + f"silk robe, eyes unfocused, staring into middle distance, hand to head, contemplative, mystical light, {WHITE_BG}"),
    (357, "mirrors-multiple-versions-overlap", PFX_SAFE + f"silk robe, hands raised in confusion, multiple translucent ghost versions of self overlapping, mystical light, {WHITE_BG}"),
    (358, "mirrors-palm-against-surface", PFX_SAFE + f"silk robe, palm pressed against unseen surface, face inches from it, eyes wide, mystical light, {WHITE_BG}"),
    (359, "mirrors-stepping-through-portal", PFX_SAFE + f"silk robe, mid-step as if through unseen portal, body half-faded, mystical light, {WHITE_BG}"),
    (360, "mirrors-laughing-with-other-self", PFX_SAFE + f"silk robe, smiling and laughing, looking beside her at translucent version of self, mystical light, {WHITE_BG}"),
    (361, "shadow-court-poisoning-cup", PFX_SAFE + f"valusian noble dress, holding small vial over goblet, malicious half-smile, candlelight, {WHITE_BG}"),
    (362, "shadow-revealing-hidden-pouch", PFX_SAFE + f"valusian noble dress, lifting hem to reveal small hidden leather pouch tied to thigh, looking at viewer, candlelight, {WHITE_BG}"),
    (363, "shadow-fleeing-corridor-look-back", PFX_SAFE + f"valusian noble dress, running, looking back over shoulder, ripped sleeve, alert, dim light, {WHITE_BG}"),
    (364, "shadow-court-deep-bow", PFX_SAFE + f"valusian noble dress, deep bow, hand to chest, head down, looking up cunning, candlelight, {WHITE_BG}"),
    (365, "shadow-discovered-shock", PFX_SAFE + f"valusian noble dress, eyes wide in shock, hand to mouth, caught expression, candlelight, {WHITE_BG}"),
    (366, "kings-pictish-defiant-fists", PFX_SAFE + f"leather armor, blue war paint, fists raised, defiant stance, fierce expression, dim cold light, {WHITE_BG}"),
    (367, "kings-druidess-blessing-warrior", PFX_SAFE + f"druidess robes, hand on unseen warrior's shoulder, calm expression, ritual gesture, mystical light, {WHITE_BG}"),
    (368, "kings-druidess-pouring-water-bowl", PFX_SAFE + f"druidess robes, pouring water into wooden bowl, ritual focus, looking down, mystical light, {WHITE_BG}"),
    (369, "kings-pictish-running-mist", PFX_SAFE + f"pictish furs, leather armor, running, mist around feet, looking forward, dim cold light, {WHITE_BG}"),
    (370, "kings-druidess-tracing-rune", PFX_SAFE + f"druidess robes, finger tracing rune in the air, eyes glowing faint, mystical light, {WHITE_BG}"),
    (371, "tools-finding-key-in-pouch", PFX_SAFE + f"leather vest, leather pants, hand reaching into pouch, pulling out small iron key, looking at it, slight smile, candlelight, {WHITE_BG}"),
    (372, "tools-holding-unrolled-map", PFX_SAFE + f"leather vest, leather pants, holding unrolled map, two hands, looking down at it, focused, candlelight, {WHITE_BG}"),
    (373, "tools-examining-dust-fingertips", PFX_SAFE + f"leather vest, leather pants, dust on fingertips, holding up to look at, suspicious expression, candlelight, {WHITE_BG}"),
    (374, "tools-opening-treasure-chest", PFX_SAFE + f"leather vest, leather pants, kneeling, opening unseen chest at floor level, both hands on lid, expression of wonder, candlelight, {WHITE_BG}"),
    (375, "tools-counting-steps-floor", PFX_SAFE + f"leather vest, leather pants, looking down, counting steps on the floor, finger pointed, focused, dim light, {WHITE_BG}"),

    # ────────────────────────────────────────────────────────────────
    # EXPRESSION VARIANTS (376-400, 25) — same outfit, varied moods
    # Useful as default-state portraits the game can swap by emotion.
    # ────────────────────────────────────────────────────────────────
    (376, "expr-serious-jaw-set", PFX_SAFE + f"leather vest, leather pants, standing, jaw set, serious expression, eyes hard, looking at viewer, portrait, soft light, {WHITE_BG}"),
    (377, "expr-determined-fierce", PFX_SAFE + f"leather vest, leather pants, standing, determined expression, fierce, narrowed eyes, looking forward, portrait, soft light, {WHITE_BG}"),
    (378, "expr-concerned-furrowed-brow", PFX_SAFE + f"leather vest, leather pants, standing, concerned expression, furrowed brow, parted lips, looking at viewer, portrait, soft light, {WHITE_BG}"),
    (379, "expr-happy-warm-smile", PFX_SAFE + f"leather vest, leather pants, standing, warm smile, eyes crinkled, looking at viewer, portrait, soft warm light, {WHITE_BG}"),
    (380, "expr-amused-half-smile", PFX_SAFE + f"leather vest, leather pants, standing, amused half-smile, raised eyebrow, looking at viewer, portrait, soft light, {WHITE_BG}"),
    (381, "expr-thoughtful-finger-chin", PFX_SAFE + f"leather vest, leather pants, standing, thoughtful expression, finger to chin, looking at viewer, portrait, soft light, {WHITE_BG}"),
    (382, "expr-sad-soft-eyes", PFX_SAFE + f"leather vest, leather pants, standing, sad expression, soft eyes, slight downturn at mouth, looking at viewer, portrait, dim light, {WHITE_BG}"),
    (383, "expr-angry-glaring", PFX_SAFE + f"leather vest, leather pants, standing, angry, glaring at viewer, narrowed eyes, parted lips, portrait, dim light, {WHITE_BG}"),
    (384, "expr-proud-chin-up", PFX_SAFE + f"leather vest, leather pants, standing, chin lifted, proud expression, looking down at viewer, portrait, soft light, {WHITE_BG}"),
    (385, "expr-puzzled-head-tilt", PFX_SAFE + f"leather vest, leather pants, standing, puzzled expression, head tilted, eyebrow raised, looking at viewer, portrait, soft light, {WHITE_BG}"),
    (386, "expr-surprised-eyes-wide", PFX_SAFE + f"leather vest, leather pants, standing, surprised, eyes wide, mouth slightly open, looking at viewer, portrait, soft light, {WHITE_BG}"),
    (387, "expr-confident-cocky", PFX_SAFE + f"leather vest, leather pants, standing, confident smirk, cocky expression, looking at viewer, portrait, soft warm light, {WHITE_BG}"),
    (388, "expr-nervous-biting-lip", PFX_SAFE + f"leather vest, leather pants, standing, nervous expression, biting lower lip, looking sideways, portrait, soft light, {WHITE_BG}"),
    (389, "expr-suspicious-narrow-eyes", PFX_SAFE + f"leather vest, leather pants, standing, suspicious expression, narrowed eyes, looking at viewer, portrait, soft light, {WHITE_BG}"),
    (390, "expr-contemplative-distant", PFX_SAFE + f"leather vest, leather pants, standing, contemplative, eyes looking off into distance, parted lips, portrait, soft light, {WHITE_BG}"),
    (391, "expr-hopeful-looking-up", PFX_SAFE + f"leather vest, leather pants, standing, hopeful expression, looking up, slight smile, eyes bright, portrait, soft warm light, {WHITE_BG}"),
    (392, "expr-bitter-twisted-mouth", PFX_SAFE + f"leather vest, leather pants, standing, bitter expression, twisted mouth, eyes hard, looking at viewer, portrait, dim light, {WHITE_BG}"),
    (393, "expr-soft-tender-look", PFX_SAFE + f"leather vest, leather pants, standing, soft tender expression, slight smile, eyes warm, looking at viewer, portrait, soft warm light, {WHITE_BG}"),
    (394, "expr-fierce-warrior", PFX_SAFE + f"leather vest, leather pants, standing, fierce warrior expression, jaw set, eyes blazing, looking at viewer, portrait, soft light, {WHITE_BG}"),
    (395, "expr-tearful-quiet", PFX_SAFE + f"leather vest, leather pants, standing, tearful, single tear, quiet expression, looking at viewer, portrait, dim light, {WHITE_BG}"),
    (396, "expr-smirking-knowing", PFX_SAFE + f"leather vest, leather pants, standing, knowing smirk, raised eyebrow, looking at viewer, portrait, soft warm light, {WHITE_BG}"),
    (397, "expr-grinning-mischief", PFX_SAFE + f"leather vest, leather pants, standing, mischievous grin, eyes glinting, looking at viewer, portrait, soft warm light, {WHITE_BG}"),
    (398, "expr-weary-sad-eyes", PFX_SAFE + f"leather vest, leather pants, standing, weary expression, sad eyes, slight smile of resignation, looking at viewer, portrait, dim light, {WHITE_BG}"),
    (399, "expr-inspired-eyes-bright", PFX_SAFE + f"leather vest, leather pants, standing, inspired expression, eyes bright, parted lips, looking at viewer, portrait, soft warm light, {WHITE_BG}"),
    (400, "expr-mischievous-tongue-out", PFX_SAFE + f"leather vest, leather pants, standing, mischievous expression, tongue out playfully, looking at viewer, portrait, soft warm light, {WHITE_BG}"),
]

assert len(PROMPTS) == 400, f"expected 400, got {len(PROMPTS)}"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--strength", type=float, default=0.7,
                        help="LoRA scale (0.5 default per inference rules; 0.7-0.9 for character LoRAs)")
    parser.add_argument("--only", type=str, default=None,
                        help="Comma-separated ids to render (e.g. 1,5,12)")
    parser.add_argument("--steps", type=int, default=28)
    parser.add_argument("--guidance", type=float, default=7.0)
    parser.add_argument("--width", type=int, default=832)
    parser.add_argument("--height", type=int, default=1216)
    args = parser.parse_args()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Loading Pony Realism v23 from {PONY_PATH} ...")
    pipe = StableDiffusionXLPipeline.from_pretrained(
        PONY_PATH,
        torch_dtype=torch.bfloat16,
        use_safetensors=True,
    ).to("cuda")
    try:
        pipe.enable_xformers_memory_efficient_attention()
    except Exception:
        pass  # falls back to native attention

    print(f"Loading Vivian LoRA from {LORA_PATH} at strength {args.strength} ...")
    pipe.load_lora_weights(LORA_PATH)
    pipe.fuse_lora(lora_scale=args.strength)

    only_set = set(int(x) for x in args.only.split(",")) if args.only else None
    target_count = len(only_set) if only_set is not None else len(PROMPTS)

    print(f"Rendering {target_count} images "
          f"({args.width}x{args.height}, {args.steps} steps, CFG {args.guidance}, "
          f"LoRA scale {args.strength})")

    rendered = 0
    skipped = 0
    for id_, slug, prompt in PROMPTS:
        if only_set is not None and id_ not in only_set:
            continue
        out_path = OUTPUT_DIR / f"v{id_:03d}_{slug}.png"
        if out_path.exists():
            print(f"  skip v{id_:03d} {slug}")
            skipped += 1
            continue
        print(f"  generating v{id_:03d} {slug} ...")
        gen = torch.Generator("cuda").manual_seed(id_)
        result = pipe(
            prompt=prompt,
            negative_prompt=NEGATIVE_PROMPT,
            num_inference_steps=args.steps,
            guidance_scale=args.guidance,
            width=args.width,
            height=args.height,
            generator=gen,
        )
        result.images[0].save(out_path)
        rendered += 1
        print(f"  ✓ wrote {out_path}")

    print(f"\n─── done ─── rendered={rendered}  skipped={skipped}")
    print(f"Output: {OUTPUT_DIR}")
    print("Sync to R2 with:")
    print(f"  rclone copy {OUTPUT_DIR}/ "
          "r2-living-eamon:living-eamon/eros-batches/vivian-v1/")


if __name__ == "__main__":
    main()
