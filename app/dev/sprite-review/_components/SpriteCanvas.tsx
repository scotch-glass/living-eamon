"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GoreZone, SpriteMetadata } from "@/lib/art/spriteMetadata";

export type CanvasMode = "pin" | "erase" | "gore";

interface Props {
  spritePath: string;
  metadata: SpriteMetadata;
  mode: CanvasMode;
  zoom: number;
  flip: boolean;
  /** Eraser tolerance (0..120). Only used in erase mode. */
  tolerance: number;
  /** Eraser contiguous flood-fill toggle. */
  contiguous: boolean;
  onEyeYChange: (eyeYPx: number | undefined) => void;
  onGoreZonesChange: (zones: GoreZone[]) => void;
  /** Bumped externally when caller requests Save / Undo / Reset. */
  imageDirtyAt: number;
  /** Internal counters consumers can toggle to trigger ops. */
  saveSignal: number;
  undoSignal: number;
  resetSignal: number;
  onStatus: (msg: string) => void;
  onUndoCountChange: (n: number) => void;
}

type HistoryEntry = ImageData;

export default function SpriteCanvas({
  spritePath,
  metadata,
  mode,
  zoom,
  flip,
  tolerance,
  contiguous,
  onEyeYChange,
  onGoreZonesChange,
  saveSignal,
  undoSignal,
  resetSignal,
  onStatus,
  onUndoCountChange,
}: Props): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [originalData, setOriginalData] = useState<ImageData | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [intrinsicSize, setIntrinsicSize] = useState({ w: 0, h: 0 });

  const eyeYPx = metadata.eyeYPx;
  const goreZones = metadata.goreZones ?? [];

  const loadImage = useCallback(() => {
    onStatus("loading…");
    const url = `${spritePath}?cb=${Date.now()}`;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const cv = canvasRef.current;
      if (!cv) return;
      cv.width = img.naturalWidth;
      cv.height = img.naturalHeight;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, cv.width, cv.height);
      setOriginalData(data);
      setHistory([]);
      setIntrinsicSize({ w: cv.width, h: cv.height });
      onStatus(`loaded ${cv.width}×${cv.height}`);
    };
    img.onerror = () => onStatus(`failed to load ${url}`);
    img.src = url;
  }, [spritePath, onStatus]);

  useEffect(() => {
    loadImage();
  }, [loadImage]);

  useEffect(() => {
    onUndoCountChange(history.length);
  }, [history, onUndoCountChange]);

  const pushHistory = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const snap = ctx.getImageData(0, 0, cv.width, cv.height);
    setHistory((h) => [...h.slice(-19), snap]);
  }, []);

  const eventCoords = useCallback(
    (ev: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
      const cv = canvasRef.current;
      if (!cv) return null;
      const rect = cv.getBoundingClientRect();
      const sx = cv.width / rect.width;
      const sy = cv.height / rect.height;
      // If sprite is rendered flipped, the click X needs to be inverted to land on
      // the same image-space pixel the user clicked on visually.
      const visualX = (ev.clientX - rect.left) * sx;
      const x = flip ? cv.width - 1 - visualX : visualX;
      const y = (ev.clientY - rect.top) * sy;
      if (x < 0 || y < 0 || x >= cv.width || y >= cv.height) return null;
      return { x: Math.floor(x), y: Math.floor(y) };
    },
    [flip],
  );

  const floodFillErase = useCallback(
    (cx: number, cy: number) => {
      const cv = canvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      pushHistory();
      const w = cv.width;
      const h = cv.height;
      const img = ctx.getImageData(0, 0, w, h);
      const d = img.data;
      const idx0 = (cy * w + cx) * 4;
      const r0 = d[idx0]!;
      const g0 = d[idx0 + 1]!;
      const b0 = d[idx0 + 2]!;
      const a0 = d[idx0 + 3]!;
      if (a0 === 0) {
        onStatus("clicked pixel is already transparent");
        return;
      }
      const matches = (i: number): boolean => {
        if (d[i + 3] === 0) return false;
        const dr = d[i]! - r0;
        const dg = d[i + 1]! - g0;
        const db = d[i + 2]! - b0;
        return Math.abs(dr) <= tolerance && Math.abs(dg) <= tolerance && Math.abs(db) <= tolerance;
      };
      let cleared = 0;
      if (contiguous) {
        const stack: number[] = [cx, cy];
        const seen = new Uint8Array(w * h);
        while (stack.length > 0) {
          const py = stack.pop()!;
          const px = stack.pop()!;
          if (px < 0 || py < 0 || px >= w || py >= h) continue;
          const sIdx = py * w + px;
          if (seen[sIdx]) continue;
          seen[sIdx] = 1;
          const i = sIdx * 4;
          if (!matches(i)) continue;
          d[i + 3] = 0;
          cleared++;
          stack.push(px + 1, py, px - 1, py, px, py + 1, px, py - 1);
        }
      } else {
        for (let i = 0; i < d.length; i += 4) {
          if (matches(i)) {
            d[i + 3] = 0;
            cleared++;
          }
        }
      }
      ctx.putImageData(img, 0, 0);
      onStatus(`erased ${cleared.toLocaleString()} px @ (${cx},${cy}) tol=${tolerance}`);
    },
    [pushHistory, tolerance, contiguous, onStatus],
  );

  const handleClick = useCallback(
    (ev: React.MouseEvent<HTMLCanvasElement>) => {
      const pt = eventCoords(ev);
      if (!pt) return;
      if (mode === "pin") {
        onEyeYChange(pt.y);
        onStatus(`eye-Y pin set @ y=${pt.y}`);
        return;
      }
      if (mode === "erase") {
        floodFillErase(pt.x, pt.y);
        return;
      }
      if (mode === "gore") {
        const w = intrinsicSize.w || 1;
        const h = intrinsicSize.h || 1;
        const newZone: GoreZone = {
          id: `gz_${Date.now().toString(36)}`,
          normalizedX: pt.x / w,
          normalizedY: pt.y / h,
          radius: 0.05,
          severity: "splatter",
        };
        onGoreZonesChange([...goreZones, newZone]);
        onStatus(`gore anchor placed @ (${pt.x},${pt.y})`);
      }
    },
    [mode, eventCoords, onEyeYChange, floodFillErase, goreZones, onGoreZonesChange, intrinsicSize, onStatus],
  );

  const handleContextMenu = useCallback(
    (ev: React.MouseEvent<HTMLCanvasElement>) => {
      ev.preventDefault();
      if (mode === "pin") {
        onEyeYChange(undefined);
        onStatus("eye-Y pin cleared");
        return;
      }
      if (mode === "gore") {
        const pt = eventCoords(ev);
        if (!pt) return;
        const w = intrinsicSize.w || 1;
        const h = intrinsicSize.h || 1;
        if (goreZones.length === 0) {
          onStatus("no gore anchors to remove");
          return;
        }
        // remove nearest gore anchor within 18% of bbox (raised from 10%
        // — at click-precision the smaller threshold made this feel
        // unreliable, especially on wide sprites where a small dx
        // accumulates a large distance because of aspect skew).
        let best: { idx: number; dist: number } | null = null;
        for (let i = 0; i < goreZones.length; i++) {
          const z = goreZones[i]!;
          const dx = z.normalizedX - pt.x / w;
          const dy = z.normalizedY - pt.y / h;
          const dist = Math.hypot(dx, dy);
          if (!best || dist < best.dist) best = { idx: i, dist };
        }
        if (best && best.dist < 0.18) {
          const next = goreZones.slice();
          next.splice(best.idx, 1);
          onGoreZonesChange(next);
          onStatus(`gore anchor removed (was ${(best.dist * 100).toFixed(1)}% from click)`);
        } else {
          const distPct = best ? (best.dist * 100).toFixed(1) : "?";
          onStatus(`right-click missed (nearest anchor is ${distPct}% away — click closer to it)`);
        }
      }
    },
    [mode, onEyeYChange, eventCoords, goreZones, onGoreZonesChange, intrinsicSize, onStatus],
  );

  // Save / Undo / Reset signals from parent
  const lastSaveSignalRef = useRef(0);
  const lastUndoSignalRef = useRef(0);
  const lastResetSignalRef = useRef(0);

  useEffect(() => {
    if (saveSignal === lastSaveSignalRef.current) return;
    lastSaveSignalRef.current = saveSignal;
    void (async () => {
      const cv = canvasRef.current;
      if (!cv) return;
      onStatus("saving image…");
      const blob: Blob | null = await new Promise((resolve) =>
        cv.toBlob((b) => resolve(b), "image/png"),
      );
      if (!blob) {
        onStatus("toBlob failed");
        return;
      }
      const arr = new Uint8Array(await blob.arrayBuffer());
      let bin = "";
      for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]!);
      const b64 = btoa(bin);
      const resp = await fetch("/api/sprite-touchup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: spritePath, pngBase64: b64 }),
      });
      const j = (await resp.json()) as { ok: boolean; bytes?: number; error?: string };
      if (j.ok) {
        onStatus(`saved ${j.bytes?.toLocaleString()} bytes → ${spritePath}`);
      } else {
        onStatus(`save failed: ${j.error}`);
      }
    })();
  }, [saveSignal, spritePath, onStatus]);

  // Stash latest history in a ref so the effect doesn't need to depend
  // on it (and so we can read it without using the setHistory updater
  // form, which would put a setState-on-parent call inside a render-
  // phase update — React 19 console-errors that pattern).
  const historyRef = useRef<HistoryEntry[]>([]);
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    if (undoSignal === lastUndoSignalRef.current) return;
    lastUndoSignalRef.current = undoSignal;
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const h = historyRef.current;
    if (h.length === 0) {
      onStatus("nothing to undo");
      return;
    }
    const last = h[h.length - 1]!;
    ctx.putImageData(last, 0, 0);
    onStatus(`undo (${h.length - 1} left)`);
    setHistory((prev) => prev.slice(0, -1));
  }, [undoSignal, onStatus]);

  useEffect(() => {
    if (resetSignal === lastResetSignalRef.current) return;
    lastResetSignalRef.current = resetSignal;
    const cv = canvasRef.current;
    if (!cv || !originalData) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(originalData, 0, 0);
    setHistory([]);
    onStatus("reset to original");
  }, [resetSignal, originalData, onStatus]);

  // Overlay rendering (eye-Y line + gore anchors). Painted as DOM siblings,
  // not on the canvas, so they don't get saved into the PNG.
  const visualEyeY = eyeYPx != null ? eyeYPx * zoom : undefined;
  const wPx = intrinsicSize.w * zoom;
  const hPx = intrinsicSize.h * zoom;

  return (
    <div
      style={{
        display: "inline-block",
        background:
          "repeating-conic-gradient(#222 0% 25%, #333 0% 50%) 50% / 24px 24px",
        padding: 4,
        border: "1px solid #444",
        position: "relative",
      }}
    >
      <div style={{ position: "relative", width: wPx || undefined, height: hPx || undefined }}>
        {/* Flip wrapper — canvas AND gore anchors share one transform so
            mirror is consistent. Without this, the canvas flips but the
            anchor divs stay in source-image coords, putting them on the
            wrong side of the rendered sprite. The eye-Y line is a full-
            width horizontal rule and is unaffected by flip, so it stays
            outside this wrapper. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: flip ? "scaleX(-1)" : undefined,
            transformOrigin: "center",
          }}
        >
          <canvas
            ref={canvasRef}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            style={{
              cursor: mode === "pin" ? "crosshair" : mode === "erase" ? "cell" : "copy",
              display: "block",
              width: wPx || undefined,
              height: hPx || undefined,
              imageRendering: "pixelated",
            }}
          />
          {goreZones.map((z) => {
            const cx = z.normalizedX * wPx;
            const cy = z.normalizedY * hPx;
            const r = z.radius * Math.min(wPx, hPx);
            return (
              <div
                key={z.id}
                style={{
                  position: "absolute",
                  left: cx - r,
                  top: cy - r,
                  width: r * 2,
                  height: r * 2,
                  borderRadius: "50%",
                  background: z.severity === "wound" ? "rgba(155,0,0,0.5)" : "rgba(220,40,40,0.4)",
                  border: "1px solid #ff6464",
                  pointerEvents: "none",
                  // counter-flip the dot itself; geometry is symmetric so
                  // this is mostly cosmetic, but if we add labels later
                  // (e.g. anchor numbers) it'll matter.
                  transform: flip ? "scaleX(-1)" : undefined,
                }}
              />
            );
          })}
        </div>
        {/* Eye-Y line — outside the flip wrapper because it's a horizontal
            rule and a horizontal flip would render identically. */}
        {visualEyeY != null && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: visualEyeY,
              borderTop: "2px dashed #ff6464",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 4,
                top: -10,
                background: "#ff6464",
                color: "#000",
                padding: "1px 4px",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              eye-Y={eyeYPx}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
