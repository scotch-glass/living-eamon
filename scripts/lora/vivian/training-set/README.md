# Vivian LoRA — training-set/

Drop 20–25 curated PNGs here, each with a same-stem `.txt` caption sidecar.

- See `../../VIVIAN_LORA_PLAN.md` §2 and §3 for what to generate.
- See `../CAPTIONS.md` for the caption tag schema.

This directory is **gitignored** because (a) NSFW content shouldn't sit in a public repo and (b) the PNGs are ~2 MB each. Source-of-truth lives in R2 at `r2://living-eamon/training-data/vivian-pony-v1/`.

Local upload to R2:
```bash
./scripts/lora/sync-to-r2.sh ./scripts/lora/vivian/training-set training-data/vivian-pony-v1
```

Sanity check before upload:
```bash
ls *.png | wc -l         # expect 20–25
ls *.txt | wc -l         # must equal png count
for f in *.png; do test -f "${f%.png}.txt" || echo "MISSING CAPTION: $f"; done
```
