import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Zap, Search } from 'lucide-react';
import {
  estimateOneRm, formatWeight, getExercise, MUSCLE_GROUP_LABELS,
  searchExercises, type MuscleGroup,
} from '@tempra/core';
import { getSettings } from '../../db/db';
import { getExerciseHistory, listRecords, listSessions } from '../../db/repo';
import { PageHeader } from '../../components/ui/PageHeader';
import { Chart, type ChartPoint } from '../../components/Chart';

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });

export default function ProgressPage() {
  const settings = useLiveQuery(() => getSettings(), [], undefined);
  const sessions = useLiveQuery(() => listSessions(60), [], undefined);
  const records = useLiveQuery(() => listRecords(), [], undefined);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const history = useLiveQuery(
    () => (selected ? getExerciseHistory(selected, 20) : Promise.resolve([])),
    [selected],
    [],
  );

  const units = settings?.units ?? 'kg';

  const volumePoints: ChartPoint[] = useMemo(() => {
    if (!sessions) return [];
    return [...sessions]
      .reverse()
      .slice(-14)
      .map((s) => ({ label: shortDate(s.endedAt ?? s.startedAt), value: s.totalVolumeKg }));
  }, [sessions]);

  const e1rmPoints: ChartPoint[] = useMemo(() => {
    if (!history.length) return [];
    return [...history].reverse().map((performance) => {
      const best = performance.sets
        .filter((s) => s.weightKg && s.reps && s.reps >= 1 && s.reps <= 12)
        .reduce((max, s) => Math.max(max, estimateOneRm(s.weightKg!, s.reps!)), 0);
      return {
        label: shortDate(performance.date),
        value: Math.round(best * 10) / 10,
        highlight: performance.sets.some((s) => s.prType),
      };
    }).filter((p) => p.value > 0);
  }, [history]);

  const muscleVolume = useMemo(() => {
    const counts: Partial<Record<MuscleGroup, number>> = {};
    const recent = (sessions ?? []).slice(0, 12);
    for (const session of recent) {
      for (const entry of session.entries) {
        const exercise = getExercise(entry.exerciseId);
        if (!exercise) continue;
        const sets = entry.sets.filter((s) => s.completed && s.kind !== 'warmup').length;
        for (const group of exercise.muscleGroups) counts[group] = (counts[group] ?? 0) + sets;
        for (const group of exercise.secondaryGroups) counts[group] = (counts[group] ?? 0) + sets * 0.5;
      }
    }
    return Object.entries(counts)
      .map(([group, sets]) => ({ group: group as MuscleGroup, sets: Math.round(sets) }))
      .sort((a, b) => b.sets - a.sets);
  }, [sessions]);

  const maxMuscleSets = muscleVolume[0]?.sets ?? 1;
  const searchResults = query.trim() ? searchExercises(query, 8) : [];
  const selectedExercise = selected ? getExercise(selected) : null;

  return (
    <>
      <PageHeader title="Progressi" />

      <div className="stack" style={{ gap: 'calc(var(--spacing) * 6)', paddingBlockStart: 'calc(var(--spacing) * 4)' }}>

        {(!sessions || sessions.length === 0) && (
          <div className="empty-state">
            <p>Qui compaiono i tuoi progressi.</p>
            <p className="tiny">
              Completa il primo allenamento: da li in poi troverai volume, record personali
              e l andamento del massimale stimato su ogni esercizio.
            </p>
          </div>
        )}

        {sessions && sessions.length > 0 && (
          <>
            <section aria-labelledby="volume-title">
              <h2 id="volume-title" className="section-title" style={{ marginBlockEnd: 'calc(var(--spacing) * 3)' }}>
                Volume per allenamento
              </h2>
              <div className="card" style={{ padding: 'calc(var(--spacing) * 4)' }}>
                <Chart
                  title="Volume per allenamento"
                  type="bar"
                  unit="kg"
                  points={volumePoints}
                  summary={`Ultimi ${volumePoints.length} allenamenti. Media ${Math.round(
                    volumePoints.reduce((s, p) => s + p.value, 0) / Math.max(1, volumePoints.length),
                  ).toLocaleString('it-IT')} kg per seduta.`}
                />
              </div>
            </section>

            <section aria-labelledby="muscle-title">
              <h2 id="muscle-title" className="section-title" style={{ marginBlockEnd: 'calc(var(--spacing) * 3)' }}>
                Serie per distretto
              </h2>
              <div className="card" style={{ padding: 'calc(var(--spacing) * 4)' }}>
                <p className="tiny muted" style={{ marginBlockStart: 0 }}>
                  Conteggio degli ultimi 12 allenamenti. Il lavoro indiretto vale mezza serie.
                </p>
                <ul className="muscle-bars">
                  {muscleVolume.map(({ group, sets }) => (
                    <li key={group}>
                      <span className="muscle-bars__label">{MUSCLE_GROUP_LABELS[group]}</span>
                      <span className="muscle-bars__track" aria-hidden="true">
                        <span style={{ inlineSize: `${(sets / maxMuscleSets) * 100}%` }} />
                      </span>
                      <span className="muscle-bars__value num">{sets}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        )}

        <section aria-labelledby="exercise-progress-title">
          <h2 id="exercise-progress-title" className="section-title" style={{ marginBlockEnd: 'calc(var(--spacing) * 3)' }}>
            Andamento di un esercizio
          </h2>
          <div className="search-field">
            <Search size={18} aria-hidden="true" />
            <label className="visually-hidden" htmlFor="progress-search">Cerca l esercizio da analizzare</label>
            <input
              id="progress-search" className="input" type="search" autoComplete="off"
              placeholder="Cerca un esercizio"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {searchResults.length > 0 && (
            <ul className="exercise-list" style={{ marginBlockStart: 'calc(var(--spacing) * 2)' }}>
              {searchResults.map((exercise) => (
                <li key={exercise.id}>
                  <button
                    type="button"
                    className="exercise-item"
                    onClick={() => { setSelected(exercise.id); setQuery(''); }}
                  >
                    <span className="exercise-item__text">
                      <span className="exercise-item__name">{exercise.name}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selectedExercise && (
            <div className="card" style={{ padding: 'calc(var(--spacing) * 4)', marginBlockStart: 'calc(var(--spacing) * 3)' }}>
              <h3 className="section-title">{selectedExercise.name}</h3>
              {e1rmPoints.length === 0 ? (
                <p className="tiny muted">
                  Nessun dato registrato per questo esercizio, oppure le serie erano troppo lunghe
                  per stimare il massimale in modo attendibile.
                </p>
              ) : (
                <Chart
                  title={`Massimale stimato, ${selectedExercise.name}`}
                  unit={units}
                  points={e1rmPoints}
                  summary={`Dal ${e1rmPoints[0]!.label} al ${e1rmPoints[e1rmPoints.length - 1]!.label}: da ${
                    e1rmPoints[0]!.value} a ${e1rmPoints[e1rmPoints.length - 1]!.value} ${units}.`}
                />
              )}
            </div>
          )}
        </section>

        {records && records.length > 0 && (
          <section aria-labelledby="records-title">
            <h2 id="records-title" className="section-title" style={{ marginBlockEnd: 'calc(var(--spacing) * 3)' }}>
              Record personali
            </h2>
            <ul className="exercise-list">
              {records.slice(0, 20).map((record) => (
                <li key={record.id} className="card" style={{ padding: 'calc(var(--spacing) * 3)' }}>
                  <div className="row" style={{ gap: 'calc(var(--spacing) * 3)' }}>
                    <Zap size={18} aria-hidden="true" style={{ color: 'var(--color-pr-text)', flex: 'none' }} />
                    <div style={{ flex: 1, minInlineSize: 0 }}>
                      <p style={{ margin: 0, fontWeight: 'var(--font-weight-semibold)' }}>
                        {getExercise(record.exerciseId)?.name ?? record.exerciseId}
                      </p>
                      <p className="tiny muted num" style={{ margin: 0 }}>
                        {record.type === 'weight' && `Carico massimo ${formatWeight(record.value, units)}`}
                        {record.type === 'reps' && `${record.value} ripetizioni`}
                        {record.type === 'volume' && `Serie da ${Math.round(record.value)} kg di volume`}
                        {record.type === 'e1rm' && `Massimale stimato ${formatWeight(record.value, units)}`}
                        {record.type === 'time' && `${record.value} secondi`}
                        {' - '}
                        {new Date(record.achievedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
