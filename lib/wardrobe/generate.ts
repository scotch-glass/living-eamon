// ============================================================
// LIVING EAMON — Wardrobe V2 · Grok Imagine generator
//
// Thin wrapper around the xAI Images API. Called by the V2
// body-combo forge (scripts/wardrobe/forge-body.ts) — centralizes
// the model, resolution, rembg pass, and variant-hash bookkeeping.
//
// Always uses `resolution: "2k"` (flat $0.07 per call — same as 1k
// on grok-imagine-image-pro, just 4× the pixels). Consumers feed
// the returned PNG buffer directly into `sharp` if they need to do
// additional processing.
// ============================================================

import crypto from "node:crypto";
import OpenAI from "openai";
import { grokImageToTransparentPng } from "../imageProcessing";

export interface GenerateArgs {
  /** Full Grok Imagine Pro prompt (identity block + body framing
   *  + pose lock + canonical framing, joined with spaces). */
  prompt: string;
  /** OpenAI SDK instance already configured against xAI's baseURL.
   *  Passed in (not imported) so scripts can inject the same
   *  credentials they already parsed from .env.local. */
  grok: OpenAI;
}

export interface GenerateResult {
  /** Transparent-PNG buffer (Grok JPEG → rembg). Ready for sharp. */
  png: Buffer;
  /** Short stable hash of the prompt. Used in piece filenames + DB
   *  rows so two prompt variants for the same item coexist. */
  variantHash: string;
  /** The prompt that was actually sent, for forensic logging. */
  prompt: string;
}

async function callGrokImaginePro(
  grok: OpenAI,
  prompt: string
): Promise<string> {
  // Model/resolution lock: grok-imagine-image-pro + 2k.
  const resp = await grok.images.generate({
    model: "grok-imagine-image-pro",
    prompt,
    response_format: "b64_json",
    aspect_ratio: "3:4",
    resolution: "2k",
  } as Parameters<typeof grok.images.generate>[0] & {
    aspect_ratio: string;
    resolution: string;
  });
  const b64 = (resp as { data?: { b64_json?: string }[] }).data?.[0]?.b64_json;
  if (!b64) throw new Error("Grok Imagine returned no image data");
  return b64;
}

/**
 * Run one Grok Imagine Pro generation, rembg the result, and
 * return a transparent-PNG Buffer plus a short variant hash.
 */
export async function generate(args: GenerateArgs): Promise<GenerateResult> {
  const b64 = await callGrokImaginePro(args.grok, args.prompt);
  const png = await grokImageToTransparentPng(b64);
  const variantHash = crypto
    .createHash("sha1")
    .update(args.prompt)
    .digest("hex")
    .slice(0, 10);
  return { png, variantHash, prompt: args.prompt };
}
