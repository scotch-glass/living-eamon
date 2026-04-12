"use client";

import { useState, useEffect, useRef } from "react";

export interface NPCSpriteProps {
  /** NPC id to display (must have a spritePrompt). null = hide. */
  npcId: string | null;
}

export default function NPCSprite({ npcId }: NPCSpriteProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const prevNpcRef = useRef<string | null>(null);

  useEffect(() => {
    if (!npcId) {
      // Fade out
      setVisible(false);
      prevNpcRef.current = null;
      return;
    }

    // Same NPC — already showing
    if (npcId === prevNpcRef.current && url) {
      setVisible(true);
      return;
    }

    prevNpcRef.current = npcId;
    setLoading(true);
    setVisible(false);

    fetch(`/api/npc-image?id=${encodeURIComponent(npcId)}`)
      .then(r => r.json())
      .then((data: { url: string | null }) => {
        if (data.url) {
          // Preload the image before showing
          const img = new Image();
          img.onload = () => {
            setUrl(data.url);
            setLoading(false);
            // Small delay to allow render before fade-in
            requestAnimationFrame(() => setVisible(true));
          };
          img.onerror = () => {
            setLoading(false);
          };
          img.src = data.url;
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
      });
  }, [npcId]);

  if (!url && !loading) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: "calc(50% + 300px)",
        bottom: 0,
        top: 0,
        overflow: "visible",
        pointerEvents: "none",
        zIndex: 3,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(30px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-start",
      }}
    >
      {url && (
        <img
          src={url}
          alt=""
          style={{
            maxHeight: "100%",
            width: "auto",
            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))",
          }}
        />
      )}
    </div>
  );
}
