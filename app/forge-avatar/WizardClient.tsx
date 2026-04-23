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
const BACKSTORIES_PER_PAGE = 5;
type Step = 1 | 2 | 3;

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
    case "blessing": return "#86efac";
    case "curse": return "#fca5a5";
    case "ambiguous": return "#c5ad75";
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
  const [step, setStep] = useState<Step>(1);

  // Hero
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [heroPage, setHeroPage] = useState(0);

  // Name — always starts empty. The library's hero_name is an internal
  // admin label and never pre-populates this field (per the
  // name-face decoupling rule: we don't want a hundred Kanes).
  const [heroName, setHeroName] = useState<string>("");

  // Backstory — player must pick one of the prescripted templates. No
  // free-text option. Each template is a canonical memory we can wire
  // into Jane's narration and side quests.
  const [backstoryTemplateId, setBackstoryTemplateId] = useState<string | null>(null);
  const [backstoryFilter, setBackstoryFilter] = useState<BackstoryAlignment | "all">("all");
  const [backstoryPage, setBackstoryPage] = useState(0);

  const [submitting, setSubmitting] = useState(false);

  const selected = masters.find((m) => m.id === selectedId) || null;

  function goto(s: Step) {
    setStep(s);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Hero step ────────────────────────────────────────────
  const heroPageCount = Math.max(1, Math.ceil(masters.length / HEROES_PER_PAGE));
  const heroesOnPage = masters.slice(
    heroPage * HEROES_PER_PAGE,
    heroPage * HEROES_PER_PAGE + HEROES_PER_PAGE
  );

  function pickMaster(m: HeroMaster) {
    setSelectedId(m.id);
  }

  function onNameInput(v: string) {
    setHeroName(v);
  }

  // ── Backstory step ───────────────────────────────────────
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
  }

  const selectedBackstory = backstoryTemplateId
    ? HERO_BACKSTORIES.find((t) => t.id === backstoryTemplateId) ?? null
    : null;

  function onFilterChange(f: BackstoryAlignment | "all") {
    setBackstoryFilter(f);
    setBackstoryPage(0);
  }

  // ── Error ───────────────────────────────────────────────
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
          background: "rgba(3, 7, 18, 0.88)",
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
        <header style={{ textAlign: "center", marginBottom: 32 }}>
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
              fontSize: "clamp(1.875rem, 3.5vw, 2.5rem)",
              fontWeight: 700,
              margin: "0 0 8px 0",
              lineHeight: 1.15,
            }}
          >
            {step === 1 && "Choose the face of thy Perpetual Hero"}
            {step === 2 && "Name thy hero"}
            {step === 3 && "Speak thy last memory"}
          </h1>
        </header>

        {/* Step indicator */}
        <StepIndicator
          step={step}
          onJump={(s) => {
            // Allow jumping backward freely; forward only if prior steps are satisfied.
            if (s < step) goto(s);
            else if (s === 2 && selected) goto(2);
            else if (s === 3 && selected && heroName.trim()) goto(3);
          }}
          canReachStep2={!!selected}
          canReachStep3={!!selected && heroName.trim().length > 0}
        />

        {errorMsg && (
          <div
            style={{
              backgroundColor: "#450a0a",
              border: "1px solid #7f1d1d",
              color: "#fca5a5",
              padding: "12px 20px",
              borderRadius: 6,
              fontSize: 14,
              margin: "0 auto 24px",
              textAlign: "center",
              maxWidth: 720,
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* ═══ STEP 1 — THE FACE ═══ */}
        {step === 1 && (
          <section>
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
                          color: "#a8a097",
                          fontSize: 12,
                          lineHeight: 1.5,
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

            <StepFooter
              rightButton={
                <WizardButton
                  primary
                  disabled={!selected}
                  onClick={() => selected && goto(2)}
                  hint={!selected ? "Pick a face to continue" : undefined}
                >
                  Continue → Name
                </WizardButton>
              }
            />
          </section>
        )}

        {/* ═══ STEP 2 — THE NAME ═══ */}
        {step === 2 && selected && (
          <section style={{ maxWidth: 720, margin: "0 auto" }}>
            <SectionHeading
              step="II"
              title="The Name"
              subtitle="The face thou hast chosen has no name of its own. Give it thy hero's name — one not yet known in the realms."
            />

            <SelectedHeroPreview hero={selected} />

            <label style={{ display: "block", margin: "28px 0 16px" }}>
              <span
                style={{
                  display: "block",
                  color: "#fbbf24",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Hero Name
              </span>
              <input
                autoFocus
                value={heroName}
                onChange={(e) => onNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && heroName.trim()) {
                    e.preventDefault();
                    goto(3);
                  }
                }}
                maxLength={40}
                placeholder="Type a name"
                style={{
                  width: "100%",
                  background: "#111827",
                  border: "1px solid #374151",
                  color: "#e5e7eb",
                  padding: "14px 18px",
                  borderRadius: 6,
                  fontSize: 20,
                  fontFamily: "Georgia, serif",
                  outline: "none",
                  letterSpacing: "0.02em",
                }}
              />
            </label>

            <StepFooter
              leftButton={
                <WizardButton onClick={() => goto(1)}>
                  ← Back to Face
                </WizardButton>
              }
              rightButton={
                <WizardButton
                  primary
                  disabled={!heroName.trim()}
                  onClick={() => heroName.trim() && goto(3)}
                  hint={!heroName.trim() ? "Name thy hero first" : undefined}
                >
                  Continue → Memory
                </WizardButton>
              }
            />
          </section>
        )}

        {/* ═══ STEP 3 — THE LAST MEMORY ═══ */}
        {step === 3 && selected && (
          <section>
            <SectionHeading
              step="III"
              title="The Last Memory"
              subtitle="Something touched thee before thou awokest. Choose the memory that shall haunt or shield thee — each draws its own thread through the realms."
            />

            <div style={{ maxWidth: 720, margin: "0 auto 24px" }}>
              <SelectedHeroPreview hero={selected} nameOverride={heroName} />
            </div>

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

            {/* Commit form */}
            <form
              action={commitHero}
              onSubmit={() => setSubmitting(true)}
              style={{
                maxWidth: 720,
                margin: "32px auto 0",
                background: "rgba(12, 6, 2, 0.85)",
                border: "1px solid rgba(146, 64, 14, 0.4)",
                borderRadius: 12,
                padding: 32,
              }}
            >
              <input type="hidden" name="masterId" value={selectedId ?? ""} />
              <input type="hidden" name="heroName" value={heroName} />
              <input
                type="hidden"
                name="backstoryTemplateId"
                value={backstoryTemplateId ?? ""}
              />
              <input
                type="hidden"
                name="backstory"
                value={selectedBackstory?.full ?? ""}
              />

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
                Thy chosen memory
              </p>

              {selectedBackstory ? (
                <div
                  style={{
                    background: "rgba(30, 18, 6, 0.6)",
                    border: "1px solid rgba(251, 191, 36, 0.25)",
                    borderRadius: 8,
                    padding: "16px 20px",
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: 12,
                      marginBottom: 10,
                    }}
                  >
                    <h4
                      style={{
                        color: "#fef3c7",
                        fontSize: "1.0625rem",
                        fontWeight: 700,
                        margin: 0,
                      }}
                    >
                      {selectedBackstory.title}
                    </h4>
                    <span
                      style={{
                        color: alignmentColor(selectedBackstory.alignment),
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                      }}
                    >
                      {alignmentLabel(selectedBackstory.alignment)}
                    </span>
                  </div>
                  <p
                    style={{
                      color: "#e8d4a0",
                      fontSize: 14,
                      lineHeight: 1.65,
                      margin: 0,
                      fontStyle: "italic",
                    }}
                  >
                    {selectedBackstory.full}
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    background: "rgba(30, 18, 6, 0.4)",
                    border: "1px dashed rgba(146, 64, 14, 0.4)",
                    borderRadius: 8,
                    padding: "20px 20px",
                    marginBottom: 24,
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      color: "#8a7a60",
                      fontSize: 13,
                      margin: 0,
                      fontStyle: "italic",
                    }}
                  >
                    Choose a memory from the cards above. Each shapes what thou dost
                    carry into the Church of Perpetual Life.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={!heroName.trim() || !backstoryTemplateId || submitting}
                style={{
                  width: "100%",
                  backgroundColor:
                    !heroName.trim() || !backstoryTemplateId || submitting
                      ? "#4a2e15"
                      : "#92400e",
                  color: "#fef3c7",
                  padding: "16px 24px",
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  border:
                    "1px solid " +
                    (!heroName.trim() || !backstoryTemplateId || submitting
                      ? "#6b3a1a"
                      : "#fbbf24"),
                  cursor:
                    !heroName.trim() || !backstoryTemplateId || submitting
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    !heroName.trim() || !backstoryTemplateId || submitting ? 0.5 : 1,
                  fontFamily: "Georgia, serif",
                  transition: "background 0.2s",
                }}
              >
                {submitting ? "Forging the Legend…" : "Begin the Legend"}
              </button>
              {!backstoryTemplateId && (
                <p
                  style={{
                    textAlign: "center",
                    color: "#8a7a60",
                    fontSize: 12,
                    margin: "12px 0 0 0",
                    fontStyle: "italic",
                  }}
                >
                  Select one of the memories above to begin.
                </p>
              )}
            </form>

            <StepFooter
              leftButton={
                <WizardButton onClick={() => goto(2)}>← Back to Name</WizardButton>
              }
            />
          </section>
        )}
      </main>
    </div>
  );
}

// ════ Subcomponents ════════════════════════════════════════════════

function StepIndicator({
  step,
  onJump,
  canReachStep2,
  canReachStep3,
}: {
  step: Step;
  onJump: (s: Step) => void;
  canReachStep2: boolean;
  canReachStep3: boolean;
}) {
  const labels: [Step, string, boolean][] = [
    [1, "The Face", true],
    [2, "The Name", canReachStep2],
    [3, "The Memory", canReachStep3],
  ];
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 14,
        marginBottom: 40,
        flexWrap: "wrap",
      }}
    >
      {labels.map(([n, label, reachable], idx) => {
        const active = n === step;
        const passed = n < step;
        const clickable = reachable;
        return (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              type="button"
              onClick={() => clickable && onJump(n)}
              disabled={!clickable}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: active
                  ? "rgba(251, 191, 36, 0.16)"
                  : passed
                    ? "rgba(146, 64, 14, 0.25)"
                    : "rgba(45, 22, 0, 0.4)",
                border: active
                  ? "1px solid #fbbf24"
                  : "1px solid rgba(146, 64, 14, 0.35)",
                color: active ? "#fbbf24" : passed ? "#c5ad75" : "#8a7a60",
                padding: "8px 16px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontFamily: "Georgia, serif",
                cursor: clickable ? "pointer" : "not-allowed",
                opacity: clickable ? 1 : 0.55,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: active
                    ? "#fbbf24"
                    : passed
                      ? "#92400e"
                      : "rgba(146, 64, 14, 0.4)",
                  color: active ? "#030712" : "#fef3c7",
                  fontSize: 12,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  letterSpacing: 0,
                }}
              >
                {n}
              </span>
              {label}
            </button>
            {idx < labels.length - 1 && (
              <span
                style={{
                  width: 18,
                  height: 1,
                  background: "rgba(146, 64, 14, 0.5)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SelectedHeroPreview({
  hero,
  nameOverride,
}: {
  hero: HeroMaster;
  nameOverride?: string;
}) {
  const displayName = nameOverride?.trim();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        background: "rgba(45, 22, 0, 0.55)",
        border: "1px solid rgba(146, 64, 14, 0.4)",
        borderRadius: 10,
        padding: 16,
      }}
    >
      <div
        style={{
          width: 72,
          height: 96,
          flexShrink: 0,
          position: "relative",
          background: "linear-gradient(180deg, #1a1208 0%, #000 100%)",
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        <img
          src={hero.master_image_url}
          alt="Chosen hero"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "center bottom",
          }}
        />
      </div>
      <div>
        <div
          style={{
            color: displayName ? "#fef3c7" : "#8a7a60",
            fontSize: "1.125rem",
            fontWeight: displayName ? 700 : 500,
            marginBottom: 4,
            fontStyle: displayName ? "normal" : "italic",
          }}
        >
          {displayName || "Unnamed as yet"}
        </div>
        <div style={{ color: "#a8a097", fontSize: 12, lineHeight: 1.4 }}>
          {tagSummary(hero)}
        </div>
      </div>
    </div>
  );
}

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
    <div style={{ marginBottom: 24, textAlign: "center" }}>
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

function StepFooter({
  leftButton,
  rightButton,
}: {
  leftButton?: React.ReactNode;
  rightButton?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        maxWidth: 720,
        margin: "32px auto 0",
        gap: 16,
      }}
    >
      <div>{leftButton}</div>
      <div>{rightButton}</div>
    </div>
  );
}

function WizardButton({
  primary,
  disabled,
  onClick,
  hint,
  children,
}: {
  primary?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{
          background: primary
            ? disabled
              ? "#4a2e15"
              : "#92400e"
            : "rgba(45, 22, 0, 0.4)",
          color: primary ? "#fef3c7" : "#c5ad75",
          padding: primary ? "14px 28px" : "12px 22px",
          borderRadius: 8,
          fontSize: primary ? 15 : 13,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          border:
            "1px solid " +
            (primary
              ? disabled
                ? "#6b3a1a"
                : "#fbbf24"
              : "rgba(146, 64, 14, 0.4)"),
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          fontFamily: "Georgia, serif",
          transition: "background 0.2s",
        }}
      >
        {children}
      </button>
      {hint && (
        <span style={{ color: "#8a7a60", fontSize: 11, fontStyle: "italic" }}>
          {hint}
        </span>
      )}
    </div>
  );
}

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
    border:
      "1px solid " + (disabled ? "rgba(146, 64, 14, 0.2)" : "rgba(251, 191, 36, 0.4)"),
    padding: "8px 16px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "Georgia, serif",
    opacity: disabled ? 0.5 : 1,
  };
}
