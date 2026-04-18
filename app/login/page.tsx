"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction, registerAction, googleSignInAction } from "../auth/actions";
import PublicNav from "../../components/PublicNav";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const success = searchParams.get("success");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"login" | "register">("login");

  if (success === "check_email") {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#030712",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <PublicNav currentPage="login" />
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 24px",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 500 }}>
            <h2
              style={{
                color: "#fbbf24",
                fontFamily: "Georgia, serif",
                fontSize: 32,
                marginBottom: 16,
                fontWeight: 700,
              }}
            >
              Check thy email
            </h2>
            <p
              style={{
                color: "#9ca3af",
                fontFamily: "Georgia, serif",
                lineHeight: 1.7,
                fontSize: 14,
              }}
            >
              A confirmation link has been sent to thy inbox. Click it to activate thy account and enter the realm.
            </p>
            <a
              href="/login"
              style={{
                display: "inline-block",
                marginTop: 24,
                color: "#fbbf24",
                fontFamily: "Georgia, serif",
                fontSize: 13,
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fef3c7")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#fbbf24")}
            >
              ← Return to login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#030712",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <PublicNav currentPage="login" />

      {/* HERO SECTION */}
      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          background: "radial-gradient(ellipse at 50% 100%, #78350f 0%, #1c0a00 30%, #030712 70%)",
          padding: "60px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Decorative Linear B characters as texture (very low opacity) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            fontSize: "12rem",
            color: "#fbbf24",
            opacity: 0.04,
            overflow: "hidden",
            pointerEvents: "none",
            fontFamily: "Noto Sans Linear B, serif",
            whiteSpace: "pre-wrap",
            lineHeight: 1.2,
            fontWeight: 700,
          }}
        >
          𐀀𐀁𐀂𐀃𐀄𐀅𐀆𐀇  𐀈𐀉𐀊𐀋𐀌𐀍𐀎𐀏 𐀐𐀑𐀒𐀓𐀔𐀕𐀖𐀗 𐀘𐀙𐀚𐀛𐀜𐀝𐀞𐀟 𐀠𐀡𐀢𐀣𐀤𐀥𐀦𐀧
        </div>

        {/* Content container */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 1200,
            width: "100%",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 60,
            alignItems: "center",
          }}
        >
          {/* LEFT: World Promises */}
          <div style={{ paddingRight: 20 }}>
            <h1
              style={{
                fontSize: "5rem",
                fontWeight: 700,
                color: "#fbbf24",
                fontFamily: "Georgia, serif",
                letterSpacing: "0.05em",
                margin: "0 0 16px 0",
                textShadow: "0 2px 10px rgba(251, 191, 36, 0.3)",
              }}
            >
              LIVING<br />
              EAMON
            </h1>

            <p
              style={{
                fontFamily: "Cedarville Cursive, cursive",
                fontSize: "1.5rem",
                color: "#fbbf24",
                fontStyle: "italic",
                margin: "0 0 32px 0",
                lineHeight: 1.6,
              }}
            >
              One hero. A thousand realms. She is watching.
            </p>

            <div style={{ marginBottom: 32 }}>
              {[
                "A persistent hero who carries every scar, every skill, every secret",
                "An AI narrator who remembers what you've done and who you've wronged",
                "Two magic systems — one legal, one that gets you killed",
                "A world that rebuilds itself around your choices, permanently",
                "Sword & sorcery in the tradition of Robert E. Howard",
              ].map((feature, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    gap: 12,
                    marginBottom: 16,
                    color: "#e8d4a0",
                    fontSize: 14,
                    lineHeight: 1.6,
                    fontFamily: "Georgia, serif",
                  }}
                >
                  <span style={{ color: "#fbbf24", flexShrink: 0 }}>◆</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <p
              style={{
                fontFamily: "Cedarville Cursive, cursive",
                fontSize: "0.95rem",
                color: "#8a7a60",
                fontStyle: "italic",
                lineHeight: 1.8,
                borderTop: "1px solid rgba(146, 64, 14, 0.3)",
                paddingTop: 20,
                marginTop: 32,
              }}
            >
              "In the shadows, serpent-men plotted. Valusia, mightiest of kingdoms, was crumbling from within. Only Kull stood between the throne and chaos — if he lived long enough to see it."
              <br />
              <span style={{ fontSize: "0.85rem", color: "#5a4a3a", marginTop: 8, display: "block" }}>
                — Robert E. Howard, The Shadow Kingdom (public domain)
              </span>
            </p>
          </div>

          {/* RIGHT: Login / Register Form */}
          <div
            style={{
              background: "rgba(12, 6, 2, 0.85)",
              border: "1px solid rgba(146, 64, 14, 0.4)",
              borderRadius: 12,
              padding: 32,
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            {/* Tab switcher */}
            <div
              style={{
                display: "flex",
                gap: 0,
                marginBottom: 32,
                borderBottom: "1px solid rgba(146, 64, 14, 0.3)",
              }}
            >
              <button
                onClick={() => setTab("login")}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: "none",
                  border: "none",
                  color: tab === "login" ? "#fbbf24" : "#5a4a3a",
                  fontSize: 13,
                  fontFamily: "Georgia, serif",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  cursor: "pointer",
                  borderBottom: tab === "login" ? "2px solid #fbbf24" : "none",
                  transition: "all 0.2s",
                }}
              >
                ENTER THE REALM
              </button>
              <button
                onClick={() => setTab("register")}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: "none",
                  border: "none",
                  color: tab === "register" ? "#fbbf24" : "#5a4a3a",
                  fontSize: 13,
                  fontFamily: "Georgia, serif",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  cursor: "pointer",
                  borderBottom: tab === "register" ? "2px solid #fbbf24" : "none",
                  transition: "all 0.2s",
                }}
              >
                CLAIM YOUR DESTINY
              </button>
            </div>

            {error && (
              <div
                style={{
                  backgroundColor: "#450a0a",
                  border: "1px solid #7f1d1d",
                  color: "#fca5a5",
                  padding: "12px 16px",
                  borderRadius: 6,
                  fontSize: 13,
                  marginBottom: 20,
                  textAlign: "center",
                  fontFamily: "Georgia, serif",
                }}
              >
                {error === "auth_callback_failed" ? "Authentication failed. Please try again." : error}
              </div>
            )}

            {/* LOGIN TAB */}
            {tab === "login" && (
              <form
                action={loginAction}
                onSubmit={() => setLoading(true)}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <input
                  name="email"
                  type="email"
                  placeholder="Email address"
                  required
                  autoComplete="email"
                  style={{
                    backgroundColor: "#111827",
                    border: "1px solid #374151",
                    color: "#e5e7eb",
                    padding: "12px 16px",
                    borderRadius: 6,
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "Georgia, serif",
                  }}
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  required
                  autoComplete="current-password"
                  style={{
                    backgroundColor: "#111827",
                    border: "1px solid #374151",
                    color: "#e5e7eb",
                    padding: "12px 16px",
                    borderRadius: 6,
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "Georgia, serif",
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    backgroundColor: "#92400e",
                    color: "#fef3c7",
                    padding: "12px 16px",
                    borderRadius: 6,
                    fontSize: 14,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                    fontFamily: "Georgia, serif",
                    fontWeight: 600,
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#a84d10";
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#92400e";
                  }}
                >
                  {loading ? "Entering..." : "Enter the Realm"}
                </button>
              </form>
            )}

            {/* REGISTER TAB */}
            {tab === "register" && (
              <form
                action={registerAction}
                onSubmit={() => setLoading(true)}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <input
                  name="heroName"
                  type="text"
                  placeholder="Hero name (your character)"
                  required
                  maxLength={30}
                  autoComplete="username"
                  style={{
                    backgroundColor: "#111827",
                    border: "1px solid #374151",
                    color: "#e5e7eb",
                    padding: "12px 16px",
                    borderRadius: 6,
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "Georgia, serif",
                  }}
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email address"
                  required
                  autoComplete="email"
                  style={{
                    backgroundColor: "#111827",
                    border: "1px solid #374151",
                    color: "#e5e7eb",
                    padding: "12px 16px",
                    borderRadius: 6,
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "Georgia, serif",
                  }}
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Password (min. 8 characters)"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  style={{
                    backgroundColor: "#111827",
                    border: "1px solid #374151",
                    color: "#e5e7eb",
                    padding: "12px 16px",
                    borderRadius: 6,
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "Georgia, serif",
                  }}
                />
                {/* Cloudflare Turnstile widget placeholder */}
                <div
                  className="cf-turnstile"
                  data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
                  style={{ marginBottom: 12 }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    backgroundColor: "#92400e",
                    color: "#fef3c7",
                    padding: "12px 16px",
                    borderRadius: 6,
                    fontSize: 14,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                    fontFamily: "Georgia, serif",
                    fontWeight: 600,
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#a84d10";
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#92400e";
                  }}
                >
                  {loading ? "Creating..." : "Begin the Legend"}
                </button>
              </form>
            )}

            <div style={{ marginTop: 24, textAlign: "center" }}>
              <p style={{ color: "#8a7a60", fontSize: 12, fontFamily: "Georgia, serif", marginBottom: 12 }}>
                Alpha access is limited. Every hero's story is permanent.
              </p>
              <button
                onClick={() => googleSignInAction()}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  background: "#ffffff",
                  color: "#030712",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  fontSize: 13,
                  fontFamily: "Georgia, serif",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#f0f0f0";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#ffffff";
                }}
              >
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* THREE PILLARS */}
      <div
        style={{
          background: "linear-gradient(180deg, #030712 0%, #0a0a0a 100%)",
          padding: "80px 32px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 32,
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {[
          { icon: "⚔", title: "YOUR LEGEND PERSISTS", desc: "One character carries across a thousand adventures. Every scar, every skill, every choice you make follows you forever." },
          { icon: "🌍", title: "A WORLD THAT BREATHES", desc: "Jane, an ancient intelligence, watches every decision. She remembers what you've done, who you've wronged, and builds the world around you." },
          { icon: "✦", title: "THE ART IS FORBIDDEN", desc: "Two magic systems: one legal and safe, one forbidden and powerful. Using the Art risks attracting the Order. Choose wisely." },
        ].map((pillar, idx) => (
          <div
            key={idx}
            style={{
              background: "rgba(45, 22, 0, 0.6)",
              border: "1px solid rgba(146, 64, 14, 0.3)",
              borderRadius: 8,
              padding: 24,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>{pillar.icon}</div>
            <h3
              style={{
                color: "#fbbf24",
                fontFamily: "Georgia, serif",
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: "0.1em",
                marginBottom: 12,
                textTransform: "uppercase",
              }}
            >
              {pillar.title}
            </h3>
            <p
              style={{
                color: "#a8a097",
                fontSize: 13,
                fontFamily: "Georgia, serif",
                lineHeight: 1.6,
              }}
            >
              {pillar.desc}
            </p>
          </div>
        ))}
      </div>

      {/* PROGRESS TEASER */}
      <div
        style={{
          background: "rgba(12, 6, 2, 0.4)",
          borderTop: "1px solid rgba(146, 64, 14, 0.2)",
          borderBottom: "1px solid rgba(146, 64, 14, 0.2)",
          padding: "60px 32px",
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <h2
          style={{
            color: "#fbbf24",
            fontSize: 28,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          What We've Built So Far
        </h2>
        <p style={{ color: "#8a7a60", textAlign: "center", fontSize: 13, marginBottom: 24 }}>
          48% of the living world is complete. Here are the keystones.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
            marginBottom: 24,
          }}
        >
          {[
            "✅ HWRR Combat System with gore effects",
            "✅ Persistent hero profiles & equipment",
            "✅ Dual magic systems (Guild + Occult)",
            "✅ Living World engine with consequences",
            "✅ Banking & commerce systems",
            "✅ 10-virtue moral tracking system",
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                color: "#e8d4a0",
                fontSize: 13,
                fontFamily: "Georgia, serif",
                padding: "12px 16px",
                background: "rgba(146, 64, 14, 0.1)",
                borderLeft: "2px solid #fbbf24",
                borderRadius: 2,
              }}
            >
              {item}
            </div>
          ))}
        </div>

        <a
          href="/updates"
          style={{
            display: "inline-block",
            color: "#fbbf24",
            fontSize: 13,
            fontFamily: "Georgia, serif",
            textDecoration: "none",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fef3c7")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#fbbf24")}
        >
          → See full development progress
        </a>
      </div>

      {/* FOOTER */}
      <footer
        style={{
          background: "#030712",
          borderTop: "1px solid rgba(146, 64, 14, 0.2)",
          padding: "40px 32px",
          textAlign: "center",
          color: "#5a4a3a",
          fontSize: 12,
          fontFamily: "Georgia, serif",
          lineHeight: 1.8,
        }}
      >
        <p style={{ marginBottom: 16 }}>
          Living Eamon is built in the tradition of Robert E. Howard's public domain works and the classic Eamon adventure system. Every legend begins here.
        </p>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", marginBottom: 16 }}>
          <a href="/updates" style={{ color: "#5a4a3a", textDecoration: "none" }}>
            Updates
          </a>
          <a href="/board" style={{ color: "#5a4a3a", textDecoration: "none" }}>
            Community
          </a>
          <a href="/legal" style={{ color: "#5a4a3a", textDecoration: "none" }}>
            Legal
          </a>
        </div>
        <p style={{ marginBottom: 0 }}>Alpha access by invitation. Your legend is permanent. Enter wisely.</p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#030712",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6b7280",
            fontFamily: "Georgia, serif",
          }}
        >
          Loading…
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
