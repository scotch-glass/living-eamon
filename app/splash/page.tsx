"use client";

import PublicNav from "../../components/PublicNav";

export default function SplashPage() {
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
        {/* Hero art background */}
        <img
          src="/hero.jpg"
          alt="Living Eamon"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.35,
            pointerEvents: "none",
          }}
        />

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
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 60,
            alignItems: "center",
          }}
        >
          {/* LEFT: World Promises */}
          <div style={{ width: "100%", textAlign: "center", maxWidth: 900, margin: "0 auto" }}>

            <h2
              style={{
                fontFamily: "Cedarville Cursive, cursive",
                fontSize: "1.8rem",
                color: "#fbbf24",
                fontStyle: "italic",
                margin: "0 0 32px 0",
                lineHeight: 1.6,
              }}
            >
              One hero. A thousand realms. Infinite death.
            </h2>

            <div style={{ marginBottom: 48, maxWidth: 800, margin: "0 auto 48px" }}>
              <p
                style={{
                  color: "#e8d4a0",
                  fontSize: 14,
                  lineHeight: 1.8,
                  marginBottom: 24,
                  fontStyle: "italic",
                }}
              >
                Hack your way through dungeons dark with blood on your blade and death at your heels. Survive a hack-and-slash adventure and stumble back to town covered in gore, your armor dented, your sanity questioned. Face evil sorcerers who traffic in Thurian demon magic. Seduce treacherous harlots and trust damsels at your peril. Learn forbidden occult magics and risk the wrath of the Order. Outfit yourself in realistic armor — plate is heavy, expensive, and only for mounted knights who can afford the custom fit.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 900, margin: "0 auto" }}>
                {[
                  "One hero carries every scar, every kill, every curse across a thousand adventures",
                  "Deadly encounters where a single mistake means death. Permanently.",
                  "Two magic systems — legal Guild magic and forbidden Occult magic",
                  "Realistic armor and weapon physics. Plate protects. Cloth doesn't.",
                  "A world that rebuilds itself around your choices, permanently",
                ].map((feature, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      gap: 12,
                      color: "#e8d4a0",
                      fontSize: 13,
                      lineHeight: 1.6,
                      fontFamily: "Georgia, serif",
                    }}
                  >
                    <span style={{ color: "#fbbf24", flexShrink: 0, marginTop: 2 }}>◆</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
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
                marginTop: 48,
                maxWidth: 700,
                margin: "48px auto 0",
              }}
            >
              "In the shadows, serpent-men plotted. Valusia, mightiest of kingdoms, was crumbling from within. Only Kull stood between the throne and chaos — if he lived long enough to see it."
              <br />
              <span style={{ fontSize: "0.85rem", color: "#5a4a3a", marginTop: 8, display: "block" }}>
                — Robert E. Howard, The Shadow Kingdom (public domain)
              </span>
            </p>

            {/* Call to Action */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 24,
                textAlign: "center",
                marginTop: 48,
              }}
            >
            <a
              href="/register"
              style={{
                background: "#92400e",
                color: "#fef3c7",
                padding: "16px 32px",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textDecoration: "none",
                transition: "background 0.2s",
                border: "none",
                cursor: "pointer",
                fontFamily: "Georgia, serif",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "#a84d10";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "#92400e";
              }}
            >
              Register for Early Access
            </a>

            <a
              href="/login"
              style={{
                color: "#5a4a3a",
                fontSize: 12,
                textDecoration: "none",
                fontFamily: "Georgia, serif",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#8a7a60")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#5a4a3a")}
            >
              Already a tester? Login here
            </a>
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
          { icon: "⚔", title: "GORE & CONSEQUENCE", desc: "Full detail blood and viscera. Hack and slash your way through adventures. Survive, and you stagger back covered in your enemies' blood. Die, and you're done." },
          { icon: "🌍", title: "A WORLD THAT REMEMBERS", desc: "NPCs know what you've done. Tavern keepers recognize killers. Temples remember the wicked. The Order hunts those who traffic in forbidden magic." },
          { icon: "✦", title: "FORBIDDEN OCCULT MAGIC", desc: "Two magic systems: legal Guild magic taught in temples, and forbidden Occult magic written in dust and blood. The Order will kill you for knowing too much." },
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
