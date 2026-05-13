// ============================================================
// Module detail page — read-only display of the saved skeleton.
//
// CF-1 lands the minimal viewer. CF-2+ add per-section editors
// (rooms, atoms, NPCs, map, narrative, art, validate) as tabs.
// ============================================================

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { ModuleSkeleton } from '@/lib/creator/skeletonTypes';

function pct(n: number): string {
  return (n * 100).toFixed(1) + '%';
}

export default function ModuleDetail() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = params.moduleId;
  const [skeleton, setSkeleton] = useState<ModuleSkeleton | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!moduleId) return;
    fetch(`/api/creator/modules/${moduleId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) {
          setError(data.error ?? 'failed to load module');
          return;
        }
        setSkeleton(data.manifest);
      })
      .catch((err: unknown) => setError((err as Error).message));
  }, [moduleId]);

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <p className="text-slate-500 text-sm">
            <Link href="/creator-forge" className="hover:text-white">
              ← Creator Forge
            </Link>
          </p>
          <h1 className="text-4xl font-bold text-white mb-2 mt-2">
            {skeleton?.name ?? moduleId}
          </h1>
          <code className="text-slate-500 text-sm">{moduleId}</code>
        </header>

        {error && (
          <div className="bg-red-950 border border-red-800 rounded p-4 text-red-300">
            {error}
          </div>
        )}

        {!error && !skeleton && (
          <div className="text-slate-500 italic">Loading…</div>
        )}

        {skeleton && (
          <div className="space-y-6">
            <section className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-lg font-bold text-white mb-3">Loads</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['combat', 'moral', 'gear', 'exploration'] as const).map((k) => (
                  <div key={k}>
                    <div className="text-slate-500 text-xs uppercase tracking-wide">{k}</div>
                    <div className="text-white text-2xl font-bold mt-1">{skeleton.loads[k]}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-lg font-bold text-white mb-3">P(complete) by archetype</h2>
              <div className="grid grid-cols-3 gap-4">
                {(['fresh', 'mid', 'endgame'] as const).map((k) => (
                  <div key={k}>
                    <div className="text-slate-500 text-xs uppercase tracking-wide">{k} hero</div>
                    <div className="text-white text-2xl font-bold mt-1">
                      {pct(skeleton.pCompletePerArchetype[k])}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-lg font-bold text-white mb-3">Rooms</h2>
              <div className="space-y-1">
                {skeleton.rooms.map((r) => {
                  const atomTxt =
                    r.atoms.length === 0
                      ? 'no atoms'
                      : `${r.atoms.length}× ${r.atoms[0].severity}/${r.atoms[0].virtue}`;
                  return (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 text-sm bg-slate-900 rounded px-3 py-2"
                    >
                      <code className="text-blue-400 w-20">{r.id}</code>
                      <span className="text-slate-200 w-48">{r.encounterPattern}</span>
                      <span className="text-slate-400 flex-1">{atomTxt}</span>
                      {r.gearGate && (
                        <span className="text-amber-300 text-xs">
                          gate: {r.gearGate.itemTag}({r.gearGate.difficulty})
                        </span>
                      )}
                      {r.restAvailable && (
                        <span className="text-green-400 text-xs">REST</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <p className="text-slate-500 text-sm italic">
              This is a read-only skeleton view. CF-2 adds Opus-generated prose;
              CF-3 the SVG map; CF-4 named NPCs; CF-5 art; CF-6 .ink scaffolding;
              CF-8 GPE validation. Per-section editors land as tabs in those sprints.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
