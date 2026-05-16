// ============================================================
// Module-creation wizard (CF-1).
//
// 5 steps: Setting → Conflict → Mechanics → Shape → Preview.
//
// When the Creator picks a PD anchor in step 1, the wizard
// auto-fills the other 16 questions with story-specific defaults
// (including AI-pre-filled customText for "Other" options). The
// Creator can confirm or tweak any answer before previewing.
// ============================================================

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QUESTIONNAIRE } from '@/lib/creator/questionnaire';
import { getPdAnchor } from '@/lib/creator/pdAnchors';
import type {
  ModuleSkeleton,
  WizardAnswer,
  WizardQuestion,
  WizardOption,
} from '@/lib/creator/skeletonTypes';

const SECTIONS: Array<{
  key: 'setting' | 'conflict' | 'mechanics' | 'shape';
  title: string;
  description: string;
}> = [
  { key: 'setting', title: 'Setting', description: 'Where it happens, who inspires it.' },
  { key: 'conflict', title: 'Conflict', description: 'What the player is up against, morally.' },
  { key: 'mechanics', title: 'Mechanics', description: 'Combat density, gear, atom severity.' },
  { key: 'shape', title: 'Shape', description: 'Length, pace, reward.' },
];

interface AnswerState {
  optionId: string;
  customText?: string;
}

function questionsForSection(section: 'setting' | 'conflict' | 'mechanics' | 'shape'): WizardQuestion[] {
  return QUESTIONNAIRE.filter((q) => q.section === section);
}

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export default function NewModuleWizard() {
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);
  const [name, setName] = useState('');
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [skeleton, setSkeleton] = useState<ModuleSkeleton | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const moduleId = useMemo(() => slugify(name), [name]);
  const moduleIdValid = /^[a-z0-9][a-z0-9_-]{0,63}$/.test(moduleId);

  const currentSection = stepIdx < 4 ? SECTIONS[stepIdx] : null;
  const currentQuestions = currentSection ? questionsForSection(currentSection.key) : [];
  const allSectionsAnswered = useMemo(
    () => QUESTIONNAIRE.every((q) => answers[q.id]?.optionId !== undefined),
    [answers],
  );

  // Pick a non-"other" option. Just records the optionId; clears any
  // customText so the textarea resets when the Creator changes their mind.
  function pickOption(qId: string, oId: string) {
    if (qId === 'pd-anchor') {
      applyPdAnchorDefaults(oId);
      return;
    }
    setAnswers((prev) => ({
      ...prev,
      [qId]: { optionId: oId, customText: prev[qId]?.customText },
    }));
  }

  // When the Creator selects "Other" and types — preserves the typed text
  // for the next time they revisit the question.
  function setCustomText(qId: string, text: string) {
    setAnswers((prev) => ({
      ...prev,
      [qId]: { optionId: 'other', customText: text },
    }));
  }

  function applyPdAnchorDefaults(anchorId: string) {
    const anchor = getPdAnchor(anchorId);
    setAnswers((prev) => {
      const next: Record<string, AnswerState> = {
        ...prev,
        'pd-anchor': { optionId: anchorId },
      };
      if (!anchor || !anchor.defaults) return next;
      for (const [qId, def] of Object.entries(anchor.defaults)) {
        next[qId] = {
          optionId: def.optionId,
          customText: def.customText,
        };
      }
      return next;
    });
  }

  async function runPreview() {
    if (!moduleIdValid) {
      setPreviewError('Module name is required and must produce a valid slug.');
      return;
    }
    if (!allSectionsAnswered) {
      setPreviewError('Answer every question before previewing.');
      return;
    }
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const wizardAnswers: WizardAnswer[] = Object.entries(answers).map(
        ([questionId, a]) => ({
          questionId,
          optionId: a.optionId,
          customText: a.customText,
        }),
      );
      const res = await fetch('/api/creator/skeleton', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, name, answers: wizardAnswers }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'skeleton generation failed');
      setSkeleton(data.skeleton);
    } catch (err) {
      setPreviewError((err as Error).message);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function saveSkeleton() {
    if (!skeleton) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/creator/modules/${moduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...skeleton, id: moduleId }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'save failed');
      router.push(`/creator-forge/${moduleId}`);
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function next() {
    if (stepIdx === 3) {
      setStepIdx(4);
      setTimeout(() => runPreview(), 0);
      return;
    }
    setStepIdx((i) => Math.min(4, i + 1));
  }

  function back() {
    setStepIdx((i) => Math.max(0, i - 1));
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <p className="text-slate-500 text-sm">
            <Link href="/creator-forge" className="hover:text-white">
              ← Creator Forge
            </Link>
          </p>
          <h1 className="text-4xl font-bold text-white mb-2 mt-2">New Module</h1>
          <p className="text-slate-400 mb-2">
            Pick a Howard public-domain story in step 1 and the wizard auto-fills
            the rest with story-specific defaults. Tweak any answer before
            generating the preview.
          </p>
          <p className="text-slate-500 text-sm italic">
            Design goal: the module captures the <em>feel</em>, setting, and
            atmosphere of the source story as closely as possible — but the
            player character is the hero, not Kull / Bran Mak Morn / Howard's
            named protagonist. Per <code className="text-amber-300">Public_Domain_Rules.md</code>{' '}
            §4.4 customization discipline. CF-2 hands these answers to Claude
            Opus 4.7 as prose seeds.
          </p>
        </header>

        <Stepper currentIdx={stepIdx} />

        {stepIdx < 4 && (
          <div className="mb-8 bg-slate-800 border border-slate-700 rounded-lg p-5">
            <label className="block text-sm font-bold text-slate-300 uppercase tracking-wide mb-2">
              Module name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Mirrors of Tuzun Thune"
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
            />
            {name && (
              <div className="text-slate-500 text-xs mt-2">
                ID:{' '}
                <code className={moduleIdValid ? 'text-blue-400' : 'text-red-400'}>
                  {moduleId || '(invalid)'}
                </code>
              </div>
            )}
          </div>
        )}

        {currentSection && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">{currentSection.title}</h2>
            <p className="text-slate-400 mb-6">{currentSection.description}</p>
            <div className="space-y-6">
              {currentQuestions.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  selected={answers[q.id]}
                  onPick={(oid) => pickOption(q.id, oid)}
                  onCustomText={(text) => setCustomText(q.id, text)}
                />
              ))}
            </div>
          </section>
        )}

        {stepIdx === 4 && (
          <Preview
            loading={previewLoading}
            error={previewError}
            skeleton={skeleton}
            onSave={saveSkeleton}
            saving={saving}
            saveError={saveError}
          />
        )}

        <div className="flex justify-between mt-8">
          <button
            onClick={back}
            disabled={stepIdx === 0}
            className="px-4 py-2 bg-slate-800 text-white rounded border border-slate-700 disabled:opacity-30"
          >
            ← Back
          </button>
          {stepIdx < 4 && (
            <button
              onClick={next}
              disabled={!sectionAnswered(stepIdx, answers) || !moduleIdValid}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {stepIdx === 3 ? 'Generate Preview →' : 'Next →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function sectionAnswered(
  stepIdx: number,
  answers: Record<string, AnswerState>,
): boolean {
  if (stepIdx >= 4) return true;
  const sectionKey = SECTIONS[stepIdx].key;
  return QUESTIONNAIRE.filter((q) => q.section === sectionKey).every(
    (q) => answers[q.id]?.optionId !== undefined,
  );
}

function Stepper({ currentIdx }: { currentIdx: number }) {
  const labels = [...SECTIONS.map((s) => s.title), 'Preview'];
  return (
    <div className="flex flex-wrap items-center gap-2 mb-8 text-xs uppercase tracking-wide">
      {labels.map((l, i) => {
        const active = i === currentIdx;
        const done = i < currentIdx;
        return (
          <div key={l} className="flex items-center gap-2">
            <div
              className={`px-3 py-1 rounded ${
                active
                  ? 'bg-blue-600 text-white font-bold'
                  : done
                    ? 'bg-green-900 text-green-300'
                    : 'bg-slate-800 text-slate-500'
              }`}
            >
              {i + 1}. {l}
            </div>
            {i < labels.length - 1 && <div className="text-slate-700">→</div>}
          </div>
        );
      })}
    </div>
  );
}

function QuestionCard({
  question,
  selected,
  onPick,
  onCustomText,
}: {
  question: WizardQuestion;
  selected: AnswerState | undefined;
  onPick: (id: string) => void;
  onCustomText: (text: string) => void;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
      <div className="mb-3">
        <h3 className="text-lg font-bold text-white">{question.prompt}</h3>
        {question.helper && (
          <p className="text-slate-500 text-sm mt-1">{question.helper}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {question.options.map((opt) => (
          <OptionButton
            key={opt.id}
            questionId={question.id}
            option={opt}
            selected={selected?.optionId === opt.id}
            onPick={() => onPick(opt.id)}
          />
        ))}
      </div>

      {selected?.optionId === 'other' && (
        <div className="mt-4">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
            Custom answer (free text)
          </label>
          <textarea
            value={selected.customText ?? ''}
            onChange={(e) => onCustomText(e.target.value)}
            placeholder="Describe in your own words. CF-2 prose generation will use this as a flavor seed."
            rows={3}
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm font-serif"
          />
          <p className="text-slate-500 text-xs mt-1 italic">
            Free text is preserved on the skeleton but does not affect difficulty math.
          </p>
        </div>
      )}
    </div>
  );
}

function OptionButton({
  questionId,
  option,
  selected,
  onPick,
}: {
  questionId: string;
  option: WizardOption;
  selected: boolean;
  onPick: () => void;
}) {
  // Special enrichment for the PD-anchor question: pull the source URL
  // + PD notice off the registry and render under the button.
  const anchor = questionId === 'pd-anchor' ? getPdAnchor(option.id) : null;

  return (
    <div
      className={`text-left p-3 rounded border transition-colors ${
        selected
          ? 'bg-blue-900 border-blue-600'
          : 'bg-slate-900 border-slate-700 hover:border-slate-500'
      }`}
    >
      <button onClick={onPick} className="w-full text-left">
        <div className={`font-medium ${selected ? 'text-white' : 'text-slate-300'}`}>
          {option.label}
          {option.customizable && (
            <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-500">
              fill in the blank
            </span>
          )}
        </div>
        {option.description && (
          <div className="text-xs text-slate-400 mt-1">{option.description}</div>
        )}
      </button>
      {anchor && (anchor.sourceUrl || anchor.pdNotice) && (
        <div className="mt-2 pt-2 border-t border-slate-700 text-[11px] text-slate-500 leading-relaxed">
          {anchor.pdNotice && <div>{anchor.pdNotice}</div>}
          {anchor.sourceUrl && (
            <a
              href={anchor.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline decoration-dotted"
              onClick={(e) => e.stopPropagation()}
            >
              read source ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + '%';
}

function Preview({
  loading,
  error,
  skeleton,
  onSave,
  saving,
  saveError,
}: {
  loading: boolean;
  error: string | null;
  skeleton: ModuleSkeleton | null;
  onSave: () => void;
  saving: boolean;
  saveError: string | null;
}) {
  if (loading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-10 text-center">
        <p className="text-slate-300 text-lg">Generating skeleton…</p>
        <p className="text-slate-500 text-sm mt-2">
          Running 3,000 Monte Carlo simulations (1k per archetype). ~50ms.
        </p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-red-950 border border-red-800 rounded-lg p-6">
        <h3 className="text-red-300 font-bold mb-2">Skeleton generation failed</h3>
        <p className="text-red-200 text-sm">{error}</p>
      </div>
    );
  }
  if (!skeleton) return null;

  const { loads, pCompletePerArchetype, courageBaseline } = skeleton;
  const customCount = skeleton.wizardAnswers.filter((a) => a.optionId === 'other').length;

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Preview — {skeleton.name}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Stat label="Rooms" value={skeleton.rooms.length} />
          <Stat label="Quest steps" value={skeleton.questOutline.steps} />
          <Stat label="Quest branches" value={skeleton.questOutline.branches} />
          <Stat label="Henchman slots" value={skeleton.henchmanSlots} />
        </div>

        <div className="bg-slate-900 rounded p-4 mb-4">
          <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-3">
            Computed loads
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Combat" value={loads.combat} />
            <Stat label="Moral" value={loads.moral} />
            <Stat label="Gear" value={loads.gear} />
            <Stat label="Exploration" value={loads.exploration} />
          </div>
        </div>

        <div className="bg-slate-900 rounded p-4 mb-4">
          <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-3">
            P(complete) by archetype — 1,000 Monte Carlo trials each
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <ArchetypeP
              label="Fresh hero"
              p={pCompletePerArchetype.fresh}
              note="PICSSI=0, no gear"
            />
            <ArchetypeP
              label="Mid hero"
              p={pCompletePerArchetype.mid}
              note="PICSSI=30, basic gear, 1 henchman"
            />
            <ArchetypeP
              label="Endgame"
              p={pCompletePerArchetype.endgame}
              note="PICSSI=75, full kit, 2 henchmen"
            />
          </div>
        </div>

        <div className="bg-slate-900 rounded p-4 mb-4">
          <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-3">
            Courage reward baseline (keyed to mid-hero P)
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="On complete" value={courageBaseline.onComplete} signed />
            <Stat label="On heroic death" value={courageBaseline.onHonourableDeath} signed />
            <Stat label="On flee" value={courageBaseline.onFlee} signed />
          </div>
        </div>

        <div className="bg-slate-900 rounded p-4">
          <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-3">
            Intent
          </h3>
          <div className="text-slate-300 text-sm space-y-1">
            <div>
              PD anchor: <span className="text-white">{skeleton.pdAnchor ?? '(original)'}</span>
            </div>
            <div>
              Location: <code className="text-blue-400">{skeleton.locationId}</code>
            </div>
            <div>Zones: {skeleton.travelZones.join(', ') || '(none)'}</div>
            <div>
              Intentionally skewed virtues:{' '}
              <span className="text-yellow-300">
                {skeleton.intentionallySkewed.join(', ')}
              </span>
            </div>
            <div>
              PICSSI targets:{' '}
              {Object.entries(skeleton.picssiTargets)
                .map(([v, m]) => `${v}=${m}`)
                .join(', ') || '(none)'}
            </div>
            <div>
              Scroll seeds — Thoth: {skeleton.scrollSeeds.thoth}, Stobaean:{' '}
              {skeleton.scrollSeeds.stobaean}
            </div>
            <div>
              Free-text answers preserved:{' '}
              <span className="text-amber-300">{customCount}</span>{' '}
              (will seed CF-2 prose generation)
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-3">Room layout</h3>
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
                {r.restAvailable && <span className="text-green-400 text-xs">REST</span>}
              </div>
            );
          })}
        </div>
      </div>

      {saveError && (
        <div className="bg-red-950 border border-red-800 rounded p-4 text-red-300 text-sm">
          {saveError}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded font-bold disabled:opacity-30"
        >
          {saving ? 'Saving…' : 'Save Module →'}
        </button>
      </div>

      <p className="text-slate-500 text-xs italic">
        CF-1 ships the skeleton + free-text capture. CF-2 generates Howard-voice
        prose from those seeds via Claude Opus 4.7. CF-3 the SVG map; CF-4 named
        NPCs; CF-5 art; CF-6 .ink scaffolding; CF-8 GPE validation.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  signed = false,
}: {
  label: string;
  value: number | string;
  signed?: boolean;
}) {
  const display =
    typeof value === 'number' && signed
      ? value > 0
        ? `+${value}`
        : value.toString()
      : value;
  return (
    <div>
      <div className="text-slate-500 text-xs uppercase tracking-wide">{label}</div>
      <div className="text-white text-2xl font-bold mt-1">{display}</div>
    </div>
  );
}

function ArchetypeP({
  label,
  p,
  note,
}: {
  label: string;
  p: number;
  note: string;
}) {
  const color =
    p < 0.2 ? 'text-red-400' : p < 0.6 ? 'text-amber-300' : 'text-green-400';
  return (
    <div>
      <div className="text-slate-500 text-xs uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{pct(p)}</div>
      <div className="text-slate-500 text-xs mt-1">{note}</div>
    </div>
  );
}
