"use client";

import { useEffect, useRef, useState } from "react";
import { getRoom } from "../lib/adventures/registry";

interface ScenePanelProps {
  roomId: string;
  roomState?: string;
  tone?: string;
  fullScreen?: boolean;
}

type PanelStatus = "loading" | "loaded" | "retrying" | "error";

interface SceneResult {
  url: string | null;
  visualDescription: string | null;
  retried?: boolean;
  error?: string;
  errorType?: string;
}

export default function ScenePanel({
  roomId,
  roomState = "normal",
  tone = "civilized",
  fullScreen = false,
}: ScenePanelProps) {
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [fgUrl, setFgUrl] = useState<string | null>(null);
  const [fgOpacity, setFgOpacity] = useState(0);
  const [status, setStatus] = useState<PanelStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showApology, setShowApology] = useState(false);

  const prevRoomRef = useRef<string | null>(null);
  const prevStateRef = useRef<string | null>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pull room data from the registry for loading state + tone resolution
  const _room = getRoom(roomId);
  const localDescription = _room?.visualDescription ?? null;
  const displayName = _room?.name
    ?? roomId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  // Resolve tone: "auto" reads from room data, otherwise use the prop
  const resolvedTone = tone === "auto" ? (_room?.sceneTone ?? "civilized") : tone;

  useEffect(() => {
    if (
      roomId === prevRoomRef.current &&
      roomState === prevStateRef.current
    ) {
      return;
    }

    prevRoomRef.current = roomId;
    prevStateRef.current = roomState;

    if (!roomId) return;

    // ── Immediately fade to black when leaving a room ────────────────────
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    setFgUrl(null);
    setFgOpacity(0);
    setBgUrl(null);       // clears the old image → shows black background
    setStatus("loading");
    setErrorMessage(null);
    setShowApology(false);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    fetch(
      `/api/scene-image?room=${encodeURIComponent(roomId)}&state=${encodeURIComponent(roomState)}&tone=${encodeURIComponent(resolvedTone)}`,
      { signal: controller.signal }
    )
      .then((r) => r.json())
      .then((data: SceneResult) => {
        clearTimeout(timeout);

        if (data.retried) {
          setShowApology(true);
          setTimeout(() => setShowApology(false), 4000);
        }

        if (!data.url) {
          setErrorMessage(data.error ?? "The Sight is unavailable.");
          setStatus("error");
          return;
        }

        const img = new Image();
        img.onload = () => {
          if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
          // Fade in from black: place image at opacity 0, then transition to 1
          setFgUrl(data.url);
          setFgOpacity(0);
          requestAnimationFrame(() => requestAnimationFrame(() => {
            setFgOpacity(1);
            transitionTimerRef.current = setTimeout(() => {
              setBgUrl(data.url);
              setFgUrl(null);
              setFgOpacity(0);
              setStatus("loaded");
            }, 1200);
          }));
        };
        img.onerror = () => {
          setErrorMessage("The vision formed but could not be shown.");
          setStatus("error");
        };
        img.src = data.url!;
      })
      .catch((err: Error) => {
        clearTimeout(timeout);
        if (err.name === "AbortError") {
          setErrorMessage("The Sight takes too long. The realm continues without vision.");
        } else {
          setErrorMessage("The Sight is unavailable. Jane cannot show you this place.");
        }
        setStatus("error");
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, roomState, resolvedTone]);

  const roomDisplayName = displayName;

  return (
    <>
      <style>{`
        @keyframes le-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes le-pulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
      `}</style>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: fullScreen ? "100%" : "33vh",
          minHeight: fullScreen ? "100%" : 180,
          maxHeight: fullScreen ? "none" : 400,
          backgroundColor: "#0a0a0f",
          overflow: "hidden",
          flexShrink: fullScreen ? 1 : 0,
        }}
      >
        {/* ── Loading state ─────────────────────────────────────────────── */}
        {(status === "loading" || status === "retrying") && (
          <>
            {/* Shimmer background */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(90deg, #0d0d14 25%, #1a1a28 50%, #0d0d14 75%)",
                backgroundSize: "200% 100%",
                animation: "le-shimmer 2.2s linear infinite",
              }}
            />

            {/* Location name */}
            <div
              style={{
                position: "absolute",
                top: 20,
                left: 20,
                right: 20,
              }}
            >
              <p
                style={{
                  color: "rgba(251,191,36,0.5)",
                  fontSize: 11,
                  fontFamily: "Georgia, serif",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  margin: 0,
                  marginBottom: 8,
                  animation: "le-pulse 2s ease-in-out infinite",
                }}
              >
                {status === "retrying"
                  ? "The Sight reforms — a moment, traveller..."
                  : `Rendering ${roomDisplayName}...`}
              </p>

              {/* Visual description as loading text */}
              {localDescription && (
                <p
                  style={{
                    color: "rgba(148,163,184,0.35)",
                    fontSize: 12,
                    fontFamily: "Georgia, serif",
                    lineHeight: 1.6,
                    margin: 0,
                    fontStyle: "italic",
                    maxWidth: 600,
                  }}
                >
                  {localDescription}
                </p>
              )}
            </div>
          </>
        )}

        {/* ── Error state ───────────────────────────────────────────────── */}
        {status === "error" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
              padding: "20px 24px",
              background: "linear-gradient(135deg, #0d0d14 0%, #0f0a0a 100%)",
            }}
          >
            <p
              style={{
                color: "rgba(239,68,68,0.6)",
                fontSize: 11,
                fontFamily: "Georgia, serif",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                margin: 0,
                marginBottom: 8,
              }}
            >
              The Sight fails
            </p>
            <p
              style={{
                color: "rgba(148,163,184,0.5)",
                fontSize: 13,
                fontFamily: "Georgia, serif",
                fontStyle: "italic",
                lineHeight: 1.6,
                margin: 0,
                maxWidth: 560,
              }}
            >
              {errorMessage}
            </p>
            {localDescription && (
              <p
                style={{
                  color: "rgba(148,163,184,0.25)",
                  fontSize: 11,
                  fontFamily: "Georgia, serif",
                  fontStyle: "italic",
                  lineHeight: 1.5,
                  margin: "12px 0 0",
                  maxWidth: 560,
                }}
              >
                {localDescription}
              </p>
            )}
          </div>
        )}

        {/* ── Scene images: bottom (stable) + top (crossfading in) ────── */}
        {bgUrl && (
          <img
            src={bgUrl}
            alt={roomDisplayName}
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              opacity: 1,
            }}
          />
        )}
        {fgUrl && (
          <img
            src={fgUrl}
            alt={roomDisplayName}
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              opacity: fgOpacity,
              transition: "opacity 1200ms ease-in-out",
            }}
          />
        )}

        {/* ── Retry apology toast ───────────────────────────────────────── */}
        {showApology && (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "rgba(10,10,20,0.85)",
              border: "1px solid rgba(251,191,36,0.3)",
              borderRadius: 6,
              padding: "6px 16px",
              zIndex: 10,
            }}
          >
            <p
              style={{
                color: "rgba(251,191,36,0.8)",
                fontSize: 12,
                fontFamily: "Georgia, serif",
                fontStyle: "italic",
                margin: 0,
                whiteSpace: "nowrap",
              }}
            >
              The Sight wavered — Jane has found another way to show you this place.
            </p>
          </div>
        )}

        {/* Bottom vignette — subtle in fullScreen, fades to black otherwise */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: fullScreen ? "20%" : "45%",
            background: fullScreen
              ? "linear-gradient(to bottom, transparent, rgba(0,0,0,0.3))"
              : "linear-gradient(to bottom, transparent, #030712)",
            pointerEvents: "none",
          }}
        />

        {/* ── Room name pill ────────────────────────────────────────────── */}
        {status === "loaded" && bgUrl && (
          <span
            style={{
              position: "absolute",
              bottom: 10,
              left: 16,
              color: "rgba(229,231,235,0.6)",
              fontSize: 11,
              fontFamily: "Georgia, serif",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              pointerEvents: "none",
              zIndex: 2,
            }}
          >
            {roomDisplayName}
          </span>
        )}
      </div>
    </>
  );
}
