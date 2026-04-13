"use client";

import { useState, useEffect } from "react";
import type { Item } from "../lib/gameData";

export interface ItemDetailPopupProps {
  item: Item | null;
  onClose: () => void;
}

/**
 * Convert a Latin name to a Linear B syllabic approximation.
 * Linear B has a fixed set of CV syllables (consonant + vowel).
 * This is decorative — not a real transliteration.
 */
function toLinearB(name: string): string {
  // Linear B syllable map — phonetic-ish, decorative
  const syllables: Record<string, string> = {
    a: "𐀀", e: "𐀁", i: "𐀂", o: "𐀃", u: "𐀄",
    da: "𐀅", de: "𐀆", di: "𐀇", do: "𐀈", du: "𐀉",
    ja: "𐀊", je: "𐀋", jo: "𐀍",
    ka: "𐀏", ke: "𐀐", ki: "𐀑", ko: "𐀒", ku: "𐀓",
    ma: "𐀔", me: "𐀕", mi: "𐀖", mo: "𐀗", mu: "𐀘",
    na: "𐀙", ne: "𐀚", ni: "𐀛", no: "𐀜", nu: "𐀝",
    pa: "𐀞", pe: "𐀟", pi: "𐀠", po: "𐀡", pu: "𐀢",
    qa: "𐀣", qe: "𐀤", qi: "𐀥", qo: "𐀦",
    ra: "𐀨", re: "𐀩", ri: "𐀪", ro: "𐀫", ru: "𐀬",
    sa: "𐀭", se: "𐀮", si: "𐀯", so: "𐀰", su: "𐀱",
    ta: "𐀲", te: "𐀳", ti: "𐀴", to: "𐀵", tu: "𐀶",
    wa: "𐀷", we: "𐀸", wi: "𐀹", wo: "𐀺",
    za: "𐀼", ze: "𐀽", zo: "𐀿",
  };

  const lower = name.toLowerCase().replace(/[^a-z ]/g, "");
  const words = lower.split(/\s+/).filter(Boolean);
  return words
    .map(word => {
      let result = "";
      let i = 0;
      while (i < word.length) {
        const c = word[i]!;
        const next = word[i + 1];
        const isVowel = /[aeiou]/.test(c);

        if (!isVowel && next && /[aeiou]/.test(next)) {
          // Consonant + vowel = one syllable
          const syl = c + next;
          result += syllables[syl] ?? syllables[next] ?? "𐀀";
          i += 2;
        } else if (isVowel) {
          result += syllables[c] ?? "𐀀";
          i += 1;
        } else {
          // Consonant without vowel — skip or use default
          result += syllables[c + "a"] ?? "";
          i += 1;
        }
      }
      return result;
    })
    .join(" ");
}

export default function ItemDetailPopup({ item, onClose }: ItemDetailPopupProps) {
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!item) {
      setBgUrl(null);
      return;
    }

    setLoading(true);
    fetch(`/api/item-image?id=${encodeURIComponent(item.id)}`)
      .then(r => r.json())
      .then((data: { url: string | null }) => {
        setBgUrl(data.url);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [item]);

  // Close on Escape key
  useEffect(() => {
    if (!item) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [item, onClose]);

  if (!item) return null;

  const linearBName = toLinearB(item.name);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        cursor: "pointer",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "relative",
          width: "min(90vw, 640px)",
          aspectRatio: "4/3",
          maxHeight: "85vh",
          backgroundColor: "#3a2a1a",
          backgroundImage: bgUrl ? `url(${bgUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: 8,
          boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
          cursor: "default",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "8% 12%",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {loading && !bgUrl && (
          <div style={{ color: "#cdb78a", fontSize: 14 }}>Opening the codex…</div>
        )}

        {/* Linear B name (decorative) */}
        <div
          style={{
            fontFamily: "var(--font-linear-b), serif",
            fontSize: "2rem",
            fontWeight: 700,
            color: "#1a0e05",
            textAlign: "center",
            marginBottom: 4,
            lineHeight: 1.2,
            textShadow: "0 1px 0 rgba(255,240,210,0.3)",
          }}
        >
          {linearBName}
        </div>

        {/* Latin name (readable) */}
        <div
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "#2a1a0a",
            textAlign: "center",
            marginBottom: 16,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {item.name}
        </div>

        {/* Cedarville cursive description */}
        <div
          style={{
            fontFamily: "var(--font-cedarville), cursive",
            fontSize: "1.15rem",
            color: "#2a1a0a",
            textAlign: "center",
            lineHeight: 1.6,
            maxWidth: "90%",
          }}
        >
          {item.alchemicalDescription ?? item.description}
        </div>

        {/* Close hint */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 16,
            fontSize: 11,
            color: "#5a4a3a",
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
          }}
        >
          click outside or press Esc to close
        </div>
      </div>
    </div>
  );
}
