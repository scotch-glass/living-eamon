"""
Pony Diffusion painterly-style smoke test.

Tests whether Pony can produce Frazetta/Vallejo-style sword-and-sorcery
imagery out-of-the-box (no style LoRA) when prompted with painterly
language. If yes, we may not need to retrain a style LoRA on Pony.
If no, we'll know we need to.

Same 6 anatomy scenes as the realistic test, but with painterly tags.
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

import torch
from diffusers import StableDiffusionXLPipeline


PONY_REPO = "John6666/pony-realism-v22-mainvae-sdxl-spo"

# Drop "source_realistic" — we want stylized/painted output.
# Add painterly style tags + canonical-painter references.
SCORE_PREFIX = "score_9, score_8_up, score_7_up, score_6_up, rating_explicit, oil painting, painterly, fantasy art, frank frazetta style, boris vallejo style, dark fantasy illustration, sword and sorcery painting, "
NEG_PROMPT = (
    "score_4, score_3, score_2, score_1, score_0, "
    "source_anime, source_furry, source_cartoon, source_pony, "
    "watermark, signature, text, "
    "deformed anatomy, bad anatomy, asymmetric nipples, malformed breasts, "
    "censored, mosaic, blur, "
    "cloth covering nipples, hand covering nipples, "
    "shadow, dropped shadow, ground shadow, "
    "photograph, 3d render, anime, cartoon, manga"
)


SCENES = [
    ("01_standing_neutral",  "a nude woman standing in a candlelit chamber, full body, full frontal, anatomically correct breasts and pink nipples, nipples visible, head to toe visible, isolated on pure white seamless backdrop"),
    ("02_reclining_furs",    "a topless woman reclining on dark furs, anatomically correct breasts and pink nipples, nipples visible, isolated on pure white seamless backdrop"),
    ("03_after_bath",        "a nude woman walking from a bath, towel held to one side, full body, full frontal, anatomically correct breasts and pink nipples, nipples visible, isolated on pure white seamless backdrop"),
    ("04_courtesan",         "a topless courtesan adjusting a necklace, full body, anatomically correct breasts and pink nipples, nipples visible, isolated on pure white seamless backdrop"),
    ("05_warrior_queen",     "a nude warrior queen on a stone throne, full body, full frontal, anatomically correct breasts and pink nipples, nipples visible, isolated on pure white seamless backdrop"),
    ("06_slave_girl",        "a topless young woman in chains, full body standing, anatomically correct breasts and pink nipples, nipples visible, isolated on pure white seamless backdrop"),
]


def main() -> None:
    if len(sys.argv) < 2:
        print("usage: anatomy_test_pony_painterly.py <out_dir>", file=sys.stderr)
        sys.exit(1)
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)

    print(f"[setup] Loading Pony Realism (cached) …", flush=True)
    t0 = time.time()
    pipe = StableDiffusionXLPipeline.from_pretrained(
        PONY_REPO,
        torch_dtype=torch.bfloat16,
        use_safetensors=True,
    ).to("cuda")
    pipe.set_progress_bar_config(disable=True)
    print(f"[setup] ready in {time.time() - t0:.0f}s", flush=True)

    for i, (stem, scene) in enumerate(SCENES, 1):
        out_png = out / f"{stem}.png"
        if out_png.exists():
            print(f"  [{stem}] exists; skipping", flush=True)
            continue
        seed = abs(hash(("pony-painterly", stem))) % (2**31)
        gen = torch.Generator(device="cuda").manual_seed(seed)
        prompt = SCORE_PREFIX + scene

        t0 = time.time()
        print(f"  [{i}/{len(SCENES)}] {stem} (seed={seed}) …", flush=True)
        img = pipe(
            prompt=prompt,
            negative_prompt=NEG_PROMPT,
            height=1216,
            width=832,
            num_inference_steps=30,
            guidance_scale=7.0,
            generator=gen,
        ).images[0]
        img.save(out_png)
        print(f"      → {out_png.name} ({time.time() - t0:.0f}s)", flush=True)

    print("\n[done]", flush=True)


if __name__ == "__main__":
    main()
