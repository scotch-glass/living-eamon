"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { registerAction } from "../auth/actions";
import PublicNav from "../../components/PublicNav";

function RegisterContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const success = searchParams.get("success");
  const [loading, setLoading] = useState(false);

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

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 32px",
          backgroundImage: "url(/register-bg.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          position: "relative",
        }}
      >
        {/* Background overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(3, 7, 18, 0.75)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "rgba(12, 6, 2, 0.85)",
            border: "1px solid rgba(146, 64, 14, 0.4)",
            borderRadius: 12,
            padding: 32,
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#fbbf24",
                fontFamily: "Georgia, serif",
                marginBottom: 4,
                letterSpacing: "0.05em",
              }}
            >
              CLAIM YOUR DESTINY
            </h1>
            <p
              style={{
                color: "#92400e",
                fontSize: 11,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontFamily: "Georgia, serif",
              }}
            >
              Begin thy legend
            </p>
            <div
              style={{
                width: 64,
                height: 1,
                backgroundColor: "#92400e",
                margin: "16px auto 0",
              }}
            />
          </div>

          {/* Error */}
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
              {error === "missing_fields" ? "All fields are required." : error}
            </div>
          )}

          {/* Registration form */}
          <form
            action={registerAction}
            onSubmit={() => setLoading(true)}
            style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative", zIndex: 1 }}
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

            {/* Cloudflare Turnstile widget */}
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

          {/* Footer links */}
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <a
              href="/login"
              style={{
                color: "#6b7280",
                fontSize: 13,
                textDecoration: "none",
                fontFamily: "Georgia, serif",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#92400e")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
            >
              Already have an account? Sign in →
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
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
      <RegisterContent />
    </Suspense>
  );
}
