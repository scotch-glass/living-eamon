# Scenario.gg client — Claude Context (scoped)

> **You are working on the Scenario.gg integration.** Load this file INSTEAD of the root `CLAUDE_CONTEXT.md` when touching code under [lib/scenario/](.) or [scripts/scenario/](../../scripts/scenario/). Skip wardrobe, combat, mana, body-zone combat, adventures, PD lore unless expressly relevant.

---

## 0 · Phase + status (2026-04-26)

`lib/scenario/` is the **project-wide AI client** for Scenario.gg's Flux 2 + LoRA workflows. Built 2026-04-26 as part of the painter-style-LoRA training spike (see `lib/wardrobe/CLAUDE_CONTEXT.md §13` for the broader spike). First real caller: [scripts/scenario/train-style-lora.ts](../../scripts/scenario/train-style-lora.ts).

Anticipated future callers (per Scotch's project-wide framing): hero-master regeneration, NPC sprite generation, monster art, scene backgrounds, item icons, eventually the per-item gear V3 system. The auth + client wrapper are written to support all of them — only the client surface (which endpoints we wrap) grows.

## 1 · Module shape

```
lib/scenario/
  auth.ts             ← reads SCENARIO_API_KEY + SCENARIO_API_SECRET; builds Basic header
  client.ts           ← thin REST wrapper covering /projects, /models, /generate
  types.ts            ← TypeScript types for request/response shapes
  index.ts            ← public barrel — only entry point for outside code
  CLAUDE_CONTEXT.md   ← this file
```

ESLint barrel rule (in [eslint.config.mjs](../../eslint.config.mjs)) blocks any reach into `lib/scenario/{auth,client,types}` from outside the module — consumers import from `lib/scenario` only. Same pattern as `lib/wardrobe/`.

## 2 · Public API

```ts
import {
  // auth
  getScenarioCredentials,
  getBasicAuthHeader,
  // models
  listProjects,
  getDefaultProjectId,
  createModel,
  getModel,
  uploadTrainingImage,
  startTraining,
  // generation
  generate,
  // types
  type ScenarioModel,
  type ScenarioModelType,
  type TrainingParameters,
  type GenerateRequest,
} from "lib/scenario";
```

`getDefaultProjectId()` is the convenience helper — it queries `/v1/projects`, returns the first project's ID. For Scotch's account that's `proj_kywBK8L5fhs2h4SsUFMw9GZR` ("Living Eamon").

## 3 · Auth model

HTTP Basic with API key + API secret, base64-encoded together:

```
Authorization: Basic <base64(KEY:SECRET)>
```

Both values live in `.env.local` as `SCENARIO_API_KEY` and `SCENARIO_API_SECRET`. The auth module reads them lazily on each call (so adding/removing keys doesn't require a process restart).

API keys are **project-scoped** at the Scenario side — a key issued for one project can't access another project's models. The single `Living Eamon` project ID is auto-discovered via `listProjects()`.

## 4 · Endpoints wrapped (so far)

| Endpoint | Wrapper | Purpose |
|--|--|--|
| `GET  /v1/projects` | `listProjects()` / `getDefaultProjectId()` | Discover account scope |
| `POST /v1/models?projectId=...` | `createModel(projectId, body)` | Create a model entry (must precede image upload) |
| `POST /v1/models/{id}/training-images?projectId=...` | `uploadTrainingImage(projectId, modelId, body)` | Upload one training image (base64 data URI + optional caption) |
| `PUT  /v1/models/{id}/train?projectId=...` | `startTraining(projectId, modelId, params)` | Kick off LoRA training |
| `GET  /v1/models/{id}?projectId=...` | `getModel(projectId, modelId)` | Status polling — `status: "draft" \| "training" \| "trained" \| "failed"` |
| `POST /v1/generate?projectId=...` | `generate(projectId, body)` | Image generation (shape verified at first use) |

When new endpoints are needed (asset listing, model deletion, etc.), add to `client.ts` and re-export through `index.ts`.

## 5 · Plan to follow when extending

- Always reuse `call<T>(...)` in `client.ts` — don't write parallel `fetch` paths. It centralizes auth header injection, error handling, and timeout control.
- New endpoint = three things: a method in `client.ts`, types added to `types.ts` if the request/response shape is non-trivial, and a re-export in `index.ts`. Don't skip the barrel re-export — outside code can't reach internal modules due to ESLint.
- For long-running operations (>60s), bump the per-call `timeoutMs`. Default is 60s; uploads of big images get 180s.
- When iterating on a new endpoint and the response shape isn't documented, type the response as `unknown` initially and `console.log(JSON.stringify(resp))` to discover the shape; then promote to a proper interface in `types.ts`.

## 6 · Pricing reference (2026-04-26 scrape, confirm before big runs)

- Pro tier: $45/mo, includes Flux 2 Dev LoRA training.
- LoRA training cost: ~$15 per training run (1500 steps × default params).
- Image generation: ~$0.07 per image at 2k (Flux 2 Dev), confirmed via wardrobe-spike pricing analysis.

## 7 · Open items

- **Generation endpoint shape** — `POST /v1/generate?projectId=...` is wrapped but the exact request body shape (especially LoRA stacking via `additionalModelIds`) hasn't been verified against a live call yet. First validation run after the style-LoRA training will confirm; update `types.ts` and `client.ts` if discovered shape differs.
- **Asset upload alternative** — Scenario also supports uploading to `/assets` first then referencing by `assetIds[]` in training-image batches. Not implemented; `uploadTrainingImage` does base64-data-URI uploads one at a time. Fine for ~50 images per LoRA; revisit if we ever batch hundreds.
- **Webhook polling** — currently `getModel()` polls. Scenario supports webhooks for training completion; not wired.
