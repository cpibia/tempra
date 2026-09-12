import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Sparkles, Info, ShieldAlert, RefreshCw } from 'lucide-react';
import {
  buildScreening, generatePlan, getExercise, GOAL_LABELS, MUSCLE_GROUP_LABELS,
  type GenerationResult, type MuscleGroup,
} from '@tempra/core';
import { getProfile } from '../../db/db';
import { savePlan, setActivePlan } from '../../db/repo';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAnnounce } from '../../lib/announce';

const PRIORITY_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'core',
];

export default function GeneratePage() {
  const navigate = useNavigate();
  const announce = useAnnounce();
  const profile = useLiveQuery(() => getProfile(), [], undefined);
  const [priority, setPriority] = useState<MuscleGroup[]>([]);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [seed, setSeed] = useState(() => Date.now());

  const run = (nextSeed = seed) => {
    if (!profile) return;
    const screening = buildScreening(profile.conditions);
    const generated = generatePlan({ profile, priorityGroups: priority, seed: nextSeed }, screening);
    setResult(generated);
    announce(`Proposta pronta: ${generated.plan.days.length} giorni di allenamento.`);
  };

  const accept = async () => {
    if (!result) return;
    await savePlan(result.plan);
    await setActivePlan(result.plan.id);
    navigate(`/schede/${result.plan.id}`, { replace: true });
  };

  if (!profile) {
    return (
      <>
        <PageHeader title="Genera una scheda" back />
        <div className="empty-state">
          <p>Prima serve il tuo profilo: obiettivo, luogo, giorni disponibili.</p>
          <Button onClick={() => navigate('/onboarding')}>Compila il profilo</Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Genera una scheda" back />

      <div className="stack" style={{ gap: 'calc(var(--spacing) * 4)', paddingBlockStart: 'calc(var(--spacing) * 4)' }}>
        <div className="card" style={{ padding: 'calc(var(--spacing) * 4)' }}>
          <span className="label-caps">Costruita su</span>
          <p style={{ marginBlock: 'calc(var(--spacing) * 2) 0' }}>
            {GOAL_LABELS[profile.goal]}, {profile.daysPerWeek} giorni a settimana,
            sedute da {profile.sessionMinutes} minuti.
          </p>
          <a className="tiny" href="/impostazioni" style={{ color: 'var(--color-text-link)' }}>
            Modifica il profilo
          </a>
        </div>

        <fieldset className="fieldset">
          <legend className="field__label">Vuoi dare priorita a qualche distretto?</legend>
          <p className="field__hint">Facoltativo. I gruppi scelti ricevono circa il 20 per cento di volume in piu.</p>
          <div className="chip-wrap">
            {PRIORITY_GROUPS.map((group) => (
              <button
                key={group} type="button" className="chip"
                aria-pressed={priority.includes(group)}
                onClick={() => setPriority((p) => p.includes(group) ? p.filter((g) => g !== group) : [...p, group])}
              >
                {MUSCLE_GROUP_LABELS[group]}
              </button>
            ))}
          </div>
        </fieldset>

        <Button size="lg" block onClick={() => run()}>
          <Sparkles size={20} aria-hidden="true" />
          {result ? 'Rigenera con questi criteri' : 'Crea la proposta'}
        </Button>

        {result && (
          <section aria-labelledby="proposal-title" className="stack" style={{ gap: 'calc(var(--spacing) * 4)' }}>
            <h2 id="proposal-title" className="page-title" style={{ fontSize: 'var(--text-title-lg)' }}>
              {result.plan.name}
            </h2>

            <div className="callout callout--info">
              <Info size={20} aria-hidden="true" />
              <div>
                <strong>Perche questa scheda</strong>
                <ul style={{ margin: '6px 0 0', paddingInlineStart: '1.1em' }}>
                  {result.rationale.map((line, i) => <li key={i}>{line}</li>)}
                </ul>
              </div>
            </div>

            {result.excluded.length > 0 && (
              <details className="card" style={{ padding: 'calc(var(--spacing) * 4)' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'var(--font-weight-semibold)' }}>
                  <ShieldAlert size={16} aria-hidden="true" style={{ verticalAlign: '-3px' }} />
                  {' '}{result.excluded.length} esercizi esclusi per motivi di salute
                </summary>
                <ul className="tiny muted" style={{ marginBlock: 'calc(var(--spacing) * 3) 0', paddingInlineStart: '1.1em' }}>
                  {result.excluded.slice(0, 25).map((item) => (
                    <li key={item.exerciseId}>{item.exerciseName}: {item.reason}</li>
                  ))}
                  {result.excluded.length > 25 && <li>e altri {result.excluded.length - 25}</li>}
                </ul>
              </details>
            )}

            {result.plan.days.map((day) => (
              <div key={day.id} className="card" style={{ padding: 'calc(var(--spacing) * 4)' }}>
                <h3 className="section-title">{day.name}</h3>
                <p className="tiny muted" style={{ marginBlock: '2px calc(var(--spacing) * 3)' }}>
                  {day.items.length} esercizi, circa {day.estimatedMinutes} minuti
                </p>
                <ol className="preview-list">
                  {day.items.map((item) => {
                    const exercise = getExercise(item.exerciseId);
                    const first = item.sets[0];
                    const target = first?.timeSec
                      ? `${first.timeSec} s`
                      : Array.isArray(first?.reps) ? `${first!.reps[0]}-${first!.reps[1]}` : String(first?.reps ?? '');
                    return (
                      <li key={item.id}>
                        <span>{exercise?.name}</span>
                        <span className="tiny muted num">{item.sets.length} x {target}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}

            <div className="row" style={{ gap: 'calc(var(--spacing) * 2)' }}>
              <Button
                block variant="secondary"
                onClick={() => { const next = Date.now(); setSeed(next); run(next); }}
              >
                <RefreshCw size={18} aria-hidden="true" /> Un altra proposta
              </Button>
              <Button block onClick={() => void accept()}>Tieni questa</Button>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
