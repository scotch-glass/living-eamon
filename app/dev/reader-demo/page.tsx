// ============================================================
// /dev/reader-demo — end-to-end test of the Reader Panel + Eve
// voice pipeline (CF-1.5).
//
// Lets an admin paste prose, generate Eve audio, and preview the
// ReaderPanel as a player would see it.
// ============================================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import ReaderPanel from '@/components/ReaderPanel';

const DEFAULT_AUDIO_ID = 'reader-demo-mott';
const DEFAULT_TEXT = `The mirrors of Tuzun Thune are older than the tower that holds them. They were old when the city below was a village, old when the wizard who set them in their black-iron frames first walked the world. They do not show what is. They show what was, or what might have been, or what the watcher cannot bear to admit they are.

You climb the stairs alone. The wizard does not stop you. He sits cross-legged on a low silver bench in the chamber's heart, and he does not so much as turn his head as you pass him. The first mirror is to your left.

In it, you see yourself. You are wearing a crown. You do not remember when you earned a crown.`;

interface GenerateResponse {
  ok: boolean;
  metadata?: { latestVersion: number | null; status: string };
  error?: string;
}
interface ApproveResponse {
  ok: boolean;
  metadata?: { approvedVersion: number | null; status: string };
  error?: string;
}

export default function ReaderDemo() {
  const [audioId, setAudioId] = useState(DEFAULT_AUDIO_ID);
  const [text, setText] = useState(DEFAULT_TEXT);
  const [genStatus, setGenStatus] = useState<string | null>(null);
  const [approveStatus, setApproveStatus] = useState<string | null>(null);
  const [latestVersion, setLatestVersion] = useState<number | null>(null);
  const [auditionUrl, setAuditionUrl] = useState<string | null>(null);
  const [auditionStatus, setAuditionStatus] = useState<string | null>(null);
  const [readerOpen, setReaderOpen] = useState(false);

  async function generate() {
    setGenStatus('generating… (Eve speaks slowly — large passages may take 60+ seconds)');
    setAuditionUrl(null);
    setAuditionStatus(null);
    try {
      const res = await fetch('/api/voice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioId, text }),
      });
      const data: GenerateResponse = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'generate failed');
      const v = data.metadata?.latestVersion ?? null;
      setGenStatus(
        `generated v${v} · status=${data.metadata?.status} · auto-loading audition…`,
      );
      setLatestVersion(v);
      // Automatically fetch a signed URL for the freshly generated version
      // so the user can audition it before deciding to approve.
      if (v != null) await fetchAudition(v);
    } catch (err) {
      setGenStatus(`error: ${(err as Error).message}`);
    }
  }

  async function fetchAudition(version: number) {
    setAuditionStatus('loading…');
    try {
      const res = await fetch(
        `/api/voice/${encodeURIComponent(audioId)}?version=${version}`,
      );
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'audition fetch failed');
      setAuditionUrl(data.signedUrl);
      setAuditionStatus(`audition v${version} ready — press play below`);
    } catch (err) {
      setAuditionStatus(`audition error: ${(err as Error).message}`);
    }
  }

  async function approveLatest() {
    if (latestVersion == null) {
      setApproveStatus('no version to approve');
      return;
    }
    setApproveStatus('approving…');
    try {
      const res = await fetch('/api/voice/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioId, version: latestVersion, decision: 'approved' }),
      });
      const data: ApproveResponse = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'approve failed');
      setApproveStatus(`approved v${data.metadata?.approvedVersion}`);
    } catch (err) {
      setApproveStatus(`error: ${(err as Error).message}`);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <p className="text-slate-500 text-sm">
            <Link href="/admin" className="hover:text-white">
              ← Admin
            </Link>
          </p>
          <h1 className="text-4xl font-bold text-white mb-2 mt-2">
            Reader Panel · Demo
          </h1>
          <p className="text-slate-400">
            End-to-end test: generate Eve voice for a chunk of prose, approve
            it, then open the Reader Panel to read + listen as a player would.
          </p>
        </header>

        <section className="bg-slate-800 border border-slate-700 rounded-lg p-5 mb-6">
          <label className="block text-sm font-bold text-slate-300 uppercase tracking-wide mb-2">
            audioId (a-z0-9_-)
          </label>
          <input
            type="text"
            value={audioId}
            onChange={(e) => setAudioId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono"
          />
        </section>

        <section className="bg-slate-800 border border-slate-700 rounded-lg p-5 mb-6">
          <label className="block text-sm font-bold text-slate-300 uppercase tracking-wide mb-2">
            Prose
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm font-serif"
          />
          <p className="text-slate-500 text-xs mt-2">
            Length: {text.length} / 15000 chars. Eve speaks slowly — expect
            ~6-8 seconds per sentence of audio.
          </p>
        </section>

        <section className="bg-slate-800 border border-slate-700 rounded-lg p-5 mb-6 space-y-4">
          <div>
            <button
              onClick={generate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
            >
              1. Generate Eve audio
            </button>
            {genStatus && (
              <p className="text-slate-400 text-sm mt-2">→ {genStatus}</p>
            )}
          </div>

          {/* Audition step — always visible so the flow is
              discoverable. Empty state guides the user before they
              click Generate; filled state lets them hear the audio
              before deciding to approve or regen. */}
          <div
            className={`border rounded p-4 ${
              auditionUrl
                ? 'bg-slate-900 border-amber-700'
                : 'bg-slate-900 border-slate-700'
            }`}
          >
            <div className="text-xs font-bold text-amber-300 uppercase tracking-wide mb-2">
              2. Audition {latestVersion != null && `v${latestVersion}`}
            </div>
            {!auditionUrl && !auditionStatus && (
              <p className="text-slate-500 text-sm italic">
                No audio yet. Click <strong className="text-blue-400">Generate Eve audio</strong>{' '}
                above. The audio will land here for you to listen to before
                you decide to approve or regenerate.
              </p>
            )}
            {auditionStatus && !auditionUrl && (
              <p className="text-amber-300 text-sm">→ {auditionStatus}</p>
            )}
            {auditionUrl && (
              <>
                <p className="text-slate-400 text-sm mb-3">
                  Audition v{latestVersion} ready. Listen and read along to
                  verify word-for-word match, then approve or regenerate.
                </p>
                <audio
                  src={auditionUrl}
                  controls
                  autoPlay
                  className="w-full mb-3"
                />
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wide mb-2">
                  Script (read along) · {text.length} chars
                </div>
                <div className="bg-slate-950 border border-slate-700 rounded p-3 max-h-96 overflow-y-auto text-slate-200 text-sm font-serif whitespace-pre-wrap leading-relaxed">
                  {text}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={generate}
                    className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded text-sm"
                  >
                    ↻ Regenerate (don't like this take)
                  </button>
                </div>
              </>
            )}
          </div>

          <div>
            <button
              onClick={approveLatest}
              disabled={latestVersion == null}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-medium disabled:opacity-30"
            >
              3. Approve latest version
            </button>
            {approveStatus && (
              <p className="text-slate-400 text-sm mt-2">→ {approveStatus}</p>
            )}
          </div>
          <div>
            <button
              onClick={() => setReaderOpen(true)}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded font-medium"
            >
              4. Open Reader Panel
            </button>
            <p className="text-slate-500 text-xs mt-2">
              The reader will fetch <code>/api/voice/{audioId}</code> for the
              approved audio. Toggle the 🔇/🔊 button to enable narration —
              defaults to off.
            </p>
          </div>
        </section>

        <p className="text-slate-500 text-xs italic">
          Admin-review surface at{' '}
          <Link href="/admin/audio-review" className="text-blue-400 hover:text-blue-300">
            /admin/audio-review
          </Link>{' '}
          shows pending + approved + rejected audio across all audioIds.
        </p>
      </div>

      {readerOpen && (
        <ReaderPanel
          kicker="Reader Demo"
          title="The Mirrors of Tuzun Thune"
          body={text}
          audioId={audioId}
          onClose={() => setReaderOpen(false)}
        />
      )}
    </div>
  );
}
