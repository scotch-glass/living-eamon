# Vivian Character LoRA — Training Plan (Pony Realism v23 SDXL)

**Status:** prep only. Nothing has been trained or rented. Read this whole doc before spending Vast credits.

**Goal:** train a single-character LoRA named `vivian-pony-v1` on top of **Pony Realism v23 SDXL** (`John6666/pony-realism-v23-sdxl` or whichever v23 mirror is current on HF — v22 is what's hard-coded in `anatomy-test-pony.py`; check before training). The LoRA will be used **only for NSFW eros-tagged scenes**. All clothed Vivian scenes continue to come from Grok Imagine Pro using the locked Vivian master.

**Non-goals:**
- This LoRA does not replace Grok for clothed art.
- This LoRA is not a runtime/game-time inference path — Living Eamon is pre-roll only ([memory: pre-roll image architecture](../../../.claude/projects/-Users-joshuamcclure-Desktop-living-eamon/memory/project_pre_roll_image_architecture.md)). The trained safetensors gets used by an offline batch script that generates Vivian's eros scenes, those PNGs are stored in Supabase Storage / R2, and the game serves the cached PNGs.

---

## 1. What's already in place vs what's new

| Asset | Status | Notes |
|---|---|---|
| Vast.ai account + $25 credit + API key | ✅ done | `.env.infrastructure` |
| Cloudflare R2 bucket | ✅ done | **Naming inconsistency:** `SESSION_001_VAST_R2_SETUP.md` says bucket name is `living-eamon-art`; `sync-{to,from}-r2.sh` and project_vast_r2_lora_stack memory say `living-eamon`. Verify which actually exists with `rclone lsd r2-living-eamon:` before uploading. Update either the doc or the scripts so they agree. |
| rclone remote `r2-living-eamon` | ✅ done | |
| SSH key `~/.ssh/vast_living_eamon` | ✅ done | |
| Pony Realism inference smoke-test | ✅ done | `scripts/lora/anatomy-test-pony.py` (uses **v22**, not v23 — bump the `PONY_REPO` constant if we want v23 for inference parity with training). |
| Frazetta/Vallejo style LoRA (Flux Dev) | dormant | Not relevant to Vivian. |
| ai-toolkit (Ostris) installation procedure | ✅ documented | **But ai-toolkit on Vast was set up for Flux Dev. For SDXL/Pony LoRAs the standard tool is `kohya_ss` (`sd-scripts`) — see §4.** |
| Vivian locked master image | ⚠️ **gated** | We need a Grok-generated, human-polished Vivian portrait locked as the canonical reference before any training data can be derived from it. **Until the master exists, training is blocked.** |

---

## 2. Training-data requirements

### Volume
- **Minimum 15, target 20–25, hard cap 30** training images. SDXL character LoRAs overfit fast above ~30; below ~15 they fail to generalize.
- All images at SDXL native resolution: **1024×1024** (or a Pony bucketed size such as 832×1216 / 1216×832).

### Variety (must cover all of these or the LoRA will only know one pose/lighting)
- **Angles:** front, 3/4 left, 3/4 right, profile left, profile right, slight low, slight high. Skip pure back-of-head and pure top-down.
- **Distances:** 4–6 close-up portraits (head + shoulders), 8–12 medium (waist up), 4–6 full body. Bias toward face-heavy framings — that's where identity lives.
- **Expressions:** neutral, soft smile, smirk, serious, eyes-closed, lips-parted. Avoid extremes (laughing, crying) which warp the face.
- **Lighting:** flat softbox, warm candlelight, cold moonlight, dappled, hard side-light. Do **not** use dramatic shadow on the face for >30% of the set or the LoRA learns "dramatic shadow = Vivian."
- **Backgrounds:** plain interior, draped fabric, wall, hearth, neutral exterior. **No** weapons, no other characters, no busy props in the training set — Pony's weapon rendering is broken and props leak into character identity.
- **Outfits:** mostly nude / lingerie / loose robe / minimal cloth (since the LoRA is for NSFW). 2–4 clothed images keep it from collapsing the body shape, but don't dominate.
- **Hair:** the canonical Vivian hairstyle in **all** images. If hair varies across the training set, the LoRA learns "Vivian = any hair," which kills identity. One style only.

### Source
All training images come from **Grok Imagine Pro using image-reference off the locked Vivian master**, not from Pony itself. Workflow:
1. Lock the Vivian master (Grok-generated + human-polished portrait, committed somewhere durable).
2. For each desired pose/angle/lighting combo, prompt Grok with the master as image-reference and the variant description.
3. Hand-curate down to 20–25 keepers. Reject any with weapon hallucinations, anatomy glitches, or hair drift.
4. Optionally light human-polish in Photoshop on the keepers (per [memory: session_003_lora_pivot_outcome](../../../.claude/projects/-Users-joshuamcclure-Desktop-living-eamon/memory/project_session_003_lora_pivot_outcome.md) — quality bar is highest on player-facing identity).
5. Place final PNGs in `scripts/lora/vivian/training-set/`. See `CAPTIONS.md` for the caption sidecar convention.

---

## 3. The variant-pose generation step (Grok)

This is the single largest manual block of work. Budget: half a day to a full day depending on Grok rejection rate.

For each row in the matrix below, generate 2–3 candidates with Grok image-reference and pick the best.

| # | Framing | Angle | Lighting | Notes |
|---|---|---|---|---|
| 1 | head/shoulders | front | softbox | identity anchor |
| 2 | head/shoulders | 3/4 left | softbox | |
| 3 | head/shoulders | 3/4 right | softbox | |
| 4 | head/shoulders | profile left | candlelight | |
| 5 | head/shoulders | profile right | candlelight | |
| 6 | head/shoulders | front, eyes-closed | softbox | |
| 7 | waist up | front | softbox | nude |
| 8 | waist up | 3/4 left | candlelight | nude |
| 9 | waist up | 3/4 right | candlelight | nude |
| 10 | waist up | front | moonlight | lingerie/robe |
| 11 | waist up | 3/4 left | hard side-light | nude |
| 12 | waist up | 3/4 right | hard side-light | nude |
| 13 | waist up | profile left | softbox | nude |
| 14 | waist up | profile right | softbox | nude |
| 15 | full body | front | softbox | nude, standing |
| 16 | full body | 3/4 left | candlelight | nude, standing |
| 17 | full body | front | warm interior | clothed (loose robe) |
| 18 | full body | 3/4 right | dappled | nude, reclining |
| 19 | full body | 3/4 left | moonlight | nude, seated |
| 20 | full body | front | hearth | clothed (lingerie) |

Add 5 spares to push to 25 if rejection rate is high.

**Hair stays identical in every row.** If Grok drifts hair, retry until it doesn't.

---

## 4. Training tool: kohya_ss / sd-scripts (NOT ai-toolkit)

The existing Vast pipeline uses **ai-toolkit (Ostris)**, which is the current standard for Flux Dev. **For Pony / SDXL LoRAs the de-facto standard in the community is kohya_ss `sd-scripts`** (specifically `sdxl_train_network.py`). Pony LoRA configs are widely shared in this format on Civitai / HF.

We use kohya_ss. ai-toolkit-for-SDXL exists but the Pony ecosystem expects kohya format and has battle-tested defaults there.

### Bootstrap commands for the Vast instance (paste in order, after SSH'ing in)

```bash
# 1. System libs (same as ai-toolkit gotchas — kohya needs cv2 too)
apt-get update -qq && apt-get install -y -qq libgl1 libglib2.0-0 unzip git curl

# 2. Clone kohya
cd /root
git clone --recursive https://github.com/kohya-ss/sd-scripts.git
cd sd-scripts
git checkout sdxl   # SDXL branch; if main has merged it skip this

# 3. Venv
python -m venv venv
source venv/bin/activate
pip install --upgrade pip wheel

# 4. Install kohya deps. kohya pins torch internally; verify after.
pip install -r requirements.txt
pip install xformers==0.0.29.post3 --index-url https://download.pytorch.org/whl/cu124

# 5. Force torch to match system CUDA (per feedback_torch_cuda_match.md)
pip install torch==2.6.0 torchvision==0.21.0 torchaudio==2.6.0 \
    --index-url https://download.pytorch.org/whl/cu124

# 6. Verify
python -c "import torch; assert torch.version.cuda.startswith('12'), torch.version.cuda; print('OK', torch.__version__, torch.version.cuda)"

# 7. Pull training set + base model from R2
mkdir -p /root/training/data /root/training/output /root/models
rclone copy r2-living-eamon:living-eamon/training-data/vivian-pony-v1/ /root/training/data/
# Base model (Pony Realism v23). Either download from HF or stage to R2 first.
# Option A: HF download (requires HF_TOKEN in env)
huggingface-cli download John6666/pony-realism-v23-sdxl model.safetensors --local-dir /root/models/pony-realism-v23
# Option B: pre-stage in R2 first then rclone copy r2-living-eamon:living-eamon/base-models/pony-realism-v23/ /root/models/pony-realism-v23/

# 8. Drop config
mkdir -p /root/training/configs
# scp scripts/lora/vivian/configs/vivian-pony-v1.toml from local → /root/training/configs/

# 9. Launch (background, log to file)
cd /root/sd-scripts
source venv/bin/activate
nohup accelerate launch --num_cpu_threads_per_process=4 sdxl_train_network.py \
    --config_file=/root/training/configs/vivian-pony-v1.toml \
    > /root/training/training.log 2>&1 &

# 10. Tail
tail -f /root/training/training.log
```

When training finishes:

```bash
# Copy result back to R2
rclone copy /root/training/output/ r2-living-eamon:living-eamon/trained-loras/vivian-pony-v1/

# CRITICAL — destroy the instance (meter runs until destroyed)
# From local machine:
# vastai destroy instance <id>
```

Then locally:

```bash
cd /Users/joshuamcclure/Desktop/living-eamon
./scripts/lora/sync-from-r2.sh trained-loras/vivian-pony-v1 ./scripts/lora/vivian/output
```

---

## 5. Vast.ai instance recommendation

| GPU | VRAM | $/hr (Vast verified, R≥99.9%) | SDXL LoRA training time (1500 steps, batch 1, rank 32) | Verdict |
|---|---|---|---|---|
| RTX 4090 | 24 GB | ~$0.36 | ~50–70 min | **Recommended.** SDXL LoRA at rank ≤32 fits fine in 24 GB. Cheapest viable. |
| A6000 | 48 GB | ~$0.55 | ~50 min | Overkill for rank 32; only justified at rank 64+ or batch 2. |
| A100 80GB | 80 GB | ~$1.20 | ~30 min | Faster but 3× the cost — not worth it for one character LoRA. |
| H100 SXM | 80 GB | ~$1.68 | ~20 min | Way too expensive for this size run. Save for inference / Flux. |

**Pick:** RTX 4090, 24 GB, R≥99.9%, disk ≥80 GB (Pony Realism base = ~7 GB, training set = ~50 MB, kohya cache + venv + outputs = ~30 GB headroom). Search command:

```bash
vastai search offers 'reliability > 0.99 num_gpus=1 gpu_name=RTX_4090 dph_total < 0.50 disk_space >= 80'
```

---

## 6. Training config — see `configs/vivian-pony-v1.toml`

Hyperparameter defaults (filled into the TOML, can be tuned):

| Param | Value | Why |
|---|---|---|
| network_module | `networks.lora` | standard kohya LoRA |
| network_dim (rank) | 32 | character LoRAs: 16–32 is the sweet spot. 64+ overfits on small sets. |
| network_alpha | 16 | half of rank — community standard for character LoRAs |
| learning_rate | 1e-4 | Pony LoRA community default |
| unet_lr | 1e-4 | match LR |
| text_encoder_lr | 5e-5 | half of unet — Pony's text encoders are sensitive |
| optimizer_type | `AdamW8bit` | VRAM-cheap, well-tested |
| lr_scheduler | `cosine_with_restarts` | |
| max_train_steps | 1500 | for 20–25 images at batch 1, ~60 epochs. Tune based on sample quality. |
| save_every_n_steps | 250 | mid-run checkpoints — early epochs may already be the best |
| sample_every_n_steps | 250 | render 4 sample prompts each checkpoint |
| train_batch_size | 1 | safe for 24 GB at 1024 res |
| resolution | `1024,1024` | SDXL native |
| enable_bucket | true | so 832×1216 images don't get squashed |
| min_bucket_reso | 832 | |
| max_bucket_reso | 1216 | |
| mixed_precision | `bf16` | 4090 supports it, faster than fp16 |
| gradient_checkpointing | true | shaves VRAM, small speed cost |
| caption_extension | `.txt` | sidecar caption files |
| shuffle_caption | true | helps generalize |
| keep_tokens | 1 | always keep the trigger word at position 0 — never shuffled out |

---

## 7. Trigger word convention

- **Trigger:** `vivian1` (lowercase, single token, numeric suffix to avoid colliding with the English word "vivian" if Pony's text encoder has it).
- Every caption `.txt` file starts with `vivian1, ` as the first token.
- At inference, prompts include `vivian1` in the score-tag prefix, e.g.:
  ```
  score_9, score_8_up, score_7_up, score_6_up, rating_explicit, source_realistic, vivian1, <pose/scene description>
  ```

---

## 8. Captioning convention

See `scripts/lora/vivian/CAPTIONS.md` for the full schema. tl;dr: Pony uses booru-style tags. Each `.txt` looks like:

```
vivian1, 1girl, solo, score_9, source_realistic, <hair tag>, <eye tag>, <pose tag>, <framing>, <lighting>, <outfit>, <expression>
```

What we **don't** tag = what we want the LoRA to bake in (face shape, body proportions, identity).

---

## 9. R2 layout

```
r2://living-eamon/  (or living-eamon-art — verify which exists)
├── training-data/
│   └── vivian-pony-v1/
│       ├── 01_front_softbox_closeup.png
│       ├── 01_front_softbox_closeup.txt
│       ├── 02_3q_left_softbox_closeup.png
│       ├── 02_3q_left_softbox_closeup.txt
│       └── ... (20–25 pairs)
├── base-models/                          (optional — pre-stage to avoid HF round-trip)
│   └── pony-realism-v23/
│       └── model.safetensors
└── trained-loras/
    └── vivian-pony-v1/
        ├── vivian-pony-v1.safetensors    (final)
        ├── vivian-pony-v1-step00250.safetensors
        ├── vivian-pony-v1-step00500.safetensors
        ├── ...
        └── samples/
            └── ...
```

---

## 10. Cost + time estimate

| Phase | Time | Cost (RTX 4090 @ $0.36/hr) |
|---|---|---|
| Setup (apt, clone, pip, model download) | ~25 min | $0.15 |
| Training (1500 steps, ~22 imgs, batch 1) | ~60 min | $0.36 |
| Sample generation during training (6 prompts × 6 checkpoints) | ~10 min (interleaved) | $0.06 |
| R2 upload of result | ~2 min | $0.01 |
| **Buffer for first-run debugging** | ~30 min | $0.18 |
| **Total per run** | **~2 hr** | **~$0.75** |

If first run is ugly, budget for **2–3 runs** while tuning rank/LR/steps = **~$2.25 total**.

Inference (after training, to generate the eros scenes): bigger H100 makes sense for batch generation but 4090 still works fine — Pony at 1216×832 is ~12s/image on a 4090. 100 final scenes ≈ 25 min ≈ $0.15.

---

## 11. How we test the resulting LoRA

After downloading the safetensors locally, run a sanity inference. Either:
- **Locally** in ComfyUI / a1111 (if Scotch has it set up), or
- **On Vast** with a quick `diffusers`-based script modeled on `anatomy-test-pony.py`, with `pipe.load_lora_weights(...)` added.

### Sample prompts (run all of these, eyeball the grid)

```
score_9, score_8_up, score_7_up, score_6_up, rating_safe, source_realistic, vivian1, 1girl, solo, head and shoulders portrait, soft window light, neutral expression
score_9, score_8_up, source_realistic, vivian1, 1girl, solo, candlelit chamber, three quarter view, faint smile
score_9, source_realistic, vivian1, 1girl, solo, full body, standing, plain stone wall, soft light
score_9, rating_explicit, source_realistic, vivian1, 1girl, solo, nude, reclining on furs, candlelight, anatomically correct breasts and pink nipples, nipples visible
score_9, rating_explicit, source_realistic, vivian1, 1girl, solo, topless, three quarter view, warm hearth light, anatomically correct breasts and pink nipples, nipples visible
score_9, source_realistic, vivian1, 1girl, solo, full body, walking from a bath, towel held to one side
```

Expected: same face, same hair, same body proportions across all six. Lighting/pose vary.

Unexpected (sign LoRA is bad — re-train):
- Face drifts between prompts
- Hair changes color or style
- Body proportions vary wildly
- Trigger has no effect (= LoRA undertrained, raise steps)
- Output looks identical regardless of prompt (= overtrained, lower steps or rank)

If overtrained: roll back to an earlier checkpoint (`-step00750.safetensors` instead of final).

### LoRA strength
Per [feedback_lora_inference_rules.md](../../../.claude/projects/-Users-joshuamcclure-Desktop-living-eamon/memory/feedback_lora_inference_rules.md), default to **strength 0.5** for the first test. Character LoRAs may want 0.7–0.9 — re-validate with the sample grid above and pick the strength where identity is locked but Pony's anatomical detail still comes through.

---

## 12. Open gotchas / things future-Claude should know

1. **Bucket-name discrepancy.** `SESSION_001_VAST_R2_SETUP.md` says `living-eamon-art`; sync scripts say `living-eamon`. Verify which exists before any upload. Fix whichever is wrong.
2. **Pony version.** `anatomy-test-pony.py` hardcodes `John6666/pony-realism-v22-mainvae-sdxl-spo`. If we want v23 for inference parity, bump that constant. Confirm v23 is actually published on HF before training — fall back to v22 if not.
3. **Painterly Pony has fluid artifacts** when `rating_explicit` + painterly tags combine. For Vivian eros scenes use realistic mode (no painterly tags). See [project_pony_nsfw_backup_pipeline](../../../.claude/projects/-Users-joshuamcclure-Desktop-living-eamon/memory/project_pony_nsfw_backup_pipeline.md).
4. **ai-toolkit ≠ kohya.** The existing Vast bootstrap doc and the gotchas memory are about ai-toolkit. Kohya needs the same three system patches (libgl1, torch+cu124, etc.) but has its own dependency tree — don't blindly reuse the ai-toolkit venv.
5. **Vivian master is gated.** No training data can be derived until the locked Grok+polish master exists. Step 0.
6. **Hair invariance.** The single biggest cause of weak character LoRAs is hair drift across the training set. Reject hard.
7. **Pony's 1girl bias.** Helps for Vivian (she's `1girl`). If we ever train a male character LoRA on Pony, see the male-tag negative prompts in the Pony pipeline memory.
8. **Destroy the Vast instance.** The meter runs until destroyed. There's no auto-shutdown.
