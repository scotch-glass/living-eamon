"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction } from "../auth/actions";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ width: "100%", maxWidth: 400 }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1
          style={{
            fontSize: 40,
            fontWeight: "bold",
            color: "#fbbf24",
            fontFamily: "Georgia, serif",
            marginBottom: 4,
            letterSpacing: "0.05em",
          }}
        >
          LIVING EAMON
        </h1>
        <p
          style={{
            color: "#92400e",
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          One Hero. Infinite Realms.
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
          }}
        >
          {error === "auth_callback_failed"
            ? "Authentication failed. Please try again."
            : error}
        </div>
      )}

      {/* Email/Password form */}
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
          }}
        >
          {loading ? "Entering..." : "Enter the Realm"}
        </button>
      </form>

      {/* Footer links */}
      <div style={{ textAlign: "center", marginTop: 20 }}>
        <a
          href="/register"
          style={{
            color: "#6b7280",
            fontSize: 13,
            textDecoration: "none",
            fontFamily: "Georgia, serif",
          }}
        >
          New adventurer? Create an account →
        </a>
      </div>

      <p
        style={{
          color: "#1f2937",
          fontSize: 11,
          textAlign: "center",
          marginTop: 32,
          fontFamily: "Georgia, serif",
        }}
      >
        she is watching
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#030712",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px",
      }}
    >
      <Suspense
        fallback={
          <div style={{ width: "100%", maxWidth: 400, textAlign: "center", color: "#6b7280" }}>
            Loading…
          </div>
        }
      >
        <LoginContent />
      </Suspense>
    </div>
  );
}
