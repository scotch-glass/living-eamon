"use client";

import { useEffect, useState } from "react";
import { SPRITE_RENDER_MAX_HEIGHT } from "../lib/spriteFraming";

export type HeroEquipment =
  | "loincloth"
  | "gray_robe"
  | "common_clothes"
  | "leather_armor"
  | "chain_mail"
  | "plate_armor";
export type HeroStance = "casual" | "combat";
export type HeroWeaponCarry =
  | "unarmed"
  | "hip_short_blade"
  | "hip_long_blade"
  | "back_two_hander";

interface Props {
  heroMasterId: string | null | undefined;
  equipment: HeroEquipment;
  stance: HeroStance;
  weapon: HeroWeaponCarry;
}

/**
 * Renders the player's chosen hero master as a viewport-height sprite.
 * Intended to be placed inside an outer fixed flex container that
 * matches NPCSprite's pattern (top:0, bottom:0, display:flex,
 * alignItems:flex-end). The component returns a fragment so the <img>
 * is a direct flex child of that container — no nested wrapper that
 * could constrain sizing.
 */
export default function HeroScenePortrait({
  heroMasterId,
  equipment,
  stance,
  weapon,
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
      weapon,
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
  }, [heroMasterId, equipment, stance, weapon]);

  if (!heroMasterId) return null;

  return (
    <>
      {url && (
        <img
          src={url}
          alt="Your hero"
          style={{
            maxHeight: SPRITE_RENDER_MAX_HEIGHT,
            width: "auto",
            filter: "drop-shadow(0 16px 24px rgba(0, 0, 0, 0.65))",
            opacity: loading ? 0.6 : 1,
            transition: "opacity 0.4s",
          }}
        />
      )}
      {loading && !url && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            paddingLeft: 40,
            paddingBottom: 48,
          }}
        >
          <div
            style={{
              width: 120,
              height: 180,
              borderRadius: 6,
              background:
                "linear-gradient(180deg, rgba(60,45,25,0.35) 0%, rgba(30,20,10,0.55) 100%)",
              border: "1px solid rgba(180,140,60,0.25)",
              boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
              animation: "le-pulse 1.8s ease-in-out infinite",
            }}
          />
          <div
            style={{
              color: "#d9c48a",
              fontSize: 13,
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              letterSpacing: "0.08em",
              textShadow: "0 1px 2px rgba(0,0,0,0.8)",
            }}
          >
            forging thy likeness…
          </div>
        </div>
      )}
      {err && !loading && (
        <div
          style={{
            alignSelf: "center",
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
    </>
  );
}
