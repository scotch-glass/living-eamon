"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction } from "../auth/actions";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [loading, setLoading] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#030712",
        backgroundImage: "url(/login-bg.jpg)",
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px",
        position: "relative",
      }}
    >
      {/* Dark overlay — 50% opacity black */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 0,
        }}
      />

      {/* Login form */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 380,
          background: "rgba(12, 6, 2, 0.85)",
          border: "1px solid rgba(146, 64, 14, 0.4)",
          borderRadius: 12,
          padding: 32,
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#fbbf24",
            fontFamily: "Georgia, serif",
            textAlign: "center",
            marginBottom: 24,
            letterSpacing: "0.05em",
          }}
        >
          ENTER
        </h1>

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

        <form
          action={loginAction}
          onSubmit={() => setLoading(true)}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <input
            name="email"
            type="email"
            placeholder="Email"
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

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <a
            href="/register"
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
            New adventurer? →
            </a>
        </div>
      </div>
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
