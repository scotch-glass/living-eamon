# Vivian LoRA — output/

Trained `.safetensors` lands here after pulling from R2:

```bash
./scripts/lora/sync-from-r2.sh trained-loras/vivian-pony-v1 ./scripts/lora/vivian/output
```

This directory is **gitignored** — safetensors are ~150–250 MB each and shouldn't bloat the repo. R2 is the source of truth at `r2://living-eamon/trained-loras/vivian-pony-v1/`.

Files expected after a successful run:
- `vivian-pony-v1.safetensors` — final weights
- `vivian-pony-v1-step00250.safetensors`, `-step00500.safetensors`, ... — mid-run checkpoints (kept per `save_last_n_steps` in the TOML)
- `samples/` — sample images rendered every 250 steps during training
- `logs/` — tensorboard logs

To pick the best checkpoint, eyeball `samples/` and grab whichever step the face/hair locked without overcooking. Often that's mid-run, not final.
