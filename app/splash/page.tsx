"use client";

import PublicNav from "../../components/PublicNav";

const FEATURES: { title: string; body: string }[] = [
  {
    title: "Forbidden Sorcery That Hunts You",
    body: "The Order disappears Occultists and sometimes the witnesses who saw them. Invoke in public, fizzle a syllable, attract attention — and discover that inquisitors don't leave survivors. No tutorial will teach you the Words of Power. Find them yourself and choose the destiny of worlds.",
  },
  {
    title: "Your Deeds Live in the Chronicle of Deeds",
    body: "Every kill, every betrayal, every forbidden summoning is recorded in the Chronicle of Deeds and carried forward across sessions, realms, and lifetimes. The Chronicle is read by every NPC you meet. You cannot erase what you have done.",
  },
  {
    title: "Body-Zone Combat & Real Wounds",
    body: "Strike head, neck, torso, or limbs. Armor covers specific zones and degrades hit by hit. Severed arteries bleed until bandaged. Poison accrues in severity. Broken legs keep you from running. Flesh wounds, not abstract HP.",
  },
  {
    title: "Power Corrupts",
    body: "Powerful, dark sorceries grant nearly unlimited power. NPCs smell the taint. Temples close their doors. You can wield the dagger of a Scythian priest, but the kingdom will know what you have become.",
  },
  {
    title: "Eight Circles of Sorcery",
    body: "64 forbidden invocations, from simple binding to the summoning of things the stars wish forgotten. Each circle demands rarer reagents, costlier risk, and greater notice from the Order. The highest circles can shatter a city.",
  },
  {
    title: "Reagents Cannot Be Bought in Town",
    body: "Eight sacred reagents, none for sale in civilized places. Hunt them, trade for them in worlds that don't ask questions, and keep your hoard hidden. A full reagent pouch is evidence if put to the Question by the Order.",
  },
  {
    title: "Realistic Armor & Weapon Physics",
    body: "Weight has consequences. Plate armor is heavy and custom-fit — crippling on foot. Only mounted knights wear it without being immobilized by their own gear. An unarmored sword master with high dexterity will out-dance an unhorsed, armored knight every time.",
  },
  {
    title: "Destructible Environments, Permanent Ruins",
    body: "Burn a building and it stays burnt — in this realm and in the Chronicle. Survivors become refugees, reagent markets collapse, the Order investigates. Eighth-circle rituals can ruin a city entirely.",
  },
  {
    title: "Death Is Costly. Be prepared to pay the price.",
    body: "Die and you rise again naked and shamed in the Church of Perpetual Life, your gear lost, your gold gone. But your virtues and skills remain. The hero returns, blessed or cursed by the silent god of perpetual life.",
  },
  {
    title: "Voice Narration & Graphic-Novel Art",
    body: "Every scene is rendered in the spirit of the 1970s–80s sword-and-sorcery graphic novels that set our imaginations on fire — Frazetta, Brom, Corben — in full R-rated weight. Jane speaks your story aloud, in a voice that knows it by heart. You read, you listen, you see.",
  },
  {
    title: "From Player to Creator",
    body: "Living Eamon ships with the same Creator Lab we use to build new realms. Ambitious players become writers, cartographers, and dungeon-masters — continuing the Perpetual Hero's journey with their own sagas, shared with the world or kept as private canon.",
  },
];

const PILLARS = [
  {
    eyebrow: "The Order",
    title: "Forbidden Occult Sorcery",
    body: "Two systems. Legal Guild-endorsed magic is safe and weak. Mysterious, occult sorcery is powerful and illegal — and the Order hunts everyone who has ever even asked about it. Sorcery triggered the Cataclysm that ended the Thurian Age, and will destroy the world again if it can...and it can.",
  },
  {
    eyebrow: "The Chronicle",
    title: "A World That Remembers",
    body: "Every significant act is written into a persistent chronicle that follows the Perpetual Hero across every realm, every adventure, every death. Nothing is forgotten.",
  },
  {
    eyebrow: "The Realms",
    title: "An Atlas of Realms, in the Tradition of Eamon",
    body: "The original 1980 Eamon shipped with hundreds of player-written realms. Living Eamon resurrects that promise. One realm is ruled by sorcerers in marble courts. Another by alien intelligences in fallen skyships. Another by gunsmiths riding iron rails through sulfur deserts. Your hero carries every scar across them all.",
  },
];

const LAUNCH_ADVENTURES: { title: string; hook: string }[] = [
  {
    title: "The Mirrors of Tuzun Thune",
    hook: "A ruined tower in the wilderness. A dead wizard's mirror chamber, undusted after twelve thousand years. Each mirror shows a life you never lived — and the Order wants them shattered.",
  },
  {
    title: "The Shadow Kingdom",
    hook: "A noble court is being killed off one by one and replaced by serpent-men wearing the dead's faces. A single phrase in an ancient tongue will unmask them. Say it and watch who cannot say it back.",
  },
  {
    title: "Kings of the Night",
    hook: "A Pictish shaman opens a tomb sealed before the Cataclysm. The ritual needs a hero who can reach across the ages — and a corpse-army of Stygian raiders stands between her and sunrise.",
  },
];

const PROGRESS_ITEMS = [
  "Body-zone combat with bleed, poison & wound effects",
  "Persistent hero with name, PICSSI virtue scores, Chronicle across realms",
  "Guild magic & Occult sorcery — four Guild spells, sorcery circles 1–4 coded",
  "Living-world database: NPCs remember, rooms remember",
  "PICSSI six-dimensional virtue system — drives NPC attraction, prayer reach, dark-patron reach",
  "Banking, vendor temp stock & 72-hour buyback",
];

export default function SplashPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#030712",
        display: "flex",
        flexDirection: "column",
        color: "#e8d4a0",
      }}
    >
      <PublicNav currentPage="login" />

      {/* ───────────────────────── HERO ───────────────────────── */}
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          padding: "80px 32px 96px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <img
          src="/art/brand/hero.jpg"
          alt="A barbarian protects a kneeling woman from Persian warriors under a stormy sky crafted by Robert E. Howard"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.5,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(3, 7, 18, 0.2) 0%, rgba(3, 7, 18, 0.7) 60%, rgba(3, 7, 18, 0.95) 100%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: 1280,
            fontFamily: "Georgia, serif",
            display: "grid",
            // 3 columns on desktop; mobile collapses to one (logo / [hidden center] / tagline stack).
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)",
            columnGap: 32,
            rowGap: 28,
            alignItems: "center",
          }}
          className="le-splash-hero-grid"
        >
          {/* Top wide row — eyebrow tagline spans all three columns */}
          <p
            style={{
              gridColumn: "1 / -1",
              color: "#fbbf24",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              margin: 0,
              textAlign: "center",
            }}
          >
            A Living Text Adventure — Inspired by Robert E. Howard's Thurian Age Sword &amp; Sorcery Tales
          </p>

          {/* Left column — logo, left-justified */}
          <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
            <img
              src="/art/brand/logo.png"
              alt="Living Eamon"
              style={{
                width: "100%",
                maxWidth: 420,
                height: "auto",
                display: "block",
                filter: "drop-shadow(0 4px 32px rgba(0, 0, 0, 0.7))",
              }}
            />
          </div>

          {/* Center column — intentionally empty so the background graphic shows through. */}
          <div className="le-splash-hero-center" aria-hidden="true" />

          {/* Right column — tagline, left-justified within the column. */}
          <h1
            style={{
              color: "#fef3c7",
              fontSize: "clamp(2.0rem, 4.5vw, 3.25rem)",
              fontWeight: 700,
              lineHeight: 1.15,
              margin: 0,
              textShadow: "0 2px 24px rgba(0, 0, 0, 0.85)",
              textAlign: "left",
            }}
          >
            One hero.
            <br />
            A thousand realms.
            <br />
            A chronicle that
            <br />
            never forgets.
          </h1>

          {/* Bottom wide row — description spans all three columns */}
          <p
            style={{
              gridColumn: "1 / -1",
              color: "#e8d4a0",
              fontSize: "clamp(1.0625rem, 1.6vw, 1.25rem)",
              lineHeight: 1.7,
              margin: "0 auto",
              maxWidth: 880,
              textAlign: "center",
              textShadow: "0 1px 12px rgba(0, 0, 0, 0.7)",
            }}
          >
            Living Eamon is a persistent, AI-driven sword-and-sorcery adventure set in
            Robert E.&nbsp;Howard&rsquo;s sword and sorcery age. Hunt forbidden reagents under the
            full moon, avoiding the Order&rsquo;s inquisitive eye. Carry your scars, your virtues, and your legend from one realm to the next. Everything you do is written down — you are the immortal hero - famed or shamed across worlds.
          </p>

          {/* CTA — also spans all columns, centered */}
          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
            }}
          >
            <a
              href="/register"
              style={{
                background: "#92400e",
                color: "#fef3c7",
                padding: "18px 44px",
                borderRadius: 8,
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                textDecoration: "none",
                transition: "background 0.2s, transform 0.15s",
                fontFamily: "Georgia, serif",
                border: "1px solid #fbbf24",
                boxShadow: "0 4px 24px rgba(146, 64, 14, 0.4)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = "#b35712";
                el.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = "#92400e";
                el.style.transform = "translateY(0)";
              }}
            >
              Register for Early Access
            </a>
            <a
              href="/login"
              style={{
                color: "#a8a097",
                fontSize: 15,
                fontFamily: "Georgia, serif",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fbbf24")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#a8a097")}
            >
              Already a tester? Sign in &rarr;
            </a>
          </div>
        </div>

        {/* Mobile: collapse the 3-column grid to a single column and stack
            (logo above tagline) — hide the empty transparent center column.
            Tablet/desktop keeps the 3-column layout. */}
        <style>{`
          @media (max-width: 900px) {
            .le-splash-hero-grid {
              grid-template-columns: 1fr !important;
            }
            .le-splash-hero-grid > h1 {
              text-align: center !important;
            }
            .le-splash-hero-grid > div:first-of-type {
              justify-content: center !important;
            }
            .le-splash-hero-center {
              display: none !important;
            }
          }
        `}</style>
      </section>

      {/* ───────────────────────── PILLARS ───────────────────────── */}
      <section
        style={{
          background: "linear-gradient(180deg, #030712 0%, #0a0a0a 100%)",
          padding: "96px 32px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2
            style={{
              color: "#fbbf24",
              fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
              fontWeight: 700,
              fontFamily: "Georgia, serif",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            Three Things No Other Adventure Has
          </h2>
          <p
            style={{
              color: "#a8a097",
              fontSize: 17,
              lineHeight: 1.6,
              textAlign: "center",
              maxWidth: 700,
              margin: "0 auto 56px",
              fontFamily: "Georgia, serif",
            }}
          >
            Living Eamon is a persistent, living world with memory, a magistrate, and an atlas of realms stretching across every genre of the fantastic.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 28,
            }}
          >
            {PILLARS.map((p) => (
              <div
                key={p.title}
                style={{
                  background: "rgba(45, 22, 0, 0.55)",
                  border: "1px solid rgba(146, 64, 14, 0.4)",
                  borderRadius: 10,
                  padding: "32px 28px",
                }}
              >
                <p
                  style={{
                    color: "#fbbf24",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    margin: "0 0 10px 0",
                    fontFamily: "Georgia, serif",
                  }}
                >
                  {p.eyebrow}
                </p>
                <h3
                  style={{
                    color: "#fef3c7",
                    fontSize: "1.375rem",
                    fontWeight: 700,
                    fontFamily: "Georgia, serif",
                    margin: "0 0 16px 0",
                    lineHeight: 1.25,
                  }}
                >
                  {p.title}
                </h3>
                <p
                  style={{
                    color: "#e8d4a0",
                    fontSize: 16,
                    lineHeight: 1.65,
                    fontFamily: "Georgia, serif",
                    margin: 0,
                  }}
                >
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── NUMBERS STRIP ───────────────────────── */}
      <section
        style={{
          background: "rgba(12, 6, 2, 0.6)",
          borderTop: "1px solid rgba(146, 64, 14, 0.25)",
          borderBottom: "1px solid rgba(146, 64, 14, 0.25)",
          padding: "56px 32px",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 24,
            textAlign: "center",
            fontFamily: "Georgia, serif",
          }}
        >
          {[
            { n: "8", label: "Circles of Sorcery" },
            { n: "64", label: "Forbidden Invocations" },
            { n: "6", label: "PICSSI Virtue Dimensions" },
            { n: "4", label: "Body Zones in Combat" },
            { n: "∞", label: "Procedurally-Generated Realms" },
          ].map((s) => (
            <div key={s.label}>
              <div
                style={{
                  color: "#fbbf24",
                  fontSize: "3rem",
                  fontWeight: 700,
                  lineHeight: 1,
                  marginBottom: 10,
                }}
              >
                {s.n}
              </div>
              <div
                style={{
                  color: "#a8a097",
                  fontSize: 14,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────── FEATURE GRID ───────────────────────── */}
      <section
        style={{
          background: "linear-gradient(180deg, #0a0a0a 0%, #030712 100%)",
          padding: "96px 32px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2
            style={{
              color: "#fbbf24",
              fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
              fontWeight: 700,
              fontFamily: "Georgia, serif",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            What You Will Actually Do
          </h2>
          <p
            style={{
              color: "#a8a097",
              fontSize: 17,
              lineHeight: 1.6,
              textAlign: "center",
              maxWidth: 720,
              margin: "0 auto 64px",
              fontFamily: "Georgia, serif",
            }}
          >
            Eleven concrete systems, each designed to make every decision feel like it
            could kill you — or make you immortal.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: 28,
            }}
          >
            {FEATURES.map((f, idx) => (
              <div
                key={f.title}
                style={{
                  background: "rgba(45, 22, 0, 0.35)",
                  border: "1px solid rgba(146, 64, 14, 0.3)",
                  borderLeft: "3px solid #fbbf24",
                  borderRadius: 6,
                  padding: "24px 26px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      color: "#92400e",
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: "Georgia, serif",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h3
                    style={{
                      color: "#fef3c7",
                      fontSize: "1.1875rem",
                      fontWeight: 700,
                      fontFamily: "Georgia, serif",
                      margin: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    {f.title}
                  </h3>
                </div>
                <p
                  style={{
                    color: "#e8d4a0",
                    fontSize: 16,
                    lineHeight: 1.65,
                    fontFamily: "Georgia, serif",
                    margin: 0,
                  }}
                >
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── LAUNCH ADVENTURES ───────────────────────── */}
      <section
        style={{
          background: "linear-gradient(180deg, #030712 0%, #0a0a0a 100%)",
          padding: "96px 32px",
          borderTop: "1px solid rgba(146, 64, 14, 0.25)",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p
            style={{
              color: "#fbbf24",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              textAlign: "center",
              margin: "0 0 12px 0",
              fontFamily: "Georgia, serif",
            }}
          >
            Launch Adventures
          </p>
          <h2
            style={{
              color: "#fbbf24",
              fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
              fontWeight: 700,
              fontFamily: "Georgia, serif",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            Three Sagas to Begin Your Legend
          </h2>
          <p
            style={{
              color: "#a8a097",
              fontSize: 17,
              lineHeight: 1.6,
              textAlign: "center",
              maxWidth: 720,
              margin: "0 auto 56px",
              fontFamily: "Georgia, serif",
            }}
          >
            The first three modules are ancient tales reborn — ruins the hero walks
            twelve thousand years after the deeds Howard set to paper.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 24,
            }}
          >
            {LAUNCH_ADVENTURES.map((a, idx) => (
              <div
                key={a.title}
                style={{
                  background: "rgba(45, 22, 0, 0.5)",
                  border: "1px solid rgba(146, 64, 14, 0.4)",
                  borderRadius: 8,
                  padding: "28px 26px",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    color: "#92400e",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    marginBottom: 8,
                    fontFamily: "Georgia, serif",
                  }}
                >
                  SAGA {String(idx + 1).padStart(2, "0")}
                </div>
                <h3
                  style={{
                    color: "#fef3c7",
                    fontSize: "1.3125rem",
                    fontWeight: 700,
                    fontFamily: "Georgia, serif",
                    fontStyle: "italic",
                    margin: "0 0 14px 0",
                    lineHeight: 1.25,
                  }}
                >
                  {a.title}
                </h3>
                <p
                  style={{
                    color: "#e8d4a0",
                    fontSize: 15,
                    lineHeight: 1.65,
                    fontFamily: "Georgia, serif",
                    margin: 0,
                  }}
                >
                  {a.hook}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── HOWARD QUOTE ───────────────────────── */}
      <section
        style={{
          background: "#030712",
          padding: "80px 32px",
          textAlign: "center",
        }}
      >
        <blockquote
          style={{
            maxWidth: 820,
            margin: "0 auto",
            color: "#e8d4a0",
            fontSize: "clamp(1.125rem, 2vw, 1.375rem)",
            lineHeight: 1.6,
            fontStyle: "italic",
            fontFamily: "Georgia, serif",
            padding: "0 24px",
            borderLeft: "2px solid #92400e",
            borderRight: "2px solid #92400e",
          }}
        >
          &ldquo;In the shadows, serpent-men plotted. Valusia, mightiest of kingdoms,
          was crumbling from within. Only Kull stood between the throne and chaos — if
          he lived long enough to see it.&rdquo;
          <footer
            style={{
              color: "#8a7a60",
              fontSize: 15,
              marginTop: 20,
              fontStyle: "normal",
              fontWeight: 400,
              letterSpacing: "0.05em",
            }}
          >
            — Robert E. Howard, <cite>The Shadow Kingdom</cite> 
          </footer>
        </blockquote>
      </section>

      {/* ───────────────────────── PROGRESS TEASER ───────────────────────── */}
      <section
        style={{
          background: "rgba(12, 6, 2, 0.5)",
          borderTop: "1px solid rgba(146, 64, 14, 0.25)",
          borderBottom: "1px solid rgba(146, 64, 14, 0.25)",
          padding: "80px 32px",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2
            style={{
              color: "#fbbf24",
              fontSize: "clamp(1.625rem, 2.75vw, 2rem)",
              fontWeight: 700,
              fontFamily: "Georgia, serif",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            What We Have Already Built
          </h2>
          <p
            style={{
              color: "#a8a097",
              fontSize: 16,
              lineHeight: 1.6,
              textAlign: "center",
              marginBottom: 40,
              fontFamily: "Georgia, serif",
            }}
          >
            Early access is coming soon. Watch here as we build.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
              marginBottom: 40,
            }}
          >
            {PROGRESS_ITEMS.map((item) => (
              <div
                key={item}
                style={{
                  color: "#e8d4a0",
                  fontSize: 15,
                  fontFamily: "Georgia, serif",
                  padding: "16px 20px",
                  background: "rgba(146, 64, 14, 0.12)",
                  borderLeft: "3px solid #fbbf24",
                  borderRadius: 4,
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: "#fbbf24", marginRight: 10 }}>✓</span>
                {item}
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <a
              href="/updates"
              style={{
                display: "inline-block",
                color: "#fbbf24",
                fontSize: 16,
                fontFamily: "Georgia, serif",
                textDecoration: "none",
                padding: "12px 24px",
                border: "1px solid rgba(251, 191, 36, 0.4)",
                borderRadius: 6,
                transition: "background 0.2s, color 0.2s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = "rgba(146, 64, 14, 0.3)";
                el.style.color = "#fef3c7";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = "transparent";
                el.style.color = "#fbbf24";
              }}
            >
              See the full development tracker &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* ───────────────────────── FINAL CTA ───────────────────────── */}
      <section
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, #78350f 0%, #1c0a00 50%, #030712 100%)",
          padding: "96px 32px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            color: "#fef3c7",
            fontSize: "clamp(2rem, 4vw, 2.75rem)",
            fontWeight: 700,
            fontFamily: "Georgia, serif",
            margin: "0 0 20px 0",
            lineHeight: 1.2,
          }}
        >
          Your legend begins with a single step through the church door.
        </h2>
        <p
          style={{
            color: "#e8d4a0",
            fontSize: 17,
            lineHeight: 1.6,
            maxWidth: 640,
            margin: "0 auto 36px",
            fontFamily: "Georgia, serif",
          }}
        >
          Alpha access is free and by invitation. Every account gets the full game,
          permanent virtues, and a chronicle that will outlive your character.
        </p>
        <a
          href="/register"
          style={{
            display: "inline-block",
            background: "#92400e",
            color: "#fef3c7",
            padding: "18px 48px",
            borderRadius: 8,
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            textDecoration: "none",
            transition: "background 0.2s, transform 0.15s",
            fontFamily: "Georgia, serif",
            border: "1px solid #fbbf24",
            boxShadow: "0 4px 24px rgba(146, 64, 14, 0.5)",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.background = "#b35712";
            el.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.background = "#92400e";
            el.style.transform = "translateY(0)";
          }}
        >
          Claim Your Early Access
        </a>
      </section>

      {/* ───────────────────────── FOOTER ───────────────────────── */}
      <footer
        style={{
          background: "#030712",
          borderTop: "1px solid rgba(146, 64, 14, 0.25)",
          padding: "48px 32px",
          textAlign: "center",
          color: "#8a7a60",
          fontSize: 14,
          fontFamily: "Georgia, serif",
          lineHeight: 1.7,
        }}
      >
        <p style={{ margin: "0 0 18px 0", maxWidth: 720, marginLeft: "auto", marginRight: "auto" }}>
          Living Eamon is built in the tradition of Robert E.&nbsp;Howard&rsquo;s sword-and-sorcery
          tales and the classic 1980 <em>Eamon</em> adventure system. Every legend begins
          here.
        </p>
        <div style={{ display: "flex", gap: 28, justifyContent: "center", marginBottom: 20 }}>
          <a
            href="/updates"
            style={{ color: "#a8a097", textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fbbf24")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#a8a097")}
          >
            Updates
          </a>
          <a
            href="/board"
            style={{ color: "#a8a097", textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fbbf24")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#a8a097")}
          >
            Community
          </a>
          <a
            href="/legal"
            style={{ color: "#a8a097", textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fbbf24")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#a8a097")}
          >
            Legal
          </a>
        </div>
        <p style={{ margin: 0, color: "#5a4a3a" }}>
          Alpha access by invitation. Your legend is permanent. Enter wisely.
        </p>
      </footer>
    </div>
  );
}
