import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Timer, Repeat, Dumbbell, TrendingUp, ShieldAlert } from 'lucide-react';
import {
  CATEGORY_LABELS, EQUIPMENT_LABELS, FORCE_LABELS, LEVEL_LABELS, LOAD_TYPE_LABELS,
  MECHANIC_LABELS, MUSCLE_LABELS, PATTERN_LABELS, formatDuration, formatWeight,
  getExerciseBySlug, estimateOneRm, buildScreening, screenExercise, loadInstructions,
} from '@tempra/core';
import { getProfile, getSettings } from '../../db/db';
import { getExerciseHistory } from '../../db/repo';
import { PageHeader } from '../../components/ui/PageHeader';
import { ExerciseImage } from '../../components/ExerciseImage';

export default function ExercisePage() {
  const { slug } = useParams<{ slug: string }>();
  const exercise = slug ? getExerciseBySlug(slug) : undefined;
  const profile = useLiveQuery(() => getProfile(), [], undefined);
  const settings = useLiveQuery(() => getSettings(), [], undefined);
  const history = useLiveQuery(
    () => (exercise ? getExerciseHistory(exercise.id, 10) : Promise.resolve([])),
    [exercise?.id],
    [],
  );

  const [instructions, setInstructions] = useState<string[]>([]);

  // Le istruzioni vivono in un modulo separato per non pesare sull'avvio:
  // si caricano solo quando si apre davvero la scheda di un esercizio.
  useEffect(() => {
    if (!exercise) return;
    let cancelled = false;
    void loadInstructions(exercise.id).then((steps) => {
      if (!cancelled) setInstructions(steps);
    });
    return () => { cancelled = true; };
  }, [exercise?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const verdict = useMemo(() => {
    if (!exercise || !profile?.conditions.length) return null;
    const result = screenExercise(exercise, buildScreening(profile.conditions));
    return result.blocked || result.warned ? result : null;
  }, [exercise, profile?.conditions]);

  if (!exercise) {
    return (
      <>
        <PageHeader title="Esercizio" back />
        <div className="empty-state"><p>Esercizio non trovato.</p></div>
      </>
    );
  }

  const best = history
    .flatMap((h) => h.sets)
    .filter((s) => s.weightKg && s.reps)
    .reduce<{ e1rm: number; weightKg: number; reps: number } | null>((acc, set) => {
      const e1rm = estimateOneRm(set.weightKg!, set.reps!);
      return !acc || e1rm > acc.e1rm ? { e1rm, weightKg: set.weightKg!, reps: set.reps! } : acc;
    }, null);

  return (
    <>
      <PageHeader title={exercise.name} back />

      <div className="stack" style={{ gap: 'calc(var(--spacing) * 5)', paddingBlockStart: 'calc(var(--spacing) * 4)' }}>
        <ExerciseImage exercise={exercise} animated size="full" className="exercise-hero" />

        {verdict && (
          <div className="callout callout--warn" role="note">
            <ShieldAlert size={20} aria-hidden="true" />
            <div>
              <strong>
                {verdict.blocked
                  ? 'Non lo proponiamo nelle schede generate'
                  : 'Da fare con cautela'}
              </strong>
              <p style={{ margin: '4px 0 0' }}>
                {verdict.reason}{' '}
                {verdict.blocked
                  ? 'Se il tuo medico o fisioterapista ti dice che puoi eseguirlo, puoi sempre aggiungerlo a mano alla tua scheda.'
                  : 'Riduci il carico, controlla il movimento e fermati se senti dolore.'}
              </p>
            </div>
          </div>
        )}

        <section aria-labelledby="facts-title">
          <h2 id="facts-title" className="label-caps" style={{ marginBlockEnd: 'calc(var(--spacing) * 2)' }}>
            Scheda tecnica
          </h2>
          <dl className="summary card" style={{ padding: 'calc(var(--spacing) * 4)' }}>
            <dt>Muscoli principali</dt>
            <dd>{exercise.primaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ') || 'Non specificati'}</dd>
            {exercise.secondaryMuscles.length > 0 && (
              <>
                <dt>Muscoli secondari</dt>
                <dd>{exercise.secondaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ')}</dd>
              </>
            )}
            <dt>Attrezzatura</dt>
            <dd>{exercise.equipment ? EQUIPMENT_LABELS[exercise.equipment] : 'Nessuna'}</dd>
            <dt>Tipo</dt>
            <dd>{CATEGORY_LABELS[exercise.category]}{exercise.mechanic ? `, ${MECHANIC_LABELS[exercise.mechanic]}` : ''}</dd>
            <dt>Movimento</dt>
            <dd>{PATTERN_LABELS[exercise.pattern]}{exercise.force ? `, ${FORCE_LABELS[exercise.force]}` : ''}</dd>
            <dt>Livello</dt>
            <dd>{LEVEL_LABELS[exercise.level]}</dd>
            <dt>Come si misura</dt>
            <dd>{LOAD_TYPE_LABELS[exercise.loadType]}</dd>
            <dt>Pausa consigliata</dt>
            <dd className="num">{formatDuration(exercise.defaultRestSec)}</dd>
          </dl>
        </section>

        {instructions.length > 0 && (
          <section aria-labelledby="how-title">
            <h2 id="how-title" className="label-caps" style={{ marginBlockEnd: 'calc(var(--spacing) * 2)' }}>
              Come si esegue
            </h2>
            <ol className="steps-list">
              {instructions.map((step: string, index: number) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
            {!exercise.translated && (
              <p className="tiny muted" style={{ marginBlockStart: 'calc(var(--spacing) * 2)' }}>
                Istruzioni in lingua originale: la traduzione italiana di questo esercizio non e ancora disponibile.
              </p>
            )}
          </section>
        )}

        {history.length > 0 && (
          <section aria-labelledby="history-title">
            <h2 id="history-title" className="label-caps" style={{ marginBlockEnd: 'calc(var(--spacing) * 2)' }}>
              I tuoi numeri
            </h2>

            {best && (
              <div className="card stat-row" style={{ marginBlockEnd: 'calc(var(--spacing) * 3)' }}>
                <TrendingUp size={20} aria-hidden="true" style={{ color: 'var(--color-brand-text)' }} />
                <div>
                  <p style={{ margin: 0, fontWeight: 'var(--font-weight-semibold)' }} className="num">
                    Massimale stimato {formatWeight(best.e1rm, settings?.units ?? 'kg')}
                  </p>
                  <p className="tiny muted" style={{ margin: 0 }}>
                    calcolato su {formatWeight(best.weightKg, settings?.units ?? 'kg')} per {best.reps} ripetizioni
                    {best.reps > 10 && ', stima poco affidabile oltre le dieci ripetizioni'}
                  </p>
                </div>
              </div>
            )}

            <ul className="history-list">
              {history.map((performance) => (
                <li key={performance.sessionId}>
                  <span className="tiny muted num">
                    {new Date(performance.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </span>
                  <span className="num tiny">
                    {performance.sets.map((set, i) => (
                      <span key={set.id} className="history-set">
                        {i > 0 && ' - '}
                        {set.timeSec
                          ? <><Timer size={11} aria-hidden="true" /> {set.timeSec}s</>
                          : <>
                              {set.weightKg ? <><Dumbbell size={11} aria-hidden="true" /> {set.weightKg}</> : null}
                              {set.weightKg && set.reps ? ' x ' : ''}
                              {set.reps ? <>{set.reps}<Repeat size={11} aria-hidden="true" /></> : null}
                            </>}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
