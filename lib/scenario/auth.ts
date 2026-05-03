// ============================================================
// LIVING EAMON — Scenario.gg auth helper
//
// Reads SCENARIO_API_KEY + SCENARIO_API_SECRET from .env.local and
// builds the HTTP Basic auth header Scenario's REST API expects:
//
//   Authorization: Basic base64(KEY:SECRET)
//
// Used by lib/scenario/client.ts and any one-off scripts that need
// to talk to https://api.cloud.scenario.com/v1.
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

export interface ScenarioCredentials {
  key: string;
  secret: string;
}

/**
 * Read Scenario credentials from .env.local. Throws if either is
 * missing — there's no fallback to a public API key.
 */
export function getScenarioCredentials(): ScenarioCredentials {
  const key = readEnv("SCENARIO_API_KEY");
  const secret = readEnv("SCENARIO_API_SECRET");
  if (!key || !secret) {
    throw new Error(
      "Missing SCENARIO_API_KEY and/or SCENARIO_API_SECRET in .env.local. " +
        "Get them from https://app.scenario.gg/ → API Keys."
    );
  }
  return { key, secret };
}

/**
 * Build the literal Authorization header value for a Scenario REST call.
 * Returns e.g. "Basic aGVsbG86d29ybGQ=" (HTTP Basic, key:secret base64).
 */
export function getBasicAuthHeader(): string {
  const { key, secret } = getScenarioCredentials();
  const encoded = Buffer.from(`${key}:${secret}`).toString("base64");
  return `Basic ${encoded}`;
}
