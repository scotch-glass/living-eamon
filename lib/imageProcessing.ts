// ============================================================
// LIVING EAMON — Image Post-Processing
// AI background removal using rembg (Python CLI).
// Works on characters, animals, objects, weapons — any subject.
// ============================================================

import { execFile } from "child_process";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

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
        "python3",
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
