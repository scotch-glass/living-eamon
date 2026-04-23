"use client";

import { useState } from "react";
import { commitHero } from "./actions";

export interface HeroMaster {
  id: string;
  slug: string;
  hero_name: string;
  master_image_url: string;
  customization_vector: {
    ageBand?: string;
    skinTone?: string;
    hairColor?: string;
    hairLength?: string;
    facialHair?: string;
    eyeColor?: string;
  };
}

interface Props {
  masters: HeroMaster[];
  error: string | null;
}

function tagSummary(h: HeroMaster): string {
  const c = h.customization_vector || {};
  return [c.ageBand, c.skinTone?.replace(/_/g, " "), `${c.hairColor ?? ""} ${c.hairLength ?? ""}`.trim(), c.facialHair?.replace(/_/g, " "), c.eyeColor ? `${c.eyeColor} eyes` : null]
    .filter(Boolean)
    .join(" · ");
}

export default function WizardClient({ masters, error }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [heroName, setHeroName] = useState<string>("");
  const [backstory, setBackstory] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const selected = masters.find((m) => m.id === selectedId) || null;

  function pickMaster(m: HeroMaster) {
    setSelectedId(m.id);
    // Pre-populate name from the suggested heroName, only if the player
    // hasn't typed their own already.
    if (!heroName.trim()) setHeroName(m.hero_name);
  }

  const errorMsg =
    error === "missing_fields"
      ? "Please select a hero and give thy legend a name."
      : error === "invalid_master"
        ? "That hero is no longer available. Please choose another."
        : error
          ? error
          : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#030712",
        backgroundImage: "url(/register-bg.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        color: "#e8d4a0",
        fontFamily: "Georgia, serif",
        position: "relative",
      }}
    >
      {/* Darkening overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(3, 7, 18, 0.85)",
          pointerEvents: "none",
        }}
      />

      <main
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1280,
          margin: "0 auto",
          padding: "48px 32px 96px",
        }}
      >
        {/* Header */}
        <header style={{ textAlign: "center", marginBottom: 48 }}>
          <p
            style={{
              color: "#fbbf24",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              margin: "0 0 12px 0",
            }}
          >
            Claim Your Avatar
          </p>
          <h1
            style={{
              color: "#fef3c7",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              margin: "0 0 16px 0",
              lineHeight: 1.1,
            }}
          >
            Choose the face of thy Perpetual Hero
          </h1>
          <p
            style={{
              color: "#a8a097",
              fontSize: 16,
              maxWidth: 720,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Each face is a vessel that will carry thy deeds across a thousand realms.
            Pick one. Name it. Speak a few words of where it came from. Thy legend begins
            the moment thou dost set foot out of the Church of Perpetual Life.
          </p>
        </header>

        {errorMsg && (
          <div
            style={{
              backgroundColor: "#450a0a",
              border: "1px solid #7f1d1d",
              color: "#fca5a5",
              padding: "12px 20px",
              borderRadius: 6,
              fontSize: 14,
              marginBottom: 24,
              textAlign: "center",
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Library grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
            marginBottom: 48,
          }}
        >
          {masters.map((m) => {
            const isSelected = m.id === selectedId;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => pickMaster(m)}
                style={{
                  background: "rgba(45, 22, 0, 0.55)",
                  border: isSelected
                    ? "2px solid #fbbf24"
                    : "1px solid rgba(146, 64, 14, 0.4)",
                  boxShadow: isSelected
                    ? "0 0 0 3px rgba(251, 191, 36, 0.2), 0 8px 32px rgba(0,0,0,0.6)"
                    : "none",
                  borderRadius: 10,
                  padding: 0,
                  cursor: "pointer",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.15s, border-color 0.15s",
                  fontFamily: "Georgia, serif",
                  color: "inherit",
                  textAlign: "left",
                  transform: isSelected ? "translateY(-2px)" : "none",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    aspectRatio: "3 / 4",
                    background: "linear-gradient(180deg, #1a1208 0%, #000 100%)",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={m.master_image_url}
                    alt={m.hero_name}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      objectPosition: "center bottom",
                      filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.6))",
                    }}
                  />
                </div>
                <div style={{ padding: "12px 16px 14px" }}>
                  <div
                    style={{
                      color: "#fef3c7",
                      fontSize: "1rem",
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    {m.hero_name}
                  </div>
                  <div
                    style={{
                      color: "#a8a097",
                      fontSize: 12,
                      lineHeight: 1.4,
                    }}
                  >
                    {tagSummary(m)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Commit form */}
        <form
          action={commitHero}
          onSubmit={() => setSubmitting(true)}
          style={{
            maxWidth: 640,
            margin: "0 auto",
            background: "rgba(12, 6, 2, 0.85)",
            border: "1px solid rgba(146, 64, 14, 0.4)",
            borderRadius: 12,
            padding: 32,
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          <h2
            style={{
              color: "#fbbf24",
              fontSize: 22,
              fontWeight: 700,
              margin: "0 0 8px 0",
              letterSpacing: "0.03em",
            }}
          >
            {selected ? `Forge ${selected.hero_name}` : "Pick a face above"}
          </h2>
          <p
            style={{
              color: "#a8a097",
              fontSize: 14,
              lineHeight: 1.6,
              margin: "0 0 20px 0",
            }}
          >
            {selected
              ? "Rename thy hero if thou wishest, and speak a few words of the life that forged him."
              : "The form below will unlock once thou hast chosen a face from the grid above."}
          </p>

          <input type="hidden" name="masterId" value={selectedId ?? ""} />

          <label
            style={{
              display: "block",
              marginBottom: 20,
            }}
          >
            <span
              style={{
                display: "block",
                color: "#fbbf24",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Hero Name
            </span>
            <input
              name="heroName"
              value={heroName}
              onChange={(e) => setHeroName(e.target.value)}
              required
              maxLength={40}
              placeholder="Choose a name"
              disabled={!selected}
              style={{
                width: "100%",
                background: "#111827",
                border: "1px solid #374151",
                color: "#e5e7eb",
                padding: "12px 16px",
                borderRadius: 6,
                fontSize: 16,
                fontFamily: "Georgia, serif",
                outline: "none",
                opacity: selected ? 1 : 0.4,
              }}
            />
          </label>

          <label
            style={{
              display: "block",
              marginBottom: 24,
            }}
          >
            <span
              style={{
                display: "block",
                color: "#fbbf24",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Backstory (optional)
            </span>
            <textarea
              name="backstory"
              value={backstory}
              onChange={(e) => setBackstory(e.target.value)}
              maxLength={800}
              rows={5}
              placeholder="A few lines about where thy hero came from — orphan, exiled noble, mercenary's son, last of a burned village. Leave blank if thou hast no words yet."
              disabled={!selected}
              style={{
                width: "100%",
                background: "#111827",
                border: "1px solid #374151",
                color: "#e5e7eb",
                padding: "12px 16px",
                borderRadius: 6,
                fontSize: 14,
                fontFamily: "Georgia, serif",
                outline: "none",
                resize: "vertical",
                opacity: selected ? 1 : 0.4,
                lineHeight: 1.6,
              }}
            />
          </label>

          <button
            type="submit"
            disabled={!selected || submitting}
            style={{
              width: "100%",
              backgroundColor: !selected || submitting ? "#4a2e15" : "#92400e",
              color: "#fef3c7",
              padding: "16px 24px",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              border: "1px solid " + (!selected || submitting ? "#6b3a1a" : "#fbbf24"),
              cursor: !selected || submitting ? "not-allowed" : "pointer",
              opacity: !selected || submitting ? 0.5 : 1,
              fontFamily: "Georgia, serif",
              transition: "background 0.2s",
            }}
          >
            {submitting ? "Forging the Legend…" : "Begin the Legend"}
          </button>
        </form>
      </main>
    </div>
  );
}
