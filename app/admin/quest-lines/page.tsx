// ============================================================
// Quest Line Orchestrator — quest-line list landing page (Sprint CF-0).
//
// Admin-only. Empty-state shell now; Sprint CF-7 wires the quest-line
// authoring spine. Quest Lines are full narrative arcs that wrap one
// or more Modules with opening/closing prose, interlude atoms between
// modules, persistent flags, and a meta-reward.
// ============================================================

'use client';

import Link from 'next/link';

export default function QuestLinesPage() {
  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <p className="text-slate-500 text-sm">
            <Link href="/admin" className="hover:text-white">← Admin</Link>
          </p>
          <h1 className="text-4xl font-bold text-white mb-2 mt-2">
            Quest Line Orchestrator
          </h1>
          <p className="text-slate-400 text-lg">
            Stitch Modules into multi-stage Quest Lines. Full narrative spine —
            opening prose, interludes between modules, persistent flags,
            meta-reward. Ships in Sprint CF-7.
          </p>
        </header>

        <section className="mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-10 text-center">
            <p className="text-slate-300 text-lg mb-2">
              Quest Line authoring is not yet available.
            </p>
            <p className="text-slate-500 text-sm">
              Sprint CF-7 wires this surface. The Creator Forge ships first —
              Modules are the building blocks Quest Lines stitch together.
            </p>
            <Link
              href="/creator-forge"
              className="mt-6 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
            >
              Go to Creator Forge →
            </Link>
          </div>
        </section>

        <footer className="mt-12 text-slate-500 text-sm">
          See <code>docs/plans/creator-forge-and-quest-line-orchestrator.md</code>{' '}
          for the full roadmap.
        </footer>
      </div>
    </div>
  );
}
