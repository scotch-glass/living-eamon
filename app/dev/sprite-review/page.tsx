// Sprite Review Tool — permanent Creator UI.
// Walks combat sprites + forged corpses; lets the reviewer assign a size
// class, drop an eye-Y pin, mirror, approve/reject, place gore anchors,
// and erase rembg misses. Auth-gating deferred to a follow-up sprint.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { GoreZone, SpriteMetadata, SpriteMetadataMap } from "@/lib/art/spriteMetadata";
import type { SizeClass } from "@/lib/art/sizeClasses";
import SpriteList from "./_components/SpriteList";
import SpriteCanvas, { type CanvasMode } from "./_components/SpriteCanvas";
import ClassPicker from "./_components/ClassPicker";
import ApprovalControls from "./_components/ApprovalControls";
import PromptPanel from "./_components/PromptPanel";
import StandingRulesPanel from "./_components/StandingRulesPanel";

export default function SpriteReviewPage(): React.JSX.Element {
  const [paths, setPaths] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<SpriteMetadataMap>({});
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [filterApproval, setFilterApproval] = useState<"any" | "unreviewed" | "approved" | "rejected">("any");
  const [filterClass, setFilterClass] = useState<"any" | SizeClass>("any");
  const [mode, setMode] = useState<CanvasMode>("pin");
  const [zoom, setZoom] = useState(0.5);
  const [tolerance, setTolerance] = useState(32);
  const [contiguous, setContiguous] = useState(true);
  const [status, setStatus] = useState("");
  const [undoCount, setUndoCount] = useState(0);
  const [saveSignal, setSaveSignal] = useState(0);
  const [undoSignal, setUndoSignal] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);

  // ── load sprite list + all metadata ───────────────────────────────
  useEffect(() => {
    void (async () => {
      const [listResp, metaResp] = await Promise.all([
        fetch("/api/sprite-list").then((r) => r.json() as Promise<{ ok: boolean; paths: string[] }>),
        fetch("/api/sprite-metadata").then((r) => r.json() as Promise<{ ok: boolean; metadata: SpriteMetadataMap }>),
      ]);
      setPaths(listResp.paths ?? []);
      setMetadata(metaResp.metadata ?? {});
      if (listResp.paths && listResp.paths.length > 0) {
        setSelectedPath(listResp.paths[0]!);
      }
    })();
  }, []);

  const currentMeta: SpriteMetadata = useMemo(() => {
    if (!selectedPath) return { path: "", approval: "unreviewed" };
    return metadata[selectedPath] ?? { path: selectedPath, approval: "unreviewed" };
  }, [selectedPath, metadata]);

  const updateLocalMeta = useCallback(
    (patch: Partial<SpriteMetadata>) => {
      if (!selectedPath) return;
      setMetadata((m) => ({
        ...m,
        [selectedPath]: { ...currentMeta, ...patch, path: selectedPath },
      }));
    },
    [selectedPath, currentMeta],
  );

  const persistMeta = useCallback(
    async (patch: Partial<SpriteMetadata>) => {
      if (!selectedPath) return;
      const next: SpriteMetadata = { ...currentMeta, ...patch, path: selectedPath };
      const resp = await fetch("/api/sprite-metadata", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(next),
      });
      const j = (await resp.json()) as { ok: boolean; entry?: SpriteMetadata; error?: string };
      if (j.ok && j.entry) {
        setMetadata((m) => ({ ...m, [selectedPath]: j.entry! }));
        setStatus(`metadata saved: ${selectedPath}`);
      } else {
        setStatus(`save failed: ${j.error ?? "unknown"}`);
      }
    },
    [selectedPath, currentMeta],
  );

  const handleApprove = useCallback(() => {
    if (currentMeta.eyeYPx == null) {
      setStatus("can't approve: eye-Y pin not set (switch to Eye-Y mode and click on the eye)");
      return;
    }
    // Auto-default sizeClass to C ("Normal Humanoid") if the reviewer
    // didn't explicitly pick one. Most sprites are humans; this avoids
    // accidentally-approved-without-class metadata. Reviewer can change
    // it after with the class picker.
    const patch: Partial<SpriteMetadata> = {
      approval: "approved",
      reviewedAt: new Date().toISOString(),
    };
    if (!currentMeta.sizeClass) patch.sizeClass = "C";
    void persistMeta(patch);
  }, [persistMeta, currentMeta]);

  const handleSaveMeta = useCallback(() => {
    void persistMeta({
      reviewedAt: new Date().toISOString(),
    });
  }, [persistMeta]);

  const handleReject = useCallback(
    async (note: string, regen: boolean) => {
      if (!selectedPath) return;
      if (regen) {
        // Reject + queue regen — flips approval to rejected AND writes
        // an entry to _regen-queue.json that the forge picks up.
        const resp = await fetch("/api/sprite-regen", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ path: selectedPath, note }),
        });
        const j = (await resp.json()) as { ok: boolean; metadata?: SpriteMetadata; error?: string };
        if (j.ok && j.metadata) {
          setMetadata((m) => ({ ...m, [selectedPath]: j.metadata! }));
          setStatus(`queued for regen: ${selectedPath}`);
        } else {
          setStatus(`reject failed: ${j.error ?? "unknown"}`);
        }
      } else {
        // Reject (no regen) — flip approval to rejected via the metadata
        // PUT path; nothing goes into the regen queue. regenRequested is
        // set false so the list badge can render the dead-end-reject
        // variant distinct from the queued-regen variant.
        await persistMeta({
          approval: "rejected",
          regenRequested: false,
          note,
          reviewedAt: new Date().toISOString(),
        });
        setStatus(`rejected (not queued): ${selectedPath}`);
      }
    },
    [selectedPath, persistMeta],
  );

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div
      style={{
        background: "#1a1a1a",
        color: "#eee",
        minHeight: "100vh",
        padding: 12,
        fontFamily: "ui-sans-serif, system-ui",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h1 style={{ fontSize: 18, margin: 0 }}>Sprite Review</h1>
        <div style={{ fontSize: 11, color: "#888" }}>
          permanent Creator UI · auth gate deferred · v1 scope: combat + corpses
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 280px", gap: 12, alignItems: "stretch" }}>
        {/* LEFT: list */}
        <div style={{ minHeight: "calc(100vh - 60px)" }}>
          <SpriteList
            paths={paths}
            metadata={metadata}
            selectedPath={selectedPath}
            onSelect={setSelectedPath}
            filterApproval={filterApproval}
            onFilterApproval={setFilterApproval}
            filterClass={filterClass}
            onFilterClass={setFilterClass}
          />
        </div>

        {/* CENTER: canvas */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Mode + tools */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 4 }}>
              {(["pin", "erase", "gore"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    padding: "5px 10px",
                    background: mode === m ? "#2a4a8a" : "#222",
                    color: "#eee",
                    border: `1px solid ${mode === m ? "#4a7ad0" : "#333"}`,
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  {m === "pin" ? "Eye-Y pin" : m === "erase" ? "Erase BG" : "Gore"}
                </button>
              ))}
            </div>

            <button onClick={() => setUndoSignal((s) => s + 1)} style={btnSm} disabled={undoCount === 0}>
              Undo ({undoCount})
            </button>
            <button onClick={() => setResetSignal((s) => s + 1)} style={btnSm}>
              Reset
            </button>
            <button
              onClick={() => setSaveSignal((s) => s + 1)}
              style={{ ...btnSm, background: "#2a4" }}
              title="Save erased PNG to disk"
            >
              Save image
            </button>

            <label style={{ fontSize: 12, marginLeft: 8 }}>
              Zoom: {zoom.toFixed(2)}×
              <input
                type="range"
                min={0.1}
                max={2}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                style={{ verticalAlign: "middle", marginLeft: 6 }}
              />
            </label>

            {mode === "erase" && (
              <>
                <label style={{ fontSize: 12 }}>
                  Tol: {tolerance}
                  <input
                    type="range"
                    min={0}
                    max={120}
                    value={tolerance}
                    onChange={(e) => setTolerance(parseInt(e.target.value, 10))}
                    style={{ verticalAlign: "middle", marginLeft: 6 }}
                  />
                </label>
                <label style={{ fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={contiguous}
                    onChange={(e) => setContiguous(e.target.checked)}
                  />
                  contig
                </label>
              </>
            )}
          </div>

          <div style={{ fontSize: 12, color: "#9c9" }}>{status}</div>

          {/* Mode hints — short on-screen instructions for the active mode. */}
          <div
            style={{
              fontSize: 11,
              color: "#aaa",
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
              padding: "6px 10px",
              lineHeight: 1.5,
            }}
          >
            {mode === "pin" && (
              <>
                <strong style={{ color: "#fbbf24" }}>Eye-Y pin mode:</strong> left-click on the
                character&apos;s eye line to set the height anchor. Right-click anywhere to clear
                the pin.
              </>
            )}
            {mode === "erase" && (
              <>
                <strong style={{ color: "#fbbf24" }}>Erase BG mode:</strong> left-click any white
                speck to flood-fill-erase. Use Tolerance + Contiguous to tune. Click{" "}
                <em>Save image</em> (green button) to write the cleaned PNG to disk.
              </>
            )}
            {mode === "gore" && (
              <>
                <strong style={{ color: "#fbbf24" }}>Gore mode:</strong> left-click to place a gore
                anchor. <strong>Right-click near an anchor (within ~18% of bbox) to remove it.</strong>{" "}
                Tip: if you&apos;re going to mirror, set the <em>Mirror horizontally</em> flag{" "}
                <em>before</em> placing gore so the anchors land where you see them.
              </>
            )}
          </div>

          {selectedPath && (
            <SpriteCanvas
              spritePath={selectedPath}
              metadata={currentMeta}
              mode={mode}
              zoom={zoom}
              flip={!!currentMeta.flip}
              tolerance={tolerance}
              contiguous={contiguous}
              onEyeYChange={(eyeYPx) => updateLocalMeta({ eyeYPx })}
              onGoreZonesChange={(zones: GoreZone[]) => updateLocalMeta({ goreZones: zones })}
              imageDirtyAt={undoSignal}
              saveSignal={saveSignal}
              undoSignal={undoSignal}
              resetSignal={resetSignal}
              onStatus={setStatus}
              onUndoCountChange={setUndoCount}
            />
          )}
        </div>

        {/* RIGHT: controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 11, color: "#888", wordBreak: "break-all" }}>
            {selectedPath ?? "(no selection)"}
          </div>

          <div>
            <div style={{ fontSize: 12, color: "#aaa", marginBottom: 4 }}>Size class</div>
            <ClassPicker
              value={currentMeta.sizeClass}
              onChange={(cls) => updateLocalMeta({ sizeClass: cls })}
            />
          </div>

          <ApprovalControls
            metadata={currentMeta}
            flip={!!currentMeta.flip}
            onFlipChange={(flip) => updateLocalMeta({ flip })}
            onApprove={handleApprove}
            onSaveMetadata={handleSaveMeta}
            onReject={(note, regen) => void handleReject(note, regen)}
          />

          {mode === "gore" && (currentMeta.goreZones?.length ?? 0) > 0 && (
            <button
              onClick={() => {
                void persistMeta({ goreApproved: true });
              }}
              style={{ ...btnSm, background: "#1f9d55" }}
            >
              Approve gore placement ({currentMeta.goreZones?.length ?? 0} anchors)
            </button>
          )}

          <PromptPanel
            metadata={currentMeta}
            onCopy={() => {
              if (currentMeta.originalPrompt) {
                void navigator.clipboard.writeText(currentMeta.originalPrompt);
                setStatus("prompt copied to clipboard");
              }
            }}
          />

          <StandingRulesPanel />
        </div>
      </div>
    </div>
  );
}

const btnSm: React.CSSProperties = {
  padding: "5px 10px",
  background: "#333",
  color: "#eee",
  border: "1px solid #555",
  cursor: "pointer",
  fontSize: 12,
};
