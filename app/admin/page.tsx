'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Tool {
  href: string;
  name: string;
  description: string;
  status: 'live' | 'partial' | 'planned';
  pendingTasks: string[];
  featuresToCode: string[];
}

const TOOLS: Tool[] = [
  {
    href: '/creator-forge',
    name: 'Creator Forge',
    description:
      'Author adventure modules end-to-end: rooms, atoms, NPCs, henchmen, art, Howard-voice prose, Eamon-style maps. Open to creator + admin roles.',
    status: 'planned',
    pendingTasks: ['Sprint CF-0 foundation only — wizard ships in CF-1'],
    featuresToCode: [
      'CF-1: Multiple-choice template engine + module skeleton wizard',
      'CF-2: Claude Opus 4.7 narrative prose generation (Howard grimdark)',
      'CF-3: Eamon-style SVG map generator (1980s graph-paper aesthetic)',
      'CF-4: NPC + henchman authoring with difficulty-clamped stats',
      'CF-5: Room art + NPC sprite workflow (Grok-Imagine-Pro only)',
      'CF-6: Ink scaffolding + JSON compile + promote-module CLI',
      'CF-8: Validation + GPE balance scorecard + publish gate',
    ],
  },
  {
    href: '/admin/quest-lines',
    name: 'Quest Line Orchestrator',
    description:
      'Stitch Modules into multi-stage Quest Lines with opening prose, interlude atoms, persistent flags, meta-reward.',
    status: 'planned',
    pendingTasks: ['Sprint CF-7 — placeholder shell shipped'],
    featuresToCode: [
      'Module spine drag-reorder + interlude atom insertion',
      'Opening + closing prose (Opus-generated, hand-edited)',
      'Zoomed-out Quest Line map',
      'Persistent flag wiring + module-completion triggers',
      'Meta-reward editor (PICSSI delta, items, legacy chronicle, Mithras Word boost)',
    ],
  },
  {
    href: '/admin/destination-review',
    name: 'Destination Room Review',
    description:
      '25 destination scenes + NPCs. Review, approve, reject, regenerate.',
    status: 'partial',
    pendingTasks: ['25 destination scenes awaiting review (bg-v3.jpg batch)'],
    featuresToCode: [
      'Wire Regenerate button to forge scripts with custom prompt',
      'Server-side persistence of approval decisions (currently localStorage only)',
      'Batch approve/reject',
      'Filter list by status (pending / approved / rejected)',
      'Promote bg-v3.jpg → bg.jpg on approval (mark primary)',
    ],
  },
  {
    href: '/admin/room-map',
    name: 'Room Map',
    description: 'Mermaid diagram of room connectivity across adventures.',
    status: 'live',
    pendingTasks: [],
    featuresToCode: [
      'Click-through navigation to room files',
      'Filter by adventure / zone',
    ],
  },
  {
    href: '/dev/sprite-review',
    name: 'Sprite Review',
    description: 'NPC/hero sprite library QA — approve, reject, touchup.',
    status: 'live',
    pendingTasks: ['Pending sprite QA queue (count TBD — read from sprite-list API)'],
    featuresToCode: [
      'Volunteer-QA workflow (third tier alongside LLM-vision + paid Turk)',
      'Trap-question reputation system',
    ],
  },
  {
    href: '/dev/sprite-touchup',
    name: 'Sprite Touchup',
    description: 'Re-roll or touch-up individual sprite candidates.',
    status: 'live',
    pendingTasks: [],
    featuresToCode: ['Bulk regenerate by tag'],
  },
  {
    href: '/forge-avatar',
    name: 'Forge Avatar',
    description: 'Hero/avatar creation wizard.',
    status: 'live',
    pendingTasks: [],
    featuresToCode: [
      'Wire Stripe payment gate before character creation',
      'Per-player face variation forge (deferred until multiplayer)',
    ],
  },
];

function statusBadge(status: Tool['status']) {
  switch (status) {
    case 'live':
      return { label: 'LIVE', className: 'bg-green-600 text-white' };
    case 'partial':
      return { label: 'PARTIAL', className: 'bg-yellow-500 text-slate-900' };
    case 'planned':
      return { label: 'PLANNED', className: 'bg-slate-600 text-white' };
  }
}

interface DestinationStatus {
  id: string;
  bgStatus: 'pending' | 'approved' | 'rejected';
  npcStatus: 'pending' | 'approved' | 'rejected';
}

export default function AdminDashboard() {
  const [destinationCounts, setDestinationCounts] = useState<{
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  }>({ pending: 25, approved: 0, rejected: 0, total: 25 });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('destination-review-statuses');
      if (!raw) return;
      const parsed = JSON.parse(raw) as DestinationStatus[];
      let approved = 0;
      let rejected = 0;
      for (const s of parsed) {
        if (s.bgStatus === 'approved') approved++;
        else if (s.bgStatus === 'rejected') rejected++;
      }
      const total = 25;
      setDestinationCounts({
        pending: total - approved - rejected,
        approved,
        rejected,
        total,
      });
    } catch {
      // ignore corrupt storage
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-5xl font-bold text-white mb-2">Living Eamon — Admin</h1>
          <p className="text-slate-400 text-lg">
            Internal tools for content authoring, art review, and world-building.
          </p>
        </header>

        <section className="mb-10 bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-4">At a glance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 rounded p-4">
              <div className="text-slate-400 text-sm">Destination scenes</div>
              <div className="text-white text-2xl font-bold mt-1">{destinationCounts.total}</div>
              <div className="text-slate-500 text-xs mt-2">
                <span className="text-yellow-400">{destinationCounts.pending} pending</span>
                {' · '}
                <span className="text-green-400">{destinationCounts.approved} approved</span>
                {' · '}
                <span className="text-red-400">{destinationCounts.rejected} rejected</span>
              </div>
            </div>
            <div className="bg-slate-900 rounded p-4">
              <div className="text-slate-400 text-sm">Tools live</div>
              <div className="text-white text-2xl font-bold mt-1">
                {TOOLS.filter((t) => t.status === 'live').length}
              </div>
            </div>
            <div className="bg-slate-900 rounded p-4">
              <div className="text-slate-400 text-sm">Tools partial</div>
              <div className="text-white text-2xl font-bold mt-1">
                {TOOLS.filter((t) => t.status === 'partial').length}
              </div>
            </div>
            <div className="bg-slate-900 rounded p-4">
              <div className="text-slate-400 text-sm">Features to code</div>
              <div className="text-white text-2xl font-bold mt-1">
                {TOOLS.reduce((sum, t) => sum + t.featuresToCode.length, 0)}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Tools</h2>
          <div className="grid gap-4">
            {TOOLS.map((tool) => {
              const badge = statusBadge(tool.status);
              return (
                <div
                  key={tool.href}
                  className="bg-slate-800 rounded-lg p-6 border border-slate-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Link
                        href={tool.href}
                        className="text-2xl font-bold text-white hover:text-blue-400"
                      >
                        {tool.name} →
                      </Link>
                      <p className="text-slate-400 mt-1">{tool.description}</p>
                      <code className="text-slate-500 text-xs">{tool.href}</code>
                    </div>
                    <span
                      className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {tool.pendingTasks.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wide mb-2">
                        Tasks awaiting
                      </h3>
                      <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                        {tool.pendingTasks.map((task) => (
                          <li key={task}>{task}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {tool.featuresToCode.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-2">
                        Features to code
                      </h3>
                      <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                        {tool.featuresToCode.map((feature) => (
                          <li key={feature}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <footer className="mt-10 text-slate-500 text-sm">
          Edit this dashboard at <code>app/admin/page.tsx</code>. Counts pull from
          tool-specific localStorage keys.
        </footer>
      </div>
    </div>
  );
}
