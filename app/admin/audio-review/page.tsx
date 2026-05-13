// ============================================================
// /admin/audio-review — admin approval surface for generated
// Eve voice audio (CF-1.5).
//
// Mirrors /admin/destination-review pattern:
//   - list pending audio entries
//   - audition any version (signed URL)
//   - approve / reject / request regen
//
// Admin-only (proxy.ts gates /admin/* in production and the
// API routes themselves re-check role).
// ============================================================

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type {
  AudioListEntry,
  VoiceMetadata,
} from '@/lib/voice/storage';

interface ApiListResp {
  ok: boolean;
  entries?: AudioListEntry[];
  error?: string;
}
interface ApiMetaResp {
  ok: boolean;
  metadata?: VoiceMetadata;
  signedUrl?: string | null;
  error?: string;
}

export default function AudioReview() {
  const [entries, setEntries] = useState<AudioListEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    try {
      const res = await fetch('/api/voice/list');
      const data: ApiListResp = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'failed to load list');
      setEntries(data.entries ?? []);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <p className="text-slate-500 text-sm">
            <Link href="/admin" className="hover:text-white">
              ← Admin
            </Link>
          </p>
          <h1 className="text-4xl font-bold text-white mb-2 mt-2">Audio Review</h1>
          <p className="text-slate-400">
            Generated Eve voice (xAI TTS) waiting for approval. Only approved
            audio reaches the player-side Reader Panel.
          </p>
        </header>

        {error && (
          <div className="bg-red-950 border border-red-800 rounded p-4 text-red-300 mb-6">
            {error}
          </div>
        )}

        {entries === null && <div className="text-slate-500 italic">Loading…</div>}

        {entries !== null && entries.length === 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-10 text-center">
            <p className="text-slate-300 text-lg mb-2">No audio yet.</p>
            <p className="text-slate-500 text-sm">
              Generate voice via the Creator Forge prose-authoring flow (CF-2)
              or the demo at <code>/dev/reader-demo</code>.
            </p>
          </div>
        )}

        {entries !== null && entries.length > 0 && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-1 space-y-2">
              {entries.map((e) => (
                <button
                  key={e.audioId}
                  onClick={() => setSelectedId(e.audioId)}
                  className={`block w-full text-left p-3 rounded border ${
                    selectedId === e.audioId
                      ? 'bg-blue-900 border-blue-600'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <code className="text-blue-400 text-sm">{e.audioId}</code>
                    <StatusPill status={e.status} />
                  </div>
                  <div className="text-slate-400 text-xs line-clamp-2">
                    {e.textPreview || '(no text)'}
                  </div>
                </button>
              ))}
            </div>
            <div className="col-span-2">
              {selectedId ? (
                <AudioDetail audioId={selectedId} onChanged={loadList} />
              ) : (
                <div className="text-slate-500 italic">Pick an audio entry to review.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: AudioListEntry['status'] }) {
  const styles: Record<AudioListEntry['status'], { label: string; cls: string }> = {
    pending: { label: 'PENDING', cls: 'bg-yellow-600 text-yellow-50' },
    approved: { label: 'APPROVED', cls: 'bg-green-700 text-green-100' },
    rejected: { label: 'REJECTED', cls: 'bg-red-700 text-red-100' },
  };
  const s = styles[status];
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${s.cls}`}>
      {s.label}
    </span>
  );
}

function AudioDetail({
  audioId,
  onChanged,
}: {
  audioId: string;
  onChanged: () => void;
}) {
  const [meta, setMeta] = useState<VoiceMetadata | null>(null);
  const [approvedUrl, setApprovedUrl] = useState<string | null>(null);
  const [versionUrls, setVersionUrls] = useState<Record<number, string>>({});
  const [scriptDraft, setScriptDraft] = useState<string>('');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch(
        `/api/voice/${encodeURIComponent(audioId)}?meta=1`,
      );
      const data: ApiMetaResp = await res.json();
      if (!data.ok || !data.metadata) {
        throw new Error(data.error ?? 'failed to load metadata');
      }
      setMeta(data.metadata);
      setApprovedUrl(data.signedUrl ?? null);
      // Sync the editable script draft to whatever's on the server.
      // Drops any unsaved local edits — refresh is intentional.
      setScriptDraft(data.metadata.currentScript ?? '');
    } catch (e) {
      setErr((e as Error).message);
    }
  }, [audioId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function audition(version: number) {
    if (versionUrls[version]) return;
    try {
      const res = await fetch(
        `/api/voice/${encodeURIComponent(audioId)}?version=${version}`,
      );
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'audition failed');
      setVersionUrls((m) => ({ ...m, [version]: data.signedUrl }));
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  async function decide(version: number, decision: 'approved' | 'rejected') {
    setBusy(`${decision}-${version}`);
    setErr(null);
    try {
      const res = await fetch('/api/voice/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioId, version, decision }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'approval failed');
      await refresh();
      onChanged();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function saveScript() {
    if (!meta) return;
    setBusy('save-script');
    setErr(null);
    try {
      const res = await fetch('/api/voice/script', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioId, script: scriptDraft }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'save failed');
      await refresh();
      onChanged();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function regen() {
    if (!meta) return;
    // Use the current draft (possibly edited but unsaved) as the
    // regen input. This is intentional — the admin's most recent
    // edit is what they want narrated. Also persists the script.
    const text = scriptDraft.trim();
    if (!text) {
      setErr('script is empty — nothing to regenerate');
      return;
    }
    setBusy('regen');
    setErr(null);
    try {
      const res = await fetch('/api/voice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioId, text }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'regen failed');
      await refresh();
      onChanged();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (err) return <div className="text-red-400">{err}</div>;
  if (!meta) return <div className="text-slate-500 italic">Loading…</div>;

  // Drift detection: the approved version's text vs the current script
  // the admin has saved. If they differ, the player will read different
  // words than they hear when narration plays. UI warns and offers
  // "Regenerate" to bring audio back in sync.
  const approvedText =
    meta.approvedVersion != null
      ? meta.versions.find((v) => v.version === meta.approvedVersion)?.text
      : null;
  const drift =
    approvedText != null && approvedText !== meta.currentScript;
  const scriptDirty = scriptDraft !== meta.currentScript;

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-white">
            <code className="text-blue-400">{audioId}</code>
          </h2>
          <StatusPill status={meta.status} />
        </div>
        {approvedUrl && (
          <div className="mb-4">
            <div className="text-xs font-bold text-green-300 uppercase tracking-wide mb-2">
              Approved version
            </div>
            <audio src={approvedUrl} controls className="w-full" />
          </div>
        )}

        {/* The canonical script — editable. This is what the player
            sees in the Reader Panel AND what the next regen uses. */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs font-bold text-amber-300 uppercase tracking-wide">
              Script · {scriptDraft.length} chars
              {scriptDirty && (
                <span className="ml-2 text-yellow-300">· unsaved edits</span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 italic">
              This is what the player reads. Editing it also changes the
              text that the next regenerate uses.
            </div>
          </div>
          <textarea
            value={scriptDraft}
            onChange={(e) => setScriptDraft(e.target.value)}
            rows={Math.min(20, Math.max(6, scriptDraft.split('\n').length))}
            className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-slate-200 text-sm font-serif whitespace-pre-wrap leading-relaxed"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={saveScript}
              disabled={busy !== null || !scriptDirty}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded text-sm font-medium disabled:opacity-30"
            >
              {busy === 'save-script' ? 'Saving…' : '💾 Save script'}
            </button>
            <button
              onClick={regen}
              disabled={busy !== null || !scriptDraft.trim()}
              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded text-sm font-medium disabled:opacity-30"
            >
              {busy === 'regen' ? 'Regenerating…' : '↻ Regenerate audio from this script'}
            </button>
            {scriptDirty && (
              <button
                onClick={() => setScriptDraft(meta.currentScript)}
                disabled={busy !== null}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm disabled:opacity-30"
              >
                Discard edits
              </button>
            )}
          </div>
        </div>

        {drift && (
          <div className="mt-4 bg-red-950 border border-red-700 rounded p-3 text-sm">
            <div className="text-red-300 font-bold mb-1">⚠ Audio drift</div>
            <p className="text-red-200">
              The approved audio (v{meta.approvedVersion}) was generated from
              different text than the current script. Players will hear one
              thing and read another. Regenerate to sync, or approve a
              different version.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {[...meta.versions].reverse().map((v) => {
          const isApproved = meta.approvedVersion === v.version;
          return (
            <div
              key={v.version}
              className={`bg-slate-800 border rounded-lg p-4 ${
                isApproved ? 'border-green-600' : 'border-slate-700'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-white font-bold">
                    Version {v.version}
                    {isApproved && (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-green-700 text-green-100">
                        approved
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500 text-xs mt-1">
                    {new Date(v.generatedAt).toLocaleString()} ·{' '}
                    {Math.round(v.bytes / 1024)} KB
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => audition(v.version)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs"
                  >
                    ▶ Audition
                  </button>
                  {!isApproved && (
                    <button
                      onClick={() => decide(v.version, 'approved')}
                      disabled={busy !== null}
                      className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded text-xs font-medium disabled:opacity-30"
                    >
                      ✓ Approve
                    </button>
                  )}
                  <button
                    onClick={() => decide(v.version, 'rejected')}
                    disabled={busy !== null}
                    className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded text-xs font-medium disabled:opacity-30"
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
              <details className="mt-2">
                <summary className="text-xs font-bold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-300">
                  Snapshot of text this version was generated from
                  {' '}· {v.text.length} chars
                  {v.text !== meta.currentScript && (
                    <span className="ml-2 text-yellow-400">· differs from current script</span>
                  )}
                </summary>
                <div
                  className="text-slate-300 text-sm font-serif whitespace-pre-wrap leading-relaxed bg-slate-950 border border-slate-700 rounded p-3 mt-2 max-h-96 overflow-y-auto"
                >
                  {v.text}
                </div>
              </details>
              {versionUrls[v.version] && (
                <audio
                  src={versionUrls[v.version]}
                  controls
                  className="w-full mt-3"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
