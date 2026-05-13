// ============================================================
// Voice audio — Supabase Storage backend (CF-1.5).
//
// Bucket: creator-audio (private). Keys:
//   voice/<audioId>/v<N>.mp3       — audio versions, append-only
//                                    (xAI /v1/tts returns mp3 bytes
//                                    directly)
//   voice/<audioId>/metadata.json  — sidecar: text, status,
//                                    approvedVersion, contentType
//
// Note: any legacy `.wav` versions from the brief realtime-agent
// experiment are still served correctly — the file extension is
// derived per-version from the stored contentType, not hardcoded.
//
// audioId is a slug-like stable id (a-z0-9_-). The reader panel
// knows the audioId for the prose it's showing; the admin review
// surface lists audioIds by status (pending|rejected|approved).
//
// Approval workflow (matches /admin/destination-review pattern):
//   - generate → status="pending", appends a new version
//   - approve  → status="approved", approvedVersion = latest version
//   - reject   → status="rejected", approvedVersion = null
//   - regen    → same as generate (new version, status flips back
//                to pending)
//
// Server-only. Service-role key.
// ============================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "creator-audio";
const VOICE_PREFIX = "voice";
const METADATA_FILE = "metadata.json";

const AUDIO_ID_RE = /^[a-z0-9][a-z0-9_-]{0,127}$/;

export function isValidAudioId(id: string): boolean {
  return AUDIO_ID_RE.test(id);
}

function voiceDir(audioId: string): string {
  if (!isValidAudioId(audioId)) {
    throw new Error(`Invalid audio id: ${audioId}`);
  }
  return `${VOICE_PREFIX}/${audioId}`;
}

function metadataKey(audioId: string): string {
  return `${voiceDir(audioId)}/${METADATA_FILE}`;
}

function extensionForContentType(contentType: string): string {
  if (contentType.includes("wav")) return "wav";
  if (contentType.includes("mpeg") || contentType.includes("mp3")) return "mp3";
  return "audio"; // safe fallback
}

function versionKey(
  audioId: string,
  version: number,
  contentType: string = "audio/wav",
): string {
  return `${voiceDir(audioId)}/v${version}.${extensionForContentType(contentType)}`;
}

// ── Client ────────────────────────────────────────────────────

let cached: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase URL + service key not configured (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY)",
    );
  }
  cached = createClient(url, key);
  return cached;
}

let bucketReady = false;

async function ensureBucket(): Promise<void> {
  if (bucketReady) return;
  const supabase = getClient();
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(`listBuckets: ${error.message}`);
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024, // 10 MB per audio file
    });
    if (createErr) throw new Error(`createBucket: ${createErr.message}`);
  }
  bucketReady = true;
}

// ── Metadata schema ───────────────────────────────────────────

export type VoiceStatus = "pending" | "approved" | "rejected";

export interface VoiceVersionMeta {
  version: number;
  generatedAt: string;       // ISO
  text: string;              // the input text that was synthesized
  /**
   * If the caller passed a non-canonical agent system prompt for this
   * version, it's stored here for audit + regen-reproducibility.
   * Almost always undefined (we use EVE_STANDING_PROMPT).
   */
  instructionsOverride?: string;
  bytes: number;
  contentType: string;
}

export interface VoiceMetadata {
  audioId: string;
  /**
   * The CANONICAL script for this audio. Two roles:
   *   1. What the player reads in the Reader Panel.
   *   2. What the next regenerate-audio call uses as input.
   * Admin edits in /admin/audio-review update this field directly.
   * Each generated version also stores a snapshot in versions[i].text
   * for audit; the live "what the player sees" is currentScript.
   */
  currentScript: string;
  /** Latest version number (== versions[versions.length-1].version when present). */
  latestVersion: number | null;
  /** Version number flipped to live by an admin approval; null until approved. */
  approvedVersion: number | null;
  status: VoiceStatus;
  versions: VoiceVersionMeta[];
  /** Last-touched. */
  updatedAt: string;
}

function emptyMetadata(audioId: string): VoiceMetadata {
  return {
    audioId,
    currentScript: "",
    latestVersion: null,
    approvedVersion: null,
    status: "pending",
    versions: [],
    updatedAt: new Date(0).toISOString(),
  };
}

// ── Metadata read/write ───────────────────────────────────────

export async function readMetadata(audioId: string): Promise<VoiceMetadata> {
  await ensureBucket();
  const supabase = getClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(metadataKey(audioId));
  if (error) {
    if (/not\s*found/i.test(error.message)) return emptyMetadata(audioId);
    throw new Error(`download metadata ${audioId}: ${error.message}`);
  }
  const text = await data.text();
  return JSON.parse(text) as VoiceMetadata;
}

async function writeMetadata(meta: VoiceMetadata): Promise<void> {
  await ensureBucket();
  const supabase = getClient();
  const body = JSON.stringify(meta, null, 2) + "\n";
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(metadataKey(meta.audioId), body, {
      contentType: "application/json",
      upsert: true,
    });
  if (error) throw new Error(`upload metadata ${meta.audioId}: ${error.message}`);
}

// ── Audio versions ────────────────────────────────────────────

export async function uploadVersion(
  audioId: string,
  audio: ArrayBuffer,
  contentType: string,
  text: string,
  instructionsOverride: string | undefined,
): Promise<VoiceMetadata> {
  await ensureBucket();
  const supabase = getClient();
  const meta = await readMetadata(audioId);
  const nextVersion = (meta.latestVersion ?? 0) + 1;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(versionKey(audioId, nextVersion, contentType), audio, {
      contentType,
      upsert: false,
    });
  if (error) throw new Error(`upload v${nextVersion} ${audioId}: ${error.message}`);

  const ver: VoiceVersionMeta = {
    version: nextVersion,
    generatedAt: new Date().toISOString(),
    text,
    instructionsOverride,
    bytes: audio.byteLength,
    contentType,
  };
  const updated: VoiceMetadata = {
    ...meta,
    // Each generate sets currentScript = the text just synthesized.
    // Audio + script stay in sync after a generate; later admin edits
    // in /admin/audio-review can drift script away from the approved
    // version's text (we surface that as a warning in the UI).
    currentScript: text,
    versions: [...meta.versions, ver],
    latestVersion: nextVersion,
    status: "pending",
    // Regenerating does NOT auto-revoke a prior approval — admin must
    // explicitly approve the new version. This matches the
    // destination-review semantics where a regen is "submitted, awaiting
    // re-review."
    updatedAt: ver.generatedAt,
  };
  await writeMetadata(updated);
  return updated;
}

/**
 * Update the canonical script for an audioId. Does NOT regenerate
 * audio — the admin is responsible for hitting Regenerate if they
 * want the audio to match. The UI surfaces drift between the
 * approved version's `text` and the new currentScript.
 */
export async function updateScript(
  audioId: string,
  script: string,
): Promise<VoiceMetadata> {
  const meta = await readMetadata(audioId);
  const updated: VoiceMetadata = {
    ...meta,
    currentScript: script,
    updatedAt: new Date().toISOString(),
  };
  await writeMetadata(updated);
  return updated;
}

export async function setApproval(
  audioId: string,
  decision: "approved" | "rejected",
  version: number,
): Promise<VoiceMetadata> {
  const meta = await readMetadata(audioId);
  if (!meta.versions.find((v) => v.version === version)) {
    throw new Error(`version ${version} not found for ${audioId}`);
  }
  const updated: VoiceMetadata = {
    ...meta,
    status: decision,
    approvedVersion: decision === "approved" ? version : null,
    updatedAt: new Date().toISOString(),
  };
  await writeMetadata(updated);
  return updated;
}

// ── Signed URL for playback ───────────────────────────────────

const SIGNED_URL_EXPIRES_SECS = 60 * 60; // 1 hour

export async function getSignedUrlForApproved(
  audioId: string,
): Promise<string | null> {
  const meta = await readMetadata(audioId);
  if (meta.approvedVersion == null || meta.status !== "approved") return null;
  return getSignedUrlForVersion(audioId, meta.approvedVersion);
}

export async function getSignedUrlForVersion(
  audioId: string,
  version: number,
): Promise<string> {
  await ensureBucket();
  const supabase = getClient();
  // Look up the version's contentType so we sign the right file extension.
  // Legacy versions written before the contentType plumbing default to wav.
  const meta = await readMetadata(audioId);
  const ver = meta.versions.find((v) => v.version === version);
  const contentType = ver?.contentType ?? "audio/wav";
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(
      versionKey(audioId, version, contentType),
      SIGNED_URL_EXPIRES_SECS,
    );
  if (error || !data) {
    throw new Error(
      `signed-url v${version} ${audioId}: ${error?.message ?? "no data"}`,
    );
  }
  return data.signedUrl;
}

// ── Listing for admin review ──────────────────────────────────

export interface AudioListEntry {
  audioId: string;
  status: VoiceStatus;
  latestVersion: number | null;
  approvedVersion: number | null;
  textPreview: string;
  updatedAt: string;
}

export async function listAudio(): Promise<AudioListEntry[]> {
  await ensureBucket();
  const supabase = getClient();
  const { data: folders, error } = await supabase.storage.from(BUCKET).list(
    VOICE_PREFIX,
    { limit: 1000, sortBy: { column: "updated_at", order: "desc" } },
  );
  if (error) throw new Error(`list voice: ${error.message}`);
  const out: AudioListEntry[] = [];
  for (const folder of folders ?? []) {
    if (!isValidAudioId(folder.name)) continue;
    try {
      const meta = await readMetadata(folder.name);
      // Prefer currentScript for the preview (the canonical text);
      // fall back to the latest version's text for legacy entries
      // that pre-date the currentScript field.
      const preview =
        meta.currentScript ||
        meta.versions[meta.versions.length - 1]?.text ||
        "";
      out.push({
        audioId: meta.audioId,
        status: meta.status,
        latestVersion: meta.latestVersion,
        approvedVersion: meta.approvedVersion,
        textPreview: preview.slice(0, 120),
        updatedAt: meta.updatedAt,
      });
    } catch {
      // skip unreadable
    }
  }
  return out;
}
