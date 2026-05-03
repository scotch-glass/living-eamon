# Vivian LoRA — configs/

Training configs (TOML) for kohya_ss / sd-scripts.

- `vivian-pony-v1.toml` — initial run. Rank 32, alpha 16, 1500 steps, AdamW8bit, cosine. See `../../VIVIAN_LORA_PLAN.md` §6.

When tuning, copy to a new file (`vivian-pony-v2.toml`) rather than editing in place — keeping prior configs lets us reproduce earlier runs.

TODO markers in the TOML indicate values that must be set before launch (paths, sample-prompt file).
