"use client";

import { useMemo, useState } from "react";
import { commitHero } from "./actions";
import {
  HERO_BACKSTORIES,
  backstoriesByAlignment,
  type BackstoryAlignment,
  type HeroBackstoryTemplate,
} from "../../lib/heroBackstories";

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

const HEROES_PER_PAGE = 10;
const BACKSTORIES_PER_PAGE = 6;

function tagSummary(h: HeroMaster): string {
  const c = h.customization_vector || {};
  return [
    c.ageBand,
    c.skinTone?.replace(/_/g, " "),
    `${c.hairColor ?? ""} ${c.hairLength ?? ""}`.trim(),
    c.facialHair?.replace(/_/g, " "),
    c.eyeColor ? `${c.eyeColor} eyes` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function alignmentColor(a: BackstoryAlignment): string {
  switch (a) {
    case "blessing": return "#86efac"; // green
    case "curse": return "#fca5a5";    // red
    case "ambiguous": return "#c5ad75"; // amber
  }
}

function alignmentLabel(a: BackstoryAlignment): string {
  switch (a) {
    case "blessing": return "Blessing";
    case "curse": return "Curse";
    case "ambiguous": return "Unknown";
  }
}

export default function WizardClient({ masters, error }: Props) {
  // ── Hero selection state ──────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [heroPage, setHeroPage] = useState(0);

  // ── Name state ────────────────────────────────────────────
  // nameIsAutoFilled = true means the hero-select handler may overwrite
  // the field when user picks a new hero. The user typing in the field
  // flips this to false so their custom name sticks.
  const [heroName, setHeroName] = useState<string>("");
  const [nameIsAutoFilled, setNameIsAutoFilled] = useState<boolean>(true);

  // ── Backstory state ───────────────────────────────────────
  const [backstoryTemplateId, setBackstoryTemplateId] = useState<string | null>(null);
  const [backstoryText, setBackstoryText] = useState<string>("");
  const [backstoryFilter, setBackstoryFilter] = useState<BackstoryAlignment | "all">("all");
  const [backstoryPage, setBackstoryPage] = useState(0);

  const [submitting, setSubmitting] = useState(false);

  const selected = masters.find((m) => m.id === selectedId) || null;

  // ── Hero pagination ───────────────────────────────────────
  const heroPageCount = Math.max(1, Math.ceil(masters.length / HEROES_PER_PAGE));
  const heroesOnPage = masters.slice(
    heroPage * HEROES_PER_PAGE,
    heroPage * HEROES_PER_PAGE + HEROES_PER_PAGE
  );

  function pickMaster(m: HeroMaster) {
    setSelectedId(m.id);
    // Overwrite the name with this hero's suggested name UNLESS the user
    // has manually typed their own. The user-typing path flips
    // nameIsAutoFilled to false.
    if (nameIsAutoFilled) {
      setHeroName(m.hero_name);
    }
  }

  function onNameInput(v: string) {
    setHeroName(v);
    setNameIsAutoFilled(false);
  }

  // ── Backstory pagination ──────────────────────────────────
  const filteredBackstories = useMemo(
    () => backstoriesByAlignment(backstoryFilter),
    [backstoryFilter]
  );
  const backstoryPageCount = Math.max(
    1,
    Math.ceil(filteredBackstories.length / BACKSTORIES_PER_PAGE)
  );
  const backstoriesOnPage = filteredBackstories.slice(
    backstoryPage * BACKSTORIES_PER_PAGE,
    backstoryPage * BACKSTORIES_PER_PAGE + BACKSTORIES_PER_PAGE
  );

  function pickBackstory(t: HeroBackstoryTemplate) {
    setBackstoryTemplateId(t.id);
    setBackstoryText(t.full);
  }

  function onFilterChange(f: BackstoryAlignment | "all") {
    setBackstoryFilter(f);
    setBackstoryPage(0);
  }

  // ── Error copy ────────────────────────────────────────────
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
            Pick one. Name it. Recall — dimly — what touched thee before thou awoke on
            the church floor. Thy legend begins the moment thou dost step out the door.
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

        {/* ─── Section: Hero face ─── */}
        <section style={{ marginBottom: 48 }}>
          <SectionHeading
            step="I"
            title="The Face"
            subtitle={
              masters.length > HEROES_PER_PAGE
                ? `Page ${heroPage + 1} of ${heroPageCount} · ${masters.length} faces in the library`
                : `${masters.length} faces in the library`
            }
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 20,
              marginBottom: 16,
            }}
          >
            {heroesOnPage.map((m) => {
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

          {heroPageCount > 1 && (
            <Pagination
              page={heroPage}
              pageCount={heroPageCount}
              onChange={setHeroPage}
            />
          )}
        </section>

        {/* ─── Section: Name ─── */}
        <section style={{ maxWidth: 640, margin: "0 auto 48px" }}>
          <SectionHeading
            step="II"
            title="The Name"
            subtitle={
              selected
                ? `Suggested from ${selected.hero_name}, but name thy hero as thou wilt.`
                : "Pick a face above first."
            }
          />
          <input
            name="heroNameDisplay"
            value={heroName}
            onChange={(e) => onNameInput(e.target.value)}
            required
            maxLength={40}
            placeholder={selected ? "Type a name" : "Select a face first"}
            disabled={!selected}
            style={{
              width: "100%",
              background: "#111827",
              border: "1px solid #374151",
              color: "#e5e7eb",
              padding: "14px 18px",
              borderRadius: 6,
              fontSize: 18,
              fontFamily: "Georgia, serif",
              outline: "none",
              opacity: selected ? 1 : 0.4,
              letterSpacing: "0.02em",
            }}
          />
        </section>

        {/* ─── Section: Backstory ─── */}
        <section style={{ marginBottom: 48 }}>
          <SectionHeading
            step="III"
            title="The Last Memory"
            subtitle="Something touched thee before thou awokest. Choose a memory, or speak thine own."
          />

          {/* Filter chips */}
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 20,
              justifyContent: "center",
            }}
          >
            {(["all", "blessing", "curse", "ambiguous"] as const).map((f) => {
              const active = backstoryFilter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => onFilterChange(f)}
                  style={{
                    background: active
                      ? "rgba(251, 191, 36, 0.18)"
                      : "rgba(45, 22, 0, 0.4)",
                    color: active ? "#fbbf24" : "#a8a097",
                    border: active
                      ? "1px solid #fbbf24"
                      : "1px solid rgba(146, 64, 14, 0.4)",
                    borderRadius: 999,
                    padding: "6px 16px",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    fontFamily: "Georgia, serif",
                    transition: "all 0.15s",
                  }}
                >
                  {f === "all" ? `All (${HERO_BACKSTORIES.length})` : alignmentLabel(f)}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 16,
              marginBottom: 16,
            }}
          >
            {backstoriesOnPage.map((t) => {
              const isSelected = t.id === backstoryTemplateId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => pickBackstory(t)}
                  style={{
                    background: "rgba(12, 6, 2, 0.7)",
                    border: isSelected
                      ? "2px solid #fbbf24"
                      : "1px solid rgba(146, 64, 14, 0.4)",
                    boxShadow: isSelected
                      ? "0 0 0 3px rgba(251, 191, 36, 0.2)"
                      : "none",
                    borderRadius: 10,
                    padding: "16px 18px",
                    cursor: "pointer",
                    fontFamily: "Georgia, serif",
                    color: "inherit",
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: 12,
                    }}
                  >
                    <h3
                      style={{
                        color: "#fef3c7",
                        fontSize: "1.0625rem",
                        fontWeight: 700,
                        margin: 0,
                        lineHeight: 1.2,
                      }}
                    >
                      {t.title}
                    </h3>
                    <span
                      style={{
                        color: alignmentColor(t.alignment),
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {alignmentLabel(t.alignment)}
                    </span>
                  </div>
                  <p
                    style={{
                      color: "#a8a097",
                      fontSize: 13,
                      margin: 0,
                      lineHeight: 1.5,
                      fontStyle: "italic",
                    }}
                  >
                    {t.preview}
                  </p>
                </button>
              );
            })}
          </div>

          {backstoryPageCount > 1 && (
            <Pagination
              page={backstoryPage}
              pageCount={backstoryPageCount}
              onChange={setBackstoryPage}
            />
          )}
        </section>

        {/* ─── Commit form ─── */}
        <form
          action={commitHero}
          onSubmit={() => setSubmitting(true)}
          style={{
            maxWidth: 720,
            margin: "0 auto",
            background: "rgba(12, 6, 2, 0.85)",
            border: "1px solid rgba(146, 64, 14, 0.4)",
            borderRadius: 12,
            padding: 32,
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          {/* Hidden fields submit everything to the server action */}
          <input type="hidden" name="masterId" value={selectedId ?? ""} />
          <input type="hidden" name="heroName" value={heroName} />

          <p
            style={{
              color: "#fbbf24",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              margin: "0 0 8px 0",
            }}
          >
            Final: the memory as thou dost tell it
          </p>
          <p
            style={{
              color: "#a8a097",
              fontSize: 13,
              margin: "0 0 12px 0",
              lineHeight: 1.5,
            }}
          >
            Edit the chosen memory below, or replace it entirely with words of thine own.
            Leave it blank if thou art not ready to speak. The Chronicle has patience.
          </p>
          <textarea
            name="backstory"
            value={backstoryText}
            onChange={(e) => setBackstoryText(e.target.value)}
            maxLength={800}
            rows={5}
            placeholder="The memory, in thine own words…"
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
              marginBottom: 24,
            }}
          />

          <button
            type="submit"
            disabled={!selected || !heroName.trim() || submitting}
            style={{
              width: "100%",
              backgroundColor:
                !selected || !heroName.trim() || submitting ? "#4a2e15" : "#92400e",
              color: "#fef3c7",
              padding: "16px 24px",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              border:
                "1px solid " +
                (!selected || !heroName.trim() || submitting ? "#6b3a1a" : "#fbbf24"),
              cursor: !selected || !heroName.trim() || submitting ? "not-allowed" : "pointer",
              opacity: !selected || !heroName.trim() || submitting ? 0.5 : 1,
              fontFamily: "Georgia, serif",
              transition: "background 0.2s",
            }}
          >
            {submitting ? "Forging the Legend…" : "Begin the Legend"}
          </button>

          {!selected && (
            <p
              style={{
                textAlign: "center",
                color: "#8a7a60",
                fontSize: 12,
                margin: "16px 0 0 0",
                fontStyle: "italic",
              }}
            >
              Choose a face above to awaken.
            </p>
          )}
        </form>
      </main>
    </div>
  );
}

// ── Pagination control ────────────────────────────────────────────

function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (p: number) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 16,
      }}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(0, page - 1))}
        disabled={page === 0}
        style={paginationBtnStyle(page === 0)}
      >
        ← Prev
      </button>
      <span
        style={{
          color: "#a8a097",
          fontSize: 13,
          padding: "0 14px",
          fontFamily: "Georgia, serif",
          minWidth: 100,
          textAlign: "center",
        }}
      >
        Page {page + 1} of {pageCount}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(pageCount - 1, page + 1))}
        disabled={page === pageCount - 1}
        style={paginationBtnStyle(page === pageCount - 1)}
      >
        Next →
      </button>
    </div>
  );
}

function paginationBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? "rgba(45, 22, 0, 0.3)" : "rgba(146, 64, 14, 0.3)",
    color: disabled ? "#5a4a3a" : "#fbbf24",
    border: "1px solid " + (disabled ? "rgba(146, 64, 14, 0.2)" : "rgba(251, 191, 36, 0.4)"),
    padding: "8px 16px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "Georgia, serif",
    opacity: disabled ? 0.5 : 1,
    transition: "background 0.15s",
  };
}

// ── Section heading ──────────────────────────────────────────────

function SectionHeading({
  step,
  title,
  subtitle,
}: {
  step: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ marginBottom: 20, textAlign: "center" }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            color: "#92400e",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.3em",
            fontFamily: "Georgia, serif",
          }}
        >
          {step}
        </span>
        <h2
          style={{
            color: "#fef3c7",
            fontSize: "1.5rem",
            fontWeight: 700,
            margin: 0,
            letterSpacing: "0.03em",
          }}
        >
          {title}
        </h2>
      </div>
      {subtitle && (
        <p
          style={{
            color: "#a8a097",
            fontSize: 13,
            margin: 0,
            fontStyle: "italic",
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
