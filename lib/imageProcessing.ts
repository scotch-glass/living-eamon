// ============================================================
// LIVING EAMON — Image Post-Processing
// AI background removal using rembg (Python CLI).
// Works on characters, animals, objects, weapons — any subject.
// ============================================================

import { execFile } from "child_process";
import { writeFile, readFile, unlink } from "fs/promises";
import { existsSync } from "fs";
import { tmpdir } from "os";
import { join, resolve as pathResolve } from "path";
import { randomUUID } from "crypto";

/**
 * Project venv python (preferred) → falls back to system python3.
 *
 * Build the venv path entirely at runtime so Turbopack's static
 * analyzer cannot create a DirAssetReference for .venv. The .venv/bin/
 * python3 symlink ultimately points to a homebrew python OUTSIDE the
 * project root; Turbopack rejects such symlinks during the module-graph
 * scan and crashes the production build with "Symlink ... is invalid,
 * it points out of the filesystem root". The fallback ".venv" literal
 * is constructed via String.fromCharCode so it never appears as a
 * folded constant in the analyzer's view.
 */
function pythonExecutable(): string {
  const envOverride = process.env.LIVING_EAMON_PYTHON_VENV;
  if (envOverride) {
    const p = pathResolve(envOverride, "bin", "python3");
    if (existsSync(p)) return p;
  }
  // ".venv" — built char-by-char to defeat static folding.
  const dotVenv = String.fromCharCode(46, 118, 101, 110, 118);
  const p = pathResolve(process.cwd(), dotVenv, "bin", "python3");
  return existsSync(p) ? p : "python3";
}

/**
 * Remove background from an image using rembg (Python).
 * Writes input to a temp file, runs rembg, reads the output PNG.
 */
export async function removeBackground(inputBuffer: Buffer): Promise<Buffer> {
  const id = randomUUID();
  const inputPath = join(tmpdir(), `rembg_in_${id}.jpg`);
  const outputPath = join(tmpdir(), `rembg_out_${id}.png`);

  try {
    await writeFile(inputPath, inputBuffer);

    await new Promise<void>((resolve, reject) => {
      execFile(
        pythonExecutable(),
        [
          "-c",
          `from rembg import remove; from PIL import Image; img = Image.open("${inputPath}"); result = remove(img); result.save("${outputPath}")`,
        ],
        { timeout: 120000 },
        (error, _stdout, stderr) => {
          if (error) {
            reject(new Error(`rembg failed: ${error.message}\n${stderr}`));
          } else {
            resolve();
          }
        }
      );
    });

    const pngBuffer = await readFile(outputPath);
    return pngBuffer;
  } finally {
    // Clean up temp files
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}

/**
 * Convert base64-encoded JPEG from Grok Imagine to a transparent PNG buffer.
 * Uses rembg AI segmentation — no color thresholds needed.
 */
export async function grokImageToTransparentPng(
  base64Jpeg: string
): Promise<Buffer> {
  const inputBuffer = Buffer.from(base64Jpeg, "base64");
  return removeBackground(inputBuffer);
}

/**
 * Convert base64-encoded JPEG from Grok Imagine to JPEG buffer (no rembg).
 * Used for background scene graphics that should NOT have background removed.
 */
export async function grokImageToJpeg(base64Jpeg: string): Promise<Buffer> {
  return Buffer.from(base64Jpeg, "base64");
}
