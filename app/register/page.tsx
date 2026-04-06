"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { registerAction } from "../auth/actions";

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
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <h2
            style={{
              color: "#fbbf24",
              fontFamily: "Georgia, serif",
              fontSize: 28,
              marginBottom: 16,
            }}
          >
            Check thy email
          </h2>
          <p style={{ color: "#9ca3af", fontFamily: "Georgia, serif", lineHeight: 1.7 }}>
            A confirmation link has been sent. Click it to activate thy account and enter
            the realm.
          </p>
          <a
            href="/login"
            style={{
              display: "inline-block",
              marginTop: 24,
              color: "#92400e",
              fontFamily: "Georgia, serif",
              fontSize: 13,
            }}
          >
            ← Return to login
          </a>
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
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px",
      }}
    >
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
            }}
          >
            {error === "missing_fields"
              ? "All fields are required."
              : error}
          </div>
        )}

        {/* Registration form */}
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
            {loading ? "Creating..." : "Create Legend"}
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
            }}
          >
            Already have an account? Sign in →
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
