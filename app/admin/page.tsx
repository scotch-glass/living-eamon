'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type SprintStatus = 'planned' | 'in-progress' | 'shipped';

interface PlannedSprint {
  id: string;          // e.g., "CF-1"
  name: string;        // meaningful name, e.g., "Multiple-choice template engine"
  anchor: string;      // links to /library/plans/{planSlug}#{anchor}
  status: SprintStatus;
}

interface Tool {
  href: string;
  name: string;
  description: string;
  status: 'live' | 'partial' | 'planned';
  /** Slug of the canonical plan in docs/plans/ (without .md), if any. */
  planSlug?: string;
  pendingTasks: string[];
  /** Sprints from the canonical plan. Each links to the plan's anchor. */
  plannedSprints?: PlannedSprint[];
  /** Free-form feature ideas not yet captured as plan-tracked sprints. */
  featuresToCode: string[];
}

const CREATOR_FORGE_PLAN = 'creator-forge-and-quest-line-orchestrator';

const TOOLS: Tool[] = [
  {
    href: '/creator-forge',
    name: 'Creator Forge',
    description:
      'Author adventure modules end-to-end: rooms, atoms, NPCs, henchmen, art, Howard-voice prose, Eamon-style maps. Open to creator + admin roles.',
    status: 'planned',
    planSlug: CREATOR_FORGE_PLAN,
    pendingTasks: ['Sprint CF-0 foundation shipped — wizard ships in CF-1'],
    plannedSprints: [
      { id: 'CF-0', name: 'Foundation — routes, Opus client, Supabase storage, /creator-forge shell', anchor: 'cf-0', status: 'shipped' },
      { id: 'CF-1', name: 'Multiple-choice template engine + module skeleton wizard', anchor: 'cf-1', status: 'planned' },
      { id: 'CF-2', name: 'Claude Opus 4.7 narrative prose generation (Howard grimdark)', anchor: 'cf-2', status: 'planned' },
      { id: 'CF-3', name: 'Eamon-style SVG map generator (1980s graph-paper aesthetic)', anchor: 'cf-3', status: 'planned' },
      { id: 'CF-4', name: 'NPC + henchman authoring with difficulty-clamped stats', anchor: 'cf-4', status: 'planned' },
      { id: 'CF-5', name: 'Room art + NPC sprite workflow (Grok-Imagine-Pro only)', anchor: 'cf-5', status: 'planned' },
      { id: 'CF-6', name: 'Ink scaffolding + JSON compile + promote-module CLI', anchor: 'cf-6', status: 'planned' },
      { id: 'CF-8', name: 'Validation + GPE balance scorecard + publish gate', anchor: 'cf-8', status: 'planned' },
    ],
    featuresToCode: [],
  },
  {
    href: '/admin/quest-lines',
    name: 'Quest Line Orchestrator',
    description:
      'Stitch Modules into multi-stage Quest Lines with opening prose, interlude atoms, persistent flags, meta-reward.',
    status: 'planned',
    planSlug: CREATOR_FORGE_PLAN,
    pendingTasks: ['Sprint CF-7 — placeholder shell shipped'],
    plannedSprints: [
      { id: 'CF-7', name: 'Quest Line Orchestrator — narrative spine, interludes, meta-reward editor', anchor: 'cf-7', status: 'planned' },
    ],
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
    href: '/admin/audio-review',
    name: 'Audio Review',
    description:
      'Eve voice (xAI TTS) narration audio — approve / reject / regen generated mp3s. Only approved audio reaches the player Reader Panel.',
    status: 'partial',
    pendingTasks: ['Audio is generated via the Creator Forge prose-authoring flow (CF-2) or /dev/reader-demo'],
    featuresToCode: [
      'Bulk approve',
      'Filter by status',
      'Listen-side waveform / scrub UI',
      'Per-Howard-anchor tone-preset overrides',
    ],
  },
  {
    href: '/dev/reader-demo',
    name: 'Reader Demo',
    description:
      'End-to-end test of the Reader Panel: paste prose, generate Eve audio, approve, preview as player.',
    status: 'live',
    pendingTasks: [],
    featuresToCode: [],
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

function sprintPill(status: SprintStatus) {
  switch (status) {
    case 'shipped':
      return { label: 'SHIPPED', className: 'bg-green-700 text-green-100' };
    case 'in-progress':
      return { label: 'IN PROGRESS', className: 'bg-yellow-600 text-yellow-50' };
    case 'planned':
      return { label: 'PLANNED', className: 'bg-slate-700 text-slate-300' };
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

  const totalFeatures = TOOLS.reduce(
    (sum, t) => sum + t.featuresToCode.length + (t.plannedSprints?.length ?? 0),
    0,
  );

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">Living Eamon — Admin</h1>
          <p className="text-slate-400 text-lg">
            Internal tools for content authoring, art review, and world-building.
          </p>
        </header>

        <nav className="mb-10 bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
            Open a tool
          </h2>
          <div className="flex flex-wrap gap-2">
            {TOOLS.map((tool) => {
              const badge = statusBadge(tool.status);
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-blue-900 text-slate-200 hover:text-white text-sm rounded border border-slate-700 hover:border-blue-700 transition-colors"
                >
                  <span>{tool.name}</span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

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
              <div className="text-slate-400 text-sm">Planned sprints + features</div>
              <div className="text-white text-2xl font-bold mt-1">{totalFeatures}</div>
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
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <code className="text-slate-500">{tool.href}</code>
                        {tool.planSlug && (
                          <Link
                            href={`/library/plans/${tool.planSlug}`}
                            className="text-blue-400 hover:text-blue-300 underline decoration-dotted"
                          >
                            view plan
                          </Link>
                        )}
                      </div>
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

                  {tool.plannedSprints && tool.plannedSprints.length > 0 && tool.planSlug && (
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-2">
                        Planned sprints
                      </h3>
                      <ul className="space-y-1.5">
                        {tool.plannedSprints.map((sprint) => {
                          const pill = sprintPill(sprint.status);
                          return (
                            <li key={sprint.id} className="flex items-start gap-2 text-sm">
                              <span
                                className={`shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${pill.className}`}
                                title={`Sprint status: ${sprint.status}`}
                              >
                                {pill.label}
                              </span>
                              <Link
                                href={`/library/plans/${tool.planSlug}#${sprint.anchor}`}
                                className="text-slate-200 hover:text-blue-300"
                              >
                                <span className="font-mono text-blue-400 mr-1">{sprint.id}:</span>
                                <span className="underline decoration-slate-600 decoration-dotted hover:decoration-blue-400">
                                  {sprint.name}
                                </span>
                              </Link>
                            </li>
                          );
                        })}
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
          Edit this dashboard at <code>app/admin/page.tsx</code>. Planned sprints
          link to anchors in their canonical plan under <code>docs/plans/</code>,
          surfaced via <Link href="/library/plans" className="text-blue-400 hover:text-blue-300">/library/plans</Link>.
        </footer>
      </div>
    </div>
  );
}
