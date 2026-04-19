"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "../../lib/supabaseAuthClient";

type MFAMode = "enroll" | "verify" | "skip";

interface EnrollData {
  qrCode: string;
  secret: string;
  factorId: string;
}

export default function MFAPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<MFAMode>("enroll");
  const [enrollData, setEnrollData] = useState<EnrollData | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkMFA = async () => {
      try {
        const supabase = createBrowserSupabase();
        const session = await supabase.auth.getSession();

        if (!session?.data?.session) {
          router.push("/login");
          return;
        }

        // Check AAL level
        const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        console.log("AAL:", aal);

        if (aal.data?.currentLevel === "aal2") {
          // Already MFA verified, go to game
          router.push("/");
          return;
        }

        // Check if user has enrolled factors
        const { data: factors } = await supabase.auth.mfa.listFactors();
        if (factors?.totp && factors.totp.length > 0) {
          // Already enrolled, need to verify
          setMode("verify");
        } else {
          // Need to enroll
          await startEnrollment();
        }
      } catch (err) {
        console.error("MFA check error:", err);
        setError("Failed to initialize MFA");
      } finally {
        setLoading(false);
      }
    };

    checkMFA();
  }, [router]);

  const startEnrollment = async () => {
    try {
      const supabase = createBrowserSupabase();
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });

      if (enrollError) throw enrollError;
      if (!data) throw new Error("No enrollment data returned");

      setEnrollData({
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        factorId: data.id,
      });
      setMode("enroll");
    } catch (err) {
      console.error("Enrollment error:", err);
      setError("Failed to start MFA enrollment");
    }
  };

  const handleEnrollConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollData || !code) return;

    setSubmitting(true);
    setError("");

    try {
      const supabase = createBrowserSupabase();
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollData.factorId,
        code,
      });

      if (verifyError) throw verifyError;

      // Success! Redirect to game
      router.push("/");
    } catch (err) {
      console.error("Verification error:", err);
      setError("Invalid code. Please try again.");
      setCode("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setSubmitting(true);
    setError("");

    try {
      const supabase = createBrowserSupabase();
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (!factors?.totp || factors.totp.length === 0) {
        throw new Error("No TOTP factors enrolled");
      }

      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factors.totp[0].id,
        code,
      });

      if (verifyError) throw verifyError;

      // Success! Redirect to game
      router.push("/");
    } catch (err) {
      console.error("Verification error:", err);
      setError("Invalid code. Please try again.");
      setCode("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Skip for now, can enforce later
    router.push("/");
  };

  if (loading) {
    return (
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
        Setting up thy protection...
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
      <div
        style={{
          width: "100%",
          maxWidth: 450,
          background: "rgba(12, 6, 2, 0.85)",
          border: "1px solid rgba(146, 64, 14, 0.4)",
          borderRadius: 12,
          padding: 40,
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        {mode === "enroll" && enrollData && (
          <>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#fbbf24",
                fontFamily: "Georgia, serif",
                textAlign: "center",
                marginBottom: 8,
                letterSpacing: "0.05em",
              }}
            >
              PROTECT THY LEGEND
            </h1>
            <p
              style={{
                color: "#8a7a60",
                fontSize: 12,
                fontFamily: "Georgia, serif",
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              Two-factor authentication via Authenticator app
            </p>

            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <img
                src={enrollData.qrCode}
                alt="TOTP QR Code"
                style={{
                  width: 200,
                  height: 200,
                  border: "2px solid rgba(146, 64, 14, 0.3)",
                  borderRadius: 8,
                  backgroundColor: "#ffffff",
                }}
              />
            </div>

            <p
              style={{
                color: "#e8d4a0",
                fontSize: 12,
                fontFamily: "Georgia, serif",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              Or enter manually:
              <br />
              <code
                style={{
                  background: "rgba(0, 0, 0, 0.3)",
                  padding: "8px 12px",
                  borderRadius: 4,
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  marginTop: 6,
                  display: "block",
                }}
              >
                {enrollData.secret}
              </code>
            </p>

            <p
              style={{
                color: "#8a7a60",
                fontSize: 11,
                fontFamily: "Georgia, serif",
                marginBottom: 24,
                textAlign: "center",
              }}
            >
              Scan with Google Authenticator, Authy, or 1Password
            </p>

            <form onSubmit={handleEnrollConfirm} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                pattern="\d{6}"
                required
                style={{
                  backgroundColor: "#111827",
                  border: "1px solid #374151",
                  color: "#e5e7eb",
                  padding: "12px 16px",
                  borderRadius: 6,
                  fontSize: 18,
                  textAlign: "center",
                  letterSpacing: "0.3em",
                  outline: "none",
                  fontFamily: "Georgia, serif",
                }}
              />

              {error && (
                <div
                  style={{
                    backgroundColor: "#450a0a",
                    border: "1px solid #7f1d1d",
                    color: "#fca5a5",
                    padding: "8px 12px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontFamily: "Georgia, serif",
                    textAlign: "center",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || code.length !== 6}
                style={{
                  backgroundColor: "#92400e",
                  color: "#fef3c7",
                  padding: "12px 16px",
                  borderRadius: 6,
                  fontSize: 13,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  border: "none",
                  cursor: submitting || code.length !== 6 ? "not-allowed" : "pointer",
                  opacity: submitting || code.length !== 6 ? 0.6 : 1,
                  fontFamily: "Georgia, serif",
                  fontWeight: 600,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!submitting && code.length === 6) (e.currentTarget as HTMLButtonElement).style.background = "#a84d10";
                }}
                onMouseLeave={(e) => {
                  if (!submitting && code.length === 6) (e.currentTarget as HTMLButtonElement).style.background = "#92400e";
                }}
              >
                {submitting ? "Confirming..." : "Activate Protection"}
              </button>

              <button
                type="button"
                onClick={handleSkip}
                style={{
                  background: "transparent",
                  color: "#8a7a60",
                  padding: "10px 16px",
                  borderRadius: 6,
                  fontSize: 12,
                  border: "1px solid rgba(146, 64, 14, 0.3)",
                  cursor: "pointer",
                  fontFamily: "Georgia, serif",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#fbbf24";
                  (e.currentTarget as HTMLButtonElement).style.color = "#fbbf24";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(146, 64, 14, 0.3)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#8a7a60";
                }}
              >
                I'll do this later
              </button>
            </form>
          </>
        )}

        {mode === "verify" && (
          <>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#fbbf24",
                fontFamily: "Georgia, serif",
                textAlign: "center",
                marginBottom: 8,
                letterSpacing: "0.05em",
              }}
            >
              VERIFY THY IDENTITY
            </h1>
            <p
              style={{
                color: "#8a7a60",
                fontSize: 12,
                fontFamily: "Georgia, serif",
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              Enter the 6-digit code from thy Authenticator app
            </p>

            <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                pattern="\d{6}"
                required
                style={{
                  backgroundColor: "#111827",
                  border: "1px solid #374151",
                  color: "#e5e7eb",
                  padding: "12px 16px",
                  borderRadius: 6,
                  fontSize: 18,
                  textAlign: "center",
                  letterSpacing: "0.3em",
                  outline: "none",
                  fontFamily: "Georgia, serif",
                }}
              />

              {error && (
                <div
                  style={{
                    backgroundColor: "#450a0a",
                    border: "1px solid #7f1d1d",
                    color: "#fca5a5",
                    padding: "8px 12px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontFamily: "Georgia, serif",
                    textAlign: "center",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || code.length !== 6}
                style={{
                  backgroundColor: "#92400e",
                  color: "#fef3c7",
                  padding: "12px 16px",
                  borderRadius: 6,
                  fontSize: 13,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  border: "none",
                  cursor: submitting || code.length !== 6 ? "not-allowed" : "pointer",
                  opacity: submitting || code.length !== 6 ? 0.6 : 1,
                  fontFamily: "Georgia, serif",
                  fontWeight: 600,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!submitting && code.length === 6) (e.currentTarget as HTMLButtonElement).style.background = "#a84d10";
                }}
                onMouseLeave={(e) => {
                  if (!submitting && code.length === 6) (e.currentTarget as HTMLButtonElement).style.background = "#92400e";
                }}
              >
                {submitting ? "Verifying..." : "Enter the Realm"}
              </button>

              <button
                type="button"
                onClick={handleSkip}
                style={{
                  background: "transparent",
                  color: "#8a7a60",
                  padding: "10px 16px",
                  borderRadius: 6,
                  fontSize: 12,
                  border: "1px solid rgba(146, 64, 14, 0.3)",
                  cursor: "pointer",
                  fontFamily: "Georgia, serif",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#fbbf24";
                  (e.currentTarget as HTMLButtonElement).style.color = "#fbbf24";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(146, 64, 14, 0.3)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#8a7a60";
                }}
              >
                Skip for now
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
