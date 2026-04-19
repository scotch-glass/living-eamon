"use client";

import PublicNav from "../../components/PublicNav";

const RADIOACTIVE_WORDS = [
  "CONAN",
  "Conan the Barbarian",
  "CIMMERIAN",
  "CIMMERIANS",
  "CIMMERIA",
  "HYBORIA",
  "HYBORIAN AGE",
  "HYBORIAN",
];

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
          Intellectual property, trademarks, and contact information
        </p>

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
            Our Use of Source Material
          </h2>
          <p style={{ color: "#e8d4a0", fontSize: 15, lineHeight: 1.75 }}>
            Living Eamon is an AI-driven persistent text adventure. All source
            material appearing in Living Eamon&mdash;narrative prose, imagery,
            world concepts, characters, locations, and adapted story
            elements&mdash;is used under rights that Thot Technologies either
            owns outright or is lawfully entitled to use under applicable
            copyright law in the jurisdictions where Living Eamon is offered.
            We have conducted the necessary rights review for every element we
            publish.
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
            Trademark Disclaimer
          </h2>
          <p style={{ color: "#e8d4a0", fontSize: 15, lineHeight: 1.75, marginBottom: 16 }}>
            Living Eamon is not affiliated with, endorsed by, sponsored by,
            associated with, or authorized by Conan Properties International
            LLC, any successor or assign of the estate of Robert E.&nbsp;Howard,
            or any holder of trademarks or copyrights in the works commonly
            associated with those names. Any resemblance between Living Eamon
            and those properties&mdash;whether in tone, setting, or
            atmosphere&mdash;does not imply any such affiliation or endorsement.
          </p>
          <p style={{ color: "#e8d4a0", fontSize: 15, lineHeight: 1.75, marginBottom: 16 }}>
            Living Eamon expressly does not use the following words, phrases,
            or marks anywhere in the game, its code, its marketing, its
            branding, or any product or service offered under the Living Eamon
            name:
          </p>
          <ul
            style={{
              color: "#fcd34d",
              fontSize: 15,
              lineHeight: 1.9,
              paddingLeft: 24,
              marginBottom: 20,
              fontWeight: 600,
            }}
          >
            {RADIOACTIVE_WORDS.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <p style={{ color: "#e8d4a0", fontSize: 15, lineHeight: 1.75 }}>
            Each of the words listed above is, to the extent it has been
            registered or is asserted as a trademark, the property of its
            respective owner. Living Eamon claims no right, title, or interest
            in any of them.
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
          <p style={{ color: "#e8d4a0", fontSize: 15, lineHeight: 1.75 }}>
            Portions of Living Eamon&rsquo;s narrative, imagery, and responsive
            content are generated with the assistance of AI systems under Thot
            Technologies&rsquo; creative direction. Thot Technologies reserves
            all rights it holds in the curated, directed, and edited output
            that forms part of Living Eamon.
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
          <p style={{ color: "#e8d4a0", fontSize: 15, lineHeight: 1.75, marginBottom: 12 }}>
            If you believe Living Eamon infringes upon an intellectual-property
            right you hold, please contact us directly:
          </p>
          <p
            style={{
              color: "#fbbf24",
              fontSize: 16,
              fontWeight: 600,
              margin: "0 0 16px 0",
            }}
          >
            {process.env.NEXT_PUBLIC_CONTACT_EMAIL || "legal@livingeamon.game"}
          </p>
          <p style={{ color: "#a8a097", fontSize: 14, lineHeight: 1.7 }}>
            Include: the specific content or feature in question; your
            copyright or trademark registration, if any; a detailed
            description of the alleged infringement; and your contact
            information. We review every complaint promptly.
          </p>
        </section>

        <div
          style={{
            borderTop: "1px solid rgba(146, 64, 14, 0.3)",
            paddingTop: 24,
            textAlign: "center",
          }}
        >
          <p style={{ color: "#5a4a3a", fontSize: 12, lineHeight: 1.7, margin: 0 }}>
            Last updated: April 20, 2026
          </p>
        </div>
      </main>
    </div>
  );
}
