// ========================================================================
// LIVING EAMON — Wardrobe · create the wardrobe-layers storage bucket
//
// Idempotent: safe to run multiple times. Skips creation if the bucket
// already exists.
//
// Usage:  npx tsx scripts/wardrobe/create-bucket.ts
// ========================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");

function readEnv(key: string): string | null {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return null;
  const raw = fs.readFileSync(envPath, "utf8");
  const line = raw.split(/\r?\n/).find((l) => l.trim().startsWith(`${key}=`));
  if (!line) return null;
  return line.slice(`${key}=`.length).trim().replace(/^["']|["']$/g, "");
}

const SUPABASE_URL = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_SERVICE_KEY = readEnv("SUPABASE_SERVICE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const BUCKET = "wardrobe-layers";

async function main(): Promise<void> {
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    console.error("ERROR listing buckets:", listErr.message);
    process.exit(1);
  }
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (exists) {
    console.log(`Bucket '${BUCKET}' already exists — nothing to do.`);
    return;
  }

  const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5 MB — a single 1024x1365 PNG is ~1 MB
  });
  if (createErr) {
    console.error("ERROR creating bucket:", createErr.message);
    process.exit(1);
  }
  console.log(`Bucket '${BUCKET}' created (public).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
