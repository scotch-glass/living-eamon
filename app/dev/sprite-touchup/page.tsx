// Sprite touch-up tool — DEPRECATED. The flood-fill eraser has been
// absorbed into the unified Sprite Review Tool at /dev/sprite-review
// (Stage D of the sprite-normalization sprint, 2026-05-08). This page
// remains for backwards-compatibility but the new tool is the canonical
// surface. Originally this page paste-loaded a sprite path under /art/,
// flood-fill-erased pixels within tolerance, undo/reset/saved in place.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type HistoryEntry = ImageData;

export default function SpriteTouchupPage(): React.JSX.Element {
  const [pathInput, setPathInput] = useState("/art/heroes/gaius/combat/great_sword/v1.png");
  const [tolerance, setTolerance] = useState(32);
  const [contiguous, setContiguous] = useState(true);
  const [zoom, setZoom] = useState(0.5);
  const [status, setStatus] = useState("");
  const [originalData, setOriginalData] = useState<ImageData | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const loadImage = useCallback(async () => {
    setStatus("loading…");
    const url = `${pathInput}?cb=${Date.now()}`;
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
      setStatus(`loaded ${cv.width}×${cv.height}`);
    };
    img.onerror = () => setStatus(`failed to load ${url}`);
    img.src = url;
  }, [pathInput]);

  useEffect(() => {
    void loadImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushHistory = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const snap = ctx.getImageData(0, 0, cv.width, cv.height);
    setHistory((h) => [...h.slice(-19), snap]);
  }, []);

  const handleClick = useCallback(
    (ev: React.MouseEvent<HTMLCanvasElement>) => {
      const cv = canvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      const rect = cv.getBoundingClientRect();
      const sx = cv.width / rect.width;
      const sy = cv.height / rect.height;
      const x = Math.floor((ev.clientX - rect.left) * sx);
      const y = Math.floor((ev.clientY - rect.top) * sy);
      if (x < 0 || y < 0 || x >= cv.width || y >= cv.height) return;

      pushHistory();
      const w = cv.width;
      const h = cv.height;
      const img = ctx.getImageData(0, 0, w, h);
      const d = img.data;

      const idx0 = (y * w + x) * 4;
      const r0 = d[idx0]!;
      const g0 = d[idx0 + 1]!;
      const b0 = d[idx0 + 2]!;
      const a0 = d[idx0 + 3]!;
      if (a0 === 0) {
        setStatus("clicked pixel is already transparent");
        return;
      }

      const tol = tolerance;
      const matches = (i: number): boolean => {
        if (d[i + 3] === 0) return false;
        const dr = d[i]! - r0;
        const dg = d[i + 1]! - g0;
        const db = d[i + 2]! - b0;
        return Math.abs(dr) <= tol && Math.abs(dg) <= tol && Math.abs(db) <= tol;
      };

      let cleared = 0;
      if (contiguous) {
        const stack: number[] = [x, y];
        const seen = new Uint8Array(w * h);
        while (stack.length > 0) {
          const cy = stack.pop()!;
          const cx = stack.pop()!;
          if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
          const sIdx = cy * w + cx;
          if (seen[sIdx]) continue;
          seen[sIdx] = 1;
          const i = sIdx * 4;
          if (!matches(i)) continue;
          d[i + 3] = 0;
          cleared++;
          stack.push(cx + 1, cy);
          stack.push(cx - 1, cy);
          stack.push(cx, cy + 1);
          stack.push(cx, cy - 1);
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
      setStatus(`erased ${cleared.toLocaleString()} px @ (${x},${y}) tol=${tol}${contiguous ? " contig" : " global"}`);
    },
    [tolerance, contiguous, pushHistory],
  );

  const undo = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    setHistory((h) => {
      if (h.length === 0) {
        setStatus("nothing to undo");
        return h;
      }
      const last = h[h.length - 1]!;
      ctx.putImageData(last, 0, 0);
      setStatus(`undo (${h.length - 1} left)`);
      return h.slice(0, -1);
    });
  }, []);

  const reset = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv || !originalData) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(originalData, 0, 0);
    setHistory([]);
    setStatus("reset to original");
  }, [originalData]);

  const save = useCallback(async () => {
    const cv = canvasRef.current;
    if (!cv) return;
    setStatus("saving…");
    const blob: Blob | null = await new Promise((resolve) =>
      cv.toBlob((b) => resolve(b), "image/png"),
    );
    if (!blob) {
      setStatus("toBlob failed");
      return;
    }
    const arr = new Uint8Array(await blob.arrayBuffer());
    let bin = "";
    for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]!);
    const b64 = btoa(bin);
    const resp = await fetch("/api/sprite-touchup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: pathInput, pngBase64: b64 }),
    });
    const j = (await resp.json()) as { ok: boolean; bytes?: number; error?: string };
    if (j.ok) {
      setStatus(`saved ${j.bytes?.toLocaleString()} bytes → ${pathInput}`);
    } else {
      setStatus(`save failed: ${j.error}`);
    }
  }, [pathInput]);

  return (
    <div style={{ padding: 16, fontFamily: "ui-sans-serif, system-ui", color: "#eee", background: "#1a1a1a", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>Sprite Touch-up <span style={{ fontSize: 12, color: "#fbbf24" }}>· deprecated</span></h1>
      <p style={{ color: "#fbbf24", fontSize: 13, marginBottom: 8, fontWeight: 600 }}>
        ⚠ This tool has moved to <a href="/dev/sprite-review" style={{ color: "#7ec8ff" }}>/dev/sprite-review</a>. The new tool combines eye-Y pin, size class, mirror, approval, gore placement, and the eraser in one flow. This page remains for back-compat only.
      </p>
      <p style={{ color: "#aaa", fontSize: 12, marginBottom: 12 }}>
        Click any background pixel to flood-fill-erase nearby matching pixels. Cleans rembg misses without a re-forge.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <input
          value={pathInput}
          onChange={(e) => setPathInput(e.target.value)}
          placeholder="/art/path/to/sprite.png"
          style={{ flex: "1 1 400px", padding: 6, background: "#222", color: "#eee", border: "1px solid #444" }}
        />
        <button onClick={loadImage} style={btnStyle}>Load</button>
        <button onClick={undo} style={btnStyle} disabled={history.length === 0}>Undo ({history.length})</button>
        <button onClick={reset} style={btnStyle}>Reset</button>
        <button onClick={save} style={{ ...btnStyle, background: "#2a4" }}>Save in place</button>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ fontSize: 13 }}>
          Tolerance: <strong>{tolerance}</strong>
          <input
            type="range"
            min={0}
            max={120}
            value={tolerance}
            onChange={(e) => setTolerance(parseInt(e.target.value, 10))}
            style={{ marginLeft: 8, verticalAlign: "middle" }}
          />
        </label>
        <label style={{ fontSize: 13 }}>
          <input
            type="checkbox"
            checked={contiguous}
            onChange={(e) => setContiguous(e.target.checked)}
          />
          {" "}Contiguous (uncheck = erase all matching pixels in image)
        </label>
        <label style={{ fontSize: 13 }}>
          Zoom: <strong>{zoom.toFixed(2)}×</strong>
          <input
            type="range"
            min={0.1}
            max={2}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ marginLeft: 8, verticalAlign: "middle" }}
          />
        </label>
      </div>

      <div style={{ fontSize: 13, marginBottom: 8, color: "#9c9" }}>{status}</div>

      <div
        style={{
          display: "inline-block",
          background:
            "repeating-conic-gradient(#222 0% 25%, #333 0% 50%) 50% / 24px 24px",
          padding: 4,
          border: "1px solid #444",
        }}
      >
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          style={{
            cursor: "crosshair",
            display: "block",
            width: canvasRef.current ? `${canvasRef.current.width * zoom}px` : undefined,
            height: canvasRef.current ? `${canvasRef.current.height * zoom}px` : undefined,
            imageRendering: "pixelated",
          }}
        />
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "6px 12px",
  background: "#333",
  color: "#eee",
  border: "1px solid #555",
  cursor: "pointer",
  fontSize: 13,
};
