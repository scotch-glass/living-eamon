# Vivian LoRA — Captioning Convention

Pony Realism is fine-tuned on booru-style tags (Danbooru/e621). Captions are **comma-separated tags**, not natural language sentences. SD-style "a beautiful woman in a candlelit room" prose works poorly here.

## File layout

For each image `01_front_softbox_closeup.png`, write a sidecar `01_front_softbox_closeup.txt` with the caption. Captions are read by kohya at training time per `caption_extension = ".txt"` in the config.

## Tag schema (in this order)

```
<trigger>, <character base>, <quality>, <source>, <hair tag>, <eye tag>, <expression>, <pose tag>, <framing>, <body state>, <outfit>, <action>, <lighting>, <background>
```

The first token (`vivian1`) is **kept** by `keep_tokens = 1` — it never gets shuffled out. Everything after position 0 may be shuffled by kohya during training (`shuffle_caption = true`), which improves generalization.

## Slot-by-slot

| Slot | Always include | Examples |
|---|---|---|
| trigger | yes — exactly `vivian1` | `vivian1` |
| character base | yes | `1girl, solo` |
| quality | yes | `score_9, score_8_up, score_7_up` |
| source | yes | `source_realistic` (don't include painterly tags — see fluid-artifact gotcha in plan §12) |
| hair | yes | `long hair, black hair, straight hair` (use Vivian's canonical tags, identical across the whole set) |
| eye | yes | `green eyes` (or whatever Vivian's canonical color is) |
| expression | yes | `neutral expression`, `closed mouth`, `parted lips`, `slight smile` |
| pose | yes | `standing`, `sitting`, `reclining`, `walking` |
| framing | yes | `portrait`, `cowboy shot`, `full body` (booru framing tags) |
| body state | only if NSFW | `nude`, `topless`, `bottomless`, `bare breasts`, `nipples` |
| outfit | only if clothed | `loose robe`, `lingerie`, `silk dress` |
| action | optional | `looking at viewer`, `looking to the side`, `holding hair` |
| lighting | yes | `candlelight`, `soft window light`, `moonlight`, `dappled light`, `hard side lighting` |
| background | yes | `plain wall`, `stone wall`, `draped fabric`, `simple background` |

## What NOT to tag

The LoRA learns whatever stays **constant** across the training set and **untagged**. To bake identity into the trigger word, do NOT tag:

- Specific face features (face shape, nose shape, lip shape, jawline)
- Body proportions (don't tag `slim`, `curvy`, `petite` etc.)
- Skin tone (let it be untagged so it locks)
- Distinctive marks the character should always have (scar, mole, tattoo)

The LoRA learns these as part of `vivian1`. If you tag them, the LoRA learns "vivian1 is independent of these features" — exactly the opposite of what we want.

## What to tag aggressively (= things we want to vary at inference)

- Pose, framing, lighting, background, expression, outfit
- Action / gaze direction

These tags need to vary at inference time, so the LoRA learns they're orthogonal to identity.

## Example — image 01 (head/shoulders, front, softbox, neutral)

`01_front_softbox_closeup.txt`:
```
vivian1, 1girl, solo, score_9, score_8_up, score_7_up, source_realistic, long hair, black hair, straight hair, green eyes, neutral expression, closed mouth, looking at viewer, portrait, head and shoulders, soft window light, plain wall, simple background
```

## Example — image 15 (full body, front, softbox, nude, standing)

`15_full_front_softbox_nude_standing.txt`:
```
vivian1, 1girl, solo, score_9, score_8_up, source_realistic, long hair, black hair, straight hair, green eyes, neutral expression, standing, full body, nude, bare breasts, nipples, soft window light, plain wall, simple background
```

## Example — image 17 (full body, front, warm interior, clothed loose robe)

`17_full_front_warm_robe.txt`:
```
vivian1, 1girl, solo, score_9, source_realistic, long hair, black hair, straight hair, green eyes, slight smile, standing, full body, loose robe, warm interior light, draped fabric, simple background
```

## Sanity check before uploading to R2

- [ ] Every `.png` has a same-stem `.txt`
- [ ] Every `.txt` starts with `vivian1, `
- [ ] Hair tags are identical across all 20–25 captions
- [ ] Eye tag is identical across all captions
- [ ] No tags describing facial structure or body proportions
- [ ] `source_realistic` present in every caption (never `source_anime`, `source_furry`, `source_cartoon`)
- [ ] No painterly / oil-painting tags (Pony fluid-artifact gotcha)
