// useFigureHeight — measure the alpha bounding box of a transparent
// PNG sprite so the arena can scale by the figure (not the canvas).
//
// Why: combat sprite PNGs vary in how much transparent margin sits
// around the figure. CSS `objectFit: contain` scales by canvas
// dimensions, so a sprite with lots of empty margin renders smaller
// than one whose figure fills its canvas. Measuring the alpha bbox
// lets the arena pin every combatant's figure to the same on-screen
// height regardless of source PNG composition.
//
// The hook loads the image off-screen, draws it to a canvas, scans
// the alpha channel for the figure's bounding box, and returns the
// figure dimensions in image-space pixels. Results are cached
// per-URL so subsequent renders are instant.
"use client";

import { useEffect, useState } from "react";
import { targetFigureHeightPx, type SizeClass } from "../art/sizeClasses";

export interface FigureMetrics {
  /** Width of the alpha bbox in image-space pixels. */
  figureWidthPx: number;
  /** Height of the alpha bbox in image-space pixels. */
  figureHeightPx: number;
  /** Source canvas width. */
  intrinsicWidthPx: number;
  /** Source canvas height. */
  intrinsicHeightPx: number;
  /** Top-left x of the alpha bbox inside the canvas. */
  figureLeftPx: number;
  /** Top-left y of the alpha bbox inside the canvas. */
  figureTopPx: number;
  /** False until the image has loaded and been measured. */
  ready: boolean;
}

const ZERO: FigureMetrics = {
  figureWidthPx: 0,
  figureHeightPx: 0,
  intrinsicWidthPx: 0,
  intrinsicHeightPx: 0,
  figureLeftPx: 0,
  figureTopPx: 0,
  ready: false,
};

const cache = new Map<string, Omit<FigureMetrics, "ready">>();

const ALPHA_THRESHOLD = 8;

export function useFigureHeight(spriteUrl: string | null): FigureMetrics {
  const cached = spriteUrl ? cache.get(spriteUrl) : undefined;
  const [metrics, setMetrics] = useState<Omit<FigureMetrics, "ready"> | null>(
    cached ?? null,
  );

  useEffect(() => {
    if (!spriteUrl) {
      setMetrics(null);
      return;
    }
    const c = cache.get(spriteUrl);
    if (c) {
      setMetrics(c);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      let data: Uint8ClampedArray;
      try {
        data = ctx.getImageData(0, 0, w, h).data;
      } catch {
        // CORS-tainted canvas (sprite served cross-origin without
        // credentials). Fall back to canvas dimensions.
        const fallback: Omit<FigureMetrics, "ready"> = {
          figureWidthPx: w,
          figureHeightPx: h,
          intrinsicWidthPx: w,
          intrinsicHeightPx: h,
          figureLeftPx: 0,
          figureTopPx: 0,
        };
        cache.set(spriteUrl, fallback);
        setMetrics(fallback);
        return;
      }
      let minX = w;
      let minY = h;
      let maxX = -1;
      let maxY = -1;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const a = data[(y * w + x) * 4 + 3]!;
          if (a > ALPHA_THRESHOLD) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      const m: Omit<FigureMetrics, "ready"> =
        maxX < 0
          ? {
              figureWidthPx: w,
              figureHeightPx: h,
              intrinsicWidthPx: w,
              intrinsicHeightPx: h,
              figureLeftPx: 0,
              figureTopPx: 0,
            }
          : {
              figureWidthPx: maxX - minX + 1,
              figureHeightPx: maxY - minY + 1,
              intrinsicWidthPx: w,
              intrinsicHeightPx: h,
              figureLeftPx: minX,
              figureTopPx: minY,
            };
      cache.set(spriteUrl, m);
      setMetrics(m);
    };
    img.src = spriteUrl;
    return () => {
      cancelled = true;
    };
  }, [spriteUrl]);

  if (!metrics) return ZERO;
  return { ...metrics, ready: true };
}

/**
 * Legacy scale — anchored by alpha-bbox top. Retained only so existing
 * callers keep compiling during migration to `figureScaleByEye`. Has a
 * known bug: bbox includes raised weapons (Gaius's overhead greatsword
 * inflates the bbox and over-shrinks the body).
 *
 * Prefer `figureScaleByEye` going forward — anchored by the manually-
 * pinned eye line, which weapon position can't influence.
 */
export function figureScale(
  m: FigureMetrics,
  targetFigureHeight: number,
): {
  imgWidthPx: number;
  imgHeightPx: number;
  offsetBelowPx: number;
  ready: boolean;
} {
  if (!m.ready || m.figureHeightPx === 0) {
    return { imgWidthPx: 0, imgHeightPx: 0, offsetBelowPx: 0, ready: false };
  }
  const scale = targetFigureHeight / m.figureHeightPx;
  return {
    imgWidthPx: m.intrinsicWidthPx * scale,
    imgHeightPx: m.intrinsicHeightPx * scale,
    offsetBelowPx: -(m.intrinsicHeightPx - m.figureTopPx - m.figureHeightPx) * scale,
    ready: true,
  };
}

/**
 * Canonical "eye line as fraction of body height" — i.e. how far below
 * the crown the eyes sit on a normal human. ~0.13 (one-eighth) is the
 * standard art-anatomy ratio. Used both as the on-screen target and as
 * the implicit denominator for eye-to-feet distance (1 - EYE_FROM_TOP).
 */
export const EYE_FROM_TOP_RATIO = 0.13;

/**
 * Compute CSS dimensions for an `<img>` so that the figure inside the
 * sprite renders with the manually-pinned EYE LINE landing at the
 * canonical eye position for its size class — and the feet anchored
 * to the slot's bottom. Anchoring by eye instead of bbox-top fixes
 * the raised-weapon shrink bug: weapons live above the eye and don't
 * influence eye-to-feet distance.
 *
 * Math:
 *   targetH = targetFigureHeightPx(cls) * staturePct  // class * stature
 *   targetEyeToBottom = targetH * (1 - EYE_FROM_TOP)  // screen-space
 *   imageEyeToBottom  = (figureTopPx + figureHeightPx) - eyeYPx
 *   scale = targetEyeToBottom / imageEyeToBottom
 *
 * `staturePct` is the per-combatant multiplier from `statureMultiplier()`
 * in `lib/art/sizeClasses.ts` — applies the female (0.9×) and hero
 * (1.1×) stature rules on top of the size-class baseline. Defaults to
 * 1 so non-combatant call sites that haven't been migrated yet keep
 * rendering at the class baseline.
 *
 * Throws when eyeYPx is undefined or below the figure bottom — every
 * sprite is expected to have a manually-pinned eye-Y from the Sprite
 * Review Tool (`/dev/sprite-review`). There is no estimation fallback;
 * unreviewed sprites refuse to render. This is the quality gate.
 */
export function figureScaleByEye(
  m: FigureMetrics,
  eyeYPx: number | undefined,
  cls: SizeClass,
  staturePct: number = 1,
): {
  imgWidthPx: number;
  imgHeightPx: number;
  offsetBelowPx: number;
  ready: boolean;
} {
  if (eyeYPx == null) {
    throw new Error(
      "figureScaleByEye: eyeYPx is required (review the sprite at /dev/sprite-review)",
    );
  }
  if (!m.ready || m.figureHeightPx === 0) {
    return { imgWidthPx: 0, imgHeightPx: 0, offsetBelowPx: 0, ready: false };
  }
  const figureBottomPx = m.figureTopPx + m.figureHeightPx;
  const imageEyeToBottom = figureBottomPx - eyeYPx;
  if (imageEyeToBottom <= 0) {
    throw new Error(
      `figureScaleByEye: eyeYPx (${eyeYPx}) is at or below the figure bottom (${figureBottomPx}); re-pin eye-Y in the review tool`,
    );
  }
  const targetH = targetFigureHeightPx(cls) * staturePct;
  const targetEyeToBottom = targetH * (1 - EYE_FROM_TOP_RATIO);
  const scale = targetEyeToBottom / imageEyeToBottom;
  return {
    imgWidthPx: m.intrinsicWidthPx * scale,
    imgHeightPx: m.intrinsicHeightPx * scale,
    offsetBelowPx: -(m.intrinsicHeightPx - figureBottomPx) * scale,
    ready: true,
  };
}
