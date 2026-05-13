// ============================================================
// ReaderPanel — full-page Howard-voice prose reader (CF-1.5).
//
// Mounted as a modal overlay over the rest of the UI. Manual
// scroll (no streaming, no typewriter). Sepia-on-dark Georgia
// serif typography matching /library.
//
// Voice narration via xAI Eve. Player toggles on/off via a
// speaker icon top-right of the panel; preference persists in
// localStorage. Default: OFF.
//
// Audio comes from /api/voice/<audioId> — server returns a
// signed URL to the approved version stored in Supabase. If no
// approved version exists, the speaker icon shows a "voice
// pending" state and the player can read the text without audio.
// ============================================================

'use client';

import { useEffect, useRef, useState } from 'react';
import { useNarrationSetting } from '@/lib/voice/useNarrationSetting';

export interface ReaderPanelProps {
  /** Title shown above the prose (chapter / scene name). */
  title?: string;
  /** The prose body. Plain text; newlines render as paragraph breaks. */
  body: string;
  /**
   * Stable audio identifier. The reader fetches
   * /api/voice/<audioId> to play Eve's narration. If omitted, the
   * voice toggle is hidden entirely.
   */
  audioId?: string;
  /** Optional kicker label above the title. */
  kicker?: string;
  /** Dismiss callback. */
  onClose: () => void;
}

interface VoiceState {
  status: 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'unavailable';
  signedUrl: string | null;
  errorMessage: string | null;
}

export default function ReaderPanel({
  title,
  body,
  audioId,
  kicker,
  onClose,
}: ReaderPanelProps) {
  const { enabled: narrationEnabled, setEnabled, isReady } = useNarrationSetting();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [voice, setVoice] = useState<VoiceState>({
    status: 'idle',
    signedUrl: null,
    errorMessage: null,
  });

  // Resolve the signed audio URL whenever narration enables + audioId present.
  useEffect(() => {
    if (!narrationEnabled || !audioId || !isReady) return;
    if (voice.status === 'ready' || voice.status === 'playing' || voice.status === 'paused') return;
    if (voice.status === 'unavailable') return; // already determined unavailable

    let cancelled = false;
    setVoice({ status: 'loading', signedUrl: null, errorMessage: null });

    fetch(`/api/voice/${encodeURIComponent(audioId)}`)
      .then(async (r) => {
        if (cancelled) return;
        if (r.status === 404) {
          const data = await r.json().catch(() => ({}));
          setVoice({
            status: 'unavailable',
            signedUrl: null,
            errorMessage: data?.hasPendingVersion
              ? 'Voice pending admin approval'
              : 'Voice not yet generated',
          });
          return;
        }
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          setVoice({
            status: 'unavailable',
            signedUrl: null,
            errorMessage: data?.error ?? 'voice fetch failed',
          });
          return;
        }
        const data = await r.json();
        setVoice({ status: 'ready', signedUrl: data.signedUrl, errorMessage: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setVoice({
          status: 'unavailable',
          signedUrl: null,
          errorMessage: (err as Error).message,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [narrationEnabled, audioId, isReady, voice.status]);

  // Auto-play once a signed URL lands AND narration is enabled.
  useEffect(() => {
    if (voice.status !== 'ready') return;
    const el = audioRef.current;
    if (!el) return;
    el.play().catch(() => {
      // Browsers block autoplay without user gesture; user can press play
      // manually on the <audio> control. Just transition to "ready".
    });
  }, [voice.status, voice.signedUrl]);

  // Close on Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Pause + clean up audio when the panel unmounts.
  useEffect(() => {
    return () => {
      const el = audioRef.current;
      if (el) {
        el.pause();
        el.src = '';
      }
    };
  }, []);

  const paragraphs = splitParagraphs(body);

  function toggleNarration() {
    if (!narrationEnabled) {
      setEnabled(true);
      // Audio will load via the effect above.
      return;
    }
    // Already enabled — turning off.
    setEnabled(false);
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.src = '';
    }
    setVoice({ status: 'idle', signedUrl: null, errorMessage: null });
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3, 7, 18, 0.92)',
        zIndex: 1000,
        overflowY: 'auto',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        style={{
          maxWidth: '64ch',
          margin: '0 auto',
          padding: '64px 36px 96px',
          fontFamily: 'Georgia, serif',
          color: '#e8d4a0',
        }}
      >
        {/* Top bar: voice toggle + close */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 36,
          }}
        >
          {audioId ? (
            <VoiceToggle
              enabled={narrationEnabled}
              status={voice.status}
              errorMessage={voice.errorMessage}
              onToggle={toggleNarration}
            />
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid rgba(146, 64, 14, 0.4)',
              color: '#e8d4a0',
              padding: '6px 14px',
              borderRadius: 4,
              fontFamily: 'Georgia, serif',
              fontSize: 13,
              cursor: 'pointer',
            }}
            aria-label="Close reader"
          >
            close ✕
          </button>
        </div>

        {/* Kicker */}
        {kicker && (
          <p
            style={{
              color: '#fbbf24',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              margin: '0 0 14px 0',
            }}
          >
            {kicker}
          </p>
        )}

        {/* Title */}
        {title && (
          <h1
            style={{
              color: '#fef3c7',
              fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
              fontWeight: 700,
              margin: '0 0 28px 0',
              lineHeight: 1.2,
              fontFamily: 'Georgia, serif',
            }}
          >
            {title}
          </h1>
        )}

        {/* Body */}
        <div
          style={{
            fontSize: 18,
            lineHeight: 1.75,
            color: '#e8d4a0',
          }}
        >
          {paragraphs.map((p, idx) => (
            <p
              key={idx}
              style={{
                margin: '0 0 1.4em 0',
                // Drop-cap on the first paragraph
                ...(idx === 0
                  ? {}
                  : {}),
              }}
            >
              {idx === 0 ? <DropCap text={p} /> : p}
            </p>
          ))}
        </div>

        {/* Continue */}
        <div style={{ marginTop: 56, textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(146, 64, 14, 0.4)',
              border: '1px solid rgba(251, 191, 36, 0.5)',
              color: '#fef3c7',
              padding: '12px 32px',
              borderRadius: 4,
              fontFamily: 'Georgia, serif',
              fontSize: 16,
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            Continue →
          </button>
        </div>

        {/* Hidden audio element controlled imperatively */}
        {voice.signedUrl && (
          <audio
            ref={audioRef}
            src={voice.signedUrl}
            preload="auto"
            controls
            style={{
              width: '100%',
              marginTop: 24,
              filter: 'sepia(0.4) hue-rotate(15deg)',
            }}
            onPlay={() => setVoice((v) => ({ ...v, status: 'playing' }))}
            onPause={() => setVoice((v) => ({ ...v, status: 'paused' }))}
            onEnded={() => setVoice((v) => ({ ...v, status: 'ready' }))}
          />
        )}
      </div>
    </div>
  );
}

function splitParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function DropCap({ text }: { text: string }) {
  const first = text.charAt(0);
  const rest = text.slice(1);
  return (
    <>
      <span
        style={{
          float: 'left',
          fontFamily: 'Georgia, serif',
          fontSize: '4em',
          lineHeight: 0.85,
          paddingRight: 8,
          paddingTop: 4,
          color: '#fbbf24',
        }}
      >
        {first}
      </span>
      {rest}
    </>
  );
}

function VoiceToggle({
  enabled,
  status,
  errorMessage,
  onToggle,
}: {
  enabled: boolean;
  status: VoiceState['status'];
  errorMessage: string | null;
  onToggle: () => void;
}) {
  const label = enabled
    ? status === 'loading'
      ? 'Loading voice…'
      : status === 'unavailable'
        ? errorMessage ?? 'Voice unavailable'
        : 'Eve · narration on'
    : 'Eve · narration off';

  const icon = enabled ? '🔊' : '🔇';
  const unavailable = enabled && status === 'unavailable';

  return (
    <button
      onClick={onToggle}
      disabled={status === 'loading'}
      title={label}
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: unavailable
          ? 'rgba(127, 29, 29, 0.5)'
          : enabled
            ? 'rgba(20, 83, 45, 0.4)'
            : 'rgba(45, 22, 0, 0.45)',
        border: `1px solid ${unavailable ? 'rgba(220, 38, 38, 0.4)' : 'rgba(146, 64, 14, 0.4)'}`,
        color: '#e8d4a0',
        padding: '6px 14px',
        borderRadius: 4,
        fontFamily: 'Georgia, serif',
        fontSize: 13,
        cursor: status === 'loading' ? 'wait' : 'pointer',
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
