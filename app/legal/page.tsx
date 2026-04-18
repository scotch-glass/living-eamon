"use client";

import PublicNav from "../../components/PublicNav";

export default function LegalPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#030712",
        backgroundImage: "url(/legal-bg.jpg)",
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Background overlay for readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(3, 7, 18, 0.88)",
          pointerEvents: "none",
        }}
      />
      <PublicNav currentPage="legal" />

      <main
        style={{
          flex: 1,
          padding: "60px 32px",
          maxWidth: 900,
          margin: "0 auto",
          width: "100%",
          fontFamily: "Georgia, serif",
          position: "relative",
          zIndex: 1,
        }}
      >
        <h1
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: "#fbbf24",
            marginBottom: 8,
            letterSpacing: "0.05em",
          }}
        >
          Legal Information
        </h1>
        <p style={{ color: "#8a7a60", fontSize: 13, marginBottom: 40 }}>
          Intellectual property, attributions, and contact information
        </p>

        <div style={{ marginBottom: 40 }}>
          <p
            style={{
              color: "#e8d4a0",
              fontSize: 15,
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            Living Eamon is a text-adventure game inspired by the classic Eamon system (1980) and the public domain works of Robert E. Howard. This page clarifies our intellectual property position, attributes the sources we draw from, and provides contact information for legal matters.
          </p>
        </div>

        <section style={{ marginBottom: 48 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#fbbf24",
              marginBottom: 12,
              letterSpacing: "0.03em",
            }}
          >
            About Living Eamon
          </h2>
          <p style={{ color: "#a8a097", fontSize: 14, lineHeight: 1.7 }}>
            Living Eamon is an AI-driven persistent text adventure. One hero carries across hundreds of adventures, a world that remembers every choice, and two magic systems — one legal, one forbidden. The game world is built using a mix of original creativity and adaptations of public domain source material.
          </p>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#fbbf24",
              marginBottom: 12,
              letterSpacing: "0.03em",
            }}
          >
            Public Domain Works
          </h2>

          <div style={{ marginBottom: 16 }}>
            <h3 style={{ color: "#c5ad75", fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
              The Eamon Adventure System (1980)
            </h3>
            <p style={{ color: "#a8a097", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              Eamon was created by Donald Brown (TRIAD/Adventure International, 1980). It is a foundational text-based dungeon adventure system. The copyright was not renewed, placing it in the public domain. Living Eamon adopts its structure, philosophy, and design spirit as a successor system.
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h3 style={{ color: "#c5ad75", fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
              Robert E. Howard's Public Domain Works
            </h3>
            <p style={{ color: "#a8a097", fontSize: 13, lineHeight: 1.6, margin: "0 0 12px 0" }}>
              We draw from the following works by Robert E. Howard, all of which are in the public domain in the European Union and the United States (or will enter public domain by 2028 in the US):
            </p>
            <ul style={{ color: "#a8a097", fontSize: 13, lineHeight: 1.8, paddingLeft: 24, margin: 0, marginBottom: 16 }}>
              <li>
                <strong>The Hyborian Age</strong> (essay, 1936) — The world-building document detailing prehistory, races, and kingdoms.
              </li>
              <li>
                <strong>The Shadow Kingdom</strong> (short story, Weird Tales 1929) — Kull of Atlantis discovers serpent-men infiltrating the throne.
              </li>
              <li>
                <strong>The Mirrors of Tuzun Thune</strong> (short story, Weird Tales 1929) — Kull's meditation on alternate realities and kingship.
              </li>
              <li>
                <strong>Kings of the Night</strong> (short story, Weird Tales 1930) — Kull summoned through time to aid Bran Mak Morn against Rome.
              </li>
            </ul>
          </div>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#fbbf24",
              marginBottom: 12,
              letterSpacing: "0.03em",
            }}
          >
            Trademarks & Legal Notices
          </h2>
          <p style={{ color: "#a8a097", fontSize: 14, lineHeight: 1.7, marginBottom: 12 }}>
            Living Eamon is not affiliated with, endorsed by, or associated with Conan Properties Inc. or any copyright holder of Robert E. Howard's works beyond those explicitly listed above as public domain.
          </p>
          <p style={{ color: "#a8a097", fontSize: 14, lineHeight: 1.7, marginBottom: 12 }}>
            The following trademarks remain the property of Conan Properties Inc. and are not used in Living Eamon:
          </p>
          <ul
            style={{
              color: "#a8a097",
              fontSize: 13,
              lineHeight: 1.8,
              paddingLeft: 24,
              marginBottom: 12,
            }}
          >
            <li>CONAN</li>
            <li>Conan the Barbarian</li>
            <li>HYBORIA</li>
            <li>Hyborian Age (as a brand or product name)</li>
          </ul>
          <p style={{ color: "#a8a097", fontSize: 14, lineHeight: 1.7 }}>
            Living Eamon is titled as such and marketed independently of any trademark-protected names.
          </p>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#fbbf24",
              marginBottom: 12,
              letterSpacing: "0.03em",
            }}
          >
            AI-Generated Content
          </h2>
          <p style={{ color: "#a8a097", fontSize: 14, lineHeight: 1.7 }}>
            Much of the narrative content in Living Eamon is generated or assisted by artificial intelligence systems (Grok, Anthropic Claude). These systems are tools used to create original content in the voice and style of the game world. Living Eamon does not claim human authorship for AI-assisted content, nor does it claim copyright ownership over AI generation processes themselves.
          </p>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#fbbf24",
              marginBottom: 12,
              letterSpacing: "0.03em",
            }}
          >
            Intellectual Property Complaints
          </h2>
          <p style={{ color: "#a8a097", fontSize: 14, lineHeight: 1.7, marginBottom: 12 }}>
            If you believe Living Eamon infringes upon your intellectual property rights, please contact us directly at:
          </p>
          <p
            style={{
              color: "#fbbf24",
              fontSize: 14,
              fontWeight: 600,
              margin: "0 0 12px 0",
            }}
          >
            {process.env.NEXT_PUBLIC_CONTACT_EMAIL || "legal@livingeamon.game"}
          </p>
          <p style={{ color: "#a8a097", fontSize: 13, lineHeight: 1.7 }}>
            Please include:
            <br />
            • The specific content or feature in question
            <br />
            • Your copyright or trademark registration (if applicable)
            <br />
            • A detailed explanation of the alleged infringement
            <br />
            • Your contact information and credentials
          </p>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#fbbf24",
              marginBottom: 12,
              letterSpacing: "0.03em",
            }}
          >
            Compliance & Future Updates
          </h2>
          <p style={{ color: "#a8a097", fontSize: 14, lineHeight: 1.7 }}>
            Living Eamon monitors copyright law as new works enter the public domain (notably, Robert E. Howard Conan stories enter US public domain January 1, 2028, and progressively through 2032). This legal notice will be updated as new works become available for use without licensing.
          </p>
          <p style={{ color: "#a8a097", fontSize: 14, lineHeight: 1.7 }}>
            For detailed information on public domain status and our development roadmap, see our{" "}
            <a
              href="/updates"
              style={{
                color: "#fbbf24",
                textDecoration: "none",
                borderBottom: "1px solid #fbbf24",
              }}
            >
              development progress page
            </a>
            .
          </p>
        </section>

        <div
          style={{
            borderTop: "1px solid rgba(146, 64, 14, 0.3)",
            paddingTop: 24,
            textAlign: "center",
          }}
        >
          <p style={{ color: "#5a4a3a", fontSize: 12, lineHeight: 1.6, margin: 0 }}>
            Last updated: April 18, 2026
            <br />
            This notice was prepared with reference to jurisdiction-specific public domain calendars and Berne Convention copyright law.
          </p>
        </div>
      </main>
    </div>
  );
}
