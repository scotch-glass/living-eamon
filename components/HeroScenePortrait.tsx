"use client";

import { useEffect, useState } from "react";

export type HeroEquipment = "loincloth" | "gray_robe";
export type HeroStance = "casual" | "combat";

interface Props {
  heroMasterId: string | null | undefined;
  equipment: HeroEquipment;
  stance: HeroStance;
  /** Optional CSS class for the wrapper. */
  className?: string;
  /** Inline style overrides for the wrapper. */
  style?: React.CSSProperties;
}

/**
 * Shows the player's chosen hero master, wearing the specified
 * equipment, in the specified stance. Fetches the URL from
 * /api/hero-equipment-sprite which generates + caches variations on
 * demand. Default (loincloth/casual) short-circuits to the master URL
 * already stored with the hero.
 */
export default function HeroScenePortrait({
  heroMasterId,
  equipment,
  stance,
  className,
  style,
}: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!heroMasterId) {
      setUrl(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErr(null);
    const params = new URLSearchParams({
      heroMasterId,
      equipment,
      stance,
    });
    fetch(`/api/hero-equipment-sprite?${params.toString()}`)
      .then((r) => r.json())
      .then((data: { url: string | null; error?: string }) => {
        if (cancelled) return;
        if (data.url) {
          setUrl(data.url);
          setErr(null);
        } else {
          setUrl(null);
          setErr(data.error ?? "no url returned");
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setErr(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [heroMasterId, equipment, stance]);

  if (!heroMasterId) return null;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
        ...style,
      }}
    >
      {url && (
        <img
          src={url}
          alt="Your hero"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "center bottom",
            filter: "drop-shadow(0 16px 24px rgba(0, 0, 0, 0.65))",
            opacity: loading ? 0.6 : 1,
            transition: "opacity 0.4s",
          }}
        />
      )}
      {loading && !url && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: 24,
            color: "#8a7a60",
            fontSize: 11,
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            letterSpacing: "0.08em",
          }}
        >
          forging thy likeness…
        </div>
      )}
      {err && !loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#7f1d1d",
            fontSize: 10,
            fontFamily: "Georgia, serif",
            padding: 12,
            textAlign: "center",
          }}
        >
          {err}
        </div>
      )}
    </div>
  );
}
