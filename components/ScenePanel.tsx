"use client";

import { useEffect, useRef, useState } from "react";

interface ScenePanelProps {
  roomId: string;
  roomState?: string;
  tone?: string;
}

export default function ScenePanel({
  roomId,
  roomState = "normal",
  tone = "civilized",
}: ScenePanelProps) {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [opacity, setOpacity] = useState(1);

  const prevRoomRef = useRef<string | null>(null);
  const prevStateRef = useRef<string | null>(null);

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

    setFetching(true);

    fetch(
      `/api/scene-image?room=${encodeURIComponent(roomId)}&state=${encodeURIComponent(roomState)}&tone=${encodeURIComponent(tone)}`
    )
      .then((r) => r.json())
      .then((data: { url: string | null }) => {
        if (!data.url) {
          setFetching(false);
          return;
        }

        const img = new Image();
        img.onload = () => {
          if (displayUrl) {
            setOpacity(0);
            setTimeout(() => {
              setDisplayUrl(data.url);
              setOpacity(1);
            }, 400);
          } else {
            setDisplayUrl(data.url);
            setOpacity(1);
          }
          setFetching(false);
        };
        img.onerror = () => setFetching(false);
        img.src = data.url;
      })
      .catch(() => setFetching(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, roomState, tone]);

  const roomDisplayName = roomId
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <>
      <style>{`
        @keyframes le-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "33vh",
          minHeight: 180,
          maxHeight: 400,
          backgroundColor: "#0a0a0f",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Shimmer skeleton — visible while fetching with no image yet */}
        {fetching && !displayUrl && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, #111118 25%, #1c1c28 50%, #111118 75%)",
              backgroundSize: "200% 100%",
              animation: "le-shimmer 2s linear infinite",
            }}
          />
        )}

        {/* Scene image */}
        {displayUrl && (
          <img
            src={displayUrl}
            alt={roomDisplayName}
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              opacity,
              transition: "opacity 400ms ease-in-out",
            }}
          />
        )}

        {/* Bottom vignette — blends into chat text below */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "45%",
            background: "linear-gradient(to bottom, transparent, #030712)",
            pointerEvents: "none",
          }}
        />

        {/* Room name — bottom left, only when image is showing */}
        {displayUrl && (
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
