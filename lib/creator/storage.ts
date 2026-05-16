// ============================================================
// Creator Forge — Supabase Storage backend for module drafts
// (Sprint CF-0).
//
// Drafts live in the `creator-modules` storage bucket (private),
// keyed as `<moduleId>/module.json` (Sprint CF-1+ add main.ink,
// map.svg, rooms/, npcs/). Works on Vercel (no local filesystem)
// and across devices.
//
// Module ids are slug-like (a-z0-9_-, max 64) and validated before
// every Storage call to keep path-traversal off the table.
//
// Server-only — uses the service-role key. Imported only from
// server components and route handlers under app/api/creator/.
// ============================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "creator-modules";
const MANIFEST_FILE = "module.json";

const MODULE_ID_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;

export function isValidModuleId(id: string): boolean {
  return MODULE_ID_RE.test(id);
}

function manifestKey(moduleId: string): string {
  if (!isValidModuleId(moduleId)) {
    throw new Error(`Invalid module id: ${moduleId}`);
  }
  return `${moduleId}/${MANIFEST_FILE}`;
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

// ── Bucket bootstrap (idempotent) ──────────────────────────────

let bucketReady = false;

async function ensureBucket(): Promise<void> {
  if (bucketReady) return;
  const supabase = getClient();
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(`listBuckets: ${error.message}`);
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: 5 * 1024 * 1024,
    });
    if (createErr) throw new Error(`createBucket: ${createErr.message}`);
  }
  bucketReady = true;
}

// ── Manifest ──────────────────────────────────────────────────

export interface ModuleManifestStub {
  id: string;
  name: string;
  // Sprint CF-1 fills out the rest (rooms, atoms, etc).
  [key: string]: unknown;
}

export async function readManifest(
  moduleId: string,
): Promise<ModuleManifestStub | null> {
  await ensureBucket();
  const supabase = getClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(manifestKey(moduleId));
  if (error) {
    // Supabase returns a 400-ish "object not found" error rather than ENOENT.
    if (/not\s*found/i.test(error.message)) return null;
    throw new Error(`download ${moduleId}: ${error.message}`);
  }
  const text = await data.text();
  return JSON.parse(text) as ModuleManifestStub;
}

export async function writeManifest(
  moduleId: string,
  manifest: ModuleManifestStub,
): Promise<void> {
  await ensureBucket();
  const supabase = getClient();
  const body = JSON.stringify(manifest, null, 2) + "\n";
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(manifestKey(moduleId), body, {
      contentType: "application/json",
      upsert: true,
    });
  if (error) throw new Error(`upload ${moduleId}: ${error.message}`);
}

// ── Module listing ────────────────────────────────────────────

export interface ModuleListing {
  id: string;
  name: string;
  updatedAt: string;
}

export async function listModules(): Promise<ModuleListing[]> {
  await ensureBucket();
  const supabase = getClient();
  const { data: folders, error } = await supabase.storage.from(BUCKET).list("", {
    limit: 1000,
    sortBy: { column: "updated_at", order: "desc" },
  });
  if (error) throw new Error(`list: ${error.message}`);
  const out: ModuleListing[] = [];
  for (const folder of folders ?? []) {
    if (!isValidModuleId(folder.name)) continue;
    try {
      const manifest = await readManifest(folder.name);
      if (!manifest) continue;
      out.push({
        id: folder.name,
        name: typeof manifest.name === "string" ? manifest.name : folder.name,
        updatedAt: folder.updated_at ?? folder.created_at ?? new Date().toISOString(),
      });
    } catch {
      // skip unreadable folders
    }
  }
  return out;
}

export async function deleteModule(moduleId: string): Promise<void> {
  await ensureBucket();
  const supabase = getClient();
  if (!isValidModuleId(moduleId)) {
    throw new Error(`Invalid module id: ${moduleId}`);
  }
  const { data: contents, error: listErr } = await supabase.storage
    .from(BUCKET)
    .list(moduleId, { limit: 1000 });
  if (listErr) throw new Error(`list ${moduleId}: ${listErr.message}`);
  const keys = (contents ?? []).map((c) => `${moduleId}/${c.name}`);
  if (keys.length === 0) return;
  const { error: rmErr } = await supabase.storage.from(BUCKET).remove(keys);
  if (rmErr) throw new Error(`remove ${moduleId}: ${rmErr.message}`);
}
