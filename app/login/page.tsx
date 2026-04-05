"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction, googleSignInAction } from "../auth/actions";

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

      {/* Google SSO */}
      <form action={googleSignInAction}>
        <button
          type="submit"
          style={{
            width: "100%",
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            color: "#e5e7eb",
            padding: "12px 16px",
            borderRadius: 6,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: 20,
            fontFamily: "Georgia, serif",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" />
          </svg>
          Continue with Google
        </button>
      </form>

      {/* Divider */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ flex: 1, height: 1, backgroundColor: "#1f2937" }} />
        <span style={{ color: "#4b5563", fontSize: 12 }}>or</span>
        <div style={{ flex: 1, height: 1, backgroundColor: "#1f2937" }} />
      </div>

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
