# Audio · Voice

Player-facing voice narration (Eve, xAI TTS) for the Reader Panel.

This folder is the organizational mirror of the canonical storage:

- **Canonical store:** Supabase Storage bucket `creator-audio`, path
  `voice/<audioId>/v<N>.mp3` plus a sidecar `metadata.json`.
- **Why not the local filesystem:** Vercel's serverless functions have
  a read-only filesystem at runtime, same constraint that forced
  module manifests onto Supabase Storage in CF-0.
- **Pipeline:**
  1. Admin/Creator authors prose, requests voice via the Reader Panel
     editor or admin tool. `POST /api/voice/generate` calls xAI TTS,
     stores the mp3 in the bucket, updates the metadata sidecar.
  2. Audio appears in `/admin/audio-review` (pending status).
  3. Admin plays, approves / rejects / requests regen with a tweaked
     prompt. Approval flips a version to `approvedVersion`.
  4. At runtime, the Reader Panel fetches the **approved** version
     only via `GET /api/voice/<audioId>`. Pending/rejected versions
     never reach the player.
- **Standing prompt** for Eve is in `lib/voice/eve.ts`. Voice:
  Barcelona-accented, slow, deep, commanding, Howard-voice
  grimdark sword-and-sorcery delivery.
- **Player opt-in:** voice defaults to OFF. The player toggles it on
  via the speaker icon on the Reader Panel; preference persists in
  localStorage. A future Settings page will surface the same toggle.
